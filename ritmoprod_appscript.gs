// ════════════════════════════════════════════════════════
// RitmoProd · Apps Script — Google Sheets
// Versão: 4.7 — fecha o dia às 23:59 (Brasília) e zera à prova de erros
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
//
// À PROVA DE ERROS:
//   • O failsafe roda dentro de try/catch: qualquer erro é só registrado e
//     NUNCA derruba o painel; a leitura seguinte tenta de novo (auto-recupera).
//   • Recuperação dupla: além do carimbo do lançamento (forte), o dia da última
//     leitura do painel (fraco) é usado se o carimbo faltar — mas, sem o forte,
//     o zeramento só ocorre de madrugada, jamais apagando produção de hoje.
//   • Só zera se houver produção pendente na planilha (planilhaTemProducao).
// ════════════════════════════════════════════════════════

const SHEET_DADOS     = 'HORA_A_HORA';
const SHEET_HIST      = 'HISTORICO';
const SHEET_HIST_HORA = 'HISTORICO_HORA';
const SHEET_PARADAS   = 'PARADAS';
const SHEET_PRODUTOS  = 'PRODUTO_CODIGO';   // catálogo de produtos (código, descrição, pontos, peso...)
const SHEET_PROD_LOG  = 'PRODUCAO_PRODUTO'; // log de caixas lançadas por hora/produto
const SHEET_PROG      = 'PROGRAMACAO';      // programação: DATA, CODIGO, QTDE (planejado por dia/produto)

// Produto selecionado pelo operador ("produto atual do turno" — opcional).
const PROP_PROD_ATUAL = 'produtoAtual';

// Fuso fixo para os rótulos de data/arquivamento (independe do fuso do projeto).
const TZ = 'America/Sao_Paulo';

// Horário do fechamento automático (segue o fuso do PROJETO no gatilho).
const HORA_RESET  = 23;  // 23h
const MIN_RESET   = 59;  // :59  → ~23:59
const HORA_INICIO = 5;   // antes desta hora é seguro zerar mesmo sem carimbo forte

