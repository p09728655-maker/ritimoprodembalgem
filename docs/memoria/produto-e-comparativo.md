# Produto, cadastro, cor e comparativo por modelo — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## Produto × cor (relatórios por modelo)
- **A cor mora na coluna `COR` da aba `PRODUTO_CODIGO`**, ao lado da `DESCRICAO`
  (que ficou só com o nome do produto). `lerCatalogoProdutos` acha as colunas
  **pelo nome do cabeçalho**, não pela posição — dá para inserir coluna no meio
  sem quebrar nada, desde que os títulos não mudem.
- **O agrupamento é por PRODUTO, não pelos 6 dígitos do código.** Havia código
  de 6 dígitos com produtos diferentes dentro: o `501130` tem MESA CENTRO LUNA
  670, CENTRO 590, APOIO 530 e LATERAL 440 (de 7,3 a 4,0 kg) numa linha só. E
  como o nome saía do **prefixo comum** das variantes, o relatório mostrava
  apenas **`MESA`** — o `VOL 1/1` de todas as descrições fazia o prefixo passar
  na trava de "≥2 palavras" e depois era removido do rótulo. `produtoDoCodigo()`
  é a implementação única disso (modelo + nome sem cor + cor).
- **Sem a coluna COR, a separação cai no texto** (`separaCorProduto`): tira do
  fim da descrição as palavras que são cor. O vocabulário é a lista `CORES` no
  topo do `.gs` **mais** o que o catálogo ensina — palavra que **fecha** a
  descrição em ≥4 modelos diferentes. Só a última palavra: andar mais para a
  esquerda fazia o `CM` de "RACK BRITO 137 CM MARSALA" virar cor.
  - ⚠ `MEL` fica **fora** da lista de propósito: aqui é nome de produto
    (PENTEADEIRA CAMARIM MEL, ao lado da ELOA e da STRASS).
  - Nunca devolve nome vazio, e medida (`670`, `1.8`) nunca vira cor.
- **`simularSeparacaoPorProduto()`** (rodar no editor, não grava): lista os
  modelos que passam a mostrar mais de um produto, as cores distintas com a
  contagem, e aponta **cor escrita pela metade** — `BCO/AZUL` → `BRANCO/AZUL`,
  `PTO AC` → `PRETO ACETINADO` (`coresParaCorrigir`, conta pura e testada).
  - A comparação é **palavra por palavra**, não da cor inteira: palavra é
    abreviação de outra quando suas letras cabem, na ordem, dentro dela (`PTO`
    cabe em `PRETO`), começam com a mesma letra e a outra aparece em mais
    linhas. Comparando a cor inteira, `PTO AC` escapava (4 linhas, logo não era
    "rara") e `PRETO AC/NATURE` também, porque `PRETO ACETINADO/NATURE` nem
    existe no catálogo para servir de alvo.
  O **resumo sai por último** de propósito: o painel do editor abre no fim do
  log, e era lá em cima que estava a informação que interessa.
  - Medido no catálogo real (18/08/2026): 428 códigos, **100% com cor pela
    coluna** `COR`, nenhum nome de uma palavra só, 62 cores distintas — e é a
    lista de parecidas que separa cor de verdade de erro de digitação.
- No painel: `calcPorModelo` agrupa por **modelo + nome** e junta as cores numa
  linha só (a coluna **COR** mostra quais rodaram); o comparativo do período tem
  o nível **MODELO + COR** no seletor AGRUPAR. `_phAgrup()` é a regra única de
  agrupamento — antes estava copiada na tela e no PDF do período.
- A coluna COR **some quando nenhum item tem cor** (backend antigo), mesma regra
  da coluna MOTIVO do relatório de paradas.
- ⚠ Mudou o `.gs` → **re-deploy manual** no Apps Script. `node produto-cor.test.js`
  cobre a regra, rodando contra o código real dos dois arquivos.

## A COR também tem que aparecer no APP (seletor de produto)
- Quando a cor saiu da `DESCRICAO` para a coluna `COR`, **o app do operador ficou
  para trás**: o seletor imprimia só a descrição, e o lote 25076 abria **quatro
  linhas idênticas** — "VOL 1/2 PENTEADEIRA CAMARIM MEL" quatro vezes, mudando
  só o código, sem o operador ter como saber em qual tocar.
- **`nomeComCor(desc, cor)` mora no `rp-core.js`**, uma implementação só para os
  dois painéis. Descrição que **já termina com a cor** (linha antiga, de antes da
  coluna) não ganha a cor duas vezes; sem cor cadastrada o nome sai como sempre
  saiu. `rp-core.test.js` cobre.
