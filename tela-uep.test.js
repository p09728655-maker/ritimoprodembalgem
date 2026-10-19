// Teste das TELAS F e G da TV — a UEP do dia (v7.138.0).
//   node tela-uep.test.js
//
// Roda contra o código REAL do ritmoprod_embalagem_v7.html (contas e desenho)
// e confere a config do ritmoprod_appscript.gs. O caso-base é o retrato de
// 16/10/2026 às 15:02, com os números da planilha de produção: 2.270,9 UEP
// feitas, 408 min de jornada com lançamento, meta 2.530.

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const gs   = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');
const JS = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function pegaJs(assinatura) {
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
function pegaGs(assinatura) {
  const i = gs.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei no .gs: ' + assinatura);
  return gs.slice(i, gs.indexOf('\n}\n', i) + 2);
}

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}
const r1 = v => Math.round(v * 10) / 10;

global.window = global;
require('vm').runInThisContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'));
for (const c of ['TV_UEP_PESO_DIAS', 'TV_UEP_PESO_MIN']) {
  const m = JS.match(new RegExp('const ' + c + '\\s*=\\s*(\\d+);'));
  if (!m) throw new Error(c + ' sumiu do painel');
  global[c] = Number(m[1]);
}
['function _rpEsc(', 'function _cartNum(', 'function _qpRealDia(', 'function _uepAbaHoras(',
 'function _tvF2(', 'function _tvMinTxt(', 'function _tvUepDoProduto(', 'function _tvUepPesoNormal(',
 'function _tvUepMontar(', 'function _tvUepRodHtml(', 'function _tvFHtml(', 'function _tvGSvg(',
 'function _tvGHtml('].forEach(f => eval.call(global, pegaJs(f)));

// ── o retrato de 16/10/2026, 15:02 ────────────────────────────────────────────
const SLOTS = [['07:00', 60], ['08:00', 60], ['09:00', 60], ['10:00', 60], ['12:12', 48],
               ['13:00', 60], ['14:00', 60], ['15:00', 60], ['16:00', 59]]
  .map(([inicio, min]) => ({ inicio, label: inicio, min }));
const UEP_H = { '07:00': 293.6, '08:00': 226.8, '09:00': 318.3, '10:00': 314.1, '12:12': 243.1,
                '13:00': 500.9, '14:00': 374.1 };
const CX_H  = { '07:00': 157, '08:00': 125, '09:00': 199, '10:00': 219, '12:12': 130, '13:00': 338, '14:00': 315 };
function montarD(agoraMin, uepH, cxH, extra) {
  const allHoje = Object.keys(cxH).map(h => ({ horario: h, producaoHora: cxH[h] }));
  const uh = {}; Object.keys(uepH).forEach(h => { uh[h] = { uep: uepH[h], cxSem: 0 }; });
  const horas = _uepAbaHoras(SLOTS, allHoje, uh, 2530, agoraMin);
  const minNorm = SLOTS.reduce((s, sl) => s + (cxH[sl.inicio] != null ? minSlotDecorrido(sl.inicio, sl.min, agoraMin) : 0), 0);
  const feito = Object.values(uepH).reduce((s, v) => s + v, 0);
  const card = uepCard({ normal: feito, he: 0, cxCom: 1, cxSem: 0, codigos: 429 }, 2530, minNorm);
  return Object.assign({ estado: 'ok', k: { minNorm, slots: SLOTS, realNormal: Object.values(cxH).reduce((s, v) => s + v, 0) },
                         horas, meta: card.meta, feito, he: 0, card }, extra || {});
}
const CAT = [{ codigo: '501.140.001', uep: 1.04 }, { codigo: '501.149.001', uep: 1 }];
const PROD = { cod: '501140001', desc: 'VOL 1/1 BANQUETA VERSATIL', cor: 'BRANCO' };
const D = montarD(902, UEP_H, CX_H);
const M = _tvUepMontar(D, { agoraMin: 902, prod: PROD, cat: CAT, phm: [], pesoNormal: 1.85, baseNome: 'MESA CABECEIRA MADERO' });

