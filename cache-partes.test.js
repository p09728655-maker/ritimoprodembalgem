// RESPOSTA ACIMA DE 100 KB VAI AO CACHE EM PARTES (.gs v5.74).
//   node cache-partes.test.js
//
// PPCP, 19/11/2026: "trata getProdutos". O CacheService recusa valor acima de
// 100 KB, e o getProdutos tinha 113,6 KB na planilha de 19/11 (431 códigos;
// 107,4 KB antes da largura da v5.73): nunca ia ao cache, e cada abertura do
// celular e do cadastro do PC relia a PRODUTO_CODIGO inteira. Aqui o doGet
// roda de verdade, com um cache que RECUSA valor acima de 100 KB, como o do
// Google — sem isso o teste passaria com o defeito de volta.

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

// O cadastro: as colunas da PRODUTO_CODIGO de 19/11/2026 e 431 códigos no
// formato das linhas reais (o BERÇO ARCO-ÍRIS, a PENTEADEIRA STRASS, a MESA
// CABECEIRA SLEEP…), com o código trocado para não repetir.
const HDR = ['CODIGO', 'DESCRICAO', 'COR', 'P B', 'EAN 128', 'MEDIDA DA CAIXA', 'VELOCIDADE', 'ENTRE_PECAS (mm)',
  'PONTOS', 'TEMPO DE TROCA MIN', 'UEP', 'UEP_VIGENCIA', 'UEP_TRAVA', 'MEDIDA_EXT_ALTURA', 'MEDIDA_EXT_LARGURA',
  'MEDIDA_EXT_PROFUDIADE'];
const MODELOS = [
  ['VOL 1/2 BERCO ARCO-IRIS', 'BRANCO/AZUL', 34.5, '(8006)78985990749070102', 1274, 9, 400, 181.0521, 5, 1.57, '16/10/2026 EST', '', 97, 920, 710],
  ['VOL 2/2 BERCO ARCO-IRIS', 'BRANCO/AZUL', 15.2, '(8006)78985990749070202', 1610, 9, 400, 128.8741, 5, 1.84, '16/10/2026 EST', '', 70, 1320, 720],
  ['VOL 1/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 36.15, '(8006)78985990779150102', 1705, 9, 400, 293.9719, 5, 2.71, '16/10/2026', '', 165, 1245, 495],
  ['VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 16.1, '(8006)78985990779150202', 1344, 9, 400, 78.8729, 5, 1.78, '04/11/2026 DIGITADA', '12/11/2026 PPCP', 65, 1090, 710],
  ['VOL 1/1 MESA CABECEIRA SLEEP', 'OFF WHITE/NATURE', 7.5, '(8006)78985990784170102', 825, 9, 400, 39.063, 5, 1.13, '16/10/2026', '12/11/2026 PPCP', 120, 440, 405],
  ['VOL 1/1 RACK ESTRELA', 'PRETO ACETINADO', 29.8, '(8006)78985990784240102', 1700, 9, 400, 238.4353, 5, 1.73, '30/10/2026 DIGITADA', '', '', '', ''],
];
const tres = n => String(n).padStart(3, '0');
// JSON.parse que não derruba a suíte: resposta quebrada vira null e o teste falha com a mensagem.
const abre = t => { try { return JSON.parse(t); } catch (e) { return null; } };
function catalogo(n) {
  const linhas = [HDR];
  for (let i = 0; i < n; i++) linhas.push([`501.${tres(100 + Math.floor(i / 6))}.${tres(1 + (i % 6))}`, ...MODELOS[i % 6]]);
  return linhas;
}

// O cache do Google: recusa valor acima de 100 KB (aqui, em bytes UTF-8 — a
// conta dele não é documentada; 30.000 unidades cabem em qualquer uma) e guarda
// o texto em UTF-8: a metade solta de um par substituto voltaria como U+FFFD.
// OPS registra a ordem das gravações e o prazo de cada uma.
const LIMITE = 100 * 1024;
function montar(abas) {
  const ABAS = abas;
  const leituras = {};
  const STORE = {};
  const OPS = [];
  let recusados = 0;
  const cache = {
    get: k => (k in STORE ? STORE[k] : null),
    getAll: ks => { const o = {}; ks.forEach(k => { if (k in STORE) o[k] = STORE[k]; }); return o; },
    put: (k, v, ttl) => {
      if (Buffer.byteLength(String(v), 'utf8') > LIMITE) { recusados++; throw new Error('Argumento grande demais: value'); }
      STORE[k] = Buffer.from(String(v), 'utf8').toString('utf8');
      OPS.push([k, ttl]);
    },
    putAll: o => { Object.keys(o).forEach(k => cache.put(k, o[k])); },
    remove: k => { delete STORE[k]; },
  };
  const aba = nome => {
    const v = ABAS[nome];
    if (!v) return null;
    return {
      getName: () => nome, getLastRow: () => v.length, getLastColumn: () => Math.max(...v.map(r => r.length)),
      getMaxRows: () => v.length + 900, getFrozenRows: () => 1,
      getDataRange: () => ({ getValues: () => { leituras[nome] = (leituras[nome] || 0) + 1; return v.map(r => r.slice()); } }),
      getRange: (l, c, nl, nc) => ({
        getValues: () => {
          leituras[nome] = (leituras[nome] || 0) + 1;
          const o = [];
          for (let i = 0; i < (nl || 1); i++) {
            const r = v[l - 1 + i] || [], x = [];
            for (let j = 0; j < (nc || 1); j++) x.push(r[c - 1 + j] === undefined ? '' : r[c - 1 + j]);
            o.push(x);
          }
          return o;
        },
      }),
    };
  };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: aba, getName: () => 'teste' }) },
    Utilities: { formatDate: () => '19/11/2026' },
    CacheService: { getScriptCache: () => cache },
    ContentService: { createTextOutput: s => ({ s, setMimeType() { return this; } }), MimeType: { JSON: 'json', JAVASCRIPT: 'js' } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(GS, ctx);
  // Cada chamada ao /exec é uma EXECUÇÃO nova no Apps Script: o memo da
  // execução (o catálogo e as abas lidas) não sobrevive de uma para a outra.
  const get = acao => {
    vm.runInContext('_catalogoMemo = null; _invalidarValores();', ctx);
    return vm.runInContext(`doGet({ parameter: { action: ${JSON.stringify(acao)} } })`, ctx).s;
  };
  const run = code => vm.runInContext(code, ctx);
  return { ABAS, STORE, OPS, leituras, get, run, recusados: () => recusados };
}

