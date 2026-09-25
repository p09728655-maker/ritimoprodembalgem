# Notas de versão — RitmoPatrimar · Embalagem

Uma entrada por publicação. **Atenção** é obrigatório em toda mudança que altera
um número exibido ou o formato de um arquivo — o gestor precisa saber por que o
indicador da semana passada mudou.

O número da versão é o `APP_VER` no topo de cada painel: `v7.x` é o desktop
(gerencial + TV), `mobile 1.x` é o app do operador. Mudança no
`ritmoprod_appscript.gs` **não sobe pela Vercel** — exige colar no editor do
Apps Script e re-deployar; essas vêm marcadas com ⚠ **re-deploy**.

---

## v7.125.0 — 25/09/2026

- Diretoria: enquanto os pontos da semana chegam sem a separação de hora extra
  (leitura feita antes do `.gs` v5.20), a tela confere de novo a cada **5 min**
  (eram 30). Com a separação, a leitura continua valendo 6 h — semana fechada
  não muda. Falha de leitura tenta de novo em 5 min (eram 10).

**Atenção:** nenhum número muda.

---

## v7.124.0 — 25/09/2026

- **Diretoria: pausa discreta** (PPCP). As bolinhas do rodapé levam direto à
  tela e param nela; o botão ⏸ (apagado, acende com o mouse) para e retoma. A
  escolha fica guardada no aparelho — as recargas automáticas voltam para a
  mesma tela, parada. Pausada, a tela continua atualizando o dado.

**Atenção:** nenhum número muda.

---

## v7.123.0 — 25/09/2026

- **Diretoria no app instalado: o gráfico ficava miúdo** no meio da caixa. Ele
  media o próprio desenho no instante em que a janela abria (e as fontes ainda
  chegavam). Agora mede a CAIXA e se redesenha sempre que ela muda de tamanho
  (janela, tela cheia, fontes).
- Semana: o rótulo "PONTOS com HE" não fica mais separado.
- **Pontos da semana com e sem hora extra** (PPCP: *"pontos não separou?"*) —
  ⚠ **re-deploy do `.gs` v5.20**. A leitura do período passa a somar os pontos
  das horas fora de 07:00–17:00 (`pontosHe`, mesma régua das caixas), exato,
  sem rateio. Até o re-deploy o card continua dizendo "sem HE não separado".
  (O número v5.19 foi pulado: é o de uma versão que nunca deve ser colada.)

**Atenção:** nenhum número muda.

---

## v7.122.0 — 25/09/2026

