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

## Gerencial do PC — a UEP na frente (v7.243.0)

PPCP, 13/11/2026: o veredito do dia no gerencial do PC passou a ser **um só, o
da UEP** (meta 2.761 = a META oficial). As caixas ficam na tela como fato, sem
cor. A TV e o celular ainda julgam em caixas (a seção abaixo vale para eles).

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **UEP DO DIA · META** (1º card, o único selo) | UEP de jornada × esperado até agora (`uepCard`); o selo é `slRitmo` do % do esperado | UEP | `v7:_gerUepCards` + `rp-core:uepCard` |
| **min atrás / à frente do ritmo** | (UEP feita − esperada) ÷ (meta ÷ 527) | min | `v7:_tvUepMontar` (`difMin`) |
| **⚠ ATRASO · LOTES VENCIDOS** | caixas de lotes vencidos × UEP do código ÷ (meta ÷ 527) — o mesmo do celular e da faixa da ⚖ UEP | h de linha | `rp-core:atrasoVencido` |
| **RITMO · UEP/HORA** | UEP de jornada ÷ minutos de jornada decorridos × 60 | UEP/h | `v7:_uepAbaProj` |
| **PROJEÇÃO · UEP** | UEP feita + a média por minuto × minutos de jornada que faltam (número, sem veredito) | UEP | `v7:_uepAbaProj` |
| **PARA A META** | meta − UEP feita; em caixas: ÷ UEP por caixa do produto de agora (para cima) | UEP / cx | `v7:_tvUepMontar` |
| **CAIXAS PROGRAMADAS** | a META DO DIA em caixas (a do FECHAR DIA); o % feito é fato, sem cor | cx | `v7:_gerCxCards` |
| **% DA META** (hora a hora) | UEP da hora ÷ (meta × minutos da hora ÷ 527) — a cor da linha | % | `v7:_gerHoraLinha` |
| **META EM CX** (hora a hora) | meta de UEP da hora × caixas com UEP ÷ UEP da hora (a hora de agora sem caixa: ÷ UEP por caixa do produto de agora) | cx | `v7:_gerHoraLinha` |
| **PICO / VALE** | a hora de jornada fechada com o maior / menor % da meta da hora | — | `v7:_gerAnaliseUep` |
| **RITMO NECESSÁRIO** | (meta − UEP feita) ÷ minutos de jornada que restam × 60 | UEP/h | `v7:_gerAnaliseUep` |

