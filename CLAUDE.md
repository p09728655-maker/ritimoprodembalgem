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
- `lancamento.test.js` — qual hora aceita lançamento no mobile (hora corrente +
  tolerância da recém-fechada), contra o código real: `node lancamento.test.js`.
- `lint-js.js` — **`node lint-js.js`: nome usado sem existir nos `<script>` dos
  dois HTMLs**. Rodar SEMPRE que mexer no JS embutido. Nenhum teste de conta vê
  um identificador que não existe, e o painel só quebra em runtime: o relatório
  do período morreu duas vezes no *"Carregando relatório…"* por isso — `ehCor`
  fora do `const {...}=_phAgrup()` daquela função e `_fonteHoje` usado no render
  mas declarado dentro do `calcPorModelo`. Extrai o JS e roda o eslint só com
  `no-undef`; o npx baixa o eslint (precisa de rede na 1ª vez) e sem npx ele
  avisa e sai sem falhar. **Nome novo na lista `GLOBAIS` só depois de conferir
  que ele existe mesmo** — senão a guarda vira enfeite.
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
- **O que continua como era:** hora mais antiga fica bloqueada (corrigir o
  passado é na planilha, coluna de LOTE da linha — o `getDados` soma sozinho);
  o **bipe** (`abrirLancSlotAtivo`) segue abrindo só a hora corrente — a
  tolerância é para o toque consciente na linha, não para atribuição
  automática, que erraria justamente na virada da hora.
- Fim de turno: a última hora (16:00-16:59) fica lançável até ~17:14, ou seja, a
  janela **cruza o fechamento automático das 17:05** (que grava `FECHADO=true`
  no `HISTORICO` — e o `arquivarDiaAtual` do dia seguinte **não sobrescreve dia
  fechado**). Lançamento nesse intervalo fica na `HORA_A_HORA` mas fora do
  retrato do `HISTORICO` — a MESMA situação de uma HE lançada depois das 17:05,
  que já existia. Saída igual à da HE: **FECHAR DIA de novo** (o `saveDay` é
  upsert por data e refaz o retrato).
- Nada no `.gs`: a regra é só de tela (o `saveRealizado` sempre aceitou
  qualquer slot existente da `HORA_A_HORA`).

