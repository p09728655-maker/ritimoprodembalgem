// Teste da TELA E da TV — programação do dia.
//   node tela-e.test.js
//
// Roda contra o código REAL: as funções puras do ritmoprod_embalagem_v7.html e
// o calcularProgramacao() do ritmoprod_appscript.gs (com planilha de mentira).

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

global.window = global;
require('vm').runInThisContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'));
const _max = JS.match(/const TV_E_MAX = (\d+);/);
if (!_max) throw new Error('TV_E_MAX sumiu do painel');
global.TV_E_MAX = Number(_max[1]);
eval(pegaJs('function _rpEsc('));
eval(pegaJs('function _progFaltaZerar('));
eval(pegaJs('function _telaEDataNum('));
eval(pegaJs('function _telaEMontar('));
eval(pegaJs('function _telaETem('));
eval(pegaJs('function _telaEHtml('));
const _maxL = JS.match(/const TV_E_MAX_LOTE = (\d+);/);
if (!_maxL) throw new Error('TV_E_MAX_LOTE sumiu do painel');
global.TV_E_MAX_LOTE = Number(_maxL[1]);
eval(pegaJs('function _telaELotes('));
eval(pegaJs('function _telaELotesHtml('));

console.log('\n── FALTA P/ ZERAR: a mesma leitura da Tela C ──');
ok('backend novo usa faltaZerar', _progFaltaZerar({ faltaZerar: 1304, metaEfetiva: 9, embaladoHoje: 1 }), 1304);
ok('faltaZerar ZERO não cai no fallback', _progFaltaZerar({ faltaZerar: 0, metaEfetiva: 900, embaladoHoje: 100 }), 0);
ok('backend antigo: metaEfetiva − embalado', _progFaltaZerar({ metaEfetiva: 900, embaladoHoje: 100 }), 800);
ok('nunca negativo', _progFaltaZerar({ metaEfetiva: 100, embaladoHoje: 300 }), 0);
ok('Tela C lê o mesmo helper', /_progFaltaZerar\(prog\)/.test(pegaJs('function _sincSlideC(')), true);

console.log('\n── ordem e situação ──');
const prog = {
  programadoHoje: 1850, atrasoTotal: 420, faltaZerar: 1304,
  lista: [
    { codigo: '501150', desc: 'ESCRIVANINHA MALTA', cor: 'NATURE', lote: '025093', falta: 300, atraso: 0, metaEfetiva: 300 },
    { codigo: '501130', desc: 'PENTEADEIRA', cor: 'BRANCO', lote: '025076', falta: 240, atraso: 240, metaEfetiva: 240, atrasoDesde: '12/09/2026' },
    { codigo: '501201', desc: 'CABECEIRA', cor: 'PRETO', lote: '025081', falta: 180, atraso: 100, metaEfetiva: 380, atrasoDesde: '22/09/2026' },
    { codigo: '501149', desc: 'ESCRIVANINHA MALTA', cor: 'CUMARU', lote: '025093', falta: 186, atraso: 0, metaEfetiva: 400 },
    { codigo: '501077', desc: 'BANQUETA', cor: '', lote: '025094', falta: 148, atraso: 0, metaEfetiva: 148 },
    { codigo: '501188', desc: 'RACK', cor: 'MARSALA', lote: '025094', falta: 250, atraso: 0, metaEfetiva: 250 },
    { codigo: '501300', desc: 'MESA', lote: '025090', falta: 0, atraso: 0, metaEfetiva: 200 },     // concluído
    { codigo: '501301', desc: 'SEM DEMANDA', lote: '', falta: 0, atraso: 0, metaEfetiva: 0, embaladoHoje: 30 } // não conta
  ]
};
const m = _telaEMontar(prog, '501149');
ok('rodando → atraso mais antigo → hoje por lote (e maior falta)',
   m.linhas.map(l => l.codigo), ['501149', '501130', '501201', '501150', '501188', '501077']);
ok('situações', m.linhas.map(l => l.sit), ['run', 'atr', 'atr', 'pen', 'pen', 'pen']);
ok('data do atraso sai dd/mm', m.linhas[1].desde, '12/09');
ok('concluído conta, produção sem demanda não', m.concluidos, 1);
ok('cards', [m.prog, m.atraso, m.falta], [1850, 420, 1304]);
ok('código do produto atual casa só pelos dígitos', _telaEMontar(prog, ' 501.149 ').linhas[0].sit, 'run');

