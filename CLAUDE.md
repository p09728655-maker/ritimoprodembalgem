# RitmoProd · Embalagem — Memória do projeto

Painel de ritmo de produção (Patrimar Móveis · Embalagem · Jaci/SP).
Front-end estático (HTML/JS) publicado na Vercel; dados vêm de um Google Sheets
via Google Apps Script (JSONP).

## Arquivos
- `ritmoprod_embalagem_v7.html` — painel desktop (telas **GERENCIAL** e **TV OPERACIONAL**).
- `ritmoprod_mobile.html` — painel mobile.
- `paradas-calc.js` — **cálculo de paradas, implementação ÚNICA** usada pelos
  dois painéis (`<script src="/paradas-calc.js">`). Ver a seção de paradas.
- `paradas-calc.test.js` — teste de paridade: `node paradas-calc.test.js`.
- `ritmoprod_appscript.gs` — backend (Apps Script). **Mudanças aqui NÃO sobem pela
  Vercel**: precisam ser coladas no editor do Apps Script e **re-deployadas** manualmente.
- `vercel.json` — `/` → v7, `/mobile` → mobile.
- Deploy front-end: automático pela Vercel ao dar merge na `main`.

## ⚠️ NÃO ALTERAR sem pedido explícito
- **Horário do turno / rótulos dos slots.** O slot pós-almoço é **`12:12-13:00`**
  (mais curto por causa do almoço) — **não** é `12:12-13:12`. Preservar os rótulos
  exatamente como estão na planilha `HORA_A_HORA`.
- **A conexão com o Google Sheets** (`CFG.sheetsUrl` / lógica de `lerSheets` /
  `jsonpFetch`). Não mexer na URL nem no fluxo de conexão.

## Início do turno (célula C3)
- As linhas de **05:00** e **06:00** existem **sempre** na aba `HORA_A_HORA`. Quem
  decide se elas aparecem para o operador é a célula **`C3`** (linha 3, coluna C):
  **`5` → turno começa 05:00** (dia com hora extra matinal, mostra 05:00/06:00);
  **`7` ou vazio → 07:00** (turno normal, esconde 05:00/06:00).
- O **backend** (`ritmoprod_appscript.gs`, função de leitura) lê `C3`, filtra os
  slots anteriores ao início e ainda devolve `turnoInicio` no JSON. Como o filtro
  é no backend, **mobile, TV e gerencial** ficam consistentes de uma vez.
  Lembre: mudar o `.gs` exige **re-deploy manual** no editor do Apps Script.

## Tela cheia de PARADA (ao vivo)
- O operador **registra a parada e dá o START no mobile** (`ritmoprod_mobile.html`,
  modal PARADAS): escolhe o tipo, escreve o **motivo** e a parada fica **em
  andamento** (linha sem `FIM` na aba `PARADAS`). Ao voltar a produzir, dá **START**
  (encerra → carimba `FIM`).
- A **TV OPERACIONAL** (`ritmoprod_embalagem_v7.html`) faz *poll* de `getParadas`
  (15s) e, havendo parada **sem FIM**, mostra uma **tela cheia** (`#tv-parada-over`,
  dentro de `#sec-tv`) com tipo + motivo + cronômetro. Some sozinha quando o START é
  dado. É chamada JSONP separada — se falhar, **não** derruba os dados nem cai no DEMO.
- Backend: `saveParadas` virou **upsert por ID** e há a ação **`endParada`** (carimba
  `FIM`/`DURACAO`). ⚠️ Mudou o `.gs` → **re-deploy manual** no Apps Script.
- **Tipos de parada (dropdown) são editáveis na planilha:** aba **`TIPOS_PARADA`**
  (coluna A). O mobile lê via `getTiposParada` (criada com padrões na 1ª vez). O
  *motivo* continua **texto livre** digitado pelo operador — não se cadastra.

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
- Antes de confiar: rode **`simularArquivamento()`** no editor (só lista o que
  sairia). **`arquivarConcluidosAgora()`** faz a limpeza inicial de uma vez.
- ⚠ Mudou o `.gs` → **re-deploy manual** no Apps Script.

## Caixas perdidas em parada (mobile)
- **Card PARADAS (gerencial do mobile)** tem seletor `#par-periodo`: **HOJE**
  (padrão, usa `PARADAS_HOJE` que já vem do `getParadas`) ou **7/15/30 dias**
  (`getParadasPeriodo`). Os 4 mini-KPIs — tempo parado, disponibilidade,
  **CAIXAS PERDIDAS** e nº de paradas — recalculam para o período escolhido.
- **Resumo do HISTÓRICO** ganhou o bloco **CAIXAS PERDIDAS EM PARADAS**, que
  segue o filtro 7/15/30 que já existia ali (e que **exclui hoje** — por isso o
  número dele não bate com o do card de PARADAS, que inclui hoje).
