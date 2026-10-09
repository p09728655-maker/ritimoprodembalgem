// Programação: produção ADIANTADA, coluna ENCERRAR e aviso de cor errada.
//   node programacao.test.js
//
// Medido na planilha em 09/10/2026: 58 linhas vencidas abertas, 3.770 cx de
// "falta". 1.716 cx eram caixa embalada 1–2 dias ANTES da data do lote (o FIFO
// descartava), 101 cx eram sobras de 1 a 10 cx, ~1.350 cx eram cor IRMÃ do mesmo
// produto com caixa sobrando (cor errada no app). O PPCP excluía a linha à mão.
//
// O .gs é carregado INTEIRO num contexto com planilha de mentira — o mesmo
// caminho que roda no Apps Script (calcular → gravar saldo → arquivar), não
// funções soltas. Um nome inexistente nos ramos novos quebra aqui.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const GS = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');
const MOB = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
const V7 = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const MJS = [...MOB.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

// ── planilha de mentira (só o que o caminho usa) ─────────────────────────────
// HOJE = sexta, 09/10/2026.
const HDR_PROG = ['LOTE', 'DATA', 'ORDEM', 'CODIGO', 'DESCRICAO', 'QTD_CX', 'PRODUZIDO', 'SALDO', 'PERCENTUAL', 'STATUS', 'ATUALIZADO_EM', 'ENCERRAR'];
function montar(prog, log, opts) {
  opts = opts || {};
  const ABAS = {
    // SALDO como o write-back grava (QTDE − PRODUZIDO), salvo quando o caso
    // pede outro número (célula de outra linha, depois de colar o extrato).
    PROGRAMACAO: [HDR_PROG].concat(prog.map(l => [l.lote, l.data, 1, l.cod, 'X', l.qtde,
      l.prod == null ? '' : l.prod, l.saldo !== undefined ? l.saldo : (l.prod == null ? '' : l.qtde - l.prod),
      '', l.status || '', '', l.enc === undefined ? '' : l.enc])),
    PRODUCAO_PRODUTO: [['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS']].concat(log.map(e => [e[0], '08:00', e[1], 'X', e[2]])),
    PRODUTO_CODIGO: [['CODIGO', 'DESCRICAO', 'COR']],
  };
  if (opts.arq) ABAS.PROGRAMACAO_CONCLUIDA = opts.arq;
  function aba(nome) {
    const v = ABAS[nome];
    if (!v) return null;
    return {
      getName: () => nome, getLastRow: () => v.length, getLastColumn: () => v[0].length, getMaxRows: () => v.length,
      getDataRange: () => ({ getValues: () => v.map(r => r.slice()) }),
      getRange: (l, c, nl, nc) => ({
        getValues: () => v.slice(l - 1, l - 1 + (nl || 1)).map(r => r.slice(c - 1, c - 1 + (nc || 1))),
        setValue: x => { v[l - 1][c - 1] = x; },
        setValues: xs => xs.forEach((row, k) => {
          if (!v[l - 1 + k]) v[l - 1 + k] = new Array(v[0].length).fill('');
          row.forEach((x, j) => { v[l - 1 + k][c - 1 + j] = x; });
        }),
        getValue: () => (v[l - 1] || [])[c - 1], getFormula: () => '', setNumberFormat: () => {},
      }),
      deleteRow: n => { v.splice(n - 1, 1); }, setFrozenRows: () => {}, appendRow: r => v.push(r),
    };
  }
  const ss = { getSheetByName: aba, getSheets: () => Object.keys(ABAS).map(aba),
               insertSheet: nome => { ABAS[nome] = [['']]; return aba(nome); }, getName: () => 'teste' };
  let src = GS;
  if (opts.antec != null) src = src.replace(/const ANTEC_DIAS_UTEIS = \d+;/, 'const ANTEC_DIAS_UTEIS = ' + opts.antec + ';');
  let hoje = opts.hoje || '09/10/2026';   // muda com setHoje: o mesmo caso visto em dias seguidos
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    Utilities: { formatDate: (d, tz, f) => f === 'yyyy' ? '2026' : (/HH/.test(f) ? hoje + ' 07:30:00' : hoje) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  // O caminho REAL do lançamento: sincronizarPlanilhaPosLancamento passa o MESMO
  // cálculo para gravar o saldo e para arquivar. Quantas linhas saíram = a
  // diferença de tamanho da aba.
  const rodar = () => vm.runInContext(
    '(function(){ _invalidarValores(); var n = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PROGRAMACAO").getLastRow(); ' +
    'sincronizarPlanilhaPosLancamento(); _invalidarValores(); ' +
    'return { p: calcularProgramacao(), a: { arquivadas: n - SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PROGRAMACAO").getLastRow() } }; })()', ctx);
  const calc = () => vm.runInContext('(function(){ _invalidarValores(); return calcularProgramacao(); })()', ctx);
  const simular = () => vm.runInContext('(function(){ _invalidarValores(); return _arquivarConcluidos(null, true); })()', ctx);
  return { ABAS, ctx, rodar, calc, simular, setHoje: h => { hoje = h; } };
}
const col = (aba, nome) => aba[0].map(x => String(x).trim().toUpperCase()).indexOf(nome);
function linha(aba, lote, cod) {
  const iL = col(aba, 'LOTE'), iC = col(aba, 'CODIGO');
  return aba.find((r, i) => i > 0 && String(r[iL]) === String(lote) && String(r[iC]) === String(cod)) || null;
}
const campos = (aba, r, nomes) => r ? nomes.map(n => r[col(aba, n)]) : null;

console.log('\n── dias úteis ──');
{
  const { ctx } = montar([], []);
  const du = (a, b) => vm.runInContext(`_diasUteisEntre(${a}, ${b})`, ctx);
  ok('quarta → quinta = 1 · quarta → sexta = 2', [du(20261007, 20261008), du(20261007, 20261009)], [1, 2]);
  ok('sexta → segunda = 1 (o fim de semana não conta)', du(20261002, 20261005), 1);
  ok('segunda → quinta = 3 · mesmo dia = 0 · data anterior = 0', [du(20261005, 20261008), du(20261008, 20261008), du(20261009, 20261008)], [3, 0, 0]);
  ok('virada de mês: 30/09 → 01/10 = 1', du(20260930, 20261001), 1);
}

console.log('\n── produção ADIANTADA ──');
{
  const prog = [
    { lote: 'L1', data: '08/10/2026', cod: '501106005', qtde: 220 },   // embalado na véspera (07/10)
    { lote: 'L2', data: '05/10/2026', cod: '501141007', qtde: 50 },    // embalado na sexta 02/10
    { lote: 'L3', data: '08/10/2026', cod: '501097001', qtde: 40 },    // embalado 3 dias úteis antes (05/10)
    { lote: 'L4', data: '01/10/2026', cod: '501070005', qtde: 30 },    // lote VELHO aberto do mesmo código…
    { lote: 'L5', data: '08/10/2026', cod: '501070005', qtde: 30 },    // …e o novo
  ];
  const log = [['07/10/2026', '501106005', 219], ['02/10/2026', '501141007', 50], ['05/10/2026', '501097001', 40], ['07/10/2026', '501070005', 60]];
  const novo = montar(prog, log).calc(), velho = montar(prog, log, { antec: 0 }).calc();
  const sl = (p, k) => p.saldoLinha[k];
  ok('regra antiga: a véspera era descartada (saldo 220, 50, 40)',
     [sl(velho, '501106005|L1|20261008'), sl(velho, '501141007|L2|20261005'), sl(velho, '501097001|L3|20261008')], [220, 50, 40]);
  ok('regra nova: a véspera abate o lote (sobra 1) e sexta → segunda também (0)',
     [sl(novo, '501106005|L1|20261008'), sl(novo, '501141007|L2|20261005')], [1, 0]);
  ok('3 dias úteis antes NÃO abate: passa da janela', sl(novo, '501097001|L3|20261008'), 40);
  ok('o lote velho aberto do código come primeiro; a sobra vai para o novo',
     [sl(novo, '501070005|L4|20261001'), sl(novo, '501070005|L5|20261008')], [0, 0]);
  ok('o atraso cai, a meta do dia não muda', [velho.atrasoTotal, novo.atrasoTotal, velho.programadoHoje === novo.programadoHoje], [340, 41, true]);
}

console.log('\n── ENCERRAR ──');
{
  const prog = [
    // célula PRODUZIDO vazia (linha nunca calculada): passa inteira pelo FIFO, com o adiantamento
    { lote: 'L1', data: '07/10/2026', cod: '501106005', qtde: 220, enc: 'X' },
    // atraso real que não vai ser feito
    { lote: 'L2', data: '29/09/2026', cod: '501140002', qtde: 410, prod: 99, status: 'EM ATRASO', enc: 'X' },
    // lote DE HOJE encerrado com 60 de 100
    { lote: 'L3', data: '09/10/2026', cod: '501147002', qtde: 100, prod: 60, status: 'EM ANDAMENTO', enc: 'x' },
    // linha FUTURA marcada: a marca espera a data
    { lote: 'L4', data: '12/10/2026', cod: '501060004', qtde: 80, enc: 'X' },
    // linha normal, para comparar
    { lote: 'L5', data: '09/10/2026', cod: '501061001', qtde: 50 },
  ];
  const log = [['06/10/2026', '501106005', 219], ['29/09/2026', '501140002', 99], ['09/10/2026', '501147002', 60]];
  const m = montar(prog, log);
  const antes = m.calc();
  ok('ENCERRADA de hoje: a meta do dia continua com a QTDE original (100 + 50)', antes.programadoHoje, 150);
  ok('o saldo das encerradas não é cobrado: atraso 0, falta de hoje só da linha normal', [antes.atrasoTotal, antes.hojeRestante], [0, 50]);
  const r1 = m.rodar();
  const A = m.ABAS.PROGRAMACAO_CONCLUIDA, P = m.ABAS.PROGRAMACAO;
  const NOMES = ['QTD_CX', 'PRODUZIDO', 'SALDO', 'PERCENTUAL', 'STATUS', 'ENCERRAR'];
  ok('célula vazia: passa inteira e sai com as 219 adiantadas', campos(A, linha(A, 'L1', '501106005'), NOMES), [220, 219, 0, 99, 'ENCERRADO', 'X']);
  ok('o atraso real sai com o que fez (99 de 410)', campos(A, linha(A, 'L2', '501140002'), NOMES), [410, 99, 0, 24, 'ENCERRADO', 'X']);
  ok('o de hoje sai com 60 de 100', campos(A, linha(A, 'L3', '501147002'), NOMES), [100, 60, 0, 60, 'ENCERRADO', 'x']);
  ok('as três saem da PROGRAMACAO; a futura e a normal ficam', [r1.a.arquivadas, !!linha(P, 'L4', '501060004'), !!linha(P, 'L5', '501061001')], [3, true, true]);
  ok('linha futura marcada fica em branco até a data', campos(P, linha(P, 'L4', '501060004'), ['PRODUZIDO', 'STATUS']), ['', '']);
  ok('a meta do dia continua 150 depois de arquivar (a CONCLUIDA conta)', r1.p.programadoHoje, 150);
  // produção NOVA dos códigos encerrados não volta para as linhas fechadas
  m.ABAS.PRODUCAO_PRODUTO.push(['09/10/2026', '09:00', '501140002', 'X', 50], ['09/10/2026', '09:00', '501106005', 'X', 10]);
  const r2 = m.rodar();
  const it = c => r2.p.lista.find(x => x.codigo === c) || {};
  ok('caixa nova de código encerrado não reabre a linha (atraso continua 0)', [r2.p.atrasoTotal, it('501140002').falta, it('501106005').falta], [0, 0, 0]);
  ok('e a CONCLUIDA não muda', campos(A, linha(A, 'L2', '501140002'), ['PRODUZIDO', 'STATUS']), [99, 'ENCERRADO']);
}

console.log('\n── ENCERRAR congela no PRODUZIDO do lançamento anterior ──');
{
  // lote velho com 40 de 100 já gravados; o PPCP marca X; o lançamento que
  // dispara a rodada traz 30 cx do MESMO código, para o lote de hoje
  const prog = [
    { lote: 'L6', data: '01/10/2026', cod: '501134001', qtde: 100, prod: 40, status: 'EM ATRASO', enc: 'X' },
    { lote: 'L7', data: '09/10/2026', cod: '501134001', qtde: 100 },
  ];
  const m = montar(prog, [['01/10/2026', '501134001', 40], ['09/10/2026', '501134001', 30]]);
  m.rodar();
  const A = m.ABAS.PROGRAMACAO_CONCLUIDA, P = m.ABAS.PROGRAMACAO;
  ok('a encerrada fecha com os 40 que tinha — não come o lançamento novo', campos(A, linha(A, 'L6', '501134001'), ['PRODUZIDO', 'STATUS']), [40, 'ENCERRADO']);
  ok('as 30 caixas novas vão para o lote de hoje', campos(P, linha(P, 'L7', '501134001'), ['PRODUZIDO', 'SALDO', 'STATUS']), [30, 70, 'EM ANDAMENTO']);
}

console.log('\n── o PRODUZIDO só vale como teto quando é DESTA linha ──');
{
  const m = montar([], []);
  const pc = (p, sd, st, q) => vm.runInContext(`_produzidoConfiavel(${JSON.stringify(p)}, ${JSON.stringify(sd)}, ${JSON.stringify(st)}, ${q})`, m.ctx);
  ok('PRODUZIDO + SALDO = QTDE → vale', [pc(60, 40, 'EM ANDAMENTO', 100), pc(0, 410, 'EM ATRASO', 410), pc('60', '40', '', 100)], [60, 0, 60]);
  ok('ENCERRADO com saldo 0 → vale', [pc(99, 0, 'ENCERRADO', 410), pc(99, '', 'ENCERRADO', 410)], [99, 99]);
  ok('vazio, ou de outra linha (extrato colado por cima) → não vale',
     [pc('', '', '', 100), pc(300, 100, 'EM ATRASO', 100), pc(60, '', 'EM ANDAMENTO', 100), pc(150, 0, 'ENCERRADO', 100)], [null, null, null, null]);
}

console.log('\n── X numa linha de HOJE antes do 1º lançamento do dia ──');
{
  // E (hoje) chega com PRODUZIDO vazio: ontem ela era futura. O PPCP marca X às
  // 06:50 porque não vai fazer; o 1º lançamento são 220 cx do código, adiantando
  // o lote N de terça. Antes, E comia as 220 e N ficava 0/220 na terça.
  const prog = [
    { lote: 'E', data: '09/10/2026', cod: '501106005', qtde: 220, enc: 'X' },
    { lote: 'N', data: '13/10/2026', cod: '501106005', qtde: 220 },
  ];
  const m = montar(prog, [['09/10/2026', '501106005', 220]]);
  m.rodar();
  const A = m.ABAS.PROGRAMACAO_CONCLUIDA, P = m.ABAS.PROGRAMACAO;
  ok('E fecha com o que tinha ANTES de hoje (0), não com o lançamento do dia', campos(A, linha(A, 'E', '501106005'), ['PRODUZIDO', 'STATUS']), [0, 'ENCERRADO']);
  m.setHoje('13/10/2026');
  const r = m.rodar();
  ok('na terça, as 220 de sexta abatem o N (2 dias úteis)', campos(P, linha(P, 'N', '501106005'), ['PRODUZIDO', 'SALDO', 'STATUS']), [220, 0, 'CONCLUIDO (ADIANTADO)']);
  ok('e nada fica cobrado do código', (r.p.lista.find(x => x.codigo === '501106005') || { falta: 0 }).falta, 0);
}

console.log('\n── extrato do ERP colado por cima: a célula é de outra linha ──');
{
  // B herdou a posição do lote A (400 cx, 300 feitas): PRODUZIDO 300, SALDO 100.
  // B tinha 20; o PPCP marca X; o lançamento traz 70 para o lote C de hoje.
  const prog = [
    { lote: 'B', data: '05/10/2026', cod: '501140002', qtde: 100, prod: 300, saldo: 100, status: 'EM ATRASO', enc: 'X' },
    { lote: 'C', data: '09/10/2026', cod: '501140002', qtde: 100 },
  ];
  const m = montar(prog, [['05/10/2026', '501140002', 20], ['09/10/2026', '501140002', 70]]);
  m.rodar();
  const A = m.ABAS.PROGRAMACAO_CONCLUIDA, P = m.ABAS.PROGRAMACAO;
  ok('B fecha com os 20 dele, não com 90 (teto 300 da linha de cima)', campos(A, linha(A, 'B', '501140002'), ['PRODUZIDO', 'PERCENTUAL', 'STATUS']), [20, 20, 'ENCERRADO']);
  ok('as 70 de hoje ficam no C', campos(P, linha(P, 'C', '501140002'), ['PRODUZIDO', 'SALDO']), [70, 30]);
}

console.log('\n── linhas IGUAIS encerradas: cada uma com o seu, sem crescer ──');
{
  // Duas linhas sem LOTE (não saem da aba), mesmo código e data, 100 cada,
  // 120 cx no dia; e o lote de hoje do código. Antes, cada uma recebia a SOMA,
  // ela voltava como teto e crescia a cada lançamento: 40 → 80 → 160 → 200.
  const prog = [
    { lote: '', data: '05/10/2026', cod: '501140002', qtde: 100, enc: 'X' },
    { lote: '', data: '05/10/2026', cod: '501140002', qtde: 100, enc: 'X' },
    { lote: 'L2', data: '09/10/2026', cod: '501140002', qtde: 300 },
  ];
  const m = montar(prog, [['05/10/2026', '501140002', 120]]);
  const P = m.ABAS.PROGRAMACAO;
  const iP = col(P, 'PRODUZIDO');
  const enc = () => P.slice(1).filter(r => r[col(P, 'LOTE')] === '').map(r => r[iP]);
  m.rodar();
  ok('cada linha com o que ELA recebeu (100 + 20 = as 120 do dia)', enc(), [100, 20]);
  for (let k = 0; k < 4; k++) { m.ABAS.PRODUCAO_PRODUTO.push(['09/10/2026', '09:00', '501140002', 'X', 40]); m.rodar(); }
  ok('quatro lançamentos depois, as encerradas não cresceram', enc(), [100, 20]);
  ok('e as 160 caixas de hoje foram todas para o L2', campos(P, linha(P, 'L2', '501140002'), ['PRODUZIDO', 'SALDO']), [160, 140]);
}
{
  // Mesma coisa COM lote: as duas saem para a CONCLUIDA — com 100 e 50, não 150 e 150.
  const prog = [
    { lote: 'L1', data: '05/10/2026', cod: '501140003', qtde: 100, enc: 'X' },
    { lote: 'L1', data: '05/10/2026', cod: '501140003', qtde: 100, enc: 'X' },
  ];
  const m = montar(prog, [['05/10/2026', '501140003', 150]]);
  m.rodar();
  const A = m.ABAS.PROGRAMACAO_CONCLUIDA;
  ok('com LOTE, a CONCLUIDA recebe 100 e 50 (soma = o que foi feito)',
     A.slice(1).map(r => r[col(A, 'PRODUZIDO')]).sort((a, b) => b - a), [100, 50]);
}

console.log('\n── arquivar não troca o empate da mesma data ──');
{
  // A e B do mesmo código e data, 100 cada; 100 feitas no dia. A fecha e vai
  // para a CONCLUIDA; na rodada seguinte B (aba ativa, lida primeiro) levava as
  // mesmas 100 e fechava também — a caixa contava duas vezes.
  const prog = [
    { lote: 'A', data: '09/10/2026', cod: '501061001', qtde: 100 },
    { lote: 'B', data: '09/10/2026', cod: '501061001', qtde: 100 },
  ];
  const m = montar(prog, [['09/10/2026', '501061001', 100]]);
  const r1 = m.rodar();
  ok('A fecha e sai', [r1.a.arquivadas, !!linha(m.ABAS.PROGRAMACAO_CONCLUIDA, 'A', '501061001')], [1, true]);
  const r2 = m.rodar();
  const P = m.ABAS.PROGRAMACAO;
  ok('na rodada seguinte B continua aberto, com 0 — a arquivada entra primeiro',
     [campos(P, linha(P, 'B', '501061001'), ['PRODUZIDO', 'SALDO']), r2.p.hojeRestante, r2.a.arquivadas], [[0, 100], 100, 0]);
}

console.log('\n── lote fechado por produção ADIANTADA fica um dia na aba ──');
{
  // O OFF WHITE (lote 25229, 150) recebeu 444 cx em 07/10 — 294 eram BRANCO
  // apontado errado. A sobra vira crédito e fecha o 25240 de hoje sem uma caixa
  // dele. O FIFO não distingue: a linha fica à vista com STATUS próprio.
  const prog = [
    { lote: '25229', data: '07/10/2026', cod: '501128002', qtde: 150 },
    { lote: '25240', data: '09/10/2026', cod: '501128002', qtde: 200 },
    // vencida ontem, com status da regra antiga: na 1ª rodada também segura
    { lote: '25235', data: '08/10/2026', cod: '501128005', qtde: 100, prod: 0, status: 'EM ATRASO' },
    // crédito pequeno + produção do dia: CONCLUIDO normal, sai na hora
    { lote: '25236', data: '08/10/2026', cod: '501128006', qtde: 200 },
  ];
  const log = [['07/10/2026', '501128002', 444], ['07/10/2026', '501128005', 100],
               ['07/10/2026', '501128006', 20], ['08/10/2026', '501128006', 180]];
  const m = montar(prog, log);
  const sim = m.simular();
  ok('o simularArquivamento lista as que ficam para conferir', (sim.seguradas || []).map(x => x.lote).sort(), ['25235', '25240']);
  const r1 = m.rodar();
  const P = m.ABAS.PROGRAMACAO;
  ok('o lote de hoje sai CONCLUIDO (ADIANTADO) e fica na aba',
     campos(P, linha(P, '25240', '501128002'), ['PRODUZIDO', 'SALDO', 'STATUS']), [200, 0, 'CONCLUIDO (ADIANTADO)']);
  ok('a vencida também fica (o status acabou de mudar)', campos(P, linha(P, '25235', '501128005'), ['STATUS']), ['CONCLUIDO (ADIANTADO)']);
  ok('com a maior parte feita no dia, CONCLUIDO normal e sai junto com o 25229',
     [!!linha(P, '25236', '501128006'), !!linha(P, '25229', '501128002'), r1.a.arquivadas], [false, false, 2]);
  m.setHoje('12/10/2026');
  const r2 = m.rodar();
  ok('no dia útil seguinte, as duas saem para a CONCLUIDA com o status',
     [r2.a.arquivadas, campos(m.ABAS.PROGRAMACAO_CONCLUIDA, linha(m.ABAS.PROGRAMACAO_CONCLUIDA, '25240', '501128002'), ['STATUS'])],
     [2, ['CONCLUIDO (ADIANTADO)']]);
}

console.log('\n── linhas IGUAIS calculadas ANTES do X ──');
{
  // Duas ORDENS do mesmo lote (código, lote e data iguais), 100 cada, 120 cx no
  // dia, e o lote seguinte do código. Somado pela chave, o write-back dava 20/80
  // às duas; com o X cada uma congelava em 20 e soltava 80 cx de crédito.
  const prog = [
    { lote: 'L1', data: '07/10/2026', cod: '501134001', qtde: 100 },
    { lote: 'L1', data: '07/10/2026', cod: '501134001', qtde: 100 },
    { lote: 'L2', data: '09/10/2026', cod: '501134001', qtde: 100 },
  ];
  const m = montar(prog, [['07/10/2026', '501134001', 120]]);
  const r1 = m.rodar();
  const P = m.ABAS.PROGRAMACAO, A = () => m.ABAS.PROGRAMACAO_CONCLUIDA;
  ok('cada linha com o SEU saldo: a de 100 fecha e sai, a outra fica 20/80',
     [r1.a.arquivadas, campos(P, linha(P, 'L1', '501134001'), ['PRODUZIDO', 'SALDO', 'STATUS'])], [1, [20, 80, 'EM ATRASO']]);
  linha(P, 'L1', '501134001')[col(P, 'ENCERRAR')] = 'X';
  m.rodar();
  ok('com o X, ela fecha com os 20 dela — a CONCLUIDA soma as 120 do dia',
     A().slice(1).filter(r => r[col(A(), 'LOTE')] === 'L1').map(r => r[col(A(), 'PRODUZIDO')]), [100, 20]);
  ok('e nenhuma caixa vira crédito do lote seguinte', campos(P, linha(P, 'L2', '501134001'), ['PRODUZIDO', 'SALDO']), [0, 100]);
}

console.log('\n── linha arquivada que volta a ter saldo volta para a aba ──');
{
  // 300 cx lançadas no OFF WHITE em 05/10; 200 eram BRANCO. O crédito fecha o B
  // (07/10), que fica um dia como ADIANTADO e sai. Depois o PPCP corrige o log:
  // o B volta a dever 200 — e tem de estar na aba, não só no número do painel.
  const prog = [
    { lote: 'A', data: '05/10/2026', cod: '501128002', qtde: 100 },
    { lote: 'S', data: '05/10/2026', cod: '501128001', qtde: 200 },
    { lote: 'B', data: '07/10/2026', cod: '501128002', qtde: 200 },
  ];
  const m = montar(prog, [['05/10/2026', '501128002', 300]], { hoje: '07/10/2026' });
  const P = m.ABAS.PROGRAMACAO, A = () => m.ABAS.PROGRAMACAO_CONCLUIDA;
  m.rodar();
  m.setHoje('08/10/2026'); m.rodar();
  ok('o B saiu para a CONCLUIDA como ADIANTADO', campos(A(), linha(A(), 'B', '501128002'), ['PRODUZIDO', 'STATUS']), [200, 'CONCLUIDO (ADIANTADO)']);
  const sim0 = m.simular();
  ok('sem mudança no log, nada volta', (sim0.voltam || []).length, 0);
  m.ABAS.PRODUCAO_PRODUTO.splice(1, 1, ['05/10/2026', '08:00', '501128002', 'X', 100], ['05/10/2026', '08:00', '501128001', 'X', 200]);
  const sim = m.simular();
  ok('o simularArquivamento avisa que ela voltaria', (sim.voltam || []).map(x => [x.lote, x.saldo]), [['B', 200]]);
  const r = m.rodar();
  ok('log corrigido: o B VOLTA para a PROGRAMACAO, com o saldo e o status de verdade',
     [campos(P, linha(P, 'B', '501128002'), ['PRODUZIDO', 'SALDO', 'STATUS']), !!linha(A(), 'B', '501128002')], [[0, 200, 'EM ATRASO'], false]);
  ok('o atraso do painel tem linha que o explique', r.p.atrasoTotal, 200);
  ok('e o BRANCO, agora feito, sai', [!!linha(P, 'S', '501128001'), !!linha(A(), 'S', '501128001')], [false, true]);
}

console.log('\n── apagar o X na CONCLUIDA desfaz o encerramento ──');
{
  // BRANCO 0 de 300 recebeu X e foi para a CONCLUIDA. Depois descobriu-se que
  // 300 das 444 do OFF WHITE eram BRANCO: o PPCP corrige o log e APAGA O X lá.
  const prog = [
    { lote: '25229', data: '07/10/2026', cod: '501128001', qtde: 300, prod: 0, status: 'EM ATRASO', enc: 'X' },
    { lote: '25229', data: '07/10/2026', cod: '501128002', qtde: 150 },
  ];
  const m = montar(prog, [['07/10/2026', '501128002', 444]]);
  const P = m.ABAS.PROGRAMACAO, A = () => m.ABAS.PROGRAMACAO_CONCLUIDA;
  m.rodar();
  ok('encerrada com 0, arquivada', campos(A(), linha(A(), '25229', '501128001'), ['PRODUZIDO', 'STATUS']), [0, 'ENCERRADO']);
  m.ABAS.PRODUCAO_PRODUTO.splice(1, 1, ['07/10/2026', '08:00', '501128002', 'X', 144], ['07/10/2026', '08:00', '501128001', 'X', 300]);
  linha(A(), '25229', '501128001')[col(A(), 'ENCERRAR')] = '';
  m.rodar();
  ok('sem o X ela volta para a aba já recalculada (300 de 300)',
     [campos(P, linha(P, '25229', '501128001'), ['PRODUZIDO', 'SALDO', 'STATUS']), !!linha(A(), '25229', '501128001')], [[300, 0, 'CONCLUIDO'], false]);
  ok('e o OFF WHITE, que agora tem 144 de 150, volta devendo 6', campos(P, linha(P, '25229', '501128002'), ['PRODUZIDO', 'SALDO']), [144, 6]);
  m.rodar();
  ok('na rodada seguinte o BRANCO sai de novo, agora como CONCLUIDO', campos(A(), linha(A(), '25229', '501128001'), ['PRODUZIDO', 'STATUS']), [300, 'CONCLUIDO']);
  ok('encerrada COM o X nunca volta (o saldo dela não é cobrado)', (m.simular().voltam || []).length, 0);
}

console.log('\n── linha mais antiga que entra DEPOIS não toma a encerrada ──');
{
  // E fechou com 60 de 100 (X) e foi para a CONCLUIDA. Depois o PPCP acrescenta
  // O, mais antiga, do mesmo código. Antes, O levava as 60 e a CONCLUIDA
  // continuava dizendo 60 em E: a mesma caixa contada duas vezes (atraso 20).
  const prog = [{ lote: 'E', data: '05/10/2026', cod: '501061009', qtde: 100, prod: 60, status: 'EM ATRASO', enc: 'X' }];
  const m = montar(prog, [['05/10/2026', '501061009', 60]]);
  m.rodar();
  m.ABAS.PROGRAMACAO.push(['O', '02/10/2026', 1, '501061009', 'X', 80, '', '', '', '', '', '']);
  const r = m.rodar();
  const P = m.ABAS.PROGRAMACAO;
  ok('E continua com as 60 dela; O abre com 0 e o atraso é 80', [campos(P, linha(P, 'O', '501061009'), ['PRODUZIDO', 'SALDO']), r.p.atrasoTotal], [[0, 80], 80]);
}

console.log('\n── o encerrado de HOJE sai do "a fazer" (app e Tela E) ──');
{
  const prog = [
    { lote: 'A', data: '09/10/2026', cod: '501061001', qtde: 100 },
    { lote: 'B', data: '09/10/2026', cod: '501061002', qtde: 500, enc: 'X' },
  ];
  const m = montar(prog, [['09/10/2026', '501061001', 100]]);
  const p = m.calc();
  ok('a META do dia continua com os dois (100 + 500)', p.programadoHoje, 600);
  const h = vm.runInContext('getProgramacaoHoje()', m.ctx);
  ok('o app do operador não lista o lote encerrado como "a fazer"', h.produtos.map(x => x.codigo), ['501061001']);
  const B = p.porLote.find(L => L.lote === 'B');
  ok('a Tela E recebe o lote como encerrado', [B.qtde, B.falta, B.encerradas], [0, 0, 1]);
}

console.log('\n── nada interno vai para o painel ──');
{
  const m = montar([{ lote: 'A', data: '09/10/2026', cod: '501061001', qtde: 100 }], []);
  const internos = Object.keys(m.calc()).filter(k => ['lista', 'metaEfetiva', 'programadoHoje', 'atrasoTotal', 'embaladoHoje',
    'hojeRestante', 'faltaZerar', 'porLote'].indexOf(k) < 0).sort();
  const i = GS.indexOf('function getPontosDia(');
  const corpo = GS.slice(i, GS.indexOf('\nfunction ', i + 10));
  const apaga = ((corpo.match(/\[([^\]]*)\]\.forEach\(function \(k\) \{ delete programacao\[k\]; \}\)/) || [])[1] || '')
    .split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean).sort();
  ok('o getPontosDia apaga TODOS os mapas internos do cálculo (saldo, encerrada, adiantado, volta)', apaga, internos);
}

