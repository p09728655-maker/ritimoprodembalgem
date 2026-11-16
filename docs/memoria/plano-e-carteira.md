# Plano e carteira — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## Aba PLANO — a meta contra a capacidade demonstrada
- **O painel media a linha e o plano com o MESMO número, e nenhum dos dois
  aparecia.** Medido no `HISTORICO` em 15/09/2026, 79 dias: a correlação entre a
  META do dia e o REALIZADO é **r = 0,28** — **r² de 8%**. A EFICIÊNCIA varia de
  **32,6% a 188,5%** porque o **denominador** pula. Nos últimos 8 dias a meta foi
  de **p0** (900 cx, abaixo de tudo que a linha já fez) a **p100** (2.950 cx).
- **A causa está no código:** `CFG.metaDia` é a soma dos lotes datados para o
  dia (`aplicarMetaDiaAutomatica`), então a meta herda a irregularidade da
  **datação dos lotes**, não da operação. Atacar isso é datar contra capacidade.
- ⚠ **A CAPACIDADE É A JORNADA NORMAL — HORA EXTRA FICA FORA** (v7.56.0, PPCP,
  16/09/2026: *"tem que ser justo, desconsiderar horas extras"*). A curva saía
  do realizado TOTAL do `HISTORICO`: o melhor dia (3.217 em 15/09) tinha 224 cx
  de HE, a madrugada de 05:00 entrava inteira, e a HE era contada duas vezes —
  escondida na régua e como remédio do veredito. `_qpDiasBase(dias)` é a
  base única dos dois blocos, da tela e dos dois PDFs: cada dia entra com
  `real − heCx` (`_qpRealDia`), o total fica em `realTotal` (tooltip), sábado
  inteiro em HE sai sozinho, e dia sem separação (`heCx` nulo) entra inteiro e
  é contado (`semSep` → `a.nSemSep`, impresso). **Não voltar a filtrar por
  `Number(d.real) > 0` nos chamadores** — o teste prende os quatro.
- A aba responde **duas perguntas independentes**, e é preciso as duas:
  **ALTURA** (`_qpPercentil` — em que percentil da capacidade a meta cai) e
  **OSCILAÇÃO** (`_qpOscilacao` — quanto ela pula). Medido: altura **p53** (boa)
  com oscilação **34,5%** (ruim). Um indicador que olhasse só a altura aprovaria.
- ⚠ **A FAIXA DO MEIO precisa de veredito próprio.** Sem ela, oscilação de
  **28,3%** — acima do combinado de 20%, abaixo do 30% que reprova — saía como
  `PLANO EXEQUÍVEL`. Hoje é `META OSCILANDO`. A oscilação vem **piorando**:
  28,3% em 79 dias, 31,6% em 60, 34,5% em 30, 35% em 15.
- ⚠ **NÃO é "baixar a meta", e o texto da tela diz isso.** A função da meta do
  dia é **sinalizar**: meta que a linha bate em ~metade dos dias faz o vermelho
  significar alguma coisa. Meta que reprova 2 em 3 dias vira paisagem e o alarme
  se perde — é o alarme que vale dinheiro. A produção sobe pelas **paradas**,
  pelo **setup** e pelo **teto da esteira**, e a meta sobe **atrás** da
  capacidade demonstrada.
- **Custo zero:** lê o `buildDiasHistAsync` (cache de 2 min) que o HISTÓRICO e a
  cascata já usam. **Nenhuma chamada nova ao Apps Script, nenhum re-deploy.**
- O combinado mora em constantes (`QP_ALVO_MIN` 50 · `QP_ALVO_MAX` 60 ·
  `QP_ACIMA` 75 · `QP_OSC_OK` 20 · `QP_OSC_RUIM` 30 · `QP_MIN_DIAS` 10).
- **O desenho (`_qpHtml`) não faz conta** — tudo vem pronto do `_qpAnalise`, e o
  teste falha se `_qpPercentil`/`_qpOscilacao`/`_qpCurva` aparecerem dentro dele.
- ⚠ **A curva usa TODO o histórico; o filtro escolhe só quais metas são
  julgadas.** Recortar a curva junto com o período faria a régua mudar de
  tamanho a cada clique, e aí o percentil de ontem mudaria sem nada ter mudado.
- ⚠ **O GRÁFICO É DIA A DIA, no calendário — e já foi outro.** A 1ª versão
  (v7.45.0) punha o **percentil no eixo horizontal**: os 79 dias enfileirados do
  pior para o melhor, com a meta de cada dia pousada na curva. **O próprio PPCP,
  que pediu a tela, não conseguiu ler** — e tinha acabado de perguntar o que era
  p50. Trocado na v7.47.0.
  - Regra que isso confirma: **quando a interface e o entendimento divergem, o
    defeito é da interface**. Tela de gestão à vista que precisa de aula falha na
    parede, e falha primeiro com quem passa rápido.
  - O gráfico de hoje tem **duas linhas** — meta (laranja) e realizado (cinza) —
    e é assim que o **r²=8% aparece desenhado**: elas não se acompanham. Na
    versão do ranking o realizado **nem era desenhado**, então o achado principal
    da tela não aparecia.
  - ⚠ **A RÉGUA É MÓVEL, e o padrão é 60 dias** (v7.48.0). Antes usava todo o
    histórico e **subestimava a linha**: medido em 15/09/2026, com os 79 dias a
    faixa dava `p50=1.548 / p60=1.602`, e só com os últimos 30 dava
    `1.602 / 1.795` — julho (p50 de 1.466) puxava para baixo. Janela curta demais
    pula com uma semana ruim; longa demais carrega um mês ruim que já passou.
  - ⚠ **São DOIS recortes e eles não se confundem:** *JULGAR* escolhe quais dias
    aparecem no gráfico; *RÉGUA* escolhe de quais dias sai o padrão com que eles
    são comparados. O subtítulo da tela existe só para dizer isso (desde a
    v7.199.0, na barra da sub-aba COMO TEMOS DATADO, com o JULGAR ao lado e a
    RÉGUA no cabeçalho).
  - **A FAIXA ALVO é testável na tela** (p45–p55 … p60–p70). As constantes
    `QP_ALVO_*` são o **ponto de partida**, não a lei: a faixa entra por
    parâmetro no `_qpAnalise`, e **o veredito e o desenho leem dela** — senão a
    tela julgaria por uma faixa e pintaria por outra. O card DIAS ACIMA mostra
    quantos dias caíram **dentro** da faixa, que é o número de comparação.
  - A escolha fica em `localStorage['rpe_qp_pref']` (régua, faixa, janela **e
    ordem**) — calibrar leva dias, e perder o ajuste a cada F5 faria ninguém
    calibrar. ⚠ Chave nova: **nunca
    renomear por estética** (mesma regra das `rpe_*`).
  - Os rótulos dentro do gráfico levam **fundo próprio** (`<rect>` atrás do
    `<text>`): por cima das linhas ficavam ilegíveis.