const m3 = _telaEMontar(prog, '', 3);
ok('corte: 3 linhas e o resto vira "fora"', [m3.linhas.length, m3.fora, m3.abertos], [3, 3, 6]);
ok('atraso sem data (backend antigo) continua antes do programado hoje',
   _telaEMontar({ lista: [
     { codigo: '1', lote: 'A', falta: 5, atraso: 0, metaEfetiva: 5 },
     { codigo: '2', lote: 'B', falta: 5, atraso: 5, metaEfetiva: 5 }] }, '').linhas.map(l => l.sit), ['atr', 'pen']);

console.log('\n── entra no ciclo só com o que mostrar ──');
ok('com programação', _telaETem(prog), true);
ok('lista vazia', _telaETem({ lista: [] }), false);
ok('sem programacao', _telaETem(undefined), false);
ok('só produção sem demanda', _telaETem({ lista: [{ falta: 0, metaEfetiva: 0, embaladoHoje: 9 }] }), false);

console.log('\n── desenho ──');
const h = _telaEHtml(m);
ok('pílula RODANDO AGORA', h.includes('RODANDO AGORA'), true);
ok('pílula ATRASO com data', h.includes('ATRASO · 12/09'), true);
ok('cor aparece junto do código', h.includes('501130 · <b>BRANCO</b>'), true);
ok('sem cor, só o código', h.includes('>501077</div>'), true);
ok('descrição que já termina com a cor não repete',
   _telaEHtml({ linhas: [{ codigo: '9', desc: 'RACK MARSALA', cor: 'MARSALA', lote: '1', falta: 1, sit: 'pen' }] })
     .includes('<b>MARSALA</b>'), false);
ok('texto da planilha é escapado', _telaEHtml({ linhas: [{ codigo: '9', desc: '<b>x', cor: '', lote: '1', falta: 1, sit: 'pen' }] })
     .includes('&lt;b&gt;x'), true);
ok('tudo concluído vira aviso, não tabela vazia', _telaEHtml({ linhas: [] }).includes('CONCLUÍDA'), true);
ok('desenho não faz conta', /_telaEMontar|_progFaltaZerar/.test(pegaJs('function _telaEHtml(')), false);

console.log('\n── por LOTE (v7.71.0) ──');
const pl = { programadoHoje: 1350, atrasoTotal: 520, faltaZerar: 1673, porLote: [
  { lote: '25219', qtde: 520, falta: 501, produto: 'ESCRIVANINHA MALTA', outros: [], cores: ['A','B','C','D'], cabeca: ['501150'] },
  { lote: '25213', qtde: 900, falta: 520, produto: 'MESA COMPUTADOR MILLION', outros: [], cores: ['1','2','3','4','5','6'], atrasoDesde: '23/09/2026', cabeca: ['501116005'] },
  { lote: '25210', qtde: 300, falta: 40, produto: 'RACK', outros: [], cores: ['X'], atrasoDesde: '20/09/2026', cabeca: [] },
  { lote: '25215', qtde: 180, falta: 2, produto: 'MESA LATERAL EVOLUTION', outros: [], cores: ['CINAMOMO'], cabeca: ['501129004'] },
  { lote: '25218', qtde: 650, falta: 650, produto: 'RACK BRITO 137 CM', outros: ['BANQUETA VERSATIL', 'MESA'], cores: ['A','B','C'], cabeca: [] },
  { lote: '25200', qtde: 400, falta: 0, produto: 'CONCLUIDO', outros: [], cores: [], cabeca: [] }] };
