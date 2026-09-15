# Notas de versão — RitmoPatrimar · Embalagem

Uma entrada por publicação. **Atenção** é obrigatório em toda mudança que altera
um número exibido ou o formato de um arquivo — o gestor precisa saber por que o
indicador da semana passada mudou.

O número da versão é o `APP_VER` no topo de cada painel: `v7.x` é o desktop
(gerencial + TV), `mobile 1.x` é o app do operador. Mudança no
`ritmoprod_appscript.gs` **não sobe pela Vercel** — exige colar no editor do
Apps Script e re-deployar; essas vêm marcadas com ⚠ **re-deploy**.

---

## v7.50.0 — 15/09/2026

**Atenção** — nenhum indicador existente mudou de conta. A aba **PLANO** passou
a ter **dois blocos**: em cima, **A CARTEIRA QUE VEM** (novo — os lotes já
datados para os dias que ainda não chegaram); embaixo, o retrospecto de sempre,
agora rotulado **COMO TEMOS DATADO**. A **RÉGUA** e a **FAIXA ALVO** da barra
valem para os dois; **JULGAR** e **ORDEM**, só para o de baixo.

### Por que

A aba julgava só o passado. Ela diagnosticava a datação e não mudava nada — o
dia já tinha ido. Medido na `PROGRAMACAO` real em 15/09/2026:

```
16/09   3.025 cx   p100   ← o melhor dia da linha em 79 dias é 2.909
17/09   3.125 cx   p100   ← idem
18/09   1.500 cx    p50
21/09   1.800 cx    p70
22/09   1.250 cx    p15
23/09   1.228 cx    p15
24/09   1.350 cx    p30
```

Os dois primeiros dias nasceram impossíveis e a semana seguinte estava com
folga — e no dia 15 ainda dava para trocar.

### O que o bloco responde

- **CARTEIRA EM ABERTO** — o que a `PROGRAMACAO` ainda deve: as caixas datadas
  para frente **mais a dívida** (atraso vivo + o que falta da meta de hoje).
- **DIAS QUE NÃO CABEM** — e quantos passam do melhor dia já feito.
- **PRECISA MUDAR DE DIA** — as caixas acima do que o dia comporta, ao lado do
  **espaço livre** dos dias folgados. Se o que sai for menor que o que cabe, é
  só re-datar — e isso não custa nada.
- **NIVELADO SERIA** — a carga média por dia se carteira e dívida fossem
  espalhadas, com o percentil dela.

O veredito separa os dois problemas, que pedem ações opostas:
`CARTEIRA NIVELADA` · `CARGA MAL DISTRIBUÍDA` · `DIA DATADO ACIMA DO MÁXIMO JÁ
FEITO` (re-datar resolve) · `HORIZONTE SOBRECARREGADO` (re-datar **não**
resolve — é dia a mais, hora extra ou empurrar).

### Custo: menor que antes

`getProgramacaoDetalhada` ganhou **cache de 2 min** e **requisição em voo
compartilhada** (`PROG_DET_VOO`). Antes, cada entrada na aba PROGRAMAÇÃO
refazia a leitura; agora as duas telas que leem a programação pagam **uma**
execução no Apps Script, não duas. O resto do bloco sai do que o painel já
tinha: a curva vem do `buildDiasHistAsync` (cache de 2 min) e a dívida do
`PONTOS_DIA`. **Sem re-deploy do `.gs`.**

### Atenção ao ler

- A faixa alvo é uma **mediana**, não um limite físico: dia acima dela é
  improvável, não proibido. Mova a **RÉGUA** e a **FAIXA ALVO** para testar.
- **Nivelar não é sequenciar.** O nivelamento é a restrição de *capacidade*; a
  ordem continua sendo a *data de corte* do cliente.

---

## v7.49.0 — 15/09/2026

**Atenção** — nenhum número mudou. A tabela do fim da aba **PLANO** ganhou um
seletor de **ORDEM**, e por `altura` ela passa a mostrar **outro recorte**: as
metas mais altas (ou mais baixas) do período **inteiro**, não os últimos dias.
O título da tabela diz qual dos dois está valendo.

### Por que

A tabela era sempre a cauda do período — os últimos 15 dias. As metas
impossíveis mais antigas ficavam invisíveis. Medido no `HISTORICO` real
(30 dias julgados, régua de 60):

```
por DATA (os últimos 15 dias)      por ALTURA (o período inteiro)
14/09  meta   900  p0              04/09  meta 2.950  p100  → produziu 1.602
11/09  meta 1.450  p38             21/08  meta 2.950  p100  → produziu   962
10/09  meta 1.700  p68             02/09  meta 2.750   p97  → produziu 2.537
```

Os dois dias de meta **2.950** — p100, acima de tudo que a linha já fez em 79
dias — não apareciam em lugar nenhum da tabela.

A ordem inversa responde a outra pergunta, e ela também importa: as **5 metas
mais baixas** do período (900 a 1.150 cx) foram **todas** batidas. Meta nesse
nível faz o verde não significar nada, do mesmo jeito que a meta em p100 faz o
vermelho virar paisagem.

### Como funciona

- **ORDEM** na barra da aba: `por data` (padrão, o comportamento de antes) ·
  `altura: p maior` · `altura: p menor`.
- A escolha é guardada junto com a régua e a faixa (`rpe_qp_pref`).
- ⚠ Ordenar **não mexe no gráfico** — ele continua em ordem de calendário. A
  lista é copiada antes de ser ordenada (`_qpOrdenar` devolve lista nova); no
  empate de percentil, o dia mais recente vem primeiro.

### Também nesta versão

- `docs/glossario.md`: a linha *"a curva usa todo o histórico"* estava
  desatualizada desde a v7.48.0, que tornou a régua móvel (padrão 60 dias).
  Corrigida, e os **três** recortes (JULGAR · RÉGUA · ORDEM) passaram a estar
  escritos lado a lado.

---

## v7.48.0 — 15/09/2026

**Atenção** — a **régua da aba PLANO passou a ser móvel**, com padrão de **60
dias** em vez de todo o histórico. Os percentis mudam por causa disso: com os 79
dias a altura dava **p53**; com 60 dias dá **p55**. Nenhuma conta mudou — mudou
de quais dias sai o padrão de comparação.

### Régua móvel: a de antes subestimava a linha

A faixa alvo era calculada com **todo** o histórico. Medido em 15/09/2026:

```
todo o histórico (79 dias):  p50=1.548  p60=1.602  p75=1.984
só os últimos 30 dias:       p50=1.602  p60=1.795  p75=2.184
```

Os dias ruins de julho (p50 de **1.466** naquele mês) puxavam a régua para
baixo, e a tela **subestimava o que a linha faz hoje** — dizia "meta exequível:
1.548–1.602" quando o padrão recente era 1.602–1.795.

Agora há um seletor **RÉGUA** (30 / 60 / 90 dias / todo o histórico). Padrão
**60**: janela curta demais pula com uma semana ruim, longa demais carrega um
mês ruim que já passou.

⚠ **São dois recortes diferentes, e o subtítulo da tela diz isso:** *JULGAR*
escolhe quais dias aparecem no gráfico; *RÉGUA* escolhe de quais dias sai o
padrão com que eles são comparados.

### Testar outras faixas sem deploy

Seletor **FAIXA ALVO** com p45–p55, p50–p60 (padrão), p55–p65 e p60–p70. O card
DIAS ACIMA DA CAPACIDADE passou a mostrar **quantos dias caíram dentro** da
faixa escolhida — é o número que deixa comparar uma faixa com a outra.

As constantes `QP_ALVO_*` viram o **ponto de partida**, não a lei. A faixa entra
por parâmetro no `_qpAnalise`, e o veredito e o desenho leem dela — não da
constante —, senão a tela julgaria por uma faixa e pintaria por outra.

A escolha (régua, faixa e janela) fica no `localStorage['rpe_qp_pref']`:
calibrar leva dias, e perder o ajuste a cada F5 faria ninguém calibrar.

---

## v7.47.0 — 15/09/2026

**Nenhum número muda.** Troca só o **gráfico** da aba PLANO. Os quatro cards, os
vereditos e a tabela continuam iguais.

### O gráfico da aba PLANO passou a ser dia a dia

A primeira versão punha o **percentil no eixo horizontal**: os 79 dias
enfileirados do pior para o melhor, com a meta de cada dia pousada na curva.

**Não funcionou.** O próprio PPCP, que pediu a tela, não conseguiu ler — e ele
tinha acabado de perguntar o que era p50. Tela que precisa de aula falha na
parede da fábrica, e falha primeiro com quem passa rápido, que é quem mais
precisa dela. Aqui a regra é a de sempre: **quando a interface e o entendimento
divergem, o defeito é da interface.**

