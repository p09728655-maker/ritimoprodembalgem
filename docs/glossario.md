# Glossário — RitmoPatrimar · Embalagem

Cada indicador que o painel mostra, com a fórmula **conferida no código** e o
arquivo:linha de onde ela saiu. A interface e este arquivo não podem divergir —
se divergirem, o defeito é da interface.

Unidade padrão: **caixa (cx)**. Não existe "peça" no vocabulário do produto.

## Ritmo e meta do dia

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **PRODUÇÃO REAL** | soma do realizado das horas já lançadas | cx | `v7:3609` |
| **META DO DIA** | meta da PROGRAMAÇÃO (ou ajuste manual) + meta das horas extras cadastradas | cx | `v7:3629` |
| **RITMO ATUAL** | realizado ÷ nº de horas já lançadas | cx/h | `v7:3644` |
| **RITMO NECESSÁRIO** | (meta − realizado) ÷ horas restantes, nunca negativo | cx/h | `v7:3652` |
| **META/HORA** | média da meta das horas já lançadas | cx/h | `v7:3646` |
| **PROJEÇÃO** | realizado + ritmo atual × horas restantes | cx | `v7:3647` |
| **HORAS PRODUTIVAS** | soma dos minutos reais das horas lançadas ÷ 60 | h | `v7:3673` |
| **MELHOR / PIOR HORA** | maior e menor hora do dia, **só entre as horas de jornada** | cx | `v7:3663` |

⚠ O slot pós-almoço `12:12-13:00` tem **48 min**, não 60. Por isso as horas
produtivas somam a duração real de cada slot em vez de multiplicar por 60.

## Eficiência — o número é fato, o veredito é o selo

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **% DA META DO DIA** (o número grande) | realizado ÷ meta do **dia inteiro** × 100 | % | `v7:3637` |
| **META ATÉ AGORA** (a linha de apoio) | meta do dia × (minutos de turno já rodados ÷ minutos do turno) | cx | `rp-core.js:148` |
| **RITMO** (o selo e a cor) | realizado ÷ meta até agora × 100 → `NO RITMO` · `ATENÇÃO` · `ABAIXO DO RITMO` | % | `rp-core.js:163` |

**Como ler:** o número diz **quanto do dia já saiu** — 780 de 2.700 é 28,9%, e
qualquer um confere de cabeça. O selo diz se esse ritmo **dá para bater a meta**:
780 contra as 751 que a meta pedia até aquela hora é `NO RITMO`. Um dia pode
mostrar 28,9% e estar verde às 07:30.

⚠ A palavra **META não aparece ao lado do percentual**. Era essa colisão que
confundia quem lia a TV de longe (01/09/2026): "103,8% · DENTRO DA META" num dia
com 780 de 2.700 cx. Dois "%" com denominadores diferentes na mesma tela.

⚠ O rateio é por **minutos**, não por número de horas (o slot pós-almoço vale 48
min), e só entra hora **com lançamento**. A meta/hora da `HORA_A_HORA`
(`v7:3632`) **não pinta mais nenhuma tela**: quando ela discordava da meta do dia
— 31/08/2026, 1.476 contra 2.709 — a TV escrevia 49,8% em verde.

## Atraso hora a hora

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **ATRASO ACUMULADO** | max(meta acumulada − produção acumulada, 0), **só das horas já lançadas** | cx | `rp-core.js:98` |
| **META EFETIVA da hora** | meta da hora + atraso acumulado | cx | idem |

⚠ Hora ainda **não lançada** chega como `null` e **não entra** no acumulado —
contá-la como "produziu zero" fazia o atraso crescer uma meta inteira por hora
que ainda nem tinha acontecido. Hora que **fechou** em zero vem como `0` e é
cobrada normalmente.

⚠ **Hora extra também não entra** — nem cobrando, nem abatendo. Ela não tem meta,
então não gera atraso para as horas de jornada seguintes nem quita o atraso delas
com caixas feitas fora do turno.

## Hora extra

| Termo | Regra | Onde está |
|---|---|---|
| **JORNADA NORMAL** | 07:00–17:00 (o almoço 11:00–12:12 fica dentro dela) | `.gs` `HE_JORNADA_*_MIN` |
| **HORA EXTRA (caixas)** | linha com rótulo `HE ` **ou** horário fora da jornada | `.gs:_ehHoraExtraCaixas` |
| **HORA EXTRA (identidade da linha)** | só o prefixo `HE ` no rótulo | `.gs:_ehHoraExtra` |
| **HE CX** | caixas das horas classificadas como extra, por dia (11ª coluna do `HISTORICO`) | `.gs:arquivarDiaAtual` |

**Como ler:** 05:00–06:00 e 06:00–07:00 são sempre hora extra, mesmo sem o
rótulo — quem as libera é a célula `C3`. Os dois critérios existem separados
porque o de identidade governa a limpeza diária, que **apaga** a linha marcada.

### A hora extra não é julgada — hoje e no dia passado

| Onde | O que a hora de HE mostra |
|---|---|
| **META/H e EFICIÊNCIA** da linha | `—` (sem meta não há eficiência) |
| **STATUS** da linha | etiqueta `HORA EXTRA`, nunca OK/ATENÇÃO/ABAIXO |
| **PICO / VALE e MELHOR / PIOR HORA** | fora — só horas de jornada disputam |
| **ATRASO acumulado** | fora, nos dois sentidos |
| **PRODUÇÃO REAL, META DO DIA, CAIXAS EM HORA EXTRA** | as caixas contam normalmente |

