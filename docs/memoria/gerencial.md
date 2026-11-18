# Gerencial do PC, do celular e diretoria — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## PRODUTOS EMBALADOS HOJE — gerencial do celular (mobile 1.39.0) e do PC (v7.201.0)
- PPCP, 04/11/2026: *"sugestão para tela gerencial do app celular, colocando os
  produtos embalados do dia"* → *"não alterar nada, me mostre antes"* → duas
  prévias (artifact privado, dados reais do dia) → *"o que dá pra melhorar no
  visual"* → *"implementar a versão 2"*. Quadro `#ger-pdia` entre os KPIs e as
  PARADAS do `view-gerencial`.
- **Conta** `pdiaMontar(phm, ph, cat, atual, agoraMin, o)` no **`rp-core.js`**
  (v7.201.0 / mobile 1.40.0 — era `_pdiaMontar` no celular; com o PC ela virou
  UMA só, com `pdiaVol`/`pdiaBase`/`pdiaCurto`/`PDIA_LARG`; o teste falha se um
  painel voltar a ter cópia) · **desenho** do celular `_pdiaHtml` +
  `_pdiaDetHtml` (sem conta, o teste prende) · **leitura**
  `renderGerProdutosDia(k.real)` no fim do `renderGerencial` · `_pdiaToggle(i)`
  abre um produto por vez (`PDIA_ABERTO`, só na sessão).
- **Nenhuma leitura nova**: `porHoraModelo` (caixas e UEP por hora, produto e
  cor — a régua do `.gs`) e `porHora` (o log na ordem dos bipes, com o código e
  a descrição com o VOL), os dois do `getPontosDia` que o gerencial já lê a cada
  6 min. O `lerPontosDia` passou a guardar o `porHora` e o `lidoEm`.
- O que mostra: resumo (caixas, UEP, produtos, **trocas de produto**), a
  **faixa da sequência** (cada hora repartida pelas caixas de cada produto, a
  hora em andamento só até agora; HE em âmbar, almoço listrado, agora em
  laranja), a **cobertura** (caixas com produto × PRODUÇÃO REAL, e de que horas
  é a lista) e uma linha por produto **na ordem em que rodou** (caixas, UEP,
  cor, horário pelas horas da planilha, HE, barra = parte da UEP do dia). O
  toque abre **por cor e volume** (só com 2+ volumes embalados hoje) e o **hora
  a hora**.
- ⚠ **Sem veredito por produto** (nem verde/vermelho, nem cx/h): o veredito do
  dia é o selo do % DA META, e hora parcial distorce o ritmo de um produto.
- **Trocas**: o produto mudou na sequência. Na mesma hora cada produto conta
  uma vez (A,B,A,B é a esteira com dois lados) e o produto que vinha da hora
  anterior abre a seguinte — a madrugada pode ser lançada horas depois, e a
  ordem dos lançamentos dentro da hora não é a da linha.
- **Código → produto**: com um produto só do modelo no dia, é ele; com vários (o
  501130 tem quatro mesas), pelo nome (`_pdiaBase`: desc sem o VOL e sem a cor
  no fim, do catálogo ou do próprio log). O **AGORA** (`PROD_ATUAL`) só casa
  pelo nome — sem nome, nenhum: o código pode ser de uma mesa irmã que ainda
  não embalou hoje.
- A faixa: os blocos alternam dois tons neutros (`#44658F`/`#2E4A6E`, para
  separar vizinhos) e o nome entra só se couber (`_pdiaCurto`: inteiro, sem as
  medidas, ou a última palavra — BUFFET 4 PT PRISM → PRISM; referência
  `PDIA_LARG`=340 px). O % da barra fica numa coluna fixa (as barras alinham).
- Medido no Chromium com os dados de 04/11: 360, 390 e 430 px, nada passa da
  largura nem corta; em 360 o hora a hora quebra a descrição em duas linhas.
- Sem leitura do dia: *"Lendo a produção do dia…"*; dia sem produto lançado diz
  quantas caixas da HORA_A_HORA ficaram sem produto; falha da conta diz isso
  (nunca "lendo").
