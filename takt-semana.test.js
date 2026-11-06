// Teste da sub-aba TAKT DA SEMANA da ⚖ UEP (v7.209.0).
//   node takt-semana.test.js
//
// Roda contra o código REAL do ritmoprod_embalagem_v7.html (conta e desenho). O
// caso-base é o retrato de 06/11/2026 às 11:58: as 49 linhas da semana 02–08/11
// que o getProgramacaoSemana (.gs v5.59) devolveu, os dias fechados do
// HISTORICO (03, 04 e 05/11) e o hoje da ⚖ UEP (996,9 UEP de jornada em 240 min,
// 523,5 em hora extra, MEL VOL 1/2 BRANCO rodando).

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const JS = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
function pega(assinatura) {
  const i = JS.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei no HTML: ' + assinatura);
  const j = JS.indexOf('{', JS.indexOf(')', i));
  let n = 0;
  for (let k = j; k < JS.length; k++) {
    if (JS[k] === '{') n++;
    else if (JS[k] === '}' && --n === 0) return JS.slice(i, k + 1);
  }
  throw new Error('função não fecha: ' + assinatura);
}
function pegaConst(nome) {
  const m = JS.match(new RegExp('const ' + nome + '\s*=[^\n]*'));
  if (!m) throw new Error('não encontrei a const ' + nome);
  return m[0];
}
global.window = global;
require('vm').runInThisContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'));
global._rpEsc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
['function _cartNum(', 'function _eixoGrade(', 'function _taktMontar(', 'function _taktRestMin(', 'function _taktAgora(',
 'function _uepSubTakt(', 'function _tkHM(', 'function _taktHtml(', 'function _taktSvg('].forEach(f => eval.call(global, pega(f)));
['EIXO_PASSOS', '_tkS', 'TKS_DOW'].forEach(c => eval.call(global, pegaConst(c).replace(/^const /, 'global.').replace(/^global\.(\w+)\s*=/, 'global.$1 =')));

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : '\n       esperado: ' + JSON.stringify(esperado) + '\n       recebido: ' + JSON.stringify(real)));
}
const r1 = v => v == null ? null : Math.round(v * 10) / 10;

