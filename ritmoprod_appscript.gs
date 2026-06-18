// ════════════════════════════════════════════════════════
// RitmoProd · Apps Script — Google Sheets
// Versão: 4.6 — fecha o dia às 23:59 (Brasília) e zera à prova de falhas
// ════════════════════════════════════════════════════════
//
// CONFIGURAR 1 VEZ (recomendado, p/ o fechamento limpo às 23:59):
//   1. Configurações do projeto ▸ Fuso horário = (GMT-03:00) America/Sao_Paulo.
//      O horário do GATILHO segue o fuso do PROJETO — se ficar em UTC, ele
//      dispara na hora errada (20:00 em vez de 23:59).
//   2. Rode a função instalarGatilhos() UMA vez (menu Executar). Ela cria o
//      gatilho diário que, às 23:59, salva o dia no HISTÓRICO e zera o REALIZADO.
//
// COMPORTAMENTO:
//   • Cada lançamento (manual na planilha via onEdit, ou pelo app) CARIMBA a
//     qual dia os dados pertencem (propriedade 'dataDados'). Assim o script
//     sempre sabe se a planilha contém dados de HOJE ou de um dia anterior.
//   • 23:59 (Brasília): resetDiario() arquiva o dia atual em HISTORICO e limpa
//     o REALIZADO. Como o turno acaba às 16:45, isso nunca atrapalha a produção.
//   • FAILSAFE: mesmo que o gatilho das 23:59 falhe (ou nunca tenha sido
//     instalado), a leitura do painel (getDados) fecha automaticamente o dia
//     anterior na PRIMEIRA leitura do novo dia, EM QUALQUER HORÁRIO. Ele só
//     zera quando os dados na planilha são de um dia ANTERIOR — nunca apaga a
//     produção já lançada hoje.
//   • arquivarDiaAtual() nunca sobrescreve um dia já fechado manualmente
//     (botão "Fechar o Dia", FECHADO = true).
// ════════════════════════════════════════════════════════

const SHEET_DADOS   = 'HORA_A_HORA';
const SHEET_HIST    = 'HISTORICO';
const SHEET_PARADAS = 'PARADAS';

// Fuso fixo para os rótulos de data/arquivamento (independe do fuso do projeto).
const TZ = 'America/Sao_Paulo';

// Horário do fechamento automático (segue o fuso do PROJETO no gatilho).
const HORA_RESET  = 23;  // 23h
const MIN_RESET   = 59;  // :59  → ~23:59

// Propriedade que guarda a qual dia (dd/MM/yyyy) pertencem os dados na planilha.
// É o que permite zerar com segurança em qualquer horário, sem apagar o dia atual.
const PROP_DATA_DADOS = 'dataDados';


// ════════════════════════════════════════════════════════
// WEB APP
// ════════════════════════════════════════════════════════

function doGet(e) {
  e = e || {};
  const p        = e.parameter || {};
  const act      = p.action   || '';
  const callback = p.callback || '';

  let result;

  try {
    if      (act === 'saveDay')       result = saveDay(p);
    else if (act === 'getHistory')    result = getHistory();
    else if (act === 'addHE')         result = addHE(p);
    else if (act === 'saveParadas')   result = saveParadas(p);
    else if (act === 'getParadas')    result = getParadas(p);
    else if (act === 'saveRealizado') result = saveRealizado(p);
    else                              result = getDados();
  } catch(err) {
    result = { ok: false, erro: err.message, stack: err.stack };
  }

  const json = JSON.stringify(result);

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}


// ════════════════════════════════════════════════════════
// GET DADOS
// ════════════════════════════════════════════════════════

