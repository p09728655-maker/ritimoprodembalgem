# Lançamento e correção no app — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## Lançamento na hora RECÉM-FECHADA (tolerância, mobile)
- **A hora que acabou de fechar continua aceitando lançamento por 15 min**
  (`LANC_TOLERANCIA_MIN` / `slotLancavel()` no `ritmoprod_mobile.html`; teste em
  `lancamento.test.js`). Caso real (28/08/2026): o slot pós-almoço
  **`12:12-13:00`** — o mais curto do turno, 48 min — fechou em **0 cx**. O
  operador foi lançar depois das 13:00, a hora já estava bloqueada (a regra era
  "só a hora atual aceita lançamento") e as caixas entraram na hora seguinte:
  no gerencial, PIOR HORA 0, VALE DE PRODUÇÃO 12:12 e o 13:00-14:00 inflado.
- Na lista do operador a hora em tolerância fica **clicável**, com o badge
  `AINDA ACEITA` (quando está sem valor) e a linha *"aceita lançamento até
  HH:MM"*. Ela **não** ganha o destaque de linha `andamento` — esse é só da
  hora corrente, senão duas linhas acesas confundiriam qual é a hora de agora.
- **O que continua como era:** hora mais antiga fica bloqueada para LANÇAR
  (somar caixa no passado é na planilha, coluna de LOTE da linha — o `getDados`
  soma sozinho). **EXCLUIR** um lançamento errado vale para qualquer hora de
  hoje desde a v1.34.0 — ver *Excluir lançamento pelo app*;
  o **bipe** (`abrirLancSlotAtivo`) segue abrindo só a hora corrente — a
  tolerância é para o toque consciente na linha, não para atribuição
  automática, que erraria justamente na virada da hora.
- Fim de turno: a última hora (16:00-16:59) fica lançável até ~17:14, ou seja, a
  janela **cruza o fechamento automático das 17:05** (o `fecharDiaAutomatico`
  do PAINEL, que grava `FECHADO=true` no `HISTORICO` — e o `arquivarDiaAtual`
  do dia seguinte **não sobrescreve dia fechado**). Lançamento DEPOIS do
  fechamento fica na `HORA_A_HORA` mas fora do retrato do `HISTORICO` — a MESMA
  situação de uma HE lançada depois das 17:05, que já existia. Saída igual à da
  HE: **FECHAR DIA de novo** (o `saveDay` é upsert por data e, desde o `.gs`
  v5.29, relê a produção da planilha). O que entrou ANTES do fechamento já vai
  na linha — ver *O que é gravado no HISTORICO*.
  - **Desde o `.gs` v5.49 o lançamento depois do fechamento ATUALIZA a linha
    do dia** (`_atualizarHistoricoPosLancamento`, sob o lock do
    `saveRealizado`): REALIZADO, EF, MELHOR/PIOR, HE, MEDIA, HE CX e UEP pela
    `HORA_A_HORA`. META, FECHADO e FECHADO EM ficam; nunca reduz o gravado (HE
    só no navegador não some). O FECHAR DIA de novo deixou de ser necessário.
- Nada no `.gs`: a regra é só de tela (o `saveRealizado` sempre aceitou
  qualquer slot existente da `HORA_A_HORA`).
- **MADRUGADA (mobile 1.38.0, 27/10/2026)** — PPCP: *"dar entrada quando o
  operador do app não entra às 5:00"*. Hora que **termina até 07:00**
  (`LANC_MADRUGADA_FIM` = o `HE_JORNADA_INI_MIN` do `.gs`; o teste confere)
  aceita lançamento **o resto do dia** — `slotLancavel` devolve `madrugada`. A
  hora da jornada continua com a regra de sempre. Só aparece com a C3 em 5
  (botão **COMEÇOU ÀS 05:00?** do próprio app).
  - O produto do app é o de AGORA: na hora da madrugada o `salvarLanc` pergunta
    **PRODUTO DA MADRUGADA** antes (TROCAR PRODUTO em destaque, abre o seletor
    por cima, a quantidade fica; o bipe responde TROCAR, tag `mad`). Gravou com
    outro produto → **VOLTAR AO ANTERIOR** (`_lancMadrugadaVolta`, tag `mad2`):
    o `registrarProducaoProduto` troca o produto atual do turno.
  - A exclusão de lançamento da madrugada não avisa "não dá para relançar"
    (`_corrHoraTravada` usa a mesma regra). O bipe segue só na hora corrente.
  - Gerencial do PC **não** lança: ele não tem seletor de produto.

