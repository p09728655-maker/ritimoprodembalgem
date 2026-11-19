# TV — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## TELA C da TV — o atraso em horas de linha (v7.258.0)
- PPCP, 17/11/2026, com os prints do gerencial (card ⚠ ATRASO · LOTES
  VENCIDOS: *1h56 de linha · 355 cx · desde 12/11*) e da ⚖ UEP: *"não caberia
  colocar o atraso em horas nessa tela?"* → *"o mesmo dessa"* → TELA C da TV
  (escolhida entre Tela C e Tela G: na G o atraso dos lotes vencidos brigaria
  com o *2 min ATRÁS* do dia — dois "atrasos" de sentidos diferentes).
- O card **ATRASADO (DIAS ANTERIORES)** mostrava só o `atrasoTotal` do `.gs`
  em CAIXAS. Desde a v7.258.0: **o número grande em horas de linha** (`1h56`)
  e embaixo *DE LINHA · 355 CX · DESDE 12/11* — o MESMO número do card do
  gerencial e da faixa da ⚖ UEP: a montagem é UMA (`_atrasoVencidoPc` → o
  `atrasoVencido` do rp-core), lida pelo `_gerAtrasoKpi` e pelo `_sincSlideC`.
  As caixas são as mesmas do `atrasoTotal` (Σ do atraso de cada código).
  - Código sem UEP no cadastro: fica só nas caixas, com o `*` no número (como
    o card). ~~e *· \* N SEM UEP* embaixo~~ — saiu na v7.258.1: a linha
    quebrava na TV de 1366×768 (44 px em vez de 22) e empurrava o CX/HORA para
    fora; a linha de baixo agora é `nowrap` (`#tv-slide-c #tvc-atraso-un`).
  - Sem o cadastro de UEP no computador (nem o guardado): as CAIXAS, como era.
    Para não ficar assim, a TV com atraso (e a Tela C ligada, v7.258.1) também
    pede o cadastro (`_gerCatSeFalta`, que antes só lia com o gerencial ao
    vivo). ~~Lido, ele fica guardado no computador e a TV não lê de novo~~ —
    **BLOQUEIA da revisão, corrigido na v7.258.1**: guardado de qualquer
    idade, ele nunca era relido; travada uma UEP nova, o gerencial (com a ⚖
    UEP aberta, que relê a cada 10 min) e a faixa da ⚖ UEP mudavam e a Tela C
    ficava no número velho para sempre. Agora o cadastro tem **prazo de 2 h**
    (`GER_CAT_TTL`, contra o `CAP_CAT_TS` da leitura desta sessão ou o `ts` do
    guardado — `_gerCatIdade`): mais velho que isso, relê; no máximo UMA
    tentativa por prazo em cada sessão (`GER_CAT_TENTOU`); falhou, segue o que
    há. A TV (recarrega a cada 28 min) lê ~1 vez a cada 2 h. Fecha também a
    mesma brecha do card do gerencial aberto há dias (v7.243.0).
- Sem os PONTOS (o gerencial tem; a TV fica enxuta — ver *O ATRASO TAMBÉM EM
  PONTOS* em `gerencial.md`). O PRODUZIR HOJE P/ ZERAR e o RITMO P/ ZERAR
  continuam em caixas (é o número de ação do chão: caixas por hora).
  - O PRODUZIR HOJE P/ ZERAR do aviso de atraso da Tela A mostrava a META
    cheia (`metaEfetiva`) com o mesmo nome deste card; desde a v7.274.0 os
    dois leem o `_progFaltaZerar` (*O QUE JÁ FOI EMBALADO ANTES NA META DO DIA*,
    em `hora-extra-e-meta.md`). Lá também: o *"CAIXAS · N JÁ EMBALADAS ANTES"*
    embaixo da META DO DIA da Tela B, medido a 1920 e a 1366.
- Medido no Chromium (TV 1920×1080 e 1366×768, com e sem o cadastro, com um
  código sem UEP): a linha de baixo numa linha só (22 px a 1366). ~~nada
  corta~~ — a medição da v7.258.0 olhou só a largura (o erro da v7.138.0):
  ⚠ a 1366×768 o CX/HORA do RITMO P/ ZERAR termina em 783 numa tela de 768
  (15 px cortados) — de ANTES da v7.258.0, não mexido; e no preview do
  gerencial (aba TV OPERACIONAL) a Tela C já passava da altura nas duas
  resoluções. Na TV de 1920 cabe (o CX/HORA termina em 1019).
- Teste em `relatorios.test.js`: o `_sincSlideC` real contra o card do
  gerencial (0h46 = 0h46, o `*` sem UEP, as caixas sem cadastro) e o
  `_gerCatSeFalta` REAL com o relógio (guardado de 1 h → 0 leitura, de 3 h →
  1, de novo na sessão → 1, sessão longa passado o prazo → relê, falha → uma
  tentativa por prazo, Tela C desligada / sem atraso / sem a TV → 0).

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
  - **O % da jornada normal (`#tvd-normal-pct`) tem corpo de NÚMERO, não de
    rótulo** (pedido do PPCP, 20/08/2026): é ele que diz sozinho *"faltou pouco
    para bater sem hora extra"* — 89,6% da meta. Em 13–21px de legenda ninguém
    lia isso a 15 m; hoje vai a **34–72px**, e a linha do *faltaram* a 19–34px.
    O **"DA META" é um `<i>` menor dentro da mesma linha** (por isso o `%` sai
    por `innerHTML`): com a frase inteira no mesmo corpo, o número não podia
    crescer — estourava a largura da coluna e o `nowrap` cortava justamente o
    que interessa. O gerencial tem a mesma marcação numa escala menor
    (`#ger-semana #gsem-normal-pct`), como o resto do bloco. (v7.250.0: no
    gerencial o bloco é em UEP e o texto quebra linha em vez do `nowrap`; a
    Tela D segue em caixas e em linha única — ver `gerencial.md`.)
  - **O buraco vai em caixas E em caixas/dia**: "faltaram 863 cx" não diz se
    dava para fazer; "173 cx/dia" a operação sabe na hora. A base é o nº de
    dias fechados da própria semana.
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