function getDados() {
  verificarNovoDia(); // fallback seguro: só age de madrugada (ver função)

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_DADOS);

  if (!sh) return { ok: false, erro: 'Aba HORA_A_HORA nao encontrada.' };

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  const data    = sh.getRange(1, 1, lastRow, lastCol).getValues();

  const metaDia = Number(data[2][1]) || 0;

  const hIdx = 3;
  const hdr  = data[hIdx].map(c => String(c).trim().toUpperCase());

  const iH = hdr.indexOf('HORA');
  const iR = hdr.indexOf('REALIZADO');
  const iM = hdr.findIndex(c => c.includes('META'));

  if (iH < 0 || iR < 0 || iM < 0) {
    return { ok: false, erro: 'Cabecalho HORA / REALIZADO / META nao encontrado na linha 4.' };
  }

  const hoje = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');

  const slots = [];

  for (let i = hIdx + 1; i < data.length; i++) {
    const row     = data[i];
    const horaVal = String(row[iH] || '').trim();

    if (!horaVal) continue;
    if (horaVal.toUpperCase() === 'TOTAL') continue;

    const parts  = horaVal.split('-');
    const inicio = parts[0] ? parts[0].trim() : '';
    const fim    = parts[1] ? parts[1].trim() : '';

    const metaVal = Number(row[iM]) || 0;
    if (metaVal === 0) continue;

    const realRaw = row[iR];
    const producaoHora =
      (realRaw === '' || realRaw === null || realRaw === undefined)
        ? null
        : Number(realRaw);

    slots.push({
      id:           hoje + '_' + inicio.replace(':', ''),
      inicio,
      fim,
      label:        horaVal,
      metaHora:     metaVal,
      producaoHora,
      operador:     '',
      obs:          ''
    });
  }

  return {
    ok:          true,
    slots,
    metaDia:     slots.reduce((s, sl) => s + sl.metaHora, 0) || metaDia,
    dataRef:     hoje,
    dadosDeHoje: true,
    planilha:    ss.getName(),
    aba:         SHEET_DADOS
  };
}


// ════════════════════════════════════════════════════════
// SALVAR REALIZADO
// ════════════════════════════════════════════════════════

function saveRealizado(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_DADOS);

    if (!sh) return { ok: false, erro: 'Aba nao encontrada.' };

    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    const data    = sh.getRange(1, 1, lastRow, lastCol).getValues();

    let hIdx = -1;
    for (let i = 0; i < data.length; i++) {
      const row = data[i].map(c => String(c).trim().toUpperCase());
      if (row.indexOf('HORA') >= 0 && row.indexOf('REALIZADO') >= 0) {
        hIdx = i;
        break;
      }
    }

    if (hIdx < 0) return { ok: false, erro: 'Cabecalho nao encontrado.' };

    const hdr     = data[hIdx].map(c => String(c).trim().toUpperCase());
    const iH      = hdr.indexOf('HORA');
    const iR      = hdr.indexOf('REALIZADO');
    const horario = String(p.horario || '').trim();
    const real    = Number(p.realizado) || 0;

    // Carimba que a planilha contém dados de HOJE (protege contra zeramento).
    PropertiesService.getScriptProperties()
      .setProperty(PROP_DATA_DADOS, Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy'));

    const iLotes = [];
    for (let c = iR + 1; c < hdr.length; c++) {
      if (hdr[c].includes('LOTE') || hdr[c].includes('LT') || hdr[c].startsWith('L')) {
        iLotes.push(c);
      }
    }

    if (iLotes.length === 0) {
      for (let i = hIdx + 1; i < data.length; i++) {
        const cellHora = String(data[i][iH]).trim();
        const inicio   = cellHora.split('-')[0].trim();
        if (cellHora === horario || inicio === horario) {
          const cell = sh.getRange(i + 1, iR + 1);
          if (!cell.getFormula()) {
            cell.setValue(real);
          }
          return { ok: true, linha: i + 1, horario: cellHora, realizado: real };
        }
      }
      return { ok: false, erro: 'Slot nao encontrado: ' + horario };
    }

    for (let i = hIdx + 1; i < data.length; i++) {
      const cellHora = String(data[i][iH]).trim();
      const inicio   = cellHora.split('-')[0].trim();

      if (cellHora === horario || inicio === horario) {
        let colunaEscrita = -1;
        for (const ic of iLotes) {
          const val = data[i][ic];
          if (val === '' || val === null || val === undefined || val === 0) {
            sh.getRange(i + 1, ic + 1).setValue(real);
            colunaEscrita = ic + 1;
            break;
          }
        }
        if (colunaEscrita < 0) {
          const ultimo = iLotes[iLotes.length - 1];
          sh.getRange(i + 1, ultimo + 1).setValue(real);
          colunaEscrita = ultimo + 1;
        }
        return { ok: true, linha: i + 1, coluna: colunaEscrita, horario: cellHora, realizado: real };
      }
    }

    return { ok: false, erro: 'Slot nao encontrado: ' + horario };

  } finally {
    lock.releaseLock();
  }
}


// ════════════════════════════════════════════════════════
// SALVAR DIA (FECHAMENTO MANUAL — botão "Fechar o Dia")
// ════════════════════════════════════════════════════════