console.log('\n── marca que quer dizer "não" não encerra ──');
{
  const prog = [false, 'FALSE', 0, 'não', true].map((v, i) => ({ lote: 'M' + i, data: '08/10/2026', cod: '50100000' + i, qtde: 10, enc: v }));
  const m = montar(prog, prog.map((l, i) => ['08/10/2026', l.cod, 4]));
  m.rodar();
  const P = m.ABAS.PROGRAMACAO;
  ok('caixa de seleção desmarcada (FALSE), "0" e "não" deixam a linha aberta; TRUE encerra',
     prog.map(l => (campos(P, linha(P, l.lote, l.cod), ['STATUS']) || ['(arquivada)'])[0]),
     ['EM ATRASO', 'EM ATRASO', 'EM ATRASO', 'EM ATRASO', '(arquivada)']);
}

console.log('\n── o crédito espera a data do lote ──');
{
  const prog = [{ lote: 'L8', data: '09/10/2026', cod: '501070005', qtde: 180 }];
  const log = [['07/10/2026', '501070005', 180]];
  const ontem = montar(prog, log, { hoje: '08/10/2026' }).calc();
  ok('na véspera o lote ainda não existe para o FIFO (data futura)', ontem.saldoLinha['501070005|L8|20261009'], undefined);
  const hoje = montar(prog, log, { hoje: '09/10/2026' }).calc();
  ok('no dia dele, o crédito de 07/10 abate o lote inteiro', hoje.saldoLinha['501070005|L8|20261009'], 0);
  const tarde = montar(prog, log, { hoje: '13/10/2026' }).calc();
  ok('o resultado não muda com o passar dos dias (a janela é produção × data do lote, não × hoje)', tarde.saldoLinha['501070005|L8|20261009'], 0);
}

