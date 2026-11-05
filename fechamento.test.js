// FECHAR DIA: a linha do HISTORICO sai da PLANILHA, não do retrato do painel.
//   node fechamento.test.js
//
// PPCP, 20/10/2026 ("GS NOVO"). A linha de 19/10/2026 do HISTORICO gravou
// REALIZADO 1.491 e EF 128,9% com a UEP de 1.509 cx (3.542,4) — o log de
// produto e a HISTORICO_HORA tinham 1.509. O fechamento das 17:05 roda no
// NAVEGADOR do painel (fecharDiaAutomatico → salvarDiaSheets) e mandava o
// realizado da última leitura dele; a UEP o saveDay calcula no .gs, lendo o
// log na hora. As 18 cx da PENTEADEIRA CAMARIM MEL (501060003) da hora das
// 16:00 entraram nesse intervalo.
//
// O .gs é carregado INTEIRO numa planilha de mentira (como no
// exclusao.test.js): o saveDay e o arquivarDiaAtual rodam o caminho real.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const GS = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}
function pega(assinatura) {
  const i = GS.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei: ' + assinatura);
  const j = GS.indexOf('{', GS.indexOf(')', i));
  let n = 0;
  for (let k = j; k < GS.length; k++) {
    if (GS[k] === '{') n++;
    else if (GS[k] === '}' && --n === 0) return GS.slice(i, k + 1);
  }
  throw new Error('função não fecha: ' + assinatura);
}

// ── 19/10/2026, como estava na planilha (os LANÇ de cada hora = o log) ──
const HDR_HORA = ['HORA', 'META', 'REALIZADO', 'LANÇ 1', 'LANÇ 2', 'LANÇ 3', 'LANÇ 4', 'LANÇ 5', 'LANÇ 6', 'LANÇ 7', 'LANÇ 8', 'LANÇ 9', 'LANÇ 10'];
const HORAS_1910 = [
  ['07:00-08:00', [180]], ['08:00-09:00', [97, 108]], ['09:00-10:00', [58, 47, 36]],
  ['10:00-11:00', [12, 20, 20, 36]], ['12:12-13:00', [23, 79, 36]], ['13:00-14:00', [144]],
  ['14:00-15:00', [26, 10, 39, 55, 45]], ['15:00-16:00', [110, 114, 39]],
  ['16:00-16:59', [34, 50, 23, 1, 49, 18]],   // 175 — o painel fechou com 157
];
const linhaHora = (rot, meta, lancs) => [rot, meta, lancs.reduce((a, b) => a + b, 0)].concat(lancs);
const LOG_1910 = [
  ['07:00', '501141005', 180], ['08:00', '501141005', 97], ['08:00', '501141004', 108], ['09:00', '501141004', 58],
  ['09:00', '501141006', 47], ['09:00', '501139001', 36], ['10:00', '501139001', 12], ['10:00', '501061003', 20],
  ['10:00', '501061004', 20], ['10:00', '501139003', 36], ['12:12', '501139003', 23], ['12:12', '501139004', 79],
  ['12:12', '501139002', 36], ['13:00', '501139002', 144], ['14:00', '501139002', 26], ['14:00', '501128001', 10],
  ['14:00', '501072003', 39], ['14:00', '501128004', 55], ['14:00', '501072006', 45], ['15:00', '501128002', 110],
  ['15:00', '501072006', 114], ['15:00', '501153003', 39], ['16:00', '501153003', 34], ['16:00', '501153004', 50],
  ['16:00', '501153001', 23], ['16:00', '501153001', 1], ['16:00', '501060005', 49], ['16:00', '501060003', 18],
];
// UEP do cadastro em 19/10/2026 (base SLEEP), por código.
const UEP_CAD = { '501141004': '2,22', '501141005': '2,22', '501141006': '2,22', '501139001': '2,69', '501139002': '2,69',
  '501139003': '2,69', '501139004': '2,69', '501061003': '2,64', '501061004': '3,05', '501128001': '1,07', '501128002': '1,07',
  '501128004': '1,07', '501072003': '2,59', '501072006': '2,59', '501153001': '3,04', '501153003': '3,04', '501153004': '3,04',
  '501060003': '2,08', '501060005': '2,08' };