// Propriedade que guarda a qual dia (dd/MM/yyyy) pertencem os dados na planilha.
// É o que permite zerar com segurança em qualquer horário, sem apagar o dia atual.
const PROP_DATA_DADOS     = 'dataDados';
// Dia da última leitura do painel — recuperação caso o carimbo forte falte.
const PROP_ULTIMA_LEITURA = 'ultimaLeitura';


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
    else if (act === 'setTurnoInicio')result = setTurnoInicio(p);
    else if (act === 'getMediaHoras') result = getMediaHoras();
    else if (act === 'getProdutos')   result = getProdutos();
    else if (act === 'setProdutoAtual')result = setProdutoAtual(p);
    else if (act === 'getPontosDia')  result = getPontosDia();
    else if (act === 'getProgramacaoHoje') result = getProgramacaoHoje();
    else if (act === 'getProgramacaoDetalhada') result = getProgramacaoDetalhada();
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
  // O failsafe NUNCA pode derrubar o painel: qualquer erro é apenas registrado.
  try { verificarNovoDia(); }
  catch (err) { Logger.log('verificarNovoDia falhou (ignorado): ' + err.message); }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_DADOS);

  if (!sh) return { ok: false, erro: 'Aba HORA_A_HORA nao encontrada.' };

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 5 || lastCol < 1) return { ok: false, erro: 'Planilha HORA_A_HORA sem dados.' };
  const data    = sh.getRange(1, 1, lastRow, lastCol).getValues();

  const metaDia = (data[2] && Number(data[2][1])) || 0;

  // C3 (linha 3, coluna C): hora de inicio do turno informada na planilha.
  //   5  => turno comeca as 05:00 (dia com hora extra matinal)
  //   7  => turno normal, comeca as 07:00 (padrao tambem quando vazio)
  // As linhas de 05:00 e 06:00 existem sempre na aba; este valor decide se elas
  // aparecem para o operador. Com C3=7, escondemos as horas anteriores as 07:00.
  const inicioTurnoCod = data[2] ? Number(data[2][2]) : 0;
  const turnoInicio    = inicioTurnoCod === 5 ? '05:00' : '07:00';
  const inicioTurnoMin = (inicioTurnoCod === 5 ? 5 : 7) * 60;

  const hIdx = 3;
  const hdr  = data[hIdx].map(c => String(c).trim().toUpperCase());

  const iH = hdr.indexOf('HORA');
  const iR = hdr.indexOf('REALIZADO');
  const iM = hdr.findIndex(c => c.includes('META'));

  if (iH < 0 || iR < 0 || iM < 0) {
    return { ok: false, erro: 'Cabecalho HORA / REALIZADO / META nao encontrado na linha 4.' };
  }

  // Colunas de lote (mesma deteccao de saveRealizado/arquivarDiaAtual). A producao
  // e lancada NESTAS colunas; a coluna REALIZADO pode ficar vazia ou parcial. Sem
  // somar os lotes, o painel mostra menos caixas do que o realmente produzido.
  const iLotes = [];
  for (let c = iR + 1; c < hdr.length; c++) {
    if (hdr[c].includes('LOTE') || hdr[c].includes('LT') || hdr[c].startsWith('L')) {
      iLotes.push(c);
    }
  }

  const hoje = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  const agora    = new Date();
  const agoraMin = Number(Utilities.formatDate(agora, TZ, 'H')) * 60 + Number(Utilities.formatDate(agora, TZ, 'm'));

  const slots = [];

  for (let i = hIdx + 1; i < data.length; i++) {
    const row     = data[i];
    const horaVal = String(row[iH] || '').trim();

    if (!horaVal) continue;
    if (horaVal.toUpperCase() === 'TOTAL') continue;

    const parts  = horaVal.split('-');
    const inicio = parts[0] ? parts[0].trim() : '';
    const fim    = parts[1] ? parts[1].trim() : '';

    // Respeita o inicio do turno (C3): com C3=7 os slots 05:00 e 06:00 nao vao
    // para o app; com C3=5 eles aparecem. Nao mexe nos rotulos, so filtra.
    const iniMin = inicio
      ? (Number(inicio.split(':')[0]) || 0) * 60 + (Number(inicio.split(':')[1]) || 0)
      : 0;
    if (inicio && iniMin < inicioTurnoMin) continue;

    const metaVal = Number(row[iM]) || 0;
    if (metaVal === 0) continue;

    const realRaw       = row[iR];
    const realVazio     = (realRaw === '' || realRaw === null || realRaw === undefined);
    const direto        = realVazio ? 0 : (Number(realRaw) || 0);

    // Soma das colunas de lote (onde a producao e de fato lancada).
    // Tambem coletamos cada lote individual (na ordem das colunas) para o app
    // mostrar lancamento a lancamento, como o operador via na planilha.
    let somaLotes = 0, temLote = false;
    const lotes = [];
    iLotes.forEach(c => {
      const v = row[c];
      if (v !== '' && v !== null && v !== undefined && !isNaN(Number(v))) {
        somaLotes += Number(v);
        temLote = true;
        lotes.push(Number(v));
      }
    });

    // A planilha orienta deixar REALIZADO em branco OU 0 para horas futuras (aba
    // HORA_A_HORA, coluna "COMO PREENCHER"). Um 0 sozinho, portanto, nao prova que a
    // hora aconteceu: so conta como "lancada" se ja tiver passado do horario de FIM
    // (hoje as 23:59 nunca zera errado, pois o turno ja acabou ha muito). Enquanto a
    // hora ainda esta aberta (nao terminou) e nao ha lote real lancado, fica pendente
    // (null) -- e isso mantem "horas restantes" corretas p/ Projecao e Ritmo Atual.
    const finMin = fim
      ? (Number(fim.split(':')[0]) || 0) * 60 + (Number(fim.split(':')[1]) || 0)
      : null;
    const horaAberta = finMin !== null && agoraMin < finMin;

    // Sem lote real: pendente se REALIZADO vazio OU a hora ainda nao terminou.
    // Com lote real lancado, conta sempre (mesmo em hora ainda aberta = parcial).
    const producaoHora = (!temLote && (realVazio || horaAberta))
      ? null
      : Math.max(direto, somaLotes);

    slots.push({
      id:           hoje + '_' + inicio.replace(':', ''),
      inicio,
      fim,
      label:        horaVal,
      metaHora:     metaVal,
      producaoHora,
      lotes,
      operador:     '',
      obs:          ''
    });
  }

  // Produto atual do turno (opcional — só existe se o operador selecionou no app).
  // Leitura barata (ScriptProperties), não bate na aba PRODUTO_CODIGO aqui para
  // manter getDados leve (caminho quente, sensível a timeout/cold start).
  const produtoAtual = PropertiesService.getScriptProperties().getProperty(PROP_PROD_ATUAL) || '';

  return {
    ok:          true,
    slots,
    turnoInicio,
    metaDia:     slots.reduce((s, sl) => s + sl.metaHora, 0) || metaDia,
    dataRef:     hoje,
    dadosDeHoje: true,
    planilha:    ss.getName(),
    aba:         SHEET_DADOS,
    produtoAtual
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
          registrarProducaoProduto(p.produto, inicio || horario, real, p.operador);
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
        registrarProducaoProduto(p.produto, inicio || horario, real, p.operador);
        return { ok: true, linha: i + 1, coluna: colunaEscrita, horario: cellHora, realizado: real };
      }
    }

    return { ok: false, erro: 'Slot nao encontrado: ' + horario };

  } finally {
    lock.releaseLock();
  }
}

