// PONTOS DO PASSADO CONGELADOS (.gs v5.40).
//   node pontos.test.js
//
// PPCP, 29/10/2026, ao trocar a coluna PONTOS da PRODUTO_CODIGO pelo CUSTO REP
// do ERP (+4,6% na média): "congelar o passado". O dia (getPontosDia) e o
// período (getProducaoModeloPeriodo) recalculavam caixas × PONTOS do cadastro
// de AGORA — a troca da tabela subiria outubro inteiro sem a linha ter feito
// nada a mais. Agora leem a coluna PONTOS da PRODUCAO_PRODUTO, que o
// registrarProducaoProduto grava na hora do lançamento.
//
// O .gs é carregado INTEIRO numa planilha de mentira (como no
// uep-padrao.test.js): o caminho é o real — lançar, trocar o cadastro, lançar
// de novo, ler o dia e o período.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const GS = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

// ── planilha de mentira ─────────────────────────────────────────────────────
const HDR_LOG = ['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS', 'PONTOS', 'PESO_KG', 'OPERADOR'];
function montar(log, hdrLog, hoje) {
  const ABAS = {
    PRODUTO_CODIGO: [['CODIGO', 'DESCRICAO', 'COR', 'P B', 'PONTOS'],
      ['501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 'PRETO', 10, 100],
      ['501061001', 'VOL 1/2 PENTEADEIRA CAMARIM ELOA', 'BRANCO', 35, 200]],
    PRODUCAO_PRODUTO: [(hdrLog || HDR_LOG).slice()].concat(log || []),
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
      appendRow: r => { v.push(r.slice()); },
      setFrozenRows: () => {},
    };
  }
  const ss = { getSheetByName: aba, getSheets: () => Object.keys(ABAS).map(aba), insertSheet: nome => { ABAS[nome] = []; return aba(nome); }, getName: () => 'teste' };
  const dia = hoje || '29/10/2026';
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    Utilities: { formatDate: (d, tz, f) => f === 'yyyy' ? '2026' : (/HH/.test(f) ? dia + ' 10:30' : dia) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {}, deleteProperty: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(GS, ctx);
  const run = code => vm.runInContext('(function(){ _invalidarValores(); _catalogoMemo = null; _prodBaseMemo = null; ' + code + ' })()', ctx);
  const pontosCad = (cod, p) => { ABAS.PRODUTO_CODIGO.find(r => r[0] === cod)[4] = p; };
  return { ABAS, run, pontosCad };
}
const periodo = (P, de, ate) => P.run(`return getProducaoModeloPeriodo({ de: '${de}', ate: '${ate}' });`);
const soma = (itens, campo) => itens.reduce((a, it) => a + it[campo], 0);

console.log('\n── período: o gravado no lançamento, não o cadastro de agora ──');
{
  // O cadastro JÁ mudou (100 → 104,5678 na MADERO); o log guarda 100 por caixa.
  const P = montar([
    ['27/10/2026', '05:00', '501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 10, 1000, 100, 'Mobile'],   // hora extra
    ['27/10/2026', '08:00', '501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 20, 2000, 200, 'Mobile'],
    ['28/10/2026', '09:00', '501061001', 'VOL 1/2 PENTEADEIRA CAMARIM ELOA', 5, 3227.732, 175, 'Mobile'],
  ]);
  P.pontosCad('501149001', 104.5678);
  P.pontosCad('501061001', 250);
  const r = periodo(P, '27/10/2026', '28/10/2026');
  ok('a troca do cadastro não muda o período fechado', soma(r.itens, 'pontos'), 1000 + 2000 + Math.round(3227.732));
  ok('pontos em hora extra também pelo gravado', soma(r.itens, 'pontosHe'), 1000);
}

console.log('\n── ?ptsCad=1 (.gs v5.41): os pontos também na tabela de HOJE, só para quem pede ──');
{
  const P = montar([
    ['27/10/2026', '05:00', '501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 10, 1000, 100, 'Mobile'],   // hora extra
    ['27/10/2026', '08:00', '501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 20, 2000, 200, 'Mobile'],
  ]);
  P.pontosCad('501149001', 104.5678);
  const sem = periodo(P, '27/10/2026', '27/10/2026').itens[0];
  ok('sem o parâmetro: nada muda (o pontos é o gravado, sem pontosCad)', [sem.pontos, sem.pontosCad, sem.pontosCadHe], [3000, undefined, undefined]);
  const com = P.run(`return getProducaoModeloPeriodo({ de: '27/10/2026', ate: '27/10/2026', ptsCad: '1' });`).itens[0];
  ok('com ?ptsCad=1: o gravado continua, e a tabela de hoje vem ao lado (30 cx × 104,5678; HE 10 cx)',
     [com.pontos, com.pontosHe, com.pontosCad, com.pontosCadHe], [3000, 1000, Math.round(30 * 104.5678), Math.round(10 * 104.5678)]);
  ok('a chave do cache de leitura inclui o ptsCad (senão um pedido devolveria a resposta do outro)',
     /'cxHora', 'uepVer', 'ptsCad'\]\.map\(function \(k\) \{ return p\[k\] \|\| ''; \}\)/.test(GS), true);
}

console.log('\n── célula vazia, zero, texto e aba sem a coluna ──');
{
  const P = montar([
    ['27/10/2026', '08:00', '501149001', '', 10, '', 0, 'Mobile'],          // vazio → cadastro de agora
    ['27/10/2026', '09:00', '501061001', '', 4, 0, 0, 'Mobile'],            // zero é valor
    ['27/10/2026', '10:00', '501061001', '', 2, '3227,732', 0, 'Mobile'],   // texto pt-BR
  ]);
  const r = periodo(P, '27/10/2026', '27/10/2026');
  const it = cod => r.itens.find(x => x.modelo === cod);
  ok('vazio → caixas × cadastro (como era)', it('501149').pontos, 1000);
  ok('zero fica zero; texto "3227,732" lido em pt-BR', it('501061').pontos, Math.round(0 + 3227.732));

  const Q = montar([['27/10/2026', '08:00', '501149001', 3]], ['DATA', 'HORA', 'CODIGO', 'CAIXAS']);
  ok('log no formato antigo (sem PONTOS) → cadastro', soma(periodo(Q, '27/10/2026', '27/10/2026').itens, 'pontos'), 300);
}

console.log('\n── o caminho real: lançar, trocar o cadastro, lançar de novo ──');
{
  const P = montar([]);
  P.run("registrarProducaoProduto('501149001', '08:00', 10, 'Mobile');");
  ok('o lançamento grava caixas × cadastro da hora', P.ABAS.PRODUCAO_PRODUTO[1][5], 1000);
  P.pontosCad('501149001', 104.5678);
  P.run("registrarProducaoProduto('501149001', '09:00', 10, 'Mobile');");
  ok('o seguinte grava com a tabela nova (4 casas)', P.ABAS.PRODUCAO_PRODUTO[2][5], 1045.678);
  const d = P.run('return getPontosDia();');
  ok('o dia soma o gravado: antes da troca + depois', d.pontos, Math.round(1000 + 1045.678));
  ok('hora a hora também', d.porHora.map(h => h.pontos), [1000, 1046]);
  ok('por produto e hora (porHoraModelo)', soma(d.porHoraModelo, 'pontos'), 2046);
  ok('o período de hoje fecha com o dia', soma(periodo(P, '29/10/2026', '29/10/2026').itens, 'pontos'), 2046);
}

console.log('\n── guarda: nenhum leitor do log volta a multiplicar pelo cadastro ──');
{
  const corpo = nome => { const i = GS.indexOf('function ' + nome + '('); return GS.slice(i, GS.indexOf('\nfunction ', i + 10)); };
  ok('getPontosDia lê os pontos pelo _ptsDoLog', [/cx \* \(prod\.pontos/.test(corpo('getPontosDia')), /_ptsDoLog\(/.test(corpo('getPontosDia'))], [false, true]);
  // No período, caixas × cadastro só pode alimentar o pontosCad (v5.41, a tabela de hoje).
  const per = corpo('getProducaoModeloPeriodo');
  ok('getProducaoModeloPeriodo: pontos e pontosHe pelo _ptsDoLog; o cadastro de agora só no pontosCad',
     [/map\[key\]\.pontos \+= ptsL;/.test(per), /pontosHe \+= ptsL;/.test(per),
      per.split('\n').filter(l => /cx \* \(prod\.pontos/.test(l)).every(l => /pontosCad/.test(l))], [true, true, true]);
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
