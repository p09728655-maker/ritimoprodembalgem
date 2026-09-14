// Teste do memo de leitura do backend (Apps Script).
//   node apps-script.test.js
//
// Toda leitura do .gs é getDataRange(): traz a aba INTEIRA, e o custo cresce com
// o histórico acumulado. O problema não é uma leitura — é a MESMA aba ser lida
// duas vezes na mesma chamada, que era o caso do getPontosDia (a ação mais cara
// do painel): ele lê PRODUCAO_PRODUTO e, na sequência, calcularProgramacao() ->
// lerEmbaladoPorProduto() lê a mesma aba de novo.
//
// O teste roda contra o código REAL do ritmoprod_appscript.gs, com um
// SpreadsheetApp de mentira que CONTA quantas vezes cada aba foi lida.

const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');

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

// ── planilha de mentira, com contador de leituras ───────────────────────────
const ABAS = {
  HISTORICO:      [['DATA', 'REALIZADO'], ['10/08/2026', 1106]],
  HISTORICO_HORA: [['DATA', 'HORA', 'REALIZADO'], ['10/08/2026', '07:00-08:00', 205]],
  PRODUCAO_PRODUTO: [['DATA', 'HORA', 'CODIGO', 'DESC', 'CAIXAS'],
                     ['10/08/2026', '07:00', '501094001', 'MESA', 40]],
};
let leituras = {};
function novaPlanilha() {
  leituras = {};
  return {
    getName: () => 'teste',
    getSheetByName: nome => ABAS[nome] ? {
      getName: () => nome,
      getLastRow: () => ABAS[nome].length,
      getLastColumn: () => ABAS[nome][0].length,
      getDataRange: () => ({
        getValues: () => { leituras[nome] = (leituras[nome] || 0) + 1; return ABAS[nome]; }
      })
    } : null
  };
}
let PLANILHA = novaPlanilha();
const SpreadsheetApp = { getActiveSpreadsheet: () => PLANILHA };
let cachePut = 0;
const CacheService = { getScriptCache: () => ({ put: () => { cachePut++; }, get: () => null }) };

eval(pega('function _valoresDaAba('));
eval(pega('function _valores('));
eval(pega('function _invalidarValores('));
eval(pega('function invalidarCacheLeitura('));
// _valoresMemo é declarado com var no .gs; aqui precisa existir antes do uso
var _valoresMemo = {};

console.log('\n── memo por execução ──');
PLANILHA = novaPlanilha(); _invalidarValores();
const v1 = _valores('HISTORICO');
const v2 = _valores('HISTORICO');
ok('a mesma aba é lida UMA vez', leituras.HISTORICO, 1);
ok('a segunda chamada devolve os mesmos dados', v2, v1);
ok('e é literalmente o mesmo array (sem cópia)', v1 === v2, true);

_valores('HISTORICO_HORA');
ok('abas diferentes são lidas cada uma na sua vez',
   [leituras.HISTORICO, leituras.HISTORICO_HORA], [1, 1]);

console.log('\n── a gravação não pode deixar dado velho no memo ──');
PLANILHA = novaPlanilha(); _invalidarValores();
_valores('HISTORICO');
invalidarCacheLeitura();          // é o que roda em toda ação de escrita
_valores('HISTORICO');
ok('depois de gravar, a leitura vai na planilha de novo', leituras.HISTORICO, 2);
ok('a geração do cache do CacheService também é trocada', cachePut > 0, true);

console.log('\n── aba que não existe não quebra nem entra no memo ──');
PLANILHA = novaPlanilha(); _invalidarValores();
ok('aba inexistente devolve lista vazia', _valores('NAO_EXISTE'), []);
ok('e não conta leitura nenhuma', Object.keys(leituras).length, 0);

console.log('\n── o ganho real: PRODUCAO_PRODUTO lida uma vez só ──');
// lerEmbaladoPorProduto é chamada dentro de calcularProgramacao, que por sua vez
// roda dentro de getPontosDia — que já leu a mesma aba. Duas chamadas seguidas
// reproduzem esse encadeamento.
const TZ = 'America/Sao_Paulo';
const SHEET_PROD_LOG = 'PRODUCAO_PRODUTO';
let FAKE_AGORA = '10/08/2026 08:00:00';
const Utilities = { formatDate: (d, tz, fmt) =>
  fmt === 'yyyy'                      ? '2026'
  : (fmt && fmt.indexOf('HH') >= 0)   ? FAKE_AGORA
  :                                     '10/08/2026' };
eval(pega('function codKey('));
eval(pega('function dataParaNum('));
eval(pega('function lerEmbaladoPorProduto('));
PLANILHA = novaPlanilha(); _invalidarValores();
const e1 = lerEmbaladoPorProduto(20260810);
const e2 = lerEmbaladoPorProduto(20260810);
ok('PRODUCAO_PRODUTO lida 1× (antes eram 2)', leituras.PRODUCAO_PRODUTO, 1);
ok('e o resultado é o mesmo das duas vezes', JSON.stringify(e2), JSON.stringify(e1));

