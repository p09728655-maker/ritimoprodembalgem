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
if (!/const UEP_ESCALAS = \[/.test(JS)) throw new Error('UEP_ESCALAS sumiu do painel');
global.UEP_ESCALAS = [];        // o teste põe as trocas que quer; o painel nasce sem nenhuma
['function _rpEsc(', 'function _cartNum(', 'function _qpRealDia(', 'function _uepAbaHoras(',
 'function _uepEscalaCorte(', 'function _uepEscalaSelo(', 'function _uepEscalaNota(', 'function _uepEscalaDesde(',
 'function _uepEscalaMarca(', 'function _uepAbaPerSvg(', 'function _dirSemSvg(',
 'function _tvF2(', 'function _tvMinTxt(', 'function _tvUepDoProduto(', 'function _tvUepPesoNormal(',
 'function _tvUepMontar(', 'function _tvUepRodHtml(', 'function _tvFHtml(', 'function _tvGEscala(', 'function _tvGDesenho(', 'function _tvGSvg(',
 'function _tvGHtml('].forEach(f => eval.call(global, pegaJs(f)));
{ const m = JS.match(/const TV_G_H_CHEIO = ([\d.]+), TV_G_Z_MIN = ([\d.]+), TV_G_Z_MAX = ([\d.]+);/);
  if (!m) throw new Error('TV_G_H_CHEIO/TV_G_Z_MIN/TV_G_Z_MAX sumiram do painel');
  [global.TV_G_H_CHEIO, global.TV_G_Z_MIN, global.TV_G_Z_MAX] = m.slice(1).map(Number); }

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

console.log('\n── TROCA DE ESCALA DA UEP com o passado travado (v7.151.0) ──');
{
  // PPCP, 20/10/2026: "quando alterar deixar travado o passado" → "faz a
  // marcação de datas nos gráficos". A troca entra em UEP_ESCALAS; o HISTORICO
  // não é regravado, então os dias antes dela ficam na régua anterior.
  const ESC = [{ desde: '21/10/2026', txt: 'cadastro × 0,83 · meta 3.048 → 2.530' }];
  const D4 = ['16/10/2026', '20/10/2026', '21/10/2026', '22/10/2026'];
  ok('o corte: a troca com dia dos dois lados; o dia da troca já é da régua nova',
     _uepEscalaCorte(D4, ESC), { desde: '21/10/2026', txt: 'cadastro × 0,83 · meta 3.048 → 2.530', n: 20261021, antes: 2, depois: 2 });
  ok('lista toda de um lado só (antes, depois ou um dia) → null: nada a marcar',
     [_uepEscalaCorte(['16/10/2026', '20/10/2026'], ESC), _uepEscalaCorte(['21/10/2026', '22/10/2026'], ESC), _uepEscalaCorte(['22/10/2026'], ESC)], [null, null, null]);
  ok('duas trocas no período: vale a mais recente', _uepEscalaCorte(['01/10/2026', '10/10/2026', '22/10/2026'],
     [{ desde: '05/10/2026' }, { desde: '21/10/2026' }]).desde, '21/10/2026');
  ok('o painel nasce sem troca nenhuma: nada é marcado', [_uepEscalaCorte(D4), _uepEscalaNota(D4), _uepEscalaSelo(D4)], [null, '', '']);
  ok('cada troca escrita no painel tem data que se lê (dd/mm/aaaa)',
     (eval(JS.match(/const UEP_ESCALAS = (\[[\s\S]*?\]);/)[1]) || []).every(t => _cartNum(t.desde) > 0), true);
  ok('os textos: curto no card, longo na nota, com quantos dias ficaram na régua anterior',
     [_uepEscalaSelo(D4, ESC), /2 dias estão na régua anterior/.test(_uepEscalaNota(D4, ESC)), /cadastro × 0,83/.test(_uepEscalaNota(D4, ESC)),
      /1 dia está/.test(_uepEscalaNota(['20/10/2026', '21/10/2026'], ESC))],
     ['⚠ escala da UEP mudou em 21/10', true, true, true]);
  ok('o 1º dia da régua que vale numa data', [_uepEscalaDesde(20261020, ESC), _uepEscalaDesde(20261021, ESC), _uepEscalaDesde(20261030, ESC)], [0, 20261021, 20261021]);

  // O peso normal da TV não mistura: só dias da régua de hoje.
  UEP_ESCALAS.push({ desde: '14/10/2026' });
  ok('peso normal: depois da troca só entram os dias da régua nova (aqui 3 → sem "normal")', _tvUepPesoNormal(H5, 20261019), null);
  UEP_ESCALAS.length = 0; UEP_ESCALAS.push({ desde: '01/09/2026' });
  ok('troca antiga, fora da janela: o normal é o mesmo de sempre', _tvF2(_tvUepPesoNormal(H5, 20261019)), '1,58');
  UEP_ESCALAS.length = 0;

  // A marca nos dois gráficos de UEP por dia — na data, entre as barras.
  const dU = (data, uep) => ({ data, uep, metaUep: 3048 });
  const P4 = D4.map((d, i) => dU(d, 2800 + i * 50));
  ok('gráfico do PERÍODO sem troca: nenhuma marca', /ESCALA NOVA/.test(_uepAbaPerSvg(P4, 760)), false);
  UEP_ESCALAS.push(ESC[0]);
  const sv = _uepAbaPerSvg(P4, 760), bw = (760 - 46 - 10) / 4;
  ok('gráfico do PERÍODO: tracejado no vão entre 20/10 e 21/10, com a data e a nota no título',
     [/ESCALA NOVA DA UEP · 21\/10/.test(sv), sv.includes(`x1="${(46 + 2 * bw).toFixed(1)}"`), /<title>⚠ A escala da UEP mudou em 21\/10/.test(sv)], [true, true, true]);
  const sd = _dirSemSvg(P4, 1600), passo = (1600 - 40) / 4;
  ok('gráfico da DIRETORIA (últimos dias): a mesma marca, na escala dela',
     [/ESCALA NOVA DA UEP · 21\/10/.test(sd), sd.includes(`x1="${(20 + 2 * passo).toFixed(1)}"`)], [true, true]);
  ok('marca perto da borda direita: o texto vira para dentro', /text-anchor="end"[^>]*>ESCALA NOVA/.test(_uepAbaPerSvg(['17/10/2026', '18/10/2026', '19/10/2026', '20/10/2026', '21/10/2026'].map(d => dU(d, 2900)), 760)), true);
  UEP_ESCALAS.length = 0;

  // Onde a UEP de vários dias aparece junta, a nota sai pelas MESMAS funções.
  const pega = f => pegaJs(f);
  ok('as notas estão nos lugares que juntam UEP de dias diferentes',
     [/_uepEscalaNota\(P\.dias\.map/.test(pega('function renderUep(')), /_uepEscalaNota\(P\.dias\.map/.test(pega('function _uepDocHtml(')),
      /_uepEscalaSelo\(uEsc\)/.test(JS), /_uepEscalaNota\(/.test(pega('function _rpUepFaixaHtml(')),
      /cart\.escNota = _uepEscalaNota\(_qpCurvaUepDias\(dias, QP_REGUA\)/.test(pega('async function _cartBlocos(')),
      /b\.cart\.escNota/.test(pega('function _cartBlocosHtml(')), /_uepEscalaNota\(SIM_UEP\.dias/.test(pega('function _simUepPintar(')),
      /_uepEscalaDesde\(hojeNum\)/.test(pega('function _tvUepPesoNormal('))],
     [true, true, true, true, true, true, true, true]);
}

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
   ['function _tvFHtml(', 'function _tvGHtml(', 'function _tvGSvg(', 'function _tvGDesenho('].map(f => /uepCard\(|efNoRitmo\(|_uepAbaDados\(|_uepAbaHoras\(|minSlotDecorrido\(/.test(pegaJs(f))),
   [false, false, false, false]);
ok('a tela F do retrato não carrega texto de "sem dado"', /nenhum produto|sem UEP no cadastro/.test(F0), false);

console.log('\n── rótulos do gráfico e encaixe na altura (19/10/2026; TV de 65", 20/10/2026) ──');
// 19/10: o ESPERADO 571 das 08:59 caía acima-à-direita do ponto, com as linhas
// que vêm pela frente subindo por cima dele. 20/10 (TV de 65"): às 08:46 o
// gráfico não tinha número nenhum, e às 15:02 o ESPERADO caía em cima da curva
// do FEITO. A regra hoje é o INVARIANTE, não a posição: os dois números sempre
// aparecem, dentro da área do gráfico, sem encostar em curva nenhuma nem um
// no outro.
function rotulos(svg){
  const caixa = re => { const m = svg.match(re); return m ? [+m[1], +m[2], +m[1] + +m[3], +m[2] + +m[4]] : null; };
  const R = '<rect x="([\\d.-]+)" y="([\\d.-]+)" width="([\\d.]+)" height="([\\d.]+)" rx="8" fill="var\\(--bg\\)" opacity=".86"/><text [^>]*>';
  const pts = [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="(?:12" fill="var\(--txt2\)|18)"/g)].map(m => ({ x: +m[1], y: +m[2] }));
  const curvas = [...svg.matchAll(/<polyline [^>]*points="([^"]+)"/g)].map(m => m[1].split(' ').map(p => p.split(',').map(Number)));
  return { feito: caixa(new RegExp(R + 'FEITO ')), esp: caixa(new RegExp(R + 'ESPERADO ')), pts, curvas,
           vb: svg.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number) };
}
function encosta(bx, curvas){
  return curvas.some(pl => pl.some((q, i) => {
    if(!i) return false;
    const [x1, y1] = pl[i - 1], [x2, y2] = q, n = Math.ceil(Math.hypot(x2 - x1, y2 - y1)) + 1;
    for(let k = 0; k <= n; k++){ const px = x1 + (x2 - x1) * k / n, py = y1 + (y2 - y1) * k / n;
      if(px > bx[0] && px < bx[2] && py > bx[1] && py < bx[3]) return true; }
    return false;
  }));
}
const cruzaBx = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const CASOS_G = {
  '07:30 (pontos colados no eixo)': _tvUepMontar(montarD(450, { '07:00': 120 }, { '07:00': 60 }), { agoraMin: 450, prod: PROD, cat: CAT }),
  '08:46 (o print da TV de 65")': _tvUepMontar(montarD(526, { '07:00': 275 }, { '07:00': 132 }), { agoraMin: 526, prod: PROD, cat: CAT }),
  '08:59 (o print de 19/10)': _tvUepMontar(montarD(539, { '07:00': 290, '08:00': 220 }, { '07:00': 157, '08:00': 120 }), { agoraMin: 539, prod: PROD, cat: CAT }),
  '13:40 (atrasado)': _tvUepMontar(montarD(820, { '07:00': 210, '08:00': 190, '09:00': 230, '10:00': 215, '12:12': 165, '13:00': 150 },
                                   { '07:00': 120, '08:00': 110, '09:00': 135, '10:00': 125, '12:12': 96, '13:00': 86 }), { agoraMin: 820, prod: PROD, cat: CAT }),
  '15:02 (o retrato de 16/10)': M,
  // os dois tipos de dia em que a 1ª versão da busca não achava lugar (sorteio
  // de 4.000 dias): muito atrasado no fim da tarde, e o FEITO colado na meta
  '16:34 (muito atrasado)': _tvUepMontar(montarD(994, { '07:00': 150, '08:00': 120, '09:00': 130, '10:00': 140, '12:12': 100, '13:00': 120, '14:00': 150, '15:00': 160, '16:00': 90 },
                                         { '07:00': 75, '08:00': 60, '09:00': 65, '10:00': 70, '12:12': 50, '13:00': 60, '14:00': 75, '15:00': 80, '16:00': 45 }), { agoraMin: 994, prod: PROD, cat: CAT }),
  '16:08 (feito colado na meta)': _tvUepMontar(montarD(968, { '07:00': 300, '08:00': 280, '09:00': 310, '10:00': 290, '12:12': 230, '13:00': 300, '14:00': 290, '15:00': 280 },
                                         { '07:00': 150, '08:00': 140, '09:00': 155, '10:00': 145, '12:12': 115, '13:00': 150, '14:00': 145, '15:00': 140 }), { agoraMin: 968, prod: PROD, cat: CAT }),
  '16:30 (meta batida)': batida,
};
Object.entries(CASOS_G).forEach(([nome, mm]) => {
  [false, true].forEach(selo => {
    const R = rotulos(_tvGSvg(mm, selo)), bxs = [R.feito, R.esp];
    ok(nome + (selo ? ' · selo' : '') + ': os dois números aparecem, dentro do gráfico, sem encostar em curva nem um no outro',
       [bxs.every(Boolean), bxs.every(b => b && b[0] >= 0 && b[1] >= 0 && b[2] <= R.vb[0] && b[3] <= R.vb[1]),
        bxs.some(b => b && encosta(b, R.curvas)), !!(R.feito && R.esp && cruzaBx(R.feito, R.esp))],
       [true, true, false, false]);
  });
});
const S1502 = _tvGSvg(M, false);
ok('a DISTÂNCIA feito × esperado é uma faixa desenhada (tinta neutra sem o selo)', /<polygon points="[^"]+" fill="var\(--txt\)" opacity=".2"\/>/.test(S1502), true);
ok('com o selo, a faixa pega a cor do veredito', /<polygon points="[^"]+" fill="var\(--(ok|warn|red)\)" opacity=".2"\/>/.test(_tvGSvg(M, true)), true);
ok('traço de TV de 65": FEITO 12, ESPERADO 7 tracejado, ATÉ A META 7 em pontos',
   [/stroke="var\(--txt\)" stroke-width="12"/.test(S1502), /stroke="var\(--txt2\)" stroke-width="7" stroke-dasharray="24 14"/.test(S1502),
    /stroke-width="7" stroke-dasharray="0 16" stroke-linecap="round"/.test(S1502)], [true, true, true]);
ok('letra do gráfico para 65": números do agora 54/42, eixo 34 em Barlow Condensed 600 (o mono 400 cinza era fino demais)',
   ['.tvg-svg .tvg-t0{font-family:var(--font-h);font-weight:700;font-size:54px', '.tvg-svg .tvg-t1{font-family:var(--font-h);font-weight:600;font-size:42px',
    '.tvg-svg .tvg-t2{font-family:var(--font-h);font-weight:600;font-size:34px'].map(t => html.includes(t)), [true, true, true]);

console.log('\n── o gráfico no TAMANHO DA CAIXA (v7.173.0; print de 27/10, a janela do app no PC da TV) ──');
// Caixas medidas no Chromium: a janela do app em 1920 (cabeçalho, abas, rodapé
// e barra do Windows — o print), a TV cheia em 1920×1080 e em 1366×768, e o
// gerencial numa janela de 1366×650.
const CAIXAS_G = { 'janela 1920 (o print)': { w: 1050, h: 654 }, 'TV cheia 1920×1080': { w: 1050, h: 842 },
                   'TV cheia 1366×768': { w: 747, h: 575 }, 'janela 1366×650': { w: 747, h: 357 } };
ok('escala: a letra da TV cheia vale até 620 px de altura; abaixo encolhe junto; sem caixa, 1',
   [_tvGEscala(654), +_tvGEscala(842).toFixed(3), +_tvGEscala(575).toFixed(3), +_tvGEscala(357).toFixed(3), _tvGEscala(0), _tvGEscala(5000)],
   [1, 1.002, 0.927, 0.576, 1, 1.3]);
ok('o viewBox tem a proporção da caixa (antes 1000×840 fixo: na janela de 1920 sobravam 135 px de cada lado)',
   Object.values(CAIXAS_G).map(d => { const v = _tvGSvg(M, false, d).match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number);
     return Math.abs(v[0] / v[1] - d.w / d.h) < 0.01; }), [true, true, true, true]);
ok('sem caixa (1º desenho, escondida) continua 1000×840', /viewBox="0 0 1000 840"/.test(_tvGSvg(M, false)), true);
const noTempo = _tvUepMontar(montarD(889, { '07:00': 300, '08:00': 270, '09:00': 290, '10:00': 330, '12:12': 215, '13:00': 435, '14:00': 66 },
                                     { '07:00': 290, '08:00': 260, '09:00': 280, '10:00': 320, '12:12': 200, '13:00': 420, '14:00': 64 }),
                         { agoraMin: 889, prod: PROD, cat: CAT });
Object.entries(CAIXAS_G).forEach(([cn, d]) => {
  const res = Object.entries(Object.assign({ '14:49 (o print de 27/10: a meta sai às 16:59, na borda)': noTempo,
    // do sorteio: na TV de 1366×768 o par só cabe com a letra 10% menor
    '10:12 (muito adiantado)': _tvUepMontar(montarD(612, { '07:00': 344.5, '08:00': 345.1, '09:00': 203.3, '10:00': 534.1 },
                                                       { '07:00': 230, '08:00': 230, '09:00': 136, '10:00': 356 }), { agoraMin: 612, prod: PROD, cat: CAT }) }, CASOS_G)).map(([nome, mm]) => [false, true].map(selo => {
    const svg = _tvGSvg(mm, selo, d), R = rotulos(svg), bxs = [R.feito, R.esp];
    const alm = (() => { const m = svg.match(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="middle" class="tvg-t2">ALMOÇO<\/text>/);
      return m ? [+m[1] - 52, +m[2] - 28, +m[1] + 52, +m[2] + 6] : null; })();
    const hora = svg.match(/<text x="([\d.]+)" y="[\d.]+" text-anchor="middle" class="tvg-t0">\d\d:\d\d<\/text>/);
    return [bxs.every(Boolean), bxs.every(b => b && b[0] >= 0 && b[1] >= 0 && b[2] <= R.vb[0] && b[3] <= R.vb[1]),
            bxs.some(b => b && encosta(b, R.curvas)), !!(R.feito && R.esp && cruzaBx(R.feito, R.esp)),
            !!alm && bxs.some(b => b && cruzaBx(b, alm)), !!hora && +hora[1] + 62 > R.vb[0]].join() === 'true,true,false,false,false,false'
      ? null : nome + (selo ? ' · selo' : '');
  })).flat().filter(Boolean);
  ok(cn + ': nos 11 casos, com e sem selo, os dois números aparecem dentro, sem encostar em curva, um no outro, no ALMOÇO, e o horário da meta não passa da borda', res, []);
});

console.log('\n── as linhas: só o ESPERADO é tracejado, e o que anda colado não se desenha duas vezes ──');
ok('a META é linha cheia (o tracejado 6 10 sumiu)', [/stroke-dasharray="6 10"/.test(S1502), /stroke="var\(--txt3\)" stroke-width="3"\/><text [^>]*class="tvg-t1">META DO DIA/.test(S1502)], [false, true]);
const espPts = svg => svg.match(/stroke="var\(--txt2\)" stroke-width="7" stroke-dasharray="24 14" stroke-linejoin="round" points="([^"]+)"/)[1].split(' ').length;
ok('o print de 27/10 (14:49, 1.906 feitas = 1.906 esperadas): o esperado PARA no agora — daqui para a frente fica só o ATÉ A META',
   [Math.round(noTempo.difUep), espPts(_tvGSvg(noTempo, false)), noTempo.pts.length], [0, noTempo.pts.length, noTempo.pts.length]);
ok('com distância (15:02, +312 UEP), o esperado segue até o fim da jornada', espPts(S1502) > M.pts.length, true);
ok('meta batida (sem ATÉ A META): o esperado segue até o fim', espPts(_tvGSvg(batida, false)) > batida.pts.length, true);
ok('grade de no máximo 4 passos: com a meta de 2.530, só 1.000 e 2.000',
   [...S1502.matchAll(/text-anchor="end" class="tvg-t2">([\d.]+)</g)].map(m => m[1]), ['1.000', '2.000']);
ok('o ALMOÇO mora no pé da faixa', /y="(\d+)" text-anchor="middle" class="tvg-t2">ALMOÇO/.test(S1502) && +S1502.match(/y="(\d+)" text-anchor="middle" class="tvg-t2">ALMOÇO/)[1] > 700, true);
const CABE_G = pegaJs('function _tvUepCabe('), ENC = pegaJs('function _tvGEncaixa(');
ok('o encaixe redesenha o gráfico no tamanho da caixa, com o modelo que o ciclo deixou no corpo',
   [/_tvGEncaixa\(corpo\)/.test(CABE_G), /_tvGSvg\(a\[0\], a\[1\], \{ w:r\.width, h:r\.height \}\)/.test(ENC),
    /corpo\._tvgArgs = t === 'g' \? \[m, selo\] : null/.test(JS)], [true, true, true]);
const CSS_FG = html.split('\n').filter(l => /^\.tv[ufg]-/.test(l) && !/^\.tvu-slide\{/.test(l) && /font-size:/.test(l));
ok('fonte das Telas F/G pela escala --tvu-k (nenhum font-size solto por vh)',
   CSS_FG.filter(l => /font-size:clamp\(/.test(l)).length, 0);
ok('o cartão cresce pelo CONTEÚDO (1 1 auto), não em fatias iguais', /^\.tvu-card\{flex:1 1 auto;/m.test(html), true);
const CABE = pegaJs('function _tvUepCabe(');
ok('o encaixe reduz a escala até TV_UEP_K_MIN e só refaz quando o tamanho muda',
   [/TV_UEP_K_MIN/.test(CABE), /_tvuTam === tam/.test(CABE), /--tvu-k/.test(CABE)], [true, true, true]);
ok('mede a ALTURA (scrollHeight) — o teste da v7.138.0 só via a largura',
   /scrollHeight > e\.clientHeight/.test(pegaJs('function _tvUepCorta(')), true);
ok('nome de produto pode cortar com "…" sem encolher a tela', /tvu-nome/.test(pegaJs('function _tvUepCorta(')) && /tvu-prod tvu-nome/.test(F0) && /tvu-sub tvu-nome/.test(G0), true);
const CICLO = JS.slice(JS.indexOf('function _sincSlideUep('), JS.indexOf('function _sincSlideUep(') + 9000);
ok('o ciclo mede depois de desenhar e depois de MOSTRAR (escondida não tem altura)',
   [/innerHTML = t === 'f'[\s\S]{0,120}_tvUepCabe\(/.test(CICLO), /slides\[t\]\.style\.display = 'flex'; _tvUepCabe\(slides\[t\], true\)/.test(JS)], [true, true]);

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
