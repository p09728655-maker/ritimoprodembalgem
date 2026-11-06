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
  const m = JS.match(new RegExp('const ' + nome + '\\s*=[^\\n]*'));
  if (!m) throw new Error('não encontrei a const ' + nome);
  return m[0];
}
global.window = global;
require('vm').runInThisContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'));
global.APP_NOME_CX = (JS.match(/const APP_NOME\s+= '([^']+)';/) || [, 'RitmoPatrimar'])[1].toUpperCase();
global.TKS_DET = false;
global._rpEsc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
['function _cartNum(', 'function _eixoGrade(', 'function _taktMontar(', 'function _taktRestMin(', 'function _taktAgora(',
 'function _uepSubTakt(', 'function _tkHM(', 'function _tkLista(', 'function _taktHtml(', 'function _taktSvg(', 'function _taktProxMontar(', 'function _taktProxHtml(',
 'function _taktProxSemana(', 'function _taktSemBotoes(', 'function _taktEstadoHtml(', 'function _fmtHM(', 'function _taktSimHtml(', 'function _taktCenRot(', 'function _taktCenarios(', 'function _taktSimular(', 'function _taktDocHtml(', 'function _taktVeredito(', 'function _taktHeroHtml(', 'function _taktDetHtml(', 'function _taktPtsMapa(', 'function _tkPts('].forEach(f => eval.call(global, pega(f)));
['EIXO_PASSOS', '_tkS', 'TKS_DOW', 'TKS_DOC_SVG_W', 'UEP_REF_STATUS'].forEach(c => eval.call(global, pegaConst(c).replace(/^const /, 'global.').replace(/^global\.(\w+)\s*=/, 'global.$1 =')));

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
{ // caixa de saldo sem UEP não entra no peso médio das caixas do veredito
  const L = S.linhas.concat([{ data:'06/11/2026', dataNum:20261106, codigo:'501002001', qtde:500, uepCx:null, uep:null, saldo:500, aba:'aberta', foraEsteira:false }]);
  const Tc = _taktMontar(Object.assign({}, S, { linhas:L }), HIST, HOJE), Vc = _taktVeredito(Tc, null, null);
  ok('as caixas que faltam saem do peso médio das caixas COM UEP (500 cx sem UEP no saldo não diluem a conta)',
     [Tc.falta.cxSemUep, Math.round(Vc.faltaCx), Math.round(Tc.falta.passa / (Tc.falta.uep / (Tc.falta.cx - 500)))], [500, Math.round(Tc.falta.passa / (Tc.falta.uep / 2370)), Math.round(Tc.falta.passa / (Tc.falta.uep / 2370))]); }
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
const HT = _taktHtml(T, G, { largura:1200, V:_taktVeredito(T, null, T.exec.uep / T.exec.min * 527) });
ok('os quatro cards, a frase, o porquê, o agora e o dia a dia, com os números da montagem',
   ['TAKT · O QUE A PROGRAMAÇÃO PEDE', 'REFERÊNCIA · META DIA (UEP) DO ⚙', 'EXECUTADO NA SEMANA · JORNADA', 'FALTA DA SEMANA · SALDO DOS LOTES',
    '9,9<small>s por UEP</small>', '11,5<small>s por UEP</small>', '12,6<small>s por UEP</small>', '5.097<small>UEP</small>',
    '<b>16,2% acima</b>', '<b>73% é carga acima da referência</b>', '<b>27% é ritmo</b>', 'POR QUE NÃO ACOMPANHOU · dias fechados 03/11–05/11',
    '>1.903<', '>707<', '>7.650<', '+ 587 em hora extra', 'AGORA · VOL 1/2 PENTEADEIRA CAMARIM MEL BRANCO (1,73 UEP por caixa)', '17,1 s', '19,8 s', '24,8 s',
    'cabem ~1.504 até 17:00 · faltam 3.593', 'id="tks-g-box"', '1 dia de linha (' + _fmtHM(527) + ' = média de 2.761 UEP entregues sem hora extra)'].filter(t => !HT.includes(t)), []);
ok('v7.211.0: na frente, o VEREDITO em horas de linha e o porquê numa linha; os cards em s por UEP, a cascata e o agora ficam nos DETALHES PARA O PCP (recolhidos)',
   [HT.indexOf('<div class="tks-hero red"><div class="tks-hv">NÃO FECHA</div>') > 0, HT.includes('faltam <b>' + _fmtHM(686) + '</b> de linha'),
    HT.includes('<b>Por quê:</b> a programação pediu <b>116,2%</b> da média que a linha entrega sem hora extra, e a linha rodou a <b>90,6%</b> dessa média. Do que não saiu nos dias fechados, <b>73% foi excesso de programação</b> e <b>27% ritmo da linha</b>.'),
    HT.indexOf('<details class="tks-det"') > HT.indexOf('id="tks-g-box"'), HT.indexOf('TAKT · O QUE A PROGRAMAÇÃO PEDE') > HT.indexOf('<details class="tks-det"'),
    HT.indexOf('AGORA ·') > HT.indexOf('<details class="tks-det"'), HT.includes('s por UEP') && HT.indexOf('s por UEP') > HT.indexOf('<details')],
   [true, true, true, true, true, true, true]);
ok('o card do takt âmbar (pede acima), o do executado na cor do sc (90,6% → atenção), a falta vermelha (não cabe)',
   [/<div class="kpi-card warn"[^>]*><div class="kpi-lbl">TAKT/.test(HT), /<div class="kpi-card warn"[^>]*><div class="kpi-lbl">EXECUTADO/.test(HT), /<div class="kpi-card red"[^>]*><div class="kpi-lbl">FALTA/.test(HT)],
   [true, true, true]);
ok('na segunda de manhã (nenhum dia fechado): a conta do porquê espera, sem cascata de zeros',
   (h => [h.includes('Nenhum dia útil fechado na semana ainda'), h.includes('tks-casc')])(_taktHtml(_taktMontar(S, [], Object.assign({}, HOJE, { num:20261103 })), null, {})),
   [true, false]);
const SV = _taktSvg(T, 1200);
ok('o gráfico em HORAS DE LINHA: 02/11 FINADOS sem barras, quatro dias com o programado e o feito (03/11: 10h16 pedidas, 8h33 feitas), hoje 4h50 até agora; a linha de 1 dia (8h47); sem a linha do takt; números com halo por cima',
   [SV.includes('>FINADOS<'), (SV.match(/stroke-dasharray="5 4"/g) || []).length, (SV.match(/fill="var\(--tks-feito\)"/g) || []).length,
    ['>10h16<', '>8h33<', '>' + _fmtHM(Math.round((996.9 + 523.5) * 527 / 2761)) + ' até agora<', '>8h<'].filter(x => !SV.includes(x)),
    SV.includes('stroke-dasharray="12 6"'), SV.includes('<title>1 dia de linha: ' + _fmtHM(527)), SV.lastIndexOf('stroke-width="2"><title>1 dia') < SV.indexOf('paint-order="stroke"'),
    /06\/11 sex \(hoje\)/.test(SV)],
   [true, 4, 4, [], false, true, true, true]);
