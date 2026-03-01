const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);

if (!scriptMatch) {
  throw new Error('Nao foi possivel localizar o <script> principal em index.html');
}

const source = scriptMatch[1].replace(/\binit\(\);\s*$/, '');

function createStorage() {
  const store = Object.create(null);
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      Object.keys(store).forEach(key => delete store[key]);
    },
  };
}

function createFakeElement() {
  return {
    textContent: '',
    title: '',
    innerHTML: '',
    style: {},
    disabled: false,
    className: '',
    classList: {
      toggle() {},
      add() {},
      remove() {},
    },
  };
}

function createContext() {
  const context = {
    console,
    Date,
    Math,
    JSON,
    Intl,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Promise,
    Map,
    Set,
    fetch: async () => ({
      ok: true,
      json: async () => ({ unixtime: Math.floor(Date.now() / 1000) }),
    }),
    setTimeout: () => 1,
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    localStorage: createStorage(),
    sessionStorage: createStorage(),
    confirm: () => true,
    alert: () => {},
    AudioContext: function AudioContext() {},
    webkitAudioContext: function WebkitAudioContext() {},
    window: {},
    document: {
      head: { appendChild() {} },
      createElement() {
        return {
          parentNode: null,
          remove() {},
          set src(value) { this._src = value; },
          get src() { return this._src; },
        };
      },
      getElementById() {
        return createFakeElement();
      },
      querySelector() {
        return null;
      },
    },
  };

  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

function setSelectedDate(context, year, month, day) {
  vm.runInContext(`selectedDate = new Date(${year}, ${month}, ${day});`, context);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const context = createContext();

  const febRows = [
    { Data: '15/02/2026', Aulunos: 'Thor', Banho: 'Thor', 'Hora Banho': '10:30', 'Cliente Novo': '1', Outros: 'Obs fevereiro' },
    { Data: '15/02/2026', Aulunos: 'Luna', Avaliacao: '1', Horario: '13:00', Passeio: '1', 'Hora Passeio': '15:00' },
    { Data: '16/02/2026', Aulunos: 'Mel', Vermifugo: '1' },
  ];

  const marRows = [
    { Data: '15-03-2026 00:00', Alunos: 'Kako', 'Peludinho que saira cedo': 'Kako', 'Hora Saida Cedo': '08h15', Aniversariante: 'Kako', Observacoes: 'Texto livre' },
    { Data: '15/03/26', Nome: 'Nina', 'Hospedes com Restricao': 'banana', 'Hidratacao de Patinha e Focinho': '1', 'Horario Banho': '11:05', Banho: 'Nina' },
    { Data: '15/03/2026', Nome: 'Pipoca', 'Consulta Veterinario': 'Pipoca', 'Hora Vet': '14:10', 'Novo Cliente': '1', 'Obs 2': 'segundo texto' },
  ];

  const legacyRows = [
    { Nomes: 'Batata', Data: '15/05/2026', Avulso: '1', 'Hora Banho': '13;30', Aulunos: '1' },
    { 'para te da': 'Belinha', Data: '15/05/2026', 'Cliente Novo': '1', Aulunos: '1' },
    { '45030.0': 'Adam Poodle', Data: '15/05/2026', Avulso: '1', Aulunos: '1' },
  ];

  setSelectedDate(context, 2026, 1, 15);
  const febSelected = context.rowsForSelectedDate(febRows);
  const febBlocks = context.getRenderableBlocks(febSelected);
  const passeioBlock = febBlocks.find(block => block.title === 'Passeio');
  assert(passeioBlock, 'Coluna dinamica "Passeio" nao foi criada');
  const passeioEntry = passeioBlock.fn(febSelected)[0];
  assert(passeioEntry && passeioEntry.name === 'Luna', 'Fallback do nome em "Passeio" falhou');
  assert(passeioEntry.time === '15:00', 'Horario dinamico de "Passeio" nao foi reconhecido');

  const clienteNovoBlock = febBlocks.find(block => block.id === 'novo');
  assert(clienteNovoBlock, 'Bloco "Cliente Novo" nao foi encontrado');
  assert(clienteNovoBlock.fn(febSelected)[0].name === 'Thor', 'Flag "Cliente Novo" nao caiu no nome principal do peludinho');

  setSelectedDate(context, 2026, 2, 15);
  const marSelected = context.rowsForSelectedDate(marRows);
  const marBlocks = context.getRenderableBlocks(marSelected);

  const saidaBlock = marBlocks.find(block => block.id === 'saindo');
  assert(saidaBlock && saidaBlock.fn(marSelected)[0].time === '08h15', 'Alias de "Saida cedo" falhou');

  const restricaoBlock = marBlocks.find(block => block.id === 'restricao');
  assert(restricaoBlock && restricaoBlock.fn(marSelected)[0].name === 'banana', 'Alias de "Restricoes" falhou');

  const vetBlock = marBlocks.find(block => block.id === 'vet');
  assert(vetBlock && vetBlock.fn(marSelected)[0].time === '14:10', 'Alias de "Veterinario" falhou');

  const hidratBlock = marBlocks.find(block => block.id === 'hidrat');
  assert(hidratBlock && hidratBlock.fn(marSelected)[0].name === 'Nina', 'Fallback do nome em "Hidratacao" falhou');

  const aniverBlock = marBlocks.find(block => block.id === 'aniver');
  assert(aniverBlock && aniverBlock.fn(marSelected)[0].name === 'Kako', 'Alias de "Aniversariante" falhou');

  const outros2Block = marBlocks.find(block => block.id === 'outros2');
  assert(outros2Block && outros2Block.fn(marSelected)[0].name === 'segundo texto', 'Alias de "Obs 2" falhou');

  setSelectedDate(context, 2026, 4, 15);
  const legacySelected = context.rowsForSelectedDate(legacyRows);
  const legacyBlocks = context.getRenderableBlocks(legacySelected);
  assert(!legacyBlocks.some(block => block.title === 'Nomes' || block.title === 'para te da' || block.title === '45030.0'), 'Coluna-base de nome nao deve virar bloco dinamico');

  const legacyAvulso = legacyBlocks.find(block => block.id === 'avulso');
  assert(legacyAvulso && legacyAvulso.fn(legacySelected)[0].name === 'Batata', 'Fallback do nome pelo campo anterior a Data falhou');
  assert(context.parseHora('13;30').min === 30, 'Parse de horario com ponto e virgula falhou');

  const legacyNovo = legacyBlocks.find(block => block.id === 'novo');
  assert(legacyNovo && legacyNovo.fn(legacySelected)[0].name === 'Belinha', 'Fallback do nome pelo cabecalho quebrado falhou');

  assert(legacyAvulso && legacyAvulso.fn(legacySelected)[1].name === 'Adam Poodle', 'Fallback do nome pelo cabecalho numerico falhou');

  assert(context.normalizeDateValue('15/03/26') === '15/03/2026', 'Normalizacao de data com ano curto falhou');
  assert(context.normalizeDateValue('15-03-2026 00:00') === '15/03/2026', 'Normalizacao de data com horario falhou');

  const candidates = context.monthSheetCandidates(2024, 0);
  assert(candidates.includes(' 2024 DayCare Janeiro'), 'Fallback com espaco inicial no nome da aba falhou');
  assert(candidates.includes('DayCare Janeiro'), 'Fallback para aba sem ano falhou');
  assert(context.monthSheetCandidates(2026, 2).includes('2026 DayCare Março'), 'Fallback principal da aba do mes falhou');

  console.log('Dashboard regression tests: OK');
}

run();
