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
['function _rpEsc(', 'function _cartNum(', 'function _qpRealDia(', 'function _uepAbaHoras(', 'function parseBR(', 'function _fdsNome(',
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
// v7.259.0 (PPCP, 17/11/2026, com o print das 08:53: "2603 cx slim isso não está na
// programação, pode confundir"): a falta é só em UEP — o modelo não traz mais faltaCx
ok('falta 259 UEP, sem a conversão em caixas do produto de agora', [Math.round(M.falta), 'faltaCx' in M], [259, false]);
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
ok('fim da tarde: restam 29 min de jornada', Mt.minRest, 29);
const fimDia = _tvUepMontar(montarD(1030, { '07:00': 100 }, { '07:00': 60 }), { agoraMin: 1030 });
ok('jornada encerrada: nada resta', [fimDia.minRest, fimDia.agora], [0, 1019]);
const batida = _tvUepMontar(montarD(960, Object.assign({}, UEP_H, { '15:00': 400 }), Object.assign({}, CX_H, { '15:00': 300 })), { agoraMin: 960 });
ok('meta batida: falta 0 (e o modelo sem faltaCx — revisão da v7.259.0: comparar o campo sumido passava sempre)', [batida.falta, 'faltaCx' in batida], [0, false]);
// v7.257.0 (PPCP, 16/11/2026: "não incluir projeção de fechamento"): o modelo
// não monta mais a projeção do feito (o pontilhado e a hora da meta).
ok('sem projeção no modelo (proj e chega saíram)', [M, Mt, fimDia, batida].map(mm => 'proj' in mm || 'chega' in mm), [false, false, false, false]);

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
  // v7.266.0: o HISTÓRICO usa o mesmo desenho — com o id do padrão próprio (dois desenhos na página
  // não se misturam: o 2º resolvia para o pattern do 1º, em display:none, e o sábado saía vazio) e
  // a cor da tabela por dia (o dia que bateu só com a hora extra é âmbar lá, e vermelho no desenho de sempre)
  { const S = [dU('16/10/2026', 2900), dU('17/10/2026', 900), dU('19/10/2026', 3100)].map(histDiaFds);   // sexta · sábado · segunda
    const sv1 = _uepAbaPerSvg(S, 760, 230, 0, { pid: 'histPerLis', cls: { '16/10/2026': 'he' } }), sv0 = _uepAbaPerSvg(S, 760);
    ok('HISTÓRICO: id próprio do padrão listrado e a barra âmbar do dia que bateu só com HE; sem a opção, o desenho de sempre',
       [/id="histPerLis"/.test(sv1), /url\(#histPerLis\)/.test(sv1), /uepPerLis/.test(sv1), /id="uepPerLis"/.test(sv0) && /url\(#uepPerLis\)/.test(sv0),
        /fill="var\(--warn\)" opacity="\.85"/.test(sv1), /bateu com a hora extra/.test(sv1), /fill="var\(--red\)" opacity="\.85"/.test(sv0), /fill="var\(--warn\)" opacity="\.85"/.test(sv0)],
       [true, true, false, true, true, true, true, false]); }

  // Onde a UEP de vários dias aparece junta, a nota sai pelas MESMAS funções.
  const pega = f => pegaJs(f);
  ok('as notas estão nos lugares que juntam UEP de dias diferentes',
     [/_uepEscalaNota\(P\.dias\.map/.test(pega('function renderUep(')), /_uepEscalaNota\(P\.dias\.map/.test(pega('function _uepDocHtml(')),
      // v7.266.0: o card UEP / DIA do HISTÓRICO lê a nota e o selo da montagem (_histUepMontar)
      // v7.267.0: a faixa de UEP dos papéis saiu — o semanal diz a nota no ONDE PERDEMOS e o 🖨 do histórico lê a da montagem
      /escalaSelo:_uepEscalaSelo\(U\.datasUep\), escalaNota:_uepEscalaNota\(U\.datasUep\)/.test(pega('function _histUepMontar(')),
      /_uepEscalaNota\(U\.datasUep\)/.test(pega('function _relSemUepCorpoHtml(')) && /U\.escalaNota\?/.test(pega('function _histDocUepHtml(')),
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
// v7.257.0 (PPCP, 16/11/2026, a maquete "menos informação, mais visibilidade"):
// o selo, os minutos enormes e o sentido por extenso; a falta em UEP no número
// grande (v7.259.0: sem as caixas e sem o produto); a legenda com a META.
ok('Tela G: minutos e sentido, a falta SÓ em UEP (sem caixas, sem produto), a legenda com a META',
   [G0.includes('<div class="tvg-min">1h05</div><div class="tvg-dir">À FRENTE</div>'), G0.includes('<div class="tvg-uep">DO ESPERADO · 312 UEP</div>'),
    G0.includes('<div class="tvg-falta so"><span><b>259</b>UEP</span></div>'), /caixas|BANQUETA/.test(G0.replace(/<svg[\s\S]*<\/svg>/, '')),
    G0.includes('<i class="tvg-sw m"></i>META DO DIA')],
   [true, true, true, false, true]);
ok('Tela G sem o rodapé "1 UEP = 1 caixa de …" (PPCP: "pode tirar"); a hora extra continua, fora da meta',
   [/1 UEP = 1 caixa/.test(G0 + G1), /tvu-rod/.test(G0), _tvGHtml(Object.assign({}, M, { he: 87.4 }), false).includes('+87 UEP em hora extra hoje — fora da meta')],
   [false, false, true]);
ok('sem projeção no gráfico: nenhum pontilhado (0 16) nem horário de meta, em caso nenhum',
   [M, Mt, fimDia, batida].map(mm => /stroke-dasharray="0 16"|class="tvg-t0">\d\d:\d\d</.test(_tvGSvg(mm, true))), [false, false, false, false]);
// O print de 16/11/2026 15:58: 2.429 feitas × 2.441 esperadas (−12 UEP, 99,5%)
// e a tela dizia NO RITMO e "A META NÃO SAI ATÉ 16:59" — o 3º cartão andava no
// ritmo da meta a partir do feito e, com 1 UEP atrás, dizia NÃO SAI o dia
// inteiro (às 09:20, com 96,8%, também). Um veredito só: o do selo.
{
  const D1558 = montarD(958, { '07:00': 330, '08:00': 320, '09:00': 300, '10:00': 300, '12:12': 230, '13:00': 320, '14:00': 320, '15:00': 309 },
                        { '07:00': 160, '08:00': 150, '09:00': 140, '10:00': 140, '12:12': 110, '13:00': 150, '14:00': 150, '15:00': 145 });
  D1558.card = uepCard({ normal: D1558.feito, he: 0, cxCom: 1, cxSem: 0, codigos: 429 }, 2761, D1558.k.minNorm); D1558.meta = 2761;
  const PEN = { cod: '502100001', desc: 'VOL 1/1 PENTEADEIRA PRINCESA', cor: 'BRANCO' }, CATP = [{ codigo: '502.100.001', uep: 2.14 }];
  const M1558 = _tvUepMontar(D1558, { agoraMin: 958, prod: PEN, cat: CATP });
  const M0920 = _tvUepMontar(montarD(560, { '07:00': 300, '08:00': 290, '09:00': 120 }, { '07:00': 150, '08:00': 145, '09:00': 60 }), { agoraMin: 560, prod: PEN, cat: CATP });
  const G1558 = _tvGHtml(M1558, true);
  ok('o print das 15:58: −12 UEP, NO RITMO, 2 min ATRÁS, faltam 332 UEP (sem as 156 caixas de PENTEADEIRA desde a v7.259.0)',
     [Math.round(M1558.difUep), slRitmo(M1558.ef), G1558.includes('<span class="tvg-selo ok">NO RITMO</span>'),
      G1558.includes('<div class="tvg-min">2 min</div><div class="tvg-dir">ATRÁS</div>'),
      G1558.includes('<div class="tvg-falta so"><span><b>332</b>UEP</span></div>'), /caixas|PENTEADEIRA/.test(G1558.replace(/<svg[\s\S]*<\/svg>/, ''))],
     [-12, 'NO RITMO', true, true, true, false]);
  // o print das 08:53 de 17/11: 2.316 UEP ÷ 0,89 da MESA CENTRO SLIM = "2.603
  // caixas" que a programação não tinha — o cartão diz só a UEP
  { const S0853 = _tvUepMontar(montarD(533, { '07:00': 300, '08:00': 145 }, { '07:00': 330, '08:00': 160 }),
                               { agoraMin: 533, prod: { cod: '501130010', desc: 'VOL 1/1 MESA CENTRO SLIM', cor: 'BRANCO' }, cat: [{ codigo: '501.130.010', uep: 0.89 }] });
    ok('08:53: a falta só em UEP; nenhuma "caixas" nem MESA CENTRO SLIM no cartão',
       [/<div class="tvg-falta so"><span><b>[\d.]+<\/b>UEP<\/span><\/div>/.test(_tvGHtml(S0853, true)), /caixas|SLIM/.test(_tvGHtml(S0853, true).replace(/<svg[\s\S]*<\/svg>/, ''))],
       [true, false]); }
  // A variante A (PPCP, 16/11/2026): o veredito é o selo de sempre, o sentido
  // é FATO (À FRENTE / ATRÁS). ADIANTADO / ATRASADO por minutos fixos diria
  // ATRASADO em vermelho com o gerencial em NO RITMO (16:00, 17 min, 96,3%).
  ok('variante A: nenhum ADIANTADO / ATRASADO na tela (o veredito é o selo)',
     [M1558, M0920, M, Mt, batida].map(mm => /ADIANTADO|ATRASADO/.test(_tvGHtml(mm, true))), [false, false, false, false, false]);
  ok('um veredito só: nenhum cartão diz se a meta sai (15:58, 09:20, 15:02 à frente, fim da tarde, jornada encerrada, meta batida)',
     [M1558, M0920, M, Mt, fimDia, batida].map(mm => [false, true].map(s => /SAI ÀS|NÃO SAI|NÃO CABE|tvu-card[^]*tvu-card[^]*tvu-card/i.test(_tvGHtml(mm, s)))).flat()
       .filter(Boolean).length, 0);
  ok('o sentido vai por extenso, nunca por sinal ("−2 min" ao lado do NO RITMO)', /[−+]\d/.test(G1558.replace(/<svg[\s\S]*<\/svg>/, '')), false);
  // (v7.256.1 → v7.259.0: o nome do produto, que cortava com "…", saiu do
  // cartão junto com as caixas — não há mais linha .tvu-nome na G.)
  const MK = _tvUepMontar(montarD(560, { '07:00': 300, '08:00': 290, '09:00': 120 }, { '07:00': 150, '08:00': 145, '09:00': 60 }),
                          { agoraMin: 560, prod: { cod: '502200001', desc: 'VOL 1/1 KIT 2 MESA CABECEIRA SLEEP', cor: 'BRANCO' }, cat: [{ codigo: '502.200.001', uep: 1.3 }] });
  const GK = _tvGHtml(MK, true);
  ok('nome comprido: não aparece mais na G (nenhuma linha .tvu-nome) e a falta é só a UEP',
     [/tvu-nome/.test(GK), GK.includes('<div class="tvg-falta so"><span><b>' + fmtN(Math.round(MK.falta)) + '</b>UEP</span></div>')], [false, true]);
  // v7.257.0: "feitas · esperadas" e a UEP/cx saíram do cartão (PPCP, "apresentar
  // somente UEP restante, caixas e o produto"); a rede do FEITO passou para o
  // gráfico — sem lugar livre, ele vai encostado numa curva (testado abaixo).
  ok('o cartão não repete feitas · esperadas nem a UEP/cx', [/feitas ·|UEP\/cx/.test(G1558), /feitas ·|UEP\/cx/.test(GK)], [false, false]);
}
ok('o rodapé diz o que é 1 UEP', F0.includes('1 UEP = 1 caixa de MESA CABECEIRA MADERO'), true);
ok('desenho sem conta: nenhuma régua de UEP dentro dos três',
   ['function _tvFHtml(', 'function _tvGHtml(', 'function _tvGSvg(', 'function _tvGDesenho('].map(f => /uepCard\(|efNoRitmo\(|_uepAbaDados\(|_uepAbaHoras\(|minSlotDecorrido\(/.test(pegaJs(f))),
   [false, false, false, false]);
ok('a tela F do retrato não carrega texto de "sem dado"', /nenhum produto|sem UEP no cadastro/.test(F0), false);

console.log('\n── rótulos do gráfico e encaixe na altura (19/10/2026; TV de 65", 20/10/2026) ──');
// 19/10: o ESPERADO 571 das 08:59 caía acima-à-direita do ponto, com as linhas
// que vêm pela frente subindo por cima dele. 20/10 (TV de 65"): às 08:46 o
// gráfico não tinha número nenhum, e às 15:02 o ESPERADO caía em cima da curva
// do FEITO. A regra hoje é o INVARIANTE, não a posição. Desde a v7.257.0 o
// gráfico tem UM número, o do FEITO (o do ESPERADO saiu): ele sempre aparece,
// dentro da área do gráfico; nas caixas da TV, sem encostar em curva nenhuma.
function rotulos(svg){
  const caixa = re => { const m = svg.match(re); return m ? [+m[1], +m[2], +m[1] + +m[3], +m[2] + +m[4]] : null; };
  const R = '<rect x="([\\d.-]+)" y="([\\d.-]+)" width="([\\d.]+)" height="([\\d.]+)" rx="8" fill="var\\(--bg\\)" opacity=".86"/><text [^>]*>';
  const pts = [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="(?:14" fill="var\(--txt2\)|22)"/g)].map(m => ({ x: +m[1], y: +m[2] }));
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
    const R = rotulos(_tvGSvg(mm, selo)), bx = R.feito;
    ok(nome + (selo ? ' · selo' : '') + ': o FEITO aparece, dentro do gráfico, sem encostar em curva — e o ESPERADO não tem número',
       [!!bx, !!bx && bx[0] >= 0 && bx[1] >= 0 && bx[2] <= R.vb[0] && bx[3] <= R.vb[1], !!bx && encosta(bx, R.curvas), !!R.esp],
       [true, true, false, false]);
  });
});
const S1502 = _tvGSvg(M, false);
ok('a DISTÂNCIA feito × esperado é uma faixa desenhada (tinta neutra sem o selo)', /<polygon points="[^"]+" fill="var\(--txt\)" opacity=".2"\/>/.test(S1502), true);
ok('com o selo, a faixa pega a cor do veredito', /<polygon points="[^"]+" fill="var\(--(ok|warn|red)\)" opacity=".2"\/>/.test(_tvGSvg(M, true)), true);
ok('traço (v7.257.0, "aumenta o que puder"): FEITO 18, ESPERADO 10 tracejado, META 7 laranja, nenhum pontilhado',
   [/stroke="var\(--txt\)" stroke-width="18"/.test(S1502), /stroke="var\(--txt2\)" stroke-width="10" stroke-dasharray="28 16"/.test(S1502),
    /stroke="var\(--acc\)" stroke-width="7"/.test(S1502), /stroke-dasharray="0 16"/.test(S1502)], [true, true, true, false]);
ok('letra do gráfico (v7.257.0): FEITO 80, META 52 laranja, eixo 40 em Barlow Condensed',
   ['.tvg-svg .tvg-t0{font-family:var(--font-h);font-weight:700;font-size:80px', '.tvg-svg .tvg-tm{font-family:var(--font-h);font-weight:700;font-size:52px;fill:var(--acc)',
    '.tvg-svg .tvg-t2{font-family:var(--font-h);font-weight:600;font-size:40px'].map(t => html.includes(t)), [true, true, true]);

console.log('\n── o gráfico no TAMANHO DA CAIXA (v7.173.0; print de 27/10, a janela do app no PC da TV) ──');
// Caixas do gráfico MEDIDAS no Chromium na v7.257.1 (a tela da G mudou de
// tamanho na v7.257.0 — a revisão achou o teste ainda com as da v7.256.0):
// a TV cheia em 1920×1080 e 1366×768, a janela do app em 1920 (o print), e o
// gerencial em janelas de 1366×560 e 1280×600, na menor altura medida (com
// hora extra ou o selo, o cartão cresce e o gráfico encolhe).
const CAIXAS_G = { 'TV cheia 1920×1080': { w: 1085, h: 883 }, 'TV cheia 1366×768': { w: 772, h: 571 },
                   'janela 1920 (o print)': { w: 1085, h: 659 }, 'janela 1366×560': { w: 772, h: 307 },
                   'janela 1280×600': { w: 724, h: 346 } };
const CAIXA_TV = ['janela 1920 (o print)', 'TV cheia 1920×1080', 'TV cheia 1366×768'];
ok('escala: a letra da TV cheia vale até 620 px de altura; abaixo encolhe junto; sem caixa, 1',
   [_tvGEscala(654), +_tvGEscala(842).toFixed(3), +_tvGEscala(575).toFixed(3), +_tvGEscala(357).toFixed(3), _tvGEscala(0), _tvGEscala(5000)],
   [1, 1.002, 0.927, 0.576, 1, 1.3]);
ok('o viewBox tem a proporção da caixa (antes 1000×840 fixo: na janela de 1920 sobravam 135 px de cada lado)',
   Object.values(CAIXAS_G).map(d => { const v = _tvGSvg(M, false, d).match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number);
     return Math.abs(v[0] / v[1] - d.w / d.h) < 0.01; }), [true, true, true, true, true]);
ok('sem caixa (1º desenho, escondida) continua 1000×840', /viewBox="0 0 1000 840"/.test(_tvGSvg(M, false)), true);
const noTempo = _tvUepMontar(montarD(889, { '07:00': 300, '08:00': 270, '09:00': 290, '10:00': 330, '12:12': 215, '13:00': 435, '14:00': 66 },
                                     { '07:00': 290, '08:00': 260, '09:00': 280, '10:00': 320, '12:12': 200, '13:00': 420, '14:00': 64 }),
                         { agoraMin: 889, prod: PROD, cat: CAT });
Object.entries(CAIXAS_G).forEach(([cn, d]) => {
  const tv = CAIXA_TV.includes(cn);
  const res = Object.entries(Object.assign({ '14:49 (o print de 27/10: feito = esperado)': noTempo,
    '10:12 (muito adiantado)': _tvUepMontar(montarD(612, { '07:00': 344.5, '08:00': 345.1, '09:00': 203.3, '10:00': 534.1 },
                                                       { '07:00': 230, '08:00': 230, '09:00': 136, '10:00': 356 }), { agoraMin: 612, prod: PROD, cat: CAT }) }, CASOS_G)).map(([nome, mm]) => [false, true].map(selo => {
    const svg = _tvGSvg(mm, selo, d), R = rotulos(svg), bx = R.feito;
    const alm = (() => { const m = svg.match(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="middle" class="tvg-t2">ALMOÇO<\/text>/);
      return m ? [+m[1] - 60, +m[2] - 33, +m[1] + 60, +m[2] + 7] : null; })();
    // na TV, lugar LIVRE; na janela pequena do gerencial pode encostar numa
    // curva (sobre a tarja) — o que não pode é faltar
    return [!!bx, !!bx && bx[0] >= 0 && bx[1] >= 0 && bx[2] <= R.vb[0] && bx[3] <= R.vb[1],
            tv && !!bx && encosta(bx, R.curvas), !!alm && !!bx && cruzaBx(bx, alm)].join() === 'true,true,false,false'
      ? null : nome + (selo ? ' · selo' : '');
  })).flat().filter(Boolean);
  ok(cn + ': nos 11 casos, com e sem selo, o FEITO aparece dentro do gráfico, fora do ALMOÇO' + (tv ? ' e sem encostar em curva' : ''), res, []);
});

console.log('\n── as linhas: só o ESPERADO é tracejado, e vai até o fim da jornada ──');
ok('a META é linha cheia e laranja (o tracejado 6 10 sumiu)', [/stroke-dasharray="6 10"/.test(S1502), /stroke="var\(--acc\)" stroke-width="7"\/><text [^>]*class="tvg-tm">META DO DIA/.test(S1502)], [false, true]);
const espPts = svg => svg.match(/stroke="var\(--txt2\)" stroke-width="10" stroke-dasharray="28 16" stroke-linejoin="round" points="([^"]+)"/)[1].split(' ').length;
// Até a v7.256.x, com feito = esperado (o print de 27/10, 14:49), o esperado
// PARAVA no agora para não andar colado ao pontilhado da projeção; sem a
// projeção (v7.257.0) ele segue sempre até o fim da jornada.
ok('feito = esperado (14:49, o print de 27/10): o esperado segue até o fim da jornada',
   [Math.round(noTempo.difUep), espPts(_tvGSvg(noTempo, false)) > noTempo.pts.length], [0, true]);
ok('com distância (15:02, +312 UEP), o esperado segue até o fim da jornada', espPts(S1502) > M.pts.length, true);
ok('meta batida: o esperado segue até o fim', espPts(_tvGSvg(batida, false)) > batida.pts.length, true);

console.log('\n── o 2º cartão e o NO TEMPO (revisão da v7.257.0) ──');
{
  const semCad = _tvUepMontar(montarD(902, UEP_H, CX_H), { agoraMin: 902, prod: PROD, cat: [] });
  const semProd = _tvUepMontar(montarD(902, UEP_H, CX_H), { agoraMin: 902 });
  const g = mm => _tvGHtml(mm, false);
  ok('jornada encerrada: JORNADA ENCERRADA, a falta em UEP e FALTARAM PARA A META',
     [g(fimDia).includes('<div class="tvg-lbl">JORNADA ENCERRADA</div><div class="tvg-falta"><span><b>' + fmtN(Math.round(fimDia.falta)) + '</b>UEP</span></div>'),
      g(fimDia).includes('>FALTARAM PARA A META<')], [true, true]);
  ok('meta batida: ALCANÇADA e quanto passou, que vem PRONTO do modelo (acima), sem sinal',
     [batida.acima > 0, g(batida).includes('<b>ALCANÇADA</b>'), g(batida).includes('>' + fmtN(Math.round(batida.acima)) + ' UEP ACIMA DA META<'), /\+\d/.test(g(batida).replace(/<svg[\s\S]*<\/svg>/, ''))],
     [true, true, true, false]);
  // v7.259.0: o cartão não depende mais do produto — sem UEP no cadastro ou
  // sem produto no app, o MESMO cartão (o aviso da v7.257.1 saiu junto)
  ok('sem UEP do produto de agora ou sem produto: o mesmo cartão, só a UEP, sem aviso',
     [g(semCad).includes('<div class="tvg-falta so"><span><b>' + fmtN(Math.round(semCad.falta)) + '</b>UEP</span></div>'),
      g(semProd).includes('<div class="tvg-falta so"><span><b>' + fmtN(Math.round(semProd.falta)) + '</b>UEP</span></div>'),
      /tvg-aviso|SEM UEP NO CADASTRO|NENHUM PRODUTO/.test(g(semCad) + g(semProd))],
     [true, true, false]);
  ok('NO TEMPO (menos de meio minuto): "0 min" e NO TEMPO, sem a linha da distância',
     [Math.abs(noTempo.difMin) < 0.5, g(noTempo).includes('<div class="tvg-min">0 min</div><div class="tvg-dir">NO TEMPO</div>'), /DO ESPERADO ·/.test(g(noTempo))], [true, true, false]);
  ok('desenho sem conta: o ACIMA DA META vem do modelo', /m\.feito - m\.meta/.test(pegaJs('function _tvGHtml(')), false);
}
ok('grade de no máximo 4 passos: com a meta de 2.530, só 1.000 e 2.000',
   [...S1502.matchAll(/text-anchor="end" class="tvg-t2">([\d.]+)</g)].map(m => m[1]), ['1.000', '2.000']);
ok('o ALMOÇO mora no pé da faixa', /y="(\d+)" text-anchor="middle" class="tvg-t2">ALMOÇO/.test(S1502) && +S1502.match(/y="(\d+)" text-anchor="middle" class="tvg-t2">ALMOÇO/)[1] > 700, true);
const CABE_G = pegaJs('function _tvUepCabe('), ENC = pegaJs('function _tvGEncaixa(');
ok('o encaixe redesenha o gráfico no tamanho da caixa, com o modelo que o ciclo deixou no corpo',
   [/_tvGEncaixa\(corpo\)/.test(CABE_G), /_tvGSvg\(a\[0\], a\[1\], \{ w:r\.width, h:r\.height \}\)/.test(ENC),
    /corpo\._tvgArgs = t === 'g' \? \[m, selo\] : null/.test(JS)], [true, true, true]);
const CSS_FG = html.split('\n').filter(l => /^(\.tv[ufg]-|#tv-slide-g \.tvg-)/.test(l) && !/^\.tvu-slide\{/.test(l) && /font-size:/.test(l));
ok('fonte das Telas F/G pela escala --tvu-k (nenhum font-size solto por vh)',
   CSS_FG.filter(l => /font-size:clamp\(/.test(l)).length, 0);
ok('o cartão cresce pelo CONTEÚDO (1 1 auto), não em fatias iguais', /^\.tvu-card\{flex:1 1 auto;/m.test(html), true);
const CABE = pegaJs('function _tvUepCabe(');
ok('o encaixe reduz a escala até TV_UEP_K_MIN e só refaz quando o tamanho muda',
   [/TV_UEP_K_MIN/.test(CABE), /_tvuTam === tam/.test(CABE), /--tvu-k/.test(CABE)], [true, true, true]);
ok('mede a ALTURA (scrollHeight) — o teste da v7.138.0 só via a largura',
   /scrollHeight > e\.clientHeight/.test(pegaJs('function _tvUepCorta(')), true);
ok('nome de produto pode cortar com "…" sem encolher a tela (Tela F; a G não mostra mais o produto)', /tvu-nome/.test(pegaJs('function _tvUepCorta(')) && /tvu-prod tvu-nome/.test(F0), true);
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