## A ETIQUETA NO BIPE — o volume escolhe o código (mobile 1.45.0)
- PPCP, 12/11/2026: *"como está lendo hoje a entrada pela etiqueta"* → *"sim,
  faz os dois"*. O bipe (`processarBipe`, só no perfil OPERADOR, com
  `MODO_LEITOR` na CONFIG_PAINEL) lê a etiqueta GS1-128 `(8006)` = GTIN +
  peça/total (`0202` = volume 2 de 2) e casa com a coluna `EAN 128` da
  `PRODUTO_CODIGO`. Não conta caixa: seleciona o produto e abre a hora atual.
- ⚠ **No cadastro, os volumes da mesma cor têm o MESMO GTIN** — só a
  peça/total muda (501.060.003 VOL 1/2 MEL `…78424 0102` × 501.060.004 VOL 2/2
  `…78424 0202`). Até a 1.44.0 o `eanCore` jogava a peça/total fora e o
  `PRODUTOS.find` ficava com o 1º código: **bipar o VOL 2/2 selecionava o VOL
  1/2, sempre** (~60 códigos de 22 modelos nunca saíam pelo bipe). Não dá para
  saber se já gravou caixa no volume errado: a `PRODUCAO_PRODUTO` não diz se o
  código veio do bipe ou do toque. O log tem muitos VOL 2/2 — selecionados por
  toque ou LOTE.
- **`eanAchar(raw, prods)`** (pura) + `eanPartes` (núcleo de 13 dígitos +
  volume) + `eanFalhaTxt` (o aviso):
  - etiqueta com volume → o código com o MESMO EAN e volume; sem nenhum, só o
    código ÚNICO do EAN cujo cadastro não diz volume (VOL 1/1 em `(01)`); um que
    diz OUTRO volume, nunca (`vol-nao-cad`: escolher outro volume gravaria as
    caixas no volume errado);
  - etiqueta sem volume → só com um código no EAN; com mais, `ambiguo`;
  - mesmo EAN + volume em dois códigos → `ambiguo`. **Nunca o 1º da lista**: o
    aviso (vermelho, 4,5 s) diz o motivo e manda escolher na lista.
- **Cadastro corrigido pela API em 12/11/2026**: 501.070.001–003 (HOME RIPADO
  SUPREMO 2.3 CINAMOMO) estavam com `(8806)` e davam "EAN não cadastrado";
  viraram `(8006)`.
- **Regra: o EAN da etiqueta chama UM código do produto** (PPCP, mesmo dia).
  Conferido no cadastro de 12/11/2026 (429 códigos: 113 com volume em
  `(8006)`, 316 em `(01)`): cada EAN passado pelo `eanAchar` chama o próprio
  código, e a peça/total bate com o VOL da descrição em todos. Na leitura
  antiga, 60 (os VOL 2/n e 3/n) chamavam outro código. EAN novo no cadastro:
  `(8006)` + GTIN + peça/total do volume, ou `(01)` + GTIN no VOL 1/1.
- ⚠ O operador só vê o cadastro novo quando entra de novo no app: no perfil
  OPERADOR o catálogo é lido no login (e guardado no aparelho).
