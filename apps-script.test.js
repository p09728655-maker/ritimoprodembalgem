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
let leituras = {}, celulas = {};
function novaPlanilha() {
  leituras = {}; celulas = {};
  return {
    getName: () => 'teste',
    getSheetByName: nome => ABAS[nome] ? {
      getName: () => nome,
      getLastRow: () => ABAS[nome].length,
      getLastColumn: () => ABAS[nome][0].length,
      getDataRange: () => ({
        getValues: () => { leituras[nome] = (leituras[nome] || 0) + 1;
                           celulas[nome] = (celulas[nome] || 0) + ABAS[nome].length * ABAS[nome][0].length;
                           return ABAS[nome]; }
      }),
      // getRange(linha, col, nLinhas, nColunas) — 1-based, como no Apps Script.
      // Conta CÉLULAS: é por elas que a leitura do Sheets se paga, e o ganho da
      // leitura recortada só aparece nessa unidade.
      getRange: (l, c, nl, nc) => ({
        getValues: () => {
          celulas[nome] = (celulas[nome] || 0) + (nl || 1) * (nc || 1);
          return ABAS[nome].slice(l - 1, l - 1 + (nl || 1))
                           .map(r => r.slice(c - 1, c - 1 + (nc || 1)));
        }
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

console.log('\n── PARADAS com segundos (v5.5, microparadas) ──');
// Caso real (17/09/2026): 08:24→08:25 gravava DURACAO_MIN = 1 e 08:39→08:39
// ficava em branco. Com INICIO/FIM em HH:mm:ss a duração sai com fração e a
// coluna H (DURACAO_SEG) traz os segundos. Roda as funções REAIS do .gs.
(function () {
  const p2 = n => String(n).padStart(2, '0');
  const Utilities = { formatDate: (d, tz, f) => {
    if (f === 'ss')       return p2(d.getSeconds());
    if (f === 'HH:mm')    return p2(d.getHours()) + ':' + p2(d.getMinutes());
    if (f === 'HH:mm:ss') return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds());
    if (f === 'dd/MM/yyyy') return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear();
    throw new Error('formato não esperado no teste: ' + f);
  } };
  function _ssTz() { return TZ; }
  const Logger = { log() {} };
  const SHEET_PARADAS = 'PARADAS';
  eval(pega('function _horaEmSeg('));
  eval(pega('function calcDurSeg('));
  eval(pega('function calcDurMin('));
  eval(pega('function _horaSegStr('));
  eval(pega('function _dataStr('));
  eval(pega('function _garantirColDuracaoSeg('));
  eval(pega('function endParada('));

  ok('08:24:10 → 08:25:00 = 50 s', calcDurSeg('08:24:10', '08:25:00'), 50);
  ok('… e 0,83 min em DURACAO_MIN (era 1)', calcDurMin('08:24:10', '08:25:00'), 0.83);
  ok('08:39:02 → 08:39:47 = 45 s (era vazio)', calcDurSeg('08:39:02', '08:39:47'), 45);
  ok('linha antiga só com HH:mm continua igual: 08:24 → 08:25 = 1', calcDurMin('08:24', '08:25'), 1);
  ok('mesmo instante continua sem duração (parada aberta não ganha 0)', calcDurMin('08:39', '08:39'), null);
  ok('texto que não é hora não tem duração', calcDurSeg('8h', '9h'), null);

  const hora = (h, m, s) => new Date(2026, 8, 17, h, m, s);
  ok('célula de hora COM segundos sai HH:mm:ss', _horaSegStr(hora(8, 39, 15)), '08:39:15');
  ok('célula de hora SEM segundos sai HH:mm, como sempre saiu', _horaSegStr(hora(8, 39, 0)), '08:39');
  ok('texto passa como está', _horaSegStr(' 08:39:15 '), '08:39:15');
  ok('vazio continua vazio (é o teste de "parada aberta")', _horaSegStr(''), '');

  // endParada numa aba criada ANTES da v5.5 (7 colunas): carimba FIM com
  // segundos, DURACAO_MIN com fração, cria o cabeçalho H e grava DURACAO_SEG.
  const linhas = [
    ['DATA', 'ID', 'TIPO', 'INICIO', 'FIM', 'DURACAO_MIN', 'OBS'],
    ['17/09/2026', '1789645178327', 'Parada/Empilhar peças', '08:39:02', '', '', ''],
  ];
  const escritas = {};
  const sh = {
    getDataRange: () => ({ getValues: () => linhas.map(r => r.slice()) }),
    getRange: (r, c) => ({
      getValue: () => (linhas[r - 1] || [])[c - 1] || '',
      setValue: v => { escritas[r + ',' + c] = v; }
    })
  };
  const SpreadsheetApp = { getActiveSpreadsheet: () => ({ getSheetByName: () => sh }), flush() {} };
  const res = endParada({ id: '1789645178327', fim: '08:39:47', data: '17/09/2026' });
  ok('endParada fecha pelo ID', res.ok, true);
  ok('FIM gravado com os segundos que vieram', escritas['2,5'], '08:39:47');
  ok('DURACAO_MIN = 0,75 (45 s)', escritas['2,6'], 0.75);
  ok('DURACAO_SEG = 45 na coluna H', escritas['2,8'], 45);
  ok('cabeçalho DURACAO_SEG criado na aba antiga', escritas['1,8'], 'DURACAO_SEG');
  // Cabeçalho já existente não é reescrito.
  linhas[0].push('DURACAO_SEG'); delete escritas['1,8'];
  endParada({ id: '1789645178327', fim: '08:39:47', data: '17/09/2026' });
  ok('cabeçalho existente fica quieto', escritas['1,8'], undefined);
})();

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
// jeito. E REALIZADO É FÓRMULA — conferido na planilha em 15/09/2026, a coluna
// C5:C15 é uma =SUM(D5:M5) compartilhada. Ou seja: o operador salva, o app diz
// que salvou e NADA é gravado.
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

// ── leitura recortada por data: menos células, mesmo resultado ─────────────
// Toda leitura do .gs era a aba INTEIRA. Medido na planilha real em
// 15/09/2026: PRODUCAO_PRODUTO tem 3.300 linhas x 8 colunas = 26.400 células, e
// o comparativo por modelo lia todas para ficar com as do período.
console.log('\n── leitura recortada por data ──');
eval(pega('function dataParaNum('));
eval(pega('function _faixaPorData('));
eval(pega('function _valoresPorData('));

// 6 dias de log, 3 colunas. A ordem é a da planilha.
ABAS.LOG = [['DATA', 'CODIGO', 'CAIXAS']];
['10/08/2026','11/08/2026','12/08/2026','13/08/2026','14/08/2026','15/08/2026']
  .forEach((d, i) => ABAS.LOG.push([d, '50109400' + i, 10 * (i + 1)]));

const soDatas = v => v.slice(1).map(r => r[0]);
const TUDO = 7 * 3;   // 7 linhas x 3 colunas, se lesse a aba inteira

PLANILHA = novaPlanilha(); _invalidarValores();
let sh = PLANILHA.getSheetByName('LOG');
let v = _valoresPorData(sh, 'DATA', 0, dataParaNum, 20260812, 20260814);
ok('devolve cabeçalho + só as linhas do período',
   [v[0][0], soDatas(v)], ['DATA', ['12/08/2026','13/08/2026','14/08/2026']]);
ok('e lê MENOS células do que a aba inteira', celulas.LOG < TUDO, true);

// O ganho, em número: 1 cabeçalho (3) + a coluna de data (6) + 3x3 = 18 < 21.
ok('quantas células foram lidas', celulas.LOG, 3 + 6 + 9);

// ⚠ O ponto que decide o desenho: planilha FORA DE ORDEM. A otimização óbvia
// (busca binária, ler do corte em diante) perderia a linha antiga no fim —
// calado. Aqui a coluna inteira é varrida, então o pior caso é ler mais.
PLANILHA = novaPlanilha(); _invalidarValores();
ABAS.LOG.push(['11/08/2026', '501094009', 99]);   // linha antiga lançada à mão, no fim
sh = PLANILHA.getSheetByName('LOG');
v = _valoresPorData(sh, 'DATA', 0, dataParaNum, 20260811, 20260812);
ok('fora de ordem NÃO perde a linha antiga do fim',
   soDatas(v).filter(d => d === '11/08/2026').length, 2);
ABAS.LOG.pop();

// Período sem nenhuma linha: devolve só o cabeçalho, não a aba.
PLANILHA = novaPlanilha(); _invalidarValores();
sh = PLANILHA.getSheetByName('LOG');
v = _valoresPorData(sh, 'DATA', 0, dataParaNum, 20261201, 20261231);
ok('período vazio devolve só o cabeçalho', [v.length, v[0][0]], [1, 'DATA']);

// Sem recorte pedido, leitura normal — e aí SIM alimenta o memo.
PLANILHA = novaPlanilha(); _invalidarValores();
sh = PLANILHA.getSheetByName('LOG');
v = _valoresPorData(sh, 'DATA', 0, dataParaNum, null, null);
ok('sem período, lê a aba inteira como antes', v.length, ABAS.LOG.length);

// A aba inteira já no memo: reler um pedaço seria uma leitura a MAIS.
PLANILHA = novaPlanilha(); _invalidarValores();
sh = PLANILHA.getSheetByName('LOG');
_valoresDaAba(sh);
const antes = celulas.LOG;
v = _valoresPorData(sh, 'DATA', 0, dataParaNum, 20260812, 20260814);
ok('com a aba já no memo, não lê de novo', celulas.LOG, antes);
ok('e devolve a aba inteira (o laço do chamador filtra)', v.length, ABAS.LOG.length);

// O recorte NUNCA pode envenenar o memo: um pedaço guardado ali faria a
// próxima leitura completa devolver menos linhas do que a planilha tem.
PLANILHA = novaPlanilha(); _invalidarValores();
sh = PLANILHA.getSheetByName('LOG');
_valoresPorData(sh, 'DATA', 0, dataParaNum, 20260812, 20260812);
ok('o recorte não entra no memo', _valoresDaAba(sh).length, ABAS.LOG.length);

// ⚠ O PIOR CASO, escrito: quando a janela cobre a aba inteira não há o que
// economizar, e a varredura da coluna de data (1/nColunas de uma leitura
// completa) vira prejuízo. Medido na planilha real: +12% em PRODUCAO_PRODUTO
// (8 colunas), +14% na PARADAS (7). Fica assim de propósito — 7 e 30 dias são o
// uso do dia a dia; 90 é o preset raro. O teste prende o TETO: nunca pode
// passar de uma leitura completa + a coluna de data.
PLANILHA = novaPlanilha(); _invalidarValores();
sh = PLANILHA.getSheetByName('LOG');
v = _valoresPorData(sh, 'DATA', 0, dataParaNum, 20260810, 20260815);   // o período todo
ok('período que cobre tudo devolve tudo', v.length, ABAS.LOG.length);
const NLIN = ABAS.LOG.length, NCOL = ABAS.LOG[0].length;
ok('e o pior caso não passa de "aba inteira + a coluna de data"',
   celulas.LOG <= NLIN * NCOL + (NLIN - 1), true);
ok('o excesso do pior caso é a varredura da coluna, e só ela',
   celulas.LOG - NLIN * NCOL, NLIN - 1);

// E a conversão do chamador é mesmo a que manda: com uma que enxerga o dia
// seguinte, o recorte anda junto. É o que garante que recorte e filtro nunca
// discordem de qual dia é a linha.
PLANILHA = novaPlanilha(); _invalidarValores();
sh = PLANILHA.getSheetByName('LOG');
const umDiaDepois = v => dataParaNum(v) + 1;
v = _valoresPorData(sh, 'DATA', 0, umDiaDepois, 20260812, 20260812);
ok('o recorte segue a conversão do chamador, não uma própria',
   soDatas(v), ['11/08/2026']);

// Coluna de DATA achada pelo cabeçalho, não pela posição.
PLANILHA = novaPlanilha(); _invalidarValores();
ABAS.LOG2 = [['ID', 'DATA', 'CAIXAS'], ['a', '10/08/2026', 5], ['b', '20/08/2026', 7]];
v = _valoresPorData(PLANILHA.getSheetByName('LOG2'), 'DATA', 0, dataParaNum, 20260820, 20260820);
ok('acha a coluna DATA pelo cabeçalho', v.slice(1).map(r => r[0]), ['b']);

// Os dois chamadores usam a leitura recortada.
ok('getProducaoModeloPeriodo lê recortado, com a conversão DELE',
   /_valoresPorData\(sh, 'DATA', 0, dataParaNum, deNum, ateNum\)/.test(src), true);
// ⚠ getParadasPeriodo filtra por toNum(_dataStr(...)) — fuso DA PLANILHA — e a
// dataParaNum usa o TZ constante. Para célula que é Date de verdade os dois
// discordam do DIA quando os fusos diferem, e o recorte cortaria uma linha que
// o filtro aceitaria: sumiria calada. Cada chamador passa a SUA conversão.
ok('getParadasPeriodo recorta com a MESMA conversão do filtro dele',
   /_valoresPorData\(sh, 'DATA', 0, v => toNum\(_dataStr\(v\)\), nDe, nAte\)/.test(src), true);
ok('e o recorte não tem conversão própria embutida',
   /function _faixaPorData\(sh, iCol, paraNum, deNum, ateNum\)/.test(src), true);
// A FIFO precisa do histórico inteiro: recortar ali creditaria produção antiga
// a outro lote do mesmo código (ver CLAUDE.md, arquivamento).
ok('lerEmbaladoPorProduto continua lendo a aba inteira',
   /function lerEmbaladoPorProduto[\s\S]{0,400}_valoresDaAba\(sh\)/.test(src), true);



// ── v5.6: redação da proposta com IA ────────────────────────────────────────
// O painel manda os números; aqui só se redige, e número que não veio nos
// dados é apontado. A chave mora em Propriedades do script — sem ela, a ação
// devolve 'sem-chave' e não chama ninguém.
console.log('\n── redigirProposta: guarda de números ──');
eval(pega('function _iaNumeroPtBr('));
eval(pega('function _iaNumerosPermitidos('));
eval(pega('function _iaNumerosForaDaLista('));
eval(pega('function _iaHash('));
eval(pega('function _iaSchemaProposta('));
eval(pega('function _iaPromptProposta('));
eval(pega('function _iaParseJson('));
eval(pega('function _iaChamar('));
eval(pega('function redigirProposta('));
const IA_MODELO = 'claude-opus-5', IA_MAX_TOKENS = 1400, IA_CHAVE_PROP = 'CLAUDE_API_KEY',
      IA_CACHE_SEG = 21600, IA_URL = 'https://api.anthropic.com/v1/messages', IA_VERSAO_API = '2023-06-01',
      IA_RESUMO_MAX = 320;
ok('lê número pt-BR', [_iaNumeroPtBr('7.219'), _iaNumeroPtBr('85,6'), _iaNumeroPtBr('1.234,56'), _iaNumeroPtBr('2026')],
   [7219, 85.6, 1234.56, 2026]);
const dados = { investimento: { total: 'R$ 162.000' }, economiaHE: { mes: 'R$ 7.719', ano: 'R$ 92.629' },
                retorno: { payback: '22,4 meses', roi: '60,4%' }, problema: { ocorrencias: 164, tempoParado: '15h11m' } };
const perm = _iaNumerosPermitidos(dados);
ok('a lista de permitidos sai dos dados (strings incluídas)',
   [162000, 7719, 92629, 22.4, 60.4, 164, 15, 11].every(n => perm.includes(n)), true);
ok('texto só com os números dos dados passa',
   _iaNumerosForaDaLista('Investimento de R$ 162.000 (R$ 162 mil), economia de R$ 7.719 por mês e R$ 92.629 por ano; paga-se em 22,4 meses (22 meses), ROI de 60,4% em 3 anos, 12 meses, em 2026.', perm), []);
ok('número inventado é apontado', _iaNumerosForaDaLista('economia de R$ 8.500 por mês', perm), ['8.500']);
ok('percentual inventado também', _iaNumerosForaDaLista('reduz 35% das paradas', perm), ['35']);
ok('contagem pequena e ano não são acusados', _iaNumerosForaDaLista('em 5 anos, 3 cenários, desde 2024', perm), []);

console.log('\n── redigirProposta: a ação ──');
let PROPS = {}, FETCHES = [], RESPOSTA = null, CACHE_IA = {};
const PropertiesService = { getScriptProperties: () => ({ getProperty: k => PROPS[k] || null, setProperty: (k, v) => { PROPS[k] = v; } }) };
const UrlFetchApp = { fetch: (url, o) => { FETCHES.push({ url, o }); return { getResponseCode: () => RESPOSTA.code, getContentText: () => RESPOSTA.body }; } };
CacheService.getScriptCache = () => ({ get: k => CACHE_IA[k] || null, put: (k, v) => { CACHE_IA[k] = v; } });
const _fatos = JSON.stringify(dados);
let r0 = redigirProposta({ dados: _fatos });
ok('sem chave: erro sem-chave e nenhuma chamada', [r0.ok, r0.erro, FETCHES.length], [false, 'sem-chave', 0]);
PROPS.CLAUDE_API_KEY = 'sk-teste';
RESPOSTA = { code: 200, body: JSON.stringify({ model: 'claude-opus-5', content: [{ type: 'text',
  text: JSON.stringify({ resumo: 'Investimento de R$ 162.000; economia de R$ 7.719 por mês; paga-se em 22,4 meses.',
    problema: '164 paradas e 15h11m parados.', solucao: 'Recupera capacidade.', riscos: 'É simulação.', recomendacao: 'Aprovar.' }) }] }) };
let r1 = redigirProposta({ dados: _fatos });
ok('com chave: chama a API uma vez, com a chave no header e nunca na URL',
   [FETCHES.length, FETCHES[0].o.headers['x-api-key'], /sk-teste/.test(FETCHES[0].url)], [1, 'sk-teste', false]);
const corpo1 = JSON.parse(FETCHES[0].o.payload);
ok('o pedido leva o modelo, o schema dos cinco campos e os dados', 
   [corpo1.model, Object.keys(corpo1.output_config.format.schema.properties).join(','), corpo1.messages[0].content.includes('R$ 7.719')],
   ['claude-opus-5', 'resumo,problema,solucao,riscos,recomendacao', true]);
ok('a resposta traz os cinco textos, o hash e nenhum número fora',
   [r1.ok, Object.keys(r1.texto).length, r1.numerosFora, typeof r1.hash], [true, 5, [], 'string']);
let r2 = redigirProposta({ dados: _fatos });
ok('a mesma proposta de novo sai do cache, sem nova chamada', [FETCHES.length, r2.cache, r2.texto.resumo === r1.texto.resumo], [1, true, true]);
CACHE_IA = {};
RESPOSTA = { code: 200, body: JSON.stringify({ content: [{ type: 'text',
  text: JSON.stringify({ resumo: 'Economia de R$ 9.999 por mês.', problema: 'x', solucao: 'x', riscos: 'x', recomendacao: 'x' }) }] }) };
let r3 = redigirProposta({ dados: JSON.stringify({ ...dados, marca: 1 }) });
ok('número inventado pelo modelo vem apontado em numerosFora', r3.numerosFora, ['9.999']);
CACHE_IA = {}; FETCHES = [];
RESPOSTA = { code: 400, body: JSON.stringify({ error: { message: 'output_config is not supported' } }) };
try { redigirProposta({ dados: JSON.stringify({ ...dados, marca: 2 }) }); } catch (e) {}
ok('sem saída estruturada na conta, refaz o pedido sem output_config pedindo só o JSON',
   [FETCHES.length, 'output_config' in JSON.parse(FETCHES[1].o.payload), /SOMENTE com um objeto JSON/.test(JSON.parse(FETCHES[1].o.payload).messages[0].content)],
   [2, false, true]);
ok('o dispatcher conhece a ação', /act === 'redigirProposta'\)\s*result = redigirProposta\(p\)/.test(src), true);
ok('e a ação NÃO entra nas ações de escrita (não invalida o cache de leitura)', /ACOES_ESCRITA = \[[^\]]*redigirProposta/.test(src), false);
ok('a chave nunca é devolvida', JSON.stringify(r1).includes('sk-teste'), false);

console.log(falhas === 0
  ? '\n✅ backend ok — a mesma aba não é lida duas vezes na mesma chamada\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
