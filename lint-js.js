#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   LINT DO PROJETO  —  node lint-js.js
   ═══════════════════════════════════════════════════════════════════════════
   É a parte AUTOMÁTICA do padrão do código (docs/padrao-codigo.md). O revisor
   do projeto (/revisor-codigo) roda isto antes de olhar o diff; quem mexe no
   código roda pelo `node testes.js`, junto com as suítes.

   Por que existe: os painéis são HTML autocontido, o JS mora dentro de
   <script>, e nenhum teste de conta vê um NOME que não existe. Foi assim que o
   relatório do período parou de abrir duas vezes seguidas (`ehCor` fora do
   `const {...}=_phAgrup()`; `_fonteHoje` declarado dentro do calcPorModelo):
   o popup morria em ReferenceError com as suítes verdes.

   DUAS conferências:
   1. FUNÇÃO SEM USO (sem rede, sempre roda): função declarada no nível de cima
      de um arquivo que ninguém chama — nem no código, nem num onclick, nem num
      HTML montado em texto. Código morto confunde quem lê (parece regra que
      vale) e é onde a correção vai parar por engano: o Excel do histórico foi
      "corrigido" na v7.202.0 numa função que nenhum botão chamava.
      Comentário não conta como uso.
   2. ESLINT (precisa do npx; baixa o eslint na 1ª vez, com rede):
        no-undef ........... nome usado sem existir (o caso do relatório)
        no-redeclare ....... a mesma função/variável declarada duas vezes
        no-dupe-keys ....... chave repetida no mesmo objeto (a 2ª apaga a 1ª)
        no-duplicate-case .. o mesmo case duas vezes no switch
        no-dupe-else-if .... o mesmo teste duas vezes no if/else if
        no-self-assign ..... x = x
        no-unreachable ..... código depois do return
        no-const-assign .... atribuir a const (quebra em runtime)
        no-unused-vars ..... variável LOCAL calculada e nunca usada
      Sem o npx (ou sem rede), avisa e roda só a 1.

   As linhas do erro são as do ARQUIVO (do HTML, não do JS extraído): fora dos
   <script>, tudo vira espaço, e a linha e a coluna batem com o editor.
   ═══════════════════════════════════════════════════════════════════════════ */
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

// ── Globais que existem de verdade em runtime ────────────────────────────────
// Um nome NOVO só entra aqui depois de alguém confirmar que ele existe mesmo —
// senão a guarda vira enfeite.
const G_NAVEGADOR = [
  'window','document','console','location','localStorage','sessionStorage','navigator',
  'alert','confirm','prompt','open','print','fetch','setTimeout','clearTimeout',
  'setInterval','clearInterval','requestAnimationFrame','performance','screen','history',
  'URL','URLSearchParams','Blob','FileReader','Image','Notification','MouseEvent','Event',
  'CustomEvent','AbortController','matchMedia','getComputedStyle','indexedDB','btoa','atob',
  'caches','serviceWorker','ResizeObserver',
];
// bibliotecas por CDN (desktop)
const G_CDN = ['Chart','XLSX'];
// o que o rp-core.js / paradas-calc.js publicam e os painéis usam
const G_MODULOS = [
  'RP_CORE','RP_PARADAS','p2','fmtN','fmtP','fmt1','plural','toMin','fromMin',
  'normHora','hojeStr','dtToStr','mergeMedias','calcAtrasoHoras','sc','efNoRitmo','slRitmo',
  'uepCard','UEP_META_PADRAO','UEP_MIN_DIA','uepPorHora','_uepHHMM','uepCelula','uepDiaMeta','uepDiaHe','histDiaFds','metaDiasParadas','metaMedianaUteis','uepHistResumo','uepFimDeSemana','uepCusto','uepCustoPeriodo','minSlotDecorrido',
  'nomeComCor','_rpOk','PDIA_LARG','pdiaVol','pdiaBase','pdiaCurto','pdiaMontar','pdiaParMontar','PDIA_PAR_ROT_PX','atrasoVencido',
  'PARADA_A_INFORMAR','paradaAInformar',
  'UEP_HORA_TOL_MIN','uepHorasDia','uepHoraJulga','uepCxComHora','uepMinTxt','uepProj','uepDoProduto','uepGerMontar',
];
// Apps Script (ritmoprod_appscript.gs)
const G_APPS_SCRIPT = [
  'SpreadsheetApp','Logger','PropertiesService','CacheService','LockService','Utilities',
  'ContentService','HtmlService','ScriptApp','Session','UrlFetchApp','MailApp','DriveApp','console',
];
// service worker do celular
const G_SW = ['self','caches','fetch','Response','Request','clients','URL','console'];