⚠ Sem a UEP no backend ou no cadastro, as caixas programadas voltam a dar o
selo — nunca uma tela sem veredito. No dia passado, o veredito é a UEP gravada
no fechamento contra a META UEP daquele dia; dia sem UEP gravada continua
julgado em caixas.

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
| **PONTOS** (do dia, do período, da semana da diretoria) | Σ da coluna PONTOS da PRODUCAO_PRODUTO = caixas × PONTOS do cadastro **na hora do lançamento** (o registrarProducaoProduto grava). Trocar a tabela de pontos muda só os lançamentos dali em diante — o passado fica congelado (.gs v5.40). Célula vazia no log → caixas × cadastro de agora. Pontos em HE = mesma soma nas horas fora de 07:00–17:00. A **carteira** (programação) segue caixas × cadastro de agora | pontos | `.gs:_ptsDoLog` · `.gs:getPontosDia` · `.gs:getProducaoModeloPeriodo` |
| **OSCILAÇÃO DAS TRÊS RÉGUAS** (🖨 CAIXAS × PONTOS × UEP, v7.184.0) | nos mesmos dias fechados dos últimos 30 (hoje fora), só a jornada: caixas = REALIZADO − HE CX; UEP = UEP gravada; pontos = na TABELA DE PONTOS DE HOJE (caixas × cadastro de agora, `.gs` v5.41 `?ptsCad=1`), menos os da HE — a mesma tabela da meta de pontos; sem o v5.41, os gravados e sem veredito em pontos. Oscilação = desvio-padrão ÷ média do dia a dia (`_qpOscilacao`). **DEPOIS DA TRAVA** = a mesma conta só nos dias depois de `UEP_TRAVADA_DESDE` (mín. 5). Gráfico: cada dia ÷ média da própria régua × 100 | % | `v7:_cxUepMontar` · `v7:_cxuPtsDoPeriodo` |
| **PONTOS POR UEP QUE A META PEDE** (⚖ UEP · RÉGUAS e ⚙, v7.187.0) | META DE PONTOS / DIA (⚙, `CONFIG_PAINEL` `META_PTS`) ÷ META DIA (UEP). Abaixo disso, nem a linha batendo a meta de UEP chega à meta de pontos | pontos/UEP | `v7:_regMontar` (`need`) · `v7:openCfg` |
| **MIX DO PERÍODO** (⚖ UEP · RÉGUAS) | Σ pontos ÷ Σ UEP de jornada, nos mesmos dias fechados das três réguas; pontos na tabela de HOJE (sem ela, não mede). *Batendo a meta de UEP* = META UEP × mix | pontos/UEP | `v7:_regMontar` (`mix.ppu`) |
| **PRODUTO A PRODUTO** (⚖ UEP · RÉGUAS) | *Batendo a meta de UEP* = ⌊META UEP ÷ UEP do produto⌋ (cortado no limite da esteira, ⚠) × pontos do produto; *limite da esteira* = produtos/dia na velocidade ÷ (caixa + vão) em 527 min, sem parada, × pontos. Situação contra a meta de pontos: CHEGA (na meta de UEP) · SÓ ACIMA DA META DE UEP (até o limite) · NÃO CHEGA NEM NO LIMITE · SEM LIMITE NO CADASTRO. `*` = vão padrão de 650 mm, não medido | produtos/dia · pontos/dia | `v7:_regMontar` · `v7:_capDia` · `v7:_capProdutos` |
| **ATINGIMENTO** (🖨 CAIXAS × PONTOS × UEP, resumo da pág. 1, v7.188.0) | Σ realizado ÷ Σ metas dos MESMOS dias das três réguas (nunca média de %): caixas contra a META do HISTÓRICO de cada dia, UEP contra a REFERÊNCIA gravada de cada dia, pontos contra a meta do ⚙ de hoje | % | `v7:_cxUepMontar` (`reguas.*.pctMeta`) |
| **DIAS NA META** (mesmo relatório e cartão da ⚖ UEP · RÉGUAS) | dias em que o realizado ≥ a meta (ou a referência) daquele dia — 100%, não a régua do selo da TV (96%) | dias | `v7:_cxUepMontar` (`reguas.*.diasMeta`) |
| **REFERÊNCIA DE UEP** (relatório e ⚖ UEP · RÉGUAS, v7.188.0) | a META UEP gravada no fechamento de cada dia (o campo META DIA (UEP) do ⚙). **Em avaliação: ainda não é a meta oficial da embalagem** (`UEP_REF_STATUS`). Cada dia é julgado contra a da sua data; o histórico sai em trechos (`refUep`) com o motivo de cada troca (`UEP_REF_MOTIVO`) | UEP | `v7:_cxUepMontar` · `v7:_cxuRefHtml` |
| **CAPACIDADE ESTIMADA × LIMITE FÍSICO × REALIZADO** (página 2 e ⚖ UEP · RÉGUAS) | capacidade estimada = ⌊referência de UEP ÷ UEP do produto⌋, o produto sozinho na linha o dia inteiro; limite físico = velocidade ÷ (caixa + vão) em 527 min, sem parada; realizado = caixas do produto no período. Nenhum dos dois primeiros é produção garantida | produtos/dia · cx | `v7:_capDia` · `v7:_regMontar` |
| **UEP / DIA (JORNADA)** (HISTÓRICO) | média da coluna UEP do HISTORICO nos **dias úteis** com UEP (sábado e domingo ficam fora da média — v7.222.0); bateu = UEP ≥ META UEP daquele dia, fim de semana incluído (a META UEP dele é a das horas trabalhadas, `.gs` v5.60; META UEP 0 = só hora extra, não é julgado) | UEP | `rp-core:uepHistResumo` |
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
| **MÉDIA POR DIA** (período) | Σ UEP de jornada gravada nos **dias úteis** fechados com UEP ÷ nº desses dias (o fim de semana entra no % e no bateu, não na média — v7.222.0); % = Σ UEP ÷ Σ META UEP de todos os dias com UEP | UEP | `rp-core:uepHistResumo` + `v7:_uepAbaPeriodo` |
| **DIAS QUE BATERAM** (período) | dias com UEP ≥ META UEP daquele dia | dias | `rp-core:uepHistResumo` |
| **OSCILAÇÃO DIA A DIA** (período) | desvio padrão ÷ média, dia a dia, em UEP e em caixas de jornada (realizado − HE) dos mesmos dias | % | `v7:_qpOscilacao` + `v7:_uepAbaPeriodo` |
| **UEP PADRÃO** (bloco 7) | a UEP por caixa do código **vigente na data**: a última versão da aba `UEP_VERSOES` com vigência ≤ dia; sem a aba, o cadastro de hoje. A semente (1ª mudança) é o cadastro como estava, valendo desde sempre | UEP/cx | `.gs:_uepVigente` + `.gs:getProducaoModeloPeriodo` (`?uepVer=1`) |
| **UEP/CX** (linha do produto, bloco 7) | UEP do cadastro de **hoje**, média pelas caixas do produto no período (o `uepProd` da leitura — a mesma UEP/CX do comparativo por modelo). Sem UEP hoje: "—", nunca a do último dia. Embaixo, **"% com X"** quando a UEP de hoje difere em 1% ou mais da que valeu no período (mesmas caixas): X = Σ UEP ÷ Σ caixas dos dias julgados, a UEP com que o % foi feito | UEP/cx | `v7:_uepPadHist` (`uepCx`, `uepJul`) |
| **CX/H PADRÃO** (bloco 7) | ritmo da meta ÷ UEP por caixa. **Linha do produto**: (META UEP de hoje — a do ⚙ — ÷ 527 × 60) ÷ UEP/CX de hoje, a mesma régua em todas as linhas. **Dia a dia**: (META UEP do dia ÷ 527 × 60) ÷ (UEP do dia ÷ caixas do produto) | cx/h | `v7:_uepPadHist` |
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

## Aba ⚖ UEP · cartão ATRASO (v7.227.0)

| Indicador | Fórmula | Unidade | Onde |
|---|---|---|---|
| **ATRASO** (cartão na faixa das sub-abas) | o total do quadro ATRASO — CONFERÊNCIA (PRÓXIMOS DIAS): **horas** = Σ (atraso do código × UEP/cx da programação) ÷ (META UEP ÷ 527), em minuto inteiro — o `conta.venc` do `_gpxMontar`; **caixas** = Σ atraso por código (o `atraso` do `calcularProgramacao`: saldo dos lotes com data ANTES de hoje, FIFO por código; linha com X fora); **desde** = o `atrasoDesde` mais antigo. Código sem UEP: só nas caixas, e as horas levam `*`; menos de 1 min com UEP → *menos de 1 min* (v7.228.0). O programado de hoje não entra. Vermelho com atraso; *nada vencido* em verde | h:min · cx | `v7:_uepSubAtr` · `v7:_gpxAtrasoMontar` · `v7:_gpxMontar` |
| **⚠ ATRASO · LOTES VENCIDOS** (gerencial do celular, 1.43.0 — o 1º card, largura toda, vermelho) | o MESMO número do cartão ATRASO acima: **horas** = Σ (atraso do código × UEP/cx do **cadastro**) ÷ (META UEP ÷ 527), minuto inteiro; **caixas** = Σ atraso por código; **desde** = o `atrasoDesde` mais antigo. Código casado pelos dígitos; sem UEP: só nas caixas e `*` nas horas; sem UEP nenhuma ou `.gs` sem o atraso por código → só as caixas; menos de 1 min com UEP → *<1 min*. Cadastro relido a cada 30 min e no ATUALIZAR. Sem atraso, sem card | h:min · cx | `rp-core:atrasoVencido` · `mobile:renderGerencial` |

