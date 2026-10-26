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
function montar(abas, meta, hoje) {
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
        setValue: x => { if (!lockDePe) semLock++; (v[l - 1] = v[l - 1] || [])[c - 1] = x; },
        setValues: vals => { vals.forEach((r, i) => { const L = v[l - 1 + i] = v[l - 1 + i] || []; r.forEach((x, j) => { L[c - 1 + j] = x; }); }); },
        setNumberFormat: () => {},
      }),
      appendRow: r => { if (!lockDePe) semLock++; v.push(r.slice()); },
      setFrozenRows: n => { m.frozen = n; },
    };
  }
  const ss = { getSheetByName: aba, insertSheet: nome => { ABAS[nome] = []; META[nome] = { extra: 1000, frozen: 0 }; return aba(nome); }, getName: () => 'teste' };
  const CACHE = {};
  let locks = 0, lockDePe = false, semLock = 0;
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    Utilities: { formatDate: (d, tz, f) => (/HH/.test(f) ? HOJE + ' 15:40:00' : HOJE) },
    CacheService: { getScriptCache: () => ({ get: k => (k in CACHE ? CACHE[k] : null), put: (k, x) => { CACHE[k] = x; }, remove: k => { delete CACHE[k]; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock: () => { locks++; lockDePe = true; }, releaseLock: () => { lockDePe = false; } }) },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(GS, ctx);
  const run = code => vm.runInContext('(function(){ _invalidarValores(); ' + code + ' })()', ctx);
  return { ABAS, run, locks: () => locks, semLock: () => semLock };
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
ok('a troca da UEP lê as abas DIRETO (é escrita: nunca o memo de leitura)',
   /_valores\(|_valoresDaAba\(|lerCatalogoProdutos\(/.test(GS.slice(GS.indexOf('function _trocarUepCronoCore('), GS.indexOf('CONFERÊNCIA DAS TROCAS (v5.34)'))), false);
ok('a exclusão lê a aba DIRETO (é escrita: nunca o memo de leitura)',
   /_valores\(|_valoresDaAba\(/.test(GS.slice(GS.indexOf('function excluirCrono('), GS.indexOf('TROCAR A UEP PELA CRONOANÁLISE (v5.34)'))), false);

// ════════════════════════════════════════════════════════════════════════════
// TROCAR A UEP PELA CRONOANÁLISE + CONFERÊNCIA DAS TROCAS (.gs v5.34)
// PPCP, 26/10/2026. O caso real: STRASS VOL 2/2, 11,5 s × 61 (23/10) e 12,4 s ×
// 52 (26/10) contra a MADERO 7,9 s; cadastro 2,29 nos três códigos do volume.
const HC = CRONO_HDR => CRONO_HDR;
const CRONO_COLS_NOMES = ['REGISTRADO_EM', 'DATA_MEDICAO', 'MODELO', 'PRODUTO', 'VOLUME', 'CODIGOS', 'S_RODANDO', 'S_PERIODO', 'S_SEM_LACUNAS', 'VOLUMES_MEDIDOS',
  'BASE', 'BASE_S', 'TOLERANCIA_PCT', 'TEMPO_PADRAO_S', 'UEP_CRONO', 'UEP_CADASTRO', 'LINHA_CX_H', 'LINHA_S_CX', 'LINHA_DIAS', 'LINHA_PERIODO', 'VELOCIDADE', 'ENTRE_PECAS', 'MEDIDO_POR', 'REG_ID'];
const linhaCrono = o => CRONO_COLS_NOMES.map(n => (n in o ? o[n] : ''));
const MED_ST = (data, sRod, vol, uep, regId) => linhaCrono({ REGISTRADO_EM:'26/10/2026 10:19:28', DATA_MEDICAO:data, MODELO:'501059', PRODUTO:'PENTEADEIRA CAMARIM STRASS',
  VOLUME:'VOL 2/2', CODIGOS:'501.059.002 501.059.004 501.059.008', S_RODANDO:sRod, VOLUMES_MEDIDOS:vol, BASE:'MADERO MEDIDA 20/10/2026', BASE_S:7.9, UEP_CRONO:uep, UEP_CADASTRO:2.29, REG_ID:regId });
const CAD = uep2 => [['CODIGO', 'DESCRICAO', 'COR', 'UEP', 'UEP_VIGENCIA'],
  ['501059001', 'VOL 1/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', 2.71, '16/10/2026'],
  ['501059002', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'BRANCO', uep2, '16/10/2026'],
  ['501059004', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'ROSA', uep2, '16/10/2026'],
  ['501059008', 'VOL 2/2 PENTEADEIRA CAMARIM STRASS', 'ALECRIM', uep2, '16/10/2026']];
const PEDIDO = { modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', cods:'501059002:1.51,501059004:1.51,501059008:1.51' };
const abasST = (regs, uep2) => ({ PRODUTO_CODIGO: CAD(uep2 == null ? 2.29 : uep2), CRONOANALISE: [CRONO_COLS_NOMES].concat(regs || [MED_ST('26/10/2026', 12.4, 52, 1.57, 'c1'), MED_ST('23/10/2026', 11.5, 61, 1.46, 'c2')]) });

console.log('\n── trocarUepCrono: grava a média das medições quando a regra deixa ──');
{
  const P = montar(abasST(), null, '26/10/2026');
  const r = P.run(`return trocarUepCrono(${q(PEDIDO)});`);
  const C = P.ABAS.PRODUTO_CODIGO;
  ok('trocou: 3 códigos, a média pelos segundos (1,51), 113 volumes de 2 medições, vigência de hoje',
     [r.ok, r.trocado, r.n, r.uep, r.nVol, r.medicoes, r.vigencia], [true, true, 3, 1.51, 113, 2, '26/10/2026']);
  ok('o cadastro: o VOL 2/2 em 1,51 com a vigência DIGITADA; o VOL 1/2 não é tocado',
     C.slice(1).map(l => [l[0], l[3], l[4]]),
     [['501059001', 2.71, '16/10/2026'], ['501059002', 1.51, '26/10/2026 DIGITADA'], ['501059004', 1.51, '26/10/2026 DIGITADA'], ['501059008', 1.51, '26/10/2026 DIGITADA']]);
  const V = P.ABAS.UEP_VERSOES;
  ok('a UEP_VERSOES nasce com a SEMENTE (o cadastro de antes) e uma versão por código, ORIGEM CRONOANÁLISE',
     [V[0], V.slice(1, 5).map(l => [l[0], l[1], l[3]]), V.slice(5).map(l => [l[0], l[1], l[2], l[3], l[5]])],
     [['CODIGO', 'UEP', 'VIGENCIA', 'ORIGEM', 'GRAVADO_EM', 'ANTERIOR'],
      [['501059001', 2.71, 'PADRÃO INICIAL · cadastro 16/10/2026'], ['501059002', 2.29, 'PADRÃO INICIAL · cadastro 16/10/2026'], ['501059004', 2.29, 'PADRÃO INICIAL · cadastro 16/10/2026'], ['501059008', 2.29, 'PADRÃO INICIAL · cadastro 16/10/2026']],
      ['501059002', '501059004', '501059008'].map(c => [c, 1.51, '26/10/2026', 'CRONOANÁLISE · 501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2 · 2 medições, 113 volumes', 2.29])]);
  ok('roda sob o lock, e nenhuma escrita fora dele', [P.locks() > 0, P.semLock()], [true, 0]);
  const r2 = P.run(`return trocarUepCrono(${q(PEDIDO)});`);
  ok('a retentativa (timeout) acha a UEP já trocada: jaTrocado, nada regravado', [r2.trocado, r2.jaTrocado, P.ABAS.UEP_VERSOES.length], [true, true, 8]);
}

console.log('\n── trocarUepCrono: o que NÃO troca (e não grava nada) ──');
{
  const caso = (abas, pedido) => { const P = montar(abas, null, '26/10/2026'); const r = P.run(`return trocarUepCrono(${q(pedido)});`);
    return [r.ok, r.trocado, r.recusado, r.motivo, P.ABAS.PRODUTO_CODIGO[2][3], 'UEP_VERSOES' in P.ABAS]; };
  ok('amostra pequena (uma medição de 20 volumes)', caso(abasST([MED_ST('26/10/2026', 12.4, 20, 1.57, 'c1')]), PEDIDO), [true, false, true, 'pouca-amostra', 2.29, false]);
  ok('o cadastro já confere com as medições (outro computador trocou para 1,55)', caso(abasST(null, 1.55), PEDIDO), [true, false, true, 'confere', 1.55, false]);
  ok('as medições discordam (uma 12,4 s, outra 19 s = 2,41 confere)', caso(abasST([MED_ST('26/10/2026', 12.4, 52, 1.57, 'c1'), MED_ST('23/10/2026', 19, 61, 2.41, 'c2')]), PEDIDO),
     [true, false, true, 'discordam', 2.29, false]);
  ok('a UEP enviada não bate com a média das medições (a tela estava velha)', caso(abasST(), Object.assign({}, PEDIDO, { cods:'501059002:1.70,501059004:1.70,501059008:1.70' })),
     [true, false, true, 'nao-bate', 2.29, false]);
  ok('código que não está nas medições (o VOL 1/2)', caso(abasST(), Object.assign({}, PEDIDO, { cods:'501059001:1.51' })), [true, false, true, 'codigo-fora', 2.29, false]);
  ok('código de outro modelo', caso(abasST(), Object.assign({}, PEDIDO, { cods:'501149001:1.51' })), [true, false, true, 'outro-modelo', 2.29, false]);
  ok('sem medição registrada do volume', caso(abasST([]), PEDIDO), [true, false, true, 'sem-medicao', 2.29, false]);
  ok('sem produto: erro dito (não é recusa da regra)', caso(abasST(), { cods:'501059002:1.51' }).slice(0, 2), [false, undefined]);
}

console.log('\n── getConferenciaCrono: a produção DEPOIS da troca, só o volume na linha ──');
{
  const P = montar(abasST(), null, '18/10/2026');
  P.run(`return trocarUepCrono(${q(PEDIDO)});`);                     // troca em 18/10
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
     [true, 1, '501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', '18/10/2026', '2 medições, 113 volumes', false]);
  ok('os dias: depois da troca e antes de hoje, só as horas com o volume sozinho (12:12 = 48 min)',
     t.dias.map(d => [d.data, d.min, d.horas, d.cx, d.uep]), [['19/10/2026', 120, 2, 250, 377.5], ['20/10/2026', 48, 1, 120, 181.2]]);
  ok('os códigos com a UEP nova, a anterior e a de agora', t.codigos.map(c => [c.cod, c.uep, c.antes, c.atual]),
     [['501059002', 1.51, 2.29, 1.51], ['501059004', 1.51, 2.29, 1.51], ['501059008', 1.51, 2.29, 1.51]]);
  P2.ABAS.PRODUTO_CODIGO[3][3] = 1.6;                                   // alguém digitou outro número no 501059004
  ok('a UEP do cadastro mudou depois: SUBSTITUÍDA', montar(P2.ABAS, null, '21/10/2026').run('return getConferenciaCrono();').trocas[0].substituida, true);
  ok('sem a UEP_VERSOES (nenhuma troca ainda): lista vazia, não erro', montar(abasST(), null, '21/10/2026').run('return getConferenciaCrono();'), { ok:true, trocas:[] });
  ok('a ORIGEM vai e volta pela mesma regra', montar().run(`return _cronoOrigemLer(_cronoOrigem('501059', 'PENTEADEIRA CAMARIM STRASS', 'VOL 2/2', 1, 52));`),
     { modelo:'501059', produto:'PENTEADEIRA CAMARIM STRASS', volume:'VOL 2/2', amostra:'1 medição, 52 volumes' });
}
console.log('\n── getHorasCrono (v5.35): o log da janela hora a hora, código por código ──');
{
  const H = montar({ PRODUCAO_PRODUTO: [['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS', 'PONTOS', 'PESO_KG', 'OPERADOR'],
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
  ok('período inválido ou ao contrário: erro dito, nada lido',
     [H.run(`return getHorasCrono({ de:'', ate:'21/10/2026' });`).ok, H.run(`return getHorasCrono({ de:'21/10/2026', ate:'19/10/2026' });`).ok], [false, false]);
  ok('a conferência e o getHorasCrono leem o log pelo MESMO _cronoHorasDoLog; o getHorasCrono só a janela (_valoresPorData)',
     [(GS.match(/_cronoHorasDoLog\(/g) || []).length, /function getHorasCrono[\s\S]*?_valoresPorData\(sh, 'DATA'/.test(GS)], [3, true]);
  ok('no doGet, com cache de leitura (a chave leva de/ate)',
     [/act === 'getHorasCrono'\)\s*result = getHorasCrono\(p\)/.test(GS), /getHorasCrono: 300/.test(GS)], [true, true]);
}
ok('a troca e a conferência estão no doGet, e a troca invalida as leituras',
   [/act === 'trocarUepCrono'\)\s*result = trocarUepCrono\(p\)/.test(GS), /act === 'getConferenciaCrono'\)\s*result = getConferenciaCrono\(\)/.test(GS),
    /ACOES_ESCRITA = \[[^\]]*'trocarUepCrono'/.test(GS)], [true, true, true]);

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
