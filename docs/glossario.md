# Glossário — RitmoProd · Embalagem

Cada indicador que o painel mostra, com a fórmula **conferida no código** e o
arquivo:linha de onde ela saiu. A interface e este arquivo não podem divergir —
se divergirem, o defeito é da interface.

Unidade padrão: **caixa (cx)**. Não existe "peça" no vocabulário do produto.

## Ritmo e meta do dia

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **PRODUÇÃO REAL** | soma do realizado das horas já lançadas | cx | `v7:3618` |
| **META DO DIA** | meta da PROGRAMAÇÃO (ou ajuste manual) + meta das horas extras cadastradas | cx | `v7:3616` |
| **RITMO ATUAL** | realizado ÷ nº de horas já lançadas | cx/h | `v7:3632` |
| **RITMO NECESSÁRIO** | (meta − realizado) ÷ horas restantes, nunca negativo | cx/h | `v7:3637` |
| **META/HORA** | média da meta das horas já lançadas | cx/h | `v7:3634` |
| **PROJEÇÃO** | realizado + ritmo atual × horas restantes | cx | `v7:3636` |
| **HORAS PRODUTIVAS** | soma dos minutos reais das horas lançadas ÷ 60 | h | `v7:3641` |

⚠ O slot pós-almoço `12:12-13:00` tem **48 min**, não 60. Por isso as horas
produtivas somam a duração real de cada slot em vez de multiplicar por 60.

## Eficiência — duas leituras no mesmo card

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **EFICIÊNCIA % (o número)** | realizado ÷ meta do **DIA** × 100 | % | `v7:3625` |
| **EFICIÊNCIA (a cor e o texto)** | realizado ÷ meta das **horas já lançadas** × 100 | % | `v7:3620` |

**Como ler:** o número diz quanto da meta do dia já foi cumprido; a cor diz se o
**ritmo de agora** está no plano. Um dia pode mostrar 40% em verde às 10:00 — a
meta do dia ainda está longe, mas o ritmo até aqui está em dia. Sem essa
separação o card ficaria vermelho o turno inteiro.

## Atraso hora a hora

| Termo | Fórmula | Unidade | Onde está |
|---|---|---|---|
| **ATRASO ACUMULADO** | max(meta acumulada − produção acumulada, 0), **só das horas já lançadas** | cx | `rp-core.js:98` |
| **META EFETIVA da hora** | meta da hora + atraso acumulado | cx | idem |

⚠ Hora ainda **não lançada** chega como `null` e **não entra** no acumulado —
contá-la como "produziu zero" fazia o atraso crescer uma meta inteira por hora
que ainda nem tinha acontecido. Hora que **fechou** em zero vem como `0` e é
cobrada normalmente.

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
