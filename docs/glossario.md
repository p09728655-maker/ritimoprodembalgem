# Glossário — RitmoProd · Embalagem

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

## Paradas

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **DURAÇÃO PRODUTIVA** | minutos da parada **fora** do almoço | min | `paradas-calc.js:71` |
| **CAIXAS PERDIDAS** | duração produtiva × (meta do dia ÷ horas produtivas), só paradas **não** planejadas | cx | `paradas-calc.js:131` |
| **DISPONIBILIDADE** | (tempo disponível − tempo parado não programado) ÷ tempo disponível × 100 | % | `paradas-calc.js:249` |
| **RITMO DE REFERÊNCIA** | caixas perdidas ÷ (tempo parado não programado ÷ 60) | cx/h | `paradas-calc.js:256` |
| **MIN / 1.000 CX** | minutos parados ÷ caixas × 1.000, só nos **dias trabalhados** | min | `v7:_pgPorJanela` |

**Como ler:** a base é **dias trabalhados** (dias com produção lançada), nunca
dias corridos nem "dias com parada" — o dia que rodou sem parar é justamente o
melhor dia, e tirá-lo da conta faria a média subir sozinha.

⚠ O arredondamento acontece **uma vez, no fim**. Arredondar a perda de cada
parada e somar joga fora a fração de todas elas, sempre para menos.

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

⚠ **Os dois R$ não se somam** — o menor está contido no maior. O custo-hora é de
**uma hora de linha** (toda a equipe junta); a hora extra é digitada em
**homem-hora** por semana. Converter é obrigatório, e é para isso que existe o
campo PESSOAS NA EMBALAGEM.

**Mês típico:** 22 dias úteis. **Ano:** mês típico × 12.

**Onde cada um aparece:** o **mês** é o número grande do card (é ele que alimenta
o payback) e o **ano** tem linha própria logo abaixo — é o valor comparável ao
orçamento de um equipamento. Vale na tela (aba GESTÃO DE PERDAS) e na PROPOSTA DE
INVESTIMENTO em PDF, com os mesmos valores nos dois.
