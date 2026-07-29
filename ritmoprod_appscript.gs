// ════════════════════════════════════════════════════════
// RitmoProd · Apps Script — Google Sheets
// Versão: 4.8 — fecha o dia às 23:59 (Brasília) e zera à prova de erros
//               + failsafe do fechamento roda em BACKGROUND (não bloqueia a
//                 leitura da TV num cold start; ver agendarResetEmBackground)
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
const SHEET_TIPOS_PAR = 'TIPOS_PARADA';       // lista editável dos tipos de parada (dropdown do mobile)
const SHEET_PRODUTOS  = 'PRODUTO_CODIGO';   // catálogo de produtos (código, descrição, pontos, peso...)
const SHEET_PROD_LOG  = 'PRODUCAO_PRODUTO'; // log de caixas lançadas por hora/produto
const SHEET_PROG      = 'PROGRAMACAO';      // programação: DATA, CODIGO, QTDE (planejado por dia/produto)
const SHEET_HIST_FAM  = 'HISTORICO_MEDIA_FAMILIA'; // item 5: histórico de produtividade por família (append-only)
const SHEET_CONFIG    = 'CONFIG_PAINEL';        // config do ciclo de telas da TV, compartilhada entre aparelhos
const SHEET_PROG_ARQ  = 'PROGRAMACAO_CONCLUIDA'; // lotes já finalizados, tirados da PROGRAMACAO (ver ARQ_* abaixo)

// ════════════════════════════════════════════════════════
// ARQUIVAMENTO DE LOTE CONCLUÍDO  (tira a linha da PROGRAMACAO)
// ════════════════════════════════════════════════════════
// Quando o lote termina, a linha sai da aba PROGRAMACAO e vai para a aba
// PROGRAMACAO_CONCLUIDA (criada sozinha na 1ª vez), com o número final de
// PRODUZIDO/SALDO/STATUS congelado e a data do arquivamento.
//
// ⚠ POR QUE MOVER E NÃO SIMPLESMENTE APAGAR: a PROGRAMACAO é a única fonte da
// DEMANDA. A produção fica no log PRODUCAO_PRODUTO, que NÃO tem lote e nunca é
// apagado. calcularProgramacao() casa os dois por FIFO (a produção abate o lote
// aberto mais antigo do mesmo código). Se a linha do lote concluído some de vez,
// a produção que ela consumiu fica "solta" e passa a abater OUTRO lote do mesmo
// código — que aparece produzido sem ter produzido, e o atraso encolhe sozinho.
// Por isso lerProgramacao(true) continua lendo as arquivadas SÓ para alimentar o
// FIFO: o cálculo fica idêntico ao de antes, e a aba de trabalho fica limpa.
//
// ARQ_MODO:
//   'LOTE'  → só arquiva quando TODAS as linhas do lote estão concluídas (as
//             linhas do lote saem juntas). É o padrão.
//   'LINHA' → arquiva cada linha assim que ela conclui (o lote sai em pedaços).
//   'OFF'   → não arquiva nada (comportamento antigo).
const ARQ_MODO = 'LINHA';

// Dias de carência antes de tirar da aba (0 = sai assim que conclui;
// 1 = só no dia seguinte, dando margem para corrigir um lançamento errado).
const ARQ_DIAS_CARENCIA = 0;

// ⚠ true = APAGA a linha sem guardar cópia (não alimenta mais o FIFO). É o
// "excluir de vez": a aba fica limpa, mas os saldos e o atraso de outros lotes
// do mesmo código passam a mudar sozinhos, e o planejado antigo se perde.
// Só ligue sabendo disso.
const ARQ_EXCLUIR_SEM_COPIA = false;

// Produto selecionado pelo operador ("produto atual do turno" — opcional).
const PROP_PROD_ATUAL = 'produtoAtual';

// Fuso fixo para os rótulos de data/arquivamento (independe do fuso do projeto).
const TZ = 'America/Sao_Paulo';

// ════════════════════════════════════════════════════════
// FAMÍLIAS DE PRODUTO (agrupamento amplo do comparativo por período)
// A planilha não tem coluna de "família", então ela é DEDUZIDA da descrição:
// tira o prefixo de volume ("VOL 1/1", "VOL 1/2") e um "KIT n" inicial, e casa
// o começo do texto com a lista abaixo (o casamento MAIS LONGO vence — por isso
// "MESA CABECEIRA" precisa vir antes de um eventual "MESA"). Sem casar, a
// família vira a 1ª palavra do texto.
// ► Para incluir/ajustar famílias, edite esta lista (é só isto que muda). ◄
const FAMILIAS = [
  'MESA CABECEIRA', 'MESA CENTRO', 'MESA JANTAR', 'MESA',
  'CANT CAFE',
  'COMODA SAPATEIRA', 'COMODA',
  'PENTEADEIRA CAMARIM', 'PENTEADEIRA',
  'MODULO RIPADO', 'MODULO',
  'GUARDA ROUPA', 'CRIADO MUDO',
  'RACK', 'ESCRIVANINHA', 'SAPATEIRA', 'BANQUETA', 'LIVREIRO', 'BUFFET',
  'PAINEL', 'BALCAO', 'ARMARIO', 'NICHO', 'PRATELEIRA', 'ESTANTE', 'APARADOR',
  'CADEIRA', 'POLTRONA', 'BANCADA', 'GABINETE'
];

// Nome do MODELO já limpo (só tira o prefixo de volume "VOL 1/1"): mantém o
// nome do produto, ex.: "VOL 1/1 RACK INTENSE" -> "RACK INTENSE". Diferente de
// familiaDoNome, que colapsa para a família ampla ("RACK").
function limpaNomeModelo(desc) {
  return String(desc || '').toUpperCase().trim()
    .replace(/^VOL\.?\s*\d+\s*\/\s*\d+\s*/, '').trim();
}

// Deriva a família (ampla) a partir da descrição do produto. Ver comentário da
// lista FAMILIAS. Devolve '' se não sobrar texto útil.
function familiaDoNome(desc) {
  let s = String(desc || '').toUpperCase().trim();
  s = s.replace(/^VOL\.?\s*\d+\s*\/\s*\d+\s*/, '').trim(); // tira "VOL 1/1", "VOL 1/2"
  s = s.replace(/^KIT\s*\d*\s*/, '').trim();               // tira "KIT", "KIT 2"
  if (!s) return '';
  // Casa o começo com a família mais longa possível (lista já vem do mais
  // específico p/ o mais genérico; garante o mais longo comparando comprimento).
  let melhor = '';
  for (let i = 0; i < FAMILIAS.length; i++) {
    const f = FAMILIAS[i];
    if ((s === f || s.indexOf(f + ' ') === 0) && f.length > melhor.length) melhor = f;
  }
  return melhor || s.split(' ')[0];
}

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
    else if (act === 'getParadasPeriodo') result = getParadasPeriodo(p);
    else if (act === 'endParada')     result = endParada(p);
    else if (act === 'getTiposParada')result = getTiposParada();
    else if (act === 'saveRealizado') result = saveRealizado(p);
    else if (act === 'setTurnoInicio')result = setTurnoInicio(p);
    else if (act === 'getMediaHoras') result = getMediaHoras();
    else if (act === 'getHoraDia')    result = getHoraDia(p);
    else if (act === 'getProdutos')   result = getProdutos();
    else if (act === 'setProdutoAtual')result = setProdutoAtual(p);
    else if (act === 'getPontosDia')  result = getPontosDia();
    else if (act === 'getProducaoModeloPeriodo') result = getProducaoModeloPeriodo(p);
    else if (act === 'getProgramacaoHoje') result = getProgramacaoHoje();
    else if (act === 'getProgramacaoDetalhada') result = getProgramacaoDetalhada();
    else if (act === 'setConfigPainel') result = setConfigPainel(p);
    else if (act === 'getConfigPainel') result = { ok: true, painelConfig: getConfigPainel() };
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
    // IDEMPOTÊNCIA: se este lançamento (lancId) já foi processado, devolve o
    // resultado anterior SEM gravar de novo. Protege contra o retry do app após
    // timeout/cold start, que antes gerava um lote duplicado (produção inflada).
    // O lock acima garante que dois envios simultâneos do mesmo id serializam.
    const lancId = String(p.lancId || '').trim();
    const cache  = lancId ? CacheService.getScriptCache() : null;
    if (cache) {
      const prev = cache.get('lanc_' + lancId);
      if (prev) { const r = JSON.parse(prev); r.duplicado = true; return r; }
    }

    const resultado = _saveRealizadoCore(p);

    // Só memoriza quando de fato gravou (ok:true): uma falha transitória não pode
    // ficar "presa" no cache impedindo uma nova tentativa real de gravar.
    if (cache && resultado && resultado.ok) {
      cache.put('lanc_' + lancId, JSON.stringify(resultado), 7200); // 2h de janela
    }

    // Itens 1 e 3: a cada lançamento efetivo, sincroniza a meta do dia e o saldo
    // dos lotes na planilha. Em try/catch: uma falha aqui NUNCA pode derrubar o
    // lançamento (que já foi gravado com sucesso acima).
    if (resultado && resultado.ok) {
      try { sincronizarPlanilhaPosLancamento(); }
      catch (e) { Logger.log('sincronizarPlanilha falhou (ignorado): ' + e.message); }
    }
    return resultado;

  } finally {
    lock.releaseLock();
  }
}