console.log('\n── quem ESCREVE continua lendo direto da planilha ──');
// Guarda-corpo: se alguma função de escrita passar a usar o memo, ela pode
// gravar em cima de um retrato velho da aba.
const ESCRITORAS = ['saveDay', 'saveParadas', 'endParada', 'arquivarDiaAtual',
                    'arquivarHorasDoDia', 'setConfigPainel', 'atualizarSaldoNaProgramacao'];
ESCRITORAS.forEach(f => {
  const corpo = pega('function ' + f + '(');
  ok(`${f} não usa o memo`, /_valores(DaAba)?\s*\(/.test(corpo), false);
});

console.log('\n── ATUALIZADO_EM da PROGRAMACAO é o carimbo da LINHA ──');
// A função roda a CADA lançamento. Antes ela regravava `agora` em TODAS as
// linhas: a coluna virava o relógio da sincronização (a planilha inteira com o
// mesmo horário) em vez de dizer quando cada lote andou pela última vez.
const SHEET_PROG = 'PROGRAMACAO';
// Infra do Apps Script, não regra: aqui basta achar a aba pelo nome.
function acharAbaTolerante(ss, nome) { return ss.getSheetByName(nome); }
eval(pega('function _progIgual('));
eval(pega('function atualizarSaldoNaProgramacao('));

const PROG = [
  ['LOTE', 'DATA', 'ORDEM', 'CODIGO', 'DESCRICAO', 'QTD_CX', 'PRODUZIDO', 'SALDO', 'PERCENTUAL', 'STATUS', 'ATUALIZADO_EM'],
  ['25136', '5/8', 1, '501.149.001', 'MESA MADERO BRANCO', 700, '', '', '', '', ''],
  ['25136', '5/8', 1, '501.149.002', 'MESA MADERO CINZA',  300, '', '', '', '', ''],
  ['25199', '20/8', 1, '501.149.003', 'LOTE FUTURO',       100, '', '', '', '', ''],
];
const abaProg = {
  getName: () => SHEET_PROG,
  getLastRow: () => PROG.length,
  getLastColumn: () => PROG[0].length,
  getDataRange: () => ({ getValues: () => PROG.map(r => r.slice()) }),
  getRange: (row, col, nR, nC) => ({
    setValue: v => { PROG[row - 1][col - 1] = v; },
    setValues: m => {
      for (let i = 0; i < m.length; i++)
        for (let j = 0; j < m[i].length; j++) PROG[row - 1 + i][col - 1 + j] = m[i][j];
    }
  })
};
const carimbo = l => PROG[l][10];
const saldos = (a, b) => ({ saldoLinha: { '501149001|25136|20260805': a, '501149002|25136|20260805': b } });

PLANILHA = { getSheetByName: n => (n === SHEET_PROG ? abaProg : null) };

FAKE_AGORA = '05/08/2026 09:00:00';
atualizarSaldoNaProgramacao(saldos(8, 6));
ok('1ª rodada grava o produzido da linha', [PROG[1][6], PROG[1][7], PROG[1][9]], [692, 8, 'EM ANDAMENTO']);
ok('e carimba a hora', [carimbo(1), carimbo(2)], ['05/08/2026 09:00:00', '05/08/2026 09:00:00']);
ok('linha de data futura continua em branco', [PROG[3][6], carimbo(3)], ['', '']);

FAKE_AGORA = '05/08/2026 16:43:43';
atualizarSaldoNaProgramacao(saldos(8, 6));
ok('rodada sem mudança NÃO recarimba (era o defeito)',
   [carimbo(1), carimbo(2)], ['05/08/2026 09:00:00', '05/08/2026 09:00:00']);

FAKE_AGORA = '06/08/2026 07:30:00';
atualizarSaldoNaProgramacao(saldos(0, 6));
ok('quem andou ganha a hora nova', carimbo(1), '06/08/2026 07:30:00');
ok('e o status acompanha', [PROG[1][6], PROG[1][7], PROG[1][9]], [700, 0, 'CONCLUIDO']);
ok('quem não andou mantém a hora antiga', carimbo(2), '05/08/2026 09:00:00');

// A célula pode voltar da planilha como texto (coluna formatada) — comparar
// como string faria "99" ≠ 99 e recarimbaria tudo a cada rodada.
ok('_progIgual: número e texto do mesmo valor são iguais', _progIgual('99', 99), true);
ok('_progIgual: vazio só é igual a vazio', [_progIgual('', 0), _progIgual('', '')], [false, true]);
ok('_progIgual: texto sem depender de caixa/espaço', _progIgual(' Concluido ', 'CONCLUIDO'), true);

console.log(falhas === 0
  ? '\n✅ backend ok — a mesma aba não é lida duas vezes na mesma chamada\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