function montar(o) {
  o = o || {};
  const horas = o.horas || [['05:00-06:00', '', 0], ['06:00-07:00', '', 0]]
    .concat(HORAS_1910.map(([rot, l], i) => linhaHora(rot, i < 8 ? '129' : '125', l)));
  const ABAS = {
    HORA_A_HORA: [[], ['PAINEL HORA A HORA', '', '', 'LANÇAMENTOS'], ['META DO DIA', '1157', '7'], HDR_HORA.slice()]
      .concat(horas).concat([['TOTAL', '1.157', 0]]),
    PRODUCAO_PRODUTO: [['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS', 'PONTOS', 'PESO_KG', 'OPERADOR']]
      .concat(LOG_1910.map(([h, c, cx]) => ['19/10/2026', h, c, 'VOL 1/1 X', cx, 0, 0, 'Mobile'])),
    PRODUTO_CODIGO: [['CODIGO', 'DESCRICAO', 'COR', 'UEP', 'UEP_VIGENCIA']]
      // O CODIGO real é NÚMERO (os pontos de "501.141.005" são só o formato da célula).
      .concat(Object.keys(UEP_CAD).map(c => [Number(c), 'VOL 1/1 X', 'COR', UEP_CAD[c], '16/10/2026'])),
    CONFIG_PAINEL: [['CHAVE', 'VALOR'], ['META_UEP', '3048']],
    // O cabeçalho real: MEDIA CX/H é a 10ª coluna, HE CX a 11ª, UEP/UEP HE/META UEP
    // da 12ª à 14ª, e a v5.55 escreve META DIA e ATRASO META na 15ª e 16ª.
    HISTORICO: (o.hist || [['DATA', 'REALIZADO', 'META', 'EFICIÊNCIA %', 'MELHOR H.', 'PIOR H.', 'HE', 'FECHADO', 'FECHADO EM',
      'MEDIA CX/H', 'HE CX', 'UEP', 'UEP HE', 'META UEP']]).map(r => r.slice()),
  };
  function aba(nome) {
    const v = ABAS[nome];
    if (!v) return null;
    return {
      getName: () => nome, getLastRow: () => v.length, getLastColumn: () => Math.max(1, ...v.map(r => r.length)),
      getMaxRows: () => 1000,
      getDataRange: () => ({ getValues: () => v.map(r => r.slice()) }),
      getRange: (l, c, nl, nc) => ({
        getValues: () => { const out = []; for (let i = 0; i < (nl || 1); i++) { const r = v[l - 1 + i] || []; const x = []; for (let j = 0; j < (nc || 1); j++) x.push(r[c - 1 + j] === undefined ? '' : r[c - 1 + j]); out.push(x); } return out; },
        getValue: () => ((v[l - 1] || [])[c - 1] === undefined ? '' : v[l - 1][c - 1]),
        setValue: x => { (v[l - 1] = v[l - 1] || [])[c - 1] = x; },
        setValues: xs => xs.forEach((row, k) => { const r = v[l - 1 + k] = v[l - 1 + k] || []; row.forEach((x, j) => { r[c - 1 + j] = x; }); }),
        setNumberFormat: () => {}, getFormula: () => '',
      }),
      appendRow: r => { v.push(r.slice()); },
      deleteRow: l => { v.splice(l - 1, 1); },
      setFrozenRows: () => {},
    };
  }
  const ss = { getSheetByName: aba, insertSheet: nome => { ABAS[nome] = []; return aba(nome); }, getName: () => 'teste' };
  // `dataDados` é o carimbo de a qual dia pertence a HORA_A_HORA (gravado a cada lançamento).
  const PROPS = { dataDados: 'carimbo' in o ? o.carimbo : '19/10/2026' };
  const LOGS = [];
  const LOCK = { wait: 0, rel: 0 };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    Utilities: { formatDate: (d, tz, f) => f === 'yyyy' ? '2026' : (/HH/.test(f) ? '19/10/2026 17:05' : '19/10/2026') },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in PROPS ? PROPS[k] : null),
      setProperty: (k, x) => { PROPS[k] = x; }, deleteProperty: k => { delete PROPS[k]; } }) },
    LockService: { getScriptLock: () => ({ waitLock: () => { LOCK.wait++; }, releaseLock: () => { LOCK.rel++; } }) },
    Logger: { log: m => LOGS.push(String(m)) },
  };
  vm.createContext(ctx);
  vm.runInContext(GS, ctx);
  const run = code => vm.runInContext('(function(){ ' + code + ' })()', ctx);
  return { ABAS, run, LOGS, LOCK };
}

