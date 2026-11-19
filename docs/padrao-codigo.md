# Padrão do código — RitmoPatrimar · Embalagem

É a régua do revisor do projeto (`/revisor-codigo`) e de quem mexe no código.
Cada regra tem um código (A1, E2…) para o revisor citar. A parte que dá para
cobrar por máquina está no `node testes.js` (suítes + `lint-js.js`); o resto
o revisor confere no diff.

Quase tudo aqui veio de um defeito que chegou à fábrica. O porquê de cada
regra está no arquivo do tema, em `docs/memoria/` (o mapa e o resumo do que
vale hoje estão no CLAUDE.md). **Antes de mexer numa área, leia o arquivo
dela.**

---

## A. Antes e depois de mexer

- **A1.** `node testes.js` verde antes de começar e antes do commit. Falhou
  antes de você mexer? Diga, não "conserte de carona".
- **A2.** Regra que vale para os dois painéis (PC e celular) mora UMA vez:
  função pura no `rp-core.js`, conta de parada no `paradas-calc.js`. Nunca uma
  cópia em cada HTML — foi assim que a conta de paradas divergiu três vezes.
- **A3.** No `rp-core.js` só entra função PURA: nada que leia `DADOS`, `CFG`
  ou toque no DOM. Nome novo publicado por ele entra na lista `G_MODULOS` do
  `lint-js.js` — só depois de conferir que existe.
- **A4.** Não mexer na conexão com a planilha (`CFG.sheetsUrl`, `jsonpFetch`,
  `lerSheets`), nem nos horários e rótulos do turno, sem pedido explícito.

## B. Formatação

O código já segue um padrão. Ele vale para o que se escreve; o que está
diferente se corrige só na linha que você já está mexendo.

- **B1.** 2 espaços, sem tabulação. `const`; `let` só quando reatribui.
  `var` só onde o comentário diz por quê: no `paradas-calc.js` (legado), nos
  guardas inline do `<head>` e no estado do PC que é usado ANTES da linha que o
  declara (`PARADA_TV`, `GER_DATA`, `PG_TELA_*`…: com `let`, a TV travava em
  "AGUARDANDO" na abertura). **Nunca troque `var` existente por `let`/`const`**
  sem conferir que ninguém usa o nome antes da declaração — nem o lint nem as
  suítes pegam isso.
- **B2.** Siga o estilo do arquivo: nos dois HTMLs é `if(`, `){`; no `.gs`, no
  `paradas-calc.js` e no `sw-mobile.js` é `if (`, `) {`. Nos dois casos, ponto e
  vírgula e aspas simples no JS (aspas duplas nos atributos do HTML montado em
  texto).
- **B3.** **Não rodar formatador automático (Prettier e afins) em arquivo
  inteiro.** Medido em 16/11/2026: o painel do PC iria de 28 mil para 52 mil
  linhas (largura 120; no padrão do Prettier, ~59 mil), 17 das 20 suítes quebram (os testes leem o código como texto) e o
  histórico linha a linha do git se perde.
- **B4.** Comentário diz o PORQUÊ, em português, com o caso e a data quando a
  regra nasceu de um incidente; ⚠ marca armadilha. Não comentar o óbvio.
  Regra revogada sai do comentário (ou vira "até a vX…, desde a vY…").
- **B5.** Código morto sai (o git guarda o que saiu). Função que fica sem
  chamador de propósito entra na lista `SEM_USO_OK` do `lint-js.js`, com o
  porquê numa linha.

## C. Nomes

- **C1.** Função interna leva o prefixo do módulo: `_ucv` cronoanálise, `_takt`
  takt da semana (estado `TKS_*`, CSS `tks-`), `_tka` avaliar programação, `_gpx` próximos dias, `_pg`
  gestão de perdas, `_qp`/`_cart` plano, `_ph` produção/hora, `_uep` aba UEP,
  `_ger` gerencial, `_dir` diretoria, `_pdia` produtos do dia, `_cap`
  capacidade, `_cxu` caixas × UEP, `_reg` réguas. Antes de criar um nome (ou
  uma classe CSS), procure se ele já existe — `tks-op` já era outra coisa.
- **C2.** Estado do painel e constante de regra em MAIÚSCULAS (`PONTOS_DIA`,
  `TKS_TTL`, `GPX_EXC_MAX`), declarados junto do bloco que os usa. Número que
  é regra (limite, tolerância, prazo) vira constante com nome e comentário,
  nunca número solto no meio da conta.
