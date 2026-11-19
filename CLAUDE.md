# RitmoPatrimar · Embalagem — Memória do projeto

Painel de ritmo de produção (Patrimar Móveis · Embalagem · Jaci/SP).
Slogan: **Medimos o pulso da·linha.**
Front-end estático (HTML/JS) publicado na Vercel; dados vêm de um Google Sheets
via Google Apps Script (JSONP).

## Como esta memória está organizada (v7.248.2, 16/11/2026)
- Aqui fica **o que vale hoje** e as armadilhas que já custaram caro, em
  resumo, com o mapa dos temas. **O detalhe de cada tema mora em
  `docs/memoria/<tema>.md`**: o porquê de cada regra, os casos reais, as
  medições e o histórico — as seções que estavam neste arquivo até
  16/11/2026, movidas inteiras (regra riscada é revogada). A única reescrita foi
  a do *Padrão do código*; o que saiu dela está em `infraestrutura.md`.
- ⚠ **Antes de mexer numa área, leia o arquivo dela.** O resumo daqui não basta
  para mudar código: as regras nasceram de defeitos, e o porquê está lá. O
  revisor (`/revisor-codigo`) cobra isso.
- Mudou uma regra: o detalhe vai para o arquivo do tema (com a data e o caso)
  e, se muda o que vale, a linha do resumo aqui também. Regra revogada sai do
  resumo; no arquivo do tema fica marcada como revogada, com a versão.
- Por quê (PPCP, 16/11/2026: *"sim"* ao enxugamento): este arquivo tinha 641 KB,
  lido inteiro em toda sessão, com 51 regras riscadas no meio das que valem.
- Uma seção citada pelo nome (*"ver *O RELATÓRIO EM QUATRO PÁGINAS*"*) está no
  índice `docs/memoria/README.md`, que diz em que arquivo ela mora.

## Padrão do código e revisão (v7.248.2)
- **`docs/padrao-codigo.md` é a régua** (regras A1…J; o porquê de cada uma
  está no arquivo do tema, em `docs/memoria/`). Código novo segue o padrão; o que
  está diferente se corrige só na linha que se está mexendo.
- **Toda mudança leva TESTE DE REGRESSÃO, no mesmo commit** (PPCP, 19/11/2026:
  *"toda vez criar teste de regressão"*; regras I0–I2 do padrão): defeito
  corrigido → teste que FALHA com o defeito de volta (conferido desfazendo a
  correção); conta, regra ou tela nova → teste do comportamento, com um caso
  real. Sem teste não se entrega; se não der para testar, dizer por quê no
  commit e na resposta. O `/revisor-codigo` reprova (BLOQUEIA) mudança sem ele.
- **`node testes.js` antes de todo commit**: as suítes (`*.test.js`, achadas
  sozinhas — suíte nova não se cadastra) e o `lint-js.js`. Sai com 1 se algo
  falhar; `node testes.js uep` roda só as suítes com "uep" no nome.
- **O revisor do projeto é o `/revisor-codigo`**
  (`.claude/skills/revisor-codigo/SKILL.md`): roda o `testes.js`, confere o
  diff contra o padrão e relata BLOQUEIA · AJUSTE com arquivo:linha, regra e
  cenário. PPCP, 16/11/2026: *"deixar o revisor com padrão nesse projeto"*. O
  `anthropic-skills:revisor-codigo` é de React + Vite (o app de cronoanálise)
  e não vale aqui.
- ⚠ **Não rodar formatador automático (Prettier e afins) em arquivo inteiro**.
  Medido em 16/11/2026: o painel do PC iria de 28 mil para 52 mil linhas (com
  largura 120; no padrão do Prettier, ~59 mil) e 17 das 20 suítes quebrariam (os testes leem o código como texto), além de
  apagar o histórico linha a linha do git.
- **Função sem uso que fica de propósito** entra no `SEM_USO_OK` do
  `lint-js.js`, com o porquê. Hoje: o Excel local (`selecionarPasta`,
  `triggerImport`), as rotinas de editor do `.gs` e o `_soLetras` (sem uso; sai
  na próxima versão do `.gs` — mexer no `.gs` pede re-deploy).
- O código morto que saiu na v7.248.2, nome a nome, está em
  `docs/memoria/infraestrutura.md`. ⚠ A biblioteca XLSX fica: o botão FECHAR
  DIA (`exportarExcelDia`) e a importação a usam.

## ⚠️ NÃO ALTERAR sem pedido explícito
- **Horário do turno / rótulos dos slots.** O slot pós-almoço é **`12:12-13:00`**
  (mais curto por causa do almoço) — **não** é `12:12-13:12`. Preservar os rótulos
  exatamente como estão na planilha `HORA_A_HORA`.
- **A conexão com o Google Sheets** (`CFG.sheetsUrl` / lógica de `lerSheets` /
  `jsonpFetch`). Não mexer na URL nem no fluxo de conexão.
  - Exceção registrada (17/08/2026): a implantação antiga (`AKfycbwxFFLq…`)
    parou de responder — o painel passou a mostrar *"Erro ao carregar script —
    URL inválida ou sem acesso"* e caiu para o cache local. Foi criada uma
    implantação nova e a URL foi trocada nos DOIS HTMLs, a pedido do usuário.
  - **A URL do editor não é a URL do app.** `/home/projects/<id>/edit` é a tela
    de código; o painel precisa da URL do **App da Web**, que tem ~73 caracteres
    de ID e termina em **`/exec`**. A tela do Apps Script mostra essa URL
    **truncada com "…"** — copiar o texto de lá gera uma URL pela metade, que dá
    exatamente o mesmo erro. Usar o botão **Copiar** abaixo de *URL* (não o de
    *Código de implantação*) ou abrir o link e copiar da barra do navegador.
  - ⚠ **`localStorage['rpe_cfg']` tem prioridade sobre a URL do código**
    (`CFG={...CFG,...JSON.parse(s)}`). Quem já salvou uma URL nas configurações
    do painel continua com a dele mesmo depois do deploy — nesse caso, corrigir
    no campo *URL DO APPS SCRIPT* e salvar, ou limpar o campo para voltar ao
    padrão do código.

