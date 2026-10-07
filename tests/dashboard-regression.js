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
    { Data: '26/08/2026', 'Medicação': 'Toshi/Shih Tzu (GOTAS NO OUVIDO, 2X AO DIA · NA BOLSA)', 'Hora Medicação': '09:30' },
    { Data: '26/08/2026', 'Troca de Escova': 'Cookie/SRD (NA BOLSA)' },
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

  console.log('Bloco novo -- "Medicacao" (Adriana, 18/set/2026):');
  {
    // O Toshi toma gotas no ouvido e nao havia onde anotar. O app escreve o remedio E
    // o lugar (na bolsa dele ou na recepcao) numa coluna nova chamada "Medicacao" --
    // com cedilha e til na planilha, entao a busca tem de tolerar acento.
    const med = rodarBloco(context, 'medicacao', linhas);
    check('bloco "Medicacao" existe', med !== null);
    check('o remedio do Toshi aparece', !!med && med.length === 1 && /Toshi/.test(med[0].name), JSON.stringify(med));
    check('diz ONDE o remedio esta (na bolsa)', !!med && med.length === 1 && /NA BOLSA/.test(med[0].name), JSON.stringify(med));
    check('o bloco esta na lista de blocos da TV', /id:'medicacao'/.test(html));
  }
  console.log('');

  console.log('Medicacao com HORARIO (Adriana, 19/set/2026 -- "precisa ter horario"):');
  {
    // A hora e o que faz o alarme tocar. Sem ela o remedio aparecia na tela e ninguem
    // era avisado da hora de dar -- ao contrario do Banho e do Veterinario, que ja
    // acendem o alarme cinco minutos antes.
    const med = rodarBloco(context, 'medicacao', linhas);
    check('traz a HORA da coluna "Hora Medicacao"', !!med && med.length === 1 && med[0].time === '09:30', JSON.stringify(med));
    check('a hora nao esta mais fixada em vazio', !/id:'medicacao'[^]*?nameOr\(r,'Medicação'\), time:''/.test(html));
    check('"Medicacao" e fonte de alarme, como Banho e Veterinario',
      /nomeCol:'Medicação',\s*horaCol:'Hora Medicação'/.test(html));

    // Sem a hora a linha continua valendo: a recepcao pode lancar o remedio antes de
    // saber a hora, e o remedio nao pode sumir da TV por causa disso.
    const semHora = rodarBloco(context, 'medicacao', [
      { Data: '26/08/2026', 'Medicação': 'Repolho/Spitz (ANTIBIOTICO · NA RECEPCAO)' },
    ]);
    check('sem hora o remedio continua aparecendo', !!semHora && semHora.length === 1 && /Repolho/.test(semHora[0].name), JSON.stringify(semHora));
    check('sem hora o campo fica vazio (e vai para o fim da fila)', !!semHora && semHora[0].time === '', JSON.stringify(semHora));
  }
  console.log('');

  console.log('Bloco novo -- "Troca de Escova" (Adriana, 21/set/2026):');
  {
    // "a troca da escova tambem". A escova de dentes e prevencao e agora se lanca no
    // dia, como a troca de coleira. Sem hora: o que importa e que foi trocada.
    const esc = rodarBloco(context, 'escova', linhas);
    check('bloco "Troca de Escova" existe', esc !== null);
    check('a escova da Cookie aparece', !!esc && esc.length === 1 && /Cookie/.test(esc[0].name), JSON.stringify(esc));
    check('diz ONDE a escova esta (na bolsa)', !!esc && esc.length === 1 && /NA BOLSA/.test(esc[0].name), JSON.stringify(esc));
    check('nao traz hora (a escova nao tem horario)', !!esc && esc[0].time === '', JSON.stringify(esc));
    check('o bloco esta na lista de blocos da TV', /id:'escova'/.test(html));
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
    // Restricao e vermelha nos dois de proposito (Adriana, 26/ago): o que separa e o
    // MOVIMENTO -- hospede pulsa, auluno anda em faixa zebrada.
    check('hospedes e aulunos tem tratamentos visuais diferentes',
      cor('restricao') !== cor('aulrestr'), cor('restricao') + ' vs ' + cor('aulrestr'));
    check('o auluno usa faixa zebrada animada (nao pulso)', /@keyframes faixaAndando/.test(html));
    check('o pulso continua exclusivo do hospede', /\.block\.alerta[^]*?glowRed/.test(html));
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

  console.log('Todo bloco colorido tem o esqueleto completo do DS:');
  {
    // Faltou isso na primeira tentativa: eu criei so a cor da borda e os dois blocos
    // novos sairam sem cara nenhuma. Todo bloco precisa das quatro regras.
    ['aulrestr', 'festa', 'banho', 'vet', 'adapt'].forEach((cor) => {
      ['block-header', 'block-body', 'block-entry'].forEach((parte) => {
        const re = new RegExp('\\.block\\.' + cor + '\\s+\\.' + parte + '\\s*\\{');
        check(cor + ' tem regra para .' + parte, re.test(html));
      });
    });
    check('o relevo 3D vale para todos os cabecalhos', /\.block-header \{ box-shadow: inset/.test(html));
    check('a festa brilha de longe em longe (nao pisca sem parar)', /@keyframes brilhoFesta/.test(html));
  }
  console.log('');

  console.log('A caixa cheia rola sozinha (01-02/out/2026 — na TV ninguém rola com o dedo):');
  {
    const ctx = createContext();
    // scrollTo de verdade (o navegador usa este caminho, não o scrollTop = 0 do fallback — QA69)
    const caixa = (alto, cabe, visivel) => ({ scrollHeight: alto, clientHeight: cabe, scrollTop: 0, dataset: {}, offsetParent: visivel === false ? null : {},
      scrollTo(o) { this.scrollTop = o.top; this.ultimoScrollTo = o; } });
    const cheia = caixa(500, 220), cabe = caixa(200, 220), escondida = caixa(500, 220, false), tocada = caixa(500, 220);
    ctx.document.querySelectorAll = (sel) => sel === '.block-body' ? [cheia, cabe, escondida] : [];
    const rolar = (t) => vm.runInContext('rolarCaixas(' + t + ')', ctx);
    const T0 = 1000000;
    rolar(T0);
    check('no começo, a cheia espera no topo', cheia.scrollTop === 0 && cheia.dataset.rola === 'topo');
    rolar(T0 + 3999);
    check('antes de 4 s, não anda', cheia.scrollTop === 0 && cheia.dataset.rola === 'topo');
    rolar(T0 + 4000);
    check('com 4 s, começa a descer', cheia.dataset.rola === 'desce');
    let t = T0 + 4000;
    for (let i = 0; i < 100; i++) { t += 50; rolar(t); }
    check('desce 1 px a cada volta (20 px por segundo)', cheia.scrollTop === 100, String(cheia.scrollTop));
    for (let i = 0; i < 400 && cheia.dataset.rola === 'desce'; i++) { t += 50; rolar(t); }
    check('chega ao fim da lista (os nomes de baixo aparecem)', cheia.scrollTop === 280 && cheia.dataset.rola === 'fundo', cheia.scrollTop + ' ' + cheia.dataset.rola);
    rolar(t + 2999);
    check('espera 3 s no fim', cheia.scrollTop === 280);
    rolar(t + 3000);
    check('e volta ao topo', cheia.scrollTop === 0 && cheia.dataset.rola === 'topo');
    check('a volta ao topo é pelo scrollTo, suave, até o 0', !!cheia.ultimoScrollTo && cheia.ultimoScrollTo.top === 0 && cheia.ultimoScrollTo.behavior === 'smooth',
      JSON.stringify(cheia.ultimoScrollTo));
    check('a caixa que cabe inteira fica parada', cabe.scrollTop === 0 && !cabe.dataset.rola);
    check('a caixa escondida (outra aba) não é mexida', escondida.scrollTop === 0 && !escondida.dataset.rola);
    // quem tocou na caixa (celular, computador) tem 10 s de sossego
    ctx.document.querySelectorAll = () => [tocada];
    tocada.dataset.toque = String(T0);
    rolar(T0); rolar(T0 + 9999);
    check('quem tocou tem 10 s de sossego', tocada.scrollTop === 0 && !tocada.dataset.rola);
    rolar(T0 + 10000);
    check('passados 10 s do toque, ela volta a andar', tocada.dataset.rola === 'topo');
    // a caixa que estava rolada e passou a caber (o nome saiu da planilha) volta ao topo
    const encolheu = caixa(500, 220); encolheu.scrollTop = 120; encolheu.dataset.rola = 'desce'; encolheu.dataset.rolaDesde = String(T0);
    ctx.document.querySelectorAll = () => [encolheu];
    encolheu.scrollHeight = 210; rolar(T0 + 50);
    check('caixa que passou a caber volta ao topo e para', encolheu.scrollTop === 0 && !encolheu.dataset.rola);
    // o toque marca a caixa certa
    const alvo = caixa(500, 220);
    vm.runInContext('marcarToqueCaixa', ctx)({ target: { closest: (sel) => sel === '.block-body' ? alvo : null } });
    check('tocar numa caixa marca a pausa dela', !!alvo.dataset.toque);
    const alvoTexto = caixa(500, 220);
    vm.runInContext('marcarToqueCaixa', ctx)({ target: { nodeType: 3, parentElement: { closest: (sel) => sel === '.block-body' ? alvoTexto : null } } });
    check('o toque que chega num pedaço de texto também pausa a caixa', !!alvoTexto.dataset.toque);

    // QA69: pouca sobra também rola (3 px e 39 px: um nome cortado pela metade)
    const s3 = caixa(223, 220), s39 = caixa(259, 220);
    ctx.document.querySelectorAll = () => [s3, s39];
    rolar(T0); rolar(T0 + 4000);
    check('sobra de 3 px e de 39 px também rola', s3.dataset.rola === 'desce' && s39.dataset.rola === 'desce', s3.dataset.rola + ' ' + s39.dataset.rola);
    for (let i = 1; i <= 60; i++) rolar(T0 + 4000 + i * 50);
    check('e as duas chegam ao fim', s3.dataset.rola === 'fundo' && s3.scrollTop === 3 && s39.dataset.rola === 'fundo' && s39.scrollTop === 39, s3.scrollTop + ' ' + s39.scrollTop);

    // QA69: a velocidade é do relógio — TV lenta (uma volta a cada 400 ms) desce os mesmos 20 px/s
    const lenta = caixa(500, 220);
    ctx.document.querySelectorAll = () => [lenta];
    rolar(T0); rolar(T0 + 4000);
    for (let i = 1; i <= 10; i++) rolar(T0 + 4000 + i * 400);
    check('TV lenta: em 4 s desce 80 px (20 por segundo), não 10', Math.abs(lenta.scrollTop - 80) < 0.001, String(lenta.scrollTop));
    // aba que dormiu 60 s: no máximo 1 s de caminho (20 px), sem salto
    rolar(T0 + 4000 + 4000 + 60000);
    check('depois de 60 s parada, anda no máximo 20 px de uma vez', Math.abs(lenta.scrollTop - 100) < 0.001, String(lenta.scrollTop));
    // alguém rolou com a mão no meio da descida: ela segue dali, não volta
    lenta.scrollTop = 200; rolar(T0 + 4000 + 4000 + 60000 + 50);
    check('rolou com a mão: segue de onde a mão deixou', Math.abs(lenta.scrollTop - 201) < 0.001, String(lenta.scrollTop));
    // a hora da TV voltou 10 minutos (acerto do relógio) no meio da descida: a caixa não salta para trás
    const antesVolta = lenta.scrollTop;
    rolar(T0 + 4000 + 4000 + 60000 + 50 - 600000);
    check('a hora da TV voltando para trás não faz a caixa subir', lenta.scrollTop >= antesVolta, antesVolta + ' -> ' + lenta.scrollTop);

    // QA69: com zoom, o navegador arredonda o scrollTop (aqui, de 1/3 em 1/3 px, e o máximo é
    // sobra − 0,33). A caixa tem de chegar ao fim, sem travar.
    const zoom = { scrollHeight: 333, clientHeight: 220, dataset: {}, offsetParent: {}, _st: 0,
      get scrollTop() { return this._st; },
      set scrollTop(v) { this._st = Math.min(Math.round(v * 3) / 3, 113 - 0.33); },
      scrollTo(o) { this.scrollTop = o.top; } };
    const zoomFino = { scrollHeight: 333, clientHeight: 220, dataset: {}, offsetParent: {}, _st: 0,   // zoom 0,3: de 3,33 em 3,33 px
      get scrollTop() { return this._st; },
      set scrollTop(v) { this._st = Math.min(Math.floor(v / 3.333) * 3.333, 113); },
      scrollTo(o) { this.scrollTop = o.top; } };
    ctx.document.querySelectorAll = () => [zoom, zoomFino];
    rolar(T0); rolar(T0 + 4000);
    for (let i = 1; i <= 200 && (zoom.dataset.rola !== 'fundo' || zoomFino.dataset.rola !== 'fundo'); i++) rolar(T0 + 4000 + i * 50);
    check('com zoom (scrollTop arredondado), a caixa chega ao fim', zoom.dataset.rola === 'fundo' && zoomFino.dataset.rola === 'fundo',
      zoom.dataset.rola + ' ' + zoom.scrollTop + ' / ' + zoomFino.dataset.rola + ' ' + zoomFino.scrollTop);

    // QA69: o init de verdade liga o relógio e os três ouvintes (não basta o texto da fonte)
    const ctxInit = createContext();
    const relogios = [], ouvintes = [];
    ctxInit.setInterval = (fn, ms) => { relogios.push({ fn, ms }); return relogios.length; };
    ctxInit.document.addEventListener = (tipo, fn, op) => ouvintes.push({ tipo, fn, op });
    vm.runInContext('setFraseDia=function(){}; syncInternetTime=function(){}; updateClock=function(){}; updateDateLabel=function(){}; switchTab=function(){}; loadData=function(){};', ctxInit);
    vm.runInContext('init()', ctxInit);
    const rc = vm.runInContext('rolarCaixas', ctxInit), mt = vm.runInContext('marcarToqueCaixa', ctxInit);
    check('o init liga o relógio da rolagem a cada 50 ms', relogios.some((r) => r.fn === rc && r.ms === 50), JSON.stringify(relogios.map((r) => r.ms)));
    check('e ouve roda do mouse, toque e clique, sem travar a rolagem da página (passive)',
      ['wheel', 'touchstart', 'pointerdown'].every((t) => ouvintes.some((o) => o.tipo === t && o.fn === mt && o.op && o.op.passive === true)),
      JSON.stringify(ouvintes.map((o) => o.tipo)));
    check('20 px por segundo, com uma volta a cada 50 ms',
      vm.runInContext('ROLA.pxPorSegundo', ctx) === 20 && vm.runInContext('ROLA.intervaloMs', ctx) === 50);
    check('a caixa continua com altura fixa (a TV não cresce para fora da tela)', /\.block-body  \{ padding:6px 12px; display:flex; flex-direction:column; overflow-y:auto; max-height:220px; \}/.test(html));
    const celular = (html.match(/@media \(max-width: 600px\) \{([\s\S]*?)\n    \}/) || [])[1] || '';
    check('no celular, a caixa tem 200 px (dentro do @media de 600 px)', /\.block-body  \{ max-height: 200px; \}/.test(celular));
  }
  console.log('');

  console.log('== Resultado: ' + pass + ' ok, ' + fail + ' falha(s) ==');
  if (fail) { console.log('\nFalhas:'); fails.forEach((f) => console.log('  - ' + f)); }
  process.exit(fail ? 1 : 0);
}

run();