## Caixas em HORA NORMAL × HORA EXTRA
- **A JORNADA NORMAL É 07:00–17:00. Fora dela, é hora extra** (PPCP,
  31/08/2026: *"05:00 as 06:00, 06:00 as 07:00 sempre é hora extra, e após
  17:00"*). O almoço 11:00–12:12 fica DENTRO da jornada. `HE_JORNADA_INI_MIN` /
  `HE_JORNADA_FIM_MIN` são a janela, num lugar só — o backfill dos dias antigos
  usa a MESMA (antes ele terminava às 18:00 e o fechamento não olhava horário
  nenhum: duas réguas para o mesmo indicador, no mesmo arquivo).
  ⚠ A janela **repete** o TURNO da configuração do painel (`CFG.turnoInicio` /
  `CFG.turnoFim`, hoje 07:00 e 17:00). O backend não enxerga essa config — só
  conhece o INÍCIO do turno, pela célula `C3`. Mudou o turno na tela? **Mudar as
  duas constantes do `.gs` também**, senão a HE passa a ser contada por uma
  janela que não existe mais.
- **DOIS critérios, e trocá-los quebra coisas diferentes:**
  - **`_ehHoraExtra(rótulo)` = QUE LINHA É.** Só o prefixo `HE `. Governa a
    **limpeza diária** (que APAGA a linha marcada) e o **filtro do C3** (linha
    marcada não é filtrada). ⚠ Alargar este critério faria a limpeza **deletar
    as linhas de 05:00 e 06:00** — que existem sempre — e faria elas aparecerem
    no app mesmo com `C3=7`.
  - **`_ehHoraExtraCaixas(rótulo)` = QUE CAIXAS CONTAM.** Prefixo **ou** horário
    fora de 07:00–17:00. É este que alimenta o `he` do payload do `getDados` (e
    daí o `realHE`/`realNormal` e o card CAIXAS EM HORA EXTRA) e o `he`/`heCx`
    do `arquivarDiaAtual`.
  - **Por que existem os dois:** o fechamento contava só pelo rótulo, e a
    madrugada **nunca é rotulada** — ela é liberada pela `C3`. Resultado medido
    em 31/08/2026 na planilha real: **69 dias seguidos com a coluna HE do
    HISTORICO em ZERO**, enquanto a produção das 05:00–07:00 era hora extra de
    verdade (26/08: 167 + 240 = **407 cx** de madrugada, e a coluna gravou 0).
    Todo valor de HE CX que existia ali veio do backfill, não do fechamento.
  - A **META do dia continua excluindo só a linha com rótulo** (`ehHE`): a
    madrugada não tem meta preenchida na planilha, e mexer nisso mudaria a meta
    histórica dos dias.
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
  - ⚠ **17:00 em diante É hora extra** (corrigido em 31/08/2026 com o PPCP).
    Antes a régua daqui ia até 18:00 e o 17:00–18:00 contava como jornada
    normal — enquanto o turno da planilha termina 17:00 (último slot
    `16:00-16:59`). Agora a janela é a mesma do fechamento.
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
  - **O % da jornada normal (`#tvd-normal-pct`) tem corpo de NÚMERO, não de
    rótulo** (pedido do PPCP, 20/08/2026): é ele que diz sozinho *"faltou pouco
    para bater sem hora extra"* — 89,6% da meta. Em 13–21px de legenda ninguém
    lia isso a 15 m; hoje vai a **34–72px**, e a linha do *faltaram* a 19–34px.
    O **"DA META" é um `<i>` menor dentro da mesma linha** (por isso o `%` sai
    por `innerHTML`): com a frase inteira no mesmo corpo, o número não podia
    crescer — estourava a largura da coluna e o `nowrap` cortava justamente o
    que interessa. O gerencial tem a mesma marcação numa escala menor
    (`#ger-semana #gsem-normal-pct`), como o resto do bloco.
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

- **Divulgar a semana sai do próprio bloco** (pedido do usuário, 31/08/2026:
  *"preciso da impressão do resultado da semana para enviar para o pessoal"*).
  O `#ger-semana` ganhou **🖨 IMPRIMIR SEMANA** e **📲 WHATSAPP**, e os dois
  mandam a semana **que está na tela** (`RP_SEMANA.semana()` devolve
  `{semStr, numSem, ate}`), como o `gerarRelatorioParadas(de, ate)` já faz com o
  período. Antes o relatório só existia na aba HISTÓRICO e saía pela data do
  filtro **de lá** — o mesmo defeito que fazia a tela dizer 27h16m e o papel 42
  min. `imprimirSemanaGer`/`zapSemanaGer` são adaptadores de duas linhas; o
  relatório, o resumo e as contas continuam sendo os mesmos.
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
- **O resumo do WhatsApp NÃO leva emoji** (31/08/2026). A mensagem chegou ao
  celular com **todos** os marcadores virados losango — 📦 do título, ⚠️ do
  veredito, ▪ das linhas e 🏆 do melhor dia, todos como `◆` — enquanto `·`, `—`
  e o `*negrito*` do WhatsApp chegaram intactos na MESMA mensagem: emoji depende
  da fonte de quem recebe (e do caminho `wa.me` → app). A hierarquia sai do
  negrito e das linhas em branco; o melhor dia é uma linha escrita, não um
  troféu. `relatorios.test.js` falha se um caractere acima de `U+2500` voltar ao
  resumo. **A hora extra aparece em três alturas de propósito** — veredito,
  bloco da divisão e **cada dia que teve** (*"· 286 em hora extra"*): quem lê só
  o dia a dia não pode achar que as caixas saíram todas dentro do turno.
- **PUBLICAR NO MURAL foi removido** (31/08/2026): o mural do Radar não existe
  mais. Saíram o botão, o campo *MURAL — RADAR DIÁRIO* das configurações, a
  chave `CFG.muralUrl` e o `_muralResumoSemana` — o `relatorios.test.js` falha
  se a palavra voltar ao painel. A divulgação da semana é o PDF e o resumo do
  WhatsApp.

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
- ⚠ **A MARGEM DA IMPRESSÃO É DA `@page`, NUNCA do `padding` do body.** Os cinco
  relatórios imprimiam com `@page{margin:0}` e tiravam o respiro do padding do
  body — e padding de body existe **uma vez só**, no começo e no fim do fluxo.
  A folha 1 ganhava margem em cima, a última embaixo, e **todas as do meio
  saíam coladas na borda do papel**, dentro da faixa que a impressora
  fisicamente não imprime. Era o "relatório cortando na impressão" (medido: a
  primeira linha da folha 2 começava em `y=0`).
  - **Não era largura.** Medido a 794px (A4 retrato), a tabela mais larga do
    relatório de paradas pede 536px contra 688px de área útil — nada
    transborda na horizontal. Antes de mexer em orientação ou fonte, conferir
    de que eixo é o corte.
  - Junto vão `tr{page-break-inside:avoid}` (linha não parte no meio) e
    `thead{display:table-header-group}` (o cabeçalho se repete em cada folha —
    sem ele a coluna da folha 5 vira adivinhação), mais o `page-break-after`
    dos títulos de seção e o `page-break-inside` dos blocos que só fazem
    sentido inteiros. `relatorios.test.js` falha se alguma `@page` voltar a
    `margin:0` ou se algum `@media print` devolver padding ao body.
- **Orientação: só a GESTÃO DE PERDAS é paisagem** (pedido do usuário,
  27/08/2026). O quadro 2×2 é a capa dela e foi desenhado largo; o de PARADAS é
  uma sequência de tabelas altas e continua em pé. O `_rpDocParadas(titulo,
  paisagem)` é **um só** — a orientação é parâmetro, e o `size` da `@page` sai
  dele. Copiar as ~150 regras para ter uma versão deitada seria a história do
  cabeçalho dos cinco relatórios (#204/#205).
  - ⚠ **Paisagem não conserta corte**: a folha deitada tem 190mm úteis de
    altura contra 273mm do retrato, então o que não cabia continua não cabendo
    e o documento engorda (paradas 9 → 11 folhas na tentativa inicial).
  - **A CAPA tem de caber na folha 1**: cabeçalho + abertura + quadro. Medido,
    davam 756px para 718px de folha — o quadro (que não pode partir ao meio)
    pulava para a folha 2 e a 1 saía quase em branco. As regras `.deitado *`
    tiram ~60px de **ar** da capa (nenhum número, nenhuma fonte de leitura),
    com folga para o 6º item do plano de ação. Nada disso vale no retrato, e o
    teste falha se alguma regra da paisagem escapar do escopo `.deitado`.
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

## GESTÃO DAS PERDAS — a 2ª camada do relatório de paradas
- Pedido do PPCP em 27/08/2026: o relatório respondia *"quanto paramos"*; faltava
  *"qual é o problema, qual é a prioridade, quanto dá para recuperar e qual é a
  ação"*. A resposta foi **acrescentar uma camada**, não redesenhar: tudo que já
  existia (RESUMO, Pareto, POR TIPO, ESTUDO DE GANHO, SWOT, DETALHAMENTO,
  fórmulas, nomes e critérios) continua **intacto e antes** dela.
  `relatorios.test.js` lista peça por peça do relatório antigo e falha se alguma
  sumir — é o guarda-corpo do "não mexer no que já funciona".
- **Onze blocos**, nesta ordem: Pareto diário (+5 piores dias) · evolução da
  disponibilidade por semana × meta 90% · TOP 5 causas · "Outros — causa a
  identificar" · SMED (troca de produto e de plástico) · minutos parados / 1.000
  cx · impacto no fluxo · potencial de recuperação · plano de ação · validação do
  apontamento · diagnóstico PPCP. Entra **depois do SWOT** e **antes do
  DETALHAMENTO**, dentro de um `try`: se a camada nova quebrar, o relatório
  oficial sai inteiro assim mesmo.
- **Nenhum indicador antigo é recalculado por outro método.** Onde a leitura nova
  precisa valorar um recorte (um dia, uma semana, um cenário), a conta sai de
  `RP_PARADAS.perdaDeMin` (a fórmula da perda, extraída do `stats()` — o próprio
  `stats` chama ela) ou de `RP_PARADAS.perdaAoRitmo`. **Nada de fórmula de perda
  escrita dentro do HTML** — o teste falha se voltar.
- **A semana é `_relSemanaJanela`**, a mesma do relatório semanal e da Tela D.
  A base de cada semana são os **dias trabalhados** dela, então a soma das
  semanas fecha com a disponibilidade do resumo. Semana sem dia trabalhado sai
  **"sem base"**, nunca 0% — e dia sem produção lançada (sábado, feriado) não
  tem turno com que comparar, então a disponibilidade dele é **"—"**.
- **Classificação GERENCIAL é uma 2ª camada, não substitui PROGRAMADA / NÃO
  PROGRAMADA** (essa continua decidindo o que entra na perda). São quatro:
  `PLANEJADA` · `REDUTÍVEL` (troca/setup — critério é o **mesmo
  `ehSetupParada`** do ESTUDO DE GANHO, um lugar só) · `ANORMAL` · **`A
  IDENTIFICAR`**.
  - ⚠ **"Outros" NÃO é anormal.** Sem saber a causa não dá para classificar, e
    chutar é o contrário de análise. O balaio genérico vira `A IDENTIFICAR`, e a
    seção 4 abre ele pelo **motivo** que o operador digitou; o que veio sem
    motivo fica em **CAUSA NÃO IDENTIFICADA**, que é o dado verdadeiro.
- **Metas iniciais, num lugar só** (`PG_META_*` no topo do bloco): disponibilidade
  90%, tipo genérico ≤5% do tempo parado, troca de produto ≤5 min, troca de
  plástico ≤4 min, corte de 50% no genérico. Mudar o combinado é mexer numa
  constante.
- **A meta do SMED desce sozinha quando é atingida** (`_pgMetaSmed`, pedido do
  usuário em 27/08/2026: *"SMED, deixar automático quando atingir"*). A meta de
  troca é **inicial**, não definitiva: sem a escada, quem chegou aos 5 min
  ficava com *"na meta"* para sempre — o cenário de recuperação daquela troca
  caía a zero e o relatório parava de puxar melhoria justamente onde ela
  começou a acontecer.
  - **O degrau novo não é inventado**: é a **média das trocas mais rápidas do
    próprio período** (o quartil mais rápido, nunca menos de
    `PG_SMED_RAPIDAS_MIN`=3 trocas) — tempo que a equipe já demonstrou fazer.
    Se essa média não fica **abaixo** da meta atual, **não há degrau**: a meta
    continua a mesma e a tela diz por quê, em vez de apertar o alvo no
    arredondamento. Piso de `PG_SMED_PISO`=1 min (abaixo disso é ficção).
  - **Amostra curta não move meta**: com menos de `PG_SMED_AMOSTRA`=4 trocas no
    período, duas rápidas são sorte, não padrão — a meta fica onde está e a
    linha do quadro explica.
  - **`metaAtingida` (o alvo COMBINADO) é quem pinta o número de hoje**, não a
    meta em vigor: com o degrau já um nível abaixo, comparar com ele deixaria
    **vermelho** justamente quem acabou de bater o combinado. `dentro` continua
    medindo contra a meta em vigor (é ela que pinta as faixas da distribuição e
    o *"já dentro da meta"*).
  - **Quem decide a meta é o `_pgSmed`, uma vez.** `_pgContexto` calcula o SMED
    **antes** da recuperação e passa o alvo em vigor (`metasSmed`) para
    `_pgRecuperacao` e `_pgPlano` — cenário simulado e plano de ação cobram o
    MESMO alvo. O quadro é desenho: não chama `_pgMetaSmed` (o teste falha se
    voltar a chamar).
  - Na tela e no PDF a linha do SMED ganha a etiqueta **ALVO NOVO** e a frase de
    onde ele saiu; a seção 5 do relatório imprime a nota **META AUTOMÁTICA** com
    a meta anterior, a nova e o tamanho da amostra.
- **O plano de ação não inventa responsável nem prazo** — saem "A definir".
  Preencher com nome plausível seria inventar compromisso de terceiro.
- **A validação do apontamento só SINALIZA.** Parada sobreposta (a seguinte começa
  antes de a anterior terminar, no mesmo dia) aparece numa lista para o líder
  conferir — **nada é corrigido nem descontado**, senão a conta antiga mudaria,
  que é justamente o que não se pode fazer. Parada encostada (fim = início) não
  é sobreposição; parada em andamento fica fora.
- **A distribuição das trocas é pintada pela META do tipo**, não por rótulo fixo:
  5 min está dentro na troca de produto (meta 5) e fora na de plástico (meta 4).
  Por isso a faixa carrega o próprio limite (`ate`).
- **O QUADRO é a capa da camada** (`_pgQuadroHtml`, pedido do PPCP em
  27/08/2026 com o desenho na mão): grade 2×2 — **EVOLUÇÃO | SMED** em cima,
  **"OUTROS" | ANOMALIAS** embaixo — mais a faixa do **PLANO DE AÇÃO** e a linha
  **FOCO ATUAL**, que sai do dado (`_pgFoco`, no máximo dois focos: uma linha
  com cinco não é foco nenhum). É o que se lê em dez segundos numa reunião; o
  detalhe continua nas seções numeradas abaixo.
  - **O quadro é DESENHO, não conta**: recebe pronto o que as seções já
    calcularam. Um número calculado ali seria o mesmo indicador com dois
    valores no mesmo relatório — o teste falha se `perdaDeMin`/`perdaAoRitmo`/
    `durProdutiva` aparecerem dentro dele.
  - **O PLANO DE AÇÃO vive só no quadro.** Ele tinha seção própria também;
    imprimir a mesma tabela duas vezes no mesmo PDF não ajuda ninguém.
  - **A marca da META vai DENTRO de cada barra**, não numa linha solta por
    cima: o tracejado tem de ficar na mesma escala do preenchimento, e a linha
    solta media a caixa inteira (valor + barra + rótulo) e caía fora do lugar.
  - **A escala das barras começa em 70%**, e o eixo escrito embaixo diz isso:
    de 0 a 100 todas as semanas teriam quase a mesma altura e o quadro não
    mostraria movimento nenhum.
  - ⚠ **Crase dentro do CSS do relatório fecha o template literal** e derruba o
    parse do arquivo inteiro (um comentário com `page-break-inside` entre
    crases já fez isso). O `node lint-js.js` pega.
- **`_pgTendencia` é a MESMA para a seta ↗/↘ do quadro e para a linha "ESTAMOS
  MELHORANDO?" do diagnóstico** — duas cópias e uma apontaria para um lado e a
  outra diria o contrário. Variação abaixo de meio ponto percentual é
  **ESTÁVEL** (→), que é ruído de arredondamento, não melhora.
- **`_pgAnomalias` são quatro checagens, e nenhuma altera indicador**:
  sobreposição · sem motivo · parada acima de `PG_ANOM_LONGA` (30 min) · tipo
  fora da aba `TIPOS_PARADA`. Parada aberta (sem FIM) entra como quinta linha
  quando existe.
  - **"Sem motivo" só conta onde ele FAZ FALTA**: parada de tipo genérico (sem
    o motivo não há o que atacar) ou longa. Motivo é opcional no app — cobrar de
    toda parada curta e nomeada viraria uma parede de alertas e ninguém olharia
    mais. O total sem motivo aparece ao lado, como contexto.
  - **Sem a aba `TIPOS_PARADA` a checagem de classificação NÃO roda**: com o
    mapa vazio, todo tipo cairia como "sem classificação". Melhor não acusar do
    que acusar tudo — o quadro mostra "—" e diz por quê.
- **O quadro é uma TELA do painel (aba GESTÃO DE PERDAS), não só uma folha do
  PDF** (correção do PPCP em 27/08/2026: *"gestão de perda era uma tela nova"*).
  A aba fica ao lado de PARADAS e mostra o quadro + o DIAGNÓSTICO PPCP; o
  relatório completo continua no botão.
  - **O desenho é o MESMO `_pgQuadroHtml`** nos dois. O que muda é a **pele**:
    um bloco de CSS escopado por `#sec-perdas` com os tokens do painel (o PDF é
    claro e impresso, a tela é escura e lida a 60 cm). Mexeu na marcação do
    quadro? Confira as DUAS peles — a marcação é uma só. `relatorios.test.js`
    falha se `_pgQuadroHtml` virar duas implementações.
  - **A busca e as contas também são únicas**: `_pgBuscarDados` (a chamada com
    retry, extraída de dentro do `gerarRelatorioParadas`) e `_pgContexto` (todas
    as funções `_pg*` de uma vez). Tela e PDF do mesmo período mostram, por
    construção, os mesmos números — o teste prende os dois chamadores.
  - **A tela tem o RELATÓRIO DELA** (`gerarRelatorioPerdas`): o quadro + as onze
    seções, com título e rodapé próprios. Antes o botão abria o relatório de
    **PARADAS** — outro documento, outro título, outra pergunta. Os dois botões
    ficam na tela: *RELATÓRIO DESTA TELA* (a leitura de gestão) e *RELATÓRIO DE
    PARADAS* (o controle: resumo, Pareto por tipo, estudo de ganho, SWOT e o
    detalhamento), ambos com o período da tela.
    - Busca, contas e desenho continuam **um só** (`_pgBuscarDados`,
      `_pgContexto`, `_pgSecaoHtml`); o que muda é a moldura.
    - **O `<head>` + os ~150 seletores de CSS moram no `_rpDocParadas(titulo)`**,
      usado pelos dois. Copiar o bloco seria garantir que o próximo ajuste
      conserte um relatório e esqueça o outro — a história do cabeçalho dos
      cinco relatórios (#204/#205). O teste falha se virar duas cópias.
    - `ctx.soZinho` avisa a camada de que ela **abre** o documento: sai o
      "camada sobre o relatório acima", sai o título repetido e sai a quebra de
      página, que imprimiria uma folha em branco na frente.
  - ⚠ **O relatório usa o período de QUEM o chamou** (`gerarRelatorioParadas(de,
    ate)`). Ele lia sempre os campos da aba PARADAS: o botão RELATÓRIO COMPLETO
    da aba GESTÃO DE PERDAS, com 30 dias na tela, abria o PDF do período da
    OUTRA aba — medido, a tela dizia 27h16m e o papel 42 min. O botão da aba
    PARADAS continua sem argumento e lê os campos dela, como sempre.
  - **Padrão 30 DIAS**: o quadro fala em SEMANAS (evolução, tendência, SMED
    semana a semana); em 7 dias há uma semana só e metade da tela fica sem o que
    mostrar.
  - `getParadasPeriodo` lê a aba `PARADAS` inteira, então a tela tem **cache de
    5 min por período** (`PG_TELA_CACHE`) e **guarda de reentrância**
    (`PG_TELA_RODANDO`), como a aba PARADAS. Refresh do mesmo período **mantém o
    que está na tela** e só marca a hora do dado; trocar de período limpa.
  - O **título do quadro some na tela** (a aba e o cabeçalho já dizem GESTÃO DE
    PERDAS) e a **marca da meta vira tracejado branco** — no papel ela é verde,
    e verde sobre a barra verde de quem bateu a meta desaparece.
  - **`MINUTOS DE PARADA / 1.000 CAIXAS` também está na tela** (pedido do
    usuário, 27/08/2026), entre o quadro e o DIAGNÓSTICO: é a régua que compara
    mês contra mês sem que o período maior pareça pior. **`_pgMin1000Html` é o
    desenho único** dos três cartões — o mesmo HTML serve a seção 6 do PDF e a
    tela; copiar os cartões seria a duplicação de sempre. As **duas famílias de
    modificador vão juntas no `class=`** (`a`/`r` do documento do relatório,
    `acc`/`red` do painel): cada pele lê a sua e ignora a outra. **Não há conta
    no desenho** — tudo sai pronto do `_pgContexto`.
  - **O card do total diz TUDO e mostra a divisão** (`= 7,0 previstos + 39,8 não
    programados`): lido sozinho, "MINUTOS PARADOS" foi entendido como *"parada
    prevista"* — e o previsto é justamente a **diferença** entre os dois cards,
    que não tem card próprio. O card do não programado leva a fatia
    (`85,1% do tempo parado`).
  - **A comparação tem grão: SEMANA · QUINZENA · MÊS** (`_pgPorJanela`, pedido
    do usuário: *"compara por semana, mês, quinzena"*). O recorte sai do período
    **já buscado** — nada de segunda chamada, que `getParadasPeriodo` lê a aba
    `PARADAS` inteira. As **três janelas são calculadas juntas** no
    `_pgContexto` (custo desprezível) e o botão da tela (`_pgTrocaGrao`) só
    **redesenha o que está em cache**; o PDF sai no grão que está na tela. A
    barra ganhou o preset **90 DIAS**, que é o que traz três meses.
    - ⚠ A **semana é a `_relSemanaJanela`** (segunda→domingo), a mesma do
      relatório semanal, da Tela D e da evolução da disponibilidade — não
      escrever outro recorte de semana aqui. A **quinzena é 1–15 e 16–fim**.
    - **Só dia trabalhado entra** (*"tira dias não trabalhados"*): dia sem
      produção lançada punha os minutos dele no numerador **sem caixa no
      denominador** — o indicador subia num dia em que ninguém embalou.
      Numerador e denominador olham os MESMOS dias, e o que ficou de fora sai
      escrito embaixo da tabela (`minFora`/`diasFora`) em vez de sumir.
    - A **variação é do NÃO PROGRAMADO** contra a janela anterior da lista, e
      **↓ é melhora**. Janela pela metade (a ponta do período) compara um pedaço
      com um inteiro — a nota avisa.
    - ⚠ **"MÊS QUAL DIA ATÉ QUE DIA?"** (usuário, 27/08/2026). O rótulo diz
      `AGO/26`, mas a linha quase nunca é o mês inteiro: é a parte dele que caiu
      **dentro do período escolhido** e que teve produção lançada — e "JUL/26 ·
      3 dias" não dizia QUAIS 3. Cada linha carrega agora a **faixa que entrou
      nela** (`de`/`ate`/`faixa`, do primeiro ao último dia contado:
      `29/07 → 31/07`), e o card das CAIXAS APONTADAS traz a faixa do período
      todo. Os extremos saem da **data ordenável** (`dia`, do `_pgJanelaDe`),
      não da ordem em que o dia apareceu na lista. `_pgFaixaDias` é o formato
      único — dia único não vira intervalo, e sem data não inventa faixa.
    - A **concordância vem da tabela `PG_GRAOS`** (`g`, gênero; `cap`, com
      inicial maiúscula): as frases montam o nome do grão dentro delas e saíam
      "uma mês com produção" e "nenhum semana".
    - **A TABELA de uma janela mora no `_pgJanelaTabelaHtml`, uma vez.** O
      bloco (`_pgMin1000Html`) imprime o grão em cartaz; a impressão dedicada
      imprime as outras duas com a MESMA tabela. Nenhuma conta ali dentro —
      tudo vem pronto do `_pgPorJanela`.
  - **IMPRESSÃO DEDICADA — `gerarRelatorioMin1000`** (pedido do usuário,
    27/08/2026: *"colocar uma impressão dedicada a minutos de parada /1000"*).
    O indicador só ia ao papel **dentro** de um relatório maior: quem levava só
    a comparação para a reunião imprimia a gestão de perdas inteira para usar
    uma folha. O botão **🖨 IMPRIMIR ESTE** fica no próprio bloco, ao lado dos
    grãos, e manda o período **da tela de perdas** (`pg-de`/`pg-ate`) — o
    relatório saindo com o período da OUTRA aba já aconteceu.
    - Busca, contas e desenho continuam **os mesmos** (`_pgBuscarDados`,
      `_pgContexto`, `_pgMin1000Html`, `_pgJanelaTabelaHtml`); muda a moldura.
      Saem as **três janelas** — a da tela abre o documento, as outras duas vêm
      como conferência, **sem busca nova** (as três já vêm do contexto, e
      `getParadasPeriodo` é a leitura mais cara daqui).
    - **RETRATO**: são tabelas altas e estreitas, como o relatório de PARADAS.
      Só a GESTÃO DE PERDAS é paisagem, por causa do quadro 2×2.
    - A seção **COMO O NÚMERO SAI** é o que o papel precisa dizer sozinho: a
      conta, de onde vêm minutos e caixas, que dias entram e o que é o não
      programado. `relatorios.test.js` prende os três chamadores do
      `_rpDocParadas` e do `_pgMin1000Html`.
  - ⚠ **A escala de fonte da tela é a do PAINEL, não a do papel** (correção do
    usuário, 27/08/2026: *"fontes bem pequenas, ruim de ler"* — e *"fonte só na
    tela"*). A pele nasceu copiando os corpos do PDF (8–9,5px), que se lê com o
    papel na mão; no monitor, a 60 cm, aquilo era ilegível. Hoje o skin
    `#sec-perdas` anda entre **10,5 e 13,5px**, alinhado com o resto do painel
    (`.kpi-lbl` 10px, `.kpi-sub` 11px), com o mínimo de 9,5px só nas etiquetas
    (ALVO NOVO, ABERTO). **As fontes do PDF não foram tocadas** — lá a capa tem
    de caber na folha 1, e é outra distância de leitura.
- **SIMULADOR DE INVESTIMENTO na tela** (pedido do PPCP, 28/08/2026 — o caso
  que o originou: justificar a troca automática de bobina do termoencolhível
  pelas paradas de `Troca de Plastico`, 327 min · 55× · 1.030 cx em 30 dias).
  Bloco no fim da aba GESTÃO DE PERDAS: o gestor marca as **causas a atacar**
  no Pareto do período (qualquer uma, não só a troca de plástico), digita o
  cenário — % de redução, custo-hora, **pessoas na embalagem**, adicional e
  h/semana de HE, investimento — e lê tempo/caixas recuperados por mês,
  CUSTO DA PARADA, ECONOMIA EM HE, payback, **ROI**, **HORA EXTRA EVITÁVEL**
  (% da HE do mês que o ataque explica) e a disponibilidade antes → depois
  contra a meta de 90%.
  - **`_pgSimulacao` é conta PURA e testada** (`relatorios.test.js`): consome o
    `min`/`perd` que o `RP_PARADAS.stats` já valorou com a meta de cada dia —
    nenhuma fórmula de perda reescrita, **zero chamada nova** (o contexto vem do
    `PG_TELA_CACHE`; o caminho do cache passou a marcar `PG_TELA_ULT`, senão
    A→B→A dentro do TTL deixava grão e simulador lendo o contexto da outra
    tela).
  - **Mensalização por mês típico de 22 dias úteis** (a mesma projeção da
    SWOT): R$/mês e payback precisam de mês e o período em tela varia de 7 a
    90 dias. HE do mês = h/semana × 4,4 (22 ÷ 5).
  - **AS GRANDEZAS NÃO SE MISTURAM** (correção de 28/08/2026): o CUSTO-HORA
    (R$ 382,89) é de **UMA HORA DE LINHA** — já contempla todas as pessoas da
    embalagem, não é custo por pessoa; a HORA EXTRA é digitada em **HOMEM-HORA
    por semana** (soma da equipe, e o rótulo do campo diz isso). O card HORA
    EXTRA EVITÁVEL dividia hora de linha por homem-hora — % sem significado.
    Daí o campo **PESSOAS NA EMBALAGEM (qtde)**: HE em hora de linha =
    h/semana × 4,4 ÷ pessoas (`heMesHH`/`heMesLinha`; `custoHoraPessoa` =
    custo-hora ÷ pessoas). Sem pessoas o card mostra "—" e pede a quantidade.
  - **O R$ sai em DOIS CONCEITOS que NÃO se somam** (o menor está contido no
    maior — somar seria contagem dupla): **CUSTO DA PARADA** = horas
    recuperadas × custo-hora ("folha já paga — não é economia de caixa") e
    **ECONOMIA EM HE** = as mesmas horas × custo-hora × (1+adicional)
    ("caixa, se a produção é reposta em hora extra"). A faixa única
    "R$ menor – maior" sugeria incerteza e escondia que eram conceitos
    diferentes.
  - **TETO na ECONOMIA EM HE**: não se economiza mais HE do que a praticada —
    `horasVal = mín(recuperadas, heMesLinha)`. O **excedente NUNCA vira R$**:
    sai como nota no card de CAIXAS RECUPERADAS ("X,Xh acima da HE praticada →
    ganho de capacidade, não de custo"). Sem HE/pessoas informadas não há
    teto e o valor sai marcado como **estimativa** (`heEstim`), nunca em
    silêncio.
  - **PAYBACK é valor ÚNICO e usa SÓ a ECONOMIA EM HE** (`pay` — `payMin`/
    `payMax` não existem mais). **ROI ao lado do payback**: horizonte
    selecionável no próprio rótulo do card (select 3/5 anos, padrão 5, o
    escolhido persiste no cenário salvo); `ganhoAcum = economiaHE × anos × 12`,
    `roi = (ganho − investimento) ÷ investimento`; **negativo sai em
    vermelho**.
  - **Nada é gravado** (etiqueta âmbar SIMULAÇÃO, como o simulador da esteira);
    o cenário digitado persiste no `localStorage['rpe_pg_sim']` para o gestor
    não redigitar o custo-hora. `_pgSimNum` lê número em pt-BR (`382,89`,
    `1.234,56`, `50.000`). ⚠ **Custo-hora NÃO tem valor padrão no código de
    propósito**: o HTML é público na Vercel e o custo real da linha não vai
    nele.
  - O `oninput` redesenha **só `#pg-sim-res`** — refazer o bloco inteiro a cada
    tecla roubaria o foco do campo que o gestor está digitando.
  - **Os valores saem POR MÊS e POR ANO** ("colocar por ano tbm", 28/08/2026):
    ano = mês típico × 12, calculado dentro do `_pgSimulacao` (`cxAno`,
    `horasAno`, `rsAno`, `rsAnoHE`) — é o número que a diretoria compara com o
    orçamento.
  - **IMPRESSÃO EXECUTIVA — `gerarRelatorioInvestimento`** (botão no título do
    bloco): a proposta em uma página para a diretoria, no formato de proposta
    para aprovação — headline, problema, cenário, ganho (mês e ano), payback e
    COMO O NÚMERO SAI — em **retrato**, no documento compartilhado
    (`_rpDocParadas`). As contas são as MESMAS da tela (`_pgSimEstado` +
    `_pgSimulacao`); o contexto vem do `PG_TELA_CACHE` quando fresco (papel =
    tela por construção), senão da mesma busca com retry. Sem orçamento
    digitado, o papel imprime a régua *"cada R$ 10.000 se paga em X meses"*
    (sobre a economia em HE); o rodapé metodológico diz que é **simulação, não
    medição** — o antes × depois real sai da GESTÃO DE PERDAS dos meses
    seguintes. O papel explica a conversão **HOMEM-HORA → HORA DE LINHA**, por
    que os dois R$ **não se somam** e o teto da economia; a seção 4 traz
    payback único e a linha do ROI. `relatorios.test.js` prende conta única,
    retrato, o botão da tela e as frases-chave.
- **`porDia` do `paradas-calc.js` ganhou `qtd`/`qtdNP`/`tipos`** (campos
  ADICIONAIS — `min`/`minNP`/`perd` seguem iguais): é de lá que sai a principal
  causa de cada dia. `diasTrabalhadosLista()` é a lista por trás do
  `diasTrabalhados()` — contagem e lista saem do mesmo filtro.

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
  lista `GLOBAIS` do `lint-js.js`, senão o lint acusa `no-undef`.
- **`aria-label` nos botões cujo rótulo é só um símbolo**: ⚙, ‹, ›, ◀, ▶, ↺, ✕
  no v7 e o ⌫ dos dois teclados numéricos do mobile. Os demais botões já têm
  texto, que é o nome acessível — não foi feita varredura cega de ARIA.

**Ainda NÃO corrigido** (achado verificado, decisão pendente): o
`startsWith('L')` da detecção de coluna de LOTE (ver acima — depende de conferir
os cabeçalhos reais da `HORA_A_HORA`) · a
COBERTURA DO APONTAMENTO só existe no PDF, não na tela ao vivo · mensagens de
erro que ainda expõem `e.message` cru nos 4 relatórios.

## EFICIÊNCIA: uma régua só, e é a META DO DIA
- **O cartão mostrava um número de uma conta com a cor de OUTRA.** O número era
  `efDia` (realizado ÷ meta do DIA) e a cor/status vinham de `ef` (realizado ÷
  meta das horas já lançadas, que sai da `HORA_A_HORA`). Enquanto as duas metas
  concordam ninguém percebe. Medido em **31/08/2026**: a PROGRAMAÇÃO pedia
  **2.709 cx** no dia e a `HORA_A_HORA` planejava **164 cx/h** (1.476 no dia) —
  84% de diferença. A TV escreveu **49,8% em VERDE com "DENTRO DA META"**, ao
  lado da própria **PROJEÇÃO FINAL de 1.519** contra meta de 2.709.
- **A régua é `efNoRitmo(real, metaDia, minRodado, minTurno)` no `rp-core.js`**,
  uma implementação para os dois painéis: realizado ÷ quanto da **meta do dia**
  já deveria estar feito a esta altura do turno.
  - **Rateio por MINUTOS, não por nº de horas**: o slot pós-almoço vale 48 min, e
    contá-lo como hora cheia cobraria meta de 12 minutos que não existem.
  - **Só entra hora COM LANÇAMENTO** — hora que ninguém apontou ainda não é hora
    atrasada (mesma regra do `calcAtrasoHoras`).
  - Turno sem hora lançada devolve 0, como os painéis já faziam antes.
- **Quem usa: TV (telas A e B), gerencial do desktop e gerencial do celular.**
  Painel que julga o mesmo instante de dois jeitos é o defeito que este projeto
  mais pagou caro — por isso a conta saiu dos dois HTMLs para o núcleo.
  `rp-core.test.js` cobre a conta e `relatorios.test.js` falha se `sc(k.ef)`
  voltar a pintar alguma tela.
- **O % da meta do dia não sumiu**: era o número grande e virou a **linha de
  apoio** (`#tv-ef-sub` na Tela A, espelhado em `#tvb-ef-sub` na Tela B, e o
  `sub` do card no gerencial). ⚠ A Tela A tem `.tv-left{display:none}` no layout
  largo — **a tela que roda na TV é a B**, e ela espelha o DOM da A: linha nova
  na A precisa de espelho no `_sincSlideB`, senão só aparece no layout estreito.
- ⚠ **Quando as duas metas divergirem muito, o problema pode ser o DADO**: meta
  do dia vinda da PROGRAMAÇÃO (`CFG.metaDia`, via `aplicarMetaDiaAutomatica`)
  contra a meta/hora digitada na `HORA_A_HORA`. O painel agora acusa a diferença
  em vez de escondê-la atrás de um verde.

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