- **O ALMOÇO (11:00–12:12) fica FORA de tudo** (`durProdutiva`). As horas
  produtivas do turno já descontam o almoço; contá-lo como parada desconta duas
  vezes — inflava o tempo parado, o nº de paradas e ainda punha o ALMOÇO no topo
  dos ofensores.
  - **Não basta excluir paradas do tipo "almoço":** o caso real era uma
    `Finalização de Lote` das **10:56 às 12:18** contada como **1h22m**. Ela
    *atravessa* o almoço. A regra é recortar: conta só o que cai em tempo
    produtivo (4 min antes + 6 depois = **10 min**).
  - Parada inteiramente dentro do almoço vira 0 e **sai da análise e da lista**
    (nos dois painéis) — se aparecesse na lista sem entrar no KPI, a soma na tela
    não fecharia. Quanto foi excluído aparece no `diag`
    (`minAlmocoExcluidos`/`paradasNoAlmoco`) e na linha de diagnóstico.
- **Como o número sai:** `cx = duração produtiva × (meta DAQUELE DIA ÷ horas
  produtivas do turno)`, só para paradas **não planejadas** (refeição/intervalo/
  almoço, ou classe `PLANEJADA` na `TIPOS_PARADA`, contam 0). Parada **em
  andamento (sem FIM) não entra** — sem fim não há duração.
  - **É a meta de cada dia, não a de hoje.** A perda de uma parada de 20/07 usa a
    meta de 20/07 (`metaByDay`, vindo do `HISTORICO`); hoje usa a meta da
    `HORA_A_HORA`. Usando só `CFG.metaDia` para tudo, o mobile dava **3.780** cx
    onde o desktop dava **3.897** no mesmo período de 30 dias.
- **A conta mora em `paradas-calc.js` (`RP_PARADAS`), UMA vez.** Os dois painéis
  carregam esse arquivo e só montam as entradas (`metaByDay`, `metaHoje`,
  `realByDay`, `classeMap`) — `_paradasStats` (v7) e `_statsParadasMob` (mobile)
  são adaptadores finos. **Não voltar a escrever conta de parada dentro dos
  HTMLs**: foi a duplicação que fez os dois divergirem três vezes seguidas (base
  de dias, meta por dia, classificação). `node paradas-calc.test.js` cobre a
  regra e ainda falha se `pecas+=perd` ou `totMinNP+=d` reaparecer nos HTMLs.
- **`RP_PARADAS.stats()` devolve `diag`** com as entradas que valeram: ritmo,
  horas produtivas, dias sem meta, nº de classes carregadas, tipos tratados como
  planejados, paradas sem fim e a base de dias. `RP_PARADAS.diagTexto(diag)`
  vira a linha que **as duas telas mostram** — é por ela que se descobre por que
  divergiram, sem abrir o código.
- ⚠ `paradas-calc.js` tem `Cache-Control: must-revalidate` no `vercel.json`. Sem
  isso um deploy poderia servir a conta antiga junto com o HTML novo.
- **Nada de paradas pode LANÇAR se o `paradas-calc.js` não carregar** (rede caiu
  entre o HTML e o JS, deploy parcial, `file://`). Um throw dentro do render
  matava o resto do login gerencial do mobile (hora a hora inclusive) e deixava
  a aba PARADAS do desktop presa em "CARREGANDO…". Os pontos de entrada têm a
  guarda `_rpOk()`/`_rpRecarregar()` (mostra "recarregando módulo" e busca o
  arquivo de novo sozinho, retry de 15s). O `sw-mobile.js` **pré-cacheia** o
  arquivo na instalação e devolve **503 explícito** em cache miss (antes
  `respondWith(undefined)` derrubava a requisição com erro opaco).
- **Chamadas JSONP de paradas: SEQUENCIAL com retry, nunca `Promise.all`.** O
  Apps Script atende uma execução por vez — em paralelo as chamadas só se
  enfileiram lá e, no cold start, estouram o timeout de 25s todas juntas (era o
  "NÃO CARREGOU" da aba PARADAS). A 1ª chamada paga o cold start com até 3
  tentativas e backoff; as secundárias vão depois, com o servidor quente.
- **As classes de parada têm que estar carregadas nos dois.** O gerencial do
  mobile **não** chamava `carregarTiposParada()` (só o operador e o modal
  chamavam), então o `PAR_CLASSE_MAP_M` ficava vazio e a classificação
  planejada/não-planejada caía na heurística por nome, enquanto o desktop usava
  a coluna CLASSE da `TIPOS_PARADA`. Tipo marcado PLANEJADA na planilha mas com
  nome fora de `/refei|interval|almo/` (ex.: `Parada/Café`) contava como perda
  só no mobile.
- **Quando os números divergirem, comparar o RITMO antes de tudo.** Os dois
  mostram a base do cálculo na tela (`duração × N cx/h — meta do dia ÷ Xh
  produtivas`). Ritmo diferente = meta ou horas produtivas diferentes; ritmo
  igual com total diferente = classificação de parada ou período diferente.