function saveDay(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh   = ss.getSheetByName(SHEET_HIST);

  if (!sh) {
    sh = ss.insertSheet(SHEET_HIST);
    sh.appendRow(['DATA','REALIZADO','META','EFICIENCIA %','MELHOR H.','PIOR H.','HE','FECHADO','FECHADO EM']);
    sh.setFrozenRows(1);
  }

  sh.getRange(1, 1, sh.getMaxRows(), 1).setNumberFormat('@');
  sh.getRange(1, 9, sh.getMaxRows(), 1).setNumberFormat('@');

  const rows = sh.getDataRange().getValues();
  const idx  = rows.slice(1).map(r => String(r[0])).indexOf(p.data);

  const row = [
    p.data,
    Number(p.real)   || 0,
    Number(p.meta)   || 0,
    Number(p.ef)     || 0,
    Number(p.melhor) || 0,
    Number(p.pior)   || 0,
    Number(p.he || 0),
    true,
    String(p.fechadoEm || '')
  ];

  if (idx >= 0) {
    sh.getRange(idx + 2, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }

  return { ok: true, data: p.data };
}


// ════════════════════════════════════════════════════════
// HISTÓRICO
// ════════════════════════════════════════════════════════

function getHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_HIST);

  if (!sh) return { ok: true, dias: [] };

  const dias = sh
    .getDataRange()
    .getValues()
    .slice(1)
    .filter(r => r[0])
    .map(r => ({
      data:      fmtDataBR(r[0]),
      real:      Number(r[1]) || 0,
      meta:      Number(r[2]) || 0,
      ef:        Number(r[3]) || 0,
      melhor:    Number(r[4]) || 0,
      pior:      Number(r[5]) || 0,
      heCount:   Number(r[6]) || 0,
      fechado:   r[7] === true || r[7] === 'TRUE' || String(r[7]).toLowerCase() === 'true',
      fechadoEm: fmtFechadoBR(r[8])
    }));

  return { ok: true, dias };
}


// ════════════════════════════════════════════════════════
// ADICIONAR HORA EXTRA
// ════════════════════════════════════════════════════════

function addHE(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_DADOS);
  if (!sh) return { ok: false, erro: 'Aba nao encontrada.' };
  sh.appendRow([p.label || '', Number(p.meta) || 0, '']);
  return { ok: true };
}


// ════════════════════════════════════════════════════════
// PARADAS
// ════════════════════════════════════════════════════════

function saveParadas(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh   = ss.getSheetByName(SHEET_PARADAS);

  if (!sh) {
    sh = ss.insertSheet(SHEET_PARADAS);
    sh.appendRow(['DATA','ID','TIPO','INICIO','FIM','DURACAO_MIN','OBS']);
    sh.setFrozenRows(1);
  }

  const data = p.data || Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  const paradas = JSON.parse(p.paradas || '[]');

  paradas.forEach(par => {
    sh.appendRow([
      data,
      par.id   || Date.now(),
      par.tipo || '',
      par.ini  || '',
      par.fim  || '',
      calcDurMin(par.ini, par.fim) || '',
      par.obs  || ''
    ]);
  });

  return { ok: true, salvos: paradas.length };
}

function getParadas(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PARADAS);

  if (!sh) return { ok: true, paradas: [] };

  const data = p.data || Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');

  const paradas = sh
    .getDataRange()
    .getValues()
    .slice(1)
    .filter(r => String(r[0]) === data)
    .map(r => ({
      id:   Number(r[1]) || Date.now(),
      tipo: String(r[2] || ''),
      ini:  String(r[3] || ''),
      fim:  String(r[4] || ''),
      obs:  String(r[6] || '')
    }));

  return { ok: true, paradas };
}


// ════════════════════════════════════════════════════════
// onEdit — carimba o dia ao lançar dados manualmente na planilha
// ════════════════════════════════════════════════════════

// Gatilho SIMPLES (dispara sozinho em edições manuais; NÃO dispara em
// alterações feitas por script, como o zeramento). Registra que a planilha
// passou a conter dados de HOJE, protegendo a produção atual do failsafe.
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    if (sh.getName() !== SHEET_DADOS) return;
    if (e.range.getRow() <= 4) return; // cabeçalho/meta nas primeiras linhas

    PropertiesService.getScriptProperties()
      .setProperty(PROP_DATA_DADOS, Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy'));
  } catch (err) {
    // onEdit deve falhar em silêncio para não travar a edição na planilha.
  }
}


// ════════════════════════════════════════════════════════
// GATILHO DIÁRIO — rode instalarGatilhos() UMA vez
// ════════════════════════════════════════════════════════

function instalarGatilhos() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'resetDiario') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('resetDiario')
    .timeBased()
    .everyDays(1)
    .atHour(HORA_RESET)
    .nearMinute(MIN_RESET)
    .create();
  Logger.log('Gatilho instalado: resetDiario ~' + HORA_RESET + ':' + MIN_RESET
    + ' (fuso do projeto). Confirme o fuso = ' + TZ);
}

