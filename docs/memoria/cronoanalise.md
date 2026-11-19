# Cronoanálise — memória detalhada

Parte da memória do projeto. O resumo do que vale hoje está no `CLAUDE.md`, na
seção deste tema; aqui fica o detalhe: o porquê de cada regra, os casos reais,
as medições e o histórico. É o texto que estava no `CLAUDE.md` até 16/11/2026
(v7.248.2), movido sem cortes. Regra riscada (`~~…~~`) está revogada.

Mudou uma regra deste tema? Registre aqui, com a data e o caso, e, se muda o
que vale, atualize também a linha do resumo no `CLAUDE.md`.

## EXCLUIR UMA MEDIÇÃO DA CRONOANÁLISE (v7.157.0 / `.gs` v5.33)
- PPCP, 26/10/2026, com a aba CRONOANALISE na mão: *"vou ter que excluir
  estudo"* → *"sim fazer"*. Recomendação dada antes: excluir a linha na
  planilha bastava (a aba só alimenta a lista da ⏱ CRONOANÁLISE) — o PPCP quis
  o botão.
- **EXCLUIR** em cada linha da lista MEDIÇÕES REGISTRADAS (`_ucvRegsHtml`, 4º
  parâmetro = exclusão em curso: EXCLUINDO… e todos travados, uma de cada vez,
  `UCV_EXCL` declarado junto do `UCV_REGS`). `_ucvExcluir` → confirmação
  (`_ucvExclConfirmaTxt`) → `excluirCrono&regId=` por `jsonpEscrita` →
  `_ucvExclResposta`. **Sem resposta ≠ não excluiu**: espera a leitura em voo
  (é de antes da exclusão), relê a lista e decide pelo `_ucvExclConfere`.
  Mensagem em `#uep-conv-x-msg`, FORA da lista (refeita a cada tecla).
- **Só linha com o REG_ID do painel** (`_ucvExclPode`: `[A-Za-z0-9_-]`, até
  40): o id vai num atributo e no clique, e o `_rpEsc` não escapa aspas. Linha
  digitada à mão na planilha mostra "—" e se exclui lá.
- `.gs` `excluirCrono`, sob o lock: acha a ÚLTIMA linha com o REG_ID, **copia
  a linha inteira para a `CRONO_EXCLUIDOS`** (EXCLUIDO_EM, LINHA_ORIGINAL e as
  colunas da CRONOANALISE pelo nome — `_cronoHdr`, o mesmo do registro) e só
  então apaga. Cópia falhou → nada é apagado.
  - Idempotente: a linha não está mais lá mas o REG_ID está na
    CRONO_EXCLUIDOS → `jaExcluido`; em nenhuma das duas (apagada à mão) →
    `naoAchou`, com **`ok:true`** — com `ok:false` o `jsonpEscrita` retentaria
    três vezes uma coisa que não vai mudar.
  - Antes do `deleteRow`, se só sobra uma linha não congelada, insere uma em
    branco: o Sheets não apaga a última linha não congelada.
- Desfazer = copiar a linha de volta da CRONO_EXCLUIDOS (sem as duas primeiras
  colunas) ou registrar de novo a mesma medição (o REG_ID é o mesmo e entra).
  **Corrigir = excluir e registrar de novo**: registrar a certa sem excluir a
  errada deixa as duas no veredito ("discordam").
- ⚠ Mudou o `.gs` → **re-deploy manual**. Antes dele o EXCLUIR diz que falta o
  `.gs` v5.33 e não exclui nada. A UEP do cadastro não muda em caso nenhum.
- Testes: `crono-registro.test.js` (o `.gs` inteiro) e `uep-relatorios.test.js`
  (desenho, respostas e o fluxo real do `_ucvExcluir` com o Apps Script de
  mentira — os testes assíncronos rodam antes do resumo). Conferidos por
  mutação.

## TROCAR A UEP PELA CRONOANÁLISE, IMPORTAR PDF e CONFERÊNCIA (v7.158.0 / `.gs` v5.34)
- ⚠ **A REGRA DA TROCA, o ✓ TROCAR A UEP e as PRONTAS PARA TROCAR abaixo
  saíram na v7.233.0 / `.gs` v5.64** — a troca é do PPCP, na TRAVA DA UEP (ver
  *A TRAVA DA UEP*). O `trocarUepCrono` sempre recusa. O resto desta seção
  (IMPORTAR PDF, a DATA e os VOLUMES obrigatórios, a CONFERÊNCIA DAS TROCAS, o
  ✕ LIMPAR) continua valendo.
- PPCP, 26/10/2026, com a STRASS VOL 2/2 na tela: *"qual UEP colocar?"* — o
  PARA TROCAR dizia **1,57** (só a medição dos campos) e a lista **UEP média
  1,52**. Depois, na mesma conversa: *"faz as duas correções"*, *"deixa pronto
  para trocar já no app a uep que puder"*, *"a medição não dá para travar em
  duas datas diferentes o mesmo produto, isso vai demorar muito"*, *"deixar uma
  conferência para que quando passar o produto outras vezes criar alerta sem
  alterar se sobe ou desce a uep"* e, com o PDF do app de cronoanálise na mão,
  *"segue modelo"* → *"importar para não ter que digitar nada"*.
- **A REGRA DA TROCA é de AMOSTRA** (`_ucvRegsResumo(regs, cadAtual)`): as
  medições REGISTRADAS do volume (mesmo modelo, nome e VOLUME) somam
  `UCV_TROCA_MIN_VOL`=30 volumes ou mais — num dia só, ou numa medição só — e
  TODAS caem do mesmo lado da faixa 90–110% contra o cadastro **de agora**
  (sem ele, o `uepCad` da hora do registro). Medição sem VOLUMES MEDIDOS não
  entra. Vereditos: `trocar` · `pouca-amostra` · `discordam` · `confere` ·
  `sem-volumes` · `sem-medicao` · `sem-cadastro`.
  - ⚠ **O que se perdeu ao tirar as duas datas**: volume a mais tira o erro de
    caixa para caixa, NÃO o efeito do dia (equipe, lote, regulagem). Por isso a
    faixa de ±10% fica e a CONFERÊNCIA existe. Dito ao PPCP.
  - **A UEP média sai dos SEGUNDOS** (`_ucvRegUep`: ~~rodando ÷ base de cada medição~~ — desde a v7.200.0, sem as lacunas ÷ 6,7; ver *A RÉGUA DA CRONOANÁLISE É O SEM AS LACUNAS*),
    pesada pelos volumes — não da UEP já arredondada (1,46 e 1,57
    davam 1,52; os segundos dão **1,51**).
  - **A troca é das REGISTRADAS, não do tempo digitado**: com o tempo nos
    campos, os cartões são dele; a caixa de ação é da regra. `_uepConvMontar`
    ganhou o 8º parâmetro `regLista` (`R.regs`, `R.regRes`, `R.troca` = média,
    antes, diferença e o `_uepConvDigitar` dela). Caixa: **PODE TROCAR · PELAS
    MEDIÇÕES REGISTRADAS** (com o botão) · ✓ NÃO PRECISA TROCAR · **AINDA NÃO
    TROQUE** (o que esta medição dá e por que ainda não, `UCV_AINDA`). O PARA
    TROCAR sumiu — o teste falha se voltar.
- **✓ TROCAR A UEP NO CADASTRO** (`_ucvTrocar` → `trocarUepCrono`): manda
  modelo, produto, volume e `cods=código:UEP` (a repartição entre cores e
  volumes é a do cadastro). O `.gs` **refaz a regra contra a planilha**
  (`_cronoTrocaRegra`, cópia da do painel; o teste roda as duas nos mesmos
  casos e prende `CRONO_TROCA_MIN_VOL_GS`/`CRONO_TROCA_FAIXA_GS` iguais às do
  painel), confere que os códigos estão na coluna CODIGOS das medições e que a
  média dos valores enviados bate com a das medições (±0,01), e só então grava:
  UEP, `UEP_VIGENCIA` = `dd/MM/yyyy DIGITADA` (o carimbo da digitação: a FILA
  tira o produto) e uma versão por código na `UEP_VERSOES`, ORIGEM
  `CRONOANÁLISE · modelo · produto · volume · N medições, V volumes`
  (`_cronoOrigem`/`_cronoOrigemLer`, uma implementação). Lê as abas DIRETO
  (escrita), sob o lock.
  - **Recusa vem com `ok:true, trocado:false, recusado:true`** — com `ok:false`
    o `jsonpEscrita` retentaria três vezes uma coisa que não vai mudar.
    Idempotente: UEP já igual = `jaTrocado`.
  - Sem resposta ≠ não trocou: relê o cadastro e decide (`_ucvTrocaConfere`).
    Depois, em sequência: cadastro → medições → conferência.
  - A UEP de **hoje inteiro** já sai com o número novo (o `getPontosDia` e o
    fechamento leem o cadastro); dias fechados não mudam. A confirmação diz
    isso e manda atualizar a aba UEP da planilha de programação no mesmo dia.
  - ⚠ A base (MADERO) nunca tem troca. O JOGO e cada VOLUME são medições
    diferentes (`_ucvRegVol`): as do VOL 2/2 não liberam o JOGO.
- **PRONTAS PARA TROCAR** (`_ucvProntas`, conta; `_ucvProntasHtml`): os volumes
  que a regra já libera, de todas as medições, acima da lista; o toque abre o
  volume (`_ucvAbrirPronta`, pelo índice — o `_rpEsc` não escapa aspas).
- **CONFERÊNCIA DAS TROCAS** (`getConferenciaCrono` → `_ucvConfMontar` →
  `_ucvConfHtml`; aviso no topo `_ucvConfAvisoHtml`): para cada troca (a mais
  nova de cada volume), as horas em que **SÓ** os códigos trocados rodaram, nos
  dias depois da troca e antes de hoje. UEP feita (caixas × UEP nova) ÷ pedida
  (minutos × META UEP ÷ 527 — o padrão do bloco 7). Abaixo de 90%: **▲ SUBIR?**
  (UEP baixa, ou paradas); acima de 110%: **▼ DESCER?**; menos de
  `UEP_PAD_MIN_MIN`=120 min sozinho: AGUARDANDO; UEP do cadastro mudou depois:
  SUBSTITUÍDA. **Nada é gravado**: o alerta pede medição nova.
  - Hora dividida com outro produto ou com o outro volume fica fora (não se sabe
    de quem foi o tempo) — a conferência pode demorar a julgar, e é de
    propósito: misturar o VOL 1/2 da STRASS julgaria o volume errado.
  - O slot 12:12 vale 48 min (`_cronoMinSlot`). Cache de leitura 300 s; a troca
    e qualquer gravação invalidam.
  - Só acha troca feita pelo ✓ TROCAR A UEP (ORIGEM CRONOANÁLISE); UEP digitada
    à mão na planilha não entra.
- **DATA DA MEDIÇÃO e VOLUMES MEDIDOS obrigatórios** no 💾 REGISTRAR
  (`_ucvRegValida`). A data vazia virava HOJE: a 2ª medição da STRASS saiu
  26/10, e o log de produção não tem STRASS nesse dia (o VOL 2/2 rodou em 22/10
  16h e 23/10 07–08h — a data dela NÃO foi corrigida na planilha, o PPCP
  confere). A data também sai do campo depois de cada registro; o placeholder
  é `dd/mm/aaaa`, não a data de hoje.