console.log('\n── o getProdutos de 19/11 (431 códigos) passa de 100 KB ──');
{
  const T = montar({ PRODUTO_CODIGO: catalogo(431) });
  const r1 = T.get('getProdutos');
  ok('a resposta tem os 431 códigos e passa dos 100 KB (o CacheService recusaria numa chave só)',
     [(abre(r1) || {}).produtos?.length, Buffer.byteLength(r1) > LIMITE], [431, true]);
  ok('a 1ª chamada lê a PRODUTO_CODIGO uma vez e tenta a chave única (recusada)',
     [T.leituras.PRODUTO_CODIGO, T.recusados()], [1, 1]);
  // Sem marcador (o defeito de volta: a resposta grande não vai ao cache), os
  // testes abaixo falham com a mensagem — nunca a suíte quebrando no meio.
  const marca = Object.entries(T.STORE).find(([k]) => /:getProdutos:/.test(k) && !/#/.test(k)) || ['(sem marcador)', ''];
  const [, nM, tamM, idM] = marca[1].match(/^#PARTES:(\d+):(\d+):([0-9a-z]+)$/) || [];
  const partes = Object.entries(T.STORE).filter(([k]) => k.startsWith(marca[0] + '#' + idM + '#'));
  ok('vai ao cache em partes: o marcador "#PARTES:n:tamanho:id" e n partes (chave#id#i), cada uma abaixo dos 100 KB',
     [!!idM, partes.length > 1, partes.length === Number(nM), partes.every(([, v]) => Buffer.byteLength(v) <= LIMITE), Number(tamM) === r1.length],
     [true, true, true, true, true]);
  // O marcador por ÚLTIMO (quem lê no meio da gravação não o acha) e o mesmo prazo em todas.
  const ordem = T.OPS.filter(([k]) => k.startsWith(marca[0]));
  ok('o marcador é gravado depois de todas as partes, e todas com o prazo da leitura (300 s)',
     [ordem.length > 1 && ordem[ordem.length - 1][0] === marca[0], ordem.every(([, ttl]) => ttl === 300)], [true, true]);
  // O CacheService é do SCRIPT: um .gs antigo ainda implantado (ou a volta à
  // v5.73) lê as chaves 'rp:' e entregaria o marcador como JSON. A v5.74 só
  // grava em 'rp2:'.
  ok('as leituras vão em chaves "rp2:" — nenhuma em "rp:", a que um .gs antigo leria',
     [marca[0].startsWith('rp2:'), Object.keys(T.STORE).some(k => k.startsWith('rp:'))], [true, false]);

  const r2 = T.get('getProdutos');
  ok('a 2ª chamada sai do CACHE: nenhuma leitura nova da planilha, a MESMA resposta',
     [T.leituras.PRODUTO_CODIGO, r2 === r1], [1, true]);

  // Uma parte expirou (o cache pode soltar uma chave antes da outra): falta no
  // cache — relê a planilha e devolve a resposta INTEIRA, nunca a metade.
  const k1 = (partes.find(([k]) => k.endsWith('#1')) || ['(sem parte)'])[0];
  delete T.STORE[k1];
  const r3 = T.get('getProdutos');
  ok('uma parte sumiu: relê a planilha e a resposta sai inteira (o JSON abre, 431 códigos)',
     [T.leituras.PRODUTO_CODIGO, (abre(r3) || {}).produtos?.length, r3 === r1], [2, 431, true]);

  // Gravar no cadastro troca a geração do grupo 'cat': as partes ficam órfãs.
  T.ABAS.PRODUTO_CODIGO[1][1] = 'VOL 1/2 BERCO ARCO-IRIS NOVO';
  T.run("invalidarCacheLeitura(['cat'])");
  const r4 = T.get('getProdutos');
  ok('gravou no cadastro (geração nova): relê e traz o dado novo',
     [T.leituras.PRODUTO_CODIGO, ((abre(r4) || {}).produtos || [{}])[0].desc], [3, 'VOL 1/2 BERCO ARCO-IRIS NOVO']);
  ok('e a seguinte já sai do cache de novo', [T.get('getProdutos') === r4, T.leituras.PRODUTO_CODIGO], [true, 3]);
}

console.log('\n── o que cabe numa chave segue como sempre ──');
{
  const T = montar({ PRODUTO_CODIGO: catalogo(40) });
  const r1 = T.get('getProdutos');
  const chaves = Object.keys(T.STORE).filter(k => /:getProdutos:/.test(k));
  ok('40 códigos (abaixo dos 100 KB): UMA chave, com o JSON dentro — sem marcador nem partes',
     [chaves.length, T.STORE[chaves[0]] === r1, T.recusados()], [1, true, 0]);
  ok('e a 2ª chamada sai do cache', [T.get('getProdutos') === r1, T.leituras.PRODUTO_CODIGO], [true, 1]);
}

console.log('\n── as bordas das partes ──');
{
  const T = montar({});
  const ida = (k, s) => [T.run(`_cachePutJson(CacheService.getScriptCache(), ${JSON.stringify(k)}, ${JSON.stringify(s)}, 300)`),
    T.run(`_cacheGetJson(CacheService.getScriptCache(), ${JSON.stringify(k)})`) === s];
  // O emoji (fora do BMP) são DOIS caracteres em JS: a parte não pode terminar
  // no meio dele — o cache guarda em UTF-8, e a metade solta voltaria como U+FFFD.
  const emoji = 'a'.repeat(29999) + '😀' + 'b'.repeat(40000) + 'ç'.repeat(40000);
  ok('par substituto na fronteira (o 30.000º caractere é a 1ª metade do emoji): volta idêntico, com o emoji inteiro',
     [ida('k1', emoji)], [[true, true]]);
  // 3 bytes por caractere em UTF-8 ("—"): 30.000 caracteres = 90 KB, ainda abaixo do limite.
  ok('texto de 3 bytes por caractere (240 KB): cada parte abaixo dos 100 KB, volta idêntico',
     [ida('k2', '—'.repeat(80000)), Object.keys(T.STORE).filter(k => /^k2#/.test(k)).every(k => Buffer.byteLength(T.STORE[k]) <= LIMITE)],
     [[true, true], true]);
  // A borda: 10 partes (300.000 caracteres) guarda; uma a mais não (como antes da v5.74).
  ok('exatamente 10 partes (300.000 caracteres): guarda e volta idêntico', ida('k3a', 'x'.repeat(300000)), [true, true]);
  ok('acima de 10 partes (300.001 caracteres): não guarda nada', [ida('k3', 'x'.repeat(300001)), 'k3' in T.STORE], [[false, false], false]);
  // Duas gravações da MESMA chave: cada uma com o seu id — o marcador só junta as partes dele.
  const c = T.run('CacheService.getScriptCache()');
  T.run(`_cachePutJson(CacheService.getScriptCache(), 'k6', ${JSON.stringify('a'.repeat(110000))}, 300)`);
  const marcaA = T.STORE.k6;
  T.run(`_cachePutJson(CacheService.getScriptCache(), 'k6', ${JSON.stringify('b'.repeat(110000))}, 300)`);
  T.STORE.k6 = marcaA;                                   // o marcador da 1ª ficou por último (corrida)
  ok('duas gravações cruzadas da mesma chave: o marcador junta só as partes do seu id — nunca a mistura',
     [c && T.run("_cacheGetJson(CacheService.getScriptCache(), 'k6')") === 'a'.repeat(110000)], [true]);
  // Marcador cujas partes não somam o tamanho, ou estragado: falta, nunca JSON quebrado.
  T.STORE.k4 = '#PARTES:2:10:abc'; T.STORE['k4#abc#0'] = 'abc'; T.STORE['k4#abc#1'] = 'de';
  T.STORE.k5 = '#PARTES:x:1:abc';
  ok('partes que não somam o tamanho do marcador, ou marcador estragado: falta no cache (null)',
     [T.run("_cacheGetJson(CacheService.getScriptCache(), 'k4')"), T.run("_cacheGetJson(CacheService.getScriptCache(), 'k5')"),
      T.run("_cacheGetJson(CacheService.getScriptCache(), 'nao-tem')")],
     [null, null, null]);
}

console.log('\n── a versão ──');
{
  const HTML = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
  ok('o cabeçalho do .gs conta a v5.74 e o painel espera a mesma (o trio é conferido no apps-script.test.js)',
     [/^\/\/ Versão: 5\.74 — RESPOSTA ACIMA DE 100 KB VAI AO CACHE EM PARTES/m.test(GS), /const GS_REPO\s+= '5\.74';/.test(HTML)],
     [true, true]);
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
