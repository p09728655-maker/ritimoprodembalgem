# Paradas, gestão de perdas e simulador — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

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
  de ser inteiro (era "0 min em média" com paradas de 40 s). O `_fmtMin2` do
  mobile é fallback sem o módulo e espelha isso (o `_durMin2` saiu sem uso na
  v7.248.2).
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
  teste, sem tocar no painel. Suíte que não roda não guarda nada — rodar
  todas antes de publicar: hoje é o `node testes.js` (v7.248.2).

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
  - **No desktop é a mesma coisa** (`RP_PARADAS.diasTrabalhados`, a partir do
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
    a contagem das trocas em até X min).
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
- **`_pgTendencia` é a MESMA para a seta do quadro e para a linha "ESTAMOS
  MELHORANDO?" do diagnóstico** — duas cópias e uma apontaria para um lado e a
  outra diria o contrário.
  - ⚠ **Desde a v7.154.0 ela é a régua das METADES, não 1ª × última semana**
    (PPCP, 22/10/2026: *"como saber a partir de quando melhorou?"*). Em
    23/09–22/10 a seta dizia **MELHORA +0,7 p.p.** (82,3% → 83,0%) com as
    semanas do meio a 86,5–87,3% e a última de volta: comparava duas pontas
    e chamava de tendência qualquer diferença acima de meio ponto. Agora:
    disponibilidade de cada **dia trabalhado**, em ordem, partida ao meio, e
    `_pgMetades` (a MESMA do SMED) — direção só acima de 2 erros-padrão,
    senão **DENTRO DA VARIAÇÃO** (seta →, pele neutra `.pgq-tend.n`). O meio
    ponto virou o piso do limite (`PG_TEND_PISO_PP`); menos de
    `PG_TEND_MIN_DIAS`=4 dias em cada metade → não diz. No mesmo período:
    1ª metade 85,8% → 2ª 84,5% (−1,3 p.p., ±3,5) = DENTRO DA VARIAÇÃO.
  - **As barras mostram QUANDO; a seta diz SE mudou.** Não voltar a tirar a
    seta das barras: a barra da ponta costuma ser pedaço da semana.
  - O diagnóstico diz **SEM MUDANÇA CLARA** (não "ESTÁVEL") quando não há
    direção. `_pgTendFmt` é o texto único (quadro e diagnóstico); a conta
    recebe `dias` (o `_pgContexto` passa `dias` ao `_pgDiagnostico`).