// [data, código, qtde, uepCx, saldo, concluída, encerrada, fora da esteira] — 06/11/2026 11:58
const LIN = [
  ["03/11", "501088001", 95, 2.48, 0, 1, 1, 0],
  ["03/11", "501088002", 95, 2.48, 0, 1, 1, 0],
  ["03/11", "501088003", 105, 2.48, 0, 1, 1, 0],
  ["03/11", "501088004", 105, 2.48, 0, 1, 1, 0],
  ["03/11", "501068001", 150, 3.49, 150, 0, 0, 0],
  ["03/11", "501068002", 150, 3.49, 0, 1, 0, 0],
  ["03/11", "501141007", 135, 2.38, 0, 1, 1, 0],
  ["03/11", "501141008", 330, 2.38, 0, 1, 1, 0],
  ["03/11", "501141009", 35, 2.38, 0, 1, 1, 0],
  ["04/11", "501134001", 240, 1.9, 0, 1, 0, 0],
  ["04/11", "501134002", 210, 1.9, 0, 1, 0, 0],
  ["04/11", "501158002", 75, 2.98, 75, 0, 0, 0],
  ["04/11", "501158001", 25, 2.98, 0, 1, 0, 0],
  ["04/11", "501157006", 40, 2.63, 1, 0, 0, 0],
  ["04/11", "501157005", 30, 2.63, 0, 1, 0, 0],
  ["04/11", "501157008", 40, 1.82, 1, 0, 0, 0],
  ["04/11", "501157009", 60, 1.82, 4, 0, 0, 0],
  ["04/11", "501136003", 370, 2.1, 2, 0, 0, 0],
  ["04/11", "501136006", 150, 2.1, 2, 0, 0, 0],
  ["04/11", "501136001", 190, 2.1, 0, 1, 0, 0],
  ["04/11", "501136005", 150, 2.1, 0, 1, 1, 0],
  ["04/11", "501136004", 130, 2.1, 0, 1, 0, 0],
  ["04/11", "501136002", 110, 2.1, 0, 1, 0, 0],
  ["04/11", "501134001", 100, 1.9, 12, 0, 0, 0],
  ["04/11", "501134002", 150, 1.9, 3, 0, 0, 0],
  ["05/11", "501060001", 190, 1.73, 94, 0, 0, 0],
  ["05/11", "501060002", 190, 1.71, 1, 0, 0, 0],
  ["05/11", "501060003", 110, 1.73, 1, 0, 0, 0],
  ["05/11", "501060004", 110, 1.71, 23, 0, 0, 0],
  ["05/11", "501060005", 50, 1.73, 1, 0, 0, 0],
  ["05/11", "501060006", 50, 1.71, 0, 1, 0, 0],
  ["05/11", "501141001", 95, 1.75, 95, 0, 0, 0],
  ["05/11", "501141002", 270, 1.75, 270, 0, 0, 0],
  ["05/11", "501141003", 35, 1.75, 35, 0, 0, 0],
  ["05/11", "501135001", 110, 1.83, 110, 0, 0, 0],
  ["05/11", "501135002", 340, 1.83, 340, 0, 0, 0],
  ["06/11", "501079001", 10, 2.46, 10, 0, 0, 0],
  ["06/11", "501079002", 10, 1.52, 10, 0, 0, 0],
  ["06/11", "501079003", 190, 2.46, 190, 0, 0, 0],
  ["06/11", "501079004", 190, 1.52, 190, 0, 0, 0],
  ["06/11", "501093001", 95, 2.04, 95, 0, 0, 0],
  ["06/11", "501093002", 190, 2.04, 190, 0, 0, 0],
  ["06/11", "501093003", 15, 2.04, 15, 0, 0, 0],
  ["06/11", "501070001", 20, 2.72, 20, 0, 0, 0],
  ["06/11", "501070002", 20, 2.72, 20, 0, 0, 0],
  ["06/11", "501070003", 20, 2.31, 20, 0, 0, 0],
  ["06/11", "501070004", 130, 2.72, 130, 0, 0, 0],
  ["06/11", "501070005", 130, 2.72, 130, 0, 0, 0],
  ["06/11", "501070006", 130, 2.31, 130, 0, 0, 0]
];
const S = { ok:true, de:'02/11/2026', ate:'08/11/2026', hoje:'06/11/2026', feriados:[{ data:'02/11/2026', desc:'FINADOS' }],
  linhas: LIN.map(([d, codigo, qtde, uepCx, saldo, conc, enc, fora]) => ({ data:d + '/2026', dataNum:_cartNum(d + '/2026'), codigo, desc:'', cor:'', qtde, uepCx,
    uep:uepCx ? Math.round(qtde * uepCx * 10) / 10 : null, saldo, aba:conc ? 'concluida' : 'aberta', encerrada:!!enc, foraEsteira:!!fora })) };
// o HISTORICO como o painel lê (uep e META UEP gravadas no fechamento)
const HIST = [
  { data:'30/10/2026', uep:2337.4, uepHe:623.5, metaUep:2761 },
  { data:'03/11/2026', uep:2686, uepHe:0, metaUep:2761 },
  { data:'04/11/2026', uep:2869.1, uepHe:586.7, metaUep:2761 },
  { data:'05/11/2026', uep:2095.2, uepHe:0, metaUep:2761 },
];
const HOJE = { num:20261106, minNorm:240, restMin:287, uep:996.9, he:523.5, meta:2761, fim:'17:00' };
const T = _taktMontar(S, HIST, HOJE);

console.log('\n── os três números, em segundos por UEP ──');
ok('a programação da semana: 5.970 cx = 12.831,2 UEP, só de 03 a 06/11 (02/11 FINADOS, sábado e domingo sem lote)',
   [T.progCx, r1(T.progUep), T.nUteis, T.dias.filter(d => d.util).map(d => d.data.slice(0, 5)), T.dias.filter(d => d.feriado).map(d => d.feriado)],
   [5970, 12831.2, 4, ['03/11', '04/11', '05/11', '06/11'], ['FINADOS']]);
