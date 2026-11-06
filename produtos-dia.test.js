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
['function _escH(', 'function _pdiaHtml(', 'function _pdiaDetHtml(']
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
ok('o porHora é guardado na leitura do dia', /porHora: Array\.isArray\(json\.porHora\)/.test(pega(MJS, 'async function lerPontosDia(')), true);
const SW = fs.readFileSync(path.join(__dirname, 'sw-mobile.js'), 'utf8');
const ver = MJS.match(/const APP_VER\s*=\s*'([\d.]+)'/)[1];
ok('APP_VER e o cache do service worker andam juntos', SW.includes('// APP_VER ' + ver), true);

// ── o gerencial do PC (v7.201.0): a MESMA conta, o desenho do desktop ──
console.log('\n── o gerencial do PC ──');
const G = { window: {} };
vm.createContext(G);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'), G);
['function _rpEsc(', 'function _pdiaPcCat(', 'function _pdiaPcHtml(', 'function _pdiaPcDetHtml(',
 'function renderGerProdutosDia(', 'function _pdiaPcToggle(']
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
const MP = grun('pdiaMontar(_phm, _ph, _cat, "501136001", _ag, Object.assign({}, _o, { larg: PDIA_PC_LARG, linhas: PDIA_PC_LINHAS, passo: 60 }))',
  { _phm: PHM, _ph: PH, _cat: CAT, _ag: AGORA, _o: O });
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
     [/wReal = \(Number\(el\.clientWidth\) \|\| 0\) - 32/.test(RG), /larg: wReal > 300 \? wReal : PDIA_PC_LARG, linhas: PDIA_PC_LINHAS/.test(RG), PC_LINHAS,
      /window\.addEventListener\('resize'[^\n]*renderGerProdutosDia\(\)/.test(PC_JS),
      /#ger-pdia \.pdpc-faixa\{position:relative;height:42px;/.test(PC), /#ger-pdia \.pdpc-sg\{[^}]*white-space:normal;/.test(PC), /#ger-pdia \.pdpc-sg\{[^}]*nowrap/.test(PC)],
     [true, true, 2, true, true, true, false]); }
const HP = grun('_pdiaPcHtml(_M, "")', { _M: MP });
const HPa = grun('_pdiaPcHtml(_M, _k)', { _M: MP, _k: MP.produtos[1].key });
ok('resumo: caixas, UEP, produtos e trocas',
   ['<b>596</b><i>CAIXAS</i>', '<b>1.441</b><i>UEP</i>', '<b>3</b><i>PRODUTOS</i>', '<b>2</b><i>TROCAS DE PRODUTO</i>'].every(t => HP.includes(t)), true);
ok('cobertura: todas com produto · hora extra em âmbar',
   HP.includes('Todas as 596 cx lançadas com produto · <span class="he">244 cx em hora extra</span>'), true);
ok('eixo: o "agora" escrito e a hora cheia colada nele (10) fora',
   [HP.includes('<span class="ag" style="left:'), />10<\/span>/.test(HP), />09<\/span>/.test(HP)], [true, false, true]);
ok('almoço escrito na faixa', HP.includes('ALMOÇO</div>'), true);
ok('uma linha por produto, cada uma um botão com aria-expanded',
   (HP.match(/<button type="button" class="pdpc-bt pdpc-row" onclick="_pdiaPcToggle\(\d\)" aria-expanded="false">/g) || []).length, 3);
ok('cabeçalho das colunas na ordem da prévia',
   HP.includes('<span>PRODUTO</span><span>COR</span><span>HORÁRIO</span><span class="n">CAIXAS</span><span class="n">UEP</span><span class="n">EM HE</span><span>PARTE DA UEP DO DIA</span>'), true);
ok('EM HE por produto em âmbar; sem hora extra, "—" neutro (traço não é sinal)',
   ['<span class="pdpc-u he">184</span>', '<span class="pdpc-u he">60</span>', '<span class="pdpc-u">—</span>'].every(t => HP.includes(t)), true);
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
const PC_CSS = (PC.match(/#ger-pdia[^{]*\{[^}]*\}/g) || []).join('\n');
ok('PC: pele sem verde nem vermelho', [PC_CSS.length > 0, /--ok|--red/.test(PC_CSS)], [true, false]);
ok('PC: o gerencial ao vivo pinta o quadro', /renderGerProdutosDia\(k\.real\)/.test(pega(PC_JS, 'function renderGerencial(')), true);
ok('PC: some no modo histórico e na impressão do dia',
   [PC.includes('<div class="tbl-wrap ger-live-only" id="ger-pdia">'), /#ger-semana,#ger-prox,#ger-pdia,\s*\.sec:not\(\.on\)\{ display:none!important; \}/.test(PC)], [true, true]);
ok('PC: logo abaixo dos KPIs', PC.indexOf('id="ger-pdia"') > PC.indexOf('id="kpi-grid"') && PC.indexOf('id="ger-pdia"') < PC.indexOf('id="ch-hora"'), true);

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exitCode = falhas ? 1 : 0;