## Início do turno (célula C3)
- As linhas de **05:00** e **06:00** existem **sempre** na aba `HORA_A_HORA`. Quem
  decide se elas aparecem para o operador é a célula **`C3`** (linha 3, coluna C):
  **`5` → turno começa 05:00** (dia com hora extra matinal, mostra 05:00/06:00);
  **`7` ou vazio → 07:00** (turno normal, esconde 05:00/06:00).
- O **backend** (`ritmoprod_appscript.gs`, função de leitura) lê `C3`, filtra os
  slots anteriores ao início e ainda devolve `turnoInicio` no JSON. Como o filtro
  é no backend, **mobile, TV e gerencial** ficam consistentes de uma vez.
  Lembre: mudar o `.gs` exige **re-deploy manual** no editor do Apps Script.

## Deploy (Vercel)
- Se o painel não atualizar após um merge, conferir se a Vercel construiu a
  `main`: o webhook do push pode falhar silenciosamente (aconteceu no #200 —
  preview da branch buildou, produção não). Re-disparar = qualquer commit novo
  na `main` (PR mínimo como este).

## Arquivos (resumo) → `docs/memoria/arquivos-e-testes.md`
- `ritmoprod_embalagem_v7.html` — painel do PC: GERENCIAL, TV OPERACIONAL e as
  abas. `/diretoria` (e o host `diretoria-…`) é o MESMO HTML no modo diretoria.
- `ritmoprod_mobile.html` — app do celular (`/mobile`), com `sw-mobile.js` e
  `manifest-mobile.json`.
- `rp-core.js` — núcleo comum dos dois painéis, implementação ÚNICA, só função
  pura (nada que leia `DADOS`/`CFG` ou toque no DOM). `paradas-calc.js` — a
  conta de paradas, implementação ÚNICA.
- `ritmoprod_appscript.gs` — backend (Apps Script). ⚠ **Não sobe pela
  Vercel**: colar no editor e re-deployar à mão. O GitHub e o editor não se
  falam: **o repositório é a fonte** (editar só no editor e colar depois o
  arquivo do GitHub desfaz a edição). Mudou o `.gs` → o cabeçalho `Versão:`, o
  `GS_VERSAO` e o `GS_REPO` do painel, os três juntos; o rodapé do painel
  (`#ftr-gs`) fica âmbar até o re-deploy. ⚠ Nova implantação (URL `/exec`
  nova): trocar nos dois HTMLs **e** na `PAINEL_APPS_SCRIPT_URL` da Vercel do
  app de cronoanálise (`crono-analise`), senão as medições param de chegar
  caladas.
- 23 suítes `*.test.js` — `node testes.js` roda todas e o `lint-js.js`. O que
  cada suíte cobre está no arquivo da memória.
- `CHANGELOG.md` (uma entrada por publicação; **Atenção** com antes → depois
  quando muda número exibido ou formato) e `docs/glossario.md` (a fórmula de
  cada indicador, conferida no código).
- `vercel.json` — `/` e `/diretoria` → PC, `/mobile` → celular; os módulos com
  `must-revalidate` (HTML novo com módulo velho é pior que os dois velhos).
- ⚠ **`.vercelignore` — o site publica SÓ o painel** (lista do que sai: `/*` e
  `!arquivo`). Até 16/11/2026 a Vercel servia o repositório inteiro: o CLAUDE.md
  e o `.gs` abriam pela URL do painel. Arquivo NOVO que o painel carrega
  (imagem, módulo, manifest) entra na lista, senão 404 em produção; o
  `deploy.test.js` confere os dois lados.

## Lançamento e correção no app → `docs/memoria/lancamento.md`
- Lança a hora corrente e a recém-fechada por 15 min (`LANC_TOLERANCIA_MIN`,
  `slotLancavel`); hora que termina até 07:00 (madrugada, C3 = 5) aceita o dia
  todo, com a pergunta PRODUTO DA MADRUGADA. Hora mais antiga: só EXCLUIR e
  TROCAR. O bipe abre só a hora corrente. A regra é de tela: o `.gs` não tem
  trava de horário.
- O `.gs` valida antes de gravar (v5.48: inteiro, até 1.000, código no
  cadastro ou na programação); a recusa volta `ok:false` e o app mostra o motivo
  sem retentar. Lançamento depois do fechamento das 17:05 atualiza a linha do
  HISTORICO (v5.49).
- Um lançamento mora em TRÊS abas (`HORA_A_HORA`, `PRODUCAO_PRODUTO`,
  `HISTORICO_MEDIA_FAMILIA`): EXCLUIR e TROCAR PRODUTO são do backend, tudo ou
  nada, idempotentes (`exclId`, `trocaId`), casam pela última célula/linha com
  o mesmo valor.
- ⚠ Excluir vale para qualquer hora de hoje; lançar, não. Produto errado é
  TROCAR — excluir e relançar numa hora fechada perde as caixas.
- ⚠ Chamada à mão no `/exec` (`saveRealizado`) troca o produto atual do turno:
  o operador tem de bipar o produto que está rodando depois. Desde o `.gs` v5.48
  o código é normalizado pelo cadastro (`501.106.005` ou `501106005`).
- Bipe: o volume da etiqueta `(8006)` escolhe o código (`eanAchar`); na dúvida
  não escolhe, nunca o 1º da lista. A leitura fecha com Enter, Tab ou pausa
  (`scanTecla`, `scanPausa`).
- Antes de gravar (`salvarLanc`, nesta ordem): PRODUTO DA MADRUGADA → CONFIRMAR
  O PRODUTO quando ele mudou (por aparelho) → LANÇAMENTO REPETIDO → CONFERIR A
  COR (só com a lista dos próximos dias do `.gs`; TROCAR A COR em destaque, à
  direita).