⚠ Vale no **gerencial** (desktop e celular). A **TV OPERACIONAL** continua
mostrando a meta da hora durante a HE — lá o número é o ritmo que o operador
acompanha, não um veredito de gestão.

⚠ A jornada é declarada **duas vezes**: na configuração do painel (TURNO) e nas
constantes do `.gs`. Mudou o turno na tela, mudar as constantes também.

## Programação — atraso e situação de cada linha

A produção (log `PRODUCAO_PRODUTO`, sem lote) é casada com a demanda (linhas da
`PROGRAMACAO` + `PROGRAMACAO_CONCLUIDA`) por **FIFO, por código**: cada caixa
abate o lote aberto **mais antigo** do mesmo código.

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **ATRASO** (atraso vivo) | Σ do saldo dos lotes com data **anterior a hoje** depois do FIFO — cai durante o dia conforme a linha embala | cx | `.gs:3611` |
| **PROGRAMADO HOJE** (meta do dia) | Σ `QTDE` das linhas datadas para hoje, **arquivadas e encerradas incluídas** | cx | `.gs:3622` |
| **FALTA P/ ZERAR** | atraso + o que falta das linhas de hoje | cx | `.gs:3654` |
| **PRODUÇÃO ADIANTADA** | caixa embalada sem lote aberto vira crédito e abate o próximo lote **do mesmo código** que abrir em até `ANTEC_DIAS_UTEIS` (**2**) dias úteis; depois disso é descartada | cx | `.gs:250`, `.gs:3584` |
| **DIAS ÚTEIS** | seg–sex depois da data da produção até a data do lote (sexta → segunda = 1); feriado conta como útil | dias | `.gs:3270` |
| **MESMA DATA** | no empate de data, a linha que já fechou entra primeiro: arquivada → encerrada → aberta (cada grupo na ordem da aba) | — | `.gs:3540` |
| **ENCERRAR** | X na coluna `ENCERRAR`: a linha fica com o que já recebeu do FIFO, o resto deixa de ser cobrado (não é atraso). O teto é o `PRODUZIDO` da própria linha **quando ele fecha com ela** (`PRODUZIDO + SALDO = QTDE`, ou `ENCERRADO` com saldo 0), e ela é servida antes dos lotes abertos; sem isso (célula vazia ou de outra linha) recebe só o que veio **antes de hoje**. Só vale para linha vencida ou de hoje. Apagar o X na CONCLUIDA desfaz | — | `.gs:3396`, `.gs:3495`, `.gs:3576` |
| **ADIANTADO** (linha futura) | linha de data **futura** que já recebeu caixa embalada antes da data dela: o crédito que sobra no fim do FIFO é alocado às linhas futuras do mesmo código, na ordem de data, com a **mesma janela** de `ANTEC_DIAS_UTEIS` dias úteis (data da produção → data do lote). A linha mostra `PRODUZIDO`/`SALDO` já hoje. É uma **prévia**: o número que vale é o do dia do lote (igual, se nada mais mudar). Não entra em atraso, meta nem falta de hoje | cx | `.gs:3651`, `.gs:1757` |
| **ADIANTADO_CX** (coluna) | caixas da linha que vieram de produção feita **antes da data do lote** (o crédito do FIFO, `lot.cred`), limitado ao PRODUZIDO. Linha futura: o próprio PRODUZIDO. Vai congelada para a CONCLUIDA. **0** = calculado, nada adiantado; **vazio** = não calculado (arquivada antes da v5.23, futura sem adiantamento, fora da esteira) | cx | `.gs:1694`, `.gs:3714` |
| **CONCLUIDO (ADIANTADO)** | saldo 0 com **metade ou mais** vinda de produção adiantada; fica **um dia** na aba antes de ir para a CONCLUIDA (o sistema não separa adiantamento de sobra de cor errada) | — | `.gs:3605`, `.gs:1850` |
| **VOLTA DA CONCLUIDA** | linha arquivada, não encerrada, que o FIFO dá com saldo de novo (log corrigido, linha mais antiga acrescentada) — ou que perdeu o X na CONCLUIDA — volta para a PROGRAMACAO recalculada | — | `.gs:1952` |
| **STATUS** | `CONCLUIDO` (saldo 0) · `CONCLUIDO (ADIANTADO)` · `EM ATRASO` (data anterior, aberta) · `EM ANDAMENTO` (hoje, já produziu) · `PENDENTE` (hoje, não começou) · `ADIANTADO` (data futura, já recebeu parte) · `FORA DA ESTEIRA` · `ENCERRADO` (fechada pelo PPCP; o `PERCENTUAL` mostra o que ficou para trás, arredondado para baixo) | — | `.gs:1627` |

⚠ **Linha apagada à mão some da demanda**: a produção dela passa a abater
outro lote do mesmo código ou é descartada, e a meta do dia encolhe. Para
fechar uma linha que não vai completar, é **ENCERRAR**, não apagar.

## Qualidade do plano (aba 📐 PLANO)

