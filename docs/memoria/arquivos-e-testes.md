# Arquivos e o que cada suíte de teste cobre — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## Arquivos
- `ritmoprod_embalagem_v7.html` — painel desktop (telas **GERENCIAL** e **TV OPERACIONAL**).
- `ritmoprod_mobile.html` — painel mobile.
- `rp-core.js` — **núcleo comum dos dois painéis, implementação ÚNICA**:
  formatação (`p2`/`fmtN`/`fmtP`), horário (`toMin`/`fromMin`/`normHora`), data
  (`hojeStr`/`dtToStr`), `mergeMedias`, `calcAtrasoHoras`, `sc`,
  `atrasoVencido` (o card ATRASO do celular, 1.14.0), `pdiaParMontar` (as
  paradas na faixa do PRODUTOS EMBALADOS HOJE, 1.16.0), `uepGerMontar` e
  companhia (o gerencial com a UEP na frente, PC e celular, 1.18.0), `histDiaFds` /
  `uepDiaHe` (sábado e domingo todo hora extra, 1.19.0), `metaDiasParadas` /
  `metaMedianaUteis` (a parada de fim de semana pela mediana dos dias úteis,
  1.19.0). Só função
  **pura** entra aqui — nada que leia `DADOS`/`CFG` ou toque no DOM.
  `node rp-core.test.js` cobre a regra e falha se algum HTML voltar a declarar
  a própria cópia.
- `paradas-calc.js` — **cálculo de paradas, implementação ÚNICA** usada pelos
  dois painéis (`<script src="/paradas-calc.js">`). Ver a seção de paradas.
- `paradas-calc.test.js` — teste de paridade: `node paradas-calc.test.js`.
- `relatorios.test.js` — contas dos relatórios (janela da semana, KPIs, hora
  extra) + guarda-corpo das peças comuns: `node relatorios.test.js`.
- `hora-extra.test.js` — teste da separação hora normal × hora extra, rodando
  contra o código real do `.gs` (e o fim de semana inteiro, `.gs` v5.68, com o
  "hoje" do `getDados` fixo): `node hora-extra.test.js`.
- `apps-script.test.js` — memo de leitura do backend, com planilha de mentira
  que conta leituras, **e o carimbo `ATUALIZADO_EM` da `PROGRAMACAO`** (roda a
  função real): `node apps-script.test.js`.
- `parada-motivo.test.js` — PAROU agora, motivo depois (mobile 1.47.0 /
  v7.234.0): o PAROU grava A INFORMAR, o quadro da parada aberta, a lista depois
  do START, o SALVAR MOTIVO que relê antes de gravar, a TV e a GESTÃO DE PERDAS:
  `node parada-motivo.test.js`.
- `lancamento.test.js` — qual hora aceita lançamento no mobile (hora corrente +
  tolerância da recém-fechada), contra o código real, e o lançamento RECUSADO
  pelo servidor (mobile 1.41.0, o `salvarLanc` real) e a CONFIRMAR O PRODUTO
  (mobile 1.46.0): `node lancamento.test.js`.
- `etiqueta.test.js` — a leitura da ETIQUETA pelo bipe do celular (mobile
  1.45.0): o volume da etiqueta escolhe o código, com linhas reais do cadastro
  (MEL, ANTARES, SLEEP), e na dúvida o app não escolhe; roda o `eanAchar` e o
  `processarBipe` reais, e quando a leitura do teclado fecha (mobile 1.48.0:
  Enter, Tab, pausa, leitor lento, `scanTecla`/`scanPausa`): `node etiqueta.test.js`.
- `exclusao.test.js` — EXCLUIR e TROCAR PRODUTO do lançamento:
  `getLancamentosHora`, `excluirLancamento` e `trocarProdutoLancamento`
  rodando o `.gs` inteiro numa planilha de mentira (as três abas, o
  tudo-ou-nada, o exclId/trocaId, o dia fechado, a família) e o aviso de
  lançamento repetido, a lista, as confirmações e o seletor no modo troca do
  celular: `node exclusao.test.js`.
