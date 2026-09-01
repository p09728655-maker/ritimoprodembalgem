# Notas de versão — RitmoProd · Embalagem

Uma entrada por publicação. **Atenção** é obrigatório em toda mudança que altera
um número exibido ou o formato de um arquivo — o gestor precisa saber por que o
indicador da semana passada mudou.

O número da versão é o `APP_VER` no topo de cada painel: `v7.x` é o desktop
(gerencial + TV), `mobile 1.x` é o app do operador. Mudança no
`ritmoprod_appscript.gs` **não sobe pela Vercel** — exige colar no editor do
Apps Script e re-deployar; essas vêm marcadas com ⚠ **re-deploy**.

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