Agora o eixo de baixo é o **calendário** — que ninguém precisa aprender a ler — e
entram **duas linhas**:

| | |
|---|---|
| **laranja** | a meta de cada dia |
| **cinza** | o que a linha produziu |
| **faixa verde** | onde a meta deveria ficar (p50–p60) |
| **faixa vermelha** | acima daqui a linha quase nunca chega (p75) |

⚠ **É assim que o `r² = 8%` aparece desenhado:** as duas linhas **não se
acompanham** — a meta sobe quando a produção desce. Na versão do ranking o
realizado **nem era desenhado**, então o achado principal da tela não aparecia de
jeito nenhum.

A régua (p50/p60/p75) continua vindo de **todo** o histórico; o filtro escolhe só
quais dias aparecem no gráfico.

---

## v7.46.0 / mobile 1.18.0 — 15/09/2026

**Atenção** — o card **PROJEÇÃO FINAL deixa de dar veredito**. O número continua
igual; some o `▲ ACIMA DA META / ▼ ABAIXO` e a cor verde/vermelha. Nenhuma conta
muda.

### Dois cards respondiam a mesma pergunta com contas diferentes

`PROJEÇÃO FINAL` e o selo do `% DA META DO DIA` respondiam **"vamos bater a meta
hoje?"** — cada um medindo o quanto do turno já passou de um jeito:

| | como mede o turno |
|---|---|
| **PROJEÇÃO** | em **slots** (`real + ritmo × slots restantes`, `ritmo = real ÷ nº de slots`) |
| **SELO** | em **minutos** (`efNoRitmo`) |

Só dariam igual se toda hora tivesse 60 min. **O slot pós-almoço `12:12-13:00`
tem 48**, e é isso que descola as duas.

Medido no turno real (9 slots, **527 min**, meta 1.800) com **4 horas lançadas**:

```
PROJEÇÃO cobra:  1.800 × 4/9      =  800 cx
SELO cobra:      1.800 × 240/527  =  820 cx
```

Com a produção em **810 cx** a tela mostrava, lado a lado:

```
PROJEÇÃO FINAL   ▲ ACIMA DA META      (810 > 800)
% DA META        ABAIXO DO RITMO      (810 < 820)
```

Dois cards vizinhos, vereditos opostos, os dois certos. E **não é caso raro**:
acontece em **8 das 9 horas** do turno, com janela de 2 a 20 cx.

**O número fica** — projetar é informação útil. Quem julga passa a ser só o selo,
que rateia por **minuto** e é a conta mais correta. É a mesma regra do relatório
semanal: *o número é tinta, o veredito é o selo*.

⚠ A **TV nunca teve este defeito** — ela já imprimia a projeção como número puro.
O teste prende isso para ela não ganhar um.

Vale nos **dois** gerenciais (desktop e celular).

---

## v7.45.0 — 15/09/2026

**Atenção** — o card **GAP DA META sai do gerencial** (ao vivo e dia passado). O
número não some: vira o subtítulo do card META DO DIA. Nenhuma conta muda.

### Aba nova: 📐 PLANO — a meta contra a capacidade demonstrada

Medido no `HISTORICO`, 79 dias: a correlação entre a **META** do dia e o
**REALIZADO** é **r = 0,28**, ou seja **r² de 8%**. A meta do dia explica 8% da
variação do que a linha produz. A EFICIÊNCIA varia de **32,6% a 188,5%** porque
o **denominador** pula, não porque a linha pule — nos últimos 8 dias a meta foi
de **p0** (900 cx, abaixo de tudo que a linha já fez) a **p100** (2.950 cx,
acima de tudo).

A causa está no próprio código: `CFG.metaDia` é a soma dos lotes datados para
aquele dia, então a meta herda a irregularidade da **datação**, não da operação.

A aba mede o **plano**, não a linha, e responde duas perguntas:

| | o que é | hoje (30 dias) |
|---|---|---|
| **ALTURA DA META** | em que percentil da capacidade demonstrada ela cai | **p53** ✓ |
| **OSCILAÇÃO DA META** | quanto ela pula de um dia para o outro | **34,5%** ✗ |

O gráfico põe o **percentil no eixo horizontal**: a curva branca é a capacidade
que a linha já demonstrou e **cada ponto é a meta de um dia**, na altura em que
cai. No período em cartaz os pontos estão espalhados de p0 a p100.

⚠ **Não é baixar a meta.** A função da meta do dia é **sinalizar**: meta que a
linha bate em cerca de metade dos dias faz o vermelho significar alguma coisa.
Meta que reprova 2 em cada 3 dias vira paisagem, e aí se perde o alarme. A
produção sobe pelas paradas, pelo setup e pelo teto da esteira — a meta sobe
**atrás** da capacidade demonstrada, nunca na frente.

O combinado fica em constantes (`QP_ALVO_MIN` 50, `QP_ALVO_MAX` 60, `QP_ACIMA`
75, `QP_OSC_OK` 20, `QP_OSC_RUIM` 30, `QP_MIN_DIAS` 10) — mudar o alvo é mexer
numa linha.

**Custo: zero.** A tela lê o `buildDiasHistAsync`, que o HISTÓRICO e a cascata já
usam e que tem cache de 2 min. **Nenhuma chamada nova ao Apps Script e nenhum
re-deploy.**

### GAP DA META saiu do gerencial

`PRODUÇÃO REAL`, `META DO DIA`, `% DA META DO DIA` e `GAP DA META` eram **quatro
cards para uma relação só**: dados o real e a meta, o percentual e a diferença
são aritmética que o olho faz. O que o gap tinha de útil — quantas caixas faltam
— virou a linha de apoio do próprio card da meta. O gerencial foi de 11 para 10
cards sem perder informação.

---

## Apps Script — 15/09/2026 (leitura recortada por data) ⚠ re-deploy

**Nenhum número muda.** O que muda é quanta planilha o backend lê para responder
a mesma coisa.

### As leituras por período param de ler a aba inteira

Toda leitura do `.gs` era `getDataRange()`: a aba **inteira**, com o custo
crescendo com o histórico acumulado em vez de com o que foi pedido.

Medido na planilha real:

| aba | linhas | colunas | células |
|---|---|---|---|
| `PRODUCAO_PRODUTO` | 2.381 | 8 | 19.048 |
| `PARADAS` | 515 | 7 | 3.605 |

`getProducaoModeloPeriodo` e `getParadasPeriodo` passam a ler só a faixa de
linhas do período (`_valoresPorData`):

| janela | linhas no período | células | vs. antes |
|---|---|---|---|
| 7 dias | 260 | 4.468 | **−77%** |
| 30 dias | 953 | 10.012 | **−47%** |
| 90 dias | 2.380 | 21.428 | **+12%** |

⚠ **O pior caso está escrito porque é real.** A varredura da coluna de data
custa 1/nColunas de uma leitura completa e é paga sempre; quando a janela cobre
a aba inteira, esse 1/n vira prejuízo. Fica assim de propósito: 7 e 30 dias são
o uso do dia a dia e 90 é o preset raro. O teste prende o teto — nunca mais que
"aba inteira + a coluna de data".

⚠ **Não assume que a planilha está em ordem de data.** A otimização óbvia seria
achar o corte por busca binária e ler dali em diante; ela perde linha **calado**
quando alguém acrescenta uma parada antiga à mão — coisa que acontece nesta
planilha (é por isso que o `endParada` tem fallback por DATA+INÍCIO). Aqui a
coluna de data é varrida inteira e lê-se o trecho entre a primeira e a última
linha que casam: fora de ordem continua **certo**, só lê um pouco mais. O teste
tem o caso da linha antiga lançada no fim da aba.

⚠ **A conversão de data é a do chamador.** O `getParadasPeriodo` filtra por
`toNum(_dataStr(...))`, que formata `Date` no fuso **da planilha**, e o
`getProducaoModeloPeriodo` por `dataParaNum`, que usa o `TZ` constante. Para
célula que é `Date` de verdade — e as datas chegam como serial de meia-noite —
os dois discordam do **dia** quando os fusos diferem, e o recorte cortaria uma
linha que o filtro aceitaria. Cada chamador passa a sua própria conversão, então
recorte e filtro concordam por construção.

**O que continua lendo tudo, e deve:** `lerEmbaladoPorProduto`. O FIFO precisa
do histórico inteiro — recortar ali creditaria produção antiga a outro lote do
mesmo código, que é o erro que o arquivamento existe para evitar.

O recorte **nunca entra no memo por execução**: o memo guarda a aba inteira, e
um pedaço lá dentro faria a próxima leitura completa devolver menos linhas do
que a planilha tem. E quando a aba inteira já está no memo, o recorte nem
acontece — reler um pedaço do que já está na mão é leitura a mais, não a menos.