console.log('\n── a coluna ENCERRAR nasce sozinha ──');
{
  const m = montar([{ lote: 'L1', data: '09/10/2026', cod: '501128002', qtde: 150 }], [['09/10/2026', '501128002', 20]]);
  m.ABAS.PROGRAMACAO.forEach(r => r.pop());   // aba como está hoje: sem ENCERRAR
  m.rodar();
  const h = m.ABAS.PROGRAMACAO[0];
  ok('o script cria ENCERRAR no FIM da aba, com o título exato', h[h.length - 1], 'ENCERRAR');
  ok('o LOTE continua sendo a 1ª coluna com LOTE (as chaves casam)', h.findIndex(x => String(x).toUpperCase().includes('LOTE')), 0);
  ok('e o saldo da linha foi gravado normal', campos(m.ABAS.PROGRAMACAO, linha(m.ABAS.PROGRAMACAO, 'L1', '501128002'), ['PRODUZIDO', 'SALDO', 'STATUS']), [20, 130, 'EM ANDAMENTO']);
}

console.log('\n── getProgramacaoHoje: próximos dias úteis ──');
{
  const prog = [
    { lote: 'L1', data: '09/10/2026', cod: '501128002', qtde: 150 },
    { lote: 'L2', data: '12/10/2026', cod: '501060004', qtde: 80 },    // segunda = 1 dia útil
    { lote: 'L3', data: '13/10/2026', cod: '501060005', qtde: 80 },    // terça = 2
    { lote: 'L4', data: '14/10/2026', cod: '501060006', qtde: 80 },    // quarta = 3 → fora
    { lote: 'L5', data: '13/10/2026', cod: '501070001', qtde: 80, enc: 'X' },  // encerrada não conta
  ];
  const m = montar(prog, []);
  const h = vm.runInContext('getProgramacaoHoje()', m.ctx);
  ok('proximos = lotes nos próximos 2 dias úteis (sem a encerrada)', h.proximos.slice().sort(), ['501060004', '501060005']);
  ok('e a quantidade desses lotes (o adiantamento só vale até ela)', h.proximosQtde, { '501060004': 80, '501060005': 80 });
  ok('e a lista do dia continua igual', h.produtos.map(x => x.codigo), ['501128002']);
  vm.runInContext('_codigosProximos = function () { throw new Error("planilha fora"); };', m.ctx);
  const f = vm.runInContext('getProgramacaoHoje()', m.ctx);
  ok('leitura que falha NÃO manda lista vazia (o app leria "nada vem" e acusaria todo adiantamento)',
     [f.ok, 'proximos' in f, 'proximosQtde' in f], [true, false, false]);
}

