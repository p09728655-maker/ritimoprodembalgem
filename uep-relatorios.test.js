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
['function _rpEsc(', 'function _cartNum(', 'function _qpRealDia(', 'function _capVol(', 'function _capNome(',
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
  C('501999001', 'VOL 1/1 PRODUTO NOVO', 'BRANCO', 900, '', '')                                      // sem UEP
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
const F = _filaCronoMontar(CAT, AM, PROG, UT);
const por = k => F.prog.concat(F.semProg).find(f => f.key === k) || null;

console.log('\n── FILA: quem entra e por quê ──');
ok('a base bem medida NÃO entra', por('501149|MESA CABECEIRA MADERO'), null);
ok('SLEEP: no limite da esteira (o menor UEP × teto do cadastro)', por('501094|MESA CABECEIRA SLEEP').motivos, ['teto']);
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
ok('fora da esteira e fora da janela não contam (SLEEP fica sem programação)', por('501094|MESA CABECEIRA SLEEP').progCx, 0);
const totEsperado = 2000 + 1300 * 1 + 200 * 1.54 + 135 * 2.4 + 60 * 1.0;
ok('a % da janela é sobre TODA a UEP programada (inclusive a base e a cronometrada)',
   [Math.round(F.totUep), Math.round(F.emDuvida), Math.round(F.pctDuvida * 10) / 10],
   [Math.round(totEsperado), Math.round(2000 + 308 + 60), Math.round((2000 + 308 + 60) / totEsperado * 1000) / 10]);
ok('contagem por motivo', F.cont, { 'sem-uep': 1, est: 1, prov: 1, teto: 1, fam: 2, 'sem-medida': 1 });
const F0 = _filaCronoMontar(CAT, null, null, UT);
ok('sem amostra: PROVISÓRIA não é avaliada (e diz); sem programação, tudo vai pelo volume',
   [!!por('501059|PENTEADEIRA CAMARIM STRASS') && F0.prog.length, F0.amostraLida, F0.progLida, F0.cont.prov], [0, false, false, 0]);

console.log('\n── FILA: o desenho ──');
const ctx = { data: '19/10/2026', hora: '08:00', amDe: '01/07/2026', amAte: '16/10/2026' };
const H = _filaCronoHtml(F, ctx);
ok('motivo com a explicação no title e a razão da família escrita',
   [H.includes('NO LIMITE DA ESTEIRA'), H.includes('FAMÍLIA INCOERENTE ' + fmt1(por('501130|MESA LATERAL LUNA 440').famRazao) + '×'), H.includes('PROVISÓRIA · 4 DIAS')], [true, true, true]);
ok('código sem UEP programado diz "sem UEP" no lugar do número', H.includes('>sem UEP<'), true);
ok('o papel diz como o produto SAI da fila', H.includes('UEP_VIGENCIA da linha vira "DIGITADA"'), true);
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

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