- **A base da média é DIAS TRABALHADOS, não dias com parada nem dias corridos.**
  `_diasTrabalhados(n)` conta os dias do `HISTORICO` com produção dentro dos
  últimos n dias (+ hoje, se já produziu) — sábado, domingo, feriado e parada de
  fábrica ficam de fora sozinhos, porque não têm produção lançada. O KPI
  **MÉDIA DIÁRIA** (4º card, no lugar do "nº de paradas" quando o período não é
  HOJE) e a **disponibilidade** usam essa base.
  - Por que não dividir por "dias com parada": o dia trabalhado que rodou sem
    parar — o melhor dia — sumiria da conta e a média subiria sozinha. Medido:
    15 dias com 11 trabalhados e parada em 3 → 62 cx/dia na base certa contra
    227 cx/dia na base errada.
  - No **HISTÓRICO** a base são os próprios dias da lista (dias com turno
    fechado), a mesma do "Média / dia" de produção logo acima.
  - **No desktop é a mesma coisa** (`_diasTrabalhadosPar`, a partir do
    `realByDay`): a aba PARADAS mostrava 82,2% de disponibilidade em 30 dias
    dividindo por 14 dias com parada; com os 22 dias trabalhados dá 90%, igual
    ao mobile. Os rótulos dizem "dia(s) trabalhados" ou "dia(s) com parada" para
    deixar claro qual base está valendo.
  - Se o histórico ainda não carregou, `_diasTrabalhados` devolve 0 e a conta cai
    no antigo "dias com parada" — o rótulo do card diz qual base está valendo.
- **Detalhe recolhido:** top ofensores + comparativo + lista ficam atrás do botão
  **VER DETALHES · N parada(s)**. Com 15/30 dias a lista empurrava a tabela hora
  a hora e o histórico pra longe. A escolha do usuário fica guardada
  (`PAR_DET_ABERTO`) — senão o refresh de 1 min fechava tudo no meio da leitura.
- ⚠ `getParadasPeriodo` lê a aba `PARADAS` **inteira** antes de filtrar (ver nota
  mais abaixo). Por isso cada período fica em **cache de 5 min** — o card
  (`PAR_PER_CACHE`) e o histórico (`HIST_PERD_CACHE`) — e o botão **ATUALIZAR**
  derruba os dois. **Não tirar o cache**: o refresh de 1 min refaria a leitura
  toda e a seção voltaria a piscar `CARREGANDO`.

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
- **`getPontosDia` é a chamada mais cara.** Sozinha ela lê o catálogo
  `PRODUTO_CODIGO` **3×** na mesma execução (`:1204`, `:1218` e de novo dentro de
  `calcularProgramacao()` em `:1599`), mais `PRODUCAO_PRODUTO` inteira, mais
  `PROGRAMACAO` + `PROGRAMACAO_CONCLUIDA`.
- **Ciclo do mobile (escalonado, uma chamada de cada vez):** tick base de **90s**
  só para o `getParadas` (banner de PRODUÇÃO PARADA quase ao vivo); `lerSheets`
  a cada 2 ticks (3 min); `getHistory` + `getPontosDia` a cada 4 ticks (6 min).
  Dá ~90 chamadas/hora contra as 240 do ciclo antigo de 1 min. Medido no
  navegador: login = 8 chamadas, 12 min de refresh = 16, botão ATUALIZAR = 5.
  - `cicloRefresh()` tem **guarda de reentrância** e roda em `await` sequencial —
    em paralelo as chamadas só se enfileiram no Apps Script (uma execução por
    vez) e ainda competem com o que o operador está salvando.
  - **Não voltar a disparar tudo junto no login.** A carga inicial é uma cadeia
    (`lerSheets → lerHistorico → lerPontosDia → lerMediaHoras`); antes o
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
- **Ainda por fazer (exige re-deploy manual do `.gs`):** ler só as últimas
  linhas da `PARADAS` em vez da aba toda.

## Notas / armadilhas conhecidas
- **Coluna MOTIVO do relatório de paradas**: é o texto livre que o operador digita
  no mobile (coluna **G** da aba `PARADAS`, campo `obs`) — opcional, ninguém é
  obrigado a preencher. No **DETALHAMENTO** do relatório a coluna **some quando
  nenhuma parada do período tem motivo** (senão vira uma parede de `—`); basta uma
  única parada preenchida para ela voltar. Se mexer, manter `<th>` e `<td>` sob a
  mesma condição — e o `colspan` do "Nenhuma parada no período" acompanha.
- Os botões **"SELECIONAR PASTA/Google Sheets"** e **"arquivo avulso"** (📄)
  saíram do cabeçalho do v7 — os dados vêm sempre do Sheets e eles só
  confundiam. As funções de Excel local (`selecionarPasta`/`triggerImport`/
  `handleFileInput`) continuam no código, sem botão; os `getElementById`
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