- ⚠ **A ORDEM da tabela troca o RECORTE, não só a sequência** (`_qpOrdenar`,
  v7.49.0). Por `data` a tabela é a **cauda** do período (os últimos 15 dias);
  por `alta`/`baixa` é o **topo** (ou o fundo) do período **inteiro**.
  Reordenar só os últimos 15 deixaria escondida a meta impossível de três
  semanas atrás — que é o que se procura ao pedir ordem por percentil. Medido
  em 15/09/2026 (30 dias julgados): as duas metas de **2.950 cx** (p100, acima
  de tudo que a linha já fez) não apareciam na tabela por data. É por isso que
  a função devolve o **título junto com as linhas** — tabela que muda de
  recorte sem mudar de título mente sobre o que mostra.
  - A lista é **copiada antes de ordenar**: `a.linhas` é a MESMA que o gráfico
    usa como eixo de calendário, e ordenar no lugar reordenaria o gráfico junto.
  - No empate de percentil o dia mais **recente** vem na frente (a `reverse()`
    antes do sort, que em JS é estável).
  - A ordem inversa não é enfeite: as 5 metas mais baixas do período (900 a
    1.150 cx) foram **todas** batidas. Meta baixa demais faz o verde não
    significar nada, como a meta em p100 faz o vermelho virar paisagem.
- ⚠ **O SVG OCUPA A LARGURA — NUNCA AMPLIA.** `viewBox` fixo com `width:100%`
  dá **zoom**: medido a 1920px em 15/09/2026, o gráfico saía com **510px** de
  altura (contra os **230px** do `.chart-box-lg`, a régua do painel) e a legenda
  de 9px chegava à tela com **21,9px**, maior que o rótulo dos cards ao lado. A
  largura vem do card (`_svgLargura`, piso 640 / teto `SVG_LARG_MAX`=2560) e
  entra por parâmetro nos dois desenhos; o `max-width` no `<svg>` é o que
  impede de esticar de volta. Em tela estreita ele encolhe junto, como antes.
  - ⚠ **O teto era 1.400** até a v7.183.0 — e o cartão de largura inteira a
    1920 tem ~1.878: o gráfico parava em 1.400 com ~430 px vazios à direita
    (PPCP, 28/10/2026, no período da aba ⚖ UEP: *"por que esse gráfico fica
    encolhido à esquerda"*). Vale para os três leitores: PLANO (os dois
    blocos) e aba ⚖ UEP (hora a hora e período). A letra não muda — a escala
    é 1:1; só as barras ficam mais espaçadas.
  - A tarja atrás dos rótulos sai do **texto** (`_svgTarja`), não de um número
    fixo — calibrada no desenho ampliado, na escala 1:1 ela sobrava e tapava
    barra. Ela recebe o corpo da fonte: largura e altura saem dele.
  - ⚠ **A ESCALA É UM MEIO-TERMO MEDIDO, e levou DUAS correções do usuário no
    mesmo dia**: *"ficou tudo muito grande"* (a 2,43×, com a legenda a 21,9px) e
    depois *"agora ficou muito pequeno"* (a 1,00×, com ela a 9px). O corpo mora
    na constante **`FS = 12`** dentro de cada desenho, e a altura ficou em
    **300/320px**. `font-size` solto no SVG não volta — o teste falha.
  - Lição: corrigir um exagero para o extremo oposto é errar duas vezes. Medir
    os dois extremos primeiro e parar no meio custa uma rodada a menos.
- ⚠ **A LINHA DO REALIZADO PRECISA SER LEGÍVEL** (correção do usuário,
  15/09/2026: *"a linha branca não tem como ver as qtdes"*). Só a meta tinha
  ponto e tooltip; o realizado era traço cinza sem marcador, sem número e **sem
  alvo de mouse** — dava para ver que as duas não se acompanham, que é o achado
  da tela, mas não QUANTO a linha fez em nenhum dia.
  - Ponto próprio no realizado + **faixa de toque por dia** cobrindo a coluna
    inteira, com as duas quantidades e o % da meta. Acertar um ponto de 4px com
    o mouse era tarefa.
  - ⚠ A faixa é pintada **antes** das linhas: por cima, comeria o tooltip dos
    pontos da meta.
  - ⚠ **O corte do número impresso tem de casar com o FILTRO.** Estava em 12 e o
    ramo era **morto** — o menor botão da barra é 15 DIAS. Hoje é 15.
- ⚠ **O gráfico é SVG no DOM, não canvas** — por isso `var(--ok)`/`var(--red)`
  funcionam nele. Em `<canvas>` (Chart.js) token não resolve e sai preto; ver a
  nota do `mkChart`.
- ⚠ **`.kpi-grid` sozinho não tem coluna** — precisa do modificador `c3`/`c4`/`c5`,
  senão os cards empilham um por linha.
- **Redundância removida junto:** `PRODUÇÃO REAL`, `META DO DIA`, `% DA META DO
  DIA` e `GAP DA META` eram **quatro cards para uma relação só** — dados o real e
  a meta, o percentual e a diferença são aritmética. O GAP virou o subtítulo do
  card da meta, nos dois grids (ao vivo e dia passado).
  - **A PROJEÇÃO FINAL não julga mais** (v7.46.0 / mobile 1.18.0, 15/09/2026).
    Ela e o selo do `% DA META DO DIA` respondiam a MESMA pergunta por duas
    contas: a projeção mede o turno em **slots** (`real + ritmo × slots
    restantes`, `ritmo = real ÷ nº de slots`) e o selo em **minutos**
    (`efNoRitmo`). Só dariam igual se toda hora tivesse 60 min — o slot
    pós-almoço tem **48**.
    - Medido no turno real (9 slots, **527 min**, meta 1.800) com 4 horas
      lançadas: a projeção cobra **800** e o selo cobra **820**. Produção em
      **810** mostrava `▲ ACIMA DA META` ao lado de `ABAIXO DO RITMO`, os dois
      certos. Acontece em **8 das 9 horas**, com janela de 2 a 20 cx.
    - O número fica (projetar é informação); o veredito é só do selo, que
      rateia por minuto. O card perdeu o `▲/▼` e a cor de status — hoje é
      `acc`, como o RITMO ATUAL.
    - ⚠ A **TV nunca teve o defeito** (sempre imprimiu a projeção como número
      puro) e o teste prende isso para ela não ganhar um.
  - **Ainda em aberto, não mexido:** `MELHOR/PIOR HORA` aparece em três lugares
    (card, análise pico/vale e a tabela hora a hora). Aqui **não há
    contradição** — é repetição, então é preferência, não defeito. O usuário
    decidiu **manter** em 15/09/2026.