// Núcleo do lançamento — grava o realizado numa coluna de LOTE de HORA_A_HORA.
// Separado de saveRealizado só para permitir a checagem de idempotência acima.
// Roda já sob o lock adquirido por saveRealizado; não adquire lock próprio.
function _saveRealizadoCore(p) {
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

  // Item 5: histórico de produtividade por FAMÍLIA. Não pode derrubar o lançamento
  // se falhar — por isso o try/catch.
  try { registrarHistoricoFamilia(codigo, horaInicio, cx, desc, pontos, pesoKg); }
  catch (e) { Logger.log('registrarHistoricoFamilia falhou (ignorado): ' + e.message); }
}

// ════════════════════════════════════════════════════════
// ITEM 5 — HISTÓRICO DE MÉDIA POR HORA POR FAMÍLIA (append-only)
// ════════════════════════════════════════════════════════
// Grava, a CADA lançamento, um novo registro na aba HISTORICO_MEDIA_FAMILIA, sem
// apagar/sobrescrever os anteriores (base para análise histórica por família).
// Código da Família = os 6 PRIMEIROS DÍGITOS do código do produto
// (ex.: 501094001 -> 501094), o mesmo agrupamento "modelo" usado no restante do
// sistema. Média (Cx/h) = caixas do próprio lançamento (a janela é a hora).
function registrarHistoricoFamilia(codigo, horaInicio, caixas, desc, pontos, pesoKg) {
  const fam = codKey(codigo).slice(0, 6);
  if (!fam) return; // sem código de família válido, nada a gravar

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_HIST_FAM);
  if (!sh) {
    sh = ss.insertSheet(SHEET_HIST_FAM);
    sh.appendRow(['DATA', 'HORA', 'CODIGO_FAMILIA', 'DESCRICAO', 'CAIXAS', 'PESO_KG', 'PONTOS', 'MEDIA_CX_H']);
    sh.setFrozenRows(1);
  }
  const hoje = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  const cx   = Number(caixas) || 0;
  sh.appendRow([hoje, horaInicio, fam, desc || '', cx, Number(pesoKg) || 0, Number(pontos) || 0, cx]);
}


// ════════════════════════════════════════════════════════
// ITENS 1 e 3 — SINCRONIZAR META DO DIA E SALDO NA PLANILHA
// ════════════════════════════════════════════════════════
// Roda após cada lançamento (e a meta também no refresh do gerencial). É sempre
// chamada dentro de try/catch pelos callers: um erro aqui NUNCA pode quebrar o
// lançamento nem a leitura do painel. Recebe a programação já calculada para
// evitar recalcular calcularProgramacao() duas vezes.
function sincronizarPlanilhaPosLancamento() {
  const prog = calcularProgramacao();
  try { gravarMetaDiaNaPlanilha(prog); }      catch (e) { Logger.log('meta sync: '  + e.message); }
  try { atualizarSaldoNaProgramacao(prog); }  catch (e) { Logger.log('saldo sync: ' + e.message); }
  // Por último: o lote que fechou sai da aba já com o número final gravado acima.
  // Roda sob o lock de saveRealizado (não pega lock próprio, senão trava a si mesmo).
  try { arquivarLotesConcluidos(prog); }      catch (e) { Logger.log('arquivar lote: ' + e.message); }
}

// Item 1: grava a META DO DIA (quantidade programada para hoje) na célula B3 da
// aba HORA_A_HORA, para alimentar os indicadores do painel. Só grava quando o
// valor MUDA (idempotente) e nunca sobrescreve uma fórmula existente na célula.
function gravarMetaDiaNaPlanilha(prog) {
  prog = prog || calcularProgramacao();
  const meta = Number(prog.programadoHoje) || 0;
  if (meta <= 0) return; // sem programação para hoje: não mexe na meta atual

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_DADOS);
  if (!sh) return;
  const cell = sh.getRange(3, 2); // B3 = meta do dia (mesma célula lida por getDados)
  if (cell.getFormula()) return;  // respeita meta por fórmula, não sobrescreve
  const atual = Number(cell.getValue()) || 0;
  if (atual !== meta) cell.setValue(meta);
}

