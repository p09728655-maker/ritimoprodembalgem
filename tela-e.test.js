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
  const produtoDoCodigo = c => ({ cor: c === '501130' ? 'BRANCO' : '' });
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
})();

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tela E ok — a programação do dia sai do dado que a TV já tem');
process.exit(falhas ? 1 : 0);
