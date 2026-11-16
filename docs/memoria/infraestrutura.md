# Leituras, versões e o resto da infraestrutura — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## Versão do painel / aviso de atualização (desktop, raiz)
- `APP_VER` no topo do script do `ritmoprod_embalagem_v7.html` aparece no rodapé.
  Ao publicar mudança na raiz, suba este número.
- **Aqui NÃO há service worker de propósito** (ver "Instalar o app"), então a
  checagem é direta: a cada 30 min (e ao voltar para a aba) `checarVersaoV7()`
  relê o próprio HTML com `cache:'no-store'` e compara o `APP_VER`. Se mudou,
  sobe a barra `#upd-bar`. É uma requisição ao próprio domínio — não encosta no
  Sheets.
- **Na TV o aviso não aparece** (`_naTV()`): ninguém está lá para clicar, e ela
  já se recarrega sozinha a cada 28 min.
- O bloco de versão fica **no início** do script, não no fim: lá embaixo, um erro
  anterior (ex.: a Chart.js não carregar) deixava o rodapé sem a versão.

## Versão do app / aviso de atualização (mobile)
- `APP_VER` no topo do script do `ritmoprod_mobile.html` é a versão que aparece
  na tela de login. **Ao publicar mudança no mobile, suba os dois juntos:**
  `APP_VER` **e** o `CACHE` do `sw-mobile.js` (`ritmoprod-mobile-vX`). É a troca
  do nome do cache que faz o navegador instalar o service worker novo.
- Quem está com o app instalado continua rodando o HTML que já estava aberto até
  recarregar. Quando o SW novo instala (e já havia um controlando), aparece a
  barra `#upd-bar` **"Nova versão disponível → ATUALIZAR"**; o botão limpa os
  caches do domínio e dá `location.reload()`. Também checa update a cada 30 min e
  quando o app volta para o primeiro plano.
- Na 1ª abertura depois de subir a versão, a mesma barra vira o aviso
  **"App atualizado para a vX"** (compara com `localStorage['rp_mob_ver']`) e
  some sozinha em 8s.

## Instalar o app (PWA)
- **No celular** o app é o **`/mobile`** (`ritmoprod_mobile.html` +
  `manifest-mobile.json` + `sw-mobile.js`).
- **No computador** dá para instalar a raiz `/` (v7, gerencial): o Chrome atual
  **não exige service worker** para instalar — basta `manifest.json` + ícones 192/512
  em HTTPS (conferido com `Page.getInstallabilityErrors`: zero erros). A tela de
  login tem o botão **💻 INSTALAR APP** (prompt nativo com 1 clique; sem prompt,
  abre o modal `#modal-app-mobile` com o passo a passo de Chrome/Edge/Firefox + o
  caminho do celular).
- ⚠ A raiz **não deve ganhar service worker**: o SW cacheando as chamadas JSONP do
  Apps Script faria a TV mostrar produção antiga como se fosse a de agora. E não
  precisa mesmo — ela já é instalável sem ele.
- O botão **INSTALAR APP** (tela de login) fica **sempre visível** enquanto o app
  não estiver instalado. Se o navegador oferecer o prompt nativo
  (`beforeinstallprompt`, só Chrome/Android e desktop), instala com 1 toque; se não
  (iPhone/Safari, Firefox, navegador interno do WhatsApp), abre o modal
  `#modal-instalar` com o passo a passo daquele navegador. **Não voltar a esconder
  o botão atrás do evento** — era isso que deixava iPhone e WhatsApp sem saída.
- Causa nº 1 de "não consigo baixar o app": link aberto **dentro do WhatsApp** —
  navegador embutido não instala PWA, tem que abrir no Chrome/Safari primeiro.
  Causa nº 2: procurar o app **na raiz** sem saber que no celular ele é o `/mobile`
  (o modal da raiz mostra o endereço, COPIAR LINK e ABRIR NO CELULAR).
- O `sw-mobile.js` só cacheia requisições **do próprio domínio**. Manter assim.
- `manifest.webmanifest` (raiz) está **órfão** — nenhum HTML aponta para ele e o
  `start_url` (`./index.html`) nem existe. Os manifests que valem são
  `manifest.json` (v7) e `manifest-mobile.json` (mobile).

## Custo das chamadas / auto-refresh (mobile)
- **Toda leitura do `.gs` lê a aba INTEIRA** (`getDataRange()`, 30+ ocorrências).
  O custo cresce com o histórico acumulado, não com o que foi pedido: 7 dias de
  parada custam o mesmo que 30.
- **No desktop, `lerPontosDia` tem 3 tentativas em sequência e voo
  compartilhado (`_pontosVoo`)** (v7.97.0): com uma tentativa só, o cold start
  deixava o card UEP DO DIA em "aguardando" até o próximo refresh (5 min).
  - ⚠ **O tempo de cada tentativa CRESCE: 30 → 45 → 60 s** (`PONTOS_TIMEOUT`,
    v7.127.0). O JSONP não cancela nada no servidor: o Apps Script continua
    calculando depois que o navegador desiste. Três tentativas iguais e curtas
    falhavam todas e ainda empilhavam execução na fila.
  - **`PONTOS_LEIT` é o estado da leitura** (tentativa em curso · falhou ·
    erro do backend) e `_pontosEstadoTxt` o texto ÚNICO da aba UEP e do card
    UEP DO DIA. "Aguardando" sozinho não separava *lendo* de *não respondeu*.
    Falhou com a aba UEP aberta: **UMA** retentativa sozinha em 30 s
    (`_pontosRetentar`) e o botão ↻ — laço de retentativa num Apps Script
    ocupado só aumenta a fila.
- **O ciclo do refresh do desktop é SEQUENCIAL** (`_cicloLeitura`, v7.127.0):
  getDados → aba PARADAS (se aberta) → `getPontosDia`. O `getPontosDia` saía
  JUNTO com o getDados, os dois disputavam a fila e o getDados estourava os
  25 s — o *"Sheets: Timeout"* do selo com a aba UEP parada em *"Aguardando"*
  (25/09/2026). Na abertura, a leitura do dia e as médias por horário também
  esperam a carga inicial. **Não voltar a disparar leitura em paralelo.**
- **O poll de parada (15 s) só roda na TV** (`_paradaNaTV`: tela cheia ou
  perfil do operador — a MESMA regra que decide se o overlay aparece). No
  gerencial ele nunca mostrava nada e eram 240 chamadas/hora por janela.
  Entrar em ⛶ PAINEL CHEIO dispara um poll na hora.
- **`getPontosDia` é a chamada mais cara.** Sozinha ela lê o catálogo
  `PRODUTO_CODIGO` **3×** na mesma execução (`:1204`, `:1218` e de novo dentro de
  `calcularProgramacao()` em `:1599`), mais `PRODUCAO_PRODUTO` inteira, mais
  `PROGRAMACAO` + `PROGRAMACAO_CONCLUIDA`.
