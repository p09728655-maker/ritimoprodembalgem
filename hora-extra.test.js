// Teste da separação HORA NORMAL × HORA EXTRA.
//   node hora-extra.test.js
//
// Por que ele existe: a hora extra é reconhecida pelo RÓTULO da linha na aba
// HORA_A_HORA ("HE 17:00-18:00"). Esse contrato é frágil de três jeitos:
//   1. o prefixo precisa entrar na gravação (addHE) — sem ele, a linha vira
//      indistinguível de uma hora de turno e a contagem de HE fecha em 0;
//   2. o prefixo precisa SAIR antes do parse do horário — senão o início vira
//      "HE 17:00" e o filtro de turno (célula C3) come a linha;
//   3. os slots 05:00/06:00 do turno estendido NÃO são hora extra — são horas
//      de turno liberadas pelo C3.
// Este teste roda contra o código REAL do ritmoprod_appscript.gs (as funções
// são extraídas do arquivo e avaliadas com stubs do ambiente Apps Script), então
// ele quebra se alguém mexer no critério sem querer.

const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');

// Extrai uma função inteira do .gs pelo início da assinatura.
function pega(assinatura) {
  const i = src.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei no .gs: ' + assinatura);
  const j = src.indexOf('\n}\n', i);
  return src.slice(i, j + 2);
}

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

// ── stubs mínimos do ambiente Apps Script ──────────────────────────────────
const TZ = 'America/Sao_Paulo';
const SHEET_DADOS = 'HORA_A_HORA';
const PROP_PROD_ATUAL = 'prodAtual';
function verificarNovoDia() {}
const Logger = { log() {} };
const PropertiesService = { getScriptProperties: () => ({ getProperty: () => '' }) };
const Utilities = {
  formatDate(d, tz, f) {
    const p = n => String(n).padStart(2, '0');
    if (f === 'dd/MM/yyyy') return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
    if (f === 'H') return String(d.getHours());
    if (f === 'm') return String(d.getMinutes());
    return d.toISOString();
  }
};

// Planilha simulada no formato da HORA_A_HORA: as linhas de 05:00 e 06:00
// existem SEMPRE; quem decide se elas aparecem é o C3.
function planilha(c3) {
  return [
    ['RITMOPROD', '', ''],
    ['', ''],
    ['META DIA', 1800, c3],                 // linha 3: B3 = meta do dia, C3 = início do turno
    ['HORA', 'META', 'REALIZADO', 'LOTE 1'],// linha 4: cabeçalho
    ['05:00-06:00', 150, '', 120],
    ['06:00-07:00', 150, '', 130],
    ['07:00-08:00', 210, '', 205],
    ['16:00-17:00', 210, '', 175],
    ['HE 17:00-18:00', 200, '', 190],
    ['TOTAL', '', '', ''],
  ];
}
let LINHAS = planilha(7);
const SpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getName: () => 'teste',
    getSheetByName: () => ({
      getLastRow: () => LINHAS.length,
      getLastColumn: () => 4,
      getRange: () => ({ getValues: () => LINHAS })
    })
  })
};

eval(pega('function _ehHoraExtra('));
eval(pega('function _semPrefixoHE('));
eval(pega('function _heCxDoDia('));
eval(pega('function getDados()'));

// _heCxDoDia lê a HISTORICO_HORA por este helper — aqui ele é controlado.
let SOMAS = {};
function _somaHorasArquivadas() { return SOMAS; }

console.log('\n── rótulo de hora extra ──');
ok('"HE 17:00-18:00" é hora extra', _ehHoraExtra('HE 17:00-18:00'), true);
ok('"HE17:00-18:00" (sem espaço) é hora extra', _ehHoraExtra('HE17:00-18:00'), true);
ok('minúscula também', _ehHoraExtra('he 17:00-18:00'), true);
ok('hora de turno não é hora extra', _ehHoraExtra('07:00-08:00'), false);
ok('05:00-06:00 (turno estendido) não é hora extra', _ehHoraExtra('05:00-06:00'), false);
ok('o prefixo sai do rótulo', _semPrefixoHE('HE 17:00-18:00'), '17:00-18:00');
ok('rótulo de turno passa intacto', _semPrefixoHE('12:12-13:00'), '12:12-13:00');

console.log('\n── getDados: slots e marcação ──');
let r = getDados();
ok('C3=7 esconde 05:00/06:00', r.slots.map(s => s.label),
   ['07:00-08:00', '16:00-17:00', 'HE 17:00-18:00']);
ok('só a linha HE vem marcada', r.slots.map(s => s.he), [false, false, true]);
ok('horário da HE é lido sem o prefixo',
   (s => s.inicio + '-' + s.fim)(r.slots.find(s => s.he)), '17:00-18:00');
ok('produção da HE vem do lote', r.slots.find(s => s.he).producaoHora, 190);

LINHAS = planilha(5); r = getDados();
ok('C3=5 mostra 05:00/06:00', r.slots.map(s => s.label),
   ['05:00-06:00', '06:00-07:00', '07:00-08:00', '16:00-17:00', 'HE 17:00-18:00']);
ok('05:00/06:00 continuam NÃO sendo hora extra',
   r.slots.filter(s => s.he).map(s => s.label), ['HE 17:00-18:00']);
ok('turnoInicio acompanha o C3', r.turnoInicio, '05:00');

LINHAS = planilha(7); LINHAS.splice(8, 0, ['HE 04:00-05:00', 100, '', 90]); r = getDados();
ok('HE antes do turno não é filtrada pelo C3',
   r.slots.filter(s => s.he).map(s => s.label), ['HE 04:00-05:00', 'HE 17:00-18:00']);

console.log('\n── caixas em hora extra no histórico (_heCxDoDia) ──');
SOMAS = { '20/07/2026': 1500 };
ok('coluna HE CX preenchida manda', _heCxDoDia('20/07/2026', 1800, 2, 320), 320);
ok('coluna zerada é zero — não deriva', _heCxDoDia('20/07/2026', 1800, 2, 0), 0);
ok('dia sem hora extra = 0 (sem ler a HISTORICO_HORA)', _heCxDoDia('20/07/2026', 1500, 0, ''), 0);
ok('dia antigo: deriva REALIZADO - horas de turno arquivadas',
   _heCxDoDia('20/07/2026', 1800, 2, ''), 300);
ok('dia fora da HISTORICO_HORA fica indeterminado (null), não zero',
   _heCxDoDia('01/01/2020', 1800, 2, ''), null);
SOMAS = { '21/07/2026': 2000 };
ok('soma maior que o realizado não vira número negativo',
   _heCxDoDia('21/07/2026', 1800, 1, ''), 0);

console.log('\n── a marcação precisa chegar aos painéis ──');
['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'].forEach(f => {
  const html = fs.readFileSync(path.join(__dirname, f), 'utf8');
  ok(f + ' propaga o he do backend para DADOS', /he:\s*s\.he===true/.test(html), true);
  ok(f + ' separa realHE/realNormal nos KPIs', /realHE/.test(html) && /realNormal/.test(html), true);
});

console.log(falhas === 0
  ? '\n✅ hora extra ok — a marca é o rótulo "HE", e só ela\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
