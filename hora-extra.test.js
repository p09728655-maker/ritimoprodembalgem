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
// a janela da jornada + o critério de contagem, ambos do código real
// A janela vem do código real, virando GLOBAL: `const` dentro de eval fica
// preso ao escopo do eval e a função extraída não enxergaria.
src.match(/const HE_JORNADA_(?:INI|FIM)_MIN\s*=\s*[^;]+;/g)
   .forEach(l => eval(l.replace('const ', 'global.')));
eval(pega('function _ehHoraExtraCaixas('));
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
// REGRA DO PPCP (31/08/2026): "05:00 as 06:00, 06:00 as 07:00 sempre é hora
// extra, e após 17:00". A jornada normal é 07:00-17:00 (com o almoço dentro
// dela); tudo fora conta como hora extra, TENHA OU NÃO o rótulo "HE ".
// Antes o fechamento só olhava o rótulo: a madrugada nunca é rotulada, então a
// HE CX do HISTORICO fechou em ZERO por 69 dias seguidos enquanto a produção
// das 05:00-07:00 era hora extra de verdade (conferido na planilha real:
// 26/08 tinha 167+240=407 cx de madrugada e a coluna gravou 0).
ok('05:00/06:00 CONTAM como hora extra nas caixas',
   r.slots.filter(s => s.he).map(s => s.label),
   ['05:00-06:00', '06:00-07:00', 'HE 17:00-18:00']);
ok('turnoInicio acompanha o C3', r.turnoInicio, '05:00');

LINHAS = planilha(7); LINHAS.splice(8, 0, ['HE 04:00-05:00', 100, '', 90]); r = getDados();
ok('HE antes do turno não é filtrada pelo C3',
   r.slots.filter(s => s.he).map(s => s.label), ['HE 04:00-05:00', 'HE 17:00-18:00']);

console.log('\n── identidade da linha × contagem das caixas ──');
// Os dois critérios NÃO são o mesmo, e trocá-los quebra duas coisas:
//   _ehHoraExtra       = o rótulo. Governa a LIMPEZA DIÁRIA (que APAGA a linha)
//                        e o filtro do início de turno da célula C3.
//   _ehHoraExtraCaixas = o horário. Governa quantas caixas viram HE CX.
// Alargar o primeiro faria a limpeza deletar as linhas de 05:00 e 06:00 — que
// existem sempre — e faria elas aparecerem no app mesmo com C3=7.
ok('a linha de madrugada NÃO tem identidade de HE (senão a limpeza a apaga)',
   _ehHoraExtra('05:00-06:00'), false);
ok('mas as caixas dela contam como hora extra',
   _ehHoraExtraCaixas('05:00-06:00'), true);
ok('06:00-07:00 idem', _ehHoraExtraCaixas('06:00-07:00'), true);
ok('07:00-08:00 é jornada normal', _ehHoraExtraCaixas('07:00-08:00'), false);
ok('16:00-16:59 ainda é jornada normal', _ehHoraExtraCaixas('16:00-16:59'), false);
ok('17:00 em diante é hora extra', _ehHoraExtraCaixas('17:00-18:00'), true);
ok('e com o rótulo também', _ehHoraExtraCaixas('HE 17:00-18:00'), true);
ok('HE de madrugada conta pelos dois caminhos', _ehHoraExtraCaixas('HE 04:00-05:00'), true);
ok('rótulo ilegível não vira hora extra por acidente', _ehHoraExtraCaixas('TOTAL'), false);

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

