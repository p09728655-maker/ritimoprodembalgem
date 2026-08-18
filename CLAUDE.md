# RitmoProd · Embalagem — Memória do projeto

Painel de ritmo de produção (Patrimar Móveis · Embalagem · Jaci/SP).
Front-end estático (HTML/JS) publicado na Vercel; dados vêm de um Google Sheets
via Google Apps Script (JSONP).

## Arquivos
- `ritmoprod_embalagem_v7.html` — painel desktop (telas **GERENCIAL** e **TV OPERACIONAL**).
- `ritmoprod_mobile.html` — painel mobile.
- `rp-core.js` — **núcleo comum dos dois painéis, implementação ÚNICA**:
  formatação (`p2`/`fmtN`/`fmtP`), horário (`toMin`/`fromMin`/`normHora`), data
  (`hojeStr`/`dtToStr`), `mergeMedias`, `calcAtrasoHoras`, `sc`. Só função
  **pura** entra aqui — nada que leia `DADOS`/`CFG` ou toque no DOM.
  `node rp-core.test.js` cobre a regra e falha se algum HTML voltar a declarar
  a própria cópia.
- `paradas-calc.js` — **cálculo de paradas, implementação ÚNICA** usada pelos
  dois painéis (`<script src="/paradas-calc.js">`). Ver a seção de paradas.
- `paradas-calc.test.js` — teste de paridade: `node paradas-calc.test.js`.
- `relatorios.test.js` — contas dos relatórios (janela da semana, KPIs, hora
  extra) + guarda-corpo das peças comuns: `node relatorios.test.js`.
- `hora-extra.test.js` — teste da separação hora normal × hora extra, rodando
  contra o código real do `.gs`: `node hora-extra.test.js`.
- `apps-script.test.js` — memo de leitura do backend, com planilha de mentira
  que conta leituras: `node apps-script.test.js`.
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
  - Exceção registrada (17/08/2026): a implantação antiga (`AKfycbwxFFLq…`)
    parou de responder — o painel passou a mostrar *"Erro ao carregar script —
    URL inválida ou sem acesso"* e caiu para o cache local. Foi criada uma
    implantação nova e a URL foi trocada nos DOIS HTMLs, a pedido do usuário.
  - **A URL do editor não é a URL do app.** `/home/projects/<id>/edit` é a tela
    de código; o painel precisa da URL do **App da Web**, que tem ~73 caracteres
    de ID e termina em **`/exec`**. A tela do Apps Script mostra essa URL
    **truncada com "…"** — copiar o texto de lá gera uma URL pela metade, que dá
    exatamente o mesmo erro. Usar o botão **Copiar** abaixo de *URL* (não o de
    *Código de implantação*) ou abrir o link e copiar da barra do navegador.
  - ⚠ **`localStorage['rpe_cfg']` tem prioridade sobre a URL do código**
    (`CFG={...CFG,...JSON.parse(s)}`). Quem já salvou uma URL nas configurações
    do painel continua com a dele mesmo depois do deploy — nesse caso, corrigir
    no campo *URL DO APPS SCRIPT* e salvar, ou limpar o campo para voltar ao
    padrão do código.

## Início do turno (célula C3)
- As linhas de **05:00** e **06:00** existem **sempre** na aba `HORA_A_HORA`. Quem
  decide se elas aparecem para o operador é a célula **`C3`** (linha 3, coluna C):
  **`5` → turno começa 05:00** (dia com hora extra matinal, mostra 05:00/06:00);
  **`7` ou vazio → 07:00** (turno normal, esconde 05:00/06:00).
- O **backend** (`ritmoprod_appscript.gs`, função de leitura) lê `C3`, filtra os
  slots anteriores ao início e ainda devolve `turnoInicio` no JSON. Como o filtro
  é no backend, **mobile, TV e gerencial** ficam consistentes de uma vez.
  Lembre: mudar o `.gs` exige **re-deploy manual** no editor do Apps Script.

