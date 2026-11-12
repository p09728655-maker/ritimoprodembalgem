// REGISTRO DA CRONOANÁLISE (.gs v5.30): registrarCrono e getCronoRegistros
// rodando o .gs INTEIRO numa planilha de mentira — e o EXCLUIR de uma medição
// (.gs v5.33, excluirCrono).
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

// META: linhas em branco abaixo dos dados (o Sheets nasce com ~1.000) e as
// congeladas. Como no Sheets, apagar a ÚLTIMA linha não congelada dá erro.
function montar(abas, meta, hoje, props) {
  const PROPS = props || {};
  const HOJE = hoje || '20/10/2026';
  const ABAS = Object.assign({
    PRODUTO_CODIGO: [['CODIGO', 'DESCRICAO', 'COR', 'UEP'], ['501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 'BRANCO', 1.2]],
  }, abas || {});
  const META = meta || {};
  const M = nome => (META[nome] = META[nome] || { extra: 998, frozen: 1 });
  function aba(nome) {
    const v = ABAS[nome];
    if (!v) return null;
    const m = M(nome);
    return {
      getMaxRows: () => v.length + m.extra, getFrozenRows: () => m.frozen,
      insertRowAfter: () => { m.extra++; },
      deleteRow: n => {
        if (!lockDePe) semLock++;
        if (v.length + m.extra - m.frozen <= 1) throw new Error('Não é possível excluir todas as linhas não congeladas.');
        if (n > v.length) m.extra--; else v.splice(n - 1, 1);
      },
      getName: () => nome, getLastRow: () => v.length, getLastColumn: () => Math.max(0, ...v.map(r => r.length)),
      getDataRange: () => ({ getValues: () => v.map(r => r.slice()) }),
      getRange: (l, c, nl, nc) => ({
        getValues: () => { const out = []; for (let i = 0; i < (nl || 1); i++) { const r = v[l - 1 + i] || []; const x = []; for (let j = 0; j < (nc || 1); j++) x.push(r[c - 1 + j] === undefined ? '' : r[c - 1 + j]); out.push(x); } return out; },
        getValue: () => { const r = v[l - 1] || []; return r[c - 1] === undefined ? '' : r[c - 1]; },
        setValue: x => { if (!lockDePe) semLock++; (v[l - 1] = v[l - 1] || [])[c - 1] = x; },
        setValues: vals => { vals.forEach((r, i) => { const L = v[l - 1 + i] = v[l - 1 + i] || []; r.forEach((x, j) => { L[c - 1 + j] = x; }); }); },
        setNumberFormat(f) { for (let i = 0; i < (nl || 1); i++) for (let j = 0; j < (nc || 1); j++) FMT[nome + '|' + (l + i) + '|' + (c + j)] = f; return this; },
      }),
      appendRow: r => { if (!lockDePe) semLock++; v.push(r.slice()); },
      setFrozenRows: n => { m.frozen = n; },
    };
  }
  const ss = { getSheetByName: aba, insertSheet: nome => { ABAS[nome] = []; META[nome] = { extra: 1000, frozen: 0 }; return aba(nome); }, getName: () => 'teste' };
  const CACHE = {}, FMT = {};
  let locks = 0, lockDePe = false, semLock = 0;
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    Utilities: { formatDate: (d, tz, f) => (/HH/.test(f) ? HOJE + ' 15:40:00' : HOJE) },
    CacheService: { getScriptCache: () => ({ get: k => (k in CACHE ? CACHE[k] : null), put: (k, x) => { CACHE[k] = x; }, remove: k => { delete CACHE[k]; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in PROPS ? PROPS[k] : null), setProperty: (k, x) => { PROPS[k] = x; } }) },
    LockService: { getScriptLock: () => ({ waitLock: () => { locks++; lockDePe = true; }, releaseLock: () => { lockDePe = false; } }) },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(GS, ctx);
  const run = code => vm.runInContext('(function(){ _invalidarValores(); ' + code + ' })()', ctx);
  return { ABAS, run, ctx, FMT, locks: () => locks, semLock: () => semLock };
}

// O que o painel manda (o _ucvRegMontar): números como o JS escreve, vazio = ''.
const MED = {
  regId: 'c1abc', data: '20/10/2026', modelo: '501149', produto: 'MESA CABECEIRA MADERO', volume: 'VOL 1/1',
  codigos: '501.149.001 501.149.002', sRod: '8.6', sPer: '9.4', sLac: '7.1', volumes: '60',
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
  // v5.58: a ORIGEM entrou depois do REG_ID (a coluna nova vai sempre para o fim)
  ok('a aba CRONOANALISE nasce com o cabeçalho, REGISTRADO_EM primeiro, REG_ID e ORIGEM no fim',
     [H[0], H[1], H[H.length - 2], H[H.length - 1], H.length, P.ABAS.CRONOANALISE.length], ['REGISTRADO_EM', 'DATA_MEDICAO', 'REG_ID', 'ORIGEM', 25, 2]);
  ok('os segundos e a conversão como NÚMERO',
     [col('S_RODANDO'), col('S_PERIODO'), col('S_SEM_LACUNAS'), col('VOLUMES_MEDIDOS'), col('UEP_CRONO'), col('UEP_CADASTRO'), col('LINHA_S_CX'), col('ENTRE_PECAS')],
     [8.6, 9.4, 7.1, 60, 1.09, 1.2, 20.57, 250]);
  { const PV = montar(); PV.run(`return registrarCrono(${q(Object.assign({}, MED, { sPer: '', vel: '' }))});`);
    const HV = PV.ABAS.CRONOANALISE[0], LV = PV.ABAS.CRONOANALISE[1];
    ok('vazio fica vazio (nunca 0)', [LV[HV.indexOf('S_PERIODO')], LV[HV.indexOf('VELOCIDADE')]], ['', '']); }
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
  ok('sem REG_ID, sem o RODANDO, sem o SEM AS LACUNAS (v5.44: é a régua da UEP) ou sem produto: erro dito, e a aba nem nasce',
     [P.run(`return registrarCrono(${q(Object.assign({}, MED, { regId: '' }))});`).ok,
      P.run(`return registrarCrono(${q(Object.assign({}, MED, { sRod: '' }))});`).ok,
      P.run(`return registrarCrono(${q(Object.assign({}, MED, { sRod: '0' }))});`).ok,
      P.run(`return registrarCrono(${q(Object.assign({}, MED, { sLac: '' }))});`).ok,
      P.run(`return registrarCrono(${q(Object.assign({}, MED, { sLac: '' }))});`).erro,
      P.run(`return registrarCrono(${q(Object.assign({}, MED, { produto: ' ' }))});`).ok,
      'CRONOANALISE' in P.ABAS], [false, false, false, false, 'Sem o tempo SEM AS LACUNAS da medição.', false, false]);
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
  ok('sem a aba ainda: lista vazia, não erro (v5.64: e as travas, vazias)', P.run(`return getCronoRegistros();`), { ok: true, registros: [], travas: [] });
  P.run(`return registrarCrono(${q(MED)});`);
  P.run(`return registrarCrono(${q(Object.assign({}, MED, { regId: 'c2', data: '17/10/2026', sRod: '8.8', sPer: '' }))});`);
  const r = P.run(`return getCronoRegistros();`);
  ok('da mais NOVA para a mais antiga', r.registros.map(x => x.data), ['17/10/2026', '20/10/2026']);
  const x = r.registros[1];
  ok('números como número, vazio como null (nunca 0), texto como texto',
     [x.sRod, x.sPer, x.sLac, x.uep, x.uepCad, x.linhaSCx, x.volumes, x.produto, x.volume, x.base, x.em, x.regId, r.registros[0].sPer],
     [8.6, 9.4, 7.1, 1.09, 1.2, 20.57, 60, 'MESA CABECEIRA MADERO', 'VOL 1/1', 'SLEEP MEDIDA 20/10/2026', '20/10/2026 15:40:00', 'c1abc', null]);
}

console.log('\n── excluirCrono (v5.33): sai UMA linha, pelo REG_ID, com cópia antes ──');
{
  const P = montar();
  P.run(`return registrarCrono(${q(MED)});`);
  P.run(`return registrarCrono(${q(Object.assign({}, MED, { regId: 'c2def', data: '21/10/2026', sRod: '16.2', volume: 'VOL 1/2' }))});`);
  P.run(`return registrarCrono(${q(Object.assign({}, MED, { regId: 'c3ghi', data: '23/10/2026', sRod: '12.4' }))});`);
  const H = P.ABAS.CRONOANALISE[0].slice(), iId = H.indexOf('REG_ID');
  const antes = P.ABAS.CRONOANALISE[2].slice();
  const r = P.run(`return excluirCrono({ regId: 'c2def' });`);
  ok('exclui e diz que excluiu, com a linha onde estava', [r.ok, r.excluido, r.jaExcluido, r.linha], [true, true, undefined, 3]);
  ok('sai SÓ aquela linha; as outras ficam, na ordem', P.ABAS.CRONOANALISE.slice(1).map(l => l[iId]), ['c1abc', 'c3ghi']);
  const X = P.ABAS.CRONO_EXCLUIDOS, hX = X[0];
  ok('a CRONO_EXCLUIDOS nasce com EXCLUIDO_EM, LINHA_ORIGINAL e as colunas da CRONOANALISE',
     [hX[0], hX[1], hX.slice(2).join('|') === H.join('|'), X.length], ['EXCLUIDO_EM', 'LINHA_ORIGINAL', true, 2]);
  ok('a cópia é a linha INTEIRA, como estava (números como número), com a hora e a linha',
     [X[1][0], X[1][1], JSON.stringify(X[1].slice(2)) === JSON.stringify(antes), X[1][hX.indexOf('S_RODANDO')], X[1][hX.indexOf('VOLUME')]],
     ['20/10/2026 15:40:00', 3, true, 16.2, 'VOL 1/2']);
  ok('roda sob o lock dos lançamentos: copia e apaga com ele de pé', [P.locks() >= 4, P.semLock()], [true, 0]);
  ok('a UEP do cadastro NÃO é tocada', P.ABAS.PRODUTO_CODIGO, [['CODIGO', 'DESCRICAO', 'COR', 'UEP'], ['501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 'BRANCO', 1.2]]);

  const r2 = P.run(`return excluirCrono({ regId: 'c2def' });`);
  ok('a retentativa (resposta perdida no timeout): "já excluída", sem apagar OUTRA linha nem copiar de novo',
     [r2.ok, r2.excluido, r2.jaExcluido, P.ABAS.CRONOANALISE.length, P.ABAS.CRONO_EXCLUIDOS.length], [true, true, true, 3, 2]);
  const r3 = P.run(`return excluirCrono({ regId: 'cxxxx' });`);
  ok('REG_ID que não está em aba nenhuma (apagado à mão): não é erro, diz que não achou e não mexe em nada',
     [r3.ok, r3.excluido, r3.naoAchou, P.ABAS.CRONOANALISE.length, P.ABAS.CRONO_EXCLUIDOS.length], [true, false, true, 3, 2]);
  const r4 = P.run(`return excluirCrono({ regId: '  ' });`);
  ok('sem REG_ID: erro dito, nada muda', [r4.ok, P.ABAS.CRONOANALISE.length], [false, 3]);
  ok('a lista do painel não traz mais a excluída', P.run(`return getCronoRegistros();`).registros.map(x => x.regId), ['c3ghi', 'c1abc']);
  P.run(`return registrarCrono(${q(Object.assign({}, MED, { regId: 'c2def', data: '21/10/2026', sRod: '16.2', volume: 'VOL 1/2' }))});`);
  ok('registrar de novo a MESMA medição depois de excluir: volta (o REG_ID não está mais na aba)',
     P.ABAS.CRONOANALISE.slice(1).map(l => l[iId]), ['c1abc', 'c3ghi', 'c2def']);
  P.run(`return excluirCrono({ regId: 'c1abc' });`);
  ok('a 2ª exclusão acrescenta na CRONO_EXCLUIDOS (só acréscimo)',
     [P.ABAS.CRONO_EXCLUIDOS.length, P.ABAS.CRONO_EXCLUIDOS[2][P.ABAS.CRONO_EXCLUIDOS[0].indexOf('REG_ID')], P.ABAS.CRONO_EXCLUIDOS[2][1]], [3, 'c1abc', 2]);
}
{
  // aba com uma coluna do PPCP no meio; a CRONO_EXCLUIDOS já existe de antes,
  // sem essa coluna: ela é criada no fim e recebe o valor
  const H0 = ['REGISTRADO_EM', 'PRODUTO', 'OBSERVAÇÃO DO PPCP', 'S_RODANDO', 'REG_ID'];
  const P = montar({ CRONOANALISE: [H0.slice(), ['20/10/2026 15:58:38', 'MESA CABECEIRA MADERO', 'NO PERÍODO ERRADO', 7.9, 'c9']],
                     CRONO_EXCLUIDOS: [['EXCLUIDO_EM', 'LINHA_ORIGINAL', 'REGISTRADO_EM', 'PRODUTO', 'S_RODANDO', 'REG_ID']] });
  P.run(`return excluirCrono({ regId: 'c9' });`);
  const X = P.ABAS.CRONO_EXCLUIDOS, c = n => X[1][X[0].indexOf(n)];
  ok('cópia pelo NOME da coluna; a coluna que faltava na CRONO_EXCLUIDOS nasce no fim e recebe o valor',
     [c('PRODUTO'), c('S_RODANDO'), c('REG_ID'), X[0].indexOf('OBSERVAÇÃO DO PPCP') >= 6, c('OBSERVAÇÃO DO PPCP'), P.ABAS.CRONOANALISE.length],
     ['MESA CABECEIRA MADERO', 7.9, 'c9', true, 'NO PERÍODO ERRADO', 1]);
}
{
  // a aba sem linha em branco abaixo (alguém apagou as vazias): o Sheets não
  // deixa apagar a última linha não congelada — sobra uma em branco
  const P = montar({ CRONOANALISE: [['REGISTRADO_EM', 'PRODUTO', 'S_RODANDO', 'REG_ID'], ['x', 'MESA CABECEIRA MADERO', 7.9, 'c1']] },
                   { CRONOANALISE: { extra: 0, frozen: 1 } });
  let erro = '';
  try { P.run(`return excluirCrono({ regId: 'c1' });`); } catch (e) { erro = e.message; }
  ok('a única medição de uma aba sem linha sobrando também sai', [erro, P.ABAS.CRONOANALISE.length], ['', 1]);
}
{
  // a cópia falhou: nada é apagado
  const P = montar();
  P.run(`return registrarCrono(${q(MED)});`);
  P.run(`SpreadsheetApp.getActiveSpreadsheet().insertSheet = function () { throw new Error('sem permissão'); };`);
  let erro = '';
  try { P.run(`return excluirCrono({ regId: 'c1abc' });`); } catch (e) { erro = e.message; }
  ok('a cópia vem ANTES: se ela falha, a medição fica (não some sem rastro)', [erro, P.ABAS.CRONOANALISE.length], ['sem permissão', 2]);
}

console.log('\n── o dispatcher e o cache ──');
ok('registrar e excluir são gravação (invalidam o cache de leitura); ler entra no cache de leitura',
   [/ACOES_ESCRITA = \[[^\]]*'registrarCrono'/.test(GS), /ACOES_ESCRITA = \[[^\]]*'excluirCrono'/.test(GS), /getCronoRegistros:\s*\d+/.test(GS),
    /registrarCrono:\s*\d+/.test(GS), /excluirCrono:\s*\d+/.test(GS)], [true, true, true, false, false]);
ok('as três ações estão no doGet',
   [/act === 'registrarCrono'\)\s*result = registrarCrono\(p\)/.test(GS), /act === 'getCronoRegistros'\)\s*result = getCronoRegistros\(\)/.test(GS),
    /act === 'excluirCrono'\)\s*result = excluirCrono\(p\)/.test(GS)], [true, true, true]);
ok('o registro e a exclusão não chamam nada que grave a UEP do cadastro',
   [/setUepCatalogo|_uepVerDaEdicao|UEP_VERSOES/.test(GS.slice(GS.indexOf('function registrarCrono('), GS.indexOf('function getCronoRegistros('))),
    /setUepCatalogo|_uepVerDaEdicao|UEP_VERSOES/.test(GS.slice(GS.indexOf('function excluirCrono('), GS.indexOf('function _cronoJaExcluida(')))], [false, false]);
ok('a trava e a destrava leem as abas DIRETO (é escrita: nunca o memo de leitura)',
   /_valores\(|_valoresDaAba\(|lerCatalogoProdutos\(/.test(GS.slice(GS.indexOf('function _travaMedicoes('), GS.indexOf('function _travasLer('))), false);
ok('a exclusão lê a aba DIRETO (é escrita: nunca o memo de leitura)',
   /_valores\(|_valoresDaAba\(/.test(GS.slice(GS.indexOf('function excluirCrono('), GS.indexOf('A TRAVA DA UEP (v5.64)'))), false);

// ════════════════════════════════════════════════════════════════════════════
// TROCAR A UEP PELA CRONOANÁLISE + CONFERÊNCIA DAS TROCAS (.gs v5.34)
// PPCP, 26/10/2026. O caso real: STRASS VOL 2/2, 11,5 s × 61 (23/10) e 12,4 s ×
// 52 (26/10), sem lacuna; cadastro 2,29 nos três códigos do volume. v5.44: contra a
// MADERO SEM AS LACUNAS (6,7 s) = 1,78 (pela régua rodando, 7,9 s, era 1,51). A
// BASE_S e a UEP_CRONO gravadas (a régua antiga) não entram.
const HC = CRONO_HDR => CRONO_HDR;
const CRONO_COLS_NOMES = ['REGISTRADO_EM', 'DATA_MEDICAO', 'MODELO', 'PRODUTO', 'VOLUME', 'CODIGOS', 'S_RODANDO', 'S_PERIODO', 'S_SEM_LACUNAS', 'VOLUMES_MEDIDOS',
  'BASE', 'BASE_S', 'TOLERANCIA_PCT', 'TEMPO_PADRAO_S', 'UEP_CRONO', 'UEP_CADASTRO', 'LINHA_CX_H', 'LINHA_S_CX', 'LINHA_DIAS', 'LINHA_PERIODO', 'VELOCIDADE', 'ENTRE_PECAS', 'MEDIDO_POR', 'REG_ID'];
const linhaCrono = o => CRONO_COLS_NOMES.map(n => (n in o ? o[n] : ''));
const MED_ST = (data, sLac, vol, uep, regId, sRod) => linhaCrono({ REGISTRADO_EM:'26/10/2026 10:19:28', DATA_MEDICAO:data, MODELO:'501059', PRODUTO:'PENTEADEIRA CAMARIM STRASS',
  VOLUME:'VOL 2/2', CODIGOS:'501.059.002 501.059.004 501.059.008', S_RODANDO:sRod == null ? sLac : sRod, S_SEM_LACUNAS:sLac, VOLUMES_MEDIDOS:vol, BASE:'MADERO MEDIDA 20/10/2026', BASE_S:7.9, UEP_CRONO:uep, UEP_CADASTRO:2.29, REG_ID:regId });
const CAD = uep2 => [['CODIGO', 'DESCRICAO', 'COR', 'UEP', 'UEP_VIGENCIA'],
  ['501059001', 'VOL 1/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 2.71, '16/10/2026'],
  ['501059002', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', uep2, '16/10/2026'],
  ['501059004', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'ROSA', uep2, '16/10/2026'],
  ['501059008', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'ALECRIM', uep2, '16/10/2026']];
const PEDIDO = { modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', cods:'501059002:1.78,501059004:1.78,501059008:1.78', regua:'lac' };
const abasST = (regs, uep2) => ({ PRODUTO_CODIGO: CAD(uep2 == null ? 2.29 : uep2), CRONOANALISE: [CRONO_COLS_NOMES].concat(regs || [MED_ST('26/10/2026', 12.4, 52, 1.57, 'c1'), MED_ST('23/10/2026', 11.5, 61, 1.46, 'c2')]) });

// ════════════════════════════════════════════════════════════════════════════
// A TRAVA DA UEP (.gs v5.64). PPCP, 12/11/2026: "colocar um carimbo em cada
// produto que já cumpriu a regra e travar a uep, mas essa trava passa por mim" →
// "eu valido a troca". O código do PPCP vem das Propriedades do script.
const COD = { PPCP_CODIGO: '4321' };
const TRV = Object.assign({}, PEDIDO, { modo:'trocar', codigo:'4321', travaId:'tA', motivo:'2 medições' });
const travar = (P, x) => P.run(`return travarUep(${q(x)});`);
console.log('\n── travarUep: o PPCP troca e TRAVA (a regra deixa) ──');
{
  const P = montar(abasST(), null, '26/10/2026', Object.assign({}, COD));
  const r = travar(P, TRV);
  const C = P.ABAS.PRODUTO_CODIGO;
  ok('travou: 3 códigos, a média pelos segundos SEM AS LACUNAS ÷ 6,7 (1,78), 2 medições e 113 volumes, a regra dizia TROCA, o PPCP trocou',
     [r.ok, r.travado, r.n, r.uep, r.antes, r.uepMedida, r.volumes, r.medicoes, r.regra, r.decisao, r.contraRegra, r.vigencia],
     [true, true, 3, 1.78, 2.29, 1.78, 113, 2, 'TROCA', 'TROCOU', false, '26/10/2026']);
  ok('o cadastro: o VOL 2/2 em 1,78, vigência DIGITADA, e a coluna UEP_TRAVA criada com o carimbo; o VOL 1/2 não é tocado',
     [C[0][5], C.slice(1).map(l => [l[0], l[3], l[4], l[5] || ''])],
     ['UEP_TRAVA', [['501059001', 2.71, '16/10/2026', ''], ['501059002', 1.78, '26/10/2026 DIGITADA', '26/10/2026 PPCP'],
                    ['501059004', 1.78, '26/10/2026 DIGITADA', '26/10/2026 PPCP'], ['501059008', 1.78, '26/10/2026 DIGITADA', '26/10/2026 PPCP']]]);
  const T = P.ABAS.UEP_TRAVAS;
  ok('a UEP_TRAVAS nasce com a linha da trava (os códigos com a UEP de cada um, a regra, a decisão e o motivo)',
     [T[0], T[1].slice(0, 15)],
     [['TRAVA_ID', 'TRAVADA_EM', 'MODELO', 'PRODUTO', 'VOLUME', 'CODIGOS', 'UEP', 'UEP_ANTES', 'UEP_MEDIDA', 'DIFERENCA_PCT', 'REGRA', 'DECISAO', 'MEDICOES', 'VOLUMES', 'MOTIVO', 'DESTRAVADA_EM', 'MOTIVO_DESTRAVA'],
      ['tA', '26/10/2026 15:40:00', '501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', '501059002:1.78 501059004:1.78 501059008:1.78', 1.78, 2.29, 1.78, -22.3, 'TROCA', 'TROCOU', 2, 113, '2 medições']]);
  const V = P.ABAS.UEP_VERSOES;
  ok('a UEP_VERSOES: a semente e uma versão por código, ORIGEM CRONOANÁLISE · … · TRAVA PPCP (a CONFERÊNCIA acha por ela)',
     V.slice(5).map(l => [l[0], l[1], l[3], l[5]]),
     ['501059002', '501059004', '501059008'].map(c => [c, 1.78, 'CRONOANÁLISE · 501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2 · 2 medições, 113 volumes · TRAVA PPCP', 2.29]));
  ok('roda sob o lock, e nenhuma escrita fora dele', [P.locks() > 0, P.semLock()], [true, 0]);
  { const h = T[0], f = n => P.FMT['UEP_TRAVAS|2|' + (h.indexOf(n) + 1)] || '';
    ok('revisão: na UEP_TRAVAS o texto vai como TEXTO (o Sheets leria "501059002:1.78" como duração e um MOTIVO "12/11" como data); os números ficam número',
       [f('CODIGOS'), f('MOTIVO'), f('TRAVADA_EM'), f('MODELO'), f('UEP'), f('MEDICOES'), f('DIFERENCA_PCT')], ['@', '@', '@', '@', '', '', '']); }
  const r2 = travar(P, TRV);
  ok('a retentativa (timeout) com o MESMO travaId devolve a 1ª resposta — nada regravado', [r2.travado, r2.uep, P.ABAS.UEP_VERSOES.length, P.ABAS.UEP_TRAVAS.length], [true, 1.78, 8, 2]);
  const r3 = travar(P, Object.assign({}, TRV, { travaId:'tB' }));
  ok('outro pedido no volume já travado: jaTravada, nada regravado', [r3.travado, r3.jaTravada, P.ABAS.UEP_TRAVAS.length], [true, true, 2]);
  const L = P.run('return lerCatalogoProdutos();').filter(c => /^501059/.test(c.codigo)).map(c => [c.codigo, c.uepTrava]);
  ok('o getProdutos manda o uepTrava de cada código (é por ele que o painel sabe da trava)', L,
     [['501059001', ''], ['501059002', '26/10/2026 PPCP'], ['501059004', '26/10/2026 PPCP'], ['501059008', '26/10/2026 PPCP']]);
  const G = P.run('return getCronoRegistros();');
  ok('o getCronoRegistros manda as travas (a UEP_TRAVAS), com os números como número',
     [G.travas.length, G.travas[0].modelo, G.travas[0].volume, G.travas[0].uep, G.travas[0].antes, G.travas[0].medida, G.travas[0].dif, G.travas[0].decisao, G.travas[0].medicoes, G.travas[0].destravadaEm],
     [1, '501059', 'VOL 2/2', 1.78, 2.29, 1.78, -22.3, 'TROCOU', 2, '']);
  // lacunas no RODANDO até 15% não mudam a UEP: a régua é o SEM AS LACUNAS
  const PL = montar(abasST([MED_ST('26/10/2026', 12.4, 52, 1.9, 'c1', 13.8), MED_ST('23/10/2026', 11.5, 61, 1.8, 'c2', 12.9)]), null, '26/10/2026', Object.assign({}, COD));
  const rl = travar(PL, TRV);
  ok('com lacunas de 10% e 11% no RODANDO, a UEP é a mesma 1,78 — sai do SEM AS LACUNAS', [rl.travado, rl.uep], [true, 1.78]);
}

console.log('\n── travarUep: MANTER e o que fica (o PPCP decide, contra a regra fica registrado) ──');
{
  const P = montar(abasST(), null, '26/10/2026', Object.assign({}, COD));
  const r = travar(P, Object.assign({}, TRV, { modo:'manter', cods:'501059002,501059004,501059008' }));
  ok('a regra dizia TROCA e o PPCP MANTEVE: trava em 2,29, contra a regra, a UEP não muda, nenhuma versão',
     [r.travado, r.decisao, r.contraRegra, r.uep, P.ABAS.PRODUTO_CODIGO[2][3], P.ABAS.PRODUTO_CODIGO[2][5], P.ABAS.UEP_TRAVAS[1][11], 'UEP_VERSOES' in P.ABAS],
     [true, 'MANTEVE', true, 2.29, 2.29, '26/10/2026 PPCP', 'MANTEVE (CONTRA A REGRA)', false]);
  const PF = montar(abasST(null, 1.8), null, '26/10/2026', Object.assign({}, COD));
  const rf = travar(PF, Object.assign({}, TRV, { modo:'manter', cods:'501059002,501059004,501059008' }));
  ok('o cadastro em 1,80 (dentro de 90–110%): a regra diz FICA, o PPCP mantém e trava', [rf.travado, rf.regra, rf.decisao, rf.contraRegra, rf.uep], [true, 'FICA', 'MANTEVE', false, 1.8]);
  const PT = montar(abasST(null, 1.8), null, '26/10/2026', Object.assign({}, COD));
  const rt = travar(PT, TRV);
  ok('a regra diz FICA e o PPCP troca para a média: vale, contra a regra', [rt.travado, rt.regra, rt.decisao, rt.contraRegra, PT.ABAS.PRODUTO_CODIGO[2][3]], [true, 'FICA', 'TROCOU', true, 1.78]);
  const PS = montar(abasST(null, ''), null, '26/10/2026', Object.assign({}, COD));
  const rs = travar(PS, Object.assign({}, TRV, { modo:'manter', cods:'501059002,501059004,501059008' }));
  const rs2 = travar(PS, TRV);
  ok('sem UEP no cadastro: manter é recusado (não há o que manter); trocar vale', [rs.recusado, rs.motivo, rs2.travado, rs2.regra, rs2.antes, PS.ABAS.PRODUTO_CODIGO[2][3]],
     [true, 'sem-cadastro', true, 'TROCA', null, 1.78]);
}

console.log('\n── travarUep: o código do PPCP ──');
{
  const caso = (props, pedido) => { const P = montar(abasST(), null, '26/10/2026', props); const r = travar(P, pedido || TRV);
    return [r.ok, r.travado, r.recusado, r.motivo, P.ABAS.PRODUTO_CODIGO[2][3], P.ABAS.PRODUTO_CODIGO[0].length, 'UEP_TRAVAS' in P.ABAS]; };
  ok('sem a propriedade PPCP_CODIGO: recusa e diz onde configurar — nada gravado', caso({}), [true, false, true, 'codigo-sem-codigo', 2.29, 5, false]);
  ok('código errado: recusa, nada gravado', caso(Object.assign({}, COD), Object.assign({}, TRV, { codigo:'1234' })), [true, false, true, 'codigo-errado', 2.29, 5, false]);
  ok('código com espaço em volta vale (o campo de senha)', caso(Object.assign({}, COD), Object.assign({}, TRV, { codigo:' 4321 ' })).slice(0, 2), [true, true]);
  const P = montar(abasST(), null, '26/10/2026', Object.assign({}, COD));
  const err = [1, 2, 3, 4, 5].map(() => travar(P, Object.assign({}, TRV, { codigo:'0000' })).motivo);
  const certo = travar(P, TRV);
  ok('5 erros seguidos: bloqueia 15 min — até o código certo é recusado', [err, certo.motivo, P.ABAS.PRODUTO_CODIGO[2][3]],
     [['codigo-errado', 'codigo-errado', 'codigo-errado', 'codigo-errado', 'codigo-bloqueado'], 'codigo-bloqueado', 2.29]);
  ok('o código certo zera os erros', (() => { const Q = montar(abasST(), null, '26/10/2026', Object.assign({}, COD));
    travar(Q, Object.assign({}, TRV, { codigo:'x' })); travar(Q, Object.assign({}, TRV, { codigo:'x' }));
    return [travar(Q, TRV).travado, Q.ctx.CacheService.getScriptCache().get('rp_trava_err')]; })(), [true, null]);
  ok('o código não volta na resposta nem vai para a aba', [JSON.stringify(certo).includes('4321'),
     (() => { const Q = montar(abasST(), null, '26/10/2026', Object.assign({}, COD)); travar(Q, TRV); return JSON.stringify(Q.ABAS).includes('4321'); })()], [false, false]);
}

console.log('\n── travarUep: o que NÃO trava (e não grava nada) ──');
{
  const caso = (abas, pedido) => { const P = montar(abas, null, '26/10/2026', Object.assign({}, COD)); const r = travar(P, pedido);
    return [r.ok, r.travado, r.recusado, r.motivo, P.ABAS.PRODUTO_CODIGO[2][3], 'UEP_TRAVAS' in P.ABAS]; };
  ok('uma medição só (61 volumes): falta', caso(abasST([MED_ST('23/10/2026', 11.5, 61, 1.46, 'c2')]), TRV), [true, false, true, 'falta', 2.29, false]);
  ok('duas medições somando 92 volumes: falta', caso(abasST([MED_ST('26/10/2026', 12.4, 52, 1.57, 'c1'), MED_ST('23/10/2026', 11.5, 40, 1.46, 'c2')]), TRV), [true, false, true, 'falta', 2.29, false]);
  ok('uma das duas com 29 volumes não vale: falta', caso(abasST([MED_ST('26/10/2026', 12.4, 29, 1.57, 'c1'), MED_ST('23/10/2026', 11.5, 80, 1.46, 'c2')]), TRV), [true, false, true, 'falta', 2.29, false]);
  ok('uma das duas com lacunas de 15,1% (12,4 de 14,6 s) não vale: falta', caso(abasST([MED_ST('26/10/2026', 12.4, 52, 1.57, 'c1', 14.6), MED_ST('23/10/2026', 11.5, 61, 1.46, 'c2')]), TRV),
     [true, false, true, 'falta', 2.29, false]);
  ok('lacunas de exatamente 15,0% (11,05 de 13 s) ainda valem', caso(abasST([MED_ST('26/10/2026', 11.05, 52, 1.57, 'c1', 13), MED_ST('23/10/2026', 11.5, 61, 1.46, 'c2')]),
     Object.assign({}, TRV, { cods:'501059002:1.69,501059004:1.69,501059008:1.69' })).slice(0, 2), [true, true]);
  ok('medição sem o RODANDO não vale (não dá para medir as lacunas)', caso(abasST([MED_ST('26/10/2026', 12.4, 52, 1.57, 'c1', ''), MED_ST('23/10/2026', 11.5, 61, 1.46, 'c2')]), TRV),
     [true, false, true, 'falta', 2.29, false]);
  ok('a UEP enviada não bate com a média das medições (a tela estava velha)', caso(abasST(), Object.assign({}, TRV, { cods:'501059002:1.70,501059004:1.70,501059008:1.70' })),
     [true, false, true, 'nao-bate', 2.29, false]);
  ok('código que não está nas medições (o VOL 1/2)', caso(abasST(), Object.assign({}, TRV, { cods:'501059001:1.51' })), [true, false, true, 'codigo-fora', 2.29, false]);
  ok('código de outro modelo', caso(abasST(), Object.assign({}, TRV, { cods:'501149001:1.51' })), [true, false, true, 'outro-modelo', 2.29, false]);
  ok('sem medição registrada do volume', caso(abasST([]), TRV), [true, false, true, 'falta', 2.29, false]);
  ok('o JOGO não trava (a UEP é por volume)', caso(abasST(), Object.assign({}, TRV, { volume:'JOGO 2 VOL' })), [true, false, true, 'jogo', 2.29, false]);
  ok('a base (MADERO) não trava', caso(abasST(), Object.assign({}, TRV, { modelo:'501149', produto:'MESA CABECEIRA MADERO', volume:'VOL 1/1', cods:'501149001:1' })),
     [true, false, true, 'base', 2.29, false]);
  ok('sem produto ou sem a decisão: erro dito (não é recusa da regra)',
     [caso(abasST(), { cods:'501059002:1.51', modo:'trocar', codigo:'4321' }).slice(0, 2), caso(abasST(), Object.assign({}, TRV, { modo:'' })).slice(0, 2)], [[false, undefined], [false, undefined]]);
  const P = montar(abasST(), null, '26/10/2026', Object.assign({}, COD));
  P.ABAS.PRODUTO_CODIGO[0].push('UEP_TRAVA'); P.ABAS.PRODUTO_CODIGO[2][5] = '20/10/2026 PPCP';
  ok('parte dos códigos já travada (à mão): recusa — destrave antes', [travar(P, TRV).motivo, P.ABAS.PRODUTO_CODIGO[3][3]], ['parcial', 2.29]);
}

console.log('\n── trocarUepCrono (v5.64): a troca sem o PPCP acabou ──');
{
  const P = montar(abasST(), null, '26/10/2026', Object.assign({}, COD));
  const r = P.run(`return trocarUepCrono(${q(PEDIDO)});`);
  ok('sempre recusa (o painel antigo em cache ainda pode chamar) e não grava nada', [r.ok, r.trocado, r.recusado, r.motivo, r.regua, P.ABAS.PRODUTO_CODIGO[2][3], 'UEP_VERSOES' in P.ABAS],
     [true, false, true, 'use-trava', 'lac', 2.29, false]);
}

console.log('\n── destravarUep: o código e o MOTIVO ──');
{
  const P = montar(abasST(), null, '26/10/2026', Object.assign({}, COD));
  travar(P, TRV);
  const DT = { modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', cods:'501059002,501059004,501059008', codigo:'4321', motivo:'mudou a embalagem' };
  const d = s => P.run(`return destravarUep(${q(s)});`);
  ok('sem motivo e com código errado: recusa, a trava fica',
     [d(Object.assign({}, DT, { motivo:'' })).motivo, d(Object.assign({}, DT, { codigo:'1' })).motivo, P.ABAS.PRODUTO_CODIGO[2][5]], ['sem-motivo', 'codigo-errado', '26/10/2026 PPCP']);
  const r = d(DT);
  ok('destravado: a UEP_TRAVA limpa, a linha da trava com DESTRAVADA_EM e o motivo — a UEP não muda',
     [r.destravado, r.n, P.ABAS.PRODUTO_CODIGO.slice(2).map(l => l[5]), P.ABAS.PRODUTO_CODIGO[2][3], P.ABAS.UEP_TRAVAS[1][15], P.ABAS.UEP_TRAVAS[1][16]],
     [true, 3, ['', '', ''], 1.78, '26/10/2026 15:40:00', 'mudou a embalagem']);
  ok('de novo: jaDestravada', d(DT).jaDestravada, true);
  ok('o DESTRAVADA_EM e o motivo vão como texto', [P.FMT['UEP_TRAVAS|2|16'], P.FMT['UEP_TRAVAS|2|17']], ['@', '@']);
  ok('destravado, a regra volta a valer: trava de novo (outra linha na UEP_TRAVAS)', [travar(P, Object.assign({}, TRV, { travaId:'tC', modo:'manter', cods:'501059002,501059004,501059008' })).travado,
     P.ABAS.UEP_TRAVAS.length], [true, 3]);
}

console.log('\n── travado, o GRAVAR UEP não toca e a digitação de UMA célula é desfeita ──');
{
  const P = montar(abasST(), null, '26/10/2026', Object.assign({}, COD));
  travar(P, TRV);
  const g = P.run(`return setUepCatalogo({ dados:${q(JSON.stringify([['501059', 'PENTEADEIRA CAMARIM STRASS', 2.5]]))}, substituir:'1' });`);
  ok('setUepCatalogo: os 3 códigos travados ficam (1,78), o VOL 1/2 (não travado) troca', [g.travados, P.ABAS.PRODUTO_CODIGO.slice(1).map(l => l[3]), P.ABAS.UEP_VERSOES.length], [3, [2.5, 1.78, 1.78, 1.78], 9]);
  // a estimativa (estimar=1) re-estima as EST: travar MANTENDO uma UEP estimada não muda a vigência — é a coluna que segura
  const PE = montar({ PRODUTO_CODIGO: [['CODIGO', 'DESCRICAO', 'COR', 'UEP', 'UEP_VIGENCIA', 'MEDIDA DA CAIXA (mm)', 'VELOCIDADE (m/min)', 'ENTRE_PECAS (mm)', 'UEP_TRAVA'],
    ['501700001', 'VOL 1/1 MESA TESTE', 'BRANCO', 1.5, '16/10/2026 EST', 800, 9, 250, '12/11/2026 PPCP'],
    ['501700002', 'VOL 1/1 MESA TESTE', 'PRETO', 1.5, '16/10/2026 EST', 800, 9, 250, '']] }, null, '12/11/2026', Object.assign({}, COD));
  const ge = PE.run(`return setUepCatalogo({ estimar:'1', k:'300', tetoAnc:'300' });`);
  ok('a estimativa (estimar=1) pula o código travado de verdade: a UEP estimada travada fica, a outra é re-estimada',
     [ge.ok, PE.ABAS.PRODUTO_CODIGO[1][3], PE.ABAS.PRODUTO_CODIGO[1][4], PE.ABAS.PRODUTO_CODIGO[2][3] !== 1.5, /EST$/.test(PE.ABAS.PRODUTO_CODIGO[2][4])], [true, 1.5, '16/10/2026 EST', true, true]);
  // a edição de uma célula, como o Sheets manda ao onEdit
  const SH = P.ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PRODUTO_CODIGO'), notas = {};
  const editar = (l, c, novo, velho) => {
    SH.getRange(l, c).setValue(novo);
    const rg = { getSheet: () => SH, getRow: () => l, getColumn: () => c, getNumRows: () => 1, getNumColumns: () => 1,
      getValue: () => SH.getRange(l, c).getValues()[0][0], setValue: x => SH.getRange(l, c).setValue(x), setNote: x => { notas[l + ',' + c] = x; } };
    P.ctx.onEdit({ range: rg, oldValue: velho, value: String(novo) });
  };
  editar(3, 4, 2.4, '1.78');
  ok('digitou 2,4 na UEP de um código travado: volta a 1,78 (o valor da trava) com uma nota; nenhuma versão DIGITADA nova',
     [P.ABAS.PRODUTO_CODIGO[2][3], /travada pelo PPCP/.test(notas['3,4'] || ''), P.ABAS.UEP_VERSOES.length], [1.78, true, 9]);
  editar(3, 6, '', '26/10/2026 PPCP');
  ok('apagou a UEP_TRAVA de um código: o carimbo volta', P.ABAS.PRODUTO_CODIGO[2][5], '26/10/2026 PPCP');
  editar(2, 4, 2.6, '2.5');
  ok('o código NÃO travado segue a regra de sempre: fica, e vira versão DIGITADA', [P.ABAS.PRODUTO_CODIGO[1][3], P.ABAS.UEP_VERSOES.length, P.ABAS.UEP_VERSOES[9][3]], [2.6, 10, 'DIGITADA']);
  editar(4, 4, 1.9, '1.78');
  delete P.ABAS.UEP_TRAVAS;                     // sem o registro da trava, não há para onde voltar: fica (o painel acusa a diferença)
  editar(5, 4, 1.95, '1.78');
  ok('sem a UEP_TRAVAS, a digitação no código travado fica (o painel diz UEP MUDOU NA PLANILHA)', [P.ABAS.PRODUTO_CODIGO[3][3], P.ABAS.PRODUTO_CODIGO[4][3]], [1.78, 1.95]);
}

console.log('\n── getConferenciaCrono: a produção DEPOIS da troca, só o volume na linha ──');
{
  const P = montar(abasST(), null, '18/10/2026', Object.assign({}, COD));
  travar(P, TRV);                                                     // trocou e travou em 18/10
  P.ABAS.PRODUCAO_PRODUTO = [['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS', 'PONTOS', 'PESO_KG', 'OPERADOR'],
    ['18/10/2026', '15:00', '501059002', 'VOL 2/2', 90, 0, 0, 'Mobile'],     // o dia da troca: fora
    ['19/10/2026', '09:00', '501059002', 'VOL 2/2', 100, 0, 0, 'Mobile'],
    ['19/10/2026', '10:00', '501059002', 'VOL 2/2', 80, 0, 0, 'Mobile'], ['19/10/2026', '10:00', '501059004', 'VOL 2/2', 70, 0, 0, 'Mobile'],   // duas cores do volume: conta
    ['19/10/2026', '12:12', '501059008', 'VOL 2/2', 40, 0, 0, 'Mobile'], ['19/10/2026', '12:12', '501059001', 'VOL 1/2', 30, 0, 0, 'Mobile'],   // com o VOL 1/2: fora
    ['20/10/2026', '12:12', '501059004', 'VOL 2/2', 120, 0, 0, 'Mobile'],    // slot de 48 min
    ['21/10/2026', '07:00', '501059004', 'VOL 2/2', 150, 0, 0, 'Mobile']];   // hoje: fora
  const P2 = montar(P.ABAS, null, '21/10/2026');
  const r = P2.run('return getConferenciaCrono();');
  const t = r.trocas[0];
  ok('uma troca, achada pela ORIGEM da UEP_VERSOES (a semente não é troca)', [r.ok, r.trocas.length, t.modelo, t.produto, t.volume, t.vig, t.amostra, t.substituida],
     [true, 1, '501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', '18/10/2026', '2 medições, 113 volumes · TRAVA PPCP', false]);
  ok('v5.36: a conferência não lê mais o log — as horas depois da troca são contadas no painel, pelo getHorasCrono (com as paradas)',
     [t.dias, /SHEET_PROD_LOG/.test(GS.slice(GS.indexOf('function getConferenciaCrono('), GS.indexOf('HORAS DA LINHA POR CÓDIGO (v5.35)')))], [undefined, false]);
  ok('os códigos com a UEP nova, a anterior e a de agora', t.codigos.map(c => [c.cod, c.uep, c.antes, c.atual]),
     [['501059002', 1.78, 2.29, 1.78], ['501059004', 1.78, 2.29, 1.78], ['501059008', 1.78, 2.29, 1.78]]);
  P2.ABAS.PRODUTO_CODIGO[3][3] = 1.6;                                   // alguém digitou outro número no 501059004
  ok('a UEP do cadastro mudou depois: SUBSTITUÍDA', montar(P2.ABAS, null, '21/10/2026').run('return getConferenciaCrono();').trocas[0].substituida, true);
  ok('sem a UEP_VERSOES (nenhuma troca ainda): lista vazia, não erro', montar(abasST(), null, '21/10/2026').run('return getConferenciaCrono();'), { ok:true, trocas:[] });
  ok('a ORIGEM vai e volta pela mesma regra', montar().run(`return _cronoOrigemLer(_cronoOrigem('501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', 1, 52));`),
     { modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', amostra:'1 medição, 52 volumes' });
}
console.log('\n── getHorasCrono (v5.35/v5.36): o log da janela hora a hora, código por código, com as paradas ──');
{
  const H = montar({ PARADAS: [['DATA', 'ID', 'TIPO', 'INICIO', 'FIM', 'DURACAO_MIN', 'OBS', 'DURACAO_SEG'],
    ['19/10/2026', 'p1', 'Troca de Plastico', '09:10', '09:14:30', 4.5, '', 270],      // dentro das 09:00
    ['19/10/2026', 'p2', 'Troca de produto', '09:55', '10:05', 10, '', 600],          // atravessa 09 → 10 h: 5 + 5
    ['19/10/2026', 'p3', 'Troca de Plastico', '10:20', '10:23', 3, '', 180],
    ['19/10/2026', 'p4', 'Robo', '10:40', '', '', '', ''],                            // sem FIM: fora
    ['19/10/2026', 'p5', '', '12:50', '13:10', 20, '', 1200],                         // 12:12 vai até 13:00: 10 min, sem tipo
    ['18/10/2026', 'p6', 'Limpeza', '09:00', '09:30', 30, '', 1800]],                 // fora da janela
    PRODUCAO_PRODUTO: [['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS', 'PONTOS', 'PESO_KG', 'OPERADOR'],
    ['18/10/2026', '15:00', '501059002', 'VOL 2/2', 90, 0, 0, 'Mobile'],     // antes da janela: fora
    ['19/10/2026', '09:00', '501059002', 'VOL 2/2', 100, 0, 0, 'Mobile'],
    ['19/10/2026', '10:00', '501059002', 'VOL 2/2', 80, 0, 0, 'Mobile'], ['19/10/2026', '10:00', '501.059.004', 'VOL 2/2', 70, 0, 0, 'Mobile'],
    ['19/10/2026', '10:00', '501059002', 'VOL 2/2', 5, 0, 0, 'Mobile'],      // o mesmo código duas vezes na hora: soma
    ['19/10/2026', '12:12', '501059008', 'VOL 2/2', 40, 0, 0, 'Mobile'], ['19/10/2026', '12:12', '501059001', 'VOL 1/2', 30, 0, 0, 'Mobile'],
    ['19/10/2026', '', '501059002', 'VOL 2/2', 33, 0, 0, 'Mobile'],          // sem hora: fora
    ['20/10/2026', '12:12', '501059004', 'VOL 2/2', 120, 0, 0, 'Mobile'],
    ['21/10/2026', '07:00', '501059004', 'VOL 2/2', 150, 0, 0, 'Mobile']] }, null, '21/10/2026');   // hoje: fora
  const r = H.run(`return getHorasCrono({ de:'19/10/2026', ate:'21/10/2026' });`);
  ok('as horas da janela (hoje fora, sem hora fora), com os minutos do slot e as caixas de cada código (código com ponto vira dígitos)',
     [r.ok, r.de, r.ate, r.horas.map(h => [h.data, h.hora, h.min, h.cods])],
     [true, '19/10/2026', '21/10/2026', [['19/10/2026', '09:00', 60, { 501059002:100 }], ['19/10/2026', '10:00', 60, { 501059002:85, 501059004:70 }],
       ['19/10/2026', '12:12', 48, { 501059008:40, 501059001:30 }], ['20/10/2026', '12:12', 48, { 501059004:120 }]]]);
  ok('v5.36: as paradas apontadas dentro de cada hora, em minutos por TIPO (a que atravessa a hora divide; sem FIM fica fora; toda hora tem par)',
     r.horas.map(h => [h.data, h.hora, h.par]),
     [['19/10/2026', '09:00', { 'Troca de Plastico':4.5, 'Troca de produto':5 }], ['19/10/2026', '10:00', { 'Troca de produto':5, 'Troca de Plastico':3 }],
      ['19/10/2026', '12:12', { 'sem tipo':10 }], ['20/10/2026', '12:12', {}]]);
  ok('período inválido ou ao contrário: erro dito, nada lido',
     [H.run(`return getHorasCrono({ de:'', ate:'21/10/2026' });`).ok, H.run(`return getHorasCrono({ de:'21/10/2026', ate:'19/10/2026' });`).ok], [false, false]);
  ok('o getHorasCrono lê só a janela do log e das PARADAS (_valoresPorData, a mesma conversão no recorte e no filtro)',
     [(GS.match(/_cronoHorasDoLog\(/g) || []).length, /function getHorasCrono[\s\S]*?_valoresPorData\(sh, 'DATA'/.test(GS),
      /function _cronoParadasNasHoras[\s\S]*?_valoresPorData\(sh, 'DATA', 0, conv, deNum, ateNum\)[\s\S]*?dn = conv\(r\[iD\]\)/.test(GS)], [2, true, true]);
  ok('no doGet, com cache de leitura (a chave leva de/ate)',
     [/act === 'getHorasCrono'\)\s*result = getHorasCrono\(p\)/.test(GS), /getHorasCrono: 300/.test(GS)], [true, true]);
}
// ════════════════════════════════════════════════════════════════════════════
// v5.58 — A MEDIÇÃO QUE VEM DO APP DE CRONOANÁLISE (PPCP, 06/11/2026: "b2").
// O app manda o rótulo da lista e o que mediu; o resto sai do cadastro, pela
// régua do painel. A mesma medição não duplica entre o app e o PDF.
console.log('\n── v5.58: a medição do app ──');
{
  const HTML = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
  const pegaH = sig => { const i = HTML.indexOf(sig); if (i < 0) throw new Error('sem ' + sig); let d = 0; for (let k = HTML.indexOf('{', HTML.indexOf(')', i)); k < HTML.length; k++) { if (HTML[k] === '{') d++; else if (HTML[k] === '}' && --d === 0) return HTML.slice(i, k + 1); } };
  const cst = n => { const m = new RegExp('const ' + n + '\\s*=\\s*([^;]+);').exec(HTML); return m && m[1].replace(/\/\/.*$/, '').trim(); };
  const CAT = { PRODUTO_CODIGO: [['CODIGO', 'DESCRICAO', 'COR', 'UEP', 'VELOCIDADE (m/min)', 'ENTRE_PECAS (mm)'],
    ['501059001', 'VOL 1/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 1.46, 9, 650], ['501059002', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 1.78, 9, 650],
    ['501059003', 'VOL 1/2 PENTEADEIRA CAMARIM STRASS', 'ROSA', 1.46, 9, 650], ['501059004', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'ROSA', 1.82, 9, 650],
    ['501149001', 'VOL 1/1 MESA CABECEIRA MADERO', 'BRANCO', 1, 9, 250], ['501160001', 'VOL 1/2 BERCO ALGODAO DOCE', 'BRANCO', '', 9, 650]] };
  const APP = { origem: 'app', regId: 'app-0f8c2a71-5b1e-4c3d-9a6f-2e7d1b4c8a90', rotulo: '501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2',
    data: '04/11/2026', sRod: '20.4', sLac: '16.6', sPer: '24.9', volumes: '60' };
  const P = montar(CAT, null, '06/11/2026');
  const r1 = P.run(`return registrarCrono(${q(APP)});`);
  const H = P.ABAS.CRONOANALISE[0], L = P.ABAS.CRONOANALISE[1], col = n => L[H.indexOf(n)];
  ok('grava, com app:true (o app sabe que o .gs aceita) e a ORIGEM APP',
     [r1.ok, r1.app, r1.registrado, r1.duplicado, col('ORIGEM'), col('REG_ID')], [true, true, true, undefined, 'APP', APP.regId]);
  ok('o resto sai do cadastro, pela régua do painel: produto sem o VOL, o volume, TODOS os códigos do volume (as cores), a UEP do volume (média das cores)',
     [col('MODELO'), col('PRODUTO'), col('VOLUME'), col('CODIGOS'), col('UEP_CADASTRO'), col('VELOCIDADE'), col('ENTRE_PECAS')],
     ['501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', '501.059.002 501.059.004', 1.8, 9, 650]);
  ok('a base é a MADERO sem as lacunas; UEP_CRONO = sem as lacunas ÷ 6,7; tolerância e tempo padrão vazios (são do painel de cada computador)',
     [col('BASE'), col('BASE_S'), col('UEP_CRONO'), col('TOLERANCIA_PCT'), col('TEMPO_PADRAO_S'), col('S_RODANDO'), col('S_SEM_LACUNAS'), col('S_PERIODO'), col('VOLUMES_MEDIDOS'), col('DATA_MEDICAO')],
     ['MADERO SEM LACUNAS 20/10/2026', 6.7, 2.48, '', '', 20.4, 16.6, 24.9, 60, '04/11/2026']);
  const r2 = P.run(`return registrarCrono(${q(APP)});`);
  ok('a retentativa do app (o mesmo REG_ID) não duplica e diz que já estava', [r2.ok, r2.app, r2.duplicado, P.ABAS.CRONOANALISE.length], [true, true, true, 2]);
  // o PDF da MESMA medição importado depois no painel (o REG_ID do painel sai do conteúdo e do MEDIDO POR)
  const PDF = Object.assign({}, MED, { regId: 'cPDF123', data: '04/11/2026', modelo: '501059', produto: 'PENTEADEIRA CAMARIM STRASS', volume: 'VOL 2/2',
    sRod: '20.4', sLac: '16.6', sPer: '24.9', volumes: '60', quem: 'PPCP' });
  const r3 = P.run(`return registrarCrono(${q(PDF)});`);
  ok('o PDF da mesma medição importado no painel não duplica (mesmaMedicao), e a resposta do painel não leva app',
     [r3.ok, r3.duplicado, r3.mesmaMedicao, r3.linha, r3.app, P.ABAS.CRONOANALISE.length], [true, true, true, 2, undefined, 2]);
  // e o contrário: primeiro o PDF, depois o app
  const P2 = montar(CAT, null, '06/11/2026');
  P2.run(`return registrarCrono(${q(PDF)});`);
  const r4 = P2.run(`return registrarCrono(${q(APP)});`);
  ok('e o contrário: o PDF primeiro, o app depois — o app ouve "já estava"', [r4.ok, r4.app, r4.duplicado, r4.mesmaMedicao, P2.ABAS.CRONOANALISE.length], [true, true, true, true, 2]);
  const r5 = P2.run(`return registrarCrono(${q(Object.assign({}, APP, { regId: 'app-outra', sLac: '16.8', sRod: '20.6' }))});`);
  ok('outra medição do mesmo volume no mesmo dia (tempos diferentes) entra', [r5.registrado, r5.duplicado, P2.ABAS.CRONOANALISE.length], [true, undefined, 3]);
  // v5.59 — duas medições DIFERENTES do app (REG_IDs app- diferentes) com os mesmos
  // números: a 2ª sumia calada ("já estava"). Agora o app só casa com o PDF pelo conteúdo.
  { const P4 = montar(CAT, null, '06/11/2026');
    const a1 = P4.run(`return registrarCrono(${q(APP)});`);
    const a2 = P4.run(`return registrarCrono(${q(Object.assign({}, APP, { regId: 'app-segunda-medicao' }))});`);
    ok('v5.59: duas medições do app com os mesmos números e REG_IDs diferentes são duas linhas',
       [a1.registrado, a2.registrado, a2.duplicado, a2.mesmaMedicao, P4.ABAS.CRONOANALISE.length], [true, true, undefined, undefined, 3]);
    const pdf = P4.run(`return registrarCrono(${q(PDF)});`);
    ok('v5.59: o PDF dessa medição continua reconhecido como a mesma (não vira 3ª linha)',
       [pdf.duplicado, pdf.mesmaMedicao, P4.ABAS.CRONOANALISE.length], [true, true, 3]);
    const P5 = montar(CAT, null, '06/11/2026');
    P5.run(`return registrarCrono(${q(PDF)});`);
    const b = P5.run(`return registrarCrono(${q(APP)});`);
    ok('v5.59: o app depois do PDF continua "já estava" (só APP com APP deixou de casar)',
       [b.duplicado, b.mesmaMedicao, P5.ABAS.CRONOANALISE.length], [true, true, 2]);
    ok('v5.59: o comentário do _registrarCronoCore não diz mais que parada marcada muda os tempos',
       /marcada uma parada e salva de novo, a MESMA medição volta com\s*\/\/ outros tempos/.test(GS), false);
  }
  // o JOGO e o produto de um volume
  const P3 = montar(CAT, null, '06/11/2026');
  P3.run(`return registrarCrono(${q(Object.assign({}, APP, { regId: 'app-j', rotulo: '501059 · PENTEADEIRA CAMARIM STRASS' }))});`);
  P3.run(`return registrarCrono(${q(Object.assign({}, APP, { regId: 'app-m', rotulo: '501149 · MESA CABECEIRA MADERO', sRod: '7.9', sLac: '6.7', sPer: '' }))});`);
  const H3 = P3.ABAS.CRONOANALISE[0], c3 = (i, n) => P3.ABAS.CRONOANALISE[i][H3.indexOf(n)];
  ok('o JOGO: "JOGO 2 VOL", os 4 códigos e a UEP = a soma das médias dos volumes ÷ 2; produto de um volume: "VOL 1/1"',
     [c3(1, 'VOLUME'), c3(1, 'CODIGOS'), c3(1, 'UEP_CADASTRO'), c3(2, 'VOLUME'), c3(2, 'CODIGOS'), c3(2, 'UEP_CADASTRO'), c3(2, 'UEP_CRONO'), c3(2, 'S_PERIODO')],
     ['JOGO 2 VOL', '501.059.001 501.059.002 501.059.003 501.059.004', 1.63, 'VOL 1/1', '501.149.001', 1, 1, '']);
  // as recusas: ok:true (o app não retenta), recusado, o motivo, e nada gravado
  const rec = o => { const PX = montar(CAT, null, '06/11/2026'); const r = PX.run(`return registrarCrono(${q(Object.assign({}, APP, o))});`); return [r.ok, r.app, r.registrado, r.recusado, !!(PX.ABAS.CRONOANALISE && PX.ABAS.CRONOANALISE.length > 1), r.erro]; };
  const R = [rec({ rotulo: 'Penteadeira strass - caixa 2/2' }), rec({ rotulo: '501999 · PRODUTO QUE NAO EXISTE' }), rec({ rotulo: '501059 · PENTEADEIRA CAMARIM STRASS · VOL 3/3' }),
    rec({ data: '2026-11-04' }), rec({ volumes: '60.5' }), rec({ sRod: '15.0' }), rec({ sLac: '130' })];
  ok('recusa com o motivo (formato, fora do cadastro, volume que não existe, data, volumes, rodando < sem as lacunas, tempo absurdo) e não grava nada',
     R.map(x => x.slice(0, 5)), R.map(() => [true, true, false, true, false]));
  ok('os motivos dizem o que corrigir', [/formato da lista/.test(R[0][5]), /não está no cadastro do painel/.test(R[1][5]), /tem 2 volume/.test(R[2][5]),
     /dd\/mm\/aaaa/.test(R[3][5]), /inteiro/.test(R[4][5]), /não fecha/.test(R[5][5]), /não parece certo/.test(R[6][5])], [true, true, true, true, true, true, true]);
  const P4 = montar(CAT, null, '06/11/2026');
  P4.run(`return registrarCrono(${q(Object.assign({}, APP, { regId: 'app-p', sPer: '15.1' }))});`);
  P4.run(`return registrarCrono(${q(Object.assign({}, APP, { regId: 'app-q', rotulo: '501160 · BERCO ALGODAO DOCE · VOL 1/2' }))});`);
  const H4 = P4.ABAS.CRONOANALISE[0];
  ok('NO PERÍODO fora da régua fica vazio (só informa; não recusa a medição); volume sem UEP no cadastro: UEP_CADASTRO vazia, nunca 0',
     [P4.ABAS.CRONOANALISE[1][H4.indexOf('S_PERIODO')], P4.ABAS.CRONOANALISE[2][H4.indexOf('UEP_CADASTRO')], P4.ABAS.CRONOANALISE.length], ['', '', 3]);
  const lido = P.run(`return getCronoRegistros();`).registros[0];
  ok('a leitura devolve a ORIGEM', [lido.origem, lido.produto, lido.volume], ['APP', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2']);
  // as réguas do painel (o mesmo nome, o mesmo volume, a mesma base, os mesmos limites)
  const ctxH = {}; vm.createContext(ctxH);
  vm.runInContext(pegaH('function _capVol(') + pegaH('function _capNome(') + 'const UEP_BASE=' + cst('UEP_BASE') + ';const UEP_BASE_MEDIDA=' + cst('UEP_BASE_MEDIDA') + ';' + pegaH('function _uepBaseCurto('), ctxH);
  const DESCS = [['VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'ROSA'], ['  vol. 1 / 3  home  ripado antares 1.8', ''], ['RACK BRITO 137 CM MARSALA', 'MARSALA'], ['MESA CENTRO LUNA 670', 'CUMARU'], ['VOL 1/1 MESA CABECEIRA MADERO', '']];
  const G = montar(CAT);
  ok('_cronoNomeCad e _cronoVolCad = o _capNome e o _capVol do painel, nas mesmas descrições',
     DESCS.map(([d, c]) => [G.run(`return _cronoNomeCad(${q(d)}, ${q(c)});`), G.run(`return _cronoVolCad(${q(d)});`)]),
     DESCS.map(([d, c]) => [vm.runInContext(`_capNome(${q(d)}, ${q(c)})`, ctxH), JSON.parse(JSON.stringify(vm.runInContext(`_capVol(${q(d)})`, ctxH)))]));
  ok('a BASE e o BASE_S = o que o 💾 REGISTRAR do painel grava; os limites = os do _ucvRegValida',
     [G.run('return CRONO_BASE_ROT_GS;'), G.run('return CRONO_BASE_S_GS;'), G.run('return [CRONO_APP_SEG_MAX, CRONO_APP_ROD_MAX, CRONO_APP_PER_MAX];')],
     [vm.runInContext('`${_uepBaseCurto()} SEM LACUNAS ${UEP_BASE_MEDIDA.data}`', ctxH), vm.runInContext('UEP_BASE_MEDIDA.seg', ctxH), [Number(cst('UCV_REG_SEG_MAX')), Number(cst('UCV_REG_ROD_MAX')), Number(cst('UCV_REG_PER_MAX'))]]);
  ok('o painel grava a BASE com o mesmo texto (a conta da paridade é a do _ucvRegMontar)', /\$\{_uepBaseCurto\(\)\} SEM LACUNAS \$\{UEP_BASE_MEDIDA\.data\}/.test(pegaH('function _ucvRegMontar(')), true);
  // o lock que não vem: o app ouve app:true e pode reenviar
  // revisão da v5.58: a MESMA medição do app reenviada com outros números (reabriu a análise,
  // marcou uma parada, salvou de novo) SUBSTITUI a linha, com a antiga na CRONO_EXCLUIDOS
  const P6 = montar(CAT, null, '06/11/2026');
  P6.run(`return registrarCrono(${q(APP)});`);
  P6.ABAS.CRONOANALISE[0].push('NOTA DO PPCP'); P6.ABAS.CRONOANALISE[1].push('conferir a cor');
  const rS = P6.run(`return registrarCrono(${q(Object.assign({}, APP, { sRod: '19.8', sLac: '16.2', sPer: '22.1' }))});`);
  const H6 = P6.ABAS.CRONOANALISE[0], L6 = P6.ABAS.CRONOANALISE[1], X6 = P6.ABAS.CRONO_EXCLUIDOS || [];
  ok('o mesmo REG_ID do app com outros números: substitui no lugar (uma linha só), a antiga vai para a CRONO_EXCLUIDOS, a coluna que o PPCP pôs fica',
     [rS.ok, rS.app, rS.registrado, rS.substituido, rS.linha, P6.ABAS.CRONOANALISE.length, L6[H6.indexOf('S_SEM_LACUNAS')], L6[H6.indexOf('S_PERIODO')], L6[H6.indexOf('NOTA DO PPCP')],
      X6.length, X6[1] && X6[1][X6[0].indexOf('S_SEM_LACUNAS')], X6[1] && X6[1][X6[0].indexOf('REG_ID')], X6[1] && X6[1][X6[0].indexOf('LINHA_ORIGINAL')]],
     [true, true, true, true, 2, 2, 16.2, 22.1, 'conferir a cor', 2, 16.6, APP.regId, 2]);
  const rS2 = P6.run(`return registrarCrono(${q(Object.assign({}, APP, { sRod: '19.8', sLac: '16.2', sPer: '22.1' }))});`);
  const rS3 = P6.run(`return registrarCrono(${q(Object.assign({}, APP, { sRod: '19.8', sLac: '16.2', sPer: '' }))});`);
  ok('reenviada igual: "já estava" (sem nova cópia); só o NO PERÍODO mudou: também substitui (a linha inteira é comparada)',
     [rS2.duplicado, rS2.substituido, rS3.substituido, (P6.ABAS.CRONO_EXCLUIDOS || []).length, P6.ABAS.CRONOANALISE.length], [true, undefined, true, 3, 2]);
  const PDF2 = Object.assign({}, PDF, { regId: 'cPDF999' });
  const P7 = montar(CAT, null, '06/11/2026');
  P7.run(`return registrarCrono(${q(PDF2)});`);
  const rP = P7.run(`return registrarCrono(${q(Object.assign({}, PDF2, { sLac: '16.0' }))});`);
  ok('o caminho do painel não substitui: o REG_ID dele sai do conteúdo — o mesmo REG_ID é a mesma medição', [rP.duplicado, rP.substituido, P7.ABAS.CRONOANALISE.length], [true, undefined, 2]);
  // revisão da v5.58: a falha da planilha no caminho do app volta com app:true (o app reenvia, não acusa o .gs antigo)
  const P8 = montar(CAT);
  P8.ctx.lerCatalogoProdutos = () => { throw new Error('Serviço Planilhas indisponível'); };
  const rE = P8.run(`return registrarCrono(${q(APP)});`);
  let rEp; try { rEp = P8.run(`return registrarCrono(${q(Object.assign({}, MED, { regId: 'cX' }))});`); } catch (e) { rEp = 'lançou'; }
  ok('a falha da planilha no caminho do app: ok:false com app:true e o motivo; no caminho do painel nada muda (ele não lê o cadastro)',
     [rE.ok, rE.app, /indisponível/.test(rE.erro), rEp && rEp.registrado], [false, true, true, true]);
  const P5 = montar(CAT);
  P5.ctx.LockService.getScriptLock = () => ({ waitLock: () => { throw new Error('timeout'); }, releaseLock: () => {} });
  const rL = P5.run(`return registrarCrono(${q(APP)});`), rLp = P5.run(`return registrarCrono(${q(MED)});`);
  ok('a planilha ocupada (o lock não vem): o app ouve ok:false com app:true (pode reenviar); o painel, o erro de sempre, sem app',
     [rL.ok, rL.app, /ocupada/.test(rL.erro), rLp.ok, rLp.app, !!(P5.ABAS.CRONOANALISE)], [false, true, true, false, undefined, false]);
}
ok('a trava, a destrava e a conferência estão no doGet; travar e destravar invalidam o cadastro e as medições',
   [/act === 'travarUep'\)\s*result = travarUep\(p\)/.test(GS), /act === 'destravarUep'\)\s*result = destravarUep\(p\)/.test(GS),
    /act === 'getConferenciaCrono'\)\s*result = getConferenciaCrono\(\)/.test(GS),
    /ACOES_ESCRITA = \[[^\]]*'travarUep', 'destravarUep'/.test(GS), /travarUep: \['cat', 'crono'\], destravarUep: \['cat', 'crono'\]/.test(GS)], [true, true, true, true, true]);

// ════════════════════════════════════════════════════════════════════════════
// v5.62 — O TEMPO-ALVO DE CADA PRODUTO (getTemposAlvo), para o app de
// cronoanálise. PPCP, 11/11/2026: "isso que quis dizer: tempo-alvo de cada
// produto" → a cor do tablet segue o alvo.
// v5.65 — PELA ESTEIRA. PPCP, 12/11/2026, com o RACK MOVE 1.6 (alvo 32,3 s pela
// UEP, 18,2 s medido sem as lacunas): "tempo alvo está equivocado" → "hoje temos
// tamanho da caixa, velocidade da esteira" → "85 ok".
//   esteira = (medida + entre-peças) ÷ velocidade · alvo = esteira ÷ 85%
console.log('\n── v5.62/v5.65: o tempo-alvo de cada produto, pela esteira ──');
{
  const HTML = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
  // linhas reais da PRODUTO_CODIGO de 12/11/2026 (medida, 9 m/min, 400 mm); o
  // BERÇO 1/2 sem medida e COM UEP: sem alvo mesmo assim (nunca a UEP no lugar)
  const HDR = ['CODIGO', 'DESCRICAO', 'COR', 'MEDIDA DA CAIXA', 'VELOCIDADE', 'ENTRE_PECAS (mm)', 'UEP'];
  const CAT = { PRODUTO_CODIGO: [HDR,
    ['501059001', 'VOL 1/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 1705, 9, 400, 1.46], ['501059002', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 1344, 9, 400, 1.78],
    ['501059003', 'VOL 1/2 PENTEADEIRA CAMARIM STRASS', 'ROSA', 1705, 9, 400, 1.46], ['501059004', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'ROSA', 1344, 9, 400, 1.82],
    [501149001, 'VOL 1/1 MESA CABECEIRA MADERO', 'BRANCO', 881, 9, 400, 1],
    ['501151001', 'VOL 1/1 RACK MOVE 1.6', 'CINAMOMO/OFF WHITE', 2076, 9, 400, 3.01],
    ['501160001', 'VOL 1/2 BERCO ALGODAO DOCE', 'BRANCO', '', 9, 400, 1.5], ['501160002', 'VOL 2/2 BERCO ALGODAO DOCE', 'BRANCO', 1673, 9, 400, 2.1]],
    CONFIG_PAINEL: [['CHAVE', 'VALOR'], ['META_UEP', 2761], ['SETUPS_DIA', 4], ['SETUP_MIN', '8,2'], ['EFICIENCIA_EMB', 85]] };
  const P = montar(CAT, null, '12/11/2026');
  const r = P.run('return getTemposAlvo();');
  const por = {}; (r.produtos || []).forEach(x => { por[x.rot] = x; });
  const r2 = x => Math.round(x * 100) / 100, est = mm => (mm + 400) / 1000 / (9 / 60);
  const sUep = (527 - 32.8) * 60 / 2761;
  ok('a régua diz o método e a eficiência (85% da planilha); a referência da UEP continua indo (a carga da semana é por ela)',
     [r.ok, r.ref.metodo, r.ref.eficiencia, r.ref.eficienciaOrigem, r.ref.metaUep, r.ref.metaOrigem, r.ref.setupDia, r.ref.minProd, Math.round(r.ref.sUep * 100) / 100],
     [true, 'esteira', 85, 'planilha', 2761, 'planilha', 32.8, 494.2, Math.round(sUep * 100) / 100]);
  ok('os nomes da lista do app: o produto inteiro e, com 2+ volumes, cada volume; a UEP continua indo (a mesma da medição)',
     [Object.keys(por), por['501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2'].uep, por['501059 · PENTEADEIRA CAMARIM STRASS'].uep, por['501149 · MESA CABECEIRA MADERO'].uep],
     [['501059 · PENTEADEIRA CAMARIM STRASS', '501059 · PENTEADEIRA CAMARIM STRASS · VOL 1/2', '501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2',
       '501149 · MESA CABECEIRA MADERO', '501151 · RACK MOVE 1.6', '501160 · BERCO ALGODAO DOCE', '501160 · BERCO ALGODAO DOCE · VOL 1/2', '501160 · BERCO ALGODAO DOCE · VOL 2/2'],
      1.8, 1.63, 1]);
  ok('o RACK MOVE 1.6 de 12/11: (2076 + 400) mm ÷ 9 m/min = 16,51 s de esteira; ÷ 85% = 19,42 s de alvo (era 32,3 pela UEP); a caixa vai junto para o app escrever a conta',
     [por['501151 · RACK MOVE 1.6']], [{ rot: '501151 · RACK MOVE 1.6', uep: 3.01, esteira: 16.51, alvo: 19.42, medida: 2076, vel: 9, entre: 400 }]);
  ok('o alvo = esteira ÷ 85% (duas casas): STRASS 2/2 e MADERO; o código número (501149001) casa igual',
     [por['501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2'].esteira, por['501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2'].alvo,
      por['501149 · MESA CABECEIRA MADERO'].esteira, por['501149 · MESA CABECEIRA MADERO'].alvo],
     [r2(est(1344)), r2(est(1344) / 0.85), r2(est(881)), r2(est(881) / 0.85)]);
  ok('o JOGO (produto inteiro) = a esteira média por caixa dos volumes; com caixas diferentes, sem medida/velocidade (a média não é caixa de ninguém)',
     [por['501059 · PENTEADEIRA CAMARIM STRASS'].esteira, por['501059 · PENTEADEIRA CAMARIM STRASS'].alvo,
      por['501059 · PENTEADEIRA CAMARIM STRASS'].medida, por['501059 · PENTEADEIRA CAMARIM STRASS'].vel],
     [r2((est(1705) + est(1344)) / 2), r2((est(1705) + est(1344)) / 2 / 0.85), null, null]);
  ok('sem medida, sem alvo — MESMO COM UEP (nunca a UEP no lugar): o BERÇO 1/2 e o jogo dele; o 2/2 tem',
     [por['501160 · BERCO ALGODAO DOCE · VOL 1/2'], por['501160 · BERCO ALGODAO DOCE'].alvo, por['501160 · BERCO ALGODAO DOCE · VOL 2/2'].alvo],
     [{ rot: '501160 · BERCO ALGODAO DOCE · VOL 1/2', uep: 1.5, esteira: null, alvo: null, medida: null, vel: null, entre: null }, null, r2(est(1673) / 0.85)]);
  ok('a esteira é a do % TETO EST. (3600 ÷ _tetoEsteiraCxH): UMA conta para o painel e o app',
     [P.run("return Math.round(3600 / _tetoEsteiraCxH({ medida: 2076, velocidade: 9, entrePeca: 400 }) * 100) / 100;"),
      /return t > 0 \? 3600 \/ t : null;/.test(GS), /const t = _tetoEsteiraCxH\(c\);/.test(GS)],
     [16.51, true, true]);
  // a UEP que vai é a MESMA da medição que o app manda (UEP_CADASTRO): a mesma função
  const rm = P.run(`return _cronoDoApp(${q({ rotulo:'501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2', data:'04/11/2026', volumes:'60', sLac:'16.6', sRod:'20.4' })}, lerCatalogoProdutos());`);
  const rj = P.run(`return _cronoDoApp(${q({ rotulo:'501059 · PENTEADEIRA CAMARIM STRASS', data:'04/11/2026', volumes:'60', sLac:'16.6', sRod:'20.4' })}, lerCatalogoProdutos());`);
  ok('a UEP da lista = o UEP_CADASTRO da medição do app, no volume e no jogo (uma função, _cronoUepCad)',
     [rm.campos.uepCad, rj.campos.uepCad, /const uepCad = _cronoUepCad\(doVol, volSel, nVol\);/.test(GS), /_cronoUepCad\(g\.cods, 0, g\.nVol\)/.test(GS)],
     [por['501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2'].uep, por['501059 · PENTEADEIRA CAMARIM STRASS'].uep, true, true]);
  // sem a CONFIG_PAINEL: a meta padrão, o setup padrão e a eficiência padrão (85), ditos como padrão
  const P0 = montar({ PRODUTO_CODIGO: CAT.PRODUTO_CODIGO }, null, '12/11/2026');
  const r0 = P0.run('return getTemposAlvo();');
  const rx = P.run('return _temposAlvoMontar(lerCatalogoProdutos(), { metaUep: 2761, setupsDia: 100, setupMin: 6 });');
  ok('sem a CONFIG_PAINEL: META UEP, setup 8 × 8 e eficiência 85% padrão, ditos como padrão; o alvo sai igual; setup que não cabe na jornada: erro',
     [r0.ok, r0.ref.metaUep, r0.ref.metaOrigem, r0.ref.setupDia, r0.ref.setupOrigem, r0.ref.eficiencia, r0.ref.eficienciaOrigem,
      r0.produtos.find(x => x.rot === '501151 · RACK MOVE 1.6').alvo, rx.ok, /não cabe/.test(rx.erro)],
     [true, 2530, 'padrao', 64, 'padrao', 85, 'padrao', 19.42, false, true]);
  // a eficiência digitada na planilha: 80 muda o alvo; a célula em % (0,85) e o texto "85%" valem 85; lixo e fora de 1–100: o padrão
  const comEf = v => montar({ PRODUTO_CODIGO: CAT.PRODUTO_CODIGO, CONFIG_PAINEL: [['CHAVE', 'VALOR'], ['EFICIENCIA_EMB', v]] }, null, '12/11/2026').run('return getTemposAlvo();');
  const ef = v => { const x = comEf(v); return [x.ref.eficiencia, x.ref.eficienciaOrigem]; };
  ok('EFICIENCIA_EMB na planilha: 80 → o RACK MOVE 1.6 vai a 20,64 s; 0,85 (célula em %) e "85%" = 85; "abc", 0, 150 e "8 5": o padrão',
     [comEf(80).produtos.find(x => x.rot === '501151 · RACK MOVE 1.6').alvo, ef(0.85), ef('85%'), ef('82,5'), ef('abc'), ef(0), ef(150), ef('8 5')],
     [r2(est(2076) / 0.8), [85, 'planilha'], [85, 'planilha'], [82.5, 'planilha'], [85, 'padrao'], [85, 'padrao'], [85, 'padrao'], [85, 'padrao']]);
  // o ⚙ do painel grava a eficiência (setConfigPainel): número válido, nunca lixo por cima da que vale
  const PS = montar({ CONFIG_PAINEL: [['CHAVE', 'VALOR'], ['EFICIENCIA_EMB', 85]] }, null, '12/11/2026');
  const g1 = PS.run("_valoresMemo = {}; return setConfigPainel({ eficienciaEmb: '82,5' });");
  const v1 = PS.ABAS.CONFIG_PAINEL.find(l => l[0] === 'EFICIENCIA_EMB')[1];
  PS.run("_valoresMemo = {}; return setConfigPainel({ eficienciaEmb: 'abc' });");
  const v2 = PS.ABAS.CONFIG_PAINEL.find(l => l[0] === 'EFICIENCIA_EMB')[1];
  ok('o ⚙ grava a eficiência como NÚMERO (82,5) e devolve a config com ela; lixo não apaga a que vale',
     [g1.ok, v1, g1.painelConfig.eficienciaEmb, v2], [true, 82.5, 82.5, 82.5]);
  // o padrão do .gs = o do painel (EF_EMB_PADRAO e CRONO_APP_GRUPO); o nome = o rot do _uepConvProdutos do painel
  const m = /const CRONO_APP_GRUPO=\{ hSemana:44, diasSemana:5, setupsDia:(\d+), setupMin:(\d+) \};/.exec(HTML);
  const me = /const EF_EMB_PADRAO=(\d+);/.exec(HTML);
  ok('os padrões do .gs = os do painel (setup do CRONO_APP_GRUPO, eficiência do EF_EMB_PADRAO); o nome segue o rot do painel',
     [m && [Number(m[1]), Number(m[2])], P.run('return [TA_SETUP_PADRAO_GS.setupsDia, TA_SETUP_PADRAO_GS.setupMin];'),
      me && Number(me[1]), P.run('return TA_EFICIENCIA_PADRAO_GS;'),
      /rot:cod\.slice\(0, 6\) \+ ' · ' \+ nome/.test(HTML), /rot:p\.rot \+ ' · VOL ' \+ v \+ '\/' \+ p\.nVol/.test(HTML)],
     [[8, 8], [8, 8], 85, 85, true, true]);
  // o ⚙ do painel (v7.235.0): o campo, a leitura do que se digita e o envio só quando mudou
  { const i = HTML.indexOf('function _efEmbLer('), j = HTML.indexOf('\n}', i);
    const ler = new Function(HTML.slice(i, j + 2) + '; return _efEmbLer;')();
    ok('⚙ EFICIÊNCIA DA EMBALAGEM: o campo, "85" / "85%" / "82,5" valem, lixo e fora de 1–100 não; vai à planilha (eficienciaEmb=) só quando mudou',
       [HTML.includes('id="c-ef-emb"'), ['85', '85%', '82,5', ' 90 % ', 'abc', '0', '150', ''].map(ler),
        /if\(_efEmbNova!=null\)\{ params\.push\('eficienciaEmb='\+_efEmbNova\); _efEmbNova=null; \}/.test(HTML),
        /_efEmbNova=x!=null && !\(naPlanilha>0 && x===naPlanilha\) \? x : null;/.test(HTML),
        /eficienciaEmb: \(json\.painelConfig\|\|\{\}\)\.eficienciaEmb/.test(HTML)],
       [true, [85, 85, 82.5, 90, null, null, null, null], true, true, true]); }
  ok('a leitura está no doGet, no cache (o cadastro e a config invalidam) e não grava nada',
     [/act === 'getTemposAlvo'\) result = getTemposAlvo\(\);/.test(GS), /getTemposAlvo: 300/.test(GS), /getTemposAlvo: \['cat', 'cfg', 'prod'\]/.test(GS),
      JSON.stringify(P.ABAS.PRODUTO_CODIGO) === JSON.stringify(CAT.PRODUTO_CODIGO), !('UEP_VERSOES' in P.ABAS)],
     [true, true, true, true, true]);
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
