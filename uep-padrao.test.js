// UEP PADRÃO: versão por código, trava no GRAVAR UEP e histórico por produto.
//   node uep-padrao.test.js
//
// PPCP, 16/10/2026: "não pode alterar sozinha sem autorização", "a uep que está
// hoje tornar padrão" e "montar histórico de produto comparando a uep padrão e
// ver no dia se cumpriu a padrão ou teve alteração".
//
// O .gs é carregado INTEIRO num contexto com planilha de mentira (como no
// programacao.test.js): o caminho é o real — simular, gravar, versionar, ler
// o período com a UEP vigente na data. A conta do histórico por produto é a do
// painel (v7), extraída do próprio HTML.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const GS = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');
const V7 = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const V7JS = [...V7.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

// ── planilha de mentira ─────────────────────────────────────────────────────
const HDR_CAT = ['CODIGO', 'DESCRICAO', 'COR', 'MEDIDA DA CAIXA (mm)', 'ENTRE_PECAS (mm)', 'VELOCIDADE (m/min)', 'UEP', 'UEP_VIGENCIA'];
function catalogo() {
  return [HDR_CAT.slice(),
    ['501149001', 'MESA CABECEIRA MADERO',    'PRETO',  1350, 150, 15, 1,    '24/09/2026'],      // medida pelo estudo
    ['501149002', 'MESA CABECEIRA MADERO',    'BRANCO', 1350, 150, 15, 1,    '24/09/2026'],
    ['501061001', 'PENTEADEIRA CAMARIM ELOA', 'ROSA',   1350, 150, 15, 2.26, ''],                // digitada à mão
    ['501094001', 'MESA CABECEIRA SLEEP',     'PRETO',  1350, 150, 15, '',   ''],                // sem UEP
    ['501130001', 'MESA CENTRO LUNA 670',     'CUMARU', 1350, 150, 15, 0.8,  '25/09/2026 EST']]; // estimada
}
function montar(log, hoje) {
  const ABAS = {
    PRODUTO_CODIGO: catalogo(),
    PRODUCAO_PRODUTO: [['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS']].concat(log || []),
  };
  function aba(nome) {
    const v = ABAS[nome];
    if (!v) return null;
    return {
      getName: () => nome, getLastRow: () => v.length, getLastColumn: () => Math.max(...v.map(r => r.length)),
      getMaxRows: () => 1000,
      getDataRange: () => ({ getValues: () => v.map(r => r.slice()) }),
      getRange: (l, c, nl, nc) => ({
        getValues: () => { const o = []; for (let i = 0; i < (nl || 1); i++) { const r = v[l - 1 + i] || []; const x = []; for (let j = 0; j < (nc || 1); j++) x.push(r[c - 1 + j] === undefined ? '' : r[c - 1 + j]); o.push(x); } return o; },
        setValue: x => { (v[l - 1] = v[l - 1] || [])[c - 1] = x; },
        setValues: xs => xs.forEach((row, k) => { const r = v[l - 1 + k] = v[l - 1 + k] || []; row.forEach((x, j) => { r[c - 1 + j] = x; }); }),
        setNumberFormat: () => {},
      }),
      setFrozenRows: () => {},
    };
  }
  const ss = { getSheetByName: aba, insertSheet: nome => { ABAS[nome] = []; return aba(nome); }, getName: () => 'teste' };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    Utilities: { formatDate: (d, tz, f) => f === 'yyyy' ? '2026' : (/HH/.test(f) ? (hoje || '16/10/2026') + ' 07:30' : (hoje || '16/10/2026')) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(GS, ctx);
  const run = code => vm.runInContext('(function(){ _invalidarValores(); _catalogoMemo = null; _prodBaseMemo = null; ' + code + ' })()', ctx);
  return { ABAS, ctx, run, ss };
}
const uepDe = (ABAS, cod) => { const r = ABAS.PRODUTO_CODIGO.find(x => x[0] === cod); return [r[6], r[7]]; };
const DADOS = JSON.stringify([['501149', 'MESA CABECEIRA MADERO', 1.1], ['501094', 'MESA CABECEIRA SLEEP', 0.84], ['501130', 'MESA CENTRO LUNA 670', 0.9]]);

console.log('\n── simular: a MESMA conta do gravar, sem gravar nada ──');
{
  const P = montar();
  const antes = JSON.stringify(P.ABAS.PRODUTO_CODIGO);
  const r = P.run(`return simularUepCatalogo({ vig: '16/10/2026', dados: ${JSON.stringify(DADOS)} });`);
  ok('não grava o cadastro nem cria a aba de versões', [JSON.stringify(P.ABAS.PRODUTO_CODIGO) === antes, 'UEP_VERSOES' in P.ABAS], [true, false]);
  ok('conta o que preenche (vazia), o que troca estimada e o que JÁ TEM UEP', [r.simulado, r.novos, r.deEst, r.iguais, r.nExistentes], [true, 1, 1, 0, 2]);
  ok('o que já tem UEP vem com antes → depois e a vigência de lá', r.existentes,
     [['501149001', 1, 1.1, '24/09/2026'], ['501149002', 1, 1.1, '24/09/2026']]);
  ok('simular pela URL não liga a simulação no setUepCatalogo (texto não é booleano)',
     /const simular = p\._simular === true;/.test(GS), true);
  ok('o dispatcher conhece a ação, e ela NÃO é de escrita nem de cache',
     [/act === 'simularUepCatalogo'\) result = simularUepCatalogo\(p\)/.test(GS),
      /ACOES_ESCRITA = \[[^\]]*simularUepCatalogo/.test(GS), /simularUepCatalogo:\s*\d+/.test(GS)], [true, false, false]);
}

console.log('\n── gravar: a trava e a versão ──');
{
  const P = montar();
  const r = P.run(`return setUepCatalogo({ vig: '16/10/2026', dados: ${JSON.stringify(DADOS)} });`);
  ok('sem substituir=1, UEP medida/digitada FICA (a trava)', [uepDe(P.ABAS, '501149001'), uepDe(P.ABAS, '501149002')],
     [[1, '24/09/2026'], [1, '24/09/2026']]);
  ok('vazia e estimada são preenchidas, com a vigência do gravar', [uepDe(P.ABAS, '501094001'), uepDe(P.ABAS, '501130001')],
     [[0.84, '16/10/2026'], [0.9, '16/10/2026']]);
  ok('o retorno diz o que gravou e o que ficou protegido', [r.ok, r.gravados, r.protegidos, r.substituidos, r.versoes, r.versaoErro],
     [true, 2, 2, 0, 2, undefined]);
  const V = P.ABAS.UEP_VERSOES;
  ok('a 1ª mudança cria a aba com o cabeçalho', V[0], ['CODIGO', 'UEP', 'VIGENCIA', 'ORIGEM', 'GRAVADO_EM', 'ANTERIOR']);
  ok('SEMENTE = o cadastro de ANTES, valendo desde sempre (vigência vazia) — a UEP de hoje vira a padrão',
     V.slice(1, 5).map(l => [l[0], l[1], l[2], l[3]]),
     [['501149001', 1, '', 'PADRÃO INICIAL · cadastro 24/09/2026'], ['501149002', 1, '', 'PADRÃO INICIAL · cadastro 24/09/2026'],
      ['501061001', 2.26, '', 'PADRÃO INICIAL'], ['501130001', 0.8, '', 'PADRÃO INICIAL · cadastro 25/09/2026 EST']]);
  ok('depois da semente, uma linha por mudança, com a anterior', V.slice(5).map(l => [l[0], l[1], l[2], l[3], l[5]]),
     [['501094001', 0.84, '16/10/2026', 'GRAVAR UEP', ''], ['501130001', 0.9, '16/10/2026', 'GRAVAR UEP', 0.8]]);

  const r2 = P.run(`return setUepCatalogo({ vig: '17/10/2026', substituir: '1', dados: ${JSON.stringify(DADOS)} });`);
  ok('com substituir=1 a UEP existente troca, e vira versão com a anterior', [uepDe(P.ABAS, '501149001'), r2.substituidos, r2.versoes,
     P.ABAS.UEP_VERSOES.slice(7).map(l => [l[0], l[1], l[2], l[5]])],
     [[1.1, '17/10/2026'], 2, 2, [['501149001', 1.1, '17/10/2026', 1], ['501149002', 1.1, '17/10/2026', 1]]]);
  const n = P.ABAS.UEP_VERSOES.length;
  const r3 = P.run(`return setUepCatalogo({ vig: '18/10/2026', substituir: '1', dados: ${JSON.stringify(DADOS)} });`);
  ok('regravar o MESMO número não cria versão nem mexe na vigência', [r3.iguais, r3.versoes, P.ABAS.UEP_VERSOES.length, uepDe(P.ABAS, '501149001')],
     [4, 0, n, [1.1, '17/10/2026']]);
}

console.log('\n── a UEP padrão vigente na data ──');
{
  const P = montar();
  P.run(`setUepCatalogo({ vig: '10/10/2026', substituir: '1', dados: ${JSON.stringify(DADOS)} }); return 0;`);
  const M = P.run('return _uepVersoesMapa(null, true);');
  const vig = (cod, d) => P.run(`return _uepVigente(_uepVersoesMapa(null, true)[${JSON.stringify(cod)}], ${d}, 0);`);
  ok('versões em ordem de vigência', M['501149001'].map(x => [x.de, x.uep]), [[0, 1], [20261010, 1.1]]);
  ok('no dia vale a última versão com vigência ≤ dia', [vig('501149001', 20261009).uep, vig('501149001', 20261010).uep, vig('501149001', 20261015).uep], [1, 1.1, 1.1]);
  ok('código que ganhou UEP depois da semente: antes da 1ª vigência vale a 1ª, marcado', vig('501094001', 20261001), { uep: 0.84, de: 20261010, antes: true });
  ok('sem versão, vale o cadastro', P.run('return _uepVigente(undefined, 20261001, 1.7);'), { uep: 1.7, de: 0, antes: false });
  ok('vigência com EST e em branco são lidas', P.run("return [_uepVerDataNum('25/09/2026 EST'), _uepVerDataNum(''), _uepVerDataNum('16/10/2026')];"), [20260925, 0, 20261016]);
}

console.log('\n── estimativa (EST): simular e versão ──');
{
  const P = montar();
  P.ABAS.PRODUTO_CODIGO.push(['501200001', 'RACK BRITO', 'PRETO', 2850, 150, 15, '', '']);
  const s = P.run("return simularUepCatalogo({ estimar: '1', k: '1.2', tetoAnc: '300', vig: '16/10/2026' });");
  ok('simular a estimativa conta e não grava', [s.simulado, s.estNovos, s.estMudam, s.estIguais, s.mantidos, P.ABAS.PRODUTO_CODIGO[6][6], 'UEP_VERSOES' in P.ABAS],
     [true, 2, 1, 0, 3, '', false]);
  const g = P.run("return setUepCatalogo({ estimar: '1', k: '1.2', tetoAnc: '300', vig: '16/10/2026' });");
  ok('gravar a estimativa registra só o que mudou, com origem EST e vigência sem o EST',
     [g.versoes, P.ABAS.UEP_VERSOES.slice(5).map(l => [l[0], l[2], l[3]])],
     [3, [['501094001', '16/10/2026', 'GRAVAR UEP · EST'], ['501130001', '16/10/2026', 'GRAVAR UEP · EST'], ['501200001', '16/10/2026', 'GRAVAR UEP · EST']]]);
}

console.log('\n── digitada à mão (onEdit) ──');
{
  const rng = (P, row, col, nr, nc) => ({ getSheet: () => P.ss.getSheetByName('PRODUTO_CODIGO'), getRow: () => row, getColumn: () => col,
                                          getNumRows: () => nr || 1, getNumColumns: () => nc || 1 });
  // aba ainda inexistente: a semente leva o valor de ANTES da célula editada
  const P = montar();
  P.ABAS.PRODUTO_CODIGO[1][6] = 1.3;
  P.run('return 0;');
  vm.runInContext('onEdit', P.ctx)({ range: rng(P, 2, 7), oldValue: '1' });
  const V = P.ABAS.UEP_VERSOES;
  ok('1ª digitação cria a aba: semente com o valor de ANTES, e a versão DIGITADA',
     [V.slice(1, 5).map(l => [l[0], l[1]]), V.slice(5).map(l => [l[0], l[1], l[2], l[3], l[5]])],
     [[['501149002', 1], ['501061001', 2.26], ['501130001', 0.8], ['501149001', 1]], [['501149001', 1.3, '16/10/2026', 'DIGITADA', 1]]]);
  P.ABAS.PRODUTO_CODIGO[3][6] = 2.4;
  vm.runInContext('onEdit', P.ctx)({ range: rng(P, 4, 7) });
  ok('a anterior sai da última versão quando a célula não diz', P.ABAS.UEP_VERSOES.slice(-1).map(l => [l[0], l[1], l[5]]), [['501061001', 2.4, 2.26]]);
  const n = P.ABAS.UEP_VERSOES.length;
  vm.runInContext('onEdit', P.ctx)({ range: rng(P, 4, 7), oldValue: '2.4' });
  vm.runInContext('onEdit', P.ctx)({ range: rng(P, 2, 2, 3, 2) });   // DESCRICAO e COR, não a UEP
  ok('mesmo valor, ou edição fora da coluna UEP, não é versão', P.ABAS.UEP_VERSOES.length, n);
  P.ABAS.PRODUTO_CODIGO[4][6] = 0.7; P.ABAS.PRODUTO_CODIGO[5][6] = '';
  vm.runInContext('onEdit', P.ctx)({ range: rng(P, 5, 7, 2, 1) });   // colagem de duas linhas
  ok('colagem de várias linhas: uma versão por código (apagar a UEP também é versão)',
     P.ABAS.UEP_VERSOES.slice(-2).map(l => [l[0], l[1], l[5]]), [['501094001', 0.7, ''], ['501130001', '', 0.8]]);
  ok('o onEdit lê a aba de versões DIRETO (quem escreve não usa o memo)',
     /_uepVersoesMapa\(ss, true\)/.test(GS.slice(GS.indexOf('function _uepVerDaEdicao('), GS.indexOf('function simularUepCatalogo('))), true);
  ok('falha no registro não trava a edição na planilha', /try \{ _uepVerDaEdicao\(e, sh\); \} catch/.test(GS), true);
}

console.log('\n── leitura do período com a UEP da DATA (?uepVer=1) ──');
{
  const P = montar([
    ['09/10/2026', '08:00', '501149001', 'X', 100],
    ['09/10/2026', '08:00', '501999001', 'X', 20],   // fora do cadastro: sem UEP
    ['15/10/2026', '08:00', '501149001', 'X', 100],
    ['15/10/2026', '09:00', '501094001', 'X', 50]]);
  P.run(`setUepCatalogo({ vig: '15/10/2026', substituir: '1', dados: ${JSON.stringify(DADOS)} }); return 0;`);
  const r = P.run("return getProducaoModeloPeriodo({ de: '01/10/2026', ate: '16/10/2026', cxHora: '1', uepVer: '1' });");
  const it = (d, nome) => r.itens.find(x => x.data === d && x.nome === nome);
  ok('dia ANTES da mudança: a UEP de antes (100 × 1,00)', [it('09/10/2026', 'MESA CABECEIRA MADERO').uepHora, it('09/10/2026', 'MESA CABECEIRA MADERO').uepVigDe], [{ '08:00': 100 }, 0]);
  ok('dia DEPOIS: a nova (100 × 1,10), com a vigência que valeu', [it('15/10/2026', 'MESA CABECEIRA MADERO').uepHora, it('15/10/2026', 'MESA CABECEIRA MADERO').uepVigDe], [{ '08:00': 110 }, 20261015]);
  const sem = r.itens.find(x => x.data === '09/10/2026' && x.modelo === '501999');
  ok('código sem UEP: caixas da hora à parte, nunca UEP zero', [sem.uepHora, sem.semUepHora], [{}, { '08:00': 20 }]);
  ok('o topo diz se há registro de versões e quantos códigos divergem', r.uepVer, { registrado: true, diverge: 0 });
  P.ABAS.PRODUTO_CODIGO[3][6] = 2.5;   // mudou SEM passar pelo registro (sem onEdit)
  ok('cadastro mudado fora do registro aparece como divergência',
     P.run("return getProducaoModeloPeriodo({ de: '01/10/2026', ate: '16/10/2026', cxHora: '1', uepVer: '1' }).uepVer;"), { registrado: true, diverge: 1 });
  const s = P.run("return getProducaoModeloPeriodo({ de: '01/10/2026', ate: '16/10/2026', cxHora: '1' });");
  ok('sem ?uepVer=1 o payload não muda (o comparativo encostou nos 100 KB uma vez)',
     [s.itens.some(x => x.uepHora !== undefined || x.uepVigDe !== undefined), s.uepVer], [false, undefined]);
  const Q = montar([['09/10/2026', '08:00', '501149001', 'X', 100]]);
  ok('sem a aba de versões, o cadastro de hoje vale para todos os dias',
     Q.run("var r = getProducaoModeloPeriodo({ de: '01/10/2026', ate: '16/10/2026', cxHora: '1', uepVer: '1' }); return [r.itens[0].uepHora, r.uepVer];"),
     [{ '08:00': 100 }, { registrado: false, diverge: 0 }]);
}

// ════════════════════════════════════════════════════════════════════════════
// PAINEL (v7): a conta do bloco 7 e os textos da autorização
// ════════════════════════════════════════════════════════════════════════════
function pegaV7(assinatura) {
  const i = V7JS.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei no HTML: ' + assinatura);
  const j = V7JS.indexOf('{', V7JS.indexOf(')', i));
  let n = 0;
  for (let k = j; k < V7JS.length; k++) {
    if (V7JS[k] === '{') n++;
    else if (V7JS[k] === '}' && --n === 0) return V7JS.slice(i, k + 1);
  }
  throw new Error('função não fecha: ' + assinatura);
}
const constV7 = nome => { const m = V7JS.match(new RegExp('const ' + nome + '\\s*=\\s*([^;]+);')); if (!m) throw new Error('sem ' + nome); return m[1]; };
const F = { window: {} };
F.window = F;
vm.createContext(F);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'), F);
['UEP_PAD_FAIXA', 'UEP_PAD_MIN_MIN', 'UEP_TRAVA_LISTA', 'UEP_MIN_DIAS'].forEach(n => vm.runInContext('var ' + n + ' = ' + constV7(n) + ';', F));
vm.runInContext('var UEP_PAD_ST = ' + V7JS.match(/const UEP_PAD_ST=(\{[^\n]*\});/)[1] + ';', F);
['function _uepPadSt(', 'function _uepPadMinSlot(', 'function _uepPadHist(', 'function _uepTravaTxt(', 'function _uepPadJanela(']
  .forEach(f => vm.runInContext(pegaV7(f), F));
const hist = (itens, metaDe, metaAt, minSlot) => vm.runInContext('_uepPadHist(' + JSON.stringify(itens) + ',' + JSON.stringify(metaDe || {}) + ',' + JSON.stringify(metaAt) + ',' + JSON.stringify(minSlot || {}) + ')', F);

console.log('\n── bloco 7: padrão × realizado por produto (conta pura) ──');
{
  const R = 2530 / 527, R2 = 2500 / 527;
  const A = (data, num, cxH, uH, vig, extra) => Object.assign({ data, dataNum: num, modelo: '501149', nome: 'MESA CABECEIRA MADERO', caixas: 1, cxHora: cxH, uepHora: uH, uepVigDe: vig || 0 }, extra || {});
  const itens = [
    A('01/10/2026', 20261001, { '07:00': 288, '08:00': 288 }, { '07:00': 288, '08:00': 288 }),
    A('02/10/2026', 20261002, { '07:00': 200, '08:00': 100, '09:00': 100 }, { '07:00': 200, '08:00': 100, '09:00': 100 }),
    { data: '02/10/2026', dataNum: 20261002, modelo: '501061', nome: 'PENTEADEIRA CAMARIM ELOA', caixas: 50, cxHora: { '08:00': 50 }, uepHora: { '08:00': 100 }, uepVigDe: 0 },
    A('03/10/2026', 20261003, { '07:00': 300, '08:00': 300, '09:00': 100 }, { '07:00': 330, '08:00': 330, '09:00': 110 }, 20261003),
    { data: '03/10/2026', dataNum: 20261003, modelo: '501999', nome: 'SEM CADASTRO', caixas: 20, cxHora: { '09:00': 20 }, uepHora: {}, semUepHora: { '09:00': 20 } },
    { data: '03/10/2026', dataNum: 20261003, modelo: '501777', nome: 'SEM HORA', caixas: 15 },
    A('04/10/2026', 20261004, { '12:12': 230 }, { '12:12': 230 }, 20261003),
    A('05/10/2026', 20261005, { '13:00': 80 }, { '13:00': 80 }, 20261003),   // 1 hora de início de rodada
  ];
  const H = hist(itens, { '02/10/2026': 2500 }, 2530, { '12:12': 48 });
  const a = H.prods.find(g => g.nome === 'MESA CABECEIRA MADERO');
  const dia = d => a.dias.find(x => x.data === d);
  const r1 = x => Math.round(x * 10) / 10;
  ok('dia no ritmo da meta: 576 UEP em 2 h = 100% do padrão, NO PADRÃO', [r1(dia('01/10/2026').pct), dia('01/10/2026').st, dia('01/10/2026').min], [r1(576 / (R * 120) * 100), 'no', 120]);
  ok('cx/h padrão = ritmo da meta ÷ UEP por caixa', Math.round(dia('01/10/2026').cxhPad), Math.round(R * 60));
  ok('hora com troca: repartida pelo TEMPO PADRÃO (100 UEP de cada → 30 min para cada)', [dia('02/10/2026').min, H.prods.find(g => g.modelo === '501061').dias[0].min], [150, 30]);
  ok('a meta do dia é a GRAVADA dele (2.500 em 02/10), não a de hoje', r1(dia('02/10/2026').pct), r1(400 / (R2 * 150) * 100));
  ok('abaixo de 90% é ABAIXO', dia('02/10/2026').st, 'abaixo');
  ok('produto com menos de 2 h no dia não é julgado (< 2 H) — nem 1 hora cheia de início de rodada',
     [H.prods.find(g => g.modelo === '501061').dias[0].st, dia('05/10/2026').min, dia('05/10/2026').st, dia('05/10/2026').julg], ['curto', 60, 'curto', false]);
  ok('o rótulo do não julgado sai do mínimo', vm.runInContext('UEP_PAD_ST.curto.t', F), '< 2 H');
  // 60 × 286,52 ÷ 286,52 em ponto flutuante dá 59,999…: o dia de 2 h exatas não
  // pode cair abaixo do mínimo por arredondamento (visto no print do bloco).
  const Hf = hist([{ data: '01/10/2026', dataNum: 20261001, modelo: '501061', nome: 'ELOA', caixas: 1,
                     cxHora: { '10:00': 151, '13:00': 151 }, uepHora: { '10:00': 286.52, '13:00': 286.52 } }], {}, 2530, {});
  ok('dia de 2 h exatas é julgado (sem erro de ponto flutuante)', [Hf.prods[0].dias[0].min, Hf.prods[0].dias[0].julg], [120, true]);
  ok('acima de 110% é ACIMA (alerta, não "ótimo")', [r1(dia('03/10/2026').pct), dia('03/10/2026').st], [r1(660 / (R * 120) * 100), 'acima']);
  ok('hora com caixa de código SEM UEP sai da conta do produto, e é contada', [dia('03/10/2026').semBase, H.hSemBase], [1, 1]);
  ok('a padrão mudou no dia (vigência nova) → PADRÃO ALTERADO; no dia seguinte, não', [dia('03/10/2026').alterado, dia('04/10/2026').alterado, a.alterou], [true, false, true]);
  ok('pós-almoço vale 48 min, não 60', [dia('04/10/2026').min, dia('04/10/2026').st], [48, 'curto']);
  ok('caixa sem hora no apontamento fica fora, contada', H.cxSemHora, 15);
  ok('resumo do produto: dias julgados e faixa', [a.nJulg, a.abaixo, a.no, a.acima], [3, 1, 1, 1]);
  const uJ = 576 + 400 + 660, pJ = R * 120 + R2 * 150 + R * 120;
  ok('% do período = UEP feita ÷ UEP pedida nos dias julgados (não média de %)', r1(a.pct), r1(uJ / pJ * 100));
  ok('só produto com dia julgado entra na tabela; o resto é contado (produto sem UEP nenhuma não é produto a julgar)',
     [H.julgados.map(g => g.modelo), H.soCurtos, H.prods.some(g => g.modelo === '501999')], [['501149'], 1, false]);
  ok('janela: hoje fica fora (de hoje−n até ontem)', vm.runInContext("_uepPadJanela(30, new Date(2026, 9, 16))", F), { de: '16/09/2026', ate: '15/10/2026' });
  ok('minutos dos slots pelo turno; o resto vale 60', vm.runInContext("_uepPadMinSlot([{inicio:'12:12', min:48},{inicio:'07:00', min:60}])", F), { '12:12': 48, '07:00': 60 });
  ok('o desenho não faz conta', /_uepPadHist\(|_uepPadSt\(|uepDiaMeta\(|UEP_MIN_DIA\*|\/UEP_MIN_DIA\*x/.test(pegaV7('function _uepPadHtml(')), false);
  ok('a montagem lê a META GRAVADA de cada dia do histórico', /metaDe\[d\.data\]=Number\(d\.metaUep\)/.test(pegaV7('function _uepPadMontar(')), true);
  const car = pegaV7('function _uepPadCarregar(');
  ok('a leitura pede a UEP da data (uepVer=1) e acusa backend antigo pelo campo que falta',
     [/&cxHora=1&uepVer=1/.test(car), /if\(!r\.uepVer\)\{ falha='sem-endpoint'/.test(car), /for\(let t=1;t<=3;t\+\+\)/.test(car)], [true, true, true]);
  ok('a aba carrega o bloco 7 POR ÚLTIMO, depois da programação',
     (() => { const c = pegaV7('async function _uepAbaCarregar('); return c.indexOf('_uepPadCarregar()') > c.indexOf('carregarProgramacaoDetalhada()'); })(), true);
  ok('TV e app do operador não mostram (só a aba ⚖ UEP)', [/_uepPadHtml/.test(fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8')),
     (V7JS.match(/_uepPadHtml\(/g) || []).length], [false, 2]);
}

console.log('\n── bloco 7: colunas alinhadas e a impressão dedicada (v7.134.0) ──');
{
  ['UEP_PAD_COLS', 'APP_NOME'].forEach(n => vm.runInContext('var ' + n + ' = ' + constV7(n) + ';', F));
  vm.runInContext('var APP_NOME_CX = APP_NOME.toUpperCase();', F);
  ['function _rpEsc(', 'function _uepPadColgroup(', 'function _uepPadU2(', 'function _uepPadNn(', 'function _uepPadPctTd(',
   'function _uepPadSelo(', 'function _uepPadThead(', 'function _uepPadCelsProd(', 'function _uepPadDiasRows(',
   'function _uepPadNotas(', 'function _uepPadHtml(', 'function _uepPadDocHtml(']
    .forEach(f => vm.runInContext(pegaV7(f), F));
  const A = (data, num, mod, nome, cxH, uH, vig) => ({ data, dataNum: num, modelo: mod, nome, caixas: 1, cxHora: cxH, uepHora: uH, uepVigDe: vig || 0 });
  const itens = [
    A('01/10/2026', 20261001, '501149', 'MESA CABECEIRA MADERO', { '07:00': 288, '08:00': 288 }, { '07:00': 288, '08:00': 288 }),
    A('02/10/2026', 20261002, '501149', 'MESA CABECEIRA MADERO', { '07:00': 200, '08:00': 200 }, { '07:00': 200, '08:00': 200 }, 20261002),
    A('01/10/2026', 20261001, '501061', 'PENTEADEIRA CAMARIM ELOA', { '09:00': 70, '10:00': 70 }, { '09:00': 360, '10:00': 360 }),   // 720 de 576 = 125%: ACIMA
    A('02/10/2026', 20261002, '501094', 'MESA CABECEIRA SLEEP', { '13:00': 80 }, { '13:00': 80 }),   // só 1 h: não julgado
  ];
  const H = hist(itens, {}, 2530, {});
  ok('totais da capa = soma das colunas dos produtos julgados', H.tot, { dias: 3, abaixo: 1, no: 1, acima: 1 });
  // conta as colunas de cada <tr>: td/th + colspan−1. Toda linha tem de ter 11.
  const colunas = html => [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m =>
    [...m[1].matchAll(/<t[dh]([^>]*)>/g)].reduce((n, c) => n + (Number((c[1].match(/colspan="(\d+)"/) || [])[1]) || 1), 0));
  const tela = vm.runInContext('_uepPadHtml(' + JSON.stringify(H) + ', "501149|MESA CABECEIRA MADERO", {registrado:true, diverge:0})', F);
  ok('tela: as larguras são fixas (colgroup de 11 + table-layout) e o dia a dia aberto usa as MESMAS 11 colunas',
     [vm.runInContext('UEP_PAD_COLS.length', F), vm.runInContext('UEP_PAD_COLS.reduce((a,b)=>a+b,0)', F), (tela.match(/<col /g) || []).length,
      [...new Set(colunas(tela))], /uep-pad-det|<table><thead><tr><th>DIA/.test(tela)], [11, 100, 11, [11], false]);
  ok('tela: o dia a dia abre embaixo do produto, com a própria linha de rótulos',
     [(tela.match(/class="uep-pad-dh"/g) || []).length, (tela.match(/class="uep-pad-d"/g) || []).length], [1, 2]);
  ok('o selo tem largura fixa na tela e no papel (a data não anda em zigue-zague)',
     [/#sec-uep \.uep-pad-st\{display:inline-block;min-width:\d+px/.test(V7), /\.pad-doc \.uep-pad-st\{display:inline-block;min-width:\d+px/.test(V7)], [true, true]);
  const doc = vm.runInContext('_uepPadDocHtml(' + JSON.stringify(H) + ', {registrado:false, diverge:2}, {de:"16/09/2026", ate:"15/10/2026", data:"16/10/2026", hora:"10:51"})', F);
  ok('papel: toda linha com as 11 colunas, nas duas tabelas de produto', [...new Set(colunas(doc.slice(0, doc.indexOf('3 ▸ COMO O NÚMERO SAI'))).filter(n => n > 2))], [11]);
  ok('papel: o resumo e o dia a dia de TODOS os produtos julgados (na tela abre um por vez)',
     [(doc.match(/MESA CABECEIRA MADERO/g) || []).length, (doc.match(/PENTEADEIRA CAMARIM ELOA/g) || []).length,
      (doc.match(/class="uep-pad-dh"/g) || []).length, (doc.match(/class="uep-pad-d"/g) || []).length, /MESA CABECEIRA SLEEP/.test(doc)],
     [2, 2, 2, 3, false]);
  ok('papel: a capa traz os totais, as notas e os avisos de registro',
     [/DIAS JULGADOS<\/div><div class="kpi-val">3</.test(doc), /Nenhuma mudança de UEP registrada ainda/.test(doc), /2 códigos estão com a UEP do cadastro diferente/.test(doc),
      /1 produto não chegou a 2 h/.test(doc), /3 ▸ COMO O NÚMERO SAI/.test(doc)], [true, true, true, true, true]);
  ok('o desenho do papel e as células não fazem conta', ['function _uepPadDocHtml(', 'function _uepPadCelsProd(', 'function _uepPadDiasRows(']
     .map(f => /_uepPadHist\(|_uepPadSt\(|uepDiaMeta\(|_uepVigente/.test(pegaV7(f))), [false, false, false]);
  const ger = pegaV7('function gerarRelatorioUepPadrao(');
  ok('a impressão é o retrato da tela: mesma montagem, mesmos dados, DEITADA, sem leitura nova',
     [/_uepPadMontar\(\)/.test(ger), /_uepPadDocHtml\(H, UEP_PAD\.uepVer, ctx\)/.test(ger), /_rpDocParadas\([^;]*, true\)/.test(ger), /jsonpFetch|_uepPadCarregar/.test(ger)],
     [true, true, true, false]);
  ok('o botão 🖨 IMPRIMIR mora no cabeçalho do bloco 7', /7 · PADRÃO × REALIZADO POR PRODUTO<\/b>[^`]*onclick="gerarRelatorioUepPadrao\(\)"/.test(V7), true);
  const skin = V7.match(/const _UEP_PAD_DOC_SKIN = `([\s\S]*?)`;/)[1];
  ok('a pele do papel é escopada em .pad-doc (não mexe nos outros relatórios do _rpDocParadas)',
     skin.split('\n').map(l => l.trim()).filter(Boolean).every(l => l.startsWith('.pad-doc ')), true);
}

console.log('\n── GRAVAR UEP: a autorização ──');
{
  const sim = { novos: 2, deEst: 1, iguais: 3, nExist: 2, estNovos: 5, estMudam: 0,
    existentes: [['501149001', 1, 1.1, '24/09/2026'], ['501061001', 2.26, 2, '']] };
  const ctx = { de: '16/09/2026', ate: '15/10/2026', modo: 'APARADA', ancora: '501149 MESA CABECEIRA MADERO', nProv: 0, vig: '16/10/2026', cal: { k: 1.2345 } };
  const T = vm.runInContext('_uepTravaTxt(' + JSON.stringify(sim) + ',' + JSON.stringify(ctx) + ')', F);
  ok('o 1º passo diz tudo o que muda, em linhas', ['2 códigos sem UEP recebem', '1 código com UEP ESTIMADA passa', '3 códigos já estão com esse valor',
     '2 códigos JÁ TÊM UEP', '5 sem UEP recebem a ESTIMADA', 'Cancelar = não gravar nada', 'aba UEP_VERSOES'].map(x => T.t1.includes(x)), [true, true, true, true, true, true, true]);
  ok('o 2º passo lista antes → depois, maior mudança primeiro, e diz o que cada botão faz',
     [T.t2.indexOf('501061001') < T.t2.indexOf('501149001'), T.t2.includes('2,26 → 2,00'), T.t2.includes('OK = SUBSTITUIR estas 2'), T.t2.includes('Cancelar = MANTER as atuais')], [true, true, true, true]);
  ok('sem UEP existente mudando, não há 2º passo', vm.runInContext("_uepTravaTxt({novos:1,deEst:0,iguais:0,nExist:0,existentes:[],estNovos:0,estMudam:0},{de:'',ate:'',modo:'',ancora:'',nProv:0,vig:'',cal:null}).t2", F), null);
  ok('nada a mudar → nada a gravar', vm.runInContext("_uepTravaTxt({novos:0,deEst:0,iguais:4,nExist:0,existentes:[],estNovos:0,estMudam:0},{de:'',ate:'',modo:'',ancora:'',nProv:0,vig:'',cal:null}).nada", F), true);
  const g = pegaV7('async function _gravarUepCadastro(');
  ok('simula ANTES de gravar e só troca a existente com o 2º OK',
     [g.indexOf('_uepSimular(') < g.indexOf("action=setUepCatalogo'"), /const substituir = tx\.t2 \? confirm\(tx\.t2\) : false;/.test(g),
      /'&substituir='\+\(substituir\?'1':'0'\)/.test(g)], [true, true, true]);
  ok('backend sem a simulação → não grava nada', /if\(!sim\)\{ alert\([^)]*v5\.24[\s\S]*?Nada foi gravado/.test(g), true);
  ok('a mudança sem registro de versão é AVISADA', /A MUDANÇA NÃO FICOU REGISTRADA/.test(g), true);
  const sm = pegaV7('async function _uepSimular(');
  ok('a simulação usa a AÇÃO PRÓPRIA (o .gs antigo cai no getDados e não grava)',
     [/action=simularUepCatalogo/.test(sm), /action=setUepCatalogo/.test(sm), /r\.simulado!==true\) return null/.test(sm)], [true, false, true]);
}

console.log(falhas === 0
  ? '\n✅ UEP padrão ok — a padrão só muda com registro, e o dia é lido com a régua dele\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