- **Instalar a diretoria pelo endereço próprio** (PPCP: *"não tem como
  baixar"*): em `diretoria-patrimar.vercel.app` a página abre em `/`, e o
  manifest da diretoria valia só para `/diretoria` — o Chrome não oferecia
  instalar. Agora esse endereço usa `manifest-diretoria-site.json` (escopo o
  site inteiro, tela cheia).

**Atenção:** nenhum número muda.

---

## v7.121.0 · mobile 1.31.0 — 25/09/2026

**Endereço próprio da diretoria** (PPCP: *"se eles baixarem vai abrir
tudo"*). Aberto por um endereço que começa com `diretoria` (o novo
`diretoria-patrimar.vercel.app`), o site **só mostra a diretoria** — qualquer
caminho, sem login, sem abas; o app do celular também cai nela. Apagar o
`/diretoria` do endereço não leva ao painel. O endereço de sempre não muda.
⚠ Separa a TELA, não é segurança da informação: o dado vem do Apps Script, cujo
endereço é público.

**Atenção:** nenhum número muda. Sem re-deploy do `.gs`.

---

## v7.120.0 · mobile 1.30.0 — 25/09/2026

**Enxugamento, blocos B e C** (PPCP: *"segue com tudo"*). Nenhum número saiu;
avisos de falha e de estado ficaram; explicação foi para o tooltip.
- **GERENCIAL:** subtítulos de HORA EXTRA, PROJEÇÃO, PONTOS e PESO curtos
  (a conta no tooltip); PICO/VALE só com as caixas.
- **PARADAS:** os três "insights" que repetiam os cards (disponibilidade, tempo
  parado, caixas perdidas) saíram — fica a causa nº 1; recomendação e ganho por
  causa em uma linha; a linha do método mostra só a conta que se compara com o
  celular (o resto no tooltip) e diz **CAIXAS** perdidas.
- **PRODUÇÃO/HORA:** a linha de totais fica com os números; a legenda de cor,
  ▼ e % TETO vai para o tooltip (o aviso de SIMULAÇÃO continua visível).
- **PROGRAMAÇÃO** (modal de capacidade) e **HISTÓRICO**: notas curtas.
- **Celular (gerencial):** o card **GAP DA META saiu** — o "faltam X cx" foi
  para o card META DO DIA, como no PC; subtítulos curtos; paradas e histórico
  mais enxutos. **Operador:** só a instrução do produto e a confirmação do
  início às 05:00 ficaram mais curtas.
- **Card UEP DO DIA (PC e celular, texto único):** *"NO RITMO · 1.150 de 1.152
  esperadas · meta 2.530"*.

**Diretoria:** a programação espera até 60 s por tentativa (a tela PRÓXIMOS
DIAS dizia "não consegui ler a programação" com 25 s), e o aviso de servidor
lento é mais claro.

**Atenção:** nenhum número muda. Celular sobe para 1.30.0 (barra de
atualização). Sem re-deploy.

---

## v7.119.0 — 25/09/2026

- **Diretoria abre na hora** (PPCP: *"está demorando a leitura"*). A cada
  recarga (versão nova, anti-descanso de 28 min) a tela HOJE ficava mais de um
  minuto em "Aguardando a leitura do dia…" com o Apps Script frio. Agora o
  último retrato bom (planilha do dia, leitura do dia, histórico, programação)
  fica no aparelho e a tela abre com ele; a leitura nova troca quando chega. A
  hora do dado continua no topo e fica **âmbar com ⚠** passados 15 min. O do dia
  só vale no mesmo dia.
- **App próprio da diretoria**: instalado a partir de `/diretoria` (ícone de
  instalar na barra do Chrome/Edge), abre direto na diretoria em tela cheia
  (`manifest-diretoria.json`). Antes, instalar dali abria o painel normal.

**Atenção:** nenhum número muda. Sem re-deploy.

---

## v7.118.0 — 25/09/2026

**Enxugamento, bloco A — PLANO, GESTÃO DE PERDAS e SIMULADOR** (PPCP: *"tem
muita coisa escrita"*). Nenhum número saiu; avisos de falha e de estado ficaram.
- **PLANO:** os dois parágrafos "Como ler" ficam recolhidos atrás de **ⓘ COMO
  LER**. Visível, em uma linha, o que não pode ser esquecido: *isto mede o
  PLANO, não a linha · não é baixar a meta* e *a faixa é uma mediana · nivelar
  não é sequenciar*. Descrições dos vereditos e subtítulos dos cards curtos;
  a explicação do mix foi para o tooltip.
- **GESTÃO DE PERDAS:** notas longas saíram da tela (os botões ganharam
  tooltip); a nota da tabela por semana/mês e a do plano de ação têm versão curta
  na tela — **o PDF continua com o texto inteiro** (`.so-tela` / `.so-papel`).
- **SIMULADOR:** subtítulos dos cards e das faixas curtos; a nota da IA virou
  uma linha, e *"a assinatura é sua, não do modelo"* continua na tela.

**Tela da diretoria:** cada quantidade mostra **sem hora extra** (número
grande) e **com hora extra** embaixo — UEP, caixas e pontos. Os pontos da
semana não se separam por hora: o card diz *"sem HE não separado"* em vez de
inventar. Na semana, o gráfico dos últimos dias ganhou espaço e números
maiores.

**Diretoria, tela HOJE: o gráfico HORA A HORA em UEP** (PPCP: *"coloca na
tela hoje"*) — o mesmo desenho da aba ⚖ UEP (hora em andamento sem veredito,
HE listrada), na proporção da TV. O "com HE" subiu para a linha do rótulo de
cada card e a projeção foi para dentro do card da UEP, para o gráfico caber. No
gráfico (aba e diretoria), o número de uma barra abaixo da meta sobe acima do
tracejado — antes a linha passava por cima dele.

**Atenção:** nenhum número muda. Sem re-deploy.

---

## v7.117.0 — 25/09/2026

- **Diretoria: "não consegui ler o histórico" corrigido.** No `/diretoria` o
  painel disparava, junto com a leitura do histórico, chamadas que só servem à
  TV da fábrica (poll de paradas a cada 15 s, médias por horário). O Apps
  Script atende uma chamada por vez e o `getHistory` estourava o tempo. Agora
  elas não rodam na diretoria, e as leituras dela só começam depois da carga
  inicial.
- **Logomarca da Patrimar** no topo das três telas da diretoria.
- **PRÓXIMOS DIAS no formato de cartão também na aba ⚖ UEP e na impressão**
  (PPCP: *"esqueceu disso"*): faixa de status, selo cheio FALTA / FOLGA, horas
  previstas, UEP · caixas · pontos, lotes e o mais pesado. O trilho de barras
  saiu. UM desenho (`_gpxCartaoHtml`) para diretoria, aba e papel.

**Atenção:** nenhum número muda. O selo vermelho diz "FALTA Xh" (era "NÃO
CABE · FALTA"): a cor continua sendo o veredito (âmbar até 1h45, vermelho
acima). Sem re-deploy.

---

## v7.116.0 — 25/09/2026

**TELA DA DIRETORIA — endereço próprio: `/diretoria`** (PPCP, maquete
aprovada). Carrossel de 3 telas, 20 s cada, lido a 3–4 m, sem login, fundo
azul: **HOJE** (selo de ritmo, UEP com esperado e meta, caixas e pontos da
jornada, projeção e hora extra), **SEMANA PASSADA** (selo META BATIDA / ABAIXO
DA META, UEP, caixas de jornada e pontos, e os últimos 10 dias fechados contra a
meta) e **PRÓXIMOS DIAS** (cartão por dia com FALTA / FOLGA, horas previstas,
UEP · caixas · pontos, lotes e o mais pesado).
- Um veredito só: selo e cor são da UEP; caixas e pontos são número.
- Nenhuma conta nova: hoje é a montagem da aba ⚖ UEP, a semana é a mesma do
  relatório semanal, a carteira é o PRÓXIMOS DIAS. A única leitura a mais é a
  dos PONTOS da semana passada (getProducaoModeloPeriodo), a cada 6 h, guardada
  no aparelho.
- Pontos só enxergam caixas lançadas **com produto**: quando cobrem menos de
  95% das caixas, a tela diz quanto. Pontos da semana incluem hora extra.
- Versão nova recarrega sozinha; a TV da sala não apaga (mesmo anti-descanso da
  TV da fábrica).

**Aba ⚖ UEP enxuta** (PPCP: *"tem muita coisa escrita"*): frases de apoio
dos títulos, notas longas e o rodapé saíram da tela; as explicações foram para
o tooltip. Nenhum número saiu.

**Atenção:** nenhum número muda. Sem re-deploy do `.gs` (o getProducaoModeloPeriodo
já manda os pontos). A carteira passou a somar os pontos da programação por dia
(campo adicional, só a diretoria lê).

---

## v7.115.0 · mobile 1.29.0 — 25/09/2026

**Painel em azul-marinho no PC e no celular; a TV continua preta** (PPCP: *"eu
gostei da cor dessa imagem"*, teste com capturas aprovado). Trocou só a base —
fundo, cards, bordas e texto secundário —, com verde e vermelho um pouco mais
vivos (o vermelho clareado para passar de 4,5:1 como texto sobre o card). O
laranja da marca e a regra "cor só onde há função" continuam: nenhuma borda
colorida de enfeite. A TV física (`?tv`), a aba TV OPERACIONAL e a tela cheia
mantêm o preto, onde o contraste a 15 m foi medido. Impressões continuam
brancas.

**Atenção:** nenhum número muda. Celular sobe para 1.29.0 (barra de
atualização). Sem re-deploy.

---

## v7.114.0 · mobile 1.28.0 — 25/09/2026

**Aba ⚖ UEP: leitura mais precisa, sem indicador novo** (PPCP, prompt de
evolução do dashboard gerencial UEP; diagnóstico e plano aprovados).

- **A hora em andamento não é mais julgada.** Às 14:50 a hora das 14:00 saía
  VERMELHA com 244 UEP contra a meta de 288 da hora cheia — faltavam 10 min.
  Agora ela aparece tracejada, sem cor de veredito, com o rótulo "até 14:50";
  a hora que ainda não chegou fica apagada. Tela e impressão.
- **UEP ATÉ AGORA** escreve o desvio: *"+209 UEP (110,7% do esperado) ·
  esperado até agora 1.890"* — sai do mesmo esperado do card.
- **PROJEÇÃO DO DIA** diz o que é: *"na média da jornada até agora · só jornada
  normal (hora extra fora)"*. Dizia *"no ritmo de agora"*, e não é a última hora.
- **UEP EM HORA EXTRA** diz onde entra: fora do UEP até agora, da projeção e da
  meta; só no TOTAL DO DIA do mix.
- **CONFIABILIDADE DA UEP virou ORIGEM DA UEP.** "100% medida" quer dizer UEP
  do estudo (ritmo demonstrado, inclusive provisória) ou digitada — não é
  cronoanálise, e o nome antigo prometia exatidão. Tela e papel.
- Na tela, os blocos seguem a ordem em que aparecem: 4 ORIGEM · 5 PERÍODO ·
  6 PRÓXIMOS DIAS (o 5 aparecia antes do 4).
- Barras do mix em cinza (o laranja era enfeite); o critério do âmbar em DIAS
  QUE BATERAM (metade ou mais) foi para o tooltip.
- PRÓXIMOS DIAS: o selo (NÃO CABE / FALTAM / FOLGA / SEM LOTE) abre o cartão,
  em destaque; o nome inteiro do lote vai no tooltip.

**Atenção — muda número:** o **esperado até agora** da UEP (card UEP DO DIA do
gerencial do PC e do celular, e aba ⚖ UEP) passa a contar a hora em andamento
só pelos minutos que já passaram. Antes, a hora corrente entrava inteira assim
que tinha o 1º lançamento. Exemplo às 14:10 com as horas até 14:00 lançadas:
antes 408 min de jornada (esperado 1.959 UEP com meta 2.530); agora 358 min
(esperado 1.719). O selo fica mais justo no começo de cada hora; a **projeção**
e o **UEP POR HORA** sobem junto, pela mesma base; a PRÓXIMOS DIAS passa a
descontar do resto de hoje só o tempo que de fato falta. Hora já fechada não
muda nada, e o dia fechado (HISTORICO) não muda. **O selo em caixas (% DA META
DO DIA) não foi mexido** — continua contando a hora corrente inteira.
Sábado na UEP continua como está (decisão do PPCP). Sem re-deploy do `.gs`.

---

## v7.113.0 — 25/09/2026

**Impressão executiva da UEP: seções sem número, com os nomes da tela** (PPCP:
*"o mix na tela está 3 na impressão 5"*). A folha deitada põe os blocos numa
ordem diferente da aba (o período sobe para a folha 1), e o papel numerava pela
ordem dele. Agora o papel não numera, e cada seção tem o mesmo nome do bloco
na aba: HORA A HORA EM UEP, O MIX DE HOJE, CONFIABILIDADE DA UEP, PERÍODO,
PRÓXIMOS DIAS.

**Atenção:** nenhum número muda. Sem re-deploy.

---

## v7.112.0 — 25/09/2026

**A impressão executiva da UEP leva o PRÓXIMOS DIAS** (PPCP: *"colocar na
impressão próximos dias"*). Ele abre a folha 2, com as horas de cada dia, o
que falta ou sobra, os lotes mais pesados e o total dos 5 dias. É o mesmo
desenho da aba, com a pele do papel. O COMO LER virou **anexo** na folha 3 e
ganhou uma linha explicando a conta do PRÓXIMOS DIAS: com o bloco novo, ele não
cabia mais na folha 2.

**Atenção:** a impressão passa de 2 para 3 folhas (a 3ª é só o COMO LER).
Nenhum número muda. Sem re-deploy.

---

## v7.111.0 — 25/09/2026

**PRÓXIMOS DIAS saiu do GERENCIAL e foi para a aba ⚖ UEP** (PPCP: *"próximo
dia vai para aba uep"*), como bloco **6 · PRÓXIMOS DIAS**, depois do PERÍODO.
Mesma conta, mesmo desenho. A programação só é lida com a aba UEP aberta, então
o gerencial deixa de fazer essa leitura.

**A cor do dia segue o número que aparece.** Um dia com 105,3 min acima da
jornada aparecia como *"NÃO CABE · FALTAM 1h45"* em vermelho, enquanto a
legenda diz âmbar até 1h45. A comparação agora usa o minuto inteiro, o mesmo
que a tela mostra.

**Atenção:** a faixa não aparece mais no gerencial. Nenhum número muda, exceto
a cor de um dia que caia exatamente no limite. Sem re-deploy.

---

## v7.110.0 — 25/09/2026

**Aba PLANO, carteira EM UEP: código sem UEP no cadastro não entra mais pela
média** (PPCP: *"jamais inventar números"* → *"faz ajuste"*). Era a última
tela que ainda estimava: lote de código sem UEP entrava na carga com a UEP
média das outras linhas, e o atraso também. Agora a regra é a mesma da faixa
PRÓXIMOS DIAS do gerencial: essas linhas saem da conta e aparecem listadas
(data, lote, código, produto, caixas) no bloco da carteira, na tela e nos dois
PDFs (🖨 ESTUDO e 🖨 CARTEIRA).

**Aba ⚖ UEP e a impressão executiva também apontam** (PPCP: *"colocar na tela
UEP"*): embaixo da CONFIABILIDADE sai a mesma lista — os **códigos que rodaram
hoje sem UEP** (antes só o percentual) e as **linhas da programação futura sem
UEP**. Nada faltando → *"✓ Nenhum código sem UEP"*. A programação é lida por
último ao abrir a aba, e reaproveitada das outras abas se tiver menos de 15 min.

**Atenção:** com código sem UEP na programação, a carga em UEP da aba PLANO
**cai** (antes a linha entrava pela média; agora fica fora e é listada). Com o
cadastro completo, nada muda. Os modos CARGA PELO MIX e CAIXAS CRUAS não
mudaram. Sem re-deploy.

---

## v7.109.0 — 25/09/2026

**Gerencial: faixa PRÓXIMOS DIAS — a programação futura em horas de linha**
(PPCP: *"como ficaria as programações futuras como previsão… de horas"*,
maquete aprovada). No fim da aba GERENCIAL, os próximos 5 dias úteis: quantas
horas de linha os lotes já datados pedem contra a jornada de 8h47, o que falta
ou sobra em cada dia, e os 2 lotes mais pesados. Âmbar quando passa até 1h45
da jornada, vermelho (NÃO CABE) quando passa mais que isso, verde quando sobram
3h ou mais. O atraso que não cabe no resto de hoje entra no 1º dia útil. Fim de
semana aparece só se tiver lote, fora das somas de falta e folga.

A carga é a mesma da CARTEIRA EM UEP da aba PLANO. Horas = UEP programada ÷
288 UEP/h (o ritmo da meta, 2.530 UEP em 527 min).

**Linha sem UEP no cadastro não vira hora** (PPCP: *"jamais inventar números"*,
*"apontar as linhas que estão sem UEP"*). Ela sai da conta e é listada embaixo
da faixa (data, lote, código, produto, caixas), e o card do dia diz quantas
caixas ficaram fora. Atraso de código sem UEP também não entra no 1º dia e
aparece na mesma lista. A aba PLANO continua usando a UEP média para esses
códigos, como antes.

**Atenção:** nenhum número existente muda. A programação é relida a cada
15 min para esta faixa (as abas PROGRAMAÇÃO e PLANO podem renovar antes). Sem
re-deploy.

---

## v7.108.0 — 25/09/2026

**Aba ⚖ UEP: o mix mostra também o que rodou em hora extra** (PPCP: *"deve ter
mais produtos"*). A tabela do mix é da jornada normal, a mesma base da meta e
do card. Por isso fechava em 870 cx num dia com 1.068 apontadas, e o produto
que só rodou de madrugada não aparecia em lugar nenhum. Embaixo da linha
JORNADA NORMAL agora vêm **EM HORA EXTRA (fora da meta)**, com caixas, UEP e
quais produtos, e o **TOTAL DO DIA**, que fecha com as caixas da
confiabilidade. As linhas dos produtos e a coluna DO DIA continuam só da
jornada. Vale na tela e na impressão.

**Atenção:** nenhum número muda — a hora extra continua fora da meta e do
card UEP DO DIA. Sem re-deploy.

---

## v7.107.0 — 25/09/2026

**Aba ⚖ UEP sem o buraco no meio** (PPCP: *"esse espaço no meio ficou feio"*).
O gráfico hora a hora é mais alto que o mix de um dia normal, e a coluna da
direita sobrava vazia embaixo. A **CONFIABILIDADE** (bloco 5) subiu para baixo
do mix, e as duas colunas agora terminam na mesma linha. Quando o mix é
comprido e a coluna da direita fica mais alta, o **gráfico hora a hora cresce**
para ocupar a altura em vez de deixar o vazio do outro lado. Em tela estreita
tudo continua empilhado como antes.

**Atenção:** nenhum número muda. Sem re-deploy.

---

## v7.106.0 — 25/09/2026

**Aba ⚖ UEP ganhou 🖨 IMPRIMIR — versão executiva, folha deitada** (PPCP:
*"faça uma impressão com relação a UEPs"* → *"versão executiva"* → *"pode
imprimir folha deitada"*). Duas folhas A4 em paisagem:
- **Folha 1 — o resultado.** Lado a lado, HOJE e o PERÍODO (o filtro 7/15/30
  da aba), cada um com um **selo** (NO RITMO / ATENÇÃO / ABAIXO DO RITMO;
  *N DE M DIAS NA META*) e uma frase com os números. Embaixo, os cards e o
  gráfico de cada um: hoje com o hora a hora, o período com os dias fechados.
- **Folha 2 — o porquê.** O mix de hoje (8 produtos, o resto em "demais"), a
  confiabilidade do dado (medida × estimada × sem UEP) e o COMO LER.

É o retrato da tela no instante do clique: mesma montagem e mesmos gráficos,
nenhuma conta nova e nenhuma chamada nova. Histórico ou cadastro que não
vieram → o relatório sai inteiro e diz o que faltou. No gráfico do período, com
muitos dias, as datas passam a sair uma a cada N (antes se atropelavam) — vale
também para a tela.

**Atenção:** nenhum número muda. Sem re-deploy.

---

## v7.105.0 — 25/09/2026

**Aba ⚖ UEP: o bloco 4 · PERÍODO não diz mais "nenhum dia" quando não
conseguiu ler o histórico** (PPCP, com o `HISTORICO` cheio de UEP na planilha).
A leitura do histórico tem uma tentativa só e, quando falha, devolve lista
vazia sem avisar — sobravam os dias guardados neste computador, que não têm
UEP. Agora a aba reconhece a falha (nenhum dia veio da planilha), tenta **3
vezes em sequência**, e se ainda assim não conseguir diz **"Não consegui ler o
histórico"**, com ↻ e nova tentativa sozinha em 20 s. O histórico da aba também
se renova a cada 2 min enquanto ela está aberta.

**Atenção:** nenhum número muda. Sem re-deploy.

---

## v7.104.0 — 25/09/2026

**Aba ⚖ UEP abre mais rápido** (PPCP: os blocos 4 · PERÍODO e 5 ·
CONFIABILIDADE ficavam em "Lendo…"). O histórico e o cadastro esperavam uma
leitura do dia nova (a mais cara do backend, até 3 × 30 s) que o gerencial já
tinha feito. Agora a aba lê, uma de cada vez: o **histórico** primeiro (em cache
de 2 min), a leitura do dia **só se ela ainda não existir** e o **cadastro** por
último.

**Atenção:** nenhum número muda. Sem re-deploy.

---

## v7.103.0 — 25/09/2026

**Aba ⚖ UEP: bloco 4 · PERÍODO** (a 2ª etapa da maquete, aprovada pelo PPCP).
Filtro **7 · 15 · 30 DIAS** (padrão 15, guardado neste computador):
- **MÉDIA POR DIA** em UEP e o % da meta do período (soma das metas dos dias).
- **DIAS QUE BATERAM** a meta, com as datas dos que ficaram abaixo.
- **OSCILAÇÃO DIA A DIA** em UEP contra a das caixas de jornada nos mesmos
  dias — a mesma conta da oscilação da aba PLANO. Medido de 11/09 a 24/09:
  **9,8% em UEP contra 45,1% em caixas**.
- Gráfico de barras por dia, com a meta de cada dia tracejada; o dia abaixo da
  meta fica vermelho.

**Atenção:** entram só os dias **fechados** com UEP gravada; hoje fica fora.
A UEP de cada dia é a **congelada no fechamento**, com o cadastro daquela data
— a de hoje usa o cadastro atual (com as estimadas `EST`); o rodapé do bloco
avisa. Média e "bateu" são a régua do HISTÓRICO (`uepHistResumo`). Nenhuma
chamada nova (histórico com cache de 2 min), sem re-deploy.

---

## v7.102.0 — 25/09/2026

**Aba ⚖ UEP no gerencial do PC** (maquete aprovada pelo PPCP). Responde: a
linha está entregando trabalho, independente do mix? E quando não entrega,
onde perdeu — na hora, no produto ou no dado?
- **1 · Hoje:** UEP até agora (o mesmo selo do card UEP DO DIA), projeção do
  dia, UEP por hora e UEP em hora extra. Faixa **ATENÇÃO AO DADO** só quando
  ≥ 20% das caixas têm UEP estimada ou ≥ 5% estão sem UEP.
- **2 · Hora a hora em UEP:** barra por hora contra a meta da hora (meta do dia
  × minutos do slot ÷ 527 — ~288, ~230 no slot de 48 min). Hora extra
  listrada, sem meta. Hora lançada sem caixa com produto não vira barra
  vermelha: é falta de dado, não de ritmo.
- **3 · Mix de hoje:** por produto, caixas, UEP/cx, UEP e fatia do dia —
  jornada normal, a mesma base do card.
- **5 · Confiabilidade:** % das caixas de hoje com UEP medida, estimada (`EST`)
  e sem UEP.
- O bloco **4 · período** fica para a 2ª etapa.

**Atenção:** indicadores novos, só nesta aba (TV e app do operador continuam
em caixas). Nenhuma chamada nova além do cadastro que o simulador de
capacidade já lê (cache de 10 min); sem re-deploy. A confiabilidade precisa do
cadastro lido depois desta versão — até lá a aba diz que está lendo. O
glossário também corrige a linha do UEP DO DIA, que ainda dizia 2.300 em 480 min.

---

## v7.101.0 / mobile 1.27.0 — 25/09/2026

**CUSTO POR UEP na aba SIMULADOR** (PPCP: o R$/UEP que saiu do card do dia
vai para *"um lugar estratégico"*). Faixa no topo da aba, com o período do
filtro dela: `R$ 1,38/UEP no período contra R$ 1,33 da meta · ACIMA DO CUSTO
DA META — R$ 253 pagos sem virar UEP · 2 dias fechados com UEP`.
- Conta: custo-hora do cenário × 527 min de jornada normal por dia fechado ÷
  UEP de jornada gravada no `HISTORICO`; a meta é o mesmo custo ÷ soma das
  metas de UEP dos dias (`uepCustoPeriodo`, no `rp-core.js`).
- Sem custo-hora digitado, a faixa pede o custo-hora; sem dia com UEP no
  período, diz isso. Nunca mostra R$ 0.
- Atualiza enquanto o custo-hora é digitado no cenário.

**Atenção:** indicador novo, só nesta aba. Lê o histórico que o painel já
carrega (cache de 2 min) — nenhuma chamada nova ao Apps Script, sem re-deploy.
O custo-hora continua só neste computador. Dia de hoje não entra (ainda não
fechou). Cada dia paga a jornada inteira de 527 min, a mesma base da meta de
UEP.

---

## v7.100.0 / mobile 1.26.0 — 25/09/2026

**Card UEP DO DIA mais simples** (PPCP: *"a explicação … está confusa"* e
*"pode tirar esse valor em reais daí"*).
- **Hoje (PC e celular):** o texto segue o card % DA META DO DIA ao lado —
  selo, feito × esperado, depois a meta.
  Antes: `de 2.530 UEP (55,9%) · NO RITMO — 1.383 esperadas até agora · +410 em HE · R$ 1,28/UEP (meta R$ 1,31)`.
  Agora: `NO RITMO · 1.413 de 1.383 UEP esperadas até agora · meta do dia 2.530 UEP · +410 em HE`.
- **Dia passado:** `111,7% da meta do dia (2.530 UEP)` no lugar de
  `de 2.530 UEP (111,7%)`.
- **O R$/UEP saiu dos dois cards.** A conta (`uepCusto`, no `rp-core.js`)
  continua pronta para quando ele ganhar um lugar próprio.

**Atenção:** nenhum número muda; muda o texto embaixo do card, também no PDF
do dia. Sem re-deploy.

---

## v7.99.0 / mobile 1.25.0 — 25/09/2026

**Meta padrão de UEP volta a 2.530** (PPCP, 25/09/2026: a meta combinada
continua 2.530 e foi digitada de novo no ⚙). Desfaz a troca da v7.98.0 no
`rp-core.js`, nos testes e no texto do campo META DIA (UEP). O `.gs` volta ao
v5.18, que já está publicado com 2.530.

**Atenção:**
- Nenhum número muda: a META_UEP da `CONFIG_PAINEL` (2.530) sempre mandou.
- **Não colar o `.gs` v5.19** da versão anterior. Sem re-deploy.
- No `HISTORICO`, só o dia 24/09 foi gravado com META UEP 2.500 (fechado
  enquanto o ⚙ estava em 2.500). Corrigir à mão a célula N88 para 2530.

---

## v7.98.0 / mobile 1.24.0 — 25/09/2026 · ⚠ re-deploy (.gs v5.19)

**Meta padrão de UEP: 2.530 → 2.500** (PPCP, 25/09/2026). A meta digitada no
⚙ (META DIA UEP) já é 2.500; o padrão do código (`UEP_META_PADRAO` no
`rp-core.js`, `UEP_META_PADRAO_GS` no `.gs`) acompanhou para não voltar a
2.530 calado se a chave `META_UEP` sumir da `CONFIG_PAINEL`.

**Atenção:**
- Com a META_UEP da `CONFIG_PAINEL` preenchida (como está hoje), **nenhum
  número muda** por causa deste deploy — ela sempre mandou sobre o padrão.
- A META UEP gravada no `HISTORICO` dos dias até 23/09 é **2.530** (preenchida
  de uma vez em 24/09, com o padrão da época); o 24/09 foi gravado com 2.500.
  Alinhar à mão a coluna N (META UEP) para 2500 — **não** usar
  `regravarUepPassada()`, que recalcula também a UEP dos dias com o cadastro
  de hoje (com as estimadas `EST`).
- A meta passa de ~288 para **~285 UEP/h**. O alvo do ESTUDO UEP continua
  2.300 em 8 h (~288/h): são réguas diferentes.
- ⚠ **re-deploy** do `.gs` para o padrão do backend valer.

---

## v7.97.0 — 25/09/2026

**A semana do FECHAMENTO DA SEMANA PASSADA ficou legível** (PPCP: *"não
visível a semana que está o resultado"*). No gerencial, a semana virou um selo
(**SEMANA 38**, 15px, laranja com borda) logo ao lado do título, com as datas
(`14/09/2026 a 20/09/2026`) em 13px do lado — antes eram 9px, e as datas
ficavam soltas no canto direito. A Tela D da TV não muda.

**UEP DO DIA no gerencial não fica mais preso em "aguardando"** (PPCP: *"para
ler as UEPs está lento"*). O card depende do `getPontosDia`, a leitura mais
cara do backend, que ia com **uma** tentativa de 25 s: no cold start ela
estourava e o card só aparecia no refresh seguinte, 5 min depois. Agora são
3 tentativas em sequência (30 s cada, espera crescente) e as chamadas
simultâneas (abertura, refresh, aba PRODUÇÃO/HORA) compartilham uma execução.

**Atenção:** nenhum número muda. O tempo de resposta do Apps Script em si não
mudou — o que mudou é que uma falha não deixa mais o card vazio por 5 min.

---

## v7.96.0 — 25/09/2026 · ⚠ re-deploy (.gs v5.18)

**UEP de todos os produtos do cadastro** (PPCP: *"fazer a UEP de todos
produtos"*). O 💾 GRAVAR UEP continua gravando a UEP **medida** de quem rodou
no período e, em seguida, preenche o **resto do cadastro** com uma UEP
**ESTIMADA** pelo tempo de esteira da caixa:
`UEP estimada = k × teto da âncora ÷ teto do código`, com `k` = mediana de
(UEP medida ÷ UEP física) nos produtos medidos com amostra (mínimo 3).

**Atenção:**
- A vigência da UEP estimada vai com o sufixo **`EST`** (`25/09/2026 EST`).
  Só é gravada onde a UEP está **vazia ou já era estimada** — UEP medida ou
  digitada à mão nunca é tocada. Quando o produto rodar, o próximo GRAVAR troca
  a estimativa pela medida.
- O card **UEP DO DIA**, a coluna UEP da PROGRAMAÇÃO, a CARTEIRA em UEP e o
  simulador de capacidade passam a contar esses produtos: as caixas que antes
  apareciam como *"sem UEP"* passam a ter UEP. O UEP do dia **sobe** em dia com
  produto que nunca tinha sido medido.
- Código **sem MEDIDA DA CAIXA** continua sem UEP (listado no aviso) — sem
  medida não há o que estimar.
- É estimativa, não medição: a faixa dos quocientes aparece na confirmação.
  Faixa larga = a medida da caixa explica pouco do ritmo; conferir os produtos
  de mais volume antes de usar em meta.
- ⚠ **re-deploy** do `.gs` v5.18. Sem ele a UEP medida grava normalmente e o
  aviso diz que a estimativa não foi gravada.

## v7.95.0 — 24/09/2026

**Simulador de capacidade UEP: limite físico da esteira** (PPCP). Cada produto
completo passa a ter um **LIMITE ESTEIRA / DIA**: a soma do tempo de esteira
dos volumes (medida da caixa + entre-peças, pela velocidade) em 527 min. Aparece
na busca do simulador, no 🖨 DIA MONTADO e no 🖨 CAPACIDADE DE CADA PRODUTO.
Novo campo **VELOCIDADE ESTEIRA (m/min)** para simular a esteira mais rápida
(vazio = velocidade do cadastro).

**Atenção:**
- Produto em que a UEP daria mais do que a esteira comporta sai com ⚠ e a
  capacidade (e os PONTOS / DIA) **cortada no limite**. Antes o número pela UEP
  saía sozinho, mesmo fisicamente impossível.
- ⚠ no produto quer dizer **UEP baixa demais ou velocidade do cadastro
  errada** — conferir os dois antes de usar o número.
- Produto sem MEDIDA/VELOCIDADE no cadastro não tem limite: segue como antes.
- Nada no `.gs`.

---

## v7.94.0 — 24/09/2026

**UEP: entre as cores vale a MAIS RÁPIDA, nunca a média** (PPCP). A base da
UEP de cada produto passa a ser, nesta ordem:
1. a **cor mais rápida** nas horas em que ela rodou sozinha, com 4 h ou mais
   assim;
2. o ritmo em regime do produto, com as cores misturadas;
3. o ritmo usado.

O relatório do estudo diz, produto a produto, qual cor foi a base. No
simulador de capacidade, entre as cores de um mesmo volume vale a **menor**
UEP do cadastro.

**Atenção:**
- A UEP de quase todo produto com mais de uma cor vai **diminuir** (a base fica
  mais rápida). A âncora (MADERO) também muda, e com ela a escala.
- **Nada muda no cadastro sozinho**: para valer no painel, rode o estudo e
  **💾 GRAVAR UEP** de novo. Depois disso, confira se a meta de 2.530 UEP
  continua coerente com os primeiros dias.
- Cor com menos de 4 h sozinha não vira base, porque 20 minutos bons não são
  padrão.

## v7.93.1 — 24/09/2026

**Simulador de CAPACIDADE UEP não fica mais preso em "Carregando o cadastro…".**
- Quando as 3 tentativas de ler o cadastro falhavam, a tela voltava a
  "Carregando" para sempre. Agora ela diz por quê (servidor não respondeu, ou
  respondeu com erro) e mostra **↻ TENTAR DE NOVO**.
- O último cadastro lido fica guardado **neste computador** e abre na hora
  (com a data da leitura escrita). A leitura nova roda por trás e troca o dado
  quando chega.

## v7.93.0 — 24/09/2026

**PONTOS / DIA na impressão CAPACIDADE DE CADA PRODUTO.** Nova última coluna:
os produtos que cabem no dia × os pontos do produto (soma dos PONTOS de cada
volume no cadastro, média entre as cores). Serve para comparar a régua de UEP
com a de pontos.

A folha passou a sair **deitada** (paisagem), com a tabela mais larga.

**Atenção:** produto com algum volume sem PONTOS no cadastro sai com "—".

## v7.92.0 — 24/09/2026

**🖨 CAPACIDADE DE CADA PRODUTO** no simulador de CAPACIDADE UEP. Imprime numa
folha só **todos os produtos do cadastro**, do mais pesado para o mais leve.
Para cada um: código, volumes, cores, UEP por produto, produtos por dia,
caixas por dia e produtos por hora, com ele sozinho na linha.
- A busca da tela não filtra: sai sempre tudo.
- Produto com volume sem UEP sai listado à parte.
- O botão antigo virou **🖨 DIA MONTADO**.

## v7.91.0 — 24/09/2026

**🖨 IMPRIMIR no simulador de CAPACIDADE UEP.** Folha em retrato com quatro
partes:
1. **O dia montado cabe?** UEP usada, o que sobra (ou passa da meta) e o total
   de produtos e caixas, com selo CABE NO DIA · CABE NO LIMITE · NÃO CABE NO
   DIA.
2. **Produto a produto**: código, volumes, UEP/produto, quantidade, caixas,
   UEP, % do dia e quantos cabem a mais.
3. **Cada um sozinho na linha**: produtos por dia, caixas por dia e produtos
   por hora.
4. **Como o número sai.**

Mesmas contas da tela, nada é buscado de novo. O papel diz que é simulação.

## v7.90.1 — 24/09/2026

**↺ LIMPAR no simulador de CAPACIDADE UEP.** Apaga a busca e o dia montado e
volta a meta para a das configurações. O dia montado mostra o **código** e a
**UEP por produto** de cada linha (o KIT 2 MESA CABECEIRA SLEEP e a MESA
CABECEIRA SLEEP começavam iguais). **"MIX" saiu da tela**: o botão virou
**+ ADICIONAR AO DIA** e o bloco virou **DIA MONTADO**. Nenhum número muda.

## v7.90.0 — 24/09/2026

**🧮 CAPACIDADE UEP na aba PROGRAMAÇÃO**: um simulador de quantos
**produtos completos** cabem no dia.
- Busca pelo nome ou pelo código. Mostra os volumes, a UEP do produto
  (**soma dos volumes** do cadastro) e quantos cabem no dia e por hora, com o
  produto sozinho na linha.
- **+ MIX** monta um dia com vários produtos. Mostra a UEP usada, o % da meta,
  o que sobra e quantos de cada ainda cabem.

**Atenção:**
- É simulação: não grava nada.
- Produto com algum volume sem UEP no cadastro aparece "sem UEP" e fica fora
  da soma, nunca meio produto.
- O número é o ritmo **demonstrado** (o que a linha já fez), não o teto da
  esteira.
- Lê o cadastro (`getProdutos`) só quando o simulador abre, com cache de
  10 min. Sem mudança no `.gs`.

## v7.89.0 — 24/09/2026 · ⚠ re-deploy (.gs v5.17)

**META DIA (UEP) NAS CONFIGURAÇÕES.** Campo novo no ⚙, abaixo da META DIA
(CX), com o equivalente por hora ao lado (2.530 → ~288 UEP/h). Grava na aba
`CONFIG_PAINEL` (chave `META_UEP`) e vale para todos os aparelhos: gerencial,
celular, histórico e relatórios.

**Atenção:**
- Só vai para a planilha quando o valor é **mudado**. Campo vazio ou igual ao
  atual não envia nada. Para voltar ao padrão, digite 2530.
- A meta nova vale para os dias fechados **depois** da mudança. Dia já fechado
  mantém a META UEP gravada nele. Para regravar os antigos, rode
  `regravarUepPassada()` no editor do Apps Script.
- ⚠ Precisa do `.gs` v5.17 re-deployado. Antes disso, o valor digitado vale só
  nesta tela até o próximo refresh. Dá para digitar `META_UEP` direto na aba
  `CONFIG_PAINEL`, que funciona sem re-deploy.

## v7.88.0 — 24/09/2026

**R$ POR UEP no card UEP DO DIA** (gerencial do computador, hoje e dia passado).
O card ganha `R$ 1,48/UEP (meta R$ 1,33)`. O tooltip traz a conta e quanto foi
pago sem virar UEP até aquele momento.
- R$/UEP = custo-hora da linha × minutos de jornada normal ÷ UEP feita.
- Meta = custo-hora × 527 min ÷ meta de UEP.

**Atenção:**
- O custo-hora é o que foi digitado no **SIMULADOR** e vale **só no computador
  onde foi digitado**. Ele não vai para a planilha porque a URL do Apps Script
  está no HTML público. Sem custo-hora, o card fica como antes.
- É custo de conversão da mão de obra da embalagem, não custo do produto. A
  hora extra fica fora (a UEP e o custo dela).
- Hoje, com o turno em andamento, conta só os minutos de jornada com
  lançamento. O celular e os relatórios ainda não mostram R$.

## v7.87.0 — 24/09/2026

**UEP EM DESTAQUE NA SEMANA E NAS IMPRESSÕES.**
- **FECHAMENTO DA SEMANA PASSADA** (gerencial): nova coluna **UEP · JORNADA**
  com o total da semana, o % da meta de UEP, quantos dias bateram, a média por
  dia e a UEP em HE. Cada dia ganha a linha `2.410 UEP · 95,3%`.
- **Relatório SEMANAL** e **relatório do HISTÓRICO**: faixa **UEP · JORNADA
  NORMAL** logo abaixo do resumo, com total, meta, % e selo (NA META · ATENÇÃO
  · ABAIXO DA META). O do histórico também ganha a coluna UEP no detalhamento.
- **Relatório do DIA (produção por modelo)**: o primeiro card do resumo passa a
  ser **UEP DO DIA · JORNADA**, com a mesma conta do card do gerencial.
- **Relatório do PERÍODO (produção por modelo)**: card **UEP APONTADA** (caixas
  apontadas com produto × UEP/cx do cadastro).
- **Resumo do WhatsApp**: linha da UEP da semana e a UEP de cada dia.

**Atenção:**
- A meta da semana em UEP é a **soma das metas de cada dia com UEP gravada**.
  Dia sem UEP fica fora da conta e é contado à parte, nunca como zero.
- A **UEP APONTADA** do período conta **todas as horas, HE inclusive**, e só
  as caixas apontadas com produto. Por isso não bate com a UEP de jornada do
  HISTÓRICO.
- A **TV não mostra UEP** (Tela D inclusive). Os relatórios de paradas, gestão
  de perdas e simulador continuam em caixas.
- Corrigido o texto do relatório semanal que ainda dizia "meta de UEP de 8 h"
  (desde a v7.84.0 a meta é da jornada normal inteira).

## v7.86.0 — 24/09/2026 · ⚠ re-deploy (.gs v5.16)

**UEP HORA A HORA NO DIA PASSADO.** No gerencial, ao escolher um dia anterior, a
tabela LANÇAMENTO HORA A HORA ganha a coluna **UEP**, igual à de hoje: UEP da
hora contra a meta de UEP do dia repartida pelos minutos da hora (o
`12:12-13:00` pede menos). Hora extra mostra o número sem veredito.

**Atenção:**
- A UEP da hora sai do log de produto daquele dia × a **UEP do cadastro de
  hoje**. O card UEP DO DIA continua sendo o valor **congelado no fechamento**.
  Se a UEP de algum código mudou depois, a soma das horas pode não bater
  exatamente com o card. O tooltip da célula avisa.
- `*` = parte das caixas daquela hora sem UEP no cadastro (ficou fora).
- Antes do re-deploy do `.gs` a coluna não aparece no dia passado. Não aparece
  zero no lugar.

## v7.85.0 — 24/09/2026

**CARTEIRA EM UEP na aba PLANO.** Opção nova no seletor CARTEIRA: **em UEP**.
Cada lote entra com a quantidade × a UEP do código no cadastro, e a faixa alvo e
o melhor dia saem da **UEP de jornada normal gravada no HISTÓRICO**. Carga e
régua ficam na mesma unidade. A dívida (atraso + o que falta hoje) entra pela
UEP de cada código em atraso. Vale na tela e nos dois PDFs (🖨 ESTUDO e 🖨
CARTEIRA).

**Atenção:**
- Os modos **carga pelo mix**, **caixas cruas** e **as duas** continuam como
  estavam. A UEP é uma opção a mais: nada muda até ela ser escolhida no seletor.
- O **E SE PARADAS** ainda é calculado em caixas e não sai no modo UEP. A tela
  diz isso.
- Código sem UEP no cadastro entra com a UEP média das linhas da carteira e é
  contado na caixa de explicação.
- Sem UEP na programação (`.gs` < v5.13 ou cadastro vazio), ou com menos de 10
  dias com UEP no HISTÓRICO, a tela diz o que falta em vez de desenhar.



**A meta de UEP do dia passa a ser da jornada normal inteira: 2.530 UEP.** Os
2.300 do estudo são ritmo × 8 h, mas o dia soma a jornada inteira (527 min). Com
os 48 min a mais a meta ficava ~10% mais fácil: no HISTORICO, 6 de 7 dias da
última semana passaram de 2.300. 2.530 na jornada dá os mesmos ~288 UEP/h.

**Atenção:**
- O card UEP DO DIA, a meta de cada hora e o histórico passam a comparar com
  2.530. A meta da hora cheia muda de 287,5 para 288 UEP e, no slot pós-almoço,
  continua 230.
- Os dias já fechados estão com META UEP 2.300 gravada. Para regravar, rode
  `regravarUepPassada()` no editor. A `CONFIG_PAINEL` (chave `META_UEP`)
  continua mandando quando preenchida.
- O alvo do ESTUDO UEP continua 2.300 em 8 h (é outra régua: ritmo × 8).



**UEP no HISTÓRICO.** O fechamento do dia, tanto o automático das 17:05 quanto
o botão FECHAR DIA, passa a gravar três colunas novas no `HISTORICO`: **UEP**
(jornada normal), **UEP HE** e **META UEP**. Ficam **congeladas** com a UEP do
cadastro e a meta daquele dia. Onde aparece:
- **HISTÓRICO** (desktop): coluna UEP por dia, colorida contra a meta do dia, e
  o card **UEP / DIA (JORNADA)**, com a média e em quantos dias a meta foi batida.
- **Gerencial de dia passado**: card UEP DO DIA.
- **Celular**: a UEP do dia no detalhe do histórico.
- **Dias antigos**: rode `preencherUepPassada()` no editor do Apps Script. Ela
  usa a UEP que está HOJE no cadastro (a UEP da época não foi guardada) e só
  preenche onde a coluna está vazia.

**UEP no total do dia por modelo** (PRODUÇÃO/HORA): coluna UEP com a UEP por
caixa de cada produto, e a UEP no total.

**UEP nos relatórios:** o relatório do dia (PDF) ganha a coluna UEP e a linha
UEP DO DIA. O relatório semanal ganha a seção **UEP DA SEMANA** (dia a dia, meta
e % da meta, UEP em HE e total).

**UEP/cx no comparativo do período**, ao lado do nome de cada grupo, na tela e
no PDF. O backend manda um mapa pequeno com a UEP por produto
(`uepProd`), longe do limite de 100 KB do cache.

**Atenção:**
- ⚠ **re-deploy** do `.gs` v5.14.
- Os dias fechados **antes** do re-deploy ficam sem UEP até rodar
  `preencherUepPassada()`.
- Dia sem UEP aparece como "—" e fica fora da média; nunca vira zero.



**UEP na PROGRAMAÇÃO.** A aba PROGRAMAÇÃO ganhou a coluna **UEP** em cada linha
(qtde × UEP do código no cadastro). No cabeçalho de cada dia aparece o total do
dia em UEP e **quanto ele representa da meta de UEP** (padrão 2.300), em âmbar
quando passa de 100%. No TOTAL entra a UEP da carteira. Linha de código sem UEP
sai "—", e as caixas dela são contadas à parte ("N cx sem UEP").

**UEP hora a hora no gerencial** (desktop e celular). A tabela hora a hora ganhou
a coluna **UEP**, colorida contra a meta da hora. A meta da hora é a meta do dia
repartida pelos minutos: 287,5 UEP numa hora cheia e 230 no slot pós-almoço de
48 min. A hora extra mostra o número sem cor. `*` = parte das caixas daquela
hora é de código sem UEP. Só aparece no dia de hoje.

**Atenção:** ⚠ **re-deploy** do `.gs` v5.13 para a coluna da PROGRAMAÇÃO. A UEP
hora a hora usa o que o v5.11 já manda.



**UEP por volume.** Nos produtos de 2 ou mais volumes, cada volume passa a ter a
sua UEP. Os volumes são embalados juntos (PPCP), então o histórico não separa o
ritmo de cada um. O **total do produto continua o medido** e é repartido entre
os volumes pelo tempo de esteira de cada caixa (MEDIDA DA CAIXA + ENTRE_PECAS).
Exemplo, CRISTALEIRA ORION: 1,54 + 1,54 → **1,75 (VOL 1/2) + 1,33 (VOL 2/2)**,
total 3,08 nos dois casos.

**Atenção:**
- ⚠ **re-deploy** do `.gs` v5.12. Vale no próximo 💾 GRAVAR UEP.
- Produto em que falta MEDIDA DA CAIXA em algum volume fica com a média, e o
  alerta final diz quantos são.
- Um novo GRAVAR UEP **sobrescreve** também a UEP digitada à mão nos produtos
  do estudo. Quando a cronoanálise de um volume sair, digite o valor depois do
  último GRAVAR.



**💾 GRAVAR UEP mostra que está trabalhando.** Antes de gravar, o botão busca
a produção do período com as caixas por hora, o que leva até 1 minuto e fica na
fila do Apps Script atrás do comparativo da aba. Nesse tempo nada mudava na
tela, e parecia botão quebrado. Agora ele mostra *BUSCANDO O PERÍODO…*, depois
*GRAVANDO NO CADASTRO…*, e fica desabilitado até terminar: um segundo toque não
dispara outra busca. Nenhum número muda.

## v7.80.0 · mobile 1.20.0 · ⚠ .gs v5.11 — 24/09/2026

**UEP DO DIA no gerencial (desktop e celular).** O card mostra a UEP feita em
jornada normal contra a meta de UEP do dia, o selo de ritmo (esperado até
agora = meta × minutos de jornada com lançamento ÷ 480), a UEP feita em hora
extra, à parte, e as caixas de códigos sem UEP. Não aparece na TV nem para o
operador.

**A UEP virou parâmetro do cadastro.** Colunas **UEP** e **UEP_VIGENCIA** na
`PRODUTO_CODIGO`. O botão **💾 GRAVAR UEP** (aba PRODUÇÃO/HORA, ao lado do
📐 ESTUDO UEP) grava a UEP por caixa do estudo do período em cada código do
produto, com a vigência de hoje. Depois disso a UEP pode ser corrigida à mão na
planilha. A meta sai da `CONFIG_PAINEL` (chave **META_UEP**); sem a chave, vale
**2.300**.

**Atenção:**
- ⚠ **re-deploy** do `.gs` v5.11. Antes dele o card diz que o backend ainda
  não manda a UEP, e o GRAVAR UEP avisa em vez de gravar.
- Depois do re-deploy, o card só mostra número quando a coluna UEP estiver
  preenchida (📐 período 01/07–24/09 → 💾 GRAVAR UEP).
- A meta é de **8 h de jornada normal**. A HE não entra nela, e depois de 8 h o
  esperado é a meta cheia (os 48 min que sobram do turno ficam como folga).

## v7.79.0 — 24/09/2026

**ESTUDO UEP: alvo provisório de 2.300 UEP em 8 h** (decisão do PPCP). Novo
card ALVO PROVISÓRIO (quantos dias válidos bateram e em que percentil da
capacidade ele cai), coluna **ALVO 2.300** na UEP POR DIA (BATEU / NÃO; dia
suspeito sai "—") e a nota de onde veio o número. Continua só no relatório de
estudo, sem TV, celular ou meta oficial.

**Atenção:** o alvo fica **acima** da faixa sugerida (2.228–2.239 em
01/07–24/09): nesse período a linha bateu 2.300 em 18 de 51 dias válidos
(~p65). Vale até a cronoanálise da MADERO dar o tempo padrão.

## v7.78.1 — 24/09/2026

**ESTUDO UEP voltou a abrir.** Desde a v7.77.0 o estudo faz a própria busca no
Apps Script (com as caixas por hora), que leva segundos; a janela do relatório
só era aberta depois dela, e o navegador bloqueava o pop-up por já não ligá-lo
ao clique. Agora a janela abre no clique com *"Buscando a produção do
período…"* e o estudo é desenhado nela quando os dados chegam; falhou a busca,
a janela fecha e o alerta diz o motivo. Nenhum número muda.

## v7.78.0 — 24/09/2026

**ESTUDO UEP: um lançamento sem HORA não desliga mais a divisão da hora.** O
PDF de 24/09 às 11:17 saiu com *"a divisão proporcional da hora ainda não está
valendo"*, com o .gs novo no ar (às 10:44 ela valia). A regra exigia que
**todos** os itens do período tivessem as caixas por hora, e um lançamento sem
HORA na PRODUCAO_PRODUTO desligava a divisão do período inteiro, sem avisar.

- Agora a divisão vale quando o Apps Script manda as caixas por hora.
- O lançamento sem HORA fica **fora do ritmo** e continua na UEP do dia.
- O lançamento sem caixas por hora, mas com as horas listadas, tem as caixas
  repartidas igualmente entre essas horas.
- O relatório conta os dois casos.
- **Atenção:** os números do PDF das 11:17 eram com a hora cheia (UEP inflada,
  39 dias suspeitos); gere de novo. Sem re-deploy.

---

## v7.77.0 — 24/09/2026 · ⚠ re-deploy (.gs v5.10)

**O comparativo por modelo voltou a carregar em período longo.** Depois do
.gs v5.9, a aba PRODUÇÃO/HORA com 01/07–24/09 dava *"O SERVIDOR NÃO RESPONDEU
A TEMPO"* nas três tentativas, com o Apps Script respondendo normalmente às
outras chamadas. Causa provável: as caixas por hora (`cxHora`), que só o
estudo de UEP usa, iam em **toda** resposta. O período longo passou de 100 KB,
o cache do Apps Script recusa acima disso, e cada chamada relia o log inteiro.

- O `.gs` v5.10 só manda `cxHora` quando a chamada pede (`cxHora=1`), e a
  chave do cache separa as duas respostas.
- O 📐 ESTUDO UEP faz a busca própria, com `cxHora=1`, **60 s** de espera
  (antes, 25), cache de 5 min e requisição em voo compartilhada.
- **Atenção:** nenhum número muda.
- ⚠ **re-deploy (.gs v5.10).** Antes dele o estudo já funciona (espera mais),
  mas o comparativo continua pesado.

---

## v7.76.0 — 24/09/2026

**ESTUDO UEP: UEP pelo ritmo em regime, teste de sanidade pelo teto e faixa
sugerida de meta.** Leitura do relatório real de 01/07–24/09 com o PPCP.

- **A UEP sai do ritmo EM REGIME** quando o produto tem **4 h ou mais**
  rodando sozinho; abaixo disso, do ritmo usado. Pela teoria a UEP mede o
  trabalho da peça e a troca fica à parte. O número que gerou a UEP sai em
  negrito na tabela. Medido: COMODA SAPATEIRA DUBAI 110 cx/h em regime contra
  67 no usado (UEP 4,13 → ~2,5); MADERO e PENTEADEIRA quase não mudam.
- **Teste de sanidade corrigido:** a régua passa a ser o **teto físico** da
  âncora, não o ritmo médio dela. Na v7.75.0 ele acusava 20 de 60 dias (dia
  bom passa da média, e isso não é defeito); pelo teto, sobram 4. Dia com
  apontamento acima do realizado também é suspeito. Os suspeitos saem em
  cinza.
- **FAIXA SUGERIDA DE META em 8 h:** p50–p60 da UEP em 8 h dos dias válidos,
  a mesma faixa da aba PLANO. No lugar do card UEP NO PERÍODO, que foi para a
  nota da tabela. É estudo: a meta oficial continua em caixas.
- **Atenção:** a UEP dos produtos com 4+ h sozinho muda; a OSCILAÇÃO DO DIA
  passa a desconsiderar os dias suspeitos. Sem re-deploy.

---

## v7.75.0 — 24/09/2026

**ESTUDO UEP: dia padrão de 8 h, teto da esteira e teste de sanidade.** Com o
.gs v5.9 no ar, o relatório de 01/07–24/09 mostrou dois números impossíveis: a
MESA LATERAL DECOR 470 saía com 351 cx/h (acima do teto físico) e a âncora,
MESA CABECEIRA SLEEP, rodava a 332 cx/h sozinha com teto de ~329.

- **UEP POR DIA em 8 h** (pedido do PPCP): UEP/h da linha × 8 h. Os dias
  ficam comparáveis e a hora extra sai da capacidade. O realizado do dia
  continua na tabela, ao lado. ⚠ O turno tem 8 h 48 min produtivas: os 48 min
  ficam como folga (`UEP_HORAS_DIA`).
- **Nenhum ritmo passa do teto físico** da esteira: acima dele, o ritmo é
  limitado ao teto e a linha avisa *RITMO LIMITADO AO TETO*.
- **Âncora A = maior volume abaixo de 90% do teto.** Produto no limite da
  esteira mede a máquina, não a equipe. Quem ficou de fora aparece no resumo.
- **Teste de sanidade:** dia com UEP/h acima do ritmo da âncora sai com ⚠.
- **Cobertura sem corte em 100%:** acima do realizado sai *⚠ acima*.
- **Atenção:** a âncora A pode mudar, e com ela a escala de toda a UEP (a
  proporção entre os produtos não muda). O card UEP POR DIA passou a ser em
  8 h. Sem re-deploy.

---

## v7.74.0 — 24/09/2026 · ⚠ re-deploy (.gs v5.9)

**ESTUDO UEP: a hora de troca é repartida, e o relatório ganhou UEP POR DIA e
validação fora da amostra.** O PPCP confirmou que a linha roda **um produto
por vez**: a hora em que dois produtos aparecem é hora de troca. Antes cada um
levava a hora inteira, e o produto de lote pequeno (mais trocas) parecia lento
e ganhava UEP alta.

- **Ritmo em regime:** caixas ÷ horas em que o produto rodou **sozinho** na
  linha (cores do mesmo produto juntas contam como sozinho).
- **Hora compartilhada repartida pelo tempo esperado** de cada produto
  (caixas ÷ ritmo em regime). Pelas caixas não: os dois sairiam com o ritmo da
  linha naquela hora. É do ritmo com a hora repartida que sai a UEP.
- A tabela mostra **EM REGIME · HORA CHEIA · RITMO USADO** lado a lado.
- **UEP POR DIA** (seção 3): caixas, UEP, horas da linha, UEP/h e a cobertura
  do dia contra o realizado do HISTÓRICO. No resumo: média, menor e maior dia.
- **Validação fora da amostra:** a UEP sai da 1ª metade dos dias e é testada
  na 2ª. É ela que diz se a UEP mede esforço (a conferência de antes era
  otimista, feita nos mesmos dias).
- **Atenção:** RITMO USADO, UEP/CX e UEP NO PERÍODO mudam em relação à
  v7.73.0 depois do re-deploy. Nenhum número fora do estudo muda.
- ⚠ **re-deploy (.gs v5.9):** `getProducaoModeloPeriodo` manda as caixas por
  hora de cada item (`cxHora`), sem leitura nova. Antes do re-deploy o
  relatório avisa que a divisão da hora não está valendo e segue com a hora
  cheia.

---

## v7.73.0 — 24/09/2026

**ESTUDO UEP: amostra curta também ganha UEP, marcada PROVISÓRIA.** Pedido do
PPCP logo depois da publicação. O produto com menos de 5 dias rodados agora
sai com a UEP calculada, um **\*** ao lado do número e a observação na coluna
CONFERIR (*"UEP PROVISÓRIA — amostra curta (2 dias, 391 cx): confirmar com
mais dias"*). Antes ele saía em cinza e sem UEP.

- A **âncora** continua sendo escolhida só entre os produtos com 5+ dias: uma
  âncora de 2 dias mudaria a escala de todos no próximo dia rodado.
- **Atenção:** o card do resumo passou a se chamar **UEP COM AMOSTRA (5+
  DIAS)** e conta as provisórias à parte. CAIXAS COBERTAS, UEP NO PERÍODO e a
  conferência agora incluem as provisórias, então os três sobem em relação à
  v7.72.0. Sem re-deploy.

---

## v7.72.0 — 24/09/2026

**📐 ESTUDO UEP — relatório para análise, só no gerencial.** Na barra da aba
PRODUÇÃO/HORA, ao lado do RELATÓRIO DO PERÍODO. Para o período da tela, dá a
**UEP (unidade de esforço de produção)** de cada produto:
UEP por caixa = ritmo da âncora ÷ ritmo do produto.

- **Duas âncoras lado a lado:** A = produto de **maior volume** (recomendada,
  estável) e B = o **mais rápido** (o pedido original). Elas mudam só a
  escala; a proporção entre os produtos é a mesma.
- **Por produto, não por cor:** as cores somam. Quando as cores do mesmo
  produto divergem 1,5× ou mais, sai um alerta.
- **Amostra mínima de 5 dias:** abaixo disso o produto fica **sem UEP** e é
  contado. Nunca recebe 1,00 por padrão.
- **Conferência:** o ritmo da linha dia a dia oscila menos em UEP/h do que em
  cx/h? Se não cair, a UEP não está medindo esforço.
- **Atenção:** é **estudo**. Nada vai para a TV nem para o celular, e nenhum
  número existente mudou. Sem re-deploy.

---

## v7.71.0 — 24/09/2026 · ⚠ re-deploy (.gs v5.8)

**TELA E por LOTE.** Na TV a versão por código ficou pequena: o lote 25213
ocupava 5 das 6 linhas com a mesma MESA COMPUTADOR MILLION em cores
diferentes. Agora é **uma linha por lote**: nome do produto (sem "VOL 1/1" e
sem a cor), nº de cores, **FALTA** em número grande, **"de N no lote"** (o
total programado do lote) e uma barra de progresso do lote. Até 4 lotes na
tela; a faixa do topo virou uma linha só para dar altura aos lotes.

- A barra agora é honesta: no lote o total é **fixo** (na visão por código o
  total encolhia com o atraso vivo, por isso lá não havia barra).
- **RODANDO AGORA** marca o lote que é a cabeça do FIFO do produto
  selecionado no celular — é nele que a próxima caixa cai.
- **Atenção:** o total do lote é o programado com data **até hoje**
  (inclusive linhas já arquivadas); linha do mesmo lote datada para o futuro
  não entra. Nenhum número existente mudou.
- ⚠ **re-deploy (.gs v5.8):** `calcularProgramacao` devolve `porLote` (mesmo
  cálculo, nenhuma leitura nova). Antes do re-deploy a Tela E continua na
  visão por código da v7.70.0.

---

## v7.70.0 — 24/09/2026 · ⚠ re-deploy (.gs v5.7)

**TELA E da TV — PROGRAMAÇÃO DO DIA.** Quinta tela do carrossel: o que falta
embalar hoje, produto a produto. No topo, três números: **PROGRAMADO HOJE ·
ATRASO ANTERIOR · FALTA P/ ZERAR**. Embaixo, até 6 linhas com **LOTE · PRODUTO
(código + cor) · FALTA · SITUAÇÃO** (`RODANDO AGORA` · `ATRASO · dd/mm` ·
`A FAZER`). O que já foi concluído não ocupa linha e vira contador no rodapé,
assim como o que não coube.

- **Ordem:** o produto que está rodando, depois o atraso mais antigo, depois o
  programado de hoje (por lote). ⚠ É **premissa do painel**: a PROGRAMACAO não
  tem coluna de sequência.
- **O número da linha é o FALTA, não um %.** O atraso já chega abatido pela
  produção de hoje (FIFO), então uma barra de progresso andaria para trás.
- **Só entra no ciclo quando há programação ou atraso.** Fica 20 s na tela
  (configurável: TEMPO NA TELA E) e tem checkbox próprio (TELA E).
- **Nenhuma chamada nova:** a TV já recebe a lista pelo `getPontosDia`.
- **Atenção:** o FALTA P/ ZERAR é o mesmo número do card da Tela C, que agora
  lê o mesmo helper (`_progFaltaZerar`). Nenhum número existente mudou.
- ⚠ **re-deploy (.gs v5.7):** manda a **cor** e a **data do lote aberto mais
  antigo** por item e guarda `TELA_E`/`TEMPO_E` na CONFIG_PAINEL. Antes do
  re-deploy, a tela funciona sem cor (só o código aparece), o selo sai
  `ATRASO` sem data e a marcação da Tela E fica local em cada aparelho.

---

## v7.69.0 — 23/09/2026 · ⚠ re-deploy (.gs v5.6)

**PROPOSTA IMPRESSA: redação com IA sobre os números do painel** (passo 3 da
análise do diretor). Na aba SIMULADOR, o bloco **REDAÇÃO DA PROPOSTA** com o
botão **✍ REDIGIR COM IA**: o painel manda ao Apps Script os números que ele
mesmo calculou (problema, cenário, capacidade, economia, retorno,
sensibilidade, recomendação) e o Claude devolve cinco parágrafos — resumo
executivo, problema, solução, riscos e recomendação.

- **O modelo não calcula nada e não pode inventar número.** O `.gs` confere
  cada número do texto contra os dados enviados; número fora da lista é
  apontado e o texto **não vai ao papel** (a tela diz quais). Mudou um campo do
  cenário? O texto fica **DESATUALIZADO** e sai da impressão até redigir de
  novo.
- Na impressão executiva: o **RESUMO EXECUTIVO** entra na capa (folha 1,
  medida: continua fechando com as assinaturas) e os quatro parágrafos abrem a
  folha 2 como **LEITURA DO GESTOR**, marcados como redigidos com IA e
  revisados pelo gestor.
- ⚠ **re-deploy do `.gs` (v5.6)** e a **chave da API** em *Configurações do
  projeto → Propriedades do script → `CLAUDE_API_KEY`*. A chave nunca vai no
  HTML (público na Vercel) nem volta em resposta. Sem chave, o bloco diz o que
  falta; com o `.gs` antigo, diz que falta o re-deploy. O resultado fica em
  cache por 6 h por cenário — reimprimir não paga de novo.
- Correção: o `APP_VER` do rodapé não tinha subido na v7.68.0 (mostrava
  7.67.0). Nenhum número mudou de conta.

---

## v7.68.0 — 23/09/2026

**PROPOSTA IMPRESSA: a página 1 virou PÁGINA DE DECISÃO** (passo 2 da análise
do diretor: *"o que é, quanto custa, o que resolve, o que economiza, quando se
paga, e se não der o previsto?"*). Só front-end — nada muda no `.gs`.

- **Página 1 (decisão)**, nesta ordem: O QUE É E QUANTO CUSTA (nome, o que faz,
  fornecedor, prazo · investimento total · custo recorrente) · O QUE RESOLVE
  (ocorrências, tempo parado, caixas perdidas, disponibilidade antes → depois) ·
  ECONOMIA E RETORNO (economia em HE mês/ano, líquida da manutenção quando há,
  payback, ROI) · **SENSIBILIDADE** · RECOMENDAÇÃO DO GESTOR e **três linhas de
  assinatura** (Gestor PPCP · Gerência industrial · Diretoria). Medido: cabe na
  folha 1 do A4 com e sem orçamento.
- **SENSIBILIDADE — "e se a redução for menor?"**: a mesma conta rodada de
  novo com redução uniforme de **50, 70 e 90%** em todas as causas atacadas,
  mais a linha do **cenário do gestor** (com o % que ele digitou, inclusive por
  causa). Cada linha traz tempo, caixas, economia em HE, payback, ROI e
  disponibilidade. Nada é redigido: o painel recalcula.
- **Página 2 (evidência)**: a tabela de causas com a redução simulada, o
  cenário completo, a capacidade recuperada e as **outras leituras que não se
  somam** (custo da parada, economia em HE, potencial de receita). **Anexo**:
  metodologia e premissas, agora com os blocos INVESTIMENTO, PAYBACK E ROI e
  SENSIBILIDADE.
- **Atenção — nenhum número mudou de conta**: economia, payback, ROI e
  potencial saem da mesma `_pgSimulacao` da v7.67.0. O que mudou é a ordem e a
  folha em que cada um aparece: o **potencial de receita saiu da página 1** e
  ficou na página 2, marcado condicional — na capa ele ancorava a leitura no
  maior número. O documento caiu de 4 para 3 folhas.

---

## v7.67.0 — 23/09/2026

**SIMULADOR: o investimento ganha nome, custos completos e recomendação**
(passo 1 da análise do diretor sobre a proposta impressa: *"não diz o que está
sendo comprado"*, *"o custo está incompleto"*, *"não há recomendação"*).

- Grupo **O INVESTIMENTO** nas premissas: nome, fornecedor, prazo, **instalação/
  frete/treinamento (R$, uma vez)**, **manutenção e consumíveis (R$/ano)**, o
  que o equipamento faz (uma frase) e a **recomendação do gestor** (aprovar ·
  aprovar com ressalva · adiar · não recomendar).
- **Atenção — a conta muda quando os custos são informados:** o investimento
  passa a ser **equipamento + instalação**, e a manutenção anual ÷ 12 é
  **descontada da economia em HE** antes do payback e do ROI (a economia em HE
  bruta continua a mesma no card). Com os campos vazios, todos os números são
  os de antes. Se a manutenção consumir toda a economia, o payback sai
  *"não calculável"*.
- Na proposta impressa: bloco **O QUE É O INVESTIMENTO** (nome, o que faz,
  fornecedor, prazo), linhas de instalação e manutenção na seção 5, a
  **RECOMENDAÇÃO DO GESTOR** fechando a tabela, e o custo-hora sai com
  centavos (era *R$ 378* num lugar e *R$ 377,81* noutro).

---

## v7.66.3 — 23/09/2026

**SIMULADOR e GESTÃO DE PERDAS: a falha da busca não culpa mais o "cold start".**
Medido em 23/09/2026: o painel conectado ao Sheets às 13:06:59 e a leitura das
paradas de 30 dias estourando 3 × 25 s — não era servidor frio, era a leitura
da aba PARADAS demorando. A mensagem passa a dizer isso, ganha o botão
**↻ TENTAR DE NOVO** e tenta sozinha uma vez 20 s depois, como a aba PARADAS
já fazia. Nenhum número muda.

---

## v7.66.2 — 23/09/2026

**O "negrito muito forte" era negrito SINTÉTICO.** O painel só carregava a
Barlow em 400 e 500; todo `<b>` em Barlow (600/700) era engrossado pelo
navegador a partir do 500 — que sai borrado e pesado, e é por isso que a
v7.66.1 "ficou igual". Agora a **Barlow 600** é carregada de verdade e o
negrito das telas de gestão é a face desenhada pela fonte. O texto principal
dessas telas desce mais um pouco, para `#DEDEDE`. A TV continua com o branco
cheio. Nenhum número muda.

---

## v7.66.1 — 23/09/2026

**Branco menos duro nas telas de gestão** (*"o branco está ruim de ver, parece
negrito muito forte"*). Em todas as abas lidas a 60 cm (gerencial, programação,
plano, produção/hora, paradas, gestão de perdas, simulador, histórico) o texto
principal desce de `#F5F5F5` para `#E6E6E6` — ainda ~14:1 sobre o fundo — e o
negrito (`<b>`) vai de 700 para 600. No simulador, os pesos que estavam em 600
(% da lista, investimento, linha do ano, frase do cenário, conta da HE) foram
para 500, e o número grande dos cards de 700 para 600. **A TV fica de fora**: a
15 m o branco cheio é o que se lê. Nenhum número muda.

---

## v7.66.0 — 23/09/2026

**SIMULADOR: a conta da hora extra aparece embaixo do campo, e um teste de
superfície só nesta aba.**

- Sob **HORA EXTRA ATUAL (h/semana, por pessoa)** a conta sai ao vivo: *8,0 h ×
  15 pessoas = 120,0 homem-hora/semana · × 4,4 semanas = 35,2 h de linha/mês*
  (*"onde aparece 8 h × 20 pessoas?"*). Com 0, diz que não há HE a economizar;
  sem pessoas, pede a quantidade.
- **Teste de superfície, só na aba SIMULADOR** (pedido: *"sim, fazer o teste"*),
  com a MESMA paleta: fundo → bloco → card em três tons um pouco mais
  afastados, cards sem borda (o tom já separa), mais respiro e raio maior. É um
  bloco de CSS escopado em `#sec-simulador`; aprovado, vira regra do painel;
  reprovado, apaga-se o bloco. Nenhum número muda.

---

## v7.65.0 — 23/09/2026

**SIMULADOR: a hora extra é digitada POR PESSOA.** O campo pedia o *total da
embalagem* (homem-hora) e o PPCP digitou 8 pensando em *8 h por pessoa* — a
conta leu 8 h no total, 15× menos hora extra, e o teto da economia caiu junto
(*"seria 15 × 8 hr"*). Agora o campo é **HORA EXTRA ATUAL (h/semana, por
pessoa)**: 8 = cada um fez 8 h. A memória de cálculo mostra o total
(*8 h × 15 pessoas = 120 homem-hora/semana*) e a hora de linha (8 × 4,4 =
35,2 h/mês).

Na lista de causas, **tempo · ocorrências · % da parada não programada saem em
colunas alinhadas** (antes era texto corrido, e *"8h33m · 76×"* e *"4 min ·
2×"* não batiam na vertical).

Os campos em R$ (**custo-hora, investimento e ticket médio**) ficam no formato
brasileiro ao sair do campo: *200000* vira **R$ 200.000**, *377,81* vira
**R$ 377,81**. A conta lê o texto formatado de volta — nenhum número muda.

O campo de **% por causa** ficou maior (70px, número a 13,5px, borda visível e
laranja no foco) — a 48px/11px era ruim de acertar e de ler.

**Atenção:** com 8 h/pessoa, 15 pessoas, Troca de Plástico a 80% e R$ 200.000,
a ECONOMIA EM HE foi de **R$ 1.330 → R$ 3.151/mês**, o payback de **150,4 →
63,5 meses** e o ROI em 5 anos de **−60,1% → −5,5%**. O valor antigo salvo no
aparelho (que era o total) **não é reaproveitado** — o campo aparece vazio e
precisa ser digitado de novo; lê-lo como "por pessoa" multiplicaria a HE pelo
nº de pessoas sem ninguém ver. Vale também na impressão executiva. Sem
re-deploy do `.gs`.

---

## v7.64.0 — 23/09/2026

**SIMULADOR: redução POR CAUSA, e cores mais leves.**

- **Cada causa marcada tem o seu % de redução**, num campo ao lado dela na
  lista. Vazio = usa a **REDUÇÃO SIMULADA — PADRÃO** (o campo que já existia).
  Um equipamento que elimina a troca de plástico não reduz a troca de produto
  na mesma proporção; com um % só, o investimento era pago por causas que ele
  não ataca. A frase do cenário, a memória de cálculo e a impressão executiva
  (tabela do problema ganhou a coluna **REDUÇÃO SIMULADA**) mostram o % de cada
  causa; com % diferentes, o resumo diz *"por causa (média de X% do tempo)"*.
- O aviso *"N causas com UMA redução"* só aparece quando todas estão com o
  mesmo %.
- **HORA EXTRA EVITÁVEL não passa de 100%**: *"305,8% da HE"* não dizia nada.
  Mostra 100% e escreve que as horas recuperadas passam da HE praticada.
- **Cores** (*"está pesado as cores"*): os números passam a ser tinta. Cor só na
  ECONOMIA EM HE (o benefício), no ROI negativo (vermelho), na etiqueta
  SIMULAÇÃO e na POTENCIAL. Causa marcada vira uma régua laranja à esquerda, não
  a linha inteira pintada; o aviso ficou com borda neutra.

**Atenção:** com o % padrão e nenhum % próprio, todos os números são os mesmos
de antes. HORA EXTRA EVITÁVEL acima de 100% agora aparece como 100%. Sem
re-deploy do `.gs`.

---

## v7.63.0 — 23/09/2026

**SIMULADOR: evolução da tela — mesma estrutura, mesmas contas, outra leitura.**

- **Frase do cenário** acima dos cards: o que está sendo atacado, com quanto,
  e o que devolve (horas, caixas, economia em HE, payback).
- **Os resultados em três faixas**, na ordem da decisão:
  **O INVESTIMENTO E O RETORNO** (investimento → economia em HE → payback →
  ROI, números maiores) · **IMPACTO OPERACIONAL** (tempo, caixas, HE evitável,
  disponibilidade *atual → simulada*) · **OUTRAS LEITURAS** (custo da parada e
  potencial de receita, menores e com *"não são economia de caixa"* no título).
  Antes eram nove cards numa linha só, e o potencial de receita — o maior
  número e o que menos vale como argumento — era o que mais chamava atenção.
- **Etiquetas**: ECONOMIA EM HE leva **SIMULADO** (depende da redução digitada)
  e o POTENCIAL DE RECEITA leva **POTENCIAL**. No papel da impressão executiva a
  economia também passou de POTENCIAL para SIMULADO — o mesmo selo dos dois
  lados deixava economia e receita com a mesma etiqueta.
- **PREMISSAS DO CENÁRIO** em grupos (cenário e investimento · custo e hora
  extra · receita potencial), com ajuda em cada campo; o INVESTIMENTO ganhou
  destaque.
- **Lista de causas** mostra a fatia de cada uma na parada não programada.
- **COMO O SIMULADOR CALCULA**: memória de cálculo recolhível com os dados de
  entrada, o cálculo operacional e o financeiro, cada linha com a conta escrita.
- **TEMPO RECUPERADO volta a min/mês** (como era antes da v7.62.0), com
  *≈ X h/mês* ao lado.

**Atenção — um número muda:** **HORA EXTRA ATUAL digitada como 0** agora
significa *"não há hora extra"*: a ECONOMIA EM HE vai a **R$ 0** e o payback
fica *não calculável*. Antes o 0 era tratado como campo vazio e a tela mostrava
a economia cheia "em estimativa", de uma hora extra que não existe. Campo
**vazio** continua como antes (estimativa sem teto, marcada). Vale também na
impressão executiva. Sem re-deploy do `.gs`.

---

## v7.62.0 — 23/09/2026

**Revisão da aba SIMULADOR.**

- **Aviso de cenário frágil**, acima dos cards: (1) causa genérica marcada
  ("Outros", "Outro") — sem causa identificada não dá para dizer o que o
  investimento resolve; (2) mais de uma causa com UMA redução só — o mesmo
  investimento raramente ataca troca de produto, troca de plástico e
  manutenção ao mesmo tempo. Só avisa: nenhuma conta muda.
- **Payback e ROI pedem só o campo que falta.** Com o CUSTO-HORA preenchido, a
  tela ainda dizia *"informe INVESTIMENTO e CUSTO-HORA"*.
- **A nota do rodapé repetia a mesma frase** ("dois cards de R$ não se somam"
  e, logo depois, "três leituras não se somam"). Ficou uma.

**Atenção:** o card TEMPO RECUPERADO passou de **min/mês** para **horas e
minutos por mês** (antes *965 min/mês*, agora *16h05m por mês*), na mesma
unidade da linha do ano. O valor é o mesmo. Sem re-deploy do `.gs`.

---

## v7.61.0 — 23/09/2026

**A aba PARADAS demorava e caía em "NÃO CARREGOU" com 30 DIAS.** Ela fazia a
própria busca do `getParadasPeriodo` — a leitura mais cara do backend — sem
cache e sem saber que GESTÃO DE PERDAS e SIMULADOR (que também abrem em 30 dias)
tinham acabado de pedir a mesma janela.

- **Uma busca por período para as três abas e os relatórios**
  (`_paradasPeriodoBusca`): cache de 5 min por período e requisição em voo
  compartilhada. Entrar em PARADAS depois de GESTÃO DE PERDAS com o mesmo
  período não chama o servidor de novo. O refresh automático e o ↻ continuam
  buscando dado fresco.
- **O período anterior (comparativo) usa o cache** — está fechado, não muda.
- **O refresh da aba vai depois do `lerSheets`**, não junto: as duas chamadas
  disputavam o Apps Script ao mesmo tempo.
- **Falhou? A tela não mostra mais gráficos de outro período** embaixo do
  "NÃO CARREGOU" (o Pareto e as caixas por dia ficavam do carregamento
  anterior). Aparece **↻ TENTAR DE NOVO** e o painel tenta sozinho **uma vez**
  depois de 20 s.

**Atenção:** nenhum número muda. Sem re-deploy do `.gs`.

---

## v7.60.0 — 18/09/2026

**O ATUALIZAR da aba PLANO engolia o toque, e a tarja da faixa alvo tapava a
barra.** Os dois vieram do mesmo uso, com a tela na frente: *"botão atualizar
não está funcionando"* e *"está cobrindo a linha A CARGA DEVERIA FICAR AQUI"*.

- **A guarda de reentrância não descarta mais o pedido.** `renderCarteira` e
  `renderQualidadePlano` saíam com um `return` seco enquanto um render estava em
  voo. Só que a montagem da carteira encadeia até TRÊS leituras caras
  (programação detalhada, log de produto do mix e, com o cenário `E SE PARADAS`
  ligado, as paradas dos dias da régua), cada uma com 3 tentativas de 25 s: no
  cold start passa de dois minutos. Nessa janela **todo toque no ATUALIZAR e
  toda troca de seletor sumiam em silêncio** — nada redesenhava e nada avisava.
  Medido: o seletor em **CAIXAS CRUAS** com a tela inteira ainda pesada pelo mix.
  Agora o pedido que chega durante o voo fica **pendente e roda no fim** — a
  última escolha do gestor sempre vence.
- **E a tela diz que está atualizando**: o bloco esmaece e aparece
  *"atualizando…"* ao lado do botão, a mesma régua da aba PARADAS e da GESTÃO DE
  PERDAS. Sem sinal nenhum, esperar um minuto é indistinguível de botão quebrado.
- **O modo do mix é lido UMA VEZ, no começo da montagem.** Trocando o seletor no
  meio da busca, o `QP_MIX` mudava debaixo dela e a legenda saía dizendo
  *"CARTEIRA EM CAIXAS CRUAS"* embaixo de barras pesadas pelo mix.
- **A tarja `← A CARGA DEVERIA FICAR AQUI` sai de cima da barra.** Ela escolhia o
  lado com menos barras cruzando a linha, mas quando as **duas** pontas estavam
  ocupadas ia para a *menos pior* — e cobria. Medido em 18/09/2026 (carteira em
  caixas cruas): esquerda com 1 cruzamento, direita com 2, e a tarja tapou a
  barra do **21/09** e o número **1.800** dela. Agora o nº de barras cobertas sai
  da **largura da tarja** (a 1.300px são 2, não as 3 fixas de antes) e, sem lado
  livre, ela **sobe** para acima do número da barra, com uma **guia pontilhada**
  até a linha. Não cabendo acima, fica onde estava — nunca pior que antes.

**AS DUAS RÉGUAS NA MESMA TELA.** Pedido do PPCP no mesmo dia: o seletor
**CARTEIRA** ganhou a opção **AS DUAS** — a carteira sai em dois blocos, um sob
o outro, *carga pelo mix* e *caixas cruas*, cada um com seu veredito, seus
cards, seu gráfico e seu dia a dia. **É o veredito que muda entre elas**, e é
isso que ela existe para mostrar: medido em 18/09/2026, pela carga sobravam
2.302 cx e o cenário de −50% de paradas dizia **NÃO DARIA**; pelas caixas cruas
sobravam 790 e ele dizia **DARIA**.

- **Não dobra a chamada ao Apps Script.** A programação vem do cache (2 min, voo
  compartilhado), o log de produto só é lido no bloco do mix e o cenário reusa o
  contexto de paradas da gestão de perdas (5 min, voo compartilhado). O segundo
  bloco é conta pura sobre o que o primeiro já leu.
- **O que é idêntico nos dois sai uma vez só**: os quatro parágrafos de
  explicação (no último bloco), a legenda do gráfico (no primeiro, que é o
  completo) e o sufixo do título que o próprio nome do bloco já diz. Por classe
  escondida, nunca por um segundo desenho.
- **Os dois PDFs acompanham** — 🖨 ESTUDO e 🖨 CARTEIRA saem com os dois gráficos
  quando AS DUAS está selecionado. A escolha fica guardada em `rpe_qp_pref`.

**Atenção:** nenhum número muda. Todas as correções são de tela — carteira,
dívida, carga pelo mix, faixa alvo e veredito continuam saindo das mesmas
contas. **Sem re-deploy do `.gs`.**

---

## v7.59.0 · mobile 1.19.0 · .gs 5.5 — 17/09/2026

**Paradas com SEGUNDOS — a base do estudo de microparadas.** Pedido do PPCP,
17/09/2026, com a aba `PARADAS` na tela: *"a duração está vindo número fechado,
ex. 8:24 a 8:25 = 1; vamos precisar pegar os segundos também, estamos estudando
as microparadas"*. Na planilha daquele dia, três `Parada/Empilhar peças` de
08:24→08:25, 08:39→08:39 e 08:44→08:44 valiam **1, vazio e vazio**.

- **O mobile grava `INICIO` e `FIM` com segundos** (`HH:mm:ss`) no REGISTRAR e
  no START. O `.gs` carimba o FIM do servidor também com segundos.
- **`DURACAO_MIN` vira minuto com fração** (45 s = `0,75`), duas casas — a soma
  em minutos na planilha continua fechando. **Nasce a coluna H `DURACAO_SEG`**
  (segundos inteiros), para ler a microparada sem converter; o cabeçalho é
  criado sozinho na 1ª gravação em aba antiga. ⚠ **re-deploy** do `.gs`.
- **Linha antiga continua igual**: hora sem segundos lê como `:00`, e a célula
  de hora sai como sempre saiu (`HH:mm`) quando não tem segundos.
- **Cronômetro da TV e banner do celular** partem do segundo certo, e abaixo de
  1 min mostram segundos (*"45 s"*).

**Atenção — números que mudam a partir de agora (nada muda no passado):**
- Tempo parado, caixas perdidas, disponibilidade, Pareto, SMED, minutos/1.000
  e o simulador passam a somar a **fração de minuto** de cada parada. Uma
  parada de 45 s que antes valia **0** (ou 1, dependendo da virada do minuto)
  agora vale 0,75 min. No dia a dia a diferença é pequena; em dia de muitas
  microparadas o tempo parado **sobe** — é o tempo que sempre existiu e não
  era contado.
- **Formato de duração:** abaixo de 1 min sai em segundos (*45 s*), minuto
  quebrado sai *3m15s*, inteiro continua *3 min*, acima de 1 h continua *1h05m*.
- **TEMPO MÉDIO por parada** deixa de ser inteiro (era *"0 min em média"* com
  paradas de 40 s).
- **Distribuição do SMED** com faixas contíguas (`≤3 · 3–5 · 5–10 · 10–20 ·
  >20 min`): com a fração, uma troca de 3,5 min caía fora de todas.
- Antes do re-deploy o app já manda os segundos; o backend antigo só trunca a
  `DURACAO_MIN` e devolve a hora sem segundos — nada quebra.

Testes: `paradas-calc.test.js`, `rp-core.test.js` e `apps-script.test.js`
(roda o `endParada` real numa aba de 7 colunas). O `relatorios.test.js` estava
quebrado na `main` desde a v7.55 (três `const` repetidos e quatro guardas que
não acompanharam o 🖨 CARTEIRA) — consertado o teste, sem mudança de painel.

## v7.58.0 — 16/09/2026

Só a impressão da aba PLANO, aprovada pelo PPCP com o PDF na mão
(*"deixar a impressão mais profissional, está muito carregada"*). **A tela não
muda e nenhuma conta muda** — é a pele do papel (`_PLANO_SKIN`), como manda a
regra do #204/#205.

- **Cor só onde há função**, a mesma regra do relatório semanal: barra de dia
  que cabe sai em **grafite**, só o dia que **não cabe** fica vermelho; a faixa
  acima do melhor dia quase desaparece; card com borda neutra e só o card do
  problema colorido. Na tabela sobraram duas cores: o que não cabe e o espaço
  livre.
- **Sai o que se repete**: os selos *PESA* dentro das barras e a legenda deles
  (a coluna PESO DO MIX e a lista de lotes já dizem), a coluna **ALTURA** (NÃO
  CABE e ESPAÇO LIVRE respondem em caixas), as colunas **LINHAS** e **O QUE
  MAIS PESA** (a lista de lotes diz lote a lote) e a legenda *dia com folga*,
  que no papel não existe mais.
- **O peso do mix vira texto**, sem a pílula: a caixa em volta chamava mais
  atenção que o número.
- Cabeçalho dos dias na lista de lotes mais curto; título **CARTEIRA** e a
  linha de meta sem quebra; fontes de card e tabela ajustadas.

## v7.57.0 — 16/09/2026

Sem mudança nos números de hoje. Pedido do PPCP, 16/09/2026: *"se a linha
diminuir as paradas em x%, daria ou não?"*.

- **E SE PARADAS** na barra da aba PLANO: *como hoje* · −10% · −25% · −50%.
  Com um cenário escolhido, a carteira ganha uma linha logo abaixo do veredito:
  quanto a linha faria a mais por dia, o que o dia passaria a comportar, o que
  não caberia e a sobra — e a resposta **DARIA / NÃO DARIA** com o veredito do
  cenário. Sai também nos dois PDFs.
- A conta devolve a cada dia da régua a fração escolhida da **perda por parada
  não programada** daquele dia — a mesma conta da aba PARADAS e do SIMULADOR
  (`RP_PARADAS`: duração produtiva × meta do dia ÷ horas produtivas). Nada de
  fórmula nova; a carteira não muda, muda o que a linha comportaria.
- As paradas vêm pelo mesmo carregador da GESTÃO DE PERDAS (cache de 5 min,
  voo compartilhado). Em *como hoje* não há busca. Se a leitura falhar, a linha
  diz que o cenário não saiu, nunca um número inventado.

## v7.56.0 — 16/09/2026

**Atenção — a capacidade da aba PLANO mudou de base: é a JORNADA NORMAL, sem
hora extra** (pedido do PPCP, 16/09/2026: *"tem que ser justo, desconsiderar
horas extras"*). Antes cada dia do histórico entrava com o realizado total, HE
dentro: o melhor dia (3.217 cx em 15/09) tinha 224 cx de hora extra; a
madrugada de 05:00 contava inteira. A HE era contada duas vezes — escondida na
régua ("cabe") e como remédio do veredito ("é hora extra").

- Cada dia entra com **realizado − HE CX**, a mesma separação do card CAIXAS
  EM HORA EXTRA e do relatório semanal. Sábado com produção (HE o dia inteiro)
  sai da curva sozinho.
- **Os números mudam**: a faixa alvo, o melhor dia, ALTURA de cada meta, o
  "cabe / não cabe" da carteira e o veredito. A meta que "batia" só com hora
  extra passa a sair como *abaixo* no bloco COMO TEMOS DATADO — coerente com
  o "meta batida com hora extra" do relatório semanal.
- **Dia sem a separação** (fechado antes da v5.0, ou o dia de hoje ainda
  aberto) entra inteiro e a tela diz quantos são.
- Vale para os dois blocos, a tela e os dois PDFs, por uma função só
  (`_qpDiasBase`). Rótulos: *REALIZADO S/ HE*, *MELHOR DIA SEM HORA EXTRA*,
  *capacidade = jornada normal* na barra e no cabeçalho dos relatórios; o
  tooltip do gráfico mostra o total ao lado.

## v7.55.5 — 16/09/2026

Só impressão. Pedidos do PPCP, 16/09/2026: *"quero impressão só dos lotes,
separado do estudo de baixo"* e *"faça teste com a impressão virada"*.

- **🖨 CARTEIRA**, botão novo na aba PLANO: só a seção da carteira (veredito,
  cards, gráfico, dia a dia e OS LOTES PROGRAMADOS), **em paisagem** — o
  gráfico ganha a largura da folha e cada lote cabe numa linha. O cabeçalho
  diz o intervalo datado, a régua, a faixa alvo e se está em carga pelo mix.
- O botão antigo virou **🖨 ESTUDO** (carteira + como temos datado + como o
  número sai, retrato), sem mudança.
- As peças são as mesmas nos dois (`_cartMontar`, `_cartHtml`,
  `_cartLotesHtml`, `_PLANO_SKIN`, `_rpDocParadas`). Muda a moldura, a
  orientação e a largura do desenho (`CART_SVG_W_PAISAGEM`).

## v7.55.4 — 16/09/2026

Só o **relatório da QUALIDADE DO PLANO** (🖨 na aba PLANO). Pedidos do PPCP,
16/09/2026, com o PDF na mão: *"separa a carteira do outro gráfico e insere os
produtos programados"*, *"essa impressão está muito carregada"*, *"tem muita
coisa escrita"*. Nenhuma conta mudou.

- **A carteira tem folha própria**: a seção COMO TEMOS DATADO começa em
  página nova.
- **OS LOTES PROGRAMADOS, DIA A DIA**: tabela nova dentro da seção da
  carteira — por dia (programado · carga · peso · o que não cabe), cada lote
  com código, produto e cor, quantidade, peso em palavras e carga, do lote
  que mais pesa para o que menos pesa.
- **Menos texto no papel**: saíram o parágrafo de abertura (régua, faixa e
  dias julgados foram para a linha do cabeçalho), as notas sob os títulos, a
  nota longa "Como ler" dos dois blocos e a explicação da caixa do mix (fica
  só o veredito da conferência). A seção COMO O NÚMERO SAI ficou com cinco
  linhas curtas. Na tela nada disso mudou — é a pele do papel que esconde.
- Legenda do gráfico da carteira mais curta, na tela e no papel.

## v7.55.3 — 16/09/2026

Sem mudança de conta. Pedido do PPCP: *"precisa ser fácil interpretação, bater
o olho e entender"* — a carteira com mix falava em "cx de linha", "×1,22" e
"2 aparado(s)", vocabulário de quem escreveu a conta.

- **Vocabulário**: "cx de linha" virou **CARGA**; o seletor é *carga pelo mix*
  / *caixas cruas*.
- **Barra**: o número em cima é o **PROGRAMADO** (o que se confere na
  planilha); dentro da barra o selo **PESA +22%** / **PESA −28%**; o fantasma
  tracejado continua marcando a altura do programado.
- **Tabela**: colunas PROGRAMADO · **PESO DO MIX** (selo em palavras: *+22%
  lento*, *−28% rápido*, *normal*) · CARGA. O detalhe técnico (lotes sem
  histórico, pesos limitados) foi para o tooltip da célula.
- **A caixa do mix** virou duas frases: *como a carga é calculada* (produto
  lento pesa mais, rápido pesa menos, com exemplo) e *conferência* (*os pesos
  valem* / *não explicam a variação*). O diagnóstico numérico ficou em corpo
  menor no fim.
- "Aparado" = peso do produto fora da faixa plausível (menos de ⅓ ou mais de
  3× da média, quase sempre hora parcial no apontamento) e limitado no
  extremo. Agora a tela diz isso em palavras.

## v7.55.2 — 16/09/2026

Correção de leitura, sem mudança de conta. Com o mix ligado, o gráfico da
carteira mostrava a barra em cx de linha e o gestor conferiu contra a
PROGRAMACAO: *"a qtde de produto no gráfico não bate com a carteira"*.

- O **programado cru** passa a aparecer como **fantasma tracejado** atrás de
  cada barra (a linguagem do fantasma da meta no gráfico semanal), com o
  número na base (*prog. 3.125*). A barra sólida continua sendo o que a régua
  julga (cx de linha). O título do gráfico e a legenda dizem a unidade.
- Sem mix (CAIXAS CRUAS) nada disso é desenhado — o gráfico é o de antes.

## v7.55.1 — 16/09/2026

Correção da v7.55.0, medida em produção na primeira abertura: com a régua em
**todo o histórico** o mix pedia **90 dias** do log de produto e a leitura
(a mais cara do backend) estourou as 3 tentativas de 25 s no cold start —
a carteira ficou em **MIX NÃO APLICADO**.

- A régua do mix é uma **escada: 60 dias e, sem resposta, 30** (o período que
  a aba PRODUÇÃO/HORA prova todo dia). A descida é **automática, uma vez,
  30 s depois** (o servidor já acordou na tentativa que estourou) e só em
  timeout — erro e backend sem a ação não descem. A tela avisa *"tentando de
  novo sozinho em 30 s com a régua do mix em 30 dias"* e a linha do MIX diz
  qual régua ficou valendo.
- **Atenção**: com a régua da aba em 90 dias ou todo o histórico, os pesos do
  mix saem dos últimos 60 (ou 30) dias — a linha do MIX imprime o número.
  Nenhuma outra conta mudou.

## v7.55.0 — 16/09/2026

**Atenção** — **a carteira da aba PLANO mudou de unidade: sai em CX DE LINHA**
(pedido do PPCP, 16/09/2026: *"sobrecarregado; pelo histórico temos tempo de
cada produto, o que dá pra fazer?"*). Cada lote **já datado** entra pesado pelo
ritmo demonstrado do produto: `qtde × (ritmo de referência ÷ ritmo do produto)`.
O ritmo é o mesmo cx/h da aba PRODUÇÃO/HORA (média aparada, log de produto do
período da régua); a referência é o Σcx ÷ Σhoras de produto do mesmo período.
Os números de CARTEIRA EM ABERTO, DIAS QUE NÃO CABEM, PRECISA MUDAR DE DIA,
ESPAÇO LIVRE, NIVELADO e o veredito **passam a sair nessa unidade**; o
programado cru fica ao lado, na tabela e no card. Medido com os fatores de
julho na carteira de 16/09: **17/09 tem 3.125 cx programadas de MESA CABECEIRA
SLEEP (205 cx/h, rápido) → ~2.000 cx de linha**; 3.000 cx de caixa pequena não
custam o mesmo que 3.000 de caixa grande.

- **Por que peso relativo, e não "carga em horas".** A esteira roda dois
  produtos ao mesmo tempo: medido em 21 dias, 37.085 cx a 107 cx/h dão 347 h
  de produto contra ~185 h de linha, e a razão varia de 1,1 a 2,5 por dia.
  Somar `qtde ÷ ritmo` daria uma carga em horas quase 2× maior do que a linha
  rodaria. Na razão referência ÷ ritmo os dois lados foram medidos do mesmo
  jeito e o paralelismo se cancela em boa parte. **A régua da aba continua UMA
  (percentis do realizado por dia)**; o que muda é o que entra em cada barra.
- **CONFERÊNCIA na tela**: nos dias da régua, o realizado convertido pelo mix
  de cada dia oscila menos que em caixas cruas? A linha do MIX diz os dois
  números e quanto o mix explica. Medido nos 6 dias inteiros de julho que
  chegaram: **36% → 13%** (explica 64%). Se não explicar, a tela manda
  preferir CAIXAS CRUAS. É otimista de propósito (os pesos saíram dos mesmos
  dias): serve para reprovar um mix ruim, não para provar um exato.
- **Seletor CARTEIRA na barra**: `cx de linha (mix)` (padrão) · `caixas cruas`.
  Persiste em `rpe_qp_pref`. Só o bloco de cima lê — o de baixo julga metas de
  dias que já passaram, cuja programação o arquivamento já levou.
- **Lote sem histórico entra com fator 1 e é CONTADO** ("N sem base"); fator
  fora de 0,33×–3× é limitado e marcado ("aparado") — 1 cx/h de apontamento
  capenga daria fator 100.
- Tabela DIA A DIA: colunas **PROGRAMADO · CX DE LINHA · MIX · O QUE MAIS PESA
  NO DIA** (o lote mais pesado, em cx de linha — para escolher O QUE mover).
- **Mix pedido e não aplicado nunca passa em silêncio**: a linha do MIX diz a
  causa (sem resposta · sem endpoint · erro · sem dados) e que a carteira está
  crua. `_cartMontar` é a montagem única da tela e do PDF; o relatório ganha a
  linha O MIX em COMO O NÚMERO SAI.
- **Custo**: uma leitura de `getProducaoModeloPeriodo` para o período da régua
  (60 dias por padrão; 90 no máximo), com cache de 5 min, requisição em voo
  compartilhada e reaproveitando o período se a aba PRODUÇÃO/HORA já o buscou.
  Sem re-deploy do `.gs`.

## v7.54.0 — 15/09/2026

**Atenção** — nenhuma conta mudou. A aba PLANO ganhou o botão **🖨 IMPRIMIR**
(pedido do usuário: *"quero uma impressão para analisar"*).

### O relatório

Três seções, no documento compartilhado dos relatórios (`_rpDocParadas`, retrato):

1. **A CARTEIRA QUE VEM** — veredito, os 4 cards, o gráfico de barras e a tabela
   dia a dia. Se a leitura da `PROGRAMACAO` falhar, **o relatório sai inteiro,
   só sem esta seção** — a mesma regra da cascata e das paradas no semanal.
2. **COMO TEMOS DATADO** — veredito, os 4 cards, o gráfico meta × realizado e a
   tabela dos dias, na ordem escolhida na tela.
3. **COMO O NÚMERO SAI** — curva de capacidade, altura, oscilação, os dois
   recortes, o que sai e o que cabe, a dívida, e o que isto **não** é
   ("não é baixar a meta"; "a faixa é mediana, não limite"; "nivelar não é
   sequenciar").

### Uma marcação, duas peles

Os desenhos do papel são **os mesmos da tela** (`_cartHtml`, `_qpHtml`). O que
muda é a pele: um bloco de CSS escopado em `.plano-doc`. Os tokens que o SVG lê
(`--ok`, `--red`, `--bg`…) são **redefinidos** ali para a paleta do papel — sem
isso, cor inválida em SVG vira preto. Medido no Chromium: `rgb(198, 40, 40)`,
não preto.

Os cards levam as **duas famílias de modificador** no mesmo `class=`
(`ok g`, `red r`…): o painel lê uma, o documento lê a outra — a mesma regra do
`_pgMin1000Html`.

### Ajustes que o papel expôs

- A dica *"passe o mouse"* não vai ao papel (não há mouse numa folha).
- A tarja dos rótulos do gráfico de barras passou a escolher o **lado livre**
  (`_svgLadoLivre`): a 660px ela tapava o valor do 3º dia.
- A leitura da dívida (atraso + o que falta hoje) mora em **um lugar**
  (`_planoDivida`), lido pela tela e pelo papel.

---

## v7.53.0 — 15/09/2026

**Atenção** — nenhuma conta mudou. Ajuste de escala dos gráficos da aba PLANO,
depois de duas correções do usuário no mesmo dia.

```
                    v7.51 e antes   v7.52.0   v7.53.0
altura do gráfico        510px        210px     300px
corpo dos rótulos       21,9px        9,0px      12px
veredito do usuário   "muito grande" "muito pequeno"   —
```

O corpo dos rótulos agora mora numa constante (`FS`) dentro de cada desenho, em
vez de `font-size="9"` espalhado em doze lugares, e a tarja atrás dos rótulos
recebe o corpo da fonte — largura e altura saem dele.

---

## v7.52.0 — 15/09/2026

**Atenção** — nenhuma conta mudou. Os dois gráficos da aba PLANO estavam sendo
**ampliados** em telas grandes, e a linha do realizado não tinha como ser lida.

### O gráfico ocupava a tela ampliando, não desenhando

`viewBox` fixo em 760px com `width:100%` faz o SVG dar **zoom**. Medido num
monitor de 1920px em 15/09/2026:

```
                         antes          depois      régua do painel
altura do gráfico        510px          210px       230px (.chart-box-lg)
escala                   2,43×          1,00×
legenda de 9px           21,9px          9,0px      10px (.qp-leg)
altura da aba inteira   3.461px       2.824px
```

A legenda saía **maior que o rótulo dos cards ao lado**. Agora a largura do
desenho vem do próprio card (`_svgLargura`), então o gráfico **ocupa** o espaço
em vez de ampliar. Em tela estreita ele encolhe junto, como antes.

Junto: a tarja preta atrás dos rótulos do gráfico passou a ter a largura do
**texto** (`_svgTarja`). Ela tinha número fixo, calibrado no desenho ampliado —
na escala 1:1 sobrava caixa preta tapando barra.

### A linha do realizado não tinha número

No gráfico de baixo só a **meta** tinha ponto e tooltip. O realizado era um traço
cinza sem marcador, sem número e sem alvo de mouse: dava para ver que as duas
linhas não se acompanham — que é o achado da tela — mas não **quanto** a linha
produziu em nenhum dia.

- O realizado ganhou **ponto próprio**.
- Cada dia ganhou uma **faixa de toque** que cobre a coluna inteira, com as duas
  quantidades: `03/08 · meta 1.663 cx (p68) · produziu 1.011 cx · 60,8% da meta`.
  Acertar um ponto de 4px com o mouse era tarefa; agora qualquer ponto do
  gráfico responde.
- Com **15 dias** o número do realizado sai **impresso** na tela. ⚠ O corte
  estava em 12 e o ramo era **morto**: o menor botão da barra é 15 DIAS, então o
  número nunca chegaria à tela.

---

## v7.51.0 — 15/09/2026

**Atenção** — corrige um defeito da v7.50.0, publicada hoje. A aba PLANO dizia
**"SEM CARTEIRA DATADA"** com a `PROGRAMACAO` cheia: 78 linhas datadas de 16 a
24/09 e o painel afirmando que não havia nenhuma.

### A mensagem servia para tudo

`SEM CARTEIRA DATADA` aparecia igual quando não havia lote futuro **e** quando a
leitura falhava. Como `getProgramacaoDetalhada` é das chamadas mais caras do
backend (catálogo + `PROGRAMACAO` + FIFO) e era a **última das pesadas com uma
tentativa só**, um cold start do Apps Script bastava para a tela mentir.

É o mesmo defeito que o `PH_FALHA` do comparativo por modelo já tinha resolvido
em 26/08/2026 — e que está escrito nesta memória com o nome *"TIMEOUT não é
backend velho"*.

### O que mudou

- **Três tentativas em sequência**, com espera crescente (nunca em paralelo: o
  Apps Script atende uma execução por vez).
- **Cinco estados, cinco mensagens**, cada um com botão de ↻ TENTAR DE NOVO:

```
NÃO CONSEGUI LER A PROGRAMAÇÃO   timeout / cold start → tentar de novo
BACKEND SEM getProgramacaoDetalhada   respondeu sem a ação → ESTE é re-deploy
O BACKEND DEVOLVEU ERRO          mostra a mensagem do backend
PAINEL SEM GOOGLE SHEETS         falta a URL do Apps Script
SEM LOTE DATADO PARA A FRENTE    leu N linhas, a mais distante é DD/MM
```

- ⚠ A frase do **re-deploy** só sai quando o backend **provou** não conhecer a
  ação. Mandar mexer no Apps Script por um timeout faz o gestor perder a tarde
  no lugar errado — já aconteceu uma vez neste painel.
- O estado vazio legítimo diz **quantas linhas leu** e **qual a data mais
  distante**, para a afirmação ser conferível sem abrir a planilha.

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