- `tela-e.test.js` — Tela E da TV (programação do dia): ordem, situação, corte
  de linhas, entrada no ciclo, config, e a cor/`atrasoDesde` do
  `calcularProgramacao` real: `node tela-e.test.js`.
- `tela-uep.test.js` — Telas F e G da TV (UEP do dia): a conta do
  `_tvUepMontar` no retrato real de 16/10 15:02, os desfechos da corrida, o
  peso normal, o desenho sem veredito com o selo desligado e a config
  desligada por padrão (painel e `.gs`), a marca de troca de escala da UEP
  (`UEP_ESCALAS`) e o gráfico da G no tamanho real da caixa (v7.173.0: os
  rótulos nas quatro caixas medidas, as linhas e o encaixe):
  `node tela-uep.test.js`.
- `uep-relatorios.test.js` — 🖨 FILA DE CRONOANÁLISE e 🖨 CAIXAS × PONTOS × UEP
  (as três réguas nos 20 dias reais de 29/09–28/10/2026; v7.188.0: as quatro
  páginas, o atingimento e os dias na meta, a referência de UEP de cada data e
  o que investigar): motivos, ordem e janela da fila; e os 18 dias reais de 21/09 a 16/10
  (5 discordâncias, todas pela meta em caixas alta); e o ⏱ CRONOANÁLISE → UEP
  (Armário Encanto de 19/10: 27,8 s → 2,22), mais a regra da UEP e a TRAVA
  DA UEP (v7.233.0; até a v7.232.0, a regra da troca por amostra, o ✓ TROCAR
  A UEP e as PRONTAS), a CONFERÊNCIA DAS TROCAS, a paridade da regra com o
  `.gs`, o NA PRODUÇÃO (o volume sozinho, SEM as paradas, contra
  a MADERO — com o log e as paradas reais da ELOA e da MADERO de 26/09–25/10) e
  o 📄 IMPORTAR PDF (com o texto do PDF real
  de 26/10, o nome do app com "caixa 2/2" e o de 03/11 com o VOL 1/3 no título), os PRINCIPAIS PARA ANÁLISE DE
  TEMPO (v7.189.0: o corte dos 80%, a situação e a cobertura; v7.191.0: a ordem pela programação), as sub-abas da ⏱ CRONOANÁLISE (v7.197.0), e a aba 📏 RÉGUAS (o mix de 70
  pontos por UEP nos 20 dias reais, as quatro situações produto a produto com a
  SLEEP de verdade, a meta do ⚙) e a régua SEM AS LACUNAS (v7.200.0: a UEP de
  cada medição pelo sem as lacunas ÷ 6,7, o PDF real da HOME ANGEL de 04/11, o
  RODANDO obrigatório no registro, a base que não é a medida não registra, a
  base antiga guardada apagada) e o CHEGARAM DO APP do MEDIR (v7.218.0: as
  medições reais do app de 06 e 09/11, a janela, a linha aberta, o 💾 que
  some com a medição já registrada) e a TRAVA DA UEP (v7.233.0: a regra —
  medição válida, 2 válidas somando 100 volumes, FICA/TROCA e a borda — com os
  casos reais de 12/11, a paridade com o `.gs`, a sub-aba, o diálogo do PPCP,
  as respostas e o fluxo real do `_ucvTravaEnviar`): `node uep-relatorios.test.js`.
- `programacao.test.js` — produção ADIANTADA, coluna ENCERRAR e aviso de cor
  errada do app. Carrega o `.gs` **inteiro** numa planilha de mentira e roda o
  caminho real (calcular → gravar saldo → arquivar → recalcular), e a ORDEM do
  dia no `getProgramacaoDetalhada` (v5.37), e a DATA no formato da aba na
  linha que volta da CONCLUIDA (v5.45), e a PROGRAMAÇÃO DA SEMANA (v5.59:
  `getProgramacaoSemana` — as duas abas, o saldo só da própria linha, cada dia
  igual à META do dia), e o TAKT DA SEMANA dos tempos-alvo (v5.63: as 6 semanas
  do `getTemposAlvo` contra o `_taktMontar` REAL do painel, extraído do HTML,
  com lote no sábado, domingo e feriado; o que falhou não fica no cache), e o
  LOTE DE HOJE antes do 1º lançamento (v5.66: PRODUZIDO e SALDO vazios → a
  QTDE; vencida ou com o SALDO de outra linha, null; o `vencidoAntes`), e o
  `adiantadoCx` por linha (v5.67: a coluna ADIANTADO_CX, null sem ela ou com o
  SALDO de outra linha):
  `node programacao.test.js`.