- **C3.** Chave de `localStorage` (prefixo `rpe_` ou `rp_` — os dois aparecem
  nos dois painéis; o `rpe_cfg` do celular guarda a URL do Apps Script)
  **nunca é renomeada**: o aparelho perde a configuração. Chave nova só quando o
  SENTIDO do dado muda, e a antiga é apagada na 1ª abertura.
- **C4.** **Um nome por indicador**: o mesmo número tem o mesmo nome na tela, no
  papel, no CHANGELOG e no `docs/glossario.md`. A palavra do veredito ("NO
  RITMO", "META BATIDA") é só do selo, nunca de um rótulo.

## D. Tela e papel

- **D1.** Três peças separadas: a **conta** (pura, testada), o **desenho**
  (só lê o que chegou pronto, nenhuma conta) e a **leitura** (busca). Os testes
  prendem "desenho sem conta"; não esconda conta no desenho.
- **D2.** Tela e papel do mesmo indicador leem a MESMA montagem e a mesma
  marcação. O que muda é a pele (CSS). Uma segunda marcação para o papel
  envelhece sozinha.
- **D3.** CSS sempre escopado pela seção ou pelo documento (`#sec-x .y`,
  `.uep-doc .y`). Regra solta no documento comum dos relatórios
  (`_rpDocParadas`) muda todos eles juntos.
- **D4.** **Um veredito por tela.** Cor só onde tem função: o número é tinta,
  o selo dá o veredito, e o selo sempre tem a palavra junto da cor.
- **D5.** Cor por token (`var(--ok)`, `var(--red)`…), nunca hexadecimal no
  meio da tela. Exceção: o `<canvas>` do Chart.js não lê token (cor literal);
  e o papel redefine os tokens na pele dele.
- **D6.** A TV é lida a 15 m e continua no fundo preto; texto novo nela é
  medido nas duas resoluções antes de subir.

## E. Números

- **E1.** Sem dado não é zero: `null` e "—" na tela, nunca 0. Zero afirma
  ("não produziu"); o traço diz que não há informação.
- **E2.** Quando zero é valor, `!= null`, nunca `||` (`x || y` troca o zero
  pelo outro campo).
- **E3.** Nunca inventar número: sem UEP, sem meta ou sem leitura, o item sai
  da conta e é listado ou contado à parte. Nada de média no lugar do que falta.
- **E4.** Soma crua, arredonda só na exibição. Diferença mostrada ao lado de
  dois números é a diferença dos números EXIBIDOS (a conta lida tem de fechar).
- **E5.** Percentual de um período é Σ realizado ÷ Σ meta dos mesmos dias,
  nunca a média dos percentuais.
- **E6.** O passado não é regravado sozinho: dia fechado guarda o número dele.
  Regra nova vale dali em diante; refazer o histórico é decisão do PPCP, por
  rotina de editor.

## F. Apps Script (leitura e escrita)

- **F1.** Uma chamada por vez, em sequência. Nunca `Promise.all` de chamadas ao
  Apps Script: ele atende uma execução por vez e, juntas, elas estouram o
  tempo todas.
- **F2.** Leitura cara: cache com prazo (`*_TTL`), voo compartilhado (a 2ª
  pedida espera a 1ª), retentativa em sequência com espera crescente, e só
  com a aba aberta. Leitura nova no ciclo do painel precisa justificar o custo.
- **F3.** Falha tem causa, e a tela diz qual: sem resposta (cold start) não é
  backend antigo. "Falta colar o `.gs`" só quando o backend RESPONDEU e não
  conhece a ação.
- **F4.** Pedido feito no meio de uma leitura fica pendente e roda no fim —
  nunca é engolido (`if(rodando) return` sem pendente é defeito).
- **F5.** Escrita é idempotente (um id por gravação). Sem resposta não prova
  que não gravou: releia e confira antes de avisar ou de deixar repetir.
  Recusa que não vai mudar volta com `ok:true, recusado:true` (não retenta).
- **F6.** No `.gs`, leitura usa o memo da execução; escrita lê direto da
  planilha e roda sob o lock dos lançamentos.
- **F7.** Campo novo em leitura pesada: conferir o tamanho da resposta contra
  o cache do `.gs` — 100 KB numa chave; acima, em partes até 300.000
  caracteres (`CACHE_MAX_PARTES` × `CACHE_PARTE_CHARS`, v5.74); acima disso,
  não cacheia. Até a v5.73 o teto era 100 KB.

## G. Segurança

- **G1.** Todo texto que vem da planilha ou do operador passa por `_rpEsc` (PC)
  ou `_escH` (celular) antes de entrar no HTML. Em atributo (`title`,
  `aria-label`, `onclick`) escape também as aspas — o `_rpEsc` só escapa
  `& < >`. Em `onclick`, passe índice, nunca o texto.
- **G2.** O HTML é público (Vercel). Custo-hora, meta de pontos, código do
  PPCP, chaves de API: nunca no código, no teste ou na documentação — vão na
  planilha ou nas Propriedades do script.

## H. Versão e documentação (toda mudança publicada)

| Mexeu em | Suba |
|---|---|
| `ritmoprod_embalagem_v7.html` | `APP_VER` |
| `ritmoprod_mobile.html` | `APP_VER` **e** o `CACHE` do `sw-mobile.js` |
| `rp-core.js` | `versao` no `RP_CORE` |
| `ritmoprod_appscript.gs` | o cabeçalho `Versão:`, o `GS_VERSAO` e o `GS_REPO` do painel, juntos — e avise do re-deploy manual |

- **H1.** Uma entrada no `CHANGELOG.md`. **Atenção** (antes → depois) é
  obrigatório quando muda um número exibido ou o formato de um arquivo.
- **H2.** Regra nova ou mudada vai para o arquivo do tema em `docs/memoria/`,
  com a data e o caso; se ela muda o que vale, a linha do resumo no
  `CLAUDE.md` também. A revogada sai do resumo e fica marcada como revogada no
  arquivo do tema, com a versão. Seção nova entra no `docs/memoria/README.md`.
- **H3.** Indicador novo ou mudado: `docs/glossario.md`, com a fórmula
  conferida no código.

## I. Testes e medição

- **I0.** TODA mudança leva teste de regressão, no MESMO commit (PPCP,
  19/11/2026: *"colocar no md toda vez criar teste de regressão"*): defeito
  corrigido, conta, regra, tela ou fluxo novo. O teste prova o EFEITO (o
  número, a linha que some, o aviso que aparece) — não só que a função foi
  chamada. Sem teste não se entrega; quando não der para testar (ex.: só o
  `.gs` em produção), o commit e a resposta dizem por quê e o que foi
  conferido à mão.
- **I1.** Conta nova ou mudada: teste que roda o código REAL (extraído do
  HTML ou do `.gs`), com um caso real do dia em que o problema apareceu.
- **I2.** Correção de defeito: o teste falha com o defeito de volta. Confira
  desfazendo a correção (mutação) antes de dar por certo.
- **I3.** Suíte nova: na raiz do repositório, com o nome terminado em
  `.test.js` (o `testes.js` acha sozinha). Suíte que passa de 2 min reprova.
- **I4.** Mexeu em layout: medir no Chromium a ALTURA e a largura. PC 1920,
  1366 e 1280; celular 360, 390 e 430; TV 1920×1080 e 1366×768; papel com a
  mídia de impressão e as fontes carregadas.

## J. O que a máquina cobra (`node lint-js.js`)

Nos dois HTMLs, no `rp-core.js`, no `paradas-calc.js`, no `sw-mobile.js` e no
`.gs`, com a linha do próprio arquivo:

- **sem uso** (roda sem rede): função ou constante declarada no nível de cima
  (coluna 0) que ninguém usa. Comentário de linha ou de bloco, em qualquer
  ponto, não conta como uso; o nome dentro de texto conta (é o onclick montado)
  e `obj.nome` também. No `paradas-calc.js` tudo mora numa IIFE: lá quem
  confere é o `no-unused-vars` do eslint;
- **eslint** (precisa do `npx`, que baixa o eslint na 1ª vez): nome usado sem
  existir; função ou variável declarada duas vezes; chave repetida no mesmo
  objeto; `case` ou `else if` repetido; `x = x`; código depois do `return`;
  atribuição a `const`; variável local nunca usada. Sem `npx` ou sem rede, ele
  avisa e só a conferência de sem uso vale; qualquer outro erro do eslint
  reprova.