## PRÓXIMOS DIAS — a carteira em HORAS (v7.109.0; na aba ⚖ UEP desde a v7.111.0)
- Pedido do PPCP, 25/09/2026 (*"programações futuras como previsão… de
  horas"*), maquete aprovada. Nasceu no fim do GERENCIAL e foi para a **aba ⚖
  UEP como bloco 6** (*"próximo dia vai para aba uep"*): o `renderUep` desenha
  o `#ger-prox` e chama o `renderProxDias`, que só trabalha com a aba aberta
  (`_abaOn('uep')`) — o gerencial não lê mais a programação.
- ⚠ **A cor segue o número EXIBIDO** (`Math.round(exc)`): 105,3 min aparece
  "1h45" e, com a conta crua, saía vermelho contra a legenda "até 1h45".
- **Vai na impressão executiva da UEP** (v7.112.0): `_gpxDoPainel()` é a
  montagem única (tela e `_uepAbaDados().prox`); o papel chama o MESMO
  `_gpxHtml(P, 50)` — o 2º parâmetro é a altura do trilho — com a pele
  `.uep-doc .ud-prox .gpx-*`. Abre a folha 2; ~~o COMO LER virou ANEXO (folha
  3)~~ — o anexo saiu na v7.181.0. No papel a nota da fórmula e a lista SEM UEP
  ficam escondidas (a régua das horas vai no título da seção; a lista sai
  inteira na ORIGEM DA UEP).
- **A carga NÃO é conta nova**: `_gpxMontar` usa o `_cartAberta` em modo UEP
  (só com as linhas que têm UEP) — a MESMA carteira em UEP da aba PLANO. Horas = UEP ÷ (meta de UEP ÷ 527 min). São horas de LINHA: a UEP já
  desconta o mix (somar qtde ÷ ritmo de cada produto dava ~2×).
- ⚠ **O ATRASO E O DE HOJE NÃO ENTRAM NOS PRÓXIMOS DIAS** (v7.156.0, PPCP
  23/10/2026, com o print na mão: *"ATRASO?"* → *"está colocando o de hoje
  como atraso"* → *"nem aconteceu ainda"*). Até a v7.155.0 a dívida
  (`faltaZerar` = atraso vencido + o que falta do programado de hoje) que não
  cabia no resto da jornada de hoje ia para o 1º dia útil como *"inclui atraso
  de 8h26"* — e em 23/10 08:42 as 8h26 eram TODAS do lote de hoje (o vencido,
  3h23, sai primeiro e cabia hoje). O dia nem tinha acabado. Hoje:
  - **cada dia leva só os lotes datados nele** (`_gpxMontar` não soma nada no
    1º dia; o cartão não tem mais "inclui");
  - **cartão HOJE** (`_gpxHojeHtml`, borda tracejada, *previsão*) antes da
    segunda, só na tela: falta zerar (atraso + programado de hoje), cabem no
    resto da jornada no ritmo da meta, e o que não cabe — separado em atraso
    (o que sobra do vencido depois do resto do dia; a linha faz o mais antigo
    primeiro) e lote de hoje — *"não entram nos próximos dias"*. A conta é o
    `conta` do `_gpxMontar`, em minutos inteiros que fecham;
  - **ATRASO — CONFERÊNCIA** (`_gpxAtrasoMontar`/`_gpxAtrasoHtml`, pedido
    *"mostra o atraso separado para conferência"*): só o VENCIDO, código por
    código (o `atraso` da lista; `_gpxDivida` → `linhas`), do `atrasoDesde`
    mais antigo, fechando no mesmo ATRASO do cartão HOJE. Código sem UEP entra
    com as caixas e "sem UEP". O programado de hoje não aparece aqui;
  - papel da UEP e diretoria: só os próximos dias (sem cartão HOJE e sem
    quadro). O ANEXO diz que cada dia leva só os lotes dele.
  - ⚠ A aba PLANO (carteira em UEP) **ainda** põe a dívida nos primeiros dias
    do nivelamento (`_cartAberta(…, dv.uep, …)`) — não mexido.
- **POR SEMANA, sem cartão HOJE** (v7.178.0, PPCP 27/10/2026: *"está
  confundindo muito como não cabe… contar só a semana… semana que vem são 4 dias
  devido ao feriado"*, prévia aprovada; *"sim"* para papel e diretoria). Revoga o
  cartão HOJE da v7.156.0 (o `_gpxHojeHtml` foi apagado; a conta `conta` do
  `_gpxMontar` continua, a PROGRAMAÇÃO × CAPACIDADE lê) e o desenho em fileira
  única (`_gpxHtml` apagado).
  - `_gpxNSemanas(hoje, fer)`: dias úteis até o domingo da semana que vem (sem
    dia útil sobrando nesta, a que vem e a seguinte) — é o `n` do `_gpxMontar`
    na aba (`renderProxDias`), no papel (`_uepAbaDados().prox`) e na diretoria.
    A PROGRAMAÇÃO × CAPACIDADE segue com `CAP_PROG_DIAS`.
  - `_gpxSemanasMontar(P, hoje)` (conta): agrupa por semana (seg–dom), total de
    cada uma pela MESMA régua dos cartões. `_gpxSemanasBlocos(W, pf, aviso)`
    (desenho único, `gpx` aba/papel, `dir` diretoria): cartão na coluna do dia
    da semana (`grid-column` = dow; SÁB só com lote); feriado e dia que passou =
    coluna vazia, feriado no cabeçalho. `_gpxSemanasHtml(P, W)` = blocos + média
    feita + fórmula + sem UEP (aba e papel).
  - Classe do bloco é `gpx-wk` (⚠ `gpx-sem` já é a lista de SEM UEP).
  - **v7.178.1**: o total da semana é o **SALDO** (`Math.round(minPede) −
    minJorn`), nunca falta e folga por dia lado a lado (PPCP: *"pedem 37h52 para
    35h08 faltam 3h27 sobra 0h43"* → *"que rolo"*). A média feita
    (`_gpxCapDem`) vai POR SEMANA (`w.capDem`, linha `gpx-wk-m` abaixo do
    cabeçalho) — só quando difere da meta e nunca na diretoria; o
    `_gpxCapDemHtml` (linha somada das duas semanas) foi apagado.
    - "Difere da meta" é **2% ou mais** (`GPX_CAPDEM_MIN_PCT`,
      `_gpxCapDemMostra`, v7.182.0 — PPCP 28/10/2026: *"esconde a linha"*).
      Com a meta subida para 2.761 e a média em 2.766 ela repetia o *pedem …
      para …* de cima (faltam 3h43 × 3h41). A regra está na conta
      (`_gpxSemanasMontar` põe `capDem` null), não no desenho.
  - **v7.179.0 — a semana inteira** (PPCP: *"sugira algo para não ficar vazio a
    tela"* → prévia → *"essa última"*). `_gpxPassados(hoje, hist, hojeUep,
    metaHoje, fer)` (conta): da segunda até hoje, dia útil — fechado no
    `UEP_HIST` → FEITO (UEP gravada × `uepDiaMeta` do dia, `_qpRealDia`; sem UEP
    → as caixas), sem dia → SEM PRODUÇÃO, feriado da aba, hoje → UEP de jornada
    até agora. **Sem histórico lido (`hist` não é array) não afirma nada** dos
    dias que passaram. `_gpxPassadosDoPainel` é a leitura única (aba, papel,
    diretoria); `_gpxPassadoHtml` o cartão apagado (`gpx-pas`/`dir-pas`). O
    feriado da semana virou cartão apagado também (revoga o "sem cartão do
    feriado" da v7.178.0). Todo cartão leva `grid-row:1` (sem ele o grid
    jogava o passado para uma 2ª fileira). Os totais não mudam.
  - Papel: `.gpx-dx + .gpx-dl` (Lotes) some e o espaçamento aperta — medido em
    PDF: 3 folhas, inclusive com 11 produtos no mix + hora extra (sem isso a
    nota do mix ia para a folha 3). Diretoria: `.dir-wk .dir-dl` some, horas a
    3,1u, sem rodapé (o aviso de sem UEP vai no cabeçalho da 1ª semana) — a
    1920×1080 e 1366×768 nada corta, com e sem o aviso. Mexeu no cartão? Medir
    de novo papel e diretoria.
- **LOTE INTERNO no cartão do dia** (v7.180.0 / `.gs` v5.39, PPCP 28/10/2026:
  *"coloca nos card lote interno"*). Coluna `LOTE INTERNO` da PROGRAMACAO (o lote
  da fábrica, ex. 203/26 — um por dia na planilha). `_lerProgDaAba` acha pelo
  nome com LOTE **e** INTERNO (o "contém LOTE" do `iLote` acha a coluna A
  primeiro e não foi mexido) e o `getProgramacaoDetalhada` manda `loteInt`
  (texto; `_loteIntTxt`: Date vira dd/MM, nunca o Date cru). Só para mostrar:
  FIFO, saldo, arquivamento e meta não leem.
  - Painel: `_cartAberta` e `_cartSemUep` guardam `loteInt` por linha; o
    `_gpxMontar` devolve `lotesInt` por dia (distintos, com as linhas sem UEP,
    ordem numérica). O `_gpxCartaoHtml` põe no CABEÇALHO, à direita
    (`.gpx-li`, float, ANTES do texto do dia) — até 2 e "+N". **Não virar linha
    nova**: o papel da UEP fecha em 3 folhas no limite; medido no Chromium (tela
    1920 e 1366, A4 deitada) o cabeçalho cabe numa linha e o cartão não cresce.
    Diretoria esconde (`#sec-dir .dir-li`), como a linha Lotes.
  - Só dias que vêm: os cartões FEITO/HOJE leem o histórico, e a linha
    concluída sai da PROGRAMACAO. ⚠ **re-deploy manual** do `.gs`.
- **CAPACIDADE DEMONSTRADA como referência** (v7.177.0, PPCP 27/10/2026: *"por
  que 2.530 se no histórico faz mais?"* → *"2761"*). `_gpxCapDem(P, per)` (conta)
  + `_gpxCapDemHtml` (desenho, tinta neutra), montada no `_gpxDoPainel` com o
  `_uepAbaPeriodo(UEP_HIST, _uepPerN())` — a MÉDIA POR DIA do bloco 5, o MESMO
  número do card. Horas = média ÷ (meta ÷ 527) por dia útil (sem fds/feriado;
  dia útil vazio é capacidade). **Os cartões seguem pela meta** (dois vereditos
  na mesma tela é o defeito caro deste projeto). Medido no print de 27/10: meta
  43h55 (faltam 13h05) × média 2.761 = 47h56 (faltam 9h04). A meta 2.530 está
  no ~p21 de 28/09–26/10 (mediana 2.762): subir a meta é decisão do PPCP.
- Regras em constantes: `GPX_DIAS`=5 dias úteis, `GPX_EXC_MAX`=105 min
  (âmbar até aí, vermelho depois — ≈ a madrugada), `GPX_FOLGA_OK`=180 min
  (verde). Fim de semana só entra com lote e fica fora de falta/folga (é todo
  HE). Feriado: a aba `FERIADOS` (v7.174.0, ver *FERIADOS*); fora dela, sai
  SEM LOTE DATADO.
- **Custo:** `GPX_TTL`=15 min para reler a programação (o gerencial atualiza a
  cada 5 e a leitura é das mais caras); falha espera 1 min antes de tentar de
  novo (`GPX_TENT`) — o fim da leitura redesenha, e sem a espera uma falha
  viraria laço de chamadas.
- `_gpxHtml` é desenho (o teste falha se `_cartAberta`/`uepCx` aparecerem nele).
- ⚠ **O "Mais pesado" é o LOTE inteiro** (`_gpxRotLote`, v7.130.0, PPCP
  09/10/2026): uma cor → `produto · cor`; várias → `produto · N cores`;
  produtos distintos → o de mais carga `+ N produto(s)`. Com a cor da maior
  linha, *"OFF WHITE/NATURE 6h34"* lia-se como se a cor sozinha fosse 6h34 (o
  lote 25297 tem 5 cores). O `_cartAberta` guarda `desc`/`cor` por linha só
  para isso (campos ADICIONAIS).
- ⚠ **A UEP é POR CAIXA (por volume)** — conferido com o PPCP em 09/10/2026. A
  planilha de programação do PPCP calculava `jogos × UEP/cx` e contava metade
  da ORION (2 volumes): 3.828 contra os 4.148 do app em 15/10, diferença
  exata de 320 UEP. O app está certo (Σ caixas de cada volume × UEP do volume);
  não "corrigir" o app para bater com a planilha.
- ⚠ **Nunca inventar número** (PPCP, 25/09/2026: *"sempre, jamais inventar
  números"*). Sem UEP na programação a faixa diz que não converte; leitura que
  falhou diz o porquê. **Linha sem UEP no cadastro NÃO entra pela média**
  (*"apontar as linhas que estão sem UEP"*): sai das horas e é listada
  (`semUep`: data, lote, código, caixas); o atraso de código sem UEP idem
  (`_gpxDivida`, que não usa o `_planoDividaUep` porque ele cai na média).
  **Desde a v7.110.0 a aba PLANO segue a MESMA regra** (PPCP: *"faz ajuste"*):
  o `_planoDividaUep` (que caía na média) foi apagado; a carteira em UEP usa
  `_gpxDivida` + `_cartSemUep`, e a lista sai pelo `_cartSemUepHtml` — UM
  desenho para a tela do PLANO, os dois PDFs e a faixa do gerencial. O teste
  falha se `_planoDividaUep` voltar. A **aba ⚖ UEP** (bloco 5) e a impressão
  executiva mostram a mesma lista, mais os **códigos de hoje sem UEP**
  (`_uepAbaSemUepHoje`, pelo cadastro cru `CAP_RAW`; sem cadastro → `null`,
  não acusa). A programação entra por último no `_uepAbaCarregar`, só se a
  leitura tiver mais de 15 min (`GPX_TTL`).

## A CARTEIRA em CX DE LINHA — o mix (v7.55.0)
- **Pedido do PPCP, 16/09/2026**, com a tela em HORIZONTE SOBRECARREGADO:
  *"pelo histórico temos tempo de cada produto, o que dá pra fazer?"*. A régua
  da aba é caixas/dia e caixa não é unidade de tempo: 3.000 cx a 300 cx/h são
  10 h de esteira, 3.000 cx a 150 cx/h são 20 h, e a tela pintava as duas igual.
- ⚠ **NÃO É "CARGA EM HORAS", e o motivo está medido.** O dado que existe é o
  ritmo DEMONSTRADO por produto (cx ÷ horas em que o produto rodou, do log da
  `PRODUCAO_PRODUTO`, o mesmo cx/h do comparativo), e **a esteira roda dois
  produtos por vez**: em 21 dias, 37.085 cx a 107 cx/h dão **347 h de produto
  contra ~185 h de linha**; nos 6 dias inteiros de julho lidos da planilha a
  razão foi de **1,1 a 2,5 por dia** (média 1,38–1,65). Somar `qtde ÷ ritmo`
  inflaria a carga em ~2×. **Hora de produto não é hora de linha.**
- **O que se faz: o ritmo vira PESO RELATIVO** (`_mixRitmos` / `_mixFator`):
  cada lote pesa `qtde × (referência ÷ ritmo do produto)`, referência = Σcx ÷
  Σhoras de produto do MESMO período. Os dois lados da razão foram medidos do
  mesmo jeito, então paralelismo e hora parcial se cancelam em boa parte. O
  resultado continua em **caixas** — **a régua da aba segue UMA** (`_qpCurva`
  com `QP_REGUA`), como manda a nota do `_cartAnalise`; o que muda é o que
  entra na barra. `_cartAnalise` não toca no mix (o teste falha se tocar).
- **A CONFERÊNCIA vai na tela** (`_mixDiag`): nos dias da régua, o realizado
  convertido pelo mix daquele dia oscila menos que cru? (`_qpOscilacao`, a
  mesma conta da oscilação da meta.) Medido em julho: **36% → 13%**. Se não
  cair, a linha do MIX fica âmbar e manda preferir CAIXAS CRUAS. ⚠ É
  **otimista** (os pesos saíram dos mesmos dias) — reprova um mix ruim, não
  prova um exato. A medição de 60 dias **não pôde ser feita fora do painel**
  (a rede da sessão bloqueia o Apps Script e a exportação do Drive corta a
  `PRODUCAO_PRODUTO` em ~310 linhas), por isso ela mora na tela, onde os
  dados existem.
- **Chaves e quedas**: o fator tenta `modelo|cor`, cai em `modelo`, e sem
  histórico é **1 e CONTADO** ("N sem base"). Fator fora de
  `MIX_FATOR_MIN`–`MIX_FATOR_MAX` (0,33–3) é limitado e marcado "aparado": o
  1 cx/h da DECOR 470 daria fator 107. A dívida (`faltaZerar`) continua crua —
  ela não vem por lote.
- **Seletor CARTEIRA** (`QP_MIX`: `mix` padrão · `cru`), na `rpe_qp_pref`. Só o
  bloco de cima lê: o de baixo julga METAS de dias passados, cuja programação
  o arquivamento já levou — converter meta antiga seria inventar.
- **VAZIO NÃO É UMA COISA SÓ, de novo**: `_cartMixHtml` tem três estados —
  cru por escolha · mix aplicado · **mix pedido e NÃO aplicado** (com a causa:
  sem resposta · sem endpoint · erro · sem dados). O terceiro nunca passa em
  silêncio, senão a tela diria cx de linha mostrando caixas cruas.
- ⚠ **90 DIAS NÃO RESPONDE NO COLD START** (medido em produção na 1ª abertura
  da v7.55.0, régua em "todo o histórico": MIX NÃO APLICADO, 3 × 25 s). A
  régua do mix é uma **escada** (`_cartMixEscada`: 60 e, sem resposta, 30) e
  `_cartMixAgendar` desce um degrau **sozinho, uma vez, 30 s depois**, só em
  `sem-resposta` e só com a aba PLANO na tela. O degrau volta a 0 **apenas no
  ATUALIZAR** — voltar no sucesso faria a próxima redesenhada pedir 60 de
  novo. A linha do MIX diz qual régua valeu. Teste prende a escada e a guarda.
- **Custo**: `_cartRitmos` lê `getProducaoModeloPeriodo` para o período da
  régua (`QP_REGUA`, teto `CART_MIX_DIAS_MAX`=60), cache de 5 min
  (`_cartMixCache`), voo compartilhado (`_cartMixVoo`) e reaproveita o
  `_phCache` se a aba PRODUÇÃO/HORA já buscou o mesmo período. ⚠ Essa leitura
  publica `PREP_PERIODO`, que é da OUTRA aba e de outro período: é guardado e
  devolvido no `finally` (teste prende). Sem re-deploy do `.gs`.
- ⚠ **A TARJA DA FAIXA ALVO NÃO PODE COBRIR A BARRA** (18/09/2026:
  *"está cobrindo a linha A CARGA DEVERIA FICAR AQUI"*). `_svgLadoLivre` escolhe
  o lado com menos barras cruzando a linha, mas com as **duas** pontas ocupadas
  devolve a *menos pior* — e ela cobria. Medido: esquerda 1 cruzamento, direita
  2, e a tarja tapou a barra do 21/09 e o número 1.800 dela.
  - O nº de barras cobertas sai da **largura da tarja** (a 1.300px são 2, não as
    3 fixas de antes), e a colisão olha **a barra E o fantasma** do programado —
    com o mix, o topo do dia é o tracejado quando ele passa da carga.
  - Sem lado livre, a tarja **sobe** 18px acima do número da barra (baseline em
    `yTopo−5`, glifo de ~0,7×FS: com os 14px da conta crua saíam encostados) e
    uma **guia pontilhada** a liga à linha — o que ela precisa manter é o
    vínculo, não a altura. Não cabendo acima (bateria na tarja do MELHOR DIA,
    limite `yTeto+20`), fica onde estava: nunca pior que antes.
- ⚠ **A BARRA NÃO É O NÚMERO DA PLANILHA, e a tela tem de dizer isso** (16/09/2026,
  logo depois do deploy: *"a qtde de produto no gráfico não bate com a
  carteira"*). O programado cru vai como **fantasma tracejado** atrás da barra
  (contorno cinza quando é maior que a barra, cor do fundo quando cabe dentro
  dela) com *prog. N* na base, **pintado depois da barra** — antes dela, a
  barra tapava o número. Título e legenda dizem a unidade. Sem mix, nada disso
  existe. O teste prende o fantasma, a ordem de pintura e o título.
- ⚠ **VOCABULÁRIO É DE QUEM LÊ, NÃO DE QUEM CALCULA** (pedido do PPCP,
  16/09/2026: *"precisa ser fácil interpretação, bater o olho e entender"*, e
  logo depois *"aparado?"*). Na tela é **CARGA** (nunca "cx de linha"), o peso
  sai em **palavras** de uma função só (`_cartPesoTxt`: *+22% lento* âmbar,
  *−28% rápido* verde, *normal* sem número dentro de ±5%), o número em cima da
  barra é o **PROGRAMADO** (o que se confere na planilha) e o selo **PESA +N%**
  vai dentro dela. "Fator", "aparado" e "sem base" ficam no tooltip e no corpo
  menor da caixa do mix — quem audita acha, quem passa não tropeça. Os nomes
  internos (`cx de linha`, `aparado`) continuam no código e nesta memória.
- **`_cartMontar(dias, modo)` é a montagem única** (programação + dívida + mix +
  conferência) da tela e do PDF. O relatório ganha a linha **O MIX** em COMO O
  NÚMERO SAI. ⚠ **O modo é lido UMA VEZ, no começo**: a montagem espera até três
  leituras caras, e trocando o seletor no meio o `QP_MIX` mudava debaixo dela —
  a legenda saía *"CARTEIRA EM CAIXAS CRUAS"* embaixo de barras pesadas pelo mix.
- **AS DUAS: os dois gráficos, um sob o outro** (v7.60.0, PPCP, 18/09/2026 —
  *"faz um teste para aparecer as duas opções"* → *"dois gráficos separados"*).
  O terceiro valor do seletor CARTEIRA desenha *carga pelo mix* e *caixas cruas*
  em blocos completos. **É o VEREDITO que muda entre elas**, e é para isso que
  serve: medido no dia, pela carga sobravam 2.302 cx e o E SE de −50% dizia
  **NÃO DARIA**; pelas cruas, 790 e **DARIA**. Escondendo uma, a decisão fica
  refém de qual régua estava selecionada.
  - **`_cartBlocos(dias, curva, agendar)` é o lugar ÚNICO que decide quais
    blocos saem** — a tela e os DOIS PDFs leem daqui, senão papel e tela
    discordariam de qual régua valeu. `_cartBlocosHtml` é o desenho, sem conta.
  - ⚠ **NÃO DOBRA A BUSCA**: a programação vem do cache (2 min, voo
    compartilhado), `_cartRitmos` só lê o log de produto no modo `mix`, e o
    cenário reusa o `_pgContextoDoPeriodo` (5 min, voo). O segundo bloco é conta
    pura sobre o que o primeiro já leu. Em **sequência**, nunca `Promise.all`.
  - **O que é idêntico sai uma vez só, POR CLASSE ESCONDIDA** (`.cart-dois`):
    a nota longa no último bloco, a `.qp-leg` no primeiro (a do cru é
    subconjunto da do mix) e o sufixo `.cl-regua` do título, que repetiria o
    `.cart-tit`. ⚠ As regras são escopadas em **`#sec-plano`**: `#sec-plano
    .qp-leg{display:flex}` (id + classe) vence uma regra escrita só com classes,
    e a legenda continuava saindo nos dois.
  - ⚠ Um segundo desenho para o modo novo seria a história do cabeçalho dos
    cinco relatórios (#204/#205). A marcação é a MESMA; muda só o que a pele
    esconde.
- **E SE AS PARADAS CAÍSSEM X%** (v7.57.0, PPCP, 16/09/2026: *"se a linha
  diminuir as paradas em x%, daria ou não?"*). A régua é o que a linha FEZ, com
  as paradas que teve. `_cartDiasComMenosParadas` devolve a cada dia da régua
  a fração da **perda por parada não programada** (`porDia[data].perd` do
  `RP_PARADAS`, a MESMA conta da aba PARADAS e do SIMULADOR); `_cartCenario`
  refaz a curva e a análise da carteira com a régua nova e devolve
  DARIA/NÃO DARIA. **Nenhuma fórmula de perda nova** — só se multiplica o que o
  RP_PARADAS valorou; o teste falha se `perd` aparecer no desenho. A busca
  (`_cartCenarioAsync`) é o `_pgContextoDoPeriodo` da gestão de perdas, do 1º
  dia da régua até hoje; com `QP_ESE`=0 não busca. Seletor `qp-ese` na barra,
  persistido em `rpe_qp_pref`. ⚠ A perda foi valorada ao ritmo da META do dia
  — o cenário assume que o tempo recuperado produz nesse ritmo.
- Medido com os fatores de julho na carteira real de 16/09: 17/09 tinha
  **3.125 cx de MESA CABECEIRA SLEEP** (205 cx/h) → **~2.000 cx de linha**;
  o lote que mais pesa em cada dia sai na tabela, para escolher O QUE mover.
- ⚠ **RE-DATAÇÃO AUTOMÁTICA NÃO SERÁ FEITA** (decisão do usuário, 16/09/2026:
  *"não vamos fazer isso"*). A proposta lote a lote ("mova o lote X de 21 para
  22") foi explicada e recusada: o painel não sabe prioridade comercial, data
  de corte, peça disponível nem ordem de expedição, e a PROGRAMACAO não tem
  coluna que diga até quando um lote pode andar. O que a aba dá é o suficiente
  para a decisão humana: onde estoura, onde sobra, e a lista de lotes do mais
  pesado ao mais leve. **Não propor de novo.** Se um dia a planilha ganhar
  data de corte por lote, aí é outra conversa.

## A CARTEIRA QUE VEM — o bloco de cima da aba PLANO
- **A aba julgava só o passado.** Diagnosticava a datação e não mudava nada: o
  dia já tinha ido. O bloco de cima (v7.50.0) olha os lotes **já datados para
  dias que ainda não chegaram**, que é onde ainda dá para agir. O de baixo
  continua idêntico, rotulado **COMO TEMOS DATADO**.
- Medido na `PROGRAMACAO` real em 15/09/2026: **16/09 com 3.025 cx e 17/09 com
  3.125**, contra um melhor dia de **2.909** em 79 dias — os dois nasceram
  impossíveis —, e 22, 23 e 24/09 entre 1.228 e 1.350, abaixo do que a linha faz
  em 3 dias de 4. A carteira futura soma **13.278 cx em 7 dias**; com a dívida,
  **15.425**, ou **2.204 cx/dia** (p85). Não é capacidade: é datação.
- ⚠ **UMA RÉGUA SÓ NA ABA.** `_cartAnalise` recebe a curva e a faixa **por
  parâmetro** — as mesmas `_qpCurva(dias, QP_REGUA)` e `QP_FAIXA` do bloco de
  baixo. Uma segunda curva aqui faria a tela aprovar em cima o que reprova
  embaixo, e o gestor não teria como saber qual valia. Por isso `_qpSetRegua` e
  `_qpSetFaixa` redesenham **os dois** blocos; o teste falha se um sair.
- ⚠ **A carteira NÃO soma o campo `falta`.** Ele vem do FIFO **por código**:
  duas linhas do mesmo código devolvem o MESMO número e somá-las contaria o
  saldo duas vezes. Para linha de data futura o backend zera `embalado`/`falta`
  de propósito, então o aberto dela **é a `qtde`**. O teste falha se a palavra
  voltar ao `_cartAberta`.
- ⚠ **A DÍVIDA OCUPA DIA.** Atraso vivo + o que falta da meta de hoje consomem
  capacidade dos primeiros dias antes de qualquer lote novo — por isso entram no
  NIVELADO e na SOBRA. Fora deles o horizonte pareceria mais folgado do que é.
  - A dívida é o `faltaZerar` do `PONTOS_DIA` (o mesmo número da Tela C da TV),
    com queda para `atrasoTotal` em backend antigo. ⚠ A escolha é por
    **`!= null`**, nunca por `||`: **dívida zero é valor legítimo** e o `||` a
    trocaria pelo outro campo.
- **UMA referência só para sair e para caber**: o **topo da faixa alvo**
  (`alvoMax`). Acima dele o dia não comporta (`sai`), abaixo há espaço
  (`cabe`). Duas referências dariam uma conta que não fecha na tela.
- **O veredito separa os dois problemas, que pedem ações OPOSTAS:**
  `CARTEIRA NIVELADA` · `CARGA MAL DISTRIBUÍDA` · `DIA DATADO ACIMA DO MÁXIMO JÁ
  FEITO` (cabe no período → **re-datar resolve, e é de graça**) ·
  `HORIZONTE SOBRECARREGADO` (`sobra > 0` → **re-datar não basta**: dia a mais,
  hora extra ou empurrar para a semana seguinte). Confundir os dois faz pedir
  investimento onde bastava mexer na data, ou o contrário.
- ⚠ **O ATUALIZAR E OS SELETORES NÃO PODEM SER ENGOLIDOS** (18/09/2026:
  *"botão atualizar não está funcionando"*). `renderCarteira` e
  `renderQualidadePlano` tinham guarda de reentrância com `return` seco. Só que a
  montagem encadeia até TRÊS leituras caras (programação, log de produto do mix
  e, com o cenário ligado, as paradas dos dias da régua), cada uma com 3×25 s:
  no cold start passa de dois minutos, e nessa janela **todo toque no ATUALIZAR e
  toda troca de seletor sumiam em silêncio**. Medido: o seletor em CAIXAS CRUAS
  com a tela inteira ainda pesada pelo mix.
  - O pedido que chega durante o voo fica **pendente e roda no fim**
    (`CART_PEND`/`QP_PEND`) — a última escolha do gestor sempre vence — e o bloco
    **esmaece com "atualizando…"** (`_planoUpd`, `#qp-upd`), a mesma régua da aba
    PARADAS e da GESTÃO DE PERDAS. Sem sinal nenhum, esperar um minuto é
    indistinguível de botão quebrado.
- **Custo MENOR que antes, não maior.** `carregarProgramacaoDetalhada` ganhou
  **cache de 2 min** (`PROG_DET_TTL`) e **requisição em voo compartilhada**
  (`PROG_DET_VOO`) — o mesmo remédio do `_phVoo` e do `PG_VOO`. Antes, cada
  entrada na aba PROGRAMAÇÃO refazia a leitura; hoje as duas telas pagam **uma**
  execução no Apps Script. O resto sai do que o painel já tem (curva do
  `buildDiasHistAsync`, dívida do `PONTOS_DIA`). **Sem re-deploy do `.gs`.**
- ⚠ **Lote `foraEsteira` não entra** — não passa na linha.
- ⚠ **VAZIO NÃO É UMA COISA SÓ — e este defeito já custou caro antes.** Na
  v7.50.0 a tela dizia **SEM CARTEIRA DATADA** com a `PROGRAMACAO` cheia (78
  linhas datadas de 16 a 24/09, medido em produção no dia do deploy): a mesma
  frase servia para *"não há lote futuro"* e para *"não consegui ler"*. É o
  MESMO defeito do `PH_FALHA` do comparativo por modelo — *"TIMEOUT não é
  backend velho"*, escrito nesta memória desde 26/08/2026.
  - `getProgramacaoDetalhada` é das leituras mais caras do backend e era a
    **última das pesadas com UMA tentativa**. Hoje são **3 em sequência** com
    espera crescente (em paralelo elas só se enfileiram no Apps Script).
  - `PROG_DET_FALHA` guarda a CAUSA e **`_progDetFalhaInfo()` é o texto único**:
    `sem-resposta` · `sem-endpoint` · `erro` · `sem-url`. O `_cartVazioHtml` lê
    dali, e a falha tem **prioridade** sobre o "não há lote futuro".
  - ⚠ **A frase do re-deploy só sai no `sem-endpoint`** — quando o backend
    respondeu e provou não conhecer a ação. Acusar re-deploy por timeout manda o
    gestor mexer no Apps Script à toa; foi exatamente isso que aconteceu no
    comparativo por modelo.
  - O vazio legítimo diz **quantas linhas leu** e **a data mais distante**
    (`diag` do `_cartAberta`): afirmação que não se pode conferir na tela manda
    abrir a planilha para checar o painel, que é o contrário do que ele serve.
- **O desenho (`_cartHtml`) não faz conta** — tudo vem pronto do `_cartAnalise`,
  e o teste falha se `_qpPercentil`/`_qpValorNoPercentil`/`_qpCurva` aparecerem
  dentro dele.
- ⚠ **Barra alta leva o número DENTRO dela.** Por cima, ele batia na tarja do
  **MELHOR DIA JÁ FEITO**, que mora justamente na altura das barras que
  estouram — as que mais interessa ler. A tarja do teto é **alinhada à
  direita** pelo mesmo motivo.
- **O que o texto impresso na tela não deixa esquecer**, porque os dois erros
  são caros:
  - a faixa alvo é uma **mediana**, não limite físico: dia acima dela é
    improvável, não proibido;
  - **nivelar não é sequenciar** — o nivelamento é a restrição de *capacidade*,
    a ordem continua sendo a *data de corte* do cliente. Encher todo dia com a
    mesma quantidade ignorando a data só troca um problema por outro.

## O relatório da QUALIDADE DO PLANO (🖨 IMPRIMIR na aba PLANO)
- Pedido do usuário em 15/09/2026: *"quero uma impressão para analisar"*.
  `gerarRelatorioPlano()`, v7.54.0. Três seções: a carteira que vem · como
  temos datado · como o número sai.
- ⚠ **A MARCAÇÃO É A MESMA DA TELA.** `_cartHtml` e `_qpHtml` desenham os dois
  blocos no papel também; o que muda é a **pele**, o bloco `_PLANO_SKIN`
  escopado em `.plano-doc`. Copiar o desenho para o papel seria a história do
  cabeçalho dos cinco relatórios (#204/#205). O `<head>` e as ~150 regras saem
  do `_rpDocParadas` — agora **cinco** documentos passam por ele; o
  `relatorios.test.js` conta.
- ⚠ **O SVG É RE-SKINADO POR TOKEN.** Os desenhos usam `var(--ok)`, `var(--bg)`…
  que no painel vêm do tema escuro. No documento do relatório eles não
  existiriam, e **cor inválida em SVG cai no preto**. `.plano-doc{--ok:…;
  --red:…}` redefine os tokens para a paleta do papel e o MESMO desenho sai
  certo. Medido no Chromium: `rgb(198, 40, 40)`. Se um desenho novo usar um
  token que não está nessa lista, ele sai preto no papel — o teste prende a
  lista.
- **As duas famílias de modificador vão juntas no `class=`** dos cards
  (`_kpiCls`: `ok g` · `warn o` · `red r` · `acc a`). O painel lê uma, o
  documento lê a outra — a mesma regra do `_pgMin1000Html`. O teste falha se um
  card dos dois desenhos escapar do `_kpiCls`.
- **A carteira é OPCIONAL no papel.** Falhou a leitura da `PROGRAMACAO`? O
  relatório sai **inteiro, só sem a seção** — a mesma regra da cascata e das
  paradas no relatório semanal. Meio relatório é melhor que relatório nenhum;
  número de carteira inventado é pior que os dois.
- **A largura do desenho no papel é FIXA** (`PLANO_SVG_W` = 660, os ~178mm úteis
  do A4 retrato), nunca `_svgLargura` — papel não tem monitor.
- **O que só existe na tela não vai ao papel**: a dica *"passe o mouse"*
  (classe `qp-leg-mouse`, escondida pela pele) e o botão de tentar de novo.
- **A tarja do rótulo escolhe o LADO LIVRE** (`_svgLadoLivre`): a 660px, sempre
  à esquerda, ela tapava o valor do 3º dia. Fica onde nenhuma barra da ponta
  cruza a altura do rótulo; empatando, à direita, onde o olho já terminou de
  ler. A seta aponta para dentro do gráfico a partir do lado escolhido.
- ⚠ **COR SÓ ONDE HÁ FUNÇÃO, TAMBÉM AQUI** (v7.58.0, PPCP, 16/09/2026:
  *"deixar a impressão mais profissional, está muito carregada"*, aprovado em
  três rodadas de PDF). No papel: barra que cabe é **grafite** e só o dia que
  não cabe é vermelho; card com borda neutra, só o do problema colorido; o
  peso do mix é **texto**, sem pílula. E sai tudo que se repete — selos *PESA*
  nas barras, coluna **ALTURA**, colunas **LINHAS** e **O QUE MAIS PESA**, as
  legendas correspondentes. Tudo por **classe escondida na pele**
  (`.cb-selo`, `.cl-alt`, `.cl-lin`, `.cl-pesa`, `.cl-selo`, `.cl-folga`,
  `.cl-peso`), nunca por um segundo desenho: a marcação continua a da tela,
  onde a cor e a pílula ajudam a varrer a coluna a 60 cm.
- **O PAPEL É NÚMERO, GRÁFICO E TABELA** (PPCP, 16/09/2026, com o PDF na mão:
  *"muito carregada"*, *"tem muita coisa escrita"*). A pele `.plano-doc`
  esconde a nota longa `.qp-nota` dos dois blocos e a explicação da caixa do
  mix (`.qm-como`/`.qm-det`; fica só `.qm-conf`, o veredito); o parágrafo de
  abertura virou a linha de meta do cabeçalho; as notas sob os títulos saíram;
  COMO O NÚMERO SAI tem cinco linhas. **A marcação continua a da tela** — é a
  pele que esconde, como manda a regra do #204/#205.
- **A carteira tem folha própria** (`.pl-quebra`, `page-break-before` na pele) e
  a lista **OS LOTES PROGRAMADOS, DIA A DIA** (`_cartLotesHtml`, desenho puro
  sobre `linhas[].lotes`, que o `_cartAberta` guarda por dia): cabeçalho do dia
  com programado · carga · peso · não cabe, e os lotes do que mais pesa para o
  que menos pesa — a ordem em que se decide o que mover. Só no papel por
  enquanto; a tela tem o lote que mais pesa na tabela.
- **🖨 CARTEIRA é um segundo documento, em PAISAGEM** (PPCP, 16/09/2026:
  *"quero impressão só dos lotes separado do estudo de baixo"* + *"faça teste
  com a impressão virada"*): `gerarRelatorioCarteira` imprime só a seção 1
  (veredito, cards, gráfico a `CART_SVG_W_PAISAGEM`=980, dia a dia e lotes) com
  as **mesmas peças** do estudo — muda a moldura e a orientação. Junto com a
  GESTÃO DE PERDAS, são os dois únicos deitados; aqui a paisagem faz sentido
  porque o gráfico é largo e a lista de lotes é uma linha por lote. O 🖨 do
  estudo completo continua em retrato, rebatizado **🖨 ESTUDO**. Desde a
  v7.199.0 os dois moram no menu 🖨 IMPRIMIR ▾ da aba (CARTEIRA QUE VEM ·
  ESTUDO COMPLETO).
- **A dívida é lida em UM lugar** (`_planoDivida`), pela tela e pelo papel —
  a nota do `!= null` (dívida zero é valor legítimo) mora lá. ⚠ A Tela C da TV
  tem a **própria** leitura do `faltaZerar`, anterior a isto e com outra
  finalidade (o card "falta zerar" da TV); a guarda do teste olha só a aba
  PLANO, de propósito — contar o arquivo inteiro acusava a TV.

## SUB-ABAS DO 📐 PLANO (v7.199.0)
- PPCP, 03/11/2026: *"faz o mesmo aba plano"* (as sub-abas da cronoanálise e
  da UEP). A aba tinha ~2.700 px, os dois blocos empilhados e seis filtros numa
  barra que quebrava em duas linhas a 1366.
- Faixa `#qp-sub` (dois `.ucv-sb`) e dois painéis `.ucv-pn` de MARCAÇÃO FIXA:
  **A CARTEIRA QUE VEM** (`carteira`: barra com CARTEIRA e E SE PARADAS +
  `#qp-carteira`) · **COMO TEMOS DATADO** (`datado`: barra com JULGAR OS ÚLTIMOS,
  ORDEM e a nota dos dois recortes + `#qp-corpo`). `PLANO_SUBS`, `PLANO_SUB`
  (começa na carteira, só na memória da sessão). `_qpSub(k)` só acende painel e
  botão — o `renderCarteira`/`renderQualidadePlano` desenham sempre os dois
  blocos (refazem só o miolo), por isso a entrada anima no `.on`, como na
  cronoanálise (na UEP, que refaz o painel, é o `.entra`).
- **RÉGUA e FAIXA ALVO no cabeçalho** (valem para os dois blocos — a regra do
  *UMA RÉGUA SÓ NA ABA*); cada filtro de um bloco só no painel dele. A nota
  CAPACIDADE = JORNADA NORMAL, SEM HORA EXTRA (`.qp-sb-cap`) fica na ponta da
  faixa. Os títulos `par-sec` dos dois blocos saíram (o botão é o título).
- ⚠ **A largura do gráfico do bloco escondido**: `_qpLarg(alvo)` mede pelo
  painel aceso (os dois têm a mesma largura); com a aba escondida, o de sempre
  (760). Sem isso o `_svgLargura` do bloco escondido cairia nos 760 e o gráfico
  sairia encolhido à esquerda ao trocar — não há redesenho na troca.
- **Números dos botões**: `_qpSubCart(blocos, est)` (a sobra primeiro, os dias
  que não cabem; AS DUAS = os dois números e a cor do pior; `est` `sem-curva` ·
  `falha` — a leitura da PROGRAMACAO — ou em UEP sem base) e
  `_qpSubDatado(a, est)` (`altura pNN · oscila X%`, os dois primeiros cards),
  cor do veredito do bloco (`_cartVeredito`/`_qpVeredito`). Pintados pelo
  `_qpSbPinta` → `_sbPinta` (a mesma pintura da cronoanálise e da UEP) em cada
  saída dos dois renders. Sem a leitura → o estado, nunca 0.
- **Menu 🖨 IMPRIMIR ▾** (`#qp-imp`): CARTEIRA QUE VEM e ESTUDO COMPLETO, cada
  um com `_qpImpFecha();` antes. Os ouvintes de clique fora e Esc já fecham
  qualquer `details.ucv-imp[open]`.
- O **VER NO PLANO →** dos PRÓXIMOS DIAS da ⚖ UEP é `setTab('plano');
  _qpSub('carteira')`.
- CSS: as peças da faixa, do menu e do cabeçalho ganharam `#sec-plano` junto de
  `#sec-crono`/`#sec-uep`; regras próprias `#sec-plano .ucv-pn`, `.qp-pbar`,
  `.qp-lbl`, `.qp-sel`, `.qp-sb-cap`.
- Medido (Chromium, o `.gs` do repositório sobre a cópia da planilha de 03/11):
  CARTEIRA ~1.350 px, DATADO ~1.550; nada passa da largura a 1920, 1366 e 1280;
  os gráficos das duas sub-abas com a largura do cartão; as duas impressões
  abrem pelo menu.
- Testes em `relatorios.test.js` (*SUB-ABAS DO 📐 PLANO*), 14 de 14 mutações.
