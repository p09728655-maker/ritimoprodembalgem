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

const UEP_META_PADRAO = 2530;
const UEP_MIN_DIA     = 527;   // minutos da jornada normal (9 slots: 4×60 + 48 + 3×60 + 59)
// ── A RÉGUA DO "BATEU" (v7.133.0, PPCP 16/10/2026: "96%, como as caixas") ──
// A cor do dia saía do `sc` (verde a partir de 96%) e a contagem "bateu" exigia
// 100%: o mesmo dia ficava verde na aba HISTÓRICO e vermelho na aba UEP e na
// diretoria. Agora é UMA régua, a mesma das caixas (META_PCT do painel): bateu
// = UEP ≥ 96% da meta DAQUELE dia; abaixo de 90% é vermelho (o `sc`).
const UEP_BATEU_PCT = 96;
// ── COBERTURA (v7.133.0, PPCP: "avisar e gravar") ──────────────────────────
// Caixa lançada sem produto não vira UEP, mas o tempo dela é cobrado: dia com
// metade das caixas apontadas aparecia com metade da UEP e era julgado lento.
// Abaixo de UEP_COB_MIN % (caixas com UEP ÷ realizado) o dia não é julgado:
// o card avisa em vez de pintar vermelho, e no HISTÓRICO o dia fica fora da
// média e do "bateu" (contado à parte).
const UEP_COB_MIN = 95;
function uepPct(uep, meta){
  const m = Number(meta) > 0 ? Number(meta) : UEP_META_PADRAO;
  return Number(uep) / m * 100;
}
function uepBateu(uep, meta){ return uepPct(uep, meta) >= UEP_BATEU_PCT; }
// Dia do HISTORICO com cobertura gravada abaixo do mínimo. Sem a coluna (dia
// fechado antes da .gs v5.24) a cobertura é desconhecida: o dia continua valendo.
function uepCobBaixa(d){ return !!d && d.uepCob != null && isFinite(Number(d.uepCob)) && Number(d.uepCob) < UEP_COB_MIN; }
// Dia que ENTRA nas contas de UEP do passado: tem UEP gravada e a cobertura
// não é baixa. Uma regra só para o resumo, o custo por UEP e a régua do PLANO.
function uepDiaValido(d){ return !!d && d.uep != null && isFinite(Number(d.uep)) && !uepCobBaixa(d); }
function uepCard(uep, metaCfg, minJornada, realCx){
  const l = 'UEP DO DIA';
  // null = a leitura do dia ainda não chegou; false/undefined = o backend
  // respondeu SEM o campo (.gs anterior à v5.11). São coisas diferentes.
  if (uep === null) return { l, v:'—', sub:'aguardando a leitura do dia…', c:'' };
  if (!uep) return { l, v:'—', sub:'o backend ainda não manda a UEP (.gs v5.11 re-deployado)', c:'' };
  if (!(uep.codigos > 0)) return { l, v:'—', sub:'sem UEP no cadastro — coluna UEP da PRODUTO_CODIGO', c:'' };
  const meta = Number(metaCfg) > 0 ? Number(metaCfg) : UEP_META_PADRAO;
  const feito = Number(uep.normal) || 0, he = Number(uep.he) || 0, cxSem = Number(uep.cxSem) || 0;
  const min = Math.min(Math.max(0, Number(minJornada) || 0), UEP_MIN_DIA);
  const { metaAteAgora, ef } = efNoRitmo(feito, meta, min, UEP_MIN_DIA);
  // Cobertura: caixas valoradas em UEP ÷ realizado do dia (as duas com HE).
  // `realCx` ausente (chamador antigo) = não mede e não muda nada.
  const real = Number(realCx) || 0, cxCom = Number(uep.cxCom) || 0;
  const cob = real > 0 ? cxCom / real * 100 : null;
  const cobBaixa = cob != null && cob < UEP_COB_MIN && min > 0;
  const semProd = real > 0 ? Math.max(0, Math.round(real - cxCom - cxSem)) : 0;
  // Mesmo desenho do card % DA META DO DIA ("ATENÇÃO · 951 de 1.650 cx
  // esperadas até agora"): selo, feito × esperado, depois a meta do dia.
  // PPCP, 25/09/2026: "de 2.530 UEP (55,9%) · NO RITMO — 1.383 esperadas"
  // punha dois vereditos lado a lado (55,9% parecia ruim, NO RITMO bom).
  // Cobertura baixa NÃO julga: o selo vira o aviso, e o número fica sem cor.
  const selo = cobBaixa ? '⚠ SÓ ' + fmtP(cob) + ' DAS CAIXAS COM UEP' : slRitmo(ef);
  const sub = (min > 0
      ? selo + ' · ' + fmtN(Math.round(feito)) + ' de ' + fmtN(Math.round(metaAteAgora)) + ' esperadas · '
      : '')
    // enxuto (v7.120.0): a unidade já está no rótulo do card; a explicação, no `t`
    + 'meta ' + fmtN(meta)
    + (he > 0 ? ' · +' + fmtN(Math.round(he)) + ' em HE' : '')
    + (cxSem > 0 ? ' · ' + fmtN(cxSem) + ' cx sem UEP' : '')
    + (semProd > 0 ? ' · ' + fmtN(semProd) + ' cx sem produto' : '');
  const t = 'UEP feita em jornada normal: caixas × UEP por caixa do cadastro (PRODUTO_CODIGO). '
    + 'Meta de ' + fmtN(meta) + ' UEP na jornada normal (' + UEP_MIN_DIA + ' min); a hora extra fica fora da meta. '
    + 'Esperado até agora = meta × minutos de jornada com lançamento ÷ ' + UEP_MIN_DIA + ' (a hora em andamento conta só os minutos que já passaram).'
    + (cxSem > 0 ? ' ' + fmtN(cxSem) + ' cx de hoje são de códigos sem UEP no cadastro e não entram na conta.' : '')
    + (cob != null ? ' Cobertura: ' + fmtP(cob) + ' das caixas do dia têm UEP' + (cobBaixa ? ' — abaixo de ' + UEP_COB_MIN + '% a UEP sai menor que a real e o card não julga o ritmo.' : '.') : '');
  return { l, v: fmtN(Math.round(feito)), sub, t, c: min > 0 && !cobBaixa ? sc(ef) : (cobBaixa ? '' : 'acc'),
           ef, meta, esperado: metaAteAgora, cob, cobBaixa };
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
  // Dia com cobertura baixa fica fora (v7.133.0): a UEP dele está subestimada
  // e inflaria o R$/UEP.
  const com = (dias || []).filter(d => uepDiaValido(d) && Number(d.uep) > 0);
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
    // O grupo junta volumes e cores do produto (.gs v5.24 manda `cxSemUep`):
    // a caixa do código sem UEP dentro de um produto que tem não pode sumir.
    if (u > 0) { o.uep += u; o.cxSem += Number(it.cxSemUep) || 0; }
    else o.cxSem += Number(it.caixas) || 0;
  });
  return m;
}
// Célula da coluna UEP de uma hora. A meta da hora é a meta de UEP do dia
// (jornada normal) repartida pelos MINUTOS da hora — o slot pós-almoço de 48 min pede
// menos. Hora extra mostra o número e não é julgada (mesma regra das caixas).
// `op` (v7.133.0): `andamento` = hora corrente, ainda não fechou — mostra e não
// julga (às 14:10 a hora das 14:00 saía vermelha contra a meta da hora cheia;
// a aba UEP já não julgava). `zero` = a hora FECHOU sem caixa: é 0 de verdade,
// não "sem produto", e é julgada.
function uepCelula(h, metaCfg, minSlot, ehHE, op){
  op = op || {};
  const meta = Number(metaCfg) > 0 ? Number(metaCfg) : UEP_META_PADRAO;
  const metaH = meta * (Number(minSlot) || 60) / UEP_MIN_DIA;
  if (!h) {
    if (op.zero && !op.andamento) return { txt: '0', cls: ehHE ? '' : 'red', metaH,
      title: 'hora fechada sem caixa' + (ehHE ? ' (hora extra)' : ' · meta ' + fmtN(Math.round(metaH)) + ' UEP nesta hora') };
    return { txt: '—', cls: '', title: op.andamento ? 'hora em andamento — ainda sem caixa com produto' : 'nenhuma caixa com produto apontada nesta hora' };
  }
  const txt = fmtN(Math.round(h.uep)) + (h.cxSem > 0 ? '*' : '');
  const title = fmtN(Math.round(h.uep)) + ' UEP'
    + (ehHE ? ' em hora extra (fora da meta)' : ' · meta ' + fmtN(Math.round(metaH)) + ' UEP nesta hora (' + (Number(minSlot) || 60) + ' min)')
    + (op.andamento ? ' · hora em andamento, ainda não julgada' : '')
    + (h.cxSem > 0 ? ' · * ' + fmtN(h.cxSem) + ' cx de códigos sem UEP ficaram fora' : '');
  return { txt, title, cls: ehHE || op.andamento || !(h.uep > 0) ? '' : sc(h.uep / metaH * 100), metaH };
}