- **Ciclo do mobile (escalonado, uma chamada de cada vez):** tick base de **90s**
  só para o `getParadas` (banner de PRODUÇÃO PARADA quase ao vivo); `lerSheets`
  a cada 2 ticks (3 min); `getHistory` a cada 4 ticks (6 min). O `getPontosDia`
  do gerencial sai **junto com o `lerSheets`** (3 min) desde a 1.50.0 — era a
  cada 6 min; com a UEP como veredito, a hora recém-lançada aparecia sem UEP e o
  esperado do card subia sem a UEP dela (ver *GERENCIAL DO CELULAR*).
  Dá ~90 chamadas/hora contra as 240 do ciclo antigo de 1 min. Medido no
  navegador: login = 8 chamadas, 12 min de refresh = 16, botão ATUALIZAR = 5 (6 no gerencial desde a 1.43.0: o cadastro, para a UEP do card ATRASO).
  - `cicloRefresh()` tem **guarda de reentrância** e roda em `await` sequencial —
    em paralelo as chamadas só se enfileiram no Apps Script (uma execução por
    vez) e ainda competem com o que o operador está salvando.
  - **Não voltar a disparar tudo junto no login.** A carga inicial é uma cadeia
    (`lerSheets → lerPontosDia → lerHistorico → lerMediaHoras` — a leitura do
    dia passou para antes do histórico na 1.44.0, por causa do card ATRASO); antes o
    `getHistory` saía 2× porque o `renderHistorico()` do callback refazia o
    `lerHistorico()` que já estava em voo.
- **Backend v4.9 (`.gs`) tem cache de leitura** (`CACHE_TTL_LEITURA`, 20s–5min
  por ação) com **invalidação por geração**: qualquer gravação (app ou edição
  manual via `onEdit`) troca `rp_gen` e órfã todas as entradas — o operador
  nunca vê dado velho depois de salvar. O `callback` JSONP fica fora da chave;
  erro não se cacheia; resposta >100KB só deixa de ser cacheada.
  `lerCatalogoProdutos()` é memoizado dentro da execução (o `getPontosDia` lia o
  catálogo 3×). `instalarGatilhoAquecimento()` (rodar 1× no editor) cria gatilho
  de 5 min contra cold start — reduz, não elimina.
  ⚠ Tudo isso só vale **depois de colar no editor do Apps Script e re-deployar**.
- **Backend v5.1: memo de leitura POR EXECUÇÃO** (`_valores`/`_valoresDaAba`).
  O caro não era uma leitura, era a **mesma aba lida duas vezes na mesma
  chamada**: `getPontosDia` lia `PRODUCAO_PRODUTO` e, na sequência,
  `calcularProgramacao() → lerEmbaladoPorProduto()` lia a mesma aba de novo.
  - **Só função de LEITURA usa o memo.** Quem escreve (`saveDay`, `saveParadas`,
    `endParada`, `arquivarDiaAtual`, `arquivarHorasDoDia`, `setConfigPainel`,
    `atualizarSaldoNaProgramacao`) continua lendo direto da planilha — gravar em
    cima de um retrato velho da aba seria perda de dado. `apps-script.test.js`
    falha se alguma delas passar a usar o memo.
  - `invalidarCacheLeitura()`, que já rodava em toda gravação, limpa o memo
    junto: leitura depois de escrita nunca vem do retrato antigo.
  - É um segundo nível, **dentro** da execução; o cache do `CacheService`
    (20s–5min, por geração) continua valendo entre chamadas.
- **Leitura recortada por data (`_valoresPorData`, 15/09/2026).**
  `getProducaoModeloPeriodo` e `getParadasPeriodo` leem só a faixa de linhas do
  período. Medido na planilha real (`PRODUCAO_PRODUTO`, 2.381 linhas × 8):
  **7 dias −77%** de células, **30 dias −47%**, **90 dias +12%**.
  - ⚠ **NÃO assume ordem de data.** A otimização óbvia — busca binária e ler do
    corte em diante — perde linha **calado** quando alguém acrescenta uma parada
    antiga à mão, e isso acontece aqui (é por isso que o `endParada` tem
    fallback por DATA+INÍCIO). A coluna de data é varrida INTEIRA e lê-se o
    trecho entre a primeira e a última linha que casam: fora de ordem continua
    certo, só lê um pouco mais.
  - ⚠ **O pior caso é real e está escrito**: a varredura custa 1/nColunas de uma
    leitura completa e é paga sempre, então janela que cobre a aba inteira fica
    **+12%** (+14% na `PARADAS`, que tem 7 colunas). Fica assim de propósito —
    7 e 30 dias são o dia a dia, 90 é o preset raro.
  - **`lerEmbaladoPorProduto` continua lendo tudo, e deve**: o FIFO precisa do
    histórico inteiro, senão a produção antiga credita outro lote do mesmo
    código — o erro que o arquivamento existe para evitar.
  - O recorte **nunca entra no `_valoresMemo`** (um pedaço lá faria a próxima
    leitura completa devolver menos linhas do que existe), e quando a aba já
    está no memo o recorte nem acontece.
  - ⚠ **A conversão de data é a DO CHAMADOR** (`paraNum`), nunca uma de dentro
    do recorte. O `getParadasPeriodo` filtra por `toNum(_dataStr(...))`, que
    formata `Date` no fuso **da planilha** (`_ssTz`), e o
    `getProducaoModeloPeriodo` por `dataParaNum`, que usa o `TZ` constante —
    para célula que é `Date` de verdade (as datas chegam como serial de
    meia-noite) os dois **discordam do DIA** quando os fusos diferem. Recorte e
    filtro discordando = linha cortada que o filtro aceitaria, sumindo calada.
  - ⚠ Mudou o `.gs` → **re-deploy manual**. `apps-script.test.js` conta
    **células** (não leituras) e cobre o fora de ordem, o pior caso, o memo e a
    conversão do chamador.

## Núcleo comum (`rp-core.js`)
- **As funções básicas eram escritas duas vezes**, uma em cada HTML, com o mesmo
  código: `toMin`, `fmtN`, `hojeStr`, `normHora`, `mergeMedias`, `calcAtrasoHoras`,
  `sc`… É a mesma armadilha que fez a conta de paradas divergir três vezes.
  Agora moram no `rp-core.js`, carregado pelos dois **antes** do script do painel.
- **As funções ficam no escopo global de propósito.** Os painéis já chamavam
  `toMin(...)` direto; trocar ~500 pontos de chamada por `RP_CORE.toMin(...)`
  seria risco sem ganho. `window.RP_CORE` existe só para o painel conferir se o
  arquivo carregou.
