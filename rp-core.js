/* ═══════════════════════════════════════════════════════════════════════════
   RitmoPatrimar · núcleo comum dos painéis  —  IMPLEMENTAÇÃO ÚNICA
   Carregado por ritmoprod_embalagem_v7.html (desktop/TV) e por
   ritmoprod_mobile.html, sempre ANTES do script de cada painel.

   Por que este arquivo existe: as funções abaixo estavam escritas DUAS vezes,
   uma em cada HTML, com o mesmo código. É a mesma armadilha que fez a conta de
   paradas divergir três vezes entre desktop e mobile e que deu origem ao
   paradas-calc.js — só que aqui a duplicação é da base: formatação de número,
   conversão de horário, data de hoje, média por horário. Quando alguém arruma
   um lado e esquece o outro, os dois painéis passam a mostrar números
   diferentes para o mesmo turno, e ninguém sabe em qual acreditar.

   O que ENTRA aqui: função pura, sem estado do painel — só depende dos
   argumentos. O que NÃO entra: qualquer coisa que leia DADOS, CFG, MEDIA_HORAS
   ou toque no DOM. Essas continuam em cada painel, porque lá elas divergem de
   propósito (a TV mostra o que o celular não mostra).

   As funções ficam no escopo global de propósito: os painéis já as chamavam
   assim, e trocar ~500 pontos de chamada por RP_CORE.toMin() seria risco sem
   ganho. window.RP_CORE existe para o painel conferir se o arquivo carregou.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Formatação ──────────────────────────────────────────────────────────────
// Número vazio/indefinido vira "—", nunca 0: zero é uma afirmação ("produziu
// nada"), e o traço é a ausência de informação. Os painéis dependem disso.
// O separador decimal é VÍRGULA, como o milhar é PONTO no fmtN. Enquanto o fmtP
// usava toFixed(1), a mesma tela mostrava "8.681" (ponto = milhar) ao lado de
// "89.6%" (ponto = decimal) — o mesmo sinal com dois significados, lido de longe
// por quem está no chão de fábrica. Quem faz a conta inversa (a barra de
// eficiência da Tela B) já normalizava a vírgula.
const p2   = n => String(n).padStart(2, '0');
const fmtN = n => isNaN(n) || n === null ? '—' : Number(n).toLocaleString('pt-BR');
const fmt1 = n => isNaN(n) || n === null ? '—'
  : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtP = n => isNaN(n) || n === null ? '—' : fmt1(n) + '%';

// "1 parada" / "2 paradas". O "(s)" de "parada(s)" é linguagem de sistema: quem
// lê o painel é o operador e o gestor, não o banco de dados. Fica aqui porque
// aparecia solto em ~15 lugares dos dois painéis, cada um escrevendo do seu
// jeito. n é opcional na frase — plural(0,'dia','dias') dá "0 dias".
const plural = (n, sing, plur) => `${fmtN(n)} ${Math.abs(Number(n)) === 1 ? sing : plur}`;

// ── Horário ─────────────────────────────────────────────────────────────────
// "HH:mm" → minutos inteiros (rótulos de slot, turno, almoço). "HH:mm:ss" → com
// fração: é o formato que a aba PARADAS grava desde a v5.5 do .gs (microparadas
// medidas em segundos), e ignorar o terceiro campo fazia 08:39:02→08:39:47 dar
// ZERO minutos. Nenhum rótulo de hora do painel traz segundos, então os ~500
// pontos de chamada continuam recebendo o inteiro de sempre.
function toMin(s){ const [h, m, sg] = s.split(':').map(Number); return h * 60 + m + ((sg || 0) / 60); }
function fromMin(m){ return `${p2(Math.floor(m / 60))}:${p2(m % 60)}`; }

// Normaliza o rótulo de horário para comparação. A planilha traz traço comum,
// travessão e meia-risca misturados ("07:00-08:00", "07:00–08:00"), e sem isto
// o mesmo horário vira duas chaves diferentes — foi o que já quebrou o alerta
// de hora fraca, que comparava a hora de hoje com a média histórica dela.
function normHora(s){
  return String(s || '').replace(/[‐-―−]/g, '-').replace(/\s+/g, '').trim();
}

// ── Data ────────────────────────────────────────────────────────────────────
function hojeStr(){
  const d = new Date();
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function dtToStr(d){
  if (!(d instanceof Date) || isNaN(d)) return '';
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// ── Média por horário ───────────────────────────────────────────────────────
// Junta as médias históricas por rótulo já normalizado, ponderando pela
// amostra: dois rótulos que só diferem no tipo de traço viram um só, com a
// média correta dos dois (e não a média das médias, que ignoraria o peso de
// cada um).
function mergeMedias(medias, amostra){
  const soma = {}, cont = {};
  Object.keys(medias || {}).forEach(k => {
    const nk = normHora(k), c = (amostra || {})[k] || 0;
    soma[nk] = (soma[nk] || 0) + (medias[k] || 0) * c;
    cont[nk] = (cont[nk] || 0) + c;
  });
  const M = {}, A = {};
  Object.keys(cont).forEach(nk => {
    if (cont[nk] > 0) { M[nk] = Math.round(soma[nk] / cont[nk]); A[nk] = cont[nk]; }
  });
  return { medias: M, amostra: A };
}

// ── Atraso acumulado hora a hora ────────────────────────────────────────────
// O que faltou nas horas anteriores é cobrado da hora seguinte: metaEfetiva =
// meta da hora + atraso acumulado. O atraso nunca é negativo — hora que
// produziu acima da meta abate o acumulado, mas não gera "crédito" que reduza
// a meta das próximas.
//
// ⚠ SÓ HORA COM LANÇAMENTO ENTRA NO ACUMULADO. Hora ainda não lançada chega
// como `producaoHora: null` (o backend só devolve número depois que a hora
// FECHA — ver getDados no .gs); somar a meta dela ao accMeta equivalia a
// afirmar que ela produziu ZERO, e o atraso das horas seguintes crescia uma
// meta inteira por hora que ainda nem aconteceu. Medido num dia 12 cx atrás
// às 14:30: a linha das 16:00 mostrava "(+190)" e meta efetiva 368 cx.
// Hora que FECHOU sem produzir vem como 0 (não null) e continua cobrada.
//
// ⚠ HORA EXTRA (`he: true`) NÃO ENTRA NO ACUMULADO — nem cobrando, nem
// abatendo. Hora extra não tem meta (os painéis a mostram com "—"), então ela
// não pode gerar atraso para as horas de jornada seguintes, nem quitar o
// atraso delas com caixas feitas fora do turno. Medido em 01/09/2026: o dia
// começou às 05:00, a hora extra das 05:00 fechou 240 contra os 245 da
// planilha e a hora SEGUINTE já nasceu com "(+5)" — atraso herdado de uma
// hora que ninguém cobra. Linha sem `he` se comporta exatamente como antes.
function calcAtrasoHoras(rows){
  let accMeta = 0, accProd = 0;
  return rows.map(r => {
    if (r.he) return { atrasoHora: 0, metaEfetivaHora: r.metaHora || 0 };
    const atrasoHora = Math.max(accMeta - accProd, 0);
    const metaEfetivaHora = (r.metaHora || 0) + atrasoHora;
    if (r.producaoHora != null) {
      accMeta += (r.metaHora || 0);
      accProd += r.producaoHora;
    }
    return { atrasoHora, metaEfetivaHora };
  });
}

// ── Status por eficiência ───────────────────────────────────────────────────
// Classe de cor: ≥96% ok, ≥90% atenção, abaixo disso vermelho. O TEXTO de cada
// faixa NÃO mora aqui — desktop e mobile escrevem diferente de propósito
// (a TV tem espaço para "DENTRO DA META", o celular não).
function sc(ef){ return ef >= 96 ? 'ok' : ef >= 90 ? 'warn' : 'red'; }

// ── Eficiência contra o que a META DO DIA já pedia até agora ────────────────
// A régua do verde/vermelho dos painéis. Nasceu de um defeito medido em
// 31/08/2026: o cartão EFICIÊNCIA mostrava o % da meta do DIA (realizado ÷ meta
// do dia) pintado com a cor de OUTRA conta — o ritmo contra a meta/hora da aba
// HORA_A_HORA. Enquanto as duas metas concordam ninguém percebe; naquele dia a
// PROGRAMAÇÃO pedia 2.709 cx e a HORA_A_HORA planejava 164 cx/h (1.476 no dia),
// e a TV escreveu **49,8% em VERDE, "DENTRO DA META"**, ao lado de uma projeção
// de 1.519 contra meta de 2.709.
//
// Aqui a régua é uma só e é a META DO DIA — a mesma que a tela mostra: quanto
// dela já deveria estar feito a esta altura do turno.
//   • o rateio é por MINUTOS de turno, não por número de horas: o slot
//     pós-almoço vale 48 min, e contá-lo como hora cheia cobraria 12 min que
//     não existem;
//   • só entram as horas COM LANÇAMENTO (quem chama passa os minutos delas) —
//     hora que ninguém apontou ainda não é hora atrasada, a mesma regra do
//     calcAtrasoHoras;
//   • turno sem nenhuma hora lançada devolve 0, e quem chama decide o que
//     mostrar (é o que os dois painéis já faziam antes desta função).
// Mora aqui porque os DOIS painéis precisam da MESMA resposta: celular dizendo
// "dentro da meta" enquanto a TV diz "abaixo" é o defeito que este projeto mais
// pagou caro.
function efNoRitmo(real, metaDia, minRodado, minTurno){
  const metaAteAgora = minTurno > 0 ? (Number(metaDia) || 0) * (minRodado / minTurno) : 0;
  return { metaAteAgora, ef: metaAteAgora > 0 ? (real / metaAteAgora) * 100 : 0 };
}

// ── Veredito do RITMO ───────────────────────────────────────────────────────
// O texto que acompanha o efNoRitmo. Ao contrário do `sl()` de cada painel
// (que fala da meta e é escrito diferente em cada tela, por causa do espaço),
// este é o MESMO nos dois: ele responde "estamos no ritmo?", e TV, desktop e
// celular não podem responder isso com palavras diferentes.
//
// ⚠ Ele existe para não repetir a palavra META ao lado do % da meta do dia.
// Era essa colisão que confundia quem lia a TV de longe: o número grande dizia
// 103,8% e o selo dizia "DENTRO DA META", enquanto o dia estava com 780 de
// 2.700 cx (28,9%) — dois "%" e dois sentidos de "meta" na mesma tela.
function slRitmo(ef){ return ef >= 96 ? 'NO RITMO' : ef >= 90 ? 'ATENÇÃO' : 'ABAIXO DO RITMO'; }

// ── Produto × cor ───────────────────────────────────────────────────────────
// A COR saiu da DESCRICAO para uma coluna própria na PRODUTO_CODIGO. Quem
// continuou imprimindo só a descrição passou a mostrar linhas IDÊNTICAS para
// produtos diferentes: no app do operador o lote 25076 abre quatro
// "VOL 1/2 PENTEADEIRA CAMARIM MEL", e ele não tem como saber em qual tocar.
// Toda tela que mostra produto compõe o rótulo por aqui.
// Linha antiga — descrição que ainda termina com a cor — não ganha a cor duas
// vezes; sem cor cadastrada, o nome sai como sempre saiu.
function nomeComCor(desc, cor){
  const d = String(desc == null ? '' : desc).replace(/\s+/g, ' ').trim();
  const c = String(cor  == null ? '' : cor ).replace(/\s+/g, ' ').trim();
  if (!c) return d;
  if (!d) return c;
  const norm = s => s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return norm(d).endsWith(norm(c)) ? d : d + ' · ' + c;
}

// ── UEP do dia (gerencial dos dois painéis) ─────────────────────────────────
// A UEP por caixa é PARÂMETRO DO CADASTRO (coluna UEP da PRODUTO_CODIGO, .gs
// v5.11) e a UEP feita hoje vem pronta do getPontosDia (`uep`: jornada normal,
// hora extra, caixas com e sem UEP, nº de códigos com UEP). Aqui só se julga.
// ⚠ A META É DA JORNADA NORMAL INTEIRA (07:00–17:00 sem o almoço = 527 min).
// Nasceu como "2.300 UEP em 8 h" (estudo: ritmo × 8), mas o dia soma a jornada
// INTEIRA, e com os 48 min a mais a meta ficava ~10% mais fácil que o estudo
// (medido no HISTORICO em 24/09/2026: 6 de 7 dias acima de 2.300). O PPCP fixou
// o equivalente: 2.530 na jornada = os mesmos ~288 UEP/h. O "esperado até
// agora" e a meta de cada hora são essa meta repartida pelos MINUTOS de jornada
// (a mesma régua do efNoRitmo). A hora extra aparece separada, fora da meta.
// A meta pode vir da CONFIG_PAINEL (chave META_UEP); sem ela, vale o padrão.
// ── Minutos que JÁ PASSARAM de um slot (v7.114.0, PPCP 25/09/2026) ─────────
// O "esperado até agora" da UEP contava a hora CORRENTE inteira assim que ela
// tinha o 1º lançamento: às 14:10 a régua cobrava os 60 min da hora das 14:00,
// 50 que ainda não existiam. Aqui: hora em andamento vale só o que passou; hora
// fechada vale o slot inteiro. `agoraMin` fora do slot (antes dele ou depois)
// devolve o slot inteiro — hora lançada antes de começar é caso de apontamento,
// não de relógio, e continua como sempre foi.
function minSlotDecorrido(inicio, minSlot, agoraMin){
  const min = Number(minSlot) || 60;
  const ini = toMin(String(inicio || '00:00')), ag = Number(agoraMin);
  if (!isFinite(ag) || ag < ini || ag >= ini + min) return min;
  return ag - ini;
}

// PADRÃO DE UEP (PPCP, 21/10/2026: "temos que definir o padrão e não mexer
// mais" → "fecha"): base MESA CABECEIRA MADERO = 1,00 UEP por caixa e meta de
// 2.530 UEP na jornada normal (~288 UEP/h, 12,5 s por UEP) — a mesma unidade
// da planilha de programação do PPCP. A base SLEEP (3.048, v7.143.0) foi
// desfeita: a cronoanálise de 20/10 deu MADERO = SLEEP (7,9 s rodando).
const UEP_META_PADRAO = 2530;
const UEP_MIN_DIA     = 527;   // minutos da jornada normal (9 slots: 4×60 + 48 + 3×60 + 59)
// `data` (dd/MM/aaaa, opcional — v7.248.0): no SÁBADO e no DOMINGO o card não
// tem meta nem selo — a UEP do dia é toda hora extra (`fds: true`). Vale também
// com o .gs antes da v5.68, que ainda manda as horas de 07–17 em `normal`.
function uepCard(uep, metaCfg, minJornada, data){
  const l = 'UEP DO DIA';
  // null = a leitura do dia ainda não chegou; false/undefined = o backend
  // respondeu SEM o campo (.gs anterior à v5.11). São coisas diferentes.
  if (uep === null) return { l, v:'—', sub:'aguardando a leitura do dia…', c:'' };
  if (!uep) return { l, v:'—', sub:'o backend ainda não manda a UEP (.gs v5.11 re-deployado)', c:'' };
  if (!(uep.codigos > 0)) return { l, v:'—', sub:'sem UEP no cadastro — coluna UEP da PRODUTO_CODIGO', c:'' };
  const meta = Number(metaCfg) > 0 ? Number(metaCfg) : UEP_META_PADRAO;
  const feito = Number(uep.normal) || 0, he = Number(uep.he) || 0, cxSem = Number(uep.cxSem) || 0;
  if (data && uepFimDeSemana(data)) {
    const tot = feito + he;
    return { l, v: fmtN(Math.round(tot)), fds: true, meta, ef: null, esperado: 0, he: tot, c: 'acc',
             sub: 'TODO HORA EXTRA · sem meta' + (cxSem > 0 ? ' · ' + fmtN(cxSem) + ' cx sem UEP' : ''),
             t: 'Sábado e domingo são hora extra o dia inteiro (PPCP, 16/11/2026): a UEP do dia é toda de hora extra e não é julgada contra meta nenhuma.' };
  }
  const min = Math.min(Math.max(0, Number(minJornada) || 0), UEP_MIN_DIA);
  const { metaAteAgora, ef } = efNoRitmo(feito, meta, min, UEP_MIN_DIA);
  // Mesmo desenho do card % DA META DO DIA ("ATENÇÃO · 951 de 1.650 cx
  // esperadas até agora"): selo, feito × esperado, depois a meta do dia.
  // PPCP, 25/09/2026: "de 2.530 UEP (55,9%) · NO RITMO — 1.383 esperadas"
  // punha dois vereditos lado a lado (55,9% parecia ruim, NO RITMO bom).
  const sub = (min > 0
      ? slRitmo(ef) + ' · ' + fmtN(Math.round(feito)) + ' de ' + fmtN(Math.round(metaAteAgora)) + ' esperadas · '
      : '')
    // enxuto (v7.120.0): a unidade já está no rótulo do card; a explicação, no `t`
    + 'meta ' + fmtN(meta)
    + (he > 0 ? ' · +' + fmtN(Math.round(he)) + ' em HE' : '')
    + (cxSem > 0 ? ' · ' + fmtN(cxSem) + ' cx sem UEP' : '');
  const t = 'UEP feita em jornada normal: caixas × UEP por caixa do cadastro (PRODUTO_CODIGO). '
    + 'Meta de ' + fmtN(meta) + ' UEP na jornada normal (' + UEP_MIN_DIA + ' min); a hora extra fica fora da meta. '
    + 'Esperado até agora = meta × minutos de jornada com lançamento ÷ ' + UEP_MIN_DIA + ' (a hora em andamento conta só os minutos que já passaram).'
    + (cxSem > 0 ? ' ' + fmtN(cxSem) + ' cx de hoje são de códigos sem UEP no cadastro e não entram na conta.' : '');
  return { l, v: fmtN(Math.round(feito)), sub, t, c: min > 0 ? sc(ef) : 'acc', ef, meta, esperado: metaAteAgora };
}

// ── R$ por UEP (v7.88.0, PPCP 24/09/2026) ──────────────────────────────────
// Quanto custou cada UEP da jornada normal: custo-hora da LINHA × minutos de
// jornada decorridos ÷ UEP feita. A régua é o mesmo custo na meta: custo-hora ×
// jornada inteira ÷ meta de UEP. `excesso` = R$ pagos sem virar UEP até agora
// (custo decorrido − UEP feita × R$/UEP da meta); negativo = abaixo do custo da
// meta. É CUSTO DE CONVERSÃO da mão de obra da embalagem, não custo do produto,
// e a hora extra fica fora (nem a UEP de HE nem o custo dela entram).
// Sem custo-hora, sem minutos ou sem UEP → null (o painel não mostra zero).
function uepCusto(custoHora, uepFeito, minJornada, metaUep){
  const ch = Number(custoHora) || 0, feito = Number(uepFeito) || 0;
  const min = Math.min(Math.max(0, Number(minJornada) || 0), UEP_MIN_DIA);
  const meta = Number(metaUep) > 0 ? Number(metaUep) : UEP_META_PADRAO;
  if (!(ch > 0) || !(min > 0) || !(feito > 0)) return null;
  const custo = ch * min / 60;
  const rsMeta = ch * UEP_MIN_DIA / 60 / meta;
  return { custo, rsUep: custo / feito, rsMeta, excesso: custo - feito * rsMeta };
}

// ── R$ por UEP no PERÍODO (aba SIMULADOR, v7.101.0, PPCP 25/09/2026) ────────
// Saiu do card do dia ("pode tirar esse valor em reais daí, precisa ser em um
// lugar estratégico") e foi para onde o custo-hora é digitado. Dias FECHADOS do
// HISTORICO com UEP gravada; cada um paga a jornada normal INTEIRA (527 min),
// que é a mesma base da meta de UEP. A régua é a mesma do uepCusto: custo da
// jornada ÷ UEP feita contra custo da jornada ÷ meta de UEP de cada dia.
// `excesso` = R$ pagos sem virar UEP (negativo = abaixo do custo da meta).
function uepCustoPeriodo(custoHora, dias){
  const ch = Number(custoHora) || 0;
  // fim de semana fora (v7.248.0): é todo hora extra, não paga a jornada
  const com = (dias || []).filter(d => d && Number(d.uep) > 0 && !uepFimDeSemana(d.data));
  if (!(ch > 0) || !com.length) return null;
  const custo = ch * UEP_MIN_DIA / 60 * com.length;
  const uep = com.reduce((s, d) => s + Number(d.uep), 0);
  const metaTot = com.reduce((s, d) => s + uepDiaMeta(d), 0);
  const rsMeta = custo / metaTot;
  return { n: com.length, custo, uep, metaTot, rsUep: custo / uep, rsMeta,
           excesso: custo - uep * rsMeta };
}

// ── UEP hora a hora (gerencial dos dois painéis) ────────────────────────────
// Soma a UEP do `porHoraModelo` do getPontosDia (.gs v5.11: `uep` por item =
// caixas × UEP do cadastro) por HORA. A chave é o início da hora (HH:MM), que
// casa com o `horario`/`inicio` dos slots — o log pode trazer "07:00" ou
// "07:00-08:00". Item sem UEP (uep 0) tem as caixas contadas à parte.
function _uepHHMM(s){
  const x = String(s == null ? '' : s).match(/(\d{1,2}):(\d{2})/);
  return x ? p2(+x[1]) + ':' + x[2] : '';
}
function uepPorHora(lista){
  const m = {};
  (lista || []).forEach(it => {
    const k = _uepHHMM(it && it.hora);
    if (!k) return;
    const o = m[k] = m[k] || { uep: 0, cxSem: 0 };
    const u = Number(it.uep) || 0;
    if (u > 0) o.uep += u; else o.cxSem += Number(it.caixas) || 0;
  });
  return m;
}
// Célula da coluna UEP de uma hora. A meta da hora é a meta de UEP do dia
// (jornada normal) repartida pelos MINUTOS da hora — o slot pós-almoço de 48 min pede
// menos. Hora extra mostra o número e não é julgada (mesma regra das caixas).
function uepCelula(h, metaCfg, minSlot, ehHE){
  if (!h) return { txt: '—', cls: '', title: 'nenhuma caixa com produto apontada nesta hora' };
  const meta = Number(metaCfg) > 0 ? Number(metaCfg) : UEP_META_PADRAO;
  const metaH = meta * (Number(minSlot) || 60) / UEP_MIN_DIA;
  const txt = fmtN(Math.round(h.uep)) + (h.cxSem > 0 ? '*' : '');
  const title = fmtN(Math.round(h.uep)) + ' UEP'
    + (ehHE ? ' em hora extra (fora da meta)' : ' · meta ' + fmtN(Math.round(metaH)) + ' UEP nesta hora (' + (Number(minSlot) || 60) + ' min)')
    + (h.cxSem > 0 ? ' · * ' + fmtN(h.cxSem) + ' cx de códigos sem UEP ficaram fora' : '');
  return { txt, title, cls: ehHE || !(h.uep > 0) ? '' : sc(h.uep / metaH * 100), metaH };
}

// ── UEP dos dias fechados (HISTÓRICO, relatório semanal) ────────────────────
// Cada dia do HISTORICO traz a UEP de jornada normal e a META UEP gravadas no
// fechamento (.gs v5.14) — congeladas: mudar a UEP do cadastro hoje não reescreve
// o dia de ontem. Dia sem UEP (null) fica FORA da média e da contagem, e é
// contado à parte; nunca vira zero.
// SÁBADO E DOMINGO SÃO HORA EXTRA O DIA INTEIRO (v7.248.0 / .gs v5.68, PPCP
// 16/11/2026, com o sábado 14/11 em vermelho no PERÍODO: "aos sábados é horas
// extra total"). Não há jornada normal no fim de semana: o dia não tem meta
// (uepDiaMeta 0 = não é julgado) e a UEP dele é toda hora extra (uepDiaHe) —
// também na linha gravada pelo .gs v5.60–v5.67, que pôs as horas de 07–17 do
// sábado em UEP de jornada com uma META UEP pelas horas. Revoga a v7.222.0.
function uepFimDeSemana(data){
  const m = String(data || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return false;
  const dw = new Date(+m[3], +m[2] - 1, +m[1]).getDay();
  return dw === 0 || dw === 6;
}
function uepDiaMeta(d){
  if (d && uepFimDeSemana(d.data)) return 0;   // v7.248.0: fim de semana não tem meta
  if (d && d.metaUep !== null && d.metaUep !== undefined && d.metaUep !== '' && Number(d.metaUep) === 0) return 0;
  return d && Number(d.metaUep) > 0 ? Number(d.metaUep) : UEP_META_PADRAO;
}
// A UEP EM HORA EXTRA de um dia fechado: a gravada em UEP HE e, no fim de
// semana, também a que a linha gravou como jornada (o .gs antes da v5.68).
function uepDiaHe(d){
  return (Number(d && d.uepHe) || 0) + (d && uepFimDeSemana(d.data) ? (Number(d.uep) || 0) : 0);
}
// A linha do HISTORICO de sábado/domingo como o .gs v5.68 grava: sem meta (meta,
// META DIA, ATRASO, META UEP 0, sem eficiência nem melhor/pior) e TODA a produção
// em hora extra (HE CX = REALIZADO, a UEP em UEP HE). Vale também para a linha
// gravada antes (v5.60–v5.67: meta pelas horas, 07–17 como jornada) — os painéis
// passam todo dia do histórico por aqui ao ler. Dia útil volta o mesmo objeto.
function histDiaFds(d){
  if (!d || !uepFimDeSemana(d.data)) return d;
  const real = Number(d.real) || 0;
  const o = Object.assign({}, d, { meta: 0, ef: 0, melhor: 0, pior: 0, heCx: real, realNormal: 0, fds: true });
  if ('ok' in d) o.ok = false;
  if ('mediaH' in d) o.mediaH = 0;
  if (d.metaDia != null) o.metaDia = 0;
  if (d.atrasoMeta != null) o.atrasoMeta = 0;
  if (d.uep != null && isFinite(Number(d.uep))) { o.uepHe = (Number(d.uepHe) || 0) + Number(d.uep); o.uep = 0; o.metaUep = 0; }
  return o;
}
// A META de cada dia para VALORAR PARADAS (RP_PARADAS.stats → metaByDay). O dia
// sem meta (sábado, domingo — todo hora extra) cairia na meta do DIA EM QUE SE
// ABRE A TELA (cfg.metaDia, com o atraso): o número mudaria conforme o dia em que
// se olha. No fim de semana vale a MEDIANA das metas dos dias úteis do próprio
// histórico — a linha roda no mesmo ritmo, e o número fica reproduzível.
function metaDiasParadas(dias){
  const m = {};
  (dias || []).forEach(d => {
    const v = parseFloat(d && d.meta) || 0;
    if (d && d.data && v > 0) m[d.data] = v;
  });
  const med = metaMedianaUteis(m);
  if (med != null)
    (dias || []).forEach(d => { if (d && d.data && !(m[d.data] > 0) && uepFimDeSemana(d.data)) m[d.data] = med; });
  return m;
}
// A mediana das metas dos DIAS ÚTEIS de um mapa {data: meta} (null sem nenhum).
// É a meta com que se valora a parada do fim de semana — no histórico
// (metaDiasParadas) e AO VIVO (o metaHoje das paradas de um sábado): sem a
// mesma régua nos dois, a parada de sábado mudaria de valor na segunda.
function metaMedianaUteis(m){
  const uteis = [];
  Object.keys(m || {}).forEach(k => { const v = parseFloat(m[k]) || 0; if (v > 0 && !uepFimDeSemana(k)) uteis.push(v); });
  if (!uteis.length) return null;
  uteis.sort((a, b) => a - b);
  const k = uteis.length >> 1;
  return uteis.length % 2 ? uteis[k] : (uteis[k - 1] + uteis[k]) / 2;
}
function uepHistResumo(dias){
  const comUep = (dias || []).filter(d => d && d.uep != null && isFinite(Number(d.uep)));
  // dia sem meta (sábado, domingo) não é julgado: sai do n, do bateu, da média e da meta somada
  const com = comUep.filter(d => uepDiaMeta(d) > 0);
  const tot = com.reduce((s, d) => s + Number(d.uep), 0);
  const bateu = com.filter(d => Number(d.uep) >= uepDiaMeta(d)).length;
  return { n: com.length, semUep: (dias || []).length - comUep.length,
           total: tot, media: com.length ? tot / com.length : null,
           nMedia: com.length, nFds: comUep.filter(d => uepFimDeSemana(d.data)).length,
           metaMedia: com.length ? com.reduce((s, d) => s + uepDiaMeta(d), 0) / com.length : null,
           // a hora extra do período: a dos dias úteis e o fim de semana inteiro
           bateu, he: comUep.reduce((s, d) => s + uepDiaHe(d), 0),
           // Soma das metas DOS DIAS COM UEP (cada um com a sua): é contra ela
           // que o total do período se compara, nunca meta × nº de dias do filtro.
           metaTot: com.reduce((s, d) => s + uepDiaMeta(d), 0),
           meta: com.length ? uepDiaMeta(com[com.length - 1]) : UEP_META_PADRAO };
}

// ── O GERENCIAL COM A UEP NA FRENTE (rp-core 1.18.0) ─────────────────────────
// PC v7.243.0/7.244.0 e celular 1.50.0 (PPCP, 13/11/2026: "priorizar as UEPs" →
// "pode implantar no gerencial primeiro depois vamos para outro"; 16/11: o
// celular). A conta nasceu no HTML do PC (_uepAbaHoras, _gerHoraJulga,
// _gerUepModelo com o _tvUepMontar das Telas F/G); aqui é UMA para os dois
// gerenciais — os nomes antigos do PC delegam para estas. Pura: o painel passa
// a leitura do dia, os slots, o relógio e o cadastro.
// A hora que acabou de fechar ainda aceita lançamento no app por este tempo (o
// LANC_TOLERANCIA_MIN do celular; o teste confere): zero aí é "ainda não lançou".
const UEP_HORA_TOL_MIN = 15;
// As horas do dia em UEP. slots: [{inicio, label, min, he}]; allHoje: as linhas
// da HORA_A_HORA ({horario, producaoHora, he}); uepH: o uepPorHora. A meta da hora
// é a meta de UEP repartida pelos MINUTOS da hora (o 12:12 de 48 min pede menos);
// hora extra sem meta. Hora lançada sem caixa com produto não vira 0 UEP: é falta
// de dado. Com `agoraMin`, a hora que contém o relógio sai `andamento` (não é
// julgada) e a que ainda não começou, `futuro`; sem ele (chamador antigo), nada
// disso. `tolMin`: a janela da hora recém-fechada (tol).
function uepHorasDia(slots, allHoje, uepH, metaUep, agoraMin, tolMin){
  const meta = Number(metaUep) > 0 ? Number(metaUep) : UEP_META_PADRAO;
  const ag = Number(agoraMin), temAg = agoraMin != null && isFinite(ag);
  return (slots || []).map(sl => {
    const reg = (allHoje || []).find(d => d.horario === sl.inicio);
    const he = !!((reg && reg.he) || sl.he);
    const lancada = !!(reg && reg.producaoHora != null);
    const h = (uepH || {})[sl.inicio] || null;
    const mn = sl.min || 60;
    const metaH = he ? null : meta * mn / UEP_MIN_DIA;
    const uep = h && h.uep > 0 ? h.uep : null;
    const ini = toMin(sl.inicio), fim = ini + mn;
    const andamento = temAg && ag >= ini && ag < fim;
    const cx = lancada ? Number(reg.producaoHora) : null;
    return { label: sl.label, inicio: sl.inicio, he, lancada, uep, cxSem: h ? h.cxSem : 0, metaH, andamento,
             futuro: temAg && ag < ini, ate: andamento ? fromMin(ag) : null,
             cls: he || andamento || uep == null || !metaH ? '' : sc(uep / metaH * 100),
             cx, min: mn,
             tol: !he && cx === 0 && temAg && Number(tolMin) > 0 && ag >= fim && ag < fim + Number(tolMin) };
  });
}
// A hora é julgada? Regra ÚNICA da tabela, da análise e dos gráficos dos dois
// gerenciais. null = não julga: hora extra, a hora de agora, sem lançamento, sem
// meta, ou lançada só com caixas sem UEP. Hora fechada em ZERO caixas é julgada
// (0%, a régua de sempre — o 12:12 que fechou em 0 em 28/08), menos na janela
// em que ainda aceita lançamento (tol). Hora em que PARTE das caixas não tem UEP
// (código sem UEP, ou lançada sem produto: caixas da hora maiores que as do
// registro) sai com `parte`: o %, sem veredito — a UEP dela está incompleta.
function uepHoraJulga(h, cx, cxCom){
  if (!h || h.he || h.andamento || !h.lancada || !(h.metaH > 0)) return null;
  if (!(h.uep > 0)) return cx === 0 && !(h.cxSem > 0) && !h.tol ? { uep: 0, pct: 0 } : null;
  const pct = h.uep / h.metaH * 100;
  const semProd = cx != null && cxCom != null && cx > (Number(cxCom) || 0) + (Number(h.cxSem) || 0);
  return (h.cxSem > 0 || semProd) ? { uep: h.uep, pct, parte: true } : { uep: h.uep, pct };
}
// Caixas COM UEP de cada hora (HH:MM): a META EM CX da hora sai do peso delas.
function uepCxComHora(phm){
  const m = {};
  (phm || []).forEach(it => {
    const h = _uepHHMM(it && it.hora);
    if (h && Number(it.uep) > 0) m[h] = (m[h] || 0) + (Number(it.caixas) || 0);
  });
  return m;
}
// "28 min atrás do ritmo": a diferença para o esperado, em minutos de meta.
function uepMinTxt(difMin){
  const a = Math.round(Math.abs(Number(difMin) || 0));
  return a < 1 ? 'no tempo da meta' : `${a} min ${difMin < 0 ? 'atrás' : 'à frente'} do ritmo`;
}
// Projeção: o ritmo de UEP por minuto de jornada lançada, até o fim da jornada.
function uepProj(feito, minNorm){
  const f = Number(feito) || 0, m = Math.min(Math.max(0, Number(minNorm) || 0), UEP_MIN_DIA);
  if (!(m > 0)) return null;
  const porMin = f / m;
  return { porHora: porMin * 60, fim: f + porMin * (UEP_MIN_DIA - m), restMin: UEP_MIN_DIA - m };
}
// UEP por caixa do produto que está rodando. O cadastro manda (UEP por CÓDIGO,
// cada volume com a sua; código com ou sem pontos); sem cadastro, a média de hoje
// do MESMO produto e cor no porHoraModelo (o 501130 tem quatro mesas — nunca só
// pelos 6 dígitos). Nada achado → null.
function uepDoProduto(cod, desc, cor, cat, phm){
  const c = String(cod || '').replace(/\D/g, '');
  if (!c) return null;
  if (Array.isArray(cat)){
    const p = cat.find(x => String(x && x.codigo || '').replace(/\D/g, '') === c);
    if (p && Number(p.uep) > 0) return Number(p.uep);
  }
  const nome = String(desc || '').toUpperCase().trim().replace(/^VOL\.?\s*\d+\s*\/\s*\d+\s*/, '').trim();
  const cr = String(cor || '').toUpperCase().trim();
  let cx = 0, u = 0;
  (phm || []).forEach(it => {
    if (String(it.modelo || '') !== c.slice(0, 6) || String(it.nome || '').toUpperCase().trim() !== nome) return;
    if (String(it.cor || '').toUpperCase().trim() !== cr || !(Number(it.uep) > 0)) return;
    cx += Number(it.caixas) || 0; u += Number(it.uep) || 0;
  });
  return cx > 0 ? u / cx : null;
}
// O MODELO do gerencial: o veredito (uepCard), as horas, a projeção, o que resta de
// jornada e, com jornada lançada (`m`), os minutos à frente/atrás, quando a meta
// sai no ritmo da meta e o produto de agora (a falta em caixas dele, `faltaCx`,
// saiu na 1.21.0: não é a programação).
// o: { uep, metaUep, minNorm, slots, allHoje, phm, agoraMin, tolMin, prod:{cod,desc,cor}, cat }
// ok:false = sem a UEP do dia (lendo: a leitura ainda não chegou; senão backend
// antigo ou cadastro sem UEP) — o painel devolve o veredito às caixas.
function uepGerMontar(o){
  const U = o.uep, ag = Number(o.agoraMin);
  // o.data (dd/MM/yyyy): sábado e domingo são todo hora extra, sem meta — o card
  // traz a UEP inteira em `he`, nada é "feito" contra a meta (1.19.0)
  const card = uepCard(U, o.metaUep, o.minNorm, o.data);
  if (!U || !(U.codigos > 0)) return { ok: false, lendo: U === null, card, agoraMin: ag };
  const meta = card.meta, feito = card.fds ? 0 : Number(U.normal) || 0, he = card.fds ? card.he : Number(U.he) || 0, porMin = meta / UEP_MIN_DIA;
  const horas = uepHorasDia(o.slots, o.allHoje, uepPorHora(o.phm), meta, ag, o.tolMin);
  // O que resta de jornada a partir de agora (o almoço fica de fora) e, no ritmo
  // da meta, quando a meta sai — o "sai às" do card PARA A META dos gerenciais.
  const rest = [];
  horas.forEach(h => { if (h.he) return; const i0 = toMin(h.inicio), f0 = i0 + h.min; if (f0 > ag) rest.push([Math.max(i0, ag), f0]); });
  const minRest = rest.reduce((t, r) => t + r[1] - r[0], 0);
  // no fim de semana não há meta: nada falta para ela (quem lesse G.falta diria
  // "faltam 2.761 UEP" num sábado)
  const falta = card.fds ? 0 : Math.max(0, meta - feito);
  let m = null;
  // Protegido como o PC era (try em volta do _tvUepMontar): um item torto no
  // porHoraModelo ou no cadastro não derruba o gerencial — fica sem os minutos
  // e o "sai às".
  if (Number(o.minNorm) > 0 && horas.some(h => !h.he)) try {
    let chega = null;
    if (falta > 0){
      let v = feito;
      for (const [de, ate] of rest){ const cap = (ate - de) * porMin; if (v + cap >= meta){ chega = de + (meta - v) / porMin; break; } v += cap; }
    }
    const pr = o.prod || {};
    const uepCx = pr.cod ? uepDoProduto(pr.cod, pr.desc, pr.cor, o.cat, o.phm) : null;
    // "VOL 1/1" é ruído; "VOL 1/3" fica — a UEP é daquele volume.
    const nome = String(pr.desc || '').replace(/^VOL\.?\s*1\s*\/\s*1\s*/i, '').trim() || String(pr.cod || '');
    m = { difMin: (feito - (Number(card.esperado) || 0)) / porMin, minRest, chega, falta,
          prod: pr.cod ? { rot: nomeComCor(nome, pr.cor) || nome, nome, cor: String(pr.cor || '').trim(), uepCx } : null };
  } catch (e) { m = null; }
  return { ok: true, card, meta, feito, he, horas, proj: uepProj(feito, o.minNorm), m, agoraMin: ag, minRest, falta,
           cxSem: Number(U.cxSem) || 0, cxCom: uepCxComHora(o.phm) };
}

