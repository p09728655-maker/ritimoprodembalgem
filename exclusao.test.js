// EXCLUIR LANÇAMENTO: o backend tira das TRÊS abas e o app avisa o repetido.
//   node exclusao.test.js
//
// PPCP, 16/10/2026: "no lançamento eu preciso ter como excluir um lançamento",
// "porque envolve o produto que ele estava fazendo". O caso: 60 cx de LIVREIRO
// ENCANTO (501136004) entraram DUAS vezes na hora 10:00 — a hora foi a 279 em
// vez de 219, e o 2º 60 baixava lote na programação e somava UEP.
//
// O .gs é carregado INTEIRO numa planilha de mentira (como no
// uep-padrao.test.js): getLancamentosHora e excluirLancamento rodam o caminho
// real. As contas do celular (aviso de repetido, lista e confirmação) saem do
// próprio ritmoprod_mobile.html.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const GS = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');
const MOB = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
const MJS = [...MOB.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}
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

// ── planilha de mentira (o cabeçalho REAL da HORA_A_HORA: LANÇ 1 … LANÇ 10) ──
const HDR_HORA = ['HORA', 'META', 'REALIZADO', 'LANÇ 1', 'LANÇ 2', 'LANÇ 3', 'LANÇ 4', 'LANÇ 5', 'LANÇ 6', 'LANÇ 7', 'LANÇ 8', 'LANÇ 9', 'LANÇ 10'];
const LOG_HDR = ['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS', 'PONTOS', 'PESO_KG', 'OPERADOR'];
const FAM_HDR = ['DATA', 'HORA', 'CODIGO_FAMILIA', 'DESCRICAO', 'CAIXAS', 'PESO_KG', 'PONTOS', 'MEDIA_CX_H'];
function montar(o) {
  o = o || {};
  const ABAS = {
    HORA_A_HORA: [[], ['PAINEL HORA A HORA', '', '', 'LANÇAMENTOS'], ['META DO DIA', '2350', '7'], HDR_HORA.slice(),
      ['09:00-10:00', '261', 199, 110, 54, 35],
      ['10:00-11:00', '261', 279, 109, 50, 60, 60],
      ['12:12-13:00', '261', 0],
      ['HE 17:00-18:00', '100', 40, 40]].concat(o.horas || []),
    PRODUCAO_PRODUTO: [LOG_HDR.slice(),
      ['15/10/2026', '10:00', '501136004', 'VOL 1/1 LIVREIRO ENCANTO', 60, 0, 0, 'Mobile'],   // ontem: não entra
      ['16/10/2026', '09:00', '501080007', 'VOL 1/2 CRISTALEIRA ORION', 110, 0, 0, 'Mobile'],
      ['16/10/2026', '10:00', '501080008', 'VOL 2/2 CRISTALEIRA ORION', 109, 0, 0, 'Mobile'],
      ['16/10/2026', '10:00', '501080006', 'VOL 2/2 CRISTALEIRA ORION', 50, 0, 0, 'Mobile'],
      ['16/10/2026', new Date(1899, 11, 30, 10, 0), '501136004', 'VOL 1/1 LIVREIRO ENCANTO', 60, 0, 0, 'Mobile'], // HORA como Date
      ['16/10/2026', '10:00', '501136004', 'VOL 1/1 LIVREIRO ENCANTO', 60, 0, 0, 'Mobile'],
      ['16/10/2026', 'HE 17:00', '501136004', 'VOL 1/1 LIVREIRO ENCANTO', 40, 0, 0, 'Mobile']].concat(o.log || []),
    HISTORICO_MEDIA_FAMILIA: [FAM_HDR.slice(),
      ['16/10/2026', '10:00', '501080', 'VOL 2/2 CRISTALEIRA ORION', 109],
      ['16/10/2026', '10:00', '501080', 'VOL 2/2 CRISTALEIRA ORION', 50],
      ['16/10/2026', '10:00', '501136', 'VOL 1/1 LIVREIRO ENCANTO', 60],
      ['16/10/2026', '10:00', '501136', 'VOL 1/1 LIVREIRO ENCANTO', 60]],
    HISTORICO: [['DATA', 'REALIZADO'], ['15/10/2026', 1640]].concat(o.hist || []),
    PRODUTO_CODIGO: [['CODIGO', 'DESCRICAO', 'COR'],
      ['501136004', 'VOL 1/1 LIVREIRO ENCANTO', 'CINZA'], ['501080008', 'VOL 2/2 CRISTALEIRA ORION', 'OFF WHITE'],
      ['501080006', 'VOL 2/2 CRISTALEIRA ORION', 'NATURE'], ['501080007', 'VOL 1/2 CRISTALEIRA ORION', 'CINAMOMO']],
  };
  function aba(nome) {
    const v = ABAS[nome];
    if (!v) return null;
    return {
      getName: () => nome, getLastRow: () => v.length, getLastColumn: () => Math.max(1, ...v.map(r => r.length)),
      getMaxRows: () => 1000,
      getDataRange: () => ({ getValues: () => v.map(r => r.slice()) }),
      getRange: (l, c, nl, nc) => ({
        getValues: () => { const out = []; for (let i = 0; i < (nl || 1); i++) { const r = v[l - 1 + i] || []; const x = []; for (let j = 0; j < (nc || 1); j++) x.push(r[c - 1 + j] === undefined ? '' : r[c - 1 + j]); out.push(x); } return out; },
        getValue: () => ((v[l - 1] || [])[c - 1] === undefined ? '' : v[l - 1][c - 1]),
        setValue: x => { (v[l - 1] = v[l - 1] || [])[c - 1] = x; },
        setValues: xs => xs.forEach((row, k) => { const r = v[l - 1 + k] = v[l - 1 + k] || []; row.forEach((x, j) => { r[c - 1 + j] = x; }); }),
        setNumberFormat: () => {}, getFormula: () => '',
      }),
      appendRow: r => { v.push(r.slice()); },
      deleteRow: l => { v.splice(l - 1, 1); },
      setFrozenRows: () => {},
    };
  }
  const ss = { getSheetByName: aba, insertSheet: nome => { ABAS[nome] = []; return aba(nome); }, getName: () => 'teste' };
  const CACHE = {};
  const p2 = n => String(n).padStart(2, '0');
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    Utilities: { formatDate: (d, tz, f) => f === 'HH:mm' ? p2(d.getHours()) + ':' + p2(d.getMinutes())
      : f === 'yyyy' ? '2026' : (/HH/.test(f) ? '16/10/2026 12:20:05' : '16/10/2026') },
    CacheService: { getScriptCache: () => ({ get: k => (k in CACHE ? CACHE[k] : null), put: (k, x) => { CACHE[k] = x; }, remove: k => { delete CACHE[k]; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(GS, ctx);
  // A sincronização da programação é a do lançamento (testada no
  // programacao.test.js): aqui só se confere que a exclusão a chama.
  vm.runInContext('var _sincs = 0; sincronizarPlanilhaPosLancamento = function () { _sincs++; };', ctx);
  const run = code => vm.runInContext('(function(){ _invalidarValores(); _catalogoMemo = null; _prodBaseMemo = null; ' + code + ' })()', ctx);
  return { ABAS, run, ctx };
}
const hora = (P, rot) => P.ABAS.HORA_A_HORA.find(r => r[0] === rot).slice(3).filter(x => x !== '' && x !== undefined);
const logHoje = P => P.ABAS.PRODUCAO_PRODUTO.slice(1).filter(r => r[0] === '16/10/2026').map(r => [r[2], r[4]]);
const fam = P => P.ABAS.HISTORICO_MEDIA_FAMILIA.slice(1).map(r => [r[2], r[4]]);

console.log('\n── a lista da hora, com o produto de cada lançamento ──');
{
  const P = montar();
  const r = P.run(`return getLancamentosHora({ horario: '10:00' });`);
  ok('casa as células LANÇ com o registro de produto da hora (a HORA em Date também casa)',
     [r.ok, r.label, r.total, r.lancs.map(x => [x.cx, x.codigo, x.cor]), r.soLog, r.fechado],
     [true, '10:00-11:00', 279, [[109, '501080008', 'OFF WHITE'], [50, '501080006', 'NATURE'], [60, '501136004', 'CINZA'], [60, '501136004', 'CINZA']], [], false]);
  ok('a linha de HE acha o log gravado com o prefixo', P.run(`return getLancamentosHora({ horario: 'HE 17:00' });`).lancs.map(x => [x.cx, x.codigo]),
     [[40, '501136004']]);
  ok('hora que não existe → erro dito, não lista vazia', P.run(`return getLancamentosHora({ horario: '22:00' });`).ok, false);
  const c = P.run(`return _casarLancamentos([{cx:60},{cx:60},{cx:50}], [{cx:60,codigo:'B',desc:'b'},{cx:30,codigo:'C',desc:'c'}]);`);
  ok('célula sem linha no log = sem produto; linha sem célula = SÓ NO LOG (ainda baixa lote)',
     [c.lancs.map(x => [x.cx, x.codigo]), c.soLog.map(x => [x.cx, x.codigo])], [[[60, 'B'], [60, ''], [50, '']], [[30, 'C']]]);
  ok('a leitura não é cacheada nem conta como gravação',
     [/getLancamentosHora:\s*\d+/.test(GS), /ACOES_ESCRITA = \[[^\]]*getLancamentosHora/.test(GS)], [false, false]);
}

console.log('\n── excluir: as TRÊS abas, o registro e a programação ──');
{
  const P = montar();
  const r = P.run(`return excluirLancamento({ horario: '10:00', caixas: '60', produto: '501136004', exclId: 'X1' });`);
  ok('o caso de 16/10: a hora volta a 219', [r.ok, r.totalHora, hora(P, '10:00-11:00')], [true, 219, [109, 50, 60]]);
  ok('sai UMA linha do registro de produto (a ÚLTIMA que casa) e uma da família',
     [logHoje(P).filter(x => x[0] === '501136004' && x[1] === 60).length, fam(P).filter(x => x[0] === '501136' && x[1] === 60).length],
     [1, 1]);
  ok('a linha de ONTEM do mesmo produto e caixas fica', P.ABAS.PRODUCAO_PRODUTO[1], ['15/10/2026', '10:00', '501136004', 'VOL 1/1 LIVREIRO ENCANTO', 60, 0, 0, 'Mobile']);
  ok('a exclusão fica registrada na aba LANC_EXCLUIDOS', P.ABAS.LANC_EXCLUIDOS,
     [['EXCLUIDO_EM', 'DATA', 'HORA', 'CAIXAS', 'CODIGO', 'DESCRICAO', 'ORIGEM', 'TOTAL_HORA_DEPOIS'],
      ['16/10/2026 12:20:05', '16/10/2026', '10:00-11:00', 60, '501136004', 'VOL 1/1 LIVREIRO ENCANTO', 'Mobile', 219]]);
  ok('a programação é recalculada (o FIFO refaz sem o lançamento)', vm.runInContext('_sincs', P.ctx), 1);

  const r2 = P.run(`return excluirLancamento({ horario: '10:00', caixas: '60', produto: '501136004', exclId: 'X1' });`);
  ok('MESMO exclId (retentativa por timeout) não apaga o OUTRO 60', [r2.duplicado, hora(P, '10:00-11:00'), P.ABAS.LANC_EXCLUIDOS.length],
     [true, [109, 50, 60], 2]);
  const r3 = P.run(`return excluirLancamento({ horario: '10:00', caixas: '60', produto: '501136004', exclId: 'X2' });`);
  ok('outro exclId = outra exclusão', [r3.ok, r3.totalHora, hora(P, '10:00-11:00')], [true, 159, [109, 50]]);
}

console.log('\n── excluir: tudo ou nada, e o dia fechado ──');
{
  const P = montar();
  const antes = JSON.stringify(P.ABAS);
  const r = P.run(`return excluirLancamento({ horario: '10:00', caixas: '70', produto: '501136004', exclId: 'A' });`);
  ok('quantidade que não está na hora → não acha e não mexe em nada', [r.ok, r.erro, JSON.stringify(P.ABAS) === antes], [false, 'nao-encontrado', true]);
  const r2 = P.run(`return excluirLancamento({ horario: '10:00', caixas: '50', produto: '501136004', exclId: 'B' });`);
  ok('célula existe mas o produto não está no log com essas caixas → a célula NÃO é limpa', [r2.ok, JSON.stringify(P.ABAS) === antes], [false, true]);
  const r3 = P.run(`return excluirLancamento({ horario: '09:00', caixas: '35', exclId: 'C' });`);
  ok('lançamento sem produto: só a célula sai, o log fica', [r3.ok, hora(P, '09:00-10:00'), logHoje(P).length], [true, [110, 54], 6]);
}
{
  const P = montar({ log: [['16/10/2026', '12:12', '501080008', 'VOL 2/2 CRISTALEIRA ORION', 30, 0, 0, 'Mobile']] });
  const L = P.run(`return getLancamentosHora({ horario: '12:12' });`);
  ok('log sem célula na hora (corrigida na planilha) aparece como SÓ NO LOG', [L.lancs.length, L.soLog.map(x => [x.cx, x.codigo])], [0, [[30, '501080008']]]);
  const r = P.run(`return excluirLancamento({ horario: '12:12', caixas: '30', produto: '501080008', soLog: '1', exclId: 'S' });`);
  ok('soLog=1 apaga só a linha do registro; a hora não muda', [r.ok, r.soLog, hora(P, '12:12-13:00'), logHoje(P).some(x => x[0] === '501080008' && x[1] === 30)],
     [true, true, [], false]);
}
{
  const P = montar({ hist: [['16/10/2026', 760]] });
  const antes = JSON.stringify(P.ABAS);
  const r = P.run(`return excluirLancamento({ horario: '10:00', caixas: '60', produto: '501136004', exclId: 'F' });`);
  ok('dia já no HISTORICO → não exclui (correção na planilha + FECHAR DIA de novo)', [r.ok, r.erro, JSON.stringify(P.ABAS) === antes], [false, 'dia-fechado', true]);
  ok('e a lista avisa que o dia está fechado', P.run(`return getLancamentosHora({ horario: '10:00' });`).fechado, true);
}
ok('a exclusão é gravação: invalida o cache de leitura', /ACOES_ESCRITA = \[[^\]]*'excluirLancamento'/.test(GS), true);
ok('o dispatcher conhece as duas ações', [/act === 'getLancamentosHora'\) result = getLancamentosHora\(p\)/.test(GS), /act === 'excluirLancamento'\)\s+result = excluirLancamento\(p\)/.test(GS)], [true, true]);

console.log('\n── celular: o aviso de lançamento repetido ──');
const F = { window: {} };
F.window = F;
vm.createContext(F);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'), F);
vm.runInContext('var LANC_REPETIDO_MIN = ' + MJS.match(/const LANC_REPETIDO_MIN = (\d+);/)[1] + ';', F);
['function lancRepetido(', 'function lancRepetidoTxt(', 'function _escH(', 'function corrListaHtml(', 'function corrConfirmaTxt(']
  .forEach(f => vm.runInContext(pega(MJS, f), F));
{
  const T0 = new Date(2026, 9, 16, 10, 42).getTime();
  const recs = JSON.stringify([{ ini: '10:00', cod: '501136004', cx: 60, t: T0 }, { ini: '10:00', cod: '501136004', cx: 50, t: T0 + 60000 }]);
  const rep = (ini, cod, cx, min) => vm.runInContext(`lancRepetido(${recs}, '${ini}', '${cod}', ${cx}, ${T0 + min * 60000}, LANC_REPETIDO_MIN)`, F);
  ok('mesma hora, produto e caixas em até ' + vm.runInContext('LANC_REPETIDO_MIN', F) + ' min → pergunta',
     [!!rep('10:00', '501136004', 60, 3), !!rep('10:00', '501136004', 60, 10)], [true, true]);
  ok('passou da janela, outra quantidade, outra hora ou outro produto → não pergunta',
     [rep('10:00', '501136004', 60, 11), rep('10:00', '501136004', 70, 3), rep('09:00', '501136004', 60, 3), rep('10:00', '501080006', 60, 3)],
     [null, null, null, null]);
  const txt = vm.runInContext(`lancRepetidoTxt({t:${T0}}, 60, 'VOL 1/1 LIVREIRO ENCANTO CINZA')`, F);
  ok('o texto diz quando, quanto e o que fazer', ['Às 10:42', '60 cx de VOL 1/1 LIVREIRO ENCANTO CINZA', 'LANÇADO NESTA HORA', 'não lance de novo'].map(x => txt.includes(x)),
     [true, true, true, true]);
  const g = pega(MJS, 'async function salvarLanc(');
  ok('a pergunta vem ANTES da cor e do envio, e o envio é guardado antes da resposta',
     [g.indexOf('lancRepetido(') < g.indexOf('avisoCorErrada('), g.indexOf('_lancGuardar(') < g.indexOf('jsonpFetch('),
      /if\(!seguir\)\{ fecharModalLanc\(\); return; \}/.test(g)], [true, true, true]);
}

console.log('\n── celular: a correção ──');
{
  const RES = { total: 279, fechado: false,
    lancs: [{ cx: 109, codigo: '501080008', desc: 'VOL 2/2 CRISTALEIRA ORION', cor: 'OFF WHITE' }, { cx: 60, codigo: '', desc: '' }],
    soLog: [{ cx: 30, codigo: '501080006', desc: 'VOL <2/2> ORION', cor: '' }] };
  const h = vm.runInContext(`corrListaHtml(${JSON.stringify(RES)}, false)`, F);
  ok('um EXCLUIR por lançamento, o sem produto dito, o SÓ NO LOG separado, e o texto escapado',
     [(h.match(/>EXCLUIR</g) || []).length, h.includes('sem produto'), h.includes('SÓ NO REGISTRO DE PRODUTO'), h.includes('VOL &lt;2/2&gt; ORION'),
      h.includes("excluirLanc(0,1)")], [3, true, true, true, true]);
  const hf = vm.runInContext(`corrListaHtml(${JSON.stringify(Object.assign({}, RES, { fechado: true }))}, false)`, F);
  ok('dia fechado: sem botão, com o aviso', [(hf.match(/>EXCLUIR</g) || []).length, hf.includes('FECHAR DIA de novo')], [0, true]);
  ok('excluindo: os botões travam', (vm.runInContext(`corrListaHtml(${JSON.stringify(RES)}, true)`, F).match(/disabled/g) || []).length, 3);
  const c1 = vm.runInContext(`corrConfirmaTxt('10:00-11:00', {cx:60, codigo:'501136004', desc:'VOL 1/1 LIVREIRO ENCANTO', cor:'CINZA'}, false, 279)`, F);
  ok('a confirmação diz o produto, como a hora fica e o efeito no lote',
     ['Excluir 60 cx de VOL 1/1 LIVREIRO ENCANTO · CINZA da hora 10:00-11:00', 'cai de 279 para 219 cx', 'voltam a faltar no lote'].map(x => c1.includes(x)),
     [true, true, true]);
  const c2 = vm.runInContext(`corrConfirmaTxt('12:12-13:00', {cx:30, codigo:'501080006', desc:'VOL 2/2 ORION', cor:''}, true, 0)`, F);
  ok('SÓ NO LOG: diz que a hora não muda', c2.includes('A hora não muda'), true);
  const ex = pega(MJS, 'async function excluirLanc(');
  ok('excluir: confirma antes, um exclId para todas as tentativas, e timeout relê a hora antes de acusar',
     [ex.indexOf('confirmarModal(') < ex.indexOf('_corrEnviar('), /seguro:'cancelar'/.test(ex), /const exclId = /.test(ex),
      /_corrConta\(c\.res, x, so\) < antes/.test(ex)], [true, true, true, true]);
  ok('a hora fechada COM lançamento abre a correção; a sem lançamento continua travada',
     /corrigivel = bloqueado && !!\(slot\.lotes&&slot\.lotes\.length\)/.test(MJS) && /abrirCorrecao\('\$\{slot\.inicio\}'/.test(MJS), true);
  ok('o modal da hora atual leva à correção', /onclick="_corrDoLanc\(\)">✎ CORRIGIR UM LANÇAMENTO</.test(MJS), true);
  ok('versão do app e cache do service worker sobem juntos',
     [MJS.match(/const APP_VER\s+= '([\d.]+)'/)[1], /ritmoprod-mobile-v45';\s+\/\/ APP_VER 1\.36\.0/.test(fs.readFileSync(path.join(__dirname, 'sw-mobile.js'), 'utf8'))],
     ['1.36.0', true]);
}

console.log(falhas === 0
  ? '\n✅ exclusão ok — o lançamento sai das três abas, uma vez só, e o repetido é perguntado antes\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
