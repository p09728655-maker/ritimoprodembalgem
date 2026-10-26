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
 'FILA_FAM_RAZAO', 'FILA_TETO_FOLGA', 'FILA_MAX_SEM', 'FILA_MOTIVOS', 'FILA_AMOSTRA_DE',
 'CXU_DIAS', 'CXU_FOLGA', '_CXU_PORQUE', '_filaN2br']
  .forEach(c => { global[c] = eval('(' + pegaConst(c) + ')'); });
['function _uepEhBase(', 'function _taktUep(', 'function _taktTxt(', 'function _rpEsc(', 'function _cartNum(', 'function _qpRealDia(', 'function _capVol(', 'function _capNome(',
 'function _cartQtdAberta(', 'function _tvF2(', 'function _filaUteis(', 'function _filaAmostraDeItens(',
 'function _filaCronoMontar(', 'function _filaCronoHtml(', 'function _cxUepMontar(', 'function _cxUepHtml(']
  .forEach(f => eval.call(global, pegaJs(f)));

// ════════════════════════════════════════════════════════════════════════════
console.log('\n── FILA: a janela de dias úteis ──');
ok('de um sábado: segunda a sexta seguintes', _filaUteis(new Date(2026, 9, 17), 5), [20261019, 20261020, 20261021, 20261022, 20261023]);
ok('de uma quinta: atravessa o fim de semana', _filaUteis(new Date(2026, 9, 22), 5), [20261022, 20261023, 20261026, 20261027, 20261028]);
ok('a amostra conta DIAS distintos e soma as caixas (cores juntas)',
   _filaAmostraDeItens([{ data: '01/10/2026', modelo: '501059', nome: 'PENTEADEIRA CAMARIM STRASS', caixas: 100 },
                        { data: '01/10/2026', modelo: '501059', nome: 'PENTEADEIRA CAMARIM STRASS', caixas: 50 },
                        { data: '02/10/2026', modelo: '501059', nome: 'PENTEADEIRA CAMARIM STRASS', caixas: 30 }]),
   { '501059|PENTEADEIRA CAMARIM STRASS': { dias: 2, cx: 180 } });

