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

## Notas / armadilhas conhecidas
- **Modo DEMO** (botão "SELECIONAR PASTA", produção zerada, horários genéricos
  tipo `12:12-13:12`): aparece quando a chamada ao Sheets dá **timeout**. Quase
  sempre é **cold start do Apps Script** (resposta pode passar de 12s), não perda
  de dados. Recarregar a página costuma reconectar. NÃO é causado por mudanças
  de front-end.
- **Alerta de "hora fraca" (⚠)**: compara a produção de hoje (`HORA_A_HORA`) com a
  média histórica por horário (`HISTORICO_HORA`, via `action=getMediaHoras`).
  Só dispara com **≥2 dias** de amostra e produção **>15% abaixo** da média.
  - A comparação de horário é **imune ao tipo de traço** (`normHora`/`mergeMedias`
    normalizam `-`, `–`, `—` e espaços). Manter assim.
  - Na **TV** o marcador é **só `⚠`** (sem texto `<méd>`): o texto longo quebrava a
    linha, aumentava a altura e empurrava o último horário para fora da tela.
    Na **gerencial** também é só `⚠` (média no tooltip).