- **NO PC (v7.201.0)** — PPCP: *"onde daria para colocar no pc"* → *"ok
  gerencial"* (prévia) → *"ok"*. Card `#ger-pdia` (`.tbl-wrap ger-live-only`)
  logo abaixo do `#kpi-grid` da aba GERENCIAL; `renderGerProdutosDia(k.real)`
  depois dos KPIs do `renderGerencial` (só o dia ao vivo — o modo histórico
  sai antes e o `.ger-live-only` esconde o card; o dia passado não tem o
  `porHoraModelo`). Fora da impressão do dia (`#ger-pdia` na lista do
  `@media print`). Pele `#ger-pdia .pdpc-*`, sem verde nem vermelho (o teste
  prende).
  - Mesma conta, com `larg: PDIA_PC_LARG` (1100 — o nome inteiro cabe no bloco:
    BUFFET 4 PT PRISM) e `passo: 60` (uma marca por hora). O desenho
    (`_pdiaPcHtml`/`_pdiaPcDetHtml`) escreve o "agora" no eixo e tira a hora
    cheia a menos de 25 min dele; tabela de 8 colunas (PRODUTO · COR · HORÁRIO ·
    CAIXAS · UEP · EM HE · PARTE DA UEP DO DIA), `min-width:900` com rolagem
    dentro do card; clique abre um produto por vez (`PDIA_PC_ABERTO`).
  - Antes da 1ª resposta do `getPontosDia` (`PONTOS_DIA_TS` 0 — o `PONTOS_DIA`
    nasce com listas vazias) é o `_pontosEstadoTxt`, nunca "nenhuma caixa". O
    cabeçalho diz a hora da lista. AGORA pelo `PONTOS_DIA.produtoAtual` (+
    `produtoAtualDesc`).
  - **A cor de cada lançamento vem do cadastro** (`_pdiaPcCat`: `CAP_RAW`, senão
    o `rpe_cap_cat` guardado). Sem nenhum, o 1º clique lê o cadastro
    (`_capBuscar`, a leitura do simulador) **uma vez por sessão**
    (`PDIA_PC_CATPED`) e redesenha; falhou, o detalhe sai sem a cor.
  - ⚠ **A barra (parte da UEP do dia) inclui a hora extra**; o MIX DE HOJE da
    aba ⚖ UEP é só da jornada. Num dia com HE os dois % diferem (04/11 às
    09:41: HOME ANGEL 66% aqui × 93% lá — 947 de 1.441 UEP com a HE, 799 de
    855 sem) e os dois estão certos. As dicas do celular e do
    PC dizem *"com hora extra"*.
  - Medido no Chromium com os dados de 04/11 às 09:41: 1280, 1366 e 1920 —
    nada passa da largura, a página não rola de lado, os nomes cabem.
  - **Faixa de 42 px, nome em até 2 linhas, largura REAL** (v7.215.0, PPCP
    com o print de um bloco escrito só *MEL*: *"deixar um pouco mais larga e
    se precisar quebra nome do produto"*). `pdiaCurto(nome, larg, linhas)`:
    com `linhas` > 1 quebra sem partir palavra e, sem espaço para o nome todo,
    tenta o FIM do nome (CAMARIM MEL) antes da última palavra; sem `linhas`, a
    regra de 1 linha de antes (o celular não passa e não muda).
    `renderGerProdutosDia` mede o `#ger-pdia-corpo` (− 32 px do recuo) e só
    sem medida (aba escondida, teste) usa os 1.100 de `PDIA_PC_LARG`; um
    `resize` redesenha (250 ms). `.pdpc-sg` com `white-space:normal`,
    `line-height:1.1`, `padding:0 3px`. Com os dados de 06/11: 1920 →
    PENTEADEIRA CAMARIM MEL (2 linhas, bloco de 99 px); 1366/1280 → CAMARIM
    MEL (69/65 px). HTML novo com `rp-core.js` velho em cache: o 3º argumento é
    ignorado e cai na regra de 1 linha (sem quebrar nada).
  - **AS PARADAS NA FAIXA (v7.236.0 / mobile 1.49.0 / rp-core 1.16.0**, PPCP
    13/11/2026, com o print: *"no timeline colocar as paradas"* → *"sim fazer"*
    no celular). Faixa fina logo abaixo da sequência, no MESMO eixo (PC
    `.pdpc-par` 16 px, celular `.pdia-par` 12 px): não programada `var(--red)`,
    programada (`ehPlanejada` com o mapa de classes) cinza, aberta listrada até
    agora. Linha embaixo do eixo: N paradas · tempo (não programadas) · PARADA
    AGORA · legenda. No PC o `title` da marca diz tipo, horário, duração e
    motivo; no celular a linha é um botão (`_pdiaParVer`) que põe as PARADAS DO
    DIA em *Hoje*, abre o detalhe e rola até lá.
    - **Conta** `pdiaParMontar(lista, F, o)` no **`rp-core.js`** (UMA para os
      dois; o teste falha se um painel tiver cópia): `durProdutiva` +
      `ehPlanejada` do `paradas-calc` (o almoço sai da marca e da soma; parada
      toda no almoço, de zero ou sem horário, fora). Os totais (só ENCERRADAS)
      fecham com o `RP_PARADAS.stats` = o TEMPO TOTAL PARADO das paradas de HOJE
      (o teste confere). Nenhuma perda em caixas aqui. `PDIA_PAR_ROT_PX`=44: a
      duração escrita na marca só a partir dessa largura. **Desenho**
      `_pdiaPcParHtml` / `_pdiaParHtml` (sem conta); `_pdiaPcHtml(M, aberto, P)`
      e `_pdiaHtml(M, aberto, lidoEm, P)` — sem `P` (null), o quadro de antes.
    - **Leitura do PC** `lerParadasDoDia` → `getParadas` (só o dia; lê a aba
      PARADAS inteira, barato só pelo cache de 20 s do `.gs`), 2 tentativas em
      sequência, voo compartilhado, `PDIA_PAR = {dia, ts, lista}`; falhou →
      `PDIA_PAR_FALHA`, mantém a lista de HOJE (*"não atualizou"*, também com a
      lista de mais de dois ciclos — o ciclo é o intervalo de atualização do
      painel, 1–60 min, nunca menos que 5). Só com `_pdiaParPrecisa()`: GERENCIAL ao vivo
      (`!GER_DATA`), fora da diretoria e da TV. No `_cicloLeitura` DEPOIS do
      `renderGerencial` (`_cicloVoo` marca o ciclo no ar e só o dono a
      desmarca — o ↻ com um ciclo no ar não a zera antes), na carga inicial
      depois da leitura do dia, e ao abrir a aba (`_pdiaParSeVelha`: lista com
      mais de 5 min → espera `_pdiaParOcupada` = o ciclo, a aba PARADAS
      `_parBusy` e o `_uepLendo`, reconfere e só então lê).
    - **Leitura do celular**: nenhuma nova — o `PARADAS_HOJE` do `carregarParadas`
      (90 s), que agora marca `PARADAS_HOJE_TS`/`_DIA`/`_FALHA` e redesenha o
      quadro. Só a LEITURA marca falha (`leu`): erro de desenho depois de uma
      leitura boa não vira *"não atualizou"*; e o redesenho na falha
      (`_parFalhouLeitura`) não escapa — o REGISTRAR/START espera o
      `carregarParadas` para soltar o botão. O `renderGerProdutosDia` chama o
      `_pontosDiaDeHoje` (redesenhado a cada 90 s, na virada não mistura os
      produtos de ontem com as paradas de hoje).
    - Parada ABERTA com o relógio do aparelho atrás do INÍCIO gravado pelo
      celular do operador: continua PARADA AGORA (zero, sem marca), nunca some.
    - Todas programadas: sem o *"(0 s não programadas)"*.
    - Estados da faixa (`_pdiaParDoPainel`, um por painel): sem Apps Script →
      sem faixa; sem o `paradas-calc` ou rp-core antigo (sem `pdiaParMontar`) →
      diz; antes da 1ª leitura (ou lista de outro dia) → *lendo*; falhou →
      *paradas não lidas*; zero → *nenhuma parada apontada hoje*.
    - ⚠ **O motivo vai em ATRIBUTO no PC** (`title`, `aria-label`): o `_rpEsc`
      só escapa `&<>`, então o desenho usa `ea` (escapa `"` e `'` também) —
      achado da revisão: `x" onmouseover="…` abria o atributo. O `_escH` do
      celular já escapa aspas. ⚠ O `title`/`aria-label` do NOME do produto no
      `_pdiaPcHtml` ainda usa o `_rpEsc` (pré-existente, não mexido).
    - ⚠ A pele do PRODUTO continua sem verde/vermelho; o vermelho é só das
      regras de paradas (o teste separa as duas peles).
    - Sem produto lançado o quadro sai cedo (sem faixa): com a linha parada
      desde o começo do turno, a PARADA AGORA não aparece aqui.
    - Medido no Chromium: PC 1920 e 1366, celular 360, 390 e 430 — nada passa
      da largura; a linha das paradas quebra em duas a 1366 e no celular.

## GERENCIAL DO PC: A UEP NA FRENTE (v7.243.0 / rp-core 1.17.0; revisão na v7.244.0 / rp-core 1.17.1)
- ⚠ **Desde o rp-core 1.18.0 (v7.247.0) a CONTA mora no `rp-core.js`**
  (`uepGerMontar`, `uepHorasDia`, `uepHoraJulga`, `uepCxComHora`, `uepMinTxt`,
  `uepProj`, `uepDoProduto`, `UEP_HORA_TOL_MIN`) e os nomes do PC delegam
  (`_gerUepModelo`, `_uepAbaHoras`, `_gerHoraJulga`, `_uepAbaProj`,
  `_tvUepDoProduto`…) — o celular 1.50.0 usa a mesma. O `G.m` (minutos, ~~falta em
  caixas~~ — saiu na v7.259.0 / rp-core 1.21.0 —, sai às, produto de agora) não vem mais do `_tvUepMontar`: vem do
  `uepGerMontar` (null sem jornada lançada, como antes). Ver *GERENCIAL DO
  CELULAR: A UEP NA FRENTE*.
- ⚠ **A v7.243.0 entrou na `main` antes de a revisão terminar** (o PPCP pediu o
  merge). A revisão achou 3 bloqueios e 6 ajustes; as correções são a v7.244.0,
  num PR aberto sem merge (combinado: o PPCP confere antes). Ver *A REVISÃO
  (v7.244.0)* no fim desta seção.
- PPCP, 13/11/2026: *"precisamos ir adaptando a tela gerencial para priorizar
  as UEPs"* → *"e também o painel tb… tv"* → três decisões (o 2.761 vira a
  **META oficial**; na TV o selo virá da UEP, dito em minutos e caixas do produto
  de agora; o celular muda junto) → prévias com os números do dia → *"pode
  implantar no gerencial primeiro depois vamos para outro"*. **Fase 1 = só o
  gerencial do PC.** TV, celular, HISTÓRICO, relatórios, semana/Tela D, a EF do
  FECHAR DIA e o nome "referência" (relatório CAIXAS × PONTOS × UEP, 📏 RÉGUAS,
  `UEP_REF_STATUS`) ficam para as próximas.
