# Relatórios — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

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
    tiram ~60px de **ar** da capa (nenhum número, nenhuma fonte de leitura).
    Nada disso vale no retrato, e o teste falha se alguma regra da paisagem
    escapar do escopo `.deitado`.
    - ⚠ **A "folga para o 6º item do plano" NÃO existia com as fontes do
      papel** (medido em 22/10/2026, Chromium com Barlow/IBM Plex carregadas,
      paradas reais de 17/09–22/10): 6 itens = **725 px** e 6 itens + uma
      parada em andamento (5ª linha das ANOMALIAS) = **746 px**, para ~718 de
      folha — a capa ia para a folha 2, já na v7.152.0. **Corrigido na
      v7.153.0 (PPCP: *"corrige a capa com 6 itens"*)** com mais três regras
      de ar no `.deitado`: linha do plano `2px` (era 3,5), linha de OUTROS e
      ANOMALIAS `2.5px` (era 3,5) e título das células `margin-bottom:5px`
      (era 7). Medido depois: 5 itens 672 · 5 + aberta 693 · 6 itens 691 ·
      **6 + aberta 712** — todos na folha 1. 6 é o máximo do plano (TOP 5 +
      o tipo genérico). Medição com as fontes bloqueadas dá ~25 px a menos e
      engana: medir SEMPRE com as fontes. O teste prende as três regras.
      Na v7.154.0 (papel enxuto) a abertura caiu para uma linha (52 → 37 px):
      5 itens 644 · 5 + aberta 665 · 6 itens 663 · **6 + aberta 684**.
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

## Enxugamento das telas (v7.118.0 em diante)
- Pedido do PPCP (25/09/2026): *"tem muita coisa escrita"*, no app inteiro.
  Regra: número nunca sai; aviso de falha/estado fica; texto que evita uma
  confusão documentada fica em UMA linha visível. O resto vai para o tooltip
  (`title`) no PC ou para um `<details>` (ⓘ COMO LER).
- ⚠ **Função que desenha TELA e PAPEL não perde texto no papel.** Use
  `.so-tela` (versão curta) + `.so-papel` (versão longa): a tela esconde
  `.so-papel` (`#sec-perdas`/`#sec-simulador`) e o `_rpDocParadas` esconde
  `.so-tela`. No PLANO o papel já escondia `.qp-nota` e agora esconde
  `.qp-lembra`.
- Blocos: **A** (PLANO, GESTÃO DE PERDAS, SIMULADOR — v7.118.0) · **B**
  (PARADAS, PRODUÇÃO/HORA, GERENCIAL, PROGRAMAÇÃO, HISTÓRICO) · **C** (celular)
  — B e C na v7.120.0 / mobile 1.30.0. No celular o card GAP DA META saiu (o
  "faltam X" está no card da meta, como no PC). O `uepCard` (rp-core 1.12.0)
  diz "NO RITMO · X de Y esperadas · meta Z" — o teste prende o começo.
- ⚠ Na diretoria a `getProgramacaoDetalhada` espera 60 s por tentativa
  (`jsonpFetch(url, _modoDir()?60000:…)`); nas outras telas continua 25 s.

## O RELATÓRIO SEMANAL COM A UEP NA FRENTE: ONDE PERDEMOS (v7.251.0)
- PPCP, 16/11/2026, logo depois do bloco da tela com a UEP na frente (v7.250.0):
  *"a impressão não mudou?"* → *"deixar limpo, fácil compreensão, direto ao
  ponto onde perdemos"* → prévia em PDF (antes × depois, semana 46).
- **A 1ª folha responde uma pergunta**: a jornada fez X UEP contra a meta — onde
  ficou o que faltou? RESULTADO (4 cards: JORNADA NORMAL com o selo, FALTOU NA
  JORNADA, HORA EXTRA, CAIXAS · FATO) → a CASCATA META − IMPACTO DE PARADAS − GAP
  DE RITMO = JORNADA, em UEP (o `_rpCascataHtml` dos relatórios de produção, com a
  unidade `c.un`) → o DIA A DIA (UEP, meta, %, diferença, UEP paradas, a principal
  parada, STATUS) → as PARADAS POR MOTIVO (`REL_UEP_MOTIVOS` = 6 com linha
  própria, o resto somado). A 2ª folha é o ANEXO das caixas por dia, sem STATUS.
