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
 'function _taktProxSemana(', 'function _taktSemBotoes(', 'function _taktEstadoHtml(', 'function _fmtHM(', 'function _taktSimHtml(', 'function _taktCenRot(', 'function _taktCenarios(', 'function _taktSimular(', 'function _taktDocHtml(', 'function _taktVeredito(', 'function _taktHeroHtml(', 'function _taktDetHtml('].forEach(f => eval.call(global, pega(f)));
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
    'cabem ~1.504 até 17:00 · faltam 3.593', 'id="tks-g-box"', '1 dia de linha (' + _fmtHM(527) + ' = 2.761 UEP)'].filter(t => !HT.includes(t)), []);
ok('v7.211.0: na frente, o VEREDITO em horas de linha e o porquê numa linha; os cards em s por UEP, a cascata e o agora ficam nos DETALHES PARA O PCP (recolhidos)',
   [HT.indexOf('<div class="tks-hero red"><div class="tks-hv">NÃO FECHA</div>') > 0, HT.includes('faltam <b>' + _fmtHM(686) + '</b> de linha'),
    HT.includes('<b>Por quê:</b> a programação pediu <b>116,2%</b> do que a linha faz (a referência) e a linha rodou a <b>90,6%</b> dela. Do que não saiu nos dias fechados, <b>73% foi excesso de programação</b> e <b>27% ritmo da linha</b>.'),
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
    _uepSubTakt(T1, null, 'semana que vem'), /taktRot:TKS_SEM===1 \? 'semana que vem' : ''/.test(R), /T:TKS_SEM===1 \? T1 : T/.test(R)],
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
      h1.includes('somando o que não fechar desta semana (' + _fmtHM(686) + ', se nada mudar): faltam <b>' + _fmtHM(133 + 686) + '</b>'),
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
     [G0.indexOf("window.open(") < G0.indexOf('await '), /_taktMontar\(TKS, UEP_HIST, _taktHoje\(D, hojeN\)\)/.test(G0), /_taktProxMontar\(T1\)/.test(G0),
      /_taktVeredito\(T0, null, rit\)/.test(G0) && /_taktVeredito\(T1, P1, rit\)/.test(G0),
      /onclick="_uepImpFecha\(\);gerarRelatorioTakt\(\)"/.test(html), /T=_taktMontar\(TKS, UEP_HIST, _taktHoje\(D, hojeN\)\)/.test(R)],
     [true, true, true, true, true, true]); }
ok('a faixa das sub-abas preenche a largura (auto-fit; o auto-fill deixava colunas vazias a 1.920 px) e a letra é um pouco maior',
   [/#sec-uep \.ucv-sub\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(200px,1fr\)\)\}/.test(html), /auto-fill,minmax\(180px/.test(html),
    /#sec-uep \.ucv-sb span\{font-size:14\.5px\}/.test(html)], [true, false, true]);

console.log(falhas ? '\n❌ ' + falhas + ' falha(s)' : '\n✅ takt da semana ok — três números em s por UEP, o porquê dia a dia, o agora em caixas');
process.exit(falhas ? 1 : 0);