ok('por dia, as metas gravadas de cada dia (03/11 1.200 · 04/11 2.070 · 05/11 1.550 · 06/11 1.150 cx)',
   T.dias.filter(d => d.util).map(d => [d.cx, r1(d.uep)]), [[1200, 3229], [2070, 4304.1], [1550, 2727.6], [1150, 2570.5]]);
ok('TAKT = 4 × 527 × 60 ÷ 12.831,2 = 9,86 s por UEP (3.207,8 UEP/dia, 116,2% da referência)',
   [Math.round(T.takt * 100) / 100, r1(T.porDia), r1(T.pede)], [9.86, 3207.8, 116.2]);
ok('REFERÊNCIA = 527 × 60 ÷ 2.761 = 11,45 s por UEP',
   Math.round(T.ref * 100) / 100, 11.45);
ok('EXECUTADO = (3 × 527 + 240) min × 60 ÷ 8.647,2 UEP = 12,64 s por UEP, 90,6% da referência; hora extra à parte (586,7 + 523,5)',
   [r1(T.exec.uep), T.exec.min, Math.round(T.exec.s * 100) / 100, r1(T.exec.pct), T.exec.nFech, T.exec.minHoje, r1(T.exec.he), T.exec.fora],
   [8647.2, 1821, 12.64, 90.6, 3, 240, 1110.2, 0]);

console.log('\n── por que não acompanhou: dia a dia nos dias fechados ──');
const C = T.cas;
ok('03/11: pediu 3.229, fez 2.686 → 75 de ritmo (até a referência) e 468 de carga; 04/11: pediu 4.304 e fez 2.869 (acima da referência) → 1.435 tudo carga; 05/11: pediu 2.727,6 (abaixo da referência) e fez 2.095,2 → 632,4 tudo ritmo',
   C.dias.map(d => [d.data.slice(0, 5), r1(d.carga), r1(d.ritmo), r1(d.adiant)]),
   [['03/11', 468, 75, 0], ['04/11', 1435, 0, 0], ['05/11', 0, 632.4, 0]]);
ok('a soma: pedido 10.260,7 − carga 1.903 − ritmo 707,4 = feito 7.650,3 (+ 586,7 em hora extra), e fecha',
   [C.n, r1(C.pedido), r1(C.carga), r1(C.ritmo), r1(C.feito), r1(C.he), r1(C.pedido - C.carga - C.ritmo + C.adiant - C.feito)],
   [3, 10260.7, 1903, 707.4, 7650.3, 586.7, 0]);
// a semana somada daria 1.978 / 633 (a prévia): o 04/11 acima da referência
// cobria o 05/11, que pediu MENOS que a referência — a folga do 05/11 não era trabalho que a linha tinha.
{ const D = ['03/11', '04/11', '05/11'].map(x => T.dias.find(d => d.data.startsWith(x)));
  const somada = { carga:Math.max(0, D.reduce((s, d) => s + d.uep, 0) - 3 * 2761), ritmo:3 * 2761 - D.reduce((s, d) => s + d.feito, 0) };
  ok('dia a dia, e não a semana somada (que daria 1.978 de carga e 632,7 de ritmo)', [r1(somada.carga), r1(somada.ritmo), r1(C.carga) !== r1(somada.carga)], [1977.7, 632.7, true]); }
{ const S2 = Object.assign({}, S, { linhas:S.linhas.map(l => l.data === '05/11/2026' ? Object.assign({}, l, { qtde:Math.round(l.qtde / 2), uep:l.uep != null ? Math.round(l.uep / 2 * 10) / 10 : null }) : l) });
  const C2 = _taktMontar(S2, HIST, HOJE).cas, d5 = C2.dias[2];
  ok('dia que fez MAIS que o pedido: ADIANTOU (sem carga, sem ritmo) e a conta ainda fecha',
     [r1(d5.pedido) < r1(d5.feito), r1(d5.carga), r1(d5.ritmo), r1(d5.adiant), r1(C2.pedido - C2.carga - C2.ritmo + C2.adiant - C2.feito)],
     [true, 0, 0, r1(d5.feito - d5.pedido), 0]); }