// O que o painel mandou às 17:05:57 de 19/10/2026 (o retrato dele: 16:00 = 157).
const PAINEL = { data: '19/10/2026', real: '1491', meta: '1157', ef: '128.9', melhor: '263', pior: '88',
  he: '0', heCx: '0', mediaH: '166', fechadoEm: '19/10/2026, 17:05:57' };
const saveDay = (P, p) => P.run('return saveDay(' + JSON.stringify(Object.assign({}, PAINEL, p || {})) + ');');
const hist = P => P.ABAS.HISTORICO.slice(1);

console.log('\n── o caso de 19/10/2026: o painel manda 1.491, a planilha tem 1.509 ──');
{
  const P = montar();
  const r = saveDay(P);
  ok('grava a produção da HORA_A_HORA, com a META e o FECHADO EM do painel (v5.55: + META DIA e ATRASO META)',
     hist(P)[0], ['19/10/2026', 1509, 1157, 130.4, 263, 88, 0, true, '19/10/2026, 17:05:57', 168, 0, 3542.4, 0, 3048, 1157, 0]);
  ok('a UEP da mesma linha é a das mesmas 1.509 cx (já era — é ela que mostrou o defeito)', hist(P)[0][11], 3542.4);
  ok('o retorno diz de onde saiu e o que o painel tinha', [r.ok, r.fonte, r.real, r.realPainel], [true, 'planilha', 1509, 1491]);
  ok('a diferença fica no log de execução', P.LOGS.some(l => /19\/10\/2026: painel mandou 1491 cx, a HORA_A_HORA tem 1509/.test(l)), true);
  saveDay(P);
  ok('fechar de novo continua sendo upsert (uma linha só)', hist(P).length, 1);
}

console.log('\n── a mesma conta do fechamento das 23:59 ──');
{
  // Com hora extra: madrugada liberada pela C3 (HE pelo HORÁRIO) e a linha rotulada
  // COMO O addHE A CRIA: REALIZADO vazio (a fórmula só existe nas horas do turno)
  // e as caixas só no LANÇ 1 — é o ramo da soma dos LANÇ do laço.
  const horas = [['05:00-06:00', '', 100, 100], ['06:00-07:00', '', 0]]
    .concat(HORAS_1910.map(([rot, l], i) => linhaHora(rot, i < 8 ? '129' : '125', l)))
    .concat([['HE 17:00-18:00', '100', '', 40]]);
  const A = montar({ horas }), B = montar({ horas });
  saveDay(A, { real: '1600' });
  B.run("arquivarDiaAtual('19/10/2026');");
  const a = hist(A)[0], b = hist(B)[0];
  const producao = l => [l[1], l[4], l[5], l[6], l[9], l[10], l[11], l[12]];
  ok('REALIZADO, MELHOR, PIOR, HE, MEDIA, HE CX e UEP iguais aos do arquivarDiaAtual', producao(a), producao(b));
  ok('com HE: 1.649 cx, 2 horas extras, 140 cx nelas', [a[1], a[6], a[10]], [1649, 2, 140]);
  ok('a META é a do painel (a da aba exclui só a linha rotulada HE)', [a[2], b[2]], [1157, 1157]);
  ok('a EF é REALIZADO ÷ META da própria linha', a[3], Number((1649 / 1157 * 100).toFixed(1)));
  ok('META DIA e ATRASO META: a mesma soma por hora nos dois fechamentos (a linha HE fica fora)',
     [a[14], a[15], b[14], b[15]], [1157, 0, 1157, 0]);
  ok('dia fechado pelo painel continua com prioridade sobre o das 23:59', (() => {
    B.ABAS.HISTORICO[1][7] = true; B.ABAS.HISTORICO[1][1] = 1;
    B.run("arquivarDiaAtual('19/10/2026');");
    return hist(B)[0][1];
  })(), 1);
}