- **Uma montagem para a tela e o papel**: o `_gsemUepMontar` (o mesmo do bloco
  da tela) dá o resultado e o veredito, com as mesmas palavras. Antes o papel
  tinha DOIS vereditos que discordavam: a EFICIÊNCIA em caixas e a faixa de UEP
  (`_rpUepFaixaHtml`, régua 100/90%, sem a hora extra) — semana 46: *META
  BATIDA COM HORA EXTRA* × *ATENÇÃO*.
- **Paradas em UEP** (`_relParadasUep`): a MESMA conta do `RP_PARADAS.stats`, com
  a meta de UEP de cada dia no `metaByDay` — perda = minutos × meta UEP do dia ÷
  minutos produtivos. Só os dias úteis com UEP: a cascata é da jornada, e a
  parada de sábado (todo hora extra) não tirou nada da meta. `metaDia` 0 no
  `cfg` da chamada, para nenhum dia cair na meta de CAIXAS. ⚠ Paradas fora do
  turno num dia útil (05:00–07:00) ainda entram — o `paradas-calc` só recorta o
  almoço. A leitura é a mesma do papel (`_pgBuscarDados`), nenhuma chamada nova.
- **Sem as paradas lidas, a cascata não sai** (`_relSemUepPerdas` devolve `casc`
  null): sem elas todo o faltante viraria GAP DE RITMO, um número inventado. O
  dia a dia sai, sem a coluna de paradas.
- **Saíram do papel com UEP**: o gráfico, o MELHOR/PIOR DIA (em caixas, o 11/11
  da semana 46 era o melhor com 125,3% e em UEP é o pior com 86,2%), a análise
  por horário (média histórica de caixas), o quadro de paradas em caixas (com a
  disponibilidade) e a faixa de UEP. Semana sem UEP gravada: o papel de antes,
  igual (o teste prende).
- Conta × desenho: `_relParadasUep` e `_relSemUepPerdas` são conta pura;
  `_relSemUepCorpoHtml` só desenha (o teste reprova reduce/filter/sort nele). A
  tabela das caixas virou a peça `tabelaCx` do `gerarRelatorioSemanal`, usada
  pelo papel sem UEP e pelo anexo.
- Medido: o PDF A4 sai em 2 folhas (a 1ª com todo o ONDE PERDEMOS, a 2ª o
  anexo).
- ⚠ **A CASCATA EM UEP FOI REVOGADA na v7.253.0** (o que está acima sobre ela
  vale só para a v7.251.0–7.252.0). PPCP, com o papel da semana 46 (8h05 de
  parada, −2.534 UEP, 18,4% da meta): *"8h05min?"*. As 8h05 estavam certas (a
  soma dos motivos; 97 min por dia útil, o nível de sempre — ~20% na memória).
  O erro era conceitual: a **2.761 é a MÉDIA demonstrada de 28/09–26/10** e já
  tem as paradas normais dentro. META − TODAS AS PARADAS − RITMO as contava
  duas vezes: *13.805 − 2.534 + GANHO DE RITMO 1.797 = 13.068*, um ganho que era
  só a parada normal. ⚠ **Não pôr de volta uma cascata que subtraia da meta
  média todas as paradas.** Ela só faz sentido contra uma meta SEM perdas (o
  potencial), ou com as paradas ACIMA do normal.
  - Saiu: o passo da cascata, o `casc` do `_relSemUepPerdas` (ficou
    `perdaPar`), a unidade `un` do `_cascPasso`/`_rpCascataHtml` (só o semanal
    a usava) e o `_RP_CASC_CSS` do semanal. O papel diz que o tempo parado não
    se desconta da meta.
  - Combinado (*"1 e 2"*): o "pior que o normal" — cada motivo contra as 4
    semanas anteriores, a troca contra a premissa (30 min/dia) e as paradas
    recortadas na jornada (as de 05:00–07:00 e depois das 17:00 de dia útil
    entravam) — vem a seguir, com prévia.