- **Por quê**: no HISTORICO de 16/10 a 12/11 (19 dias úteis, jornada) caixas e
  UEP discordaram em **12**; o gerencial mostrava os dois selos (% DA META em
  caixas e UEP DO DIA). Ex.: 04/11 caixas 64% × UEP 104%; 06/11 e 11/11 caixas
  ~100% × UEP 84–86%. ⚠ A UEP julga o RITMO da linha contra a capacidade, não a
  ENTREGA do programado — por isso o programado e o ATRASO ficam à vista.
- **1ª linha (`#kpi-grid`, `_gerUepCards`)**: UEP DO DIA · META (hero, `ger-hero`,
  2 colunas, o ÚNICO selo — `slRitmo` do `uepCard`, + *N min atrás/à frente do
  ritmo* pelo `difMin` do `_tvUepMontar`) · ⚠ ATRASO · LOTES VENCIDOS em horas
  (`_gerAtrasoKpi` = o `atrasoVencido` do rp-core, o mesmo do celular; sem cadastro,
  as caixas) · RITMO UEP/H e PROJEÇÃO UEP (`_uepAbaProj`, sem cor) · PARA A META
  (UEP ~~e ≈ caixas do produto de agora~~ — saiu na v7.259.0, as caixas eram
  a falta ÷ a UEP/cx do produto de agora, fora da programação; *sai às* ou
  *não cabe até 17:00*). Ver *A FALTA SÓ EM UEP* em `tv.md`.
- **2ª linha (`#kpi-grid2`, `_gerCxCards`)**: CAIXAS · CAIXAS PROGRAMADAS (a META
  DO DIA em caixas; *80,0% feito* como fato) · RITMO CX/H · PONTOS · PESO — **sem
  cor**. Só sem UEP nenhuma (`semUep`: backend ou cadastro) as caixas programadas
  voltam a julgar: nunca uma tela sem veredito.
- **Saíram do gerencial ao vivo**: % DA META DO DIA, PROJEÇÃO FINAL (cx), HORAS
  PRODUTIVAS, MELHOR/PIOR HORA (cx), *⚠ ATRASO NA PROGRAMAÇÃO* (cx); na tabela
  ACUMULADO, META/H, EFICIÊNCIA, o *(+N)* e o ⚠/▲ da média histórica de caixas
  (era um 2º veredito por hora). O `calcAtrasoHoras` e o `getMediaHoras` seguem
  (a TV usa).
- **Tabela** (`_gerHoraLinha`, a MESMA no dia de hoje e no dia passado; o thead é
  refeito, `_gerTheadUep`/`_gerTheadCx`): HORÁRIO · UEP · META UEP · % DA META
  (cor `sc`) · CAIXAS · **META EM CX** (meta da hora × caixas COM UEP ÷ UEP da
  hora — `uepCxComHora` do rp-core; a hora de agora sem caixa: ÷ UEP/cx do produto de agora)
  · STATUS. Hora extra e hora em andamento (`ATÉ HH:MM`) não são julgadas; hora
  só com código sem UEP = *SEM UEP* (`0*`), nunca ABAIXO. As horas são as do
  `_uepAbaHoras` (a régua da aba ⚖ UEP).
- **Análise** (`_gerAnaliseUep`/`_gerAnaliseUepHtml`): RITMO NECESSÁRIO em UEP/h
  (≈ cx/h do produto de agora), TENDÊNCIA e PICO/VALE pelo **% da meta da hora**
  (em caixas o 12:12 de 48 min era sempre o vale), só horas de jornada fechadas.
  Sem UEP: `_gerAnaliseCxHtml` (a de antes).
- **Gráficos** (`_gerChartsUep`): UEP por hora (cor da tabela, HE âmbar, a hora de
  agora cinza) × meta da hora; caixas por hora numa cor só, sem meta. Títulos
  `#ger-ch1-ttl`/`#ger-ch2-ttl`. Cor literal (canvas).
- **Dia passado** (`renderGerencialHist`, `comUep = dia.uep != null`): UEP gravada
  × META UEP daquele dia no hero (texto `sl`), + FALTOU/META BATIDA, UEP EM HORA
  EXTRA e UEP POR CAIXA; a tabela e os gráficos em UEP com o `uepHora` (cadastro
  ATUAL); a análise `_gerAnaliseUepHistHtml`. Dia sem UEP gravada: o de antes, em
  caixas. Com UEP gravada mas sem `uepHora`: a tabela em caixas SEM cor.
- **PRODUTOS EMBALADOS HOJE do PC**: o resumo abre com a UEP (`pdpc-n big`) e
  *X na jornada + Y em hora extra* (total = `round(M.uep)`, jornada =
  `round(M.uep − M.uepHe)`, HE = a diferença — fecha com as linhas; pode ficar 1
  UEP longe de outra tela); tabela PRODUTO · COR · HORÁRIO · **UEP** (`pdpc-uu`) ·
  **UEP/CX** · CAIXAS · **EM HE · UEP** (as caixas no `title`) · PARTE. rp-core
  1.17.0: `pdiaMontar` dá `uepHe` (produto e total) e `o.porUep` reparte a hora da
  faixa pela UEP (produto sem UEP na hora → a do dia; sem UEP nenhuma → a hora
  inteira volta às caixas). ~~O celular não passa `porUep` e não muda.~~ — passa
  desde a 1.50.0. rp-core antigo em cache: sem a divisão e o EM HE em caixas.
- **Uma leitura a mais, só quando falta**: `_gerCatSeFalta` — sem cadastro neste
  computador (nem o `rpe_cap_cat`), lê o `getProdutos` ~~UMA vez por sessão~~
  (`PDIA_PC_CATPED`, a mesma marca do clique no PRODUTOS EMBALADOS), no fim do
  `_cicloLeitura` e da carga inicial, só com o gerencial ao vivo (desde a
  v7.258.0, também a TV com atraso). Desde a v7.258.1 o cadastro tem **prazo
  de 2 h** (`GER_CAT_TTL`): mais velho que isso — o guardado ou o lido nesta
  sessão — relê, no máximo uma tentativa por prazo em cada sessão. Antes, um
  guardado de qualquer idade valia para sempre (ver *TELA C da TV* em
  `tv.md`).
- Medido no Chromium (Apps Script simulado com os lançamentos reais de 13/11,
  Chart.js local): 1920, 1366 e 1280 — nada passa da largura; o hero tem 2
  colunas e a 2ª linha cabe numa só.
- Testes: `relatorios.test.js` (*A UEP NA FRENTE no gerencial do PC*, com o retrato
  real de 13/11: os cards, um selo só, as horas 09:00/12:12/15:00/HE/agora/sem UEP,
  a análise, o ATRASO, a leitura do cadastro) e `produtos-dia.test.js` (o resumo,
  as colunas, o `uepHe`, a faixa pela UEP e o celular igual).