console.log('\n── o que a aba diz e o painel não sabia ──');
{
  const P = montar();
  saveDay(P, { meta: '1300' });
  ok('a META é a do PAINEL mesmo quando a aba soma outra (aqui 1.157): META 1.300, EF 1.509 ÷ 1.300',
     hist(P)[0].slice(1, 4), [1509, 1300, Number((1509 / 1300 * 100).toFixed(1))]);

  // Hora de jornada fechada em ZERO (10:00): o painel manda PIOR 0 e a média por 9 horas.
  const zero = HORAS_1910.map(([rot, l], i) => linhaHora(rot, i < 8 ? '129' : '125', rot === '10:00-11:00' ? [] : l));
  const Z = montar({ horas: [['05:00-06:00', '', 0], ['06:00-07:00', '', 0]].concat(zero) });
  saveDay(Z, { real: '1421', melhor: '200', pior: '0', mediaH: '158', ef: '122.8' });
  ok('hora fechada em zero: MELHOR e PIOR saem da aba e a hora sem caixa fica fora (regra das 23:59)',
     [hist(Z)[0][1], hist(Z)[0][4], hist(Z)[0][5], hist(Z)[0][9]], [1421, 263, 138, Math.round(1421 / 8)]);

  // Só hora extra produziu (FECHAR DIA antes das 07:00 num dia com C3=5).
  const soHE = [['05:00-06:00', '', 100, 100], ['06:00-07:00', '', 50, 50]]
    .concat(HORAS_1910.map(([rot], i) => linhaHora(rot, i < 8 ? '129' : '125', [])));
  const H = montar({ horas: soHE });
  saveDay(H, { real: '100', melhor: '0', pior: '0', he: '1', heCx: '100', mediaH: '0', ef: '8.6' });
  ok('produção só em HE: PIOR 0 e MEDIA 0 (nunca vazio nem Infinity), 2 horas e 150 cx em HE',
     [hist(H)[0][1], hist(H)[0][4], hist(H)[0][5], hist(H)[0][6], hist(H)[0][9], hist(H)[0][10]], [150, 0, 0, 2, 0, 150]);

  // Madrugada lançada e depois escondida pela C3 (5 → 7 à tarde): o painel não a soma.
  const madr = [['05:00-06:00', '', 167, 167], ['06:00-07:00', '', 240, 240]]
    .concat(HORAS_1910.map(([rot, l], i) => linhaHora(rot, i < 8 ? '129' : '125', l)));
  const M = montar({ horas: madr });
  saveDay(M);
  ok('madrugada escondida pela C3 entra como HE (como no fechamento das 23:59 e na UEP HE)',
     [hist(M)[0][1], hist(M)[0][6], hist(M)[0][10]], [1916, 2, 407]);
}

console.log('\n── HORA EXTRA que só o painel conhece: fica o que o painel mandou ──');
{
  // Modal ⚙ HORA EXTRA do PC com a META vazia: o REALIZADO digitado (286) fica
  // no navegador (rpe_he); o addHE grava a linha sem caixa e o getDados a pula.
  const P = montar();
  const r = saveDay(P, { real: '1795', ef: '155.1', he: '1', heCx: '286', mediaH: '199' });
  ok('o painel tem mais HE que a aba → a linha é a do painel, como antes da v5.29',
     hist(P)[0], ['19/10/2026', 1795, 1157, 155.1, 263, 88, 1, true, '19/10/2026, 17:05:57', 199, 286, 3542.4, 0, 3048, '', '']);
  ok('o retorno e o log dizem por quê', [r.fonte, r.heLocal, P.LOGS.some(l => /HE só no navegador/.test(l))], ['painel', true, true]);
  const Q = montar({ horas: [['05:00-06:00', '', 100, 100], ['06:00-07:00', '', 0]]
    .concat(HORAS_1910.map(([rot, l], i) => linhaHora(rot, i < 8 ? '129' : '125', l))) });
  ok('o painel com MENOS HE que a aba (retrato velho da madrugada) → a aba',
     [saveDay(Q, { heCx: '60', he: '1' }).fonte, hist(Q)[0][10]], ['planilha', 100]);
}