// Loga a produção por hora/produto (opcional — só se o operador selecionou um
// produto no app). Também atualiza o "produto atual do turno". Chamada já sob o
// lock de saveRealizado; não mexe nas colunas de lote de HORA_A_HORA.
// Grava DESCRICAO/PONTOS/PESO_KG já calculados (snapshot no momento do lançamento)
// para facilitar relatório direto na planilha, sem precisar cruzar com PRODUTO_CODIGO.
function registrarProducaoProduto(codigo, horaInicio, caixas, operador) {
  codigo = String(codigo || '').trim();
  if (!codigo) return; // produto é opcional — nada a fazer

  PropertiesService.getScriptProperties().setProperty(PROP_PROD_ATUAL, codigo);

  const cx = Number(caixas) || 0;
  // Busca os dados do produto no catálogo para carimbar descrição/pontos/peso.
  let desc = '', pontos = 0, pesoKg = 0;
  const prod = lerCatalogoProdutos().filter(function (p) { return p.codigo === codigo; })[0];
  if (prod) {
    desc   = prod.desc || '';
    pontos = cx * (prod.pontos || 0);
    pesoKg = Math.round(cx * (prod.peso || 0) * 10) / 10;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_PROD_LOG);
  if (!sh) {
    sh = ss.insertSheet(SHEET_PROD_LOG);
    sh.appendRow(['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS', 'PONTOS', 'PESO_KG', 'OPERADOR']);
    sh.setFrozenRows(1);
  }
  const hoje = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  sh.appendRow([hoje, horaInicio, codigo, desc, cx, pontos, pesoKg, operador || '']);
}


// ════════════════════════════════════════════════════════
// DEFINIR INICIO DO TURNO (célula C3) — botão do operador
// ════════════════════════════════════════════════════════
// Grava 5 ou 7 em C3 (linha 3, coluna C) da aba HORA_A_HORA. É o mesmo valor
// que getDados() lê para decidir se os slots 05:00/06:00 aparecem. Assim o
// operador troca o início pelo app e reflete em mobile, TV e gerencial.
function setTurnoInicio(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_DADOS);
    if (!sh) return { ok: false, erro: 'Aba HORA_A_HORA nao encontrada.' };

    const cod = Number(p.inicio) === 5 ? 5 : 7;
    sh.getRange(3, 3).setValue(cod);   // C3
    return { ok: true, cod: cod, turnoInicio: cod === 5 ? '05:00' : '07:00' };
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
    sh.appendRow(['DATA','REALIZADO','META','EFICIENCIA %','MELHOR H.','PIOR H.','HE','FECHADO','FECHADO EM','MEDIA CX/H']);
    sh.setFrozenRows(1);
  }
  if (String(sh.getRange(1, 10).getValue()).trim() === '') sh.getRange(1, 10).setValue('MEDIA CX/H');

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
    String(p.fechadoEm || ''),
    Number(p.mediaH || 0)
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
      fechadoEm: fmtFechadoBR(r[8]),
      mediaH:    Number(r[9]) || 0
    }));

  return { ok: true, dias };
}


// ════════════════════════════════════════════════════════
// HISTÓRICO POR HORA (para média por horário / alerta de hora fraca)
// ════════════════════════════════════════════════════════

// Grava a produção de cada hora do dia na aba HISTORICO_HORA.
// Reescreve as linhas do mesmo dia se já existirem (idempotente).
function arquivarHorasDoDia(dataRef, horasArr) {
  if (!dataRef || !horasArr || !horasArr.length) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_HIST_HORA);
  if (!sh) {
    sh = ss.insertSheet(SHEET_HIST_HORA);
    sh.appendRow(['DATA', 'HORA', 'REALIZADO']);
    sh.setFrozenRows(1);
  }
  sh.getRange(1, 1, sh.getMaxRows(), 2).setNumberFormat('@'); // DATA e HORA como texto

  // Remove linhas já existentes deste dia (de baixo p/ cima)
  const vals = sh.getDataRange().getValues();
  for (let i = vals.length - 1; i >= 1; i--) {
    if (String(vals[i][0]) === String(dataRef)) sh.deleteRow(i + 1);
  }

  const novas = horasArr.map(h => [dataRef, h.hora, Number(h.real) || 0]);
  if (novas.length) {
    sh.getRange(sh.getLastRow() + 1, 1, novas.length, 3).setValues(novas);
  }
}

// Devolve a média de produção por horário (rótulo da HORA), com a amostra (nº de dias).
function getMediaHoras() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_HIST_HORA);
  if (!sh) return { ok: true, medias: {}, amostra: {} };

  const hoje = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  const rows = sh.getDataRange().getValues().slice(1);
  const soma = {}, cont = {};
  rows.forEach(r => {
    const data = String(r[0]).trim();
    const hora = String(r[1]).trim();
    const real = Number(r[2]) || 0;
    if (!hora || data === hoje) return; // ignora hoje (ainda em andamento) e linhas vazias
    soma[hora] = (soma[hora] || 0) + real;
    cont[hora] = (cont[hora] || 0) + 1;
  });

  const medias = {}, amostra = {};
  Object.keys(soma).forEach(h => {
    medias[h]  = Math.round(soma[h] / cont[h]);
    amostra[h] = cont[h];
  });
  return { ok: true, medias, amostra };
}