- **A REVISÃO (v7.244.0)** — o que mudou:
  - **Uma regra para julgar a hora: `_gerHoraJulga(h, cx, cxCom)`** (tabela,
    análise, gráfico, ao vivo e dia passado). Não julga: hora extra, a hora de
    agora, sem lançamento, sem meta, só caixas sem UEP. **Hora fechada em ZERO
    caixas é julgada** (0%, ABAIXO, entra no vale — era "SEM UEP" e sumia: o caso
    de 28/08). **Parte das caixas sem UEP** (código sem UEP, ou lançada sem
    produto: caixas da HORA_A_HORA > caixas do registro) → `parte`: o % com `*`,
    PARTE SEM UEP, sem cor.
  - **O modelo (`_gerUepModelo(k, agoraMin)`)** guarda `cx` e `min` de cada hora
    e o `minRest` (o que resta de jornada) — sem depender do `_tvUepMontar`, que
    não monta antes do 1º lançamento de jornada (era "jornada encerrada" de
    manhã). Às 16:22 de 13/11 restam 37 min → o ritmo necessário é **738 UEP/h**
    (o "463" da v7.243.0 era de um modelo escrito à mão no teste).
  - **`semUep = !G.ok`**: sem a UEP do dia (lendo, falhou, backend, cadastro), as
    caixas programadas julgam; as horas lançadas dizem LENDO… (`G.lendo`) ou NÃO
    LIDA (`PONTOS_LEIT.falha`), e NÃO pintam o % — nem a que fechou em zero
    (`o.est` desliga o `_gerHoraJulga`; o gráfico recebe `!G.ok`). Nunca uma tela
    sem veredito, nunca dois.
  - **A hora que acabou de fechar ainda aceita lançamento** (`GER_TOL_MIN` = 15 =
    o `LANC_TOLERANCIA_MIN` do celular; o teste confere): com 0 caixas e até 15
    min depois do fim, `h.tol` → AINDA ACEITA, sem veredito e fora do vale. Sem
    isso o vale do dia era sempre a última hora fechada (2ª revisão).
  - **Dia passado: `_gerHorasHist(horas, metaDia, uepHH, data)`** — dia útil: a
    meta da hora = META UEP gravada × minutos ÷ 527 (o 16:00-16:59 vale 59); em
    sábado e domingo toda hora é hora extra, sem meta (v7.248.0). A
    célula de UEP diz *pelo cadastro de hoje* (o total do card é o gravado).
    Só horas com produção chegam aqui (o `arquivarHorasDoDia` grava `real > 0`).
  - **`GER_CAT_FALHA`**: a leitura do cadastro que falhou faz o ATRASO dizer
    *cadastro não lido*, nunca "lendo" para sempre.
  - **Impressão** (`_gerInfoImpressao`): o cabeçalho diz a UEP com o selo e as
    caixas como fato; no dia passado, o dia da tela.
  - rp-core 1.17.1: o `uepHe` do produto vem SEM arredondar (o desenho escreve
    *<1* abaixo de 0,5). `renderChartHora`/`renderChartComp` apagados (sem uso).
  - Testes rodam a montagem real (`_gerUepModelo` + `_tvUepMontar`), a hora em
    zero, a parte sem UEP, o sábado de 07/11, a manhã sem jornada, o LENDO…, o
    cadastro que falhou, a impressão, a hora em tolerância e o NÃO LIDA. 14 de 14
    mutações pegas.
  - Em aberto (menor): o resumo do PRODUTOS EMBALADOS pode dizer *586 em hora
    extra* com a coluna somando 587 (arredondamento das três partes).

## GERENCIAL DO CELULAR: A UEP NA FRENTE (mobile 1.50.0 / v7.247.0 / rp-core 1.18.0)
- PPCP, 16/11/2026: *"ajustar app agora, mas antes me mostre como vai ficar"* →
  prévia (artifact privado, o código real do celular rodando no Chromium com o
  retrato de 13/11 16:22 do teste do PC, antes × depois) → *"ok implementar"*. A
  fase 2 do *"pode implantar no gerencial primeiro depois vamos para outro"*.
  Ficaram como propostas: ATRASO em 2º, o cx/h dentro do card CAIXAS, o
  HISTÓRICO do celular em caixas (o mesmo corte do PC). TV, relatórios, semana,
  EF do FECHAR DIA e o nome "referência" seguem para depois.
- **A conta é a do PC, no rp-core** (`uepGerMontar`): o celular só lê
  (`_gerUepModeloM`: os slots da HORA_A_HORA por `_gerSlotsM`, com os minutos
  pelo `slotFim` do backend — 16:00-16:59 = 59 —, o PROD_ATUAL e o cadastro
  `PRODUTOS`, a tolerância `LANC_TOLERANCIA_MIN`) e desenha (`_gerUepCardsM`,
  `_gerCxCardsM`, `_gerHoraLinhaM`, `renderTabelaHoraHora`). O teste confere a
  montagem do celular contra a do PC no mesmo retrato (esperado 2.452, 28 min
  atrás, 37 min, 228 cx, cada hora).
- **1ª grade (`#kpi-grid`, "KPIs DO DIA · UEP")**: UEP DO DIA · META (`larga
  hero`, o ÚNICO selo, `<b>` em cor + `uepMinTxt`, e embaixo feito × esperado,
  HE, cx sem UEP) · ⚠ ATRASO (o card de sempre, 2º) · RITMO · UEP/HORA e
  PROJEÇÃO · UEP (`uk`, sem cor) · PARA A META (`larga uk`: ≈ cx do produto de
  agora; *sai às* / *não cabe até 17:00 … pede X UEP/h nos N min que restam* /
  *jornada encerrada*). No tablet (≥ 700 px, 4 colunas) o PARA A META ocupa 2
  colunas, ao lado do ritmo e da projeção.
- **2ª grade (`#kpi-grid2`, "EM CAIXAS")**: CAIXAS (normal + HE · cx/h) ·
  CAIXAS PROGRAMADAS (% feito · faltam) · PONTOS · PESO, sem cor. Só sem a UEP
  do dia (`!G.ok`) o programado ganha o selo (`slRitmo(k.efRitmo)`).
- **Saíram**: PRODUÇÃO REAL, CAIXAS EM HORA EXTRA, META DO DIA, % DA META DO DIA,
  RITMO ATUAL, PROJEÇÃO FINAL (cx) e NEC. P/ META; na tabela, o *+N* do atraso
  acumulado em caixas (`calcAtrasoHoras`) e o ⚠ de hora fraca — e com ele o
  `getMediaHoras`/`lerMediaHoras`/`MEDIA_HORAS` do celular (uma chamada a menos
  no login).
- **Tabela**: HORA · UEP · META UEP · % DA META (`uepHoraJulga`; cor só com
  veredito; HE `acc` + H. EXTRA; ATÉ HH:MM; AINDA ACEITA; PARTE SEM UEP) ·
  CAIXAS (+ `meta N` embaixo, `.td-n2`). Sem a UEP do dia: LENDO… / NÃO LIDA
  (`PONTOS_DIA_FALHA`) / SEM UEP, sem pintar o %.
- **PRODUTOS EMBALADOS HOJE**: o resumo abre pela UEP (`· N em HE` em âmbar, o
  mesmo arredondamento do card) e as caixas em tinta mais fraca (`.pdia-res-n.sec`);
  cada produto com a UEP em destaque; `porUep: true` (a faixa pela UEP, como o PC).