// ── PRODUTOS EMBALADOS HOJE (os dois gerenciais: mobile 1.39.0, v7.201.0) ────
// A CONTA do quadro — uma só para o celular e o PC (cada painel tem o seu
// desenho). Pura: recebe o porHoraModelo e o porHora do getPontosDia, o
// catálogo e o relógio; não lê DADOS/CFG nem toca no DOM. Testada em
// produtos-dia.test.js com o log real de 04/11/2026.
const PDIA_LARG = 340;   // largura de referência da faixa no celular (px)
const _pdiaNorm = s => String(s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// "VOL 1/2 HOME ANGEL 1.8" → {a:1, b:2, txt:'VOL 1/2'}; sem VOL → null.
function pdiaVol(desc){
  const m = String(desc||'').match(/^\s*VOL\.?\s*(\d+)\s*\/\s*(\d+)/i);
  return m ? { a:+m[1], b:+m[2], txt:`VOL ${m[1]}/${m[2]}` } : null;
}
// Nome do produto como o .gs agrupa (sem o VOL e sem a cor no fim).
function pdiaBase(desc, cor){
  let s = String(desc||'').replace(/^\s*VOL\.?\s*\d+\s*\/\s*\d+\s*/i, '').trim();
  const c = String(cor||'').trim();
  if(c && _pdiaNorm(s).endsWith(' '+_pdiaNorm(c))) s = s.slice(0, s.length-c.length).trim();
  return s;
}
// O nome que cabe num bloco da faixa: inteiro, sem as medidas, ou a última
// palavra (BUFFET 4 PT PRISM → PRISM). Não coube nada → sem rótulo.
// `linhas` (o PC, v7.215.0 — PPCP: "se precisar quebra nome do produto"): o nome
// pode quebrar em até N linhas, sem partir palavra (PENTEADEIRA / CAMARIM MEL em
// vez de só MEL). Sem ele, 1 linha — o celular continua como era.
function pdiaCurto(nome, larg, linhas){
  const n = Math.max(1, Math.floor(Number(linhas) || 1));
  const cabeL = t => t.length*6 + 6 <= larg;
  const cabe = t => {
    let k = 1, lin = '';
    for(const w of t.split(' ')){
      const j = lin ? lin + ' ' + w : w;
      if(cabeL(j)){ lin = j; continue; }
      if(!lin || !cabeL(w) || ++k > n) return false;   // palavra que não cabe sozinha, ou linhas demais
      lin = w;
    }
    return true;
  };
  const pal = String(nome||'').split(/\s+/).filter(Boolean);
  const semMed = pal.filter(w => !/^[\d.,]+$/.test(w));
  // Com mais de 1 linha, antes da última palavra, o fim do nome (o que distingue o
  // produto): PENTEADEIRA CAMARIM MEL → CAMARIM MEL → MEL. Com 1, a regra de antes.
  const fins = n > 1 ? semMed.slice(1, -1).map((_, i) => semMed.slice(i + 1).join(' ')) : [];
  return [pal.join(' '), semMed.join(' '), ...fins, semMed[semMed.length-1]||''].find(t => t && cabe(t)) || '';
}

// phm: porHoraModelo · ph: porHora · cat: catálogo (PRODUTOS, a cor de cada
// código) · atual: código do produto de agora · agoraMin: agora em minutos ·
// o: {turnoIni, turnoFim, almIni, almFim, real, larg, passo, atualDesc}
// (minutos; real = caixas da HORA_A_HORA, para a cobertura; larg = largura da
// faixa em px, só decide se o nome cabe no bloco — PDIA_LARG sem ela; passo =
// minutos entre as marcas do eixo — 120 sem ele; atualDesc = descrição do
// produto de agora, quando o painel a tem; todoHE = sábado/domingo, o dia
// inteiro é hora extra — v7.248.0).
function pdiaMontar(phm, ph, cat, atual, agoraMin, o){
  const dig = c => String(c==null?'':c).replace(/\D/g, '');
  const fimSlot = ini => Math.floor(ini/60)*60 + 60;   // a hora acaba na próxima hora cheia (12:12 → 13:00)
  const ehHE = m => !!o.todoHE || m < o.turnoIni || m >= o.turnoFim;  // a janela do _ehHoraExtraCaixas do .gs (fim de semana: tudo)
  const catPor = {};
  (cat||[]).forEach(c => { if(c) catPor[dig(c.codigo)] = c; });

  // 1) Produtos (modelo + nome), pela régua do .gs: caixas, UEP, cores, horas.
  const prods = [], porKey = {}, porModelo = {};
  const doPhm = [], uepHora = {};
  (phm||[]).forEach((it, i) => {
    const cx = Number(it && it.caixas) || 0;
    const ini = it && it.hora ? toMin(String(it.hora)) : NaN;
    if(!(cx > 0) || !isFinite(ini)) return;
    const modelo = String(it.modelo||''), nome = String(it.nome||'').trim();
    const key = modelo+'|'+nome;
    let p = porKey[key];
    if(!p){
      p = porKey[key] = { key, modelo, nome: nome||modelo, i, seq:null, cores:[], cx:0, uep:0, uepCx:0,
                          he:0, uepHe:0, ini:Infinity, fim:-Infinity, phm:[], log:[] };
      prods.push(p);
      (porModelo[modelo] = porModelo[modelo] || []).push(p);
    }
    const u = Number(it.uep) || 0;
    p.cx += cx;
    if(u > 0){ p.uep += u; p.uepCx += cx; }
    if(ehHE(ini)){ p.he += cx; if(u > 0) p.uepHe += u; }
    const cor = String(it.cor||'').trim();
    if(cor && !p.cores.includes(cor)) p.cores.push(cor);
    p.ini = Math.min(p.ini, ini); p.fim = Math.max(p.fim, fimSlot(ini));
    p.phm.push({ m:ini, hora:String(it.hora), cor, cx });
    doPhm.push({ m:ini, p, cx });
    // UEP por caixa do produto em cada hora (a faixa pela UEP, o.porUep).
    const r = uepHora[ini + '|' + key] = uepHora[ini + '|' + key] || { u:0, cx:0 };
    if(u > 0){ r.u += u; r.cx += cx; }
  });

  // Código → produto. Com um produto só do modelo no dia, é ele; com vários
  // (o 501130 tem quatro mesas), pelo nome. estrito (o produto de agora): só
  // pelo nome — sem ele, nenhum (o código pode ser de uma mesa irmã que ainda
  // não embalou hoje). O nome vem do catálogo ou, sem ele, do próprio log.
  const descLog = {};
  (ph||[]).forEach(l => { if(l && l.desc) descLog[dig(l.codigo)] = l.desc; });
  const prodDoCod = (cod, desc, estrito) => {
    const l = porModelo[dig(cod).slice(0, 6)] || [];
    const c = catPor[dig(cod)] || {};
    const b = _pdiaNorm(pdiaBase(desc || c.desc || descLog[dig(cod)], c.cor));
    const pelo = b ? (l.find(p => _pdiaNorm(p.nome) === b)
                   || l.find(p => { const n = _pdiaNorm(p.nome); return n && (b.startsWith(n) || n.startsWith(b)); })) : null;
    if(pelo) return pelo;
    return estrito ? null : (l[0] || null);
  };

  // 2) O log na ordem dos bipes; a HORA manda (a madrugada pode ser lançada depois).
  const linhas = (ph||[]).map((l, i) => ({ l, i, m: l && l.hora ? toMin(String(l.hora)) : NaN }))
    .filter(x => isFinite(x.m) && Number(x.l.caixas) > 0)
    .sort((a, b) => a.m - b.m || a.i - b.i);
  let n = 0;
  linhas.forEach(x => {
    const p = prodDoCod(x.l.codigo, x.l.desc, false);
    if(!p) return;
    x.p = p;
    if(p.seq == null) p.seq = n++;
    const c = catPor[dig(x.l.codigo)] || {};
    const v = pdiaVol(x.l.desc || c.desc);
    p.log.push({ m:x.m, hora:String(x.l.hora), vol: v && v.b > 1 ? v.txt : '', cor:String(c.cor||'').trim(), cx:Number(x.l.caixas)||0 });
  });
  prods.sort((a, b) => a.ini - b.ini || (a.seq==null?1e9:a.seq) - (b.seq==null?1e9:b.seq) || a.i - b.i);

  // 3) Por hora, os produtos na ordem em que entraram: trocas e faixa.
  const horas = {}, ordH = [];
  const add = (m, p, cx) => {
    if(!horas[m]){ horas[m] = []; ordH.push(m); }
    const j = horas[m].find(x => x.p === p);
    if(j) j.cx += cx; else horas[m].push({ p, cx });
  };
  if(linhas.some(x => x.p)) linhas.forEach(x => { if(x.p) add(x.m, x.p, Number(x.l.caixas)||0); });
  else doPhm.forEach(x => add(x.m, x.p, x.cx));
  ordH.sort((a, b) => a - b);
  // Dentro da hora a ordem é a dos lançamentos — e a madrugada pode ser
  // lançada horas depois. O produto que vinha rodando na hora anterior abre a
  // hora seguinte (é continuação), senão a troca seria contada duas vezes.
  ordH.forEach((m, k) => {
    if(!k) return;
    const ant = horas[ordH[k-1]], ult = ant[ant.length-1].p;
    const j = horas[m].findIndex(x => x.p === ult);
    if(j > 0) horas[m].unshift(horas[m].splice(j, 1)[0]);
  });
  // Troca = o produto muda na sequência. Dentro da MESMA hora conta cada produto
  // uma vez: A,B,A,B numa hora é a esteira com dois lados, não três trocas.
  const seq = [];
  ordH.forEach(m => horas[m].forEach(x => { if(seq[seq.length-1] !== x.p) seq.push(x.p); }));
  const trocas = Math.max(0, seq.length - 1);

  const pAg = atual ? prodDoCod(atual, o.atualDesc || '', true) : null;

  // Faixa do dia: cada hora repartida pelas caixas de cada produto, na ordem em
  // que entraram (a planilha não guarda o minuto da troca); a hora em
  // andamento vai só até agora. Com o.porUep (o PC, rp-core 1.17.0) a hora é
  // repartida pela UEP — o tempo de linha de cada produto; um produto sem UEP
  // naquela hora faz a hora inteira voltar às caixas (nunca mistura as duas).
  const pesoUep = (m, p) => {
    const r = uepHora[m + '|' + p.key];
    if(r && r.u > 0 && r.cx > 0) return r.u / r.cx;
    return p.uepCx > 0 ? p.uep / p.uepCx : null;
  };
  const ini0 = prods.length ? Math.min(...prods.map(p => p.ini)) : o.turnoIni;
  const fim0 = prods.length ? Math.max(...prods.map(p => p.fim)) : o.turnoFim;
  const F = { ini: Math.min(o.turnoIni, Math.floor(ini0/60)*60), fim: Math.max(o.turnoFim, fim0) };
  const segs = [];
  ordH.forEach(m => {
    const a = m;
    let b = fimSlot(m);
    if(agoraMin > a && agoraMin < b) b = agoraMin;
    const rs = o.porUep ? horas[m].map(x => pesoUep(m, x.p)) : null;
    const peso = (x, j) => rs && rs.every(r => r > 0) ? x.cx * rs[j] : x.cx;
    const tot = horas[m].reduce((s, x, j) => s + peso(x, j), 0);
    if(!(b > a) || !(tot > 0)) return;
    let t = a;
    horas[m].forEach((x, j) => {
      const w = (b - a) * peso(x, j) / tot, u = segs[segs.length-1];
      if(u && u.p === x.p && Math.abs(u.fim - t) < 1e-6) u.fim = t + w;
      else segs.push({ p:x.p, ini:t, fim:t + w });
      t += w;
    });
  });
  const span = F.fim - F.ini;
  let tom = 0;
  F.segs = segs.map(s => {
    const ag = s.p === pAg;
    return { ini:s.ini, fim:s.fim, nome:s.p.nome, cls: ag ? 'agora' : 't' + (tom++ % 2),
             rot: pdiaCurto(s.p.nome, (s.fim - s.ini) / span * (Number(o.larg) || PDIA_LARG) - 4, o.linhas) };
  });
  F.ticks = [];
  for(let m = Math.ceil(F.ini/60)*60, i = 0; m <= F.fim; m += (Number(o.passo) || 120), i++){
    const he = !!o.todoHE || m < o.turnoIni || m > o.turnoFim;
    F.ticks.push({ m, he, txt: p2(Math.floor(m/60)) + (i === 0 && (o.todoHE || m < o.turnoIni) ? ' HE' : '') });
  }
  F.he = o.todoHE ? [[F.ini, F.fim]] : [[F.ini, o.turnoIni], [o.turnoFim, F.fim]].filter(r => r[1] > r[0]);
  F.alm = (o.almFim > o.almIni && o.almIni >= F.ini && o.almFim <= F.fim) ? [o.almIni, o.almFim] : null;
  F.agora = (agoraMin > F.ini && agoraMin < F.fim) ? agoraMin : null;

  // 4) A linha de cada produto e o detalhe (cor × volume, hora a hora).
  const uepTot = prods.reduce((s, p) => s + p.uep, 0);
  const produtos = prods.map(p => {
    const vols = [...new Set(p.log.map(r => r.vol).filter(Boolean))].sort();
    let tab = null;
    if(vols.length >= 2){
      const cores = [], lin = {};
      p.log.forEach(r => {
        if(!lin[r.cor]){ lin[r.cor] = vols.map(() => 0); cores.push(r.cor); }
        const j = vols.indexOf(r.vol);
        if(j >= 0) lin[r.cor][j] += r.cx;
      });
      tab = { vols, linhas: cores.map(c => ({ cor:c, v:lin[c] })),
              tot: vols.map((_, j) => cores.reduce((s, c) => s + lin[c][j], 0)) };
    }
    const fonte = p.log.length
      ? p.log.map(r => ({ m:r.m, hora:r.hora, d:[r.vol, r.cor].filter(Boolean).join(' · '), cx:r.cx }))
      : p.phm.map(r => ({ m:r.m, hora:r.hora, d:r.cor, cx:r.cx }));
    const hrs = [];
    fonte.forEach(r => {
      const u = hrs[hrs.length-1];
      if(u && u.m === r.m && u.d === r.d) u.cx += r.cx;
      else hrs.push({ m:r.m, hora:r.hora, d:r.d, cx:r.cx, he:ehHE(r.m) });
    });
    return {
      key:p.key, nome:p.nome, cores:p.cores,
      corTxt: p.cores.length === 1 ? p.cores[0] : (p.cores.length > 1 ? `${p.cores.length} cores` : ''),
      iniTxt: fromMin(p.ini), fimTxt: fromMin(p.fim), agora: p === pAg,
      cx:p.cx, uep: p.uep > 0 ? Math.round(p.uep) : null,
      uepMedia: p.uepCx > 0 ? p.uep / p.uepCx : null, semUepCx: p.cx - p.uepCx,
      // "cx" escrito (rp-core 1.18.0): no celular a linha abre pela UEP, e "178 em HE"
      // embaixo de "2.697 UEP" lia como UEP (achado da revisão da 1.50.0)
      he:p.he, heTxt: p.he > 0 ? (p.he === p.cx ? 'tudo em HE' : `${fmtN(p.he)} cx em HE`) : '',
      uepHe: p.uepHe,   // sem arredondar (1.17.1): 0,4 UEP em hora extra não é "sem UEP"
      pct: p.uep > 0 && uepTot > 0 ? Math.round(p.uep / uepTot * 100) : null,
      tab, horas:hrs
    };
  });
  return {
    cx: prods.reduce((s, p) => s + p.cx, 0), uep: uepTot, heCx: prods.reduce((s, p) => s + p.he, 0),
    uepHe: prods.reduce((s, p) => s + p.uepHe, 0),
    trocas, real: Number(o.real) || 0, produtos, faixa:F
  };
}

// AS PARADAS NA FAIXA DO PRODUTOS EMBALADOS HOJE (rp-core 1.16.0 — PC v7.236.0,
// celular 1.49.0). PPCP, 13/11/2026: "no timeline colocar as paradas". Cada
// parada de hoje vira uma marca no MESMO eixo da faixa dos produtos (F, do
// pdiaMontar). A régua é a do paradas-calc (R = RP_PARADAS: durProdutiva e
// ehPlanejada): o almoço sai da marca e da soma; parada toda no almoço, de zero
// (FIM = INÍCIO) ou sem horário fica fora. Os totais (só as ENCERRADAS) fecham
// com o RP_PARADAS.stats — o TEMPO TOTAL PARADO da aba PARADAS em HOJE. A aberta
// vai até agora (o.agoraTxt) e fica fora do total. Nenhuma perda em caixas.
// o = { R, cfg (almocoInicio/almocoFim), classeMap, agoraTxt 'HH:mm:ss', larg (px da faixa) }.
const PDIA_PAR_ROT_PX = 44;   // a duração escrita na marca só a partir desta largura (px)
function pdiaParMontar(lista, F, o){
  const R = o.R, cfg = o.cfg || {}, span = F.fim - F.ini, larg = Number(o.larg) || PDIA_LARG;
  const HR = /^\d{1,2}:\d{2}(:\d{2})?$/, hm = s => { const t = String(s).split(':'); return p2(Number(t[0])) + ':' + t[1]; };
  const almI = R.horaMin(cfg.almocoInicio), almF = R.horaMin(cfg.almocoFim), temAlm = almF > almI;
  const agora = R.horaMin(o.agoraTxt);
  const P = { estado: 'ok', segs: [], itens: [], n: 0, min: 0, minNP: 0, aberta: null };
  (lista || []).forEach(p => {
    const ini = String(p.ini || '').trim(), fim = String(p.fim || '').trim(), ab = !fim;
    if(!HR.test(ini) || (!ab && !HR.test(fim))) return;
    // Encerrada: a duração da aba PARADAS. Aberta: até agora, com a mesma régua —
    // e com o relógio deste aparelho atrás do INÍCIO gravado pelo celular, até o
    // INÍCIO (zero): a parada aberta não some da linha.
    const a = R.horaMin(ini), fimAb = ab && agora < a ? ini : o.agoraTxt;
    const d = R.durProdutiva(ini, ab ? fimAb : fim, cfg);
    if(d == null || (!ab && !(d > 0))) return;
    const plan = R.ehPlanejada(p.tipo, o.classeMap);
    if(!ab){ P.n++; P.min += d; if(!plan) P.minNP += d; }
    const nome = paradaAInformar(p.tipo) ? 'A INFORMAR (motivo pendente no app)' : String(p.tipo).trim();
    const obs = String(p.obs || '').trim();
    const tit = `${nome} · ${hm(ini)}–${ab ? 'agora' : hm(fim)} · ${R.fmtMin(d)}${ab ? ' até agora · EM ANDAMENTO' : ''}`
      + ` · ${plan ? 'PROGRAMADA' : 'NÃO PROGRAMADA'}${obs ? ' · ' + obs : ''}`;
    P.itens.push({ tit });
    if(ab) P.aberta = { nome, curto: paradaAInformar(p.tipo) ? 'A INFORMAR' : nome, ini: hm(ini), min: d, plan };   // curto: a linha do celular
    // O almoço sai da marca (como sai da soma); o que sobra é cortado na faixa.
    const b = ab ? Math.max(agora, a) : R.horaMin(fim);
    let pc = [[a, b]];
    if(temAlm) pc = [[a, Math.min(b, almI)], [Math.max(a, almF), b]];
    pc = pc.map(([x, y]) => [Math.max(x, F.ini), Math.min(y, F.fim)]).filter(([x, y]) => y > x);
    if(!pc.length) return;
    const px = s => (s[1] - s[0]) / span * larg;
    const larga = pc.reduce((m, s) => (px(s) > px(m) ? s : m), pc[0]);
    pc.forEach(s => P.segs.push({ ini: s[0], fim: s[1], cls: (plan ? 'pl' : 'np') + (ab ? ' ab' : ''), tit,
      rot: s === larga && px(s) >= PDIA_PAR_ROT_PX ? R.fmtMin(d) : '' }));
  });
  return P;
}

// ATRASO VENCIDO (rp-core 1.14.0, card ATRASO do gerencial do celular 1.43.0):
// os lotes com data ANTES de hoje que ainda têm saldo — o `atraso` de cada código
// do calcularProgramacao (FIFO; linha com X fora) — em CAIXAS e em HORAS DE LINHA
// no ritmo da META UEP (UEP ÷ (meta ÷ 527 min)). O programado de hoje não é
// atraso. É o MESMO número do cartão ATRASO da ⚖ UEP do PC (v7.227.0: o `conta.venc`
// do _gpxMontar e as caixas do _gpxAtrasoMontar; o relatorios.test.js confere a
// paridade). `uepDe`: { código: UEP/cx } — os códigos são comparados só pelos
// dígitos (a lista e o cadastro escrevem o código de jeitos diferentes).
// Código sem UEP fica só nas caixas (`semUep`); sem nenhum com UEP, `min` null.
// null = sem a lista por código, ou o .gs sem o `atraso` por código.
// PONTOS (rp-core 1.20.0, PPCP 16/11/2026: "em pontos qtdes de atraso?"):
// `ptsDe` = { código: PONTOS/cx } do cadastro de HOJE (CUSTO REP do ERP; o
// atraso é carteira, vale a tabela de agora, como na programação). `pts` = a
// soma crua das caixas vencidas × pontos — o VALOR do que está atrasado, não o
// tempo (o tempo é a UEP). Código sem pontos (vazio ou 0 no cadastro) fica fora
// da soma e é contado em `semPts`; sem nenhum com pontos, ou sem `ptsDe`, `pts`
// null (nunca 0).
function atrasoVencido(lista, uepDe, metaUep, ptsDe){
  if(!Array.isArray(lista)) return null;
  const k = c => String(c == null ? '' : c).replace(/\D/g, '');
  const dNum = s => { const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(String(s || '')); return m ? Number(m[3] + m[2] + m[1]) : null; };
  const u = {}, p = {};
  Object.keys(uepDe || {}).forEach(c => { const v = Number(uepDe[c]); if(v > 0) u[k(c)] = v; });
  Object.keys(ptsDe || {}).forEach(c => { const v = Number(ptsDe[c]); if(v > 0) p[k(c)] = v; });
  let n = 0, cx = 0, uep = 0, semUep = 0, pts = 0, semPts = 0, desde = '', dMin = null, temAtr = true;
  lista.forEach(x => {
    if(!x) return;
    const f = Number(x.falta) || 0;
    if(f <= 0) return;
    if(x.atraso == null) temAtr = false;
    const a = Math.min(f, Math.max(0, Number(x.atraso) || 0));
    if(a <= 0) return;
    n++; cx += a;
    const uc = u[k(x.codigo)];
    if(uc) uep += a * uc; else semUep++;
    const pc = p[k(x.codigo)];
    if(pc) pts += a * pc; else semPts++;
    const d = dNum(x.atrasoDesde);
    if(d != null && (dMin == null || d < dMin)){ dMin = d; desde = String(x.atrasoDesde).slice(0, 5); }
  });
  if(!temAtr) return null;
  const meta = Number(metaUep) > 0 ? Number(metaUep) : UEP_META_PADRAO;
  return { n, cx, uep, min: n > semUep ? Math.round(uep / (meta / UEP_MIN_DIA)) : null, semUep, desde,
           pts: n > semPts ? pts : null, semPts };
}
// O texto dos pontos do card ATRASO, o MESMO no PC e no celular (1.20.0):
// " · 25.338 pts", arredondado só aqui. Código sem pontos fica fora da soma e é
// dito; sem nenhum com pontos (ou sem `a`), '' — o card não mostra pontos, nunca 0.
function atrasoPtsTxt(a){
  if(!a || a.pts == null) return '';
  return ` · ${fmtN(Math.round(a.pts))} pts${a.semPts ? ` (sem os pontos de ${plural(a.semPts, 'código', 'códigos')})` : ''}`;
}

// ── ATENDIMENTO POR LOTE INTERNO (rp-core 1.22.0 / v7.260.0 / mobile 1.55.0) ──
// PPCP, 17/11/2026, com a PROGRAMACAO_CONCLUIDA na tela: "me mostre como podemos
// apresentar percentual de cada lote que ficou aberto" → "vamos usar o lote
// interno" → aba PROGRAMAÇÃO, o app e a impressão. A CONTA é esta, uma vez, para
// os dois painéis (o .gs v5.69 só entrega as linhas: getAtendimentoLotes).
// `linhas`: { li, data, dataNum, lote, codigo, desc, corGps, qtde, emb, encerrada,
// aba } · `hojeNum` aaaammdd · `n` quantos lotes fechados no resumo (padrão 10).
// Por lote interno (cada um é um dia de programação, com uma COR GPS e vários
// lotes do ERP), em CAIXAS — a mesma régua da coluna PERCENTUAL da planilha:
//   % ATENDIDO  = Σ embalado ÷ Σ programado (o embalado nunca passa da linha)
//   ITENS 100%  = linhas que completaram ÷ linhas
//   FICOU ABERTO  = o que faltou nas linhas ENCERRADAS (não volta)
//   AINDA ABERTO  = o que falta nas linhas ainda na PROGRAMACAO com data vencida
//   o lote de HOJE é "em andamento" (nem ficou, nem está vencido).
// Linha sem a conta do embalado (`emb` null) fica FORA das somas e é contada em
// `semConta` — nunca entra como 0 (E1/E3).
// Os lotes: o de hoje, os `n` fechados mais recentes e, além deles, os mais
// velhos que ainda têm saldo vencido. O resumo é dos `n` fechados; o AINDA ABERTO
// do resumo é de todos os vencidos.
// rp-core 1.23.0 / v7.262.0 (PPCP, 17/11/2026: "tempo de atendimento" → "quanto
// saiu no dia"; "percentual individual?" → "todos, com o %"):
//   - `itens` são TODAS as linhas com conta, cada uma com o `pct` dela; a que
//     completou tem `sit` 'completo' e vai por último.
//   - TEMPO: `x.dia` = [no dia, D+1, D+2+] em caixas, do FIFO do .gs v5.70.
//     Limitado ao embalado da linha, na ordem (no dia primeiro). Linha sem `dia`
//     (o .gs antes da v5.70) fica fora do tempo e é contada em `semTempo` —
//     nunca 0. % NO DIA = Σ no dia ÷ Σ programado das linhas COM tempo.
function loteIntMontar(linhas, hojeNum, n){
  if (!Array.isArray(linhas)) return null;
  const N = Number(n) > 0 ? Math.floor(Number(n)) : 10, hoje = Number(hojeNum) || 0;
  const ord = li => { const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(String(li)); return m ? Number(m[2]) * 10000 + Number(m[1]) : -1; };
  const G = {};
  const SIT = { aberto: 0, andamento: 1, fechado: 2, completo: 3 };
  linhas.forEach(x => {
    if (!x || !x.li) return;
    const li = String(x.li).trim();
    const g = G[li] || (G[li] = { li, dMin: null, dMax: null, data: '', lotes: {}, cores: {}, itens: [], prog: 0, emb: 0, n: 0, n100: 0,
                                  semConta: 0, ficou: 0, nFicou: 0, aberto: 0, nAberto: 0, hoje: false,
                                  progT: 0, noDia: 0, d1: 0, d2: 0, semTempo: 0, progTot: 0 });
    const d = Number(x.dataNum) || 0, q = Math.max(0, Number(x.qtde) || 0);
    if (d && (g.dMin == null || d < g.dMin)) { g.dMin = d; g.data = String(x.data || '').slice(0, 5); }
    if (d && (g.dMax == null || d > g.dMax)) g.dMax = d;
    if (x.lote) g.lotes[String(x.lote)] = 1;
    const cor = String(x.corGps || '').trim().toUpperCase();
    if (cor) g.cores[cor] = (g.cores[cor] || 0) + 1;
    if (d && d === hoje) g.hoje = true;
    g.progTot += q;   // o programado de TODAS as linhas (o do lote sem nenhuma conta)
    if (x.emb == null || !isFinite(Number(x.emb))) { g.semConta++; return; }
    const e = Math.min(Math.max(0, Number(x.emb)), q), falta = q - e;
    g.n++; g.prog += q; g.emb += e;
    // o tempo: as três faixas do FIFO, cortadas no embalado da linha (no dia primeiro)
    let dia = null;
    if (Array.isArray(x.dia) && x.dia.length === 3 && x.dia.every(v => isFinite(Number(v)))) {
      const a = Math.min(Math.max(0, Number(x.dia[0])), e), b = Math.min(Math.max(0, Number(x.dia[1])), e - a);
      dia = [a, b, Math.min(Math.max(0, Number(x.dia[2])), e - a - b)];
      g.progT += q; g.noDia += dia[0]; g.d1 += dia[1]; g.d2 += dia[2];
    } else g.semTempo++;
    let sit = 'completo';
    if (falta <= 0) g.n100++;
    else {
      sit = x.encerrada ? 'fechado' : x.aba === 'aberta' && d && d < hoje ? 'aberto' : 'andamento';
      if (sit === 'fechado') { g.ficou += falta; g.nFicou++; }
      else if (sit === 'aberto') { g.aberto += falta; g.nAberto++; }
    }
    const pi = k => dia && q > 0 ? dia[k] / q * 100 : null;   // o tempo do item, na régua do lote (÷ programado)
    g.itens.push({ lote: String(x.lote || ''), codigo: String(x.codigo || ''), desc: String(x.desc || ''),
                   nome: nomeComCor(x.desc, x.cor),   // 1.24.0: a descrição com a cor do cadastro (sem repetir)
                   qtde: q, emb: e, falta,
                   pct: q > 0 ? e / q * 100 : null, dia, pctNoDia: pi(0), pctD1: pi(1), pctD2: pi(2), sit });
  });
  const pctT = (v, base) => base > 0 ? v / base * 100 : null;
  const todos = Object.keys(G).map(k => {
    const g = G[k];
    g.pct = g.prog > 0 ? g.emb / g.prog * 100 : null;
    // v1.23.1 (revisão): lote sem NENHUMA linha com conta — o programado é conhecido,
    // o embalado não. Nunca "0 de 0" (E1); fica fora dos últimos N (abaixo).
    if (!g.n) { g.prog = g.progTot; g.emb = null; g.pct = null; }
    g.pctNoDia = pctT(g.noDia, g.progT); g.pctD1 = pctT(g.d1, g.progT); g.pctD2 = pctT(g.d2, g.progT);
    g.lotes = Object.keys(g.lotes).sort();
    g.corGps = Object.keys(g.cores).sort((a, b) => g.cores[b] - g.cores[a])[0] || '';
    delete g.cores;
    g.itens.sort((a, b) => (SIT[a.sit] - SIT[b.sit]) || (b.falta - a.falta) || a.codigo.localeCompare(b.codigo));
    return g;
  });
  const cmp = (a, b) => ((b.dMax || 0) - (a.dMax || 0)) || (ord(b.li) - ord(a.li));
  todos.sort(cmp);
  const hojeG = todos.filter(g => g.hoje), fechados = todos.filter(g => !g.hoje && g.n > 0);
  const semCnt = todos.filter(g => !g.hoje && !g.n);   // mostrados, na data deles, mas fora do resumo
  const ult = fechados.slice(0, N), velhos = fechados.slice(N).filter(g => g.aberto > 0);
  const soma = (arr, k) => arr.reduce((t, g) => t + g[k], 0);
  const prog = soma(ult, 'prog'), emb = soma(ult, 'emb'), progT = soma(ult, 'progT');
  const noDia = soma(ult, 'noDia'), d1 = soma(ult, 'd1'), d2 = soma(ult, 'd2');
  const vencidos = fechados.filter(g => g.aberto > 0);
  return {
    lotes: hojeG.concat(ult.concat(velhos, semCnt).sort(cmp)),
    resumo: {
      nLotes: ult.length, de: ult.length ? ult[ult.length - 1].li : '', ate: ult.length ? ult[0].li : '',
      prog, emb, pct: prog > 0 ? emb / prog * 100 : null,
      ficou: soma(ult, 'ficou'), nFicou: soma(ult, 'nFicou'), n: soma(ult, 'n'), n100: soma(ult, 'n100'),
      pctItens: soma(ult, 'n') > 0 ? soma(ult, 'n100') / soma(ult, 'n') * 100 : null,   // o ITENS COMPLETOS, uma conta para os dois desenhos
      aberto: soma(vencidos, 'aberto'), nAberto: soma(vencidos, 'nAberto'), lisAberto: vencidos.map(g => g.li),
      semConta: soma(todos, 'semConta'),
      progT, noDia, d1, d2, pctNoDia: pctT(noDia, progT), pctD1: pctT(d1, progT), pctD2: pctT(d2, progT),
      semTempo: soma(ult, 'semTempo')
    },
    n: N
  };
}

// ── Identificação do módulo ─────────────────────────────────────────────────
// O paradas-calc.js carregou? Função pura, estava copiada IGUAL nos dois HTMLs
// — exatamente o padrão que este arquivo existe para evitar. Quem usa isto são
// as guardas _rpRecarregar de cada painel, que continuam locais (essas tocam o
// DOM e avisam diferente em cada tela).
function _rpOk(){ return typeof window.RP_PARADAS === 'object' && !!window.RP_PARADAS; }

// PARADA SEM MOTIVO (rp-core 1.15.0 / mobile 1.47.0 / v7.234.0). PPCP, 12/11/2026:
// "sobre as paradas na cronoanálise tem a opção de parar e colocar motivo depois,
// faz o mesmo". O operador registra a parada na hora (PAROU) e escolhe o tipo
// depois; até lá a linha da aba PARADAS fica com o TIPO 'A INFORMAR'. Um texto
// à vista na planilha e nos relatórios, nunca vazio: o Pareto mostra quanto
// tempo parado ainda não tem causa. Linha com o TIPO vazio (lançada à mão) também
// conta como a informar. Quem lê: o app (pede o motivo), a TV (não escreve
// "A INFORMAR" em letra de 30 cm) e a GESTÃO DE PERDAS (classe A IDENTIFICAR).
const PARADA_A_INFORMAR = 'A INFORMAR';
function paradaAInformar(tipo){
  const t = String(tipo == null ? '' : tipo).trim().toUpperCase();
  return !t || t === PARADA_A_INFORMAR;
}

// Os painéis checam isto na abertura: se o arquivo não carregou (rede caiu
// entre o HTML e o JS, deploy parcial), eles avisam e buscam de novo em vez de
// morrer com "toMin is not defined" numa tela em branco.
window.RP_CORE = {
  versao: '1.24.0',
  fns: ['p2', 'fmtN', 'fmt1', 'fmtP', 'plural', 'toMin', 'fromMin', 'normHora',
        'hojeStr', 'dtToStr', 'mergeMedias', 'calcAtrasoHoras', 'sc', 'efNoRitmo',
        'slRitmo', 'nomeComCor', '_rpOk', 'uepCard', 'uepPorHora', 'uepCelula', 'uepDiaMeta', 'uepDiaHe', 'histDiaFds', 'metaDiasParadas', 'metaMedianaUteis', 'uepHistResumo', 'uepCusto', 'uepCustoPeriodo', 'minSlotDecorrido',
        'pdiaVol', 'pdiaBase', 'pdiaCurto', 'pdiaMontar', 'pdiaParMontar', 'atrasoVencido', 'atrasoPtsTxt', 'paradaAInformar', 'loteIntMontar',
        'uepHorasDia', 'uepHoraJulga', 'uepCxComHora', 'uepMinTxt', 'uepProj', 'uepDoProduto', 'uepGerMontar']
};