// ════════════════════════════════════════════════════════
// PRODUTOS (catálogo PRODUTO_CODIGO) + PRODUÇÃO EM PONTOS/PESO
// ════════════════════════════════════════════════════════
// Identificação de produto é OPCIONAL: o operador pode selecionar um produto no
// app (busca por código/descrição) para acompanhar pontos/peso no gerencial e na
// TV, mas o lançamento de caixas funciona normalmente sem produto selecionado.

// Lê o catálogo detectando colunas pelo NOME do cabeçalho (robusto a reordenação),
// no mesmo padrão de getDados/saveRealizado.
function lerCatalogoProdutos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PRODUTOS);
  if (!sh) return [];

  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2) return [];

  const data = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const hdr  = data[0].map(c => String(c).trim().toUpperCase().replace(/\s+/g, ' '));

  const iCod    = hdr.indexOf('CODIGO');
  const iDesc   = hdr.indexOf('DESCRICAO');
  const iPeso   = hdr.indexOf('P B');       // peso bruto (kg)
  const iEan    = hdr.indexOf('EAN 128');
  const iMedida = hdr.indexOf('MEDIDA DA CAIXA');
  const iVel    = hdr.indexOf('VELOCIDADE');
  const iEntre  = hdr.indexOf('ENTRE_PECA');
  const iPontos = hdr.indexOf('PONTOS');
  const iTroca  = hdr.indexOf('TEMPO DE TROCA MIN');

  if (iCod < 0) return [];

  const produtos = [];
  for (let i = 1; i < data.length; i++) {
    const row    = data[i];
    const codigo = String(row[iCod] || '').trim();
    if (!codigo) continue;
    produtos.push({
      codigo,
      desc:       iDesc   >= 0 ? String(row[iDesc] || '').trim() : '',
      peso:       iPeso   >= 0 ? Number(row[iPeso])   || 0 : 0,
      ean:        iEan    >= 0 ? String(row[iEan] || '').trim() : '',
      medida:     iMedida >= 0 ? Number(row[iMedida]) || 0 : 0,
      velocidade: iVel    >= 0 ? Number(row[iVel])    || 0 : 0,
      entrePeca:  iEntre  >= 0 ? Number(row[iEntre])  || 0 : 0,
      pontos:     iPontos >= 0 ? Number(row[iPontos]) || 0 : 0,
      tempoTroca: iTroca  >= 0 ? Number(row[iTroca])  || 0 : 0
    });
  }
  return produtos;
}

// Catálogo completo para a busca no app (operador digita código ou descrição).
function getProdutos() {
  return { ok: true, produtos: lerCatalogoProdutos() };
}

// Grava o produto escolhido pelo operador como "produto atual do turno".
function setProdutoAtual(p) {
  const codigo = String(p.codigo || '').trim();
  if (!codigo) return { ok: false, erro: 'Codigo obrigatorio.' };
  PropertiesService.getScriptProperties().setProperty(PROP_PROD_ATUAL, codigo);
  return { ok: true, produtoAtual: codigo };
}

// Produção do dia em PONTOS e PESO (kg), a partir do log PRODUCAO_PRODUTO.
// Usada só pelo gerencial/TV (fora do caminho quente do app do operador).
function getPontosDia() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PROD_LOG);

  const produtoAtual = PropertiesService.getScriptProperties().getProperty(PROP_PROD_ATUAL) || '';
  const catalogo = {};
  lerCatalogoProdutos().forEach(pr => { catalogo[pr.codigo] = pr; });
  const produtoAtualDesc = catalogo[produtoAtual] ? catalogo[produtoAtual].desc : '';

  // Programação/atraso (planejado x embalado). Independe de haver produção hoje.
  const programacao = calcularProgramacao();

  if (!sh) {
    return { ok: true, pontos: 0, pesoKg: 0, caixas: 0, produtoAtual, produtoAtualDesc, porProduto: [], porHora: [], programacao };
  }

  const hoje    = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  const hojeNum = dataParaNum(hoje);
  const values  = sh.getDataRange().getValues();

  // Detecta as colunas pelo cabeçalho (a aba pode ter DESCRICAO/PONTOS/PESO_KG/OPERADOR
  // além de DATA/HORA/CODIGO/CAIXAS). Fallback posicional p/ o formato antigo.
  const hdr = (values[0] || []).map(c => String(c).trim().toUpperCase());
  const iData = hdr.indexOf('DATA')   >= 0 ? hdr.indexOf('DATA')   : 0;
  const iHora = hdr.indexOf('HORA')   >= 0 ? hdr.indexOf('HORA')   : 1;
  const iCod  = hdr.indexOf('CODIGO') >= 0 ? hdr.indexOf('CODIGO') : 2;
  const iCx   = hdr.indexOf('CAIXAS') >= 0 ? hdr.indexOf('CAIXAS') : 3;
  const rows = values.slice(1);

  let pontos = 0, pesoKg = 0, caixas = 0;
  const porProdutoMap = {}, porHora = [];

  rows.forEach(r => {
    // dataParaNum() trata tanto texto "dd/MM/yyyy" quanto objeto Date: o Sheets
    // converte a data gravada por registrarProducaoProduto() de texto p/ Date
    // automaticamente, e uma comparação de texto (String(r[iData])!==hoje) nunca
    // batia — por isso pontos/peso/produto do dia apareciam sempre zerados.
    if (dataParaNum(r[iData]) !== hojeNum) return;
    const hora   = String(r[iHora]).trim();
    const codigo = String(r[iCod]).trim();
    const cx     = Number(r[iCx]) || 0;
    if (!codigo || !cx) return;

    const prod = catalogo[codigo] || { desc: '', pontos: 0, peso: 0 };
    const pts  = cx * (prod.pontos || 0);
    const kg   = cx * (prod.peso   || 0);

    pontos += pts; pesoKg += kg; caixas += cx;

    if (!porProdutoMap[codigo]) {
      porProdutoMap[codigo] = { codigo, desc: prod.desc || '', caixas: 0, pontos: 0, pesoKg: 0 };
    }
    porProdutoMap[codigo].caixas += cx;
    porProdutoMap[codigo].pontos += pts;
    porProdutoMap[codigo].pesoKg += kg;

    porHora.push({ hora, codigo, caixas: cx, pontos: pts, pesoKg: kg });
  });

  return {
    ok: true,
    pontos: Math.round(pontos),
    pesoKg: Math.round(pesoKg * 10) / 10,
    caixas,
    produtoAtual,
    produtoAtualDesc,
    porProduto: Object.values(porProdutoMap),
    porHora,
    programacao
  };
}


