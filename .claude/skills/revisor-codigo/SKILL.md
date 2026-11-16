---
name: revisor-codigo
description: Revisor de código DESTE projeto (RitmoPatrimar · Embalagem — painéis HTML estáticos + Apps Script). Roda node testes.js e confere o diff contra o padrão do projeto (docs/padrao-codigo.md), devolvendo cada achado com arquivo:linha, a regra, o cenário que quebra e a correção. Use antes de commit, PR ou merge, e quando pedirem "revisar", "revisão", "revisor", "conferir o código" ou /revisor-codigo neste repositório. Aqui ele substitui o anthropic-skills:revisor-codigo, que é de React + Vite (o app de cronoanálise) e não serve para este código.
---

# Revisor de código — RitmoPatrimar · Embalagem

A régua é o **padrão do projeto**, não o gosto de quem revisa. Leia
`docs/padrao-codigo.md` antes de começar: os achados citam os códigos de lá
(A1, E2, F4…). Se a régua não cobre um caso, ele não é achado de padrão — no
máximo uma SUGESTÃO, ou uma pergunta.

Não reformate, não "modernize" e não comente o que está fora do diff.

## 1. O que revisar

- Sem argumento: o que a branch mudou em relação à `main`, mais o que ainda
  não foi commitado.
  ```bash
  git fetch origin main
  ```
  ```bash
  git diff origin/main...HEAD
  ```
  ```bash
  git diff HEAD
  ```
  Sem rede para o fetch, use a `main` local e diga isso no relatório.
- Com argumento: o commit, a faixa (`a..b`) ou os arquivos pedidos.
- Para cada função que o diff toca, leia a função INTEIRA no arquivo — o diff
  não mostra quem chama, nem o que vem antes do `return`.

## 2. O automático primeiro

```bash
node testes.js
```

- Suíte ou lint falhando → **BLOQUEIA**, com a linha que falhou.
- `⚠ lint-js.js … (só a conferência de sem uso …)` → o eslint não rodou por
  falta de `npx` ou de rede. Diga no relatório que só a conferência de sem uso
  valeu. Qualquer outro erro do eslint já sai como falha (❌).
- Não repita como achado o que o lint já acusou.

## 3. O diff contra o padrão

Passe pelas seções do `docs/padrao-codigo.md` que o diff toca. As perguntas
que mais acham defeito neste projeto:

- **Conta duplicada (A2, D2)**: a regra nova já existe no `rp-core.js`, no
  `paradas-calc.js` ou em outra tela? Tela e papel leem a mesma montagem?
- **Desenho com conta (D1)**: a função que monta HTML ou SVG calcula alguma
  coisa? A conta tem de vir pronta.
- **Zero × vazio (E1, E2)**: algum `||` onde zero é valor? Algum dado que
  falta virando 0 na tela?
- **Número inventado (E3)**: falta UEP, meta ou leitura e a conta segue com uma
  média ou um padrão no lugar?
- **Dois vereditos (C4, D4)**: a tela nova julga em outra régua que a tela
  vizinha? Usou a palavra do selo num rótulo?
- **Chamadas (F1–F5)**: leitura nova no ciclo do painel? Em paralelo? Sem
  cache, sem voo compartilhado? A falha diz a causa certa? Pedido no meio da
  leitura é engolido? Escrita sem id ou sem reler depois do "sem resposta"?
- **`var` trocado (B1)**: alguém trocou um `var` existente por `let`/`const`?
  Confira se o nome é usado antes da linha da declaração (a TV travava assim).
- **Escape (G1)**: texto da planilha entra no HTML sem `_rpEsc`/`_escH`? Em
  atributo, com aspas sem escapar?
- **Segredo (G2)**: algum valor sensível (custo-hora, meta de pontos, chave,
  código do PPCP) no código, no teste ou na documentação?
- **CSS (D3, D5)**: regra nova sem escopo? Hexadecimal no lugar do token?
- **Teste (I1, I2)**: a conta nova tem teste rodando o código real? A correção
  tem um teste que falharia com o defeito de volta?
- **Layout (I4)**: mexeu no que aparece na tela e não há medição de altura e
  largura nas resoluções do padrão?

## 4. Versão e documentação (H)

Confira a tabela da seção H do padrão contra os arquivos do diff:

- HTML do PC mudou e o `APP_VER` não?
- HTML do celular mudou e o `APP_VER` ou o `CACHE` do `sw-mobile.js` não?
- `.gs` mudou e não subiram juntos o cabeçalho `Versão:`, o `GS_VERSAO` e o
  `GS_REPO`?
- Mudou número exibido ou formato de arquivo e a entrada do CHANGELOG não tem
  **Atenção** com antes → depois?
- Regra nova sem a seção no CLAUDE.md, ou regra revogada que ficou lá como se
  valesse?

## 5. O relatório

```
REVISÃO — <o que foi revisado> · node testes.js: <21 de 21 ok | N falharam>

BLOQUEIA (n)
1. arquivo:linha — o defeito, numa frase
   Regra: E2 · Cenário: <entrada ou estado> → <o que sai errado>
   Correção: <o que fazer>

AJUSTE (n)
1. …

SUGESTÃO (no máximo 3, só se valer o tempo)

FICOU DE FORA: <o que não foi revisado, e por quê>
```

- **BLOQUEIA**: quebra na hora de rodar; número errado na tela ou no papel;
  dado gravado errado; suíte ou lint falhando; versão que deixa a produção
  inconsistente (HTML novo com o `rp-core.js` velho, `.gs` sem o trio).
- **AJUSTE**: padrão não seguido sem efeito imediato (nome, escopo do CSS,
  CHANGELOG sem Atenção, comentário de regra revogada).
- Todo achado tem um cenário concreto. Sem cenário, não é achado: vai como
  pergunta em FICOU DE FORA.
- Nada achado → diga isso numa linha, com o que foi conferido.

## 6. Limites

- Não aprova nem faz merge. Não corrige sem pedido; se pedirem "revisa e
  corrige", corrija só BLOQUEIA e AJUSTE e rode `node testes.js` de novo.
- Quem escreveu o código e revisa na mesma conversa revisa ancorado. Para uma
  leitura independente, rode esta revisão num subagente passando só o diff e o
  caminho desta skill — não a explicação de quem escreveu.
- Outras lentes, quando o diff pede: visual (`anthropic-skills:revisor-visual`),
  chão de fábrica (`anthropic-skills:revisor-ux-fabrica`), contas
  (`anthropic-skills:auditor-calculos`), textos da tela
  (`anthropic-skills:redator-produto`). Elas complementam; a régua do código é
  esta.