---

## v7.44.0 — 15/09/2026

**Nenhum número muda.** A tela e o PDF do comparativo por modelo já mostravam os
mesmos valores — o que mudou é que agora eles saem do mesmo código.

### O quadro do período era montado duas vezes

`renderModeloPeriodo` (tela) e `gerarRelatorioProducaoHora` (PDF) construíam o
MESMO quadro com o mesmo código escrito duas vezes: a régua do período (troca
medida ou premissa, fator de troca, modo da média) e as ~20 linhas que montam
cada linha do comparativo.

O `relatorios.test.js` prendia **uma** das vinte — o `tetoShow:` —, então as
outras dezenove podiam divergir à vontade. É exatamente como a conta de paradas
divergiu três vezes.

Agora são **`_phReguaPeriodo`** e **`_phLinhasPeriodo`**: uma implementação, dois
chamadores. A única diferença entre as cópias era o campo `aparada`, que só a
tela lia — ele passa a sair para os dois, porque mandar um campo a mais é mais
barato que manter duas construções que precisam concordar.

O teste deixou de contar cópias e passou a **rodar a função**: monta dois
produtos em dois dias e confere `v1`, `v2`, `nd`, o teto físico, o `tetoShow`
igual para as duas linhas (a régua única que o PPCP pediu em 24/08/2026), a
queda para a fatia por linha quando não há fator, e a métrica aditiva.

---

## Apps Script — 15/09/2026 (sem mudança de comportamento)

⚠ **re-deploy** quando for conveniente. **Nenhum número muda** e nada quebra se
o re-deploy for adiado: a versão implantada continua somando exatamente igual.

### A detecção da coluna de LOTE saiu de três lugares para um

A produção é lançada nas colunas de **LOTE** da `HORA_A_HORA` — a coluna
REALIZADO pode ficar vazia ou parcial, então quem soma errado ali mostra menos
caixa do que a fábrica fez. O laço que escolhe essas colunas estava **copiado em
três funções**: `getDados`, `_saveRealizadoCore` e `arquivarDiaAtual`.

Agora é `_ehColunaLote(titulo)` e `_colunasDeLote(hdr, iR)`, um lugar só.

**O critério NÃO foi endurecido** — e, conferido o cabeçalho real da planilha,
ele **não deve ser**.

⚠ **As colunas de lançamento chamam-se `LANÇ 1` … `LANÇ 10`.** Não existe coluna
`LOTE` nem `LT` na `HORA_A_HORA`. Das três cláusulas do critério, quem sustenta
o lançamento é justamente o **`startsWith('L')`** — as outras duas não casam com
nada. Endurecer para "só LOTE/LT", que é o que a leitura do código sugere a quem
nunca abriu a planilha, faria as **dez** colunas pararem de ser somadas.

E o estrago seria **calado**: sem coluna de lote, o `_saveRealizadoCore` cai no
ramo `iLotes.length === 0`, que grava em REALIZADO **apenas**
`if (!cell.getFormula())` e devolve **`{ok:true}` de qualquer jeito**. Com
REALIZADO sendo fórmula, o operador salva, o app diz que salvou e **nada é
gravado**.

O `apps-script.test.js` passou a prender o **cabeçalho real** (`HDR_REAL`, as
dez colunas `LANÇ`): quem endurecer o critério quebra no teste antes de quebrar
a fábrica. Conferido que a guarda falha com o critério apertado. O fixture do
`hora-extra.test.js` também passou a usar `LANÇ 1` — fixture que não espelha a
planilha é armadilha.

**O que sobra de verdade** (risco baixo, e agora num lugar só): o critério
aceita de mais — `LINHA`/`LIMPEZA`/`LÍDER`/`LOCAL` pelo começo com L, e
`RESULTADO` (resu**LT**ado)/`FALTA` (fa**LT**a) pelo `LT` no meio. **Hoje não
faz mal**: depois de `LANÇ 10` só existem uma coluna vazia e `COMO PREENCHER`.
Vira problema só se alguém acrescentar uma coluna com esses nomes depois de
REALIZADO. Se um dia precisar apertar, a forma segura é **allowlist ancorada no
começo** (`LOTE` · `LANÇ`/`LANC` · `LT` · `L`+dígito).

---

## v7.43.0 — 15/09/2026

**Atenção** — muda o **cabeçalho impresso do relatório de HISTÓRICO**, e só ele.
Nenhum número muda: é a faixa de identidade do topo da folha. Os outros sete
relatórios saem exatamente como antes.

### A pele do cabeçalho passou a morar com a marcação

O `_rpCabecalho` já era uma implementação só desde o #204/#205 — mas só a
**marcação**. O **CSS que a pinta** continuou copiado em **cinco documentos**,
um por relatório, e uma das cópias envelheceu sem ninguém ver.

Medido no Chromium, antes da correção:

| relatório | marca `PATRIMAR` | tamanho do logo |
|---|---|---|
| Produção por família/modelo | laranja `#FF5C1F` | 22px |
| Produção por modelo | laranja `#FF5C1F` | 22px |
| **Histórico** | **branco** | **18px** |
| Semanal | laranja `#FF5C1F` | 22px |
| Paradas / Perdas / Min-1000 / Investimento | laranja `#FF5C1F` | 22px |

A cópia do HISTÓRICO tinha perdido a regra `.rp-logo span{color:#FF5C1F}` e
ficado com o logo a 18px. Como `.rp-header .rp-logo` pinta o bloco inteiro de
branco, sem aquela regra o **PATRIMAR** herdava o branco: o nome do produto saía
sem o laranja da marca, menor, num relatório de oito.

É a história do #204/#205 de novo — arrumar um documento e esquecer os outros
quatro —, dessa vez pela pele em vez da marcação.

**O que mudou no código:** o bloco de identidade do cabeçalho e o `<link>` das
fontes viraram `_RP_HEADER_CSS` e `_RP_FONTS`, ao lado do `_rpCabecalho`,
na seção das peças comuns. Os cinco documentos leem as constantes. O `<link>`
do `<head>` do próprio painel não entra — ele não é relatório.

O que **não** mudou: o acento de cada documento (`.rp-dia`, `.rp-semana`,
`.rp-per`) continua local — o das paradas é vermelho de propósito.

`relatorios.test.js` ganhou seis verificações: a pele declarada uma vez, os
cinco documentos lendo a constante, ninguém redeclarando `.rp-logo`/
`.rp-sub`/`.rp-meta`, e a regra que pinta a marca existindo — a que faltava.
Conferido que a guarda falha quando a cópia volta.

---

## Apps Script 5.4 — 14/09/2026

**Atenção** — ⚠ **re-deploy**. Muda a coluna **`STATUS`** da aba `PROGRAMACAO`.
Nenhum indicador do painel muda: `PRODUZIDO`, `SALDO` e `PERCENTUAL` saem da
mesma conta, e o atraso que o painel calcula sempre foi o mesmo — o que muda é a
planilha passar a dizer isso na cara.

### "EM ANDAMENTO" é do lote de HOJE

Pedido do usuário: *"status em andamento só lotes do dia, anterior ao dia atual é
em atraso"*. Um lote programado para **02/09** aparecia como **EM ANDAMENTO** no
dia **14/09** — a palavra dizia que a coisa está caminhando, quando ela está
parada há doze dias.

| situação da linha | antes | depois |
|---|---|---|
| data de hoje, já produziu | EM ANDAMENTO | EM ANDAMENTO |
| data de hoje, não começou | PENDENTE | PENDENTE |
| **data anterior, produção parcial** | EM ANDAMENTO | **EM ATRASO** |
| **data anterior, não começou** | PENDENTE | **EM ATRASO** |
| saldo zerado | CONCLUIDO | CONCLUIDO |
| marcada FORA_ESTEIRA | FORA DA ESTEIRA | FORA DA ESTEIRA |
| data futura | em branco | em branco |

**Quem não começou também está em atraso.** A régua é a mesma que o painel já usa
para somar o atraso — *programado antes de hoje que não foi embalado* —, e ali
tanto faz se a linha produziu metade ou nada. O que distingue as duas continua na
própria linha: `PRODUZIDO` e `PERCENTUAL` em **0** dizem que ela não saiu do
lugar. Com isso a soma dos `SALDO` das linhas EM ATRASO é o atraso que o painel
mostra: planilha e indicador passam a falar a mesma língua.

### O carimbo não reage à virada do dia

A v5.3 fez o `ATUALIZADO_EM` carimbar só quando a linha muda de fato. O status
novo muda **sozinho na virada do dia** — um lote de hoje que ficou parcial é EM
ATRASO amanhã, sem ninguém ter produzido nada. Sem cuidado, o primeiro lançamento
do dia recarimbaria a aba inteira e o carimbo voltaria a mentir.