- O modal de lançamento não fecha no toque fora (tem dado digitado). O PC
  não tem lembrete ⏰ (saiu da TV, a última, na v7.270.0): o aviso de hora sem
  lançamento é só no celular (SEM LANÇAMENTO · AINDA ACEITA na lista).

## Hora extra, meta e o que vai para o HISTORICO → `docs/memoria/hora-extra-e-meta.md`
- Jornada normal 07:00–17:00 (o almoço fica dentro); fora dela é hora extra.
  **Sábado e domingo são hora extra o dia inteiro, sem meta** (`.gs` v5.68 /
  rp-core 1.19.0; revoga a meta pelas horas trabalhadas da v5.60).
- Dois critérios no `.gs`, e trocá-los quebra coisas diferentes:
  `_ehHoraExtra` = QUE LINHA É (só o prefixo `HE `; governa a limpeza e o filtro
  do C3 — ⚠ alargar apagaria as linhas de 05:00 e 06:00) ×
  `_ehHoraExtraCaixas(rótulo, data)` = QUE CAIXAS CONTAM (prefixo, horário ou
  fim de semana).
- ⚠ A janela `HE_JORNADA_*` do `.gs` repete o turno do ⚙: mudou o turno na
  tela, mude as duas constantes.
- Hora extra não tem meta em dia nenhum (tabela, TV, celular). O selo de ritmo
  em caixas julga só a jornada (`efNoRitmo(realNormal, meta, minNorm, …)`: a
  hora em andamento pelos minutos que já passaram, a régua da UEP — v7.265.0;
  sem minuto de jornada lançado, AGUARDANDO).
- Na TV (v7.265.0, *"tem que tirar hora extra"*), nada do que se compara com a
  meta conta a hora extra: % DA META DO DIA e barra (`efDiaJ`), FALTAM
  (`gapJ`), NECESSÁRIO (`necJ`), PROJEÇÃO (`projJ`, a régua do selo; com HE no
  dia, *CAIXAS NA JORNADA*). A hora extra fica na PRODUÇÃO ACUMULADA, separada.
  O NECESSÁRIO é o da UEP em caixas (falta ÷ minutos de jornada que restam).
  O `efDia` (com a HE) ficou no *% feito* do CAIXAS PROGRAMADAS (programado) e
  no resumo do WhatsApp.
- EFICIÊNCIA na TV (telas A e B; nos gerenciais o selo é a UEP e o % é fato
  no card CAIXAS PROGRAMADAS): o número grande é o % da META DO DIA (só a
  jornada), em tinta; o
  veredito é o selo (`slRitmo`: NO RITMO · ATENÇÃO · ABAIXO DO RITMO), pela `efNoRitmo` em
  minutos e só com hora lançada. A projeção não julga.
- Fim de semana no painel: `histDiaFds` relê as linhas antigas, `uepDiaMeta` 0,
  `_diaComMeta`; médias por dia na base dos dias com meta; parada de sábado
  valorada pela mediana das metas dos dias úteis (`metaDiasParadas`).
- FECHAR DIA (`saveDay`: o botão e o das 17:05, que TODO PC aberto roda — vale
  a última gravação) grava a produção da `HORA_A_HORA` sob o lock, a META do
  painel e, ao lado, META DIA (col. 15) e ATRASO META (col. 16). EF = REALIZADO ÷
  a META da própria linha. SOMAR ATRASO é da `CONFIG_PAINEL`
  (`META_COM_ATRASO`); a meta digitada à mão ainda é deste computador.
- ⚠ O ⚙ só envia à `CONFIG_PAINEL` o que o gestor MUDOU (`_metaUepNova`,
  `_atrasoEnviar`, `_setupEnviar`). Mandar sempre deixa um PC que abriu antes de
  ler a config desfazer a escolha da fábrica inteira.
- `HE CX` (col. 11) e UEP, UEP HE e META UEP (col. 12–14, congeladas no
  fechamento). Sem a separação da hora extra: "—", nunca 0.
- ⚠ A planilha reparte a meta do dia pelas horas a partir do C3 (dilui a
  jornada com C3 = 5). Não zerar a meta da madrugada sem mexer no `.gs`: o
  `getDados` pula slot com meta 0 e a madrugada sumiria.

## TV → `docs/memoria/tv.md`
- A TV é o perfil OPERADOR / `?tv`: fundo preto com tokens próprios, lida a
  15 m, sem splash e sem aviso de versão; recarrega sozinha a cada 28 min (por
  isso o timeout de 25 s e o `lerSheetsComRetry`). Modo DEMO na TV = timeout no
  cold start, não perda de dado.
- Carrossel: A/B (a que roda é a B, que espelha a A — linha nova na A precisa
  do espelho no `_sincSlideB`), C (atraso; desde a v7.258.0 em horas de linha,
  o MESMO número do card do gerencial — `_atrasoVencidoPc`; sem cadastro,
  caixas), D (semana passada, `RP_SEMANA.pintar` — um desenho para a TV e o
  gerencial), E (programação do dia por lote), F e G (UEP, desligadas por
  padrão e com o selo desligado: dois vereditos na mesma TV).
- ⚠ "NO RITMO" é palavra do selo, nunca de rótulo. Chave nova de tela na
  `CONFIG_PAINEL`: o `aplicarConfigPainel` preserva a marcação local quando o
  `.gs` antigo não manda a chave; tela desligada por padrão só liga com
  `=== true` (com `!== false`, a config salva antes ligaria a tela na TV da
  fábrica no primeiro deploy).
- F e G: escala medida (`_tvUepCabe`, `--tvu-k`) e o gráfico da G no tamanho
  da caixa (`_tvGSvg(m, selo, dim)`); na G, o número do FEITO sempre. Mexeu
  em texto ou tamanho: medir na TV e no gerencial, ALTURA e largura. ⚠ Número
  nunca na linha `.tvu-nome` (o nome do produto da F, corta com "…").