- `uep-padrao.test.js` — UEP padrão versionada (`UEP_VERSOES`), trava do GRAVAR
  UEP e o bloco 7 da aba ⚖ UEP (padrão × realizado por produto; v7.206.0: a
  linha do produto na régua de hoje e o "% com X"). Carrega o
  `.gs` **inteiro** e a conta do painel: `node uep-padrao.test.js`.
- `fechamento.test.js` — FECHAR DIA (`.gs` v5.29): o `saveDay` grava a produção
  da HORA_A_HORA (carimbo `dataDados` do dia) e não o retrato do painel; o caso
  real de 19/10 (painel 1.491 × planilha 1.509) e a mesma conta do
  `arquivarDiaAtual`, rodando o `.gs` inteiro; e a opção A (`.gs` v5.55): a
  META do painel com META DIA e ATRASO META nas colunas 15–16, e a paridade do
  `_metaPartes` do painel com o `saveDay`; e o fim de semana (`.gs` v5.68,
  revoga a v5.60): o sábado real de 07/11 TODO hora extra (META, EF, META DIA,
  ATRASO e META UEP 0, HE CX = REALIZADO, a UEP em UEP HE) nos três
  fechamentos, a linha gravada pela v5.60 zerada no lançamento seguinte, o
  domingo, o dia útil igual, o sábado só de madrugada, a HISTORICO_HORA com as
  horas de 07–17 e o `preencherUepPassada`; e o SETUP DO TAKT na
  CONFIG_PAINEL (`.gs` v5.61: os dois juntos, no domínio do app — trocas
  inteiras, minutos com uma casa, o dia abaixo de 527 —, zero vale, vírgula à
  mão na planilha, "8 min" nunca vira 0, e a MESMA régua no ⚙ e no `.gs` em 17
  casos): `node fechamento.test.js`.
- `crono-registro.test.js` — REGISTRO DA CRONOANÁLISE (`.gs` v5.30):
  `registrarCrono` e `getCronoRegistros` rodando o `.gs` inteiro numa planilha
  de mentira (aba nasce sozinha, REG_ID não duplica, grava pelo nome da coluna,
  vazio fica vazio) e o EXCLUIR (`excluirCrono`, v5.33: cópia na
  `CRONO_EXCLUIDOS` antes de apagar, retentativa, lock de pé, a última linha
  não congelada), o `trocarUepCrono` (v5.34 gravava; desde a v5.64 sempre
  recusa — a troca é o `travarUep`), o `getConferenciaCrono` (só as horas do volume
  sozinho, depois da troca, hoje fora — até a v5.35; na v5.36 só a troca) e o
  `getHorasCrono` (v5.35: o log da janela hora a hora, código por código; v5.36:
  as paradas apontadas de cada hora, por tipo) e a régua SEM AS LACUNAS (v5.44:
  o `registrarCrono` pede o S_SEM_LACUNAS, a troca sai dele e ignora o rodando e
  a UEP gravada, toda resposta diz `regua:'lac'`) e a MEDIÇÃO DO APP (v5.58: o
  rótulo vira modelo, volume, códigos e UEP do cadastro pela régua do painel, as
  recusas, a mesma medição app × PDF não duplica, a paridade com o `_capNome`,
  a base e os limites do painel) e a TRAVA DA UEP (v5.64: `travarUep` troca ou
  mantém e trava, o código do PPCP — sem a propriedade, errado, 5 erros
  bloqueiam —, a regra refeita contra a planilha, a `UEP_TRAVA` e a
  `UEP_TRAVAS`, o idempotente, o `destravarUep` com motivo, o `trocarUepCrono`
  que sempre recusa, o GRAVAR UEP que pula o travado e o `onEdit` que desfaz a
  digitação de uma célula) e o TEMPO-ALVO (v5.62/v5.65: `getTemposAlvo` pela
  esteira) com a LARGURA DA CAIXA FECHADA (v5.73: a `MEDIDA_EXT_LARGURA` por
  prefixo, o jogo sem largura, o código em branco que não conta, o texto
  pt-BR pelo `_numBR`): `node crono-registro.test.js`.
