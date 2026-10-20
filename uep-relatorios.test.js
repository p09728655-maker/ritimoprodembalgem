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
ok('produto bem medido (MADERO) NÃO entra', por('501149|MESA CABECEIRA MADERO'), null);
// v7.143.0: a SLEEP virou a BASE — vale 1,00 por definição e sai da fila, mesmo
// sendo a de menor UEP × teto do cadastro (a régua do limite continua com ela).
ok('a BASE (SLEEP) não entra na fila, nem no limite da esteira', por('501094|MESA CABECEIRA SLEEP'), null);
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
ok('contagem por motivo', F.cont, { 'sem-uep': 1, est: 1, prov: 1, teto: 1, fam: 2, 'sem-medida': 1 });
// TAKT s/CX (v7.141.0): 527 min × 60 ÷ META UEP × UEP da caixa, um por volume
ok('meta padrão (sem a do ⚙) é a da base SLEEP, 3.048', _filaCronoMontar(CAT, AM, PROG, UT).metaUep, 3048);
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
// v7.146.1 (refatoração): a conta em três peças (base · cadastro · digitar) e o
// desenho em peças por bloco; os campos e o que fica guardado por _ucvEl/_ucvLe/_ucvGuarda.
const UCV_CONTA = ['function _uepConvBaseDe(', 'function _uepConvCadastro(', 'function _uepConvDigitar(', 'function _uepConvMontar('];
const UCV_DESENHO = ['function _ucvU2(', 'function _ucvSeg(', 'function _ucvCard(', 'function _ucvTolTxt(', 'function _ucvTolFora(', 'function _ucvTpMed(',
  'function _uepConvRegua(', 'function _uepConvAvisoBase(', 'function _uepConvCadTxt(', 'function _uepConvNotasHtml(', 'function _uepConvBaseHtml(',
  'function _uepConvTrocaHtml(', 'function _uepConvHtml('];
['function _uepBaseCurto(', 'function _ucvEl(', 'function _ucvLe(', 'function _ucvGuarda(', 'function _uepConvProdutos(', 'function _uepConvAchar(']
  .concat(UCV_CONTA, UCV_DESENHO).forEach(f => eval.call(global, pegaJs(f)));
