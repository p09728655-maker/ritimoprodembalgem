#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   LINT DO JS EMBUTIDO NOS HTMLs  —  node lint-js.js
   ═══════════════════════════════════════════════════════════════════════════
   Os painéis são HTML autocontido: o JS mora dentro de <script>, e nenhum
   teste de conta vê um NOME que não existe. Foi assim que o relatório do
   período parou de abrir duas vezes seguidas:
     • `ehCor` usado sem estar no `const {...}=_phAgrup()` daquela função;
     • `_fonteHoje` usado no render, mas declarado dentro do calcPorModelo.
   Nos dois casos o popup abria, morria em ReferenceError e ficava no
   "Carregando relatório..." — com as seis suítes verdes.

   Este script extrai o JS dos HTMLs e roda o eslint só com a regra `no-undef`.
   NÃO é dependência do projeto: o npx baixa o eslint na primeira vez, então
   precisa de rede. Sem rede, o script avisa e sai sem falhar o resto.

   Rodar SEMPRE que mexer nos <script> dos HTMLs.
   ═══════════════════════════════════════════════════════════════════════════ */
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HTMLS = ['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'];

// Globais que existem de verdade em runtime: os do navegador e os que o
// rp-core.js / paradas-calc.js publicam. Um nome NOVO só entra aqui depois de
// alguém confirmar que ele existe mesmo — senão a guarda vira enfeite.
const GLOBAIS = [
  // navegador
  'window','document','console','location','localStorage','sessionStorage','navigator',
  'alert','confirm','prompt','open','print','fetch','setTimeout','clearTimeout',
  'setInterval','clearInterval','requestAnimationFrame','performance','screen','history',
  'URL','URLSearchParams','Blob','FileReader','Image','Notification','MouseEvent','Event',
  'CustomEvent','AbortController','matchMedia','getComputedStyle','indexedDB','btoa','atob',
  'caches','serviceWorker',
  // bibliotecas por CDN
  'Chart','XLSX',
  // módulos próprios (rp-core.js / paradas-calc.js)
  'RP_CORE','RP_PARADAS','RP_SEMANA','p2','fmtN','fmtP','fmt1','plural','toMin','fromMin',
  'normHora','hojeStr','dtToStr','mergeMedias','calcAtrasoHoras','sc','efNoRitmo',
  'nomeComCor','_rpOk',
];

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rp-lint-'));
let n = 0;
HTMLS.forEach(f => {
  if (!fs.existsSync(f)) return;
  const js = [...fs.readFileSync(f, 'utf8')
    .matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  if (!js.trim()) return;
  fs.writeFileSync(path.join(dir, f.replace(/\.html$/, '.js')), js);
  n++;
});
if (!n) { console.log('Nenhum HTML com script embutido para conferir.'); process.exit(0); }

const globals = GLOBAIS.map(g => `${JSON.stringify(g)}:'readonly'`).join(',');
fs.writeFileSync(path.join(dir, 'eslint.config.mjs'),
  `export default [{ files:['**/*.js'],\n` +
  `  languageOptions:{ ecmaVersion:2023, sourceType:'script', globals:{${globals}} },\n` +
  `  rules:{ 'no-undef':'error' } }];\n`);

try {
  // roda DENTRO da pasta temporária: o eslint recusa arquivo fora da base do
  // config, e é lá que estão o config e o JS extraído
  execFileSync('npx', ['--yes', 'eslint@10', '.'], { cwd: dir, stdio: 'inherit' });
  console.log('✅ lint ok — nenhum nome usado sem existir nos ' + n + ' painel(is).');
} catch (e) {
  if (e.code === 'ENOENT') {
    console.log('⚠ npx não encontrado — pulei o lint (ele é opcional).');
    process.exit(0);
  }
  console.log('\n❌ lint achou nome(s) usado(s) sem existir — veja acima.');
  process.exit(1);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