// ════════════════════════════════════════════════════════
// PROGRAMAÇÃO + ATRASO (planejado × embalado)
// ════════════════════════════════════════════════════════
// Aba PROGRAMACAO: DATA, CODIGO, QTDE (quanto embalar de cada produto por dia).
// O "atraso" ACUMULA DESDE SEMPRE por produto:
//   atraso[cod]      = max( programado(< hoje) - embalado(< hoje), 0 )
//   metaEfetiva[cod] = programado(hoje) + atraso[cod]
// Se um dia embala mais que o programado, o excedente abate o atraso (saldo se
// autocorrige). Depende do operador MARCAR o produto no lançamento (opcional).

// Converte uma célula de data (Date, "dd/MM/yyyy" ou "dd/MM") -> número yyyymmdd
// para comparar datas (0 se inválida). Sem ano ("dd/MM") assume o ano atual.
function dataParaNum(v) {
  let s;
  if (v instanceof Date) s = Utilities.formatDate(v, TZ, 'dd/MM/yyyy');
  else s = String(v || '').trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return Number(m[3]) * 10000 + Number(m[2]) * 100 + Number(m[1]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    const ano = Number(Utilities.formatDate(new Date(), TZ, 'yyyy'));
    return ano * 10000 + Number(m[2]) * 100 + Number(m[1]);
  }
  return 0;
}

// Chave de produto = só os dígitos do código. Une formatos diferentes: a aba
// PROGRAMACAO pode ter "501.118.001" e o PRODUTO_CODIGO/app "501118001".
function codKey(c) { return String(c || '').replace(/[^0-9]/g, ''); }

// Acha uma aba pelo nome tolerando acento/maiúscula diferente do esperado (ex.:
// constante diz "PROGRAMACAO" mas a aba real na planilha é "PROGRAMAÇÃO" —
// getSheetByName exige nome IDÊNTICO, incluindo acentos, e isso fazia a leitura
// de programação/atraso sempre voltar vazia, sem erro nenhum pra avisar).
function acharAbaTolerante(ss, nome) {
  const exata = ss.getSheetByName(nome);
  if (exata) return exata;
  const norm = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim(); };
  const alvo = norm(nome);
  const achada = ss.getSheets().filter(function (s) { return norm(s.getName()) === alvo; })[0];
  return achada || null;
}

// Lê a aba PROGRAMACAO. Detecta as colunas pelo cabeçalho, tolerando os nomes
// reais da planilha (Data, Codigo, Qtd_cx). Mantém a data crua (pode ser Date).
function lerProgramacao() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = acharAbaTolerante(ss, SHEET_PROG);
  if (!sh) return [];
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const hdr  = (values[0] || []).map(c => String(c).trim().toUpperCase());
  const acha = function () { for (let i = 0; i < arguments.length; i++) { const j = hdr.indexOf(arguments[i]); if (j >= 0) return j; } return -1; };
  const iData = acha('DATA');
  const iCod  = acha('CODIGO', 'COD');
  const iQtd  = acha('QTDE', 'QTD_CX', 'QTD', 'QUANTIDADE', 'QTD CX');
  // Tolerante a variações do cabeçalho (LOTE, LOTES, Nº LOTE, LOTE PRODUCAO...).
  const iLote = hdr.findIndex(function (h) { return h.includes('LOTE'); });
  const cData = iData >= 0 ? iData : 0;
  const cCod  = iCod  >= 0 ? iCod  : 2;
  const cQtd  = iQtd  >= 0 ? iQtd  : 4;
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    const codigo = String(r[cCod] || '').trim();
    const qtde   = Number(r[cQtd]) || 0;
    if (!codigo || !r[cData]) continue;
    // LOTE é opcional: aba pode nao ter a coluna ainda (compatibilidade).
    const lote = iLote >= 0 ? String(r[iLote] || '').trim() : '';
    out.push({ data: r[cData], codigo: codigo, qtde: qtde, lote: lote });
  }
  return out;
}