const CV = (codigo, desc, cor, uep, uepVig) => ({ codigo, desc, cor, uep, uepVig });
const PRODS = _uepConvProdutos([
  CV('501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 'BRANCO', 1, '25/09/2026'),
  CV('501094001', 'VOL 1/1 MESA CABECEIRA SLEEP', 'BRANCO', 1, '19/10/2026'),      // a base desde a v7.143.0
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
const E6 = _uepConvMontar(PRODS, 'MESA CABECEIRA SLEEP', 10, 0, 3048);
ok('a BASE (SLEEP) não ganha UEP nova: mostra a distância da cronoanálise para a régua da meta (10 s × 10,4 s)',
   [E6.ehBase, E6.digitar, Math.round(E6.reguaDif)], [true, null, -4]);
ok('a MADERO deixou de ser a base', _uepConvMontar(PRODS, 'MESA CABECEIRA MADERO', 12, 0, 3048).ehBase, false);
ok('meta diferente muda a régua da base pela meta (2.635 UEP → 12,0 s)',
   _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 24, 0, 2635).uepVol.toFixed(2), '2.00');
ok('estados antes do número', [_uepConvMontar([], 'X', 1, 0, 2530).estado, _uepConvMontar(PRODS, 'ENCANTO', 27.8, 0, 2530).estado,
   _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 0, 0, 2530).estado], ['sem-cadastro', 'sem-produto', 'sem-tempo']);

const H1 = _uepConvHtml(E1), H2 = _uepConvHtml(E2);
ok('o desenho: CONFERE, o número e onde digitar', [H1.includes('CONFERE'), H1.includes('<b>2,22</b>'), H1.includes('501.139.001 BRANCO'),
   H1.includes('PRODUTO_CODIGO'), H1.includes('NÃO PRECISA TROCAR')], [true, true, true, true, true]);
ok('o desenho: rodando contra a meta sai mais LEVE, pede troca e manda conferir o tempo antes',
   [H2.includes('mais LEVE que o cadastro'), H2.includes('PARA TROCAR'), H2.includes('CONFIRA O TEMPO ANTES DE TROCAR'), H2.indexOf('CONFIRA') < H2.indexOf('PARA TROCAR')],
   [true, true, true, true]);
ok('o aviso do tempo só com a base pela meta e o produto mais leve que a faixa',
   [E1.confRegua, E2.confRegua, E3.confRegua, _uepConvHtml(E1).includes('CONFIRA O TEMPO')], [false, true, false, false]);
ok('o desenho não faz conta', /_uepConvMontar\(|_taktUep\(|UEP_PAD_FAIXA\[0\] *<=|\/ *R\./.test(pegaJs('function _uepConvHtml(')), false);
// v7.144.0 (PPCP: "colocar uma tela separada para isso"): aba própria
const iCr = html.indexOf('<section id="sec-crono"'), fCr = html.indexOf('</section>', iCr);
ok('o conversor mora na aba ⏱ CRONOANÁLISE (e não mais na ⚖ UEP)',
   [iCr > 0 && html.indexOf('id="uep-conv"') > iCr && html.indexOf('id="uep-conv"') < fCr, /data-tab="crono" onclick="setTab\('crono'\)"/.test(html),
    html.slice(html.indexOf('<section id="sec-uep"'), html.indexOf('</section>', html.indexOf('<section id="sec-uep"'))).includes('id="uep-conv"')],
   [true, true, false]);
const ST = pegaJs('function setTab(');
ok('abrir a aba desenha o conversor e lê o cadastro; o cadastro que chega redesenha a aba; o renderUep não cuida mais dele',
   [/tab==='crono'\)\{ _uepConvAtualiza\(\); _uepAbaCatCarregar\(\); \}/.test(ST), /if\(_abaOn\('crono'\)\) _uepConvAtualiza\(\);/.test(pegaJs('async function _capBuscar(')),
    pegaJs('function renderUep(').includes('_uepConvAtualiza')], [true, true, false]);
ok('a pele do conversor é da aba nova', [/#sec-crono \.uep-conv-f\{/.test(html), /#sec-uep \.uep-conv/.test(html)], [true, false]);
ok('a aba UEP aponta para a aba nova, e a FILA também abre de lá',
   [/onclick="setTab\('crono'\)"[^>]*>⏱ CRONOANÁLISE → UEP<\/button>/.test(html), html.slice(iCr, fCr).includes('gerarRelatorioFilaCrono()')], [true, true]);
// v7.142.1 — o PPCP digitou o 17,6 do PRÓPRIO Encanto no campo da base (1,58 e
// depois 0,06) e o Tab do último campo rolava a tela até o bloco 5
const E7 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 27.8, 17.6, 2530);
ok('base digitada: a diferença para a régua da meta sai pronta do montar (+40,8%)', [E7.base.daMeta, fmtP(E7.base.difMeta)], [false, '40,8%']);
const H7 = _uepConvHtml(E7);
ok('base digitada fica à vista, com o valor e o botão de voltar à meta — e antes do resultado',
   [H7.includes('BASE DIGITADA: 17,6 s POR VOLUME DA SLEEP'), H7.includes('+40,8%'), H7.includes('_uepConvLimparBase()'),
    H7.indexOf('BASE DIGITADA') < H7.indexOf('UEP EQUIVALENTE')], [true, true, true, true]);
ok('base pela meta não mostra o aviso', [H1.includes('BASE DIGITADA'), _uepConvHtml(_uepConvMontar(PRODS, '', 0, 0, 2530)).includes('BASE DIGITADA')], [false, false]);
ok('o rótulo diz de quem é o tempo da base (o nome vem do UEP_BASE)',
   [/><span>s\/VOLUME DA BASE \(<span id="uep-conv-base-nome">SLEEP<\/span>\)<\/span><input id="uep-conv-base"/.test(html), html.includes('>SEGUNDOS DA BASE<'),
    /bn\.textContent = _uepBaseCurto\(\)/.test(pegaJs('function _uepConvAtualiza(')), _uepBaseCurto()], [true, false, true, 'SLEEP']);
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
   [/NO PERÍODO/.test(_uepConvGuia(true)), /SLEEP <b>com a linha rodando<\/b>/.test(_uepConvGuia(true)),
    /COM A LINHA RODANDO/.test(_uepConvGuia(false)), /NO PERÍODO/.test(_uepConvGuia(false))], [true, true, true, false]);
ok('a orientação é desenhada pelo _uepConvAtualiza (não é mais texto fixo no HTML)',
   [/id="uep-conv-guia"/.test(html), /_uepConvGuia\(/.test(pegaJs('function _uepConvAtualiza(')), html.includes('Use o tempo <b>NO PERÍODO</b> (paradas dentro): é a régua')], [true, true, false]);
ok('base mais lenta que a régua da meta é suspeita (o 17,6 do Encanto); a MADERO rodando a 8,7 s não é',
   [E7.base.suspeita, _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 2530).base.suspeita, E1.base.suspeita],
   [true, false, false]);
ok('o desenho cobra a conferência da base suspeita e, com a base, fala em tempo rodando',
   [H7.includes('não parece a SLEEP com a linha rodando'), H7.includes('o tempo é o COM A LINHA RODANDO'),
    _uepConvHtml(_uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 2530)).includes('não parece a SLEEP')], [true, true, false]);
ok('Encanto rodando 17,6 ÷ MADERO rodando 8,7 = 2,02', _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 17.6, 8.7, 2530).uepVol.toFixed(2), '2.02');
// v7.143.1: o label é flex em coluna — texto solto ao lado do nome da base virava
// três linhas ("s/VOLUME DA BASE (" · "SLEEP" · ")") e desalinhava os campos.
ok('o rótulo da base é UM item do label (texto e nome no mesmo span)',
   /<label[^>]*>s\/VOLUME DA BASE/.test(html), false);