console.log('\n── app: aviso de cor errada ──');
function pegaMob(assinatura) {
  const i = MJS.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei no mobile: ' + assinatura);
  const j = MJS.indexOf('{', MJS.indexOf(')', i));
  let n = 0;
  for (let k = j; k < MJS.length; k++) {
    if (MJS[k] === '{') n++;
    else if (MJS[k] === '}' && --n === 0) return MJS.slice(i, k + 1);
  }
  throw new Error('função não fecha: ' + assinatura);
}
{
  global.PRODUTOS = [{ codigo: '501.128.001', desc: 'VOL 1/1 MESA CENTRO SLIM', cor: 'BRANCO' },
                     { codigo: '501.128.002', desc: 'VOL 1/1 MESA CENTRO SLIM', cor: 'OFF WHITE' }];
  global.fmtN = n => String(n);
  // as constantes do aviso vêm do próprio app (mudou lá, o teste acompanha)
  vm.runInThisContext(MJS.match(/const COR_AVISO_MIN = \d+, COR_AVISO_PCT = \d+;/)[0].replace('const ', 'var '));
  eval(pegaMob('function normTxt(').replace('function normTxt', 'global.normTxt = function'));
  eval(pegaMob('function corDeProduto(').replace('function corDeProduto', 'global.corDeProduto = function'));
  eval(pegaMob('function avisoCorErrada(').replace('function avisoCorErrada', 'global.avisoCorErrada = function'));
  eval(pegaMob('function avisoCorErradaTxt(').replace('function avisoCorErradaTxt', 'global.avisoCorErradaTxt = function'));
  // 25/09: OFF WHITE com lote de 150 já fechado e o BRANCO do mesmo lote com 300 em aberto
  const prog = [
    { codigo: '501.128.002', desc: 'VOL 1/1 MESA CENTRO SLIM', cor: 'OFF WHITE', lote: 25229, falta: 0 },
    { codigo: '501.128.001', desc: 'VOL 1/1 MESA CENTRO SLIM', cor: 'BRANCO', lote: 25229, falta: 300 },
    { codigo: '501.130.011', desc: 'VOL 1/1 MESA APOIO LUNA 530', cor: 'OFF WHITE', lote: 25230, falta: 40 },
  ];
  const a = avisoCorErrada('501.128.002', 20, prog, []);
  ok('lote do código fechado e cor irmã com saldo → avisa, apontando a irmã', a && [a.falta, a.cor, a.irmas.map(p => p.cor)], [0, 'OFF WHITE', ['BRANCO']]);
  ok('o texto diz a cor irmã e o saldo (sem número de lote, que pode não ser o do saldo)',
     [/BRANCO \(300 cx\)/.test(avisoCorErradaTxt(a, 20)), /lote/.test(avisoCorErradaTxt(a, 20))], [true, false]);
  ok('dentro do saldo do próprio código → não avisa',
     avisoCorErrada('501.128.001', 20, prog, []), null);
  ok('código com lote nos próximos dias úteis é ADIANTAMENTO → não avisa (até a quantidade do lote)',
     [avisoCorErrada('501.128.002', 20, prog, ['501128002'], { '501128002': 200 }),
      avisoCorErrada('501.128.002', 200, prog, ['501128002'], { '501128002': 200 })], [null, null]);
  const alem = avisoCorErrada('501.128.002', 444, prog, ['501128002'], { '501128002': 200 });
  ok('passou até do lote dos próximos dias (444 contra 200) → avisa, e o texto diz o que vem',
     alem && [alem.prox, alem.exc, /200 programadas para os próximos dias/.test(avisoCorErradaTxt(alem, 444))], [200, 244, true]);
  ok('sem a lista dos próximos dias (backend antigo, leitura que falhou) → não acusa',
     [avisoCorErrada('501.128.002', 20, prog, null), avisoCorErrada('501.128.002', 20, prog, ['501128002'])], [null, null]);
  ok('excedente pequeno (lança 50 com 48 em aberto) → não avisa',
     avisoCorErrada('501.128.002', 50, prog.map(p => p.cor === 'OFF WHITE' ? Object.assign({}, p, { falta: 48 }) : p), []), null);
  ok('mesmo modelo de 6 dígitos mas OUTRO produto (501130 tem quatro mesas) → não avisa',
     avisoCorErrada('501.130.015', 20, prog.concat([{ codigo: '501.130.015', desc: 'VOL 1/1 MESA LATERAL LUNA 440', cor: 'CUMARU', falta: 0 }]), []), null);
  ok('sem cor irmã em aberto → não avisa',
     avisoCorErrada('501.128.002', 20, prog.map(p => Object.assign({}, p, { falta: 0 })), []), null);
  ok('passa do saldo (sobram 10, lança 20) com irmã em aberto → avisa com o saldo que sobrou',
     (avisoCorErrada('501.128.002', 20, prog.map(p => p.cor === 'OFF WHITE' ? Object.assign({}, p, { falta: 10 }) : p), []) || {}).falta, 10);
  ok('passa do saldo mas a irmã está zerada → não é troca, não avisa',
     avisoCorErrada('501.128.001', 320, prog, []), null);
  const SL = pegaMob('async function salvarLanc(');
  ok('o aviso vem ANTES do SALVANDO; TROCAR A COR não grava e abre o seletor',
     [SL.indexOf('avisoCorErrada(codLanc') > 0 && SL.indexOf('avisoCorErrada(codLanc') < SL.indexOf("btn.textContent='SALVANDO...'"),
      /if\(!seguir\)\{ abrirModalProduto\(\); return; \}/.test(SL)], [true, true]);
  ok('o destaque (laranja) fica no TROCAR A COR, não no seguir em frente',
     [/cancelar:'TROCAR A COR', seguro:'cancelar'/.test(SL), /document\.getElementById\('cf-cancel'\)\.className = inv \? 'btn-salvar'/.test(MJS)], [true, true]);
  ok('e vai para a DIREITA, no lugar do ADICIONAR (toque duplo não confirma a cor errada)',
     /parentNode\.style\.flexDirection = inv \? 'row-reverse' : ''/.test(MJS), true);
  ok('toque nos primeiros 400 ms depois de abrir não responde a pergunta',
     [/const CONFIRMA_TRAVA_MS = 400;/.test(MJS), /if\(Date\.now\(\) - _confirmaDesde < CONFIRMA_TRAVA_MS\) return;/.test(MJS),
      /id="cf-ok" onclick="_confirmaClique\(true\)"/.test(MOB), /id="cf-cancel" onclick="_confirmaClique\(false\)"/.test(MOB)], [true, true, true, true]);
  // bipe com o lançamento aberto: só troca o produto
  {
    let reabriu = 0, resolvido = null;
    global.produtoPorEan = () => ({ codigo: '501.128.001', desc: 'VOL 1/1 MESA CENTRO SLIM', cor: 'BRANCO' });
    global.selecionarProduto = c => { global.PROD_ATUAL = c; };
    global.bipeToast = () => {}; global.bipeSom = () => {}; global.nomeComCor = d => d; global.eanCore = x => x;
    global.abrirLancSlotAtivo = () => { reabriu++; };
    global._confirmaResolve = v => { resolvido = v; global._confirmaCb = null; };
    const abertos = { 'modal-lanc': true };
    global.document = { getElementById: id => ({ classList: { contains: () => !!abertos[id] } }) };
    eval(pegaMob('function processarBipe(').replace('function processarBipe', 'global.processarBipe = function'));
    global._slotAtivo = { inicio: '12:12' }; global._confirmaCb = () => {}; global._confirmaTag = 'cor';
    processarBipe('7898599078424');
    ok('bipe com o lançamento aberto troca o produto, NÃO reabre na hora corrente, e responde o CONFERIR A COR',
       [global.PROD_ATUAL, reabriu, resolvido], ['501.128.001', 0, false]);
    abertos['modal-lanc'] = false; global._slotAtivo = null; global._confirmaCb = null; global._confirmaTag = '';
    processarBipe('7898599078424');
    ok('sem lançamento aberto, o bipe abre a hora corrente como sempre', reabriu, 1);
    delete global.document;
  }
  ok('depois de gravar, o saldo local do código desconta o lançado', /it\.falta=Math\.max\(0,\(Number\(it\.falta\)\|\|0\)-add\)/.test(SL), true);
  ok('código e slot guardados antes da pergunta; mudou durante ela, não grava',
     [/const codLanc = PROD_ATUAL, slotLanc = _slotAtivo;/.test(SL), /if\(_slotAtivo!==slotLanc \|\| PROD_ATUAL!==codLanc\) return;/.test(SL),
      /params\.push\('produto='\+encodeURIComponent\(codLanc\)\)/.test(SL)], [true, true, true]);
  ok('não julga com a lista de outro dia nem com uma velha (sem acusar à toa)',
     /const listaOk = PROG_HOJE_DIA===hojeStr\(\) && Date\.now\(\)-PROG_HOJE_TS <= PROG_HOJE_MAX;/.test(SL), true);
  const CR = pegaMob('async function cicloRefresh(');
  ok('a lista do dia é relida no ciclo do operador, em sequência — nunca em paralelo depois de gravar',
     [/if\(PERFIL==='operador' && Date\.now\(\)-PROG_HOJE_TS > PROG_HOJE_TTL\) await passo\(carregarProgramacaoHoje\);/.test(CR),
      /carregarProgramacaoHoje/.test(SL)], [true, false]);
  ok('COR CERTA vale para o código o resto do dia (não pergunta a cada caixa)',
     [/const jaConf = COR_OK\.dia===hojeStr\(\) && !!COR_OK\.cod\[kLanc\];/.test(SL), /COR_OK\.cod\[kLanc\] = 1;/.test(SL)], [true, true]);
  ok('o confirmar abre POR CIMA do modal de lançamento', /#modal-confirma\{z-index:120\}/.test(MOB), true);
  ok('o app guarda os próximos dias úteis do backend', /PROG_PROX = Array\.isArray\(json\.proximos\) \? json\.proximos : null;/.test(MJS), true);
}

console.log('\n── painel: aba PROGRAMAÇÃO ──');
{
  const JS7 = [...V7.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  ok('linha encerrada mostra ENCERRADO, nunca "✓ OK" nem a falta de outra linha; FORA DA ESTEIRA vence, como na planilha',
     /const fechada=it\.foraEsteira\?'FORA DA ESTEIRA':\(it\.encerrada\?'ENCERRADO':''\);/.test(JS7) && /const faltaTxt=fechada\|\|/.test(JS7), true);
  ok('o backend só marca encerrada linha vencida ou de hoje, e fora da esteira não', /encerrada:\s+!!pr\.encerrada && !futura && !pr\.foraEsteira/.test(GS), true);
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ programação ok — adiantamento abate o lote, ENCERRAR fecha sem apagar, o app pergunta a cor');
process.exit(falhas ? 1 : 0);
