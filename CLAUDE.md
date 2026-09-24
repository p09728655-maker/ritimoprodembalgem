# RitmoPatrimar · Embalagem — Memória do projeto

Painel de ritmo de produção (Patrimar Móveis · Embalagem · Jaci/SP).
Slogan: **Medimos o pulso da·linha.**
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
  que conta leituras, **e o carimbo `ATUALIZADO_EM` da `PROGRAMACAO`** (roda a
  função real): `node apps-script.test.js`.
- `lancamento.test.js` — qual hora aceita lançamento no mobile (hora corrente +
  tolerância da recém-fechada), contra o código real: `node lancamento.test.js`.
- `tela-e.test.js` — Tela E da TV (programação do dia): ordem, situação, corte
  de linhas, entrada no ciclo, config, e a cor/`atrasoDesde` do
  `calcularProgramacao` real: `node tela-e.test.js`.
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

## Paradas com SEGUNDOS (microparadas)
- Pedido do PPCP, 17/09/2026: *"a duração está vindo número fechado, ex. 8:24 a
  8:25 = 1; vamos precisar pegar os segundos também, estamos estudando as
  microparadas"*. Na aba `PARADAS` daquele dia, três `Parada/Empilhar peças`
  (08:24→08:25, 08:39→08:39, 08:44→08:44) valiam **1, vazio e vazio**.
- **O mobile manda `HH:mm:ss`** (`nowHoraSeg()`, no REGISTRAR e no START); o
  `.gs` (v5.5) carimba o FIM do servidor com segundos, grava **`DURACAO_MIN`
  com fração** (45 s = `0,75`, duas casas) e a coluna **H `DURACAO_SEG`**
  (segundos inteiros; `_garantirColDuracaoSeg` escreve o cabeçalho na aba
  antiga na 1ª gravação). `calcDurMin` → `calcDurSeg` → `_horaEmSeg`, uma
  leitura só, segundos **opcionais** (linha antiga lê como `:00`).
- **`_horaSegStr` é só da `PARADAS`**: célula de hora sai `HH:mm:ss` quando tem
  segundos e `HH:mm` quando não tem — linha antiga volta exatamente como
  voltava. ⚠ **Não trocar o `_horaStr`** (HH:mm): ele é da `HORA_A_HORA` e do
  log de produto, onde segundo não existe e o formato entra em rótulo.
- **No front, `toMin` (rp-core E paradas-calc) lê o terceiro campo como
  fração** — `08:39:45` → 519,75. Rótulo de slot nunca tem segundos, então os
  ~500 pontos de chamada seguem recebendo o inteiro. `RP_PARADAS.durMin`
  aceita `HH:mm(:ss)?` e devolve minuto com fração; **`fmtMin`** é o formato
  único (*45 s* · *3m15s* · *3 min* · *1h05m*), e o `tMed` do `stats` deixou
  de ser inteiro (era "0 min em média" com paradas de 40 s). Os `_fmtMin2` /
  `_durMin2` do mobile são fallback sem o módulo e espelham isso.
- **Cronômetro da TV (`_segDesde`) e banner do celular** partem do segundo
  certo; abaixo de 1 min o banner mostra segundos. As regexes `^\d{1,2}:\d{2}$`
  de parada nos dois HTMLs viraram `(:\d{2})?` — a sobreposição, o corte do
  período anterior e o SMED (`menor`/`maior` agora passam pelo `_fmtMinPar`).
- **Antes do re-deploy nada quebra**: o `.gs` antigo grava a string como veio,
  trunca só a `DURACAO_MIN` e devolve a hora sem segundos.
- Testes: `paradas-calc.test.js` (segundos, formato, série de microparadas),
  `rp-core.test.js` (toMin) e `apps-script.test.js` (roda `calcDurMin`,
  `_horaSegStr` e o `endParada` REAL numa aba de 7 colunas: FIM com segundos,
  0,75 na F, 45 na H, cabeçalho criado uma vez).
- ⚠ **`relatorios.test.js` estava quebrado na `main` desde a v7.55** (três
  `const _base`/`_relPlano` repetidos → `SyntaxError`, e quatro guardas que
  não acompanharam o 🖨 CARTEIRA: contagens 5→6 e 10→11, e dois textos que
  moram na marcação HTML mas eram procurados só nos `<script>`). Consertado no
  teste, sem tocar no painel. Suíte que não roda não guarda nada — rodar as
  sete (hoje oito, com o `tela-e.test.js`) antes de publicar.

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

## STATUS da PROGRAMACAO: EM ANDAMENTO é do lote DE HOJE
- Pedido do usuário (14/09/2026): *"status em andamento só lotes do dia, anterior
  ao dia atual é em atraso"*. Um lote programado para **02/09** saía como **EM
  ANDAMENTO** no dia **14/09** — a palavra dizia que a coisa caminha, e ela está
  parada há doze dias.
- Os cinco estados, em `atualizarSaldoNaProgramacao`: **`CONCLUIDO`** (saldo 0) ·
  **`EM ATRASO`** (data anterior a hoje, não concluída) · **`EM ANDAMENTO`**
  (lote de HOJE que já produziu) · **`PENDENTE`** (lote de HOJE que não começou) ·
  **`FORA DA ESTEIRA`**. Data futura continua **em branco**.
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
- **A string do STATUS não é lida por ninguém** — nem pelo painel nem pelo
  `.gs`. O arquivamento decide pelo saldo FIFO (`l.estado`), não pelo texto; a
  `PROGRAMACAO_CONCLUIDA` só congela o que está gravado. É leitura humana.
- ⚠ **O status só se atualiza quando o script roda** (a cada lançamento). Antes
  do primeiro apontamento do dia, a aba ainda mostra o retrato de ontem.
- ⚠ Com a programação toda vencida, a aba inteira sai EM ATRASO — é o retrato da
  carteira, não defeito da regra. Aí quem prioriza é a **DATA** e o **SALDO**.
- ⚠ Mudou o `.gs` (v5.4) → **re-deploy manual**. `apps-script.test.js` cobre os
  quatro status, a virada do dia sem recarimbo e a fase.

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
- **`getParadasPeriodo` tem UMA busca no desktop: `_paradasPeriodoBusca`**
  (v7.61.0, 23/09/2026 — *"está demorando"*, aba PARADAS em 30 DIAS com
  NÃO CARREGOU). Cache de 5 min por `de|ate` + voo compartilhado; PARADAS,
  `_pgBuscarDados` (GESTÃO DE PERDAS, SIMULADOR, relatórios) passam por ela.
  O refresh `silent` força dado fresco; o `forcar` do `_pgContextoDoPeriodo`
  derruba o bruto junto (`invalidarParadasPeriodo`). Na falha, a aba limpa os
  gráficos do carregamento anterior, oferece ↻ e tenta sozinha 1× em 20 s. O
  refresh da aba roda **depois** do `lerSheets` (`_parDepois`).
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

## Relatórios em popup (peças comuns)
- **A faixa do PPCP, o botão IMPRIMIR e o logo estavam escritos CINCO vezes** —
  um por relatório (semanal, histórico, paradas, produção por família e por
  modelo). Foi por isso que o #204 arrumou o cabeçalho de um e o #205 teve de
  repetir a mesma correção nos outros quatro. Agora são
  `_rpCabecalho(titulo, metaHtml, subExtra)`, `_rpBotaoImprimir()` e `_rpEsc()`.
  O `relatorios.test.js` falha se algum deles voltar a aparecer duplicado.