- **No mobile a cor é ETIQUETA, na linha do CÓDIGO** (`.prod-search-cor`), não no
  fim da frase: pendurada no fim de um nome comprido ela caía sozinha numa
  terceira linha e engordava o item — e a lista tem **altura fixa** de propósito
  (o teclado numérico abaixo não pode subir e descer conforme o nº de
  resultados). Vale nas três listas: PRODUTOS DE HOJE, busca por LOTE e busca no
  catálogo.
  - `corDeProduto()` cai no **catálogo** quando o item não traz cor — a lista de
    hoje só passou a mandá-la no `.gs` re-deployado, e sem essa queda o operador
    ficaria sem cor justamente na lista que mais usa.
  - **Descrição repetida e sem cor cadastrada** mostra *"sem cor cadastrada"* em
    vez de deixar duas linhas iguais sem explicação. Linha única sem cor sai
    limpa — o aviso não pode virar enfeite em todo item da tela.
  - A **busca também olha a cor**: com ela fora da descrição, digitar `CUMARU`
    não acharia mais nada.
  - A folha do modal (`.modal-sheet`) vai a **560px** (620px no tablet): presa em
    420px sobrava faixa preta dos dois lados e a linha do código quebrava por
    falta de largura onde havia espaço.
- **A barra do produto atual, o toast do bipe e o produto do gerencial** usam o
  mesmo `nomeComCor`. No desktop: a tela de **PROGRAMAÇÃO** e o produto atual do
  turno (gerencial + **Tela B** da TV) — "PENTEADEIRA CAMARIM MEL" na TV não diz
  qual das quatro cores está rodando.
- Backend: `getProgramacaoHoje` e `getProgramacaoDetalhada` mandam **`cor`** por
  item e `getPontosDia` manda **`produtoAtualCor`** (todos por `produtoDoCodigo`,
  que já é a regra única — coluna `COR` manda, texto é rede). ⚠ Mudou o `.gs` →
  **re-deploy manual**; até lá o app se vira com a cor do catálogo.
- `produto-cor.test.js` roda o **código real do mobile** (etiqueta, queda para o
  catálogo, aviso de repetida) e o `getProgramacaoHoje` de verdade — e falha se
  alguma lista voltar a imprimir a descrição sozinha.

## Comparativo por modelo — média aparada e teto da esteira
- **MÉD.PERÍODO / MÉD-DIA são APARADAS** (`_phMediaAparada`): com 3+ dias, o
  melhor e o pior dia do próprio grupo saem da média — um pico de rodada
  dedicada ou um apontamento capenga não podem definir o padrão do modelo
  (pedido do PPCP em 18/08/2026: VIVARE marcava 87 por um dia de 59 e rodava
  122; MADERO prometia 164 inflada pelo pico de 187 e o padrão honesto é 148).
  - A poda é pelo **ritmo do dia**, e a média do que sobra continua
    **ponderada** (Σcx ÷ Σh) — média simples de ritmos distorce quando as horas
    variam. O **TOTAL nunca é aparado**; célula vazia não conta como "pior dia".
- **% TETO EST.** = quanto do teto físico da esteira o modelo usa. Teto por
  código: `velocidade (m/min) × 60.000 ÷ (medida da caixa + entre-peças, mm)` —
  `_tetoEsteiraCxH` no `.gs`; `getProducaoModeloPeriodo` manda `tetoCxH` por
  item. É a régua que compara justo caixa grande com caixa pequena (medido:
  a operação roda a 22–68% do teto ⇒ **a esteira não é o gargalo**).
  - **Mix de caixas = média HARMÔNICA ponderada pelas caixas** (o tempo de
    esteira soma), nunca aritmética — ela superestimaria o teto. Caixa sem
    teto (código fora do catálogo) fica fora do par `cxTeto/hTeto` para não
    diluir o %.
  - A coluna só existe na métrica MÉDIA CX/H e **some quando o backend não
    manda teto** (re-deploy pendente ou catálogo sem MEDIDA/VELOCIDADE) —
    mesma regra da coluna COR. Sem re-deploy, o painel novo mostra tudo igual
    a antes, só com a média aparada.
  - ⚠ O cabeçalho real da planilha é **`ENTRE_PECAS (mm)`** — a leitura busca
    por prefixo (`indexOf('ENTRE_PECA') === 0`); o `indexOf` exato devolvia -1
    e o campo chegava **0 em silêncio** (teto ~25% otimista).