`_progFase` trata `PENDENTE`, `EM ANDAMENTO` e `EM ATRASO` como a **mesma fase**
(lote aberto): só o relógio separa os três. Toda mudança de verdade — entrou no
cálculo, concluiu, saiu da esteira — mexe em `PRODUZIDO`/`SALDO` junto, e é por
ali que ela carimba.

### O que esperar depois do re-deploy

- **No primeiro lançamento, as linhas vencidas trocam de status e são carimbadas
  uma vez** (o status mudou de fato). Da segunda rodada em diante, só anda quem
  produz.
- **O status só se atualiza quando o script roda** — ou seja, a cada lançamento
  do operador. De madrugada, antes do primeiro apontamento do dia, a aba ainda
  mostra o retrato de ontem.
- Se a programação estiver toda vencida, a aba inteira sai **EM ATRASO**. Não é
  defeito da regra: é o retrato da carteira. Aí quem prioriza passa a ser a
  **DATA** (quanto tempo de atraso) e o **SALDO**, não mais o status.

Cobertura: `node apps-script.test.js` roda a função real contra uma planilha de
mentira — os quatro status, a virada do dia sem recarimbo e a fase.

---

## Apps Script 5.3 — 14/09/2026

**Atenção** — ⚠ **re-deploy**. **Nenhum número da planilha ou do painel mudou**:
PRODUZIDO, SALDO, PERCENTUAL e STATUS continuam saindo da mesma conta. O que
muda é a coluna **`ATUALIZADO_EM`** da aba `PROGRAMACAO`.

### A hora era da sincronização, não do lote

Relato do usuário, com a planilha na tela: *"a data sempre fica atual"* — as 36
linhas da `PROGRAMACAO` com **`11/09/2026 16:43:43`**, o mesmo segundo em todas.

`atualizarSaldoNaProgramacao()` roda a **cada lançamento** do operador e
reescrevia `agora` em todas as linhas elegíveis, inclusive nas que não tinham
mudado nada. A coluna respondia *"a última sincronização foi às 16:43"* — uma
informação que já está no próprio painel — em vez de *"este lote andou às
16:43"*, que é o que ela existe para dizer. Na prática o PPCP ficava sem saber
qual lote parou e desde quando: um lote travado há três dias tem o mesmo carimbo
do que acabou de rodar.

Agora a hora só é recarimbada quando a **linha muda de fato** — PRODUZIDO,
SALDO, PERCENTUAL ou STATUS diferentes do que já está gravado na célula
(`_progIgual`, que compara número com número mesmo quando a célula volta como
texto). Linha parada **mantém o carimbo anterior**, com o valor bruto que estava
lá: célula formatada como data continua data, como texto continua texto. Mesma
regra que a gravação da meta do dia (`gravarMetaDiaNaPlanilha`) já seguia — só
grava quando o valor muda.

| | antes | depois |
|---|---|---|
| lote que produziu no lançamento | hora do lançamento | hora do lançamento |
| lote parado há 3 dias | hora do lançamento | a hora em que ele parou |
| linha de data futura | em branco | em branco |

**Na primeira rodada após o re-deploy todas as linhas ativas são carimbadas uma
vez** (o carimbo de hoje é o que está na planilha), e a partir daí cada uma anda
no seu tempo. O histórico anterior não dá para reconstruir — a planilha nunca o
guardou.

Cobertura: `node apps-script.test.js` roda a função real contra uma planilha de
mentira e falha se uma rodada sem mudança voltar a recarimbar.

---

## v7.42.0 — 08/09/2026

**Atenção** — **nenhum número, fórmula ou indicador mudou.** É a ordem em que o
PC carrega o painel.

### No PC o painel abria com a tela preta esperando o cdnjs

Relato do usuário: *"no pc não tem animação na tela inicial"*. O splash **estava
publicado e funcionando** (v7.41.0 em produção, conferido no Chromium a 1440 e
1920 px) — o que faltava era a página **pintar**.

As duas bibliotecas de terceiros do desktop (`xlsx.full.min.js` e
`chart.umd.min.js`, do cdnjs) eram **scripts síncronos no `<head>`**: o parser
para neles, e o `<body>` — o splash junto — só começa a existir depois que o
cdnjs responder. **Medido no Chromium com o cdnjs a 3 s: primeira pintura aos
3.132 ms.** Três segundos de tela preta, e só então a marca. Com o cdnjs
bloqueado (rede da fábrica, firewall) a espera é a do timeout, com a mesma tela
preta.

**É defeito do PC apenas** — e é por isso que no celular a abertura aparece: o
`/mobile` não carrega CDN nenhuma e ainda tem service worker.

Agora as duas entram com **`defer`**: o parser não para mais nelas.

| cdnjs | primeira pintura antes | depois |
|---|---|---|
| rápida | 148 ms | 148 ms |
| a 3 s | **3.132 ms** | **196 ms** |
| bloqueada | tela preta até o timeout | 148 ms, painel abre |

**A Chart.js precisou de uma fila.** Com `defer`, o primeiro render (o
`renderAll()` do fim do script) roda antes de a lib existir. O `mkChart`
**enfileira** o gráfico nesse intervalo e desenha no `DOMContentLoaded`, que o
navegador dispara depois dos scripts `defer` — o mesmo desenho, alguns
milissegundos mais tarde. De quebra, **cdnjs fora do ar não derruba mais o
render**: antes era um `new Chart` num nome inexistente estourando no meio do
desenho e levando junto o que vinha depois (foi assim que a Chart.js não
carregar já deixou o rodapé sem versão).

**Conferido no navegador:** com o cdnjs a 3 s o splash aparece aos ~150 ms e
fica ~1,3 s; os gráficos do gerencial continuam sendo desenhados; com o cdnjs
bloqueado a tela de login abre normalmente e **nenhum erro de script** é
lançado.

### E a regra de movimento reduzido ficou solta no PC

Conferido no print do painel do usuário: o PC já rodava a **v7.41.0**, a versão
que trouxe o splash — cache descartado. O que restava era o Windows com
**efeitos de animação desligados** (Acessibilidade → Efeitos visuais): o Chrome
passa a pedir menos movimento e a abertura saía com a marca **parada** por
0,7 s. Sem animação, literalmente.

A pedido do usuário (*"solta a regra no PC"*), no `/` a `prefers-reduced-motion`
passa a desligar **só a entrada do bloco** (o deslocamento de 8 px); a **batida
continua sendo traçada**, no mesmo tempo de tela. Desenhar uma linha no lugar
não é o movimento que essa preferência existe para evitar — não há
deslocamento, zoom, parallax nem piscada.

⚠ **No celular a regra continua inteira**: lá o aparelho está na mão e em
movimento, e o pedido foi só para o PC. Medido no Chromium com movimento
reduzido ligado: PC traça a batida e fica 1,4 s; celular segue com a marca
parada, 0,9 s.

⚠ **Se ainda assim a abertura não aparecer no PC**, a causa provável é que a
**janela já estava aberta**: o painel do PC é instalado como app e fica aberto o
dia inteiro — clicar no ícone da barra de tarefas apenas dá foco na janela, e
sem carregamento não há abertura. Feche a janela e abra de novo (ou F5) para
ver. No celular o sistema mata o app e ele reabre do zero, e é por isso que lá
ela aparece toda vez.

---

## v7.41.0 · mobile 1.17.0 — 08/09/2026

**Atenção** — **nenhum número ou fórmula mudou.** É só a tela de abertura.

### Splash de entrada, com o slogan

Ao abrir o app (celular e PC) aparece por **~1s** a marca, uma **batida sendo
traçada** e o slogan **"Medimos o pulso da·linha."**. Toque/clique pula.

**A tarefa do usuário nesta tela é SAIR dela** — o operador abre o app no meio
da hora, de pé, para lançar caixa. Por isso:

- **Quem faz o splash sumir é o CSS, não o JS.** Se o script morrer, ou a rede
  cair antes dele, a tela sai do caminho do mesmo jeito. Um overlay preso em
  cima da tela deixaria o operador sem lançar.
- **O app carrega por trás.** O splash é uma camada por cima, não um passo antes.
- **O movimento significa algo.** A única animação é uma batida traçada uma vez
  — é o slogan desenhado, não efeito. Nada mais se mexe.
- **Cor só onde tem função:** o nome é branco (tinta); o laranja fica na batida
  e no ponto final do slogan, que é o sinal da marca.
- `prefers-reduced-motion` recebe a marca parada, e por menos tempo.