- **📄 IMPORTAR PDF** (`_ucvImportar`): o PDF **Takt Time — <produto> ·
  <grupo>** do app de cronoanálise (RitmoPatrimar v2.9x). `_ucvPdfLer` (conta)
  tira produto, grupo, data e hora da MEDIÇÃO, VOLUMES e os três cartões (NO
  PERÍODO, COM A LINHA RODANDO, SEM AS LACUNAS; segundos com PONTO) — a frase
  do resumo é a rede do período e do rodando. Faltando produto, data, rodando ou
  volumes, diz o que falta, nunca inventa.
  - **Um PDF preenche a tela** (produto, s/VOLUME RODANDO, data, período,
    lacunas, volumes) e **não registra sozinho**: confere e 💾 REGISTRAR.
    **Vários PDFs** registram de uma vez, com uma confirmação
    (`_ucvImportItem` → a MESMA linha do 💾: `_uepConvMontar` →
    `_ucvRegValida` → `_ucvRegMontar`; URL única `_ucvRegUrl`). Mesmo PDF
    importado de novo = mesmo REG_ID (não duplica).
  - O produto do título casa pelo **`_ucvPdfAchar`** (v7.159.0, PPCP: *"ajusta
    importador"*), nos dois caminhos (um PDF e vários):
    1. o nome como veio, pelo `_uepConvAchar` ("Painel Sirius 1.4" → 501114 ·
       PAINEL SIRIUS 1.4);
    2. a **marca de volume** sai do nome e escolhe a **linha do VOLUME**. O app
       nomeia como quem cadastrou o estudo: a STRASS vem **"Penteadeira strass -
       caixa 2/2"** (cadastro: VOL 2/2 PENTEADEIRA CAMARIM STRASS). Aceita
       `caixa`, `cx`, `vol`, `volume`, com `/`, `-` ou `de`;
    3. sem casar pelo trecho, as **palavras** — todas no nome de um produto só
       (PENTEADEIRA STRASS → PENTEADEIRA CAMARIM STRASS).
    - Volume que o produto não tem (caixa 3/3 num de 2 volumes; caixa 1/2 num
      de 1) **não casa**, com o motivo: escolher outro volume gravaria a UEP do
      volume errado. Mais de um produto casando = ambíguo, nunca o 1º da lista.
    - Fora do cadastro ou ambíguo ("Sirius 1.4": rack e painel) → fica de fora
      do lote; sozinho, o nome vai para o campo e a tela manda escolher na
      lista. A mensagem de 1 PDF diz com que produto casou (`→ 501059 · …`).
    - Conferido contra o cadastro real (26/10/2026): os nomes da lista do app
      (Rack Flip 1.8, Rack sirius 1.6, Painel Sirius 1.4, Toucador Magic New,
      MESA CABECEIRA MADERO, Penteadeira strass - caixa 1/2 e 2/2) casam todos.
  - MEDIDO POR e VELOCIDADE não estão no PDF: vazio (velocidade = a do
    cadastro); no lote, o MEDIDO POR digitado no formulário vale para todos.
  - ⚠ **O VOLUME NO TÍTULO (app v2.99, v7.199.1)**: o título passou a ser
    **`<produto> · VOL 1/3 · <grupo>`** (HOME RIPADO ANTARES 1.8, 03/11/2026).
    O `_ucvPdfLer` cortava no 1º `·`: o `VOL 1/3` ia para o grupo e o painel
    casava com o produto INTEIRO — 14,3 s de UM volume virava a UEP média do
    jogo (1,81 contra 2,10, −13,8%; no VOL 1/3, cadastro 2,34, são −22,6%).
    Hoje o **grupo é o ÚLTIMO trecho** e trecho que é marca de volume fica com o
    produto (título sem grupo também lê). O teste roda o texto real do pdf.js.
    Formato novo do app? Extrair o texto com o pdf.js 3.11.174 e conferir o
    título antes de mexer no leitor.
  - **O leitor é o pdf.js 3.11.174 do cdnjs (UMD, `window.pdfjsLib`), carregado
    só no clique** (`_ucvPdfjs`, voo compartilhado; falhou → diz e manda
    digitar). Nada no `<head>`: nem a abertura do painel nem a TV pagam por ele.
    Medido no Chromium com o PDF real (worker de outro domínio, como na Vercel).
- ⚠ Mudou o `.gs` → **re-deploy manual**. Antes dele o ✓ TROCAR A UEP diz que
  falta o v5.34 e não grava; a conferência diz o mesmo. O IMPORTAR e o
  REGISTRAR não dependem do v5.34 (o `registrarCrono` é da v5.30).
- **✕ LIMPAR** (v7.193.0, PPCP 03/11/2026, com um PDF importado na tela: *"ter
  opção de limpar"*): `_ucvLimpar` zera `UCV_LIMPAR_CAMPOS` (produto, tempo
  rodando e os campos do registro, menos o MEDIDO POR) e `UCV_LIMPAR_MSGS` (os
  avisos), redesenha e volta ao PRODUTO. Ficam a BASE e a TOLERÂNCIA (deste
  computador) e o MEDIDO POR. Não grava nada (o teste prende). O botão fica
  depois do 📌 FIXAR e virou o último foco: o `_uepConvTecla` (Tab volta ao
  PRODUTO) passou para ele. Medido no Chromium: a linha de campos cabe em 1920,
  1366 e 1280. Campo novo no estudo? Entra na lista do LIMPAR.

## A TRAVA DA UEP (v7.233.0 / `.gs` v5.64)
- PPCP, 12/11/2026: *"o que precisamos hoje é de ter limite de medição. Se não
  tiver um limite toda hora vai dar diferenças, mas ainda dependemos do tempo
  do madero"* → *"não alterar nada"* → *"sugestão"* → *"manter 6,7 monta a
  prévia, colocar um carimbo em cada produto que já cumpriu a regra e travar a
  uep, mas essa trava passa por mim"* → *"depois de travada por mim posso pegar
  tempos mas não altera"* → *"sim mas eu valido a troca"*.
- **Por que um limite** (medido nas 83 medições do app, 19/10–12/11): de uma
  medição para outra do MESMO produto o tempo varia **5,9%** (p90 9,8%, máx.
  13,3%); o erro de amostragem é só ~2,8% — o resto é a sessão (equipe, lote,
  regulagem). Uma medição só não decide nada; a média de duas, com 100
  volumes, tira metade disso.
- **A regra** (`_ucvRegraUep`, a medição por `_ucvMedValida`; no `.gs`
  `_cronoRegraUep`/`_cronoMedValida`, o teste roda as duas nos mesmos casos e
  prende as constantes iguais):
  1. **a medição vale** com `UCV_MED_MIN_VOL`=30 volumes ou mais e lacunas até
     `UCV_MED_MAX_LAC`=15% do tempo rodando (`_ucvLacPct` = 1 − sem as lacunas ÷
     rodando, **uma casa** — o que a tela mostra decide: 15,2% não vale). Sem o
     RODANDO não dá para medir as lacunas: não vale;
  2. **a regra se cumpre** com `UCV_REGRA_MIN_MED`=2 válidas somando
     `UCV_REGRA_MIN_VOL`=100 volumes. UEP medida = a média das válidas pelos
     volumes, pelos segundos (sem as lacunas ÷ 6,7 s);
  3. **dentro de 90–110%** (`UEP_PAD_FAIXA`) do cadastro de agora a regra diz
     **FICA**; fora, **TROCA** para a média. Sem UEP no cadastro, cumprida =
     TROCA (não há o que manter). **NA BORDA**: a diferença a até
     `UCV_REGRA_BORDA`=2 pontos do limite (8–12%) — a tela diz *"decida"*.
  - ⚠ Não é mais "todas do mesmo lado": a MÉDIA decide (com a regra antiga a
    VIVARE e a PRINCESA "discordavam" para sempre).
  - ⚠ Os PDFs não guardam a hora da medição: "2 medições" são 2 registros
    diferentes, podem ser do mesmo dia (a TAURUS tem 4 do mesmo 27/10). Exigir
    2 dias diferentes foi recusado pelo PPCP em 26/10 (*"vai demorar muito"*).
- **Quem decide é o PPCP.** Sub-aba **🔒 TRAVA DA UEP** (`UCV_SUBS` + `trava`,
  depois das MEDIÇÕES): as 3 regras, **CUMPRIRAM A REGRA · ESPERANDO O PPCP**
  (o carimbo: TROCA primeiro, depois a borda, depois a maior diferença),
  **TRAVADAS PELO PPCP** (a UEP, quando, trocou ou manteve, contra a regra, a
  amostra, e **DEPOIS DA TRAVA**: as medições registradas depois — pelo
  REGISTRADO_EM — com a média contra a travada, *"só informa"*) e **AINDA NÃO
  CUMPRIRAM** (o que falta e a medição que não vale, com o porquê). A base e o
  JOGO ficam fora, contados no rodapé. Conta `_ucvTravaMontar` (pura, com o
  `_ucvTravaDe`), desenho `_ucvTravaHtml`/`_ucvTravaDlgHtml` (sem conta, o teste
  prende).
  - **O diálogo** (`#modal-trava`, `_ucvTravaAbrir(i)`/`_ucvDestravaAbrir(i)`
    pelo índice): o que a regra diz em cima (**A REGRA**), a outra opção
    embaixo (*contra a regra — fica registrado*), **CÓDIGO DO PPCP** (senha) e
    MOTIVO (obrigatório para destravar). `_ucvTravaEnviar` → `jsonpEscrita` →
    `_ucvTravaResposta`; código errado deixa o diálogo aberto e limpa o campo;
    sem resposta ≠ não gravou (`_ucvTravaConfere`: a `uepTrava` do cadastro
    relido). Depois relê cadastro → medições → conferência, em sequência.
  - ⚠ **O código do PPCP mora nas Propriedades do script (`PPCP_CODIGO`)**,
    nunca no painel (público na Vercel) nem no repositório; o painel não guarda
    o que foi digitado. Ele viaja na URL do JSONP (como todo parâmetro). Errado
    `TRAVA_ERROS_MAX`=5 vezes → 15 min sem aceitar, nem o certo (contador
    global no `CacheService`).
- **Onde a trava mora**: a coluna **`UEP_TRAVA`** da PRODUTO_CODIGO
  (`dd/MM/yyyy PPCP`, criada na 1ª trava; é ela que o `.gs` confere, e o
  `getProdutos` devolve `uepTrava`) e a aba **`UEP_TRAVAS`** (só acréscimo:
  TRAVA_ID, TRAVADA_EM, MODELO, PRODUTO, VOLUME, CODIGOS `cód:UEP`, UEP,
  UEP_ANTES, UEP_MEDIDA, DIFERENCA_PCT, REGRA, DECISAO, MEDICOES, VOLUMES,
  MOTIVO, DESTRAVADA_EM, MOTIVO_DESTRAVA), que o `getCronoRegistros` devolve
  em `travas`. O painel lê a trava do **cadastro** (`_ucvTravaDe`; sem a coluna
  — `.gs` antigo — vale o registro) e o detalhe do registro; registro ativo com
  o cadastro sem carimbo = **trava apagada na planilha**; cadastro ≠ a UEP
  travada = **a UEP mudou na planilha**. Os dois em vermelho.
- **`.gs` v5.64**:
  - `travarUep` (sob o lock): o código → o idempotente (`travaId`, cache 2 h)
    → as medições e o cadastro direto da planilha → a regra refeita
    (`falta` recusa; manter sem UEP no cadastro recusa) → trocar confere a
    média enviada (±0,01) → grava UEP + vigência `DIGITADA` (só trocar), o
    carimbo, a linha da `UEP_TRAVAS` e a versão na `UEP_VERSOES` com ORIGEM
    `CRONOANÁLISE · … · TRAVA PPCP` (a CONFERÊNCIA DAS TROCAS acha por ela).
    Já travada = `jaTravada`; parte dos códigos travada à mão = recusa
    `parcial`. Base e JOGO recusam. Recusa com `ok:true` (não retenta).
  - `destravarUep`: o código e o motivo; limpa a `UEP_TRAVA` e preenche
    DESTRAVADA_EM na linha ativa. A UEP não muda.
  - `trocarUepCrono`: sempre `recusado`, `use-trava` (o painel antigo em cache).
  - `setUepCatalogo` (`travados`) e a estimativa pulam o código travado.
  - `onEdit` → `_travaDesfazEdicao`: a digitação de UMA célula na coluna UEP
    (ou UEP_TRAVA) de um código travado volta ao valor da trava (a
    `UEP_TRAVAS` guarda o de cada código) com uma nota. Colagem de várias
    células não tem o valor de antes: fica, e o painel acusa. Sem o registro da
    trava, também fica.
- **No MEDIR** (`_ucvRegraBoxHtml`, no lugar do PODE TROCAR / AINDA NÃO
  TROQUE / NÃO PRECISA TROCAR): 🔒 UEP TRAVADA (com o que esta medição dá
  contra a travada, `R.travaDif`, só informa) · ✓ REGRA CUMPRIDA · O PPCP
  DECIDE (botão para a TRAVA DA UEP) · A REGRA AINDA NÃO SE CUMPRE (o que falta)
  · LENDO. A lista de medições: **NÃO VALE** com o porquê na coluna TROCA, e a
  linha de cima segue a regra nova (ou *UEP TRAVADA*).
- **No O QUE MEDIR**: 🔒 TRAVADA (medido) e **PPCP DECIDE** (a regra cumprida;
  medido só quando FICA — com TROCA o cadastro ainda é o antigo).
- **Com os dados de 12/11/2026** (68 medições): 11 volumes cumprem — VIVARE
  1,89 → 2,16 (+14,3%) e PRINCESA 1,90 → 2,14 (+12,7%) pedem troca; TAURUS
  +9,7% fica, na borda; 8 ficam. 25 ainda não cumprem. Não valem: a SLEEP de
  09/11 (25,3%), três da HOME ANGEL (19–34%). ⚠ **A própria MADERO** (15,2% e
  15,6%) não passaria — fica congelada em 6,7 s por decisão do PPCP.
- **Da revisão (antes de publicar)**:
  - **travada em parte** (uma cor nova entra num volume travado: a trava segue
    nos códigos antigos e o `.gs` recusa travar de novo, `parcial`) conta como
    **TRAVADA**, com o 🔓 DESTRAVAR e o aviso *"entrou código novo… destrave e
    trave de novo"* — sem isso o volume não tinha saída;
  - o **JOGO** (os volumes juntos) não trava: a caixa do MEDIR diz *A TRAVA É
    POR VOLUME* e a lista diz o mesmo (antes mandava para a TRAVA, que não o
    lista); o rodapé da TRAVA conta as **medições** de JOGO;
  - código errado tira a sub-aba do *"Gravando…"* (repinta); erro do servidor
    (`ok:false`, o `jsonpEscrita` lança com a mensagem) diz a mensagem dele, não
    *"sem resposta"* — só a falha de transporte do `jsonpFetch` (*Timeout — …*,
    *Erro ao carregar script*) é "sem resposta";
  - o 🖨 ESTUDOS DO DIA passa a trava (`_ucvDiaMontar(…, travas)`), e a caixa
    do MEDIR diz *NÃO FORAM LIDAS* quando a leitura falhou (`R.regsFalha`);
  - na `UEP_TRAVAS` o texto vai como texto (`TRAVA_TEXTO`, `setNumberFormat('@')`):
    `501082001:1.70` o Sheets leria como duração e um motivo `12/11` como data.
  - ⚠ **Ficou aberto**: com o registro da UEP_TRAVAS falhando (`logErro`) a
    trava vale pelo cadastro, mas o `onEdit` não tem para onde voltar e o painel
    não acusa a UEP mudada (o `mudou` compara com o registro). E o contador de 5
    erros é global: quem tem a URL `/exec` pode bloquear o PPCP por 15 min.
- ⚠ **re-deploy manual** e criar a propriedade `PPCP_CODIGO`. Antes do
  re-deploy a sub-aba diz *FALTA O .gs v5.64* e nada grava; sem a propriedade,
  o Apps Script recusa dizendo onde configurar.
- Testes: `crono-registro.test.js` (o `.gs` inteiro) e `uep-relatorios.test.js`
  (a regra, a paridade, a sub-aba, o diálogo, o fluxo); conferidos por mutação.

## A MEDIÇÃO VEM SOZINHA DO APP DE CRONOANÁLISE (v7.208.0 / `.gs` v5.58 / app 2.103.0)
- ⚠ **Estado em 06/11/2026**: `.gs` v5.58 **implantado** (conferido: o
  `getDados` responde `gsVersao` 5.58); variável `PAINEL_APPS_SCRIPT_URL`
  criada na Vercel do app (projeto `crono-analise`, só Production, tipo
  Config); app 2.103.0 **pronto na branch** `claude/serene-einstein-otq7ic` do
  `crono-analise`, **ainda não mesclado**. Até o merge (que publica e roda a
  migração do banco do app), nada vem sozinho — o 📄 IMPORTAR PDF continua
  sendo o caminho. Ao ver a 1ª medição com ORIGEM = APP na aba, tirar esta
  nota.
- PPCP, 06/11/2026: *"analisar o que pode unir"* → B1/B2 → *"b2"*. Antes: no
  app (repositório `crono-analise`), Salvar análise → imprimir o PDF → no
  painel, 📄 IMPORTAR PDF → conferir → 💾 REGISTRAR. Agora o **"Salvar análise
  e fechar"** do app (PC, Embalagem Takt Time) manda a medição para a aba
  CRONOANALISE pelo `registrarCrono` deste `.gs`. O IMPORTAR PDF fica como
  reserva.
- **v7.216.0 (PPCP: *"importa pdf não faz mais sentido?"*)**: o botão virou
  **📄 PDF (contingência)**, discreto (`btn-ghost`, era o laranja), com o
  title dizendo quando usar (a medição não chegou do app, ou é antiga). O app
  v2.103.2 manda `quem` = quem salvou a análise (`analisada_por`, até 40
  caracteres) — o MEDIDO POR deixa de ser só "app"; o `.gs` já aceitava. Não
  apagar o import: é o caminho das medições antigas e da falha do app.
- **B1 já estava feito** (conferido em 06/11): em 03/11 a lista de produtos da
  embalagem do app foi carregada com os nomes do painel (o `rot` do
  `_uepConvProdutos`: *"501059 · PENTEADEIRA CAMARIM STRASS · VOL 2/2"*), 168
  = 168. O duplicado *"501141 BUFFET 4 PT PRISM"* (sem o "·", cadastrado pelo
  tablet) foi desativado no banco do app a pedido do PPCP. O que sobra do B1
  (o app ler a lista sozinho; o tablet não cadastrar nome solto) NÃO foi feito.
- **O contrato** (`registrarCrono` com `origem=app`, GET sem callback, resposta
  JSON): o app manda `regId` (`app-` + id da conferência), `rotulo` (o nome da
  lista), `data` (dd/mm/aaaa, São Paulo), `sRod`, `sLac`, `sPer` (o texto do
  PDF, `formatarSegundos`) e `volumes`. O resto sai do cadastro, pela régua do
  painel (`_cronoDoApp`, PURA): PRODUTO = `_cronoNomeCad` (= `_capNome`),
  VOLUME como o `_ucvRegVol`, CODIGOS = todos os do volume (as cores), UEP_CADASTRO
  = o `volCad` (média das cores; JOGO = soma ÷ nº de volumes), BASE/BASE_S pela
  MADERO sem as lacunas (`CRONO_BASE_ROT_GS`/`CRONO_BASE_S_GS`), VELOCIDADE e
  ENTRE_PECAS do cadastro. TOLERANCIA e TEMPO PADRÃO vazios (são do painel de
  cada computador). Coluna nova **ORIGEM** = `APP`.
  - **Toda resposta ao app leva `app:true`**: o `.gs` antigo responde
    *"Sem o produto da medição."* sem ele, e o app diz que falta o v5.58 — e
    não grava nada (o app NÃO manda `produto`, de propósito).
  - **Recusa com `ok:true, recusado:true`** e o motivo (fora do formato da
    lista, fora do cadastro, volume que o produto não tem, data, volumes não
    inteiros, RODANDO < SEM AS LACUNAS, tempo absurdo): o app não retenta o
    que não vai mudar. Planilha ocupada (lock) ou QUALQUER falha da planilha
    no caminho do app: `ok:false, app:true` → o app pode reenviar (revisão: a
    falha saía pelo catch do doGet sem `app`, e o app acusaria o `.gs` antigo).
    NO PERÍODO fora da régua fica vazio (só informa).
  - **O mesmo REG_ID do app com outro conteúdo SUBSTITUI a linha** (revisão da
    v5.58). Igual (a linha inteira, NO PERÍODO incluído) → `duplicado`;
    diferente → `substituido:true`, no lugar, com a antiga na CRONO_EXCLUIDOS
    (`_cronoCopiarExcluida`, a mesma do EXCLUIR) e as colunas que alguém pôs na
    aba preservadas. O REG_ID do painel sai do conteúdo: lá, igual é igual.
  - ⚠ **O que muda o conteúdo é o PRODUTO, não a parada** (corrigido pela
    revisão do app, 06/11). Os três tempos saem só dos TOQUES, que não mudam
    depois da análise: **parada marcada no PC não muda nada do que vai** — a
    medição reaberta e salva de novo volta "já estava". Troca a linha o produto
    corrigido no app (o *Editar produto* reenvia sozinho a que já foi) ou o NO
    PERÍODO (setup ou programa do grupo mudados). O comentário do
    `_registrarCronoCore`, que dizia o contrário, foi corrigido no `.gs` v5.59
    (o `crono-registro.test.js` prende).
  - Por isso a mesma medição do PDF e do app **bate e não duplica**. O único
    caso que duplica: o PDF entrou com o produto ERRADO e o produto foi
    corrigido no app — outro produto, outra linha. Exclua a do PDF no painel.
  - **APP × APP é pelo REG_ID** (`.gs` v5.59): duas medições DIFERENTES do app
    (REG_IDs `app-…` diferentes) do mesmo dia, produto e volume, com RODANDO,
    SEM AS LACUNAS e VOLUMES iguais, viravam uma só (a 2ª voltava "já estava").
    Agora o `_cronoMesmaMedicao(…, pularApp)` só casa a do app com linha que NÃO
    é APP (o PDF); o PDF continua casando com a do app.
  - Os limites são os do `_ucvRegValida` (`CRONO_APP_*` = `UCV_REG_*`; o
    teste prende).
- **A MESMA MEDIÇÃO NÃO DUPLICA** (`_cronoMesmaMedicao`, para os dois caminhos):
  mesmo dia, modelo, produto, volume, RODANDO e SEM AS LACUNAS (folga de 0,05 —
  o texto do PDF tem uma casa) e volumes → `duplicado:true, mesmaMedicao:true`.
  O REG_ID do painel sai do conteúdo e do MEDIDO POR; o do app, do id dele: sem
  isso, o PDF de uma medição já enviada entraria de novo.
- **No app** (repositório `crono-analise`, v2.103.0): `api/_lib/painel.js`
  (monta e envia), rota `PATCH /api/conferencias?id=…&painel=1`, colunas
  `conferencias.painel_em`/`painel_erro`, e a variável de ambiente
  **`PAINEL_APPS_SCRIPT_URL`** na Vercel do app (a URL `/exec` deste Apps
  Script). **Sem ela, nada é enviado** (o envio nasce desligado). ⚠ Trocou a
  implantação do Apps Script (a URL `/exec` mudou)? Trocar nos DOIS HTMLs do
  painel **e** nessa variável.
  - **No app, a fila de envio mora na página** (revisão de 06/11): a gravação
    da análise (e do produto corrigido) já deixa em `painel_erro` "o envio ao
    painel não foi confirmado…"; o envio troca pelo desfecho. Página fechada no
    meio → a lista do app mostra "⚠ não foi ao painel" e o PCP manda de novo
    (o painel responde "já estava" se ela tinha chegado). Recarregar ou fechar
    com envios na fila pergunta antes.
- No painel, a lista MEDIÇÕES diz **app** no MEDIDO POR da medição que veio do
  app. Excluir/arquivar no app NÃO exclui no painel (decisão do 1º passo).
- ⚠ **re-deploy manual** do `.gs` v5.58 antes de ligar a variável.
- **CHEGARAM DO APP no MEDIR (v7.218.0**, PPCP 09/11/2026, com o MEDIR vazio
  na tela: *"nessa tela tem como vir o que foi enviado pelo app"*). A medição
  do app já estava na aba e na regra da troca, mas só aparecia no MEDIR depois
  de escolher o produto. Faixa `#uep-conv-app` no TOPO do painel MEDIR (antes
  dos campos): as medições com ORIGEM = APP que CHEGARAM (REGISTRADO_EM) nos
  últimos `UCV_APP_DIAS`=7 dias, a mais nova primeiro, no máximo
  `UCV_APP_MAX`=4 (o resto no VER TODAS da própria faixa, `UCV_APP_TODAS`;
  com 6 linhas a 1366 px a faixa tomava a tela inteira — e a MEDIÇÕES só
  mostra as 15 últimas, então mandar o resto para lá podia ser falso). Colunas: CHEGOU (*hoje 08:35*, *medida em
  dd/mm* quando a data é de outro dia) · PRODUTO · VOLUME · SEM LACUNAS ·
  VOLUMES · UEP · VERSÃO DO CADASTRO · TROCA · MEDIDO POR — as mesmas células
  da lista de medições (`_ucvRegUep`, `_ucvRegsStatus`, `_ucvStatusCel`).
  - **Conta** `_ucvAppRecentes(lista, prods, trocas, hoje, dias, max)` (pura;
    `null` sem a lista lida; data de "amanhã" fica fora) · **desenho**
    `_ucvAppHtml` (sem conta) · pintada no `_ucvRegPintar`, nenhuma leitura
    nova (`getCronoRegistros`). Borda laranja só com medição de HOJE; o botão
    MEDIR diz *"N chegaram do app hoje"* quando não há produto escolhido.
  - **O toque** (`_ucvAbrirApp(i)`, pelo índice): MEDIR com o volume no
    PRODUTO e o SEM AS LACUNAS no campo; guarda `UCV_APP_ABERTA` = `{regId,
    rot, seg}`. Volume fora do cadastro não abre.
  - **Já registrada**: enquanto os campos são os dela (`_ucvAppJa`: mesmo
    volume, mesmo sem as lacunas, e ela na lista), o 💾 REGISTRAR some, a linha
    do `#uep-conv-reg-falta` diz *"✓ ESTA MEDIÇÃO JÁ ESTÁ REGISTRADA — chegou do
    app em…"* (`_ucvAppJaTxt`, classe `ja`) e o NÃO PRECISA TROCAR não manda
    registrar (`R.jaReg`, posto pela tela, não pela conta). Mexeu no produto ou
    no tempo (`_ucvDigitou`), importar um PDF, abrir pelas PRONTAS, PRINCIPAIS,
    ONDE O TEMPO VAI ou o 📌 FIXAR é outro estudo: a aberta é esquecida e o 💾
    volta (achado da revisão: senão o mesmo tempo de um estudo NOVO do volume
    escondia o 💾). O ✕ LIMPAR também esquece. A 🖨 do estudo diz o mesmo
    (`ctx.ja` no lugar das linhas para a caneta).
  - Medido no Chromium com as leituras reais de 09/11: 1920, 1366 e 1280, nada
    passa da largura.

## O TEMPO-ALVO DE CADA PRODUTO (`.gs` v5.62 / v7.229.0)
- ⚠ **DESDE A v7.235.0 / `.gs` v5.65 O ALVO É PELA ESTEIRA** — o que segue
  sobre "(527 − setup) × 60 ÷ META UEP × UEP" é a régua ANTIGA. PPCP,
  12/11/2026, com o RACK MOVE 1.6 (alvo 32,3 s; medido 25,2 s com as paradas,
  18,2 s sem as lacunas): *"tempo alvo está equivocado"* → *"tamanho da caixa,
  velocidade da esteira"* → *"85 ok"* → *"no painel, onde eu possa atualizar"*.
  - **esteira = (MEDIDA DA CAIXA + ENTRE_PECAS) ÷ VELOCIDADE** (3600 ÷
    `_tetoEsteiraCxH`, a conta do % TETO EST.); **tempo-alvo = esteira ÷
    EFICIÊNCIA DA EMBALAGEM** (⚙, `EFICIENCIA_EMB` na CONFIG_PAINEL, padrão 85 =
    `TA_EFICIENCIA_PADRAO_GS` = `EF_EMB_PADRAO`; o `crono-registro.test.js`
    prende os dois). Célula em % (0,85) vale 85 (`_cfgEficiencia`).
  - Por quê (medido nas 69 medições da CRONOANALISE): o sem as lacunas = 0,99 ×
    a esteira, sem ajuste; o alvo pela UEP dava 1,6 × o trabalho limpo (a UEP é
    medida contra os 6,7 s LIMPOS da MADERO, os 10,74 s por UEP são a MÉDIA do
    dia) e 62 de 68 medições ficavam abaixo dele. Em média a linha entrega 76%
    da esteira no NO PERÍODO: a perda é quase toda parada marcada (20% do
    período), lacunas 4%, o passo bate com a esteira.
  - Os 85% são da linha **com o produto rodando** (paradas, lacunas e fadiga
    dentro). **Não são a meta do dia** — o dia perde mais (trocas, esperas; o
    % TETO EST. mostra 22–68%). Por isso a carga da semana (PELO TAKT, o "pede
    X% da referência", as `semanas` do `getTemposAlvo`) **continua pela UEP**,
    e o TEMPO-ALVO e o PELO TAKT **não se comparam** (a nota da tabela diz).
  - `_temposAlvoMontar` manda por linha `{ rot, uep, esteira, alvo, medida,
    vel, entre, largura }` (medida/vel/entre só quando todo código da linha tem os
    mesmos três — senão null, e o app escreve só a esteira; a `largura` desde a
    v5.73, ver *A CAIXA FECHADA DO VÍDEO*) e na `ref`
    `metodo:'esteira'`, `eficiencia`, `eficienciaOrigem`. Jogo = esteira média
    por caixa dos volumes (`_taEsteiraCad`, como o `_cronoUepCad`). Sem medida
    ou velocidade: esteira e alvo null — **nunca a UEP no lugar**.
  - Painel: `_taktEstMapa(cat)` (código → s de esteira) entra no `_taktMontar`
    como 5º parâmetro (pesada pelas caixas, `cxEst`/`estSoma`; produto com um
    código sem medida fica sem alvo) e a eficiência vem em `H.ef` (`_efEmb()`;
    o `_taktMontar` não lê global). O cx/h do TEMPO-ALVO é com o produto
    rodando (3.600 ÷ alvo), não de relógio.
- PPCP, 11/11/2026: *"hoje takt está pela programação, mas ideal não seria pela
  quantidade de volumes que fizemos sem horas extras?"* → análise de engenharia
  (o que ele descreveu é o ritmo DEMONSTRADO, não takt; em VOLUMES ele oscila
  ±27,5% com o mix nos 20 dias úteis de 13/10–10/11, em UEP ±10,4%) → *"isso
  que quis dizer: tempo-alvo de cada produto"* → a regra da referência fica
  como está (2.761 até a cronoanálise cobrir os principais) → prévia → cor do
  tablet pelo alvo (o takt vira linha de carga, sem cor), sem UEP = sem alvo e
  sem cor, no tablet e no PC.
- **Tempo-alvo = (527 − setup do ⚙) × 60 ÷ META UEP × UEP do volume** — hoje
  10,74 s por UEP. A régua da coluna TEMPO-ALVO do TAKT POR PRODUTO (era NA
  MÉDIA DA LINHA até a v7.230.0; o PELA REFERÊNCIA do AGORA também virou
  TEMPO-ALVO — PPCP: *"troca por TEMPO ALVO"*, UM NOME POR INDICADOR). Só muda
  quando a META UEP for revista ou a cronoanálise trocar a UEP do produto.
  - Nos produtos com UEP pela cronoanálise ele dá ~1,6 × o trabalho puro (sem
    as lacunas): 10,74 ÷ 6,7. É a folga da média da linha para paradas,
    lacunas e microparadas — não é o tempo padrão (o padrão é a UEP).
- **`getTemposAlvo`** (leitura, cache 300 s, grupos `cat`+`cfg`; `+prod` desde a v5.63):
  `_temposAlvoMontar(catalogo, cfg)` (pura) devolve `ref` (metaUep e
  metaOrigem, setupsDia/setupMin/setupOrigem, setupDia, minProd, sUep) e
  `produtos` = { rot, uep, alvo } para cada nome da lista do app — o `rot` do
  `_uepConvProdutos` do painel ("modelo · NOME" e "· VOL v/n"; o teste
  confere). A UEP é o `_cronoUepCad`, a MESMA função da medição do app
  (`_cronoDoApp` → UEP_CADASTRO): média das cores no volume, soma ÷ nº de
  volumes no produto inteiro, jogo com volume sem UEP = null. Sem a
  CONFIG_PAINEL: META padrão do `.gs` e setup padrão 8 × 8
  (`TA_SETUP_PADRAO_GS` = o do `CRONO_APP_GRUPO` do painel), ditos como
  `padrao`. ⚠ **re-deploy manual**.
- O app de cronoanálise (repositório `crono-analise`) lê pelo servidor dele e
  guarda no tablet; ver o README de lá.
- **O TAKT DA SEMANA VAI JUNTO (`.gs` v5.63 / v7.231.0 / app 2.107.0)**. PPCP,
  com a MESA CABECEIRA SLEEP na tela (PELO TAKT 8,5 s, TEMPO-ALVO 8,9 s):
  *"tempo alvo está maior"* → *"tempo alvo não entrega?"* → *"quem vê a tela
  acha que está tudo bem"*. O tempo-alvo entrega a MÉDIA (2.761 UEP/dia); a
  programação de 09–13/11 pedia 105,1% dela. E o tablet mostrava, embaixo do
  alvo, o takt da semana POR VOLUME (16,4 s, igual para todo produto) — a
  SLEEP no alvo parecia folgada.
  - Decidido com o PPCP: **a cor continua pelo tempo-alvo** (o veredito do
    produto não pode mudar com a programação da semana; uma faixa âmbar entre
    takt e alvo foi proposta e retirada — 0,4 s na SLEEP, ~5%, é o erro de uma
    medição e a cor trocaria por acaso). **A linha da carga passa a ser POR
    PRODUTO**: *"a semana pede 8,5 s"* = os s por UEP da semana × a UEP do
    produto (a coluna PELO TAKT). No cronômetro é um número (A SEMANA PEDE),
    sem cor, ao lado de VOLUMES, VOL/H e ÚLTIMO.
  - `getTemposAlvo` devolve `semanas` (`_taktSemanasMontar`, pura): a semana de
    hoje e as `TA_SEMANAS_ANTES`=5 anteriores, cada uma com `de`, `ate`,
    `atual`, `uep`, `cx`, `cxSemUep`, `nUteis`, `feriados`, `sUep` = dias úteis
    × (527 − setup) × 60 ÷ UEP programada e `pede` = UEP por dia útil ÷ META ×
    100 — a conta do `_taktMontar` (o `programacao.test.js` confere contra as
    linhas do `getProgramacaoSemana` e o regex da fórmula do painel). Sem UEP
    programada ou sem dia útil: `sUep`/`pede` null. Falhou a programação: os
    alvos vão assim mesmo, com `semanas: null` e `semanasErro`. Cache: grupos
    `cat`+`cfg`+`prod` (o lançamento invalida); a resposta com `semanasErro`
    não entra no cache de leitura (uma falha passageira não deixa o app 5 min
    no takt por volume).
  - ⚠ As semanas passadas são recontadas com o cadastro, o setup e os
    feriados de HOJE (como o app, que multiplica pela UEP de hoje): não é o
    número que o painel mostrava naquela semana se algo disso mudou.
  - ⚠ A medição é lida com a semana DELA (o app acha pela data). Medição de
    mais de 6 semanas, painel antes da v5.63 ou semana sem UEP: o app mostra o
    takt por volume de antes.
  - TAKT POR PRODUTO do painel: o TEMPO-ALVO ganhou o cx/h embaixo (`cxhRef`),
    na régua do PELO TAKT (hora de relógio, o setup na média).

## A CAIXA FECHADA DO VÍDEO: MEDIDA_EXT_LARGURA (v7.271.0 / `.gs` v5.73 / app 2.119.0)
- PPCP, 19/11/2026: criou na PRODUTO_CODIGO as colunas **`MEDIDA_EXT_ALTURA`,
  `MEDIDA_EXT_LARGURA`, `MEDIDA_EXT_PROFUDIADE`** (sic — o título veio sem o
  "N"; só a LARGURA é lida, por prefixo `MEDIDA_EXT_LARG`) com o relatório
  *MEDIDA EXTERNA* do ERP (Estoque · Lógica, itens ativos) → *"PARA VIDEO
  CRONOANALISE VAMOS USAR LARGURA"*.
- Por quê: a **`MEDIDA DA CAIXA` é a caixa ABERTA**, do começo da linha (825 na
  Mesa Cabeceira Sleep); o vídeo mede na seladora, onde ela passa **FECHADA**
  (440 = a LARGURA do ERP: o caso real confere). Com a aberta, o entre-peças
  do vídeo saía metade do real (o aviso *Confira a caixa* do app 2.115.1).
- O que vale: o `getTemposAlvo` manda `largura` em cada linha (`_taLarguraDe`:
  a dos códigos que têm largura, quando é uma só; duas diferentes → null; o
  código em BRANCO não conta — vazio não é outra caixa, como a esteira no
  `_taEsteiraCad`; vai mesmo sem esteira); o app usa a
  LARGURA como a caixa do vídeo (o analista ainda troca no quadro). Sem
  largura no cadastro, o campo fica vazio e pede a medida — **nunca a aberta
  no lugar**. A `MEDIDA DA CAIXA` (aberta) continua a do tempo-alvo, do teto
  da esteira e da UEP estimada: nada no painel muda.
- Preenchimento de 19/11/2026 (pela API, número como número): 417 de 431
  códigos; 12 fora do relatório do ERP (não ativos lá) e o EXPOSITOR U
  (501.076.001/002, 0 × 0 × 0 no ERP) ficaram em BRANCO, nunca 0.
- ⚠ Em 4 códigos a fechada é MAIOR que a aberta (501.081.001 1.770 × 2.565,
  501.081.002 1.195 × 2.415, 501.129.005/006 530 × 650) — nos outros 412 a
  aberta é maior. Ou a caixa anda em outro sentido, ou a MEDIDA DA CAIXA está
  errada (e com ela o tempo-alvo e o teto da esteira): conferir.
- Revisão (19/11/2026, o `/revisor-codigo`): na 1ª versão, um código em
  branco tirava a largura da linha inteira — medido com a planilha de 19/11,
  36 de 171 linhas iam sem largura, entre elas RACK ESTRELA, TOPAZIO e YAN,
  SAPATEIRA SPAZIO e os volumes do RIPADO SUPREMO 2.3 e do ANTARES 1.8 (a cor
  fora do ERP em branco). Corrigido antes do merge. O que fica sem largura é o
  JOGO de volumes diferentes (cada volume tem a sua) e o EXPOSITOR U.
- ⚠ Medido na mesma data: o `getProdutos` já passava dos 100 KB do
  CacheService ANTES da largura (112,6 KB; com ela, 113,6 KB) — essa resposta
  não é guardada no cache e cada chamada relê a PRODUTO_CODIGO. É anterior a
  esta mudança; fica registrado para quando se mexer no catálogo. O
  `getTemposAlvo` tem ~23 KB.
- Teste: `crono-registro.test.js` (*v5.73*); no app, `tempo-alvo.test.js` e o
  e2e `video-esteira`.

## A RÉGUA DA CRONOANÁLISE É O SEM AS LACUNAS (v7.200.0 / `.gs` v5.44)
- PPCP, 04/11/2026, com o PDF da **HOME ANGEL 1.8 · VOL 2/2** na tela (60
  volumes, nenhuma parada marcada, período = rodando = 20,4 s, **5 lacunas** —
  105, 62, 51, 49 e 38 s, 3min42s além do normal, 18% da medição — sem as
  lacunas 16,6 s): *"porque esta pegando esteira rodando? tem que pegar sem as
  lacunas"* → *"sem lacunas e acrescente 15%"* → *"vamos fazer a troca"*. A
  conversa passou por: o 15% entra nos dois e se cancela na UEP (só o tempo
  padrão em segundos o mostra); o mesmo % é justo para produto rápido e lento (o
  mesmo descanso por hora: 7,8 min/h nos dois); e por que ele não entra na
  produção nem na meta (já têm o cansaço do dia dentro).
- **A régua**: UEP = SEM AS LACUNAS do produto ÷ SEM AS LACUNAS da base.
  `UEP_BASE_MEDIDA = { seg:6.7, rodando:7.9, periodo:null, … }` — `seg` é o
  sem as lacunas (era 7,9, o rodando); o `rodando` só serve ao quadro QUAL
  NÚMERO DIGITAR. Lacuna (intervalo > 2× o normal no app) é parada que ninguém
  marcou: perda da linha, não esforço do produto.
  - **Nos DOIS lados.** 16,6 ÷ 7,9 = 2,10 mistura régua (o produto ~15% leve).
  - **Por que mudou o resultado de todos**: nas 39 medições registradas até
    03/11, o sem as lacunas é 97,8% do rodando nos produtos (24 sem lacuna
    nenhuma) e **84,8% na MADERO**. As lacunas não se cancelavam: a base inchada
    deixava toda cronoanálise ~15% leve. Contra o cadastro de antes das trocas,
    a mediana foi de −16% (rodando) para 0% (sem as lacunas).
- **`_ucvRegUep(r)` = `r.sLac ÷ UEP_BASE_MEDIDA.seg`, a régua de HOJE para
  todas as medições**, as antigas inclusive. A UEP_CRONO e a BASE_S da linha
  são o retrato do registro (régua antiga) e não entram em conta nenhuma. Sem o
  SEM AS LACUNAS a medição não conta (nunca cai no rodando nem na UEP gravada).
  Quem lê por ela: a regra (`_ucvRegsResumo`), a coluna UEP da lista, a TROCA
  (`_ucvRegsStatus`), o NA PRODUÇÃO da lista (`_ucvRegsPadrao`, duas casas), as
  PRONTAS, os PRINCIPAIS, os ESTUDOS DO DIA e a confirmação do EXCLUIR. A base
  remedida (trocar a constante) refaz a UEP de todas as medições juntas.
- **Tela**: o campo é **s/VOLUME SEM AS LACUNAS** (com a régua da meta, NO
  PERÍODO, como antes); o cartão MEDIDO · SEM AS LACUNAS; o QUAL NÚMERO DIGITAR
  destaca o POR VOLUME SEM AS LACUNAS (a MADERO deu 6,7) e diz *não use* no NO
  PERÍODO e no COM A LINHA RODANDO (7,9); a lista põe o SEM LACUNAS em negrito.
- **Registro**: o RODANDO foi para o formulário, **obrigatório** (`r-rod`; era
  o SEM AS LACUNAS opcional, `r-lac`) — a ⏳ ONDE O TEMPO VAI mede as lacunas
  com ele. `_ucvRegValida(seg, F)`: seg = sem as lacunas; RODANDO ≥ seg e ≤ 3×
  (`UCV_REG_ROD_MAX`); NO PERÍODO ≥ RODANDO e ≤ 5×. O REG_ID não mudou (hash dos
  segundos): o mesmo PDF registrado pela régua antiga e pela nova não duplica.
  BASE da linha nova: `MADERO SEM LACUNAS 20/10/2026`, BASE_S 6,7.
  - **Só registra com a base MADERO medida** (`R.base.medida`): o formulário
    some, o `_ucvRegFalta` diz por quê (`_ucvRegBaseTxt`) e o REGISTRAR e o
    IMPORTAR em lote recusam. Com outra base, a UEP do registro não seria a da
    regra. A régua da meta (NO PERÍODO) também não registra mais.
- **📄 IMPORTAR PDF**: o SEM AS LACUNAS vai para o campo do tempo e o RODANDO
  para o registro; PDF sem o cartão SEM AS LACUNAS não importa (`falta`).
- **Base guardada**: chave nova `rpe_uep_conv_lac` (era `rpe_uep_conv`, um
  tempo RODANDO); a antiga é apagada na 1ª abertura, ANTES da leitura. É troca
  de chave por SENTIDO, não por estética.
- **`.gs` v5.44** (⚠ re-deploy): `CRONO_BASE_S_GS = 6.7` (= `UEP_BASE_MEDIDA.seg`,
  o teste prende); `_cronoTrocaRegra` com `sLac` (o `_trocarUepCronoCore` lê o
  S_SEM_LACUNAS); `registrarCrono` exige o S_SEM_LACUNAS; toda resposta do
  `trocarUepCrono` leva `regua:'lac'` e o painel manda `&regua=lac`. **Recusa sem
  `regua` = `.gs` antigo** (confere pela régua rodando, a média não bate): o
  `_ucvTrocaResposta` diz que falta o v5.44, não "tela desatualizada". Nada é
  gravado antes do re-deploy.
- **Medido com a planilha de 04/11/2026** (cadastro do dia, as 39 medições):
  12 volumes ficam PRONTOS PARA TROCAR, todos para cima (+15% a +34%): STRASS
  VOL 2/2 1,51 → 1,78, ELOA VOL 2/2 1,88 → 2,20, ANTARES VOL 1/3 1,81 → 2,13 e
  VOL 3/3 1,67 → 1,95, BUFFET FLIP VOL 2/2 1,25 → 1,52, TOUCADOR 1,58 → 2,00,
  RACK FLIP 1.6 2,19 → 2,55 e 1.8 2,13 → 2,46, RACK SIRIUS 1.6 1,95 → 2,30,
  PAINEL SIRIUS 1.4 1,49 → 2,00, RACK MOVE 2,08 → 2,45, PAINEL MOON 1.6 1,75 →
  2,13. TAURUS, PRINCESA, PRISM e VIVARE discordam; ENCANTO com 11 volumes.
  Nada muda sozinho: o ✓ TROCAR é volume a volume.
  - ⚠ **Tudo depende do 6,7**, que são 60 volumes (~8 min) com 4 lacunas, e a
    dúvida se a medição de 20/10 era a MADERO ou a SLEEP continua. **Medir a
    MADERO de novo** (60+ volumes, paradas marcadas) antes de trocar em massa.
  - O **NA PRODUÇÃO** compara com a MADERO NA PRODUÇÃO e não depende do 6,7: é o
    desempate. No dado de 26/09–25/10, ELOA (83% com 1,82) e STRASS (89% com
    1,57) apontavam para ~2,19 e ~1,76 — perto da régua nova; RACK SIRIUS 1.6
    (98,8% com 1,95) e TOUCADOR (~89–95%) apontavam para ~1,97 e ~1,78 — abaixo
    da nova (2,30 e 2,00). 2–3 h de dado por produto: não decide sozinho.
- **Decidido em 04/11/2026 (PPCP): a base MADERO FICA em 6,7 s** (*"madero
  fica"*), e as trocas foram feitas pela régua nova no mesmo dia, pelo ✓ TROCAR:
  HOME ANGEL VOL 2/2 2,07 → 2,48 (09:01, 1 medição de 60 volumes, sem produção
  para comparar) e as 12 PRONTAS (09:03–09:05) — STRASS VOL 2/2 1,51 → 1,78 ·
  ELOA VOL 2/2 1,88 → 2,20 · ANTARES VOL 1/3 1,81 → 2,13 · VOL 3/3 1,67 → 1,95
  · BUFFET FLIP VOL 2/2 1,25 → 1,52 · TOUCADOR 1,58 → 2,00 · RACK FLIP 1.6
  2,19 → 2,55 · RACK FLIP 1.8 2,13 → 2,46 · RACK SIRIUS 1.6 1,95 → 2,30 ·
  PAINEL SIRIUS 1.4 1,49 → 2,00 · RACK MOVE 2,08 → 2,45 · PAINEL MOON 1.6 1,75
  → 2,13. Conferido na `UEP_VERSOES` (vigência 04/11/2026).
  - ⚠ **Dito ao PPCP antes, e anotado**: pela coluna NA PRODUÇÃO (UEP ÷ % = a
    UEP que a produção indica), a régua nova ficou na mediana **+12% acima da
    produção** e a antiga −4% (9 volumes; PRISM 7,2 h; os outros com menos de
    2 h ou de outubro). Hipótese não verificada: a lacuna é "> 2× o normal" — na
    MADERO (6,7 s) qualquer intervalo acima de 13,4 s vira lacuna, nos produtos
    lentos só acima de ~30 s; a base perde mais ritmo normal e sai rápida. Para
    conferir: o tamanho das 4 lacunas no PDF da MADERO de 20/10.
  - Quem acompanha agora é a **CONFERÊNCIA DAS TROCAS**: a produção esperada
    pela régua da produção sugere ▼ DESCER? em ANTARES VOL 1/3, RACK SIRIUS 1.6
    e TOUCADOR quando rodarem 2 h sozinhos. Se o padrão se repetir em vários,
    é a base (remedir a MADERO), não produto a produto.
  - A UEP/dia desses produtos sobe; a referência de 2.761 foi calibrada com o
    cadastro anterior (rever a referência é decisão do PPCP).
  - **HOME ANGEL VOL 1/2, 09:25 do mesmo dia**: 1,89 → 2,48 (1 medição, 62
    volumes, rodando 25,2 s, sem as lacunas 16,6 s — o MESMO 16,6 do VOL 2/2).
    Jogo 3,96 → 4,96. Conferido no log: a linha NÃO intercalou os volumes (VOL
    2/2 06:00–07:59, VOL 1/2 a partir das 08:00) — cada estudo mediu a sua
    caixa. Na produção: 07:00 129 cx do VOL 2/2 = 102% do ritmo da meta; 08:00
    90 cx do VOL 1/2 = 71%.
- **O QUE É A LACUNA PARA O PPCP** (04/11/2026): *"deficiência — não deixou
  100% pronto, tem que ficar ajustando, puxando peças, colocando isomantas"*.
  É trabalho que só existe porque a etapa anterior não entregou pronto: perda
  a atacar, por isso fica fora da UEP e aparece como perda na produção (a
  DIFERENÇA da ⏳ ONDE O TEMPO VAI). Duas ressalvas, ditas ao PPCP:
  - se a tarefa é do PROCESSO COMBINADO (a embalagem que põe a isomanta, por
    exemplo), não é deficiência: é conteúdo do produto e devia entrar na UEP.
    Quem decide é o PPCP, tarefa a tarefa;
  - o app só chama de lacuna o intervalo acima de 2× o normal. Ajuste pequeno
    em toda caixa não vira lacuna e entra na UEP; só a interrupção grande sai.
  - Para virar número por causa: a cronoanálise marca a parada com o motivo no
    app (puxar peça, isomanta, ajuste) em vez de deixar como lacuna, e na
    produção o operador aponta a parada. Sem isso a deficiência não tem dono.
- A ⏳ ONDE O TEMPO VAI não mudou: ela já lia o rodando e o sem as lacunas de
  cada medição (o ESTUDO RODANDO, o fluxo e o trabalho puro são os mesmos).
- ⚠ O resto do painel que ainda fala em "rodando" na cronoanálise é o RODANDO
  do app (o cartão, a coluna da lista, a ONDE O TEMPO VAI) — não a régua.

## 🖨 ESTUDOS DO DIA na ⏱ CRONOANÁLISE (v7.172.0)
- PPCP, 27/10/2026: *"subi estudos hoje, colocar impressão dos estudos feito
  no dia"*. Campo `#uep-conv-dia` (type=date; o `setTab('crono')` põe hoje
  quando vazio; vazio = hoje) + **🖨 ESTUDOS DO DIA** → `gerarRelatorioCronoDia`.
- **Pela DATA DA MEDIÇÃO** (o dia em que o estudo foi feito), não pelo
  REGISTRADO_EM. Estudo de ontem subido hoje sai escolhendo ontem.
- Conta `_ucvDiaMontar(lista, dia, prods, trocas, horas, meta)`: agrupa por
  modelo|produto|volume (produto fora do cadastro entra com o rótulo do
  registro), `sts` pelo `_ucvRegsStatus`, `pads` pelo `_ucvRegsPadrao`, `todas`
  = as medições do volume de qualquer dia, e as trocas do `getConferenciaCrono`
  com GRAVADO_EM no dia (`null` = não lidas). Desenho `_ucvDiaHtml` (sem conta).
- **A tabela de cada volume é o MESMO `_ucvRegsHtml` da tela**: o 8º parâmetro
  `resRegs` faz o resumo (a regra da troca) contar `todas`, não só as do dia —
  senão o papel diria "conferem" com a tela dizendo "discordam". A coluna do
  EXCLUIR tem `class="ucv-x-c"`, que a pele do papel esconde.
- Pele `_UCV_DIA_SKIN` escopada em `.ucv-dia`; o papel leva `.ucv-doc
  .ucv-dia` e usa também o `_UCV_DOC_SKIN`. Folha DEITADA (12 colunas), com
  `table-layout:fixed` e uma largura por coluna (somam 100%): com a largura
  automática cada volume alinhava as colunas de um jeito. Coluna nova no
  `_ucvRegsHtml` pede a largura na pele também (o teste confere a contagem).
  Medido no Chromium (A4 deitada, 1009 px úteis): 6 volumes e 12 medições em 3
  folhas, nada passa da largura; um volume não parte entre folhas.
  `_rpDocParadas` passou a 16 usuários, `_rpCabecalho` a 20 chamadas, rodapé
  `APP_NOME_CX` a 14 (o teste conta).
- Síncrono: sem a lista lida ou sem medição no dia, avisa (com o último dia
  que tem) e não abre o pop-up. A NA PRODUÇÃO sai "…" se a produção ainda não
  foi lida, e o COMO LER diz isso.
- Testes em `uep-relatorios.test.js` (conta, desenho, pele e o botão rodando
  com navegador de mentira; conferidos por mutação).
- **Cabeçalho da aba (v7.172.1, print do PPCP)**: a frase de ajuda mora na
  LINHA DE BAIXO (`.ucv-hdr-sub`), nunca no meio dos botões — lá ela quebrava o
  título em 2–3 linhas e jogava o último botão numa fileira sozinho. Botões numa
  fileira (`.ucv-hdr-bts`, 30 px), o dia colado ao 🖨 ESTUDOS DO DIA
  (`.ucv-hdr-dia`). Medido com as fontes: uma fileira em 1920, 1366 e 1280.
  Botão novo no cabeçalho? Medir de novo nas três larguras.

## NA PRODUÇÃO: % DO PADRÃO NA CRONOANÁLISE (v7.160.0 / `.gs` v5.35)
- PPCP, 26/10/2026, com a ELOA VOL 2/2 na lista de medições: *"a linha faz
  35,5 s/cx?"* → *"o que é s/cx"* → *"mas esse tempo é cheio de paradas"* →
  *"faz as duas"* (tirar o s/cx e pôr o % do padrão). O A LINHA FAZ era o
  MÉD.PERÍODO do PRODUTO em s/cx: dia inteiro, hora de troca contada cheia, os
  dois volumes juntos e, com 3 dias, a média aparada sobrava UM dia (21/10).
  Ao lado do RODANDO (14,4 s) ele convidava a comparar paradas com tempo sem
  paradas.
- **A régua certa já existia — a da CONFERÊNCIA DAS TROCAS**: só as horas em que
  SÓ os códigos do volume rodaram, UEP feita ÷ (minutos × META UEP ÷ 527). A
  meta tem as paradas dentro (12,5 s por UEP contra 7,9 s da MADERO rodando:
  ~37% do tempo), então comparar a produção com paradas contra ela é justo.
  - `_ucvPadraoDe(horas, cods, uep, meta)` é a conta (pura); `_ucvRegsPadrao`
    faz a lista (cada medição com a UEP DELA e os códigos DELA, coluna CODIGOS);
    `_ucvLinhaHtml` (cartão NA PRODUÇÃO) e `_ucvPadCel` (célula) só desenham.
  - **Cartão**: com a UEP medida (arredondada a duas casas, como a tela mostra
    — senão o cartão dava 94,5% e a linha registrada 94,6%) e com a do
    cadastro. A que a produção confirma fica perto de 100%. Sem tempo digitado,
    só a do cadastro.
  - Menos de `UEP_PAD_MIN_MIN` (2 h) somadas: "pouco para julgar" (`*` na lista).
    Não rodou sozinho: "—", nunca 0.
- **Por que uma leitura nova (`getHorasCrono`, `.gs` v5.35)**: o
  `getProducaoModeloPeriodo` junta os volumes do mesmo produto (VOL 1/2 e 2/2 da
  mesma cor são o MESMO item), e "o volume sozinho" precisa dos códigos de cada
  hora. Devolve o log da janela (de/ate, hoje fora) hora a hora: data, hora,
  minutos do slot (12:12 = 48) e as caixas de cada código. Só as linhas da
  janela (`_valoresPorData`), cache de 300 s. O log hora a hora é o MESMO
  `_cronoHorasDoLog` da conferência (linha sem hora fica fora nos dois).
  - Carregada no `setTab('crono')` DEPOIS das medições e da conferência, e o
    `_ucvLinhaCarregar` espera as duas — uma leitura de cada vez. Sem produto
    escolhido também (a lista usa). `.gs` antigo (cai no `getDados`) →
    `sem-endpoint`: cartão e coluna dizem que falta o v5.35, sem retentar em laço.
- O 💾 REGISTRAR e o IMPORTAR deixaram de mandar `linhaCxh/linhaSCx/linhaDias/
  linhaPer`: as colunas LINHA_* da aba CRONOANALISE ficam vazias nas medições
  novas (as antigas guardam o s/cx, sem uso). O `.gs` não mudou no registro.
  `_ucvRegMontar(R, V)` e `_ucvImportItem(x, prods, E, hoje, quem)` perderam o
  parâmetro da janela.
- Medido com o log real de 26/09 a 25/10/2026 (conferido na mão e no Chromium):
  ELOA VOL 2/2 com 1,82 → 82,6% (06/10 09 e 10 h, 21/10 08 h: 392 cx em 180
  min); STRASS VOL 2/2 com 1,57 → 94,6% e 1,46 → 87,9% (2 h); Toucador medida
  1,70 → 111,0%, cadastro 1,58 → 103,1% (2 h: a hora das 12:12 de 23/10 teve
  RACK SIRIUS 1.4 junto); RACK SIRIUS 1.6 com 1,95 → 84,3%; MADERO 1,00 →
  108,7% (6 h). Rack Flip 1.8: não rodou na janela (só hoje). Conferido no
  painel publicado — a 1ª conta à mão (113%, 105%, 95%) pegou horas divididas.
- ⚠ **A referência não é 100%, é a BASE.** Hora com o produto sozinho é hora
  SEM TROCA (hora boa): a própria MADERO (1,00) roda a 108,7% do padrão nelas.
  UEP certa deixaria o produto perto disso. Em 26/10 as três trocas do dia
  ficaram abaixo (ELOA 82,6%, RACK SIRIUS 84,3%, STRASS 94,6%) — sinal de que a
  cronoanálise RODANDO deixa esses produtos mais leves do que a linha mostra
  (manuseio, troca de cor, parada não marcada). 2–3 h cada: não prova. Exigir
  que a produção confirme antes do ✓ TROCAR foi proposto ao PPCP e ainda NÃO
  decidido.
- **v7.161.0 / `.gs` v5.36 — JULGADA SEM AS PARADAS, CONTRA A BASE** (PPCP:
  *"a idéia é ajustar as paradas para menos, não pode normalizar e a UEP ficar
  maior"* → *"tem que ser justa a uep"*). O % do padrão com as paradas dentro,
  contra 100%, ENGORDAVA a UEP: o RACK SIRIUS saía 84,3% e a conferência pediria
  ▲ SUBIR? — eram limpeza 13, troca de produto 12 e robô 7 min (27% do tempo).
  - `_ucvPadraoDe` tira das horas contadas os minutos das paradas APONTADAS
    (`par`, por tipo, do `getHorasCrono`) → `minRod`, `pctRod`; `par`/`parPct`/
    `tipos` ficam à parte como PERDA EM PARADAS. `_ucvRefDe` é a MADERO (UEP do
    cadastro) nas mesmas condições; `_ucvRel` = pctRod do volume ÷ pctRod da
    base; `_ucvRelEst` aplica a faixa 90–110%. Cartão, lista (`_ucvRegsPadrao`)
    e conferência (`_ucvConfMontar`) usam as MESMAS quatro.
  - **Por que contra a base e não contra 100%**: hora sem troca é hora boa — a
    própria MADERO roda a 108,7% do padrão da meta com as paradas e 116,3% sem
    (26/09–25/10). Contra 100%, todo produto certo sairia "acima". Microparada
    NÃO apontada continua dentro dos dois (produto e base): a comparação é justa.
  - `pouco` é sobre o tempo SEM parada (minRod < 2 h): a conferência espera mais.
  - Medido (26/09–25/10): RACK SIRIUS 1.6 (1,95) **98,8%**; STRASS VOL 2/2 (1,57)
    89,2%; ELOA VOL 2/2 (1,82) 83,0%; Toucador 1,58 → 88,7% e 1,70 → 95,4%.
    Abaixo da faixa sem as paradas = microparada não apontada, ritmo — ou UEP
    leve: o texto manda apontar e medir de novo, nunca engordar a UEP.
  - **Conferência pelas horas do painel**: o `getConferenciaCrono` (v5.36) só
    devolve a troca e os códigos — não lê mais o log. As horas depois da troca
    saem do `getHorasCrono` (janela de 30 dias), com `desde` = a vigência da
    troca (o dia dela fora). Troca com mais de 30 dias conta só a janela.
  - `.gs` v5.36: `_cronoParadasNasHoras` (sobreposição parada × slot, slot =
    início + `_cronoMinSlot`; sem FIM ou atravessando a meia-noite fora; data
    pela MESMA conversão `_dataStr → dataParaNum` no recorte e no filtro). Toda
    hora vem com `par` (mesmo `{}`) — é o sinal de que as paradas foram lidas;
    sem ele (`.gs` v5.35) a tela diz que falta o v5.36, nunca julga.
- **v7.162.0 — coluna TROCA** na lista de medições (PPCP: *"colocar que não
  troca devido a variar 90 a 110 e tbm se foi trocado"*; modelo mandado em
  imagem e aprovado antes de subir). `_ucvRegsStatus` (conta) / `_ucvStatusCel`
  (desenho), entre UEP e CADASTRO: NÃO TROCA (*variou +X% · dentro de
  90–110%*), FORA DA FAIXA, TROCADA (*dd/mm · antes → depois*, das trocas do
  `getConferenciaCrono`) e BASE. TROCADA só quando o "antes" da troca é o
  cadastro que a medição viu — a medição registrada depois da troca é julgada
  contra a UEP nova. Para caber em 1366: BASE curta (*MADERO 20/10*, título com
  o texto inteiro) e produto/TROCA com quebra de linha (`.ucv-pr`, `.ucv-st`).
- **v7.163.0 — VERSÃO DO CADASTRO** (PPCP, com a ELOA mostrando 2,53 e o
  cadastro de hoje em 1,82: *"troca cadastro VERSÃO 01"* → *"ISSO"*). A coluna
  CADASTRO da lista virou VERSÃO DO CADASTRO, título em duas linhas (cabe em
  1366): o número é o UEP_CADASTRO da medição (o que ela viu) e embaixo
  **em vigor** / **anterior** (`vigor` do `_ucvRegsStatus`, contra o cadastro de
  hoje do volume pelo `UEP_CONV_PRODS`). "Cadastro na medição" foi recusado
  (*"a medição partiu do app"*); mostrar o cadastro de hoje também — o número
  antigo é a régua com que aquela medição foi julgada.
  - ⚠ **A linha de cabeçalho do `_ucvRegsHtml` é TEMPLATE (crase).** Estava
    entre aspas simples, e os `title` de NA PRODUÇÃO e TROCA saíam com
    `${UEP_PAD_FAIXA[0]}` cru no tooltip (v7.160–7.162). O teste prende.
- ⚠ Os **15% de tolerância** (fadiga e movimentação) NÃO entram aqui nem na UEP:
  só no TEMPO PADRÃO exibido (medido × 1,15) e na coluna TEMPO_PADRAO_S. A meta
  já tem folga própria (12,5 s contra o tempo padrão de 9,1 s da MADERO: ~27%);
  somar os 15% de novo contaria a fadiga duas vezes.
- ⚠ Mudou o `.gs` → **re-deploy manual**.

## PRINCIPAIS PARA ANÁLISE DE TEMPO (v7.189.0) → O QUE MEDIR: A AGENDA (v7.216.0)
- ⚠ **Desde a v7.216.0 a lista é a AGENDA COMPLETA** (PPCP, 06/11/2026:
  *"precisamos listar os produtos que falta coletar tempos"* → *"sim, faz os
  três"*). Antes ela mostrava só a **classe A** (os volumes que somam 80% da
  UEP): um volume das classes B/C programado para segunda (RACK FLIP 2.2) não
  aparecia em lugar nenhum. `_ucvPrincipais` agora devolve, em `lista`, TODO
  volume que falta medir, em grupos (`g.grupo`):
  - `prog` — **na programação**, de qualquer classe, inclusive o volume do
    cadastro que **não rodou** nos 30 dias (`semProd`: sem posição, sem
    caixas, sem NA PRODUÇÃO; UEP/cx do cadastro). Ordem: hoje/atraso → data;
    no mesmo dia, o mais pesado (o que não rodou, pelas caixas programadas).
  - `rodou` — rodou na janela e não está programado: suspeita (NA PRODUÇÃO
    fora de 90–110% → sem leitura → confirma) e peso. Sem a programação lida,
    todos os que rodaram vão aqui.
  - `medido` — os medidos que rodaram, pela posição.
  - O volume que rodou **sem UEP no cadastro** entra na agenda (`semUep`, sem
    posição — antes ficava fora, só contado). Código fora do cadastro: só
    contado (`cxFora`). O que nem rodou nem está programado (e não é a base):
    só contado (`nSemNada`, "fora da agenda").
  - A classe A continua contada (`nPrinc`/`nPrincMed`, `g.principal`): é a
    régua para rever a referência de UEP ("classe A: 15 de 34" no resumo).
    `nDemais`/`pctDemais` saíram.
  - Desenho: um título por grupo (`tr.ucv-grp`, `UCV_AGENDA_GRP`), o resumo
    em `_ucvAgendaResumo` e o peso da linha em `_ucvAgendaPeso` (tela e papel
    usam os mesmos). O botão da sub-aba diz *"N a medir na programação · X% da
    UEP medida"*.
  - Com os dados de 06/11/2026 às 18h: 36 a medir na programação até 18/11
    (8 hoje ou em atraso, 16 sem rodar em 30 dias), 21 rodaram fora da
    programação, 22 de 63 medidos (43,2% da UEP), classe A 15 de 34, 65
    volumes fora da agenda.
  - **🖨 AGENDA DA CRONOANÁLISE** (`gerarRelatorioFilaCrono`, o nome antigo
    ficou para os dois menus 🖨 — ⚖ UEP e ⏱ CRONOANÁLISE): a MESMA agenda
    (`UCV_PRINC_M`, guardada no `_ucvRegPintar`) — a janela abre no clique,
    abre a ⏱ CRONOANÁLISE no O QUE MEDIR e espera as leituras (até 90 s).
    Só o que falta medir, com a coluna **MEDIDO EM / POR** para anotar à mão
    (`_ucvAgendaDocHtml`, pele `_UCV_AGENDA_DOC_SKIN`). Com os dados reais:
    57 linhas, 4 páginas — a altura da linha é a de escrever.
- PPCP, 30/10/2026, depois de decidir que a referência de UEP só é revista
  quando a cronoanálise cobrir o mix: *"deixar os principais produtos marcados
  para análise de tempo"*. Bloco `#uep-conv-princ` da ⏱ CRONOANÁLISE, entre o
  registro da medição e a lista de medições (fora do `#uep-conv-res`, que é
  refeito a cada tecla).
- **Conta** `_ucvPrincipais(horas, prods, regs, ehHE)` (pura) +
  `_ucvPrincEstado(p, regs)`; **desenho** `_ucvPrincHtml` / `_ucvPrincSub`
  (sem conta — estão no `UCV_DESENHO` do teste). Pintado no `_ucvRegPintar`,
  com as horas do `getHorasCrono` (a janela do NA PRODUÇÃO, 30 dias fechados),
  as medições e o cadastro que a aba já lê: **nenhuma leitura nova** — até a
  v7.191.0, que lê a programação (abaixo).
- **Por VOLUME** (o que se cronometra): produto de N volumes entra pelas
  linhas de volume do `_uepConvProdutos`. UEP = caixas de JORNADA (`_horaEhHE`
  fora — a referência é de jornada) × UEP do cadastro de hoje. Principais =
  ordenados pela UEP, os que entram até cruzar `UCV_PRINC_PCT`=80% (o que
  cruza entra). Código sem UEP ou fora do cadastro fica fora, contado (vai
  para a 🖨 FILA DE CRONOANÁLISE).
- ⚠ **Desde a v7.233.0 a situação segue a regra da TRAVA DA UEP**: ✓ BASE ·
  🔒 TRAVADA · ✓ TROCADA · PPCP DECIDE (regra cumprida) · MEDINDO · FALTA
  MEDIR — o CONFERE e o PRONTA PARA TROCAR abaixo saíram.
- **Situação**: ✓ BASE (MADERO) · ✓ TROCADA (vigência DIGITADA em todos os
  códigos do volume — o ✓ TROCAR A UEP e a digitação na planilha carimbam
  igual) · ✓ CONFERE (medições conferem com **30+ volumes**) · PRONTA PARA
  TROCAR · MEDINDO · FALTA MEDIR.
  - ⚠ **Confere com menos de 30 volumes é MEDINDO** aqui, embora a lista de
    medições (`UCV_REG_VEREDITO.confere`) diga que a UEP fica. Confirmar a UEP
    pede a mesma amostra que trocá-la. O ARMÁRIO ENCANTO (11 volumes) cai
    nisso. A regra da lista não foi mexida.
  - PRONTA ainda não é medido: o cadastro segue com a UEP antiga.
- **Ordem** (v7.190.0, PPCP: *"sim"* para o peso × suspeita): o que falta
  medir vem antes dos medidos, em três grupos (`UCV_PRINC_ORD`) e o mais
  pesado primeiro em cada um — 1º a produção FORA de 90–110%, 2º SEM LEITURA
  (não rodou sozinho, `pouco`, ou sem a base na janela), 3º o que a produção
  CONFIRMA. O NA PRODUÇÃO é a régua do cartão (`_ucvPadraoDe` com a UEP do
  cadastro + `_ucvRel` contra a `_ucvRefDe`), coluna própria pela célula
  `_ucvPadCel` da lista de medições. ⚠ **Só ordena**: não conta como medição
  nem entra na cobertura (a MEL VOL 1/2 confirmava a 106% e seguia FALTA
  MEDIR). `_ucvPrincipais(…, meta)` recebe a META UEP (`R.base.meta`). O `#`
  é a posição pela UEP. `UCV_PRINC_LINHAS`=15 + VER TODOS
  (`UCV_PRINC_TODOS`). Tocar na linha abre o volume no conversor
  (`_ucvAbrirPrincipal`, pelo índice — o `_rpEsc` não escapa aspas).
- **A ORDEM É A DA PROGRAMAÇÃO** (v7.191.0, PPCP: *"esse seria a sequência
  ideal para coleta?"* → *"sim"*). A cronoanálise só acontece com o produto na
  linha; pela ordem da v7.190.0 a MESA CABECEIRA SLEEP (nº 1, 8,5% da UEP,
  2.200 cx em 09/11) ia para o fim porque a produção "confirma" o 0,83. Coluna
  **NA PROGRAMAÇÃO** depois do produto: `_ucvProgDe(cods, prog, hojeNum)`
  (conta) / `_ucvProgCel` (desenho). Vencido e hoje = o `falta` do código, UMA
  vez por código (o FIFO manda o mesmo número em toda linha dele) → HOJE (há
  linha de hoje) ou EM ATRASO; futura = Σ `_cartQtdAberta` da data mais próxima
  (a régua do PRÓXIMOS DIAS); fora da esteira e vencida encerrada não contam.
  Ordem do que falta medir: agora → data; no mesmo dia, o mais pesado; o não
  programado no fim, na ordem da v7.190.0. Sem a programação no painel, a ordem
  é a da v7.190.0 e a célula diz *…*/*—*.
  - **Leitura**: `_ucvProgCarregar` = o `carregarProgramacaoDetalhada` (voo
    compartilhado com PROGRAMAÇÃO, PLANO e ⚖ UEP), por último na fila do
    `setTab('crono')`, só quando o `PROG_DET_TS` passa de `GPX_TTL` (15 min);
    falhou → 1 min de espera (`UCV_PROG_TENT`). O `_ucvRegPintar` passa
    `PROG_DET_TS ? PROG_DETALHADA : null` e `_cartNum(hojeStr())`.
  - ⚠ A data é a da LINHA da programação, não a ORDEM do dia: no dia com dois
    principais, a linha decide quem passa antes.
- **COBERTURA** = UEP da janela em volume medido ÷ UEP da janela. É o número
  que diz quando rever a referência. Medições não lidas → sem número, nunca 0%.
- A janela anda: produto que não rodou nos últimos 30 dias sai da lista,
  mesmo que pese no mix do ano. Mudar a janela é o `CRONO_LINHA_DIAS`, que
  também move o NA PRODUÇÃO e a conferência.
- Testes em `uep-relatorios.test.js` (estados, ordem, corte dos 80%, hora
  extra fora, cobertura, desenho, a tela; v7.190.0: a ordem por suspeita, o
  NA PRODUÇÃO contra a base e sem a base; v7.191.0: a programação — falta por
  código, adiantado, encerrada, fora da esteira, a ordem e a leitura);
  conferido por mutação.
- ⚠ **Em aberto (30/10/2026)**: a SLEEP é a nº 1 (8,5% da UEP) e aparece
  FALTA MEDIR. A medição de 7,9 s de 20/10 era da SLEEP mas foi registrada
  como MADERO; se ela roda mesmo a 7,9 s, a UEP dela seria 1,00, não 0,83
  (+20%), na direção contrária das outras trocas. Pedir uma medição nova,
  registrada como SLEEP, com 30+ volumes.

## SUB-ABAS DA ⏱ CRONOANÁLISE (v7.197.0)
- PPCP, 03/11/2026: *"está muito cheia a tela, tem que enxugar, deixar mais
  dinâmica"* → escolheu **sub-abas por tarefa** e **um menu de impressão**. A
  aba tinha ~2.950 px (três telas a 1920) e ~1.500 palavras empilhadas.
- ⚠ Desde a v7.233.0 há a sub-aba **🔒 TRAVA DA UEP** (`trava`) depois das
  MEDIÇÕES — ver *A TRAVA DA UEP*. As PRONTAS PARA TROCAR saíram das MEDIÇÕES.
- Faixa `#uep-conv-sub` com quatro botões (`.ucv-sb`, `data-sub`) e quatro
  painéis (`.ucv-pn`, a mesma chave): **MEDIR** (`medir`: campos, resultado,
  💾, as medições do volume em `#uep-conv-regs-p`, ⓘ COMO LER) · **O QUE MEDIR**
  (`princ`: `#uep-conv-princ`) · **MEDIÇÕES** (`regs`: `#uep-conv-regs`, todas,
  com as PRONTAS) · **TROCAS** (`trocas`: `#uep-conv-conf`). `UCV_SUBS`,
  `UCV_SUB` (começa no MEDIR, só na memória da sessão).
  - `_ucvSub(k)` só acende painel e botão (`aria-selected`): nada é lido nem
    recalculado. `_ucvSubMontar` (o texto de cada botão, só lê o que o
    `_ucvRegPintar` já montou — no fim dele) + `_ucvSubPintar` (DOM). Sem a
    leitura, o botão diz o estado, nunca 0.
  - Quem abre um volume chama `_ucvSub('medir')`: PRINCIPAIS, PRONTAS, ONDE O
    TEMPO VAI e o IMPORTAR de um PDF. O aviso da conferência tem
    `_ucvSub('trocas')`.
  - `#uep-conv-conf-av`, `#uep-conv-i-msg` e `#uep-conv-x-msg` ficam ACIMA dos
    painéis: o EXCLUIR existe nas medições do MEDIR e do MEDIÇÕES.
  - O caminho para a ⏳ ONDE O TEMPO VAI é o `.ucv-sb-ir`, na ponta da faixa
    (saiu o `.ucv-tp-ponteiro`).
  - Bloco novo na aba? Entra num painel — ou numa sub-aba nova (botão + painel
    + `UCV_SUBS`), nunca empilhado de novo.
- **MEDIR enxuto**: `_uepConvQualCurto(base)` é a linha do QUAL NÚMERO DIGITAR
  logo abaixo dos campos; os três cartões (`_uepConvQual`), o `_uepConvGuia` e
  as notas (`_uepConvNotasHtml`, só com a conversão pronta) vão para o miolo do
  ⓘ COMO LER (`#uep-conv-ler-c` — só o miolo é refeito, aberto não fecha a cada
  tecla). `_uepConvHtml(R, tela)`: com `tela`, sem as notas; o papel chama sem
  o parâmetro e continua com elas.
- **O 💾 diz o que falta** (`_ucvRegFalta(R, E)` → `#uep-conv-reg-falta`, pelo
  `_uepConvAtualiza`): produto fora do cadastro, mais de um produto, tempo, ou
  cadastro lendo. Nada digitado → nada. O formulário continua só com a
  conversão pronta (v7.150.0).
- **Menu 🖨 IMPRIMIR ▾** (`<details id="uep-conv-imp">`): as quatro impressões,
  cada uma com `_ucvImpFecha();` antes (o pop-up abre no clique, síncrono).
  Clique fora e Esc fecham (dois listeners no `document`). A frase de ajuda do
  cabeçalho foi para o `title` do título (saiu o `.ucv-hdr-sub`).
- Pele: `#sec-crono .ucv-pn{display:none}` / `.on{display:block}` com entrada
  de 0,18 s, desligada com `prefers-reduced-motion`. O cartão dos campos é
  `.ucv-pn>.uep-card`.
- Medido (Chromium, dados reais): MEDIR vazio ~430 px, com produto ~1.200 px;
  O QUE MEDIR ~1.050; MEDIÇÕES ~1.010–1.130; TROCAS ~720. Nada passa da largura
  a 1920, 1366 e 1280 (a tabela das MEDIÇÕES rola dentro do cartão a 1280).
- Testes em `uep-relatorios.test.js` (*CRONOANÁLISE: sub-abas*), conferidos por
  mutação (11 de 11).

## ONDE O TEMPO VAI — estudo × produção × meta (v7.194.0)
- ⚠ **Desde a v7.207.0 é a 5ª sub-aba da ⏱ CRONOANÁLISE** (a *aba própria* da
  v7.196.0, abaixo, saiu) — ver *RÉGUAS E ONDE O TEMPO VAI VIRAM SUB-ABAS*.
- PPCP, 03/11/2026: *"com esses estudos o que dá pra mostrar em KPI onde perde
  onde ganha?"* → *"não altera nada"* → prévia com os 34 estudos reais
  (artifact privado) → *"pode subir na aba cronoanálise"* → *"capricha na
  tela"*. Bloco `#uep-conv-tempo` da ⏱ CRONOANÁLISE, entre os PRINCIPAIS e a
  lista de medições (fora do `#uep-conv-res`, que é refeito a cada tecla).
- **Conta** `_ucvTempoMontar(regs, prods, horas, meta)` (pura) · **desenho**
  `_ucvTempoHtml` + `_ucvTempoSeg` (sem conta, o teste prende) · tocar na
  linha abre o volume no conversor (`_ucvAbrirTempo`, pelo índice — o `_rpEsc`
  não escapa aspas) · VER TODOS (`UCV_TEMPO_TODOS`, `UCV_TEMPO_LINHAS`=12).
  Pintado no `_ucvRegPintar`. **Nenhuma leitura nova**: as medições, as horas
  do `getHorasCrono` (a janela do NA PRODUÇÃO, 30 dias fechados) e o cadastro
  que a aba já lê.
- **Por VOLUME** (o mesmo agrupamento da lista: modelo + produto + volume,
  `_ucvRegVol`), em segundos por caixa:
  - **rodando** = média das medições pesada pelos VOLUMES MEDIDOS; **fluxo** =
    sem as lacunas ÷ rodando (só das medições que têm os dois); **trabalho
    puro** = rodando × fluxo;
  - **produção** = `_ucvPadraoDe` (só as horas em que SÓ os códigos do volume
    rodaram) → minutos × 60 ÷ caixas, com as paradas apontadas e sem elas
    (`minRod`; sem paradas lidas, só com);
    ⚠ o nome da coluna é **PRODUÇÃO SEM PARADAS APONTADAS** (v7.195.2, PPCP:
    *"estudo rodando, produção sem paradas?"*): só saem as paradas APONTADAS,
    as microparadas não apontadas ficam dentro (e na DIFERENÇA). "SEM
    PARADAS" sozinho fazia ler que não sobrava parada nenhuma. O teste prende;
  - **meta** = 527 × 60 ÷ META UEP × UEP do cadastro de hoje (11,45 s por UEP
    com 2.761);
  - **diferença** = produção sem paradas − rodando (s/cx e %); **horas a
    mais** = diferença × TODAS as caixas do volume na janela ÷ 3.600 — é
    extrapolação das horas sozinho para o resto, e o COMO LER diz isso.
- **Totais sem contar duas vezes**: o volume que um JOGO do mesmo produto já
  cobre (`dentro`: há linha de JOGO do mesmo modelo e nome — a ELOA VOL 2/2)
  aparece na tabela com a marca DENTRO DO JOGO e fica fora dos totais.
- **A cascata da linha** é em **s por UEP**, pesada pelas caixas × UEP: puro →
  rodando → produção sem paradas → produção real, contra a meta. Por UEP
  porque é a única régua que soma produtos de pesos diferentes.
- **AMOSTRA CURTA**: menos de `UCV_TROCA_MIN_VOL`=30 volumes medidos, ou sem
  produção sozinho, ou menos de `UEP_PAD_MIN_MIN`=2 h sozinho (`pouco`). Entra
  na tabela (marcada) e conta em "N de M julgados".
- **As marcas (BASE · DENTRO DO JOGO · AMOSTRA CURTA) moram na coluna OBS.**
  (`td.ucv-tp-ob`, uma por linha, empilhadas), nunca coladas no nome
  (v7.194.1, PPCP: *"alinhar"*) — a mesma lição do VOL. e do UEP/CX: cada nome
  tem um comprimento e a marca andava. O teste prende.
- **ONDE GANHA**: diferença até `UCV_TEMPO_GANHA_PCT`=20% ou produção abaixo
  da meta (folga). É o que já roda perto do estudo.
- ⚠ **DIFERENÇA NÃO É PERDA**: junta troca de cor dentro do lote, começo de
  lote, ritmo, microparada não apontada e caixa lançada na hora seguinte. O
  bloco aponta onde procurar; não chamar de perda nem valorar em R$.
- **Medido em 03/11/2026** (produção 04/10–02/11, 34 medições, cadastro do dia,
  meta 2.761): **+40,2%** de tempo por caixa sem as paradas, ≈ **15,8 h** em 30
  dias (1,8 jornadas) nos volumes estudados (38% das caixas da janela);
  paradas apontadas 12,5% do tempo (~7,5 h); fluxo no estudo 98% (MADERO
  84,8%); 8 de 17 volumes julgados. Cascata 7,4 → 7,7 → 10,8 → 12,3 s/UEP
  contra 11,45 — a produção real passa a meta em 0,85 s/UEP (7,4%). Maiores:
  ELOA JOGO +59% (4,0 h), MADERO +41% (3,5 h), PRINCESA +51% (1,8 h).
  Reproduz a prévia número a número.
- ⚠ A medição da MADERO de 20/10 tem NO PERÍODO "13:35" (o erro da v7.150.1);
  o bloco não lê o NO PERÍODO.
- Medido no Chromium com os dados reais: 1920 e 1366, nada passa da largura
  do bloco (o 1 px de rolagem horizontal da página a 1366 é dos `.tab` do
  cabeçalho, de antes — conferido com o bloco escondido).
- Testes em `uep-relatorios.test.js` (média pesada, puro, paradas fora,
  JOGO fora dos totais, ordem, amostra curta, ganha, estados e desenho);
  conferido por mutação.
- **🖨 IMPRIMIR** (v7.195.0, PPCP: *"impressa"*): botão no título do bloco →
  `gerarRelatorioTempo` → `_ucvTempoDocHtml` = o MESMO `_ucvTempoHtml` com o 5º
  parâmetro `papel` (sem o 🖨, sem clique nas linhas, TODAS as linhas, COMO LER
  aberto como seção) + rodapé. Retrato da tela no clique: o `_ucvRegPintar`
  guarda a montagem em `UCV_TEMPO_M`, e o 🖨 chama o `_uepConvAtualiza()` antes;
  nada é lido, a janela abre no clique; sem montagem, avisa o estado e não abre.
  - Folha DEITADA (`_rpDocParadas` → 17 usuários, `_rpCabecalho` 22 ocorrências
    com a declaração, rodapé `APP_NOME_CX` 15 — o teste conta). Pele
    `_UCV_TEMPO_SKIN` escopada em `.ucv-tempo` (+ o `_UCV_DOC_SKIN`): redefine
    os tokens das barras (`--ucv-tp-puro`, `--ucv-tp-par`, `--warn`, `--red`,
    `--ok`, `--txt`) — no documento os do painel não existem e a cor cairia no
    preto; o teste confere todo token usado no desenho. O título do bloco some
    no papel (o cabeçalho já diz).
  - **No papel o COMO LER sobe para a folha 1** (cartões → cascata → como ler)
    e a tabela abre a folha 2 (`.ucv-tp-tw{page-break-before:always}`); na
    ordem da tela, o como ler ficava sozinho numa folha 3. Na tela a ordem é a
    de sempre.
  - Medido no Chromium **com as fontes** (mídia de impressão, 1.032 × 718 px,
    dados de 03/11/2026, 17 volumes): folha 1 fecha em ~646 px, folha 2 em
    ~701 (tabela com `td` a 4 px de padding). 2 folhas, nada passa da largura.
    Volume a mais vai para a folha seguinte com o cabeçalho da tabela repetido.
    ⚠ O proxy desta sessão mudou de porta: medir com o `$HTTPS_PROXY`, senão as
    fontes não carregam e a medida sai ~25 px menor.
- **HORAS A MAIS: a barra num trilho de largura FIXA** (v7.195.1, PPCP:
  *"alinhar"*, com o papel na mão): `<i>` de 70 px na tela / 56 px no papel e a
  barra dentro em %; antes a largura da barra (70 a 2 px) empurrava o número e
  cada linha tinha o número num lugar. O `%` da DIFERENÇA (`.ucv-tp-pc`) tem
  `min-width`. Barra de tamanho variável ao lado de número = trilho fixo.
- **PRODUÇÃO REAL × META em PALAVRAS, nunca em sinal** (v7.195.3, PPCP: *"não
  estou entendendo se melhorou ou piorou"*). Era FOLGA (+) / FALTA (−) com
  `−4,6`: o sinal não dizia se era bom. A célula é `4,6 s` + *mais lenta*
  (passa da meta, vermelho) ou *mais rápida* (cabe, verde); `= meta` até
  0,05 s. Esta é a ÚNICA coluna que depende da UEP do cadastro (a meta por
  caixa): muda quando a cronoanálise troca a UEP. DIFERENÇA e HORAS A MAIS não.
- **ABA PRÓPRIA, TELA DE PAINEL (v7.196.0, PPCP: *"não achei legal junto com a
  cronoanálise, parece um excel melhorado"*)**. `#sec-tempo` (botão `⏳ ONDE O
  TEMPO VAI` logo depois da ⏱ CRONOANÁLISE); na cronoanálise ficou o ponteiro
  `.ucv-tp-ponteiro` onde o bloco morava (desde a v7.197.0, o `.ucv-sb-ir` na
  ponta da faixa das sub-abas). Mesmos ids (`#uep-conv-tempo`) e a
  mesma pintura (`_ucvRegPintar` dentro do `_uepConvAtualiza`, que roda com a
  aba escondida: o `#uep-conv-res` existe sempre).
  - `setTab('tempo')`: `_uepConvAtualiza()` + cadastro → medições → horas, uma
    de cada vez (sem a conferência nem a programação, que a tela não usa).
    `_ucvAbaOn()` (crono OU tempo) é quem redesenha no fim de cada leitura —
    as 5 que diziam `_abaOn('crono')`. Tocar num volume abre a ⏱ CRONOANÁLISE
    com ele (`_ucvAbrirTempo` troca de aba).
  - Tela (`_ucvTempoHtml` sem `papel`): 3 cartões grandes (`.ucv-tp-hero`:
    DIFERENÇA · PARADAS · PRODUÇÃO REAL × META em palavras), fluxo e cobertura
    numa linha (`.ucv-tp-rod`), a cascata, **ONDE PERDE MAIS** (`T.top`, os
    `UCV_TEMPO_TOP`=5 de mais horas a mais, sem o `dentro`; `topResto` contado;
    barras pelo `topMax`), ONDE GANHA, a tabela inteira num `<details>`
    (`UCV_TEMPO_TODOS` guarda aberta/fechada; saiu o `UCV_TEMPO_LINHAS`) e o
    COMO LER. **O papel é o de antes**, byte a byte (o teste prende: sem
    `ucv-tp-hero`, sem barras, sem `<details>`).
  - CSS: as regras `.ucv-tp*` são do `#sec-tempo`; as peças comuns da
    cronoanálise que o bloco usa (`.ucv-regs`, `.ucv-chip`, `.ucv-cards`,
    `.uep-conv-tit`, `.ucv-pill`) têm o seletor das duas abas
    (`#sec-crono X,#sec-tempo X`). Peça comum nova no bloco → as duas abas.
  - Medido (Chromium, dados de 03/11): 1920, 1366 e 1280 sem nada passar da
    largura; a barra de abas fica com a mesma altura de antes (39 px a 1920,
    52 a 1366/1280 — lá ela já quebrava em duas linhas antes da aba nova).