console.log('\n── reconstrução dos dias antigos (PRODUCAO_PRODUTO) ──');
// Régua confirmada com o PPCP: dia útil conta por horário (antes das 07:00 ou
// depois das 18:00); sábado e domingo contam o dia INTEIRO.
const PROD_LOG = [
  ['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS', 'PONTOS', 'PESO_KG', 'OPERADOR'],
  ['04/07/2026', '05:00', 'C', 'X', 188, 0, 0, ''],   // sábado
  ['04/07/2026', '06:00', 'C', 'X', 200, 0, 0, ''],   // sábado
  ['04/07/2026', '09:00', 'C', 'X', 951, 0, 0, ''],   // sábado de manhã: extra também
  ['06/07/2026', '06:00', 'C', 'X', 150, 0, 0, ''],   // segunda, antes das 07:00
  ['06/07/2026', '09:00', 'C', 'X', 800, 0, 0, ''],   // segunda, jornada normal
  ['06/07/2026', '16:00', 'C', 'X',  40, 0, 0, ''],   // segunda, última hora do turno
  ['06/07/2026', '17:00', 'C', 'X',  70, 0, 0, ''],   // segunda, JÁ É hora extra
  ['06/07/2026', '19:00', 'C', 'X',  60, 0, 0, ''],   // segunda, noite
];
const HIST_REC = [
  ['DATA','REALIZADO','META','EF','MELHOR','PIOR','HE','FECHADO','FECHADO EM','MEDIA','HE CX'],
  ['04/07/2026', 1278, 1850, 69.1, 299, 135, 0, false, '', 213, ''],
  ['06/07/2026', 1010, 1850, 54.6, 300, 150, 0, false, '', 100, ''],
];
const ABAS_REC = { PRODUCAO_PRODUTO: PROD_LOG, HISTORICO: HIST_REC };
const gravado = {};
PLANILHA_REC = {
  getSheetByName: n => ABAS_REC[n] ? {
    getName: () => n,
    getDataRange: () => ({ getValues: () => ABAS_REC[n] }),
    getRange: (r, c) => ({ getValue: () => ABAS_REC[n][r-1] && ABAS_REC[n][r-1][c-1],
                           setValue: v => { gravado[ABAS_REC[n][r-1][0]] = v; ABAS_REC[n][r-1][c-1] = v; } })
  } : null
};
SpreadsheetApp.getActiveSpreadsheet = () => PLANILHA_REC;
const SHEET_PROD_LOG = 'PRODUCAO_PRODUTO';
const SHEET_HIST = 'HISTORICO';
// Constantes da régua, lidas do próprio .gs para o teste seguir o código:
// se alguém trocar o horário ou desligar o sábado inteiro, o teste acusa.
// O backfill e o fechamento usam a MESMA janela desde 31/08/2026: as
// HE_TURNO_*_MIN são alias das HE_JORNADA_*_MIN, já carregadas como globais lá
// em cima. Duas réguas para o mesmo indicador foi o que deixou a HE CX zerada.
const HE_TURNO_INI_MIN  = HE_JORNADA_INI_MIN;
const HE_TURNO_FIM_MIN  = HE_JORNADA_FIM_MIN;
const HE_SABADO_INTEIRO = /HE_SABADO_INTEIRO\s*=\s*true/.test(src);
const CacheService = { getScriptCache: () => ({ put(){}, get(){ return null; } }) };
const normalizarDataBR = v => String(v || '').trim();
eval(pega('function _valoresDaAba('));
eval(pega('function _valores('));
eval(pega('function _invalidarValores('));
eval(pega('function invalidarCacheLeitura('));
eval(pega('function _dataStr('));
eval(pega('function _horaStr('));
eval(pega('function fmtDataBR('));
eval(pega('function _heMinutosDaHora('));
eval(pega('function _heFimDeSemana('));
eval(pega('function fromMinGs('));
eval(pega('function _heCaixasPorDiaDoLogProduto('));
eval(pega('function simularHoraExtraPassada('));
eval(pega('function preencherHoraExtraPassada('));
var _valoresMemo = {};

const sim = simularHoraExtraPassada().dias;
const sab = sim.find(d => d.data === '04/07/2026');
const seg = sim.find(d => d.data === '06/07/2026');
ok('sábado conta o dia INTEIRO (limitado ao realizado)', sab.heCx, 1278);
ok('e o motivo é o fim de semana', sab.motivo, 'fim de semana');
// A jornada normal é 07:00-17:00 (PPCP, 31/08/2026): 06:00 + 17:00 + 19:00 são
// extra (150+70+60), 09:00 e 16:00 são jornada. A fronteira das 17:00 é o que
// mudou — antes a régua ia até 18:00 e a hora das 17:00 contava como normal.
ok('dia útil: fora de 07:00-17:00 (150 + 70 + 60)', seg.heCx, 280);
ok('09:00 e 16:00 não entram; 17:00 entra',
   Object.keys(seg.horarios).sort(), ['06:00', '17:00', '19:00']);
ok('hora extra nunca passa o realizado do dia', sab.heCx <= sab.realizado, true);

_invalidarValores();
preencherHoraExtraPassada();
ok('grava a HE CX do sábado', gravado['04/07/2026'], 1278);
ok('grava a HE CX do dia útil', gravado['06/07/2026'], 280);

console.log('\n── a marcação precisa chegar aos painéis ──');
['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'].forEach(f => {
  const html = fs.readFileSync(path.join(__dirname, f), 'utf8');
  ok(f + ' propaga o he do backend para DADOS', /he:\s*s\.he===true/.test(html), true);
  ok(f + ' separa realHE/realNormal nos KPIs', /realHE/.test(html) && /realNormal/.test(html), true);
});

console.log(falhas === 0
  ? '\n✅ hora extra ok — o rótulo diz que linha é, o horário diz que caixas contam\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