⚠ **A TV FICA DE FORA.** Ela roda em `?tv` e se **recarrega sozinha a cada 28
min** (anti-sleep do WebOS): com splash, a parede da fábrica piscaria a marca de
meia em meia hora, no lugar da produção. A exclusão entra no `<html>` antes da
primeira pintura.

**Medido no navegador**, não suposto: em 320 / 430 / 1280 / 1920 / 1366×600 nada
estoura; o splash sai sozinho (`visibility:hidden`, `pointer-events:none`) e o
botão OPERADOR volta clicável; com `?tv` ele nem é desenhado.

---

## v7.40.0 · mobile 1.16.0 — 08/09/2026

**Atenção** — **nenhum número, fórmula, premissa ou nome de arquivo mudou.** É
troca de nome na camada de apresentação: o painel passou a se chamar
**RitmoPatrimar**. Indicador nenhum muda de valor, nenhum dado é perdido e o
Apps Script **não precisa de re-deploy**.

### O painel virou RitmoPatrimar

O nome aparece agora como **RITMOPATRIMAR · EMBALAGEM** no cabeçalho de
impressão, na tela de login, no rodapé do painel e da TV, no título da aba, no
ícone do celular, nos rodapés dos relatórios em PDF, no título do popup do
histórico, no resumo do WhatsApp e na notificação de lembrete.

⚠ **A grafia é EMBALAGEM, com "A"** — o pedido veio escrito "EMBALGEM", como o
nome do repositório. Nome de repositório ninguém vê; nome de produto vai para o
rodapé de todo PDF que sobe para a diretoria.

**O nome agora mora em um lugar só.** Estava escrito ~35 vezes espalhadas. Os
pontos gerados por JS leem `APP_NOME` / `APP_NOME_CX` (declarados ao lado do
`APP_VER`, no topo do script); só os estáticos continuam literais — `<title>`,
a meta do iOS, os `<h1>` dos cabeçalhos de impressão e o rodapé da tela, que
nascem antes do script rodar. A próxima troca de nome custa uma linha.
`relatorios.test.js` prende os cinco rodapés de relatório, os quatro rodapés de
PDF e a assinatura do WhatsApp na constante, e **falha se o nome antigo voltar**
a qualquer um dos dois painéis.

### O slogan agora vai em TODA impressão

Pedido do usuário. **"Medimos o pulso da·linha."** já existia na tela — login e
rodapé — e agora sai também no **cabeçalho dos oito relatórios em PDF** e nos
**dois cabeçalhos de impressão do próprio painel** (gerencial e histórico).

A forma é a que a marca já usava, não uma nova: o ponto de **destaque é o
final**; o `·` do meio é texto normal. É **uma implementação** — os oito
relatórios passam pelo `_rpCabecalho`, então o slogan foi escrito uma vez só.

⚠ **O nome do produto estava PARTIDO por tag nesse cabeçalho**
(`RITMO<span>PROD</span>`) — fora do alcance de qualquer busca por
"RITMOPROD". Era o cabeçalho dos cinco relatórios: sem isso, o PDF sairia com
o nome antigo em cima da mesa da reunião. Corrigido junto.

⚠ **A capa da GESTÃO DE PERDAS é medida para caber na folha 1** (paisagem). O
slogan ocupa ~12px, então `.deitado .rp-header` devolve o mesmo em **ar**
(padding e margem, nunca fonte de leitura) — o saldo na capa é ~2px.

### O que NÃO mudou, de propósito

- **Nome dos arquivos** (`ritmoprod_embalagem_v7.html`, `ritmoprod_mobile.html`,
  `ritmoprod_appscript.gs`). Ninguém os vê — a URL pública é `/` e `/mobile`.
  Renomear quebraria os rewrites do `vercel.json` e as sete suítes de teste, e
  os 6 textos de tela que mandam colar o `ritmoprod_appscript.gs` no editor
  passariam a apontar para arquivo que não existe. Ganho zero.
- **Prefixo dos XLSX exportados** (`ritmoprod_..._fechamento.xlsx`,
  `ritmoprod_historico_....xlsx`). Trocar seria mudança de formato de saída, e
  quebraria quem organiza pasta por prefixo. O **conteúdo** da primeira linha da
  planilha de fechamento acompanha o nome novo.
- **As chaves do `localStorage`** (`rpe_cfg`, `rpe_logo`, `rpe_hist`,
  `rpe_pg_sim`, `rp_mob_ver`…). É por isso que **ninguém perde** a URL do Apps
  Script salva no aparelho, o logo enviado nem o cenário do simulador.
- **O `id` dos manifests** (`/` e `/mobile`). Só `name` e `short_name` mudaram:
  mexer no `id` faria o Chrome tratar como app NOVO e o operador ficaria com
  dois ícones, continuando a abrir o velho.
- **A conexão com o Sheets, as abas, as colunas e o histórico gravado.**

### Para quem já tem o app instalado

O celular mostra a barra **"Nova versão disponível → ATUALIZAR"** (o `CACHE` do
`sw-mobile.js` subiu para `v25`). O **nome sob o ícone** só troca quando o
navegador relê o manifest: no Android costuma acontecer sozinho; no iPhone, só
removendo e adicionando o atalho de novo. O app funciona igual nesse meio-tempo.

⚠ **Conferir na TV e no papel:** `RITMOPATRIMAR` tem 13 caracteres contra 9 de
`RITMOPROD`. Os três pontos apertados são o logotipo do rodapé da TV, o `<h1>`
do cabeçalho de impressão (comum aos cinco relatórios) e o rodapé dos PDFs. Nas
regras de CSS não há largura fixa nem `nowrap` nesses pontos, mas isso é leitura
de código — vale olhar uma folha impressa e a TV ligada.

---

## v7.39.0 — 04/09/2026

**Atenção** — **nenhum número, fórmula ou premissa existente mudou.** O que
entrou é um campo **opcional** (TICKET MÉDIO) e uma **terceira leitura
financeira** (POTENCIAL DE RECEITA) que só aparece quando esse campo é
preenchido. Sem ticket informado, a proposta sai exatamente como saía.

### TICKET MÉDIO → POTENCIAL DE RECEITA

Campo novo no cenário do simulador, em **R$ por caixa**, **opcional**. Quando
informado:

`caixas recuperadas × ticket médio = potencial de receita mensal` · `× 12 = anual`

⚠ **Sem ticket, nada é calculado.** O painel não arbitra preço médio, não busca
valor externo e não mostra zero — mostra *"ticket médio não informado —
potencial de receita não calculado"*. Zero afirmaria que a capacidade não vale
nada.

### O que este número NÃO é

**Caixa recuperada é capacidade produtiva, não venda.** O potencial de receita
não é economia, não é lucro e não é faturamento garantido: ele só se realiza se
houver demanda para absorver as caixas. E o ticket é a **média do mix do
período** — modelos e caixas de valores diferentes entram na mesma média.

⚠ **Ele NUNCA entra no payback nem no ROI**, que continuam saindo só da
ECONOMIA EM HE. Receita potencial não é dinheiro disponível para pagar
investimento. O teste falha se o ticket mexer em payback, ROI, economia em HE,
custo da parada ou caixas recuperadas.

### A proposta separou capacidade de dinheiro

O documento passou a seguir o fluxo **PROBLEMA → CENÁRIO → CAPACIDADE →
IMPACTO → INVESTIMENTO → RETORNO**, e as seções acompanham:

- **3 · A CAPACIDADE RECUPERADA** — tempo, caixas, hora extra evitável e
  disponibilidade, numa linha de quatro;
- **4 · O IMPACTO ECONÔMICO — TRÊS LEITURAS QUE NÃO SE SOMAM** — custo da
  parada (ociosidade de folha já paga), economia em HE (a única leitura de
  caixa) e potencial de receita (o valor econômico da capacidade).

O card do potencial sai com **borda tracejada**: ele costuma ser ordens de
grandeza maior que a economia em HE e divide a linha com ela — sem essa
diferença visual, a leitura ancora no maior número da página.

### Etiquetas de natureza do dado

Cada número da proposta passou a dizer de onde vem: **APONTADO** (veio do
apontamento) · **ESTIMADO** (conta do painel sobre o apontado) · **SIMULADO**
(depende do cenário digitado) · **POTENCIAL** (só se realiza sob condição
externa) · **OCIOSIDADE**.

⚠ **Correção importante:** ocorrências e tempo parado **são** apontamento, mas
**caixas perdidas é conta** (duração produtiva × meta do dia ÷ horas
produtivas). Marcar as três como "REAL" afirmaria como medido um número que é
estimado — e é exatamente esse tipo de confusão que as etiquetas existem para
evitar.

---

## v7.38.0 — 04/09/2026