// Item 3: escreve o saldo na PRÓPRIA aba PROGRAMACAO (aposentou a antiga aba
// SALDO_LOTE). Assim o operador vê produzido/saldo/status na mesma linha em que
// digita o volume e marca FORA_ESTEIRA — facilitando a limpeza de volumes.
//
// Regras de segurança:
//  - NUNCA sobrescreve as colunas de digitação (DATA, CODIGO, QTDE, LOTE,
//    FORA_ESTEIRA). Só escreve nas colunas de saída, criadas à direita se não
//    existirem, e escreve UMA COLUNA POR VEZ (jamais um bloco que pegue colunas
//    de entrada no meio).
//  - O produzido é medido POR PRODUTO (o log não separa por lote), então o saldo
//    é gravado na linha do LOTE ATIVO de cada produto (a que o painel considera
//    em andamento) — mesma semântica da antiga SALDO_LOTE. Linhas de datas
//    futuras / outros lotes ficam em branco pra não parecer já produzido.
//  - Linha marcada FORA_ESTEIRA vira STATUS = "FORA DA ESTEIRA" e não conta.
//  - Cada rodada reescreve TODAS as linhas (em branco onde não se aplica), então
//    valores antigos são limpos automaticamente.
function atualizarSaldoNaProgramacao(prog) {
  prog = prog || calcularProgramacao();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = acharAbaTolerante(ss, SHEET_PROG);
  if (!sh) return;

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return;

  const hdr  = (values[0] || []).map(c => String(c).trim().toUpperCase());
  const acha = function () { for (let i = 0; i < arguments.length; i++) { const j = hdr.indexOf(arguments[i]); if (j >= 0) return j; } return -1; };
  const iData = acha('DATA') >= 0 ? acha('DATA') : 0;
  const iCod  = acha('CODIGO', 'COD') >= 0 ? acha('CODIGO', 'COD') : 2;
  const iQtd  = acha('QTDE', 'QTD_CX', 'QTD', 'QUANTIDADE', 'QTD CX') >= 0 ? acha('QTDE', 'QTD_CX', 'QTD', 'QUANTIDADE', 'QTD CX') : 5;
  const iLote = hdr.findIndex(function (h) { return h.includes('LOTE'); });
  const iFora = hdr.findIndex(function (h) { return h.includes('FORA'); });
  const hojeNum = dataParaNum(Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy'));

  // Garante as colunas de saída. Se faltarem, cria à DIREITA (contíguas), nunca
  // no meio das colunas de entrada. Reaproveita as que já existem.
  const OUT = ['PRODUZIDO', 'SALDO', 'PERCENTUAL', 'STATUS', 'ATUALIZADO_EM'];
  let nCols = hdr.length;
  const outIdx = {};
  OUT.forEach(function (name) {
    let j = hdr.indexOf(name);
    if (j < 0) { j = nCols++; sh.getRange(1, j + 1).setValue(name); }
    outIdx[name] = j;
  });

  // Saldo POR LOTE, vindo da alocação FIFO de calcularProgramacao() (chave
  // "digitosDoCodigo|lote|dataNum"). Cada linha de lote recebe o SEU saldo — então
  // somar a coluna SALDO passa a bater com o total (antes só a linha do lote ativo
  // recebia valor, e o produzido era só o de hoje, o que não fechava).
  const saldoMap = prog.saldoLinha || {};

  const agora = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss');
  const cols = {}; OUT.forEach(function (n) { cols[n] = []; });

  for (let i = 1; i < values.length; i++) {
    const r      = values[i];
    const codigo = String(r[iCod] || '').trim();
    const key    = codKey(codigo);
    const lote   = iLote >= 0 ? String(r[iLote] || '').trim() : '';
    const fora   = iFora >= 0 ? String(r[iFora] || '').trim() !== '' : false;
    const dNum   = dataParaNum(r[iData]);
    const temLinha = codigo && r[iData];

    let produzido = '', saldo = '', pct = '', status = '', quando = '';

    if (!temLinha) {
      // linha vazia/rascunho: não escreve nada
    } else if (fora) {
      status = 'FORA DA ESTEIRA';
      quando = agora;
    } else if (dNum > 0 && dNum <= hojeNum) {
      // Lote já vencido ou de hoje: pega o saldo alocado FIFO para esta linha.
      const lk = key + '|' + lote + '|' + dNum;
      if (saldoMap[lk] != null) {
        const qtde = Number(r[iQtd]) || 0;
        saldo      = Math.max(saldoMap[lk], 0);
        produzido  = Math.max(qtde - saldo, 0);
        pct        = qtde > 0 ? Math.round(produzido / qtde * 100) : 0;
        status     = (qtde > 0 && saldo <= 0) ? 'CONCLUIDO'
                   : (produzido > 0)          ? 'EM ANDAMENTO'
                   :                            'PENDENTE';
        quando     = agora;
      }
    }
    // demais linhas (futuras / sem correspondência): ficam em branco

    cols['PRODUZIDO'].push([produzido]);
    cols['SALDO'].push([saldo]);
    cols['PERCENTUAL'].push([pct]);
    cols['STATUS'].push([status]);
    cols['ATUALIZADO_EM'].push([quando]);
  }

  // Escreve UMA COLUNA POR VEZ — jamais um bloco que possa cair sobre colunas de
  // entrada que estejam entre as de saída.
  const nRows = values.length - 1;
  OUT.forEach(function (name) {
    sh.getRange(2, outIdx[name] + 1, nRows, 1).setValues(cols[name]);
  });
}


// ════════════════════════════════════════════════════════
// LOTE CONCLUÍDO SAI DA PROGRAMACAO  (ver bloco ARQ_* no topo)
// ════════════════════════════════════════════════════════
// Roda depois de atualizarSaldoNaProgramacao(), quando PRODUZIDO/SALDO/STATUS já
// estão gravados — assim o que vai para o arquivo é o número final.
//
// Falha segura por construção: uma linha só é elegível quando o FIFO devolveu um
// saldo <= 0 para ELA (chave codigo|lote|data). Se calcularProgramacao() falhar
// ou vier vazio, nenhum saldo casa e nada é arquivado — nunca o contrário.

function arquivarLotesConcluidos(prog) {
  if (ARQ_MODO !== 'LOTE' && ARQ_MODO !== 'LINHA') return { ok: true, arquivadas: 0, motivo: 'ARQ_MODO=' + ARQ_MODO };
  return _arquivarConcluidos(prog, false);
}

// Carência: quantos dias o lote precisa ter antes de sair da aba.
function _carenciaOk(dNum, hojeNum) {
  if (!(ARQ_DIAS_CARENCIA > 0)) return true;
  const d = function (n) { return new Date(Math.floor(n / 10000), Math.floor(n / 100) % 100 - 1, n % 100); };
  return (d(hojeNum) - d(dNum)) / 86400000 >= ARQ_DIAS_CARENCIA;
}

// simular=true → devolve o que SAIRIA da aba sem tocar em nada.
function _arquivarConcluidos(prog, simular) {
  prog = prog || calcularProgramacao();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = acharAbaTolerante(ss, SHEET_PROG);
  if (!sh) return { ok: true, arquivadas: 0 };

  const values = sh.getDataRange().getValues();
  if (values.length < 2) return { ok: true, arquivadas: 0 };

  const hdr  = (values[0] || []).map(c => String(c).trim().toUpperCase());
  const acha = function () { for (let i = 0; i < arguments.length; i++) { const j = hdr.indexOf(arguments[i]); if (j >= 0) return j; } return -1; };
  const iData = acha('DATA') >= 0 ? acha('DATA') : 0;
  const iCod  = acha('CODIGO', 'COD') >= 0 ? acha('CODIGO', 'COD') : 2;
  const iQtd  = acha('QTDE', 'QTD_CX', 'QTD', 'QUANTIDADE', 'QTD CX') >= 0 ? acha('QTDE', 'QTD_CX', 'QTD', 'QUANTIDADE', 'QTD CX') : 5;
  const iLote = hdr.findIndex(function (h) { return h.includes('LOTE'); });
  const iFora = hdr.findIndex(function (h) { return h.includes('FORA'); });
  const hojeNum  = dataParaNum(Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy'));
  const saldoMap = prog.saldoLinha || {};

  // 1) Classifica cada linha da aba.
  const linhas = [];
  for (let i = 1; i < values.length; i++) {
    const r      = values[i];
    const codigo = String(r[iCod] || '').trim();
    const dNum   = dataParaNum(r[iData]);
    const lote   = iLote >= 0 ? String(r[iLote] || '').trim() : '';
    const qtde   = Number(r[iQtd]) || 0;
    const fora   = iFora >= 0 ? String(r[iFora] || '').trim() !== '' : false;

    let estado;
    if (!codigo || !r[iData] || dNum === 0) estado = 'IGNORAR';   // linha vazia / rascunho
    else if (!lote)        estado = 'ABERTA';   // sem lote: lançamento incompleto, nunca sai
    else if (dNum > hojeNum) estado = 'ABERTA'; // programada para frente, ainda nem venceu
    else if (fora)         estado = 'FORA';     // fechada fora da esteira: não prende nem conclui
    else {
      const s = saldoMap[codKey(codigo) + '|' + lote + '|' + dNum];
      estado = (s != null && qtde > 0 && s <= 0) ? 'CONCLUIDA' : 'ABERTA';
    }
    linhas.push({ i: i, lote: lote, dNum: dNum, codigo: codigo, estado: estado });
  }

  // 2) Escolhe o que sai.
  const alvo = {};
  if (ARQ_MODO === 'LINHA') {
    linhas.forEach(function (l) {
      if (l.estado === 'CONCLUIDA' && _carenciaOk(l.dNum, hojeNum)) alvo[l.i] = true;
    });
  } else {
    // Por LOTE: as linhas do lote saem juntas, e só quando nenhuma segue aberta.
    const grupos = {};
    linhas.forEach(function (l) {
      if (l.estado === 'IGNORAR' || !l.lote) return;
      const g = grupos[l.lote] = grupos[l.lote] || { itens: [], concl: 0, abertas: 0, maxD: 0 };
      g.itens.push(l);
      if (l.estado === 'CONCLUIDA') g.concl++;
      else if (l.estado === 'ABERTA') g.abertas++;
      if (l.dNum > g.maxD) g.maxD = l.dNum;
    });
    Object.keys(grupos).forEach(function (k) {
      const g = grupos[k];
      if (g.abertas > 0 || g.concl === 0) return;      // ainda tem item rodando (ou é só fora-esteira)
      if (!_carenciaOk(g.maxD, hojeNum)) return;
      g.itens.forEach(function (l) { alvo[l.i] = true; });
    });
  }

  const idx = Object.keys(alvo).map(Number).sort(function (a, b) { return a - b; });
  const detalhe = idx.map(function (i) {
    const l = linhas[i - 1];
    return { linha: i + 1, lote: l.lote, codigo: l.codigo, data: normalizarDataBR(values[i][iData]) };
  });
  if (!idx.length) return { ok: true, arquivadas: 0, itens: [] };
  if (simular)     return { ok: true, arquivadas: idx.length, itens: detalhe, simulado: true };

  // 3) Copia para o arquivo (a menos que o modo destrutivo esteja ligado).
  if (!ARQ_EXCLUIR_SEM_COPIA) {
    const shArq = _abaArquivoProg(ss, hdr);
    const hdrArq = shArq.getRange(1, 1, 1, shArq.getLastColumn()).getValues()[0]
                        .map(c => String(c).trim().toUpperCase());
    const agora  = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss');
    // Casa coluna por NOME: a aba de arquivo não depende da ordem das colunas da
    // aba ativa, então mudar a PROGRAMACAO depois não desalinha o histórico.
    const mapa = hdrArq.map(function (nome) { return nome === 'ARQUIVADO_EM' ? -2 : hdr.indexOf(nome); });
    // Se as colunas de saída ainda estiverem vazias na linha (arquivamento
    // chamado sem passar por atualizarSaldoNaProgramacao), preenche o número
    // final aqui — o histórico nunca vai para o arquivo em branco.
    const saida = idx.map(function (i) {
      const l     = linhas[i - 1];
      const qtde  = Number(values[i][iQtd]) || 0;
      const saldo = Math.max(Number(saldoMap[codKey(l.codigo) + '|' + l.lote + '|' + l.dNum]) || 0, 0);
      const prodz = Math.max(qtde - saldo, 0);
      const calc  = { PRODUZIDO: prodz, SALDO: saldo, PERCENTUAL: qtde > 0 ? Math.round(prodz / qtde * 100) : 0,
                      STATUS: l.estado === 'FORA' ? 'FORA DA ESTEIRA' : 'CONCLUIDO', ATUALIZADO_EM: agora };
      return mapa.map(function (j, c) {
        if (j === -2) return agora;
        if (j < 0)    return '';
        const v = values[i][j];
        return (v === '' && calc[hdrArq[c]] !== undefined) ? calc[hdrArq[c]] : v;
      });
    });
    shArq.getRange(shArq.getLastRow() + 1, 1, saida.length, hdrArq.length).setValues(saida);
    SpreadsheetApp.flush();   // só apaga depois que a cópia está gravada de fato
  }

  // 4) Apaga da aba ativa, de baixo para cima (senão os índices andam).
  for (let k = idx.length - 1; k >= 0; k--) sh.deleteRow(idx[k] + 1);

  Logger.log('arquivarLotesConcluidos: ' + idx.length + ' linha(s) · lotes ' +
             detalhe.map(function (d) { return d.lote; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', '));
  return { ok: true, arquivadas: idx.length, itens: detalhe };
}

// Aba de arquivo: cria na 1ª vez com o cabeçalho da PROGRAMACAO + ARQUIVADO_EM e,
// se a aba ativa ganhar colunas depois, acrescenta as que faltarem.
function _abaArquivoProg(ss, hdrOrigem) {
  let sh = acharAbaTolerante(ss, SHEET_PROG_ARQ);
  if (!sh) {
    sh = ss.insertSheet(SHEET_PROG_ARQ);
    const cab = hdrOrigem.concat(['ARQUIVADO_EM']);
    sh.getRange(1, 1, 1, cab.length).setValues([cab]);
    sh.setFrozenRows(1);
    return sh;
  }
  const hdrArq = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0]
                   .map(c => String(c).trim().toUpperCase());
  const faltam = hdrOrigem.filter(function (n) { return n && hdrArq.indexOf(n) < 0; });
  if (faltam.length) sh.getRange(1, hdrArq.length + 1, 1, faltam.length).setValues([faltam]);
  return sh;
}

// ── Para rodar no editor do Apps Script ──
// Mostra o que SAIRIA da aba, sem mexer em nada. Use antes de confiar no automático.
function simularArquivamento() {
  const r = _arquivarConcluidos(null, true);
  Logger.log('Sairiam ' + r.arquivadas + ' linha(s):');
  (r.itens || []).forEach(function (it) {
    Logger.log('  linha ' + it.linha + ' · lote ' + it.lote + ' · ' + it.codigo + ' · ' + it.data);
  });
  return r;
}

// Arquiva agora (útil na 1ª limpeza, com a aba já cheia de lotes velhos).
// Atualiza o saldo antes, para o histórico sair com o número final na linha.
function arquivarConcluidosAgora() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const prog = calcularProgramacao();
    try { atualizarSaldoNaProgramacao(prog); } catch (e) { Logger.log('saldo pré-arquivo: ' + e.message); }
    return _arquivarConcluidos(prog, false);
  } finally { lock.releaseLock(); }
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

// Devolve o hora-a-hora de UM dia específico (para a visão GERENCIAL de dias
// passados). Fonte: HISTORICO_HORA (DATA·HORA·REALIZADO) + o agregado do dia em
// HISTORICO (meta/real/eficiência/fechado). Somente leitura.
function getHoraDia(p) {
  const data = String((p && p.data) || '').trim();
  if (!data) return { ok: false, erro: 'data ausente' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Produção por hora do dia
  const horas = [];
  const shH = ss.getSheetByName(SHEET_HIST_HORA);
  if (shH && shH.getLastRow() > 1) {
    const rows = shH.getDataRange().getValues().slice(1);
    rows.forEach(r => {
      if (!r[0]) return;
      if (fmtDataBR(r[0]) !== data) return;
      const hora = String(r[1] || '').trim();
      if (!hora) return;
      horas.push({ hora: hora, real: Number(r[2]) || 0 });
    });
  }

  // Agregado do dia (HISTORICO)
  let dia = null;
  const shD = ss.getSheetByName(SHEET_HIST);
  if (shD && shD.getLastRow() > 1) {
    const rows = shD.getDataRange().getValues().slice(1);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] || fmtDataBR(r[0]) !== data) continue;
      dia = {
        real:    Number(r[1]) || 0,
        meta:    Number(r[2]) || 0,
        ef:      Number(r[3]) || 0,
        melhor:  Number(r[4]) || 0,
        pior:    Number(r[5]) || 0,
        heCount: Number(r[6]) || 0,
        fechado: r[7] === true || String(r[7]).toLowerCase() === 'true',
        mediaH:  Number(r[9]) || 0
      };
      break;
    }
  }

  return { ok: true, data: data, horas: horas, dia: dia };
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