const ml = _telaELotes(pl, '501129004');
ok('rodando → atraso mais antigo → hoje', ml.linhas.map(l => l.lote), ['25215', '25210', '25213', '25218']);
ok('corte em TV_E_MAX_LOTE, resto em "fora"', [ml.linhas.length, ml.fora, ml.abertos], [4, 1, 5]);
ok('lote zerado conta como concluído', ml.concluidos, 1);
ok('progresso pelo total FIXO do lote', Math.round(ml.linhas[2].pct), 42);
ok('rodando pelo código cabeça do FIFO', _telaELotes(pl, '501116005').linhas[0].lote, '25213');
const hl = _telaELotesHtml(ml);
ok('total do lote na tela', hl.includes('de 900 no lote'), true);
ok('nº de cores', hl.includes('6 cores'), true);
ok('1 cor mostra o nome da cor', hl.includes('1 cor · CINAMOMO'), true);
ok('outro produto no lote', hl.includes('+ BANQUETA VERSATIL e mais 1'), true);
ok('entra no ciclo com porLote', _telaETem({ porLote: [{ lote: '1' }], lista: [] }), true);
ok('desenho do lote não faz conta', /_telaELotes\(|_progFaltaZerar/.test(pegaJs('function _telaELotesHtml(')), false);
ok('tela escolhe por lote quando o backend manda',
   /const lote = Array\.isArray\(prog\.porLote\);/.test(pegaJs('function _sincSlideE(')), true);

console.log('\n── ciclo e config ──');
ok('ciclo inclui a Tela E', /if \(t\.e !== false && _temProgDia\(\)\) ordem\.push\('e'\)/.test(JS), true);
ok('tempo próprio da Tela E', /if \(t === 'e'\) return CFG\.slideEIntervalo \|\| 20;/.test(JS), true);
ok('config envia telaE e tempoE', /'telaE='/.test(JS) && /'tempoE='/.test(JS), true);
ok('config antiga (sem telaE) preserva a marcação local', /pc\.telaE!==undefined \? pc\.telaE!==false : _eAtual/.test(JS), true);
ok('backend guarda TELA_E / TEMPO_E', /novos\.TELA_E/.test(gs) && /novos\.TEMPO_E/.test(gs) && /telaE:\s+bool\(kv\.TELA_E/.test(gs), true);

console.log('\n── backend: cor e data do lote aberto mais antigo ──');
(function () {
  const TZ = 'America/Sao_Paulo';
  const Utilities = { formatDate: (d, tz, f) => f === 'yyyy' ? '2026' : '24/09/2026' };
  eval(pegaGs('function codKey('));
  eval(pegaGs('function dataParaNum('));
  eval(pegaGs('function _numParaDataBR('));
  ok('_numParaDataBR', [_numParaDataBR(20260912), _numParaDataBR(0)], ['12/09/2026', '']);
  const lerCatalogoProdutos = () => [{ codigo: '501130', desc: 'PENTEADEIRA' }];
  const produtoDoCodigo = c => ({ cor: c === '501130' ? 'BRANCO' : '', base: c === '501130' ? 'PENTEADEIRA' : '' });
  eval(pegaGs('function _somaNoLote('));
  eval(pegaGs('function _fecharLotes('));
  // dois lotes vencidos (10/09 e 12/09) e um de hoje; a produção abate o de 10/09 inteiro
  const lerProgramacao = () => [
    { codigo: '501130', data: '10/09/2026', qtde: 100, lote: 'L1' },
    { codigo: '501130', data: '12/09/2026', qtde: 100, lote: 'L2' },
    { codigo: '501130', data: '24/09/2026', qtde: 50,  lote: 'L3' }];
  const lerEmbaladoPorProduto = () => ({ hoje: { '501130': 120 }, eventos: { '501130': [{ dNum: 20260924, cx: 120 }] } });
  eval(pegaGs('function calcularProgramacao('));
  const it = calcularProgramacao().lista[0];
  ok('cor por item', it.cor, 'BRANCO');
  ok('atrasoDesde = lote vencido ainda aberto (o de 10/09 já foi zerado)', it.atrasoDesde, '12/09/2026');
  ok('atraso vivo', it.atraso, 80);
  const pls = calcularProgramacao().porLote;
  const by = {}; pls.forEach(L => { by[L.lote] = L; });
  ok('L1 (vencido) zerado HOJE entra, para contar como concluído', !!by.L1, true);
  ok('L1: produziu hoje e zerou → falta 0', by.L1 && by.L1.falta, 0);
  ok('L2: total 100, falta 80, atraso desde 12/09', by.L2 && [by.L2.qtde, by.L2.falta, by.L2.atrasoDesde], [100, 80, '12/09/2026']);
  ok('L2 é a cabeça do FIFO do código', by.L2 && by.L2.cabeca, ['501130']);
  ok('L3 de hoje: total 50, falta 50, sem atraso', by.L3 && [by.L3.qtde, by.L3.falta, by.L3.atrasoDesde, by.L3.hoje], [50, 50, '', true]);
  ok('nome do produto e cor no lote', by.L2 && [by.L2.produto, by.L2.cores], ['PENTEADEIRA', ['BRANCO']]);
  // lote antigo zerado sem produção hoje não entra
  const velho = [{ d: 20260901, rem: 0, lote: 'V', q: 10, hojeProd: 0 }];
  const mp = {}; _somaNoLote(mp, velho, '9', null, 20260924);
  ok('lote velho já zerado não entra', Object.keys(mp).length, 0);
})();

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tela E ok — a programação do dia sai do dado que a TV já tem');
process.exit(falhas ? 1 : 0);
