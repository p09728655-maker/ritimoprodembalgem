# Programação e lotes — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## STATUS da PROGRAMACAO: EM ANDAMENTO é do lote DE HOJE
- Pedido do usuário (14/09/2026): *"status em andamento só lotes do dia, anterior
  ao dia atual é em atraso"*. Um lote programado para **02/09** saía como **EM
  ANDAMENTO** no dia **14/09** — a palavra dizia que a coisa caminha, e ela está
  parada há doze dias.
- Os estados, em `_progStatus`/`atualizarSaldoNaProgramacao`: **`CONCLUIDO`**
  (saldo 0) · **`CONCLUIDO (ADIANTADO)`** (saldo 0 com metade ou mais vinda de
  produção adiantada, v5.21) · **`EM ATRASO`** (data anterior a hoje, não
  concluída) · **`EM ANDAMENTO`** (lote de HOJE que já produziu) · **`PENDENTE`**
  (lote de HOJE que não começou) · **`FORA DA ESTEIRA`** · **`ENCERRADO`** (X na
  coluna ENCERRAR, v5.21 — ver *Por que o lote não fechava*). Data futura
  continua **em branco**.
- **Quem não começou também é EM ATRASO.** A régua é a MESMA que o painel usa
  para somar o atraso (`calcularProgramacao`: `if (lot.d < hojeNum) atraso +=
  lot.rem`), e lá tanto faz se a linha produziu metade ou nada — a soma dos
  `SALDO` das linhas EM ATRASO é o atraso que o painel mostra. O que distingue as
  duas continua na linha: `PRODUZIDO`/`PERCENTUAL` em **0**.
- ⚠ **O status muda SOZINHO na virada do dia** — e por isso o `ATUALIZADO_EM` não
  pode olhar o texto cru. `_progFase()` trata `PENDENTE`/`EM ANDAMENTO`/`EM
  ATRASO` como a mesma fase (**lote aberto**): só o relógio separa os três. Toda
  mudança de verdade (entrou no cálculo, concluiu, saiu da esteira) mexe em
  `PRODUZIDO`/`SALDO` junto, e é por ali que ela carimba. Sem isso o primeiro
  lançamento do dia recarimbaria a aba inteira e o carimbo da v5.3 voltaria a
  mentir.
- ~~A string do STATUS não é lida por ninguém~~ — **revogado na v5.21**: o
  `.gs` lê `ENCERRADO` e `CONCLUIDO (ADIANTADO)` (ver *Por que o lote não
  fechava*). O painel continua sem ler. O arquivamento segue decidindo pelo
  saldo FIFO; o texto só segura o ADIANTADO um dia.
- ⚠ **O status só se atualiza quando o script roda** (a cada lançamento). Antes
  do primeiro apontamento do dia, a aba ainda mostra o retrato de ontem.
- ⚠ Com a programação toda vencida, a aba inteira sai EM ATRASO — é o retrato da
  carteira, não defeito da regra. Aí quem prioriza é a **DATA** e o **SALDO**.
- ⚠ Mudou o `.gs` (v5.4) → **re-deploy manual**. `apps-script.test.js` cobre os
  quatro status, a virada do dia sem recarimbo e a fase.

## Linhas SOMEM da PROGRAMACAO fora do script (medido em 25/09/2026)
- PPCP: *"meta de hoje 615? hj era 1550 caixas"*. Na planilha, as linhas com
  DATA 25/09 somavam **585 cx** nas DUAS abas (PROGRAMACAO 115 + 300 ·
  PROGRAMACAO_CONCLUIDA 20 + 150) — o painel estava certo sobre o que havia lá.
  A produção do dia tinha códigos **sem linha em aba nenhuma** (ESCRIVANINHA
  TAURUS 501118005 395 cx e 501118001 275 cx, 501114009 160, 501114007 81,
  501152001 33 = ~944 cx; 585 + isso ≈ os 1.550). A Ordem 2 do dia não existe.
- **O script não apaga linha sem copiar**: o `_arquivarConcluidos` só remove
  linha CONCLUÍDA, depois de gravar a cópia na CONCLUIDA, sob o lock do
  `saveRealizado`, e `ARQ_EXCLUIR_SEM_COPIA` é `false`. Sem duplicadas na
  CONCLUIDA (seria o rastro de índice errado). Quem tira linha é mão humana ou
  a colagem do extrato do ERP por cima da aba.
- ⚠ **Não é só hoje**: em quase todo dia útil de setembro, as linhas que
  sobraram com aquela DATA somam muito menos que a META gravada no HISTORICO
  (22/09: meta 1.250, sobraram 60 cx; 03, 11 e 18/09: nada).
- Efeito: a meta do dia (`programadoHoje`) **encolhe durante o dia** conforme
  as linhas somem, a EF infla (25/09 fechou 312,4%) e o FIFO perde demanda —
  a produção de um código sem linha aberta é descartada ou credita outro lote
  do mesmo código (a razão de o arquivamento existir).