// ── O que é conferido ────────────────────────────────────────────────────────
// `usoEm`: onde se procura o uso das funções do arquivo (as do rp-core são
// chamadas pelos dois painéis). `funcoes:false`: sem a conferência 1.
const ALVOS = [
  { arq:'ritmoprod_embalagem_v7.html', html:true, globais:[...G_NAVEGADOR, ...G_CDN, ...G_MODULOS] },
  { arq:'ritmoprod_mobile.html',       html:true, globais:[...G_NAVEGADOR, ...G_MODULOS] },
  { arq:'rp-core.js',      globais:G_NAVEGADOR, usoEm:['ritmoprod_embalagem_v7.html','ritmoprod_mobile.html'] },
  { arq:'paradas-calc.js', globais:[...G_NAVEGADOR, 'module', 'globalThis'] },
  { arq:'sw-mobile.js',    globais:G_SW, funcoes:false },
  { arq:'ritmoprod_appscript.gs', globais:G_APPS_SCRIPT },
];

// ── Função sem uso que FICA, com o porquê ────────────────────────────────────
// Entra aqui só o que não é chamado pelo código de propósito. Cada linha diz
// por quê; "pode ser útil um dia" não é motivo — o git guarda o que sai.
const SEM_USO_OK = {
  'ritmoprod_embalagem_v7.html': {
    // a ENTRADA de dados por Excel local: os botões saíram (os dados vêm só do
    // Sheets) e as funções ficaram, por decisão registrada no CLAUDE.md
    selecionarPasta: 'importar Excel local — sem botão desde que os dados vêm só do Sheets',
    triggerImport:   'importar Excel local — sem botão desde que os dados vêm só do Sheets',
    exportarExcel: 'Excel do HISTÓRICO sem botão na tela (sumiu antes de 06/11/2026). Decisão do PPCP: o botão volta ou a função sai.',
  },
  // .gs: o Apps Script chama doGet/onEdit, e as demais rodam pelo editor
  // (botão Executar) — ninguém no código as chama, e é para ser assim.
  'ritmoprod_appscript.gs': Object.fromEntries([
    'doGet','onEdit',
    // simulações e conferências (não gravam)
    'simularArquivamento','simularSeparacaoPorProduto','simularHoraExtraPassada','simularEsteiraPorModelo',
    'relatorioTempos','testeGetDados','testeGetHistory','testeArquivarHoje','testarRedacaoIA','testeFecharAgora',
    // manutenção que grava (rodar pelo editor, com cuidado)
    'arquivarConcluidosAgora','preencherHoraExtraPassada','recalcularHoraExtraPassada','preencherUepPassada',
    'regravarUepPassada','instalarGatilhoAquecimento','instalarGatilhos','corrigirDatasHistorico','zerarPainelAgora',
  ].map(n => [n, 'roda pelo editor do Apps Script ou pelo próprio Apps Script']).concat([
    // morta, mas mexer no .gs pede re-deploy manual: sai junto com a próxima
    // mudança de verdade no .gs (e aí esta linha sai também)
    ['_soLetras', 'sem uso — tirar na próxima versão do .gs'],
  ])),
};

// ─────────────────────────────────────────────────────────────────────────────
const RAIZ = __dirname;
const ler = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const existe = f => fs.existsSync(path.join(RAIZ, f));

// O JS de um HTML com a MESMA geometria do arquivo: fora dos <script> (sem
// src), tudo vira espaço e as quebras de linha ficam. Linha e coluna batem.
function jsDoHtml(txt) {
  const re = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g;
  const branco = s => s.replace(/[^\n]/g, ' ');
  let out = '', pos = 0, m;
  while ((m = re.exec(txt))) {
    const ini = m.index + m[0].indexOf('>') + 1, fim = ini + m[1].length;
    out += branco(txt.slice(pos, ini)) + txt.slice(ini, fim);
    pos = fim;
  }
  return out + branco(txt.slice(pos));
}

// Texto sem comentário, para contar uso: linha que começa com //, bloco /* */
// que começa no começo da linha e comentário de HTML. Comentário que menciona
// uma função não faz dela uma função usada.
function semComentario(txt) {
  return txt
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^[ \t]*\/\*[\s\S]*?\*\//gm, ' ')
    .replace(/^[ \t]*\/\/.*$/gm, ' ');
}

// Quantas vezes cada identificador aparece (código, onclick, HTML em texto).
function contagem(txt) {
  const c = new Map();
  for (const m of txt.matchAll(/[A-Za-z_$][\w$]*/g)) c.set(m[0], (c.get(m[0]) || 0) + 1);
  return c;
}

