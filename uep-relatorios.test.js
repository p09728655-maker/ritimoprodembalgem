// Teste dos relatórios gerenciais de UEP da aba ⚖ UEP (v7.139.0):
//   🖨 FILA DE CRONOANÁLISE e 🖨 CAIXAS × UEP.
//   node uep-relatorios.test.js
//
// Roda as contas e o desenho REAIS do ritmoprod_embalagem_v7.html. O caso de
// CAIXAS × UEP usa os 18 dias fechados reais de 21/09 a 16/10/2026 (HISTORICO
// da planilha de produção): o achado que motivou o relatório fica preso aqui.

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const JS = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function fecha(i, abre, fechaCh) {
  let n = 0;
  for (let k = i; k < JS.length; k++) {
    if (JS[k] === abre) n++;
    else if (JS[k] === fechaCh && --n === 0) return k;
  }
  throw new Error('não fecha a partir de ' + i);
}
function pegaJs(assinatura) {
  const i = JS.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei no HTML: ' + assinatura);
  return JS.slice(i, fecha(JS.indexOf('{', JS.indexOf(')', i)), '{', '}') + 1);
}
// const NOME = <expressão>; — objeto/array por chaves, template por crases, resto até o ';'
function pegaConst(nome) {
  const m = new RegExp('const ' + nome + '\\s*=\\s*').exec(JS);
  if (!m) throw new Error('constante sumiu do painel: ' + nome);
  const i = m.index + m[0].length, c = JS[i];
  const fim = c === '{' ? fecha(i, '{', '}') + 1 : c === '[' ? fecha(i, '[', ']') + 1
    : c === '`' ? JS.indexOf('`', i + 1) + 1 : JS.indexOf(';', i);
  return JS.slice(i, fim);
}

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

global.window = global;
require('vm').runInThisContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'));
['UEP_MIN_DIAS', 'UEP_BASE', 'UEP_TRAVADA_DESDE', 'APP_NOME', 'APP_NOME_CX', 'GPX_DIAS',
 'FILA_AMOSTRA_DE',
 'CXU_DIAS', 'CXU_FOLGA', '_CXU_PORQUE', '_filaN2br', 'CXU_FORA_MIN', 'CXU_COR', 'DIR_COB_MIN', 'UEP_REF_STATUS', 'UEP_REF_MOTIVO']
  .forEach(c => { global[c] = eval('(' + pegaConst(c) + ')'); });
['function _uepEhBase(', 'function _taktUep(', 'function _taktTxt(', 'function _rpEsc(', 'function _cartNum(', 'function _qpRealDia(', 'function _capVol(', 'function _capNome(',
 'function _cartQtdAberta(', 'function _tvF2(', 'function _filaAmostraDeItens(',
 'function _qpOscilacao(', 'function _cxuJanela(', 'function _cxuPtsDoPeriodo(',
 'function _cxUepMontar(', 'function _cxuSvg(', 'function _cxuTese(', 'function _cxuProva(', 'function _cxUepHtml(', 'function _cxuCxPorProduto(',
 'function _cxuResumoHtml(', 'function _cxuRefTrechos(', 'function _cxuRefHtml(', 'function _cxuConclusoes(', 'function _cxuCapTese(', 'function _cxuDecidir(']
  .forEach(f => eval.call(global, pegaJs(f)));

// ════════════════════════════════════════════════════════════════════════════
console.log('\n── a amostra do GRAVAR (a régua das 📏 RÉGUAS) ──');
// v7.216.0: a 🖨 FILA DE CRONOANÁLISE antiga (provisória, estimada, no limite da esteira,
// família incoerente) saiu — a impressão é a AGENDA DA CRONOANÁLISE (o O QUE MEDIR, abaixo).
// Ficou a amostra, que a régua usa.
ok('a FILA antiga saiu (a conta, o desenho e os motivos)', [/function _filaCronoMontar\(|function _filaCronoHtml\(|const FILA_MOTIVOS|function _filaUteis\(/.test(JS)], [false]);
ok('a amostra conta DIAS distintos e soma as caixas (cores juntas)',
   _filaAmostraDeItens([{ data: '01/10/2026', modelo: '501059', nome: 'PENTEADEIRA CAMARIM STRASS', caixas: 100 },
                        { data: '01/10/2026', modelo: '501059', nome: 'PENTEADEIRA CAMARIM STRASS', caixas: 50 },
                        { data: '02/10/2026', modelo: '501059', nome: 'PENTEADEIRA CAMARIM STRASS', caixas: 30 }]),
   { '501059|PENTEADEIRA CAMARIM STRASS': { dias: 2, cx: 180 } });
const A = pegaJs('async function _filaAmostra(');
ok('a amostra guarda e devolve o PREP_PERIODO e o PH_UEP_PROD da aba PRODUÇÃO/HORA',
   /const prep = PREP_PERIODO, uepProd = PH_UEP_PROD/.test(A) && /finally\{ PREP_PERIODO = prep; PH_UEP_PROD = uepProd; \}/.test(A), true);
ok('a amostra vai do começo do log até a TRAVA, com cache de um dia', [/UEP_TRAVADA_DESDE \|\| hojeStr\(\)/.test(A), /FILA_LS_TTL/.test(A)], [true, true]);

// ════════════════════════════════════════════════════════════════════════════
console.log('\n── CAIXAS × UEP: os 18 dias reais de 21/09 a 16/10/2026 ──');
const D = (d, real, meta, heCx, uep) => ({ data: d + '/2026', real, meta, heCx, uep, metaUep: 2530, fonte: 'sheets' });
const HIST = [D('21/09', 1794, 1800, 0, 2823.2), D('22/09', 1579, 1250, 245, 2767.8), D('23/09', 1180, 1228, 153, 2502.5),
  D('24/09', 1844, 1243, 348, 2830.1), D('25/09', 1921, 1550, 198, 2703.6), D('28/09', 995, 1150, 0, 2179.6),
  D('29/09', 1778, 1750, 0, 3402), D('30/09', 2209, 2700, 0, 2561.5), D('01/10', 2696, 2250, 0, 2886.1),
  D('02/10', 1097, 1400, 0, 2392.6), D('06/10', 1421, 1299, 0, 2863.5), D('07/10', 1268, 1200, 0, 2871.3),
  D('08/10', 1241, 1000, 0, 3159.4), D('09/10', 1683, 1650, 0, 2496.1), D('13/10', 2651, 1750, 0, 2615.4),
  D('14/10', 1849, 2250, 0, 2897.7), D('15/10', 1640, 2700, 0, 2751.1), D('16/10', 1971, 2350, 0, 3115.8)];
const R = _cxUepMontar(HIST, 20261019, 30);
ok('18 dias: 13 com o mesmo veredito, 5 com caixas ABAIXO e UEP no ritmo, nenhum o contrário',
   [R.n, R.iguais, R.cxAbaixo, R.uepAbaixo], [18, 13, 5, 0]);
ok('e os 5 vieram da META em caixas acima da capacidade em UEP (não do ritmo)',
   R.dias.filter(d => d.tipo === 'cx-abaixo').map(d => [d.data.slice(0, 5), d.porque]),
   [['23/09', 'meta-alta'], ['30/09', 'meta-alta'], ['14/10', 'meta-alta'], ['15/10', 'meta-alta'], ['16/10', 'meta-alta']]);
const d16 = R.dias.find(d => d.data === '16/10/2026');
ok('16/10: 83,9% em caixas, 123,2% em UEP; a meta de 2.350 cx no mix do dia pedia 146,8% da meta UEP',
   [fmtP(d16.pctCx), fmtP(d16.pctU), fmtP(d16.pctMetaCx)], ['83,9%', '123,2%', '146,8%']);
ok('hora extra fora das caixas (22/09: 1.579 − 245)', R.dias.find(d => d.data === '22/09/2026').cx, 1334);
ok('veredito pela régua do selo (sc)', [d16.clsCx, d16.clsU], ['red', 'ok']);

console.log('\n── CAIXAS × UEP: bordas ──');
const R2 = _cxUepMontar([D('18/10', 900, 1000, 0, 2600), D('19/10', 1, 1000, 0, 2600), D('10/09', 900, 1000, 0, 2600),
                         D('17/10', 900, 1000, 0, null), D('16/10', 1200, 1000, 0, 2100)], 20261019, 30);
ok('hoje fora, mais de 30 dias fora, dia sem UEP fora (não vira zero)', R2.dias.map(d => d.data.slice(0, 5)), ['16/10', '18/10']);
ok('caixas no ritmo e UEP abaixo, com a meta em caixas leve para o mix',
   [R2.dias[0].tipo, R2.dias[0].porque], ['uep-abaixo', 'meta-baixa']);

console.log('\n── CAIXAS × UEP: o desenho ──');
const HC = _cxUepHtml(R, { data: '19/10/2026', hora: '08:00' });
ok('o veredito usa as palavras do selo (slRitmo) e a leitura diz de onde veio a divergência',
   [HC.includes('ABAIXO DO RITMO'), HC.includes('O vermelho veio da META (da programação), não do ritmo da linha')], [true, true]);
ok('o motivo da divergência sai EM NÚMERO (16/10: a meta em caixas pedia 146,8% da referência de UEP)',
   HC.includes(_CXU_PORQUE['meta-alta'] + ' · pedia 146,8%'), true);
ok('o desenho não faz conta', /_cxUepMontar\(|uepDiaMeta\(|_qpRealDia\(/.test(pegaJs('function _cxUepHtml(')), false);
// v7.187.1: a mesma impressão estava nas duas abas — o 🖨 CAIXAS × PONTOS × UEP
// ficou só na 📏 RÉGUAS. v7.207.0: a RÉGUAS é sub-aba da ⚖ UEP e o 🖨 mora no
// menu 🖨 IMPRIMIR ▾ dela — um botão só, e nenhum caminho para a aba que saiu.
ok('a FILA e o CAIXAS × PONTOS × UEP no menu da ⚖ UEP (um botão só, que fecha o menu); nenhum caminho para a aba que saiu',
   [/<section id="sec-uep"[\s\S]*?onclick="_uepImpFecha\(\);gerarRelatorioFilaCrono\(\)"[\s\S]*?<\/section>/.test(html), (html.match(/gerarRelatorioCxUep\(_regN\(\)\)"/g) || []).length,
    /<details class="ucv-imp" id="uep-imp">[\s\S]*?onclick="_uepImpFecha\(\);gerarRelatorioCxUep\(_regN\(\)\)"[\s\S]*?<\/details>/.test(html), /setTab\('reguas'\)/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))],
   [true, 1, true, false]);
ok('cartão sem status não herda o vermelho do relatório de paradas',
   [/\.fila-doc /.test(JS), /\.cxu-doc \.kpi-card\{border-left-color:#cbd5e0\}/.test(JS)], [false, true]);   // v7.216.0: a pele da FILA antiga saiu

// ════════════════════════════════════════════════════════════════════════════
// CAIXAS × PONTOS × UEP (v7.184.0, PPCP 29/10/2026: "ver antes e depois para ter
// argumento de mudar para UEP"). Os 20 dias fechados reais de 29/09 a 28/10/2026:
// HISTORICO (caixas de jornada, UEP gravada) + os PONTOS gravados no log
// (PRODUCAO_PRODUTO), só a jornada 07:00–17:00. Os números esperados foram
// calculados FORA do painel (python sobre a planilha), não pela função.
console.log('\n── CAIXAS × PONTOS × UEP: os 20 dias reais de 29/09 a 28/10/2026 ──');
{
const PTS = {"29/09":{"pts":192089.0,"cx":1778},"30/09":{"pts":172236.0,"cx":2209},"01/10":{"pts":161784.0,"cx":2696},"02/10":{"pts":153986.0,"cx":1097},"06/10":{"pts":215088.0,"cx":1421},"07/10":{"pts":172992.0,"cx":1268},"08/10":{"pts":238058.0,"cx":1241},"09/10":{"pts":216665.0,"cx":1683},"13/10":{"pts":110176.0,"cx":2651},"14/10":{"pts":201665.0,"cx":1849},"15/10":{"pts":137981.0,"cx":1640},"16/10":{"pts":190470.0,"cx":1971},"19/10":{"pts":195516.0,"cx":1509},"20/10":{"pts":183164.0,"cx":2041},"21/10":{"pts":177536.0,"cx":1004},"22/10":{"pts":208880.0,"cx":1960},"23/10":{"pts":177275.0,"cx":1483},"26/10":{"pts":212521.0,"cx":1263},"27/10":{"pts":261115.0,"cx":1972},"28/10":{"pts":157429.0,"cx":2141}};
// os itens do getProducaoModeloPeriodo: um por dia, com a HE separada (pontosHe)
const ITENS = Object.keys(PTS).map(d => ({ data: d + '/2026', modelo: '501149', caixas: PTS[d].cx, pontos: PTS[d].pts + 1000, pontosHe: 1000 }));
const DU = (d, real, meta, heCx, uep, mu) => ({ data: d + '/2026', real, meta, heCx, uep, metaUep: mu || 2530, fonte: 'sheets' });
const HOUT = [DU('29/09', 1778, 1750, 0, 3402), DU('30/09', 2209, 2700, 0, 2561.5), DU('01/10', 2696, 2250, 0, 2886.1),
  DU('02/10', 1097, 1400, 0, 2392.6), DU('06/10', 1421, 1299, 0, 2863.5), DU('07/10', 1268, 1200, 0, 2871.3),
  DU('08/10', 1241, 1000, 0, 3159.4), DU('09/10', 1683, 1650, 0, 2496.1), DU('13/10', 2651, 1750, 0, 2615.4),
  DU('14/10', 1849, 2250, 0, 2897.7), DU('15/10', 1640, 2700, 0, 2751.1), DU('16/10', 1971, 2350, 0, 3115.8),
  DU('19/10', 1509, 1157, 0, 2940.2), DU('20/10', 2041, 2500, 0, 2625.7), DU('21/10', 1004, 2200, 0, 2113.7),
  DU('22/10', 1960, 1550, 0, 3064.3), DU('23/10', 1483, 1550, 0, 2755.9), DU('26/10', 1263, 1500, 0, 2761.6),
  DU('27/10', 1972, 2850, 180, 2868.5, 2761), DU('28/10', 2141, 1250, 286, 2656.9, 2761)];
const PMr = _cxuPtsDoPeriodo(ITENS), PM = PMr.dias;
ok('pontos de JORNADA = pontos − pontos em hora extra, por dia; sem o pontosCad, a tabela é a GRAVADA', [PM['29/09/2026'].pts, PM['28/10/2026'].cx, PMr.tabela], [192089, 2141, 'gravada']);
// .gs v5.41 (?ptsCad=1): os mesmos dias, com os pontos também na TABELA DE HOJE
// (log real × a tabela de 29/10/2026, calculado fora do painel).
const TAB = {"29/09":{"cad":201017.5,"cadHe":0,"grav":192089.0,"gravHe":0,"cx":1778},"30/09":{"cad":183729.6,"cadHe":0,"grav":172236.0,"gravHe":0,"cx":2209},"01/10":{"cad":169182.0,"cadHe":0,"grav":161784.0,"gravHe":0,"cx":2696},"02/10":{"cad":162143.6,"cadHe":0,"grav":153986.0,"gravHe":0,"cx":1097},"06/10":{"cad":222695.0,"cadHe":0,"grav":215088.0,"gravHe":0,"cx":1421},"07/10":{"cad":177298.3,"cadHe":0,"grav":172992.0,"gravHe":0,"cx":1268},"08/10":{"cad":246881.5,"cadHe":0,"grav":238058.0,"gravHe":0,"cx":1241},"09/10":{"cad":230459.1,"cadHe":0,"grav":216665.0,"gravHe":0,"cx":1683},"13/10":{"cad":112274.9,"cadHe":0,"grav":110176.0,"gravHe":0,"cx":2651},"14/10":{"cad":214444.8,"cadHe":0,"grav":201665.0,"gravHe":0,"cx":1849},"15/10":{"cad":142220.8,"cadHe":0,"grav":137981.0,"gravHe":0,"cx":1640},"16/10":{"cad":194978.7,"cadHe":0,"grav":190470.0,"gravHe":0,"cx":1971},"19/10":{"cad":203141.7,"cadHe":0,"grav":195516.0,"gravHe":0,"cx":1509},"20/10":{"cad":191634.2,"cadHe":0,"grav":183164.0,"gravHe":0,"cx":2041},"21/10":{"cad":184312.6,"cadHe":0,"grav":177536.0,"gravHe":0,"cx":1004},"22/10":{"cad":219637.7,"cadHe":0,"grav":208880.0,"gravHe":0,"cx":1960},"23/10":{"cad":187429.9,"cadHe":0,"grav":177275.0,"gravHe":0,"cx":1483},"26/10":{"cad":224729.8,"cadHe":0,"grav":212521.0,"gravHe":0,"cx":1263},"27/10":{"cad":303926.7,"cadHe":29361.2,"grav":289167.0,"gravHe":28052.0,"cx":1972},"28/10":{"cad":236345.8,"cadHe":73557.9,"grav":224925.0,"gravHe":67496.0,"cx":2141}};
const ITH = Object.keys(TAB).map(d => ({ data: d + '/2026', modelo: '501149', caixas: TAB[d].cx, pontos: TAB[d].grav, pontosHe: TAB[d].gravHe, pontosCad: TAB[d].cad, pontosCadHe: TAB[d].cadHe }));
const PHr = _cxuPtsDoPeriodo(ITH), PH = PHr.dias;
ok('com o pontosCad: pontos na TABELA DE HOJE, menos os da hora extra (28/10: 236.345,8 − 73.557,9)', [PHr.tabela, Math.round(PH['28/10/2026'].pts * 10) / 10], ['hoje', 162787.9]);
ok('um item sem pontosCad: a tabela de hoje não vale para o período (nunca meio a meio)', _cxuPtsDoPeriodo(ITH.slice(0, 3).concat([ITENS[3]])).tabela, 'gravada');
ok('item sem pontosHe (backend antes da v5.20): não separa a jornada → null, nunca rateia',
   _cxuPtsDoPeriodo([{ data: '01/10/2026', caixas: 10, pontos: 100 }]), null);
ok('janela: 30 dias antes de hoje, hoje fora', _cxuJanela(20261029, 30), { iniNum: 20260929, de: '29/09/2026', ate: '28/10/2026' });
const RP = _cxUepMontar(HOUT, 20261029, 30, { pts: PM, tabela: 'gravada', metaPts: null, trava: '16/10/2026' });
const G = RP.reguas, f1 = x => Math.round(x * 10) / 10;
ok('20 dias, os mesmos para as três réguas', [RP.n, G.n], [20, 20]);
ok('oscilação dia a dia: CAIXAS 26,9% · PONTOS 18,5% · UEP 10,4% — a UEP é a que menos varia com o mix',
   [f1(G.cx.osc), f1(G.pts.osc), f1(G.uep.osc)], [26.9, 18.5, 10.4]);
ok('depois da trava (16/10), 8 dias que não entraram na UEP: 22,4% · 16,1% · 10,5%',
   [G.nFora, f1(G.cx.oscFora), f1(G.pts.oscFora), f1(G.uep.oscFora)], [8, 22.4, 16.1, 10.5]);
ok('média por dia de jornada', [Math.round(G.cx.media), Math.round(G.pts.media), Math.round(G.uep.media)], [1721, 186831, 2790]);
ok('sem META DE PONTOS: pontos sem veredito (só a oscilação)', [G.pts.noRitmo, G.pts.discorda, RP.metaPts, RP.dias[0].clsP], [null, null, false, null]);
ok('o gráfico: cada dia em % da média da régua (a média do índice é 100)',
   [Math.round(RP.serie.reduce((a, s) => a + s.uep, 0) / RP.serie.length), RP.serie.filter(s => s.fora).length], [100, 8]);
const RPH = _cxUepMontar(HOUT, 20261029, 30, { pts: PH, tabela: 'hoje', metaPts: null, trava: '16/10/2026' });
ok('na tabela de hoje: pontos ±19,0% (depois da trava ±16,5%); caixas e UEP iguais',
   [f1(RPH.reguas.pts.osc), f1(RPH.reguas.pts.oscFora), f1(RPH.reguas.cx.osc), f1(RPH.reguas.uep.osc), RPH.ptsTabela], [19.0, 16.5, 26.9, 10.4, 'hoje']);
// META de exemplo (NÃO é a do PPCP, que não entra no repositório): 190.000 × 1,046
const RM = _cxUepMontar(HOUT, 20261029, 30, { pts: PH, tabela: 'hoje', metaPts: 198740, trava: '16/10/2026' });
const RMG = _cxUepMontar(HOUT, 20261029, 30, { pts: PM, tabela: 'gravada', metaPts: 198740, trava: '16/10/2026' });
ok('a meta NÃO julga os pontos gravados (seriam 9 abaixo, 16/10 e 20/10 só pela troca de tabela): sem veredito e diz por quê',
   [RMG.metaPts, RMG.metaSemTabela, RMG.ptsAbaixo, RMG.dias[0].clsP], [false, true, 0, null]);
ok('com meta: 11 dias com pontos no ritmo, 18 com UEP; 7 com UEP no ritmo e pontos abaixo',
   [RM.reguas.pts.noRitmo, RM.reguas.uep.noRitmo, RM.ptsAbaixo, RM.ptsAcima], [11, 18, 7, 0]);
ok('e os 7 pelo mix de VALOR do dia (batendo a meta de UEP, faltariam pontos)',
   RM.dias.filter(d => d.tipoP === 'pts-abaixo').map(d => [d.data.slice(0, 5), d.porqueP]),
   ['30/09', '01/10', '07/10', '13/10', '15/10', '23/10', '28/10'].map(d => [d, 'pts-barato']));
ok('sem os pontos (leitura falhou), caixas × UEP como sempre (12 iguais, 8 com caixas abaixo — conferido fora do painel)', (() => {
  const R0 = _cxUepMontar(HOUT, 20261029, 30), R1 = _cxUepMontar(HOUT, 20261029, 30, { pts: null, trava: '16/10/2026' });
  return [R0.iguais, R0.cxAbaixo, R1.iguais, R1.cxAbaixo, R1.reguas.pts, R1.reguas.n];
})(), [12, 8, 12, 8, null, 20]);
ok('dia sem item no período: pontos null (não zero) e fora da base das três réguas', (() => {
  const pm = Object.assign({}, PM); delete pm['21/10/2026'];
  const r = _cxUepMontar(HOUT, 20261029, 30, { pts: pm, tabela: 'gravada' });
  return [r.dias.find(d => d.data === '21/10/2026').pts, r.reguas.n];
})(), [null, 19]);

console.log('\n── CAIXAS × PONTOS × UEP: o desenho ──');
const HP = _cxUepHtml(RP, { data: '29/10/2026', hora: '08:00' }), HM = _cxUepHtml(RM, { data: '29/10/2026', hora: '08:00' });
ok('sem a capacidade (sem o D): resumo, desvios e dados, cada um em folha nova',
   [HP.indexOf('1 ▸ RESUMO GERENCIAL') > 0, HP.indexOf('1 ▸ RESUMO GERENCIAL') < HP.indexOf('2 ▸ ANÁLISE DOS DESVIOS'), HP.indexOf('2 ▸ ANÁLISE DOS DESVIOS') < HP.indexOf('3 ▸ DADOS E CRITÉRIOS'),
    (HP.match(/cxu-quebra/g) || []).length], [true, true, true, 2]);
ok('sem a capacidade, as conclusões apontam os desvios na página 2 (não na 3)', [HP.includes('referência de UEP — página 2.'), HP.includes('página 3')], [true, false]);
ok('a frase sai do dado: a que menos variou, e as outras duas com o número',
   HP.includes('A <b>UEP</b> é a régua que menos varia de um dia para o outro: <b>±10,4%</b>, contra ±18,5% dos pontos e ±26,9% das caixas.'), true);
ok('a prova diz que, depois da trava, a UEP só muda por cronoanálise (tempo medido, não a produção do dia) — v7.188.1',
   [HP.includes('ela saiu do ritmo da própria linha até 16/10; depois disso só muda por cronoanálise — o tempo medido do produto, não a produção do dia.'), HP.includes('foi calibrada com o ritmo')], [true, false]);
ok('a prova sem vantagem: os dias depois da trava, com os números', HP.includes('<b>Sem vantagem para a UEP:</b>') && HP.includes('UEP <b>±10,5%</b> · PONTOS <b>±16,1%</b> · CAIXAS <b>±22,4%</b>'), true);
ok('a frase segue o dado (se as caixas variassem menos, diria isso)', (() => {
  const r = JSON.parse(JSON.stringify(RP)); r.reguas.cx.osc = 5;
  return _cxUepHtml(r, { data: '29/10/2026', hora: '08:00' }).includes('As <b>CAIXAS</b> são a régua que menos varia');
})(), true);
ok('frase de leitura em fonte de texto (Barlow), não na mono pequena das notas', [/class="rp-note"/.test(HP), /\.cxu-doc \.cxu-txt\{font-family:'Barlow'/.test(JS)], [false, true]);
ok('sem meta: PONTOS nos dados (sem %), sem EM PONTOS, e a nota diz onde se digita a meta',
   [HP.includes('class="gr">PONTOS</th>'), HP.includes('EM PONTOS'), HP.includes('a META DE PONTOS / DIA não está nas configurações (⚙ META DE PONTOS / DIA)')], [true, false, true]);
ok('com meta: EM PONTOS, a coluna do motivo dos pontos e a meta no cabeçalho dos dados',
   [HM.includes('<th>EM PONTOS<i>'), HM.includes('<th>PONTOS × UEP · POR QUE<i>'), HM.includes(_CXU_PORQUE['pts-barato'] + ' · daria '), HM.includes('class="gr">PONTOS · META 198.740 (⚙)</th>')], [true, true, true, true]);
ok('o papel diz a tabela: na de hoje, e a nota quando a meta não pode julgar',
   [HM.includes('pontos na tabela de pontos de hoje'), HM.includes('cadastro de HOJE (a tabela da meta)'),
    _cxUepHtml(RMG, { data: '29/10/2026', hora: '08:00' }).includes('ainda não manda os pontos na tabela de hoje (.gs v5.41)'),
    HP.includes('pontos na tabela de pontos de hoje')], [true, true, true, false]);
ok('a leitura pede os pontos na tabela de hoje', /lerProducaoModeloPeriodo\(J\.de, J\.ate, null, \{ ptsCad:true \}\)/.test(pegaJs('async function _cxuPtsLer(')), true);
ok('sem pontos: nem a coluna, e a linha da régua diz por quê',
   (() => { const h = _cxUepHtml(_cxUepMontar(HOUT, 20261029, 30, { pts: null, trava: '16/10/2026' }), { data: '29/10/2026', hora: '08:00', ptsFalha: 'pontos não lidos — o Apps Script não respondeu' });
            return [h.includes('class="gr">PONTOS'), h.includes('o Apps Script não respondeu'), h.includes('1 ▸ RESUMO GERENCIAL')]; })(), [false, true, true]);
const SV = _cxuSvg(RP);
ok('o gráfico: uma faixa por régua na MESMA escala, a trava atravessando, o nome e a variação de cada uma',
   [(SV.match(/<polyline/g) || []).length, (SV.match(/fill="var\(--cxu-banda,#eef1f4\)"/g) || []).length, SV.includes('UEP TRAVADA 16/10'), HP.includes('100 = a média do período'),
    /font-weight="700" fill="var\(--cxu-tinta,#1F2328\)">UEP<\/text><text[^>]*>±10,4%/.test(SV)], [3, 3, true, true, true]);
// v7.187.0: as cores por TOKEN, com a do papel como reserva — a aba 📏 RÉGUAS
// define --cxu-* e desenha o MESMO gráfico no fundo escuro. Nenhuma cor fixa.
ok('o gráfico: cor nenhuma fixa (só var(--cxu-*, cor do papel))',
   [SV.replace(/var\(--cxu-[a-z0-9]+,#[0-9a-fA-F]{6}\)/g, '').match(/#[0-9a-fA-F]{6}/g), /stroke="var\(--cxu-uep,#eb6834\)"/.test(SV)], [null, true]);
ok('sem pontos, duas faixas', (_cxuSvg(_cxUepMontar(HOUT, 20261029, 30, { pts: null })).match(/<polyline/g) || []).length, 2);
ok('o gráfico e o desenho não fazem conta', [/_qpOscilacao\(|uepDiaMeta\(|_qpRealDia\(/.test(pegaJs('function _cxuSvg(')),
   /_qpOscilacao\(|_cxUepMontar\(/.test(pegaJs('function _cxUepHtml('))], [false, false]);
const GR = pegaJs('async function gerarRelatorioCxUep(');
ok('leituras em SEQUÊNCIA (histórico → pontos), e a dos pontos devolve o PREP_PERIODO e o PH_UEP_PROD',
   [GR.indexOf('_uepAbaHistCarregar()') < GR.indexOf('_cxuPtsLer('),
    /finally\{ PREP_PERIODO = prep; PH_UEP_PROD = uepProd; \}/.test(pegaJs('async function _cxuPtsLer('))], [true, true]);
// v7.187.0 / .gs v5.42: a meta mora na CONFIG_PAINEL (⚙); sem ela, a deste computador.
ok('a meta de pontos vem do _metaPtsDia (a do ⚙), nunca do código', [/const meta = _metaPtsDia\(\); P\.metaPts = meta\.v;/.test(GR), /\b\d{6,}\b|\b\d{2,3}\.\d{3}\b/.test(pegaJs('function _metaPtsDia('))], [true, false]);
{
  eval.call(global, pegaJs('function _capPtsMetaLer(')); eval.call(global, pegaJs('function _metaPtsDia('));
  global.CAP_PTS_LS = 'rpe_cap_pts';
  const mem = {}; global.localStorage = { getItem: k => mem[k] == null ? null : mem[k], setItem: (k, v) => { mem[k] = String(v); } };
  global.PONTOS_DIA = { metaPts: 198740 };
  const a = _metaPtsDia(); mem.rpe_cap_pts = '150.000';
  const b = _metaPtsDia(); global.PONTOS_DIA = { metaPts: null };
  const c = _metaPtsDia(); mem.rpe_cap_pts = 'abc';
  const d = _metaPtsDia(); global.PONTOS_DIA = {}; delete mem.rpe_cap_pts;
  ok('a meta: a da planilha manda; sem ela, a deste computador; texto ou nada → null, nunca 0',
     [a, b, c, d, _metaPtsDia()], [{ v: 198740, origem: 'planilha' }, { v: 198740, origem: 'planilha' }, { v: 150000, origem: 'computador' }, { v: null, origem: null }, { v: null, origem: null }]);
  delete global.localStorage; delete global.PONTOS_DIA;
}
// ════════════════════════════════════════════════════════════════════════════
// ABA 📏 RÉGUAS (v7.187.0, PPCP 29/10/2026: "régua pela UEP é a justa" → o
// relatório virou tela, mais o PRODUTO A PRODUTO contra a meta de pontos).
// Os 20 dias reais (HOUT + TAB, tabela de hoje) e um cadastro de mentira com a
// SLEEP de verdade. Meta de EXEMPLO 198.740 (nunca a do PPCP) e META UEP 2.761.
// Esperados calculados FORA do painel (python), não pela função.
console.log('\n── ABA 📏 RÉGUAS: o mix contra a meta de pontos, produto a produto ──');
{
  ['ESTEIRA_VAO_PADRAO', 'REG_LINHAS', 'REG_ESCALA', '_REG_SIT', 'REG_PERS'].forEach(c => { global[c] = eval('(' + pegaConst(c) + ')'); });
  ['function _capProdutos(', 'function _capDia(', 'function _regMontar(', 'function _regLinhasVer(', 'function _regHtml(', 'function _regTit(', 'function _regMixHtml(', 'function _regProdHtml(']
    .forEach(f => eval.call(global, pegaJs(f)));
  const C = (codigo, desc, uep, pontos, medida, entre) => ({ codigo, desc, cor: 'BRANCO', uep, pontos, medida, velocidade: medida ? 9 : 0, entrePeca: entre });
  const CAT = _capProdutos([
    C('501094001', 'VOL 1/1 MESA CABECEIRA SLEEP', 0.83, 28.3591, 825, 250),   // a de verdade: vão medido
    C('501061001', 'VOL 1/1 PENTEADEIRA TESTE CHEGA', 4.01, 470.3, 900, 650),
    C('501070001', 'VOL 1/1 HOME TESTE ACIMA', 2, 140, 900, 650),               // só acima da meta de UEP
    C('501090001', 'VOL 1/1 MESA TESTE LIMITE', 0.5, 30, 1000, 650),            // a UEP promete mais que a esteira
    C('501091001', 'VOL 1/1 MESA TESTE SEM MEDIDA', 1, 50, 0, 0),
    C('501092001', 'VOL 1/1 MESA TESTE SEM UEP', 0, 50, 900, 650)]);
  const PROD = { '501094|MESA CABECEIRA SLEEP': 5474, '501061|PENTEADEIRA TESTE CHEGA': 1241, '501070|HOME TESTE ACIMA': 588, '501999|FORA DO CADASTRO': 100 };
  const D = _regMontar(RM, CAT, PROD, 198740, 2761);
  ok('o mix dos 20 dias: 70,0 pontos por UEP (Σ pontos ÷ Σ UEP nos mesmos dias) → batendo a meta de UEP, 193.251 pontos',
     [Math.round(D.mix.ppu * 10) / 10, Math.round(D.mix.ptsNaMeta), D.mix.nDias], [70.0, 193251, 20]);
  ok('a meta pede 72 pontos por UEP; para chegar com este mix, 2.839 UEP/dia = 102,8% da meta de UEP',
     [Math.round(D.need * 10) / 10, Math.round(D.mix.uepPara), Math.round(D.mix.pctUepPara * 10) / 10], [72.0, 2839, 102.8]);
  ok('dias na meta: UEP 16 (a meta GRAVADA de cada dia: 2.530 e, de 27/10, 2.761), pontos 9', [D.mix.diasUep, D.mix.diasPts], [16, 9]);
  const L = k => D.linhas.find(l => l.chave.startsWith(k));
  // pontos do produto com 2 casas (_capProdutos): 28,36 × 3.326 e × 4.412
  ok('a SLEEP sozinha o dia inteiro: 3.326 por dia batendo a meta de UEP, 4.412 no limite — NÃO CHEGA nem no limite (vão medido, sem *)',
     [L('501094').porDia, L('501094').tetoDia, Math.round(L('501094').ptsMeta), Math.round(L('501094').ptsTeto), L('501094').sit, L('501094').vaoPadrao], [3326, 4412, 94325, 125124, 'nao', false]);
  ok('as quatro situações e o limite que corta a UEP',
     ['501061', '501070', '501090', '501091'].map(k => [L(k).sit, L(k).limitado, L(k).vaoPadrao]),
     [['chega', false, true], ['acima', false, true], ['nao', true, true], ['sem-limite', false, false]]);
  ok('quem não tem UEP ou pontos fica fora da tabela e é contado; caixas de produto fora da tabela também',
     [D.nCad, D.semUep, D.nChega, D.cxTot, D.cxFora, D.cxBase, D.cxAbaixo], [5, 1, 1, 7403, 100, 7303, 5474 + 588]);
  ok('sem a meta: nada é julgado (sem situação, sem "precisa"), os pontos por dia continuam',
     (() => { const d = _regMontar(RPH, CAT, PROD, null, 2761); return [d.need, d.mix.diasPts, d.mix.uepPara, d.linhas.every(l => l.sit === null), Math.round(L('501094').ptsMeta)]; })(),
     [null, null, null, true, 94325]);
  ok('pontos gravados (Apps Script antes da v5.41): o mix não é medido — a troca de tabela viraria mix',
     _regMontar(RMG, CAT, PROD, 198740, 2761).mix.ppu, null);
  ok('sem o cadastro: semCad, linhas vazias; sem a leitura dos pontos: os dias da UEP continuam contados',
     (() => { const d = _regMontar(RM, null, PROD, 198740, 2761), r0 = _cxUepMontar(HOUT, 20261029, 30, { pts: null, trava: '16/10/2026' });
              return [d.semCad, d.linhas.length, _regMontar(r0, CAT, null, 198740, 2761).mix.diasUep]; })(), [true, 0, 16]);
  const V1 = _regLinhasVer(D, 'rodaram', false), V2 = _regLinhasVer(D, 'cadastro', false);
  ok('RODARAM: só quem teve caixa, mais caixas primeiro; CADASTRO: todos, menos pontos por UEP primeiro (lista nova)',
     [V1.linhas.map(l => l.modelo), V1.total, V2.linhas.map(l => l.modelo), D.linhas.map(l => l.modelo).join() === CAT.filter(p => p.uepJogo > 0 && p.ptsJogo > 0).map(p => p.modelo).join()],
     [['501094', '501061', '501070'], 3, ['501094', '501091', '501090', '501070', '501061'], true]);
  const HR = _regHtml(RM, D, { n: 30, svgW: 1200, filtro: 'cadastro', todos: false, ptsFalha: '', origem: 'planilha' });
  ok('o desenho: a régua da meta, os quatro cartões, a situação com o * do vão padrão e o ⚠ do limite',
     ['72 PONTOS POR UEP', 'MIX DOS 20 DIAS', 'UEP 16 · PONTOS 9', '2.839 UEP', 'NÃO CHEGA NEM NO LIMITE*', 'NÃO CHEGA NEM NO LIMITE</span>', 'SÓ ACIMA DA REFERÊNCIA',
      'CHEGA NA REFERÊNCIA</span>', 'SEM LIMITE NO CADASTRO', '2.874 ⚠', 'A <b>UEP</b> é a régua que menos varia', 'Sem vantagem para a UEP:', 'class="cxu-svg"'].filter(t => !HR.includes(t)), []);
  // v7.187.2 (PPCP: "alinha essa inf de volumes"): os volumes numa coluna, nunca colados no nome
  ok('VOL. é coluna própria, centrada, logo depois do PRODUTO; o nome sai sozinho',
     [/<th class="l" rowspan="2">PRODUTO<\/th><th class="vol" rowspan="2">VOL\.<\/th>/.test(HR), /vol\.<\/span>/.test(HR), HR.includes('MESA CABECEIRA SLEEP</td><td class="n vol">1</td>'),
      /#uep-reguas \.reg-tab th\.vol,#uep-reguas \.reg-tab td\.vol\{text-align:center\}/.test(html), /\.cxu-doc \.reg-tab th\.vol,\.cxu-doc \.reg-tab td\.vol\{text-align:center\}/.test(JS)],
     [true, false, true, true, true]);
  ok('o mix abaixo do que a meta pede fica vermelho (o único número de cor do bloco)', /kpi-card red r reg-alerta"><div class="kpi-lbl">MIX DOS 20 DIAS/.test(HR), true);
  const HS = _regHtml(RPH, _regMontar(RPH, CAT, PROD, null, 2761), { n: 30, svgW: 1200, filtro: 'rodaram', todos: false });
  ok('sem meta: diz onde configurar, sem coluna de situação nem % da meta',
     [HS.includes('META DE PONTOS NÃO CONFIGURADA'), HS.includes('SITUAÇÃO'), HS.includes('% DA META'), HS.includes('reg-alerta')], [true, false, false, false]);
  ok('meta só deste computador: a tela pede para salvar no ⚙',
     _regHtml(RM, D, { n: 30, svgW: 1200, filtro: 'rodaram', origem: 'computador' }).includes('salve no ⚙ para valer em todos'), true);
  ok('o desenho não faz conta (tudo vem do _regMontar e do _cxUepMontar)',
     /_capDia\(|_cxUepMontar\(|_regMontar\(|_qpOscilacao\(|uepDiaMeta\(/.test(pegaJs('function _regHtml(')), false);
  ok('o valor da meta não mora no código da aba', /\b\d{6,}\b|\b\d{2,3}\.\d{3}\b/.test(['function _regMontar(', 'function _regHtml(', 'async function renderReguas(', 'function _regPintar('].map(pegaJs).join('')), false);
  const RR = pegaJs('async function renderReguas('), RPI = pegaJs('function _regPintar(');
  ok('leituras em SEQUÊNCIA (histórico → pontos do período → cadastro) e o pedido do meio não é engolido',
     [RR.indexOf('_uepAbaHistCarregar()') < RR.indexOf('_cxuPtsLer(') && RR.indexOf('_cxuPtsLer(') < RR.indexOf('_capBuscar()'),
      /if\(REG_RODANDO\)\{ REG_PEND = \{ n, forcar:/.test(RR), /if\(p && \(p\.n !== REG_DADOS\.n \|\| p\.forcar\)\) renderReguas\(p\.forcar\);/.test(RR)], [true, true, true]);
  ok('a tela lê a meta do ⚙ (_metaPtsDia) e a META UEP da config; o gráfico na largura do cartão',
     [/meta = _metaPtsDia\(\)/.test(RPI), /Number\(PONTOS_DIA\.metaUep\) > 0/.test(RPI), /svgW:_svgLargura\(el\)/.test(RPI)], [true, true, true]);
  const ST = pegaJs('function setTab(');
  // v7.207.0 (PPCP 06/11/2026, "A1 E A2"): a aba virou a 5ª sub-aba da ⚖ UEP. O painel é
  // fixo, fora do #uep-bloco (o renderUep o refaria a cada refresh); abrir a sub-aba lê
  // como a aba lia, esperando a leitura da ⚖ UEP terminar (uma de cada vez).
  const iU = html.indexOf('<section id="sec-uep"'), SU7 = html.slice(iU, html.indexOf('</section>', iU)), US = pegaJs('function _uepSub(');
  ok('v7.207.0 RÉGUAS é sub-aba da ⚖ UEP: sem botão nem seção própria; o painel fixo depois do #uep-bloco; o 🖨 com os dias da tela',
     [/data-tab="reguas"/.test(html), html.includes('id="sec-reguas"'), /data-sub="reguas" role="tab"[^>]*onclick="_uepSub\('reguas'\)"><b>RÉGUAS<\/b><span id="uep-sb-reguas">/.test(SU7),
      SU7.indexOf('<div class="ucv-pn" data-sub="reguas" id="uep-reguas">') > SU7.indexOf('<div id="uep-bloco">'), /id="reg-bloco"/.test(SU7) && /id="reg-per"/.test(SU7) && /onclick="_regAbrir\(true\)"/.test(SU7),
      /onclick="_uepImpFecha\(\);gerarRelatorioCxUep\(_regN\(\)\)"/.test(SU7)], [false, false, true, true, true, true]);
  // v7.207.1 (revisão da v7.207.0: o renderUep disparava as leituras dos painéis escondidos
  // junto com a da RÉGUAS — 3 JSONP no ar): a RÉGUAS espera TODA leitura da ⚖ UEP; com ela
  // na tela o renderUep não desenha nem lê; as auto-leituras dele esperam a RÉGUAS.
  const RU = pegaJs('function renderUep('), RPX7 = pegaJs('function renderProxDias(');
  ok('v7.207.1 uma leitura de cada vez: a RÉGUAS pela fila (_regAbrir); o renderUep sai com ela na tela; as leituras sozinhas do renderUep e do PRÓXIMOS DIAS esperam a RÉGUAS',
     [/if\(k === 'reguas'\) _regAbrir\(\);/.test(US), /if\(UEP_SUB==='reguas'\)\{ UEP_ABA_PEND=true; _regAbrir\(\); \}/.test(ST),
      /if\(tab==='reguas'\)\{ UEP_SUB='reguas'; tab='uep'; \}/.test(ST), /function _regOn\(\)\{ return _abaOn\('uep'\) && UEP_SUB === 'reguas'; \}/.test(html),
      /if\(_regOn\(\)\) _regPintar\(\);/.test(html), /^function renderUep\(\)\{\n  if\(UEP_SUB==='reguas'\) return;/.test(RU),
      /UEP_HIST_TS && !UEP_HIST_VOO && !REG_RODANDO &&/.test(RU), /UEP_PAD_TS && !UEP_PAD_VOO && !REG_RODANDO &&/.test(RU), /!GPX_CARREGANDO && !REG_RODANDO &&/.test(RPX7),
      /function _uepLendo\(\)\{ return !!\(UEP_CARREGANDO \|\| UEP_HIST_VOO \|\| UEP_PAD_VOO \|\| GPX_CARREGANDO \|\| PROG_DET_VOO \|\| TKS_VOO \|\| TKP_VOO \|\| _pontosVoo\); \}/.test(html),
      /function _regSetPer\(v\)\{[^\n]*_regAbrir\(\); \}/.test(html), (html.match(/renderReguas\(/g) || []).length],
     [true, true, true, true, true, true, true, true, true, true, true, 3]);
  ok('v7.207.1 na RÉGUAS o #uep-bloco some inteiro (o aviso de estado dele não é da RÉGUAS)',
     /const b = document\.getElementById\('uep-bloco'\); if\(b\) b\.style\.display = k === 'reguas' \? 'none' : '';/.test(pegaJs('function _uepSubMarca(')), true);
  eval.call(global, pegaJs('function _regSubMontar('));
  ok('v7.207.0 o botão RÉGUAS diz a variação das três réguas, da menor para a maior (o osc da frase); sem leitura, o nome — nunca 0',
     [_regSubMontar({ cx:{ osc:26.9 }, pts:{ osc:18.5 }, uep:{ osc:10.4 } }).txt, _regSubMontar({ cx:{ osc:20 }, uep:{ osc:null } }).txt, _regSubMontar(null).txt,
      /_sbPinta\(document\.getElementById\('uep-sb-reguas'\), _regSubMontar\(R\.reguas\)\)/.test(RPI)],
     ['UEP ±10,4% · pontos ±18,5% · caixas ±26,9%', 'caixas ±20,0%', 'caixas × pontos × UEP', true]);
  // v7.207.1 (revisão): fora do sucesso o botão diz o estado — nunca os números de outro período
  ok('v7.207.1 o botão RÉGUAS fora do sucesso: lendo/esperando "…", histórico não lido, nenhum dia, não montou',
     [/sb\(REG_RODANDO \|\| REG_ESPERA \? '…' : 'caixas × pontos × UEP'\)/.test(RPI), /sb\('histórico não lido'\)/.test(RPI),
      /sb\('nenhum dia para comparar'\)/.test(RPI), /sb\('não montou'\)/.test(RPI), /Esperando a outra leitura da ⚖ UEP terminar/.test(RPI)], [true, true, true, true, true]);
  ok('o gráfico na tela escura: as cores do papel trocadas por token no #uep-reguas', /#uep-reguas\{--cxu-banda:#1B2D44;[^}]*--cxu-cx:#4f95e8\}/.test(html), true);
  // v7.187.1 (PPCP, com a aba na mão: "essa não está na impressão"): o papel
  // leva a meta de pontos × mix e o produto a produto — o MESMO desenho da aba.
  const PAP = _cxUepHtml(RM, { data: '29/10/2026', hora: '10:00', n: 30, D, origem: 'planilha' });
  // v7.188.0 (prompt do PPCP): QUATRO PÁGINAS — resumo gerencial · capacidade
  // por produto · análise dos desvios · dados e critérios — cada uma em folha nova
  ok('o papel: 1 resumo · 2 capacidade (o mix e o produto a produto dentro) · 3 desvios · 4 dados — nesta ordem, cada folha nova',
     [['1 ▸ RESUMO GERENCIAL', '<div class="rp-sec-ttl cxu-quebra">2 ▸ CAPACIDADE POR PRODUTO', '<div class="cxu-sub">A META DE PONTOS CABE NO MIX?', '<div class="cxu-sub">PRODUTO A PRODUTO',
       '<div class="rp-sec-ttl cxu-quebra">3 ▸ ANÁLISE DOS DESVIOS', '<div class="rp-sec-ttl cxu-quebra">4 ▸ DADOS E CRITÉRIOS', 'class="rp-footer"'].map(t => PAP.indexOf(t)).every((v, i, a) => v > 0 && (!i || v > a[i - 1])),
      (PAP.match(/cxu-quebra/g) || []).length], [true, 3]);
  ok('no papel: a régua da meta, os cartões, a situação — e nenhum botão nem filtro (é papel)',
     [['72 PONTOS POR UEP', 'quem julga a linha é a UEP', 'MIX DOS 20 DIAS', 'NÃO CHEGA NEM NO LIMITE', 'os 3 que mais rodaram nos 30 dias'].filter(t => !PAP.includes(t)), /onclick=|reg-chip|reg-mais/.test(PAP.split('2 ▸ CAPACIDADE')[1].split('3 ▸ ANÁLISE')[0])], [[], false]);
  ok('no papel, os DIAS NA META ficam só no resumo da página 1: a capacidade tem três cartões (a tela, quatro)',
     [PAP.includes('UEP 16 · PONTOS 9'), PAP.includes('<div class="kpi-grid c3 reg-mix">'), HR.includes('<div class="kpi-grid c4 reg-mix">')], [false, true, true]);
  ok('o produto a produto no papel: os 15 que mais rodaram e uma linha com o resto (caixas e %)',
     (() => { const L20 = Array.from({ length: 20 }, (_, i) => ({ chave: 'm' + i + '|P' + i, modelo: String(501100 + i), nome: 'P' + i, nVol: 1, ppu: 50, porDia: 1000, ptsMeta: 100000, pctMeta: 50, tetoDia: 1200, ptsTeto: 120000, sit: 'nao', cx: 100 + i }));
              const h = _regProdHtml({ metaPts: 198740, linhas: L20, cxBase: 2190, semUep: 0, cxFora: 0, temCx: true, nRod: 20, nCad: 20 }, { papel: true, n: 30 }, '3');
              return [(h.match(/<tr><td class="pr">/g) || []).length, h.includes('+ 5 produto(s) com 510 cx (23% das caixas da tabela).')]; })(), [15, true]);
  ok('sem o D (backend sem cadastro lido): o papel continua como era, sem a folha nova e com a numeração antiga',
     [_cxUepHtml(RM, { data: '29/10/2026', hora: '10:00' }).includes('2 ▸ ANÁLISE DOS DESVIOS'), _cxUepHtml(RM, { data: '29/10/2026', hora: '10:00' }).includes('A META DE PONTOS CABE')], [true, false]);
  ok('a impressão lê o cadastro depois dos pontos (uma leitura de cada vez) e monta o D pelo _regMontar',
     [GR.indexOf('_cxuPtsLer(') < GR.indexOf('_capBuscar()'), /ctx\.D = _regMontar\(R, CAP_CAT, prod, P\.metaPts,/.test(GR)], [true, true]);
  ok('a pele do papel para os blocos da aba (escopada em .cxu-doc) e a cor da barra na impressão',
     [/\.cxu-doc \.reg-mix\{grid-template-columns:repeat\(3,1fr\)/.test(JS), /\.cxu-doc \.reg-pb\{[^}]*print-color-adjust:exact/.test(JS), /\.cxu-doc \.reg-tab\{table-layout:auto/.test(JS)], [true, true, true]);
  ok('o 🖨 aceita os dias da tela (sem eles, os 30 de sempre)', [/async function gerarRelatorioCxUep\(n\)\{\n  const N = Number\(n\) > 0 \? Number\(n\) : CXU_DIAS;/.test(JS), /_cxuJanela\(hojeNum, N\)/.test(GR), /_cxUepMontar\(UEP_HIST, hojeNum, N, P\)/.test(GR)], [true, true, true]);
  // ── v7.188.0: o RESUMO GERENCIAL, a REFERÊNCIA DE UEP e o que investigar ──
  // Esperados calculados FORA do painel (python sobre os mesmos 20 dias reais):
  // Σ realizado ÷ Σ metas dos dias, e dias com realizado ≥ meta.
  const RG = RM.reguas, p1 = x => Math.round(x * 10) / 10;
  ok('atingimento = Σ realizado ÷ Σ metas dos mesmos dias: caixas 93,4% (10 dias na meta, meta média 1.843), UEP 109,3% (16, referência média 2.553), pontos 98,3% (9, a meta de exemplo)',
     [[p1(RG.cx.pctMeta), RG.cx.diasMeta, Math.round(RG.cx.metaMedia)], [p1(RG.uep.pctMeta), RG.uep.diasMeta, Math.round(RG.uep.metaMedia)], [p1(RG.pts.pctMeta), RG.pts.diasMeta, RG.pts.metaMedia]],
     [[93.4, 10, 1843], [109.3, 16, 2553], [98.3, 9, 198740]]);
  ok('sem meta de pontos: os pontos sem atingimento nem dias na meta (nunca 0)', [RPH.reguas.pts.pctMeta, RPH.reguas.pts.diasMeta, RPH.reguas.pts.metaMedia], [null, null, null]);
  ok('o card do mix lê os dias na meta do _cxUepMontar (uma conta só)', [D.mix.diasUep === RG.uep.diasMeta, D.mix.diasPts === RG.pts.diasMeta, /G\.uep\.diasMeta/.test(pegaJs('function _regMontar('))], [true, true, true]);
  ok('dia na meta é realizado ≥ meta: o dia que fecha EXATAMENTE na meta conta (caixas e UEP)', (() => {
    const r = _cxUepMontar([DU('26/10', 1500, 1500, 0, 2530), DU('27/10', 1400, 1500, 0, 2529, 2530)], 20261029, 30);
    return [r.reguas.cx.diasMeta, r.reguas.uep.diasMeta];
  })(), [1, 1]);
  ok('os que RODARAM contam só quem teve caixa no período (o cadastro inteiro fica no nChega)', (() => {
    const d = _regMontar(RM, CAT, { '501094|MESA CABECEIRA SLEEP': 10 }, 198740, 2761);
    return [d.nRod, d.nRodChega, d.nRodNao, d.nChega];
  })(), [1, 0, 1, 1]);
  ok('a REFERÊNCIA DE UEP de cada data, em trechos: 2.530 até 26/10 e 2.761 desde 27/10, com o motivo da troca',
     RM.refUep.map(g => [g.valor, g.de.slice(0, 5), g.ate.slice(0, 5), g.n, g.motivo]),
     [[2530, '29/09', '26/10', 18, null], [2761, '27/10', '28/10', 2, 'o desempenho médio da linha subiu']]);
  ok('o motivo casa pela data da troca entre os dois trechos (troca no fim de semana vale para a segunda); sem registro → null', (() => {
    const mot = global.UEP_REF_MOTIVO; global.UEP_REF_MOTIVO = { '24/10/2026': 'teste no sábado' };
    const h = HOUT.map(d => Object.assign({}, d, _cartNum(d.data) >= 20261026 ? { metaUep: 2600 } : {}));
    const a = _cxUepMontar(h, 20261029, 30, { pts: PH, tabela: 'hoje', metaPts: 198740 }).refUep.map(g => g.motivo);
    global.UEP_REF_MOTIVO = {};
    const b = _cxUepMontar(h, 20261029, 30, { pts: PH, tabela: 'hoje', metaPts: 198740 });
    global.UEP_REF_MOTIVO = mot;
    return [a, b.refUep.map(g => g.motivo), _cxUepHtml(b, { data: '29/10/2026', hora: '10:00' }).includes('motivo não registrado')];
  })(), [[null, 'teste no sábado'], [null, null], true]);
  ok('a meta em caixas mais alta entre os dias em que ela pedia mais que a referência: 179,0% (15/10)', [RM.cxAbaixoMeta, p1(RM.cxAbaixoMetaMax)], [8, 179.0]);
  ok('página 1: o resumo das três réguas, linha por linha, com a coluna DEPOIS DA TRAVA',
     ['93,4%', '10 de 20', '109,3%', '16 de 20', '98,3%', '9 de 20', 'DEPOIS DA TRAVA · 8 DIAS', 'média das referências · em avaliação', 'meta do ⚙ · tabela de hoje', '<tr class="cxu-min"><td class="rg"><b class="cxu-sw" style="background:#eb6834"></b>UEP']
       .filter(t => !PAP.split('2 ▸ CAPACIDADE')[0].includes(t)), []);
  ok('página 1: o aviso da referência — em avaliação, NÃO é a meta oficial — com os trechos e o motivo',
     [PAP.includes('REFERÊNCIA DE UEP EM AVALIAÇÃO — AINDA NÃO É A META OFICIAL DA EMBALAGEM.</b> 2.530 até 26/10 · 2.761 desde 27/10 (o desempenho médio da linha subiu).'),
      PAP.indexOf('cxu-ref') < PAP.indexOf('2 ▸ CAPACIDADE')], [true, true]);
  ok('a UEP nunca é chamada de meta no papel nem na aba (é REFERÊNCIA)', [/meta de UEP|META DE UEP|META UEP/.test(PAP), /meta de UEP|META DE UEP|META UEP/i.test(HR)], [false, false]);
  ok('página 1: as conclusões saem do dado e apontam a página que detalha',
     ['<b>Sem vantagem para a UEP:</b>', '<b>Vereditos diferentes em 12 de 20 dias.</b> Nos 8 em que as caixas deram ABAIXO e a UEP NO RITMO, a meta em caixas pedia mais que a referência de UEP — página 3.',
      '<b>A meta de pontos não cabe no mix.</b> O período rendeu 70 pontos por UEP e a meta pede 72: com a linha na referência de UEP todo dia, 97% da meta de pontos — página 2.',
      '<b>Dos 3 produtos que rodaram, 1 chega à meta de pontos</b> na referência de UEP; 83% das caixas foram nos que não chegam — página 2.'].filter(t => !PAP.includes(t)), []);
  ok('página 2: o título é a conclusão (os que rodaram: chegam e nem no limite)',
     [_cxuCapTese(D), _cxuCapTese(_regMontar(RPH, CAT, PROD, null, 2761)).startsWith('O que cada produto rende'), _cxuCapTese({ semCad: true }).startsWith('O cadastro de produtos não foi lido')],
     ['Dos <b>3</b> produtos que rodaram, <b>1</b> chega à meta de pontos na referência de UEP e <b>1</b> não chega nem no limite físico da esteira.', true, true]);
  ok('página 2: capacidade estimada, limite físico e realizado com esses nomes, e capacidade não é produção garantida',
     ['CAPACIDADE ESTIMADA<br>NA REFERÊNCIA DE UEP', 'LIMITE FÍSICO<br>ESTEIRA SEM PARADA', 'REALIZADO<br>CX · 30 DIAS', 'Nenhum dos dois é produção garantida'].filter(t => !PAP.includes(t)), []);
  const P3 = PAP.split('3 ▸ ANÁLISE DOS DESVIOS')[1].split('4 ▸ DADOS')[0];
  ok('página 3: 12 dias com veredito diferente (8 em caixas, 7 em pontos, juntos), cada dia contra a referência DA SUA DATA',
     [P3.includes('Em <b>12 de 20</b> dias o veredito em caixas ou em pontos foi diferente do da UEP.'), (P3.match(/<tr><td>\d\d\/\d\d<\/td>/g) || []).length,
      P3.includes('2.751 de 2.530'), P3.includes('2.869 de 2.761'), P3.includes('1.640 de 2.700')], [true, 12, true, true, true]);
  ok('página 3: o que investigar ou decidir — só o que o dado sustenta, e a decisão da referência sempre',
     ['Datação da programação.</b> Em 8 dia(s) a meta em caixas pedia mais que a referência de UEP (até 179,0%)', 'Meta de pontos × mix.', 'Referência de UEP.</b> Em avaliação — ainda não é a meta oficial da embalagem: decidir']
       .map(t => P3.includes(t)).concat([P3.includes('UEP acima do limite da esteira.'), P3.includes('Vão não medido.')]), [true, true, true, false, false]);
  ok('o que investigar: a UEP que passa da esteira e o vão não medido entram quando rodaram', (() => {
    const h = _cxuDecidir({ cxAbaixoMeta: 0, uepAbaixoMeta: 2 }, { metaPts: null, mix: {}, nRodLim: 2, nRodVao: 3 });
    return [h.includes('2 produto(s) que rodaram prometem'), h.includes('3 produto(s) que rodaram e não chegam nem no limite'), h.includes('Meta em caixas abaixo do esforço.</b> Em 2 dia(s)'), h.includes('Datação')];
  })(), [true, true, true, false]);
  const P4 = PAP.split('4 ▸ DADOS E CRITÉRIOS')[1];
  ok('página 4: os dias com a meta (ou referência) de cada data, o histórico da referência, como o número sai e as limitações',
     ['class="gr">CAIXAS · META DA PROGRAMAÇÃO</th>', 'class="gr">UEP · REFERÊNCIA DA DATA</th>', '<b>2.530</b> · 29/09 a 26/10 · 18 dias · vinha de antes do período',
      '<b>2.761</b> · 27/10 a 28/10 · 2 dias · o desempenho médio da linha subiu', 'Status: em avaliação — ainda não é a meta oficial da embalagem.',
      'LIMITAÇÕES DOS DADOS', 'UEP trocada por cronoanálise vale do dia da troca em diante', 'METAS DE CADA DATA', 'ATINGIMENTO · SELO', 'CAPACIDADE · LIMITE FÍSICO', 'Capacidade não é produção garantida'].filter(t => !P4.includes(t)), []);
  ok('os desenhos novos não fazem conta (tudo vem do _cxUepMontar e do _regMontar)',
     ['function _cxuResumoHtml(', 'function _cxuRefTrechos(', 'function _cxuRefHtml(', 'function _cxuConclusoes(', 'function _cxuCapTese(', 'function _cxuDecidir(']
       .filter(f => /_qpOscilacao\(|_cxUepMontar\(|uepDiaMeta\(|_qpRealDia\(|_capDia\(|_regMontar\(/.test(pegaJs(f))), []);
  ok('a META DE PONTOS no ⚙: campo, só envia quando mudou (uma vez), e a rede deste computador',
     [/id="c-meta-pts"/.test(html), /_metaPtsNova=\(v>0&&v!==atual\)\?v:null;/.test(pegaJs('function saveCfg(')),
      /if\(_metaPtsNova\)\{ params\.push\('metaPts='\+_metaPtsNova\); _metaPtsNova=null; \}/.test(pegaJs('function enviarConfigPainel(')),
      /localStorage\.setItem\(CAP_PTS_LS, String\(v\)\)/.test(pegaJs('function saveCfg(')), /metaPts: \(json\.painelConfig\|\|\{\}\)\.metaPts/.test(JS)], [true, true, true, true, true]);
}
}

// ════════════════════════════════════════════════════════════════════════════
// CRONOANÁLISE → UEP (v7.142.0): o caso real de 19/10/2026 — ARMÁRIO ENCANTO,
// Volume a volume no tablet: 27,8 s no período (paradas dentro) e 17,6 s com a
// linha rodando; cadastro 2,23 (vigência 25/09), base MADERO 1,00.
console.log('\n── CRONOANÁLISE → UEP ──');
global.UEP_PAD_FAIXA = eval('(' + pegaConst('UEP_PAD_FAIXA') + ')');
global.UEP_CONV_TOL_META = eval('(' + pegaConst('UEP_CONV_TOL_META') + ')');
global.UEP_CONV_TOL_PADRAO = eval('(' + pegaConst('UEP_CONV_TOL_PADRAO') + ')');
global.UEP_CONV_TOL_LS = eval('(' + pegaConst('UEP_CONV_TOL_LS') + ')');
['_uepConvCod', '_uepConvNorm'].forEach(c => { global[c] = eval('(' + pegaConst(c) + ')'); });
global.UEP_CONV_LS = eval('(' + pegaConst('UEP_CONV_LS') + ')');
global.UEP_BASE_MEDIDA = eval('(' + pegaConst('UEP_BASE_MEDIDA') + ')');
global.CRONO_LINHA_DIAS = eval('(' + pegaConst('CRONO_LINHA_DIAS') + ')');
global.UCV_REG_VEREDITO = eval('(' + pegaConst('UCV_REG_VEREDITO') + ')');
global.UCV_REG_SEG_MAX = eval('(' + pegaConst('UCV_REG_SEG_MAX') + ')');
global.UCV_REG_PER_MAX = eval('(' + pegaConst('UCV_REG_PER_MAX') + ')');
global.UCV_REG_ROD_MAX = eval('(' + pegaConst('UCV_REG_ROD_MAX') + ')');
// v7.233.0: a regra da UEP (a medição vale · a regra se cumpre · o PPCP trava) e a CONFERÊNCIA DAS TROCAS
['UCV_MED_MIN_VOL', 'UCV_MED_MAX_LAC', 'UCV_REGRA_MIN_MED', 'UCV_REGRA_MIN_VOL', 'UCV_REGRA_BORDA', '_ucvDifTxt'].forEach(c => { global[c] = eval('(' + pegaConst(c) + ')'); });
global.UEP_PAD_MIN_MIN = eval('(' + pegaConst('UEP_PAD_MIN_MIN') + ')');
global.UCV_CONF_ESTADO = eval('(' + pegaConst('UCV_CONF_ESTADO') + ')');
global.UCV_REL_TXT = eval('(' + pegaConst('UCV_REL_TXT') + ')');
global.UCV_ST = eval('(' + pegaConst('UCV_ST') + ')');
['UCV_PRINC_PCT', 'UCV_PRINC_LINHAS', 'UCV_PRINC_SIT', 'UCV_PRINC_ORD', 'GPX_DOW', 'UCV_AGENDA_GRP'].forEach(c => { global[c] = eval('(' + pegaConst(c) + ')'); });
global.UCV_PRINC = []; global.UCV_PRINC_TODOS = false;
global.UCV_TRAVANDO = false; global.UCV_TRAVA = null; global.UCV_TRAVA_DLG = null; global.UCV_TRAVA_MSG = ''; global.UCV_CONF_VOO = null;
global.UEP_PAD = null; global.UCV_LINHA = null; global.UCV_LINHA_VOO = null; global.UCV_REGS = null;
['function _phVal(', 'function _phAcc(', 'function _phAdd(', 'function _phMediaAparada(', 'function _uepPadJanela(', 'function _pgSimNum(', 'function _ucvLinhaItens(']
  .forEach(f => eval.call(global, pegaJs(f)));
// v7.146.1 (refatoração): a conta em três peças (base · cadastro · digitar) e o
// desenho em peças por bloco; os campos e o que fica guardado por _ucvEl/_ucvLe/_ucvGuarda.
const UCV_CONTA = ['function _uepConvBaseDe(', 'function _uepConvCadastro(', 'function _uepConvDigitar(', 'function _uepConvMontar(',
  'function _ucvPadraoDe(', 'function _ucvRefDe(', 'function _ucvRel(', 'function _ucvRelEst(', 'function _ucvRegsPadrao(', 'function _ucvRegsStatus(', 'function _ucvRegVol(', 'function _ucvRegValida(', 'function _ucvHash(', 'function _ucvRegMontar(',
  'function _ucvRegsDoProduto(', 'function _ucvLacPct(', 'function _ucvMedValida(', 'function _ucvRegraUep(', 'function _ucvExclPode(', 'function _ucvExclConfirmaTxt(',
  'function _ucvExclResposta(', 'function _ucvExclConfere(', 'function _ucvRegUep(', 'function _ucvTravaDe(', 'function _ucvTravaMontar(', 'function _ucvTravaUrl(',
  'function _ucvTravaResposta(', 'function _ucvTravaConfere(', 'function _ucvGravNum(', 'function _ucvConfMontar(', 'function _ucvPrincEstado(', 'function _ucvProgDe(', 'function _ucvPrincipais('];
const UCV_DESENHO = ['function _ucvU2(', 'function _ucvSeg(', 'function _ucvCard(', 'function _ucvTolTxt(', 'function _ucvTolFora(', 'function _ucvTpMed(',
  'function _uepConvRegua(', 'function _uepConvAvisoBase(', 'function _uepConvCadTxt(', 'function _uepConvNotasHtml(', 'function _uepConvBaseHtml(',
  'function _uepConvTrocaHtml(', 'function _uepConvHtml(', 'function _uepConvQual(', 'function _ucvLinhaHtml(', 'function _ucvRegsHtml(',
  'function _ucvHoras(', 'function _ucvListaHtml(', 'function _ucvRegraBoxHtml(', 'function _ucvTravaRot(', 'function _ucvTravaHtml(', 'function _ucvTravaDlgHtml(',
  'function _ucvConfHtml(', 'function _ucvConfAvisoHtml(', 'function _ucvPadCel(', 'function _ucvPerdaTxt(', 'function _ucvStatusCel(',
  'function _ucvPrincSub(', 'function _ucvProgCel(', 'function _ucvAgendaPeso(', 'function _ucvAgendaResumo(', 'function _ucvAgendaDocHtml(', 'function _ucvPrincHtml(', 'function _uepConvQualCurto(', 'function _ucvSubMontar(', 'function _ucvRegFalta('];
// "O desenho não faz conta" vale em TODAS as peças dele, e pelo parâmetro que
// cada uma recebe (R ou base): refazer a régua (_taktUep), o CONFERE (a faixa)
// ou qualquer divisão no desenho deixaria a tela contradizer a conta.
const UCV_SEM_CONTA = /\/ *100|\/ *(R|base)\.|_taktUep\(|UEP_PAD_FAIXA\[0\] *<=|_uepConvMontar\(|_uepConvBaseDe\(|_uepConvCadastro\(|_uepConvDigitar\(/;
['function _uepBaseCurto(', 'function _ucvEl(', 'function _ucvLe(', 'function _ucvGuarda(', 'function _uepConvProdutos(', 'function _uepConvAchar(', 'function _ucvRegBaseTxt(']
  .concat(UCV_CONTA, UCV_DESENHO).forEach(f => eval.call(global, pegaJs(f)));
const CV = (codigo, desc, cor, uep, uepVig) => ({ codigo, desc, cor, uep, uepVig });
const PRODS = _uepConvProdutos([
  CV('501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 'BRANCO', 1, '25/09/2026'),
  CV('501094001', 'VOL 1/1 MESA CABECEIRA SLEEP', 'BRANCO', 0.83, '16/10/2026'),   // produto comum (a base é a MADERO)
  CV('501.139.001', 'VOL 1/1 ARMARIO ENCANTO', 'BRANCO', 2.23, '25/09/2026'),      // código com ponto, como a planilha mostra
  CV('501139002', 'VOL 1/1 ARMARIO ENCANTO', 'CINAMOMO', 2.23, '25/09/2026'),
  CV('501139003', 'VOL 1/1 ARMARIO ENCANTO', 'BRANCO/CINAMOMO', 2.23, '25/09/2026'),
  CV('501139004', 'VOL 1/1 ARMARIO ENCANTO', 'OFF WHITE/CINAMOMO', 2.23, '25/09/2026'),
  CV('501121001', 'VOL 1/1 ESCRIVANINHA ENCANTO', 'BRANCO', 2.6, '16/10/2026'),
  CV('501136001', 'VOL 1/1 LIVREIRO ENCANTO', 'BRANCO', 1.87, '16/10/2026'),
  CV('501059001', 'VOL 1/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 2.71, '16/10/2026'),
  CV('501059002', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 2.29, '16/10/2026'),
  CV('501999001', 'VOL 1/1 PRODUTO NOVO', 'BRANCO', '', '')
]);
const achou = t => { const a = _uepConvAchar(PRODS, t); return a.p ? a.p.nome : a.n; };
ok('acha pelo nome sem acento, pela linha da lista e pelo código com ponto',
   [achou('armário encanto'), achou('501139 · ARMARIO ENCANTO'), achou('501.139.002')], ['ARMARIO ENCANTO', 'ARMARIO ENCANTO', 'ARMARIO ENCANTO']);
ok('texto de três produtos é ambíguo (não chuta); vazio não acha nada', [achou('ENCANTO'), achou('')], [3, 0]);

const E1 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 27.8, 0, 2530);
ok('27,8 s no período ÷ 12,5 s da régua da meta = 2,22 — confere com o 2,23 do cadastro',
   [E1.uepVol.toFixed(2), E1.volCad, E1.confere, fmtP(E1.difPct), E1.prevSeg.toFixed(1), E1.origem],
   ['2.22', 2.23, true, '-0,3%', '27.9', 'MEDIDA 25/09']);
ok('o que digitar: os quatro códigos com o mesmo número', E1.digitar.map(g => [g.uep, g.cods.map(c => c.cod)]),
   [[2.22, ['501139001', '501139002', '501139003', '501139004']]]);
const E2 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 0, 2530);
ok('17,6 s com a linha rodando contra a base pela meta: 1,41, 37% mais leve — não confere',
   [E2.uepVol.toFixed(2), Math.round(E2.difPct), E2.confere, E2.digitar[0].uep], ['1.41', -37, false, 1.41]);
const E3 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 11, 2530);
ok('com a MADERO cronometrada (11 s), a base é a dela, não a da meta', [E3.base.daMeta, E3.uepVol.toFixed(2)], [false, '1.60']);
const E4 = _uepConvMontar(PRODS, 'PENTEADEIRA CAMARIM STRASS', 30, 0, 2530);
ok('2 volumes: o jogo medido é repartido como o cadastro reparte (2,71 / 2,29)',
   [E4.nVol, E4.p.nVol, E4.uepJogo.toFixed(2), E4.confere, E4.digitar.map(g => [g.vol, g.uep])],
   [undefined, 2, '4.80', true, [[1, 2.6], [2, 2.2]]]);
const E5 = _uepConvMontar(PRODS, 'PRODUTO NOVO', 20, 0, 2530);
ok('sem UEP no cadastro: sem diferença (nunca 0%), e o número a digitar é o medido',
   [E5.volCad, E5.difPct, E5.confere, E5.digitar[0].uep, E5.origem], [null, null, false, 1.6, 'SEM UEP']);
const E6 = _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 12, 0, 2530);
ok('a BASE (MADERO) não ganha UEP nova: mostra a distância da cronoanálise para a régua da meta (12 s × 12,5 s)',
   [E6.ehBase, E6.digitar, Math.round(E6.reguaDif)], [true, null, -4]);
ok('a SLEEP não é a base (a base SLEEP foi desfeita no PADRÃO DE UEP)', _uepConvMontar(PRODS, 'MESA CABECEIRA SLEEP', 10, 0, 2530).ehBase, false);
ok('meta diferente muda a régua da base pela meta (2.635 UEP → 12,0 s)',
   _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 24, 0, 2635).uepVol.toFixed(2), '2.00');
ok('estados antes do número', [_uepConvMontar([], 'X', 1, 0, 2530).estado, _uepConvMontar(PRODS, 'ENCANTO', 27.8, 0, 2530).estado,
   _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 0, 0, 2530).estado], ['sem-cadastro', 'sem-produto', 'sem-tempo']);

const H1 = _uepConvHtml(E1), H2 = _uepConvHtml(E2);
ok('o desenho: CONFERE, o número e o que esta medição dá (as medições registradas ainda não lidas); botão de troca nenhum (v7.233.0: a troca é do PPCP, na TRAVA DA UEP)',
   [H1.includes('CONFERE'), H1.includes('>2,22<'), H1.includes('LENDO AS MEDIÇÕES REGISTRADAS'), H1.includes('Esta medição dá'), H1.includes('TROCAR A UEP NO CADASTRO')],
   [true, true, true, true, false]);
ok('o desenho: rodando contra a meta sai mais LEVE; o que ela dá e conferir o tempo antes',
   [H2.includes('mais LEVE que o cadastro'), H2.includes('Esta medição dá'), H2.includes('<b>1,41</b>'), H2.includes('PARA TROCAR'), H2.includes('TROCAR A UEP NO CADASTRO'),
    H2.includes('CONFIRA O TEMPO ANTES DE TROCAR'), H2.indexOf('CONFIRA') < H2.indexOf('Esta medição dá')],
   [true, true, true, false, false, true, true]);
ok('o aviso do tempo só com a base pela meta e o produto mais leve que a faixa',
   [E1.confRegua, E2.confRegua, E3.confRegua, _uepConvHtml(E1).includes('CONFIRA O TEMPO')], [false, true, false, false]);
ok('o desenho não faz conta — em nenhuma das peças dele (UCV_DESENHO)', UCV_DESENHO.filter(f => UCV_SEM_CONTA.test(pegaJs(f))), []);
// v7.144.0 (PPCP: "colocar uma tela separada para isso"): aba própria
const iCr = html.indexOf('<section id="sec-crono"'), fCr = html.indexOf('</section>', iCr);
ok('o conversor mora na aba ⏱ CRONOANÁLISE (e não mais na ⚖ UEP)',
   [iCr > 0 && html.indexOf('id="uep-conv"') > iCr && html.indexOf('id="uep-conv"') < fCr, /data-tab="crono" onclick="setTab\('crono'\)"/.test(html),
    html.slice(html.indexOf('<section id="sec-uep"'), html.indexOf('</section>', html.indexOf('<section id="sec-uep"'))).includes('id="uep-conv"')],
   [true, true, false]);
const ST = pegaJs('function setTab(');
ok('abrir a aba desenha o conversor e lê o cadastro; o cadastro que chega redesenha a aba; o renderUep não cuida mais dele',
   [/tab==='crono'\)\{[^\n]*\n\s*_uepConvAtualiza\(\); _uepAbaCatCarregar\(\)\.then\(\(\)=>_ucvRegsCarregar\(\)\)\.then\(\(\)=>_ucvConfCarregar\(\)\)\.then\(\(\)=>_ucvLinhaCarregar\(\)\)\.then\(\(\)=>_ucvProgCarregar\(\)\); \}/.test(ST), /if\(_ucvAbaOn\(\)\) _uepConvAtualiza\(\);/.test(pegaJs('async function _capBuscar(')),
    pegaJs('function renderUep(').includes('_uepConvAtualiza')], [true, true, false]);
// v7.172.1 (print do PPCP): a frase de ajuda no meio dos botões quebrava o título e jogava o último botão numa fileira sozinho.
// v7.197.0 (PPCP: "está muito cheia a tela, tem que enxugar"): o 📄 IMPORTAR PDF à vista, as quatro impressões num menu
// e a frase de ajuda no title do título
{
  const SC = html.slice(iCr, fCr), iB = SC.indexOf('<div class="ucv-hdr-bts">'), iM = SC.indexOf('<details class="ucv-imp" id="uep-conv-imp">');
  const MENU = SC.slice(iM, SC.indexOf('</details>', iM)), FORA = SC.slice(iB, iM);
  // v7.207.0: o 🖨 do ONDE O TEMPO VAI (que virou sub-aba) entrou no menu — cinco impressões
  ok('cabeçalho da ⏱ CRONOANÁLISE: o IMPORTAR PDF à vista, as cinco impressões no menu 🖨 IMPRIMIR ▾ (cada uma fecha o menu antes), a frase de ajuda no title do título',
     [iB > 0 && iM > iB, (FORA.match(/<button /g) || []).length, (MENU.match(/onclick="_ucvImpFecha\(\);/g) || []).length, /<summary class="btn btn-ghost"[^>]*>🖨 IMPRIMIR ▾<\/summary>/.test(MENU),
      SC.includes('ucv-hdr-sub'), /class="tbl-hdr-ttl" title="O tempo por volume medido no tablet, convertido/.test(SC),
      /#sec-crono \.ucv-hdr \.tbl-hdr-ttl,#sec-uep \.ucv-hdr \.tbl-hdr-ttl[,{][^\n]*\{white-space:nowrap\}/.test(html), /#sec-crono \.ucv-imp-m,#sec-uep \.ucv-imp-m[,{][^\n]*\{position:absolute/.test(html)],
     [true, 1, 5, true, false, true, true, true]);
  // v7.198.0: a ⚖ UEP tem o mesmo menu — clique fora e Esc fecham qualquer um
  ok('o menu fecha no clique fora e no Esc (qualquer menu 🖨 aberto: cronoanálise e UEP); cada aba tem o seu fechar',
     [/document\.addEventListener\('click', e => \{ document\.querySelectorAll\('details\.ucv-imp\[open\]'\)\.forEach\(d => \{ if\(!d\.contains\(e\.target\)\) d\.open = false; \}\); \}\);/.test(html),
      /document\.addEventListener\('keydown', e => \{ if\(e\.key === 'Escape'\) document\.querySelectorAll\('details\.ucv-imp\[open\]'\)\.forEach\(d => \{ d\.open = false; \}\); \}\);/.test(html),
      /function _ucvImpFecha\(\)\{ const d = _ucvEl\('imp'\); if\(d\) d\.open = false; \}/.test(html), /function _uepImpFecha\(\)\{ const d = document\.getElementById\('uep-imp'\); if\(d\) d\.open = false; \}/.test(html)],
     [true, true, true, true]);
}
ok('a pele do conversor é da aba nova', [/#sec-crono \.uep-conv-f\{/.test(html), /#sec-uep \.uep-conv/.test(html)], [true, false]);
// v7.200.0: a base guardada até a v7.199 era um tempo RODANDO (a régua antiga): chave nova, e a antiga
// é apagada na 1ª abertura, ANTES de ler a guardada — senão o 7,9 voltaria ao campo contra o produto sem as lacunas
ok('a base guardada neste computador mudou de chave (rpe_uep_conv_lac) e a antiga (régua rodando) é apagada antes da leitura',
   [UEP_CONV_LS, pegaConst('UEP_CONV_LS_ANTIGA'),
    /if\(!UEP_CONV_INI\)\{[^]*?_ucvGuarda\(UEP_CONV_LS_ANTIGA, ''\);[^]*?const b = _ucvLe\(UEP_CONV_LS\)/.test(pegaJs('function _uepConvAtualiza('))],
   ['rpe_uep_conv_lac', "'rpe_uep_conv'", true]);
ok('a aba UEP aponta para a aba nova, e a FILA também abre de lá',
   [/onclick="setTab\('crono'\)"[^>]*>⏱ CRONOANÁLISE → UEP<\/button>/.test(html), html.slice(iCr, fCr).includes('gerarRelatorioFilaCrono()')], [true, true]);
// v7.142.1 — o PPCP digitou o 17,6 do PRÓPRIO Encanto no campo da base (1,58 e
// depois 0,06) e o Tab do último campo rolava a tela até o bloco 5
const E7 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 27.8, 17.6, 2530);
ok('base digitada: a diferença para a régua da meta sai pronta do montar (+40,8%)', [E7.base.daMeta, fmtP(E7.base.difMeta)], [false, '40,8%']);
const H7 = _uepConvHtml(E7);
ok('base digitada fica à vista, com o valor e o botão de voltar à MADERO medida — e antes do resultado',
   [H7.includes('BASE DIGITADA: 17,6 s POR VOLUME DA MADERO'), H7.includes('+40,8%'), H7.includes('_uepConvLimparBase()'),
    H7.indexOf('BASE DIGITADA') < H7.indexOf('UEP EQUIVALENTE')], [true, true, true, true]);
ok('base pela meta não é BASE DIGITADA: tem o aviso PRÓPRIO (desde a v7.148.0 é desvio da base medida)',
   [H1.includes('BASE DIGITADA'), _uepConvHtml(_uepConvMontar(PRODS, '', 0, 0, 2530)).includes('BASE DIGITADA'),
    H1.includes('BASE PELA RÉGUA DA META: 12,5 s POR UEP'), H1.includes('VOLTAR À MADERO MEDIDA (6,7 s)')], [false, false, true, true]);
ok('o rótulo diz de quem é o tempo da base (o nome vem do UEP_BASE)',
   [/><span>s\/VOLUME DA BASE \(<span id="uep-conv-base-nome">MADERO<\/span>\)<\/span><input id="uep-conv-base"/.test(html), html.includes('>SEGUNDOS DA BASE<'),
    /bn\.textContent = _uepBaseCurto\(\)/.test(pegaJs('function _uepConvAtualiza(')), _uepBaseCurto()], [true, false, true, 'MADERO']);
{
  const docAntes = global.document; let foco = null, evitou = false;
  global.document = { getElementById: id => ({ focus: () => { foco = id; } }) };
  eval.call(global, pegaJs('function _uepConvTecla('));
  _uepConvTecla({ key: 'Tab', shiftKey: false, preventDefault: () => { evitou = true; } });
  const r1 = [foco, evitou]; foco = null; evitou = false;
  _uepConvTecla({ key: 'Tab', shiftKey: true, preventDefault: () => { evitou = true; } });
  ok('Tab no campo da base volta ao PRODUTO (sem rolar a tela); Shift+Tab segue normal', [r1, [foco, evitou]], [['uep-conv-prod', true], [null, false]]);
  global.document = docAntes;
}
// v7.142.2 — PPCP: "as paradas são evitáveis se ajustar". Com a MADERO digitada a
// orientação pede o tempo cronometrado; base mais lenta que a régua da meta é suspeita.
// v7.200.0 (PPCP: "sem lacunas e acrescente 15%"): o tempo é o SEM AS LACUNAS.
eval.call(global, pegaJs('function _uepConvGuia('));
ok('sem a base cronometrada, a orientação é o período (e diz que o método certo é sem as lacunas); com ela, SEM AS LACUNAS',
   [/NO PERÍODO/.test(_uepConvGuia(true)), /MADERO <b>sem as lacunas<\/b>/.test(_uepConvGuia(true)),
    /<b>SEM AS LACUNAS<\/b> do produto/.test(_uepConvGuia(false)), /NO PERÍODO|COM A LINHA RODANDO/.test(_uepConvGuia(false))], [true, true, true, false]);
ok('a orientação é desenhada pelo _uepConvAtualiza (não é mais texto fixo no HTML)',
   [/id="uep-conv-guia"/.test(html), /_uepConvGuia\(/.test(pegaJs('function _uepConvAtualiza(')), html.includes('Use o tempo <b>NO PERÍODO</b> (paradas dentro): é a régua')], [true, true, false]);
ok('base mais lenta que a régua da meta é suspeita (o 17,6 do Encanto); a MADERO rodando a 8,7 s não é',
   [E7.base.suspeita, _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 2530).base.suspeita, E1.base.suspeita],
   [true, false, false]);
ok('o desenho cobra a conferência da base suspeita e, com a base, fala em tempo sem as lacunas',
   [H7.includes('não parece a MADERO sem as lacunas'), H7.includes('o tempo é o SEM AS LACUNAS (paradas marcadas e lacunas fora), nos dois'),
    _uepConvHtml(_uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 2530)).includes('não parece a MADERO')], [true, true, false]);
ok('Encanto rodando 17,6 ÷ MADERO rodando 8,7 = 2,02', _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 2530).uepVol.toFixed(2), '2.02');
// v7.143.1: o label é flex em coluna — texto solto ao lado do nome da base virava
// três linhas ("s/VOLUME DA BASE (" · "SLEEP" · ")") e desalinhava os campos.
ok('o rótulo da base é UM item do label (texto e nome no mesmo span)',
   /<label[^>]*>s\/VOLUME DA BASE/.test(html), false);
// v7.143.1: depois da base vem o 📌 FIXAR — o Tab que volta ao PRODUTO era dele.
// v7.193.0: o ✕ LIMPAR veio depois do FIXAR e virou o último foco: o Tab é dele.
ok('o último foco do conversor (o LIMPAR, depois do FIXAR) tem o Tab ligado; o FIXAR e o campo da base não',
   [/id="uep-conv-limpar"[^>]*onkeydown="_uepConvTecla\(event\)"/.test(html), /id="uep-conv-fixar"[^>]*onkeydown=/.test(html),
    /id="uep-conv-base"[^>]*onkeydown=/.test(html), html.indexOf('id="uep-conv-limpar"') > html.indexOf('id="uep-conv-fixar"')], [true, false, false, true]);
// ✕ LIMPAR (v7.193.0, PPCP 03/11/2026, com um PDF importado na tela: "ter opção
// de limpar"). Zera o estudo da tela; base, tolerância e MEDIDO POR ficam.
{
  const docAntes = global.document, elAntes = global._ucvEl, atAntes = global._uepConvAtualiza;
  const val = { prod:'501155 · SAPATEIRA VIVARE', seg:'13,5', base:'6,7', tol:'15', 'r-data':'03/11/2026', 'r-per':'16,2',
                'r-rod':'14,0', 'r-vol':'55', 'r-vel':'9', 'r-quem':'JOÃO' };
  const txt = { 'i-msg':'✓ Importado: Sapateira Vivare', 'r-msg':'✓ Medição registrada', 'x-msg':'✓ excluída' };
  const els = {}; let foco = null, redesenhou = 0;
  Object.keys(val).forEach(n => { els[n] = { value: val[n], focus: () => { foco = n; } }; });
  Object.keys(txt).forEach(n => { els[n] = { textContent: txt[n] }; });
  global._ucvEl = n => els[n] || null;
  global._uepConvAtualiza = () => { redesenhou++; };
  eval.call(global, 'global.UCV_LIMPAR_CAMPOS = ' + pegaConst('UCV_LIMPAR_CAMPOS') + '; global.UCV_LIMPAR_MSGS = ' + pegaConst('UCV_LIMPAR_MSGS') + ';');
  eval.call(global, pegaJs('function _ucvLimpar('));
  _ucvLimpar();
  ok('✕ LIMPAR zera produto, tempo e os campos do registro; base, tolerância e MEDIDO POR ficam',
     Object.keys(val).map(n => n + '=' + els[n].value),
     ['prod=', 'seg=', 'base=6,7', 'tol=15', 'r-data=', 'r-per=', 'r-rod=', 'r-vol=', 'r-vel=', 'r-quem=JOÃO']);
  ok('✕ LIMPAR apaga os avisos (importado, registro, exclusão), redesenha a tela e volta ao PRODUTO',
     [Object.keys(txt).map(n => els[n].textContent), redesenhou, foco], [['', '', ''], 1, 'prod']);
  ok('✕ LIMPAR não grava nem apaga nada: nem planilha nem o que é guardado neste computador',
     /jsonp|_ucvGuarda|localStorage|CFG\.sheetsUrl/.test(pegaJs('function _ucvLimpar(')), false);
  global.document = docAntes; global._ucvEl = elAntes; global._uepConvAtualiza = atAntes;
}
// 📌 FIXAR (v7.143.1, PPCP: "deixa um botão para fixar sleep"; a base hoje é a MADERO)
eval.call(global, pegaJs('function _uepConvFixar('));
ok('FIXAR: com a base no produto e o tempo dela, fixa o tempo; sem tempo ou com outro produto, escolhe a base',
   [_uepConvFixar(PRODS, 'MESA CABECEIRA MADERO', 8.7), _uepConvFixar(PRODS, 'MESA CABECEIRA MADERO', 0), _uepConvFixar(PRODS, 'ARMARIO ENCANTO', 27.8)],
   [{ acao: 'fixar', seg: 8.7 }, { acao: 'escolher', rot: '501149 · MESA CABECEIRA MADERO' }, { acao: 'escolher', rot: '501149 · MESA CABECEIRA MADERO' }]);
ok('FIXAR sem a base no cadastro não faz nada', _uepConvFixar(PRODS.filter(p => p.modelo !== '501149'), 'X', 1), { acao: 'sem-base' });
ok('o placeholder do campo da base diz que é a base medida, não exemplo', /elB\.placeholder = _uepBaseCurto\(\) \+ ' ' \+ medTxt/.test(pegaJs('function _uepConvEntradas(')), true);
ok('o texto da base manda clicar no FIXAR', _uepConvHtml(E6).includes('clique em <b>📌 FIXAR</b>'), true);
ok('o conversor não grava: nada de jsonpEscrita nem setUepCatalogo nele',
   /jsonpEscrita|setUepCatalogo/.test(pegaJs('function _uepConvAtualiza(') + pegaJs('function _uepConvBase(')), false);

// v7.143.2 — PPCP: "tenho que ver qual volume é" e "fixa sleep no volume base"
ok('produto de 2 volumes ganha uma linha por volume (o de 1 volume não)',
   [PRODS.filter(p => p.modelo === '501059').map(p => p.rot), PRODS.filter(p => p.modelo === '501139').length],
   [['501059 · PENTEADEIRA CAMARIM STRASS', '501059 · PENTEADEIRA CAMARIM STRASS · VOL 1/2', '501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2'], 1]);
ok('o nome do produto escolhe o produto inteiro; o código escolhe o VOLUME dele',
   [_uepConvAchar(PRODS, 'penteadeira camarim strass').p.rot, _uepConvAchar(PRODS, '501.059.002').p.rot],
   ['501059 · PENTEADEIRA CAMARIM STRASS', '501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2']);
const EV = _uepConvMontar(PRODS, '501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2', 25, 0, 2530);
ok('um volume: a UEP e o que digitar são só dele (25 s → 2,00 contra 2,29 do VOL 2/2)',
   [EV.uepVol.toFixed(2), EV.volCad, EV.digitar.map(g => [g.uep, g.cods.map(c => c.cod)])], ['2.00', 2.29, [[2, ['501059002']]]]);
const EM = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 27.8, 10.4, 3048);
ok('base digitada igual à régua da meta (10,4 com 3.048) É a régua da meta: tempo do período, aviso da régua (não BASE DIGITADA)',
   [EM.base.igualMeta, EM.base.daMeta, EM.base.suspeita, _uepConvHtml(EM).includes('BASE DIGITADA'), _uepConvHtml(EM).includes('o tempo é o NO PERÍODO'),
    _uepConvHtml(EM).includes('BASE PELA RÉGUA DA META')],
   [true, true, false, false, true, true]);
const EM2 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 27.8, 10.6, 3048);
ok('acima de 1% da régua já é base digitada (e suspeita, se mais lenta)', [EM2.base.daMeta, EM2.base.suspeita], [false, true]);
const AT = pegaJs('function _uepConvAtualiza('), EN = pegaJs('function _uepConvEntradas(');
ok('o campo da base mostra a base padrão quando vazio, sem gravar, e a orientação segue a conta',
   [/elB\.dataset\.auto === '1'/.test(EN), /document\.activeElement !== elB/.test(EN), /_uepConvGuia\(R\.base\.daMeta\)/.test(AT),
    /oninput="this\.dataset\.auto='';_uepConvBase\(\)"/.test(html)], [true, true, true, true]);

// ════════════════════════════════════════════════════════════════════════════
// 🖨 IMPRIMIR da aba ⏱ CRONOANÁLISE (v7.145.0, PPCP: "falta impressão")
console.log('\n── CRONOANÁLISE → UEP: a impressão ──');
global.APP_NOME_CX = global.APP_NOME_CX || 'RITMOPATRIMAR';
global.UCV_REG_CAMPOS = eval('(' + pegaConst('UCV_REG_CAMPOS') + ')');
['function _uepConvDocTitulo(', 'function _uepConvDocHtml('].forEach(f => eval.call(global, pegaJs(f)));
const ctxI = { data: '19/10/2026', hora: '16:05' };
const DI = _uepConvDocHtml(E1, ctxI), DV = _uepConvDocHtml(EV, ctxI);
ok('o papel tem a medição (a MESMA marcação da tela), o como ler e o registro da medição',
   [DI.includes(_uepConvHtml(E1)), DI.includes(_uepConvGuia(E1.base.daMeta)), DI.includes('Esta medição dá'), DI.includes('>2,22<'),
    DI.includes('REGISTRO DA MEDIÇÃO'), DI.includes('VELOCIDADE DA ESTEIRA (m/min)'), DI.includes('gerado 19/10/2026 às 16:05')],
   [true, true, true, true, true, true, true]);
ok('o desenho do papel não faz conta (só a tela + títulos + caneta)',
   /_uepConvMontar\(|_taktUep\(|UEP_PAD_FAIXA/.test(pegaJs('function _uepConvDocHtml(')), false);
ok('nome do arquivo (o <title>) sem / e : — o Windows não aceita',
   [_uepConvDocTitulo(EV, ctxI), /[\/:]/.test(_uepConvDocTitulo(EV, ctxI))],
   ['Cronoanálise UEP - 501059 · PENTEADEIRA CAMARIM STRASS · VOL 2-2 - 19-10-2026 16h05', false]);
const GC = pegaJs('function gerarRelatorioCrono(');
// Revisão adversarial da v7.145.0: o papel lia o campo da base cru e a tela o
// sincronizava com a meta — com a meta mudada pelo ⚙ ou pelo refresh, o papel
// saía "BASE DIGITADA" com a régua antiga. Hoje as DUAS leem _uepConvEntradas.
const MONTA = 'const R = _uepConvMontar(UEP_CONV_PRODS, E.txt, E.seg, E.base, E.meta, E.tol, E.linha, E.regs, E.travas);';
ok('tela e papel leem as entradas pela MESMA função e montam com a MESMA chamada',
   [/const E = _uepConvEntradas\(\);/.test(AT), /const E = _uepConvEntradas\(\);/.test(GC), AT.includes(MONTA), GC.includes(MONTA),
    (JS.match(/(?<!function )_uepConvEntradas\(\)/g) || []).length, /_uepConvDocHtml\(R, ctx\)/.test(GC), GC.indexOf('_uepConvAtualiza();') < GC.indexOf('_uepConvEntradas()')],
   [true, true, true, true, 4, true, true]);   // 4: tela, papel, o 💾 REGISTRAR (v7.150.0) e o 📄 IMPORTAR (v7.158.0) — o ✓ TROCAR saiu na v7.233.0
{
  // O caso da revisão, rodando a função real: campo automático em 10,4 (meta
  // 3.048) e a meta muda para 2.530 sem a aba redesenhar.
  eval.call(global, pegaJs('function _pgSimNum('));
  eval.call(global, pegaJs('function _uepConvEntradas('));
  const docAntes = global.document, pdAntes = global.PONTOS_DIA;
  const campos = { 'uep-conv-prod': { value: 'ARMARIO ENCANTO' }, 'uep-conv-seg': { value: '27,8' }, 'uep-conv-base': { value: '10,4', dataset: { auto: '1' } }, 'uep-conv-tol': { value: '' } };
  global.document = { activeElement: null, getElementById: id => campos[id] || null };
  global.PONTOS_DIA = { metaUep: 2530 };
  const e1 = _uepConvEntradas();
  campos['uep-conv-base'] = { value: '8,7', dataset: { auto: '' } };          // a base DIGITADA não é tocada
  const e2 = _uepConvEntradas();
  ok('o campo automático (o 10,4 antigo da meta) passa a mostrar a MADERO medida (6,7 sem as lacunas); o digitado fica como está',
     [e1.base, campos['uep-conv-base'].value, e2.base, e1.meta, e1.txt, e1.seg], [6.7, '8,7', 8.7, 2530, 'ARMARIO ENCANTO', 27.8]);
  // tolerância: vazio vira 15 e fica à vista no campo; 0 é zero (não volta a 15)
  ok('o campo da tolerância vem com 15% (à vista); digitado 0 vale 0',
     [e1.tol, campos['uep-conv-tol'].value, (campos['uep-conv-tol'].value = '0', _uepConvEntradas().tol)], [15, '15', 0]);
  global.document = docAntes; global.PONTOS_DIA = pdAntes;
}
ok('sem conversão pronta não abre janela; com ela, abre no clique (nenhuma leitura antes)',
   [GC.indexOf("R.estado !== 'ok'") > 0 && GC.indexOf("R.estado !== 'ok'") < GC.indexOf('window.open('), /await /.test(GC)], [true, false]);
ok('documento compartilhado, EM PÉ, com o cabeçalho e o botão comuns',
   [/_rpDocParadas\(_uepConvDocTitulo\(R, ctx\), false\)/.test(GC), /_rpCabecalho\('CRONOANÁLISE → UEP'/.test(GC), /_rpBotaoImprimir\(\)/.test(GC)], [true, true, true]);
const SK = pegaConst('_UCV_DOC_SKIN').replace(/^`|`$/g, '');
ok('a pele do papel é escopada em .ucv-doc (não mexe nos outros relatórios do documento)',
   SK.split('\n').map(l => l.trim()).filter(Boolean).every(l => l.startsWith('.ucv-doc ')), true);
ok('no papel, o botão VOLTAR À BASE MEDIDA some', /\.ucv-doc \.uep-conv-av \.btn\{display:none\}/.test(SK), true);
// Revisão: na folha da base saía "clique em 📌 FIXAR" — botão que só existe na tela.
const HB = _uepConvHtml(E6);
ok('o "clique em 📌 FIXAR" é só da tela (.so-tela, que o documento esconde); o papel tem a frase sem botão (.so-papel, que a aba esconde)',
   [/<span class="so-tela">clique em <b>📌 FIXAR<\/b>[^<]*<\/span>/.test(HB), /<span class="so-papel">fixe [^<]*s\/VOLUME DA BASE[^<]*<\/span>/.test(HB),
    /\.so-tela\{display:none\}/.test(pegaJs('function _rpDocParadas(')), /#sec-crono \.so-papel\{display:none\}/.test(html)],
   [true, true, true, true]);
ok('o botão 🖨 CONVERSÃO DA TELA mora no menu da aba ⏱ CRONOANÁLISE', html.slice(iCr, fCr).includes('onclick="_ucvImpFecha();gerarRelatorioCrono()"'), true);

// ════════════════════════════════════════════════════════════════════════════
// TOLERÂNCIA de fadiga e movimentação (v7.146.0, PPCP: "15% iguais para todos")
// ⚠ Os 8,7 s de base são EXEMPLO (estimativa do limite da esteira para a
// MADERO, base antiga), não cronometragem da SLEEP.
console.log('\n── CRONOANÁLISE → UEP: a tolerância ──');
ok('o padrão é 15%', UEP_CONV_TOL_PADRAO, 15);
const T0 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 3048, 0), T15 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 3048, 15),
      T30 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 3048, 30);
ok('a MESMA tolerância no produto e na base se cancela: a UEP não muda (0%, 15%, 30%)',
   [T0.uepVol, T15.uepVol, T30.uepVol].map(x => x.toFixed(4)), [T0.uepVol.toFixed(4), T0.uepVol.toFixed(4), T0.uepVol.toFixed(4)]);
ok('tempo padrão = medido × 1,15 no produto (17,6 → 20,2) e na base (8,7 → 10,0); a UEP é a razão dos dois',
   [T15.tpSeg.toFixed(2), T15.base.tpSeg.toFixed(3), (T15.tpSeg / T15.base.tpSeg).toFixed(4)], ['20.24', '10.005', T15.uepVol.toFixed(4)]);
const TM = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 27.8, 0, 3048, 15);
ok('com a régua da meta a tolerância NÃO entra (ela já tem fadiga e paradas dentro): sem tempo padrão, UEP igual',
   [TM.base.tolAplica, TM.tpSeg, TM.uepVol.toFixed(4)], [false, null, _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 27.8, 0, 3048, 0).uepVol.toFixed(4)]);
// Revisão da v7.146.0: só o 15% (que é o padrão) era conferido — trocar a conta
// por "sempre o padrão" passava. O tempo padrão tem de seguir o que foi DIGITADO.
ok('o tempo padrão segue a tolerância digitada (30% → 17,6 × 1,3 = 22,88; base 8,7 × 1,3 = 11,31)',
   [T30.tpSeg.toFixed(2), T30.base.tpSeg.toFixed(2), T30.base.tolFator], ['22.88', '11.31', 1.3]);
ok('com a tolerância, a RÉGUA diz qual número da base é o medido e qual é o tempo padrão',
   [_uepConvHtml(T15).includes('8,7 s por UEP medido (tempo padrão 10,0 s)'), _uepConvHtml(TM).includes(' medido (tempo padrão')], [true, false]);
ok('tolerância vazia ou fora de 0–100 vira o padrão; 0 é zero',
   [_uepConvMontar(PRODS, 'X', 1, 8.7, 3048, undefined).base.tol, _uepConvMontar(PRODS, 'X', 1, 8.7, 3048, 150).base.tol, T0.base.tol], [15, 15, 0]);
const HT = _uepConvHtml(T15), HM = _uepConvHtml(TM);
ok('a tela mostra o tempo padrão e a razão dos tempos padrão; com a meta, diz por que a tolerância não entra',
   [HT.includes('tempo padrão <b>20,2 s</b> (+15%)'), HT.includes('20,2 s ÷ 10,0 s (tempo padrão, +15% nos dois)'), HT.includes('A mesma tolerância nos dois se cancela na UEP'),
    HM.includes('tempo padrão <b>'), HM.includes('não entra: a régua da meta já tem fadiga, movimentação e paradas dentro')],
   [true, true, true, false, true]);
ok('o campo TOLERÂNCIA (%) está na aba, antes do FIXAR (o Tab do FIXAR continua sendo o último)',
   [html.indexOf('id="uep-conv-tol"') > html.indexOf('id="uep-conv-base"'), html.indexOf('id="uep-conv-tol"') < html.indexOf('id="uep-conv-fixar"')], [true, true]);
ok('o desenho continua sem conta (o multiplicador da tolerância vem pronto do montar)', UCV_DESENHO.filter(f => UCV_SEM_CONTA.test(pegaJs(f))), []);
// Revisão da v7.146.0: 1 + 14/100 é 1,1400000000000001 em ponto flutuante
const T14 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 3048, 14), H14 = _uepConvHtml(T14);
ok('o multiplicador sai limpo (14% → × 1,14), sem a cauda do ponto flutuante',
   [T14.base.tolFator, H14.includes('medido × 1,14.'), /1,1400000/.test(H14)], [1.14, true, false]);
const TF = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 3048, 150), TN = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 3048, NaN);
ok('valor fora de 0–100 ou ilegível: vale o padrão E a tela diz (o campo mostra outra coisa)',
   [TF.base.tol, TF.base.tolFora, TN.base.tol, TN.base.tolFora, T15.base.tolFora, _uepConvHtml(TF).includes('⚠ o valor digitado não vale (0 a 100%): vale o padrão, 15%.')],
   [15, true, 15, true, false, true]);
const HZ = _uepConvHtml(T0);
ok('0% é zero: sem "tempo padrão +0%", a razão volta a ser a dos tempos medidos',
   [T0.tpSeg, T0.base.tpSeg, HZ.includes('tempo padrão <b>'), HZ.includes('zero: o tempo padrão é o próprio medido.'), HZ.includes('17,6 s ÷ 8,7 s')], [null, null, false, true, true]);
{ // o campo com texto sem algarismo NÃO vira 0% (o _pgSimNum devolveria 0)
  const docAntes = global.document, pdAntes = global.PONTOS_DIA;
  const campos = { 'uep-conv-prod': { value: '' }, 'uep-conv-seg': { value: '' }, 'uep-conv-base': { value: '', dataset: {} }, 'uep-conv-tol': { value: 'abc' } };
  global.document = { activeElement: null, getElementById: id => campos[id] || null };
  global.PONTOS_DIA = { metaUep: 3048 };
  const eA = _uepConvEntradas();
  campos['uep-conv-tol'].value = '12,5'; const eB = _uepConvEntradas();
  ok('tolerância sem algarismo chega como NaN (padrão + aviso), nunca 0; "12,5" é 12,5',
     [Number.isNaN(eA.tol), _uepConvMontar(PRODS, 'X', 1, 8.7, 3048, eA.tol).base.tolFora, eB.tol], [true, true, 12.5]);
  global.document = docAntes; global.PONTOS_DIA = pdAntes;
}
// O risco de contar duas vezes é do USUÁRIO: digitar o medido já com +15%.
// A UEP subiria 15% (só o produto inflado). A tela tem de dizer como digitar.
global._uepBaseCurto = global._uepBaseCurto || (() => 'SLEEP');
eval.call(global, pegaJs('function _uepConvGuia('));
ok('o COMO LER e o campo do medido dizem: o tempo MEDIDO, sem somar tolerância (nas duas réguas)',
   [_uepConvGuia(false).includes('sem somar tolerância'), _uepConvGuia(true).includes('sem somar tolerância'),
    /title="[^"]*sem somar tolerância[^"]*"><span id="uep-conv-seg-rot">s\/VOLUME SEM AS LACUNAS<\/span>/.test(html)], [true, true, true]);
{ // a tolerância digitada fica no computador e volta no campo vazio (F5)
  eval.call(global, pegaJs('function _uepConvTol('));
  const docAntes = global.document, lsAntes = global.localStorage, atAntes = global._uepConvAtualiza, pdAntes = global.PONTOS_DIA;
  const mem = {}; global.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
  global._uepConvAtualiza = () => {};
  const campos = { 'uep-conv-prod': { value: '' }, 'uep-conv-seg': { value: '' }, 'uep-conv-base': { value: '', dataset: {} }, 'uep-conv-tol': { value: '20' } };
  global.document = { activeElement: null, getElementById: id => campos[id] || null };
  global.PONTOS_DIA = { metaUep: 3048 };
  _uepConvTol();
  const salvo = mem[UEP_CONV_TOL_LS];
  campos['uep-conv-tol'].value = '';                         // F5: o campo nasce vazio
  const eF5 = _uepConvEntradas();
  campos['uep-conv-tol'].value = ''; _uepConvTol();          // apagou: some do computador, volta o padrão
  const eLimpo = _uepConvEntradas();
  ok('a tolerância digitada fica no computador e volta depois do F5; apagada, volta o padrão',
     [salvo, eF5.tol, campos['uep-conv-tol'].value === '15' && !(UEP_CONV_TOL_LS in mem), eLimpo.tol], ['20', 20, true, 15]);
  global.document = docAntes; global.localStorage = lsAntes; global._uepConvAtualiza = atAntes; global.PONTOS_DIA = pdAntes;
}
// Verificação final da v7.146.0: o piso, o 100 e o vazio não eram conferidos (tirar
// o tN >= 0 deixava -15 virar "zero" calado), e o aviso só existia com produto e tempo.
{ const TT = (t, prod, seg) => _uepConvMontar(PRODS, prod == null ? 'ARMARIO ENCANTO' : prod, seg == null ? 17.6 : seg, 8.7, 3048, t).base;
  ok('a faixa é 0 a 100: -15 e 101 avisam e valem 15; 100 vale; vazio e sem valor não avisam',
     [[TT(-15).tol, TT(-15).tolFora], [TT(101).tol, TT(101).tolFora], [TT(100).tol, TT(100).tolFora], TT('').tolFora, TT(undefined).tolFora, TT(0).tolFora],
     [[15, true], [15, true], [100, false], false, false, false]);
  const HS = _uepConvHtml(_uepConvMontar(PRODS, '', 0, 8.7, 3048, 150)), HT0 = _uepConvHtml(_uepConvMontar(PRODS, 'ARMARIO ENCANTO', 0, 8.7, 3048, 150));
  ok('o aviso de tolerância inválida aparece também sem produto e sem tempo (a régua já mostra o tempo padrão)',
     [HS.includes('tempo padrão 10,0 s'), HS.includes('⚠ o valor digitado não vale (0 a 100%): vale o padrão, 15%.'), HT0.includes('⚠ o valor digitado não vale'),
      _uepConvHtml(_uepConvMontar(PRODS, '', 0, 8.7, 3048, 15)).includes('⚠')], [true, true, true, false]);
}
{ // digitando: com o campo da tolerância EM FOCO e apagado, ele não é preenchido de volta (o "15" viraria "1520")
  const docAntes = global.document, pdAntes = global.PONTOS_DIA;
  const tol = { value: '' };
  const campos = { 'uep-conv-prod': { value: '' }, 'uep-conv-seg': { value: '' }, 'uep-conv-base': { value: '', dataset: {} }, 'uep-conv-tol': tol };
  global.document = { activeElement: tol, getElementById: id => campos[id] || null };
  global.PONTOS_DIA = { metaUep: 3048 };
  const eFoco = _uepConvEntradas();
  ok('com o campo em foco e vazio: ele fica vazio enquanto se digita, e a conta usa o padrão (não 0)', [tol.value, eFoco.tol], ['', 15]);
  global.document = docAntes; global.PONTOS_DIA = pdAntes;
}
ok('o campo TOLERÂNCIA se refaz ao sair dele (apagado, volta a mostrar o padrão)',
   /id="uep-conv-tol"[^>]*onblur="_uepConvAtualiza\(\)"/.test(html), true);

// ════════════════════════════════════════════════════════════════════════════
// A BASE CRONOMETRADA é a padrão (v7.148.0 com a SLEEP; v7.152.0, PADRÃO DE
// UEP, com a MADERO — medida em 20/10/2026 igual à SLEEP: rodando 7,9 · sem
// lacunas 6,7; o NO PERÍODO dela não veio legível). Até a v7.199 valia o
// RODANDO; desde a v7.200.0 (PPCP: "sem lacunas e acrescente 15%"), o SEM AS LACUNAS.
console.log('\n── CRONOANÁLISE → UEP: a MADERO medida é a base ──');
ok('a base medida é a MADERO SEM AS LACUNAS: 6,7 s em 20/10/2026, 60 volumes; o rodando (7,9) só para o quadro; período sem número',
   [UEP_BASE_MEDIDA.seg, UEP_BASE_MEDIDA.data, UEP_BASE_MEDIDA.volumes, UEP_BASE_MEDIDA.periodo, UEP_BASE_MEDIDA.rodando, 'semLacunas' in UEP_BASE_MEDIDA], [6.7, '20/10/2026', 60, null, 7.9, false]);
{ const SM = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 6.7, 3048, 15), HS = _uepConvHtml(SM);
  ok('com 6,7 a base é a MEDIDA: sem aviso nenhum, régua com data e volumes, tolerância entra (6,7 → 7,7 s)',
     [SM.base.medida, SM.base.daMeta, HS.includes('uep-conv-av'), HS.includes('a MADERO cronometrada, sem as lacunas (20/10/2026, 60 volumes)'),
      SM.base.tolAplica, SM.base.tpSeg.toFixed(3)], [true, false, false, true, true, '7.705']);
  ok('o caso real: Encanto sem as lacunas 17,6 ÷ MADERO sem as lacunas 6,7 = 2,63 (pela régua rodando dava 2,23: a MADERO tinha 15% de lacunas)', SM.uepVol.toFixed(2), '2.63');
  const SD = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.6, 3048, 15), HD = _uepConvHtml(SD);
  ok('outro tempo (8,6) é BASE DIGITADA, com o botão de voltar à MADERO medida',
     [SD.base.medida, HD.includes('BASE DIGITADA: 8,6 s POR VOLUME DA MADERO'), HD.includes('A MADERO medida é 6,7 s sem as lacunas (20/10/2026)'), HD.includes('VOLTAR À MADERO MEDIDA (6,7 s)')],
     [false, true, true, true]);
  ok('igual a uma casa É a medida (6,74 sim, 6,8 não); o 7,9 da régua rodando agora é BASE DIGITADA',
     [_uepConvBaseDe(6.74, 3048).medida, _uepConvBaseDe(6.8, 3048).medida, _uepConvBaseDe(0, 3048).medida, _uepConvBaseDe(7.9, 3048).medida], [true, false, false, false]);
}
{ const B1 = _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 6.7, 6.7, 2530, 15), B2 = _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 7.1, 6.7, 2530, 15);
  ok('a própria MADERO: o tempo da base em uso diz que é ela; tempo novo manda FIXAR (neste computador)',
     [B1.emUso, _uepConvHtml(B1).includes('6,7 s é a base em uso — cada produto entra com o tempo sem as lacunas dele'), _uepConvHtml(B1).includes('📌 FIXAR</b>'),
      B2.emUso, _uepConvHtml(B2).includes('clique em <b>📌 FIXAR</b> para usar 7,1 s como base neste computador')],
     [true, true, false, false, true]);
}
ok('o COMO LER com a base cronometrada cita a MADERO medida sem as lacunas, nos dois',
   [_uepConvGuia(false).includes('a MADERO deu 6,7 s'), _uepConvGuia(false).includes('paradas marcadas e lacunas fora'), _uepConvGuia(true).includes('6,7 s, medida em 20/10/2026'),
    _uepConvGuia(false).includes('as lacunas ficam dentro')], [true, true, true, false]);
{ // a tela: vazio mostra 6,7; apagado COM O FOCO continua valendo a medida (não pula para a meta)
  const docAntes = global.document, pdAntes = global.PONTOS_DIA;
  const base = { value: '', dataset: {} };
  const campos = { 'uep-conv-prod': { value: '' }, 'uep-conv-seg': { value: '' }, 'uep-conv-base': base, 'uep-conv-tol': { value: '' } };
  global.document = { activeElement: null, getElementById: id => campos[id] || null };
  global.PONTOS_DIA = { metaUep: 3048 };
  const eV = _uepConvEntradas();
  const r1 = [eV.base, base.value, base.dataset.auto, base.placeholder];
  base.value = ''; base.dataset.auto = ''; global.document.activeElement = base;
  const eF = _uepConvEntradas();
  ok('campo vazio: mostra 6,7 (automático) e vale 6,7; apagado com o foco: fica vazio e vale 6,7',
     [r1, [eF.base, base.value]], [[6.7, '6,7', '1', 'MADERO 6,7'], [6.7, '']]);
  global.document = docAntes; global.PONTOS_DIA = pdAntes;
}
ok('o título do campo diz que vazio é a MADERO medida (e não mais a régua da meta)',
   [/id="uep-conv-base"/.test(html), /title="[^"]*Vazio, vale a MADERO medida em 20\/10\/2026: 6,7 s sem as lacunas[^"]*"><span>s\/VOLUME DA BASE/.test(html)], [true, true]);

// QUAL NÚMERO DO VOLUME A VOLUME (v7.149.0, PPCP: "deixa claro no painel qual
// medida eu coloco para comparar com sleep")
{ const QM = _uepConvQual(_uepConvBaseDe(6.7, 2530)), QR = _uepConvQual(_uepConvBaseDe(0, 2530)), QD = _uepConvQual(_uepConvBaseDe(8.6, 2530));
  const usa = h => (h.match(/<div class="ucv-q usa"><span class="ucv-q-l">([^<]+)</) || [])[1];
  // O NO PERÍODO da MADERO não veio legível: o cartão diz "não use" sem número (nunca inventa).
  ok('com a MADERO medida o destaque é o SEM AS LACUNAS, com os 6,7 dela; os outros dois dizem "não use" — com o número só quando a medição tem',
     [usa(QM), QM.includes('a MADERO deu <b>6,7 s</b> aqui'), /POR VOLUME NO PERÍODO<\/span><span class="ucv-q-s">com as paradas<\/span><span class="ucv-q-v">não use<\/span>/.test(QM),
      QM.includes('não use · MADERO 7,9 s'), (QM.match(/ucv-q usa/g) || []).length],
     ['POR VOLUME SEM AS LACUNAS', true, true, true, 1]);
  ok('com a régua da meta o destaque é o NO PERÍODO (base 12,5); com base digitada, o SEM AS LACUNAS com o número dela',
     [usa(QR), QR.includes('base: a régua da meta, 12,5 s'), usa(QD), QD.includes('base digitada: 8,6 s'), QD.includes('MADERO 7,9')],
     ['POR VOLUME NO PERÍODO', true, 'POR VOLUME SEM AS LACUNAS', true, false]);
  ok('os nomes são os do app (Volume a volume) e o desenho não faz conta',
     [['POR VOLUME NO PERÍODO', 'POR VOLUME COM A LINHA RODANDO', 'POR VOLUME SEM AS LACUNAS'].every(t => QM.includes(t)), UCV_SEM_CONTA.test(pegaJs('function _uepConvQual('))], [true, false]);
  const AT2 = pegaJs('function _uepConvAtualiza('), DH = pegaJs('function _uepConvDocHtml(');
  // v7.197.0 (PPCP: "está muito cheia a tela"): na tela, UMA linha logo abaixo dos campos; os três cartões, o
  // porquê e as notas no ⓘ COMO LER (só o miolo é refeito: aberto, não fecha a cada tecla); o papel como sempre
  ok('a faixa vai na tela (uma linha abaixo dos campos; os três cartões no ⓘ COMO LER) e no papel; o rótulo do campo segue a régua',
     [/guia\.innerHTML = _uepConvQualCurto\(R\.base\);/.test(AT2), /ler\.innerHTML = _uepConvQual\(R\.base\) \+ _uepConvGuia\(R\.base\.daMeta\) \+ \(R\.estado === 'ok' \? _uepConvNotasHtml\(R\.base\) : ''\)/.test(AT2),
      /_ucvEl\('ler-c'\)/.test(AT2), /<details class="ucv-ler" id="uep-conv-ler">[^\n]*<div id="uep-conv-ler-c"><\/div><\/details>/.test(html),
      /_uepConvQual\(R\.base\) \+ _uepConvGuia/.test(DH),
      /rot\.textContent = R\.base\.daMeta \? 's\/VOLUME NO PERÍODO' : 's\/VOLUME SEM AS LACUNAS'/.test(AT2), /\.ucv-doc \.ucv-q\.usa\{/.test(html)],
     [true, true, true, true, true, true, true]);
  const Q1M = _uepConvQualCurto(_uepConvBaseDe(6.7, 2530)), Q1R = _uepConvQualCurto(_uepConvBaseDe(0, 2530)), Q1D = _uepConvQualCurto(_uepConvBaseDe(8.6, 2530));
  ok('a linha curta: o cartão que vale e o número da base nele; os outros dois em "não use" (a mesma regra dos três cartões)',
     [Q1M.includes('<b class="ucv-q1-u">POR VOLUME SEM AS LACUNAS</b>'), Q1M.includes('a MADERO deu <b>6,7 s</b> nele'), Q1M.includes('não use NO PERÍODO nem COM A LINHA RODANDO'),
      Q1R.includes('<b class="ucv-q1-u">POR VOLUME NO PERÍODO</b>'), Q1R.includes('base: a régua da meta, 12,5 s'), Q1R.includes('não use COM A LINHA RODANDO nem SEM AS LACUNAS'),
      Q1D.includes('base digitada: <b>8,6 s</b>')],
     [true, true, true, true, true, true, true]);
  ok('na tela o resultado sai sem as notas TOLERÂNCIA · RÉGUA · GRAVAÇÃO (vão para o ⓘ COMO LER); o papel continua com elas',
     [_uepConvHtml(E1).includes('<span>GRAVAÇÃO</span>'), _uepConvHtml(E1, true).includes('<span>GRAVAÇÃO</span>'), _uepConvHtml(E1, true).includes('Esta medição dá'),
      /res\.innerHTML = _uepConvHtml\(R, true\);/.test(AT2), /_uepConvHtml\(R\)/.test(DH)],
     [true, false, true, true, true]);
  ok('o cartão MEDIDO diz de qual cartão do app veio o número',
     [_uepConvHtml(_uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 6.7, 3048)).includes('>MEDIDO · SEM AS LACUNAS<'), H1.includes('>MEDIDO · NO PERÍODO<')], [true, true]);
}

// ════════════════════════════════════════════════════════════════════════════
// NA PRODUÇÃO + REGISTRO DA MEDIÇÃO (v7.150.0, PPCP: "pode fazer tbm guardar o
// que é cronoanalise e que linha faz"; v7.160.0, PPCP 26/10/2026, sobre o s/cx
// da ELOA: "mas esse tempo é cheio de paradas" → "faz as duas")
console.log('\n── CRONOANÁLISE → UEP: na produção (% do padrão, volume sozinho) e o registro ──');
{ // a ELOA e a MADERO de verdade (log e aba PARADAS de 26/09–25/10/2026), com o cadastro de antes da troca: VOL 1/2 2,19 · VOL 2/2 2,53
  const PE = _uepConvProdutos(['1', '3', '5'].map(c => ({ codigo:'50106100' + c, desc:'VOL 1/2 PENTEADEIRA CAMARIM ELOA', cor:'C' + c, uep:2.19, uepVig:'16/10/2026' }))
    .concat(['2', '4', '6'].map(c => ({ codigo:'50106100' + c, desc:'VOL 2/2 PENTEADEIRA CAMARIM ELOA', cor:'C' + c, uep:2.53, uepVig:'16/10/2026' })))
    .concat(['1', '2', '3', '4'].map(c => ({ codigo:'50114900' + c, desc:'VOL 1/1 MESA CABECEIRA MADERO', cor:'C' + c, uep:1, uepVig:'21/10/2026 DIGITADA' })))
    .concat([{ codigo:'501139001', desc:'VOL 1/1 ARMARIO ENCANTO', cor:'BRANCO', uep:2.23, uepVig:'25/09/2026' }]));
  const HR_ = (data, hora, cods, par) => ({ data, hora, min:hora === '12:12' ? 48 : 60, cods, par:par || {} });
  const ELOA = [HR_('06/10/2026', '09:00', { 501061006:50, 501061004:64 }, { 'Troca de Plastico':5, 'Troca de produto':7 }),
    HR_('06/10/2026', '10:00', { 501061004:35, 501061002:96 }, { 'Troca de Plastico':7.8 }),
    HR_('06/10/2026', '12:12', { 501061002:54, 501147004:90 }, { 'Troca de produto':6 }),                       // com o RACK INTENSE: fora
    HR_('21/10/2026', '07:00', { 501149001:59, 501060006:20, 501060002:44, 501061004:32 }, { 'Troca de produto':14.4 }),   // troca de produto: fora
    HR_('21/10/2026', '08:00', { 501061004:83, 501061006:64 }, { Outros:2.3, 'Troca de Plastico':3.9 }),
    HR_('21/10/2026', '09:00', { 501061006:60, 501128003:25, 501061002:64 }, { 'Troca de Plastico':4.3, Outros:5.5 }),
    HR_('21/10/2026', '10:00', { 501061001:88, 501061005:42 }, { 'Troca de produto':8.5 }), HR_('21/10/2026', '12:12', { 501061005:63, 501061003:63 }, { Outros:8.1 }),
    HR_('21/10/2026', '13:00', { 501061003:50, 501088006:54, 501088008:30 }, { 'Troca de produto':6 })];
  const MAD = [HR_('20/10/2026', '14:00', { 501149004:199, 501149003:180 }, { 'Troca de Plastico':5 }), HR_('20/10/2026', '15:00', { 501149003:300 }, { 'Troca de Plastico':3.5 }),
    HR_('20/10/2026', '16:00', { 501149003:113, 501149001:240 }), HR_('22/10/2026', '08:00', { 501149003:360 }, { Outros:2.8 }),
    HR_('22/10/2026', '09:00', { 501149003:111, 501149002:180 }, { 'Troca de Plastico':8.7 }), HR_('22/10/2026', '10:00', { 501149004:195 }, { Outros:3.7 })];
  const HE = ELOA.concat(MAD);
  const V2 = ['501061002', '501.061.004', '501061006'], P2 = _ucvPadraoDe(HE, V2, 1.82, 2530);
  ok('o VOL 2/2 na produção: só as horas com ele SOZINHO (06/10 09 e 10 h, 21/10 08 h); as paradas APONTADAS saem do tempo e ficam à parte',
     [P2.min, P2.par, P2.minRod, P2.horas, P2.dias, P2.cx, P2.pct.toFixed(1), P2.pctRod.toFixed(1), P2.parPct.toFixed(1), P2.tipos.map(x => [x.tipo, +x.min.toFixed(1)]), P2.parLido, P2.pouco],
     [180, 26, 154, 3, 2, 392, '82.6', '96.5', '14.4', [['Troca de Plastico', 16.7], ['Troca de produto', 7], ['Outros', 2.3]], true, false]);
  const REF = _ucvRefDe(HE, PE, 2530);
  ok('a BASE nas mesmas condições: a MADERO só ela na linha, sem as paradas, passa de 100% da meta (hora sem troca é hora boa)',
     [REF.minRod.toFixed(1), REF.cx, REF.pct.toFixed(1), REF.pctRod.toFixed(1), REF.parPct.toFixed(1)], ['336.3', 1878, '108.7', '116.3', '6.6']);
  ok('a régua justa: o produto CONTRA a base, os dois sem as paradas (100% = rendeu o mesmo que a base)',
     [_ucvRel(P2, REF).toFixed(1), _ucvRel(_ucvPadraoDe(HE, V2, 2.53, 2530), REF).toFixed(1), _ucvRelEst(83), _ucvRelEst(95), _ucvRelEst(115), _ucvRel(P2, null), _ucvRel(null, REF)],
     ['83.0', '115.3', 'abaixo', 'confere', 'acima', null, null]);
  const PJ = _ucvPadraoDe(HE, ['501061001', '501061002', '501061003', '501061004', '501061005', '501061006'], 2.36, 2530);
  ok('o produto inteiro (os dois volumes): as horas de qualquer volume dele, sem outro produto (12:12 = 48 min)', [PJ.min, PJ.horas, PJ.cx], [288, 5, 648]);
  const SEMPAR = HE.map(h => ({ data:h.data, hora:h.hora, min:h.min, cods:h.cods }));   // o .gs v5.35 (sem as paradas)
  ok('não rodou sozinho: null; sem UEP: sem %; menos de 2 h sem parada: pouco; .gs sem as paradas: parLido falso e sem o % sem paradas',
     [_ucvPadraoDe(HE, ['501139001'], 2.23, 2530), _ucvPadraoDe(HE, V2, 0, 2530).pct, _ucvPadraoDe(HE.slice(4, 5), V2, 1.82, 2530).pouco, _ucvPadraoDe('lendo', V2, 1.82, 2530),
      _ucvPadraoDe(SEMPAR, V2, 1.82, 2530).parLido, _ucvPadraoDe(SEMPAR, V2, 1.82, 2530).pctRod],
     [null, null, true, null, false, null]);
  const SOB = _ucvPadraoDe([HR_('01/10/2026', '09:00', { 501061002:10 }, { 'Troca de Plastico':50, Limpeza:30 })], V2, 1.82, 2530);
  ok('paradas apontadas por cima uma da outra não passam da hora (80 min numa hora de 60 = 60): sem tempo rodando, sem %',
     [SOB.par, SOB.minRod, SOB.pctRod], [60, 0, null]);
  ok('desde (a conferência da troca): só as horas DEPOIS do dia', [_ucvPadraoDe(HE, V2, 1.82, 2530, '06/10/2026').horas, _ucvPadraoDe(HE, V2, 1.82, 2530, '21/10/2026')], [1, null]);
  const ROT2 = '501061 · PENTEADEIRA CAMARIM ELOA · VOL 2/2';
  const RM2 = _uepConvMontar(PE, ROT2, 14.4, 7.9, 2530, 15, HE), HM2 = _uepConvHtml(RM2);
  ok('o cartão NA PRODUÇÃO: contra a MADERO, com a UEP medida (14,4 ÷ 7,9 = 1,82) e com a do cadastro, e a PERDA EM PARADAS à parte',
     [RM2.relMed.toFixed(1), RM2.relCad.toFixed(1), RM2.relEst, HM2.includes('NA PRODUÇÃO'),
      HM2.includes('<b>83,0%</b><span>da MADERO com a UEP medida (1,82) — rendeu menos que a MADERO: microparada não apontada ou ritmo'),
      HM2.includes('com a do cadastro (2,53): <b>115,3%</b>'), HM2.includes('2,6 h com o volume sozinho, sem parada, em 2 dias · a MADERO: 5,6 h (últimos 30)'),
      HM2.includes('PERDA EM PARADAS nessas horas: <b>26 min</b> de 180 (14,4%) — troca de plastico 16,7 · troca de produto 7,0 · outros 2,3 · a MADERO: 6,6%')],
     ['83.0', '115.3', 'abaixo', true, true, true, true, true]);
  const PE2 = PE.map(p => p.rot === ROT2 ? Object.assign({}, p, { cods:p.cods.map(c => Object.assign({}, c, { uep:1.82 })) }) : p);
  ok('UEP medida igual à do cadastro: o número aparece uma vez só', (_uepConvHtml(_uepConvMontar(PE2, ROT2, 14.4, 7.9, 2530, 15, HE)).match(/83,0%/g) || []).length, 1);
  ok('nada de s/cx, de "A LINHA FAZ" nem de "% do padrão" com as paradas dentro julgando a UEP', [HM2.includes('/cx'), HM2.includes('A LINHA FAZ'), HM2.includes('82,6%')], [false, false, false]);
  const RS2 = _uepConvMontar(PE, ROT2, '', 7.9, 2530, 15, HE);
  ok('sem o tempo digitado: só com a UEP do cadastro', [RS2.padrao, _uepConvHtml(RS2).includes('<b>115,3%</b><span>da MADERO com a UEP do cadastro (2,53) — rendeu mais que a MADERO')], [undefined, true]);
  ok('a própria base: o % dela sem as paradas, como referência das outras',
     _uepConvHtml(_uepConvMontar(PE, 'MESA CABECEIRA MADERO', 7.9, 7.9, 2530, 15, HE)).includes('<b>116,3%</b><span>do padrão da meta, sem as paradas — é a base, a referência das outras'), true);
  ok('lendo · falhou · .gs antigo · sem as paradas · sem a base · não rodou sozinho: a tela diz qual, sem número inventado',
     [_uepConvHtml(_uepConvMontar(PE, ROT2, 14.4, 7.9, 2530, 15, 'lendo')).includes('lendo a produção dos últimos 30 dias'),
      _uepConvHtml(_uepConvMontar(PE, ROT2, 14.4, 7.9, 2530, 15, 'falhou')).includes('não foi lida'),
      _uepConvHtml(_uepConvMontar(PE, ROT2, 14.4, 7.9, 2530, 15, 'sem-endpoint')).includes('.gs v5.36'),
      _uepConvHtml(_uepConvMontar(PE, ROT2, 14.4, 7.9, 2530, 15, SEMPAR)).includes('ainda não manda as paradas de cada hora'),
      _uepConvHtml(_uepConvMontar(PE, ROT2, 14.4, 7.9, 2530, 15, ELOA)).includes('a MADERO não rodou sozinha nos últimos 30 dias fechados: sem a referência'),
      _uepConvHtml(_uepConvMontar(PE, 'ARMARIO ENCANTO', 17.6, 7.9, 2530, 15, HE)).includes('o produto não rodou sozinho na linha nos últimos 30 dias'),
      _uepConvMontar(PE, 'ARMARIO ENCANTO', 17.6, 7.9, 2530, 15, HE).padrao],
     [true, true, true, true, true, true, null]);
  const RM = _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 7.1, 6.7, 3048, 15);   // v7.200.0: o tempo é o SEM AS LACUNAS, contra a MADERO medida (6,7)
  const pM = PRODS.find(p => p.rot === '501149 · MESA CABECEIRA MADERO');
  ok('sem o 7º parâmetro (chamador antigo) nada muda na conversão', _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 7.1, 6.7, 3048, 15, HE).uepVol.toFixed(4), RM.uepVol.toFixed(4));
  ok('a janela: 30 dias fechados (hoje fora), lida pelo getHorasCrono, uma leitura de cada vez (depois das medições e da conferência)',
     [_uepPadJanela(30, new Date(2026, 9, 20)), /action=getHorasCrono/.test(pegaJs('function _ucvLinhaCarregar(')),
      /if\(UCV_REGS_VOO\) await UCV_REGS_VOO[\s\S]*if\(UCV_CONF_VOO\) await UCV_CONF_VOO/.test(pegaJs('function _ucvLinhaCarregar(')), /UEP_PAD/.test(pegaJs('function _ucvLinhaItens('))],
     [{ de:'20/09/2026', ate:'19/10/2026' }, true, true, false]);
  // a lista: cada medição com a UEP DELA e os códigos DELA, contra a base
  // v7.200.0: a UEP da medição é o SEM AS LACUNAS ÷ 6,7 (a gravada não entra mais) — o sLac dá a UEP do caso
  const REG2 = (uep, codigos, extra) => Object.assign({ data:'21/10/2026', modelo:'501061', produto:'PENTEADEIRA CAMARIM ELOA', volume:'VOL 2/2', uep, uepCad:2.53, volumes:60, sRod:14.4, sLac:uep * UEP_BASE_MEDIDA.seg, codigos }, extra || {});
  const PADS = _ucvRegsPadrao([REG2(1.82, '501.061.002 501.061.004 501.061.006'), REG2(1.82, ''),
    REG2(1, '501.149.001 501.149.002 501.149.003 501.149.004', { modelo:'501149', produto:'MESA CABECEIRA MADERO', volume:'VOL 1/1' })], HE, 2530, REF);
  ok('a lista: cada medição contra a base, com a UEP e os códigos dela (sem códigos: nada; a própria base: 100%); sem as horas, o estado da leitura',
     [PADS[0].rel.toFixed(1), PADS[1], PADS[2].rel.toFixed(1), _ucvRegsPadrao([REG2(1.82, '')], 'lendo', 2530, REF), _ucvRegsPadrao([REG2(1.82, '')], undefined, 2530, REF),
      _ucvRegsPadrao([REG2(1.82, '501061002 501061004 501061006')], HE, 2530, null)[0].semRef],
     ['83.0', null, '100.0', 'lendo', 'nao-lida', true]);
  ok('v7.200.0: a NA PRODUÇÃO da lista usa a UEP pela régua de hoje (sem as lacunas ÷ 6,7), nunca a UEP_CRONO gravada (2,53 daria 115,3%)',
     _ucvRegsPadrao([REG2(1.82, '501.061.002 501.061.004 501.061.006', { uep:2.53 })], HE, 2530, REF)[0].rel.toFixed(1), '83.0');
  const PEv2 = PE.find(p => p.rot === ROT2), HL = _ucvRegsHtml([REG2(1.82, '501.061.002 501.061.004 501.061.006')], PEv2, null, null, 2.53, PADS.slice(0, 1));
  ok('a coluna NA PRODUÇÃO no lugar do A LINHA FAZ: o % contra a base e as horas sem parada que o sustentam',
     [HL.includes('>NA PRODUÇÃO</th>'), HL.includes('83,0% <small'), HL.includes('2,6 h</small>'), HL.includes('A LINHA FAZ'), HL.includes('/cx'), HL.includes('perda em paradas 26 min')],
     [true, true, true, false, false, true]);
  ok('a célula: lendo …, .gs antigo —, sem as paradas —, sem a base —, não rodou sozinho —, pouco para julgar com *',
     [_ucvPadCel('lendo'), /—/.test(_ucvPadCel('sem-endpoint')) && /v5\.36/.test(_ucvPadCel('sem-endpoint')), /v5\.36/.test(_ucvPadCel(_ucvPadraoDe(SEMPAR, V2, 1.82, 2530))),
      /não rodou sozinha/.test(_ucvPadCel(_ucvRegsPadrao([REG2(1.82, '501061002 501061004 501061006')], HE, 2530, null)[0])), /não rodou sozinho/.test(_ucvPadCel(null)),
      _ucvPadCel(Object.assign(_ucvPadraoDe(HE.slice(4, 5), V2, 1.82, 2530), { rel:90 })).includes('0,9 h*')], ['…', true, true, true, true, true]);
  ok('o painel calcula os % da lista no _ucvRegPintar (o desenho não faz conta)',
     [/_ucvRegsPadrao\(RL && RL\.slice\(0, 15\), LH, R\.base\.meta, ref\),\s*_ucvRegsStatus\(RL && RL\.slice\(0, 15\), UCV_CONF && UCV_CONF\.trocas, UEP_CONV_PRODS\), null, R\.trava\)/.test(pegaJs('function _ucvRegPintar(')), /ref = Array\.isArray\(LH\) \? _ucvRefDe\(LH, UEP_CONV_PRODS, R\.base\.meta\)/.test(pegaJs('function _ucvRegPintar(')),
      /_ucvConfMontar\(UCV_CONF\.trocas, R\.base\.meta, LH, UEP_CONV_PRODS\)/.test(pegaJs('function _ucvRegPintar('))], [true, true, true]);

  // os campos do registro
  const H = '20/10/2026';
  // v7.158.0: data e volumes obrigatórios (a data vazia virava HOJE — a 2ª da STRASS saiu 26/10 sem ter rodado no dia)
  ok('data vazia NÃO vira hoje: não grava e pede o dia da medição', [!!_ucvRegValida(8.6, { vol:'60' }, H).erro, /dia em que a medição foi feita/.test(_ucvRegValida(8.6, { vol:'60' }, H).erro)], [true, true]);
  ok('volumes vazios: não grava (são a amostra da troca)', [!!_ucvRegValida(8.6, { data:H }, H).erro, /VOLUMES MEDIDOS/.test(_ucvRegValida(8.6, { data:H }, H).erro)], [true, true]);
  // v7.200.0: o tempo do campo (seg) é o SEM AS LACUNAS; o RODANDO vem do formulário e é obrigatório
  const RV = (seg, F) => _ucvRegValida(seg, Object.assign({ data:H, vol:'60', rod:'9' }, F), H);
  ok('com data, volumes e o RODANDO, o resto vazio fica vazio (nunca 0)', RV(8.6, {}), { data:H, per:null, rod:9, vol:60, vel:null, quem:'' });
  ok('RODANDO vazio: não grava (é com ele que a ONDE O TEMPO VAI mede as lacunas; sem lacuna, o mesmo número)',
     [/^RODANDO: digite o cartão POR VOLUME COM A LINHA RODANDO/.test(RV(8.6, { rod:'' }).erro || ''), /mesmo número do SEM AS LACUNAS/.test(RV(8.6, { rod:'' }).erro || ''), !!RV(8.6, { rod:'abc' }).erro], [true, true, true]);
  ok('números em pt-BR e o nome cortado em 40', RV(7.1, { per:'9,4', rod:'8,6', vol:'60', vel:'9', quem:'  Maurício ' }),
     { data:H, per:9.4, rod:8.6, vol:60, vel:9, quem:'Maurício' });
  const E1v = RV(7.1, { rod:'8,6', per:'7,9' }), E2v = RV(8.6, { rod:'7,1' });
  ok('NO PERÍODO menor que o RODANDO, ou RODANDO menor que o SEM AS LACUNAS: campos trocados — não grava (igual grava)',
     [/menor que o RODANDO/.test(E1v.erro), /trocados/.test(E1v.erro), /RODANDO \(7,1 s\) é menor que o SEM AS LACUNAS/.test(E2v.erro), RV(8.6, { rod:'8,6' }).rod],
     [true, true, true, 8.6]);
  ok('RODANDO acima de 3× o SEM AS LACUNAS: campo trocado — não grava (até 3× grava)',
     [/mais de 3 vezes o SEM AS LACUNAS/.test(RV(5, { rod:'16' }).erro || ''), RV(5, { rod:'15' }).rod], [true, 15]);
  ok('data no futuro, data torta, texto no número: não grava',
     [!!RV(8.6, { data:'21/10/2026' }).erro, !!RV(8.6, { data:'2/10/26' }).erro, !!RV(8.6, { vol:'abc' }).erro, !!RV(8.6, { per:'0' }).erro],
     [true, true, true, true]);

  // v7.150.1 — o 1º registro real gravou NO PERÍODO 1335: "13:35" perdia os dois pontos no _pgSimNum
  ok('"13:35", "8,6 s" e "1.335,0" não são número de segundos: não grava (o "13:35" virava 1335)',
     [!!RV(8.6, { per:'13:35' }).erro, !!RV(8.6, { per:'9,4 s' }).erro, !!RV(8.6, { per:'1.335,0' }).erro,
      RV(8.6, { per:'9.4' }).per], [true, true, true, 9.4]);
  ok('NO PERÍODO acima de 5× o RODANDO é o tempo total, não o por volume: não grava (até 5× grava)',
     [/mais de 5 vezes o RODANDO/.test(RV(7.9, { per:'1335' }).erro || ''), RV(7.9, { per:'39' }).per], [true, 39]);
  ok('SEM AS LACUNAS fora do plausível (0 ou acima de 120 s por volume): não grava',
     [!!RV(0, {}).erro, !!RV(836, {}).erro, /s\/VOLUME SEM AS LACUNAS/.test(RV(836, {}).erro), RV(119, { rod:'119' }).erro], [true, true, true, undefined]);
  // a linha da planilha
  const V = RV(7.1, { per:'9,4', rod:'8,6', vol:'60', quem:'PPCP' });
  const D = _ucvRegMontar(RM, V);
  ok('a linha da planilha: os segundos da medição (SEM AS LACUNAS do campo, RODANDO do formulário) e a conversão do momento contra a MADERO sem as lacunas',
     [D.data, D.modelo, D.produto, D.volume, D.sRod, D.sPer, D.sLac, D.volumes, D.base, D.baseS, D.tol, D.tpS, D.uep, D.uepCad, D.vel, D.quem, Object.keys(D).some(k => /^linha/.test(k))],
     [H, '501149', 'MESA CABECEIRA MADERO', 'VOL 1/1', 8.6, 9.4, 7.1, 60, 'MADERO SEM LACUNAS 20/10/2026', 6.7, 15, Math.round(7.1 * 1.15 * 100) / 100, 1.06, 1, '', 'PPCP', false]);
  ok('o REG_ID sai do conteúdo: a mesma medição dá o mesmo id (o 2º clique não duplica); outra medição, outro id',
     [D.regId === _ucvRegMontar(RM, V).regId, D.regId === _ucvRegMontar(RM, Object.assign({}, V, { rod:9 })).regId, /^c[0-9a-z]+$/.test(D.regId)],
     [true, false, true]);
  // o mesmo PDF registrado antes (rodando no campo) e agora (sem as lacunas no campo) dá o MESMO REG_ID: o hash é dos segundos, não do campo
  const Vold = { data:H, per:9.4, lac:7.1, vol:60, vel:null, quem:'PPCP' };
  const hAntigo = 'c' + _ucvHash([H, '501149', 'MESA CABECEIRA MADERO', 'VOL 1/1', 8.6, 9.4, 7.1, 60, 'PPCP'].join('|'));
  ok('a mesma medição registrada pela régua antiga e pela nova dá o MESMO REG_ID (não duplica na planilha)', D.regId, hAntigo);
  const PS = PRODS.find(p => p.rot === '501059 · PENTEADEIRA CAMARIM STRASS'), PV = PRODS.find(p => p.rot === '501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2');
  ok('o volume vai como texto que o Sheets não vira data (o "1/2" viraria)', [_ucvRegVol(pM), _ucvRegVol(PS), _ucvRegVol(PV)], ['VOL 1/1', 'JOGO 2 VOL', 'VOL 2/2']);
  ok('base da régua da meta e base digitada ficam ditas na linha',
     [_ucvRegMontar(_uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 9.5, 10.4, 3048, 15), V).base,
      _ucvRegMontar(_uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 9.5, 8.2, 3048, 15), V).base,
      _ucvRegMontar(_uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 9.5, 10.4, 3048, 15), V).tol],
     ['RÉGUA DA META', 'DIGITADA', 0]);

  // A REGRA DA UEP (v7.233.0, PPCP 12/11/2026: "limite de medição" → "travar a uep, mas essa trava passa por mim"):
  // a medição vale com 30+ volumes e lacunas até 15%; a regra se cumpre com 2 válidas somando 100 volumes;
  // dentro de 90–110% do cadastro a regra diz FICA, fora TROCA. A UEP de cada medição: SEM AS LACUNAS ÷ 6,7.
  const RG = (data, uep, uepCad, extra) => Object.assign({ data, modelo:'501149', produto:'MESA CABECEIRA MADERO', volume:'VOL 1/1', uep, uepCad, volumes:60,
    sLac:uep * UEP_BASE_MEDIDA.seg, sRod:uep * UEP_BASE_MEDIDA.seg }, extra || {});
  const Rg = (L, c) => _ucvRegraUep(L, c == null ? 1.2 : c);
  ok('a medição vale: 30+ volumes e lacunas até 15% (com uma casa, o que a tela mostra)',
     [_ucvMedValida(RG(H, 1, 1, { volumes:30 })).ok, _ucvMedValida(RG(H, 1, 1, { volumes:29 })).k,
      _ucvMedValida({ sLac:11.05, sRod:13, volumes:52 }).ok, _ucvMedValida({ sLac:6.7, sRod:7.9, volumes:60 }).k, _ucvMedValida({ sLac:6.7, sRod:7.9, volumes:60 }).mot,
      _ucvMedValida({ sLac:12, sRod:'', volumes:60 }).k, _ucvMedValida({ sLac:'', sRod:12, volumes:60 }).k, _ucvMedValida({ sLac:12, sRod:12, volumes:null }).k],
     [true, 'poucos-volumes', true, 'lacunas', 'lacunas 15,2% (até 15%)', 'sem-rodando', 'sem-lacunas', 'sem-volumes']);
  ok('a regra: UMA medição não basta, por maior que seja; DUAS válidas somando 100 volumes, sim',
     [Rg([RG(H, 1.05, 1.2, { volumes:300 })]).veredito, Rg([RG(H, 1.05, 1.2), RG(H, 1.06, 1.2)]).veredito, Rg([RG(H, 1.05, 1.2, { volumes:50 }), RG(H, 1.06, 1.2, { volumes:49 })]).veredito,
      Rg([RG(H, 1.05, 1.2, { volumes:50 }), RG(H, 1.06, 1.2, { volumes:50 })]).veredito],
     ['falta', 'troca', 'falta', 'troca']);
  ok('a medição que não vale não conta nem na média: 2 válidas de 3', (() => { const S = Rg([RG(H, 1.05, 1.2), RG(H, 1.06, 1.2), RG(H, 2, 1.2, { volumes:20 })]); return [S.nVal, S.nInv, S.nVol, S.n, S.inv[0].k]; })(),
     [2, 1, 120, 3, 'poucos-volumes']);
  ok('não é mais "todas do mesmo lado": a MÉDIA decide (1,00 e 1,12 → 1,06, fora de 90–110% de 1,2; 1,05 e 1,12 → 1,085, dentro)',
     [Rg([RG(H, 1.0, 1.2), RG('17/10/2026', 1.12, 1.2)]).veredito, _ucvU2(Rg([RG(H, 1.0, 1.2), RG('17/10/2026', 1.12, 1.2)]).uepMed),
      Rg([RG(H, 1.05, 1.2), RG('17/10/2026', 1.12, 1.2)]).veredito], ['troca', '1,06', 'fica']);
  ok('dentro da faixa: FICA; sem UEP no cadastro, cumprida a regra: TROCA (não há o que manter)',
     [Rg([RG(H, 1.11, 1.2), RG('17/10/2026', 1.14, 1.2)]).veredito, _ucvRegraUep([RG(H, 1.11, 1.2), RG(H, 1.14, 1.2)], null).veredito, _ucvRegraUep([RG(H, 1.11, 1.2), RG(H, 1.14, 1.2)], null).difPct],
     ['fica', 'troca', null]);
  ok('o que falta, por extenso (sem medição nenhuma: null — o desenho diz)', [Rg([]), Rg([RG(H, 1, 1.2, { volumes:61 })]).faltaTxt, Rg([RG(H, 1, 1.2, { volumes:45 }), RG(H, 1, 1.2, { volumes:45 })]).faltaTxt,
     Rg([RG(H, 1, 1.2, { volumes:120 })]).faltaTxt], [null, 'falta 1 medição válida · faltam 39 volumes', 'faltam 10 volumes', 'falta 1 medição válida']);
  ok('NA BORDA: a média a até 2 pontos do limite da faixa (8–12% de diferença), com a regra cumprida',
     [Rg([RG(H, 1.31, 1.2), RG(H, 1.32, 1.2)]).borda, Rg([RG(H, 1.36, 1.2), RG(H, 1.37, 1.2)]).borda, Rg([RG(H, 1.2, 1.2), RG(H, 1.21, 1.2)]).borda, Rg([RG(H, 1.31, 1.2)]).borda],
     [true, false, false, false]);
  // o caso real: STRASS VOL 2/2, 11,5 s × 61 e 12,4 s × 52 (sem lacuna: rodando = sem as lacunas); cadastro 2,29.
  const ST2 = (data, sLac, volumes, uep, sRod) => ({ data, modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', sRod:sRod == null ? sLac : sRod, sLac, baseS:7.9, uep, uepCad:2.29, volumes });
  const SS = _ucvRegraUep([ST2('26/10/2026', 12.4, 52, 1.57), ST2('23/10/2026', 11.5, 61, 1.46)], 2.29);
  ok('STRASS VOL 2/2: média pelos SEGUNDOS sem as lacunas, pesada pelos volumes, ÷ 6,7 = 1,78 — 2 válidas, 113 volumes: a regra diz TROCA',
     [SS.veredito, SS.nVal, SS.nVol, _ucvU2(SS.uepMed), SS.datas, fmt1(SS.difPct)], ['troca', 2, 113, '1,78', ['23/10/2026', '26/10/2026'], '-22,3']);
  ok('a regra é contra o cadastro de AGORA: com 1,78 no cadastro, as mesmas medições dizem FICA',
     _ucvRegraUep([ST2('26/10/2026', 12.4, 52, 1.57), ST2('23/10/2026', 11.5, 61, 1.46)], 1.78).veredito, 'fica');
  ok('os casos de 12/11/2026 (planilha): TAURUS +9,7% FICA na borda; VIVARE +14,3% TROCA; SLEEP (25,3% de lacunas) não vale',
     [(() => { const S = _ucvRegraUep([{ sLac:12.7, sRod:12.9, volumes:60 }, { sLac:12.5, sRod:12.9, volumes:54 }, { sLac:12.8, sRod:13.1, volumes:60 }, { sLac:11.7, sRod:12.3, volumes:60 }], 1.69);
        return [S.veredito, fmt1(S.difPct), S.borda]; })(),
      _ucvRegraUep([{ sLac:14.6, sRod:14.9, volumes:60 }, { sLac:15.3, sRod:15.3, volumes:72 }, { sLac:13.5, sRod:13.5, volumes:55 }, { sLac:14.1, sRod:14.1, volumes:38 }], 1.89).veredito,
      _ucvRegraUep([{ data:'09/11/2026', sLac:6.8, sRod:9.1, volumes:82 }], 0.83).inv[0].mot],
     [['fica', '9,7', true], 'troca', 'lacunas 25,3% (até 15%)']);
  ok('medição sem o SEM AS LACUNAS não conta (nunca cai na UEP gravada nem no rodando)',
     [_ucvRegUep({ sRod:12.4, baseS:7.9, uep:1.57 }), _ucvRegraUep([{ data:H, sRod:12.4, baseS:7.9, uep:1.57, uepCad:2.29, volumes:52 }], 2.29).nVal], [0, 0]);
  ok('o filtro do produto: mesmo modelo, nome e volume', _ucvRegsDoProduto([RG(H, 1, 1), RG(H, 1, 1, { volume:'JOGO 2 VOL' }), RG(H, 1, 1, { modelo:'501094' })], pM).length, 1);
  const HR = _ucvRegsHtml([RG(H, 1.05, 1.2, { sRod:7.6, uep:1.4, volumes:40 })], pM, null, null, 1.2);
  ok('a lista diz a regra e mostra os segundos e a UEP — o SEM AS LACUNAS em destaque e a UEP pela régua de hoje (não a gravada)',
     [HR.includes('1 medição · 1 válida, 40 volumes'), HR.includes('a regra ainda não se cumpre: falta 1 medição válida · faltam 60 volumes'), HR.includes('<td class="n">7,6 s</td>'),
      HR.includes('<td class="n"><b>7,0 s</b></td>'), HR.includes('<b>1,05</b>'), HR.includes('1,40'), HR.includes('UEP medida 1,05 (−12,5% do cadastro)')],
     [true, true, true, true, true, false, true]);
  ok('travada: a linha de cima diz UEP TRAVADA (a regra não pede mais nada)',
     _ucvRegsHtml([RG(H, 1.05, 1.2)], pM, null, null, 1.2, null, null, null, { travada:true }).includes(UCV_REG_VEREDITO.travada[1]), true);
  ok('lista sem o .gs novo, ainda lendo, vazia: diz qual',
     [_ucvRegsHtml(null, pM, 'sem-endpoint').includes('cole o .gs v5.30'), _ucvRegsHtml(null, pM, null).includes('Lendo as medições'),
      _ucvRegsHtml([], pM, null).includes('Nenhuma medição registrada deste produto')], [true, true, true]);
}
// ════════════════════════════════════════════════════════════════════════════
// EXCLUIR UMA MEDIÇÃO (v7.157.0 / .gs v5.33, PPCP 26/10/2026: "vou ter que
// excluir estudo" → "sim fazer")
console.log('\n── CRONOANÁLISE → UEP: excluir uma medição ──');
const _assincronos = [];
{ const pM = PRODS.find(p => p.rot === '501149 · MESA CABECEIRA MADERO');
  const RX = (regId, extra) => Object.assign({ data:'21/10/2026', modelo:'501149', produto:'MESA CABECEIRA MADERO', volume:'VOL 1/1',
    sRod:16.2, sLac:13.74, uep:1.8, uepCad:2.1, em:'26/10/2026 08:55', regId }, extra || {});
  const HX = _ucvRegsHtml([RX('c1abc'), RX('c2def', { data:'20/10/2026' })], pM, null);
  ok('cada medição registrada pelo painel tem o EXCLUIR, com o REG_ID dela',
     [(HX.match(/class="ucv-x"/g) || []).length, HX.includes('data-reg="c1abc"'), HX.includes('data-reg="c2def"'), HX.includes('onclick="_ucvExcluir(this.dataset.reg)"'), /disabled/.test(HX)],
     [2, true, true, true, false]);
  const HM = _ucvRegsHtml([RX('x"><img src=x onerror=alert(1)>'), RX(''), RX('c1abc')], pM, null);
  ok('linha digitada à mão na planilha (REG_ID vazio ou estranho): sem botão, "—" que manda excluir lá — e nada do id vai para a tela',
     [(HM.match(/class="ucv-x"/g) || []).length, (HM.match(/class="ucv-x-sem"/g) || []).length, HM.includes('<img'), HM.includes('exclua lá')], [1, 2, false, true]);
  const HE = _ucvRegsHtml([RX('c1abc'), RX('c2def')], pM, null, 'c1abc');
  ok('com uma exclusão em curso: ela diz EXCLUINDO… e TODOS os botões ficam travados (uma de cada vez)',
     [HE.includes('>EXCLUINDO…<'), (HE.match(/ disabled>/g) || []).length], [true, 2]);
  ok('o cabeçalho tem a coluna do botão e a TROCA (mesmo nº de th e td)',
     [(HX.match(/<th[ >]/g) || []).length, (HX.split('<tr>')[2].match(/<td[ >]/g) || []).length], [13, 13]);
  const CT = _ucvExclConfirmaTxt(RX('c1abc'));
  ok('a confirmação diz qual medição, que a UEP NÃO muda e onde fica a cópia',
     ['MESA CABECEIRA MADERO', 'VOL 1/1', 'medida em 21/10/2026', 'sem lacunas 13,7 s', 'UEP 2,05', 'registrada em 26/10/2026 08:55', 'A UEP do cadastro NÃO muda', 'CRONO_EXCLUIDOS'].filter(t => !CT.includes(t)), []);
  ok('a resposta: excluiu · já tinha excluído (a retentativa) · não estava lá · .gs antigo (cai no getDados e não exclui)',
     [_ucvExclResposta({ ok:true, excluido:true }).tipo, _ucvExclResposta({ ok:true, excluido:true, jaExcluido:true }).tipo,
      _ucvExclResposta({ ok:true, excluido:false, naoAchou:true }).tipo, _ucvExclResposta({ ok:true, slots:[] }).tipo, /v5\.33/.test(_ucvExclResposta({ ok:true }).txt)],
     ['ok', 'ja', 'nao-achou', 'velho', true]);
  ok('sem resposta ≠ não excluiu: a lista relida decide; lista que não veio não decide',
     [_ucvExclConfere({ lista:[RX('c1abc')] }, 'c1abc').tipo, _ucvExclConfere({ lista:[RX('c2def')] }, 'c1abc').tipo,
      _ucvExclConfere({ lista:[RX('c1abc')], falha:'sem-resposta' }, 'c1abc').tipo, _ucvExclConfere(null, 'c1abc').tipo,
      _ucvExclConfere({ lista:[RX('c1abc')] }, 'c1abc', 'Lock timeout').txt.includes('(Lock timeout)')],
     ['ficou', 'saiu', 'incerto', 'incerto', true]);
  const XC = pegaJs('async function _ucvExcluir(');
  ok('o EXCLUIR vai pelo excluirCrono com retentativa e confirmação, e NÃO toca a UEP do cadastro',
     [/action=excluirCrono&regId=' \+ encodeURIComponent\(regId\)/.test(XC), /jsonpEscrita\(/.test(XC), /confirm\(_ucvExclConfirmaTxt\(/.test(XC), /setUepCatalogo|simularUepCatalogo/.test(XC)],
     [true, true, true, false]);
  // v7.197.0: as medições aparecem no MEDIR (do volume) e no MEDIÇÕES (todas) — a mensagem fica acima das sub-abas, à vista nas duas
  ok('a mensagem mora FORA das listas (refeitas a cada tecla), acima das sub-abas, e a lista sabe da exclusão em curso',
     [html.indexOf('id="uep-conv-x-msg"') < html.indexOf('<div class="ucv-pn on" data-sub="medir">') && html.indexOf('id="uep-conv-x-msg"') > html.indexOf('id="uep-conv-sub"'), /_ucvEl\('x-msg'\)/.test(XC),
      /UCV_REGS && UCV_REGS\.falha, UCV_EXCL, R\.volCad, _ucvRegsPadrao\(/.test(pegaJs('function _ucvRegPintar('))], [true, true, true]);
  ok('UCV_EXCL declarado junto do UCV_REGS (o _ucvRegPintar lê os dois)',
     /let UCV_REGS = null, UCV_REGS_VOO = null;[^\n]*\nlet UCV_EXCL = null;/.test(JS), true);

  // o fluxo REAL do _ucvExcluir, com o Apps Script de mentira
  eval.call(global, XC);
  const msgEl = { textContent:'' };
  const montarFluxo = (resposta, listaDepois) => {
    const F = { chamadas:[], leituras:0, pintou:0 };
    global.CFG = { sheetsUrl:'https://script.google.com/macros/s/X/exec' };
    global.UCV_EXCL = null; global.UCV_REGS_VOO = null;
    global.UCV_REGS = { lista:[RX('c1abc'), RX('c2def')], falha:null, ts:0 };
    global._ucvEl = n => (n === 'x-msg' ? msgEl : null);
    global.confirm = () => true; global.alert = () => {};
    global._uepConvAtualiza = () => { F.pintou++; F.exclNaPintura = F.exclNaPintura || global.UCV_EXCL; };
    global._ucvRegsCarregar = async () => { F.leituras++; F.naTelaAoReler = (global.UCV_REGS.lista || []).map(r => r.regId); global.UCV_REGS = listaDepois; };
    global.jsonpEscrita = async url => { F.chamadas.push(url); if(resposta instanceof Error) throw resposta; return resposta; };
    return F;
  };
  _assincronos.push(async () => {
    let F = montarFluxo({ ok:true, excluido:true, linha:3 }, { lista:[RX('c2def')], falha:null });
    await _ucvExcluir('c1abc');
    ok('fluxo: excluiu → manda o REG_ID, relê a lista, destrava e diz ✓',
       [F.chamadas.length, /action=excluirCrono&regId=c1abc$/.test(F.chamadas[0]), F.leituras, global.UCV_EXCL, msgEl.textContent.startsWith('✓ Medição excluída'), F.exclNaPintura],
       [1, true, 1, null, true, 'c1abc']);
    ok('fluxo: excluiu → sai da tela já, sem esperar a releitura (cold start)', F.naTelaAoReler, ['c2def']);
    F = montarFluxo({ ok:true, slots:[] }, { lista:[RX('c1abc'), RX('c2def')], falha:null });
    await _ucvExcluir('c1abc');
    ok('fluxo: .gs antigo → diz que falta o re-deploy (nada excluído) e a medição fica na tela',
       [msgEl.textContent.includes('.gs v5.33'), global.UCV_EXCL, F.naTelaAoReler], [true, null, ['c1abc', 'c2def']]);
    F = montarFluxo(new Error('Timeout — o Apps Script não respondeu em 25 s'), { lista:[RX('c2def')], falha:null });
    await _ucvExcluir('c1abc');
    ok('fluxo: sem resposta, mas a lista relida não tem mais a medição → excluiu', [F.leituras, msgEl.textContent.startsWith('✓ A medição saiu da lista')], [1, true]);
    F = montarFluxo(new Error('Timeout — o Apps Script não respondeu em 25 s'), { lista:[RX('c1abc'), RX('c2def')], falha:null });
    await _ucvExcluir('c1abc');
    ok('fluxo: sem resposta e a medição continua na lista → não excluiu, sem falar em "Timeout"',
       [msgEl.textContent.startsWith('Não excluiu (sem resposta do Apps Script)'), global.UCV_EXCL], [true, null]);
    F = montarFluxo({ ok:true, excluido:true }, null);
    global.confirm = () => false;
    await _ucvExcluir('c1abc');
    ok('fluxo: VOLTAR na confirmação → nada é chamado', [F.chamadas.length, F.leituras, global.UCV_EXCL], [0, 0, null]);
    F = montarFluxo({ ok:true, excluido:true }, null);
    global.UCV_EXCL = 'c2def';
    await _ucvExcluir('c1abc');
    ok('fluxo: com outra exclusão em curso → espera, nada é chamado', [F.chamadas.length, msgEl.textContent.includes('Espere')], [0, true]);
    F = montarFluxo({ ok:true, excluido:true }, null);
    await _ucvExcluir('cnaoexiste');
    ok('fluxo: REG_ID que não está na lista → relê a lista, não exclui', [F.chamadas.length, F.leituras], [0, 1]);
  });
}
{ const RGS = pegaJs('async function _ucvRegistrar('), AT3 = pegaJs('function _uepConvAtualiza(');
  ok('o 💾 grava pelo registrarCrono com retentativa, confere a resposta do .gs novo e NÃO toca a UEP do cadastro',
     [/_ucvRegUrl\(D\)/.test(RGS) && /action=registrarCrono&/.test(pegaJs('function _ucvRegUrl(')), /jsonpEscrita\(/.test(RGS), /!r \|\| !r\.registrado/.test(RGS), /setUepCatalogo|simularUepCatalogo/.test(RGS), /confirm\(/.test(RGS)],
     [true, true, true, false, true]);
  ok('o formulário mora FORA do resultado (refeito a cada tecla) e só aparece com a conversão pronta',
     [html.indexOf('id="uep-conv-reg"') > html.indexOf('id="uep-conv-res"'), /box\.style\.display = R\.estado === 'ok'/.test(pegaJs('function _ucvRegPintar(')), /_ucvRegPintar\(R, ja\)/.test(AT3)],
     [true, true, true]);
  ok('a leitura da linha só sai com produto escolhido, uma de cada vez (espera a das medições)',
     [/if\(\(E\.linha === 'nao-lida' && UCV_REGS\) \|\| E\.linha === 'falhou'\) _ucvLinhaCarregar\(\)/.test(AT3), /if\(UCV_REGS_VOO\) await UCV_REGS_VOO/.test(pegaJs('function _ucvLinhaCarregar('))],
     [true, true]);
}

// ════════════════════════════════════════════════════════════════════════════
// REFATORAÇÃO da ⏱ CRONOANÁLISE (v7.146.1) — o comportamento é o mesmo, conferido
// fora do repositório contra 249.318 casos (conta, tela, papel e cliques); aqui
// ficam as guardas das costuras novas.
console.log('\n── CRONOANÁLISE → UEP: as peças ──');
{ const B = _uepConvBaseDe(8.7, 3048, 15), R = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 3048, 15);
  ok('o _uepConvMontar usa a base do _uepConvBaseDe (a mesma régua e tolerância, sem produto nenhum)',
     [JSON.stringify(B), JSON.stringify(_uepConvMontar([], '', 0, 8.7, 3048, 15).base)], [JSON.stringify(R.base), JSON.stringify(R.base)]);
  const PS = PRODS.find(p => p.rot === '501059 · PENTEADEIRA CAMARIM STRASS'), C = _uepConvCadastro(PS);
  ok('o cadastro do produto: UEP por volume, jogo e origem (multivolume)',
     [C.vols.length, C.completo, C.jogoCad != null, C.volCad === C.jogoCad / 2, typeof C.origem], [2, true, true, true, 'string']);
  const D = _uepConvDigitar(PS, C, 1, 2);
  ok('o que digitar: um grupo por volume e número, volume 1 antes do 2 (o mesmo do _uepConvMontar)',
     [D.map(g => g.vol), JSON.stringify(D) === JSON.stringify(_uepConvMontar(PRODS, PS.rot, 2 * _uepConvBaseDe(0, 2530).seg / 2, 0, 2530).digitar)], [[1, 2], true]);
}
ok('os campos da aba saem só do _ucvEl, e o que é guardado só pelo _ucvLe/_ucvGuarda',
   [(JS.match(/getElementById\('uep-conv-/g) || []).length, /localStorage\.(get|set|remove)Item\(UEP_CONV/.test(JS)], [1, false]);
{ const lsAntes = global.localStorage;
  global.localStorage = { getItem(){ throw new Error('bloqueado'); }, setItem(){ throw new Error('bloqueado'); }, removeItem(){ throw new Error('bloqueado'); } };
  let quebrou = false; try{ _ucvGuarda('x', '1'); _ucvGuarda('x', ''); }catch(e){ quebrou = true; }
  ok('sem localStorage (janela anônima, bloqueado): lê vazio e não quebra', [_ucvLe('x'), quebrou], ['', false]);
  global.localStorage = lsAntes;
}

// ════════════════════════════════════════════════════════════════════════════
// TROCAR A UEP PELAS MEDIÇÕES + CONFERÊNCIA DAS TROCAS (v7.158.0 / .gs v5.34).
// PPCP, 26/10/2026: "deixa pronto para trocar já no app a uep que puder", "a
// medição não dá para travar em duas datas diferentes" e "deixar uma conferência
// para que quando passar o produto outras vezes criar alerta sem alterar se sobe
// ou desce a uep". O caso real: STRASS VOL 2/2, 11,5 s × 61 (23/10) e 12,4 s × 52
// (26/10), sem lacuna (rodando = sem as lacunas); cadastro 2,29. Desde a v7.200.0
// contra a MADERO SEM AS LACUNAS (6,7 s): 1,78 (pela régua rodando, 7,9 s, era 1,51).
console.log('\n── CRONOANÁLISE → UEP: trocar pelas medições e a conferência ──');
{ const ROT = '501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2';
  const ST2 = (data, sLac, volumes, uep, extra) => Object.assign({ data, modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', sRod:sLac, sLac, baseS:7.9, uep, uepCad:2.29, volumes, regId:'c' + data.slice(0, 2) }, extra || {});
  const REGS = [ST2('26/10/2026', 12.4, 52, 1.57), ST2('23/10/2026', 11.5, 61, 1.46),
                { data:'19/10/2026', modelo:'501139', produto:'ARMARIO ENCANTO', volume:'VOL 1/1', sRod:17.6, sLac:17.6, baseS:7.9, uep:2.23, uepCad:2.23, volumes:11 },
                { data:'20/10/2026', modelo:'501149', produto:'MESA CABECEIRA MADERO', volume:'VOL 1/1', sRod:7.9, sLac:6.7, baseS:7.9, uep:1, uepCad:1.2, volumes:60 }];
  const RS = _uepConvMontar(PRODS, ROT, 0, 6.7, 2530, 15, undefined, REGS), HS = _uepConvHtml(RS);
  // v7.233.0: a regra só põe o carimbo; quem troca (ou mantém) e trava é o PPCP, na TRAVA DA UEP
  ok('sem tempo digitado, as medições registradas cumprem a regra: 2 válidas, 113 volumes, média 1,78 — TROCA (o VOL 1/2 não entra)',
     [RS.estado, RS.regRes.veredito, RS.regRes.nVal, RS.regRes.nVol, _ucvU2(RS.regRes.uepMed), Math.round(RS.regRes.difPct), RS.troca], ['sem-tempo', 'troca', 2, 113, '1,78', -22, undefined]);
  ok('o desenho: REGRA CUMPRIDA · O PPCP DECIDE, o que a regra diz e o caminho para a TRAVA DA UEP (só da tela) — nenhum botão de troca direto',
     [HS.includes('✓ REGRA CUMPRIDA · O PPCP DECIDE'), HS.includes('<b>2 medições válidas · 113 volumes</b>'), HS.includes('A regra diz <b>TROCA PARA 1,78</b>'),
      HS.includes('<div class="ucv-tv-dest so-tela"><button type="button" class="btn btn-acc" onclick="_ucvSub(\'trava\')">🔒 ABRIR NA TRAVA DA UEP</button>'), HS.includes('_ucvTrocar'), HS.includes('TROCAR A UEP NO CADASTRO')],
     [true, true, true, true, false, false]);
  const RT = _uepConvMontar(PRODS, ROT, 12.4, 6.7, 2530, 15, undefined, REGS), HT = _uepConvHtml(RT);
  ok('com o tempo digitado (12,4 s → 1,85): os cartões são DELE, a regra é a das registradas (1,78), e embaixo o que ele dá',
     [_ucvU2(RT.uepVol), HT.includes('>1,85<'), HT.includes('REGRA CUMPRIDA'), HT.includes('A regra diz <b>TROCA PARA 1,78</b>'), HT.includes('Esta medição dá:')],
     ['1,85', true, true, true, true]);
  ok('sem medição registrada do volume: A REGRA AINDA NÃO SE CUMPRE (o que ela pede); lista não lida: LENDO',
     [_uepConvHtml(_uepConvMontar(PRODS, ROT, 12.4, 6.7, 2530, 15, undefined, [])).includes('A REGRA AINDA NÃO SE CUMPRE</div><p>nenhuma medição registrada deste volume. A regra pede 2 medições válidas (30+ volumes e lacunas até 15% cada), somando 100 volumes.'),
      _uepConvHtml(_uepConvMontar(PRODS, ROT, 12.4, 6.7, 2530, 15, undefined, null)).includes('LENDO AS MEDIÇÕES REGISTRADAS')], [true, true]);
  const RP = _uepConvMontar(PRODS, ROT, 12.4, 6.7, 2530, 15, undefined, [ST2('26/10/2026', 12.4, 20, 1.57), ST2('23/10/2026', 11.5, 61, 1.46)]);
  ok('uma medição de 20 volumes não vale: AINDA NÃO SE CUMPRE, com o que falta e o porquê', [RP.regRes.veredito, _uepConvHtml(RP).includes('1 medição válida de 2, 61 volumes: falta 1 medição válida · faltam 39 volumes. Não vale: 26/10 20 volumes (pede 30).')],
     ['falta', true]);
  // a TRAVA: o cadastro manda (coluna UEP_TRAVA, uepTrava no getProdutos); o detalhe vem da UEP_TRAVAS
  const CATT = [{ codigo:'501059001', desc:'VOL 1/2 PENTEADEIRA CAMARIM STRASS', cor:'BRANCO', uep:2.71, uepVig:'16/10/2026', uepTrava:'' },
                { codigo:'501059002', desc:'VOL 2/2 PENTEADEIRA CAMARIM STRASS', cor:'BRANCO', uep:1.78, uepVig:'26/10/2026 DIGITADA', uepTrava:'26/10/2026 PPCP' },
                { codigo:'501139001', desc:'VOL 1/1 ARMARIO ENCANTO', cor:'BRANCO', uep:2.23, uepVig:'25/09/2026', uepTrava:'' },
                { codigo:'501149001', desc:'VOL 1/1 MESA CABECEIRA MADERO', cor:'BRANCO', uep:1, uepVig:'25/09/2026', uepTrava:'' }];
  const PT = _uepConvProdutos(CATT), pV2 = PT.find(p => p.rot === ROT);
  const TRAVAS = [{ em:'26/10/2026 10:40', modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', uep:1.78, antes:2.29, medida:1.78, decisao:'TROCOU', medicoes:2, volumes:113, motivo:'', destravadaEm:'' }];
  const tr = _ucvTravaDe(pV2, TRAVAS);
  ok('_ucvTravaDe: travada pelo cadastro, com o detalhe do registro; sem a coluna no cadastro (.gs antigo), vale o registro',
     [tr.travada, tr.carimbo, tr.T.uep, tr.mudou, tr.apagada, _ucvTravaDe(PT.find(p => /ENCANTO/.test(p.rot)), TRAVAS),
      _ucvTravaDe(_uepConvProdutos(CATT.map(c => Object.assign({}, c, { uepTrava:undefined }))).find(p => p.rot === ROT), TRAVAS).travada],
     [true, '26/10/2026 PPCP', 1.78, false, false, null, true]);
  ok('_ucvTravaDe: a UEP mudou na planilha (cadastro ≠ travada) · a trava foi apagada na planilha (registro ativo, cadastro sem carimbo) · destravada não conta',
     [_ucvTravaDe(_uepConvProdutos(CATT.map(c => c.codigo === '501059002' ? Object.assign({}, c, { uep:1.9 }) : c)).find(p => p.rot === ROT), TRAVAS).mudou,
      (() => { const t = _ucvTravaDe(_uepConvProdutos(CATT.map(c => Object.assign({}, c, { uepTrava:'' }))).find(p => p.rot === ROT), TRAVAS); return [t.travada, t.apagada]; })(),
      _ucvTravaDe(_uepConvProdutos(CATT.map(c => Object.assign({}, c, { uepTrava:'' }))).find(p => p.rot === ROT), [Object.assign({}, TRAVAS[0], { destravadaEm:'27/10/2026 09:00' })])],
     [true, [false, true], null]);
  { // revisão: uma cor nova entra num volume travado — a trava continua nos códigos antigos; conta como TRAVADA, com DESTRAVAR e o aviso
    const CP = CATT.concat([{ codigo:'501059004', desc:'VOL 2/2 PENTEADEIRA CAMARIM STRASS', cor:'ROSA', uep:1.78, uepVig:'12/11/2026', uepTrava:'' }]);
    const PPc = _uepConvProdutos(CP), tp = _ucvTravaDe(PPc.find(p => p.rot === ROT), TRAVAS);
    const TMp = _ucvTravaMontar([], PPc, TRAVAS);
    ok('travada em parte (cor nova sem a trava): TRAVADA com o aviso e o 🔓 DESTRAVAR — nunca o TRAVAR que o .gs recusaria',
       [tp.travada, tp.parcial, TMp.travadas.length, TMp.cumpriu.length, _ucvTravaHtml(TMp, null).includes('entrou código novo no volume, sem a trava — destrave e trave de novo'),
        _ucvTravaHtml(TMp, null).includes('onclick="_ucvDestravaAbrir(0)"'), _uepConvHtml(_uepConvMontar(PPc, ROT, 12.4, 6.7, 2530, 15, undefined, REGS, TRAVAS)).includes('Entrou código novo neste volume, sem a trava')],
       [true, true, 1, 0, true, true, true]); }
  { const RJ = _uepConvMontar(PRODS, '501059 · PENTEADEIRA CAMARIM STRASS', 30, 6.7, 2530, 15, undefined, REGS.concat([Object.assign(ST2('27/10/2026', 30, 60, 4), { volume:'JOGO 2 VOL' }), Object.assign(ST2('28/10/2026', 30.5, 60, 4), { volume:'JOGO 2 VOL' })]));
    const HJ = _uepConvHtml(RJ);
    ok('o JOGO (os volumes juntos): a caixa diz que a trava é por volume — nunca REGRA CUMPRIDA nem o caminho para a TRAVA, que não lista JOGO; a lista diz o mesmo',
       [HJ.includes('A TRAVA É POR VOLUME'), HJ.includes('REGRA CUMPRIDA'), HJ.includes('ABRIR NA TRAVA DA UEP'),
        _ucvRegsHtml(RJ.regs, RJ.p, null, null, RJ.volCad).includes(UCV_REG_VEREDITO.jogo[1])], [true, false, false, true]); }
  { const RF = _uepConvMontar(PRODS, ROT, 12.4, 6.7, 2530, 15, undefined, null);
    const lendo = _uepConvHtml(RF); RF.regsFalha = 'sem-resposta'; const falhou = _uepConvHtml(RF);
    ok('a leitura das medições: LENDO enquanto lê; NÃO FORAM LIDAS quando falhou (como a lista logo abaixo diz)',
       [lendo.includes('LENDO AS MEDIÇÕES REGISTRADAS'), falhou.includes('AS MEDIÇÕES REGISTRADAS NÃO FORAM LIDAS'), falhou.includes('LENDO')], [true, true, false]);
    ok('as duas pinturas (tela e papel) passam a falha da leitura ao R',
       [/R\.regsFalha = UCV_REGS && !UCV_REGS\.lista \? UCV_REGS\.falha : null;[\s\S]*res\.innerHTML = _uepConvHtml\(R, true\);/.test(pegaJs('function _uepConvAtualiza(')),
        /R\.regsFalha = UCV_REGS && !UCV_REGS\.lista \? UCV_REGS\.falha : null;/.test(pegaJs('function gerarRelatorioCrono('))], [true, true]); }
  const RTV = _uepConvMontar(PT, ROT, 12.4, 6.7, 2530, 15, undefined, REGS, TRAVAS), HTV = _uepConvHtml(RTV);
  ok('travada: a caixa diz UEP TRAVADA, quando e por quê; a medição nova só informa (1,85 → +4,0%); o caminho para destravar é só do PPCP',
     [HTV.includes('🔒 UEP TRAVADA · 1,78'), HTV.includes('Travada pelo PPCP em 26/10/2026 pelas 2 medições válidas (113 volumes, média 1,78)'), HTV.includes('<b>não muda a UEP</b>'),
      HTV.includes('Esta dá 1,85 (+4,0%) — só informa'), HTV.includes('🔓 DESTRAVAR NA TRAVA DA UEP'), HTV.includes('REGRA CUMPRIDA')], [true, true, true, true, true, false]);
  // a sub-aba
  const RG2 = (modelo, produto, volume, sLac, volumes, em, sRod) => ({ data:String(em).slice(0, 10), em, modelo, produto, volume, sLac, sRod:sRod == null ? sLac : sRod, volumes });
  const LT = [RG2('501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', 12.4, 52, '26/10/2026 10:19'), RG2('501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', 11.5, 61, '26/10/2026 10:18'),
              RG2('501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', 12.6, 70, '28/10/2026 09:00'),        // depois da trava
              RG2('501139', 'ARMARIO ENCANTO', 'VOL 1/1', 17.6, 11, '26/10/2026 10:11'), RG2('501149', 'MESA CABECEIRA MADERO', 'VOL 1/1', 6.7, 60, '20/10/2026 15:58', 7.9),
              RG2('501059', 'PENTEADEIRA CAMARIM STRASS', 'JOGO 2 VOL', 13, 65, '30/10/2026 15:43'), RG2('501059', 'PENTEADEIRA CAMARIM STRASS', 'JOGO 2 VOL', 13.2, 60, '31/10/2026 09:10')];
  const TM = _ucvTravaMontar(LT, PT, TRAVAS);
  ok('a sub-aba: o STRASS VOL 2/2 travado, a medição de depois só informa; o ENCANTO ainda não cumpre; a base e o JOGO fora',
     [TM.travadas.map(x => x.p.rot), TM.travadas[0].novas.n, _ucvU2(TM.travadas[0].novas.uepMed), fmt1(TM.travadas[0].novas.difPct), TM.falta.map(x => x.p.rot), TM.cumpriu.length, TM.base, TM.jogos, TM.travasLidas],
     [[ROT], 1, '1,88', '5,7', ['501139 · ARMARIO ENCANTO'], 0, true, 2, true]);
  const TM2 = _ucvTravaMontar(LT.slice(0, 2), _uepConvProdutos(CATT.map(c => Object.assign({}, c, { uepTrava:'', uep:c.codigo === '501059002' ? 2.29 : c.uep }))), []);
  ok('sem trava: o STRASS VOL 2/2 cumpriu (TROCA para 1,78), com o que gravar em cada código', [TM2.cumpriu.map(x => [x.p.rot, x.S.veredito, _ucvU2(x.S.uepMed)]), TM2.cumpriu[0].digitar.map(g => [g.uep, g.cods.map(c => c.cod)])],
     [[[ROT, 'troca', '1,78']], [[1.78, ['501059002']]]]);
  ok('a ordem de quem cumpriu: TROCA primeiro, depois a borda, depois a maior diferença', (() => {
    const mk = (rot, ver, borda, dif) => ({ p:{ rot }, S:{ veredito:ver, borda, difPct:dif } });
    const L = [mk('a', 'fica', false, 1), mk('b', 'fica', true, 9.7), mk('c', 'troca', false, 12.7), mk('d', 'troca', false, 14.3), mk('e', 'fica', false, -3)];
    const ad = x => x.S.difPct == null ? 99 : Math.abs(x.S.difPct);
    return L.sort((a, b) => (b.S.veredito === 'troca') - (a.S.veredito === 'troca') || b.S.borda - a.S.borda || ad(b) - ad(a) || a.p.rot.localeCompare(b.p.rot)).map(x => x.p.rot); })(),
     ['d', 'c', 'b', 'e', 'a']);
  ok('a mesma ordem está no _ucvTravaMontar', /out\.cumpriu\.sort\(\(a, b\) => \(b\.S\.veredito === 'troca'\) - \(a\.S\.veredito === 'troca'\) \|\| b\.S\.borda - a\.S\.borda \|\| ad\(b\) - ad\(a\)/.test(pegaJs('function _ucvTravaMontar(')), true);
  global.UCV_TRAVA_MSG = ''; global.UCV_TRAVANDO = false;
  const HTM = _ucvTravaHtml(TM2, null), HTT = _ucvTravaHtml(TM, null);
  ok('o desenho: as 3 regras, CUMPRIRAM (com TROCAR E TRAVAR pelo índice), TRAVADAS e AINDA NÃO CUMPRIRAM, a base e o JOGO fora',
     [HTM.includes('1 · A MEDIÇÃO VALE'), HTM.includes('<em>30 volumes</em>'), HTM.includes('<em>15%</em>'), HTM.includes('<em>2 medições válidas</em>'), HTM.includes('<em>100 volumes</em>'), HTM.includes('<em>90–110%</em>'),
      HTM.includes('CUMPRIRAM A REGRA · ESPERANDO O PPCP'), HTM.includes('onclick="_ucvTravaAbrir(0)"'), HTM.includes('🔒 TROCAR E TRAVAR<small>em 1,78</small>'), HTM.includes('TROCA PARA 1,78'),
      HTT.includes('TRAVADAS PELO PPCP'), HTT.includes('onclick="_ucvDestravaAbrir(0)"'), HTT.includes('1 medição · média 1,88 (+5,7%)<small>só informa — a UEP não muda</small>'),
      HTT.includes('AINDA NÃO CUMPRIRAM'), HTT.includes('não vale: 26/10 11 volumes (pede 30)'), HTT.includes('MESA CABECEIRA MADERO</b> — a base, 6,7 s congelados'), HTT.includes('2 medições de JOGO — a trava é por volume')],
     new Array(17).fill(true));
  ok('o desenho: o .gs antigo (sem as travas) é dito; sem as medições lidas, o estado — nunca 0',
     [_ucvTravaHtml(Object.assign({}, TM, { travasLidas:false }), null).includes('FALTA O .gs v5.64'), _ucvTravaHtml(null, null).includes('Lendo'), _ucvTravaHtml(null, 'falhou').includes('não foram lidas'),
      _ucvTravaHtml(null, 'sem-endpoint').includes('re-deploye')], [true, true, true, true]);
  ok('o desenho da trava não faz conta (tudo pronto do _ucvTravaMontar)',
     ['function _ucvTravaHtml(', 'function _ucvTravaDlgHtml(', 'function _ucvRegraBoxHtml('].filter(f => /_ucvRegraUep\(|_ucvMedValida\(|_uepConvCadastro\(|_ucvTravaMontar\(|UEP_PAD_FAIXA\[0\] *<=/.test(pegaJs(f))), []);
  // o diálogo do PPCP
  const DL = _ucvTravaDlgHtml({ x:TM2.cumpriu[0], acao:'travar', modo:'trocar' });
  ok('o diálogo: o que a regra diz em destaque (A REGRA), a outra opção contra a regra, o código (senha) e o motivo; o código não fica no painel',
     [DL.includes('🔒 TRAVAR A UEP · 501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2'), DL.includes('2 medições válidas (26/10) · 113 volumes · média 1,78 · cadastro 2,29 (−22,3%)'),
      /TROCAR PARA 1,78 E TRAVAR<\/b><i>A REGRA<\/i>/.test(DL), DL.includes('TRAVAR EM 2,29, COMO ESTÁ'), DL.includes('contra a regra — fica registrado que o PPCP escolheu manter.'),
      DL.includes('id="ucv-dlg-cod" type="password"'), DL.includes('MOTIVO (opcional)'), DL.indexOf('TROCAR PARA') < DL.indexOf('TRAVAR EM')], new Array(8).fill(true));
  const DLF = _ucvTravaDlgHtml({ x:Object.assign({}, TM2.cumpriu[0], { S:Object.assign({}, TM2.cumpriu[0].S, { veredito:'fica' }) }), acao:'travar', modo:'manter' });
  ok('a regra diz FICA: TRAVAR EM … em cima (A REGRA), TROCAR contra a regra embaixo; sem UEP no cadastro, não há MANTER',
     [DLF.indexOf('TRAVAR EM 2,29') < DLF.indexOf('TROCAR PARA'), /TRAVAR EM 2,29, COMO ESTÁ<\/b><i>A REGRA<\/i>/.test(DLF), DLF.includes('Contra a regra — fica registrado.'),
      _ucvTravaDlgHtml({ x:Object.assign({}, TM2.cumpriu[0], { cad:null }), acao:'travar', modo:'trocar' }).includes('COMO ESTÁ')], [true, true, true, false]);
  const DD = _ucvTravaDlgHtml({ x:TM.travadas[0], acao:'destravar' });
  ok('destravar: o código e o MOTIVO obrigatório', [DD.includes('🔓 DESTRAVAR A UEP'), DD.includes('MOTIVO (obrigatório)'), DD.includes('Travada em 26/10/2026 · 1,78')], [true, true, true]);
  global.CFG = { sheetsUrl:'https://script.google.com/macros/s/X/exec' };
  const UT = decodeURIComponent(_ucvTravaUrl({ x:TM2.cumpriu[0], acao:'travar', modo:'trocar' }, '4321', 'ok', 'tZ'));
  ok('a URL: travarUep com os códigos e a UEP de cada um (trocar), o modo, o id da retentativa; manter manda só os códigos; destravar, o motivo',
     [UT.includes('action=travarUep&modelo=501059&produto=PENTEADEIRA CAMARIM STRASS&volume=VOL 2/2&modo=trocar&travaId=tZ&cods=501059002:1.78&codigo=4321&motivo=ok'),
      decodeURIComponent(_ucvTravaUrl({ x:TM2.cumpriu[0], acao:'travar', modo:'manter' }, '4321', '', 'tZ')).includes('&cods=501059002&'),
      decodeURIComponent(_ucvTravaUrl({ x:TM.travadas[0], acao:'destravar' }, '4321', 'mudou', '')).includes('action=destravarUep&modelo=501059&produto=PENTEADEIRA CAMARIM STRASS&volume=VOL 2/2&cods=501059002&codigo=4321&motivo=mudou')],
     [true, true, true]);
  ok('a resposta: travou (trocou · manteve) · já · recusou (com o motivo) · erro · .gs antigo (cai no getDados)',
     [_ucvTravaResposta({ ok:true, travado:true, decisao:'TROCOU', uep:1.78, n:3 }, 'travar').txt, _ucvTravaResposta({ ok:true, travado:true, decisao:'MANTEVE', uep:2.29, n:3 }, 'travar').txt,
      _ucvTravaResposta({ ok:true, travado:true, jaTravada:true }, 'travar').tipo, _ucvTravaResposta({ ok:true, recusado:true, erro:'código do PPCP errado' }, 'travar').txt,
      _ucvTravaResposta({ ok:true, slots:[] }, 'travar').txt.includes('.gs v5.64'),
      _ucvTravaResposta({ ok:true, destravado:true, n:3 }, 'destravar').tipo, _ucvTravaResposta({ ok:true, travado:true, decisao:'TROCOU', uep:1.78, n:1, logErro:'y' }, 'travar').txt.includes('UEP_TRAVAS FALHOU')],
     ['✓ UEP trocada para 1,78 e travada (3 códigos). Atualize a aba UEP da sua planilha de programação hoje.', '✓ UEP 2,29 travada (3 códigos).', 'ja',
      'O Apps Script não travou: código do PPCP errado. Nada foi gravado.', true, 'ok', true]);
  ok('sem resposta ≠ não gravou: o cadastro relido decide (a UEP_TRAVA dos códigos); sem ele, diz que não dá para saber',
     [_ucvTravaConfere([{ codigo:'501.059.002', uepTrava:'26/10/2026 PPCP' }], { x:TM2.cumpriu[0], acao:'travar' }).startsWith('✓ Travado'),
      _ucvTravaConfere([{ codigo:'501059002', uepTrava:'' }], { x:TM2.cumpriu[0], acao:'travar' }).startsWith('Não travou'),
      _ucvTravaConfere([{ codigo:'501059002', uepTrava:'' }], { x:TM.travadas[0], acao:'destravar' }).startsWith('✓ Destravado'),
      _ucvTravaConfere(null, { x:TM2.cumpriu[0], acao:'travar' }).includes('não dá para saber')], [true, true, true, true]);
  ok('o plural é "medições", nunca "mediçãoões"', [/medição\$\{/.test(JS), _ucvRegsHtml(REGS.slice(0, 2), PRODS.find(p => p.rot === ROT), null).includes('2 medições ·')], [false, true]);
  // a paridade da regra: painel (_ucvRegraUep) × .gs (_cronoRegraUep), nos mesmos casos
  const GS = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');
  const pegaGs = a => { const i = GS.indexOf(a); let k = GS.indexOf('{', GS.indexOf(')', i)), n = 0, j = k; for(; j < GS.length; j++){ if(GS[j] === '{') n++; else if(GS[j] === '}' && --n === 0) break; } return GS.slice(i, j + 1); };
  const gConst = n => eval('(' + new RegExp('const ' + n + ' = ([^;]+);').exec(GS)[1] + ')');
  ok('as constantes da regra são as mesmas no painel e no .gs (a base sem as lacunas e a base também)',
     [gConst('TRAVA_MED_MIN_VOL_GS'), gConst('TRAVA_MED_MAX_LAC_GS'), gConst('TRAVA_MIN_MED_GS'), gConst('TRAVA_MIN_VOL_GS'), gConst('TRAVA_FAIXA_GS'), gConst('CRONO_BASE_S_GS'), gConst('TRAVA_BASE_GS')],
     [UCV_MED_MIN_VOL, UCV_MED_MAX_LAC, UCV_REGRA_MIN_MED, UCV_REGRA_MIN_VOL, UEP_PAD_FAIXA, UEP_BASE_MEDIDA.seg, UEP_BASE]);
  const NOMES = ['TRAVA_MED_MIN_VOL_GS', 'TRAVA_MED_MAX_LAC_GS', 'TRAVA_MIN_MED_GS', 'TRAVA_MIN_VOL_GS', 'TRAVA_FAIXA_GS', 'CRONO_BASE_S_GS'];
  const G = new Function(...NOMES, pegaGs('function _cronoMedValida(') + '\n' + pegaGs('function _cronoRegraUep(') + '\nreturn _cronoRegraUep;')(...NOMES.map(gConst));
  const CASOS = [[REGS.slice(0, 2), 2.29], [REGS.slice(0, 2), 1.78], [[ST2('26/10/2026', 12.4, 29, 1.57), ST2('23/10/2026', 11.5, 80, 1.46)], 2.29],
                 [[ST2('26/10/2026', 12.4, 52, 1.57), ST2('23/10/2026', 19, 61, 2.4)], 2.29], [[ST2('26/10/2026', 12.4, null, 1.57)], 2.29], [[ST2('26/10/2026', 0, 40, 1.57)], 2.29],
                 [REGS.slice(0, 2), 0], [[ST2('26/10/2026', 22, 140, 2.78)], 2.29], [[ST2('26/10/2026', 0, 0, 0)], 2.29],
                 [[ST2('04/11/2026', 16.6, 60, 2.58, { sRod:20.4 }), ST2('04/11/2026', 17.7, 60, 2.6, { sRod:19 })], 2.07],     // HOME ANGEL: 18,6% não vale; 6,8% vale
                 [[ST2('26/10/2026', 11.05, 52, 1.6, { sRod:13 }), ST2('23/10/2026', 11.5, 61, 1.46)], 2.29],                // 15,0% exato vale
                 [[ST2('26/10/2026', 12.4, 52, 1.6, { sRod:14.6 }), ST2('23/10/2026', 11.5, 61, 1.46)], 2.29],               // 15,1% não vale
                 [[ST2('26/10/2026', 12.4, 52, 1.6, { sRod:'' }), ST2('23/10/2026', 11.5, 61, 1.46)], 2.29],                 // sem o rodando
                 [[ST2('26/10/2026', 14.14, 60, 2.1), ST2('23/10/2026', 14.16, 60, 2.1)], 1.9],                              // a borda de 110%
                 [[{ data:'26/10/2026', sRod:12.4, baseS:7.9, uep:1.57, uepCad:2.29, volumes:52 }], 2.29]];
  ok('a regra do painel e a do .gs dão o MESMO veredito, amostra e média em todos os casos',
     CASOS.map(([r, c]) => { const a = _ucvRegraUep(r, c), b = G(r, c); return [a.veredito === b.veredito, a.nVal === b.nVal, a.nVol === b.nVol, (a.uepMed || 0).toFixed(6) === (b.uepMed || 0).toFixed(6)]; }).filter(x => x.includes(false)), []);
  ok('os casos cobrem os três vereditos', [...new Set(CASOS.map(([r, c]) => _ucvRegraUep(r, c).veredito))].sort(), ['falta', 'fica', 'troca']);
  // a coluna TROCA (PPCP, 26/10/2026: "colocar que não troca devido a variar 90 a 110 e tbm se foi trocado")
  const RTR = (modelo, produto, volume, uep, uepCad) => ({ data:'26/10/2026', modelo, produto, volume, uep, uepCad, volumes:50, sLac:uep * UEP_BASE_MEDIDA.seg, sRod:uep * UEP_BASE_MEDIDA.seg });
  const TROCASR = [{ modelo:'501061', produto:'PENTEADEIRA CAMARIM ELOA', volume:'VOL 2/2', gravado:'26/10/2026 12:11', vig:'26/10/2026', codigos:[{ cod:'501061002', uep:1.82, antes:2.53 }, { cod:'501061004', uep:1.82, antes:2.53 }] }];
  const STR = _ucvRegsStatus([RTR('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 1.70, 1.58), RTR('501114', 'PAINEL SIRIUS 1.4', 'VOL 1/1', 1.81, 1.49),
    RTR('501061', 'PENTEADEIRA CAMARIM ELOA', 'VOL 2/2', 1.82, 2.53), RTR('501061', 'PENTEADEIRA CAMARIM ELOA', 'VOL 2/2', 1.90, 1.82),
    RTR('501061', 'PENTEADEIRA CAMARIM ELOA', 'VOL 1/2', 2.0, 2.19), RTR('501149', 'MESA CABECEIRA MADERO', 'VOL 1/1', 1, 1.2), RTR('501139', 'ARMARIO ENCANTO', 'VOL 1/1', 2.23, '')], TROCASR);
  ok('a coluna TROCA: dentro de 90–110% NÃO TROCA, fora FORA DA FAIXA, TROCADA só a medição que viu o cadastro de ANTES da troca (a de depois é julgada contra a UEP nova), a base nunca, sem cadastro —',
     STR.map(x => [x.est, x.dif != null ? +x.dif.toFixed(1) : x.antes != null ? [x.antes, x.depois, x.vig] : null]),
     [['nao-troca', 7.6], ['fora', 21.5], ['trocada', [2.53, 1.82, '26/10/2026']], ['nao-troca', 4.4], ['nao-troca', -8.7], ['base', null], ['sem-cadastro', null]]);
  { const NV = _ucvRegsStatus([Object.assign(RTR('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 1.70, 1.58), { volumes:28 }), Object.assign(RTR('501094', 'MESA CABECEIRA SLEEP', 'VOL 1/1', 1.01, 0.83), { sRod:9.1, volumes:82 })], TROCASR);
    ok('v7.233.0: a medição que não vale (menos de 30 volumes, lacunas acima de 15%) sai NÃO VALE com o porquê — antes de qualquer outra situação',
       [NV.map(x => [x.est, x.mot]), _ucvStatusCel(NV[1])], [[['nao-vale', '28 volumes (pede 30)'], ['nao-vale', 'lacunas 25,6% (até 15%)']], '<span class="ucv-pill warn">NÃO VALE</span><small>lacunas 25,6% (até 15%)</small>']); }
  ok('v7.200.0: a coluna TROCA julga pela régua de hoje (sem as lacunas ÷ 6,7), nunca pela UEP_CRONO gravada (a rodando de 1,40 daria FORA)',
     _ucvRegsStatus([Object.assign(RTR('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 1.70, 1.58), { uep:1.4 })], TROCASR).map(x => [x.est, +x.dif.toFixed(1)]), [['nao-troca', 7.6]]);
  ok('a célula diz o porquê: quanto variou e a faixa; a troca com a data e antes → depois',
     [_ucvStatusCel(STR[0]), _ucvStatusCel(STR[1]).includes('FORA DA FAIXA</span><small>variou +21,5% · fora de 90–110%'), _ucvStatusCel(STR[2]).includes('TROCADA</span><small>26/10 · 2,53 → 1,82'),
      _ucvStatusCel(STR[4]).includes('variou −8,7%'), _ucvStatusCel(STR[5]).includes('BASE'), _ucvStatusCel(undefined)],
     ['<span class="ucv-pill ok">NÃO TROCA</span><small>variou +7,6% · dentro de 90–110%</small>', true, true, true, true, '']);
  const HTR = _ucvRegsHtml([RTR('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 1.70, 1.58)], null, null, null, null, 'lendo', STR.slice(0, 1));
  ok('a coluna fica entre UEP e VERSÃO DO CADASTRO; a BASE da linha sai curta (o texto inteiro no title)',
     [/<th class="n" title="SEM AS LACUNAS ÷ 6,7 s da MADERO[^"]*">UEP<\/th><th title="[^"]*">TROCA<\/th><th class="n" title="[^"]*">VERSÃO DO<br>CADASTRO<\/th>/.test(HTR), HTR.includes('NÃO TROCA'),
      _ucvRegsHtml([Object.assign(RTR('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 1.70, 1.58), { base:'MADERO MEDIDA 20/10/2026' })], null, null, null, null, 'lendo', []).includes('title="MADERO MEDIDA 20/10/2026">MADERO 20/10</td>'),
      _ucvRegsHtml([Object.assign(RTR('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 1.70, 1.58), { base:'MADERO SEM LACUNAS 20/10/2026' })], null, null, null, null, 'lendo', []).includes('title="MADERO SEM LACUNAS 20/10/2026">MADERO 20/10</td>')],
     [true, true, true, true]);
  // VERSÃO DO CADASTRO (v7.163.0, PPCP: "troca cadastro VERSÃO 01" → "ISSO"): o número é o que a medição viu; em vigor/anterior diz se ainda é o de hoje
  const PRV = _uepConvProdutos([{ codigo:'501082001', desc:'VOL 1/1 TOUCADOR MAGIC NEW', cor:'B', uep:1.58, uepVig:'25/09/2026' },
    { codigo:'501061002', desc:'VOL 2/2 PENTEADEIRA CAMARIM ELOA', cor:'B', uep:1.82, uepVig:'26/10/2026 DIGITADA' }, { codigo:'501061001', desc:'VOL 1/2 PENTEADEIRA CAMARIM ELOA', cor:'B', uep:2.19, uepVig:'16/10/2026' }]);
  const STV = _ucvRegsStatus([RTR('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 1.70, 1.58), RTR('501061', 'PENTEADEIRA CAMARIM ELOA', 'VOL 2/2', 1.82, 2.53),
    RTR('501139', 'ARMARIO ENCANTO', 'VOL 1/1', 2.23, 2.23)], TROCASR, PRV);
  ok('em vigor = o cadastro de hoje é o que a medição viu; anterior = já trocado; fora do cadastro: nada', STV.map(x => [x.est, x.vigor]),
     [['nao-troca', true], ['trocada', false], ['nao-troca', null]]);
  const HV = _ucvRegsHtml([RTR('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 1.70, 1.58), RTR('501061', 'PENTEADEIRA CAMARIM ELOA', 'VOL 2/2', 1.82, 2.53)], null, null, null, null, 'lendo', STV.slice(0, 2));
  ok('a célula: o número com "em vigor" ou "anterior" embaixo', [HV.includes('1,58<small>em vigor</small>'), HV.includes('2,53<small>anterior</small>')], [true, true]);
  ok('os títulos da lista interpolam (a linha do cabeçalho é template, não aspas simples: "${UEP_PAD_FAIXA[0]}" saía cru no tooltip)',
     [HV.includes('${'), /\+ `<th>VOLUME<\/th>/.test(pegaJs('function _ucvRegsHtml('))], [false, true]);
  // a conferência das trocas (v7.161.0: pelas horas do getHorasCrono, SEM as paradas, contra a base)
  const TC = (prod, cod, extra) => Object.assign({ modelo:'501059', produto:prod, volume:'VOL 2/2', amostra:'2 medições, 113 volumes', gravado:'26/10/2026 10:40', vig:'26/10/2026',
    codigos:[{ cod, uep:1.51, antes:2.29, atual:1.51 }], substituida:false }, extra || {});
  const HC_ = (data, hora, cods, par) => ({ data, hora, min:60, cods, par:par || {} });
  const HCONF = [HC_('20/10/2026', '13:00', { 501149001:288 }), HC_('20/10/2026', '14:00', { 501149001:288 }), HC_('20/10/2026', '15:00', { 501149001:288 }),   // a base: 99,98%
    HC_('26/10/2026', '09:00', { 501059602:999 }),                                                       // o dia da troca: fora
    HC_('28/10/2026', '09:00', { 501059002:190 }), HC_('28/10/2026', '10:00', { 501059002:190 }),       // 380 cx × 1,51: 99,6% → CONFERE
    HC_('28/10/2026', '11:00', { 501059002:50, 501149001:50 }),                                           // dividida: fora dos dois
    HC_('28/10/2026', '13:00', { 501059102:125 }), HC_('28/10/2026', '14:00', { 501059102:125 }),       // 65,5% → ▲ SUBIR?
    HC_('29/10/2026', '09:00', { 501059202:160 }, { 'Troca de Plastico':15 }), HC_('29/10/2026', '10:00', { 501059202:160 }, { Limpeza:15 }),
    HC_('29/10/2026', '13:00', { 501059202:147 }),                                                        // perdeu SÓ em paradas: 30 min de 180
    HC_('28/10/2026', '15:00', { 501059302:95 }),                                                         // 1 h: aguardando
    HC_('28/10/2026', '15:00', { 501059402:250 }), HC_('28/10/2026', '16:00', { 501059402:250 }),       // 131% → ▼ DESCER?
    HC_('28/10/2026', '16:00', { 501059502:190 })];
  const PC = PRODS.concat([]);
  const CM = _ucvConfMontar([TC('PENTEADEIRA CAMARIM STRASS', '501059002'), TC('P ABAIXO', '501059102'), TC('P PARADAS', '501059202'), TC('P ESPERA', '501059302'),
    TC('P VELHA', '501059402', { gravado:'20/10/2026 09:00', vig:'20/10/2026' }), TC('P VELHA', '501059402', { gravado:'27/10/2026 08:00', vig:'27/10/2026' }),
    TC('P SUBST', '501059502', { substituida:true }), TC('P ANTES', '501059602')], 2530, HCONF, PC);
  const cf = n => CM.lista.find(x => x.rot === '501059 · ' + n + ' · VOL 2/2') || {}, est = n => cf(n).estado;
  ok('a conferência contra a base (99,98%): 99,6% CONFERE, 65% ▲ SUBIR?, 1 h AGUARDANDO, o dia da troca fora, UEP mudada depois = SUBSTITUÍDA',
     [est('PENTEADEIRA CAMARIM STRASS'), fmtP(cf('PENTEADEIRA CAMARIM STRASS').rel), est('P ABAIXO'), est('P ESPERA'), est('P ANTES'), cf('P ANTES').P, est('P SUBST')],
     ['confere', '99,6%', 'abaixo', 'aguardando', 'aguardando', null, 'substituida']);
  ok('JUSTA: quem perdeu só em PARADAS confere (sem elas 97,9% da base) — com as paradas dentro dava 81,6% e pediria para SUBIR a UEP',
     [est('P PARADAS'), cf('P PARADAS').rel.toFixed(1), cf('P PARADAS').P.pct.toFixed(1), cf('P PARADAS').P.par], ['confere', '97.9', '81.6', 30]);
  ok('a troca mais NOVA do volume é a que vale: 500 cx em 2 h = 131% ▼ DESCER?',
     [CM.lista.filter(x => x.rot.includes('P VELHA')).length, est('P VELHA'), Math.round(cf('P VELHA').rel)], [1, 'acima', 131]);
  ok('os alertas vêm primeiro e são contados', [CM.lista.slice(0, CM.nAlerta).every(x => x.estado === 'abaixo' || x.estado === 'acima'), CM.nAlerta], [true, 2]);
  ok('sem a base na janela · sem as paradas (.gs v5.35) · sem as horas: diz qual, nunca julga',
     [_ucvConfMontar([TC('X', '501059002')], 2530, HCONF.slice(3), PC).lista[0].estado,
      _ucvConfMontar([TC('X', '501059002')], 2530, HCONF.map(h => ({ data:h.data, hora:h.hora, min:h.min, cods:h.cods })), PC).lista[0].estado,
      _ucvConfMontar([TC('X', '501059002')], 2530, 'lendo', PC).lista[0].estado, _ucvConfMontar([TC('X', '501059002')], 2530, 'sem-endpoint', PC).lista[0].estado],
     ['sem-base', 'sem-paradas', 'lendo', 'sem-paradas']);
  const HC = _ucvConfHtml(CM, null);
  ok('o desenho da conferência: a direção, a perda em paradas à parte, o quanto falta para julgar e que nada muda sozinho',
     [HC.includes('▲ SUBIR?'), HC.includes('▼ DESCER?'), HC.includes('CONFERE'), HC.includes('1 h de 2 h sozinho, sem parada, para julgar'), HC.includes('a UEP não muda sozinha'),
      HC.includes('2,29 → <b>1,51</b>'), HC.includes('perda em paradas 30 min (16,7%)'), HC.includes('SEM as paradas apontadas, contra a MADERO nas mesmas condições (3 h, 100,0% do padrão da meta)')],
     [true, true, true, true, true, true, true, true]);
  ok('a conferência sem o .gs novo, sem troca, sem leitura; e o aviso do topo só com alerta',
     [_ucvConfHtml(null, 'sem-endpoint').includes('.gs v5.36'), _ucvConfHtml({ lista:[], nAlerta:0 }, null).includes('Nenhuma UEP trocada'), _ucvConfHtml(null, null),
      _ucvConfAvisoHtml(CM).includes('2 UEP trocadas que a produção não confirma'), _ucvConfAvisoHtml({ lista:[], nAlerta:0 }), _ucvConfAvisoHtml(null)],
     [true, true, '', true, '', '']);
  // a tela
  const iCr2 = html.indexOf('<section id="sec-crono"'), SEC = html.slice(iCr2, html.indexOf('</section>', iCr2));
  ok('a marcação: o aviso da conferência no topo; a TRAVA DA UEP e a conferência FORA do resultado (refeito a cada tecla); o diálogo do PPCP fora da aba',
     [SEC.indexOf('id="uep-conv-conf-av"') < SEC.indexOf('class="uep-card"'), SEC.indexOf('id="uep-conv-trava"') > SEC.indexOf('id="uep-conv-regs"'),
      SEC.indexOf('id="uep-conv-conf"') > SEC.indexOf('id="uep-conv-trava"'), /placeholder="dd\/mm\/aaaa"/.test(SEC), /placeholder="obrigatório"/.test(SEC),
      SEC.includes('id="uep-conv-t-msg"'), html.includes('<div class="modal-over" id="modal-trava">'), html.includes('onclick="_ucvTravaEnviar()"'), html.includes('onclick="fecharTrava()"')],
     [true, true, true, true, true, false, true, true, true]);
  const RPI = pegaJs('function _ucvRegPintar('), REG = pegaJs('async function _ucvRegistrar('), TRE = pegaJs('async function _ucvTravaEnviar(');
  ok('a data não tem mais HOJE de enfeite e sai do campo depois de registrar (cada medição com a sua)',
     [/r-data[^\n]*hojeStr|placeholder *= *hojeStr/.test(RPI), /\['data', 'per', 'rod', 'vol'\]/.test(REG)], [false, true]);
  ok('o ✓ TROCAR saiu: nenhuma chamada ao trocarUepCrono no painel; a TRAVA vai pelo travarUep/destravarUep, com retentativa, e relê cadastro → medições → conferência',
     [/trocarUepCrono/.test(JS), /function _ucvTrocar\(|_ucvProntas|UCV_PRONTAS|UCV_TROCANDO/.test(JS), /jsonpEscrita\(_ucvTravaUrl\(/.test(TRE),
      /await _capBuscar\(\);\s*await _ucvRegsCarregar\(true\);\s*await _ucvConfCarregar\(true\);/.test(TRE), /setUepCatalogo|simularUepCatalogo/.test(TRE)],
     [false, false, true, true, false]);
  ok('o código do PPCP nunca é guardado no painel (nem localStorage, nem variável global)', /localStorage|_ucvGuarda|UCV_[A-Z_]*COD/.test(TRE), false);
  // o fluxo REAL do _ucvTravaEnviar, com o Apps Script de mentira
  ['function _ucvTravaPinta(', 'function _ucvTravaAbrir(', 'function _ucvDestravaAbrir(', 'function fecharTrava(', 'async function _ucvTravaEnviar('].forEach(f => eval.call(global, pegaJs(f)));
  const fluxoTrava = (resposta, campos) => {
    const F = { chamadas:[], ordem:[], alertas:[], modal:{ on:true }, pinturas:[] };
    const els = { 'ucv-dlg-cod':{ value:(campos || {}).cod == null ? '4321' : campos.cod, focus:() => {} }, 'ucv-dlg-mot':{ value:(campos || {}).mot || '' },
                  'modal-trava':{ classList:{ add:() => { F.modal.on = true; }, remove:() => { F.modal.on = false; } } }, 'modal-trava-c':{ innerHTML:'' }, 'modal-trava-ok':{ textContent:'', disabled:false } };
    global.document = { getElementById:id => els[id] || null };
    global.CFG = { sheetsUrl:'https://script.google.com/macros/s/X/exec' };
    global.UCV_TRAVANDO = false; global.UCV_TRAVA_MSG = ''; global.UCV_TRAVA = TM2;
    global.alert = t => F.alertas.push(t);
    global._uepConvAtualiza = () => { F.pinturas.push({ msg:global.UCV_TRAVA_MSG, travando:global.UCV_TRAVANDO }); };
    global.CAP_FALHA = null; global.CAP_RAW = [{ codigo:'501059002', uepTrava:'' }];
    global._capBuscar = async () => { F.ordem.push('cadastro'); };
    global._ucvRegsCarregar = async () => { F.ordem.push('medições'); };
    global._ucvConfCarregar = async () => { F.ordem.push('conferência'); };
    // como o de verdade: chama o onTentativa (a sub-aba pinta "Gravando…") e lança no erro
    global.jsonpEscrita = async (url, onT) => { if(onT) onT(1); F.chamadas.push(url); F.botao = els['modal-trava-ok'].textContent; F.travandoNaPintura = global.UCV_TRAVANDO; if(resposta instanceof Error) throw resposta; return resposta; };
    _ucvTravaAbrir(0);
    return F;
  };
  _assincronos.push(async () => {
    let F = fluxoTrava({ ok:true, travado:true, decisao:'TROCOU', uep:1.78, n:1 });
    await _ucvTravaEnviar();
    const u = decodeURIComponent(F.chamadas[0] || '');
    ok('fluxo TRAVAR: manda o volume, o modo da regra (trocar), os códigos com a UEP e o código; relê cadastro → medições → conferência; fecha o diálogo',
       [F.chamadas.length, u.includes('action=travarUep&modelo=501059&produto=PENTEADEIRA CAMARIM STRASS&volume=VOL 2/2&modo=trocar'), u.includes('&cods=501059002:1.78&codigo=4321&'),
        F.ordem, global.UCV_TRAVANDO, [F.travandoNaPintura, F.botao], global.UCV_TRAVA_MSG.startsWith('✓ UEP trocada para 1,78 e travada'), F.modal.on, global.UCV_TRAVA_DLG],
       [1, true, true, ['cadastro', 'medições', 'conferência'], false, [true, 'GRAVANDO…'], true, false, null]);
    F = fluxoTrava({ ok:true, travado:false, recusado:true, motivo:'codigo-errado', erro:'código do PPCP errado' });
    await _ucvTravaEnviar();
    ok('fluxo TRAVAR: código errado → avisa, o diálogo FICA aberto e o campo do código é limpo; nada relido; a sub-aba sai do "Gravando…" (revisão)',
       [F.alertas[0], F.modal.on, document.getElementById('ucv-dlg-cod').value, F.ordem, global.UCV_TRAVANDO, F.pinturas[0].msg, F.pinturas[F.pinturas.length - 1]],
       ['O Apps Script não travou: código do PPCP errado. Nada foi gravado.', true, '', [], false, 'Gravando…', { msg:'', travando:false }]);
    F = fluxoTrava({ ok:true, travado:false, recusado:true, motivo:'falta', erro:'a regra ainda não se cumpre para este volume' });
    await _ucvTravaEnviar();
    ok('fluxo TRAVAR: recusa da regra (a tela estava velha) → fecha, diz por quê e relê', [global.UCV_TRAVA_MSG.includes('a regra ainda não se cumpre'), F.modal.on, F.ordem.length], [true, false, 3]);
    F = fluxoTrava({ ok:true, slots:[] });
    await _ucvTravaEnviar();
    ok('fluxo TRAVAR: .gs antigo → diz que falta o v5.64 (nada gravado)', global.UCV_TRAVA_MSG.includes('.gs v5.64'), true);
    F = fluxoTrava(new Error('Timeout — o Apps Script não respondeu em 25 s'));
    global._capBuscar = async () => { F.ordem.push('cadastro'); global.CAP_RAW = [{ codigo:'501059002', uepTrava:'12/11/2026 PPCP' }]; };
    await _ucvTravaEnviar();
    ok('fluxo TRAVAR: sem resposta, mas o cadastro relido já tem a trava → travou', [global.UCV_TRAVA_MSG.startsWith('✓ Travado'), global.UCV_TRAVANDO], [true, false]);
    F = fluxoTrava(new Error('Lock timeout'));
    global._capBuscar = async () => { F.ordem.push('cadastro'); global.CAP_RAW = [{ codigo:'501059002', uepTrava:'' }]; };
    await _ucvTravaEnviar();
    ok('fluxo TRAVAR: o servidor responde erro (ok:false — o jsonpEscrita lança com a mensagem): diz a mensagem dele, nunca "sem resposta"',
       [global.UCV_TRAVA_MSG, /sem resposta/i.test(global.UCV_TRAVA_MSG)], ['Não travou — o Apps Script respondeu: Lock timeout. Tente de novo — repetir é seguro.', false]);
    F = fluxoTrava({ ok:true, travado:true }, { cod:'   ' });
    await _ucvTravaEnviar();
    ok('fluxo TRAVAR: sem o código → não chama o Apps Script', [F.chamadas.length, F.alertas[0]], [0, 'Digite o código do PPCP.']);
    F = fluxoTrava({ ok:true, destravado:true, n:1 }, { mot:'' });
    global.UCV_TRAVA = TM; _ucvDestravaAbrir(0);
    await _ucvTravaEnviar();
    ok('fluxo DESTRAVAR: sem motivo → não chama o Apps Script', [F.chamadas.length, F.alertas[0]], [0, 'Escreva o motivo para destravar.']);
    F = fluxoTrava({ ok:true, destravado:true, n:1 }, { mot:'mudou a embalagem' });
    global.UCV_TRAVA = TM; _ucvDestravaAbrir(0);
    await _ucvTravaEnviar();
    ok('fluxo DESTRAVAR: com o motivo → destravarUep; diz que a regra volta a valer', [decodeURIComponent(F.chamadas[0] || '').includes('action=destravarUep'), global.UCV_TRAVA_MSG],
       [true, '✓ Destravado. A regra volta a valer para este volume.']);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// PRINCIPAIS PARA ANÁLISE DE TEMPO (v7.189.0, PPCP 30/10/2026: "deixar os
// principais produtos marcados para análise de tempo" — a referência de UEP só é
// revista quando a cronoanálise cobrir o mix). Os volumes que somam 80% da UEP
// de jornada da janela do getHorasCrono, com a situação de cada um.
console.log('\n── CRONOANÁLISE → UEP: os principais para a análise de tempo ──');
{ const CV2 = (codigo, desc, uep, uepVig) => ({ codigo, desc, cor:'BRANCO', uep, uepVig });
  const PP = _uepConvProdutos([
    CV2('501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 1, '21/10/2026 DIGITADA'),        // a base (vem antes de "trocada")
    CV2('501094001', 'VOL 1/1 MESA CABECEIRA SLEEP', 0.83, '16/10/2026'),
    CV2('501060001', 'VOL 1/2 PENTEADEIRA CAMARIM MEL', 1.73, '16/10/2026'),
    CV2('501060002', 'VOL 2/2 PENTEADEIRA CAMARIM MEL', 1.71, '16/10/2026 EST'),
    CV2('501061001', 'VOL 1/2 PENTEADEIRA CAMARIM ELOA', 2.19, '16/10/2026'),
    CV2('501061002', 'VOL 2/2 PENTEADEIRA CAMARIM ELOA', 1.82, '26/10/2026 DIGITADA'),     // trocada pelo ✓ TROCAR A UEP
    CV2('501059001', 'VOL 1/2 PENTEADEIRA CAMARIM STRASS', 2.71, '16/10/2026'),
    CV2('501059002', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 2.29, '16/10/2026'),
    CV2('501082001', 'VOL 1/1 TOUCADOR MAGIC NEW', 1.58, '25/09/2026'),
    CV2('501139001', 'VOL 1/1 ARMARIO ENCANTO', 2.23, '25/09/2026'),
    CV2('501114004', 'VOL 1/1 PAINEL SIRIUS 1.4', 1.49, '16/10/2026'),
    CV2('501999002', 'VOL 1/1 MESA RABO', 2, '16/10/2026'),
    CV2('501888001', 'VOL 1/1 PRODUTO SEM UEP', '', '')]);
  // os mesmos casos de antes da v7.200.0: o sLac dá a MESMA UEP que o rodando ÷ 7,9 dava; v7.233.0: sem lacuna (rodando = sem as lacunas), a medição vale
  const RG2 = (modelo, produto, volume, sRod, volumes, uepCad) => ({ data:'26/10/2026', modelo, produto, volume, sRod:sRod * UEP_BASE_MEDIDA.seg / 7.9, sLac:sRod * UEP_BASE_MEDIDA.seg / 7.9, baseS:7.9, uep:Math.round(sRod / 7.9 * 100) / 100, uepCad, volumes });
  const RGS = [RG2('501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', 12.4, 52, 2.29), RG2('501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', 11.5, 61, 2.29),
    RG2('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 13.4, 70, 1.58), RG2('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 13.0, 40, 1.58),   // 2 válidas, 110 volumes, 106%: FICA (medido)
    RG2('501139', 'ARMARIO ENCANTO', 'VOL 1/1', 17.6, 11, 2.23),                                  // 11 volumes: não vale
    RG2('501114', 'PAINEL SIRIUS 1.4', 'VOL 1/1', 12.8, 51, 1.49), RG2('501114', 'PAINEL SIRIUS 1.4', 'VOL 1/1', 14.3, 50, 1.49)];   // 2 válidas, 101 volumes: a média 1,71 (115%) — TROCA
  const HP2 = (data, hora, cods) => ({ data, hora, min:60, cods, par:{} });
  const HRS = [HP2('27/10/2026', '07:00', { 501094001:600 }), HP2('28/10/2026', '07:00', { 501094001:400 }),   // SLEEP 1.000 cx × 0,83 = 830, em 2 dias
    HP2('27/10/2026', '08:00', { 501149001:800 }), HP2('27/10/2026', '09:00', { 501060001:400, 501060002:400 }),
    HP2('27/10/2026', '10:00', { 501061002:300, 501061001:50 }), HP2('27/10/2026', '13:00', { 501059002:200 }), HP2('27/10/2026', '14:00', { 501082001:250 }),
    HP2('27/10/2026', '15:00', { 501139001:150, 501114004:150 }), HP2('27/10/2026', '16:00', { 501999002:100, 501888001:70, 501777001:30 }),
    HP2('28/10/2026', '05:00', { 501999002:5000 })];                                                       // hora extra: fora (a referência é de jornada)
  const ehHE = h => /^0[56]:/.test(h);
  const M = _ucvPrincipais(HRS, PP, RGS, ehHE);
  ok('a classe A (a régua para rever a referência): os volumes até cruzar 80% da UEP de jornada (o TOUCADOR cruza: 76,1% → 83,5%); a hora extra fica fora',
     [M.nPrinc, M.nVol, M.lista.find(g => g.p.rot.includes('TOUCADOR')).acum.toFixed(1), Math.round(M.uepTot), M.lista.filter(g => g.principal).length], [7, 11, '83.5', 5273, 7]);
  // v7.216.0 (PPCP: "precisamos listar os produtos que falta coletar tempos"): a lista é a AGENDA COMPLETA —
  // todo volume que falta medir, de qualquer classe (o que rodou sem UEP também, sem posição), depois os medidos
  ok('a agenda: tudo o que falta medir (sem a programação lida: o mais pesado no topo; o sem UEP no fim, sem posição), depois os medidos; # é a posição pela UEP',
     M.lista.map(g => [g.rank, g.p.rot.replace(/^\d+ · /, ''), g.sit, g.grupo]),
     [[1, 'MESA CABECEIRA SLEEP', 'falta', 'rodou'], [3, 'PENTEADEIRA CAMARIM MEL · VOL 1/2', 'falta', 'rodou'], [4, 'PENTEADEIRA CAMARIM MEL · VOL 2/2', 'falta', 'rodou'],
      [6, 'PENTEADEIRA CAMARIM STRASS · VOL 2/2', 'cumpriu', 'rodou'], [8, 'ARMARIO ENCANTO', 'medindo', 'rodou'], [9, 'PAINEL SIRIUS 1.4', 'cumpriu', 'rodou'],
      [10, 'MESA RABO', 'falta', 'rodou'], [11, 'PENTEADEIRA CAMARIM ELOA · VOL 1/2', 'falta', 'rodou'], [null, 'PRODUTO SEM UEP', 'falta', 'rodou'],
      [2, 'MESA CABECEIRA MADERO', 'base', 'medido'], [5, 'PENTEADEIRA CAMARIM ELOA · VOL 2/2', 'trocada', 'medido'], [7, 'TOUCADOR MAGIC NEW', 'cumpriu', 'medido']]);
  ok('as contagens da agenda: a medir, que rodaram, medidos entre os que rodaram; sem a programação, ninguém "fora da agenda" (nSemNada null)',
     [M.nPend, M.nRodou, M.nProg, M.nMed, M.nVolMed, M.nSemUep, M.nSemNada], [9, 9, 0, 3, 3, 1, null]);
  ok('a cobertura: UEP de volume medido (base + trocada + a regra cumprida com a UEP que FICA) ÷ UEP da janela; cumprida com TROCA ainda não conta (o cadastro é o antigo, até o PPCP trocar e travar)',
     [fmtP(M.cobertura), M.nPrincMed, M.lista.find(g => g.sit === 'cumpriu' && g.S.veredito === 'troca').medido, M.lista.find(g => g.sit === 'cumpriu' && g.S.veredito === 'fica').medido],
     ['33,0%', 3, false, true]);
  { const PPT = _uepConvProdutos([CV2('501082001', 'VOL 1/1 TOUCADOR MAGIC NEW', 1.58, '25/09/2026')].map(c => Object.assign(c, { uepTrava:'12/11/2026 PPCP' })));
    ok('travada pelo PPCP (a coluna UEP_TRAVA do cadastro): 🔒 TRAVADA, medida, mesmo sem medição lida', [_ucvPrincEstado(PPT[0], null), _ucvPrincSub({ sit:'travada', vig:'12/11/2026 PPCP' })],
       [{ sit:'travada', medido:true, vig:'12/11/2026' }, 'pelo PPCP em 12/11']); }
  const sl = M.lista.find(g => g.sit === 'falta' && g.rank === 1), mv2 = M.lista.find(g => g.rank === 4), el = M.lista.find(g => g.sit === 'trocada');
  ok('por volume: caixas, dias, UEP/cx do cadastro, estimada marcada; a data da troca sai da vigência',
     [sl.cx, sl.nDias, _ucvU2(sl.uepCx), mv2.estimada, sl.estimada, el.vig], [1000, 2, '0,83', true, false, '26/10/2026']);
  const su = M.lista.find(g => /SEM UEP/.test(g.p.rot));
  ok('código sem UEP: o volume entra na AGENDA sem posição (sem peso) — é o que mais precisa do tempo; fora do cadastro só é contado',
     [M.cxSemUep, M.cxFora, su.rank, su.semUep, su.cx, su.uepCx, su.pct], [70, 30, null, true, 70, null, 0]);
  const est = n => _ucvPrincEstado(PP.find(p => p.rot.includes(n)), RGS);
  ok('a situação: a medição de 11 volumes não vale (MEDINDO); a regra cumprida diz PPCP DECIDE; sem medição, FALTA MEDIR',
     [[est('ARMARIO ENCANTO').sit, est('ARMARIO ENCANTO').S.nVal, est('ARMARIO ENCANTO').S.nInv], est('PAINEL SIRIUS').sit, est('PAINEL SIRIUS').S.veredito, est('MESA RABO').sit, est('MESA CABECEIRA MADERO').sit],
     [['medindo', 0, 1], 'cumpriu', 'troca', 'falta', 'base']);
  const M0 = _ucvPrincipais(HRS, PP, null, ehHE);
  ok('medições ainda não lidas: sem cobertura (nunca inventa 0%) e quem não é base nem trocada fica "lendo"',
     [M0.cobertura, M0.regsLidas, M0.lista.filter(g => g.sit === 'lendo').length, M0.nPrincMed], [null, false, 10, 2]);
  ok('sem as horas: null (a tela diz o estado da leitura)', [_ucvPrincipais('lendo', PP, RGS, ehHE), _ucvPrincipais(null, PP, RGS, ehHE)], [null, null]);
  // o desenho
  const H = _ucvPrincHtml(M, HRS, PP.find(p => p.rot.includes('SLEEP')).chave, false);
  ok('o desenho: a cobertura e quantos faltam no topo, a situação de cada um, a linha clicável e a selecionada',
     [H.includes('<b>33,0%</b> da UEP da janela já vem de volume medido'), H.includes('<b>3 de 11</b> volumes que rodaram estão medidos · classe A (80% da UEP): <b>3 de 7</b><br>A medir: <b>9</b> que rodaram · lendo a programação…'),
      H.includes('FALTA MEDIR'), H.includes('PPCP DECIDE</span><small>a regra diz TROCA para 1,51 — na TRAVA DA UEP'), H.includes('✓ TROCADA</span><small>UEP nova desde 26/10'),
      H.includes('✓ BASE</span><small>cronometrada em 20/10'), H.includes('PPCP DECIDE</span><small>a regra diz FICA — na TRAVA DA UEP'),
      H.includes('onclick="_ucvAbrirPrincipal(0)"'), /<tr class="sel"[^>]*>\s*<td class="n">1<\/td>/.test(H), H.includes('1,71<small>estimada</small>')],
     [true, true, true, true, true, true, true, true, true, true]);
  ok('o sem UEP na agenda diz por que não tem peso; o rodapé conta o código fora do cadastro e aponta a 🖨 da agenda; nada da FILA antiga',
     [H.includes('<td class="n">—</td><td class="ucv-pr">501888 · PRODUTO SEM UEP</td>'), H.includes('<b>—</b><small>70 cx sem UEP no cadastro</small>'), H.includes('—<small>sem UEP</small>'),
      H.includes('30 cx de código fora do cadastro (sem produto para medir)'), H.includes('🖨 IMPRIMIR → AGENDA DA CRONOANÁLISE'), H.includes('FILA DE CRONOANÁLISE'), H.includes('Fora da agenda')],
     [true, true, true, true, true, false, false]);
  ok('o MEDINDO diz o que falta (e quantas não valem)',
     [_ucvPrincSub(Object.assign({ sit:'medindo' }, est('ARMARIO ENCANTO'))), _ucvPrincSub({ sit:'medindo', S:_ucvRegraUep([RG2('501082', 'TOUCADOR MAGIC NEW', 'VOL 1/1', 13.4, 70, 1.58)], 1.58) })],
     ['faltam 2 medições válidas · faltam 100 volumes · 1 não vale', 'falta 1 medição válida · faltam 30 volumes']);
  ok('a classe A toda medida: o resumo diz que pode rever a referência',
     _ucvPrincHtml(Object.assign({}, M, { nPrincMed:7 }), HRS, null, false).includes('classe A (80% da UEP): <b>7 de 7</b> — pode rever a referência'), true);
  ok('estados da leitura das horas: lendo · falhou · .gs sem as horas', [_ucvPrincHtml(null, 'lendo').includes('Lendo a produção'), _ucvPrincHtml(null, 'falhou').includes('não foi lida'),
     _ucvPrincHtml(null, 'sem-endpoint').includes('.gs v5.35')], [true, true, true]);
  const MUITOS = Object.assign({}, M, { lista:Array.from({ length:20 }, () => M.lista[0]) });
  ok('mais de 15 linhas: VER TODOS (e VER MENOS aberto); o título do grupo não conta como linha', [(_ucvPrincHtml(MUITOS, HRS, null, false).match(/onclick="_ucvAbrirPrincipal/g) || []).length, _ucvPrincHtml(MUITOS, HRS, null, false).includes('VER TODOS (20)'),
     (_ucvPrincHtml(MUITOS, HRS, null, true).match(/onclick="_ucvAbrirPrincipal/g) || []).length, _ucvPrincHtml(MUITOS, HRS, null, true).includes('VER MENOS'), (_ucvPrincHtml(MUITOS, HRS, null, true).match(/class="ucv-grp"/g) || []).length], [15, true, 20, true, 1]);
  // a tela: o bloco mora fora do resultado (refeito a cada tecla) e usa as horas, as medições e o cadastro que a aba já tem
  const iC = html.indexOf('<section id="sec-crono"'), SC = html.slice(iC, html.indexOf('</section>', iC)), RP = pegaJs('function _ucvRegPintar(');
  ok('a tela: o bloco entre o registro e as medições; o _ucvRegPintar passa as horas, as medições, o cadastro, a hora extra (_horaEhHE) e a META UEP — nenhuma leitura nova',
     [SC.indexOf('id="uep-conv-princ"') > SC.indexOf('id="uep-conv-reg"') && SC.indexOf('id="uep-conv-princ"') < SC.indexOf('id="uep-conv-regs"'),
      /_ucvPrincipais\(LH, UEP_CONV_PRODS, L, _horaEhHE, R\.base\.meta, PROG_DET_TS \? PROG_DETALHADA : null, _cartNum\(hojeStr\(\)\)\)/.test(RP), /jsonpFetch|action=/.test(pegaJs('function _ucvPrincipais(') + pegaJs('function _ucvPrincHtml('))],
     [true, true, false]);
  // v7.190.0: PESO × SUSPEITA. O NA PRODUÇÃO (o volume sozinho, sem as paradas,
  // contra a MADERO) ordena o que falta medir: fora de 90–110% → sem leitura →
  // confirma; o mais pesado primeiro em cada grupo.
  const HQ = (data, hora, cods) => ({ data, hora, min:60, cods, par:{} });
  const HRS2 = [HQ('27/10/2026', '07:00', { 501149001:288 }), HQ('27/10/2026', '08:00', { 501149001:288 }),               // a base: ~100% do padrão
    HQ('27/10/2026', '09:00', { 501060001:200, 501060002:200 }), HQ('27/10/2026', '10:00', { 501060001:200, 501060002:200 }),
    HQ('27/10/2026', '13:00', { 501060001:200, 501060002:200 }),                                                           // MEL: os volumes sempre juntos → sem leitura
    HQ('28/10/2026', '07:00', { 501082001:140 }), HQ('28/10/2026', '08:00', { 501082001:140 }),
    HQ('28/10/2026', '09:00', { 501082001:140 }), HQ('28/10/2026', '10:00', { 501082001:140 }),                            // TOUCADOR: 4 h a 76,8% → fora
    HQ('29/10/2026', '07:00', { 501094001:347 }), HQ('29/10/2026', '08:00', { 501094001:347 })];                          // SLEEP: 2 h a 100% → confirma
  const M2 = _ucvPrincipais(HRS2, PP, [], () => false, 2530);
  ok('a ordem do que falta medir: a produção FORA de 90–110% primeiro (TOUCADOR, 3º em UEP), depois SEM LEITURA (MEL, o mais pesado), por último o que CONFIRMA (SLEEP)',
     M2.lista.filter(g => !g.medido).map(g => [g.rank, g.p.rot.replace(/^\d+ · /, ''), g.prod]),
     [[3, 'TOUCADOR MAGIC NEW', 'fora'], [1, 'PENTEADEIRA CAMARIM MEL · VOL 1/2', 'sem'], [2, 'PENTEADEIRA CAMARIM MEL · VOL 2/2', 'sem'], [4, 'MESA CABECEIRA SLEEP', 'confirma']]);
  const tq = M2.lista.find(g => g.p.rot.includes('TOUCADOR')), sq = M2.lista.find(g => g.p.rot.includes('SLEEP'));
  ok('o NA PRODUÇÃO é a régua do cartão: a UEP do cadastro, sem as paradas, contra a base nas mesmas condições',
     [fmtP(tq.pad.rel), tq.pad.minRod, fmtP(sq.pad.rel), M2.nFora, M2.semBase], ['76,8%', 240, '100,0%', 1, false]);
  const H2 = _ucvPrincHtml(M2, HRS2, null, false);
  ok('o desenho: a coluna NA PRODUÇÃO (a célula da lista de medições), o fora em destaque e o resumo diz quantos medir primeiro',
     [/<th class="n" title="[^"]*">NA PRODUÇÃO<\/th><th>ANÁLISE DE TEMPO<\/th>/.test(H2), H2.includes('<td class="n ucv-pf">76,8%'),
      H2.includes('<b>1</b> com a produção fora de 90–110%'), H2.includes('não substitui a cronoanálise'), H2.includes('o volume não rodou sozinho')],
     [true, true, true, true, true]);
  const M3 = _ucvPrincipais(HRS2.slice(2), PP, [], () => false, 2530);
  ok('sem a base na janela: ninguém é julgado (todos sem leitura, ordem pelo peso) e o rodapé diz por quê',
     [M3.semBase, M3.nFora, M3.lista.every(g => g.prod === 'sem'), _ucvPrincHtml(M3, HRS2, null, false).includes('não rodou sozinha na janela: sem referência')], [true, 0, true, true]);
  // v7.191.0: NA PROGRAMAÇÃO. A cronoanálise só acontece com o produto na
  // linha: a ordem do que falta medir é a da programação (hoje/atraso → data;
  // no mesmo dia, o mais pesado); o não programado vai para o fim, na ordem do
  // NA PRODUÇÃO. Hoje = 30/10/2026 (sexta).
  const PG = (data, codigo, qtde, extra) => Object.assign({ data, dataNum:_cartNum(data), codigo, qtde, falta:0, adiantado:0 }, extra || {});
  const HOJE = 20261030;
  const PROG = [
    PG('27/10/2026', '501094001', 100, { falta:120 }), PG('28/10/2026', '501094001', 100, { falta:120 }),   // SLEEP: o falta é do CÓDIGO — conta uma vez
    PG('09/11/2026', '501094001', 1000), PG('09/11/2026', '501094001', 1200),
    PG('05/11/2026', '501060001', 350, { adiantado:50 }),                                                    // MEL VOL 1/2: 300 em aberto
    PG('05/11/2026', '501.060.002', 350), PG('11/11/2026', '501.060.002', 400),                              // MEL VOL 2/2, código com ponto
    PG('29/10/2026', '501082001', 60, { falta:50, encerrada:true }), PG('03/11/2026', '501082001', 200, { foraEsteira:true }),   // TOUCADOR: nada que passe na linha
    PG('12/11/2026', '501777001', 999)];                                                                     // a programação vai até 12/11 (código fora dos principais)
  ok('_ucvProgDe: atraso pelo falta do CÓDIGO (uma vez), data futura = qtde − adiantado por linha somada no dia, dia da semana, as datas depois',
     [_ucvProgDe(['501094001'], PROG, HOJE), _ucvProgDe(['501060001'], PROG, HOJE), _ucvProgDe(['501060002'], PROG, HOJE)],
     [{ agora:true, hoje:false, cx:120, depois:1 }, { agora:false, dn:20261105, data:'05/11', dow:'qui', cx:300, depois:0 },
      { agora:false, dn:20261105, data:'05/11', dow:'qui', cx:350, depois:1 }]);
  ok('_ucvProgDe: hoje com falta → HOJE; hoje já feito (falta 0) → a próxima data; vencida ENCERRADA e fora da esteira não contam; sem nada → null',
     [_ucvProgDe(['501094001'], PROG.concat([PG('30/10/2026', '501094001', 200, { falta:120 })]), HOJE),
      _ucvProgDe(['501060001'], PROG.concat([PG('30/10/2026', '501060001', 200, { falta:0 })]), HOJE).data,
      _ucvProgDe(['501082001'], PROG, HOJE), _ucvProgDe(['501139001'], [], HOJE)],
     [{ agora:true, hoje:true, cx:120, depois:1 }, '05/11', null, null]);
  const M4 = _ucvPrincipais(HRS2, PP, [], () => false, 2530, PROG, HOJE);
  ok('a ordem com a programação: o atraso primeiro (SLEEP, a que a produção confirma), depois 05/11 com o mais pesado no topo (MEL 1/2, MEL 2/2); o não programado no fim mesmo FORA de 90–110% (TOUCADOR)',
     M4.lista.filter(g => !g.medido).map(g => [g.rank, g.p.rot.replace(/^\d+ · /, ''), g.prog ? (g.prog.agora ? 'agora' : g.prog.data) : '—']),
     [[4, 'MESA CABECEIRA SLEEP', 'agora'], [1, 'PENTEADEIRA CAMARIM MEL · VOL 1/2', '05/11'], [2, 'PENTEADEIRA CAMARIM MEL · VOL 2/2', '05/11'], [3, 'TOUCADOR MAGIC NEW', '—']]);
  ok('o resumo da programação: quantos que faltam estão nela, quantos hoje ou em atraso, até quando ela vai (fora da esteira não conta)',
     [M4.progLida, M4.nProg, M4.nAgora, M4.progAte, M2.progLida], [true, 3, 1, '12/11', false]);
  const H4 = _ucvPrincHtml(M4, HRS2, null, false, 'lendo');
  ok('o desenho: a coluna NA PROGRAMAÇÃO depois do produto; EM ATRASO/HOJE em destaque com as caixas; a data com o dia da semana; o não programado diz até quando a programação vai',
     [/<th>PRODUTO · VOLUME<\/th><th title="[^"]*">NA PROGRAMAÇÃO<\/th><th class="n"[^>]*>UEP NA JANELA/.test(H4),
      H4.includes('<td class="ucv-pg"><b class="ucv-ph">EM ATRASO</b><small>120 cx em aberto · +1 data</small></td>'),
      H4.includes('<td class="ucv-pg"><b>05/11</b> qui<small>300 cx</small></td>'), H4.includes('<b>05/11</b> qui<small>350 cx · +1 data</small>'),
      H4.includes('<span title="Não está na programação (vai até 12/11)">—</span>'),
      H4.includes('A medir: <b>3</b> na programação até 12/11 (<b>1</b> hoje ou em atraso) · <b>1</b> rodou e não está programado'), H4.includes('(medir primeiro)')],
     [true, true, true, true, true, true, false]);
  ok('programação ainda não lida: a célula "…", o resumo diz que está lendo; falhou: "—" e a ordem é a do NA PRODUÇÃO',
     [_ucvPrincHtml(M2, HRS2, null, false, 'lendo').includes('<span title="Lendo a programação">…</span>'), _ucvPrincHtml(M2, HRS2, null, false, 'lendo').includes(' · lendo a programação…'),
      _ucvPrincHtml(M2, HRS2, null, false, 'falhou').includes(' · a programação não foi lida — a ordem é a do NA PRODUÇÃO'),
      _ucvPrincHtml(M2, HRS2, null, false, 'falhou').includes('title="A programação não foi lida — a ordem é a do NA PRODUÇÃO">—</span>')],
     [true, true, true, true]);
  ok('nada a medir: o resumo diz isso e não fala da programação',
     [_ucvPrincHtml(Object.assign({}, M4, { nPend:0 }), HRS2, null, false, 'lendo').includes('<br>Nada a medir.'), _ucvPrincHtml(Object.assign({}, M4, { nPend:0 }), HRS2, null, false, 'lendo').includes('na programação até')], [true, false]);
  // v7.216.0 (PPCP: "precisamos listar os produtos que falta coletar tempos"): a agenda tem também o volume do
  // cadastro que NÃO rodou na janela mas está programado (sem peso: depois dos que rodaram no mesmo dia, pelas
  // caixas); o que nem rodou nem está programado (e não é a base) só é contado
  const PROG5 = PROG.concat([PG('05/11/2026', '501139001', 80), PG('06/11/2026', '501114004', 40, { adiantado:10 })]);
  const M5 = _ucvPrincipais(HRS2, PP, [], () => false, 2530, PROG5, HOJE);
  ok('a agenda com o volume que não rodou: no dia dele, depois dos que rodaram (ARMARIO 05/11 depois das MEL), SIRIUS 06/11; sem posição, "não rodou"',
     M5.lista.filter(g => !g.medido).map(g => [g.rank, g.p.rot.replace(/^\d+ · /, ''), g.prog ? (g.prog.agora ? 'agora' : g.prog.data) : '—', g.grupo, !!g.semProd]),
     [[4, 'MESA CABECEIRA SLEEP', 'agora', 'prog', false], [1, 'PENTEADEIRA CAMARIM MEL · VOL 1/2', '05/11', 'prog', false], [2, 'PENTEADEIRA CAMARIM MEL · VOL 2/2', '05/11', 'prog', false],
      [null, 'ARMARIO ENCANTO', '05/11', 'prog', true], [null, 'PAINEL SIRIUS 1.4', '06/11', 'prog', true], [3, 'TOUCADOR MAGIC NEW', '—', 'rodou', false]]);
  const vols = PP.filter(p => p.volSel || p.nVol === 1).length;
  ok('as contagens: 5 na programação (2 sem rodar), 1 rodou e não está programado; fora da agenda = os volumes do cadastro que nem rodaram nem estão programados',
     [M5.nProg, M5.nSemProd, M5.nRodou, M5.nAgora, M5.nSemNada, vols - 5 - 2], [5, 2, 1, 1, vols - 7, vols - 7]);
  const ar = M5.lista.find(g => /ARMARIO/.test(g.p.rot));
  ok('o volume que não rodou: sem caixas nem dias nem NA PRODUÇÃO; a UEP/cx do cadastro', [ar.cx, ar.nDias, ar.pad, ar.prod, _ucvU2(ar.uepCx), ar.sit], [0, 0, null, 'sem', '2,23', 'falta']);
  const H5 = _ucvPrincHtml(M5, HRS2, null, true, '');
  ok('o desenho da agenda: um título por grupo (com quantos e o que fazer), o volume que não rodou sem peso, o fora da agenda no rodapé',
     [H5.includes('<tr class="ucv-grp"><td colspan="9"><b>NA PROGRAMAÇÃO</b> · 5 — medir quando rodar'), H5.includes('<b>RODOU NOS ÚLTIMOS 30 DIAS, FORA DA PROGRAMAÇÃO</b> · 1'),
      H5.includes('<b>JÁ MEDIDOS</b> · 1'), (H5.match(/class="ucv-grp"/g) || []).length, H5.includes('<b>—</b><small>não rodou em 30 dias</small>'),
      H5.includes(', 2 deles sem rodar nos últimos 30 dias'), H5.includes('Fora da agenda: ' + plural(vols - 7, 'volume do cadastro', 'volumes do cadastro'))],
     [true, true, true, 3, true, true, true]);
  // a 🖨 AGENDA DA CRONOANÁLISE: a MESMA lista (UCV_PRINC_M), só o que falta medir, com a coluna para anotar
  const DOC = _ucvAgendaDocHtml(M5, { data:'30/10/2026', hora:'15:00' });
  ok('a 🖨 da agenda: o resumo, os grupos, só o que falta medir (a base medida não entra), a coluna MEDIDO EM / POR, o rodapé',
     [DOC.includes('<b>NA PROGRAMAÇÃO</b> · 5'), DOC.includes('<b>RODOU NOS ÚLTIMOS 30 DIAS, FORA DA PROGRAMAÇÃO</b> · 1'), DOC.includes('JÁ MEDIDOS'), DOC.includes('MADERO'),
      DOC.includes('<th>MEDIDO EM / POR</th>'), (DOC.match(/<td class="ag-anota"><\/td>/g) || []).length, DOC.includes('<td class="ag-ph"><b>EM ATRASO</b>'),
      DOC.includes('<b>06/11</b> sex<small>30 cx</small>'), DOC.includes('AGENDA DA CRONOANÁLISE</span><span>retrato de 30/10/2026 às 15:00')],
     [true, true, false, false, true, 6, true, true, true]);
  const GF = pegaJs('async function gerarRelatorioFilaCrono('), RP2 = pegaJs('function _ucvRegPintar(');
  ok('a ligação da 🖨: a janela abre no clique, abre a ⏱ CRONOANÁLISE no O QUE MEDIR e espera a MESMA agenda da tela (UCV_PRINC_M) — nenhuma leitura própria',
     [GF.indexOf('window.open(') < GF.indexOf('await '), /setTab\('crono'\)/.test(GF), /_ucvSub\('princ'\)/.test(GF), /const M = UCV_PRINC_M;/.test(GF), /_ucvAgendaDocHtml\(M, ctx\)/.test(GF),
      /jsonpFetch|action=|_capBuscar|_filaAmostra/.test(GF), /UCV_PRINC = M \? M\.lista : \[\]; UCV_PRINC_M = M;/.test(RP2)],
     [true, true, true, true, true, false, true]);
  ok('os dois menus 🖨 (⚖ UEP e ⏱ CRONOANÁLISE) chamam a agenda pelo mesmo nome de antes',
     [(html.match(/gerarRelatorioFilaCrono\(\)" title="A mesma lista da sub-aba O QUE MEDIR[^"]*">🖨 AGENDA DA CRONOANÁLISE<small>o que falta medir, na ordem da programação<\/small>/g) || []).length, />🖨 FILA DE CRONOANÁLISE</.test(html)], [2, false]);
  const PC = pegaJs('function _ucvProgCarregar(');
  ok('a leitura: a MESMA do PRÓXIMOS DIAS (carregarProgramacaoDetalhada, voo compartilhado), renovada a cada GPX_TTL, depois das horas, 1 min de espera na falha — nenhuma chamada própria',
     [/carregarProgramacaoDetalhada\(\)/.test(PC), /PROG_DET_TS && Date\.now\(\) - PROG_DET_TS < GPX_TTL/.test(PC), /await UCV_LINHA_VOO/.test(PC), /UCV_PROG_TENT < 60000/.test(PC), /jsonpFetch|action=/.test(PC)],
     [true, true, true, true, false]);
}

// ════════════════════════════════════════════════════════════════════════════
// 📄 IMPORTAR O PDF DA CRONOANÁLISE (v7.158.0, PPCP 26/10/2026: "segue modelo" →
// "importar para não ter que digitar nada"). O texto abaixo é o que o pdf.js
// 3.11.174 tira do PDF real "Takt Time — Painel Sirius 1.4 · EMBALAGEM 01 ·
// 26/10/2026 10:22" (app de cronoanálise, RitmoPatrimar v2.93.1), item a item.
// ONDE O TEMPO VAI (v7.194.0, PPCP 03/11/2026: "com esses estudos o que dá pra
// mostrar em KPI onde perde onde ganha?" → prévia com os estudos reais → "pode
// subir na aba cronoanálise"). Por caixa: o estudo (sem as lacunas, rodando)
// contra a produção nas horas em que o volume rodou SOZINHO (o _ucvPadraoDe do NA
// PRODUÇÃO, com as paradas apontadas) e a meta. Nenhuma leitura nova.
console.log('\n── CRONOANÁLISE → UEP: onde o tempo vai ──');
{
  eval.call(global, 'global.UCV_TEMPO_GANHA_PCT = ' + pegaConst('UCV_TEMPO_GANHA_PCT') + '; global.UCV_TEMPO_TOP = ' + pegaConst('UCV_TEMPO_TOP')
    + '; global.UCV_TEMPO_SEG = ' + pegaConst('UCV_TEMPO_SEG') + ';');
  ['function _ucvTempoMontar(', 'function _ucvTempoSeg(', 'function _ucvTempoHtml('].forEach(f => eval.call(global, pegaJs(f)));
  const H = (data, hora, cods, par) => ({ data, hora, min:60, cods, par:par || {} });
  const HRS = [H('20/10/2026', '08:00', { 501149001:360 }, { 'Troca de produto':6 }),        // MADERO sozinha
    H('20/10/2026', '09:00', { 501139001:100, 501139002:50 }),                                // ENCANTO sozinho (duas cores)
    H('20/10/2026', '10:00', { 501139001:60, 501149001:100 }),                                // dividida: conta nas caixas, fora do tempo
    H('21/10/2026', '07:00', { 501059002:120 }, { Outros:12 }),                               // STRASS VOL 2/2 sozinho
    H('21/10/2026', '08:00', { 501059001:100, 501059002:100 }),                               // STRASS os dois volumes (só o JOGO)
    H('22/10/2026', '08:00', { 501149001:360 }), H('22/10/2026', '09:00', { 501149001:360 })];
  const RG = (modelo, produto, volume, sRod, sLac, volumes) => ({ modelo, produto, volume, sRod, sLac, volumes });
  const REGS = [RG('501149', 'MESA CABECEIRA MADERO', 'VOL 1/1', 7.9, 6.7, 60),
    RG('501139', 'ARMARIO ENCANTO', 'VOL 1/1', 18, 18, 20), RG('501139', 'ARMARIO ENCANTO', 'VOL 1/1', 20, '', 20),
    RG('501139', 'ARMARIO ENCANTO', 'VOL 1/1', 99, 99, ''),                                  // sem VOLUMES MEDIDOS: não pesa
    RG('501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', 12, 12, 50), RG('501059', 'PENTEADEIRA CAMARIM STRASS', 'JOGO 2 VOL', 13, 13, 40),
    RG('501094', 'MESA CABECEIRA SLEEP', 'VOL 1/1', 7.9, 7.9, 30),                           // não rodou sozinha
    RG('501136', 'LIVREIRO ENCANTO', 'VOL 1/1', 15, 15, ''),                                 // só medição sem volumes: fora
    RG('501888', 'PRODUTO SUMIDO', 'VOL 1/1', 10, 10, 30)];                                  // fora do cadastro
  const T = _ucvTempoMontar(REGS, PRODS, HRS, 2530), sU = 527 * 60 / 2530;
  const lin = n => T.linhas.find(l => l.rot === n), r2 = x => x == null ? null : Math.round(x * 100) / 100;
  const M = lin('501149 · MESA CABECEIRA MADERO'), E = lin('501139 · ARMARIO ENCANTO');
  const V2 = lin('501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2'), J = lin('501059 · PENTEADEIRA CAMARIM STRASS');
  const uJ = _uepConvCadastro(J.p).volCad;
  ok('MADERO: puro pelo fluxo, produção só nas 3 horas sozinha (a dividida fica fora), paradas à parte, meta pela UEP do cadastro',
     [r2(M.sRod), r2(M.fluxo), r2(M.puro), M.cx, r2(M.real), r2(M.realSem), r2(M.parS), r2(M.gapS), r2(M.gapPct), r2(M.metaS), r2(M.folgaS), r2(M.hGap), M.curta],
     [7.9, r2(6.7 / 7.9), 6.7, 1180, 10, r2(174 * 60 / 1080), r2(6 * 60 / 1080), r2(174 * 60 / 1080 - 7.9), r2((174 * 60 / 1080 / 7.9 - 1) * 100), r2(sU), r2(sU - 10), r2((174 * 60 / 1080 - 7.9) * 1180 / 3600), false]);
  ok('ENCANTO: rodando pesado pelos volumes (a sem volumes não pesa), fluxo só das medições com lacunas, 1 h sozinho = amostra curta',
     [r2(E.sRod), r2(E.fluxo), r2(E.puro), E.nVol, E.cx, r2(E.real), r2(E.gapS), E.curta], [19, 1, 19, 40, 210, 24, 5, true]);
  ok('o VOL 2/2 só conta a hora em que rodou sozinho; o JOGO conta as horas com qualquer volume dele; o volume dentro do JOGO sai dos totais',
     [r2(V2.real), r2(V2.realSem), V2.dentro, r2(J.real), r2(J.realSem), J.cx, J.dentro], [30, 24, true, 22.5, 20.25, 320, false]);
  ok('sem hora sozinho: tudo da produção vazio (nunca 0) e amostra curta; medição sem volumes e produto fora do cadastro não viram linha',
     [lin('501094 · MESA CABECEIRA SLEEP').real, lin('501094 · MESA CABECEIRA SLEEP').hGap, lin('501094 · MESA CABECEIRA SLEEP').curta,
      !!lin('501136 · LIVREIRO ENCANTO'), T.tot.foraCad, T.linhas.length], [null, null, true, false, 1, 5]);
  ok('ordem: horas a mais que o estudo, do maior para o menor; sem produção no fim',
     T.linhas.map(l => l.rot.replace(/^\d+ · /, '')), ['PENTEADEIRA CAMARIM STRASS · VOL 2/2', 'PENTEADEIRA CAMARIM STRASS', 'MESA CABECEIRA MADERO', 'ARMARIO ENCANTO', 'MESA CABECEIRA SLEEP']);
  const realSemCx = 174 * 60 / 1080 * 1180 + 24 * 210 + 20.25 * 320, rodCx = 7.9 * 1180 + 19 * 210 + 13 * 320;
  ok('totais sem o volume dentro do JOGO: diferença pesada pelas caixas, horas, paradas no tempo, fluxo pelos volumes, cobertura',
     [r2(T.tot.gapPct), r2(T.tot.hGap), r2(T.tot.parPct), r2(T.tot.fluxo), T.tot.fluxoMin.rot, T.tot.nJulg, T.tot.n, T.tot.cxTotal, T.tot.cxEst, r2(T.tot.cobertura)],
     [r2((realSemCx / rodCx - 1) * 100), r2(M.hGap + E.hGap + J.hGap), r2(18 / 360 * 100), r2((6.7 / 7.9 * 60 + 40 + 40 + 30) / 170 * 100), 'MESA CABECEIRA MADERO', 1, 5, 1710, 1710, 100]);
  const wU = 1180 * 1 + 210 * E.uep + 320 * uJ;
  ok('a cascata da LINHA em s por UEP (pesada pela UEP feita) e o maior pedaço',
     [r2(T.casc.puro), r2(T.casc.rod), r2(T.casc.real), r2(T.casc.meta), T.casc.maior, r2(T.casc.falta)],
     [r2((6.7 * 1180 + 19 * 210 + 13 * 320) / wU), r2(rodCx / wU), r2((10 * 1180 + 24 * 210 + 22.5 * 320) / wU), r2(sU), 'dif', r2((10 * 1180 + 24 * 210 + 22.5 * 320) / wU - sU)]);
  ok('ONDE GANHA: até 20% acima do estudo ou folga contra a meta; com a meta apertada ninguém ganha',
     [T.ganha.map(l => l.p.nome), _ucvTempoMontar(REGS, PRODS, HRS, 6000).ganha.length], [['MESA CABECEIRA MADERO', 'ARMARIO ENCANTO', 'PENTEADEIRA CAMARIM STRASS'], 0]);
  ok('sem as horas da produção: null (o desenho diz o estado); sem as medições: nenhuma linha e regsLidas falso',
     [_ucvTempoMontar(REGS, PRODS, 'lendo', 2530), _ucvTempoMontar(null, PRODS, HRS, 2530).regsLidas, _ucvTempoMontar(null, PRODS, HRS, 2530).linhas.length], [null, false, 0]);
  const HT = _ucvTempoHtml(T, HRS, '501149|MESA CABECEIRA MADERO', false);
  ok('o desenho: título, os quatro cartões, a cascata, a tabela com as marcas e o ONDE GANHA',
     ['ONDE O TEMPO VAI', 'DIFERENÇA ESTUDO × PRODUÇÃO', 'PARADAS APONTADAS', 'FLUXO NO ESTUDO', 'COBERTURA', 'A CASCATA DA LINHA', 'ONDE PERDE, VOLUME A VOLUME',
      '>DENTRO DO JOGO<', '>AMOSTRA CURTA<', '>BASE<', 'não rodou sozinho', 'ONDE GANHA', 'ⓘ COMO LER', `+${Math.round(T.tot.gapPct)}<small>%</small>`, 'O maior pedaço é <b>a diferença entre o estudo e a produção</b>']
       .filter(t => !HT.includes(t)), []);
  const celPr = [...HT.matchAll(/<td class="ucv-pr">([\s\S]*?)<\/td>/g)].map(m => m[1]), celOb = [...HT.matchAll(/<td class="ucv-tp-ob">([\s\S]*?)<\/td>/g)].map(m => m[1]);
  ok('v7.194.1: as marcas moram na coluna OBS., nunca coladas no nome (cada nome tem um comprimento e a marca andava)',
     [/<th>VOLUME<\/th>\s*<th[^>]*>OBS\.<\/th>/.test(HT.replace(/`\s*\+\s*`/g, '')), celOb.length === celPr.length && celOb.length === T.linhas.length,
      celPr.some(c => /ucv-chip|ucv-pill/.test(c)), celOb.filter(c => /BASE|DENTRO DO JOGO|AMOSTRA CURTA/.test(c)).length],
     [true, true, false, T.linhas.filter(l => l.base || l.dentro || l.curta).length]);
  const hBar = [...HT.matchAll(/<span class="ucv-tp-h">[^<]* h<i><span class="g?" style="width:(\d+)%"><\/span><\/i><\/span>/g)].map(m => +m[1]);
  const pele = (src, sel) => src.includes(sel + ' i{display:inline-block;flex:0 0 ');
  ok('v7.195.1: a barra das HORAS A MAIS mora num trilho de largura fixa (em %), e o % da DIFERENÇA tem largura mínima: os números não andam',
     [hBar.length, Math.max(...hBar), Math.min(...hBar) >= 3, pele(html, '#uep-conv-tempo .ucv-tp-h'), pele(pegaConst('_UCV_TEMPO_SKIN'), '.ucv-tempo .ucv-tp-h'),
      /#uep-conv-tempo \.ucv-tp-tab td \.ucv-tp-pc\{display:inline-block;min-width:/.test(html), /\.ucv-tempo \.ucv-tp-pc\{display:inline-block;min-width:/.test(pegaConst('_UCV_TEMPO_SKIN'))],
     [T.linhas.filter(l => l.hGap != null).length, 100, true, true, true, true, true]);
  ok('v7.195.2: o nome diz que só saem as paradas APONTADAS (as microparadas não apontadas ficam dentro), na coluna e na cascata',
     [HT.includes('>PRODUÇÃO SEM<br>PARADAS APONTADAS</th>'), />PRODUÇÃO<br>SEM PARADAS</.test(HT), / s sem as paradas apontadas</.test(HT), / s sem as paradas</.test(HT)],
     [true, false, true, false]);
  const celPm = [...HT.slice(HT.indexOf('ONDE PERDE, VOLUME A VOLUME')).matchAll(/<span class="ucv-tp-pm( ucv-tp-(folga|falta))?">([^<]*)(?:<small>([^<]*)<\/small>)?<\/span>/g)]
    .map(m => [m[2] || '', m[3], m[4] || '']);
  const espPm = T.linhas.filter(l => l.folgaS != null).map(l => Math.abs(l.folgaS) < 0.05 ? ['', '= meta', '']
    : [l.folgaS >= 0 ? 'folga' : 'falta', Math.abs(l.folgaS).toFixed(1).replace('.', ',') + ' s', l.folgaS >= 0 ? 'mais rápida' : 'mais lenta']);
  const HG = _ucvTempoHtml(_ucvTempoMontar(REGS, PRODS, HRS, 1500), HRS, null, false);
  ok('v7.195.3: produção real × meta em PALAVRAS (mais rápida = cabe, mais lenta = passa), nunca o sinal; o ONDE GANHA e o COMO LER dizem o mesmo',
     [celPm, espPm.some(e => e[2] === 'mais rápida'), espPm.some(e => e[2] === 'mais lenta'), HT.includes('>PRODUÇÃO REAL<br>× META</th>'), /FOLGA \(\+\)|FALTA \(−\)/.test(HT),
      /s\/cx mais (rápida|lenta) que a meta/.test(HG), /· (folga|falta) \d/.test(HG), /<b>Produção real × meta<\/b>/.test(HT),
      /\.ucv-tempo \.ucv-tp-pm small\{display:block/.test(pegaConst('_UCV_TEMPO_SKIN')), /#uep-conv-tempo \.ucv-tp-tab td \.ucv-tp-pm small\{display:block/.test(html)],
     [espPm, true, true, true, false, true, false, true, true, true]);
  ok('a linha abre o volume no conversor; o selecionado fica marcado; a tabela inteira fica recolhida (v7.196.0)',
     [/onclick="_ucvAbrirTempo\(0\)"/.test(HT), /<tr class="sel"[^>]*onclick="_ucvAbrirTempo\(2\)"/.test(HT), /<details class="ucv-tp-todos" ontoggle="_ucvTempoTodos\(this\.open\)"><summary>VER TODOS OS VOLUMES \(5\)/.test(HT),
      /<details class="ucv-tp-todos" open/.test(_ucvTempoHtml(T, HRS, null, true))], [true, true, true, true]);
  ok('os estados: produção não lida, .gs antigo, lendo, medições não lidas, nenhuma medição',
     [/não foi lida/.test(_ucvTempoHtml(null, 'falhou')), /\.gs v5\.36/.test(_ucvTempoHtml(null, 'sem-endpoint')), /Lendo a produção/.test(_ucvTempoHtml(null, 'lendo')),
      /Lendo as medições/.test(_ucvTempoHtml(_ucvTempoMontar(null, PRODS, HRS, 2530), HRS)), /Nenhuma medição registrada/.test(_ucvTempoHtml(_ucvTempoMontar([], PRODS, HRS, 2530), HRS))],
     [true, true, true, true, true]);
  const TH = pegaJs('function _ucvTempoHtml(') + pegaJs('function _ucvTempoSeg('), TM = pegaJs('function _ucvTempoMontar(');
  ok('o desenho não faz conta; a conta não lê nada (as horas, as medições e o cadastro que a aba já tem)',
     [UCV_SEM_CONTA.test(TH), /_ucvPadraoDe\(|_uepConvCadastro\(|_ucvTempoMontar\(|\.reduce\(/.test(TH), /jsonp|action=|getElementById/.test(TM + TH)], [false, false, false]);
  const RPT = pegaJs('function _ucvRegPintar('), iCrT = html.indexOf('<section id="sec-crono"'), SECT = html.slice(iCrT, html.indexOf('</section>', iCrT));
  // v7.207.0 (PPCP 06/11/2026, "A1 E A2"): a aba própria (v7.196.0) virou a 5ª sub-aba da
  // ⏱ CRONOANÁLISE — a MESMA tela, num painel; o caminho (.ucv-sb-ir) virou o botão da sub-aba.
  ok('pintado com os PRINCIPAIS (mesmas horas, medições e cadastro); desde a v7.207.0 no painel "tempo" da ⏱ CRONOANÁLISE, sem aba nem caminho próprios',
     [/_ucvTempoMontar\(L, UEP_CONV_PRODS, LH, R\.base\.meta\)/.test(RPT), /_ucvEl\('tempo'\)/.test(RPT),
      SECT.includes('<div class="ucv-pn" data-sub="tempo"><div id="uep-conv-tempo"></div></div>'), html.includes('id="sec-tempo"'),
      /ucv-sb-ir/.test(SECT), /setTab\('tempo'\)/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), SECT.includes('ucv-tp-ponteiro'),
      /T:TV, app:A \}\)\);/.test(RPT)], [true, true, true, false, false, false, false, true]);
  // v7.196.0 (PPCP: "não achei legal junto com a cronoanálise, parece um excel melhorado"): aba própria, a tela em painel
  ok('v7.196.0 ONDE PERDE MAIS (conta): os de mais horas a mais, sem o volume que o JOGO já conta (a STRASS VOL 2/2), no máximo UCV_TEMPO_TOP; o resto contado',
     [T.top.map(l => l.rot.replace(/^\d+ · /, '')), T.top.every(l => !l.dentro && l.hGap > 0), T.topResto, r2(T.topMax), UCV_TEMPO_TOP],
     [['PENTEADEIRA CAMARIM STRASS', 'MESA CABECEIRA MADERO', 'ARMARIO ENCANTO'], true, 0, r2(J.hGap), 5]);
  const TOP0 = global.UCV_TEMPO_TOP; global.UCV_TEMPO_TOP = 2; const T2 = _ucvTempoMontar(REGS, PRODS, HRS, 2530); global.UCV_TEMPO_TOP = TOP0;
  ok('v7.196.0 com o corte em 2: os 2 primeiros nas barras, o terceiro contado para a tabela', [T2.top.length, T2.topResto, /\+ 1 volume com menos horas a mais/.test(_ucvTempoHtml(T2, HRS, null, false))], [2, 1, true]);
  {
    const iHero = HT.indexOf('ucv-tp-hero'), iCasc = HT.indexOf('A CASCATA DA LINHA'), iPerde = HT.indexOf('ONDE PERDE MAIS'), iGanha = HT.indexOf('ONDE GANHA'),
      iTodos = HT.indexOf('<details class="ucv-tp-todos"'), iLer = HT.indexOf('ⓘ COMO LER');
    const heroH = HT.slice(iHero, HT.indexOf('ucv-tp-rod'));
    const botoes = [...HT.matchAll(/<button type="button" class="ucv-tp-p( sel)?" onclick="_ucvAbrirTempo\((\d+)\)"/g)].map(m => +m[2]);
    const barras = [...HT.matchAll(/<span class="br"><i style="width:(\d+)%"><\/i><\/span>/g)].map(m => +m[1]);
    const qs = [...HT.matchAll(/<span class="q">([\s\S]*?)<\/span><\/button>/g)].map(m => m[1]);
    ok('v7.196.0 a tela é painel: 3 números grandes (diferença, paradas, produção real × meta em palavras), fluxo e cobertura numa linha, a cascata, os que mais perdem em barras, onde ganha, a tabela recolhida e o como ler — nessa ordem',
       [(heroH.match(/class="kpi-card/g) || []).length, /kpi-grid c3 ucv-cards ucv-tp-hero/.test(HT), ['DIFERENÇA ESTUDO × PRODUÇÃO', 'PARADAS APONTADAS', 'PRODUÇÃO REAL × META'].every(t => heroH.includes(t)),
        heroH.includes(`% ${T.casc.falta > 0 ? 'mais lenta' : 'mais rápida'}</small>`), /FLUXO NO ESTUDO <b>/.test(HT) && /COBERTURA <b>/.test(HT),
        iHero > 0 && iHero < iCasc && iCasc < iPerde && iPerde < iGanha && iGanha < iTodos && iTodos < iLer,
        botoes, Math.max(...barras), barras.length, /<button type="button" class="ucv-tp-p sel" onclick="_ucvAbrirTempo\(2\)"/.test(HT)],
       [3, true, true, true, true, true, T.top.map(l => T.linhas.indexOf(l)), 100, T.top.length, true]);
    ok('v7.196.0 cada barra diz a diferença sobre o estudo e, em palavras, a produção real contra a meta',
       qs.map(q => /^[+−]\d+% sobre o estudo<span class="ucv-tp-pm ucv-tp-(folga|falta)">\d+,\d s<small>mais (rápida|lenta) que a meta<\/small><\/span>$/.test(q)),
       T.top.map(() => true));
    const HP0 = _ucvTempoHtml(T, null, null, true, true);
    ok('v7.196.0 o papel não mudou: os quatro cartões, sem os números grandes, sem as barras, sem nada recolhido',
       [/kpi-grid c4 ucv-cards"/.test(HP0), /ucv-tp-hero|ucv-tp-p"|ucv-tp-rod|<details/.test(HP0)], [true, false]);
  }
  const STT = pegaJs('function setTab(');
  ok('v7.207.0 sem aba própria: o nome antigo abre a sub-aba; as leituras são as da ⏱ CRONOANÁLISE (cadastro → medições → conferência → horas → programação); toda leitura redesenha a aba; o toque abre o volume no MEDIR',
     [/data-tab="tempo"/.test(html), /if\(tab==='tempo'\)\{ setTab\('crono'\); _ucvSub\('tempo'\); return; \}/.test(STT),
      /_ucvLinhaCarregar\(\)\)\.then\(\(\)=>_ucvProgCarregar\(\)\)/.test(STT),
      (html.match(/if\(_ucvAbaOn\(\)\) _uepConvAtualiza\(\);/g) || []).length, /function _ucvAbaOn\(\)\{ return _abaOn\('crono'\); \}/.test(html),
      /_ucvSub\('medir'\);\s*if\(!_abaOn\('crono'\)\) setTab\('crono'\)/.test(pegaJs('function _ucvAbrirTempo('))],
     [false, true, true, 5, true, true]);
  ok('v7.207.0 a pele: o bloco é do #uep-conv-tempo (nenhuma regra .ucv-tp solta no #sec-crono) e as peças comuns seguem com o seletor dele',
     [(html.match(/^#sec-crono \.ucv-tp-/gm) || []).length, /^#uep-conv-tempo\{--ucv-tp-puro:/m.test(html), /#sec-tempo/.test(html),
      ['.ucv-regs{', '.ucv-regs th{', '.ucv-regs td{', '.ucv-chip{', '.uep-conv-tit{', '.ucv-cards .kpi-val{', '.ucv-pill.warn{', '.ucv-regs-t{'].filter(c => !html.includes(',#uep-conv-tempo ' + c))],
     [0, true, false, []]);
  eval.call(global, pegaJs('function _ucvSubMontar('));
  const sbT = o => _ucvSubMontar(Object.assign({ p:null, M:null, L:null, C:null }, o)).tempo.txt;
  ok('v7.207.0 o botão ONDE O TEMPO VAI diz o 1º cartão (diferença e horas), sem cor; sem a conta, o estado — nunca 0',
     [sbT({ T, LH:HRS }), _ucvSubMontar({ T, LH:HRS }).tempo.cls, sbT({ T:null, LH:'lendo' }), sbT({ T:null, LH:'falhou' }), sbT({ T:null, LH:'sem-endpoint' }),
      sbT({ T:_ucvTempoMontar(null, PRODS, HRS, 2530), LH:HRS }), sbT({ T:_ucvTempoMontar([], PRODS, HRS, 2530), LH:HRS }),
      sbT({ T:_ucvTempoMontar(null, PRODS, HRS, 2530), LH:HRS, regsFalha:'falhou' }), sbT({ T:_ucvTempoMontar(null, PRODS, HRS, 2530), LH:HRS, regsFalha:'sem-endpoint' })],
     [`${T.tot.gapPct > 0 ? '+' : '−'}${Math.abs(T.tot.gapPct).toFixed(0)}% sobre o estudo · ≈ ${T.tot.hGap.toFixed(1).replace('.', ',')} h`, '',
      '…', 'a produção não foi lida', 'falta o .gs novo', '…', 'nenhuma medição com volumes', 'medições não lidas', 'falta o .gs novo']);
  // 🖨 IMPRIMIR do bloco (v7.195.0, PPCP: "impressa"): a MESMA marcação no modo papel
  const HTp = _ucvTempoHtml(T, HRS, '501149|MESA CABECEIRA MADERO', false), HP = _ucvTempoHtml(T, null, null, true, true);
  const nTr = h => (h.match(/<tbody>[\s\S]*<\/tbody>/)[0].match(/<tr[ >]/g) || []).length;
  // v7.207.0: o 🖨 saiu do título do bloco para o menu 🖨 IMPRIMIR ▾ da ⏱ CRONOANÁLISE
  ok('na tela: o 🖨 no menu da aba (não no bloco), a tabela inteira dentro do VER TODOS; no papel: sem botão, sem clique, todas as linhas, sem o "toque na linha"',
     [!HTp.includes('gerarRelatorioTempo') && /onclick="_ucvImpFecha\(\);gerarRelatorioTempo\(\)"/.test(html), nTr(HTp), /VER TODOS OS VOLUMES \(5\)/.test(HTp),
      /gerarRelatorioTempo|_ucvAbrirTempo|_ucvTempoTodos|<button/.test(HP), nTr(HP), /toque na linha/.test(HP), /class="sel"/.test(HP)],
     [true, T.linhas.length, true, false, T.linhas.length, false, false]);
  ok('no papel o COMO LER vem aberto (título de seção, não <details>) e sobe para a folha 1: cascata → como ler → tabela → onde ganha',
     [/<details/.test(HP), HP.includes('<div class="ucv-tp-ler"><div class="rp-sec-ttl">COMO LER</div><ul><li><b>Diferença não é perda.</b>'),
      HP.indexOf('A CASCATA DA LINHA') < HP.indexOf('COMO LER') && HP.indexOf('COMO LER') < HP.indexOf('ONDE PERDE, VOLUME A VOLUME') && HP.indexOf('ONDE PERDE') < HP.indexOf('ONDE GANHA'),
      HT.indexOf('ONDE GANHA') < HT.indexOf('ⓘ COMO LER')], [false, true, true, true]);
  const SKT = pegaConst('_UCV_TEMPO_SKIN').replace(/^`|`$/g, '');
  const tokUsados = [...new Set([...(TH.match(/var\(--[\w-]+/g) || []), ...pegaConst('UCV_TEMPO_SEG').match(/'--[\w-]+'/g).map(t => 'var(' + t.slice(1, -1))])].map(t => t.slice(4));
  const tokPele = (SKT.match(/^\.ucv-tempo\{([^}]*)\}/m) || ['', ''])[1];
  ok('a pele do papel: escopada em .ucv-tempo, todo token de cor do desenho redefinido (senão cai no preto), a tabela abre a folha 2, o título repetido some',
     [SKT.split('\n').map(l => l.trim()).filter(Boolean).every(l => l.startsWith('.ucv-tempo')), tokUsados.filter(t => !tokPele.includes(t + ':')),
      /\.ucv-tempo \.ucv-tp-tw\{page-break-before:always\}/.test(SKT), /\.ucv-tempo \.ucv-tp-ler\{page-break-inside:avoid\}/.test(SKT), /\.ucv-tempo \.ucv-tp \.uep-conv-tit\{display:none\}/.test(SKT)],
     [true, [], true, true, true]);
  eval.call(global, pegaJs('function _ucvTempoDocHtml(') + pegaJs('function gerarRelatorioTempo('));
  ok('o desenho do papel não faz conta: o bloco no modo papel + o rodapé',
     [UCV_SEM_CONTA.test(pegaJs('function _ucvTempoDocHtml(')), /_ucvTempoMontar\(|\.reduce\(/.test(pegaJs('function _ucvTempoDocHtml(')),
      _ucvTempoDocHtml(T, { data:'03/11/2026', hora:'13:15' }).startsWith(HP), /onde o tempo vai — estudo × produção × meta<\/span><span>gerado 03\/11\/2026 às 13:15/.test(_ucvTempoDocHtml(T, { data:'03/11/2026', hora:'13:15' }))],
     [false, false, true, true]);
  // o botão, rodando a função real com o navegador de mentira
  const G0 = {}, NOMES = ['window', 'alert', 'hojeStr', 'UCV_TEMPO_M', '_uepConvAtualiza', '_ucvLinhaItens', '_uepPadJanela', '_rpDocParadas', '_rpCabecalho',
    '_rpBotaoImprimir', '_UCV_DOC_SKIN', '_UCV_TEMPO_SKIN', '_rpErroRelatorio'];
  NOMES.forEach(n => { G0[n] = global[n]; });
  const F = { alertas:[], abriu:0, html:'', args:null, atualizou:0 }; let est = 'lendo';
  global.window = Object.assign(global, { open:() => { F.abriu++; return { document:{ open(){}, write(h){ F.html += h; }, close(){} }, close(){} }; } });
  global.alert = t => F.alertas.push(t);
  global.hojeStr = () => '03/11/2026';
  global._uepConvAtualiza = () => { F.atualizou++; };
  global._ucvLinhaItens = () => est;
  global._uepPadJanela = () => ({ de:'04/10/2026', ate:'02/11/2026' });
  global._rpDocParadas = (t, deitado) => { F.args = [t, deitado]; return '<html>'; };
  global._rpCabecalho = (t, m, sb) => `<hdr>${t}${m}${sb}</hdr>`; global._rpBotaoImprimir = () => '';
  global._UCV_DOC_SKIN = ''; global._UCV_TEMPO_SKIN = '';
  global.UCV_TEMPO_M = null; gerarRelatorioTempo();
  est = 'sem-endpoint'; gerarRelatorioTempo();
  global.UCV_TEMPO_M = _ucvTempoMontar(null, PRODS, HRS, 2530); gerarRelatorioTempo();
  global.UCV_TEMPO_M = _ucvTempoMontar([], PRODS, HRS, 2530); gerarRelatorioTempo();
  ok('sem o que imprimir: avisa o estado (lendo, .gs antigo, medições não lidas, nenhuma medição) e NÃO abre janela',
     [F.abriu, F.alertas.length, /sendo lida/.test(F.alertas[0]), /\.gs v5\.36/.test(F.alertas[1]), /medições registradas ainda não foram lidas/.test(F.alertas[2]), /Nenhuma medição registrada/.test(F.alertas[3])],
     [0, 4, true, true, true, true]);
  global.UCV_TEMPO_M = T; gerarRelatorioTempo();
  ok('com o bloco montado: refaz a tela antes, abre UMA janela no clique, deitada, com a janela da produção, as medições e a meta no cabeçalho',
     [F.atualizou, F.abriu, F.args, F.html.includes(`<hdr>ONDE O TEMPO VAI<div class="rp-per">04/10/2026 → 02/11/2026</div><div>${T.linhas.reduce((a, l) => a + l.nMed, 0)} medições · 5 volumes estudados</div><div>meta 2.530 UEP · 12,50 s por UEP · base `),
      F.html.includes('<div class="ucv-doc ucv-tempo">'), F.html.includes(HP.slice(0, 600))],
     [5, 1, ['Onde o tempo vai - 03-11-2026', true], true, true, true]);
  ok('a impressão é síncrona: a janela abre no clique, nenhuma leitura antes', /await |\.then\(/.test(pegaJs('function gerarRelatorioTempo(')), false);
  NOMES.forEach(n => { global[n] = G0[n]; });
  ok('a tela guarda a montagem que mostra (a impressão é o retrato dela)', /UCV_TEMPO_M = TV;/.test(RPT), true);
}
console.log('\n── CRONOANÁLISE → UEP: importar o PDF do Takt Time ──');
{ const TXT = "Takt Time —   Painel Sirius 1.4 · EMBALAGEM 01   RitmoPatrimar v 2.93.1   · emitido em   26/10/2026 \n MEDIÇÃO \n 26/10/2026 10:22 \n PERÍODO \n 10:22–10:40 \n VOLUMES \n 50 \n PARADO (MARCADO) \n 5 min \n No período, saiu um volume a cada 20.7 s, paradas dentro; com a linha rodando, 14.3 s. \n Sem takt para comparar: não há programa de produção do grupo EMBALAGEM cadastrado. \n 1 lacuna — intervalo maior que o dobro do normal (14.0 s) — somou 14.6s além do normal: cerca de 1 volume que deixou de sair. As paradas marcadas no\n cronômetro já estão fora desta conta: estas, ninguém marcou. \n POR VOLUME NO PERÍODO \n 20.7 s \n com as paradas, do 1º ao último toque \n TAKT DA SEMANA \n — \n sem programa para comparar \n POR VOLUME COM A LINHA\n RODANDO \n 14.3 s \n sem as paradas marcadas \n SEM AS LACUNAS \n 14.0 s \n sem parada nenhuma \n LACUNAS \n 1 \n 14.6s além do normal \n Intervalo entre   volumes \n Tempo de cada   volume   até   o seguinte ,   com a linha rodando — as paradas marcadas no cronômetro   fi cam fora \n Intervalo   Lacuna — mais que 2× o normal   Rodando — média dos intervalos \n 0 \n 10 s \n 20 s \n 30 s   28.6   s 28.6 s \n Rodando   14.3 s \n 15 5   10   20   25   30   35   40   45   50 2 \n Volume nº \n Onde a linha parou sem parada marcada \n Volume   nº   Intervalo   Além do normal   O que aconteceu \n 15   28.6 s   14.6 s \n Intervalo = tempo de um volume até o seguinte, com a linha rodando: as paradas marcadas no cronômetro já saíram; as marcadas depois (no resultado do tablet ou aqui no PC) continuam\n dentro dos intervalos. O primeiro toque não tem intervalo: o intervalo vai de um toque ao seguinte, e o tempo antes do primeiro toque não entra. Contra o takt vai o relógio do primeiro ao\n último toque ÷ intervalos, com as paradas dentro (sem o setup marcado entre os toques, quando o grupo tem setup planejado) — a mesma régua do programa da semana. Com a linha rodando\n = soma dos intervalos ÷ quantidade. Lacuna = intervalo maior que 2× o normal — a média dos intervalos que não são lacuna. Leitura a partir de 10 intervalos. Na embalagem, o programa da\n semana é colado em volumes.";
  ['function _ucvPdfLer(', 'function _ucvPdfAchar(', 'function _ucvImportItem(', 'function _ucvImportConfirmaTxt(', 'function _ucvRegUrl('].forEach(f => eval.call(global, pegaJs(f)));
  const L = _ucvPdfLer(TXT);
  ok('o PDF real: produto, grupo, data e hora da medição, volumes e os três cartões (segundos com ponto)',
     L, { produto:'Painel Sirius 1.4', grupo:'EMBALAGEM 01', data:'26/10/2026', hora:'10:22', vol:50, per:20.7, rod:14.3, lac:14, versao:'2.93.1', falta:[] });
  const SO_FRASE = TXT.replace(/POR VOLUME NO PER[IÍ]ODO[\s\S]*?sem parada nenhuma/, '');
  ok('sem os cartões, a frase do resumo é a rede do NO PERÍODO e do RODANDO', [_ucvPdfLer(SO_FRASE).per, _ucvPdfLer(SO_FRASE).rod, _ucvPdfLer(SO_FRASE).lac], [20.7, 14.3, null]);
  ok('PDF que não é o Takt Time: diz o que falta, nunca inventa número',
     [_ucvPdfLer('Relatório qualquer 12 s').falta.length, _ucvPdfLer('Relatório qualquer 12 s').rod], [5, null]);
  ok('sem o cartão SEM AS LACUNAS (v7.200.0: é o tempo da UEP), o PDF não importa — nunca cai no rodando',
     [_ucvPdfLer(SO_FRASE).falta.includes('o POR VOLUME SEM AS LACUNAS'), _ucvPdfLer(SO_FRASE).falta.length], [true, 1]);
  const PRP = _uepConvProdutos([
    { codigo:'501149001', desc:'VOL 1/1 MESA CABECEIRA MADERO', cor:'BRANCO', uep:1, uepVig:'21/10/2026 DIGITADA' },
    { codigo:'501114004', desc:'VOL 1/1 PAINEL SIRIUS 1.4', cor:'OFF WHITE', uep:1.49, uepVig:'16/10/2026', velocidade:9, entrePeca:650 },
    { codigo:'501114005', desc:'VOL 1/1 PAINEL SIRIUS 1.4', cor:'BRANCO ACETINADO', uep:1.49, uepVig:'16/10/2026' },
    { codigo:'501106004', desc:'VOL 1/1 RACK SIRIUS 1.4', cor:'ALECRIM/CINAMOMO', uep:1.68, uepVig:'16/10/2026' }]);
  const EI = { base:6.7, meta:2530, tol:15, linha:'nao-lida', regs:[] };
  const I = _ucvImportItem(Object.assign({ arquivo:'m.pdf' }, L), PRP, EI, '26/10/2026', 'ADRIANO RODRIGUES');
  ok('o PDF vira a MESMA linha do 💾 REGISTRAR: produto do cadastro, data do PDF, os três tempos, volumes e a UEP (v7.200.0: sem as lacunas 14,0 ÷ 6,7)',
     [I.erro, I.D.modelo, I.D.produto, I.D.volume, I.D.data, I.D.sRod, I.D.sPer, I.D.sLac, I.D.volumes, I.D.uep, I.D.uepCad, I.D.quem, I.D.codigos, /^c[0-9a-z]+$/.test(I.D.regId)],
     [undefined, '501114', 'PAINEL SIRIUS 1.4', 'VOL 1/1', '26/10/2026', 14.3, 20.7, 14, 50, 2.09, 1.49, 'ADRIANO RODRIGUES', '501.114.004 501.114.005', true]);
  ok('com a base fora da MADERO medida (digitada, régua da meta), o PDF não registra e diz por quê',
     [/a base tem de ser a MADERO medida \(6,7 s sem as lacunas\)/.test(_ucvImportItem(Object.assign({ arquivo:'m.pdf' }, L), PRP, Object.assign({}, EI, { base:7.9 }), '26/10/2026', '').erro),
      !!_ucvImportItem(Object.assign({ arquivo:'m.pdf' }, L), PRP, Object.assign({}, EI, { base:0 }), '26/10/2026', '').erro], [true, true]);
  // v7.200.0 — o PDF real que levou à régua nova (PPCP, 04/11/2026: "tem que pegar sem as lacunas"). Texto do
  // pdftotext -raw do PDF do app (v2.99.6): os cartões saem rótulo e valor, na ordem do pdf.js.
  const TXTA = "Takt Time — 501088 · HOME ANGEL 1.8 · VOL 2/2 · EMBALAGEM 01 RitmoPatrimar v2.99.6 · emitido em 04/11/2026 \n MEDIÇÃO \n 04/11/2026 07:21 \n PERÍODO \n 07:21–07:41 \n VOLUMES \n 60 \n PARADO (MARCADO) \n — \n DEIXARAM DE SER EMBALADOS \n 13 · teriam saído 73 \n DE ONDE VEIO \n paradas 0 · lacunas 13 \n No período, saiu um volume a cada 20.4 s, paradas dentro; com a linha rodando, 20.4 s. \n Sem takt para comparar: não há programa de produção do grupo EMBALAGEM cadastrado. \n 5 lacunas — intervalo maior que o dobro do normal (16.6 s) — somaram 3min42s além do normal: cerca de 13 volumes que deixaram de sair. As paradas marcadas no cronômetro já estão fora desta conta: estas, ninguém marcou. \n POR VOLUME NO PERÍODO \n 20.4 s \n com as paradas, do 1º ao último toque \n TAKT DA SEMANA \n — \n sem programa para comparar \n POR VOLUME COM A LINHA RODANDO \n 20.4 s \n sem as paradas marcadas \n POR VOLUME SEM AS LACUNAS \n 16.6 s \n o passo da linha: sem parada marcada nem \n lacuna \n LACUNAS \n 5 \n 3min42s além do normal · ≈13 volumes não";
  const LA = _ucvPdfLer(TXTA);
  ok('o PDF da HOME ANGEL 1.8 VOL 2/2 (04/11): 60 volumes, sem parada marcada (período = rodando 20,4), 5 lacunas → sem as lacunas 16,6',
     [LA.produto, LA.data, LA.hora, LA.vol, LA.per, LA.rod, LA.lac, LA.versao, LA.falta], ['501088 · HOME ANGEL 1.8 · VOL 2/2', '04/11/2026', '07:21', 60, 20.4, 20.4, 16.6, '2.99.6', []]);
  const PRA = _uepConvProdutos([{ codigo:'501088001', desc:'VOL 1/2 HOME ANGEL 1.8', cor:'CINAMOMO/OFF WHITE', uep:2.2, uepVig:'16/10/2026' },
    { codigo:'501088002', desc:'VOL 2/2 HOME ANGEL 1.8', cor:'CINAMOMO/OFF WHITE', uep:2.07, uepVig:'16/10/2026' },
    { codigo:'501088004', desc:'VOL 2/2 HOME ANGEL 1.8', cor:'OFF WHITE/CINAMOMO', uep:2.07, uepVig:'16/10/2026' }]);
  const IA = _ucvImportItem(Object.assign({ arquivo:'a.pdf' }, LA), PRA, EI, '04/11/2026', 'ODERLI');
  ok('a HOME ANGEL entra pelo SEM AS LACUNAS: 16,6 ÷ 6,7 = 2,48 (pelo rodando 20,4 ÷ 7,9 dava 2,58, com 3min42s de paradas que ninguém marcou dentro)',
     [IA.erro, IA.D.volume, IA.D.sLac, IA.D.sRod, IA.D.uep, IA.D.uepCad, IA.D.codigos, IA.D.baseS], [undefined, 'VOL 2/2', 16.6, 20.4, 2.48, 2.07, '501.088.002 501.088.004', 6.7]);
  ok('importar o mesmo PDF de novo dá o MESMO REG_ID (não duplica na planilha)',
     _ucvImportItem(Object.assign({ arquivo:'m.pdf' }, L), PRP, EI, '26/10/2026', 'ADRIANO RODRIGUES').D.regId, I.D.regId);
  ok('produto fora do cadastro ou ambíguo: não registra e diz o que fazer',
     [/não está no cadastro/.test(_ucvImportItem(Object.assign({}, L, { produto:'Painel Orion' }), PRP, EI, '26/10/2026', '').erro),
      /2 produtos do cadastro têm "Sirius 1.4"/.test(_ucvImportItem(Object.assign({}, L, { produto:'Sirius 1.4' }), PRP, EI, '26/10/2026', '').erro),
      /não consegui ler o PDF/.test(_ucvImportItem({ arquivo:'x.pdf', erro:'Invalid PDF', falta:[] }, PRP, EI, '26/10/2026', '').erro)], [true, true, true]);
  // v7.159.0 (PPCP: "ajusta importador"): o app de cronoanálise nomeia o estudo
  // como quem o cadastrou — a STRASS do VOL 2/2 vem "Penteadeira strass - caixa 2/2".
  const pa = t => { const a = _ucvPdfAchar(PRODS, t); return a.p ? a.p.rot : (a.motivo || a.n); };
  ok('o nome do app com "caixa 2/2" casa com a linha do VOLUME (a palavra CAMARIM pode faltar)',
     [pa('Penteadeira strass - caixa 2/2'), pa('Penteadeira Strass - caixa 1/2')],
     ['501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2', '501059 · PENTEADEIRA CAMARIM STRASS · VOL 1/2']);
  ok('a marca de volume em outras formas: cx, vol., volume N de N, entre parênteses',
     [pa('PENTEADEIRA STRASS CX 2/2'), pa('Penteadeira Strass (vol. 2/2)'), pa('penteadeira strass volume 2 de 2'), pa('Penteadeira Camarim Strass Vol 2/2')],
     Array(4).fill('501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2'));
  ok('sem a marca, as palavras casam o produto inteiro, em qualquer ordem; um volume só aceita 1/1',
     [pa('Penteadeira strass'), pa('Encanto Armario'), pa('Mesa Cabeceira Madero - caixa 1/1')],
     ['501059 · PENTEADEIRA CAMARIM STRASS', '501139 · ARMARIO ENCANTO', '501149 · MESA CABECEIRA MADERO']);
  ok('volume que o produto não tem NÃO casa (seria a UEP do volume errado) e diz por quê',
     [pa('Penteadeira strass - caixa 3/3'), pa('Armario Encanto - caixa 1/2')],
     ['"Penteadeira strass - caixa 3/3" fala em volume 3/3, e 501059 · PENTEADEIRA CAMARIM STRASS tem 2 volumes no cadastro',
      '"Armario Encanto - caixa 1/2" fala em volume 1/2, e 501139 · ARMARIO ENCANTO tem 1 volume no cadastro']);
  ok('palavra que mais de um produto tem continua ambígua (nunca o 1º da lista); o que já casava não muda',
     [pa('Encanto'), pa('Encanto - caixa 1/1'), _ucvPdfAchar(PRP, 'Painel Sirius 1.4').p.rot, _ucvPdfAchar(PRP, 'Sirius 1.4').n],
     [3, 3, '501114 · PAINEL SIRIUS 1.4', 2]);
  const IS = _ucvImportItem(Object.assign({ arquivo:'s.pdf' }, L, { produto:'Penteadeira strass - caixa 2/2' }), PRODS, EI, '26/10/2026', '');
  ok('o PDF da STRASS caixa 2/2 vira a linha do VOL 2/2 (só os códigos dele); volume que não existe fica de fora com o motivo',
     [IS.erro, IS.D.produto, IS.D.volume, IS.D.codigos, IS.D.uepCad,
      /fala em volume 3\/3, .* — importe este sozinho/.test(_ucvImportItem(Object.assign({}, L, { produto:'Penteadeira strass - caixa 3/3' }), PRODS, EI, '26/10/2026', '').erro)],
     [undefined, 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', '501.059.002', 2.29, true]);
  // v7.199.1 (PPCP 03/11/2026, com o PDF da HOME RIPADO ANTARES 1.8: "não está
  // buscando o correto"): o app v2.99.2 põe o VOLUME no título — "<produto> ·
  // VOL 1/3 · <grupo>". Cortado no 1º "·", o VOL 1/3 ia para o grupo e o painel
  // casava com o produto INTEIRO (3 volumes): 14,3 s de UM volume virava a UEP
  // média do jogo (1,81 contra 2,10, "-13,8%"). O texto é o que o pdf.js 3.11.174
  // tira do PDF real. Cadastro do 501072 como no print do mesmo dia (2,34 + 2,29
  // + 1,67 = 6,30 no jogo, 2,10 por volume).
  const TXT2 = "Takt Time —   HOME RIPADO ANTARES 1.8 · VOL 1/3 · EMBALAGEM 01   RitmoPatrimar v 2.99.2   · emitido em   03/11/2026 \n MEDIÇÃO \n 03/11/2026 13:38 \n PERÍODO \n 13:38–13:50 \n VOLUMES \n 45 \n PARADO (MARCADO) \n 2 min \n ROUBADOS PELAS PARADAS \n 7 · teriam saído 52 \n No período, saiu um volume a cada 16.5 s, paradas dentro; com a linha rodando, 14.3 s. \n Sem takt para comparar: não há programa de produção do grupo EMBALAGEM cadastrado. \n Nenhuma lacuna: nenhum intervalo passou do dobro do normal. \n POR VOLUME NO PERÍODO \n 16.5 s \n com as paradas, do 1º ao último toque \n TAKT DA SEMANA \n — \n sem programa para comparar \n POR VOLUME COM A LINHA RODANDO \n 14.3 s \n sem as paradas marcadas \n SEM AS LACUNAS \n 14.3 s \n sem parada nenhuma \n LACUNAS \n 0 \n nenhum intervalo passou de 2× o normal \n VOLUMES/HORA \n 217 \n na medição inteira, com as paradas \n Intervalo entre   volumes \n Tempo de cada   volume   até   o seguinte ,   com a linha rodando — as paradas marcadas no cronômetro   fi cam fora \n Intervalo   Lacuna — mais que 2× o normal   Rodando — média dos intervalos \n 0 \n 5 s \n 10 s \n 15 s \n 20 s \n Rodando   14.3 s \n 2   4   6   8   10   12   14   16   18   20   22   24   26   28   30   32   34   36   38   40   42   44 \n Volume nº \n Volumes roubados pelas paradas = o que teria saído no mesmo tempo, no passo da linha rodando, menos o que saiu (paradas marcadas, setup incluído). Intervalo = tempo de um volume até o seguinte, com a linha rodando: as paradas marcadas no cronômetro já saíram; as\n marcadas depois (no resultado do tablet ou aqui no PC) continuam dentro dos intervalos. O primeiro toque não tem intervalo: o intervalo vai de um toque ao seguinte, e o tempo antes do primeiro toque não entra. Contra o takt vai o relógio do primeiro ao último toque ÷ intervalos,\n com as paradas dentro (sem o setup marcado entre os toques, quando o grupo tem setup planejado) — a mesma régua do programa da semana. Com a linha rodando = soma dos intervalos ÷ quantidade. Lacuna = intervalo maior que 2× o normal — a média dos intervalos que não\nsão lacuna. Volumes/hora = volumes ÷ tempo da medição inteira, com as paradas dentro: inclui o tempo antes do primeiro toque e depois do último e, com setup planejado, o setup entre os toques, que o por volume no período tira. Leitura a partir de 10 intervalos. Na embalagem, o\n programa da semana é em volumes, e o takt usa as horas dos dias programados.\n";
  const L2 = _ucvPdfLer(TXT2);
  ok('o PDF real da HOME RIPADO ANTARES 1.8 · VOL 1/3: o volume fica com o PRODUTO, o grupo é o último trecho do título',
     L2, { produto:'HOME RIPADO ANTARES 1.8 · VOL 1/3', grupo:'EMBALAGEM 01', data:'03/11/2026', hora:'13:38', vol:45, per:16.5, rod:14.3, lac:14.3, versao:'2.99.2', falta:[] });
  const PRH = _uepConvProdutos(['CINAMOMO', 'CINAMOMO/OFF WHITE', 'IMBUIA/OFF WHITE'].flatMap((cor, i) => [2.34, 2.29, 1.67].map((uep, v) =>
    ({ codigo:'501072' + String(i * 3 + v + 1).padStart(3, '0'), desc:'VOL ' + (v + 1) + '/3 HOME RIPADO ANTARES 1.8', cor, uep, uepVig:'03/11/2026 DIGITADA' }))));
  const IH = _ucvImportItem(Object.assign({ arquivo:'h.pdf' }, L2), PRH, EI, '03/11/2026', '');
  ok('vira a linha do VOL 1/3 (só os códigos dele, cadastro 2,34) — nunca o produto inteiro',
     [IH.erro, IH.R.p.rot, IH.D.volume, IH.D.codigos, IH.D.uepCad, IH.D.uep],
     [undefined, '501072 · HOME RIPADO ANTARES 1.8 · VOL 1/3', 'VOL 1/3', '501.072.001 501.072.004 501.072.007', 2.34, 2.13]);
  const tl = t => { const x = _ucvPdfLer('Takt Time — ' + t + ' RitmoPatrimar v 2.99.2'); return [x.produto, x.grupo]; };
  ok('o título em outras formas: sem volume, sem grupo, volume com hífen (o nome do arquivo), e o grupo nunca é o volume',
     [tl('Painel Sirius 1.4 · EMBALAGEM 01'), tl('HOME RIPADO ANTARES 1.8 · VOL 2/3'), tl('HOME RIPADO ANTARES 1.8'), tl('HOME RIPADO ANTARES 1.8 · VOL 3-3 · EMBALAGEM 01')],
     [['Painel Sirius 1.4', 'EMBALAGEM 01'], ['HOME RIPADO ANTARES 1.8 · VOL 2/3', ''], ['HOME RIPADO ANTARES 1.8', ''], ['HOME RIPADO ANTARES 1.8 · VOL 3-3', 'EMBALAGEM 01']]);
  const ph = t => { const a = _ucvPdfAchar(PRH, t); return a.p ? a.p.rot : (a.motivo || a.n); };
  ok('cada volume do título acha a sua linha (com barra ou hífen); volume que o produto não tem não casa',
     [ph('HOME RIPADO ANTARES 1.8 · VOL 2/3'), ph('HOME RIPADO ANTARES 1.8 · VOL 3-3'), ph('Home Ripado Antares 1.8 - caixa 1/3'), /fala em volume 1\/2/.test(ph('HOME RIPADO ANTARES 1.8 · VOL 1/2'))],
     ['501072 · HOME RIPADO ANTARES 1.8 · VOL 2/3', '501072 · HOME RIPADO ANTARES 1.8 · VOL 3/3', '501072 · HOME RIPADO ANTARES 1.8 · VOL 1/3', true]);
  ok('os dois caminhos do IMPORTAR (um PDF e vários) acham o produto pelo _ucvPdfAchar',
     [(JS.match(/_ucvPdfAchar\(/g) || []).length, /_uepConvAchar\(/.test(pegaJs('async function _ucvImportar(')), /_ucvPdfAchar\(prods, x\.produto\)/.test(pegaJs('function _ucvImportItem('))],
     [3, false, true]);
  ok('a confirmação do lote lista o que entra e o que fica de fora, e que a UEP do cadastro não muda',
     ['Registrar 1 medição lida dos PDFs', '501114 · PAINEL SIRIUS 1.4 · 26/10/2026 · 50 volumes · sem lacunas 14,0 s · UEP 2,09 (cadastro 1,49)', 'Ficam de fora (1)', 'y.pdf: ', 'A UEP do cadastro NÃO muda']
       .filter(t => !_ucvImportConfirmaTxt([I, { x:{ arquivo:'y.pdf' }, erro:'o PDF não tem os VOLUMES' }]).includes(t)), []);
  const iCr3 = html.indexOf('<section id="sec-crono"'), SEC3 = html.slice(iCr3, html.indexOf('</section>', iCr3));
  // v7.216.0 (PPCP: "importa pdf não faz mais sentido?"): a medição chega sozinha do app — o PDF virou contingência, discreto
  ok('o botão 📄 PDF (contingência) no cabeçalho da aba (discreto, não é mais o laranja), o arquivo escondido (vários PDFs) e a mensagem no topo',
     [/<button class="btn btn-ghost" onclick="_ucvEl\('pdf'\)\.click\(\)"[^>]*>📄 PDF \(contingência\)</.test(SEC3), /id="uep-conv-pdf" accept="application\/pdf,\.pdf" multiple/.test(SEC3), /onchange="_ucvImportar\(this\.files\);this\.value=''"/.test(SEC3),
      SEC3.indexOf('id="uep-conv-i-msg"') < SEC3.indexOf('class="uep-card"')], [true, true, true, true]);
  ok('o leitor de PDF é o pdf.js 3.11.174 do cdnjs e só carrega no clique (nada no <head>, nada para a TV)',
     [pegaConst('UCV_PDFJS'), /pdf\.js\/3\.11\.174\/pdf\.min\.js|pdfjs/.test(html.slice(0, html.indexOf('<body'))), /sc\.src = UCV_PDFJS \+ 'pdf\.min\.js'/.test(pegaJs('function _ucvPdfjs('))],
     ["'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/'", false, true]);
  ok('o REGISTRAR e o IMPORTAR montam a URL pelo MESMO _ucvRegUrl', [(JS.match(/_ucvRegUrl\(/g) || []).length, (JS.match(/action=registrarCrono&/g) || []).length], [3, 1]);
  // o fluxo REAL do _ucvImportar, com o PDF de mentira
  eval.call(global, pegaJs('async function _ucvImportar('));
  _assincronos.push(async () => {
    const campos = {}, iMsg = { textContent:'' };
    const F = { chamadas:[], pintou:0, releu:0 };
    global._ucvEl = n => (n === 'i-msg' ? iMsg : (campos[n] = campos[n] || { value:'' }));
    global._ucvPdfTexto = async f => (f.name === 'ruim.pdf' ? 'nada aqui' : TXT);
    global.UEP_CONV_PRODS = PRP; global.UCV_IMPORTANDO = false;
    global._uepConvAtualiza = () => { F.pintou++; };
    global._ucvSub = k => { F.sub = k; };
    global.hojeStr = () => '26/10/2026'; global.confirm = () => true;
    global._ucvLinhaCarregar = async () => {}; global._uepConvEntradas = () => EI;
    global._ucvRegsCarregar = async () => { F.releu++; };
    global.CFG = { sheetsUrl:'https://script.google.com/macros/s/X/exec' };
    global.jsonpEscrita = async url => { F.chamadas.push(url); return { ok:true, registrado:true }; };
    await _ucvImportar([{ name:'Takt_Time_-_Painel_Sirius_1.4.pdf', type:'application/pdf' }]);
    ok('fluxo IMPORTAR (1 PDF): preenche a tela sem digitar nada e NÃO registra sozinho',
       [campos.prod.value, campos.seg.value, campos['r-data'].value, campos['r-per'].value, campos['r-rod'].value, campos['r-vol'].value, F.pintou, F.chamadas.length,
        iMsg.textContent.includes('confira e clique em 💾 REGISTRAR MEDIÇÃO'), iMsg.textContent.includes('sem lacunas 14,0 s (rodando 14,3 s)')],
       ['501114 · PAINEL SIRIUS 1.4', '14', '26/10/2026', '20,7', '14,3', '50', 1, 0, true, true]);
    ok('fluxo IMPORTAR (1 PDF): abre a sub-aba MEDIR (é lá que se confere e registra)', F.sub, 'medir');
    ok('fluxo IMPORTAR (1 PDF): a mensagem diz com que produto do cadastro o nome do app casou', iMsg.textContent.includes('→ 501114 · PAINEL SIRIUS 1.4 — confira'), true);
    await _ucvImportar([{ name:'a.pdf' }, { name:'b.pdf' }, { name:'ruim.pdf' }]);
    ok('fluxo IMPORTAR (vários): uma confirmação, registra os que deram, o ruim fica de fora, relê a lista',
       [F.chamadas.length, F.chamadas.every(u => u.includes('action=registrarCrono&data=26%2F10%2F2026&modelo=501114')), F.releu, /2 medições registradas/.test(iMsg.textContent), /1 fora/.test(iMsg.textContent)],
       [2, true, 1, true, true]);
    await _ucvImportar([{ name:'foto.jpg', type:'image/jpeg' }]);
    ok('fluxo IMPORTAR: arquivo que não é PDF não é lido', [iMsg.textContent.includes('Escolha o PDF'), F.chamadas.length], [true, 2]);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 🖨 ESTUDOS DO DIA (v7.172.0, PPCP 27/10/2026: "subi estudos hoje, colocar
// impressão dos estudos feito no dia")
console.log('\n── 🖨 ESTUDOS DO DIA ──');
{
  global.UCV_DIA_CAMPOS = eval('(' + pegaConst('UCV_DIA_CAMPOS') + ')');
  ['function _ucvDiaMontar(', 'function _ucvDiaDoCampo(', 'function _ucvDiaParaCampo(', 'function _ucvDiaHtml(', 'function gerarRelatorioCronoDia(']
    .forEach(f => eval.call(global, pegaJs(f)));
  let nId = 0;
  // v7.200.0: a UEP da medição sai do SEM AS LACUNAS ÷ 6,7 — o sLac dá a UEP do caso
  const RD = (data, modelo, produto, volume, uep, uepCad, volumes, extra) => Object.assign({ data, modelo, produto, volume, codigos:'', sRod:uep * 7.0, sLac:uep * UEP_BASE_MEDIDA.seg, baseS:7.9,
    volumes, uep, uepCad, base:'MADERO MEDIDA 20/10/2026', quem:'ADRIANO RODRIGUES', regId:'c' + (++nId) }, extra || {});
  const LD = [   // da mais nova para trás, como o getCronoRegistros devolve
    RD('27/10/2026', '501139', 'ARMARIO ENCANTO', 'VOL 1/1', 2.20, 2.23, 60, { codigos:'501.139.001' }),
    RD('27/10/2026', '501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', 1.51, 2.29, 60),
    RD('27/10/2026', '501149', 'MESA CABECEIRA MADERO', 'VOL 1/1', 1, 1, 60),
    RD('27/10/2026', '501777', 'PRODUTO SUMIDO', 'VOL 1/1', 1.6, 1.5, 30),
    RD('27/10/2026', '501139', 'ARMARIO ENCANTO', 'VOL 1/1', 2.25, 2.23, 54, { codigos:'501.139.001' }),
    RD('26/10/2026', '501139', 'ARMARIO ENCANTO', 'VOL 1/1', 2.50, 2.23, 40),   // outro dia: fora da folha, dentro da regra
    RD('25/10/2026', '501136', 'LIVREIRO ENCANTO', 'VOL 1/1', 1.9, 1.87, 60)];
  const TRD = [{ modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', gravado:'27/10/2026 10:40', vig:'27/10/2026', amostra:'2 medições, 113 volumes',
                 codigos:[{ cod:'501059002', uep:1.51, antes:2.29 }], substituida:false },
               { modelo:'501061', produto:'PENTEADEIRA CAMARIM ELOA', volume:'VOL 2/2', gravado:'26/10/2026 12:11', vig:'26/10/2026', amostra:'1 medição, 60 volumes',
                 codigos:[{ cod:'501061002', uep:1.82, antes:2.53 }] }];
  const D = _ucvDiaMontar(LD, '27/10/2026', PRODS, TRD, 'lendo', 2530);
  ok('as medições do dia pela DATA DA MEDIÇÃO, por volume (o produto fora do cadastro também), em ordem de produto',
     [D.n, D.grupos.map(g => [g.rot, g.regs.length, g.outras, !!g.p]), D.nVol, D.ultimo],
     [5, [['501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2', 1, 0, true], ['501139 · ARMARIO ENCANTO', 2, 1, true], ['501149 · MESA CABECEIRA MADERO', 1, 0, true],
          ['501777 · PRODUTO SUMIDO', 1, 0, false]], 264, '27/10/2026']);
  ok('a coluna TROCA pela MESMA conta da lista; os contadores do dia saem dela',
     [D.grupos.map(g => g.sts.map(x => x.est).join(',')), D.est], [['trocada', 'nao-troca,nao-troca', 'base', 'nao-troca'], { 'nao-troca':3, fora:0, trocada:1, base:1, 'sem-cadastro':0, 'nao-vale':0 }]);
  ok('as UEP trocadas no cadastro NESTE dia (a de 26/10 fica fora), com os códigos e a UEP nova',
     D.trocasDia, [{ rot:'501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2', hora:'10:40', amostra:'2 medições, 113 volumes', antes:2.29, uep:1.51, cods:[{ cod:'501059002', uep:1.51 }], substituida:false }]);
  ok('sem as trocas lidas: null (o cartão diz que não foram lidas), nunca "nenhuma"; produção não lida: o estado vai para a NA PRODUÇÃO',
     [_ucvDiaMontar(LD, '27/10/2026', PRODS, null, 'lendo', 2530).trocasDia, D.lido, D.grupos[1].pads], [null, false, 'lendo']);
  const HB = [1, 2, 3].map(h => ({ data:'20/10/2026', hora:(12 + h) + ':00', min:60, cods:{ 501149001:288 }, par:{} }))
    .concat([9, 10].map(h => ({ data:'21/10/2026', hora:h + ':00', min:60, cods:{ 501139001:130 }, par:{} })));
  const DL = _ucvDiaMontar(LD, '27/10/2026', PRODS, TRD, HB, 2530);
  ok('com a produção lida: a NA PRODUÇÃO de cada medição, com a UEP dela, contra a base', [DL.lido, DL.grupos[1].pads.map(x => x && +x.rel.toFixed(1))], [true, [99.3, 101.6]]);
  ok('dia sem medição: n 0 (o botão avisa e diz o último dia)', [_ucvDiaMontar(LD, '24/10/2026', PRODS, TRD, 'lendo', 2530).n, _ucvDiaMontar([], '27/10/2026', PRODS, TRD, 'lendo', 2530).ultimo], [0, '']);
  ok('o campo DIA (aaaa-mm-dd) ↔ dd/mm/aaaa; vazio ou torto = hoje',
     [_ucvDiaDoCampo('2026-10-27'), _ucvDiaDoCampo(''), _ucvDiaDoCampo('27/10/2026'), _ucvDiaParaCampo('27/10/2026'), _ucvDiaParaCampo('')], ['27/10/2026', null, null, '2026-10-27', '']);
  // o resumo de cada volume é a regra da troca com TODAS as medições dele
  const gE = D.grupos[1];
  ok('o resumo do volume conta as medições de outros dias (a regra é do volume): a linha de cima segue a regra de TODAS as medições dele',
     [_ucvRegsHtml(gE.regs, gE.p, null, null, gE.cad, gE.pads, gE.sts).includes(UCV_REG_VEREDITO[_ucvRegraUep(gE.regs, gE.cad).veredito][1]),
      _ucvRegsHtml(gE.regs, gE.p, null, null, gE.cad, gE.pads, gE.sts, gE.todas).includes(UCV_REG_VEREDITO[_ucvRegraUep(gE.todas, gE.cad).veredito][1]),
      _ucvRegsHtml(gE.regs, gE.p, null, null, gE.cad, gE.pads, gE.sts, gE.todas).includes('3 medições ·')], [true, true, true]);
  const DH = _ucvDiaHtml(D, { data:'27/10/2026', hora:'10:50' });
  { const TRd = [{ modelo:gE.p.modelo, produto:gE.p.nome, volume:_ucvRegVol(gE.p), em:'26/10/2026 09:00', uep:1, destravadaEm:'' }];
    const DT = _ucvDiaMontar(LD, '27/10/2026', PRODS, TRD, 'lendo', 2530, TRd);
    ok('revisão: o papel dos ESTUDOS DO DIA sabe da trava — o volume travado sai UEP TRAVADA, como na tela (nunca "o PPCP decide")',
       [DT.grupos[1].trava && DT.grupos[1].trava.travada, _ucvDiaHtml(DT, { data:'27/10/2026', hora:'10:50' }).includes(UCV_REG_VEREDITO.travada[1]), DH.includes(UCV_REG_VEREDITO.travada[1])],
       [true, true, false]); }
  ok('o papel: os cartões, a tabela de cada volume (a MESMA da tela), a nota das medições de outros dias e as trocas do dia',
     [DH.includes('MEDIÇÕES DO DIA'), DH.includes('3 dentro de 90–110% · 1 já trocada · 1 da base'), DH.includes(_ucvRegsHtml(gE.regs, gE.p, null, null, gE.cad, gE.pads, gE.sts, gE.todas)),
      DH.includes('as 3 medições registradas do volume — 1 é de outro dia'), DH.includes('UEP TROCADA NO CADASTRO NESTE DIA'), DH.includes('501.059.002 <b>1,51</b>'),
      DH.includes('2,29 → <b>1,51</b>'), DH.includes('MEDIÇÕES REGISTRADAS · 501777 · PRODUTO SUMIDO'), DH.includes('CONFERIDO POR (PPCP)'), DH.includes('gerado 27/10/2026 às 10:50')],
     [true, true, true, true, true, true, true, true, true, true]);
  ok('sem troca no dia, sem a seção; trocas não lidas, o cartão diz', [_ucvDiaHtml(_ucvDiaMontar(LD, '27/10/2026', PRODS, [], 'lendo', 2530), { data:'', hora:'' }).includes('NESTE DIA'),
     _ucvDiaHtml(_ucvDiaMontar(LD, '27/10/2026', PRODS, null, 'lendo', 2530), { data:'', hora:'' }).includes('as trocas não foram lidas')], [false, true]);
  ok('o desenho do papel não faz conta', UCV_SEM_CONTA.test(pegaJs('function _ucvDiaHtml(')) || /_ucvRegsStatus\(|_ucvRegsPadrao\(|_ucvRegsResumo\(|_ucvRefDe\(/.test(pegaJs('function _ucvDiaHtml(')), false);
  const SKD = pegaConst('_UCV_DIA_SKIN').replace(/^`|`$/g, '');
  ok('a pele é escopada em .ucv-dia e esconde a coluna do EXCLUIR (só da tela)',
     [SKD.split('\n').map(l => l.trim()).filter(Boolean).every(l => l.startsWith('.ucv-dia ')), /\.ucv-dia \.ucv-regs \.ucv-x-c\{display:none\}/.test(SKD),
      (pegaJs('function _ucvRegsHtml(').match(/class="ucv-x-c"/g) || []).length], [true, true, 2]);
  const LARG = [...SKD.matchAll(/\.ucv-dia-g \.ucv-regs th:nth-child\((\d+)\)\{width:(\d+)%\}/g)].map(m => [+m[1], +m[2]]);
  const nCol = (_ucvRegsHtml(gE.regs, gE.p, null, null, gE.cad, gE.pads, gE.sts).match(/<th[ >]/g) || []).length - 1;   // a do EXCLUIR é escondida
  ok('as tabelas dos volumes alinham: largura fixa para cada coluna visível da lista, somando 100%',
     [/\.ucv-dia-g \.ucv-regs\{table-layout:fixed\}/.test(SKD), LARG.map(x => x[0]).join(), LARG.reduce((a, x) => a + x[1], 0)],
     [true, Array.from({ length:nCol }, (_, i) => i + 1).join(), 100]);
  // o botão, rodando a função real com o navegador de mentira
  const G0 = {}, NOMES = ['document', 'window', 'alert', 'UCV_REGS', 'UCV_CONF', 'UEP_CONV_PRODS', 'PONTOS_DIA', 'UCV_LINHA', 'UCV_LINHA_VOO', 'hojeStr',
    '_rpDocParadas', '_rpCabecalho', '_rpBotaoImprimir', '_UCV_DOC_SKIN', '_UCV_DIA_SKIN', '_ucvRegsCarregar', '_rpErroRelatorio'];
  NOMES.forEach(n => { G0[n] = global[n]; });
  const F = { alertas:[], abriu:0, html:'', leu:0, args:null };
  const campoDia = { value:'' };
  global.document = { activeElement:null, getElementById:id => id === 'uep-conv-dia' ? campoDia : null };
  global.window = Object.assign(global, { open:() => { F.abriu++; return { document:{ open(){}, write(h){ F.html += h; }, close(){} }, close(){} }; } });
  global.alert = t => F.alertas.push(t);
  global.hojeStr = () => '27/10/2026';
  global.UCV_LINHA = null; global.UCV_LINHA_VOO = null; global.PONTOS_DIA = { metaUep:2530 };
  global.UEP_CONV_PRODS = PRODS; global.UCV_CONF = { trocas:TRD };
  global._rpDocParadas = (t, deitado) => { F.args = [t, deitado]; return '<html>'; };
  global._rpCabecalho = (t, m, s) => `<hdr>${t}${m}${s}</hdr>`; global._rpBotaoImprimir = () => '';
  global._UCV_DOC_SKIN = ''; global._UCV_DIA_SKIN = ''; global._ucvRegsCarregar = () => { F.leu++; return Promise.resolve(); };
  global.UCV_REGS = null;
  gerarRelatorioCronoDia();
  global.UCV_REGS = { lista:LD, falha:null, ts:0 };
  campoDia.value = '2026-10-24';
  gerarRelatorioCronoDia();
  ok('sem as medições lidas, ou dia sem medição: avisa (com o último dia), NÃO abre janela; sem lista, pede a leitura',
     [F.abriu, F.leu, /ainda não foram lidas/.test(F.alertas[0]), /DATA DA MEDIÇÃO 24\/10\/2026[\s\S]*A última registrada é de 27\/10\/2026/.test(F.alertas[1])], [0, 1, true, true]);
  campoDia.value = '';
  gerarRelatorioCronoDia();
  ok('com medições: abre no clique, deitada, com o dia de hoje (campo vazio) e o mesmo desenho',
     [F.abriu, F.args, F.html.includes('<hdr>ESTUDOS DE CRONOANÁLISE<div class="rp-per">27/10/2026</div><div>5 medições · 4 volumes estudados</div>'),
      F.html.includes(_ucvDiaHtml(_ucvDiaMontar(LD, '27/10/2026', PRODS, TRD, 'nao-lida', 2530), { data:'27/10/2026', hora:'' }).slice(0, 400)), F.html.includes('<div class="ucv-doc ucv-dia">')],
     [1, ['Estudos de cronoanálise - 27-10-2026', true], true, true, true]);
  ok('a impressão é síncrona: a janela abre no clique, nenhuma leitura antes', /await |\.then\(/.test(pegaJs('function gerarRelatorioCronoDia(')), false);
  NOMES.forEach(n => { global[n] = G0[n]; });
  ok('o botão e o dia moram na aba ⏱ CRONOANÁLISE; abrir a aba põe hoje no dia vazio',
     [html.slice(iCr, fCr).includes('onclick="_ucvImpFecha();gerarRelatorioCronoDia()"'), html.slice(iCr, fCr).includes('<input type="date" id="uep-conv-dia"'),
      /if\(tab==='crono'\)\{ const di=_ucvEl\('dia'\); if\(di && !di\.value\) di\.value=_ucvDiaParaCampo\(hojeStr\(\)\);/.test(ST)], [true, true, true]);
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-ABAS DA ⏱ CRONOANÁLISE (v7.197.0, PPCP 03/11/2026: "está muito cheia a
// tela, tem que enxugar, deixar mais dinâmica" → sub-abas por tarefa e as
// impressões num menu). Os blocos, ids e leituras são os de antes.
// v7.208.0 / .gs v5.58 (PPCP, 06/11/2026: "b2"): a medição que veio do app (ORIGEM APP) diz isso no MEDIDO POR
ok('v7.208.0 a medição que veio do app diz "app" no MEDIDO POR (com o porquê no title); a do painel, o nome digitado',
   /<td\$\{r\.origem === 'APP' \? ' title="Veio sozinha do app de cronoanálise \(Salvar análise\), sem PDF"' : ''\}>\$\{_rpEsc\(r\.quem \|\| \(r\.origem === 'APP' \? 'app' : ''\)\)\}<\/td>/.test(pegaJs('function _ucvRegsHtml(')), true);
console.log('\n── CRONOANÁLISE: sub-abas ──');
{
  const iC = html.indexOf('<section id="sec-crono"'), SC = html.slice(iC, html.indexOf('</section>', iC));
  const pn = k => { const i = SC.indexOf(`<div class="ucv-pn${k === 'medir' ? ' on' : ''}" data-sub="${k}">`); return i < 0 ? '' : SC.slice(i, SC.indexOf('<div class="ucv-pn', i + 10) > 0 ? SC.indexOf('<div class="ucv-pn', i + 10) : SC.length); };
  // v7.207.0: o 5º é o ONDE O TEMPO VAI, que era aba
  // v7.233.0: a TRAVA DA UEP entra depois das MEDIÇÕES
  ok('seis botões e seis painéis, com as mesmas chaves; o MEDIR começa aceso nos dois; a faixa vem antes dos painéis',
     [[...SC.matchAll(/class="ucv-sb[^"]*" data-sub="(\w+)"/g)].map(m => m[1]), [...SC.matchAll(/class="ucv-pn[^"]*" data-sub="(\w+)"/g)].map(m => m[1]),
      /class="ucv-sb on" data-sub="medir" role="tab" aria-selected="true"/.test(SC), SC.includes('<div class="ucv-pn on" data-sub="medir">'),
      SC.indexOf('id="uep-conv-sub"') < SC.indexOf('<div class="ucv-pn'), pegaConst('UCV_SUBS')],
     [['medir', 'princ', 'regs', 'trava', 'trocas', 'tempo'], ['medir', 'princ', 'regs', 'trava', 'trocas', 'tempo'], true, true, true, "['medir', 'princ', 'regs', 'trava', 'trocas', 'tempo']"]);
  ok('cada painel tem o seu bloco: MEDIR (campos, resultado, registro, as medições do volume, ⓘ COMO LER), O QUE MEDIR, MEDIÇÕES, TROCAS',
     [['id="uep-conv-prod"', 'id="uep-conv-res"', 'id="uep-conv-reg"', 'id="uep-conv-reg-falta"', 'id="uep-conv-regs-p"', 'id="uep-conv-ler"'].filter(t => !pn('medir').includes(t)),
      pn('princ').includes('id="uep-conv-princ"'), pn('regs').includes('id="uep-conv-regs"') && pn('trava').includes('id="uep-conv-trava"'), pn('trocas').includes('id="uep-conv-conf"'),
      ['conf-av', 'i-msg', 'x-msg'].filter(n => SC.indexOf(`id="uep-conv-${n}"`) > SC.indexOf('<div class="ucv-pn'))],
     [[], true, true, true, []]);
  // a conta dos botões: só lê o que o _ucvRegPintar já montou
  const Mx = { nPrincMed:10, nPrinc:33, cobertura:34.9, progLida:true, nProg:12, nPend:20 }, Lx = new Array(34).fill({}), Cx = { lista:new Array(9).fill({}), nAlerta:0 };
  const PV = { nome:'PENTEADEIRA CAMARIM STRASS', volSel:2, nVolTot:2 };
  const TRx = { cumpriu:[{}, {}], travadas:[{}], travasLidas:true };
  const D1 = _ucvSubMontar({ p:PV, M:Mx, LH:[], L:Lx, trava:TRx, C:Cx });
  // v7.216.0: o O QUE MEDIR diz quantos a medir estão na programação (a agenda) e quanto da UEP já está medido
  ok('os números dos botões: o volume escolhido, a medir na programação e a UEP medida, as registradas, quantos cumpriram e quantos o PPCP travou, as trocas e os alertas',
     [D1.medir.txt, D1.princ.txt, D1.regs.txt, D1.trava.txt, D1.trava.cls, D1.trocas.txt, D1.trocas.cls, _ucvSubMontar({ M:Object.assign({}, Mx, { progLida:false }) }).princ.txt,
      _ucvSubMontar({ M:Object.assign({}, Mx, { nProg:0 }) }).princ.txt],
     ['PENTEADEIRA CAMARIM STRASS · VOL 2/2', '12 a medir na programação · 34,9% da UEP medida', '34 registradas', '2 cumpriram · 1 travada', 'acc', '9 trocas · nenhum alerta', '',
      '20 a medir · 34,9% da UEP medida', 'nada a medir na programação · 34,9% da UEP medida']);
  const D2 = _ucvSubMontar({ p:null, M:Object.assign({}, Mx, { nPend:0, nProg:0 }), LH:[], L:Lx, trava:{ cumpriu:[], travadas:[], travasLidas:false }, C:{ lista:new Array(9).fill({}), nAlerta:2 } });
  ok('alerta na conferência pinta o TROCAS; tudo medido pinta o O QUE MEDIR; sem produto, o MEDIR pede um',
     [D2.trocas.txt, D2.trocas.cls, D2.princ.cls, D2.medir.txt, D2.regs.txt, D2.regs.cls, D2.trava.txt, D2.trava.cls],
     ['9 trocas · 2 alertas', 'warn', 'ok', 'escolha o produto', '34 registradas', '', '0 cumpriram · 0 travadas · falta o .gs novo', '']);
  const D3 = _ucvSubMontar({ p:null, M:null, LH:'sem-endpoint', L:null, regsFalha:'sem-resposta', C:null, confFalha:'sem-endpoint' });
  const D4 = _ucvSubMontar({ p:null, M:null, LH:'lendo', L:null, C:null });
  ok('sem a leitura, o botão diz o estado (nunca 0): falta o .gs, não foi lida, ou …',
     [D3.princ.txt, D3.regs.txt, D3.trocas.txt, D4.princ.txt, D4.regs.txt, D4.trocas.txt, _ucvSubMontar({ C:{ lista:[], nAlerta:0 } }).trocas.txt],
     ['falta o .gs novo', 'não foram lidas', 'falta o .gs novo', '…', '…', '…', 'nenhuma troca']);
  // trocar de sub-aba só mostra e esconde
  { const docAntes = global.document, el = d => ({ dataset:{ sub:d }, cls:new Set(), at:{}, classList:{ toggle(c, on){ on ? this.s.add(c) : this.s.delete(c); } }, setAttribute(k, v){ this.at[k] = v; } });
    const PN = ['medir', 'princ', 'regs', 'trocas'].map(el), SB = ['medir', 'princ', 'regs', 'trocas'].map(el);
    PN.concat(SB).forEach(e => { e.classList.s = e.cls; });
    global.document = { querySelectorAll:q => (q === '#uep-conv .ucv-pn' ? PN : q === '#uep-conv .ucv-sb' ? SB : []) };
    global.UCV_SUBS = ['medir', 'princ', 'regs', 'trocas']; global.UCV_SUB = 'medir';
    eval.call(global, pegaJs('function _ucvSub('));
    _ucvSub('trocas');
    const r1 = [UCV_SUB, PN.filter(e => e.cls.has('on')).map(e => e.dataset.sub), SB.filter(e => e.cls.has('on')).map(e => e.dataset.sub), SB.map(e => e.at['aria-selected'])];
    _ucvSub('nada');
    ok('_ucvSub acende o painel e o botão pedidos (e o aria-selected); chave que não existe não muda nada',
       [r1, UCV_SUB, /jsonp|_uepConvAtualiza|innerHTML/.test(pegaJs('function _ucvSub('))],
       [['trocas', ['trocas'], ['trocas'], ['false', 'false', 'false', 'true']], 'trocas', false]);
    global.document = docAntes; }
  // o 💾 escondido diz o que falta (PPCP: "sumiu onde salva o estudo" — o nome do produto estava diferente do cadastro)
  const RF = R => _ucvRegFalta(R, { txt:'Penteadeira strass', seg:12.1 });
  ok('o 💾 escondido diz o que falta: o produto da lista (um só), o tempo, o cadastro; com a conversão pronta ou nada digitado, nada',
     [RF({ estado:'sem-produto', n:0 }), RF({ estado:'sem-produto', n:3 }), RF({ estado:'sem-tempo', base:{ daMeta:false } }), RF({ estado:'sem-tempo', base:{ daMeta:true } }),
      RF({ estado:'sem-cadastro' }), RF({ estado:'ok', base:{ medida:true } }), _ucvRegFalta({ estado:'sem-produto', n:0 }, { txt:'', seg:0 }),
      RF({ estado:'ok', base:{ medida:false, daMeta:false } })],
     ['💾 O REGISTRO DA MEDIÇÃO aparece quando o PRODUTO for escolhido da lista — o nome do app de cronoanálise pode ser diferente do cadastro.',
      '💾 O REGISTRO DA MEDIÇÃO aparece quando um só produto for escolhido da lista.',
      '💾 O REGISTRO DA MEDIÇÃO aparece quando o tempo SEM AS LACUNAS for digitado.', '💾 O REGISTRO DA MEDIÇÃO aparece quando o tempo NO PERÍODO for digitado.',
      '💾 O REGISTRO DA MEDIÇÃO aparece quando o cadastro de produtos terminar de ser lido.', '', '',
      '💾 O REGISTRO DA MEDIÇÃO não aparece: a base tem de ser a MADERO medida (6,7 s sem as lacunas): é contra ela que a regra da troca compara todas as medições — clique em VOLTAR À MADERO MEDIDA.']);
  ok('o formulário do 💾 só aparece com a base MADERO medida (a regra da troca compara contra ela); o REGISTRAR recusa com outra base',
     [/box\.style\.display = R\.estado === 'ok' && R\.base\.medida && !ja \? '' : 'none'/.test(pegaJs('function _ucvRegPintar(')),
      /if\(!R\.base\.medida\)\{ alert\('Não registra: ' \+ _ucvRegBaseTxt\(\)/.test(pegaJs('async function _ucvRegistrar('))], [true, true]);
  const AT4 = pegaJs('function _uepConvAtualiza('), RP4 = pegaJs('function _ucvRegPintar(');
  ok('a tela: a linha do 💾 pelo _uepConvAtualiza; as medições do volume só com produto (no MEDIR), todas no MEDIÇÕES; os botões no fim do _ucvRegPintar',
     [/const fl = _ucvEl\('reg-falta'\); if\(fl\)\{ fl\.textContent = ja \? _ucvAppJaTxt\(ja\) : _ucvRegFalta\(R, E\);/.test(AT4), /lstP\.innerHTML = !R\.p \? '' : _ucvRegsHtml\(L \? RL : null, R\.p,/.test(RP4),
      /lst\.innerHTML = _ucvRegsHtml\(L, null,/.test(RP4), /_ucvSubPintar\(_ucvSubMontar\(\{ p:R\.p, M, LH, L, trava:UCV_TRAVA,/.test(RP4)],
     [true, true, true, true]);
  ok('quem abre um volume volta ao MEDIR: os PRINCIPAIS, o ONDE O TEMPO VAI, as que CHEGARAM DO APP e um PDF importado; o aviso da conferência leva às TROCAS',
     [['function _ucvAbrirPrincipal(', 'function _ucvAbrirTempo(', 'function _ucvAbrirApp(', 'async function _ucvImportar('].filter(f => !pegaJs(f).includes("_ucvSub('medir')")),
      _ucvConfAvisoHtml({ nAlerta:1 }).includes(`onclick="_ucvSub('trocas')"`), _ucvConfAvisoHtml({ nAlerta:1 }).includes('no fim da tela')],
     [[], true, false]);
  ok('a pele: só o painel aceso aparece; a entrada não se mexe com menos movimento pedido; o cartão dos campos é do painel',
     [/#sec-crono \.ucv-pn\{display:none\}/.test(html), /#sec-crono \.ucv-pn\.on\{display:block;/.test(html), /@media \(prefers-reduced-motion:reduce\)\{#sec-crono \.ucv-pn\.on\{animation:none\}\}/.test(html),
      /#sec-crono \.ucv-pn>\.uep-card\{/.test(html), /#sec-crono \.uep-conv>\.uep-card\{/.test(html)],
     [true, true, true, true, false]);
}

// ════════════════════════════════════════════════════════════════════════════
// CHEGARAM DO APP (v7.218.0). PPCP, 09/11/2026, com o MEDIR vazio na tela:
// "nessa tela tem como vir o que foi enviado pelo app". As medições com ORIGEM
// APP (o "Salvar análise" do app, .gs v5.58) já estão na aba e já contam na
// regra; a faixa no topo do MEDIR as lista pela hora em que CHEGARAM e abre o
// volume com o SEM AS LACUNAS. Os registros são os reais de 06 e 09/11/2026.
console.log('\n── CRONOANÁLISE: CHEGARAM DO APP ──');
{ const KA = html.match(/const UCV_APP_DIAS = (\d+), UCV_APP_MAX = (\d+);/);
  global.UCV_APP_DIAS = Number(KA[1]); global.UCV_APP_MAX = Number(KA[2]);
  ['function _ucvAppRecentes(', 'function _ucvAppJa(', 'function _ucvAppJaTxt(', 'function _ucvAppHtml('].forEach(f => eval.call(global, pegaJs(f)));
  ok('as constantes: 7 dias, no máximo 4 linhas', [UCV_APP_DIAS, UCV_APP_MAX], [7, 4]);
  const PA = _uepConvProdutos([
    CV('501079001', 'VOL 1/2 BUFFET FLIP 1.6', 'BRANCO', 1.6, '16/10/2026'), CV('501079002', 'VOL 2/2 BUFFET FLIP 1.6', 'BRANCO', 1.52, '04/11/2026 DIGITADA'),
    CV('501093001', 'VOL 1/1 CANT CAFE AURORA', 'BRANCO', 2.04, '16/10/2026'),
    CV('501135001', 'VOL 1/1 PENT CAMARIM 1PT 2GAV DIAMANTE', 'BRANCO', 2.48, '06/11/2026 DIGITADA'),
    CV('501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 'BRANCO', 1, '25/09/2026'),
    CV('501134001', 'VOL 1/1 PENTEADEIRA PRINCESA', 'BRANCO', 1.9, '16/10/2026')]);
  const AR = (linha, em, data, modelo, produto, volume, sRod, sLac, volumes, uepCad, quem, origem) =>
    ({ linha, em, data, modelo, produto, volume, sRod, sLac, volumes, uepCad, quem, origem, regId:origem === 'APP' ? 'app-' + linha : 'c' + linha });
  const LA = [
    AR(60, '09/11/2026 08:35', '09/11/2026', '501079', 'BUFFET FLIP 1.6', 'VOL 2/2', 12, 10.5, 61, 1.52, 'ODERLI SERGIO GARCIA', 'APP'),
    AR(59, '09/11/2026 08:33', '09/11/2026', '501093', 'CANT CAFE AURORA', 'VOL 1/1', 14.5, 13.4, 30, 2.04, 'ODERLI SERGIO GARCIA', 'APP'),
    AR(58, '06/11/2026 14:28', '06/11/2026', '501135', 'PENT CAMARIM 1PT 2GAV DIAMANTE', 'VOL 1/1', 18.4, 16.6, 100, 1.83, '', 'APP'),
    AR(57, '06/11/2026 10:44', '20/10/2026', '501149', 'MESA CABECEIRA MADERO', 'VOL 1/1', 7.7, 6.5, 37, 1, '', 'APP'),
    AR(56, '06/11/2026 10:43', '04/11/2026', '501134', 'PENTEADEIRA PRINCESA', 'VOL 1/1', 15.2, 14.4, 65, 1.9, '', 'APP'),
    AR(51, '06/11/2026 07:46', '06/11/2026', '501060', 'PENTEADEIRA CAMARIM MEL', 'VOL 2/2', 13.8, 13.6, 70, 1.71, 'ADRIANO RODRIGUES', ''),   // do PDF: não entra
    AR(40, '01/11/2026 09:00', '01/11/2026', '501093', 'CANT CAFE AURORA', 'VOL 1/1', 14, 13, 40, 2.04, '', 'APP'),                              // 9 dias antes: fora da janela
    AR(61, '10/11/2026 07:00', '10/11/2026', '501093', 'CANT CAFE AURORA', 'VOL 1/1', 14, 13, 40, 2.04, '', 'APP'),                              // "amanhã" (relógio errado): fora
    AR(55, '06/11/2026 10:42', '05/11/2026', '501999', 'PRODUTO QUE SAIU', 'VOL 1/1', 20, 19.5, 35, 2.98, '', 'APP')];                           // fora do cadastro
  const TROC = [{ modelo:'501135', produto:'PENT CAMARIM 1PT 2GAV DIAMANTE', volume:'VOL 1/1', gravado:'06/11/2026 15:10', vig:'06/11/2026 DIGITADA', codigos:[{ cod:'501135001', antes:1.83, uep:2.48 }] }];
  const A = _ucvAppRecentes(LA, PA, TROC, '09/11/2026', 7, 4);
  ok('só ORIGEM APP, que CHEGOU nos últimos 7 dias (nem o de 9 dias atrás nem o de "amanhã"), a mais nova primeiro, no máximo 4',
     [A.linhas.map(x => x.r.linha), A.nJan, A.nHoje, A.dias, A.ultima.linha], [[60, 59, 58, 57], 6, 2, 7, 61]);
  ok('cada linha: o volume do cadastro, a UEP pela régua de hoje (sem as lacunas ÷ 6,7), hoje, e "medida em" quando a data é de outro dia',
     [A.linhas.map(x => x.p && x.p.rot), A.linhas.map(x => _ucvU2(x.uep)), A.linhas.map(x => x.hoje), A.linhas.map(x => x.outroDia)],
     [['501079 · BUFFET FLIP 1.6 · VOL 2/2', '501093 · CANT CAFE AURORA', '501135 · PENT CAMARIM 1PT 2GAV DIAMANTE', '501149 · MESA CABECEIRA MADERO'],
      ['1,57', '2,00', '2,48', '0,97'], [true, true, false, false], [false, false, false, true]]);
  ok('a célula TROCA é a da lista (_ucvRegsStatus): NÃO TROCA dentro da faixa, TROCADA pelo ✓ TROCAR, BASE; a versão do cadastro diz se ainda vale',
     [A.linhas.map(x => x.st.est), A.linhas.map(x => x.st.vigor), Math.round(A.linhas[0].st.dif * 10) / 10],
     [['nao-troca', 'nao-troca', 'trocada', 'base'], [true, true, false, true], 3.1]);
  const AF = _ucvAppRecentes(LA, PA, TROC, '09/11/2026', 7, 9);
  ok('o volume que saiu do cadastro entra sem produto (não abre); a lista não lida dá null; nenhuma do app: lista vazia e a última que chegou',
     [AF.linhas.map(x => x.r.linha), AF.linhas[5].p, _ucvAppRecentes(null, PA, TROC, '09/11/2026'), _ucvAppRecentes(LA.slice(5, 6), PA, [], '09/11/2026').linhas.length,
      _ucvAppRecentes(LA.slice(5, 7), PA, [], '20/11/2026').ultima.linha],
     [[60, 59, 58, 57, 56, 55], null, null, 0, 40]);
  // o desenho
  const H = _ucvAppHtml(A, null, 'app-60');
  ok('o desenho: título, hoje em negrito, "medida em", a linha aberta marcada, o clique pelo índice, quem mediu (ou "app"), e o VER TODAS na própria faixa',
     [H.includes('CHEGARAM DO APP'), H.includes('<b>hoje</b> 08:35'), H.includes('<small>medida em 20/10</small>'), H.includes('<tr class="sel" onclick="_ucvAbrirApp(0)"'),
      H.includes('onclick="_ucvAbrirApp(3)"'), H.includes('>ODERLI SERGIO GARCIA<'), H.includes('<td>app</td>'), H.includes('+ 2 outras chegaram nos últimos 7 dias'),
      H.includes('onclick="_ucvAppTodas()">VER TODAS (6)</button>'), H.includes('class="ucv-app-w novo"'), H.includes('<b>10,5 s</b>'), H.includes('<b>1,57</b>'), H.includes("_ucvSub('regs')")],
     [true, true, true, true, true, true, true, true, true, true, true, true, false]);
  const HT = _ucvAppHtml(_ucvAppRecentes(LA, PA, TROC, '09/11/2026', 7, Infinity), null, null, true);
  ok('VER TODAS: as 6 da janela, com VER MENOS; com até 4 na janela, nenhum dos dois',
     [(HT.match(/<tr class="(?:sel)?" onclick|<tr class="fora"/g) || []).length, HT.includes('>VER MENOS</button>'), HT.includes('VER TODAS'),
      /VER TODAS|VER MENOS/.test(_ucvAppHtml(_ucvAppRecentes(LA, PA, TROC, '13/11/2026', 7, 4), null, null, false))], [6, true, false, false]);
  ok('horário de chegada fora do formato (digitado à mão) sai escapado',
     _ucvAppHtml(_ucvAppRecentes([AR(70, '09/11/2026 <b>x</b>', '09/11/2026', '501093', 'CANT CAFE AURORA', 'VOL 1/1', 14, 13, 40, 2.04, '', 'APP')], PA, [], '10/11/2026'), null).includes('&lt;b&gt;x&lt;/b&gt;'), true);
  const HF = _ucvAppHtml(AF, null, null);
  ok('o volume fora do cadastro não abre (sem onclick) e diz por quê', [HF.includes('<tr class="fora"'), HF.includes('fora do cadastro'), (HF.match(/_ucvAbrirApp\(/g) || []).length], [true, true, 5]);
  ok('os estados: lendo, não lida, .gs antigo, nenhuma nos últimos dias (com a última), nenhuma ainda (diz como chega); sem novidade de hoje, sem a borda laranja',
     [_ucvAppHtml(null, null).includes('Lendo as medições'), _ucvAppHtml(null, 'falhou').includes('não foram lidas'), _ucvAppHtml(null, 'sem-endpoint').includes('.gs v5.30'),
      _ucvAppHtml(_ucvAppRecentes(LA.slice(5, 7), PA, [], '20/11/2026'), null).includes('a última chegou em 01/11/2026 09:00 (CANT CAFE AURORA · VOL 1/1)'),
      _ucvAppHtml(_ucvAppRecentes([], PA, [], '09/11/2026'), null).includes('Salvar análise e fechar'),
      _ucvAppHtml(_ucvAppRecentes(LA, PA, TROC, '12/11/2026'), null).includes('ucv-app-w novo')],
     [true, true, true, true, true, false]);
  ok('o desenho não faz conta (a UEP, a troca e a janela vêm prontas)', [/_ucvRegUep\(|_ucvRegsStatus\(|Date\.UTC|_uepConvCadastro\(/.test(pegaJs('function _ucvAppHtml(')), UCV_SEM_CONTA.test(pegaJs('function _ucvAppHtml('))], [false, false]);
  // já registrada: o 💾 some enquanto os campos são os da medição aberta
  const RA = { p:{ rot:'501079 · BUFFET FLIP 1.6 · VOL 2/2' }, seg:10.5 }, AB = { regId:'app-60', rot:RA.p.rot, seg:10.5 };
  ok('a medição aberta "já está registrada" só com o MESMO volume e o MESMO sem as lacunas, e se ela está na lista',
     [_ucvAppJa(AB, RA, LA) && _ucvAppJa(AB, RA, LA).linha, _ucvAppJa(AB, Object.assign({}, RA, { seg:10.4 }), LA), _ucvAppJa(AB, { p:{ rot:'501093 · CANT CAFE AURORA' }, seg:10.5 }, LA),
      _ucvAppJa(null, RA, LA), _ucvAppJa(AB, RA, LA.slice(1)), _ucvAppJa(AB, { p:null, seg:10.5 }, LA)],
     [60, null, null, null, null, null]);
  ok('o aviso: de onde veio, quando, quem, os volumes e o rodando; não manda registrar de novo',
     _ucvAppJaTxt(LA[0]), '✓ ESTA MEDIÇÃO JÁ ESTÁ REGISTRADA — chegou do app em 09/11/2026 08:35 (ODERLI SERGIO GARCIA): medida em 09/11/2026, 61 volumes, rodando 12,0 s. Não precisa registrar de novo: ela já conta na regra da troca (as medições do volume, abaixo).');
  const AT5 = pegaJs('function _uepConvAtualiza('), RP5 = pegaJs('function _ucvRegPintar(');
  ok('a tela: o já registrada ANTES do resultado (a caixa da regra não manda registrar de novo), o 💾 escondido, a faixa e o botão MEDIR pelo _ucvRegPintar',
     [/const ja = _ucvAppJa\(UCV_APP_ABERTA, R, E\.regs\);[\s\S]*if\(ja\) R\.jaReg = true;[\s\S]*res\.innerHTML = _uepConvHtml\(R, true\);[\s\S]*_ucvRegPintar\(R, ja\);/.test(AT5),
      /fl\.classList\.toggle\('ja', !!ja\)/.test(AT5), /R\.jaReg \? ' Esta medição já está registrada \(veio do app\)\.' : ''/.test(pegaJs('function _ucvRegraBoxHtml(')),
      /const A = _ucvAppRecentes\(L, UEP_CONV_PRODS, UCV_CONF && UCV_CONF\.trocas, hojeStr\(\), UCV_APP_DIAS, UCV_APP_TODAS \? Infinity : UCV_APP_MAX\);\s*UCV_APP = A \? A\.linhas : \[\];/.test(RP5),
      /_ucvEl\('app'\); if\(ap\) ap\.innerHTML = _ucvAppHtml\(A, UCV_REGS && UCV_REGS\.falha, ja \? ja\.regId : null, UCV_APP_TODAS\);/.test(RP5)],
     [true, true, true, true, true]);
  // a revisão (09/11): o "já registrada" não pode esconder o 💾 de um estudo NOVO do mesmo volume com o mesmo tempo
  ok('outro estudo esquece a medição aberta: importar um PDF, abrir pelos PRINCIPAIS, pelo ONDE O TEMPO VAI, o 📌 FIXAR e DIGITAR no produto ou no tempo',
     [['async function _ucvImportar(', 'function _ucvAbrirPrincipal(', 'function _ucvAbrirTempo(', 'function _uepConvFixarBase(', 'function _ucvDigitou(']
        .filter(f => !/UCV_APP_ABERTA = null;/.test(pegaJs(f))),
      /id="uep-conv-prod"[^>]*oninput="_ucvDigitou\(\)"/.test(html), /id="uep-conv-seg"[^>]*oninput="_ucvDigitou\(\)"/.test(html),
      /UCV_APP_ABERTA = null;[^\n]*\n\s*put\('prod'/.test(pegaJs('async function _ucvImportar('))],
     [[], true, true, true]);
  { const antes = global._uepConvAtualiza; let n = 0; global._uepConvAtualiza = () => { n++; };
    eval.call(global, pegaJs('function _ucvDigitou('));
    global.UCV_APP_ABERTA = { regId:'app-60', rot:RA.p.rot, seg:10.5 };
    _ucvDigitou();
    ok('digitou: a aberta some (o mesmo produto e o mesmo tempo digitados de novo já não "estão registrados") e a tela redesenha',
       [global.UCV_APP_ABERTA, _ucvAppJa(global.UCV_APP_ABERTA, RA, LA), n], [null, null, 1]);
    global._uepConvAtualiza = antes; global.UCV_APP_ABERTA = null; }
  const DJ = _uepConvDocHtml(_uepConvMontar(PRODS, 'ARMARIO ENCANTO', 27.8, 0, 2530), { data:'09/11/2026', hora:'09:00', ja:LA[0] });
  const DN = _uepConvDocHtml(_uepConvMontar(PRODS, 'ARMARIO ENCANTO', 27.8, 0, 2530), { data:'09/11/2026', hora:'09:00' });
  ok('a 🖨 do estudo diz o mesmo que a tela: com a medição do app aberta, "já registrada" no lugar das linhas para a caneta',
     [DJ.includes('ESTA MEDIÇÃO JÁ ESTÁ REGISTRADA'), DJ.includes('class="ucv-reg"'), DN.includes('class="ucv-reg"'), DN.includes('JÁ ESTÁ REGISTRADA'),
      /const ja = _ucvAppJa\(UCV_APP_ABERTA, R, E\.regs\);[\s\S]*if\(ja\) R\.jaReg = true;[\s\S]*hour:'2-digit', minute:'2-digit' \}\), ja \};/.test(pegaJs('function gerarRelatorioCrono('))],
     [true, false, true, false, true]);
  ok('a faixa mora no topo do MEDIR (antes dos campos); o ✕ LIMPAR esquece a medição aberta',
     [html.indexOf('<div id="uep-conv-app"></div>') > html.indexOf('data-sub="medir">') && html.indexOf('<div id="uep-conv-app"></div>') < html.indexOf('id="uep-conv-prod"'),
      /UCV_APP_ABERTA = null;/.test(pegaJs('function _ucvLimpar('))], [true, true]);
  // o botão MEDIR: sem produto, quantas chegaram hoje
  ok('o botão MEDIR: sem produto, quantas chegaram do app hoje (em laranja); com produto, o produto; sem nenhuma hoje, "escolha o produto"',
     [_ucvSubMontar({ app:A }).medir, _ucvSubMontar({ app:{ nHoje:1 } }).medir.txt, _ucvSubMontar({ app:{ nHoje:0 } }).medir, _ucvSubMontar({ p:{ nome:'CANT CAFE AURORA' }, app:A }).medir],
     [{ txt:'2 chegaram do app hoje', cls:'acc' }, '1 chegou do app hoje', { txt:'escolha o produto', cls:'' }, { txt:'CANT CAFE AURORA', cls:'' }]);
  // abrir: o MEDIR com o volume e o SEM AS LACUNAS da medição
  { const campos = { prod:{ value:'' }, seg:{ value:'' }, res:{ scrollIntoView(){} } }, docAntes = global.document;
    const subs = []; let att = 0;
    const antes = { el:global._ucvEl, sub:global._ucvSub, at:global._uepConvAtualiza, app:global.UCV_APP, ab:global.UCV_APP_ABERTA };
    global._ucvEl = n => campos[n] || null; global._ucvSub = k => subs.push(k); global._uepConvAtualiza = () => { att++; };
    global.UCV_APP = AF.linhas; global.UCV_APP_ABERTA = null;
    eval.call(global, pegaJs('function _ucvAbrirApp('));
    _ucvAbrirApp(0);
    const r0 = [subs.slice(), campos.prod.value, campos.seg.value, JSON.stringify(UCV_APP_ABERTA), att];
    _ucvAbrirApp(5); _ucvAbrirApp(9);
    ok('abrir: volta ao MEDIR, o volume no PRODUTO, o sem as lacunas no campo (com vírgula), guarda qual foi aberta; fora do cadastro ou índice que não existe não faz nada',
       [r0, subs.length, att], [[['medir'], '501079 · BUFFET FLIP 1.6 · VOL 2/2', '10,5', '{"regId":"app-60","rot":"501079 · BUFFET FLIP 1.6 · VOL 2/2","seg":10.5}', 1], 1, 1]);
    global.document = docAntes;
    global._ucvEl = antes.el; global._ucvSub = antes.sub; global._uepConvAtualiza = antes.at; global.UCV_APP = antes.app; global.UCV_APP_ABERTA = antes.ab;
  }
  ok('a pele da faixa: a borda laranja só com novidade de hoje, o aberto marcado, a linha fora do cadastro sem cursor, o já registrada em verde',
     [/#sec-crono \.ucv-app-w\.novo\{/.test(html), /#sec-crono \.ucv-app tbody tr\.sel td\{/.test(html), /#sec-crono \.ucv-app tbody tr\.fora\{cursor:default/.test(html),
      /#sec-crono #uep-conv-reg-falta\.ja\{/.test(html)], [true, true, true, true]);
}

// os testes assíncronos (o fluxo do EXCLUIR) rodam antes do resumo; um que não
// termina deixa o processo sair com erro, nunca com "tudo certo"
process.exitCode = 1;
(async () => {
  for (const f of _assincronos) await f();
  console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.log('\n❌ teste assíncrono quebrou: ' + e.message); process.exit(1); });