- **Correção junto**: o `processarResposta` troca o `CFG.turnoInicio` pela C3, e
  o `pdiaMontar` do celular recebia `turnoIni` 05:00 nos dias com C3 = 5 — a
  madrugada não saía em hora extra no quadro (04/11: 0 cx em vez de 244), com o
  card dizendo "+392 em hora extra" acima. Hoje
  `Math.max(toMin(CFG.turnoInicio), LANC_MADRUGADA_FIM)` (07:00, a janela do PC
  e do `.gs`).
- **Os minutos da hora pelo `slotFim`** também no `calcKPIs` do celular
  (`minDoSlot`): a jornada inteira soma 527, como no PC. O esperado da UEP muda
  1 min no fim do dia; o `efRitmo` das caixas (só julga sem a UEP do dia) muda
  ~0,2% o dia todo (o `minTurno` vai de 528 para 527).
- **A REVISÃO (antes do merge, achados corrigidos no mesmo PR)**:
  - **a UEP do dia sai JUNTO com as caixas** no ciclo do gerencial (3 min, era 6):
    no tick só das caixas, a hora recém-lançada saía SEM UEP / PARTE SEM UEP e o
    esperado do card subia sem a UEP dela. Uma leitura a mais a cada 6 min por
    celular gerencial (o operador não muda). E a tela desenha UMA vez, depois
    das duas leituras (`_lerSheetsSegura` / `_gerSegura`: o `lerSheets` do ciclo e
    do ATUALIZAR não desenha o gerencial; quem desenha é o `renderGerencial`
    depois do `lerPontosDia`) — senão, por segundos (75 s no cold start), as
    caixas novas com a UEP anterior;
  - **UEP VELHA** (`G.velha` = `G.ok && PONTOS_DIA_FALHA`: a última leitura do dia
    não veio e a da tela é de antes): **sem selo** no 1º card (*"UEP de HH:MM — a
    última leitura não veio"*, `acc`), o selo vai para as CAIXAS PROGRAMADAS, e a
    hora sem UEP diz NÃO LIDA, sem %. Comparada com os minutos de agora, ela dava
    *ABAIXO · 60 min atrás* sem a linha ter parado (2ª revisão). ⚠ O PC não tem
    o `velho` (lê as duas no mesmo ciclo; com a leitura falhando ele faz o de antes);
  - **sem a HORA_A_HORA lida** (o getDados falhou, a leitura do dia não), os slots
    do `getSlots` (`_gerSlotsM`, hora extra pela janela 07:00–fim do turno) e os
    cards dizem *"a hora a hora ainda não foi lida"* — era "jornada encerrada"
    às 10:00;
  - a leitura do dia que falhou diz *"não veio"* no 1º card (era "aguardando…"
    com a tabela dizendo NÃO LIDA; "não veio" cobre o timeout e o `ok:false`); a
    falha de ontem não passa para hoje (`_pontosDiaDeHoje` zera o
    `PONTOS_DIA_FALHA` junto);
  - **sem a UEP do dia, META UEP "—"** na tabela (celular e PC): era a meta padrão
    do código (288/h) pulando para a da planilha quando a leitura chegava;
  - a linha do produto diz *"178 cx em HE"* (`heTxt` do rp-core): embaixo de
    "2.697 UEP" o "178 em HE" lia como UEP;
  - o `m` do `uepGerMontar` é protegido (try, como o PC era em volta do
    `_tvUepMontar`); rp-core antigo em cache (sem `uepGerMontar`/`uepHorasDia`)
    → as caixas julgam, o card diz para fechar e abrir o app e a tabela sai só
    com as caixas (ATUALIZE) — sem isso ela lançava dentro do `lerSheets`;
  - os minutos que restam em h:mm (*"nos 7h47"*, não *"nos 467 min"*);
  - a tabela HORA A HORA com menos ar nas laterais (`.tbl.hh`): a 360 rolava 3 px
    dentro do cartão, hoje 298/298; a 320 rola 13 px dentro do cartão (era 39 px
    na 1.49.0).
- Medido no Chromium (backend simulado, retrato de 13/11, fontes carregadas):
  360, 390, 430 e 800 px, nada passa da largura da página. Os testes estão no
  `relatorios.test.js` (*A UEP NA FRENTE no gerencial do celular*, com os achados
  da revisão) e no `produtos-dia.test.js` (o resumo, a faixa pela UEP, a HE com a
  C3 em 5); as mutações foram pegas, inclusive as três que a revisão viu passar.

## TELA DA DIRETORIA — `/diretoria` (v7.116.0)
- Pedido do PPCP (25/09/2026): *"uma tela para a sala do diretor"*, com UEP,
  caixas e pontos, pouco texto, link separado. Rota no `vercel.json` para o
  MESMO HTML; o `<head>` põe `html.modo-dir` (também `?dir`) antes da 1ª
  pintura — sem splash, login, cabeçalho, rodapé nem barra de versão.
  `iniciarDiretoria()` liga a `#sec-dir` e o carrossel (`DIR_TEMPO` 20 s).
- **Um veredito só: a UEP.** Caixas e pontos são tinta. Selo da semana:
  META BATIDA (UEP ≥ Σ metas dos dias com UEP) ou ABAIXO DA META.
- **Contas**: `_dirHoje` (lê `_uepAbaDados` — é o 3º leitor dela, o teste conta),
  `_dirSemana` (`_relSemanaPassada` + `uepHistResumo` + `_qpRealDia`),
  `_dirUltimos`, e `_gpxDoPainel` para a carteira. `_dir*Html` são desenho (o
  teste falha se chamarem conta).
- **Pontos**: hoje pelo `porHoraModelo` (jornada × HE pela hora); semana pelo
  `getProducaoModeloPeriodo` (inclui HE — o período não separa por hora sem o
  `cxHora`); carteira pelo `pontos` da programação (`d.pts` no `_cartAberta`,
  campo ADICIONAL; linha sem o campo → `null`, nunca zero). Pontos só veem caixa
  lançada com produto: cobertura < `DIR_COB_MIN` (95%) é escrita na tela.
- **Custo**: histórico 30 min, programação 15 min (`GPX_TTL`), pontos da semana
  6 h com a soma guardada em `localStorage['rpe_dir_pts']` (a recarga de 28 min
  do anti-descanso não refaz a leitura). `PREP_PERIODO` guardado e devolvido.
- Na diretoria `_naTV()` é verdadeiro e versão nova faz `location.reload()`.
- **Aba ⚖ UEP enxuta** na mesma versão: explicação no `title`, não na tela.
- **Pontos da semana sem/com HE** (v7.123.0 / `.gs` v5.20): o
  `getProducaoModeloPeriodo` devolve `pontosHe` por item (soma exata das horas
  `_ehHoraExtraCaixas`). Sem o campo, o card diz "sem HE não separado" — nunca
  rateia. ⚠ O `.gs` pulou o número **v5.19** (versão proibida, ver META PADRÃO).
- **Retrato guardado** (v7.119.0): `_dirGuarda`/`_dirLe`/`_dirRestaura`,
  chaves `rpe_dir_ret_sheets|pontos|hist|prog`. Do dia só no mesmo dia;
  histórico 12 h; programação 2 h. ⚠ O `_dirRestaura` roda num `setTimeout(0)`:
  dentro da inicialização, o `aplicarMetaDiaAutomatica`/`aplicarConfigPainel`
  ainda tocam coisa não declarada e falhavam calados (sem hora do dado).
- **Endereço próprio** (v7.121.0): host que começa com `diretoria` (domínio
  `diretoria-patrimar.vercel.app`, alias do MESMO projeto na Vercel) liga o
  modo-dir em QUALQUER caminho; o mobile redireciona para `/diretoria`. Cada
  deploy vale para os dois endereços. Não é segurança do dado (Apps Script
  público) — separa a tela.
- **App próprio**: `manifest-diretoria.json` (`id`/`start_url` `/diretoria`,
  `display: fullscreen`); o `<head>` troca o `<link rel=manifest>` no modo-dir.
- ⚠ **Na diretoria não rodam `pollParadaTV` nem `lerMediaHoras`** (v7.117.0):
  disputavam a fila do Apps Script com o `getHistory`, que estourava o tempo.
  As leituras da diretoria começam no fim do `lerSheetsComRetry`.
- **Âmbar do "dados de" POR TELA** (v7.126.0, `_dirVelhoMs`): o intervalo da
  própria leitura + 15 min — HOJE 15, SEMANA 45 (`DIR_HIST_TTL`), PRÓXIMOS DIAS
  30 (`GPX_TTL`). Com 15 min fixos a SEMANA ficava âmbar com a leitura em dia.
  A versão em uso (`APP_VER`) fica no canto do rodapé (`.dir-ver`).
- **O cartão do dia dos PRÓXIMOS DIAS é UM desenho** (`_gpxCartaoHtml(d, pf)`,
  v7.117.0): `pf='dir'` na diretoria, `pf='gpx'` na aba e no papel — muda só a
  pele. O trilho de barras saiu dos três.

## DADO VELHO NO GERENCIAL DO PC E A ATUALIZAÇÃO PELA HORA MARCADA (v7.248.3)
- PPCP, 16/11/2026, com os dois prints na mão: *"não bate as ueps"*. A diretoria
  (dados de 13:35) dizia 1.639 UEP e NO RITMO; o gerencial do PC (lista de 13:24,
  ainda na v7.248.1) dizia 1.445 e ATENÇÃO. A conta estava certa nas duas: o hora
  a hora do PC (383 + 323 + 225 + 300 + 214 = 1.445) é o da diretoria sem a hora
  das 13:00 (193 UEP = 186 cx de BANQUETA VERSATIL × 1,04). O PC é que ficou 12
  min sem ler, com a atualização de 5 em 5 min.
- **A causa**: o contador da atualização descia 1 a cada tique de 1 s
  (`countdownSec--`). A janela do gerencial estava atrás da janela da diretoria;
  o Windows e o Chrome tratam janela coberta ou minimizada como escondida e
  seguram os timers (~1 por minuto). Os 5 min viravam horas, sem aviso.
  - Agora a próxima leitura é uma HORA MARCADA (`_proxCiclo`,
    `_marcaProxCiclo`); o `_tickCountdown` só confere se ela passou. Escondida, a
    leitura sai com no máximo ~1 min de atraso; a janela que volta para a frente
    (`visibilitychange`, `focus`) confere na hora e lê se a hora passou.
  - O `forcarRefresh` (↻) e o `alterarIntervalo` remarcam a hora.
- **Dado velho à vista**: `_dadoVelho(ts, agora, intervalo)` — mais de dois
  intervalos, nunca menos de 3 min. `_ultSheetsOk` (o getDados) e o
  `PONTOS_DIA_TS` (o getPontosDia).
  - UEP velha: o card UEP DO DIA mantém o número e troca o selo por *DADOS DE
    HH:MM · sem leitura nova da produção do dia — sem veredito até a próxima*
    (âmbar `acc`); o selo passa para as CAIXAS PROGRAMADAS (`semUep = !G.ok ||
    velhoU`), como no celular.
  - As duas velhas: as CAIXAS PROGRAMADAS também dizem *DADOS DE HH:MM*, sem cor
    — ninguém julga com o dado velho.
  - O selo do cabeçalho: o verde *Google Sheets · hora* vira âmbar *dados de
    HH:MM — sem leitura nova* (`_dadoVelhoPintar`, no tique); o *Buscando…* e o
    erro vermelho ficam como estão. Quando o estado muda, o gerencial ao vivo
    redesenha (sem leitura nova, nada mais o redesenharia).
- A tabela hora a hora e os gráficos seguem pintados com o dado que há: são
  horas passadas, e o 1º card diz de quando ele é.
- ⚠ A TV não ganhou o aviso de dado velho (ela fica na frente, e a tela A/B
  julga em caixas) — pendente se for preciso.
- Testes em `relatorios.test.js` (*PC: a atualização pela hora marcada e o dado
  velho sem veredito*): o `_tickCountdown` real com o relógio na mão (1 tique por
  minuto escondida; 12 min sem tique), o `_dadoVelho`, os dois cards no retrato
  de 16/11 13:36; 4 de 4 mutações pegas.

## O ATRASO TAMBÉM EM PONTOS (v7.249.0 / mobile 1.52.0 / rp-core 1.20.0)
- PPCP, 16/11/2026: *"em pontos qtdes de atraso?"* → prévia com dados de teste
  (card do PC, card do celular e o quadro) → *"aprovado os pontos"*.
- **Onde**: o card ⚠ ATRASO · LOTES VENCIDOS do gerencial do PC (e da diretoria,
  a mesma função `_gerAtrasoKpi`) e do celular, no texto ao lado das caixas
  (*410 cx · 21.321 pts · desde 10/11*); a coluna **PTS** do ATRASO —
  CONFERÊNCIA (⚖ UEP › PRÓXIMOS DIAS), com o total no rodapé e no título. O
  número grande do card continua em horas de linha. A faixa da ⚖ UEP (o cartão
  ATRASO de ~166 px a 1280) e a Tela C da TV ficaram sem pontos (a Tela C, desde a
  v7.258.0, diz as HORAS de linha deste card — ver `tv.md`).
- **A conta é UMA** (`atrasoVencido(lista, uepDe, metaUep, ptsDe)` no rp-core →
  `pts`, `semPts`) e o texto também (`atrasoPtsTxt`, o mesmo nos dois painéis);
  o quadro soma por código no `_gpxAtrasoMontar(linhas, porMin, ptsDe)`, com o
  `_taktPtsMapa(_pdiaPcCat())`, e o teste confere que o total dele = o `pts` do
  card. Nenhuma leitura nova: o cadastro que os dois painéis já leem traz
  `pontos` (`lerCatalogoProdutos`).
- **Por quê pontos e não só UEP**: pontos = CUSTO REP do ERP — o VALOR do que
  está atrasado. O TEMPO para recuperar é a UEP (horas de linha). Não somar nem
  comparar um com o outro.
- **Cadastro de HOJE** (o atraso é carteira, como a programação — ver *PONTOS:
  a tabela é do ERP* em `produto-e-comparativo.md`); o passado congelado do log
  não entra aqui.
- **Sem dado não é zero**: código com pontos vazio ou 0 no cadastro (o catálogo
  lê vazio como 0) fica fora da soma e é dito (*sem os pontos de 1 código*);
  nenhum com pontos → o card não fala de pontos. No quadro, sem os pontos do
  cadastro neste computador a coluna é "—" com um aviso (nunca "sem pontos" em
  todas as linhas).
- **rp-core antigo em cache**: a guarda do `<head>` dos dois HTMLs dá um
  `atrasoPtsTxt` que devolve '' — o card fica como era, não quebra.
- Medido no Chromium: PC 1280/1366/1920 o card não muda de altura (o texto do
  pior caso — sem pontos e sem UEP — vai a 2 linhas dentro dos 96 px da
  fileira); celular 360/390 o pior caso vai a 3 linhas (+26 px), 430 a 2; o caso
  normal fica em 1 linha em todas. Testes: `rp-core.test.js` (*ATRASO EM
  PONTOS*) e `relatorios.test.js` (card do PC, do celular, quadro = card, a
  guarda); 7 de 7 mutações pegas (a 8ª era equivalente).

## FECHAMENTO DA SEMANA PASSADA COM A UEP NA FRENTE (v7.250.0)
- PPCP, 16/11/2026, com o print do bloco do gerencial (9.879 caixas em
  destaque, *13.068 UEP · 94,7%* num canto): *"nessa tbm passar para uep como
  informação principal"*. É a semana entrando na UEP NA FRENTE (v7.243.0, que
  deixou *semana/Tela D* para depois).
