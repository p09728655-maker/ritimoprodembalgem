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
| **CARTEIRA EM ABERTO** | caixas datadas para dias futuros (`qtde` das linhas da `PROGRAMACAO`) **+ dívida** (atraso vivo + resto da meta de hoje). Com CARTEIRA = `cx de linha (mix)`, cada lote entra pesado (linha abaixo) e o cru fica ao lado | cx | `v7:_cartAberta` |
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
`embalado`/`falta` de propósito, então o aberto dela é a `qtde`.

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
| **UEP/CX** | ritmo da âncora ÷ ritmo do produto (a âncora vale 1,00); o ritmo é o EM REGIME com 4+ h sozinho, senão o usado | UEP/cx | `v7:5822` |
| **RITMO EM REGIME** | caixas ÷ horas em que o produto rodou sozinho na linha | cx/h | `v7:_uepProdutos` |
| **RITMO USADO** | caixas ÷ horas do produto com a hora de troca repartida pelo tempo esperado (caixas ÷ ritmo em regime) | cx/h | `v7:_uepProdutos` |
| **UEP POR DIA** | Σ caixas com produto do dia × UEP/cx (âncora A) — o realizado | UEP | `v7:_uepDias` |
| **FAIXA SUGERIDA DE META (UEP)** | p50–p60 (faixa da aba PLANO) da UEP em 8 h dos dias válidos — sem os dias acima do teto físico da âncora ou com apontamento acima do realizado | UEP | `v7:_uepEstudo` |
| **ALVO PROVISÓRIO (UEP)** | 2.300 UEP em 8 h (`UEP_ALVO_PROV`, decisão do PPCP 24/09/2026); BATEU = UEP em 8 h ≥ 2.300; % = dias válidos que bateram ÷ dias válidos (suspeito fica fora) | UEP | `v7:_uepEstudo` |
| **UEP DO DIA** (gerencial) | Σ caixas × UEP do código (coluna UEP da PRODUTO_CODIGO), só horas de jornada normal; HE à parte. Meta = META_UEP da CONFIG_PAINEL (padrão 2.530, jornada normal de 527 min). Esperado = meta × min(minutos de jornada com lançamento, 527) ÷ 527 | UEP | `.gs:getPontosDia` + `rp-core:uepCard` |
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
| **UEP ATÉ AGORA** | o mesmo número e selo do card UEP DO DIA (`uepCard`): UEP de jornada normal × esperado até agora | UEP | `rp-core:uepCard` |
| **PROJEÇÃO DO DIA** | UEP feita + (UEP feita ÷ minutos de jornada lançados) × minutos de jornada que faltam (de 527) | UEP | `v7:_uepAbaProj` |
| **UEP POR HORA** | UEP feita ÷ minutos de jornada lançados × 60; meta/h = meta do dia ÷ 527 × 60 | UEP/h | `v7:_uepAbaProj` |
| **UEP NA HORA** (gráfico) | Σ caixas × UEP do código na hora (pelo início, HH:MM); meta da hora = meta do dia × minutos do slot ÷ 527; HE sem meta | UEP | `rp-core:uepPorHora` + `v7:_uepAbaHoras` |
| **MIX DE HOJE** | por produto (modelo + nome), só jornada normal: caixas, UEP, UEP/cx = UEP ÷ caixas com UEP, % = UEP do produto ÷ UEP do dia | UEP | `v7:_uepAbaMix` |
| **CONFIABILIDADE** | caixas de hoje por código: UEP medida (vigência sem `EST`) · estimada (vigência termina em `EST`) · sem UEP, ÷ caixas apontadas | % | `v7:_uepAbaConf` |
| **MÉDIA POR DIA** (período) | Σ UEP de jornada gravada nos dias fechados com UEP ÷ nº desses dias; % = Σ UEP ÷ Σ META UEP dos mesmos dias | UEP | `rp-core:uepHistResumo` + `v7:_uepAbaPeriodo` |
| **DIAS QUE BATERAM** (período) | dias com UEP ≥ META UEP daquele dia | dias | `rp-core:uepHistResumo` |
| **OSCILAÇÃO DIA A DIA** (período) | desvio padrão ÷ média, dia a dia, em UEP e em caixas de jornada (realizado − HE) dos mesmos dias | % | `v7:_qpOscilacao` + `v7:_uepAbaPeriodo` |

**Alerta de dado** (faixa âmbar no topo): aparece quando ≥ 20% das caixas de
hoje têm UEP estimada ou ≥ 5% estão sem UEP (`UEP_ALERTA_EST`/`UEP_ALERTA_SEM`).

**Como ler:** âncora A = produto com mais caixas no período; âncora B = o mais
rápido. As duas mudam só a escala. Produto com menos de 5 dias rodados sai com
UEP **PROVISÓRIA** (marcada com \*). A âncora só sai dos que têm 5+ dias. É
estudo: nenhum número do painel usa a UEP.

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