// ── UEP dos dias fechados (HISTÓRICO, relatório semanal) ────────────────────
// Cada dia do HISTORICO traz a UEP de jornada normal e a META UEP gravadas no
// fechamento (.gs v5.14) — congeladas: mudar a UEP do cadastro hoje não reescreve
// o dia de ontem. Dia sem UEP (null) fica FORA da média e da contagem, e é
// contado à parte; nunca vira zero.
function uepDiaMeta(d){
  return d && Number(d.metaUep) > 0 ? Number(d.metaUep) : UEP_META_PADRAO;
}
function uepHistResumo(dias){
  const lista = dias || [];
  // Dia com cobertura baixa (v7.133.0) fica fora da média e do "bateu" e é
  // contado à parte (`cobBaixa`): a UEP dele está subestimada.
  const com = lista.filter(uepDiaValido);
  const cobBaixa = lista.filter(d => d && d.uep != null && uepCobBaixa(d)).length;
  const tot = com.reduce((s, d) => s + Number(d.uep), 0);
  const bateu = com.filter(d => uepBateu(d.uep, uepDiaMeta(d))).length;
  // Soma das metas DOS DIAS COM UEP (cada um com a sua): é contra ela que o
  // total do período se compara, nunca meta × nº de dias do filtro.
  const metaTot = com.reduce((s, d) => s + uepDiaMeta(d), 0);
  const pct = metaTot > 0 ? tot / metaTot * 100 : null;
  return { n: com.length, semUep: lista.length - com.length - cobBaixa, cobBaixa,
           total: tot, media: com.length ? tot / com.length : null,
           bateu, he: com.reduce((s, d) => s + (Number(d.uepHe) || 0), 0),
           metaTot, pct,
           // O PERÍODO bateu pela MESMA régua do dia (96% da soma das metas).
           bateuPeriodo: pct != null && pct >= UEP_BATEU_PCT,
           meta: com.length ? uepDiaMeta(com[com.length - 1]) : UEP_META_PADRAO };
}