- `pontos.test.js` — PONTOS do passado congelados (`.gs` v5.40): o dia e o
  período somam o PONTOS gravado no lançamento, não o cadastro de agora. Roda o
  `.gs` inteiro (lançar, trocar o cadastro, lançar de novo):
  `node pontos.test.js`.
- `produtos-dia.test.js` — PRODUTOS EMBALADOS HOJE dos dois gerenciais
  (mobile 1.39.0, PC v7.201.0): a conta `pdiaMontar` do rp-core e os desenhos
  reais (`_pdiaHtml` do celular, `_pdiaPcHtml` + a leitura
  `renderGerProdutosDia` do PC), com o log e o cadastro de 04/11/2026 (PRISM,
  HOME ANGEL, LIVREIRO): ordem, trocas, faixa, cor × volume, AGORA, hora extra,
  cobertura e os casos de borda (A,B,A,B na hora, madrugada lançada depois,
  501130 com mesas irmãs, sem UEP); no PC, o "lendo" antes da 1ª leitura e o
  cadastro lido no clique uma vez só; e (v7.236.0 / mobile 1.49.0) as PARADAS
  NA FAIXA: a `pdiaParMontar` contra o `RP_PARADAS.stats`, o almoço, a aberta,
  os estados da leitura, o motivo com aspas, a fila ao abrir o GERENCIAL e o
  toque do celular (15 de 15 mutações): `node produtos-dia.test.js`.
- `takt-semana.test.js` — sub-aba TAKT DA SEMANA da ⚖ UEP (v7.209.0), com o
  retrato real de 06/11/2026 11:58 (as 49 linhas da semana 02–08/11 do
  `getProgramacaoSemana`, os dias fechados do HISTORICO e o hoje da aba): os
  três números em s por UEP, o porquê dia a dia (e por que não a semana
  somada), a falta e o que cabe, o AGORA em caixas (hora só do produto e hora
  com outra cor), o sábado trabalhado, a espera entre leituras, os estados do
  botão, o desenho sem conta e a ligação com a aba; e (v7.210.0) a SEMANA QUE
  VEM com a programação real de 09–15/11 (o mesmo 2h13 do PRÓXIMOS DIAS, a
  redistribuição, o adiantado), a SIMULAÇÃO nos três ritmos e a 🖨 para a
  diretoria (as duas causas na conclusão; 8 de 8 mutações pegas); e
  (v7.211.0) o veredito em horas de linha das duas semanas (o 2h13 igual ao
  PRÓXIMOS DIAS e à simulação, a soma com a sobra desta semana, o sábado, a
  semana que cabe, as caixas sem UEP fora do peso), o gráfico em horas e a 🖨
  sem s por UEP (6 de 6 mutações pegas); e (v7.212.0) a falta em pontos pelo
  mix da semana (o mapa do cadastro, o código com ponto ou traço) e o nome
  "média da linha entregue sem hora extra" (5 de 5); e (v7.222.0) o nível
  diretoria: UM número no veredito com dias, caixas e pontos arredondados, o
  ritmo só fora de ±5%, o PARA FECHAR (hora extra, adiar, remanejar), o que vem
  desta semana somado numa barra, o excesso em vermelho e o dia mais carregado
  (3 de 3 mutações); e (v7.223.0) ESTA SEMANA e AVALIAR PROGRAMAÇÃO no padrão
  da SEMANA QUE VEM: o programado cheio com o excesso em vermelho, o porquê no
  título do gráfico, a caixa de colar recolhida, o bloco A LINHA CHEGA (a soma
  em barra só quando fecha, a folga que não cobre, o em dia) e a tabela nos
  detalhes; e (v7.225.0) o SETUP do app: o *takt no app* da faixa com os
  números da tabela PROGRAMA GRAVADO do app (038-26 18,7 s · 193 vol/h, 039-26
  15,4 · 234, 040-26 12,7 · 284) e o takt, a referência e o executado do
  painel sem o setup, a última hora do AGORA na mesma régua, o cx/h de
  relógio e a semana refeita com setup zero (12 de 12 mutações); e (v7.226.0)
  o setup do ⚙ (a ordem gravando → planilha → computador → padrão, o setup
  médio 4 × 8,2 contra a conta do app, o zero, o que não cabe na jornada, os
  campos no domínio do app, o que impede salvar, o envio do que mudou e do
  digitado antes do re-deploy, a resposta da planilha); e (v7.232.0) a tela
  enxuta: o agora em s por caixa na faixa NA LINHA E NO APP, o que saiu (cartões
  em s por UEP, frase, cascata, AGORA e DETALHES da esta semana), a ordem do
  olhar nas três telas e o PARA FECHAR numa linha sem repetir as caixas; e
  (v7.242.0) o PRECISA em partes (atraso · hoje · dias que vêm, o retrato real
  de 13/11, o arredondamento do acumulado, 4.000 sorteios, a tela e o 🖨); e
  (v7.245.0) o vencido de antes da segunda e o lote de hoje no PRECISA, com o
  retrato real de 16/11 06:54 (FECHA sobram 3h39 → NÃO FECHA faltam 6h07; as
  quatro partes; o não lido avisado; as 4 SEMANAS com o mesmo número; 9 de 10
  mutações — a 10ª é equivalente); e (v7.246.0) o EMBALOU ANTES na barra do
  dia (o 25441 de 16/11: 838 cx, 5h20; tela, papel, legenda, sem o campo):
  `node takt-semana.test.js`.
