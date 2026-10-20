// REGISTRO DA CRONOANÁLISE (.gs v5.30): registrarCrono e getCronoRegistros
// rodando o .gs INTEIRO numa planilha de mentira.
//   node crono-registro.test.js
//
// PPCP, 20/10/2026: "pode fazer tbm guardar o que é cronoanálise e que linha
// faz". Cada medição registrada no painel vira UMA linha na aba CRONOANALISE:
// os segundos do Volume a volume, a conversão do momento e o que a linha faz.
// O que se prende aqui: a aba nasce sozinha, a retentativa não duplica (REG_ID),
// a gravação é pelo NOME da coluna, vazio fica vazio (nunca 0) e a UEP do
// cadastro não é tocada.

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

function montar(abas) {
  const ABAS = Object.assign({
    PRODUTO_CODIGO: [['CODIGO', 'DESCRICAO', 'COR', 'UEP'], ['501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 'BRANCO', 1.2]],
  }, abas || {});
  function aba(nome) {
    const v = ABAS[nome];
    if (!v) return null;
    return {
      getName: () => nome, getLastRow: () => v.length, getLastColumn: () => Math.max(0, ...v.map(r => r.length)),
      getDataRange: () => ({ getValues: () => v.map(r => r.slice()) }),
      getRange: (l, c, nl, nc) => ({
        getValues: () => { const out = []; for (let i = 0; i < (nl || 1); i++) { const r = v[l - 1 + i] || []; const x = []; for (let j = 0; j < (nc || 1); j++) x.push(r[c - 1 + j] === undefined ? '' : r[c - 1 + j]); out.push(x); } return out; },
        setValue: x => { (v[l - 1] = v[l - 1] || [])[c - 1] = x; },
      }),
      appendRow: r => { v.push(r.slice()); },
      setFrozenRows: () => {},
    };
  }
  const ss = { getSheetByName: aba, insertSheet: nome => { ABAS[nome] = []; return aba(nome); }, getName: () => 'teste' };
  const CACHE = {};
  let locks = 0;
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    Utilities: { formatDate: (d, tz, f) => (/HH/.test(f) ? '20/10/2026 15:40:00' : '20/10/2026') },
    CacheService: { getScriptCache: () => ({ get: k => (k in CACHE ? CACHE[k] : null), put: (k, x) => { CACHE[k] = x; }, remove: k => { delete CACHE[k]; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock: () => { locks++; }, releaseLock: () => {} }) },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(GS, ctx);
  const run = code => vm.runInContext('(function(){ _invalidarValores(); ' + code + ' })()', ctx);
  return { ABAS, run, locks: () => locks };
}

// O que o painel manda (o _ucvRegMontar): números como o JS escreve, vazio = ''.
const MED = {
  regId: 'c1abc', data: '20/10/2026', modelo: '501149', produto: 'MESA CABECEIRA MADERO', volume: 'VOL 1/1',
  codigos: '501.149.001 501.149.002', sRod: '8.6', sPer: '9.4', sLac: '', volumes: '60',
  base: 'SLEEP MEDIDA 20/10/2026', baseS: '7.9', tol: '15', tpS: '9.89', uep: '1.09', uepCad: '1.2',
  linhaCxh: '175', linhaSCx: '20.57', linhaDias: '4', linhaPer: '20/09/2026 a 19/10/2026', vel: '9', entre: '250', quem: 'PPCP',
};
const q = o => JSON.stringify(o);

console.log('\n── registrarCrono: a aba nasce sozinha e a linha é a medição ──');
{
  const P = montar();
  const r = P.run(`return registrarCrono(${q(MED)});`);
  const H = P.ABAS.CRONOANALISE[0], L = P.ABAS.CRONOANALISE[1];
  const col = n => L[H.indexOf(n)];
  ok('grava e diz que gravou (o painel confere o "registrado")', [r.ok, r.registrado, r.duplicado, r.linha], [true, true, undefined, 2]);
  ok('a aba CRONOANALISE nasce com o cabeçalho, REGISTRADO_EM primeiro e REG_ID por último',
     [H[0], H[1], H[H.length - 1], H.length, P.ABAS.CRONOANALISE.length], ['REGISTRADO_EM', 'DATA_MEDICAO', 'REG_ID', 24, 2]);
  ok('os segundos e a conversão como NÚMERO; vazio fica vazio (nunca 0)',
     [col('S_RODANDO'), col('S_PERIODO'), col('S_SEM_LACUNAS'), col('VOLUMES_MEDIDOS'), col('UEP_CRONO'), col('UEP_CADASTRO'), col('LINHA_S_CX'), col('ENTRE_PECAS')],
     [8.6, 9.4, '', 60, 1.09, 1.2, 20.57, 250]);
  ok('texto como texto (produto, volume, base, códigos, quem) e o carimbo do servidor',
     [col('REGISTRADO_EM'), col('DATA_MEDICAO'), col('PRODUTO'), col('VOLUME'), col('BASE'), col('CODIGOS'), col('MEDIDO_POR'), col('REG_ID')],
     ['20/10/2026 15:40:00', '20/10/2026', 'MESA CABECEIRA MADERO', 'VOL 1/1', 'SLEEP MEDIDA 20/10/2026', '501.149.001 501.149.002', 'PPCP', 'c1abc']);
  ok('roda sob o lock dos lançamentos', P.locks() > 0, true);
  ok('a UEP do cadastro NÃO é tocada', P.ABAS.PRODUTO_CODIGO, [['CODIGO', 'DESCRICAO', 'COR', 'UEP'], ['501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 'BRANCO', 1.2]]);

  const r2 = P.run(`return registrarCrono(${q(MED)});`);
  ok('o MESMO REG_ID de novo (retentativa por timeout, 2º clique): não duplica', [r2.ok, r2.registrado, r2.duplicado, P.ABAS.CRONOANALISE.length], [true, true, true, 2]);
  P.run(`return registrarCrono(${q(Object.assign({}, MED, { regId: 'c2def', data: '17/10/2026', sRod: '8,8' }))});`);
  ok('outra medição entra; "8,8" com vírgula também vira número', [P.ABAS.CRONOANALISE.length, P.ABAS.CRONOANALISE[2][P.ABAS.CRONOANALISE[0].indexOf('S_RODANDO')]], [3, 8.8]);
}

console.log('\n── registrarCrono: o que não grava ──');
{
  const P = montar();
  ok('sem REG_ID, sem o RODANDO ou sem produto: erro dito, e a aba nem nasce',
     [P.run(`return registrarCrono(${q(Object.assign({}, MED, { regId: '' }))});`).ok,
      P.run(`return registrarCrono(${q(Object.assign({}, MED, { sRod: '' }))});`).ok,
      P.run(`return registrarCrono(${q(Object.assign({}, MED, { sRod: '0' }))});`).ok,
      P.run(`return registrarCrono(${q(Object.assign({}, MED, { produto: ' ' }))});`).ok,
      'CRONOANALISE' in P.ABAS], [false, false, false, false, false]);
}

console.log('\n── registrarCrono: grava pelo NOME da coluna ──');
{
  // aba de mentira com as colunas em outra ordem, uma coluna do PPCP no meio e
  // sem a coluna ENTRE_PECAS (aba de uma versão anterior)
  const H0 = ['REGISTRADO_EM', 'PRODUTO', 'OBSERVAÇÃO DO PPCP', 'S_RODANDO', 'DATA_MEDICAO', 'REG_ID'];
  const P = montar({ CRONOANALISE: [H0.slice()] });
  P.run(`return registrarCrono(${q(MED)});`);
  const H = P.ABAS.CRONOANALISE[0], L = P.ABAS.CRONOANALISE[1];
  ok('cada valor vai na coluna do NOME; a coluna do PPCP fica vazia', [L[1], L[2], L[3], L[4], L[5]], ['MESA CABECEIRA MADERO', '', 8.6, '20/10/2026', 'c1abc']);
  ok('a coluna que faltava é criada no fim (e recebe o valor)', [H.indexOf('ENTRE_PECAS') >= H0.length, L[H.indexOf('ENTRE_PECAS')]], [true, 250]);
}

console.log('\n── getCronoRegistros ──');
{
  const P = montar();
  ok('sem a aba ainda: lista vazia, não erro', P.run(`return getCronoRegistros();`), { ok: true, registros: [] });
  P.run(`return registrarCrono(${q(MED)});`);
  P.run(`return registrarCrono(${q(Object.assign({}, MED, { regId: 'c2', data: '17/10/2026', sRod: '8.8', sPer: '' }))});`);
  const r = P.run(`return getCronoRegistros();`);
  ok('da mais NOVA para a mais antiga', r.registros.map(x => x.data), ['17/10/2026', '20/10/2026']);
  const x = r.registros[1];
  ok('números como número, vazio como null (nunca 0), texto como texto',
     [x.sRod, x.sPer, x.sLac, x.uep, x.uepCad, x.linhaSCx, x.volumes, x.produto, x.volume, x.base, x.em, x.regId, r.registros[0].sPer],
     [8.6, 9.4, null, 1.09, 1.2, 20.57, 60, 'MESA CABECEIRA MADERO', 'VOL 1/1', 'SLEEP MEDIDA 20/10/2026', '20/10/2026 15:40:00', 'c1abc', null]);
}

console.log('\n── o dispatcher e o cache ──');
ok('registrar é gravação (invalida o cache de leitura); ler entra no cache de leitura',
   [/ACOES_ESCRITA = \[[^\]]*'registrarCrono'/.test(GS), /getCronoRegistros:\s*\d+/.test(GS), /registrarCrono:\s*\d+/.test(GS)], [true, true, false]);
ok('as duas ações estão no doGet',
   [/act === 'registrarCrono'\)\s*result = registrarCrono\(p\)/.test(GS), /act === 'getCronoRegistros'\)\s*result = getCronoRegistros\(\)/.test(GS)], [true, true]);
ok('o registro não chama nada que grave a UEP do cadastro',
   /setUepCatalogo|_uepVerDaEdicao|UEP_VERSOES/.test(GS.slice(GS.indexOf('function registrarCrono('), GS.indexOf('function getCronoRegistros('))), false);

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
