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
let FAKE_HOJE  = '10/08/2026';
const Utilities = { formatDate: (d, tz, fmt) =>
  fmt === 'yyyy'                      ? '2026'
  : (fmt && fmt.indexOf('HH') >= 0)   ? FAKE_AGORA
  :                                     FAKE_HOJE };
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

console.log('\n── PROGRAMACAO: STATUS e o carimbo ATUALIZADO_EM ──');
// Duas regras que vivem na mesma função:
//   STATUS      — EM ANDAMENTO é do lote DE HOJE; data anterior não concluída é
//                 EM ATRASO, a mesma régua do atraso que o painel já calcula.
//   ATUALIZADO_EM — carimbo DA LINHA. A função roda a CADA lançamento; antes ela
//                 regravava `agora` em TODAS as linhas e a coluna virava o
//                 relógio da sincronização.
const SHEET_PROG = 'PROGRAMACAO';
// Infra do Apps Script, não regra: aqui basta achar a aba pelo nome.
function acharAbaTolerante(ss, nome) { return ss.getSheetByName(nome); }
eval(pega('function _progIgual('));
eval(pega('function _progFase('));
eval(pega('function atualizarSaldoNaProgramacao('));

const PROG = [
  ['LOTE', 'DATA', 'ORDEM', 'CODIGO', 'DESCRICAO', 'QTD_CX', 'PRODUZIDO', 'SALDO', 'PERCENTUAL', 'STATUS', 'ATUALIZADO_EM'],
  ['25136', '10/8', 1, '501.149.001', 'HOJE, JÁ PRODUZIU',   700, '', '', '', '', ''],
  ['25136', '10/8', 1, '501.149.002', 'HOJE, NÃO COMEÇOU',   300, '', '', '', '', ''],
  ['25100', '5/8',  1, '501.149.003', 'VENCIDO, PARCIAL',    100, '', '', '', '', ''],
  ['25100', '5/8',  1, '501.149.004', 'VENCIDO, NÃO COMEÇOU', 50, '', '', '', '', ''],
  ['25199', '20/8', 1, '501.149.005', 'LOTE FUTURO',         100, '', '', '', '', ''],
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
const status  = l => PROG[l][9];
const carimbo = l => PROG[l][10];
// saldo de cada linha, na ordem da tabela acima (o FIFO do calcularProgramacao)
const saldos = (a, b, c, d) => ({ saldoLinha: {
  '501149001|25136|20260810': a, '501149002|25136|20260810': b,
  '501149003|25100|20260805': c, '501149004|25100|20260805': d } });

PLANILHA = { getSheetByName: n => (n === SHEET_PROG ? abaProg : null) };

FAKE_HOJE = '10/08/2026'; FAKE_AGORA = '10/08/2026 09:00:00';
atualizarSaldoNaProgramacao(saldos(8, 300, 40, 50));
ok('lote de HOJE que já produziu: EM ANDAMENTO', status(1), 'EM ANDAMENTO');
ok('lote de HOJE que não começou: PENDENTE',     status(2), 'PENDENTE');
ok('lote VENCIDO com produção parcial: EM ATRASO', status(3), 'EM ATRASO');
ok('lote VENCIDO que não começou: EM ATRASO',      status(4), 'EM ATRASO');
ok('e o produzido da linha continua saindo', [PROG[1][6], PROG[1][7], PROG[1][8]], [692, 8, 99]);
ok('linha de data futura continua em branco', [PROG[5][6], status(5), carimbo(5)], ['', '', '']);
ok('1ª rodada carimba a hora', [carimbo(1), carimbo(3)], ['10/08/2026 09:00:00', '10/08/2026 09:00:00']);

FAKE_AGORA = '10/08/2026 16:43:43';
atualizarSaldoNaProgramacao(saldos(8, 300, 40, 50));
ok('rodada sem mudança NÃO recarimba (era o defeito)',
   [carimbo(1), carimbo(2), carimbo(3)],
   ['10/08/2026 09:00:00', '10/08/2026 09:00:00', '10/08/2026 09:00:00']);

FAKE_AGORA = '10/08/2026 17:00:00';
atualizarSaldoNaProgramacao(saldos(0, 300, 40, 50));
ok('quem andou ganha a hora nova', carimbo(1), '10/08/2026 17:00:00');
ok('e fecha como CONCLUIDO', [PROG[1][6], PROG[1][7], status(1)], [700, 0, 'CONCLUIDO']);
ok('quem não andou mantém a hora antiga', carimbo(2), '10/08/2026 09:00:00');

// Virada do dia: o lote de ontem passa a EM ATRASO sozinho, sem ninguém produzir.
// O carimbo não pode reagir a isso — senão volta a dizer "andou" para um lote parado.
FAKE_HOJE = '11/08/2026'; FAKE_AGORA = '11/08/2026 07:10:00';
atualizarSaldoNaProgramacao(saldos(0, 300, 40, 50));
ok('na virada do dia o lote de ontem vira EM ATRASO', status(2), 'EM ATRASO');
ok('e o carimbo dele NÃO muda (o lote não andou)',    carimbo(2), '10/08/2026 09:00:00');
ok('o lote já concluído segue concluído e parado',    [status(1), carimbo(1)],
   ['CONCLUIDO', '10/08/2026 17:00:00']);

ok('_progFase: os três estados de lote aberto são a mesma fase',
   [_progFase('PENDENTE'), _progFase('EM ANDAMENTO'), _progFase('EM ATRASO')],
   ['ABERTA', 'ABERTA', 'ABERTA']);
ok('_progFase: concluir e sair da esteira NÃO são a mesma fase',
   [_progFase('CONCLUIDO'), _progFase('FORA DA ESTEIRA'), _progFase('')],
   ['CONCLUIDO', 'FORA DA ESTEIRA', '']);

// A célula pode voltar da planilha como texto (coluna formatada) — comparar
// como string faria "99" ≠ 99 e recarimbaria tudo a cada rodada.
ok('_progIgual: número e texto do mesmo valor são iguais', _progIgual('99', 99), true);
ok('_progIgual: vazio só é igual a vazio', [_progIgual('', 0), _progIgual('', '')], [false, true]);
ok('_progIgual: texto sem depender de caixa/espaço', _progIgual(' Concluido ', 'CONCLUIDO'), true);

// ── colunas de LOTE: um critério, três chamadores ───────────────────────────
// A produção é lançada nas colunas de LOTE e a coluna REALIZADO pode ficar
// vazia ou parcial — quem soma errado aqui mostra menos caixa do que a fábrica
// fez. O laço estava copiado em TRÊS lugares (getDados, _saveRealizadoCore e
// arquivarDiaAtual): endurecer o critério significava lembrar dos três.
console.log('\n── colunas de LOTE (um critério, três chamadores) ──');
eval(pega('function _ehColunaLote('));
eval(pega('function _colunasDeLote('));

ok('nenhum chamador reescreve o laço',
   (src.match(/const iLotes = _colunasDeLote\(hdr, iR\);/g) || []).length, 3);
ok('e o critério cru não sobrou em lugar nenhum',
   /hdr\[c\]\.includes\('LOTE'\)/.test(src), false);

// Equivalência com o laço que existia: o critério NÃO foi endurecido nesta
// mudança — só saiu de três lugares para um. Se algum destes mudar de resposta,
// a extração mudou comportamento, que é o que ela não podia fazer.
const anterior = (h) => h.includes('LOTE') || h.includes('LT') || h.startsWith('L');
['LOTE 1','LOTE','LT2','L1','ACUM','%/H','REALIZADO','META','OBS','',
 'LINHA','LIMPEZA','LIDER','LOCAL','TURNO','CX/H','RESULTADO','FALTA',
 'SALDO','TOTAL','PERDA','REFUGO','PARADA','OPERADOR','PALETE'].forEach(h => {
  ok('mesmo veredito de antes para "' + h + '"', _ehColunaLote(h), anterior(h));
});

// ⚠⚠ O CABEÇALHO REAL DA HORA_A_HORA (linha 4, conferido na planilha em
// 15/09/2026). As colunas de lançamento chamam-se **LANÇ 1 … LANÇ 10** — NÃO
// existe nenhuma coluna "LOTE" nem "LT" na planilha de verdade.
//
// Ou seja: das três cláusulas do critério, quem faz o sistema funcionar é o
// startsWith('L'). As outras duas não casam com NADA aqui. O startsWith('L')
// não é a cláusula folgada do critério — é a ÚNICA que sustenta o lançamento.
//
// Endurecer o critério para "só LOTE/LT" — que é o que a leitura do código
// sugere a quem nunca viu a planilha — faria as DEZ colunas pararem de ser
// somadas de uma vez. E o estrago seria CALADO: sem coluna de lote o
// _saveRealizadoCore cai no ramo `iLotes.length === 0`, que grava na coluna
// REALIZADO apenas `if (!cell.getFormula())` e devolve `{ok:true}` de qualquer
// jeito. Com REALIZADO sendo fórmula, o operador salva, o app diz que salvou e
// NADA é gravado.
//
// É por isso que este teste prende o cabeçalho REAL: quem for endurecer o
// critério quebra aqui antes de quebrar a fábrica.
const HDR_REAL = ['HORA','META','REALIZADO',
  'LANÇ 1','LANÇ 2','LANÇ 3','LANÇ 4','LANÇ 5',
  'LANÇ 6','LANÇ 7','LANÇ 8','LANÇ 9','LANÇ 10',
  '','COMO PREENCHER'].map(h => h.trim().toUpperCase());

ok('as 10 colunas LANÇ da planilha REAL são detectadas',
   _colunasDeLote(HDR_REAL, 2), [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
ok('e a coluna vazia e a de ajuda ficam de fora',
   [_ehColunaLote(''), _ehColunaLote('COMO PREENCHER')], [false, false]);
// A cláusula que sustenta tudo: sem ela, LANÇ não casa com mais nada.
ok('"LANÇ 1" não casa por LOTE nem por LT — só pelo começo com L',
   ['LANÇ 1'.indexOf('LOTE') >= 0, 'LANÇ 1'.indexOf('LT') >= 0, 'LANÇ 1'.charAt(0) === 'L'],
   [false, false, true]);

// O que o critério PRECISA fazer (a razão de ele existir) e o que ele erra.
const hdr = ['HORA','META','REALIZADO','LOTE 1','LT2','ACUM','%/H','LINHA'];
ok('formato antigo (LOTE/LT) continua aceito', _colunasDeLote(hdr, 2), [3, 4, 7]);
ok('e não soma coluna de fórmula (ACUM, %/H)',
   [_ehColunaLote('ACUM'), _ehColunaLote('%/H')], [false, false]);
// ⚠ Item aberto, e é por isso que o teste registra o erro em vez de escondê-lo:
// LINHA entra como lote e vira produção, em silêncio. Endurecer depende de
// conferir os títulos reais da HORA_A_HORA — apertar às cegas faz o lançamento
// deixar de ser somado, que é pior. Quando for endurecido, ESTA linha muda.
ok('⚠ conhecido: LINHA ainda passa como coluna de lote', _ehColunaLote('LINHA'), true);
// E o 'LT' pega no MEIO da palavra, não só no começo: RESULTADO (resuLTado) e
// FALTA (faLTa) são nomes plausíveis numa planilha de produção e passam calados.
// Ficam aqui escritos para quem for conferir os títulos reais saber o que caçar.
ok('⚠ conhecido: RESULTADO passa pelo LT no meio da palavra', _ehColunaLote('RESULTADO'), true);
ok('⚠ conhecido: FALTA também', _ehColunaLote('FALTA'), true);
// Estes o critério acerta em cheio — não é tudo que escapa.
ok('SALDO, TOTAL, PERDA e REFUGO ficam de fora',
   ['SALDO','TOTAL','PERDA','REFUGO'].map(_ehColunaLote), [false, false, false, false]);
ok('nada antes de REALIZADO entra', _colunasDeLote(hdr, 6), [7]);
ok('cabeçalho vazio não quebra', [_colunasDeLote([], 0), _ehColunaLote(null)], [[], false]);

console.log(falhas === 0
  ? '\n✅ backend ok — a mesma aba não é lida duas vezes na mesma chamada\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