- ⚠ **A MARCAÇÃO estava unificada; a PELE que a pinta, NÃO** — e foi por ali que
  a história do #204/#205 se repetiu (corrigido em 15/09/2026, v7.43.0). O
  `_rpCabecalho` era um lugar só desde o #205, mas o **CSS do cabeçalho** e o
  `<link>` das fontes continuavam escritos **nos cinco documentos**. A cópia do
  **HISTÓRICO** envelheceu: perdeu a regra `.rp-logo span{color:#FF5C1F}` e
  ficou com o logo a **18px**. Como `.rp-header .rp-logo` pinta o bloco inteiro
  de branco, sem aquela regra o **PATRIMAR herda o branco** — medido no
  Chromium: **branco a 18px** nesse relatório contra **laranja a 22px** nos
  outros sete, o mesmo cabeçalho.
  - Hoje são `_RP_HEADER_CSS` e `_RP_FONTS`, ao lado do `_rpCabecalho` na
    seção das peças comuns, lidas pelos **cinco** documentos. Seguem a forma do
    `_RP_CASC_CSS`, que já era assim.
  - As constantes são declaradas **depois** dos primeiros usos (L~5380 usa,
    L~7190 declara). Não há TDZ: todo uso está **dentro de corpo de função**,
    avaliado na chamada — é o mesmo arranjo do `_RP_CASC_CSS`, e os cinco
    sítios estão no mesmo `<script>` (L2555–L12150).
  - O `<link>` do `<head>` do **próprio painel** não entra na conta: ele não é
    relatório. Por isso a guarda conta as ocorrências **dentro dos `<script>`**,
    onde só a constante aparece.
  - **O acento de cada documento continua LOCAL**: `.rp-dia` (produção),
    `.rp-semana` (histórico e semanal) e `.rp-per` (paradas) — este último é
    **vermelho de propósito**, não é cópia desatualizada dos outros.
  - Ao procurar cópia de peça de relatório, procurar a **pele junto com a
    marcação**: unificar só uma das duas deixa a outra livre para envelhecer, em
    silêncio, por oito documentos.
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
- **SIMULADOR DE INVESTIMENTO — hoje em ABA PRÓPRIA** (pedido do PPCP, 28/08/2026 — o caso
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
  - **O GANHO ANUAL tem LINHA PRÓPRIA** (pedido do usuário, 04/09/2026:
    *"melhorar o foco no ganho anual"*). O ano aparecia em 8–10px cinza no fim
    da linha de explicação — e é ele que se compara com o **orçamento** de um
    equipamento. Hoje cada card de ganho (tempo, caixas, custo da parada,
    economia em HE) tem a linha do ano em corpo de texto (`.pg-sim-c-a` na
    tela, `.kpi-ano` no papel), logo abaixo do número grande.
    ⚠ **O número grande continua sendo o MÊS**, de propósito: é ele que
    alimenta o **payback** e é a leitura do dia a dia. Inverter os dois deixaria
    o payback (em meses) ao lado de um valor anual. Nenhuma conta mudou — `ano
    = mês típico × 12`, como sempre.
  - **A proposta é DOCUMENTO DE DIRETORIA, com o roteiro escrito na folha**
    (redesenho de 04/09/2026): **PROBLEMA → CENÁRIO SIMULADO → GANHO SIMULADO →
    INVESTIMENTO → RETORNO** (`.prop-fluxo`). A folha 1 é a capa executiva — a
    proposta em uma frase, os três números do problema em cartões grandes
    (`.prop-stats`: ocorrências · tempo parado · caixas perdidas, os MESMOS
    totais da linha TOTAL da tabela), a tabela de causas, as premissas
    (`.prop-prem`) e o quadro do ganho, tudo antes da 1ª quebra.
    - **O ritmo vertical foi MEDIDO, não chutado**: a folha útil do A4 retrato
      com a `@page` deste documento tem **1032px** (297mm − 24mm de margem), e
      o quadro do ganho termina em ~1021px. Encolher fonte para caber mais não
      vale — o que se corta é padding e entrelinha. `.prop .kpi-grid` leva
      `page-break-inside:avoid`: se um dia não couber, ele **muda de folha
      inteiro** em vez de partir ao meio.
    - **INVESTIMENTO e RETORNO têm seção própria e ESTADO EXPLÍCITO.** Sem
      orçamento o papel escreve **AGUARDANDO ORÇAMENTO** e **"não calculado —
      aguardando orçamento"** em payback e ROI (`.prop-ret`), nunca um número
      estimado; a régua *"cada R$ 10.000 se paga em X meses"* continua com a
      redação de sempre. "Aguardando" é **âmbar**, não vermelho: é estado
      pendente, não erro — para a diretoria, vermelho ali lê como problema.
    - **A metodologia virou nota técnica** (`.prop-met`, sete blocos, texto
      idêntico ao da tabela antiga) com corpo de leitura maior.
    - **Cor só onde tem função.** Os cards de ganho herdavam a barra
      **vermelha** do relatório de controle (lá ela marca perda). No escopo da
      proposta o neutro é cinza; sobraram o verde da capacidade, o laranja da
      economia em HE e o âmbar do selo. E a frase **"ganho de capacidade não é
      economia de caixa"** fecha o quadro: caixa e hora recuperadas são
      capacidade, não dinheiro economizado.
  - ⚠ **A PELE DA PROPOSTA É ESCOPADA EM `.prop`.** O `<head>` e as ~150 regras
    do `_rpDocParadas` são dos **quatro** relatórios — uma regra solta aqui
    mudaria paradas, gestão de perdas e minutos/1.000 junto, que é a história do
    cabeçalho dos cinco relatórios (#204/#205). O `relatorios.test.js` lê o
    bloco `skin` e **falha se algum seletor dele não começar com `.prop`**.
  - ⚠ **UM NOME POR INDICADOR.** O briefing pedia "economia potencial em HE"; o
    card continua **ECONOMIA EM HE** e a palavra *potencial* entra como
    qualificador (o selo **SIMULAÇÃO DE POTENCIAL** e a nota do quadro). Dois
    nomes para o mesmo número em tela, papel e glossário é o defeito que este
    projeto mais pagou caro.
  - **TICKET MÉDIO → POTENCIAL DE RECEITA, a TERCEIRA leitura financeira**
    (pedido do usuário, 04/09/2026). Campo **opcional** em R$/caixa no cenário;
    com ele, `caixas recuperadas × ticket` vira o potencial mensal e `× 12` o
    anual (`ticket`/`receitaMes`/`receitaAno` no `_pgSimulacao`).
    - ⚠ **SEM TICKET, NADA É CALCULADO.** O painel não arbitra preço médio nem
      mostra zero — mostra *"ticket médio não informado — potencial de receita
      não calculado"*. Zero afirmaria que a capacidade não vale nada.
    - ⚠ **ELE NUNCA ENTRA NO PAYBACK NEM NO ROI**, que continuam saindo só da
      ECONOMIA EM HE: receita potencial não é dinheiro disponível para pagar
      investimento. `relatorios.test.js` roda a conta com e sem ticket e falha
      se ele mexer em `pay`, `roi`, `rsMesHE`, `rsMes` ou `cxMes`.
    - **Caixa recuperada é CAPACIDADE, não venda.** Não é economia, não é lucro
      e não é faturamento garantido — só se realiza se houver demanda. E o
      ticket é a **média do mix do período**: modelos e caixas de valores
      diferentes entram na mesma média. As duas ressalvas vão impressas.
    - **O card sai TRACEJADO** (`.prop .kpi-card.pot` no papel, `.cond` na
      tela). Medido com ticket de R$ 187,50: o potencial dá **R$ 3.555.000/ano**
      contra **R$ 46.867/ano** de economia em HE — 76× — e os dois dividem a
      mesma linha. Sem a diferença visual, a leitura ancora no maior.
  - **A proposta separou CAPACIDADE de DINHEIRO** (mesmo pedido): o fluxo virou
    **PROBLEMA → CENÁRIO → CAPACIDADE → IMPACTO → INVESTIMENTO → RETORNO**, e a
    seção 3 (A CAPACIDADE RECUPERADA, linha de quatro) ficou separada da 4 (O
    IMPACTO ECONÔMICO — TRÊS LEITURAS QUE NÃO SE SOMAM, linha de três).
    ⚠ Com isso a folha 1 passou a levar **capa + problema + cenário +
    capacidade**; o impacto econômico abre a folha 2. A nota anterior, de que o
    quadro do ganho cabia na folha 1, valia para o quadro de seis cards que não
    existe mais.
  - **ETIQUETAS DE NATUREZA DO DADO** (`.prop-et`): **APONTADO** · **ESTIMADO**
    · **SIMULADO** · **POTENCIAL** · **OCIOSIDADE**.
    ⚠ **Ocorrências e tempo parado SÃO apontamento; caixas perdidas é CONTA**
    (duração produtiva × meta do dia ÷ horas produtivas). Marcar os três como
    "REAL" afirmaria como medido um número que é estimado — e é exatamente essa
    confusão que as etiquetas existem para evitar.
  - **ABA PRÓPRIA E FILTRO DE DATAS PRÓPRIO** (pedido do usuário, 04/09/2026).
    O bloco saiu do rodapé da GESTÃO DE PERDAS e virou a aba **💡 SIMULADOR**
    (`#sec-simulador`, `renderSimulador`/`_simPintar`), com `sim-de`/`sim-ate`,
    os presets 7·15·30·90·MÊS e o botão da IMPRESSÃO EXECUTIVA — que manda o
    período **desta** aba. **Por quê:** a gestão acompanha os 30 dias rolando e
    a proposta de um equipamento pede o recorte que o gestor escolher; com um
    filtro só, montar a proposta mexia na tela de acompanhamento.
    - ⚠ **O CUSTO DAS CHAMADAS NÃO PODE SUBIR.** `getParadasPeriodo` lê a aba
      `PARADAS` inteira. O contexto de um período é montado **uma vez só**
      (`_pgContextoDoPeriodo`), guardado no **mesmo `PG_TELA_CACHE`** (chave
      `de|ate`, TTL 5 min) que a gestão de perdas usa, e uma requisição **em
      voo é compartilhada** (`PG_VOO`) — duas telas pedindo a mesma janela
      viram UMA execução no Apps Script, não duas. É o mesmo remédio do
      `_phVoo` do comparativo por modelo. Os dois filtros começam em **30
      dias** de propósito: quem entra nas duas abas sem mexer no período não
      paga busca nenhuma a mais. `relatorios.test.js` falha se alguma das duas
      telas voltar a montar contexto por conta própria.
    - **`SIM_ULT` é o ponteiro DA ABA**, separado do `PG_TELA_ULT`: é dele que
      o `_pgSimAtualiza` lê o contexto a cada tecla do cenário. Com um ponteiro
      só, a aba que carregasse por último mandava na conta da outra.
    - O CSS do bloco passou de `#sec-perdas .pg-sim*` para **`.pg-sim-wrap
      .pg-sim*`** — o skin viaja com o bloco, sem duplicar seletor por seção.
    - **O título e o botão da impressão moram no cabeçalho da aba**, não dentro
      do bloco: repetidos, viravam dois "SIMULADOR DE INVESTIMENTO" e dois
      botões idênticos, um embaixo do outro.
    - A GESTÃO DE PERDAS ficou com o **ponteiro** (`ABRIR O SIMULADOR`) no
      lugar onde o bloco vivia — sem ele o gestor procura o simulador onde ele
      não está mais.
    - Abaixo do filtro vai a **base da simulação** (dias trabalhados, horas
      produtivas/dia, parada não programada): na aba própria não há mais o
      quadro da gestão de perdas ao lado dizendo de que período se trata.
      Nenhuma conta no desenho — tudo sai pronto do `st`.
  - **A TELA EM TRÊS FAIXAS (v7.63.0, 23/09/2026)** — pedido do usuário com um
    briefing longo: *"evolução profissional, sem mudar a estrutura"*. O
    `_pgSimResHtml` desenha **O INVESTIMENTO E O RETORNO** (investimento →
    economia em HE → payback → ROI) · **IMPACTO OPERACIONAL** · **OUTRAS
    LEITURAS** (custo da parada e potencial de receita, com *"não são economia
    de caixa"* no título). Mesmo `card()`, mesmos nomes, mesmas contas.
    - ⚠ **O nome continua ECONOMIA EM HE** — o briefing pedia "economia
      potencial de horas extras", e isso entrou no **texto** do card, não no
      rótulo (regra UM NOME POR INDICADOR, acima). Etiqueta **SIMULADO** na
      economia (tela e papel), **POTENCIAL** só na receita.
    - **`_pgSimFrase`** (a frase do cenário), **`_pgSimAvisos`** (causa
      genérica; várias causas com uma redução) e **`_pgSimMemHtml`** (memória de
      cálculo) são DESENHO: só repetem o que o `_pgSimulacao` devolveu. A
      memória mora num `<details>` **fora** do `#pg-sim-res`, e o
      `_pgSimAtualiza` redesenha o miolo dela (`#pg-sim-memo`): aberta, ela não
      fecha a cada tecla.
    - ⚠ **HE digitada como 0 ≠ HE vazia** (`heInformada` no `_pgSimEnt`,
      `heZero` na conta): zero é *"não há HE"* → teto 0, economia 0, payback não
      calculável; vazio segue como estimativa sem teto. Antes os dois caíam no
      mesmo caminho.
    - **REDUÇÃO POR CAUSA (v7.64.0)**: `s.redCausa` (`{tipo: %}`, no mesmo
      `rpe_pg_sim`) → `ent.redCausa` → `porCausa` no `_pgSimulacao`. Causa sem
      % próprio usa o **padrão** (`pctRed`), então o cenário antigo dá o mesmo
      número. `pctRes` é "o" % quando todos são iguais (senão `null`) e
      `pctEf` a média ponderada pelo tempo; **`_pgSimPctTxt`** é o texto único
      desse % na tela, na memória e no papel. O campo fica **dentro do
      `<label>`** da causa e só aparece com ela marcada — clicar nele não
      desmarca (conferido no Chromium).
    - **A HE É DIGITADA POR PESSOA (v7.65.0)** — *"seria 15 × 8 hr"*: o campo
      pedia o total da equipe e o PPCP digitou por pessoa, 15× menos HE.
      Agora `s.hePessoa` → `ent.hePessoa`; na conta **h/semana por pessoa × 4,4
      = hora de LINHA** (não precisa das pessoas) e × pessoas = homem-hora.
      ⚠ O `s.heSem` antigo (total) **não é lido pela tela** e é apagado no
      próximo `_pgSimAtualiza` — invisível, ele mudaria o resultado sem
      ninguém ver. `ent.heSem` continua aceito na conta para os testes.
      ⚠ Isso **revoga** a nota "HE digitada em HOMEM-HORA por semana" do
      SIMULADOR DE INVESTIMENTO acima: a grandeza do CUSTO-HORA (hora de linha)
      não mudou, a do campo de HE mudou.
    - **INVESTIMENTO TOTAL E CUSTO RECORRENTE (v7.67.0)** — análise "como
      diretor" da proposta impressa (23/09/2026). `instal` (uma vez) soma no
      `investTotal`; `manutAno`/12 = `custoRecMes` sai da economia em HE →
      `ecoLiqMes`, e **payback e ROI usam `investTotal` e `ecoLiqMes`**. Vazios
      = a conta de antes (o teste prende). Campos de texto (`nome`, `forn`,
      `prazo`, `descr`, `recom`) só vão ao papel — bloco `.prop-oque` e a linha
      RECOMENDAÇÃO DO GESTOR.
    - **REDAÇÃO COM IA (v7.69.0 / .gs v5.6, passo 3, 23/09/2026).** O painel
      CALCULA, o modelo só ESCREVE. `_propMontar(ctx, s)` é a montagem ÚNICA
      da proposta (conta, sensibilidade, textos) — o PDF e a redação leem dela.
      `_propFatos` formata os números como o papel imprime e manda ao `.gs`
      (`action=redigirProposta&dados=JSON`, `jsonpFetch(url, 60000)` — o `ms`
      é opcional e o padrão continua 25 s); o `.gs` chama a API do Claude
      (`IA_MODELO`, saída em `json_schema` com queda para "responda só o
      JSON"), devolve `texto{resumo,problema,solucao,riscos,recomendacao}`,
      `hash` e **`numerosFora`** (`_iaNumerosForaDaLista`: todo número do
      texto que não está nos dados, com tolerância só para arredondamento,
      milhar, ano e contagem ≤12). Cache por hash no `CacheService` (6 h).
      ⚠ **A CHAVE mora em Propriedades do script (`CLAUDE_API_KEY`)** — nunca
      no HTML (público) e nunca devolvida; o teste prende. Sem chave →
      `erro:'sem-chave'`; `.gs` antigo → cai no `getDados()` e o painel marca
      `sem-endpoint` (só aí acusa re-deploy). O texto fica em `s.ia` no
      `rpe_pg_sim` com o hash dos fatos: `_propIaValida` só deixa imprimir com
      hash igual e `numerosFora` vazio — mudou um campo, a tela diz
      DESATUALIZADO e o papel sai sem o texto. Resumo ≤ `IA_RESUMO_MAX`=320
      (420 estourava a capa em 4px); ele vai na capa, os outros quatro abrem a
      folha 2 (LEITURA DO GESTOR). `testarRedacaoIA()` no editor confere a
      chave. **A assinatura é do gestor, não do modelo** — a nota da tela diz.
    - **PÁGINA 1 = DECISÃO (v7.68.0, passo 2, 23/09/2026).** O papel abre com
      O QUE É E QUANTO CUSTA · O QUE RESOLVE · ECONOMIA E RETORNO ·
      SENSIBILIDADE · RECOMENDAÇÃO E ASSINATURAS, e o fio `.prop-fluxo` segue
      essa ordem. A evidência (causas, cenário, capacidade, outras leituras) abre
      a folha 2 e o método vai em ANEXO — quebras por `.prop-quebra`, na pele.
      **A SENSIBILIDADE é conta, não redação**: `PROP_SENS_PCTS=[50,70,90]` e
      a MESMA `_pgSimulacao` roda com `pctRed:p, redCausa:{}` (redução uniforme
      — com o % por causa ligado, "70%" não seria 70% em causa nenhuma); a linha
      do gestor entra com o % dele e é marcada `.prop-sens-g`. ⚠ O **potencial
      de receita saiu da capa** de propósito (ancorava no maior número) e mora
      na seção 9 da evidência, ainda tracejado. Medido: a assinatura fecha a
      folha 1 em ~890px dos 1032 úteis, com e sem orçamento — o que se cortou
      foi ar (`.prop-ass` 22→14px), nunca fonte. **Nada no `.gs`.**
    - **HORA EXTRA EVITÁVEL é exibida com teto de 100%** (`Math.min(100,…)`,
      tela e papel); o `pctHE` da conta continua cru — é ele que o teste prende.
    - **Cor na tela do simulador (v7.64.0, *"está pesado as cores"*)**: número
      é tinta; cor só na ECONOMIA EM HE, no ROI negativo e nas etiquetas
      SIMULAÇÃO/POTENCIAL. O teste falha se `var(--acc)`/`var(--warn)` voltarem
      aos cards.
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
  `if (!cell.getFormula())` e devolve **`{ok:true}` de qualquer jeito**. E
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

## PARADAS no relatório semanal
- **`_relParadasSemanaHtml(st, totMeta)`** fecha o RELATÓRIO SEMANAL com o que a
  semana deixou de embalar (pedido do usuário, 31/08/2026: *"na impressão resumo
  semanal, deve conter as paradas, e o que deixamos de embalar por motivos de
  paradas"*): 4 cartões (caixas perdidas + quanto pesa na meta da semana, tempo
  parado, nº de paradas, disponibilidade) e a tabela de **motivos** com tempo,
  fatia do parado e caixas de cada um.
- **É DESENHO, não conta.** A busca é o `_pgBuscarDados` (o mesmo com retry da
  aba PARADAS / GESTÃO DE PERDAS) e a valoração é o `_paradasStats` →
  `RP_PARADAS`. Uma terceira implementação da perda foi o que fez as telas de
  paradas divergirem três vezes; `relatorios.test.js` falha se
  `perdaDeMin`/`perdaAoRitmo`/`durProdutiva` aparecerem dentro da função.
- **Sem Sheets, sem `paradas-calc.js` ou com a busca falhando, o relatório sai
  inteiro — só sem a seção** (mesma regra da cascata dos relatórios de
  produção). Meio relatório é melhor que relatório nenhum; número de parada
  inventado é pior que os dois.
- Parada **prevista** entra com o tempo dela e **zero caixa** (esconder faria a
  soma do tempo não fechar com o total); parada inteiramente dentro do almoço
  continua fora de tudo.

## O relatório semanal é DOCUMENTO, não painel
- Pedido do usuário em 31/08/2026: *"capricha no layout deixar profissional
  menos cor"*. O papel tinha **seis bordas coloridas de card, valores em
  verde/laranja, título de seção em vermelho e emojis** (🏆 📉) — cor decorativa
  disputando atenção com a única que informa, e ainda concorrendo com o vermelho
  de status.
- **A regra agora: cor só onde há função.** Corpo em grafite (`#1F2328`) sobre
  branco, rótulos em `#5B6470`; status (meta, hora extra, caixas perdidas) fica
  colorido e **sempre com a palavra junto** — nunca cor sozinha. A faixa de
  alerta virou neutra com régua âmbar e a palavra ATENÇÃO no lugar do ⚠.
- **No `_svgBarChart` (semanal E histórico) a barra é grafite quando o dia
  entregou; só o dia abaixo do planejado ganha cor**, e o fantasma da meta é
  cinza. Bater a meta é o esperado — pintar o esperado de verde gasta a atenção
  que o dia ruim precisa. O NÚMERO da barra é fato (tinta) e o PERCENTUAL é
  veredito (cor de status).
- **Segunda passada (mesmo dia, *"ainda muita cor"*): o NÚMERO é tinta, o
  VEREDITO é o selo.** EFICIÊNCIA, EF. S/ HE, H. EXTRA e as caixas perdidas por
  motivo saem em grafite; quem diz se o dia bateu a meta é o selo NA META /
  ATENÇÃO / ABAIXO. No resumo sobrou **um** número colorido (a eficiência da
  semana) e nas paradas outro (as caixas perdidas). No gráfico, **todas as
  barras têm a mesma tinta** — quem mostra o dia abaixo é o fantasma da meta
  aparecendo por cima da barra, e o percentual, que fica vermelho só aí.
- **Coluna META/H** (pedido do usuário, 31/08/2026): meta do dia ÷ **horas do
  turno** (`getSlots().length`), não ÷ horas lançadas — a meta cobre a jornada
  normal e a hora extra não tem meta na planilha, mesma regra do fechamento. É a
  régua de MELHOR H./PIOR H., que são caixas da maior e da menor hora do dia. A
  conta vai **escrita embaixo da tabela**: um dia antigo pode ter rodado com
  outro turno, e o papel tem de dizer de onde saiu o número.
- ⚠ **O cabeçalho (`_rpCabecalho`) não foi tocado**: ele é compartilhado pelos
  cinco relatórios e é a âncora de identidade. Mexer nele é mexer em todos.
- `@media print` do semanal: título de seção não fica órfão
  (`page-break-after:avoid`) e KPIs, faixa de alerta e gráfico não partem ao
  meio — mesma regra já documentada para o relatório de paradas.

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
- **O NÚMERO GRANDE é o % da META DO DIA; o veredito é o selo** (pedido do
  usuário, 01/09/2026: *"essa eficiência está confundindo as pessoas"*). A TV
  mostrava **EFICIÊNCIA 103,8%** em verde com **DENTRO DA META** embaixo, num dia
  de **780 cx contra meta de 2.700**: os dois números certos (103,8% é 780 ÷ 751,
  o que a meta pedia até ali), mas **dois "%" e dois sentidos de META na mesma
  tela** — e quem lê de longe fica com o primeiro.
  - O número grande virou **28,9% DA META DO DIA**, em **tinta** (sem cor de
    status): é o fato que qualquer um confere de cabeça. Mesma regra do
    relatório semanal — *o número é tinta, o veredito é o selo*.
  - O selo passou a falar de **RITMO**, nunca de meta: `NO RITMO` · `ATENÇÃO` ·
    `ABAIXO DO RITMO` (**`slRitmo`**, texto ÚNICO no `rp-core.js` — TV, desktop e
    celular não podem responder "estamos no ritmo?" com palavras diferentes).
  - A linha de apoio traz **caixas, não um segundo percentual**: *"780 de 751 cx
    esperadas até agora"*. A barra segmentada da Tela B enche pelo % do dia e
    pega a **cor do selo** (antes lia a cor do número, que agora é tinta).
  - ⚠ **A conta não mudou** — `efNoRitmo` continua sendo quem pinta a tela.
    Trocou qual número ocupa o lugar grande.
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

## Dia PASSADO no gerencial: hora extra não tem meta, e a meta não se dilui
- A `HISTORICO_HORA` guarda **só `data · hora · realizado`** — sem meta e sem
  marca de hora extra. A tela repartia a meta do dia entre **todas** as horas
  arquivadas, o que num dia iniciado às 05:00 dava meta a horas de HE e diluía a
  das horas de jornada. Medido em **28/08/2026**: 1.881 ÷ 11 = **171** para
  todas, quando as 9 horas de jornada pediam **209** — e a madrugada (96 cx)
  saía `ABAIXO`, virando o VALE DE PRODUÇÃO do dia.
- **`_horaEhHE(rótulo)`** é a regra no front: prefixo `HE ` **ou** horário fora
  de `CFG.turnoInicio`–`CFG.turnoFim`. É a mesma do `_ehHoraExtraCaixas` do
  `.gs`; a janela vem do turno configurado no painel, que o `.gs` repete nas
  constantes `HE_JORNADA_*` (mudou o turno na tela, mudar lá também).
- A meta/h passa a ser `meta ÷ horas de jornada`; a hora extra sai com `—` em
  META/H e EFICIÊNCIA e ganha a etiqueta **HORA EXTRA** (`.b-acc`) no lugar do
  veredito. **PICO e VALE** olham só as horas de jornada, e o RITMO MÉDIO usa a
  mesma base do `arquivarDiaAtual` (realizado ÷ horas produtivas).
- ⚠ **Por que a madrugada está na tabela**: o `arquivarHorasDoDia` só arquiva as
  horas não-HE — mas pelo critério do `.gs` **implantado**, que ainda classifica
  HE só pelo rótulo. Enquanto o re-deploy não acontecer, a madrugada continua
  entrando na `HISTORICO_HORA` como se fosse hora de turno; por isso a regra
  precisa existir também no front.

## Dia de HOJE no gerencial: a mesma regra, ao vivo
- **O `.gs` que classifica HE por HORÁRIO foi re-deployado em 01/09/2026** — o
  usuário confirmou com o painel na tela (*"HE está marcando agora"*): num dia
  com `C3=5`, as linhas de **05:00** e **06:00** chegam ao `getDados` com
  **`he:true`** mesmo sem o rótulo `HE `. É o `_ehHoraExtraCaixas` funcionando.
- Só que a tela **ao vivo** continuava julgando essas horas. Medido no mesmo dia,
  às 06:55: META/H **245**, eficiência **98,0%** e **144,0%**, selo **OK**; PICO
  **06:00** e VALE **05:00** — as duas horas de HE, num turno que ainda nem tinha
  começado; e o `(+5)` que faltou às 05:00 sendo cobrado da hora seguinte.
  Era a v7.34.0 valendo só para o dia passado.
- **Agora a régua é uma só, e vale nos dois gerenciais** (desktop e celular):
  - hora de HE sai com **`—`** em META/H e EFICIÊNCIA e ganha a etiqueta
    **HORA EXTRA** no lugar do veredito (`b-acc`, a mesma marcação do dia
    passado). O ponto âmbar e o fundo da linha continuam onde estavam;
  - **PICO/VALE e MELHOR/PIOR HORA olham só as horas de jornada** (`k.nNorm`).
    Sem hora de jornada lançada os quatro mostram **`—`** — zero afirmaria "a
    melhor hora do turno fez 0 cx". É a MESMA base que o `arquivarDiaAtual` e o
    botão FECHAR DIA já gravavam no `HISTORICO`;
  - **hora extra fica fora do atraso acumulado, nos dois sentidos**
    (`calcAtrasoHoras` pula a linha com `he`): ela não gera atraso para as horas
    de jornada seguintes nem quita o atraso delas com caixas feitas fora do
    turno — uma madrugada forte apagaria o atraso do turno inteiro.
- **O que NÃO mudou:** PRODUÇÃO REAL, META DO DIA, CAIXAS EM HORA EXTRA,
  EFICIÊNCIA do card, RITMO ATUAL, PROJEÇÃO e RITMO NECESSÁRIO. As caixas da HE
  contam para a meta do dia como sempre contaram.
- ⚠ **A TV OPERACIONAL ficou fora, de propósito** (decisão do usuário,
  01/09/2026): lá a meta da hora é o **ritmo que o operador acompanha** durante a
  hora extra, não um veredito de gestão. Se um dia isso mudar, é a tabela
  `tv-tbl-body` e a Tela A (`tva-pct`/`tva-status`) que precisam da regra.
- ⚠ **A hora de HE só aparece no celular se tiver meta na planilha**: o mobile
  monta o `DADOS` com `slots.filter(s=>s.metaHora>0)`. Linha de HE com a meta
  **vazia** some da tabela do celular *e das caixas dele* — o desktop mostraria
  as caixas e o celular não. Não foi mexido (hoje a `HORA_A_HORA` traz meta em
  todas as linhas), mas é o primeiro lugar a olhar se os dois divergirem no
  realizado de um dia com hora extra.
- `relatorios.test.js` prende a regra nos dois painéis e `rp-core.test.js` cobre
  o atraso; se a etiqueta `HE` voltar a aparecer colada num selo OK, o teste
  falha.

## O que é gravado no HISTORICO tem de fechar consigo mesmo
- **O FECHAR DIA gravava META e EFICIÊNCIA de metas diferentes.** A coluna META
  levava `k.meta` (a meta do DIA — no modo Sheets, a da PROGRAMAÇÃO) e a coluna
  EFICIÊNCIA levava `k.ef` (realizado ÷ meta das horas JÁ LANÇADAS, da
  `HORA_A_HORA`). Enquanto as duas metas concordam ninguém percebe.
  - Medido em **28/08/2026**: a linha ficou com **META 1.881 e EF 100,6%** —
    100,6% é 1.509 ÷ **1.500**. O relatório semanal, que imprime a coluna EF,
    dizia *"100,6% · NA META"*; o bloco FECHAMENTO DA SEMANA PASSADA, que
    divide `real/meta`, dizia **80,2%** para o mesmo dia.
  - O **fechamento automático das 17:05** (`arquivarDiaAtual`, no `.gs`) sempre
    fez certo: soma a meta das linhas não-HE e calcula `ef = real ÷ meta` com
    essa mesma meta. Quem estava fora do padrão era o botão do painel.
  - Hoje `salvarDiaSheets` calcula `efGrav = real ÷ k.meta` e grava ESSA.
    `relatorios.test.js` falha se `'ef='+k.ef` voltar.
- **O mesmo botão ZERAVA a coluna MEDIA CX/H.** O `saveDay` grava
  `Number(p.mediaH || 0)` e `salvarDiaSheets` nunca mandava esse campo — e,
  sendo upsert por data, o botão apagava até o valor que o fechamento automático
  já tinha escrito. **Medido na planilha real (31/08/2026): das 69 linhas do
  `HISTORICO`, as 17 com `FECHADO=TRUE` (as do botão) tinham média zerada; as do
  `AUTO` tinham o valor.** Hoje o botão manda `mediaH` = realizado ÷ horas
  produtivas (não-HE), a MESMA conta do `arquivarDiaAtual`, e `melhor`/`pior`
  passaram a olhar só as horas não-HE, como o `.gs` sempre fez.
- ⚠ **Correção (conferido na planilha em 01/09/2026): a coluna `HE` (nº de horas
  extras, coluna G) NÃO está zerada** — 22/07, 28/07, 05/08, 11/08, 28/08 e
  vários outros dias têm `2`. A anotação anterior dizia o contrário e estava
  errada. Com o `.gs` re-deployado, a contagem é por **HORÁRIO**
  (`_ehHoraExtraCaixas`): o fechamento automático das 17:05 grava o nº de horas
  de HE **com produção** (hoje, 05:00 e 06:00 → `HE=2`, `HE CX=660`), e o botão
  FECHAR DIA manda o mesmo número (dia fechado na mão tem prioridade — o
  automático não sobrescreve).
- ⚠ **Dia já gravado não se conserta sozinho**: a linha antiga continua com o
  par velho. Corrigir é editar a planilha (ou reabrir e FECHAR DIA de novo, que
  o `saveDay` é upsert por data).
- ⚠ **Duas leituras do mesmo indicador continuam existindo**: o relatório
  semanal e o do histórico imprimem a **coluna EF** gravada; o bloco da semana e
  a Tela D calculam `real/meta`. Enquanto a gravação estiver certa elas
  concordam. Unificar (fazer o painel sempre recalcular na leitura) mudaria o
  número dos dias antigos já gravados — decisão do usuário, ainda não tomada.

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
- **O XLSX é ~1 MB para um botão de exportar**, e a TV recarrega sozinha a cada
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

## Aba PLANO — a meta contra a capacidade demonstrada
- **O painel media a linha e o plano com o MESMO número, e nenhum dos dois
  aparecia.** Medido no `HISTORICO` em 15/09/2026, 79 dias: a correlação entre a
  META do dia e o REALIZADO é **r = 0,28** — **r² de 8%**. A EFICIÊNCIA varia de
  **32,6% a 188,5%** porque o **denominador** pula. Nos últimos 8 dias a meta foi
  de **p0** (900 cx, abaixo de tudo que a linha já fez) a **p100** (2.950 cx).
- **A causa está no código:** `CFG.metaDia` é a soma dos lotes datados para o
  dia (`aplicarMetaDiaAutomatica`), então a meta herda a irregularidade da
  **datação dos lotes**, não da operação. Atacar isso é datar contra capacidade.
- ⚠ **A CAPACIDADE É A JORNADA NORMAL — HORA EXTRA FICA FORA** (v7.56.0, PPCP,
  16/09/2026: *"tem que ser justo, desconsiderar horas extras"*). A curva saía
  do realizado TOTAL do `HISTORICO`: o melhor dia (3.217 em 15/09) tinha 224 cx
  de HE, a madrugada de 05:00 entrava inteira, e a HE era contada duas vezes —
  escondida na régua e como remédio do veredito. `_qpDiasBase(dias)` é a
  base única dos dois blocos, da tela e dos dois PDFs: cada dia entra com
  `real − heCx` (`_qpRealDia`), o total fica em `realTotal` (tooltip), sábado
  inteiro em HE sai sozinho, e dia sem separação (`heCx` nulo) entra inteiro e
  é contado (`semSep` → `a.nSemSep`, impresso). **Não voltar a filtrar por
  `Number(d.real) > 0` nos chamadores** — o teste prende os quatro.
- A aba responde **duas perguntas independentes**, e é preciso as duas:
  **ALTURA** (`_qpPercentil` — em que percentil da capacidade a meta cai) e
  **OSCILAÇÃO** (`_qpOscilacao` — quanto ela pula). Medido: altura **p53** (boa)
  com oscilação **34,5%** (ruim). Um indicador que olhasse só a altura aprovaria.
- ⚠ **A FAIXA DO MEIO precisa de veredito próprio.** Sem ela, oscilação de
  **28,3%** — acima do combinado de 20%, abaixo do 30% que reprova — saía como
  `PLANO EXEQUÍVEL`. Hoje é `META OSCILANDO`. A oscilação vem **piorando**:
  28,3% em 79 dias, 31,6% em 60, 34,5% em 30, 35% em 15.
- ⚠ **NÃO é "baixar a meta", e o texto da tela diz isso.** A função da meta do
  dia é **sinalizar**: meta que a linha bate em ~metade dos dias faz o vermelho
  significar alguma coisa. Meta que reprova 2 em 3 dias vira paisagem e o alarme
  se perde — é o alarme que vale dinheiro. A produção sobe pelas **paradas**,
  pelo **setup** e pelo **teto da esteira**, e a meta sobe **atrás** da
  capacidade demonstrada.
- **Custo zero:** lê o `buildDiasHistAsync` (cache de 2 min) que o HISTÓRICO e a
  cascata já usam. **Nenhuma chamada nova ao Apps Script, nenhum re-deploy.**
- O combinado mora em constantes (`QP_ALVO_MIN` 50 · `QP_ALVO_MAX` 60 ·
  `QP_ACIMA` 75 · `QP_OSC_OK` 20 · `QP_OSC_RUIM` 30 · `QP_MIN_DIAS` 10).
- **O desenho (`_qpHtml`) não faz conta** — tudo vem pronto do `_qpAnalise`, e o
  teste falha se `_qpPercentil`/`_qpOscilacao`/`_qpCurva` aparecerem dentro dele.
- ⚠ **A curva usa TODO o histórico; o filtro escolhe só quais metas são
  julgadas.** Recortar a curva junto com o período faria a régua mudar de
  tamanho a cada clique, e aí o percentil de ontem mudaria sem nada ter mudado.
- ⚠ **O GRÁFICO É DIA A DIA, no calendário — e já foi outro.** A 1ª versão
  (v7.45.0) punha o **percentil no eixo horizontal**: os 79 dias enfileirados do
  pior para o melhor, com a meta de cada dia pousada na curva. **O próprio PPCP,
  que pediu a tela, não conseguiu ler** — e tinha acabado de perguntar o que era
  p50. Trocado na v7.47.0.
  - Regra que isso confirma: **quando a interface e o entendimento divergem, o
    defeito é da interface**. Tela de gestão à vista que precisa de aula falha na
    parede, e falha primeiro com quem passa rápido.
  - O gráfico de hoje tem **duas linhas** — meta (laranja) e realizado (cinza) —
    e é assim que o **r²=8% aparece desenhado**: elas não se acompanham. Na
    versão do ranking o realizado **nem era desenhado**, então o achado principal
    da tela não aparecia.
  - ⚠ **A RÉGUA É MÓVEL, e o padrão é 60 dias** (v7.48.0). Antes usava todo o
    histórico e **subestimava a linha**: medido em 15/09/2026, com os 79 dias a
    faixa dava `p50=1.548 / p60=1.602`, e só com os últimos 30 dava
    `1.602 / 1.795` — julho (p50 de 1.466) puxava para baixo. Janela curta demais
    pula com uma semana ruim; longa demais carrega um mês ruim que já passou.
  - ⚠ **São DOIS recortes e eles não se confundem:** *JULGAR* escolhe quais dias
    aparecem no gráfico; *RÉGUA* escolhe de quais dias sai o padrão com que eles
    são comparados. O subtítulo da tela existe só para dizer isso.
  - **A FAIXA ALVO é testável na tela** (p45–p55 … p60–p70). As constantes
    `QP_ALVO_*` são o **ponto de partida**, não a lei: a faixa entra por
    parâmetro no `_qpAnalise`, e **o veredito e o desenho leem dela** — senão a
    tela julgaria por uma faixa e pintaria por outra. O card DIAS ACIMA mostra
    quantos dias caíram **dentro** da faixa, que é o número de comparação.
  - A escolha fica em `localStorage['rpe_qp_pref']` (régua, faixa, janela **e
    ordem**) — calibrar leva dias, e perder o ajuste a cada F5 faria ninguém
    calibrar. ⚠ Chave nova: **nunca
    renomear por estética** (mesma regra das `rpe_*`).
  - Os rótulos dentro do gráfico levam **fundo próprio** (`<rect>` atrás do
    `<text>`): por cima das linhas ficavam ilegíveis.
- ⚠ **A ORDEM da tabela troca o RECORTE, não só a sequência** (`_qpOrdenar`,
  v7.49.0). Por `data` a tabela é a **cauda** do período (os últimos 15 dias);
  por `alta`/`baixa` é o **topo** (ou o fundo) do período **inteiro**.
  Reordenar só os últimos 15 deixaria escondida a meta impossível de três
  semanas atrás — que é o que se procura ao pedir ordem por percentil. Medido
  em 15/09/2026 (30 dias julgados): as duas metas de **2.950 cx** (p100, acima
  de tudo que a linha já fez) não apareciam na tabela por data. É por isso que
  a função devolve o **título junto com as linhas** — tabela que muda de
  recorte sem mudar de título mente sobre o que mostra.
  - A lista é **copiada antes de ordenar**: `a.linhas` é a MESMA que o gráfico
    usa como eixo de calendário, e ordenar no lugar reordenaria o gráfico junto.
  - No empate de percentil o dia mais **recente** vem na frente (a `reverse()`
    antes do sort, que em JS é estável).
  - A ordem inversa não é enfeite: as 5 metas mais baixas do período (900 a
    1.150 cx) foram **todas** batidas. Meta baixa demais faz o verde não
    significar nada, como a meta em p100 faz o vermelho virar paisagem.
- ⚠ **O SVG OCUPA A LARGURA — NUNCA AMPLIA.** `viewBox` fixo com `width:100%`
  dá **zoom**: medido a 1920px em 15/09/2026, o gráfico saía com **510px** de
  altura (contra os **230px** do `.chart-box-lg`, a régua do painel) e a legenda
  de 9px chegava à tela com **21,9px**, maior que o rótulo dos cards ao lado. A
  largura vem do card (`_svgLargura`, piso 640 / teto 1400) e entra por
  parâmetro nos dois desenhos; o `max-width` no `<svg>` é o que impede de
  esticar de volta. Em tela estreita ele encolhe junto, como antes.
  - A tarja atrás dos rótulos sai do **texto** (`_svgTarja`), não de um número
    fixo — calibrada no desenho ampliado, na escala 1:1 ela sobrava e tapava
    barra. Ela recebe o corpo da fonte: largura e altura saem dele.
  - ⚠ **A ESCALA É UM MEIO-TERMO MEDIDO, e levou DUAS correções do usuário no
    mesmo dia**: *"ficou tudo muito grande"* (a 2,43×, com a legenda a 21,9px) e
    depois *"agora ficou muito pequeno"* (a 1,00×, com ela a 9px). O corpo mora
    na constante **`FS = 12`** dentro de cada desenho, e a altura ficou em
    **300/320px**. `font-size` solto no SVG não volta — o teste falha.
  - Lição: corrigir um exagero para o extremo oposto é errar duas vezes. Medir
    os dois extremos primeiro e parar no meio custa uma rodada a menos.
- ⚠ **A LINHA DO REALIZADO PRECISA SER LEGÍVEL** (correção do usuário,
  15/09/2026: *"a linha branca não tem como ver as qtdes"*). Só a meta tinha
  ponto e tooltip; o realizado era traço cinza sem marcador, sem número e **sem
  alvo de mouse** — dava para ver que as duas não se acompanham, que é o achado
  da tela, mas não QUANTO a linha fez em nenhum dia.
  - Ponto próprio no realizado + **faixa de toque por dia** cobrindo a coluna
    inteira, com as duas quantidades e o % da meta. Acertar um ponto de 4px com
    o mouse era tarefa.
  - ⚠ A faixa é pintada **antes** das linhas: por cima, comeria o tooltip dos
    pontos da meta.
  - ⚠ **O corte do número impresso tem de casar com o FILTRO.** Estava em 12 e o
    ramo era **morto** — o menor botão da barra é 15 DIAS. Hoje é 15.
- ⚠ **O gráfico é SVG no DOM, não canvas** — por isso `var(--ok)`/`var(--red)`
  funcionam nele. Em `<canvas>` (Chart.js) token não resolve e sai preto; ver a
  nota do `mkChart`.
- ⚠ **`.kpi-grid` sozinho não tem coluna** — precisa do modificador `c3`/`c4`/`c5`,
  senão os cards empilham um por linha.
- **Redundância removida junto:** `PRODUÇÃO REAL`, `META DO DIA`, `% DA META DO
  DIA` e `GAP DA META` eram **quatro cards para uma relação só** — dados o real e
  a meta, o percentual e a diferença são aritmética. O GAP virou o subtítulo do
  card da meta, nos dois grids (ao vivo e dia passado).
  - **A PROJEÇÃO FINAL não julga mais** (v7.46.0 / mobile 1.18.0, 15/09/2026).
    Ela e o selo do `% DA META DO DIA` respondiam a MESMA pergunta por duas
    contas: a projeção mede o turno em **slots** (`real + ritmo × slots
    restantes`, `ritmo = real ÷ nº de slots`) e o selo em **minutos**
    (`efNoRitmo`). Só dariam igual se toda hora tivesse 60 min — o slot
    pós-almoço tem **48**.
    - Medido no turno real (9 slots, **527 min**, meta 1.800) com 4 horas
      lançadas: a projeção cobra **800** e o selo cobra **820**. Produção em
      **810** mostrava `▲ ACIMA DA META` ao lado de `ABAIXO DO RITMO`, os dois
      certos. Acontece em **8 das 9 horas**, com janela de 2 a 20 cx.
    - O número fica (projetar é informação); o veredito é só do selo, que
      rateia por minuto. O card perdeu o `▲/▼` e a cor de status — hoje é
      `acc`, como o RITMO ATUAL.
    - ⚠ A **TV nunca teve o defeito** (sempre imprimiu a projeção como número
      puro) e o teste prende isso para ela não ganhar um.
  - **Ainda em aberto, não mexido:** `MELHOR/PIOR HORA` aparece em três lugares
    (card, análise pico/vale e a tabela hora a hora). Aqui **não há
    contradição** — é repetição, então é preferência, não defeito. O usuário
    decidiu **manter** em 15/09/2026.

## ESTUDO DE UEP — só análise, só no gerencial (v7.72.0)
- Pedido do PPCP, 24/09/2026: *"definir a UEP de cada produto — o que mais
  embala por hora vale uma UEP, os outros proporcional"*. Combinado com o
  usuário: **primeiro uso previsto = META DO DIA** (a meta em caixas herda o
  mix), e **nada é divulgado** por enquanto — é relatório para análise, botão
  **📐 ESTUDO UEP** na aba PRODUÇÃO/HORA. TV e celular não veem.
- `_uepProdutos` / `_uepEstudo` (conta) + `_uepHtml` (desenho, sem conta) +
  `gerarRelatorioUEP` (usa `_phItensPeriodo`, a busca com cache/voo da aba —
  **nenhuma chamada nova, sem re-deploy**). Documento: `_rpDocParadas`, retrato.
- **UEP/cx = ritmo da âncora ÷ ritmo do produto.** Duas âncoras: **A = maior
  volume** (recomendada — produto-base clássico, estável) e **B = mais rápido**
  (o pedido; o máximo é o valor mais instável, se ele mudar a UEP de todos
  muda). Só mudam a escala.
- ⚠ **Por PRODUTO (modelo + nome), nunca por cor nem pelos 6 dígitos.** Na
  tela de 24/09 a MESA CABECEIRA SLEEP ia de 112 a 313 cx/h conforme a cor:
  ruído (paralelismo, amostra), não esforço. Divergência ≥ `UEP_COR_DIVERGE`
  (1,5×) vira alerta. Horas do dia = **distintas** (regra do
  `simularEsteiraPorModelo`), ritmo = `_phMediaAparada` com o filtro MÉDIA.
- **< `UEP_MIN_DIAS` (5) dias → UEP PROVISÓRIA** (v7.73.0, PPCP: *"pode
  colocar UEP mesmo com pouca caixa, mas deixe a observação"*): calculada,
  com `*` no número, observação na coluna CONFERIR e contada à parte
  (`nProv`). ⚠ A **âncora** continua só entre quem tem amostra — âncora de 2
  dias mudaria a escala de todos. Sem ritmo → sem UEP, nunca 1 por padrão.
- **Conferência:** oscilação do ritmo da linha dia a dia em cx/h × UEP/h
  (`_qpOscilacao`), mesmas caixas sobre as mesmas horas da linha. Otimista:
  reprova, não prova. Desde a v7.74.0 há a **validação fora da amostra**
  (`_uepValidacao`): UEP da 1ª metade dos dias testada na 2ª, com
  `UEP_VALID_MIN_DIAS`=4 por metade — é ela que conta.
- ⚠ **A LINHA RODA UM PRODUTO POR VEZ** (PPCP, 24/09/2026). Hora com dois
  produtos é **hora de troca** — e isso relê o que está anotado na seção do
  mix ("a esteira roda dois produtos por vez"): o excesso de horas de produto
  sobre horas da linha é troca dentro da hora, e a alternância `A,B,A,B` do
  log são cores/volumes do MESMO produto (ou apontamento), não dois produtos
  juntos. Não mexi no mix por causa disso; o estudo de UEP já usa a leitura
  nova.
  - **Hora compartilhada é repartida** (v7.74.0 / `.gs` v5.9, PPCP: *"quando
    pega na mesma hora 2 produtos tem que ser proporcional"*). Proporcional ao
    **tempo esperado** (caixas ÷ ritmo em regime), **nunca às caixas**: pelas
    caixas os dois sairiam com o ritmo da linha naquela hora e a diferença
    entre eles sumiria. Ritmo em regime = horas em que o produto rodou
    sozinho; sem nenhuma, o peso usa o ritmo com hora cheia e a linha avisa.
    A hora vale 1 (inclusive o slot de 48 min), como no comparativo.
  - Precisa do **`cxHora`** por item (`getProducaoModeloPeriodo`, `.gs` v5.9 —
    **re-deploy**). Sem ele (`_uepTemCxHora` falso) o estudo volta à hora
    cheia e o relatório diz que a divisão não está valendo.
- **UEP POR DIA** (`_uepDias`): caixas com produto × UEP, horas da linha,
  UEP/h e cobertura contra o realizado do `HISTORICO` (`buildDiasHistAsync`,
  cache de 2 min; falhou → a coluna some). É a capacidade em UEP, a régua da
  meta do dia.
- ⚠ Ritmo **demonstrado ≠ tempo padrão** (carrega desempenho, paralelismo e
  apontamento). Próximos passos combinados: PPCP escolhe a âncora → valida os
  de maior volume (cronoanálise) → congela a UEP no cadastro (`PRODUTO_CODIGO`,
  com vigência) → a meta do dia passa a ser julgada em UEP. **O operador
  continua vendo caixas.** Não calcular UEP ao vivo em tela oficial: recalcular
  todo dia mudaria a meta histórica.
- **Dia padrão de 8 h** (v7.75.0, PPCP: *"sempre considerar hora do dia 8"*):
  `UEP_HORAS_DIA` — UEP do dia = UEP/h da linha × 8. Tira a HE da capacidade
  e deixa os dias comparáveis. ⚠ O turno tem 8 h 48 min produtivas: os 48 min
  ficam como folga, e isso está escrito no relatório.
- **Teto físico manda** (v7.75.0): ritmo acima de `_phTeto` é limitado a ele
  (`limitadoTeto`) — medido em 01/07–24/09: DECOR 470 a 351 sem nenhuma hora
  sozinho. **Âncora A = maior volume abaixo de `UEP_ANCORA_TETO_MAX` (90%) do
  teto**: a SLEEP rodou 332 com teto ~329 — ali a esteira limita, não a
  equipe, e ela inflaria a UEP de todos. Teste de sanidade: dia com UEP/h
  acima do ritmo da âncora ×1,05 sai com ⚠. Cobertura do dia **sem corte em
  100%** (acima = apontamento a mais que o realizado).
- Medido em 01/07–24/09/2026 (60 dias, com a hora repartida): oscilação do
  ritmo **fora da amostra 43,8% → 22,6%** e do dia **34,0% → 14,7%** — a UEP
  explica metade da variação; em UEP a meta do dia cabe no limite de 20% da
  aba PLANO, em caixas não. Só 9 de 89 produtos com 5+ dias.
- O `_mixFator` da carteira é a mesma ideia com âncora na média da linha e
  chave por modelo de 6 dígitos; quando a UEP virar cadastro, é ele que deve
  passar a ler dali — não criar uma segunda régua de esforço.

## A CARTEIRA em CX DE LINHA — o mix (v7.55.0)
- **Pedido do PPCP, 16/09/2026**, com a tela em HORIZONTE SOBRECARREGADO:
  *"pelo histórico temos tempo de cada produto, o que dá pra fazer?"*. A régua
  da aba é caixas/dia e caixa não é unidade de tempo: 3.000 cx a 300 cx/h são
  10 h de esteira, 3.000 cx a 150 cx/h são 20 h, e a tela pintava as duas igual.
- ⚠ **NÃO É "CARGA EM HORAS", e o motivo está medido.** O dado que existe é o
  ritmo DEMONSTRADO por produto (cx ÷ horas em que o produto rodou, do log da
  `PRODUCAO_PRODUTO`, o mesmo cx/h do comparativo), e **a esteira roda dois
  produtos por vez**: em 21 dias, 37.085 cx a 107 cx/h dão **347 h de produto
  contra ~185 h de linha**; nos 6 dias inteiros de julho lidos da planilha a
  razão foi de **1,1 a 2,5 por dia** (média 1,38–1,65). Somar `qtde ÷ ritmo`
  inflaria a carga em ~2×. **Hora de produto não é hora de linha.**
- **O que se faz: o ritmo vira PESO RELATIVO** (`_mixRitmos` / `_mixFator`):
  cada lote pesa `qtde × (referência ÷ ritmo do produto)`, referência = Σcx ÷
  Σhoras de produto do MESMO período. Os dois lados da razão foram medidos do
  mesmo jeito, então paralelismo e hora parcial se cancelam em boa parte. O
  resultado continua em **caixas** — **a régua da aba segue UMA** (`_qpCurva`
  com `QP_REGUA`), como manda a nota do `_cartAnalise`; o que muda é o que
  entra na barra. `_cartAnalise` não toca no mix (o teste falha se tocar).
- **A CONFERÊNCIA vai na tela** (`_mixDiag`): nos dias da régua, o realizado
  convertido pelo mix daquele dia oscila menos que cru? (`_qpOscilacao`, a
  mesma conta da oscilação da meta.) Medido em julho: **36% → 13%**. Se não
  cair, a linha do MIX fica âmbar e manda preferir CAIXAS CRUAS. ⚠ É
  **otimista** (os pesos saíram dos mesmos dias) — reprova um mix ruim, não
  prova um exato. A medição de 60 dias **não pôde ser feita fora do painel**
  (a rede da sessão bloqueia o Apps Script e a exportação do Drive corta a
  `PRODUCAO_PRODUTO` em ~310 linhas), por isso ela mora na tela, onde os
  dados existem.
- **Chaves e quedas**: o fator tenta `modelo|cor`, cai em `modelo`, e sem
  histórico é **1 e CONTADO** ("N sem base"). Fator fora de
  `MIX_FATOR_MIN`–`MIX_FATOR_MAX` (0,33–3) é limitado e marcado "aparado": o
  1 cx/h da DECOR 470 daria fator 107. A dívida (`faltaZerar`) continua crua —
  ela não vem por lote.
- **Seletor CARTEIRA** (`QP_MIX`: `mix` padrão · `cru`), na `rpe_qp_pref`. Só o
  bloco de cima lê: o de baixo julga METAS de dias passados, cuja programação
  o arquivamento já levou — converter meta antiga seria inventar.
- **VAZIO NÃO É UMA COISA SÓ, de novo**: `_cartMixHtml` tem três estados —
  cru por escolha · mix aplicado · **mix pedido e NÃO aplicado** (com a causa:
  sem resposta · sem endpoint · erro · sem dados). O terceiro nunca passa em
  silêncio, senão a tela diria cx de linha mostrando caixas cruas.
- ⚠ **90 DIAS NÃO RESPONDE NO COLD START** (medido em produção na 1ª abertura
  da v7.55.0, régua em "todo o histórico": MIX NÃO APLICADO, 3 × 25 s). A
  régua do mix é uma **escada** (`_cartMixEscada`: 60 e, sem resposta, 30) e
  `_cartMixAgendar` desce um degrau **sozinho, uma vez, 30 s depois**, só em
  `sem-resposta` e só com a aba PLANO na tela. O degrau volta a 0 **apenas no
  ATUALIZAR** — voltar no sucesso faria a próxima redesenhada pedir 60 de
  novo. A linha do MIX diz qual régua valeu. Teste prende a escada e a guarda.
- **Custo**: `_cartRitmos` lê `getProducaoModeloPeriodo` para o período da
  régua (`QP_REGUA`, teto `CART_MIX_DIAS_MAX`=60), cache de 5 min
  (`_cartMixCache`), voo compartilhado (`_cartMixVoo`) e reaproveita o
  `_phCache` se a aba PRODUÇÃO/HORA já buscou o mesmo período. ⚠ Essa leitura
  publica `PREP_PERIODO`, que é da OUTRA aba e de outro período: é guardado e
  devolvido no `finally` (teste prende). Sem re-deploy do `.gs`.
- ⚠ **A TARJA DA FAIXA ALVO NÃO PODE COBRIR A BARRA** (18/09/2026:
  *"está cobrindo a linha A CARGA DEVERIA FICAR AQUI"*). `_svgLadoLivre` escolhe
  o lado com menos barras cruzando a linha, mas com as **duas** pontas ocupadas
  devolve a *menos pior* — e ela cobria. Medido: esquerda 1 cruzamento, direita
  2, e a tarja tapou a barra do 21/09 e o número 1.800 dela.
  - O nº de barras cobertas sai da **largura da tarja** (a 1.300px são 2, não as
    3 fixas de antes), e a colisão olha **a barra E o fantasma** do programado —
    com o mix, o topo do dia é o tracejado quando ele passa da carga.
  - Sem lado livre, a tarja **sobe** 18px acima do número da barra (baseline em
    `yTopo−5`, glifo de ~0,7×FS: com os 14px da conta crua saíam encostados) e
    uma **guia pontilhada** a liga à linha — o que ela precisa manter é o
    vínculo, não a altura. Não cabendo acima (bateria na tarja do MELHOR DIA,
    limite `yTeto+20`), fica onde estava: nunca pior que antes.
- ⚠ **A BARRA NÃO É O NÚMERO DA PLANILHA, e a tela tem de dizer isso** (16/09/2026,
  logo depois do deploy: *"a qtde de produto no gráfico não bate com a
  carteira"*). O programado cru vai como **fantasma tracejado** atrás da barra
  (contorno cinza quando é maior que a barra, cor do fundo quando cabe dentro
  dela) com *prog. N* na base, **pintado depois da barra** — antes dela, a
  barra tapava o número. Título e legenda dizem a unidade. Sem mix, nada disso
  existe. O teste prende o fantasma, a ordem de pintura e o título.
- ⚠ **VOCABULÁRIO É DE QUEM LÊ, NÃO DE QUEM CALCULA** (pedido do PPCP,
  16/09/2026: *"precisa ser fácil interpretação, bater o olho e entender"*, e
  logo depois *"aparado?"*). Na tela é **CARGA** (nunca "cx de linha"), o peso
  sai em **palavras** de uma função só (`_cartPesoTxt`: *+22% lento* âmbar,
  *−28% rápido* verde, *normal* sem número dentro de ±5%), o número em cima da
  barra é o **PROGRAMADO** (o que se confere na planilha) e o selo **PESA +N%**
  vai dentro dela. "Fator", "aparado" e "sem base" ficam no tooltip e no corpo
  menor da caixa do mix — quem audita acha, quem passa não tropeça. Os nomes
  internos (`cx de linha`, `aparado`) continuam no código e nesta memória.
- **`_cartMontar(dias, modo)` é a montagem única** (programação + dívida + mix +
  conferência) da tela e do PDF. O relatório ganha a linha **O MIX** em COMO O
  NÚMERO SAI. ⚠ **O modo é lido UMA VEZ, no começo**: a montagem espera até três
  leituras caras, e trocando o seletor no meio o `QP_MIX` mudava debaixo dela —
  a legenda saía *"CARTEIRA EM CAIXAS CRUAS"* embaixo de barras pesadas pelo mix.
- **AS DUAS: os dois gráficos, um sob o outro** (v7.60.0, PPCP, 18/09/2026 —
  *"faz um teste para aparecer as duas opções"* → *"dois gráficos separados"*).
  O terceiro valor do seletor CARTEIRA desenha *carga pelo mix* e *caixas cruas*
  em blocos completos. **É o VEREDITO que muda entre elas**, e é para isso que
  serve: medido no dia, pela carga sobravam 2.302 cx e o E SE de −50% dizia
  **NÃO DARIA**; pelas cruas, 790 e **DARIA**. Escondendo uma, a decisão fica
  refém de qual régua estava selecionada.
  - **`_cartBlocos(dias, curva, agendar)` é o lugar ÚNICO que decide quais
    blocos saem** — a tela e os DOIS PDFs leem daqui, senão papel e tela
    discordariam de qual régua valeu. `_cartBlocosHtml` é o desenho, sem conta.
  - ⚠ **NÃO DOBRA A BUSCA**: a programação vem do cache (2 min, voo
    compartilhado), `_cartRitmos` só lê o log de produto no modo `mix`, e o
    cenário reusa o `_pgContextoDoPeriodo` (5 min, voo). O segundo bloco é conta
    pura sobre o que o primeiro já leu. Em **sequência**, nunca `Promise.all`.
  - **O que é idêntico sai uma vez só, POR CLASSE ESCONDIDA** (`.cart-dois`):
    a nota longa no último bloco, a `.qp-leg` no primeiro (a do cru é
    subconjunto da do mix) e o sufixo `.cl-regua` do título, que repetiria o
    `.cart-tit`. ⚠ As regras são escopadas em **`#sec-plano`**: `#sec-plano
    .qp-leg{display:flex}` (id + classe) vence uma regra escrita só com classes,
    e a legenda continuava saindo nos dois.
  - ⚠ Um segundo desenho para o modo novo seria a história do cabeçalho dos
    cinco relatórios (#204/#205). A marcação é a MESMA; muda só o que a pele
    esconde.
- **E SE AS PARADAS CAÍSSEM X%** (v7.57.0, PPCP, 16/09/2026: *"se a linha
  diminuir as paradas em x%, daria ou não?"*). A régua é o que a linha FEZ, com
  as paradas que teve. `_cartDiasComMenosParadas` devolve a cada dia da régua
  a fração da **perda por parada não programada** (`porDia[data].perd` do
  `RP_PARADAS`, a MESMA conta da aba PARADAS e do SIMULADOR); `_cartCenario`
  refaz a curva e a análise da carteira com a régua nova e devolve
  DARIA/NÃO DARIA. **Nenhuma fórmula de perda nova** — só se multiplica o que o
  RP_PARADAS valorou; o teste falha se `perd` aparecer no desenho. A busca
  (`_cartCenarioAsync`) é o `_pgContextoDoPeriodo` da gestão de perdas, do 1º
  dia da régua até hoje; com `QP_ESE`=0 não busca. Seletor `qp-ese` na barra,
  persistido em `rpe_qp_pref`. ⚠ A perda foi valorada ao ritmo da META do dia
  — o cenário assume que o tempo recuperado produz nesse ritmo.
- Medido com os fatores de julho na carteira real de 16/09: 17/09 tinha
  **3.125 cx de MESA CABECEIRA SLEEP** (205 cx/h) → **~2.000 cx de linha**;
  o lote que mais pesa em cada dia sai na tabela, para escolher O QUE mover.
- ⚠ **RE-DATAÇÃO AUTOMÁTICA NÃO SERÁ FEITA** (decisão do usuário, 16/09/2026:
  *"não vamos fazer isso"*). A proposta lote a lote ("mova o lote X de 21 para
  22") foi explicada e recusada: o painel não sabe prioridade comercial, data
  de corte, peça disponível nem ordem de expedição, e a PROGRAMACAO não tem
  coluna que diga até quando um lote pode andar. O que a aba dá é o suficiente
  para a decisão humana: onde estoura, onde sobra, e a lista de lotes do mais
  pesado ao mais leve. **Não propor de novo.** Se um dia a planilha ganhar
  data de corte por lote, aí é outra conversa.

## A CARTEIRA QUE VEM — o bloco de cima da aba PLANO
- **A aba julgava só o passado.** Diagnosticava a datação e não mudava nada: o
  dia já tinha ido. O bloco de cima (v7.50.0) olha os lotes **já datados para
  dias que ainda não chegaram**, que é onde ainda dá para agir. O de baixo
  continua idêntico, rotulado **COMO TEMOS DATADO**.
- Medido na `PROGRAMACAO` real em 15/09/2026: **16/09 com 3.025 cx e 17/09 com
  3.125**, contra um melhor dia de **2.909** em 79 dias — os dois nasceram
  impossíveis —, e 22, 23 e 24/09 entre 1.228 e 1.350, abaixo do que a linha faz
  em 3 dias de 4. A carteira futura soma **13.278 cx em 7 dias**; com a dívida,
  **15.425**, ou **2.204 cx/dia** (p85). Não é capacidade: é datação.
- ⚠ **UMA RÉGUA SÓ NA ABA.** `_cartAnalise` recebe a curva e a faixa **por
  parâmetro** — as mesmas `_qpCurva(dias, QP_REGUA)` e `QP_FAIXA` do bloco de
  baixo. Uma segunda curva aqui faria a tela aprovar em cima o que reprova
  embaixo, e o gestor não teria como saber qual valia. Por isso `_qpSetRegua` e
  `_qpSetFaixa` redesenham **os dois** blocos; o teste falha se um sair.
- ⚠ **A carteira NÃO soma o campo `falta`.** Ele vem do FIFO **por código**:
  duas linhas do mesmo código devolvem o MESMO número e somá-las contaria o
  saldo duas vezes. Para linha de data futura o backend zera `embalado`/`falta`
  de propósito, então o aberto dela **é a `qtde`**. O teste falha se a palavra
  voltar ao `_cartAberta`.
- ⚠ **A DÍVIDA OCUPA DIA.** Atraso vivo + o que falta da meta de hoje consomem
  capacidade dos primeiros dias antes de qualquer lote novo — por isso entram no
  NIVELADO e na SOBRA. Fora deles o horizonte pareceria mais folgado do que é.
  - A dívida é o `faltaZerar` do `PONTOS_DIA` (o mesmo número da Tela C da TV),
    com queda para `atrasoTotal` em backend antigo. ⚠ A escolha é por
    **`!= null`**, nunca por `||`: **dívida zero é valor legítimo** e o `||` a
    trocaria pelo outro campo.
- **UMA referência só para sair e para caber**: o **topo da faixa alvo**
  (`alvoMax`). Acima dele o dia não comporta (`sai`), abaixo há espaço
  (`cabe`). Duas referências dariam uma conta que não fecha na tela.
- **O veredito separa os dois problemas, que pedem ações OPOSTAS:**
  `CARTEIRA NIVELADA` · `CARGA MAL DISTRIBUÍDA` · `DIA DATADO ACIMA DO MÁXIMO JÁ
  FEITO` (cabe no período → **re-datar resolve, e é de graça**) ·
  `HORIZONTE SOBRECARREGADO` (`sobra > 0` → **re-datar não basta**: dia a mais,
  hora extra ou empurrar para a semana seguinte). Confundir os dois faz pedir
  investimento onde bastava mexer na data, ou o contrário.
- ⚠ **O ATUALIZAR E OS SELETORES NÃO PODEM SER ENGOLIDOS** (18/09/2026:
  *"botão atualizar não está funcionando"*). `renderCarteira` e
  `renderQualidadePlano` tinham guarda de reentrância com `return` seco. Só que a
  montagem encadeia até TRÊS leituras caras (programação, log de produto do mix
  e, com o cenário ligado, as paradas dos dias da régua), cada uma com 3×25 s:
  no cold start passa de dois minutos, e nessa janela **todo toque no ATUALIZAR e
  toda troca de seletor sumiam em silêncio**. Medido: o seletor em CAIXAS CRUAS
  com a tela inteira ainda pesada pelo mix.
  - O pedido que chega durante o voo fica **pendente e roda no fim**
    (`CART_PEND`/`QP_PEND`) — a última escolha do gestor sempre vence — e o bloco
    **esmaece com "atualizando…"** (`_planoUpd`, `#qp-upd`), a mesma régua da aba
    PARADAS e da GESTÃO DE PERDAS. Sem sinal nenhum, esperar um minuto é
    indistinguível de botão quebrado.
- **Custo MENOR que antes, não maior.** `carregarProgramacaoDetalhada` ganhou
  **cache de 2 min** (`PROG_DET_TTL`) e **requisição em voo compartilhada**
  (`PROG_DET_VOO`) — o mesmo remédio do `_phVoo` e do `PG_VOO`. Antes, cada
  entrada na aba PROGRAMAÇÃO refazia a leitura; hoje as duas telas pagam **uma**
  execução no Apps Script. O resto sai do que o painel já tem (curva do
  `buildDiasHistAsync`, dívida do `PONTOS_DIA`). **Sem re-deploy do `.gs`.**
- ⚠ **Lote `foraEsteira` não entra** — não passa na linha.
- ⚠ **VAZIO NÃO É UMA COISA SÓ — e este defeito já custou caro antes.** Na
  v7.50.0 a tela dizia **SEM CARTEIRA DATADA** com a `PROGRAMACAO` cheia (78
  linhas datadas de 16 a 24/09, medido em produção no dia do deploy): a mesma
  frase servia para *"não há lote futuro"* e para *"não consegui ler"*. É o
  MESMO defeito do `PH_FALHA` do comparativo por modelo — *"TIMEOUT não é
  backend velho"*, escrito nesta memória desde 26/08/2026.
  - `getProgramacaoDetalhada` é das leituras mais caras do backend e era a
    **última das pesadas com UMA tentativa**. Hoje são **3 em sequência** com
    espera crescente (em paralelo elas só se enfileiram no Apps Script).
  - `PROG_DET_FALHA` guarda a CAUSA e **`_progDetFalhaInfo()` é o texto único**:
    `sem-resposta` · `sem-endpoint` · `erro` · `sem-url`. O `_cartVazioHtml` lê
    dali, e a falha tem **prioridade** sobre o "não há lote futuro".
  - ⚠ **A frase do re-deploy só sai no `sem-endpoint`** — quando o backend
    respondeu e provou não conhecer a ação. Acusar re-deploy por timeout manda o
    gestor mexer no Apps Script à toa; foi exatamente isso que aconteceu no
    comparativo por modelo.
  - O vazio legítimo diz **quantas linhas leu** e **a data mais distante**
    (`diag` do `_cartAberta`): afirmação que não se pode conferir na tela manda
    abrir a planilha para checar o painel, que é o contrário do que ele serve.
- **O desenho (`_cartHtml`) não faz conta** — tudo vem pronto do `_cartAnalise`,
  e o teste falha se `_qpPercentil`/`_qpValorNoPercentil`/`_qpCurva` aparecerem
  dentro dele.
- ⚠ **Barra alta leva o número DENTRO dela.** Por cima, ele batia na tarja do
  **MELHOR DIA JÁ FEITO**, que mora justamente na altura das barras que
  estouram — as que mais interessa ler. A tarja do teto é **alinhada à
  direita** pelo mesmo motivo.
- **O que o texto impresso na tela não deixa esquecer**, porque os dois erros
  são caros:
  - a faixa alvo é uma **mediana**, não limite físico: dia acima dela é
    improvável, não proibido;
  - **nivelar não é sequenciar** — o nivelamento é a restrição de *capacidade*,
    a ordem continua sendo a *data de corte* do cliente. Encher todo dia com a
    mesma quantidade ignorando a data só troca um problema por outro.

## O relatório da QUALIDADE DO PLANO (🖨 IMPRIMIR na aba PLANO)
- Pedido do usuário em 15/09/2026: *"quero uma impressão para analisar"*.
  `gerarRelatorioPlano()`, v7.54.0. Três seções: a carteira que vem · como
  temos datado · como o número sai.
- ⚠ **A MARCAÇÃO É A MESMA DA TELA.** `_cartHtml` e `_qpHtml` desenham os dois
  blocos no papel também; o que muda é a **pele**, o bloco `_PLANO_SKIN`
  escopado em `.plano-doc`. Copiar o desenho para o papel seria a história do
  cabeçalho dos cinco relatórios (#204/#205). O `<head>` e as ~150 regras saem
  do `_rpDocParadas` — agora **cinco** documentos passam por ele; o
  `relatorios.test.js` conta.
- ⚠ **O SVG É RE-SKINADO POR TOKEN.** Os desenhos usam `var(--ok)`, `var(--bg)`…
  que no painel vêm do tema escuro. No documento do relatório eles não
  existiriam, e **cor inválida em SVG cai no preto**. `.plano-doc{--ok:…;
  --red:…}` redefine os tokens para a paleta do papel e o MESMO desenho sai
  certo. Medido no Chromium: `rgb(198, 40, 40)`. Se um desenho novo usar um
  token que não está nessa lista, ele sai preto no papel — o teste prende a
  lista.
- **As duas famílias de modificador vão juntas no `class=`** dos cards
  (`_kpiCls`: `ok g` · `warn o` · `red r` · `acc a`). O painel lê uma, o
  documento lê a outra — a mesma regra do `_pgMin1000Html`. O teste falha se um
  card dos dois desenhos escapar do `_kpiCls`.
- **A carteira é OPCIONAL no papel.** Falhou a leitura da `PROGRAMACAO`? O
  relatório sai **inteiro, só sem a seção** — a mesma regra da cascata e das
  paradas no relatório semanal. Meio relatório é melhor que relatório nenhum;
  número de carteira inventado é pior que os dois.
- **A largura do desenho no papel é FIXA** (`PLANO_SVG_W` = 660, os ~178mm úteis
  do A4 retrato), nunca `_svgLargura` — papel não tem monitor.
- **O que só existe na tela não vai ao papel**: a dica *"passe o mouse"*
  (classe `qp-leg-mouse`, escondida pela pele) e o botão de tentar de novo.
- **A tarja do rótulo escolhe o LADO LIVRE** (`_svgLadoLivre`): a 660px, sempre
  à esquerda, ela tapava o valor do 3º dia. Fica onde nenhuma barra da ponta
  cruza a altura do rótulo; empatando, à direita, onde o olho já terminou de
  ler. A seta aponta para dentro do gráfico a partir do lado escolhido.
- ⚠ **COR SÓ ONDE HÁ FUNÇÃO, TAMBÉM AQUI** (v7.58.0, PPCP, 16/09/2026:
  *"deixar a impressão mais profissional, está muito carregada"*, aprovado em
  três rodadas de PDF). No papel: barra que cabe é **grafite** e só o dia que
  não cabe é vermelho; card com borda neutra, só o do problema colorido; o
  peso do mix é **texto**, sem pílula. E sai tudo que se repete — selos *PESA*
  nas barras, coluna **ALTURA**, colunas **LINHAS** e **O QUE MAIS PESA**, as
  legendas correspondentes. Tudo por **classe escondida na pele**
  (`.cb-selo`, `.cl-alt`, `.cl-lin`, `.cl-pesa`, `.cl-selo`, `.cl-folga`,
  `.cl-peso`), nunca por um segundo desenho: a marcação continua a da tela,
  onde a cor e a pílula ajudam a varrer a coluna a 60 cm.
- **O PAPEL É NÚMERO, GRÁFICO E TABELA** (PPCP, 16/09/2026, com o PDF na mão:
  *"muito carregada"*, *"tem muita coisa escrita"*). A pele `.plano-doc`
  esconde a nota longa `.qp-nota` dos dois blocos e a explicação da caixa do
  mix (`.qm-como`/`.qm-det`; fica só `.qm-conf`, o veredito); o parágrafo de
  abertura virou a linha de meta do cabeçalho; as notas sob os títulos saíram;
  COMO O NÚMERO SAI tem cinco linhas. **A marcação continua a da tela** — é a
  pele que esconde, como manda a regra do #204/#205.
- **A carteira tem folha própria** (`.pl-quebra`, `page-break-before` na pele) e
  a lista **OS LOTES PROGRAMADOS, DIA A DIA** (`_cartLotesHtml`, desenho puro
  sobre `linhas[].lotes`, que o `_cartAberta` guarda por dia): cabeçalho do dia
  com programado · carga · peso · não cabe, e os lotes do que mais pesa para o
  que menos pesa — a ordem em que se decide o que mover. Só no papel por
  enquanto; a tela tem o lote que mais pesa na tabela.
- **🖨 CARTEIRA é um segundo documento, em PAISAGEM** (PPCP, 16/09/2026:
  *"quero impressão só dos lotes separado do estudo de baixo"* + *"faça teste
  com a impressão virada"*): `gerarRelatorioCarteira` imprime só a seção 1
  (veredito, cards, gráfico a `CART_SVG_W_PAISAGEM`=980, dia a dia e lotes) com
  as **mesmas peças** do estudo — muda a moldura e a orientação. Junto com a
  GESTÃO DE PERDAS, são os dois únicos deitados; aqui a paisagem faz sentido
  porque o gráfico é largo e a lista de lotes é uma linha por lote. O 🖨 do
  estudo completo continua em retrato, rebatizado **🖨 ESTUDO**.
- **A dívida é lida em UM lugar** (`_planoDivida`), pela tela e pelo papel —
  a nota do `!= null` (dívida zero é valor legítimo) mora lá. ⚠ A Tela C da TV
  tem a **própria** leitura do `faltaZerar`, anterior a isto e com outra
  finalidade (o card "falta zerar" da TV); a guarda do teste olha só a aba
  PLANO, de propósito — contar o arquivo inteiro acusava a TV.

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