## Caixas em HORA NORMAL × HORA EXTRA
- **Hora extra é a linha marcada, e só ela.** O botão HORA EXTRA (modal do
  desktop) grava a linha na `HORA_A_HORA` com o rótulo **prefixado**:
  `HE 17:00-18:00`. Os slots **05:00/06:00 NÃO são hora extra** aqui — são horas
  de turno liberadas pela célula `C3` (ver seção acima).
  - Antes a linha era gravada como `17:00-18:00`, **indistinguível de uma hora de
    turno** — enquanto o resto do `.gs` já classificava por `startsWith('HE')`
    (fechamento e limpeza diária). Resultado: a contagem `HE` do `HISTORICO`
    fechava em 0 e a limpeza não apagava a linha extra. `_ehHoraExtra()` /
    `_semPrefixoHE()` são a implementação única desse critério no backend; o
    prefixo sai antes do parse do horário, senão o início viraria `HE 17:00`.
  - A HE **nunca** é filtrada pelo início do turno: ela é extra justamente por
    estar fora da janela (inclusive uma HE de madrugada num dia com `C3=7`).
- `getDados` devolve **`he:true`** por slot; v7 e mobile propagam isso para
  `DADOS`. `calcKPIs` (nos dois) devolve `realHE` / `realNormal` / `nHE` — é daí
  que saem o card **CAIXAS EM HORA EXTRA** (gerencial e mobile), o subtítulo do
  PRODUÇÃO REAL e o `CAIXAS · X NORMAL + Y EXTRA` da **Tela B** da TV.
  - O card só aparece **quando o dia teve HE** — sem hora extra ele diria "tudo
    normal" e só empurraria os outros KPIs para baixo.
  - Na TV o texto é de **uma linha** e vai na Tela B (`#tvb-prod-unit`): a Tela A
    tem `.tv-left{display:none}` — o `#tv-he-split` que mora lá só aparece no
    layout estreito. Linha que quebra empurra o resto da tela para fora.
- **Histórico: a coluna `HE CX`** (11ª da aba `HISTORICO`) guarda as caixas de
  hora extra do dia; `arquivarDiaAtual` e `saveDay` gravam. `getHistory` e
  `getHoraDia` devolvem `heCx` + `realNormal`.
  - **Dia antigo (fechado antes da v5.0)**: a coluna está vazia. Aí o `.gs`
    deriva `REALIZADO − soma(HISTORICO_HORA do dia)` — funciona porque
    `arquivarHorasDoDia` grava **só as horas não-HE**, então a diferença É a hora
    extra. Só deriva quando a coluna `HE` indica que houve HE; se o dia nem
    existe na `HISTORICO_HORA`, devolve **`null`** e a tela mostra **"—"**, nunca
    0 — zero afirmaria "não teve hora extra", coisa que o dado não sustenta
    (`_heIndef()` no v7 é quem trata isso).
  - Nos totais (KPI do período, rodapé do relatório), dia indeterminado entra no
    **normal** para a soma fechar com o TOTAL, e o número de dias assim aparece
    ao lado ("N dia(s) sem separação de hora extra").
- **A coluna H. EXTRA some dos relatórios quando ninguém fez hora extra** no
  período (senão vira parede de `—`), mesma regra da coluna MOTIVO do relatório
  de paradas. Se mexer, manter `<th>`, `<td>` e o rodapé sob a mesma condição.
- **Reconstruir a HE dos dias antigos: `simularHoraExtraPassada()` /
  `preencherHoraExtraPassada()`** (rodar pelo editor do Apps Script). A aba
  `PRODUCAO_PRODUTO` guarda `DATA · HORA · CAIXAS` de cada lançamento. Conta
  como extra, por dia: em **dia útil**, o lançado **antes das 07:00** ou
  **depois das 18:00**; em **sábado e domingo, o dia INTEIRO** (não é jornada
  normal). A soma vira a `HE CX`.
  - **17:00–18:00 é hora NORMAL** em dia útil: o turno da planilha termina
    17:00, mas a hora extra só começa às 18:00.
  - **Sábado conta o dia todo** — confirmado com o PPCP no 04/07/2026 (sábado
    com produção das 05:00 às 16:00): a HE é o dia inteiro (**1.278 cx**, o
    próprio REALIZADO), não só as 388 cx lançadas antes das 07:00. A flag
    `HE_SABADO_INTEIRO` (hoje `true`) deixa isso explícito no código.
  - Simula primeiro: a função de simulação **não grava**, só lista no log — e
    informa quantas linhas leu, quantas aproveitou e quantas tinham **HORA
    ilegível**. "0 dias" sem esse diagnóstico não distingue "não teve hora
    extra" de "não consegui ler a planilha".
  - A coluna **HORA pode ser texto ou hora de verdade**: formatada como hora ela
    chega ao script como `Date`, e o parse por regex ignorava TODAS as linhas em
    silêncio. `_heMinutosDaHora` passa por `_horaStr()`, que trata os dois casos.
  - Dia que só existe no log (sem linha no `HISTORICO`) é avisado com `⚠` — não
    há onde gravar a `HE CX` dele.
  - A gravação **nunca sobrescreve** `HE CX` já preenchida, e rodar duas vezes
    não duplica. Para corrigir um valor gravado errado existe
    `recalcularHoraExtraPassada()`, que regrava tudo.
  - **Teto pelo REALIZADO**: hora extra maior que a produção do dia é
    impossível. Aconteceu no 04/07 (sábado, log de produto com 1.339 contra
    1.278 de realizado — lançamento duplicado). O valor é cortado no realizado e
    o log avisa, em vez de gravar um número que não fecha.
  - ⚠ **Cobertura**: a `PRODUCAO_PRODUTO` só recebe lançamento com **produto
    identificado**, o que é opcional no app. O log mostra, por dia, quanto do
    `REALIZADO` está coberto — cobertura baixa significa hora extra
    subestimada, e aí é melhor lançar o número na mão.