- **Guarda obrigatória**: sem o arquivo, o painel morreria com
  `toMin is not defined` numa tela preta. O bloco inline logo após o
  `<script src="/rp-core.js">` mostra *"Módulo base não carregou"* (div
  `#rp-core-guarda`) e recarrega sozinho — no máximo **5 vezes**
  (`sessionStorage['rp_core_try']`), para não martelar o servidor quando ele
  estiver fora de verdade.
- O `sw-mobile.js` **pré-cacheia** o `rp-core.js` na instalação e o
  `vercel.json` serve o arquivo com `must-revalidate` — mesmas regras do
  `paradas-calc.js`, pelo mesmo motivo: HTML novo com módulo velho é pior que
  os dois velhos.
- **O que NÃO foi unificado, e por quê**: `calcKPIs`, `renderGerencial`,
  `lerSheets`, `getSlots`, `loadCfg`, `jsonpFetch` e `sl` têm o mesmo nome nos
  dois painéis mas **código diferente de propósito** (a TV mostra o que o
  celular não mostra; os timeouts do celular são outros). Unificar sem separar
  o que é regra do que é tela só trocaria a duplicação por um `if` gigante.

## Achados dos 6 revisores (31/08/2026)
Os seis agentes de revisão (visual, UX de fábrica, código, redator, guardião de
dados, auditor de cálculos) passaram no repositório inteiro. O que foi corrigido
ficou registrado abaixo; o que **não** foi está no fim da seção.

- **Hora ainda não lançada não pode inventar atraso** (`calcAtrasoHoras`,
  `rp-core.js`). O acumulado somava a meta de TODA hora, e hora futura chega
  como `producaoHora: null` (o `getDados` só devolve número depois que a hora
  fecha) — o `|| 0` a tratava como "produziu zero". Num dia 12 cx atrás às
  14:30, a linha das 16:00 mostrava **`(+190)`** e meta efetiva **368 cx**. Hoje
  só entra no acumulado a hora com lançamento; hora que **fechou** em zero vem
  como `0` (não `null`) e continua sendo cobrada. O teste antigo só cobria a
  **primeira** hora pendente, onde o defeito ainda não aparecia.
- **A perda das paradas arredonda uma vez só, no fim** (`paradas-calc.js`). O
  `Math.round` era aplicado **por parada** e depois somado: a fração de cada uma
  ia fora, sempre para menos. 30 paradas de 3 min com meta 1600 davam 270 cx em
  vez de 273; **20 paradas de 1 min com meta 264 davam ZERO em vez de 10** (cada
  uma cai em 0,4999… e some) — e como o `ritmoHora` do `diag` é derivado do
  `pecas`, a linha que esta memória manda comparar primeiro quando as telas
  divergem saía **"0 cx/h"**. `perdaBrutaDeMin` é a conta crua; `perdaDeMin`
  continua devolvendo inteiro para quem valora um recorte só. Consequência
  aceita: a soma das linhas da lista pode ficar 1 cx longe do total — é o mesmo
  critério do rateio da troca ("o arredondamento é só na exibição").
