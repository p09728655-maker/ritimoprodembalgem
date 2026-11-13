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
global.TKS_TPC = false;
global.SETUP_PEND = null; global.SETUP_PLAN = null;   // v7.226.0: o setup enviado e a chave na planilha
global._rpEsc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
['function _cartNum(', 'function _eixoGrade(', 'function _taktMontar(', 'function _taktRestMin(', 'function _taktAgora(',
 'function _uepSubTakt(', 'function _taktPorCaixa(', 'function _taktPorCaixaHtml(', 'function _taktHtml(', 'function _taktSvg(', 'function _taktProxMontar(', 'function _taktProxHtml(',
 'function _taktProxSemana(', 'function _taktSemBotoes(', 'function _taktEstadoHtml(', 'function _fmtHM(', 'function _taktSimHtml(', 'function _taktCenRot(', 'function _taktCenarios(', 'function _taktSimular(', 'function _taktDocHtml(', 'function _taktVeredito(', 'function _taktPrecisaPartes(', 'function _taktHeroHtml(', 'function _taktDetHtml(', 'function _taktPtsMapa(', 'function _taktEstMapa(', 'function _tkPts(',
 // v7.222.0: o nível diretoria
 'function _tkAprox(', 'function _tkDia(', 'function _tkHAprox(', 'function _taktPico(', 'function _taktFecharDados(', 'function _taktFecharHtml(',
 'function _taktHerancaHtml(', 'function _taktExcessoHtml(',
 // v7.224.0: a faixa do takt (os volumes para o app de cronoanálise)
 'function _taktSetup(', 'function _setupLer(', 'function _setupCfgTxt(', 'function _setupErro(', 'function _setupEnviar(', 'function _setupDaConfig(', 'function _setupResposta(', 'function _taktApp(', 'function _taktFaixa(', 'function _taktFaixaHtml('].forEach(f => eval.call(global, pega(f)));
['EIXO_PASSOS', '_tkS', 'TKS_DOW', 'CRONO_APP_GRUPO', '_taktFProd', '_tkDec', '_tkM', 'TKS_DOC_SVG_W', 'UEP_REF_STATUS', 'TKS_RITMO_DESVIO', 'SETUP_TROCAS_MAX', 'SETUP_MIN_MAX', 'EF_EMB_PADRAO'].forEach(c => eval.call(global, pegaConst(c).replace(/^const /, 'global.').replace(/^global\.(\w+)\s*=/, 'global.$1 =')));

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
// v7.225.0 (PPCP: "não bate takt" → "ideal é painel ficar também com setup igual"): os segundos são
// com a linha rodando — a jornada menos o setup do grupo do app (8 × 8 min = 64 min por dia)
ok('o setup do painel é o do app: 8 × 8 = 64 min por dia → 463 min de linha rodando por dia',
   [_taktSetup(), T.setup, T.setupDia, T.minProd], [{ setupsDia:8, setupMin:8, origem:'padrao' }, { setupsDia:8, setupMin:8, origem:'padrao' }, 64, 463]);
ok('TAKT = 4 × (527 − 64) × 60 ÷ 12.831,2 = 8,66 s por UEP (3.207,8 UEP/dia, 116,2% da referência — o setup sai dos dois lados, o % não muda)',
   [Math.round(T.takt * 100) / 100, r1(T.porDia), r1(T.pede)], [8.66, 3207.8, 116.2]);
ok('REFERÊNCIA = (527 − 64) × 60 ÷ 2.761 = 10,06 s por UEP',
   Math.round(T.ref * 100) / 100, 10.06);
ok('EXECUTADO = (3 × 527 + 240) min, menos o setup na mesma proporção (× 463/527), × 60 ÷ 8.647,2 UEP = 11,10 s por UEP, 90,6% da referência; hora extra à parte (586,7 + 523,5)',
   [r1(T.exec.uep), T.exec.min, Math.round(T.exec.s * 100) / 100, r1(T.exec.pct), T.exec.nFech, T.exec.minHoje, r1(T.exec.he), T.exec.fora],
   [8647.2, 1821, 11.1, 90.6, 3, 240, 1110.2, 0]);
{ // a mesma semana refeita com o setup ZERO (o cadastro do app sem setup): os segundos voltam aos da v7.224.0
  // (9,86 · 11,45 · 12,64) e o %, o executado em % e o veredito em horas são os MESMOS — o setup se cancela
  const rit = T.exec.uep / T.exec.min * 527, V = _taktVeredito(T, null, rit);
  CRONO_APP_GRUPO.setupMin = 0;
  const Tz = _taktMontar(S, HIST, HOJE), Vz = _taktVeredito(Tz, null, rit);
  CRONO_APP_GRUPO.setupMin = 8;
  ok('com o setup zero: 9,86 · 11,45 · 12,64 s por UEP (os da v7.224.0); o % (116,2), o executado (90,6%) e o veredito em horas iguais aos de com o setup',
     [Math.round(Tz.takt * 100) / 100, Math.round(Tz.ref * 100) / 100, Math.round(Tz.exec.s * 100) / 100, Tz.setupDia, r1(Tz.pede), r1(Tz.exec.pct), JSON.stringify(Vz) === JSON.stringify(V)],
     [9.86, 11.45, 12.64, 0, r1(T.pede), r1(T.exec.pct), true]); }

