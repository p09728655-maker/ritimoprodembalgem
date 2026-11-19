# Hora extra, meta e o que vai para o HISTORICO — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## Caixas em HORA NORMAL × HORA EXTRA
- **A JORNADA NORMAL É 07:00–17:00. Fora dela, é hora extra** (PPCP,
  31/08/2026: *"05:00 as 06:00, 06:00 as 07:00 sempre é hora extra, e após
  17:00"*). O almoço 11:00–12:12 fica DENTRO da jornada. `HE_JORNADA_INI_MIN` /
  `HE_JORNADA_FIM_MIN` são a janela, num lugar só — o backfill dos dias antigos
  usa a MESMA (antes ele terminava às 18:00 e o fechamento não olhava horário
  nenhum: duas réguas para o mesmo indicador, no mesmo arquivo).
  ⚠ A janela **repete** o TURNO da configuração do painel (`CFG.turnoInicio` /
  `CFG.turnoFim`, hoje 07:00 e 17:00). O backend não enxerga essa config — só
  conhece o INÍCIO do turno, pela célula `C3`. Mudou o turno na tela? **Mudar as
  duas constantes do `.gs` também**, senão a HE passa a ser contada por uma
  janela que não existe mais.
- **DOIS critérios, e trocá-los quebra coisas diferentes:**
  - **`_ehHoraExtra(rótulo)` = QUE LINHA É.** Só o prefixo `HE `. Governa a
    **limpeza diária** (que APAGA a linha marcada) e o **filtro do C3** (linha
    marcada não é filtrada). ⚠ Alargar este critério faria a limpeza **deletar
    as linhas de 05:00 e 06:00** — que existem sempre — e faria elas aparecerem
    no app mesmo com `C3=7`.
  - **`_ehHoraExtraCaixas(rótulo, data)` = QUE CAIXAS CONTAM.** Prefixo **ou**
    horário fora de 07:00–17:00 **ou**, com a data, **sábado e domingo o dia
    inteiro** (`.gs` v5.68 — ver *SÁBADO E DOMINGO SÃO HORA EXTRA O DIA
    INTEIRO*). É este que alimenta o `he` do payload do `getDados` (e daí o
    `realHE`/`realNormal` e o card CAIXAS EM HORA EXTRA) e o `he`/`heCx` do
    `arquivarDiaAtual`. Sem a data, só o horário.
  - **Por que existem os dois:** o fechamento contava só pelo rótulo, e a
    madrugada **nunca é rotulada** — ela é liberada pela `C3`. Resultado medido
    em 31/08/2026 na planilha real: **69 dias seguidos com a coluna HE do
    HISTORICO em ZERO**, enquanto a produção das 05:00–07:00 era hora extra de
    verdade (26/08: 167 + 240 = **407 cx** de madrugada, e a coluna gravou 0).
    Todo valor de HE CX que existia ali veio do backfill, não do fechamento.
  - A **META do dia continua excluindo só a linha com rótulo** (`ehHE`): a
    madrugada não tem meta preenchida na planilha, e mexer nisso mudaria a meta
    histórica dos dias.
  - Antes a linha era gravada como `17:00-18:00`, **indistinguível de uma hora de
    turno** — enquanto o resto do `.gs` já classificava por `startsWith('HE')`
    (fechamento e limpeza diária). Resultado: a contagem `HE` do `HISTORICO`
    fechava em 0 e a limpeza não apagava a linha extra. `_ehHoraExtra()` /
    `_semPrefixoHE()` são a implementação única desse critério no backend; o
    prefixo sai antes do parse do horário, senão o início viraria `HE 17:00`.
  - A HE **nunca** é filtrada pelo início do turno: ela é extra justamente por
    estar fora da janela (inclusive uma HE de madrugada num dia com `C3=7`).
- `getDados` devolve **`he:true`** por slot; v7 e mobile propagam isso para
  `DADOS`. `calcKPIs` (nos dois) devolve `realHE` / `realNormal` / `nHE` — é daí
  que saem o card **CAIXAS EM HORA EXTRA** (gerencial e mobile), o subtítulo do
  PRODUÇÃO REAL e o `CAIXAS · X NORMAL + Y EXTRA` da **Tela B** da TV.
  - O card só aparece **quando o dia teve HE** — sem hora extra ele diria "tudo
    normal" e só empurraria os outros KPIs para baixo.
  - Na TV o texto é de **uma linha** e vai na Tela B (`#tvb-prod-unit`): a Tela A
    tem `.tv-left{display:none}` — o `#tv-he-split` que mora lá só aparece no
    layout estreito. Linha que quebra empurra o resto da tela para fora.
- **Histórico: a coluna `HE CX`** (11ª da aba `HISTORICO`) guarda as caixas de
  hora extra do dia; `arquivarDiaAtual` e `saveDay` gravam. `getHistory` e
  `getHoraDia` devolvem `heCx` + `realNormal`.
  - **Dia antigo (fechado antes da v5.0)**: a coluna está vazia. Aí o `.gs`
    deriva `REALIZADO − soma(HISTORICO_HORA do dia)` — funciona porque
    `arquivarHorasDoDia` grava **só as horas não-HE**, então a diferença É a hora
    extra. Só deriva quando a coluna `HE` indica que houve HE; se o dia nem
    existe na `HISTORICO_HORA`, devolve **`null`** e a tela mostra **"—"**, nunca
    0 — zero afirmaria "não teve hora extra", coisa que o dado não sustenta
    (`_heIndef()` no v7 é quem trata isso).
  - Nos totais (KPI do período, rodapé do relatório), dia indeterminado entra no
    **normal** para a soma fechar com o TOTAL, e o número de dias assim aparece
    ao lado ("N dia(s) sem separação de hora extra").
- **A coluna H. EXTRA some dos relatórios quando ninguém fez hora extra** no
  período (senão vira parede de `—`), mesma regra da coluna MOTIVO do relatório
  de paradas. Se mexer, manter `<th>`, `<td>` e o rodapé sob a mesma condição.
- **Reconstruir a HE dos dias antigos: `simularHoraExtraPassada()` /
  `preencherHoraExtraPassada()`** (rodar pelo editor do Apps Script). A aba
  `PRODUCAO_PRODUTO` guarda `DATA · HORA · CAIXAS` de cada lançamento. Conta
  como extra, por dia: em **dia útil**, o lançado **antes das 07:00** ou
  **depois das 18:00**; em **sábado e domingo, o dia INTEIRO** (não é jornada
  normal). A soma vira a `HE CX`.
  - ⚠ **17:00 em diante É hora extra** (corrigido em 31/08/2026 com o PPCP).
    Antes a régua daqui ia até 18:00 e o 17:00–18:00 contava como jornada
    normal — enquanto o turno da planilha termina 17:00 (último slot
    `16:00-16:59`). Agora a janela é a mesma do fechamento.
  - **Sábado conta o dia todo** — confirmado com o PPCP no 04/07/2026 (sábado
    com produção das 05:00 às 16:00): a HE é o dia inteiro (**1.278 cx**, o
    próprio REALIZADO), não só as 388 cx lançadas antes das 07:00. A flag
    `HE_SABADO_INTEIRO` (hoje `true`) deixa isso explícito no código.
  - Simula primeiro: a função de simulação **não grava**, só lista no log — e
    informa quantas linhas leu, quantas aproveitou e quantas tinham **HORA
    ilegível**. "0 dias" sem esse diagnóstico não distingue "não teve hora
    extra" de "não consegui ler a planilha".
  - A coluna **HORA pode ser texto ou hora de verdade**: formatada como hora ela
    chega ao script como `Date`, e o parse por regex ignorava TODAS as linhas em
    silêncio. `_heMinutosDaHora` passa por `_horaStr()`, que trata os dois casos.
  - Dia que só existe no log (sem linha no `HISTORICO`) é avisado com `⚠` — não
    há onde gravar a `HE CX` dele.
  - A gravação **nunca sobrescreve** `HE CX` já preenchida, e rodar duas vezes
    não duplica. Para corrigir um valor gravado errado existe
    `recalcularHoraExtraPassada()`, que regrava tudo.
  - **Teto pelo REALIZADO**: hora extra maior que a produção do dia é
    impossível. Aconteceu no 04/07 (sábado, log de produto com 1.339 contra
    1.278 de realizado — lançamento duplicado). O valor é cortado no realizado e
    o log avisa, em vez de gravar um número que não fecha.
  - ⚠ **Cobertura**: a `PRODUCAO_PRODUTO` só recebe lançamento com **produto
    identificado**, o que é opcional no app. O log mostra, por dia, quanto do
    `REALIZADO` está coberto — cobertura baixa significa hora extra
    subestimada, e aí é melhor lançar o número na mão.
- ⚠ Mudou o `.gs` (v5.0) → **re-deploy manual** no Apps Script. Antes disso o
  front simplesmente não recebe `he`/`heCx` e as telas seguem sem a divisão.

## EFICIÊNCIA: uma régua só, e é a META DO DIA
- **O cartão mostrava um número de uma conta com a cor de OUTRA.** O número era
  `efDia` (realizado ÷ meta do DIA) e a cor/status vinham de `ef` (realizado ÷
  meta das horas já lançadas, que sai da `HORA_A_HORA`). Enquanto as duas metas
  concordam ninguém percebe. Medido em **31/08/2026**: a PROGRAMAÇÃO pedia
  **2.709 cx** no dia e a `HORA_A_HORA` planejava **164 cx/h** (1.476 no dia) —
  84% de diferença. A TV escreveu **49,8% em VERDE com "DENTRO DA META"**, ao
  lado da própria **PROJEÇÃO FINAL de 1.519** contra meta de 2.709.
- **A régua é `efNoRitmo(real, metaDia, minRodado, minTurno)` no `rp-core.js`**,
  uma implementação para os dois painéis: realizado ÷ quanto da **meta do dia**
  já deveria estar feito a esta altura do turno.
  - **Rateio por MINUTOS, não por nº de horas**: o slot pós-almoço vale 48 min, e
    contá-lo como hora cheia cobraria meta de 12 minutos que não existem.
  - **Só entra hora COM LANÇAMENTO** — hora que ninguém apontou ainda não é hora
    atrasada (mesma regra do `calcAtrasoHoras`).
  - **Só a JORNADA** (v7.248.0 / mobile 1.51.0): as caixas e os minutos da hora
    extra ficam fora (`realNormal`, minutos de jornada) — a hora extra não tem
    meta. Sem minuto de jornada lançado não há o que julgar: AGUARDANDO, sem cor
    (nunca ABAIXO DO RITMO).
  - Turno sem hora lançada devolve 0, como os painéis já faziam antes.
- **O NÚMERO GRANDE é o % da META DO DIA; o veredito é o selo** (pedido do
  usuário, 01/09/2026: *"essa eficiência está confundindo as pessoas"*). A TV
  mostrava **EFICIÊNCIA 103,8%** em verde com **DENTRO DA META** embaixo, num dia
  de **780 cx contra meta de 2.700**: os dois números certos (103,8% é 780 ÷ 751,
  o que a meta pedia até ali), mas **dois "%" e dois sentidos de META na mesma
  tela** — e quem lê de longe fica com o primeiro.
  - O número grande virou **28,9% DA META DO DIA**, em **tinta** (sem cor de
    status): é o fato que qualquer um confere de cabeça. Mesma regra do
    relatório semanal — *o número é tinta, o veredito é o selo*.
  - O selo passou a falar de **RITMO**, nunca de meta: `NO RITMO` · `ATENÇÃO` ·
    `ABAIXO DO RITMO` (**`slRitmo`**, texto ÚNICO no `rp-core.js` — TV, desktop e
    celular não podem responder "estamos no ritmo?" com palavras diferentes).
  - A linha de apoio traz **caixas, não um segundo percentual**: *"780 de 751 cx
    esperadas até agora"*. A barra segmentada da Tela B enche pelo % do dia e
    pega a **cor do selo** (antes lia a cor do número, que agora é tinta).
  - ⚠ **A conta não mudou** — `efNoRitmo` continua sendo quem pinta a tela.
    Trocou qual número ocupa o lugar grande.
- **Quem usa: TV (telas A e B)** (os gerenciais julgam pela UEP — o do PC desde a v7.243.0, o do celular desde a 1.50.0; o % DA META DO DIA virou fato no card CAIXAS PROGRAMADAS; ver *GERENCIAL DO PC: A UEP NA FRENTE* e *GERENCIAL DO CELULAR: A UEP NA FRENTE*).
  Painel que julga o mesmo instante de dois jeitos é o defeito que este projeto
  mais pagou caro — por isso a conta saiu dos dois HTMLs para o núcleo.
  `rp-core.test.js` cobre a conta e `relatorios.test.js` falha se `sc(k.ef)`
  voltar a pintar alguma tela.
- **O % da meta do dia não sumiu**: era o número grande e virou a **linha de
  apoio** (`#tv-ef-sub` na Tela A, espelhado em `#tvb-ef-sub` na Tela B, e o
  `sub` do card no gerencial). ⚠ A Tela A tem `.tv-left{display:none}` no layout
  largo — **a tela que roda na TV é a B**, e ela espelha o DOM da A: linha nova
  na A precisa de espelho no `_sincSlideB`, senão só aparece no layout estreito.
- ⚠ **Quando as duas metas divergirem muito, o problema pode ser o DADO**: meta
  do dia vinda da PROGRAMAÇÃO (`CFG.metaDia`, via `aplicarMetaDiaAutomatica`)
  contra a meta/hora digitada na `HORA_A_HORA`. O painel agora acusa a diferença
  em vez de escondê-la atrás de um verde.

## A TV SEM A HORA EXTRA (v7.265.0 · mobile 1.59.0, 17/11/2026)
- **O caso.** 17/11/2026, 16:22, dia com madrugada (C3 = 5): 273 cx de hora
  extra, 1.188 na jornada, meta 1.350, a hora 16:00 já com lançamento. A Tela B
  mostrava **108,2%** DA META DO DIA (1.461 ÷ 1.350), a barra cheia (pintada de
  vermelho pela cor do selo), PROJEÇÃO FINAL **1.461** contra a meta de 1.350 e,
  do lado, **ABAIXO DO RITMO** com *"1.188 DE 1.350 CX ESPERADAS ATÉ AGORA"*.
  PPCP: *"108% abaixo do ritmo?"* → *"tem que ver as réguas"* → *"essa tela
  está em cx"* → *"tem que tirar hora extra"* → *"nessa apresentação ainda
  caixa"*.
- **Eram duas réguas, e uma delas torta:**
  - o % e a projeção contavam a hora extra; o selo, não (v7.248.0). Hora extra
    não tem meta: a HE "pagava" uma meta que não é dela;
  - o selo cobrava a **hora em andamento inteira** assim que ela recebia o 1º
    lançamento (às 16:22, os 59 min da hora 16:00 — o esperado já era o dia
    todo). A régua da UEP divide pelos minutos que passaram desde a v7.114.0
    (`minSlotDecorrido`); o selo em caixas tinha ficado na régua antiga, no PC
    e no celular.
- **A regra agora:**
  - **o selo** (PC e celular): `efNoRitmo(realNormal, meta, minNorm, minTurno)` —
    os mesmos minutos da UEP (`minNorm`). No caso: 1.188 de **1.255** esperadas,
    94,6%, **ATENÇÃO** (era ABAIXO DO RITMO);
  - **na TV, nada do que se compara com a meta conta a hora extra**: o % DA
    META DO DIA e a barra (`efDiaJ` = caixas da jornada ÷ meta: **88,0%**), o
    FALTAM e o banner (`gapJ`: 162), o NECESSÁRIO (`necJ`) e a PROJEÇÃO
    (`projJ`);
  - **o NECESSÁRIO é o RITMO NECESSÁRIO da UEP em caixas** (`_gerAnaliseUep`):
    o que falta da jornada ÷ os minutos de jornada que restam A PARTIR DE AGORA
    (`minRestJ`, o almoço fora) × 60 — às 16:22, 162 ÷ 37 min = **263 cx/h**.
    Na 1ª versão desta mudança ele dividia pelas horas sem lançamento; a
    revisão mostrou que às 14:05, com a hora 14:00 em 10 cx, isso dava 250 cx/h
    (500 ÷ 2) onde restavam 2h54 (173), e que uma hora esquecida de manhã
    contava como hora pela frente às 17:10. Jornada encerrada (`minRestJ` 0): a
    tela diz o que faltou (*CX P/ META*), nunca um ritmo;
  - **a PROJEÇÃO da TV é a régua do selo**: caixas da jornada × minutos de
    jornada do turno ÷ minutos de jornada decorridos (1.188 × 527 ÷ 490 =
    **1.278**). Projeção ÷ meta é sempre o % do selo — as duas não se contradizem.
    Sem minuto de jornada (só a madrugada), "—". Ela também deixou de dar a
    hora em andamento por encerrada (antes, às 16:22, projeção = realizado).
    É a conta do `uepProj` (PROJEÇÃO · UEP), em caixas — inclusive nos dois
    defeitos que as duas têm e ficaram para depois: ⚠ nos primeiros minutos
    da jornada ela oscila (07:03 com 12 cx: 2.108; firma por volta das 07:10;
    o selo, no mesmo instante, NO RITMO com "12 DE 8") e ⚠ uma hora de
    jornada esquecida (sem lançamento) é projetada como se fosse ser lançada
    no mesmo ritmo, mesmo com a jornada encerrada. Corrigir num lugar só
    deixaria UEP e caixas com duas réguas: mexer nas duas juntas;
  - com hora extra no dia, a unidade da PROJEÇÃO e do FALTAM diz **CAIXAS NA
    JORNADA** (`tvb-proj-unit`, `tvb-falta-unit`; Tela A: *CX NA JORNADA*):
    depois da madrugada a projeção da jornada fica menor que a PRODUÇÃO
    ACUMULADA, e sem a palavra pareceria erro;
  - a **PRODUÇÃO ACUMULADA** segue com tudo, separada (1.461 · 1.188 NORMAL +
    273 EXTRA): a hora extra é fato, só não tem meta;
  - **fica como estava**: o fim de semana (tudo é hora extra; a barra contra o
    programado e a projeção de sempre), o RITMO ATUAL (todas as horas), e fora da
    TV o `efDia`, o `gap`, o `nec` e o `proj` (o card CAIXAS PROGRAMADAS fala do
    PROGRAMADO, e a caixa da hora extra atende o lote; o resumo do WhatsApp e a
    análise em caixas do gerencial não foram mexidos). ⚠ Por isso, sem a UEP
    do dia, o mesmo nome dá números diferentes: *Projeção* do WhatsApp 1.461 ×
    TV 1.278; RITMO NECESSÁRIO da análise em caixas (por horas, com a hora
    extra) × NECESSÁRIO da TV. Pendente — levar a régua da TV para lá é decisão
    do PPCP;
  - **o selo novo vale onde o selo em caixas aparece**: TV, e o card CAIXAS
    PROGRAMADAS dos dois gerenciais quando falta a UEP do dia.
- **Medido no Chromium** (Tela B, o caso de 17/11, TV 1920×1080 e 1366×768,
  com os cartões da fábrica e com o padrão): *CAIXAS NA JORNADA* numa linha só
  (29 px a 1920, 22 px a 1366 — a mesma altura de *CAIXAS*), sem estouro de
  largura; a coluna da direita ficou da mesma largura do dia sem hora extra
  (com o 108,2% ela alargava 27 px a 1920). Com o padrão de cartões (com FALTAM
  e PESO), a coluna passa do pé da tela (1.056 de 1.040 a 1920; 829 de 728 a
  1366) — **igual na v7.264.0**, não é desta mudança; com os cartões da foto da
  fábrica (META, PROJEÇÃO, %, STATUS) cabe.
- `relatorios.test.js` roda o `calcKPIs` e o `renderTV` REAIS com o caso de
  17/11 (PC e celular); desfazer qualquer uma das correções (hora cheia no selo
  do PC ou do celular, % / barra / FALTAM com a hora extra) derruba um teste.

## Dia PASSADO no gerencial: hora extra não tem meta, e a meta não se dilui
- A `HISTORICO_HORA` guarda **só `data · hora · realizado`** — sem meta e sem
  marca de hora extra. A tela repartia a meta do dia entre **todas** as horas
  arquivadas, o que num dia iniciado às 05:00 dava meta a horas de HE e diluía a
  das horas de jornada. Medido em **28/08/2026**: 1.881 ÷ 11 = **171** para
  todas, quando as 9 horas de jornada pediam **209** — e a madrugada (96 cx)
  saía `ABAIXO`, virando o VALE DE PRODUÇÃO do dia.
- **`_horaEhHE(rótulo)`** é a regra no front: prefixo `HE ` **ou** horário fora
  de `CFG.turnoInicio`–`CFG.turnoFim`. É a mesma do `_ehHoraExtraCaixas` do
  `.gs`; a janela vem do turno configurado no painel, que o `.gs` repete nas
  constantes `HE_JORNADA_*` (mudou o turno na tela, mudar lá também).
- A meta/h passa a ser `meta ÷ horas de jornada`; a hora extra sai com `—` em
  META/H e EFICIÊNCIA e ganha a etiqueta **HORA EXTRA** (`.b-acc`) no lugar do
  veredito. **PICO e VALE** olham só as horas de jornada, e o RITMO MÉDIO usa a
  mesma base do `arquivarDiaAtual` (realizado ÷ horas produtivas).
- ⚠ **Por que a madrugada está na tabela**: o `arquivarHorasDoDia` só arquiva as
  horas não-HE — mas pelo critério do `.gs` **implantado**, que ainda classifica
  HE só pelo rótulo. Enquanto o re-deploy não acontecer, a madrugada continua
  entrando na `HISTORICO_HORA` como se fosse hora de turno; por isso a regra
  precisa existir também no front.

## Dia de HOJE no gerencial: a mesma regra, ao vivo
- **O `.gs` que classifica HE por HORÁRIO foi re-deployado em 01/09/2026** — o
  usuário confirmou com o painel na tela (*"HE está marcando agora"*): num dia
  com `C3=5`, as linhas de **05:00** e **06:00** chegam ao `getDados` com
  **`he:true`** mesmo sem o rótulo `HE `. É o `_ehHoraExtraCaixas` funcionando.
- Só que a tela **ao vivo** continuava julgando essas horas. Medido no mesmo dia,
  às 06:55: META/H **245**, eficiência **98,0%** e **144,0%**, selo **OK**; PICO
  **06:00** e VALE **05:00** — as duas horas de HE, num turno que ainda nem tinha
  começado; e o `(+5)` que faltou às 05:00 sendo cobrado da hora seguinte.
  Era a v7.34.0 valendo só para o dia passado.
- **Agora a régua é uma só, e vale nos dois gerenciais** (desktop e celular):
  - hora de HE sai com **`—`** em META/H e EFICIÊNCIA e ganha a etiqueta
    **HORA EXTRA** no lugar do veredito (`b-acc`, a mesma marcação do dia
    passado). O ponto âmbar e o fundo da linha continuam onde estavam;
  - **PICO/VALE e MELHOR/PIOR HORA olham só as horas de jornada** (`k.nNorm`).
    Sem hora de jornada lançada os quatro mostram **`—`** — zero afirmaria "a
    melhor hora do turno fez 0 cx". É a MESMA base que o `arquivarDiaAtual` e o
    botão FECHAR DIA já gravavam no `HISTORICO`;
  - **hora extra fica fora do atraso acumulado, nos dois sentidos**
    (`calcAtrasoHoras` pula a linha com `he`): ela não gera atraso para as horas
    de jornada seguintes nem quita o atraso delas com caixas feitas fora do
    turno — uma madrugada forte apagaria o atraso do turno inteiro.
- **O que NÃO mudou:** PRODUÇÃO REAL, META DO DIA, CAIXAS EM HORA EXTRA,
  EFICIÊNCIA do card, RITMO ATUAL, PROJEÇÃO e RITMO NECESSÁRIO. As caixas da HE
  contam para a meta do dia como sempre contaram.
- ~~**A TV OPERACIONAL ficou fora, de propósito** (decisão do usuário,
  01/09/2026)~~ — **revogado na v7.248.0** (PPCP, 16/11/2026: *"no meio da semana
  meta 0 em horas extra"*): a hora extra não tem meta em DIA NENHUM, também na
  TV. Tabela `tv-tbl-body`: HE com meta '—', status *HE*, linha `r-he` (âmbar),
  sem atraso; Tela A (`tva-meta`/`tva-pct`/`tva-status`): *HORA EXTRA*,
  `tva-band he` (fundo neutro, texto âmbar). Celular: a lista do operador diz
  *HORA EXTRA · SEM META*, sem cor de veredito, e o lançamento abre sem meta. A
  META da linha HE do modal ⚙ HORA EXTRA não soma mais na meta do dia
  (`meta=metaBase`; o `.gs` nunca somou), e o `metaH`/`metaReal` dos dois
  `calcKPIs` são só da jornada. **O selo de ritmo em caixas também é só da
  jornada** (minutos e caixas; AGUARDANDO sem minuto de jornada lançado) — ver
  *SÁBADO E DOMINGO…*, *Da 2ª revisão*.
  - ⚠ **A PLANILHA ainda dá meta à madrugada**: a coluna META da HORA_A_HORA
    (B5) reparte a meta do dia pelas horas a partir do C3 — com C3=5 as horas
    de 05:00 e 06:00 recebem meta e as de jornada ficam com o dia ÷ 11. O
    painel ignora a meta da HE, mas a da jornada continua diluída nesses dias.
    ⚠ **Não zerar a meta da madrugada na planilha sem mexer no `.gs`**: o
    `getDados` pula slot com meta 0 (`if (metaVal === 0) continue;`) e o painel
    filtra `metaHora>0` — a madrugada sumiria das telas. Pendente de decisão.
- ⚠ **A hora de HE só aparece no celular se tiver meta na planilha**: o mobile
  monta o `DADOS` com `slots.filter(s=>s.metaHora>0)`. Linha de HE com a meta
  **vazia** some da tabela do celular *e das caixas dele* — o desktop mostraria
  as caixas e o celular não. Não foi mexido (hoje a `HORA_A_HORA` traz meta em
  todas as linhas), mas é o primeiro lugar a olhar se os dois divergirem no
  realizado de um dia com hora extra.
- `relatorios.test.js` prende a regra nos dois painéis e `rp-core.test.js` cobre
  o atraso; se a etiqueta `HE` voltar a aparecer colada num selo OK, o teste
  falha.

## O que é gravado no HISTORICO tem de fechar consigo mesmo
- **O FECHAR DIA gravava META e EFICIÊNCIA de metas diferentes.** A coluna META
  levava `k.meta` (a meta do DIA — no modo Sheets, a da PROGRAMAÇÃO) e a coluna
  EFICIÊNCIA levava `k.ef` (realizado ÷ meta das horas JÁ LANÇADAS, da
  `HORA_A_HORA`). Enquanto as duas metas concordam ninguém percebe.
  - Medido em **28/08/2026**: a linha ficou com **META 1.881 e EF 100,6%** —
    100,6% é 1.509 ÷ **1.500**. O relatório semanal, que imprime a coluna EF,
    dizia *"100,6% · NA META"*; o bloco FECHAMENTO DA SEMANA PASSADA, que
    divide `real/meta`, dizia **80,2%** para o mesmo dia.
  - O **fechamento das 23:59** (`arquivarDiaAtual`, no `.gs`) sempre fez certo:
    soma a meta das linhas não-HE e calcula `ef = real ÷ meta` com essa mesma
    meta. Quem estava fora do padrão era o botão do painel — e o fechamento das
    **17:05**, que é o mesmo botão disparado pelo relógio (`fecharDiaAutomatico`,
    no navegador do painel). ⚠ Notas antigas daqui diziam que o das 17:05 é o
    `arquivarDiaAtual`: estavam erradas (o comentário do `salvarDiaSheets` no v7
    dizia o mesmo e foi corrigido na v5.29). O `.gs` grava `AUTO dd/MM/yyyy
    HH:mm` e `FECHADO=false`; o painel grava `dd/MM/yyyy, HH:mm:ss` e
    `FECHADO=true`.
  - Hoje `salvarDiaSheets` calcula `efGrav = real ÷ k.meta` e grava ESSA.
    `relatorios.test.js` falha se `'ef='+k.ef` voltar.
- **O mesmo botão ZERAVA a coluna MEDIA CX/H.** O `saveDay` grava
  `Number(p.mediaH || 0)` e `salvarDiaSheets` nunca mandava esse campo — e,
  sendo upsert por data, o botão apagava até o valor que o fechamento automático
  já tinha escrito. **Medido na planilha real (31/08/2026): das 69 linhas do
  `HISTORICO`, as 17 com `FECHADO=TRUE` (as do botão) tinham média zerada; as do
  `AUTO` tinham o valor.** Hoje o botão manda `mediaH` = realizado ÷ horas
  produtivas (não-HE), a MESMA conta do `arquivarDiaAtual`, e `melhor`/`pior`
  passaram a olhar só as horas não-HE, como o `.gs` sempre fez.
- ⚠ **Correção (conferido na planilha em 01/09/2026): a coluna `HE` (nº de horas
  extras, coluna G) NÃO está zerada** — 22/07, 28/07, 05/08, 11/08, 28/08 e
  vários outros dias têm `2`. A anotação anterior dizia o contrário e estava
  errada. Com o `.gs` re-deployado, a contagem é por **HORÁRIO**
  (`_ehHoraExtraCaixas`): o fechamento das 23:59 grava o nº de horas de HE
  **com produção** (hoje, 05:00 e 06:00 → `HE=2`, `HE CX=660`), e o FECHAR DIA
  (botão ou 17:05) grava o mesmo número (dia fechado pelo painel tem prioridade
  — o das 23:59 não sobrescreve).
- **A PRODUÇÃO da linha sai da PLANILHA, não do retrato do painel** (`.gs`
  v5.29, PPCP 20/10/2026: *"GS NOVO"*). Conferido na linha de 19/10: REALIZADO
  **1.491** com a UEP de **1.509 cx** (3.542,4) — o log de produto e a
  HISTORICO_HORA tinham 1.509. O `salvarDiaSheets` manda o `k.real` da última
  leitura do painel (minutos de atraso), e a UEP o `saveDay` sempre calculou no
  `.gs`, lendo o log na hora: a mesma linha com números de dois momentos. As 18
  cx (501060003, hora das 16:00) entraram nesse intervalo.
  - Hoje o `saveDay` tira REALIZADO, MELHOR/PIOR, HE, MEDIA CX/H e HE CX da
    `HORA_A_HORA` (`_resumoParaFechar` → `_resumoHoraAHora`, a MESMA conta do
    `arquivarDiaAtual`, que passou a morar ali). Do painel ficam a **META** e o
    **FECHADO EM**. EF = REALIZADO da aba ÷ essa META (o das 23:59 divide pela
    soma das metas da aba — com PROGRAMAÇÃO e HORA_A_HORA discordando, as duas
    EF diferem, e é a do painel que vale).
  - **Exceção — HE que só o painel conhece** (`heLocal`): painel com MAIS caixas
    de HE (`p.heCx`) que a aba → fica tudo do painel, como antes. É o modal ⚙
    HORA EXTRA do PC com a META vazia: o `addHE` grava a linha sem caixa (ignora
    o `real`), o `getDados` pula linha de meta 0 e o REALIZADO digitado só existe
    no `rpe_he` daquele navegador. Achado na revisão: sem a exceção, essas caixas
    sumiam do HISTORICO caladas. O caminho certo é o `addHE` gravar o `real` na
    planilha — não feito (mexe no upsert por rótulo e no que o operador lança na
    mesma linha).
  - **Sob o lock dos lançamentos** (`LockService.getScriptLock`, o mesmo do
    `saveRealizado`): a leitura da aba, a do log (`_uepColsDoDia`) e o upsert saem
    do mesmo instante, e TV + PC fechando no mesmo minuto não duplicam a linha.
  - **Madrugada escondida pela C3 entra**: lançada às 05:00/06:00 e depois a C3
    volta a 7 — o painel deixa de somar (o `getDados` filtra), a aba não. A linha
    conta como HE, como o das 23:59 e a UEP HE (que separa pelo horário do log).
    Nesse dia o HISTORICO fica maior que a PRODUÇÃO REAL da tela.
  - **Trava pelo carimbo `dataDados`** (`PROP_DATA_DADOS`, gravado a cada
    lançamento e apagado no reset): com ele de outro dia, sem ele, ou com a aba
    sem produção, grava o que o painel mandou, como antes.
  - O retorno diz `fonte: 'planilha' | 'painel'` e `realPainel`, e a diferença
    vai para o log de execução do Apps Script.
  - O painel e o celular não mudaram: o `salvarDiaSheets` continua mandando
    tudo (é a rede do `.gs` antigo, do dia sem carimbo e da HE local). O
    comentário dele, que atribuía as 17:05 ao `arquivarDiaAtual`, foi corrigido.
  - `fechamento.test.js` pega 18 mutações do `.gs` (trava, lock, exceção da HE,
    meta, EF, melhor/pior, guardas de PIOR/MEDIA, soma dos LANÇ). A fixture da
    linha `HE …` é como o `addHE` cria: REALIZADO vazio, caixa só no LANÇ.
  - ⚠ Consequência aceita: hora fechada em ZERO deixa de entrar em PIOR H.,
    MEDIA CX/H e HE no fechamento pelo painel (a regra das 23:59, que ignora
    hora sem produção). A coluna REALIZADO é fórmula e dá 0 tanto para "fechou
    em zero" quanto para "ainda não chegou"; separar os dois exigiria comparar
    o rótulo de cada hora com o relógio, e a regra das 23:59 nunca fez isso.
  - ~~Lançamento DEPOIS do fechamento das 17:05 continua fora~~ — desde o `.gs`
    v5.49 ele atualiza a linha do dia (ver *Lançamento na hora RECÉM-FECHADA*).
- ⚠ **Dia já gravado não se conserta sozinho**: a linha antiga continua com o
  par velho. Corrigir é editar a planilha (ou reabrir e FECHAR DIA de novo, que
  o `saveDay` é upsert por data — vale só para HOJE, com a `HORA_A_HORA` ainda
  do dia). A linha de 19/10/2026 (1.491) foi achada na conferência de 20/10 e
  não foi corrigida pelo código.
- ⚠ **Duas leituras do mesmo indicador continuam existindo**: o relatório
  semanal e o do histórico imprimem a **coluna EF** gravada; o bloco da semana e
  a Tela D calculam `real/meta`. Enquanto a gravação estiver certa elas
  concordam. Unificar (fazer o painel sempre recalcular na leitura) mudaria o
  número dos dias antigos já gravados — decisão do usuário, ainda não tomada.

## META DO DIA = META DIA + ATRASO META — opção A (v7.202.0 / `.gs` v5.55)
- PPCP, 05/11/2026, na conversa do Apps Script (fora deste repositório): a
  v5.48 tinha passado a gravar no `HISTORICO` a META da `HORA_A_HORA` nos dois
  fechamentos, e o % do histórico deixou de bater com o % da tela. **Opção A**:
  o FECHAR DIA volta a gravar a **META do painel** (a do card META DO DIA, a do
  % na tela) e, ao lado, do que ela é feita:
  - coluna **15 META DIA** = soma das metas por hora da `HORA_A_HORA` (jornada:
    a hora antes do C3 e a linha rotulada `HE ` ficam fora — o
    `_resumoHoraAHora`);
  - coluna **16 ATRASO META** = META − META DIA, **nunca negativo**.
  - Painel sem meta → META = a da aba, atraso 0. Aba sem meta por hora (ou linha
    que sai do painel: carimbo de outro dia, HE só no navegador) → as duas
    colunas **vazias**, nunca 0. O fechamento das 23:59 não sabe a meta do
    painel: grava META = META DIA = aba e ATRASO 0.
  - `getHistory`/`getHoraDia` devolvem `metaDia`/`atrasoMeta` (`null` = vazia).
    O v5.49 (lançamento depois do fechamento) não toca nas três.
- **Painel (v7.202.0)**: `_metaPartes(metaPainel, metaDia)` é a conta (a MESMA do
  `saveDay`; o `fechamento.test.js` roda as duas em 7 casos), `_metaDiaAba()` a
  META DIA de hoje (slots do `getDados`, sem a linha `HE ` nem a HE do modal) e
  `_metaPartesTxt` o texto único dos dois cards META DO DIA (hoje e dia
  passado): com atraso, *"1.550 do dia + 600 de atraso · faltam X"*; sem,
  *"caixas programadas · faltam X"* como antes. HISTÓRICO: colunas **META DIA**
  e **ATRASO META** depois da META, só quando algum dia do período tem a META
  diferente da META DIA (`_histTemMetaComp`; regra da H. EXTRA). Dia fechado
  antes da v5.55 sai "—".
  - ~~O Excel do HISTÓRICO tira o cabeçalho das colunas visíveis~~ — a função
    não tinha botão; saiu na v7.248.2.
- ⚠ **Às 17:05 TODO painel do PC aberto (TV, gerencial) roda o
  `fecharDiaAutomatico`** com a config dele; o `saveDay` é upsert, a ÚLTIMA
  gravação vence. Por isso a META gravada não pode depender do computador:
  - **SOMAR ATRASO na `CONFIG_PAINEL` (v7.203.0 / mobile 1.42.0 / `.gs`
    v5.56)**, PPCP: *"coloca somar atraso na config painel"*. Chave
    **`META_COM_ATRASO`** (1/0). `getConfigPainel` devolve `metaComAtraso`
    (true/false; **null** sem a chave ou ilegível — nunca um palpite);
    `setConfigPainel` grava só quando o painel manda.
  - PC: `aplicarConfigPainel` guarda **`ATRASO_PLAN`** (`planilha` ·
    `sem-chave` · `antigo` = `.gs` sem o campo · null = ainda não leu); com
    `planilha` diferente do local, troca o `CFG.metaComAtraso` e refaz a meta
    (`aplicarMetaDiaAutomatica`) na mesma leitura. O `saveCfg` decide o envio
    pelo **`_atrasoEnviar`**: manda quando o gestor MUDOU a marcação ou quando a
    planilha está `sem-chave` (é o que semeia a chave) — mandar sempre deixaria
    um PC que abriu antes de ler a config desfazer a escolha dos outros (a regra
    do META_UEP). O ⚙ mostra o estado (`_atrasoPlanTxt`, `#c-meta-atraso-h`).
  - Celular: `PONTOS_DIA.metaComAtraso` (só `true` liga) e o
    `aplicarMetaDiaAutomatica` dele usa a `metaEfetiva` com a chave ligada —
    antes nunca somava e o card META DO DIA dava outro número que o PC.
  - ⚠ **Ainda local**: a meta DIGITADA à mão no ⚙ (`metaDiaManual`) vale só no
    computador onde foi digitada — e vai para o histórico se aquele PC fechar
    por último.
  - Com o `.gs` antigo (sem o campo), cada PC segue a sua marcação, como antes.
    Depois do re-deploy, a chave nasce no 1º SALVAR do ⚙ (`sem-chave`).
  - Testes: `fechamento.test.js` (o `getConfigPainel`/`setConfigPainel` reais)
    e `relatorios.test.js` (`_atrasoEnviar`, o `aplicarConfigPainel` real e o
    `aplicarMetaDiaAutomatica` do celular).
  - **Publicado e conferido em 05/11/2026**: `META_COM_ATRASO = 1` na
    `CONFIG_PAINEL` (linha 21), o ⚙ diz *"vale para todos os computadores"* e
    o card META DO DIA mostra *"1.550 do dia + 852 de atraso"* (2.402).
- ⚠ Desde a v7.226.0 o ⚙ tem a linha do SETUP DO TAKT na coluna 1 (815 px;
  a 1600×860 rola 9 px).
- **O ⚙ CONFIGURAÇÕES em três colunas (v7.204.0**, PPCP: *"aumentar dos lados
  para não dar rolagem"*). `#modal-cfg .modal` a 1.240 px (`max-width:96vw`,
  `max-height:94vh`), `.cfg-cols` com três `.cfg-col` de cartões `.cfg-sec`:
  IDENTIFICAÇÃO + METAS DO DIA · TURNO + SENHAS + LEITOR + FONTE DE DADOS ·
  PAINEL TV. Abaixo de 1.180 px, duas colunas; abaixo de 760, uma. Toda caixa
  de marcar é `label.cfg-chk > input + span` — com o `<i>` da observação solto
  dentro do flex, o texto quebrava em duas colunas. `.frm-inp` com
  `min-width:0;width:100%` no ⚙ (sem isso o campo não encolhe e sai do
  cartão). Ids, textos e funções não mudaram. Medido no Chromium com as fontes:
  787 px de altura, sem rolagem a 1920×1015, 1920×937 e 1600×860; a 1366×657
  rola. Seção nova no ⚙? Medir de novo: a coluna do meio é a mais alta.
- ⚠ **"META DIA" (coluna) e "META DO DIA" (card) são nomes quase iguais para
  números diferentes** quando há atraso. O nome da coluna veio do `.gs`; o card
  diz "do dia" e "de atraso" por extenso. Trocar o título da coluna é decisão do
  PPCP (UM NOME POR INDICADOR).
- Dias fechados com a v5.48–v5.54 publicada ficaram com a META da aba (e a EF
  por ela); não foram regravados.

## SÁBADO E DOMINGO SÃO HORA EXTRA O DIA INTEIRO (`.gs` v5.68 / v7.248.0 / mobile 1.51.0 / rp-core 1.19.0)
- PPCP, 16/11/2026, com o PERÍODO da aba ⚖ UEP na tela (7 dias, 08:41): o
  sábado 14/11 em vermelho (*894 UEP · meta 1.257 (71,1%) · +546 em HE*) e
  *"1 de 6"* → *"aos sábados é horas extra total"*. **Revoga a v5.60 / v7.222.0**
  (meta do fim de semana pelas horas de jornada trabalhadas, abaixo). Volta a
  valer, agora nos fechamentos, a regra do backfill confirmada em 04/07/2026
  (`HE_SABADO_INTEIRO`) e a que o TAKT e o PRÓXIMOS DIAS já usavam (lote de
  sábado = hora extra).
- **`.gs` v5.68**: `_ehHoraExtraCaixas(rótulo, data)` — com a data, sábado e
  domingo (`_heFimDeSemana`) são hora extra o dia inteiro. Passam a data: o
  `getDados` (todo slot `he` no fim de semana), o `getPontosDia` (a UEP em `he`),
  o `_uepPorDiaDoLog` (o log por dia: fechamentos e editor), o
  `getProducaoModeloPeriodo` (`pontosHe`) e o `_resumoHoraAHora(aba, data)` —
  no fim de semana: HE CX = REALIZADO, `he` = toda hora com produção, sem horas
  de jornada (melhor/pior/média 0). `_fracSemJornada(data)` = **0** no fim de
  semana (null em dia útil) → os três fechamentos gravam META, META DIA, ATRASO
  META, EF e META UEP **0 = sem meta**; o `saveDay` ignora a meta do painel e,
  sem a aba do dia, grava HE CX = REALIZADO. O `_atualizarHistoricoPosLancamento`
  zera a meta da linha do fim de semana (também a gravada pela v5.60). Saíram o
  `minJorn`, o `_minDoSlot` e o `_minJornHistHora` (o teste confere).
  - **A HISTORICO_HORA continua com as horas de 07–17** do fim de semana (o
    `horasArr` vai pelo horário): é delas que sai o hora a hora do dia passado.
  - ⚠ Feriado trabalhado NÃO entra (só sábado e domingo).
  - ⚠ **re-deploy manual**. Antes dele, o sábado ainda é gravado com a meta
    pelas horas (v5.67) — o painel relê como hora extra (abaixo), a planilha não.
- **Painel — UMA regra no rp-core 1.19.0**: `uepDiaMeta(d)` = 0 no fim de semana
  (pela data, mesmo com META UEP gravada); `uepDiaHe(d)` = UEP HE + (no fim de
  semana) a UEP de "jornada"; `uepHistResumo` não julga o fim de semana (fora do
  n, bateu, média, meta somada) e soma a UEP dele na `he`; `uepCustoPeriodo` o
  tira (não paga jornada); `uepCard(…, data)` no fim de semana = `fds:true`, a
  UEP toda em `he`, sem selo; `pdiaMontar(…, {todoHE})` põe tudo em HE.
  - **`histDiaFds(d)`**: a linha do HISTORICO de sábado/domingo como a v5.68
    grava (meta, META DIA, ATRASO, META UEP 0; EF 0, ok false, melhor/pior 0;
    HE CX = REALIZADO; UEP 0 e a soma em UEP HE; `fds:true`). Os painéis passam
    TODO dia do histórico por ela ao ler (`_mergeDias` no PC, `lerHistorico` no
    celular) — as linhas de 07/11 e 14/11 (gravadas pela v5.60–v5.67) aparecem
    como hora extra sem ninguém mexer na planilha.
  - **`_diaComMeta(d)`** (PC): EFICIÊNCIA MÉDIA, DIAS COM META e MELHOR/PIOR DIA
    só com dias com meta — HISTÓRICO, relatório do histórico, `_relSemanalKPIs`
    (`nComMeta`), `_relDiaExtremo`, resumo do WhatsApp; nas tabelas o fim de
    semana sai *HORA EXTRA*, sem EF nem selo; o `_svgBarChart` escreve *HE*.
  - **`_horaEhHE(rótulo, data)`** (PC): com a data, o fim de semana inteiro. Os
    slots do `getDados` entram com `he: s.he===true || uepFimDeSemana(hoje)` (PC e
    celular) — redundante com o `.gs` v5.68, mas cobre o anterior.
  - **PERÍODO da ⚖ UEP**: `_uepAbaPeriodo` → `fds` (as datas), `abaixo` e
    oscilação só dos dias com meta; cards *1 de 5* e *sábado 14/11 todo hora
    extra* (`_uepPerFdsTxt`); gráfico com a barra listrada âmbar (`uepPerLis`)
    da UEP do dia inteira, sem linha de meta; botão da sub-aba e a impressão
    pelo `res.n`. Com o print de 16/11: 1 de 6 → **1 de 5**, 92,7% → **94,7%**,
    oscilação 30,9% → **6,6%** (medido no render).
  - **Gerencial ao vivo no fim de semana** (`_gerUepCards`): o 1º card é
    *UEP DO DIA · SÁBADO* com a UEP toda em HE, sem selo; saem RITMO, PROJEÇÃO e
    PARA A META (contra a meta); a análise diz *sem meta*; a impressão e a aba
    ⚖ UEP (card e botão HOJE) idem. A montagem é a do núcleo (`uepGerMontar(o)`
    com `o.data` → `uepCard(…, data)`; no fim de semana `feito` 0 e `he` = a UEP
    toda), a mesma do celular: `_gerUepCardsM` com `c.fds` faz o mesmo hero
    (*UEP DO DIA · SÁBADO*, o ATRASO fica, saem RITMO, PROJEÇÃO e PARA A META).
  - **Dia passado** (`renderGerencialHist`): `fdsDia` → META '—', EF '—', a UEP
    toda em HE no 1º card, sem FALTOU, sem melhor/pior hora.
  - Tela D / bloco da semana: o dia de fim de semana com tarja âmbar *todo hora
    extra*; diretoria: barra âmbar sem meta; seção UEP do semanal: *sem meta*.
  - A aba PLANO tira o sábado sozinha: `_qpDiasBase` exige caixas de jornada
    (antes o 07/11 entrava com 465 cx — a pendência da v7.222.0 se resolveu).
  - Paradas num sábado: valoradas pela **mediana das metas dos dias úteis**
    (`metaDiasParadas` no histórico, `metaMedianaUteis` no `metaHoje` ao vivo,
    rp-core), em TODA tela — ver *Da 2ª revisão* abaixo.
  - **Ao vivo em caixas, também sem meta** (PPCP, na mesma conversa: *"sábado
    todas horas são extras"*): TV (`renderTV`, `fds`): `s`='warn', selo *TODO
    HORA EXTRA*, % DA META '—' com *SÁBADO · TODO HORA EXTRA · SEM META*,
    NECESSÁRIO '—', o *FALTAM* vira *SÁBADO — TODO HORA EXTRA, SEM META*
    (`.tv-falta.he`), a barra é o feito × o PROGRAMADO (`_progHojeCx()` = o
    `programadoHoje`, sem o atraso; 0 → '—'). PC (`_gerCxCards`) e celular
    (`_gerCxCardsM`): as caixas sem cor no fim de semana (mesmo sem UEP), as
    CAIXAS PROGRAMADAS com o programado do dia como fato. A tabela hora a hora da TV também não julga (todo slot é
    `he` — ver *Dia de HOJE no gerencial*). O `k.meta`/`CFG.metaDia` do sábado
    não foi zerado: é o programado, mostrado como fato.
- **Da revisão (mesma versão)**: o resumo do WhatsApp diz *"todo hora extra,
  sem meta · X UEP em hora extra"* (era *"(0,0%) · 0 UEP"*); a análise em
  caixas do PC diz *sem meta*; a
  Tela B não mostra META DO DIA; o *programado* do fim de semana é o
  `programadoHoje` (`_progHojeCx` — sem o atraso que o SOMAR ATRASO põe na META
  DO DIA); a cascata do 🖨 do dia não sai no fim de semana; a eficiência do
  período no celular voltou a total ÷ meta (~~a régua do `_relMetaHE.efTotal`~~
  — corrigido na 2ª revisão: só os dias com meta, ver abaixo); o
  *cx/dia* da Tela D divide pelos dias com meta; a diretoria diz *TODO HORA
  EXTRA · SEM META* (sem barra); as paradas do fim de semana são valoradas pela
  **mediana das metas dos dias úteis** do histórico (`metaDiasParadas`,
  rp-core) — antes caíam na meta do dia em que se abria a tela; e rede para o
  rp-core antigo em cache (`histDiaFds`/`uepDiaHe` no guarda do núcleo).
- **Da 2ª revisão (mesma versão)**:
  - **O selo de ritmo em caixas julga SÓ A JORNADA** (os dois `calcKPIs`:
    `efNoRitmo(realNormal, meta, minutos de jornada lançados, minutos de
    jornada do turno)`), como o selo da UEP e o `_relMetaHE`. Com a hora extra
    sem meta, contar os minutos dela no esperado e as caixas dela no feito fazia
    a TV dizer ABAIXO DO RITMO às 06:45 (só a madrugada lançada) ao lado das
    linhas "sem meta", e o modal ⚙ HORA EXTRA mudar o selo do dia (103,4% →
    112,0%). Sem minuto de jornada lançado, `metaAteAgora` 0 → **AGUARDANDO**
    neutro (TV: `.tv-status-badge.neu`, barra `var(--txt2)`, a linha diz as
    caixas de hora extra e a hora em que a jornada começa; PC e celular sem
    UEP: *AGUARDANDO A JORNADA* nas CAIXAS PROGRAMADAS, sem cor) — vale também antes do 1º lançamento de um
    dia comum (antes piscava ABAIXO DO RITMO). Com hora extra, o *"X DE Y CX
    ESPERADAS"* da TV conta só as normais (o NORMAL da linha das caixas da Tela
    B), sem a palavra NORMAIS: medido no Chromium, ela alargava a coluna da
    direita da Tela B em até 65 px a 1366 (e *"A JORNADA COMEÇA ÀS"*, 100 px —
    ficou *"JORNADA ÀS 07:00"*, a mesma largura de antes). ~~O % DA META DO DIA
    (`efDia`) continua com
    todas as caixas: a hora extra conta para a meta do dia como sempre contou.~~
    — **revogado na TV na v7.265.0** (ver *A TV SEM A HORA EXTRA*, abaixo); o
    `efDia` ficou no *% feito* do card CAIXAS PROGRAMADAS, que é do programado, e
    no resumo do WhatsApp.
    ⚠ O RITMO ATUAL (`k.ritmo`) ainda é de todas as horas lançadas, e a
    projeção também, fora da TV (gerencial, resumo do WhatsApp) — a cascata do 🖨
    do dia compara esse ritmo com o necessário só da jornada num dia com
    madrugada (não mexido).
  - **A parada de sábado vale o mesmo em toda tela**: `_metaByDayPar(dias)`
    (PC) é a meta por dia ÚNICA dos que valoram paradas (aba PARADAS,
    `_pgBuscarDados` → GESTÃO DE PERDAS, SIMULADOR e relatórios, cascata do
    período); ao vivo num sábado o `metaHoje` é a mesma mediana
    (`_paradasStats`, `_metaHojeMob`). Medido: 30 min no sábado com 1.500/1.700/
    1.600 nos úteis = 91 cx em todas (a aba PARADAS dava 136 com o ⚙ em 2.400).
    O gráfico POR HORA da aba PARADAS usa a meta que o `RP_PARADAS` usou
    (`st.diag.metaHoje`/`metaPadrao`).
  - **Cascata do período**: `_phTotaisPeriodo` devolve `comMeta` (os dias que
    entram; hoje no fim de semana não soma) e a cascata passa ao
    `_paradasStats` só as paradas desses dias.
  - Celular: EFICIÊNCIA MÉDIA do histórico = Σ real dos dias com meta ÷ Σ meta
    (sem meta no período: '—') — a base da EFICIÊNCIA MÉDIA da aba HISTÓRICO do
    PC (lá, média dos % dos mesmos dias). ⚠ **NÃO é o `efTotal` do relatório
    semanal**: aquele soma as caixas do fim de semana e diz *META BATIDA COM
    HORA EXTRA* ao lado (7.000 de 7.500 + 690 no sábado: celular 93,3%, semanal
    102,5% com o aviso; os dois rótulos dizem o que medem); o `abrirLanc` decide o *SEM META* pelo flag `he`
    (6º parâmetro); a linha da madrugada não repete "hora extra"; o `metaH` sem
    hora lançada divide pelas horas de jornada.
  - Diretoria no fim de semana: UEP, caixas e pontos grandes = o dia inteiro
    (`todo hora extra`), sem o hora a hora contra a meta.
  - Tela A: `.tva-band.he` é fundo neutro com borda e texto âmbar, status
    *HORA EXTRA* (o âmbar cheio é o ATENÇÃO).
  - Zap: fim de semana por `d.fds`/`uepFimDeSemana`; dia útil sem meta sai
    *sem meta gravada*. Impressão do gerencial num sábado sem UEP: sem meta.
  - Testes que RODAM a conta (`relatorios.test.js`, *a CONTA de verdade*): os
    `calcKPIs` do PC e do celular e o `renderTV` reais num contexto isolado com
    o relógio fixo (o dia sem hora extra, a madrugada, o modal ⚙, 06:45), e o
    `_paradasStats` e o `_phTotaisPeriodo` reais — 6 de 6 mutações pegas.
- **Da 3ª revisão (mesma versão)**:
  - **PONTOS sem HE da diretoria** (`_dirSomaPts`): o item do fim de semana
    entra inteiro no `ptsHe` — o `.gs` antes da v5.68 só põe em `pontosHe` as
    horas fora de 07–17, e o quadro dizia CAIXAS e UEP sem HE sem o sábado e
    PONTOS sem HE com ele. A soma guardada (`rpe_dir_pts`, até 6 h) leva a
    regra (`r: DIR_PTS_REGRA` = 2); a da regra antiga não é reaproveitada.
  - **As médias por dia têm UMA base: os dias com meta** (`_relSemanalKPIs`:
    `mediaReal`/`mediaNormal`/`mediaHE`/`mediaMeta`/`nBase`; o 🖨 do histórico;
    a linha da média do `_svgBarChart`). O realizado/dia dividia por todos os
    dias e a meta/dia só pelos com meta: *1.282 cx/dia · meta 1.500* ao lado de
    uma eficiência de 93,3%. O fim de semana fica só no TOTAL (a nota da tabela
    e o card dizem *sem o fim de semana*). Sem dia com meta, a média é de todos
    os dias.
  - **Sem nenhum dia com meta** (período só de fim de semana): `efMedia`,
    `efMediaSemHE`, `mediaMeta` null e `_relDiaExtremo` null — o semanal, o 🖨
    do histórico e a aba HISTÓRICO mostram *—* (era *0,0% · ABAIXO* e um
    sábado de MELHOR DIA).
  - `uepGerMontar` no fim de semana devolve `falta` 0 (era a meta inteira).
  - Celular, sábado com a última leitura falhada (`G.velha`): o card diz *UEP de
    HH:MM — a última leitura não veio* (o ramo `c.fds` vinha antes e calava).
  - **`_phTotaisPeriodo` (cascata do período; defeito de antes da branch)**:
    depois do FECHAR DIA o dia de hoje estava no histórico E no ao vivo — meta,
    realizado e cobertura dobrados (16–17/11: 4.700/4.400 em vez de
    3.100/2.900). Hoje, no período, vale só o ao vivo.
  - ⚠ Ficou como está: num sábado, antes de o histórico chegar (ou com a
    leitura falhada), a mediana dos úteis não existe e a parada de hoje é
    valorada pela meta da HORA_A_HORA; muda quando o histórico chega.
  - 8 de 8 mutações pegas; suíte inteira com o relógio em 14/11, 15/11 e 17/11.
- **Da 4ª revisão (v7.248.1 / mobile 1.51.1, depois do merge da #531)**:
  - **Semana só de fim de semana** (férias coletivas, filtro do histórico): o
    semanal mostra EFICIÊNCIA e SEM HORA EXTRA *—*, sem cor, e TOTAL META *sem
    meta na semana* (era *0,0% · ABAIXO* em vermelho — o `_relMetaHE` devolve 0
    com meta 0). O 🖨 do histórico, sem dia com meta, sem borda vermelha.
  - **O rótulo sai do DIA, não da conta** (`_relSemMeta`/`_relSemMetaTxt`/
    `_relSemMetaFora`): *N dia(s) de fim de semana, todo hora extra* só para
    sábado e domingo; o dia útil sem meta gravada é *dia útil sem meta gravada*,
    e a média diz *sem os dias sem meta*. Era tudo "fim de semana" (`dias −
    dias com meta`). Vale no semanal, no 🖨 do histórico e na aba HISTÓRICO.
  - **Celular, Média / dia** do histórico na base dos dias com meta (*Média /
    dia com meta* quando há dia sem meta): era Σ ÷ todos os dias, 1.282 contra
    1.400 do PC na mesma semana.
  - `_phTotaisPeriodo`: só tira o hoje do histórico quando o ao vivo TEM o dia
    (`kH.real > 0`) e compara pela data (`getTime`). Entre o `resetDiario`
    (~23:44–00:00) e a meia-noite, ou no DEMO, o histórico é quem cobre hoje.
  - Aba HISTÓRICO: o sábado sai *—* em MELHOR H./PIOR H. (o `histDiaFds` zera os
    dois e saíam *0* verde e vermelho). Legenda do gráfico: *Média X cx/dia com
    meta* quando há dia sem meta.
  - ⚠ Ficou como está: o `histDiaFds` não sabe as horas de um sábado gravado
    pelo `.gs` antes da v5.68 (o HE da linha é o da madrugada) — o semanal diz
    *(2h)* num sábado todo em hora extra até a linha ser regravada.
- **Linhas de 07/11 e 14/11 do HISTORICO corrigidas pela API em 16/11/2026**
  (PPCP: *"CORRIGIR"*), como o `.gs` v5.68 grava. Conferido antes na
  HISTORICO_HORA: 07/11 = 465 cx de 07–11 h + 225 de madrugada = 690; 14/11 =
  872 + 273 = 1.145.
  - **14/11 (linha 123), inteira**: META 820 → 0, EF 139,6 → 0, MELHOR 276 → 0,
    PIOR 146 → 0, HE 2 → 6 (as horas com produção), MEDIA 286 → 0, HE CX 273 →
    1.145, UEP 893,5 → 0, UEP HE 546 → 1.439,5, META UEP 1.257 → 0, META DIA 820
    → 0.
  - **07/11 (linha 117), inteira**: META 524 → 0, EF 131,7 → 0, MELHOR 135 → 0,
    PIOR 92 → 0, HE 2 → 6, MEDIA 173 → 0, HE CX 225 → 690, UEP 950,9 → 0, UEP
    HE 393,8 → 1.344,7, META UEP 1.257 → 0, META DIA 524 → 0 (C:G gravada depois,
    com o *"grave"* do PPCP — a 1ª tentativa foi recusada pelo controle de
    permissões da sessão).
- **Junção com a #530 (mobile 1.50.0 / v7.247.0 / rp-core 1.18.0, o gerencial do
  celular com a UEP na frente, publicada no mesmo dia)**: esta versão subiu para
  **v7.248.0 / mobile 1.51.0 / rp-core 1.19.0 / cache v60** (os números da #530
  já estavam no `main`). O fim de semana foi reaplicado na estrutura nova
  (`uepGerMontar`, `_gerUepCardsM`, `_gerCxCardsM`); o harness do celular no
  `relatorios.test.js` ganhou o "hoje" fixo (`_HOJE_M`) e o sábado.
- **Testes**: a data de "hoje" ficou FIXA nos testes que dependem dela
  (`hora-extra.test.js`: `HOJE_TESTE`; `relatorios.test.js`: a aba UEP, a
  diretoria e o gerencial). Conferido rodando a suíte inteira com o relógio
  falso em 14/11, 15/11 e 17/11 (`FAKE_HOJE=aaaa-mm-dd node -r fake-date2.js`,
  fora do repositório; o 2 põe a data falsa também nos contextos `vm`).
- **Registro — a regra revogada (v5.60 / v7.222.0, 11/11/2026)**: PPCP: *"07/11
  foi sábado, a meta tem que ser sobre as horas trabalhadas"* → *"sábado não
  pode ser dia todo, a meta fica errada, porque não tem programação para
  sábado"*. A meta do fim de semana era a da aba × minutos de jornada com
  produção ÷ 527 (07/11: META 524, META UEP 1.257, EF 131,7% — a linha foi
  corrigida pela API em 11/11) e a média por dia excluía o fim de semana, que
  entrava no bateu. Cinco dias depois o sábado 14/11 apareceu em vermelho com
  essa meta, e o PPCP disse que o sábado é todo hora extra.

## `.gs` v5.46 a v5.54 — o que mudou de regra (05/11/2026)
- Feitos na conversa do Apps Script e subidos à `main` pelo upload de 05/11
  (`9949a4e`, sem PR). O cabeçalho do `.gs` tem o registro de cada versão; os
  testes que acompanham são do `5c9ad62` (`apps-script`, `produto-cor`).
- **v5.46** — arquivar que falha **não zera** a `HORA_A_HORA`; o `resetDiario`
  usa o dia do CARIMBO (o gatilho pode cair depois da meia-noite); resets sob o
  lock dos lançamentos; o **1º lançamento do dia fecha o dia anterior** que
  ficou aberto antes de gravar (falhou → não grava e diz *"avise o PPCP"*).
- **v5.47** — `dd/MM` sem ano vai ao ano mais próximo (`_anoProvavel`); número
  pt-BR em texto pelo `_numBR` (pontos, peso, medida, velocidade, QTDE); FORA
  pela regra do `_marcado`; sem coluna de lote com REALIZADO em fórmula, o
  lançamento responde **erro**.
- **v5.48** — lançamento **validado antes de gravar** (`_validarLancamento`:
  inteiro ≥ 0, até `LANC_MAX_CX`=1000, código no cadastro ou na programação —
  e o código gravado passa a ser o do cadastro); log que falha
  **desfaz a célula** (a retentativa não soma de novo); parada encerrada pelo
  fechamento (`encerrada automaticamente` na OBS) vale **FIM = INÍCIO** nas
  leituras — não infla as perdas (para contar, corrigir o FIM e tirar a marca).
  A META única pela aba foi **revogada pela v5.55**.
  - **Recusa no celular (mobile 1.41.0)**: `ok:false` do `saveRealizado` vira
    erro com `recusado=true` — **não retenta** (só timeout/rede retenta) e o
    `salvarLanc` mostra o motivo do servidor (`lancRecusadoTxt`), deixa o modal
    aberto e tira o envio do registro do aviso de repetido (`_lancEsquecer`).
    Antes caía no *"não respondeu… repetir é seguro"*. O `lancId` só fica no
    cache do `.gs` com resultado ok: repetir depois de corrigir é avaliado de
    novo. `lancamento.test.js` roda o `salvarLanc` real (recusa, ok, timeout).
- **v5.49** — lançamento depois do fechamento atualiza a linha do dia (ver
  *Lançamento na hora RECÉM-FECHADA*).
- **v5.50** — `zerarPainelAgora` recusa dados de hoje; `testeFecharAgora` só
  roda em planilha "Cópia de …".
- **v5.51** — tempo por ação no `CacheService`; **`relatorioTempos()`** no
  editor mostra chamadas, média, máximo e cache do dia.
- **v5.52** — invalidação do cache **por grupo** (`putAll`; gravação só derruba
  o que muda) e a programação calculada compartilhada 60 s entre as leituras.
- **v5.53** — o fuso da planilha é lido uma vez por execução.
- **v5.54** — `saveParadas`, `endParada` e `addHE` sob o lock dos lançamentos
  (`_comLock`); `saveParadas` informa as paradas ignoradas; o arquivamento
  reconfere código, lote e data antes de copiar e de apagar.

## O QUE JÁ FOI EMBALADO ANTES NA META DO DIA (v7.274.0 / `.gs` v5.76)
- PPCP, 19/11/2026, com a TV e a aba PROGRAMACAO (ADIANTADO_CX 589 e 1.397):
  *"depois vamos ver isso hoje 4218 mas já embalei ontem"*. A META DO DIA de
  4.218 = 3.900 dos lotes de hoje (a quantidade cheia, o `programadoHoje`) +
  318 de atraso (SOMAR ATRASO); das 3.900, ≥ 1.986 tinham saído na véspera — e
  contaram no realizado da véspera.
- Mostradas três opções; o PPCP escolheu a **1** (*"1"*):
  1. **a META fica cheia** e o painel diz ao lado quanto dela já saiu antes;
  2. ~~descontar o adiantado da META~~ — recusada, com o porquê: com a linha
     sempre 1.986 à frente e embalando o programado (3.900/dia), a meta de
     TODO dia viraria 1.914 (+ atraso) e a eficiência ~200% para sempre. Com a
     meta cheia a distorção é uma vez só (a véspera sobe, o dia cai, a semana
     fecha certa), e a meta do histórico não muda;
  3. a TV julgar pela UEP (telas F e G, desligadas) — não escolhida agora.
  - Dito ao PPCP: com o SOMAR ATRASO, a meta SOMA o que ficou devendo de
    antes e NÃO desconta o que foi feito antes (assimetria conhecida); quem
    responde "a linha está no ritmo?" sem a programação é a UEP.
- **`.gs` v5.76**: o `calcularProgramacao` manda `adiantadoHoje` = Σ
  `lot.cred` dos lotes com data de hoje (as duas abas): o crédito do FIFO, a
  produção de ANTES de hoje (a de hoje entra depois da demanda e nunca vira
  crédito dele) — a mesma conta do ADIANTADO_CX. Nada do que já ia muda; o
  `getPontosDia` o deixa passar (o teste de "nada interno vai para o painel"
  tem a lista dos públicos). Teste com o caso de 14–15/10
  (`programacao.test.js`): 534 das 715 de 15/10 embaladas em 14/10; a META
  continua 717; programado = adiantado + embalado hoje + o que falta.
- **Painel (v7.274.0)**, sem cor, só hoje, só com o campo (backend antigo =
  nada muda), a META e o selo iguais:
  - gerencial do PC, card CAIXAS PROGRAMADAS: *"3.900 do dia (1.986 já
    embaladas antes) + 318 de atraso · faltam N para a meta"*; sem atraso,
    *"caixas programadas (1.986 já embaladas antes) · faltam N para a meta"*
    (`_metaPartesTxt(p, gap, passado, adi)`; o dia passado não tem o número).
    O *"para a meta"* só vem com o adiantado (revisão: lido ao lado do "já
    embaladas", o "faltam" parecia o que falta embalar dos lotes — que é o
    P/ ZERAR). Singular pelo `plural()` (*"1 já embalada antes"*: o FIFO
    credita sobras de 1 a 10 cx). O porquê vai no `title`;
  - Tela B (a que roda), embaixo da META DO DIA: *"CAIXAS · 1.986 JÁ EMBALADAS
    ANTES"* (`#tvb-meta-unit`, escrito pelo `renderTV`; *"1 JÁ EMBALADA
    ANTES"*); sábado e domingo, *"CAIXAS"*. Medido com as fontes reais: numa linha a 1920×1080 (termina em
    1.666 de 1.824) e a 1366×768 (1.219 de 1.298), a linha do card com a mesma
    altura (203 / 149 px) — até com 12.345;
  - Tela A, o PRODUZIR HOJE P/ ZERAR do aviso de atraso (`#tv-atraso-meta-val`)
    mostrava a `metaEfetiva` — a META cheia, com o embalado antes e o de hoje —
    com o MESMO nome do card da Tela C, que mostra o que falta
    (`_progFaltaZerar`). Agora os dois leem o `_progFaltaZerar`.
  - Não mexido: o FALTAM, o % DA META DO DIA, a PROJEÇÃO e o selo (contra a
    meta cheia, a regra); o celular (o gerencial dele julga pela UEP). Dito ao
    PPCP na entrega (*"o FALTAM, o % DA META DO DIA e o selo da TV continuam
    medidos contra a meta cheia"*), sem objeção. ⚠ Na Tela B o FALTAM fica logo
    abaixo do *"JÁ EMBALADAS ANTES"* e pode ser lido como "falta embalar"
    (revisão): se o PPCP pedir, a unidade do FALTAM ganha o *"PARA A META"* —
    medir a 1366 antes (com hora extra ela já é *CAIXAS NA JORNADA*).
- Testes: `relatorios.test.js` (o `renderTV` real: a unidade, o P/ ZERAR 1.800
  em vez de 4.218, sábado, backend antigo, o singular; o card do gerencial com
  o texto e o `title`; o `_metaPartesTxt` com e sem o adiantado, o singular, o
  ATINGIDA). `programacao.test.js` (revisão — a regra inteira, não só o caso
  feliz): só os lotes de HOJE (o vencido com crédito fora: 30 de 50, não 130),
  o de hoje com X conta o crédito dele (60), e o caminho REAL (`rodar()`) com o
  25300 já na CONCLUIDA no próprio dia continua 534 (as duas abas). Mutações:
  o P/ ZERAR pela meta cheia → 2; o card sem o adiantado → 3; a TV sem → 2; o
  sábado com → 2; o `.gs` com a produção do dia (`dia[0]`) → 3; sem o campo →
  3; `lot.d <= hoje` → 2; sem a CONCLUIDA (`!lot.arq`) → 2; sem a encerrada
  (`!lot.enc`) → 2; sem o singular → 2 (card e TV); sem o "para a meta" → 3.
