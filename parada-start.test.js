// START de parada sem internet: a parada fecha na hora do 1º toque, não na do
// toque que finalmente chegou ao servidor.
//   node parada-start.test.js
//
// O teste roda o código REAL do mobile: `darStartParada`, `parStartHora`, os
// helpers da hora guardada e o banner são extraídos do ritmoprod_mobile.html e
// rodados num contexto com rede, planilha e localStorage de mentira.
//
// O caso que deu origem (21/10/2026, aba PARADAS linha 917): troca de produto
// das 13:19:56, de ~6 min. O START das ~13:25 não chegou (sem internet), o
// operador tocou de novo às 13:37:32 e esse toque mandou a hora DELE: a parada
// ficou com 17,6 min — 11,6 min de parada que não existiu, em caixas perdidas
// e no SMED da troca de produto.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
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

const FUNCS = ['function paradaAtiva(', 'function _marcarFechadaLocal(', 'function _parStartLe(',
  'function _parStartGrava(', 'function parStartHora(', 'function _parStartPendente(',
  'function renderParadaEstado(', 'async function darStartParada('];

// Um celular novo a cada cenário: o estado do módulo não vaza de um para outro.
function celular() {
  const store = {};
  const els = {};
  const F = {
    console, JSON, Object, String, Number, Date, Map, Promise,
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; },
    },
    document: { getElementById: id => (els[id] = els[id] || { id, textContent: '', disabled: false, innerHTML: '', dataset: {} }) },
    CFG: { sheetsUrl: 'https://script.google.com/macros/s/X/exec' },
    PAR_TIPOS: [],
    ALERTAS: [], ENVIOS: [],
    DIA: '21/10/2026', AGORA: '00:00:00',
    REDE: 'ok',             // 'ok' · 'off' (nada chega) · 'perde' (grava e a resposta se perde)
    SERVIDOR: [],           // as linhas da aba PARADAS
  };
  F.alert = m => F.ALERTAS.push(m);
  F.hojeStr = () => F.DIA;
  F.nowHoraSeg = () => F.AGORA;
  F.renderParadasList = () => {};
  F.atualizarBadgeParadas = () => {};
  // endParada de mentira: grava o fim que veio na URL (como o .gs faz).
  F.jsonpEscritaParada = async url => {
    const q = new URL(url).searchParams;
    F.ENVIOS.push({ id: q.get('id'), fim: q.get('fim') });
    if (F.REDE === 'off') throw new Error('Erro de rede');
    const p = F.SERVIDOR.find(x => String(x.id) === q.get('id'));
    if (!p) throw new Error('parada não encontrada');
    p.fim = q.get('fim');
    if (F.REDE === 'perde') throw new Error('Timeout');
    return { ok: true, fim: p.fim };
  };
  // getParadas de mentira: sem rede a leitura falha e a tela fica como estava.
  F.carregarParadas = async () => {
    if (F.REDE === 'off') return;
    F.PARADAS_HOJE = F.SERVIDOR.map(p => Object.assign({}, p));
  };
  vm.createContext(F);
  vm.runInContext(
    'var PARADAS_HOJE = [], _paradaLocalAberta = null, _parEscrevendo = false, _parEstadoRender = null;\n'
    + 'var _parFechadasLocal = new Map();\n'
    + MJS.match(/const PAR_START_K = '[^']+';/)[0].replace('const ', 'var ') + '\n'
    + FUNCS.map(f => pega(MJS, f)).join('\n'), F);
  F.store = store; F.els = els;
  return F;
}
const start = async F => { await vm.runInContext('darStartParada()', F); };
const guardado = F => (F.store.rp_par_start ? JSON.parse(F.store.rp_par_start) : null);
const abre = (F, p) => { F.SERVIDOR.push(Object.assign({ fim: '' }, p)); F.PARADAS_HOJE = F.SERVIDOR.map(x => Object.assign({}, x)); };

