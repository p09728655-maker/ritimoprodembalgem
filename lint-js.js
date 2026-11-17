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
   1. SEM USO (sem rede, sempre roda): função ou constante declarada no nível
      de cima (coluna 0) que ninguém usa — nem no código, nem num onclick, nem
      num HTML montado em texto. Código morto confunde quem lê (parece regra
      que vale) e é onde a correção vai parar por engano: o Excel do histórico
      foi "corrigido" na v7.202.0 numa função que nenhum botão chamava.
      Comentário (de linha ou de bloco, em qualquer ponto) não conta como uso;
      o nome dentro de texto conta (é o onclick montado), e `obj.nome` também.
      No paradas-calc.js tudo mora dentro de uma IIFE: lá quem confere é o
      no-unused-vars do eslint (item 2).
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
      Sem o npx ou sem rede, avisa e roda só a 1. Qualquer OUTRO erro do
      eslint (config, regra mal escrita) reprova — nunca "pulado".

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
  'caches','ResizeObserver',   // serviceWorker solto NÃO existe na janela: é navigator.serviceWorker
];
// bibliotecas por CDN (desktop)
const G_CDN = ['Chart','XLSX'];
// o que o rp-core.js / paradas-calc.js publicam e os painéis usam
const G_MODULOS = [
  'RP_CORE','RP_PARADAS','p2','fmtN','fmtP','fmt1','plural','toMin','fromMin',
  'normHora','hojeStr','dtToStr','mergeMedias','calcAtrasoHoras','sc','efNoRitmo','slRitmo',
  'uepCard','UEP_META_PADRAO','UEP_MIN_DIA','uepPorHora','_uepHHMM','uepCelula','uepDiaMeta','uepDiaHe','histDiaFds','metaDiasParadas','metaMedianaUteis','uepHistResumo','uepFimDeSemana','uepCusto','uepCustoPeriodo','minSlotDecorrido',
  'nomeComCor','_rpOk','PDIA_LARG','pdiaVol','pdiaBase','pdiaCurto','pdiaMontar','pdiaParMontar','PDIA_PAR_ROT_PX','atrasoVencido','atrasoPtsTxt','loteIntMontar',
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

// A marcação de um HTML (o que fica FORA dos <script>), sem comentário de
// HTML: é onde moram os onclick="…" escritos à mão.
function marcacaoDoHtml(txt) {
  return txt.replace(/(<script(?![^>]*src=)[^>]*>)[\s\S]*?(<\/script>)/g, '$1$2').replace(/<!--[\s\S]*?-->/g, ' ');
}

// O JS sem os comentários — // e /* */ em qualquer ponto da linha —, sem mexer
// em texto ('…', "…", `…${…}…`) nem em expressão regular. O comentário vira
// espaço; texto e regex ficam (um nome dentro de texto CONTA como uso: é assim
// que o onclick montado em texto chama a função).
// O que decide se uma "/" abre regex é o que veio antes: operador, abre-
// parêntese ou palavra como return → regex; nome, número, ")" ou "]" → divisão.
const RE_ANTES_DE_REGEX = /[(,=:[!&|?{};+\-*%<>~^]/;
const PALAVRA_ANTES_DE_REGEX = /^(return|typeof|case|in|of|new|delete|void|throw|else|do|yield|await|instanceof)$/;
function semComentarioJs(src) {
  const n = src.length, out = [], tpl = [];   // tpl: chaves abertas dentro de cada ${ … }
  let i = 0, lc = '', lw = '';                  // último caractere e última palavra de código
  const copia = (a, b) => out.push(src.slice(a, b));
  const branco = (a, b) => out.push(src.slice(a, b).replace(/[^\n]/g, ' '));
  const template = () => {   // a partir de i, dentro da crase: até a crase ou o próximo ${
    for (let j = i; j < n; j++) {
      if (src[j] === '\\') { j++; continue; }
      if (src[j] === '`') { copia(i, j + 1); i = j + 1; lc = ')'; lw = ''; return; }
      if (src[j] === '$' && src[j + 1] === '{') { copia(i, j + 2); i = j + 2; tpl.push(0); lc = '{'; lw = ''; return; }
    }
    copia(i, n); i = n;
  };
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { const j = src.indexOf('\n', i); const f = j < 0 ? n : j; branco(i, f); i = f; continue; }
    if (c === '/' && d === '*') { const j = src.indexOf('*/', i + 2); const f = j < 0 ? n : j + 2; branco(i, f); i = f; continue; }
    if (c === '\'' || c === '"') {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      copia(i, j + 1); i = j + 1; lc = ')'; lw = ''; continue;
    }
    if (c === '`') { i++; out.push(c); template(); continue; }
    if (c === '/' && (lw ? PALAVRA_ANTES_DE_REGEX.test(lw) : (!lc || RE_ANTES_DE_REGEX.test(lc)))) {
      let j = i + 1, classe = false;
      for (; j < n && src[j] !== '\n'; j++) {
        const ch = src[j];
        if (ch === '\\') { j++; continue; }
        if (ch === '[') classe = true;
        else if (ch === ']') classe = false;
        else if (ch === '/' && !classe) break;
      }
      j++;
      while (j < n && /[a-z]/i.test(src[j])) j++;
      copia(i, j); i = j; lc = ')'; lw = ''; continue;
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w$]/.test(src[j])) j++;
      lw = src.slice(i, j); lc = 'a'; copia(i, j); i = j; continue;
    }
    if (c === '{' && tpl.length) tpl[tpl.length - 1]++;
    if (c === '}' && tpl.length) {
      if (tpl[tpl.length - 1] === 0) { tpl.pop(); out.push(c); i++; template(); continue; }
      tpl[tpl.length - 1]--;
    }
    if (!/\s/.test(c)) { lc = /\d/.test(c) ? '0' : c; lw = ''; }
    out.push(c); i++;
  }
  return out.join('');
}