console.log('\n── a falta da semana: o saldo dos lotes ──');
ok('saldo 2.370 cx = 5.096,8 UEP; 2.526,3 de dias que já passaram; nenhuma linha sem saldo',
   [T.falta.cx, r1(T.falta.uep), r1(T.falta.uepVenc), T.falta.semSaldo, T.falta.cxSemUep], [2370, 5096.8, 2526.3, 0, 0]);
ok('cabem até 17:00 os 287 min que faltam da jornada na referência (1.503,6) — faltam 3.593,1',
   [r1(T.falta.capRest), T.falta.ate, r1(T.falta.passa)], [1503.6, '17:00', 3593.1]);
ok('os minutos que faltam: a hora em andamento só o resto, o almoço não é slot, a hora extra fica fora',
   (() => { const sl = [['05:00', 60, true], ['06:00', 60, true], ['07:00', 60], ['08:00', 60], ['09:00', 60], ['10:00', 60], ['12:12', 48], ['13:00', 60], ['14:00', 60], ['15:00', 60], ['16:00', 59]]
              .map(([inicio, min, he]) => ({ inicio, min, he:!!he }));
            return [_taktRestMin(sl, [], toMin('11:58')), _taktRestMin(sl, [], toMin('10:50')), _taktRestMin(sl, [], toMin('06:30')), _taktRestMin(sl, [], toMin('17:30')), _taktRestMin(sl, [], NaN)]; })(),
   [287, 297, 527, 0, 0]);
{ const Hseg = Object.assign({}, HOJE, { num:20261103, minNorm:120, restMin:407, uep:600 });
  const Tseg = _taktMontar(S, HIST.filter(d => d.data !== '03/11/2026'), Hseg);
  ok('na terça (03/11) a semana ainda tem 3 dias úteis pela frente: cabem o resto de hoje + 3 × 2.761, até 06/11; nenhum dia fechado ainda',
     [r1(Tseg.falta.capRest), Tseg.falta.ate, Tseg.cas.n, Tseg.exec.nFech, Tseg.exec.minHoje], [r1(407 * 2761 / 527 + 3 * 2761), '06/11', 0, 0, 120]); }

console.log('\n── o que fica fora, e diz ──');
{ const L = S.linhas.slice();
  L.push({ data:'07/11/2026', dataNum:20261107, codigo:'501001001', qtde:100, uepCx:2, uep:200, saldo:100, aba:'aberta', foraEsteira:false });
  L.push({ data:'05/11/2026', dataNum:20261105, codigo:'501002001', qtde:50, uepCx:null, uep:null, saldo:50, aba:'aberta', foraEsteira:false });
  L.push({ data:'04/11/2026', dataNum:20261104, codigo:'501003001', qtde:30, uepCx:1.5, uep:45, saldo:30, aba:'aberta', foraEsteira:true });
  L.push({ data:'05/11/2026', dataNum:20261105, codigo:'501004001', qtde:20, uepCx:1.5, uep:30, saldo:null, aba:'aberta', foraEsteira:false });
  const Tx = _taktMontar(Object.assign({}, S, { linhas:L }), HIST.filter(d => d.data !== '04/11/2026'), HOJE);
  ok('sábado com lote entra no pedido e não na jornada; sem UEP fora do takt; fora da esteira fora de tudo; sem saldo fora da falta; dia sem histórico fora do executado',
     [Tx.nUteis, r1(Tx.progForaUtil), Tx.cxSemUep, Tx.cxFora, Tx.falta.semSaldo, Tx.falta.cxSemUep, Tx.semDado, Tx.cas.n, Tx.exec.nFech,
      Tx.dias.find(d => d.data === '07/11/2026').util, r1(Tx.progUep - T.progUep)],
     [4, 200, 50, 30, 1, 50, ['04/11/2026'], 2, 2, false, r1(200 + 30)]); }
{ // sábado trabalhado (07/11): a produção dele vai para o "fora da jornada", não para o executado nem para o que cabe
  const Hs = { num:20261107, minNorm:300, restMin:200, uep:500, he:40, meta:2761, fim:'17:00' };
  const Ts = _taktMontar(S, HIST.concat([{ data:'06/11/2026', uep:2400, uepHe:600, metaUep:2761 }]), Hs);
  ok('sábado trabalhado: fora do executado (só os 4 dias úteis fechados) e do "cabem" (0, nenhum dia útil pela frente); a produção dele vai para o fora da jornada',
     [Ts.exec.nFech, Ts.exec.minHoje, Ts.exec.min, r1(Ts.exec.uep), r1(Ts.exec.fora), r1(Ts.exec.he), Ts.falta.capRest, Ts.falta.ate],
     [4, 0, 4 * 527, r1(2686 + 2869.1 + 2095.2 + 2400), 540, r1(586.7 + 600), 0, '17:00']); }