- **PARADAS ACIMA DO NORMAL (v7.254.0)** — o "2" do *"1 e 2"*. O ONDE PERDEMOS
  troca a tabela PARADAS POR MOTIVO pelo que passou do normal:
  - `_relSemNormal(st, stPrev, nDias, nDiasPrev, metaDia)` (pura): NORMAL = os
    minutos do motivo nas `REL_NORMAL_SEMANAS`=4 semanas anteriores ÷ os dias
    úteis com UEP delas × os dias úteis desta semana; TROCA (`PG_RE_TROCA_PROD`,
    `PG_RE_TROCA_PLAS`) = nº de trocas × a meta por troca do `_pgSmed` (o MESMO
    alvo da GESTÃO DE PERDAS, que desce sozinho); ACIMA abaixo de
    `REL_NORMAL_TOL_MIN`=5 min conta como normal; em UEP pelo
    `RP_PARADAS.perdaDeMin` com a meta média do dia. Sem as semanas anteriores:
    só as trocas têm normal e os totais ficam "—" (nunca um normal inventado).
  - As paradas da semana e das anteriores passam pelo `_relParadasUep` com
    `soJornada` (paradas-calc 1.4.0): só o pedaço dentro de turnoInicio–turnoFim
    — a das 05:00–07:00 ou depois das 17:00 de dia útil é hora extra; o papel diz
    quantos minutos ficaram fora (`diag.minForaJornada`).
  - Leitura: as 4 semanas anteriores numa chamada (`_pgBuscarDados`, em
    sequência depois da semana, com o cache de período), só no clique do 🖨 e
    só com UEP.
  - O dia a dia leva as paradas em TEMPO, sem UEP: a UEP de todas as paradas ao
    lado da DIFERENÇA do dia lia como a cascata revogada (−536 parados num dia
    de −165). ⚠ Não devolver a UEP de todas as paradas ao dia.
  - Medido na prévia (os motivos e totais do print da semana 46; o normal
    inventado): 1ª folha cabe (resultado, dia a dia, acima do normal); 7 de 7
    mutações pegas (a semana com feriado precisou de caso próprio: com 20 dias
    úteis ÷ 5, "por dia útil" e "por semana" davam o mesmo número).
- v7.252.0 (PPCP: *"dois vereditos está confuso"*): o anexo das caixas perdeu
  EFICIÊNCIA, EF. S/ HE e o gap em caixas — com a UEP na frente, o único % da
  meta do papel é o da UEP. Ficam as quantidades, a META e a META/H.


## O 🖨 DO HISTÓRICO COM A UEP NA FRENTE (v7.267.0)
- PPCP, 18/11/2026, com a tela da aba já em UEP (v7.266.0) e a pergunta sobre o
  papel ainda em caixas: *"sim passar para papel, qual falta atualizar?"*. Na
  v7.266.0 o papel só avisava *em caixas (a tela julga pela UEP)*; o revisor
  tinha apontado o defeito: 20/10 ✓ META na tela × ABAIXO no papel, 28/10
  ⚠ META COM HE × NA META (171%), 23/10 ABAIXO × ATENÇÃO.
- **O papel não tem conta nem marcação próprias (D2).** O
  `_imprimirHistoricoFormatado` chama `_histUepMontar(dias)`; com UEP, o corpo
  é o `_histDocUepHtml(dias, U, I, temMetaComp)`, feito das peças da TELA:
  `_gerKpiHtml(_histKpisUep(U))`, `_gerKpiHtml(_histKpisCx(U.k, …))`,
  `_uepAbaPerSvg(U.diasUep, HIST_DOC_W, 200, 0, { pid:'histDocLis',
  cls:U.clsPorDia })`, `_histTheadHtml(true, temMetaComp)` e
  `_histLinhaHtml(d, U.dias[i], temMetaComp)`. `null` (período sem UEP) → o
  corpo de sempre, em caixas, intocado.
  - `_histTheadHtml` saiu do `_histThead` (que só escreve no DOM) para o papel
    ler o mesmo cabeçalho.
  - `_histCxInfo(dias, heBackendOk)` (pura) = `nComMeta`, `semMetaTxt`,
    `heSub`, `semBackend`: o que os cards de caixas dizem além dos números. A
    tela (em UEP e em caixas) e o papel leem a mesma; antes era conta solta no
    `renderHist`.
- **A pele `_HIST_DOC_CSS` (`.hist-doc`)** só redefine o que a marcação da tela
  lê: os tokens na tinta do papel (os do `_UEP_DOC_SKIN`), `.kpi-card.ok/warn/
  red`, `.hist-hero` (2 colunas, o ÚNICO número em cor do resumo), `.badge` e
  `td.mono`. Regras do documento (*O relatório semanal é DOCUMENTO*):
  - na tabela o número é tinta — `.hist-doc table{--ok:…;--acc:…}` em grafite:
    o % de quem bateu e o H. EXTRA não ganham cor; âmbar e vermelho ficam para
    o % de quem não bateu, e o selo diz o veredito com a palavra;
  - o FECHAMENTO não é selo (`.badge.hist-fech`: o ✓ da tela é verde; no papel,
    tinta) e a FONTE é só da tela (`.so-tela`, a convenção do projeto);
  - cada célula numa linha (`white-space:nowrap`): o selo e as horas de HE
    quebravam e a linha do dia com hora extra dobrava de altura.