// ════════════════════════════════════════════════════════
// CONFIG DO CICLO DE TELAS DA TV — COMPARTILHADA ENTRE APARELHOS
// ════════════════════════════════════════════════════════
// Guarda, na aba CONFIG_PAINEL (chave/valor), quais telas (A/B/C) entram no
// ciclo, o tempo de cada uma e os KPIs visíveis na Tela B. Como fica na planilha
// (e não no localStorage de cada aparelho), mudar num lugar reflete na TV, no
// gerencial e no mobile — mesma ideia do início do turno pela célula C3.

// Lê a config atual. Devolve null se a aba ainda não existe (aí cada aparelho
// segue com a sua config local, como era antes — comportamento retrocompatível).
function getConfigPainel() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_CONFIG);
  if (!sh) return null;
  const vals = sh.getDataRange().getValues();
  const kv = {};
  for (let i = 1; i < vals.length; i++) {
    const k = String(vals[i][0] || '').trim().toUpperCase();
    if (k) kv[k] = vals[i][1];
  }
  if (!Object.keys(kv).length) return null;

  const bool = (v, padrao) => {
    const s = String(v).trim().toLowerCase();
    if (s === '1' || s === 'true' || s === 'sim')  return true;
    if (s === '0' || s === 'false' || s === 'nao' || s === 'não') return false;
    return padrao;
  };
  const num = (v, padrao) => { const n = parseInt(v, 10); return isNaN(n) ? padrao : n; };

  return {
    telaA:  bool(kv.TELA_A, true),
    telaB:  bool(kv.TELA_B, true),
    telaC:  bool(kv.TELA_C, true),
    tempoA: num(kv.TEMPO_A, 15),
    tempoB: num(kv.TEMPO_B, 15),
    tempoC: num(kv.TEMPO_C, 15),
    kpisTelaB: kv.KPIS_TELA_B !== undefined ? String(kv.KPIS_TELA_B) : null,
    modoLeitor: bool(kv.MODO_LEITOR, true)   // seleção de produto por bipe no mobile (padrão ligado)
  };
}

