// PRODUTOS EMBALADOS HOJE — gerencial do celular (mobile 1.39.0)
//   node produtos-dia.test.js
//
// Roda o código REAL do ritmoprod_mobile.html (a conta _pdiaMontar e o desenho
// _pdiaHtml/_pdiaDetHtml) com o rp-core.js, num contexto vm. Os dados são os
// de 04/11/2026 até as 09:41 (log da PRODUCAO_PRODUTO e cadastro do dia):
// BUFFET 4 PT PRISM 05–06h (HE), HOME ANGEL 1.8 06–09h (VOL 2/2 e depois VOL
// 1/2, duas cores), LIVREIRO ENCANTO desde 09h — 596 cx, 1.441 UEP.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const MOB = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
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
vm.runInContext('var PDIA_LARG = ' + MJS.match(/const PDIA_LARG = (\d+);/)[1] + ';', F);
['function normTxt(', 'function _escH(', 'function _pdiaVol(', 'function _pdiaBase(', 'function _pdiaCurto(',
 'function _pdiaMontar(', 'function _pdiaHtml(', 'function _pdiaDetHtml(']
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
  run('_pdiaMontar(_phm, _ph, _cat, _at, _ag, _o)', { _phm: phm, _ph: ph, _cat: CAT, _at: atual, _ag: agora, _o: o || O });

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
const outro2 = run('_pdiaMontar(_phm, _ph, _cat, "501130009", 660, _o)',
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
const desenho = pega(MJS, 'function _pdiaHtml(') + pega(MJS, 'function _pdiaDetHtml(');
ok('desenho sem conta (nada de soma nem de montagem)', /reduce\(|_pdiaMontar\(|toMin\(/.test(desenho), false);
ok('produto sem veredito: nenhum NO RITMO, verde ou vermelho no quadro',
   /NO RITMO|ABAIXO|var\(--ok\)|var\(--red\)/.test(desenho + pega(MJS, 'function _pdiaMontar(')), false);
ok('o gerencial pinta o quadro', /renderGerProdutosDia\(k\.real\)/.test(pega(MJS, 'function renderGerencial(')), true);
ok('o porHora é guardado na leitura do dia', /porHora: Array\.isArray\(json\.porHora\)/.test(pega(MJS, 'async function lerPontosDia(')), true);
const SW = fs.readFileSync(path.join(__dirname, 'sw-mobile.js'), 'utf8');
const ver = MJS.match(/const APP_VER\s*=\s*'([\d.]+)'/)[1];
ok('APP_VER e o cache do service worker andam juntos', SW.includes('// APP_VER ' + ver), true);

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exitCode = falhas ? 1 : 0;