console.log('\n── a conta das Telas F e G sai da montagem da aba UEP ──');
ok('feito e esperado são os do card (2.270,9 de 1.958,7)', [r1(M.feito), r1(M.esp)], [2270.9, 1958.7]);
ok('à frente: +312 UEP = 65 min de linha no ritmo da meta', [Math.round(M.difUep), Math.round(M.difMin)], [312, 65]);
ok('falta 259 UEP = 250 caixas de BANQUETA (1,04) — arredonda PARA CIMA', [Math.round(M.falta), M.faltaCx], [259, 250]);
ok('no ritmo da meta chega às 15:56', fromMin(Math.ceil(M.chega)), '15:56');
ok('"VOL 1/1" sai do nome na TV; a cor vem pelo nomeComCor do núcleo', M.prod.rot, 'BANQUETA VERSATIL · BRANCO');
ok('peso da caixa de hoje = UEP de jornada ÷ caixas de jornada (1,53)', _tvF2(M.peso), '1,53');
ok('jornada 07:00–16:59 e o almoço como buraco (11:00–12:12)', [fromMin(M.ini), fromMin(M.fim), M.gaps], ['07:00', '16:59', [{ de: 660, ate: 732 }]]);
ok('a curva fecha no ponto de agora com o número do card',
   [M.pts[M.pts.length - 1].t, r1(M.pts[M.pts.length - 1].f), r1(M.pts[M.pts.length - 1].e)], [902, 2270.9, 1958.7]);
ok('o almoço fica PLANO na curva (sem subir entre 11:00 e 12:12)',
   M.pts.filter(p => p.t === 660 || p.t === 732).map(p => [r1(p.f), r1(p.e)]), [[1152.8, 1152.2], [1152.8, 1152.2]]);
ok('o esperado anda pela régua do card: hora sem lançamento não conta (15:00 só a partir de agora)',
   r1(M.espFut[M.espFut.length - 1].v), r1(1958.67 + 117 * 2530 / 527));
ok('hora em andamento e hora futura vêm marcadas, sem veredito',
   M.horas.filter(h => h.andamento || h.futuro).map(h => [h.rot, h.andamento, h.futuro, h.cls]),
   [['15:00', true, false, ''], ['16:00', false, true, '']]);

console.log('\n── quando a tela NÃO entra ──');
ok('sem UEP (estado != ok) → null', _tvUepMontar({ estado: 'sem-cadastro' }, { agoraMin: 902 }), null);
ok('nenhuma hora de jornada lançada → null (05:00 de HE, turno nem começou)',
   _tvUepMontar(montarD(400, {}, {}), { agoraMin: 400 }), null);

console.log('\n── os outros desfechos da corrida ──');
const tarde = montarD(990, { '07:00': 100, '08:00': 100 }, { '07:00': 60, '08:00': 60 });
const Mt = _tvUepMontar(tarde, { agoraMin: 990, prod: PROD, cat: CAT });
ok('não chega na jornada: sem hora, com o ritmo que faltaria', [Mt.chega, Math.round(Mt.precisaH), Mt.minRest],
   [null, Math.round((2530 - 200) / 29 * 60), 29]);
const fimDia = _tvUepMontar(montarD(1030, { '07:00': 100 }, { '07:00': 60 }), { agoraMin: 1030 });
ok('jornada encerrada: nada resta, nada a projetar', [fimDia.minRest, fimDia.chega, fimDia.precisaH, fimDia.agora], [0, null, null, 1019]);
const batida = _tvUepMontar(montarD(960, Object.assign({}, UEP_H, { '15:00': 400 }), Object.assign({}, CX_H, { '15:00': 300 })), { agoraMin: 960 });
ok('meta batida: falta 0 e nenhuma projeção', [batida.falta, batida.proj, batida.faltaCx], [0, null, null]);

console.log('\n── UEP do produto de agora ──');
ok('o cadastro manda (código com ou sem pontos)', _tvUepDoProduto('501140001', '', '', CAT, []), 1.04);
const PHM = [{ modelo: '501130', nome: 'MESA CENTRO LUNA 590', cor: 'OFF WHITE', caixas: 100, uep: 100 },
             { modelo: '501130', nome: 'MESA LATERAL LUNA 440', cor: 'OFF WHITE', caixas: 10, uep: 33.3 }];
ok('sem cadastro: média de hoje do MESMO produto e cor (o 501130 tem quatro mesas)',
   _tvUepDoProduto('501130005', 'VOL 1/1 MESA CENTRO LUNA 590', 'OFF WHITE', null, PHM), 1);
ok('nada achado → null, nunca 0', _tvUepDoProduto('501999001', 'X', '', CAT, PHM), null);

console.log('\n── o peso "normal" da caixa ──');
const dia = (data, uep, real, heCx) => ({ data, uep, real, heCx, fonte: 'sheets' });
const H5 = [dia('09/10/2026', 2000, 1000, 0), dia('13/10/2026', 2600, 2600, 0), dia('14/10/2026', 2900, 1849, 0),
            dia('15/10/2026', 2750, 1640, 0), dia('16/10/2026', 3116, 1971, 0), dia('19/10/2026', 999, 100, 0)];
