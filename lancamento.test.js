// Qual hora aceita lançamento no MOBILE — a hora corrente E a recém-fechada
// (janela de tolerância).
//   node lancamento.test.js
//
// O teste roda o código REAL: `slotLancavel` e a constante são extraídos do
// ritmoprod_mobile.html e avaliados aqui.
//
// O caso que deu origem a tudo (28/08/2026): o slot pós-almoço 12:12-13:00 —
// o mais curto do turno, 48 min — fechou em 0 cx. O operador foi lançar depois
// das 13:00, a hora já estava bloqueada ("só a hora atual aceita lançamento")
// e as caixas entraram na hora seguinte: PIOR HORA 0, VALE DE PRODUÇÃO 12:12
// no gerencial, e a hora seguinte inflada. A tolerância cobre o "fechou agora
// e ainda não lancei"; hora mais antiga continua bloqueada.

const fs = require('fs');
const path = require('path');
const MOB = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
const MJS = [...MOB.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function pega(src, assinatura) {
  const i = src.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei: ' + assinatura);
  const j = src.indexOf('{', src.indexOf(')', i));
  let n = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') n++;
    else if (src[k] === '}' && --n === 0) return src.slice(i, k + 1);
  }
  throw new Error('função não fecha: ' + assinatura);
}

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

// const dentro de eval fica preso ao escopo do próprio eval — vira var.
eval(MJS.match(/const LANC_TOLERANCIA_MIN = \d+;/)[0].replace('const ', 'var '));
eval(pega(MJS, 'function slotLancavel('));

const min = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const s1212 = { ini: min('12:12'), fim: min('13:00') };   // o slot do caso real

console.log('── hora corrente ──');
ok('12:30 dentro do 12:12-13:00 → ativo',
   slotLancavel(min('12:30'), s1212.ini, s1212.fim), { ativo: true, tolerancia: false, lancavel: true });
ok('exatamente no início conta como corrente',
   slotLancavel(min('12:12'), s1212.ini, s1212.fim).ativo, true);

console.log('\n── recém-fechada: a janela de tolerância ──');
ok('13:05 (o caso real) → tolerância, ainda aceita',
   slotLancavel(min('13:05'), s1212.ini, s1212.fim), { ativo: false, tolerancia: true, lancavel: true });
ok('exatamente no fim já é tolerância, não hora corrente',
   slotLancavel(min('13:00'), s1212.ini, s1212.fim), { ativo: false, tolerancia: true, lancavel: true });
ok('último minuto da janela ainda aceita',
   slotLancavel(s1212.fim + LANC_TOLERANCIA_MIN - 1, s1212.ini, s1212.fim).lancavel, true);
ok('estourou a janela → bloqueada',
   slotLancavel(s1212.fim + LANC_TOLERANCIA_MIN, s1212.ini, s1212.fim).lancavel, false);

console.log('\n── o que continua bloqueado ──');
ok('hora antiga (fechou há 1h) não reabre — corrigir o passado é na planilha',
   slotLancavel(min('14:00'), s1212.ini, s1212.fim).lancavel, false);
ok('hora futura não aceita',
   slotLancavel(min('11:30'), s1212.ini, s1212.fim), { ativo: false, tolerancia: false, lancavel: false });
ok('a janela é curta de propósito (minutos, não horas)',
   LANC_TOLERANCIA_MIN >= 5 && LANC_TOLERANCIA_MIN <= 30, true);

console.log('\n── guarda-corpo: a regra é UMA, e a lista usa ela ──');
// A lista de lançamentos decide o bloqueio pela função — não por uma segunda
// cópia da conta. Foi duplicação de regra que fez as contas de paradas
// divergirem três vezes (ver CLAUDE.md).
ok('renderLancamentos chama slotLancavel', /const lc = slotLancavel\(nm, ini, fim\)/.test(MJS), true);
ok('o bloqueio sai da função', /bloqueado = !lc\.lancavel/.test(MJS), true);
ok('a regra antiga ("só a hora atual") não voltou', /bloqueado = !ativo/.test(MJS), false);
ok('slotLancavel é implementação única', (MJS.match(/function slotLancavel\(/g) || []).length, 1);
// O bipe continua abrindo só a hora CORRENTE (produção acontecendo agora) —
// a tolerância é para o toque consciente na linha, não para atribuição
// automática, que erraria justamente na virada da hora.
ok('abrirLancSlotAtivo segue na hora corrente', /nm>=ini && nm<fim\){\s*\/\/ hora corrente, aceita lançamento/.test(MJS), true);
// E o operador vê até quando a hora recém-fechada aceita.
ok('a linha diz até quando aceita', /aceita lançamento até \$\{fromMin\(fim\+LANC_TOLERANCIA_MIN\)\}/.test(MJS), true);

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo passou');
process.exit(falhas ? 1 : 0);