// Rode AGORA (menu Executar) para fechar e zerar o painel na hora, caso ele
// tenha ficado com os dados de ontem. Arquiva sob a data correta antes de zerar.
function zerarPainelAgora() {
  const props   = PropertiesService.getScriptProperties();
  const hoje    = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  const ontem   = Utilities.formatDate(new Date(Date.now() - 86400000), TZ, 'dd/MM/yyyy');
  const carimbo = props.getProperty(PROP_DATA_DADOS);
  const dataRef = (carimbo && carimbo !== hoje) ? carimbo : ontem;
  executarReset(dataRef, props);
  Logger.log('Painel zerado manualmente (arquivado em ' + dataRef + ').');
}

// Executada pelo gatilho às ~23:59. Salva o dia no HISTÓRICO e zera o REALIZADO.
function resetDiario() {
  const props = PropertiesService.getScriptProperties();
  const hoje  = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  if (props.getProperty('ultimoReset') === hoje) return; // o dia de hoje já foi fechado
  executarReset(hoje, props);
}


// ════════════════════════════════════════════════════════
// FAILSAFE — fecha o dia anterior na 1ª leitura do novo dia
// ════════════════════════════════════════════════════════

// Roda dentro de getDados(). Usa o carimbo 'dataDados' (gravado a cada
// lançamento, manual via onEdit ou pelo app) para decidir com segurança:
//   • Se a planilha tem dados de um dia ANTERIOR → arquiva e zera, EM QUALQUER
//     HORÁRIO. Isso cobre o caso do gatilho das 23:59 não ter rodado.
//   • Se os dados são de HOJE → NÃO faz nada (nunca apaga a produção atual).
//   • Se não há carimbo (planilha vazia/sem produção) → NÃO faz nada.
function verificarNovoDia() {
  const props = PropertiesService.getScriptProperties();
  const hoje  = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');

  const dataDados = props.getProperty(PROP_DATA_DADOS);
  if (!dataDados)          return; // sem produção registrada — nada a fechar
  if (dataDados === hoje)  return; // dados são de hoje (turno em andamento) — jamais zera

  // A planilha contém dados de um dia anterior: fecha sob a data correta.
  executarReset(dataDados, props);
}

// Arquiva o dia informado no HISTÓRICO e zera o REALIZADO.
function executarReset(dataRef, props) {
  try { arquivarDiaAtual(dataRef); }
  catch (err) { Logger.log('Falha ao arquivar ' + dataRef + ': ' + err.message); }

  limparRealizado();
  props.setProperty('ultimoReset', dataRef);
  props.deleteProperty(PROP_DATA_DADOS); // planilha zerada: sem dados carimbados
  Logger.log('Dia fechado e zerado: ' + dataRef);
}

// Zera as colunas de lotes/realizado e remove as linhas de Hora Extra.
function limparRealizado() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_DADOS);
  if (!sh) return;

  const data = sh.getDataRange().getValues();
  const hIdx = 3;
  const hdr  = data[hIdx].map(c => String(c).trim().toUpperCase());
  const iH   = hdr.indexOf('HORA');
  const iR   = hdr.indexOf('REALIZADO');

  if (iR < 0) return;

  const iLotes = [];
  const COL_M  = 12;
  for (let c = iR + 1; c <= Math.min(COL_M, hdr.length - 1); c++) {
    iLotes.push(c);
  }

  for (let i = data.length - 1; i > hIdx; i--) {
    const hora = String(data[i][iH] || '').trim().toUpperCase();

    if (!hora || hora === 'TOTAL') continue;

    if (hora.startsWith('HE')) {
      sh.deleteRow(i + 1);
      continue;
    }

    if (iLotes.length > 0) {
      const startCol = iLotes[0] + 1;
      const numCols  = iLotes[iLotes.length - 1] - iLotes[0] + 1;
      const emptyRow = Array(numCols).fill('');
      sh.getRange(i + 1, startCol, 1, numCols).setValues([emptyRow]);
    }
  }
}


// ════════════════════════════════════════════════════════
// ARQUIVAR DIA NO HISTÓRICO (automático, antes de zerar)
// ════════════════════════════════════════════════════════