ok('mediana de UEP ÷ caixas de jornada dos dias fechados, hoje fora', _tvF2(_tvUepPesoNormal(H5, 20261019)), '1,58');
ok('menos de 5 dias → sem "normal" (null)', _tvUepPesoNormal(H5.slice(0, 4), 20261019), null);
ok('dia sem UEP gravada fica fora (não vira zero)',
   _tvUepPesoNormal(H5.concat([dia('08/10/2026', null, 1500, 0)]), 20261019) === _tvUepPesoNormal(H5, 20261019), true);
ok('hora extra sai do denominador (_qpRealDia)', _tvF2(_tvUepPesoNormal(
   [dia('01/10/2026', 2000, 1500, 500), dia('02/10/2026', 2000, 1500, 500), dia('06/10/2026', 2000, 1500, 500),
    dia('07/10/2026', 2000, 1500, 500), dia('08/10/2026', 2000, 1500, 500)], 20261019)), '2,00');

console.log('\n── o desenho: veredito só com o selo ligado ──');
const F0 = _tvFHtml(M, false), F1 = _tvFHtml(M, true), G0 = _tvGHtml(M, false), G1 = _tvGHtml(M, true);
ok('selo DESLIGADO: nenhum NO RITMO/ATENÇÃO/ABAIXO (nem em rótulo) e nenhuma cor de status',
   [/NO RITMO|ATENÇÃO|ABAIXO DO RITMO/.test(F0 + G0), /var\(--(ok|warn|red)\)/.test(F0 + G0)], [false, false]);
ok('selo LIGADO: o MESMO texto do núcleo (slRitmo) nas duas telas', [F1.includes('>NO RITMO<'), G1.includes('>NO RITMO<')], [true, true]);
ok('Tela F traz o produto, a UEP da caixa e o peso contra o normal',
   [F0.includes('>BANQUETA VERSATIL<'), F0.includes('RODANDO AGORA · BRANCO'), F0.includes('<b>1,04</b> UEP'), F0.includes('o normal é 1,85 · hoje mais leves')],
   [true, true, true, true]);
ok('Tela F: hora em andamento diz "até HH:MM", a futura sai "—"', [F0.includes('até 15:02'), /tvf-col fut">[\s\S]*?class="tvf-val"[^>]*>—</.test(F0)], [true, true]);
ok('Tela G fala em tempo e em caixas', [G0.includes('+1h05'), G0.includes('250 caixas</b> deste produto') && G0.includes('1,04 UEP/cx · BANQUETA VERSATIL'), G0.includes('<b>15:56</b>'),
    G0.includes('>A META SAI ÀS<') && G0.includes('mantendo 288 UEP por hora')],
   [true, true, true, true]);
ok('o rodapé diz o que é 1 UEP', F0.includes('1 UEP = 1 caixa de MESA CABECEIRA MADERO'), true);
ok('desenho sem conta: nenhuma régua de UEP dentro dos três',
   ['function _tvFHtml(', 'function _tvGHtml(', 'function _tvGSvg('].map(f => /uepCard\(|efNoRitmo\(|_uepAbaDados\(|_uepAbaHoras\(|minSlotDecorrido\(/.test(pegaJs(f))),
   [false, false, false]);
ok('a tela F do retrato não carrega texto de "sem dado"', /nenhum produto|sem UEP no cadastro/.test(F0), false);

console.log('\n── ciclo e config: fora por padrão ──');
ok('as Telas F/G só entram MARCADAS (=== true: config antiga não tem a chave)',
   /\[t\] === true && !!_tvUepModelo\(\)/.test(pegaJs('function _temUep(')), true);
ok('o modelo da TV é a MESMA montagem da aba UEP', /D = _uepAbaDados\(\)/.test(pegaJs('function _tvUepModelo(')), true);
ok('o selo nasce desligado no painel', /uepSeloTv:false/.test(JS), true);
ok('backend antigo (sem a chave) preserva a marcação local de F e G',
   /f: pc\.telaF!==undefined \? pc\.telaF===true : _fAtual/.test(pegaJs('function aplicarConfigPainel(')), true);
ok('o .gs devolve F, G e o selo DESLIGADOS sem a chave na aba',
   ['telaF:  bool(kv.TELA_F, false)', 'telaG:  bool(kv.TELA_G, false)', 'seloUepTv: bool(kv.SELO_UEP_TV, false)']
     .map(s => pegaGs('function getConfigPainel(').includes(s)), [true, true, true]);
ok('o .gs grava as cinco chaves novas',
   ['TELA_F', 'TELA_G', 'TEMPO_F', 'TEMPO_G', 'SELO_UEP_TV'].map(k => pegaGs('function setConfigPainel(').includes('novos.' + k)),
   [true, true, true, true, true]);
ok('a Tela A e a Tela B continuam em caixas (sem UEP)',
   /uepCard|_tvUep/.test(pegaJs('function _sincSlideB(')), false);

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