console.log('\n── v5.55 (opção A): a META é a do painel; META DIA e ATRASO META mostram do que ela é feita ──');
{
  // O painel com SOMAR ATRASO ligado: meta efetiva = programado de hoje (a aba,
  // 1.157) + atraso de dias anteriores (143).
  const P = montar();
  saveDay(P, { meta: '1300' });
  ok('META 1.300 (painel) · META DIA 1.157 (aba) · ATRASO META 143 = a diferença',
     [hist(P)[0][2], hist(P)[0][14], hist(P)[0][15]], [1300, 1157, 143]);
  ok('a EF continua REALIZADO ÷ META do painel (a mesma do % na tela)', hist(P)[0][3], Number((1509 / 1300 * 100).toFixed(1)));
  ok('o log diz as duas metas', P.LOGS.some(l => /meta do painel 1300, meta do dia 1157/.test(l)), true);
  ok('os títulos das colunas 15 e 16 são escritos na 1ª gravação',
     [P.ABAS.HISTORICO[0][14], P.ABAS.HISTORICO[0][15]], ['META DIA', 'ATRASO META']);

  const Z = montar();
  saveDay(Z, { meta: '0' });
  ok('painel sem meta → META = a da aba, ATRASO 0 (nunca META 0 com EF infinita)',
     [hist(Z)[0][2], hist(Z)[0][3], hist(Z)[0][14], hist(Z)[0][15]], [1157, Number((1509 / 1157 * 100).toFixed(1)), 1157, 0]);

  // Meta digitada abaixo da aba (ajuste manual): não existe atraso negativo.
  const M = montar();
  saveDay(M, { meta: '1100' });
  ok('painel abaixo da aba → ATRASO META 0, META DIA continua a da aba',
     [hist(M)[0][2], hist(M)[0][14], hist(M)[0][15]], [1100, 1157, 0]);

  // Aba sem meta nenhuma nas horas (META vazia): sem META DIA, sem ATRASO.
  const S = montar({ horas: HORAS_1910.map(([rot, l]) => linhaHora(rot, '', l)) });
  saveDay(S, { meta: '1300' });
  ok('aba sem meta por hora → META do painel e as duas colunas vazias',
     [hist(S)[0][2], hist(S)[0][14], hist(S)[0][15]], [1300, '', '']);

  // O fechamento das 23:59 não sabe a meta do painel: grava a da aba e atraso 0.
  const A = montar();
  A.run("arquivarDiaAtual('19/10/2026');");
  ok('fechamento das 23:59 → META = META DIA = aba, ATRASO META 0',
     [hist(A)[0][2], hist(A)[0][14], hist(A)[0][15]], [1157, 1157, 0]);
}

console.log('\n── a mesma conta no painel (v7.202.0): o card diz o que o FECHAR DIA grava ──');
{
  // O _metaPartes do painel e o saveDay do .gs, nos mesmos pares (meta do painel,
  // metas por hora da aba). O card META DO DIA mostra META DIA + ATRASO META;
  // se as duas contas divergirem, a tela promete um número e o histórico grava outro.
  const V7 = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
  const i = V7.indexOf('function _metaPartes(');
  const corpo = V7.slice(i, V7.indexOf('\n}\n', i) + 2);
  const _metaPartes = new Function(corpo + '; return _metaPartes;')();
  const casos = [[1300, '129'], [0, '129'], [1100, '129'], [1157, '129'], [2000, '200'], [900, ''], [0, '']];
  const tudoBate = casos.every(([mp, mh]) => {
    const P = montar({ horas: HORAS_1910.map(([rot, l]) => linhaHora(rot, mh, l)) });
    saveDay(P, { meta: String(mp) });
    const l = hist(P)[0];
    const somaAba = mh === '' ? 0 : Number(mh) * HORAS_1910.length;
    const q = _metaPartes(mp, somaAba);
    return JSON.stringify([l[2], l[14], l[15]]) ===
      JSON.stringify([q.meta, q.metaDia == null ? '' : q.metaDia, q.atraso == null ? '' : q.atraso]);
  });
  ok('META, META DIA e ATRASO META iguais no painel e no saveDay em ' + casos.length + ' casos', tudoBate, true);
}