// Lê o estado atual de HORA_A_HORA, calcula os totais e grava no HISTORICO.
// Não sobrescreve um dia já fechado manualmente (FECHADO = true).
function arquivarDiaAtual(dataRef) {
  if (!dataRef) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_DADOS);
  if (!sh) return;

  const data = sh.getDataRange().getValues();
  const hIdx = 3;
  const hdr  = data[hIdx].map(c => String(c).trim().toUpperCase());
  const iH   = hdr.indexOf('HORA');
  const iR   = hdr.indexOf('REALIZADO');
  const iM   = hdr.findIndex(c => c.includes('META'));
  if (iH < 0 || iR < 0 || iM < 0) return;

  const num = (v) =>
    (v === '' || v === null || v === undefined || isNaN(Number(v))) ? 0 : Number(v);

  let real = 0, meta = 0, he = 0, melhor = 0, pior = null;

  for (let i = hIdx + 1; i < data.length; i++) {
    const row  = data[i];
    const hora = String(row[iH] || '').trim();
    if (!hora || hora.toUpperCase() === 'TOTAL') continue;

    const ehHE    = hora.toUpperCase().startsWith('HE');
    const metaVal = Number(row[iM]) || 0;

    // Realizado da linha = coluna REALIZADO ou, se vazia, soma dos lotes.
    const direto = num(row[iR]);
    let somaLotes = 0;
    for (let c = iR + 1; c <= Math.min(12, row.length - 1); c++) somaLotes += num(row[c]);
    const realVal = Math.max(direto, somaLotes);

    if (metaVal > 0 && !ehHE) meta += metaVal;

    if (realVal > 0) {
      real += realVal;
      if (ehHE) {
        he++;
      } else {
        if (realVal > melhor) melhor = realVal;
        if (pior === null || realVal < pior) pior = realVal;
      }
    }
  }

  if (real <= 0) return; // nada produzido — nada a arquivar

  const ef = meta > 0 ? Number((real / meta * 100).toFixed(1)) : 0;

  let shH = ss.getSheetByName(SHEET_HIST);
  if (!shH) {
    shH = ss.insertSheet(SHEET_HIST);
    shH.appendRow(['DATA','REALIZADO','META','EFICIENCIA %','MELHOR H.','PIOR H.','HE','FECHADO','FECHADO EM']);
    shH.setFrozenRows(1);
  }
  shH.getRange(1, 1, shH.getMaxRows(), 1).setNumberFormat('@');
  shH.getRange(1, 9, shH.getMaxRows(), 1).setNumberFormat('@');

  const rows = shH.getDataRange().getValues();
  const idx  = rows.slice(1).map(r => String(r[0])).indexOf(dataRef);

  // Fechamento manual tem prioridade: não sobrescreve.
  if (idx >= 0) {
    const r = rows[idx + 1];
    const jaFechado = r[7] === true || String(r[7]).toLowerCase() === 'true';
    if (jaFechado) { Logger.log('Dia ' + dataRef + ' já fechado manualmente — mantido.'); return; }
  }

  const row = [
    dataRef,
    real,
    meta,
    ef,
    melhor,
    pior === null ? 0 : pior,
    he,
    false, // arquivamento automático (não foi fechado manualmente)
    'AUTO ' + Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm')
  ];

  if (idx >= 0) {
    shH.getRange(idx + 2, 1, 1, row.length).setValues([row]);
  } else {
    shH.appendRow(row);
  }

  Logger.log('Arquivado ' + dataRef + ': real=' + real + ' meta=' + meta + ' ef=' + ef + '%');
}


// ════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════

function calcDurMin(ini, fim) {
  if (!ini || !fim) return null;
  const [h0, m0] = ini.split(':').map(Number);
  const [h1, m1] = fim.split(':').map(Number);
  const d = (h1 * 60 + m1) - (h0 * 60 + m0);
  return d > 0 ? d : null;
}

function fmtDataBR(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'dd/MM/yyyy');
  return String(v || '');
}

function fmtFechadoBR(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (v === true || v === false) return '';
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'dd/MM/yyyy HH:mm');
  return String(v);
}


// ════════════════════════════════════════════════════════
// TESTES
// ════════════════════════════════════════════════════════

function testeGetDados() {
  Logger.log(JSON.stringify(getDados(), null, 2));
}

function testeGetHistory() {
  Logger.log(JSON.stringify(getHistory(), null, 2));
}

function testeArquivarHoje() {
  // Salva o dia atual no HISTÓRICO SEM zerar — confere os totais calculados.
  const hoje = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  arquivarDiaAtual(hoje);
}

function testeFecharAgora() {
  // Simula o fechamento das 23:59 (salva no histórico e zera) para o dia de hoje.
  const props = PropertiesService.getScriptProperties();
  const hoje  = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  executarReset(hoje, props);
}