- **A SEMANA vai em SELO no cabeçalho do `#ger-semana`** (v7.97.0, PPCP:
  *"não visível a semana que está o resultado"*): `.gsem-selo` (15px) +
  `.gsem-per` (datas, 13px) ao lado do título. O `pintar` escreve
  `SEMANA N` **sem** o `· ` — o ponto separador da TV mora na marcação dela.
- **Divulgar a semana sai do próprio bloco** (pedido do usuário, 31/08/2026:
  *"preciso da impressão do resultado da semana para enviar para o pessoal"*).
  O `#ger-semana` ganhou **🖨 IMPRIMIR SEMANA** (e o 📲 WHATSAPP, que saiu na
  v7.248.1 — ver abaixo), que manda a semana **que está na tela** (`RP_SEMANA.semana()` devolve
  `{semStr, numSem, ate}`), como o `gerarRelatorioParadas(de, ate)` já faz com o
  período. Antes o relatório só existia na aba HISTÓRICO e saía pela data do
  filtro **de lá** — o mesmo defeito que fazia a tela dizer 27h16m e o papel 42
  min. `imprimirSemanaGer` é um adaptador de duas linhas; o relatório e as
  contas continuam sendo os mesmos.
- **`_relSemanaParaDivulgar(todos, ate, fixa)` é a regra ÚNICA de qual semana se
  divulga**: a semana pedida e, quando ela ainda não tem dia fechado, a **semana
  passada**. Numa **segunda-feira** — o dia em que o resultado é divulgado — a
  semana em curso está vazia, e o PDF era o único que não tinha essa queda:
  abria um alerta mandando *"ajustar o filtro Até"* em vez do relatório (o zap
  já caía sozinho, com a regra copiada dentro dele). `fixa=true` **desliga a
  queda**: quem já sabe qual semana quer — o 🖨 do bloco — não pode receber
  outra semana de volta.
- Pedir relatório de semana sem dado **fecha** a janela do *"Carregando
  relatório…"*: deixá-la em branco fazia parecer pop-up travado.
