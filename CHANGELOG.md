# Notas de versão — RitmoProd · Embalagem

Uma entrada por publicação. **Atenção** é obrigatório em toda mudança que altera
um número exibido ou o formato de um arquivo — o gestor precisa saber por que o
indicador da semana passada mudou.

O número da versão é o `APP_VER` no topo de cada painel: `v7.x` é o desktop
(gerencial + TV), `mobile 1.x` é o app do operador. Mudança no
`ritmoprod_appscript.gs` **não sobe pela Vercel** — exige colar no editor do
Apps Script e re-deployar; essas vêm marcadas com ⚠ **re-deploy**.

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