// Grava a config (upsert chave/valor). Chamada pelo app ao salvar as
// configurações; assim a mudança fica disponível para todos os aparelhos.
function setConfigPainel(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_CONFIG);
    if (!sh) {
      sh = ss.insertSheet(SHEET_CONFIG);
      sh.appendRow(['CHAVE', 'VALOR']);
      sh.setFrozenRows(1);
    }
    // Só grava as chaves realmente enviadas (não apaga o que não veio).
    const b01 = v => (String(v).trim().toLowerCase() === 'true' || String(v).trim() === '1') ? '1' : '0';
    const novos = {};
    if (p.telaA  !== undefined) novos.TELA_A  = b01(p.telaA);
    if (p.telaB  !== undefined) novos.TELA_B  = b01(p.telaB);
    if (p.telaC  !== undefined) novos.TELA_C  = b01(p.telaC);
    if (p.tempoA !== undefined) novos.TEMPO_A = String(parseInt(p.tempoA, 10) || 15);
    if (p.tempoB !== undefined) novos.TEMPO_B = String(parseInt(p.tempoB, 10) || 15);
    if (p.tempoC !== undefined) novos.TEMPO_C = String(parseInt(p.tempoC, 10) || 15);
    if (p.kpisTelaB !== undefined) novos.KPIS_TELA_B = String(p.kpisTelaB || '');
    if (p.modoLeitor !== undefined) novos.MODO_LEITOR = b01(p.modoLeitor);

    const vals = sh.getDataRange().getValues();
    const linhaDe = {};
    for (let i = 1; i < vals.length; i++) {
      const k = String(vals[i][0] || '').trim().toUpperCase();
      if (k) linhaDe[k] = i + 1; // 1-based
    }
    Object.keys(novos).forEach(function (k) {
      if (linhaDe[k]) sh.getRange(linhaDe[k], 2).setValue(novos[k]);
      else            sh.appendRow([k, novos[k]]);
    });
    return { ok: true, painelConfig: getConfigPainel() };
  } finally {
    lock.releaseLock();
  }
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

  // "Modelo" = 6 primeiros dígitos do código (os 3 últimos são a variante de
  // cor/acabamento, ex.: 501094001 BRANCO / 501094002 PRETO ACETINADO são o
  // mesmo modelo "501094"). Nome do modelo = maior prefixo de palavras comum
  // entre as descrições das variantes, pra não depender de adivinhar onde a
  // cor termina no texto (ex.: "VOL 1/1 MESA CABECEIRA SLEEP").
  // PROBLEMA que isso resolve: quando alguma variante diverge logo na 2ª palavra
  // (ou tem descrição curta/incompleta), o prefixo comum "desabava" para algo
  // inútil tipo só "VOL", cortando o nome do produto na tela PRODUÇÃO/HORA.
  // Solução: se o prefixo comum ficar com menos de 2 palavras, usa a descrição
  // MAIS LONGA das variantes — melhor um nome completo (mesmo com a cor) do que "VOL".
  const modeloDescs = {};
  lerCatalogoProdutos().forEach(function (pr) {
    const m = String(pr.codigo || '').slice(0, 6);
    if (!m) return;
    const d = String(pr.desc || '').trim();
    if (!d) return;
    (modeloDescs[m] = modeloDescs[m] || []).push(d);
  });
  const modeloNome = {};
  Object.keys(modeloDescs).forEach(function (m) {
    const descs = modeloDescs[m];
    let pref = descs[0];
    for (let i = 1; i < descs.length; i++) pref = prefixoComumPalavras(pref, descs[i]);
    const maisLonga = descs.reduce(function (a, b) { return b.length > a.length ? b : a; }, '');
    modeloNome[m] = (pref && pref.split(' ').filter(String).length >= 2) ? pref : maisLonga;
  });

  // Programação/atraso (planejado x embalado). Independe de haver produção hoje.
  const programacao = calcularProgramacao();
  // saldoLinha é um mapa auxiliar (uso interno do write-back de saldo por lote);
  // não precisa ir no JSON do painel — remove para manter o payload enxuto.
  try { delete programacao.saldoLinha; } catch (e) {}

  // Item 1: ao abrir/atualizar o gerencial, garante que a META DO DIA gravada na
  // planilha (B3) reflete a quantidade programada para hoje — assim "definir o
  // lote do dia" alimenta os indicadores mesmo sem um lançamento ainda. Em
  // try/catch: nunca pode derrubar a leitura do painel.
  try { gravarMetaDiaNaPlanilha(programacao); }
  catch (e) { Logger.log('gravarMetaDiaNaPlanilha (getPontosDia) falhou (ignorado): ' + e.message); }

  // Config do ciclo de telas da TV, compartilhada via planilha (null se a aba
  // ainda não existe). A TV lê isto no refresh e se ajusta sozinha. Em try/catch
  // para nunca derrubar a leitura do painel.
  let painelConfig = null;
  try { painelConfig = getConfigPainel(); } catch (e) { Logger.log('getConfigPainel falhou (ignorado): ' + e.message); }

  if (!sh) {
    return { ok: true, pontos: 0, pesoKg: 0, caixas: 0, produtoAtual, produtoAtualDesc, porProduto: [], porHora: [], porHoraModelo: [], programacao, painelConfig };
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
    // Mesma armadilha na coluna HORA: o Sheets converte "13:00" pra um Date
    // (epoch 30/12/1899) sozinho, e String(Date) vira algo tipo "Sat Dec 30
    // 1899 13:00:00 GMT-0300 (...)" em vez de "13:00". formatHoraCel() trata
    // os dois formatos (Date ou texto já pronto).
    const hora   = formatHoraCel(r[iHora]);
    const codigo = String(r[iCod]).trim();
    const cx     = Number(r[iCx]) || 0;
    if (!codigo || !cx) return;

    const prod = catalogo[codigo] || { desc: '', pontos: 0, peso: 0 };
    const pts  = cx * (prod.pontos || 0);
    const kg   = cx * (prod.peso   || 0);

    pontos += pts; pesoKg += kg; caixas += cx;

    // Arredonda só na exibição por item (pontos inteiro, peso com 1 casa) —
    // os totais do dia (pontos/pesoKg acima) somam o valor cheio e arredondam
    // uma vez só no final, pra não acumular erro de arredondamento.
    const ptsR = Math.round(pts);
    const kgR  = Math.round(kg * 10) / 10;

    if (!porProdutoMap[codigo]) {
      porProdutoMap[codigo] = { codigo, desc: prod.desc || '', caixas: 0, pontos: 0, pesoKg: 0 };
    }
    porProdutoMap[codigo].caixas += cx;
    porProdutoMap[codigo].pontos += ptsR;
    porProdutoMap[codigo].pesoKg += kgR;

    porHora.push({ hora, codigo, desc: prod.desc || '', caixas: cx, pontos: ptsR, pesoKg: kgR });
  });

  // Mesma produção de porHora, agrupada por hora + modelo (soma as variantes de
  // cor da mesma hora numa linha só) — pedido do usuário: ver "quantos SLEEP",
  // "quantos PRINCESA" por hora, sem abrir por cor.
  const porHoraModeloMap = {};
  porHora.forEach(function (it) {
    const modelo = String(it.codigo || '').slice(0, 6);
    const key = it.hora + '|' + modelo;
    if (!porHoraModeloMap[key]) {
      porHoraModeloMap[key] = { hora: it.hora, modelo: modelo, nome: modeloNome[modelo] || it.desc || '', caixas: 0, pontos: 0, pesoKg: 0 };
    }
    porHoraModeloMap[key].caixas += it.caixas;
    porHoraModeloMap[key].pontos += it.pontos;
    porHoraModeloMap[key].pesoKg += it.pesoKg;
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
    porHoraModelo: Object.values(porHoraModeloMap),
    programacao,
    painelConfig
  };
}

// Maior prefixo de PALAVRAS comum entre duas descrições (usado pra achar o
// "nome do modelo" sem a cor, sem precisar adivinhar onde ela termina no texto).
// ════════════════════════════════════════════════════════
// PRODUÇÃO POR MODELO — HISTÓRICO POR PERÍODO
// Lê o log append-only PRODUCAO_PRODUTO (mesma fonte de getPontosDia, mas SEM
// filtrar só o dia de hoje) e devolve a produção agrupada por DATA + MODELO
// (6 primeiros dígitos do código). Serve pra comparar um mesmo modelo em vários
// dias — ou vários modelos entre si — na aba PRODUÇÃO/HORA do painel.
// Parâmetros opcionais: de / ate (dd/MM/yyyy). Sem eles, devolve tudo.
// ════════════════════════════════════════════════════════
function getProducaoModeloPeriodo(p) {
  p = p || {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PROD_LOG);
  if (!sh) return { ok: true, itens: [] };

  // Catálogo + nome "limpo" do modelo (mesma lógica de getPontosDia: prefixo de
  // palavras comum entre as variantes de cor; se ficar curto demais, a descrição
  // mais longa).
  const catalogo = {};
  const modeloDescs = {};
  lerCatalogoProdutos().forEach(function (pr) {
    catalogo[pr.codigo] = pr;
    const m = String(pr.codigo || '').slice(0, 6);
    const d = String(pr.desc || '').trim();
    if (m && d) (modeloDescs[m] = modeloDescs[m] || []).push(d);
  });
  const modeloNome = {};
  Object.keys(modeloDescs).forEach(function (m) {
    const descs = modeloDescs[m];
    let pref = descs[0];
    for (let i = 1; i < descs.length; i++) pref = prefixoComumPalavras(pref, descs[i]);
    const maisLonga = descs.reduce(function (a, b) { return b.length > a.length ? b : a; }, '');
    modeloNome[m] = (pref && pref.split(' ').filter(String).length >= 2) ? pref : maisLonga;
  });

  const deNum  = p.de  ? dataParaNum(p.de)  : null;
  const ateNum = p.ate ? dataParaNum(p.ate) : null;

  const values = sh.getDataRange().getValues();
  const hdr = (values[0] || []).map(function (c) { return String(c).trim().toUpperCase(); });
  const iData = hdr.indexOf('DATA')   >= 0 ? hdr.indexOf('DATA')   : 0;
  const iHora = hdr.indexOf('HORA')   >= 0 ? hdr.indexOf('HORA')   : 1;
  const iCod  = hdr.indexOf('CODIGO') >= 0 ? hdr.indexOf('CODIGO') : 2;
  const iCx   = hdr.indexOf('CAIXAS') >= 0 ? hdr.indexOf('CAIXAS') : 4;

  const map = {}; // chave "dataNum|modelo"
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    const dNum = dataParaNum(r[iData]);
    if (!dNum) continue;
    if (deNum  && dNum < deNum)  continue;
    if (ateNum && dNum > ateNum) continue;

    const codigo = String(r[iCod]).trim();
    const cx = Number(r[iCx]) || 0;
    if (!codigo || !cx) continue;

    const modelo = codigo.slice(0, 6);
    const prod   = catalogo[codigo] || { pontos: 0, peso: 0, desc: '' };
    // Agrupa por MODELO (6 díg.: junta só as cores de um mesmo produto) e
    // carimba, em cada item, o NOME do modelo (limpo, sem "VOL 1/1") e a
    // FAMÍLIA ampla — assim o painel alterna entre modelo/família sem refazer a
    // chamada. Base do nome: prefixo comum das variantes; se faltar, o catálogo.
    const descBase = modeloNome[modelo] || String(prod.desc || '');
    const key = dNum + '|' + modelo;
    if (!map[key]) {
      map[key] = { data: fmtDataBR(r[iData]), dataNum: dNum, modelo: modelo,
                   nome: limpaNomeModelo(descBase),
                   familia: familiaDoNome(descBase) || modelo,
                   caixas: 0, pontos: 0, pesoKg: 0, horasSet: {} };
    }
    map[key].caixas += cx;
    map[key].pontos += cx * (prod.pontos || 0);
    map[key].pesoKg += cx * (prod.peso   || 0);
    // Conta as HORAS distintas em que esse modelo rodou no dia — base da
    // média cx/h (ritmo). formatHoraCel normaliza texto "13:00" e Date.
    const hora = formatHoraCel(r[iHora]);
    if (hora) map[key].horasSet[hora] = true;
  }

  const itens = Object.keys(map).map(function (k) {
    const it = map[k];
    const horas = Object.keys(it.horasSet).length;
    return { data: it.data, dataNum: it.dataNum, modelo: it.modelo, nome: it.nome,
             familia: it.familia,
             caixas: it.caixas, pontos: Math.round(it.pontos),
             pesoKg: Math.round(it.pesoKg * 10) / 10,
             horas: horas, mediaHora: horas > 0 ? Math.round(it.caixas / horas) : 0 };
  }).sort(function (a, b) {
    return a.dataNum - b.dataNum || b.caixas - a.caixas;
  });

  return { ok: true, itens: itens };
}