- G (v7.257.0, "menos informação, mais visibilidade"): UM veredito, o selo de
  sempre — nunca ADIANTADO/ATRASADO por minutos (o PPCP escolheu a variante A);
  minutos enormes e o sentido por extenso (À FRENTE / ATRÁS); a falta SÓ em
  UEP (v7.259.0: as caixas eram a falta ÷ UEP/cx do produto de agora — 2.603
  cx de SLIM fora da programação; saíram também do PARA A META dos dois
  gerenciais, o `faltaCx` do rp-core 1.21.0 e, na v7.259.1, o *≈ N cx/h* do
  RITMO NECESSÁRIO); sem projeção (nem cartão "a
  meta sai", nem pontilhado); só o FEITO tem número no gráfico; sem o rodapé
  "1 UEP = …".
- Tela cheia de PARADA: poll de 15 s só na TV (`_paradaNaTV`); a parada sem FIM
  é a aberta; o START é no celular. PAROU AGORA, motivo depois: TIPO
  `A INFORMAR`.

## Paradas, gestão de perdas e simulador → `docs/memoria/paradas.md`
- A conta mora no `paradas-calc.js` (`RP_PARADAS`), UMA vez; os HTMLs só montam
  as entradas (`metaByDay`, `realByDay`, as classes). Nada de conta de parada
  nos HTMLs (o teste prende).
- `soJornada` (paradas-calc 1.4.0): só o pedaço dentro do turno — usado só pelo
  semanal em UEP; sem a opção, nada muda nas outras telas.
- O almoço (11:00–12:12) fica fora de tudo (`durProdutiva` recorta). Perda em
  caixas = duração produtiva × meta DAQUELE dia ÷ horas produtivas, só das não
  planejadas, arredondada uma vez no fim. Parada em andamento não entra.
- A base da média e da disponibilidade são os dias TRABALHADOS (com
  produção), nunca os dias com parada.
- Segundos: `HH:mm:ss` e `DURACAO_SEG`; `toMin` lê a fração; `fmtMin` é o
  formato único. O `_horaSegStr` é só da PARADAS (não trocar o `_horaStr`).
- Gravar parada retenta (`jsonpEscritaParada`); sem resposta ≠ não gravou
  (relê antes de acusar). ⚠ O `saveParadas` é upsert que regrava a linha
  INTEIRA, FIM incluído: editar (SALVAR MOTIVO) relê antes e manda o FIM do
  servidor, senão desfaz um START dado em outro aparelho; linha sem ID
  (`'L'+linha`) não se edita pelo app. Detalhe em `tv.md` (*Tela cheia de
  PARADA*).
- Telas divergiram? Compare o RITMO primeiro (`diag`, `diagTexto`).
- Leituras em sequência com retry, nunca `Promise.all`; `getParadasPeriodo` é
  das leituras caras (varre a coluna de data, `_valoresPorData`) → cache de 5
  min por período e voo compartilhado
  (`_paradasPeriodoBusca`, `PG_TELA_CACHE`, `PG_VOO`); pedido no meio de uma
  leitura fica pendente, nunca é engolido.
- GESTÃO DE PERDAS: o quadro 2×2 e as seções saem de UMA conta (`_pgContexto`)
  e UM desenho (`_pgQuadroHtml`, `_pgSecaoHtml`); tendência pela régua das
  metades (`_pgMetades`); a meta do SMED desce sozinha quando é atingida
  (`_pgMetaSmed`); "Outros" é A IDENTIFICAR, não anormal; papel enxuto, com o
  ANEXO — COMO LER.
- SIMULADOR (aba própria): `_pgSimulacao` pura; o custo-hora é de hora de
  LINHA e a hora extra é digitada por pessoa; payback e ROI só pela ECONOMIA EM
  HE (a receita potencial nunca entra); nada gravado; o custo-hora não tem
  valor padrão no código.
- O rótulo é CAIXAS PERDIDAS, nunca PEÇAS; "PERDIDO NO RITMO/PARADO" saíram
  (GAP DE RITMO, IMPACTO DE PARADAS).

## Programação e lotes → `docs/memoria/programacao.md`
- A demanda é a `PROGRAMACAO` (+ a `PROGRAMACAO_CONCLUIDA`); a produção, a
  `PRODUCAO_PRODUTO`, que não tem lote. O `calcularProgramacao` casa as duas por
  FIFO, por código, refeito do zero a cada execução.
- Adiantamento: a sobra vira crédito para lote do mesmo código em até 2 dias
  úteis (`ANTEC_DIAS_UTEIS`; a janela compara a data da produção com a do
  LOTE, nunca com hoje — ⚠ não alargar sem medir). A linha futura já mostra o
  adiantado (`adiFut`, STATUS ADIANTADO) e a coluna `ADIANTADO_CX` diz quanto.
- STATUS: EM ANDAMENTO só o lote de hoje; vencido é EM ATRASO; CONCLUIDO
  (ADIANTADO) fica um dia na aba; ENCERRADO pelo X na coluna `ENCERRAR` (criada
  pelo script; `FALSE`, `0`, `N`, `NÃO` não marcam). ⚠ O `.gs` LÊ o STATUS:
  editar à mão muda o FIFO e o arquivamento.
- Linha concluída vai para a CONCLUIDA (`ARQ_MODO='LINHA'`) — nunca apagar: a
  produção dela creditaria outro lote do mesmo código. Volta para a aba se o
  FIFO der saldo de novo (`_desarquivar`, com a DATA no formato da aba). Rodar
  o `simularArquivamento()` antes de confiar.
- `ATUALIZADO_EM` é o carimbo da LINHA: só muda quando a linha muda
  (`_progFase`); o `ADIANTADO_CX` fica fora do `mudou`.
- FERIADOS: aba `FERIADOS`, um dia por linha (férias e parada também); o
  feriado não é dia útil no adiantamento, no aviso de cor nem no PRÓXIMOS DIAS.
- ⚠ Meta do dia baixa? Conferir primeiro se linhas sumiram da aba (soma por
  DATA nas duas abas). A aba chama-se `PROGRAMACAO` (sem acento desde
  15/09/2026); não apagar o `acharAbaTolerante`.
- ATENDIMENTO POR LOTE INTERNO (v7.260.0; 2ª sub-aba da PROGRAMAÇÃO do PC desde
  a v7.261.0, card do app, 🖨): em CAIXAS, a conta no `loteIntMontar` (rp-core) e as linhas no
  `getAtendimentoLotes` (as duas abas; 35 dias desde o `.gs` v5.71, para o
  seletor 10 · 20 lotes da v7.263.0).
  - Embalado da encerrada = o `prodConf`, nunca `QTDE − SALDO` (o SALDO é 0).
  - O 0 sem lançamento é só da linha de hoje.
  - Nomes (v7.263.0, "fácil entendimento"): EMBALADO, EMBALADO NO DIA
    PROGRAMADO, FECHADO COM FALTA (X) = as encerradas, ITENS 100% EMBALADOS,
    AINDA PARA EMBALAR = vencidas na aba; o de hoje, em andamento, fica fora dos
    cartões (a legenda diz quais lotes entram).
  - Sem veredito. O item mostra a cor do cadastro (`nome` = `nomeComCor`;
    `.gs` v5.72 manda a `cor`).
  - A aba lê a programação e DEPOIS os lotes, em sequência. O `_progSub` só
    relê os lotes que falharam.
  - TEMPO (v7.262.0 / `.gs` v5.70): NO DIA, D+1 e D+2+ ÷ programado.
    - Sai do FIFO (`diaRow`, chave `A|`/`P|` por aba; fora do cache e do JSON
      do painel). O crédito conta no dia; o sábado de um lote de sexta é D+1.
    - Não é o "fechou em D+n", que mede o X.
  - Todos os itens, com o %, em UMA tabela com as colunas do lote: o que faltou
    vai em FICOU ABERTO ou AINDA ABERTO. Nada de tabela aninhada, e a coluna
    LOTES (ERP) não se esconde.
  - ⚠ A DATA é o dia em que o lote DEVE ser embalado: NO DIA = cumprimento do
    plano. FICOU ABERTO = caixas aguardando peça, finalizadas no ERP (e no Excel
    VOLUMES PENDENTES do PPCP), não perda. O X continua; não propor deixar a
    linha aberta nem finalizar pelo app (17/11/2026: o porquê está no
    `programacao.md`).

## Produto, cadastro, cor e comparativo → `docs/memoria/produto-e-comparativo.md`
- A cor mora na coluna `COR` da `PRODUTO_CODIGO`; as colunas são achadas pelo
  NOME do cabeçalho (`_porPrefixo` para as que trazem unidade). Agrupa por
  PRODUTO (`produtoDoCodigo`), nunca pelos 6 dígitos (o 501130 tem quatro
  mesas). `MEL` é nome de produto, não cor.
- `nomeComCor` (rp-core): no app a cor é etiqueta na linha do código, e a busca
  olha a cor.
- PONTOS = CUSTO REP do ERP (4 casas). O passado fica congelado no log
  (`_ptsDoLog`); a programação usa o cadastro de agora.
- Comparativo por modelo: média aparada (`_phMediaAparada`, filtro APARADA ×
  COMPLETA), teto da esteira pela média harmônica, teto operacional com a troca
  medida (`_phFatorTrocaPeriodo`: um fator para o quadro todo), cor da
  MÉD.PERÍODO pela `_phCorRitmo`, métricas em UEP. Régua e linhas UMA vez
  (`_phReguaPeriodo`, `_phLinhasPeriodo`) para a tela e o PDF.
- A leitura do período: falha com causa (`_phFalhaInfo` — timeout não é backend
  antigo), voo compartilhado (`_phVoo`), e os dados do período da aba voltam do
  cache depois de todo await (`_phPeriodoVolta`, v7.248.2).
- Relatórios de produção: a CASCATA (META − IMPACTO DE PARADAS − GAP DE RITMO =
  REALIZADO), a cobertura do apontamento e o ganho demonstrado; com modelo
  filtrado, a cascata é contra o potencial do próprio produto.

## Relatórios → `docs/memoria/relatorios.md`
- Peças comuns UMA vez: `_rpCabecalho`, `_RP_HEADER_CSS`, `_RP_FONTS`,
  `_rpBotaoImprimir`, `_rpEsc` e o `_rpDocParadas` (o `<head>` dos relatórios).
  Ao procurar cópia de peça, procurar a marcação E a pele.
- ⚠ A margem da impressão é da `@page`, nunca do padding do body; `tr` não
  parte e o `thead` se repete. Medir papel = mídia de impressão, na largura útil
  da folha, com as fontes carregadas.
- O relatório semanal é documento: cor só com função, o número é tinta e o
  selo é o veredito; `_relMetaHE` (meta batida com hora extra = âmbar); a
  semana é a `_relSemanaJanela` e a `_relSemanaParaDivulgar`.
- Semanal com UEP (v7.251.0): a 1ª folha é ONDE PERDEMOS — resultado, dia a dia
  e motivos (paradas pelo `RP_PARADAS` com a meta de UEP, só dias úteis); as
  caixas no anexo. Mesmo veredito da tela (`_gsemUepMontar`). ⚠ Sem cascata
  META − PARADAS − RITMO (revogada na v7.253.0): a 2.761 é média demonstrada e
  já tem as paradas normais dentro — subtrair todas as contava duas vezes. Desde
  a v7.254.0 o papel mostra as PARADAS ACIMA DO NORMAL (`_relSemNormal`: 4
  semanas antes por dia útil; troca = nº × a meta por troca do SMED) e o dia a
  dia em tempo, sem UEP; só a jornada (`soJornada` do paradas-calc 1.4.0).
- O nome em `APP_NOME`/`APP_NOME_CX` e o slogan em toda impressão.
- Telas enxutas: número nunca sai; texto que só explica vai para o `title` ou
  um ⓘ; função que desenha tela e papel usa `.so-tela` e `.so-papel`.

## Gerencial do PC, do celular e diretoria → `docs/memoria/gerencial.md`
- Os dois gerenciais com a UEP na frente: UEP DO DIA · META é o ÚNICO selo; o
  ATRASO em horas; as caixas são fato, sem cor — só julgam sem a UEP do dia. A
  conta é do rp-core (`uepGerMontar`, `uepHorasDia`, `uepHoraJulga`…), uma para
  os dois.
- Hora julgada: a hora extra, a de agora, a sem lançamento e a recém-fechada
  em ZERO ainda na tolerância (AINDA ACEITA, 15 min) não; a fechada em zero
  depois disso, sim; parte das caixas sem UEP →
  o % com `*`, sem cor.
- Sem a UEP do dia (lendo, falhou, UEP velha), quem julga são as caixas
  programadas: nunca tela sem veredito, nunca dois. **Dado velho** (leitura com
  mais de dois intervalos, `_dadoVelho`; PC desde a v7.248.3): o card diz
  "DADOS DE HH:MM", sem selo; com as caixas velhas também, ninguém julga; o
  selo do cabeçalho diz de quando é o dado.
- PRODUTOS EMBALADOS HOJE (PC e celular): conta `pdiaMontar` no rp-core, sem
  veredito por produto, as paradas na faixa (`pdiaParMontar`); a barra é a
  parte da UEP do dia COM a hora extra.
- Card ATRASO do celular: `atrasoVencido` (rp-core), o mesmo número do cartão do
  PC; guardado no aparelho (`rp_atr_ret`). Desde a v7.249.0 o card (PC e
  celular) e o ATRASO — CONFERÊNCIA dizem também os PONTOS (cadastro de hoje;
  `atrasoPtsTxt`): valor, não tempo; código sem pontos fora e dito, nunca 0.
- FECHAMENTO DA SEMANA PASSADA no gerencial (v7.250.0): a UEP na frente
  (`_gsemUepMontar` → `_pintarUep`), as caixas só em quantidade (sem o % da meta
  de caixas: um % só, o da UEP — v7.252.0); semana sem UEP fica em
  caixas. A Tela D da TV segue em caixas; o 🖨 IMPRIMIR SEMANA, desde a
  v7.251.0, vai em UEP (ONDE PERDEMOS, em `relatorios.md`).
- A aba HISTÓRICO com a UEP na frente (v7.266.0): a conta é a `_gsemUepMontar`
  da semana (`_histUepMontar` acrescenta média/dia, dias que bateram, melhor dia
  e a nota da escala); o hero UEP NA JORNADA · META é o único selo
  (`_gsemSeloTxt`, as palavras do bloco da semana); as caixas são fato na 2ª
  linha, sem cor nem %; o gráfico é o `_uepAbaPerSvg` da ⚖ UEP · PERÍODO; a
  tabela pelo `_histThead` + `_histLinhaHtml` (UEP · META UEP · % DA META ·
  STATUS pela régua do dia fechado do rp-core, ≥ meta — **não** a de 96%). Sem UEP no período,
  tudo em caixas. Sub-abas PERÍODO · ANÁLISE POR HORÁRIO (`_histSub`, a faixa
  da PROGRAMAÇÃO). ⚠ O `_uepAbaPerSvg` leva `pid` (id do padrão listrado por
  desenho — dois na página se misturavam) e `cls` (a cor da tabela por dia).
  O 🖨 IMPRIMIR / PDF da aba (v7.267.0) é feito das MESMAS peças da tela
  (`_histDocUepHtml`: os cards, o `_uepAbaPerSvg`, `_histTheadHtml`,
  `_histLinhaHtml`, `_histCxInfo`) com a pele `_HIST_DOC_CSS` (`.hist-doc`: só
  tokens e classes; a FONTE é `.so-tela`); sem UEP, o papel de sempre em caixas.
  ⚠ Mudou a tela da aba, o papel muda junto — conferir os dois.
- MELHOR H. / PIOR H. e a ANÁLISE POR HORÁRIO do HISTÓRICO em UEP (v7.268.0):
  o % da META DE UEP DA HORA (meta do dia × minutos ÷ 527, a régua do
  gerencial), conta pura `_histHorasMontar` (Σ ÷ Σ; só jornada de dia útil, hora
  com todas as caixas com UEP, dia com o log cobrindo `HIST_HORAS_COB_MIN`, 99%;
  hora extra fora do ranking). FATO, SEM COR — o veredito da aba é o STATUS do
  dia (⚠ não pintar a hora pela `sc`: dava ranking verde com dias ABAIXO). A
  leitura é a `getProducaoModeloPeriodo ?cxHora=1&uepVer=1`
  (`_histHorasCarregar`: uma por período, 4 guardados, uma chamada por vez e
  depois do `_cicloVoo`, até `HIST_HORAS_MAX_DIAS`). ⚠ Quem pede é abrir a aba
  (`_histHorasVencer`), trocar o período, o TENTAR DE NOVO e o 🖨 — NUNCA o
  ciclo de 5 min, que redesenha a aba pelo `renderAll`. Sem ela as colunas
  ficam (CX) e a análise na média histórica de caixas. A jornada:
  `_histSlotsJornada` (quais horas, pelo ⚙; os minutos, pela planilha de hoje).
  ⚠ A análise em UEP é do PERÍODO do filtro, não do histórico inteiro.
- Diretoria: um veredito só (a UEP); retrato guardado no aparelho; sem o
  `pollParadaTV` nem o `lerMediaHoras`.

## UEP → `docs/memoria/uep.md`
- **A RÉGUA DO DIA FECHADO EM UEP É UMA SÓ** (v7.269.0 / rp-core 1.25.0 / mobile
  1.60.0; PPCP: *"a régua tem que ser universal"*): `uepDiaJulga(d)` (ok = jornada
  ≥ META UEP · he = só com a hora extra, âmbar · ruim · fds), `uepPeriodoJulga(res)`
  (a mesma régua na soma dos dias úteis) e `uepDiaSelo(J)` (a palavra e a cor), no
  rp-core — com a REDE no `<head>` dos dois HTMLs para o rp-core antigo em cache
  (a mesma regra, testada contra a do núcleo). Toda tela e papel que julga dia,
  semana ou período FECHADO em UEP lê dela: HISTÓRICO, fechamento da semana,
  relatório semanal, gerencial do dia passado, diretoria, ⚖ UEP · PERÍODO,
  🖨 Estudo de UEP, a coluna EM UEP do 🖨 CAIXAS × PONTOS × UEP e o detalhe do dia
  no celular. ⚠ **Não julgar dia fechado pela `sc`/`sl`/`slRitmo`** (96%/90%:
  são do ritmo AO VIVO e da hora) nem por `uep >= meta` solto — o teste da régua
  universal prende. ⚠ Caixas continuam na `META_PCT` (96%): outra régua.
- A UEP é a régua do esforço: base MESA CABECEIRA MADERO = 1,00 UEP/cx; a meta
  é a do ⚙ (`META_UEP` na `CONFIG_PAINEL`; hoje 2.761, a referência) na jornada
  de 527 min; sem ela, `UEP_META_PADRAO` 2.530. **O padrão foi fechado em
  21/10/2026: a UEP só muda por cronoanálise, na TRAVA DA UEP.**
- UEP por CÓDIGO na `PRODUTO_CODIGO` (`UEP`, `UEP_VIGENCIA`). A `UEP_VERSOES`
  registra a digitação de UMA célula (e as gravações do painel); colar a coluna
  ou gravar pela API não registra o valor antigo. O GRAVAR UEP está travado
  desde 16/10/2026 (`UEP_TRAVADA_DESDE`).
- ⚠ Trocar a escala = no mesmo dia, cadastro × fator, META UEP do ⚙,
  `UEP_META_PADRAO`/`UEP_META_PADRAO_GS`, a `UEP_VERSOES` com o valor antigo e o
  novo, e uma entrada no `UEP_ESCALAS`. O HISTORICO **não** é regravado: não
  rodar o `regravarUepPassada`. Notas da época da base SLEEP (19–21/10: 3.048,
  10,4 s) se leem × 0,83; as de 2.530, 12,5 s e 288 já estão na escala de hoje.
- Desde 13/11/2026 o 2.761 é a META oficial (PPCP); ela só é revista quando a
  cronoanálise cobrir os principais. O relatório CAIXAS × PONTOS × UEP, a 📏
  RÉGUAS e o `UEP_REF_STATUS` ainda dizem *referência* — trocar é a fase
  seguinte (UM NOME POR INDICADOR).
- Sem UEP no cadastro: `null`, fora da conta e listado — nunca 0, nunca a média.
- Aba ⚖ UEP em sub-abas (HOJE, PERÍODO, PRÓXIMOS DIAS, POR PRODUTO, RÉGUAS,
  TAKT DA SEMANA) e o cartão ATRASO; `_uepAbaDados` é a montagem única da tela e
  do papel; trocar de sub-aba redesenha sem ler; as leituras entram em fila
  (`_uepLendo`, `_regAbrir`).
- Relatórios: estudo de UEP (só análise), CAIXAS × PONTOS × UEP (quatro
  páginas), PADRÃO × REALIZADO (faixa 90–110%).

## Cronoanálise → `docs/memoria/cronoanalise.md`
- A régua é o SEM AS LACUNAS, nos dois lados: UEP = sem as lacunas do produto ÷
  6,7 s da MADERO (`UEP_BASE_MEDIDA.seg`). A tolerância (15%) entra só no tempo
  padrão exibido, nunca na UEP.
- A medição vai para a aba `CRONOANALISE` (`registrarCrono`, REG_ID pelo
  conteúdo). Chega sozinha do app de cronoanálise (`origem=app`; a mesma medição
  do app e do PDF não duplica); o 📄 PDF é contingência; EXCLUIR copia para a
  `CRONO_EXCLUIDOS` antes de apagar. ⚠ O app chega pela
  `PAINEL_APPS_SCRIPT_URL` da Vercel dele: implantação nova do `.gs`, trocar lá
  também.
- **A TRAVA DA UEP**: medição válida (30+ volumes, lacunas até 15%); 2 válidas
  somando 100 volumes cumprem a regra; dentro de 90–110% FICA, fora TROCA.
  **Quem decide e trava é o PPCP**, com o código dele (`PPCP_CODIGO` nas
  Propriedades do script, nunca no painel). Travada, a UEP não muda pelo GRAVAR
  nem pela digitação de uma célula.
- NA PRODUÇÃO: as horas com o volume sozinho, sem as paradas apontadas, contra a
  MADERO nas mesmas condições (`_ucvRel`). Abaixo da faixa = apontar e medir de
  novo, nunca engordar a UEP.
- A caixa do VÍDEO é a FECHADA: `MEDIDA_EXT_LARGURA` da PRODUTO_CODIGO (ERP),
  que o `getTemposAlvo` manda como `largura` (`.gs` v5.73). A `MEDIDA DA
  CAIXA` é a ABERTA: segue no tempo-alvo e no teto da esteira. Sem largura, o
  app pede a medida — nunca a aberta no lugar.
- O QUE MEDIR é a agenda completa (o que está na programação primeiro); a
  classe A dá a cobertura. A CONFERÊNCIA DAS TROCAS só informa.
- ONDE O TEMPO VAI: estudo × produção × meta; a diferença não é perda.
- Tempo-alvo de cada produto = esteira ÷ eficiência da embalagem (⚙, 85%), não
  pela UEP; o `getTemposAlvo` serve o app.
- A aba é em sub-abas (MEDIR, O QUE MEDIR, MEDIÇÕES, TRAVA DA UEP, TROCAS, ONDE O
  TEMPO VAI), com um menu 🖨 e o ✕ LIMPAR.

## Plano e carteira → `docs/memoria/plano-e-carteira.md`
- Aba PLANO, duas sub-abas: A CARTEIRA QUE VEM (os lotes datados contra a
  capacidade demonstrada) e COMO TEMOS DATADO (altura e oscilação da meta). UMA
  régua para os dois (`_qpCurva(dias, QP_REGUA)`, `QP_FAIXA`); capacidade = a
  jornada normal, sem hora extra (`_qpDiasBase`).
- A carteira em CARGA pelo mix (`_mixFator`), em caixas cruas ou em UEP; o E SE
  AS PARADAS CAÍSSEM X% pela conta do `RP_PARADAS`; a escolha em `rpe_qp_pref`.
- ⚠ A carteira não soma o `falta` (ele é por código). Vazio tem causa
  (`_progDetFalhaInfo`). Re-datação automática foi recusada pelo PPCP: não
  propor de novo.
- PRÓXIMOS DIAS (aba ⚖ UEP): a carteira em horas de linha (UEP ÷ ritmo da meta),
  por semana, cada dia só com os lotes dele; o atraso à parte (ATRASO —
  CONFERÊNCIA); linha sem UEP fora e listada.
- Impressões 🖨 ESTUDO e 🖨 CARTEIRA (paisagem): a mesma marcação da tela, com a
  pele `.plano-doc`.

## TAKT DA SEMANA → `docs/memoria/takt-semana.md`
- Sub-aba da ⚖ UEP: ESTA SEMANA, SEMANA QUE VEM, 4 SEMANAS e AVALIAR
  PROGRAMAÇÃO. A leitura é o `getProgramacaoSemana` (as duas abas, o saldo da
  própria linha, o `vencidoAntes`, o `adiantadoCx`).
- O veredito é em HORAS DE LINHA (UEP × 527 ÷ META UEP), PRECISA × TEM, SEM
  descontar o setup. FALTAM e SOBRAM por extenso, nunca por sinal; a sobra não
  vira crédito para outra semana.
- O porquê é dia a dia (carga × ritmo), nunca a semana somada. Embaixo de cada
  dia do DIA A DIA, o RITMO (v7.273.0: feito na jornada ÷ a média, inteiro,
  *"ritmo 110% da média"*, sem cor); o recado do gráfico é o ritmo da semana. O setup do ⚙
  (`SETUPS_DIA`, `SETUP_MIN`, no domínio do app: trocas inteiras, minutos com 1
  casa) só entra nos SEGUNDOS (takt, TEMPO-ALVO, AGORA). O PPCP digita o mesmo
  no app de cronoanálise — o painel não lê o setup do app; a faixa NA LINHA E NO
  APP dá os volumes e o takt para levar ao app.
- 4 SEMANAS: dia útil sem lote fica fora; lote em sábado ou feriado é hora
  extra já programada; a sugestão de hora extra vai semana a semana (sábado e
  feriado das 05:00 às 11:00, dia útil até 2h, feriado religioso fora).
- ⚠ O TEMPO-ALVO (pela esteira) e o PELO TAKT (pela UEP) não se comparam.
- A planilha de produção do PCP (Excel, fora do repositório) tem o mesmo teste
  CABE/PASSA.

## Leituras, versões e o resto da infraestrutura → `docs/memoria/infraestrutura.md`
- Apps Script: uma chamada por vez; leitura cara com cache, voo compartilhado e
  retry em sequência. O `.gs` tem cache por geração (`rp_gen`; resposta acima
  de 100 KB vai em partes desde a v5.74 — `_cachePutJson`/`_cacheGetJson`) e memo por
  execução (só leitura usa; escrita lê direto); a leitura recortada por data
  (`_valoresPorData`) usa a conversão de data do CHAMADOR. ⚠ O FIFO
  (`lerEmbaladoPorProduto`) lê a produção INTEIRA, e deve — recortar faz a
  produção antiga creditar outro lote do mesmo código; e o recorte nunca entra
  no `_valoresMemo`.
- O ciclo do PC é sequencial (`_cicloLeitura`) e anda pela HORA MARCADA
  (`_proxCiclo`, v7.248.3), nunca por tique: escondida (atrás de outra janela,
  minimizada) a janela recebe ~1 tique por minuto, e o contador por tique fazia
  os 5 min virarem horas. A janela que volta para a frente lê na hora se a hora
  passou. O do celular é escalonado (90 s as paradas, 3 min os dados e a UEP do
  dia, 6 min o histórico).
- Versões: PC `APP_VER` (barra de atualização; sem service worker de
  propósito — a TV mostraria produção velha); celular `APP_VER` + o `CACHE` do
  `sw-mobile.js`. As CDN do PC são `defer`, com a fila do `mkChart`; o celular
  não usa CDN.
- O splash some pelo CSS; a TV não tem splash; `prefers-reduced-motion` é solto
  no PC e inteiro no celular.
- O nome `RitmoPatrimar` mora em `APP_NOME`; arquivos, chaves `rpe_*`/`rp_*` e o
  `id` dos manifests não se renomeiam.
- Cores: tokens azul-marinho; a TV continua preta; `--txt3` legível; o Chart.js
  usa cor literal.
- PWA: no celular o app é o `/mobile`; o PC instala sem service worker; o botão
  INSTALAR fica sempre visível.
- Ícone do app = a estrela com a caixa vermelha (v7.255.0); o `patrimar-logo.png`
  (logo da empresa) não muda. ⚠ Trocou o ícone: subir o `?v=` nas 2 páginas e
  nos 4 manifests (o `deploy.test.js` confere).
- ⚠ Gravar na planilha pela API (correções à mão): número vai como NÚMERO
  JSON, nunca texto (`"170.578"` vira milhar); fórmula em pt-BR (`;` e
  vírgula); e a API não passa pelo `onEdit` (não versiona UEP, não desfaz edição
  de UEP travada e não renova o cache — depois, `invalidarCacheLeitura()` no
  editor; desde a v5.74 o `getProdutos` também fica no cache).
- ⚠ `localStorage['rpe_cfg']` vence a URL do código. As colunas de lançamento
  são `LANÇ 1…10`: o `startsWith('L')` é o que faz o lançamento funcionar — não
  endurecer.
- Os achados dos 6 revisores (31/08/2026) estão registrados no arquivo.