// v7.217.0 (PPCP: "sim, mostra takt por caixa"): por produto · volume programado, takt × UEP por caixa
{ const L2 = (d, codigo, desc, cor, qtde, uepCx, fora) => ({ data:d + '/2026', dataNum:_cartNum(d + '/2026'), codigo, desc, cor, qtde, uepCx, uep:uepCx ? qtde * uepCx : null, saldo:qtde, foraEsteira:!!fora });
  const S2 = { ok:true, de:'09/11/2026', ate:'15/11/2026', hoje:'06/11/2026', feriados:[], linhas:[
    L2('09/11', '501094001', 'VOL 1/1 MESA CABECEIRA SLEEP', 'BRANCO', 200, 0.83), L2('09/11', '501094002', 'VOL 1/1 MESA CABECEIRA SLEEP', 'PRETO', 300, 0.83),
    L2('10/11', '501060001', 'VOL 1/2 PENTEADEIRA CAMARIM MEL', 'BRANCO', 100, 1.73), L2('10/11', '501060003', 'VOL 1/2 PENTEADEIRA CAMARIM MEL', 'OFF WHITE', 100, 1.75),
    L2('10/11', '501060002', 'VOL 2/2 PENTEADEIRA CAMARIM MEL', 'BRANCO', 200, 1.71),
    L2('09/11', '501135001', 'VOL 1/1 PENT CAMARIM 1PT 2GAV DIAMANTE', 'OFF WHITE', 50, 2.48), L2('12/11', '501135001', 'VOL 1/1 PENT CAMARIM 1PT 2GAV DIAMANTE', 'OFF WHITE', 450, 2.48),
    L2('11/11', '501999001', 'VOL 1/1 PRODUTO NOVO', 'BRANCO', 80, null),
    L2('11/11', '501777001', 'VOL 1/1 FORA DA ESTEIRA', 'BRANCO', 999, 1, true), L2('16/11', '501094001', 'VOL 1/1 MESA CABECEIRA SLEEP', 'BRANCO', 777, 0.83)] };
  // v7.235.0: a esteira de cada código (medida + 400 mm a 9 m/min, PRODUTO_CODIGO real): o TEMPO-ALVO = esteira ÷ 85%.
  // O PRODUTO NOVO sem medida: sem tempo-alvo (nunca a UEP no lugar)
  const EST = _taktEstMapa([{ codigo:'501094001', medida:825, velocidade:9, entrePeca:400 }, { codigo:'501094002', medida:825, velocidade:9, entrePeca:400 },
    { codigo:'501060001', medida:1285, velocidade:9, entrePeca:400 }, { codigo:'501060003', medida:1285, velocidade:9, entrePeca:400 },
    { codigo:'501060002', medida:1255, velocidade:9, entrePeca:400 }, { codigo:'501135001', medida:1590, velocidade:9, entrePeca:400 },
    { codigo:'501999001', medida:0, velocidade:9, entrePeca:400 }]);
  const estS = mm => (mm + 400) / 150;
  const T2 = _taktMontar(S2, [], { num:20261106, meta:2761, ef:85 }, null, EST), R2 = _taktPorCaixa(T2), por = n => R2.find(g => g.rot.includes(n));
  ok('takt por caixa: um por produto · volume (as cores juntas; fora da esteira e fora da semana de fora), na ordem do 1º dia, das caixas e do nome',
     R2.map(g => [g.rot, g.cx, g.dias.map(n => n % 100)]),
     [['501094 · MESA CABECEIRA SLEEP', 500, [9]], ['501135 · PENT CAMARIM 1PT 2GAV DIAMANTE', 500, [9, 12]], ['501060 · PENTEADEIRA CAMARIM MEL · VOL 1/2', 200, [10]],
      ['501060 · PENTEADEIRA CAMARIM MEL · VOL 2/2', 200, [10]], ['501999 · PRODUTO NOVO', 80, [11]]]);   // empate de caixas: pelo nome
  const dm = por('DIAMANTE'), mel = por('VOL 1/2');
  ok('PELO TAKT = takt da semana × UEP por caixa (cx/h de RELÓGIO: 3.600 × 463/527 ÷ pelo takt); TEMPO-ALVO (v7.235.0) = a esteira do código ÷ 85% — DIAMANTE (1590 + 400) mm a 9 m/min = 13,27 s → 15,61 s',
     [Math.round(dm.sTakt * 100) / 100, Math.round(dm.cxhTakt), T2.ef, Math.round(dm.estCx * 100) / 100, Math.round(dm.sRef * 100) / 100],
     [Math.round(T2.takt * 2.48 * 100) / 100, Math.round(3600 * 463 / 527 / (T2.takt * 2.48)), 85, Math.round(estS(1590) * 100) / 100, Math.round(estS(1590) / 0.85 * 100) / 100]);
  ok('a esteira por produto é pesada pelas caixas como a UEP (MEL 1/2: as duas cores com a mesma caixa); um código sem medida derruba o alvo do produto (nunca pela metade)',
     [Math.round(mel.estCx * 100) / 100, por('PRODUTO NOVO').estCx, por('PRODUTO NOVO').sRef,
      (() => { const Tm = _taktMontar(S2, [], { num:20261106, meta:2761 }, null, Object.assign({}, EST, { '501060003':undefined })); return _taktPorCaixa(Tm).find(g => g.rot.includes('VOL 1/2')).sRef; })(),
      _taktMontar(S2, [], { num:20261106, meta:2761 }).ef, _taktMontar(S2, [], { num:20261106, meta:2761, ef:80 }).ef],
     [Math.round(estS(1285) * 100) / 100, null, null, null, 85, 80]);
  ok('a UEP por caixa é a média das cores pesada pelas caixas (MEL 1/2: 1,73 e 1,75 → 1,74, diz que difere por cor); sem UEP → sem takt, nunca 0',
     [mel.uepCx, mel.difCor, por('PRODUTO NOVO').uepCx, por('PRODUTO NOVO').sTakt, por('PRODUTO NOVO').cxSemUep, por('SLEEP').difCor], [1.74, true, null, null, 80, false]);
  const HC = _taktPorCaixaHtml(R2, T2);
  ok('o desenho: título com o takt da semana, uma linha por produto, PELO TAKT em s e cx/h, as cores que diferem, o sem UEP; a nota (uma linha, v7.232.0) manda comparar o NO PERÍODO da cronoanálise com o TEMPO-ALVO',
     [HC.includes('<b>TAKT POR CAIXA</b>'), (HC.match(/<tr><td>/g) || []).length, HC.includes('<b>' + _tkS(dm.sTakt) + ' s</b><small>' + fmtN(Math.round(dm.cxhTakt)) + ' cx/h</small>'),
      HC.includes('1,74<small>1,73–1,75 por cor</small>'), HC.includes('—<small>sem UEP</small>'), HC.includes('09/11, 12/11'), HC.includes('compare o NO PERÍODO da cronoanálise com ele')],
     [true, 5, true, true, true, true, true]);
  // v7.230.0 (PPCP: "troca por TEMPO ALVO"): a coluna era NA MÉDIA DA LINHA; é o mesmo número que julga cada
  // volume no app de cronoanálise (getTemposAlvo), e a nota manda comparar o NO PERÍODO com ele
  // v7.235.0 (PPCP, 12/11/2026: "tempo alvo está equivocado" → "tamanho da caixa, velocidade da esteira" → "85 ok"):
  // o título e a nota dizem a conta nova e que o PELO TAKT é na média do dia — não se compara um com o outro
  ok('TEMPO-ALVO: a coluna (nunca mais NA MÉDIA DA LINHA), o título com a conta da esteira ÷ 85%, a nota que manda comparar o NO PERÍODO com ele e NÃO com o PELO TAKT',
     [HC.includes('>TEMPO-ALVO</th>'), HC.includes('NA MÉDIA DA LINHA'),
      HC.includes('TEMPO-ALVO = a esteira do produto ÷ 85%: o tempo de cada caixa com o produto rodando — compare o NO PERÍODO da cronoanálise com ele, não com o PELO TAKT'),
      HC.includes('O tempo-alvo do produto: a esteira dele — (medida da caixa + entre-peças) ÷ velocidade, da PRODUTO_CODIGO — ÷ 85% (a eficiência da embalagem do ⚙)'),
      HC.includes('s por UEP da média da linha')],
     [true, false, true, true, false]);
  // v7.231.0 (PPCP, com a SLEEP na tela: 8,5 s pelo takt e 8,9 s no tempo-alvo): o cx/h embaixo do TEMPO-ALVO
  // também, na mesma régua do PELO TAKT (hora de relógio, o setup na média) — os dois se comparam na mesma unidade
  // v7.235.0: o cx/h do TEMPO-ALVO é com o produto rodando (3.600 ÷ o alvo), não de relógio — o alvo já não tem o setup na conta
  ok('TEMPO-ALVO com o cx/h embaixo: 3.600 ÷ o tempo-alvo (com o produto rodando); sem medida da caixa, sem alvo e sem cx/h — e diz por quê',
     [Math.round(dm.cxhRef), HC.includes(_tkS(dm.sRef) + ' s<small>' + fmtN(Math.round(dm.cxhRef)) + ' cx/h</small></td>'), por('PRODUTO NOVO').cxhRef,
      HC.includes('—<small>sem medida da caixa</small>')],
     [Math.round(3600 / (estS(1590) / 0.85)), true, null, true]);
  // v7.224.0 (PPCP: "não consigo localizar com facilidade"): a tabela saiu dos DETALHES e abre no TAKT POR PRODUTO,
  // logo abaixo da faixa do topo — nas três telas (a AVALIAR, por volume, pelo _tkaVolumes)
  // v7.232.0 (PPCP: "tire redundância"): a faixa desce para depois do gráfico (NA LINHA E NO APP), fora dos detalhes
  ok('no TAKT POR PRODUTO da faixa NA LINHA E NO APP, depois do gráfico, nas três telas (não nos detalhes); o desenho não faz conta',
     [/id="tks-g-box"[\s\S]*\+_taktFaixaHtml\(_taktFaixa\(T, \{ G \}\), _taktPorCaixa\(T\), T\)/.test(pega('function _taktHtml(')) && !/_taktDetHtml\([^\n]*_taktPorCaixaHtml/.test(pega('function _taktHtml(')),
      /_taktExcessoHtml\(T, P, o\.largura\)\s*\+_taktFaixaHtml\(_taktFaixa\(T\), _taktPorCaixa\(T\), T\)/.test(pega('function _taktProxHtml(')) && !/_taktDetHtml\([^\n]*_taktPorCaixaHtml/.test(pega('function _taktProxHtml(')),
      /\.uepSoma|\*|\/ *g\./.test(pega('function _taktPorCaixaHtml(').replace(/\/\*[\s\S]*?\*\//g, '').replace(/3600|_tkS\([^)]*\)/g, '')), _taktPorCaixa(null), _taktPorCaixaHtml([], T2)],
     [true, true, false, [], '']); }

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
// v7.235.0: a esteira do código de agora (MEL 1/2: (1285 + 400) mm a 9 m/min = 11,23 s) — o tempo-alvo = ÷ 85%
const AG = { cod:'501060001', desc:'VOL 1/2 PENTEADEIRA CAMARIM MEL', cor:'BRANCO', uepCx:1.73, estCx:(1285 + 400) / 150, horas:HORAS, slots:SLOTS, phm:PHM };
const G = _taktAgora(T, AG);
ok('MEL VOL 1/2 BRANCO (1,73): 1 caixa a cada 15,0 s pelo takt; tempo-alvo 13,2 s = a esteira 11,2 s ÷ 85% (v7.235.0; era 17,4 s pela referência × UEP)',
   [r1(G.sTakt), r1(G.estCx), r1(G.sRef)], [15, 11.2, 13.2]);
// v7.225.0 (revisão): a última hora na MESMA régua do takt e da referência — os minutos dela × 463/527, como o
// EXECUTADO. Antes da correção ela saía em relógio (24,8 s) ao lado do takt e da referência sem o setup.
ok('a última hora fechada (10:00) teve duas cores: o ritmo dela sem o setup (14,3 × 463/527 = 12,6 s por UEP) em caixas da MEL — 21,8 s, a cor do HORA A HORA',
   [G.hora.inicio, G.hora.so, r1(G.hora.sUep), r1(G.hora.sCx), G.hora.cls, G.hora.cx], ['10:00', false, 12.6, 21.8, 'red', 145]);
{ const Gm = _taktAgora(T, Object.assign({}, AG, { horas:[{ inicio:'09:00', uep:2761 * 60 / 527, cls:'ok' }] }));
  ok('uma hora EXATAMENTE na meta (314,4 UEP em 60 min) dá a referência: 10,06 s por UEP e 17,4 s por caixa da MEL (referência × UEP) — a mesma régua',
     [Math.round(Gm.hora.sUep * 100) / 100, Math.round(T.ref * 100) / 100, r1(Gm.hora.sCx), r1(T.ref * 1.73)], [10.06, 10.06, 17.4, 17.4]); }
{ const G2 = _taktAgora(T, Object.assign({}, AG, { horas:HORAS.slice(0, 1).concat([{ inicio:'10:00', andamento:true, uep:120 }]), cor:'OFF WHITE' }));
  ok('a hora em andamento não conta; hora só do produto (a MEL OFF WHITE das 09:00): as caixas dela, 60 × 463/527 × 60 ÷ 145 = 21,8 s',
     [G2.hora.inicio, G2.hora.so, r1(G2.hora.sCx), G2.hora.cx], ['09:00', true, 21.8, 145]); }
ok('sem produto apontado → null; sem UEP no cadastro → sem takt por caixa (o tempo-alvo, que é da esteira, fica); sem medida → sem tempo-alvo; nenhuma hora fechada → hora null',
   [_taktAgora(T, Object.assign({}, AG, { cod:'' })), (g => [g.sTakt, r1(g.sRef), g.hora && g.hora.sCx])(_taktAgora(T, Object.assign({}, AG, { uepCx:null }))),
    _taktAgora(T, Object.assign({}, AG, { estCx:null })).sRef, _taktAgora(T, Object.assign({}, AG, { horas:[] })).hora],
   [null, [null, 13.2, null], null, null]);

console.log('\n── o botão da sub-aba ──');
ok('o botão: quanto a programação pede da referência (âmbar acima de 100%); sem a leitura diz o estado, nunca 0',
   [_uepSubTakt(T), _uepSubTakt(Object.assign({}, T, { pede:95 })).cls, _uepSubTakt(null).txt, _uepSubTakt(null, 'falha').txt, _uepSubTakt(null, 'sem-endpoint').txt,
    _uepSubTakt(null, 'sem-url').txt, _uepSubTakt({ takt:null, nUteis:4 }).txt, _uepSubTakt({ takt:null, nUteis:0 }).txt],
   [{ txt:'pede ' + fmtP(T.pede) + ' da referência', cls:'warn' }, '', '…', 'programação não lida', 'falta o .gs v5.59', 'sem Google Sheets', 'nenhuma UEP programada', 'nenhum dia útil']);

console.log('\n── o desenho ──');
const HT = _taktHtml(T, G, { largura:1200, V:_taktVeredito(T, null, T.exec.uep / T.exec.min * 527) });
// v7.232.0 (PPCP: "tire redundância, deixar enxuta, direta sem rodeios"): o veredito, o PARA FECHAR numa
// linha, o dia a dia e a faixa NA LINHA E NO APP. Saíram os cartões em s por UEP, a frase, a cascata e o agora
// dos DETALHES: repetiam o veredito (a falta, o ritmo), o gráfico (o porquê) e a faixa (o agora).
ok('v7.232.0: a tela enxuta — o agora em s por caixa (o que a semana pede, o tempo-alvo, a última hora) e os volumes do app na faixa; o dia a dia com a linha de 1 dia',
   ['<b>NA LINHA E NO APP</b>', '<div class="kpi-lbl">AGORA · VOL 1/2 PENTEADEIRA CAMARIM MEL BRANCO</div>',
    'a semana pede <b class="tks-nl-n">15,0 s</b> por caixa <i>≈ 211 cx/h</i>', 'tempo-alvo <b class="tks-nl-n">13,2 s</b> <i>≈ 272 cx/h</i>',
    'última hora (10:00): <b class="tks-c-red">21,8 s por caixa</b> — a hora não foi só dele · 1,73 UEP por caixa',
    '<b class="tks-nl-n">5.970</b> volumes · takt no app <b class="tks-nl-n">18,7 s</b> por volume', 'id="tks-g-box"',
    '1 dia de linha (' + _fmtHM(527) + ' = média de 2.761 UEP entregues sem hora extra)'].filter(t => !HT.includes(t)), []);
ok('v7.232.0: o que repetia saiu — os cartões em s por UEP, a frase, a cascata, o bloco AGORA e os DETALHES; s por UEP só no title do recado',
   ['TAKT · O QUE A PROGRAMAÇÃO PEDE', 'EXECUTADO NA SEMANA', 'FALTA DA SEMANA', 'POR QUE NÃO ACOMPANHOU', 'tks-casc', 'class="tks-ler', 'tks-agora',
    '<details class="tks-det"', '<small>s por UEP</small>', 'class="tks-fx', '<b>PARA FECHAR</b>'].filter(t => HT.includes(t)),
   []);
ok('a ordem do olhar: título → veredito → para fechar → dia a dia (com o porquê no recado) → NA LINHA E NO APP → TAKT POR PRODUTO',
   [['<b>TAKT DA SEMANA</b>', '<div class="tks-hero red"><div class="tks-hv">NÃO FECHA<small>', 'class="tks-por tks-fl"', '<b>DIA A DIA</b>', 'id="tks-g-box"', '<b>NA LINHA E NO APP</b>', 'class="tks-tpc"']
      .map(x => HT.indexOf(x)).every((v, i, a) => v >= 0 && (!i || v > a[i - 1])),
    HT.includes('<div class="tks-hl">FALTAM</div><div class="tks-hn">' + _fmtHM(686) + '<small> de linha</small></div>'),
    HT.includes('<span class="tks-sec-r" title="A programação pediu 116,2% da média que a linha entrega sem hora extra (8,7 contra 10,1 s por UEP, sem o setup), e a linha rodou a 90,6% dessa média. Do que não saiu nos dias fechados, 73% foi excesso de programação e 27% ritmo da linha.">do que não saiu: <b>73% excesso de programação</b> · <b>27% ritmo da linha</b></span>')],
   [true, true, true]);
ok('v7.232.0: o PARA FECHAR numa linha logo depois do veredito, sem repetir as caixas dele (eram dois cartões com os mesmos números)',
   [HT.includes('<div class="tks-por tks-fl"><b>Para fechar:</b> hora extra de ≈ 11h30 da linha inteira, ou o que não couber passa para a semana que vem.</div>'),
    (h => h.slice(h.indexOf('tks-fl'), h.indexOf('</div>', h.indexOf('tks-fl'))))(HT).includes('caixas'),
    / · \d[\d.]* caixas programadas/.test(HT), /programação [\d.]+ cx = [\d.]+ UEP/.test(HT)],
   [true, false, false, false]);
ok('na segunda de manhã (nenhum dia fechado): o recado diz o quanto a programação pede, sem "do que não saiu" de zeros',
   (h => [h.includes('do que não saiu'), h.includes('a programação pede <b>116,2%</b> da média'), h.includes('tks-casc')])(_taktHtml(_taktMontar(S, [], Object.assign({}, HOJE, { num:20261103 })), null, {})),
   [false, true, false]);
const SV = _taktSvg(T, 1200);
ok('o gráfico em HORAS DE LINHA: 02/11 FINADOS sem barras, quatro dias com o programado e o feito (03/11: 10h16 pedidas, 8h33 feitas), hoje 4h50 até agora; a linha de 1 dia (8h47); sem a linha do takt; números com halo por cima',
   [SV.includes('>FINADOS<'), (SV.match(/stroke-dasharray/g) || []).length, (SV.match(/fill="var\(--tks-feito\)"/g) || []).length,
    ['>10h16<', '>8h33<', '>' + _fmtHM(Math.round((996.9 + 523.5) * 527 / 2761)) + '<tspan', ' até agora</tspan>', '>8h<'].filter(x => !SV.includes(x)),
    SV.includes('stroke-dasharray="12 6"'), SV.includes('<title>1 dia de linha: ' + _fmtHM(527)), SV.lastIndexOf('stroke-width="2"><title>1 dia') < SV.indexOf('paint-order="stroke"'),
    /06\/11 sex \(hoje\)/.test(SV)],
   [true, 0, 4, [], false, true, true, true]);
// v7.223.0 (PPCP: "essa semana e avaliar programação ficou fora do padrão"): o programado do
// dia é o desenho da SEMANA QUE VEM — cheio até 1 dia de linha, o excesso em vermelho com o
// "+h" em cima, o total dentro — ao lado do feito. Era contorno tracejado com o número miúdo.
ok('v7.223.0: o programado no padrão da semana que vem — quatro barras cheias, o excesso de 03/11 e 04/11 em vermelho com o +h, o feito ao lado; no papel a letra desce',
   [(SV.match(/fill="var\(--tks-base\)"><title>/g) || []).length, (SV.match(/fill="var\(--red\)"><title>/g) || []).length,
    SV.includes('>+' + _fmtHM(Math.round(T.dias.find(d => d.data.startsWith('03/11')).uep * 527 / T.meta) - 527) + '<'),
    SV.includes('>+' + _fmtHM(Math.round(T.dias.find(d => d.data.startsWith('04/11')).uep * 527 / T.meta) - 527) + '<'),
    /font-size="21" font-weight="700" fill="var\(--red\)"/.test(SV), /font-size="16" font-weight="700" fill="var\(--txt\)"/.test(SV),
    /font-size="15" font-weight="700" fill="var\(--red\)"/.test(_taktSvg(T, 480, { h:165 })), /fill="var\(--tks-base-t\)"/.test(_taktSvg(T, 480, { h:165 }))],
   [4, 2, true, true, true, true, true, false]);
ok('o desenho não faz conta (tudo vem da montagem) e a conta não lê a tela nem a planilha',
   [/_taktMontar\(|_taktAgora\(|uepDiaMeta\(|\.linhas/.test(pega('function _taktHtml(') + pega('function _taktSvg(')),
    /document\.|PONTOS_DIA|UEP_HIST|CFG\.|jsonpFetch/.test(pega('function _taktMontar(') + pega('function _taktAgora(') + pega('function _taktRestMin('))],
   [false, false]);

console.log('\n── a ligação com a aba ──');
const R = pega('function renderUep('), CAR = pega('async function _uepAbaCarregar('), LD = pega('function _taktCarregar('), LER = pega('async function _taktLer(');
ok('a 6ª sub-aba: botão, chave, painel no renderUep e o número pintado com os outros',
   [/data-sub="takt"[^>]*onclick="_uepSub\('takt'\)"><b>TAKT DA SEMANA<\/b><span id="uep-sb-takt">/.test(html), /const UEP_SUBS = \[[^\]]*'takt'\];/.test(JS),
    R.includes("+pn('takt', bT)"), /\['hoje', 'periodo', 'prod', 'takt'\]\.forEach/.test(pega('function _uepSubPintar(')), /: T,\s*taktEst:/.test(R)],
   [true, true, true, true, true]);
ok('a leitura: action=getProgramacaoSemana, 3 tentativas em sequência, voo compartilhado, a última da fila da aba e na fila da RÉGUAS',
   [LER.includes("action=getProgramacaoSemana"), /for\(let t=1; t<=3; t\+\+\)/.test(LER), /if\(TKS_VOO\) return TKS_VOO;/.test(LD) && /TKS_VOO=_taktLer\(''\)/.test(LD),
    CAR.indexOf('await _taktCarregar()') > CAR.indexOf('await _uepPadCarregar()'), /TKS_VOO \|\| TKP_VOO \|\| TK4_VOO \|\| _pontosVoo/.test(pega('function _uepLendo('))],
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
ok('09–13/11: 9.050 cx = 14.504,2 UEP em 5 dias úteis → takt 5 × 463 × 60 ÷ 14.504,2 = 9,58 s por UEP, 2.900,8/dia, 105,1% da referência; nada feito ainda',
   [T1.progCx, r1(T1.progUep), T1.nUteis, Math.round(T1.takt * 100) / 100, r1(T1.porDia), r1(T1.pede), T1.exec.s, T1.cas.n],
   [9050, 14504.2, 5, 9.58, 2900.8, 105.1, null, 0]);
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
ok('o desenho da semana que vem (v7.232.0): sem os cartões em s por UEP e a frase (repetiam o veredito e o gráfico); a faixa só com os volumes do app (nada roda nela ainda); sem executado e sem porquê',
   [['onclick="_taktProxCarregar(true)"', '<b>NA LINHA E NO APP</b>', '<b class="tks-nl-n">9.050</b> volumes'].filter(t => !HP.includes(t)),
    ['<small>s por UEP</small>', 'A SEMANA × A JORNADA', 'DIAS ACIMA DA REFERÊNCIA', 'class="tks-ler', 'O PRÓXIMOS DIAS mostra', 'AGORA ·', 'class="tks-nl c2"'].filter(t => HP.includes(t)),
    /EXECUTADO|POR QUE NÃO ACOMPANHOU/.test(HP)],
   [[], [], false]);
{ const SV1 = _taktSvg(T1, 1200, { fut:true });
  ok('o gráfico da semana que vem em horas (v7.222.0): barra sólida até 1 dia de linha, o que passa dele em VERMELHO com o "+h" em cima, a folga escrita no dia abaixo; o total dentro da barra (09/11 10h35); sem tracejado e sem feito',
     [(SV1.match(/fill="var\(--red\)"><title>/g) || []).length, (SV1.match(/fill="var\(--tks-base\)"><title>/g) || []).length, (SV1.match(/stroke-dasharray/g) || []).length,
      SV1.includes('>' + _fmtHM(Math.round(3326 * 527 / 2761)) + '<'), SV1.includes('>+' + _fmtHM(Math.round(3326 * 527 / 2761) - 527) + '<'),
      (SV1.match(/>folga \d+h\d\d</g) || []).length, SV1.includes('var(--tks-feito)')], [3, 5, 0, true, true, 2, false]); }
ok('a escolha da semana e o botão: o painel e o número são da semana escolhida',
   [_taktSemBotoes(0).includes('class="on" onclick="_taktSemSet(0)"'), _taktSemBotoes(1).includes('class="on" onclick="_taktSemSet(1)"'),
    _uepSubTakt(T1, null, 'semana que vem'), /taktRot:TKS_SEM===2 \? 'avaliação' : TKS_SEM===1 \? 'semana que vem' : TKS_SEM===3 \? '4 semanas' : ''/.test(R), /T:TKS_SEM===2 \? TA : TKS_SEM===1 \? T1 : T/.test(R)],
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
  ok('na tela: o quadro da simulação (um por cenário, horas de hora extra e caixas a re-datar), nos DETALHES (a única coisa que ficou neles)',
     [HS.includes('<b>SIMULAÇÃO</b>'), (HS.match(/de hora extra nesse ritmo/g) || []).length, HS.indexOf('<b>SIMULAÇÃO</b>') > HS.indexOf('<details class="tks-det"') && HS.includes('e se a linha rodar em outro ritmo</summary>'),
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
// v7.242.0 (PPCP 13/11/2026, com a tela: o card ATRASO dizia 1h55 e o TAKT "faltam 6h16" — "como falta 6?" → prévia →
// "pode subir"): a barra PRECISA da esta semana em partes — o que já venceu, o de hoje e o dos dias que vêm —, nos
// MESMOS minutos do veredito (a soma é o PRECISA). Conta em _taktPrecisaPartes; o desenho só lê.
{ const PT = _taktPrecisaPartes(T, V0), dH = T.dias.find(d => d.hoje);
  ok('o PRECISA em partes (06/11 11:58): o vencido da semana (2.526,3 UEP) e o de hoje (2.570,5), a soma = o PRECISA; sexta sem lote no fim de semana: sem "dias que vêm"',
     [PT.map(p => p.k), PT.map(p => p.min), PT.reduce((a, p) => a + p.min, 0), r1(T.falta.uepVenc), r1(dH.saldoUep)],
     [['venc', 'hoje'], [482, 491], V0.precisaMin, 2526.3, 2570.5]);
  // o retrato de 13/11/2026 14:39 (conferido na planilha): SUPREMO 1.8 VOL 1/3 e 2/3 (200 cx) + MESA CENTRO PRISM 10 cx vencidos;
  // SLIM 1.100 cx + ANTARES 1.4 300 cx + 14 cx da ESCRIVANINHA PRISM de hoje
  const T13 = { meta:2761, falta:{ uep:604.7 + 2098.5, uepVenc:604.7 }, dias:[{ hoje:true, saldoUep:2098.5 }] };
  const V13 = { precisaMin:Math.round(T13.falta.uep * 527 / 2761) };
  ok('o retrato de 13/11: 8h36 = 1h55 de atraso + 6h41 dos lotes de hoje (o 1h55 é o do card ATRASO)',
     [V13.precisaMin, _taktPrecisaPartes(T13, V13).map(p => _fmtHM(p.min))], [516, ['1h55', '6h41']]);
  const k = 527 / 2761, mk = (uV, uH, uR) => [{ meta:2761, falta:{ uep:uV + uH + uR, uepVenc:uV }, dias:[{ hoje:true, saldoUep:uH }] }, { precisaMin:Math.round((uV + uH + uR) * k) }];
  const [T3, V3] = mk(500, 1000, 1500), P3 = _taktPrecisaPartes(T3, V3);
  // a armadilha do arredondamento: 482,4 + 490,4 = 972,8 → 973; arredondando cada parte (482 + 490) sobrava 1 min, e saía "0h01 dos dias que vêm"
  const [Ta, Va] = mk(482.4 / k, 490.4 / k, 0), Pa = _taktPrecisaPartes(Ta, Va);
  ok('três partes no meio da semana (atraso, hoje, dias que vêm) fecham no PRECISA; o arredondamento é do acumulado — nunca um "0h01" que não existe',
     [P3.map(p => p.k), P3.reduce((a, p) => a + p.min, 0) === V3.precisaMin, Pa.map(p => p.k), Pa.map(p => p.min), Va.precisaMin],
     [['venc', 'hoje', 'vem'], true, ['venc', 'hoje'], [482, 491], 973]);
  ok('uma parte só (sem atraso; ou só o vencido), meia UEP de vencido, sem PRECISA ou sem T: nada a separar (null)',
     [_taktPrecisaPartes(...mk(0, 1000, 500)) && _taktPrecisaPartes(...mk(0, 1000, 500)).map(p => p.k), _taktPrecisaPartes(...mk(0, 1000, 0)), _taktPrecisaPartes(...mk(800, 0, 0)),
      _taktPrecisaPartes(...mk(0.3, 1000, 0)), _taktPrecisaPartes(T3, { precisaMin:0 }), _taktPrecisaPartes(null, V3), _taktPrecisaPartes(T3, null)],
     [['hoje', 'vem'], null, null, null, null, null, null]);
  // sorteio: a soma sempre fecha no PRECISA, toda parte > 0, nunca parte de menos de meia UEP, no máximo três, na ordem
  let ruim = 0;
  for(let i = 0; i < 4000; i++){
    const r = () => Math.random() < 0.25 ? 0 : Math.random() < 0.1 ? Math.random() * 0.6 : Math.random() * 4000;
    const uV = r(), uH = r(), uR = r(), [Tx, Vx] = mk(uV, uH, uR), P = _taktPrecisaPartes(Tx, Vx);
    // null só quando não há duas partes de verdade: com duas de 1 min ou mais, tinha de separar
    if(!P){ if([uV, uH, uR].filter(u => u * k >= 1).length > 1) ruim++; continue; }
    const soma = P.reduce((a, p) => a + p.min, 0), ord = P.map(p => ['venc', 'hoje', 'vem'].indexOf(p.k));
    if(soma !== Vx.precisaMin || P.some(p => !(p.min > 0)) || P.length > 3 || ord.some((o, j) => j && o <= ord[j - 1])
       || (uV < 0.5 && P.some(p => p.k === 'venc')) || (uH < 0.5 && P.some(p => p.k === 'hoje')) || (uR < 0.5 && P.some(p => p.k === 'vem'))) ruim++;
  }
  ok('sorteio de 4.000 casos: a soma fecha no PRECISA, toda parte > 0, na ordem, nunca parte de menos de meia UEP', ruim, 0);
  const hP = _taktHeroHtml(V0, { semana:'esta', ate:'17:00', partes:PT }), hS = _taktHeroHtml(V0, { semana:'esta', ate:'17:00' });
  const Vok = Object.assign({}, V0, { cabe:true, faltaMin:-30 }), hOk = _taktHeroHtml(Vok, { semana:'esta', ate:'17:00', partes:PT });
  ok('o desenho: a barra PRECISA em segmentos (p1 até 49,5%, p2 o resto) e, logo embaixo, a legenda "8h02 de atraso (lotes vencidos) + 8h11 dos lotes de hoje"; sem partes, a barra de antes; cabendo, sem o vermelho',
     [hP.includes('<span class="tks-tr"><i class="p1" style="left:0.0%;width:49.5%"></i><i class="p2" style="left:49.5%;width:50.5%"></i></span><b>16h13</b>'),
      hP.includes('<div class="tks-bpt pr"><span class="p1"><b>8h02</b> de atraso (lotes vencidos)</span><em>+</em><span class="p2"><b>8h11</b> dos lotes de hoje</span></div><div class="tks-br"><span>TEM</span>'),
      hS.includes('tks-bpt'), hS.includes('<span class="tks-tr"><i style="width:100.0%"></i></span><b>16h13</b>'), hOk.includes('<div class="tks-bpt">'),
      _taktHeroHtml(V0, { semana:'esta', partes:[{ k:'venc', min:400 }, { k:'hoje', min:400 }, { k:'vem', min:173 }] }).includes('<em>+</em><span class="p3"><b>2h53</b> dos dias que vêm</span>')],
     [true, true, false, true, true, true]);
  ok('a tela e o 🖨 passam as partes na ESTA SEMANA (e só nela); o desenho não faz a conta',
     [/_taktHeroHtml\(o\.V, \{ semana:'esta', ate:F\.ate, partes:_taktPrecisaPartes\(T, o\.V\) \}\)/.test(pega('function _taktHtml(')),
      /_taktHeroHtml\(V0, \{ semana:'esta', ate:T\.falta\.ate, partes:_taktPrecisaPartes\(T, V0\) \}\)/.test(pega('function _taktDocHtml(')),
      /semana:'prox'[^)]*partes/.test(html), /_taktPrecisaPartes\(|uepVenc|saldoUep|UEP_MIN_DIA\/|\.meta/.test(pega('function _taktHeroHtml(')),
      HT.includes('class="tks-bpt pr"')],
     [true, true, false, false, true]);
  ok('a pele: os segmentos de opacidade (tela e papel) e a legenda alinhada embaixo da barra',
     [/#sec-uep \.tks-tr i\.p2\{opacity:\.55\} #sec-uep \.tks-tr i\.p3\{opacity:\.3\}/.test(html), /#sec-uep \.tks-bpt\{display:flex;[^}]*margin:-1px 62px 7px 74px/.test(html),
      /\.tks-doc \.tks-tr i\.p2\{opacity:\.55\} \.tks-doc \.tks-tr i\.p3\{opacity:\.3\}/.test(html), /\.tks-doc \.tks-bpt\{display:flex;/.test(html)],
     [true, true, true, true]); }
{ const h1 = _taktHeroHtml(V1, { semana:'prox', nUteis:5 }), h0 = _taktHeroHtml(V0, { semana:'esta', ate:'17:00' });
  // v7.222.0 (PPCP: "nível diretoria, bater o olho e entender"): UM número e a tradução dele, arredondada
  ok('o veredito: a palavra com o que ela quer dizer, UM número (o que falta), a tradução em dias, caixas (arredondadas) e as barras PRECISA × TEM com a falta marcada',
     [h1.includes('<div class="tks-hv">NÃO CABE<small>a programação passa da jornada da semana</small></div>'), h1.includes('<div class="tks-hl">FALTAM</div><div class="tks-hn">2h13<small> de linha</small></div>'),
      h1.includes('<span><b>≈ 0,3 dia</b> de produção</span>'), h1.includes('<span><b>≈ 440</b> caixas</span>'),
      h1.includes('<b>46h08</b>') && h1.includes('<b>43h55</b>'), h1.includes('<div class="tks-bcap">5 dias de ' + _fmtHM(527) + ' de jornada</div>'), /<em style="left:[\d.]+%;width:[\d.]+%"><\/em>/.test(h1),
      h0.includes('<div class="tks-hv">NÃO FECHA<small>o que falta da semana passa da jornada que resta</small>'), h0.includes('<div class="tks-hn">' + _fmtHM(686) + '<small> de linha</small></div>'),
      h0.includes('<span><b>≈ 1,3 dia</b> de produção</span><span><b>≈ 1.700</b> caixas</span>'), h0.includes('jornada que resta até 17:00'),
      (h1.match(/class="tks-br/g) || []).length, h1.includes('tks-br pr')],
     [true, true, true, true, true, true, true, true, true, true, true, 2, true]);
  ok('um "faltam" só no quadro: o somado com esta semana e o "para fechar" saíram do veredito (blocos próprios); o ritmo a 90,6% muda a conta e aparece, só em horas',
     [h1.includes('não fechar'), /para fechar/i.test(h1), h1.includes('no ritmo atual da linha (90,6% da média): faltam <b>' + _fmtHM(SIM[1].min) + '</b></div>'),
      (h1.match(/faltam/g) || []).length], [false, false, true, 1]);
  const Vq = Object.assign({}, V1, { ritmo:Object.assign({}, V1.ritmo, { pct:98.9 }) });
  ok('o ritmo a 98,9% da média (o print de 11/11) não muda a conta: some do veredito; a AVALIAÇÃO pede sempre (ritmo:true — o saldo de horas soma com ele)',
     [_taktHeroHtml(Vq, { semana:'prox', nUteis:5 }).includes('no ritmo atual'), _taktHeroHtml(Vq, { semana:'prox', nUteis:5, ritmo:true }).includes('no ritmo atual'),
      _taktHeroHtml(Object.assign({}, V1, { ritmo:Object.assign({}, V1.ritmo, { pct:95 }) }), { semana:'prox', nUteis:5 }).includes('no ritmo atual'), TKS_RITMO_DESVIO],
     [false, true, true, 5]); }
console.log('\n── v7.222.0: PARA FECHAR, o que vem desta semana e onde está o excesso ──');
{ const pc = _taktPico(P1, K), top = P1.acima.reduce((a, d) => d.exc > a.exc ? d : a);
  ok('o dia mais carregado: o que mais passa de 1 dia de linha (em minutos) e a parte dele no excesso da semana (em UEP)',
     [pc.data, pc.min, pc.pct, pc.n, _taktPico(Object.assign({}, P1, { acima:[] }), K)],
     [top.data, Math.round(top.uep * K) - 527, Math.round(top.exc / P1.exc * 100), P1.acima.length, null]);
  const F1 = _taktFecharDados(V1, { semana:'prox', P:P1, k:K, ultimo:'13/11' });
  ok('PARA FECHAR da semana que vem: hora extra = o que falta (2h13), adiar = as caixas (≈ 436), remanejar = a folga dos dias abaixo (341 UEP = 1h05)',
     [F1.he, Math.round(F1.cx), F1.remanejar, _fmtHM(F1.remanejar), F1.pico.data, F1.ultimo],
     [133, Math.round(V1.faltaCx), Math.round(341 * 527 / 2761), '1h05', pc.data, '13/11']);
  ok('cabe, sem carga ou semana encerrada → nada a decidir', [_taktFecharDados(Object.assign({}, V1, { cabe:true, faltaMin:-10 }), { semana:'prox' }),
     _taktFecharDados(Object.assign({}, V0, { encerrada:true }), { semana:'esta' }), _taktFecharDados(Object.assign({}, V1, { uep:0 }), { semana:'prox' }), _taktFecharHtml(null)],
     [null, null, null, '']);
  const HF = _taktFecharHtml(F1), PF = _taktFecharHtml(F1, { papel:true });
  // v7.232.0 (PPCP: "tire redundância"): na tela, uma linha (eram três cartões com os números do veredito)
  ok('na tela, uma linha: hora extra ≈ 2h · adiar esses lotes (sem repetir as caixas do veredito), o dia mais carregado · remanejar só 1h05',
     HF, '<div class="tks-por tks-fl"><b>Para fechar:</b> hora extra de ≈ 2h da linha inteira, ou adiar esses lotes para depois de 13/11 — o dia mais carregado é <b>'
       + pc.data.slice(0, 5) + ' (+' + _fmtHM(pc.min) + ')</b>; remanejar entre os dias resolve só 1h05.</div>');
  ok('no papel, uma linha com os mesmos números',
     PF, '<div class="tks-por"><b>Para fechar:</b> hora extra de ≈ 2h, ou adiar ≈ 440 caixas para depois de 13/11 (o dia mais carregado é ' + pc.data.slice(0, 5) + ' (+' + _fmtHM(pc.min) + ')); remanejar entre os dias resolve só 1h05.</div>');
  ok('as aproximações: horas de meia em meia (5 em 5 min abaixo de 1 h), caixas à dezena/centena, dias com uma casa (nada abaixo de 0,1), pontos em mil acima de 10 mil',
     [_tkHAprox(299), _tkHAprox(686), _tkHAprox(133), _tkHAprox(12), _tkAprox(37), _tkAprox(436), _tkAprox(1091), _tkDia(299), _tkDia(819), _tkDia(1200), _tkDia(20), _tkPts(109400), _tkPts(9440)],
     ['5h', '11h30', '2h', '10 min', '37', '440', '1.100', '≈ 0,6 dia de produção', '≈ 1,6 dia de produção', '≈ 2,3 dias de produção', '', '≈ 109 mil pontos', '≈ 9.400 pontos']);
  const HH = _taktHerancaHtml(V1, V0, '09 a 13/11');
  ok('E ESTA SEMANA AINDA NÃO FECHA: a soma escrita numa barra (2h13 da programação + 11h26 que não fechar desta = 13h39 ≈ 1,6 dia)',
     [HH.includes('E ESTA SEMANA AINDA NÃO FECHA'), HH.includes('<span class="a" style="flex:133">2h13</span><span class="b" style="flex:686"><i>' + _fmtHM(686) + '</i></span>'),
      HH.includes('a programação de 09 a 13/11'), HH.includes('o que não fechar desta semana'), HH.includes('<div class="tks-hn">' + _fmtHM(819) + '</div>'), HH.includes('≈ 1,6 dia de produção'),
      /sobra/.test(HH)], [true, true, true, true, true, true, false]);
  ok('sem o que vir desta semana (ela fecha), nada; semana que vem com folga: a folga cobre ou não, escrito',
     [_taktHerancaHtml(V1, Object.assign({}, V0, { cabe:true, faltaMin:-30 }), 'x'),
      _taktHerancaHtml(Object.assign({}, V1, { cabe:true, faltaMin:-60 }), Object.assign({}, V0, { faltaMin:40 }), 'x').includes('a folga da semana que vem (1h00) cobre o que vem desta (0h40)'),
      _taktHerancaHtml(Object.assign({}, V1, { cabe:true, faltaMin:-60 }), V0, 'x').includes('não cobre')],
     ['', true, true]);
  const HP2 = _taktProxHtml(T1, P1, { largura:1200, sim:SIM, V:V1, sobra:V0 });
  ok('a semana que vem na ordem do olhar: veredito → para fechar (uma linha) → esta semana ainda não fecha → onde está o excesso (com o dia que mais pesa) → NA LINHA E NO APP → detalhes',
     [['tks-hero', 'class="tks-por tks-fl"', 'class="tks-her"', '<b>ONDE ESTÁ O EXCESSO</b>', 'class="tks-nl', 'tks-det'].map(x => HP2.indexOf(x)).every((v, i, a) => v > 0 && (!i || v > a[i - 1])),
      HP2.includes('<span class="tks-sec-r">' + (pc.pct >= 50 ? '<b>' + pc.data.slice(0, 5) + ' sozinho</b> tem ' + pc.pct + '% do excesso da semana' : 'o dia mais carregado é <b>' + pc.data.slice(0, 5) + '</b> (+' + _fmtHM(pc.min) + ')') + '</span>'),
      HP2.includes('<b>Dia a dia:</b>'), / · [\d.]+ caixas programadas/.test(HP2)], [true, true, false, false]); }
{ const Vc = _taktVeredito(T1, Object.assign({}, P1, { uep:10000, minPede:10000 * K, saldoMin:Math.round(10000 * K) - 2635, passa:10000 - 13805 }), RIT);
  const Hs = { num:20261107, minNorm:300, restMin:200, uep:500, he:40, meta:2761, fim:'17:00' };
  const Vs = _taktVeredito(_taktMontar(S, HIST.concat([{ data:'06/11/2026', uep:2400, uepHe:600, metaUep:2761 }]), Hs), null, RIT);
  ok('a semana que cabe diz CABE e quanto sobra (verde, sem "para fechar"); no sábado a desta semana diz NÃO FECHOU e quanto ficou, sem ritmo (não há jornada)',
     [(h => [h.includes('<div class="tks-hero ok"><div class="tks-hv">CABE<small>a programação cabe na jornada da semana</small>'), h.includes('<div class="tks-hl">SOBRAM</div>'), /para fechar/i.test(h)])(_taktHeroHtml(Vc, { semana:'prox', nUteis:5 })),
      Vs.encerrada, (h => [h.includes('NÃO FECHOU'), h.includes('<div class="tks-hl">FICARAM</div>'), h.includes('a jornada da semana acabou'), h.includes('no ritmo atual')])(_taktHeroHtml(Vs, { semana:'esta' }))],
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
     [72, 72, true, Math.round(P1.passa * 72), '≈ ' + fmtN(Math.round(P1.passa * 72 / 1000)) + ' mil pontos', true, null]);
  const h1 = _taktHeroHtml(V1p, { semana:'prox', nUteis:5 }), D2 = _taktDocHtml({ T0:Tp, T1:T1p, P1:P1p, V0:V0p, V1:V1p }, { data:'06/11/2026', hora:'11:58' });
  ok('na tela e na folha: a falta em horas e em pontos (um só, em mil), o ritmo atual em % da MÉDIA, a soma em pontos na frase da folha; a definição diz quantos pontos vale a UEP de cada semana',
     [h1.includes('<span><b>≈ 50 mil</b> pontos</span>'), h1.includes('no ritmo atual da linha (90,6% da média): faltam <b>' + _fmtHM(SIM[1].min) + '</b>'),
      D2.includes(_fmtHM(819) + '</b> (' + _tkPts(V1p.faltaPts + V0p.faltaPts) + ') somando'), h1.includes('referência'),
      D2.includes('a semana que vem, <b>2h13</b> de linha (' + _tkPts(V1p.faltaPts) + ')'), D2.includes('<b>Pontos</b> = a falta em UEP × os pontos por UEP dos lotes da semana (esta semana 72, a que vem 72 pontos por UEP'),
      D2.includes('média que a linha entrega sem hora extra: 1 dia de linha = ' + _fmtHM(527) + ' de jornada = 2.761 UEP</b> (a referência de UEP do painel, ' + UEP_REF_STATUS)],
     [true, true, true, false, true, true, true]); }
ok('os detalhes recolhidos lembram se estavam abertos (o refresh da tela redesenha o painel)',
   [_taktDetHtml('x').includes('<details class="tks-det" ontoggle="TKS_DET=this.open">'), (global.TKS_DET = true, _taktDetHtml('x').includes('<details class="tks-det" open')), (global.TKS_DET = false)],
   [true, true, false]);
{ const DOC = _taktDocHtml({ T0:T, T1, P1, V0, V1 }, { data:'06/11/2026', hora:'11:58' });
  ok('🖨 direta: uma frase no topo com os dois vereditos e a soma; por semana a palavra, o quanto falta e o porquê com as DUAS causas',
     ['<b>Nenhuma das duas semanas cabe na linha.</b> Esta semana faltam <b>' + _fmtHM(686) + '</b> de linha; a semana que vem, <b>2h13</b> de linha — <b>' + _fmtHM(819) + '</b> somando o que não fechar desta.',
      '<div class="tks-hv">NÃO FECHA<small>', '<div class="tks-hv">NÃO CABE<small>', '<b>73% excesso de programação</b>, <b>27% ritmo da linha</b>',
      '<b>Para fechar:</b> hora extra de ≈ 11h30, ou ≈ 1.700 caixas passam para a semana que vem.', '<b>Para fechar:</b> hora extra de ≈ 2h, ou adiar ≈ 440 caixas para depois de 13/11',
      'Onde está o excesso · horas de linha programadas',
      '1 dia de linha = ' + _fmtHM(527) + ' de jornada = 2.761 UEP'].filter(x => !DOC.includes(x)), []);
  ok('🖨 sem poluição: nada de s por UEP, cascata, tabela de cenários ou agora; os dois gráficos em horas no tamanho do papel; a referência dita como "em avaliação"',
     [DOC.includes('<div class="td-cols">'), /s por UEP|s\/UEP|<table|td-casc|AGORA ·|ÚLTIMA HORA/.test(DOC) || /\btakt\b/i.test(DOC.split('TAKT DA SEMANA').join('')),
      (DOC.match(new RegExp('viewBox="0 0 ' + TKS_DOC_SVG_W + ' ' + TKS_DOC_SVG_H + '"', 'g')) || []).length, DOC.includes(UEP_REF_STATUS)],
     [true, false, 2, true]); }
{ const G0 = pega('async function gerarRelatorioTakt(');
  ok('🖨 a janela abre no clique, lê o que faltar (histórico, esta semana, a que vem) e monta com as MESMAS contas da tela; no menu 🖨 IMPRIMIR ▾',
     [G0.indexOf("window.open(") < G0.indexOf('await '), /_taktMontar\(TKS, UEP_HIST, _taktHoje\(D, hojeN\), pts, est\)/.test(G0), /_taktProxMontar\(T1\)/.test(G0),
      /_taktVeredito\(T0, null, rit\)/.test(G0) && /_taktVeredito\(T1, P1, rit\)/.test(G0),
      /onclick="_uepImpFecha\(\);gerarRelatorioTakt\(\)"/.test(html), /T=_taktMontar\(TKS, UEP_HIST, _taktHoje\(D, hojeN\), _taktPtsMapa\(_pdiaPcCat\(\)\), _taktEstMapa\(_pdiaPcCat\(\)\)\)/.test(R)],
     [true, true, true, true, true, true]); }

console.log('\n── v7.213.0: AVALIAR PROGRAMAÇÃO (a colagem da planilha) ──');
['function _capVol(', 'function _capNome(', 'function _capProdutos(', 'function _tkaCorrente(', 'function _tkaFaixas(', 'function _tkaRitTxt(', 'function _tkaDias(', 'function _tkaSaldoHtml(', 'function _tkaDocHtml(', 'function _tkaNorm(', 'function _tkaChave(', 'function _tkaAchar(', 'function _tkaNum(', 'function _tkaData(', 'function _tkaLer(', 'function _tkaMontar(', 'function _tkaHtml(', 'function _tkaChegadaHtml(', 'function _tkaVolumes(',
 // v7.235.0: a eficiência do ⚙ e a esteira de cada código (o TEMPO-ALVO da colagem)
 'function _efEmb(', 'function _pdiaPcCat('].forEach(f => eval.call(global, pega(f)));
global.TKA_IN = false;
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
     [H.includes('<textarea id="tka-txt"'), H.includes('a&lt;b&gt;'), H.includes('<div class="tks-hv">NÃO CABE<small>'), H.includes('<div class="tks-hn">2h13<small> de linha</small></div>'),
      H.includes('caixas'), H.includes('</b> produtos</span>'), H.includes('id="tks-g-box"'), H0.includes('tks-hero'), H0.includes('AVALIAR'),
      H.includes('no ritmo atual da linha'), H.includes('class="tks-por tks-fl"') && !H.includes('<b>PARA FECHAR</b>'), H.includes('<b>ONDE ESTÁ O EXCESSO</b> horas de linha da programação colada')],
     [true, true, true, true, false, true, true, false, true, true, true, true]);
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
     [HR.includes('<tr><td>06/11 (hoje: o que resta)</td>'), HR.includes('<tr><td>09/11–13/11</td>'), HR.includes('<tr class="tka-col"><td>16/11–19/11 <span class="mono">(20/11 feriado)</span></td>'), /08\/11|15\/11|22\/11/.test(HR),
      C43.dias.filter(d => d.dow === 0 || d.dow === 6).every(d => d.cap === 0)],
     [true, true, true, false, true]);
  // v7.214.2 (PPCP: "deixa regra clara sobre falta e sobra"): por extenso, nunca sinal — falta = precisa − tem, sobra = tem − precisa
  const s0 = C43.semanas[0], sU = C43.semanas[C43.semanas.length - 1];
  ok('falta e sobra por extenso na semana; o atraso acumulado sem sinal; a regra escrita na nota; nenhuma hora com + ou − na tabela',
     [s0.precisa > s0.tem, HR.includes('<span class="tks-red">falta ' + _fmtHM(s0.precisa - s0.tem) + '</span>'),
      sU.tem > sU.precisa, HR.includes('<span class="tks-ok">sobra ' + _fmtHM(sU.tem - sU.precisa) + '</span>'),
      HR.includes('<b><span class="tks-red">' + _fmtHM(sU.atraso) + '</span></b>'), /[+−]\d+h\d\d/.test(HR.split('<div class="uep-nota">')[0]),
      HR.includes('<b>Falta</b> = precisa − tem (não cabe); <b>sobra</b> = tem − precisa (cabe)'), HR.includes('a sobra não vira crédito — só abate atraso que já existe'),
      HR.includes('<th class="n">NA SEMANA</th><th class="n">ATRASO ACUMULADO</th>')],
     [true, true, true, true, true, false, true, true, true]); }
ok('a folga de um dia não vira crédito: só absorve atraso que já existe (segunda folgada não abate a terça carregada)',
     [Cg.dias.find(d => d.n === 20261109).atraso, Math.round(Cg.dias.find(d => d.n === 20261110).atraso), Cg.atrasoR], [0, Math.round(4000 * 527 / 2761 - 527), null]); }
ok('as faixas que faltam ler: da 3ª segunda-feira até o último dia colado, de 14 em 14 dias (o máximo da leitura)',
   [_tkaFaixas(20261106, 20261123), _tkaFaixas(20261106, 20261130), _tkaFaixas(20261106, 20261113)],
   [[{ de:'16/11/2026', ate:'29/11/2026' }], [{ de:'16/11/2026', ate:'29/11/2026' }, { de:'30/11/2026', ate:'13/12/2026' }], []]);
{ const HS = _tkaSaldoHtml(C43), M43 = _tkaMontar(L43, OC.fer, 2761, RIT), DOC = _tkaDocHtml({ L:L43, M:M43, C:C43 }, { data:'06/11/2026', hora:'14:40' });
  ok('o desenho do saldo: a frase (chega com, termina com, no ritmo atual), a tabela por semana, o que não somou (já no painel); a 🖨: a colagem e o saldo lado a lado, a frase uma vez só',
     [HS.includes('A linha chega em <b>16/11</b> com <b>' + _fmtHM(C43.chegada) + '</b> de atraso'), (HS.match(/<tr( class="tka-col")?><td>/g) || []).length, HS.includes('12 linhas coladas já estão na programação do painel (pelo Nº LOTE SIST.)'),
      DOC.includes('A programação colada (<b>16/11 a 23/11</b>) <b>cabe</b>'), DOC.includes('A linha chega nela com <b>' + _fmtHM(C43.chegada) + '</b> de atraso'),
      (DOC.match(/A linha chega/g) || []).length, DOC.includes('>SALDO DE HORAS<small>'), DOC.includes('<div class="tks-hv">CABE<small>')],
     [true, 4, true, true, true, 1, true, true]);
  const H44 = _tkaSaldoHtml(_tkaCorrente(PAI, _tkaLer(FX.C44AI, PRODS, 20261106).itens, OC));
  ok('lacuna dita na linha da semana e na nota', [H44.includes('sem programação no painel nem na colagem: 19/11'), H44.includes('<b>3 dias úteis sem programação</b> (19/11, 23/11, 24/11)')], [true, true]); }
{ const G1 = pega('async function gerarRelatorioAvaliacao('), PC = pega('function _tkaPainelCarregar(');
  ok('a ligação: a leitura do painel na fila (espera as outras), as faixas pela mesma _taktLer; a 🖨 no menu, com a MESMA corrente da tela',
     [/await new Promise\(ok=>_uepDepoisDe\(_uepLendo, ok\)\)/.test(PC), /_taktLer\('&de='\+encodeURIComponent\(f\.de\)/.test(PC), /onclick="_uepImpFecha\(\);gerarRelatorioAvaliacao\(\)"/.test(html),
      /_tkaCorrente\(PN\.lin, TKA\.itens/.test(G1) && /_tkaCorrente\(PN\.lin, TKA\.itens/.test(R), /PROG_DETALHADA/.test(pega('function _tkaPainel('))],
     [true, true, true, true, true]); }
{ // v7.219.0 (PPCP com a 🖨: "está dando 25h49 no final"): o NO RITMO ATUAL do saldo é em horas do RELÓGIO, a
  // mesma régua do "no ritmo atual: faltam X" do veredito — a chegada + o que falta da colagem = o fim.
  // Até a v7.218.0 o saldo era em horas de linha na média (demanda − jornada × ritmo) e a folha não fechava.
  const r = 0.9, rit = r * 2761, OR = { hojeN:20261106, restMin:0, meta:2761, rit, fer:{} };
  const PR = [{ dataNum:20261109, data:'09/11/2026', lote:'99001', desc:'MESA X', cor:'', saldo:3500, uepCx:1, foraEsteira:false }];
  const IT = [{ n:20261110, nome:'COLADO', qtde:4000, uepJogo:1, ptsJogo:0, lote:null }, { n:20261111, nome:'COLADO', qtde:3000, uepJogo:1, ptsJogo:0, lote:null }];
  const CR = _tkaCorrente(PR, IT, OR), MR = _tkaMontar({ itens:IT, semCad:[], semData:0 }, {}, 2761, rit);
  const k = 527 / 2761, bc = [3500, 4000, 3000].reduce((b, u) => Math.max(0, b + u * k / r - 527), 0);
  ok('no ritmo atual o saldo fecha com o veredito: chegada + "faltam" no ritmo atual = o fim (horas do relógio, demanda ÷ ritmo − jornada)',
     [CR.chegadaR, CR.atrasoR, Math.abs(CR.chegadaR + MR.V.ritmo.faltaMin - CR.atrasoR) <= 1, CR.atrasoR === Math.round(bc), CR.chegada + MR.V.faltaMin === CR.atraso],
     [Math.round(3500 * k / r - 527), Math.round(bc), true, true, true]);
  ok('a régua velha (demanda − jornada × ritmo, horas de linha na média) não volta', /Br=Math\.max\(0, Br\+dem-cap\*r\)/.test(pega('function _tkaCorrente(')), false);
  const HS = _tkaSaldoHtml(CR), DC = _tkaDocHtml({ L:{ itens:IT, semCad:[] }, M:MR, C:CR }, { data:'06/11/2026', hora:'14:40' });
  ok('a tela e a 🖨 dizem a chegada E o fim no ritmo atual (o leitor confere a soma), e a nota diz que é a mesma régua do veredito',
     [HS.includes('No ritmo atual (90,0% da média, desde hoje): chega com <b>' + _fmtHM(CR.chegadaR) + '</b> e termina com <b>' + _fmtHM(CR.atrasoR) + '</b>' + _tkaDias(CR.atrasoR) + '.'),
      DC.includes('(no ritmo atual, chega com <b>' + _fmtHM(CR.chegadaR) + '</b> e termina com <b>' + _fmtHM(CR.atrasoR) + '</b>' + _tkaDias(CR.atrasoR) + ')'),
      HS.includes('chegada + o “faltam” no ritmo atual = o fim')],
     [true, true, true]);
  // v7.220.0 (PPCP: "coloca em dias tbm… no fim"): o atraso do FIM também em dias (÷ 8h47), na média e no ritmo atual; a chegada e a tabela não
  ok('o fim em dias: minutos ÷ 527 com uma casa, "dia" abaixo de 2; na frase da tela e da 🖨, só no fim (na média e no ritmo atual)',
     [_tkaDias(1297), _tkaDias(1526), _tkaDias(527), _tkaDias(0), _tkaDias(null),
      HS.includes('de atraso' + _tkaDias(CR.atraso) + ', na média'), _tkaDias(CR.atraso), _tkaDias(CR.atrasoR),
      DC.includes('de atraso' + _tkaDias(CR.atraso) + ' (no ritmo atual'), HS.includes('chega com <b>' + _fmtHM(CR.chegadaR) + '</b>' + _tkaDias(CR.chegadaR)),
      (HS.split('<table')[1] || '').split('<div class="uep-nota">')[0].includes('dia)'), HS.includes('<b>Dias</b> = horas ÷ 8h47 (1 jornada)')],
     [' (≈ 2,5 dias)', ' (≈ 2,9 dias)', ' (≈ 1,0 dia)', '', '', true, ' (≈ 0,8 dia)', ' (≈ 1,2 dia)', true, false, false, true]); }
{ // v7.221.0 (PPCP: "como explicar isso, não cabe e sobra"): a colagem 12–16/11 não cabe, mas a semana dela que começa
  // na segunda (16/11) sobra. A linha COLAGEM INTEIRA traz os números do veredito debaixo das semanas.
  const IT = [{ n:20261112, nome:'X', qtde:4000, uepJogo:1, ptsJogo:0, lote:null }, { n:20261113, nome:'X', qtde:4000, uepJogo:1, ptsJogo:0, lote:null },
              { n:20261116, nome:'X', qtde:1500, uepJogo:1, ptsJogo:0, lote:null }];
  const L = { itens:IT, semCad:[], semData:0 }, OCc = { hojeN:20261106, restMin:0, meta:2761, rit:null, fer:{} };
  const Cc = _tkaCorrente([], IT, OCc), Mc = _tkaMontar(L, {}, 2761, null), V = Mc.V, hm = _fmtHM;
  const sCol = Cc.semanas.filter(w => w.col), soma = sCol.reduce((a, w) => a + w.precisa - w.tem, 0);
  global.TKA_TXT = '';
  const HT = _tkaHtml(L, Mc, { botoes:'', corrente:Cc }), DOC = _tkaDocHtml({ L, M:Mc, C:Cc }, { data:'06/11/2026', hora:'14:40' });
  const linhaTot = '<tr class="tka-tot"><td colspan="2">colagem inteira 12/11–16/11 <span class="mono">(= o NÃO CABE)</span></td><td class="n">' + hm(V.precisaMin)
    + '</td><td class="n">' + hm(V.temMin) + '</td><td class="n"><span class="tks-red">falta ' + hm(V.faltaMin) + '</span></td>';
  ok('não cabe e sobra: a colagem inteira falta, a semana de 16/11 sobra; as semanas da colagem somam a falta dela; a linha COLAGEM INTEIRA (o veredito) fecha a tabela, nas semanas da colagem a marca',
     [V.cabe, sCol.length, sCol[1].precisa < sCol[1].tem, Math.abs(soma - V.faltaMin) <= 1,
      HT.includes(linhaTot), HT.indexOf('tka-tot') > HT.lastIndexOf('<tr class="tka-col">'), (HT.match(/<tr class="tka-col">/g) || []).length,
      DOC.includes('colagem inteira 12/11 a 16/11 <span class="mono">(= o NÃO CABE)</span>'), HT.includes('<b>Colagem inteira</b> = só a programação colada'),
      _tkaSaldoHtml(Cc).includes('tka-tot'), _tkaSaldoHtml(Cc).includes('<b>Colagem inteira</b>')],
     [false, 2, true, true, true, true, 2, true, true, false, false]);
  ok('a pele: a marca das semanas da colagem e a linha de total na tela e no papel',
     [/#sec-uep \.tka-tab tr\.tka-col td:first-child\{border-left:3px solid var\(--acc\)\}/.test(html), /#sec-uep \.tka-tab tr\.tka-tot td\{/.test(html),
      /\.tks-doc \.tka-tab tr\.tka-tot td\{border-top:1px solid #1F2328;font-weight:600\}/.test(html)], [true, true, true]); }
ok('a faixa das sub-abas preenche a largura (auto-fit; o auto-fill deixava colunas vazias a 1.920 px) e a letra é um pouco maior',
   [/#sec-uep \.ucv-sub\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(200px,1fr\)\)\}/.test(html), /auto-fill,minmax\(180px/.test(html),
    /#sec-uep \.ucv-sb span\{font-size:14\.5px\}/.test(html)], [true, false, true]);

{ // v7.223.0 (PPCP, depois do .gs v5.60 implantado: "essa semana e avaliar programação ficou fora do padrão"):
  // a AVALIAÇÃO na ordem da SEMANA QUE VEM — o período na barra do título; avaliada, a caixa de colar
  // recolhe; veredito, PARA FECHAR, o bloco A LINHA CHEGA (o saldo de horas somado), o gráfico e, nos
  // detalhes, a tabela semana a semana (sem a frase, que o bloco já diz).
  global.TKA_TXT = FX.C43AI; global.TKA_IN = false;
  const M43 = _tkaMontar(L43, OC.fer, 2761, RIT), V = M43.V;
  const HA = _tkaHtml(L43, M43, { botoes:_taktSemBotoes(2), msg:'30 linhas lidas', largura:1200, corrente:C43 });
  const iHero = HA.indexOf('<div class="tks-hero'), iCh = HA.indexOf('<div class="tks-her-t">'), iG = HA.indexOf('id="tks-g-box"'), iDet = HA.indexOf('<details class="tks-det"');
  ok('a avaliação na ordem do padrão: título com o período, a caixa recolhida (uma linha), veredito, A LINHA CHEGA, o gráfico, os detalhes com a tabela',
     [/<b>TAKT DA SEMANA<\/b> .*16\/11–23\/11 · 5 dias úteis \(20\/11 consciência negra\)<\/div>/.test(HA.split('</div>')[0] + '</div>'),
      HA.includes('<details class="uep-card tka-in tka-rec" ontoggle="TKA_IN=this.open"><summary><b>PROGRAMAÇÃO COLADA</b> · 30 linhas lidas<span class="tka-ed">'),
      HA.indexOf('<textarea id="tka-txt"') > 0 && HA.indexOf('<textarea id="tka-txt"') < iHero, iHero < iCh, iCh < iG, iG < iDet,
      HA.slice(iDet).includes('<table class="tka-tab">'), HA.slice(iDet).includes('class="tks-ler'), HA.includes('A PROGRAMAÇÃO COLADA</b>'),
      _tkaHtml(L43, M43, { botoes:'', corrente:C43 }).includes(' open ontoggle') , (global.TKA_IN = true, _tkaHtml(L43, M43, { botoes:'', corrente:C43 }).includes('tka-rec" open ontoggle'))],
     [true, true, true, true, true, true, true, false, false, false, true]);
  global.TKA_IN = false;
  const HC = _tkaChegadaHtml(C43, V, '16/11 a 23/11');
  ok('A LINHA CHEGA (a colagem cabe, a linha chega atrasada): a folga da colagem não cobre o atraso que chega; termina com o atraso do saldo, em dias; o ritmo atual',
     [V.cabe, C43.chegada > 0, HC.includes('<div class="tks-her"><div><div class="tks-her-t">E A LINHA CHEGA ATRASADA</div>'),
      HC.includes('a folga da colagem (<b>' + _fmtHM(-V.faltaMin) + '</b>) não cobre o atraso que chega (<b>' + _fmtHM(C43.chegada) + '</b>)'),
      HC.includes('<div class="kpi-lbl">TERMINA 23/11 COM</div><div class="tks-hn">' + _fmtHM(C43.atraso) + '</div>'), HC.includes(_tkDia(C43.atraso)),
      HC.includes('no ritmo atual (' + fmtP(C43.ritPct) + ' da média): ' + _tkaRitTxt(C43))],
     [true, true, true, true, true, true, true]);
  // a barra somada só quando ela FECHA com o total (chegada + falta da colagem = o fim)
  const IT = [{ n:20261110, nome:'X', qtde:4000, uepJogo:1, ptsJogo:0, lote:null }, { n:20261111, nome:'X', qtde:4000, uepJogo:1, ptsJogo:0, lote:null }];
  const PRb = [{ dataNum:20261109, data:'09/11/2026', lote:'99001', desc:'MESA X', cor:'', saldo:3500, uepCx:1, foraEsteira:false }];
  const OCb = { hojeN:20261106, restMin:0, meta:2761, rit:null, fer:{} }, Cb = _tkaCorrente(PRb, IT, OCb), Vb = _tkaMontar({ itens:IT, semCad:[], semData:0 }, {}, 2761, null).V;
  const HB = _tkaChegadaHtml(Cb, Vb, '10/11 a 11/11');
  ok('chega atrasada e a colagem falta: a barra somada (o que chega + a colagem = o fim), sem o ritmo atual quando não há ritmo',
     [Cb.chegada > 0, Vb.faltaMin > 0, Math.abs(Cb.chegada + Vb.faltaMin - Cb.atraso) <= 1,
      HB.includes('<span class="b" style="flex:' + Cb.chegada + '"><i>' + _fmtHM(Cb.chegada) + '</i></span><span class="a" style="flex:' + Vb.faltaMin + '">' + _fmtHM(Vb.faltaMin) + '</span>'),
      HB.includes('o atraso que chega em 10/11'), HB.includes('tka-rit')],
     [true, true, true, true, true, false]);
  const Cd = _tkaCorrente([], [{ n:20261110, nome:'X', qtde:1000, uepJogo:1, ptsJogo:0, lote:null }], OCb);
  const HD = _tkaChegadaHtml(Cd, _tkaMontar({ itens:[{ n:20261110, nome:'X', qtde:1000, uepJogo:1, ptsJogo:0, lote:null }], semCad:[], semData:0 }, {}, 2761, null).V, '10/11');
  ok('chega em dia e termina em dia: o bloco verde, sem barra', [HD.includes('<div class="tks-her ok">'), HD.includes('A LINHA CHEGA EM DIA'), HD.includes('<div class="tks-hn">em dia</div>'), HD.includes('tks-stk')], [true, true, true, false]);
  ok('o desenho não faz conta (vem do _tkaCorrente e do veredito)', /_tkaCorrente\(|_taktVeredito\(|_taktMontar\(/.test(pega('function _tkaChegadaHtml(') + pega('function _tkaHtml(')), false);
  ok('a pele: a caixa recolhida, o bloco verde, o subtítulo do veredito com entrelinha (quebra a 1366 sem encavalar)',
     [/#sec-uep \.tka-rec>summary\{cursor:pointer;display:flex/.test(html), /#sec-uep \.tks-her\.ok\{border-left-color:var\(--ok\)\}/.test(html),
      /#sec-uep \.tks-hv small\{[^}]*max-width:300px;line-height:1\.35\}/.test(html), /TKA_IN=false;   \/\/ avaliou/.test(pega('function _tkaAvaliar('))],
     [true, true, true, true]);
  global.TKA_TXT = ''; }

console.log('\n── v7.224.0: a FAIXA DO TAKT — os volumes para o app de cronoanálise, o takt e o agora, logo abaixo do título ──');
{ // PPCP, 11/11/2026: "onde fica o takt que temos que seguir? e a quantidade de volumes" → "não consigo localizar com
  // facilidade" → "preciso saber o takt da semana para colocar no app de cronoanálise"
  const F0 = _taktFaixa(T, { G }), F1 = _taktFaixa(T1), VC = _tkaVolumes(L42, M42.T);
  const F2 = _taktFaixa(M42.T, { vol:VC.vol, prod:VC.prod, semVol:VC.semVol, volFds:VC.volFds });
  // v7.225.0: o "s por volume" da faixa é o TAKT DO APP — os mesmos números da tabela PROGRAMA GRAVADO do app
  // (print de 11/11/2026: 038-26 5.970 · 4 de 5 · 193 vol/h · 18.7s; 039-26 9.050 · 5 de 5 · 234 · 15.4s)
  ok('esta semana (02–08/11): 5.970 volumes = as caixas programadas (o mesmo do takt) em 4 dias úteis, 02/11 fora; no app 4 × 8h48 − 4 × 1h04 = 30h56 ÷ 5.970 = 18,7 s (193 vol/h), o 038-26 do app; o takt do painel 8,7 s por UEP; agora a MEL 1/2 BRANCO 15,0 s por caixa (211 caixas por hora de relógio — o setup na média)',
     [F0.vol, F0.vol === T.progCx, F0.nUteis, F0.fer, F0.de + '–' + F0.ate, F0.app.dias, F0.app.nSem, _fmtHM(F0.app.prod), _tkS(F0.app.s), Math.round(F0.app.vh),
      _tkS(F0.takt), _tkS(F0.ref), F0.setupDia, F0.agora && _tkS(F0.agora.sTakt), F0.agora && Math.round(F0.agora.cxh)],
     [5970, true, 4, ['02/11 finados'], '03/11–06/11', 4, 1, '30h56', '18,7', 193, '8,7', '10,1', 64, '15,0', 211]);
  ok('semana que vem (09–13/11): 9.050 volumes em 5 dias; no app 5 × (8h48 − 1h04) = 38h40 ÷ 9.050 = 15,4 s (234 vol/h), o 039-26 do app; sem o agora (nada roda nela ainda)',
     [F1.vol, F1.nUteis, F1.app.dias, _fmtHM(F1.app.prod), _tkS(F1.app.s), Math.round(F1.app.vh), F1.agora, F1.fer], [9050, 5, 5, '38h40', '15,4', 234, null, []]);
  { const dia = (d, cx) => { const [dd, mm, yy] = d.split('/').map(Number); return { data:d, dow:new Date(yy, mm - 1, dd).getDay(), cx }; };
    const S16 = [dia('16/11/2026', 2200), dia('17/11/2026', 2200), dia('18/11/2026', 2200), dia('19/11/2026', 2170), dia('20/11/2026', 0), dia('21/11/2026', 0), dia('22/11/2026', 0)];
    const A16 = _taktApp(S16, 8770);
    ok('o 040-26 do print: 8.770 volumes em 16–19/11 (20/11 consciência negra sem lote) → 4 de 5 dias, 30h56, 12,7 s e 284 vol/h — o MESMO do app (era 14,4 s: jornada ÷ volumes, sem o setup)',
       [A16.dias, _fmtHM(A16.prod), _tkS(A16.s), Math.round(A16.vh), _tkS(4 * 527 * 60 / 8770)], [4, '30h56', '12,7', 284, '14,4']);
    const S6 = S16.slice(0, 4).concat([dia('20/11/2026', 100), dia('21/11/2026', 300)]);
    const S2 = S16.concat([dia('23/11/2026', 500), dia('24/11/2026', 500)]);
    ok('como o app: dia sem volume não conta; com volume em 6 dias a semana fica em 5 (a jornada do grupo); duas semanas somam as horas; sem volume → null',
       [_taktApp(S6, 9070).dias, (a => [a.dias, a.nSem])(_taktApp(S2, 9770)), _taktApp(S16, 0), _taktApp([], 100), _taktApp(S16, 8770, { hSemana:44, diasSemana:5, setupsDia:0, setupMin:8 }).setup],
       [5, [6, 2], null, null, 0]); }
  ok('AVALIAR a 042-26 colada: 8.000 produtos × os volumes de cada um = 9.050 volumes — o MESMO das caixas que o painel tem para 09–13/11 (a colagem e a programação batem)',
     [VC.prod, VC.vol, VC.vol === T1.progCx, F2.vol, F2.prod, VC.semVol, VC.volFds], [8000, 9050, true, 9050, 8000, 0, 0]);
  const pv = {}; VC.prods.forEach(g => { pv[g.nome] = r1(((pv[g.nome] || 0) + (g.cxUep ? g.uepSoma / g.cxUep : 0)) * 100) / 100; });
  ok('o TAKT POR PRODUTO da colagem é por VOLUME: a UEP de cada volume (a cor mais rápida do cadastro) soma a UEP do produto; MEL tem as duas linhas',
     [L42.itens.every(x => r1(pv[x.nome] * 100) === r1(x.uepJogo * 100)), VC.prods.filter(g => g.nome === 'PENTEADEIRA CAMARIM MEL').map(g => [g.va, g.vb]),
      _taktPorCaixa(Object.assign({}, M42.T, { prods:VC.prods })).length === VC.prods.length],
     [true, [[1, 2], [2, 2]], true]);
  ok('sem takt (sem UEP programada), sem faixa; dia não útil com volume é dito (está no total, é hora extra)',
     [_taktFaixa({ takt:null }), _taktFaixaHtml(null),
      _taktFaixa({ takt:10, ref:11, pede:110, nUteis:1, progCx:300, progUep:300, dias:[{ util:true, data:'09/11/2026', dow:1, cx:200 }, { util:false, data:'14/11/2026', dow:6, cx:100 }] }).volFds],
     [null, '', 100]);
  global.TKS_TPC = false;
  const HF = _taktFaixaHtml(F0, _taktPorCaixa(T), T);
  ok('o desenho (v7.232.0, compacto): PARA O APP DE CRONOANÁLISE com os volumes e o takt do app numa linha, o setup e o feriado; o agora em s por caixa; o TAKT POR PRODUTO fechado, sem repetir o título; a conta do app no title',
     ['<div class="kpi-lbl">PARA O APP DE CRONOANÁLISE</div><div class="tks-nl-l"><b class="tks-nl-n">5.970</b> volumes · takt no app <b class="tks-nl-n">18,7 s</b> por volume</div>',
      'setup 8 × 8 min por dia (1h04) · <span class="tks-warn">padrão — digite o setup no ⚙ e o mesmo no app</span> · 02/11 finados fora',
      'Caixas programadas = 12.831 UEP · 4 dias úteis (03/11 a 06/11).', 'O takt do app é a mesma conta dele: 30h56 (8h48 por dia com volume, menos o setup, 4h16 nos 4 dias) ÷ 5.970 volumes',
      '<div class="kpi-lbl">AGORA · VOL 1/2 PENTEADEIRA CAMARIM MEL BRANCO</div>', 'a semana pede <b class="tks-nl-n">15,0 s</b> por caixa <i>≈ 211 cx/h</i>',
      '<details class="tks-tpc" ontoggle="TKS_TPC=this.open"><summary><b>TAKT POR PRODUTO</b>', 'class="tks-nl c2"'].filter(t => !HF.includes(t)).concat(
      HF.includes('<b>TAKT POR CAIXA</b>') ? ['o título da tabela repetido'] : [], HF.slice(0, HF.indexOf('<details class="tks-tpc"')).includes('s por UEP') ? ['s por UEP na faixa'] : [],
      (global.TKS_TPC = true, _taktFaixaHtml(F0, _taktPorCaixa(T), T)).includes('<details class="tks-tpc" open') ? [] : ['abre aberto com TKS_TPC']), []);
  { // v7.232.0 (revisão): o cartão do AGORA nunca some calado; o dia não útil e o plural ditos; as notas à vista
    const semHora = _taktAgora(T, Object.assign({}, AG, { horas:[] })), F3 = _taktFaixa(T, { G:semHora });
    const H3 = _taktFaixaHtml(F3, [], T);
    ok('o AGORA antes da 1ª hora fechada continua (o que a semana pede e o tempo-alvo) e diz que nenhuma hora fechou',
       [H3.includes('a semana pede <b class="tks-nl-n">15,0 s</b> por caixa'), H3.includes('nenhuma hora de jornada fechada hoje · 1,73 UEP por caixa'), H3.includes('class="tks-nl c2"')], [true, true, true]);
    const Hn = _taktFaixaHtml(_taktFaixa(T, { G:null }), [], T), Hu = _taktFaixaHtml(_taktFaixa(T, { G:_taktAgora(T, Object.assign({}, AG, { uepCx:null })) }), [], T);
    ok('sem produto apontado ou com o produto sem UEP, o cartão do AGORA diz por quê (antes dizia nos DETALHES); a semana que vem não tem AGORA',
       [Hn.includes('nenhum produto apontado agora'), Hn.includes('class="tks-nl c2"'),
        Hu.includes('<div class="kpi-lbl">AGORA · VOL 1/2 PENTEADEIRA CAMARIM MEL BRANCO</div>'), Hu.includes('o produto de agora não tem UEP no cadastro — sem tempo por caixa'),
        _taktFaixaHtml(_taktFaixa(T1), [], T1).includes('AGORA')], [true, true, true, true, false]);
    ok('o dia não útil com volume (no total) e o produto fora do cadastro ditos na faixa; "1 dia útil" no singular',
       [_taktFaixaHtml(Object.assign({}, F0, { volFds:100 })).includes('100 em dia não útil estão no total'),
        _taktFaixaHtml(Object.assign({}, F0, { nUteis:1, de:'03/11', ate:'03/11' })).includes('UEP · 1 dia útil (03/11).')], [true, true]);
    ok('as notas ficam à vista (mudam a leitura do veredito): cx sem UEP na esta semana e na que vem',
       [_taktHtml(Object.assign({}, T, { cxSemUep:80 }), G, { largura:1200, V:_taktVeredito(T, null, RIT) }).includes('80 cx programadas sem UEP no cadastro ficaram fora (o takt real é um pouco mais apertado).'),
        _taktProxHtml(Object.assign({}, T1, { cxSemUep:80 }), P1, { largura:1200, V:_taktVeredito(T1, P1, RIT) }).includes('80 cx programadas sem UEP no cadastro ficaram fora (a semana é um pouco mais pesada).')],
       [true, true]); }
  global.TKS_TPC = false;
  const H2 = _taktFaixaHtml(F2, _taktPorCaixa(Object.assign({}, M42.T, { prods:VC.prods })), M42.T);
  ok('na AVALIAR: VOLUMES DA PROGRAMAÇÃO COLADA, de quantos produtos; produto fora do cadastro dito em vermelho (não conta)',
     [H2.includes('PARA O APP DE CRONOANÁLISE · PROGRAMAÇÃO COLADA'), H2.includes('<b class="tks-nl-n">9.050</b> volumes'), H2.includes('De 8.000 produtos colados = 14.504 UEP'),
      _taktFaixaHtml(Object.assign({}, F2, { semVol:500 })).includes('<span class="tks-red">500 produtos fora do cadastro não contam</span>'), H2.includes('class="tks-nl"')],
     [true, true, true, true, true]);
  ok('v7.225.0: o painel e o app leem o MESMO setup (CRONO_APP_GRUPO, um lugar só); a faixa não diz mais "sem descontar o setup"; várias semanas somadas são ditas',
     [/h\.setup \|\| _taktSetup\(\)/.test(pega('function _taktMontar(')), /\b64\b/.test(pega('function _taktMontar(') + pega('function _taktApp(')),
      /_taktApp\(T\.dias, vol, T\.setup/.test(pega('function _taktFaixa(')), /grupo\|\|CRONO_APP_GRUPO/.test(pega('function _taktApp(')),
      /sem descontar o setup/.test(pega('function _taktFaixaHtml(')),
      _taktFaixaHtml(Object.assign({}, F0, { app:Object.assign({}, F0.app, { nSem:2 }) })).includes(' 2 semanas somadas (no app, uma linha por semana).')],
     [true, false, true, true, false, true]);
  { // a AVALIAR monta o TAKT POR PRODUTO com um T só dela (Tv): o cx/h tem de ser de relógio lá também
    const HA = _tkaHtml(L42, M42, { botoes:'' }), R42 = _taktPorCaixa(Object.assign({}, M42.T, { prods:VC.prods }));
    const g0 = R42.find(g => g.cxhTakt), esp = Math.round(3600 * 463 / 527 / g0.sTakt);
    ok('na AVALIAR o cx/h do TAKT POR PRODUTO também é por hora de relógio (o Tv leva os minutos sem o setup)',
       [Math.round(g0.cxhTakt), HA.includes('<small>' + fmtN(esp) + ' cx/h</small>'), HA.includes('<small>' + fmtN(Math.round(3600 / g0.sTakt)) + ' cx/h</small>')],
       [esp, true, false]); }
  { // v7.235.1 (revisão da v7.235.0: "21 de 21 linhas com sem medida da caixa"): na AVALIAR o TEMPO-ALVO vem da
    // esteira de cada VOLUME do cadastro (estVols do _capProdutos) — os códigos da colagem são de mentira
    // (900000001…), o mapa por código não servia; e a eficiência do ⚙ vai no Tv (antes, sempre 85%)
    const CATM = [{ codigo:'501151001', desc:'VOL 1/1 RACK MOVE 1.6', cor:'CINAMOMO', uep:3.01, pontos:163, medida:2076, velocidade:9, entrePeca:400 },
      { codigo:'501059001', desc:'VOL 1/2 PENTEADEIRA CAMARIM STRASS', cor:'BRANCO', uep:1.46, pontos:290, medida:1705, velocidade:9, entrePeca:400 },
      { codigo:'501059002', desc:'VOL 2/2 PENTEADEIRA CAMARIM STRASS', cor:'BRANCO', uep:1.78, pontos:79, medida:1344, velocidade:9, entrePeca:400 },
      { codigo:'501999001', desc:'VOL 1/1 PRODUTO SEM MEDIDA', cor:'BRANCO', uep:1, pontos:50 }];
    const PM = _capProdutos(CATM), pr = n => PM.find(p => p.nome.includes(n)), est = mm => (mm + 400) / 150;
    const item = (n, q) => { const p = pr(n); return { n:20261110, nome:p.nome, qtde:q, uepJogo:p.uepJogo, ptsJogo:p.ptsJogo, lote:null, modelo:p.modelo, nVol:p.nVol, uepVols:p.uepVols, estVols:p.estVols }; };
    const LM = { itens:[item('RACK MOVE', 100), item('STRASS', 50), item('SEM MEDIDA', 10)], semCad:[], semData:0 };
    const PD0 = global.PONTOS_DIA; global.PONTOS_DIA = { eficienciaEmb:80 };
    const MM = _tkaMontar(LM, {}, 2761, null), VM = _tkaVolumes(LM, MM.T);
    const RM = _taktPorCaixa({ takt:MM.T.takt, ref:MM.T.ref, meta:MM.T.meta, minProd:MM.T.minProd, ef:MM.T.ef, prods:VM.prods });
    const HM = _tkaHtml(LM, MM, { botoes:'' });
    global.PONTOS_DIA = PD0;
    const r2 = x => x == null ? null : Math.round(x * 100) / 100, rot = n => RM.find(g => g.rot.includes(n));
    ok('AVALIAR: a esteira de cada volume vai com o produto do cadastro (estVols: RACK MOVE 1.6 16,51 s; STRASS 14,03 e 11,63 s; sem medida, null)',
       [pr('RACK MOVE').estVols.map(r2), pr('STRASS').estVols.map(r2), pr('SEM MEDIDA').estVols], [[r2(est(2076))], [r2(est(1705)), r2(est(1344))], [null]]);
    ok('AVALIAR: o TEMPO-ALVO de cada volume = a esteira dele ÷ a eficiência do ⚙ (80% aqui), não "sem medida da caixa"; o produto sem medida, sem alvo',
       [MM.T.ef, r2(rot('RACK MOVE').sRef), r2(rot('STRASS · VOL 2/2').sRef), rot('SEM MEDIDA').sRef,
        HM.includes('÷ 80%'), HM.includes('÷ 85%'), (HM.match(/sem medida da caixa/g) || []).length],
       [80, r2(est(2076) / 0.8), r2(est(1344) / 0.8), null, true, false, 1]); }
  // v7.226.0 (PPCP: "melhor deixar para eu configurar setup nos dois, assim coloco igual, vamos usar setup médio"):
  // o setup é do ⚙ — CONFIG_PAINEL (.gs v5.61), senão este computador, senão o padrão 8 × 8.
  // Medido: 4,3 trocas de produto/dia × 7,65 min = 32,9 min/dia (13/10–10/11). O app só aceita
  // trocas INTEIRAS e minutos com UMA casa (revisão): o mesmo setup do dia é 4 × 8,2 = 32,8.
  { const SUP = { setupsDia:4, setupMin:8.2, origem:'planilha' };
    const Ts = _taktMontar(S, HIST, Object.assign({}, HOJE, { setup:SUP })), Fs = _taktFaixa(Ts, { G });
    ok('setup médio do ⚙ (4 × 8,2 = 32,8 min/dia): o painel tira 32,8 da jornada (takt 9,24 s por UEP); o % e o executado em % não mudam (116,2 e 90,6)',
       [r1(Ts.setupDia), r1(Ts.minProd), Math.round(Ts.takt * 100) / 100, r1(Ts.pede), r1(Ts.exec.pct)], [32.8, 494.2, 9.24, 116.2, 90.6]);
    ok('no app, com o MESMO setup (44 h × 4/5 − 4 × 8,2 × 4 = 33h01): 19,9 s por volume, 181 vol/h — a conta do ritmoExigido do app',
       [_fmtHM(Fs.app.prod), _tkS(Fs.app.s), Math.round(Fs.app.vh), _tkS((44 * 4 / 5 - 4 * 8.2 * 4 / 60) * 3600 / 5970)], ['33h01', '19,9', 181, '19,9']);
    const Hs = _taktFaixaHtml(Fs, [], Ts);
    ok('a faixa escreve o setup do ⚙ com vírgula (e o total do dia), e o title a conta do app',
       ['setup 4 × 8,2 min por dia (0h33) · digite o mesmo no app', 'menos o setup, 2h11 nos 4 dias',
        'Se não bater com o do app, o setup do ⚙ e o do app (Demanda semanal → Tempo disponível) estão diferentes, ou os volumes da semana.'].filter(t => !Hs.includes(t))
         .concat(/o mesmo do app/.test(Hs) ? ['afirma que o app está igual (o painel não sabe)'] : []), []);
    const Tz = _taktMontar(S, HIST, Object.assign({}, HOJE, { setup:{ setupsDia:0, setupMin:8, origem:'planilha' } }));
    ok('setup ZERO (sem setup) é valor: o takt volta à jornada inteira (9,86) e a faixa diz "sem setup"',
       [Math.round(Tz.takt * 100) / 100, Tz.setupDia, _taktFaixaHtml(_taktFaixa(Tz, {}), [], Tz).includes('>sem setup · digite o mesmo no app')], [9.86, 0, true]);
    const gPD = global.PONTOS_DIA, gCFG = global.CFG;
    global.PONTOS_DIA = { setupsDia:4, setupMin:8.2 }; global.CFG = { setupsDia:5, setupMin:6 };
    const a1 = _taktSetup();
    global.PONTOS_DIA = { setupsDia:null, setupMin:null }; const a2 = _taktSetup();
    global.CFG = { setupsDia:70, setupMin:8 }; const a3 = _taktSetup();    // 560 min não cabe na jornada
    global.CFG = { setupsDia:4 }; const a4 = _taktSetup();                // só um dos dois não vale
    global.SETUP_PEND = { a:3, b:9 }; const a5 = _taktSetup(); global.SETUP_PEND = null;
    global.PONTOS_DIA = gPD; global.CFG = gCFG;
    ok('a ordem: o recém-salvo (gravando); a CONFIG_PAINEL; sem ela, este computador; setup que não cabe na jornada ou só um campo → o padrão',
       [a5, a1, a2, a3.origem, a4.origem],
       [{ setupsDia:3, setupMin:9, origem:'enviando' }, { setupsDia:4, setupMin:8.2, origem:'planilha' }, { setupsDia:5, setupMin:6, origem:'computador' }, 'padrao', 'padrao']);
    const fx = o => _taktFaixaHtml(_taktFaixa(_taktMontar(S, HIST, Object.assign({}, HOJE, { setup:{ setupsDia:4, setupMin:8, origem:o } })), {}), [], T);
    ok('só neste computador fica dito na faixa (âmbar), e o recém-salvo diz que está gravando',
       [fx('computador').includes('<span class="tks-warn">só neste computador</span>'), fx('enviando').includes(' · gravando na planilha…')], [true, true]);
    ok('os campos do ⚙ no domínio do app: trocas INTEIRAS até 100, minutos com até UMA casa até 600 (zero à direita não conta); vazio null; o resto NaN, nunca 0',
       [_setupLer('4', 0, 100), _setupLer('4,0', 0, 100), _setupLer('8,2', 1, 600), _setupLer('8.20', 1, 600), _setupLer('0', 0, 100), _setupLer(' ', 0, 100),
        ...[_setupLer('4,3', 0, 100), _setupLer('7,65', 1, 600), _setupLer('101', 0, 100), _setupLer('600,1', 1, 600), _setupLer('abc', 0, 100), _setupLer('-1', 0, 100), _setupLer('8 min', 1, 600)].map(Number.isNaN)],
       [4, 4, 8.2, 8.2, 0, null, true, true, true, true, true, true, true]);
    ok('o que impede salvar diz o porquê (e os dois vazios não impedem: não muda)',
       [_setupErro(null, null), _setupErro(4, 8.2), _setupErro(4, null), _setupErro(NaN, 8), _setupErro(4, NaN), _setupErro(66, 8)],
       [null, null, 'preencha TROCAS/DIA e MIN/TROCA (os dois)', 'TROCAS/DIA é número inteiro, de 0 a 100 — o app de cronoanálise não aceita fração',
        'MIN/TROCA vai de 0 a 600, com até uma casa — o app de cronoanálise grava uma casa', 'o setup do dia (528 min) passa da jornada (527 min)']);
    ok('a ajuda do ⚙: o total por dia, o MESMO no app, de onde vale; gravando; não cabe; só um campo; fora do domínio',
       [_setupCfgTxt(4, 8.2, 'planilha'), _setupCfgTxt(4, 8.2, 'novo'), _setupCfgTxt(4, 8.2, 'computador'), _setupCfgTxt(4, 8.2, 'enviando'), _setupCfgTxt(8, 8, 'padrao'),
        _setupCfgTxt(70, 8, 'planilha'), _setupCfgTxt(4, null, 'planilha'), _setupCfgTxt(NaN, 8, 'planilha'), _setupCfgTxt(4, NaN, 'planilha')],
       ['32,8 min · o mesmo no app', '32,8 min · salve', '32,8 min · só neste PC', '32,8 min · gravando', '64 min · padrão', 'passa da jornada', 'os dois campos', 'trocas: número inteiro', 'min: até uma casa']);
    // O ENVIO: o que mudou; e, com a planilha sem a chave, o setup DESTE computador (o
    // digitado antes do re-deploy) — nunca o padrão (apagaria o de outro computador).
    const ab = (a, b, origem) => ({ a, b, origem });
    ok('o ⚙ manda o setup quando o gestor MUDOU o que viu, ou quando a planilha não tem a chave e o setup era deste computador; o padrão nunca é semeado',
       [_setupEnviar(4, 8.2, ab(8, 8, 'padrao'), 'planilha'), _setupEnviar(4, 8.2, ab(4, 8.2, 'planilha'), 'planilha'),
        _setupEnviar(8, 8, ab(8, 8, 'padrao'), 'sem-chave'), _setupEnviar(4, 8.2, ab(4, 8.2, 'computador'), 'sem-chave'),
        _setupEnviar(4, 8.2, ab(4, 8.2, 'computador'), 'antigo'), _setupEnviar(NaN, 8, ab(8, 8, 'padrao'), 'planilha'), _setupEnviar(null, null, ab(8, 8, 'padrao'), 'sem-chave'),
        _setupEnviar(4, 8.2, null, 'planilha')],
       [{ a:4, b:8.2 }, null, null, { a:4, b:8.2 }, null, null, null, null]);
    // O caso da revisão, do começo ao fim: digitado no ⚙ com o .gs antigo, re-deploy, abrir o ⚙ e SALVAR.
    const alertas = [], gAl = global.alert; global.alert = m => alertas.push(m);
    global.PONTOS_DIA = {}; global.CFG = { setupsDia:4, setupMin:8.2 };
    _setupDaConfig({ metaUep:2761 });                                   // .gs v5.60: sem o campo
    const f1 = [SETUP_PLAN, _taktSetup().origem];
    _setupDaConfig({ metaUep:2761, setupsDia:null, setupMin:null });    // .gs v5.61, planilha sem a chave
    const su0 = _taktSetup(), env = _setupEnviar(su0.setupsDia, su0.setupMin, ab(su0.setupsDia, su0.setupMin, su0.origem), SETUP_PLAN);
    global.SETUP_PEND = env;
    _setupResposta(env, { ok:true, painelConfig:{ setupsDia:4, setupMin:8.2 } });
    const f2 = [SETUP_PLAN, _taktSetup(), SETUP_PEND, alertas.length];
    global.SETUP_PEND = { a:5, b:6 };
    _setupResposta({ a:5, b:6 }, null);                                 // sem resposta: avisa, e o pendente sai
    const f3 = [SETUP_PEND, _taktSetup().origem, alertas.length, /não respondeu/.test(alertas[0] || '')];
    _setupResposta({ a:5, b:6 }, { ok:true, painelConfig:{ metaUep:2761 } });   // .gs antigo: vale neste computador, sem alerta
    const f4 = [SETUP_PLAN, alertas.length];
    global.alert = gAl; global.PONTOS_DIA = gPD; global.CFG = gCFG; global.SETUP_PLAN = null; global.SETUP_PEND = null;
    ok('o caso da revisão: digitado com o .gs antigo (só neste PC) → depois do re-deploy, o SALVAR sem mexer leva o setup à planilha, e a resposta confirma',
       [f1, env, f2], [['antigo', 'computador'], { a:4, b:8.2 }, ['planilha', { setupsDia:4, setupMin:8.2, origem:'planilha' }, null, 0]]);
    ok('sem resposta: avisa (o tempo esgotado não prova que não gravou) e deixa de dizer "gravando"; com o .gs antigo, sem alerta',
       [f3, f4], [[null, 'planilha', 1, true], ['antigo', 1]]);
    const sv = pega('function saveCfg('), env2 = pega('function enviarConfigPainel(');
    ok('o SALVAR para no setup que não vale ANTES de mudar qualquer coisa, e o envio passa a resposta da planilha ao _setupResposta',
       [sv.indexOf('_setupErro(') > 0 && sv.indexOf('_setupErro(') < sv.indexOf('CFG.empresa='), /_setupEnviar\([^;]*SETUP_PLAN\)/.test(sv), /PONTOS_DIA\.setupsDia=/.test(sv),
        /jsonpFetch\(url\)\.then\(function\(r\)\{ _setupResposta\(su, r\); \}, function\(\)\{ _setupResposta\(su, null\); \}\)/.test(env2),
        /setupsDia: \(json\.painelConfig\|\|\{\}\)\.setupsDia, setupMin: \(json\.painelConfig\|\|\{\}\)\.setupMin/.test(JS), /_setupDaConfig\(pc\);/.test(pega('function aplicarConfigPainel('))],
       [true, true, false, true, true, true]); }
  ok('o desenho da faixa não faz conta; a conta não lê tela nem servidor',
     [/\*|\/ *[A-Za-z_]+\./.test(pega('function _taktFaixaHtml(').replace(/\/\/[^\n]*/g, '').replace(/<\/?[a-z]+[^>]*>/gi, '')),
      /document\.|jsonpFetch|CFG\./.test(pega('function _taktFaixa(') + pega('function _tkaVolumes('))], [false, false]);
  // v7.232.0: o veredito primeiro; a faixa depois do gráfico, nas três telas
  ok('a ordem nas três telas: título → veredito → gráfico → FAIXA (NA LINHA E NO APP)',
     [HT.indexOf('class="tks-nl') > HT.indexOf('id="tks-g-box"') && HT.indexOf('tks-hero') < HT.indexOf('id="tks-g-box"'),
      (h => h.indexOf('class="tks-nl') > h.indexOf('<b>ONDE ESTÁ O EXCESSO</b>') && h.indexOf('tks-hero') < h.indexOf('<b>ONDE ESTÁ O EXCESSO</b>'))(_taktProxHtml(T1, P1, { largura:1200, V:_taktVeredito(T1, P1, RIT) })),
      (h => h.indexOf('class="tks-nl') > h.indexOf('<b>ONDE ESTÁ O EXCESSO</b>') && h.indexOf('<textarea') < h.indexOf('tks-hero'))(_tkaHtml(L42, M42, { botoes:'' }))],
     [true, true, true]); }

console.log('\n── v7.237.0: 4 SEMANAS (uma regra de saldo para as quatro, sempre em dias úteis; só o atraso passa adiante) ──');
['function _taktSemanas4Faixa(', 'function _taktSemanaDe(', 'function _taktSemanasMontar(', 'function _taktHeSugestao(', 'function _taktSemanasHtml('].forEach(f => eval.call(global, pega(f)));
['HE_SUG', 'FERIADO_SANTO_RE', 'FERIADO_CIVIL_RE', 'FERIADO_FECHADO_RE'].forEach(c => eval.call(global, pegaConst(c).replace(/^const (\w+)\s*=/, 'global.$1 =')));
['function _feriadoNorm(', 'function _feriadoSanto(', 'function _feriadoParaHE(', 'function _heSugJornada('].forEach(f => eval.call(global, pega(f)));
global.TKS4_AB = {};
global.p2 = global.p2 || (n => String(n).padStart(2, '0'));
ok('a faixa das semanas 3 e 4: da 3ª segunda (esta inclusa) ao domingo seguinte; 06/11 (sex) → 16–29/11; numa segunda, 09/11 → 23/11–06/12',
   [_taktSemanas4Faixa('06/11/2026'), _taktSemanas4Faixa('09/11/2026')], [{ de:'16/11/2026', ate:'29/11/2026' }, { de:'23/11/2026', ate:'06/12/2026' }]);
const F4 = { ok:true, de:'16/11/2026', ate:'29/11/2026', hoje:'06/11/2026', feriados:[{ data:'20/11/2026', desc:'CONSCIÊNCIA NEGRA' }], linhas:FX.F1629 };
const S3 = _taktSemanaDe(F4, 0), S4 = _taktSemanaDe(F4, 7);
ok('a faixa vira duas semanas no formato do getProgramacaoSemana (as linhas e o feriado de cada uma)',
   [S3.de, S3.ate, S3.linhas.length, S3.feriados.length, S4.de, S4.ate, S4.linhas.length, S4.feriados.length],
   ['16/11/2026', '22/11/2026', FX.F1629.length, 1, '23/11/2026', '29/11/2026', 0, 0]);
const hP = { num:20261106, meta:2761 };
const sem4 = Sx => { const Tx = _taktMontar(Sx, [], hP), Px = _taktProxMontar(Tx); return { T:Tx, P:Px, V:_taktVeredito(Tx, Px, RIT) }; };
const W1 = sem4(SP), W3 = sem4(S3), W4 = sem4(S4);
const C4 = _taktSemanasMontar([{ T }, { T:W1.T }, { T:W3.T }, { T:W4.T }], RIT);
ok('com todo dia útil programado, a 1ª semana dá o mesmo que a ESTA SEMANA e a 2ª o mesmo que a SEMANA QUE VEM (46h08 × 43h55, falta 2h13)',
   [C4.semanas[0].precisa, C4.semanas[0].tem, C4.semanas[1].precisa, C4.semanas[1].tem, C4.semanas[1].falta, _fmtHM(C4.semanas[1].falta)],
   [V0.precisaMin, V0.temMin, V1.precisaMin, V1.temMin, V1.faltaMin, '2h13']);
{ const s3 = C4.semanas[2], d19 = s3.dias.find(d => d.data === '19/11/2026');
  ok('dia útil SEM lote fica fora, precisa e tem (revisão: a folga dele apagava atraso): 16–22/11 só com 16, 17 e 18/11 programados = 3 × 8h47; 19/11 fora; 20/11 feriado; 23–29/11 sem lote = sem programação',
     [s3.tem, s3.precisa, s3.fora, s3.feriados, s3.fimConta, d19 && d19.fora, C4.semanas[3].vazia, C4.semanas[3].conta],
     [3 * 527, W3.V.precisaMin, ['19/11/2026'], ['20/11/2026'], '18/11/2026', 'vazio', true, false]); }
{ const s = C4.semanas, a1 = Math.max(0, s[0].precisa - s[0].tem), a2 = Math.max(0, a1 + s[1].precisa - s[1].tem), a3 = Math.max(0, a2 + s[2].precisa - s[2].tem);
  ok('o atraso passa adiante e a sobra só abate o que já existe; semana sem lote não mexe; a frase vai até o último dia PROGRAMADO (18/11 — 19/11 sem lote, 20/11 feriado, 22/11 domingo): 14h52',
     [s[0].atraso, s[1].atraso, s[2].atraso, s[3].atraso, C4.atraso, C4.fim, _fmtHM(C4.atraso)], [a1, a2, a3, a3, a3, '18/11/2026', '14h52']);
  const H = _taktSemanasHtml(C4, { botoes:'' });
  ok('rótulo da semana do 1º ao último dia útil (PPCP: "16-22/11 é domingo"), com o feriado e o dia sem lote ditos; nenhum rótulo termina no domingo',
     [s[1].ini, s[1].fim, s[2].ini, s[2].fim, s[3].fim, H.includes('16/11–19/11'), H.includes('20/11 feriado'), H.includes('19/11 sem programação — fora'), /–22\/11|–15\/11|–29\/11/.test(H), H.includes('<b>Hora extra até 18/11:</b> <b>14h52</b> ainda a programar'), H.includes('Dia útil sem programação fica fora (1 dia)'), H.includes('23/11, 24/11')],
     ['09/11/2026', '13/11/2026', '16/11/2026', '19/11/2026', '27/11/2026', true, true, true, false, true, true, false]); }
{ // o caso da revisão: a semana 4 só com o 23/11 programado — os outros 4 dias não viram folga
  const l = Object.assign({}, FX.F1629[0], { data:'23/11/2026', dataNum:20261123 });
  const S4b = Object.assign({}, S4, { linhas:[l] }), T4b = _taktMontar(S4b, [], hP);
  const Cb = _taktSemanasMontar([{ T }, { T:W1.T }, { T:W3.T }, { T:T4b }], RIT), s4 = Cb.semanas[3];
  ok('a semana 4 só com o 23/11 programado: tem 8h47 (não 43h55), 24–27/11 fora, e a frase não diz "em dia" (diria, com a jornada dos dias sem lote)',
     [s4.tem, s4.fora.length, Cb.fim, Cb.atraso > 0, Cb.atraso === Math.max(0, C4.atraso + s4.precisa - 527)], [527, 4, '23/11/2026', true, true]); }
{ // lote no sábado: hora extra, fora da conta (a regra da SEMANA QUE VEM) — e o dia a dia não pinta falta
  const sab = Object.assign({}, FX.F1629[0], { data:'14/11/2026', dataNum:20261114, qtde:400, saldo:400, uepCx:0.83, uep:332 });
  const Ts = _taktMontar(Object.assign({}, SP, { linhas:SP.linhas.concat([sab]) }), [], hP);
  const Cs = _taktSemanasMontar([{ T }, { T:Ts }], RIT), s1 = Cs.semanas[1], dS = s1.dias.find(d => d.data === '14/11/2026');
  const Hs = (global.TKS4_AB = { 1:true }, _taktSemanasHtml(Cs, { botoes:'' })); global.TKS4_AB = {};
  ok('lote no sábado 14/11 = hora extra JÁ programada (PPCP: "quando for para trabalhar aos sábados vai ter programação com a data de sábado"): fora do PRECISA (46h08, o mesmo da SEMANA QUE VEM), dito na frase, na linha e no dia, sem "falta" vermelha no dia',
     [s1.precisa, s1.he.length, s1.he[0].min, dS && dS.he, Hs.includes('14/11 1h03 em hora extra, fora') && Hs.includes('<b>1h03</b> já programada (14/11) · '), /14\/11 sáb · fim de semana · hora extra, fora da conta<\/td><td class="n mono">1h03<\/td><td class="n">—<\/td><td class="n">—<\/td>/.test(Hs)],
     [V1.precisaMin, 1, Math.round(332 * K), true, true, true]); }
{ // caixas sem UEP: ditas, nunca "sem programação"
  const su = SP.linhas.map(l => Object.assign({}, l, { uepCx:null, uep:null }));
  const Tu = _taktMontar(Object.assign({}, SP, { linhas:su }), [], hP);
  const Cu = _taktSemanasMontar([{ T }, { T:Tu }], RIT), s1 = Cu.semanas[1], Hu = _taktSemanasHtml(Cu, { botoes:'' });
  const meia = SP.linhas.map((l, i) => i % 2 ? Object.assign({}, l, { uepCx:null, uep:null }) : l);
  const Tm = _taktMontar(Object.assign({}, SP, { linhas:meia }), [], hP), Cm = _taktSemanasMontar([{ T }, { T:Tm }], RIT), Hm = _taktSemanasHtml(Cm, { botoes:'' });
  ok('semana só com caixas sem UEP: "N cx sem UEP no cadastro — sem conta" (nunca "sem programação datada"), não mexe no atraso; com parte sem UEP, a linha diz que a semana é mais pesada',
     [s1.semUep, s1.vazia, s1.atraso === Cu.semanas[0].atraso, Hu.includes(fmtN(Tu.cxSemUep) + ' cx sem UEP no cadastro — sem conta'), Hu.includes('sem programação datada'), Hm.includes(fmtN(Tm.cxSemUep) + ' cx sem UEP fora (a semana é mais pesada)')],
     [true, false, true, true, false, true]); }
{ // semana toda já adiantada (saldo 0): a linha está livre — a jornada abate o atraso
  const ad = SP.linhas.map(l => Object.assign({}, l, { saldo:0 }));
  const Ta = _taktMontar(Object.assign({}, SP, { linhas:ad }), [], hP), Ca = _taktSemanasMontar([{ T }, { T:Ta }], RIT), s1 = Ca.semanas[1];
  ok('semana toda adiantada: precisa 0, tem 43h55, e o atraso desta semana é abatido (não "sem programação")',
     [s1.conta, s1.precisa, s1.tem, s1.atraso, Ca.semanas[0].atraso > 0], [true, 0, 5 * 527, Math.max(0, Ca.semanas[0].atraso - 5 * 527), true]); }
{ const s = C4.semanas, r = x => x.V.ritmo.faltaMin + x.V.temMin;
  const b1 = Math.max(0, r({ V:V0 }) - V0.temMin), b2 = Math.max(0, b1 + r(W1) - W1.V.temMin), b3 = Math.max(0, b2 + Math.round(s[2].precisa / K * K * 2761 / RIT) - s[2].tem);
  ok('no ritmo atual: a mesma passagem em horas do relógio (o precisa ÷ ritmo; nas semanas 1 e 2, o do veredito de cada tela)',
     [s[0].atrasoR, s[1].atrasoR, Math.abs(s[2].atrasoR - b3) <= 1, s[3].atrasoR], [b1, b2, true, s[2].atrasoR]); }
const CL = _taktSemanasMontar([{ T }, { T:W1.T }, { est:'falha' }, { est:'falha' }], RIT);
ok('semana não lida: a linha diz, e o atraso daí em diante fica sem número (a frase diz "até onde foi lido"; o botão, "(parcial)")',
   [CL.completo, CL.semanas[2].est, CL.semanas[2].atraso, CL.semanas[3].atraso, CL.atraso === CL.semanas[1].atraso, _taktSemanasHtml(CL, {}).includes('(até onde foi lido)'), _taktSemanasHtml(CL, {}).includes('não consegui ler — ↻ ATUALIZAR'), _uepSubTakt(null, null, '4 semanas', CL).txt.endsWith('(parcial)')],
   [false, 'falha', null, null, true, true, true, true]);
ok('sem a esta semana montada: nada', _taktSemanasMontar([{ est:'lendo' }, { T:W1.T }], RIT), null);
{ const d = C4.semanas[1].dias;
  ok('o dia a dia da semana que vem: os dias úteis, a programação em horas de linha e a jornada; soma o precisa da semana',
     [d.length, d.every(x => x.tem === 527), Math.abs(d.reduce((a, x) => a + x.precisa, 0) - C4.semanas[1].precisa) <= d.length], [5, true, true]);
  const d0 = C4.semanas[0], somaTem = d0.dias.reduce((a, x) => a + x.tem, 0);
  const venc = T.dias.filter(x => x.passado).reduce((a, x) => a + x.saldoUep, 0);
  ok('o dia a dia desta semana: de hoje em diante, a jornada fecha com o "tem" da ESTA SEMANA; o vencido da semana é o saldo dos dias que passaram, numa linha à parte',
     [d0.dias[0].data.slice(0, 5), somaTem, d0.antes, d0.antes > 0], ['06/11', d0.tem, Math.round(venc * K), true]);
  // numa segunda-feira não há vencido da semana: nada de "0h01" de arredondamento (revisão)
  const Tseg = _taktMontar(SP, [], { num:20261109, meta:2761 }), Cseg = _taktSemanasMontar([{ T:Tseg }], RIT);
  global.TKS4_AB = { 0:true };
  ok('segunda-feira sem vencido: antes 0 e a linha "lotes desta semana já vencidos" não aparece',
     [Cseg.semanas[0].antes, _taktSemanasHtml(Cseg, { botoes:'' }).includes('já vencidos')], [0, false]);
  global.TKS4_AB = {}; }
{ global.TKS4_AB = {};
  const H = _taktSemanasHtml(C4, { botoes:'' });
  global.TKS4_AB = { 1:true };
  const Ha = _taktSemanasHtml(C4, { botoes:'' });
  ok('o desenho: a frase, uma linha por semana com ATRASO NO FIM, a regra; o dia a dia só da semana aberta; semana sem lote diz "sem programação datada"',
     [H.includes('class="tks-ler'), (H.match(/class="tks4-s"/g) || []).length, H.includes('<th class="n">ATRASO NO FIM</th>'), (H.match(/class="tks4-d"/g) || []).length,
      (Ha.match(/class="tks4-d"/g) || []).length, Ha.includes('09/11 seg'), H.includes('sem programação datada'), H.includes('onclick="_tks4Tog(1)"'), H.includes('▸ esta semana')],
     [true, 4, true, 0, 5, true, true, true, true]);
  ok('o desenho não faz conta: nada de veredito, montagem ou leitura dentro dele',
     /_taktVeredito\(|_taktMontar\(|_taktProxMontar\(|jsonpFetch|_taktLer\(|UEP_MIN_DIA/.test(pega('function _taktSemanasHtml(')), false);
  global.TKS4_AB = {}; }
{ const RR = pega('function renderUep(');
  ok('a ligação: 4 SEMANAS entre SEMANA QUE VEM e AVALIAR; o setter aceita 3 e pede as leituras na fila; cada semana pelo _taktMontar; o AVALIAR não muda; o botão da sub-aba',
     [/b\(1, 'SEMANA QUE VEM'\)\}\$\{b\(3, '4 SEMANAS'\)\}\$\{b\(2, 'AVALIAR PROGRAMAÇÃO'\)/.test(pega('function _taktSemBotoes(')), /k===3 \? k : 0/.test(pega('function _taktSemSet(')),
      /TKS_SEM===3\) _uepDepoisDe\(_uepLendo/.test(pega('function _taktSemSet(')),
      /C4=_taktSemanasDoPainel\(T, hojeN, meta, rit\)/.test(RR) && /_taktSemanasMontar\(\[\{ T \}, sem\(tkpOk \? TKP : null, e1\)/.test(pega('function _taktSemanasDoPainel(')) && /\{ T:_taktMontar\(Sx, UEP_HIST\|\|\[\], hP, pts, est\) \}/.test(pega('function _taktSemanasDoPainel(')),
      !/soPainel|o\.fim/.test(pega('function _tkaCorrente(')) && /TKS_SEM===2\) renderUep\(\)/.test(pega('function _tkaPainelCarregar(')),
      _uepSubTakt(null, null, '4 semanas', null).txt, _uepSubTakt(null, null, '4 semanas', { atraso:735, completo:true }), _uepSubTakt(null, null, '4 semanas', { atraso:0, completo:true }).txt],
     [true, true, true, true, true, '…', { txt:'4 semanas: 12h15 de hora extra a programar', cls:'warn' }, '4 semanas: sem hora extra a programar']);
  ok('sem laço de leitura: a semana que vem e a faixa só são pedidas com a fila livre e depois da espera (5 min; 1 min depois de falha), uma por vez; a faixa entra na fila da aba',
     [/if\(UEP_SUB==='takt' && !_uepLendo\(\) && !pausa\)\{[\s\S]*?if\(vP && \(!v4 \|\| TKP_TS<=TK4_TS\)\) _taktProxCarregar\(true\);\s*else if\(v4\) _taktSemanas4Carregar\(true\);/.test(RR),
      /TK4_VOO=null; TK4_TS=Date\.now\(\);/.test(pega('function _taktSemanas4Carregar(')), /TK4_VOO/.test(pega('function _uepLendo(')),
      /\(TKS_SEM===1 \|\| TKS_SEM===3\)\) renderUep\(\); \}, 60500\)/.test(pega('function _taktProxCarregar('))],
     [true, true, true, true]); }

console.log('\n── v7.238.0: o vencido do AVALIAR uma vez por código; a 🖨 4 SEMANAS ──');
eval.call(global, pega('function _tkaVencidoAntes('));
{ const P = [
    { dataNum:20261028, data:'28/10/2026', lote:'25300', codigo:'501.000.001', falta:100, uepCx:2 },   // dois lotes vencidos do mesmo código:
    { dataNum:20261030, data:'30/10/2026', lote:'25310', codigo:'501.000.001', falta:100, uepCx:2 },   // o falta é do CÓDIGO (100), nas duas linhas
    { dataNum:20261029, data:'29/10/2026', lote:'25320', codigo:'501000002', falta:80, uepCx:1 },      // esta semana já tem 30 dele até hoje
    { dataNum:20261029, data:'29/10/2026', lote:'25330', codigo:'501000003', falta:40, uepCx:1 },      // esta semana tem mais que o falta
    { dataNum:20261029, data:'29/10/2026', lote:'25340', codigo:'501000004', falta:50, uepCx:1, foraEsteira:true },
    { dataNum:20261103, data:'03/11/2026', lote:'25350', codigo:'501000005', falta:70, uepCx:1 } ];   // desta semana: fica com o TKS
  const W = [ { dataNum:20261103, codigo:'501000002', saldo:30 }, { dataNum:20261109, codigo:'501000002', saldo:999 },   // futura: não desconta
              { dataNum:20261104, codigo:'501000003', saldo:60 } ];
  const V = _tkaVencidoAntes(P, W, 20261102, 20261106), por = c => V.filter(l => String(l.codigo).replace(/\D/g, '') === c).reduce((a, l) => a + l.saldo, 0);
  ok('o vencido de antes desta segunda UMA vez por código (revisão: o falta do código somava em cada linha), menos o que esta semana já traz até hoje; as outras linhas vão com saldo 0 só para a colagem não duplicar o lote',
     [por('501000001'), V.find(l => l.lote === '25300').saldo, V.find(l => l.lote === '25310').saldo, por('501000002'), por('501000003'), por('501000004'), V.some(l => l.lote === '25350'), V.map(l => l.lote).sort()],
     [100, 100, 0, 50, 0, 0, false, ['25300', '25310', '25320', '25330', '25340']]);
  ok('o _tkaPainel usa a conta nova (nunca o falta do código em cada linha)',
     [/_tkaVencidoAntes\(PROG_DETALHADA, /.test(pega('function _tkaPainel(')), /saldo:Number\(it\.falta\)/.test(pega('function _tkaPainel('))], [true, false]); }
{ // o AVALIAR conta igual ao 4 SEMANAS (PPCP: "o intuito dessa tela é saber se vamos precisar de horas extras")
  const sab = Object.assign({}, SP.linhas[0], { data:'14/11/2026', dataNum:20261114, lote:'25999', qtde:400, saldo:400, uepCx:0.83, uep:332 });
  const Cs = _tkaCorrente(PAI.concat([sab]), L43.itens, OC), w1 = Cs.semanas.find(w => w.de === 20261109);
  ok('AVALIAR: lote no sábado = hora extra JÁ programada — fora do atraso (o mesmo de sem ele), dito na semana e na frase',
     [Cs.atraso, Cs.chegada, Cs.heMin, w1.heDias, /hora extra já programada: 14\/11 1h03 — fora do atraso/.test(_tkaSaldoHtml(Cs)), /Hora extra já programada \(sábado ou feriado\): <b>1h03<\/b>/.test(_tkaSaldoHtml(Cs))],
     [C43.atraso, C43.chegada, Math.round(332 * K), [{ n:20261114, min:Math.round(332 * K) }], true, true]);
  const adi = PAI.map(l => l.dataNum === 20261112 ? Object.assign({}, l, { saldo:0 }) : l);
  const Ca = _tkaCorrente(adi, L43.itens, OC), wa = Ca.semanas.find(w => w.de === 20261109);
  ok('AVALIAR: dia útil com lote já adiantado tem a jornada (a linha está livre; antes ficava fora como "sem programação")',
     [Ca.lacunas.includes(20261112), wa.tem, wa.precisa < sem[1].precisa], [false, 5 * 527, true]);
  const venc = Object.assign({}, SP.linhas[0], { data:'05/11/2026', dataNum:20261105, lote:'25998', saldo:100, uepCx:2, uep:200 });
  const Cv = _tkaCorrente([venc].concat(SP.linhas), L43.itens, Object.assign({}, OC, { hojeN:20261107, restMin:0 }));
  ok('AVALIAR: hoje sábado, o vencido continua atraso (nunca hora extra já programada)',
     [Cv.heMin, Cv.semanas[0].precisa, Cv.semanas[0].atraso > 0], [0, Math.round(200 * K), true]); }
{ // a SUGESTÃO de hora extra (PPCP: "já colocar a sugestão de trabalho extra se for o caso"; v7.241.0: sábado/feriado 05:00–11:00, dia útil no máximo 2h)
  const g = C4.sug, s = C4.semanas, A = g.A, B = g.B;
  // o que um plano põe em cada semana (sábado/feriado + dia útil)
  const hSem = (P, i) => P.ext.filter(x => x.i === i).reduce((a, x) => a + x.min, 0) + P.dias.filter(x => x.i === i).reduce((a, x) => a + x.min, 0);
  // refaz o encadeamento com o plano: o atraso fecha em zero e nenhuma semana recebe hora sem atraso para cobrir
  const encad = P => { let At = 0, sobra = 0; s.forEach(w => { if(!w.conta) return; const h = hSem(P, w.i); const a = At + w.precisa - w.tem; sobra += Math.max(0, h - Math.max(0, a)); At = Math.max(0, a - h); }); return [At, sobra]; };
  ok('a sugestão, sábado primeiro (PPCP: "sábado das 05 às 11:00"): sábados 07/11 e 14/11 das 05:00 às 11:00 e 21/11 das 05:00 às 07:52 fecham as 14h52 — o atraso fecha em zero, sem hora paga à toa; o feriado 20/11 é candidato, mas o sábado da mesma semana vem antes',
     [A.ext.map(x => [x.data, x.fer, fromMin(x.ini), fromMin(x.ini + x.min)]), A.dias.length, A.falta, encad(A), C4.semanas[2].ext.map(x => [x.data, x.fer])],
     [[['07/11/2026', false, '05:00', '11:00'], ['14/11/2026', false, '05:00', '11:00'], ['21/11/2026', false, '05:00', '07:52']], 0, 0, [0, 0], [['20/11/2026', true], ['21/11/2026', false]]]);
  ok('a outra forma, dia útil primeiro (PPCP: "deixa no máximo 2 horas dia"): 2h00 por dia em 09–13/11 e o resto (1h38 por dia, arredondado para cima) em 16–18/11 — nunca mais de 2h, o que vai para cada semana fecha em zero sem hora paga à toa (o por dia arredondado para cima cobre com menos de 1 min a mais por dia)',
     [B.dias.map(x => [x.i, x.min, x.n, x.porDia, x.de, x.ate]), B.ext.length, B.falta, encad(B), B.dias.every(x => x.min <= 120 * x.n)],
     [[[1, 600, 5, 120, '09/11/2026', '13/11/2026'], [2, 292, 3, 98, '16/11/2026', '18/11/2026']], 0, 0, [0, 0], true]);
  const H = _taktSemanasHtml(C4, { botoes:'' });
  ok('na tela: o dia e o horário, a 2ª forma em faixas de dia útil com o horário da madrugada; o dia sugerido na linha da semana',
     [H.includes('<b>Hora extra sugerida</b> (na média da linha): <b>sábado 07/11 das 05:00 às 11:00</b> · <b>sábado 14/11 das 05:00 às 11:00</b> · <b>sábado 21/11 das 05:00 às 07:52</b>.<br><b>Ou, mais em dia útil:</b> <b>2h00 por dia programado de 09/11 a 13/11</b> (5 dias, das 05:00 às 07:00) · <b>1h38 por dia programado de 16/11 a 18/11</b> (3 dias, das 05:22 às 07:00).</div>'),
      H.indexOf('tks4-sug') > H.indexOf('Hora extra até') && H.indexOf('tks4-sug') < H.indexOf('<table'), H.includes('sugestão: sábado 21/11 das 05:00 às 07:52'), H.includes('sugestão: sábado 14/11 das 05:00 às 11:00'),
      /CLT|não cabe|ainda faltam|Nem assim|≈/.test((H.match(/tks4-sug[^]*?<\/div>/) || [''])[0])],
     [true, true, true, true, false]);
  // revisão da v7.240.0: o atraso que CRESCE semana a semana — a taxa única largava a 1ª semana e o "ainda faltam" saía inflado
  const dts = [['09/11', '13/11'], ['16/11', '20/11'], ['23/11', '27/11'], ['30/11', '04/12']];
  const sem5 = (At, sab) => At.map((a, i) => ({ i, conta:true, atraso:a, ext:sab ? [{ data:'s' + i, dow:6, livre:360, ini:300 }] : [], nUtFut:5, uIniFut:dts[i][0], uFimFut:dts[i][1] }));
  const c1 = _taktHeSugestao(sem5([300, 900, 1500, 2100]), 3), c2 = _taktHeSugestao(sem5([500, 1500]), 1);
  const Hc1 = _taktSemanasHtml(Object.assign({}, C4, { sug:c1 }), {}), Hc2 = _taktSemanasHtml(Object.assign({}, C4, { sug:c2 }), {});
  ok('revisão (5h · 15h · 25h · 35h, sem sábado): 1h00 por dia em 09–13/11 e 2h00 de 16/11 a 04/12 fecham as 35h — nada falta (a v7.240.0 dizia "ainda faltam 5h00"); 8h20 · 25h: 1h40 e 2h00 por dia, faltam 6h40 (dizia 15h00)',
     [c1.A.dias.map(x => x.porDia), c1.A.falta, c2.A.dias.map(x => x.porDia), c2.A.falta,
      Hc1.includes('<b>Hora extra sugerida</b> (na média da linha): <b>1h00 por dia programado de 09/11 a 13/11</b> (5 dias, das 06:00 às 07:00) · <b>2h00 por dia programado de 16/11 a 04/12</b> (15 dias, das 05:00 às 07:00).</div>'),
      Hc2.includes('<br><b>Nem assim fecha:</b> faltam <b>6h40</b> — sábado e feriado só das 05:00 às 11:00 e dia útil no máximo 2h por dia.')],
     [[60, 120, 120, 120], 0, [100, 120], 400, true, true]);
  // as duas formas dão o MESMO total (o máximo possível), e nenhuma passa dos tetos nem paga hora à toa — sorteio
  let semente = 7; const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
  let viol = 0, difTot = 0, casosS = 0;
  for(let t = 0; t < 4000; t++){
    const nW = 1 + Math.floor(rnd() * 5), Ws = [];
    let at = 0;
    for(let i = 0; i < nW; i++){ at = Math.max(0, at + Math.floor(rnd() * 1400) - 500); const ex = []; const ns = Math.floor(rnd() * 3);
      for(let k = 0; k < ns; k++) ex.push({ data:'x' + i + k, dow:k ? 5 : 6, fer:!!k, livre:Math.floor(rnd() * 361), ini:300 });
      Ws.push({ i, conta:true, atraso:at, ext:ex, nUtFut:Math.floor(rnd() * 6), uIniFut:'a' + i, uFimFut:'b' + i }); }
    const G = _taktHeSugestao(Ws, nW - 1); if(!G) continue; casosS++;
    [G.A, G.B].forEach(P => {
      let Pc = 0; Ws.forEach(w => { Pc += hSem(P, w.i); if(Pc > w.atraso) viol++; });
      if(Pc + P.falta !== G.total) viol++;
      P.dias.forEach(x => { if(x.min > 120 * x.n || x.porDia > 120 || x.porDia < 1 || x.porDia * x.n < x.min || x.porDia * x.n - x.min >= x.n) viol++; });
      P.ext.forEach(x => { const o = Ws[x.i].ext.find(e => e.data === x.data); if(!o || x.min > o.livre) viol++; });
    });
    if(G.A.falta !== G.B.falta) difTot++;
  }
  ok('sorteio de 4.000 casos: nenhuma semana recebe hora sem atraso para cobrir, dia útil nunca passa de 2h nem sai 0h00 (o por dia para cima: cobre a semana com menos de 1 min a mais por dia), sábado/feriado nunca passa do livre, o total + a falta fecham, e as duas formas dão a mesma falta',
     [casosS > 1000, viol, difTot], [true, 0, 0]);
  const cb = _taktHeSugestao([{ i:0, conta:true, atraso:362, ext:[{ data:'14/11', dow:6, livre:360, ini:300 }], nUtFut:5, uIniFut:'09/11', uFimFut:'13/11' }], 0);
  const Hcb = _taktSemanasHtml(Object.assign({}, C4, { sug:cb }), {});
  ok('revisão: 2 min de dia útil em 5 dias não vira "0h00 por dia" (das 07:00 às 07:00): sobe para 0h01 por dia',
     [cb.A.dias.map(x => [x.min, x.porDia]), Hcb.includes('0h00 por dia'), Hcb.includes('<b>0h01 por dia programado de 09/11 a 13/11</b> (5 dias, das 06:59 às 07:00)')], [[[2, 1]], false, true]);
  global.CFG = { turnoInicio:'06:00', turnoFim:'16:00' };
  const sgT = m => ({ total:m * 3, A:{ ext:[], dias:[{ i:1, min:m * 3, n:3, de:'16/11', ate:'18/11', porDia:m }], falta:0 }, B:{ ext:[], dias:[{ i:1, min:m * 3, n:3, de:'16/11', ate:'18/11', porDia:m }], falta:0 } });
  const Hj = _taktSemanasHtml(Object.assign({}, C4, { sug:sgT(120) }), {}), Hj1 = _taktSemanasHtml(Object.assign({}, C4, { sug:sgT(50) }), {}); delete global.CFG;
  ok('a jornada vem do turno do ⚙ (06:00–16:00 → 50 min das 05:10 às 06:00; 2h das 05:00 às 06:00 e das 16:00 às 17:00); sem ⚙, 07:00–17:00',
     [Hj1.includes('<b>0h50 por dia programado de 16/11 a 18/11</b> (3 dias, das 05:10 às 06:00)'), Hj.includes('<b>2h00 por dia programado de 16/11 a 18/11</b> (3 dias, das 05:00 às 06:00 e das 16:00 às 17:00)'), _heSugJornada()],
     [true, true, { jIni:420, jFim:1020 }]);
  // feriado religioso fica fora: o 20/11 como SEXTA-FEIRA SANTA → o sábado 21/11 cobre
  const W3s = sem4(Object.assign({}, S3, { feriados:[{ data:'20/11/2026', desc:'Sexta-feira Santa' }] }));
  const C4s = _taktSemanasMontar([{ T }, { T:W1.T }, { T:W3s.T }, { T:W4.T }], RIT);
  ok('feriado SANTO não é candidato (PPCP: "só feriado santo que não pode"): o 20/11 como Sexta-feira Santa sai da semana; a sugestão continua com o sábado 21/11',
     [C4s.semanas[2].ext.map(x => x.data), C4s.sug.A.ext.map(x => [x.data, fromMin(x.ini), fromMin(x.ini + x.min)]).pop(), C4s.atraso],
     [['21/11/2026'], ['21/11/2026', '05:00', '07:52'], C4.atraso]);
  ok('quais feriados são religiosos (pela DESCRICAO da aba FERIADOS, sem acento e sem caixa): santa, paixão, corpus, natal, aparecida, finados, reis, sto, bom jesus, conceição… sim; consciência negra, tiradentes, trabalho, república, a DATA MAGNA DE SÃO PAULO (civil, com santo no nome), natalício… não',
     ['SEXTA-FEIRA SANTA', 'Paixão de Cristo', 'Corpus Christi', 'NATAL', 'N. Sra. Aparecida', 'FINADOS', 'Dia de Reis', 'Nossa Senhora da Conceição', 'STO ANTONIO', 'BOM JESUS', 'N.S. DA CONCEICAO', 'CRISTO REI',
      'CONSCIÊNCIA NEGRA', 'TIRADENTES', 'Dia do Trabalho', 'PROCLAMAÇÃO DA REPÚBLICA', 'CONFRATERNIZAÇÃO UNIVERSAL', 'DATA MAGNA DE SÃO PAULO', 'NATALÍCIO', 'ANIVERSÁRIO DA CIDADE'].map(_feriadoSanto),
     [true, true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false, false, false, false]);
  ok('revisão: a aba FERIADOS também guarda o que não é feriado trabalhável — férias coletivas, parada de fábrica, recesso, ponte e a linha sem descrição ("FERIADO") ficam fora da sugestão, na dúvida',
     ['FÉRIAS COLETIVAS', 'PARADA DE FÁBRICA', 'RECESSO', 'PONTE', '', 'FERIADO', 'Fábrica fechada', 'INVENTÁRIO', 'BALANÇO', 'MANUTENÇÃO GERAL', 'FERIADO MUNICIPAL', 'Feriado Nacional', 'NOSSA SRA.', 'DIA DE N. SENHORA',
      'CONSCIÊNCIA NEGRA', 'TIRADENTES', 'DATA MAGNA DE SÃO PAULO', 'SEXTA-FEIRA SANTA'].map(_feriadoParaHE),
     [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, false]);
  // revisão: o filtro do _taktSemanasMontar usa essa regra (não só o _feriadoSanto) — o 20/11 como FÉRIAS COLETIVAS sai da semana
  const W3f = sem4(Object.assign({}, S3, { feriados:[{ data:'20/11/2026', desc:'FÉRIAS COLETIVAS' }] }));
  ok('revisão: FÉRIAS COLETIVAS num dia útil não vira candidato no _taktSemanasMontar (só o sábado 21/11 fica)',
     _taktSemanasMontar([{ T }, { T:W1.T }, { T:W3f.T }, { T:W4.T }], RIT).semanas[2].ext.map(x => x.data), ['21/11/2026']);
  // revisão: sábado que é feriado civil (01/05/2027, 20/11/2027 caem no sábado) é feriado: entra depois do sábado comum e diz "(feriado)"
  const T3sf = JSON.parse(JSON.stringify(W3.T)); T3sf.dias.find(d => d.data === '21/11/2026').feriado = 'CONSCIÊNCIA NEGRA';
  const x21 = _taktSemanasMontar([{ T }, { T:W1.T }, { T:T3sf }, { T:W4.T }], RIT).semanas[2].ext.find(x => x.data === '21/11/2026');
  const pl21 = { ext:[Object.assign({}, x21, { i:2, min:60 })], dias:[], falta:0 };
  ok('revisão: sábado que é feriado conta como feriado (fer) e a tela diz "sábado 21/11 (feriado)"',
     [x21.fer, _taktSemanasHtml(Object.assign({}, C4, { sug:{ total:60, A:pl21, B:pl21 } }), {}).includes('<b>sábado 21/11 (feriado) das 05:00 às 06:00</b>')], [true, true]);
  // revisão: o sábado ou feriado de HOJE não entra (a jornada de hoje já é o "tem")
  const T1h = JSON.parse(JSON.stringify(W1.T)); T1h.dias.find(d => d.data === '14/11/2026').hoje = true;
  ok('revisão: o sábado de hoje não é candidato', _taktSemanasMontar([{ T }, { T:T1h }, { T:W3.T }, { T:W4.T }], RIT).semanas[1].ext.length, 0);
  // sábado que já tem lote: o lote ocupa o começo da janela (05:00) e a sugestão começa depois dele
  const T1l = JSON.parse(JSON.stringify(W1.T)), d14 = T1l.dias.find(d => d.data === '14/11/2026'); d14.saldoUep = 100; d14.uep = 100; d14.cx = 50;
  const jaL = Math.round(100 * 527 / T1l.meta), C4l = _taktSemanasMontar([{ T }, { T:T1l }, { T:W3.T }, { T:W4.T }], RIT), x14 = C4l.semanas[1].ext[0];
  ok('sábado com lote (hora extra já programada): livre = 6h − o lote, e a sugestão começa às 05:00 + o lote',
     [x14.data, x14.livre, fromMin(x14.ini), C4l.semanas[1].he.map(h => h.min)], ['14/11/2026', 360 - jaL, fromMin(300 + jaL), [jaL]]);
  // a folga do meio já paga o atraso de antes: nada vai para as semanas até a que fechou em dia
  const F = [{ i:0, conta:true, atraso:300, ext:[{ data:'07/11', livre:527, ini:300 }], nUtFut:4, uIniFut:'02/11', uFimFut:'06/11' }, { i:1, conta:true, atraso:0, ext:[{ data:'14/11', livre:527, ini:300 }], nUtFut:5, uIniFut:'09/11', uFimFut:'13/11' },
             { i:2, conta:true, atraso:200, ext:[{ data:'21/11', livre:100, ini:300 }], nUtFut:4, uIniFut:'16/11', uFimFut:'19/11' }, { i:3, conta:true, atraso:260, ext:[{ data:'28/11', livre:527, ini:300 }], nUtFut:5, uIniFut:'23/11', uFimFut:'27/11' }];
  const gF = _taktHeSugestao(F, 3);
  ok('com uma semana em dia no meio, nada vai para antes dela (pagaria hora sem atraso no fim); sábado com lote só oferece o que tem livre; dia útil primeiro: 50 min e 12 min por dia; sem atraso, nada',
     [gF.A.ext.map(x => [x.data, x.min]), gF.A.dias.length, gF.B.dias.map(x => [x.i, x.min, x.porDia]), gF.B.ext.length, _taktHeSugestao(F.map(x => Object.assign({}, x, { atraso:0 })), 3)],
     [[['21/11', 100], ['28/11', 160]], 0, [[2, 200, 50], [3, 60, 12]], 0, null]);
  // revisão: o atraso que DESCE sem zerar (uma semana com sobra no meio) — a hora posta antes dela não pode passar do menor atraso até o fim
  const cad = (At, livre) => At.map((a, i) => ({ i, conta:true, atraso:a, ext:[{ data:'s' + i, livre:livre || 527, ini:300 }], nUtFut:5, uIniFut:'d' + i, uFimFut:'e' + i }));
  const fecha = (F2, P) => { let H2 = 0, neg = false; F2.forEach(w => { H2 += hSem(P, w.i); if(w.atraso - H2 < 0) neg = true; }); return [F2[F2.length - 1].atraso - H2, neg]; };
  const casos = [[600, 120, 420], [540, 100, 300, 400], [400, 300, 600], [300, 500, 200, 450]].map(At => { const F2 = cad(At), g2 = _taktHeSugestao(F2, At.length - 1); return [g2.A.ext.map(x => [x.i, x.min]), fecha(F2, g2.A), fecha(F2, g2.B), g2.A.falta]; });
  ok('revisão: com uma semana que desce no meio (10h · 2h · 7h; 9h · 1h40 · 5h · 6h40; 6h40 · 5h · 10h; 5h · 8h20 · 3h20 · 7h30), as duas formas fecham o atraso em zero sem nenhuma semana negativa (nada pago à toa)',
     casos.map(c => [c[1], c[2], c[3]]),
     [[[0, false], [0, false], 0], [[0, false], [0, false], 0], [[0, false], [0, false], 0], [[0, false], [0, false], 0]]);
  ok('revisão: 10h · 2h · 7h → 2h no 1º sábado e 5h no 3º (era 7h no 1º, sobravam 5h)', casos[0][0], [[0, 120], [2, 300]]);
  const sem = F.map(x => Object.assign({}, x, { ext:[] })), gs = _taktHeSugestao(sem, 3), Hs = _taktSemanasHtml(Object.assign({}, C4, { sug:gs }), {});
  ok('sem sábado nem feriado livre: as duas formas são a mesma (dia útil) e a tela mostra uma linha só',
     [gs.A.ext.length, JSON.stringify(gs.A) === JSON.stringify(gs.B), Hs.includes('<b>Hora extra sugerida</b> (na média da linha): <b>0h50 por dia programado de 16/11 a 19/11</b> (4 dias, das 06:10 às 07:00) · <b>0h12 por dia programado de 23/11 a 27/11</b> (5 dias, das 06:48 às 07:00).</div>'), Hs.includes('Ou, mais')],
     [0, true, true, false]);
  ok('dois dias na mesma semana: o sábado enche primeiro (feriado trabalhado custa mais), o feriado só com o que falta; os dois somam até o menor atraso até o fim (nunca mais); na tela, a ordem da data',
     _taktHeSugestao([{ i:0, conta:true, atraso:500, ext:[{ data:'20/11', livre:360, ini:300, fer:true }, { data:'21/11', livre:360, ini:300 }], nUtFut:3 }], 0).A.ext.map(x => [x.data, x.fer, x.min]),
     [['20/11', true, 140], ['21/11', false, 360]]); }
{ global.TKS4_AB = {};
  const HP = _taktSemanasHtml(C4, { papel:true }), HT2 = _taktSemanasHtml(C4, { botoes:'' }), G4 = pega('async function gerarRelatorio4Semanas(');
  ok('🖨 4 SEMANAS no papel: o mesmo desenho, sem botão nem toque, o dia a dia de TODAS as semanas aberto',
     [HP.includes('onclick='), HP.includes('↻'), HP.includes('Toque'), HP.includes('▸'), (HP.match(/class="tks4-d"/g) || []).length, (HT2.match(/class="tks4-d"/g) || []).length, HP.includes('<b>Hora extra até 18/11:</b> <b>14h52</b> ainda a programar')],
     [false, false, false, false, C4.semanas.reduce((a, x) => a + x.dias.length + (x.antes > 0 ? 1 : 0), 0), 0, true]);
  const HPL = _taktSemanasHtml(CL, { papel:true }), HV = _taktSemanasHtml(C4, { botoes:'' });
  const rowV = (HV.match(/<tr[^>]*><td>[^<]*23\/11–27\/11/) || [''])[0];
  ok('revisão: no papel a semana não lida diz "não lida", sem ↻; semana sem programação não tem ▸ nem toque (não há o que abrir)',
     [HPL.includes('↻'), HPL.includes('não lida (a leitura da programação falhou)'), rowV.includes('onclick'), rowV.includes('▸'), C4.semanas[3].dias.length],
     [false, true, false, false, 0]);
  ok('revisão: a 🖨 espera a fila da aba antes de ler; o AVALIAR só usa o vencido da programação detalhada DE HOJE (e lê de novo se for de outro dia)',
     [/if\(_uepLendo\(\)\)\{ msg\('Esperando a outra leitura terminar…'\); await new Promise\(ok=>_uepDepoisDe\(_uepLendo, ok\)\); \}/.test(G4),
      /if\(_progDetHoje\(\)\) lin\.push\(\.\.\._tkaVencidoAntes\(/.test(pega('function _tkaPainel(')), /if\(!_progDetHoje\(\)\) await carregarProgramacaoDetalhada\(\);/.test(pega('function _tkaPainelCarregar('))],
     [true, true, true]);
  ok('🖨 a janela abre no clique, lê o que faltar (histórico, esta semana, a que vem, a faixa) e monta pela MESMA montagem da tela; no menu 🖨 IMPRIMIR ▾',
     [G4.indexOf('window.open(') < G4.indexOf('await '), /await _taktProxCarregar\(true\)/.test(G4) && /await _taktSemanas4Carregar\(true\)/.test(G4),
      /_taktSemanasDoPainel\(T0, hojeN, D\.meta, /.test(G4), /_taktSemanasHtml\(C, \{ papel:true \}\)/.test(G4), /_TKS4_DOC_SKIN/.test(G4),
      /onclick="_uepImpFecha\(\);gerarRelatorio4Semanas\(\)"/.test(html)],
     [true, true, true, true, true, true]); }
// AS LEITURAS DE VERDADE (revisão: o regex acima passava com a retentativa sem fim).
// O bloco 4 SEMANAS do renderUep REAL, com relógio virtual, leituras de mentira de
// 25 s e o refresh do gerencial (renderUep a cada 5 min), por 60 min.
async function simLeituras(cenario){
  const RU = pega('function renderUep('), BLOCO = RU.slice(RU.indexOf('  let C4=null;'), RU.indexOf('  // v7.198.0'));
  ['function _taktSemanas4Carregar(', 'function _taktProxCarregar(', 'async function _taktLer(', 'function _uepLendo(', 'function _uepDepoisDe(', 'function _taktSemSet(', 'function _taktSemanasDoPainel('].forEach(f => eval.call(global, pega(f)));
  let VT = Date.UTC(2026, 10, 13, 12, 0, 0), fila = [], seq = 0, noAr = 0, emVoo = 0, maxVoo = 0;
  const conta = { prox:0, faixa:0 }, nowOrig = Date.now, stOrig = global.setTimeout;
  Date.now = () => VT;
  global.setTimeout = (fn, ms) => { fila.push({ t:VT + (ms || 0), s:seq++, fn }); return seq; };
  global.CFG = Object.assign({}, global.CFG, { sheetsUrl:'https://x/exec' });
  global._modoDir = () => false;
  global.jsonpFetch = url => new Promise((res, rej) => {
    const de = decodeURIComponent((url.match(/[?&]de=([^&]*)/) || [])[1] || ''), tipo = de === '16/11/2026' ? 'prox' : 'faixa';
    conta[tipo]++; emVoo++; maxVoo = Math.max(maxVoo, emVoo); const t0 = VT;
    global.setTimeout(() => { emVoo--; noAr += VT - t0;
      const falha = cenario === 'tudo-falha' || (cenario === 'faixa-falha' && tipo === 'faixa') || (cenario === 'prox-falha' && tipo === 'prox');
      if(falha) rej(new Error('Timeout')); else res({ ok:true, de, ate:tipo === 'prox' ? '22/11/2026' : '06/12/2026', hoje:'13/11/2026', linhas:[], feriados:[] });
    }, 25000);
  });
  Object.assign(global, { UEP_CARREGANDO:false, UEP_HIST_VOO:null, UEP_PAD_VOO:null, GPX_CARREGANDO:false, PROG_DET_VOO:null, TKS_VOO:null, _pontosVoo:null,
    TKP:null, TKP_TS:0, TKP_VOO:null, TKP_FALHA:null, TKP_ERRO:'', TK4:null, TK4_TS:0, TK4_VOO:null, TK4_FALHA:null, TK4_ERRO:'', TKS4_FAL:0,
    TKS_SEM:3, UEP_SUB:'takt', TKS_TTL:300000, UEP_HIST:[], _abaOn:t => t === 'uep', hojeStr:() => '13/11/2026', _efEmb:() => 85, _pdiaPcCat:() => null });
  const T0 = _taktMontar(Object.assign({}, SP, { hoje:'13/11/2026' }), [], { num:20261113, meta:2761, restMin:200 });
  let ult = null;
  global.renderUep = function(){ const T = T0, hojeN = 20261113, meta = 2761, rit = RIT, tksBt = ''; let bT = ''; ult = eval(BLOCO + ';C4'); };
  global._taktSemSet(3);
  (function ref(){ global.setTimeout(() => { global.renderUep(); ref(); }, 300000); })();
  const fim = VT + 60 * 60000;
  while(fila.length){
    fila.sort((a, b) => a.t - b.t || a.s - b.s); const f = fila.shift(); if(f.t > fim) break; VT = f.t; f.fn();
    for(let k = 0; k < 20; k++) await new Promise(r => setImmediate(r));
  }
  Date.now = nowOrig; global.setTimeout = stOrig;
  return { ocup:noAr / 3600000 * 100, maxVoo, conta, est:ult ? ult.semanas.map(x => x.est || 'ok').join(',') : '' };
}
(async () => {
  const tf = await simLeituras('tudo-falha'), ff = await simLeituras('faixa-falha'), pf = await simLeituras('prox-falha'), bom = await simLeituras('ok');
  ok('as leituras de verdade, 60 min com o Apps Script de 25 s: uma por vez sempre; com tudo falhando, ocupado no máximo 25% do tempo (eram 94%) e as duas tentadas; só a faixa falhando, no máximo 35% (eram 60%); só a semana que vem falhando, a faixa é lida mesmo assim (revisão: ficava "lendo…" sem leitura); tudo ok: as 4 semanas lidas',
     [tf.maxVoo, ff.maxVoo, pf.maxVoo, bom.maxVoo, tf.ocup <= 25, tf.conta.faixa >= 1, ff.ocup <= 35, pf.est, pf.ocup <= 35, bom.est, bom.conta.prox >= 1 && bom.conta.faixa >= 1],
     [1, 1, 1, 1, true, true, true, 'ok,falha,ok,ok', true, 'ok,ok,ok,ok', true]);
  console.log(falhas ? '\n❌ ' + falhas + ' falha(s)' : '\n✅ takt da semana ok — o veredito em horas de linha, o porquê dia a dia, o agora em caixas');
  process.exit(falhas ? 1 : 0);
})();