// Maior prefixo de PALAVRAS comum entre duas descrições (usado pra achar o
// "nome do modelo" sem a cor, sem precisar adivinhar onde a cor termina no texto).
function prefixoComumPalavras(a, b) {
  const wa = String(a || '').split(' ');
  const wb = String(b || '').split(' ');
  const out = [];
  for (let i = 0; i < Math.min(wa.length, wb.length); i++) {
    if (wa[i] !== wb[i]) break;
    out.push(wa[i]);
  }
  return out.join(' ');
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

// Formata a coluna HORA do log PRODUCAO_PRODUTO como "HH:mm". O Sheets converte
// sozinho um texto tipo "13:00" digitado/gravado numa célula pra um Date (epoch
// 30/12/1899) quando a coluna pega formato de hora — String(Date) daria algo
// tipo "Sat Dec 30 1899 13:00:00 GMT-0300 (...)" em vez de "13:00".
function formatHoraCel(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'HH:mm');
  return String(v || '').trim();
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
// incluirArquivadas = true → soma também as linhas já movidas para
// PROGRAMACAO_CONCLUIDA. Só o cálculo (calcularProgramacao) pede isso: sem essas
// linhas o FIFO perderia a demanda que a produção antiga já consumiu e passaria
// a creditar outros lotes do mesmo código. As telas continuam vendo só a aba
// ativa, que é o objetivo do arquivamento.
function lerProgramacao(incluirArquivadas) {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const out = _lerProgDaAba(acharAbaTolerante(ss, SHEET_PROG), false);
  if (incluirArquivadas) {
    _lerProgDaAba(acharAbaTolerante(ss, SHEET_PROG_ARQ), true).forEach(function (r) { out.push(r); });
  }
  return out;
}

function _lerProgDaAba(sh, arquivada) {
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
  // Coluna opcional: marca "fechado fora da esteira" (FORA_ESTEIRA, FORA DA
  // ESTEIRA, FORA...). Qualquer célula PREENCHIDA = item não é da esteira.
  const iFora = hdr.findIndex(function (h) { return h.includes('FORA'); });
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
    // FORA_ESTEIRA é opcional: sem a coluna, tudo é da esteira (comportamento
    // de sempre). Com a coluna, célula preenchida tira o item da conta.
    const foraTxt = iFora >= 0 ? String(r[iFora] || '').trim() : '';
    out.push({ data: r[cData], codigo: codigo, qtde: qtde, lote: lote,
               foraEsteira: foraTxt !== '', foraLocal: foraTxt,
               arquivada: !!arquivada });
  }
  return out;
}

// Caixas embaladas por produto (chave = dígitos do código), separando ANTES de
// hoje e HOJE, e devolvendo a data do 1º registro (início do controle por produto).
function lerEmbaladoPorProduto(hojeNum) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PROD_LOG);
  const antes = {}, hoje = {}, eventos = {};
  let inicio = 0;
  if (!sh) return { antes: antes, hoje: hoje, eventos: eventos, inicio: hojeNum };
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
    // Eventos datados (até hoje) para a alocação FIFO cronológica por lote em
    // calcularProgramacao(): a produção só abate um lote já ABERTO na sua data,
    // então produção anterior à abertura do lote não o credita (evita o "atraso
    // some" por causa de produção antiga do mesmo código, de outro lote).
    if (dNum <= hojeNum) (eventos[key] = eventos[key] || []).push({ dNum: dNum, cx: cx });
  }
  return { antes: antes, hoje: hoje, eventos: eventos, inicio: inicio || hojeNum };
}