- `lote-interno.test.js` — ATENDIMENTO POR LOTE INTERNO (v7.260.0 / `.gs` v5.69).
  - A fixture são as 247 linhas reais de 17/11. Confere:
    - a conta do `loteIntMontar` (97,4%, 405 cx em 85 itens, 31 de 118
      completos, 36 cx ainda abertas);
    - o `getAtendimentoLotes` real numa vm (as regras do embalado, a janela, a
      descrição em toda linha desde a v5.70 — até a v5.69, só na incompleta);
    - o desenho do PC na tela e no papel, e o do app (escape, clique por
      índice, sem conta no desenho).
  - Pegou 9 de 9 mutações.
  - Desde a v7.261.0, confere também as sub-abas da PROGRAMAÇÃO: a faixa, os
    painéis, o `_progSub` num DOM de mentira (só relê o que falhou, nunca com
    leitura em voo) e o texto dos dois botões. Pegou 8 de 8 mutações.
  - Desde a v7.262.0, confere também:
    - o % de cada item e o tempo (no dia, D+1, D+2+) no modelo;
    - o mapeamento A/P do `diaRow` no `.gs`;
    - a tabela única, com as 13 colunas em toda linha e cada número do item
      na coluna do lote;
    - o escape, o papel e o app.
    - O FIFO real fica no `programacao.test.js`.
    - Pegou 20 de 20 mutações: `node lote-interno.test.js`.
- `cache-partes.test.js` — RESPOSTA ACIMA DE 100 KB VAI AO CACHE EM PARTES
  (`.gs` v5.74): o `doGet` real numa vm, com um CacheService que RECUSA valor
  acima de 100 KB (como o do Google) e 431 códigos no formato da PRODUTO_CODIGO
  de 19/11. Confere: a 2ª chamada sai do cache sem ler a planilha; parte que
  sumiu relê e devolve a resposta inteira; gravar (geração nova) relê; o que
  cabe numa chave segue igual; par substituto na fronteira, 3 bytes por
  caractere, acima de 10 partes e marcador que não soma o tamanho. Pegou 5 de
  5 mutações: `node cache-partes.test.js`.
- `testes.js` — **`node testes.js`: todas as suítes + o lint**, uma de cada vez,
  com o resumo; sai com 1 se algo falhar; suíte que passa de 2 min reprova
  (v7.248.2).