// cadastro de mentira: velocidade 8,5 m/min e 650 mm entre peças (o real)
const C = (codigo, desc, cor, medida, uep, uepVig) => ({ codigo, desc, cor, medida, velocidade: 8.5, entrePeca: 650, uep, uepVig });
const teto = med => 8.5 * 60000 / (med + 650);
const CAT = [
  C('501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 'BRANCO', 881, 1, '25/09/2026'),                   // a base, bem medida
  C('501094001', 'VOL 1/1 MESA CABECEIRA SLEEP', 'PRETO', 825, 0.83, '16/10/2026'),                   // no limite da esteira
  C('501059001', 'VOL 1/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 1300, 2.71, '16/10/2026'),          // provisória (4 dias)
  C('501059002', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 1000, 2.29, '16/10/2026'),
  C('501159001', 'VOL 1/1 PUFF EVORA', 'LINHO BEGE', 800, 1.54, '16/10/2026 EST'),                    // estimada
  C('501061001', 'VOL 1/2 PENTEADEIRA CAMARIM ELOA', 'BRANCO', 1300, 2.4, '20/10/2026 DIGITADA'),    // cronometrada
  C('501061002', 'VOL 2/2 PENTEADEIRA CAMARIM ELOA', 'BRANCO', 1000, 2.0, '20/10/2026 DIGITADA'),
  C('501130001', 'VOL 1/1 MESA LATERAL LUNA 440', 'OFF WHITE', 880, 3.33, '16/10/2026'),              // família: 3,4×
  C('501130005', 'VOL 1/1 MESA CENTRO LUNA 590', 'OFF WHITE', 926, 1.0, '16/10/2026'),
  C('501150001', 'VOL 1/1 COMODA DALILA NEW', 'BRANCO', 0, 4.18, '16/10/2026'),                       // sem medida
  C('501999001', 'VOL 1/1 PRODUTO NOVO', 'BRANCO', 900, '', ''),                                     // sem UEP
  C('501095001', 'VOL 1/1 NICHO TESTE', 'BRANCO', 825, 0.84, '16/10/2026')                           // no limite, como a SLEEP
];
const AM = { '501149|MESA CABECEIRA MADERO': { dias: 12, cx: 9000 }, '501094|MESA CABECEIRA SLEEP': { dias: 14, cx: 20541 },
             '501059|PENTEADEIRA CAMARIM STRASS': { dias: 4, cx: 2357 }, '501061|PENTEADEIRA CAMARIM ELOA': { dias: 2, cx: 500 },
             '501130|MESA LATERAL LUNA 440': { dias: 8, cx: 229 }, '501130|MESA CENTRO LUNA 590': { dias: 9, cx: 440 },
             '501150|COMODA DALILA NEW': { dias: 6, cx: 300 } };
const L = (data, codigo, qtde, extra) => Object.assign({ data, dataNum: _cartNum(data), codigo, qtde }, extra || {});
const PROG = [
  L('22/10/2026', '501059001', 400), L('22/10/2026', '501059002', 400),
  L('20/10/2026', '501149001', 1300),                                        // base: programada, fora da fila
  L('23/10/2026', '501159001', 200),
  L('21/10/2026', '501999001', 50),                                          // SEM UEP programado: vem primeiro
  L('21/10/2026', '501061001', 135),                                         // cronometrada: fora da fila
  L('19/10/2026', '501130005', 100, { adiantado: 40 }),                      // só o que ainda está aberto
  L('19/10/2026', '501094001', 300, { foraEsteira: true }),                  // fora da esteira não conta
  L('27/10/2026', '501094001', 900)];                                        // fora da janela
const UT = _filaUteis(new Date(2026, 9, 19), 5);
const F = _filaCronoMontar(CAT, AM, PROG, UT, 2530);   // cadastro de mentira na escala MADERO
const por = k => F.prog.concat(F.semProg).find(f => f.key === k) || null;

console.log('\n── FILA: quem entra e por quê ──');
// PADRÃO DE UEP (v7.152.0): a BASE é a MADERO — vale 1,00 por definição e não
// entra na fila. A SLEEP volta a ser produto comum: no limite da esteira.
ok('a BASE (MADERO) NÃO entra na fila', por('501149|MESA CABECEIRA MADERO'), null);
ok('SLEEP: no limite da esteira (o menor UEP × teto do cadastro)', por('501094|MESA CABECEIRA SLEEP').motivos, ['teto']);
ok('outro produto no mesmo limite: NO LIMITE DA ESTEIRA', por('501095|NICHO TESTE').motivos, ['teto']);
ok('STRASS: provisória (4 dias na amostra)', [por('501059|PENTEADEIRA CAMARIM STRASS').motivos, por('501059|PENTEADEIRA CAMARIM STRASS').dias], [['prov'], 4]);
ok('PUFF EVORA: estimada', por('501159|PUFF EVORA').motivos, ['est']);
ok('ELOA cronometrada (vigência DIGITADA) SAI da fila, mesmo com 2 dias', por('501061|PENTEADEIRA CAMARIM ELOA'), null);
ok('LUNA: família incoerente nos dois tamanhos, com a razão',
   [por('501130|MESA LATERAL LUNA 440').motivos, por('501130|MESA CENTRO LUNA 590').motivos, Math.round(por('501130|MESA LATERAL LUNA 440').famRazao * 10) / 10],
   [['fam'], ['fam'], Math.round(3.33 * teto(880) / (1.0 * teto(926)) * 10) / 10]);
ok('DALILA: sem medida da caixa', por('501150|COMODA DALILA NEW').motivos, ['sem-medida']);
ok('produto novo: SEM UEP', por('501999|PRODUTO NOVO').motivos, ['sem-uep']);

console.log('\n── FILA: a ordem e a programação ──');
ok('ordem: SEM UEP programado → maior UEP programada',
   F.prog.map(f => f.nome), ['PRODUTO NOVO', 'PENTEADEIRA CAMARIM STRASS', 'PUFF EVORA', 'MESA CENTRO LUNA 590']);
ok('STRASS programada: 800 cx e 400×2,71 + 400×2,29 = 2.000 UEP', [por('501059|PENTEADEIRA CAMARIM STRASS').progCx, Math.round(por('501059|PENTEADEIRA CAMARIM STRASS').progUep)], [800, 2000]);
ok('só o que está ABERTO (100 − 40 adiantadas)', por('501130|MESA CENTRO LUNA 590').progCx, 60);
const totEsperado = 2000 + 1300 * 1 + 200 * 1.54 + 135 * 2.4 + 60 * 1.0;
ok('a % da janela é sobre TODA a UEP programada (inclusive a base e a cronometrada; fora da esteira e fora da janela não contam)',
   [Math.round(F.totUep), Math.round(F.emDuvida), Math.round(F.pctDuvida * 10) / 10],
   [Math.round(totEsperado), Math.round(2000 + 308 + 60), Math.round((2000 + 308 + 60) / totEsperado * 1000) / 10]);
ok('contagem por motivo', F.cont, { 'sem-uep': 1, est: 1, prov: 1, teto: 2, fam: 2, 'sem-medida': 1 });
// TAKT s/CX (v7.141.0): 527 min × 60 ÷ META UEP × UEP da caixa, um por volume
ok('meta padrão (sem a do ⚙) é a do PADRÃO DE UEP, 2.530 (base MADERO)', _filaCronoMontar(CAT, AM, PROG, UT).metaUep, 2530);
ok('takt da STRASS por volume (2,71 · 2,29) com a meta de 2.530: 33,9 · 28,6 s',
   [por('501059|PENTEADEIRA CAMARIM STRASS').uepTxt, por('501059|PENTEADEIRA CAMARIM STRASS').taktTxt, F.metaUep], ['2,71 · 2,29', '33,9 · 28,6 s', 2530]);
ok('o takt segue a META UEP do ⚙ (com 2.100 a STRASS pede 40,8 · 34,5 s)',
   _filaCronoMontar(CAT, AM, PROG, UT, 2100).prog.find(f => f.nome === 'PENTEADEIRA CAMARIM STRASS').taktTxt, '40,8 · 34,5 s');
ok('sem UEP → takt "—", nunca 0', por('501999|PRODUTO NOVO').taktTxt, '—');
const F0 = _filaCronoMontar(CAT, null, null, UT, 2530);
ok('sem amostra: PROVISÓRIA não é avaliada (e diz); sem programação, tudo vai pelo volume',
   [!!por('501059|PENTEADEIRA CAMARIM STRASS') && F0.prog.length, F0.amostraLida, F0.progLida, F0.cont.prov], [0, false, false, 0]);

console.log('\n── FILA: o desenho ──');
const ctx = { data: '19/10/2026', hora: '08:00', amDe: '01/07/2026', amAte: '16/10/2026' };
const H = _filaCronoHtml(F, ctx);
ok('motivo com a explicação no title e a razão da família escrita',
   [H.includes('NO LIMITE DA ESTEIRA'), H.includes('FAMÍLIA INCOERENTE ' + fmt1(por('501130|MESA LATERAL LUNA 440').famRazao) + '×'), H.includes('PROVISÓRIA · 4 DIAS')], [true, true, true]);
ok('código sem UEP programado diz "sem UEP" no lugar do número', H.includes('>sem UEP<'), true);
ok('o papel diz como o produto SAI da fila', H.includes('UEP_VIGENCIA da linha vira "DIGITADA"'), true);
ok('coluna TAKT s/CX e a régua explicada no COMO A FILA É MONTADA (e que não é o TAKT IDEAL)',
   [H.includes('>TAKT s/CX</th>'), H.includes('>33,9 · 28,6 s<'), H.includes('= 12,5 s por UEP'), H.includes('Não é o TAKT IDEAL das configurações')], [true, true, true, true]);
ok('o relatório passa a META UEP do painel para o takt', /_filaCronoMontar\(CAP_RAW,.*, PONTOS_DIA\.metaUep\);/.test(pegaJs('async function gerarRelatorioFilaCrono(')), true);
ok('o desenho não faz conta', /_filaCronoMontar\(|_cartQtdAberta\(|_filaAmostraDeItens\(/.test(pegaJs('function _filaCronoHtml(')), false);
ok('aviso quando a amostra ou a programação não vieram',
   [_filaCronoHtml(F0, ctx).includes('PROVISÓRIA não foi avaliada'), _filaCronoHtml(F0, ctx).includes('A programação não foi lida')], [true, true]);
const G = pegaJs('async function gerarRelatorioFilaCrono(');
ok('leituras em SEQUÊNCIA: cadastro → amostra → programação',
   G.indexOf('_capBuscar()') < G.indexOf('await _filaAmostra()') && G.indexOf('await _filaAmostra()') < G.indexOf('await carregarProgramacaoDetalhada()'), true);
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
   [HC.includes('ABAIXO DO RITMO'), HC.includes('a diferença veio da META (da programação), não do ritmo da linha')], [true, true]);
ok('o desenho não faz conta', /_cxUepMontar\(|uepDiaMeta\(|_qpRealDia\(/.test(pegaJs('function _cxUepHtml(')), false);
ok('os dois botões na aba ⚖ UEP', [/onclick="gerarRelatorioFilaCrono\(\)"/.test(html), /onclick="gerarRelatorioCxUep\(\)"/.test(html)], [true, true]);
ok('cartão sem status não herda o vermelho do relatório de paradas',
   [/\.fila-doc \.kpi-card\{border-left-color:#cbd5e0\}/.test(JS), /\.cxu-doc \.kpi-card\{border-left-color:#cbd5e0\}/.test(JS)], [true, true]);

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
// v7.158.0: a regra da troca (amostra), o TROCAR A UEP e a CONFERÊNCIA DAS TROCAS
global.UCV_TROCA_MIN_VOL = eval('(' + pegaConst('UCV_TROCA_MIN_VOL') + ')');
global.UEP_PAD_MIN_MIN = eval('(' + pegaConst('UEP_PAD_MIN_MIN') + ')');
global.UCV_AINDA = eval('(' + pegaConst('UCV_AINDA') + ')');
global.UCV_CONF_ESTADO = eval('(' + pegaConst('UCV_CONF_ESTADO') + ')');
global.UCV_TROCANDO = false; global.UCV_PRONTAS = [];
global.UEP_PAD = null; global.UCV_LINHA = null; global.UCV_LINHA_VOO = null; global.UCV_REGS = null;
['function _phVal(', 'function _phAcc(', 'function _phAdd(', 'function _phMediaAparada(', 'function _uepPadJanela(', 'function _pgSimNum(', 'function _ucvLinhaItens(']
  .forEach(f => eval.call(global, pegaJs(f)));
// v7.146.1 (refatoração): a conta em três peças (base · cadastro · digitar) e o
// desenho em peças por bloco; os campos e o que fica guardado por _ucvEl/_ucvLe/_ucvGuarda.
const UCV_CONTA = ['function _uepConvBaseDe(', 'function _uepConvCadastro(', 'function _uepConvDigitar(', 'function _uepConvMontar(',
  'function _ucvLinhaDe(', 'function _ucvRegVol(', 'function _ucvRegValida(', 'function _ucvHash(', 'function _ucvRegMontar(',
  'function _ucvRegsDoProduto(', 'function _ucvRegsResumo(', 'function _ucvExclPode(', 'function _ucvExclConfirmaTxt(',
  'function _ucvExclResposta(', 'function _ucvExclConfere(', 'function _ucvRegUep(', 'function _ucvProntas(', 'function _ucvTrocaConfirmaTxt(',
  'function _ucvTrocaResposta(', 'function _ucvTrocaConfere(', 'function _ucvGravNum(', 'function _ucvConfMontar('];
const UCV_DESENHO = ['function _ucvU2(', 'function _ucvSeg(', 'function _ucvCard(', 'function _ucvTolTxt(', 'function _ucvTolFora(', 'function _ucvTpMed(',
  'function _uepConvRegua(', 'function _uepConvAvisoBase(', 'function _uepConvCadTxt(', 'function _uepConvNotasHtml(', 'function _uepConvBaseHtml(',
  'function _uepConvTrocaHtml(', 'function _uepConvHtml(', 'function _uepConvQual(', 'function _ucvLinhaHtml(', 'function _ucvRegsHtml(',
  'function _ucvHoras(', 'function _ucvVolTxt(', 'function _ucvListaHtml(', 'function _ucvTrocaHtml(', 'function _ucvAindaHtml(',
  'function _ucvProntasHtml(', 'function _ucvConfHtml(', 'function _ucvConfAvisoHtml('];
// "O desenho não faz conta" vale em TODAS as peças dele, e pelo parâmetro que
// cada uma recebe (R ou base): refazer a régua (_taktUep), o CONFERE (a faixa)
// ou qualquer divisão no desenho deixaria a tela contradizer a conta.
const UCV_SEM_CONTA = /\/ *100|\/ *(R|base)\.|_taktUep\(|UEP_PAD_FAIXA\[0\] *<=|_uepConvMontar\(|_uepConvBaseDe\(|_uepConvCadastro\(|_uepConvDigitar\(/;
['function _uepBaseCurto(', 'function _ucvEl(', 'function _ucvLe(', 'function _ucvGuarda(', 'function _uepConvProdutos(', 'function _uepConvAchar(']
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
ok('o desenho: CONFERE, o número e que a UEP fica', [H1.includes('CONFERE'), H1.includes('>2,22<'), H1.includes('PRODUTO_CODIGO'), H1.includes('NÃO PRECISA TROCAR'), H1.includes('TROCAR A UEP NO CADASTRO')],
   [true, true, true, true, false]);
ok('o desenho: rodando contra a meta sai mais LEVE; sem medição registrada, AINDA NÃO TROQUE (com o que ela dá) e conferir o tempo antes',
   [H2.includes('mais LEVE que o cadastro'), H2.includes('AINDA NÃO TROQUE'), H2.includes('<b>1,41</b>'), H2.includes('PARA TROCAR'), H2.includes('TROCAR A UEP NO CADASTRO'),
    H2.includes('CONFIRA O TEMPO ANTES DE TROCAR'), H2.indexOf('CONFIRA') < H2.indexOf('AINDA NÃO TROQUE')],
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
   [/tab==='crono'\)\{ _uepConvAtualiza\(\); _uepAbaCatCarregar\(\)\.then\(\(\)=>_ucvRegsCarregar\(\)\)\.then\(\(\)=>_ucvConfCarregar\(\)\); \}/.test(ST), /if\(_abaOn\('crono'\)\) _uepConvAtualiza\(\);/.test(pegaJs('async function _capBuscar(')),
    pegaJs('function renderUep(').includes('_uepConvAtualiza')], [true, true, false]);
ok('a pele do conversor é da aba nova', [/#sec-crono \.uep-conv-f\{/.test(html), /#sec-uep \.uep-conv/.test(html)], [true, false]);
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
    H1.includes('BASE PELA RÉGUA DA META: 12,5 s POR UEP'), H1.includes('VOLTAR À MADERO MEDIDA (7,9 s)')], [false, false, true, true]);
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
// orientação pede o tempo RODANDO; base mais lenta que a régua da meta é suspeita.
eval.call(global, pegaJs('function _uepConvGuia('));
ok('sem a base cronometrada, a orientação é o período (e diz que o método certo é rodando); com ela, rodando',
   [/NO PERÍODO/.test(_uepConvGuia(true)), /MADERO <b>com a linha rodando<\/b>/.test(_uepConvGuia(true)),
    /COM A LINHA RODANDO/.test(_uepConvGuia(false)), /NO PERÍODO/.test(_uepConvGuia(false))], [true, true, true, false]);
ok('a orientação é desenhada pelo _uepConvAtualiza (não é mais texto fixo no HTML)',
   [/id="uep-conv-guia"/.test(html), /_uepConvGuia\(/.test(pegaJs('function _uepConvAtualiza(')), html.includes('Use o tempo <b>NO PERÍODO</b> (paradas dentro): é a régua')], [true, true, false]);
ok('base mais lenta que a régua da meta é suspeita (o 17,6 do Encanto); a MADERO rodando a 8,7 s não é',
   [E7.base.suspeita, _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 2530).base.suspeita, E1.base.suspeita],
   [true, false, false]);
ok('o desenho cobra a conferência da base suspeita e, com a base, fala em tempo rodando',
   [H7.includes('não parece a MADERO com a linha rodando'), H7.includes('o tempo é o COM A LINHA RODANDO'),
    _uepConvHtml(_uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 2530)).includes('não parece a MADERO')], [true, true, false]);
ok('Encanto rodando 17,6 ÷ MADERO rodando 8,7 = 2,02', _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 2530).uepVol.toFixed(2), '2.02');
// v7.143.1: o label é flex em coluna — texto solto ao lado do nome da base virava
// três linhas ("s/VOLUME DA BASE (" · "SLEEP" · ")") e desalinhava os campos.
ok('o rótulo da base é UM item do label (texto e nome no mesmo span)',
   /<label[^>]*>s\/VOLUME DA BASE/.test(html), false);
// v7.143.1: depois da base vem o 📌 FIXAR — o Tab que volta ao PRODUTO é dele
ok('o último foco do conversor (o FIXAR) tem o Tab ligado; o campo da base não',
   [/id="uep-conv-fixar"[^>]*onkeydown="_uepConvTecla\(event\)"/.test(html), /id="uep-conv-base"[^>]*onkeydown=/.test(html)], [true, false]);
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
   [DI.includes(_uepConvHtml(E1)), DI.includes(_uepConvGuia(E1.base.daMeta)), DI.includes('NÃO PRECISA TROCAR'), DI.includes('>2,22<'),
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
const MONTA = 'const R = _uepConvMontar(UEP_CONV_PRODS, E.txt, E.seg, E.base, E.meta, E.tol, E.linha, E.regs);';
ok('tela e papel leem as entradas pela MESMA função e montam com a MESMA chamada',
   [/const E = _uepConvEntradas\(\);/.test(AT), /const E = _uepConvEntradas\(\);/.test(GC), AT.includes(MONTA), GC.includes(MONTA),
    (JS.match(/(?<!function )_uepConvEntradas\(\)/g) || []).length, /_uepConvDocHtml\(R, ctx\)/.test(GC), GC.indexOf('_uepConvAtualiza();') < GC.indexOf('_uepConvEntradas()')],
   [true, true, true, true, 5, true, true]);   // 5: tela, papel, o 💾 REGISTRAR (v7.150.0), o ✓ TROCAR A UEP e o 📄 IMPORTAR (v7.158.0)
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
  ok('o campo automático (o 10,4 antigo da meta) passa a mostrar a SLEEP medida; o digitado fica como está',
     [e1.base, campos['uep-conv-base'].value, e2.base, e1.meta, e1.txt, e1.seg], [7.9, '8,7', 8.7, 2530, 'ARMARIO ENCANTO', 27.8]);
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
ok('o botão 🖨 IMPRIMIR mora na aba ⏱ CRONOANÁLISE', html.slice(iCr, fCr).includes('onclick="gerarRelatorioCrono()"'), true);

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
    /title="[^"]*sem somar tolerância[^"]*"><span id="uep-conv-seg-rot">s\/VOLUME RODANDO<\/span>/.test(html)], [true, true, true]);
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
// lacunas 6,7; o NO PERÍODO dela não veio legível). Vale o RODANDO.
console.log('\n── CRONOANÁLISE → UEP: a MADERO medida é a base ──');
ok('a base medida é a MADERO rodando: 7,9 s em 20/10/2026, 60 volumes; período sem número',
   [UEP_BASE_MEDIDA.seg, UEP_BASE_MEDIDA.data, UEP_BASE_MEDIDA.volumes, UEP_BASE_MEDIDA.periodo, UEP_BASE_MEDIDA.semLacunas], [7.9, '20/10/2026', 60, null, 6.7]);
{ const SM = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 7.9, 3048, 15), HS = _uepConvHtml(SM);
  ok('com 7,9 a base é a MEDIDA: sem aviso nenhum, régua com data e volumes, tolerância entra (7,9 → 9,1 s)',
     [SM.base.medida, SM.base.daMeta, HS.includes('uep-conv-av'), HS.includes('a MADERO cronometrada com a linha rodando (20/10/2026, 60 volumes)'),
      SM.base.tolAplica, SM.base.tpSeg.toFixed(3)], [true, false, false, true, true, '9.085']);
  ok('o caso real: Encanto rodando 17,6 ÷ MADERO rodando 7,9 = 2,23 (o cadastro na base MADERO)', SM.uepVol.toFixed(2), '2.23');
  const SD = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.6, 3048, 15), HD = _uepConvHtml(SD);
  ok('outro tempo (8,6) é BASE DIGITADA, com o botão de voltar à MADERO medida',
     [SD.base.medida, HD.includes('BASE DIGITADA: 8,6 s POR VOLUME DA MADERO'), HD.includes('A MADERO medida é 7,9 s (20/10/2026)'), HD.includes('VOLTAR À MADERO MEDIDA (7,9 s)')],
     [false, true, true, true]);
  ok('igual a uma casa É a medida (7,94 sim, 8,0 não)', [_uepConvBaseDe(7.94, 3048).medida, _uepConvBaseDe(8, 3048).medida, _uepConvBaseDe(0, 3048).medida], [true, false, false]);
}
{ const B1 = _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 7.9, 7.9, 2530, 15), B2 = _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 8.6, 7.9, 2530, 15);
  ok('a própria MADERO: o tempo da base em uso diz que é ela; tempo novo manda FIXAR (neste computador)',
     [B1.emUso, _uepConvHtml(B1).includes('7,9 s é a base em uso'), _uepConvHtml(B1).includes('📌 FIXAR</b>'),
      B2.emUso, _uepConvHtml(B2).includes('clique em <b>📌 FIXAR</b> para usar 8,6 s como base neste computador')],
     [true, true, false, false, true]);
}
ok('o COMO LER com a base cronometrada cita a MADERO medida e as lacunas dentro nos dois',
   [_uepConvGuia(false).includes('a MADERO deu 7,9 s'), _uepConvGuia(false).includes('as lacunas ficam dentro'), _uepConvGuia(true).includes('7,9 s, medida em 20/10/2026')], [true, true, true]);
{ // a tela: vazio mostra 7,9; apagado COM O FOCO continua valendo a medida (não pula para a meta)
  const docAntes = global.document, pdAntes = global.PONTOS_DIA;
  const base = { value: '', dataset: {} };
  const campos = { 'uep-conv-prod': { value: '' }, 'uep-conv-seg': { value: '' }, 'uep-conv-base': base, 'uep-conv-tol': { value: '' } };
  global.document = { activeElement: null, getElementById: id => campos[id] || null };
  global.PONTOS_DIA = { metaUep: 3048 };
  const eV = _uepConvEntradas();
  const r1 = [eV.base, base.value, base.dataset.auto, base.placeholder];
  base.value = ''; base.dataset.auto = ''; global.document.activeElement = base;
  const eF = _uepConvEntradas();
  ok('campo vazio: mostra 7,9 (automático) e vale 7,9; apagado com o foco: fica vazio e vale 7,9',
     [r1, [eF.base, base.value]], [[7.9, '7,9', '1', 'MADERO 7,9'], [7.9, '']]);
  global.document = docAntes; global.PONTOS_DIA = pdAntes;
}
ok('o título do campo diz que vazio é a MADERO medida (e não mais a régua da meta)',
   [/id="uep-conv-base"/.test(html), /title="[^"]*Vazio, vale a MADERO medida em 20\/10\/2026: 7,9 s[^"]*"><span>s\/VOLUME DA BASE/.test(html)], [true, true]);

// QUAL NÚMERO DO VOLUME A VOLUME (v7.149.0, PPCP: "deixa claro no painel qual
// medida eu coloco para comparar com sleep")
{ const QM = _uepConvQual(_uepConvBaseDe(7.9, 2530)), QR = _uepConvQual(_uepConvBaseDe(0, 2530)), QD = _uepConvQual(_uepConvBaseDe(8.6, 2530));
  const usa = h => (h.match(/<div class="ucv-q usa"><span class="ucv-q-l">([^<]+)</) || [])[1];
  // O NO PERÍODO da MADERO não veio legível: o cartão diz "não use" sem número (nunca inventa).
  ok('com a MADERO medida o destaque é o RODANDO, com os 7,9 dela; os outros dois dizem "não use" — com o número só quando a medição tem',
     [usa(QM), QM.includes('a MADERO deu <b>7,9 s</b> aqui'), /POR VOLUME NO PERÍODO<\/span><span class="ucv-q-s">com as paradas<\/span><span class="ucv-q-v">não use<\/span>/.test(QM),
      QM.includes('não use · MADERO 6,7 s'), (QM.match(/ucv-q usa/g) || []).length],
     ['POR VOLUME COM A LINHA RODANDO', true, true, true, 1]);
  ok('com a régua da meta o destaque é o NO PERÍODO (base 12,5); com base digitada, o RODANDO com o número dela',
     [usa(QR), QR.includes('base: a régua da meta, 12,5 s'), usa(QD), QD.includes('base digitada: 8,6 s'), QD.includes('MADERO 6,7')],
     ['POR VOLUME NO PERÍODO', true, 'POR VOLUME COM A LINHA RODANDO', true, false]);
  ok('os nomes são os do app (Volume a volume) e o desenho não faz conta',
     [['POR VOLUME NO PERÍODO', 'POR VOLUME COM A LINHA RODANDO', 'SEM AS LACUNAS'].every(t => QM.includes(t)), UCV_SEM_CONTA.test(pegaJs('function _uepConvQual('))], [true, false]);
  const AT2 = pegaJs('function _uepConvAtualiza('), DH = pegaJs('function _uepConvDocHtml(');
  ok('a faixa vai na tela (logo abaixo dos campos) e no papel; o rótulo do campo segue a régua',
     [/guia\.innerHTML = _uepConvQual\(R\.base\) \+ _uepConvGuia/.test(AT2), /_uepConvQual\(R\.base\) \+ _uepConvGuia/.test(DH),
      /rot\.textContent = R\.base\.daMeta \? 's\/VOLUME NO PERÍODO' : 's\/VOLUME RODANDO'/.test(AT2), /\.ucv-doc \.ucv-q\.usa\{/.test(html)],
     [true, true, true, true]);
  ok('o cartão MEDIDO diz de qual cartão do app veio o número',
     [_uepConvHtml(_uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 7.9, 3048)).includes('>MEDIDO · RODANDO<'), H1.includes('>MEDIDO · NO PERÍODO<')], [true, true]);
}

// ════════════════════════════════════════════════════════════════════════════
// O QUE A LINHA FAZ + REGISTRO DA MEDIÇÃO (v7.150.0, PPCP: "pode fazer tbm
// guardar o que é cronoanalise e que linha faz" → os dois)
console.log('\n── CRONOANÁLISE → UEP: a linha faz e o registro ──');
{ // MADERO em 4 dias: 300/2h · 400/2h · 500/2h · e um dia com DUAS cores na mesma hora (300 cx em 2 horas DISTINTAS)
  const IT = (data, cor, cx, hs, nome) => ({ data, modelo:'501149', nome:nome || 'MESA CABECEIRA MADERO', cor, caixas:cx, horas:hs.length, horasLista:hs });
  const ITENS = [IT('01/10/2026', 'BRANCO', 300, ['07:00', '08:00']), IT('02/10/2026', 'BRANCO', 400, ['07:00', '08:00']),
    IT('03/10/2026', 'BRANCO', 500, ['07:00', '08:00']), IT('06/10/2026', 'BRANCO', 200, ['07:00', '08:00']),
    IT('06/10/2026', 'CINZA/CINAMOMO', 100, ['08:00']), IT('06/10/2026', 'BRANCO', 999, ['09:00'], 'MESA CABECEIRA SLEEP'),
    { data:'07/10/2026', modelo:'501149', nome:'MESA  CABECEIRA   MADERO', caixas:0, horasLista:['07:00'] }];
  const pM = PRODS.find(p => p.rot === '501149 · MESA CABECEIRA MADERO');
  const L = _ucvLinhaDe(ITENS, pM);
  ok('A LINHA FAZ: horas DISTINTAS por dia (duas cores na mesma hora = uma hora) e média APARADA (sai um 150 e o 250) — 700 cx ÷ 4 h',
     [L.dias, L.cx, Math.round(L.cxh), L.sCx.toFixed(2), L.aparada], [4, 1500, 175, '20.57', true]);
  ok('produto que não rodou na janela: null (nada para comparar), nunca zero', _ucvLinhaDe(ITENS, PRODS.find(p => p.rot === '501139 · ARMARIO ENCANTO')), null);
  const RM = _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 8.6, 7.9, 3048, 15, ITENS), HM = _uepConvHtml(RM);
  ok('o montar põe a linha ao lado da cronoanálise: 8,6 ÷ 20,6 = a linha entrega 41,8% do ritmo rodando',
     [RM.linhaEst, Math.round(RM.linha.cxh), RM.linhaPct.toFixed(1), HM.includes('A LINHA FAZ'), HM.includes('<b>20,6 s</b>'), HM.includes('175 cx/h'), HM.includes('a linha entrega <b>41,8%</b>')],
     ['ok', 175, '41.8', true, true, true, true]);
  ok('lendo · falhou · não rodou: a tela diz qual, sem número inventado',
     [_uepConvHtml(_uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 8.6, 7.9, 3048, 15, 'lendo')).includes('lendo a produção dos últimos 30 dias'),
      _uepConvHtml(_uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 8.6, 7.9, 3048, 15, 'falhou')).includes('não foi lida'),
      _uepConvHtml(_uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 7.9, 3048, 15, ITENS)).includes('não rodou nos últimos 30 dias'),
      _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 7.9, 3048, 15, ITENS).linhaPct],
     [true, true, true, null]);
  ok('sem o 7º parâmetro (chamador antigo) nada muda na conversão', _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 8.6, 7.9, 3048, 15).uepVol.toFixed(4), RM.uepVol.toFixed(4));
  ok('a janela é a do bloco 7 (30 dias fechados, hoje fora) e reaproveita a leitura dele',
     [_uepPadJanela(30, new Date(2026, 9, 20)), /UEP_PAD && UEP_PAD\.de === J\.de && UEP_PAD\.ate === J\.ate/.test(pegaJs('function _ucvLinhaItens('))],
     [{ de:'20/09/2026', ate:'19/10/2026' }, true]);

  // os campos do registro
  const H = '20/10/2026';
  // v7.158.0: data e volumes obrigatórios (a data vazia virava HOJE — a 2ª da STRASS saiu 26/10 sem ter rodado no dia)
  ok('data vazia NÃO vira hoje: não grava e pede o dia da medição', [!!_ucvRegValida(8.6, { vol:'60' }, H).erro, /dia em que a medição foi feita/.test(_ucvRegValida(8.6, { vol:'60' }, H).erro)], [true, true]);
  ok('volumes vazios: não grava (são a amostra da troca)', [!!_ucvRegValida(8.6, { data:H }, H).erro, /VOLUMES MEDIDOS/.test(_ucvRegValida(8.6, { data:H }, H).erro)], [true, true]);
  const RV = (seg, F) => _ucvRegValida(seg, Object.assign({ data:H, vol:'60' }, F), H);
  ok('com data e volumes, o resto vazio fica vazio (nunca 0)', RV(8.6, {}), { data:H, per:null, lac:null, vol:60, vel:null, quem:'' });
  ok('números em pt-BR e o nome cortado em 40', RV(8.6, { per:'9,4', lac:'7,1', vol:'60', vel:'9', quem:'  Maurício ' }),
     { data:H, per:9.4, lac:7.1, vol:60, vel:9, quem:'Maurício' });
  const E1v = RV(8.6, { per:'7,9' }), E2v = RV(8.6, { lac:'9,1' });
  ok('NO PERÍODO menor que o RODANDO, ou SEM AS LACUNAS maior: campos trocados — não grava',
     [/menor que o RODANDO/.test(E1v.erro), /trocados/.test(E1v.erro), /maior que o RODANDO/.test(E2v.erro)], [true, true, true]);
  ok('data no futuro, data torta, texto no número: não grava',
     [!!RV(8.6, { data:'21/10/2026' }).erro, !!RV(8.6, { data:'2/10/26' }).erro, !!RV(8.6, { vol:'abc' }).erro, !!RV(8.6, { per:'0' }).erro],
     [true, true, true, true]);

  // v7.150.1 — o 1º registro real gravou NO PERÍODO 1335: "13:35" perdia os dois pontos no _pgSimNum
  ok('"13:35", "8,6 s" e "1.335,0" não são número de segundos: não grava (o "13:35" virava 1335)',
     [!!RV(8.6, { per:'13:35' }).erro, !!RV(8.6, { per:'9,4 s' }).erro, !!RV(8.6, { per:'1.335,0' }).erro,
      RV(8.6, { per:'9.4' }).per], [true, true, true, 9.4]);
  ok('NO PERÍODO acima de 5× o RODANDO é o tempo total, não o por volume: não grava (até 5× grava)',
     [/mais de 5 vezes o RODANDO/.test(RV(7.9, { per:'1335' }).erro || ''), RV(7.9, { per:'39' }).per], [true, 39]);
  ok('RODANDO fora do plausível (0 ou acima de 120 s por volume): não grava',
     [!!RV(0, {}).erro, !!RV(836, {}).erro, RV(119, {}).erro], [true, true, undefined]);
  // a linha da planilha
  const V = RV(8.6, { per:'9,4', lac:'7,1', vol:'60', quem:'PPCP' });
  const D = _ucvRegMontar(RM, V, { de:'20/09/2026', ate:'19/10/2026' });
  ok('a linha da planilha: os segundos da medição, a conversão do momento e o que a linha faz',
     [D.data, D.modelo, D.produto, D.volume, D.sRod, D.sPer, D.sLac, D.volumes, D.base, D.baseS, D.tol, D.tpS, D.uep, D.uepCad, D.linhaCxh, D.linhaSCx, D.linhaDias, D.linhaPer, D.vel, D.quem],
     [H, '501149', 'MESA CABECEIRA MADERO', 'VOL 1/1', 8.6, 9.4, 7.1, 60, 'MADERO MEDIDA 20/10/2026', 7.9, 15, 9.89, 1.09, 1, 175, 20.57, 4, '20/09/2026 a 19/10/2026', '', 'PPCP']);
  ok('o REG_ID sai do conteúdo: a mesma medição dá o mesmo id (o 2º clique não duplica); outra medição, outro id',
     [D.regId === _ucvRegMontar(RM, V, null).regId, D.regId === _ucvRegMontar(RM, Object.assign({}, V, { lac:7 }), null).regId, /^c[0-9a-z]+$/.test(D.regId)],
     [true, false, true]);
  const PS = PRODS.find(p => p.rot === '501059 · PENTEADEIRA CAMARIM STRASS'), PV = PRODS.find(p => p.rot === '501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2');
  ok('o volume vai como texto que o Sheets não vira data (o "1/2" viraria)', [_ucvRegVol(pM), _ucvRegVol(PS), _ucvRegVol(PV)], ['VOL 1/1', 'JOGO 2 VOL', 'VOL 2/2']);
  ok('base da régua da meta e base digitada ficam ditas na linha',
     [_ucvRegMontar(_uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 9.5, 10.4, 3048, 15), V, null).base,
      _ucvRegMontar(_uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 9.5, 8.2, 3048, 15), V, null).base,
      _ucvRegMontar(_uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 9.5, 10.4, 3048, 15), V, null).tol],
     ['RÉGUA DA META', 'DIGITADA', 0]);

  // a regra da troca: v7.150.0 duas datas; v7.158.0 (PPCP, 26/10/2026: "não dá para travar em duas datas diferentes") AMOSTRA
  const RG = (data, uep, uepCad, extra) => Object.assign({ data, modelo:'501149', produto:'MESA CABECEIRA MADERO', volume:'VOL 1/1', uep, uepCad, volumes:40 }, extra || {});
  ok('UM dia só, com amostra (30+ volumes), os dois mais LEVES: pode trocar — a data não trava mais',
     [_ucvRegsResumo([RG(H, 1.05, 1.2), RG(H, 1.06, 1.2)]).veredito, _ucvRegsResumo([RG(H, 1.05, 1.2), RG(H, 1.06, 1.2)]).nDias], ['trocar', 1]);
  ok('UMA medição de 30 volumes basta; de 29 é amostra pequena',
     [_ucvRegsResumo([RG(H, 1.05, 1.2, { volumes:30 })]).veredito, _ucvRegsResumo([RG(H, 1.05, 1.2, { volumes:29 })]).veredito], ['trocar', 'pouca-amostra']);
  ok('volumes somam entre medições (11 + 19 = 30)', _ucvRegsResumo([RG(H, 1.05, 1.2, { volumes:11 }), RG('17/10/2026', 1.04, 1.2, { volumes:19 })]).veredito, 'trocar');
  ok('dois dias, um fora e um dentro da faixa: discordam (mesmo com amostra)', _ucvRegsResumo([RG(H, 1.05, 1.2), RG('17/10/2026', 1.12, 1.2)]).veredito, 'discordam');
  ok('dentro da faixa: a UEP fica (mesmo com amostra pequena)', [_ucvRegsResumo([RG(H, 1.11, 1.2), RG('17/10/2026', 1.14, 1.2)]).veredito, _ucvRegsResumo([RG(H, 1.11, 1.2, { volumes:5 })]).veredito], ['confere', 'confere']);
  ok('medição sem VOLUMES MEDIDOS não entra; só ela = sem-volumes',
     [_ucvRegsResumo([RG(H, 1.05, 1.2, { volumes:null })]).veredito, _ucvRegsResumo([RG(H, 1.05, 1.2, { volumes:null }), RG(H, 1.12, 1.2)]).veredito],
     ['sem-volumes', 'confere']);
  // o caso real: STRASS VOL 2/2, 11,5 s × 61 e 12,4 s × 52 contra a MADERO 7,9 s; cadastro 2,29
  const ST2 = (data, sRod, volumes, uep) => ({ data, modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', sRod, baseS:7.9, uep, uepCad:2.29, volumes });
  const SS = _ucvRegsResumo([ST2('26/10/2026', 12.4, 52, 1.57), ST2('23/10/2026', 11.5, 61, 1.46)], 2.29);
  ok('STRASS VOL 2/2: média pelos SEGUNDOS pesada pelos volumes = 1,51 (a média das UEP arredondadas dava 1,52)',
     [SS.veredito, SS.nVol, _ucvU2(SS.uepMed), SS.datas], ['trocar', 113, '1,51', ['23/10/2026', '26/10/2026']]);
  ok('a regra é contra o cadastro de AGORA: depois de trocado para 1,51, as mesmas medições conferem',
     _ucvRegsResumo([ST2('26/10/2026', 12.4, 52, 1.57), ST2('23/10/2026', 11.5, 61, 1.46)], 1.51).veredito, 'confere');
  ok('o filtro do produto: mesmo modelo, nome e volume', _ucvRegsDoProduto([RG(H, 1, 1), RG(H, 1, 1, { volume:'JOGO 2 VOL' }), RG(H, 1, 1, { modelo:'501094' })], pM).length, 1);
  const HR = _ucvRegsHtml([RG(H, 1.05, 1.2, { sRod:8.6, linhaSCx:20.57 })], pM, null);
  ok('a lista diz a regra e mostra os segundos, a UEP e o que a linha faz',
     [HR.includes('1 medição · 40 volumes'), HR.includes('pode trocar a UEP'), HR.includes('<b>8,6 s</b>'), HR.includes('20,6 s/cx'), HR.includes('<b>1,05</b>')],
     [true, true, true, true, true]);
  ok('amostra pequena: a lista diz quantos volumes faltam para a regra',
     _ucvRegsHtml([RG(H, 1.05, 1.2, { volumes:11 })], pM, null).includes('11 volumes (a troca pede 30)'), true);
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
    sRod:16.2, uep:2.05, uepCad:2.1, em:'26/10/2026 08:55', regId }, extra || {});
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
  ok('o cabeçalho tem a coluna do botão (mesmo nº de th e td)',
     [(HX.match(/<th[ >]/g) || []).length, (HX.split('<tr>')[2].match(/<td[ >]/g) || []).length], [12, 12]);
  const CT = _ucvExclConfirmaTxt(RX('c1abc'));
  ok('a confirmação diz qual medição, que a UEP NÃO muda e onde fica a cópia',
     ['MESA CABECEIRA MADERO', 'VOL 1/1', 'medida em 21/10/2026', 'rodando 16,2 s', 'UEP 2,05', 'registrada em 26/10/2026 08:55', 'A UEP do cadastro NÃO muda', 'CRONO_EXCLUIDOS'].filter(t => !CT.includes(t)), []);
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
  ok('a mensagem mora FORA da lista (refeita a cada tecla) e a lista sabe da exclusão em curso',
     [html.indexOf('id="uep-conv-x-msg"') > html.indexOf('id="uep-conv-regs"'), /_ucvEl\('x-msg'\)/.test(XC),
      /UCV_REGS && UCV_REGS\.falha, UCV_EXCL, R\.volCad\)/.test(pegaJs('function _ucvRegPintar('))], [true, true, true]);
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
     [html.indexOf('id="uep-conv-reg"') > html.indexOf('id="uep-conv-res"'), /box\.style\.display = R\.estado === 'ok'/.test(pegaJs('function _ucvRegPintar(')), /_ucvRegPintar\(R\)/.test(AT3)],
     [true, true, true]);
  ok('a leitura da linha só sai com produto escolhido, uma de cada vez (espera a das medições)',
     [/if\(R\.p && \(E\.linha === 'nao-lida' \|\| E\.linha === 'falhou'\)\) _ucvLinhaCarregar\(\)/.test(AT3), /if\(UCV_REGS_VOO\) await UCV_REGS_VOO/.test(pegaJs('function _ucvLinhaCarregar('))],
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
// (26/10) contra a MADERO 7,9 s; cadastro 2,29.
console.log('\n── CRONOANÁLISE → UEP: trocar pelas medições e a conferência ──');
{ const ROT = '501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2';
  const ST2 = (data, sRod, volumes, uep, extra) => Object.assign({ data, modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', sRod, baseS:7.9, uep, uepCad:2.29, volumes, regId:'c' + data.slice(0, 2) }, extra || {});
  const REGS = [ST2('26/10/2026', 12.4, 52, 1.57), ST2('23/10/2026', 11.5, 61, 1.46),
                { data:'19/10/2026', modelo:'501139', produto:'ARMARIO ENCANTO', volume:'VOL 1/1', sRod:17.6, baseS:7.9, uep:2.23, uepCad:2.23, volumes:11 },
                { data:'20/10/2026', modelo:'501149', produto:'MESA CABECEIRA MADERO', volume:'VOL 1/1', sRod:7.9, baseS:7.9, uep:1, uepCad:1.2, volumes:60 }];
  const RS = _uepConvMontar(PRODS, ROT, 0, 7.9, 2530, 15, undefined, REGS), HS = _uepConvHtml(RS);
  ok('sem tempo digitado, as medições registradas liberam a troca: 1,51 no 501.059.002 (o VOL 1/2 não entra)',
     [RS.estado, _ucvU2(RS.troca.uep), _ucvU2(RS.troca.antes), Math.round(RS.troca.difPct), RS.troca.digitar.map(g => [g.uep, g.cods.map(c => c.cod)])],
     ['sem-tempo', '1,51', '2,29', -34, [[1.51, ['501059002']]]]);
  ok('o desenho da troca: PODE TROCAR, a média, a amostra, as datas e o botão (só da tela)',
     [HS.includes('PODE TROCAR · PELAS MEDIÇÕES REGISTRADAS'), HS.includes('<b>1,51</b>'), HS.includes('2 medições · 113 volumes'), HS.includes('(23/10/2026, 26/10/2026)'),
      HS.includes('<div class="ucv-troca-bt so-tela"><button type="button" class="btn btn-acc" id="uep-conv-troca" onclick="_ucvTrocar()">✓ TROCAR A UEP NO CADASTRO</button>')],
     [true, true, true, true, true]);
  const RT = _uepConvMontar(PRODS, ROT, 12.4, 7.9, 2530, 15, undefined, REGS), HT = _uepConvHtml(RT);
  ok('com o tempo da medição digitado (12,4 s → 1,57): os cartões são DELA, mas a troca é a das registradas (1,51) — o caso do print',
     [_ucvU2(RT.uepVol), HT.includes('>1,57<'), HT.includes('PODE TROCAR'), HT.includes('<b>1,51</b>'), HT.includes('PARA TROCAR'), HT.includes('AINDA NÃO TROQUE')],
     ['1,57', true, true, true, false, false]);
  ok('sem medição registrada do volume: AINDA NÃO TROQUE, pede o registro; lista não lida: diz que não leu',
     [_uepConvHtml(_uepConvMontar(PRODS, ROT, 12.4, 7.9, 2530, 15, undefined, [])).includes('nenhuma medição registrada deste volume'),
      _uepConvHtml(_uepConvMontar(PRODS, ROT, 12.4, 7.9, 2530, 15, undefined, null)).includes('ainda não foram lidas'),
      _uepConvMontar(PRODS, ROT, 12.4, 7.9, 2530, 15, undefined, []).troca], [true, true, undefined]);
  const RP = _uepConvMontar(PRODS, ROT, 12.4, 7.9, 2530, 15, undefined, [ST2('26/10/2026', 12.4, 20, 1.57)]);
  ok('amostra pequena (20 volumes): AINDA NÃO TROQUE com quantos faltam', [RP.troca, _uepConvHtml(RP).includes('20 volumes (a troca pede 30)'), RP.regRes.veredito], [undefined, true, 'pouca-amostra']);
  ok('a BASE (MADERO) nunca ganha troca, mesmo com medições que "liberariam"',
     _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 7.9, 7.9, 2530, 15, undefined, REGS).troca, undefined);
  ok('o JOGO (produto inteiro) e o volume são medições diferentes: as do VOL 2/2 não liberam o JOGO',
     _uepConvMontar(PRODS, '501059 · PENTEADEIRA CAMARIM STRASS', 30, 0, 2530, 15, undefined, REGS).troca, undefined);
  // as prontas
  const PR = _ucvProntas(REGS, PRODS);
  ok('PRONTAS PARA TROCAR: só o STRASS VOL 2/2 (o ENCANTO confere; a MADERO é a base)', [PR.map(x => x.p.rot), _ucvU2(PR[0].uep)], [[ROT], '1,51']);
  const HP = _ucvProntasHtml(PR);
  ok('as prontas: botão que abre o volume pelo índice (nada do nome no clique)', [HP.includes('onclick="_ucvAbrirPronta(0)"'), HP.includes('<b>2,29 → 1,51</b>'), _ucvProntasHtml([])], [true, true, '']);
  // a confirmação e as respostas
  const CT = _ucvTrocaConfirmaTxt(RS, '26/10/2026');
  ok('a confirmação diz o que muda, de onde vem e quando vale',
     [ROT, '2,29 → 1,51 por volume (-34,1%)', '1,51 — 501.059.002 BRANCO', '2 medições, 113 volumes (23/10/2026, 26/10/2026)',
      'Vale a partir de hoje (26/10/2026)', 'os dias fechados não mudam', 'planilha de programação'].filter(t => !CT.includes(t)), []);
  ok('a resposta: trocou · já estava · recusou (com o motivo) · .gs antigo (cai no getDados)',
     [_ucvTrocaResposta({ ok:true, trocado:true, n:3, vigencia:'26/10/2026' }).tipo, _ucvTrocaResposta({ ok:true, trocado:true, jaTrocado:true }).tipo,
      _ucvTrocaResposta({ ok:true, trocado:false, recusado:true, erro:'as medições somam menos de 30 volumes' }).txt.includes('menos de 30 volumes'),
      _ucvTrocaResposta({ ok:true, slots:[] }).tipo, /v5\.34/.test(_ucvTrocaResposta({ ok:true }).txt),
      _ucvTrocaResposta({ ok:true, trocado:true, n:3, versaoErro:'x' }).txt.includes('NÃO FICOU REGISTRADA')],
     ['ok', 'ja', true, 'velho', true, true]);
  ok('sem resposta ≠ não trocou: o cadastro relido decide; cadastro que não veio não decide',
     [_ucvTrocaConfere([{ codigo:'501.059.002', uep:1.51 }], RS.troca.digitar).tipo, _ucvTrocaConfere([{ codigo:'501059002', uep:2.29 }], RS.troca.digitar).tipo,
      _ucvTrocaConfere(null, RS.troca.digitar).tipo], ['trocou', 'nao', 'incerto']);
  ok('o plural é "medições", nunca "mediçãoões" (o defeito da lista do print de 26/10)', [/medição\$\{/.test(JS), _ucvRegsHtml(REGS.slice(0, 2), PRODS.find(p => p.rot === ROT), null).includes('2 medições ·')], [false, true]);
  // a paridade da regra: painel (_ucvRegsResumo) × .gs (_cronoTrocaRegra), nos mesmos casos
  const GS = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');
  const pegaGs = a => { const i = GS.indexOf(a); let k = GS.indexOf('{', GS.indexOf(')', i)), n = 0, j = k; for(; j < GS.length; j++){ if(GS[j] === '{') n++; else if(GS[j] === '}' && --n === 0) break; } return GS.slice(i, j + 1); };
  const gConst = n => eval('(' + new RegExp('const ' + n + ' = ([^;]+);').exec(GS)[1] + ')');
  ok('as constantes da regra são as mesmas no painel e no .gs', [gConst('CRONO_TROCA_MIN_VOL_GS'), gConst('CRONO_TROCA_FAIXA_GS')], [UCV_TROCA_MIN_VOL, UEP_PAD_FAIXA]);
  const G = new Function('CRONO_TROCA_FAIXA_GS', 'CRONO_TROCA_MIN_VOL_GS', pegaGs('function _cronoTrocaRegra(') + '\nreturn _cronoTrocaRegra;')(gConst('CRONO_TROCA_FAIXA_GS'), gConst('CRONO_TROCA_MIN_VOL_GS'));
  const CASOS = [[REGS.slice(0, 2), 2.29], [REGS.slice(0, 2), 1.51], [[ST2('26/10/2026', 12.4, 29, 1.57)], 2.29], [[ST2('26/10/2026', 12.4, 52, 1.57), ST2('23/10/2026', 19, 61, 2.4)], 2.29],
                 [[ST2('26/10/2026', 12.4, null, 1.57)], 2.29], [[ST2('26/10/2026', 0, 40, 1.57, { baseS:0 })], 2.29], [[ST2('26/10/2026', 12.4, 40, 1.57)], 0],
                 [[ST2('26/10/2026', 22, 40, 2.78)], 2.29], [[ST2('26/10/2026', 0, 0, 0)], 2.29]];
  ok('a regra do painel e a do .gs dão o MESMO veredito, amostra e média em todos os casos',
     CASOS.map(([r, c]) => { const a = _ucvRegsResumo(r, c), b = G(r, c); return [a.veredito === b.veredito, a.nVol === b.nVol, (a.uepMed || 0).toFixed(6) === (b.uepMed || 0).toFixed(6)]; }).filter(x => x.includes(false)), []);
  // a conferência das trocas
  const TC = (prod, dias, extra) => Object.assign({ modelo:'501059', produto:prod, volume:'VOL 2/2', amostra:'2 medições, 113 volumes', gravado:'26/10/2026 10:40', vig:'26/10/2026',
    codigos:[{ cod:'501059002', uep:1.51, antes:2.29, atual:1.51 }], substituida:false, dias }, extra || {});
  const DIA = (data, min, cx) => ({ data, dn:0, min, horas:min / 60, cx, uep:Math.round(cx * 1.51 * 100) / 100 });
  const CM = _ucvConfMontar([
    TC('PENTEADEIRA CAMARIM STRASS', [DIA('28/10/2026', 120, 380)]),                                    // 573,8 de 576,1 → 99,6%
    TC('P ABAIXO', [DIA('28/10/2026', 120, 250)]),                                                       // 65,5%
    TC('P ACIMA', [DIA('28/10/2026', 60, 160), DIA('29/10/2026', 60, 160)]),                             // 83,9%… ×2 dias = 83,9% → não; ajustado abaixo
    TC('P ESPERA', [DIA('28/10/2026', 60, 190)]),                                                        // 1 h: aguardando
    TC('P VELHA', [], { gravado:'20/10/2026 09:00' }), TC('P VELHA', [DIA('28/10/2026', 120, 500)], { gravado:'27/10/2026 08:00' }),
    TC('P SUBST', [DIA('28/10/2026', 120, 380)], { substituida:true })], 2530);
  const est = n => (CM.lista.find(x => x.rot === '501059 · ' + n + ' · VOL 2/2') || {}).estado;
  ok('a conferência: 99,6% CONFERE, 65% ▲ SUBIR?, 1 h AGUARDANDO, UEP mudada depois = SUBSTITUÍDA',
     [est('PENTEADEIRA CAMARIM STRASS'), fmtP(CM.lista.find(x => x.rot.includes('STRASS')).pct), est('P ABAIXO'), est('P ESPERA'), est('P SUBST')],
     ['confere', '99,6%', 'abaixo', 'aguardando', 'substituida']);
  ok('a troca mais NOVA do volume é a que vale (a anterior foi substituída por ela): 500 cx em 2 h = 131% ▼ DESCER?',
     [CM.lista.filter(x => x.rot.includes('P VELHA')).length, est('P VELHA'), Math.round(CM.lista.find(x => x.rot.includes('P VELHA')).pct)], [1, 'acima', 131]);
  ok('os alertas vêm primeiro e são contados', [CM.lista.slice(0, CM.nAlerta).every(x => x.estado === 'abaixo' || x.estado === 'acima'), CM.nAlerta], [true, 3]);
  const HC = _ucvConfHtml(CM, null);
  ok('o desenho da conferência: os alertas com a direção, o quanto falta para julgar e que nada muda sozinho',
     [HC.includes('▲ SUBIR?'), HC.includes('▼ DESCER?'), HC.includes('CONFERE'), HC.includes('1 h de 2 h sozinho para julgar'), HC.includes('a UEP não muda sozinha'), HC.includes('2,29 → <b>1,51</b>')],
     [true, true, true, true, true, true]);
  ok('a conferência sem o .gs novo, sem troca, sem leitura; e o aviso do topo só com alerta',
     [_ucvConfHtml(null, 'sem-endpoint').includes('.gs v5.34'), _ucvConfHtml({ lista:[], nAlerta:0 }, null).includes('Nenhuma UEP trocada'), _ucvConfHtml(null, null),
      _ucvConfAvisoHtml(CM).includes('3 UEP trocadas fora do padrão'), _ucvConfAvisoHtml({ lista:[], nAlerta:0 }), _ucvConfAvisoHtml(null)],
     [true, true, '', true, '', '']);
  // a tela
  const iCr2 = html.indexOf('<section id="sec-crono"'), SEC = html.slice(iCr2, html.indexOf('</section>', iCr2));
  ok('a marcação: o aviso da conferência no topo, a mensagem da troca e a conferência FORA do resultado (refeito a cada tecla)',
     [SEC.indexOf('id="uep-conv-conf-av"') < SEC.indexOf('class="uep-card"'), SEC.indexOf('id="uep-conv-t-msg"') > SEC.indexOf('id="uep-conv-res"'),
      SEC.indexOf('id="uep-conv-conf"') > SEC.indexOf('id="uep-conv-regs"'), /placeholder="dd\/mm\/aaaa"/.test(SEC), /placeholder="obrigatório"/.test(SEC)],
     [true, true, true, true, true]);
  const RPI = pegaJs('function _ucvRegPintar('), REG = pegaJs('async function _ucvRegistrar('), TRC = pegaJs('async function _ucvTrocar(');
  ok('a data não tem mais HOJE de enfeite e sai do campo depois de registrar (cada medição com a sua)',
     [RPI.includes('hojeStr'), /\['data', 'per', 'lac', 'vol'\]/.test(REG)], [false, true]);
  ok('o TROCAR vai pelo trocarUepCrono, com confirmação e retentativa, e relê cadastro → medições → conferência em sequência',
     [/action=trocarUepCrono/.test(TRC), /confirm\(_ucvTrocaConfirmaTxt\(/.test(TRC), /jsonpEscrita\(/.test(TRC),
      /await _capBuscar\(\);\s*await _ucvRegsCarregar\(true\);\s*await _ucvConfCarregar\(true\);/.test(TRC), /setUepCatalogo|simularUepCatalogo/.test(TRC)],
     [true, true, true, true, false]);
  // o fluxo REAL do _ucvTrocar, com o Apps Script de mentira
  eval.call(global, TRC);
  const tMsg = { textContent:'' };
  const fluxoTroca = resposta => {
    const F = { chamadas:[], ordem:[] };
    global.CFG = { sheetsUrl:'https://script.google.com/macros/s/X/exec' };
    global.UCV_TROCANDO = false; global.UEP_CONV_PRODS = PRODS; global.hojeStr = () => '26/10/2026';
    global._uepConvEntradas = () => ({ txt:ROT, seg:0, base:7.9, meta:2530, tol:15, linha:'nao-lida', regs:REGS });
    global._ucvEl = n => (n === 't-msg' ? tMsg : null);
    global.confirm = () => true; global.alert = () => {};
    global._uepConvAtualiza = () => { F.trocandoNaPintura = F.trocandoNaPintura || global.UCV_TROCANDO; };
    global.CAP_FALHA = null; global.CAP_RAW = [{ codigo:'501059002', uep:2.29 }];
    global._capBuscar = async () => { F.ordem.push('cadastro'); };
    global._ucvRegsCarregar = async () => { F.ordem.push('medições'); };
    global._ucvConfCarregar = async () => { F.ordem.push('conferência'); };
    global.jsonpEscrita = async url => { F.chamadas.push(url); if(resposta instanceof Error) throw resposta; return resposta; };
    return F;
  };
  _assincronos.push(async () => {
    let F = fluxoTroca({ ok:true, trocado:true, n:1, vigencia:'26/10/2026' });
    await _ucvTrocar();
    const u = decodeURIComponent(F.chamadas[0] || '');
    ok('fluxo TROCAR: manda modelo, produto, volume e o código com a UEP nova; relê cadastro → medições → conferência; destrava',
       [F.chamadas.length, u.includes('action=trocarUepCrono&modelo=501059&produto=PENTEADEIRA CAMARIM STRASS&volume=VOL 2/2&cods=501059002:1.51'),
        F.ordem, global.UCV_TROCANDO, F.trocandoNaPintura, tMsg.textContent.startsWith('✓ UEP trocada no cadastro: 1 código')],
       [1, true, ['cadastro', 'medições', 'conferência'], false, true, true]);
    F = fluxoTroca({ ok:true, slots:[] });
    await _ucvTrocar();
    ok('fluxo TROCAR: .gs antigo → diz que falta o v5.34 (nada gravado)', tMsg.textContent.includes('.gs v5.34'), true);
    F = fluxoTroca(new Error('Timeout — o Apps Script não respondeu em 25 s'));
    global._capBuscar = async () => { F.ordem.push('cadastro'); global.CAP_RAW = [{ codigo:'501059002', uep:1.51 }]; };
    await _ucvTrocar();
    ok('fluxo TROCAR: sem resposta, mas o cadastro relido já tem 1,51 → trocou (sem falar em "Timeout")',
       [tMsg.textContent.startsWith('✓ A UEP foi trocada'), /Timeout/.test(tMsg.textContent), global.UCV_TROCANDO], [true, false, false]);
    F = fluxoTroca({ ok:true });
    global._uepConvEntradas = () => ({ txt:ROT, seg:0, base:7.9, meta:2530, tol:15, linha:'nao-lida', regs:[ST2('26/10/2026', 12.4, 20, 1.57)] });
    await _ucvTrocar();
    ok('fluxo TROCAR: as medições não liberam (amostra pequena) → não chama o Apps Script', [F.chamadas.length, tMsg.textContent.includes('não liberam')], [0, true]);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 📄 IMPORTAR O PDF DA CRONOANÁLISE (v7.158.0, PPCP 26/10/2026: "segue modelo" →
// "importar para não ter que digitar nada"). O texto abaixo é o que o pdf.js
// 3.11.174 tira do PDF real "Takt Time — Painel Sirius 1.4 · EMBALAGEM 01 ·
// 26/10/2026 10:22" (app de cronoanálise, RitmoPatrimar v2.93.1), item a item.
console.log('\n── CRONOANÁLISE → UEP: importar o PDF do Takt Time ──');
{ const TXT = "Takt Time —   Painel Sirius 1.4 · EMBALAGEM 01   RitmoPatrimar v 2.93.1   · emitido em   26/10/2026 \n MEDIÇÃO \n 26/10/2026 10:22 \n PERÍODO \n 10:22–10:40 \n VOLUMES \n 50 \n PARADO (MARCADO) \n 5 min \n No período, saiu um volume a cada 20.7 s, paradas dentro; com a linha rodando, 14.3 s. \n Sem takt para comparar: não há programa de produção do grupo EMBALAGEM cadastrado. \n 1 lacuna — intervalo maior que o dobro do normal (14.0 s) — somou 14.6s além do normal: cerca de 1 volume que deixou de sair. As paradas marcadas no\n cronômetro já estão fora desta conta: estas, ninguém marcou. \n POR VOLUME NO PERÍODO \n 20.7 s \n com as paradas, do 1º ao último toque \n TAKT DA SEMANA \n — \n sem programa para comparar \n POR VOLUME COM A LINHA\n RODANDO \n 14.3 s \n sem as paradas marcadas \n SEM AS LACUNAS \n 14.0 s \n sem parada nenhuma \n LACUNAS \n 1 \n 14.6s além do normal \n Intervalo entre   volumes \n Tempo de cada   volume   até   o seguinte ,   com a linha rodando — as paradas marcadas no cronômetro   fi cam fora \n Intervalo   Lacuna — mais que 2× o normal   Rodando — média dos intervalos \n 0 \n 10 s \n 20 s \n 30 s   28.6   s 28.6 s \n Rodando   14.3 s \n 15 5   10   20   25   30   35   40   45   50 2 \n Volume nº \n Onde a linha parou sem parada marcada \n Volume   nº   Intervalo   Além do normal   O que aconteceu \n 15   28.6 s   14.6 s \n Intervalo = tempo de um volume até o seguinte, com a linha rodando: as paradas marcadas no cronômetro já saíram; as marcadas depois (no resultado do tablet ou aqui no PC) continuam\n dentro dos intervalos. O primeiro toque não tem intervalo: o intervalo vai de um toque ao seguinte, e o tempo antes do primeiro toque não entra. Contra o takt vai o relógio do primeiro ao\n último toque ÷ intervalos, com as paradas dentro (sem o setup marcado entre os toques, quando o grupo tem setup planejado) — a mesma régua do programa da semana. Com a linha rodando\n = soma dos intervalos ÷ quantidade. Lacuna = intervalo maior que 2× o normal — a média dos intervalos que não são lacuna. Leitura a partir de 10 intervalos. Na embalagem, o programa da\n semana é colado em volumes.";
  ['function _ucvPdfLer(', 'function _ucvImportItem(', 'function _ucvImportConfirmaTxt(', 'function _ucvRegUrl('].forEach(f => eval.call(global, pegaJs(f)));
  const L = _ucvPdfLer(TXT);
  ok('o PDF real: produto, grupo, data e hora da medição, volumes e os três cartões (segundos com ponto)',
     L, { produto:'Painel Sirius 1.4', grupo:'EMBALAGEM 01', data:'26/10/2026', hora:'10:22', vol:50, per:20.7, rod:14.3, lac:14, versao:'2.93.1', falta:[] });
  const SO_FRASE = TXT.replace(/POR VOLUME NO PER[IÍ]ODO[\s\S]*?sem parada nenhuma/, '');
  ok('sem os cartões, a frase do resumo é a rede do NO PERÍODO e do RODANDO', [_ucvPdfLer(SO_FRASE).per, _ucvPdfLer(SO_FRASE).rod, _ucvPdfLer(SO_FRASE).lac], [20.7, 14.3, null]);
  ok('PDF que não é o Takt Time: diz o que falta, nunca inventa número',
     [_ucvPdfLer('Relatório qualquer 12 s').falta.length, _ucvPdfLer('Relatório qualquer 12 s').rod], [4, null]);
  const PRP = _uepConvProdutos([
    { codigo:'501149001', desc:'VOL 1/1 MESA CABECEIRA MADERO', cor:'BRANCO', uep:1, uepVig:'21/10/2026 DIGITADA' },
    { codigo:'501114004', desc:'VOL 1/1 PAINEL SIRIUS 1.4', cor:'OFF WHITE', uep:1.49, uepVig:'16/10/2026', velocidade:9, entrePeca:650 },
    { codigo:'501114005', desc:'VOL 1/1 PAINEL SIRIUS 1.4', cor:'BRANCO ACETINADO', uep:1.49, uepVig:'16/10/2026' },
    { codigo:'501106004', desc:'VOL 1/1 RACK SIRIUS 1.4', cor:'ALECRIM/CINAMOMO', uep:1.68, uepVig:'16/10/2026' }]);
  const EI = { base:7.9, meta:2530, tol:15, linha:'nao-lida', regs:[] }, JI = { de:'26/09/2026', ate:'25/10/2026' };
  const I = _ucvImportItem(Object.assign({ arquivo:'m.pdf' }, L), PRP, EI, '26/10/2026', JI, 'ADRIANO RODRIGUES');
  ok('o PDF vira a MESMA linha do 💾 REGISTRAR: produto do cadastro, data do PDF, os três tempos, volumes e a UEP (14,3 ÷ 7,9)',
     [I.erro, I.D.modelo, I.D.produto, I.D.volume, I.D.data, I.D.sRod, I.D.sPer, I.D.sLac, I.D.volumes, I.D.uep, I.D.uepCad, I.D.quem, I.D.codigos, /^c[0-9a-z]+$/.test(I.D.regId)],
     [undefined, '501114', 'PAINEL SIRIUS 1.4', 'VOL 1/1', '26/10/2026', 14.3, 20.7, 14, 50, 1.81, 1.49, 'ADRIANO RODRIGUES', '501.114.004 501.114.005', true]);
  ok('importar o mesmo PDF de novo dá o MESMO REG_ID (não duplica na planilha)',
     _ucvImportItem(Object.assign({ arquivo:'m.pdf' }, L), PRP, EI, '26/10/2026', JI, 'ADRIANO RODRIGUES').D.regId, I.D.regId);
  ok('produto fora do cadastro ou ambíguo: não registra e diz o que fazer',
     [/não está no cadastro/.test(_ucvImportItem(Object.assign({}, L, { produto:'Painel Orion' }), PRP, EI, '26/10/2026', JI, '').erro),
      /2 produtos do cadastro têm "Sirius 1.4"/.test(_ucvImportItem(Object.assign({}, L, { produto:'Sirius 1.4' }), PRP, EI, '26/10/2026', JI, '').erro),
      /não consegui ler o PDF/.test(_ucvImportItem({ arquivo:'x.pdf', erro:'Invalid PDF', falta:[] }, PRP, EI, '26/10/2026', JI, '').erro)], [true, true, true]);
  ok('a confirmação do lote lista o que entra e o que fica de fora, e que a UEP do cadastro não muda',
     ['Registrar 1 medição lida dos PDFs', '501114 · PAINEL SIRIUS 1.4 · 26/10/2026 · 50 volumes · rodando 14,3 s · UEP 1,81 (cadastro 1,49)', 'Ficam de fora (1)', 'y.pdf: ', 'A UEP do cadastro NÃO muda']
       .filter(t => !_ucvImportConfirmaTxt([I, { x:{ arquivo:'y.pdf' }, erro:'o PDF não tem os VOLUMES' }]).includes(t)), []);
  const iCr3 = html.indexOf('<section id="sec-crono"'), SEC3 = html.slice(iCr3, html.indexOf('</section>', iCr3));
  ok('o botão 📄 IMPORTAR PDF no cabeçalho da aba, o arquivo escondido (vários PDFs) e a mensagem no topo',
     [/onclick="_ucvEl\('pdf'\)\.click\(\)"[^>]*>📄 IMPORTAR PDF</.test(SEC3), /id="uep-conv-pdf" accept="application\/pdf,\.pdf" multiple/.test(SEC3), /onchange="_ucvImportar\(this\.files\);this\.value=''"/.test(SEC3),
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
    global.hojeStr = () => '26/10/2026'; global.confirm = () => true;
    global._ucvLinhaCarregar = async () => {}; global._uepConvEntradas = () => EI;
    global._ucvRegsCarregar = async () => { F.releu++; };
    global.CFG = { sheetsUrl:'https://script.google.com/macros/s/X/exec' };
    global.jsonpEscrita = async url => { F.chamadas.push(url); return { ok:true, registrado:true }; };
    await _ucvImportar([{ name:'Takt_Time_-_Painel_Sirius_1.4.pdf', type:'application/pdf' }]);
    ok('fluxo IMPORTAR (1 PDF): preenche a tela sem digitar nada e NÃO registra sozinho',
       [campos.prod.value, campos.seg.value, campos['r-data'].value, campos['r-per'].value, campos['r-lac'].value, campos['r-vol'].value, F.pintou, F.chamadas.length,
        iMsg.textContent.includes('confira e clique em 💾 REGISTRAR MEDIÇÃO')],
       ['501114 · PAINEL SIRIUS 1.4', '14,3', '26/10/2026', '20,7', '14', '50', 1, 0, true]);
    await _ucvImportar([{ name:'a.pdf' }, { name:'b.pdf' }, { name:'ruim.pdf' }]);
    ok('fluxo IMPORTAR (vários): uma confirmação, registra os que deram, o ruim fica de fora, relê a lista',
       [F.chamadas.length, F.chamadas.every(u => u.includes('action=registrarCrono&data=26%2F10%2F2026&modelo=501114')), F.releu, /2 medições registradas/.test(iMsg.textContent), /1 fora/.test(iMsg.textContent)],
       [2, true, 1, true, true]);
    await _ucvImportar([{ name:'foto.jpg', type:'image/jpeg' }]);
    ok('fluxo IMPORTAR: arquivo que não é PDF não é lido', [iMsg.textContent.includes('Escolha o PDF'), F.chamadas.length], [true, 2]);
  });
}

// os testes assíncronos (o fluxo do EXCLUIR) rodam antes do resumo; um que não
// termina deixa o processo sair com erro, nunca com "tudo certo"
process.exitCode = 1;
(async () => {
  for (const f of _assincronos) await f();
  console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.log('\n❌ teste assíncrono quebrou: ' + e.message); process.exit(1); });
