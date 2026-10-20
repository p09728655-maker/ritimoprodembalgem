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
    HISTORICO: (o.hist || [['DATA', 'REALIZADO', 'META', 'EFICIÊNCIA %', 'MELHOR H.', 'PIOR H.', 'HE', 'FECHADO', 'FECHADO EM',
      '', 'MEDIA CX/H', 'HE CX', 'UEP', 'UEP HE', 'META UEP']]).map(r => r.slice()),
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
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    Utilities: { formatDate: (d, tz, f) => f === 'yyyy' ? '2026' : (/HH/.test(f) ? '19/10/2026 17:05' : '19/10/2026') },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in PROPS ? PROPS[k] : null),
      setProperty: (k, x) => { PROPS[k] = x; }, deleteProperty: k => { delete PROPS[k]; } }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Logger: { log: m => LOGS.push(String(m)) },
  };
  vm.createContext(ctx);
  vm.runInContext(GS, ctx);
  const run = code => vm.runInContext('(function(){ ' + code + ' })()', ctx);
  return { ABAS, run, LOGS };
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
  ok('grava a produção da HORA_A_HORA, com a META e o FECHADO EM do painel',
     hist(P)[0], ['19/10/2026', 1509, 1157, 130.4, 263, 88, 0, true, '19/10/2026, 17:05:57', 168, 0, 3542.4, 0, 3048]);
  ok('a UEP da mesma linha é a das mesmas 1.509 cx (já era — é ela que mostrou o defeito)', hist(P)[0][11], 3542.4);
  ok('o retorno diz de onde saiu e o que o painel tinha', [r.ok, r.fonte, r.real, r.realPainel], [true, 'planilha', 1509, 1491]);
  ok('a diferença fica no log de execução', P.LOGS.some(l => /19\/10\/2026: painel mandou 1491 cx, a HORA_A_HORA tem 1509/.test(l)), true);
  saveDay(P);
  ok('fechar de novo continua sendo upsert (uma linha só)', hist(P).length, 1);
}

console.log('\n── a mesma conta do fechamento das 23:59 ──');
{
  // Com hora extra: madrugada liberada pela C3 (HE pelo HORÁRIO) e a linha rotulada.
  const horas = [['05:00-06:00', '', 100, 100], ['06:00-07:00', '', 0]]
    .concat(HORAS_1910.map(([rot, l], i) => linhaHora(rot, i < 8 ? '129' : '125', l)))
    .concat([['HE 17:00-18:00', '100', 40, 40]]);
  const A = montar({ horas }), B = montar({ horas });
  saveDay(A, { real: '1600' });
  B.run("arquivarDiaAtual('19/10/2026');");
  const a = hist(A)[0], b = hist(B)[0];
  const producao = l => [l[1], l[4], l[5], l[6], l[9], l[10], l[11], l[12]];
  ok('REALIZADO, MELHOR, PIOR, HE, MEDIA, HE CX e UEP iguais aos do arquivarDiaAtual', producao(a), producao(b));
  ok('com HE: 1.649 cx, 2 horas extras, 140 cx nelas', [a[1], a[6], a[10]], [1649, 2, 140]);
  ok('a META é a do painel (a da aba exclui só a linha rotulada HE)', [a[2], b[2]], [1157, 1157]);
  ok('a EF é REALIZADO ÷ META da própria linha', a[3], Number((1649 / 1157 * 100).toFixed(1)));
  ok('dia fechado pelo painel continua com prioridade sobre o das 23:59', (() => {
    B.ABAS.HISTORICO[1][7] = true; B.ABAS.HISTORICO[1][1] = 1;
    B.run("arquivarDiaAtual('19/10/2026');");
    return hist(B)[0][1];
  })(), 1);
}

console.log('\n── sem o carimbo do dia, a aba NÃO é deste dia: fica o que o painel mandou ──');
{
  const linhaPainel = ['19/10/2026', 1491, 1157, 128.9, 263, 88, 0, true, '19/10/2026, 17:05:57', 166, 0, 3542.4, 0, 3048];
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
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
