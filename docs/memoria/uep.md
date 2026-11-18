# UEP — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## CAIXAS × PONTOS × UEP — a régua que mede o esforço (v7.184.0)
- PPCP, 29/10/2026: *"ver antes e depois para ter argumento de mudar para UEP
  que faz mais sentido ao invés de pontos ou caixas"*. O 🖨 CAIXAS × UEP da aba
  ⚖ UEP abre agora com **AS TRÊS RÉGUAS NOS MESMOS DIAS**: média/dia,
  **oscilação** dia a dia (`_qpOscilacao`, a da aba PLANO), **depois da trava**
  da UEP, NO RITMO e DISCORDA DA UEP, mais um gráfico com cada dia em % da média
  da própria régua (um eixo só, nunca dois). O resto do relatório (caixas × UEP)
  continua, com as colunas PONTOS / EM PONTOS na tabela dia a dia.
- **O argumento é a oscilação, não o veredito**: a linha trabalha parecido todo
  dia e o que muda é o mix. Medido (29/09–28/10/2026, 20 dias, jornada):
  CAIXAS ±26,9% · PONTOS ±18,5% · UEP ±10,4%; nos 8 dias **depois da trava**
  (16/10), que não entraram na conta da UEP: 22,4% · 16,1% · 10,5%. ⚠ Antes da
  trava a UEP tem vantagem (foi calibrada com o ritmo da própria linha) — por
  isso a coluna DEPOIS DA TRAVA existe. Não tirar.