// Monta a lista por produto (programado hoje, atraso, embalado hoje, falta) e os
// totais + "meta efetiva" (programado de hoje + atraso).
// O atraso é apurado por ALOCAÇÃO FIFO por lote/data (não mais um simples
// max(programado−embalado) por código): a produção abate o lote aberto mais
// ANTIGO, e produção anterior à abertura de um lote NÃO o credita. Assim, um lote
// programado num dia não é "zerado" por produção antiga de outro lote do mesmo
// código. A produção de hoje também abate o atraso mais antigo primeiro, então
// atrasoTotal é "vivo" (cai durante o dia). faltaZerar = atraso + resto da meta
// de hoje = o que ainda falta produzir p/ zerar tudo.
function calcularProgramacao() {
  const hoje    = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  const hojeNum = dataParaNum(hoje);

  // Catálogo indexado por dígitos do código (para desc + código "oficial" do app).
  const catByKey = {};
  lerCatalogoProdutos().forEach(pr => { catByKey[codKey(pr.codigo)] = pr; });

  const emb = lerEmbaladoPorProduto(hojeNum);

  // Cada linha da PROGRAMAÇÃO (data <= hoje) vira uma DEMANDA (lote) com data.
  // Guardamos as linhas por produto para alocar a produção FIFO (lote mais antigo
  // primeiro). Futuro não entra (não vira atraso nem meta de hoje). loteHoje = lote
  // mais recente <= hoje, só para rótulo do produto.
  // incluirArquivadas=true: as linhas já tiradas da aba continuam abrindo demanda
  // no FIFO, senão a produção que elas consumiram creditaria outro lote do mesmo
  // código (ver bloco ARQ_* no topo). Elas não viram rótulo de "lote atual".
  const progLinhas = {}, loteHoje = {};
  lerProgramacao(true).forEach(pr => {
    const key  = codKey(pr.codigo);
    const dNum = dataParaNum(pr.data);
    if (!key || dNum === 0) return;
    // Fechado fora da esteira: não é produção desta linha. Sai da meta/atraso.
    if (pr.foraEsteira) return;
    if (pr.lote && !pr.arquivada && dNum <= hojeNum && (!loteHoje[key] || dNum >= loteHoje[key].dNum)) {
      loteHoje[key] = { lote: pr.lote, dNum: dNum };
    }
    if (dNum <= hojeNum) {
      (progLinhas[key] = progLinhas[key] || []).push({ dNum: dNum, qtde: Number(pr.qtde) || 0, lote: pr.lote || '' });
    }
  });

  const keys = {};
  Object.keys(progLinhas).forEach(k => keys[k] = 1);
  Object.keys(emb.hoje).forEach(k => keys[k] = 1);

  const lista = [];
  const saldoLinha = {}; // "key|lote|dNum" -> saldo restante do lote (p/ o write-back)
  let totMeta = 0, totProgHoje = 0, totAtraso = 0, totEmbHoje = 0, totHojeRest = 0;

  Object.keys(keys).forEach(key => {
    const linhas  = progLinhas[key]   || [];
    const eventos = emb.eventos[key]  || [];
    const eh      = emb.hoje[key]     || 0;

    // FIFO cronológico: prog ABRE demanda, emb ABATE o lote aberto mais antigo.
    // Mesma data: a demanda (prog) entra antes da produção (emb). Produção sem
    // demanda aberta (anterior ao lote) é descartada — não credita o lote. Como
    // a produção de HOJE também entra, ela abate primeiro o atraso mais antigo
    // ("atraso vivo": o número cai conforme o time produz).
    const ev = [];
    linhas.forEach(ln => ev.push({ d: ln.dNum, t: 0, q: ln.qtde, lote: ln.lote }));
    eventos.forEach(e  => ev.push({ d: e.dNum,  t: 1, q: e.cx }));
    ev.sort((a, b) => (a.d - b.d) || (a.t - b.t));

    const fila = []; // demandas abertas: {d, rem, lote}
    ev.forEach(e => {
      if (e.t === 0) { fila.push({ d: e.d, rem: e.q, lote: e.lote }); return; }
      let rem = e.q;
      for (let i = 0; i < fila.length && rem > 0; i++) {
        const take = Math.min(fila[i].rem, rem);
        fila[i].rem -= take; rem -= take;
      }
    });

    let atraso = 0, hojeRest = 0, progHoje = 0;
    fila.forEach(lot => {
      if (lot.d < hojeNum)       atraso   += lot.rem;
      else if (lot.d === hojeNum) hojeRest += lot.rem;
      const lk = key + '|' + lot.lote + '|' + lot.d;
      saldoLinha[lk] = (saldoLinha[lk] || 0) + lot.rem;
    });
    linhas.forEach(ln => { if (ln.dNum === hojeNum) progHoje += ln.qtde; });

    if (progHoje === 0 && atraso === 0 && eh === 0) return; // nada a mostrar
    const prod = catByKey[key];
    const metaEfetiva = progHoje + atraso;
    lista.push({
      codigo: prod ? prod.codigo : key,
      desc:   prod ? prod.desc   : '',
      lote:   loteHoje[key] ? loteHoje[key].lote : '',
      programadoHoje: progHoje,
      atraso: atraso,
      embaladoHoje: eh,
      metaEfetiva: metaEfetiva,
      falta: atraso + hojeRest
    });
    totMeta += metaEfetiva; totProgHoje += progHoje; totAtraso += atraso;
    totEmbHoje += eh; totHojeRest += hojeRest;
  });
  lista.sort((a, b) => b.falta - a.falta); // maior falta primeiro

  return {
    lista: lista,
    metaEfetiva: totMeta,
    programadoHoje: totProgHoje,
    atrasoTotal: totAtraso,               // atraso VIVO (já abatido pela produção de hoje, FIFO)
    embaladoHoje: totEmbHoje,
    hojeRestante: totHojeRest,            // quanto da meta de hoje ainda falta
    faltaZerar: totAtraso + totHojeRest,  // total que ainda falta produzir p/ zerar tudo
    saldoLinha: saldoLinha                // uso interno do write-back (removido antes de ir p/ o cliente)
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
// Também traz o acompanhamento de entrada (embalado/falta) do PRODUTO daquela
// linha, reaproveitando calcularProgramacao() — mesmo valor em todas as linhas
// do mesmo produto (é um total do produto, não da linha/dia específica).
function getProgramacaoDetalhada() {
  const catByKey = {};
  lerCatalogoProdutos().forEach(pr => { catByKey[codKey(pr.codigo)] = pr; });

  const statusByKey = {};
  calcularProgramacao().lista.forEach(function (x) { statusByKey[codKey(x.codigo)] = x; });

  const hojeNum = dataParaNum(Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy'));

  const itens = lerProgramacao().map(function (pr) {
    const key  = codKey(pr.codigo);
    const dNum = dataParaNum(pr.data);
    const cat  = catByKey[key];
    const st   = statusByKey[key];
    const qtde = pr.qtde || 0;
    // Linha de data FUTURA (dNum > hojeNum): ainda não venceu, então não mostra
    // embalado/falta nem que fosse o total do produto — mesmo que esse mesmo
    // produto tenha atraso de OUTRO lote (data <= hoje), isso não pode "vazar"
    // pra uma linha que ainda nem chegou (senão parece que o item futuro já
    // está em falta, o que não faz sentido).
    const futura = dNum > hojeNum;
    return {
      data:     normalizarDataBR(pr.data),
      dataNum:  dNum,
      lote:     pr.lote || '',
      codigo:   cat ? cat.codigo : pr.codigo,
      desc:     cat ? cat.desc   : '',
      qtde:     qtde,
      pesoKg:   Math.round(qtde * (cat ? cat.peso   : 0) * 10) / 10,
      pontos:   Math.round(qtde * (cat ? cat.pontos : 0)),
      embalado: futura ? 0 : (st ? st.embaladoHoje : 0),
      falta:    futura ? 0 : (st ? st.falta         : 0),
      // metaEfetiva=0 quer dizer "nada vencendo hoje pra esse produto" (comum
      // em linha de data futura) — o app usa isso pra não mostrar "✓ OK" como
      // se já tivesse sido embalado quando na verdade ainda nem venceu.
      metaEfetiva: futura ? 0 : (st ? st.metaEfetiva : 0),
      // Fechado fora da esteira: registrado, mas fora da meta/pendentes.
      foraEsteira: !!pr.foraEsteira,
      foraLocal:   pr.foraLocal || ''
    };
  // Só entram linhas com lote preenchido: pedido do usuário, pra tela ficar mais
  // confiável (linhas sem lote costumam ser lançamento incompleto/rascunho).
  }).filter(function (it) { return it.dataNum > 0 && it.lote; });

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

// UPSERT por ID: se já existe uma linha com o mesmo ID (mesma parada), atualiza-a;
// senão, acrescenta. Isso permite o fluxo "ao vivo" do operador — registrar uma
// parada EM ANDAMENTO (sem FIM) e depois dar START (reenviar a mesma parada com o
// FIM preenchido) sem duplicar linhas. IDs novos continuam sendo acrescentados,
// então o comportamento antigo (paradas já com início e fim) é preservado.
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

  // Mapa ID -> linha (1-based) das paradas já gravadas, p/ decidir update x append.
  const values = sh.getDataRange().getValues();
  const rowById = {};
  let temAbertaHoje = false;
  for (let i = 1; i < values.length; i++) {
    rowById[String(values[i][1])] = i + 1;
    if (_dataStr(values[i][0]) === data && !_horaStr(values[i][4])) temAbertaHoje = true;
  }

  let salvos = 0;
  paradas.forEach(par => {
    const id      = String(par.id || Date.now());
    const abrindo = !String(par.fim || '').trim();
    const r       = rowById[id];

    // Dedupe: não cria uma SEGUNDA parada aberta enquanto já houver uma aberta
    // hoje. Impede o acúmulo de paradas "em andamento" por toques repetidos /
    // leituras defasadas no mobile.
    if (!r && abrindo && temAbertaHoje) return;

    const row = [
      data, id, par.tipo || '', par.ini || '', par.fim || '',
      calcDurMin(par.ini, par.fim) || '', par.obs || ''
    ];
    if (r) sh.getRange(r, 1, 1, 7).setValues([row]);
    else { sh.appendRow(row); if (abrindo) temAbertaHoje = true; }
    salvos++;
  });

  SpreadsheetApp.flush(); // garante commit antes do próximo getParadas
  return { ok: true, salvos };
}

// Dá START (encerra) numa parada em andamento: carimba o FIM (hora do servidor,
// se não vier) e recalcula a DURAÇÃO da linha cujo ID casa. Usado pelo operador
// no mobile quando a produção volta a rodar.
function endParada(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PARADAS);
  if (!sh) return { ok: false, erro: 'sem paradas' };

  const id = String(p.id || '');
  if (!id) return { ok: false, erro: 'id obrigatório' };

  const fim    = p.fim || Utilities.formatDate(new Date(), TZ, 'HH:mm');
  const values = sh.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][1]) === id) {
      const ini = _horaStr(values[i][3]);
      sh.getRange(i + 1, 5).setValue(fim);                          // FIM (col E)
      sh.getRange(i + 1, 6).setValue(calcDurMin(ini, fim) || '');   // DURACAO (col F)
      SpreadsheetApp.flush();
      return { ok: true, fim };
    }
  }
  return { ok: false, erro: 'parada não encontrada' };
}

// Fecha as paradas que ficaram ABERTAS (sem FIM) no dia arquivado — assim uma
// parada esquecida (sem START) não vira "em andamento" eterna. Carimba FIM = fim
// do turno (último slot de HORA_A_HORA); se não achar, usa o próprio INÍCIO
// (duração 0). Marca a OBS. Chamada no fechamento diário (executarReset).
function encerrarParadasAbertas(dataRef) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PARADAS);
  if (!sh || !dataRef) return 0;

  const fimTurno = _fimDoTurno();
  const values   = sh.getDataRange().getValues();
  let n = 0;
  for (let i = 1; i < values.length; i++) {
    const linhaData = _dataStr(values[i][0]);
    const fim       = _horaStr(values[i][4]);
    if (linhaData === dataRef && !fim) {
      const ini     = _horaStr(values[i][3]);
      const novoFim = fimTurno || ini;
      const obs     = String(values[i][6] || '');
      sh.getRange(i + 1, 5).setValue(novoFim);
      sh.getRange(i + 1, 6).setValue(calcDurMin(ini, novoFim) || '');
      sh.getRange(i + 1, 7).setValue((obs ? obs + ' ' : '') + '(encerrada automaticamente no fechamento)');
      n++;
    }
  }
  if (n) Logger.log('Paradas encerradas automaticamente: ' + n + ' (' + dataRef + ')');
  return n;
}