## Aba ⚖ UEP · TAKT DA SEMANA (v7.209.0)

> Desde a v7.232.0 a tela não mostra mais os cartões em s por UEP (TAKT,
> REFERÊNCIA, EXECUTADO, FALTA DA SEMANA) nem a cascata: o TAKT contra a
> REFERÊNCIA e o EXECUTADO em % ficam no *title* do recado do DIA A DIA, e a
> CARGA e o GAP DE RITMO viram os % do recado (*do que não saiu: X% excesso de
> programação · Y% ritmo da linha*). As fórmulas abaixo continuam valendo.

Três números na mesma unidade, **segundos por UEP** (menor = mais rápido), **sem
o setup** (v7.225.0): os minutos de jornada menos o **setup do grupo**, o
mesmo do app de cronoanálise: **TROCAS/DIA × MIN/TROCA do ⚙** (CONFIG_PAINEL
`SETUPS_DIA`/`SETUP_MIN`, `.gs` v5.61, v7.226.0 — digitados também no app; sem
eles, o padrão 8 × 8 = 64 min por dia → 463 min; `_taktSetup`). No domínio do
app: trocas por dia inteiras (0–100) e minutos com uma casa (0–600), o setup do
dia abaixo de 527 (`_setupLer`/`_setupErro` no painel, `_cfgSetup` no `.gs`).
Setup médio medido em 13/10–10/11/2026: 4,3 × 7,65 = 32,9 min/dia, digitado como
4 × 8,2 = 32,8. O setup sai dos dois
lados da comparação, então os % e as horas de linha não mudam. A semana é a de hoje, segunda a domingo, lida pelo `getProgramacaoSemana` (`.gs`
v5.59: as duas abas da programação pela data de cada lote). Dia útil = segunda
a sexta fora dos feriados da aba FERIADOS.