// Caixas embaladas por produto (chave = dígitos do código), separando ANTES de
// hoje e HOJE, e devolvendo a data do 1º registro (início do controle por produto).
function lerEmbaladoPorProduto(hojeNum) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PROD_LOG);
  const antes = {}, hoje = {};
  let inicio = 0;
  if (!sh) return { antes: antes, hoje: hoje, inicio: hojeNum };
  const values = sh.getDataRange().getValues();
  const hdr = (values[0] || []).map(c => String(c).trim().toUpperCase());
  const iData = hdr.indexOf('DATA')   >= 0 ? hdr.indexOf('DATA')   : 0;
  const iCod  = hdr.indexOf('CODIGO') >= 0 ? hdr.indexOf('CODIGO') : 2;
  const iCx   = hdr.indexOf('CAIXAS') >= 0 ? hdr.indexOf('CAIXAS') : 4;
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    const key = codKey(r[iCod]);
    const cx  = Number(r[iCx]) || 0;
    if (!key || !cx) continue;
    const dNum = dataParaNum(r[iData]);
    if (dNum === 0) continue;
    if (inicio === 0 || dNum < inicio) inicio = dNum;
    if (dNum < hojeNum)        antes[key] = (antes[key] || 0) + cx;
    else if (dNum === hojeNum) hoje[key]  = (hoje[key]  || 0) + cx;
  }
  return { antes: antes, hoje: hoje, inicio: inicio || hojeNum };
}

// Monta a lista por produto (programado hoje, atraso, embalado hoje, falta) e os
// totais + "meta efetiva" (programado de hoje + atraso).
// O atraso ACUMULA de qualquer programação passada ainda não embalada (sem
// limite de janela) — pedido explícito: pegar tudo que está atrasado, mesmo
// de antes do 1º lançamento por produto registrado em PRODUCAO_PRODUTO.
function calcularProgramacao() {
  const hoje    = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  const hojeNum = dataParaNum(hoje);

  // Catálogo indexado por dígitos do código (para desc + código "oficial" do app).
  const catByKey = {};
  lerCatalogoProdutos().forEach(pr => { catByKey[codKey(pr.codigo)] = pr; });

  const emb = lerEmbaladoPorProduto(hojeNum);

  const progHoje = {}, progAntes = {}, loteHoje = {};
  lerProgramacao().forEach(pr => {
    const key  = codKey(pr.codigo);
    const dNum = dataParaNum(pr.data);
    if (!key || dNum === 0) return;
    // Lote mais recente conhecido p/ esse produto, olhando hoje OU atraso (dias
    // anteriores) — assim um produto atrasado (programado num dia passado, ainda
    // não embalado) também é achável pelo lote, não só o programado de hoje.
    // Ignora lote de datas futuras (produto ainda nem está em pauta).
    if (pr.lote && dNum <= hojeNum && (!loteHoje[key] || dNum >= loteHoje[key].dNum)) {
      loteHoje[key] = { lote: pr.lote, dNum: dNum };
    }
    if (dNum === hojeNum) {
      progHoje[key] = (progHoje[key] || 0) + pr.qtde;
    }
    else if (dNum < hojeNum) progAntes[key] = (progAntes[key] || 0) + pr.qtde;
    // futuro: não vira atraso de hoje
  });

  const keys = {};
  Object.keys(progHoje).forEach(k => keys[k] = 1);
  Object.keys(progAntes).forEach(k => keys[k] = 1);
  Object.keys(emb.hoje).forEach(k => keys[k] = 1);

  const lista = [];
  let totMeta = 0, totProgHoje = 0, totAtraso = 0, totEmbHoje = 0;
  Object.keys(keys).forEach(key => {
    const ph = progHoje[key]  || 0;
    const pa = progAntes[key] || 0;
    const ea = emb.antes[key] || 0;
    const eh = emb.hoje[key]  || 0;
    const atraso      = Math.max(pa - ea, 0);
    const metaEfetiva = ph + atraso;
    const falta       = Math.max(metaEfetiva - eh, 0);
    if (ph === 0 && atraso === 0 && eh === 0) return; // nada a mostrar
    const prod = catByKey[key];
    lista.push({
      codigo: prod ? prod.codigo : key,
      desc:   prod ? prod.desc   : '',
      lote:   loteHoje[key] ? loteHoje[key].lote : '',
      programadoHoje: ph,
      atraso: atraso,
      embaladoHoje: eh,
      metaEfetiva: metaEfetiva,
      falta: falta
    });
    totMeta += metaEfetiva; totProgHoje += ph; totAtraso += atraso; totEmbHoje += eh;
  });
  lista.sort((a, b) => b.falta - a.falta); // maior falta primeiro

  return {
    lista: lista,
    metaEfetiva: totMeta,
    programadoHoje: totProgHoje,
    atrasoTotal: totAtraso,
    embaladoHoje: totEmbHoje
  };
}

