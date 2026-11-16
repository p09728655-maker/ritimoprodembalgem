# TAKT DA SEMANA — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## TAKT DA SEMANA — 6ª sub-aba da ⚖ UEP (v7.209.0; a leitura é do `.gs` v5.59)
- PPCP, 06/11/2026: *"tenho a programação no painel, colocar takt da semana e
  comparar com o takt que está sendo executado"* → *"quero só no painel"* →
  *"sem depender do app"* → prévia (imagem com os números reais da semana) →
  *"me manda gs"*. A tela proposta é a 6ª sub-aba da ⚖ UEP: TAKT (minutos de
  jornada ÷ UEP programada), REFERÊNCIA (527 × 60 ÷ 2.761) e EXECUTADO (minutos
  ÷ UEP feita), em **segundos por UEP**, e a cascata PEDIDO − CARGA ACIMA DA
  REFERÊNCIA − GAP DE RITMO = FEITO NA JORNADA. PPCP: *"sim"* → a tela
  (v7.209.0), abaixo.
- **A TELA (v7.209.0)**: botão `data-sub="takt"` depois da RÉGUAS (`UEP_SUBS`
  + `'takt'`), painel `pn('takt', bT)` no `renderUep`. Quatro blocos, os da
  prévia: os cards TAKT · REFERÊNCIA · EXECUTADO · FALTA DA SEMANA, a frase,
  POR QUE NÃO ACOMPANHOU (a cascata) e AGORA lado a lado (`.uep-2`), e o DIA A
  DIA (programado tracejado × feito, hora extra em cima, linhas da referência
  e do takt/dia). Botão: *pede X% da referência* (âmbar acima de 100%).
  - ⚠ **Desde a v7.232.0 a tela é ENXUTA** (PPCP, 12/11/2026, com a ESTA
    SEMANA na tela: *"muita informação"* → *"faça a análise profunda, tire
    redundância, deixar enxuta, direta sem rodeios"* → prévia → *"ok"*). Medido
    antes: o 105,1% aparecia 4 vezes (botão, cartão do topo, cartão TAKT e a
    frase), a falta 3 (veredito, PARA FECHAR com os MESMOS ≈5h e ≈820 caixas,
    cartão FALTA em UEP), o ritmo de 93,8% 3, o 80/20 2 (recado e frase; a
    cascata é a mesma conta em UEP), o AGORA 2 — em cinco unidades. Ordem nas
    três telas: título → **veredito** → **PARA FECHAR numa linha**
    (`_taktFecharHtml` sem opção; a tela não repete as caixas do veredito, o
    papel continua com elas) → o gráfico (ESTA SEMANA: DIA A DIA com o porquê
    no recado; as outras: ONDE ESTÁ O EXCESSO) → a faixa **NA LINHA E NO APP**
    (`.tks-nl`: os volumes e o takt do app numa linha, com o setup; o AGORA em
    s por caixa com o que a semana pede, o tempo-alvo e a última hora) → o
    TAKT POR PRODUTO recolhido. **Saíram** da ESTA SEMANA os cartões em s por
    UEP, a frase, a cascata, o bloco AGORA e os DETALHES inteiros (o 10,2 × 10,7
    s por UEP ficou no *title* do recado do gráfico); da SEMANA QUE VEM os
    cartões e a frase (nos DETALHES só a SIMULAÇÃO). As contas (`_taktMontar`,
    `cas`, `exec`) não mudaram; o 🖨 TAKT não mudou. Duas unidades na frente:
    horas de linha para decidir, segundos por caixa para a linha e o app.
    O AGORA nunca some calado (`agoraEst`: nenhum produto apontado · sem UEP
    no cadastro), a faixa diz *"digite o mesmo no app"* (o painel não sabe o
    setup do app — afirmar *"o mesmo do app"* foi pego na revisão) e o takt em
    s por UEP mora no *title* do PELO TAKT e do recado. As notas (cx sem UEP,
    fora da esteira…) ficam à vista: mudam a leitura do veredito.
  - **Conta pura** `_taktMontar(S, hist, H)` (S = a leitura, hist =
    `UEP_HIST`, H = o hoje da aba: `num`, `minNorm`, `restMin`, `uep`, `he`,
    `meta`, `fim`), `_taktRestMin`, `_taktAgora`, `_uepSubTakt` · **desenho**
    `_taktHtml`, `_taktSvg` (sem conta; o teste prende).
  - **Leitura** `_taktCarregar(forcar)`: `TKS`, `TKS_TS`, `TKS_VOO`,
    `TKS_FALHA` (`sem-url` · `sem-resposta` · `sem-endpoint` = `.gs` antes da
    v5.59, o ÚNICO caso que manda re-deployar · `erro`), 3 tentativas em
    sequência, cache de 5 min (`TKS_TTL`). É a **última da fila** do
    `_uepAbaCarregar` e entra no `_uepLendo` (a RÉGUAS espera por ela). O
    `renderUep` renova: de outro dia, sempre; velha (5 min, 1 min na falha),
    só com a sub-aba TAKT na tela. Sem o `UEP_HIST` não monta (os dias
    fechados sairiam "sem dado").
  - **O porquê é DIA A DIA**, não a semana somada (a prévia somava: 1.978 de
    carga e 633 de ritmo; a tela dá **1.903 e 707** nos mesmos 03–05/11). No
    dia: falta = pedido − feito; ritmo = máx(0, mín(pedido, META UEP do dia) −
    feito); carga = falta − ritmo; adiantou = máx(0, feito − pedido). Somada,
    a folga de um dia que pediu MENOS que a referência (05/11 pediu 2.727,6)
    virava ritmo, e o 04/11 acima da referência "pagava" o 05/11 — culpava a
    produção por trabalho que não estava programado. Fecha sempre: pedido −
    carga − ritmo + adiantou = feito (o teste prende).
  - **AGORA na MESMA unidade**: takt e referência × UEP/cx do código de agora
    = segundos por caixa; a última hora de jornada FECHADA em s por caixa
    também (só desse produto e cor: as caixas; com outro produto ou cor: o
    ritmo dela em UEP × UEP/cx de agora). ⚠ Na 1ª versão a hora com troca saía
    em s por UEP (14,3) ao lado de 17,1 e 19,8 s por caixa — parecia a mais
    rápida e era a mais lenta. A cor é a do HORA A HORA (`h.cls`).
  - **Dia não útil**: lote em sábado/domingo/feriado entra na UEP programada,
    não nos dias úteis (nota). Produção nele vai para o *+ X fora da jornada*.
  - **SEMANA QUE VEM (v7.210.0**, PPCP: *"quero ver da semana que vem"*):
    escolha `TKS_SEM` (0/1, só na sessão; `_taktSemSet`, `_taktSemBotoes`) no
    título do painel. A MESMA leitura (`_taktLer(qs)`, usada pelas duas) com
    `&de=&ate=` da segunda seguinte (`_taktProxSemana`): `TKP`, `TKP_TS`,
    `TKP_VOO` (no `_uepLendo`), `TKP_FALHA`, `TKP_ERRO`, `_taktProxCarregar`.
    Só lê quando escolhida, pela fila (`_uepDepoisDe(_uepLendo, …)`); renova
    ao virar a semana (`TKP.de` ≠ a segunda seguinte). O botão da sub-aba diz a
    semana escolhida (*semana que vem: pede X%*).
    - **Conta** `_taktProxMontar(T)`: pelo SALDO de cada dia útil
      (`d.saldoUep`; `d.baixaUep` = o que já saiu do lote — num dia que vem,
      adiantado). passa = Σ saldo − dias úteis × META UEP; em minutos
      `Math.round(UEP × 527 ÷ META) − 527 × dias` — **a MESMA conta do
      PRÓXIMOS DIAS** (medido: 2h13 nas duas telas). acima/folga por dia;
      redistribuir absorve mín(acima, folga); lote de fim de semana à parte.
    - **Desenho** `_taktProxHtml` (TAKT · REFERÊNCIA · A SEMANA × A JORNADA ·
      DIAS ACIMA DA REFERÊNCIA, a frase, a SIMULAÇÃO, o DIA A DIA pelo saldo:
      `_taktSvg(T, w, { fut:true })`, âmbar acima da referência, número dentro
      da barra quando encostaria nas linhas).
  - **SIMULAÇÃO (v7.210.0**, PPCP: *"simulação e impressão para diretoria ver
    que não cabe"*): `_taktCenarios(meta, T0, per)` → referência · ritmo desta
    semana (`exec.uep ÷ exec.min × 527`) · média do PERÍODO (`D.P.res.media`,
    o número do botão PERÍODO); `_taktSimular(P, nUteis, cen)` → cabem, falta,
    min (horas de HE NAQUELE ritmo), cx (pelo peso médio do saldo). Medido em
    06/11 (09–13/11, 14.503,5 UEP): 2h13 · 6h59 · 4h06.
  - **🖨 TAKT DA SEMANA** (`gerarRelatorioTakt`, menu 🖨 IMPRIMIR ▾ — uma
    impressão, um lugar): abre no clique, lê o que faltar, monta com as MESMAS
    contas (`_taktHoje` é o hoje da tela e do papel) e desenha
    `_taktDocHtml` + `_TKS_DOC_SKIN`. **Uma folha A4 deitada** (medido no PDF
    do Chromium: com gráficos de 190 e o título longo transbordava para a 2ª;
    `TKS_DOC_SVG_H` = 165). ⚠ A conclusão mostra as DUAS causas (carga e
    ritmo) e a referência como *em avaliação* (`UEP_REF_STATUS`).
  - **DIRETO (v7.211.0**, PPCP: *"deixar nível direto para qualquer um olhar
    e entender se cabe ou não, está muito poluído. A tela também"*): a tela e a
    folha falam **HORAS DE LINHA** (UEP × 527 ÷ META UEP; 1 dia de linha =
    8h47). s por UEP é unidade do PCP — foi para os detalhes.
    - **Conta** `_taktVeredito(T, P, rit)`: esta semana (P null) precisa = o
      saldo, tem = o resto da jornada + os dias úteis que vêm; semana que vem
      precisa/tem/falta = `P.minPede`/`P.minJorn`/`P.saldoMin` (o PRÓXIMOS
      DIAS); `rit` = o ritmo desta semana (o cenário `sem`); `faltaCx` pela
      falta em UEP sem arredondar (`passa`) ÷ UEP/cx do saldo COM UEP — as
      mesmas caixas da simulação.
    - **Desenho** `_taktHeroHtml(V, o)` — UMA marcação para tela e papel: a
      palavra (NÃO CABE · CABE · NÃO FECHA · FECHA · NÃO FECHOU · FECHOU ·
      SEM CARGA), quanto falta, PRECISA × TEM em barras, o ritmo atual, e na
      semana que vem **a soma com o que não fechar desta** (`o.sobra`; o
      PRÓXIMOS DIAS não soma — em 06/11: 2h13 → 13h39). Embaixo, o porquê
      numa linha (`.tks-por`) e o `_taktSvg` **só em horas** (a linha do takt
      saiu: repetia a média do programado). O resto em `_taktDetHtml`
      (`<details>`, `TKS_DET` lembra aberto/fechado no refresh).
    - **🖨** `_taktDocHtml(A={T0,T1,P1,V0,V1})`: a frase do topo, os dois
      vereditos lado a lado com o porquê e o gráfico, uma linha de definição.
      Nada de s por UEP, cascata ou tabela (o teste prende).
  - **NÍVEL DIRETORIA (v7.222.0**, PPCP 11/11/2026, com o print da SEMANA QUE
    VEM: *"preciso de melhorar nível diretoria, bater o olho e entender"* →
    prévia (imagem) → *"implementa"*). Revoga a "soma com o que não fechar
    desta" e o "para fechar" DENTRO do veredito (v7.211.0):
    - **Veredito** `_taktHeroHtml`: a palavra com o que ela quer dizer embaixo,
      UM número (FALTAM/SOBRAM/FICARAM, em horas de linha) e a tradução
      (`_tkDia`, `_tkAprox`, `_tkPts`): ≈ dias de produção, ≈ caixas (dezena até
      999, depois centena), ≈ pontos (mil acima de 10 mil). Barras PRECISA × TEM
      com a falta hachurada (`.tks-tr em`) e a legenda (`.tks-bcap`). O ritmo
      atual só a ≥ `TKS_RITMO_DESVIO`=5% da média (a 98,9% eram 26 min), só em
      horas; `ritmo:true` (AVALIAÇÃO) mostra sempre — o saldo de horas soma com
      ele. Eram três "faltam" e ~13 números no quadro.
    - **PARA FECHAR** `_taktFecharDados` (conta) / `_taktFecharHtml` (cartões;
      `papel:true` = uma linha): hora extra ≈ (`_tkHAprox`, meia em meia hora),
      ADIAR LOTES ≈ caixas com o dia mais carregado (semana que vem) ou PASSAR
      PARA A SEMANA QUE VEM (esta), e SÓ REMANEJAR ENTRE OS DIAS (`P.redist`),
      apagado. Nada quando cabe ou a semana acabou.
    - **E ESTA SEMANA AINDA NÃO FECHA** `_taktHerancaHtml` (só a semana que vem,
      tela): a soma numa barra (programação + o que não fechar desta = FALTAM NO
      TOTAL). ⚠ Nunca "sobra" para o que passa de uma semana (v7.214.2).
    - **ONDE ESTÁ O EXCESSO** `_taktExcessoHtml` + `_taktSvg(…, {fut:true})`:
      barra sólida `var(--tks-base)` até 1 dia de linha, o excesso
      `var(--red)` com o "+h" em cima, "folga" no dia abaixo, o total dentro; no
      título o dia que mais pesa (`_taktPico`: % do excesso em UEP).
    - ⚠ **Classes**: `tks-op` já era o sinal "−" da cascata (com `align-self:
      center` e fonte de 22 px) — os cartões são `tks-fc`/`tks-fn`/`tks-fd`.
      Classe nova no TAKT? Procurar antes se o nome já existe.
    - O título da semana diz "N caixas programadas" (sem UEP). O botão
      PRÓXIMOS DIAS diz "dias que vêm" (só os dias que vêm, sem o atraso).
    - 🖨: o veredito em grade (`.tks-doc .tks-hero` 2 colunas) e o PARA FECHAR
      numa linha. Medido (Chromium, fontes, A4 deitada 1.032 × 718): 688 px,
      uma folha (sem a grade dava 736 e duas folhas). Conteúdo novo no papel:
      medir de novo.
    - Medido na tela (dados de 06/11): 1920, 1366 e 1280, nada passa da largura.
  - **ESTA SEMANA e AVALIAR PROGRAMAÇÃO NO PADRÃO (v7.223.0**, PPCP, com o
    `.gs` v5.60 implantado: *"as telas essa semana e avaliar programação ficou
    fora do padrão"*). Na v7.222.0 só a SEMANA QUE VEM mudou de desenho. A ordem
    das três é a mesma: veredito → PARA FECHAR → o bloco somado → o gráfico →
    detalhes. Nenhuma conta mudou.
    - **ESTA SEMANA**: no `_taktSvg` sem `fut`, o PROGRAMADO do dia é a barra da
      semana que vem (`var(--tks-base)` até 1 dia de linha, `var(--red)` acima,
      "+h" grande em cima, o total dentro); o FEITO ao lado (`--tks-feito`, HE
      âmbar), rótulo em Barlow Condensed; "até agora" num `<tspan>` menor (a
      1366 encostava na barra vizinha). No papel (`opt.h`) a letra desce
      (+h a 15, feito a 12) e o total não vai dentro (barras de ~27 px). O
      porquê é o recado do gráfico (`tks-sec-r`, a frase inteira no `title`);
      era um `.tks-por` entre os cartões e o gráfico. O papel mantém o "Por
      quê" escrito.
    - **AVALIAR**: o período na barra do título; avaliada, a caixa de colar é um
      `<details class="tka-rec">` fechado (`TKA_IN`, só na sessão; o
      `_tkaAvaliar` fecha); o que ficou fora do cadastro vai logo abaixo do
      veredito (`.tka-fora`). O saldo é o **`_tkaChegadaHtml(C, V, per)`**
      (desenho, no `.tks-her` da herança): título E A LINHA CHEGA ATRASADA / A
      LINHA CHEGA EM DIA (`.tks-her.ok`, verde), à direita TERMINA dd/mm COM o
      `C.atraso` (`_tkDia`), o ritmo atual pelo `_tkaRitTxt`. A **barra somada
      só quando fecha** (chegada + falta da colagem = o fim, ±1 min): a folga de
      um dia não vira crédito, então com a colagem cabendo ou chegando em dia a
      soma não é a conta — vai a frase (*"a folga da colagem (1h15) não cobre o
      atraso que chega (14h44)"*). A tabela semana a semana fica nos detalhes
      (`_taktDetHtml(corpo, sum)` aceita o título; `_tkaSaldoHtml(C,
      {semFrase:true})` não repete a frase).
    - Medido no Chromium (dados de 06/11): 1920, 1366 e 1280, nada passa da
      largura; 🖨 TAKT uma folha (688 de 718 px), 🖨 AVALIAÇÃO igual.
  - **NOME E PONTOS (v7.212.0**, PPCP: *"troca por média da linha entregue sem
    hora extra"* e *"valor da UEP em pontos"*): na frente da tela e na folha o
    2.761 é **a média que a linha entrega sem hora extra** (ritmo atual em % da
    média); nos detalhes e na RÉGUAS segue *referência de UEP* (a definição da
    folha liga os nomes). A falta também em **pontos**: `_taktMontar(S, hist, H,
    pts)` soma, no saldo das linhas com UEP E pontos no cadastro
    (`_taktPtsMapa(_pdiaPcCat())`, código só com dígitos), `falta.pts`/
    `falta.uepPts` e por dia `saldoPts`/`saldoUepPts`; `_taktProxMontar` →
    `ptsUep`; `_taktVeredito` → `ptsUep`, `faltaPts` = falta em UEP (sem
    arredondar) × pontos por UEP da semana, e `ritmo.faltaPts`. `_tkPts` =
    "≈ N pontos" à centena. ⚠ **UEP não tem valor fixo em pontos** (06/11:
    PAINEL RIPADO ~46, PENTEADEIRA MEL ~90 pontos por UEP; ~70 no mês) — por
    isso a média é a dos lotes DA SEMANA, e sem cadastro de pontos nada sai.
  - **O PRECISA EM PARTES (v7.242.0**, o mesmo pedido da 2ª linha do card
    ATRASO): na ESTA SEMANA a barra PRECISA vem em segmentos — o que venceu
    (`T.falta.uepVenc`), o de hoje (`saldoUep` do dia) e o dos dias que vêm —,
    com a legenda embaixo (*1h55 de atraso (lotes vencidos) + 6h41 dos lotes de
    hoje*). Conta `_taktPrecisaPartes(T, V)` (pura): os mesmos minutos do
    veredito, arredondando o ACUMULADO (a última parte fecha no `precisaMin` —
    arredondar cada parte sozinha deixava um *"0h01 dos dias que vêm"* que não
    existe), parte de menos de meio MINUTO fora (o corte de meia UEP ainda
    deixava um "0h01" do arredondamento), menos de duas partes → null; a parte
    dos dias que vêm leva `he` quando um deles não tem jornada (sábado, domingo,
    feriado: hora extra, fora do TEM) e a legenda diz *"(com hora extra)"*.
    ⚠ O rótulo é **"vencidos desta semana"**, nunca "atraso": o ATRASO do card
    soma também o vencido de antes da segunda (UM NOME POR INDICADOR). O
    `_taktHeroHtml` só desenha (`o.partes`; sem ele, a barra de antes). Tela
    (`_taktHtml`) e 🖨 (`_taktDocHtml`) passam; a SEMANA QUE VEM e a AVALIAR
    não (não há atraso nelas). Pele `.tks-tr i.p1/p2/p3` (opacidade; o do meio
    sem canto redondo) e `.tks-bpt`; no papel a 3ª parte é contorno (em P&B a
    0,3 sumia). Medido: 🖨 TAKT em uma folha (703 de 718 px, com 2 e com 3
    partes, também com o *"(com hora extra)"* — a legenda do papel começa na
    margem, embaixo do rótulo PRECISA; alinhada com a barra ela quebrava em 2
    linhas e a folha ia a 716); tela 1920 e 1366 sem passar da largura.
  - **O ATRASO E O LOTE DE HOJE NO PRECISA (v7.245.0 / `.gs` v5.66**, PPCP
    16/11/2026 06:54, com o card ATRASO *6h04 · 800 cx · desde 10/11* e o TAKT
    na tela: *"6h04 não contempla o lote de hj?"* → prévia com os dados do dia
    → *"sim faz as duas"*). Duas coisas ficavam fora do PRECISA da ESTA SEMANA,
    e o veredito dizia **FECHA, sobram 3h39** quando era **NÃO FECHA, faltam
    6h07** (≈ 1.300 cx):
    - **o vencido de antes da segunda** (o card ATRASO): o
      `getProgramacaoSemana` da semana de hoje manda o **`vencidoAntes`** (`.gs`
      v5.66): as linhas ABERTAS com data antes do "de", com o SALDO da própria
      linha (`_saldoConfiavel`; arquivada, encerrada e fora da esteira fora). O
      `_taktHoje` leva `antes:_taktAntesDoPainel(hojeN)` =
      `_taktAntesSoma(TKS.vencidoAntes)`; o `_taktMontar` soma em
      `falta.uep`/`cx` (o sem UEP só em `cxSemUep`, linha sem saldo em
      `semSaldo`) e guarda `falta.uepAntes`. `h.antes` undefined (semana que
      vem, AVALIAR) = nada muda; **false** = o `.gs` não manda o campo;
      **null** = a semana de hoje não lida — os dois ficam fora e o
      `_taktAntesAviso` diz por quê (tela e 🖨). ⚠ **Da MESMA leitura, nunca do
      `falta` da programação detalhada**: a 1ª versão fazia `falta` (lida a cada
      15 min) − saldo da semana (a cada 5) e um lançamento entre as duas punha
      no TAKT caixa que já tinha saído (revisão: segunda de manhã o card caía
      para 5h28 e o TAKT seguia 6h04). O AVALIAR (`_tkaPainel`) também prefere o
      `vencidoAntes`; o `_tkaVencidoAntes` ficou só para o `.gs` antigo.
      O card ATRASO recebe o `_taktAntesFora` e só diz *já está no PRECISA* com
      o vencido no TAKT.
    - **o lote de hoje antes do 1º lançamento**: até ele a linha de hoje tem
      PRODUZIDO e SALDO vazios (ontem era futura) e o `getProgramacaoSemana`
      mandava `saldo` null — fora da falta (*"7 linhas sem saldo confiável"*).
      `.gs` v5.66: `saidaVazia` no `_lerProgDaAba` e a linha de HOJE com as duas
      vazias vem com a QTDE. Vencida vazia e SALDO de outra linha seguem null.
    - **A barra PRECISA em até 4 partes**: *vencidos antes de dd/mm* (p1) ·
      *vencidos desta semana* · *dos lotes de hoje* · *dos dias que vêm*; pele
      `i.p4` (opacidade .18 na tela, contorno tracejado no papel). Nome *vencidos*,
      nunca *atraso* (o card ATRASO é a soma das duas primeiras).
    - **O "pede X%" não muda**: é a programação desta semana (a datação), não a
      dívida. O card ATRASO diz *já está no PRECISA do TAKT*.
    - **4 SEMANAS**: a 1ª semana soma o mesmo vencido (`uAnt`, `antesSeg`, linha
      no dia a dia, aviso na frase sem a leitura). Com todo dia útil programado e
      sem lote no fim de semana, a 1ª semana dá o MESMO do veredito (o teste
      confere com o retrato de 16/11: 41h15 · 35h08 · 6h07).
    - ⚠ Antes do re-deploy do v5.66 nada muda no veredito: o vencido fica fora
      (aviso *"até colar o ritmoprod_appscript.gs v5.66"*, card *antes de dd/mm:
      fora do TAKT*) e o lote de hoje continua fora até o 1º lançamento.
  - **O QUE JÁ FOI EMBALADO ANTES, NA BARRA DO DIA (v7.246.0 / `.gs` v5.67**,
    PPCP 16/11/2026, com a barra de 16/11 em 9h06 e o veredito contando 3h46
    do dia: *"sim com a mensagem que embalou antes ai fica completo"*). No DIA
    A DIA da ESTA SEMANA, o pé da barra do programado é LISTRADO
    (`<pattern>` com id único por gráfico, `_taktSvg.n`; `--tks-feito` sobre
    `--tks-base`) até as horas que a linha recebeu de produção feita ANTES da
    data do lote; as horas dentro do trecho só quando cabem na LARGURA da barra
    (no papel encostavam no *até agora* do feito) e embaixo do dia *"embalou
    5h20 antes"* (papel e barra estreita: *"embalou 5h20"*); `title` com caixas
    e UEP; legenda *embalou antes (adiantado)* (`.tks-la`) só com algum trecho
    desenhado (meio minuto de linha, a régua do listrado). A SEMANA QUE VEM não
    marca (o saldo já não tem o adiantado).
    - ⚠ **O papel NÃO tem o item na legenda** (v7.246.1, revisão): ele fazia a
      `.td-leg` quebrar em 2 linhas e o 🖨 TAKT ia a 2 folhas (703 → 725 px
      numa folha de 718, com pontos e ritmo). Cada dia já diz *"embalou Xh"*.
      Medido depois: 669 · 703 · 716 px (quarta com 4 partes), uma folha. Item
      novo na legenda do papel? Medir o pior caso de novo.
    - A nota *"colar o .gs v5.67"* só com programação na semana (`T.progCx>0`).
    - Observado e não mexido: com lote no sábado E no domingo (7 dias), no
      papel os *"embalou Xh"* de dias vizinhos se encostam; o listrado de um
      dia com adiantado acima de 1 dia de linha cobre o vermelho do excesso.
    - Fonte: a coluna **ADIANTADO_CX** da PROGRAMACAO (o write-back grava desde
      o `.gs` v5.23); o `.gs` v5.67 lê no `_lerProgDaAba` (`adiCx`) e o
      `getProgramacaoSemana` manda `adiantadoCx` por linha — só quando o SALDO
      é da linha (`pr.saldo != null`), senão null (nunca 0). O `_taktMontar`
      soma por dia `adiCx`/`adiUep` (mín(adiantado, qtde) × UEP) e devolve
      `adiCampo`; sem o campo, a nota manda colar o v5.67.
    - Só desenho: o PRECISA já não contava o adiantado (o saldo é QTDE − o que
      saiu). Medido em 16/11: 25441, 838 cx = 1.676 UEP = 5h20.
  - **4 SEMANAS (v7.237.0**, PPCP 13/11/2026: *"tem como colocar mais
    semanas?"* → o quadro, recomendado contra mais botões; *"sempre dias
    úteis"*): `TKS_SEM` = 3, botão entre SEMANA QUE VEM e AVALIAR. Esta semana +
    as 3 seguintes, cada uma montada pelo `_taktMontar` (o mesmo das telas), com
    **UMA regra de saldo para as quatro** (`_taktSemanasMontar`, pura — a do
    SALDO DE HORAS do AVALIAR, que o PPCP já validou):
    - precisa = o saldo dos lotes dos **dias úteis**; na esta semana também o que
      já venceu (o saldo dos dias que passaram = a linha *lotes desta semana já
      vencidos*, nunca a diferença de arredondamentos);
    - tem = 527 por **dia útil com lote com UEP** (mesmo já adiantado: a linha
      está livre e abate atraso); hoje, o resto da jornada;
    - **dia útil sem lote** (ou só com caixas sem UEP) fica FORA, precisa e tem,
      e é dito na linha e na frase: o PCP programa ~1,5 semana à frente e a folga
      de um dia ainda não programado apagava atraso (revisão: a semana 4 só com o
      23/11 dizia *"chega a 27/11 em dia"*);
    - **lote em sábado, domingo ou feriado** que vem é hora extra: fora da conta,
      dito (*"14/11 1h03 em hora extra, fora"*), como no PRÓXIMOS DIAS;
    - o atraso passa adiante, máx(0, atraso + precisa − tem); a sobra só abate o
      que existe. No ritmo atual, em horas do relógio (precisa ÷ ritmo).
    - Semana sem nenhuma linha: *sem programação datada*; só com caixas sem UEP:
      *N cx sem UEP no cadastro — sem conta*; parte sem UEP: *a semana é mais
      pesada*. Nenhuma das duas mexe no atraso. Semana não lida → atraso sem
      número daí em diante, a frase *(até onde foi lido)* e o botão *(parcial)*.
    - **Com todo dia útil programado e sem lote no fim de semana, cada semana dá
      o mesmo que a tela dela** (ESTA SEMANA, SEMANA QUE VEM) — o teste confere.
      Fora disso a diferença está escrita na linha.
    - Rótulo e frase pelo DIA ÚTIL (PPCP: *"16-22/11 é domingo"*): a linha diz
      *16/11–19/11 (20/11 feriado · 19/11 sem programação — fora)* e a frase
      fecha no último dia PROGRAMADO (*"chega a 18/11"*), nunca no domingo.
    - Desenho `_taktSemanasHtml` (sem conta), toque abre o dia a dia (`TKS4_AB`).
      ~~Não soma o vencido de antes desta segunda~~ — soma desde a v7.245.0 (a
      1ª semana, linha *vencidos antes de dd/mm (o card ATRASO)* no dia a dia).
    - Revisões: a 1ª versão (o `_tkaCorrente` inteiro) contava o vencido em dobro
      (o `falta` do `getProgramacaoDetalhada` é POR CÓDIGO — e o `_tkaPainel` do
      AVALIAR ainda soma ele por linha: defeito antigo, não mexido); a 2ª (o
      veredito de cada tela) contava dia útil sem lote como folga, lote de sábado
      numa semana e não nas outras, calava as caixas sem UEP e mostrava *"já
      vencidos 0h01"* sem vencido.
    - Leituras: a semana que vem (`TKP`, `_taktProxCarregar`) e a faixa das
      semanas 3–4 (`TK4`, `_taktSemanas4Carregar`, 14 dias pelo `_taktLer`;
      `_taktSemanas4Faixa`, `_taktSemanaDe` parte em duas), uma por vez, com a
      fila livre (`_uepLendo` inclui o `TK4_VOO`). **Depois de uma falha as DUAS
      esperam** (`TKS4_FAL`, falhas seguidas: 1 min; 2+ seguidas, 5 min): sem
      isso uma falhando chamava a outra logo em seguida e o Apps Script ficava
      ocupado 94% do tempo (medido com relógio virtual). Com as duas vencidas,
      lê a tentada há mais tempo (com a semana que vem falhando, a faixa também
      é lida — antes ficava *lendo…* sem leitura). O teste roda o bloco real do `renderUep` com o
      relógio virtual (não regex).
    - Medido no Chromium (retrato de 06/11): 1920 e 1366, nada passa da largura.
    - **A PERGUNTA DA TELA (v7.238.0**, PPCP: *"o intuito dessa tela é saber se
      vamos precisar de horas extras, quando for para trabalhar aos sábados vai
      ter programação com a data de sábado"*): a frase é *"Hora extra até DD/MM:
      Xh já programada (sábados/feriados com lote, `C.heProg`) · Yh ainda a
      programar"* (Y = o atraso no fim). O botão da sub-aba, *"4 semanas: Yh de
      hora extra a programar"*.
    - **SUGESTÃO DE HORA EXTRA (v7.238.0**, *"já colocar a sugestão de trabalho
      extra se for o caso"*): `_taktHeSugestao(semanas, iU)` (pura). Os sábados
      DEPOIS da última semana que fechou em dia (antes dela a folga já pagou o
      atraso), cada um com `min(livre, MENOR atraso daquela semana até o fim −
      o já sugerido)` — ~~livre = 8h47 − o lote que o sábado já tem~~ (6h desde
      a v7.239.0). ⚠ O menor até
      o fim, não o da própria semana (revisão: 10h · 2h · 7h sugeria 7h no 1º
      sábado; a semana com sobra no meio comia 5h). O teste refaz o encadeamento
      com as horas sugeridas em 5 casos e confere: fecha em zero, nenhuma semana
      negativa. Ou o total ÷ os dias úteis com lote, do 1º trecho que termina na
      última semana e respeita o mesmo teto (`desde`), ~~com o aviso acima das 2h
      da madrugada (05–07)~~ (em horário desde a v7.239.0). A frase diz *"na média da linha"*: no ritmo atual as
      horas sugeridas não fecham. Linha `.tks4-sug` abaixo da frase; o sábado sugerido
      também na linha da semana. ~~⚠ Sábado = 8h47 de linha~~ — revogado
      na v7.239.0 (abaixo).
    - **SÁBADO E FERIADO DAS 05:00 ÀS 11:00 (v7.239.0**, PPCP 13/11/2026, com
      a 🖨 na mão: *"ajusta sábado das 05 às 11:00, essa frase deixa dúvida"* →
      *"dia 20/11 tbm pode incluir na sugestão, só feriado santo que não
      pode"*). `HE_SUG = { ini:300, min:360, jIni:420, jFim:1020, noite:1320,
      clt:120 }`. Cada
      semana leva `ext` (era `sab`): os sábados e feriados de dia útil que vêm,
      menos os religiosos, com `livre` = 6h − o lote que o dia já tem e `ini` =
      05:00 + esse lote (o lote ocupa o começo). O sábado ou feriado de HOJE
      não entra. O `_taktHeSugestao` preenche com o mesmo teto (menor atraso
      até o fim), **o sábado antes do feriado da mesma semana** (feriado
      trabalhado custa mais — em geral 100% contra 50%; premissa, não decisão
      do PPCP: inverter é tirar o sort por `fer`), e devolve `ext` (era
      `sab`) com `ini`/`fer`, na ordem da data para a tela. O sábado que é
      feriado civil é `fer` (entra depois do sábado comum; a tela diz
      *"sábado 01/05 (feriado)"*).
      - **Feriado religioso fora** (`_feriadoSanto`, `FERIADO_SANTO_RE`), pela
        DESCRICAO da aba FERIADOS sem acento: santa/santo, sto/sta, são, paixão,
        corpus, páscoa, natal, aparecida, finados, padroeiro, imaculada,
        assunção, nossa senhora, N.S., conceição, bom jesus, cristo, sagrado,
        cinzas, ascensão, pentecostes, reis. Exceção civil com santo no nome
        (`FERIADO_CIVIL_RE`: DATA MAGNA DE SÃO PAULO, Revolução
        Constitucionalista). Feriado religioso com outro nome na aba →
        acrescentar na regra.
      - **E o que não é feriado trabalhável fica fora** (`_feriadoParaHE`,
        `FERIADO_FECHADO_RE`, revisão): a aba também guarda férias coletivas,
        parada de fábrica, recesso, ponte, inventário, balanço, manutenção — e
        a linha sem nome (vira "FERIADO", ou só "FERIADO MUNICIPAL/NACIONAL").
        Na dúvida, fora. ⚠ É lista do que fica fora: nome que não está nela
        passa como trabalhável. Conferido na planilha em 13/11/2026: a aba
        tem 02/11 FINADOS e 20/11 CONSCIÊNCIA NEGRA.
      - **A frase é o dia e o horário**: *"Hora extra sugerida (na média da
        linha): sábado 14/11 das 05:00 às 11:00 · sábado 21/11 das 05:00 às
        07:52"* e, numa 2ª linha, *"Ou 2h13 a mais em cada dia programado de
        16/11 a 25/11 (7 dias): das 05:00 às 07:00 e das 17:00 às 17:13"* — até
        a madrugada inteira (2h), só ela terminando no início do turno;
        passando, o resto depois do fim do turno; ~~passando das 22:00
        (`HE_SUG.noite`), *"não cabe num dia (… dão 7h00)"*; acima de 2h,
        *"(passa das 2h00 por dia da CLT)"*~~ (saíram na v7.240.0).
        A jornada vem do turno do ⚙ (`_heSugJornada`; sem ele, 07:00–17:00).
        "Dia programado" porque o N conta só os dias úteis com lote. Saiu o
        *"≈ … por dia útil (N dias com lote…), mais que as 2h da madrugada
        (05–07)"*, que deixava dúvida. A linha da semana diz *"sugestão:
        sábado 21/11 das 05:00 às 07:52"*. ~~A 2ª linha desta versão~~ — ver
        v7.240.0 e v7.241.0 abaixo.
      - ⚠ Como antes (v7.238.0), o dia sugerido pode cair DEPOIS da última
        data programada (a frase diz "até 18/11" e sugere o sábado 21/11): a
        sugestão é por semana.
      - Testes: o fixture real (07/11 e 14/11 das 05:00 às 11:00, 21/11 até
        07:52; o 20/11 candidato mas o sábado vem antes), o 20/11 como
        Sexta-feira Santa, as listas de religiosos, civis e fábrica fechada, o
        sábado com lote, o de hoje, a jornada do ⚙, dois dias na mesma semana,
        FÉRIAS COLETIVAS no `_taktSemanasMontar` e o sábado-feriado (2ª
        revisão). 🖨 4 SEMANAS: uma folha.
    - ~~**NO MÁXIMO 2H POR DIA ÚTIL, TAXA ÚNICA (v7.240.0)**~~ — PPCP: *"deixa
      no máximo 2 horas dia"*. Cortava o por dia em `HE_SUG.clt` = 2h com UMA
      taxa para todos os dias (`r = mín(total ÷ dias, 2h)`) e um `restoDia`.
      ⚠ **ESTAVA ERRADA** (revisão depois do merge): a taxa única reprovava o
      trecho inteiro quando uma semana tinha menos atraso que 2h × os dias
      dela, e o trecho pulava a semana — 5h · 15h · 25h · 35h dizia *"ainda
      faltam 5h00"*, e fechava; e a 1ª linha (*"e ainda Xh nos dias úteis"*)
      passava de 2h por dia. Substituída pela v7.241.0. Saíram o aviso da CLT
      e o *"não cabe num dia"*; `HE_SUG.noite` ficou só para validar o turno.
    - **SEMANA A SEMANA, OS DOIS TETOS (v7.241.0)**: `_taktHeSugestao` devolve
      `{ total, A, B }`. `aloca(cap, base)` põe em cada semana i
      `mín(cap_i, mín_{j≥i}(atraso_j − base_j) − o já posto)` — nenhuma semana j
      recebe, somado até ela, mais que o atraso dela; é o máximo possível
      (atrasar uma hora nunca abre espaço antes; a revisão comparou com o
      guloso de capacidade somada em 168.793 casos: ótimo em todos).
      Capacidade: sábado/feriado = Σ `livre` (05:00–11:00 menos o lote); dia
      útil = 2h × `nUtFut`. A = sábado primeiro, depois dia útil com o que
      faltar; B = dia útil primeiro, depois sábado. Cada plano: `ext` (dia,
      horário), `dias` ({i, min, n, de, ate, porDia}), `falta` (o que nem os
      dois cobrem; A e B dão a mesma). A semana tem `uFimFut` (o último dia
      útil com lote). Semana até a que fechou em dia: o menor atraso é 0, nada
      vai para ela (substitui o `z`).
      - **O por dia é para CIMA** (`Math.ceil(min ÷ n)`, 2ª revisão): com o
        round, 2 min em 5 dias viravam *"0h00 por dia (das 07:00 às 07:00)"*,
        e o fixture dava 14h51 na 2ª forma contra *"14h52 a programar"*. Com o
        ceil nunca dá 0, nunca passa de 2h (a semana recebe no máximo 2h × os
        dias) e sempre cobre, pagando menos de 1 min a mais por dia.
      - Tela: 1ª linha = A (sábados, depois as faixas de dia útil); *"Ou, mais
        em dia útil:"* = B, só quando difere de A; *"Nem assim fecha: faltam
        Xh"* quando sobra. Faixa = semanas seguidas com o mesmo por dia
        (*"2h00 por dia programado de 16/11 a 04/12 (15 dias, das 05:00 às
        07:00)"*). **"Dia programado", nunca "dia útil"**: o N conta só os dias
        úteis COM lote, e entre as datas pode haver dia útil sem programação. A
        linha da semana diz o sábado e o *"Xh por dia programado"* do plano A.
      - ⚠ Semana sem programação no meio, antes da última com conta, ainda
        oferece o sábado dela (os dias úteis dela, ociosos, ficam fora da
        conta). Já era assim; não mexido.
      - Testes: os casos da revisão (35h fecham; 8h20 · 25h faltam 6h40; 2 min
        em 5 dias = 0h01 por dia), o fixture real nas duas formas, o
        encadeamento fechando em zero sem hora paga à toa, o sorteio de 4.000
        casos (tetos, por dia ≥ 1 e cobrindo a semana com menos de 1 min a
        mais, total + falta, A = B) e o turno do ⚙; 11 de 11 mutações.
    - **🖨 4 SEMANAS (v7.238.0**, PPCP: *"colocar impressão"*):
      `gerarRelatorio4Semanas`, no menu 🖨 IMPRIMIR ▾. A montagem é UMA
      (`_taktSemanasDoPainel`, a tela e o papel) e o desenho o MESMO
      (`_taktSemanasHtml(C, { papel:true })`: sem botão nem toque, todas as
      semanas abertas). Pele `_TKS4_DOC_SKIN` sobre a `_TKS_DOC_SKIN` +
      `_TKA_DOC_SKIN`. A janela abre no clique e lê o que faltar (histórico, esta
      semana, a que vem, a faixa), uma leitura por vez. Medido (Chromium, fontes,
      mídia de impressão a 1.032 px): uma folha A4 deitada, 493 de 718 px.
      Semana sem conta não tem dia a dia (`dias:[]`).
  - **AVALIAR PROGRAMAÇÃO (v7.213.0**, PPCP: *"como fazer para programar
    dentro do padrão?"* → *"a no painel"*): `TKS_SEM` = 2. O PCP cola o bloco
    da semana da PLANILHA DE PRODUÇÃO (Excel, ver abaixo) e vê CABE/NÃO CABE
    antes de aprovar. Nada lido do servidor nem gravado: o cadastro que a aba
    já leu (`_pdiaPcCat()` → `_capProdutos`, a UEP do PRODUTO = soma dos
    volumes, cor mais rápida — a mesma da coluna V da aba UEP da planilha).
    - **Leitura** `_tkaLer(txt, prods, hojeN)` (pura): por linha, a data é a
      ÚLTIMA célula-data (a PREV EMB; os cortes vêm antes) e vale para baixo
      até a próxima (o bloco do lote é mesclado); o produto é a célula que casa
      (`_tkaChave`: sem acento, CONJ/PENT/CANT CAFE por extenso; `_tkaAchar`:
      exato, senão o ÚNICO nome que começa com o outro — 9 de 121 nomes da
      planilha diferem do cadastro, medido em 06/11); a QTDE é a célula à
      ESQUERDA (à direita só com o produto na 1ª célula ou uma data à
      esquerda) — o TOTAL do lote, à direita, nunca entra. Texto que não casa
      → `semCad` (dito em destaque: carga que não entrou). `_tkaNum` ("2.200"
      milhar, "2,5" decimal), `_tkaData` ("9/11" sem ano: de 30 dias atrás em
      diante).
    - **Conta** `_tkaMontar(L, fer, meta, rit)`: monta um getProgramacaoSemana
      (código fictício 9000000NN por produto, para os pontos) e passa por
      `_taktMontar` (o dia de referência é a VÉSPERA do 1º dia colado: tudo é
      plano) → `_taktProxMontar` → `_taktVeredito`. Máx. 31 dias.
    - **Desenho** `_tkaHtml` (a caixa `#tka-txt`, o veredito com
      `unid:'produtos'`, o dia a dia, o que ficou de fora). `TKA_TXT` guarda o
      texto; o `renderUep` não redesenha com o foco na caixa (perderia o
      cursor) e o `_tkaAvaliar` tira o foco antes de desenhar.
    - Medido com a 042-26 colada (F:I e A:I): 16 produtos, 8.000 produtos =
      14.503,5 UEP → NÃO CABE, 2h13 — o mesmo do SEMANA QUE VEM.
    - **SALDO DE HORAS (v7.214.0**, PPCP: *"avaliar as anteriores para ver
      saldo de horas"* → *"cuidado para não duplicar"* → *"essa sem lote ainda
      não está na programação do sheets"*): `_tkaCorrente(painel, itens, o)`
      (pura), de HOJE ao último dia colado, DIA A DIA: demanda = o saldo dos
      lotes do PAINEL (o vencido entra hoje) + as linhas NOVAS da colagem;
      capacidade = o resto de hoje (`restMin`) e 527 por dia útil (sem HE).
      **Sem duplicar**: linha colada com Nº LOTE SIST. (coluna E, 2 à esquerda
      do produto — `_tkaLer` guarda `lote` sem o zero da frente; 025441 = lote
      25441 do painel) que o painel tem → `dup`; sem o número → `dup` se o
      painel tem o mesmo produto (`_tkaChave(_capNome(desc, cor))`) no mesmo
      dia. Dia útil SEM programação (nem painel, nem colagem) → fora
      (capacidade e demanda) e listado em `lacunas` (contar a folga dele
      apagaria atraso). Atraso B = máx(0, B + demanda − capacidade): passa ao
      dia seguinte, a folga não vira crédito (o teste prende); `Br` no ritmo
      atual. Semanas seg–dom: precisa, tem, atraso no fim; `chegada` = o atraso
      antes do 1º dia colado. ⚠ O rótulo da semana (`de`/`ate`) são os dias
      que CONTAM (úteis ou com lote), o 1º marcado *(hoje: o que resta)* e o
      feriado dito (v7.214.1, PPCP: *"06 e 08/11 está considerando fim de
      semana"* — a conta já dava 0 h ao sábado/domingo; o rótulo seg–dom é
      que enganava).
    - ⚠ **NO RITMO ATUAL é em HORAS DO RELÓGIO** (v7.219.0, PPCP com a 🖨 de
      10/11 na mão: *"está dando 25h49 no final"*). Até a v7.218.0 o `Br` era
      `máx(0, Br + dem − cap × ritmo)` — horas de linha NA MÉDIA —, enquanto o
      *"no ritmo atual: faltam 8h45"* do veredito (`_taktVeredito`) é demanda ÷
      ritmo − jornada, horas do relógio. Na mesma folha: chegada 14h52 (média)
      + 8h45 (relógio) não dava os 25h49 do fim. Hoje `Br = máx(0, Br + dem ÷
      ritmo − cap)` (= o de antes ÷ ritmo: 25h49 → ~26h43 na folha de 10/11) e
      a frase diz a chegada E o fim no ritmo atual (`_tkaRitTxt`): chegada +
      o *faltam* do veredito = o fim. O fim no ritmo atual passa do da média
      em ~4 h ali porque o ritmo menor vale para TODOS os dias desde hoje
      (~13 dias × 18 min), não só para o atraso.
    - **O FIM TAMBÉM EM DIAS** (v7.220.0, PPCP: *"coloca em dias tbm… no
      fim"*): `_tkaDias(min)` = min ÷ `UEP_MIN_DIA` com uma casa (*"(≈ 2,5
      dias)"*, "dia" abaixo de 2, vazio sem atraso), só no atraso do FIM — na
      média (frase da tela e da 🖨) e no ritmo atual (`_tkaRitTxt`). A chegada
      e a tabela ficam em horas; a nota da tabela diz *Dias = horas ÷ 8h47*.
    - **A LINHA COLAGEM INTEIRA** (v7.221.0, PPCP: *"como explicar isso, não
      cabe e sobra"*): o veredito é a colagem inteira e a tabela é por semana
      de calendário — com a colagem de 24–30/11, a semana 23–27 falta e o 30/11
      (segunda) sobra 1h39. O `_tkaSaldoHtml(C, { col:{ per, V } })` fecha a
      tabela com *colagem inteira 24/11–30/11 (= o NÃO CABE)* e o PRECISA, TEM
      e falta do `_taktVeredito` da colagem (`M.V`); as semanas com dia da
      colagem (`s.col`) levam `tr.tka-col` (marca laranja à esquerda). Sem
      `o.col` (chamada antiga), a tabela é a de antes. ⚠ Com linha colada já
      no painel (`dup`) ou dia do painel na mesma semana, a soma das semanas
      da colagem não é a falta do total — a linha é o veredito, não um
      subtotal.
    - **TAKT POR CAIXA (v7.217.0)** — PPCP: *"onde fica registrado o takt da
      semana ex: 15seg"* (o do app) → *"no painel onde vai aparecer"* → *"sim,
      mostra takt por caixa"*. Nos DETALHES PARA O PCP da ESTA SEMANA e da
      SEMANA QUE VEM, depois da leitura: uma linha por produto · volume
      programado (`T.prods`, montado no `_taktMontar` junto com o dia: fora da
      esteira e fora da janela de fora; sem `desc`, pelo código). Conta
      `_taktPorCaixa(T)`: UEP/cx = Σ(caixas × UEP) ÷ caixas com UEP (avisa se
      as cores diferem), PELO TAKT = `T.takt` × UEP/cx (+ cx/h), NA MÉDIA DA
      LINHA = `T.ref` × UEP/cx; ordem 1º dia → caixas → nome. Desenho
      `_taktPorCaixaHtml` (sem conta). ⚠ O takt do app (crono-analise) é OUTRA
      conta: (44 h − setup do cadastro do grupo, 8 × 8 min/dia) ÷ VOLUMES da
      semana (digitados à mão no app desde 06/11; a leitura automática da
      planilha precisa do `GOOGLE_CONTA_SERVICO` no projeto do app) — todo
      volume igual, então produto pesado sempre parece acima dele. Medido em
      06/11: semana 09–13/11 = 10,9 s/UEP; DIAMANTE (2,48) 27,0 s/cx pelo takt
      × 26,9 s no período da medição (em cima); 21 produtos na tabela.
      ⚠ **Desde a v7.224.0 a tabela NÃO mora mais nos detalhes** — ver o item
      abaixo (a FAIXA DO TAKT).
    - ⚠ **Desde a v7.232.0 a faixa é compacta e fica DEPOIS do gráfico**
      (NA LINHA E NO APP, ver *A TELA* acima): o veredito vem primeiro.
    - **A FAIXA DO TAKT (v7.224.0)** — PPCP, 11/11/2026: *"onde fica o takt
      que temos que seguir? e a quantidade de volumes"* → *"não consigo
      localizar com facilidade"* → *"preciso saber o takt da semana para
      colocar no app de cronoanálise"*. O takt só existia nos DETALHES
      recolhidos (v7.211.0) e, na AVALIAR, em lugar nenhum. Hoje, logo abaixo
      do título das TRÊS telas (antes do veredito), `_taktFaixa(T, o)` (conta)
      + `_taktFaixaHtml(F, R, Tt)` (desenho, sem conta):
      - **PARA O APP DE CRONOANÁLISE · VOLUMES DA SEMANA** (laranja): os
        volumes (= caixas: cada volume de um produto é uma caixa), a UEP, os
        dias úteis, a jornada (`nUteis` × 527; feriado dito) e *jornada ÷
        volumes = X s por volume, sem descontar o setup* — ~~(o app desconta o
        dele)~~ **trocado na v7.225.0** pelo *takt no app* (ver *O SETUP DO APP
        NO TAKT DO PAINEL*, logo abaixo). Na esta
        semana e na que vem, `T.progCx` (as mesmas linhas do takt: as duas
        abas, fora da esteira de fora); volume em dia não útil é dito
        (`volFds`, está no total);
      - **TAKT DA SEMANA · NO PAINEL** em s por UEP, a média ao lado e o %;
      - na ESTA SEMANA, **AGORA**: o `_taktAgora` (s por caixa e cx/h).
      - **TAKT POR PRODUTO** (`<details class="tks-tpc">`, `TKS_TPC` lembra
        aberto no refresh): a tabela `_taktPorCaixaHtml(R, T, semTit)` saiu dos
        DETALHES (o teste falha se voltar); aberta, rola dentro (440 px,
        cabeçalho fixo). A contagem saiu dos títulos (*"N caixas
        programadas"*, *"N produtos colados = X UEP"*).
      - **AVALIAR**: a planilha programa por PRODUTO; `_tkaVolumes(L, T)` =
        produtos × `nVol` de cada um, e o TAKT POR PRODUTO por VOLUME com a UEP
        de cada volume (`uepVols`, campo novo do `_capProdutos`: a cor mais
        rápida, a mesma que soma o `uepJogo`; o `_tkaLer` leva `modelo`,
        `nVol`, `uepVols` no item). Medido: a 042-26 colada (8.000 produtos)
        = **9.050 volumes** = as 9.050 caixas do painel para 09–13/11. Produto
        fora do cadastro não conta e é dito.
      - Medido no Chromium com as fixtures: 1920, 1366 e 1280, nada passa da
        largura nem corta; a faixa tem ~125 px (145 na esta semana a 1366).
      - ~~⚠ Não verificado no app~~ — **conferido na v7.225.0** no código do
        app (`src/domain/demanda/capacidade.js`): o app usa os VOLUMES e faz a
        fração da semana pelos DIAS COM LOTE (`fracaoDaSemana`: 16–19/11 = 4 de
        5, 44 h × 4/5), então o feriado NÃO deixa o takt do app folgado.
    - **O SETUP DO APP NO TAKT DO PAINEL (v7.225.0)** — PPCP, 11/11/2026, com o
      print do app (PROGRAMA GRAVADO: 040-26 8.770 · 4 de 5 · 284 vol/h ·
      12.7s) e o da faixa (14,4 s por volume): *"não bate takt"* → *"ideal é
      painel ficar também com setup igual"*. Volumes e dias batiam; a diferença
      era toda o setup do grupo (8 setups × 8 min por dia = 5,3 h por semana,
      que o app desconta) e 1 min por dia (o app conta 44 h ÷ 5 = 8h48; o
      painel, 527 = 8h47, pelo slot 16:00-16:59).
      - **`CRONO_APP_GRUPO`** `{ hSemana:44, diasSemana:5, setupsDia:8,
        setupMin:8 }`: a jornada do grupo 0005 · EMBALAGEM no app (Demanda
        semanal → TEMPO DISPONÍVEL). O SETUP é do ⚙ desde a v7.226.0 (abaixo);
        os 8 × 8 daqui só valem até alguém digitar.
      - **O SETUP NO ⚙ (v7.226.0 / `.gs` v5.61)** — PPCP: *"melhor deixar para
        eu configurar setup nos dois, assim coloco igual, vamos usar setup
        médio"*. ⚙ → METAS DO DIA: **TROCAS/DIA · MIN/TROCA · SETUP/DIA** (os
        dois campos do app; `.frm-row.cfg-setup`, três colunas — ⚠ a
        `cfg-r3` já era da IDENTIFICAÇÃO). CONFIG_PAINEL `SETUPS_DIA` /
        `SETUP_MIN` (gravados como NÚMERO, os dois juntos; zero = sem setup;
        `_cfgSetup`), devolvidos pelo `getConfigPainel` como
        `setupsDia`/`setupMin` → `PONTOS_DIA`. `_taktSetup()` é a leitura
        ÚNICA: o recém-salvo (`SETUP_PEND`, origem `enviando`, *gravando na
        planilha…*) → planilha → este computador (`CFG.setupsDia/setupMin`,
        rpe_cfg) → padrão; o setup do dia tem de caber na jornada. O
        `_taktMontar` lê `h.setup || _taktSetup()` e guarda `T.setup`; a
        `_taktFaixa` passa o `T.setup` ao `_taktApp`. Textos com `_tkDec` (até
        2 casas) e `_tkM` (minutos com 1 casa: 494,2).
        - ⚠ **NO DOMÍNIO DO APP** (revisão da v7.226.0, BLOQUEIA): no banco do
          app `setups_dia` é smallint 0–100 e `setup_min` numeric(5,1) 0–600.
          O 4,3 × 7,65 que o ⚙ aceitava dava erro 400 no app (trocas) e 7,7 nos
          minutos — os dois takts voltariam a não bater. Hoje o ⚙
          (`_setupLer(v, casas, max)` + `_setupErro`; `SETUP_TROCAS_MAX`/
          `SETUP_MIN_MAX`) e o `.gs` (`_cfgSetup`, `SETUP_*_MAX_GS`) aceitam só
          trocas inteiras e minutos com uma casa (zero à direita não conta), e o
          setup do dia < 527. A MESMA régua nos dois (`fechamento.test.js`
          compara 17 casos). Texto com algarismo (*"8 min"*, *"8x8"*) não é
          número — o `_numBR` lia como 0.
        - **SALVAR com setup que não vale** (um campo só, fração, duas casas,
          passa da jornada) dá um alerta com o motivo e **não salva nada**,
          ANTES de mexer no CFG. Os dois vazios = não muda.
        - **O que vai à planilha** (`_setupEnviar`): o que o gestor MUDOU no ⚙
          (`_setupAberto` × campos) — um PC que abriu o ⚙ antes de ler a config
          não devolve o padrão por cima (a regra da META DIA (UEP)) —, **ou**,
          com a planilha sem a chave (`SETUP_PLAN` `sem-chave`), o setup deste
          computador (origem `computador`): é o que leva à planilha o setup
          digitado antes do re-deploy (revisão, BLOQUEIA: sem isso ele ficava
          só no PC para sempre). O PADRÃO nunca é semeado (apagaria o setup que
          outro PC ainda vai levar).
        - **`SETUP_PLAN`** (`_setupDaConfig`, no `aplicarConfigPainel`, o
          esquema do `ATRASO_PLAN`): `planilha` · `sem-chave` · `antigo` (o
          `.gs` sem o campo) · null. O SALVAR não escreve no `PONTOS_DIA`: o
          `setConfigPainel` devolve a config gravada e o `_setupResposta`
          confirma (ou, sem resposta ou com outro valor, dá um alerta para
          conferir no ⚙ — tempo esgotado não prova que não gravou). Com o `.gs`
          antigo, vale só neste PC, sem alerta.
        - **Setup médio medido** (PARADAS, só a jornada 07–17, 20 dias úteis de
          13/10 a 10/11/2026): **4,3 trocas de produto/dia × 7,65 min = 32,9
          min/dia** (mediana por troca 6,8; por dia 29,8), **digitado como 4 ×
          8,2 = 32,8** (o domínio do app). Troca de plástico (2,6/dia × 4,75 =
          12 min/dia) fora — consumo de bobina. Com 32,8: takt no app 16–19/11
          = 13,6 s (era 12,7), takt do painel 9,4 s por UEP.
        - O ⚙ ficou com 815 px (era 787): sem rolagem a 1920×1015 e 1920×937;
          a 1600×860 rola 9 px.
      - **`_taktApp(dias, vol, grupo)`** (pura): a conta do app (`ritmoExigido`
        + `horasDeSetup` + `fracaoDaSemana`), por semana seg–dom: dias com
        volume (no máximo 5) × (8h48 − setup do dia) ÷ volumes; `grupo` = o
        `CRONO_APP_GRUPO` com o setup do ⚙. Várias semanas (a AVALIAR) somam e
        a faixa diz *"N semanas somadas (no app, uma linha por semana)"*. A
        faixa: *takt no app: 12,7 s por volume (284 vol/h) = 30h56 ÷ 8.770 · o
        app conta 8h48 por dia com volume e desconta o setup, 8 × 8 min por dia
        (4h16 nos 4 dias)* (os números com o padrão 8 × 8). Saiu o *"= 35h08 de
        jornada"* do cartão (era o 8h47 do painel ao lado do 8h48 do app).
      - **O painel desconta o MESMO setup** em todo SEGUNDO da sub-aba
        (`_taktMontar`: `minProd` = 527 − setup/dia; com o padrão, 527 − 64 =
        463): `takt` = dias úteis × minProd × 60 ÷ UEP, `ref` = minProd × 60 ÷
        META, `exec.s` = minutos × minProd/527 × 60 ÷ UEP feita. Daí o TAKT DA SEMANA · NO PAINEL, o TAKT POR
        PRODUTO, o AGORA e os DETALHES. `exec.min` continua bruto (a simulação
        lê ele).
      - **A ÚLTIMA HORA do AGORA na mesma régua** (revisão da v7.225.0, o único
        BLOQUEIA): em relógio ela saía 19,8 s numa hora EXATAMENTE na meta ao
        lado da referência de 17,4 s — dois vereditos na mesma linha, com a cor
        do HORA A HORA dizendo verde. Hoje os minutos dela × minProd/527
        (`_taktFProd(T)`, como o EXECUTADO): hora na meta = a referência (o
        teste prende).
      - **As caixas por hora são de RELÓGIO** (`cxh` do AGORA, `cxhTakt` do
        TAKT POR PRODUTO: 3.600 × minProd/527 ÷ s por caixa — o setup na média):
        é o número que o líder confere no HORA A HORA (211 da MEL, não 240).
        O `Tv` da AVALIAR leva o `minProd` para isso.
      - **"sem o setup", nunca "com a linha rodando"** nos textos: RODANDO é o
        cartão da cronoanálise (sem as paradas marcadas), outra coisa.
      - ~~⚠ 64 min é o setup PLANEJADO do app~~ — o PPCP escolheu o setup
        médio medido, digitado nos dois (v7.226.0, acima).
      - **Não muda**: o % (o setup sai dos dois lados: 2.761 UEP/dia foi feito
        com setup dentro), as horas de linha (PRECISA, TEM, FALTAM — continuam
        em jornada de 8h47, a do PRÓXIMOS DIAS), o PARA FECHAR, a simulação e o
        🖨 TAKT (que não mostra segundos).
      - **Por que**: o NO PERÍODO de uma medição não tem setup (a troca
        acontece entre medições); comparado com um takt que tinha o setup
        dentro, o produto parecia caber com até ~12% a mais de tempo.
      - ⚠ **Fora da sub-aba TAKT a régua em segundos continua BRUTA** (527 × 60
        ÷ META): o TAKT s/CX do bloco 7 e da AGENDA (`_taktUep`), a META da ⏳
        ONDE O TEMPO VAI, a régua da meta da ⏱ CRONOANÁLISE. Mudar lá é outra
        decisão do PPCP — não foi pedido.
      - Medido no Chromium (fixtures do teste): 1920, 1366 e 1280, nada passa
        da largura; a faixa da ESTA SEMANA vai de 145 para 161 px a 1366.
    - **FALTA e SOBRA: palavra, nunca sinal (v7.214.2, PPCP: *"deixa regra
      clara sobre falta e sobra"*).** Falta = precisa − tem (não cabe), sobra
      = tem − precisa (cabe); a sobra não vira crédito, só abate atraso que já
      existe. A tabela escreve *falta 2h13* / *sobra 1h30* (coluna NA SEMANA)
      e o ATRASO ACUMULADO sem "−" (atraso já é a falta). Motivo: a planilha
      dizia `+2h13` = falta e o painel `−2h13` = a mesma falta — o sinal
      mudava de sentido entre os dois. Não volte a pôr `+`/`−` em falta/sobra
      no TAKT nem na planilha; e "sobra" é só folga — o que não fechou numa
      semana e passa para a outra é *o que não fechar*, nunca "a sobra".
    - **De onde vem o painel** (`_tkaPainel(fimN)`): TKS (esta semana), TKP (a
      que vem), `TKF` (faixas da 3ª segunda ao último dia colado, de 14 em 14
      dias — `_tkaFaixas`, `_taktLer` com de/ate) e o vencido de antes desta
      segunda (`_tkaVencidoAntes`, v7.238.0). ⚠ O `falta` do
      `getProgramacaoDetalhada` é POR CÓDIGO (atraso + o que falta de hoje) e
      vem igual em toda linha do código: até a v7.237.0 ele entrava em CADA linha
      vencida (dois lotes do mesmo código = o atraso duas vezes) e o vencido desta
      semana, que já vem do TKS linha a linha, entrava de novo. Hoje: por código,
      UMA vez, o falta menos o saldo das linhas do TKS até hoje, na linha vencida
      mais antiga; as outras com saldo 0 (só para a colagem não duplicar o lote).
      Só com a programação detalhada DE HOJE (`_progDetHoje`): o falta de ontem
      menos o saldo de hoje erraria; o `_tkaPainelCarregar` relê se for de outro
      dia (`TKA_VENC_FALHA` segura a releitura sozinha depois de uma falha).
    - **A regra do 4 SEMANAS (v7.238.0)**: lote em sábado, domingo ou feriado é
      HORA EXTRA JÁ PROGRAMADA — fora do atraso, dita na semana (*"hora extra já
      programada: 14/11 1h03"*) e na frase (`C.heMin`); o vencido que cai num
      hoje fora da jornada continua atraso (`d.venc`). Dia útil com lote com UEP
      já adiantado tem a jornada (antes: lacuna). O rótulo da semana só pelos
      dias úteis. `_tkaPainelCarregar` lê o que
      faltar NA FILA (`_uepDepoisDe(_uepLendo, …)`; `TKA_VOO` fica fora do
      `_uepLendo`, senão esperaria a si mesmo).
    - **🖨 AVALIAÇÃO DA PROGRAMAÇÃO** (`gerarRelatorioAvaliacao`, menu): a
      frase, a colagem (veredito + dia a dia) e o saldo (`_tkaSaldoHtml`, sem a
      frase repetida); `_TKS_DOC_SKIN` + `_TKA_DOC_SKIN`. Uma folha.
    - Medido em 06/11 ~14:40 com a 043 colada (A:I): 12 de 17 linhas já no
      painel (16–18/11), 5 novas (19 e 23/11); a 043 sozinha CABE (sobram
      1h15), a linha chega em 16/11 com 14h25 de atraso e termina 23/11 com
      13h10 (ritmo atual 22h21). Com só a 044 colada: 19/11, 23/11 e 24/11
      (lote 216/26 sem quantidade) são lacunas.
  - Medido na tela em 06/11/2026 11:58 (leituras reais): takt **9,9** s/UEP
    (3.208/dia, 116,2%), referência **11,5**, executado **12,6** (90,6%,
    8.647 UEP em 3 dias e 4h00 + 1.110 em HE), falta **5.097 UEP** (2.370 cx;
    cabem ~1.504 até 17:00 → faltam 3.593). AGORA: MEL VOL 1/2 BRANCO 1,73 →
    17,1 s (takt), 19,8 s (referência), 10:00 = 24,8 s (vermelho).
- **Por que UEP e não caixa** (medido em 03–05/11/2026): em caixas a linha fez
  1.340, 1.327 e 1.009 contra ~1.800/dia que o takt em caixas pediria — vermelho
  todo dia —, mas em UEP fez 97%, 104% e 76% da referência. O que faltou foi
  CARGA (a programação pediu 116% da referência; 04/11 pediu 156%), não ritmo:
  dos 2.611 UEP que não saíram na jornada, 1.978 eram carga e 633 ritmo.
- **`getProgramacaoSemana&de=&ate=`** (`.gs` v5.59, leitura, cache 120 s,
  grupos `prod`+`cat`): as linhas da semana das DUAS abas (PROGRAMACAO +
  PROGRAMACAO_CONCLUIDA) pela DATA de cada linha — a regra da META do dia
  (`programadoHoje`: fora da esteira de fora; o teste confere dia a dia). Por
  linha: data, lote, ordem, código, cor, qtde, `uepCx`/`uep` (cadastro de agora;
  null sem UEP), `saldo` (`_saldoConfiavel`: o SALDO do write-back só quando
  PRODUZIDO + SALDO = QTDE; concluída, encerrada vencida e fora da esteira 0;
  futura sem conta a QTDE; desde a v5.66 a de HOJE com PRODUZIDO e SALDO
  vazios também — ainda sem lançamento; sem conta null, nunca 0), `aba`, `encerrada`,
  `foraEsteira`; e os feriados do período. Sem datas: a semana de hoje (seg–dom).
  Máx. 14 dias. Não refaz o FIFO (lê as abas e o cadastro).
  - ⚠ **Só as duas abas juntas**: lendo só a PROGRAMACAO, o total da semana
    encolhe conforme os lotes concluem, e o takt fica mais folgado a cada dia.
  - Medido na planilha em 06/11/2026: a semana 02–08/11 somou **5.970 cx =
    12.831 UEP** (03/11 1.200 · 04/11 2.070 · 05/11 1.550 · 06/11 1.150 — as
    metas gravadas de cada dia). O app de cronoanálise usou **7.222 volumes**
    para o takt da mesma semana: 1.252 a mais, origem não apurada. O takt do
    painel é do painel; não comparar os dois números como se fossem o mesmo.

## PLANILHA DE PRODUÇÃO (Excel do PCP) — ajustes de 06/11/2026
- Arquivo do PCP fora do repositório: `PLANILHA_PRODUÇÃO_SEM_COR - 2026.xlsx`
  (uma aba por semana de corte `NNN-26`; cada bloco de 8 linhas = UM LOTE =
  UM DIA de embalagem, PREV EMB na coluna I; QTDE em PRODUTOS (jogos) na F e o
  PRODUTO na G; `UEP DIA` do lote em U8/U16/U24/U32/U40 pela BASE PRODUTOS;
  aba UEP = cadastro por PRODUTO, com registro de trocas em AB:AF que vale
  pela PREV EMB).
- PPCP: *"pode arrumar tmb"* e *"se tiver UEP desatualizada na planilha
  arrume"*. Feito por **edição cirúrgica do XML** (só 12 partes; os
  complementos Claude/GPT for Excel, os comentários e o customXml ficam):
  - **Valores velhos**: a coluna F da aba UEP já tinha as trocas de 04/11, mas
    o arquivo guardava os resultados de antes (RACK FLIP 1.8 2,13 com F 2,46;
    BUFFET FLIP 1.8 3,42 → 3,69). `fullCalcOnLoad="1"` no `calcPr`: o Excel
    recalcula tudo ao abrir. Depois disso a 041-26 bate com o painel (03/11
    3.229, 04/11 4.304,1) e a 042-26 também (12/11 2.736,5; semana 14.503,5).
  - **LIVREIRO ENCANTO 1,87 → 2,10** (cadastro 04/11/2026 DIGITADA; faltava
    na planilha) + a troca registrada em AB27:AF27 (lote 203/26, PREV EMB
    04/11: 2.057 → 2.310). Os outros 120 produtos batem com o PRODUTO_CODIGO de
    06/11; 14 sem código na planilha (estimativa de 25/09); EXPOSITOR PATRIMAR
    (2,67) × EXPOSITOR PATRIMAR III do cadastro (3,47 EST) **não mexido** —
    PPCP, 06/11/2026: *"não importa esses produtos"* (nem ele nem os 14 sem
    código); ficam como estão na planilha.
  - **Teste CABE/PASSA** (042–049): parâmetros `DADOS!Y2` = 2.761 (média da
    linha sem hora extra) e `Z2` = 527; por lote X:Z (% da média, horas de
    linha, CABE / PASSA +h) com formato condicional; nas 043–049 o bloco do
    takt em VOLUMES (K46:Q47, com pausas de 90 min descontadas de novo) virou
    UEP SEMANA · DIAS · CAPACIDADE · PEDE % · PRECISA · TEM · FALTA/SOBRA +
    SITUAÇÃO (T47) e UEP/DIA MÉD. (U47); na 042 (rodapé antigo) o resumo em
    X46:Z47. Verificado recalculando uma CÓPIA no LibreOffice: os mesmos 30
    `#N/A` de antes (RESUMO M² T219:T248, já no original), nenhum novo.
  - **FALTAM / SOBRAM por extenso** (06/11/2026, PPCP: *"deixa regra clara
    sobre falta e sobra"*, junto com a v7.214.2 do painel). A 1ª entrega
    tinha *FALTA (+) SOBRA (−)* com `+2h13` — o sinal ao contrário do SALDO DE
    HORAS do painel. Agora Q47 (043–049) = *FALTAM 2h13* / *SOBRAM 1h15*
    (vermelho/verde, a letra reduz para caber na coluna Q); na 042 a SITUAÇÃO
    (Z47) é só *NÃO CABE* / *CABE* e o FALTAM/SOBRAM foi para AA46:AA47 (coluna
    vazia, alargada como X:Z). A regra escrita em K48 (043–049, 2 linhas) e
    X48 (042): *FALTAM = PRECISA − TEM: NÃO CABE · SOBRAM = TEM − PRECISA:
    CABE · a sobra não passa para a semana seguinte*. SITUAÇÃO e UEP/DIA MÉD.
    (T46/U46) reduzem a letra (se encostavam).