// Fim do turno = fim do ÚLTIMO slot com rótulo "HH:MM-HH:MM" em HORA_A_HORA.
function _fimDoTurno() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_DADOS);
  if (!sh) return '';
  const data = sh.getDataRange().getValues();
  const hIdx = 3;
  if (data.length <= hIdx) return '';
  const hdr = data[hIdx].map(c => String(c).trim().toUpperCase());
  const iH  = hdr.indexOf('HORA');
  if (iH < 0) return '';
  for (let i = data.length - 1; i > hIdx; i--) {
    const m = String(data[i][iH] || '').match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
    if (m) return m[2];
  }
  return '';
}

// Lista editável dos TIPOS de parada (o dropdown do mobile). Fica na aba
// TIPOS_PARADA (coluna A). Na 1ª vez cria a aba já com os padrões — daí o
// gestor edita direto na planilha, sem mexer no código. Se a aba ficar vazia,
// devolve os padrões p/ o mobile nunca ficar sem opções.
function getTiposParada() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_TIPOS_PAR);
  const PADRAO = ['Troca de produto','Manutenção','Falta de material',
    'Refeição/Intervalo','Limpeza','Reunião','Falta de energia',
    'Ajuste de máquina','Outro'];

  if (!sh) {
    sh = ss.insertSheet(SHEET_TIPOS_PAR);
    sh.appendRow(['TIPO_DE_PARADA', 'CLASSE']);
    sh.setFrozenRows(1);
    PADRAO.forEach(t => sh.appendRow([t, /refei|interval|almo/i.test(t) ? 'Programada' : 'Não Programada']));
  }

  // Coluna A = nome do tipo; coluna B (opcional) = CLASSE (PLANEJADA / NÃO
  // PLANEJADA). Quando B está vazia, o painel usa a heurística por nome.
  const rows = sh.getDataRange().getValues().slice(1);
  const tipos = [];
  const classes = {}; // nome -> 'PLANEJADA' | 'NAO' (só quando marcado na planilha)
  rows.forEach(r => {
    const nome = String(r[0] || '').trim();
    if (!nome) return;
    tipos.push(nome);
    const cl = String(r[1] || '').trim().toUpperCase();
    if (cl) {
      // Aceita "Programada/Não Programada" e "Planejada/Não Planejada" (e SIM/NÃO).
      // "NÃO" tem prioridade: "Não Programada" não pode cair como programada.
      if (/N[ÃA]O/.test(cl) || cl === 'NP' || cl === 'N') classes[nome] = 'NAO';
      else if (/PROGRAM|PLAN/.test(cl) || cl === 'SIM' || cl === 'P') classes[nome] = 'PLANEJADA';
      else classes[nome] = 'NAO';
    }
  });

  return { ok: true, tipos: tipos.length ? tipos : PADRAO, classes: classes };
}

// O Google Sheets frequentemente CONVERTE "17/07/2026" em objeto Data e "06:44"
// em objeto Hora. Aí String(cel) vira "Fri Jul 17 2026..." e a comparação por
// texto quebra (getParadas voltava VAZIO e a parada aberta não aparecia). Estes
// normalizadores aceitam tanto texto quanto Data/Hora.
// IMPORTANTE: quando o Sheets converte "12:19" em valor de HORA (ou a data em
// DATA), a leitura precisa usar o FUSO DA PRÓPRIA PLANILHA — senão o horário sai
// deslocado (ex.: aparecia 17:19 em vez de 12:19, +5h, e o cronômetro da TV
// travava em 00:00 porque o início ficava "no futuro"). getSpreadsheetTimeZone()
// devolve exatamente o que está exibido na célula.
function _ssTz() {
  try { return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || TZ; }
  catch (e) { return TZ; }
}
function _dataStr(v) {
  return (v instanceof Date) ? Utilities.formatDate(v, _ssTz(), 'dd/MM/yyyy') : String(v || '').trim();
}
function _horaStr(v) {
  return (v instanceof Date) ? Utilities.formatDate(v, _ssTz(), 'HH:mm') : String(v || '').trim();
}

// Paradas de um intervalo de datas (para o relatório). de/ate em dd/MM/yyyy.
// A duração é recalculada no front-end a partir de ini/fim (não depende da
// coluna DURACAO, que pode ter virado fórmula/tempo na planilha).
function getParadasPeriodo(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_PARADAS);
  if (!sh) return { ok: true, paradas: [] };

  const toNum = s => { const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? (+m[3]) * 10000 + (+m[2]) * 100 + (+m[1]) : 0; };
  const nDe  = toNum(p.de  || '');
  const nAte = toNum(p.ate || '');

  const paradas = sh.getDataRange().getValues().slice(1).map(r => ({
    data: _dataStr(r[0]),
    tipo: String(r[2] || ''),
    ini:  _horaStr(r[3]),
    fim:  _horaStr(r[4]),
    obs:  String(r[6] || '')
  })).filter(x => {
    const n = toNum(x.data);
    if (!n) return false;
    if (nDe  && n < nDe)  return false;
    if (nAte && n > nAte) return false;
    return true;
  });

  return { ok: true, paradas };
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
    .filter(r => _dataStr(r[0]) === data)
    .map(r => ({
      id:   Number(r[1]) || Date.now(),
      tipo: String(r[2] || ''),
      ini:  _horaStr(r[3]),
      fim:  _horaStr(r[4]),
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

  // BLINDAGEM DE COLD START: em vez de arquivar+zerar AQUI (pesado — 2 leituras
  // da planilha + escrita em HISTORICO/HISTORICO_HORA + exclusão de linhas), o
  // que num cold start do Apps Script poderia estourar o timeout de 25s da
  // leitura e derrubar a TV no modo DEMO, agendamos o reset para rodar em
  // BACKGROUND (gatilho temporário) logo depois. O getDados devolve na hora; o
  // dia é fechado em seguida, fora do caminho quente. NÃO altera a URL nem o
  // fluxo de conexão — só tira o trabalho pesado da frente da leitura.
  agendarResetEmBackground(carimbo, props);
}

// Agenda o reset pesado (arquivar + zerar) para rodar em BACKGROUND, via gatilho
// temporário, em vez de dentro do getDados. Assim a leitura do painel (caminho
// quente da TV) nunca fica presa atrás do arquivamento num cold start.
// - Guarda contra empilhar gatilhos: se já existe um agendado, só atualiza a
//   data-alvo (resetPendente) e sai — no máximo 1 gatilho temporário por vez.
// - Se não conseguir criar o gatilho (ex.: cota), NÃO trava o painel: apenas
//   registra; o gatilho diário das 23:59 continua sendo o backup do fechamento.
function agendarResetEmBackground(dataRef, props) {
  props = props || PropertiesService.getScriptProperties();
  props.setProperty('resetPendente', dataRef); // data-alvo mais recente a fechar
  const jaTem = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'resetPendenteBackground';
  });
  if (jaTem) return;
  try {
    ScriptApp.newTrigger('resetPendenteBackground')
      .timeBased()
      .after(15 * 1000) // ~15s depois: fora do caminho quente da leitura
      .create();
  } catch (e) {
    Logger.log('agendarResetEmBackground falhou (ignorado): ' + e.message);
  }
}

// Executada pelo gatilho temporário criado por agendarResetEmBackground(). Faz o
// arquivamento+zeramento pesado FORA do getDados e se auto-remove. Idempotente:
// se o dia já foi fechado (ultimoReset) ou já virou hoje, sai sem trabalho.
// Reaproveita toda a lógica segura existente (planilhaTemProducao/executarReset);
// em erro, apenas registra — a próxima leitura reagenda e o 23:59 é o backstop.
function resetPendenteBackground() {
  const props = PropertiesService.getScriptProperties();
  // Auto-limpeza: apaga os gatilhos temporários desta função (evita acúmulo).
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'resetPendenteBackground') ScriptApp.deleteTrigger(t);
  });

  const dataRef = props.getProperty('resetPendente');
  props.deleteProperty('resetPendente');
  if (!dataRef) return;

  const hoje = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy');
  if (dataRef === hoje) return;                              // nada a fechar
  if (props.getProperty('ultimoReset') === dataRef) return; // já foi fechado

  try {
    if (planilhaTemProducao()) executarReset(dataRef, props);
    else props.deleteProperty(PROP_DATA_DADOS);
  } catch (e) {
    Logger.log('resetPendenteBackground falhou: ' + e.message);
  }
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

  // Fecha paradas que ficaram abertas (operador esqueceu de dar START) para não
  // arrastarem "em andamento" para o dia seguinte. Nunca derruba o reset.
  try { encerrarParadasAbertas(dataRef); }
  catch (err) { Logger.log('Falha ao encerrar paradas abertas: ' + err.message); }

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