// Lista enxuta para o app do operador: produtos programados para hoje OU em
// atraso (o que ele deve rodar), para seleção rápida sem varrer o catálogo todo.
function getProgramacaoHoje() {
  const p = calcularProgramacao();
  const produtos = p.lista
    .filter(x => x.programadoHoje > 0 || x.atraso > 0)
    .map(x => ({ codigo: x.codigo, desc: x.desc, lote: x.lote, qtde: x.programadoHoje, atraso: x.atraso, falta: x.falta }));
  return { ok: true, produtos, metaEfetiva: p.metaEfetiva, atrasoTotal: p.atrasoTotal };
}

// Programação linha a linha (sem agregar por produto), para a tela dedicada:
// lote, peso e pontos estimados (via catálogo) de cada item, agrupável por dia
// no app. Cobre passado, hoje e futuro (é só o planejamento, não o atraso).
function getProgramacaoDetalhada() {
  const catByKey = {};
  lerCatalogoProdutos().forEach(pr => { catByKey[codKey(pr.codigo)] = pr; });

  const itens = lerProgramacao().map(function (pr) {
    const dNum = dataParaNum(pr.data);
    const cat  = catByKey[codKey(pr.codigo)];
    const qtde = pr.qtde || 0;
    return {
      data:    normalizarDataBR(pr.data),
      dataNum: dNum,
      lote:    pr.lote || '',
      codigo:  cat ? cat.codigo : pr.codigo,
      desc:    cat ? cat.desc   : '',
      qtde:    qtde,
      pesoKg:  Math.round(qtde * (cat ? cat.peso   : 0) * 10) / 10,
      pontos:  Math.round(qtde * (cat ? cat.pontos : 0))
    };
  }).filter(function (it) { return it.dataNum > 0; });

  itens.sort(function (a, b) { return a.dataNum - b.dataNum; });
  return { ok: true, itens: itens };
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

// Roda dentro de getDados() (sempre protegido por try/catch — nunca derruba o
// painel). Decide com segurança se a planilha contém dados de um dia anterior:
//   • Carimbo FORTE ('dataDados'): gravado em cada lançamento real (onEdit/app).
//     Prova a data dos dados → fecha em QUALQUER HORÁRIO.
//   • Carimbo FRACO ('ultimaLeitura'): dia da última leitura do painel. Usado
//     como recuperação se o forte faltar; só fecha de madrugada (antes do turno)
//     para nunca apagar produção já lançada hoje.
//   • Dados de HOJE ou planilha sem produção → NÃO faz nada.
function verificarNovoDia() {
  const props = PropertiesService.getScriptProperties();
  const agora = new Date();
  const hoje  = Utilities.formatDate(agora, TZ, 'dd/MM/yyyy');

  const stamp      = props.getProperty(PROP_DATA_DADOS);
  const ultLeitura = props.getProperty(PROP_ULTIMA_LEITURA);
  props.setProperty(PROP_ULTIMA_LEITURA, hoje); // registra a leitura de hoje

  const carimbo = stamp || ultLeitura;
  if (!carimbo)         return; // nunca houve produção/leitura — nada a fechar
  if (carimbo === hoje) return; // dados são de hoje (turno em andamento) — jamais zera

  // Sem produção pendente: nada a arquivar; só limpa o carimbo forte.
  if (!planilhaTemProducao()) { props.deleteProperty(PROP_DATA_DADOS); return; }

  // Sem carimbo forte, só zera de madrugada (antes do turno) — segurança extra.
  if (!stamp && Number(Utilities.formatDate(agora, TZ, 'HH')) >= HORA_INICIO) return;

  executarReset(carimbo, props);
}

// true se há qualquer realizado/lote > 0 na planilha (produção pendente).
function planilhaTemProducao() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_DADOS);
  if (!sh) return false;

  const data = sh.getDataRange().getValues();
  const hIdx = 3;
  if (data.length <= hIdx) return false;

  const hdr = data[hIdx].map(c => String(c).trim().toUpperCase());
  const iH  = hdr.indexOf('HORA');
  const iR  = hdr.indexOf('REALIZADO');
  if (iR < 0) return false;

  for (let i = hIdx + 1; i < data.length; i++) {
    const hora = String(data[i][iH] || '').trim().toUpperCase();
    if (!hora || hora === 'TOTAL') continue;
    for (let c = iR; c <= Math.min(12, data[i].length - 1); c++) {
      const v = data[i][c];
      if (v !== '' && v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) > 0) return true;
    }
  }
  return false;
}