| Indicador | Fórmula | Unidade | Onde |
|---|---|---|---|
| **TAKT** (o que a programação pede) | dias úteis × (527 − setup/dia do ⚙) × 60 ÷ UEP programada na semana (Σ caixas × UEP do cadastro de hoje; fora da esteira de fora; código sem UEP fica fora e é dito). UEP/dia = UEP programada ÷ dias úteis; % = UEP/dia ÷ META DIA (UEP). Lote em sábado, domingo ou feriado entra na UEP, não nos dias úteis | s/UEP | `v7:_taktMontar` |
| **REFERÊNCIA** | (527 − setup/dia do ⚙) × 60 ÷ META DIA (UEP) do ⚙ — a mesma *referência de UEP* da RÉGUAS | s/UEP | `v7:_taktMontar` (`ref`) |
| **VOLUMES DA SEMANA** (faixa NA LINHA E NO APP, *para o app de cronoanálise*, v7.224.0; depois do gráfico desde a v7.232.0) | Σ caixas programadas na semana (as duas abas da programação, fora da esteira de fora — as mesmas linhas do TAKT; volume = caixa). Na AVALIAR: Σ produtos colados × nº de volumes de cada produto no cadastro (produto fora do cadastro não conta). **takt no app** (v7.225.0) = a conta do app de cronoanálise, por semana: dias com volume (no máximo 5) × (44 h ÷ 5 − TROCAS/DIA × MIN/TROCA do ⚙) × 60 ÷ volumes — o mesmo número da tabela PROGRAMA GRAVADO do app (8h48 por dia, não 8h47) | volumes · s | `v7:_taktFaixa` · `v7:_taktApp` · `v7:_tkaVolumes` |
| **EXECUTADO NA SEMANA** | minutos de jornada (527 por dia útil fechado com UEP no HISTORICO; hoje, os minutos de jornada com lançamento) × (527 − setup/dia) ÷ 527 (o setup na mesma proporção) × 60 ÷ UEP de jornada feita nesses dias. % = UEP feita ÷ Σ (META UEP do dia × minutos ÷ 527). Hora extra e dia não útil à parte (*+ X UEP em hora extra*) | s/UEP · % | `v7:_taktMontar` (`exec`) |
| **CARGA ACIMA DA REFERÊNCIA** | por dia útil fechado: (pedido − feito) − ritmo, onde pedido = UEP programada do dia. É o que o dia pediu além da referência (ou além do feito, quando a linha passou dela): decisão do PCP (re-datar ou hora extra). Soma dos dias | UEP | `v7:_taktMontar` (`cas`) |
| **GAP DE RITMO** | por dia útil fechado: máx(0, mín(pedido, META UEP do dia) − feito) — o que faltou para a referência **com trabalho programado**. Dia que pediu menos que a referência não cobra a folga (a linha não tinha o trabalho). Soma dos dias. Fecha: pedido − carga − ritmo + adiantou = feito | UEP | `v7:_taktMontar` (`cas`) |
| **ADIANTOU** | por dia útil fechado: máx(0, feito − pedido) | UEP | `v7:_taktMontar` (`cas`) |
| **FALTA DA SEMANA** | Σ saldo de cada lote da semana × UEP do código (o saldo do `.gs`: o da planilha só quando PRODUZIDO + SALDO = QTDE; concluída e fora da esteira 0; linha sem saldo confiável fica fora e é dita). *De dias que já passaram* = a parte dos lotes com data antes de hoje | UEP | `v7:_taktMontar` (`falta`) |
| **CABEM** | minutos de jornada que faltam hoje (a hora em andamento só o resto; hora extra fora) × META UEP ÷ 527 + dias úteis que vêm × META UEP. *Faltam* = falta − cabem | UEP | `v7:_taktRestMin` · `v7:_taktMontar` |
| **AVALIAR PROGRAMAÇÃO** (TAKT, v7.213.0) | a programação colada da planilha: por linha, QTDE (produtos) × UEP do produto (soma dos volumes no cadastro de hoje, cor mais rápida), no dia da PREV EMB; depois a mesma conta da SEMANA QUE VEM (precisa × tem, dias acima, redistribuir). Produto fora do cadastro: listado, fora da conta | h:min · UEP | `v7:_tkaLer` · `v7:_tkaMontar` |
| **TAKT POR CAIXA** (TAKT DA SEMANA → faixa, TAKT POR PRODUTO, v7.217.0; na faixa desde a v7.224.0) | por produto · volume programado na semana (as cores juntas): **pelo takt** = takt da semana (s por UEP) × UEP por caixa (média das cores pesada pelas caixas) — o ritmo que o produto precisa, sem o setup, para a semana fechar; **tempo-alvo** (desde a v7.235.0 / `.gs` v5.65; era referência × UEP por caixa) = a esteira do produto ÷ a EFICIÊNCIA DA EMBALAGEM do ⚙ (`EFICIENCIA_EMB`, padrão 85%); esteira = (medida da caixa + entre-peças, mm) ÷ velocidade (m/min), por código na PRODUTO_CODIGO, pesada pelas caixas — o tempo de cada caixa com o produto rodando, o mesmo que julga cada volume no app de cronoanálise (`getTemposAlvo`; lá a esteira é a média simples das cores, aqui pesada pelas caixas). Código sem medida ou velocidade: sem tempo-alvo. O **cx/h** embaixo do PELO TAKT é por hora de RELÓGIO (3.600 × (527 − setup/dia)/527 ÷ pelo takt — o setup na média), o que se confere no HORA A HORA; o do TEMPO-ALVO é com o produto rodando (3.600 ÷ tempo-alvo). Os dois não se comparam: o takt é na média do dia. A última hora do AGORA também sai sem o setup (os minutos dela × (527 − setup/dia)/527): uma hora na meta dá a referência × UEP por caixa (até a v7.234.0, o tempo-alvo). Na AVALIAR PROGRAMAÇÃO (colagem), a esteira de cada volume vem do cadastro (`estVols` do `_capProdutos`, a cor mais rápida, como a UEP). Não é o takt do app de cronoanálise, que é por VOLUME (todo volume igual) | s/cx · cx/h | `v7:_taktPorCaixa` |
| **SALDO DE HORAS** (AVALIAR, v7.214.0) | de hoje ao último dia colado, dia a dia: atraso = máx(0, atraso de ontem + demanda − capacidade), em horas de linha. Demanda = saldo dos lotes do painel (vencido hoje) + linhas novas da colagem (não soma a que tem Nº LOTE SIST. já no painel, nem o mesmo produto no mesmo dia); capacidade = resto da jornada de hoje e 8h47 por dia útil (sem hora extra); dia útil sem programação nenhuma fica fora. *Chega com* = o atraso antes do 1º dia colado. **No ritmo atual** (v7.219.0) = em horas do relógio com a linha no ritmo desta semana: máx(0, atraso de ontem + demanda ÷ ritmo − capacidade) — a régua do *no ritmo atual: faltam* do veredito, então chegada + esse *faltam* = o fim. O atraso do **fim** sai também em dias (v7.220.0): horas ÷ 8h47, uma casa. A linha **colagem inteira** (v7.221.0) repete o PRECISA, o TEM e a falta do veredito da colagem (as semanas a partem pelo calendário) | h:min | `v7:_tkaCorrente` |
| **FALTA · SOBRA** (TAKT e planilha, v7.214.2) | *falta* = precisa − tem, quando a programação passa da jornada → NÃO CABE; *sobra* = tem − precisa → CABE. Sempre por extenso (*falta 2h13*, *sobra 1h30*), nunca com sinal. A sobra não vira crédito para a semana seguinte: só abate atraso que já existe | h:min de linha | `v7:_tkaSaldoHtml` · `v7:_taktHeroHtml` |
| **AGORA · PELO TAKT / TEMPO-ALVO** (era PELA REFERÊNCIA até a v7.230.0) | pelo takt: o takt × UEP por caixa do código que está rodando (cadastro; sem ele, a média de hoje do produto e da cor); tempo-alvo (v7.235.0): a esteira do código ÷ a eficiência da embalagem — 1 caixa a cada X s | s/cx | `v7:_taktAgora` |
| **HORA DE LINHA** (TAKT DA SEMANA, v7.211.0 — a unidade da tela e da 🖨) | UEP × 527 ÷ META DIA (UEP): o trabalho em horas de jornada no ritmo de referência; **1 dia de linha = 8h47** | h:min | `v7:_taktVeredito` · `v7:_taktSvg` |
| **MÉDIA DA LINHA ENTREGUE SEM HORA EXTRA** (TAKT, v7.212.0) | o mesmo número da *referência de UEP* (META DIA (UEP) do ⚙), com o nome que a frente do TAKT e a folha da diretoria usam; *ritmo atual* = em % dela | UEP/dia | `v7:_taktHeroHtml` |
| **FALTA EM PONTOS** (TAKT, v7.212.0) | falta em UEP (sem arredondar) × Σ pontos ÷ Σ UEP do saldo da semana (só linhas com UEP e pontos no cadastro). ≈, à centena; a UEP não tem valor fixo em pontos (depende do produto) | pontos | `v7:_taktVeredito` (`faltaPts`) · `v7:_tkPts` |
| **VEREDITO** (NÃO CABE / CABE · NÃO FECHA / FECHA) | **precisa** − **tem**, em horas de linha. Esta semana: precisa = saldo dos lotes; tem = resto da jornada de hoje + dias úteis que vêm (sem hora extra). Semana que vem: precisa = saldo dos dias úteis; tem = dias úteis × 8h47 (= o PRÓXIMOS DIAS). *Ritmo atual*: o mesmo com a UEP/dia que a linha fez nesta semana. *Somando o que não fechar desta semana*: falta da semana que vem + falta desta (o PRÓXIMOS DIAS não soma). *Caixas*: falta em UEP ÷ UEP/cx do saldo com UEP | h:min · cx | `v7:_taktVeredito` · `v7:_taktHeroHtml` |
| **SEMANA QUE VEM · A SEMANA × A JORNADA** (v7.210.0) | Σ saldo dos lotes dos dias úteis da semana seguinte (UEP do cadastro) × 527 ÷ META UEP, arredondado, − 527 × dias úteis — a MESMA conta do PRÓXIMOS DIAS. Positivo = além da jornada | h:min | `v7:_taktProxMontar` (`saldoMin`) |
| **DIAS ACIMA DA REFERÊNCIA** (semana que vem) | dias úteis com saldo > META UEP; *redistribuir na semana absorve* mín(Σ acima, Σ folga dos outros dias úteis) | dias · UEP | `v7:_taktProxMontar` |
| **SIMULAÇÃO** (semana que vem e 🖨) | por cenário — referência (META UEP), ritmo desta semana (UEP de jornada ÷ minutos de jornada × 527) e média do PERÍODO: cabem = dias úteis × UEP/dia; falta = saldo − cabem; **hora extra** = falta × 527 ÷ UEP/dia (no ritmo do cenário); **re-datar** = falta ÷ (Σ saldo UEP ÷ Σ saldo cx) | UEP · h:min · cx | `v7:_taktCenarios` · `v7:_taktSimular` |
| **AGORA · ÚLTIMA HORA** | a última hora de jornada fechada: só desse produto e cor = minutos × 60 ÷ caixas da hora; com outro produto ou cor = (minutos × 60 ÷ UEP da hora) × UEP por caixa do produto de agora. Cor = a da hora no HORA A HORA | s/cx | `v7:_taktAgora` |