Mede o **plano**, não a linha. Medido no `HISTORICO` em 15/09/2026 (79 dias), a
meta do dia explica **8%** da variação do realizado (r = 0,28).

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **CURVA DE CAPACIDADE** | os dias **com produção em jornada normal** (`realizado − HE CX`; dia sem a separação entra inteiro), ordenados do pior para o melhor | cx/dia | `v7:_qpDiasBase`, `v7:_qpCurva` |
| **ALTURA DA META** (percentil) | % dos dias cuja produção ficou **nesse nível ou abaixo** — a fatia que a meta reprovaria | p0–p100 | `v7:_qpPercentil` |
| **OSCILAÇÃO DA META** | desvio padrão ÷ média das metas do período | % | `v7:_qpOscilacao` |
| **DIAS ACIMA DA CAPACIDADE** | dias cuja meta passou de `QP_ACIMA` | dias | `v7:_qpAnalise` |
| **META EXEQUÍVEL SERIA** | o valor da curva entre o mínimo e o máximo da **faixa alvo** escolhida na barra | cx/dia | `v7:_qpValorNoPercentil` |
| **CARTEIRA EM ABERTO** | caixas datadas para dias futuros (`qtde − adiantado` de cada linha da `PROGRAMACAO`; o `adiantado` vem do backend por linha e é mostrado à parte) **+ dívida** (atraso vivo + resto da meta de hoje). Com CARTEIRA = `cx de linha (mix)`, cada lote entra pesado (linha abaixo) e o cru fica ao lado | cx | `v7:_cartAberta` |
| **CARGA** (carga pelo mix; no código, *cx de linha*) | `qtde × (ritmo de referência ÷ ritmo demonstrado do produto)`; referência = Σcx ÷ Σhoras de produto do período da régua; ritmo do produto = média aparada do cx/h do log (`modelo\|cor`, queda para `modelo`, sem histórico = fator 1); fator limitado a 0,33–3 | cx | `v7:_mixRitmos`, `v7:_mixFator` |
| **CONFERÊNCIA DO MIX** | oscilação (`_qpOscilacao`) do realizado dos dias da régua **em caixas cruas** × **convertido pelo mix do dia** (`real × Σcx·fator ÷ Σcx`); "explica" = `1 − osc_mix ÷ osc_cru` | % | `v7:_mixDiag` |
| **HORAS DE PRODUTO ÷ HORAS DE LINHA** | Σ horas rodadas por produto ÷ nº de horas distintas da linha, no período da régua — acima de 1 é a esteira rodando mais de um produto por vez | razão | `v7:_mixRitmos` |
| **DIAS QUE NÃO CABEM** | dias cuja carga datada passa do topo da faixa alvo | dias | `v7:_cartAnalise` |
| **PRECISA MUDAR DE DIA** | Σ `max(0, carga do dia − topo da faixa)` | cx | `v7:_cartAnalise` |
| **ESPAÇO LIVRE** | Σ `max(0, topo da faixa − carga do dia)` | cx | `v7:_cartAnalise` |
| **E SE PARADAS −X%** | cada dia da régua entra com `realizado sem HE + X% × caixas perdidas em paradas não programadas daquele dia` (a perda do `RP_PARADAS`); a curva e a análise da carteira são refeitas com essa régua | cx | `v7:_cartDiasComMenosParadas`, `v7:_cartCenario` |
| **SOBRA (horizonte)** | `precisa mudar + dívida − espaço livre`, nunca negativo | cx | `v7:_cartAnalise` |
| **NIVELADO SERIA** | `(carteira futura + dívida) ÷ nº de dias datados` | cx/dia | `v7:_cartAnalise` |
| **ORDEM da tabela** | `data` → os últimos 15 dias · `alta`/`baixa` → as 15 metas de maior/menor percentil do período julgado | — | `v7:_qpOrdenar` |

**Como ler:** meta em p53 quer dizer que em 53% dos dias a linha não chegaria
lá.

⚠ **A carteira em aberto NÃO soma o campo `falta`.** Ele vem do FIFO **por
código**: duas linhas do mesmo código devolvem o mesmo número, e somá-las
contaria o saldo duas vezes. Para linha de data futura o backend zera
`embalado`/`falta` de propósito, então o aberto dela é a `qtde` menos o
`adiantado` — este sim **por linha** (o próprio FIFO aloca), então somar não
conta nada duas vezes (`.gs` v5.22 / v7.131.0).

⚠ **A dívida ocupa dia.** Atraso e o que falta hoje consomem capacidade dos
primeiros dias antes de qualquer lote novo — por isso entram no NIVELADO e na
SOBRA. Fora deles, o horizonte pareceria mais folgado do que é.

⚠ **São três recortes diferentes e eles não se confundem.** **JULGAR** escolhe
quais dias aparecem no gráfico; **RÉGUA** escolhe de quais dias sai o p50/p60/p75
com que eles são comparados (padrão **60 dias**, móvel desde a v7.48.0 — antes
era todo o histórico, e isso **subestimava** a linha); **ORDEM** escolhe o
recorte da tabela de baixo. Por `data` a tabela é a **cauda** do período; por
`alta`/`baixa` é o **topo** (ou o fundo) do período **inteiro** — o título da
tabela diz qual dos dois está valendo.

⚠ **Altura e oscilação são defeitos independentes.** A meta pode estar na altura
certa e ainda assim pular de p0 a p100 — foi o medido. Por isso há veredito
próprio para a faixa do meio (`META OSCILANDO`): sem ele, oscilação de 28%
passava por `PLANO EXEQUÍVEL`.