// Arquiva o dia informado no HISTÓRICO e zera o REALIZADO.
// Se limparRealizado() falhar, a exceção sobe e o getDados() apenas registra o
// erro e tenta de novo na próxima leitura (auto-recuperação, sem travar o painel).
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
  if (data.length <= hIdx) return;
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

  // Identifica colunas de lote (mesmo critério de saveRealizado) para não somar
  // colunas de fórmula como ACUM ou %/H que aparecem após REALIZADO na planilha.
  const iLotes = [];
  for (let c = iR + 1; c < hdr.length; c++) {
    if (hdr[c].includes('LOTE') || hdr[c].includes('LT') || hdr[c].startsWith('L')) {
      iLotes.push(c);
    }
  }

  const num = (v) =>
    (v === '' || v === null || v === undefined || isNaN(Number(v))) ? 0 : Number(v);

  let real = 0, meta = 0, he = 0, melhor = 0, pior = null, horas = 0;
  const horasArr = []; // {hora, real} por hora produtiva (não-HE) para a média por horário

  for (let i = hIdx + 1; i < data.length; i++) {
    const row  = data[i];
    const hora = String(row[iH] || '').trim();
    if (!hora || hora.toUpperCase() === 'TOTAL') continue;

    const ehHE    = hora.toUpperCase().startsWith('HE');
    const metaVal = Number(row[iM]) || 0;

    // Realizado da linha = coluna REALIZADO ou, se vazia, soma apenas dos lotes.
    const direto = num(row[iR]);
    let somaLotes = 0;
    iLotes.forEach(c => { somaLotes += num(row[c]); });
    const realVal = Math.max(direto, somaLotes);

    if (metaVal > 0 && !ehHE) meta += metaVal;

    if (realVal > 0) {
      real += realVal;
      if (ehHE) {
        he++;
      } else {
        horas++; // horas produtivas (não-HE) para a média cx/h
        if (realVal > melhor) melhor = realVal;
        if (pior === null || realVal < pior) pior = realVal;
        horasArr.push({ hora: hora, real: realVal });
      }
    }
  }

  if (real <= 0) return; // nada produzido — nada a arquivar

  arquivarHorasDoDia(dataRef, horasArr); // grava a produção por hora p/ média por horário

  const ef = meta > 0 ? Number((real / meta * 100).toFixed(1)) : 0;
  const mediaH = horas > 0 ? Math.round(real / horas) : 0;

  let shH = ss.getSheetByName(SHEET_HIST);
  if (!shH) {
    shH = ss.insertSheet(SHEET_HIST);
    shH.appendRow(['DATA','REALIZADO','META','EFICIENCIA %','MELHOR H.','PIOR H.','HE','FECHADO','FECHADO EM','MEDIA CX/H']);
    shH.setFrozenRows(1);
  }
  // Garante o cabeçalho da coluna de média mesmo em planilhas antigas.
  if (String(shH.getRange(1, 10).getValue()).trim() === '') shH.getRange(1, 10).setValue('MEDIA CX/H');
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
    'AUTO ' + Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm'),
    mediaH
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

// Normaliza datas para dd/MM/yyyy. Aceita Date, "dd/MM/yyyy", "d/m", "d/m/aa".
// Datas sem ano assumem o ano atual; ano com 2 digitos vira 20xx.
function normalizarDataBR(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'dd/MM/yyyy');
  const s = String(v == null ? '' : v).trim();
  if (!s) return '';
  const m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return s; // formato desconhecido: devolve como veio
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  let y = m[3] ? parseInt(m[3], 10) : Number(Utilities.formatDate(new Date(), TZ, 'yyyy'));
  if (y < 100) y += 2000;
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return s;
  return ('0' + d).slice(-2) + '/' + ('0' + mo).slice(-2) + '/' + y;
}

function fmtDataBR(v) {
  return normalizarDataBR(v);
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

// ════════════════════════════════════════════════════════
// MANUTENÇÃO
// ════════════════════════════════════════════════════════

// Corrige datas malformadas na coluna DATA do HISTORICO (ex.: "2/6" -> "02/06/2026").
// Rode UMA VEZ pelo editor do Apps Script (selecione a função e clique em Executar).
function corrigirDatasHistorico() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_HIST);
  if (!sh) return { ok: false, erro: 'Aba HISTORICO nao encontrada.' };

  const last = sh.getLastRow();
  if (last < 2) return { ok: true, corrigidas: 0 };

  const vals = sh.getRange(2, 1, last - 1, 1).getValues();
  let mudou = 0;
  for (let i = 0; i < vals.length; i++) {
    const orig = vals[i][0];
    const novo = normalizarDataBR(orig);
    if (novo && novo !== String(orig)) {
      const cell = sh.getRange(2 + i, 1);
      cell.setNumberFormat('@');
      cell.setValue(novo);
      mudou++;
      Logger.log('Corrigido: "' + orig + '" -> "' + novo + '"');
    }
  }
  Logger.log('Total de datas corrigidas no HISTORICO: ' + mudou);
  return { ok: true, corrigidas: mudou };
}