- **O `getSlots` do v7 gerava `12:12–13:12`**, contrariando o item "NÃO ALTERAR"
  logo no topo deste arquivo. A regra do pós-almoço ("encerra na próxima hora
  cheia") existia só no mobile; o v7 deslocava o turno inteiro da tarde e ainda
  fazia a última hora virar `16:12–17:00`. Vale no DEMO, no import de Excel e no
  fallback do `getEffectiveSlots` sem linha de hoje — e nesse modo os rótulos
  não batiam com a `HORA_A_HORA`, então o `normHora()` do alerta de hora fraca
  não achava a média histórica de nenhum horário da tarde. `rp-core.test.js`
  agora roda os DOIS `getSlots` com o mesmo CFG e exige o mesmo recorte (as
  funções seguem separadas de propósito — o mobile estende o turno para trás).
- **Lançamento não é mais sobrescrito quando as colunas de LOTE acabam**
  (`_saveRealizadoCore`, `.gs`). Sem coluna livre, o código gravava `real` **por
  cima da última**: o valor que estava lá sumia e, como o `getDados` soma as
  colunas de lote, o REALIZADO da hora caía sozinho — sem erro, sem log, sem
  nada na tela. Agora **soma** na última coluna (o total da hora fica certo; o
  que se perde é só a separação por lote dos dois últimos lançamentos) e grava
  um `Logger.log` pedindo mais colunas de LOTE.
  ⚠ **Ainda em aberto:** a detecção da coluna é
  `includes('LOTE') || includes('LT') || startsWith('L')` — esse `startsWith('L')`
  trata QUALQUER coluna depois de REALIZADO começada com L (LINHA, LIMPEZA,
  LÍDER, LOCAL) como coluna de lote. Não foi mexido porque endurecer o critério
  sem ver os cabeçalhos reais da `HORA_A_HORA` pode fazer o lançamento parar de
  ser gravado. **Conferir os títulos na planilha antes de mexer.**
- **O upload de logo do desktop estava morto.** O `onclick` do logo do login
  chamava `getElementById('tv-logo-input').click()` e esse id **não existe** em
  lugar nenhum (sobra de uma versão em que o upload ficava na área da TV):
  clicar lançava `TypeError` e o `carregarLogo` nunca era chamado. Pior, o
  `restaurarLogo()` (que roda a cada carregamento) buscava `tv-logo-img` e fazia
  `img.src=src` **sem guarda de null** — estourava na primeira linha, o
  `try/catch` engolia, e o bloco do `login-logo-img` logo abaixo nunca era
  alcançado: quem tinha logo salvo em `rpe_logo` nunca mais o via voltar, em
  silêncio. Mesma armadilha do `btn-pasta`. Hoje há o input real e o
  `aplicarLogo()` com guarda.
- **`--txt3` era ilegível: #3A3A3A dá 1,66:1 sobre `--bg` e 1,50:1 sobre
  `--surface`** (mínimo de texto é 4,5:1). Não era decoração — cobria
  `.empty-msg` ("Carregando dados…", "Nenhum dado."), o rodapé de versão, o
  botão FECHAR do modal e o **`#tv-parada-desde`, lido a 15 m** na tela cheia de
  PRODUÇÃO PARADA. Foi para **#838383** (4,98:1 e 4,50:1) nos dois painéis.
  ⚠ Não existe um terceiro nível MAIS escuro que o `--txt2` (#888888) e ainda
  legível neste fundo: a diferença entre `--txt2` e `--txt3` passa a ser de
  corpo e peso, não de cor. Não empurrar o `--txt3` para baixo de novo.
- **O rótulo é CAIXAS PERDIDAS, nunca PEÇAS.** O mesmo `st.pecas` saía como
  "PEÇAS PERDIDAS" no desktop (7 lugares) e "CAIXAS PERDIDAS" no mobile — e o
  desktop se contradizia sozinho, já usando CAIXAS na tabela do plano de ação,
  com o `sub` do próprio card dizendo "(caixas)". O produto todo conta caixa.
  `relatorios.test.js` falha se "PEÇAS PERDIDAS" voltar a ser impresso, mesma
  guarda do vocabulário banido ("PERDIDO NO RITMO"/"PERDIDO PARADO").
- **O modal de LANÇAMENTO não fecha mais no toque fora.** Era o único modal do
  app com dado DIGITADO dentro, e a área escura ao redor é o maior alvo da tela:
  encostar nela com a mão ocupada apagava a quantidade sem confirmação e sem
  desfazer. Fecha pelo CANCELAR, que está ao lado do SALVAR. O `modal-dia` e o
  `modal-instalar` mantêm o dismiss — não guardam nada digitado.
- **As três leituras de apoio do mobile ganharam retry** (`jsonpLeituraApoio`):
  `carregarProdutos`, `carregarProgramacaoHoje` e `carregarTiposParada` iam com
  UMA tentativa e o timeout padrão de 20s, falhando em `console.warn` — no cold
  start o operador abria o seletor e via catálogo velho sem nada dizer por quê.
  Duas tentativas, **em sequência** (o Apps Script atende uma execução por vez).

### 2ª leva — o restante dos achados
- **`metaH` era calculado por fórmulas diferentes nos dois painéis**: o v7 usa a
  meta média das horas JÁ LANÇADAS (`Σ metaHora ÷ n`) e o mobile usava
  `meta do dia ÷ totalSlots` — 172 × 178 num dia normal, 174 × 160 num dia com
  HE (o slot extra entrava no denominador sem a meta dele entrar no numerador).
  O mobile passou a usar a conta do v7. Nenhuma tela do celular lê esse campo
  hoje, mas quem ler amanhã herdaria a divergência.
- **`nec` (RITMO NECESSÁRIO) não pode ser negativo.** Com a meta já batida — ou
  com `CFG.metaDia=0` — `meta−real` fica negativo e o gerencial e a TV imprimiam
  **"−54 cx/h"**. Clampado em 0 nos dois painéis; o gerencial mostra **META OK**
  em verde no lugar do número.
- **HORA EXTRA e FECHAR DIA ganharam retry** (`jsonpEscrita`, 3× em sequência).
  Eram as duas únicas gravações do painel com UMA tentativa, e as duas acontecem
  com o Apps Script frio (HE fora do horário, FECHAR DIA às 17:00). O `addHE` do
  backend virou **upsert por rótulo** — sem isso o retry criaria uma linha
  `HE 17:00-18:00` por tentativa e a HE seria contada duas vezes na `HE CX`.
  O `salvarDiaSheets` caía num `console.error` mudo depois de o diálogo ter
  prometido gravar no Sheets; agora avisa na tela e diz para clicar de novo
  (repetir é seguro, `saveDay` é upsert por data).
- **O cache de histórico (2 min) é invalidado ao fechar/reabrir o dia.** O merge
  dá prioridade ao registro vindo do Sheets, então no fluxo "REABRIR → corrigir →
  FECHAR DIA de novo" a tela de HISTÓRICO podia mostrar os números do fechamento
  ANTERIOR por até 2 min — e o gestor fechava uma terceira vez achando que não
  tinha pego.
- **`saveCfgLocal()` dentro de um try/catch no `saveCfg()`.** `localStorage`
  cheio ou bloqueado lançava e matava o resto da função: `enviarConfigPainel()`,
  `closeCfg()` e o `lerSheets()` nunca rodavam. Era justamente o caminho de
  recuperação documentado aqui ("corrigir no campo URL DO APPS SCRIPT e salvar")
  — o gestor achava que tinha salvo e o painel seguia em DEMO. A config vale
  para a sessão mesmo sem gravar, e o aviso diz que ela não sobrevive ao reload.
- **`hProd` soma os minutos REAIS das horas lançadas.** Era `n × duração do
  PRIMEIRO slot`, o que assume hora de tamanho único — e o slot pós-almoço vale
  48 min. Com ele entre as 6 horas lançadas, o card HORAS PRODUTIVAS dizia 6,0h
  onde a soma real é 5,8h. O `RP_PARADAS` já fazia certo.
- **`stats()` não escreve mais no `metaByDay` do chamador** (copia antes). O
  mobile monta objeto novo a cada chamada e não sentia; o v7 passa o mesmo
  objeto de fora, e reaproveitado entre períodos o 2º `stats` nascia com a meta
  de hoje injetada num dia que não é hoje.
- **As TRÊS colunas do teto da esteira são lidas por prefixo** (`_porPrefixo` no
  `.gs`): o título real costuma trazer a unidade junto (`VELOCIDADE (m/min)`,
  `MEDIDA DA CAIXA (mm)`). Só o `ENTRE_PECA` tinha sido endurecido; com
  `indexOf` exato nas outras duas o campo chega 0 **em silêncio**, o
  `_tetoEsteiraCxH` devolve 0 e a coluna % TETO EST. some sem dizer por quê.
  O teste agora executa a helper real contra um cabeçalho com unidade.
- **`_rpOk()` foi para o `rp-core.js`** (função pura, estava copiada igual nos
  dois HTMLs). O `_rpRecarregar` continua local em cada painel — esse toca o DOM
  e avisa diferente em cada tela. ⚠ Nome novo no `rp-core.js` exige entrar na
  lista `G_MODULOS` do `lint-js.js`, senão o lint acusa `no-undef`.
- **`aria-label` nos botões cujo rótulo é só um símbolo**: ⚙, ‹, ›, ◀, ▶, ↺, ✕
  no v7 e o ⌫ dos dois teclados numéricos do mobile. Os demais botões já têm
  texto, que é o nome acessível — não foi feita varredura cega de ARIA.

**Item reclassificado em 15/09/2026 — o `startsWith('L')` NÃO é para endurecer.**
A nota anterior mandava apertar o critério "depois de conferir os cabeçalhos".
Os cabeçalhos foram conferidos, e a conclusão é a oposta.

⚠ **As colunas de lançamento da `HORA_A_HORA` chamam-se `LANÇ 1` … `LANÇ 10`.**
Não existe coluna `LOTE` nem `LT` na planilha. Das três cláusulas do critério,
**quem sustenta o lançamento é o `startsWith('L')`** — as outras duas não casam
com nada. Ele não é a cláusula folgada: é a única que funciona.
- Endurecer para "só LOTE/LT" — que é o que a leitura do código sugere a quem
  nunca abriu a planilha — faria as **dez** colunas pararem de ser somadas.
- E o estrago seria **CALADO**: sem coluna de lote, o `_saveRealizadoCore` cai
  no ramo `iLotes.length === 0`, que grava na coluna REALIZADO **apenas**
  `if (!cell.getFormula())` e ~~devolve **`{ok:true}` de qualquer jeito**~~
  (desde o `.gs` v5.47 responde **erro** — o lançamento continua sem gravar). E
  **REALIZADO É FÓRMULA** — conferido na planilha em 15/09/2026: `C5:C15` é uma
  `=SUM(D5:M5)` compartilhada. Ou seja, o operador salva, o app diz que salvou
  e **nada é gravado**. Não é risco teórico: é o que aconteceria no 1º
  lançamento depois do re-deploy.
- `apps-script.test.js` prende o **cabeçalho real** (`HDR_REAL`): quem endurecer
  o critério quebra no teste antes de quebrar a fábrica. Conferido que a guarda
  falha com o critério apertado. O fixture do `hora-extra.test.js` também passou
  a usar `LANÇ 1`, não `LOTE 1` — fixture que não espelha a planilha é armadilha.

**O que sobra de verdade** (risco baixo, e agora num lugar só): o critério
aceita de mais. `LINHA`, `LIMPEZA`, `LÍDER`, `LOCAL` entram pelo começo com L, e
`RESULTADO` (resu**LT**ado) e `FALTA` (fa**LT**a) entram pelo `LT` no meio da
palavra. **Hoje isso não faz mal nenhum**: depois de `LANÇ 10` só existem uma
coluna vazia e `COMO PREENCHER`, e nenhuma das duas casa. Vira problema só se
alguém acrescentar uma coluna com esses nomes **depois** de REALIZADO.
- Se um dia for endurecido, a forma segura é **allowlist ancorada no começo**
  (`LOTE` · `LANÇ`/`LANC` · `LT` · `L`+dígito), nunca "só LOTE/LT".
- Conferido direto na planilha (id `1W9bK_…jcwFzg`, título `MODELO_HORA_A_HORA`
  apesar do nome — é a de produção: o total subiu de 2.077 para 2.137 durante a
  própria conferência). `B5` também é fórmula e distribui a meta pelas horas
  `>= C3`, que é a mesma regra do início de turno já documentada aqui.
- A aba de programação chamava-se **`PROGRAMAÇÃO`** (com Ç e Ã) contra a
  constante `PROGRAMACAO` do `.gs`. **O usuário renomeou a aba para
  `PROGRAMACAO` em 15/09/2026**, então hoje o `getSheetByName` casa exato.
  - Não era defeito: o `acharAbaTolerante` já resolvia, comparando sem acento.
    O rename foi conferido e saiu limpo — **zero** referências ao nome antigo,
    **zero** `#REF!` e **zero** `INDIRECT()` na planilha inteira (fórmula com
    nome de aba em texto dentro de `INDIRECT` é a única que o Google **não**
    atualiza sozinha no rename; não havia nenhuma).
  - ⚠ **Não apagar o `acharAbaTolerante`** por causa disso. Ele é a rede de
    quem criar planilha nova a partir de um modelo antigo, com o acento — e o
    sintoma de quando falta é o pior que existe aqui: programação e atraso
    voltando **vazios, sem erro nenhum**.

⚠ **Lista conferida em 15/09/2026: os outros dois itens já estavam resolvidos** e
a anotação continuava aqui. TODO velho custa caro — manda conferir o que já foi
feito e dá ar de verdade ao que sobrou.
- *"COBERTURA DO APONTAMENTO só existe no PDF"* — **está na tela**: o
  `renderModeloPeriodo` calcula `cobTela` e imprime o percentual com o ⚠
  abaixo de 80%, ao lado da contagem de dias.
- *"`e.message` cru nos 4 relatórios"* — **não há nenhum**: `_rpErroRelatorio`
  trata os **sete** caminhos de erro dos relatórios e não sobrou `alert` com a
  exceção crua.

## Splash de abertura (`#splash`)
- **~1s de marca + batida + slogan ao abrir**, no celular e no PC. A tarefa do
  usuário nesta tela é **sair dela**: o operador abre o app no meio da hora, de
  pé, para lançar caixa.
- **QUEM SOME É O CSS, não o JS** (`animation:spOut … forwards`, terminando em
  `visibility:hidden;pointer-events:none`). Se o script morrer — ou a rede cair
  entre o HTML e ele —, o splash sai do caminho do mesmo jeito. **Não trocar por
  `setTimeout(...remove())`**: overlay preso em cima da tela trava o lançamento.
  O `onclick` só antecipa.
- **A única animação é a batida, traçada uma vez** (`spTracar`, `pathLength=100`
  no SVG). É o slogan desenhado, não efeito — nada mais se mexe.
- **Cor só onde tem função:** o nome é branco; o laranja fica na batida e no
  ponto final do slogan. Nome em laranja disputaria com os dois.
- ⚠ **`prefers-reduced-motion`: a regra é SOLTA no PC e INTEIRA no celular**
  (pedido do usuário, 08/09/2026 — *"solta a regra no PC"*). O Windows com
  **efeitos de animação desligados** (Acessibilidade → Efeitos visuais) faz o
  Chrome pedir menos movimento, e a abertura saía com a marca **parada** por
  0,7 s: foi a causa do *"no PC não tem animação"*. No `/` fica desligada só a
  **entrada do bloco** (o `translateY` do `spIn`) e a **batida continua sendo
  traçada**, no mesmo tempo de tela — desenhar uma linha no lugar não é o
  movimento que essa preferência existe para evitar (não há deslocamento, zoom,
  parallax nem piscada). **No `/mobile` a regra continua inteira**: lá o
  aparelho está na mão e em movimento, e o pedido foi só para o PC. Não copiar
  o bloco de um painel para o outro — `relatorios.test.js` falha nos dois
  sentidos.
- **A escala é `clamp()`, não px fixo.** Medido em 1440px, o bloco em px virava
  ilha perdida no preto — parecia diálogo, não abertura. E a hierarquia é a do
  PRODUTO: o nome é maior que o logo da empresa.
- ⚠ **A TV FICA DE FORA.** Ela roda em `?tv` e se recarrega sozinha a cada 28
  min: com splash, a parede piscaria a marca de meia em meia hora no lugar da
  produção. A classe `sem-splash` entra no `<html>` por um script inline no
  `<head>` — **antes da primeira pintura**; decidir isso depois já seria tarde.
  O celular não tem essa exclusão de propósito: lá não existe TV.
- Medido no Chromium em 320/430/1280/1920/1366×600: nada estoura, o splash sai
  sozinho e o botão OPERADOR volta clicável. `relatorios.test.js` prende as
  cinco regras acima nos dois painéis.

## As bibliotecas de CDN do desktop são `defer` — e por que isso é do PC
- **O `/mobile` não carrega CDN nenhuma; o `/` carrega duas** (`xlsx.full.min.js`
  e `chart.umd.min.js`, do cdnjs), no `<head>`. Sem `defer` elas são scripts
  **síncronos**: o parser para nelas e o `<body>` — **o splash junto** — só
  começa a existir depois que o cdnjs responder.
  - **Medido no Chromium** (cdnjs atrasado em 3 s): **primeira pintura aos
    3.132 ms** contra **196 ms** com `defer`. Três segundos de tela preta antes
    de qualquer coisa. Com o cdnjs **bloqueado** (firewall da fábrica), a espera
    é a do timeout — e o painel inteiro ficava refém disso.
  - Foi o que apareceu como *"no PC não tem animação na tela inicial"*
    (08/09/2026): o splash estava publicado e funcionando; o que faltava era a
    página **pintar**.
- **A Chart.js exigiu uma fila, senão o `defer` abriria o painel sem gráfico.**
  O primeiro render é o `renderAll()` do fim do script, que roda **antes** de os
  scripts `defer` executarem. `mkChart` enfileira em `CHART_FILA` quando
  `typeof Chart==='undefined'` e o `DOMContentLoaded` esvazia a fila — o
  navegador dispara esse evento **depois** dos `defer`, então o desenho é o
  mesmo, alguns milissegundos mais tarde.
  - De quebra, **cdnjs fora do ar não derruba mais o render**: antes era um
    `new Chart` num nome inexistente, e o throw levava junto o que vinha depois
    (é o incidente que já deixou o rodapé sem versão, anotado no `renderAll`).
- ⚠ **Não tirar o `defer`, e não trazer CDN para o mobile.**
  `relatorios.test.js` falha nos dois casos e também se a fila do `mkChart`
  sumir.
- **O XLSX é ~1 MB** (o Excel do FECHAR DIA e a importação — o Exportar Excel
  do HISTÓRICO saiu na v7.248.2), e a TV recarrega sozinha a cada
  28 min. Com `defer` ele sai do caminho da pintura, mas continua sendo baixado
  em toda abertura — carregar sob demanda é a melhoria seguinte, ainda não feita.
- **Quando alguém disser que "não tem animação" no PC, a ordem de investigação
  é:** versão no rodapé da tela de login (HTML velho em cache) → **a janela já
  estava aberta** (o painel do PC é instalado como app e fica aberto o dia
  inteiro; clicar no ícone da barra de tarefas só dá foco na janela — sem
  carregamento não há splash, e no celular o sistema mata o app e ele reabre do
  zero, que é por que lá aparece sempre) → rede (o `defer` acima) →
  `prefers-reduced-motion`, hoje **solto no PC** (ver o splash).
  O código do splash é o mesmo nos dois painéis; o que muda é o de cima.

## O NOME e o SLOGAN — onde moram, e o que de propósito NÃO foi renomeado
- **O produto é o `RitmoPatrimar`** (v7.40.0 / mobile 1.16.0, 08/09/2026). Antes
  era `RitmoProd`, escrito ~35 vezes espalhadas pelos dois HTMLs.
- **O nome mora em `APP_NOME` / `APP_NOME_CX`**, ao lado do `APP_VER` no topo do
  script de cada painel. Tudo que é gerado por JS lê dali: os 5 rodapés de
  relatório, os 4 rodapés de PDF de paradas, o título do popup do histórico, o
  resumo do WhatsApp, a notificação e a 1ª linha do XLSX de fechamento.
  **Continuam literais** só os que nascem antes do script rodar: `<title>`, a
  meta do iOS, os `<h1>` dos cabeçalhos de impressão e o rodapé da tela.
- ⚠ **O nome estava PARTIDO POR TAG no `_rpCabecalho`** (`RITMO<span>PROD</span>`)
  — invisível para qualquer `grep RITMOPROD`. É o cabeçalho dos **oito**
  relatórios: escapasse, o PDF sairia com o nome antigo na mesa da reunião.
  Quando for procurar nome de marca, procurar também **pedaços** dele.
- **O que NÃO se renomeia, e por quê:**
  - **Os arquivos** (`ritmoprod_embalagem_v7.html`, `ritmoprod_mobile.html`,
    `ritmoprod_appscript.gs`). Ninguém os vê — a URL pública é `/` e `/mobile`.
    Renomear quebra os rewrites do `vercel.json`, as **sete** suítes de teste, o
    `lint-js.js` e os 6 textos de tela que mandam colar o `.gs` no editor.
  - **O prefixo dos XLSX exportados** (`ritmoprod_*.xlsx`): é formato de saída.
  - **As chaves do `localStorage`** (`rpe_*`, `rp_mob_ver`, `rp_core_try`). É por
    elas que a troca de nome **não perde** URL do Apps Script salva no aparelho,
    logo enviado nem cenário do simulador. **Nunca renomear chave por estética.**
  - **O `id` dos manifests** (`/` e `/mobile`): mudar faz o Chrome tratar como
    app NOVO — o operador fica com dois ícones e continua abrindo o velho. Só
    `name`/`short_name` mudam.
  - **A tag da notificação** (`ritmoprod-lancamento`) — identificador interno.
- **O SLOGAN é `Medimos o pulso da·linha.`** e vai em **toda impressão**: o
  `_rpCabecalho` (uma implementação, oito relatórios) e os dois cabeçalhos de
  impressão do painel (`#ph-gerencial`, `#ph-historico`).
  - **A forma é da marca, não nova:** o ponto de **destaque é o FINAL**; o `·` do
    meio é texto normal. Já era assim no login e no rodapé — não inventar outra.
  - ⚠ **A capa da GESTÃO DE PERDAS é medida para caber na folha 1** (paisagem).
    O slogan ocupa ~12px, então `.deitado .rp-header` devolve o mesmo em **ar**
    (padding/margem, nunca fonte de leitura). Mexeu no cabeçalho? Refazer a conta.
- ⚠ **Largura:** `RITMOPATRIMAR` tem 13 caracteres contra 9 de `RITMOPROD`. Os
  pontos apertados são o logotipo do rodapé da TV, o `<h1>` do cabeçalho de
  impressão e o rodapé dos PDFs. Não há largura fixa nem `nowrap` neles — mas
  isso é leitura de CSS, não folha impressa conferida.
- `relatorios.test.js` prende tudo isso: a constante, os cinco rodapés, os quatro
  rodapés de PDF, a assinatura do WhatsApp, o slogan nas três superfícies de
  impressão e a compensação da paisagem — e **falha se o nome antigo voltar**.

## Cores do painel — azul-marinho, TV preta (v7.115.0 / mobile 1.29.0)
- Pedido do PPCP, 25/09/2026, a partir de uma maquete do ChatGPT — **só a
  cor foi adotada**, o conteúdo da maquete não (ver aba UEP v7.114.0).
- Os tokens do `:root` dos dois HTMLs: `--bg:#0B1622 --surface:#111F30
  --elevated:#16273B --border:#223550 --txt2/--txt3:#8FA0B5 --ok:#2ECC71
  --red:#F5554A`. O `--red` foi clareado porque o `#F44336` dava 4,1:1 como
  texto sobre o `--elevated` azul.
- ⚠ **A TV CONTINUA PRETA** (*"tv mantém"*): `html.sem-splash, #sec-tv,
  body.tv-fullscreen` devolvem os tokens antigos e o fundo `#111111`. A TV é
  lida a 15 m e o contraste dela foi medido no preto. `relatorios.test.js`
  prende as duas coisas.
- O `#sec-simulador` tinha cinzas próprios (teste de superfície); viraram os
  mesmos degraus em azul. Cor literal do Chart.js (grade `#1E1E1E`) não segue
  token — ficou como estava, discreta nos dois fundos.
- **Não adotar borda colorida por card** (a maquete pintava cada card de uma
  cor sem significado): cor só onde há função.

## Notas de versão e glossário
- `CHANGELOG.md` — uma entrada por publicação. **"Atenção" é obrigatório em toda
  mudança que altera número exibido ou formato de arquivo**, com o antes e o
  depois: o gestor precisa saber por que o indicador da semana passada mudou.
  Mudança no `.gs` vem marcada com ⚠ **re-deploy**, porque não sobe pela Vercel.
- `docs/glossario.md` — cada indicador da interface com a fórmula **conferida no
  código** e o `arquivo:linha` de onde ela saiu. A interface e o glossário não
  podem divergir; se divergirem, o defeito é da interface. Nunca escrever
  fórmula de memória aqui — ler o código.
- Os dois nasceram em 31/08/2026: até a v7.25.0 o único rastro de versão era o
  `APP_VER` no rodapé, e nenhum indicador tinha definição escrita fora do código.

## Notas / armadilhas conhecidas
- **O RITMO ATUAL da Tela B é maior que PESO/PONTOS de propósito** (pedido do
  PPCP, 24/08/2026: *"ritmo atual está muito pequeno na TV"*). Os três dividem
  o visual `.tvb2-substat`, mas `#tvb-kpi-ritmo` tem escala própria: ritmo é o
  pulso da linha, peso e pontos são conferência. O `flex-wrap` centrado da
  linha absorve o crescimento — se não couber ao lado, o ritmo desce inteiro
  para a linha de baixo. Não voltar a igualar os três.
  - **A escala é adaptativa pelo nº de substats ligados** (27/08/2026, mesmo
    pedido de novo — na TV do gestor PESO e PONTOS estão desligados e o ritmo
    continuava no tamanho pensado pros três). `_sincSlideB` põe o `data-n` na
    `.tvb2-substats`, igual ao rail da direita: **1** ligado → ~184px em
    1080p (era 104), **2** → ~146px, **3** → ~119px. Linha vazia some inteira,
    senão sobraria a borda de cima sem nada embaixo.
  - **O teto é `min(vw,vh)`, não `vw` puro.** Medido: com o número solto pela
    largura, na janela do gerencial (mais baixa que 16:9) o bloco saía da tela.
    Pelo mesmo motivo o `.tvb-hero-num` ganhou `min(19vw,34vh)` — em 16:9 (a TV
    do chão de fábrica) e em tela mais alta o 19vw continua menor e **nada
    muda**; o limite só entra onde a altura é o que falta.
- **Cor de gráfico do Chart.js NÃO aceita token CSS.** O desenho é no `<canvas>`,
  que não resolve `var(--ok)`: a cor vira inválida e sai no **preto padrão**. Foi
  o que aconteceu com a linha **Ef.%** do gráfico do HISTÓRICO — quase invisível
  no fundo escuro, enquanto a régua da direita continuava verde porque já usava
  `#4CAF50` na mão. Em `mkChart`, cor é **literal**, sempre.
  - A régua da direita (`y2`) tinha **teto fixo em 150%** e cortava a linha no
    meio do gráfico em dia de meta baixa (13/08/2026 fechou em **179,5%**). O
    teto acompanha o dado (dezena acima do pico), com **piso de 120%** para o
    100% não encostar no topo em período fraco, e dia sem meta vira **buraco na
    linha**, não pico de `Infinity`.
- **Média nos relatórios (semanal e histórico)**: a base é **dias com produção no
  período** (as linhas que o relatório já lista), não dias corridos — mesma base
  do "Média / dia" das outras telas; sábado/domingo/feriado não entram porque não
  têm produção lançada. O `_svgBarChart` (usado pelos dois) desenha a **linha
  tracejada da média do realizado** e mostra o valor **na legenda** — o rótulo
  em cima da linha tapava a produção/eficiência do dia mais próximo dela. Pela
  mesma razão os números das barras são desenhados **depois** da linha e com
  halo branco (`paint-order="stroke"`).
- **A barra do `_svgBarChart` mostra o que veio de HORA EXTRA** (pedido do
  usuário, 31/08/2026: *"deixa claro as qtdes feitas nas horas extras"*): fatia
  **listrada âmbar** no topo da barra do dia + a quantidade escrita
  (*"264 cx em HE"*) + a legenda. A barra só dizia o total, e uma sexta com
  100,6% parecia dia que bateu a meta dentro do turno com 264 das 1.509 caixas
  feitas depois das 17:00 — enquanto o selo, o card EFIC. SEM H. EXTRA e a faixa
  de alerta, **no mesmo papel**, já diziam o contrário.
  - A fatia vai **por cima** do topo da barra, não empilhada por baixo: assim o
    período **sem HE desenha exatamente o gráfico de antes** (mesma regra da
    coluna H. EXTRA, que some quando ninguém fez hora extra).
  - **Dia com `heCx` null entra INTEIRO como jornada normal** — o mesmo critério
    dos totais do relatório. Inventar fatia ali seria afirmar o que o dado não
    sustenta.
  - Com HE o topo do SVG abre 26px para o 3º rótulo (`viewBox` 180 → 206) e a
    legenda anda 90px para a esquerda; **a altura do gráfico (`ch`) não muda** e
    a linha da MÉDIA fica onde estava, senão as barras encolheriam de um
    relatório para o outro.
  - **Em período longo o rótulo sai e a fatia fica** (`slot>=58`): a 15/30 dias
    as barras ficam a ~20px uma da outra e três textos por barra viram borrão.
  - As cores do dia continuam saindo de `d.ef` (≥96 verde, ≥90 âmbar): a fatia
    conta de onde veio a produção, **não** muda o veredito de nenhum dia.
- **Coluna MOTIVO do relatório de paradas**: é o texto livre que o operador digita
  no mobile (coluna **G** da aba `PARADAS`, campo `obs`) — opcional, ninguém é
  obrigado a preencher. No **DETALHAMENTO** do relatório a coluna **some quando
  nenhuma parada do período tem motivo** (senão vira uma parede de `—`); basta uma
  única parada preenchida para ela voltar. Se mexer, manter `<th>` e `<td>` sob a
  mesma condição — e o `colspan` do "Nenhuma parada no período" acompanha.
- Os botões **"SELECIONAR PASTA/Google Sheets"** e **"arquivo avulso"** (📄)
  saíram do cabeçalho do v7 — os dados vêm sempre do Sheets e eles só
  confundiam. As funções de Excel local (`selecionarPasta`/`triggerImport`/
  `handleFileInput`) continuam no código, sem botão (as duas primeiras no
  `SEM_USO_OK` do `lint-js.js`; o `handleFileInput` é chamado pelo onchange
  do `#file-input`); os `getElementById`
  de `btn-pasta` têm guarda de null (o de `processarResposta` roda a cada
  `lerSheets` — sem guarda, quebraria o painel inteiro).
- **Modo DEMO** (produção zerada, horários genéricos
  tipo `12:12-13:12`): aparece quando a chamada ao Sheets dá **timeout**. Quase
  sempre é **cold start do Apps Script**, não perda de dados. NÃO é causado por
  mudanças de front-end.
  - **Só zera na TV**: a TV se recarrega sozinha a cada 28 min (anti-sleep WebOS,
    `setTimeout(location.reload, 28min)`). Se o reload pega o Apps Script "frio",
    o `lerSheets` estoura e cai no DEMO. O auto-refresh normal (5 min) NÃO zera —
    em falha mantém os últimos dados.
  - **Mitigação já aplicada:** timeout do `jsonpFetch` = **25s** e a carga inicial
    usa `lerSheetsComRetry(4)` (reconecta antes de desistir). Manter assim.
- **Aba PARADAS "sumindo" no refresh** (seção 1 em `CARREGANDO…` enquanto o resto
  segue com dados): **não é queda de conexão**. Cada render dispara 2×
  `getParadasPeriodo` (período + comparativo) e o backend lê a aba `PARADAS`
  **inteira** (`getDataRange`) antes de filtrar — o custo cresce com o histórico
  todo, não com o período escolhido.
  - **Mitigação já aplicada:** no refresh do mesmo período os KPIs **ficam na
    tela** (esmaecidos + `atualizando…` ao lado do título da seção 1); só troca de
    período/classe limpa o grid. `renderAnaliseParadas()` tem **guarda de
    reentrância** (ciclos não se empilham) e o `getHistory` tem **cache de 2 min**
    (`invalidarHistoricoCache()` no refresh manual).
  - Se falhar com dados já em tela, mantém os últimos números e marca
    `⚠ não atualizou — dados de HH:MM:SS`. **Intervalo de refresh curto (1 min)
    piora tudo**: o ciclo não termina antes do próximo. Recomendado 5 min.
- **Alerta de "hora fraca" (⚠)**: compara a produção de hoje (`HORA_A_HORA`) com a
  média histórica por horário (`HISTORICO_HORA`, via `action=getMediaHoras`).
  Só dispara com **≥2 dias** de amostra e produção **>15% abaixo** da média.
  - A comparação de horário é **imune ao tipo de traço** (`normHora`/`mergeMedias`
    normalizam `-`, `–`, `—` e espaços). Manter assim.
  - Na **TV** o marcador é **só `⚠`** (sem texto `<méd>`): o texto longo quebrava a
    linha, aumentava a altura e empurrava o último horário para fora da tela.
    Na **gerencial** também é só `⚠` (média no tooltip).

## Padrão do código (v7.248.2) — o que saiu do código
Trecho da seção *Padrão do código e revisão* do CLAUDE.md, que ficou só com as
regras.

- **O Exportar Excel do HISTÓRICO saiu** (`exportarExcel`): nenhum botão o
  chamava desde antes de 06/11/2026 — a correção do cabeçalho da v7.202.0 foi
  feita numa função que ninguém podia usar. PPCP, 16/11/2026: o botão não volta.
  A biblioteca XLSX fica: o fechamento do dia e a importação ainda a usam.
- Saiu na v7.248.2, sem uso: `exportarExcelHist`, `toISO`,
  `updateRefreshBadge`, `_gerCxComHora`, `_phTrocaTxt`, `_durMinPar`,
  `_diasTrabalhadosPar`, `_svgDiaHora`, as constantes `TKS_N_SEM` e
  `PAR_PLANEJADA` (cópia do `PLANEJADA_RE` do `paradas-calc.js`), e a amostra
  da FILA antiga (`_filaAmostra`, `_filaAmostraDeItens`, `FILA_AMOSTRA_DE`,
  `FILA_LS*` — sem leitor desde a v7.216.0; o GRAVAR UEP nunca a leu) no PC;
  `produtoPorEan`, `_horasProdMob`, `_durMin2` no celular; e 21 variáveis
  locais calculadas e nunca usadas (conferidas uma a uma: sobras, nenhuma
  escondia defeito).
- ⚠ **A XLSX não é só do exportar**: o botão FECHAR DIA chama o
  `exportarExcelDia` (o Excel do fechamento) antes do `salvarDiaSheets`. Até a
  v7.248.1, sem a biblioteca (cdnjs barrado), o erro parava o fechamento antes
  da planilha; desde a v7.248.2 o Excel que falha só avisa. Não tirar o
  `<script>` da XLSX sem tirar esse Excel junto.

## O site publica só o painel — `.vercelignore` (16/11/2026)
- PPCP, 16/11/2026: *"FAÇA"*. Conferido pela ferramenta da Vercel antes: a
  produção servia o `CLAUDE.md` (status 200) — e, sem `.vercelignore`, todo o
  repositório: `docs/`, `CHANGELOG.md`, o `ritmoprod_appscript.gs`, os testes, o
  `.claude/` e dois prints da diretoria (`dir_1366.png`, `dir_1920.png`).
- **Lista do que SAI** (`/*` e depois `!arquivo`, o formato da documentação da
  Vercel), e não lista do que esconder: documento, teste ou print novo nunca
  vaza por esquecimento. O risco contrário — um arquivo que o painel carrega
  ficar de fora e dar 404 — é o que o `deploy.test.js` prende: ele lê os dois
  HTMLs (sem os comentários), os manifests (ícones), o `sw-mobile.js` e o
  `vercel.json`, e exige que tudo o que eles pedem esteja liberado e exista; e
  que nada interno (`.md`, `.gs`, `*.test.js`, `lint-js.js`, `testes.js`, pasta
  oculta, `docs`) esteja. Só entende `!nome-na-raiz`: padrão com barra, curinga
  ou pasta reprova o teste (mudaria o que sai sem ele perceber).
- Fora da lista de propósito: `manifest.webmanifest` (órfão) e os dois prints.
  O pdf.js vem do cdnjs, não do site.
- Conferido na prévia da Vercel antes do merge: o painel, o celular e os
  módulos com 200; o `CLAUDE.md`, o `.gs` e o `docs/` com 404.