ok('sem dado, null — nunca 0: sem a leitura, sem dia útil, sem UEP programada',
   [_taktMontar(null, HIST, HOJE), _taktMontar({ linhas:[] , de:'xx', ate:'yy' }, HIST, HOJE),
    (t => [t.takt, t.porDia, t.pede, t.exec.s === null || t.exec.s > 0])(_taktMontar(Object.assign({}, S, { linhas:[] }), HIST, HOJE))],
   [null, null, [null, null, null, true]]);

console.log('\n── agora: o takt em caixas do produto que roda ──');
const PHM = [
  { hora:'09:00', modelo:'501060', nome:'PENTEADEIRA CAMARIM MEL', cor:'OFF WHITE', caixas:145, uep:250.1 },
  { hora:'10:00', modelo:'501060', nome:'PENTEADEIRA CAMARIM MEL', cor:'CINAMOMO/OFF WHITE', caixas:49, uep:84.8 },
  { hora:'10:00', modelo:'501060', nome:'PENTEADEIRA CAMARIM MEL', cor:'BRANCO', caixas:96, uep:166.1 },
];
const HORAS = [
  { inicio:'09:00', he:false, uep:250.1, cls:'red' }, { inicio:'10:00', he:false, uep:250.9, cls:'red' },
  { inicio:'12:12', he:false, uep:null, futuro:true },
];
const SLOTS = [{ inicio:'09:00', min:60 }, { inicio:'10:00', min:60 }, { inicio:'12:12', min:48 }];
const AG = { cod:'501060001', desc:'VOL 1/2 PENTEADEIRA CAMARIM MEL', cor:'BRANCO', uepCx:1.73, horas:HORAS, slots:SLOTS, phm:PHM };
const G = _taktAgora(T, AG);
ok('MEL VOL 1/2 BRANCO (1,73): 1 caixa a cada 17,1 s pelo takt e 19,8 s pela referência',
   [r1(G.sTakt), r1(G.sRef)], [17.1, 19.8]);
ok('a última hora fechada (10:00) teve duas cores: o ritmo dela (14,3 s por UEP) em caixas da MEL — 24,8 s, a cor do HORA A HORA',
   [G.hora.inicio, G.hora.so, r1(G.hora.sUep), r1(G.hora.sCx), G.hora.cls, G.hora.cx], ['10:00', false, 14.3, 24.8, 'red', 145]);
{ const G2 = _taktAgora(T, Object.assign({}, AG, { horas:HORAS.slice(0, 1).concat([{ inicio:'10:00', andamento:true, uep:120 }]), cor:'OFF WHITE' }));
  ok('a hora em andamento não conta; hora só do produto (a MEL OFF WHITE das 09:00): as caixas dela, 3600 ÷ 145 = 24,8 s',
     [G2.hora.inicio, G2.hora.so, r1(G2.hora.sCx), G2.hora.cx], ['09:00', true, 24.8, 145]); }
ok('sem produto apontado → null; sem UEP no cadastro → sem conta por caixa; nenhuma hora fechada → hora null',
   [_taktAgora(T, Object.assign({}, AG, { cod:'' })), (g => [g.sTakt, g.sRef, g.hora && g.hora.sCx])(_taktAgora(T, Object.assign({}, AG, { uepCx:null }))),
    _taktAgora(T, Object.assign({}, AG, { horas:[] })).hora],
   [null, [null, null, null], null]);