- ⚠ Mudou o `.gs` (v5.0) → **re-deploy manual** no Apps Script. Antes disso o
  front simplesmente não recebe `he`/`heCx` e as telas seguem sem a divisão.

## TELA D da TV — fechamento da semana passada
- A mesma leitura aparece em **dois lugares**: a Tela D do carrossel da TV e o
  bloco **FECHAMENTO DA SEMANA PASSADA** no fim da aba **GERENCIAL** (`#ger-semana`)
  — o gestor não precisa esperar o carrossel, nem estar na frente da TV.
- Quarta tela do carrossel (`#tv-slide-d`), no visual do app: logomarca Patrimar
  no topo como a Tela C e **nenhuma cor própria** — tudo sai dos tokens
  (`--ok` jornada normal, `--warn` hora extra, `--red` abaixo, `--acc`, `--txt`).
- **É gestão à vista, não relatório.** A TV é lida de longe e de passagem, então
  a tela não repete o texto do PDF: só o total da semana, a divisão jornada
  normal × hora extra, o **selo do veredito** e os 5 dias. Frase corrida a 15 m
  ninguém lê — foi por isso que o parágrafo do relatório ficou de fora.
  - O selo é o mesmo critério do relatório (`_relMetaHE`): **verde** só quando a
    jornada normal sozinha bateu a meta, **âmbar** quando quem bateu foi a hora
    extra, **vermelho** quando faltou. A barra mostra isso sem número: o verde
    para antes da **marca da META** e quem cruza é a faixa listrada âmbar.
- **Só entra no ciclo quando a semana anterior tem dia fechado** (mesma regra da
  Tela C, que exige atraso>0) — nunca aparece vazia.
- **A semana é a MESMA do relatório**: `_relSemanaPassada()` + `_relDiasDaSemana()`
  + `_relSemanalKPIs()`, as três compartilhadas. Não reescrever o recorte dentro
  da tela — foi a duplicação que fez a conta de paradas divergir três vezes.
- **A busca e o DESENHO moram no `RP_SEMANA`, uma implementação só.** `pintar(pfx)`
  desenha nos elementos do prefixo que recebe — `'tvd-'` na TV, `'gsem-'` no
  gerencial — e devolve `false` quando ainda não há semana (a Tela D nem entra
  no ciclo, o bloco do gerencial se esconde). `_sincSlideD` e `renderSemanaGer`
  são adaptadores de duas linhas. **Não escrever uma segunda cópia do desenho
  dentro do HTML** — foi a duplicação que fez a conta de paradas divergir três
  vezes; o `relatorios.test.js` roda o `pintar` real contra um DOM de mentira e
  falha se o cartão do dia a dia ou a busca reaparecerem em outro lugar.
  - A **marcação e as classes `.tvd-*` são as mesmas** nos dois; o que muda é a
    **escala**, num bloco de CSS scopado por `#ger-semana` (a TV é lida a 15 m e
    mede as fontes em `vw`; o gerencial é lido a 60 cm dentro de um card). Lá o
    dia a dia vira grade que **quebra** em tela estreita em vez de espremer 5
    colunas fixas.
  - `renderSemanaGer()` roda **antes** do `renderGerencial()` dentro de um `try`:
    não derruba o painel se o histórico falhar e não some quando algo adiante
    quebra (a Chart.js não carregar já deixou o rodapé sem versão assim).
  - No **PDF do dia** o bloco não vai (`#ger-semana` entra na lista de ocultos do
    `@media print`): a semana tem o relatório semanal dedicado, e o reset P&B da
    impressão comeria justamente as barras e o selo.
