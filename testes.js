#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   TODAS AS CONFERÊNCIAS DO PROJETO  —  node testes.js
   ═══════════════════════════════════════════════════════════════════════════
   Roda as suítes (*.test.js, uma de cada vez, na ordem do nome) e depois o
   lint (lint-js.js). Sai com 1 se qualquer uma falhar. É o que se roda antes
   de todo commit, e é por onde o revisor do projeto (/revisor-codigo) começa.

   Suíte nova: basta estar na raiz do repositório com o nome terminado em
   .test.js — ela entra sozinha. Não precisa (e não deve) ser cadastrada aqui.
   Cada uma tem até LIMITE_MS: suíte que passa disso (um timer pendurado)
   reprova, em vez de travar a rodada inteira calada.

     node testes.js            tudo
     node testes.js uep tela   só as suítes com "uep" ou "tela" no nome (+ lint)
     node testes.js --sem-lint só as suítes
   ═══════════════════════════════════════════════════════════════════════════ */
const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RAIZ = __dirname;
const LIMITE_MS = 2 * 60 * 1000;
const args = process.argv.slice(2);
const semLint = args.includes('--sem-lint');
const filtros = args.filter(a => !a.startsWith('--'));

const suites = fs.readdirSync(RAIZ)
  .filter(f => f.endsWith('.test.js'))
  .filter(f => !filtros.length || filtros.some(t => f.includes(t)))
  .sort();
if (!suites.length) { console.log('Nenhuma suíte com ' + filtros.join(', ')); process.exit(1); }

const roda = (arq, limite = LIMITE_MS) => {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(RAIZ, arq)],
    { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 << 20, timeout: limite, killSignal: 'SIGKILL' });
  const estourou = r.error && r.error.code === 'ETIMEDOUT';
  return { arq, ok: r.status === 0, ms: Date.now() - t0,
    saida: (r.stdout || '') + (r.stderr || '') + (estourou ? `\nerro: passou de ${limite / 1000} s — timer pendurado?` : '') };
};

const res = suites.map(f => {
  const r = roda(f);
  console.log(`${r.ok ? '✅' : '❌'} ${f.padEnd(26)} ${String(r.ms).padStart(5)} ms`);
  return r;
});
if (!semLint) {
  const r = roda('lint-js.js', 5 * 60 * 1000);   // a 1ª vez o npx baixa o eslint
  const pulou = /eslint pulado/.test(r.saida);
  console.log(`${r.ok ? (pulou ? '⚠ ' : '✅') : '❌'} ${'lint-js.js'.padEnd(26)} ${String(r.ms).padStart(5)} ms${pulou ? '  (só a conferência de sem uso — sem npx ou sem rede)' : ''}`);
  res.push(r);
}

const falhas = res.filter(r => !r.ok);
// Na falha, o que importa da saída: as linhas com ❌ (e o erro, se a suíte
// morreu antes de conferir). A saída inteira está a um `node <arquivo>`.
falhas.forEach(r => {
  const linhas = r.saida.split('\n');
  const marcadas = linhas.filter(l => /❌|Error|erro:/i.test(l));
  console.log(`\n── ${r.arq} ──\n` + (marcadas.length ? marcadas : linhas.slice(-15)).slice(0, 40).join('\n'));
});
console.log(falhas.length
  ? `\n❌ ${falhas.length} de ${res.length} falharam. Para ver tudo: node <arquivo>`
  : `\n✅ ${res.length} de ${res.length} ok.`);
process.exit(falhas.length ? 1 : 0);
