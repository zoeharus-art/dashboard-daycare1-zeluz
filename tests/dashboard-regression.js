/*
 * Rede de seguranca do dashboard da TV (Day Care).
 *
 * Carrega o <script> REAL do index.html num sandbox e roda as funcoes de verdade
 * contra linhas escritas como a planilha escreve -- com os erros de digitacao que ela
 * tem ("Aulunos com restricoes" com o acento errado, "Festa na Zeluz - Auniversario)")
 * e com os acentos que ja quebraram bloco ("Hora Saida Cedo").
 *
 * Uso:  node tests/dashboard-regression.js
 * Sai 0 se tudo passa, 1 se algo falha.
 *
 * NOTA: a versao anterior deste arquivo testava rowsForSelectedDate/getRenderableBlocks,
 * que sairam do index.html no commit "Restaura original + corrige bug de marco" -- o
 * teste ficou quebrado desde entao. Este cobre o codigo que existe hoje.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);
if (!scriptMatch) throw new Error('Nao foi possivel localizar o <script> principal em index.html');
const source = scriptMatch[1].replace(/\binit\(\);\s*$/, '');

let pass = 0, fail = 0;
const fails = [];
function check(nome, cond, detalhe) {
  if (cond) { pass++; console.log('  ok   ' + nome); }
  else { fail++; fails.push(nome + (detalhe ? ' -- ' + detalhe : '')); console.log('  FALHA ' + nome + (detalhe ? ' -- ' + detalhe : '')); }
}

function createContext() {
  const noop = () => {};
  const elemento = {
    textContent: '', innerHTML: '', style: {},
    classList: { add: noop, remove: noop, toggle: noop },
    appendChild: noop, addEventListener: noop,
  };
  const context = {
    console,
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
    document: {
      getElementById: () => elemento,
      querySelector: () => elemento,
      querySelectorAll: () => [],
      createElement: () => elemento,
      head: { appendChild: noop },
      body: elemento,
      addEventListener: noop,
    },
    setInterval: () => 0,
    setTimeout: () => 0,
    clearInterval: noop,
    fetch: () => Promise.reject(new Error('sem rede no teste')),
    navigator: {},
    location: { href: '' },
    Intl, Date, JSON, Math, String, Number, Object, Array, RegExp, Promise,
    isNaN, parseInt, parseFloat,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

// BLOCKS e `const`: so da para alcancar rodando outra expressao no MESMO contexto.
function rodarBloco(context, id, linhas) {
  context.__linhas = linhas;
  const saida = vm.runInContext(
    'JSON.stringify((function(){var b=BLOCKS.find(function(x){return x.id===' + JSON.stringify(id) + '});' +
    'if(!b) return null; return b.fn(__linhas);})())', context);
  return JSON.parse(saida);
}

function run() {
  console.log('== Dashboard da TV -- rede de seguranca ==\n');
  const context = createContext();

  // Linhas como a planilha do Day Care realmente escreve.
  const linhas = [
    { Data: '26/08/2026', 'Festa na Zêluz - Auniversário)': 'Valentina - SRD' },
    { Data: '26/08/2026', 'Aulunos com restriçóes': 'Toshi/Shiba Inu - Bolo' },
    { Data: '26/08/2026', 'Peludinho que sairá cedo': 'Kako - Lhasa', 'Hora Saída Cedo': '15:00' },
    { Data: '26/08/2026', Banho: 'Hannah Clara Of Zoe Harus/West Terrier', 'Hora Banho': '10:00' },
    { Data: '26/08/2026', 'Hóspedes com Restrições': 'Ragnar - Restrição a Tudo' },
  ];

  console.log('Blocos que faltavam (Adriana, 25/ago/2026):');
  {
    const festa = rodarBloco(context, 'festa', linhas);
    check('bloco "Festa na Zeluz" existe', festa !== null);
    check('a festa da Valentina aparece', !!festa && festa.length === 1 && /Valentina/.test(festa[0].name), JSON.stringify(festa));

    const aul = rodarBloco(context, 'aulrestr', linhas);
    check('bloco "Aulunos com Restricoes" existe', aul !== null);
    check('acha a coluna apesar do erro de digitacao da planilha', !!aul && aul.length === 1 && /Toshi/.test(aul[0].name), JSON.stringify(aul));
  }
  console.log('');

  console.log('Bloco que nunca funcionou -- "Peludinho que Saira Cedo":');
  {
    // Procurava a coluna com includes('saida') SEM tirar o acento, e a planilha escreve
    // "Hora Saida Cedo" com acento. Nunca achava: bloco vazio e alarme mudo.
    const sai = rodarBloco(context, 'saindo', linhas);
    check('acha o nome mesmo com acento na coluna', !!sai && sai.length === 1 && /Kako/.test(sai[0].name), JSON.stringify(sai));
    check('traz a HORA (e ela que faz o alarme tocar)', !!sai && sai[0].time === '15:00', JSON.stringify(sai));
    check('o codigo tira o acento antes de procurar', /_strip\(k\)\.toLowerCase\(\)\.includes\('saida'\)/.test(html));
  }
  console.log('');

  console.log('O que o app lanca chega na TV:');
  {
    const banho = rodarBloco(context, 'banho', linhas);
    check('banho lancado pelo app aparece', !!banho && banho.length === 1 && /Hannah Clara/.test(banho[0].name), JSON.stringify(banho));
    check('com o horario junto', !!banho && banho[0].time === '10:00', JSON.stringify(banho));
    const rest = rodarBloco(context, 'restricao', linhas);
    check('hospede com restricao continua funcionando', !!rest && rest.length === 1 && /Ragnar/.test(rest[0].name), JSON.stringify(rest));
  }
  console.log('');

  console.log('A TV precisa RELER a planilha (o banho da Hannah que nao apareceu):');
  {
    // O relogio de 2 minutos chamava loadData(), mas a primeira linha era
    //   if(mem[key] && mem[key].length){ anyOk=true; continue; }
    // -- o mes ja estava na memoria e ele saia sem buscar nada. A TV lia a planilha
    // UMA vez, quando a pagina abria, e ficava com aquilo o resto do dia.
    check('o mes que esta na tela nao e pulado pela memoria',
      /if\(key!==keyAtual && mem\[key\] && mem\[key\]\.length\)/.test(html));
    check('existe a nocao de "mes da tela" (keyAtual)', /const keyAtual=`\$\{y\}-\$\{m\}`/.test(html));
    check('o relogio de recarga continua em 2 minutos', /const REFRESH_OK\s*=\s*120;/.test(html));
  }
  console.log('');

  console.log('Cada bloco com a sua cara (Adriana, 26/ago -- "ninguem ira guardar"):');
  {
    const cor = (id) => {
      const m = html.match(new RegExp("id:'" + id + "'[^}]*?color:'([a-z]+)'"));
      return m ? m[1] : null;
    };
    const icone = (id) => {
      const m = html.match(new RegExp("id:'" + id + "'[^}]*?icon:'([^']+)'"));
      return m ? m[1] : null;
    };
    check('hospedes e aulunos com restricao tem CORES diferentes',
      cor('restricao') !== cor('aulrestr'), cor('restricao') + ' vs ' + cor('aulrestr'));
    check('hospedes e aulunos com restricao tem ICONES diferentes',
      icone('restricao') !== icone('aulrestr'), icone('restricao') + ' vs ' + icone('aulrestr'));
    check('aniversariante e festa tem cores diferentes',
      cor('aniver') !== cor('festa'), cor('aniver') + ' vs ' + cor('festa'));
    // toda cor usada precisa existir no CSS, senao o bloco fica sem a faixa colorida
    const usadas = [...html.matchAll(/color:'([a-z]+)'/g)].map(m => m[1]);
    const semClasse = [...new Set(usadas)].filter(c => c !== 'futuro' && !new RegExp('\\.geral-card\\.' + c + '\\s*\\{').test(html));
    check('toda cor de bloco existe no CSS', semClasse.length === 0, semClasse.join(', '));
    // ordem pedida: hospedes -> aulunos -> festa -> banho
    const ordem = [...html.matchAll(/id:'([a-z0-9]+)',\s*title:/g)].map(m => m[1]);
    const pos = (id) => ordem.indexOf(id);
    check('a ordem e hospedes -> aulunos -> festa -> banho',
      pos('restricao') < pos('aulrestr') && pos('aulrestr') < pos('festa') && pos('festa') < pos('banho'),
      ordem.slice(0, 5).join(' > '));
    check('nenhum bloco aparece duas vezes', new Set(ordem).size === ordem.length, ordem.join(','));
  }
  console.log('');

  console.log('== Resultado: ' + pass + ' ok, ' + fail + ' falha(s) ==');
  if (fail) { console.log('\nFalhas:'); fails.forEach((f) => console.log('  - ' + f)); }
  process.exit(fail ? 1 : 0);
}

run();