(async () => {
  console.log('── o caso real: START sem internet, 2º toque 12 min depois ──');
  {
    const F = celular();
    abre(F, { id: 1792599596073, tipo: 'Troca de produto', ini: '13:19:56' });
    F.REDE = 'off'; F.AGORA = '13:25:56';
    await start(F);
    ok('1º toque sem rede: a parada continua aberta (aviso na tela)', F.ALERTAS.length, 1);
    ok('o aviso diz a hora guardada', /13:25:56/.test(F.ALERTAS[0] || ''), true);
    ok('o aviso fala de internet, não de erro do servidor', /internet/.test(F.ALERTAS[0] || ''), true);
    ok('a hora do 1º toque fica guardada no aparelho', guardado(F),
       { dia: '21/10/2026', itens: { '1792599596073': { ini: '13:19:56', fim: '13:25:56' } } });
    ok('o banner mostra o START que ainda não foi', /START TOCADO ÀS 13:25:56/.test(F.els['par-estado'].innerHTML), true);
    ok('o botão volta habilitado', /id="btn-start-parada"/.test(F.els['par-estado'].innerHTML), true);

    F.REDE = 'ok'; F.AGORA = '13:37:32';
    await start(F);
    ok('2º toque, com rede: manda a hora do 1º toque', F.ENVIOS[F.ENVIOS.length - 1].fim, '13:25:56');
    ok('na planilha a parada fecha em 13:25:56 (6 min), não 13:37:32', F.SERVIDOR[0].fim, '13:25:56');
    ok('nada fica guardado depois de chegar', guardado(F), null);
    ok('sem aviso no 2º toque', F.ALERTAS.length, 1);
  }

  console.log('\n── gravou e a resposta se perdeu ──');
  {
    const F = celular();
    abre(F, { id: 10, ini: '09:00:00' });
    F.REDE = 'perde'; F.AGORA = '09:04:00';
    await start(F);
    // A releitura (rede de volta) mostra a parada fechada: nada de aviso.
    ok('sem aviso: o servidor mostra o FIM', F.ALERTAS.length, 0);
    ok('fim gravado = o do toque', F.SERVIDOR[0].fim, '09:04:00');
    ok('nada fica guardado', guardado(F), null);
  }

  console.log('\n── toque normal, com rede ──');
  {
    const F = celular();
    abre(F, { id: 20, ini: '10:00:00' });
    F.AGORA = '10:03:10';
    await start(F);
    ok('fim = a hora do toque', F.SERVIDOR[0].fim, '10:03:10');
    ok('nada fica guardado', guardado(F), null);
    ok('sem aviso', F.ALERTAS.length, 0);
  }

  console.log('\n── a hora guardada só vale para a MESMA parada ──');
  {
    const F = celular();
    // Sobra de outra parada (fechada por outro caminho) e de ontem.
    F.store.rp_par_start = JSON.stringify({ dia: '21/10/2026', itens: { '99': { ini: '08:00:00', fim: '08:05:00' } } });
    abre(F, { id: 30, ini: '11:00:00' });
    F.AGORA = '11:07:00';
    await start(F);
    ok('outra parada: usa a hora de agora', F.SERVIDOR[0].fim, '11:07:00');
    ok('a sobra da outra parada sai da lista', guardado(F), null);

    const G = celular();
    G.store.rp_par_start = JSON.stringify({ dia: '20/10/2026', itens: { '40': { ini: '14:00:00', fim: '14:02:00' } } });
    abre(G, { id: 40, ini: '14:00:00' });
    G.AGORA = '14:09:00';
    await start(G);
    ok('guardado de ONTEM não vale (mesmo id e início)', G.SERVIDOR[0].fim, '14:09:00');
  }

  console.log('\n── parStartHora (conta pura) ──');
  {
    const F = celular();
    const h = (g, at, agora) => vm.runInContext(`parStartHora(${JSON.stringify(g)}, ${JSON.stringify(at)}, '${agora}')`, F);
    ok('sem guardado → agora', h(null, { ini: '13:19:56' }, '13:37:32'), '13:37:32');
    ok('guardado da mesma parada → guardado', h({ ini: '13:19:56', fim: '13:25:56' }, { ini: '13:19:56' }, '13:37:32'), '13:25:56');
    ok('início diferente (linha reaproveitada) → agora', h({ ini: '12:00:00', fim: '12:05:00' }, { ini: '13:19:56' }, '13:37:32'), '13:37:32');
    ok('guardado ANTES do início → agora', h({ ini: '13:19:56', fim: '13:10:00' }, { ini: '13:19:56' }, '13:37:32'), '13:37:32');
    ok('parada antiga sem segundos (HH:mm) também casa', h({ ini: '13:19', fim: '13:25:56' }, { ini: '13:19' }, '13:37:32'), '13:25:56');
  }

  console.log('\n── duas paradas abertas: cada uma com a sua hora ──');
  {
    const F = celular();
    abre(F, { id: 50, ini: '15:00:00' });
    abre(F, { id: 51, ini: '15:02:00' });
    F.REDE = 'off'; F.AGORA = '15:06:00';
    await start(F);
    F.REDE = 'ok'; F.AGORA = '15:20:00';
    await start(F);
    ok('as duas fecham na hora do 1º toque', F.SERVIDOR.map(p => p.fim), ['15:06:00', '15:06:00']);
    ok('nada fica guardado', guardado(F), null);
  }

  console.log('\n── erro do servidor não é falta de internet ──');
  {
    const F = celular();
    F.PARADAS_HOJE = [{ id: 'L900', ini: '16:00:00', fim: '' }];   // não existe na aba
    F.SERVIDOR = [];
    F.carregarParadas = async () => {};                               // releitura igual à tela
    F.AGORA = '16:05:00';
    await start(F);
    ok('o aviso diz que o servidor recusou', /recusou o START: parada não encontrada/.test(F.ALERTAS[0] || ''), true);
    ok('a hora fica guardada para o próximo toque', guardado(F).itens.L900.fim, '16:05:00');
  }

  console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