- **Só o gerencial** (`pintar('gsem-')`). A Tela D da TV (`tvd-`) continua em
  caixas: a TV ainda julga em caixas nas telas A/B, e duas réguas no mesmo
  carrossel seriam dois vereditos. O 🖨 IMPRIMIR SEMANA (relatório semanal)
  seguiu em caixas até a v7.251.0, quando passou a ONDE PERDEMOS em UEP com a
  mesma montagem (ver `relatorios.md`).
- **A conta é UMA, pura**: `_gsemUepMontar(dias, k)` (a UEP do `uepHistResumo`,
  o selo pela `_relMetaHE` em UEP, a tarja de cada dia, as caixas como fato);
  o desenho é o `_pintarUep` dentro do RP_SEMANA, sem conta (o teste prende).
  null = semana sem UEP gravada → o bloco desenha em caixas, como era, e os
  rótulos voltam (`gsem-unidade`, `-normal-lbl`, `-extra-lbl`, `-uep-lbl`,
  `-uep-fio`).
- **A régua**: o número grande é jornada + hora extra (a do fim de semana
  dentro), como era o das caixas. Selo: verde só com a JORNADA ≥ a soma das
  metas dos dias com UEP; âmbar quando só bateu com a hora extra; vermelho
  *FALTARAM N UEP*. Dia: verde jornada ≥ meta do dia; âmbar jornada + HE ≥
  meta; vermelho abaixo; sábado/domingo âmbar, *todo hora extra*. As caixas
  (total, jornada × meta de caixas, HE) ficam numa coluna de fio neutro, e em
  cada dia na última linha — fato, sem cor.