ok('o desenho não faz conta (tudo vem da montagem) e a conta não lê a tela nem a planilha',
   [/_taktMontar\(|_taktAgora\(|uepDiaMeta\(|\.linhas/.test(pega('function _taktHtml(') + pega('function _taktSvg(')),
    /document\.|PONTOS_DIA|UEP_HIST|CFG\.|jsonpFetch/.test(pega('function _taktMontar(') + pega('function _taktAgora(') + pega('function _taktRestMin('))],
   [false, false]);

console.log('\n── a ligação com a aba ──');
const R = pega('function renderUep('), CAR = pega('async function _uepAbaCarregar('), LD = pega('function _taktCarregar('), LER = pega('async function _taktLer(');
ok('a 6ª sub-aba: botão, chave, painel no renderUep e o número pintado com os outros',
   [/data-sub="takt"[^>]*onclick="_uepSub\('takt'\)"><b>TAKT DA SEMANA<\/b><span id="uep-sb-takt">/.test(html), /const UEP_SUBS = \[[^\]]*'takt'\];/.test(JS),
    R.includes("+pn('takt', bT)"), /\['hoje', 'periodo', 'prod', 'takt'\]\.forEach/.test(pega('function _uepSubPintar(')), /T, taktEst:/.test(R)],
   [true, true, true, true, true]);
ok('a leitura: action=getProgramacaoSemana, 3 tentativas em sequência, voo compartilhado, a última da fila da aba e na fila da RÉGUAS',
   [LER.includes("action=getProgramacaoSemana"), /for\(let t=1; t<=3; t\+\+\)/.test(LER), /if\(TKS_VOO\) return TKS_VOO;/.test(LD) && /TKS_VOO=_taktLer\(''\)/.test(LD),
    CAR.indexOf('await _taktCarregar()') > CAR.indexOf('await _uepPadCarregar()'), /TKS_VOO \|\| TKP_VOO \|\| _pontosVoo/.test(pega('function _uepLendo('))],
   [true, true, true, true, true]);
ok('o .gs antigo (responde sem linhas) é o único caso que manda re-deployar; renova de outro dia sempre, velha só com a sub-aba aberta',
   [/return \{ falha:'sem-endpoint', erro:'' \};/.test(LER), _taktEstadoHtml('sem-endpoint', '', 'x()', '').includes('cole o ritmoprod_appscript.gs v5.59 e re-deploye'),
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

console.log('\n── a semana que vem (v7.210.0): o planejamento ──');
// [data, código, qtde, uepCx, saldo] — a programação de 09–15/11 lida em 06/11/2026 (nenhum lote adiantado)
const LINP = [
  ["09/11", "501094001", 200, 0.83, 200],
  ["09/11", "501094002", 400, 0.83, 400],
  ["09/11", "501094003", 400, 0.83, 400],
  ["09/11", "501094004", 1000, 0.83, 1000],
  ["09/11", "501094005", 200, 0.83, 200],
  ["09/11", "501106001", 85, 1.85, 85],
  ["09/11", "501106002", 170, 1.85, 170],
  ["09/11", "501106011", 45, 1.85, 45],
  ["09/11", "501083122", 20, 3.15, 20],
  ["09/11", "501083124", 280, 3.15, 280],
  ["10/11", "501097001", 100, 1.42, 100],
  ["10/11", "501097002", 100, 1.42, 100],
  ["10/11", "501097003", 100, 1.42, 100],
  ["10/11", "501097004", 500, 1.42, 500],
  ["10/11", "501097005", 50, 1.42, 50],
  ["10/11", "501071004", 100, 2.92, 100],
  ["10/11", "501071005", 100, 2.96, 100],
  ["10/11", "501071006", 100, 2.19, 100],
  ["10/11", "501154001", 115, 1.77, 115],
  ["10/11", "501154002", 40, 1.77, 40],
  ["10/11", "501154003", 45, 1.77, 45],
  ["10/11", "501134001", 100, 1.9, 100],
  ["10/11", "501134002", 350, 1.9, 350],
  ["11/11", "501085006", 40, 2.33, 40],
  ["11/11", "501085079", 25, 2.33, 25],
  ["11/11", "501085118", 135, 2.33, 135],
  ["11/11", "501151001", 110, 3.01, 110],
  ["11/11", "501151002", 90, 3.01, 90],
  ["11/11", "501060001", 140, 1.73, 140],
  ["11/11", "501060002", 140, 1.71, 140],
  ["11/11", "501060003", 230, 1.73, 230],
  ["11/11", "501060004", 230, 1.71, 230],
  ["11/11", "501060005", 30, 1.73, 30],
  ["11/11", "501060006", 30, 1.71, 30],
  ["12/11", "501126001", 240, 1.67, 240],
  ["12/11", "501126002", 10, 1.67, 10],
  ["12/11", "501141004", 140, 1.84, 140],
  ["12/11", "501141005", 430, 1.84, 430],
  ["12/11", "501141006", 30, 1.84, 30],
  ["12/11", "501061001", 100, 1.85, 100],
  ["12/11", "501061002", 100, 2.2, 100],
  ["12/11", "501061003", 150, 1.85, 150],
  ["12/11", "501061004", 150, 2.2, 150],
  ["12/11", "501061005", 50, 1.85, 50],
  ["12/11", "501061006", 50, 2.2, 50],
  ["13/11", "501142001", 25, 0.95, 25],
  ["13/11", "501142002", 635, 0.95, 635],
  ["13/11", "501142003", 50, 0.95, 50],
  ["13/11", "501142004", 390, 0.95, 390],
  ["13/11", "501086116", 35, 3.87, 35],
  ["13/11", "501086117", 35, 2.99, 35],
  ["13/11", "501086118", 115, 3.87, 115],
  ["13/11", "501086119", 115, 2.99, 115],
  ["13/11", "501117001", 60, 1.75, 60],
  ["13/11", "501117002", 30, 1.75, 30],
  ["13/11", "501117003", 20, 1.75, 20],
  ["13/11", "501117004", 240, 1.75, 240],
  ["13/11", "501117005", 25, 1.75, 25],
  ["13/11", "501117006", 25, 1.75, 25]
];
const SP = { ok:true, de:'09/11/2026', ate:'15/11/2026', hoje:'06/11/2026', feriados:[],
  linhas: LINP.map(([d, codigo, qtde, uepCx, saldo]) => ({ data:d + '/2026', dataNum:_cartNum(d + '/2026'), codigo, qtde, uepCx,
    uep:uepCx ? Math.round(qtde * uepCx * 10) / 10 : null, saldo, aba:'aberta', encerrada:false, foraEsteira:false })) };
ok('a semana que vem: da segunda seguinte ao domingo — de sexta, de domingo (a semana vira na segunda) e na virada do mês',
   [_taktProxSemana('06/11/2026'), _taktProxSemana('08/11/2026'), _taktProxSemana('09/11/2026'), _taktProxSemana('26/11/2026')],
   [{ de:'09/11/2026', ate:'15/11/2026' }, { de:'09/11/2026', ate:'15/11/2026' }, { de:'16/11/2026', ate:'22/11/2026' }, { de:'30/11/2026', ate:'06/12/2026' }]);
const T1 = _taktMontar(SP, [], { num:20261106, meta:2761 }), P1 = _taktProxMontar(T1);
ok('09–13/11: 9.050 cx = 14.504,2 UEP em 5 dias úteis → takt 10,90 s por UEP, 2.900,8/dia, 105,1% da referência; nada feito ainda',
   [T1.progCx, r1(T1.progUep), T1.nUteis, Math.round(T1.takt * 100) / 100, r1(T1.porDia), r1(T1.pede), T1.exec.s, T1.cas.n],
   [9050, 14504.2, 5, 10.9, 2900.8, 105.1, null, 0]);
ok('a semana × a jornada pelo saldo: pedem 2h48 de linha (14.503,5 × 527 ÷ 2.761) para 43h55 — faltam 2h13, o MESMO "semana que vem: faltam 2h13" do PRÓXIMOS DIAS',
   [r1(P1.uep), r1(P1.cap), r1(P1.passa), Math.round(P1.minPede), P1.minJorn, P1.saldoMin, _fmtHM(P1.saldoMin)],
   [14503.5, 13805, 698.5, 2768, 2635, 133, _fmtHM(133)]);
ok('dia a dia: 09/11 (120%), 10/11 (117%) e 13/11 (100,5%) passam da referência (1.040); 11/11 e 12/11 têm folga (341,5); redistribuir absorve 341,5 e 698,5 ficam sem lugar',
   [P1.acima.map(d => [d.data.slice(0, 5), r1(d.pct)]), P1.folga.map(d => [d.data.slice(0, 5), r1(-d.exc)]), r1(P1.exc), r1(P1.sobra), r1(P1.redist), r1(P1.exc - P1.redist)],
   [[['09/11', 120.5], ['10/11', 116.7], ['13/11', 100.5]], [['11/11', 317], ['12/11', 24.5]], 1040, 341.5, 341.5, 698.5]);
{ const L = SP.linhas.map(l => l.data === '09/11/2026' && l.codigo === SP.linhas[0].codigo ? Object.assign({}, l, { saldo:0 }) : l);
  L.push({ data:'14/11/2026', dataNum:20261114, codigo:'501001001', qtde:100, uepCx:2, uep:200, saldo:100, aba:'aberta', foraEsteira:false });
  const Px = _taktProxMontar(_taktMontar(Object.assign({}, SP, { linhas:L }), [], { num:20261106, meta:2761 }));
  const a0 = SP.linhas[0].qtde * SP.linhas[0].uepCx;
  ok('lote já adiantado sai da conta (o saldo manda, e a nota diz quanto); sábado com lote fica à parte, como hora extra',
     [r1(Px.adiant), r1(P1.uep - Px.uep), P1.adiant, Px.fds.map(d => [d.data.slice(0, 5), d.uep])], [r1(a0), r1(a0), 0, [['14/11', 200]]]); }
const HP = _taktProxHtml(T1, P1, { largura:1200, botoes:_taktSemBotoes(1) });
ok('o desenho da semana que vem: takt, referência, 2h13 além da jornada (vermelho), 3 de 5 dias acima, a frase com a redistribuição; sem executado e sem porquê',
   [['10,9<small>s por UEP</small>', '2h13<small> além da jornada</small>', '3<small> de 5</small>', '<b>5,1% acima</b>', 'passam <b>699 UEP</b> da jornada, <b>2h13 de linha</b>',
     'os dias com folga (11/11 e 12/11) absorvem <b>341</b> e <b>699</b> continuam sem lugar na jornada.', 'onclick="_taktProxCarregar(true)"',
     'O PRÓXIMOS DIAS mostra esta semana dia a dia'].filter(t => !HP.includes(_fmtHM(133) === '2h13' ? t : t)),
    /<div class="kpi-card red"[^>]*><div class="kpi-lbl">A SEMANA × A JORNADA/.test(HP), /EXECUTADO|POR QUE NÃO ACOMPANHOU|AGORA ·/.test(HP)],
   [[], true, false]);
{ const SV1 = _taktSvg(T1, 1200, { fut:true });
  ok('o gráfico da semana que vem em horas: o saldo de cada dia (09/11 10h35), âmbar acima de 1 dia de linha, sem barra de feito',
     [(SV1.match(/stroke="var\(--warn\)" stroke-width="1.5" stroke-dasharray="5 4"/g) || []).length, (SV1.match(/stroke-dasharray="5 4"/g) || []).length,
      SV1.includes('>' + _fmtHM(Math.round(3326 * 527 / 2761)) + '<'), SV1.includes('var(--tks-feito)')], [3, 5, true, false]); }
ok('a escolha da semana e o botão: o painel e o número são da semana escolhida',
   [_taktSemBotoes(0).includes('class="on" onclick="_taktSemSet(0)"'), _taktSemBotoes(1).includes('class="on" onclick="_taktSemSet(1)"'),
    _uepSubTakt(T1, null, 'semana que vem'), /taktRot:TKS_SEM===2 \? 'avaliação' : TKS_SEM===1 \? 'semana que vem' : ''/.test(R), /T:TKS_SEM===2 \? TA : TKS_SEM===1 \? T1 : T/.test(R)],
   [true, true, { txt:'semana que vem: pede ' + fmtP(T1.pede), cls:'warn' }, true, true]);
{ const LP = pega('function _taktProxCarregar('), SS = pega('function _taktSemSet(');
  ok('a leitura da semana que vem: a MESMA (_taktLer) com de/ate, só quando escolhida e na fila (uma leitura por vez); renova ao virar a semana',
     [/_taktLer\('&de='\+encodeURIComponent\(w\.de\)\+'&ate='\+encodeURIComponent\(w\.ate\)\)/.test(LP), /TKP\.de===w\.de/.test(LP),
      /_uepDepoisDe\(_uepLendo, /.test(SS), /tkpOk=!!\(TKP && TKP\.de===w\.de\)/.test(R), /!_uepLendo\(\) && Date\.now\(\)-TKP_TS>/.test(R)],
     [true, true, true, true, true]); }
console.log('\n── simulação e 🖨 para a diretoria (v7.210.0) ──');
const CEN = _taktCenarios(2761, T, { n:10, media:2653 }), SIM = _taktSimular(P1, T1.nUteis, CEN);
ok('três cenários: a referência, o ritmo desta semana (8.647,2 UEP em 1.821 min = 2.502,5/dia, o EXECUTADO) e a média do PERÍODO',
   CEN.map(c => [c.id, r1(c.uepDia)]), [['ref', 2761], ['sem', 2502.5], ['per', 2653]]);
ok('a semana que vem (14.503,5 UEP de saldo, 9.050 cx) em cada ritmo: na referência faltam 698,5 UEP = 2h13 (o do PRÓXIMOS DIAS) ≈ 436 cx; no ritmo desta semana 1.990,9 = 6h59; na média do período 1.238,5 = 4h06',
   SIM.map(c => [c.id, Math.round(c.cap), r1(c.falta), c.min, _fmtHM(c.min), Math.round(c.cx)]),
   [['ref', 13805, 698.5, 133, _fmtHM(133), 436], ['sem', 12513, 1990.9, 419, _fmtHM(419), 1242], ['per', 13265, 1238.5, 246, _fmtHM(246), 773]]);
ok('sem o executado nem o período, só a referência; semana que cabe = falta negativa (sobra), nunca hora extra',
   [_taktCenarios(2761, null, null).map(c => c.id), _taktCenarios(2761, Object.assign({}, T, { exec:{ uep:0, min:0 } }), { n:0, media:null }).length,
    (c => [c.falta < 0, c.min < 0])(_taktSimular(Object.assign({}, P1, { uep:10000 }), 5, [{ id:'ref', uepDia:2761 }])[0])],
   [['ref'], 1, [true, true]]);
{ const HS = _taktProxHtml(T1, P1, { largura:1200, sim:SIM });
  ok('na tela: o quadro da simulação (um por cenário, horas de hora extra e caixas a re-datar) e a frase com o ritmo desta semana',
     [HS.includes('<b>SIMULAÇÃO</b>'), (HS.match(/de hora extra nesse ritmo/g) || []).length, HS.includes('No ritmo desta semana (90,6% da referência) faltariam <b>' + _fmtHM(419) + '</b>'),
      HS.includes('ou re-datar 1.991 UEP (≈ 1.242 cx)')], [true, 3, true, true]); }
console.log('\n── v7.211.0: o veredito em horas de linha (tela e 🖨 diretas) ──');
const RIT = CEN.find(c => c.id === 'sem').uepDia, K = 527 / 2761;
const V0 = _taktVeredito(T, null, RIT), V1 = _taktVeredito(T1, P1, RIT);
ok('esta semana: o saldo (5.096,8 UEP) precisa de 16h13 de linha e restam 4h47 de jornada → faltam 11h26 (≈ 1.671 cx); no ritmo atual, 13h06',
   [V0.precisaMin, V0.temMin, V0.faltaMin, _fmtHM(V0.faltaMin), V0.cabe, V0.encerrada, Math.round(V0.faltaCx), V0.ritmo.faltaMin, r1(V0.ritmo.pct)],
   [Math.round(T.falta.uep * K), 287, Math.round(T.falta.uep * K) - 287, _fmtHM(686), false, false, Math.round(T.falta.passa / (T.falta.uep / 2370)), Math.round(T.falta.uep * 527 / RIT) - 287, 90.6]);
ok('semana que vem: precisa de 46h08, tem 43h55 → faltam 2h13 — o MESMO do PRÓXIMOS DIAS e da simulação (≈ 436 cx; no ritmo atual 6h59 e ≈ 1.242 cx)',
   [_fmtHM(V1.precisaMin), _fmtHM(V1.temMin), V1.faltaMin === P1.saldoMin && V1.faltaMin === SIM[0].min, Math.round(V1.faltaCx) === Math.round(SIM[0].cx),
    V1.ritmo.faltaMin, Math.round(V1.ritmo.faltaCx) === Math.round(SIM[1].cx)],
   [_fmtHM(2768), _fmtHM(2635), true, true, SIM[1].min, true]);
{ const h1 = _taktHeroHtml(V1, { semana:'prox', nUteis:5, sobra:V0 }), h0 = _taktHeroHtml(V0, { semana:'esta', ate:'17:00' });
  ok('o veredito: a palavra, quanto falta, PRECISA × TEM, o ritmo atual, e na semana que vem a soma com o que não fechar desta (o PRÓXIMOS DIAS não soma)',
     [h1.includes('<div class="tks-hv">NÃO CABE</div>'), h1.includes('faltam <b>2h13</b> de linha'), h1.includes('a programação precisa de <b>46h08</b> de linha · a linha tem <b>43h55</b> (5 dias de ' + _fmtHM(527) + ')'),
      h1.includes('com a sobra desta semana (' + _fmtHM(686) + ', se nada mudar): faltam <b>' + _fmtHM(133 + 686) + '</b>'),
      h1.includes('para fechar: hora extra, ou tirar ≈ <b>436</b> caixas da semana (≈ 1.242 no ritmo atual)'),
      h0.includes('<div class="tks-hv">NÃO FECHA</div>'), h0.includes('resta' + 'm <b>' + _fmtHM(287) + '</b> de jornada até 17:00'), h0.includes('o que não couber passa para a semana que vem (≈ 1.671 caixas)'),
      (h1.match(/class="tks-br/g) || []).length, h1.includes('tks-br pr')],
     [true, true, true, true, true, true, true, true, 2, true]); }
{ const Vc = _taktVeredito(T1, Object.assign({}, P1, { uep:10000, minPede:10000 * K, saldoMin:Math.round(10000 * K) - 2635, passa:10000 - 13805 }), RIT);
  const Hs = { num:20261107, minNorm:300, restMin:200, uep:500, he:40, meta:2761, fim:'17:00' };
  const Vs = _taktVeredito(_taktMontar(S, HIST.concat([{ data:'06/11/2026', uep:2400, uepHe:600, metaUep:2761 }]), Hs), null, RIT);
  ok('a semana que cabe diz CABE e quanto sobra (verde, sem "para fechar"); no sábado a desta semana diz NÃO FECHOU e quanto ficou, sem ritmo (não há jornada)',
     [(h => [h.includes('<div class="tks-hero ok"><div class="tks-hv">CABE</div>'), h.includes('sobram <b>'), h.includes('para fechar')])(_taktHeroHtml(Vc, { semana:'prox', nUteis:5 })),
      Vs.encerrada, (h => [h.includes('NÃO FECHOU'), h.includes('ficaram <b>'), h.includes('a jornada da semana acabou'), h.includes('no ritmo atual')])(_taktHeroHtml(Vs, { semana:'esta' }))],
     [[true, true, false], true, [true, true, true, false]]); }
console.log('\n── v7.212.0: a falta também em pontos; "média da linha entregue sem hora extra" ──');
{ // pontos do cadastro: 36 por caixa a cada 0,5 UEP (72 pontos por UEP em todas as linhas) — e um código sem pontos
  const cat = S.linhas.concat(SP.linhas).map(l => ({ codigo:l.codigo.slice(0, 3) + '.' + l.codigo.slice(3), pontos:l.codigo === '501060001' ? null : Math.round(l.uepCx * 72 * 100) / 100 }));
  const PM = _taktPtsMapa(cat), Tp = _taktMontar(S, HIST, HOJE, PM), T1p = _taktMontar(SP, [], { num:20261106, meta:2761 }, PM), P1p = _taktProxMontar(T1p);
  const V0p = _taktVeredito(Tp, null, RIT), V1p = _taktVeredito(T1p, P1p, RIT);
  ok('o mapa de pontos do cadastro: código só com dígitos ("501.088001" casa com "501088001"); sem pontos fica fora',
     [PM['501088001'] > 0, PM['501060001'], _taktPtsMapa([]), _taktPtsMapa(null)], [true, undefined, null, null]);
  { const Sd = Object.assign({}, S, { linhas:S.linhas.map(l => Object.assign({}, l, { codigo:l.codigo.slice(0, 3) + '.' + l.codigo.slice(3, 6) + '-' + l.codigo.slice(6) })) });
    ok('o código da programação com ponto ou traço também acha os pontos do cadastro', r1(_taktMontar(Sd, HIST, HOJE, PM).falta.pts), r1(Tp.falta.pts)); }
  ok('pontos por UEP da semana = Σ pontos ÷ Σ UEP do saldo com pontos (72); a falta em pontos = a falta em UEP × 72 (a semana que vem: 698,5 UEP ≈ 50.300 pontos)',
     [r1(V0p.ptsUep), r1(V1p.ptsUep), Math.round(V0p.faltaPts) === Math.round(Tp.falta.passa * V0p.ptsUep), Math.round(V1p.faltaPts), _tkPts(V1p.faltaPts),
      Math.round(V1p.ritmo.faltaPts) === Math.round(SIM[1].falta * V1p.ptsUep), _taktVeredito(T1, P1, RIT).faltaPts],
     [72, 72, true, Math.round(P1.passa * 72), '≈ ' + fmtN(Math.round(P1.passa * 72 / 100) * 100) + ' pontos', true, null]);
  const h1 = _taktHeroHtml(V1p, { semana:'prox', nUteis:5, sobra:V0p }), D2 = _taktDocHtml({ T0:Tp, T1:T1p, P1:P1p, V0:V0p, V1:V1p }, { data:'06/11/2026', hora:'11:58' });
  ok('na tela e na folha: a falta em horas e em pontos, o ritmo atual em % da MÉDIA, a soma em pontos; a definição diz quantos pontos vale a UEP de cada semana',
     [h1.includes('faltam <b>2h13</b> de linha <small>' + _tkPts(V1p.faltaPts) + '</small>'), h1.includes('no ritmo atual da linha (90,6% da média): faltam <b>' + _fmtHM(SIM[1].min) + '</b> (' + _tkPts(V1p.ritmo.faltaPts) + ')'),
      h1.includes('faltam <b>' + _fmtHM(819) + '</b> (' + _tkPts(V1p.faltaPts + V0p.faltaPts) + ')'), h1.includes('referência'),
      D2.includes('a semana que vem, <b>2h13</b> de linha (' + _tkPts(V1p.faltaPts) + ')'), D2.includes('<b>Pontos</b> = a falta em UEP × os pontos por UEP dos lotes da semana (esta semana 72, a que vem 72 pontos por UEP'),
      D2.includes('média que a linha entrega sem hora extra: 1 dia de linha = ' + _fmtHM(527) + ' de jornada = 2.761 UEP</b> (a referência de UEP do painel, ' + UEP_REF_STATUS)],
     [true, true, true, false, true, true, true]); }
ok('os detalhes recolhidos lembram se estavam abertos (o refresh da tela redesenha o painel)',
   [_taktDetHtml('x').includes('<details class="tks-det" ontoggle="TKS_DET=this.open">'), (global.TKS_DET = true, _taktDetHtml('x').includes('<details class="tks-det" open')), (global.TKS_DET = false)],
   [true, true, false]);
{ const DOC = _taktDocHtml({ T0:T, T1, P1, V0, V1 }, { data:'06/11/2026', hora:'11:58' });
  ok('🖨 direta: uma frase no topo com os dois vereditos e a soma; por semana a palavra, o quanto falta e o porquê com as DUAS causas',
     ['<b>Nenhuma das duas semanas cabe na linha.</b> Esta semana faltam <b>' + _fmtHM(686) + '</b> de linha; a semana que vem, <b>2h13</b> de linha — <b>' + _fmtHM(819) + '</b> somando o que não fechar desta.',
      '<div class="tks-hv">NÃO FECHA</div>', '<div class="tks-hv">NÃO CABE</div>', '<b>73% excesso de programação</b>, <b>27% ritmo da linha</b>',
      '1 dia de linha = ' + _fmtHM(527) + ' de jornada = 2.761 UEP'].filter(x => !DOC.includes(x)), []);
  ok('🖨 sem poluição: nada de s por UEP, cascata, tabela de cenários ou agora; os dois gráficos em horas no tamanho do papel; a referência dita como "em avaliação"',
     [DOC.includes('<div class="td-cols">'), /s por UEP|s\/UEP|<table|td-casc|AGORA ·|ÚLTIMA HORA/.test(DOC) || /\btakt\b/i.test(DOC.split('TAKT DA SEMANA').join('')),
      (DOC.match(new RegExp('viewBox="0 0 ' + TKS_DOC_SVG_W + ' ' + TKS_DOC_SVG_H + '"', 'g')) || []).length, DOC.includes(UEP_REF_STATUS)],
     [true, false, 2, true]); }
{ const G0 = pega('async function gerarRelatorioTakt(');
  ok('🖨 a janela abre no clique, lê o que faltar (histórico, esta semana, a que vem) e monta com as MESMAS contas da tela; no menu 🖨 IMPRIMIR ▾',
     [G0.indexOf("window.open(") < G0.indexOf('await '), /_taktMontar\(TKS, UEP_HIST, _taktHoje\(D, hojeN\), pts\)/.test(G0), /_taktProxMontar\(T1\)/.test(G0),
      /_taktVeredito\(T0, null, rit\)/.test(G0) && /_taktVeredito\(T1, P1, rit\)/.test(G0),
      /onclick="_uepImpFecha\(\);gerarRelatorioTakt\(\)"/.test(html), /T=_taktMontar\(TKS, UEP_HIST, _taktHoje\(D, hojeN\), _taktPtsMapa\(_pdiaPcCat\(\)\)\)/.test(R)],
     [true, true, true, true, true, true]); }

console.log('\n── v7.213.0: AVALIAR PROGRAMAÇÃO (a colagem da planilha) ──');
['function _capVol(', 'function _capNome(', 'function _capProdutos(', 'function _tkaCorrente(', 'function _tkaFaixas(', 'function _tkaSaldoHtml(', 'function _tkaDocHtml(', 'function _tkaNorm(', 'function _tkaChave(', 'function _tkaAchar(', 'function _tkaNum(', 'function _tkaData(', 'function _tkaLer(', 'function _tkaMontar(', 'function _tkaHtml('].forEach(f => eval.call(global, pega(f)));
eval.call(global, pegaConst('ESTEIRA_VAO_PADRAO').replace(/^const /, 'global.'));
global.TKA_TXT = '';
// o cadastro de 06/11/2026 dos 16 produtos da semana 042-26 (60 códigos) e o bloco F5:I44 dela como o Excel copia
const CAT42 = [{"codigo": "501060001", "desc": "VOL 1/2 PENTEADEIRA CAMARIM MEL", "cor": "BRANCO", "uep": 1.73, "pontos": 239.063}, {"codigo": "501060002", "desc": "VOL 2/2 PENTEADEIRA CAMARIM MEL", "cor": "BRANCO", "uep": 1.71, "pontos": 88.6733}, {"codigo": "501060003", "desc": "VOL 1/2 PENTEADEIRA CAMARIM MEL", "cor": "OFF WHITE", "uep": 1.73, "pontos": 238.4353}, {"codigo": "501060004", "desc": "VOL 2/2 PENTEADEIRA CAMARIM MEL", "cor": "OFF WHITE", "uep": 1.71, "pontos": 88.098}, {"codigo": "501060005", "desc": "VOL 1/2 PENTEADEIRA CAMARIM MEL", "cor": "CINAMOMO/OFF WHITE", "uep": 1.73, "pontos": 237.5668}, {"codigo": "501060006", "desc": "VOL 2/2 PENTEADEIRA CAMARIM MEL", "cor": "CINAMOMO/OFF WHITE", "uep": 1.71, "pontos": 87.5957}, {"codigo": "501061001", "desc": "VOL 1/2 PENTEADEIRA CAMARIM ELOA", "cor": "BRANCO", "uep": 1.85, "pontos": 308.539}, {"codigo": "501061002", "desc": "VOL 2/2 PENTEADEIRA CAMARIM ELOA", "cor": "BRANCO", "uep": 2.2, "pontos": 168.0543}, {"codigo": "501061003", "desc": "VOL 1/2 PENTEADEIRA CAMARIM ELOA", "cor": "OFF WHITE", "uep": 1.85, "pontos": 302.1644}, {"codigo": "501061004", "desc": "VOL 2/2 PENTEADEIRA CAMARIM ELOA", "cor": "OFF WHITE", "uep": 2.2, "pontos": 165.8917}, {"codigo": "501061005", "desc": "VOL 1/2 PENTEADEIRA CAMARIM ELOA", "cor": "CINAMOMO/OFF WHITE", "uep": 1.85, "pontos": 301.0195}, {"codigo": "501061006", "desc": "VOL 2/2 PENTEADEIRA CAMARIM ELOA", "cor": "CINAMOMO/OFF WHITE", "uep": 2.2, "pontos": 165.3581}, {"codigo": "501071001", "desc": "VOL 1/3 HOME RIPADO SUPREMO 1.8", "cor": "CINAMOMO", "uep": 2.92, "pontos": 148.0685}, {"codigo": "501071002", "desc": "VOL 2/3 HOME RIPADO SUPREMO 1.8", "cor": "CINAMOMO", "uep": 2.96, "pontos": 161.7799}, {"codigo": "501071003", "desc": "VOL 3/3 HOME RIPADO SUPREMO 1.8", "cor": "CINAMOMO", "uep": 2.19, "pontos": 113.0867}, {"codigo": "501071004", "desc": "VOL 1/3 HOME RIPADO SUPREMO 1.8", "cor": "CINAMOMO/OFF WHITE", "uep": 2.92, "pontos": 148.0685}, {"codigo": "501071005", "desc": "VOL 2/3 HOME RIPADO SUPREMO 1.8", "cor": "CINAMOMO/OFF WHITE", "uep": 2.96, "pontos": 161.7799}, {"codigo": "501071006", "desc": "VOL 3/3 HOME RIPADO SUPREMO 1.8", "cor": "CINAMOMO/OFF WHITE", "uep": 2.19, "pontos": 113.9499}, {"codigo": "501083122", "desc": "VOL 1/1 RACK FLIP 2.2", "cor": "OFF WHITE", "uep": 3.15, "pontos": 323.9697}, {"codigo": "501083123", "desc": "VOL 1/1 RACK FLIP 2.2", "cor": "OFF WHITE/CUMARU", "uep": 3.15, "pontos": 323.5116}, {"codigo": "501083124", "desc": "VOL 1/1 RACK FLIP 2.2", "cor": "OFF WHITE/CINAMOMO", "uep": 3.15, "pontos": 323.441}, {"codigo": "501085006", "desc": "VOL 1/1 BUFFET FLIP 1.2", "cor": "OFF WHITE", "uep": 2.33, "pontos": 303.1309}, {"codigo": "501085079", "desc": "VOL 1/1 BUFFET FLIP 1.2", "cor": "OFF WHITE/CUMARU", "uep": 2.33, "pontos": 302.8245}, {"codigo": "501085118", "desc": "VOL 1/1 BUFFET FLIP 1.2", "cor": "OFF WHITE/CINAMOMO", "uep": 2.33, "pontos": 302.7785}, {"codigo": "501086116", "desc": "VOL 1/2 HOME RIPADO ANTARES 1.4", "cor": "CINAMOMO", "uep": 3.87, "pontos": 177.2911}, {"codigo": "501086117", "desc": "VOL 2/2 HOME RIPADO ANTARES 1.4", "cor": "CINAMOMO", "uep": 2.99, "pontos": 107.88}, {"codigo": "501086118", "desc": "VOL 1/2 HOME RIPADO ANTARES 1.4", "cor": "CINAMOMO/OFF WHITE", "uep": 3.87, "pontos": 177.2911}, {"codigo": "501086119", "desc": "VOL 2/2 HOME RIPADO ANTARES 1.4", "cor": "CINAMOMO/OFF WHITE", "uep": 2.99, "pontos": 108.1339}, {"codigo": "501094001", "desc": "VOL 1/1 MESA CABECEIRA SLEEP", "cor": "BRANCO", "uep": 0.83, "pontos": 28.3591}, {"codigo": "501094002", "desc": "VOL 1/1 MESA CABECEIRA SLEEP", "cor": "PRETO ACETINADO", "uep": 0.83, "pontos": 28.6036}, {"codigo": "501094003", "desc": "VOL 1/1 MESA CABECEIRA SLEEP", "cor": "CINZA/NATURE", "uep": 0.83, "pontos": 28.4455}, {"codigo": "501094004", "desc": "VOL 1/1 MESA CABECEIRA SLEEP", "cor": "OFF WHITE/NATURE", "uep": 0.83, "pontos": 27.998}, {"codigo": "501094005", "desc": "VOL 1/1 MESA CABECEIRA SLEEP", "cor": "PRETO ACETINADO/NATURE", "uep": 0.83, "pontos": 28.252}, {"codigo": "501097001", "desc": "VOL 1/1 KIT 2 MESA CABECEIRA SLEEP", "cor": "BRANCO", "uep": 1.42, "pontos": 52.6128}, {"codigo": "501097002", "desc": "VOL 1/1 KIT 2 MESA CABECEIRA SLEEP", "cor": "PRETO ACETINADO", "uep": 1.42, "pontos": 53.1018}, {"codigo": "501097003", "desc": "VOL 1/1 KIT 2 MESA CABECEIRA SLEEP", "cor": "CINZA/NATURE", "uep": 1.42, "pontos": 52.7856}, {"codigo": "501097004", "desc": "VOL 1/1 KIT 2 MESA CABECEIRA SLEEP", "cor": "OFF WHITE/NATURE", "uep": 1.42, "pontos": 51.8906}, {"codigo": "501097005", "desc": "VOL 1/1 KIT 2 MESA CABECEIRA SLEEP", "cor": "PRETO ACETINADO/NATURE", "uep": 1.42, "pontos": 52.3986}, {"codigo": "501106001", "desc": "VOL 1/1 RACK SIRIUS 0.9", "cor": "ALECRIM/CINAMOMO", "uep": 1.85, "pontos": 109.3356}, {"codigo": "501106002", "desc": "VOL 1/1 RACK SIRIUS 0.9", "cor": "OFF WHITE/CINAMOMO", "uep": 1.85, "pontos": 109.4205}, {"codigo": "501106003", "desc": "VOL 1/1 RACK SIRIUS 0.9", "cor": "BRANCO ACETINADO/CINAMOMO", "uep": 1.85, "pontos": 109.9069}, {"codigo": "501106011", "desc": "VOL 1/1 RACK SIRIUS 0.9", "cor": "CINAMOMO", "uep": 1.85, "pontos": 108.8747}, {"codigo": "501117001", "desc": "VOL 1/1 ESCRIVANINHA PRISM", "cor": "OFF WHITE/CUMARU", "uep": 1.75, "pontos": 169.5624}, {"codigo": "501117002", "desc": "VOL 1/1 ESCRIVANINHA PRISM", "cor": "PRETO ACETINADO/CUMARU", "uep": 1.75, "pontos": 170.8981}, {"codigo": "501117003", "desc": "VOL 1/1 ESCRIVANINHA PRISM", "cor": "BRANCO ACETINADO/CUMARU", "uep": 1.75, "pontos": 170.5737}, {"codigo": "501117004", "desc": "VOL 1/1 ESCRIVANINHA PRISM", "cor": "OFF WHITE/CINAMOMO", "uep": 1.75, "pontos": 169.5667}, {"codigo": "501117005", "desc": "VOL 1/1 ESCRIVANINHA PRISM", "cor": "BRANCO ACETINADO/CINAMOMO", "uep": 1.75, "pontos": 170.578}, {"codigo": "501117006", "desc": "VOL 1/1 ESCRIVANINHA PRISM", "cor": "PRETO ACETINADO/CINAMOMO", "uep": 1.75, "pontos": 170.9024}, {"codigo": "501126001", "desc": "VOL 1/1 MESA CENTRO PRISM", "cor": "OFF WHITE", "uep": 1.67, "pontos": 90.4193}, {"codigo": "501126002", "desc": "VOL 1/1 MESA CENTRO PRISM", "cor": "BRANCO ACETINADOETINADO", "uep": 1.67, "pontos": 92.0158}, {"codigo": "501134001", "desc": "VOL 1/1 PENTEADEIRA PRINCESA", "cor": "BRANCO", "uep": 1.9, "pontos": 257.979}, {"codigo": "501134002", "desc": "VOL 1/1 PENTEADEIRA PRINCESA", "cor": "ROSA", "uep": 1.9, "pontos": 257.1956}, {"codigo": "501141004", "desc": "VOL 1/1 BUFFET 3 PT PRISM", "cor": "CINAMOMO", "uep": 1.84, "pontos": 167.3184}, {"codigo": "501141005", "desc": "VOL 1/1 BUFFET 3 PT PRISM", "cor": "OFF WHITE/CINAMOMO", "uep": 1.84, "pontos": 167.2584}, {"codigo": "501141006", "desc": "VOL 1/1 BUFFET 3 PT PRISM", "cor": "BRANCO ACETINADO/CINAMOMO", "uep": 1.84, "pontos": 168.3505}, {"codigo": "501151001", "desc": "VOL 1/1 RACK MOVE 1.6", "cor": "CINAMOMO/OFF WHITE", "uep": 3.01, "pontos": 162.9592}, {"codigo": "501151002", "desc": "VOL 1/1 RACK MOVE 1.6", "cor": "CINAMOMO", "uep": 3.01, "pontos": 163.0758}, {"codigo": "501154001", "desc": "VOL 1/1 ESCRIVANINHA ART", "cor": "OFF WHITE", "uep": 1.77, "pontos": 185.3474}, {"codigo": "501154002", "desc": "VOL 1/1 ESCRIVANINHA ART", "cor": "BRANCO ACETINADO", "uep": 1.77, "pontos": 187.1897}, {"codigo": "501154003", "desc": "VOL 1/1 ESCRIVANINHA ART", "cor": "CINAMOMO", "uep": 1.77, "pontos": 184.4147}, {"codigo": "501075001", "desc": "VOL 1/2 ROUPEIRO GOLDEN", "cor": "BRANCO", "uep": 1.49, "pontos": 90.7878}, {"codigo": "501075002", "desc": "VOL 2/2 ROUPEIRO GOLDEN", "cor": "BRANCO", "uep": 2.32, "pontos": 137.7057}, {"codigo": "501075003", "desc": "VOL 1/2 ROUPEIRO GOLDEN", "cor": "BRANCO/AZUL", "uep": 1.49, "pontos": 90.7878}, {"codigo": "501075004", "desc": "VOL 2/2 ROUPEIRO GOLDEN", "cor": "BRANCO/AZUL", "uep": 2.32, "pontos": 137.7549}, {"codigo": "501075005", "desc": "VOL 1/2 ROUPEIRO GOLDEN", "cor": "BRANCO/ROSA", "uep": 1.49, "pontos": 90.7878}, {"codigo": "501075006", "desc": "VOL 2/2 ROUPEIRO GOLDEN", "cor": "BRANCO/ROSA", "uep": 2.32, "pontos": 137.7203}, {"codigo": "501090001", "desc": "VOL 1/1 CANT CAFE ACONCHEGO", "cor": "BRANCO", "uep": 2.07, "pontos": 151.6527}, {"codigo": "501090002", "desc": "VOL 1/1 CANT CAFE ACONCHEGO", "cor": "PRETO ACETINADO", "uep": 2.07, "pontos": 150}, {"codigo": "501090004", "desc": "VOL 1/1 CANT CAFE ACONCHEGO", "cor": "GRAFITE/CINAMOMO", "uep": 2.07, "pontos": 153.292}, {"codigo": "501090005", "desc": "VOL 1/1 CANT CAFE ACONCHEGO", "cor": "CINAMOMO/OFF WHITE", "uep": 2.07, "pontos": 149.7267}, {"codigo": "501093001", "desc": "VOL 1/1 CANT CAFE AURORA", "cor": "CINAMOMO/OFF WHITE", "uep": 2.04, "pontos": 124.603}, {"codigo": "501093002", "desc": "VOL 1/1 CANT CAFE AURORA", "cor": "OFF WHITE/CINAMOMO", "uep": 2.04, "pontos": 126.0247}, {"codigo": "501093003", "desc": "VOL 1/1 CANT CAFE AURORA", "cor": "BRANCO ACETINADO/CINAMOMO", "uep": 2.04, "pontos": 126.6803}, {"codigo": "501101001", "desc": "RACK BRITO 137 CM", "cor": "BRANCO FOSCO", "uep": 1.95, "pontos": 102.0645}, {"codigo": "501101002", "desc": "RACK BRITO 137 CM", "cor": "MARSALA FOSCO", "uep": 1.95, "pontos": 102.1819}, {"codigo": "501101003", "desc": "RACK BRITO 137 CM", "cor": "PRETO/CEDRO", "uep": 1.95, "pontos": 99.546}, {"codigo": "501101004", "desc": "RACK BRITO 137 CM", "cor": "BRANCO/CEDRO", "uep": 1.95, "pontos": 101.9596}, {"codigo": "501135001", "desc": "VOL 1/1 PENT CAMARIM 1PT 2GAV DIAMANTE", "cor": "OFF WHITE", "uep": 1.83, "pontos": 187.0593}, {"codigo": "501135002", "desc": "VOL 1/1 PENT CAMARIM 1PT 2GAV DIAMANTE", "cor": "BRANCO ACETINADO", "uep": 1.83, "pontos": 188.506}, {"codigo": "501142001", "desc": "VOL 1/1 CONJ 2 MESAS CANTO/LAT SLIM", "cor": "BRANCO", "uep": 0.95, "pontos": 77.3756}, {"codigo": "501142002", "desc": "VOL 1/1 CONJ 2 MESAS CANTO/LAT SLIM", "cor": "OFF WHITE", "uep": 0.95, "pontos": 77.203}, {"codigo": "501142003", "desc": "VOL 1/1 CONJ 2 MESAS CANTO/LAT SLIM", "cor": "PRETO ACETINADO", "uep": 0.95, "pontos": 77.0916}, {"codigo": "501142004", "desc": "VOL 1/1 CONJ 2 MESAS CANTO/LAT SLIM", "cor": "CINAMOMO", "uep": 0.95, "pontos": 76.8986}, {"codigo": "501148001", "desc": "VOL 1/1 COMODA GOLDEN 4 GAV", "cor": "BRANCO", "uep": 1.96, "pontos": 117.2225}, {"codigo": "501148002", "desc": "VOL 1/1 COMODA GOLDEN 4 GAV", "cor": "BRANCO/AZUL", "uep": 1.96, "pontos": 117.3209}, {"codigo": "501148003", "desc": "VOL 1/1 COMODA GOLDEN 4 GAV", "cor": "BRANCO/ROSA", "uep": 1.96, "pontos": 117.2517}, {"codigo": "501159001", "desc": "VOL 1/1 PUFF EVORA", "cor": "LINHO BEGE", "uep": 1.54, "pontos": 87.8148}, {"codigo": "501070001", "desc": "VOL 1/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "uep": 2.72, "pontos": 207.0059}, {"codigo": "501070002", "desc": "VOL 2/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "uep": 2.72, "pontos": 161.7667}, {"codigo": "501070003", "desc": "VOL 3/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "uep": 2.31, "pontos": 126.7574}, {"codigo": "501070004", "desc": "VOL 1/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO/OFF WHITE", "uep": 2.72, "pontos": 207.0059}, {"codigo": "501070005", "desc": "VOL 2/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO/OFF WHITE", "uep": 2.72, "pontos": 161.5981}, {"codigo": "501070006", "desc": "VOL 3/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO/OFF WHITE", "uep": 2.31, "pontos": 127.3772}, {"codigo": "501080001", "desc": "VOL 1/2 CRISTALEIRA ORION", "cor": "OFF WHITE", "uep": 1.67, "pontos": 188.5302}, {"codigo": "501080002", "desc": "VOL 2/2 CRISTALEIRA ORION", "cor": "OFF WHITE", "uep": 1.27, "pontos": 103.7056}, {"codigo": "501080003", "desc": "VOL 1/2 CRISTALEIRA ORION", "cor": "OFF WHITE/CUMARU", "uep": 1.67, "pontos": 188.5302}, {"codigo": "501080004", "desc": "VOL 2/2 CRISTALEIRA ORION", "cor": "OFF WHITE/CUMARU", "uep": 1.27, "pontos": 103.708}, {"codigo": "501080005", "desc": "VOL 1/2 CRISTALEIRA ORION", "cor": "CINAMOMO", "uep": 1.67, "pontos": 186.8995}, {"codigo": "501080006", "desc": "VOL 2/2 CRISTALEIRA ORION", "cor": "CINAMOMO", "uep": 1.27, "pontos": 103.6235}, {"codigo": "501080007", "desc": "VOL 1/2 CRISTALEIRA ORION", "cor": "OFF WHITE/CINAMOMO", "uep": 1.67, "pontos": 188.5302}, {"codigo": "501080008", "desc": "VOL 2/2 CRISTALEIRA ORION", "cor": "OFF WHITE/CINAMOMO", "uep": 1.27, "pontos": 103.4042}, {"codigo": "501089001", "desc": "VOL 1/1 SAPATEIRA SPAZIO", "cor": "BRANCO", "uep": 2, "pontos": 135.7426}, {"codigo": "501089002", "desc": "VOL 1/1 SAPATEIRA SPAZIO", "cor": "CINAMOMO", "uep": 2, "pontos": 135.8105}, {"codigo": "501089003", "desc": "VOL 1/1 SAPATEIRA SPAZIO", "cor": "CINAMOMO/OFF WHITE", "uep": 2, "pontos": 135.9603}, {"codigo": "501089004", "desc": "VOL 1/1 SAPATEIRA SPAZIO", "cor": "PRETO ACETINADO", "uep": 2, "pontos": 137}, {"codigo": "501128001", "desc": "VOL 1/1 MESA CENTRO SLIM", "cor": "BRANCO", "uep": 0.89, "pontos": 39.8656}, {"codigo": "501128002", "desc": "VOL 1/1 MESA CENTRO SLIM", "cor": "OFF WHITE", "uep": 0.89, "pontos": 39.759}, {"codigo": "501128003", "desc": "VOL 1/1 MESA CENTRO SLIM", "cor": "PRETO ACETINADO", "uep": 0.89, "pontos": 39.6977}, {"codigo": "501128004", "desc": "VOL 1/1 MESA CENTRO SLIM", "cor": "CINAMOMO", "uep": 0.89, "pontos": 39.5602}, {"codigo": "501130001", "desc": "VOL 1/1 MESA CENTRO LUNA 670", "cor": "OFF WHITE", "uep": 1.15, "pontos": 61.5033}, {"codigo": "501130002", "desc": "VOL 1/1 MESA CENTRO LUNA 670", "cor": "BRANCO ACETINADO", "uep": 1.15, "pontos": 62.706}, {"codigo": "501130003", "desc": "VOL 1/1 MESA CENTRO LUNA 670", "cor": "CUMARU", "uep": 1.15, "pontos": 61.2042}, {"codigo": "501130004", "desc": "VOL 1/1 MESA CENTRO LUNA 670", "cor": "ALECRIM", "uep": 1.15, "pontos": 61.3877}, {"codigo": "501130005", "desc": "VOL 1/1 MESA CENTRO LUNA 590", "cor": "OFF WHITE", "uep": 1, "pontos": 52.2492}, {"codigo": "501130006", "desc": "VOL 1/1 MESA CENTRO LUNA 590", "cor": "BRANCO ACETINADO", "uep": 1, "pontos": 53.2891}, {"codigo": "501130007", "desc": "VOL 1/1 MESA CENTRO LUNA 590", "cor": "CUMARU", "uep": 1, "pontos": 52.0039}, {"codigo": "501130008", "desc": "VOL 1/1 MESA CENTRO LUNA 590", "cor": "ALECRIM", "uep": 1, "pontos": 52.1617}, {"codigo": "501130009", "desc": "VOL 1/1 MESA APOIO LUNA 530", "cor": "OFF WHITE", "uep": 2.8, "pontos": 57.3426}, {"codigo": "501130010", "desc": "VOL 1/1 MESA APOIO LUNA 530", "cor": "BRANCO ACETINADO", "uep": 2.8, "pontos": 58.2397}, {"codigo": "501130011", "desc": "VOL 1/1 MESA APOIO LUNA 530", "cor": "CUMARU", "uep": 2.8, "pontos": 57.1408}, {"codigo": "501130012", "desc": "VOL 1/1 MESA APOIO LUNA 530", "cor": "ALECRIM", "uep": 2.8, "pontos": 57.2764}, {"codigo": "501130013", "desc": "VOL 1/1 MESA LATERAL LUNA 440", "cor": "OFF WHITE", "uep": 3.33, "pontos": 47.9001}, {"codigo": "501130014", "desc": "VOL 1/1 MESA LATERAL LUNA 440", "cor": "BRANCO ACETINADO", "uep": 3.33, "pontos": 48.6408}, {"codigo": "501130015", "desc": "VOL 1/1 MESA LATERAL LUNA 440", "cor": "CUMARU", "uep": 3.33, "pontos": 47.7433}, {"codigo": "501130016", "desc": "VOL 1/1 MESA LATERAL LUNA 440", "cor": "ALECRIM", "uep": 3.33, "pontos": 47.8547}, {"codigo": "501140001", "desc": "VOL 1/1 BANQUETA VERSATIL", "cor": "BRANCO", "uep": 1.04, "pontos": 54.302}, {"codigo": "501140002", "desc": "VOL 1/1 BANQUETA VERSATIL", "cor": "OFF WHITE", "uep": 1.04, "pontos": 54.2492}, {"codigo": "501140003", "desc": "VOL 1/1 BANQUETA VERSATIL", "cor": "CINAMOMO", "uep": 1.04, "pontos": 53.6616}, {"codigo": "501149001", "desc": "VOL 1/1 MESA CABECEIRA MADERO", "cor": "BRANCO", "uep": 1, "pontos": 45.5073}, {"codigo": "501149002", "desc": "VOL 1/1 MESA CABECEIRA MADERO", "cor": "CINZA/CINAMOMO", "uep": 1, "pontos": 46.3198}, {"codigo": "501149003", "desc": "VOL 1/1 MESA CABECEIRA MADERO", "cor": "OFF WHITE/CINAMOMO", "uep": 1, "pontos": 45.2805}, {"codigo": "501149004", "desc": "VOL 1/1 MESA CABECEIRA MADERO", "cor": "PRETO ACETINADO/CINAMOMO", "uep": 1, "pontos": 45.8339}];
const COLA42 = "2.200\tMESA CABECEIRA SLEEP\t2.800\t9/11\n\t\t\t\n\t\t\t\n300\tRACK SIRIUS 0.9\t\t\n\t\t\t\n\t\t\t\n\t\t\t\n300\tRACK FLIP 2.2\t\t\n850\tKIT 2 MESA CABECEIRA SLEEP\t1.600\t10/11\n\t\t\t\n\t\t\t\n100\tHOME RIPADO SUPREMO 1.8 \t\t\n\t\t\t\n200\tESCRIVANINHA ART\t\t\n\t\t\t\n450\tPENTEADEIRA PRINCESA\t\t\n200\tBUFFET FLIP 1.2\t800\t11/11\n\t\t\t\n\t\t\t\n200\tRACK MOVE 1.6\t\t\n\t\t\t\n\t\t\t\n\t\t\t\n400\tPENTEADEIRA CAMARIM MEL\t\t\n250\tMESA CENTRO PRISM\t1.150\t12/11\n\t\t\t\n\t\t\t\n600\tBUFFET 3 PT PRISM\t\t\n\t\t\t\n\t\t\t\n\t\t\t\n300\tPENTEADEIRA CAMARIM ELOA\t\t\n1.100\tCONJUNTO 2 MESAS CANTO/LAT SLIM\t1.650\t13/11\n\t\t\t\n\t\t\t\n150\tHOME RIPADO ANTARES 1.4\t\t\n\t\t\t\n\t\t\t\n\t\t\t\n400\tESCRIVANINHA PRISM\t\t";
const PRODS = _capProdutos(CAT42);
ok('números e datas da planilha: milhar com ponto, decimal com vírgula; "9/11" sem o ano cai no próximo 9/11 (até 30 dias atrás é este ano)',
   [_tkaNum('2.200'), _tkaNum('2,5'), _tkaNum('300'), _tkaNum('216/26'), _tkaNum('RACK'), _tkaData('9/11', 20261106), _tkaData('10/10', 20261106), _tkaData('1/1', 20261106), _tkaData('24/11/2026', 20261106), _tkaData('32/11', 20261106)],
   [2200, 2.5, 300, null, null, 20261109, 20261010, 20270101, 20261124, 0]);
const L42 = _tkaLer(COLA42, PRODS, 20261106);
const porDia = {}; L42.itens.forEach(x => { porDia[x.n] = (porDia[x.n] || 0) + x.qtde * x.uepJogo; });
ok('o bloco F:I da semana 042-26: 16 produtos, 8.000 produtos, a data mesclada vale para as linhas de baixo; a UEP de cada dia = a UEP DIA da planilha recalculada (3.326 · 3.223 · 2.444 · 2.736,5 · 2.774)',
   [L42.itens.length, L42.itens.reduce((a, x) => a + x.qtde, 0), L42.semCad.length, L42.semData, Object.keys(porDia).map(n => [Number(n), r1(porDia[n])])],
   [16, 8000, 0, 0, [[20261109, 3326], [20261110, 3223], [20261111, 2444], [20261112, 2736.5], [20261113, 2774]]]);
const M42 = _tkaMontar(L42, {}, 2761, RIT);
ok('a conta do TAKT na colagem: 14.503,5 UEP em 5 dias → NÃO CABE, faltam 2h13 — o MESMO da planilha (NÃO CABE +2h13) e do painel (SEMANA QUE VEM); 09, 10 e 13/11 passam',
   [r1(M42.T.progUep), M42.T.nUteis, M42.V.faltaMin, _fmtHM(M42.V.faltaMin), M42.V.cabe, M42.P.acima.map(d => d.data.slice(0, 5)), M42.semUep.length,
    M42.T.dias.every(d => !d.passado && !d.hoje), r1(M42.T.falta.capRest)],
   [14503.5, 5, 133, _fmtHM(133), false, ['09/11', '10/11', '13/11'], 0, true, 5 * 2761]);
{ const AI = COLA42.split('\n').map((l, i) => (i % 8 === 0 ? '6/11\t9/11\t' + (210 + i / 8) + '/26\tPRETO\t\t' : '\t\t\t\t\t') + l).join('\n');
  const LA = _tkaLer(AI, PRODS, 20261106), MA = _tkaMontar(LA, {}, 2761, RIT);
  const DPQ = '09/11/2026;MESA CABECEIRA SLEEP;2200\n09/11/2026;RACK SIRIUS 0.9;300\n09/11/2026;RACK FLIP 2.2;300';
  const LD = _tkaLer(DPQ, PRODS, 20261106);
  ok('o bloco A:I inteiro dá o mesmo (as datas de corte vêm antes; a PREV EMB é a última data); "data;produto;qtde" também; o lote "210/26" não vira data nem número',
     [LA.itens.length, LA.semCad.length, MA.V.faltaMin, LD.itens.map(x => [x.n, x.qtde]), r1(LD.itens.reduce((a, x) => a + x.qtde * x.uepJogo, 0))],
     [16, 0, 133, [[20261109, 2200], [20261109, 300], [20261109, 300]], 3326]); }
{ // os 9 nomes da planilha que não são iguais aos do cadastro (medido em 06/11/2026), e um ambíguo
  const NOMES = ['CONJUNTO 2 MESAS CANTO/LAT SLIM', 'PENTEADEIRA CAMARIM 1PT 2GAV DIAMANTE', 'CANTINHO DO CAFE AURORA', 'CANTINHO DO CAFE ACONCHEGO', 'RACK BRITO',
                 'COMODA GOLDEN', 'ROUPEIRO GOLDEN 2 PT 2 GAV', 'PENTEADEIRA CAMARIM 1PT 2GAV', 'PUFF EVORA LINHO'];
  const LN = _tkaLer(NOMES.map((n, i) => '10\t' + n + '\t\t' + (i ? '' : '9/11')).join('\n'), PRODS, 20261106);
  ok('os 9 nomes da planilha diferentes do cadastro casam (CONJ/PENT/CANT CAFE e o começo único do nome); nome que casa com dois não é chutado',
     [LN.itens.map(x => x.nome), LN.semCad.length, _tkaAchar({ 'RACK FLIP 1.8':1, 'RACK FLIP 1.6':2 }, 'RACK FLIP'), _tkaAchar({ 'RACK FLIP 1.8':1 }, 'RACK FLI')],
     [['CONJ 2 MESAS CANTO/LAT SLIM', 'PENT CAMARIM 1PT 2GAV DIAMANTE', 'CANT CAFE AURORA', 'CANT CAFE ACONCHEGO', 'RACK BRITO 137 CM', 'COMODA GOLDEN 4 GAV', 'ROUPEIRO GOLDEN', 'PENT CAMARIM 1PT 2GAV DIAMANTE', 'PUFF EVORA'], 0, null, null]); }
{ const X = 'QTDE\tPRODUTO\tTOTAL LOTE\tPREV EMB\n\tMESA CABECEIRA SLEEP\t2.800\t9/11\n500\tPRODUTO NOVO SEM UEP\t\t\n300\tRACK SIRIUS 0.9\t\t\n120\tRACK FLIP 2.2\t\t';
  const LX = _tkaLer(X, PRODS, 20261106);
  ok('cabeçalho ignorado; QTDE vazia não pega o TOTAL da direita; produto fora do cadastro vai para a lista (carga que não entrou); linha antes de qualquer data fica fora',
     [LX.itens.map(x => [x.nome, x.qtde]), LX.semCad, _tkaLer('300\tRACK FLIP 2.2', PRODS, 20261106).semData],
     [[['RACK SIRIUS 0.9', 300], ['RACK FLIP 2.2', 120]], [{ n:20261109, nome:'PRODUTO NOVO SEM UEP', qtde:500 }], 1]); }
{ global.TKA_TXT = 'a<b>\t9/11';
  const H = _tkaHtml(L42, M42, { botoes:'', msg:'16 linhas lidas', largura:1200 });
  const H0 = _tkaHtml(null, null, { botoes:'' });
  ok('o desenho: a caixa de colar (o texto escapado), o veredito em horas com "produtos", o dia a dia; antes de colar, só a caixa',
     [H.includes('<textarea id="tka-txt"'), H.includes('a&lt;b&gt;'), H.includes('<div class="tks-hv">NÃO CABE</div>'), H.includes('faltam <b>2h13</b> de linha'),
      H.includes('caixas'), H.includes('produtos da semana'), H.includes('id="tks-g-box"'), H0.includes('tks-hero'), H0.includes('AVALIAR')],
     [true, true, true, true, false, true, true, false, true]);
  const Hs = _tkaHtml(_tkaLer('500\tPRODUTO NOVO SEM UEP\t\t9/11\n300\tRACK SIRIUS 0.9', PRODS, 20261106), _tkaMontar(_tkaLer('500\tPRODUTO NOVO SEM UEP\t\t9/11\n300\tRACK SIRIUS 0.9', PRODS, 20261106), {}, 2761, RIT), { botoes:'' });
  ok('produto fora do cadastro é dito em destaque: a carga dele NÃO entrou', Hs.includes('com produto que não está no cadastro — a carga delas NÃO entrou</b>: PRODUTO NOVO SEM UEP (500)'), true);
  global.TKA_TXT = ''; }
ok('a ligação: 3ª opção ao lado das semanas; o refresh não redesenha com o PCP na caixa; a conta é a do TAKT; o botão diz "avaliação"',
   [_taktSemBotoes(2).includes('class="on" onclick="_taktSemSet(2)">AVALIAR PROGRAMAÇÃO'), /TKS_SEM===2 && document\.activeElement && document\.activeElement\.id==='tka-txt'\) return;/.test(R),
    /_taktMontar\(/.test(pega('function _tkaMontar(')) && /_taktProxMontar\(T\)/.test(pega('function _tkaMontar(')) && /_taktVeredito\(T, P, rit\)/.test(pega('function _tkaMontar(')),
    _uepSubTakt(null, null, 'avaliação').txt, _uepSubTakt(M42.T, null, 'avaliação').txt, /jsonpFetch|CFG\.|_taktLer/.test(pega('function _tkaLer(') + pega('function _tkaMontar('))],
   [true, true, true, 'cole a programação', 'avaliação: pede ' + fmtP(M42.T.pede), false]);

console.log('\n── v7.214.0: SALDO DE HORAS (de hoje até a colagem, sem duplicar) e a 🖨 ──');
const FX = {"ATUAL": [{"data": "03/11/2026", "dataNum": 20261103, "lote": "25379", "codigo": "501088001", "desc": "VOL 1/2 HOME ANGEL 1.8", "cor": "CINAMOMO/OFF WHITE", "qtde": 95, "uepCx": 2.48, "uep": 235.6, "saldo": 0, "foraEsteira": false}, {"data": "03/11/2026", "dataNum": 20261103, "lote": "25379", "codigo": "501088002", "desc": "VOL 2/2 HOME ANGEL 1.8", "cor": "CINAMOMO/OFF WHITE", "qtde": 95, "uepCx": 2.48, "uep": 235.6, "saldo": 0, "foraEsteira": false}, {"data": "03/11/2026", "dataNum": 20261103, "lote": "25379", "codigo": "501088003", "desc": "VOL 1/2 HOME ANGEL 1.8", "cor": "OFF WHITE/CINAMOMO", "qtde": 105, "uepCx": 2.48, "uep": 260.4, "saldo": 0, "foraEsteira": false}, {"data": "03/11/2026", "dataNum": 20261103, "lote": "25379", "codigo": "501088004", "desc": "VOL 2/2 HOME ANGEL 1.8", "cor": "OFF WHITE/CINAMOMO", "qtde": 105, "uepCx": 2.48, "uep": 260.4, "saldo": 0, "foraEsteira": false}, {"data": "03/11/2026", "dataNum": 20261103, "lote": "25380", "codigo": "501068001", "desc": "VOL 1/2 PAINEL RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "qtde": 150, "uepCx": 3.49, "uep": 523.5, "saldo": 150, "foraEsteira": false}, {"data": "03/11/2026", "dataNum": 20261103, "lote": "25380", "codigo": "501068002", "desc": "VOL 2/2 PAINEL RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "qtde": 150, "uepCx": 3.49, "uep": 523.5, "saldo": 0, "foraEsteira": false}, {"data": "03/11/2026", "dataNum": 20261103, "lote": "25381", "codigo": "501141007", "desc": "VOL 1/1 BUFFET 4 PT PRISM", "cor": "CINAMOMO", "qtde": 135, "uepCx": 2.38, "uep": 321.3, "saldo": 0, "foraEsteira": false}, {"data": "03/11/2026", "dataNum": 20261103, "lote": "25381", "codigo": "501141008", "desc": "VOL 1/1 BUFFET 4 PT PRISM", "cor": "OFF WHITE/CINAMOMO", "qtde": 330, "uepCx": 2.38, "uep": 785.4, "saldo": 0, "foraEsteira": false}, {"data": "03/11/2026", "dataNum": 20261103, "lote": "25381", "codigo": "501141009", "desc": "VOL 1/1 BUFFET 4 PT PRISM", "cor": "BRANCO ACETINADO/CINAMOMO", "qtde": 35, "uepCx": 2.38, "uep": 83.3, "saldo": 0, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25386", "codigo": "501134001", "desc": "VOL 1/1 PENTEADEIRA PRINCESA", "cor": "BRANCO", "qtde": 240, "uepCx": 1.9, "uep": 456, "saldo": 0, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25386", "codigo": "501134002", "desc": "VOL 1/1 PENTEADEIRA PRINCESA", "cor": "ROSA", "qtde": 210, "uepCx": 1.9, "uep": 399, "saldo": 0, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25387", "codigo": "501158002", "desc": "VOL 1/1 PENTEADEIRA CAMARIM EVORA", "cor": "CINAMOMO", "qtde": 75, "uepCx": 2.98, "uep": 223.5, "saldo": 75, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25387", "codigo": "501158001", "desc": "VOL 1/1 PENTEADEIRA CAMARIM EVORA", "cor": "OFF WHITE/CINAMOMO", "qtde": 25, "uepCx": 2.98, "uep": 74.5, "saldo": 0, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25388", "codigo": "501157006", "desc": "VOL 1/1 PAINEL MOON 1.8", "cor": "CINAMOMO/OFF WHITE", "qtde": 40, "uepCx": 2.63, "uep": 105.2, "saldo": 1, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25388", "codigo": "501157005", "desc": "VOL 1/1 PAINEL MOON 1.8", "cor": "CINAMOMO", "qtde": 30, "uepCx": 2.63, "uep": 78.9, "saldo": 0, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25389", "codigo": "501157008", "desc": "VOL 1/1 PAINEL MOON 2.2", "cor": "CINAMOMO", "qtde": 40, "uepCx": 1.82, "uep": 72.8, "saldo": 1, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25389", "codigo": "501157009", "desc": "VOL 1/1 PAINEL MOON 2.2", "cor": "CINAMOMO/OFF WHITE", "qtde": 60, "uepCx": 1.82, "uep": 109.2, "saldo": 4, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25390", "codigo": "501136003", "desc": "VOL 1/1 LIVREIRO ENCANTO", "cor": "CINAMOMO", "qtde": 370, "uepCx": 2.1, "uep": 777, "saldo": 2, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25390", "codigo": "501136006", "desc": "VOL 1/1 LIVREIRO ENCANTO", "cor": "OFF WHITE/CINAMOMO", "qtde": 150, "uepCx": 2.1, "uep": 315, "saldo": 2, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25390", "codigo": "501136001", "desc": "VOL 1/1 LIVREIRO ENCANTO", "cor": "BRANCO", "qtde": 190, "uepCx": 2.1, "uep": 399, "saldo": 0, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25390", "codigo": "501136005", "desc": "VOL 1/1 LIVREIRO ENCANTO", "cor": "BRANCO/CINAMOMO", "qtde": 150, "uepCx": 2.1, "uep": 315, "saldo": 0, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25390", "codigo": "501136004", "desc": "VOL 1/1 LIVREIRO ENCANTO", "cor": "PRETO ACETINADO/CINAMOMO", "qtde": 130, "uepCx": 2.1, "uep": 273, "saldo": 0, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25390", "codigo": "501136002", "desc": "VOL 1/1 LIVREIRO ENCANTO", "cor": "ROSA", "qtde": 110, "uepCx": 2.1, "uep": 231, "saldo": 0, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25416", "codigo": "501134001", "desc": "VOL 1/1 PENTEADEIRA PRINCESA", "cor": "BRANCO", "qtde": 100, "uepCx": 1.9, "uep": 190, "saldo": 12, "foraEsteira": false}, {"data": "04/11/2026", "dataNum": 20261104, "lote": "25416", "codigo": "501134002", "desc": "VOL 1/1 PENTEADEIRA PRINCESA", "cor": "ROSA", "qtde": 150, "uepCx": 1.9, "uep": 285, "saldo": 3, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25391", "codigo": "501060001", "desc": "VOL 1/2 PENTEADEIRA CAMARIM MEL", "cor": "BRANCO", "qtde": 190, "uepCx": 1.73, "uep": 328.7, "saldo": 3, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25391", "codigo": "501060002", "desc": "VOL 2/2 PENTEADEIRA CAMARIM MEL", "cor": "BRANCO", "qtde": 190, "uepCx": 1.71, "uep": 324.9, "saldo": 1, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25391", "codigo": "501060003", "desc": "VOL 1/2 PENTEADEIRA CAMARIM MEL", "cor": "OFF WHITE", "qtde": 110, "uepCx": 1.73, "uep": 190.3, "saldo": 1, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25391", "codigo": "501060004", "desc": "VOL 2/2 PENTEADEIRA CAMARIM MEL", "cor": "OFF WHITE", "qtde": 110, "uepCx": 1.71, "uep": 188.1, "saldo": 23, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25391", "codigo": "501060005", "desc": "VOL 1/2 PENTEADEIRA CAMARIM MEL", "cor": "CINAMOMO/OFF WHITE", "qtde": 50, "uepCx": 1.73, "uep": 86.5, "saldo": 1, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25391", "codigo": "501060006", "desc": "VOL 2/2 PENTEADEIRA CAMARIM MEL", "cor": "CINAMOMO/OFF WHITE", "qtde": 50, "uepCx": 1.71, "uep": 85.5, "saldo": 0, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25392", "codigo": "501141001", "desc": "VOL 1/1 BUFFET 2 PT PRISM", "cor": "CINAMOMO", "qtde": 95, "uepCx": 1.75, "uep": 166.3, "saldo": 95, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25392", "codigo": "501141002", "desc": "VOL 1/1 BUFFET 2 PT PRISM", "cor": "OFF WHITE/CINAMOMO", "qtde": 270, "uepCx": 1.75, "uep": 472.5, "saldo": 270, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25392", "codigo": "501141003", "desc": "VOL 1/1 BUFFET 2 PT PRISM", "cor": "BRANCO ACETINADO/CINAMOMO", "qtde": 35, "uepCx": 1.75, "uep": 61.3, "saldo": 35, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25393", "codigo": "501135001", "desc": "VOL 1/1 PENT CAMARIM 1PT 2GAV DIAMANTE", "cor": "OFF WHITE", "qtde": 110, "uepCx": 1.83, "uep": 201.3, "saldo": 5, "foraEsteira": false}, {"data": "05/11/2026", "dataNum": 20261105, "lote": "25393", "codigo": "501135002", "desc": "VOL 1/1 PENT CAMARIM 1PT 2GAV DIAMANTE", "cor": "BRANCO ACETINADO", "qtde": 340, "uepCx": 1.83, "uep": 622.2, "saldo": 296, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25394", "codigo": "501079001", "desc": "VOL 1/2 BUFFET FLIP 1.6", "cor": "OFF WHITE", "qtde": 10, "uepCx": 2.46, "uep": 24.6, "saldo": 10, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25394", "codigo": "501079002", "desc": "VOL 2/2 BUFFET FLIP 1.6", "cor": "OFF WHITE", "qtde": 10, "uepCx": 1.52, "uep": 15.2, "saldo": 10, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25394", "codigo": "501079003", "desc": "VOL 1/2 BUFFET FLIP 1.6", "cor": "OFF WHITE/CINAMOMO", "qtde": 190, "uepCx": 2.46, "uep": 467.4, "saldo": 190, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25394", "codigo": "501079004", "desc": "VOL 2/2 BUFFET FLIP 1.6", "cor": "OFF WHITE/CINAMOMO", "qtde": 190, "uepCx": 1.52, "uep": 288.8, "saldo": 190, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25395", "codigo": "501093001", "desc": "VOL 1/1 CANT CAFE AURORA", "cor": "CINAMOMO/OFF WHITE", "qtde": 95, "uepCx": 2.04, "uep": 193.8, "saldo": 95, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25395", "codigo": "501093002", "desc": "VOL 1/1 CANT CAFE AURORA", "cor": "OFF WHITE/CINAMOMO", "qtde": 190, "uepCx": 2.04, "uep": 387.6, "saldo": 190, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25395", "codigo": "501093003", "desc": "VOL 1/1 CANT CAFE AURORA", "cor": "BRANCO ACETINADO/CINAMOMO", "qtde": 15, "uepCx": 2.04, "uep": 30.6, "saldo": 15, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25396", "codigo": "501070001", "desc": "VOL 1/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "qtde": 20, "uepCx": 2.72, "uep": 54.4, "saldo": 20, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25396", "codigo": "501070002", "desc": "VOL 2/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "qtde": 20, "uepCx": 2.72, "uep": 54.4, "saldo": 20, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25396", "codigo": "501070003", "desc": "VOL 3/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "qtde": 20, "uepCx": 2.31, "uep": 46.2, "saldo": 20, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25396", "codigo": "501070004", "desc": "VOL 1/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO/OFF WHITE", "qtde": 130, "uepCx": 2.72, "uep": 353.6, "saldo": 130, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25396", "codigo": "501070005", "desc": "VOL 2/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO/OFF WHITE", "qtde": 130, "uepCx": 2.72, "uep": 353.6, "saldo": 130, "foraEsteira": false}, {"data": "06/11/2026", "dataNum": 20261106, "lote": "25396", "codigo": "501070006", "desc": "VOL 3/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO/OFF WHITE", "qtde": 130, "uepCx": 2.31, "uep": 300.3, "saldo": 130, "foraEsteira": false}], "F1629": [{"data": "16/11/2026", "dataNum": 20261116, "lote": "25441", "codigo": "501089001", "desc": "VOL 1/1 SAPATEIRA SPAZIO", "cor": "BRANCO", "qtde": 130, "uepCx": 2, "uep": 260, "saldo": 130, "foraEsteira": false}, {"data": "16/11/2026", "dataNum": 20261116, "lote": "25441", "codigo": "501089002", "desc": "VOL 1/1 SAPATEIRA SPAZIO", "cor": "CINAMOMO", "qtde": 290, "uepCx": 2, "uep": 580, "saldo": 290, "foraEsteira": false}, {"data": "16/11/2026", "dataNum": 20261116, "lote": "25441", "codigo": "501089003", "desc": "VOL 1/1 SAPATEIRA SPAZIO", "cor": "CINAMOMO/OFF WHITE", "qtde": 430, "uepCx": 2, "uep": 860, "saldo": 430, "foraEsteira": false}, {"data": "16/11/2026", "dataNum": 20261116, "lote": "25442", "codigo": "501128001", "desc": "VOL 1/1 MESA CENTRO SLIM", "cor": "BRANCO", "qtde": 20, "uepCx": 0.89, "uep": 17.8, "saldo": 20, "foraEsteira": false}, {"data": "16/11/2026", "dataNum": 20261116, "lote": "25442", "codigo": "501128002", "desc": "VOL 1/1 MESA CENTRO SLIM", "cor": "OFF WHITE", "qtde": 140, "uepCx": 0.89, "uep": 124.6, "saldo": 140, "foraEsteira": false}, {"data": "16/11/2026", "dataNum": 20261116, "lote": "25442", "codigo": "501128003", "desc": "VOL 1/1 MESA CENTRO SLIM", "cor": "PRETO ACETINADO", "qtde": 20, "uepCx": 0.89, "uep": 17.8, "saldo": 20, "foraEsteira": false}, {"data": "16/11/2026", "dataNum": 20261116, "lote": "25442", "codigo": "501128004", "desc": "VOL 1/1 MESA CENTRO SLIM", "cor": "CINAMOMO", "qtde": 70, "uepCx": 0.89, "uep": 62.3, "saldo": 70, "foraEsteira": false}, {"data": "16/11/2026", "dataNum": 20261116, "lote": "25443", "codigo": "501140001", "desc": "VOL 1/1 BANQUETA VERSATIL", "cor": "BRANCO", "qtde": 380, "uepCx": 1.04, "uep": 395.2, "saldo": 380, "foraEsteira": false}, {"data": "16/11/2026", "dataNum": 20261116, "lote": "25443", "codigo": "501140002", "desc": "VOL 1/1 BANQUETA VERSATIL", "cor": "OFF WHITE", "qtde": 400, "uepCx": 1.04, "uep": 416, "saldo": 400, "foraEsteira": false}, {"data": "16/11/2026", "dataNum": 20261116, "lote": "25443", "codigo": "501140003", "desc": "VOL 1/1 BANQUETA VERSATIL", "cor": "CINAMOMO", "qtde": 120, "uepCx": 1.04, "uep": 124.8, "saldo": 120, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25446", "codigo": "501134001", "desc": "VOL 1/1 PENTEADEIRA PRINCESA", "cor": "BRANCO", "qtde": 50, "uepCx": 1.9, "uep": 95, "saldo": 50, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25446", "codigo": "501134002", "desc": "VOL 1/1 PENTEADEIRA PRINCESA", "cor": "ROSA", "qtde": 450, "uepCx": 1.9, "uep": 855, "saldo": 450, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25447", "codigo": "501070001", "desc": "VOL 1/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "qtde": 60, "uepCx": 2.72, "uep": 163.2, "saldo": 60, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25447", "codigo": "501070002", "desc": "VOL 2/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "qtde": 60, "uepCx": 2.72, "uep": 163.2, "saldo": 60, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25447", "codigo": "501070003", "desc": "VOL 3/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO", "qtde": 60, "uepCx": 2.31, "uep": 138.6, "saldo": 60, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25447", "codigo": "501070004", "desc": "VOL 1/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO/OFF WHITE", "qtde": 90, "uepCx": 2.72, "uep": 244.8, "saldo": 90, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25447", "codigo": "501070005", "desc": "VOL 2/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO/OFF WHITE", "qtde": 90, "uepCx": 2.72, "uep": 244.8, "saldo": 90, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25447", "codigo": "501070006", "desc": "VOL 3/3 HOME RIPADO SUPREMO 2.3", "cor": "CINAMOMO/OFF WHITE", "qtde": 90, "uepCx": 2.31, "uep": 207.9, "saldo": 90, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25448", "codigo": "501080001", "desc": "VOL 1/2 CRISTALEIRA ORION", "cor": "OFF WHITE", "qtde": 80, "uepCx": 1.67, "uep": 133.6, "saldo": 80, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25448", "codigo": "501080002", "desc": "VOL 2/2 CRISTALEIRA ORION", "cor": "OFF WHITE", "qtde": 80, "uepCx": 1.27, "uep": 101.6, "saldo": 80, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25448", "codigo": "501080005", "desc": "VOL 1/2 CRISTALEIRA ORION", "cor": "CINAMOMO", "qtde": 20, "uepCx": 1.67, "uep": 33.4, "saldo": 20, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25448", "codigo": "501080006", "desc": "VOL 2/2 CRISTALEIRA ORION", "cor": "CINAMOMO", "qtde": 20, "uepCx": 1.27, "uep": 25.4, "saldo": 20, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25448", "codigo": "501080007", "desc": "VOL 1/2 CRISTALEIRA ORION", "cor": "OFF WHITE/CINAMOMO", "qtde": 100, "uepCx": 1.67, "uep": 167, "saldo": 100, "foraEsteira": false}, {"data": "17/11/2026", "dataNum": 20261117, "lote": "25448", "codigo": "501080008", "desc": "VOL 2/2 CRISTALEIRA ORION", "cor": "OFF WHITE/CINAMOMO", "qtde": 100, "uepCx": 1.27, "uep": 127, "saldo": 100, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25453", "codigo": "501061001", "desc": "VOL 1/2 PENTEADEIRA CAMARIM ELOA", "cor": "BRANCO", "qtde": 140, "uepCx": 1.85, "uep": 259, "saldo": 140, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25453", "codigo": "501061002", "desc": "VOL 2/2 PENTEADEIRA CAMARIM ELOA", "cor": "BRANCO", "qtde": 140, "uepCx": 2.2, "uep": 308, "saldo": 140, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25453", "codigo": "501061003", "desc": "VOL 1/2 PENTEADEIRA CAMARIM ELOA", "cor": "OFF WHITE", "qtde": 100, "uepCx": 1.85, "uep": 185, "saldo": 100, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25453", "codigo": "501061004", "desc": "VOL 2/2 PENTEADEIRA CAMARIM ELOA", "cor": "OFF WHITE", "qtde": 100, "uepCx": 2.2, "uep": 220, "saldo": 100, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25453", "codigo": "501061005", "desc": "VOL 1/2 PENTEADEIRA CAMARIM ELOA", "cor": "CINAMOMO/OFF WHITE", "qtde": 60, "uepCx": 1.85, "uep": 111, "saldo": 60, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25453", "codigo": "501061006", "desc": "VOL 2/2 PENTEADEIRA CAMARIM ELOA", "cor": "CINAMOMO/OFF WHITE", "qtde": 60, "uepCx": 2.2, "uep": 132, "saldo": 60, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25454", "codigo": "501130001", "desc": "VOL 1/1 MESA CENTRO LUNA 670", "cor": "OFF WHITE", "qtde": 100, "uepCx": 1.15, "uep": 115, "saldo": 100, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25454", "codigo": "501130003", "desc": "VOL 1/1 MESA CENTRO LUNA 670", "cor": "CUMARU", "qtde": 100, "uepCx": 1.15, "uep": 115, "saldo": 100, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25455", "codigo": "501130005", "desc": "VOL 1/1 MESA CENTRO LUNA 590", "cor": "OFF WHITE", "qtde": 100, "uepCx": 1, "uep": 100, "saldo": 100, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25456", "codigo": "501130009", "desc": "VOL 1/1 MESA APOIO LUNA 530", "cor": "OFF WHITE", "qtde": 100, "uepCx": 2.8, "uep": 280, "saldo": 100, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25456", "codigo": "501130011", "desc": "VOL 1/1 MESA APOIO LUNA 530", "cor": "CUMARU", "qtde": 20, "uepCx": 2.8, "uep": 56, "saldo": 20, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25457", "codigo": "501130013", "desc": "VOL 1/1 MESA LATERAL LUNA 440", "cor": "OFF WHITE", "qtde": 100, "uepCx": 3.33, "uep": 333, "saldo": 100, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25457", "codigo": "501130015", "desc": "VOL 1/1 MESA LATERAL LUNA 440", "cor": "CUMARU", "qtde": 40, "uepCx": 3.33, "uep": 133.2, "saldo": 40, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25457", "codigo": "501130016", "desc": "VOL 1/1 MESA LATERAL LUNA 440", "cor": "ALECRIM", "qtde": 10, "uepCx": 3.33, "uep": 33.3, "saldo": 10, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25458", "codigo": "501090001", "desc": "VOL 1/1 CANT CAFE ACONCHEGO", "cor": "BRANCO", "qtde": 40, "uepCx": 2.07, "uep": 82.8, "saldo": 40, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25458", "codigo": "501090004", "desc": "VOL 1/1 CANT CAFE ACONCHEGO", "cor": "GRAFITE/CINAMOMO", "qtde": 20, "uepCx": 2.07, "uep": 41.4, "saldo": 20, "foraEsteira": false}, {"data": "18/11/2026", "dataNum": 20261118, "lote": "25458", "codigo": "501090005", "desc": "VOL 1/1 CANT CAFE ACONCHEGO", "cor": "CINAMOMO/OFF WHITE", "qtde": 290, "uepCx": 2.07, "uep": 600.3, "saldo": 290, "foraEsteira": false}], "C43AI": "6/11\t10/11\t211/26\tVERDE\t025441\t850\tSAPATEIRA SPAZIO\t2.000\t16/11\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t025442\t250\tMESA CENTRO SLIM\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t025443\t900\tBANQUETA VERSATIL\t\t\n9/11\t11/11\t212/26\tBRANCO\t025446\t500\tPENTEADEIRA PRINCESA\t850\t17/11\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t025447\t150\tHOME RIPADO SUPREMO 2.3\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t025448\t200\tCRISTALEIRA ORION\t\t\n10/11\t12/11\t213/26\tVERMELHO\t025453\t300\tPENTEADEIRA CAMARIM ELOA\t1.220\t18/11\n\t\t\t\t\t\t\t\t\n\t\t\t\t025454\t200\tMESA CENTRO LUNA 670\t\t\n\t\t\t\t025455\t100\tMESA CENTRO LUNA 590\t\t\n\t\t\t\t025456\t120\tMESA APOIO LUNA 530\t\t\n\t\t\t\t025457\t150\tMESA LATERAL LUNA 440\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t025458\t350\tCANTINHO DO CAFE ACONCHEGO\t\t\n11/11\t13/11\t214/26\tAMARELO\t\t1.300\tMESA CABECEIRA SLEEP\t1.700\t19/11\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t400\tPENTEADEIRA CAMARIM MEL\t\t\n12/11\t16/11\t215/26\tAZUL\t\t300\tKIT 2 MESA CABECEIRA SLEEP\t1.300\t23/11\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t500\tPENTEADEIRA CAMARIM 1PT 2GAV DIAMANTE\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t500\tPENTEADEIRA PRINCESA\t\t", "C43FI": "850\tSAPATEIRA SPAZIO\t2.000\t16/11\n\t\t\t\n\t\t\t\n250\tMESA CENTRO SLIM\t\t\n\t\t\t\n\t\t\t\n\t\t\t\n900\tBANQUETA VERSATIL\t\t\n500\tPENTEADEIRA PRINCESA\t850\t17/11\n\t\t\t\n\t\t\t\n\t\t\t\n150\tHOME RIPADO SUPREMO 2.3\t\t\n\t\t\t\n\t\t\t\n200\tCRISTALEIRA ORION\t\t\n300\tPENTEADEIRA CAMARIM ELOA\t1.220\t18/11\n\t\t\t\n200\tMESA CENTRO LUNA 670\t\t\n100\tMESA CENTRO LUNA 590\t\t\n120\tMESA APOIO LUNA 530\t\t\n150\tMESA LATERAL LUNA 440\t\t\n\t\t\t\n350\tCANTINHO DO CAFE ACONCHEGO\t\t\n1.300\tMESA CABECEIRA SLEEP\t1.700\t19/11\n\t\t\t\n\t\t\t\n\t\t\t\n\t\t\t\n\t\t\t\n\t\t\t\n400\tPENTEADEIRA CAMARIM MEL\t\t\n300\tKIT 2 MESA CABECEIRA SLEEP\t1.300\t23/11\n\t\t\t\n\t\t\t\n500\tPENTEADEIRA CAMARIM 1PT 2GAV DIAMANTE\t\t\n\t\t\t\n\t\t\t\n\t\t\t\n500\tPENTEADEIRA PRINCESA\t\t", "C44AI": "13/11\t17/11\t216/26\tPRETO\t\t\tBUFFET 4 PT PRISM\t0\t24/11\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\tnão mexer\t\tRACK FLIP 1.8\t\t\n16/11\t18/11\t217/26\tVERDE\t\t1.100\tMESA CABECEIRA MADERO\t1.100\t25/11\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\tESCRIVANINHA TAURUS\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\tPENTEADEIRA PRINCESA\t\t\n17/11\t19/11\t218/26\tBRANCO\t\t\tPENTEADEIRA CAMARIM MEL \t0\t26/11\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n18/11\t23/11\t219/26\tVERMELHO\t\t\tBUFFET FLIP 1.8\t0\t27/11\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\tPENTEADEIRA CAMARIM ELOA\t\t\n19/11\t24/11\t220/26\tAMARELO\t\t\tPENTEADEIRA PRINCESA\t0\t30/11\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t"};
// a programação do painel em 06/11/2026 ~14:40: esta semana (o saldo de cada lote), a que vem (SP) e 16–29/11
const PAI = FX.ATUAL.concat(SP.linhas, FX.F1629);
const OC = { hojeN:20261106, restMin:140, meta:2761, rit:RIT, fer:{ 20261102:'FINADOS', 20261120:'CONSCIÊNCIA NEGRA' } };
const L43 = _tkaLer(FX.C43AI, PRODS, 20261106), C43 = _tkaCorrente(PAI, L43.itens, OC);
ok('a 043 colada inteira (A:I, com o Nº LOTE SIST.): os 12 lotes de 16–18/11 já estão no painel e NÃO somam de novo; os 5 de 19 e 23/11 (sem número, ainda não lançados) entram',
   [L43.itens.length, C43.dup.length, C43.novos.length, C43.novos.map(x => x.n).filter((v, i, a) => a.indexOf(v) === i), C43.dup.every(x => x.lote)],
   [17, 12, 5, [20261119, 20261123], true]);
const KH = 527 / 2761, sem = C43.semanas;
ok('por semana: esta (o saldo dos lotes × o resto de hoje), a que vem (46h08 × 43h55, o mesmo do TAKT), 16–22/11 (20/11 feriado: 4 dias) e 23/11; o painel nos dias que ele tem, a colagem só no que é novo',
   [sem.map(s => [s.de, s.ate]), sem.map(s => s.pai ? (s.col ? 'pc' : 'p') : 'c'), _fmtHM(sem[1].precisa), _fmtHM(sem[1].tem), sem[2].tem, sem[2].precisa, sem[3].precisa, sem[3].tem],
   [[[20261106, 20261106], [20261109, 20261113], [20261116, 20261119], [20261123, 20261123]], ['p', 'p', 'pc', 'c'], _fmtHM(2768), _fmtHM(2635), 4 * 527,
    Math.round((2858.5 + 2700.5 + 3105 + 1300 * 0.83 + 400 * 3.44) * KH), Math.round((300 * 1.42 + 500 * 1.83 + 500 * 1.9) * KH), 527]);
{ const w0 = FX.ATUAL.filter(l => !l.foraEsteira && l.saldo > 0 && l.uepCx > 0).reduce((a, l) => a + l.saldo * l.uepCx, 0) * KH;
  ok('o atraso passa de uma semana para a outra: chega em 16/11 com o desta semana + o da que vem; a folha da conta fecha com a soma (nenhum dia zerou o atraso)',
     [Math.abs(C43.chegada - (w0 - 140 + (2768 - 2635))) <= 1, Math.abs(C43.atraso - (w0 - 140 + (2768 - 2635) + (sem[2].precisa - sem[2].tem) + (sem[3].precisa - sem[3].tem))) <= 2, sem[0].atraso === Math.round(w0 - 140)],
     [true, true, true]); }   // ± 1–2 min: o dia a dia arredonda no fim, a soma das semanas arredonda cada semana
{ const CF = _tkaCorrente(PAI, _tkaLer(FX.C43FI, PRODS, 20261106).itens, OC);
  ok('a mesma 043 colada em F:I (sem o número do lote): não duplica pelo mesmo produto no mesmo dia — o mesmo saldo',
     [CF.dup.length, CF.dup.some(x => x.lote), CF.atraso, CF.chegada], [12, false, C43.atraso, C43.chegada]); }
{ const C44 = _tkaCorrente(PAI, _tkaLer(FX.C44AI, PRODS, 20261106).itens, OC);
  ok('a 044 colada sozinha: 19 e 23/11 (não lançados) e 24/11 (lote sem quantidade) não estão no painel nem na colagem — ficam fora (capacidade e demanda) e são ditos; 20/11 é feriado (não é lacuna)',
     [C44.lacunas, C44.dias.find(d => d.n === 20261119).cap, C44.dias.find(d => d.n === 20261120).feriado, C44.ini, C44.fim],
     [[20261119, 20261123, 20261124], 0, 'CONSCIÊNCIA NEGRA', 20261125, 20261125]); }   // 24/11: o lote 216/26 ainda sem quantidade
{ // a folga não se guarda: segunda folgada (1.000 UEP) e terça carregada (4.000) — a folga de segunda não abate a terça
  const Cg = _tkaCorrente([], [{ n:20261109, nome:'X', qtde:1000, uepJogo:1 }, { n:20261110, nome:'X', qtde:4000, uepJogo:1 }], { hojeN:20261106, restMin:0, meta:2761, rit:null, fer:{} });
  { const HR = _tkaSaldoHtml(C43);
  ok('o rótulo da semana mostra só os dias que contam (PPCP: "06 e 08/11 está considerando fim de semana"): hoje é o que resta, o feriado é dito, sábado e domingo ficam fora',
     [HR.includes('<tr><td>06/11 (hoje: o que resta)</td>'), HR.includes('<tr><td>09/11–13/11</td>'), HR.includes('<tr><td>16/11–19/11 <span class="mono">(20/11 feriado)</span></td>'), /08\/11|15\/11|22\/11/.test(HR),
      C43.dias.filter(d => d.dow === 0 || d.dow === 6).every(d => d.cap === 0)],
     [true, true, true, false, true]); }
ok('a folga de um dia não vira crédito: só absorve atraso que já existe (segunda folgada não abate a terça carregada)',
     [Cg.dias.find(d => d.n === 20261109).atraso, Math.round(Cg.dias.find(d => d.n === 20261110).atraso), Cg.atrasoR], [0, Math.round(4000 * 527 / 2761 - 527), null]); }
ok('as faixas que faltam ler: da 3ª segunda-feira até o último dia colado, de 14 em 14 dias (o máximo da leitura)',
   [_tkaFaixas(20261106, 20261123), _tkaFaixas(20261106, 20261130), _tkaFaixas(20261106, 20261113)],
   [[{ de:'16/11/2026', ate:'29/11/2026' }], [{ de:'16/11/2026', ate:'29/11/2026' }, { de:'30/11/2026', ate:'13/12/2026' }], []]);
{ const HS = _tkaSaldoHtml(C43), M43 = _tkaMontar(L43, OC.fer, 2761, RIT), DOC = _tkaDocHtml({ L:L43, M:M43, C:C43 }, { data:'06/11/2026', hora:'14:40' });
  ok('o desenho do saldo: a frase (chega com, termina com, no ritmo atual), a tabela por semana, o que não somou (já no painel); a 🖨: a colagem e o saldo lado a lado, a frase uma vez só',
     [HS.includes('A linha chega em <b>16/11</b> com <b>' + _fmtHM(C43.chegada) + '</b> de atraso'), (HS.match(/<tr><td>/g) || []).length, HS.includes('12 linhas coladas já estão na programação do painel (pelo Nº LOTE SIST.)'),
      DOC.includes('A programação colada (<b>16/11 a 23/11</b>) <b>cabe</b>'), DOC.includes('A linha chega nela com <b>' + _fmtHM(C43.chegada) + '</b> de atraso'),
      (DOC.match(/A linha chega/g) || []).length, DOC.includes('>SALDO DE HORAS<small>'), DOC.includes('<div class="tks-hv">CABE</div>')],
     [true, 4, true, true, true, 1, true, true]);
  const H44 = _tkaSaldoHtml(_tkaCorrente(PAI, _tkaLer(FX.C44AI, PRODS, 20261106).itens, OC));
  ok('lacuna dita na linha da semana e na nota', [H44.includes('sem programação no painel nem na colagem: 19/11'), H44.includes('<b>3 dias úteis sem programação</b> (19/11, 23/11, 24/11)')], [true, true]); }
{ const G1 = pega('async function gerarRelatorioAvaliacao('), PC = pega('function _tkaPainelCarregar(');
  ok('a ligação: a leitura do painel na fila (espera as outras), as faixas pela mesma _taktLer; a 🖨 no menu, com a MESMA corrente da tela',
     [/await new Promise\(ok=>_uepDepoisDe\(_uepLendo, ok\)\)/.test(PC), /_taktLer\('&de='\+encodeURIComponent\(f\.de\)/.test(PC), /onclick="_uepImpFecha\(\);gerarRelatorioAvaliacao\(\)"/.test(html),
      /_tkaCorrente\(PN\.lin, TKA\.itens/.test(G1) && /_tkaCorrente\(PN\.lin, TKA\.itens/.test(R), /PROG_DETALHADA/.test(pega('function _tkaPainel('))],
     [true, true, true, true, true]); }
ok('a faixa das sub-abas preenche a largura (auto-fit; o auto-fill deixava colunas vazias a 1.920 px) e a letra é um pouco maior',
   [/#sec-uep \.ucv-sub\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(200px,1fr\)\)\}/.test(html), /auto-fill,minmax\(180px/.test(html),
    /#sec-uep \.ucv-sb span\{font-size:14\.5px\}/.test(html)], [true, false, true]);

console.log(falhas ? '\n❌ ' + falhas + ' falha(s)' : '\n✅ takt da semana ok — três números em s por UEP, o porquê dia a dia, o agora em caixas');
process.exit(falhas ? 1 : 0);