- **O que a tela diz no `title`, o papel escreve**: a legenda do desenho e a
  nota do pé (a UEP, cada STATUS, as caixas como fato; *SEM UEP* só quando há
  dia sem UEP; a nota da escala). ⚠ Mudou um `title` da tela → conferir a nota.
- **Saíram do papel com UEP**: os seis cards em caixas (EFICIÊNCIA DO PERÍODO,
  DIAS COM META, TOTAL META com o gap, MELHOR DIA, DIA MAIS FRACO), o alerta de
  meta batida com hora extra em caixas, o `_svgBarChart` (PRODUÇÃO × META) e a
  FAIXA DE UEP. A ANÁLISE POR HORÁRIO segue no fim, nos dois modos (é ranking
  de horas, não veredito contra a meta; o 🖨 fica na sub-aba PERÍODO).
- **`_rpUepFaixaHtml` saiu do código** (B5): no semanal o corpo em caixas só
  roda sem UEP (`${U?…:…}`), onde a faixa devolvia `''`; no histórico, idem
  depois desta versão. Era a faixa com régua própria (100/90%, sem a hora
  extra) que já tinha dado dois vereditos no semanal (v7.251.0).
- **As palavras do selo em UEP num lugar só**: o `_relSemUepCorpoHtml` tinha
  uma cópia; agora lê o `_gsemSeloTxt(U)` (o bloco da tela, a aba HISTÓRICO e
  os dois papéis). As mesmas palavras existem no caminho em CAIXAS (Tela D,
  semana sem UEP) — é outro veredito, não cópia.
- **O período do cabeçalho** (`.rp-periodo`) saía em `#1a1a2e` sobre a faixa
  escura do `_rpCabecalho` (impressa com `print-color-adjust:exact`): ilegível.
  Agora `#fff`. A classe só existe neste papel.
- **Medido** (Chromium, mídia de impressão, 718 px = os 190 mm úteis da folha
  A4 em pé, com Barlow, Barlow Condensed e IBM Plex Mono carregadas; os 23
  dias de 19/10 a 17/11 com META DIA e ATRASO META ligados — o pior caso, 14
  colunas): nada passa da largura; 2 folhas, a tabela parte entre linhas com o
  cabeçalho repetido; a 1ª folha leva o resultado, as caixas, o desenho e 15
  dias. O papel sem UEP: igual ao de antes, 10 colunas.
- Testes em `relatorios.test.js` (*aba HISTÓRICO*, bloco do 🖨): o `_histCxInfo`;
  o papel CONTÉM os cards, o cabeçalho e cada linha que a tela gera (a mesma
  marcação, comparada texto a texto); nenhum veredito em caixas no corpo em
  UEP; o desenho com o id próprio e a cor da tabela; a nota; a pele (só regras
  `.hist-doc`); o desenho sem conta; os dois caminhos do
  `_imprimirHistoricoFormatado`; o selo num lugar só.
- **A revisão (`/revisor-codigo`, 18/11/2026): 0 bloqueios, 3 ajustes.**
  - Teste: o desenho do papel só com os dias COM UEP (com `dias` no lugar de
    `U.diasUep`, o dia sem UEP virava uma barra "0" com a linha da meta — a
    mutação passava verde).
  - A nota da escala pelo token (`var(--warn)`), não em hexadecimal (D5).
  - **Em aberto, decisão do PPCP**: no desenho UEP POR DIA as três cores (cinza,
    âmbar, vermelho) têm quase a mesma luminância — impresso em preto e branco
    viram três cinzas parecidos e a legenda descreve uma diferença que não se
    vê. O veredito continua legível pelo selo com a palavra, na tabela. O
    desenho é o da ⚖ UEP (tela e papel): mudar (hachura para o âmbar?) é
    decidir para os dois.
  - Já existia: com os DOIS campos de data vazios a tela mostra o histórico
    inteiro e o papel os últimos 30 dias (o papel sempre teve esse corte). O
    boot preenche as datas, então é raro; se virar caso real, alinhar.