// ── Identificação do módulo ─────────────────────────────────────────────────
// O paradas-calc.js carregou? Função pura, estava copiada IGUAL nos dois HTMLs
// — exatamente o padrão que este arquivo existe para evitar. Quem usa isto são
// as guardas _rpRecarregar de cada painel, que continuam locais (essas tocam o
// DOM e avisam diferente em cada tela).
function _rpOk(){ return typeof window.RP_PARADAS === 'object' && !!window.RP_PARADAS; }

// Os painéis checam isto na abertura: se o arquivo não carregou (rede caiu
// entre o HTML e o JS, deploy parcial), eles avisam e buscam de novo em vez de
// morrer com "toMin is not defined" numa tela em branco.
window.RP_CORE = {
  versao: '1.13.0',
  fns: ['p2', 'fmtN', 'fmt1', 'fmtP', 'plural', 'toMin', 'fromMin', 'normHora',
        'hojeStr', 'dtToStr', 'mergeMedias', 'calcAtrasoHoras', 'sc', 'efNoRitmo',
        'slRitmo', 'nomeComCor', '_rpOk', 'uepCard', 'uepPorHora', 'uepCelula', 'uepDiaMeta', 'uepHistResumo', 'uepCusto', 'uepCustoPeriodo', 'minSlotDecorrido',
        'uepPct', 'uepBateu', 'uepCobBaixa', 'uepDiaValido']
};