**Atenção** — **o SIMULADOR DE INVESTIMENTO mudou de endereço.** Ele estava no
rodapé da aba GESTÃO DE PERDAS; agora tem **aba própria (💡 SIMULADOR)** e
**filtro de datas próprio**. Nenhuma conta mudou — o cenário que você já tinha
digitado (causas marcadas, custo-hora, pessoas, HE, investimento) continua
salvo e aparece na aba nova. Na GESTÃO DE PERDAS ficou o botão **ABRIR O
SIMULADOR** no lugar onde o bloco vivia.

### Por que separar

A proposta de um equipamento raramente se decide na mesma janela em que se
acompanha a perda: a gestão olha os **30 dias rolando**, e a justificativa de um
investimento pede o recorte que o gestor escolher — um mês fechado, um
trimestre. Com os dois no mesmo filtro, mudar o período para montar a proposta
mexia na tela de acompanhamento, e vice-versa.

A aba nova tem o mesmo filtro das outras: **DE / ATÉ**, presets **7 · 15 · 30 ·
90 DIAS · MÊS** (padrão **30 dias**, igual ao da gestão de perdas), **ATUALIZAR**
e o botão **IMPRESSÃO EXECUTIVA** — que agora manda o período **desta** aba
para o PDF.

Abaixo do filtro entrou a **base da simulação**: dias trabalhados no período,
horas produtivas por dia e o tempo de parada não programada. Na aba própria o
gestor não tem mais o quadro da gestão de perdas ao lado para saber de que
período se trata.

### O custo das chamadas não subiu

⚠ `getParadasPeriodo` lê a aba `PARADAS` **inteira** e é a leitura mais cara do
painel. Duas abas com período próprio poderiam virar duas buscas — não viram:

- o **contexto de um período é montado uma vez só** (`_pgContextoDoPeriodo`) e
  guardado no **mesmo cache** (chaveado por `de|ate`, 5 min) que a gestão de
  perdas sempre usou. Período igual nas duas abas = **zero chamada nova**;
- uma requisição **em voo é compartilhada** (`PG_VOO`): se as duas telas pedirem
  a mesma janela ao mesmo tempo, sai **uma** execução no Apps Script, não duas.
  É o mesmo remédio do comparativo por modelo.

Como os dois filtros começam em 30 dias, quem entra nas duas abas sem mexer no
período não paga nenhuma busca a mais do que pagava antes.

---

## v7.37.0 — 04/09/2026

**Atenção** — **nenhum número, fórmula ou premissa mudou.** Esta versão mexe só
na **apresentação** da PROPOSTA DE INVESTIMENTO (o PDF da IMPRESSÃO EXECUTIVA)
e na linha do **ganho anual** dentro do simulador. Quem conferir a proposta de
ontem contra a de hoje encontra exatamente os mesmos valores.

### O ganho anual saiu da nota de rodapé

Pedido do usuário: *"melhorar o foco no ganho anual"*. O ano aparecia em 8–10px
cinza, no fim da linha de explicação — e é ele que se compara com o orçamento
de um equipamento. Agora cada card de ganho (tempo, caixas, custo da parada,
economia em HE) tem **uma linha só para o ano**, em corpo de texto, logo abaixo
do número grande, na tela e no papel.

**O número grande continua sendo o MÊS**, de propósito: é ele que alimenta o
payback e é a leitura do dia a dia. O ano é `mês típico × 12` — a mesma conta
de sempre.

### A proposta virou documento de diretoria

O PDF foi redesenhado seguindo o roteiro **PROBLEMA → CENÁRIO SIMULADO → GANHO
SIMULADO → INVESTIMENTO → RETORNO**, que agora aparece escrito como fio
condutor no alto da folha 1:

- **capa executiva** na folha 1: a proposta em uma frase, os três números do
  problema (ocorrências, tempo parado, caixas perdidas) em cartões grandes, a
  tabela de causas, as premissas do cenário e o quadro do ganho — tudo antes da
  primeira quebra de página;