- **A cor da MÉD.PERÍODO não pode contradizer o ▼** (`_phCorRitmo`, regra única
  e testada). **Verde exige as DUAS coisas**: aproveitamento ≥90% do próprio
  melhor **E** estar no ritmo da linha. Antes só olhava a regularidade, e um
  modelo constante porém lento saía **verde com o ▼ do lado** — "tudo certo" e
  "abaixo do ideal" na mesma célula. Abaixo da linha o teto da cor é **âmbar**:
  ali o problema não é a variação, é o próprio padrão do produto.
  - **1 dia rodado não julga**: a média É o melhor dia por definição, então o
    aproveitamento dá 100% sem comparar nada — a célula fica **branca** (sem
    base), nunca verde. Era o caso de metade das linhas do comparativo.
  - O `title` da célula diz em palavras por que a cor é aquela; a legenda do
    rodapé acompanha. Sem takt configurado (`alvoRit` 0) volta a valer só a
    regularidade — não há linha com que comparar.
- **O teto EXIBIDO é operacional: desconta 30 min/dia de troca de produto**
  (pedido do PPCP, 19/08/2026 — "100% sem descontar a troca obrigatória não é
  régua alcançável"). `_phTetoOper(teto, horas, n, minTroca)`:
  `teto × (min − minTroca) ÷ min`.
  - **A RÉGUA É MEDIDA quando dá** (`_phMinDia`, pedido do PPCP em 20/08/2026:
    *"pode fazer pela conta feita, fica mais real"*): os minutos de troca de
    **cada dia** são as **paradas de esteira daquele dia** (contadas no log) ×
    a **duração média das paradas de TROCA/SETUP apontadas** (`_phTrocaObs`,
    30 dias). Foi o próprio painel que mostrou por que: **7,1 paradas/dia ×
    7,3 min = ~52 min/dia**, contra os 30 da premissa — e as 125 paradas
    apontadas dão a amostra.
  - **A PREMISSA virou a rede**: `TROCA_PREMISSA={minDia:30, trocasDia:6,
    min:5}` no v7 (e `TROCA_PREM_*` no `.gs`, com `produto-cor.test.js` falhando
    se as duas divergirem) vale quando **não há o que medir** — dia sem parada
    de troca apontada, amostra < 3, backend antigo. Tela, PDF e log do editor
    **dizem qual das duas está valendo** (`_phTrocaFonte`); trocar o combinado
    continua sendo mexer num lugar só.
  - **O rateio é pelo tempo de esteira** (`_phMinTrocaGrupo` / `_phMinTrocaDia`):
    os 30 min são da LINHA, e cada produto paga a fatia proporcional às horas
    que ocupou no dia. Isso dá o **mesmo percentual para todos** — num dia de
    9 h, 30 min são 5,6% do teto tanto para quem rodou 1 h quanto para quem
    rodou 8. Arredondar a fatia fazia quem rodou 1 h pagar 0,1% a mais: o
    arredondamento é **só na exibição**. Sem `horasLista` (re-deploy pendente)
    cai em **5 min por dia rodado**, a régua conservadora.
  - **No PERÍODO o desconto é UM fator só para o quadro inteiro**
    (`_phFatorTrocaPeriodo`: Σ minutos de troca de cada dia ÷ Σ minutos que a
    linha rodou, nos dias em tela) — pedido do PPCP, 24/08/2026: *"o teto
    deveria ser igual para todas as cores"*. Antes cada linha pagava só o mix
    dos dias em que ELA rodou (`_phMinTrocaGrupo` direto no teto): cores do
    mesmo produto saíam com tetos **diferentes** (309–318/h no mesmo quadro da
    MADERO) e parecia erro de conta. Cores do mesmo produto agora mostram o
    MESMO teto; teto diferente entre modelos vem da caixa (medida), não da
    troca. `_phMinTrocaGrupo` continua existindo como **régua de queda** (sem
    `horasLista`) e informação. O `simularEsteiraPorModelo` do `.gs` aplica o
    mesmo fator (função de editor: basta colar o arquivo salvo, sem re-deploy
    do app). `relatorios.test.js` prende tela e PDF na régua única.
  - **O TOTAL DO DIA herda a régua única do comparativo** (`PH_FATOR_TROCA`,
    publicado pelo `renderModeloPeriodo` — que redesenha a tabela do dia quando
    o fator muda; pedido do PPCP, 24/08/2026: o mesmo produto lia **318/h no
    período e 307/h no dia**, porque o dia descontava a troca DE HOJE sobre as
    horas parciais DE HOJE, uma régua que flutua ao longo do dia). Enquanto o
    período não carregou, o dia usa a régua própria (comportamento antigo) — o
    tooltip diz qual das duas está valendo. Se ainda assim o número diferir, é
    o FÍSICO do mix (códigos de hoje ≠ códigos do período), não a troca.
    `produto-cor.test.js` cobre a herança no `calcPorModelo` real.
  - **Filtro MÉDIA na barra (`#ph-media`): APARADA × COMPLETA** (pedido do
    PPCP, 24/08/2026: *"deixar um filtro para eu manipular deixar o maior e o
    menor"*). `_phMediaAparada` ganhou o 3º parâmetro `modo` (omitido =
    aparada, chamador antigo não muda de conta); `_phMediaModo()` lê o select
    — tela E PDF do período leem o MESMO, então nunca contam diferente.
    COMPLETA desliga a poda do melhor/pior dia; cabeçalho, legenda e o resumo
    do PDF dizem qual modo valeu. `relatorios.test.js` cobre o modo e prende
    os dois chamadores no filtro.
  - **O que é MEDIDO virou informação, não entrada da conta.** Continuam sendo
    calculados e mostrados na nota impressa e no log do editor, para conferir a
    premissa: **preparações**, **paradas de esteira** (`_phTrocasLinha` —
    entradas na mesma hora contam uma, que os dois lados da esteira mudam
    juntos) e a **duração média das paradas de TROCA/SETUP apontadas**
    (`_phTrocaObs`, 30 dias, média aparada, sem as abertas e sem as acima de
    4 h). Se isso descolar dos 30 min/dia, é hora de rever a premissa — a nota
    impressa diz essa frase.
  - **As preparações são contadas na ORDEM DAS LINHAS do log** (`_prepDoDia` no
    `.gs`; PPCP, 20/08/2026: *"aponta sim dois produtos na mesma hora"*). Cada
    bipe é uma linha e a `PRODUCAO_PRODUTO` é **append-only**, então a ordem das
    linhas é a ordem dos fatos e a leitura enxerga troca **dentro da mesma
    hora** — coisa que a contagem por hora (`_phEntradasDia`) não via.
    - **Bloco de linhas seguidas do mesmo produto = 1 preparação.** `A,A,B,B`
      numa hora são duas.
    - ⚠ **Alternância (`A,B,A,B`) NÃO é troca.** Ninguém troca de produto a
      cada 20 caixas: é a esteira de dois lados rodando dois produtos **ao mesmo
      tempo**. Nessa hora vale o nº de produtos DISTINTOS, e a hora sai marcada
      como paralela (a nota impressa avisa).
    - O primeiro bloco da hora não conta quando é **continuação** da hora
      anterior — senão todo produto ganharia uma preparação por hora rodada.
    - `getProducaoModeloPeriodo` devolve **`prepDias`** e `getPontosDia` devolve
      **`preparacoes`/`prepParalelo`**. Sem re-deploy, `_phPrepInfo` cai na
      estimativa por hora e o relatório **diz que é estimativa** — o número só
      erra para menos, nunca para mais.
  - **A EXPLICAÇÃO VAI IMPRESSA** (`_phNotaTrocaHtml`): o bloco **COMO A TROCA
    ENTROU NA CONTA** sai no PDF do **dia** e do **período** — a premissa, o
    rateio, a fórmula, o "para conferir" e **o que a leitura não enxerga**
    (troca de cor e de produto custam igual; em qual posto a parada aconteceu;
    caixa lançada sem produto). Quem lê o PDF numa reunião não tem tooltip nem
    código à mão, e o % do teto encolheu — o papel tem que dizer por quê. **Uma
    implementação só** para os dois relatórios (o `relatorios.test.js` falha se
    virar duas).
  - **Cada CÓDIGO da programação é uma preparação.** Conferido com o PPCP em
    20/08/2026: 5 lotes, **12 códigos**, 1.150 cx → 12 preparações; entrando
    dois a dois, **6 paradas de esteira**. É por isso que a contagem agrupa por
    **modelo · produto · cor** e não só pelo modelo — o lote 025093 sozinho tem
    4 cores de ESCRIVANINHA MALTA.
  - Os **guardas continuam no teto FÍSICO** (`l.teto`): ganho demonstrado,
    cascata do produto e o check de "dia impossível" do
    `simularEsteiraPorModelo` — a troca não muda o que fisicamente não cabe na
    esteira. O simulador do editor aplica a mesma régua e loga a premissa em uso
    ao lado do que o apontamento mostra.
  - ⚠ **Letra de impressão**: em 20/08/2026 o PPCP reclamou que o PDF estava
    ilegível. Corpo de tabela foi para **12px** (10,5px no comparativo, que é
    paisagem e tem uma coluna por dia), cabeçalho e título de seção para 9,5px,
    subtítulo de coluna de 6,5 para 8px e a nota da troca para 10,5px. **Não
    voltar a encolher** para caber mais coluna — se não couber, o corte é no
    período, não na fonte.
  - ⚠ A contagem (informativa) exige o `.gs` re-deployado — o item do
    `getProducaoModeloPeriodo` leva **`horasLista`**, os rótulos das horas.
  - ⚠ Bugs corrigidos no `simularEsteiraPorModelo`, os dois pela mesma causa: o
    log vem por **data × produto × cor** e a função tratava cada linha como um
    dia. A coluna `dias` contava lançamento **e a média aparada podava cor em
    vez de dia** — daí o log sair com `1 dia` ao lado de um "melhor dia"
    diferente da média (visto no MESA CABECEIRA SLEEP). Agora agrega por data
    antes de tudo, como o painel faz na célula do comparativo, e as horas do dia
    são as **distintas**.
- **A régua e as linhas do período moram em `_phReguaPeriodo` e
  `_phLinhasPeriodo`, uma implementação só** (15/09/2026). Antes a TELA
  (`renderModeloPeriodo`) e o PDF (`gerarRelatorioProducaoHora`) montavam o
  MESMO quadro com o mesmo código escrito duas vezes, e o teste prendia **uma**
  das ~20 linhas (o `tetoShow:`) — as outras dezenove podiam divergir sozinhas.
  - A única diferença entre as cópias era o campo `aparada`, que só a tela lia.
    Ele sai para os dois: um campo a mais é mais barato que duas construções
    que precisam concordar.
  - `obsT` entra por **parâmetro** na régua porque a tela, quando ele ainda não
    chegou, dispara o carregamento e **se redesenha**; o PDF não se redesenha e
    por isso mede antes de montar.
  - ⚠ O `ctx` de `_phLinhasPeriodo` é lido com `ctx.x`, não com parâmetro
    desestruturado: o `pega()` do `relatorios.test.js` conta chaves depois do
    `)` dos parâmetros e `function f({a,b})` quebra a extração.
  - O teste **roda a função** (não conta cópias): confere `v1`, `v2`, `nd`, o
    teto físico, o `tetoShow` igual para as duas linhas, a queda para a fatia
    por linha sem fator, e a métrica aditiva.
- Tela e PDF usam as MESMAS contas (linhas com `v1/v2/teto` calculados uma vez);
  `relatorios.test.js` cobre a aparada e o teto harmônico.
- **SIMULADOR DA ESTEIRA** (campos ESTEIRA na barra da aba PRODUÇÃO/HORA):
  mudar velocidade/entre-peças recalcula o teto na tela e no PDF **sem gravar
  nada** — a coluna vira **% TETO SIM.** em âmbar, a legenda e o PDF ganham o
  aviso de SIMULAÇÃO com os valores reais ao lado, e o ↺ volta à base.
  - A conta é exata sem nova chamada: o teto harmônico do mix equivale a
    `vel × 60.000 ÷ (medida média + vão)`, então o backend manda `mixMm`
    (medida média ponderada pelas caixas) por item e `esteira:{vel,entre}`
    (base da planilha) no `getProducaoModeloPeriodo`. Sem a base (backend
    antigo) os campos ficam **desabilitados** — nunca simula em cima de chute.
  - GANHO DEMONSTRADO e cascata continuam no teto REAL: simulação não muda o
    que a equipe já provou.
  - No editor: `simularEsteiraPorModelo(30, 17, 250)` roda a mesma simulação
    no log ("e se a esteira rodasse a 17 m/min com 250 mm?").
  - ⚠ Exige o `.gs` re-deployado (mixMm + esteira no payload).
- **O % TETO EST. também está na visão do DIA** (PRODUÇÃO POR MODELO — TOTAL DO
  DIA e o RELATÓRIO DO DIA em PDF): `getPontosDia` manda `tetoCxH` por item de
  `porHoraModelo` e `calcPorModelo` agrega com a MESMA harmônica. `temTeto`
  segue a regra do `temCor`: backend antigo → a coluna some.
- **`simularEsteiraPorModelo(dias)`** (rodar no editor, não grava, **não precisa
  de re-deploy** — função de editor roda com o arquivo salvo): imprime no log a
  mesma leitura em formato de relatório — aparada, melhor dia, teto e % do teto
  por produto (padrão 30 dias), mais os alertas de apontamento: dia **<30% do
  padrão do próprio modelo** (o 1 cx/h da DECOR 470) e dia **ACIMA do teto
  físico** (318 cx/h com teto 300 — impossível, lançamento errado). Dia
  impossível **não entra** no veredito "melhor dia já chegou a X%" — senão um
  lançamento dobrado diria que a esteira está no limite. Um dia fraco de
  verdade (59 da VIVARE contra padrão 122) NÃO é acusado. Resumo por último.
  A média aparada daqui segue a MESMA regra do `_phMediaAparada` do painel —
  `produto-cor.test.js` roda a função real contra um log de mentira e falha se
  divergirem.
- **Quando o comparativo não vem: TIMEOUT não é backend velho.** A aba mostrava
  sempre a mesma frase — *"precisa da atualização do backend — getProducaoModeloPeriodo"* —
  para QUALQUER falha da busca do período. Em 26/08/2026 ela apareceu com o
  `.gs` novo já publicado (a tabela do dia estava com **% TETO EST.** e com as
  preparações, campos que só o backend novo manda, e os campos ESTEIRA da barra
  estavam habilitados, o que só acontece depois de uma resposta boa DESSA mesma
  chamada): o gestor foi mandado mexer no Apps Script à toa.
  - `getProducaoModeloPeriodo` é a leitura mais **cara** do painel — o backend lê
    a `PRODUCAO_PRODUTO` inteira e o catálogo antes de filtrar o período —, e era
    a única chamada pesada **sem retry**. Agora são **3 tentativas em sequência**
    com espera crescente (nunca em paralelo: o Apps Script atende uma execução
    por vez), como o `lerSheetsComRetry` e o `_fetchParadasRetry`, e a tela diz
    qual tentativa está rolando.
  - `PH_FALHA` guarda **por que** falhou e `_phFalhaInfo()` é o texto único da
    tela e do alerta do PDF: **`sem-resposta`** (timeout/cold start → "tente de
    novo ou encurte o período", com botão ↻), **`sem-endpoint`** (respondeu e não
    conhece a ação — o `.gs` antigo cai no `getDados()` do dispatcher: **este** é
    o caso de re-deploy) e **`erro`** (mostra a mensagem do backend, escapada).
  - `PH_BACKEND_OK` marca que o endpoint já respondeu **nesta sessão**: com ela
    de pé o painel nunca mais acusa re-deploy — a função existe lá, provado.
  - `relatorios.test.js` cobre os quatro casos e falha se a frase do re-deploy
    voltar a ser escrita fora do `_phFalhaInfo` ou se a busca perder o retry.
  - Com a janela mais longa (3 × 25s), chamadas para o **mesmo período**
    compartilham a mesma requisição (`_phVoo`): trocar a métrica no meio da
    busca, tocar ↻ duas vezes ou pedir o PDF enquanto a tela carrega não
    dispara uma segunda leitura — ela só se enfileiraria no Apps Script,
    atrasando a primeira.

- **MÉTRICAS EM UEP no comparativo** (v7.176.0, PPCP 27/10/2026: *"acrescentar
  a métrica em UEP"*). `uepH` (UEP ÷ horas, taxa) e `uep` (caixas × UEP/cx,
  aditiva) no `#ph-metrica`. O acumulador (`_phAcc`/`_phAdd`) leva `uep`,
  `cxUep` e `hUep` — só item COM UEP no `PH_UEP_PROD` (cadastro de hoje, a mesma
  da coluna UEP/CX); `_phTem` decide se a célula tem valor (nas de UEP,
  `cxUep>0`) e vale na média aparada e no `nd`. `_phSoComUep` (tela e PDF):
  linha e dia sem UEP saem, as caixas viram *"N cx sem UEP, fora"* — nunca 0.
  - Régua do UEP/H: `_phRitmoMetaUep()` = META UEP ÷ `UEP_MIN_DIA` × 60 (~288),
    a do card UEP DO DIA; `_phCorRitmo(…, meta)` só troca o texto da nota.
    Teto da esteira e simulador continuam só no cx/h.
  - ⚠ O `PH_UEP_PROD` (e o `PREP_PERIODO`) são de quem leu por último: o
    `_phCache` guarda os dois do período (`uepProd`, `prep`) e o
    `_phPeriodoVolta()` os devolve no acerto do cache **e depois de todo await**
    da tela e do 🖨 (v7.248.2). Antes, a leitura da carteira (aba PLANO, outro
    período) que terminava durante a espera do histórico (tela) ou das paradas
    de troca (🖨) deixava a coluna UEP/CX, o 🖨 em UEP e a nota da troca com o
    mix de outro período — e "sem UEP" no produto que não rodou lá. O "guarda e
    devolve" de quem lê outro período (carteira, diretoria, `_cxuPtsLer`)
    continua, mas sozinho não basta: se esta aba leu no meio, ele devolve o
    valor de antes dela. O `relatorios.test.js` prende a ordem (nenhum uso
    depois de um await sem o `_phPeriodoVolta()`) e roda a carteira terminando
    no meio (5 de 5 mutações). Achado na estreia do `/revisor-codigo`.
  - Sem o mapa (backend antes da v5.14) a tela e o PDF dizem que a leitura não
    trouxe a UEP. Mesma limitação do cx/h: hora dividida conta para os dois.

## Cascata + cobertura + ganho demonstrado (relatórios de produção)
- **A SWOT saiu dos relatórios de produção** (pedido do PPCP, 18/08/2026 — "tira
  swot e faz cascata"); a de PARADAS continua, que lá é nativa. No lugar, três
  leituras, nos PDFs do DIA e do PERÍODO:
- **A CASCATA É UMA ESTEIRA DE ETAPAS, lida em segundos** (pedido do PPCP,
  20/08/2026). `_rpCascataHtml` desenha quatro passos na horizontal —
  **META − IMPACTO DE PARADAS − GAP DE RITMO = REALIZADO** —, cada um com
  título curto, número grande, unidade e uma linha de explicação; o REALIZADO
  fica em destaque (borda e fundo verdes, número maior). Abaixo vem a **fórmula
  escrita** (`1.150 − 48 − 674 = 428 cx`), a barra, o contexto do ritmo e os
  motivos de parada. **As contas não mudaram** — só a apresentação.
  - ⚠ **"PERDIDO NO RITMO" e "PERDIDO PARADO" saíram do vocabulário**: davam a
    entender que as caixas foram *fisicamente perdidas*. São **GAP DE RITMO**
    ("diferença estimada entre o ritmo necessário e o ritmo realizado") e
    **IMPACTO DE PARADAS** ("produção estimada impactada pelo tempo de parada").
    O `relatorios.test.js` falha se a palavra voltar ao que é impresso.
  - **A barra é só `realizado ÷ meta`.** Antes empilhava paradas e ritmo em
    faixas listradas, e o restante parecia perda — a composição já está nas
    etapas, repetir ali confundia. O rótulo diz de que é o percentual
    (`37,2% DA META`).
  - **A linha de contexto do ritmo** (`RITMO ATUAL · RITMO NECESSÁRIO ·
    ATENDIMENTO DO RITMO`) sai do `calcKPIs` que o relatório do dia já
    calculava (`ritmo` e `metaH`) — **não é indicador novo**, é dado que existia
    e não aparecia. No relatório do PERÍODO ela não sai: não há hora produtiva
    do intervalo, e inventar uma seria pior que omitir.
  - Os **motivos de parada** mostram os 3 maiores NÃO planejados com o tempo de
    cada um; um motivo só raramente conta a história.
  - Dia **acima** do ritmo da meta vira **GANHO DE RITMO** (verde, `+`), e a
    fórmula soma — nunca inventa perda. Com **modelo filtrado** são três etapas
    (POTENCIAL PRÓPRIO − GAP DE RITMO = REALIZADO), pela mesma função.
- **CASCATA — onde ficaram as caixas** (`_relCascata`, conta pura +
  `relatorios.test.js`): `META − perdido PARADO − perdido no RITMO = REALIZADO`.
  O "parado" é o `pecas` do `RP_PARADAS` (a MESMA conta da aba PARADAS, buscada
  na hora via `getParadasPeriodo`/`getParadas`); o resto da diferença é ritmo
  (o rótulo avisa que inclui microparadas não registradas). Realizado acima do
  ritmo da meta vira **GANHO de ritmo**, nunca perda inventada; sem meta não há
  cascata (null); falhou a busca de paradas → o relatório sai SEM a seção.
  Dia com produção mas **sem meta fica fora** da cascata, contado na nota.
  A barra usa a linguagem da Tela D (verde/âmbar/vermelho + marca da META).
- **COBERTURA DO APONTAMENTO**: a análise por modelo só vê caixa lançada COM
  produto (opcional no app). A nota diz quanto do realizado ela cobre —
  abaixo de 80% ganha ⚠ e a palavra AMOSTRA. Sem isso, análise sobre 60% das
  caixas passa por análise do todo.
- **GANHO JÁ DEMONSTRADO** (período): se cada modelo com 2+ dias repetisse o
  próprio MELHOR DIA nas horas que rodou, +X cx. É o alvo acionável — o % do
  teto da esteira é régua de comparação, não meta. O melhor dia é **limitado ao
  teto físico** para lançamento acumulado (318 cx/h com teto 300) não virar alvo.
- **Com um MODELO filtrado a cascata TROCA DE ÂNCORA** (`_relCascataProduto`):
  meta e paradas são da **linha inteira** e não se atribuem a um produto, então
  a régua passa a ser o **POTENCIAL DELE MESMO** — o melhor dia de cada COR nas
  horas que ela rodou (limitado ao teto físico, para lançamento acumulado não
  virar alvo). `POTENCIAL − perdido no RITMO = REALIZADO`, e o rodapé explica
  por que a meta não aparece ali. O potencial nunca fica abaixo do próprio
  realizado (cor de um dia só → perda 0, nada inventado).
  - **Cobertura e ganho demonstrado continuam fora** com filtro: os dois
    comparam com o realizado da LINHA.
  - ⚠ **"melhor cor" só sai quando as linhas SÃO cores.** `_relCascataProduto`
    recebe o `ehCor` do `_phAgrup`: agrupado por **MODELO**, a linha é o próprio
    produto, e o relatório chegou a imprimir *"melhor cor: BANQUETA VERSATIL"* —
    o nome do produto. Com uma linha só também não há "melhor" entre uma. E o
    rótulo mostra **só a cor** (último trecho do label), não o código e o nome.
- **O seletor filtra por PRODUTO, o agrupamento é que abre por cor**
  (`keyFil`/`labelFil` no `_phAgrup`): no nível MODELO + COR, escolher
  `501149 MADERO` traz **todas as cores dele**, cada uma na sua linha. Como a
  chave do filtro é a mesma nos dois níveis, a seleção **sobrevive** à troca
  MODELO ↔ MODELO + COR. Na FAMÍLIA, filtro = agrupamento.
- ⚠ **Hora parcial e lançamento acumulado distorcem o ritmo/h, não o total**:
  a PRINCESA rodando 16:15–16:50 vira "40 cx/h" (35 min contam como 1 h) e o
  318 da DECOR 470 é lançamento de várias horas numa só. Nada disso se apaga da
  `PRODUCAO_PRODUTO` — a média aparada descarta, o veredito ignora o impossível,
  e o combinado operacional é lançar hora a hora.

## PONTOS: a tabela é do ERP, e o passado fica congelado (`.gs` v5.40)
- PPCP, 29/10/2026: *"preciso atualizar pontos na coluna I"*, com o
  `PONTOS_ATUALIZADO.xlsx` (CODIGO, DESCRICAO, M³, PESO BRUTO, **CUSTO REP**,
  PRECO COMPRA — não tem coluna chamada PONTOS) → *"está na coluna E cust
  rep"* → *"4 casas, congelar o passado"*. **PONTOS = CUSTO REP do ERP**, com
  4 casas, gravado pela API casando pelo código só com dígitos (417 de 429
  códigos; os 12 fora do arquivo ficaram). O 1º lançamento de 03/07 já tinha
  pontos com 4 casas — o cadastro foi arredondado para inteiro depois.
- **Efeito medido** na produção de 29/09–28/10: **+4,6%** de pontos
  (191.609 → 200.424 por dia); 37 códigos sobem mais de 10%. Os pontos do
  cadastro antigo são um CUSTO REP de outra data.
- **Congelar o passado**: o `getPontosDia` e o `getProducaoModeloPeriodo` (pontos
  e `pontosHe`) somam a coluna PONTOS da `PRODUCAO_PRODUTO` (`_ptsDoLog`), que o
  `registrarProducaoProduto` grava como caixas × cadastro **da hora**. Antes eles
  recalculavam com o cadastro de AGORA, e trocar a tabela mudava todo o
  passado. Célula vazia → cadastro de agora; **zero é valor**.
  - A **programação** (carteira, PROGRAMAÇÃO × CAPACIDADE, diretoria) continua
    `qtde × cadastro` — é futuro, vale a tabela nova. O ATRASO em pontos
    (v7.249.0) também: caixas vencidas × cadastro de hoje.
  - O `trocarProdutoLancamento` regrava o PONTOS da linha com o cadastro de
    agora (é o produto certo daquela linha) — continua igual.
  - ⚠ Erro de cadastro também fica congelado: a BANQUETA VERSATIL CINAMOMO
    estava com 118 (as outras cores 49) e os 259 cx lançados assim seguem com
    118. Corrigir o passado é editar a coluna PONTOS das linhas do log.
- ⚠ A **META DE PONTOS / DIA** (diálogo da capacidade, só no computador) não
  acompanha a tabela sozinha: subiu a tabela, revisar a meta.
- ⚠ **Gravar número pela API em célula pt-BR**: mandar o valor como NÚMERO
  (JSON), nunca texto `"170.578"` — com USER_ENTERED, texto com ponto vira
  milhar. O catálogo lê PONTOS com `Number()`.
- ⚠ O arquivo tem 65 códigos 501 que não existem na `PRODUTO_CODIGO`: se forem
  produzidos, entram com 0 ponto.