## Gerencial — PRODUTOS EMBALADOS HOJE (mobile 1.39.0 · PC v7.201.0)

Tudo sai do `getPontosDia` que o gerencial já lê (`porHoraModelo` e `porHora`);
nenhuma leitura nova. Produto não ganha veredito (nem cor de status, nem cx/h).
A conta é UMA para o celular e o PC (`rp-core:pdiaMontar`); o desenho é de cada
painel (`mobile:_pdiaHtml`, `v7:_pdiaPcHtml`). A **parte da UEP do dia** inclui a
hora extra — o **MIX DE HOJE** da aba ⚖ UEP é só da jornada, então os dois % são
diferentes num dia com HE.

| Indicador | Fórmula | Unidade | Onde |
|---|---|---|---|
| **CAIXAS / UEP** (resumo) | Σ caixas lançadas com produto hoje · Σ UEP das mesmas caixas (UEP do cadastro de hoje, a do `porHoraModelo`) | cx · UEP | `rp-core:pdiaMontar` |
| **TROCAS DE PRODUTO** | quantas vezes o produto muda na sequência do dia (log na ordem da hora). Dentro da mesma hora cada produto conta uma vez (A,B,A,B = 1 troca), e o produto que vinha da hora anterior abre a hora seguinte. Troca de cor não entra | trocas | `rp-core:pdiaMontar` |
| **COBERTURA** (linha da faixa) | caixas com produto contra a PRODUÇÃO REAL da HORA_A_HORA; a diferença é "fora da lista". Diz de que horas é a lista (`lidoEm` no celular, `PONTOS_DIA_TS` no PC) | cx | `mobile:_pdiaHtml` · `v7:_pdiaPcHtml` |
| **FAIXA DA SEQUÊNCIA** | cada hora da planilha repartida pelas caixas de cada produto, na ordem em que entraram; a hora em andamento só até agora. A planilha não guarda o minuto da troca: o ponto dentro da hora é aproximado | — | `rp-core:pdiaMontar` |
| **HORÁRIO** (linha do produto) | início da 1ª hora em que teve caixa → fim da última hora (a hora acaba na próxima hora cheia: 12:12 → 13:00); o produto de agora diz "desde" | hh:mm | `rp-core:pdiaMontar` |
| **EM HE** | caixas do produto lançadas fora de 07:00–17:00 (a janela do `_ehHoraExtraCaixas`) | cx | `rp-core:pdiaMontar` |
| **% (barra)** | UEP do produto ÷ UEP do dia; produto sem UEP → "—", nunca 0 | % | `rp-core:pdiaMontar` |
| **POR COR E VOLUME** (detalhe) | caixas do log por cor × volume, só com 2+ volumes embalados hoje | cx | `rp-core:pdiaMontar` |
| **PARADAS** (faixa fina abaixo da sequência, PC v7.236.0 · celular 1.49.0) | cada parada de hoje da aba PARADAS (`getParadas`) no mesmo eixo de tempo: não programada em vermelho, programada (coluna CLASSE da `TIPOS_PARADA`, `ehPlanejada`) em cinza, aberta listrada até agora. O almoço sai da marca. Total = nº de paradas **encerradas** e Σ `durProdutiva` (fora do almoço) — o mesmo **TEMPO TOTAL PARADO** da aba PARADAS em HOJE; entre parênteses, só as não programadas. A aberta fica fora do total (sem FIM não há duração) e aparece à parte, até agora. Sem perda em caixas aqui | paradas · min | `rp-core:pdiaParMontar` |

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
| **TAKT s/CX** (fila e bloco 7) | 527 min × 60 ÷ META UEP × UEP/cx do produto (= 3.600 ÷ CX/H PADRÃO). Com a meta de 2.530 (base MADERO): 12,5 s por UEP — 1 caixa de MADERO (1,00) = 12,5 s, um volume de 1,84 = 23,0 s. Na fila, um por volume, com a META UEP do ⚙; no bloco 7, a linha do produto com a META do ⚙ e a UEP de hoje, o dia a dia com a META gravada em cada dia | s/cx | `v7:_taktUep` |
| **s/CX REAL** (dia a dia do bloco 7) | minutos do produto no dia × 60 ÷ caixas, com a hora de troca repartida pelo tempo padrão — acima do TAKT s/CX = mais lento que a meta pede | s/cx | `v7:_uepPadHist` |
| **UEP EQUIVALENTE** (⏱ CRONOANÁLISE → UEP) | segundos por volume medidos ÷ segundos da base por volume, os dois **SEM AS LACUNAS** (v7.200.0; até a v7.199, com a linha rodando). Base padrão (campo vazio) = a MADERO cronometrada sem as lacunas, **6,7 s** (20/10/2026, 60 volumes, `UEP_BASE_MEDIDA.seg`; rodando ela deu 7,9 s), e o produto também sem as lacunas — parada marcada e lacuna (parada que ninguém marcou) são perda da linha, não esforço do produto. A tolerância (15%) entra nos dois tempos padrão e se cancela na UEP. Outro tempo digitado vale só naquele computador (aviso). 12,5 digitado = a régua da meta (527 min × 60 ÷ META UEP), e aí o tempo medido é o NO PERÍODO (paradas dentro). Base mais lenta que a régua da meta = suspeita (aviso). Produto de N volumes: jogo = UEP equivalente × N | UEP/vol | `v7:_uepConvMontar` |
| **DIFERENÇA** (⏱ CRONOANÁLISE → UEP) | UEP equivalente ÷ UEP média por volume do cadastro − 1. CONFERE dentro de 90–110% (`UEP_PAD_FAIXA`, a faixa do NO PADRÃO do bloco 7). Sem UEP no cadastro: "—", nunca 0% | % | `v7:_uepConvMontar` |
| **NA PRODUÇÃO** (⏱ CRONOANÁLISE → UEP e CONFERÊNCIA DAS TROCAS, v7.161.0; era **A LINHA FAZ** em s/cx e, na v7.160.0, o % do padrão com as paradas dentro) | nos últimos 30 dias fechados (hoje fora), só nas horas em que SÓ os códigos do volume rodaram (hora com outro produto ou outro volume fica fora), **sem as paradas apontadas**: [Σ caixas × UEP ÷ ((Σ minutos − minutos parados) × META UEP ÷ 527)] do volume ÷ a mesma conta da MADERO (UEP 1,00) nas mesmas condições. 100% = rendeu o mesmo que a base; 90–110% a produção confirma a UEP. No cartão, com a UEP medida (duas casas) e com a do cadastro; na lista, com a UEP de cada medição; na conferência, com a UEP nova, só depois da troca. Menos de 2 h sem parada: pouco para julgar (`*`) / AGUARDANDO. A base não rodou sozinha: "—". As paradas não entram: vão à parte | % | `v7:_ucvPadraoDe` · `v7:_ucvRel` · `gs:getHorasCrono` |
| **VERSÃO DO CADASTRO** (lista de medições da ⏱ CRONOANÁLISE, v7.163.0; era CADASTRO) | a UEP do cadastro com que a medição foi comparada — a que estava em vigor quando ela entrou no painel (UEP_CADASTRO da aba CRONOANALISE). **em vigor** = igual ao cadastro de hoje do volume (duas casas); **anterior** = o cadastro mudou depois (o valor novo está na coluna TROCA). Volume fora do cadastro: sem a palavra | UEP/vol | `v7:_ucvRegsStatus` (vigor) |
| **TROCA** (lista de medições da ⏱ CRONOANÁLISE, v7.162.0) | UEP da medição ÷ UEP do cadastro que ela viu (coluna VERSÃO DO CADASTRO) − 1. Dentro de 90–110% (`UEP_PAD_FAIXA`): **NÃO TROCA**; fora: **FORA DA FAIXA** (a troca é a regra do volume, a média das válidas — `_ucvRegraUep`, e o PPCP). **NÃO VALE** (v7.233.0): menos de 30 volumes ou lacunas acima de 15% — não entra na regra, com o porquê. **TROCADA**: o volume tem troca pela cronoanálise (getConferenciaCrono) cujo "antes" é o cadastro desta medição — mostra data e antes → depois. A base: **BASE** | % · etiqueta | `v7:_ucvRegsStatus` |
| **UEP TRAVADA** (⏱ CRONOANÁLISE → TRAVA DA UEP, v7.233.0 / .gs v5.64) | o PPCP, com a regra cumprida, troca para a média (ou mantém a do cadastro) e trava — com o código dele (Propriedades do script `PPCP_CODIGO`). Fica na coluna `UEP_TRAVA` da PRODUTO_CODIGO (`dd/MM/yyyy PPCP`) e na aba `UEP_TRAVAS` (decisão, contra a regra, medições, volumes, motivo). Travada: medição nova é registrada e só informa (DEPOIS DA TRAVA: média e diferença contra a travada); o GRAVAR UEP pula o código; digitar UMA célula na planilha é desfeito. Só o PPCP destrava, com motivo. **A UEP MUDOU NA PLANILHA**: o cadastro ≠ a travada (colagem de várias células) | UEP/vol | `v7:_ucvTravaDe` · `v7:_ucvTravaMontar` · `gs:travarUep` · `gs:destravarUep` · `gs:_travaDesfazEdicao` |
| **PERDA EM PARADAS** (cartão NA PRODUÇÃO e conferência) | minutos das paradas apontadas (aba PARADAS) que caem dentro das horas contadas, por tipo, ÷ minutos dessas horas. Parada que atravessa a hora é dividida; sobrepostas não passam da hora; sem FIM fica fora | min · % | `gs:_cronoParadasNasHoras` · `v7:_ucvPadraoDe` |
| **UEP MEDIDA · A REGRA DA UEP** (⏱ CRONOANÁLISE → TRAVA DA UEP, v7.233.0; antes UEP MÉDIA · PODE TROCAR, v7.158.0) | **A medição vale** com 30 volumes ou mais (`UCV_MED_MIN_VOL`) e lacunas até 15% do tempo rodando (`UCV_MED_MAX_LAC`; lacunas = 1 − SEM AS LACUNAS ÷ RODANDO, uma casa). UEP medida = Σ (segundos SEM AS LACUNAS ÷ 6,7 s da MADERO) × volumes ÷ Σ volumes, **só das válidas**. **A regra se cumpre** com 2 válidas ou mais (`UCV_REGRA_MIN_MED`) somando 100 volumes (`UCV_REGRA_MIN_VOL`). Cumprida: dentro de 90–110% do cadastro de agora a regra diz **FICA**; fora (ou sem UEP no cadastro), **TROCA** para a média. **NA BORDA**: a diferença a até 2 pontos do limite (8–12%). Quem decide e trava é o PPCP (código conferido pelo Apps Script). O `.gs` confere a mesma regra antes de gravar (`_cronoRegraUep`) | UEP/vol | `v7:_ucvRegraUep` · `v7:_ucvMedValida` · `gs:_cronoRegraUep` |
| **PRODUTOS / DIA** (🖨 CAPACIDADE DE CADA PRODUTO — modal 🧮 da PROGRAMAÇÃO e, desde a v7.164.0, 🖨 CAPACIDADE POR PRODUTO da ⏱ CRONOANÁLISE) | META UEP ÷ UEP do produto completo (soma dos volumes; entre as cores, a menor UEP), para baixo; se passar do que a esteira passa em 527 min (velocidade × 60.000 ÷ (medida + entre-peças), somando os volumes), vale o limite e a linha sai marcada. Da cronoanálise: a META UEP do ⚙ e a velocidade do cadastro; do modal: o que está digitado nele | produtos/dia | `v7:_capDia` · `v7:_capProdutos` |
| **PRODUTOS / MÊS** (a mesma impressão, v7.164.0) | PRODUTOS / DIA × 22 dias úteis (`CAP_DIAS_MES`, o mês típico do simulador e da SWOT; foi 21 só na v7.164.0) — sem sábado e sem hora extra, cada produto sozinho na linha o mês inteiro | produtos/mês | `v7:gerarRelatorioCapTodos` |
| **JORNADA SIMULADA** (🖨 CAPACIDADE POR PRODUTO da ⏱ CRONOANÁLISE, v7.165.0) | jornada = 527 − minutos a menos; a linha mantém o ritmo de hoje: meta do dia = META UEP × jornada ÷ 527 (arredondada); produtos/dia, caixas, produtos/hora, limite da esteira (nos minutos que sobram) e pontos refeitos com ela. **PRODUTOS A MENOS / MÊS** = (produtos/dia na jornada de hoje − na simulada) × 22; **/ ANO** (v7.167.0) = o do mês × 12. **A MENOS POR DIA · MÊS · ANO** (cartões, v7.167.0) = UEP/dia a menos × 1 · 22 · 264 e minutos a menos × 1 · 22 · 264. Caixas/dia e pontos/dia caem no mesmo % da linha. **% PERDA** (v7.166.0) = produtos/dia a menos ÷ produtos/dia de hoje; o cartão **PERDA DE CAPACIDADE** = minutos a menos ÷ 527. **Fim do turno** se o corte for no fim = fim do turno do ⚙ − minutos (17:00 − 24 = 16:36). **PARA MANTER** = META UEP ÷ jornada × 60 (UEP/h). **PERDA FIXA** (v7.170.0, opcional) = minutos/dia que não diminuem com a jornada (café, troca de produto, limpeza): com ela, os minutos cortados saem todos do tempo de produzir — PERDA DE CAPACIDADE = minutos a menos ÷ (527 − fixa), meta = META UEP × (jornada − fixa) ÷ (527 − fixa), PARA MANTER = META UEP ÷ (jornada − fixa) × 60; na PROGRAMAÇÃO × CAPACIDADE a simulada vale 527 × (jornada − fixa) ÷ (527 − fixa) min. **MOTIVOS DA PERDA FIXA** (v7.171.0, no papel) = min/dia de cada tipo de parada fixo (troca de produto e de cor, café, limpeza, reunião, finalização de lote, aniversariantes — `CAP_FIXA_RE`) ÷ dias trabalhados dos últimos 30 dias (a régua da GESTÃO DE PERDAS); **sem apontamento** = perda fixa digitada − soma apontada. O **LIMITE ESTEIRA** é em PRODUTOS/dia (× volumes = caixas), nos minutos da jornada. Até 240 min; nada é gravado | min · UEP · produtos/mês | `v7:_capJornada` · `v7:_capDia` · `v7:_capProgMontar` · `v7:_capFixaMontar` |
| **PROGRAMAÇÃO × CAPACIDADE** (🖨 PROGRAMAÇÃO × CAPACIDADE, no diálogo da 🖨 CAPACIDADE POR PRODUTO, v7.168.0) | por dia útil com lote: **tempo necessário** = UEP programada do dia (lotes datados no dia, já adiantado fora, linha sem UEP fora) ÷ (META UEP ÷ 527) — a carga do PRÓXIMOS DIAS (`_gpxMontar`), em minuto inteiro; **capacidade** = minutos da jornada (527, ou a simulada); **saldo** = capacidade − tempo; **ocupação** = tempo ÷ capacidade. **Situação** (a régua do PRÓXIMOS DIAS, `_gpxEstado`): COM FOLGA (saldo ≥ 3h) · DENTRO · ACIMA ATÉ 1h45 · ACIMA. **Período** = somas dos dias úteis com lote (dia sem lote, sábado e dia só sem UEP fora). **Lotes na ORDEM do dia** (coluna ORDEM, `.gs` v5.37): acumulado; CABE (acumulado ≤ jornada) · PARCIAL (cabem jornada − início de tempo do lote) · FICA DE FORA (começa depois da jornada) · INCERTO (há linha sem UEP antes ou nele) | min · % | `v7:_capProgMontar` · `v7:_gpxMontar` · `v7:gerarRelatorioCapProg` |
| **PONTOS NA JORNADA** (🖨 PROGRAMAÇÃO × CAPACIDADE, v7.169.0) | dia que cabe na jornada = pontos programados (caixas × PONTOS do cadastro, só linhas com UEP); dia acima = pontos dos lotes que CABEM na ordem do dia + o lote PARCIAL × (minutos que cabem ÷ minutos do lote); sem a ordem, com lote INCERTO ou linha sem pontos = "—". **% da meta** = pontos na jornada ÷ META DE PONTOS / DIA (digitada no diálogo, sem hora extra, guardada só no computador). **Pontos por UEP**: programação = pontos ÷ UEP programada; **a meta pede** = meta de pontos ÷ meta de UEP da jornada | pontos · % · pontos/UEP | `v7:_capProgMontar` |
| **% DO PADRÃO** (CONFERÊNCIA DAS TROCAS, v7.158.0) | nos dias DEPOIS da troca (hoje fora), só nas horas em que SÓ os códigos trocados rodaram: Σ caixas × UEP nova ÷ (Σ minutos × META UEP ÷ 527). Abaixo de 90%: ▲ SUBIR? (UEP baixa, ou paradas) · acima de 110%: ▼ DESCER? · menos de 2 h sozinho: AGUARDANDO. Nada é gravado | % | `v7:_ucvConfMontar` · `gs:getConferenciaCrono` |
| **O QUE MEDIR · A AGENDA** (⏱ CRONOANÁLISE, v7.216.0) | todo volume que falta medir: primeiro o que está na programação (hoje e atraso, depois a data; de qualquer classe, inclusive o que não rodou nos 30 dias), depois o que rodou e não está programado (suspeita e peso). Medido = a base, travada pelo PPCP, UEP trocada ou a regra cumprida com a UEP que FICA (v7.233.0; cumprida com TROCA sai como PPCP DECIDE). Fora da agenda: o que nem rodou nem está programado (só contado). A 🖨 AGENDA DA CRONOANÁLISE imprime a mesma lista | — | `v7:_ucvPrincipais` · `v7:_ucvAgendaDocHtml` |
| **CLASSE A** (⏱ CRONOANÁLISE, v7.216.0 — era "principais") | os volumes que somam 80% da UEP de jornada da janela: a régua para rever a referência de UEP (quando todos estiverem medidos) | — | `v7:_ucvPrincipais` (`g.principal`) |
| **PRINCIPAIS PARA ANÁLISE DE TEMPO** (⏱ CRONOANÁLISE → UEP, v7.189.0; desde a v7.216.0 é a classe A dentro da AGENDA) | os VOLUMES (produto de N volumes entra por volume) ordenados pela UEP de jornada dos últimos 30 dias fechados (hoje fora; caixas × UEP do cadastro de hoje; hora extra fora); principais = os que entram até cruzar 80% do total (`UCV_PRINC_PCT`, o que cruza entra). Código sem UEP ou fora do cadastro fica fora, contado | — | `v7:_ucvPrincipais` · `gs:getHorasCrono` |
| **COBERTURA DA CRONOANÁLISE** (mesmo bloco, v7.189.0; v7.233.0) | UEP da janela em volume **medido** ÷ UEP da janela. Medido = a base (MADERO) · **travada pelo PPCP** (coluna UEP_TRAVA do cadastro) · UEP trocada (vigência DIGITADA em todos os códigos do volume) · a regra cumprida com a UEP que **FICA**. Regra cumprida com **TROCA** (PPCP DECIDE) e MEDINDO não contam: o cadastro segue o antigo até o PPCP trocar e travar. Medições não lidas: sem número (nunca 0%) | % | `v7:_ucvPrincipais` · `v7:_ucvPrincEstado` |
| **ORDEM DO QUE FALTA MEDIR** (mesmo bloco, v7.190.0; v7.191.0) | entre os principais não medidos, desde a v7.191.0: 1º pela NA PROGRAMAÇÃO — hoje e atraso, depois a data; na mesma data, a maior UEP na janela primeiro. Os não programados vão para o fim, na ordem da v7.190.0: 1º os com o NA PRODUÇÃO fora de 90–110% (a régua do cartão: volume sozinho, sem as paradas apontadas, UEP do cadastro, contra a MADERO nas mesmas condições), 2º sem leitura (não rodou sozinho, menos de 2 h sem parada, ou a MADERO sem horas sozinha na janela), 3º os que a produção confirma; em cada grupo, a maior UEP primeiro. Programação não lida: só a ordem da v7.190.0. Não conta como medição | — | `v7:_ucvPrincipais` · `v7:_ucvProgDe` · `v7:_ucvPadraoDe` · `v7:_ucvRel` |
| **NA PROGRAMAÇÃO** (mesmo bloco, v7.191.0) | a próxima vez do volume (os códigos dele, todas as cores) na PROGRAMACAO. Vencido e hoje: o `falta` do código (FIFO, por código — uma vez por código, nunca somado por linha) → HOJE (há linha de hoje) ou EM ATRASO. Data futura: Σ (quantidade − adiantado) das linhas da data mais próxima. Fora da esteira e vencida encerrada (X) não contam. *+N datas* = outras datas futuras. — = não está programado | cx | `v7:_ucvProgDe` · `gs:getProgramacaoDetalhada` |

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