- **INVESTIMENTO e RETORNO ganharam seção própria.** Sem orçamento, o papel diz
  o estado em vez de esconder a lacuna: **AGUARDANDO ORÇAMENTO**, com payback e
  ROI escritos como **"não calculado — aguardando orçamento"**. Nenhum valor é
  estimado, e a régua de decisão (*"cada R$ 10.000 de investimento se paga em
  X meses"*) continua com a mesma redação;
- **a metodologia virou nota técnica** (sete blocos, texto idêntico) em vez de
  tabela, com corpo de leitura maior;
- **SIMULAÇÃO DE POTENCIAL · É SIMULAÇÃO, NÃO MEDIÇÃO** vai no alto do
  documento, e a frase *"ganho de capacidade não é economia de caixa"* fecha o
  quadro do ganho — capacidade recuperada não é dinheiro economizado.

**Menos cor, e só onde ela tem função.** Os cards de ganho vinham com a barra
**vermelha** do relatório de controle (lá ela marca perda); aqui o neutro é
cinza, e sobraram o verde da capacidade, o laranja da economia em HE e o âmbar
do selo de simulação. "Aguardando orçamento" saiu do vermelho para o âmbar: é
estado pendente, não erro.

⚠ **O CSS compartilhado não foi tocado.** O `<head>` e as ~150 regras do
`_rpDocParadas` continuam servindo os quatro relatórios (paradas, gestão de
perdas, minutos/1.000 e a proposta) — a pele nova é **escopada em `.prop`** e o
`relatorios.test.js` falha se alguma regra dela escapar do escopo. Os outros
três relatórios saem exatamente como saíam.

---

## v7.36.0 · mobile 1.15.0 — 01/09/2026

**Atenção** — **o número grande da EFICIÊNCIA virou o % da META DO DIA.** Pedido
do usuário no mesmo dia: *"essa eficiência está confundindo as pessoas"*.

A TV mostrava **EFICIÊNCIA 103,8%** em verde, com **DENTRO DA META** embaixo,
num dia que tinha **780 cx de uma meta de 2.700**. Os dois números estavam
certos — 103,8% é 780 ÷ **751**, o que a meta do dia pedia até aquela altura do
turno —, mas na mesma tela havia **dois "%" e dois sentidos da palavra META**, e
quem passa e lê de longe fica com o primeiro.

Agora, nas três telas (TV, gerencial e celular):

- o **número grande** é o que qualquer um confere de cabeça: **28,9% DA META DO
  DIA** (780 ÷ 2.700), e ele sai em **tinta**, sem cor de status;
- quem **julga** é o selo, e ele fala de **RITMO**: `NO RITMO` · `ATENÇÃO` ·
  `ABAIXO DO RITMO` — a palavra META não aparece mais ao lado do percentual;
- a linha de apoio traz **caixas, não um segundo percentual**: *"780 de 751 cx
  esperadas até agora"*;
- a barra segmentada da Tela B enche pelo % do dia e pega a **cor do selo**.

**A conta não mudou.** O ritmo continua saindo do `efNoRitmo` (realizado ÷ o que
a meta do dia pedia até agora, rateada por minutos de turno) e continua sendo
ele quem pinta a tela — trocou **qual número ocupa o lugar grande**. O veredito
virou texto único do núcleo (`slRitmo`, `rp-core.js`): TV, desktop e celular não
podem responder "estamos no ritmo?" com palavras diferentes.

---

## v7.35.0 · mobile 1.14.0 — 01/09/2026

**Atenção** — **a hora extra deixou de ser julgada também no gerencial de HOJE.**
O backend passou a marcar `he` por **horário** (fora da jornada 07:00–17:00), e
não mais só pelo rótulo `HE `: num dia liberado pela célula `C3=5`, as horas de
**05:00** e **06:00** chegam ao painel marcadas como hora extra. Só que a tela ao
vivo continuava cobrando meta delas — o mesmo defeito que a v7.34.0 já tinha
tirado do gerencial de **dia passado**.

Medido em **01/09/2026**, às 06:55: as duas horas de hora extra apareciam com
**META/H 245**, eficiência **98,0%** e **144,0%** e o selo **OK**; eram, ao mesmo
tempo, o **PICO (06:00)** e o **VALE (05:00)** de um turno que ainda nem tinha
começado; e o `(+5)` que faltou às 05:00 era cobrado da hora seguinte.

Agora, no gerencial (desktop e celular), a hora de HE aparece com **`—`** em
META/H e EFICIÊNCIA e ganha a etiqueta **HORA EXTRA** no lugar do veredito; ela
**não disputa** o PICO/VALE nem o MELHOR/PIOR HORA (a mesma base que o FECHAR DIA
já gravava no `HISTORICO`); e **não entra no atraso acumulado** — nem cobrando,
nem quitando o atraso das horas de jornada com caixas feitas fora do turno.

**Os números mudam** nos dias com produção fora do turno: sem hora de jornada
lançada, PICO/VALE e MELHOR/PIOR HORA mostram **`—`** em vez do horário de HE, e
o atraso de cada hora cai pelo que a hora extra estava passando adiante. **O que
NÃO mudou:** PRODUÇÃO REAL, META DO DIA, CAIXAS EM HORA EXTRA, EFICIÊNCIA do
card, RITMO ATUAL, PROJEÇÃO e RITMO NECESSÁRIO — as caixas da HE continuam
contando para a meta do dia, e a **TV OPERACIONAL** continua mostrando a meta da
hora, que é o ritmo que o operador acompanha durante a hora extra.

---

## v7.34.0 — 31/08/2026

**Atenção** — **no gerencial de um DIA PASSADO, a meta por hora mudou e a hora
extra deixou de ser julgada.** A tela repartia a meta do dia entre **todas** as
horas arquivadas. Num dia que começou às 05:00 isso fazia duas coisas erradas de
uma vez: dava meta a horas de **hora extra** — que não têm meta na planilha — e
**diluía** a meta das horas de jornada.

Medido em **28/08/2026**: 1.881 ÷ 11 = **171** para todas as horas, quando as 9
horas de jornada pediam **209**. A madrugada (96 cx às 05:00) aparecia como
`ABAIXO` e virava o **VALE DE PRODUÇÃO** do dia.

Agora a meta do dia é repartida **só entre as horas de jornada**, e a hora extra
aparece com `—` em META/H e EFICIÊNCIA, com a etiqueta **HORA EXTRA** no lugar
do veredito. **PICO** e **VALE** também passam a olhar só as horas de jornada.
**Os números por hora mudam** nos dias com produção fora do turno: no 28/08, as
horas de jornada saem de 75,4% para 61,7% — a leitura honesta contra a meta que
elas de fato tinham.

---

## v7.33.0 — 31/08/2026

**Corrigido** — **o FECHAR DIA zerava a coluna MEDIA CX/H.** O `saveDay` grava
`p.mediaH || 0` e o botão nunca mandava esse campo, então toda vez que o gestor
fechava o dia na mão a média ia a **zero** — e, sendo upsert por data, apagava
também o valor que o fechamento automático já tinha escrito. Medido na planilha
real: das **69 linhas do `HISTORICO`, as 17 fechadas pelo botão** estavam com a
média zerada. Agora o botão manda a média com a MESMA definição do fechamento
automático (realizado ÷ horas produtivas, as não-HE), e **MELHOR H./PIOR H.**
passam a olhar só as horas não-HE, como o `.gs` sempre fez.

---

## v7.32.0 — 31/08/2026

**Atenção** — **o FECHAR DIA gravava, na mesma linha do `HISTORICO`, uma meta e
uma eficiência calculadas com metas DIFERENTES.** A coluna META recebia a meta
do dia (que no modo Sheets vem da PROGRAMAÇÃO) e a coluna EFICIÊNCIA recebia o
realizado ÷ meta das **horas já lançadas** (a meta/hora da `HORA_A_HORA`).
Enquanto as duas concordam ninguém percebe. Em **28/08/2026** a linha ficou com
**META 1.881 e EF 100,6%** — 100,6% é 1.509 ÷ 1.500 —, e por isso o relatório
semanal (que lê a coluna EF) imprimia *"100,6% · NA META"* enquanto o bloco do
gerencial (que divide realizado ÷ meta) mostrava **80,2%** para o mesmo dia.

A partir daqui o botão grava `EF = realizado ÷ META da própria linha`, que é o
que o **fechamento automático das 17:05 sempre fez** — quem estava fora do
padrão era o botão. **O número gravado muda** nos dias em que as duas metas
divergem; os dias já gravados continuam como estão (corrigir um dia antigo é
editar a linha na planilha).

---

## v7.31.0 — 31/08/2026

**Novo** — o DETALHAMENTO POR DIA do relatório semanal ganhou a coluna
**META/H** (pedido do usuário): a meta do dia dividida pelas **horas do turno**.
É a régua que faltava para as colunas MELHOR H. e PIOR H. — 300 e 109 cx são
números soltos até se saber que a hora pedia 156. A conta vai escrita embaixo da
tabela, porque a hora extra não tem meta na planilha e um dia antigo pode ter
rodado com outro turno.

**Atenção** — **segunda passada de cor no relatório semanal** (*"ainda muita
cor"*). Agora **o número é sempre tinta e o veredito é o selo**: EFICIÊNCIA,
EF. S/ HE, H. EXTRA e as caixas perdidas por motivo saem em grafite, e quem diz
se o dia bateu a meta é o selo NA META / ATENÇÃO / ABAIXO, que continua
colorido e com a palavra escrita. No resumo sobrou **um** número colorido — o da
EFICIÊNCIA da semana, que é o veredito do período — e nas paradas, o das caixas
perdidas. **Nenhum número mudou.**

**Atenção** — no gráfico, **todas as barras passaram a ter a mesma tinta**. Quem
mostra o dia que ficou abaixo é o fantasma da meta aparecendo por cima da barra
— é o gráfico clássico de realizado × alvo — e o percentual, que fica vermelho
só nesse caso. A faixa listrada da hora extra continua.

---

## v7.30.0 — 31/08/2026

**Novo** — o **RELATÓRIO SEMANAL** passou a fechar com **PARADAS DA SEMANA — O
QUE DEIXAMOS DE EMBALAR**: caixas perdidas (e quanto isso pesa na meta da
semana), tempo parado, nº de paradas, disponibilidade e a tabela de **motivos**
com tempo e caixas de cada um. O papel contava quanto saiu e não contava o que
ficou pelo caminho. A busca e a conta são as **mesmas** da aba PARADAS e da
GESTÃO DE PERDAS — nenhum número novo, nenhuma fórmula nova. Parada **prevista**
entra com o tempo e zero caixa; parada dentro do almoço fica fora, como já era.
Sem Google Sheets, sem o `paradas-calc.js` ou com a busca falhando, o relatório
sai **inteiro, só sem essa seção**.

**Atenção** — **o layout do relatório semanal mudou** (pedido do usuário: *"deixar
profissional, menos cor"*). O corpo do documento virou **grafite sobre branco** e
a cor ficou reservada para o que tem função: status de meta, hora extra e as
caixas perdidas. Saíram as seis bordas coloridas dos cards, os valores pintados
sem motivo, o título de seção em vermelho e os emojis (🏆 📉) — que num papel de
reunião pesam mais que informam. **Nenhum número mudou.**

**Atenção** — **o gráfico dos relatórios (semanal e histórico) seguiu a mesma
régua**: a barra do dia é grafite quando o dia entregou e só o dia **abaixo do
planejado** ganha cor; o fantasma da meta ficou cinza. Bater a meta é o
esperado, e pintar o esperado de verde gasta a atenção que o dia ruim precisa.
A faixa listrada da hora extra continua, em âmbar de impressão.

**Corrigido** — o relatório não parte mais blocos ao meio na impressão: título
de seção não fica órfão no pé da folha e o quadro de KPIs, a faixa de alerta e o
gráfico não se dividem entre duas páginas.

---

## v7.29.0 / mobile 1.13.0 — 31/08/2026

**Atenção** — **o verde/vermelho do painel mudou de régua, e o número da
EFICIÊNCIA junto.** O cartão mostrava o percentual da **meta do dia** pintado
com a cor de **outra conta**: o ritmo contra a meta/hora da aba `HORA_A_HORA`.
Enquanto as duas metas concordam ninguém percebe. Em 31/08/2026 elas
discordavam em 84% — a PROGRAMAÇÃO pedia **2.709 cx** no dia e a `HORA_A_HORA`
planejava **164 cx/h** (1.476 no dia) — e a TV escreveu **49,8% em VERDE, com
"DENTRO DA META"**, ao lado de uma PROJEÇÃO FINAL de 1.519 contra meta de 2.709.

A partir daqui a régua é **uma só e é a META DO DIA**: realizado ÷ o quanto dela
já deveria estar feito a esta altura do turno (rateio por **minutos** rodados —
o slot pós-almoço vale 48 min — e só as horas **com lançamento**, porque hora
que ninguém apontou não é hora atrasada). No mesmo dado de cima o cartão passa a
mostrar **56,2% em vermelho** e *ABAIXO DO PLANEJADO*.

**O que muda na tela:** o número grande da EFICIÊNCIA agora é esse ritmo, e o
percentual da meta do dia — o que estava no número antes — continua visível, na
linha de apoio (*"49,8% DA META DO DIA"*), na TV e no gerencial. Vale para a
**TV (telas A e B), o gerencial do desktop e o gerencial do celular**, que agora
julgam o mesmo instante pela mesma conta (`efNoRitmo`, no `rp-core.js`).

**Nada muda** nos dias em que a meta do dia bate com a soma das metas/hora — que
é o caso normal.

---

## v7.28.0 — 31/08/2026

**Atenção** — **o gráfico do relatório mudou de desenho** (semanal e histórico).
A barra de cada dia agora mostra, na fatia **listrada âmbar** do topo, quanto
daquele dia foi feito em **hora extra**, com a quantidade escrita ao lado
(*"264 cx em HE"*) e a legenda nomeando a faixa. Antes a barra só dizia o total:
uma sexta com 100,6% parecia dia que bateu a meta dentro do turno, com 264 das
1.509 caixas feitas depois das 17:00 — enquanto o selo, o card EFIC. SEM
H. EXTRA e a faixa de alerta, no mesmo papel, já diziam o contrário.
**Nenhum número muda:** o total, a eficiência e as cores de cada dia continuam
os mesmos. Período sem hora extra sai igual ao de antes, sem faixa nem legenda
sobrando (mesma regra da coluna H. EXTRA). Em período longo (15/30 dias) a
faixa fica e só o rótulo sai — a essa largura os textos viravam borrão.

**Corrigido** — **o resumo do WhatsApp chegava com os ícones quebrados.** Em
31/08/2026 a mensagem saiu com TODOS os marcadores virados losango — o 📦 do
título, o ⚠️ do veredito, o ▪ das linhas e o 🏆 do melhor dia, todos como `◆` —
enquanto `·`, `—` e o *negrito* chegaram intactos na mesma mensagem. Emoji
depende da fonte de quem recebe. O resumo foi reescrito **sem nenhum emoji**: a
hierarquia sai do negrito e das linhas em branco, o melhor dia vira uma linha
escrita e o veredito vai em negrito.

**Novo** — o resumo do WhatsApp diz **quanto de cada dia foi hora extra**
(*"ter 25/08 — 1.993 cx (88,6%) · 286 em hora extra"*), traz o quanto teria
faltado sem ela e avisa quando a semana ainda está **parcial** — antes ele dava
veredito de meta sobre uma semana pela metade.

---

## v7.27.0 — 31/08/2026

**Novo** — o bloco **FECHAMENTO DA SEMANA PASSADA** (aba GERENCIAL) ganhou os
botões **🖨 IMPRIMIR SEMANA** e **📲 WHATSAPP**. Divulgar a semana é o que se faz
com esse bloco, e era justamente o que não dava para fazer dali: o relatório
morava na aba HISTÓRICO e saía pela data do filtro **de lá**. Os dois botões
mandam a semana que está na tela — o papel nunca sai com outra semana que não a
que o gestor está vendo.

**Corrigido** — o **RELATÓRIO SEMANAL** numa **segunda-feira**. A semana em curso
ainda não tem nenhum dia fechado, e em vez do relatório o botão abria um alerta
mandando ajustar o filtro *"Até"* — exatamente no dia em que o resultado da
semana é divulgado. Agora ele cai sozinho na **semana passada**, que é a regra
que o resumo do WhatsApp já seguia; a regra virou uma só para os dois
(`_relSemanaParaDivulgar`). **Nenhum número muda:** para uma semana com dias
fechados, o relatório sai igual ao de antes.

**Corrigido** — pedir o relatório de uma semana sem dado deixava aberta a janela
em branco do *"Carregando relatório…"*, que parecia pop-up travado. Agora ela
fecha junto com o aviso.

**Removido** — o botão **📌 PUBLICAR NO MURAL** e tudo que vinha com ele (campo
*MURAL — RADAR DIÁRIO* nas configurações, a chave `muralUrl` e o resumo próprio
do mural): o mural do Radar não existe mais, e botão de recurso removido só abre
aba em branco.

---

## v7.26.0 / mobile 1.12.0 — 31/08/2026

**Atenção** — ⚠ **re-deploy**. **A hora extra passou a ser contada pelo
horário, não só pelo rótulo.** A jornada normal é **07:00–17:00**; tudo fora
dela conta como hora extra, inclusive as horas de 05:00 e 06:00, que nunca
levam o rótulo `HE`. Antes o fechamento só olhava o rótulo: a coluna HE do
`HISTORICO` fechou em **zero nos 69 dias** do histórico, enquanto a produção da
madrugada era hora extra de verdade (em 26/08 foram 407 cx e a coluna gravou 0).
A partir daqui a **HE CX é preenchida sozinha** pelo fechamento, sem depender de
rodar o backfill.

**Atenção** — ⚠ **re-deploy**. A reconstrução dos dias antigos
(`recalcularHoraExtraPassada`) passou a usar a **mesma janela**: antes ela ia até
as 18:00, então a produção das **17:00–18:00 não contava** como hora extra e
agora conta.

**Corrigido** — ⚠ **re-deploy**. Lançamento não é mais **sobrescrito** quando as
colunas de LOTE da hora acabam. Sem coluna livre o valor anterior era apagado e
o realizado da hora caía sem erro nem aviso; agora ele é somado na última
coluna. Em uso real são 10 colunas (`LANÇ 1`…`LANÇ 10`) e um dia normal já usa 7.

**Corrigido** — o **atraso acumulado** deixou de cobrar hora que ainda não
aconteceu. Num dia 12 cx atrás às 14:30, a linha das 16:00 mostrava `(+190)` e
meta efetiva de 368 cx. **O número exibido muda:** o atraso das horas futuras
cai para o déficit real das horas já fechadas.

**Corrigido** — as **caixas perdidas em paradas** passaram a arredondar uma vez
só, no fim. Somar o arredondado de cada parada descartava a fração de todas
elas: 30 paradas de 3 min davam 270 cx em vez de 273, e num caso de meta baixa o
total sumia inteiro (0 em vez de 10 cx). **O número exibido sobe** um pouco em
períodos com muitas paradas curtas.

**Corrigido** — o turno gerado pelo painel desktop saía `12:12–13:12` em vez de
`12:12–13:00`, deslocando a tarde inteira. Valia no modo DEMO, no import de
Excel e quando não havia linha do dia.

**Corrigido** — RITMO NECESSÁRIO não imprime mais valor negativo quando a meta
já foi batida; mostra **META OK**.

**Corrigido** — HORAS PRODUTIVAS somava `nº de horas × 60`, ignorando que o slot
pós-almoço tem 48 min: mostrava 6,0 h onde a soma real era 5,8 h.

**Corrigido** — HORA EXTRA e FECHAR DIA passaram a **retentar** (3×). Eram as
duas únicas gravações com uma tentativa só, justamente as que pegam o servidor
frio. A hora extra aparecia salva na tela mesmo sem chegar na planilha, e o
FECHAR DIA falhava em silêncio depois de prometer gravar.

**Corrigido** — no app do operador, o modal de lançamento **não fecha mais ao
tocar fora**: a área escura ao redor apagava a quantidade digitada sem
confirmação.

**Novo** — a **COBERTURA DO APONTAMENTO** aparece na tela do comparativo por
modelo, não só no PDF. Abaixo de 80% ela fica em âmbar: os números são amostra,
não o período inteiro.

**Novo** — o card EFICIÊNCIA diz as **duas leituras** que já usava: o número é o
% da meta do dia, a cor é o ritmo até agora.

**Corrigido** — mensagens de erro deixaram de mostrar a exceção crua
("`Timeout`", "`Erro ao buscar paradas: ...`") e passaram a dizer o que
aconteceu e o que fazer.

**Corrigido** — legibilidade: o cinza mais escuro do painel tinha contraste de
1,5:1 (mínimo legível é 4,5:1). Afetava "Carregando dados…", o rodapé, o botão
FECHAR e a linha "desde HH:MM" da tela cheia de PRODUÇÃO PARADA, lida a 15 m.

**Corrigido** — o upload de logo do desktop estava quebrado, e quem tinha logo
salvo não o via mais voltar.

**Atenção** — "PEÇAS PERDIDAS" virou **"CAIXAS PERDIDAS"** no desktop. Mesmo
indicador, mesmo número: o app do operador já chamava assim, e o produto conta
caixa.

**Corrigido** — ⚠ **re-deploy**. As colunas `MEDIDA DA CAIXA` e `VELOCIDADE` do
catálogo passaram a ser lidas por prefixo. Com o título trazendo a unidade
junto, o teto da esteira saía **zero em silêncio** e a coluna % TETO EST. sumia
sem explicar.

---

## Antes da v7.26.0

O histórico anterior está nos títulos dos pull requests do repositório. Este
arquivo começa aqui: até a v7.25.0 o único rastro de versão era o número no
rodapé do painel.
