/* ═══════════════════════════════════════════════════════════════════════════
   RitmoProd · núcleo comum dos painéis  —  IMPLEMENTAÇÃO ÚNICA
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
function toMin(s){ const [h, m] = s.split(':').map(Number); return h * 60 + m; }
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
  versao: '1.3.0',
  fns: ['p2', 'fmtN', 'fmt1', 'fmtP', 'plural', 'toMin', 'fromMin', 'normHora',
        'hojeStr', 'dtToStr', 'mergeMedias', 'calcAtrasoHoras', 'sc', 'efNoRitmo',
        'nomeComCor', '_rpOk']
};
