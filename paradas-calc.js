// ════════════════════════════════════════════════════════════════════════════
// RitmoProd · CÁLCULO DE PARADAS — implementação ÚNICA
// ════════════════════════════════════════════════════════════════════════════
// Carregado pelo painel desktop (ritmoprod_embalagem_v7.html) E pelo mobile
// (ritmoprod_mobile.html). Antes cada um tinha a sua cópia da conta e os dois
// divergiam sozinhos a cada mexida: primeiro na base de dias, depois na meta por
// dia, depois na classificação das paradas. Toda vez alguém olhava dois números
// diferentes para o mesmo período e não sabia em qual acreditar.
//
// Regra: NADA de conta de parada nos HTMLs. Eles só montam as entradas
// (metaByDay, realByDay, classeMap) e chamam RP_PARADAS.stats().
//
// O retorno traz um bloco `diag` com as ENTRADAS que foram efetivamente usadas.
// É ele que responde "por que os dois painéis discordam?" sem precisar abrir o
// código: se o ritmo, as horas produtivas, os dias sem meta ou as classes
// diferirem entre as telas, a causa está ali.
//
// Sem dependências, sem build: é um <script src> comum, servido pela Vercel.
(function (glob) {
  'use strict';

  // Paradas planejadas por NOME — reserva usada só quando a aba TIPOS_PARADA
  // não trouxe a coluna CLASSE daquele tipo.
  var PLANEJADA_RE = /refei|interval|almo/i;

  // 'dd/MM/yyyy' → número comparável (yyyymmdd). 0 quando não reconhece.
  function dataNum(s) {
    var m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? (+m[3]) * 10000 + (+m[2]) * 100 + (+m[1]) : 0;
  }

  function toMin(hhmm) {
    var p = String(hhmm || '').split(':');
    return (+p[0]) * 60 + (+p[1]);
  }

  // Horas produtivas do turno = turno − almoço. Nunca menos de 1 (evita divisão
  // por zero se o turno vier mal configurado).
  function horasProdutivas(cfg) {
    cfg = cfg || {};
    var t = toMin(cfg.turnoFim) - toMin(cfg.turnoInicio);
    var a = toMin(cfg.almocoFim) - toMin(cfg.almocoInicio);
    var h = (t - a) / 60;
    return isFinite(h) ? Math.max(1, h) : 1;
  }

  // Duração em minutos. null quando falta início/fim ou o formato não bate —
  // é assim que a parada EM ANDAMENTO (sem FIM) fica de fora: sem fim não há
  // duração, e sem duração não há perda que se possa estimar.
  function durMin(ini, fim) {
    if (!/^\d{1,2}:\d{2}$/.test(String(ini)) || !/^\d{1,2}:\d{2}$/.test(String(fim))) return null;
    var d = toMin(fim) - toMin(ini);
    return d >= 0 ? d : null;
  }

  function fmtMin(m) {
    if (m == null) return '—';
    return m >= 60 ? Math.floor(m / 60) + 'h' + String(m % 60).padStart(2, '0') + 'm' : m + ' min';
  }

  // Duração PRODUTIVA: os minutos da parada que caem fora do almoço.
  //
  // O almoço não é tempo disponível — as horas produtivas do turno já descontam
  // 11:00-12:12. Contar uma "parada" de almoço como tempo parado é descontar
  // duas vezes: inflava o TEMPO TOTAL PARADO, o nº de paradas e ainda colocava
  // o ALMOÇO no topo dos ofensores, onde ele não diz nada sobre a linha.
  //
  // Parada que ATRAVESSA o almoço (ex.: manutenção 10:30-12:30) não é
  // descartada: conta só o que caiu em tempo produtivo (30 + 18 = 48 min, não
  // 120). Parada inteiramente dentro do almoço vira 0 e sai da análise.
  function durProdutiva(ini, fim, cfg) {
    var bruta = durMin(ini, fim);
    if (bruta == null) return null;
    cfg = cfg || {};
    var aIni = toMin(cfg.almocoInicio), aFim = toMin(cfg.almocoFim);
    if (!isFinite(aIni) || !isFinite(aFim) || aFim <= aIni) return bruta;
    var pIni = toMin(ini), pFim = toMin(fim);
    var sobrepoe = Math.max(0, Math.min(pFim, aFim) - Math.max(pIni, aIni));
    return Math.max(0, bruta - sobrepoe);
  }

  // A coluna CLASSE da aba TIPOS_PARADA manda; vazia, cai na heurística.
  function ehPlanejada(tipo, classeMap) {
    var c = (classeMap || {})[String(tipo || '').trim()];
    if (c === 'PLANEJADA') return true;
    if (c === 'NAO') return false;
    return PLANEJADA_RE.test(tipo || '');
  }

  // Dias TRABALHADOS no período: os que têm produção lançada. É a base da
  // média/dia e da disponibilidade. Dividir por "dias que tiveram parada" tira
  // da conta justamente o dia trabalhado que rodou sem parar — o melhor dia — e
  // a média sobe sozinha. Sábado, domingo, feriado e parada de fábrica saem
  // daqui sem regra nenhuma, porque não têm produção lançada.
  // Devolve 0 quando não há histórico; aí quem chama cai na base antiga.
  function diasTrabalhados(realByDay, de, ate) {
    return diasTrabalhadosLista(realByDay, de, ate).length;
  }

  // A LISTA por trás do diasTrabalhados. A camada GESTÃO DAS PERDAS do
  // relatório precisa saber QUAIS dias entraram, não só quantos: é essa lista
  // que dá a base de cada dia/semana na evolução da disponibilidade. Contagem e
  // lista saem do MESMO filtro — separadas, divergiriam na primeira mexida.
  function diasTrabalhadosLista(realByDay, de, ate) {
    if (!realByDay) return [];
    var nDe = de ? dataNum(de) : 0, nAte = ate ? dataNum(ate) : 0, out = [];
    Object.keys(realByDay).forEach(function (d) {
      var x = dataNum(d);
      if (!x) return;
      if (nDe && x < nDe) return;
      if (nAte && x > nAte) return;
      if ((parseFloat(realByDay[d]) || 0) > 0) out.push(d);
    });
    return out.sort(function (a, b) { return dataNum(a) - dataNum(b); });
  }

  // A FÓRMULA DA PERDA, num lugar só: minutos parados × (meta daquele dia ÷
  // horas produtivas do turno). Saiu de dentro do stats() para a camada nova do
  // relatório poder valorar um recorte (um dia, uma semana, um cenário de
  // recuperação) sem escrever a conta de novo — foi a cópia da conta que fez os
  // dois painéis divergirem três vezes. O stats() chama esta mesma função.
  //
  // ⚠ ARREDONDAR SÓ NA EXIBIÇÃO. A conta crua mora na `perdaBrutaDeMin`; quem
  // soma várias paradas (o stats) acumula a BRUTA e arredonda no fim. Somar o
  // arredondado de cada parada enviesa sempre para MENOS, porque a fração de
  // cada uma é descartada uma por uma: 30 paradas de 3 min com meta 1600 e 8,8h
  // davam 270 cx em vez de 273, e 20 paradas de 1 min com meta 264 davam
  // ZERO em vez de 10 (cada uma cai em 0,4999… e some). Como o `ritmoHora` do
  // diagnóstico é derivado de `pecas`, esse caso extremo fazia a linha que o
  // CLAUDE.md manda comparar primeiro sair "0 cx/h".
  function perdaBrutaDeMin(min, metaDia, horasProd) {
    var m = parseFloat(min) || 0;
    var meta = parseFloat(metaDia) || 0;
    var h = parseFloat(horasProd) || 0;
    if (m <= 0 || meta <= 0 || h <= 0) return 0;
    return m / 60 * (meta / h);
  }
  function perdaDeMin(min, metaDia, horasProd) {
    return Math.round(perdaBrutaDeMin(min, metaDia, horasProd));
  }

  // Perda estimada valorando um tempo parado (min) num ritmo qualquer (cx/h).
  // Existe para mostrar, ao lado das CAIXAS PERDIDAS (que valoram pela meta do
  // dia — "quanto o plano perdeu"), a perda no ritmo REAL medido da linha
  // (caixas ÷ tempo rodando — "quanto a linha deixou de produzir na capacidade
  // demonstrada"). São leituras diferentes do MESMO tempo parado; nenhuma
  // substitui a outra.
  function perdaAoRitmo(minParados, ritmoHora) {
    var m = parseFloat(minParados) || 0, r = parseFloat(ritmoHora) || 0;
    return (m > 0 && r > 0) ? Math.round(m / 60 * r) : 0;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // stats(paradas, opts)
  //
  //   cfg          {turnoInicio,turnoFim,almocoInicio,almocoFim,metaDia}
  //   metaByDay    {'dd/MM/yyyy': meta}  meta de CADA dia (do HISTORICO)
  //   metaHoje     meta de hoje (hoje ainda não está no HISTORICO)
  //   hoje         'dd/MM/yyyy'
  //   classeMap    {tipo: 'PLANEJADA'|'NAO'} da aba TIPOS_PARADA
  //   realByDay    {'dd/MM/yyyy': produzido} p/ contar dias trabalhados
  //   de, ate      limites do período (mesmo formato)
  //   nDiasBase    força a base de dias (o HISTÓRICO já sabe exatamente quais
  //                dias entraram na lista, não precisa derivar do realByDay)
  //   pesoMedio    kg por caixa (opcional, só o desktop usa)
  //
  // Perda = duração × (meta DAQUELE dia ÷ horas produtivas). Usar a meta de hoje
  // para todos os dias dava 3.780 cx onde a conta certa dava 3.897 em 30 dias.
  // Parada planejada conta 0. O atraso acumulado NÃO entra na meta: é backlog de
  // outros dias, não o ritmo que a linha teria durante a parada.
  // ──────────────────────────────────────────────────────────────────────────
  function stats(paradas, opts) {
    opts = opts || {};
    var cfg        = opts.cfg || {};
    var metaByDay  = opts.metaByDay || {};
    var classeMap  = opts.classeMap || {};
    var hoje       = opts.hoje || '';
    var horasProd  = horasProdutivas(cfg);
    var metaPadrao = parseFloat(cfg.metaDia) || 0;

    // Cópia: escrever a meta de hoje direto no metaByDay ESCREVIA NO OBJETO DO
    // CHAMADOR. O mobile monta um objeto novo a cada chamada e não sentia, mas o
    // v7 passa o mesmo metaByDay de fora — reaproveitado entre períodos, o 2º
    // stats já nascia com a meta de hoje injetada num dia que não é hoje.
    if (hoje && (parseFloat(opts.metaHoje) || 0) > 0) {
      metaByDay = Object.assign({}, metaByDay);
      metaByDay[hoje] = parseFloat(opts.metaHoje);
    }

    var totMin = 0, totMinNP = 0, pecas = 0, nParadas = 0;
    var porTipo = {}, porDia = {}, diasSet = {}, semMeta = {}, ignoradas = 0;
    var minAlmoco = 0, noAlmoco = 0;

    (paradas || []).forEach(function (p) {
      var bruta = durMin(p.ini, p.fim);
      if (bruta == null) { ignoradas++; return; }   // em andamento / horário inválido
      // Só o tempo fora do almoço conta (ver durProdutiva).
      var d = durProdutiva(p.ini, p.fim, cfg);
      if (bruta > d) minAlmoco += (bruta - d);
      if (d <= 0) { noAlmoco++; return; }           // parada inteira dentro do almoço
      nParadas++; diasSet[p.data] = 1; totMin += d;

      var planej = ehPlanejada(p.tipo, classeMap);
      var metaDoDia = parseFloat(metaByDay[p.data]) || 0;
      if (!metaDoDia) { semMeta[p.data] = 1; metaDoDia = metaPadrao; }
      // Bruta (sem arredondar) — ver perdaBrutaDeMin. Todo acumulador abaixo
      // soma a bruta; o arredondamento é feito uma vez só, no fim.
      var perd = planej ? 0 : perdaBrutaDeMin(d, metaDoDia, horasProd);
      if (!planej) { totMinNP += d; pecas += perd; }

      var k = p.tipo || '—';
      if (!porTipo[k]) porTipo[k] = { qtd: 0, min: 0, perd: 0, planej: planej };
      porTipo[k].qtd++; porTipo[k].min += d; porTipo[k].perd += perd;

      // porDia guarda também a QUANTIDADE e a quebra por tipo do dia: é delas
      // que sai o Pareto diário (principal causa de cada dia) da camada GESTÃO
      // DAS PERDAS. Campos ADICIONAIS — min/minNP/perd seguem iguais, e quem já
      // lia só esses três não muda de comportamento.
      if (!porDia[p.data]) porDia[p.data] = { min: 0, minNP: 0, perd: 0, qtd: 0, qtdNP: 0, tipos: {} };
      if (!porDia[p.data].tipos) { porDia[p.data].qtd = 0; porDia[p.data].qtdNP = 0; porDia[p.data].tipos = {}; }
      porDia[p.data].min += d; porDia[p.data].perd += perd; porDia[p.data].qtd++;
      if (!planej) { porDia[p.data].minNP += d; porDia[p.data].qtdNP++; }
      var td = porDia[p.data].tipos;
      if (!td[k]) td[k] = { qtd: 0, min: 0, perd: 0, planej: planej };
      td[k].qtd++; td[k].min += d; td[k].perd += perd;
    });

    // Arredondamento ÚNICO, aqui: até esta linha tudo é bruta. Cada total é
    // arredondado a partir da própria soma crua, então nenhum deles carrega o
    // viés de descartar a fração de cada parada. Consequência aceita: a soma
    // dos valores de linha da lista (cada um arredondado na tela) pode ficar
    // 1 cx longe do total — é o mesmo critério do rateio da troca no
    // comparativo por modelo ("o arredondamento é só na exibição").
    pecas = Math.round(pecas);
    Object.keys(porTipo).forEach(function (t) { porTipo[t].perd = Math.round(porTipo[t].perd); });
    Object.keys(porDia).forEach(function (dia) {
      porDia[dia].perd = Math.round(porDia[dia].perd);
      var td = porDia[dia].tipos || {};
      Object.keys(td).forEach(function (t) { td[t].perd = Math.round(td[t].perd); });
    });

    var nDiasParada = Object.keys(diasSet).length || 1;
    var forcado     = parseInt(opts.nDiasBase, 10) || 0;
    var nDiasTrab   = forcado > 0 ? forcado : diasTrabalhados(opts.realByDay, opts.de, opts.ate);
    var baseTrab    = nDiasTrab > 0;
    var nDias       = baseTrab ? nDiasTrab : nDiasParada;

    var tempoDispMin = nDias * horasProd * 60;
    var dispon  = tempoDispMin > 0 ? Math.max(0, (tempoDispMin - totMinNP) / tempoDispMin * 100) : 100;
    var pctPerd = tempoDispMin > 0 ? (totMinNP / tempoDispMin * 100) : 0;
    var media   = nDias > 0 ? Math.round(pecas / nDias) : 0;
    var tMed    = nParadas > 0 ? Math.round(totMin / nParadas) : 0;

    // Ritmo de referência: derivado da própria perda, p/ ficar coerente com o
    // número exibido. Sem parada não planejada, cai na meta de hoje ÷ horas.
    var ritmoHora = totMinNP > 0
      ? Math.round(pecas / (totMinNP / 60))
      : Math.round(((parseFloat(metaByDay[hoje]) || metaPadrao) / horasProd) || 0);
    var taktSeg = ritmoHora > 0 ? Math.round(3600 / ritmoHora) : 0;

    var pesoMedio = parseFloat(opts.pesoMedio) || 0;
    var tipos = Object.keys(porTipo).map(function (t) {
      var o = porTipo[t]; return { tipo: t, qtd: o.qtd, min: o.min, perd: o.perd, planej: o.planej };
    }).sort(function (a, b) { return b.min - a.min; });

    return {
      horasProd: horasProd, pesoMedio: pesoMedio,
      totMin: totMin, totMinNP: totMinNP,
      pecas: pecas, pesoPerd: Math.round(pecas * pesoMedio),
      nParadas: nParadas, n: nParadas,          // `n` = nome usado no mobile
      nDias: nDias, nDiasParada: nDiasParada, baseTrab: baseTrab,
      media: media, mediaPerd: media,           // `mediaPerd` = nome usado no v7
      dispon: dispon, pctPerd: pctPerd, tMed: tMed,
      ritmoHora: ritmoHora, taktSeg: taktSeg,
      tipos: tipos, porTipo: porTipo, porDia: porDia,
      // ── Diagnóstico: as ENTRADAS que valeram nesta conta ────────────────
      // Quando duas telas mostram números diferentes, é aqui que dá pra ver o
      // porquê sem abrir o código.
      diag: {
        versao: VERSAO,
        horasProd: horasProd,
        ritmoHora: ritmoHora,
        metaPadrao: metaPadrao,
        metaHoje: parseFloat(metaByDay[hoje]) || 0,
        // dias que tiveram parada mas NÃO tinham meta no metaByDay (caíram no
        // metaDia padrão) — causa clássica de divergência entre as telas
        diasSemMeta: Object.keys(semMeta).sort(),
        classesCarregadas: Object.keys(classeMap).length,
        tiposPlanejados: tipos.filter(function (t) { return t.planej; }).map(function (t) { return t.tipo; }),
        paradasIgnoradas: ignoradas,            // sem FIM (em andamento) ou hora inválida
        paradasNoAlmoco: noAlmoco,              // caíram inteiras dentro do almoço
        minAlmocoExcluidos: minAlmoco,          // minutos de almoço tirados da conta
        periodo: (opts.de || '?') + ' a ' + (opts.ate || '?'),
        baseDias: baseTrab ? 'trabalhados' : 'com parada'
      }
    };
  }

  // Resumo de uma linha do diag — as duas telas mostram este texto, então dá pra
  // comparar batendo o olho.
  function diagTexto(d) {
    if (!d) return '';
    return 'duração × ' + d.ritmoHora + ' cx/h (meta do dia ÷ ' + d.horasProd.toFixed(1) + 'h produtivas)'
      + ' · ' + d.classesCarregadas + ' classe(s)'
      + (d.minAlmocoExcluidos ? ' · almoço fora (' + fmtMin(d.minAlmocoExcluidos) + ')' : '')
      + (d.diasSemMeta.length ? ' · ' + d.diasSemMeta.length + ' dia(s) sem meta' : '')
      + (d.paradasIgnoradas ? ' · ' + d.paradasIgnoradas + ' sem fim' : '');
  }

  var VERSAO = '1.2.0';

  glob.RP_PARADAS = {
    VERSAO: VERSAO,
    PLANEJADA_RE: PLANEJADA_RE,
    dataNum: dataNum,
    horasProdutivas: horasProdutivas,
    durMin: durMin,
    durProdutiva: durProdutiva,
    fmtMin: fmtMin,
    ehPlanejada: ehPlanejada,
    diasTrabalhados: diasTrabalhados,
    diasTrabalhadosLista: diasTrabalhadosLista,
    perdaDeMin: perdaDeMin,
    perdaAoRitmo: perdaAoRitmo,
    stats: stats,
    diagTexto: diagTexto
  };
// window no navegador (inclusive o browser da TV, que pode não ter globalThis);
// globalThis no Node, onde roda o teste de paridade.
})(typeof window !== 'undefined' ? window
   : (typeof globalThis !== 'undefined' ? globalThis : this));