- **QUANDO A LEITURA FECHA (mobile 1.48.0**, PPCP 12/11/2026: *"lê o código
  EAN mas não acontece nada"*). Testado no Chromium (Playwright, Apps Script
  simulado): o `processarBipe` estava certo; a captura do teclado só fechava a
  leitura com **Enter** e teclas a **≤ 80 ms**. TAB no fim, sem sufixo ou leitor
  lento = **nada na tela**, nem o aviso vermelho. `MODO_LEITOR` estava `1` na
  `CONFIG_PAINEL` (conferido pela API). O leitor do chão não foi visto: a causa
  exata ficou sem confirmar.
  - Regra PURA `scanTecla(st, key, agora, editavel)` / `scanPausa(st, agora)`;
    o ouvinte (capture, `keydown`) só aplica. `SCAN_MIN`=8 teclas,
    `SCAN_RAJADA_MS`=80 (com campo de texto focado, `_scanEditavel`),
    `SCAN_SOLTO_MS`=600 (sem campo focado: ninguém digita "no nada"),
    `SCAN_FIM_MS`=700 (parado isso com ≥ 8 teclas = fecha sozinha).
  - Enter **ou Tab** fecham; sem sufixo, fecha na pausa e o Enter/Tab que chegar
    em até 700 ms depois é engolido (não lê de novo, não clica botão focado).
  - Ainda calado: o leitor que não gera `keydown` (modo SPP, teclado virtual de
    app do leitor, sem pareamento) e o leitor lento COM campo de texto focado.
    Prefixo de simbologia `]C1` dá EAN errado (aviso vermelho), não tratado.
  - Testes em `etiqueta.test.js` (a regra real; 10 de 10 mutações pegas).