- Pontos medem **valor** (custo de reposição do ERP), não esforço: servem a
  faturamento. A frase da leitura sai do dado (*"a régua que menos oscilou
  foi…"*), nunca texto fixo.
- **Conta**: `_cxuPtsDoPeriodo(itens)` (pontos − `pontosHe` por dia; item sem
  `pontosHe` → null, nunca rateia) e o 4º parâmetro do `_cxUepMontar` (`P =
  {pts, metaPts, trava}`); sem ele, caixas × UEP como sempre. As três réguas
  usam os **mesmos dias** (dia sem ponto sai da base das três). Desenho:
  `_cxuSvg` e `_cxUepHtml`, sem conta (o teste prende).
- **Leitura**: `_cxuPtsLer` = `getProducaoModeloPeriodo` da janela
  (`_cxuJanela`), DEPOIS do histórico, cache 5 min; devolve `PREP_PERIODO` e
  `PH_UEP_PROD` (guarda e devolve os dois). Falhou → sem os pontos, com o motivo
  na linha da régua.
- **Meta de pontos**: a do ⚙ (`_metaPtsDia`: CONFIG_PAINEL `META_PTS`, `.gs`
  v5.42; sem ela, a deste computador `rpe_cap_pts` — ver *ABA 📏 RÉGUAS*). Com
  ela: veredito EM PONTOS (régua do selo) e o motivo (`pts-barato`/`pts-caro` =
  META UEP × pontos/UEP do dia ÷ meta de pontos, ±5%). O teste usa 198.740 de
  exemplo (190.000 × 1,046) — **nunca o valor do PPCP**.
- ⚠ **A meta só julga pontos NA TABELA DE HOJE** (v7.186.0 / `.gs` v5.41). Os
  pontos gravados são da tabela de cada lançamento; a meta é da de hoje. Em
  29/10/2026 a tabela subiu ~4,6% e a meta junto: contra os gravados, dia
  passado saía abaixo pela tabela (com a meta de exemplo, 16/10 e 20/10). Um
  fator único também erra (o mix de cada dia subiu de 1,9% a 6,7%). Por isso o
  relatório pede `?ptsCad=1` (`pontosCad`/`pontosCadHe`: caixas × cadastro de
  agora) e usa ESSA tabela para tudo — oscilação, veredito e gráfico.
  `_cxuPtsDoPeriodo` devolve `{dias, tabela:'hoje'|'gravada'}`; um item sem
  `pontosCad` derruba o período inteiro para `gravada` (nunca meio a meio). Com
  `gravada` (o `.gs` antes da v5.41), a meta NÃO julga (`metaSemTabela`) e o
  papel diz por quê. Diretoria e semana continuam com os gravados (passado
  congelado). O guarda do `pontos.test.js` deixa o `cx × (prod.pontos` no
  período só nas linhas do `pontosCad`.
- ~~**O PAPEL SÃO TRÊS FOLHAS**~~ — **hoje são QUATRO PÁGINAS** (v7.188.0, ver
  *O RELATÓRIO EM QUATRO PÁGINAS*). Registro da v7.185.0 (PPCP: *"impressão
  limpa, fácil de entender, com clareza dos fatos"*):
  1. **qual régua mede o esforço**: frase (do dado, com o artigo certo: *A UEP
     é* / *Os PONTOS são* / *As CAIXAS são*), três cartões e o gráfico;
  2. **quando o veredito muda de régua**: só os dias que discordam, com o motivo
     EM NÚMERO;
  3. **anexo**: os dias em número (selo só na folha 2) e o *como o número sai*,
     uma linha por item.
  - O gráfico (`_cxuSvg`) é **uma faixa por régua, na MESMA escala**. Três
    linhas cruzadas num quadro só (v7.184.0) obrigavam a decifrar; em faixas, a
    variação se vê sem legenda. Banda ±10% em cada faixa, trava atravessando.
  - Frase em fonte de texto (`.cxu-txt`, Barlow); a mono pequena do `.rp-note`
    ninguém lia (o teste prende).
  - Cores das séries validadas no papel branco (`CXU_COR`: UEP laranja, CAIXAS
    azul, PONTOS verde-água; cada faixa tem o nome, então a cor não é a única
    identidade).
  - ~~Medido no Chromium com as fontes: A4 deitada, **3 folhas**~~ (ver a
    correção de medida da v7.188.0) com e sem a meta,
    nada cortado. A folha 3 só fecha com o `padding:3px` do anexo: mexeu nela,
    medir de novo.

## ABA 📏 RÉGUAS — a meta de pontos cabe no mix? (v7.187.0 / `.gs` v5.42)
- ⚠ **Desde a v7.207.0 é a 5ª sub-aba da ⚖ UEP**, não aba própria — ver
  *RÉGUAS E ONDE O TEMPO VAI VIRAM SUB-ABAS*.
- PPCP, 29/10/2026: *"régua pela UEP é a justa, não adianta querer produzir
  [a meta de pontos] por dia com SLEEP por exemplo, não consegue fazer"* →
  *"essa impressão vire uma tela"* → prévia aprovada → *"sim"* (a meta na
  planilha e a aba própria). Só o gerencial do PC (o operador só vê a TV).
- **Três blocos, uma pergunta cada**:
  1. **QUAL RÉGUA MEDE O ESFORÇO** — a folha 1 do 🖨 CAIXAS × PONTOS × UEP com
     as MESMAS peças: `_cxUepMontar`, `_cxuTese`/`_cxuProva` (o texto, agora uma
     função para o papel e a tela) e `_cxuSvg`;
  2. **A META DE PONTOS CABE NO MIX?** — meta de pontos ÷ meta de UEP = os
     pontos por UEP que a meta pede. O mix do período (Σ pontos ÷ Σ UEP nos
     mesmos dias, só na tabela de HOJE) contra isso; dias na meta (UEP pela
     meta gravada de cada dia, pontos pela meta do ⚙); UEP/dia para chegar à
     meta com este mix; % das caixas em produto que não chega. **A meta de
     pontos julga o MIX (o que foi programado); quem julga a linha é a UEP.**
  3. **PRODUTO A PRODUTO** — cada produto sozinho na linha o dia inteiro:
     batendo a meta de UEP (`_capDia`, a conta do simulador de capacidade) e no
     LIMITE DA ESTEIRA sem nenhuma parada. Situação (desde a v7.188.0, com a
     referência): CHEGA NA REFERÊNCIA · SÓ ACIMA DA REFERÊNCIA · NÃO CHEGA NEM
     NO LIMITE · SEM LIMITE NO CADASTRO.
     Filtro RODARAM NO PERÍODO (mais caixas primeiro) / CADASTRO INTEIRO (menos
     pontos por UEP primeiro), 15 linhas + VER TODOS.
- **Medido (29/09–28/10/2026, cadastro de 29/10, META UEP 2.761)**: mix de **70
  pontos por UEP**; a linha bateu a meta de UEP em 16 dos 20 dias. A SLEEP
  sozinha faz 94 mil pontos/dia batendo a meta de UEP e **125 mil no limite
  físico** — a meta de pontos do PPCP está acima disso. 33 de 119 produtos do
  cadastro chegam batendo a meta de UEP.
- ⚠ **O vão padrão (`ESTEIRA_VAO_PADRAO` = 650 mm)**: o cadastro veio com 650
  em todo código, não medido; só SLEEP e MADERO têm 250 (20/10/2026). Com 650 o
  limite sai PESSIMISTA, e o `_capProdutos` marca `vaoPadrao` → `*` no limite e
  em NÃO CHEGA NEM NO LIMITE. Só para SLEEP e MADERO o "não chega" é certo.
  Medir o vão de um produto tira a marca sozinho.
- ⚠ **A META DE PONTOS mora na CONFIG_PAINEL (`META_PTS`, `.gs` v5.42)**, campo
  META DE PONTOS / DIA · SEM HE no ⚙ (com os pontos por UEP que ela pede ao
  lado), como a META DIA (UEP): só vai à planilha quando MUDOU, vazio/texto não
  apaga. `_metaPtsDia()` é a leitura ÚNICA (tela, 🖨 CAIXAS × PONTOS × UEP e o
  diálogo da capacidade): planilha → este computador (`rpe_cap_pts`, também
  gravado no ⚙ como rede) → null. A tela avisa quando a meta é só deste
  computador. Revoga o "guardada SÓ neste computador" da v7.169.0: o argumento
  era o HTML público, mas o cadastro com o CUSTO REP produto a produto já é
  lido por quem tem a URL do Apps Script (`getProdutos`). ⚠ O VALOR continua
  fora do repositório (código, teste, doc).
- **Custo**: nenhuma leitura nova. Histórico (2 min) → pontos do período (o
  `_cxuPtsLer` do relatório, cache 5 min, que agora devolve também as caixas
  por produto, `_cxuCxPorProduto`) → cadastro (10 min), em sequência, só com a
  aba aberta. Pedido no meio de uma leitura fica pendente (`REG_PEND`, a régua
  do `PG_TELA_PEND`). ↻ ATUALIZAR passa por cima dos caches.
- **Conta** `_regMontar` (pura) · **desenho** `_regHtml` (sem conta, o teste
  prende) · **leitura** `renderReguas`/`_regPintar`. O gráfico é o do papel com
  as cores por token (`var(--cxu-*, cor do papel)`); `#uep-reguas` (era `#sec-reguas` até a v7.207.0) define a
  paleta escura (CAIXAS `#4f95e8`, 5,4:1 no fundo — o `#2a78d6` do papel dava
  3,8). O 🖨 da aba é o relatório (quatro páginas desde a v7.188.0) com os
  dias da tela (`gerarRelatorioCxUep(n)`).
- Medido no Chromium com os dados reais: 1920 e 1366, com e sem meta — nada
  passa da largura (a tabela rola dentro do cartão se faltar espaço).
- ⚠ Mudou o `.gs` → **re-deploy manual**. Antes dele, a meta digitada no ⚙
  vale só neste computador (a planilha ignora o `metaPts`) e a tela diz isso.
  Publicado e conferido em 29/10/2026: `META_PTS` gravada na `CONFIG_PAINEL`.
- **Uma impressão, um lugar** (v7.187.1, PPCP: *"impressão está nas duas agora,
  a mesma"*): o 🖨 CAIXAS × PONTOS × UEP saiu da aba ⚖ UEP e ficou só na 📏
  RÉGUAS (com os dias da tela). Na ⚖ UEP ficou o caminho **📏 RÉGUAS →**, como
  o ⏱ CRONOANÁLISE → UEP — sem ele o gestor procura onde o botão não está mais.
- **O papel mostra o que a tela mostra** (v7.187.1, PPCP: *"essa não está na
  impressão"*): os blocos 2 e 3 da aba são `_regMixHtml` e `_regProdHtml`, UMA
  marcação para a tela e o papel (`ctx.papel`: título de seção do relatório,
  sem filtro nem botão, os `REG_LINHAS` que mais rodaram + uma linha com o
  resto). O `_cxUepHtml` os põe numa folha própria depois da régua (`ctx.D`, do
  `_regMontar`; sem ele, o papel antigo). Pele `.reg-*` no `_CXU_DOC_SKIN`. A
  impressão lê o cadastro depois dos pontos. ~~Medido no Chromium com as
  fontes: **4 folhas**, a tabela cabe na A4 deitada~~ — **ERRADO**: a tabela
  tinha 1.146 px numa folha de 1.032 e o Chromium encolhia o relatório inteiro
  (~90%) para caber. Ver a correção na v7.188.0.
- **Volumes em COLUNA (VOL.), nunca colados no nome** (v7.187.2, PPCP:
  *"alinha essa inf de volumes"*) — a mesma lição do UEP/CX do comparativo:
  cada nome tem um comprimento e o número ficava numa altura diferente.

## O RELATÓRIO EM QUATRO PÁGINAS — e a UEP como REFERÊNCIA (v7.188.0)
- PPCP, 29/10/2026, prompt *"MELHORIA DO RELATÓRIO CAIXAS × PONTOS × UEP"*:
  quatro páginas, sem mudar dado nem cálculo, *"preserve o que já funciona"*.
  `_cxUepHtml` é o despachante; as páginas, numa ordem só:
  1. **RESUMO GERENCIAL** — a frase (`_cxuTese`), `_cxuResumoHtml` (uma linha
     por régua: realizado/dia · meta ou referência/dia · ATINGIMENTO · DIAS NA
     META · variação · depois da trava; a linha da régua que menos varia vai
     destacada), o gráfico a 640 px e, ao lado, `_cxuRefHtml` (o aviso da
     referência) + `_cxuConclusoes` (prova sem vantagem, vereditos diferentes,
     meta de pontos × mix, produtos que chegam — cada uma aponta a página);
  2. **CAPACIDADE POR PRODUTO** — título `_cxuCapTese` + os blocos da aba
     (`_regMixHtml`/`_regProdHtml`, no papel como subtítulos `.cxu-sub` pelo
     `_regTit`). No papel o mix tem 3 cartões: os DIAS NA META estão na pág. 1;
  3. **ANÁLISE DOS DESVIOS** — só os dias que discordam; cada célula com o selo,
     o % e *realizado de meta* da DATA (`.cxu-rm`); o porquê em DUAS colunas
     (caixas × UEP · pontos × UEP), uma linha cada; `_cxuDecidir` = A INVESTIGAR
     OU DECIDIR (só o que o dado sustenta: datação da programação com o pior %,
     meta em caixas fácil, meta de pontos × mix, UEP acima da esteira e vão não
     medido nos que rodaram, e a decisão da referência — sempre);
  4. **DADOS E CRITÉRIOS** — a tabela dos dias com cabeçalho de grupo (CAIXAS ·
     META DA PROGRAMAÇÃO · UEP · REFERÊNCIA DA DATA · PONTOS · META DO ⚙), ao lado
     (`float`, `.cxu-p4-lado`) o histórico da referência e as limitações, e o
     COMO O NÚMERO SAI na largura toda.
  - O título de cada página é a conclusão (a frase grande `.cxu-tese` logo
    abaixo do rótulo `rp-sec-ttl`), sempre saída do dado.
  - **Conta nova, no `_cxUepMontar`** (o desenho só lê): por régua
    `metaMedia`, `pctMeta` (Σ realizado ÷ Σ metas dos MESMOS dias — nunca média
    de %) e `diasMeta` (realizado ≥ meta; o selo da TV é outra régua, 96%);
    `refUep` (trechos seguidos da META UEP gravada, com o motivo) e
    `cxAbaixoMetaMax`. O `_regMontar` lê os dias na meta daqui (uma conta só) e
    ganhou `nRodChega`/`nRodNao`/`nRodLim`/`nRodVao` (só quem rodou).
  - Medido (20 dias reais, 29/09–28/10, meta de exemplo 198.740): caixas 93,4%
    (10 dias), UEP 109,3% (16), pontos 98,3% (9); referência 2.530 em 18 dias e
    2.761 em 2. Conferido fora do painel (python). O teste prende.
- **A UEP é REFERÊNCIA, não meta** (PPCP: a referência passou de 2.530 para
  2.761 *"porque o desempenho médio da linha melhorou"*, e a UEP **ainda não é a
  meta oficial da embalagem**). No relatório e na aba 📏 RÉGUAS ela se chama
  *referência de UEP*, cada dia é julgado contra a da SUA data e o passado não
  é regravado. `UEP_REF_STATUS` (o texto do status) e `UEP_REF_MOTIVO` (data da
  troca → motivo; casa com a data ENTRE o fim do trecho anterior e o começo do
  novo, então troca no fim de semana vale para a segunda) — sem motivo, o papel
  diz *"motivo não registrado"*. Adotada como meta oficial: mudar o status.
  - ⚠ **O resto do painel ainda diz META**: ⚙ META DIA (UEP), card UEP DO DIA,
    aba ⚖ UEP, Telas F/G, PRÓXIMOS DIAS. Mudar lá é decisão do PPCP (UM NOME
    POR INDICADOR); não foi feito. O COMO O NÚMERO SAI liga os nomes (*a
    referência = o campo META DIA (UEP) do ⚙*).
- **DEPOIS DA TRAVA A UEP MUDA POR CRONOANÁLISE** (v7.188.1, PPCP: *"a UEP
  está sendo atualizada conforme cronoanálise"*). O `_cxuProva` (relatório e
  aba) e o COMO O NÚMERO SAI dizem isso: até a trava a UEP saiu do ritmo da
  linha; depois, só por cronoanálise (o tempo do produto, não a produção do
  dia — por isso a comparação continua sem vantagem). A página 4 diz que o dia
  fechado guarda a UEP do dia: o período mistura a antiga e a nova de um
  produto trocado.
  - Medido em 29/10/2026 (`UEP_VERSOES`): 6 trocas por cronoanálise de 26 a
    29/10 e 1 digitada em 21/10 (501142), **todas para baixo** (−12% a −34%).
    26/10 e 27/10 gravados com a UEP nova (refeito com o log: 2.761,6 e
    2.868,5; na antiga, 3.052,5 e 2.959,1). Os 8 dias depois da trava toda na
    UEP antiga: ±11,4% (gravados: ±10,5%).
  - ⚠ **Risco para a REFERÊNCIA**: a de 2.761 é a média de 28/09–26/10, quase
    toda na UEP ANTIGA. Se a cronoanálise continuar baixando a UEP dos produtos
    que mais rodam, a mesma produção vira menos UEP e a referência fica alta (o
    26/10 caiu 10,5% só por duas trocas). Rever a referência quando as trocas
    cobrirem o mix — decisão do PPCP.
  - **Decidido em 30/10/2026: a referência fica em 2.761 até a cronoanálise
    cobrir os principais** (o bloco PRINCIPAIS PARA ANÁLISE DE TEMPO da ⏱
    CRONOANÁLISE, v7.189.0, diz quanto falta). Medido no mesmo dia, refazendo
    28/09–26/10 com a UEP de hoje dos 7 volumes trocados (log de produção,
    jornada): média **2.693** (gravada 2.760,7 = a 2.761), p50 2.651, p60
    2.760 — −2,5%, dentro da oscilação de ±12%. Não trocar a cada leva: cada
    troca vira um trecho novo de referência no histórico. Na revisão: a média
    da UEP de jornada de ~20 dias úteis, refeita com o cadastro daquele
    momento (o critério da 2.761), e a linha no `UEP_REF_MOTIVO`. E ainda está em aberto se a cronoanálise
    RODANDO deixa os produtos leves demais (ver *NA PRODUÇÃO*: ELOA 83%, STRASS
    89% da base sem as paradas).
- ⚠ **CORREÇÃO DE MEDIDA**: na v7.187.1/7.187.2 a tabela do produto a produto
  tinha 1.146 px numa folha útil de 1.032 (A4 deitada, `@page` 10/12 mm), e o
  Chromium **encolhia o relatório inteiro (~90%)** para caber. A medição daquela
  versão olhou a largura na TELA (viewport 1123, mídia de tela) e disse que
  cabia. **Medir papel = mídia de impressão (`emulateMedia({media:'print'})`) na
  largura útil da folha (1.032 × 718 px deitada)**, e conferir a altura de cada
  página pela posição dos `rp-sec-ttl`. Na v7.188.0 a tabela cabe em 100%
  (cabeçalhos de grupo em duas linhas, letter-spacing .6), e são 4 folhas com e
  sem meta (pág. 1 682 px · 2 ~708 · 3 ~702 · 4 ~708 — perto do limite: texto
  novo, medir de novo). Com 60 dias a tabela dos dados continua na folha
  seguinte (o lado fica na 4).

## Relatórios de UEP: FILA DE CRONOANÁLISE e CAIXAS × UEP (v7.139.0 / `.gs` v5.27)
- PPCP, 19/10/2026, depois da conferência das UEP travadas e das Telas F/G:
  *"sim fazer 1 e 2"*. Botões no cabeçalho da aba ⚖ UEP (o do CAIXAS × UEP
  mora na 📏 RÉGUAS desde a v7.187.1); documentos
  DEITADOS no `_rpDocParadas` (13 usuários hoje — o teste conta), peles
  `.fila-doc` e `.cxu-doc`. Cartão sem status fica com borda NEUTRA: a do
  documento comum é vermelha (lá marca perda).
- ⚠ **A FILA DE CRONOANÁLISE abaixo SAIU na v7.216.0**: a 🖨 é a AGENDA DA
  CRONOANÁLISE (ver *O QUE MEDIR: A AGENDA*). `_filaCronoMontar`,
  `_filaCronoHtml`, `_FILA_DOC_SKIN`, `FILA_MOTIVOS`, `FILA_FAM_RAZAO`,
  `FILA_TETO_FOLGA`, `FILA_MAX_SEM` e `_filaUteis` foram apagados; ficou o
  `_filaN2br`. A amostra (`_filaAmostra`, `_filaAmostraDeItens`,
  `FILA_AMOSTRA_DE`) saiu na v7.248.2: o único leitor era a FILA antiga. O
  texto abaixo é histórico.
- **FILA DE CRONOANÁLISE** (`_filaCronoMontar` conta, `_filaCronoHtml`
  desenho). Produto (modelo + `_capNome`) entra por: SEM UEP · ESTIMADA (EST)
  · PROVISÓRIA (< `UEP_MIN_DIAS` dias distintos na amostra) · NO LIMITE DA
  ESTEIRA · FAMÍLIA INCOERENTE · SEM MEDIDA. Ordem: SEM UEP programado → UEP
  programada nos próximos `GPX_DIAS` dias úteis (`_filaUteis`) → volume da
  amostra. A % é sobre TODA a UEP da janela.
  - **k = UEP × teto da esteira** (UEP por hora de esteira). O estudo corta o
    ritmo no teto físico, então quem rodou no limite tem k = ritmo da base, o
    MÍNIMO do cadastro (287 em 19/10/2026). LIMITE = k ≤ mínimo × 1,02
    (`FILA_TETO_FOLGA`); FAMÍLIA = maior ÷ menor k do modelo ≥ 1,8
    (`FILA_FAM_RAZAO`). Calibrado na planilha real: 6 no limite (SLEEP,
    DECOR 470/600, NICHO 1.6, MOON 2.2, INTENSE RIP) e 4 famílias (LUNA 3,4×,
    DECOR 2,9×, EVOLUTION 2,0×, MOON 1,9×). URBAN (1,66×) fica fora de propósito.
  - **A amostra** = log de 01/07/2026 (`FILA_AMOSTRA_DE`) até
    `UEP_TRAVADA_DESDE` — o período de onde saiu a UEP travada. É período
    FECHADO: `getProducaoModeloPeriodo` de ~3,5 meses (das leituras mais caras)
    UMA vez por dia, guardada em `localStorage['rpe_fila_amostra']`; devolve o
    `PREP_PERIODO`/`PH_UEP_PROD` da aba PRODUÇÃO/HORA. Leituras em sequência:
    cadastro (`_capBuscar`) → amostra → programação (cache de 2 min).
  - ⚠ **Sai da fila quem foi cronometrado**: o `.gs` v5.27 carimba a
    `UEP_VIGENCIA` com `dd/MM/yyyy DIGITADA` na digitação (`_uepVerDaEdicao`);
    produto todo DIGITADA perde PROVISÓRIA/ESTIMADA/LIMITE, e FAMÍLIA só marca
    os irmãos não cronometrados. Sem o re-deploy a fila não esvazia. UEP
    apagada → vigência vazia.
- **CAIXAS × UEP** (`_cxUepMontar` / `_cxUepHtml`): últimos `CXU_DIAS` (30)
  dias fechados com META e UEP, hoje fora. EM CAIXAS = (REALIZADO − HE CX) ÷
  META; EM UEP = UEP ÷ META UEP; veredito por `sc`/`slRitmo` (a régua do
  selo). Discordam quando um é NO RITMO e o outro não. **A META EM CX PEDIA**
  = META × UEP/cx do próprio dia ÷ META UEP: > 105% meta em caixas alta,
  < 95% baixa (`CXU_FOLGA`); senão o mix (±5% da mediana) ou "perto do limite".
  - **Medido em 19/10/2026 (21/09–16/10, 18 dias): 13 iguais, 5 com caixas
    ABAIXO e UEP NO RITMO — os 5 com a meta em caixas pedindo 118–179% da meta
    UEP; nenhum ao contrário.** O veredito em caixas estava julgando a datação
    dos lotes, não o ritmo. É o argumento (com a fila) para o PPCP decidir o
    selo das Telas F/G. O teste prende esses números.
  - Caixa lançada sem produto conta nas caixas e não tem UEP: o papel avisa.
- **TAKT s/CX nos dois relatórios por produto** (v7.141.0, PPCP: *"colocar
  takt time de cada um nos relatórios"*). `_taktUep(uepCx, meta)` = 527 × 60 ÷
  META UEP × UEP/cx (= 3.600 ÷ CX/H PADRÃO), `_taktTxt` o formato (*23,0 s*),
  uma implementação só. FILA: um por volume, na forma da UEP/CX, com a META UEP
  do ⚙ (`PONTOS_DIA.metaUep`, 5º parâmetro do `_filaCronoMontar`). Bloco 7:
  coluna depois do CX/H PADRÃO (12 colunas em `UEP_PAD_COLS`), e no dia a dia
  o takt do dia (meta gravada daquele dia) com o **s/CX REAL** ao lado.
  - ⚠ **Não é o TAKT IDEAL** (`_taktIdeal`: DEMANDA IDEAL do ⚙ em cx/dia, um
    número para qualquer caixa — 1.850 → ~17,1 s). Nome sempre **TAKT s/CX**,
    nunca só "TAKT". Não pus no comparativo por modelo (PRODUÇÃO/HORA) de
    propósito: lá o card MÉDIA CX/H · TAKT e o ▼ já usam o TAKT IDEAL, e dois
    takts no mesmo papel é o defeito de dois vereditos.
  - Sem UEP → "—", nunca 0.
- **⏱ CRONOANÁLISE → UEP** (v7.142.0, PPCP 19/10/2026: *"onde podemos fazer a
  transformação de 17,6 segundos para UEP?"* → *"faz o campo"*). `<details
  id="uep-conv">` no topo da aba ⚖ UEP: produto (datalist do `CAP_RAW`, chave
  modelo + `_capNome` como a FILA), s/VOLUME MEDIDO e s/VOLUME DA MADERO (BASE).
  `_uepConvMontar` (conta) / `_uepConvHtml` (desenho) / `_uepConvAtualiza`.
  - **UEP = segundos por volume ÷ segundos da base por volume.** Base vazia =
    `_taktUep(1, meta)` (12,5 s com 2.530) — o ritmo da MADERO **com as paradas
    dentro**, então o tempo é o **NO PERÍODO** do Volume a volume (app de
    cronoanálise, `crono-analise`). Caso real: ARMÁRIO ENCANTO 27,8 s → 2,22,
    cadastro 2,23; os 17,6 s com a linha rodando dariam 1,41 (37% mais leve).
    ⚠ Não trocar o padrão para o tempo rodando: é misturar régua.
  - ⚠ **A base pela meta só vale enquanto META UEP = ritmo da MADERO × 527
    min** (hoje 288/h × 527 = 2.530, coincidência de calibração). Mudou a meta
    sem mudar a escala? A conversão anda junto e o produto parece mudar de
    peso — é para isso que existe o s/VOLUME DA MADERO (MADERO cronometrada,
    `localStorage['rpe_uep_conv']`).
  - CONFERE = `UEP_PAD_FAIXA` (90–110%, a do bloco 7) — nenhuma régua nova. O
    número a digitar mantém a repartição do cadastro entre volumes e cores.
    A base não ganha UEP nova: a tela mostra a distância da cronoanálise para a
    régua da meta. Mais leve que a faixa com a base pela meta → aviso CONFIRA
    O TEMPO ANTES DE TROCAR (`confRegua`): é o sinal do tempo rodando digitado.
  - **Nada é gravado** (a UEP está TRAVADA): a tela diz o número e os códigos;
    a troca é digitar na coluna UEP da PRODUTO_CODIGO (versão DIGITADA).
  - ⚠ **Fora do `#uep-bloco` de propósito**: o `renderUep` refaz o bloco a cada
    refresh e levaria o que está sendo digitado. O `renderUep` chama o
    `_uepConvAtualiza()` ANTES de sair no "aguardando" (o conversor só precisa
    do cadastro). Teste em `uep-relatorios.test.js`.
  - **v7.142.1 (uso real, mesmo dia)**: o PPCP digitou o 17,6 s do PRÓPRIO
    Encanto no campo da base (deu 1,58, depois 0,06). O rótulo virou **s/VOLUME
    DA MADERO (BASE)** e, com valor, a faixa **BASE DIGITADA** fica à vista
    (tempo, diferença para a régua da meta, botão VOLTAR À RÉGUA DA META) — o
    campo é guardado e muda TODA conversão. E o **Tab** no último campo volta
    ao PRODUTO (`_uepConvTecla`): o próximo foco da página era o 7 DIAS do
    bloco 5 e o `<main>` rolava 2.400 px.

## ESTUDO DE UEP — só análise, só no gerencial (v7.72.0)
- Pedido do PPCP, 24/09/2026: *"definir a UEP de cada produto — o que mais
  embala por hora vale uma UEP, os outros proporcional"*. Combinado com o
  usuário: **primeiro uso previsto = META DO DIA** (a meta em caixas herda o
  mix), e **nada é divulgado** por enquanto — é relatório para análise, botão
  **📐 ESTUDO UEP** na aba PRODUÇÃO/HORA. TV e celular não veem.
- `_uepProdutos` / `_uepEstudo` (conta) + `_uepHtml` (desenho, sem conta) +
  `gerarRelatorioUEP` (usa `_phItensPeriodo`, a busca com cache/voo da aba —
  **nenhuma chamada nova, sem re-deploy**). Documento: `_rpDocParadas`, retrato.
- **UEP/cx = ritmo da âncora ÷ ritmo do produto.** Duas âncoras: **A = maior
  volume** (recomendada — produto-base clássico, estável) e **B = mais rápido**
  (o pedido; o máximo é o valor mais instável, se ele mudar a UEP de todos
  muda). Só mudam a escala.
  ⚠ **Desde a v7.136.0 a A é a BASE FIXA (MESA CABECEIRA MADERO)**, não mais o
  maior volume do período — ver *UEP PADRÃO VERSIONADA*, item BASE FIXA.
- ⚠ **Por PRODUTO (modelo + nome), nunca por cor nem pelos 6 dígitos.** Na
  tela de 24/09 a MESA CABECEIRA SLEEP ia de 112 a 313 cx/h conforme a cor:
  ruído (paralelismo, amostra), não esforço. Divergência ≥ `UEP_COR_DIVERGE`
  (1,5×) vira alerta. Horas do dia = **distintas** (regra do
  `simularEsteiraPorModelo`), ritmo = `_phMediaAparada` com o filtro MÉDIA.
- **< `UEP_MIN_DIAS` (5) dias → UEP PROVISÓRIA** (v7.73.0, PPCP: *"pode
  colocar UEP mesmo com pouca caixa, mas deixe a observação"*): calculada,
  com `*` no número, observação na coluna CONFERIR e contada à parte
  (`nProv`). ⚠ A **âncora** continua só entre quem tem amostra — âncora de 2
  dias mudaria a escala de todos. Sem ritmo → sem UEP, nunca 1 por padrão.
- **Conferência:** oscilação do ritmo da linha dia a dia em cx/h × UEP/h
  (`_qpOscilacao`), mesmas caixas sobre as mesmas horas da linha. Otimista:
  reprova, não prova. Desde a v7.74.0 há a **validação fora da amostra**
  (`_uepValidacao`): UEP da 1ª metade dos dias testada na 2ª, com
  `UEP_VALID_MIN_DIAS`=4 por metade — é ela que conta.
- ⚠ **A LINHA RODA UM PRODUTO POR VEZ** (PPCP, 24/09/2026). Hora com dois
  produtos é **hora de troca** — e isso relê o que está anotado na seção do
  mix ("a esteira roda dois produtos por vez"): o excesso de horas de produto
  sobre horas da linha é troca dentro da hora, e a alternância `A,B,A,B` do
  log são cores/volumes do MESMO produto (ou apontamento), não dois produtos
  juntos. Não mexi no mix por causa disso; o estudo de UEP já usa a leitura
  nova.
  - **Hora compartilhada é repartida** (v7.74.0 / `.gs` v5.9, PPCP: *"quando
    pega na mesma hora 2 produtos tem que ser proporcional"*). Proporcional ao
    **tempo esperado** (caixas ÷ ritmo em regime), **nunca às caixas**: pelas
    caixas os dois sairiam com o ritmo da linha naquela hora e a diferença
    entre eles sumiria. Ritmo em regime = horas em que o produto rodou
    sozinho; sem nenhuma, o peso usa o ritmo com hora cheia e a linha avisa.
    A hora vale 1 (inclusive o slot de 48 min), como no comparativo.
  - ⚠ **O `cxHora` SÓ VAI COM `?cxHora=1`** (`.gs` v5.10, v7.77.0). Sempre no
    payload, o período de 86 dias passou de **100 KB**, o `CacheService`
    recusou (`/* >100KB: só não cacheia */`) e o comparativo por modelo
    estourou os 25 s em toda tentativa — com o Apps Script respondendo o resto
    normal. Só o estudo pede (`_uepItensPeriodo`: cache próprio 5 min, voo
    compartilhado, `jsonpFetch` de 60 s); a chave do cache do `.gs` inclui
    `cxHora`. **Campo novo no payload de leitura pesada = conferir o tamanho
    contra os 100 KB do cache.**
  - ⚠ **A divisão vale quando o backend MANDA o `cxHora` — basta um item**
    (`_uepTemCxHora`, v7.78.0). Exigir TODOS os itens com `cxHora` preenchido
    fez um único lançamento sem HORA desligar a divisão do período inteiro, em
    silêncio (PDF de 24/09 11:17). Item sem hora fica fora do ritmo
    (`nSemHora`); item só com `horasLista` reparte igual (`nAprox`).
  - Precisa do **`cxHora`** por item (`getProducaoModeloPeriodo`, `.gs` v5.9 —
    **re-deploy**). Sem ele (`_uepTemCxHora` falso) o estudo volta à hora
    cheia e o relatório diz que a divisão não está valendo.
- **UEP POR DIA** (`_uepDias`): caixas com produto × UEP, horas da linha,
  UEP/h e cobertura contra o realizado do `HISTORICO` (`buildDiasHistAsync`,
  cache de 2 min; falhou → a coluna some). É a capacidade em UEP, a régua da
  meta do dia.
- ⚠ Ritmo **demonstrado ≠ tempo padrão** (carrega desempenho, paralelismo e
  apontamento). Próximos passos combinados: PPCP escolhe a âncora → valida os
  de maior volume (cronoanálise) → congela a UEP no cadastro (`PRODUTO_CODIGO`,
  com vigência) → a meta do dia passa a ser julgada em UEP. **O operador
  continua vendo caixas.** Não calcular UEP ao vivo em tela oficial: recalcular
  todo dia mudaria a meta histórica.
- **Dia padrão de 8 h** (v7.75.0, PPCP: *"sempre considerar hora do dia 8"*):
  `UEP_HORAS_DIA` — UEP do dia = UEP/h da linha × 8. Tira a HE da capacidade
  e deixa os dias comparáveis. ⚠ O turno tem 8 h 48 min produtivas: os 48 min
  ficam como folga, e isso está escrito no relatório.
- **Teto físico manda** (v7.75.0): ritmo acima de `_phTeto` é limitado a ele
  (`limitadoTeto`) — medido em 01/07–24/09: DECOR 470 a 351 sem nenhuma hora
  sozinho. **Âncora A = maior volume abaixo de `UEP_ANCORA_TETO_MAX` (90%) do
  teto**: a SLEEP rodou 332 com teto ~329 — ali a esteira limita, não a
  equipe, e ela inflaria a UEP de todos. Teste de sanidade: dia com UEP/h
  acima do ritmo da âncora ×1,05 sai com ⚠. Cobertura do dia **sem corte em
  100%** (acima = apontamento a mais que o realizado).
- Medido em 01/07–24/09/2026 (60 dias, com a hora repartida): oscilação do
  ritmo **fora da amostra 43,8% → 22,6%** e do dia **34,0% → 14,7%** — a UEP
  explica metade da variação; em UEP a meta do dia cabe no limite de 20% da
  aba PLANO, em caixas não. Só 9 de 89 produtos com 5+ dias.
- **v7.76.0 (leitura do PDF real com o PPCP):** a UEP sai do **ritmo EM
  REGIME** com `UEP_REGIME_MIN_H` (4) h ou mais sozinho, senão do usado
  (`baseRegime`; o campo `ritmo` do produto É a base da UEP, `ritmoUsado` é a
  coluna). ⚠ O **teste de sanidade é o TETO da âncora**, nunca o ritmo médio:
  a v7.75.0 comparava com a média e acusou 20 de 60 dias — dia bom passa da
  média; pelo teto sobraram 4. Suspeito = acima do teto da âncora OU
  apontamento acima do realizado; sai da **faixa sugerida de meta** (p50–p60
  da UEP em 8 h, `QP_FAIXA` da aba PLANO, `QP_MIN_DIAS`+ dias válidos).
  Leitura de 01/07–24/09 (antes do regime): capacidade p50 **2.192** / p60
  **2.223 UEP em 8 h**, oscilando **8,5%** contra **34,8%** das caixas/dia.
- **ALVO PROVISÓRIO = 2.300 UEP em 8 h** (`UEP_ALVO_PROV`, v7.79.0, PPCP,
  24/09/2026: *"2300 ups dia"*, confirmado *em 8 h*). Fica **acima** da faixa
  p50–p60 de propósito (bateu 18 de 51 dias válidos, ~p65; pede 287 UEP/h
  contra 278 da MADERO sozinha). Card + coluna ALVO na UEP POR DIA; dia
  suspeito sai "—". Só no estudo. **Substituir pelo tempo padrão** quando a
  cronoanálise vier: alvo = 8 h × 3.600 ÷ TP da MADERO. A folha de
  cronoanálise (xlsx: MADERO âncora + SLEEP, CAMARIM MEL e CAMARIM ELOA para
  conferir a proporção; a VERSATIL saiu — 4 h sozinha, 3 dias acima do teto)
  foi entregue fora do repositório.
  - ⚠ **REVOGADO na v7.132.0 — o alvo provisório SAIU do estudo** (PPCP,
    15/10/2026, com as duas telas na mão). Ele julgava a UEP DO ESTUDO, que é
    **refeita a cada período com a âncora do período**, e por isso dava o
    veredito na escala errada: 16/09/2026 saía **NÃO** no estudo (1.799 em 8 h
    contra 2.300) e **BATEU** no HISTÓRICO (2.731 contra 2.530). Por caixa, o
    estudo deu 1,38 UEP/cx e o cadastro ~1,81 no mesmo dia — ~31% de escala.
    - No lugar: coluna **UEP GRAVADA · % META** na UEP POR DIA (a oficial do
      HISTÓRICO, só jornada, com a cor `sc` da aba HISTÓRICO) e o card **UEP
      GRAVADA · BATEU A META** (`uepHistResumo`). `_uepEstudo` ganhou o 5º
      parâmetro `histDias` (o `buildDiasHistAsync` que o relatório já lia).
    - A **FAIXA SUGERIDA DE META sai da UEP GRAVADA** (p50–p60 dos dias válidos
      com UEP gravada), não mais da UEP em 8 h do estudo: é contra a META UEP
      que ela se compara. Diz em que percentil a meta atual cai.
    - **A UEP do estudo NÃO se compara com meta nenhuma** — colunas renomeadas
      `UEP ESTUDO`. O teste falha se `UEP_ALVO_PROV`/`bateAlvo` voltarem.
    - As notas do relatório foram enxugadas (pedido do PPCP: *"cuidado com as
      notas, tem muita coisa"*): uma linha cada; o método mora só no quadro
      COMO O NÚMERO SAI. O item "POR PRODUTO, NÃO POR COR" dele estava
      desatualizado desde a v7.94.0 (a base é a cor mais rápida) e foi
      corrigido.
- **UEP DO DIA NO GERENCIAL — a UEP virou PARÂMETRO DO CADASTRO** (v7.80.0 /
  mobile 1.20.0 / `.gs` v5.11, PPCP, 24/09/2026: *"colocar nessa tela e app
  gerencial a meta e o que fez no dia UEP"*, e *"na aba que já existe… para
  servir de parâmetros"* — **nada de aba nova**).
  - Colunas **`UEP`** (título EXATO: por prefixo casaria `UEP_VIGENCIA`) e
    **`UEP_VIGENCIA`** na `PRODUTO_CODIGO`, **por CÓDIGO** (o PPCP pode ter UEP
    diferente dentro do mesmo produto). `lerCatalogoProdutos` lê com `_numBR`
    (aceita `0,84`).
  - **💾 GRAVAR UEP** (`gravarUepCadastro`, PRODUÇÃO/HORA): mesma conta do
    estudo (`_uepEstudo`, dois chamadores); manda `[modelo, nome, uep]` por
    produto em lotes de `UEP_GRAVAR_LOTE`=20, em sequência, por `jsonpEscrita`;
    o `setUepCatalogo` desce para cada código pelo `produtoDoCodigo` (a chave
    do estudo), cria as colunas se faltarem e só toca os produtos enviados.
    Provisórias vão junto (o confirm diz quantas). **Recalcular não troca a
    régua — só um novo GRAVAR troca**, como manda a regra de não mover meta
    histórica.
  - **UEP POR VOLUME** (`.gs` v5.12, `_uepPorVolume`, PPCP 24/09/2026: *"cada
    volume tem um ritmo, o total no produto está ok"* e *"não embala um volume
    por vez"*). Com os volumes INTERCALADOS nenhum dado de hora separa o ritmo
    de cada um: o estudo mede o PRODUTO (caixas dos volumes juntas), e o
    `setUepCatalogo` reparte o jogo (`uep × nº de volumes`) pelo tempo de
    esteira de cada volume (`MEDIDA DA CAIXA + ENTRE_PECAS`, lido do cadastro).
    O total do produto não muda (ORION 1,54+1,54 → 1,75+1,33). Falta medida em
    algum volume → média, contado no alerta. ~~Um novo GRAVAR sobrescreve a UEP
    digitada à mão~~ — **revogado na v7.133.0 / `.gs` v5.24**: UEP medida ou
    digitada é PROTEGIDA e só troca com o 2º OK do GRAVAR (ver *UEP PADRÃO
    VERSIONADA*). Não tentar "medir por volume" no histórico sem a linha passar
    a embalar um volume por vez.
  - `getPontosDia` devolve **`uep`** = `{normal, he, cxCom, cxSem, codigos}`,
    com a HE pela **mesma régua das caixas** (`_ehHoraExtraCaixas`). Nenhuma
    leitura nova (o catálogo já era lido).
  - **Meta = `META_UEP` da `CONFIG_PAINEL`** (`painelConfig.metaUep`), sem ela
    `UEP_META_PADRAO`=2300 no `rp-core` (hoje 2.530, ver abaixo).
  - **`uepCard(uep, metaCfg, minJornada)` no `rp-core`, UMA conta e UM texto**
    para os dois gerenciais. Meta de **8 h de jornada normal**; esperado =
    `efNoRitmo(feito, meta, min(minNorm,480), 480)` — depois de 8 h é a meta
    cheia. `minNorm` = minutos de slots NÃO-HE com lançamento (`calcKPIs` dos
    dois). Estados distintos: `null` aguardando · `false` backend sem o campo ·
    `codigos:0` cadastro vazio. **TV e operador não mostram** (teste prende).
    ⚠ Desde a v7.138.0 a TV tem UEP, mas **só nas Telas F e G** (desligadas
    por padrão, ver a seção delas); a Tela A, a Tela B e o operador seguem em
    caixas.
- **UEP NA PROGRAMAÇÃO E HORA A HORA** (v7.82.0 / mobile 1.21.0 / `.gs` v5.13,
  PPCP 24/09/2026). `getProgramacaoDetalhada` manda `uep` (qtde × UEP do
  código; **null** sem UEP, nunca 0) e `uepCx`. A aba PROGRAMAÇÃO mostra a
  coluna (some com backend antigo, regra da COR) e, por dia, UEP × meta de UEP
  (âmbar > 100%) + caixas sem UEP à parte. Hora a hora: `uepPorHora` (soma o
  `porHoraModelo` pelo INÍCIO da hora, HH:MM) e `uepCelula` (meta da hora = meta
  do dia × minutos do slot ÷ 480; HE sem cor; `*` = caixas sem UEP), no
  `rp-core`, usados pelos dois gerenciais. Só HOJE: dia passado não tem
  `porHoraModelo` (a coluna some no modo histórico). O mobile passou a guardar
  `porHoraModelo` no `PONTOS_DIA`.
- **UEP NO HISTÓRICO, RELATÓRIOS E COMPARATIVO** (v7.83.0 / mobile 1.22.0 /
  `.gs` v5.14, PPCP 24/09/2026). Colunas **12 UEP · 13 UEP HE · 14 META UEP**
  no `HISTORICO`, gravadas por `arquivarDiaAtual` e `saveDay` via
  `_uepColsDoDia` (lê o log DIRETO — é escrita — e o cadastro; HE pela régua
  `_ehHoraExtraCaixas`; conta pura `_uepPorDiaDoLog`). **Congeladas**: mudar a
  UEP do cadastro não reescreve dia fechado (regra de não mover meta
  histórica). Sem UEP no cadastro → células vazias, nunca 0. `getHistory`/
  `getHoraDia` devolvem `uep/uepHe/metaUep` (null = sem). `preencherUepPassada
  (sobrescrever)` no editor preenche os antigos com a UEP ATUAL (a da época não
  existe). `UEP_META_PADRAO_GS` = `UEP_META_PADRAO` do rp-core (teste prende).
  `_numBR` lê `2.300` como milhar.
  - Front: `uepHistResumo`/`uepDiaMeta` (rp-core) — média só dos dias com UEP,
    bateu = UEP ≥ meta DAQUELE dia. HISTÓRICO (coluna + card, grid `c6`),
    gerencial de dia passado (card), celular (modal do dia), relatório semanal
    (`_relUepSemanaHtml`, seção própria — a tabela diária já é larga), PDF do
    dia (coluna + linha pelo `uepCard`), total do dia por modelo (`calcPorModelo`
    soma o `uep` do `porHoraModelo`; UEP/cx só das caixas COM UEP).
  - Comparativo do período: `getProducaoModeloPeriodo` manda **`uepProd`**
    (mapa `modelo|nome → UEP/cx`, **não** um campo por item — 100 KB do cache);
    `_phUepPorGrupo(itensView,keyOf)` faz a média pelas caixas para qualquer
    agrupamento (produto, cor, família). O `UEP/cx` vai numa **coluna própria
    `UEP/CX`** logo depois do nome, na tela e no PDF (os dois passam o mesmo
    `uepGrupo`; texto por `_phUepTxt`, "—" sem UEP, coluna some com `temUep`
    falso). ⚠ **Não voltar a colar no fim do nome** (v7.129.0, PPCP: *"está
    tudo desalinhado na frente da descrição"*): cada nome tem um comprimento e
    o número ficava numa altura diferente a cada linha. O teste prende.
- **META DE UEP = JORNADA INTEIRA, 2.530** (v7.84.0 / `.gs` v5.15, PPCP
  24/09/2026). `UEP_META_PADRAO`=2530 e `UEP_MIN_DIA`=527 (minutos da jornada
  normal) no rp-core; `UEP_META_PADRAO_GS`=2530 no `.gs`. O card soma a jornada
  inteira, então a meta tem de ser dela: 2.300 (estudo, ritmo × 8 h) contra a
  jornada de 527 min era ~10% mais fácil (6 de 7 dias acima). Os dois dão ~288
  UEP/h. O `UEP_ALVO_PROV` (estudo) saiu na v7.132.0. `regravarUepPassada()` regrava a META UEP gravada nos dias
  fechados. As notas acima que dizem "2.300 em 8 h" / "÷ 480" no card são da
  v7.80–7.83.
- **A META PADRÃO FICA EM 2.530** — a v7.98.0 a levou a 2.500 e a v7.99.0
  voltou no mesmo dia (PPCP, 25/09/2026: digitou 2.500 no ⚙ e depois voltou
  para 2.530). O dia 24/09 do `HISTORICO` ficou gravado com META UEP 2.500 e
  se corrige à mão (N88). O `.gs` v5.19 nunca deve ser colado — o v5.18 é o
  certo.
- **CARTEIRA EM UEP** (v7.85.0, item 4 do PPCP, 24/09/2026). Seletor CARTEIRA
  ganhou `uep` (`QP_MIX`, na `rpe_qp_pref`). `_cartMontar(…,'uep')` passa ao
  `_cartAberta` um "ritmos" `{uep:true, fallback}`: fator = `uepCx` da linha
  da programação (.gs v5.13), sem UEP → `_cartUepMedia` (média pela qtde) e
  conta em `semBase`. Dívida por `_planoDividaUep` (lista por CÓDIGO × UEP).
  ⚠ **Revogado na v7.110.0**: sem UEP não entra mais pela média — ver
  PRÓXIMOS DIAS no gerencial (`_cartSemUep`/`_gpxDivida`).
  **A régua também é UEP**: `_qpCurvaUep` (UEP de jornada do HISTORICO, dia sem
  UEP fora) — no `_cartBlocos`, por modo. Desenho: o MESMO `_cartHtml`, com
  `_cartUn(a)` (unidade de TODO texto) e `_cartPeso(a,f)` (UEP/cx absoluto, sem
  selo lento/rápido); em UEP **não há fantasma** (programado em cx num eixo de
  UEP misturaria unidades) e o número da barra é a carga. E SE PARADAS não sai
  em UEP (`cenario.falha:'uep'`, a perda é valorada em caixas). Sem base
  (`uepFalha`: `sem-uep` / `sem-historico`) → aviso no `_cartBlocosHtml`, não
  vazio. Os modos antigos não mudaram.
- **UEP hora a hora do DIA PASSADO** (v7.86.0 / `.gs` v5.16): `getHoraDia`
  devolve `uepHora` (`_uepHoraDoDia` → `_uepPorHoraDoLog`, puro e testado,
  mesmo formato do `uepPorHora`). A leitura é recortada pela data
  (`_valoresPorData`). ⚠ A hora usa a UEP do cadastro **ATUAL**; o total do
  card é o **congelado** no fechamento. Os dois podem diferir, e o tooltip diz
  isso. Falhou ou não há UEP → `null` e a coluna some.
- **UEP EM DESTAQUE NA SEMANA E NAS IMPRESSÕES** (v7.87.0, PPCP 24/09/2026:
  *"na semana tbm colocar a UEP e em todas impressões destacando"*).
  ~~`_rpUepFaixaHtml(dias)` é a faixa ÚNICA do relatório semanal e do histórico,
  logo abaixo do resumo~~ (revogada: saiu do semanal com UEP na v7.251.0 e do
  código na v7.267.0, quando o 🖨 do histórico passou a abrir com a UEP pela
  montagem da tela — a faixa tinha régua própria, 100/90% sem a hora extra). É desenho: a conta é o `uepHistResumo`, que ganhou
  `metaTot`, a soma das metas dos dias COM UEP. PDF do dia: 1º card
  `uepDoc = uepCard(...)`. PDF do período: card UEP APONTADA
  (`_phUepTotal`, todas as horas e só as caixas apontadas; não é a UEP de
  jornada). O bloco da semana ganhou `gsem-linha-uep` e a linha de UEP por
  dia (`comUep`, só com o prefixo `gsem-`). ⚠ O `pintar` é o mesmo da Tela D,
  e a TV não mostra UEP porque não tem esses ids. (v7.250.0: no gerencial a UEP
  passou a ser o número grande e esta linha virou a das CAIXAS — ver
  *FECHAMENTO DA SEMANA PASSADA COM A UEP NA FRENTE* em `gerencial.md`.)
  WhatsApp: linha própria, sem emoji. Paradas, perdas e simulador continuam em caixas.
- **R$ POR UEP SAIU DOS CARDS** (v7.100.0, PPCP 25/09/2026: *"pode tirar
  esse valor em reais daí, precisa ser em um lugar estratégico"*). O
  `_uepComCusto` foi apagado; o `uepCusto` fica no rp-core, testado, até o
  lugar ser escolhido. O `relatorios.test.js` falha se o R$ voltar ao card.
  A nota abaixo descreve a v7.88–7.99.
- **CUSTO POR UEP mora na aba SIMULADOR** (v7.101.0, PPCP escolheu o lugar
  recomendado). `uepCustoPeriodo(custoHora, dias)` no rp-core: dias FECHADOS
  do período com UEP, cada um pagando a jornada inteira (527 min) — a mesma
  base da meta —, contra custo ÷ Σ metas de UEP dos dias. Faixa `#sim-uep`
  acima da base da simulação, desenho puro (`_simUepPintar`), redesenhada no
  `_pgSimAtualiza` (o custo-hora muda enquanto se digita). Dias do
  `buildDiasHistAsync` filtrados pelo `sim-de`/`sim-ate` (`SIM_UEP`), sem
  chamada nova. Hoje não entra: não fechou.
- **TEXTO DO CARD UEP DO DIA = o do % DA META DO DIA** (v7.100.0, PPCP:
  *"está confuso"*): `NO RITMO · 1.413 de 1.383 UEP esperadas até agora ·
  meta do dia 2.530 UEP · +410 em HE`. Um veredito só (o selo); o `(55,9%)`
  da meta cheia saiu porque parecia contradizer o NO RITMO.
- **R$ POR UEP** (v7.88.0, PPCP 24/09/2026). Conta: `uepCusto(custoHora,
  uepFeito, minJornada, metaUep)` no rp-core. R$/UEP = custo-hora × min ÷ UEP;
  meta = custo-hora × 527 ÷ meta; `excesso` = R$ pagos sem virar UEP. Os dois
  cards UEP DO DIA (hoje e dia passado) passam pelo `_uepComCusto`. ⚠ O
  custo-hora sai do `rpe_pg_sim` (SIMULADOR), **só deste computador**, e nunca
  da planilha: a URL do Apps Script é pública. Sem custo-hora não aparece R$
  nenhum. É custo de conversão da embalagem, não custo do produto.
- **META DIA (UEP) NAS CONFIGURAÇÕES** (v7.89.0 / `.gs` v5.17). Campo
  `c-meta-uep` no ⚙. O `saveCfg` põe em `_metaUepNova` só quando o valor
  MUDOU, e o `enviarConfigPainel` manda `metaUep` uma vez. O `setConfigPainel`
  grava `META_UEP` só com número > 0. ⚠ Nunca mandar sempre: um aparelho que
  abriu antes de ler a config apagaria a meta dos outros.
- **SIMULADOR DE CAPACIDADE EM UEP** (v7.90.0, PPCP 24/09/2026: *"tem que
  ser para penteadeira completa"*). Botão 🧮 na aba PROGRAMAÇÃO, modal
  `#modal-capuep`. Contas puras e testadas: `_capVol`, `_capNome`,
  `_capProdutos`, `_capMix`.
  - A unidade é o **PRODUTO COMPLETO**. A chave é modelo (6 dígitos) + nome
    sem `VOL a/b` e sem cor. UEP do produto = soma dos volumes 1..N (média
    entre as cores).
  - Volume sem UEP → produto `null`, fora da soma e contado.
  - O cadastro só é lido ao abrir (`getProdutos`, 3 tentativas em sequência,
    cache de 10 min).
  - Digitar a quantidade atualiza só as células (`_capQtde`), senão o campo
    perde o foco.
- **ENTRE AS CORES VALE A MAIS RÁPIDA, NUNCA A MÉDIA** (v7.94.0, PPCP
  24/09/2026). Revoga a leitura anterior ("cor é ruído, UEP pela média do
  produto").
  - `_uepProdutos` monta o regime por COR (`matCor`): hora com o produto
    sozinho na linha E uma cor só dele.
  - A base da UEP é a cor mais rápida com `UEP_REGIME_MIN_H`+ h assim
    (`baseCor`/`corRap`). Senão, o regime do produto; senão, o usado. O teto
    físico continua limitando.
  - Simulador: entre as cores de um volume vale a MENOR UEP do cadastro. Pontos
    continuam pela média (ponto é tabela, não ritmo).
  - ⚠ Só vale no painel depois de um novo 💾 GRAVAR UEP.
- **LIMITE DA ESTEIRA NO SIMULADOR** (v7.95.0, PPCP 24/09/2026). Cada volume
  ocupa `(MEDIDA + ENTRE_PECAS) ÷ (VELOCIDADE × 60.000)` h de esteira (entre as
  cores, a mais curta); o jogo é a soma, e `tetoDia` = jogos/h × 527 min.
  `_capDia(p, meta, velSim)` é a conta ÚNICA da tela e dos dois PDFs: pela UEP
  (`meta ÷ uepJogo`) e, se passar do limite, o dia é CORTADO no limite com ⚠.
  - O campo **VELOCIDADE ESTEIRA (m/min)** simula esteira mais rápida (*"a
    esteira eu posso aumentar a velocidade"*): vazio = velocidade do cadastro.
    Nada é gravado.
  - ⚠ Produto marcado = **UEP baixa demais OU velocidade do cadastro errada**.
    Não é para "corrigir" a UEP pelo limite: é o sinal para conferir.
  - Sem MEDIDA/VELOCIDADE em algum volume → limite `null`, nada é cortado.
- **CAPACIDADE POR PRODUTO na ⏱ CRONOANÁLISE e o MÊS** (v7.164.0, PPCP
  26/10/2026: *"colocar essa impressão na cronoanálise e colocar a coluna qtde
  mensal"*). O `gerarRelatorioCapTodos(oficial, menos)` ganhou a coluna
  **PRODUTOS / MÊS** = produtos/dia × `CAP_DIAS_MES`=22 — o mês típico do
  simulador e da SWOT (foi 21 só na v7.164.0; *"volta para 22 dias"*). Sem
  sábado e sem HE, depois de PRODUTOS / DIA.
  - O botão **🖨 CAPACIDADE POR PRODUTO** da aba ⏱ CRONOANÁLISE chama
    `_ucvCapTodos()`, que abre o diálogo `#modal-capjorn` (v7.165.0, abaixo);
    o IMPRIMIR dele → `gerarRelatorioCapTodos(true, n)`: `oficial` = META UEP do
    ⚙ (`PONTOS_DIA.metaUep`) e velocidade do cadastro, nunca o que ficou
    digitado no modal (simulação). Sem o argumento (o botão do modal), vale o
    modal, como antes.
  - ⚠ **Síncrono de propósito**: o pop-up tem de abrir no clique. Sem
    `CAP_CAT`, o `_capCatLocal()` (também do `abrirCapUep`) monta o cadastro
    guardado neste computador e o papel diz de quando ele é
    (`CAP_CAT_ORIGEM`); sem nenhum, avisa e dispara o `_capBuscar`.
  - `relatorios.test.js` roda a impressão real (oficial × modal, o mês cortado
    no limite da esteira, o cadastro guardado, a jornada simulada).
- **SIMULAÇÃO DE JORNADA** (v7.165.0, PPCP 26/10/2026: *"vamos ter alteração de
  jornada em dezembro, vai diminuir 24 minutos por dia, coloca um simulador"*).
  Diálogo `#modal-capjorn` (MINUTOS A MENOS POR DIA, guardado em
  `localStorage['rpe_cap_jorn']`; vazio = jornada de hoje) com o quadro ao vivo
  (`_capJornHtml`) e o IMPRIMIR.
  - Conta pura `_capJornada(meta, menos)`: jornada = `UEP_MIN_DIA` − menos; a
    linha **mantém o ritmo de hoje** → meta nova = meta × jornada ÷ 527
    (arredondada; é ela que entra no `_capDia`, para o papel fechar), −UEP no
    mês (× 22) e o ritmo que manteria a meta de hoje (meta ÷ jornada × 60).
    Até `CAP_JORN_MAX`=240 min; texto/negativo → erro, nunca número inventado.
  - `_capDia(p, meta, velSim, minDia)`: o limite da esteira é refeito nos
    minutos que sobram (sem `minDia`, o `tetoDia` de 527 de sempre).
  - Na impressão, com a simulação, a tabela INTEIRA vai para a jornada nova
    (produtos/dia, mês, caixas, produtos/hora, limite, pontos) + a coluna **A
    MENOS / MÊS** contra a de hoje (o por dia no `title`) + quatro cartões
    (`_capJornDocHtml`, grade de 4). Desenhos sem conta (o teste prende).
  - **% PERDA** (v7.166.0, PPCP: *"colocar percentual de perda na impressão"*):
    cartão PERDA DE CAPACIDADE (minutos ÷ 527, com UEP/dia e UEP/mês) e coluna
    % PERDA por produto (produtos/dia a menos ÷ os de hoje — perto dos 4,6% em
    todos; só o arredondamento muda). O `_capJornada(meta, menos, turnoFim)`
    devolve `fimNovo` = fim do turno do ⚙ − minutos, dito como "se o corte for
    no fim" — o PPCP ainda não decidiu onde saem os 24 min; a possibilidade
    levantada em 26/10/2026 é o turno terminar às **16:36**.
  - **MÊS e ANO** (v7.167.0, PPCP: *"simular sobre os meses também, mensal e
    anual"*): `_capJornada` devolve `anoMenos` (UEP) e `minMes`/`minAno`
    (jornada); ano = mês × `CAP_MESES_ANO`=12, a conta do simulador de
    investimento. Faixa `_capJornPeriodo` (POR DIA · MÊS · ANO) no quadro e no
    papel, e a coluna **PRODUTOS A MENOS / ANO**. O título da coluna do mês
    virou **PRODUTOS A MENOS / MÊS** — o PPCP perguntou *"a menos mês é o
    que?"*: sem a unidade no título, não dava para saber que eram produtos.
  - **PERDA FIXA** (v7.170.0, PPCP 27/10/2026: *"esse percentual é sobre o
    tempo que diminuiu?"* → *"colocar perda fixa"*). Campo **PERDA FIXA POR DIA
    (MIN)** no diálogo (`#capj-fixa`, `rpe_cap_fixa`; vazio/0 = a conta
    proporcional de sempre, texto/negativo/≥ jornada simulada = erro). É o tempo
    que NÃO encolhe com a jornada: os minutos cortados saem todos do tempo de
    produzir. `_capJornada(meta, menos, turnoFim, fixa)`: `prodHoje` = 527 −
    fixa, `prodNovo` = jornada − fixa, meta nova = meta × prodNovo ÷ prodHoje,
    `pct` = −menos ÷ prodHoje (o proporcional fica em `pctProp`, escrito no
    cartão), PARA MANTER = meta ÷ prodNovo (o ritmo fora da perda fixa, contra
    `ritmoProdH`). `minCap` = 527 × prodNovo ÷ prodHoje: a capacidade da
    simulada na PROGRAMAÇÃO × CAPACIDADE (`jorn[k].min`; os minutos de jornada
    ficam em `jorn[k].jorn`, o título) — a carga está no ritmo médio de hoje, e
    assim as duas impressões do diálogo dão a mesma meta. Sem fixa, `minCap` =
    jornada e tudo é como antes. O limite da esteira continua nos minutos da
    jornada (teto físico, sem parada).
    - Medido na planilha (19 dias de 28/09 a 26/10/2026): 79,6 min/dia de
      paradas apontadas; fixos ~54 (troca de produto 32,2 · café ~16 · limpeza,
      reunião e finalização de lote 5,5). ⚠ **O café não é apontado desde
      25/09** (15–17 min todo dia até lá; voltou em 27/10): conferir o
      apontamento antes de tirar média da aba. Variáveis (encolhem com a
      jornada): "Outros" 16,5, troca de plástico 13,3 (consumo de bobina), o
      resto ~12. 24 min a menos com 54 de fixa = −5,1% (meta 2.402), não −4,6%.
  - **MOTIVOS DA PERDA FIXA** (v7.171.0, PPCP: *"lista na impressão os motivos
    da perda fixa"* → *"enxuga o que puder"*). Com perda fixa digitada, o
    `_capJornDocHtml(J, M)` (as DUAS impressões do diálogo) traz a tabela
    `_capFixaDocHtml`: os tipos de `CAP_FIXA_RE` (troca de produto e de cor,
    café, limpeza, reunião, finalização, aniversariantes — o que depende do dia
    ou da programação; plástico, isomanta e "Outros" ficam fora) em vezes/dia e
    min/dia, + a linha **SEM APONTAMENTO NAS PARADAS** = digitado − soma (dos
    valores exibidos, uma casa). Conta `_capFixaMontar(st, fixa, de, ate)` sobre
    o `st` do `_paradasStats` (duração sem almoço, `nDias` = dias trabalhados):
    a régua da GESTÃO DE PERDAS.
    - **Leitura**: `_capFixaCarregar` (só no diálogo, depois da programação —
      uma de cada vez) → `_pgContextoDoPeriodo` com a janela de 30 dias da
      GESTÃO (`_capFixaJanela` = `_pgFiltro(30)`): mesma busca, `PG_TELA_CACHE`
      e voo compartilhado. As impressões seguem síncronas: sem a leitura, o
      papel diz que as paradas não foram lidas.
    - Tipo novo de parada que seja fixo → entrar no `CAP_FIXA_RE`.
    - Papel enxuto na mesma versão: COMO O NÚMERO SAI uma linha por termo, a
      nota que repetia o cabeçalho saiu (a de velocidade simulada fica).
  - **LIMITE ESTEIRA · PRODUTOS / DIA** (v7.170.0): é em PRODUTOS, não caixas —
    o PPCP leu "855 cx/dia contra limite 444" (444 produtos de 3 volumes =
    1.332 cx). A célula tem as caixas no `title`. A tabela tem as colunas
    centralizadas (`_CAP_TODOS_SKIN`, escopada em `.cap-todos`; o PRODUTO fica
    à esquerda).
  - ⚠ **É só a capacidade.** A mudança de jornada de verdade (dezembro) mexe em
    mais coisa e nada disso muda sozinho: `UEP_MIN_DIA`=527 (rp-core — meta da
    hora, esperado do card UEP, Telas F/G, PRÓXIMOS DIAS), a META UEP do ⚙, o
    turno do ⚙ (`turnoInicio`/`turnoFim`) e as `HE_JORNADA_*` do `.gs` (a hora
    extra é contada por horário), os slots da `HORA_A_HORA` e a regra do
    `getSlots`. Combinar com o PPCP ONDE saem os minutos antes de mexer.
- **PROGRAMAÇÃO × CAPACIDADE** (v7.168.0 / `.gs` v5.37, PPCP 26/10/2026, prompt
  *"Evolução do Relatório de Capacidade Diária por Produto"*). Impressão
  PRÓPRIA `gerarRelatorioCapProg(menos)` (paisagem, `_rpDocParadas` → 15
  usuários, `_rpCabecalho` 19 chamadas, rodapé `APP_NOME_CX` 13 — o teste
  conta): a programação DATADA contra a jornada de hoje e a simulada, com o MIX
  que está nela. Botão **🖨 PROGRAMAÇÃO × CAPACIDADE** no diálogo
  `#modal-capjorn` (`_capJornImprimir('prog')`). ⚠ **A 🖨 CAPACIDADE POR
  PRODUTO ficou IGUAL** (PPCP, no meio do trabalho: *"deixar a impressão antiga
  também"*) — o teste falha se ela passar a ler a programação; o Enter do
  diálogo continua nela.
  - ⚠ **Nenhuma conta de carga nova**: `_capProgDoPainel(J, meta)` →
    `_gpxDoPainel(CAP_PROG_DIAS, meta)` → o MESMO `_gpxMontar` do PRÓXIMOS
    DIAS (UEP ÷ ritmo da meta, já adiantado fora, sem UEP fora e listado, atraso
    e o de hoje fora). `_gpxDoPainel(n, metaUep)` ganhou os dois parâmetros
    (sem eles, o de sempre). A meta passada é a de HOJE (`meta0`): a simulada
    só reduz a capacidade, o ritmo é o mesmo. O teste confere a paridade dia a
    dia.
  - `_capProgMontar(P, J)` (conta): minuto INTEIRO por dia (os totais fecham com
    a coluna); por jornada saldo, ocupação e situação pelo `_gpxEstado` — a
    regra do PRÓXIMOS DIAS, agora numa função só: COM FOLGA (≥ `GPX_FOLGA_OK`) ·
    DENTRO · ACIMA ATÉ 1h45 (`GPX_EXC_MAX`) · ACIMA. ⚠ **"Próximo do limite"
    não existe** — não há régua; o PPCP define o número se quiser, numa
    constante.
  - Fora da capacidade, e dito no papel: FERIADO da aba `FERIADOS` (v7.174.0),
    dia útil sem lote (feriado fora da aba, ou sem programação), sábado com
    lote (todo HE), dia só com linha sem UEP (SEM DADOS). Horizonte: até `CAP_PROG_DIAS`=10 dias úteis, cortado no último dia
    com lote.
  - **Lotes na ORDEM do dia** (coluna ORDEM da PROGRAMACAO, `_progOrdem`;
    `_cartAberta` e `_cartSemUep` guardam a ordem por linha; o `_gpxMontar`
    devolve `grupos`, todos os lotes do dia com a menor ordem das linhas). Só
    os dias acima de alguma jornada vão ao papel: acumulado e, por jornada,
    CABE · PARCIAL (cabem X de Y) · FICA DE FORA. Algum lote sem ordem no dia →
    sem veredito, do mais pesado ao mais leve. Lote com linha sem UEP → dali
    em diante INCERTO (o acumulado é um piso; FICA DE FORA continua certo).
    Ordem repetida → entre eles vale o número do lote, e o papel avisa.
  - Diálogo `#modal-capjorn`: resumo `_capProgResumoHtml` (`#capj-prog`, pede ·
    capacidade · saldo · ocupação · dias acima, nas duas jornadas). Lê a
    programação ao abrir só se a do painel tem mais de `GPX_TTL` (15 min);
    `CAP_PROG_LENDO` evita duas leituras; o fim redesenha. A impressão é
    síncrona: usa o que está no painel; sem programação lida (ou com a falha,
    pelo `_progDetFalhaInfo`), sem UEP, sem lote ou com a montagem quebrada →
    avisa (`_capProgFaltaTxt`) e NÃO abre o pop-up; o diálogo fica aberto.
  - ⚠ Na impressão o atraso e o que falta de hoje ficam numa linha HOJE
    (previsão, jornada de hoje, `conta` do `_gpxMontar`) — não entram nos dias.
  - Medido com a programação de 26/10/2026: 27/10–06/11, 8 dias úteis, pede
    88h29 × 70h16 (126%), os 8 acima; na simulada (503) 67h04 (132%).
  - `.gs` v5.37: `_lerProgDaAba` lê a coluna `ORDEM` (nome exato, maiúsculas) e
    o `getProgramacaoDetalhada` manda `ordem` (número; vazia/texto/sem coluna →
    null). ⚠ **re-deploy manual**; antes dele, sem veredito por lote.
  - Testes: `relatorios.test.js` (o 27/10 real, paridade com o `_gpxMontar`,
    ordem, incerto, sem dados, totais, o papel e o diálogo) e
    `programacao.test.js` (a ORDEM no `.gs`). Conferidos por mutação.
  - **PONTOS NA JORNADA × META** (v7.169.0, PPCP 26/10/2026: a meta de pontos
    por dia é *"o ideal para faturar"*, *"s/ horas extra"*). Campo **META DE
    PONTOS / DIA · SEM HE** no diálogo (`#capj-pts`, `_capPtsMetaLer`: vazio =
    sem meta; texto/zero/decimal = erro, nunca 0), guardado em
    `localStorage['rpe_cap_pts']`. Desde a v7.187.0 o diálogo COMEÇA na meta do
    ⚙ (CONFIG_PAINEL, `_metaPtsDia`); o digitado nele é da simulação e fica
    neste computador. ⚠ **O VALOR DA META NÃO VAI PARA ARQUIVO
    NENHUM DO REPOSITÓRIO** — código, comentário, teste ou doc: o painel é
    público na Vercel (a regra do custo-hora). O teste usa uma meta de exemplo e
    falha se o valor do PPCP aparecer no HTML.
    - `_capProgMontar(P, J, metaPts)`: `ptsJ` por dia e jornada — dia que cabe =
      `d.pts`; dia acima = pontos dos lotes CABE + o PARCIAL × (minutos que cabem
      ÷ minutos do lote); sem ordem, lote INCERTO ou linha sem pontos → null. Os
      pontos por lote vêm do `_cartAberta` (`pts` por linha, `pontos × q ÷ q0`) e
      somam no `grupos` do `_gpxMontar` (`pts` null se alguma linha não tem).
    - Período: `ptsJorn`/`ptsDia`, `ptsPct` (÷ meta × dias), `nMetaPts` e
      `ptsUepNec` = meta de pontos ÷ meta de UEP da jornada (porMin × minutos).
      `C.ptsUep` = pontos ÷ UEP da programação. É ele contra o `ptsUepNec` que
      diz se o MIX chega à meta — medido em 26/10/2026: 76, abaixo do que a
      meta pede (o número da meta fica fora daqui, ver acima).
    - Pontos só contam linha COM UEP (as sem UEP ficam fora do tempo e dos
      pontos, como no PRÓXIMOS DIAS).
- **UEP DE TODO O CADASTRO — ESTIMADA PELA ESTEIRA** (v7.96.0 / `.gs` v5.18,
  PPCP 25/09/2026: *"fazer a UEP de todos produtos"*). O GRAVAR UEP, depois da
  medida, chama `setUepCatalogo&estimar=1&k=&tetoAnc=`. `_uepCalibEsteira`
  (front, pura): `k` = **mediana** de `uepVol × teto ÷ teto da âncora` nos
  medidos com amostra (menos de `UEP_CALIB_MIN`=3 → entram os provisórios;
  ainda menos → sem estimativa). `.gs`: `_uepEstimada` = `k × tetoAnc ÷
  _tetoEsteiraCxH(código)`, por código (a repartição entre volumes sai sozinha
  pela medida de cada caixa); velocidade vazia → mediana do cadastro; sem
  medida → sem UEP, contado. Vigência com sufixo **`EST`**.
  - ⚠ **Só grava onde a UEP está vazia ou já é `EST`** (`_uepEhEstimada`) —
    medida e digitada à mão ficam. Rodou o produto → o próximo GRAVAR troca a
    estimativa pela medida (a medida sobrescreve, como sempre).
  - ⚠ `k`/`tetoAnc` são lidos com `Number`, **não `_numBR`**: `"312.456"` como
    pt-BR viraria milhar.
  - É **estimativa**: a faixa min–max dos quocientes vai no confirm. Faixa
    larga = a caixa explica pouco o ritmo (a operação roda a 22–68% do teto).
- **ABA ⚖ UEP no gerencial do PC** (v7.102.0, maquete aprovada pelo PPCP em
  25/09/2026). Blocos 1 (hoje), 2 (hora a hora), 3 (mix), 5 (confiabilidade) e
  **4 (período, v7.103.0)**: `_uepAbaPeriodo(dias, n, hoje)` — dias
  FECHADOS com UEP nos últimos n dias corridos (hoje fora), média e bateu pelo
  `uepHistResumo`, oscilação em UEP × caixas de jornada pelo `_qpOscilacao`/
  `_qpRealDia` da aba PLANO. Filtro 7/15/30 (`rpe_uep_per`, padrão 15); o
  histórico vem do `buildDiasHistAsync` (`UEP_HIST`, carregado no setTab).
  - **Ordem ao abrir a aba (`_uepAbaCarregar`, v7.104.0):** `lerPontosDia`
    **só se `PONTOS_DIA.uep` ainda não existe** → histórico → cadastro, em
    sequência. ⚠ Quando falta, a leitura do dia vem PRIMEIRO (v7.127.0): sem
    ela o `renderUep` não desenha bloco nenhum, e ler o histórico antes só
    atrasava a tela. Encadear o histórico atrás de um `getPontosDia` novo deixava os
    blocos 4 e 5 em "Lendo…" por até ~1,5 min; o refresh do gerencial já mantém
    o `PONTOS_DIA` fresco.
  - **Histórico vazio × falha (v7.105.0):** o `lerHistoricoSheets` devolve `[]`
    na falha, e o merge traz só os dias locais (sem UEP) — a aba dizia "nenhum
    dia fechado com UEP" com a planilha cheia. `_uepHistDaPlanilha` (algum dia
    com `fonte:'sheets'`) separa os dois; `_uepAbaHistCarregar` tenta 3× em
    sequência, voo compartilhado, e na falha a tela diz e tenta de novo em
    20 s. Renova a cada 2 min com a aba aberta. Contas puras e testadas no
  `relatorios.test.js`: `_uepAbaHoras`, `_uepAbaMix`, `_uepAbaConf`,
  `_uepAbaProj`; `renderUep` é desenho — quem monta tudo (e chama o `uepCard`,
  mesma régua do card UEP DO DIA) é o `_uepAbaDados` (v7.106.0). Redesenha junto com o `renderGerencial` quando a aba está
  aberta (`_abaOn('uep')`).
  - A confiabilidade separa **medida × estimada** pela vigência (`EST`) do
    cadastro cru `CAP_RAW` — a MESMA leitura do simulador de capacidade
    (`_capBuscar`, que agora guarda o cru e o `uepVig` no `rpe_cap_cat`).
    Cadastro sem `uepVig` (cache antigo) → `null`, nunca uma divisão
    inventada.
  - Hora lançada sem caixa com produto **não vira 0 UEP vermelho**: é falta de
    dado, não de ritmo.
  - Mix e card usam a MESMA base (jornada normal; `_horaEhHE` = janela do
    turno do ⚙, a mesma do `_ehHoraExtraCaixas` do `.gs`).
  - **O mix mostra a HORA EXTRA à parte** (v7.108.0, PPCP: *"deve ter mais
    produtos"*). `_uepAbaMix` devolve `he` (linhas, cx, uep, uepCx) e `dia`
    (jornada + HE); as linhas e a fatia `pct` continuam só da jornada — a
    mesma base da meta. Tela e papel imprimem EM HORA EXTRA + TOTAL DO DIA só
    quando houve HE; o total fecha com as caixas da confiabilidade.
  - **Layout sem buraco** (v7.107.0, PPCP: *"esse espaço no meio ficou
    feio"*): a CONFIABILIDADE (5) mora na coluna do mix (3), as colunas do
    `.uep-2` são flex e o último card de cada uma estica (`.uep-grow`). Se o mix
    for mais alto, o `renderUep` mede a sobra do card do gráfico e redesenha o
    `_uepAbaSvg(horas, w, altura)` para ocupar (teto `UEP_G_H_MAX`=520). ⚠ A
    impressão chama `_uepAbaSvg` sem altura — continua 250.
  - **🖨 IMPRIMIR — versão executiva, DEITADA** (v7.106.0, PPCP 25/09/2026:
    *"impressão com relação a UEPs"* → *"versão executiva"* → *"pode imprimir
    folha deitada"*). `gerarRelatorioUepAba` → `_uepDocHtml(D, ctx)`.
    - **Tela e papel leem a MESMA montagem, `_uepAbaDados()`** (estado +
      cards + horas + mix + conf + período). O teste falha se o `renderUep`
      voltar a montar por conta própria ou se o desenho do papel chamar conta
      (`uepCard`, `efNoRitmo`, `_uepAbaPeriodo`…). O `pctMeta` do período mora
      no `_uepAbaPeriodo` — card e papel leem o mesmo número.
    - **Folha 1 = o resultado**: resumo de hoje e do período lado a lado (só
      o selo), e embaixo de cada um os cards e o gráfico dele. **Folha 2 = o
      porquê**: PRÓXIMOS DIAS (v7.112.0), mix (máx. `UEP_DOC_MIX_MAX`=8, resto
      em "demais") e origem da UEP. ~~folha 3 = ANEXO — COMO LER~~ (saiu na
      v7.181.0, abaixo).
    - **PAPEL ENXUTO, 2 FOLHAS (v7.181.0, PPCP 28/10/2026: *"faz um limpa na
      impressão tem muita informação"* → *"tirar texto"*; ficam todas as seções
      e todos os números).** Saíram o ANEXO, a frase do resumo (repetia os
      cards), as legendas de cor do hora a hora e do período e as notas de
      conta. Ficou numa linha o que é número ou estado: UEP em HE do período,
      o `*` (só com hora que tem caixa sem UEP), a base das % da ORIGEM com o
      *"não cronoanálise"* (confusão documentada na v7.114.0), a troca de
      escala e a linha da base. A régua das horas dos PRÓXIMOS DIAS vai no
      TÍTULO da seção (`.gpx-nota` continua escondida no papel); a nota
      "N cx sem UEP" do mix só sai quando a ORIGEM não lista os códigos de
      hoje (mesma folha). Linhas do mix com padding 3px (era 5): só ar.
      - Medido no Chromium **com as fontes** (pior caso: 11 produtos + HE,
        sem UEP em todo cartão, 7 linhas na lista SEM UEP): v7.180.0 dava **4
        folhas** (o mix já transbordava a folha 2), v7.181.0 dá **2**; 1.370 →
        926 palavras. Sem o padding menor eram 3 (5 linhas do mix na folha 3).
        Mexeu no papel? Medir de novo com as fontes — no popup elas não
        carregam pelo proxy da sessão: copiar o HTML do popup para uma página
        nova (`setContent`) e imprimir dali.
    - Os gráficos são os MESMOS `_uepAbaSvg`/`_uepAbaPerSvg`, a
      `UEP_DOC_SVG_W`=480 (meia folha), re-skinados por token na
      `_UEP_DOC_SKIN` (escopada em `.uep-doc`, o teste confere). No papel a
      hora que bateu sai **grafite** (`.ud-horas{--ok:…}`): cor só em quem não
      bateu, a regra do relatório semanal.
    - **FOLHA 1 EM LINHAS ALINHADAS (v7.192.0, PPCP 03/11/2026, com o print:
      *"alinhar os gráficos, está desalinhado, avaliar a impressão toda"*).**
      Eram duas colunas soltas (`.ud-cols`): hoje = título + cards + título +
      gráfico, período = título + cards + gráfico. Medido: o hora a hora
      começava **41 px abaixo**, com 250 de altura contra 230 e o eixo 12 px
      mais alto (o pé de 40 do "até HH:MM"). Hoje é `.ud-p1`, UMA grade de duas
      colunas preenchida **linha a linha** (títulos · cards · títulos dos
      gráficos · gráficos; `align-items:stretch`): cada linha tem a altura da
      maior. A folha 2 continua em `.ud-cols`.
      - Os dois gráficos com `UEP_DOC_SVG_H`=270 e o MESMO pé:
        `_uepAbaPb(horas)` (40 com hora em andamento, 28 sem) vai ao
        `_uepAbaPerSvg(dias, W, H, pbMin)`, que agora põe o rótulo do eixo X
        pelo pé (`H-pb+19`, igual ao hora a hora). Sem os parâmetros, os
        desenhos da tela e da diretoria são os de sempre (o `pt` do hora a hora
        foi de 22 para 24, o do período).
      - O período ganhou o título **DIA A DIA EM UEP — CONTRA A META DE CADA
        DIA** (a linha do *HORA A HORA EM UEP*). Sem dia fechado: célula vazia,
        nada de título nem gráfico.
      - A **meta** é o token `--uep-meta` (fallback: `--txt` no hora a hora,
        `--acc` no período — a tela não mudou); o papel o define **escuro**
        (`#1F2328`) nos dois. Laranja foi testado e confundia com a barra âmbar.
      - `.kpi-lbl` a 1 px de espaçamento no papel: "UEP EM HORA EXTRA" quebrava
        em duas linhas e o número desse card ficava abaixo dos outros.
      - O ATENÇÃO AO DADO é `.ud-larga` (largura toda, linha própria).
      - Medido (Chromium, fontes, mídia de impressão a 1.032 px): os dois
        gráficos com o mesmo topo e o zero do eixo na mesma linha (manhã com 1
        hora, tarde com 7, pior caso); 2 folhas; folha 1 fecha em ~633 de 718 e
        no pior caso (alerta + 12 dias abaixo + notas nos dois gráficos) em ~683.
        Conteúdo novo na folha 1? Medir de novo — sobra ~35 px no pior caso.
    - ⚠ **O papel NÃO numera as seções** (v7.113.0, PPCP: *"o mix na tela
      está 3 na impressão 5"*): a ordem do papel não é a da aba (o período sobe
      para a folha 1), então os títulos são os NOMES dos blocos da aba, sem o
      número. Não voltar a numerar pela ordem do papel.
    - É o **retrato da tela no clique**: sem chamada nova. Histórico ou
      cadastro que não vieram → a seção diz o que faltou e o resto sai.
- **v7.114.0 / mobile 1.28.0 — leitura, não indicador novo** (prompt de
  evolução do dashboard UEP, plano aprovado pelo PPCP em 25/09/2026).
  - ⚠ **A HORA EM ANDAMENTO NÃO É JULGADA.** `_uepAbaHoras(…, agoraMin)` marca
    `andamento` (sem `cls`, rótulo `até HH:MM`, barra tracejada) e `futuro`.
    Sem `agoraMin` nada muda. Às 14:50 a hora das 14:00 saía vermelha com 244
    contra 288 da hora cheia.
    - **O "até HH:MM" vai numa 2ª linha** do eixo (v7.182.0, PPCP 28/10/2026:
      *"está cortando, sobrepondo"*); a 1ª linha é o INÍCIO, como as outras.
      Numa linha só, num dia de 11 horas (madrugada) a coluna do papel (480 de
      largura) tem ~39 e o "até 16:35" ~54: caía em cima do "15:00". Com hora
      em andamento o `pb` do `_uepAbaSvg` vai de 28 a 40; sem ela, nada muda.
      Rótulo novo no eixo de um gráfico com coluna estreita? Conferir no papel.
    - **A grade do eixo tem passos iguais** (`_eixoGrade(mx, 5)`, v7.182.0,
      PPCP: *"faz escala"*): o menor passo redondo (`EIXO_PASSOS`) que cabe em
      até 5 intervalos. Era cada quarto do máximo arredondado a 50 — com pico
      de 398 saía 0, 100, 250, 350, 450.
  - ⚠ **O ESPERADO DA UEP CONTA SÓ O MINUTO QUE PASSOU**: `minSlotDecorrido`
    (rp-core) nos DOIS `calcKPIs` alimenta o `minNorm` — card UEP DO DIA (PC e
    celular), aba UEP, projeção e PRÓXIMOS DIAS. ~~⚠ O `hProd`/`efRitmo` (selo em
    CAIXAS) **não** foi mexido — continua contando a hora corrente inteira; a
    mudança foi aprovada só para a UEP.~~ — o plano aprovado em 25/09 era só da
    UEP; **desde a v7.265.0 / mobile 1.59.0 o `efRitmo` (selo em caixas) usa o
    mesmo `minNorm`** (17/11/2026: a TV dizia ABAIXO DO RITMO com "1.188 DE 1.350
    CX ESPERADAS" às 16:22, cobrando a hora 16:00 inteira — ver *A TV SEM A HORA
    EXTRA* em `hora-extra-e-meta.md`). O `hProd` (HORAS PRODUTIVAS) segue com as
    horas inteiras.
  - **CONFIABILIDADE virou ORIGEM DA UEP** (`UEP_ORIGEM_T`): "medida" = estudo
    ou digitada, não cronoanálise. ~~Numeração da tela na ordem em que aparece:
    1 hoje · 2 hora a hora · 3 mix · 4 origem · 5 período · 6 próximos dias~~ —
    desde a v7.198.0 a aba é em sub-abas e os títulos não têm número.
  - Cards: desvio escrito no UEP ATÉ AGORA (do mesmo `esperado`), projeção "na
    média da jornada até agora · só jornada normal", HE "fora do UEP até agora,
    da projeção e da meta". Barras do mix neutras.
  - ~~**Sábado na UEP fica como está**~~ — desde o `.gs` v5.68 / v7.248.0 o
    sábado e o domingo são hora extra o dia inteiro, sem meta (ver *SÁBADO E
    DOMINGO SÃO HORA EXTRA O DIA INTEIRO*; a v5.60 tinha dado a eles a meta das
    horas de jornada).
  - **Maquete do ChatGPT recusada em conteúdo**: projeção somando HE, "meta do
    período", "vs período anterior" e "% do total do dia" não existem aqui.
- O `_mixFator` da carteira é a mesma ideia com âncora na média da linha e
  chave por modelo de 6 dígitos; quando a UEP virar cadastro, é ele que deve
  passar a ler dali — não criar uma segunda régua de esforço.

## UEP PADRÃO VERSIONADA, TRAVA DO GRAVAR E PADRÃO × REALIZADO (v7.133.0 / `.gs` v5.24)
- PPCP, 16/10/2026, perguntando se a UEP gravada mudava sozinha: *"não pode
  alterar sozinha sem autorização"*, *"montar histórico de produto comparando a
  uep padrão e ver no dia se cumpriu a padrão ou teve alteração"* e *"a uep que
  está hoje tornar padrão"*.
- **O que já era verdade (conferido no código):** a UEP gravada no `HISTORICO`
  é calculada **uma vez**, no fechamento (`_uepColsDoDia`), e nada a reescreve
  sozinho — o FECHAR DIA só vale para hoje e o `regravarUepPassada` é manual.
  O que muda com o período é a **UEP DO ESTUDO**, por construção. O furo era
  outro: o **cadastro** não guardava a UEP anterior, e o GRAVAR passava por cima
  de tudo, inclusive da UEP digitada à mão.
- **Aba `UEP_VERSOES` (só acréscimo)**: `CODIGO · UEP · VIGENCIA · ORIGEM ·
  GRAVADO_EM · ANTERIOR`. Toda mudança de valor vira linha: GRAVAR UEP
  (`GRAVAR UEP`), estimativa (`GRAVAR UEP · EST`) e digitação na coluna UEP da
  `PRODUTO_CODIGO` (`DIGITADA`, pelo `onEdit` → `_uepVerDaEdicao`).
  - **A 1ª mudança cria a aba com a SEMENTE**: o cadastro como estava ANTES
    dela, **vigência vazia = vale desde sempre**, ORIGEM `PADRÃO INICIAL ·
    cadastro <vigência antiga>`. É a "UEP de hoje vira a padrão". Sem a aba
    (nada mudou desde o re-deploy), o cadastro é a única versão.
  - Só entra o que **mudou** (duas casas, `_uepIgual`). Regravar o mesmo número
    não cria linha nem mexe na vigência.
  - `_uepVigente(lista, dia, cadastro)`: no dia vale a última versão com
    vigência ≤ dia; antes da 1ª versão de um código vale a 1ª (`antes`).
  - CODIGO e VIGENCIA são gravados como **texto** (`setNumberFormat('@')`); a
    UEP fica número — texto "1.25" leria como milhar no `_numBR`.
  - A versão é gravada **depois** do cadastro; se falhar, o retorno traz
    `versaoErro` e o painel avisa *"A MUDANÇA NÃO FICOU REGISTRADA"*. O
    `onEdit` engole a falha (não pode travar a edição) e loga.
  - `getProducaoModeloPeriodo` com `?uepVer=1` devolve `uepVer.diverge`:
    códigos cujo cadastro de hoje não bate com a última versão — mudança que
    escapou do registro. O bloco 7 mostra o aviso.
  - Corrigir uma vigência lançada errada é editar a célula da aba, à mão.
- **TRAVA no GRAVAR UEP** (`_gravarUepCadastro`): três passos.
  1. **Simular** (`simularUepCatalogo`, ação PRÓPRIA): a mesma conta do
     `setUepCatalogo`, sem gravar e sem criar coluna; devolve `novos`, `deEst`,
     `iguais`, `existentes` (antes → depois) e os códigos que este passo
     grava (`escritosCod`), para descontar da simulação da estimativa.
     ⚠ **Ação própria de propósito**: o `.gs` antigo não conhece a ação, cai no
     `getDados` e NÃO grava. Um parâmetro `simular` seria ignorado lá e
     **gravaria**. Sem `simulado:true` na resposta o painel para e pede o
     re-deploy — o botão não grava nada antes do `.gs` v5.24.
  2. **Autorizar**: o 1º confirm diz o que muda; UEP que JÁ EXISTE (medida ou
     digitada — não `EST`) só troca com um **2º OK** (`_uepTravaTxt`, lista
     antes → depois, maior mudança primeiro). Cancelar no 2º = mantém as atuais
     e grava só o resto.
  3. **Gravar** com `substituir=1|0`. No `.gs`, sem `substituir=1` a UEP
     existente fica (`protegidos`). `_simular` é booleano — pela URL só chega
     texto, então a simulação não se liga de fora.
  - A estimativa (EST) continua sem trava própria: ela só toca vazia ou `EST`
    — e o confirm diz quantas recebem e quantas são re-estimadas.
- **Bloco 7 da aba ⚖ UEP — PADRÃO × REALIZADO POR PRODUTO** (`_uepPadHist`
  conta, `_uepPadHtml` desenho, `_uepPadCarregar` leitura). Dias fechados
  (hoje fora), 15/30/60 dias (`rpe_uep_pad_per`, padrão 30).
  - **Padrão** = ritmo da META: META UEP do dia ÷ 527 min (~288 UEP/h). Em
    caixas, 288 ÷ UEP por caixa. A META é a **gravada no HISTORICO** daquele
    dia (`uepDiaMeta`); a do ⚙ só vale para dia que não está lá.
  - A UEP de cada caixa vem pronta do `.gs` pela **padrão vigente na data**
    (`uepHora`): mudar o cadastro amanhã não muda o dia de hoje.
  - **Hora com troca** é repartida pelo **tempo padrão** (UEP de cada
    produto) — mesma ideia do estudo, com o padrão no lugar do ritmo em
    regime. Consequência honesta: na hora dividida os dois saem com o MESMO %.
    Hora com caixa de código sem UEP sai da conta dos produtos dela.
  - **Faixa 90–110%** (decisão do PPCP): ABAIXO · NO PADRÃO · ACIMA (acima é
    alerta — UEP alta demais ou apontamento). **Menos de 2 h** somadas no dia
    (`UEP_PAD_MIN_MIN`=120) não é julgado: 1 hora é quase toda borda (80 cx
    numa hora de início de rodada saíam ABAIXO, 27,8%).
  - ⚠ **Ponto flutuante**: `60 × u ÷ u` pode dar 59,999… e o dia de 2 h exatas
    caía fora. Hora de um produto só leva o slot inteiro, e a comparação tem
    folga de 1e-6. O teste usa 286,52, que reproduz.
  - **% do período** = Σ UEP feita ÷ Σ UEP pedida nos dias julgados, nunca
    média de %.
  - **PADRÃO ALTERADO**: a vigência mais nova entre os códigos do produto
    (`uepVigDe`) mudou em relação ao dia anterior em que ele rodou.
  - **Custo**: UMA leitura (`getProducaoModeloPeriodo&cxHora=1&uepVer=1`), a
    última da fila do `_uepAbaCarregar`, cache de 15 min, voo compartilhado, 3
    tentativas; falhou → nova tentativa em 1 min. A chave do cache do `.gs`
    inclui `uepVer`. Sem `?uepVer=1` o payload do comparativo não muda.
  - Não vai na impressão executiva da aba nem na TV/app.
  - **Colunas alinhadas e impressão dedicada (v7.134.0, PPCP 16/10/2026:
    *"alinhar as colunas, colocar impressão dedicada"*).** As larguras moram em
    `UEP_PAD_COLS` (11 colunas, % da tabela, `table-layout:fixed`) e o selo do
    último dia tem **largura fixa** — antes a data andava em zigue-zague porque
    NO PADRÃO é mais largo que ACIMA. O dia a dia aberto usa **as mesmas 11
    colunas** do resumo, com uma linha de rótulos própria (`uep-pad-dh`): o
    UEP/CX, o CX/H PADRÃO e o % do dia ficam embaixo dos do produto, e o CX/H do
    dia ao lado do CX/H PADRÃO. Antes era uma tabela dentro da célula.
  - **As células são UMA implementação** (`_uepPadCelsProd`, `_uepPadDiasRows`,
    `_uepPadThead`, `_uepPadColgroup`, `_uepPadNotas`): a tela (`_uepPadHtml`)
    e o papel (`_uepPadDocHtml`) mudam só a moldura e a pele. 🖨 IMPRIMIR (no
    menu 🖨 IMPRIMIR ▾ da aba desde a v7.198.0) → `gerarRelatorioUepPadrao`: retrato da tela (os MESMOS
    `UEP_PAD` e `_uepPadMontar`, sem leitura nova), **deitado** (11 colunas),
    pele `_UEP_PAD_DOC_SKIN` escopada em `.pad-doc`. Folha 1: totais
    (`H.tot`, produto × dia) e o resumo; depois o dia a dia de **todos** os
    produtos julgados e o COMO O NÚMERO SAI.
  - **A LINHA DO PRODUTO NA RÉGUA DE HOJE (v7.206.0, PPCP 05/11/2026, com a
    sub-aba POR PRODUTO: *"como interpretar?"* → *"sim"*).** UEP/CX, CX/H
    PADRÃO e TAKT da linha saíam do ÚLTIMO dia em que o produto rodou, com a
    meta daquele dia: a MADERO (28/10) lia 314 cx/h na meta de 2.761 e o RACK
    FLIP 1.8 (26/10) 135 na de 2.530 — duas réguas na mesma coluna, e a UEP de
    antes das trocas de 04/11. Hoje: UEP/CX = o `uepProd` da MESMA leitura
    (`UEP_PAD.uepProd`, 5º parâmetro do `_uepPadHist`: cadastro de agora, média
    pelas caixas do período — a UEP/CX do comparativo por modelo); meta = a do
    ⚙ (`PONTOS_DIA.metaUep`; sem ela, a última META UEP gravada no
    `UEP_HIST`). Sem UEP hoje → "—", nunca a do último dia.
    - **O % e o dia a dia não mudaram**: cada dia com a UEP e a meta dele.
    - **"% com X"** embaixo da UEP/CX (`uepJul`, `.uep-pad-jul`): a UEP com que
      o % foi feito (Σ UEP ÷ Σ cx dos dias julgados), só quando a UEP de hoje
      difere em `UEP_PAD_MUDOU`=1% ou mais da que valeu no período **nas
      mesmas caixas** (toda caixa com UEP, todos os dias — a base do
      `uepProd`). Comparar com os dias julgados acusaria troca à toa no produto
      de dois volumes (outro mix de volumes, a mesma UEP) — o teste prende.
    - `UEP_PAD_COLS` = [6,18,7,7,…]: a UEP/CX ganhou 1% do PRODUTO para o "%
      com" caber. Medido no Chromium com as fontes: 1920 e 1366 e A4 deitada
      (1.032 px), nada passa da célula; a linha com o aviso fica 11 px mais
      alta na tela.
- ⚠ Mudou o `.gs` → **re-deploy manual**. Antes dele o GRAVAR UEP para com o
  aviso de re-deploy (não grava nada) e o bloco 7 diz que o backend não manda a
  UEP por data. Nada no `HISTORICO` muda.
- **O 1º GRAVAR com a trava, medido na planilha (16/10/2026 10:43):** a aba
  `UEP_VERSOES` nasceu com 429 linhas de semente e 296 mudanças — **196 UEP
  medidas SUBSTITUÍDAS** (o 2º OK foi dado; mediana −18%, de −53% a +130%) e
  98 estimadas re-estimadas (todas −19%, o fator `k` mudou). Refazendo os 20
  dias fechados de 16/09 a 15/10 com a MESMA produção (jornada): **2.804 →
  2.199 UEP/dia (−21,6%)**, oscilação **12,3% → 7,4%** (dentro da amostra:
  otimista), dias ≥ 2.530: **16 → 2**. O "antes" recalculado bate com a UEP
  gravada no HISTORICO (15/10: 2.987 × 2.986,5). Com a escala nova, a META UEP
  de 2.530 deixou de ser a mesma régua: a equivalente é **~1.984** e a faixa
  p50–p60 da escala nova, **~2.180–2.210**. O confirm mostrava o antes →
  depois por código e não o efeito na UEP da linha nem na meta — foi assim que
  a troca de escala de −21,6% passou. **Resolvido na v7.135.0** (abaixo).
- **EFEITO NA UEP DA LINHA no confirm do GRAVAR** (v7.135.0, só tela, sem
  re-deploy). `_uepImpacto` (conta pura) relê a MESMA produção do período do
  estudo (só jornada, hoje fora) com a UEP do cadastro (antes) e com a que o
  estudo grava (depois): média UEP/dia antes → depois, **escala** (só caixas
  com UEP antes E depois — caixa que só ganha UEP é cobertura, contada à
  parte), dias na meta antes → depois e a **meta equivalente**
  (meta × depois ÷ antes). `_uepImpactoTxt` é o texto ÚNICO do 1º passo; o 2º
  passo repete a escala antes do SUBSTITUIR; o alerta final pede o ajuste da
  meta no ⚙ quando o efeito inteiro entrou. `UEP_IMP_ALERTA`=5%: abaixo disso
  diz que a meta continua valendo.
  - O **antes** é o `uepProd` DA PRÓPRIA LEITURA do estudo (`_uepCache.uepProd`).
    O `PH_UEP_PROD` global é de quem leu por último — o bloco 7 lê 30 dias, o
    comparativo outro período — e o efeito sairia de outra produção.
  - O **depois** é a UEP/cx do produto: o `.gs` reparte o jogo entre os volumes
    sem mudar o total, então a média por caixa do produto é ela. A estimativa
    do resto do cadastro fica fora (toca produto que não rodou no período).
  - Sem o `uepProd` da leitura, o confirm **diz** "não calculado" — nunca um
    número inventado.
- **O PASSADO FOI TESTE — decisão do PPCP, 16/10/2026** (*"o importante é
  daqui para frente usar a padrão, até agora são testes"*). Por isso a
  conversão automática dos dias de escala antiga (UEP × meta de hoje ÷ meta do
  dia, na régua da aba PLANO, na faixa do estudo e na média do bloco 5) **não
  foi feita**: era aproximada (dependia de a meta acompanhar a escala) e ficaria
  no código para sempre. O caminho é pôr o histórico na régua padrão UMA vez,
  pelo editor:
  1. ⚙ META DIA (UEP) com a meta nova (recomendada **2.100**, a neutra) e
     salvar — o `regravarUepPassada` grava a meta ATUAL em todos os dias;
  2. renomear a aba `UEP_VERSOES` (ex.: `UEP_VERSOES_TESTE`) — sem ela o
     cadastro de hoje vale para todas as datas e o bloco 7 lê o passado na mesma
     régua que o HISTORICO regravado. A próxima mudança cria a semente nova;
  3. editor → `regravarUepPassada` → Executar.
  - ⚠ Sem o passo 2, o bloco 7 leria o passado com a semente (escala antiga)
    contra a meta nova — dias de setembro sairiam ACIMA do padrão.
  - ⚠ Dia sem lançamento com produto no log fica como estava (o log do editor
    conta quantos: `sem lançamento com produto no log`).
  - Mudar de escala DE NOVO no futuro traz o mesmo problema de volta. A saída é
    a mesma (regravar), e é por isso que o confirm agora mostra a escala.
- **BASE FIXA: MESA CABECEIRA MADERO (v7.136.0, PPCP 16/10/2026: *"a base
  tem que ser um só"*).** A âncora A do estudo era escolhida sozinha a cada
  período (o maior volume abaixo de 90% do teto). No GRAVAR de 16/10 10:43 ela
  virou o KIT 2 MESA CABECEIRA SLEEP: 64 grupos foram para a escala nova e os
  44 que não rodaram no período ficaram na da MADERO — **duas escalas no mesmo
  cadastro**, ~22% de diferença. Ex. da aba: 1,72 → 1,41 num código que só
  mudou de régua.
  - `UEP_BASE = {modelo:'501149', nome:'MESA CABECEIRA MADERO'}` e
    `_uepEhBase(p)` (modelo + nome do `produtoDoCodigo().base`, sem VOL e sem
    cor; a caixa e o espaço não importam). Com a base no período, **ela é a
    `volume`** do `_uepEstudo` mesmo sem ser o maior volume, e o `foraTeto`
    fica vazio. Sem ela, a automática continua — só para LER — e o estudo
    devolve `baseFixa:false`.
  - **O GRAVAR exige `e.baseOk`** (a base com `UEP_MIN_DIAS`+ dias **e
    abaixo de `UEP_ANCORA_TETO_MAX`% do teto**), ANTES de simular; o aviso é o
    `_uepBaseFaltaTxt` (diz qual dos dois motivos). Base de 3 dias não grava:
    UEP de todos medida contra uma base provisória mudaria no próximo GRAVAR.
  - **Base no limite da esteira continua sendo a A do estudo, mas não grava**
    (`baseNoTeto`). Medido na planilha real (revisão de 16/10/2026): em
    01/09–15/10 a MADERO deu 343,8 cx/h (cor OFF WHITE/CINAMOMO, 8 h sozinha)
    contra teto de 333 — ritmo cortado no teto, escala 15,6% acima da de
    01/07–15/10 (288 cx/h, 86,5%, 12 dias). Gravar ali faria de novo duas
    escalas. A regra antiga (âncora só abaixo de 90%) garantia isso por
    construção; a base fixa precisa da trava.
  - ⚠ **O teste de sanidade NÃO usa o teto da própria base** (`ref`, no
    `_uepEstudo`): é o teto da âncora AUTOMÁTICA (garantida abaixo de 90%)
    convertido para a escala da base, `tRef × volume.ritmo ÷ ref.ritmo`. Com o
    teto da base, a base no limite deixava a régua sem folga — 17 de 30 dias
    suspeitos em 01/09–15/10, contra 0 da regra anterior. A conversão mantém
    EXATAMENTE a classificação de antes, e a UEP gravada não lê a sanidade.
  - ~~A coluna **B** (mais rápido) ficou só para comparar~~ — **saiu na
    v7.137.0**: o PPCP leu o 1,00 da SLEEP e o 1,20 da MADERO na coluna B como
    UEP gravada. O estudo mostra UMA UEP/CX (a da base). O `rapido`/`uepRap`
    continuam calculados (os testes de proporção leem), só não são desenhados;
    o teste falha se a coluna voltar.
  - **Cancelar no 2º passo do GRAVAR na migração deixa duas escalas**: os
    protegidos ficam na anterior, os novos e as estimadas vão para a da base.
    O t2 diz isso quando a escala muda ≥ `UEP_IMP_ALERTA`, e o alerta final
    repete. ⚠ Não bloquear a estimativa por causa disso: ela está certa na
    escala da base, e bloquear deixaria mais códigos na escala errada.
  - ⚠ **Trocar a base troca a escala inteira**: é regravar o cadastro todo,
    mudar a meta e regravar o HISTORICO. Não mexer na constante sem isso.
  - Para sair das duas escalas: um GRAVAR com o período **mais longo** (01/07
    até hoje) com **OK no SUBSTITUIR**, ajustar a META DIA (UEP) pela meta
    equivalente do confirm, renomear a `UEP_VERSOES` nova e rodar o
    `regravarUepPassada`.
    - ⚠ **Por que renomear a aba que o próprio GRAVAR criou**: sem a
      `UEP_VERSOES` (renomeada para `UEP_VERSOES_TESTE`), o `setUepCatalogo`
      cria a aba com a SEMENTE = o cadastro de ANTES do GRAVAR (o misto), com
      vigência vazia — e o `_uepVigente` leria todo dia até ontem nessa escala
      misturada no bloco 7. O `regravarUepPassada` usa o cadastro atual, não as
      versões: sem renomear, HISTÓRICO e bloco 7 discordariam.
    - ⚠ Em 16/10/2026 a `CONFIG_PAINEL` estava com **META_UEP 2.300**, mas o
      HISTÓRICO foi regravado com **2.100**: a meta equivalente do confirm sai
      da que está no ⚙ na hora do GRAVAR — conferir qual vale antes.
  - **Feito em 16/10/2026, 13:26–13:3x** (conferido na planilha): GRAVAR com
    01/07–16/10 e SUBSTITUIR → 217 medidas + 98 estimadas regravadas, nenhum
    código ficou na escala do KIT; cadastro vs semente de 25/09: mediana 1,00.
    `UEP_VERSOES` nova renomeada para `UEP_VERSOES_TESTE3`; `regravarUepPassada`
    com o ⚙ em **2.530**. ⚠ A "meta equivalente" do confirm (~2.430, sobre
    01/07–15/10) NÃO era a certa: os 2.100 tinham sido escolhidos sobre os
    últimos 20 dias (15 de 20 batendo), e na régua nova quem repete isso é
    2.530. Meta equivalente depende do período em que a meta foi calibrada.
- **UEP TRAVADA desde 16/10/2026 (v7.137.0, PPCP: *"não vamos alterar mais
  nada, trava as UEP como está, depois só com a cronoanálise"*).**
  `UEP_TRAVADA_DESDE='16/10/2026'`: o `_gravarUepCadastro` para na 1ª linha
  (`_uepTravadaTxt`), antes de ler o período — nada é simulado nem gravado,
  nem a estimativa EST. O botão é **🔒 UEP TRAVADA** (`_uepBotao`).
  - **O caminho que fica é a DIGITAÇÃO**: o valor da cronoanálise é digitado
    na coluna UEP da `PRODUTO_CODIGO` e vira versão `DIGITADA` na
    `UEP_VERSOES` (`onEdit` → `_uepVerDaEdicao`). Nada no `.gs` mudou: a trava
    é do painel (o único que chama o `setUepCatalogo`).
    Desde a v7.158.0 há também o **✓ TROCAR A UEP** da aba ⏱ CRONOANÁLISE
    (`trocarUepCrono`): é cronoanálise, não estudo pelo ritmo — a trava do
    GRAVAR UEP continua. Ver *TROCAR A UEP PELA CRONOANÁLISE*.
  - ⚠ **Produto novo fica SEM UEP** até ser digitado — a estimativa pela
    esteira também está travada. Ele aparece na lista SEM UEP da aba ⚖ UEP.
  - **A base aparece na aba ⚖ UEP** (bloco ORIGEM DA UEP, tela e papel):
    `_uepBaseLinha(D.base)`, com `_uepBaseNoCadastro(CAP_RAW)` conferindo se os
    códigos da MADERO estão em 1,00 no cadastro (avisa se alguém digitar outro
    valor — mudar a base muda a escala de tudo).
  - ⚠ **Destravar é decisão do PPCP, não ajuste** (`UEP_TRAVADA_DESDE=null`):
    um GRAVAR mede contra o ritmo do período e mexe na escala. Não propor
    regravar a UEP pelo ritmo enquanto a cronoanálise não vier.

## PADRÃO DE UEP — base MADERO, e não se mexe mais (v7.152.0 / mobile 1.36.0 / `.gs` v5.31)
- PPCP, 21/10/2026, com a planilha de programação na mão: *"está virando uma
  loucura, vamos colocar a bola no chão"*, *"não bate com a planilha"* →
  *"temos que definir o padrão e não mexer mais"* → *"fecha"*.
- **Por que não batia** (conferido dia a dia, 22–29/10): a planilha do PPCP
  (`PLANILHA PRODUÇÃO SEM COR - 2026.xlsx`, abas da semana com `UEP UNIT.` e
  `UEP DIA` por lote = QTDE × UEP do produto) está na **base MADERO** — a aba
  UEP dela é o cadastro de 16/10. O painel estava na base SLEEP (÷0,83 =
  ×1,205): 22, 26, 28 e 29/10 batiam com planilha ÷ 0,83. 23/10 +372: PUFF
  EVORA com UEP estimada no cadastro (1,86) e SEM ESTUDO na planilha. 27/10
  −260: a MADERO digitada 1,00 no cadastro às 07:35 de 21/10 (duas réguas).
- **O PADRÃO:**
  1. base MESA CABECEIRA MADERO = 1,00 UEP/cx; meta 2.530 na jornada normal;
  2. UEP de cada código = a do cadastro; a aba UEP da planilha é cópia dele;
  3. só muda por cronoanálise — ~~duas medições em dias diferentes~~ ~~30
     volumes, todas do mesmo lado (v7.158.0)~~ desde a v7.233.0 **a regra da
     TRAVA DA UEP**: medição válida (30+ volumes, lacunas até 15%), 2 válidas
     somando 100 volumes, a média **sem as lacunas, contra a MADERO sem as
     lacunas (6,7 s)**, e **o PPCP troca (ou mantém) e trava**, com o código
     dele — e na planilha no mesmo dia. Nunca trocar de base nem recalcular
     pelo ritmo (UEP TRAVADA segue);
  4. o passado não se regrava (esta volta foi a última exceção);
  5. produto novo entra com a estimada nos dois lugares, marcado.
- Código: `UEP_BASE` MADERO, `UEP_META_PADRAO`/`UEP_META_PADRAO_GS` 2530,
  `UEP_BASE_MEDIDA` = MADERO 7,9 s / sem lacunas 6,7 s / `periodo:null` (o NO
  PERÍODO não veio legível — o quadro mostra o cartão sem número).
- Planilha (feito em 21/10/2026 de manhã, pela API e sem `onEdit` — que carimbaria
  `DIGITADA` em 429
  códigos e os tiraria todos da FILA): cadastro × 0,83 (MADERO = 1), META_UEP
  2.530, HISTORICO 03/07–20/10 UEP e UEP HE × 0,83 e META UEP 2.530, e a aba
  `UEP_VERSOES` (criada pela digitação da MADERO em 21/10) renomeada para
  `UEP_VERSOES_TESTE4`. ⚠ Fórmula pela API nesta planilha vai em pt-BR
  (`;` e vírgula decimal) — com `,` dá `#ERROR!`. O método: fórmula numa coluna
  auxiliar (repeatCell), conferir, `copyPaste` PASTE_VALUES por cima, limpar a
  auxiliar — nada é transcrito à mão. Conferido: 16/10 3.754 → 3.115,8, o valor
  de antes de 19/10.
- Em aberto: SLEEP 0,83 no cadastro × 1,00 medido (2ª medição); PUFF EVORA
  1,54 a entrar na aba UEP da planilha.
- A seção abaixo (base SLEEP) fica como registro — **DESFEITA**.

## ~~BASE DA UEP = MESA CABECEIRA SLEEP~~ (v7.143.0 / mobile 1.35.0 / `.gs` v5.28) — DESFEITA na v7.152.0
- PPCP, 19/10/2026: *"hoje o melhor produto é MESA CABECEIRA SLEEP"*, *"20 mil
  caixas no histórico"* → escolheu trocar a base (recomendação dada: manter a
  MADERO e usar a SLEEP como referência de trabalho — recusada).
- **Foi TROCA DE UNIDADE, não medição nova**: tudo ÷ 0,83 (a UEP da SLEEP na
  base MADERO). Gravado na planilha em 19/10 pelo Claude (API do Sheets, sem
  `onEdit`): coluna UEP da PRODUTO_CODIGO (429 códigos, 2 casas, vigência
  intocada), **META_UEP 2.530 → 3.048**, e HISTORICO de 03/07 a 16/10: UEP e UEP
  HE ÷ 0,83 (1 casa) e META UEP 3.048. Proporções e vereditos iguais; 16/10:
  3.115,8 de 2.530 → 3.754 de 3.048 (123%).
  - `UEP_BASE = { modelo:'501094', nome:'MESA CABECEIRA SLEEP' }`;
    `UEP_META_PADRAO` (rp-core) e `UEP_META_PADRAO_GS` = **3048**. Régua da meta:
    527 × 60 ÷ 3.048 = **10,4 s por UEP**; meta da hora ~347.
  - Não havia aba `UEP_VERSOES` (só a `_TESTE3`): o cadastro é a única versão,
    vale para todas as datas. A próxima digitação cria a aba com a semente já
    na escala SLEEP.
  - A base sai da FILA DE CRONOANÁLISE (`_uepEhBase` no `_filaCronoMontar`): a
    SLEEP era NO LIMITE DA ESTEIRA na escala antiga.
  - ⚠ **A dúvida do 0,83 mudou de lugar, não sumiu**: ele vinha do limite da
    esteira. Na base nova a MADERO ficou 1,20; pelo passo da esteira (881 × 825
    mm + vão) daria ~1,04. Corrige-se cronometrando com a linha rodando contra a
    SLEEP (⏱ CRONOANÁLISE → UEP), produto a produto.
  - As notas antigas deste arquivo com "2.530", "12,5 s", "288 UEP/h" e "base
    MADERO" são da escala anterior: multiplique por 1/0,83 para ler na atual.
  - ⚠ Trocar a base DE NOVO é o mesmo trabalho: cadastro, META_UEP, HISTORICO
    (e as versões, se a `UEP_VERSOES` existir) pelo mesmo fator, junto com o
    `UEP_BASE` e as duas constantes de meta.
- **⏱ CRONOANÁLISE → UEP, tempo RODANDO** (PPCP: *"as paradas são evitáveis se
  ajustar"*): parada evitável não é esforço do produto. O certo é a base e o
  produto com a linha rodando; sem a base cronometrada, a régua da meta (com as
  paradas dentro) obriga o tempo do período — remendo. `_uepConvGuia` é o texto
  único dessa orientação (`#uep-conv-guia`); base digitada mais lenta que a
  régua da meta = `base.suspeita` (aviso). Nomes da base sempre pelo
  `UEP_BASE` (`_uepBaseCurto`), nunca escritos à mão.
  - **📌 FIXAR SLEEP** (v7.143.1, PPCP: *"deixa um botão para fixar sleep"*):
    `_uepConvFixar` (puro) decide — base no PRODUTO + tempo → `fixar` (vai para
    o campo da base, que é guardado); senão → `escolher` (põe a base no
    PRODUTO). O Tab que volta ao PRODUTO passou para o botão (último foco).
    Placeholder do campo da base = *"meta 10,4"*: sem o *meta*, o PPCP leu o
    valor em uso como exemplo. ⚠ Rótulo dentro do `<label>` flex em coluna vai
    num `<span>` só — texto solto ao lado de outro span vira uma linha cada.
  - **v7.143.2**: lista **por volume** (PPCP: *"tenho que ver qual volume
    é"*) — produto de N volumes entra inteiro e uma linha por volume
    (`volSel`, códigos com `vol:1` e `volOrig`); código de 9 dígitos casa com o
    VOLUME, o nome com o produto inteiro. O campo da base **mostra** a base em
    uso: vazio recebe a régua da meta (`dataset.auto`, não grava, segue o ⚙;
    nunca enquanto o campo tem o foco). Base digitada a até 1% da régua
    (`UEP_CONV_TOL_META`) É a régua da meta: o 10,4 digitado acusava "não
    parece a SLEEP rodando" por 0,3% de arredondamento.
  - **v7.144.0 — ABA PRÓPRIA `#sec-crono`** (PPCP: *"colocar uma tela separada
    para isso"*), depois da ⚖ UEP. Mesmos ids e funções; a pele foi de
    `#sec-uep .uep-conv*` para `#sec-crono .uep-conv*` (`.uep-card`/`.uep-nota`
    valem nas duas). Abrir a aba: `_uepConvAtualiza()` + `_uepAbaCatCarregar()`
    (só o cadastro); o `_capBuscar` redesenha a aba quando o cadastro chega. O
    `renderUep` não chama mais o conversor. A aba UEP aponta para cá (botão) e
    a 🖨 FILA DE CRONOANÁLISE abre das duas.
  - **v7.144.1 — visual** (PPCP: *"modernize somente a tela"*, com maquete do
    ChatGPT como referência). Só pele e marcação desta aba: regras `#sec-crono`
    (inclui `--ucv-azul` local), classes `ucv-*`; o `#uep-conv-res` saiu do
    cartão dos campos. Mantidos: os quatro cartões (a maquete tinha dois), os
    textos, ids, botões e contas. ⚠ Da maquete NÃO entrou o botão "Registrar
    medição" (nada é gravado; a UEP muda só digitada no cadastro) nem os campos
    embaixo do resultado (calculadora: entrada em cima).
  - **v7.145.0 — 🖨 IMPRIMIR** (PPCP: *"falta impressão"*):
    `gerarRelatorioCrono` → `_uepConvDocHtml(R, ctx)` = `_uepConvHtml(R)` +
    `_uepConvGuia` + REGISTRO DA MEDIÇÃO (`UCV_REG_CAMPOS`, linhas para a
    caneta, com a VELOCIDADE DA ESTEIRA por causa da base no limite) + rodapé.
    Mesma marcação da tela, pele `_UCV_DOC_SKIN` escopada em `.ucv-doc` (o
    VOLTAR À RÉGUA DA META some no papel). `_rpDocParadas` em PÉ — agora 14
    usuários (o teste conta), `_rpCabecalho` 18 chamadas, rodapé `APP_NOME_CX`
    12. Retrato da tela no clique: mesmas entradas do `_uepConvAtualiza`,
    nenhuma leitura, janela aberta no clique; estado não-ok avisa e não abre.
    `<title>` sem `/` e `:` (`_uepConvDocTitulo`). Medido no Chromium: A4 em pé,
    1 página nos casos ok, troca com 2 volumes, base digitada e a própria base.
  - ⚠ **Revisão adversarial da v7.145.0 (3 lentes + cético por achado)**
    confirmou 3 e refutou 3. Corrigidos: (1) as ENTRADAS são lidas por UMA
    função, `_uepConvEntradas()` (tela e papel; teste conta 2 chamadores) — o
    papel lia o campo da base cru, e o campo automático só acompanha a meta
    quando a aba redesenha: com a meta mudada pelo ⚙ ou pelo refresh, saía
    "BASE DIGITADA" com a régua velha. O 🖨 chama `_uepConvAtualiza()` antes,
    para a tela ficar com o mesmo retrato. (2) "clique em 📌 FIXAR" é
    `.so-tela`; o papel leva a `.so-papel` (`#sec-crono .so-papel{display:none}`
    na tela — regra própria, não junto da de perdas/simulador, que o teste
    prende como está). (3) o teste das entradas roda a função real num DOM de
    mentira (conferido por mutação: volta o defeito, o teste cai).
  - **v7.146.0 — TOLERÂNCIA (%)** (PPCP: *"fadiga e movimentação 15%"* →
    *"15% iguais para todos"*). `UEP_CONV_TOL_PADRAO`=15, campo `#uep-conv-tol`
    (à vista, guardado em `rpe_uep_conv_tol`; 0 é zero). Tempo padrão = medido ×
    `base.tolFator`, no produto (`R.tpSeg`) e na base (`base.tpSeg`). ⚠ **A UEP
    continua `s ÷ base`**: a MESMA tolerância nos dois se cancela — o teste roda
    0/15/30% e exige a mesma UEP. Só aplica com a base DIGITADA (rodando): a
    régua da meta já tem fadiga e paradas dentro (`tolAplica`=false, a linha
    TOLERÂNCIA explica). Se um dia a tolerância for POR PRODUTO (fadiga por
    peso — o cadastro tem P B), aí ela muda a UEP e a conta tem de mudar junto.
    O "prevê X s" do NO CADASTRO segue em tempo rodando (cru × cru).
    - ⚠ **O 8,7 s dos testes e das notas NÃO é medição** — e nem é da SLEEP. Saiu
      de uma estimativa do Claude em 19/10 para a MADERO (base antiga) no
      limite da esteira: caixa + vão de ~420 mm ÷ 9 m/min. Virou número de
      exemplo nos testes. A SLEEP ainda não foi cronometrada; nenhuma conclusão
      sobre a meta ou a folga para paradas pode sair dele.
    - ⚠ **A contagem dupla que sobra é a do USUÁRIO**: digitar o medido já com
      +15% (no produto e não na base) sobe a UEP 15%. O COMO LER e a dica do
      campo dizem "sem somar tolerância" — o teste prende as duas réguas.
    - Revisão: fora de 0–100% ou sem algarismo → padrão com aviso
      (`base.tolFora`; o `_pgSimNum` daria 0 calado, por isso as entradas
      mandam NaN); 0% → `tpSeg` null (sem "+0%"); `tolFator` arredondado a 4
      casas (1 + 14/100 = 1,1400000000000001); `onblur` refaz o campo. A
      régua e o cabeçalho do papel dizem *medido* ao lado do número da base
      (no exemplo, 8,7 no cabeçalho e 10,0 no cartão, sem dizer qual era qual). O
      teste confere o tempo padrão com 30% (só o 15% — o padrão — deixava
      passar a conta que ignora o digitado) e a persistência com um
      localStorage de mentira; conferido por mutação.
    - ⚠ **Decisão em aberto (PPCP)**: a guarda `base.suspeita` e o cartão
      DIFERENÇA da base comparam o tempo CRU com a régua da meta. Pela
      premissa da tolerância a régua já tem fadiga dentro — a comparação
      coerente seria o TEMPO PADRÃO da base contra a régua (a sobra é o espaço
      das paradas). Não mexido: muda o número do cartão e o limite do aviso.
  - **v7.146.1 — refatoração, sem mudança de comportamento** (PPCP:
    *"refatorar"*, escopo só a cronoanálise). A conta é `_uepConvBaseDe` (régua
    e tolerância, sem produto) + `_uepConvCadastro` (UEP por volume, jogo,
    origem) + `_uepConvDigitar` (repartição); o `_uepConvMontar` acha o produto,
    junta as três e faz a conversão (UEP, tempo padrão, % do cadastro, CONFERE).
    O desenho são peças sem conta (`_uepConvAvisoBase`, `_uepConvRegua`,
    `_uepConvCadTxt`, `_uepConvNotasHtml`, `_uepConvBaseHtml`,
    `_uepConvTrocaHtml` e os `_ucv*` pequenos); o `_uepConvHtml` escolhe pelo
    estado. Campos e localStorage só por `_ucvEl`/`_ucvLe`/`_ucvGuarda` (o
    teste conta 1 `getElementById('uep-conv-` no arquivo). Peça nova de
    desenho entra na lista `UCV_DESENHO` do `uep-relatorios.test.js`: é ela
    que a guarda "desenho sem conta" varre, com o `UCV_SEM_CONTA` — que olha
    `/ R.` E `/ base.` (as peças recebem um ou outro), `_taktUep(` e a faixa.
    ⚠ A 1ª versão da guarda ficou olhando só o `_uepConvHtml`, que virou
    despachante: dividir função em peças exige levar a guarda junto.
    - ⚠ **Como foi provado que nada mudou**: um script (fora do repositório)
      roda a região inteira num `vm` com DOM e localStorage de mentira, em
      249.318 casos — catálogo real + casos de borda, cada estado, base, meta e
      tolerância, a impressão e os cliques — e compara o hash da saída de antes
      e de depois. Zero diferença; quatro defeitos plantados foram pegos. Para a
      próxima refatoração aqui, o mesmo método: gravar a saída ANTES de mexer.
  - **v7.148.0 — A SLEEP CRONOMETRADA É A BASE** (PPCP, 20/10/2026: *"achei
    tempo sleep"* → *"precisa alterar agora"*). Volume a volume de 60 volumes:
    NO PERÍODO 8,6 s · COM A LINHA RODANDO **7,9 s** · sem as 4 lacunas 6,7 s.
    `UEP_BASE_MEDIDA = {seg:7.9, data:'20/10/2026', volumes:60}` é a base de
    TODO computador: campo vazio vale e mostra 7,9 (`_uepConvEntradas`, mesmo
    com o foco no campo — apagado para digitar não pula para a meta).
    `base.medida` (igual a uma casa) = sem aviso; outro tempo = BASE DIGITADA;
    10,4 = régua da meta com aviso próprio (BASE PELA RÉGUA DA META). Os dois
    com **VOLTAR À SLEEP MEDIDA**. A própria SLEEP com o tempo em uso
    (`R.emUso`) diz que é a base; tempo novo manda FIXAR *neste computador*.
    - ~~⚠ **Vale o RODANDO, não o 6,7**: é o campo que se lê de cada produto, e
      as lacunas (paradas não marcadas) ficam dentro nos dois. Trocar para o
      "sem as lacunas" exige ler esse campo de TODO produto.~~ — **revogado na
      v7.200.0**: vale o SEM AS LACUNAS, nos dois (ver *A RÉGUA DA CRONOANÁLISE É
      O SEM AS LACUNAS*). As lacunas NÃO se cancelavam: a MADERO tinha 15% e os
      produtos ~2%.
    - ⚠ **60 volumes ≈ 8 min de linha.** Uma 2ª medição (outro dia) confirma
      antes de trocar UEP em massa. Medição nova = trocar a constante (muda a
      conversão de todo produto) — o 8,7 s dos testes antigos continua exemplo.
    - Efeito real: ARMÁRIO ENCANTO rodando 17,6 s → **2,23** contra 2,69 no
      cadastro (−17%). Nada gravado (UEP TRAVADA, só digitada).
    - ⚠ **O VÃO DO CADASTRO NÃO ERA O DA LINHA.** As 429 linhas da
      PRODUTO_CODIGO tinham ENTRE_PECAS 650 e VELOCIDADE 9 (valor padrão, não
      medido). Com 650 o teto da SLEEP saía 9,8 s/caixa — mais lento que a
      própria medição. O PPCP informou **250–270 mm** e corrigiu no cadastro em
      20/10/2026: **SLEEP (501.094) e MADERO (501.149) com 250**; o resto
      continua 650. Com 825 + 250 mm a 9 m/min o limite é **7,2 s/caixa** e o
      rodando (7,9) é ~91% dele: a SLEEP roda PERTO DO LIMITE (confirma a nota
      abaixo). Não afeta a UEP (razão de tempos medidos); afeta % TETO EST., o
      limite do simulador de capacidade e o NO LIMITE DA ESTEIRA da FILA. ⚠
      Enquanto os outros produtos seguirem com 650, o % TETO entre produtos
      compara réguas diferentes (o teto da SLEEP subiu de ~366 para ~502 cx/h).
  - **v7.149.0 — QUAL NÚMERO DIGITAR** (PPCP: *"deixa claro no painel qual
    medida eu coloco para comparar com sleep"*). `_uepConvQual(base)`
    (desenho, em `UCV_DESENHO`): os três cartões do Volume a volume com os
    nomes do app, o que vale em verde com o número da SLEEP nele, os outros
    *não use* com o que a SLEEP deu ali (`UEP_BASE_MEDIDA.periodo` /
    `.semLacunas` — só para isso, nenhuma conta). Tela (`#uep-conv-guia`, antes
    do COMO LER) e papel. Rótulo do campo (`#uep-conv-seg-rot`) e cartão
    MEDIDO dizem RODANDO, ou NO PERÍODO com a régua da meta.
  - **v7.150.0 / `.gs` v5.30 — REGISTRO DA MEDIÇÃO E A LINHA FAZ** (PPCP:
    *"pode fazer tbm guardar o que é cronoanalise e que linha faz"* → *"os
    dois"*). Decidido junto: **manter a faixa 90–110%** e trocar a UEP só com
    ~~**duas medições em dias diferentes**~~ apontando o mesmo lado (`_ucvRegsResumo`
    → `UCV_REG_VEREDITO`). ⚠ **Revogado na v7.158.0** (PPCP: *"não dá para
    travar em duas datas diferentes o mesmo produto, isso vai demorar
    muito"*): a regra é de AMOSTRA — ver *TROCAR A UEP PELA CRONOANÁLISE*. Ruído medido de UMA medição de 8 min: as 4 lacunas
    da SLEEP separam 7,9 de 6,7 (18%); outra amostra cairia em ±8%.
    - ~~**A LINHA FAZ** (`_ucvLinhaDe`): o MÉD.PERÍODO do produto em s/cx~~ —
      **trocado na v7.160.0 pelo NA PRODUÇÃO** (ver *NA PRODUÇÃO: % DO PADRÃO
      NA CRONOANÁLISE*).
    - **💾 REGISTRAR MEDIÇÃO**: formulário `#uep-conv-reg` FORA do
      `#uep-conv-res` (refeito a cada tecla). `_ucvRegValida` recusa campos
      trocados (período < rodando, sem lacunas > rodando); `_ucvRegMontar` é a
      linha; o REG_ID é hash do CONTEÚDO (2º clique depois de timeout não
      duplica). Volume vai como `VOL 1/2` / `JOGO 2 VOL` — "1/2" o Sheets
      viraria data. `jsonpEscrita` + confere `registrado` (o `.gs` antigo cai no
      `getDados` e não grava).
    - **`.gs` v5.30**: aba `CRONOANALISE` (só acréscimo, criada na 1ª
      gravação), grava pelo NOME da coluna (coluna que falta é criada no fim),
      sob o lock, idempotente pelo REG_ID; `getCronoRegistros` (cache 300 s,
      invalidado pelo registro). ⚠ **re-deploy manual**. NÃO toca a UEP.
    - O GRAVAÇÃO das notas e o título da aba deixaram de dizer "nada é gravado":
      a UEP não muda, a medição é registrada.
    - **v7.150.1 — o 1º registro real (MADERO, 20/10 15:58) gravou NO PERÍODO
      1335** (e RODANDO 7,9 / SEM LACUNAS 6,7 — os números da SLEEP, a
      conferir com o PPCP). O `_pgSimNum` joga fora o que não é número, então
      "13:35" virava 1335. `_ucvRegValida` só aceita `^\d+([.,]\d+)?$`, recusa
      NO PERÍODO acima de `UCV_REG_PER_MAX`=5× o RODANDO e RODANDO fora de
      0–`UCV_REG_SEG_MAX`=120 s. A LINHA FAZ saiu vazia **com razão**: a MADERO
      não rodou de 20/09 a 19/10 (só hoje, 877 cx, e hoje fica fora).
  - ⚠ **Velocidade da esteira × base SLEEP**: a SLEEP roda no limite da esteira,
    então o tempo dela é (caixa + vão) ÷ velocidade. Mudou a velocidade, a base
    muda e todo produto que NÃO é limitado pela esteira ganha/perde UEP sem ter
    mudado nada. Na campanha de cronoanálise, a velocidade fica fixa; se mudar,
    refazer a SLEEP (📌 FIXAR) e lembrar que o medido antes está na unidade
    antiga — e atualizar a coluna VELOCIDADE da PRODUTO_CODIGO.

## TROCA DE ESCALA DA UEP COM O PASSADO TRAVADO (v7.151.0)
- PPCP, 20/10/2026, depois da cronoanálise da MADERO (= SLEEP, 1,00 contra
  1,20 no cadastro; o Encanto também deu cadastro × 0,83): *"quando alterar
  deixar travado o passado"* → *"faz a marcação de datas nos gráficos"*.
  **Nada foi trocado ainda** — falta medir mais produtos (regra das duas
  medições). Se a escala mudar, o HISTORICO **não** é regravado desta vez.
- **`UEP_ESCALAS`** (v7, junto do `UEP_TRAVADA_DESDE`): uma entrada
  `{ desde:'dd/MM/yyyy', txt }` por troca do cadastro inteiro SEM regravar o
  passado. **Hoje vazia.** As trocas de 16/10 e 19/10 regravaram o HISTORICO e
  não entram. Conta pura: `_uepEscalaCorte(datas)` (a troca com dia dos dois
  lados; o dia da troca já é da régua nova), textos únicos `_uepEscalaSelo`
  (card) e `_uepEscalaNota` (nota), `_uepEscalaDesde(ateNum)` (1º dia da régua
  que vale) e o desenho `_uepEscalaMarca` (tracejado âmbar + *ESCALA NOVA DA
  UEP · dd/mm*, no vão entre as barras; perto da borda direita o texto vira).
- **Onde aparece:** marca nos gráficos `_uepAbaPerSvg` (bloco 5, tela e papel) e
  `_dirSemSvg` (diretoria); nota no bloco 5 (tela e papel), card UEP / DIA do
  HISTÓRICO (tela e, desde a v7.267.0, o papel — a nota do pé; a faixa
  `_rpUepFaixaHtml` saiu), o ONDE PERDEMOS do semanal, carteira em UEP do PLANO
  (`cart.escNota`, pela `_qpCurvaUepDias` — os MESMOS dias da régua) e custo
  por UEP do SIMULADOR. O **peso normal das Telas F/G** (`_tvUepPesoNormal`)
  **só usa dias da régua de hoje** — na TV não cabe nota, e a mediana antiga
  diria que a caixa mudou de peso.
- O % da meta segue certo dos dois lados (cada dia tem a META UEP gravada):
  veredito do dia e da semana, CAIXAS × UEP e bloco 7 não ganham nota.
- **No dia da troca, junto com a entrada na lista:** cadastro × fator, META UEP
  do ⚙ no mesmo dia, `UEP_META_PADRAO` (rp-core) e `UEP_META_PADRAO_GS`, e a
  aba `UEP_VERSOES` gravada com o valor antigo e o novo (vigência = a data).
  ⚠ **Colar a coluna UEP inteira não registra o valor antigo**: o
  `_uepVerDaEdicao` só sabe o valor de antes numa célula única (`e.oldValue`),
  e sem a aba a semente pula os códigos editados — o bloco 7 releria o passado
  com a UEP nova. NÃO rodar o `regravarUepPassada`.
- Testes em `tela-uep.test.js` (corte, textos, peso normal, a marca nos dois
  gráficos e os chamadores; conferido por mutação) e `relatorios.test.js`
  (régua em UEP com janela).

## SUB-ABAS DA ⚖ UEP (v7.198.0)
- PPCP, 03/11/2026: *"faz o mesmo na aba uep"* (as sub-abas da cronoanálise).
  A aba tinha ~3.200 px e ~1.340 palavras empilhadas.
- Faixa estática `#uep-sub` (botões `.ucv-sb`, `data-sub`) e painéis `.ucv-pn`
  dentro do `#uep-bloco`, desenhados pelo `renderUep` (`pn(k, h)`): **HOJE**
  (`hoje`: cartões, hora a hora, mix, origem) · **PERÍODO** (`periodo`) ·
  **PRÓXIMOS DIAS** (`prox`: `#ger-prox`) · **POR PRODUTO** (`prod`: bloco 7)
  · RÉGUAS (v7.207.0) · **TAKT DA SEMANA** (`takt`, v7.209.0 — ver *TAKT DA
  SEMANA*). `UEP_SUBS`, `UEP_SUB` (começa no HOJE, só na memória da sessão).
  A faixa da ⚖ UEP é GRADE de colunas iguais (v7.209.0): no flex, a 6ª que
  descia para a 2ª linha (~1.100 px) esticava a linha inteira; estreitar os
  botões para caberem seis cortava o número deles. ⚠ **auto-FIT, não
  auto-fill** (v7.210.0, PPCP com print a 1.920 px: *"pode aumentar um
  pouco"*): o auto-fill deixava colunas vazias à direita e os botões estreitos;
  `minmax(200px,1fr)` e a letra um pouco maior (12 / 14,5 px).
  - ⚠ **`_uepSub(k)` REDESENHA a aba** (`renderUep`, sem leitura): os gráficos
    são desenhados na largura do painel ACESO, e escondido ele não tem largura
    (o `_svgLargura` cairia nos 760). Depois do `innerHTML`, o hora a hora e o
    período só são redesenhados com o painel visível (`offsetParent`).
  - **A entrada (animação) só na troca** (`.entra`, posta pelo `_uepSub`): o
    `renderUep` roda a cada refresh e refaz o painel — com a animação no `.on`
    ele piscaria a cada 5 min.
  - Números dos botões: `_uepSubMontar` (HOJE com o selo e a cor do card UEP
    ATÉ AGORA — o MESMO veredito, `slRitmo(card.ef)` e `card.c`; PERÍODO média e
    dias na meta do `_uepAbaPeriodo`; POR PRODUTO acima/abaixo do `_uepPadHist`)
    e `_uepSubProx(W, est)` (o saldo da 1ª semana com dia útil, pintado pelo
    `renderProxDias` com as MESMAS semanas do bloco). Sem leitura → o estado,
    nunca 0. A pintura é o `_sbPinta`, uma só para a cronoanálise e a UEP.
  - Os títulos dos blocos perderam o número (revoga a numeração da v7.114.0
    na TELA; o papel já não numerava).
  - ⏱ CRONOANÁLISE → e 📏 RÉGUAS → são `.ucv-sb-ir` na ponta da faixa.
- **Cartão ATRASO na faixa (v7.227.0**, PPCP 11/11/2026, com o TAKT DA SEMANA
  na tela: *"onde consigo ver hora que está em atraso?"* → *"deixar em um lugar
  para ver card"* → *"deixar à vista"*). `<button class="ucv-sb uep-sb-atr">`
  depois do TAKT DA SEMANA, SEM `data-sub` nem `role=tab` (não é sub-aba: o
  `_uepSubMarca` só acende `.ucv-sb[data-sub]`). Texto do `_uepSubAtr(P, A,
  est)` (conta pura): *3h45 · 425 cx · desde 06/11* — o total do quadro ATRASO
  — CONFERÊNCIA (`conta.venc` do `_gpxMontar` e `_gpxAtrasoMontar`), nenhuma
  conta nova; `*` nas horas com código sem UEP; *nada vencido* em verde; sem
  leitura, o estado (`…`, *programação não lida*, *sem UEP na programação*, `—`
  com o `.gs` sem o atraso por código). Pintado pelo `renderProxDias` em toda
  saída (o mesmo `A` do quadro). O toque (`_uepAtrAbrir`) abre o PRÓXIMOS DIAS
  com o quadro aberto e rola até ele. Borda vermelha com atraso
  (`.uep-sb-atr.red`). Só o VENCIDO: o programado de hoje continua fora (v7.156.0).
  - ~~⚠ **O NÃO FECHA da TAKT ESTA SEMANA não soma o vencido de antes da
    segunda**~~ — **soma desde a v7.245.0** (ver *O ATRASO E O LOTE DE HOJE NO
    PRECISA*). Em 11/11/2026 o cartão dizia 3h45 e o TAKT faltam 5h47 sem o
    1h44 do 25396 (06/11).
  - Medido no Chromium: 1920, uma linha (o cartão com 228 px, texto inteiro);
    1366 e 1280, duas linhas (o corte de texto nos outros cartões já existia).
  - **NO CELULAR (mobile 1.43.0**, PPCP: *"essa card do atraso pode ir para
    app gerencial"* → *"no mobile deixar bem à vista"* → prévia → *"ok"* →
    *"só card de atraso"*): o card **⚠ ATRASO · LOTES VENCIDOS** é o 1º do
    gerencial do celular (`atrKpi` no `renderGerencial`; `.kpi-card.larga` =
    a largura toda, `.atr` = fundo e número vermelhos a 34 px). Conta
    `atrasoVencido(lista, uepDe, meta)` no **`rp-core.js`** (1.14.0): o MESMO
    número do cartão do PC (o `relatorios.test.js` confere a paridade com o
    `conta.venc` e o `_gpxAtrasoMontar`), com a UEP do CADASTRO (`PRODUTOS`,
    código pelos dígitos) — o celular não lê a `getProgramacaoDetalhada`. Sem
    atraso, sem card. Sem UEP nenhuma, ou o `.gs` sem o `atraso` por código, ou
    `rp-core` velho em cache: só as caixas (`atrasoTotal`). O cadastro que
    chega redesenha o gerencial. Saiu o card *"⚠ ATRASO NA PROGRAMAÇÃO"* do fim
    da lista (só caixas).
    - Revisão: o gerencial RELÊ o cadastro no ciclo (desde a 1.50.0 o das caixas, 3 min) quando passou de
      `PROD_CAT_TTL` (30 min) ou falhou, e no ATUALIZAR (`PROD_CAT_TS` /
      `PROD_CAT_FALHA` no `carregarProdutos`) — uma troca de UEP no dia chega
      ao card. Falhou e não há UEP: *"cadastro não lido — tenta de novo em 3
      min"* (6 até a 1.49.0), nunca "lendo" para sempre; horas pelo cadastro guardado no aparelho
      (sem leitura na sessão, com falha) dizem isso.
    - **min 0 com UEP é "<1 min", não "sem UEP"** (uma sobra de 1 cx). O cartão
      do PC tinha o mesmo erro: `_uepSubAtr` decide pelo `conta.uVenc > 0` e
      escreve *"menos de 1 min"* (v7.228.0, a única mudança do PC).
    - **Entra junto com os outros (mobile 1.44.0**, PPCP: *"demora pro card do
      atraso entrar, os outros entram antes"*): o card sai do `getPontosDia`
      (a leitura mais cara), que era a 3ª da carga inicial, com UMA tentativa
      de 20 s — no cold start estourava e o card só vinha 6 min depois. Hoje:
      a leitura do dia logo depois do `lerSheets` (o histórico depois, e com
      ele o `renderGerParadasResumo`); `lerPontosDia` com duas tentativas em
      sequência (30 s, 45 s; `PONTOS_DIA_FALHA`) e voo compartilhado
      (`_pontosVoo` → `_lerPontosDia`); e o card do dia guardado no aparelho
      (`rp_atr_ret` = {dia, ts, kpi}, `_atrRetGuarda(kpi, lidoEm)` /
      `_atrRetLe`), com o DIA e a HORA DA LEITURA (`PONTOS_DIA.lidoEm`, nunca
      a do redesenho — o `lerSheets` redesenha a cada 3 min). Sem leitura de
      HOJE (`_lidoHoje`: o `lidoEm` de ontem, com o app aberto na virada, não
      vale), entra o guardado de hoje marcado *"de HH:MM, atualizando…"* (ou
      *"sem leitura nova"*); a última leitura de hoje falhou → *"de HH:MM ·
      sem leitura nova"*. Só o card completo é guardado (com o cadastro por
      ler, não); kpi null = sem atraso. ⚠ **Não é teto**: excluir/trocar
      lançamento, linha com data passada, X apagado ou troca de UEP sobem o
      atraso no mesmo dia. ⚠ Chave nova: não renomear.
    - **O ATUALIZAR espera a leitura em curso** (`_refreshP` /
      `_refreshMarca`, marcada pela carga inicial, pelo ciclo e pelo próprio
      ATUALIZAR): com a leitura do dia de até 75 s, tocar ↻ no meio dela punha
      três fluxos na fila do Apps Script. Toques seguidos viram UM pedido
      (`refresh` → `_refreshPedido` → `_refresh`) e o botão diz *↻
      ATUALIZANDO…* (desabilitado) até acabar.
    - **A leitura de ONTEM não vale para card nenhum** (`_pontosDiaDeHoje`, no
      começo do `renderGerencial` e do `aplicarMetaDiaAutomatica`): com o
      `PONTOS_DIA.lidoEm` de outro dia, o objeto volta ao vazio
      (`_pontosDiaVazio`) — UEP DO DIA "aguardando", META pela HORA_A_HORA,
      pontos/peso/produtos do dia esperando a leitura de hoje.
  - **A 2ª LINHA DO CARD (v7.242.0**, PPCP 13/11/2026 com a tela: card 1h55 ×
    TAKT *"faltam 6h16"* — *"como falta 6?"* → prévia → *"pode subir"*):
    `<small id="uep-sb-atr-s" style="display:none">` (nasce escondida: sem
    isso a faixa cresce 2 px antes do 1º desenho), texto do `_uepAtrSub(venc,
    hojeN)` (puro, pelo `A.venc`): *já está no PRECISA do TAKT* (todo vencido
    com UEP — desde a v7.245.0 também o de antes da segunda; as frases *antes de
    dd/mm: fora do TAKT* e *fora do TAKT desta semana* saíram) · *sem UEP: fora
    do TAKT* / *sem UEP (\*): fora do TAKT* (só o código sem UEP fica fora). Até 30
    caracteres (o card tem ~166 px a 1280; a 1ª versão, *"o de antes de 09/11
    não conta no FALTAM da semana"*, saía cortada em toda largura) e sem a
    palavra FALTAM (com a semana fechando o veredito diz SOBRAM/FICARAM); a
    explicação vai no `title` (`subT`). O `_uepSubAtr(P, A, est, hojeN)` devolve
    `sub`/`subT` só com o dia e com vencido; o `sbA` do `renderProxDias` pinta e
    esconde a linha no estado seguinte sem `sub`.
    - ⚠ Fontes diferentes: o card é o atraso por código (FIFO, `PONTOS_DIA` +
      `getProgramacaoDetalhada`), o TAKT o saldo de cada linha
      (`getProgramacaoSemana`), com caches diferentes — podem diferir por
      minutos depois de um lançamento num lote vencido.
  - A ênfase do TAKT NO APP na faixa da TAKT DA SEMANA (número grande ao lado
    dos volumes) foi feita, mostrada em prévia e **guardada fora** do commit
    (*"só card de atraso"*): não está no painel.
- **Menu 🖨 IMPRIMIR ▾** (`#uep-imp`): VERSÃO EXECUTIVA, PADRÃO × REALIZADO e
  FILA DE CRONOANÁLISE, cada um com `_uepImpFecha();` antes. O 🖨 do bloco 7
  saiu dele (uma impressão, um lugar). Os listeners de clique fora e Esc fecham
  QUALQUER `details.ucv-imp[open]`.
- **ATRASO — CONFERÊNCIA recolhido** (`_gpxAtrasoHtml` → `<details>`, o total
  `cx · UEP · horas` no `summary`); aberto continua aberto no refresh
  (`GPX_ATR_ABERTO`/`_gpxAtrToggle`). Só na tela, como antes.
- **PADRÃO ALTERADO na ÚLTIMA coluna** do bloco 7 (`_uepPadCelsProd`, PPCP:
  *"alinhar PADRÃO ALTERADO"*): depois da data do ÚLTIMO DIA (largura fixa),
  nunca colado no nome — a lição do VOL. e do UEP/CX. É a coluna em que o dia a
  dia aberto já marca o dia da troca. Tela e papel (a célula é a mesma).
- CSS: as peças da faixa, do menu e do cabeçalho são `#sec-crono X,#sec-uep X`
  (`.ucv-hdr*`, `.ucv-imp*`, `.ucv-sub`, `.ucv-sb*`); os painéis da UEP têm
  regras próprias (`#sec-uep .ucv-pn`, `.entra`).
- Medido (Chromium, o `.gs` do repositório sobre a cópia da planilha de
  03/11): HOJE ~700–760 px, PERÍODO ~630, PRÓXIMOS ~890–960, POR PRODUTO
  ~1.240; nada passa da largura a 1920, 1366 e 1280.
- Testes: `relatorios.test.js` (sub-abas, números, pele, atraso recolhido) e
  `uep-padrao.test.js` (PADRÃO ALTERADO e o 🖨 no menu); 12 de 12 mutações.

## RÉGUAS E ONDE O TEMPO VAI VIRAM SUB-ABAS (v7.207.0)
- PPCP, 06/11/2026: *"analisar o que pode unir"* → A1 e A2 → *"ME MOSTRA COMO
  VAI FICAR ANTES DE SUBIR"* (prints com os dados reais) → *"ok"*. A barra do
  gerencial do PC cai de 13 para 11 abas. Nenhuma conta, leitura, impressão ou
  linha do `.gs` mudou; TV, celular e diretoria não foram tocados.
- **A1 — ⏳ ONDE O TEMPO VAI é a 5ª sub-aba da ⏱ CRONOANÁLISE** (`UCV_SUBS` +
  `'tempo'`; painel `<div class="ucv-pn" data-sub="tempo"><div
  id="uep-conv-tempo">`). A MESMA tela (comparada no Chromium com a v7.206.0).
  `_ucvAbaOn()` = `_abaOn('crono')`. O botão (`_ucvSubMontar().tempo`) diz o 1º
  cartão — *"+42% sobre o estudo · ≈ 25,8 h"* —, sem cor: diferença não é perda.
  O 🖨 saiu do título do bloco para o menu 🖨 IMPRIMIR ▾ (cinco impressões). O
  toque num volume abre o MEDIR.
  - ⚠ Revoga a *aba própria* da v7.196.0. O pedido daquele dia (*"parece um
    excel melhorado"*) foi atendido pela tela em painel; a cronoanálise ainda
    era uma rolagem só — as sub-abas vieram depois. O PPCP foi avisado disso
    antes de aprovar.
  - CSS: o escopo `#sec-tempo` virou `#uep-conv-tempo` (o mesmo conteúdo). Dentro
    do `#sec-crono` ele herdava a `.uep-nota` mono da cronoanálise; o
    `#uep-conv-tempo .uep-nota` devolve o `inherit` da aba própria (v7.207.1).
  - O botão diz *"medições não lidas"* quando a leitura das medições falha
    (era *"…"* para sempre).
- **A2 — 📏 RÉGUAS é a 5ª sub-aba da ⚖ UEP** (`UEP_SUBS` + `'reguas'`). O
  painel é FIXO (`#uep-reguas`), FORA do `#uep-bloco`: o `renderUep` refaz o
  bloco a cada refresh e levaria a tela junto. `_uepSubMarca` acende botão e
  painel (o `setTab` também usa); `_uepSub('reguas')` pinta e lê
  (`renderReguas`, como a aba lia) — as outras quatro seguem sem leitura.
  `_regOn()` = ⚖ UEP aberta com a RÉGUAS acesa.
  - **Uma leitura de cada vez** (v7.207.1, achado BLOQUEANTE da revisão da
    v7.207.0: a ⚖ UEP aberta na RÉGUAS punha 3 JSONP no ar — o `renderUep`
    disparava, sozinho, as leituras dos painéis ESCONDIDOS):
    - com a RÉGUAS na tela o `renderUep` sai na 1ª linha (nada a desenhar nem
      ler) e o `#uep-bloco` some (`_uepSubMarca`) — o aviso de estado dele fica
      fora dos painéis e aparecia em cima da RÉGUAS;
    - a RÉGUAS entra pela fila: `_regAbrir(forcar)` espera `_uepLendo()` (a
      carga da aba, histórico, POR PRODUTO, programação e a leitura do dia — a
      do refresh também), e diz *"Esperando a outra leitura…"*. O ↻, o TENTAR
      DE NOVO e a troca de período passam por ela;
    - aberta na RÉGUAS, a aba não lê as outras quatro (`UEP_ABA_PEND`): a 1ª
      troca para uma delas lê, depois do `REG_RODANDO`. As auto-leituras do
      `renderUep` (histórico, POR PRODUTO) e do `renderProxDias` esperam o
      `REG_RODANDO`;
    - o `relatorios.test.js` roda a fila com o relógio na mão (o mock do
      `setTimeout`): regex não prende ordem de leitura.
    - Medido no Chrome com o script da revisão (cada JSONP segurado 2,5 s):
      v7.207.0 punha 3 ao mesmo tempo; a v7.207.1, 1 — como a v7.206.0.
  - O botão (`_regSubMontar(R.reguas)`) diz a variação das três réguas, da
    menor para a maior (*"UEP ±11,0% · pontos ±18,6% · caixas ±26,1%"*, a
    precisão da tela — `fmtP`); antes da leitura, *"caixas × pontos × UEP"*,
    nunca 0. Fora do sucesso o `_regPintar` diz o estado (…, histórico não
    lido, nenhum dia para comparar, não montou) — nunca os números de outro
    período.
  - O 🖨 CAIXAS × PONTOS × UEP foi para o menu da ⚖ UEP (quatro impressões); o
    atalho 📏 RÉGUAS → saiu. CSS: `#sec-reguas` → `#uep-reguas`.
- **O nome antigo abre a sub-aba**: `setTab('reguas')` → ⚖ UEP na RÉGUAS;
  `setTab('tempo')` → ⏱ CRONOANÁLISE no ONDE O TEMPO VAI.
- Medido no Chromium com os dados reais de 06/11 (1920×1015): nada passa da
  largura; o ONDE O TEMPO VAI antes × depois saiu igual.

## A RÉGUA DO DIA FECHADO EM UEP É UMA SÓ (v7.269.0 / rp-core 1.25.0 / mobile 1.60.0)
- PPCP, 18/11/2026, com a lista do que ainda divergia: o MESMO dia fechado era
  julgado de três jeitos — HISTÓRICO e semana ≥ meta com o âmbar da hora extra;
  ⚖ UEP · PERÍODO e diretoria ≥ meta sem o âmbar; gerencial do dia passado,
  🖨 Estudo de UEP, a coluna EM UEP do 🖨 CAIXAS × PONTOS × UEP e o celular pela
  `sc` (96%). *"arrumar ficar igual"* → *"a régua tem que ser universal"* →
  pergunta com três opções (≥ 100% em tudo · 96% em tudo · 100% no fechado e 96%
  ao vivo) → **"100% no fechado, 96% ao vivo"**.
- **A régua, UMA vez, no rp-core**:
  - `uepDiaJulga(d)` → `{cls, uep, he, meta, pct, falta, faltaTot}` ou null (sem
    UEP gravada). `cls`: `ok` (UEP de jornada ≥ `uepDiaMeta`) · `he` (jornada <
    meta e jornada + `uepDiaHe` ≥ meta — âmbar) · `ruim` · `fds` (meta 0: sábado,
    domingo, dia sem meta — sem veredito);
  - `uepPeriodoJulga(res)` (res = `uepHistResumo`) → `{selo, jorn, he, meta, pct,
    falta, faltaTot}` ou null: a mesma régua na soma dos dias úteis com UEP (a hora
    extra do período inteiro, o fim de semana dentro, conta para o âmbar);
  - `uepDiaSelo(J)` → `{txt, cor}`: ✓ META/ok · ⚠ META COM HE/warn · ABAIXO/red ·
    HORA EXTRA/acc · SEM UEP/mute. A cor nunca vai sem a palavra.
  - ⚠ A REDE no `<head>` dos dois HTMLs (rp-core antigo em cache com o painel
    novo) repete a mesma regra — o teste roda a da rede contra a do núcleo nos
    mesmos casos; mudou uma, muda a outra.
- **Quem lê**: `_gsemUepMontar` (bloco da semana, relatório semanal, HISTÓRICO —
  o selo e a classe de cada dia), `_histCelulasUep` (a palavra), o
  `renderGerencialHist` (hero, card de reserva e análise do dia passado — o
  texto é o `_gsemSeloTxt`), `_dirSemana`/`_dirSemanaHtml` (selo da semana, agora
  com o âmbar) e `_dirSemSvg` (barras), `_uepAbaPeriodo`/`_uepAbaPerCards` e o
  `_uepAbaPerSvg` (sem o mapa `cls`, a cor vem da régua — tela e papel da ⚖ UEP),
  o `_uepEstudo` (cor da UEP GRAVADA), o `_cxUepMontar` (coluna EM UEP: `clsU` e
  a palavra `stU`) e o `abrirDia` do celular.
- ⚠ **O que NÃO é esta régua**: o selo ao vivo do dia em curso e a hora
  (`sc`, `slRitmo`, `efNoRitmo`, `uepHoraJulga`, `uepCard`: 96% / 90%) — o dia
  em curso ainda pode alcançar a meta, a hora é ritmo. E o veredito em CAIXAS de
  dia fechado (`META_PCT` 96%: HISTÓRICO sem UEP, semanal sem UEP, a lista do
  HISTÓRICO do celular) — outra régua, fora da escolha do PPCP.
- **O CAIXAS × PONTOS × UEP** compara o que cada régua, COMO É USADA, diz do
  mesmo dia: caixas e pontos pela `sc`, a UEP pela régua do dia fechado. Mudou o
  estudo de set–out: 23/09 (UEP 98,9%) deixa de ser "caixas abaixo, UEP no
  ritmo" e vira igual; 09/10 (98,7%) e 28/10 (96,2%) passam a "UEP abaixo" (as
  caixas a 102% e 148%). Antes dava zero dias com a UEP abaixo e as caixas na
  meta; agora são os dias com a UEP entre 96% e 100%. A frase da página 1 passa
  de "Nos 8 em que as caixas deram ABAIXO…" a "Os motivos, dia a dia, na
  página N" (a conclusão só cita a meta em caixas quando NÃO há dia com a UEP
  abaixo).
- **A diretoria**: o selo da semana com as palavras do `_gsemSeloTxt` (sem o ✓/⚠,
  o ● é o da diretoria) e a classe `warn` (o CSS `.dir-selo.warn`/`.dir-k.dest.warn`
  já existia); as barras dos últimos dias em âmbar quando o dia bateu só com a
  hora extra; a legenda *ÂMBAR = COM HORA EXTRA* cobre também o fim de semana
  (âmbar mais apagado, sem a linha da meta). Medido a 1920×1080 e 1366×768: o
  selo mais longo cabe, nada passa da tela.
- **O celular**: a linha UEP (JORNADA) leva a palavra (*· ⚠ META COM HE*); a 360
  e 390 px ela quebra em duas linhas, sem cortar; a 430, uma. Mobile 1.60.0 e o
  `CACHE` do `sw-mobile.js` v73.
- **Medido depois da revisão**: o gerencial do dia passado a 1920 · 1366 · 1280
  (nada passa da largura; o hero quebra o texto e a linha de cards vai de 96 para
  113 px a 1366/1280); o STATUS do celular cabe numa linha a 360. A ⚖ UEP ·
  PERÍODO não renderiza sem a leitura do dia (não simulada): a legenda é
  `flex-wrap` — o item a mais desce de linha, não estoura.
- Testes em `relatorios.test.js` (*a régua do dia fechado em UEP: uma só*): a
  regra com 5 casos (o 97,8% que a `sc` dizia ok é ABAIXO), o período, a rede dos
  dois HTMLs contra o rp-core, e o MESMO dia com o MESMO veredito no bloco da
  semana, na tabela do HISTÓRICO, no desenho da ⚖ UEP, nas barras e no selo da
  diretoria, no card da ⚖ UEP · PERÍODO e no detalhe do celular (rodando a
  função do app); a ligação do dia passado; e a GUARDA da régua universal
  (nenhum dia fechado em UEP pela `sc`/`sl` ou por `u >= m` solto). Em
  `uep-relatorios.test.js`, os números novos do CAIXAS × PONTOS × UEP, com o
  porquê de cada dia. Mutações conferidas: o celular de volta à `sc` e a
  diretoria sem o âmbar reprovam.
- **A revisão (`/revisor-codigo`, 18/11/2026): 0 bloqueios, 10 ajustes** — todos
  aplicados antes do PR:
  - **Julga o número que a tela mostra** (E4): `uepDiaJulga` compara a UEP
    INTEIRA (`Math.round`) com a meta, e `_uepPctJulgado` nunca devolve 100,0%
    abaixo da meta (no máximo 99,9%; fora da borda, o % de sempre — cortar tudo
    mudava o 94,7% da semana 46 para 94,6%). O período, igual
    (`Math.round(jorn)`). O `uepHistResumo.bateu` passou a contar pelo
    `uepDiaJulga` (a mesma borda). Os consumidores leem o `pct` da régua (hero e
    análise do dia passado, celular, diretoria, ⚖ UEP, Estudo, `_gsemUepMontar`).
    O card FALTOU NA JORNADA usa o `falta` da régua.
  - **Dia útil gravado com META UEP 0**: o `_uepAbaPerSvg` trata como o fim de
    semana (`ehF` = sem meta, listrado; o title diz *dia sem META UEP gravada*); o
    `_cxUepMontar` tira o dia da base (sem veredito em UEP não há comparação). ⚠ O
    fixture do teste tinha um DOMINGO (18/10) com meta de caixas: saiu da base.
  - **⚖ UEP · PERÍODO, um veredito**: DIAS QUE BATERAM sem cor (*abaixo na
    jornada:*); o resumo do papel usa o selo do período (`perCards[0].c` e as
    palavras do `_gsemSeloTxt`), com *N DE M NA META* na linha de cima.
  - **Celular**: com UEP gravada o STATUS é o da UEP e as caixas ficam sem cor
    (EFICIÊNCIA, GAP, MELHOR e PIOR HORA). A linha UEP (JORNADA) só o número.
  - **CAIXAS × PONTOS × UEP**: neste relatório a UEP é REFERÊNCIA
    (`UEP_REF_STATUS`) — palavras *NA REFERÊNCIA* · *COM HE* · *ABAIXO*, frases
    "a UEP atingiu a referência"; a página 4 diz as duas réguas (sem escrever
    "EM PONTOS": o teste do relatório sem meta de pontos prende).
  - **Estudo de UEP**: a palavra do selo embaixo do % (P&B).
  - **Relatório semanal**: o chip do dia pelo `uepDiaSelo` (C4).
  - Testes: a fronteira (`=` meta, 2.760,6 × 2.760,4, `jornada + HE = meta`, o
    período), a cor da análise rodando o `_gerAnaliseUepHistHtml`; as mutações
    que passavam verdes (`>` no lugar de `≥` no ok, no âmbar e no período; sem o
    arredondamento; análise sempre verde) reprovam.
  - Ficou registrado (consequência da escolha do PPCP): depois das 17:00 a TV, o
    gerencial e o relatório do dia (ritmo ao vivo, 96%) dizem NO RITMO para um
    dia a 97–99,9%; no dia seguinte ele é ABAIXO.