## Meta do fim de semana (`.gs` v5.60)

| Indicador | Fórmula | Unidade | Onde |
|---|---|---|---|
| **META / META DIA / META UEP do sábado e do domingo** (HISTORICO) | a meta do dia (a da aba, sem o atraso; META UEP do ⚙) × minutos dos slots de jornada (07:00–17:00) com produção ÷ 527. Dia útil: a meta cheia, como sempre | cx / UEP | `gs:_fracSemJornada` + `gs:_minDoSlot` |

## TAKT DA SEMANA — o veredito para a diretoria (v7.222.0)

| Indicador | Fórmula | Unidade | Onde |
|---|---|---|---|
| **FALTAM** (veredito) | precisa − tem, em horas de linha (o mesmo `_taktVeredito`); traduzido em dias (÷ 527, uma casa), caixas (≈, à dezena até 999, depois à centena) e pontos (≈, em mil acima de 10 mil) | h de linha | `v7:_taktHeroHtml` |
| **NO RITMO ATUAL** (veredito) | só quando o ritmo desta semana fica a ≥ 5% da média (`TKS_RITMO_DESVIO`); na AVALIAÇÃO, sempre | h | `v7:_taktHeroHtml` |
| **PARA FECHAR** (uma linha, v7.232.0; na tela sem repetir as caixas do veredito) | hora extra ≈ o que falta (de meia em meia hora); adiar ≈ as caixas que faltam; remanejar = a folga dos dias abaixo de 1 dia de linha (`P.redist`), só na semana que vem | h / cx | `v7:_taktFecharDados` |
| **FALTAM NO TOTAL** (esta semana ainda não fecha) | o que falta da semana que vem + o que falta desta (se nada mudar) | h de linha | `v7:_taktHerancaHtml` |
| **O DIA MAIS CARREGADO** | o dia que mais passa de 1 dia de linha (minutos) e a parte dele no excesso da semana (Σ UEP acima da referência) | h / % | `v7:_taktPico` |

