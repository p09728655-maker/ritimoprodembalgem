// PRODUTOS EMBALADOS HOJE — gerencial do celular (mobile 1.39.0) e do PC (v7.201.0)
//   node produtos-dia.test.js
//
// Roda o código REAL: a conta pdiaMontar do rp-core.js (uma só para os dois
// painéis), o desenho do celular (_pdiaHtml/_pdiaDetHtml) e o do PC
// (_pdiaPcHtml/_pdiaPcDetHtml + a leitura renderGerProdutosDia), num contexto vm. Os dados são os
// de 04/11/2026 até as 09:41 (log da PRODUCAO_PRODUTO e cadastro do dia):
// BUFFET 4 PT PRISM 05–06h (HE), HOME ANGEL 1.8 06–09h (VOL 2/2 e depois VOL
// 1/2, duas cores), LIVREIRO ENCANTO desde 09h — 596 cx, 1.441 UEP.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const MOB = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
const PC = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const PC_JS = [...PC.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const MJS = [...MOB.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function pega(src, assinatura) {
  const i = src.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei: ' + assinatura);
  const j = src.indexOf('{', src.indexOf(')', i));
  let n = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') n++;
    else if (src[k] === '}' && --n === 0) return src.slice(i, k + 1);
  }
  throw new Error('função não fecha: ' + assinatura);
}

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

const F = { window: {} };
vm.createContext(F);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'), F);
// A conta é do rp-core.js (uma só para o celular e o PC); o desenho, de cada painel.
['function _escH(', 'function _pdiaHtml(', 'function _pdiaDetHtml(', 'function _pdiaParHtml(']
  .forEach(f => vm.runInContext(pega(MJS, f), F));
const run = (expr, vars) => { Object.assign(F, vars || {}); return vm.runInContext(expr, F); };

// ── os dados reais de 04/11/2026 ──
const CAT = [
  { codigo: '501141008', desc: 'VOL 1/1 BUFFET 4 PT PRISM', cor: 'OFF WHITE/CINAMOMO' },
  { codigo: '501088001', desc: 'VOL 1/2 HOME ANGEL 1.8', cor: 'CINAMOMO/OFF WHITE' },
  { codigo: '501088002', desc: 'VOL 2/2 HOME ANGEL 1.8', cor: 'CINAMOMO/OFF WHITE' },
  { codigo: '501088003', desc: 'VOL 1/2 HOME ANGEL 1.8', cor: 'OFF WHITE/CINAMOMO' },
  { codigo: '501088004', desc: 'VOL 2/2 HOME ANGEL 1.8', cor: 'OFF WHITE/CINAMOMO' },
  { codigo: '501136001', desc: 'VOL 1/1 LIVREIRO ENCANTO', cor: 'BRANCO' },
];
const PH = [   // porHora: o log na ordem dos bipes
  { hora: '05:00', codigo: '501141008', desc: 'VOL 1/1 BUFFET 4 PT PRISM', caixas: 120 },
  { hora: '06:00', codigo: '501141008', desc: 'VOL 1/1 BUFFET 4 PT PRISM', caixas: 64 },
  { hora: '06:00', codigo: '501088002', desc: 'VOL 2/2 HOME ANGEL 1.8', caixas: 60 },
  { hora: '07:00', codigo: '501088002', desc: 'VOL 2/2 HOME ANGEL 1.8', caixas: 27 },
  { hora: '07:00', codigo: '501088004', desc: 'VOL 2/2 HOME ANGEL 1.8', caixas: 102 },
  { hora: '08:00', codigo: '501088001', desc: 'VOL 1/2 HOME ANGEL 1.8', caixas: 90 },
  { hora: '09:00', codigo: '501088003', desc: 'VOL 1/2 HOME ANGEL 1.8', caixas: 103 },
  { hora: '09:00', codigo: '501136001', desc: 'VOL 1/1 LIVREIRO ENCANTO', caixas: 30 },
];
const pm = (hora, modelo, nome, cor, caixas, uep) => ({ hora, modelo, nome, cor, caixas, uep });
const PHM = [  // porHoraModelo como o .gs monta (UEP com o cadastro de hoje)
  pm('05:00', '501141', 'BUFFET 4 PT PRISM', 'OFF WHITE/CINAMOMO', 120, 285.6),
  pm('06:00', '501141', 'BUFFET 4 PT PRISM', 'OFF WHITE/CINAMOMO', 64, 152.3),
  pm('06:00', '501088', 'HOME ANGEL 1.8', 'CINAMOMO/OFF WHITE', 60, 148.8),
  pm('07:00', '501088', 'HOME ANGEL 1.8', 'CINAMOMO/OFF WHITE', 27, 67.0),
  pm('07:00', '501088', 'HOME ANGEL 1.8', 'OFF WHITE/CINAMOMO', 102, 253.0),
  pm('08:00', '501088', 'HOME ANGEL 1.8', 'CINAMOMO/OFF WHITE', 90, 223.2),
  pm('09:00', '501088', 'HOME ANGEL 1.8', 'OFF WHITE/CINAMOMO', 103, 255.4),
  pm('09:00', '501136', 'LIVREIRO ENCANTO', 'BRANCO', 30, 56.1),
];
const O = { turnoIni: 420, turnoFim: 1020, almIni: 660, almFim: 732, real: 596 };
const AGORA = 9 * 60 + 41;
const monta = (phm, ph, atual, agora, o) =>
  run('pdiaMontar(_phm, _ph, _cat, _at, _ag, _o)', { _phm: phm, _ph: ph, _cat: CAT, _at: atual, _ag: agora, _o: o || O });

const M = monta(PHM, PH, '501136001', AGORA);

console.log('── o resumo do dia (04/11 até 09:41) ──');
ok('596 cx, 1.441 UEP, 244 cx em HE (05h e 06h), 596 da HORA_A_HORA',
   [M.cx, Math.round(M.uep), M.heCx, M.real], [596, 1441, 244, 596]);
ok('3 produtos, 2 trocas de produto (PRISM → HOME ANGEL → LIVREIRO)',
   [M.produtos.length, M.trocas], [3, 2]);

console.log('\n── a linha de cada produto, na ordem em que rodou ──');
ok('ordem do dia', M.produtos.map(p => p.nome), ['BUFFET 4 PT PRISM', 'HOME ANGEL 1.8', 'LIVREIRO ENCANTO']);
ok('caixas e UEP (arredondada)', M.produtos.map(p => [p.cx, p.uep]), [[184, 438], [382, 947], [30, 56]]);
ok('% da UEP do dia', M.produtos.map(p => p.pct), [30, 66, 4]);
ok('cor: uma pelo nome, várias pela contagem', M.produtos.map(p => p.corTxt), ['OFF WHITE/CINAMOMO', '2 cores', 'BRANCO']);
ok('horário pelas horas da planilha (início da 1ª, fim da última)',
   M.produtos.map(p => p.iniTxt + '–' + p.fimTxt), ['05:00–07:00', '06:00–10:00', '09:00–10:00']);
ok('hora extra: tudo · 60 · nada', M.produtos.map(p => p.heTxt), ['tudo em HE', '60 em HE', '']);
ok('AGORA só no produto do código de agora', M.produtos.map(p => p.agora), [false, false, true]);

console.log('\n── o detalhe: cor × volume e hora a hora ──');
const HA = M.produtos[1];
ok('HOME ANGEL: tabela com os dois volumes', HA.tab && HA.tab.vols, ['VOL 1/2', 'VOL 2/2']);
ok('HOME ANGEL: por cor, na ordem em que entraram',
   HA.tab.linhas, [{ cor: 'CINAMOMO/OFF WHITE', v: [90, 87] }, { cor: 'OFF WHITE/CINAMOMO', v: [103, 102] }]);
ok('HOME ANGEL: total por volume (193 × 189)', HA.tab.tot, [193, 189]);
ok('HOME ANGEL: hora a hora com volume e cor',
   HA.horas.map(r => [r.hora, r.d, r.cx, r.he]),
   [['06:00', 'VOL 2/2 · CINAMOMO/OFF WHITE', 60, true],
    ['07:00', 'VOL 2/2 · CINAMOMO/OFF WHITE', 27, false],
    ['07:00', 'VOL 2/2 · OFF WHITE/CINAMOMO', 102, false],
    ['08:00', 'VOL 1/2 · CINAMOMO/OFF WHITE', 90, false],
    ['09:00', 'VOL 1/2 · OFF WHITE/CINAMOMO', 103, false]]);
ok('HOME ANGEL: 2,48 UEP por caixa', HA.uepMedia.toFixed(2), '2.48');
ok('produto de um volume só: sem tabela, hora a hora pela cor',
   [M.produtos[0].tab, M.produtos[0].horas.map(r => [r.hora, r.d, r.cx])],
   [null, [['05:00', 'OFF WHITE/CINAMOMO', 120], ['06:00', 'OFF WHITE/CINAMOMO', 64]]]);

console.log('\n── a faixa da sequência ──');
const FX = M.faixa;
ok('eixo 05:00 a 17:00 (o dia começou na madrugada)', [FX.ini, FX.fim], [300, 1020]);
ok('três blocos: PRISM, HOME ANGEL, LIVREIRO (agora)', FX.segs.map(s => [s.nome, s.cls]),
   [['BUFFET 4 PT PRISM', 't0'], ['HOME ANGEL 1.8', 't1'], ['LIVREIRO ENCANTO', 'agora']]);
ok('a hora das 06 repartida pelas caixas (64 × 60): a troca às 06:31',
   Math.round(FX.segs[0].fim), 391);
ok('a hora em andamento vai só até agora (09:41)', Math.round(FX.segs[2].fim), AGORA);
ok('nome que cabe no bloco: PRISM · HOME ANGEL · nada no bloco estreito', FX.segs.map(s => s.rot), ['PRISM', 'HOME ANGEL', '']);
ok('marcas do eixo de 2 em 2 h, a 1ª com HE', FX.ticks.map(t => t.txt), ['05 HE', '07', '09', '11', '13', '15', '17']);
ok('HE de 05 a 07, almoço 11:00–12:12, agora 09:41', [FX.he, FX.alm, FX.agora], [[[300, 420]], [660, 732], AGORA]);

console.log('\n── casos de borda ──');
const dia7 = monta(PHM.slice(3), PH.slice(3), '', AGORA);
ok('dia sem madrugada: eixo 07:00 a 17:00, sem marca de HE no início',
   [dia7.faixa.ini, dia7.faixa.fim, dia7.faixa.he.length, dia7.faixa.ticks[0].txt], [420, 1020, 0, '07']);
const alt = monta(
  [pm('10:00', '501141', 'BUFFET 4 PT PRISM', 'OFF WHITE/CINAMOMO', 40, 95.2), pm('10:00', '501136', 'LIVREIRO ENCANTO', 'BRANCO', 40, 74.8)],
  [{ hora: '10:00', codigo: '501141008', desc: 'VOL 1/1 BUFFET 4 PT PRISM', caixas: 20 },
   { hora: '10:00', codigo: '501136001', desc: 'VOL 1/1 LIVREIRO ENCANTO', caixas: 20 },
   { hora: '10:00', codigo: '501141008', desc: 'VOL 1/1 BUFFET 4 PT PRISM', caixas: 20 },
   { hora: '10:00', codigo: '501136001', desc: 'VOL 1/1 LIVREIRO ENCANTO', caixas: 20 }], '', 11 * 60);
ok('A,B,A,B na mesma hora é a esteira com dois lados: 1 troca, não 3', alt.trocas, 1);
const mad = monta(PHM, PH.slice(2).concat(PH.slice(0, 2)), '501136001', AGORA);
ok('madrugada lançada depois: a ordem é a da hora, não a do lançamento',
   [mad.produtos.map(p => p.nome)[0], mad.trocas], ['BUFFET 4 PT PRISM', 2]);
const fora = monta(PHM.slice(0, 2), [PH[1], PH[0]], '', AGORA);
ok('hora a hora na ordem da hora, mesmo lançada fora de ordem',
   fora.produtos[0].horas.map(r => r.hora), ['05:00', '06:00']);
const tarde = monta([pm('16:00', '501136', 'LIVREIRO ENCANTO', 'BRANCO', 50, 93.5), pm('17:00', '501136', 'LIVREIRO ENCANTO', 'BRANCO', 40, 74.8)],
  [{ hora: '16:00', codigo: '501136001', desc: 'VOL 1/1 LIVREIRO ENCANTO', caixas: 50 },
   { hora: '17:00', codigo: '501136001', desc: 'VOL 1/1 LIVREIRO ENCANTO', caixas: 40 }], '', 18 * 60);
ok('17:00 em diante é hora extra (a janela do .gs)', [tarde.heCx, tarde.produtos[0].heTxt, tarde.faixa.fim, tarde.faixa.he], [40, '40 em HE', 1080, [[1020, 1080]]]);
const soUm = monta([pm('10:00', '501088', 'HOME ANGEL 1.8', 'CINAMOMO/OFF WHITE', 80, 198.4)],
  [{ hora: '10:00', codigo: '501088002', desc: 'VOL 2/2 HOME ANGEL 1.8', caixas: 80 }], '', 11 * 60);
ok('produto de dois volumes com um só embalado hoje: sem tabela, o volume no hora a hora',
   [soUm.produtos[0].tab, soUm.produtos[0].horas[0].d], [null, 'VOL 2/2 · CINAMOMO/OFF WHITE']);
const semUep = monta([pm('10:00', '501999', 'PRODUTO NOVO', 'BRANCO', 50, 0)],
  [{ hora: '10:00', codigo: '501999001', desc: 'VOL 1/1 PRODUTO NOVO', caixas: 50 }], '', 11 * 60);
ok('produto sem UEP: sem número inventado (null), nunca 0', [semUep.produtos[0].uep, semUep.produtos[0].pct, semUep.produtos[0].uepMedia], [null, null, null]);
const luna = monta([pm('10:00', '501130', 'MESA CENTRO LUNA 590', 'CUMARU', 50, 60), pm('11:00', '501130', 'MESA LATERAL LUNA 440', 'CUMARU', 40, 40)],
  [{ hora: '10:00', codigo: '501130005', desc: 'VOL 1/1 MESA CENTRO LUNA 590', caixas: 50 },
   { hora: '11:00', codigo: '501130009', desc: 'VOL 1/1 MESA LATERAL LUNA 440', caixas: 40 }],
  '501130009', 11 * 60 + 30);
ok('mesmo modelo, produtos diferentes (501130): o código casa pelo nome',
   [luna.produtos.map(p => p.nome), luna.produtos.map(p => p.agora)],
   [['MESA CENTRO LUNA 590', 'MESA LATERAL LUNA 440'], [false, true]]);
const outro = monta([pm('10:00', '501130', 'MESA CENTRO LUNA 590', 'CUMARU', 50, 60)],
  [{ hora: '10:00', codigo: '501130005', desc: 'VOL 1/1 MESA CENTRO LUNA 590', caixas: 50 }], '501130009', 11 * 60);
F._cat = CAT.concat([{ codigo: '501130009', desc: 'VOL 1/1 MESA LATERAL LUNA 440', cor: 'CUMARU' }]);
const outro2 = run('pdiaMontar(_phm, _ph, _cat, "501130009", 660, _o)',
  { _phm: [pm('10:00', '501130', 'MESA CENTRO LUNA 590', 'CUMARU', 50, 60)],
    _ph: [{ hora: '10:00', codigo: '501130005', desc: 'VOL 1/1 MESA CENTRO LUNA 590', caixas: 50 }] });
ok('produto de agora que ainda não embalou hoje: nenhum AGORA (nem no irmão do modelo)',
   [outro.produtos[0].agora, outro2.produtos[0].agora], [false, false]);
const vazio = monta([], [], '', AGORA, Object.assign({}, O, { real: 120 }));
ok('dia sem produto lançado: lista vazia, a HORA_A_HORA fica para o texto', [vazio.produtos.length, vazio.real], [0, 120]);

console.log('\n── o desenho ──');
const H = run('_pdiaHtml(_M, "", 0)', { _M: M });
const Habre = run('_pdiaHtml(_M, _k, 0)', { _M: M, _k: HA.key });
ok('resumo: caixas, UEP, produtos e trocas', ['596', '1.441', '3 produtos', '2 TROCAS DE PRODUTO'].every(t => H.includes(t)), true);
ok('cobertura: todas com produto · hora extra em âmbar',
   H.includes('Todas as 596 cx lançadas com produto') && H.includes('<span class="he">244 cx em hora extra</span>'), true);
const Hfora = run('_pdiaHtml(_M, "", 0)', { _M: Object.assign({}, M, { real: 650 }) });
ok('caixa sem produto: diz quantas ficaram fora da lista', Hfora.includes('596 de 650 cx com produto · 54 fora da lista'), true);
ok('AGORA na linha do produto de agora, com "desde"', H.includes('BRANCO · desde 09:00 · <span class="ag">AGORA</span>'), true);
ok('cada produto é um botão com aria-expanded', (H.match(/<button type="button" class="pdia-bt" onclick="_pdiaToggle\(\d\)" aria-expanded="false">/g) || []).length, 3);
ok('fechado: sem detalhe; aberto: tabela e hora a hora só do aberto',
   [H.includes('POR COR E VOLUME'), (Habre.match(/POR COR E VOLUME/g) || []).length, (Habre.match(/HORA A HORA/g) || []).length], [false, 1, 1]);
ok('aberto: aria-expanded true e seta virada só nele', [(Habre.match(/aria-expanded="true"/g) || []).length, (Habre.match(/pdia-it on/g) || []).length], [1, 1]);
ok('% numa coluna fixa (as barras alinham)', (H.match(/<span class="pdia-pc">\d+%<\/span>/g) || []).length, 3);
ok('faixa com rótulo acessível', H.includes('role="img" aria-label="Sequência do dia: BUFFET 4 PT PRISM 05:00 a 06:31'), true);
ok('vazio: diz que nenhuma das caixas foi lançada com produto',
   run('_pdiaHtml(_M, "", 0)', { _M: vazio }).includes('Nenhuma das 120 cx de hoje foi lançada com produto.'), true);
ok('sem leitura: "Lendo", nunca zero', run('_pdiaHtml(null, "", 0)').includes('Lendo a produção do dia'), true);
const hostil = monta([pm('10:00', '501999', '<img src=x onerror=alert(1)>', 'BRANCO', 10, 0)],
  [{ hora: '10:00', codigo: '501999001', desc: 'X', caixas: 10 }], '', 11 * 60);
ok('nome do cadastro é escapado', run('_pdiaHtml(_M, "", 0)', { _M: hostil }).includes('<img src=x'), false);

console.log('\n── guardas ──');
const CORE = fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8');
const desenho = pega(MJS, 'function _pdiaHtml(') + pega(MJS, 'function _pdiaDetHtml(');
ok('desenho sem conta (nada de soma nem de montagem)', /reduce\(|pdiaMontar\(|toMin\(/.test(desenho), false);
ok('produto sem veredito: nenhum NO RITMO, verde ou vermelho no quadro',
   /NO RITMO|ABAIXO|var\(--ok\)|var\(--red\)/.test(desenho + pega(CORE, 'function pdiaMontar(')), false);
ok('a conta mora só no rp-core.js (nenhum painel com cópia)',
   [/function _?pdiaMontar\(/.test(MJS), /function _?pdiaMontar\(/.test(PC_JS), /function pdiaMontar\(/.test(CORE)], [false, false, true]);
ok('o gerencial pinta o quadro', /renderGerProdutosDia\(k\.real\)/.test(pega(MJS, 'function renderGerencial(')), true);
ok('o porHora é guardado na leitura do dia', /porHora: Array\.isArray\(json\.porHora\)/.test(pega(MJS, 'async function _lerPontosDia(')), true);
const SW = fs.readFileSync(path.join(__dirname, 'sw-mobile.js'), 'utf8');
const ver = MJS.match(/const APP_VER\s*=\s*'([\d.]+)'/)[1];
ok('APP_VER e o cache do service worker andam juntos', SW.includes('// APP_VER ' + ver), true);

// ── o gerencial do PC (v7.201.0): a MESMA conta, o desenho do desktop ──
console.log('\n── o gerencial do PC ──');
const G = { window: {} };
vm.createContext(G);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'), G);
['function _rpEsc(', 'function _pdiaPcCat(', 'function _pdiaPcHtml(', 'function _pdiaPcDetHtml(',
 'function renderGerProdutosDia(', 'function _pdiaPcToggle(', 'function _pdiaPcParHtml(', 'function _pdiaParDoPainel(']
  .forEach(f => vm.runInContext(pega(PC_JS, f), G));
const PC_LARG = Number(PC_JS.match(/const PDIA_PC_LARG = (\d+);/)[1]);
const PC_LINHAS = Number(PC_JS.match(/const PDIA_PC_LINHAS = (\d+);/)[1]);
const gEl = {};
vm.runInContext(`
  var PDIA_PC_LARG = ${PC_LARG}, PDIA_PC_LINHAS = ${PC_LINHAS}, PDIA_PC_ABERTO = '', PDIA_PC_M = null, PDIA_PC_REAL = 0, PDIA_PC_CATPED = false;
  var CAP_RAW = null, CAP_PED = 0, PONTOS_DIA_TS = 0, PONTOS_DIA = { porHoraModelo: [], porHora: [] };
  var CFG = { turnoInicio: '07:00', turnoFim: '17:00', almocoInicio: '11:00', almocoFim: '12:12' };
  function _capDoLocal(){ return null; }
  function _capBuscar(){ CAP_PED++; return Promise.resolve(); }
  function _pontosEstadoTxt(){ return 'Lendo a produção do dia…'; }
  var _D0 = Date;
  Date = class extends _D0 { constructor(...a){ super(...(a.length ? a : [2026, 10, 4, 9, 41])); } };
`, G);
G.document = { getElementById: id => (gEl[id] = gEl[id] || { innerHTML: '', textContent: '' }) };
const grun = (expr, vars) => { Object.assign(G, vars || {}); return vm.runInContext(expr, G); };
// O PC reparte a hora da faixa pela UEP (v7.243.0, porUep) — o render passa isso.
const MP = grun('pdiaMontar(_phm, _ph, _cat, "501136001", _ag, Object.assign({}, _o, { larg: PDIA_PC_LARG, linhas: PDIA_PC_LINHAS, passo: 60, porUep: true }))',
  { _phm: PHM, _ph: PH, _cat: CAT, _ag: AGORA, _o: O });
const MPcx = grun('pdiaMontar(_phm, _ph, _cat, "501136001", _ag, Object.assign({}, _o, { larg: PDIA_PC_LARG, linhas: PDIA_PC_LINHAS, passo: 60 }))',
  { _phm: PHM, _ph: PH, _cat: CAT, _ag: AGORA, _o: O });
console.log('\n── A UEP NA FRENTE (v7.243.0): a UEP em hora extra e a faixa pela UEP ──');
ok('a UEP feita em hora extra, por produto e no total (a PRISM toda de madrugada; 60 cx da HOME ANGEL)',
   [MP.produtos.map(p => [p.he, p.uepHe]), Math.round(MP.uepHe), Math.round(MP.uep - MP.uepHe)], [[[184, 438], [60, 149], [0, 0]], 587, 855]);
ok('sem o porUep (o celular) a faixa é a de antes, pelas caixas: troca às 06:31',
   [Math.round(MPcx.faixa.segs[0].fim * 10) / 10, Math.round(M.faixa.segs[0].fim * 10) / 10], [391, 391]);
ok('com o porUep a hora das 06:00 é repartida pela UEP: a HOME ANGEL (2,48/cx) pesa mais que a PRISM (2,38/cx) → troca às 06:30',
   Math.round(MP.faixa.segs[0].fim * 10) / 10, 390.3);
ok('nada mais muda com o porUep: caixas, UEP, trocas, ordem, % e o fim da faixa',
   [MP.cx, MP.uep, MP.trocas, MP.produtos.map(p => p.nome), MP.produtos.map(p => p.pct), MP.faixa.segs.length, MP.faixa.segs[2].fim],
   [MPcx.cx, MPcx.uep, MPcx.trocas, MPcx.produtos.map(p => p.nome), MPcx.produtos.map(p => p.pct), MPcx.faixa.segs.length, MPcx.faixa.segs[2].fim]);
{ // produto sem UEP na hora: a hora inteira volta às caixas (nunca mistura as duas réguas)
  const phm2 = PHM.map(x => /PRISM/.test(x.nome) ? Object.assign({}, x, { uep: 0 }) : x);   // a PRISM sem UEP nenhuma
  const A = grun('pdiaMontar(_phm, _ph, _cat, "501136001", _ag, Object.assign({}, _o, { porUep: true }))', { _phm: phm2, _ph: PH, _cat: CAT, _ag: AGORA, _o: O });
  const B = grun('pdiaMontar(_phm, _ph, _cat, "501136001", _ag, _o)', { _phm: phm2, _ph: PH, _cat: CAT, _ag: AGORA, _o: O });
  ok('um produto da hora sem UEP nenhuma: a hora volta inteira às caixas (troca às 06:31, como sem o porUep)',
     [A.faixa.segs[0].fim, Math.round(A.faixa.segs[0].fim * 10) / 10], [B.faixa.segs[0].fim, 391]); }
ok('a mesma conta do celular: caixas, UEP, HE, trocas e parte da UEP',
   [MP.cx, Math.round(MP.uep), MP.heCx, MP.trocas, MP.produtos.map(p => p.pct)], [M.cx, Math.round(M.uep), M.heCx, M.trocas, M.produtos.map(p => p.pct)]);
ok('faixa do PC: uma marca por hora e o nome inteiro cabe (no celular, PRISM)',
   [MP.faixa.ticks.map(t => t.txt).slice(0, 6), MP.faixa.segs[0].rot, M.faixa.segs[0].rot],
   [['05 HE', '06', '07', '08', '09', '10'], 'BUFFET 4 PT PRISM', 'PRISM']);
// v7.215.0 (PPCP, print de 06/11 com um bloco escrito só "MEL": "se precisar quebra nome do produto")
ok('nome em 2 linhas sem partir palavra: PENTEADEIRA / CAMARIM MEL num bloco de 90 px; em 1 linha (o celular) só MEL; estreito demais para PENTEADEIRA, CAMARIM MEL',
   [grun('pdiaCurto("PENTEADEIRA CAMARIM MEL", 90, 2)'), grun('pdiaCurto("PENTEADEIRA CAMARIM MEL", 90)'), grun('pdiaCurto("PENTEADEIRA CAMARIM MEL", 70, 2)'),
    grun('pdiaCurto("PENT CAMARIM 1PT 2GAV DIAMANTE", 110, 2)'), grun('pdiaCurto("BUFFET 4 PT PRISM", 60, 2)'), grun('pdiaCurto("X", 5, 2)')],
   ['PENTEADEIRA CAMARIM MEL', 'MEL', 'CAMARIM MEL', 'PENT CAMARIM 1PT 2GAV DIAMANTE', 'BUFFET 4 PT PRISM', '']);
ok('2 linhas sem espaço para o nome todo: o fim do nome antes da última palavra (CAMARIM MEL, não só MEL); com 1 linha, a regra de antes',
   [grun('pdiaCurto("PENTEADEIRA CAMARIM MEL", 63, 2)'), grun('pdiaCurto("PENT CAMARIM 1PT 2GAV DIAMANTE", 63, 2)'), grun('pdiaCurto("PENTEADEIRA CAMARIM MEL", 63)'),
    grun('pdiaCurto("HOME RIPADO SUPREMO 1.8", 50, 2)'), grun('pdiaCurto("LIVREIRO ENCANTO", 40, 2)')],
   ['CAMARIM MEL', '1PT 2GAV DIAMANTE', 'MEL', 'RIPADO SUPREMO', '']);
ok('1 linha é a regra de antes (o celular não muda): o nome inteiro só se couber numa linha',
   [grun('pdiaCurto("BUFFET 4 PT PRISM", 108)'), grun('pdiaCurto("BUFFET 4 PT PRISM", 107)'), grun('pdiaCurto("BUFFET 4 PT PRISM", 107, 1)'), grun('pdiaCurto("HOME ANGEL 1.8", 70)')],
   ['BUFFET 4 PT PRISM', 'BUFFET PT PRISM', 'BUFFET PT PRISM', 'HOME ANGEL']);
{ const RG = pega(PC_JS, 'function renderGerProdutosDia(');
  ok('o PC mede a faixa desta tela (sem medida, os 1.100 px), passa 2 linhas e redesenha quando a janela muda; a faixa mais alta e o nome quebra',
     [/wReal = \(Number\(el\.clientWidth\) \|\| 0\) - 32/.test(RG), /const larg = wReal > 300 \? wReal : PDIA_PC_LARG;[\s\S]*larg, linhas: PDIA_PC_LINHAS/.test(RG), PC_LINHAS,
      /window\.addEventListener\('resize'[^\n]*renderGerProdutosDia\(\)/.test(PC_JS),
      /#ger-pdia \.pdpc-faixa\{position:relative;height:42px;/.test(PC), /#ger-pdia \.pdpc-sg\{[^}]*white-space:normal;/.test(PC), /#ger-pdia \.pdpc-sg\{[^}]*nowrap/.test(PC)],
     [true, true, 2, true, true, true, false]); }
const HP = grun('_pdiaPcHtml(_M, "")', { _M: MP });
const HPa = grun('_pdiaPcHtml(_M, _k)', { _M: MP, _k: MP.produtos[1].key });
ok('resumo: a UEP primeiro, com a jornada (a do card UEP DO DIA) + a hora extra, e depois caixas, produtos e trocas',
   ['<div class="pdpc-n big"><b>1.441</b><i>UEP</i>', '<em>855 na jornada + <span>586 em hora extra</span></em>',
    '<div class="pdpc-n sec"><b>596</b><i>CAIXAS</i>', '<b>3</b><i>PRODUTOS</i>', '<b>2</b><i>TROCAS DE PRODUTO</i>'].every(t => HP.includes(t))
   && HP.indexOf('<i>UEP</i>') < HP.indexOf('<i>CAIXAS</i>'), true);
ok('a divisão fecha com o total: 855 + 586 = 1.441 (a soma das linhas)', 855 + 586, MP.produtos.reduce((s, p) => s + p.uep, 0));
ok('rp-core antigo (sem uepHe): o total, sem a divisão',
   (h => h.includes('<b>1.441</b><i>UEP</i>') && !h.includes('na jornada'))(grun('_pdiaPcHtml(_M, "")', { _M: Object.assign({}, MP, { uepHe: undefined, produtos: MP.produtos.map(p => Object.assign({}, p, { uepHe: undefined })) }) })), true);
ok('cobertura: todas com produto · hora extra em âmbar',
   HP.includes('Todas as 596 cx lançadas com produto · <span class="he">244 cx em hora extra</span>'), true);
ok('eixo: o "agora" escrito e a hora cheia colada nele (10) fora',
   [HP.includes('<span class="ag" style="left:'), />10<\/span>/.test(HP), />09<\/span>/.test(HP)], [true, false, true]);
ok('almoço escrito na faixa', HP.includes('ALMOÇO</div>'), true);
ok('uma linha por produto, cada uma um botão com aria-expanded',
   (HP.match(/<button type="button" class="pdpc-bt pdpc-row" onclick="_pdiaPcToggle\(\d\)" aria-expanded="false">/g) || []).length, 3);
ok('cabeçalho das colunas: a UEP antes das caixas, com o peso da caixa (UEP/CX) — a prévia de 13/11',
   /<span>PRODUTO<\/span><span>COR<\/span><span>HORÁRIO<\/span><span class="n">UEP<\/span><span class="n"[^>]*>UEP\/CX<\/span><span class="n">CAIXAS<\/span><span class="n"[^>]*>EM HE · UEP<\/span><span>PARTE DA UEP DO DIA<\/span>/.test(HP), true);
ok('a UEP é o número grande da linha; o UEP/CX com duas casas; as caixas depois',
   ['<span class="pdpc-uu">438</span>', '<span class="pdpc-u">2,38</span>', '<span class="pdpc-cx">184</span>', '<span class="pdpc-uu">947</span>', '<span class="pdpc-u">2,48</span>'].every(t => HP.includes(t)), true);
ok('EM HE em UEP e em âmbar (as caixas no title); sem hora extra, "—" neutro (traço não é sinal)',
   ['<span class="pdpc-u he" title="184 cx em hora extra">438</span>', '<span class="pdpc-u he" title="60 cx em hora extra">149</span>', '<span class="pdpc-u">—</span>'].every(t => HP.includes(t)), true);
ok('rp-core antigo (sem uepHe): o EM HE volta às caixas, escrito "cx"',
   grun('_pdiaPcHtml(_M, "")', { _M: Object.assign({}, MP, { produtos: MP.produtos.map(p => Object.assign({}, p, { uepHe: undefined })) }) }).includes('title="184 cx em hora extra">184 cx</span>'), true);
ok('o render do PC passa o porUep', /porUep: true \}\);/.test(pega(PC_JS, 'function renderGerProdutosDia(')), true);
ok('AGORA no horário do produto de agora', HP.includes('desde 09:00 · <span class="ag">AGORA</span>'), true);
ok('% numa coluna fixa (as barras alinham)', (HP.match(/<span class="pdpc-pc">\d+%<\/span>/g) || []).length, 3);
ok('fechado: sem detalhe; aberto: tabela e hora a hora só do aberto',
   [HP.includes('POR COR E VOLUME'), (HPa.match(/POR COR E VOLUME/g) || []).length, (HPa.match(/HORA A HORA/g) || []).length, (HPa.match(/pdpc-it on/g) || []).length],
   [false, 1, 1, 1]);
ok('sem leitura: o estado da leitura do dia, nunca zero', grun('_pdiaPcHtml(null, "")'), '<div class="pdpc-vazio">Lendo a produção do dia…</div>');
ok('vazio: diz que nenhuma das caixas foi lançada com produto',
   grun('_pdiaPcHtml(_M, "")', { _M: vazio }).includes('Nenhuma das 120 cx de hoje foi lançada com produto.'), true);
ok('nome do cadastro é escapado', grun('_pdiaPcHtml(_M, "")', { _M: hostil }).includes('<img src=x'), false);
// A leitura: sem a 1ª resposta do getPontosDia é "lendo" (o PONTOS_DIA nasce vazio).
grun('renderGerProdutosDia(596)');
ok('antes da 1ª leitura: estado, não "nenhuma caixa"', [gEl['ger-pdia-corpo'].innerHTML.includes('Lendo'), gEl['ger-pdia-ts'].textContent], [true, '']);
grun('PONTOS_DIA = { porHoraModelo: _phm, porHora: _ph, produtoAtual: "501136001", produtoAtualDesc: "VOL 1/1 LIVREIRO ENCANTO" }; CAP_RAW = _cat; PONTOS_DIA_TS = new Date(2026, 10, 4, 9, 40).getTime(); renderGerProdutosDia(596)',
  { _phm: PHM, _ph: PH, _cat: CAT });
ok('com a leitura: o quadro, a hora da lista e o AGORA pelo produto do turno',
   [gEl['ger-pdia-corpo'].innerHTML === HP, gEl['ger-pdia-ts'].textContent], [true, 'lista de 09:40']);
grun('renderGerProdutosDia()');
ok('sem argumento mantém as caixas da HORA_A_HORA', grun('PDIA_PC_REAL'), 596);
// O cadastro é lido no clique só sem nenhum neste computador, e uma vez por sessão.
grun('CAP_RAW = null; _pdiaPcToggle(1); _pdiaPcToggle(1); _pdiaPcToggle(1); _pdiaPcToggle(0)');
ok('sem cadastro: lê no clique, uma vez só', grun('CAP_PED'), 1);
grun('CAP_RAW = _cat; PDIA_PC_CATPED = false; CAP_PED = 0; _pdiaPcToggle(2)', { _cat: CAT });
ok('com cadastro: nenhuma leitura no clique', grun('CAP_PED'), 0);
const desPC = pega(PC_JS, 'function _pdiaPcHtml(') + pega(PC_JS, 'function _pdiaPcDetHtml(');
ok('PC: desenho sem conta (nada de soma nem de montagem)', /reduce\(|pdiaMontar\(|toMin\(/.test(desPC), false);
ok('PC: produto sem veredito: nenhum NO RITMO, verde ou vermelho no quadro', /NO RITMO|ABAIXO|var\(--ok\)|var\(--red\)/.test(desPC), false);
const PC_REGRAS = PC.match(/#ger-pdia[^{]*\{[^}]*\}/g) || [];
// v7.236.0: as PARADAS têm vermelho (a não programada é perda); o PRODUTO continua sem veredito.
const PAR_RE = /\.pdpc-(par|pb|pst|pleg)\b/;
const PC_CSS = PC_REGRAS.filter(r => !PAR_RE.test(r)).join('\n'), PAR_CSS = PC_REGRAS.filter(r => PAR_RE.test(r)).join('\n');
ok('PC: pele do produto sem verde nem vermelho', [PC_CSS.length > 0, /--ok|--red/.test(PC_CSS)], [true, false]);
ok('PC: pele das paradas com o vermelho e sem verde', [PAR_CSS.length > 0, /--red/.test(PAR_CSS), /--ok/.test(PAR_CSS)], [true, true, false]);
ok('PC: o gerencial ao vivo pinta o quadro', /renderGerProdutosDia\(k\.real\)/.test(pega(PC_JS, 'function renderGerencial(')), true);
ok('PC: some no modo histórico e na impressão do dia',
   [PC.includes('<div class="tbl-wrap ger-live-only" id="ger-pdia">'), /#ger-semana,#ger-prox,#ger-pdia,\s*\.sec:not\(\.on\)\{ display:none!important; \}/.test(PC)], [true, true]);
ok('PC: logo abaixo dos KPIs', PC.indexOf('id="ger-pdia"') > PC.indexOf('id="kpi-grid"') && PC.indexOf('id="ger-pdia"') < PC.indexOf('id="ch-hora"'), true);

// ── AS PARADAS NA FAIXA (v7.236.0) ──
// PPCP, 13/11/2026: "no timeline colocar as paradas". Roda a conta (_pdiaParMontar),
// a leitura (_pdiaParDoPainel / lerParadasDoDia) e o desenho (_pdiaPcParHtml) reais.
console.log('\n── as paradas na faixa do PC ──');
vm.runInContext(fs.readFileSync(path.join(__dirname, 'paradas-calc.js'), 'utf8'), G);
G.RP_PARADAS = G.window.RP_PARADAS;
['function _fmtMinPar(', 'function _pdiaParDoPainel(', 'function _pdiaParPrecisa(',
 'function lerParadasDoDia(', 'function _pdiaPcParHtml(', 'function _pdiaParVelha(', 'function _pdiaParOcupada(',
 'function _pdiaParSeVelha(', 'function _uepDepoisDe(']
  .forEach(f => vm.runInContext(pega(PC_JS, f), G));
vm.runInContext(`
  var PDIA_PAR_TTL = ${Number(PC_JS.match(/const PDIA_PAR_TTL = ([\d* ]+);/)[1].split('*').reduce((a, b) => a * Number(b), 1))};
  var PDIA_PAR = null, PDIA_PAR_FALHA = '', _pdiaParVoo = null, PDIA_PC_P = null;
  var PAR_CLASSE_MAP = { 'Café': 'PLANEJADA' }, PAR_CLASSE_LOADED = true, GER_DATA = null, _ABA = 'gerencial', _TV = false;
  var JSONP = [], JSONP_RESP = [], _cicloVoo = null, _parBusy = false, _UEP_LENDO = false, _TQ = [];
  function _uepLendo(){ return _UEP_LENDO; }
  function _carregarClassesPar(){ return Promise.resolve(); }
  function _modoDir(){ return false; }
  function _paradaNaTV(){ return _TV; }
  function _abaOn(t){ return t === _ABA; }
  function jsonpFetch(url){ JSONP.push(url); const r = JSONP_RESP.shift(); return r instanceof Error ? Promise.reject(r) : Promise.resolve(r); }
  function setTimeout(fn, ms){ if(ms === 500){ _TQ.push(fn); return 0; } fn(); return 0; }   // a fila do _uepDepoisDe fica na mão
`, G);
const CFGP = { turnoInicio: '07:00', turnoFim: '17:00', almocoInicio: '11:00', almocoFim: '12:12' };
const PARADAS = [
  { tipo: 'Troca de produto', ini: '05:58:10', fim: '06:09:40', obs: '' },
  { tipo: 'Café', ini: '08:00:00', fim: '08:15:00', obs: '' },
  { tipo: 'Parada/Empilhar peças', ini: '08:39:02', fim: '08:39:47', obs: 'pilha alta' },
  { tipo: 'Robô', ini: '04:30', fim: '04:45', obs: '' },                                 // antes da faixa: na soma, sem marca
  { tipo: 'Limpeza', ini: '07:10', fim: '07:10', obs: 'encerrada automaticamente' },     // FIM = INÍCIO: fora de tudo
  { tipo: 'X', ini: '', fim: '' },                                                       // sem horário: fora
  { tipo: 'A INFORMAR', ini: '09:30:00', fim: '', obs: '' },                             // aberta: até agora, fora da soma
];
const parO = (lista, F, larg, agoraTxt) => grun('pdiaParMontar(_l, _F, { R: RP_PARADAS, cfg: _cfg, classeMap: PAR_CLASSE_MAP, agoraTxt: _ag, larg: _lg })',
  { _l: lista, _F: F, _cfg: CFGP, _ag: agoraTxt || '09:41:00', _lg: larg || 1100 });
const PP = parO(PARADAS, MP.faixa);
const ST = grun('RP_PARADAS.stats(_l, { cfg: _cfg, classeMap: PAR_CLASSE_MAP })', { _l: PARADAS, _cfg: CFGP });
ok('os totais fecham com o RP_PARADAS.stats (o TEMPO TOTAL PARADO da aba PARADAS): nº, minutos e não programados',
   [PP.n, Math.round(PP.min * 100), Math.round(PP.minNP * 100)], [ST.nParadas, Math.round(ST.totMin * 100), Math.round(ST.totMinNP * 100)]);
ok('4 encerradas, 42m15s no total (15 min de café programado fora do não programado)', [PP.n, grun('_fmtMinPar(_m)', { _m: PP.min }), grun('_fmtMinPar(_m)', { _m: PP.minNP })], [4, '42m15s', '27m15s']);
ok('marcas na faixa: troca, café, microparada e a aberta (a de antes da faixa, a de zero e a sem horário fora)',
   PP.segs.map(s => s.cls), ['np', 'pl', 'np', 'np ab']);
ok('a aberta vai até agora e diz isso', [PP.aberta.ini, PP.aberta.nome, Math.round(PP.aberta.min), PP.segs[3].fim, PP.segs[3].tit],
   ['09:30', 'A INFORMAR (motivo pendente no app)', 11, 581, 'A INFORMAR (motivo pendente no app) · 09:30–agora · 11 min até agora · EM ANDAMENTO · NÃO PROGRAMADA']);
ok('o motivo no title, com o horário em HH:mm e a duração do paradas-calc',
   PP.segs[2].tit, 'Parada/Empilhar peças · 08:39–08:39 · 45 s · NÃO PROGRAMADA · pilha alta');
ok('a duração escrita só na marca que cabe (a 1.100 px nenhuma; a 3.000 px a troca, o café e a aberta)',
   [PP.segs.map(s => s.rot), parO(PARADAS, MP.faixa, 3000).segs.map(s => s.rot)], [['', '', '', ''], ['11m30s', '15 min', '', '11 min']]);
{ // o almoço sai da marca e da soma; parada toda no almoço some
  const FA = { ini: 300, fim: 1020 };
  const PA = parO([{ tipo: 'Manutenção', ini: '10:50', fim: '12:20' }, { tipo: 'Robô', ini: '11:10', fim: '11:50' }], FA, 4000, '16:00:00');
  ok('parada que atravessa o almoço: duas marcas (10:50–11:00 e 12:12–12:20), 18 min na soma; a de dentro do almoço fora',
     [PA.segs.map(s => [s.ini, s.fim]), PA.n, PA.min, PA.segs.map(s => s.rot)], [[[650, 660], [732, 740]], 1, 18, ['18 min', '']]);
}
const HPP = grun('_pdiaPcHtml(_M, "", _P)', { _M: MP, _P: PP });
ok('desenho: a faixa de paradas entre a sequência e o eixo, uma marca por parada',
   [HPP.indexOf('class="pdpc-par"') > HPP.indexOf('class="pdpc-faixa"'), HPP.indexOf('class="pdpc-par"') < HPP.indexOf('class="pdpc-eixo"'),
    (HPP.match(/class="pdpc-pb /g) || []).length], [true, true, 4]);
ok('linha embaixo: o total, os não programados, a parada de agora e a legenda',
   ['<b>4 paradas · 42m15s</b> (27m15s não programadas)', '● PARADA AGORA desde 09:30 · A INFORMAR (motivo pendente no app) · 11 min',
    '<i class="np"></i>não programada <i class="pl"></i>programada'].every(t => HPP.includes(t)), true);
ok('sem parada nenhuma: diz isso, nunca faixa vazia calada',
   grun('_pdiaPcHtml(_M, "", _P)', { _M: MP, _P: parO([], MP.faixa) }).includes('<b>nenhuma parada apontada hoje</b>'), true);
ok('sem as paradas (null): o quadro de antes, sem faixa nem linha', [grun('_pdiaPcHtml(_M, "", null)', { _M: MP }) === HP, HP.includes('pdpc-par')], [true, false]);
ok('tipo e motivo escapados', grun('_pdiaPcHtml(_M, "", _P)', { _M: MP, _P: parO([{ tipo: '<img src=x>', ini: '08:00', fim: '08:30', obs: '<b>' }], MP.faixa) }).includes('<img src=x>'), false);
{ // revisão da v7.236.0: o motivo vai em ATRIBUTO (title e aria-label) — aspas não podem abrir o atributo
  const HQ = grun('_pdiaPcHtml(_M, "", _P)', { _M: MP, _P: parO([{ tipo: 'Outros', ini: '09:00', fim: '09:10', obs: 'x" onmouseover="alert(1)' },
    { tipo: "Robô", ini: '08:00', fim: '08:05', obs: "rolo de 12\" quebrou e 'parou'" }], MP.faixa) });
  ok('motivo com aspas: nenhum atributo aberto (title e aria-label com &quot;)',
     [/onmouseover="/.test(HQ), HQ.includes('x&quot; onmouseover=&quot;alert(1)'), HQ.includes('rolo de 12&quot; quebrou e &#39;parou&#39;'),
      (HQ.match(/<div class="pdpc-pb [^"]*" style="[^"]*" title="[^"]*">/g) || []).length], [false, true, true, 2]); }
{ // revisão: o relógio deste aparelho atrás do INÍCIO gravado pelo celular — a aberta não some
  const PA = parO([{ tipo: 'Outros', ini: '09:45:00', fim: '', obs: '' }], MP.faixa, 1100, '09:41:00');
  ok('aberta com o relógio deste aparelho atrás: continua PARADA AGORA (zero), sem marca e fora do total',
     [PA.aberta && PA.aberta.ini, PA.aberta && PA.aberta.min, PA.segs.length, PA.n], ['09:45', 0, 0, 0]);
  ok('a linha diz PARADA AGORA, nunca "nenhuma parada apontada hoje"',
     [grun('_pdiaPcHtml(_M, "", _P)', { _M: MP, _P: PA }).includes('● PARADA AGORA desde 09:45'), grun('_pdiaPcHtml(_M, "", _P)', { _M: MP, _P: PA }).includes('nenhuma parada')], [true, false]);
  const PL = parO([{ tipo: 'Café', ini: '08:00', fim: '08:15', obs: '' }], MP.faixa);
  ok('todas programadas: sem "(0 s não programadas)"', grun('_pdiaPcHtml(_M, "", _P)', { _M: MP, _P: PL }).includes('não programadas'), false);
}
ok('hora digitada com um dígito sai HH:mm (8:05:30 → 08:05), nunca "8:05:"',
   parO([{ tipo: 'Outros', ini: '8:05:30', fim: '8:20:00', obs: '' }], MP.faixa).segs[0].tit, 'Outros · 08:05–08:20 · 14m30s · NÃO PROGRAMADA');
// A leitura: VAZIO NÃO É UMA COISA SÓ (lendo × falhou × sem módulo × sem Apps Script).
const estado = () => { const P = grun('_pdiaParDoPainel(_F, 1100, "09:41:00")', { _F: MP.faixa }); return P && (P.estado + ':' + (P.txt || '')); };
grun('CFG.sheetsUrl = ""');
ok('sem Apps Script: sem faixa', estado(), null);
grun('CFG.sheetsUrl = "https://x/exec"; window.RP_PARADAS = null');
ok('sem o paradas-calc: diz isso', estado(), 'sem-modulo:o módulo das paradas não carregou — recarregue o painel');
grun('window.RP_PARADAS = RP_PARADAS; PDIA_PAR = null; PDIA_PAR_FALHA = ""');
ok('antes da 1ª leitura: lendo', estado(), 'lendo:lendo as paradas de hoje…');
grun('PDIA_PAR_FALHA = "sem-resposta"');
ok('a leitura falhou: diz isso', estado(), 'falha:paradas não lidas — o painel tenta de novo no próximo ciclo');
grun('PDIA_PAR = { dia: "03/11/2026", ts: 1, lista: _l }; PDIA_PAR_FALHA = ""', { _l: PARADAS });
ok('a lista de ontem não vale para hoje', estado(), 'lendo:lendo as paradas de hoje…');
grun('PDIA_PAR = { dia: "04/11/2026", ts: new Date(2026, 10, 4, 9, 40).getTime(), lista: _l }; PDIA_PAR_FALHA = "sem-resposta"', { _l: PARADAS });
{ const P = grun('_pdiaParDoPainel(_F, 1100, "09:41:00")', { _F: MP.faixa });
  ok('falhou com a de hoje na mão: mostra a de hoje e diz que não atualizou',
     [P.estado, P.velho, grun('_pdiaPcHtml(_M, "", _P)', { _M: MP, _P: P }).includes('⚠ não atualizou — lidas às 09:40')], ['ok', true, true]); }
{ // revisão: "não atualizou" pelo intervalo de atualização do painel (1–60 min), não 10 min fixos
  const v = (min, int) => grun('window._intervaloMin = _i; PDIA_PAR.ts = Date.now() - _m * 60000; PDIA_PAR_FALHA = ""; _pdiaParDoPainel(_F, 1100, "09:41:00").velho',
    { _i: int, _m: min, _F: MP.faixa });
  ok('lista velha = mais de dois ciclos: 5 min → 11 min já é velha; 15 min → 12 min não é, 31 min é', [v(9, 5), v(11, 5), v(12, 15), v(31, 15)], [false, true, false, true]);
  grun('window._intervaloMin = undefined; PDIA_PAR.ts = new Date(2026, 10, 4, 9, 40).getTime()');
}
// o render passa as paradas ao quadro, e o clique no produto não as perde
grun('PDIA_PAR_FALHA = ""; PDIA_PC_ABERTO = ""; CAP_RAW = _cat; renderGerProdutosDia(596)', { _cat: CAT });
ok('render: o quadro com a faixa de paradas', [gEl['ger-pdia-corpo'].innerHTML.includes('class="pdpc-par"'), (gEl['ger-pdia-corpo'].innerHTML.match(/class="pdpc-pb /g) || []).length], [true, 4]);
grun('_pdiaPcToggle(0)');
ok('abrir um produto mantém a faixa de paradas', gEl['ger-pdia-corpo'].innerHTML.includes('class="pdpc-par"'), true);
grun('_pdiaPcToggle(0); CFG.sheetsUrl = ""');
// lerParadasDoDia: só com o gerencial ao vivo; 2 tentativas em sequência; nunca apaga a de hoje na falha
const _asinc = [];
_asinc.push((async () => {
  grun('CFG.sheetsUrl = "https://x/exec"; JSONP = []; _ABA = "uep"');
  const r1 = await grun('lerParadasDoDia()');
  grun('_ABA = "gerencial"; GER_DATA = "03/11/2026"');
  const r2 = await grun('lerParadasDoDia()');
  grun('GER_DATA = null; _TV = true');
  const r3 = await grun('lerParadasDoDia()');
  ok('fora do gerencial ao vivo (outra aba, dia passado, TV): nenhuma leitura', [r1, r2, r3, grun('JSONP.length')], [null, null, null, 0]);
  grun('_TV = false; PDIA_PAR = null; JSONP_RESP = [new Error("Timeout"), { ok: true, paradas: _l }]', { _l: PARADAS });
  const r4 = await grun('lerParadasDoDia()');
  ok('a 1ª não respondeu, a 2ª leu: guarda a lista de hoje', [r4, grun('JSONP.length'), /action=getParadas$/.test(grun('JSONP[0]')), grun('PDIA_PAR.dia'), grun('PDIA_PAR.lista.length'), grun('PDIA_PAR_FALHA')],
     [true, 2, true, '04/11/2026', 7, '']);
  grun('JSONP = []; JSONP_RESP = [new Error("Timeout"), { ok: false, erro: "x" }]');
  const r5 = await grun('lerParadasDoDia()');
  ok('as duas falharam: diz a falha e mantém a lista de hoje', [r5, grun('JSONP.length'), grun('PDIA_PAR_FALHA'), grun('PDIA_PAR.lista.length')], [false, 2, 'erro', 7]);
  grun('JSONP = []; JSONP_RESP = [{ ok: true, paradas: [] }]');
  const [a, b] = await Promise.all([grun('lerParadasDoDia()'), grun('lerParadasDoDia()')]);
  ok('dois pedidos juntos viram UMA leitura (voo compartilhado)', [a, b, grun('JSONP.length')], [true, true, 1]);
  // abrir o GERENCIAL com a lista velha: espera o que estiver no ar (o ciclo, a aba PARADAS, a ⚖ UEP)
  grun('JSONP = []; _TQ = []; PDIA_PAR.ts = Date.now() - PDIA_PAR_TTL - 1; _cicloVoo = {}; JSONP_RESP = [{ ok: true, paradas: _l }]', { _l: PARADAS });
  grun('_pdiaParSeVelha()');
  const n1 = grun('JSONP.length');
  grun('_cicloVoo = null; _parBusy = true; _TQ.shift()()');
  const n2 = grun('JSONP.length');
  grun('_parBusy = false; _UEP_LENDO = true; _TQ.shift()()');
  const n3 = grun('JSONP.length');
  grun('_UEP_LENDO = false; _TQ.shift()()');
  await grun('_pdiaParVoo');
  ok('abrir o GERENCIAL com a lista velha: espera o ciclo, a aba PARADAS e a ⚖ UEP, e só então lê', [n1, n2, n3, grun('JSONP.length'), grun('_TQ.length')], [0, 0, 0, 1, 0]);
  grun('JSONP = []; PDIA_PAR.ts = Date.now(); _pdiaParSeVelha()');
  ok('com a lista nova, não lê', [grun('JSONP.length'), grun('_TQ.length')], [0, 0]);
  grun('PDIA_PAR.ts = Date.now() - PDIA_PAR_TTL - 1; _cicloVoo = {}; _pdiaParSeVelha(); PDIA_PAR.ts = Date.now(); _cicloVoo = null; _TQ.shift()()');
  ok('o ciclo que estava no ar já leu: não lê de novo', grun('JSONP.length'), 0);
})());
const desPar = pega(PC_JS, 'function _pdiaPcParHtml(');
ok('desenho das paradas sem conta', /reduce\(|horaMin\(|durProdutiva\(|ehPlanejada\(|toMin\(|stats\(/.test(desPar), false);
{ const PM = pega(CORE, 'function pdiaParMontar(');
  ok('a régua é a do paradas-calc (durProdutiva e ehPlanejada), nunca uma conta de perda',
     [/R\.durProdutiva\(/.test(PM), /R\.ehPlanejada\(/.test(PM), /perdaDeMin|perdaAoRitmo|perdaBrutaDeMin/.test(PM)], [true, true, false]);
  ok('a conta das paradas mora só no rp-core.js (nenhum painel com cópia) e os dois painéis a chamam',
     [/function _?pdiaParMontar\(/.test(MJS), /function _?pdiaParMontar\(/.test(PC_JS), /pdiaParMontar\(PARADAS_HOJE, F,/.test(MJS), /pdiaParMontar\(PDIA_PAR\.lista, F,/.test(PC_JS),
      /'pdiaParMontar'/.test(CORE)], [false, false, true, true, true]); }
{ const CIC = pega(PC_JS, 'function _cicloLeitura(');
  ok('no ciclo: depois da leitura do dia e do gerencial, uma de cada vez',
     CIC.indexOf('lerPontosDia()') < CIC.indexOf('renderGerencial()') && CIC.indexOf('renderGerencial()') < CIC.indexOf('lerParadasDoDia()'), true);
  ok('só o gerencial ao vivo lê', /_abaOn\('gerencial'\) && !GER_DATA/.test(pega(PC_JS, 'function _pdiaParPrecisa(')), true);
  ok('abrir o GERENCIAL relê a lista velha', /if\(tab==='gerencial'\) _pdiaParSeVelha\(\)/.test(pega(PC_JS, 'function setTab(')), true);
  ok('o ciclo marca que está no ar e desmarca no fim (até na falha)',
     [/const v=_cicloVoo=_parDepois\(_ls\)/.test(CIC), /\.catch\(\(\)=>\{\}\)\s*\.then\(\(\)=>\{ if\(_cicloVoo===v\) _cicloVoo=null; \}\);/.test(CIC)], [true, true]); }

// ── as paradas na faixa do CELULAR (1.49.0): a MESMA conta, o PARADAS_HOJE do ciclo ──
console.log('\n── as paradas na faixa do celular ──');
vm.runInContext(fs.readFileSync(path.join(__dirname, 'paradas-calc.js'), 'utf8'), F);
F.RP_PARADAS = F.window.RP_PARADAS;
['function _pdiaParDoPainel(', 'function _pdiaParVer(', 'function renderGerProdutosDia(', 'function _pdiaToggle(',
 'function _pontosDiaDeHoje(', 'function _pontosDiaVazio(', 'async function carregarParadas(', 'function _parFalhouLeitura(']
  .forEach(f => vm.runInContext(pega(MJS, f), F));
vm.runInContext(`
  var CFG = { sheetsUrl: 'https://x/exec', turnoInicio: '07:00', turnoFim: '17:00', almocoInicio: '11:00', almocoFim: '12:12' };
  var PARADAS_HOJE = [], PARADAS_HOJE_TS = 0, PARADAS_HOJE_DIA = '', PARADAS_HOJE_FALHA = false, PAR_CLASSE_MAP_M = { 'Café': 'PLANEJADA' };
  var PAR_DET_ABERTO = false, _MUDOU = 0, _ROLOU = 0, _SEL = { value: '7' };
  function mudarPeriodoParadas(){ _MUDOU++; }
  function aplicarDetalheParadas(){}
  var _ELM = { innerHTML: '', clientWidth: 360 }, PDIA_ABERTO = '', PDIA_M = null, PDIA_P = null, PDIA_REAL = 0, PRODUTOS = [], PROD_ATUAL = '';
  var PONTOS_DIA = { porHoraModelo: [], porHora: [] };
  var _parEscrevendo = false, _paradaLocalAberta = null, _JR = [], _QUEBRA = '', _RENDERS = 0;
  function jsonpFetch(){ const r = _JR.shift(); return r instanceof Error ? Promise.reject(r) : Promise.resolve(r); }
  function _aplicarFechadasLocais(l){ return l; }
  function _rq(n){ if(_QUEBRA === n) throw new Error('quebrou ' + n); }
  function renderParadasList(){ _rq('lista'); } function renderParadaEstado(){} function renderParadaEdit(){}
  function atualizarBadgeParadas(){} function renderGerParada(){ _rq('banner'); } function renderGerParadasResumo(){}
  var document = { getElementById: id => id === 'par-periodo' ? _SEL : (id === 'ger-par-lbl' ? { scrollIntoView(){ _ROLOU++; } } : (id === 'ger-pdia' ? _ELM : null)) };
  var _D0m = Date;
  Date = class extends _D0m { constructor(...a){ super(...(a.length ? a : [2026, 10, 4, 9, 41])); } };
`, F);
const mEst = () => { const P = run('_pdiaParDoPainel(_F, 340, "09:41:00")', { _F: M.faixa }); return P && (P.estado + ':' + (P.txt || '')); };
ok('celular: antes da 1ª leitura das paradas, lendo (nunca "nenhuma")', mEst(), 'lendo:lendo as paradas de hoje…');
run('PARADAS_HOJE_FALHA = true');
ok('celular: a leitura falhou, diz isso', mEst(), 'falha:paradas não lidas — o app tenta de novo');
run('PARADAS_HOJE = _l; PARADAS_HOJE_TS = 1; PARADAS_HOJE_DIA = "03/11/2026"; PARADAS_HOJE_FALHA = false', { _l: PARADAS });
ok('celular: a lista de ontem não vale para hoje', mEst(), 'lendo:lendo as paradas de hoje…');
run('PARADAS_HOJE_DIA = "04/11/2026"; PARADAS_HOJE_TS = new Date(2026, 10, 4, 9, 40).getTime()');
const PM1 = run('_pdiaParDoPainel(_F, 340, "09:41:00")', { _F: M.faixa });
const PPm = grun('pdiaParMontar(_l, _F, { R: RP_PARADAS, cfg: _cfg, classeMap: PAR_CLASSE_MAP, agoraTxt: "09:41:00", larg: 340 })', { _l: PARADAS, _F: MP.faixa, _cfg: CFGP });
ok('celular e PC: a MESMA conta (marcas, totais e a aberta)',
   [PM1.segs.map(s => s.cls), PM1.n, PM1.min, PM1.minNP, PM1.aberta.ini], [PPm.segs.map(s => s.cls), PPm.n, PPm.min, PPm.minNP, PPm.aberta.ini]);
const HMP = run('_pdiaHtml(_M, "", 0, _P)', { _M: M, _P: PM1 });
ok('celular: a faixa de paradas entre a sequência e o eixo, uma marca por parada',
   [HMP.indexOf('class="pdia-par"') > HMP.indexOf('class="pdia-faixa"'), HMP.indexOf('class="pdia-par"') < HMP.indexOf('class="pdia-eixo"'),
    (HMP.match(/class="pdia-pb /g) || []).length], [true, true, 4]);
ok('celular: a linha das paradas é um botão que leva às PARADAS DO DIA, com o total e a parada de agora',
   ['<button type="button" class="pdia-pleg" onclick="_pdiaParVer()">', '<b>4 paradas · 42m15s</b> (27m15s não prog.)', '● PARADA AGORA desde 09:30 · A INFORMAR</span>', 'VER ›'].every(t => HMP.includes(t)), true);
ok('celular: sem as paradas (null), o quadro de antes', run('_pdiaHtml(_M, "", 0, null)', { _M: M }) === run('_pdiaHtml(_M, "", 0)', { _M: M }), true);
ok('celular: tipo e motivo escapados (só no aria — no celular não há title)',
   run('_pdiaHtml(_M, "", 0, _P)', { _M: M, _P: run('_pdiaParDoPainel(_F, 340, "09:41:00")', { _F: M.faixa, PARADAS_HOJE: [{ tipo: '<img src=x>', ini: '08:00', fim: '08:30', obs: '<b>' }] }) }).includes('<img src=x>'), false);
run('PARADAS_HOJE = _l', { _l: PARADAS });
run('PONTOS_DIA = { porHoraModelo: _phm, porHora: _ph }; PRODUTOS = _cat; PROD_ATUAL = "501136001"; renderGerProdutosDia(596)', { _phm: PHM, _ph: PH, _cat: CAT });
ok('celular: o render passa as paradas ao quadro', [run('_ELM.innerHTML').includes('class="pdia-par"'), (run('_ELM.innerHTML').match(/class="pdia-pb /g) || []).length], [true, 4]);
run('_pdiaToggle(0)');
ok('celular: abrir um produto mantém a faixa de paradas', [run('_ELM.innerHTML').includes('pdia-it on'), run('_ELM.innerHTML').includes('class="pdia-par"')], [true, true]);
run('_pdiaToggle(0)');
{ // revisão: na virada do dia, a leitura de ontem não vale (o carregarParadas redesenha o quadro a cada 90 s)
  run('PONTOS_DIA = { porHoraModelo: _phm, porHora: _ph, lidoEm: new Date(2026, 10, 3, 16, 50).getTime() }; renderGerProdutosDia()', { _phm: PHM, _ph: PH });
  ok('celular: produtos de ontem nunca com as paradas de hoje (virada do dia)', [run('_ELM.innerHTML').includes('pdia-par'), run('_ELM.innerHTML').includes('Lendo a produção do dia')], [false, true]);
  run('PONTOS_DIA = { porHoraModelo: _phm, porHora: _ph }; renderGerProdutosDia()', { _phm: PHM, _ph: PH });
}
_asinc.push((async () => {   // o carregarParadas REAL: só a leitura marca falha; o redesenho no erro não escapa
  run('PARADAS_HOJE_TS = 0; PARADAS_HOJE_DIA = ""; PARADAS_HOJE_FALHA = false; _JR = [{ ok: true, paradas: _l }]; _QUEBRA = ""', { _l: PARADAS });
  await run('carregarParadas()');
  const a = [run('PARADAS_HOJE_TS > 0'), run('PARADAS_HOJE_DIA'), run('PARADAS_HOJE_FALHA'), run('_ELM.innerHTML').includes('class="pdia-par"')];
  run('PARADAS_HOJE_TS = 0; _JR = [{ ok: true, paradas: _l }]; _QUEBRA = "banner"', { _l: PARADAS });
  await run('carregarParadas()');
  const b = [run('PARADAS_HOJE_TS > 0'), run('PARADAS_HOJE_FALHA')];
  run('_JR = [new Error("Timeout")]; _QUEBRA = ""');
  await run('carregarParadas()');
  const c = [run('PARADAS_HOJE_FALHA'), run('_ELM.innerHTML').includes('⚠ não atualizou')];
  run('_JR = [{ ok: false }]; PARADAS_HOJE_FALHA = false');
  await run('carregarParadas()');
  const d = run('PARADAS_HOJE_FALHA');
  // o redesenho quebrando dentro da falha não pode escapar (o REGISTRAR/START espera o carregarParadas)
  run('_JR = [new Error("Timeout")]; _RGP = renderGerProdutosDia; renderGerProdutosDia = function(){ throw new Error("x"); }');
  let escapou = false; try{ await run('carregarParadas()'); }catch(e){ escapou = true; }
  run('renderGerProdutosDia = _RGP; PARADAS_HOJE_FALHA = false');
  ok('celular: a leitura boa marca dia e hora e redesenha a faixa', a, [true, '04/11/2026', false, true]);
  ok('celular: leitura boa com um desenho quebrado NÃO vira "não atualizou"', b, [true, false]);
  ok('celular: sem resposta ou ok:false → falha dita, com a lista de hoje mantida', [c, d], [[true, true], true]);
  ok('celular: o redesenho que quebra na falha não escapa do carregarParadas', escapou, false);
})());
run('_pdiaParVer()');
ok('celular: o toque põe as PARADAS DO DIA em Hoje, abre o detalhe e rola até lá', [run('_SEL.value'), run('_MUDOU'), run('PAR_DET_ABERTO'), run('_ROLOU')], ['0', 1, true, 1]);
run('_pdiaParVer()');
ok('celular: já em Hoje, não recarrega o período', run('_MUDOU'), 1);
{ const CP = pega(MJS, 'async function carregarParadas(');
  ok('celular: a leitura das paradas marca o dia e a hora e redesenha a faixa; falhou, diz e redesenha',
     [/PARADAS_HOJE_TS = Date\.now\(\); PARADAS_HOJE_DIA = hojeStr\(\); PARADAS_HOJE_FALHA = false; leu = true;/.test(CP), (CP.match(/renderGerProdutosDia\(\)/g) || []).length,
      (CP.match(/_parFalhouLeitura\(\)/g) || []).length, /if\(!leu\) _parFalhouLeitura\(\);/.test(CP)], [true, 1, 2, true]); }
{ const MR = (MOB.match(/^\.pdia[^{]*\{[^}]*\}/gm) || []);
  const PR = /\.pdia-(par|pb|pst|pleg)\b/;
  ok('celular: pele do produto sem verde nem vermelho; o vermelho só nas paradas',
     [MR.filter(r => !PR.test(r)).length > 10, /--ok|--red/.test(MR.filter(r => !PR.test(r)).join('\n')), /--red/.test(MR.filter(r => PR.test(r)).join('\n')), /--ok/.test(MR.filter(r => PR.test(r)).join('\n'))],
     [true, false, true, false]); }
ok('celular: desenho das paradas sem conta', /reduce\(|horaMin\(|durProdutiva\(|ehPlanejada\(|toMin\(|stats\(/.test(pega(MJS, 'function _pdiaParHtml(')), false);
ok('celular: o desenho do produto continua sem verde nem vermelho', /var\(--ok\)|var\(--red\)/.test(pega(MJS, 'function _pdiaHtml(') + pega(MJS, 'function _pdiaParHtml(')), false);

Promise.all(_asinc).catch(e => { falhas++; console.log('  ❌ o teste assíncrono quebrou: ' + e.message); }).then(() => {
  console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
  process.exitCode = falhas ? 1 : 0;
});
process.exitCode = 1;   // teste assíncrono que não termina não sai 0