⚠ **Não é baixar a meta.** A meta do dia serve para **sinalizar**; meta que
reprova quase todo dia vira paisagem e o alarme se perde. A produção sobe pelas
paradas, pelo setup e pelo teto da esteira.

O combinado está em constantes no topo do bloco (`QP_ALVO_MIN` 50, `QP_ALVO_MAX`
60, `QP_ACIMA` 75, `QP_OSC_OK` 20, `QP_OSC_RUIM` 30, `QP_MIN_DIAS` 10).

## Paradas

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **DURAÇÃO** | `FIM − INICIO`, em minutos **com fração** (`HH:mm:ss`, 45 s = 0,75); hora sem segundos lê como `:00` | min | `paradas-calc.js:durMin`, `.gs:calcDurMin` |
| **DURAÇÃO PRODUTIVA** | minutos da parada **fora** do almoço | min | `paradas-calc.js:durProdutiva` |
| **CAIXAS PERDIDAS** | duração produtiva × (meta do dia ÷ horas produtivas), só paradas **não** planejadas | cx | `paradas-calc.js:143` |
| **DISPONIBILIDADE** | (tempo disponível − tempo parado não programado) ÷ tempo disponível × 100 | % | `paradas-calc.js:261` |
| **RITMO DE REFERÊNCIA** | caixas perdidas ÷ (tempo parado não programado ÷ 60) | cx/h | `paradas-calc.js:270` |
| **MIN / 1.000 CX** | minutos parados ÷ caixas × 1.000, só nos **dias trabalhados** | min | `v7:_pgPorJanela` |
| **VARIAÇÃO DO NÃO PROG.** (tabela por janela) | NÃO PROG. / 1.000 CX da janela − o da janela anterior, com os valores **exibidos** (uma casa); e o % sobre o anterior exibido. ↓ é melhora | min/1.000 cx e % | `v7:_pgPorJanela` (`deltaNP`, `deltaNPpct`) |
| **O QUE MUDOU** (por causa) | minutos NÃO programados da causa nos dias trabalhados da janela ÷ caixas da janela × 1.000. As 5 causas de mais minutos no período + demais causas = o NÃO PROG. / 1.000 CX da janela | min/1.000 cx | `v7:_pgPorJanela` (`causas`, `demais`) |
| **MELHOROU?** (EVOLUÇÃO) | disponibilidade de cada dia trabalhado, em ordem, partida ao meio; a mesma régua do MELHOROU? do SMED (2 erros-padrão, piso de 0,5 p.p., 4+ dias em cada metade) | p.p. | `v7:_pgTendencia` → `_pgMetades` |
| **TEMPO MÉDIO DE TROCA** (SMED) | soma da duração produtiva das trocas do tipo ÷ nº de trocas, no período escolhido (não é "hoje") | min | `v7:_pgSmed` |
| **TROCAS EM ATÉ X MIN** (SMED) | nº de trocas do período com duração produtiva ≤ meta em vigor (X), de um total de N | trocas | `v7:_pgSmed` (`naMeta`) |
| **MELHOROU?** (SMED) | trocas do período em ordem de data e hora, partidas ao meio (ímpar: a do meio fora); média da 2ª metade − média da 1ª. **MELHORA**/**PIORA** só quando a diferença passa de 2 erros-padrão (`2 × √(s₁²/n + s₂²/n)`, nunca menos de 0,1 min) — comparadas as duas com uma casa, como a linha mostra —, senão **DENTRO DA VARIAÇÃO**; menos de 4 trocas por metade → sem leitura. Tempo que cai é MELHORA | min | `v7:_pgTendSmed` |

**Como ler:** a base é **dias trabalhados** (dias com produção lançada), nunca
dias corridos nem "dias com parada" — o dia que rodou sem parar é justamente o
melhor dia, e tirá-lo da conta faria a média subir sozinha.

⚠ O arredondamento acontece **uma vez, no fim**. Arredondar a perda de cada
parada e somar joga fora a fração de todas elas, sempre para menos.

⚠ **Segundos contam** (v7.59.0 / .gs 5.5): a aba `PARADAS` grava `INICIO`/`FIM`
em `HH:mm:ss`, `DURACAO_MIN` com fração e `DURACAO_SEG` em segundos inteiros.
Na tela a duração abaixo de 1 min sai em segundos (*45 s*), minuto quebrado sai
*3m15s* (`paradas-calc.js:fmtMin`). Linha antiga (só `HH:mm`) é lida como antes.

## Esteira e comparativo por modelo

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **TETO DA ESTEIRA** | velocidade (m/min) × 60.000 ÷ (medida da caixa + entre-peças, mm) | cx/h | `.gs:293` |
| **% TETO EST.** | média cx/h ÷ teto operacional (o físico menos a troca de produto) | % | `v7:_phTetoOper` |
| **MÉD. PERÍODO (aparada)** | média ponderada Σcx ÷ Σh, **sem** o melhor e o pior dia (com 3+ dias) | cx/h | `v7:_phMediaAparada` |
| **MÉD. PERÍODO (completa)** | a mesma, **sem** podar nada | cx/h | idem, modo `completa` |
| **GANHO DEMONSTRADO** | se cada modelo repetisse o próprio melhor dia nas horas que rodou | cx | `v7` (PDF do período) |
| **COBERTURA DO APONTAMENTO** | caixas com produto identificado ÷ realizado total × 100 | % | `v7:_phCobertura` |

**Como ler:** o mix de caixas usa média **harmônica** ponderada pelas caixas — o
tempo de esteira soma, e a aritmética superestimaria o teto. Cobertura abaixo de
80% significa que a análise por modelo é **amostra**, não o período inteiro.

## Estudo de UEP (📐 ESTUDO UEP, aba PRODUÇÃO/HORA) — só análise

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **UEP/CX** | ritmo da base fixa (`UEP_BASE`: MESA CABECEIRA MADERO — PADRÃO DE UEP de 21/10/2026; a base SLEEP da v7.143.0 foi desfeita; sem ela no período, a âncora do período) ÷ ritmo do produto (a base vale 1,00); o ritmo é o EM REGIME com 4+ h sozinho, senão o usado | UEP/cx | `v7:5822` |
| **RITMO EM REGIME** | caixas ÷ horas em que o produto rodou sozinho na linha | cx/h | `v7:_uepProdutos` |
| **RITMO USADO** | caixas ÷ horas do produto com a hora de troca repartida pelo tempo esperado (caixas ÷ ritmo em regime) | cx/h | `v7:_uepProdutos` |
| **UEP POR DIA** | Σ caixas com produto do dia × UEP/cx (âncora A) — o realizado | UEP | `v7:_uepDias` |
| **FAIXA SUGERIDA DE META (UEP)** | p50–p60 (faixa da aba PLANO) da UEP GRAVADA (coluna UEP do HISTORICO, jornada) dos dias válidos — sem os dias acima do limite físico (teto do produto de referência na escala da base) ou com apontamento acima do realizado; mesma escala da META UEP | UEP | `v7:_uepEstudo` |
| **UEP GRAVADA** (estudo de UEP) | a UEP oficial do dia (coluna UEP do HISTORICO) e % = UEP ÷ META UEP do dia, cor `sc` como na aba HISTÓRICO; BATEU A META = `uepHistResumo` (UEP ≥ meta do dia). A UEP ESTUDO da mesma linha está na escala do período e não se compara com meta | UEP | `v7:_uepEstudo` |
| **UEP DO DIA** (gerencial) | Σ caixas × UEP do código (coluna UEP da PRODUTO_CODIGO), só horas de jornada normal; HE à parte. Meta = META_UEP da CONFIG_PAINEL (padrão 2.530, base MADERO = 1,00 — PADRÃO DE UEP de 21/10/2026; jornada normal de 527 min). Esperado = meta × min(minutos de jornada com lançamento, 527) ÷ 527 | UEP | `.gs:getPontosDia` + `rp-core:uepCard` |
| **UEP / DIA (JORNADA)** (HISTÓRICO) | média da coluna UEP do HISTORICO nos dias com UEP; bateu = UEP ≥ META UEP daquele dia | UEP | `rp-core:uepHistResumo` |
| **UEP/cx do grupo** (comparativo) | Σ(caixas × UEP/cx do produto) ÷ Σ caixas dos produtos com UEP no grupo | UEP/cx | `v7:_phUepPorGrupo` |
| **UEP EM 8 H** | UEP/h da linha (UEP do dia ÷ horas da linha) × 8 — a capacidade num dia padrão | UEP | `v7:_uepEstudo` |
| **VALIDAÇÃO FORA DA AMOSTRA** | oscilação cx/h → UEP/h na 2ª metade dos dias, com a UEP calculada só na 1ª | % | `v7:_uepValidacao` |
| **UEP NO PERÍODO** | caixas × UEP/cx (âncora A) | UEP | `v7:_uepEstudo` |
| **CAIXAS COBERTAS** | caixas de produto com UEP ÷ caixas apontadas com produto × 100 | % | `v7:5865` |
| **OSCILAÇÃO CX/H → UEP/H** | desvio ÷ média do ritmo da linha dia a dia, em cx/h e em UEP/h, sobre as mesmas caixas | % | `v7:5881` |

## Aba ⚖ UEP (gerencial do PC) — hoje

| Indicador | Fórmula | Unidade | Onde |
|---|---|---|---|
| **UEP ATÉ AGORA** | o mesmo número e selo do card UEP DO DIA (`uepCard`): UEP de jornada normal × esperado até agora; diferença = feito − esperado, e o % = feito ÷ esperado. Esperado = meta × minutos de jornada **já decorridos** ÷ 527 — a hora em andamento conta só o que passou (`minSlotDecorrido`, v7.114.0) | UEP | `rp-core:uepCard` + `rp-core:minSlotDecorrido` |
| **PROJEÇÃO DO DIA** | UEP feita + (UEP feita ÷ minutos de jornada decorridos) × minutos de jornada que faltam (de 527) — a média da jornada, não a última hora; hora extra fora | UEP | `v7:_uepAbaProj` |
| **UEP POR HORA** | UEP feita ÷ minutos de jornada decorridos × 60; meta/h = meta do dia ÷ 527 × 60 | UEP/h | `v7:_uepAbaProj` |
| **UEP NA HORA** (gráfico) | Σ caixas × UEP do código na hora (pelo início, HH:MM); meta da hora = meta do dia × minutos do slot ÷ 527; HE sem meta; a hora em andamento aparece sem cor ("até HH:MM"), não é julgada | UEP | `rp-core:uepPorHora` + `v7:_uepAbaHoras` |
| **MIX DE HOJE** | por produto (modelo + nome), só jornada normal: caixas, UEP, UEP/cx = UEP ÷ caixas com UEP, % = UEP do produto ÷ UEP do dia | UEP | `v7:_uepAbaMix` |
| **ORIGEM DA UEP** (era CONFIABILIDADE) | caixas de hoje por código: UEP medida — estudo ou digitada, **não é cronoanálise** (vigência sem `EST`) · estimada (vigência termina em `EST`) · sem UEP, ÷ caixas apontadas | % | `v7:_uepAbaConf` |
| **MÉDIA POR DIA** (período) | Σ UEP de jornada gravada nos dias fechados com UEP ÷ nº desses dias; % = Σ UEP ÷ Σ META UEP dos mesmos dias | UEP | `rp-core:uepHistResumo` + `v7:_uepAbaPeriodo` |
| **DIAS QUE BATERAM** (período) | dias com UEP ≥ META UEP daquele dia | dias | `rp-core:uepHistResumo` |
| **OSCILAÇÃO DIA A DIA** (período) | desvio padrão ÷ média, dia a dia, em UEP e em caixas de jornada (realizado − HE) dos mesmos dias | % | `v7:_qpOscilacao` + `v7:_uepAbaPeriodo` |
| **UEP PADRÃO** (bloco 7) | a UEP por caixa do código **vigente na data**: a última versão da aba `UEP_VERSOES` com vigência ≤ dia; sem a aba, o cadastro de hoje. A semente (1ª mudança) é o cadastro como estava, valendo desde sempre | UEP/cx | `.gs:_uepVigente` + `.gs:getProducaoModeloPeriodo` (`?uepVer=1`) |
| **CX/H PADRÃO** (bloco 7) | ritmo da meta ÷ UEP por caixa = (META UEP do dia ÷ 527 × 60) ÷ (UEP do dia ÷ caixas do produto) | cx/h | `v7:_uepPadHist` |
| **% DO PADRÃO** (dia) | UEP feita pelo produto ÷ (META UEP do dia ÷ 527 × minutos do produto) × 100. Minutos = horas em que rodou; hora com troca repartida pelo tempo padrão (UEP de cada um); hora com caixa de código sem UEP fica fora. META UEP = a gravada no HISTORICO daquele dia (a do ⚙ se o dia não está lá) | % | `v7:_uepPadHist` |
| **SITUAÇÃO** (dia) | ABAIXO < 90% · NO PADRÃO 90–110% · ACIMA > 110% (alerta: UEP alta demais ou apontamento) · `< 2 H` = menos de 120 min do produto no dia, não julgado | — | `v7:_uepPadSt` + `UEP_PAD_MIN_MIN` |
| **% DO PADRÃO** (período) | Σ UEP feita ÷ Σ UEP pedida nos dias julgados (não é média de %) | % | `v7:_uepPadHist` |
| **PADRÃO ALTERADO** | a vigência mais nova entre os códigos do produto mudou em relação ao dia anterior em que ele rodou | — | `v7:_uepPadHist` (`uepVigDe`) |
| **EFEITO NA UEP DA LINHA** (confirm do GRAVAR UEP) | a produção de jornada do período do estudo (hoje fora) × UEP/cx de cada produto, antes (cadastro, `uepProd` da leitura) e depois (UEP do estudo). Média = Σ UEP ÷ dias. **Escala** = Σ cx×depois ÷ Σ cx×antes − 1, só produtos com UEP nos dois. **Meta equivalente** = meta × (1 + escala) | UEP/dia · % | `v7:_uepImpacto` + `v7:_uepImpactoTxt` |

**Alerta de dado** (faixa âmbar no topo): aparece quando ≥ 20% das caixas de
hoje têm UEP estimada ou ≥ 5% estão sem UEP (`UEP_ALERTA_EST`/`UEP_ALERTA_SEM`).

**Como ler:** A = a **BASE FIXA** `UEP_BASE` (501149 MESA CABECEIRA MADERO; entre 19 e 21/10/2026 foi a 501094 SLEEP, desfeita no PADRÃO DE UEP),
que vale 1,00 em todo estudo quando rodou no período (v7.136.0). Sem ela no
período, a A é — só para leitura — a âncora do período (o produto com mais
caixas abaixo de 90% do teto, entre os que têm 5+ dias). Desde a v7.137.0 o
estudo mostra UMA UEP/CX só (a coluna B, do mais rápido, saiu). Produto com menos de 5
dias rodados sai com UEP **PROVISÓRIA** (marcada com \*). O 💾 GRAVAR UEP só
grava com a base medida no período: 5+ dias e abaixo de 90% do teto
(`baseOk`; o motivo do bloqueio é o `_uepBaseFaltaTxt`). **Desde 16/10/2026 o cadastro está TRAVADO**
(`UEP_TRAVADA_DESDE`): o GRAVAR não grava nada, e a UEP só muda digitada na
coluna UEP da PRODUTO_CODIGO (cronoanálise), registrada na `UEP_VERSOES`.

## Telas F e G da TV — a UEP do dia (v7.138.0)

Fora do ciclo por padrão (⚙ → TELA F / TELA G) e **sem veredito** por padrão
(⚙ → SELO DE RITMO NAS TELAS F e G). Tudo sai da montagem da aba ⚖ UEP
(`_uepAbaDados`): os números são os mesmos do card UEP DO DIA.

| Indicador | Fórmula | Unidade | Onde |
|---|---|---|---|
| **UEP FEITA ATÉ AGORA** (Tela F) | o UEP ATÉ AGORA da aba ⚖ UEP (`uepCard`): UEP de jornada normal × esperado até agora | UEP | `rp-core:uepCard` |
| **1 CAIXA = X UEP** (rodando agora) | UEP do código do produto atual no cadastro; sem cadastro no aparelho, UEP ÷ caixas de hoje do mesmo produto e cor (`porHoraModelo`) | UEP/cx | `v7:_tvUepDoProduto` |
| **PESO MÉDIO DA CAIXA HOJE** | UEP de jornada ÷ caixas de jornada da HORA_A_HORA (`k.realNormal`) | UEP/cx | `v7:_tvUepMontar` |
| **O NORMAL** (peso da caixa) | mediana de UEP ÷ caixas de jornada (`_qpRealDia`) nos últimos 30 dias fechados com UEP; menos de 5 dias → não mostra. "mais pesadas/leves" = hoje ÷ normal acima de 1,05 / abaixo de 0,95 | UEP/cx | `v7:_tvUepPesoNormal` |
| **À FRENTE / ATRÁS (min)** (Tela G) | (UEP feita − esperada) ÷ (meta ÷ 527) — o adiantamento em minutos de linha no ritmo da meta | min | `v7:_tvUepMontar` |
| **FALTA PARA A META DO DIA** | meta − UEP feita (nunca negativo); em caixas = ⌈falta ÷ UEP/cx do produto de agora⌉ | UEP · cx | `v7:_tvUepMontar` |
| **A META SAI ÀS** | agora + falta ÷ (meta ÷ 527), andando só pelos minutos de jornada que restam (o almoço não conta). Não cabe até o fim da jornada → mostra o ritmo que faltaria: falta ÷ minutos restantes × 60 | hora · UEP/h | `v7:_tvUepMontar` |
| **ESPERADO** (linha do gráfico) | meta × minutos de jornada **com lançamento** ÷ 527, hora a hora — a mesma régua do card; daqui para a frente, a meta no ritmo do relógio | UEP | `v7:_tvUepMontar` |

## Relatórios de UEP da aba ⚖ UEP (v7.139.0)

| Indicador | Fórmula | Unidade | Onde |
|---|---|---|---|
| **UEP POR HORA DE ESTEIRA** (k) | UEP/cx do código × teto da esteira do código (velocidade × 60.000 ÷ (medida + entre-peças), cx/h); do produto, a mediana dos códigos medidos | UEP/h | `v7:_filaCronoMontar` |
| **PROVISÓRIA** (fila) | UEP medida com menos de `UEP_MIN_DIAS` (5) dias distintos de produção na amostra (01/07/2026 até `UEP_TRAVADA_DESDE`) | — | `v7:_filaCronoMontar` |
| **NO LIMITE DA ESTEIRA** (fila) | k do produto ≤ menor k do cadastro × 1,02 — o estudo corta o ritmo no teto físico, então quem rodou no limite cai no mínimo | — | `v7:_filaCronoMontar` |
| **FAMÍLIA INCOERENTE** (fila) | maior ÷ menor k entre os produtos medidos do mesmo modelo de 6 dígitos ≥ 1,8 | × | `v7:_filaCronoMontar` |
| **UEP PROGRAMADA EM DÚVIDA** | Σ (caixas abertas × UEP) dos produtos da fila na janela ÷ Σ de todos os produtos na janela (próximos 5 dias úteis; aberta = qtde − adiantado; fora da esteira não entra) | % | `v7:_filaCronoMontar` |
| **EM CAIXAS / EM UEP** (caixas × UEP) | caixas de jornada (REALIZADO − HE CX) ÷ META · UEP de jornada ÷ META UEP, do HISTORICO; veredito pela régua do selo (`sc`/`slRitmo`, ≥ 96%) | % | `v7:_cxUepMontar` |
| **A META EM CX PEDIA** | META em caixas × UEP/cx do próprio dia ÷ META UEP — acima de 105%, a meta em caixas era mais pesada que a capacidade em UEP | % | `v7:_cxUepMontar` |
| **TAKT s/CX** (fila e bloco 7) | 527 min × 60 ÷ META UEP × UEP/cx do produto (= 3.600 ÷ CX/H PADRÃO). Com a meta de 2.530 (base MADERO): 12,5 s por UEP — 1 caixa de MADERO (1,00) = 12,5 s, um volume de 1,84 = 23,0 s. Na fila, um por volume, com a META UEP do ⚙; no bloco 7, com a META gravada em cada dia | s/cx | `v7:_taktUep` |
| **s/CX REAL** (dia a dia do bloco 7) | minutos do produto no dia × 60 ÷ caixas, com a hora de troca repartida pelo tempo padrão — acima do TAKT s/CX = mais lento que a meta pede | s/cx | `v7:_uepPadHist` |
| **UEP EQUIVALENTE** (⏱ CRONOANÁLISE → UEP) | segundos por volume medidos ÷ segundos da base por volume. Base padrão (campo vazio) = a MADERO cronometrada com a linha rodando, **7,9 s** (20/10/2026, 60 volumes, `UEP_BASE_MEDIDA`; a SLEEP deu o mesmo), e o produto também rodando — parada evitável não é esforço do produto. Outro tempo digitado vale só naquele computador (aviso). 12,5 digitado = a régua da meta (527 min × 60 ÷ META UEP), e aí o tempo medido é o NO PERÍODO (paradas dentro). Base mais lenta que a régua da meta = suspeita (aviso). Produto de N volumes: jogo = UEP equivalente × N | UEP/vol | `v7:_uepConvMontar` |
| **DIFERENÇA** (⏱ CRONOANÁLISE → UEP) | UEP equivalente ÷ UEP média por volume do cadastro − 1. CONFERE dentro de 90–110% (`UEP_PAD_FAIXA`, a faixa do NO PADRÃO do bloco 7). Sem UEP no cadastro: "—", nunca 0% | % | `v7:_uepConvMontar` |
| **A LINHA FAZ** (⏱ CRONOANÁLISE → UEP) | o MÉD.PERÍODO do produto (modelo + nome, todas as cores e volumes) nos últimos 30 dias fechados: caixas ÷ horas DISTINTAS em que ele rodou, dia a dia, média aparada (sem o melhor e o pior dia, com 3+ dias). Hora dividida com outro produto conta inteira, então sai um pouco mais lenta do que é. s/cx = 3.600 ÷ cx/h. **A linha entrega X%** = tempo medido rodando ÷ s/cx da linha. Sem produção na janela: "não rodou", nunca 0 | s/cx · cx/h · % | `v7:_ucvLinhaDe` |
| **UEP MÉDIA · PODE TROCAR** (⏱ CRONOANÁLISE → UEP, v7.158.0) | das medições REGISTRADAS do volume: Σ (segundos rodando ÷ segundos da base) × volumes medidos ÷ Σ volumes medidos. **Pode trocar** = soma de volumes ≥ 30 (`UCV_TROCA_MIN_VOL`, qualquer data) e TODAS do mesmo lado da faixa 90–110% contra o cadastro de agora. Medição sem VOLUMES MEDIDOS não entra. O `.gs` confere a mesma regra antes de gravar (`_cronoTrocaRegra`) | UEP/vol | `v7:_ucvRegsResumo` · `gs:_cronoTrocaRegra` |
| **% DO PADRÃO** (CONFERÊNCIA DAS TROCAS, v7.158.0) | nos dias DEPOIS da troca (hoje fora), só nas horas em que SÓ os códigos trocados rodaram: Σ caixas × UEP nova ÷ (Σ minutos × META UEP ÷ 527). Abaixo de 90%: ▲ SUBIR? (UEP baixa, ou paradas) · acima de 110%: ▼ DESCER? · menos de 2 h sozinho: AGUARDANDO. Nada é gravado | % | `v7:_ucvConfMontar` · `gs:getConferenciaCrono` |

⚠ **TAKT s/CX não é o TAKT IDEAL.** O TAKT IDEAL (aba PARADAS, GESTÃO DE
PERDAS) é horas produtivas × 3.600 ÷ DEMANDA IDEAL das configurações (caixas
por dia) — **um número para qualquer caixa** (`v7:_taktIdeal`). O TAKT s/CX
sai da META UEP e muda com o peso do produto. Os dois nomes não se misturam.

## Simulador de investimento

Fica na aba **💡 SIMULADOR**, com **filtro de datas próprio** — independente do da
GESTÃO DE PERDAS. O contexto de um mesmo período é compartilhado entre as duas
telas, então períodos iguais não geram busca nova.


| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **CUSTO DA PARADA** | horas recuperadas × custo-hora da linha | R$/mês | `v7:_pgSimulacao` |
| **ECONOMIA EM HE** | as mesmas horas × custo-hora × (1 + adicional), limitada à HE praticada | R$/mês | idem |
| **PAYBACK** | investimento ÷ economia em HE mensal | meses | idem |
| **ROI** | (economia em HE × 12 × anos − investimento) ÷ investimento × 100 | % | idem |
| **HORA EXTRA EVITÁVEL** | horas recuperadas ÷ HE do mês convertida em hora de linha | % | idem |
| **POTENCIAL DE RECEITA** | caixas recuperadas × ticket médio (opcional); ano = mês × 12 | R$/mês | idem |

⚠ **As três leituras em R$ não se somam.** O CUSTO DA PARADA é ociosidade de
folha já paga; a ECONOMIA EM HE é a única leitura de caixa e já contém aquela
hora dentro dela; o POTENCIAL DE RECEITA é o valor econômico da **capacidade**
recuperada — não é economia, não é lucro e não é faturamento garantido. **Payback
e ROI usam só a ECONOMIA EM HE.** Sem ticket médio informado, o potencial de
receita não é calculado — nenhum preço é arbitrado. O custo-hora é de
**uma hora de linha** (toda a equipe junta); a hora extra é digitada em
**homem-hora** por semana. Converter é obrigatório, e é para isso que existe o
campo PESSOAS NA EMBALAGEM.

**Mês típico:** 22 dias úteis. **Ano:** mês típico × 12.

**Onde cada um aparece:** o **mês** é o número grande do card (é ele que alimenta
o payback) e o **ano** tem linha própria logo abaixo — é o valor comparável ao
orçamento de um equipamento. Vale na tela (aba GESTÃO DE PERDAS) e na PROPOSTA DE
INVESTIMENTO em PDF, com os mesmos valores nos dois.