console.log('\n── o botão da sub-aba ──');
ok('o botão: quanto a programação pede da referência (âmbar acima de 100%); sem a leitura diz o estado, nunca 0',
   [_uepSubTakt(T), _uepSubTakt(Object.assign({}, T, { pede:95 })).cls, _uepSubTakt(null).txt, _uepSubTakt(null, 'falha').txt, _uepSubTakt(null, 'sem-endpoint').txt,
    _uepSubTakt(null, 'sem-url').txt, _uepSubTakt({ takt:null, nUteis:4 }).txt, _uepSubTakt({ takt:null, nUteis:0 }).txt],
   [{ txt:'pede ' + fmtP(T.pede) + ' da referência', cls:'warn' }, '', '…', 'programação não lida', 'falta o .gs v5.59', 'sem Google Sheets', 'nenhuma UEP programada', 'nenhum dia útil']);

console.log('\n── o desenho ──');
const HT = _taktHtml(T, G, { largura:1200 });
ok('os quatro cards, a frase, o porquê, o agora e o dia a dia, com os números da montagem',
   ['TAKT · O QUE A PROGRAMAÇÃO PEDE', 'REFERÊNCIA · META DIA (UEP) DO ⚙', 'EXECUTADO NA SEMANA · JORNADA', 'FALTA DA SEMANA · SALDO DOS LOTES',
    '9,9<small>s por UEP</small>', '11,5<small>s por UEP</small>', '12,6<small>s por UEP</small>', '5.097<small>UEP</small>',
    '<b>16,2% acima</b>', '<b>73% é carga acima da referência</b>', '<b>27% é ritmo</b>', 'POR QUE NÃO ACOMPANHOU · dias fechados 03/11–05/11',
    '>1.903<', '>707<', '>7.650<', '+ 587 em hora extra', 'AGORA · VOL 1/2 PENTEADEIRA CAMARIM MEL BRANCO (1,73 UEP por caixa)', '17,1 s', '19,8 s', '24,8 s',
    'cabem ~1.504 até 17:00 · faltam 3.593', 'id="tks-g-box"', 'takt da semana 3.208/dia', 'referência 2.761'].filter(t => !HT.includes(t)), []);
ok('o card do takt âmbar (pede acima), o do executado na cor do sc (90,6% → atenção), a falta vermelha (não cabe)',
   [/<div class="kpi-card warn"[^>]*><div class="kpi-lbl">TAKT/.test(HT), /<div class="kpi-card warn"[^>]*><div class="kpi-lbl">EXECUTADO/.test(HT), /<div class="kpi-card red"[^>]*><div class="kpi-lbl">FALTA/.test(HT)],
   [true, true, true]);
ok('na segunda de manhã (nenhum dia fechado): a conta do porquê espera, sem cascata de zeros',
   (h => [h.includes('Nenhum dia útil fechado na semana ainda'), h.includes('tks-casc')])(_taktHtml(_taktMontar(S, [], Object.assign({}, HOJE, { num:20261103 })), null, {})),
   [true, false]);
const SV = _taktSvg(T, 1200);
ok('o gráfico: 02/11 FINADOS sem barras, quatro dias com o programado tracejado e o feito, hoje "até agora", as duas linhas; números com halo por cima das linhas',
   [SV.includes('>FINADOS<'), (SV.match(/stroke-dasharray="5 4"/g) || []).length, (SV.match(/fill="var\(--tks-feito\)"/g) || []).length, SV.includes('1.520 até agora'),
    SV.includes('stroke="var(--acc)" stroke-width="2.5" stroke-dasharray="12 6"'), SV.lastIndexOf('stroke-dasharray="12 6"') < SV.indexOf('paint-order="stroke"'),
    /06\/11 sex \(hoje\)/.test(SV)],
   [true, 4, 4, true, true, true, true]);