- Os lotes "faltando" na numeração **não são prova**: o ERP numera os lotes da
  fábrica toda.
- **Quando a meta do dia parecer baixa, conferir primeiro se linhas sumiram**
  (soma por DATA nas duas abas × o que o PPCP programou) antes de mexer em
  código.
- **A exclusão era de propósito** (usuário, 25/09): *"não fecha o lote pelo
  app, tem lote que fica aberto, aí tenho que excluir a linha"*. Por isso o
  alarme de "linha sumiu" foi recusado — acusaria a limpeza que o PPCP fazia.
- **Resolvido na v7.128.0 / mobile 1.32.0 / `.gs` v5.21 (09/10/2026)** — ver
  a seção *Por que o lote não fechava* logo abaixo. Medido de 28/09 a 08/10:
  nenhuma linha sumiu (a soma das linhas de cada dia = META gravada).
  - Medido na planilha de 25/09 (17:05), as linhas abertas e vencidas:
    25218 LUNA 440 CUMARU 31 de 50 · 25220 PRINCESA ROSA 339 de 350 · 25228
    URBAN OFF WHITE 84 de 115 · **25229 SLIM BRANCO 0 de 300, enquanto o SLIM
    OFF WHITE (501128002) fez 444 cx hoje para um lote de 150** — e o URBAN
    501152001 fez 33 sem linha. Cobertura do apontamento com produto: 100% em
    15–25/09.
  - Ou seja, **dois motivos diferentes para "não fechar"**: sobra pequena de
    verdade (11, 19, 31 cx) e **caixa apontada no código da cor irmã**. O
    segundo não se resolve encerrando — o painel teria de mostrar a troca
    (sobra num código, falta no irmão do mesmo lote/modelo). Conferir com o
    PPCP antes de desenhar.
  - O HISTORICO de 25/09 foi corrigido à mão pelo usuário: META 1.550 e EF
    123,9 (conferido na planilha em 09/10).

## Por que o lote não fechava — adiantamento, ENCERRAR e cor errada (v5.21)
- Medido na planilha em 09/10/2026: **58 linhas vencidas abertas, 3.770 cx**.
  Refazendo o FIFO do `.gs` linha a linha, três causas (decididas com o PPCP
  no mesmo dia, com os números na mão):
  - **~1.716 cx: caixa embalada 1–2 dias ANTES da data do lote.** O FIFO só
    abatia lote já ABERTO e descartava o resto — 501106005: 219 cx em 06/10
    para o lote de 07/10, que ficava com 0. **Era a causa nº 1.**
  - **101 cx em 36 linhas: sobras de 1 a 10 cx.**
  - **~1.350 cx em 9 linhas: cor IRMÃ do mesmo produto com caixa sobrando** —
    cor errada no app (confirmado pelo PPCP). Ex.: 25229 SLIM BRANCO 0 de 300 ×
    OFF WHITE 444 cx num lote de 150; 25249 501094004 falta 650 × 501094003
    com 643 a mais.
  - ~600 cx sem explicação ficaram como atraso real.
  - ⚠ **Os 1.716 cx são o que a regra CLASSIFICA como adiantamento** — e ela não
    distingue adiantamento de verdade de sobra sem dono (cor errada, lançamento
    dobrado, linha apagada à mão em setembro) creditando o lote seguinte do
    mesmo código. É por isso que existe o **CONCLUIDO (ADIANTADO)** abaixo.