- **O histórico fica em cache de 30 min** (`RP_SEMANA.carregar`). O carrossel gira
  a cada ~20 s; buscar o `getHistory` nesse ritmo seria chamada jogada fora, já
  que o histórico só muda quando um dia é arquivado. Falhou a busca? Mantém o que
  está na tela. A busca é assíncrona: quem está em cartaz se redesenha por
  `RP_SEMANA.aoCarregar(...)`, sem cada tela ficar sondando o dado.
- Config: **TEMPO NA TELA D** (padrão **20 s**, mais que os 15 das outras porque
  tem mais o que ler) e o checkbox **TELA D**. ⚠ `telaD`/`tempoD` na
  `CONFIG_PAINEL` exigem o **.gs v5.2 re-deployado**; enquanto isso não acontece,
  `aplicarConfigPainel` **preserva** a marcação local do D em vez de apagá-la
  (a config antiga não traz a chave, e sem esse cuidado a TV ignoraria o gestor).

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
- **Gravar parada (REGISTRAR / START) retenta — não é chamada "solta".** Eram as
  únicas chamadas do mobile com **1 tentativa** e timeout de 20s, justamente as
  que mais pegam o Apps Script **frio** (o app fica minutos sem escrever nada).
  Resultado: `Erro ao dar start: Timeout` com a parada muitas vezes **já
  encerrada** do outro lado. Agora usam `jsonpEscritaParada()` — 25s × 3
  tentativas com espera crescente, em sequência, como o `lerSheets`. Repetir é
  seguro: `saveParadas` é upsert por ID e `endParada` só carimba o FIM.
  - **Falhou? Pergunta ao servidor antes de acusar erro.** Timeout ≠ não gravou.
    Os dois caminhos fazem `carregarParadas()` e só alertam se a parada **ainda
    estiver aberta** (ou ainda não existir). Sem isso o operador registrava a
    mesma parada de novo e o dia fechava com paradas duplicadas.
- **`_parEscrevendo` congela a tela de paradas durante a gravação.** O poll de
  90s caía no meio do START, refazia o `innerHTML` e trocava o botão
  "RETOMANDO..." (disabled) por um botão **novo e habilitado** — o operador
  tocava outra vez. `carregarParadas()` sai cedo enquanto a flag está de pé, e
  a flag também barra toque duplo.
- **`_parFechadasLocal` é o espelho do `_paradaLocalAberta`.** Havia seguro só
  para o sentido **abrir**: um `getParadas` defasado logo depois do START
  reabria a parada na tela e o painel voltava para "PRODUÇÃO PARADA". A máscara
  guarda `id → FIM carimbado` e **expira em 3 min** (ou quando o backend
  confirma o FIM) — nada de parada sumir da tela para sempre.
- **Parada sem ID na planilha não podia ser encerrada pelo celular.** Linha
  lançada à mão (ou com a coluna B limpa): o `getParadas` devolvia
  `id: Date.now()`, **um id novo a cada leitura**, e o `endParada` respondia
  `parada não encontrada` em todo toque no START — com a TV presa na tela cheia.
  Agora o id sem valor vira `'L'+linha` (**estável**) e o `endParada` tem
  fallback: **1)** ID → **2)** `DATA`+`INICIO` em linha aberta → **3)** se só
  existe **uma** parada aberta no dia, é essa (com duas, devolve erro em vez de
  chutar). O mobile manda `data` e `ini` junto; backend antigo ignora os extras.
  ⚠ Mudou o `.gs` → **re-deploy manual** no Apps Script.
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