// O texto onde se procura o uso: o JS sem comentário e, no HTML, a marcação.
const textoDeUso = arq => {
  const txt = ler(arq);
  return arq.endsWith('.html') ? semComentarioJs(jsDoHtml(txt)) + '\n' + marcacaoDoHtml(txt) : semComentarioJs(txt);
};

// Quantas vezes cada identificador aparece.
function contagem(txt) {
  const c = new Map();
  for (const m of txt.matchAll(/[A-Za-z_$][\w$]*/g)) c.set(m[0], (c.get(m[0]) || 0) + 1);
  return c;
}

// ── 1. Sem uso: função e constante do nível de cima ──────────────────────────
// Nível de cima = declarada na coluna 0 (as locais são do eslint). Constante
// de regra sem uso é pior que função morta: parece a regra que vale e não é.
const DECL = /^(?:(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=)/;
function semUso() {
  const achados = [];
  for (const a of ALVOS) {
    if (a.funcoes === false || !existe(a.arq)) continue;
    const js = a.html ? jsDoHtml(ler(a.arq)) : ler(a.arq);
    const cont = contagem([a.arq, ...(a.usoEm || []).filter(existe)].map(textoDeUso).join('\n'));
    const ok = SEM_USO_OK[a.arq] || {};
    const decl = new Set();
    js.split('\n').forEach((l, i) => {
      const m = l.match(DECL);
      if (!m) return;
      const nome = m[1] || m[2];
      decl.add(nome);
      if (!ok[nome] && (cont.get(nome) || 0) <= 1)
        achados.push(`${a.arq}:${i + 1}  ${m[1] ? 'função' : 'constante'} sem uso: ${nome}`);
    });
    // exceção que já não precisa: saiu do arquivo ou voltou a ser usada
    for (const n of Object.keys(ok)) {
      if (!decl.has(n)) achados.push(`${a.arq}  SEM_USO_OK cita ${n}, que não existe mais — tire da lista`);
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
    if (!saida || !saida.trim().startsWith('[')) {
      // Só a falta de rede (o npx não baixou o eslint) é "pulado". Qualquer
      // outro erro — config, regra mal escrita, arquivo que nem compila — é
      // FALHA: pular calado deixaria a guarda inteira desligada com tudo verde.
      const err = String(e.stderr || e.message).trim();
      if (/npm (error|ERR!)|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|ECONNRESET/.test(err))
        return { pulou: 'sem rede para baixar o eslint — ' + err.split('\n').pop() };
      return { erro: err.split('\n').slice(-12).join('\n') };
    }
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
const f1 = semUso();
const f2 = eslint();
f1.forEach(l => console.log('❌ ' + l));
if (f2.erro) console.log('❌ o eslint não rodou:\n' + f2.erro);
else if (f2.pulou) console.log('⚠ eslint pulado: ' + f2.pulou + '. Só a conferência de sem uso rodou.');
else f2.achados.forEach(l => console.log('❌ ' + l));
const n = f1.length + (f2.achados ? f2.achados.length : 0) + (f2.erro ? 1 : 0);
if (n) {
  console.log(`\n❌ lint: ${n} achado(s). O padrão está em docs/padrao-codigo.md.`);
  process.exit(1);
}
console.log('✅ lint ok — ' + ALVOS.filter(a => existe(a.arq)).length + ' arquivos'
  + (f2.pulou ? ' (só sem uso)' : '') + '.');