- **PRODUÇÃO ADIANTADA** (`ANTEC_DIAS_UTEIS`=2, decisão do PPCP: *"até 2 dias
  úteis"*). No FIFO do `calcularProgramacao`, a sobra de uma produção vira
  **crédito** (`cred`) e é consumida quando um lote **do mesmo código** abre
  em até 2 dias úteis depois dela (`_diasUteisEntre`: seg–sex, sexta → segunda
  = 1; o feriado da aba `FERIADOS` não conta desde o `.gs` v5.38 — ver
  *FERIADOS*). Passou da janela, é descartada como antes.
  - ⚠ **A janela compara a data da PRODUÇÃO com a data do LOTE, nunca com
    hoje.** O FIFO é refeito do zero a cada execução; comparando com hoje, o
    saldo de lote antigo mudaria com o passar dos dias.
  - **A regra original existia por um motivo** (produção antiga de OUTRO lote
    zerando um lote novo do mesmo código). A janela curta é o que segura isso;
    **não alargar sem medir**. O crédito nunca atravessa código — é por isso
    que a cor errada precisa do aviso no app.
  - ~~Linha FUTURA continua fora do FIFO: o crédito espera a data dela~~ —
    **resolvido na v7.131.0 / mobile 1.33.0 / `.gs` v5.22**, ver a seção
    *O lote de amanhã já baixa o adiantado* logo abaixo.
  - O consumo de crédito **não** entra no `hojeProd` (não é produção de hoje).
  - Efeito medido no 1º run (planilha de 09/10): atraso **3.770 → 2.054**,
    falta p/ zerar 5.420 → 3.077, meta do dia 1.650 → **1.650**; **2 linhas
    arquivam** e **7 ficam na aba como CONCLUIDO (ADIANTADO)** para conferência
    (saem no dia útil seguinte). Nenhuma linha volta da CONCLUIDA.
- **CONCLUIDO (ADIANTADO)** — linha que fechou com **metade ou mais vinda de
  crédito** (`adiLinha`). STATUS próprio e **fica pelo menos um dia na aba**:
  o `_arquivarConcluidos` só a leva quando o STATUS já está gravado como
  ADIANTADO **e** o `ATUALIZADO_EM` (`_diaDoCarimbo`) é de antes de hoje — na
  1ª rodada depois do re-deploy o write-back acabou de carimbar a mudança, então
  ela segura também. O `simularArquivamento()` lista essas linhas à parte
  ("conferir"). Crédito pequeno (sobra de 20 cx do lote anterior) não marca.
- **LINHA ARQUIVADA VOLTA PARA A ABA** (`_desarquivar`, roda no fim do
  `_arquivarConcluidos`). Linha da CONCLUIDA **não encerrada** que o FIFO dá
  com saldo de novo — log corrigido depois, linha mais antiga do código
  acrescentada — volta para a PROGRAMACAO com PRODUZIDO/SALDO/STATUS
  recalculados (`_progStatus`, o mesmo do write-back). Sem isso o atraso dela
  aparecia no painel **sem nenhuma linha na aba que o explicasse**.
  - A linha é conferida (código, lote, data) antes de sair da CONCLUIDA; se a
    aba mudou desde o cálculo, fica onde está. Roda também com a PROGRAMACAO
    vazia (tudo arquivado).
  - ⚠ Não é mais verdade que "lote arquivado continua concluído": continua
    enquanto o log e a programação não mudarem para trás. Quando mudam, ele
    reaparece na aba — é a intenção.
  - **A DATA volta no formato da aba** (`.gs` v5.45, `_progDataNoFormato` /
    `_progFormatosData`). PPCP, 04/11/2026: *"a data de novo veio errada"* —
    a 25390 501.136.005 voltou às 14:58 (o TROCAR PRODUTO das 14:58:02 tirou
    158 cx dela para o CINAMOMO 501.136.003: 147 de 150) com a DATA
    `04/11/2026` no meio do `dd/mm` do extrato. O VALOR estava certo (o FIFO
    lê o Date); o `setValues` deixa o formato padrão do Sheets. Hoje a linha
    pega o formato de data mais comum das linhas da MESMA data (sem elas, o da
    coluna); "General", texto, número e data com hora não contam. Só formato:
    falhar não desfaz a volta. A célula B115 daquele dia foi acertada à mão
    pela API (`dd/mm`).
  - ⚠ A linha que volta continua indo para o **FIM da aba**, fora da ordem do
    lote. Inserir no lugar não foi feito: mexe na ordem da aba, que o FIFO usa
    no desempate da mesma data (`fecho`).
- **Mesma data no FIFO: quem já fechou entra primeiro** (`fecho`: arquivada →
  encerrada → aberta, cada grupo na ordem da aba). Antes o empate seguia a
  ordem de leitura (aba ativa antes da CONCLUIDA): ao arquivar, a linha passava
  para trás da irmã da mesma data, a irmã levava a produção dela e a caixa
  contava duas vezes.
- **ENCERRAR** (decisão do PPCP: *"marca ENCERRAR na planilha"*, nada fecha
  sozinho). Coluna de ENTRADA `ENCERRAR` na `PROGRAMACAO`, **criada pelo
  script** no fim da aba (o LOTE é achado por "contém LOTE" — uma coluna
  digitada como "ENCERRAR LOTE" à esquerda viraria o LOTE nos três leitores).
  - A marca é `_marcado()`: qualquer coisa escrita, **menos o que quer dizer
    "não"** (`FALSE`, `0`, `N`, `NÃO`). ⚠ Caixa de seleção desmarcada chega
    como `FALSE` — com "não vazio" a coluna inteira fecharia e ARQUIVARIA a
    programação toda no lançamento seguinte. **Só vale para linha vencida ou
    de hoje**; em data futura a marca espera a data (para CANCELAR lote futuro,
    apagar a linha continua certo — não há produção ligada a ele).
  - **O teto é o PRODUZIDO da própria linha, só quando a célula é DELA**
    (`_produzidoConfiavel`: `PRODUZIDO + SALDO = QTDE`, ou `ENCERRADO` com saldo
    0). Aí a demanda no FIFO é `min(QTDE, PRODUZIDO)` e ela é **servida antes**
    de qualquer lote aberto (1ª passada do laço de produção): na ordem normal
    recebe o mesmo de sempre, e uma linha mais antiga do código acrescentada
    depois não toma as caixas dela.
  - **Sem PRODUZIDO confiável ela recebe só o que veio ANTES de hoje**
    (`ateOntem`: crédito e produção de dias anteriores). Os dois casos: a linha
    de HOJE marcada antes do 1º lançamento do dia (a célula está vazia — ontem
    ela era futura, e o write-back deixa futura em branco) e o extrato do ERP
    colado por cima das colunas de entrada (a célula é de OUTRA linha). Com a
    QTDE cheia, o X dado de manhã comia o 1º lançamento do dia, que era
    adiantamento de outro lote.
  - ⚠ A régua é a célula, então ela tem de ser da regra NOVA: logo depois do
    re-deploy o PRODUZIDO ainda é o da regra antiga (o 501106005 tinha 0 com
    219 cx adiantadas). É por isso que a coluna **nasce do script**, na mesma
    rodada que regrava o PRODUZIDO de todas as linhas. **Não criar a coluna à
    mão antes do re-deploy.**
  - O PRODUZIDO da encerrada é o **recebido do FIFO** (`encLinha`), nunca
    `qtde − saldo` — com o saldo forçado a 0 isso daria a QTDE inteira e
    realimentaria o FIFO na rodada seguinte. Mesmo cuidado no fallback do
    arquivamento. `PERCENTUAL` arredondado **para baixo** (219/220 não é 100).
  - **Tudo POR LINHA da aba** (`saldoRow`/`encLinha`/`adiLinha`, chave
    `código|lote|data|linha`). Duas ORDENS do mesmo lote (código, lote e data
    iguais) recebiam a SOMA pela chave: 100 e 20 viravam 20/80 nas duas, e com
    o X cada uma congelava em 20 e soltava 80 cx de crédito para o lote
    seguinte. A soma pela chave (`saldoLinha`) ficou só de rede, para a linha
    que não casou (aba mudou entre o cálculo e a gravação). Encerrada sem valor
    para a linha fica **em branco** — nunca CONCLUIDO pela conta `qtde − 0`.
  - A META do dia (`programadoHoje`) continua com a QTDE original, inclusive
    de linha encerrada e arquivada no dia. O saldo dela não é atraso nem
    `hojeRestante`. Fora da meta, o encerrado sai do "a fazer": o
    `getProgramacaoHoje` lista pelo `progHojeAberto` (o app do operador não
    mostra o lote fechado com a meta cheia) e o `porLote` manda `encerradas` —
    a Tela E conta o lote à parte e diz **NADA EM ABERTO HOJE**, nunca
    "PROGRAMAÇÃO DO DIA CONCLUÍDA" ao lado da meta que faltou.
  - Vai para a CONCLUIDA como `ENCERRADO`, com o X junto (a cópia casa por
    nome e o `_abaArquivoProg` acrescenta a coluna). **Apagar o X na CONCLUIDA
    DESFAZ o encerramento**: a linha volta para a PROGRAMACAO, recalculada
    (`desfez`, pelo STATUS `ENCERRADO` sem X). É o caminho quando a cor errada
    é descoberta depois do X.
  - FORA DA ESTEIRA vence o ENCERRAR, nos dois lados (planilha e aba
    PROGRAMAÇÃO do painel): um rótulo só para a mesma linha.
- ⚠ **O STATUS passou a ser LIDO pelo `.gs`** (revoga o "não é lido por
  ninguém" da seção do STATUS): `ENCERRADO` no `_produzidoConfiavel` e no
  desfazer da CONCLUIDA, `CONCLUIDO (ADIANTADO)` na segura do arquivamento.
  Editar o STATUS à mão muda o FIFO e o arquivamento.
- **AVISO DE COR ERRADA no app** (`avisoCorErrada`/`avisoCorErradaTxt`, no
  `salvarLanc`). Dispara só com os sinais juntos: as caixas passam do que o
  código ainda aceita — o saldo de hoje (`PROG_HOJE.falta`, descontado
  localmente a cada lançamento) **mais** o lote dele nos próximos 2 dias úteis
  (`proximosQtde`, adiantamento legítimo) — por pelo menos `COR_AVISO_MIN`=10
  cx ou `COR_AVISO_PCT`=10% do lançamento, **e** outra cor do **mesmo
  produto** — mesma `desc`, que inclui o VOL; **nunca os 6 dígitos** (o 501130
  tem quatro mesas) — tem saldo.
  - **Sem a lista dos próximos dias não avisa** (`PROG_PROX` null: backend
    antigo ou leitura que falhou — o `.gs` NÃO manda lista vazia nesse caso).
    Sem ela todo adiantamento viraria acusação. O aviso só funciona **depois
    do re-deploy do `.gs`**.
  - O destaque (laranja) é **TROCAR A COR**, e ele fica **à direita**, onde
    estava o ADICIONAR (`row-reverse` no `confirmarModal({seguro:'cancelar'})`).
    Só trocar a cor deixava o COR CERTA debaixo do dedo: medido no Chromium,
    toque duplo no ADICIONAR confirmava a cor errada. E toque nos primeiros
    `CONFIRMA_TRAVA_MS`=400 ms depois de abrir não responde (`_confirmaClique`).
  - **COR CERTA vale para o código o resto do dia** (`COR_OK`): quem continua
    no código depois de fechar o lote tomaria o aviso a cada caixa.
  - TROCAR A COR abre o seletor POR CIMA do lançamento. **Tocar ou BIPAR** a
    cor certa troca só o produto: o `processarBipe` com o lançamento aberto não
    chama mais o `abrirLancSlotAtivo` (que reabria na hora corrente, apagava a
    quantidade e, com a hora recém-fechada em tolerância, jogava as caixas na
    hora seguinte — o caso de 28/08). Bipe com o CONFERIR A COR aberto responde
    TROCAR A COR (`_confirmaTag`).
  - Código e slot são guardados **antes** da pergunta (`codLanc`/`slotLanc`):
    com ela aberta, um bipe troca o PROD_ATUAL. Mudou durante a pergunta → não
    grava (o operador confere de novo).
  - Só julga com a lista DE HOJE e de no máximo `PROG_HOJE_MAX`=30 min (lote
    datado ou encerrado pelo PPCP depois). O **ciclo do operador** relê a lista
    a cada `PROG_HOJE_TTL`=15 min, **em sequência** com o `lerSheets`. Nunca
    buscar o `getProgramacaoHoje` antes de gravar (o operador esperaria o cold
    start) nem em paralelo depois (as duas JSONP só se enfileiram no Apps Script).
  - O texto **não cita o número do lote**: o `lote` da lista é o último lote do
    código, não necessariamente o que tem o saldo.
  - ⚠ O `#modal-confirma` vem ANTES do `#modal-lanc` no HTML com o mesmo
    z-index: aberto por cima, ficava escondido. Hoje `z-index:120`.
- **Corrigir a cor de um lançamento passado** é na `PRODUCAO_PRODUTO` (trocar o
  CODIGO das linhas erradas). **Ordem:** corrigir o log **antes** de marcar o X —
  encerrada não recebe correção depois. Feito depois, o FIFO refaz sozinho:
  linha arquivada que volta a ter saldo reaparece na aba; linha **encerrada**
  só volta se o X for apagado (na PROGRAMACAO ou na CONCLUIDA).
- Limitação aceita: linha mais antiga acrescentada depois re-aloca o FIFO, como
  sempre foi — para linha arquivada **não encerrada** isso a traz de volta para
  a aba (correto: ela passou a ter saldo).

## O lote de amanhã já baixa o adiantado (v7.131.0 / mobile 1.33.0 / `.gs` v5.22)
- PPCP, 14/10/2026, com a aba na mão: *"está entrando lt 25295 mas não baixa,
  esse lote é de amanhã"* → *"tem que ter essa função de atualizar lote que
  adiantou"*. A linha rodou o 25295 (15/10) o dia todo — 501142002 450 de 450,
  501142004 267 de 270… — e as linhas ficaram **em branco**: o crédito da v5.21
  só abatia o lote quando a data dele chegava, e o write-back deixava futura em
  branco. Para o PPCP, o lote parecia nem ter começado.
- **`adiFut` no `calcularProgramacao`** ("key|lote|dNum|linha" → cx): depois do
  FIFO, o crédito que SOBROU é alocado às linhas FUTURAS da aba ativa do mesmo
  código, na ordem de data (na mesma data, a encerrada antes — o `fecho`), com
  a mesma janela (data da produção → data do LOTE). Toda produção é ≤ hoje,
  então a linha futura abre DEPOIS dela no FIFO de amanhã: é **exatamente** o
  que ela vai receber quando a data chegar, se nada mais mudar. O teste roda o
  dia seguinte e confere o mesmo número.
  - ⚠ **Nada do que é ≤ hoje muda**: atraso, meta, `hojeRestante`,
    `faltaZerar`, Tela E (`porLote`) e `saldoLinha`/`saldoRow` (que o
    arquivamento lê) são os mesmos. A linha futura só pega crédito que nenhuma
    vencida ou de hoje pegaria. O teste compara com o cálculo sem as futuras.
  - Código só com linha futura também entra no laço quando tem produção (feito
    ONTEM para o lote de AMANHÃ, nada hoje) — antes ele nem passava pelo FIFO.
  - É **prévia**: muda se o log for corrigido, se entrar linha mais antiga do
    código ou se a produção de amanhã cobrir um vencido primeiro. O write-back
    regrava a cada lançamento; sem caixa adiantada a linha volta ao branco.
- **Write-back**: linha futura com `adiFut` grava PRODUZIDO/SALDO/PERCENTUAL e
  STATUS **`ADIANTADO`** (parcial) ou **`CONCLUIDO (ADIANTADO)`**. Futura sem
  caixa adiantada continua em branco. `ADIANTADO` é da fase **ABERTA** no
  `_progFase` — na virada do dia ele vira EM ANDAMENTO sem recarimbar o
  `ATUALIZADO_EM`. **EM ANDAMENTO continua sendo só do lote de hoje.**
  - Linha futura **nunca sai da aba** (o `_arquivarConcluidos` já marca futura
    como ABERTA); a CONCLUIDO (ADIANTADO) fica a véspera + o dia dela e sai no
    dia útil seguinte (o carimbo é da véspera).
  - X numa futura adiantada: a marca continua esperando a data; quando ela
    chega, o PRODUZIDO gravado na véspera fecha com a linha
    (`_produzidoConfiavel`) e vira o teto — o lançamento do dia não entra.
    A nota do ENCERRAR de que "toda linha de hoje chega vazia ao 1º lançamento"
    deixou de valer para a linha que foi adiantada.
- **`getProgramacaoDetalhada` manda `adiantado` por linha futura** (do próprio
  FIFO, por linha — somar não conta duas vezes, ao contrário do `falta` por
  código). `_cartQtdAberta(it)` = `qtde − adiantado` é o que a carteira do
  PLANO, o PRÓXIMOS DIAS (aba ⚖ UEP e impressão) e a diretoria cobram; o
  adiantado fica **contado à parte** (`adi` no dia, `adiantado` no total, linha
  "N cx já adiantadas" no card e no cartão do dia). Dia todo adiantado continua
  existindo com 0 de carga — "SEM LOTE DATADO" seria mentira. Backend antigo
  não manda o campo → a qtde, como sempre.
  - Aba PROGRAMAÇÃO: a linha futura adiantada mostra EMBALADO = adiantado e
    FALTA = `qtde − adiantado` em cinza (não venceu) ou **✓ ADIANTADO** em verde.
- **`proximosQtde` do app = o que os lotes ainda ACEITAM** (`_codigosProximos(
  adiFut)`): o lote de 450 já todo feito não aceita mais 450 cx do código sem o
  aviso de cor errada. O app também desconta localmente, a cada gravação, o que
  passou do saldo de hoje (`PROG_PROX_QTD`), e o texto diz *"ainda em aberto
  nos próximos dias"*.
- ⚠ **A META de amanhã continua com a qtde cheia** (regra do `programadoHoje`,
  igual à da linha encerrada). Os 850 cx do 25295 feitos em 14/10 contam no
  realizado de 14/10 e estão na meta de 15/10: a EF de 15/10 só fecha se a
  linha adiantar o lote de 16/10. Não mexido — mudar mudaria a meta histórica.
- ⚠ Mudou o `.gs` → **re-deploy manual**. Antes dele o painel e o app seguem
  como antes (sem o campo, `_cartQtdAberta` devolve a qtde).

## Coluna ADIANTADO_CX — quanto da linha veio adiantado (`.gs` v5.23)
- PPCP, 14/10/2026: *"tem como na aba programação concluída colocar também que
  foi embalado adiantado?"* → escolheu a coluna com a **quantidade** (opção 2)
  em vez de só baixar o limite da etiqueta. O STATUS CONCLUIDO (ADIANTADO) é
  sim/não e só a partir de metade da linha (`cred × 2 ≥ q`); a coluna diz
  QUANTO, em toda linha.
- **É o `lot.cred` do FIFO** — caixas que a linha recebeu de crédito ao abrir.
  Como o lote abre antes da produção do próprio dia, crédito é sempre produção
  de dia ANTERIOR à data do lote. Mapas internos `credRow` (aba ativa, por
  linha) e `credArq` (linha da CONCLUIDA que volta, pela linha de lá — as duas
  abas têm numeração própria e juntas colidiriam). Os dois entram na lista de
  apagar do `getPontosDia` (o teste prende).
- **Write-back**: `ADIANTADO_CX` é a 6ª coluna de saída do `OUT`, criada no fim
  da aba (na planilha real, depois do ENCERRAR). Valor por caso: lote ≤ hoje
  casado POR LINHA → `min(cred, produzido)`; encerrada → idem; futura com
  `adiFut` → o próprio produzido (tudo veio adiantado); o resto (fora da
  esteira, futura sem adiantamento, linha que caiu na soma pela chave) → vazio.
  **0 é "calculado, nada adiantado"; vazio é "não calculado"** — linha
  arquivada antes da v5.23 fica vazia, nunca 0.
  - ⚠ **Fora do `mudou` do ATUALIZADO_EM, de propósito**: na 1ª rodada a coluna
    nasce vazia e recebe valor em TODAS as linhas; contar isso como "andou"
    recarimbaria a aba inteira (o defeito de 14/09). O teste falha se ela
    entrar no `mudou` — conferido com o `.gs` mutado.
- **Arquivamento**: a cópia é por nome e o `_abaArquivoProg` acrescenta a coluna
  na CONCLUIDA; a célula vazia é preenchida pelo `calc` (mesma regra). **Volta
  da CONCLUIDA** (`_desarquivar`) traz o número recalculado (`credArq`), nunca o
  do retrato antigo.
- Nada no painel nem no app. ⚠ **re-deploy manual**.

## `ATUALIZADO_EM` da PROGRAMACAO é o carimbo DA LINHA
- `atualizarSaldoNaProgramacao()` roda a **cada lançamento** e reescreve as cinco
  colunas de saída (`PRODUZIDO`/`SALDO`/`PERCENTUAL`/`STATUS`/`ATUALIZADO_EM`)
  em todas as linhas. Só que ela carimbava `agora` em TODAS elas, tivessem
  mudado ou não: medido na planilha real em 14/09/2026, as 36 linhas com
  **`11/09/2026 16:43:43`**, o mesmo segundo. A coluna virava o relógio da
  sincronização — informação que o painel já dá — no lugar de *"este lote andou
  às 16:43"*, que é para o que ela serve: sem isso não dá para ver qual lote
  parou nem desde quando.
- **A hora só muda quando a linha muda de fato**: `_progIgual` compara o que vai
  ser gravado com o que já está na célula (número com número mesmo quando a
  célula volta como texto; vazio só é igual a vazio). Linha parada mantém o
  carimbo anterior, **com o valor bruto** que estava lá — célula formatada como
  data continua data, como texto continua texto.
  - É a mesma regra que `gravarMetaDiaNaPlanilha` já seguia ("só grava quando o
    valor MUDA").
  - Coluna recém-criada ou linha sem carimbo anterior ganham a hora de agora:
    na 1ª rodada depois do re-deploy tudo é carimbado uma vez.
  - Linha que deixa de ser elegível (data futura, sem casamento no FIFO) continua
    ficando **em branco**, como antes.
- ⚠ Mudou o `.gs` (v5.3) → **re-deploy manual** no Apps Script. O histórico
  anterior não se reconstrói — a planilha nunca guardou quando cada linha andou.
- `apps-script.test.js` roda a função REAL contra uma planilha de mentira e falha
  se uma rodada sem mudança voltar a recarimbar.

## Lote concluído sai da PROGRAMACAO (arquivamento)
- Quando o lote fecha, as linhas saem da aba `PROGRAMACAO` e vão para
  **`PROGRAMACAO_CONCLUIDA`** (criada sozinha), com `PRODUZIDO`/`SALDO`/`STATUS`
  congelados + `ARQUIVADO_EM`. Roda ao fim de `sincronizarPlanilhaPosLancamento()`.
- **Por que mover e não apagar:** a `PROGRAMACAO` é a única fonte da **demanda**; a
  produção fica em `PRODUCAO_PRODUTO`, que **não tem lote** e nunca é apagada.
  `calcularProgramacao()` casa as duas por **FIFO** (produção abate o lote aberto
  mais antigo do mesmo código). Apagando a linha, a produção dela fica solta e
  passa a creditar **outro lote do mesmo código** — que aparece produzido sem ter
  produzido, e o atraso encolhe sozinho. Medido: saldo 50 → 10 e atraso 50 → 10 cx.
  Por isso `lerProgramacao(true)` (só o cálculo) continua lendo as arquivadas.
- Chaves no topo do `.gs`: `ARQ_MODO` (**em produção: `'LINHA'`** — cada item sai ao concluir; `'LOTE'` espera o lote inteiro; `'OFF'` desliga),
  `ARQ_DIAS_CARENCIA` (0 = sai ao concluir) e `ARQ_EXCLUIR_SEM_COPIA` (⚠ `true`
  apaga de vez e reintroduz o erro acima).
- **Nunca saem:** linha sem lote, linha de data futura, e lote que ainda tem
  qualquer item em andamento (no modo `LOTE`). Se o cálculo falhar/vier vazio,
  nada é apagado (falha segura).
- Linha **ENCERRADA** (v5.21) sai pelo mesmo caminho, com STATUS `ENCERRADO` e
  o PRODUZIDO recebido do FIFO; na CONCLUIDA ela pede só esse PRODUZIDO.
- **CONCLUIDO (ADIANTADO)** (v5.21) espera um dia na aba antes de sair, e linha
  da CONCLUIDA que volta a ter saldo (ou perde o X lá) **volta para a aba**
  (`_desarquivar`) — o arquivamento deixou de ser só de ida. Ver *Por que o
  lote não fechava*.
- Antes de confiar: rode **`simularArquivamento()`** no editor (só lista o que
  sairia, o que fica como ADIANTADO e o que voltaria). **`arquivarConcluidosAgora()`**
  faz a limpeza inicial de uma vez.
- ⚠ Mudou o `.gs` → **re-deploy manual** no Apps Script.

## FERIADOS — a aba `FERIADOS` (v7.174.0 / `.gs` v5.38)
- PPCP, 27/10/2026, com o PRÓXIMOS DIAS na tela: *"02/11 feriado, como
  tratar?"* → *"fazer a aba"*. O painel não conhecia feriado: 02/11 saía SEM
  LOTE DATADO e **contava 8h47 de jornada** no total (*"5 dias pedem 44h35 para
  43h55"* — quase empatado, quando nos 4 dias de verdade eram 44h35 para 35h08:
  faltavam 9h27 sem dia com folga). No `.gs`, contava como dia útil na janela
  do adiantamento (quinta 29/10 → terça 03/11 dava 3, e o crédito era
  descartado) e no aviso de cor errada.
- **Aba `FERIADOS`** (criada pelo Claude pela API em 27/10/2026 com 02/11/2026
  FINADOS): `DATA` e `DESCRICAO` (ou MOTIVO), **um dia por linha** — férias
  coletivas e parada de fábrica também. Quem mantém é o PPCP. Dia na aba = dia
  SEM JORNADA. O script não escreve nela.
- **`.gs`**: `_feriadosDaAba` (conta pura: coluna DATA pelo nome, senão a 1ª;
  descrição vazia = FERIADO; linha sem data fica fora) e `_feriadosNums` (uma
  leitura por execução, limpo no `_invalidarValores`; aba ilegível → `{}` e o
  log diz). `_diasUteisEntre(a, b, fer)` pula o feriado — **sem `fer` conta
  todo seg–sex, como antes** (o `tela-e.test.js` evala a função sozinha). Quem
  passa: `calcularProgramacao` (janela do adiantamento, nos dois filtros do
  crédito) e `_codigosProximos` (aviso de cor errada). `getProgramacaoDetalhada`
  devolve `feriados` (`{data, desc}`) — desde a **segunda desta semana**
  (`.gs` v5.43, `_segundaNum`): com a lista começando em hoje, o cartão do dia
  que já passou na semana (`_gpxPassados`) dizia SEM PRODUÇÃO no 02/11
  (FINADOS), na aba ⚖ UEP e na impressão. Todo leitor de `PROG_FERIADOS` olha
  de hoje em diante ou só esta semana: feriado passado a mais não muda conta.
- **Painel**: `PROG_FERIADOS` (`_feriadosMapa(json.feriados)`, `{}` com backend
  antigo). `_gpxCalendario(…, fer)`: o feriado ENTRA (cartão **FERIADO** com a
  descrição) mas não conta como dia útil — o horizonte anda um dia. No
  `_gpxMontar(…, uepAtr, fer)` o dia tem `fds` verdadeiro (sem jornada: fora de
  `minJorn`/`nUteis`/falta/folga, como o sábado) e `fer` com a descrição;
  estado **`feriado`** quando não tem lote (nunca `vazio`: não é "dia sem lote
  datado"); com lote, estado `fds` e selo FERIADO · HORA EXTRA. Total:
  *"02/11 feriado — fora da jornada"*, e o feriado não conta em *"N dias
  pedem"*. Hoje feriado → o resto de jornada do cartão HOJE é 0.
  - PROGRAMAÇÃO × CAPACIDADE: FERIADO · descrição, fora da capacidade (com
    lote: todo hora extra), nota própria, nunca na lista do fim de semana.
  - FILA DE CRONOANÁLISE: `_filaUteis(base, n, fer)` pula o feriado.
  - Diretoria: o retrato guarda os feriados junto com a programação
    (`_dirGuarda('fer', …)`).
- **Meta, histórico e eficiência não mudam**: dia sem produção nunca foi
  arquivado (07/09 e 12/10/2026 não têm linha no HISTORICO; os dois guardas são
  o `real <= 0` do `arquivarDiaAtual` e o `if(!dh.length)` do
  `fecharDiaAutomatico`).
- Ideia recusada: lista fixa no código — cada feriado viraria deploy +
  re-deploy. O ERP seria a fonte certa se tiver calendário fabril, mas não há
  integração.
- ⚠ Mudou o `.gs` → **re-deploy manual**. Antes dele o painel não recebe a
  lista e o feriado segue como dia útil sem lote. Testes: `programacao.test.js`
  (o `.gs` inteiro: a aba, a janela, o adiantamento atravessando o feriado, o
  aviso, a lista; conferido por mutação) e `relatorios.test.js` (o print de
  27/10, cartão, total, capacidade, FILA, diretoria).