## SWOT do relatório de paradas
- Seção **ANÁLISE SWOT DO PERÍODO** (`_relSwotParadas`, conta pura + testes no
  `relatorios.test.js`). **Cada frase só entra quando o dado do período a
  sustenta** — semana boa fica com fraquezas/ameaças em "—", nunca texto fixo.
  Regras principais: takt real ≤ ideal vira força ("velocidade não é o
  problema"); top ofensor não planejado vira fraqueza com a fatia do Pareto;
  "Outros" ≥10% do tempo vira fraqueza (sem causa nomeada não se ataca);
  perda a ritmo real vira oportunidade; troca/setup sugere SMED (nunca
  "eliminar"); ofensor que ocorre todo dia e %turno ≥10% viram ameaças (com
  projeção de 22 dias).
- ⚠ O `pega()` do `relatorios.test.js` começa a contar chaves **depois do `)`
  dos parâmetros** — função com parâmetro desestruturado (`{a,b}`) quebrava a
  extração.

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
- **Ainda por fazer (exige re-deploy manual do `.gs`):** ler só as últimas
  linhas da `PARADAS` em vez da aba toda.

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

## Relatórios em popup (peças comuns)
- **A faixa do PPCP, o botão IMPRIMIR e o logo estavam escritos CINCO vezes** —
  um por relatório (semanal, histórico, paradas, produção por família e por
  modelo). Foi por isso que o #204 arrumou o cabeçalho de um e o #205 teve de
  repetir a mesma correção nos outros quatro. Agora são
  `_rpCabecalho(titulo, metaHtml, subExtra)`, `_rpBotaoImprimir()` e `_rpEsc()`.
  O `relatorios.test.js` falha se algum deles voltar a aparecer duplicado.
- O logo continua entrando por **URL absoluta** (`new URL(...)`): o popup nasce
  em `about:blank` e um `src` relativo não resolveria.
- **O CSS de cada relatório continua local, de propósito**: só 5 das 185 regras
  são comuns aos cinco. Unificar traria pouco e arriscaria o layout de todos.
- **"A meta foi batida" × "a hora extra bateu a meta"** (`_relMetaHE`, usada pelo
  relatório semanal E pelo do histórico). O total do período pode fechar acima da
  meta com a **jornada normal abaixo** dela: na Semana 33/2026 foram 8.681 cx
  contra 8.325 (104,3%), mas 1.219 vieram de HE — na jornada normal foram 7.462,
  ou **89,6%**, faltando 863 cx. O relatório dizia "DENTRO DA META" em verde e
  escondia isso.
  - Quando `soComHE`, o card EFICIÊNCIA MÉDIA vira **âmbar** com
    *"⚠ META BATIDA COM HORA EXTRA"*, o TOTAL META ganha o `sem HE: −863 cx` e
    entra a faixa `.rp-alerta` com a frase inteira. Semana que já batia na
    jornada normal **não** dispara nada (verde continua verde), e semana abaixo
    da meta mesmo com HE também não — aí o relatório já está vermelho.
  - A base é o **total** do período (realizado ÷ meta), **não** a média das
    eficiências diárias: "meta da semana" é o somatório, e a média de percentuais
    distorce quando a meta varia muito de um dia para o outro (a mesma semana dá
    118,5% na média e 104,3% no total).
- **Rodapé MÉDIA / DIA: não existe média de horário.** As colunas MELHOR H./PIOR H.
  guardam **rótulos** (`08:00-09:00`); o rodapé somava isso como número
  (`0 + '08:00-09:00'`) e imprimia **`NaN`** no PDF. `_slotMaisFreq(dias,campo)`
  devolve o slot que mais se repete, com a contagem (`08:00-09:00 (2×)`).
- `_relSemanaJanela(ate)` e `_relSemanalKPIs(dias)` saíram de dentro do
  `gerarRelatorioSemanal` para poderem ser testadas — antes, conferir a média
  da semana exigia abrir o popup e olhar. A janela é **segunda 00:00 → domingo
  23:59**; as horas nas pontas não são detalhe (sem o `00:00` a própria
  segunda-feira ficava fora do filtro).

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
- Tela e PDF usam as MESMAS contas (linhas com `v1/v2/teto` calculados uma vez);
  `relatorios.test.js` cobre a aparada e o teto harmônico.
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

## Notas / armadilhas conhecidas
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

## Deploy (Vercel)
- Se o painel não atualizar após um merge, conferir se a Vercel construiu a
  `main`: o webhook do push pode falhar silenciosamente (aconteceu no #200 —
  preview da branch buildou, produção não). Re-disparar = qualquer commit novo
  na `main` (PR mínimo como este).