ok('o desenho não faz conta (tudo vem da montagem) e a conta não lê a tela nem a planilha',
   [/_taktMontar\(|_taktAgora\(|uepDiaMeta\(|\.linhas/.test(pega('function _taktHtml(') + pega('function _taktSvg(')),
    /document\.|PONTOS_DIA|UEP_HIST|CFG\.|jsonpFetch/.test(pega('function _taktMontar(') + pega('function _taktAgora(') + pega('function _taktRestMin('))],
   [false, false]);

console.log('\n── a ligação com a aba ──');
const R = pega('function renderUep('), CAR = pega('async function _uepAbaCarregar('), LD = pega('function _taktCarregar(');
ok('a 6ª sub-aba: botão, chave, painel no renderUep e o número pintado com os outros',
   [/data-sub="takt"[^>]*onclick="_uepSub\('takt'\)"><b>TAKT DA SEMANA<\/b><span id="uep-sb-takt">/.test(html), /const UEP_SUBS = \[[^\]]*'takt'\];/.test(JS),
    R.includes("+pn('takt', bT)"), /\['hoje', 'periodo', 'prod', 'takt'\]\.forEach/.test(pega('function _uepSubPintar(')), /T, taktEst:/.test(R)],
   [true, true, true, true, true]);
ok('a leitura: action=getProgramacaoSemana, 3 tentativas em sequência, voo compartilhado, a última da fila da aba e na fila da RÉGUAS',
   [LD.includes("action=getProgramacaoSemana"), /for\(let t=1; t<=3; t\+\+\)/.test(LD), /if\(TKS_VOO\) return TKS_VOO;/.test(LD),
    CAR.indexOf('await _taktCarregar()') > CAR.indexOf('await _uepPadCarregar()'), /TKS_VOO \|\| _pontosVoo/.test(pega('function _uepLendo('))],
   [true, true, true, true, true]);
ok('o .gs antigo (responde sem linhas) é o único caso que manda re-deployar; renova de outro dia sempre, velha só com a sub-aba aberta',
   [/TKS_FALHA='sem-endpoint'; return false;/.test(LD), R.includes('cole o ritmoprod_appscript.gs v5.59 e re-deploye'),
    R.includes("((TKS && !tksDia && (!TKS_FALHA || tksVelha)) || (UEP_SUB==='takt' && tksVelha))"), /tksVelha=Date\.now\(\)-TKS_TS>_taktEspera\(\)/.test(R)],
   [true, true, true, true]);
// a espera: 1 min na falha de leitura; o cache com a leitura boa e com o .gs antigo
{ const espera = f => { global.TKS_FALHA = f; return _taktEspera(); };
  global.TKS_TTL = 300000; eval.call(global, pega('function _taktEspera('));
  ok('a espera entre leituras: 1 min depois de falhar (sem resposta, erro), 5 min com a leitura boa e com o .gs antigo — nunca em laço',
     [espera(null), espera('sem-resposta'), espera('erro'), espera('sem-endpoint')], [300000, 60000, 60000, 300000]);
  global.TKS_FALHA = null; }
ok('sem a URL do Sheets o estado é "sem Google Sheets", não "lendo" para sempre (a leitura não chega a sair)',
   [/tEst=TKS_VOO \? 'lendo' : TKS_FALHA==='sem-endpoint'/.test(R), /if\(!CFG\.sheetsUrl\)\{ TKS_FALHA='sem-url'; return Promise\.resolve\(false\); \}/.test(LD)], [true, true]);
ok('sem o histórico não monta (os dias fechados sairiam vazios): espera, ou diz que falhou',
   [/else if\(!UEP_HIST\)\{/.test(R), R.indexOf('else if(!UEP_HIST){') < R.indexOf('T=_taktMontar(')], [true, true]);
ok('o .gs tem a leitura (v5.59) que a tela pede',
   /function getProgramacaoSemana\(p\)/.test(fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8')), true);

console.log(falhas ? '\n❌ ' + falhas + ' falha(s)' : '\n✅ takt da semana ok — três números em s por UEP, o porquê dia a dia, o agora em caixas');
process.exit(falhas ? 1 : 0);