- **SMED do quadro: média, META escrita, trocas contadas e o "melhorou?"**
  (v7.153.0, PPCP 22/10/2026, lendo *"40% já na meta"* como melhora). Era
  `6,8 → 5 min` com `142 trocas · 40% já na meta` e o subtítulo *"hoje → meta
  em vigor"*: a seta entre média e meta parecia evolução, o "já" parecia
  progresso e o 6,8 não era de hoje (é a média do período). Hoje:
  `6,8 min · meta 5 min`, `57 de 142 trocas em até 5 min` e uma linha de
  tendência por tipo. No papel, o card da seção 5 virou *"das trocas em até
  X min"*.
  - **Contagem e "melhorou?" moram no MESMO bloco** (`.pgq-smed-s`, com o
    "melhorou?" num `<span class="pgq-smed-t">`): na tela e no retrato saem em
    duas linhas; na **capa deitada** viram uma só (`.deitado .pgq-smed-t
    {display:inline}`), sem a nota da meta (`.pgq-smed-nota`) e sem as palavras
    "1ª/2ª metade" (`.pgq-smed-mt`) — a seção 5 imprime as duas inteiras.
    Por quê: em linhas separadas a célula SMED do papel passava da EVOLUÇÃO
    (146 px) e, com uma troca batendo a meta (nota presente), o quadro ia a
    723 px e a capa para a folha 2. Assim a célula fica com a altura da
    v7.152.0 e a capa em 703 px em todos os casos medidos (nenhuma, uma ou as
    duas trocas na meta). Mexeu no texto da linha? Medir a capa de novo.
  - **No papel, a seção 5 diz o MELHOROU? numa linha** (as duas metades com
    as datas, o rótulo e o ±); a régua — metades, ±, a do meio fora com nº
    ímpar, por que a semana sozinha não basta — está no ANEXO (v7.154.0; antes
    era um parágrafo na própria seção 5). O texto (rótulo, diferença, ±,
    faixas, médias) sai do `_pgTendSmedFmt`, um lugar só para quadro e seção
    5. A diferença é a das **médias exibidas** (`_pgDifTxt`: 6,0 → 7,9 é
    +1,9, nunca +1,8 do cru): a conta lida na linha fecha, e "−0,0" não
    existe.
  - **`_pgTendSmed` usa a régua das metades (`_pgMetades`)**, a mesma da
    seta da disponibilidade desde a v7.154.0 (antes esta era 1ª × última
    semana). Medido na planilha: a troca de produto tem desvio de ~5 min de uma
    troca para outra e a semana da ponta costuma ser pedaço — em 17/09–22/10 a
    S38 tinha 8 trocas a 4,4 min e a S43 8,1, e a seta diria PIORA +3,7. As
    trocas do período, em ordem de data e hora, são partidas ao meio (ímpar: a
    do meio fica fora) e as duas médias comparadas. **MELHORA/PIORA só acima
    de `PG_SMED_TEND_EP`=2 erros-padrão**; abaixo é **DENTRO DA VARIAÇÃO**, sem
    cor, com o número e o ±limite ao lado. Menos de `PG_SMED_AMOSTRA` trocas
    em cada metade → não diz (a linha avisa que é pouco). **Piso de 0,1 min**
    no limite — a casa que a tela mostra: metades de variância zero que
    diferem por segundos não viram "PIORA +0,0 min".
  - Em 17/09–22/10/2026 as duas trocas deram DENTRO DA VARIAÇÃO (produto +1,8
    com ±1,9; plástico +0,7 com ±1,0): o dado não sustenta "melhorou" nem
    "piorou". Não baixar o limite para a seta "dizer alguma coisa".
  - A seta segue o NÚMERO (↘ = o tempo caiu) e a palavra/cor dizem se é bom —
    no tempo de troca, cair é MELHORA. A conta mora no `_pgSmed` (`s.tend`); o
    quadro só desenha (o teste prende). Pele `.pgq-smed-t` na tela e no papel.
  - Medido no Chromium com as paradas reais, na TELA: de 1366 px de largura
    para cima a linha de cima do quadro não cresce (o SMED cabe ao lado da
    EVOLUÇÃO, 250 px); em 1280 px ou menos o "melhorou?" quebra e ela cresce
    29 px (250 → 279). Nada corta: a célula cresce — a tela não tem folha.
  - **A direção é decidida com os números da LINHA** (`limR`/`difR` no
    `_pgTendSmed`: médias e limite com uma casa). Com o cru, 6,75 → 10,0
    (+3,25 contra ±3,20) saía "PIORA +3,2 min" com "±3,2" — a palavra
    contradizendo os números que mostra. `delta`/`lim` crus continuam no
    objeto. Com nº ímpar de trocas, `fora`=1 e a nota da seção 5 diz que a do
    meio ficou fora.