- **O PRODUTO NO LANÇAMENTO** (mesma versão, PPCP: *"quando bipa não aparece o
  código"* → *"quando operador digitar qtde vai fechar a banqueta ou
  buffet?"*). A quantidade vai para o **produto atual do turno** na hora do
  ADICIONAR (`codLanc = PROD_ATUAL`, sincronizado com o `.gs` — vale para todos
  os aparelhos). O bipe abria o lançamento da hora POR CIMA do aviso verde
  (`.scan-toast` z-index 50, `.modal-over` 100) e o lançamento não dizia o
  produto: um bipe de TESTE deixava o produto do turno trocado sem ninguém ver.
  - Linha `#ml-prod` no lançamento: código + cor em etiqueta (`.ml-prod-cor`:
    cortado o nome, a cor não pode ir junto) + nome em até 2 linhas + `›`;
    tocar abre o seletor por cima (`abrirModalProduto`, o `#modal-produto` vem
    depois no HTML). `_mlProdTxt` (pura) + `_mlProdPintar(bip)`, chamada no
    `abrirLanc`, no `atualizarProdutoBar` (toda troca de produto) e no bipe
    (acende, menos no TROCAR PRODUTO). Sem produto: âmbar, *SEM PRODUTO*.
  - O aviso do bipe vai ao ALTO da tela e acima dos modais (z-index 130): no pé
    ele cobria o CANCELAR/ADICIONAR. Falha fica 4,5 s.
  - Tela baixa (`max-height:760px`): menos ar no `#modal-lanc` (gap, padding,
    teclado), nunca letra. Medido no Chromium: 320×658, 360×740, 800×1280 e
    1280×800 com a folha sem rolar e o ADICIONAR inteiro à vista (antes, a
    320×658 já rolava 11 px). Peça nova no lançamento? Medir de novo.

## CONFIRMAR O PRODUTO quando ele mudou (mobile 1.46.0)
- O caso, 12/11/2026: um bipe de TESTE da banqueta trocou o produto do turno e as
  180 cx do BUFFET 3 PT PRISM da hora 09:00 entraram na BANQUETA VERSATIL. O
  PPCP pediu para o Claude corrigir pela planilha (o TROCAR do app era o caminho
  recomendado): linha 3128 da `PRODUCAO_PRODUTO` (código, descrição, pontos =
  180 × 167,2584, peso = 180 × 35,15), linha 2877 da `HISTORICO_MEDIA_FAMILIA` e
  linha 7 da `LANC_TROCADOS` (ORIGEM *PPCP (planilha, via Claude)*). A baixa dos
  lotes se refaz no próximo lançamento. PPCP: *"tem que ter uma confirmação"* →
  *"quando o produto mudou"* (a opção em todo lançamento foi recusada: o
  operador acostuma a tocar sem ler).
- `lancProdConfirmar(ult, hoje, cod, prodConf)` (pura) decide: o aparelho lembra
  o produto do último lançamento que MANDOU hoje (`rp_lanc_ult` = {dia, cod},
  gravado antes da resposta, como o `rp_lanc_rec`; chave nova, não renomear).
  Pergunta **CONFIRMAR O PRODUTO** (`tag:'prod'`, destaque TROCAR PRODUTO) no 1º
  lançamento depois que o produto muda, no 1º do dia (o produto do turno passa de
  ontem para hoje) e no que vai SEM produto (o 2º sem produto seguido, não).
  Código comparado só pelos dígitos. Texto em `lancProdMudouTxt`.
- Não pergunta de novo o produto escolhido DENTRO do lançamento: bipado com a
  pergunta aberta (`processarBipe` marca `_slotAtivo.prodConf` e responde
  TROCAR), ou escolhido no seletor aberto pela pergunta ou pelo TROCAR A COR
  (`_prodConfSel`; fechar o seletor sem escolher desfaz). O `_slotAtivo` nasce a
  cada `abrirLanc`, então a marca vale só para aquele lançamento.
- Ordem no `salvarLanc`: madrugada (que já pergunta o produto e dispensa esta) →
  CONFIRMAR O PRODUTO → LANÇAMENTO REPETIDO → CONFERIR A COR.
- Por aparelho: o lançamento de outro tablet não conta. Testes em
  `lancamento.test.js` (o `salvarLanc` real; 4 mutações pegas).

## Excluir lançamento pelo app (mobile 1.34.0 / `.gs` v5.25)
- PPCP, 16/10/2026, com o WhatsApp do operador na mão: *"esse 60 foi duas
  vezes, é um só"* → *"no lançamento eu preciso ter como excluir um
  lançamento"*, *"porque envolve o produto que ele estava fazendo"*. Na
  planilha: 501136004 LIVREIRO ENCANTO 60 + 60 na hora 10:00 (279 em vez de
  219). Corrigido à mão no mesmo dia (célula G10, PRODUCAO_PRODUTO e
  HISTORICO_MEDIA_FAMILIA). Há outro caso igual em 13/10 15:00 (501094001,
  60 + 60) que não foi conferido.
- **Um lançamento mora em TRÊS abas**: o número na coluna LANÇ da
  `HORA_A_HORA`, a linha da `PRODUCAO_PRODUTO` (UEP, pontos e a baixa dos
  lotes pelo FIFO) e a da `HISTORICO_MEDIA_FAMILIA`. Apagar só a hora deixa o
  produto contado — é por isso que a exclusão é do backend, não da planilha.
- **Casa por VALOR, sem id.** A `HORA_A_HORA` só guarda o número e nada liga
  a célula à linha do log. Nem precisa: células de mesmo valor na hora são
  intercambiáveis (o total é a soma), e linhas do log de mesma data, hora,
  código e caixas também. `excluirLancamento` limpa a ÚLTIMA célula da hora com
  aquelas caixas e apaga a ÚLTIMA linha do log com aquele produto e caixas.
  - **Tudo ou nada**: confere célula E linha do log antes de gravar. Achou só
    metade → não mexe em nada e diz o que não achou.
  - **Idempotente pelo `exclId`** (cache 2 h, mesmo esquema do `lancId`): a
    retentativa por timeout NÃO apaga o OUTRO 60 da hora.
  - Depois: `_invalidarValores()` + `sincronizarPlanilhaPosLancamento()` — o
    FIFO refaz do zero, e lote que fechava só por causa do lançamento volta a
    ter saldo (e volta da CONCLUIDA, pelo `_desarquivar`).
  - Registro em **`LANC_EXCLUIDOS`** (criada na 1ª exclusão): quando, data,
    hora, caixas, código, descrição, origem e o total da hora depois.
  - A `HISTORICO_MEDIA_FAMILIA` é análise: não achar a linha lá não desfaz a
    exclusão (loga).
- **`getLancamentosHora`** lista a hora com o produto de cada lançamento
  (`_casarLancamentos`, conta pura: cada célula pega a 1ª linha livre do log de
  mesma quantidade). Célula sem linha = **sem produto**; linha sem célula =
  **SÓ NO REGISTRO DE PRODUTO** (alguém limpou a hora à mão — ainda baixa lote
  e soma UEP), excluível com `soLog=1`. É lida **ao abrir a correção**: o
  `getDados` (a cada 3 min) não paga essa leitura. Sem cache de leitura.
- **Decisões do PPCP:** qualquer hora de HOJE, enquanto o dia não está no
  `HISTORICO` (`_lancDiaFechado`: FECHAR DIA ou arquivamento automático —
  depois disso, planilha + FECHAR DIA de novo); o **operador** exclui, com
  confirmação. ⚠ O REABRIR do desktop é só local: com o dia no HISTORICO a
  exclusão continua bloqueada.
- **Celular:** hora fechada COM lançamento fica tocável (✎) e abre a
  correção; a hora atual tem **✎ CORRIGIR UM LANÇAMENTO** no modal. A
  confirmação diz produto, caixas e como a hora fica, com **VOLTAR** em
  destaque à direita (`seguro:'cancelar'`). Sem resposta ≠ não excluiu: relê a
  hora e decide pelo que ela mostra (`_corrConta`).
- **AVISO DE LANÇAMENTO REPETIDO** (`lancRepetido`, `LANC_REPETIDO_MIN`=10):
  o `lancId` só protege a retentativa DENTRO do mesmo modal — o 60 de 16/10
  entrou de novo com o modal reaberto. O aparelho guarda o que MANDOU
  (`rp_lanc_rec`, gravado antes da resposta: timeout não prova que não gravou)
  e pergunta antes de mandar o mesmo produto, quantidade e hora. NÃO, JÁ FOI
  fecha o modal. Só o mesmo aparelho: acusar o lançamento de outro seria
  barulho.
- ⚠ Mudou o `.gs` → **re-deploy manual**. Antes dele, a correção diz que o
  Apps Script ainda não tem a exclusão; o aviso de repetido já funciona.

## TROCAR PRODUTO do lançamento (mobile 1.37.0 / `.gs` v5.32)
- Caso real, 23/10/2026 (WhatsApp do operador): 203 cx de **RACK SIRIUS 1.4
  OFF WHITE/CINAMOMO** (501.106.005, lote 25337) entraram na hora 14:00 como
  **SIRIUS 1.6 CINAMOMO** (501.106.013). Às 15:19 ele EXCLUIU para lançar de
  novo — e não conseguiu: a hora 14:00 só aceitava lançamento até 15:15. A
  hora ficou em 0. **Excluir vale para qualquer hora de hoje, lançar não**:
  excluir-e-relançar numa hora fechada é uma armadilha.
  - Arrumado no mesmo dia com uma chamada direta ao `/exec`
    (`action=saveRealizado&horario=14:00&realizado=203&produto=…&lancId=…`):
    o backend nunca teve trava de horário, a regra da tolerância é só de tela.
    ⚠ Esse caminho troca o `PROD_ATUAL` do turno (o `registrarProducaoProduto`
    grava a propriedade e o app sincroniza pelo `getDados`) — o operador tem de
    bipar o produto que está rodando depois.
  - ⚠ **Na chamada à mão, o código vai SÓ COM DÍGITOS** (`produto=501106005`).
    O CODIGO da `PRODUTO_CODIGO` é **número** com formato `#,##0` (a tela mostra
    `501.106.005`), e o `registrarProducaoProduto` procura o produto por
    igualdade exata com o texto que chegou. Com `501.106.005` a linha entrou sem
    DESCRICAO, PONTOS e PESO_KG (o Sheets ainda converteu o código para número,
    então UEP e FIFO casaram). Corrigido à mão pela API: linha 2893 da
    `PRODUCAO_PRODUTO` e 2642 da `HISTORICO_MEDIA_FAMILIA`. O app manda o código
    do cadastro (dígitos) e não tem esse problema; a troca compara por `codKey`
    e grava o código do cadastro.
- **O erro era o PRODUTO, não as caixas.** O produto só mora na
  `PRODUCAO_PRODUTO` e na `HISTORICO_MEDIA_FAMILIA`; a `HORA_A_HORA` guarda o
  número. `trocarProdutoLancamento` reescreve a linha do registro **no lugar**
  (CODIGO, DESCRICAO, PONTOS, PESO_KG — a ordem das linhas é a ordem dos
  fatos, o `_prepDoDia` conta preparação por ela), ajusta a linha da família e
  refaz o FIFO (`_invalidarValores` + `sincronizarPlanilhaPosLancamento`): as
  caixas saem do lote errado e entram no certo. A hora **não muda**, nem por
  um instante (excluir + relançar deixava a TV e o painel com a hora a 0 no
  meio).
  - Mesmo casamento da exclusão (a ÚLTIMA linha da hora com o produto e as
    caixas), **tudo ou nada** (produto novo fora do cadastro, mesmo produto,
    caixas que não estão, dia fechado → nada muda) e **idempotente pelo
    `trocaId`** (cache 2 h).
  - Pontos e peso pela MESMA conta do `registrarProducaoProduto` (retrato do
    cadastro). O produto novo é achado por `codKey` (aceita `501.106.005` ou
    `501106005`) e o código gravado é o do cadastro (`String` do número:
    `501106005`) — o mesmo texto que o `getPontosDia` e a UEP procuram.
  - **Família**: o 1.4 e o 1.6 do SIRIUS são a MESMA família (6 dígitos). A
    linha de mesma descrição vem primeiro; sem ela, a última da família com
    as caixas. Não achar não desfaz a troca (é análise).
  - O **produto atual do turno NÃO muda** — a troca corrige o passado.
  - Registro na aba **`LANC_TROCADOS`** (criada na 1ª troca): quando, data,
    hora, caixas, código e descrição antes e depois, origem.
  - Lançamento **sem produto** não tem TROCAR (não há linha no registro para
    trocar); a linha **SÓ NO REGISTRO** tem.
- **Celular**: na correção, cada lançamento com produto tem **TROCAR**
  (neutro) em cima do **EXCLUIR** (vermelho). TROCAR abre o MESMO seletor de
  produto do lançamento, com o título **PRODUTO CERTO** (`_corrTroca`): toque,
  LOTE, código ou **bipe**. No modo troca o `selecionarProduto` não mexe no
  `PROD_ATUAL` e o bipe não abre o lançamento da hora atual; fechar o seletor
  desfaz o modo. Confirmação com **VOLTAR** em destaque (`corrTrocaTxt`: sai,
  entra, a hora não muda). Sem resposta ≠ não trocou: relê a hora e conta pelos
  dígitos do código (`_corrContaCod`). Backend antigo (sem `novo` na resposta)
  → diz que falta o `.gs` v5.32.
- **A EXCLUSÃO AVISA quando a hora já não aceita lançamento**
  (`_corrHoraTravada`, a mesma regra do `slotLancavel`): *"excluído, não dá
  para lançar de novo. Se só o produto está errado, VOLTE e use TROCAR."*
- ⚠ O **aviso de cor errada não pega** o caso de 23/10: ele só compara cores do
  MESMO produto (mesma `desc`), e 1.6 × 1.4 são produtos diferentes. O 1.6
  CINAMOMO nem estava programado. Um aviso de "código fora da programação de
  hoje e dos próximos 2 dias" foi proposto e **ainda não decidido** pelo PPCP
  (o custo: perguntaria à toa quando produzem fora da programação, o que já
  aconteceu em setembro). No mesmo dia, às 15:00, entraram mais 65 cx no 1.6
  CINAMOMO — o produto atual do app tinha ficado no errado.
- ⚠ Mudou o `.gs` → **re-deploy manual**. Antes dele o TROCAR diz que o Apps
  Script não tem a troca e não grava nada; o EXCLUIR segue funcionando.

## LEMBRETE DE LANÇAMENTO (desktop)
- O modal ⏰ com bipe (`iniciarAlertaLancamento` / `dispararAlerta`, a cada
  minuto, slot encerrando em 5 min ou fechado sem lançamento) **não aparece no
  perfil GERENCIAL nem na diretoria** desde a v7.150.1 (PPCP, 20/10/2026: *"tira
  essa lembrete no gerencial"*). Segue no perfil do operador e na TV. ⚠ O texto
  dele ainda manda *"preencher o REALIZADO na planilha"* — o lançamento hoje é
  pelo app; não mexido. O mobile não tem lembrete.