// v7.143.1: depois da base vem o 📌 FIXAR — o Tab que volta ao PRODUTO é dele
ok('o último foco do conversor (o FIXAR) tem o Tab ligado; o campo da base não',
   [/id="uep-conv-fixar"[^>]*onkeydown="_uepConvTecla\(event\)"/.test(html), /id="uep-conv-base"[^>]*onkeydown=/.test(html)], [true, false]);
// 📌 FIXAR SLEEP (v7.143.1, PPCP: "deixa um botão para fixar sleep")
eval.call(global, pegaJs('function _uepConvFixar('));
ok('FIXAR: com a base no produto e o tempo dela, fixa o tempo; sem tempo ou com outro produto, escolhe a base',
   [_uepConvFixar(PRODS, 'MESA CABECEIRA SLEEP', 8.7), _uepConvFixar(PRODS, 'MESA CABECEIRA SLEEP', 0), _uepConvFixar(PRODS, 'ARMARIO ENCANTO', 27.8)],
   [{ acao: 'fixar', seg: 8.7 }, { acao: 'escolher', rot: '501094 · MESA CABECEIRA SLEEP' }, { acao: 'escolher', rot: '501094 · MESA CABECEIRA SLEEP' }]);
ok('FIXAR sem a base no cadastro não faz nada', _uepConvFixar(PRODS.filter(p => p.modelo !== '501094'), 'X', 1), { acao: 'sem-base' });
ok('o placeholder do campo da base diz que é a meta, não exemplo', /elB\.placeholder = 'meta ' \+/.test(pegaJs('function _uepConvEntradas(')), true);
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
ok('base digitada igual à régua da meta (10,4 com 3.048) É a régua da meta: sem aviso, tempo do período',
   [EM.base.igualMeta, EM.base.daMeta, EM.base.suspeita, _uepConvHtml(EM).includes('BASE DIGITADA'), _uepConvHtml(EM).includes('o tempo é o NO PERÍODO')],
   [true, true, false, false, true]);
const EM2 = _uepConvMontar(PRODS, 'ARMARIO ENCANTO', 27.8, 10.6, 3048);
ok('acima de 1% da régua já é base digitada (e suspeita, se mais lenta)', [EM2.base.daMeta, EM2.base.suspeita], [false, true]);
const AT = pegaJs('function _uepConvAtualiza('), EN = pegaJs('function _uepConvEntradas(');
ok('o campo da base mostra a régua da meta quando vazio, sem gravar, e a orientação segue a conta',
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
   [DI.includes(_uepConvHtml(E1)), DI.includes(_uepConvGuia(E1.base.daMeta)), DI.includes('NÃO PRECISA TROCAR'), DI.includes('<b>2,22</b>'),
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
const MONTA = 'const R = _uepConvMontar(UEP_CONV_PRODS, E.txt, E.seg, E.base, E.meta, E.tol);';
ok('tela e papel leem as entradas pela MESMA função e montam com a MESMA chamada',
   [/const E = _uepConvEntradas\(\);/.test(AT), /const E = _uepConvEntradas\(\);/.test(GC), AT.includes(MONTA), GC.includes(MONTA),
    (JS.match(/(?<!function )_uepConvEntradas\(\)/g) || []).length, /_uepConvDocHtml\(R, ctx\)/.test(GC), GC.indexOf('_uepConvAtualiza();') < GC.indexOf('_uepConvEntradas()')],
   [true, true, true, true, 2, true, true]);
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
  ok('o campo automático segue a meta de AGORA; o digitado fica como está',
     [e1.base, campos['uep-conv-base'].value, e2.base, e1.meta, e1.txt, e1.seg], [12.5, '8,7', 8.7, 2530, 'ARMARIO ENCANTO', 27.8]);
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
ok('no papel, o botão VOLTAR À RÉGUA DA META some', /\.ucv-doc \.uep-conv-av \.btn\{display:none\}/.test(SK), true);
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
ok('o desenho continua sem conta (o multiplicador vem pronto do montar) — em TODAS as peças dele',
   UCV_DESENHO.filter(f => /\/ *100|\/ *R\.|_uepConvMontar\(|_uepConvBaseDe\(|_uepConvCadastro\(|_uepConvDigitar\(/.test(pegaJs(f))), []);
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
    /title="[^"]*sem somar tolerância[^"]*">s\/VOLUME MEDIDO/.test(html)], [true, true, true]);
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

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
