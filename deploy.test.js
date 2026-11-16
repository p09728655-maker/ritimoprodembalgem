// O que o site publica — node deploy.test.js
//
// A Vercel publica o que o .vercelignore libera (lista do que SAI: `/*` e
// depois `!arquivo`). Até 16/11/2026 não havia .vercelignore e o site servia o
// repositório inteiro: o CLAUDE.md e o código do Apps Script abriam pela URL do
// painel. Lista de liberação tem o risco contrário — um arquivo que o painel
// carrega fica de fora e dá 404 em produção. Este teste prende os dois lados:
//   1. tudo o que os HTMLs, os manifests, o service worker e o vercel.json
//      pedem está liberado (e existe);
//   2. nada interno (documentação, .gs, testes, .claude, docs/) está.
const fs = require('fs');
const path = require('path');

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}
const ler = f => fs.readFileSync(path.join(__dirname, f), 'utf8');

console.log('\n── o .vercelignore é uma lista do que sai ──');
const linhas = ler('.vercelignore').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
ok('começa por /* (nada sai sem estar na lista)', linhas[0], '/*');
// Só esse formato: o teste entende `!nome-na-raiz`, nada mais. Padrão com
// barra, curinga ou pasta mudaria o que sai sem o teste perceber.
const outras = linhas.slice(1).filter(l => !/^![A-Za-z0-9_.-]+$/.test(l));
ok('o resto são só !arquivo da raiz, sem curinga nem pasta', outras, []);
const libera = new Set(linhas.slice(1).map(l => l.slice(1)));
ok('todo arquivo liberado existe', [...libera].filter(f => !fs.existsSync(path.join(__dirname, f))), []);

console.log('\n── tudo o que o painel pede sai ──');
const pedidos = new Set(['vercel.json']);
const local = s => s && !/^(https?:|data:|javascript:|mailto:|#|\$\{)/.test(s);
const raiz = s => s.replace(/^\//, '').replace(/[?#].*$/, '');
for (const f of ['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html']) {
  // comentário que cita um arquivo ("o relatorios.test.js prende…") não é pedido
  const t = ler(f).replace(/<!--[\s\S]*?-->/g, ' ').replace(/^[ \t]*\/\/.*$/gm, ' ');
  for (const m of t.matchAll(/(?:src|href)=["']([^"'<>]+)["']/g)) if (local(m[1]) && !m[1].includes('${')) pedidos.add(raiz(m[1]));
  // caminhos em texto do JS: '/rp-core.js', '/manifest-diretoria.json', 'patrimar-logo.png'
  for (const m of t.matchAll(/['"`]\/?([A-Za-z0-9_-]+(?:[.-][A-Za-z0-9_]+)*\.(?:js|json|png|webmanifest))(?:\?[^'"`]*)?['"`]/g)) {
    // pdf.js vem do cdnjs (UCV_PDFJS + 'pdf.min.js'): não é arquivo do site
    if (/^pdf(\.worker)?\.min\.js$/.test(m[1])) continue;
    pedidos.add(m[1]);
  }
}
for (const f of [...pedidos].filter(p => /^manifest.*\.json$/.test(p))) {
  const m = JSON.parse(ler(f));
  (m.icons || []).forEach(i => pedidos.add(raiz(i.src)));
}
for (const m of ler('sw-mobile.js').matchAll(/'\/([A-Za-z0-9_.-]+\.js)'/g)) pedidos.add(m[1]);
const vj = JSON.parse(ler('vercel.json'));
(vj.rewrites || []).forEach(r => pedidos.add(raiz(r.destination)));
(vj.headers || []).forEach(h => { if (/^\/[A-Za-z0-9_.-]+\.(js|json|png|html)$/.test(h.source)) pedidos.add(raiz(h.source)); });
ok('o painel pede ao menos os dois HTMLs, os dois módulos, o service worker e os manifests',
   ['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html', 'rp-core.js', 'paradas-calc.js', 'sw-mobile.js',
    'manifest.json', 'manifest-mobile.json', 'manifest-diretoria.json', 'patrimar-logo.png'].filter(f => !pedidos.has(f)), []);
ok('tudo o que o painel pede está liberado (senão é 404 em produção)', [...pedidos].filter(p => !libera.has(p)).sort(), []);

console.log('\n── nada interno sai ──');
const interno = f => /\.(md|gs|test\.js)$/.test(f) || /^(lint-js|testes)\.js$/.test(f) || f.startsWith('.') || /^docs?\b/.test(f);
ok('nenhum documento, .gs, teste, ferramenta ou pasta oculta na lista', [...libera].filter(interno), []);
const naRaiz = fs.readdirSync(__dirname).filter(f => f !== '.git');
ok('e na raiz eles existem (o teste confere coisa de verdade)',
   ['CLAUDE.md', 'ritmoprod_appscript.gs', 'docs', '.claude', 'relatorios.test.js'].every(f => naRaiz.includes(f)), true);

console.log(falhas === 0
  ? '\n✅ deploy ok — o site publica o painel e só o painel\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
