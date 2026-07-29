# RitmoProd · Embalagem — Memória do projeto

Painel de ritmo de produção (Patrimar Móveis · Embalagem · Jaci/SP).
Front-end estático (HTML/JS) publicado na Vercel; dados vêm de um Google Sheets
via Google Apps Script (JSONP).

## Arquivos
- `ritmoprod_embalagem_v7.html` — painel desktop (telas **GERENCIAL** e **TV OPERACIONAL**).
- `ritmoprod_mobile.html` — painel mobile.
- `ritmoprod_appscript.gs` — backend (Apps Script). **Mudanças aqui NÃO sobem pela
  Vercel**: precisam ser coladas no editor do Apps Script e **re-deployadas** manualmente.
- `vercel.json` — `/` → v7, `/mobile` → mobile.
- Deploy front-end: automático pela Vercel ao dar merge na `main`.

## ⚠️ NÃO ALTERAR sem pedido explícito
- **Horário do turno / rótulos dos slots.** O slot pós-almoço é **`12:12-13:00`**
  (mais curto por causa do almoço) — **não** é `12:12-13:12`. Preservar os rótulos
  exatamente como estão na planilha `HORA_A_HORA`.
- **A conexão com o Google Sheets** (`CFG.sheetsUrl` / lógica de `lerSheets` /
  `jsonpFetch`). Não mexer na URL nem no fluxo de conexão.

## Início do turno (célula C3)
- As linhas de **05:00** e **06:00** existem **sempre** na aba `HORA_A_HORA`. Quem
  decide se elas aparecem para o operador é a célula **`C3`** (linha 3, coluna C):
  **`5` → turno começa 05:00** (dia com hora extra matinal, mostra 05:00/06:00);
  **`7` ou vazio → 07:00** (turno normal, esconde 05:00/06:00).
- O **backend** (`ritmoprod_appscript.gs`, função de leitura) lê `C3`, filtra os
  slots anteriores ao início e ainda devolve `turnoInicio` no JSON. Como o filtro
  é no backend, **mobile, TV e gerencial** ficam consistentes de uma vez.
  Lembre: mudar o `.gs` exige **re-deploy manual** no editor do Apps Script.

## Tela cheia de PARADA (ao vivo)
- O operador **registra a parada e dá o START no mobile** (`ritmoprod_mobile.html`,
  modal PARADAS): escolhe o tipo, escreve o **motivo** e a parada fica **em
  andamento** (linha sem `FIM` na aba `PARADAS`). Ao voltar a produzir, dá **START**
  (encerra → carimba `FIM`).
- A **TV OPERACIONAL** (`ritmoprod_embalagem_v7.html`) faz *poll* de `getParadas`
  (15s) e, havendo parada **sem FIM**, mostra uma **tela cheia** (`#tv-parada-over`,
  dentro de `#sec-tv`) com tipo + motivo + cronômetro. Some sozinha quando o START é
  dado. É chamada JSONP separada — se falhar, **não** derruba os dados nem cai no DEMO.
- Backend: `saveParadas` virou **upsert por ID** e há a ação **`endParada`** (carimba
  `FIM`/`DURACAO`). ⚠️ Mudou o `.gs` → **re-deploy manual** no Apps Script.
- **Tipos de parada (dropdown) são editáveis na planilha:** aba **`TIPOS_PARADA`**
  (coluna A). O mobile lê via `getTiposParada` (criada com padrões na 1ª vez). O
  *motivo* continua **texto livre** digitado pelo operador — não se cadastra.

## Notas / armadilhas conhecidas
- **Modo DEMO** (botão "SELECIONAR PASTA", produção zerada, horários genéricos
  tipo `12:12-13:12`): aparece quando a chamada ao Sheets dá **timeout**. Quase
  sempre é **cold start do Apps Script**, não perda de dados. NÃO é causado por
  mudanças de front-end.
  - **Só zera na TV**: a TV se recarrega sozinha a cada 28 min (anti-sleep WebOS,
    `setTimeout(location.reload, 28min)`). Se o reload pega o Apps Script "frio",
    o `lerSheets` estoura e cai no DEMO. O auto-refresh normal (5 min) NÃO zera —
    em falha mantém os últimos dados.
  - **Mitigação já aplicada:** timeout do `jsonpFetch` = **25s** e a carga inicial
    usa `lerSheetsComRetry(4)` (reconecta antes de desistir). Manter assim.
- **Aba PARADAS "sumindo" no refresh** (seção 1 em `CARREGANDO…` enquanto o resto
  segue com dados): **não é queda de conexão**. Cada render dispara 2×
  `getParadasPeriodo` (período + comparativo) e o backend lê a aba `PARADAS`
  **inteira** (`getDataRange`) antes de filtrar — o custo cresce com o histórico
  todo, não com o período escolhido.
  - **Mitigação já aplicada:** no refresh do mesmo período os KPIs **ficam na
    tela** (esmaecidos + `atualizando…` ao lado do título da seção 1); só troca de
    período/classe limpa o grid. `renderAnaliseParadas()` tem **guarda de
    reentrância** (ciclos não se empilham) e o `getHistory` tem **cache de 2 min**
    (`invalidarHistoricoCache()` no refresh manual).
  - Se falhar com dados já em tela, mantém os últimos números e marca
    `⚠ não atualizou — dados de HH:MM:SS`. **Intervalo de refresh curto (1 min)
    piora tudo**: o ciclo não termina antes do próximo. Recomendado 5 min.
- **Alerta de "hora fraca" (⚠)**: compara a produção de hoje (`HORA_A_HORA`) com a
  média histórica por horário (`HISTORICO_HORA`, via `action=getMediaHoras`).
  Só dispara com **≥2 dias** de amostra e produção **>15% abaixo** da média.
  - A comparação de horário é **imune ao tipo de traço** (`normHora`/`mergeMedias`
    normalizam `-`, `–`, `—` e espaços). Manter assim.
  - Na **TV** o marcador é **só `⚠`** (sem texto `<méd>`): o texto longo quebrava a
    linha, aumentava a altura e empurrava o último horário para fora da tela.
    Na **gerencial** também é só `⚠` (média no tooltip).