- `lint-js.js` — **a parte automática do padrão** (v7.248.2; até a v7.248.1 era
  só o `no-undef` dos dois HTMLs). Confere os dois HTMLs, o `rp-core.js`, o
  `paradas-calc.js`, o `sw-mobile.js` e o `.gs`, e diz a linha do PRÓPRIO
  arquivo (fora dos `<script>` tudo vira espaço):
  - **função e constante sem uso** no nível de cima (coluna 0). Comentário de
    linha ou de bloco, em qualquer ponto, não conta como uso; nome em texto
    conta (o onclick montado). Roda sem rede. Fica de propósito → `SEM_USO_OK`,
    com o porquê;
  - **eslint** (o npx baixa na 1ª vez; sem npx ou sem rede, avisa e roda só a
    de cima; qualquer outro erro do eslint REPROVA, nunca "pulado"): `no-undef`, `no-redeclare`, `no-dupe-keys`, `no-duplicate-case`,
    `no-dupe-else-if`, `no-self-assign`, `no-unreachable`, `no-const-assign`,
    `no-unused-vars` (só locais).
  - Por que existe: nenhum teste de conta vê um identificador que não existe, e
    o painel só quebra em runtime — o relatório do período morreu duas vezes no
    *"Carregando relatório…"* (`ehCor` fora do `const {...}=_phAgrup()`,
    `_fonteHoje` declarado dentro do `calcPorModelo`).
  - **Nome novo nas listas de globais (`G_MODULOS`, `G_APPS_SCRIPT`…) só
    depois de conferir que ele existe mesmo** — senão a guarda vira enfeite.
  - Conferido por mutação: 7 de 7 erros plantados pegos, na linha certa; a
    função citada só num comentário de fim de linha; a regra do eslint mal
    escrita reprova. A 1ª versão (revisão do `/revisor-codigo` na própria
    estreia) só tirava comentário de linha inteira e pulava calado qualquer
    erro do eslint.
- `docs/padrao-codigo.md` — o padrão do código (a régua do revisor).
- `.claude/skills/revisor-codigo/SKILL.md` — o revisor do projeto (`/revisor-codigo`).
- `ritmoprod_appscript.gs` — backend (Apps Script). **Mudanças aqui NÃO sobem pela
  Vercel**: precisam ser coladas no editor do Apps Script e **re-deployadas** manualmente.
  - ⚠ **O GitHub e o editor do Apps Script não se falam** (PPCP, 05/11/2026:
    *"quando muda gs está salvando no git?"*). As v5.45–v5.56 foram feitas em
    outra conversa e subidas à mão (`9949a4e`, `0a42580`, `d349f79`). **O
    repositório é a fonte**: mudança no `.gs` nasce aqui ou é subida no mesmo
    dia — editar só no editor e colar depois o arquivo do GitHub desfaz a
    edição.
  - **Desde a v5.57 o rodapé do painel diz qual `.gs` está implantado**
    (`GS_VERSAO` no `.gs` → `gsVersao` do `getDados` → `GS_IMPL`; o painel traz
    o `GS_REPO`, a versão que foi junto com ele; `_gsVerEstado` /
    `_gsVerPintar`, etiqueta `#ftr-gs`): `gs v5.57` neutro quando batem;
    âmbar *"gs vX · repo vY"* quando não (o *title* diz se é para colar o
    arquivo ou para subi-lo); `gs ?` com o `.gs` anterior à v5.57. Mudou o
    `.gs`? **Suba os TRÊS: o cabeçalho `Versão:`, o `GS_VERSAO` e o `GS_REPO`
    do painel** — o `apps-script.test.js` falha se divergirem. Entre o merge e
    o re-deploy a etiqueta fica âmbar: é o lembrete de colar o arquivo.
  - Implantar sozinho a cada merge (clasp + GitHub Actions) foi proposto e
    NÃO feito: pede a credencial Google da conta dona do script como segredo
    no GitHub e põe todo merge direto na produção da fábrica.
- `vercel.json` — `/` → v7, `/mobile` → mobile.
- Deploy front-end: automático pela Vercel ao dar merge na `main`.