- ⚠ **A cor dos dias muda de sentido**: na semana 46, o 11/11 era verde em
  caixas (125,3%) e é âmbar em UEP (86,2% na jornada — mix leve, muita caixa
  e pouca UEP); o 10/11 era vermelho em caixas (96,7%) e é verde em UEP
  (103,8%). É o motivo de a UEP julgar: ela desconta o peso de cada caixa.
- **Um % da meta só, o da UEP** (v7.252.0, PPCP: *"dois vereditos está
  confuso"*): o % da meta de CAIXAS ao lado do da UEP lia como um 2º veredito.
  Saiu da coluna CAIXAS e dos dias (ficam as quantidades); no papel, saíram do
  anexo as colunas EFICIÊNCIA e EF. S/ HE e o gap em caixas. A montagem não tem
  mais `cxPct`/`cxMeta`. ⚠ Não devolver o % de caixas onde a UEP julga.
- **Layout**: no gerencial o texto das colunas quebra linha
  (`#ger-semana .tvd-split-txt span{white-space:normal}`) em vez de cortar com
  "…" — o *faltaram 1.434 cx · 287 cx/dia* já saía pela metade a 1366. A
  coluna tem a largura do rótulo (~16 caracteres): o que faltou vai como
  *faltaram 737 UEP (147 UEP/dia)*, número e unidade presos com `\u00a0`.
  Medido no Chromium a 1280, 1366 e 1920: nada cortado, a altura do bloco não
  mudou (429 px). A TV segue com a linha única.
- Testes em `relatorios.test.js` (*fechamento da semana*): a semana 46 do
  print, a TV em caixas com a mesma semana, a semana sem UEP voltando às
  caixas e os rótulos, e o desenho sem conta.


## A ABA HISTÓRICO COM A UEP NA FRENTE (v7.266.0)
- PPCP, 18/11/2026, com o print da aba (período 19/10 a 18/11: 35.744 caixas
  no 1º card, EFICIÊNCIA MÉDIA 94,1% em caixas no 3º, DIAS COM META 10 de 22,
  MELHOR DIA 171,3% em caixas, e a UEP só no 6º card — *UEP / DIA (JORNADA)
  2.623 · meta 2.695 · bateu em 9 de 21*): *"priorizar uep na aba historico"*.
  É a aba entrando na UEP NA FRENTE; a v7.243.0 tinha deixado o HISTÓRICO
  "para as próximas".
- **A conta é UMA, a da semana**: `_histUepMontar(dias)` = `_gsemUepMontar(dias,
  _relSemanalKPIs(dias))` mais o que é de período — `melhorDia` (o maior % da
  META UEP do dia, só dias úteis), `abaixo` (os úteis com `cls !== 'ok'`: o que
  bateu só com HE conta como abaixo, como o `bateu` do `uepHistResumo`), `nFds`,
  `diasUep` (os dias com UEP, para o gráfico), `escalaSelo`/`escalaNota`
  (`_uepEscalaSelo`/`_uepEscalaNota` com o `datasUep` da montagem) e o `k`.
  `null` = nenhum dia com UEP → a aba fica em caixas, como era (os cards de
  antes, a tabela de antes, o gráfico de antes): nunca uma tela sem veredito.
- **As palavras do selo saíram do `_pintarUep` para `_gsemSeloTxt(U)`**, uma
  vez: o bloco da semana e o hero da aba dizem o mesmo (✓ META BATIDA NA
  JORNADA NORMAL · ⚠ META BATIDA COM HORA EXTRA · FALTARAM N UEP PARA A META).
- **Cards** (`_gerKpiHtml`, o desenho do gerencial): 1ª linha `#hist-kpi-grid`
  (`c6 hist-k1`, `_histKpisUep`): o hero UEP NA JORNADA · META N (2 colunas,
  `hist-hero`, cor ok/warn/red pelo `U.selo` — o ÚNICO selo; sub: o selo, o %
  da meta e *faltaram N UEP na jornada (N/dia)*), UEP / DIA (JORNADA), DIAS QUE
  BATERAM (*abaixo: dd/mm, …* até 4 e *+N*), MELHOR DIA, UEP EM HORA EXTRA —
  os quatro sem cor. 2ª linha `#hist-kpi-grid2` (`c9`, `_histKpisCx`): CAIXAS,
  CAIXAS EM HORA EXTRA (vermelho só no aviso de backend sem HE CX — alerta, não
  veredito), CAIXAS PROGRAMADAS (sem o % feito: v7.252.0), CAIXAS / DIA
  (JORNADA) (`k.mediaNormal` × `k.mediaMeta`, a base do semanal).
- **Gráficos** (`.charts-row.hist-charts`): UEP POR DIA · META DO DIA à
  esquerda, pelo `_uepAbaPerSvg(U.diasUep, largura do card, 230)` — o mesmo
  desenho da ⚖ UEP · PERÍODO e do papel; `HIST_CH_W_MIN` (760) quando o card
  mede 0 (aba escondida). À direita, `renderChartHist(dias, periodo, soFato)`:
  as caixas por dia numa cor só, sem meta nem Ef.%. Sem UEP: `so-cx` (uma
  coluna) e o gráfico de sempre, com o título de sempre.
- **Tabela**: o `<thead id="hist-thead">` é montado pelo `_histThead(temUep,
  temMetaComp)` — em UEP: DATA · UEP · META UEP · % DA META · CAIXAS · H. NORMAL ·
  H. EXTRA · META CX · [META DIA · ATRASO META] · MELHOR H. · PIOR H. · STATUS ·
  FECHAMENTO · FONTE; em caixas, a de antes (sem a coluna UEP escondida). As
  células comuns são peças (`cCx`, `cHoras(d, cor)`, `cFim`, `bHe`); as da UEP
  e o selo vêm do `_histCelulasUep(d, U.dias[i])` (o `U.dias` tem a ordem do
  `dias`). Em UEP, MELHOR H./PIOR H. ficam sem cor e a EFICIÊNCIA (caixas) sai.
- ⚠ **A régua do dia é a da semana** (`_gsemUepMontar`: ok jornada ≥ meta; he
  jornada + HE ≥ meta; ruim), **não a de 96%** (`sc`) que a coluna UEP usava
  até a v7.265.0. O 23/10 (2.756 de 2.761, 99,8%) era verde e passa a vermelho
  ABAIXO — e é vermelho também no bloco da semana. Motivo: um dia, uma cor nas
  duas telas de período; e o *bateu* do card já era ≥ meta. **Em aberto**: o
  dia passado do GERENCIAL (`renderGerencialHist`) julga o hero pela `sc`
  (96%); alinhar os três é decisão do PPCP — não mudar um sem o outro.
- Dia sem UEP gravada no meio de um período com UEP: traços nas três colunas,
  STATUS *SEM UEP* (`b-mute`) — nunca 0 (E1) e nunca o veredito das caixas na
  mesma coluna (dois vereditos). O card UEP / DIA diz *N sem UEP*.
- **Fora desta versão**: o 🖨 IMPRIMIR / PDF da aba
  (`_imprimirHistoricoFormatado`) segue em caixas (como o gerencial ficou na
  v7.243.0 até o semanal virar na v7.251.0); a ANÁLISE POR HORÁRIO · MÉDIA
  HISTÓRICA DE CX não muda.
- Testes em `relatorios.test.js` (*aba HISTÓRICO: a UEP na frente*): os dias do
  print (19/10 a 29/10, caixas, meta e UEP de jornada reais; META UEP e UEP HE
  de exemplo) com um sábado e um dia sem UEP — a montagem, o null sem UEP, os
  cards das duas linhas, as células (verde, âmbar, vermelho a 99,8%, sábado,
  sem UEP), o cabeçalho nos quatro modos, o desenho sem conta e as chamadas do
  `renderHist`. `tela-uep.test.js` confere que a nota da escala vem da montagem.
- **Sub-abas PERÍODO · ANÁLISE POR HORÁRIO** (PPCP, 18/11/2026, logo depois, com
  o print da análise embaixo da tabela: *"dividir em sub aba"* / *"analise
  melhora hora"*): a faixa `.ucv-sub` da PROGRAMAÇÃO (os seletores
  compartilhados ganharam o `#sec-historico`; `lote-interno.test.js` e o teste
  do PLANO prendem a lista). `_histSub(k)` só mostra e esconde (`HIST_SUBS`);
  as duas são pintadas pelo `renderHist`, estejam na tela ou não. O botão de
  PERÍODO diz a UEP da jornada e o % da meta (`hist-sb-periodo`, pelo
  `renderHist`; sem UEP, as caixas; sem dia, "sem dia fechado no período"); o da
  análise, a melhor e a pior hora (`hist-sb-horario`, pelo
  `renderAnaliseHorario`). ⚠ O filtro de datas fica dentro do PERÍODO: a análise
  é a `MEDIA_HORAS` do `getMediaHoras`, o histórico inteiro — não é filtrada.
- **A revisão (`/revisor-codigo`, 18/11/2026), 7 ajustes, 0 bloqueios**:
  - `_uepAbaPerSvg(dias, W, H, pbMin, opc)`: `opc.pid` é o id do padrão
    listrado — com a ⚖ UEP e o HISTÓRICO na mesma página o `url(#uepPerLis)` do
    2º desenho resolvia para o pattern do 1º (em `display:none`) e o sábado saía
    só com o contorno (o revisor reproduziu numa página mínima); `opc.cls` =
    {data: ok|he|ruim} pinta a barra com a cor da tabela (o dia que bateu só com
    HE é âmbar; sem `cls`, o desenho de sempre: cinza ≥ meta, vermelho abaixo).
    O HISTÓRICO passa `{ pid:'histPerLis', cls:U.clsPorDia }`.
  - `horasHe` do `_gsemUepMontar` = Σ `heCount` só dos dias com UEP (E4): no
    período misto o card UEP EM HORA EXTRA somava horas de dias sem UEP.
  - O sub do hero com selo vermelho não repete "faltaram" (C4): o selo diz o
    total com a HE; a linha, *só na jornada: N (N/dia)*; sem HE, *N UEP/dia*.
  - Coluna PROGRAMADAS (era "META CX"): um nome por indicador com o card.
  - `_histLinhaHtml(d, x, temMetaComp)` saiu do `renderHist` para o teste montar
    a linha de verdade (I2: as mutações "MELHOR H. com cor em UEP" e "hero com a
    cor invertida" passavam verdes só com as regex).
  - O papel diz *em caixas (a tela julga pela UEP)* no período (`periodoLabel`
    do `_imprimirHistoricoFormatado`) — ver *Fora desta versão*.
  - `HIST_CH_W_MIN` 760 → 600: na aba aberta vale a largura do card; o 760 só
    encolhia o desenho a 1280 (card de 704 px).
- **Medido no Chromium** (Apps Script simulado com os dias do print, 19/10 a
  17/11, 23 dias; Chart.js stub — o cdnjs não passa pelo proxy do ambiente):
  1920 · 1366 · 1280, nada passa da largura (documento = janela; a tabela de 13
  colunas sem rolagem: 1878/1324/1238 px). 1ª linha de cards 125–129 px, 2ª
  81–97 px, gráficos 283 px; o UEP POR DIA a 1920 mostra o número em cada barra
  (1088 px, 23 dias), a 1366/1280 só o rótulo de 2 em 2 dias (como a ⚖ UEP a
  760). O período sem UEP volta aos 5 cards de caixas e às 11 colunas.
- **Ficou de fora / perguntas**: dia ÚTIL fechado com META UEP 0 (feriado
  trabalhado?) — o `uepDiaMeta` dá 0, o `_gsemUepMontar` trata como fim de
  semana (STATUS *HORA EXTRA*, só o `uepHe`) e no gráfico a barra sai com a
  meta 0 (dica com % infinito). É de antes; se o caso existe, pede regra.