// ── 1. Função sem uso ────────────────────────────────────────────────────────
function funcoesSemUso() {
  const achados = [];
  for (const a of ALVOS) {
    if (a.funcoes === false || !existe(a.arq)) continue;
    const txt = ler(a.arq);
    const js = a.html ? jsDoHtml(txt) : txt;
    const cont = contagem([txt, ...(a.usoEm || []).filter(existe).map(ler)].map(semComentario).join('\n'));
    const ok = SEM_USO_OK[a.arq] || {};
    const linhas = js.split('\n');
    linhas.forEach((l, i) => {
      // só o nível de cima do arquivo (coluna 0): as locais são do eslint
      const m = l.match(/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/);
      if (!m || ok[m[1]]) return;
      if ((cont.get(m[1]) || 0) <= 1) achados.push(`${a.arq}:${i + 1}  função sem uso: ${m[1]}`);
    });
    // exceção que já não precisa: a função voltou a ser usada ou saiu
    for (const n of Object.keys(ok)) {
      const decl = new RegExp('^(?:async\\s+)?function\\s*' + n.replace(/\$/g, '\\$') + '\\s*\\(', 'm');
      if (!decl.test(js)) achados.push(`${a.arq}  SEM_USO_OK cita ${n}, que não existe mais — tire da lista`);
      else if ((cont.get(n) || 0) > 1 && !a.arq.endsWith('.gs'))
        achados.push(`${a.arq}  SEM_USO_OK cita ${n}, que agora é usada — tire da lista`);
    }
  }
  return achados;
}

// ── 2. ESLint ────────────────────────────────────────────────────────────────
const REGRAS = {
  'no-undef': 'error', 'no-redeclare': 'error', 'no-dupe-keys': 'error',
  'no-duplicate-case': 'error', 'no-dupe-else-if': 'error', 'no-self-assign': 'error',
  'no-unreachable': 'error', 'no-const-assign': 'error',
  'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
};

function eslint() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rp-lint-'));
  const nomes = {};   // arquivo temporário → arquivo do projeto
  const blocos = [];
  for (const a of ALVOS) {
    if (!existe(a.arq)) continue;
    const tmp = a.arq.endsWith('.js') ? a.arq : a.arq + '.js';
    fs.writeFileSync(path.join(dir, tmp), a.html ? jsDoHtml(ler(a.arq)) : ler(a.arq));
    nomes[tmp] = a.arq;
    const g = a.globais.map(n => `${JSON.stringify(n)}:'readonly'`).join(',');
    blocos.push(`{ files:[${JSON.stringify(tmp)}], languageOptions:{ ecmaVersion:2023, sourceType:'script', globals:{${g}} }, rules:${JSON.stringify(REGRAS)} }`);
  }
  fs.writeFileSync(path.join(dir, 'eslint.config.mjs'), `export default [\n${blocos.join(',\n')}\n];\n`);
  let saida;
  try {
    // roda DENTRO da pasta temporária: o eslint recusa arquivo fora da base do
    // config, e é lá que estão o config e o JS extraído
    saida = execFileSync('npx', ['--yes', 'eslint@10', '-f', 'json', '.'],
      { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
  } catch (e) {
    if (e.code === 'ENOENT') return { pulou: 'npx não encontrado' };
    saida = e.stdout;   // eslint sai com 1 quando acha erro: o JSON vem do mesmo jeito
    if (!saida || !saida.trim().startsWith('[')) return { pulou: 'o eslint não rodou (sem rede para baixar?) — ' + String(e.stderr || e.message).trim().split('\n').pop() };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  const achados = [];
  for (const r of JSON.parse(saida)) {
    const arq = nomes[path.basename(r.filePath)] || path.basename(r.filePath);
    for (const m of r.messages) achados.push(`${arq}:${m.line}:${m.column}  ${m.ruleId || 'parse'}  ${m.message}`);
  }
  return { achados };
}

// ─────────────────────────────────────────────────────────────────────────────
const f1 = funcoesSemUso();
const f2 = eslint();
f1.forEach(l => console.log('❌ ' + l));
if (f2.pulou) console.log('⚠ eslint pulado: ' + f2.pulou + '. Só a conferência de função sem uso rodou.');
else f2.achados.forEach(l => console.log('❌ ' + l));
const n = f1.length + (f2.achados ? f2.achados.length : 0);
if (n) {
  console.log(`\n❌ lint: ${n} achado(s). O padrão está em docs/padrao-codigo.md.`);
  process.exit(1);
}
console.log('✅ lint ok — ' + ALVOS.filter(a => existe(a.arq)).length + ' arquivos'
  + (f2.pulou ? ' (só função sem uso)' : '') + '.');