- **PAPEL ENXUTO + ANEXO — COMO LER** (v7.154.0, PPCP: *"na impressão tem
  muito coisa escrita"*). Medido no relatório da tela (23/09–22/10): **729 das
  2.314 palavras (32%) estavam em 13 notas**. Regra de agora: no corpo, **cada
  nota é UMA linha** (conclusão ou legenda, ≤ 24 palavras — o teste conta) e o
  "como o número sai" vai para o **ANEXO — COMO LER**, numa folha própria no
  fim (`.pg-anexo-ttl{page-break-before:always}`). Embutida no relatório de
  PARADAS a camada fecha com **COMO LER A CAMADA DE GESTÃO**.
  - `anexo(ord, título, texto)` no `_pgSecaoHtml` devolve '' para entrar no
    meio do template e guarda o texto por seção; texto repetido entra uma vez;
    `anexoHtml()` é a ÚLTIMA expressão do template. Nenhum número saiu do
    corpo — só a explicação mudou de lugar.
  - O plano de ação e a tabela por janela deixaram de ter versão longa
    `.so-papel`: tela e papel mostram a mesma linha curta, e a explicação está
    no anexo (a impressão dedicada do min/1.000 tem a dela, COMO O NÚMERO SAI).
  - Resultado medido: notas do corpo 729 → **181 palavras**; corpo do papel
    2.167 → **1.637 palavras**, já com o O QUE MUDOU; 7 folhas, a última é o
    anexo (718 palavras). Escreveu nota nova? Uma linha; o resto no `anexo()`.
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
  - ⚠ **A guarda não pode ENGOLIR o pedido** (v7.153.0). Era `if(PG_TELA_RODANDO)
    return;`: a data trocada durante uma leitura sumia, e quando a leitura
    antiga voltava ela era pintada sob o rótulo novo. Caso real, 22/10/2026:
    o quadro dizia 17/09–22/10 e mostrava 02/09–22/10 (142 trocas e 6,8 min;
    o período certo tem 108 e 6,9) — conferido refazendo a conta com a
    planilha. Hoje o pedido fica pendente (`PG_TELA_PEND`, com o ↻ forçado
    preservado) e roda no fim, e resultado de período que não é mais o dos
    campos **não é pintado**. Mesma correção no SIMULADOR (`SIM_PEND`) — lá a
    TELA (e o cenário digitado, que lê pelo `SIM_ULT`) ficava no período
    anterior enquanto o 🖨 da proposta já lia o período dos campos: tela e
    papel discordavam. É a régua do `CART_PEND`/`QP_PEND` da aba PLANO.
    - **O pendente guarda a CHAVE** (`{chave, forcar}`) e só vira leitura se
      pede outra coisa: outro período, ou um ↻ forçado durante uma leitura não
      forçada. O MESMO pedido repetido é descartado — o `setTab` chama o
      render DUAS vezes na 1ª entrada (`_pgInitFiltro` já renderiza), e com a
      leitura falhando o repetido virava uma leitura completa a mais na fila
      do Apps Script (revisão adversarial de 22/10: 9 chamadas a
      `getParadasPeriodo` contra 6 antes, ~4 min em CARREGANDO).
    - **Campo de data pela metade** (sendo digitado) não é período novo: o
      resultado que chegou é pintado, em vez de CARREGANDO sem nada em voo —
      desde que o campo que ESTÁ preenchido seja o do período lido (com o
      outro campo já de outro período, não pinta).
    - **Pedido de OUTRO período com leitura em curso limpa a tela NA HORA**
      (CARREGANDO + selo vazio). Sem isso, o quadro do período em leitura
      ficava sob o rótulo novo até ela terminar (~80 s no cold start) — o
      caso de 22/10 em versão curta (2ª passada da revisão).
    - Ao limpar a tela para CARREGANDO, o selo (`pg-upd`/`sim-upd`) é limpo
      junto — "atualizando…" ficava preso ao lado da falha.
    - **A retentativa automática de 20 s** (`_pgFalhaHtml`) só dispara com a
      FALHA ainda na tela (`.pg-falha`): com outra leitura em curso ou dado já
      pintado, ela virava um pedido forçado e refazia a leitura que tinha
      acabado de dar certo. O timer é **um por tela** (`_pgFalhaTimer[fn]`):
      com um só, a falha do SIMULADOR cancelava a retentativa da GESTÃO. E a
      GESTÃO zera o `_pgFalhaTentou` no sucesso, como o SIMULADOR já fazia —
      antes a retentativa automática valia uma vez por sessão.
    - `relatorios.test.js` roda as duas funções reais com a busca de mentira
      (a fila `_assincronos`, que roda antes do resumo final; com
      `process.exitCode=1` armado, teste assíncrono que não termina não sai
      0).
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
      com um inteiro — o anexo do papel avisa.
    - ⚠ **A VARIAÇÃO é em MINUTOS por 1.000 cx, e diz isso** (v7.154.0, PPCP:
      *"essa variação é percentual?"*). Saía `↓ 11,2 a menos`, sem unidade, e
      do valor cru (51,1 → 40,0 dava 11,2). Hoje `↓ 11,1 min (−22%)`: a
      diferença sai dos valores EXIBIDOS (`deltaNP`) e o % sobre o anterior
      exibido (`deltaNPpct`). Coluna `VARIAÇÃO DO NÃO PROG.`; variação zero
      sai `= 0,0 min`, sem cor.
    - **O QUE MUDOU** (v7.154.0, PPCP: *"como saber a partir de quando
      melhorou e onde melhorou?"*): logo abaixo da tabela por janela, o NÃO
      PROGRAMADO aberto pelas `PG_CAUSAS_N`=5 causas de mais minutos no
      período, em min/1.000 cx de cada janela, + **demais causas** + o **NÃO
      PROG. TOTAL** (causas + demais = a coluna NÃO PROG. da tabela de cima,
      o teste prende). Em negrito, a melhor janela de cada causa. Conta no
      `_pgPorJanela` (`causas`, `demais`, a partir do `tiposNP` que o
      `_pgDias` passou a levar — NÃO programado por tipo do dia, os mesmos
      dias); desenho em `_pgCausasJanelaHtml`, chamado pelo `_pgMin1000Html`
      (tela, seção 6 do relatório e impressão dedicada, no grão em cartaz).
      Medido em 23/09–22/10/2026 por semana: troca de produto 23,7 · 17,0 ·
      21,8 · **12,5** · 22,4; "Outros" 14,5 · **3,9** · 9,5 · 5,9 · 17,0;
      troca de plástico **4,2** · 6,4 · 8,4 · 9,6 · 10,5 (sobe toda semana —
      mais trocas por dia, não trocas mais longas).
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