- ⚠ **O RESUMO DO WHATSAPP SAIU na v7.248.1** (PPCP, 16/11/2026: *"watsap
  esqueça, pode tirar"*): os dois botões (bloco da semana e aba HISTÓRICO), o
  `_zapResumoSemana`, o `enviarResumoZap` e o `zapSemanaGer`. A divulgação da
  semana é o 🖨 IMPRIMIR SEMANA. O `relatorios.test.js` falha se voltar. O que
  segue é registro: ~~**O resumo do WhatsApp NÃO leva emoji** (31/08/2026). A mensagem chegou ao
  celular com **todos** os marcadores virados losango — 📦 do título, ⚠️ do
  veredito, ▪ das linhas e 🏆 do melhor dia, todos como `◆` — enquanto `·`, `—`
  e o `*negrito*` do WhatsApp chegaram intactos na MESMA mensagem: emoji depende
  da fonte de quem recebe (e do caminho `wa.me` → app). A hierarquia sai do
  negrito e das linhas em branco; o melhor dia é uma linha escrita, não um
  troféu. `relatorios.test.js` falha se um caractere acima de `U+2500` voltar ao
  resumo. **A hora extra aparece em três alturas de propósito** — veredito,
  bloco da divisão e **cada dia que teve** (*"· 286 em hora extra"*): quem lê só
  o dia a dia não pode achar que as caixas saíram todas dentro do turno.~~
- **PUBLICAR NO MURAL foi removido** (31/08/2026): o mural do Radar não existe
  mais. Saíram o botão, o campo *MURAL — RADAR DIÁRIO* das configurações, a
  chave `CFG.muralUrl` e o `_muralResumoSemana` — o `relatorios.test.js` falha
  se a palavra voltar ao painel. A divulgação da semana é o PDF (o resumo do
  WhatsApp saiu na v7.248.1).

## TELA E da TV — programação do dia
- Pedido do usuário (24/09/2026): *"me propõe uma tela para tv com a
  programação do dia"* → aprovado. `#tv-slide-e`, quinta tela do carrossel
  (v7.70.0 / `.gs` v5.7). Responde uma pergunta só: **o que falta embalar hoje,
  e o que vem primeiro.**
- **Custo zero de chamada**: lê `PONTOS_DIA.programacao.lista` (por PRODUTO, do
  `calcularProgramacao`) e o `produtoAtual`, que o `getPontosDia` já entrega.
  ⚠ Não trocar pela `getProgramacaoDetalhada` (por linha/lote) sem pensar: é
  leitura cara e a TV recarrega a cada 28 min.
- **Conta pura e testada**: `_telaEMontar` (ordem, situação, corte),
  `_telaETem` (entra no ciclo), `_telaEHtml` (desenho, sem conta). O FALTA P/
  ZERAR sai de `_progFaltaZerar`, que a **Tela C também lê** — as duas não podem
  divergir. Mesma nota da Tela C: `!= null`, nunca `||` (zero é valor).
- **Ordem = PREMISSA**: rodando agora → atraso mais antigo (`atrasoDesde`) →
  programado hoje (por lote, depois maior falta). A PROGRAMACAO não tem coluna
  de sequência; se o PPCP criar uma, a tela deve seguir ela. O rodapé da tela
  diz a regra.
- **FALTA, não %**: o atraso é vivo (abatido pela produção de hoje), então o
  "total" de cada produto encolhe e uma barra de % andaria para trás.
- **Máx. `TV_E_MAX`=6 linhas** (lidas a 15 m; conferido a 1920×1080 e
  1366×768). Concluídos (`falta 0` com `metaEfetiva>0`) viram contador; o que
  não coube vira "+ N itens". Produção sem demanda (`metaEfetiva 0`) não conta
  como concluída. Tudo concluído → aviso verde, não tabela vazia.
- `.gs` v5.7: `cor` e `atrasoDesde` (dd/MM/yyyy do lote vencido **ainda com
  saldo** — o FIFO abate a fila em ordem, então é o 1º com `rem>0`) por item;
  `TELA_E`/`TEMPO_E` na CONFIG_PAINEL. ⚠ **re-deploy manual**. Antes dele: sem
  cor (só código), `ATRASO` sem data, e `aplicarConfigPainel` preserva a
  marcação local da E (mesma regra da D).
- `_sincSlideE` roda a cada segundo com a tela visível (relógio + dado), com
  assinatura (`_eSig`) para só redesenhar quando o dado muda — com a E sozinha
  no ciclo não há "volta" que a atualize.
- ⚠ O `th` global do painel tem fundo e a `.c-lote` do td valia no th: por isso
  o `.tve-tab th{background:none}` e o `th.c-lote` com corpo de rótulo.
- **POR LOTE desde a v7.71.0 / `.gs` v5.8** (PPCP, 24/09/2026, com a TV na
  mão: *"na tv ficou pequeno… nome do produto e qtde geral de cada lote"*). O
  lote 25213 ocupava 5 das 6 linhas com a MESMA mesa em cores diferentes.
  - `calcularProgramacao` devolve **`porLote`** (`_somaNoLote`/`_fecharLotes`,
    mesmo FIFO, nenhuma leitura nova): `qtde` (programado com data ≤ hoje,
    arquivadas incluídas), `falta`, `atrasoDesde`, `produto` (o de mais caixas,
    `produtoDoCodigo().base` — sem VOL e sem cor), `outros`, `cores` e
    **`cabeca`** (códigos para os quais o lote é o 1º aberto do FIFO — é o
    RODANDO AGORA). Entra lote com saldo, lote de hoje e lote que recebeu
    produção hoje (conta como concluído); lote velho zerado fica fora.
  - Front: `_telaELotes` (conta) + `_telaELotesHtml` (desenho), máx.
    `TV_E_MAX_LOTE`=4. **No lote a barra de progresso é honesta** (total fixo);
    na visão por código continua sem barra. Sem `porLote` (backend antigo) o
    `_sincSlideE` cai na visão por código.
  - ⚠ Linha do mesmo lote com data FUTURA não entra no total (o FIFO só abre
    demanda até hoje).

## TELAS F e G da TV — a UEP do dia (v7.138.0 / `.gs` v5.26)
- PPCP, 19/10/2026, depois de conferir as UEP travadas: *"sugestão de uma
  tela dedicada para uep… para tv da produção"* → duas maquetes → *"vamos
  fazer as duas, deixar prontas para que eu possa acompanhar"*.
  - **F = ESFORÇO DO DIA**: UEP feita × esperada (barra com a marca do
    esperado), RODANDO AGORA (*1 caixa = X UEP*, cor no rótulo), PESO MÉDIO DA
    CAIXA HOJE contra o normal, hora a hora em UEP com a meta da hora.
  - **G = CORRIDA DO DIA**: UEP acumulada × esperado (SVG), **minutos** à
    frente/atrás, FALTA PARA A META em UEP ~~**e em caixas do produto de agora**~~
    (as caixas saíram na v7.259.0 — ver *A FALTA SÓ EM UEP*, abaixo),
    e ~~A META SAI ÀS (mantendo 288 UEP/h)~~ (o cartão saiu na v7.256.0 — ver
    *UM VEREDITO SÓ NA G*, abaixo). Fala em tempo ~~e caixas~~ (as caixas
    saíram na v7.259.0) — é a que se lê sem entender UEP.
- **Conta nenhuma nova**: `_tvUepModelo` lê o `_uepAbaDados` (4º leitor — o
  teste conta) e o `_tvUepMontar` só arruma para a TV (curva, minutos,
  caixas). Desenho em `_tvFHtml` / `_tvGHtml` / `_tvGSvg`, sem conta (o teste
  prende). Modelo refeito no máximo a cada 15 s (`TV_UEP_TTL`): o
  `_ordemTelas` roda a cada segundo pela reconciliação do ciclo.
  - O **esperado da curva** anda pela régua do card (só hora com lançamento; a
    em andamento pelo `minSlotDecorrido`): o ponto de agora FECHA com o card.
  - **À frente em minutos** = (feito − esperado) ÷ (meta ÷ 527); abaixo de
    0,5 min a tela diz *0 min · NO TEMPO*. ~~**A meta sai às** = anda só pelos
    minutos de jornada que restam (almoço fora); não cabendo, mostra o ritmo
    que faltaria~~ — revogado: o cartão saiu na v7.256.0 e o horário no
    gráfico, na v7.257.0 (sem projeção; `proj`/`chega` fora do modelo).
    Caixas = ⌈falta ÷ UEP/cx⌉, para cima.
  - **UEP/cx do produto de agora**: o cadastro (`CAP_RAW`, ou o guardado no
    aparelho); sem ele, a média de hoje do MESMO produto e cor no
    `porHoraModelo` (o 501130 tem quatro mesas — nunca só pelos 6 dígitos).
  - **Peso normal** = mediana de UEP ÷ `_qpRealDia` nos últimos 30 dias
    fechados com UEP (mín. 5). É a única leitura nova: o histórico, relido a
    cada 30 min **só com F ou G ligada** (`_uepAbaHistCarregar`).
- ⚠ **DESLIGADAS POR PADRÃO, e o veredito também.** `CFG.telasAtivas.f/.g`
  só ligam com `=== true` (config salva antes não tem a chave — `!== false`
  ligaria as duas na TV da fábrica no primeiro deploy) e `CFG.uepSeloTv`
  nasce `false`. Sem o selo: números e barras em tinta, nenhum NO RITMO.
  - **Por quê**: a Tela B julga em CAIXAS e estas em UEP. Às 15:02 de 16/10 a
    B diria ABAIXO DO RITMO (1.483 de ~1.819 cx) e a F NO RITMO (2.271 de
    1.959 UEP). Dois vereditos na mesma TV é o defeito que este projeto mais
    pagou caro. Recomendação dada ao PPCP: ligar o selo só depois da
    cronoanálise dos produtos pesados (56% da UEP programada de 19–23/10
    vinha de UEP medida com menos de 5 dias).
  - ⚠ **Rótulo nenhum pode usar "NO RITMO"** — é a palavra do veredito
    (`slRitmo`). O 1º rascunho tinha "NO RITMO DA META, CHEGA ÀS" e o teste
    pegou: lido de longe parece selo mesmo com o selo desligado.
- **Config** (⚙ → PAINEL TV): TEMPO NA TELA F/G (20 s), TELA F, TELA G e SELO
  DE RITMO NAS TELAS F e G. `.gs` v5.26: `TELA_F`, `TELA_G`, `TEMPO_F`,
  `TEMPO_G`, `SELO_UEP_TV` na CONFIG_PAINEL, as de ligar `false` sem a chave.
  ⚠ **re-deploy manual**; antes dele `aplicarConfigPainel` preserva a marcação
  LOCAL — marcar no PC não liga a TV da fábrica (é como o PPCP acompanha).
- ~~**Medido no Chromium**: nada corta nem sobrepõe~~ — **ERRADO**, e o PPCP
  achou no print de 19/10 08:59 (aba TV OPERACIONAL, selo ligado): os cartões
  da G cortavam o texto no meio da letra. A medição da v7.138.0 olhava só a
  **largura** (`scrollWidth`); com a ALTURA medida, o 1º cartão da G com selo
  cortava **até na TV em 1920×1080**. Medição de tela tem de olhar os dois eixos.
- **ENCAIXE MEDIDO (v7.140.0)** — `_tvUepCabe` / `_tvUepCorta`: as fontes e os
  espaços das duas telas são `calc(var(--tvu-k,1) * clamp(…vh…))`; depois de
  desenhar (e depois de MOSTRAR: escondida não tem altura) a escala desce de
  5 em 5% até nada cortar, até `TV_UEP_K_MIN`=0,6. Só refaz quando o tamanho
  muda (o relógio chama a cada segundo). Por quê: a fonte é por `vh` e a tela
  da TV no gerencial tem 100vh menos cabeçalho, abas e rodapé (133 px).
  - O cartão é `flex:1 1 auto` (altura do conteúdo), não um terço fixo: com o
    selo o 1º cartão da G pede mais que os outros.
  - Na altura, linha de dentro do cartão só conta se tem `overflow` escondido
    (é ela que encolhe e corta a letra). O número grande tem entrelinha < 1 de
    propósito e "transborda" sem cortar — contá-lo levava a G a 60% sempre.
  - **`.tvu-nome` pode cortar com "…"** na largura: nome de produto comprido
    não encolhe a tela inteira. O resto (rótulo com a cor, peso, falta) tem de
    caber inteiro.
  - Medido (Chromium, retrato de 16/10, um dia atrasado e 08:59): TV 1920×1080
    e 1366×768 a 90–100%; gerencial em janela de 1920×950 a 85–95% e de
    1366×650 a 75–80%. Nada corta fora o nome.
- ~~**Rótulos FEITO/ESPERADO da G**: posição fixa por hora do dia; na 1ª hora,
  sem rótulo~~ — **revogado na v7.147.0** (abaixo): a regra fixa deixava a TV
  sem número nenhum às 08:46 e jogava o ESPERADO em cima da curva do FEITO às
  15:02.
- **GRÁFICO DA G PARA A TV DE 65" (v7.147.0, PPCP 20/10/2026, com o print das
  08:46: *"na tv tem como deixar mais visível o gráfico"*, *"para tv de 65
  polegadas"*).** A 1920×1080 numa 65", 1 px ≈ 0,75 mm, e o SVG sai a ~1,05×
  o viewBox. Antes: FEITO a 6 (≈ 5 mm), eixo a 23 (≈ 17 mm de corpo) e, de
  manhã, nenhum número no gráfico.
  - ~~**Traço**: FEITO 12 (halo 20), ESPERADO 7 tracejado `24 14`, ATÉ A META 7
    em pontos redondos (`0 16`), META 3; pontos do agora r 18 / 12.~~
    (v7.257.0: FEITO 18, ESPERADO 10, META 7 laranja, sem pontilhado — abaixo.)
  - ~~**Letra** (`.tvg-t0/1/2`): números do agora **54/42**, eixo e ALMOÇO **32**;~~
    (v7.257.0: FEITO 80, META 52, eixo 40 — abaixo.)
    ~~legenda `.tvg-leg` pela escala `--tvu-k` (até 34 px) com amostras de 64 px.
    Margens do viewBox foram junto (`L` 124, `B` 72) para o eixo maior caber.~~
    (v7.257.0: legenda até 50 px, amostras de 72 px, margens `L` 112, `T` 72,
    `B` 80.)
  - **A distância FEITO × ESPERADO é uma FAIXA** (`<polygon>` entre as duas
    curvas até agora, opacidade .2): de longe é ela que mostra quem está em
    cima — a linha sozinha some quando a diferença é de poucas dezenas de UEP.
    **Tinta neutra sem o selo**; com o selo, a cor do `sc(ef)` (a regra do
    veredito da tela não mudou).
  - ~~**Rótulos FEITO/ESPERADO SEMPRE**, cada um com tarja da cor do fundo, na
    1ª posição de uma lista de candidatas que não encosta em curva nenhuma, no
    texto da META, no horário da meta nem no outro rótulo. Perto do ponto
    primeiro; sem lugar para os dois assim, EMPILHADOS acima dos pontos, com
    UMA guia pontilhada até eles. Nem empilhados: fica o que coube perto do
    ponto — os dois estão no 1º cartão.~~ — **revogado na v7.257.0**: só o
    FEITO tem número; a busca perto do ponto (candidatas que não encostam em
    curva, na META nem no ALMOÇO; longe, guia fina) ficou, o EMPILHADO saiu, e
    o último recurso é ENCOSTAR numa curva sobre a tarja (`dentro` × `livre`)
    — o cartão não repete mais o número (ver *MENOS INFORMAÇÃO, MAIS
    VISIBILIDADE*).
  - **Sorteio de 4.000 dias** (script fora do repositório; hora sem lançamento,
    zero, 900 UEP numa hora, meta de 2.000 a 4.000, com e sem selo): 7.856
    desenhos, 0 erro, 0 NaN, os dois números em TODOS, nenhum encostado em
    curva nem no outro. A 1ª versão da busca deixava 1,5% sem rótulo — muito
    atrasado no fim da tarde (só procurava para baixo; havia espaço ENTRE as
    curvas) e FEITO colado na meta (sem lugar para o par, descartava os dois).
    Os dois casos estão no teste. Desenho < 0,3 ms, e a G só redesenha quando o
    modelo muda (no máximo a cada 15 s).
  - O teste (`tela-uep.test.js`) prende o **invariante**, não a posição: em
    07:30, 08:46, 08:59, 13:40 atrasado, 15:02, meta batida, 16:34 muito
    atrasado e 16:08 colado na meta, com e sem selo,
    os dois números aparecem, dentro do viewBox, sem encostar em curva nem um no
    outro. Desligar a checagem de colisão derruba 13 casos.
  - Medido no Chromium (cenários acima): TV 1920×1080 e 1366×768 e a aba TV
    do gerencial a 1920×947 — nada corta (`_tvUepCorta` falso). ~~Na aba do
    gerencial o SVG fica limitado pela ALTURA e sobra largura dos lados~~ —
    resolvido na v7.173.0 (abaixo).
- **O GRÁFICO DA G NO TAMANHO DA CAIXA (v7.173.0, PPCP 27/10/2026, com o print
  das 14:49: *"na tv o gráfico está muito ruim de ver"*).** O print era a
  JANELA do app (gerencial, aba TV OPERACIONAL, com cabeçalho, abas, rodapé e
  a barra do Windows), não a TV cheia. Medido no Chromium nessa geometria
  (1920×1015): o viewBox fixo de 1000×840 era limitado pela altura e saía a
  **0,78×** — 135 px vazios de cada lado, área de plotagem 656×551 px, eixo a
  25 px, FEITO a 42 px e traço a 9 px. Tudo o que foi medido para a 65" na
  v7.147.0 saía 22% menor.
  - **`_tvGSvg(m, selo, dim)`**: com a caixa (`dim`, px), o desenho tem a
    proporção dela e 1 unidade = `_tvGEscala(altura)` px — **1 até
    `TV_G_H_CHEIO`=620 px** de altura (a letra da TV cheia vale também na
    janela), abaixo encolhe junto até `TV_G_Z_MIN`=0,55, acima de 840 cresce
    até `TV_G_Z_MAX`=1,3. Sem `dim` (1º desenho, escondida, teste): 1000×840.
    O corpo do desenho é o `_tvGDesenho(m, selo, W, H)`, que devolve também
    ~~quantos números do agora couberam~~ `n` = 1 quando o FEITO achou lugar
    LIVRE (v7.257.0).
  - **`_tvGEncaixa(corpo)`** roda no fim do `_tvUepCabe` (depois do `--tvu-k`,
    que muda a altura da legenda) e redesenha o SVG com o tamanho medido. O
    SVG é `flex:1`: a caixa não depende do desenho, redesenhar não mexe no
    layout. O modelo vem do `_sincSlideUep` em `corpo._tvgArgs` (só na G).
  - Na janela de 1920: plotagem **892×522 px** (era 656×551), eixo 34 px, FEITO
    54 px, traço 12 px — os números da TV cheia. TV cheia 1920×1080: igual a
    antes, só mais larga (892×710). TV 1366×768: ×0,93 (era ×0,68).
  - ~~**Os DOIS números do agora continuam sempre**~~ (v7.257.0: o FEITO
    sempre): com a letra maior num campo
    mais estreito, o sorteio de 4.000 dias deixava 3% dos desenhos da TV de
    1366×768 sem um deles. Quando o par não cabe, a letra desce de 10 em 10%
    até `TV_G_Z_MIN`. Sorteio de novo (3.983 dias × 5 caixas × com/sem selo =
    39.830 desenhos): 0 sem número, 0 fora, 0 encostado em curva, no outro
    rótulo ou no ALMOÇO, 0 NaN; ~0,1 ms por desenho.
  - **Só o ESPERADO é tracejado**: a META virou linha CHEIA (eram duas linhas
    cinza tracejadas, de sentidos diferentes). E com o dia no tempo (o print:
    1.906 = 1.906) o esperado daqui para a frente e o ATÉ A META andam colados
    — o tracejado por baixo dos pontos virava uma terceira textura: ~~colados
    (menos de 12 unidades), o esperado PARA no agora e fica só o ATÉ A META~~
    (v7.257.0: sem a projeção, o esperado vai sempre até o fim).
  - **Eixo**: grade de no máximo 4 passos (1.000 e 2.000 com a meta de 2.530 —
    eram 5 linhas com número), em Barlow Condensed 600 a 34 (era IBM Plex Mono
    400 a 32, fino e cinza). Margem do eixo 124 → 100 (o número condensado é
    mais estreito). O **ALMOÇO mora no PÉ da faixa** e é lugar ocupado para os
    rótulos: no alto, com o gráfico mais baixo, o FEITO da tarde caía nele.
  - ~~O horário da meta (`16:59`) não passa da borda direita (`xChega`): antes a
    sobra lateral escondia o corte.~~ (O horário saiu na v7.257.0.)
  - ⚠ **Se o PC da TV mostra a janela do app**, a TV perde ~18% da altura para
    cabeçalho, abas, rodapé e barra do Windows. ⛶ PAINEL CHEIO (ou o perfil
    OPERADOR, que já abre nele) devolve ao gráfico a caixa de 842 px.
  - Nada de conta mudou: `_tvUepMontar`, cartões, números e veredito são os
    mesmos.
- **UM VEREDITO SÓ NA G (v7.256.0, PPCP 16/11/2026, com o print das 15:58:
  *"essa tela na tv ainda está ruim de ver"* e *"está confuso a meta não sai e
  está no ritmo?"*).** O print: 2.429 feitas × 2.441 esperadas (−12 UEP,
  99,5%), selo NO RITMO e, no 3º cartão, *"A META NÃO SAI ATÉ 16:59 — 327
  UEP/h"*.
  - **Causa**: o 3º cartão andava no ritmo da meta a partir do FEITO. Como o
    esperado também anda no ritmo da meta, ele só chegava na meta com feito ≥
    esperado: **1 UEP atrás e já dizia NÃO SAI — o dia inteiro** (às 09:20, com
    96,8%, também). Era um 2º juiz, com tolerância zero, ao lado do selo, que
    tem 4% (`sc`: ≥ 96 = NO RITMO). Pedir 327/h contra 314/h é 4% a mais na
    última hora, não "não sai".
  - **Saiu o 3º cartão** (A META SAI ÀS / NÃO SAI ATÉ / JORNADA ENCERRADA). ~~O
    horário em que a meta sai continua **no gráfico**, no ponto em que o
    pontilhado cruza a META (só aparece quando cruza).~~ (Saiu na v7.257.0.) JORNADA NORMAL ENCERRADA
    virou o 2º cartão. O `precisaH` saiu do modelo (sem leitor).
  - **O sentido por extenso**: `2 min ATRÁS` / `54 min À FRENTE` (número e
    palavra em itens de flex — no texto corrido o "À" ficava numa linha e o
    "FRENTE" na outra). O `−2 min` ao lado do NO RITMO se lia como contradição.
    ~~Saiu a linha *"2.429 feitas · 2.441 esperadas"*: os dois números estão no
    gráfico~~ — **voltou na v7.256.1** (abaixo).
  - ~~**A falta em CAIXAS no número grande** (*156 caixas*), com o produto e a
    UEP no apoio. Sem UEP no cadastro para o produto de agora, o número grande
    volta a ser a UEP. *de PENTEADEIRA PRINCESA · 332 UEP* numa linha só —
    corrigido na v7.256.1 (abaixo).~~ (Saiu na v7.259.0 — ver *A FALTA SÓ EM
    UEP*.)
  - ~~A legenda do pontilhado diz **RITMO DA META · 314/h**~~ (era *ATÉ A META,
    A 314/h*; o pontilhado saiu na v7.257.0).
  - Com dois cartões, a escala `--tvu-k` não precisa encolher: medido no
    Chromium (15:58, 09:20, 15:02 à frente, 16:34 abaixo), TV 1920×1080 e
    1366×768 e a janela de 1920×975 e 1366×560 — **1,00 em todas** (antes 0,85
    na TV e 0,75 na janela pequena), nada corta.
  - O teste (`tela-uep.test.js`) prende: o print das 15:58 (NO RITMO, 156
    caixas, `2 min ATRÁS`), nenhum cartão com SAI ÀS / NÃO SAI / NÃO CABE nem
    um 3º cartão (15:58, 09:20, à frente, fim da tarde, jornada encerrada, meta
    batida) e nenhum sinal na frente do número. Com o código velho, 4 falhas.
  - ⚠ O gerencial (PC e celular) ainda tem, no apoio do card PARA A META, o
    *"não cabe até 17:00 no ritmo da meta"* — o mesmo critério de tolerância
    zero, em letra pequena e com o "no ritmo da meta" escrito. Não mexido nesta
    versão.
  - **v7.256.1 — o que a revisão achou depois do merge da v7.256.0** (revisor
    do projeto, 16/11/2026):
    - **Número cortado no meio**: a UEP ia no FIM da linha `.tvu-nome`, que
      corta com "…". Com *KIT 2 MESA CABECEIRA SLEEP* às 09:20 a TV mostrava
      *"· 2.05…"* (a linha pedia 661 px num cartão de 607); *PENTEADEIRA
      PRINCESA* cabia com 0 px de folga. ⚠ **Número nunca na linha do nome**:
      ela tem só *de NOME*, e a conta vai em linha própria, *= 332 UEP · 2,14
      UEP/cx* (a UEP/cx tinha saído na v7.256.0 — número não sai da tela).
    - **A rede dos dois números**: sem a linha *feitas · esperadas*, nas
      janelas pequenas do gerencial (gráfico de 747×268 e 700×307) o gráfico
      deixava um dos dois de fora em 46 de 29.780 desenhos sorteados (0 na
      TV), e o número sumia da tela. ~~A linha voltou ao 1º cartão.~~ (A
      v7.256.1 não foi publicada: na v7.257.0 a rede passou para o gráfico —
      abaixo.)
    - ~~A legenda RITMO DA META só com o pontilhado desenhado~~ (o pontilhado
      saiu na v7.257.0).
    - CSS da linha mexida com escopo (`#tv-slide-g .tvg-min`, `.tvg-dir`).
    - Medido de novo (15:58, 09:20, 15:02, 16:34 e o nome comprido): TV
      1920×1080 e 1366×768, janelas 1920×975, 1366×560 e 1280×600 — escala
      1,00 em todas, nada corta, o nome comprido inteiro.
- **MENOS INFORMAÇÃO, MAIS VISIBILIDADE (v7.257.0, PPCP 16/11/2026).** O PPCP
  trouxe uma maquete feita no ChatGPT e um pedido escrito: em menos de 3 s, a
  10–15 m, o operador responde *"estamos adiantados ou atrasados? quanto já
  produzimos? quanto falta?"*. Sem indicador novo, sem projeção de fechamento,
  sem texto explicativo e sem mudar conta. Depois: *"1 UEP = 1 caixa de MESA
  CABECEIRA MADERO, pode tirar"* e *"aumenta o que puder"*. A v7.256.1 (PR
  #544, não publicada) entrou junto.
  - **O veredito é o selo de sempre (variante A).** O pedido escrito era
    ADIANTADO (verde) · NO RITMO (neutro) · ATRASADO (vermelho). Mostradas as
    duas variantes renderizadas, o PPCP escolheu a A. Motivo: ADIANTADO /
    ATRASADO por minutos fixos é uma régua nova. Às 16:00, com 17 min atrás
    (96,3%), ela diria **ATRASADO vermelho** com o card UEP DO DIA do gerencial
    em **NO RITMO**. Minutos fixos também mudam de peso ao longo do dia: são
    frouxos de manhã e rígidos à tarde. Deixar o NO RITMO neutro mudaria a cor
    do selo em todas as telas. ⚠ Não propor de novo sem antes discutir a
    tolerância do selo (96% / 90%), que vale para todas as telas.
  - **1º cartão**: o selo cheio (fundo na cor, letra escura) e maior, a borda
    do cartão na cor do selo, os minutos enormes (`.tvg-min`, até 230 px) e o
    sentido logo abaixo, também grande (`.tvg-dir`, À FRENTE / ATRÁS / NO
    TEMPO). Embaixo, *DO ESPERADO · N UEP*. Sem o selo (o padrão), nada de cor.
  - **2º cartão**: FALTA PARA A META com ~~**UEP e caixas, os dois no número
    grande** (`.tvg-falta`; em 1920 eles empilham), e o produto sozinho na
    linha `.tvg-prod.tvu-nome`~~ (v7.259.0: só a UEP — ver *A FALTA SÓ EM
    UEP*). JORNADA ENCERRADA e META DO DIA ALCANÇADA no mesmo desenho.
  - **Gráfico**:
    - FEITO 18 (halo 28), ESPERADO 10 tracejado `28 16`.
    - **META 7, LARANJA (`--acc`), com o rótulo laranja (`.tvg-tm`)**: a
      linha se distingue pela cor e pelo traço, não por dois cinzas.
    - Letra: FEITO 80, META 52, eixo e ALMOÇO 40. Margens `L` 112, `T` 72,
      `B` 80. Pontos do agora r 22 / 14.
    - Legenda em Barlow, branca, até 50 px.
  - **Sem projeção**: saíram do modelo o `proj` e o `chega` (o pontilhado e a
    hora em que a meta sai). O esperado vai sempre até o fim da jornada.
  - **Só o FEITO tem número no gráfico.** A distância está no 1º cartão, em
    minutos e UEP. Ele vai na 1ª candidata livre perto do ponto. Sem lugar
    livre nem com a letra no mínimo, vai **encostado numa curva, sobre a
    tarja** (`dentro` × `livre`): o número nunca sai, e o cartão não o repete.
    Sorteio de 3.911 dias × 6 caixas × com e sem selo (46.932 desenhos):
    - 0 sem FEITO, 0 fora, 0 NaN;
    - nas caixas da TV, 0 encostado em curva;
    - nas janelas do gerencial de 1366×560 e 1280×600, 22 de 7.822 (0,3%)
      encostados.
  - **Rodapé**: o *"1 UEP = 1 caixa de …"* saiu da G (a F continua com ele).
    A linha da hora extra (*+N UEP em hora extra hoje — fora da meta*) só
    aparece com hora extra.
  - A tela usa mais área: padding lateral de 4vw para 2,5vw, o cabeçalho
    (setor e relógio) maior e as letras dos cartões pela escala `--tvu-k`.
    Escala medida no Chromium na v7.257.1 (10 situações: 15:58, 09:20, 15:02,
    16:00, meta batida, jornada encerrada, produto sem UEP, hora extra, nome
    comprido, 16:34), com e sem o selo:

    | Tela | com o selo | sem o selo (o padrão) |
    |---|---|---|
    | TV 1920×1080 | 0,85–1,00 | 0,90–1,00 |
    | TV 1366×768 | 0,85–1,00 | 0,85–1,00 |
    | Janela 1920×975 | 0,80–0,95 | 0,85–1,00 |
    | Janela 1366×560 | 0,70–0,80 | 0,85–0,95 |
    | Janela 1280×600 | 0,75–0,80 | 0,80–0,95 |

    Os menores são a hora extra (a linha do rodapé tira altura) e, até a
    v7.257.0, o produto sem UEP: o aviso em `nowrap` era a linha mais larga e
    levava a TV a 0,70 — ~~desde a v7.257.1 ele quebra linha
    (`.tvg-uep.tvg-aviso`) e fica em 1,00~~ (o aviso e a regra saíram na
    v7.259.0: o cartão não depende mais do produto). Nada corta. ~~O nome
    comprido cabe inteiro com 62 px — medido só com o selo: SEM o selo a escala
    fica em 1,00 e *KIT 2 MESA CABECEIRA SLEEP* corta com "…" na TV.~~ (O nome
    do produto saiu da G na v7.259.0; na Tela F ele segue podendo cortar com
    "…", `.tvu-prod.tvu-nome`, e número nunca vai nessa linha.)
  - O teste (`tela-uep.test.js`) prende:
    - o print das 15:58 (selo NO RITMO, `2 min` / `ATRÁS`, 332 UEP ~~e 156
      caixas~~ — desde a v7.259.0 o teste prende que NÃO há caixas);
    - nenhum ADIANTADO / ATRASADO;
    - nenhuma projeção (pontilhado `0 16` ou horário) e `proj` / `chega` fora
      do modelo;
    - nenhum rodapé "1 UEP ="; a hora extra continua;
    - o FEITO em todos os casos e caixas (na TV, livre), e o ESPERADO sem
      número;
    - o traço e a letra novos.

    Contra a v7.256.1, 26 falhas.
  - **v7.257.1 — a revisão da v7.257.0** (depois do merge; nenhum BLOQUEIA):
    o aviso do produto sem UEP quebra linha (acima); o texto ficou *PRODUTO DE
    AGORA SEM UEP NO CADASTRO*; o *N UEP ACIMA DA META* vem pronto do modelo
    (`acima`, D1); o `_tvUepRodHtml` é só da F (comentário); o teste usa as
    caixas do gráfico MEDIDAS na v7.257.x (1085×883, 772×571, 1085×659,
    772×307, 724×346 — ele ainda tinha as da v7.256.0) e prende o 2º cartão
    (jornada encerrada, meta batida, sem UEP, sem produto) e o NO TEMPO.
    Sorteio com as caixas reais (3.911 dias × 5 × com e sem selo): 0 sem
    FEITO, 0 fora, 0 NaN; 0 encostado na TV, 20 de 7.822 na janela 1366×560.
  - Ficou para o PPCP: a META em laranja (`--acc`) é vizinha do vermelho e do
    âmbar do selo (com ABAIXO DO RITMO, o laranja e o vermelho se aproximam), e
    sem o selo o *META DO DIA 2.761* é o único número em cor. Foi pedido dele
    ("cores bem contrastantes"); trocar só com o print na mão.
- **A FALTA SÓ EM UEP (v7.259.0 · mobile 1.54.0 · rp-core 1.21.0, PPCP
  17/11/2026, com o print das 08:53).** Pedido: *"2603 cx slim isso não está
  na programação, pode confundir"*. Escolhas: *"só a UEP"* e *"alinhar o
  gerencial"*.
  - **Causa**: as caixas eram a falta em UEP ÷ a UEP/cx do PRODUTO DE AGORA
    (2.316 ÷ 0,89 da MESA CENTRO SLIM = 2.603), como se a linha fosse rodar só
    ele até a meta. No fim da tarde, com o mesmo produto, servia; de manhã era
    um número que a programação não tem. Vinha desde a v7.138.0 (e a v7.257.0
    o pôs no número grande).
  - **Tela G**: o cartão é *FALTA PARA A META · 2.316 UEP*, o número do
    tamanho dos minutos (`.tvg-falta.so`). Saíram as caixas, o nome do produto
    e o aviso de produto sem UEP (o cartão não depende mais do produto). O
    `faltaCx` saiu do `_tvUepMontar`; o `prod` fica (a Tela F usa).
  - **Gerenciais (PC `_gerUepCards`, celular)**: o PARA A META perdeu o *≈ N
    cx de PRODUTO*; ficou o *sai às* / *não cabe até 17:00* (o critério de
    tolerância zero desse texto continua — ver *UM VEREDITO SÓ NA G*). O
    `faltaCx` saiu do `uepGerMontar` (rp-core 1.21.0); o `m.prod` fica (a
    análise e a META EM CX da hora usam a UEP/cx do produto de agora).
  - Medido no Chromium (o print das 08:53 e os outros 10 casos): a escala do
    cartão FALTA sobe — TV 1920×1080 a 1,00 (era 0,90; meta batida e jornada
    encerrada, que não mudaram, seguem em 0,90), 1366×768 0,95–1,00, janela
    1920 a 0,95; nada corta (revisão: 0,90–1,00 na TV 1920 com o selo).
  - Testes: `tela-uep.test.js` (o cartão só com a UEP, nem caixas nem nome, no
    print das 15:58 e no das 08:53, sem produto ou sem UEP o mesmo cartão;
    `faltaCx` fora do modelo) e `relatorios.test.js` (os textos do PC e do
    celular sem *≈ cx de*; `faltaCx` fora do `uepGerMontar`). Contra o código
    anterior: 6 + 4 falhas (a revisão contou; a nota dizia 7).
  - **v7.259.1 · mobile 1.54.1 · rp-core 1.21.1 (revisão da v7.259.0; PPCP:
    *"tirar as cx/h"*)**: o RITMO NECESSÁRIO da análise do gerencial do PC
    (`_gerAnaliseUepHtml`) perdeu o *≈ N cx/h de PRODUTO* — a mesma premissa
    (ritmo ÷ UEP/cx do produto de agora); o `_gerAnaliseUep` não devolve mais
    `uepCx`/`prod`. O teste da meta batida comparava o `faltaCx` sumido
    (`undefined` vira `null` no `JSON.stringify` — passava sempre) e agora
    confere `'faltaCx' in`. Comentários do rp-core, do `_tvGHtml`, do
    `_gerUepModelo`, do cabeçalho das F/G e do celular deixaram de dar a falta
    em caixas como regra. O `m.prod` segue no modelo: a Tela F e a META EM CX
    da hora usam a UEP/cx do produto de agora.
- Mexeu em texto ou tamanho? Renderizar de novo na TV e no gerencial, nas
  duas resoluções, medindo ALTURA e largura.

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
- **PAROU AGORA, MOTIVO DEPOIS** (mobile 1.47.0 / v7.234.0 / rp-core 1.15.0;
  PPCP, 12/11/2026: *"na cronoanálise tem a opção de parar e colocar motivo
  depois, faz o mesmo"*). O 1º botão do modal é **⏸ PAROU — REGISTRAR AGORA**;
  tipo e motivo são opcionais. Sem tipo, a linha da `PARADAS` grava o TIPO
  **`A INFORMAR`** (`PARADA_A_INFORMAR` / `paradaAInformar` no rp-core — TIPO
  vazio também conta). Texto à vista, nunca vazio: o Pareto mostra quanto tempo
  parado está sem causa.
  - ⚠ Antes o select começava no 1º tipo da `TIPOS_PARADA` (Troca de produto) e a
    parada sem escolha gravava ESSE tipo, calada. Agora começa em *informar
    depois*.
  - Parada aberta A INFORMAR: o quadro PRODUÇÃO PARADA pede o motivo
    (`_parMotivoForm`, **SALVAR MOTIVO**); com tipo, **✎ ALTERAR MOTIVO**. O
    START vale com ou sem. Depois do START: **INFORMAR MOTIVO** na lista
    (`#par-edit`, `renderParadaEdit`). Botão PARADAS: *N SEM MOTIVO*.
  - `salvarMotivoParada` grava pelo MESMO `saveParadas` (upsert pelo ID) — nada
    no `.gs`. ⚠ O upsert regrava a linha INTEIRA, FIM incluído: ele **relê as
    paradas antes** e manda o FIM do servidor (senão um START dado em outro
    aparelho seria desfeito). Linha sem ID (`'L'+linha`, lançada à mão) não é
    editável pelo app: gravar criaria outra linha. A marca *encerrada
    automaticamente* da OBS fica (o `.gs` lê FIM = INÍCIO por ela).
  - O quadro não é redesenhado pelo poll com o mesmo dado (assinatura em
    `_parEstadoRender` / `_parEditRender`): o que se digita não some.
  - TV: A INFORMAR mostra **PARADA** e *motivo a informar no app*. GESTÃO DE
    PERDAS: `PG_RE_GENERICO` inclui *a informar* → classe A IDENTIFICAR.
    `paradas-calc`: A INFORMAR não é planejada — conta como perda.
- **Tipos de parada (dropdown) são editáveis na planilha:** aba **`TIPOS_PARADA`**
  (coluna A). O mobile lê via `getTiposParada` (criada com padrões na 1ª vez). O
  *motivo* continua **texto livre** digitado pelo operador — não se cadastra.