console.log('\n── v5.56: SOMAR ATRASO na CONFIG_PAINEL — a META gravada não depende do computador ──');
{
  const P = montar();
  const cfg = () => P.run('return getConfigPainel();').metaComAtraso;
  const linha = () => (P.ABAS.CONFIG_PAINEL.find(r => r[0] === 'META_COM_ATRASO') || [])[1];
  const grava = q => P.run('_valoresMemo = {}; return setConfigPainel(' + JSON.stringify(q) + ');');
  ok('sem a chave na planilha → null (a chave existe no objeto: é o sinal de .gs novo)',
     [cfg(), Object.prototype.hasOwnProperty.call(P.run('return getConfigPainel();'), 'metaComAtraso')], [null, true]);
  ok('setConfigPainel sem o campo (ou vazio) não cria a chave', (grava({ telaA: '1' }), grava({ metaComAtraso: '' }), linha()), undefined);
  const r = grava({ metaComAtraso: '1' });
  ok('metaComAtraso=1 grava META_COM_ATRASO 1 e a resposta já devolve true', [linha(), r.painelConfig.metaComAtraso], ['1', true]);
  grava({ metaComAtraso: '0' });
  ok('metaComAtraso=0 regrava a MESMA linha com 0 (upsert, uma linha só)',
     [linha(), P.ABAS.CONFIG_PAINEL.filter(x => x[0] === 'META_COM_ATRASO').length, cfg()], ['0', 1, false]);
  const Q = montar();
  Q.ABAS.CONFIG_PAINEL.push(['META_COM_ATRASO', 'talvez']);
  ok('valor ilegível na planilha → null (o painel fica com a dele), nunca um palpite',
     Q.run('return getConfigPainel();').metaComAtraso, null);
  ok('as leituras dependem do grupo cfg e o setConfigPainel o invalida',
     [/getPontosDia: \[[^\]]*'cfg'/.test(GS), /setConfigPainel: \['cfg'\]/.test(GS)], [true, true]);
}

console.log('\n── o lock dos lançamentos ──');
{
  const P = montar();
  saveDay(P);
  ok('o saveDay pega e solta o MESMO lock do saveRealizado', [P.LOCK.wait, P.LOCK.rel], [1, 1]);
  P.run("_resumoParaFechar = function () { throw new Error('planilha fora'); };");
  let erro = '';
  try { saveDay(P); } catch (e) { erro = e.message; }
  ok('e solta mesmo quando a gravação falha', [erro, P.LOCK.wait, P.LOCK.rel], ['planilha fora', 2, 2]);
}

console.log('\n── sem o carimbo do dia, a aba NÃO é deste dia: fica o que o painel mandou ──');
{
  // Sem a aba, não há META DIA (soma por hora): as duas colunas ficam vazias, nunca 0.
  const linhaPainel = ['19/10/2026', 1491, 1157, 128.9, 263, 88, 0, true, '19/10/2026, 17:05:57', 166, 0, 3542.4, 0, 3048, '', ''];
  const P1 = montar({ carimbo: '18/10/2026' });
  ok('carimbo de OUTRO dia → os números do painel', [hist(P1).length, saveDay(P1).fonte, hist(P1)[0]], [0, 'painel', linhaPainel]);
  const P2 = montar({ carimbo: null });
  ok('sem carimbo (aba zerada no reset) → os números do painel', [saveDay(P2).fonte, hist(P2)[0][1]], ['painel', 1491]);
  const P3 = montar({ horas: [['07:00-08:00', '129', 0], ['08:00-09:00', '129', '']] });
  ok('carimbo do dia mas aba sem produção → os números do painel', [saveDay(P3).fonte, hist(P3)[0][1]], ['painel', 1491]);
  const P4 = montar({ horas: [] });
  P4.ABAS.HORA_A_HORA.length = 2;   // aba sem o cabeçalho da linha 4
  ok('aba sem cabeçalho → os números do painel, sem erro', [saveDay(P4).fonte, hist(P4)[0][1]], ['painel', 1491]);
}

console.log('\n── um lugar só ──');
{
  ok('o laço da HORA_A_HORA que vira linha do HISTORICO existe UMA vez',
     (GS.match(/const realVal = Math\.max\(direto, somaLotes\);/g) || []).length, 1);
  ok('arquivarDiaAtual e saveDay passam pelo _resumoHoraAHora',
     [/_resumoHoraAHora\(/.test(pega('function arquivarDiaAtual(')), /_resumoParaFechar\(/.test(pega('function saveDay(')),
      /_resumoHoraAHora\(/.test(pega('function _resumoParaFechar('))], [true, true, true]);
  ok('a trava é o carimbo dataDados (o mesmo do reset diário)', /PROP_DATA_DADOS/.test(pega('function _resumoParaFechar(')), true);
  ok('lê direto da planilha (caminho de escrita, nada do memo)', /_valores(DaAba)?\s*\(/.test(pega('function _resumoParaFechar(')), false);
  ok('o saveDay roda sob o lock dos lançamentos', /LockService\.getScriptLock\(\)[\s\S]*waitLock[\s\S]*finally[\s\S]*releaseLock/.test(pega('function saveDay(')), true);
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
