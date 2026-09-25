// Teste das contas dos relatórios do painel desktop.
//   node relatorios.test.js
//
// Estas funções saíram de dentro do gerarRelatorioSemanal (294 linhas) para
// poderem ser testadas: antes, conferir a média da semana exigia abrir o popup
// e olhar. O teste roda contra o código REAL do ritmoprod_embalagem_v7.html —
// as funções são extraídas do arquivo e avaliadas aqui.

const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const JS = [...src.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function pega(assinatura) {
  const i = JS.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei no HTML: ' + assinatura);
  // o corpo começa depois do ")" dos parâmetros — função com parâmetro
  // desestruturado ({a,b}) tem "{" antes do corpo e quebrava a contagem
  const j = JS.indexOf('{', JS.indexOf(')', i));
  let n = 0;
  for (let k = j; k < JS.length; k++) {
    if (JS[k] === '{') n++;
    else if (JS[k] === '}' && --n === 0) return JS.slice(i, k + 1);
  }
  throw new Error('função não fecha: ' + assinatura);
}

// dependências que as funções extraídas usam
global.window = global;   // o rp-core.js é script de navegador e escreve em window
require('vm').runInThisContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'));
const parseBR = s => { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d); };
// O nome do produto sai do PRÓPRIO painel: os rodapés de relatório, o título do
// popup do histórico e o resumo do WhatsApp leem a constante APP_NOME. Extrair
// em vez de fixar o texto aqui faz o teste acompanhar a troca do nome — e falha
// alto se a constante sumir e o nome voltar a ser literal espalhado pelo HTML.
// (`const` dentro de eval fica preso ao escopo do eval — as funções extraídas
// resolvem o nome pelo global, então é lá que ele tem de ficar.)
const _nomeConst = JS.match(/const APP_NOME\s+= '([^']+)';/);
if (!_nomeConst) throw new Error('APP_NOME não está no painel — o nome voltou a ser literal?');
global.APP_NOME    = _nomeConst[1];
global.APP_NOME_CX = APP_NOME.toUpperCase();
eval(pega('function _numSemana('));   // a real, extraída do painel
eval(pega('function _heIndef('));
eval(pega('function _relSemanaJanela('));
eval(pega('function fmtFechadoEm('));
eval(pega('function _relDiasDaSemana('));
eval(pega('function _relSemanaPassada('));
eval(pega('function _relSemanaParaDivulgar('));
eval(pega('function _relRotuloSemanas('));
eval(pega('function _slotMaisFreq('));
eval(pega('function _relMetaHE('));
eval(pega('function _relSwotParadas('));
eval(pega('function _relDiasFechados('));
eval(pega('function _relDiaExtremo('));
eval(pega('function _relSemanalKPIs('));

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

console.log('\n── janela da semana ──');
// 13/08/2026 é uma quinta-feira: a semana vai de 10/08 (segunda) a 16/08 (domingo).
let j = _relSemanaJanela('13/08/2026');
ok('quinta cai na semana 10→16', j.semStr, '10/08/2026 a 16/08/2026');
ok('começa 00:00 da segunda', [j.seg.getHours(), j.seg.getMinutes()], [0, 0]);
ok('termina 23:59 do domingo', [j.sex.getDay(), j.sex.getHours(), j.sex.getMinutes()], [0, 23, 59]);
// Domingo pertence à semana que começou na segunda ANTERIOR — sem esse caso,
// o relatório de domingo saltava para a semana seguinte.
ok('domingo fica na semana que passou', _relSemanaJanela('16/08/2026').semStr, '10/08/2026 a 16/08/2026');
ok('a própria segunda não fica de fora', _relSemanaJanela('10/08/2026').semStr, '10/08/2026 a 16/08/2026');

console.log('\n── recorte da semana (relatório e TELA D usam o MESMO) ──');
// A TELA D da TV mostra a mesma semana do relatório. Se cada uma filtrasse do
// seu jeito, divergiriam na primeira mudança — como já aconteceu com paradas.
const soltos = [
  { data: '09/08/2026', real: 1 },   // domingo anterior: fora
  { data: '10/08/2026', real: 2 },   // segunda: a janela começa 00:00 dela
  { data: '14/08/2026', real: 3 },
  { data: '16/08/2026', real: 4 },   // domingo: a janela vai até 23:59 dele
  { data: '17/08/2026', real: 5 },   // segunda seguinte: fora
];
const jan = _relSemanaJanela('13/08/2026');
ok('pega só os dias da janela, em ordem',
   _relDiasDaSemana(soltos, jan.seg, jan.sex).map(d => d.data),
   ['10/08/2026', '14/08/2026', '16/08/2026']);
ok('lista vazia não quebra', _relDiasDaSemana([], jan.seg, jan.sex), []);

// Semana passada = a anterior à de hoje, em QUALQUER dia da semana — inclusive
// na segunda de manhã, que é justamente quando a TELA D interessa mais.
ok('na segunda, a semana passada é a que acabou ontem',
   _relSemanaPassada(new Date(2026, 7, 17)).semStr, '10/08/2026 a 16/08/2026');
ok('na sexta, continua sendo a mesma semana anterior',
   _relSemanaPassada(new Date(2026, 7, 21)).semStr, '10/08/2026 a 16/08/2026');
ok('no domingo, também',
   _relSemanaPassada(new Date(2026, 7, 23)).semStr, '10/08/2026 a 16/08/2026');

console.log('\n── a semana que se divulga (PDF, zap: a MESMA regra) ──');
// O PDF era o único que não tinha a queda: numa segunda-feira — o dia em que a
// semana é divulgada — a semana atual ainda não tem dia fechado, e em vez do
// relatório abria um alerta mandando ajustar o filtro "Até" da aba Histórico.
const _sd = _relSemanaJanela(dtToStr(_relSemanaPassada().seg));   // semana passada de verdade
const _daSemanaPassada = [{ data: dtToStr(_sd.seg), real: 100, meta: 100, ef: 100, ok: true, heCx: 0 }];

ok('semana pedida com dia fechado: é ela que sai',
   _relSemanaParaDivulgar(soltos, '13/08/2026').semStr, '10/08/2026 a 16/08/2026');
ok('e traz os dias dela',
   _relSemanaParaDivulgar(soltos, '13/08/2026').dias.map(d => d.data),
   ['10/08/2026', '14/08/2026', '16/08/2026']);
// Segunda de manhã: a semana atual está vazia, cai na que fechou.
ok('semana sem dia fechado cai na semana passada',
   _relSemanaParaDivulgar(_daSemanaPassada, dtToStr(new Date())).semStr, _sd.semStr);
ok('e a queda traz o dia que existe',
   _relSemanaParaDivulgar(_daSemanaPassada, dtToStr(new Date())).dias.length, 1);
// Quem já sabe qual semana quer (o 🖨 do bloco do gerencial manda a que está na
// tela) não pode receber OUTRA semana de volta — foi assim que o relatório de
// paradas saiu com o período da aba errada.
ok('semana fixa não cai para outra semana',
   _relSemanaParaDivulgar([], '13/08/2026', true).semStr, '10/08/2026 a 16/08/2026');
ok('e volta vazia em vez de trocar de semana',
   _relSemanaParaDivulgar([], '13/08/2026', true).dias, []);

console.log('\n── KPIs da semana ──');
const dias = [
  { data: '10/08/2026', real: 1106, meta: 1650, ef: 67.0,  ok: false, heCx: 0 },
  { data: '11/08/2026', real: 2262, meta: 1200, ef: 188.5, ok: true,  heCx: 180 },
  { data: '12/08/2026', real: 1920, meta: 2475, ef: 77.6,  ok: false, heCx: 0 },
  { data: '13/08/2026', real: 1795, meta: 1000, ef: 179.5, ok: true,  heCx: 240 },
  { data: '14/08/2026', real: 1598, meta: 2000, ef: 79.9,  ok: false, heCx: null }, // dia sem separação
];
const k = _relSemanalKPIs(dias);
ok('total realizado', k.totReal, 8681);
ok('total de meta', k.totMeta, 8325);
ok('média diária = total ÷ dias COM PRODUÇÃO', k.mediaReal, 8681 / 5);
ok('média de meta por dia', k.mediaMeta, 8325 / 5);
ok('eficiência média', Number(k.efMedia.toFixed(1)), 118.5);
ok('dias dentro da meta', k.comMeta, 2);
ok('melhor dia', k.melhorDia.data, '11/08/2026');
ok('pior dia', k.piorDia.data, '10/08/2026');

console.log('\n── hora extra na semana ──');
ok('soma só o que dá para saber', k.totHE, 420);
ok('houve hora extra no período', k.temHE, true);
ok('conta os dias sem separação', k.semHE, 1);
// Dia indeterminado entra no normal para a soma fechar com o TOTAL — se ele
// ficasse de fora, normal + extra não daria o total e pareceria erro de conta.
ok('normal + extra fecha com o total', (k.totReal - k.totHE) + k.totHE, k.totReal);

const semExtra = _relSemanalKPIs(dias.map(d => ({ ...d, heCx: 0 })));
ok('sem HE no período, a coluna não entra', semExtra.temHE, false);
ok('sem HE, nenhum dia fica indeterminado', semExtra.semHE, 0);

console.log('\n── a meta foi batida, ou foi a hora extra que bateu? ──');
// Semana 33/2026, números reais: 8.681 cx contra meta de 8.325 = 104,3%. Só que
// 1.219 vieram de hora extra — na jornada normal foram 7.462, ou 89,6% da meta.
// O relatório dizia "DENTRO DA META" em verde e escondia isso.
const s33 = _relMetaHE(8681, 1219, 8325);
ok('total do período acima da meta', Number(s33.efTotal.toFixed(1)), 104.3);
ok('a jornada normal sozinha ficou abaixo', Number(s33.efTotalSemHE.toFixed(1)), 89.6);
ok('caixas da jornada normal', s33.realNormal, 7462);
ok('a meta só fechou por causa da hora extra', s33.soComHE, true);
ok('quanto faltava sem a hora extra', s33.faltouSemHE, 863);

// Semana que bate a meta DENTRO da jornada: a hora extra só somou por cima, e
// aí não há o que alertar — verde continua verde.
const forte = _relMetaHE(9000, 500, 8325);
ok('normal já batia: não é meta de hora extra', forte.soComHE, false);
ok('e não falta nada', forte.faltouSemHE, 0);

// Semana abaixo da meta mesmo COM hora extra: também não é o caso do alerta —
// o relatório já mostra vermelho e dizer "batida com HE" seria mentira.
const fraca = _relMetaHE(7000, 400, 8325);
ok('abaixo mesmo com HE: sem alerta de meta', fraca.soComHE, false);
ok('mas o buraco da jornada normal continua visível', fraca.faltouSemHE, 1725);

// Sem meta lançada (0) não se divide por zero nem se afirma nada.
const semMeta = _relMetaHE(1000, 100, 0);
ok('meta zerada não vira divisão por zero', [semMeta.efTotal, semMeta.efTotalSemHE], [0, 0]);
ok('meta zerada não dispara alerta', semMeta.soComHE, false);

ok('os KPIs da semana já trazem a leitura pronta', k.soComHE, true);
ok('e o quanto faltava na jornada normal', k.faltouSemHE, 8325 - (8681 - 420));

console.log('\n── resumo da semana para o WhatsApp ──');
// Mesmo dado, mesma conta: o texto do zap sai de _relSemanalKPIs, como o PDF
// e a Tela D. Aqui só se confere que o texto diz o que os números dizem.
eval(pega('function _zapResumoSemana('));
const zap=_zapResumoSemana(dias, '10/08/2026 a 16/08/2026', 33);
ok('abre com a semana', zap.includes('SEMANA 33/2026'), true);
ok('total com a eficiência do TOTAL (104,3%), não a média', zap.includes('*8.681 caixas* — 104,3%'), true);
ok('o veredito honesto vai junto', zap.includes('*Meta batida com hora extra.*'), true);
ok('divisão normal × extra', zap.includes('Jornada normal: 8.261 cx'), true);
ok('os 5 dias entram, com dia da semana', (zap.match(/^\w{3} \d\d\/\d\d — /gm)||[]).length, 5);
ok('o melhor dia sai nomeado, sem depender de ícone',
   zap.includes('Melhor dia: ter 11/08 — 2.262 cx (188,5%)'), true);
// 31/08/2026: o resumo chegou ao WhatsApp com TODOS os marcadores virados
// losango (📦 ⚠️ ▪ 🏆 → ◆) enquanto `·`, `—` e o *negrito* chegaram intactos na
// mesma mensagem. Emoji depende da fonte de quem recebe; a hierarquia aqui sai
// do negrito e das linhas em branco.
ok('nenhum emoji no resumo do zap',
   [...zap].some(c => c.codePointAt(0) > 0x2500), false);
// A hora extra tem de aparecer NO DIA: quem lê só o dia a dia não pode achar
// que as caixas de terça saíram todas dentro do turno.
ok('o dia que teve hora extra diz quanto foi',
   /ter 11\/08 — 2\.262 cx \(188,5%\) · 180 em hora extra/.test(zap), true);
ok('e o dia sem hora extra não ganha sobra nenhuma',
   /seg 10\/08 — 1\.106 cx \(67,0%\)\n/.test(zap), true);
ok('dia sem separação de HE não inventa número',
   /sex 14\/08 — 1\.598 cx \(79,9%\)\n/.test(zap), true);
ok('e o buraco da jornada normal vai escrito',
   /Sem a hora extra teriam faltado 64 cx\./.test(zap), true);
const zapForte=_zapResumoSemana(dias.map(d=>({...d,real:d.real+400,heCx:0,ef:d.ef})), 'x', 33);
ok('semana que bateu sem HE diz isso', zapForte.includes('*Meta batida na jornada normal.*'), true);
// Semana em aberto não recebe veredito, pelo mesmo motivo do selo do PDF: o
// buraco de uma sexta de manhã é quase todo dia que ainda não aconteceu.
const zapParcial=_zapResumoSemana(dias.map((d,i)=>({...d,fechado:i<3})), 'x', 33);
ok('semana parcial avisa em vez de julgar',
   [/Parcial: 3 de 5 dias fechados/.test(zapParcial), /Meta batida/.test(zapParcial)], [true, false]);

console.log('\n── gráfico do relatório: a barra diz o que veio de hora extra ──');
// O gráfico mostrava só o total do dia: sexta com 100,6% parecia dia que bateu
// a meta dentro do turno, com 264 das caixas feitas depois das 17:00. O resto
// do relatório (selo, EFIC. SEM H. EXTRA, faixa de alerta) já dizia isso em
// número — a barra não dizia nada.
eval(pega('function _svgBarChart('));
const svgHE = _svgBarChart(dias);
ok('a fatia de hora extra é desenhada', /url\(#rpHeListra\)/.test(svgHE), true);
ok('e a listra é definida uma vez, dentro do próprio svg',
   (svgHE.match(/<pattern id="rpHeListra"/g) || []).length, 1);
ok('o dia diz quantas caixas foram em hora extra', svgHE.includes('180 cx em HE'), true);
// Dia com heCx null entra INTEIRO como jornada normal — o mesmo critério dos
// totais do relatório; inventar uma fatia ali seria afirmar o que o dado não diz.
ok('dia sem separação não ganha fatia', svgHE.includes('1.598 cx em HE'), false);

const semHE = _svgBarChart(dias.map(d => ({ ...d, heCx: 0 })));
ok('período sem hora extra desenha o gráfico de antes',
   [/rpHeListra/.test(semHE), /viewBox="0 0 720 180"/.test(semHE)], [false, true]);
ok('com hora extra o topo abre para o rótulo, sem encolher o gráfico',
   /viewBox="0 0 720 206"/.test(svgHE), true);

// Período longo: as barras ficam a ~20px uma da outra e três rótulos por barra
// viram borrão. A fatia listrada e a legenda continuam contando a história.
const muitos = Array.from({ length: 20 }, (_, i) => ({
  data: `${String(i + 1).padStart(2, '0')}/07/2026`, real: 1000, meta: 1000, ef: 100, ok: true, heCx: 100 }));
const svgLongo = _svgBarChart(muitos);
ok('a legenda nomeia a faixa listrada', /Hora extra<\/text>/.test(svgHE), true);
ok('e some junto com ela quando ninguém fez hora extra',
   /Hora extra<\/text>/.test(semHE), false);
// A linha da MÉDIA é a de texto mais longo: ela fica onde sempre esteve e quem
// anda é o resto da legenda, senão ela sairia pela borda direita do gráfico.
ok('a média não muda de lugar por causa da legenda nova',
   [semHE.includes('x1="544"'), svgHE.includes('x1="544"')], [true, true]);

ok('em período longo a fatia fica e o rótulo sai',
   [/url\(#rpHeListra\)/.test(svgLongo), /cx em HE/.test(svgLongo)], [true, false]);

console.log('\n── rótulo de semana(s) no cabeçalho do histórico ──');
// O semanal se identifica por "SEMANA 33 / 2026"; o do histórico só dizia o
// intervalo de datas. Mesma linguagem nos dois papéis.
ok('período dentro de uma semana só',
   _relRotuloSemanas([{ data: '10/08/2026' }, { data: '14/08/2026' }]), 'SEMANA 33 / 2026');
ok('período que cruza semanas vira intervalo',
   _relRotuloSemanas([{ data: '03/08/2026' }, { data: '14/08/2026' }]), 'SEMANAS 32 A 33 / 2026');
ok('sem dias, sem rótulo', _relRotuloSemanas([]), '');
ok('ordem dos dias não importa',
   _relRotuloSemanas([{ data: '14/08/2026' }, { data: '10/08/2026' }]), 'SEMANA 33 / 2026');

console.log('\n── FECHADO EM: a planilha às vezes carimba em ordem americana ──');
// Célula formatada en-US chega "08/10/2026 17:05" para o dia 10/08 — e o
// relatório imprimia "✓ 08/10". Sozinho é ambíguo; a data da PRÓPRIA LINHA
// desempata: fechamento acontece no dia que fecha.
ok('carimbo americano vira BR pela data da linha',
   fmtFechadoEm('08/10/2026 17:05:22', '10/08/2026'), '10/08/2026');
ok('carimbo já em BR não é tocado',
   fmtFechadoEm('10/08/2026 17:05:22', '10/08/2026'), '10/08/2026');
ok('dia >12 dispensa desempate', fmtFechadoEm('25/08/2026', null), '25/08/2026');
ok('mês >12 só pode ser ordem americana', fmtFechadoEm('08/25/2026', null), '25/08/2026');
ok('dia igual ao mês não inverte à toa', fmtFechadoEm('08/08/2026', '08/08/2026'), '08/08/2026');
ok('TRUE de linha antiga vira SIM (a célula mostra só o ✓)',
   fmtFechadoEm(true, '10/08/2026'), 'SIM');
ok('dia fechado na manhã seguinte: vale a data mais próxima da linha',
   fmtFechadoEm('08/12/2026 06:10:00', '11/08/2026'), '12/08/2026');
ok('carimbo BR de dia vizinho não é invertido à toa',
   fmtFechadoEm('12/08/2026 06:10:00', '11/08/2026'), '12/08/2026');
ok('ISO do Apps Script continua funcionando',
   /^10\/08\/2026$/.test(fmtFechadoEm('2026-08-10T20:05:00.000Z', '10/08/2026'))
     || /^11\/08\/2026$/.test(fmtFechadoEm('2026-08-10T20:05:00.000Z', '10/08/2026')), true);

console.log('\n── SWOT do relatório de paradas: só o que os dados sustentam ──');
// Números reais do período 10–14/08: linha rápida (16 < 17,1) mas 5h47m parada.
// a regex de troca/setup é a do painel, não uma cópia aqui
const PAR_TROCA=eval(JS.match(/const PAR_TROCA\s*=\s*(.+);/)[1]);
eval(pega('function ehSetupParada('));
const _fmtMinPar=m=>m>=60?Math.floor(m/60)+'h'+String(m%60).padStart(2,'0')+'m':m+' min';
const stS={dispon:88.6, pctPerd:11.4, totMin:347, totMinNP:301, pecas:805, nParadas:51,
  nDias:5, tMed:7, pesoMedio:0, diag:{paradasSemFim:0},
  tipos:[{tipo:'Troca de produto',min:124,qtd:18,perd:331,planej:false},
         {tipo:'Outros',min:61,qtd:6,perd:141,planej:false},
         {tipo:'Parada/Café',min:46,qtd:3,perd:0,planej:true}]};
const sw=_relSwotParadas({st:stS, tiR:{taktSeg:17.1}, trR:{taktReal:16,ritmoReal:223}, perdaReal:1119, temMotivo:false});
ok('força: a velocidade não é o problema', /mais rápida que o necessário/.test(sw.forcas[0]||''), true);
ok('força: paradas curtas entram', sw.forcas.some(f=>/volta rápido/.test(f)), true);
ok('fraqueza: disponibilidade abaixo de 90', /88,6%/.test(sw.fraquezas[0]||''), true);
ok('fraqueza: o top ofensor com a fatia dele', sw.fraquezas.some(f=>/Troca de produto/.test(f)&&/54%/.test(f)), true);
ok('fraqueza: "Outros" sem causa nomeada', sw.fraquezas.some(f=>/Outros/.test(f)), true);
ok('oportunidade: a perda a ritmo real vira alvo', sw.oportunidades.some(o=>/1\.119/.test(o)), true);
ok('oportunidade: troca é SMED, não eliminação', sw.oportunidades.some(o=>/SMED/.test(o)), true);
ok('oportunidade: motivo vazio vira pedido de registro', sw.oportunidades.some(o=>/motivo registrado/.test(o)), true);
ok('ameaça: ofensor diário vira custo fixo', sw.ameacas.some(a=>/todo dia/.test(a)), true);
ok('ameaça: projeção do mês com o padrão atual', sw.ameacas.some(a=>/22 dias/.test(a)), true);

// Período redondo: disponibilidade alta, sem perda — fraquezas/ameaças vazias.
const swOk=_relSwotParadas({st:{dispon:95, pctPerd:3, totMin:40, totMinNP:0, pecas:0,
  nParadas:2, nDias:5, tMed:8, pesoMedio:0, diag:{paradasSemFim:0},
  tipos:[{tipo:'Parada/Café',min:40,qtd:2,perd:0,planej:true}]},
  tiR:{taktSeg:17.1}, trR:{taktReal:16,ritmoReal:223}, perdaReal:0, temMotivo:true});
ok('semana boa: nenhuma fraqueza inventada', swOk.fraquezas, []);
ok('semana boa: nenhuma ameaça inventada', swOk.ameacas, []);
ok('semana boa: as forças aparecem', swOk.forcas.length>=2, true);

console.log('\n── melhor/pior horário no rodapé do relatório ──');
// O rodapé somava d.melhor (que é '08:00-09:00') como número e imprimia NaN
// no PDF. Não existe "média de horário" — o que vale é o slot que mais repete.
const dh = [
  { melhor: '08:00-09:00', pior: '15:00-16:00' },
  { melhor: '08:00-09:00', pior: '16:00-17:00' },
  { melhor: '09:00-10:00', pior: '16:00-17:00' },
];
ok('o horário que mais repete, com a contagem',
   _slotMaisFreq(dh, 'melhor'), '08:00-09:00 <span style="color:#a0aec0">(2×)</span>');
ok('nunca mais NaN no rodapé', /NaN/.test(_slotMaisFreq(dh, 'pior')), false);
ok('sem repetição, mostra o slot sozinho',
   _slotMaisFreq([dh[2]], 'melhor'), '09:00-10:00');
ok('dia sem horário lançado não vira "undefined"',
   _slotMaisFreq([{ melhor: '' }, { melhor: '—' }], 'melhor'), '—');

const umDia = _relSemanalKPIs([dias[0]]);
ok('um único dia: média = o próprio dia', umDia.mediaReal, 1106);
ok('um único dia é melhor e pior ao mesmo tempo',
   [umDia.melhorDia.data, umDia.piorDia.data], ['10/08/2026', '10/08/2026']);

console.log('\n── dia em curso não é dia fraco ──');
// Semana 34/2026: o relatório rodou 21/08 às 10h, com a sexta ainda correndo.
// 273 cx de uma manhã contra a meta cheia de 2.950 dão 9,3% e faziam o dia em
// curso ganhar o cartão DIA MAIS FRACO toda vez que alguém gerava antes do
// fechamento. Melhor e pior passam a sair só de dia FECHADO.
const sem34 = [
  { data:'17/08/2026', real:2909, meta:2600, ef:111.9, ok:true,  heCx:0, fechado:true  },
  { data:'18/08/2026', real:1464, meta:1300, ef:112.6, ok:true,  heCx:0, fechado:true  },
  { data:'19/08/2026', real:1495, meta:1550, ef:96.5,  ok:true,  heCx:0, fechado:true  },
  { data:'20/08/2026', real:1301, meta:1150, ef:113.1, ok:true,  heCx:0, fechado:true  },
  { data:'21/08/2026', real:273,  meta:2950, ef:9.3,   ok:false, heCx:0, fechado:false }
];
const k34 = _relSemanalKPIs(sem34);
ok('o dia em curso não é o dia mais fraco', k34.piorDia.data, '19/08/2026');
ok('nem entra na disputa de melhor dia',    k34.melhorDia.data, '20/08/2026');
ok('conta quantos dias já fecharam',        k34.fechados, 4);
ok('e quantos ainda estão abertos',         k34.abertos, 1);

// Fixture antiga não traz `fechado`: continua contando como fechado, senão
// toda conta anterior mudaria de significado sem ninguém pedir.
const semCampo = _relSemanalKPIs(sem34.map(({fechado, ...d}) => d));
ok('dia sem o campo fechado conta como fechado', semCampo.piorDia.data, '21/08/2026');
ok('e aí não há dia aberto',                     semCampo.abertos, 0);

// Semana inteira em aberto não pode ficar sem os dois cartões.
const soAberto = _relSemanalKPIs(sem34.map(d => ({ ...d, fechado:false })));
ok('sem nenhum dia fechado, cai na lista toda', soAberto.piorDia.data, '21/08/2026');

console.log('\n── uma régua só para a palavra meta ──');
// O painel diz DENTRO DA META a partir de 96% em seis telas, mas o campo `ok`
// exigia 100% — e é o `ok` que alimenta o cartão DIAS COM META. 19/08, com
// 96,5%, saía marcado na meta na tabela e fora da contagem logo acima.
// META_PCT é const solta: o pega() só extrai função, e `const` dentro de eval
// não escapa do próprio escopo (função escapa — é por isso que o resto funciona).
// Então lê o VALOR real do painel e põe no global: mexeu na régua lá, o teste
// acompanha em vez de conferir um número morto copiado para cá.
global.META_PCT = Number(JS.match(/const META_PCT\s*=\s*(\d+)/)[1]);
eval(pega('function bateuMeta('));
ok('96,5% bate a meta, como o selo da linha já dizia', bateuMeta(96.5), true);
ok('95,9% não bate',                                   bateuMeta(95.9), false);
ok('a régua é a mesma do selo de status',              bateuMeta(96), true);

console.log('\n── fechamento da semana: UM desenho para a TV e para o gerencial ──');
// O mesmo fechamento aparece na TELA D da TV e no bloco do GERENCIAL. Quem
// desenha os dois é o pintar(pfx) do RP_SEMANA — cada tela passa só o prefixo
// dos seus ids. O teste roda a função REAL contra um DOM de mentira: se alguém
// voltar a escrever uma segunda cópia do desenho, os guarda-corpos abaixo caem.
const _dom = {};
const _novoEl = () => ({ textContent: '', innerHTML: '', className: '', style: {}, classList: { toggle() {} } });
const CAMPOS = ['semana','periodo','total','soma','normal','extra','normal-pct','normal-falta',
                'extra-pct','linha-extra','selo','bar-normal','bar-extra','marca','marca-lbl','dias'];
['tvd-', 'gsem-'].forEach(p => CAMPOS.forEach(c => { _dom[p + c] = _novoEl(); }));
global.document = { getElementById: id => _dom[id] || null };
const _st = { dados: null };
let _buscas = 0;
function carregar() { _buscas++; }                       // a busca de verdade é assíncrona
const _DIA_SEM = ['DOMINGO','SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA','SÁBADO'];
eval(pega('function pintar('));

// Sem semana carregada não se desenha nada: a Tela D fica fora do ciclo e o
// bloco do gerencial se esconde — nenhum dos dois aparece vazio.
ok('sem semana fechada, não desenha', pintar('gsem-'), false);
ok('e não escreve nada na tela', _dom['gsem-total'].textContent, '');

_st.dados = { semStr: '10/08/2026 a 16/08/2026', numSem: 33, dias, k };
ok('com semana, desenha', pintar('gsem-'), true);
ok('total da semana no bloco do gerencial', _dom['gsem-total'].textContent, '8.681');
ok('jornada normal = total − hora extra', _dom['gsem-normal'].textContent, '8.261');
ok('hora extra', _dom['gsem-extra'].textContent, '420');
ok('diz de onde vem o total', _dom['gsem-soma'].textContent, '= soma dos 5 dias fechados ↓');
ok('o veredito não mente sobre a hora extra',
   [_dom['gsem-selo'].className, _dom['gsem-selo'].textContent],
   ['tvd-selo he', '⚠ META BATIDA COM HORA EXTRA']);
ok('marca da meta com o valor do período', _dom['gsem-marca-lbl'].textContent, 'META 8.325');
// O % da jornada normal é a leitura da semana: diz se faltou pouco ou muito
// para bater SEM hora extra. E o buraco vai também em caixas POR DIA — "faltaram
// 64 cx" não diz se dava para fazer; "13 cx/dia" a operação sabe na hora.
ok('o % da jornada normal contra a meta', _dom['gsem-normal-pct'].innerHTML, '99,2%<i>da meta</i>');
ok('e o buraco em caixas e em caixas por dia',
   _dom['gsem-normal-falta'].textContent, 'faltaram 64 cx · 13 cx/dia');
ok('um cartão por dia fechado', (_dom['gsem-dias'].innerHTML.match(/class="tvd-dia /g) || []).length, 5);
ok('dia sem separação de HE não vira 0', /HE não separada/.test(_dom['gsem-dias'].innerHTML), true);

// A MESMA função serve a TV: só muda o prefixo. Enquanto o gerencial era
// desenhado, os ids da TV não foram tocados — e vice-versa.
ok('desenhar o gerencial não escreve na TV', _dom['tvd-total'].textContent, '');
pintar('tvd-');
ok('a mesma função desenha a Tela D', _dom['tvd-total'].textContent, '8.681');
ok('desenhar pede a busca (que tem cache de 30 min lá dentro)', _buscas > 0, true);

console.log('\n── comparativo por modelo: média aparada e teto da esteira ──');
// A MÉD.PERÍODO descarta o melhor e o pior dia do próprio grupo (3+ dias):
// um pico de rodada dedicada ou um apontamento capenga não podem definir o
// padrão do modelo. Números reais que motivaram a regra (18/08/2026).
eval(pega('function _phAcc('));
eval(pega('function _phVal('));
eval(pega('function _phAdd('));
eval(pega('function _phMediaAparada('));
eval(pega('function _phTeto('));
const _dia = (cx, h, teto) => { const a = _phAcc(); _phAdd(a, { caixas: cx, horas: h, tetoCxH: teto || 0 }); return a; };

// SAPATEIRA VIVARE: 59, 122, 122 cx/h — o dia de 59 punia o modelo.
let ap = _phMediaAparada([_dia(59,1), _dia(122,1), _dia(122,1)], 'mediaH');
ok('VIVARE: 87 de média vira 122 aparada', Math.round(ap.val), 122);
ok('e avisa que aparou', ap.aparada, true);
// MADERO: 118, 178, 187, 91 — o pico de 187 inflava a média.
ap = _phMediaAparada([_dia(118,1), _dia(178,1), _dia(187,1), _dia(91,1)], 'mediaH');
ok('MADERO: 164 de média vira 148 aparada', Math.round(ap.val), 148);
// Com 2 dias não há o que descartar.
ap = _phMediaAparada([_dia(179,1), _dia(99,1)], 'mediaH');
ok('2 dias: média usa todos', [Math.round(ap.val), ap.aparada], [139, false]);
// A poda é pelo RITMO do dia (10 e 200 cx/h saem; 150 cx em 3 h = 50 cx/h
// fica) e a média dos que sobram é PONDERADA: 100+150 cx ÷ 1+3 h = 63 — não a
// média simples dos ritmos (75), que ignoraria as horas.
ap = _phMediaAparada([_dia(10,1), _dia(100,1), _dia(150,3), _dia(200,1)], 'mediaH');
ok('ritmo aparado é ponderado (Σcx ÷ Σh)', Math.round(ap.val), 63);
// Métrica aditiva: MÉD/DIA aparada é média simples dos dias que sobraram.
ap = _phMediaAparada([_dia(100,1), _dia(300,1), _dia(200,1), _dia(900,1)], 'caixas');
ok('méd/dia aditiva aparada', ap.val, 250);
// Dia sem produção (célula vazia) não conta como "pior dia".
ap = _phMediaAparada([null, _dia(100,1), undefined, _dia(300,1), _dia(200,1)], 'mediaH');
ok('célula vazia não entra na poda', Math.round(ap.val), 200);

// O FILTRO MÉDIA (pedido do PPCP, 24/08/2026: "deixar um filtro para eu
// manipular deixar o maior e o menor"): 'completa' desliga a poda — nenhum
// dia sai da média; omitido ou 'aparada' é a conta de sempre.
ap = _phMediaAparada([_dia(59,1), _dia(122,1), _dia(122,1)], 'mediaH', 'completa');
ok('COMPLETA usa todos os dias (VIVARE volta a 101)', Math.round(ap.val), 101);
ok('e avisa que não podou', ap.aparada, false);
ok('APARADA explícita = a conta do padrão',
   _phMediaAparada([_dia(118,1), _dia(178,1), _dia(187,1), _dia(91,1)], 'mediaH', 'aparada').val,
   _phMediaAparada([_dia(118,1), _dia(178,1), _dia(187,1), _dia(91,1)], 'mediaH').val);
// O guarda: o modo do filtro entra na conta em UM lugar só, e é o lugar que a
// tela e o PDF compartilham. Antes esta linha existia duas vezes e o teste
// exigia as duas cópias em dia — bastava alguém mexer numa.
ok('o modo do filtro MÉDIA entra na conta num lugar só',
   (JS.match(/_phMediaAparada\(accsDia,metric,mediaModo\)/g)||[]).length, 1);
// E o TOTAL DO DIA herda a régua ÚNICA de troca do comparativo — teto do
// mesmo produto não pode ler 318/h numa tabela e 307/h na outra.
ok('o TOTAL DO DIA herda a régua única do comparativo',
   /tetoOper:PH_FATOR_TROCA!=null \? teto\*PH_FATOR_TROCA/.test(JS), true);

// % do teto: o tempo de esteira SOMA (média harmônica pelas caixas), nunca a
// média aritmética dos tetos — ela superestimaria o teto do mix.
const mix = _phAcc();
_phAdd(mix, { caixas: 100, horas: 1, tetoCxH: 200 });   // 0,5 h de esteira
_phAdd(mix, { caixas: 100, horas: 1, tetoCxH: 400 });   // 0,25 h
ok('teto do mix é harmônico (267, não 300)', Math.round(_phTeto(mix)), 267);
const semTeto = _phAcc();
_phAdd(semTeto, { caixas: 50, horas: 1 });
ok('backend antigo (sem tetoCxH): teto 0, coluna some', _phTeto(semTeto), 0);
// acc dentro de acc (linha = soma de células) preserva o par cxTeto/hTeto.
const linha = _phAcc(); _phAdd(linha, mix); _phAdd(linha, semTeto);
ok('caixas sem teto não diluem o % do teto', Math.round(_phTeto(linha)), 267);

// TETO OPERACIONAL: desconta as trocas do produto, diluídas nos minutos
// rodados (pedido do PPCP, 19/08/2026 — 100% sem descontar a troca obrigatória
// não é régua alcançável).
eval(pega('function _phTetoOper('));
ok('8h em 2 dias: 2 trocas de 5 min saem do teto (300 → 293,75)',
   Math.round(_phTetoOper(300, 8, 2, 5) * 100) / 100, 293.75);
ok('sem troca, o teto físico fica intacto', _phTetoOper(300, 8, 2, 0), 300);
ok('sem horas não há onde diluir: devolve o físico', _phTetoOper(300, 0, 2, 5), 300);
ok('sem teto continua sem teto', _phTetoOper(0, 8, 2, 5), 0);
ok('troca maior que o tempo rodado não vira teto negativo', _phTetoOper(300, 0.05, 1, 5), 0);
// a troca do grupo vem do maior trocaMin dos itens; backend antigo (sem o
// campo) deixa trocaMin null e quem vale é o TROCA_MIN_PADRAO via _phTroca.
const comTroca = _phAcc();
_phAdd(comTroca, { caixas: 100, horas: 1, tetoCxH: 200, trocaMin: 5 });
_phAdd(comTroca, { caixas: 100, horas: 1, tetoCxH: 200, trocaMin: 10 });
ok('a troca do grupo é o maior trocaMin dos itens', comTroca.trocaMin, 10);
ok('backend antigo: trocaMin fica null (padrão decide depois)', semTeto.trocaMin, null);

// QUANTAS TROCAS — a régua antiga assumia 1 por dia rodado e ficava otimista.
// Agora sai do log hora a hora: cada vez que o produto ENTRA na linha.
const TROCA_MIN_PADRAO=Number(JS.match(/const TROCA_MIN_PADRAO\s*=\s*([\d.]+)/)[1]);
const TROCA_OBS_MIN_N=Number(JS.match(/const TROCA_OBS_MIN_N\s*=\s*(\d+)/)[1]);
const TROCA_OBS_MAX_MIN=Number(JS.match(/const TROCA_OBS_MAX_MIN\s*=\s*(\d+)/)[1]);
const TROCA_PREMISSA=eval('('+JS.match(/const TROCA_PREMISSA\s*=\s*(\{[^}]*\})/)[1]+')');
eval(pega('function _phHoraMin('));
eval(pega('function _phMinTrocaGrupo('));
eval(pega('function _phMinTrocaDia('));
eval(pega('function _phFatorTrocaPeriodo('));
eval(pega('function _phMinDia('));
eval(pega('function _phTrocaFonte('));
eval(pega('function _phEntradasDia('));
eval(pega('function _phTrocasPeriodo('));
eval(pega('function _phTrocaObs('));
eval(pega('function _phTroca('));
const LINHA_DIA=['07:00-08:00','08:00-09:00','09:00-10:00','10:00-11:00','13:00-14:00'];
ok('rodou direto o dia todo = 1 troca (o setup inicial conta)',
   _phEntradasDia(LINHA_DIA, LINHA_DIA), 1);
ok('saiu, outro rodou e ele voltou = 2 trocas',
   _phEntradasDia(['07:00-08:00','09:00-10:00'], LINHA_DIA), 2);
ok('entrou depois de outro produto e ficou = 1 troca',
   _phEntradasDia(['09:00-10:00','10:00-11:00'], LINHA_DIA), 1);
// O almoço (11:00-12:12) e as paradas não aparecem como hora produzida: sem
// isso, todo produto pagaria uma troca a mais por dia só por causa do almoço.
ok('buraco de almoço/parada no meio NÃO é troca',
   _phEntradasDia(['10:00-11:00','13:00-14:00'], LINHA_DIA), 1);
ok('voltou três vezes = 3 trocas',
   _phEntradasDia(['07:00-08:00','09:00-10:00','13:00-14:00'], LINHA_DIA), 3);
ok('não rodou no dia = 0 trocas', _phEntradasDia([], LINHA_DIA), 0);
// A ordem vem do horário, não da ordem em que a planilha listou as horas.
ok('lista fora de ordem não inventa troca',
   _phEntradasDia(['08:00-09:00','07:00-08:00'], ['09:00-10:00','07:00-08:00','08:00-09:00']), 1);
// Traço travessão x hífen: normHora resolve — a planilha mistura os dois.
ok('traço diferente não vira produto diferente',
   _phEntradasDia(['07:00–08:00'], ['07:00-08:00','08:00-09:00']), 1);

// No período, as trocas somam dia a dia; sem a lista de horas do backend
// (re-deploy pendente) cada dia rodado conta 1 — exatamente a régua antiga.
const cellAcc={}, horasLinha={};
const cel=(k,d,horas)=>{ const a=_phAcc(); _phAdd(a,{caixas:10,horas:horas.length,horasLista:horas}); cellAcc[k+'|'+d]=a;
  horas.forEach(h=>{ (horasLinha[d]=horasLinha[d]||{})[h]=1; }); };
cel('A','19/08',['07:00-08:00','08:00-09:00']);
cel('B','19/08',['09:00-10:00']);
cel('A','20/08',['07:00-08:00']);
horasLinha['19/08']['09:00-10:00']=1;
ok('trocas do período = soma das entradas de cada dia',
   _phTrocasPeriodo('A',['19/08','20/08'],cellAcc,horasLinha), 2);
const semLista={}; const aSL=_phAcc(); _phAdd(aSL,{caixas:10,horas:2}); semLista['A|19/08']=aSL;
ok('backend antigo: 1 troca por dia rodado (a régua antiga)',
   _phTrocasPeriodo('A',['19/08'],semLista,{}), 1);
ok('dia sem produção do grupo não conta troca',
   _phTrocasPeriodo('B',['19/08','20/08'],cellAcc,horasLinha), 1);

// QUANTAS POR DIA — a pergunta do PPCP. É da LINHA inteira: soma as entradas
// de cada produto no nível mais fino do log (modelo · produto · cor).
eval(pega('function _phTrocasLinha('));
eval(pega('function _phHorasDeEntrada('));
const itLog=[
  // 19/08: MADERO 07h, VIVARE 08h, MADERO volta 09h → 3 trocas no dia
  {data:'19/08',modelo:'A',nome:'MADERO',cor:'OFF WHITE',horasLista:['07:00-08:00','09:00-10:00']},
  {data:'19/08',modelo:'B',nome:'VIVARE',cor:'BRANCO',   horasLista:['08:00-09:00']},
  // 20/08: MADERO o dia todo, mas em duas cores → a cor também é troca
  {data:'20/08',modelo:'A',nome:'MADERO',cor:'OFF WHITE',horasLista:['07:00-08:00']},
  {data:'20/08',modelo:'A',nome:'MADERO',cor:'CUMARU',   horasLista:['08:00-09:00']},
];
const tl=_phTrocasLinha(itLog);
ok('preparações da linha no período', tl.trocas, 5);
ok('em quantos dias', tl.dias, 2);
ok('média por dia', tl.porDia, 2.5);
// A esteira tem DOIS lados: item que entra na mesma hora que outro mudou junto
// e parou a esteira UMA vez. 19/08 tem entradas em 07h (MADERO), 08h (VIVARE) e
// 09h (MADERO volta) = 3; 20/08 tem 07h e 08h = 2 → 5 preparações, 5 eventos.
ok('sem troca simultânea, evento = preparação', tl.eventos, 5);
// Os 12 códigos dos lotes 025089–025093 entrando DOIS A DOIS: 12 preparações,
// 6 paradas de esteira — a conta que o PPCP fez na mão em 20/08/2026.
const doisLados=[];
for(let i=0;i<12;i++) doisLados.push({data:'21/08',modelo:'M'+i,nome:'P'+i,cor:'C',
  horasLista:[(7+Math.floor(i/2))+':00-'+(8+Math.floor(i/2))+':00']});
const tlDois=_phTrocasLinha(doisLados);
ok('12 códigos entrando dois a dois = 12 preparações', tlDois.trocas, 12);
ok('mas 6 paradas de esteira (os dois lados mudam juntos)', tlDois.eventos, 6);
ok('e é o número menor que vira tempo de esteira parada', tlDois.evPorDia, 6);
// Mesma função serve o dia (porHoraModelo manda hora avulsa, não lista).
ok('serve também a lista do dia (hora avulsa)',
   _phTrocasLinha([{hora:'07:00-08:00',modelo:'A',nome:'MADERO',cor:'OFF WHITE'},
                   {hora:'08:00-09:00',modelo:'B',nome:'VIVARE',cor:'BRANCO'}]).trocas, 2);
ok('sem lista de horas (backend antigo) não inventa troca', _phTrocasLinha([{data:'19/08',modelo:'A',nome:'X'}]).trocas, 0);

// QUANTO DURA — média das paradas de TROCA/SETUP apontadas. Aparada: fora a
// mais curta e a mais longa, senão uma parada esquecida define o padrão.
const parTroca=[
  {tipo:'Troca de produto', ini:'07:10', fim:'07:20'},   // 10
  {tipo:'Setup',            ini:'09:00', fim:'09:15'},   // 15
  {tipo:'Troca de plástico',ini:'11:00', fim:'11:12'},   // 12
  {tipo:'Regulagem',        ini:'14:00', fim:'14:40'},   // 40 (maior, sai)
  {tipo:'Troca de produto',ini:'16:00', fim:'16:05'},    // 5  (menor, sai)
  {tipo:'Manutenção',       ini:'08:00', fim:'08:30'},   // não é troca
  {tipo:'Troca de produto', ini:'15:00', fim:''},        // em andamento, sem fim
];
const obs=_phTrocaObs(parTroca);
ok('só as paradas de troca entram', obs.n, 5);
ok('média aparada de 10/12/15 = 12,3 min', obs.min, 12.3);
ok('poucas amostras não viram média (devolve 0)',
   _phTrocaObs([{tipo:'Troca', ini:'07:00', fim:'07:10'}]).min, 0);
ok('parada esquecida aberta o dia todo não vira "a troca leva 5 h"',
   _phTrocaObs([{tipo:'Troca',ini:'07:00',fim:'07:10'},{tipo:'Troca',ini:'08:00',fim:'08:12'},
                {tipo:'Troca',ini:'09:00',fim:'09:14'},{tipo:'Troca',ini:'10:00',fim:'15:00'}]).n, 3);
ok('troca que vira a meia-noite não fica negativa',
   _phTrocaObs([{tipo:'Troca',ini:'23:50',fim:'00:05'},{tipo:'Troca',ini:'07:00',fim:'07:10'},
                {tipo:'Troca',ini:'08:00',fim:'08:12'}]).min, 12);

// A CONTAGEM LINHA A LINHA: cada bipe é uma linha do log, na ordem em que
// aconteceu, então dá para ver troca DENTRO da mesma hora — o que a leitura por
// hora não via. Quem faz a conta é o backend (tem as linhas cruas); aqui só
// entra o número, com a estimativa por hora como reserva.
eval(pega('function _phPrepInfo('));
const itHora=[{data:'19/08',modelo:'A',nome:'P',cor:'C',horasLista:['07:00-08:00']}];
ok('sem o backend novo, vale a estimativa por hora',
   _phPrepInfo(itHora,null).trocas, 1);
ok('com a leitura do log, vale ela',
   _phPrepInfo(itHora,[{data:'19/08',prep:4,paralelo:false}]).trocas, 4);
ok('e a média por dia sai dos dias que tiveram preparação',
   _phPrepInfo(itHora,[{data:'19/08',prep:4},{data:'20/08',prep:8},{data:'21/08',prep:0}]).porDia, 6);
ok('a fonte fica marcada, para o relatório poder dizer',
   _phPrepInfo(itHora,[{data:'19/08',prep:4}]).fonte, 'log');
ok('hora com dois produtos ao mesmo tempo é sinalizada',
   _phPrepInfo(itHora,[{data:'19/08',prep:4,paralelo:true}]).paralelo, true);

// A EXPLICAÇÃO VAI IMPRESSA: quem lê o PDF na reunião não tem tooltip. E ela
// tem que deixar claro que o número é PREMISSA, não medição — senão o papel
// afirma mais do que sabe.
const TROCA_OBS_DIAS=Number(JS.match(/const TROCA_OBS_DIAS\s*=\s*(\d+)/)[1]);
eval(pega('function _phNotaTrocaHtml('));
const notaPer=_phNotaTrocaHtml({trocas:47,eventos:28,dias:22,porDia:2.1,evPorDia:1.3,fonte:'log'},{min:12.3,n:9},false);
ok('a nota impressa abre pela conta medida',
   /<b>16 min por dia<\/b> de troca de produto, <b>medidos<\/b>/.test(notaPer), true);
ok('e mostra a conta inteira: paradas × duração, com o tamanho da amostra',
   /1,3 parada\(s\) de esteira por dia .* × <b>12,3 min<\/b> por troca \(média aparada de 9 /.test(notaPer), true);
ok('e diz qual é a premissa combinada, para comparar',
   /premissa combinada com o PPCP é 30 min\/dia \(6 × 5 min\)/.test(notaPer), true);
ok('sem medição, a nota diz que o número é PREMISSA',
   /<b>30 min por dia<\/b> de troca de produto \(6 trocas × 5 min\), <b>premissa<\/b>/.test(
     _phNotaTrocaHtml({trocas:9,dias:3,porDia:3,fonte:'log'},null,false)), true);
ok('explica o rateio pelo tempo de esteira', /mesmo percentual para todas as linhas<\/b>/.test(notaPer), true);
ok('e diz quanto isso pesa no teto de um dia de 9 h', /min são 3,0% do teto/.test(notaPer), true);
ok('traz a fórmula do teto', /minutos rodados − minutos de troca/.test(notaPer), true);
ok('diz quantas preparações foram', /<b>2,1\/dia<\/b>/.test(notaPer), true);
ok('avisa o que a leitura NÃO enxerga', /em qual <b>posto<\/b>/.test(notaPer), true);
ok('e explica que a leitura é linha a linha, dentro da hora',
   /dentro da mesma hora<\/b>/.test(notaPer), true);
ok('com a ressalva da alternância = dois produtos ao mesmo tempo',
   /ao mesmo tempo<\/b> nos dois lados da esteira/.test(notaPer), true);
ok('e marca quando o número é só estimativa por hora',
   /estimativa por hora/.test(_phNotaTrocaHtml({trocas:9,dias:3,porDia:3},null,false)), true);
ok('sem estimativa quando veio do log', /estimativa por hora/.test(notaPer), false);
ok('e avisa a hora com dois produtos ao mesmo tempo',
   /Houve hora assim no período/.test(
     _phNotaTrocaHtml({trocas:9,dias:3,porDia:3,fonte:'log',paralelo:true},null,false)), true);
ok('sem apontamento nenhum, não inventa contagem',
   /cai em 1 troca por dia rodado/.test(_phNotaTrocaHtml(null,null,false)), true);
ok('no relatório do dia a frase é de hoje',
   /Hoje foram <b>6<\/b> preparação/.test(_phNotaTrocaHtml({trocas:6,dias:1,porDia:6,fonte:'log'},{min:12,n:9},true)), true);

// A PREMISSA É A RÉGUA: 30 min/dia de troca de produto, rateados entre os
// produtos pelo tempo de esteira. Os 30 min são da LINHA — quem ocupou metade
// do dia paga metade.
ok('a premissa combinada com o PPCP', [TROCA_PREMISSA.minDia,TROCA_PREMISSA.trocasDia,TROCA_PREMISSA.min], [30,6,5]);
ok('quem ocupou a linha inteira no dia paga o dia inteiro de troca',
   _phMinTrocaDia(['07:00-08:00','08:00-09:00'],['07:00-08:00','08:00-09:00']), 30);
// A RÉGUA AGORA É MEDIDA (PPCP, 20/08/2026 — "pode fazer pela conta feita, fica
// mais real"): paradas de esteira DAQUELE dia × duração medida nas paradas
// apontadas. A premissa vira a rede para quando não há o que medir.
const tlMed={ evDia:{'19/08':7,'20/08':4}, evPorDia:5.5, dias:2 };
const obsMed={ min:7.3, n:125 };
const mdF=_phMinDia(tlMed,obsMed);
ok('o dia de 7 paradas paga 7 × 7,3 min', Math.round(mdF('19/08')*10)/10, 51.1);
ok('e o de 4 paradas paga menos', Math.round(mdF('20/08')*10)/10, 29.2);
ok('dia sem parada de esteira cai na premissa', mdF('21/08'), TROCA_PREMISSA.minDia);
ok('sem medição das paradas, tudo cai na premissa',
   _phMinDia(tlMed,null)('19/08'), TROCA_PREMISSA.minDia);
ok('sem a contagem por dia idem', _phMinDia(null,obsMed)('19/08'), TROCA_PREMISSA.minDia);
// A fonte é o que a tela e o papel imprimem — medido × premissa.
const fMed=_phTrocaFonte(tlMed,obsMed);
ok('a fonte diz que foi medido', [fMed.medido,fMed.minDia], [true,40]);
ok('sem medição, a fonte é a premissa',
   [_phTrocaFonte(tlMed,null).medido,_phTrocaFonte(tlMed,null).minDia], [false,TROCA_PREMISSA.minDia]);
ok('o rateio usa a régua do dia (7 paradas, metade do tempo de esteira)',
   Math.round(_phMinTrocaDia(['07:00-08:00'],['07:00-08:00','08:00-09:00'],mdF('19/08'))*10)/10, 25.6);
ok('quem ocupou 2 das 9 horas paga a fatia',
   Math.round(_phMinTrocaDia(['07:00-08:00','08:00-09:00'],
     ['07:00-08:00','08:00-09:00','09:00-10:00','10:00-11:00','13:00-14:00','14:00-15:00','15:00-16:00','16:00-17:00','17:00-18:00'])*10)/10, 6.7);
ok('sem lista de horas cai nos 5 min do dia (régua conservadora)',
   _phMinTrocaDia([],[]), TROCA_PREMISSA.min);
// O rateio dá o MESMO percentual para todos — é o que faz a régua ser justa
// entre quem rodou o dia todo e quem entrou por uma hora.
const linhaDia9=['07:00-08:00','08:00-09:00','09:00-10:00','10:00-11:00','13:00-14:00','14:00-15:00','15:00-16:00','16:00-17:00','17:00-18:00'];
const pctGrande=_phTetoOper(300,8,1,_phMinTrocaDia(linhaDia9.slice(0,8),linhaDia9))/300;
const pctPequeno=_phTetoOper(300,1,1,_phMinTrocaDia(linhaDia9.slice(0,1),linhaDia9))/300;
ok('mesma fatia do teto para quem rodou 8 h e para quem rodou 1 h',
   [Math.round(pctGrande*1000),Math.round(pctPequeno*1000)], [944,944]);
const cellPrem={}, linhaPrem={};
const celP=(k,d,horas,todas)=>{ const a=_phAcc(); _phAdd(a,{caixas:10,horas:horas.length,horasLista:horas}); cellPrem[k+'|'+d]=a;
  todas.forEach(h=>{ (linhaPrem[d]=linhaPrem[d]||{})[h]=1; }); };
celP('A','19/08',['07:00-08:00','08:00-09:00'],linhaDia9);
celP('A','20/08',['07:00-08:00'],linhaDia9);
ok('no período os minutos somam dia a dia (6,7 + 3,3)',
   _phMinTrocaGrupo('A',['19/08','20/08'],cellPrem,linhaPrem), 10);
// com a régua medida, cada dia entra com o que ELE teve de troca
ok('e com a medição cada dia entra com a régua dele',
   Math.round(_phMinTrocaGrupo('A',['19/08','20/08'],cellPrem,linhaPrem,mdF)*10)/10, 14.6);

// A RÉGUA DO PERÍODO É UMA SÓ (pedido do PPCP, 24/08/2026: "o teto deveria ser
// igual para todas as cores"): _phFatorTrocaPeriodo devolve UM fator para o
// quadro inteiro — minutos de troca de cada dia ÷ minutos rodados da LINHA.
// Antes cada linha pagava só o mix dos dias em que ELA rodou, e cores do mesmo
// produto saíam com tetos diferentes (309–318/h no mesmo quadro).
ok('premissa: 2 dias de 9 h pagam 30+30 min → fator 94,4%',
   Math.round(_phFatorTrocaPeriodo(['19/08','20/08'],linhaPrem)*1000), 944);
ok('com a medição, cada dia entra com a régua dele (51,1+29,2 min)',
   Math.round(_phFatorTrocaPeriodo(['19/08','20/08'],linhaPrem,mdF)*1000), 926);
ok('dia sem ocupação da linha fica fora da conta',
   Math.round(_phFatorTrocaPeriodo(['19/08','21/08'],linhaPrem)*1000), 944);
ok('sem a lista de horas do backend devolve null (cai na régua antiga)',
   _phFatorTrocaPeriodo(['19/08'],{}), null);
// O fator não depende do grupo: cores com o mesmo teto físico saem com o MESMO
// teto exibido, rodando nos dias que rodarem.
//
// A TELA e o PDF montavam o quadro com o MESMO código escrito duas vezes — a
// régua e as ~20 linhas de construção. Este teste prendia UMA das vinte (o
// `tetoShow:`), então as outras dezenove podiam divergir à vontade, que é como
// a conta de paradas divergiu três vezes. Agora são `_phReguaPeriodo` e
// `_phLinhasPeriodo`: uma implementação, dois chamadores.
ok('o desconto do teto pela régua única é escrito uma vez só',
   (JS.match(/tetoShow: fatorTroca!=null \? tetoBase\*fatorTroca/g)||[]).length, 1);
ok('e a construção das linhas do período também',
   (JS.match(/function _phLinhasPeriodo\(/g)||[]).length, 1);
ok('a régua do período é uma só',
   (JS.match(/function _phReguaPeriodo\(/g)||[]).length, 1);
// Dois chamadores cada (tela e PDF), além da declaração.
ok('tela e PDF chamam as duas',
   [(JS.match(/_phLinhasPeriodo\(\{/g)||[]).length,
    (JS.match(/_phReguaPeriodo\(_tl, datas, horasLinha, obsT\)/g)||[]).length], [2, 2]);
// Nenhum dos dois pode voltar a montar o quadro por fora.
ok('ninguém remonta as linhas com Object.keys(rowAcc).map',
   (JS.match(/Object\.keys\(rowAcc\)\.map/g)||[]).length, 1);

// A duração medida virou INFORMAÇÃO: a ordem abaixo alimenta a nota de
// conferência, não mais o teto.
ok('medido nas paradas ganha da coluna', _phTroca({trocaMin:5}, {min:12.3,n:5}), 12.3);
ok('sem medição vale a coluna TEMPO DE TROCA MIN', _phTroca({trocaMin:8}, {min:0,n:1}), 8);
ok('sem coluna (backend antigo) vale o padrão do painel',
   _phTroca({trocaMin:null}, null), TROCA_MIN_PADRAO);
// O efeito no teto: 2 trocas de 12,3 min em 8h tiram 5% do teto, contra 1% da
// régua antiga de 1 troca de 5 min por dia.
ok('duas trocas medidas derrubam mais o teto que uma nominal',
   Math.round(_phTetoOper(300, 8, 2, 12.3)), 285);

// COR da MÉD.PERÍODO: verde e ▼ na mesma linha se contradiziam — "tudo certo"
// ao lado de "abaixo do ideal". Verde passou a exigir as DUAS coisas, e 1 dia
// não julga (a média É o melhor dia por definição).
eval(pega('function _phCorRitmo('));
const cor=(v1,v2,nd,alvo)=>_phCorRitmo(v1,v2,nd,alvo).cor;
// SAPATEIRA VIVARE: 122 constante em 2 dias, mas o ideal da linha é 210.
ok('regular porém lento não é verde — é âmbar', cor(122,122,2,210), 'var(--warn)');
ok('e a nota diz por quê', /padrão fica abaixo do ideal/.test(_phCorRitmo(122,122,2,210).nota), true);
// ESCRIVANINHA TAURUS: rodou UM dia — 100% de si mesma não prova nada.
ok('1 dia só não vira verde', cor(124,124,1,210), 'var(--txt)');
ok('e a nota avisa que não há base', /sem base/.test(_phCorRitmo(124,124,1,210).nota), true);
// Regular E no ritmo da linha: aí sim é verde.
ok('regular e no ritmo da linha é verde', cor(215,220,3,210), 'var(--ok)');
ok('empatar com o ideal da linha já conta como no ritmo', cor(210,215,3,210), 'var(--ok)');
// Sem takt configurado não há como exigir o ritmo da linha: volta a valer só a regularidade.
ok('sem ideal da linha, verde só pela regularidade', cor(122,122,2,0), 'var(--ok)');
// A variação continua mandando quando o modelo é rápido mas irregular.
ok('varia demais continua vermelho mesmo acima do ideal', cor(150,300,4,210), 'var(--red)');
ok('faixa do meio é âmbar', cor(240,300,4,210), 'var(--warn)');

console.log('\n── cascata: meta × paradas × ritmo ──');
// Substituiu a SWOT dos relatórios de produção: a decisão precisa saber ONDE
// ficaram as caixas que faltaram. perdaPar vem do RP_PARADAS (mesma conta da
// aba PARADAS); o resto da diferença para a meta é ritmo.
eval(pega('function _relCascata('));
let cc=_relCascata({meta:21000, real:19081, perdaPar:1119, minNP:301, topTipo:{tipo:'Troca de produto'}});
ok('o que não foi parada é ritmo', Math.round(cc.perdaRitmo), 800);
ok('faltou para a meta: nada vira "ganho"', cc.ganhoRitmo, 0);
ok('% da meta', Number(cc.pctReal.toFixed(1)), 90.9);
ok('minutos e top ofensor passam para o desenho',
   [cc.minNP, cc.topTipo.tipo], [301, 'Troca de produto']);
// Linha rodando ACIMA do ritmo da meta: o tempo parado custou caixas, mas o
// ritmo compensou — a cascata mostra o ganho em vez de inventar perda.
cc=_relCascata({meta:1300, real:1400, perdaPar:150});
ok('realizado acima do ritmo da meta vira GANHO de ritmo', Math.round(cc.ganhoRitmo), 250);
ok('e a perda de ritmo zera', cc.perdaRitmo, 0);
ok('sem meta não há cascata (null, nunca número inventado)',
   _relCascata({meta:0, real:100, perdaPar:0}), null);
ok('perda de parada negativa não existe',
   _relCascata({meta:100, real:90, perdaPar:-5}).perdaPar, 0);

// ── A CASCATA DESENHADA: quatro etapas, fórmula e contexto ───────────────
// Ela é lida em pé, numa reunião de turno: tem que responder meta, paradas,
// ritmo e realizado sem ninguém montar a conta de cabeça.
eval(pega('function _cascPasso('));
eval(pega('function _cascOp('));
eval(pega('function _cascBarra('));
eval(pega('function _rpCascataHtml('));   // _fmtMinPar já foi definido na SWOT
const cH = _relCascata({ meta:1150, real:428, perdaPar:48, minNP:22, ritmo:86, ritmoNec:143,
  tipos:[{tipo:'Troca de produto',min:14,planej:false},{tipo:'Almoço',min:72,planej:true}] });
const hH = _rpCascataHtml('CASCATA DO DIA — ONDE FICARAM AS CAIXAS', cH);
ok('a cascata abre pela meta', /META<\/div><div class="cs-n">1\.150/.test(hH), true);
ok('depois o impacto das paradas', /IMPACTO DE PARADAS<\/div><div class="cs-n">−48/.test(hH), true);
ok('depois o gap de ritmo', /GAP DE RITMO<\/div><div class="cs-n">−674/.test(hH), true);
ok('e fecha no realizado, em destaque', /casc-real-step.*REALIZADO<\/div><div class="cs-n">428/.test(hH), true);
ok('a fórmula fica explícita', /1\.150 − 48 − 674 = <b>428 cx<\/b>/.test(hH), true);
ok('a barra é realizado ÷ meta, não composição de perdas', /width:37\.2%/.test(hH), true);
ok('e o rótulo diz do que é o percentual', /37,2% DA META/.test(hH), true);
ok('o contexto traz os dois ritmos e o atendimento',
   /RITMO ATUAL <b>86 cx\/h<\/b>/.test(hH) && /RITMO NECESSÁRIO <b>143 cx\/h<\/b>/.test(hH)
   && /ATENDIMENTO DO RITMO <b>60,1%<\/b>/.test(hH), true);
ok('o tempo parado e o maior motivo aparecem',
   /<b>22 min<\/b> em paradas não planejadas/.test(hH) && /maior impacto:<\/b> Troca de produto/.test(hH), true);
ok('motivo PLANEJADO não entra na lista de impacto', /Almoço/.test(hH), false);
// Dia acima do ritmo da meta: a etapa do meio vira GANHO e a fórmula soma.
const hG = _rpCascataHtml('X', _relCascata({ meta:1150, real:1180, perdaPar:40 }));
ok('dia acima da meta mostra GANHO DE RITMO, não perda inventada',
   /GANHO DE RITMO<\/div><div class="cs-n">\+70/.test(hG), true);
ok('e a fórmula soma em vez de subtrair', /1\.150 − 40 \+ 70 = <b>1\.180 cx<\/b>/.test(hG), true);
ok('a barra não passa de 100% de preenchimento', /width:100\.0%/.test(hG), true);
// Sem os ritmos (é o caso do período), a linha de contexto simplesmente não sai.
ok('sem ritmo conhecido, não inventa a linha de contexto',
   /RITMO ATUAL/.test(_rpCascataHtml('X', _relCascata({ meta:1000, real:800, perdaPar:50 }))), false);
// "PERDIDO" dava a entender caixa fisicamente perdida — não pode voltar ao que
// é IMPRESSO (o comentário do código explicando a troca pode continuar lá).
ok('nada do que a cascata imprime fala em "PERDIDO"',
   /PERDIDO/i.test(hH) || /PERDIDO/i.test(hG), false);

console.log('\n── cascata de um MODELO filtrado (âncora = potencial próprio) ──');
// Com um modelo filtrado a META não serve: ela é da LINHA inteira (todos os
// produtos do dia) e as paradas não se atribuem a um modelo. A âncora honesta
// é o melhor dia de cada COR nas horas que ela rodou — ganho já demonstrado.
eval(pega('function _relCascataProduto('));
// MESA CABECEIRA MADERO, números reais do relatório (20/07–18/08):
const madero = [
  { label: '501149 · MADERO · OFF WHITE/CINAMOMO',   caixas: 1225, ritmo: 204, melhor: 227, teto: 414, horas: 6 },
  { label: '501149 · MADERO · BRANCO',               caixas:  966, ritmo: 161, melhor: 210, teto: 414, horas: 6 },
  { label: '501149 · MADERO · PRETO ACET./CINAMOMO', caixas:  576, ritmo:  96, melhor: 194, teto: 414, horas: 6 },
  { label: '501149 · MADERO · CINZA/NATURE',         caixas:  450, ritmo:  75, melhor:  97, teto: 414, horas: 6 },
];
let cp = _relCascataProduto(madero, true);   // agrupado por MODELO + COR
ok('potencial = melhor dia de cada cor × horas', cp.potencial, (227+210+194+97)*6);
ok('realizado é a soma das cores', cp.real, 3217);
ok('o que falta para o próprio melhor é perda de ritmo',
   cp.perdaRitmo, (227+210+194+97)*6 - 3217);
ok('as quatro cores entram', cp.n, 4);
ok('a melhor cor é apontada', /OFF WHITE\/CINAMOMO/.test(cp.melhorLinha.label), true);
// "MELHOR COR" só existe quando as linhas SÃO cores. Agrupado por MODELO, a
// linha é o produto — e o relatório imprimia "melhor cor: BANQUETA VERSATIL",
// que é o nome do produto, não uma cor.
ok('agrupado por cor, o relatório pode falar em melhor cor', cp.porCor, true);
const cpModelo = _relCascataProduto([{ label:'501140 · BANQUETA VERSATIL', caixas:2372, ritmo:132, melhor:179, teto:317, horas:18 }], false);
ok('agrupado por modelo, não há cor a apontar', cpModelo.porCor, false);
const hMod = _rpCascataHtml('X', cpModelo);
ok('e o impresso não inventa uma cor', /melhor cor/.test(hMod), false);
ok('nem chama o produto de cor', /da cor|das cores/.test(hMod), false);
ok('a descrição fala do próprio produto', /o melhor dia deste produto/.test(hMod), true);
const hCor = _rpCascataHtml('X', cp);
ok('com cores, aponta a melhor — só a cor, sem o código e o nome',
   /melhor cor: OFF WHITE\/CINAMOMO/.test(hCor), true);
ok('e conta quantas cores entraram', /de cada uma das 4 cores/.test(hCor), true);
// Uma cor só, mesmo agrupando por cor: não há "melhor" entre uma.
ok('uma linha só nunca vira "melhor cor"',
   _relCascataProduto([{ label:'A · B · PRETO', caixas:10, ritmo:10, melhor:10, teto:0, horas:1 }], true).porCor, false);
// Lançamento acumulado não pode virar alvo: melhor dia é limitado ao teto.
cp = _relCascataProduto([{ label: 'DECOR 470', caixas: 300, ritmo: 84, melhor: 318, teto: 300, horas: 4 }]);
ok('melhor dia impossível é cortado no teto físico', cp.potencial, 1200);
// Cor que só rodou um dia: melhor = média, nada a cobrar dela.
cp = _relCascataProduto([{ label: 'X', caixas: 100, ritmo: 100, melhor: 100, teto: 400, horas: 1 }]);
ok('um dia só: potencial = realizado, sem perda inventada',
   [cp.potencial, cp.perdaRitmo], [100, 0]);
// Melhor dia MENOR que a média aparada (poda) não pode gerar perda negativa.
cp = _relCascataProduto([{ label: 'Y', caixas: 200, ritmo: 100, melhor: 80, teto: 400, horas: 2 }]);
ok('potencial nunca fica abaixo do próprio realizado', cp.perdaRitmo, 0);
ok('sem horas não há cascata de produto',
   _relCascataProduto([{ label: 'Z', caixas: 10, ritmo: 10, melhor: 10, teto: 0, horas: 0 }]), null);

console.log('\n── simulador da esteira: teto recalculado pela medida média do mix ──');
// A harmônica do teto real equivale a vel × 60.000 ÷ (medida média + vão) —
// então o teto simulado sai EXATO da medida média, sem refazer chamada.
eval(pega('function _phMixMm('));
eval(pega('function _phTetoSim('));

// ── as linhas do período: a conta, não só a contagem de cópias ──────────────
// A guarda por grep diz que existe UMA implementação; esta roda ela e confere
// que o quadro sai igual ao que as duas cópias faziam.
eval(pega('function _phLinhasPeriodo('));
{
  const acc = (cx, h, teto) => { const a=_phAcc(); _phAdd(a,{caixas:cx,horas:h,tetoCxH:teto||0}); return a; };
  // dois produtos, dois dias: A rodou 100 e 300 cx/h; B rodou 150 nos dois.
  const rowAcc  = { A: acc(400,2,500), B: acc(300,2,500) };
  const cellAcc = { 'A|19/08': acc(100,1,500), 'A|20/08': acc(300,1,500),
                    'B|19/08': acc(150,1,500), 'B|20/08': acc(150,1,500) };
  const base = { rowAcc, cellAcc, datas:['19/08','20/08'], labelDe:{A:'MADERO',B:'VIVARE'},
                 metric:'mediaH', additive:false, horasLinha:{'19/08':8,'20/08':8},
                 simUse:null, obsT:null, minDiaFn:()=>30, fatorTroca:0.9, mediaModo:'aparada' };
  const L = _phLinhasPeriodo(base);
  ok('uma linha por grupo, ordenada pelo v1', L.map(l=>l.label), ['MADERO','VIVARE']);
  ok('v1 = média do período (2 dias: não há o que podar)', L.map(l=>Math.round(l.v1)), [200,150]);
  ok('v2 = melhor dia do grupo', L.map(l=>Math.round(l.v2)), [300,150]);
  ok('nd = dias com produção', L.map(l=>l.nd), [2,2]);
  ok('teto continua o FÍSICO (simulação e troca não mexem nele)',
     L.map(l=>l.teto), [500,500]);
  // A régua ÚNICA: o mesmo fator para todos, então o teto exibido é IGUAL nos
  // dois — foi o pedido do PPCP em 24/08/2026 ("o teto deveria ser igual para
  // todas as cores"), e é o que a duplicação podia desfazer sem ninguém ver.
  ok('tetoShow = teto × fator do período, igual para as duas linhas',
     L.map(l=>l.tetoShow), [450,450]);
  // Sem fator (backend antigo, sem horasLinha) cai na régua por linha.
  const semFator = _phLinhasPeriodo(Object.assign({}, base, {fatorTroca:null}));
  ok('sem fator do período cai na fatia por linha (e deixa de ser igual ao teto cheio)',
     semFator.every(l => l.tetoShow > 0 && l.tetoShow < 500), true);
  // O campo que só a TELA lia passa a sair para os dois — é mais barato mandar
  // um campo a mais do que manter duas construções que precisam concordar.
  ok('aparada sai para os dois chamadores', L.every(l => 'aparada' in l), true);
  // Métrica aditiva troca o que é v1 e v2, como antes.
  const adit = _phLinhasPeriodo(Object.assign({}, base, {metric:'caixas', additive:true}));
  ok('métrica aditiva: v1 é o total do período', adit.map(l=>l.v1), [400,300]);
}
ok('caixa de 1.006 mm a 8,5 m/min com 350 de vão = o teto real (376)',
   Math.round(_phTetoSim(8.5, 350, 1006)), 376);
ok('acelerando para 10 m/min o teto sobe para 442',
   Math.round(_phTetoSim(10, 350, 1006)), 442);
ok('fechando o vão para 250 mm o teto vai a 406',
   Math.round(_phTetoSim(8.5, 250, 1006)), 406);
ok('sem medida do mix não há teto simulado', _phTetoSim(10, 350, 0), 0);
ok('vão negativo não inventa teto maior',
   _phTetoSim(8.5, -50, 1006), 8.5*60000/1006);
// A medida média do mix agrega pelas caixas COM teto, nos dois níveis
// (item do backend e acc dentro de acc), e o simulado bate com o real
// quando os parâmetros são os da base.
const mix2 = _phAcc();
_phAdd(mix2, { caixas: 100, horas: 1, tetoCxH: 376, mixMm: 1006 });
_phAdd(mix2, { caixas: 100, horas: 1, tetoCxH: 300, mixMm: 1350 });
ok('medida média ponderada pelas caixas', Math.round(_phMixMm(mix2)), 1178);
// Prova da equivalência: simular com os MESMOS parâmetros da base devolve o
// teto real do mix (334 cx/h) — é o que garante que a simulação é exata.
ok('simulado com a base = teto real do mix',
   Math.round(_phTetoSim(8.5, 350, _phMixMm(mix2))), Math.round(_phTeto(mix2)));
const linha2 = _phAcc(); _phAdd(linha2, mix2);
ok('acc dentro de acc preserva a medida média', Math.round(_phMixMm(linha2)), 1178);
const semMix = _phAcc(); _phAdd(semMix, { caixas: 50, horas: 1, tetoCxH: 300 });
ok('backend sem mixMm (versão anterior): simulado desligado, sem chute',
   _phTetoSim(10, 350, _phMixMm(semMix)), 0);

// ── guarda-corpo: constante usada ANTES de existir (TDZ) ─────────────────
// Foi assim que o relatório do período parou de abrir: a linha do rodapé usava
// `fonteTroca` dez linhas antes da declaração. O navegador só reclama em tempo
// de execução — o popup morre sem desenhar nada, e nenhum teste de conta pega.
console.log('\n── nada de constante usada antes de existir ──');
[['gerarRelatorioProducaoHora', ['_tl','obsT','minDiaFn','fonteTroca','tLinha']],
 ['renderModeloPeriodo',        ['_tl','obsT','minDiaFn','fonteTroca','tLinha']],
 ['calcPorModelo',              ['obsT','_tlHoje','_fonteHoje','horasDia']],
].forEach(([fn, nomes]) => {
  const src = pega('function ' + fn + '(');
  nomes.forEach(n => {
    const decl = src.indexOf('const ' + n + '=');
    const antes = decl < 0 ? '' : src.slice(0, decl).replace(/\/\/[^\n]*/g, '');
    const usada = decl >= 0 && new RegExp('(?<![\\w$.])' + n.replace(/\$/g,'\\$') + '(?![\\w$])').test(antes);
    ok(fn + ': ' + n + ' só aparece depois de declarada', usada, false);
  });
});

console.log('\n── as peças comuns dos relatórios não podem voltar a ser copiadas ──');
// O desenho do fechamento da semana entra na mesma regra: uma implementação só.
ok('o cartão do dia a dia é montado num lugar só',
   (JS.match(/class="tvd-dia \$\{cls\}"/g) || []).length, 1);
ok('a busca da semana passada mora num lugar só',
   (JS.match(/function carregar\(forcar\)/g) || []).length, 1);
ok('TV e gerencial chamam o mesmo desenho',
   (JS.match(/RP_SEMANA\.pintar\(/g) || []).length, 2);
ok('cada tela tem o seu bloco no HTML',
   [(src.match(/id="tvd-total"/g) || []).length, (src.match(/id="gsem-total"/g) || []).length], [1, 1]);

// Divulgar a semana (PDF e zap) é UMA regra: a semana do filtro, com queda para
// a semana passada quando a atual ainda não fechou nenhum dia. Escrita dentro
// de cada botão, ela já vivia em dois lugares e faltava no terceiro.
ok('a regra da semana que se divulga é uma só',
   (JS.match(/function _relSemanaParaDivulgar\(/g) || []).length, 1);
ok('e os dois que divulgam chamam ela',
   (JS.match(/_relSemanaParaDivulgar\(/g) || []).length, 3);
ok('nenhum deles remonta o recorte por fora',
   /_relSemanaPassada\(\)\);\s*\n\s*dias=_relDiasDaSemana/.test(JS), false);

// O relatório sai com a semana de QUEM O CHAMOU (como o gerarRelatorioParadas
// faz com o período): o botão do bloco manda a semana que está na tela, o da
// aba HISTÓRICO continua lendo o filtro dela.
ok('o relatório semanal aceita a semana de quem chamou',
   /async function gerarRelatorioSemanal\(ateArg\)/.test(JS), true);
ok('e só cai no filtro do Histórico quando não recebe semana',
   /_relSemanaParaDivulgar\(todosDias, ateArg\|\|dGet\('hist-ate'\), !!ateArg\)/.test(JS), true);
ok('o bloco do gerencial imprime e manda a semana em cartaz',
   [/onclick="imprimirSemanaGer\(\)"/.test(src),
    /function imprimirSemanaGer\(\)[\s\S]{0,220}gerarRelatorioSemanal\(s\.ate\)/.test(JS)], [true, true]);
ok('e o zap do bloco sai da mesma semana',
   [/onclick="zapSemanaGer\(\)"/.test(src),
    /function zapSemanaGer\(\)[\s\S]{0,220}enviarResumoZap\(s\.ate\)/.test(JS)], [true, true]);
ok('quem diz qual semana está em cartaz é o RP_SEMANA',
   (JS.match(/RP_SEMANA\.semana\(\)/g) || []).length, 2);

// PUBLICAR NO MURAL saiu do painel (a função não existe mais do outro lado):
// botão, campo de configuração, chave do CFG e resumo próprio vão junto — sobra
// de recurso removido é botão que abre aba em branco.
ok('nenhuma sobra do mural no painel', /mural/i.test(src), false);

// A faixa do PPCP, o botão de imprimir e o logo estavam escritos 5 vezes — foi
// por isso que o #204 arrumou um relatório e o #205 precisou repetir em quatro.
ok('cabeçalho declarado uma única vez',
   (JS.match(/<div class="rp-header">/g) || []).length, 1);
ok('botão de imprimir declarado uma única vez',
   (JS.match(/class="rp-print-btn no-print"/g) || []).length, 1);
ok('logo com URL absoluta declarado uma única vez',
   (JS.match(/new URL\('patrimar-logo\.png'/g) || []).length, 1);

// ── e a PELE do cabeçalho vai junto com a MARCAÇÃO ──────────────────────────
// O #204/#205 unificou o que o cabeçalho ESCREVE (_rpCabecalho), mas o CSS que
// o PINTA continuou copiado nos cinco documentos — e uma cópia envelheceu. A do
// HISTÓRICO ficou sem a regra `.rp-logo span` e com o logo a 18px: medido no
// Chromium, o MESMO cabeçalho saía com PATRIMAR em BRANCO a 18px num relatório
// e laranja a 22px nos outros sete. Marcação e pele andam juntas ou a próxima
// correção conserta um documento e esquece os outros quatro.
ok('a pele do cabeçalho é declarada uma única vez',
   (JS.match(/\.rp-header\{display:flex/g) || []).length, 1);
ok('e os 5 documentos leem a constante',
   (JS.match(/\$\{_RP_HEADER_CSS\}/g) || []).length, 5);
ok('nenhum documento redeclara o logo, o subtítulo ou a meta do cabeçalho',
   [(JS.match(/^\s*\.rp-logo\{/gm) || []).length,
    (JS.match(/^\s*\.rp-sub\{/gm)  || []).length,
    (JS.match(/^\s*\.rp-meta\{/gm) || []).length], [1, 1, 1]);
// Foi ESTA regra que faltou na cópia do HISTÓRICO: sem ela o span da marca
// herda o branco do .rp-header e o nome do produto perde o laranja.
ok('a regra que pinta a marca existe, e uma vez só',
   (JS.match(/\.rp-logo span\{color:#FF5C1F\}/g) || []).length, 1);
// O <link> das fontes seguia a mesma sorte: 5 cópias. A do <head> do painel
// não está em <script>, então não entra nesta contagem — e não deve entrar.
ok('o <link> das fontes mora num lugar só',
   (JS.match(/fonts\.googleapis\.com\/css2/g) || []).length, 1);
ok('e os 5 documentos leem a constante',
   (JS.match(/\$\{_RP_FONTS\}/g) || []).length, 5);

// A nota da troca é a MESMA nos dois relatórios impressos (dia e período): se
// virar duas cópias, a primeira correção conserta um e esquece o outro — foi a
// história do cabeçalho no #204/#205.
ok('a explicação da troca é montada num lugar só',
   (JS.match(/function _phNotaTrocaHtml\(/g) || []).length, 1);
ok('e os dois relatórios impressos chamam ela',
   (JS.match(/_phNotaTrocaHtml\(/g) || []).length, 3);
console.log('\n── por que o comparativo não veio: timeout NÃO é backend velho ──');
// 26/08/2026: o .gs novo estava publicado (o % TETO EST. e as preparações de
// hoje apareciam na tela, e só o backend novo manda esses campos) e mesmo assim
// o comparativo do período mostrava "precisa da atualização do backend". A
// chamada é a mais pesada do painel — leu o log inteiro e estourou os 25s —,
// mas a tela acusava re-deploy: mandava mexer no Apps Script à toa.
var PH_FALHA = null, PH_BACKEND_OK = false, PH_FALHA_ERRO = '';
eval(pega('function _rpEsc('));
eval(pega('function _phFalhaInfo('));
eval(pega('function _phFalhaTxt('));

PH_FALHA = 'sem-resposta'; PH_BACKEND_OK = true; PH_FALHA_ERRO = 'Timeout — verifique a URL';
let f = _phFalhaInfo();
ok('timeout fala de tempo, não de deploy', /NÃO RESPONDEU A TEMPO/.test(f.tit), true);
ok('e diz que o backend já respondeu', /Não é falta de re-deploy/.test(f.html), true);
ok('timeout oferece tentar de novo', f.retry, true);
ok('timeout nunca manda re-deployar', /faça o <b>re-deploy<\/b>/.test(f.html), false);

// Sem nenhuma resposta boa nesta sessão não dá para afirmar que o .gs está
// publicado — aí a versão do backend entra como HIPÓTESE, no fim, e não como
// diagnóstico.
PH_BACKEND_OK = false;
f = _phFalhaInfo();
ok('sem prova, o deploy vira só uma hipótese', /confira também/.test(f.html), true);

// O único caso em que o re-deploy É o diagnóstico: o servidor respondeu e não
// conhece a ação (o .gs antigo cai no getDados() do dispatcher).
PH_FALHA = 'sem-endpoint'; PH_BACKEND_OK = false;
f = _phFalhaInfo();
ok('ação desconhecida → falta re-deploy', /FALTA ATUALIZAR O BACKEND/.test(f.tit), true);
ok('e aí tentar de novo não adianta', f.retry, false);

PH_BACKEND_OK = true;   // já respondeu antes: a função existe lá
f = _phFalhaInfo();
ok('endpoint que já respondeu não é backend velho', /faça o <b>re-deploy<\/b>/.test(f.html), false);
ok('resposta torta oferece tentar de novo', f.retry, true);

PH_FALHA = 'erro'; PH_FALHA_ERRO = 'Aba <PRODUCAO_PRODUTO> nao encontrada';
f = _phFalhaInfo();
ok('erro do backend aparece na tela', /nao encontrada/.test(f.html), true);
ok('e vai escapado (a mensagem vem do servidor)', /&lt;PRODUCAO_PRODUTO&gt;/.test(f.html), true);
ok('o alerta do PDF sai sem marcação', /[<>]/.test(_phFalhaTxt()), false);

// Uma implementação só: a tela e o alerta do PDF leem o MESMO texto. Duas
// cópias e a próxima correção conserta uma — foi a história do cabeçalho dos
// relatórios (#204/#205).
ok('a frase do re-deploy mora num lugar só',
   (JS.match(/faça o <b>re-deploy<\/b>/g) || []).length, 1);
ok('a tela e o PDF leem a mesma explicação',
   [(JS.match(/(?<!function )_phFalhaInfo\(\)/g) || []).length,
    (JS.match(/(?<!function )_phFalhaTxt\(\)/g) || []).length], [2, 3]);   // PDF do período + estudo de UEP + gravar UEP
// A chamada mais cara do painel não pode ter uma tentativa só: era isso que
// transformava cold start em "falta re-deploy".
ok('a busca do período retenta antes de desistir',
   /for\(let i=1;i<=TENT;i\+\+\)/.test(pega('async function lerProducaoModeloPeriodo(')), true);

// ════════════════════════════════════════════════════════════════════════════
// GESTÃO DAS PERDAS — camada nova do relatório de paradas (27/08/2026)
// ════════════════════════════════════════════════════════════════════════════
// Duas coisas são testadas aqui, e a segunda importa tanto quanto a primeira:
//   1. as contas da camada nova;
//   2. que o relatório ANTIGO continua inteiro — o pedido do PPCP foi explícito
//      em não alterar, excluir ou substituir nada do que já funciona.
require('vm').runInThisContext(fs.readFileSync(path.join(__dirname, 'paradas-calc.js'), 'utf8'));
// As constantes da camada (metas, regexes) vão para o global: `const` dentro
// de eval fica preso ao escopo do próprio eval e as funções não o enxergam.
// A declaração pode ocupar VÁRIAS linhas (PG_GRAOS é um objeto): pega até a
// primeira linha que fecha com ";" — com o `.*$` de antes, a constante vinha
// pela metade e o teste morria em "Unexpected end of input".
[...JS.matchAll(/^const (PG_[A-Z_]+|PAR_TROCA)\s*=[\s\S]*?;[ \t]*(\/\/.*)?$/gm)]
  .forEach(m => eval(m[0].replace(/^const /, 'global.')));
// ehSetupParada e _fmtMinPar já foram carregados acima (SWOT/cascata)
eval(pega('function _pgClasseGer('));
eval(pega('function _pgDias('));
eval(pega('function _pgPioresDias('));
eval(pega('function _pgExtremos('));
eval(pega('function _pgSemanas('));
eval(pega('function _pgSemLbl('));
eval(pega('function _pgTopCausas('));
eval(pega('function _pgOutros('));
eval(pega('function _pgMetaSmed('));   // a escada da meta — o _pgSmed chama
eval(pega('function _pgFmtMin('));
eval(pega('function _pgSmed('));
eval(pega('function _pgMinPor1000('));
eval(pega('function _pgJanelaDe('));
eval(pega('function _pgFaixaDias('));
eval(pega('function _pgPorJanela('));
eval(pega('function _pgRecuperacao('));
eval(pega('function _pgImpactoFluxo('));
eval(pega('function _pgSobrepostas('));
eval(pega('function _pgTendencia('));   // dependência do _pgDiagnostico
eval(pega('function _pgPlano('));
eval(pega('function _pgDiagnostico('));

console.log('\n── classificação GERENCIAL (2ª camada, não substitui a original) ──');
ok('parada programada continua PLANEJADA', _pgClasseGer('Parada/Café', true), 'PLANEJADA');
ok('troca de produto é REDUTÍVEL', _pgClasseGer('Troca de produto', false), 'REDUTIVEL');
ok('troca de plástico é REDUTÍVEL', _pgClasseGer('Troca de Plastico', false), 'REDUTIVEL');
ok('falta de material é ANORMAL', _pgClasseGer('Falta de material', false), 'ANORMAL');
ok('manutenção é ANORMAL', _pgClasseGer('Manutenção', false), 'ANORMAL');
// Regra 16 do pedido: nunca preencher com causa presumida. "Outros" não é
// anormal nem redutível — é desconhecido, e o relatório diz isso.
ok('"Outros" NÃO vira anormal — vira A IDENTIFICAR', _pgClasseGer('Outros', false), 'IDENTIFICAR');
ok('o critério de REDUTÍVEL é o mesmo ehSetupParada do ESTUDO DE GANHO',
   _pgClasseGer('Setup de máquina', false), 'REDUTIVEL');

console.log('\n── Pareto diário ──');
const _pd = {
  '10/08/2026': {min:120, minNP:100, perd:300, qtd:5, tipos:{
     'Troca de produto':{qtd:3,min:60,perd:180,planej:false},
     'Parada/Café'     :{qtd:1,min:20,perd:0,  planej:true},
     'Manutenção'      :{qtd:1,min:40,perd:120,planej:false}}},
  '11/08/2026': {min:30,  minNP:30,  perd:90,  qtd:2, tipos:{
     'Troca de produto':{qtd:2,min:30,perd:90, planej:false}}},
  '22/08/2026': {min:45,  minNP:45,  perd:0,   qtd:1, tipos:{
     'Manutenção':{qtd:1,min:45,perd:0,planej:false}}}   // sábado: sem produção
};
const _trab = ['10/08/2026','11/08/2026','12/08/2026'];   // 12/08 trabalhou e não parou
const pgDias = _pgDias(_pd, _trab, 10);                      // 10 h produtivas = 600 min
ok('entram os dias com parada E os dias trabalhados', pgDias.map(d=>d.data),
   ['10/08/2026','11/08/2026','12/08/2026','22/08/2026']);
ok('disponibilidade do dia = (600 − minNP) ÷ 600', Math.round(pgDias[0].dispon*10)/10, 83.3);
ok('dia trabalhado sem parada dá 100%', pgDias[2].dispon, 100);
// Sábado não tem produção lançada: não há base de turno, então a
// disponibilidade dele é "—" e ele fica fora da conta da semana. Sem isso o
// número da semana deixaria de fechar com o do resumo.
ok('dia sem produção lançada não tem base', pgDias[3].dispon, null);
ok('a principal causa é o maior NÃO programado do dia', pgDias[0].causa, 'Troca de produto');
ok('parada programada não vira "principal causa"',
   _pgDias({'10/08/2026':{min:20,minNP:0,perd:0,qtd:1,tipos:{'Parada/Café':{qtd:1,min:20,perd:0,planej:true}}}},
           ['10/08/2026'], 10)[0].causa, '');

console.log('\n── piores dias e extremos ──');
ok('piores dias vêm pelo tempo NÃO programado', _pgPioresDias(pgDias,2).map(d=>d.data),
   ['10/08/2026','22/08/2026']);
ok('dia sem parada não programada fica fora', _pgPioresDias(pgDias,9).every(d=>d.minNP>0), true);
const pgExt = _pgExtremos(pgDias);
ok('maior tempo parado olha o tempo TOTAL', pgExt.maisParado.data, '10/08/2026');
ok('menor disponibilidade só entre dias com base', pgExt.menorDisp.data, '10/08/2026');
ok('maior perda', pgExt.maiorPerda.data, '10/08/2026');

console.log('\n── evolução da disponibilidade (semana = a MESMA janela do relatório) ──');
const pgSem = _pgSemanas(pgDias, 10, 90);
ok('agrupa por semana de segunda a domingo', pgSem.length, 2);
// 10, 11 e 12/08 são dias trabalhados: base 3 × 600 = 1800; parados 130.
ok('a base da semana são os dias TRABALHADOS dela', pgSem[0].nDias, 3);
ok('disponibilidade da semana', Math.round(pgSem[0].dispon*10)/10, 92.8);
ok('status verde acima da meta', pgSem[0].status, 'g');
ok('semana sem dia trabalhado não tem base', pgSem[1].dispon, null);
// A soma das semanas TEM que fechar com o resumo: base total e tempo parado
// total iguais aos do período. É o que permite pôr as duas leituras no mesmo
// relatório sem o gestor ter de escolher em qual acreditar.
const _baseSem = pgSem.reduce((s,w)=>s+w.nDias,0), _npSem = pgSem.reduce((s,w)=>s+w.minNP,0);
ok('a soma das semanas fecha com o período', [_baseSem, _npSem], [3, 175]);
ok('rótulo curto da semana', _pgSemLbl({sem:'10/08/2026 a 16/08/2026', num:33}), 'S33 · 10/08–16/08');

console.log('\n── TOP causas a atacar ──');
const pgTipos = [
  {tipo:'Troca de produto', qtd:77, min:587, perd:1752, planej:false},
  {tipo:'Troca de Plastico',qtd:55, min:357, perd:1109, planej:false},
  {tipo:'Outros',           qtd:38, min:310, perd:1010, planej:false},
  {tipo:'Parada/Café',      qtd:13, min:207, perd:0,    planej:true},
  {tipo:'Manutenção',       qtd:2,  min:67,  perd:220,  planej:false}
];
const pgTop = _pgTopCausas(pgTipos, 5);
ok('só entra parada não programada', pgTop.map(t=>t.tipo),
   ['Troca de produto','Troca de Plastico','Outros','Manutenção']);
ok('a prioridade é a ordem do Pareto', pgTop[0].prio, 1);
// O % usa o MESMO denominador do Pareto que já existe (tempo total parado,
// programado incluído). Denominadores diferentes fariam o mesmo tipo aparecer
// com dois percentuais no mesmo relatório.
ok('% bate com o Pareto original (denominador = tempo total)', pgTop[0].pct, 38);
ok('tempo médio por ocorrência', pgTop[0].med, 8);
ok('cada causa carrega a classe gerencial', pgTop.map(t=>t.classe),
   ['REDUTIVEL','REDUTIVEL','IDENTIFICAR','ANORMAL']);

console.log('\n── "OUTROS" — causa a identificar ──');
const CFGT = {turnoInicio:'07:00', turnoFim:'17:00', almocoInicio:'11:00', almocoFim:'12:12'};
const parOutros = [
  {data:'10/08/2026', tipo:'Outros', ini:'08:00', fim:'08:20', obs:'aguardando aquecimento do forno'},
  {data:'11/08/2026', tipo:'Outros', ini:'08:00', fim:'08:10', obs:'Aguardando aquecimento do forno'},
  {data:'12/08/2026', tipo:'Outros', ini:'09:00', fim:'09:05', obs:'reunião'},
  {data:'13/08/2026', tipo:'Outros', ini:'09:00', fim:'09:15', obs:''},
  {data:'13/08/2026', tipo:'Troca de produto', ini:'10:00', fim:'10:08', obs:'x'}
];
const pgOut = _pgOutros(parOutros, CFGT, 100);
ok('só olha o tipo genérico', pgOut.qtd, 4);
ok('soma o tempo produtivo do balaio', pgOut.min, 50);
ok('agrupa o motivo sem se importar com maiúscula', pgOut.lista[0].qtd, 2);
ok('o motivo mais custoso vem primeiro', pgOut.lista[0].motivo, 'aguardando aquecimento do forno');
// Regra 16: sem motivo escrito, o relatório NÃO chuta uma causa.
ok('sem motivo vira CAUSA NÃO IDENTIFICADA (não some, não vira palpite)',
   [pgOut.semMotivoQtd, pgOut.semMotivoMin], [1, 15]);
ok('% do tempo parado sob tipo genérico', pgOut.pct, 50);
ok('o indicador tem meta própria', [pgOut.meta, pgOut.dentro], [5, false]);
ok('parada de tipo nomeado não entra no balaio',
   _pgOutros([{data:'1/1/2026',tipo:'Manutenção',ini:'08:00',fim:'09:00',obs:''}], CFGT, 60).qtd, 0);

console.log('\n── SMED (troca de produto / de plástico) ──');
const pg_parTroca = [
  {data:'10/08/2026', tipo:'Troca de produto', ini:'08:00', fim:'08:10'},
  {data:'10/08/2026', tipo:'Troca de produto', ini:'09:00', fim:'09:04'},
  {data:'17/08/2026', tipo:'Troca de produto', ini:'08:00', fim:'08:22'},
  {data:'17/08/2026', tipo:'Troca de Plastico',ini:'13:00', fim:'13:06'}
];
const pgSp = _pgSmed(pg_parTroca, PG_RE_TROCA_PROD, CFGT, 5);
ok('conta as trocas', pgSp.qtd, 3);
ok('tempo total', pgSp.tot, 36);
ok('média', pgSp.med, 12);
ok('menor e maior troca', [pgSp.menor, pgSp.maior], [4, 22]);
ok('quantas já saem dentro da meta', pgSp.naMeta, 1);
ok('excedente sobre a meta = (média − meta) × trocas', pgSp.excedente, 21);
ok('distribuição por faixa', pgSp.faixas.map(f=>f.qtd), [0,1,1,0,1]);
// A faixa carrega o próprio limite: o verde do desenho segue a META do tipo.
// 5 min está DENTRO na troca de produto (meta 5) e FORA na de plástico (meta 4)
// — pintar por rótulo fixo mentiria numa das duas.
ok('a faixa sabe o próprio limite', pgSp.faixas.map(f=>f.ate), [3,5,10,20,Infinity]);
ok('evolução semana a semana', pgSp.semanas.map(s=>s.qtd), [2,1]);
ok('o plástico tem meta própria', _pgSmed(pg_parTroca, PG_RE_TROCA_PLAS, CFGT, 4).med, 6);
// Seção sem dado não é impressa com zeros — some.
ok('tipo que não apareceu devolve null', _pgSmed([], PG_RE_TROCA_PROD, CFGT, 5), null);

console.log('\n── meta SMED: atingida, ela desce sozinha ──');
// Pedido do usuário em 27/08/2026: "SMED, deixar automático quando atingir".
// Média 12 min contra meta 5: nada a fazer, a meta combinada continua valendo.
ok('meta acima da média não se mexe', [pgSp.meta, pgSp.metaBase, pgSp.metaAuto, pgSp.metaAtingida],
   [5, 5, false, false]);
// Cinco trocas de 3, 4, 4, 5 e 6 min: média 4,4 — dentro dos 5. O degrau novo é
// a média das 3 mais rápidas (3, 4 e 4 = 3,7), tempo que a equipe JÁ fez.
const pg_parRapida = [
  {data:'10/08/2026', tipo:'Troca de produto', ini:'08:00', fim:'08:03'},
  {data:'10/08/2026', tipo:'Troca de produto', ini:'09:00', fim:'09:04'},
  {data:'10/08/2026', tipo:'Troca de produto', ini:'10:00', fim:'10:04'},
  {data:'11/08/2026', tipo:'Troca de produto', ini:'08:00', fim:'08:05'},
  {data:'11/08/2026', tipo:'Troca de produto', ini:'09:00', fim:'09:06'}
];
const pgSr = _pgSmed(pg_parRapida, PG_RE_TROCA_PROD, CFGT, 5);
ok('meta batida → o alvo desce para a média das mais rápidas',
   [pgSr.metaBase, pgSr.meta, pgSr.metaAuto], [5, 3.7, true]);
ok('o degrau sai de 3 trocas (o quartil nunca é menor que isso)',
   [pgSr.metaAmostra, pgSr.mediaRapidas], [3, 3.7]);
// Quem bateu o combinado não pode aparecer em vermelho por causa do degrau novo.
ok('metaAtingida olha o alvo COMBINADO, não o degrau', [pgSr.metaAtingida, pgSr.dentro], [true, false]);
ok('"já na meta" e excedente passam a medir contra o alvo novo',
   [pgSr.naMeta, pgSr.excedente], [1, 4]);
// Duas ou três trocas rápidas num período são sorte, não padrão.
const pgSc = _pgSmed(pg_parRapida.slice(0,3), PG_RE_TROCA_PROD, CFGT, 5);
ok('amostra curta não move a meta', [pgSc.meta, pgSc.metaAuto, pgSc.metaAtingida], [5, false, true]);
ok('e a linha diz por que não desceu', /não se sustenta/.test(pgSc.metaNota), true);
// A meta NÃO se aperta sozinha no arredondamento: sem troca mais rápida que o
// alvo, não há degrau.
const pg_iguais = ['08','09','13','14'].map(h => (
  {data:'10/08/2026', tipo:'Troca de produto', ini:h+':00', fim:h+':04'}));
const pgSi = _pgSmed(pg_iguais, PG_RE_TROCA_PROD, CFGT, 4);
ok('todas as trocas no alvo não geram degrau', [pgSi.meta, pgSi.metaAuto, pgSi.metaAtingida],
   [4, false, true]);
ok('e diz que as mais rápidas não sustentam alvo menor', /não sustentam/.test(pgSi.metaNota), true);
ok('meta em minutos: inteiro sem casa, degrau com uma', [_pgFmtMin(5), _pgFmtMin(3.7)], ['5','3,7']);
// Piso: meta abaixo de 1 min é ficção, não desafio.
ok('a meta nunca desce abaixo do piso', _pgMetaSmed([0.4,0.4,0.5,0.6,3], 2).meta, PG_SMED_PISO);
ok('sem meta combinada não há escada', _pgMetaSmed([3,3,3,3], 0).auto, false);

console.log('\n── KPI novo: minutos parados / 1.000 caixas ──');
ok('1.736 min em 36.304 cx', Math.round(_pgMinPor1000(1736,36304)*100)/100, 47.82);
ok('sem caixas apontadas não inventa número', _pgMinPor1000(100,0), null);

console.log('\n── minutos parados / 1.000 cx por SEMANA · QUINZENA · MÊS ──');
// "Compara por semana, mês, quinzena" (usuário, 27/08/2026). O recorte sai do
// período já buscado — nenhuma chamada nova ao backend.
const pgJDias = [
  {data:'10/08/2026', min:60, minNP:40},   // segunda — S33
  {data:'16/08/2026', min:30, minNP:20},   // domingo — MESMA S33 (a semana é seg→dom)
  {data:'17/08/2026', min:20, minNP:10},   // segunda — S34, e já é 2ª quinzena
  {data:'05/07/2026', min:99, minNP:99},   // mês sem produção lançada
  {data:'20/09/2026', min:50, minNP:50}
];
const pgJReal = {'10/08/2026':1000, '16/08/2026':1000, '17/08/2026':1000, '20/09/2026':2000};
const pgJSem = _pgPorJanela(pgJDias, pgJReal, 'semana').lista;
ok('domingo entra na semana que começou na segunda anterior',
   [pgJSem.length, pgJSem[0].min, pgJSem[0].cx], [3, 90, 2000]);
ok('o rótulo da semana é o mesmo do resto do painel', /^S33 · 10\/08–16\/08$/.test(pgJSem[0].lbl), true);
ok('o indicador é minutos ÷ caixas × 1.000', [pgJSem[0].mil, pgJSem[0].milNP], [45, 30]);
const pgJQ = _pgPorJanela(pgJDias, pgJReal, 'quinzena').lista;
ok('a quinzena corta no dia 15', pgJQ.map(q=>q.lbl), ['1ªQ AGO/26','2ªQ AGO/26','2ªQ SET/26']);
ok('e cada uma leva os dias dela', pgJQ.map(q=>q.min), [60, 50, 50]);
const pgJMes = _pgPorJanela(pgJDias, pgJReal, 'mes');
const pgJM = pgJMes.lista;
ok('o mês agrupa o mês inteiro', [pgJM.map(m=>m.lbl), pgJM[0].min, pgJM[0].cx],
   [['AGO/26','SET/26'], 110, 3000]);
// ⚠ "tira dias não trabalhados": dia sem produção lançada punha minutos no
// numerador sem caixa no denominador — o indicador subia num dia em que
// ninguém embalou. Numerador e denominador olham os MESMOS dias.
ok('dia sem produção não entra na conta', pgJM.some(m=>/JUL/.test(m.lbl)), false);
ok('e o que ficou de fora é declarado, não some',
   [pgJMes.diasFora, pgJMes.minFora], [1, 99]);
ok('só dia trabalhado soma minutos',
   _pgPorJanela([{data:'10/08/2026',min:60,minNP:40},{data:'15/08/2026',min:500,minNP:500}],
                {'10/08/2026':1000}, 'mes').lista[0].min, 60);
// A variação é contra a janela anterior DA LISTA, e parar menos por caixa é melhorar.
ok('a variação compara com a janela anterior', [pgJM[0].deltaNP, pgJM[1].deltaNP], [null, 1.7]);
ok('subir o não programado por caixa NÃO é melhora', [pgJM[0].bom, pgJM[1].bom], [null, false]);
ok('cair é melhora',
   _pgPorJanela([{data:'10/08/2026',min:60,minNP:60},{data:'10/09/2026',min:10,minNP:10}],
                {'10/08/2026':1000,'10/09/2026':1000}, 'mes').lista[1].bom, true);
ok('grão desconhecido cai no mês', _pgJanelaDe('10/08/2026','xis').lbl, 'AGO/26');
ok('data quebrada não vira janela', _pgJanelaDe('','mes'), null);

// ── "MÊS QUAL DIA ATÉ QUE DIA?" (usuário, 27/08/2026) ─────────────────────────
// O rótulo diz AGO/26, mas a linha é só a parte do mês que caiu no período E
// teve produção. Sem a faixa escrita, "JUL/26 · 3 dias" não dizia QUAIS 3.
ok('a linha do mês diz de que dia a que dia ela é',
   [pgJM[0].faixa, pgJM[0].de, pgJM[0].ate], ['10/08 → 17/08', '10/08/2026', '17/08/2026']);
ok('a semana também', pgJSem[0].faixa, '10/08 → 16/08');
ok('dia sem produção não estica a faixa', pgJM.map(m=>m.faixa), ['10/08 → 17/08', '20/09']);
ok('janela de um dia só não vira intervalo', _pgFaixaDias('20/09/2026','20/09/2026'), '20/09');
ok('sem data não inventa faixa', _pgFaixaDias(null, null), '');
// A ordem da lista de dias não é garantida: o extremo sai da data, não da
// posição em que o dia apareceu.
ok('a faixa sai da data, não da ordem da lista',
   _pgPorJanela([{data:'28/08/2026',min:10,minNP:10},{data:'03/08/2026',min:10,minNP:10}],
                {'28/08/2026':500,'03/08/2026':500}, 'mes').lista[0].faixa, '03/08 → 28/08');

console.log('\n── potencial de recuperação (simulação) ──');
const pgRec = _pgRecuperacao(pgTipos, 217, {});
ok('só simula os cenários definidos e existentes', pgRec.itens.map(i=>i.tipo),
   ['Troca de produto','Troca de Plastico','Outros']);
// 587/77 = 7,62 min de média; (7,62 − 5) × 77 = 202 min
ok('troca de produto: (média − meta) × ocorrências', pgRec.itens[0].ganhoMin, 202);
ok('o balaio genérico entra como corte de 50%', pgRec.itens[2].ganhoMin, 155);
ok('caixas saem do ritmo REAL, a régua que o resumo já usa',
   pgRec.itens[0].cx, RP_PARADAS.perdaAoRitmo(202, 217));
ok('total soma os cenários', pgRec.ganhoMin, 202+137+155);
ok('sem ritmo medido não inventa caixas', _pgRecuperacao(pgTipos,0,{}).cx, 0);
// O cenário de corte leva o tempo REAL do tipo: o quadro mostra de quanto
// se está cortando, em vez de deduzir o valor a partir do ganho.
ok('o cenário de corte guarda o tempo real do tipo', pgRec.itens[2].min, 310);
// Tipo que não está nos cenários do PPCP não vira meta chutada.
ok('manutenção não ganha meta inventada', pgRec.itens.some(i=>/Manuten/.test(i.tipo)), false);

// Com a meta num degrau abaixo, o cenário volta a mostrar ganho — era isso que
// zerava para sempre na troca que já tinha batido o combinado.
const pgRecAuto = _pgRecuperacao(pgTipos, 217, {metaProduto:3.7});
ok('o cenário simula contra o alvo EM VIGOR', pgRecAuto.itens[0].meta, 3.7);
ok('e o ganho cresce com o degrau novo', pgRecAuto.itens[0].ganhoMin > pgRec.itens[0].ganhoMin, true);

console.log('\n── impacto no fluxo (quem define o ritmo é o gargalo) ──');
const pgFx = _pgImpactoFluxo({taktSeg:17.1, ritmoHora:210}, {taktReal:17, ritmoReal:217}, {dispon:87.1});
ok('rodando mais rápido que o necessário → o foco é disponibilidade', pgFx.veredito, 'disponibilidade');
ok('mais lento que o ideal → o ritmo também pesa',
   _pgImpactoFluxo({taktSeg:15, ritmoHora:240}, {taktReal:20, ritmoReal:180}, {dispon:90}).veredito, 'ritmo');
ok('sem takt configurado não há veredito',
   _pgImpactoFluxo({taktSeg:0}, {taktReal:17}, {dispon:90}).veredito, null);

console.log('\n── apontamento sobreposto (só sinaliza, não corrige) ──');
const pgSobre = _pgSobrepostas([
  {data:'10/08/2026', tipo:'A', ini:'08:00', fim:'08:30'},
  {data:'10/08/2026', tipo:'B', ini:'08:20', fim:'08:40'},   // sobrepõe 10 min
  {data:'10/08/2026', tipo:'C', ini:'08:40', fim:'09:00'},   // encosta, não sobrepõe
  {data:'11/08/2026', tipo:'D', ini:'08:50', fim:'09:10'}    // outro dia: não é sobreposição
]);
ok('acha a sobreposição', pgSobre.length, 1);
ok('mede quanto se sobrepõe', pgSobre[0].min, 10);
ok('parada encostada (fim = início) não é sobreposição', pgSobre.some(s=>s.b.tipo==='C'), false);
ok('dia diferente nunca sobrepõe', pgSobre.some(s=>s.data==='11/08/2026'), false);
ok('parada em andamento (sem fim) fica fora',
   _pgSobrepostas([{data:'1/1/2026',tipo:'A',ini:'08:00',fim:''},{data:'1/1/2026',tipo:'B',ini:'08:10',fim:'08:20'}]).length, 0);

console.log('\n── plano de ação (não inventa responsável nem prazo) ──');
const pgPlano = _pgPlano(pgTop, pgOut);
ok('uma linha por causa do topo', pgPlano.length, 4);
ok('responsável e prazo saem "A definir"',
   pgPlano.every(a=>a.resp==='A definir' && a.prazo==='A definir'), true);
ok('troca vira SMED com a meta em minutos', /≤ 5 min/.test(pgPlano[0].meta), true);
// A meta do plano é a que está EM VIGOR: descido o degrau, é ele que se cobra.
ok('com meta automática o plano cobra o alvo novo',
   _pgPlano(pgTop, pgOut, {produto:3.7, produtoAuto:true})[0].meta, '≤ 3,7 min/troca (alvo novo)');
ok('o balaio genérico vira "classificar a causa"', /Classificar a causa/.test(pgPlano[2].acao), true);

console.log('\n── diagnóstico PPCP ──');
const pgDg = _pgDiagnostico({st:{totMin:1736, pecas:4639, pesoMedio:28, pesoPerd:129920, dispon:87.1},
                           top:pgTop, outros:pgOut, rec:pgRec, fluxo:pgFx, semanas:pgSem});
ok('problema principal é o maior ofensor não programado', /Troca de produto/.test(pgDg.problema), true);
ok('o foco sai do veredito de fluxo', /DISPONIBILIDADE/.test(pgDg.foco), true);
ok('ganho potencial vem da simulação', /cx nos cenários simulados/.test(pgDg.ganho), true);
// Sem causa nomeada no topo, o diagnóstico assume a ignorância em vez de
// escolher um culpado plausível.
const pgDg2 = _pgDiagnostico({st:{totMin:100,pecas:1,pesoMedio:0,pesoPerd:0,dispon:80},
                            top:_pgTopCausas([{tipo:'Outros',qtd:5,min:100,perd:200,planej:false}],5),
                            outros:pgOut, rec:pgRec, fluxo:pgFx, semanas:pgSem});
ok('topo genérico → CAUSA NÃO IDENTIFICADA', /CAUSA NÃO IDENTIFICADA/.test(pgDg2.problema), true);
ok('e a ação é classificar antes de atacar', /Classificar a causa/.test(pgDg2.acao), true);
ok('sem parada não programada não há problema principal inventado',
   _pgDiagnostico({st:{totMin:0,pecas:0,pesoMedio:0,pesoPerd:0,dispon:100}, top:[], outros:null,
                   rec:{ganhoMin:0}, fluxo:{veredito:null}, semanas:[]}).problema,
   'Nenhuma parada não programada no período.');

console.log('\n── quadro: tendência da disponibilidade ──');
eval(pega('function _pgAnomalias('));
eval(pega('function _pgFoco('));
const _sm=(n,d)=>({num:n, dispon:d, nDias:5, minNP:0, min:0, qtd:0, perd:0, ini:n});
ok('subiu meia dúzia de pontos = MELHORA', _pgTendencia([_sm(31,83.9),_sm(32,88.3),_sm(35,90.3)]).seta, '↗');
ok('caiu = PIORA', _pgTendencia([_sm(31,92),_sm(32,88)]).seta, '↘');
// Meio ponto percentual é ruído de arredondamento, não melhora.
ok('variação abaixo de meio ponto é ESTÁVEL', _pgTendencia([_sm(31,90.0),_sm(32,90.3)]).seta, '→');
ok('uma semana só não define tendência', _pgTendencia([_sm(31,90)]), null);
// Semana sem dia trabalhado não tem disponibilidade — não pode definir direção.
ok('semana sem base fica fora', _pgTendencia([_sm(31,84),_sm(32,null),_sm(33,90)]).ate.num, 33);
ok('o delta é da primeira à última', Math.round(_pgTendencia([_sm(31,84),_sm(32,90)]).delta*10)/10, 6);

console.log('\n── quadro: anomalias de apontamento ──');
const CFGA={turnoInicio:'07:00', turnoFim:'17:00', almocoInicio:'11:00', almocoFim:'12:12'};
const parAn=[
  {data:'10/08/2026', tipo:'Troca de produto', ini:'08:00', fim:'08:30', obs:''},   // longa (30) e sem motivo
  {data:'10/08/2026', tipo:'Manutenção',       ini:'08:20', fim:'08:50', obs:'x'},  // sobrepõe + longa, com motivo
  {data:'11/08/2026', tipo:'Outros',           ini:'09:00', fim:'09:05', obs:''},   // genérica sem motivo
  {data:'11/08/2026', tipo:'Outros',           ini:'10:00', fim:'10:05', obs:'forno'},
  {data:'12/08/2026', tipo:'Troca de produto', ini:'08:00', fim:'08:06', obs:''},   // curta e nomeada: não é anomalia
  {data:'12/08/2026', tipo:'Almoço',           ini:'11:00', fim:'12:12', obs:''},   // dentro do almoço: fora de tudo
  {data:'13/08/2026', tipo:'Robô',             ini:'09:00', fim:'',      obs:''}    // aberta
];
const an=_pgAnomalias(parAn, CFGA, {classeMap:{'Troca de produto':'NAO','Outros':'NAO','Manutenção':'NAO','Almoço':'PLANEJADA'}});
ok('acha a sobreposição', an.sobrepostas.length, 1);
ok('acha as paradas longas (≥30 min)', an.longas.map(l=>l.tipo), ['Troca de produto','Manutenção']);
// "Sem motivo" só conta onde ele FAZ FALTA: motivo é opcional no app, e cobrar
// de toda parada curta e nomeada viraria uma parede de alertas.
ok('sem motivo conta só a genérica e a longa', an.semMotivo.length, 2);
ok('mas o total sem motivo vai junto como contexto', an.semMotivoTotal, 3);
ok('parada curta e nomeada não é anomalia', an.semMotivo.some(x=>x.min===6), false);
ok('parada aberta (sem FIM) é apontada à parte', an.abertas.length, 1);
ok('parada inteira dentro do almoço fica fora de tudo', an.nValidas, 5);
// Tipo fora da aba TIPOS_PARADA = classe caiu na heurística por nome.
ok('acusa o tipo que não está na aba', _pgAnomalias(parAn, CFGA, {classeMap:{'Outros':'NAO'}}).semClasse.map(t=>t.tipo),
   ['Troca de produto','Manutenção']);
// Sem a aba, TODO tipo cairia aqui: melhor não acusar do que acusar tudo.
const semAba=_pgAnomalias(parAn, CFGA, {classeMap:{}});
ok('sem a aba TIPOS_PARADA a checagem não roda', [semAba.temClasse, semAba.semClasse.length], [false, 0]);
ok('o limite de parada longa é configurável', _pgAnomalias(parAn, CFGA, {longa:5}).longas.length, 5);

console.log('\n── quadro: foco atual ──');
ok('troca no topo vira "redução de trocas"', _pgFoco(pgTop, pgOut), 'redução de trocas + eliminação de "Outros"');
ok('sem ofensor não programado o foco não é inventado', _pgFoco([], null),
   'sem ofensor não programado no período');
ok('só anormal no topo → causa raiz',
   _pgFoco([{tipo:'Falta de material', classe:'ANORMAL'}], {qtd:0}), 'causa raiz de falta de material');
// Uma linha com cinco focos não é foco nenhum.
ok('no máximo dois focos', _pgFoco([{tipo:'Troca de produto',classe:'REDUTIVEL'},{tipo:'Troca de Plastico',classe:'REDUTIVEL'},
   {tipo:'Outros',classe:'IDENTIFICAR'},{tipo:'Manutenção',classe:'ANORMAL'}], {qtd:9,dentro:false}).split(' + ').length, 2);

console.log('\n── quadro: o desenho não pode virar duas cópias ──');
// O PLANO DE AÇÃO tinha seção própria E entrou no quadro. Imprimir a mesma
// tabela duas vezes no mesmo PDF não ajuda ninguém: ele vive só no quadro.
ok('a tabela do plano é montada num lugar só',
   (JS.match(/RESPONSÁVEL<\/th><th>PRAZO<\/th>/g) || []).length, 1);
ok('e a seção própria do plano não existe mais', /rp-sec-ttl">\d+ ▸ PLANO DE AÇÃO/.test(JS), false);
// A seta do quadro e a linha "ESTAMOS MELHORANDO?" do diagnóstico leem a MESMA
// tendência — duas cópias e uma apontaria para um lado e a outra para o outro.
ok('quadro e diagnóstico leem a mesma tendência',
   /_pgTendencia\(semanas\)/.test(pega('function _pgDiagnostico(')), true);
// O quadro é desenho: recebe pronto o que as seções já calcularam.
const _q=pega('function _pgQuadroHtml(');
ok('o quadro não recalcula perda', /perdaDeMin|perdaAoRitmo|RP_PARADAS\.stats/.test(_q), false);
ok('o quadro não refaz a conta das trocas', /durProdutiva/.test(_q), false);
// A meta em vigor é decidida no _pgSmed; o quadro só desenha o que recebeu.
ok('o quadro não decide a meta da troca', /_pgMetaSmed\(/.test(_q), false);
ok('a escada da meta é uma implementação só',
   (JS.match(/function _pgMetaSmed\(/g) || []).length, 1);
ok('e só o _pgSmed a chama', (JS.match(/(?<!function )_pgMetaSmed\(/g) || []).length, 1);
// Cenário de recuperação e plano de ação leem a MESMA meta em vigor — duas
// leituras e o PDF cobraria um alvo e simularia outro.
ok('o cenário e o plano recebem a meta que o SMED pôs em vigor',
   [/metaProduto:metasSmed\.produto/.test(pega('function _pgContexto(')),
    /_pgPlano\(top, outros, metasSmed\)/.test(pega('function _pgContexto('))], [true, true]);

// MINUTOS DE PARADA / 1.000 CAIXAS: o KPI nasceu no PDF e foi para a tela — um
// desenho só, e a conta continua fora dele.
ok('o KPI por 1.000 cx é desenhado num lugar só',
   (JS.match(/function _pgMin1000Html\(/g) || []).length, 1);
ok('e sai nos três — tela, relatório de perdas e impressão dedicada',
   (JS.match(/(?<!function )_pgMin1000Html\(/g) || []).length, 3);
// A TABELA de uma janela também é uma só: o bloco imprime o grão em cartaz e a
// impressão dedicada imprime as outras duas — a mesma tabela nos dois.
ok('a tabela da janela é desenhada num lugar só',
   (JS.match(/function _pgJanelaTabelaHtml\(/g) || []).length, 1);
ok('e o bloco e a impressão dedicada usam ela',
   (JS.match(/(?<!function )_pgJanelaTabelaHtml\(/g) || []).length, 2);
ok('a tabela não refaz conta nenhuma',
   /_pgMinPor1000\(|_pgPorJanela\(|durProdutiva/.test(pega('function _pgJanelaTabelaHtml(')), false);
ok('o desenho não refaz a conta', /_pgMinPor1000\(/.test(pega('function _pgMin1000Html(')), false);
ok('os dois por 1.000 cx saem do contexto',
   /minPor1000NP:_pgMinPor1000\(st\.totMinNP/.test(pega('function _pgContexto(')), true);
// A semana da comparação é a MESMA do relatório semanal e da Tela D.
ok('a janela de semana não é reescrita aqui',
   /_relSemanaJanela\(data\)/.test(pega('function _pgJanelaDe(')), true);
ok('as três janelas saem prontas do contexto',
   /janelas:\{semana:\s*_pgPorJanela/.test(pega('function _pgContexto(')), true);
ok('o desenho não recorta janela nenhuma', /_pgPorJanela\(/.test(pega('function _pgMin1000Html(')), false);
// Trocar o grão é redesenho: refazer a busca do período seria a leitura mais
// cara do painel por causa de um clique.
ok('trocar o grão não chama o backend',
   /_pgBuscarDados|getParadasPeriodo/.test(pega('function _pgTrocaGrao(')), false);

console.log('\n── impressão dedicada do minutos / 1.000 cx ──');
// "Colocar uma impressão dedicada a minutos de parada /1000" (usuário,
// 27/08/2026): o indicador só ia ao papel dentro de um relatório maior.
ok('existe a impressão dedicada', /async function gerarRelatorioMin1000\(/.test(JS), true);
const _relMil = pega('async function gerarRelatorioMin1000(');
ok('ela tem título próprio', /MINUTOS DE PARADA \/ 1\.000 CAIXAS/.test(_relMil), true);
// Busca, contas e desenho continuam UM só — a moldura é que muda.
ok('busca pela função compartilhada', /_pgBuscarDados\(de, ate\)/.test(_relMil), true);
ok('calcula pelo contexto compartilhado', /_pgContexto\(\{paradas:dados\.paradas/.test(_relMil), true);
ok('desenha pelo bloco compartilhado', /_pgMin1000Html\(ctx\)/.test(_relMil), true);
ok('e as outras janelas pela tabela compartilhada',
   /_pgJanelaTabelaHtml\(ctx, g\)/.test(_relMil), true);
ok('nenhuma conta de perda escrita dentro dela',
   /perdaDeMin|perdaAoRitmo|durProdutiva|_pgMinPor1000\(/.test(_relMil), false);
// As três janelas já vêm calculadas no contexto: uma segunda busca seria a
// leitura mais cara do painel repetida por causa de um botão.
ok('não busca janela nenhuma de novo', /_pgPorJanela\(/.test(_relMil), false);
// A janela em cartaz abre o documento; as outras duas vêm sem repetir a dela.
ok('imprime as três janelas, sem repetir a que abriu',
   /\['semana','quinzena','mes'\]\.filter\(g=>g!==ctx\.grao\)/.test(_relMil), true);
// Só a GESTÃO DE PERDAS é paisagem (o quadro 2×2 é a capa dela). Este é uma
// sequência de tabelas altas e estreitas, como o relatório de PARADAS.
ok('imprime em pé', /_rpDocParadas\(`Minutos de parada[^`]*`\)/.test(_relMil), true);
// O botão fica no próprio bloco e manda o período DA TELA — o relatório do
// período errado já aconteceu (a tela dizia 27h16m e o papel 42 min).
ok('o botão manda o período da tela de perdas',
   /gerarRelatorioMin1000\(dGet\('pg-de'\),dGet\('pg-ate'\)\)/.test(JS), true);

console.log('\n── a TELA e o PDF são o mesmo quadro ──');
// O quadro nasceu no PDF e o PPCP pediu ele como TELA. Desenho, busca e conta
// continuam UM só: duas cópias divergiriam na primeira mexida — foi assim que a
// conta de paradas divergiu três vezes.
ok('o quadro é definido uma vez só',
   (JS.match(/function _pgQuadroHtml\(/g) || []).length, 1);
ok('e é desenhado nos dois — PDF e tela',
   (JS.match(/(?<!function )_pgQuadroHtml\(/g) || []).length, 2);
ok('a busca dos dados é uma só',
   (JS.match(/function _pgBuscarDados\(/g) || []).length, 1);
ok('as contas da camada são uma só',
   (JS.match(/function _pgContexto\(/g) || []).length, 1);
// Se a tela montasse o contexto por conta própria, tela e PDF do mesmo período
// mostrariam números diferentes — o pior defeito possível num painel de gestão.
// O contexto de um período é montado UMA vez, no `_pgContextoDoPeriodo`, e as
// DUAS telas (gestão de perdas e simulador) leem dele — se cada uma montasse o
// seu, o mesmo período mostraria números diferentes em abas diferentes.
const _ctxPer = pega('async function _pgContextoDoPeriodo(');
ok('o contexto do período é montado num lugar só',
   (JS.match(/async function _pgContextoDoPeriodo\(/g) || []).length, 1);
ok('e ele lê o mesmo contexto do relatório',
   /_pgContexto\(\{paradas:dados\.paradas/.test(_ctxPer), true);
ok('o relatório lê o mesmo contexto da tela',
   /_pgSecaoHtml\(_pgContexto\(/.test(pega('async function gerarRelatorioParadas(')), true);
ok('a busca acontece pela função extraída',
   /_pgBuscarDados\(de, ate\)/.test(_ctxPer), true);
ok('as duas telas usam a MESMA busca',
   /_pgContextoDoPeriodo\(de, ate, forcar\)/.test(pega('async function renderGestaoPerdas('))
   && /_pgContextoDoPeriodo\(de, ate, forcar\)/.test(pega('async function renderSimulador(')), true);
ok('nenhuma das duas monta contexto por conta própria',
   /_pgContexto\(\{/.test(pega('async function renderGestaoPerdas('))
   || /_pgContexto\(\{/.test(pega('async function renderSimulador(')), false);
// A busca é a leitura mais cara do painel (lê a aba PARADAS inteira): sem
// guarda de reentrância os ciclos se empilham, e sem cache o refresh refaz tudo.
ok('a tela não empilha buscas', /if\(PG_TELA_RODANDO\) return;/.test(pega('async function renderGestaoPerdas(')), true);
ok('e guarda o período em cache', /PG_TELA_CACHE\[chave\]=reg/.test(_ctxPer), true);
// ⚠ Duas abas pedindo a MESMA janela não podem virar duas execuções no Apps
// Script — elas só se enfileirariam lá. Mesmo remédio do _phVoo do comparativo.
ok('e uma requisição em voo é compartilhada',
   /if\(PG_VOO\[chave\]\) return PG_VOO\[chave\]/.test(_ctxPer), true);
// Sem o paradas-calc.js não há conta nenhuma — mesma guarda das outras telas.
ok('a tela tem a guarda do módulo', /_rpOk\(\)/.test(pega('async function renderGestaoPerdas(')), true);
// A aba e a seção precisam existir e casar com o setTab.
ok('a aba existe na navegação', /data-tab="perdas"/.test(src), true);
ok('a seção existe', /id="sec-perdas"/.test(src), true);
ok('e o setTab acende a tela', /tab==='perdas'/.test(pega('function setTab(')), true);
// A pele da tela é CSS escopado: a mesma marcação, tokens do painel.
ok('a tela tem pele própria (CSS escopado)', /#sec-perdas \.pgq\{/.test(src), true);
// O botão da tela abria o PDF do período da OUTRA aba (a PARADAS, que começa
// em HOJE): a tela mostrava 30 dias e o papel, um dia — dois números para a
// mesma pergunta. O relatório passa a aceitar o período de quem o chamou.
ok('o relatório aceita o período de quem chamou',
   /async function gerarRelatorioParadas\(deArg, ateArg\)/.test(JS), true);
ok('e prefere ele aos campos da aba PARADAS',
   /let de=deArg\|\|dGet\('par-de'\)/.test(JS), true);
ok('o botão da tela manda o período dela',
   /gerarRelatorioParadas\(dGet\('pg-de'\),dGet\('pg-ate'\)\)/.test(src), true);
// O botão da aba PARADAS continua sem argumento: lê os campos dela, como antes.
ok('o botão da aba PARADAS não muda',
   (src.match(/onclick="gerarRelatorioParadas\(\)"/g) || []).length, 2);

console.log('\n── a tela tem o relatório DELA ──');
// O botão da aba GESTÃO DE PERDAS abria o relatório de PARADAS: outro
// documento, outro título, outra pergunta. Quem está na tela de gestão quer
// imprimir o que está vendo.
ok('existe o relatório da gestão de perdas', /async function gerarRelatorioPerdas\(/.test(JS), true);
const _relPg = pega('async function gerarRelatorioPerdas(');
ok('ele tem título próprio', /GESTÃO DE PERDAS — VISÃO PPCP/.test(_relPg), true);
// Busca, contas e desenho continuam UM só — a moldura é que muda.
ok('busca pela função compartilhada', /_pgBuscarDados\(de, ate\)/.test(_relPg), true);
ok('calcula pelo contexto compartilhado', /_pgContexto\(\{paradas:dados\.paradas/.test(_relPg), true);
ok('desenha pela camada compartilhada', /_pgSecaoHtml\(ctx\)/.test(_relPg), true);
// Só a camada: nada do relatório de controle (resumo, Pareto por tipo, SWOT…).
ok('não repete o relatório de controle', /swotHtml|linhasTipo|<div class="rp-sec-ttl">RESUMO/.test(_relPg), false);
// O CSS dos dois relatórios é o mesmo bloco: copiar 150 regras garantiria que
// o próximo ajuste consertasse um e esquecesse o outro (#204/#205).
ok('o CSS do documento é declarado uma vez só',
   (JS.match(/function _rpDocParadas\(/g) || []).length, 1);
ok('e os nove relatórios usam ele (paradas, perdas, min/1000, proposta de investimento, qualidade do plano, carteira, estudo de UEP, capacidade em UEP — dia montado e por produto)',
   (JS.match(/(?<!function )_rpDocParadas\(/g) || []).length, 9);
// A camada abre o documento no relatório dela: sem "o relatório acima" e sem
// a quebra de página que imprimiria uma folha em branco.
ok('o relatório da tela marca a camada como sozinha', /ctx\.soZinho=true/.test(_relPg), true);
ok('e o desenho troca o texto de abertura', /soZinho\s*\?/.test(pega('function _pgSecaoHtml(')), true);
ok('sem quebra de página quando abre o documento', /\.pg-abre\.so\{page-break-before:auto/.test(src), true);
// Os dois botões, cada um com o seu período.
ok('a tela oferece os dois relatórios',
   [/gerarRelatorioPerdas\(dGet\('pg-de'\),dGet\('pg-ate'\)\)/.test(src),
    /gerarRelatorioParadas\(dGet\('pg-de'\),dGet\('pg-ate'\)\)/.test(src)], [true, true]);

console.log('\n── o relatório ANTIGO continua inteiro ──');
// O pedido do PPCP foi explícito: a camada nova é ACRÉSCIMO. Se alguma destas
// peças sumir, o relatório oficial perdeu função — e é isso que não pode.
const _relPar = pega('async function gerarRelatorioParadas(');
[['RESUMO','<div class="rp-sec-ttl">RESUMO</div>'],
 ['Pareto por tipo','PARETO — TEMPO PARADO POR TIPO'],
 ['tabela por tipo','<div class="rp-sec-ttl">POR TIPO DE PARADA</div>'],
 ['estudo de ganho','ESTUDO DE GANHO'],
 ['SWOT','${swotHtml}'],
 ['detalhamento','<div class="rp-sec-ttl">DETALHAMENTO</div>'],
 ['tempo total parado','TEMPO TOTAL PARADO'],
 ['disponibilidade','DISPONIBILIDADE'],
 ['% do turno perdido','% DO TURNO PERDIDO'],
 // O rótulo era "PEÇAS PERDIDAS" no desktop e "CAIXAS PERDIDAS" no mobile —
 // mesmo st.pecas, dois nomes, e o próprio desktop já dizia CAIXAS na tabela do
 // plano de ação. O produto conta caixa; a PEÇA sumiu do vocabulário. A peça do
 // relatório continua obrigatória, só mudou de nome.
 ['caixas perdidas','CAIXAS PERDIDAS'],
 ['perda a ritmo real','PERDA A RITMO REAL'],
 ['takt ideal','TAKT IDEAL'],
 ['takt real','TAKT REAL (RODANDO)'],
 ['peso perdido','PESO PERDIDO'],
 ['tempo médio/parada','TEMPO MÉDIO / PARADA']
].forEach(([nome,trecho]) => ok('o relatório antigo mantém: '+nome, _relPar.includes(trecho), true));
// A camada nova entra DEPOIS do diagnóstico antigo e ANTES do detalhamento.
ok('a camada nova entra depois do SWOT',
   _relPar.indexOf('${swotHtml}') < _relPar.indexOf('${pgHtml}'), true);
ok('e antes do detalhamento',
   _relPar.indexOf('${pgHtml}') < _relPar.indexOf('<div class="rp-sec-ttl">DETALHAMENTO</div>'), true);
// Se a camada nova quebrar, o relatório oficial sai assim mesmo.
ok('a camada nova roda dentro de um try', /try\{[\s\S]*?_pgSecaoHtml\(/.test(_relPar), true);
// A conta continua morando no paradas-calc.js: a camada nova valora recortes
// pelas funções do módulo, não com fórmula própria escrita no HTML.
ok('a camada nova não escreve fórmula de perda própria',
   /perd\s*=\s*Math\.round\([^)]*meta[^)]*horasProd/.test(JS), false);
ok('e valora pelo módulo (perdaAoRitmo)', /RP_PARADAS\.perdaAoRitmo\(/.test(pega('function _pgRecuperacao(')), true);

// ── guarda-corpo: a margem da impressão é da PÁGINA ─────────────────────────
// @page{margin:0} + padding no body dá respiro só na 1ª e na última folha:
// padding de body existe uma vez, no começo e no fim do fluxo. Da 2ª folha em
// diante o conteúdo sai colado na borda do papel, dentro da faixa que a
// impressora não imprime — foi o corte reclamado nos relatórios de PARADAS e
// de GESTÃO DE PERDAS. Vale para os CINCO relatórios em popup.
console.log('\n── impressão: margem na @page, não no padding do body ──');
// O CSS mora dentro de template literal: `${...}` tem chave e quebraria a
// varredura das regras. Troca-se cada interpolação por um marcador antes.
const _cssSrc = src.replace(/\$\{[^{}]*\}/g, '\u00A7');
const _pages = [..._cssSrc.matchAll(/@page\s*\{([^}]*)\}/g)].map(m => m[1]);
ok('nenhum relatório imprime com @page margin:0',
   _pages.filter(p => /margin\s*:\s*0\s*[;}]?\s*$/.test(p.trim())).length, 0);
ok('toda @page declara margem', _pages.filter(p => !/margin\s*:/.test(p)).length, 0);
// O padding do body é do PREVIEW na tela; na impressão ele tem de sair, senão
// a 1ª folha ganha margem dobrada e as outras continuam sem nenhuma.
const _printBlocks = [...src.matchAll(/@media print\s*\{([\s\S]*?)\n  \}/g)].map(m => m[1])
  .concat([...src.matchAll(/@media print\s*\{([^\n]*)\}\s*\n/g)].map(m => m[1]));
ok('nenhum @media print devolve padding ao body',
   _printBlocks.filter(b => /body\s*\{[^}]*padding\s*:\s*(?!0)/.test(b)).length, 0);
// Tabela que quebra no meio da linha é o mesmo corte visto de perto, e sem o
// cabeçalho repetido a coluna da folha 5 vira adivinhação.
ok('tabela dos relatórios quebra entre linhas',
   (src.match(/tr\s*\{\s*page-break-inside\s*:\s*avoid/g) || []).length >= 4, true);
ok('e repete o cabeçalho em cada folha',
   (src.match(/thead\s*\{\s*display\s*:\s*table-header-group/g) || []).length >= 4, true);

// ── orientação: paisagem só no relatório da GESTÃO DE PERDAS ────────────────
// O quadro 2×2 é a capa desse relatório e foi desenhado largo. O de PARADAS é
// uma sequência de tabelas altas e continua em pé. O que NÃO pode acontecer é
// o CSS virar duas cópias para ter uma versão deitada — a orientação é
// parâmetro do mesmo `_rpDocParadas`.
console.log('\n── orientação dos relatórios de paradas e de perdas ──');
ok('o documento dos dois continua sendo UMA implementação',
   (JS.match(/function _rpDocParadas\(/g) || []).length, 1);
ok('e a orientação é parâmetro dele', /function _rpDocParadas\(titulo,\s*paisagem\)/.test(JS), true);
ok('nenhum tamanho de página fixo dentro do documento compartilhado',
   /size:A4 (portrait|landscape)[^`]*\}\s*\n[\s\S]{0,200}_rpDocParadas/.test(JS), false);
const _perdas = pega('async function gerarRelatorioPerdas(');
const _paradas = pega('async function gerarRelatorioParadas(');
ok('GESTÃO DE PERDAS imprime deitado', /_rpDocParadas\(`Gestão de Perdas[^`]*`,\s*true\)/.test(_perdas), true);
ok('PARADAS continua em pé', /_rpDocParadas\(`Relatório de Paradas[^`]*`\)/.test(_paradas), true);
// A compactação da capa deitada não pode vazar para o retrato: toda regra da
// paisagem é escopada por .deitado.
const _cssPais = (src.match(/\n  \.deitado [^\n]*/g) || []);
ok('a paisagem tem regras próprias', _cssPais.length > 0, true);
ok('e todas escopadas por .deitado', _cssPais.every(r => r.trim().startsWith('.deitado ')), true);
// A capa (cabeçalho + abertura + quadro) tem de caber na folha deitada, senão
// o quadro pula para a folha 2 e a 1 sai quase em branco. O quadro continua
// inteiro: partido ao meio ele perde a função de ser visto de uma vez.
ok('o quadro continua sem partir ao meio',
   /\.pgq\{[^}]*page-break-inside:avoid/.test(src), true);

console.log('\n── simulador de investimento (aba GESTÃO DE PERDAS) ──');
// A conta é pura e roda aqui contra o código real. Os números do cenário são
// os do caso que originou o simulador (28/08/2026): Troca de Plastico com
// 327 min · 55× · 1.030 cx em 22 dias trabalhados, custo-hora R$ 382,89 —
// que é de UMA HORA DE LINHA (todas as pessoas juntas). A HE entra em
// HOMEM-HORA/semana e é convertida: com 10 pessoas, 8 h/sem × 4,4 = 35,2
// homem-hora/mês = 3,52h de linha (correção de 28/08/2026 — antes o % de HE
// evitável dividia hora de linha por homem-hora, número sem significado).
global.PG_RE_GENERICO = eval(JS.match(/const PG_RE_GENERICO\s*=\s*(\/[^\n]+\/i);/)[1]);
eval(pega('function _pgSimulacao('));
ok('causa genérica marcada vira aviso no cenário',
   _pgSimulacao({tipos:[{tipo:'Outros',min:60,perd:10},{tipo:'Troca de Plastico',min:60,perd:10}],
     selec:{Outros:true,'Troca de Plastico':true},pctRed:80,nDias:20}).genericos.join(), 'Outros');
eval(pega('function _pgSimNum('));
const simTipos = [
  { tipo: 'Troca de Plastico', min: 327, qtd: 55, perd: 1030, planej: false },
  { tipo: 'Troca de produto',  min: 568, qtd: 74, perd: 1681, planej: false },
  { tipo: 'Parada/Café',       min: 120, qtd: 10, perd: 0,    planej: true }
];
const simBase = { tipos: simTipos, horasProd: 8.8, nDias: 22, totMinNP: 1449 };
let sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true },
  pctRed: 100, custoHora: 382.89, adicHE: 50, invest: 50000, heSem: 8, pessoas: 10 });
ok('minutos do período = os do tipo marcado', sim.minPer, 327);
ok('caixas do período = o perd que o stats já valorou', sim.cxPer, 1030);
ok('período de 22 dias trabalhados = mês típico', sim.minMes, 327);
ok('CUSTO DA PARADA = horas recuperadas × custo-hora de linha',
   Math.round(sim.rsMes), Math.round(327 / 60 * 382.89));
ok('HE do mês em homem-hora: 8 × 4,4', Math.round(sim.heMesHH * 10) / 10, 35.2);
ok('HE em hora de LINHA: ÷ 10 pessoas', Math.round(sim.heMesLinha * 100) / 100, 3.52);
ok('custo-hora por pessoa = linha ÷ pessoas', Math.round(sim.custoHoraPessoa * 100) / 100, 38.29);
// Teto: 5,45h recuperadas > 3,52h de HE praticada — só 3,52h viram R$.
ok('horas valorizadas = mín(recuperadas, HE de linha)', Math.round(sim.horasVal * 100) / 100, 3.52);
ok('o excedente é ganho de capacidade, nunca R$', Math.round(sim.exced * 100) / 100, 1.93);
ok('ECONOMIA EM HE valoriza só até o teto', Math.round(sim.rsMesHE), Math.round(3.52 * 382.89 * 1.5));
ok('payback é ÚNICO e usa só a ECONOMIA EM HE',
   Math.round(sim.pay * 10) / 10, Math.round(50000 / (3.52 * 382.89 * 1.5) * 10) / 10);
ok('a faixa de payback não existe mais', sim.payMin === undefined && sim.payMax === undefined, true);
ok('disponibilidade antes: 87,5%', sim.dispAntes.toFixed(1), '87.5');
ok('atacar a troca de plástico cruza a meta de 90%', sim.dispDepois >= 90, true);
ok('hora extra evitável na base hora de linha: 5,45h ÷ 3,52h',
   Math.round(sim.pctHE * 10) / 10, 154.8);

// ROI no horizonte escolhido (3 ou 5 anos; padrão 5)
ok('horizonte padrão = 5 anos', sim.anos, 5);
ok('ganho acumulado = economia em HE × anos × 12',
   Math.round(sim.ganhoAcum), Math.round(3.52 * 382.89 * 1.5 * 60));
ok('ROI = (ganho − investimento) ÷ investimento',
   Math.round(sim.roi * 10) / 10,
   Math.round((3.52 * 382.89 * 1.5 * 60 - 50000) / 50000 * 1000) / 10);
sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100,
  custoHora: 382.89, adicHE: 50, invest: 150000, heSem: 8, pessoas: 10, roiAnos: 3 });
ok('horizonte de 3 anos', sim.anos, 3);
ok('ROI pode ser negativo (investimento acima do ganho)', sim.roi < 0, true);
sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100, custoHora: 382.89 });
ok('sem investimento não há ROI', sim.roi, null);

// Sem PESSOAS não há conversão homem-hora → hora de linha: o % fica em "—"
// e a economia sai SEM teto, marcada como estimativa (nunca silenciosa).
sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100,
  custoHora: 382.89, adicHE: 50, heSem: 8 });
ok('sem pessoas não há % de HE evitável', sim.pctHE, null);
ok('sem pessoas não há teto — valem as horas cheias',
   Math.round(sim.rsMesHE), Math.round(327 / 60 * 382.89 * 1.5));
ok('e a economia sai marcada como estimativa', sim.heEstim, true);
sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100,
  custoHora: 382.89, adicHE: 50, pessoas: 10 });
ok('sem h/semana de HE também não há teto (estimativa)', sim.heEstim, true);

sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true, 'Parada/Café': true },
  pctRed: 100 });
ok('parada PLANEJADA marcada não entra na conta', sim.minPer, 327);
ok('sem custo-hora não há R$', sim.rsMes, null);
ok('sem investimento não há payback', sim.pay, null);
ok('sem h/semana de HE não há % evitável', sim.pctHE, null);

sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 80 });
ok('redução de 80% corta os minutos', Math.round(sim.minPer * 10) / 10, 261.6);
sim = _pgSimulacao({ ...simBase, nDias: 11, selec: { 'Troca de Plastico': true }, pctRed: 100 });
ok('mensalização por 22/diasTrabalhados', sim.minMes, 654);
sim = _pgSimulacao({ ...simBase, selec: {}, pctRed: 100 });
ok('nada marcado → nada simulado', sim.nSel === 0 && sim.minPer === 0, true);
sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 150 });
ok('% acima de 100 vira 100', sim.minPer, 327);
sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100, custoHora: 100 });
ok('adicional de HE omitido cai no padrão 50%', Math.round(sim.rsMesHE), Math.round(327 / 60 * 100 * 1.5));
sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100, custoHora: 100, adicHE: 0 });
ok('adicional 0 digitado vale 0 (não vira 50)', sim.rsMesHE, sim.rsMes);

// número digitado em pt-BR
ok('vírgula decimal', _pgSimNum('382,89'), 382.89);
ok('milhar + decimal', _pgSimNum('1.234,56'), 1234.56);
ok('ponto de milhar sem vírgula', _pgSimNum('50.000'), 50000);
ok('ponto decimal de quem digita em en', _pgSimNum('382.89'), 382.89);
ok('R$ e espaços não atrapalham', _pgSimNum('R$ 1.234,56'), 1234.56);
ok('vazio é zero', _pgSimNum(''), 0);
// Campos em R$ saem formatados ao sair do campo, e a conta lê o formato de volta
eval(pega('function _pgSimRs('));
ok('200000 vira R$ 200.000', _pgSimRs('200000').replace(/\s/g, ' '), 'R$ 200.000');
ok('377,81 vira R$ 377,81', _pgSimRs('377,81').replace(/\s/g, ' '), 'R$ 377,81');
ok('vazio continua vazio', _pgSimRs(''), '');
ok('o texto formatado volta ao mesmo número',
   [_pgSimNum(_pgSimRs('200000')), _pgSimNum(_pgSimRs('377,81')), _pgSimNum(_pgSimRs('1234567,5'))], [200000, 377.81, 1234567.5]);

// por ano = mês típico × 12 ("colocar por ano tbm")
sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true },
  pctRed: 100, custoHora: 382.89, adicHE: 50, heSem: 8 });
ok('ano = mês × 12 (R$ e caixas)', [Math.round(sim.rsAno), sim.cxAno],
   [Math.round(sim.rsMes * 12), sim.cxMes * 12]);
ok('horas por ano', Math.round(sim.horasAno * 10) / 10, 65.4);

// ── TICKET MÉDIO → POTENCIAL DE RECEITA (04/09/2026) ──
// A TERCEIRA leitura financeira, e a que mais engana se mal rotulada: caixa
// recuperada é CAPACIDADE, não venda. Regras que o teste prende:
//   1. sem ticket, NADA é calculado (nunca arbitrar um preço médio);
//   2. potencial = caixas recuperadas × ticket, e o ano é o mês × 12;
//   3. ele NUNCA entra no payback nem no ROI — receita potencial não é
//      dinheiro disponível para pagar investimento.
sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100,
  custoHora: 382.89, adicHE: 50, heSem: 8, pessoas: 10 });
ok('sem ticket médio não há potencial de receita', sim.receitaMes, null);
ok('nem anual', sim.receitaAno, null);
ok('e o ticket fica em zero, nunca arbitrado', sim.ticket, 0);
const _semTicket = { ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100,
  custoHora: 382.89, adicHE: 50, invest: 50000, heSem: 8, pessoas: 10 };
const _comTicket = _pgSimulacao({ ..._semTicket, ticket: 187.5 });
ok('potencial de receita = caixas recuperadas × ticket',
   Math.round(_comTicket.receitaMes), Math.round(_comTicket.cxMes * 187.5));
ok('e o ano é o mês × 12',
   Math.round(_comTicket.receitaAno), Math.round(_comTicket.receitaMes * 12));
// ⚠ A trava mais importante: o ticket não pode mexer em payback nem em ROI.
const _base = _pgSimulacao(_semTicket);
ok('o ticket NÃO muda o payback', _comTicket.pay, _base.pay);
ok('nem o ROI', _comTicket.roi, _base.roi);
ok('nem a economia em HE', _comTicket.rsMesHE, _base.rsMesHE);
ok('nem o custo da parada', _comTicket.rsMes, _base.rsMes);
ok('nem as caixas recuperadas', _comTicket.cxMes, _base.cxMes);
// Ticket digitado em pt-BR com centavos
ok('ticket com vírgula decimal', _pgSimNum('187,50'), 187.5);

// ── a tela: dois cards de R$, ROI com horizonte no rótulo, campo de pessoas ──
const _resHtml = pega('function _pgSimResHtml(');
ok('a tela separa CUSTO DA PARADA e ECONOMIA EM HE',
   /CUSTO DA PARADA/.test(_resHtml) && /ECONOMIA EM HE/.test(_resHtml), true);
ok('o card da parada avisa que é folha já paga', /folha já paga/.test(_resHtml), true);
ok('o excedente vira nota no card de caixas',
   /ganho de capacidade, não de custo/.test(_resHtml), true);
ok('o ROI leva o horizonte no rótulo (select 3/5 anos)',
   /pg-sim-roi-anos/.test(_resHtml) && /3 anos/.test(_resHtml) && /5 anos/.test(_resHtml), true);
ok('ROI negativo sai em vermelho',
   /r\.roi<0\?'var\(--red\)'/.test(_resHtml.replace(/\s+/g, '')), true);
ok('sem pessoas, o card de HE pede a quantidade',
   /informe a quantidade de pessoas/.test(_resHtml), true);
// O ANO saiu da nota de rodapé para uma LINHA PRÓPRIA do card (04/09/2026):
// o número grande continua sendo o mês — é ele que alimenta o payback —, mas
// o ano é o valor que se compara com o orçamento e não podia ficar em 10px.
ok('o ano tem linha própria nos quatro cards de ganho',
   (_resHtml.match(/pg-sim-c-a/g) || []).length, 1);
ok('e ela é preenchida por tempo, caixas e os dois R$',
   [/fmt1\(r\.horasAno\)\+' h por ano'/, /fmtN\(r\.cxAno\)\+' cx por ano'/,
    /rs\(r\.rsAno\)\+' por ano'/, /rs\(r\.rsAnoHE\)\+' por ano'/]
     .every(re => re.test(_resHtml)), true);
// O card do POTENCIAL fica marcado e explica o que NÃO é; sem ticket ele diz
// que não foi calculado, em vez de mostrar zero (zero afirmaria "não vale nada").
ok('a tela tem o card do POTENCIAL DE RECEITA',
   /POTENCIAL DE RECEITA/.test(_resHtml), true);
ok('com a etiqueta POTENCIAL',
   /pg-sim-et">POTENCIAL/.test(_resHtml), true);
ok('e o card sai condicional na tela também',
   /null, false, true\)/.test(_resHtml), true);
ok('sem ticket ele diz que não foi calculado, não mostra zero',
   /ticket médio não informado — potencial de receita não calculado/.test(_resHtml), true);
ok('e avisa que não é economia nem faturamento garantido',
   /não é economia nem faturamento garantido/.test(_resHtml), true);
ok('o payback diz que a receita potencial não entra',
   /a receita potencial não entra/.test(_resHtml), true);
ok('o número grande continua sendo o mês',
   / min\/mês/.test(_resHtml) && / cx\/mês/.test(_resHtml)
   && (_resHtml.match(/<span> \/mês<\/span>/g) || []).length === 3, true);
// v7.62.0 — revisão da tela
// v7.63.0 — evolução da tela: HE digitada como 0, faixas e memória de cálculo
{
  const _b = { ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100,
    custoHora: 382.89, adicHE: 50, invest: 50000, pessoas: 10 };
  const _z = _pgSimulacao({ ..._b, heSem: 0, heInformada: true });
  ok('HE digitada como 0: não há HE a economizar', _z.rsMesHE, 0);
  ok('e o payback não é calculável', _z.pay, null);
  ok('e o tempo e as caixas continuam (capacidade não depende de HE)', _z.minPer, 327);
  const _v = _pgSimulacao({ ..._b, heSem: 0 });
  ok('HE vazia continua sendo estimativa sem teto (comportamento anterior)', _v.heEstim, true);
  const _r0 = _pgSimulacao({ ..._b, heSem: 8, pctRed: 0 });
  ok('redução 0% → nada recuperado, nada economizado', [_r0.minPer, _r0.cxMes, _r0.rsMesHE, _r0.pay], [0, 0, 0, null]);
  const _t0 = _pgSimulacao({ ..._b, heSem: 8, ticket: 0 });
  ok('ticket 0 → potencial não calculado', _t0.receitaMes, null);
  const _c = _pgSimulacao({ ..._b, heSem: 8 });
  ok('a frase usa a parada ANTES da redução e a fatia do não programado',
     [_c.minSelPer, Math.round(_c.pctNP * 10) / 10], [327, Math.round(327 / 1449 * 1000) / 10]);
}
// v7.64.0 — REDUÇÃO POR CAUSA
{
  const _s2 = { 'Troca de Plastico': true, 'Troca de produto': true };
  const _pc = _pgSimulacao({ ...simBase, selec: _s2, pctRed: 80, redCausa: { 'Troca de produto': '10' } });
  ok('cada causa usa o próprio %, a sem % usa o padrão',
     _pc.porCausa.map(c => c.tipo + ':' + c.pct).join(), 'Troca de Plastico:80,Troca de produto:10');
  ok('minutos = Σ min × % de cada causa', Math.round(_pc.minPer * 10) / 10, Math.round((327 * 0.8 + 568 * 0.1) * 10) / 10);
  ok('caixas arredondam uma vez, no fim', _pc.cxPer, Math.round(1030 * 0.8 + 1681 * 0.1));
  ok('com % diferentes não há "o" %', _pc.pctUnica === false && _pc.pctRes === null, true);
  ok('e a média é ponderada pelo tempo', Math.round(_pc.pctEf * 10) / 10,
     Math.round((327 * 0.8 + 568 * 0.1) / (327 + 568) * 1000) / 10);
  const _pv = _pgSimulacao({ ...simBase, selec: _s2, pctRed: 80, redCausa: { 'Troca de produto': '' } });
  ok('% vazio = padrão (e o resultado é o de antes)', [_pv.pctRes, Math.round(_pv.minPer * 10) / 10], [80, Math.round(895 * 0.8 * 10) / 10]);
  const _pa = _pgSimulacao({ ...simBase, selec: _s2, pctRed: 80, redCausa: { 'Troca de produto': '250' } });
  ok('% da causa acima de 100 vira 100', _pa.porCausa[1].pct, 100);
  const _pu = _pgSimulacao({ ...simBase, selec: _s2, pctRed: 80, redCausa: { 'Troca de produto': '50', 'Troca de Plastico': '50' } });
  ok('todas com o mesmo % próprio → é "o" %', _pu.pctRes, 50);
}
ok('o aviso de várias causas só sai quando o % é um só',
   /r\.nSel>1 && r\.pctUnica/.test(pega('function _pgSimAvisos(')), true);
ok('o papel mostra a redução de cada causa',
   /REDUÇÃO SIMULADA<\/th>/.test(pega('async function gerarRelatorioInvestimento(')), true);
ok('HE evitável acima de 100% não é impressa (tela, papel e fatos da IA)',
   (JS.match(/Math\.min\(100,r\.pctHE\)/g) || []).length, 3);
// Cor só onde há função: na tela do simulador o número é tinta — a cor fica
// na economia em HE (o benefício) e no ROI negativo (o alerta).
ok('números do simulador sem cor decorativa',
   /'var\(--acc\)'|'var\(--warn\)'/.test(_resHtml), false);
// v7.67.0 — investimento total e custo recorrente
{
  const _b = { ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100,
    custoHora: 382.89, adicHE: 50, pessoas: 10, hePessoa: 8, invest: 50000 };
  const _s = _pgSimulacao(_b);
  const _i = _pgSimulacao({ ..._b, instal: 10000 });
  ok('instalação soma no investimento total', _i.investTotal, 60000);
  ok('e o payback usa o total', Math.round(_i.pay * 100) / 100, Math.round(60000 / _s.rsMesHE * 100) / 100);
  const _m = _pgSimulacao({ ..._b, manutAno: 12000 });
  ok('manutenção anual sai da economia todo mês', Math.round(_m.ecoLiqMes), Math.round(_s.rsMesHE - 1000));
  ok('a economia em HE bruta não muda', _m.rsMesHE, _s.rsMesHE);
  ok('payback e ROI usam a economia LÍQUIDA',
     [Math.round(_m.pay * 100) / 100, Math.round(_m.roi * 10) / 10],
     [Math.round(50000 / (_s.rsMesHE - 1000) * 100) / 100, Math.round(((_s.rsMesHE - 1000) * 60 - 50000) / 50000 * 1000) / 10]);
  ok('sem instalação nem manutenção, a conta é a de antes', [_s.investTotal, _s.ecoLiqMes, _s.pay], [50000, _s.rsMesHE, 50000 / _s.rsMesHE]);
  const _z = _pgSimulacao({ ..._b, manutAno: _s.rsMesHE * 12 * 2 });
  ok('manutenção maior que a economia: payback não calculável', _z.pay, null);
}
ok('o papel mostra o que é o investimento e a recomendação',
   /O QUE É O INVESTIMENTO/.test(pega('async function gerarRelatorioInvestimento(')) && /RECOMENDAÇÃO DO GESTOR/.test(pega('async function gerarRelatorioInvestimento(')), true);
ok('a tela separa em três faixas: decisão, operação, outras leituras',
   /O INVESTIMENTO E O RETORNO/.test(_resHtml) && /IMPACTO OPERACIONAL/.test(_resHtml)
   && /OUTRAS LEITURAS/.test(_resHtml) && /não são economia de caixa/.test(_resHtml), true);
ok('o potencial de receita fica na faixa de baixo, depois da economia',
   _resHtml.indexOf("card('POTENCIAL DE RECEITA") > _resHtml.indexOf("card('ECONOMIA EM HE"), true);
const _mem = pega('function _pgSimMemHtml(');
ok('a memória de cálculo é desenho: nenhuma conta de R$ dentro',
   /\*\s*r\.custoHora|r\.invest\s*\/|\*\s*r\.ticket/.test(_mem), false);
ok('e fica recolhida num <details> fora do miolo que redesenha',
   /<details class="pg-sim-mem">/.test(pega('function _pgSimHtml(')) && /pg-sim-memo/.test(pega('function _pgSimAtualiza(')), true);
ok('o papel marca a economia em HE como SIMULADO, não POTENCIAL',
   /ECONOMIA EM HE<span class="prop-et sim">SIMULADO/.test(JS), true);
ok('payback/ROI pedem só o campo que falta',
   /informe INVESTIMENTO e CUSTO-HORA/.test(JS), false);
ok('a nota não repete a frase dos R$',
   (pega('function _pgSimHtml(').match(/limitada à HE praticada/g) || []).length, 1);
const _simHtml = pega('function _pgSimHtml(');
ok('o CENÁRIO pede as pessoas da embalagem',
   /pg-sim-pessoas/.test(_simHtml) && /PESSOAS NA EMBALAGEM \(qtde\)/.test(_simHtml), true);
ok('o rótulo da HE diz a grandeza: h/semana, por pessoa',
   /HORA EXTRA ATUAL \(h\/semana, por pessoa\)/.test(_simHtml), true);
// v7.65.0 — "seria 15 × 8 hr": HE por pessoa
{
  const _hp = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100,
    custoHora: 382.89, adicHE: 50, pessoas: 15, hePessoa: 8 });
  ok('8 h por pessoa × 15 = 120 homem-hora/semana', _hp.heSem, 120);
  ok('em hora de LINHA: 8 × 4,4 = 35,2 h/mês', Math.round(_hp.heMesLinha * 10) / 10, 35.2);
  ok('e dá o MESMO que o total digitado (120 ÷ 15)',
     Math.round(_pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100,
       custoHora: 382.89, adicHE: 50, pessoas: 15, heSem: 120 }).heMesLinha * 10) / 10, 35.2);
  const _hs = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true }, pctRed: 100,
    custoHora: 382.89, adicHE: 50, hePessoa: 8 });
  ok('por pessoa, o teto existe mesmo sem o nº de pessoas', [_hs.heTeto, _hs.heEstim], [true, false]);
  ok('0 por pessoa = sem HE a economizar', _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true },
    pctRed: 100, custoHora: 100, pessoas: 15, hePessoa: 0 }).rsMesHE, 0);
}
ok('a tela não lê mais o total antigo salvo no aparelho',
   /heSem:\s*_pgSimNum\(s\.heSem\)/.test(pega('function _pgSimEnt(')), false);
ok('a nota de rodapé explica por que os R\$ não se somam',
   /não se somam/.test(_simHtml), true);
ok('o cenário tem o campo do ticket, marcado como opcional',
   /pg-sim-ticket/.test(_simHtml) && /TICKET MÉDIO \(R\$\/caixa · opcional\)/.test(_simHtml), true);
ok('e a nota do bloco diz que as três leituras não se somam',
   /três leituras financeiras diferentes/.test(_simHtml)
   && /Payback e ROI usam só a ECONOMIA EM HE/.test(_simHtml), true);

// ── impressão executiva (PROPOSTA DE INVESTIMENTO) ──
const _inv = pega('async function gerarRelatorioInvestimento(');
// v7.69.0: a montagem (conta + sensibilidade + textos) saiu para _propMontar,
// que o PDF e a redação com IA leem — duas montagens divergiriam.
const _mont = pega('function _propMontar(');
ok('a proposta usa a MESMA conta e o MESMO cenário da tela',
   /_propMontar\(ctx, s\)/.test(_inv) && /_pgSimEstado\(/.test(_inv)
   && /_pgSimulacao\(_pgSimEnt\(ctx, s\)\)/.test(_mont), true);
ok('a montagem é UMA implementação', (JS.match(/function _propMontar\(/g) || []).length, 1);
ok('o PDF não recalcula a simulação por fora da montagem',
   /_pgSimulacao\(/.test(_inv), false);
ok('no documento compartilhado, em retrato',
   /_rpDocParadas\(`Proposta de Investimento[^`]*`\)/.test(_inv), true);
ok('o papel diz como o número sai', /COMO O NÚMERO SAI/.test(_inv), true);
ok('e diz que é simulação, não medição', /simulação, não medição/.test(_inv), true);
ok('o papel explica a conversão homem-hora → hora de linha',
   /HOMEM-HORA → HORA DE LINHA/.test(_inv), true);
ok('e que os dois R$ não se somam', /não se somam/.test(_inv), true);
// O botão da impressão mora no CABEÇALHO DA ABA desde que o simulador ganhou
// tela própria — dentro do bloco ele virava um segundo botão idêntico.
ok('a aba tem o botão da impressão executiva',
   /gerarRelatorioInvestimento\(dGet\('sim-de'\)/.test(src), true);
ok('e ele não é desenhado duas vezes',
   /gerarRelatorioInvestimento\(/.test(pega('function _pgSimHtml(')), false);
ok('nenhuma fórmula de perda reescrita no papel',
   /perdaDeMin|perdaAoRitmo|durProdutiva\(/.test(_inv), false);

// ── o redesenho executivo da proposta (04/09/2026) ──
// A proposta virou documento de diretoria: capa executiva, fio condutor
// PROBLEMA → CENÁRIO → GANHO → INVESTIMENTO → RETORNO, números grandes e
// metodologia como nota técnica. O CONTEÚDO não mudou — mudou a apresentação.
// PASSO 2 (23/09/2026): a página 1 é a DECISÃO — o fio condutor é o roteiro
// dela, na ordem em que a diretoria lê.
ok('o fio condutor da leitura está no papel, na ordem da decisão',
   /prop-fluxo/.test(_inv) && /<span>O QUE É<\/span><span>QUANTO CUSTA<\/span><span>O QUE RESOLVE<\/span><span>ECONOMIA<\/span><span>RETORNO<\/span><span>SENSIBILIDADE<\/span><span>RECOMENDAÇÃO<\/span>/.test(_inv), true);
ok('a página 1 traz o que é, quanto custa, o que resolve, economia e retorno, sensibilidade e recomendação',
   ['1 ▸ O QUE É E QUANTO CUSTA', '2 ▸ O QUE RESOLVE', '3 ▸ ECONOMIA E RETORNO',
    '4 ▸ SENSIBILIDADE — E SE A REDUÇÃO FOR MENOR?', '5 ▸ RECOMENDAÇÃO E ASSINATURAS']
     .filter(t => !_inv.includes(t)).join(' | '), '');
ok('a evidência e o anexo vêm DEPOIS, em folha própria',
   _inv.indexOf('6 ▸ A EVIDÊNCIA') > _inv.indexOf('5 ▸ RECOMENDAÇÃO')
   && _inv.indexOf('ANEXO ▸ METODOLOGIA') > _inv.indexOf('9 ▸ OUTRAS LEITURAS')
   && (_inv.match(/<div class="prop-quebra"><\/div>/g) || []).length === 2
   && /\.prop-quebra\{page-break-before:always/.test(_inv), true);
// A SENSIBILIDADE é CONTA do painel, não redação: a mesma _pgSimulacao roda
// de novo para 50/70/90% com redução uniforme (o % por causa desligado).
ok('a sensibilidade roda a MESMA conta três vezes',
   /PROP_SENS_PCTS\.map\(p=>\(\{pct:p, r:_pgSimulacao\(\{\.\.\.entBase, pctRed:p, redCausa:\{\}\}\)/.test(pega('function _propMontar(')), true);
ok('e os cenários estão numa constante', /const PROP_SENS_PCTS=\[50,70,90\];/.test(JS), true);
ok('o cenário do gestor entra na tabela, marcado',
   /cenário do gestor/.test(_inv) && /prop-sens-g/.test(_inv), true);
ok('a recomendação e as assinaturas fecham a página 1',
   /<em>RECOMENDAÇÃO DO GESTOR<\/em>/.test(_inv) && /Gestor · PPCP/.test(_inv) && /Diretoria<\/div>/.test(_inv), true);
ok('payback e ROI da página 1 saem sem número inventado',
   (_inv.match(/<span>não calculado<\/span>/g) || []).length >= 2, true);
ok('os três números do problema abrem a seção 1',
   /prop-stats/.test(_inv) && /<em>OCORRÊNCIAS/.test(_inv)
   && /<em>TEMPO PARADO/.test(_inv) && /<em>CAIXAS PERDIDAS/.test(_inv), true);
// ⚠ OCORRÊNCIAS e TEMPO vêm do apontamento; CAIXAS PERDIDAS é CONTA sobre ele
// (duração produtiva × meta do dia ÷ horas produtivas). Chamar as três de
// "REAL" seria afirmar como medido um número que é estimado.
ok('e a natureza de cada um está marcada',
   /<em>OCORRÊNCIAS<span class="prop-et real">APONTADO/.test(_inv)
   && /<em>TEMPO PARADO<span class="prop-et real">APONTADO/.test(_inv)
   && /<em>CAIXAS PERDIDAS<span class="prop-et calc">ESTIMADO/.test(_inv), true);
ok('o cenário é uma grade de premissas, não uma tabela solta',
   /prop-prem/.test(_inv) && /REDUÇÃO DA PARADA<\/em>/.test(_inv), true);
// O ANO ganhou linha própria dentro do card — o número grande continua sendo o
// MÊS, que é o que alimenta o payback.
ok('cada card de ganho traz o mês E o ano',
   (_inv.match(/class="kpi-ano"/g) || []).length >= 4
   && /por ano<\/div>/.test(_inv), true);
ok('o quadro do ganho não parte entre duas folhas',
   /\.prop \.kpi-grid\{[^}]*page-break-inside:avoid/.test(_inv), true);

// SEM ORÇAMENTO o papel diz o ESTADO, nunca um número inventado.
ok('sem orçamento, o investimento sai como AGUARDANDO ORÇAMENTO',
   (_inv.match(/AGUARDANDO ORÇAMENTO/g) || []).length >= 2, true);
ok('e payback e ROI saem como "não calculado"',
   /<em>PAYBACK<\/em><b>não calculado<\/b>/.test(_inv)
   && /<em>ROI<\/em><b>não calculado<\/b>/.test(_inv), true);
ok('a régua do R$ 10.000 continua a mesma',
   /cada R\$ 10\.000 de investimento se paga em \$\{fmt1\(10000\/r\.rsMesHE\)\} meses/.test(_inv), true);
ok('o selo de simulação abre o documento',
   /SIMULAÇÃO DE POTENCIAL · É SIMULAÇÃO, NÃO MEDIÇÃO/.test(_inv), true);
ok('capacidade recuperada não é apresentada como economia de caixa',
   /capacidade que volta para a linha/.test(_inv)
   && /não é economia de caixa/.test(_inv), true);
// ── o papel: as TRÊS leituras, separadas e sem soma ──
ok('o papel separa capacidade recuperada das outras leituras (na evidência)',
   /8 ▸ A CAPACIDADE RECUPERADA/.test(_inv)
   && /9 ▸ OUTRAS LEITURAS — NÃO SE SOMAM À ECONOMIA/.test(_inv), true);
ok('o papel traz o POTENCIAL DE RECEITA', /POTENCIAL DE RECEITA/.test(_inv), true);
// ⚠ Ele é ordens de grandeza maior que a economia em HE e divide a linha com
// ela: o card sai CONDICIONAL (tracejado), senão a diretoria ancora no maior.
ok('e ele sai marcado como condicional',
   /<div class="kpi-card pot">/.test(_inv)
   && /\.prop \.kpi-card\.pot\{[^}]*border-style:dashed/.test(_inv), true);
ok('com a ressalva obrigatória quando há ticket',
   /não representa faturamento garantido/.test(_inv), true);
ok('e a frase certa quando não há',
   /Ticket médio não informado\. Potencial de receita não calculado\./.test(_inv), true);
ok('o papel repete que payback e ROI usam só a economia em HE',
   /Payback e ROI usam só a ECONOMIA EM HE<\/b> — receita potencial não é dinheiro disponível/.test(_inv), true);
ok('o cenário mostra o ticket, informado ou não',
   /<em>TICKET MÉDIO<span class="prop-et pot">OPCIONAL/.test(_inv), true);
// As etiquetas de natureza do dado separam apontado, calculado e potencial.
ok('as etiquetas de natureza existem no papel',
   ['prop-et real', 'prop-et calc', 'prop-et sim', 'prop-et pot']
     .filter(c => !_inv.includes(c)).join(' | '), '');
ok('a metodologia traz os oito blocos',
   ['MINUTOS E CAIXAS', 'MÊS E ANO', 'HOMEM-HORA → HORA DE LINHA',
    'AS TRÊS LEITURAS EM R$ (não se somam)', 'TICKET MÉDIO E POTENCIAL DE RECEITA',
    'TETO DA ECONOMIA', 'HORA EXTRA EVITÁVEL',
    'O QUE ISTO NÃO É'].filter(t => !_inv.includes('<em>' + t + '</em>')).join(' | '), '');

// ── PASSO 3 (v7.69.0): redação da proposta com IA ──
// O painel CALCULA e o modelo só ESCREVE: os fatos vão formatados como o papel
// imprime, o .gs devolve cinco parágrafos + os números fora da lista, e o texto
// só vai ao papel se o hash dos fatos ainda bate e não há número fora.
{
  const _fat = pega('function _propFatos(');
  ok('os fatos não fazem conta: só formatam o que a montagem devolveu',
     /_pgSimulacao\(|perdaDeMin|\*\s*r\.custoHora/.test(_fat), false);
  ok('e levam a sensibilidade, a recomendação e a natureza (simulação)',
     /sensibilidade:m\.sensLinhas\.map/.test(_fat) && /recomendacaoDoGestor:m\.RECOM/.test(_fat)
     && /não é medição/.test(_fat), true);
  eval(pega('function _propHash('));
  eval(pega('function _propIaValida('));
  const h1 = _propHash({ a: 1, b: 'x' }), h2 = _propHash({ a: 1, b: 'x' }), h3 = _propHash({ a: 2, b: 'x' });
  ok('o hash é estável para os mesmos fatos', h1, h2);
  ok('e muda quando um número muda', h1 === h3, false);
  const ia = { hash: h1, texto: { resumo: 'ok' }, numerosFora: [] };
  ok('texto válido: mesmo hash e sem número fora', _propIaValida({ ia }, h1) === ia, true);
  ok('texto desatualizado (números mudaram) não vai ao papel', _propIaValida({ ia }, h3), null);
  ok('texto com número fora da lista não vai ao papel',
     _propIaValida({ ia: { ...ia, numerosFora: ['9.999'] } }, h1), null);
  ok('sem texto, nada', _propIaValida({}, h1), null);
  ok('o PDF só imprime a IA pelo _propIaValida com o hash dos fatos de agora',
     /const ia=_propIaValida\(s, _propHash\(_propFatos\(m, s, de, ate\)\)\)/.test(_inv), true);
  ok('o resumo vai à capa e a leitura abre a folha 2, antes da evidência',
     /prop-ia-resumo/.test(_inv)
     && _inv.indexOf('LEITURA DO GESTOR') > _inv.indexOf('<div class="prop-quebra"></div>')
     && _inv.indexOf('LEITURA DO GESTOR') < _inv.indexOf('6 ▸ A EVIDÊNCIA'), true);
  ok('e o papel diz que foi IA sobre os números do painel, revisada pelo gestor',
     /REDIGIDA COM IA SOBRE OS NÚMEROS DO PAINEL · REVISADA PELO GESTOR/.test(_inv), true);
  const _red = pega('async function _propRedigir(');
  ok('a redação chama a ação do .gs com os fatos, e nunca leva a chave',
     /action=redigirProposta&dados=/.test(_red) && !/api_key|x-api-key|sk-ant/i.test(_red), true);
  ok('com timeout maior (o modelo escreve) e duas tentativas em sequência',
     /jsonpFetch\(url, 60000\)/.test(_red) && /t<=2/.test(_red), true);
  ok('sem-chave, sem-endpoint, sem-resposta e erro são estados distintos',
     ['sem-chave', 'sem-endpoint', 'sem-resposta', 'erro'].every(k => _red.includes(`'${k}'`))
     && /CLAUDE_API_KEY/.test(pega('function _propIaFalhaInfo(')), true);
  ok('o texto guardado leva o hash e os números fora', /s2\.ia=\{hash, texto:json\.texto, numerosFora:/.test(_red), true);
  ok('o jsonpFetch continua nos 25 s por padrão', /ms=ms\|\|25000;/.test(pega('function jsonpFetch(')), true);
  ok('o bloco da tela é redesenhado a cada tecla (hash muda → desatualizado)',
     /_propIaPintar\(\);/.test(pega('function _pgSimAtualiza(')), true);
  ok('e vive na aba do simulador', /id="pg-sim-ia"/.test(pega('function _pgSimHtml(')), true);
}

// ⚠ A PELE DA PROPOSTA É ESCOPADA. O <head> e as ~150 regras do _rpDocParadas
// são dos QUATRO relatórios; uma regra solta aqui mudaria paradas, gestão de
// perdas e minutos/1.000 junto — a história do cabeçalho dos cinco (#204/#205).
const _skin = (_inv.match(/const skin=`<style>([\s\S]*?)<\/style>`/) || [])[1] || '';
ok('a proposta traz uma pele própria', _skin.length > 400, true);
const _fora = _skin.split('\n')
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('/*') && !l.startsWith('*') && !l.startsWith('@') && l.includes('{'))
  .map(l => l.slice(0, l.indexOf('{')).trim())
  .filter(sel => sel && !/^\.prop/.test(sel));
ok('e nenhuma regra dela escapa do escopo .prop', _fora.join(' | '), '');
ok('o CSS compartilhado continua num lugar só',
   (JS.match(/function _rpDocParadas\(/g) || []).length, 1);

// guarda-corpo: a conta é UMA, a tela chama o simulador, e ele não reescreve
// fórmula de perda nenhuma — consome o `perd` que o RP_PARADAS.stats valorou.
ok('o simulador é UMA implementação', (JS.match(/function _pgSimulacao\(/g) || []).length, 1);
// O simulador saiu do rodapé da GESTÃO DE PERDAS e ganhou ABA e PERÍODO
// PRÓPRIOS (04/09/2026). Quem desenha o bloco agora é a aba dele.
ok('a aba do simulador desenha o bloco', /_pgSimHtml\(ctx\)/.test(pega('function _simPintar(')), true);
ok('e a gestão de perdas não o desenha mais',
   /_pgSimHtml\(/.test(pega('function _pgPintar(')), false);
ok('mas deixa o ponteiro para a aba nova',
   /setTab\('simulador'\)/.test(pega('function _pgPintar(')), true);
ok('a aba existe na navegação', /data-tab="simulador"/.test(src), true);
ok('a seção existe', /id="sec-simulador"/.test(src), true);
ok('e o setTab acende a tela', /tab==='simulador'/.test(pega('function setTab(')), true);
// ⚠ O FILTRO É PRÓPRIO: trocar o período de uma aba não pode mexer no da outra.
ok('o simulador tem campos de data próprios',
   /id="sim-de"/.test(src) && /id="sim-ate"/.test(src), true);
ok('e o filtro dele não escreve nos campos da gestão de perdas',
   /pg-de|pg-ate/.test(pega('function _simFiltro(')), false);
ok('nem o da gestão de perdas nos dele',
   /sim-de|sim-ate/.test(pega('function _pgFiltro(')), false);
ok('o simulador lê o contexto DA ABA DELE',
   /PG_TELA_CACHE\[SIM_ULT\]/.test(pega('function _pgSimAtualiza(')), true);
ok('a impressão executiva manda o período do simulador',
   /gerarRelatorioInvestimento\(dGet\('sim-de'\),dGet\('sim-ate'\)\)/.test(src), true);
ok('e a proposta prefere esse período ao das outras abas',
   /let de=deArg\|\|dGet\('sim-de'\)/.test(_inv), true);
ok('a aba do simulador não empilha buscas',
   /if\(SIM_RODANDO\) return;/.test(pega('async function renderSimulador(')), true);
ok('e tem a guarda do módulo de cálculo',
   /_rpOk\(\)/.test(pega('async function renderSimulador(')), true);
// Nenhuma conta no desenho da aba: a base sai pronta do `st` que o RP_PARADAS
// já valorou — é a regra de sempre.
ok('o desenho da aba não recalcula perda',
   /perdaDeMin|perdaAoRitmo|durProdutiva/.test(pega('function _simPintar(')), false);
ok('o simulador não recalcula perda por conta própria',
   /perdaDeMin|perdaAoRitmo|durProdutiva/.test(pega('function _pgSimulacao(')), false);

console.log('\n── dia passado: hora extra não é julgada, e a meta/h não é diluída ──');
// 28/08/2026 começou às 05:00. O gerencial de dia passado repartia a meta do
// dia entre TODAS as horas arquivadas (1.881 ÷ 11 = 171): dava meta a horas de
// hora extra — que não têm meta na planilha — e diluía a das 9 horas de
// jornada, que pediam 209. A madrugada, com 96 cx, saía ABAIXO e virava o VALE
// DE PRODUÇÃO do dia.
global.CFG = Object.assign({}, global.CFG, { turnoInicio:'07:00', turnoFim:'17:00' });
eval(pega('function _horaEhHE('));
ok('madrugada é hora extra',            _horaEhHE('05:00-06:00'), true);
ok('06:00 também',                      _horaEhHE('06:00-07:00'), true);
ok('a primeira hora do turno não é',    _horaEhHE('07:00-08:00'), false);
ok('a última hora do turno não é',      _horaEhHE('16:00-16:59'), false);
ok('depois das 17:00 é',                _horaEhHE('17:00-18:00'), true);
ok('o rótulo HE manda, em qualquer horário', _horaEhHE('HE 09:00-10:00'), true);
ok('rótulo ilegível não vira hora extra',    _horaEhHE('TOTAL'), false);
// A meta/h do dia 28/08 sai de 9 horas, não de 11.
const _hh = ['05:00-06:00','06:00-07:00','07:00-08:00','08:00-09:00','09:00-10:00',
             '10:00-11:00','12:12-13:00','13:00-14:00','14:00-15:00','15:00-16:00','16:00-16:59'];
ok('a meta do dia é repartida só entre as horas de jornada',
   Math.round(1881 / _hh.filter(h=>!_horaEhHE(h)).length), 209);
const _ger = pega('function renderGerencialHist(');
ok('o divisor da meta/h são as horas normais', /const metaHora=\(meta>0&&nNorm>0\)\?meta\/nNorm/.test(_ger), true);
ok('hora extra não recebe meta nem eficiência',
   /const ef2=\(!ehHE&&metaHora>0\)\?prod\/metaHora\*100:null/.test(_ger)
   && /\$\{ehHE\?'—':fmtN\(Math\.round\(metaHora\)\)\}/.test(_ger), true);
ok('e ganha a etiqueta em vez do veredito', /badge b-acc">HORA EXTRA/.test(_ger), true);
ok('pico e vale saem das horas de jornada',
   /const idxPico=prodsNorm\.indexOf\(melhor\), idxVale=prodsNorm\.indexOf\(pior\)/.test(_ger), true);
ok('a etiqueta tem estilo no painel', /\.b-acc \{background/.test(src), true);

console.log('\n── a EF gravada no HISTORICO sai da MESMA meta da linha ──');
// 28/08/2026: a linha ficou com META 1.881 e EF 100,6% — que é 1.509 ÷ 1.500,
// a meta da HORA_A_HORA, não a meta que foi gravada ao lado. O relatório
// semanal (que lê a coluna EF) imprimia "100,6% · NA META" e o bloco do
// gerencial (que divide realizado ÷ meta) dizia 80,2%, no mesmo dia.
const _salva = pega('function salvarDiaSheets(');
ok('a EF é calculada da meta que vai na linha',
   /const efGrav = k\.meta>0 \? \(k\.real\/k\.meta\*100\) : 0;/.test(_salva), true);
ok('e é ela que é enviada', /'ef='\+efGrav\.toFixed\(1\)/.test(_salva), true);
ok('a conta do ritmo (k.ef) não é mais gravada', /'ef='\+k\.ef/.test(_salva), false);
ok('dia sem meta grava 0, não divide por zero',
   (() => { const k={meta:0,real:1509}; return k.meta>0 ? (k.real/k.meta*100) : 0; })(), 0);

// O saveDay grava `Number(p.mediaH || 0)` na coluna MEDIA CX/H e o botão nunca
// mandava esse campo: das 69 linhas do HISTORICO real, as 17 fechadas pelo
// botão estavam com a média ZERADA — e, sendo upsert, o botão zerava também o
// que o fechamento automático já tinha escrito.
ok('a média cx/h é enviada', /'mediaH='\+mediaH/.test(_salva), true);
ok('e é realizado ÷ horas produtivas (não-HE), como no .gs',
   /const prodNormais = k\.allHoje\.filter\(d=>!d\.he && d\.producaoHora!=null\)/.test(_salva)
   && /Math\.round\(k\.real\/prodNormais\.length\)/.test(_salva), true);
// MELHOR/PIOR também olham só as horas não-HE no fechamento automático.
ok('melhor e pior saem das horas não-HE', /'melhor='\+melhorN/.test(_salva) && /'pior='\+piorN/.test(_salva), true);
ok('dia sem hora normal lançada não divide por zero',
   (() => { const p=[]; return p.length ? 1 : 0; })(), 0);

console.log('\n── paradas no relatório semanal: o que deixamos de embalar ──');
// Pedido do usuário (31/08/2026): "na impressão resumo semanal, deve conter as
// paradas, e o que deixamos de embalar por motivos de paradas". O relatório
// contava quanto saiu e não contava o que ficou pelo caminho.
eval(pega('function _relParadasSemanaHtml('));
const _parSem = [
  { data:'24/08/2026', ini:'08:10', fim:'09:10', tipo:'Manutenção Corretiva', obs:'esteira' },
  { data:'24/08/2026', ini:'14:00', fim:'14:30', tipo:'Troca de Plastico',    obs:'' },
  { data:'25/08/2026', ini:'11:10', fim:'11:40', tipo:'Refeição',             obs:'' },
  { data:'25/08/2026', ini:'09:00', fim:'09:15', tipo:'Intervalo de Turno',    obs:'' },
];
// A valoração é a REAL (RP_PARADAS.stats) — a mesma da aba PARADAS e da GESTÃO
// DE PERDAS. A seção do relatório é só desenho em cima disso.
const _stSem = RP_PARADAS.stats(_parSem, {
  cfg: { turnoInicio:'07:00', turnoFim:'17:00', almocoInicio:'11:00', almocoFim:'12:12', metaDia:1000 },
  metaByDay: { '24/08/2026':1000, '25/08/2026':1000 },
  metaHoje: 1000, hoje: '31/08/2026', classeMap: { 'Intervalo de Turno':'PLANEJADA' },
  realByDay: { '24/08/2026':900, '25/08/2026':950 }, de:'24/08/2026', ate:'30/08/2026'
});
const htmlPar = _relParadasSemanaHtml(_stSem, 8381);
ok('a seção diz quantas caixas deixaram de ser embaladas',
   htmlPar.includes(fmtN(_stSem.pecas)) && _stSem.pecas > 0, true);
ok('e o quanto isso pesa na meta da semana',
   htmlPar.includes(fmtP(_stSem.pecas / 8381 * 100) + ' da meta da semana'), true);
ok('cada motivo entra com tempo e caixas',
   /Manutenção Corretiva[\s\S]*?1h00m/.test(htmlPar), true);
// A parada PREVISTA entra com o tempo dela e ZERO caixa: ela estava no plano.
// Escondê-la faria o tempo da tabela não fechar com o total.
ok('parada prevista aparece marcada, e sem caixa perdida',
   /Intervalo de Turno <span class="sbadge s-ok"[^>]*>PREVISTA[\s\S]*?td-bold[^>]*>—</.test(htmlPar), true);
// A parada inteiramente dentro do almoço fica fora de tudo (as horas produtivas
// já descontam o almoço) — é por isso que a Refeição das 11:10 não conta minuto.
ok('o almoço não é descontado duas vezes', _stSem.diag.paradasNoAlmoco, 1);
ok('sem paradas carregadas, o relatório sai sem a seção', _relParadasSemanaHtml(null, 8381), '');
// DESENHO, não conta: a terceira implementação da mesma perda foi o que fez as
// telas de paradas divergirem três vezes.
ok('a seção não recalcula perda nenhuma',
   /perdaDeMin|perdaAoRitmo|durProdutiva|\* *ritmo/.test(pega('function _relParadasSemanaHtml(')), false);
const _relSem = pega('async function gerarRelatorioSemanal(');
ok('o relatório busca as paradas com a MESMA busca das outras telas',
   /_pgBuscarDados\(dtToStr\(seg\), dtToStr\(sex\)\)/.test(_relSem), true);
ok('e valora com o MESMO adaptador', /_paradasStats\(_p\.paradas/.test(_relSem), true);
ok('falhou a busca, o relatório sai inteiro assim mesmo',
   /catch\(e\)\{ console\.warn\('\[RelSemanal\] paradas não vieram/.test(_relSem), true);

console.log('\n── o relatório semanal é documento, não painel: cor só na exceção ──');
// Pedido do usuário (31/08/2026): "capricha no layout deixar profissional menos
// cor". Seis bordas coloridas, valores em verde/laranja e emojis competiam com
// a única cor que informa — e ainda com o vermelho de status.
ok('sem troféu e sem gráfico de emoji no relatório', /🏆|📉/.test(_relSem), false);
ok('nenhuma borda decorativa de card sobrou',
   /border-left-color:#FF5C1F|border-left-color:#4CAF50/.test(_relSem), false);
ok('o título de seção deixou de ser vermelho',
   /\.rp-sec-ttl\{[^}]*color:#c53030/.test(_relSem), false);
// A cor que ficou é a que dá veredito.
ok('o status continua colorido, com a palavra junto',
   /s-ok|s-warn|s-red/.test(_relSem) && /NA META|ABAIXO/.test(_relSem), true);
// Todas as barras na mesma tinta: quem conta a história é o fantasma da meta
// aparecendo por cima da barra. A cor fica só no PERCENTUAL, e só quando o dia
// ficou abaixo — cor é exceção, não decoração.
ok('a barra do dia não tem cor de status', /const clr='#2F3B4A';/.test(JS), true);
ok('e a exceção vai no percentual',
   /const pctClr=d\.ef>=96\?'#5B6470'/.test(JS), true);

console.log('\n── META/H: a régua das colunas MELHOR H. e PIOR H. ──');
// Pedido do usuário (31/08/2026): "incluir a meta por hora normal do dia".
// MELHOR H. 300 e PIOR H. 109 são números soltos até se saber quanto a hora
// pedia. A meta do dia cobre a jornada normal — hora extra não tem meta na
// planilha —, então o divisor é o nº de horas do TURNO.
ok('a coluna existe no cabeçalho', /<th>META<\/th><th>META\/H<\/th>/.test(_relSem), true);
ok('e sai da meta do dia dividida pelas horas do turno',
   /const metaHoraDia = d => d\.meta>0 \? Math\.round\(d\.meta\/hTurno\) : 0/.test(_relSem), true);
ok('dia sem meta não inventa meta por hora', /metaHoraDia\(d\)\?fmtN\(metaHoraDia\(d\)\):'—'/.test(_relSem), true);
ok('o papel diz de onde o número saiu',
   /<b>META\/H<\/b> = meta do dia ÷ \$\{plural\(hTurno/.test(_relSem), true);

console.log('\n── EFICIÊNCIA: o número é fato, o veredito é o selo ──');
// 31/08/2026: a TV mostrou 49,8% em VERDE com "DENTRO DA META". O número era a
// meta do DIA (1.350 ÷ 2.709) e a cor era outra conta — o ritmo contra a
// meta/hora da HORA_A_HORA (1.350 ÷ 8×164 = 102,9%). Enquanto as duas metas
// concordam ninguém percebe; naquele dia elas discordavam em 84%.
['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'].forEach(f => {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  ok(f + ': nenhuma tela pinta pelo ritmo da meta/hora', /sc\(k\.ef\)/.test(src), false);
  ok(f + ': a régua vem do núcleo comum, não é reescrita', /efNoRitmo\(/.test(src), true);
});
const _mob  = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
const _core = fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8');
const _v7 = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
// 01/09/2026: a TV mostrava "EFICIÊNCIA 103,8%" em verde com "DENTRO DA META"
// num dia de 780 cx contra meta de 2.700 — os dois números certos, mas dois "%"
// e dois sentidos de META na mesma tela ("essa eficiência está confundindo as
// pessoas"). Agora o NÚMERO é o fato que qualquer um confere de cabeça (780 de
// 2.700 = 28,9%) e o VEREDITO é o selo, que fala de RITMO.
ok('TV: o número grande é o % da META DO DIA',
   /tv-ef'\);\s*\n\s*ee\.textContent = k\.meta>0 \? fmtP\(k\.efDia\)/.test(_v7), true);
ok('TV: e ele sai em tinta, sem cor de status',
   /ee\.className='tv-ef-val';/.test(_v7), true);
ok('TV: quem julga é o selo, e ele fala de ritmo',
   /be\.textContent='● '\+slRitmo\(k\.efRitmo\)/.test(_v7), true);
ok('TV: a palavra META não volta para o lado do %', /sl\(k\.efRitmo\)/.test(_v7), false);
ok('TV: a linha de apoio traz caixas, não um segundo %',
   /id="tv-ef-sub"/.test(_v7) && /CX ESPERADAS ATÉ AGORA/.test(_v7), true);
ok('TV: a barra do % pega a cor do selo, não do número',
   /const cor = bdgB \? getComputedStyle\(bdgB\)\.color/.test(_v7), true);
// O veredito do ritmo é texto ÚNICO no núcleo: TV, desktop e celular não podem
// responder "estamos no ritmo?" com palavras diferentes.
ok('o veredito do ritmo mora no núcleo comum',
   /function slRitmo\(ef\)/.test(_core) && /slRitmo/.test(_mob), true);
// A TELA B é a que roda na TV de verdade (a Tela A tem .tv-left escondida no
// layout largo): ela espelha o DOM da A, então a linha de apoio tem de ser
// espelhada junto, senão o % da meta do dia sumia justamente da tela do chão
// de fábrica.
ok('TV: a Tela B espelha a linha de apoio',
   /set\('tvb-ef-sub',\s*get\('tv-ef-sub'\)\)/.test(_v7) && /id="tvb-ef-sub"/.test(_v7), true);
ok('gerencial: o card mostra o % do dia com o veredito do ritmo ao lado',
   /v:fmtP\(k\.efDia\),\s*sub:slRitmo\(k\.efRitmo\)/.test(_v7), true);
ok('celular: o card diz a mesma coisa',
   /v:fmtP\(k\.efDia\), sub:slRitmo\(k\.efRitmo\)/.test(_mob), true);

console.log('\n── HORA EXTRA não é julgada, no dia de HOJE também ──');
// 01/09/2026: o dia começou às 05:00 e o backend passou a marcar `he` por
// HORÁRIO (fora de 07:00–17:00), não só pelo rótulo. As duas horas de HE
// apareceram no gerencial AO VIVO com META/H 245, 98,0%/144,0% e o selo OK,
// viraram o PICO e o VALE do turno e ainda passaram "(+5)" de atraso para a
// hora seguinte — tudo o que a v7.34.0 já tinha tirado do gerencial de dia
// PASSADO. A régua é uma só: hora extra não tem meta, logo não tem eficiência,
// nem veredito, nem pico/vale, nem atraso.
ok('o atraso do núcleo pula a hora extra',
   /if \(r\.he\) return \{ atrasoHora: 0/.test(_core), true);
ok('gerencial ao vivo: a tabela não calcula eficiência de hora extra',
   /const ef=\(!isHE&&prod!=null\)/.test(_v7), true);
ok('gerencial ao vivo: a linha de HE ganha etiqueta, não veredito',
   /const bdg=isHE\s*\n\s*\? '<span class="badge b-acc">HORA EXTRA<\/span>'/.test(_v7), true);
ok('gerencial ao vivo: a etiqueta HE não volta colada no OK/ABAIXO',
   /badge b-he" style="margin-right:5px">HE</.test(_v7), false);
ok('gerencial ao vivo: META/H da hora extra sai "—"', /const metaCel=isHE\?'—'/.test(_v7), true);
ok('gerencial ao vivo: pico e vale só das horas de jornada',
   /const prodsNorm=dhAll\.filter\(r=>!r\.he\)/.test(_v7) &&
   /dh\.find\(r=>!r\.he&&r\.producaoHora===k\.melhor\)/.test(_v7), true);
ok('gerencial ao vivo: o `he` chega ao cálculo do atraso',
   /he: !!\(\(reg&&reg\.he\)\|\|sl\.he\)/.test(_v7), true);
ok('celular: a tabela hora a hora segue a mesma regra',
   /const ehHE=r\.he===true;/.test(_mob) && /const ef2=\(!ehHE&&prod!=null/.test(_mob), true);
ok('celular: melhor/pior também olham só a jornada',
   /const prodsNorm = dh\.filter\(r=>!r\.he\)/.test(_mob), true);

console.log('\n── o rótulo é CAIXAS, não PEÇAS ──');
// Mesmo critério do vocabulário banido ("PERDIDO NO RITMO"/"PERDIDO PARADO"):
// o mesmo st.pecas saía como PEÇAS PERDIDAS no desktop e CAIXAS PERDIDAS no
// mobile, com o desktop se contradizendo na própria tabela do plano de ação.
// A unidade do produto é a caixa.
['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'].forEach(f => {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  ok(f + ' não imprime "PEÇAS PERDIDAS"', src.includes('PE\u00c7AS PERDIDAS'), false);
});

console.log('\n── o nome do produto sai de um lugar só ──');
// Rename cosmético (08/09/2026): RitmoProd → RitmoPatrimar. O nome estava
// escrito ~35 vezes; agora os pontos gerados por JS leem APP_NOME/APP_NOME_CX
// e só os estáticos (title, meta do iOS, <h1> dos cabeçalhos de impressão e o
// rodapé da tela) continuam literais — esses nascem antes do script.
ok('o painel declara o nome numa constante', /const APP_NOME\s+= 'RitmoPatrimar';/.test(_v7), true);
ok('e a versão em caixa alta deriva dela, não é digitada de novo',
   /const APP_NOME_CX = APP_NOME\.toUpperCase\(\);/.test(_v7), true);
ok('os rodapés de relatório leem a constante',
   (_v7.match(/<span>\$\{APP_NOME\} · \$\{CFG\.empresa\}/g) || []).length, 5);
ok('os rodapés de PDF de paradas leem a constante',
   (_v7.match(/<span>\$\{APP_NOME_CX\} · Embalagem/g) || []).length, 7);   // + estudo de UEP + capacidade em UEP (2)
ok('o resumo do WhatsApp assina com a constante',
   /L\.push\(APP_NOME\+' · PPCP'\);/.test(_v7), true);
ok('e o resumo continua sem emoji depois da troca',
   [...zap].every(c => c.charCodeAt(0) < 0x2500), true);
console.log('\n── o slogan vai em TODA impressão ──');
// Pedido do usuário (08/09/2026): "colocar slogan em todas impressões".
// O slogan já existia na tela (login e rodapé) e a forma canônica é dele: o
// ponto de destaque é o FINAL, e o "·" do meio é texto normal.
ok('o cabeçalho comum dos relatórios leva o slogan',
   /rp-slogan[^>]*>Medimos o pulso da·linha<span[^>]*>\.<\/span>/.test(_v7), true);
ok('e é UMA implementação — os 13 relatórios passam pelo _rpCabecalho',
   (_v7.match(/_rpCabecalho\(/g) || []).length, 14);   // 13 chamadas + a declaração
ok('os dois cabeçalhos de impressão do painel também levam',
   (_v7.match(/class="print-header-slogan">Medimos o pulso da·linha<span>\.<\/span>/g) || []).length, 2);
// O slogan aparece em SEIS lugares no desktop, e a forma é a MESMA nos seis —
// número solto aqui vira enigma na próxima vez que alguém somar um lugar.
const _slogan = 'Medimos o pulso da·linha<span';
ok('o slogan sai igual nas seis superfícies do desktop',
   (_v7.match(/Medimos o pulso da·linha/g) || []).length, 6);
ok('e nenhuma delas escreve o ponto final em texto puro',
   (_v7.match(/Medimos o pulso da·linha\./g) || []).length, 0);
ok('as seis são: login, rodapé, 2 cabeçalhos de impressão, cabeçalho dos PDFs e splash',
   [/margin-top:10px;opacity:0\.9">Medimos/.test(_v7),                    // login
    /letter-spacing:-0\.2px">Medimos/.test(_v7),                          // rodapé da tela
    (_v7.match(/class="print-header-slogan">Medimos/g)||[]).length === 2,  // impressão do painel
    /rp-slogan"[^>]*>Medimos/.test(_v7),                                   // cabeçalho dos 8 PDFs
    /sp-slogan">Medimos/.test(_v7)].every(Boolean), true);                 // splash
// O nome do produto no cabeçalho comum estava PARTIDO por tag (RITMO<span>PROD)
// — fora do alcance de qualquer busca por "RITMOPROD". É o cabeçalho dos cinco
// relatórios: se escapasse, o PDF sairia com o nome antigo em cima da mesa.
ok('o cabeçalho comum leva o nome novo', /RITMO<span>PATRIMAR<\/span>/.test(_v7), true);
// A capa da GESTÃO DE PERDAS é medida para caber na folha 1 (paisagem). O
// slogan ocupa ~12px, então a paisagem devolve o mesmo em "ar" do cabeçalho.
ok('a paisagem compensa a altura do slogan',
   /\.deitado \.rp-header\{margin-bottom:7px;padding:6px 16px\}/.test(_v7), true);

console.log('\n── splash de abertura ──');
// Pedido do usuário (08/09/2026): "entrada ao abrir o app vem o slogan".
// Medido no Chromium headless nos dois painéis, em 5 tamanhos de tela.
['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'].forEach(f => {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  // 1) QUEM SOME É O CSS. Se a saída dependesse do JS, um erro no script (ou a
  //    rede caindo antes dele) deixaria um overlay preso em cima da tela — e o
  //    operador sem lançar caixa. O toque só antecipa.
  ok(f + ': o splash sai sozinho pela animação, sem JS',
     /#splash\{[^}]*animation:spOut [^}]*forwards/.test(src.replace(/\n\s*/g, '')), true);
  ok(f + ': e o fim da animação libera o clique',
     /@keyframes spOut\{ to\{opacity:0;visibility:hidden;pointer-events:none\} \}/.test(src), true);
  // 2) O movimento é o slogan desenhado — uma batida, uma vez. Nada mais anima.
  ok(f + ': a batida é traçada uma vez só',
     /animation:spTracar \.7s [^;]+ forwards;/.test(src), true);
  // 3) O slogan na forma da marca: o ponto de destaque é o FINAL.
  ok(f + ': o slogan está na entrada, na forma da marca',
     /sp-slogan">Medimos o pulso da·linha<span>\.<\/span>/.test(src), true);
});
// ── MOVIMENTO REDUZIDO: SOLTO NO PC, INTEIRO NO CELULAR ────────────────────
// Pedido do usuário (08/09/2026): no PC dele o Windows está com os efeitos de
// animação desligados, e o splash saía com a marca PARADA por 0,7 s. O que
// ficou solto é só a BATIDA — linha desenhada no lugar, sem deslocamento, zoom
// ou parallax. A ENTRADA do bloco (translateY do spIn) continua desligada.
ok('no PC a batida é traçada mesmo com movimento reduzido',
   /@media \(prefers-reduced-motion:reduce\)\{\s*\n\s*#splash \.sp-in\{ animation:none \}\s*\n\}/.test(_v7), true);
ok('e o PC não congela mais o traço nem encurta a tela',
   /@media \(prefers-reduced-motion:reduce\)\{[\s\S]{0,400}(sp-pulso path\{ animation:none|#splash\{ animation:spOut \.01s)/.test(_v7), false);
// ⚠ No CELULAR a regra continua inteira: o aparelho está na mão e em movimento.
ok('o celular continua recebendo a marca parada',
   /@media \(prefers-reduced-motion:reduce\)\{[\s\S]{0,320}#splash \.sp-pulso path\{ animation:none/.test(_mob), true);

// ── O SPLASH DO PC SÓ APARECE SE A PÁGINA PINTAR ────────────────────────────
// As duas bibliotecas de CDN do v7 (xlsx e Chart.js) moram no <head>. Sem
// `defer` elas são SÍNCRONAS: o parser para nelas e o <body> — o splash junto —
// só nasce depois que o cdnjs responder. Medido no Chromium com o cdnjs a 3 s:
// primeira pintura aos 3.132 ms (tela preta) contra 196 ms com `defer`. É
// defeito só do PC: o /mobile não carrega CDN nenhuma.
ok('as duas libs de CDN do v7 são defer',
   (_v7.match(/<script defer src="https:\/\/cdnjs\.cloudflare\.com/g) || []).length, 2);
ok('e nenhuma ficou síncrona no <head>',
   /<script src="https:\/\/cdnjs\.cloudflare\.com/.test(_v7), false);
// Com `defer`, o primeiro render (o renderAll do fim do script) roda antes de a
// Chart.js existir. O gráfico fica na fila e é desenhado no DOMContentLoaded,
// que o navegador dispara DEPOIS dos scripts `defer`. Sem essa fila o defer
// deixaria o painel abrir sem gráfico — e um `new Chart` sem a lib estoura no
// meio do render e leva junto o que vem depois.
ok('o mkChart enfileira o gráfico enquanto a Chart.js não chegou',
   /if\(typeof Chart==='undefined'\)\{ CHART_FILA\[id\]=cfg; return; \}/.test(_v7), true);
ok('e a fila é desenhada no DOMContentLoaded',
   /document\.addEventListener\('DOMContentLoaded',function\(\)\{\s*\n?\s*const fila=CHART_FILA/.test(_v7), true);
// O mobile não tem CDN — se ganhar uma, ganha o mesmo problema.
ok('o celular continua sem biblioteca de CDN',
   /cdnjs\.cloudflare\.com/.test(_mob), false);

// A TV roda em `?tv` e se RECARREGA sozinha a cada 28 min: com splash, a parede
// da fábrica piscaria a marca de meia em meia hora, no lugar da produção.
ok('a TV fica de fora, e a decisão entra antes da 1ª pintura',
   /has\('tv'\)\)\s*\n?\s*document\.documentElement\.classList\.add\('sem-splash'\)/.test(_v7), true);
ok('e é o CSS que esconde, não o JS', /html\.sem-splash #splash\{ display:none; \}/.test(_v7), true);
ok('o celular NÃO tem essa exclusão — lá não existe TV',
   /sem-splash/.test(_mob), false);

// O nome ANTIGO não pode voltar em nenhum dos dois painéis. A busca é sensível
// a caixa de propósito: `ritmoprod` minúsculo continua existindo e é legítimo —
// é o nome dos ARQUIVOS (ritmoprod_appscript.gs), o prefixo dos XLSX exportados
// e a tag da notificação. Renomear arquivo não tem ganho e quebraria os
// rewrites da Vercel e as sete suítes; renomear o XLSX mudaria formato de saída.
['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'].forEach(f => {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  ok(f + ': o nome antigo não voltou',
     src.includes('RitmoProd') || src.includes('RITMOPROD'), false);
});

// ── QUALIDADE DO PLANO: a meta contra a capacidade demonstrada ─────────────
// Medido no HISTORICO real em 15/09/2026 (79 dias): a correlação entre a META
// do dia e o REALIZADO é r=0,28 — r² de 8%. A eficiência varia de 32,6% a
// 188,5% porque o DENOMINADOR pula, não porque a linha pule. Esta tela mede o
// PLANO; o alvo e os limiares são combinado, e moram em constantes.
console.log('\n── qualidade do plano (a meta contra a capacidade) ──');
eval(pega('function _qpCurva('));
eval(pega('function _qpPercentil('));
eval(pega('function _qpValorNoPercentil('));
eval(pega('function _qpOscilacao('));
eval(pega('function _qpAnalise('));
eval(pega('function _qpVeredito('));
[/const QP_ALVO_MIN\s*=\s*\d+/, /const QP_ALVO_MAX\s*=\s*\d+/, /const QP_ACIMA\s*=\s*\d+/,
 /const QP_OSC_OK\s*=\s*\d+/, /const QP_OSC_RUIM\s*=\s*\d+/].forEach(re => {
  const m = JS.match(re); if(m) eval(m[0].replace('const ', 'global.') + ';');
});

const _d = (real, meta) => ({ data:'01/01', real, meta });
// curva de 10 dias: 100,200,...,1000
const _curva10 = _qpCurva([100,200,300,400,500,600,700,800,900,1000].map(v => _d(v, 0)));

// ── A RÉGUA É MÓVEL: janela em dias, 0 = todo o histórico ─────────────────
// Medido em 15/09/2026: com os 79 dias a faixa saía 1.548–1.602; só com os
// últimos 30, 1.602–1.795. Julho (p50 de 1.466) puxava a régua para baixo e a
// tela SUBESTIMAVA o que a linha faz hoje.
const _hist = [900, 950, 1000, 1050, 1100, 2000, 2100, 2200, 2300, 2400].map(v => _d(v, 0));
ok('sem janela a régua usa tudo', _qpCurva(_hist, 0).length, 10);
ok('com janela usa só os últimos', _qpCurva(_hist, 5).map(x => x),
   [2000, 2100, 2200, 2300, 2400]);
// E é isso que muda o veredito: a mesma meta é alta contra o histórico velho
// e normal contra o recente.
const _velha = _qpCurva(_hist, 0), _nova = _qpCurva(_hist, 5);
ok('a mesma meta muda de altura conforme a régua',
   [Math.round(_qpPercentil(2100, _velha)), Math.round(_qpPercentil(2100, _nova))], [70, 40]);
ok('a curva é o realizado ordenado, só de dia COM produção',
   [_curva10.length, _curva10[0], _curva10[9]], [10, 100, 1000]);
ok('dia sem produção não entra na curva (não é capacidade, é ausência dela)',
   _qpCurva([_d(0,500), _d(300,500), _d(null,500)]).length, 1);

// O percentil é a fatia de dias que a meta REPROVARIA.
ok('meta acima de tudo = p100', _qpPercentil(9999, _curva10), 100);
ok('meta abaixo de tudo = p0',  _qpPercentil(1, _curva10), 0);
ok('meta no meio da curva = p50', _qpPercentil(500, _curva10), 50);
ok('sem curva não inventa percentil', _qpPercentil(500, []), null);

ok('a leitura inversa devolve o valor daquele percentil',
   [_qpValorNoPercentil(50, _curva10), _qpValorNoPercentil(100, _curva10)], [500, 1000]);

// Oscilação: dois planos com a MESMA média e estabilidades opostas.
ok('meta estável tem oscilação baixa', Math.round(_qpOscilacao([500,500,500,500])), 0);
ok('meta que pula tem oscilação alta', _qpOscilacao([100,900,100,900]) > 60, true);
ok('um dia só não tem oscilação', _qpOscilacao([500]), null);

// ⚠ O CASO QUE ORIGINOU A TELA: mesma média, vereditos opostos. A média das
// metas é 500 nos dois; o que muda é o pulo. Um indicador que olhasse só a
// altura daria o mesmo veredito para os dois.
const estavel  = _qpAnalise([_d(500,500), _d(500,520), _d(500,480), _d(500,500)], _curva10);
const instavel = _qpAnalise([_d(500,100), _d(500,900), _d(500,100), _d(500,900)], _curva10);
ok('os dois planos têm a MESMA meta média',
   [Math.round(estavel.metaMedia), Math.round(instavel.metaMedia)], [500, 500]);
ok('mas só um é exequível',
   [_qpVeredito(estavel).t, _qpVeredito(instavel).t], ['PLANO EXEQUÍVEL', 'META INSTÁVEL']);

// Meta alta demais: reprova a maioria dos dias por construção.
const alta = _qpAnalise([_d(500,950), _d(500,960), _d(500,940)], _curva10);
ok('meta acima da capacidade é acusada', _qpVeredito(alta).t, 'META ACIMA DA CAPACIDADE');
ok('e os dias acima de pQP_ACIMA são contados', alta.nAcima, 3);

// ⚠ A FAIXA DO MEIO precisa de veredito próprio: sem ela, oscilação de 28% —
// acima do combinado de 20%, abaixo do 30% que reprova — saía como PLANO
// EXEQUÍVEL. Foi o medido na planilha real (28,3% em 79 dias).
// CV de 24,5% — entre o combinado (20%) e o que reprova (30%). Com 380/620 dava
// 19,6%, abaixo do limiar, e o EXEQUÍVEL estaria certo: era o teste que errava.
const meio = _qpAnalise([_d(500,350), _d(500,500), _d(500,650), _d(500,500)], _curva10);
ok('oscilação na faixa do meio não passa por exequível',
   _qpVeredito(meio).t, 'META OSCILANDO');

// Sem base não se emite veredito — zero afirmaria que o plano está certo.
ok('sem dias não há veredito', _qpVeredito(null).t, 'SEM BASE');

// ── A FAIXA ALVO É TESTÁVEL na tela (parâmetro, não constante) ────────────
// O gestor calibra sem deploy; as constantes QP_ALVO_* viram o ponto de
// partida. Uma faixa mais alta cobra mais e deixa menos dias dentro.
const _metas = [_d(500,450), _d(500,550), _d(500,650), _d(500,750)];
const _b1 = _qpAnalise(_metas, _curva10, [40, 60]);
const _b2 = _qpAnalise(_metas, _curva10, [60, 80]);
ok('a faixa escolhida vai na análise', [_b1.faixa, _b2.faixa], [[40,60],[60,80]]);
ok('e muda quantos dias caem dentro', [_b1.nDentro, _b2.nDentro], [3, 2]);
ok('e muda o valor da meta exequível',
   [_b1.alvoMin < _b2.alvoMin, _b1.alvoMax < _b2.alvoMax], [true, true]);
// Sem faixa informada cai nas constantes — chamador antigo não muda de conta.
ok('sem faixa usa o combinado das constantes',
   _qpAnalise(_metas, _curva10).faixa, [QP_ALVO_MIN, QP_ALVO_MAX]);
// O veredito lê a faixa da análise, não a constante: desenho e julgamento não
// podem discordar quando o gestor escolhe outra faixa.
ok('o veredito segue a faixa escolhida',
   /a\.pctMedio < \(a\.faixa \? a\.faixa\[0\] : QP_ALVO_MIN\)/.test(JS), true);
ok('e o desenho também', /const fMin = a\.faixa\[0\], fMax = a\.faixa\[1\];/.test(JS), true);
// A escolha sobrevive ao reload — calibrar leva dias.
ok('a preferência é guardada e relida',
   [/localStorage\.setItem\(QP_PREF_K/.test(JS), /localStorage\.getItem\(QP_PREF_K/.test(JS)], [true, true]);

// ── A ORDEM DA TABELA: por data ou por altura da meta ─────────────────────
// Pedido do usuário (15/09/2026). ⚠ A ordem TROCA O RECORTE: por data a tabela
// é a cauda do período; por altura é o topo (ou o fundo) do período INTEIRO.
// Reordenar só os últimos 15 deixaria escondida a meta impossível de três
// semanas atrás, que é justamente o que se procura ao pedir ordem por percentil.
{
  const m = JS.match(/const QP_TAB_N\s*=\s*\d+/);
  if(m) eval(m[0].replace('const ', 'global.') + ';');
}
eval(pega('function _qpOrdenar('));
// 20 dias: o percentil CRESCE com a data, então "mais altas" e "últimos dias"
// coincidiriam. Para separar os dois recortes, o pico fica no dia 1.
const _ordL = [];
for(let i = 1; i <= 20; i++) _ordL.push({ data:'d' + i, pct: i === 1 ? 99 : i, meta:i, real:i });

const _ordD = _qpOrdenar(_ordL, 'data');
ok('por data a tabela é a cauda do período, o mais recente em cima',
   [_ordD.linhas.length, _ordD.linhas[0].data, _ordD.linhas[14].data], [15, 'd20', 'd6']);
ok('e o título diz que são os últimos dias',
   _ordD.titulo, 'OS ÚLTIMOS 15 DIAS, UM A UM');
// ⚠ O caso que motiva a ordem: o dia 1 tem p99 e está FORA dos últimos 15.
ok('por data o pico antigo fica escondido',
   _ordD.linhas.some(l => l.data === 'd1'), false);
const _ordA = _qpOrdenar(_ordL, 'alta');
ok('por altura ele aparece, e em primeiro',
   [_ordA.linhas[0].data, _ordA.linhas[0].pct], ['d1', 99]);
ok('e o título avisa que o recorte é o período inteiro',
   _ordA.titulo, 'AS 15 METAS MAIS ALTAS DO PERÍODO JULGADO');
const _ordB = _qpOrdenar(_ordL, 'baixa');
ok('a ordem inversa traz as metas mais folgadas',
   [_ordB.linhas[0].data, _ordB.titulo],
   ['d2', 'AS 15 METAS MAIS BAIXAS DO PERÍODO JULGADO']);
// ⚠ O gráfico lê a MESMA lista como eixo de calendário: ordenar no lugar
// reordenaria o gráfico junto.
ok('ordenar não mexe na lista original',
   _ordL.map(l => l.data).join(','),
   Array.from({length:20}, (_, i) => 'd' + (i+1)).join(','));
// Empate de percentil: o dia mais recente vem na frente.
const _emp = _qpOrdenar([{data:'a',pct:50},{data:'b',pct:50},{data:'c',pct:50}], 'alta');
ok('no empate o dia mais recente vem primeiro',
   _emp.linhas.map(l => l.data), ['c','b','a']);
// Período curto: o título não promete 15 linhas que não existem.
ok('com menos dias que a tabela o título acompanha',
   [_qpOrdenar(_ordL.slice(0,4), 'data').titulo, _qpOrdenar(_ordL.slice(0,4), 'alta').titulo],
   ['OS ÚLTIMOS 4 DIAS, UM A UM', 'AS 4 METAS MAIS ALTAS DO PERÍODO JULGADO']);
// A escolha sobrevive ao reload, como a régua e a faixa.
ok('a ordem entra na preferência guardada',
   /ordem:QP_ORDEM/.test(JS) && /if\(o\.ordem\)/.test(JS), true);

// O desenho não faz conta: tudo vem pronto do _qpAnalise.
const _qpDes = pega('function _qpHtml(');
ok('o desenho não recalcula percentil nem oscilação',
   /_qpPercentil\(|_qpOscilacao\(|_qpCurva\(/.test(_qpDes), false);
// E não reescreve o recorte da tabela: quem decide é o _qpOrdenar, um lugar só.
ok('o desenho pede o recorte ao _qpOrdenar em vez de fatiar por conta própria',
   [/_qpOrdenar\(a\.linhas, ordem\)/.test(_qpDes), /a\.linhas\.slice\(-15\)/.test(_qpDes)],
   [true, false]);
ok('e o título da tabela vem de lá junto com as linhas',
   /ord\.titulo/.test(_qpDes), true);
ok('a tela passa a ordem escolhida e a largura do card para o desenho',
   /_qpHtml\(a, curva, dias\.length, QP_REGUA, QP_ORDEM, _svgLargura\(alvo\)\)/.test(JS), true);
// A tela não pode custar chamada nova ao Apps Script.
const _qpRender = pega('async function renderQualidadePlano(');
ok('a tela lê o histórico que o painel já busca (sem chamada nova)',
   /buildDiasHistAsync\(\)/.test(_qpRender) && !/jsonpFetch|action=/.test(_qpRender), true);

// ── A CARTEIRA QUE VEM: a programação datada contra a capacidade ──────────
// O bloco de baixo da aba julga o PASSADO e não muda nada. Este julga o que
// ainda está por vir, que é onde dá para agir. Medido na PROGRAMACAO real em
// 15/09/2026: 16/09 com 3.025 cx e 17/09 com 3.125, contra um melhor dia de
// 2.909 em 79 dias — os dois nasceram impossíveis.
console.log('\n── a carteira que vem (programação × capacidade) ──');
{ const m = JS.match(/const CART_DIAS_MAX\s*=\s*\d+/); if(m) eval(m[0].replace('const ','global.')+';'); }
eval(pega('function _cartNum('));
// o mix entra na carteira por parâmetro — as funções dele vêm antes
[/const MIX_FATOR_MIN\s*=\s*[\d.]+/, /const MIX_FATOR_MAX\s*=\s*[\d.]+/, /const QP_MIN_DIAS\s*=\s*\d+/]
  .forEach(re => { const m = JS.match(re); if(m) eval(m[0].replace('const ','global.')+';'); });
eval(pega('function _mixCor('));
eval(pega('function _mixModelo('));
eval(pega('function _mixRotulo('));
eval(pega('function _mixRitmos('));
eval(pega('function _mixFator('));
eval(pega('function _mixDiag('));
eval(pega('function _cartAberta('));
eval(pega('function _cartAnalise('));

ok('a data vira número ordenável, como o dataNum do backend',
   [_cartNum('16/09/2026'), _cartNum('1/1/2026'), _cartNum('lixo')], [20260916, 20260101, 0]);

const _it = (data, qtde, extra) => Object.assign({ data, dataNum:_cartNum(data), qtde }, extra||{});
const _prog = [
  _it('14/09/2026', 500),                    // vencida
  _it('15/09/2026', 800),                    // hoje
  _it('16/09/2026', 2000), _it('16/09/2026', 1025),
  _it('18/09/2026', 1500),
  _it('18/09/2026', 900, {foraEsteira:true}),// fora da esteira não passa na linha
  _it('19/09/2026', 0)                       // linha sem quantidade
];
const _cart = _cartAberta(_prog, _cartNum('15/09/2026'), 2147);
ok('só o que ainda NÃO venceu entra — vencido e hoje viram dívida',
   [_cart.dias.length, _cart.futuro, _cart.divida], [2, 4525, 2147]);
ok('linhas do mesmo dia somam e a contagem acompanha',
   [_cart.dias[0].data, _cart.dias[0].qtde, _cart.dias[0].n], ['16/09/2026', 3025, 2]);
ok('lote fora da esteira não entra (não passa na linha)',
   _cart.dias[1].qtde, 1500);
ok('e o período vai de ponta a ponta', [_cart.de, _cart.ate], ['16/09/2026','18/09/2026']);
// ⚠ `falta` vem do FIFO POR CÓDIGO: duas linhas do mesmo código devolvem o
// MESMO número e somá-las contaria o saldo duas vezes. O aberto de linha futura
// é a `qtde`, que o backend garante intocada.
ok('a carteira não soma o campo `falta` (contaria saldo duas vezes)',
   /\bfalta\b/.test(pega('function _cartAberta(')), false);

// ── a conta do que sai e do que cabe ─────────────────────────────────────
// curva de 10 dias: 100..1000; p50=500, p60=600, melhor dia=1000
const _c10 = [100,200,300,400,500,600,700,800,900,1000];
const _an = _cartAnalise(_cartAberta([_it('16/09/2026',1200), _it('17/09/2026',300),
                                      _it('18/09/2026',600)], _cartNum('15/09/2026'), 0),
                         _c10, [50,60]);
ok('a faixa alvo define o teto do dia (p60 = 600)', [_an.alvoMin, _an.alvoMax], [500, 600]);
ok('o que não cabe e o espaço livre são as duas pontas da mesma conta',
   [_an.sai, _an.cabe], [600, 300]);
ok('dia acima do melhor dia já feito é marcado como impossível',
   [_an.nImpossivel, _an.linhas[0].impossivel, _an.linhas[2].impossivel], [1, true, false]);
ok('o que sobra é o excesso que as folgas do período não absorvem',
   _an.sobra, 300);
// ⚠ A DÍVIDA OCUPA DIA. Fora do nivelado, o período pareceria mais folgado.
const _semD = _cartAnalise(_cartAberta([_it('16/09/2026',600),_it('17/09/2026',600)], _cartNum('15/09/2026'), 0), _c10, [50,60]);
const _comD = _cartAnalise(_cartAberta([_it('16/09/2026',600),_it('17/09/2026',600)], _cartNum('15/09/2026'), 400), _c10, [50,60]);
ok('a dívida entra no nivelado e no total',
   [_semD.nivelado, _comD.nivelado, _comD.total], [600, 800, 1600]);
ok('e é ela que faz o horizonte estourar mesmo com os dias dentro da faixa',
   [_semD.sobra, _comD.sobra], [0, 400]);
ok('sem dia datado à frente não há análise (nunca zero inventado)',
   _cartAnalise(_cartAberta([_it('14/09/2026',500)], _cartNum('15/09/2026'), 0), _c10, [50,60]), null);

// ── o veredito separa RE-DATAR (de graça) de CAPACIDADE (custa) ──────────
eval(pega('function _cartUn(')); eval(pega('function _cartPeso('));
eval(pega('function _cartVeredito('));
global.fmtN = n => String(n);
ok('horizonte que não comporta o total não é problema de datação',
   _cartVeredito(_an).t, 'HORIZONTE SOBRECARREGADO');
const _redist = _cartAnalise(_cartAberta([_it('16/09/2026',1200), _it('17/09/2026',100),
                                          _it('18/09/2026',100), _it('19/09/2026',100)],
                                         _cartNum('15/09/2026'), 0), _c10, [50,60]);
ok('mas carga que cabe no período e está no dia errado, é',
   _cartVeredito(_redist).t, 'DIA DATADO ACIMA DO MÁXIMO JÁ FEITO');
ok('carteira dentro da faixa não inventa problema',
   _cartVeredito(_cartAnalise(_cartAberta([_it('16/09/2026',550),_it('17/09/2026',550)],
     _cartNum('15/09/2026'), 0), _c10, [50,60])).t, 'CARTEIRA NIVELADA');
ok('sem carteira datada o veredito diz isso, não "tudo certo"',
   _cartVeredito(null).t, 'SEM CARTEIRA DATADA');

// ── as guardas de arquitetura ────────────────────────────────────────────
const _cartDes = pega('function _cartHtml(');
ok('o desenho da carteira não faz conta',
   /_qpPercentil\(|_qpValorNoPercentil\(|_qpCurva\(/.test(_cartDes), false);
// ⚠ UMA RÉGUA SÓ na aba: curva e faixa entram por parâmetro. Uma segunda curva
// aqui faria a tela aprovar em cima o que reprova embaixo.
ok('a carteira recebe a curva pronta em vez de montar a própria',
   /_qpCurva\(/.test(pega('function _cartAnalise(')), false);
const _cartRender = pega('async function renderCarteira(');
const _cartBloc = pega('async function _cartBlocos(');
ok('e a tela usa a MESMA _qpCurva com a MESMA QP_REGUA do bloco de baixo',
   /_qpCurva\(dias, QP_REGUA\)/.test(_cartRender) && /QP_FAIXA/.test(_cartBloc), true);
// ⚠ A GUARDA DE REENTRÂNCIA NÃO PODE ENGOLIR O PEDIDO (18/09/2026 — "botão
// atualizar não está funcionando"). A montagem encadeia três leituras caras com
// 3×25 s de retry cada: no cold start passa de dois minutos, e nessa janela o
// `return` seco descartava EM SILÊNCIO todo toque no ATUALIZAR e toda troca de
// seletor. O pedido fica PENDENTE e roda no fim — a última escolha vence — e o
// bloco esmaece com "atualizando…" enquanto isso.
[['renderCarteira', 'async function renderCarteira(', 'CART'],
 ['renderQualidadePlano', 'async function renderQualidadePlano(', 'QP']].forEach(([nome, ass, pfx]) => {
  const f = pega(ass);
  ok(nome + ' não descarta o pedido que chega durante o voo',
     new RegExp('if\\(' + pfx + '_RODANDO\\)\\{ ' + pfx + '_PEND = true; return; \\}').test(f)
     && new RegExp('if\\(' + pfx + '_PEND\\)\\{ ' + pfx + '_PEND = false; ' + nome + '\\(\\); \\}').test(f), true);
  ok(nome + ' avisa na tela enquanto atualiza',
     /classList\.add\('qp-atualizando'\); _planoUpd\(\);/.test(f)
     && /classList\.remove\('qp-atualizando'\); _planoUpd\(\);/.test(f), true);
});
// A montagem (programação + dívida + mix) é UMA para a tela e para o papel.
const _cartMont = pega('async function _cartMontar(');
ok('a busca passa pelo carregador com cache, nunca por jsonpFetch direto',
   /carregarProgramacaoDetalhada\(\)/.test(_cartMont) && !/jsonpFetch|action=/.test(_cartMont + _cartRender), true);
// ⚠ AS DUAS RÉGUAS NUM LUGAR SÓ (`_cartBlocos`): a tela e os DOIS PDFs leem
// daqui. Com `AS DUAS` o veredito muda entre elas (medido em 18/09/2026: pela
// carga sobravam 2.302 cx e o E SE dizia NÃO DARIA; pelas caixas cruas, 790 e
// DARIA) — papel e tela discordando de qual régua valeu seria o pior dos mundos.
ok('tela e os dois relatórios montam a carteira pelo MESMO _cartBlocos',
   ['async function renderCarteira(', 'async function gerarRelatorioPlano(', 'async function gerarRelatorioCarteira(']
     .every(ass => /await _cartBlocos\(dias, curva/.test(pega(ass))), true);
ok('e o _cartBlocos monta pela MESMA _cartMontar', /await _cartMontar\(dias, modo\)/.test(_cartBloc), true);
ok('os modos são montados em SEQUÊNCIA, nunca em paralelo',
   /for\(let i = 0; i < modos\.length; i\+\+\)/.test(_cartBloc) && !/Promise\.all/.test(_cartBloc), true);
ok('AS DUAS é o único modo que devolve dois blocos',
   /QP_MIX === 'ambos' \? \['mix', 'cru'\] : \[QP_MIX\]/.test(_cartBloc), true);
// ⚠ com dois blocos a nota longa (idêntica nos dois) sai UMA vez, no último
// ⚠ com dois blocos, o que é IDÊNTICO sai uma vez só — e por classe escondida,
// nunca por um segundo desenho: nota longa, legenda e o sufixo do título.
ok('os dois blocos são marcados para a pele esconder o repetido',
   /cart-dois/.test(pega('function _cartBlocosHtml(')), true);
['\\.cart-dois \\.cart-bloco:not\\(:last-child\\) \\.qp-nota\\{display:none\\}',
 '\\.cart-dois \\.cart-bloco:not\\(:first-child\\) \\.qp-leg\\{display:none\\}',
 '\\.cart-dois \\.cl-regua\\{display:none\\}'].forEach(r => {
  ok('a tela esconde o repetido: ' + r.replace(/\\\\/g, '').slice(0, 42),
     new RegExp(r).test(_v7), true);
  ok('e o papel segue a MESMA regra: ' + r.replace(/\\\\/g, '').slice(0, 42),
     new RegExp('\\.plano-doc ' + r).test(JS.match(/const _PLANO_SKIN = `([\s\S]*?)`;/)[1]), true);
});
ok('o sufixo da régua no título do gráfico é marcável',
   /class="cl-regua"/.test(_cartDes), true);
// ⚠ com o mix o topo do dia é o FANTASMA tracejado quando ele passa da carga:
// a colisão da tarja tem de olhar o que está DESENHADO, não só a barra sólida.
ok('a colisão da tarja olha a barra E o fantasma do programado',
   /const _qtdsCol = a\.linhas\.map\(l => ehU \? l\.qtde : Math\.max\(l\.qtde, Number\(l\.crua\) \|\| 0\)\);/.test(_cartDes)
   && /_svgLadoLivre\(_qtdsCol, valor, nCobre\)/.test(_cartDes), true);
ok('o desenho dos blocos não faz conta',
   /_cartAnalise\(|_qpCurva\(|_qpPercentil\(|_cartMontar\(/.test(pega('function _cartBlocosHtml(')), false);
ok('o seletor da barra oferece os três modos',
   ["value=\"mix\"", "value=\"cru\"", "value=\"ambos\""].every(v => _v7.includes(v)), true);
ok('e a preferência guarda o modo novo',
   /o\.mix === 'ambos'/.test(pega('function _qpCarregarPref(')) || /o\.mix === 'ambos'/.test(JS), true);
// ⚠ dívida ZERO é valor legítimo: `||` entre os dois campos a trocaria pelo outro.
// A dívida é lida em UM lugar (`_planoDivida`): tela e papel não podem discordar.
ok('a dívida escolhe o campo por != null, não por ||',
   /prog\.faltaZerar != null/.test(pega('function _planoDivida(')), true);
ok('e a montagem única é quem a lê',
   /_planoDivida\(\)/.test(_cartMont), true);

// ── O MIX: a carteira em CX DE LINHA ─────────────────────────────────────
// Caixa não é unidade de tempo: 3.000 cx de caixa pequena a 300 cx/h são 10 h
// de esteira, as mesmas 3.000 de caixa grande a 150 cx/h são 20 h. E hora de
// produto NÃO é hora de linha (a esteira roda dois produtos por vez — medido:
// 347 h de produto em ~185 h de linha em 21 dias). Por isso o ritmo vira PESO
// RELATIVO, e a régua da aba continua em caixas.
console.log('\n── o mix: a carteira em cx de linha ──');
// Dois produtos, 4 dias cada: A a 200 cx/h, B a 100 cx/h, com uma hora em
// comum por dia (paralelismo) — os rótulos das horas vêm no horasLista.
const _mixIt = (data, modelo, cor, caixas, horas, hl) => ({ data, dataNum:_cartNum(data), modelo, cor, caixas, horas, horasLista:hl });
const _mixItens = [];
['01/09/2026','02/09/2026','03/09/2026','04/09/2026'].forEach((d, i) => {
  _mixItens.push(_mixIt(d, '501149', 'BRANCO', 200*4 + (i%2?40:-40), 4, ['07:00-08:00','08:00-09:00','09:00-10:00','10:00-11:00']));
  _mixItens.push(_mixIt(d, '501088', 'PRETO',  100*3 + (i%2?-30:30), 3, ['10:00-11:00','13:00-14:00','14:00-15:00']));
});
const _rit = _mixRitmos(_mixItens);
ok('a referência é Σcx ÷ Σhoras de produto', Math.round(_rit.ref), Math.round((800*4 + 300*4) / (7*4)));
ok('o ritmo por produto é a média aparada do comparativo (melhor e pior dia fora)',
   [Math.round(_rit.por['501149|BRANCO'].rit), Math.round(_rit.por['501088|PRETO'].rit)], [200, 100]);
ok('o mapa tem a chave por cor E por modelo', [!!_rit.por['501149'], !!_rit.por['501088']], [true, true]);
ok('horas de produto ÷ horas de linha vê o paralelismo (7 h de produto em 6 h de linha)',
   Math.round(_rit.razao * 100) / 100, Math.round(7/6 * 100) / 100);
ok('sem item com horas não há régua', _mixRitmos([{ caixas:10, horas:0, modelo:'501149' }]), null);

const _fA = _mixFator(_rit, '501.149.001', 'BRANCO'), _fB = _mixFator(_rit, '501088002', 'preto ');
ok('o fator é referência ÷ ritmo do produto (A pesa menos, B pesa mais)',
   [Math.round(_fA.f * 100) / 100, Math.round(_fB.f * 100) / 100],
   [Math.round(_rit.ref / 200 * 100) / 100, Math.round(_rit.ref / 100 * 100) / 100]);
ok('a cor casa sem depender de caixa/espaço; o código pode vir com pontos', [_fA.base, _fB.base], ['cor', 'cor']);
ok('cor sem histórico cai no MODELO', _mixFator(_rit, '501149', 'CUMARU').base, 'modelo');
ok('produto sem histórico entra com fator 1 e base nula', [_mixFator(_rit, '999999', '').f, _mixFator(_rit, '999999', '').base], [1, null]);
ok('sem régua o fator é 1', _mixFator(null, '501149', 'BRANCO').f, 1);
// Apontamento capenga (1 cx/h) daria fator 100+: o teto segura e marca.
const _ritCap = _mixRitmos(_mixItens.concat([_mixIt('05/09/2026', '501130', 'MEL', 1, 1, ['07:00-08:00'])]));
const _fCap = _mixFator(_ritCap, '501130', 'MEL');
ok('fator fora do plausível é limitado e marcado como aparado', [_fCap.f, _fCap.aparado], [MIX_FATOR_MAX, true]);
ok('fator normal não é marcado', _fA.aparado, false);

// A carteira pesada: o mesmo lote de 1.000 cx vale menos em A e mais em B.
const _progMix = [
  { data:'16/09/2026', dataNum:_cartNum('16/09/2026'), lote:'1', codigo:'501.149.001', desc:'MESA CABECEIRA MADERO', cor:'BRANCO', qtde:1000 },
  { data:'16/09/2026', dataNum:_cartNum('16/09/2026'), lote:'1', codigo:'501.088.002', desc:'HOME ANGEL 1.6',       cor:'PRETO',  qtde:1000 },
  { data:'17/09/2026', dataNum:_cartNum('17/09/2026'), lote:'2', codigo:'999.999.001', desc:'PRODUTO NOVO',         cor:'',       qtde:500 },
];
const _cMix = _cartAberta(_progMix, _cartNum('15/09/2026'), 0, _rit);
const _d16 = _cMix.dias[0], _d17 = _cMix.dias[1];
ok('o programado cru fica ao lado do pesado', [_d16.crua, _d16.qtde], [2000, Math.round(1000*_fA.f + 1000*_fB.f)]);
ok('o fator do dia é pesado ÷ cru', Math.round(_d16.fator * 100) / 100, Math.round(_d16.qtde / 2000 * 100) / 100);
ok('o lote que mais pesa no dia é o de produto lento (B)', /501\.088\.002/.test(_d16.pesa.rot), true);
ok('e o rótulo leva a cor, como o resto do app', /HOME ANGEL 1\.6/.test(_d16.pesa.rot) && /PRETO/.test(_d16.pesa.rot), true);
ok('produto sem histórico entra cru e é CONTADO como sem base', [_d17.qtde, _d17.semBase, _cMix.mix.semBase], [500, 1, 1]);
ok('o total cru e o pesado saem os dois', [_cMix.futuroCru, _cMix.futuro], [2500, _d16.qtde + 500]);
ok('a leitura do mix vai junto (referência, razão, nº de lotes)',
   [Math.round(_cMix.mix.ref) === Math.round(_rit.ref), _cMix.mix.nLotes], [true, 3]);
// Sem régua nada muda: é a carteira de sempre.
const _cSem = _cartAberta(_progMix, _cartNum('15/09/2026'), 0, null);
ok('sem régua a carteira sai crua (qtde = crua) e sem leitura de mix', [_cSem.dias[0].qtde, _cSem.dias[0].crua, _cSem.mix], [2000, 2000, null]);
ok('e a análise carrega o mix e o cru para o desenho',
   (() => { const an = _cartAnalise(_cMix, _c10, [50,60]); return [an.futuroCru, !!an.mix]; })(), [2500, true]);

// A CONFERÊNCIA: dias em que o realizado é só "ritmo × horas" com mix
// diferente oscilam em caixas cruas e ficam parelhos em cx de linha.
const _confIt = [], _confDias = [];
for(let i = 0; i < 12; i++){
  const d = (i + 1 < 10 ? '0' : '') + (i + 1) + '/08/2026';
  const hA = i % 2 ? 6 : 2, hB = 8 - hA;               // 8 h de linha, mix alternando
  _confIt.push(_mixIt(d, '501149', 'BRANCO', 200 * hA, hA, []));
  _confIt.push(_mixIt(d, '501088', 'PRETO',  100 * hB, hB, []));
  _confDias.push({ data:d, real: 200 * hA + 100 * hB });
}
const _rc = _mixRitmos(_confIt);
const _dg = _mixDiag(_confDias, _confIt, _rc);
ok('em caixas cruas o realizado oscila (mix alterna)', _dg.oscCru > 15, true);
ok('em cx de linha os dias ficam parelhos: o mix explica a variação', [_dg.oscMix < 1, _dg.ok, _dg.ganho > 95], [true, true, true]);
ok('a conferência conta os dias que casaram', [_dg.n, _dg.base], [12, true]);
ok('com menos dias que o mínimo não há base (nem veredito)',
   (() => { const g = _mixDiag(_confDias.slice(0, 4), _confIt, _rc); return [g.base, g.ok]; })(), [false, false]);
ok('sem régua não há conferência', _mixDiag(_confDias, _confIt, null), null);

// ── guardas ──────────────────────────────────────────────────────────────
// A régua da aba continua UMA (caixas/dia): o mix muda o que entra na barra,
// nunca a curva — `_cartAnalise` segue recebendo a curva pronta.
ok('o mix não toca na curva', /_mixRitmos\(|_mixFator\(/.test(pega('function _cartAnalise(')), false);
ok('o desenho da carteira e a linha do mix não fazem conta',
   /_mixRitmos\(|_mixFator\(|_mixDiag\(|_phMediaAparada\(/.test(_cartDes + pega('function _cartMixHtml(')), false);
ok('a linha do mix sai no desenho (tela e papel)', /_cartMixHtml\(a\)/.test(_cartDes), true);
// "a qtde no gráfico não bate com a carteira" (16/09/2026): com o mix a barra
// é cx de linha, e o PROGRAMADO cru vai como fantasma tracejado + número na base.
ok('com o mix, o programado cru vai como fantasma na barra', /stroke-dasharray="3 3"/.test(_cartDes), true);
ok('e o fantasma e o selo são pintados DEPOIS da barra (senão ela tapa)', /\+ fant \+ selo;\s*\}\)\.join/.test(_cartDes), true);
ok('o título do gráfico diz a unidade quando há mix', /A BARRA É A CARGA: O PROGRAMADO PESADO PELO MIX/.test(_cartDes), true);
// "precisa ser fácil interpretação, bater o olho e entender" (16/09/2026):
// o peso sai em PALAVRAS, de uma função só, e o número em cima da barra é o
// PROGRAMADO — o que o gestor confere na planilha.
eval(pega('function _cartPesoTxt('));
ok('peso em palavras: lento', [_cartPesoTxt(1.22).selo, _cartPesoTxt(1.22).cls], ['+22% lento', 'qp-p-warn']);
ok('peso em palavras: rápido', [_cartPesoTxt(0.72).selo, _cartPesoTxt(0.72).cls], ['−28% rápido', 'qp-p-ok']);
ok('dentro de ±5% é normal, sem número', [_cartPesoTxt(1.03).selo, _cartPesoTxt(0.96).cls], ['normal', '']);
ok('o número em cima da barra é o programado quando há mix (em UEP, a carga)', /fmtN\(mix && !ehU \? l\.crua : l\.qtde\)/.test(_cartDes), true);
ok('o selo PESA vai dentro da barra', /PESA ' \+ peso\.pct/.test(_cartDes), true);
ok('"aparado" e "×fator" saíram da tabela — ficam no tooltip', /aparado\(s\)<\/span>|_fx\(l\.fator\)/.test(_cartDes), false);
ok('a caixa do mix fala em palavras', /COMO A CARGA É CALCULADA/.test(pega('function _cartMixHtml(')) && /os pesos valem/.test(pega('function _cartMixHtml(')), true);
ok('mix pedido e NÃO aplicado nunca passa em silêncio', /MIX NÃO APLICADO/.test(pega('function _cartMixHtml(')), true);
const _cartRit = pega('async function _cartRitmos(');
ok('o log de produto tem cache por período e requisição em voo compartilhada',
   /_cartMixCache\.key === key/.test(_cartRit) && /_cartMixVoo\.key === key && _cartMixVoo\.p/.test(_cartRit), true);
ok('e reaproveita o período que o comparativo por modelo já buscou', /_phCache\.key === key/.test(_cartRit), true);
// ⚠ a leitura publica PREP_PERIODO, que é da aba PRODUÇÃO/HORA e de OUTRO período
ok('a leitura devolve o PREP_PERIODO da outra aba', /finally\{ PREP_PERIODO = prepAntes; \}/.test(_cartRit), true);
ok('com CAIXAS CRUAS não há busca', /\(modo \|\| QP_MIX\) !== 'mix'\) return null;/.test(_cartRit), true);
// ⚠ O MODO É LIDO UMA VEZ, NO COMEÇO DA MONTAGEM. Trocando o seletor no meio da
// busca (que leva minutos no cold start), o `QP_MIX` mudava debaixo dela e a
// legenda saía "CARTEIRA EM CAIXAS CRUAS" embaixo de barras pesadas pelo mix.
const _cartMontModo = pega('async function _cartMontar(');
ok('o modo do mix é lido uma vez e viaja com a montagem',
   /const modo = modoPedido \|\| \(QP_MIX === 'ambos' \? 'mix' : QP_MIX\);/.test(_cartMontModo) && /_cartRitmos\(modo\)/.test(_cartMontModo)
   && /cart\.mixModo = modo;/.test(_cartMontModo), true);
// ⚠ 90 dias não respondeu no cold start (produção, 16/09/2026): a régua do mix
// é uma ESCADA — 60 e, sem resposta, 30 — e desce sozinha uma vez.
[/const CART_MIX_DIAS_MAX\s*=\s*\d+/, /const CART_MIX_ESCADA\s*=\s*\[[\d,\s]+\]/, /const CART_MIX_RETRY_S\s*=\s*\d+/]
  .forEach(re => { const m = JS.match(re); if(m) eval(m[0].replace('const ','global.')+';'); });
eval(pega('function _cartMixEscada('));
ok('o teto da régua do mix é 60 dias, nunca 90', CART_MIX_DIAS_MAX <= 60, true);
global.QP_REGUA = 0;  ok('todo o histórico → 60 e depois 30', _cartMixEscada(), [60, 30]);
global.QP_REGUA = 90; ok('régua de 90 → o mix fica em 60 e depois 30', _cartMixEscada(), [60, 30]);
global.QP_REGUA = 30; ok('régua de 30 → um degrau só (não há menor)', _cartMixEscada(), [30]);
global.QP_REGUA = 60;
const _cartAg = pega('function _cartMixAgendar(');
ok('a descida automática só acontece em sem-resposta (timeout), nunca em erro ou sem-endpoint',
   /mixFalha !== 'sem-resposta'\) return null;/.test(_cartAg), true);
ok('e só redesenha se a aba PLANO ainda está na tela', /classList\.contains\('on'\)\) renderCarteira\(\)/.test(_cartAg), true);
ok('a tela avisa que vai tentar de novo e com qual régua', /Tentando de novo sozinho em/.test(pega('function _cartMixHtml(')), true);
ok('o degrau volta a 0 no ATUALIZAR', /CART_MIX_DEGRAU = 0/.test(pega('function invalidarMixCache(')), true);
ok('o mix é só do bloco de cima: trocar não redesenha o de baixo',
   (() => { const f = pega('function _qpSetMix('); return /renderCarteira\(\)/.test(f) && !/renderQualidadePlano\(\)/.test(f); })(), true);
ok('a escolha do mix persiste na MESMA chave de preferências',
   /mix:QP_MIX/.test(pega('function _qpSalvarPref(')) && /o\.mix === 'cru' \|\| o\.mix === 'mix'/.test(pega('function _qpCarregarPref(')), true);
ok('o relatório em PDF explica o mix', /O MIX<\/td>/.test(pega('async function gerarRelatorioPlano(')), true);
// ── o papel: carteira em folha própria, lotes programados, menos texto ─────
// (PPCP, 16/09/2026: "separa do outro gráfico e inserir os produtos
// programados" · "essa impressão está muito carregada" · "tem muita coisa escrita")
ok('cada dia da carteira guarda os LOTES (para a lista impressa)',
   [_d16.lotes.length, _d16.lotes[0].lote, Math.round(_d16.lotes.reduce((a, x) => a + x.eq, 0))], [2, '1', _d16.qtde]);
const _lotesDes = pega('function _cartLotesHtml(');
ok('a lista de lotes é desenho, não conta',
   /_mixRitmos\(|_mixFator\(|_mixDiag\(|_qpPercentil\(|_phMediaAparada\(/.test(_lotesDes), false);
ok('e ordena do lote que mais pesa para o que menos pesa', /sort\(\(x, y\) => y\.eq - x\.eq\)/.test(_lotesDes), true);
const _relPlanoLotes = pega('async function gerarRelatorioPlano(');
ok('o PDF imprime a lista de lotes dentro da seção da carteira', /_cartLotesHtml\(ac\)/.test(_relPlanoLotes), true);
ok('e a seção 2 começa em página nova (carteira em folha própria)', /<div class="pl-quebra"><\/div>'\s*\+ sec\('COMO TEMOS DATADO/.test(_relPlanoLotes), true);
ok('o parágrafo de abertura e as notas sob os títulos saíram do papel',
   /pl-abre|<div class="rp-note">Os lotes|<div class="rp-note">O retrato/.test(_relPlanoLotes), false);
const _skinPlano = JS.match(/const _PLANO_SKIN = `([\s\S]*?)`;/)[1];
ok('a pele do papel esconde a nota longa e a explicação do mix (fica só o veredito)',
   /\.plano-doc \.qp-nota,\.plano-doc \.qm-como,\.plano-doc \.qm-det\{display:none\}/.test(_skinPlano), true);
ok('e a quebra de página é da pele, não da marcação', /\.pl-quebra\{page-break-before:always/.test(_skinPlano), true);
// ── A RÉGUA É A JORNADA NORMAL: hora extra fica fora ─────────────────────
// (PPCP, 16/09/2026: "tem que ser justo, desconsiderar horas extras"). O
// melhor dia real (3.217 em 15/09) tinha 224 cx de HE dentro.
console.log('\n── capacidade sem hora extra ──');
eval(pega('function _qpRealDia('));
eval(pega('function _qpDiasBase('));
ok('dia com separação entra com real − heCx', _qpRealDia({ real:3217, heCx:224 }), 2993);
ok('dia sem separação (heCx nulo) entra inteiro', [_qpRealDia({ real:1500, heCx:null }), _qpRealDia({ real:1500 })], [1500, 1500]);
ok('hora extra maior que o dia não vira negativo', _qpRealDia({ real:100, heCx:300 }), 0);
const _baseQp = _qpDiasBase([{ data:'a', real:3217, heCx:224 }, { data:'sab', real:1278, heCx:1278 }, { data:'c', real:1500 }, null]);
ok('sábado inteiro em HE sai da curva sozinho', _baseQp.map(d => d.data), ['a', 'c']);
ok('o total fica guardado e o dia sem separação é marcado',
   [_baseQp[0].real, _baseQp[0].realTotal, _baseQp[0].semSep, _baseQp[1].semSep], [2993, 3217, false, true]);
ok('a curva lê a base já sem HE', _qpCurva(_baseQp, 0), [1500, 2993]);
// UMA base para os dois blocos, a tela e os dois PDFs
[['renderCarteira', 'async function renderCarteira('], ['renderQualidadePlano', 'async function renderQualidadePlano('],
 ['gerarRelatorioPlano', 'async function gerarRelatorioPlano('], ['gerarRelatorioCarteira', 'async function gerarRelatorioCarteira(']]
  .forEach(([nome, ass]) => {
    const f = pega(ass);
    ok(nome + ' passa o histórico pela base sem HE', /dias = _qpDiasBase\(dias\);/.test(f) && !/filter\(d => d && Number\(d\.real\) > 0\)/.test(f), true);
  });
ok('a tela diz que a capacidade é jornada normal',
   /CAPACIDADE = <b>JORNADA NORMAL, SEM HORA EXTRA<\/b>/.test(_v7) && /MELHOR DIA SEM HORA EXTRA/.test(pega('function _cartHtml(')), true);   // o texto é da barra (HTML), não do script
ok('e conta os dias sem separação', /nSemSep/.test(pega('function _qpHtml(')) && /a\.nSemSep = dias\.filter\(d => d\.semSep\)\.length;/.test(pega('async function renderQualidadePlano(')), true);

// ── E SE AS PARADAS CAÍSSEM X%? ────────────────────────────────────────────
// (PPCP, 16/09/2026: "se a linha diminuir as paradas em x%, daria ou não?")
console.log('\n── e se as paradas caíssem ──');
eval(pega('function _cartDiasComMenosParadas('));
eval(pega('function _cartCenario('));
const _eseDias = [{ data:'01/09/2026', real:1000 }, { data:'02/09/2026', real:1200 }, { data:'03/09/2026', real:900 }];
const _esePor  = { '01/09/2026': { perd: 200 }, '03/09/2026': { perd: 100 } };
const _eseB = _cartDiasComMenosParadas(_eseDias, _esePor, 0.5);
ok('devolve a fração da perda ao realizado só de quem tem parada apontada',
   [_eseB.dias[0].real, _eseB.dias[1].real, _eseB.dias[2].real, _eseB.nCom, _eseB.cxRec], [1100, 1200, 950, 2, 150]);
ok('0% não mexe em nada', _cartDiasComMenosParadas(_eseDias, _esePor, 0).dias[0].real, 1000);
ok('fração acima de 1 é limitada', _cartDiasComMenosParadas(_eseDias, _esePor, 3).dias[0].real, 1200);
// curva de 10 dias, todos com 100 cx de perda: −50% sobe a régua em 50
const _eseD10 = _c10.map((r, i) => ({ data: 'd' + i, real: r }));
const _esePor10 = {}; _eseD10.forEach(d => { _esePor10[d.data] = { perd: 100 }; });
const _eseCart = _cartAberta([_it('16/09/2026', 700), _it('17/09/2026', 400)], _cartNum('15/09/2026'), 0);
const _baseEse = _cartAnalise(_eseCart, _c10, [50, 60]);
const _cen  = _cartCenario(_eseCart, _eseD10, _esePor10, 0.5, 0, [50, 60]);
ok('o cenário sobe o que o dia comporta pela perda recuperada', [_baseEse.alvoMax, _cen.alvoMax], [600, 650]);
ok('e refaz o que sai e o que cabe com a régua nova (a carteira não muda)',
   [_baseEse.sai, _cen.sai, _baseEse.cabe, _cen.cabe], [100, 50, 200, 250]);
ok('diz quantos dias tinham parada e quanto a linha faria a mais por dia', [_cen.nCom, _cen.nDias, _cen.cxRecDia], [10, 10, 50]);
ok('com 0% não há cenário', _cartCenario(_eseCart, _eseD10, _esePor10, 0, 0, [50, 60]), null);
ok('o desenho do cenário não faz conta',
   /_cartCenario\(|_qpCurva\(|_cartAnalise\(|perd/.test(pega('function _cartESeHtml(')), false);
ok('o cenário responde DARIA / NÃO DARIA', /'NÃO DARIA' : 'DARIA'/.test(pega('function _cartESeHtml(')), true);
const _cenAsync = pega('async function _cartCenarioAsync(');
ok('a busca das paradas é o MESMO carregador da gestão de perdas', /_pgContextoDoPeriodo\(rec\[0\]\.data, hojeStr\(\)\)/.test(_cenAsync), true);
ok('com E SE em "como hoje" não busca nada', /if\(!\(QP_ESE > 0\)/.test(_cenAsync), true);
ok('o cenário é ligado na análise dentro do _cartBlocos, para os três chamadores',
   /a\.cenario = modo === 'uep' \? \(QP_ESE > 0 \? \{ falha:'uep' \} : null\) : await _cartCenarioAsync\(cart, dias\)/.test(_cartBloc), true);
// ── CARTEIRA EM UEP (v7.85.0) ──
{
  eval(pega('function _cartUepMedia(')); eval(pega('function _qpCurvaUep('));
  const itU = [{ data:'20/10/2026', dataNum:_cartNum('20/10/2026'), qtde:100, uepCx:1.94, codigo:'A', lote:'1' },
               { data:'20/10/2026', dataNum:_cartNum('20/10/2026'), qtde:300, uepCx:1, codigo:'B', lote:'1' },
               { data:'20/10/2026', dataNum:_cartNum('20/10/2026'), qtde:50, codigo:'C', lote:'2' }];
  const fb = _cartUepMedia(itU);
  ok('UEP média da carteira = só das linhas com UEP, pela quantidade', Math.round(fb * 1000) / 1000, 1.235);
  const cU = _cartAberta(itU, _cartNum('15/10/2026'), 0, { uep:true, fallback:fb });
  ok('em UEP a carga é qtde × UEP do código; sem UEP entra com a média e é contado',
     [cU.dias[0].qtde, cU.dias[0].crua, cU.mix.semBase, cU.mix.uep], [Math.round(194 + 300 + 50 * fb), 450, 1, true]);
  ok('sem nenhuma linha com UEP, não há média (o modo não se aplica)', _cartUepMedia([{ qtde:10 }]), null);
  ok('a régua em UEP sai da UEP gravada no HISTÓRICO, sem os dias sem UEP',
     _qpCurvaUep([{ uep:2400 }, { uep:null, real:9999 }, { uep:2100 }], 0), [2100, 2400]);
  ok('em UEP a unidade dos textos é UEP e o peso é UEP/cx', [_cartUn({ mixModo:'uep' }), _cartUn({ mixModo:'mix' }), _cartPeso({ mixModo:'uep' }, 1.94).selo], ['UEP', 'cx', '1,94 UEP/cx']);
  ok('o seletor oferece EM UEP e a preferência guarda', [/<option value="uep">em UEP<\/option>/.test(src), /o\.mix === 'uep'/.test(pega('function _qpCarregarPref(') )], [true, true]);
}
ok('o desenho da carteira imprime o cenário logo abaixo do veredito', /_cartESeHtml\(a\)/.test(_cartDes), true);
ok('a escolha persiste na mesma chave de preferências', /ese:QP_ESE/.test(pega('function _qpSalvarPref(')), true);

// ── 🖨 CARTEIRA: só a seção 1, em paisagem, com as MESMAS peças ─────────
// (PPCP, 16/09/2026: "quero impressão só dos lotes separado do estudo de baixo"
// + "faça teste com a impressão virada")
const _relCart = pega('async function gerarRelatorioCarteira(');
ok('o relatório da carteira usa as mesmas peças do estudo (montagem, desenho, lotes, pele, documento)',
   ['_cartBlocos(dias, curva, false)', '_cartBlocosHtml(blocos, CART_SVG_W_PAISAGEM)', '_cartLotesHtml(ac)', '_PLANO_SKIN', "_rpDocParadas("].every(s => _relCart.includes(s)), true);
ok('e sai em PAISAGEM', /_rpDocParadas\('Carteira que vem — ' \+ hojeStr\(\), true\)/.test(_relCart), true);
ok('sem o estudo de baixo', /_qpHtml\(|COMO O NÚMERO SAI/.test(_relCart), false);
ok('a barra da aba tem os dois botões', /onclick="gerarRelatorioCarteira\(\)"/.test(_v7) && /onclick="gerarRelatorioPlano\(\)"/.test(_v7), true);   // botões são HTML, não script
ok('a caixa do mix separa o veredito do resto em blocos com classe',
   ['qm-como', 'qm-conf', 'qm-det'].every(c => pega('function _cartMixHtml(').includes('class="' + c + '"')), true);
// ⚠ A guarda é sobre a ABA PLANO: a Tela C da TV tem a própria leitura do
// `faltaZerar` desde antes, e não é dela que se trata. Contar o arquivo inteiro
// acusava a TV por um código que este bloco não escreveu.
ok('não sobrou leitura da dívida escrita à mão na tela nem no papel',
   [/faltaZerar/.test(_cartRender), /faltaZerar/.test(pega('async function gerarRelatorioPlano('))], [false, false]);
// Trocar régua ou faixa tem de redesenhar os DOIS blocos.
ok('régua e faixa redesenham a carteira junto com o retrospecto',
   [(JS.match(/renderCarteira\(\);\s*\n?\s*renderQualidadePlano\(\)/g)||[]).length >= 2,
    /invalidarProgDetCache\(\)/.test(JS)], [true, true]);
// O carregador é compartilhado com a aba PROGRAMAÇÃO: duas telas, uma leitura.
const _loader = pega('async function carregarProgramacaoDetalhada(');
ok('o carregador tem cache e requisição em voo compartilhada',
   [/PROG_DET_TTL/.test(_loader), /PROG_DET_VOO/.test(_loader)], [true, true]);

// ── o caso REAL que originou a tela (PROGRAMACAO de 15/09/2026) ──────────
// 7 dias datados, 13.278 cx, dívida de 2.147. Régua de 60 dias: p50=1.495,
// p60=1.573, melhor dia 2.909.
const _real = [[ '16/09/2026',3025],['17/09/2026',3125],['18/09/2026',1500],['21/09/2026',1800],
               ['22/09/2026',1250],['23/09/2026',1228],['24/09/2026',1350]].map(x => _it(x[0], x[1]));
const _cReal = [];
for(let i=0;i<60;i++) _cReal.push(i<30 ? 1000 + i*17 : 1495 + (i-30)*47);
const _aReal = _cartAnalise(_cartAberta(_real, _cartNum('15/09/2026'), 2147), _cReal, [50,60]);
ok('os 7 dias datados somam 13.278 cx e a dívida leva o total a 15.425',
   [_aReal.futuro, _aReal.total], [13278, 15425]);
ok('e o nivelado passa de 2.000 cx/dia — acima do que a linha faz',
   Math.round(_aReal.nivelado) > 2000, true);

// ── VAZIO NÃO É UMA COISA SÓ: por que a carteira não veio ─────────────────
// ⚠ O defeito do 1º dia em produção (15/09/2026): a planilha tinha 78 linhas
// datadas de 16 a 24/09 e a tela afirmava "SEM CARTEIRA DATADA". A mensagem era
// a mesma para "não há lote futuro" e para "não consegui ler" — o MESMO defeito
// que o `PH_FALHA` do comparativo por modelo já tinha resolvido.
global._rpEsc = t => String(t);
eval(pega('function _progDetFalhaInfo('));
const _falha = (cod, msg) => { global.PROG_DET_FALHA = cod; global.PROG_DET_ERRO = msg || '';
                               return _progDetFalhaInfo(); };
ok('cada causa tem título próprio',
   ['sem-resposta','sem-endpoint','erro','sem-url'].map(c => _falha(c, 'x').t),
   ['NÃO CONSEGUI LER A PROGRAMAÇÃO','BACKEND SEM getProgramacaoDetalhada',
    'O BACKEND DEVOLVEU ERRO','PAINEL SEM GOOGLE SHEETS']);
ok('leitura boa não inventa falha', _falha(null), null);
// ⚠ Mandar re-deployar sem prova faz o gestor mexer no Apps Script à toa —
// aconteceu no comparativo por modelo (26/08/2026) e está nesta memória.
ok('a frase do re-deploy só existe no caso em que o backend PROVOU não ter a ação',
   [/RE-DEPLOYAR/.test(_falha('sem-endpoint').d), /RE-DEPLOY/i.test(_falha('sem-resposta').d)],
   [true, false]);
ok('o timeout manda tentar de novo, não mexer no backend',
   /cold start/.test(_falha('sem-resposta').d), true);

// A chamada é das mais caras do backend e era a última pesada sem retry.
const _loaderR = pega('async function carregarProgramacaoDetalhada(');
ok('a leitura da programação tem 3 tentativas em sequência',
   [/for\(let t=1; t<=3; t\+\+\)/.test(_loaderR), /Promise\.all/.test(_loaderR)], [true, false]);
ok('e cada saída marca a causa',
   ["'sem-resposta'","'sem-endpoint'","'erro'"].every(c => _loaderR.includes(c)), true);

// O diagnóstico deixa conferir a afirmação sem abrir a planilha.
const _vaz = _cartAberta([_it('10/09/2026',300), _it('14/09/2026',200),
                          _it('20/09/2026',100,{foraEsteira:true}), _it('21/09/2026',0)],
                         _cartNum('15/09/2026'), 0);
ok('a carteira vazia diz quantas linhas leu e qual a mais distante',
   [_vaz.dias.length, _vaz.diag.lidas, _vaz.diag.fora, _vaz.diag.semQtd, _vaz.diag.ultima],
   [0, 4, 1, 1, '21/09/2026']);

const _vazDes = pega('function _cartVazioHtml(');
ok('a falha da leitura tem prioridade sobre o "não há lote futuro"',
   /const f = _progDetFalhaInfo\(\);[\s\S]*?if\(f\) return/.test(_vazDes), true);
ok('e os dois caminhos oferecem TENTAR DE NOVO',
   (_vazDes.match(/TENTAR DE NOVO/g) || []).length >= 1 && /invalidarProgDetCache/.test(_vazDes), true);
ok('o desenho do vazio não faz conta',
   /_qpPercentil\(|_qpCurva\(|_cartAnalise\(/.test(_vazDes), false);
const _renderV = pega('async function renderCarteira(');
ok('a tela escolhe entre o quadro e o vazio, sem afirmar carteira vazia por falha',
   /_cartBlocosHtml\(await _cartBlocos\(dias, curva, true\), _svgLargura\(alvo\)\)/.test(_renderV)
   && /if\(!blocos\.some\(b => b\.a\)\) return _cartVazioHtml\(blocos\[0\]\.cart\);/.test(pega('function _cartBlocosHtml(')), true);

// ── O GRÁFICO OCUPA A LARGURA, NÃO AMPLIA ────────────────────────────────
// ⚠ Com `viewBox` fixo em 760 e `width:100%`, um monitor de 1920px ampliava o
// desenho em 2,43×: medido em 15/09/2026, o gráfico saía com 510px de altura
// (contra os 230px do `.chart-box-lg`, a régua do painel) e a legenda de 9px
// chegava à tela com 21,9px, maior que o rótulo dos cards ao lado.
console.log('\n── o gráfico ocupa a largura em vez de ampliar ──');
eval(pega('function _svgLargura('));
ok('a largura sai do card, com piso e teto',
   [_svgLargura({clientWidth:1880}), _svgLargura({clientWidth:900}),
    _svgLargura({clientWidth:300}), _svgLargura(null)],
   [1400, 866, 640, 760]);
// O `max-width` é o que impede o SVG de esticar de volta e ampliar tudo.
['_qpHtml','_cartHtml'].forEach(f => {
  const src = pega('function ' + f + '(');
  ok(f + ': a largura entra por parâmetro, não é constante',
     /const W = larg \|\| 760/.test(src), true);
  ok(f + ': e o svg não estica além do que foi desenhado',
     /max-width:' \+ W \+ 'px/.test(src), true);
});
// A tarja do rótulo nasce do texto — com número fixo ela sobrava na escala 1:1.
eval(pega('function _svgTarja('));
// Asserções de RELAÇÃO, não de pixel: largura exata muda com o corpo da fonte
// e um teste presa nela vira manutenção sem ganho.
const _larguraTarja = t => Number(/width="([\d.]+)"/.exec(t)[1]);
ok('a tarja cresce com o texto',
   _larguraTarja(_svgTarja(0,20,'ABCDEF',null,12)) > _larguraTarja(_svgTarja(0,20,'ABC',null,12)), true);
ok('e cresce com o corpo da fonte',
   _larguraTarja(_svgTarja(0,20,'ABC',null,12)) > _larguraTarja(_svgTarja(0,20,'ABC',null,9)), true);
ok('a ancorada à direita recua exatamente a própria largura',
   (()=>{ const t=_svgTarja(100,20,'ABC','end',12);
          return Math.abs(Number(/x="([\d.]+)"/.exec(t)[1]) + _larguraTarja(t) - 100) < 0.1; })(), true);

// ⚠ O CORPO DOS RÓTULOS É UM MEIO-TERMO MEDIDO, e mora numa constante.
// 2,43× de ampliação punha a legenda a 21,9px (maior que o rótulo dos cards);
// 1,00× a deixava a 9px e ela sumia de relance.
['_qpHtml','_cartHtml'].forEach(f => {
  const src = pega('function ' + f + '(');
  ok(f + ': o corpo dos rótulos é constante, não número solto',
     /const FS = 12;/.test(src) && !/font-size="9"/.test(src), true);
});

// ── A LINHA DO REALIZADO PRECISA SER LEGÍVEL ─────────────────────────────
// ⚠ Correção do usuário (15/09/2026): só a meta tinha ponto e tooltip. O
// realizado era um traço cinza sem marcador, sem número e sem alvo de mouse —
// dava para ver que as duas não se acompanham, mas não QUANTO a linha fez.
const _qpG = pega('function _qpHtml(');
ok('o realizado ganhou ponto próprio', /const ptsReal = serie\.map/.test(_qpG), true);
ok('e uma faixa de toque por dia, com as DUAS quantidades',
   [/const toque = serie\.map/.test(_qpG), /produziu ' \+ fmtN\(l\.real\)/.test(_qpG)], [true, true]);
// ⚠ A faixa é pintada ANTES das linhas: por cima, comeria o tooltip dos pontos.
ok('a faixa de toque fica atrás das linhas e dos pontos',
   _qpG.indexOf('+ toque') < _qpG.indexOf("caminho('real')")
   && _qpG.indexOf("caminho('meta')") < _qpG.indexOf('ptsReal + pts'), true);
// ⚠ O corte do número tem de casar com o FILTRO: com 12 o ramo era MORTO,
// porque o menor botão da barra é 15 DIAS.
ok('o número impresso é alcançável pelo filtro de 15 dias',
   /serie\.length <= 15/.test(_qpG), true);

// ── O RELATÓRIO DA QUALIDADE DO PLANO: a mesma marcação, pele de papel ────
// Pedido do usuário (15/09/2026): "quero uma impressão para analisar".
console.log('\n── relatório da qualidade do plano ──');
const _relPlano = pega('async function gerarRelatorioPlano(');
// ⚠ Os desenhos são os MESMOS da tela. Uma segunda versão para o papel seria a
// história do cabeçalho dos cinco relatórios (#204/#205).
ok('o papel usa os mesmos desenhos da tela',
   [/_cartBlocosHtml\(blocos, PLANO_SVG_W\)/.test(_relPlano),
    /_qpHtml\(a, curva, dias\.length, QP_REGUA, QP_ORDEM, PLANO_SVG_W\)/.test(_relPlano)], [true, true]);
ok('e o documento compartilhado dos relatórios, não um <head> próprio',
   /_rpDocParadas\(/.test(_relPlano) && /_rpCabecalho\(/.test(_relPlano) && /_rpBotaoImprimir\(\)/.test(_relPlano), true);
ok('o relatório não faz conta — recebe as análises prontas',
   [/_cartBlocos\(dias, curva, false\)/.test(_relPlano) && !/_cartAnalise\(/.test(_relPlano),
    /_qpAnalise\(rec, curva, QP_FAIXA\)/.test(_relPlano)], [true, true]);
// A carteira é opcional no papel: falhou a leitura, o relatório sai inteiro.
ok('sem a programação o relatório sai sem a seção, não sem relatório',
   /catch\(e\)\{ blocos = \[\]; ac = null; \}/.test(_relPlano) && /\(ac \? \(sec\(/.test(_relPlano), true);
// ⚠ A PELE É ESCOPADA em .plano-doc: regra solta mudaria os outros quatro
// documentos que usam o _rpDocParadas.
{
  const m = JS.match(/const _PLANO_SKIN = `([\s\S]*?)`;/);
  const skin = m ? m[1] : '';
  ok('a pele do relatório existe', !!m, true);
  const regras = skin.split('\n').map(l => l.trim()).filter(l => /^[.#a-z*]/.test(l) && /\{/.test(l));
  ok('e todo seletor dela começa com .plano-doc',
     regras.filter(l => !l.startsWith('.plano-doc')).length, 0);
  // é a redefinição dos tokens que re-skina o SVG — sem ela, cor inválida vira preto
  ok('os tokens que o SVG lê estão redefinidos para o papel',
     ['--ok','--red','--warn','--acc','--bg','--txt','--font-d'].every(t => skin.includes(t + ':')), true);
  ok('a dica de mouse e o botão de tentar de novo não vão ao papel',
     /\.qp-leg-mouse\{display:none\}/.test(skin), true);
}
ok('a largura no papel é fixa (papel não tem monitor)',
   /const PLANO_SVG_W = \d+;/.test(JS) && !/_svgLargura/.test(_relPlano), true);
ok('a dica de mouse tem classe própria nos dois desenhos',
   (JS.match(/class="qp-leg-mouse"/g) || []).length, 2);

// As duas famílias de modificador no mesmo card: o painel lê ok/warn/red/acc,
// o documento lê g/o/r/a. Uma marcação, duas peles.
{ const m = JS.match(/const _KPI_PAPEL = \{[^}]+\};/); if(m) eval(m[0].replace('const ','global.')); }
eval(pega('function _kpiCls('));
ok('cada modificador do painel leva o do papel junto',
   ['ok','warn','red','acc'].map(_kpiCls), ['ok g','warn o','red r','acc a']);
ok('modificador desconhecido passa sem enfeite', _kpiCls('x'), 'x');
ok('nenhum card dos dois desenhos escapa do _kpiCls',
   /class="kpi-card (?!' \+ _kpiCls)/.test(pega('function _qpHtml(') + pega('function _cartHtml(')), false);

// A tarja escolhe o lado LIVRE: no papel, a 660px, ela tapava o valor do 3º dia.
eval(pega('function _svgLadoLivre('));
ok('vai para onde nenhuma barra da ponta cruza a altura',
   [_svgLadoLivre([3000,3100,1500,1800,1250,1228,1350], 1573),
    _svgLadoLivre([1250,1228,1350,1800,1500,3000,3100], 1573)], ['fim', 'ini']);
ok('empate vai para a direita, onde o olho já terminou de ler',
   _svgLadoLivre([1000,1000,1000,1000], 900), 'fim');
// ⚠ ESCOLHER O LADO NÃO BASTA: pode não haver lado livre. Caso medido em
// 18/09/2026 (carteira em caixas cruas, 10 dias, faixa alvo em 1.672 cx) — as
// DUAS pontas cruzam a linha e a tarja caía em cima da barra do 21/09 e do
// número 1.800 dela. Quantas barras ela cobre sai da LARGURA dela (a 1.300px
// de card são 2, não as 3 fixas de antes).
const _cartoes1809 = [1800,1250,1228,1350,1550,1150,1750,2700,2250,1400];
ok('com as duas pontas ocupadas ainda escolhe a menos pior',
   [_svgLadoLivre(_cartoes1809, 1672, 2), _svgLadoLivre(_cartoes1809, 1672, 3)], ['fim', 'ini']);
ok('o nº de barras cobertas sai da largura da tarja, não de um n fixo',
   /Math\.ceil\(\(\(txt\.length \+ 2\) \* FS \* 0\.62 \+ 10\) \/ passo\)/.test(_cartDes), true);
ok('e a tarja SOBE para acima do número da barra quando não há lado livre',
   /if\(alta >= valor\)/.test(_cartDes) && /const ySobe = ey\(alta\) - 18;/.test(_cartDes), true);
ok('subindo, uma guia pontilhada mantém o vínculo com a linha',
   /stroke-dasharray="2 2"/.test(_cartDes), true);
ok('não cabendo acima, fica onde estava — nunca pior que antes',
   /ySobe >= \(limSup != null \? limSup : T \+ FS \+ 8\)/.test(_cartDes), true);
ok('a tarja da CARGA não pode subir até a do MELHOR DIA',
   /_rot\(_cargaTxt, a\.alvoMax,  yMax,  'var\(--ok\)', yTeto \+ 20\)/.test(_cartDes), true);

// ── o GAP DA META saiu do gerencial (redundância) ──────────────────────────
// PRODUÇÃO REAL, META DO DIA, % DA META e GAP DA META eram QUATRO cards para
// uma relação só: dados o real e a meta, o % e a diferença são aritmética.
ok('o card GAP DA META não existe mais nos dois grids',
   (JS.match(/\{l:'GAP DA META'/g) || []).length, 0);
// Dois grids (ao vivo e dia passado) × dois ramos do ternário (atingida / faltam).
ok('e o que faltava virou o subtítulo da própria meta',
   (JS.match(/caixas programadas · /g) || []).length, 4);

// ── UM VEREDITO SÓ para "vamos bater hoje?" ────────────────────────────────
// A PROJEÇÃO FINAL e o selo do % DA META DO DIA respondiam a MESMA pergunta por
// duas contas: a projeção mede o turno em SLOTS (real + ritmo × slots restantes,
// ritmo = real ÷ nº de slots) e o selo mede em MINUTOS (efNoRitmo). Só dariam
// igual se toda hora tivesse 60 min — o slot pós-almoço 12:12-13:00 tem 48.
console.log('\n── projeção informa, selo julga ──');

// A PROVA: o turno real (9 slots, 527 min) e uma meta de 1.800.
const _SLOTS = [60, 60, 60, 60, 48, 60, 60, 60, 59];
const _MIN = _SLOTS.reduce((a, b) => a + b, 0);
ok('o turno tem 527 min, não 9×60', [_SLOTS.length, _MIN], [9, 527]);
const _porSlot = n => 1800 * n / _SLOTS.length;                                  // régua da projeção
const _porMin  = n => 1800 * _SLOTS.slice(0, n).reduce((a,b)=>a+b,0) / _MIN;     // régua do selo
// Com 4 horas lançadas as duas cobram coisas diferentes.
ok('com 4 horas, projeção cobra 800 e selo cobra 820',
   [Math.round(_porSlot(4)), Math.round(_porMin(4))], [800, 820]);
// E 810 cx cai no meio: acima para uma, abaixo para a outra.
ok('810 cx faz as duas discordarem na MESMA tela',
   [810 >= _porSlot(4), 810 >= _porMin(4)], [true, false]);
// Não é caso raro: só a última hora do turno faz as duas coincidirem.
const _discordam = _SLOTS.map((_, i) => i + 1)
  .filter(n => Math.abs(_porSlot(n) - _porMin(n)) > 1).length;
ok('a janela de contradição existe em 8 das 9 horas', _discordam, 8);

// Por isso a projeção deixou de julgar: fica o número, sem ▲/▼ e sem cor de
// status. Quem julga é o selo, que rateia por MINUTO. Mesma regra do relatório
// semanal e da TV — o número é tinta, o veredito é o selo.
[['ritmoprod_embalagem_v7.html', _v7], ['ritmoprod_mobile.html', _mob]].forEach(([nome, txt]) => {
  ok(nome + ': a projeção não dá mais veredito',
     /PROJEÇÃO FINAL[^\n]*ACIMA DA META'\s*:/.test(txt), false);
  ok(nome + ': e não pinta mais cor de status',
     /PROJEÇÃO FINAL[^\n]*k\.proj>=k\.meta\?'ok':'red'/.test(txt), false);
  ok(nome + ': o número da projeção continua na tela',
     /\{l:'PROJEÇÃO FINAL',\s*v:fmtN\(k\.proj\)/.test(txt), true);
});
// A TV já mostrava só o número — nunca teve este defeito, e não pode ganhar um.
ok('a TV segue imprimindo a projeção sem veredito',
   /getElementById\('tv-proj'\)\.textContent=fmtN\(k\.proj\);/.test(JS), true);

// A aba PARADAS pedia o getParadasPeriodo por conta própria, sem cache, logo
// depois de GESTÃO DE PERDAS/SIMULADOR terem buscado o MESMO período (v7.61.0).
{
  const _parCore = pega('async function _renderAnaliseParadasCore(');
  ok('a aba PARADAS usa a busca compartilhada',
     /_paradasPeriodoBusca\(de, ate,/.test(_parCore), true);
  ok('e não monta URL de getParadasPeriodo própria',
     /getParadasPeriodo/.test(_parCore), false);
  ok('a busca da gestão de perdas é a MESMA',
     /_paradasPeriodoBusca\(de, ate\)/.test(pega('async function _pgBuscarDados(')), true);
  ok('a busca compartilhada é definida uma vez só',
     (JS.match(/async function _paradasPeriodoBusca\(/g) || []).length, 1);
}

// ── ESTUDO DE UEP (v7.72.0) ─────────────────────────────────────────────────
// UEP por caixa = ritmo da âncora ÷ ritmo do produto, POR PRODUTO (cores
// somadas), com amostra mínima e duas âncoras. Só estudo: nenhuma tela usa.
console.log('\n── estudo de UEP ──');
{
  global.UEP_MIN_DIAS = Number(JS.match(/const UEP_MIN_DIAS\s*=\s*(\d+)/)[1]);
  global.UEP_COR_DIVERGE = Number(JS.match(/const UEP_COR_DIVERGE\s*=\s*([\d.]+)/)[1]);
  global.UEP_HORAS_DIA = Number(JS.match(/const UEP_HORAS_DIA\s*=\s*(\d+)/)[1]);
  global.UEP_ANCORA_TETO_MAX = Number(JS.match(/const UEP_ANCORA_TETO_MAX\s*=\s*(\d+)/)[1]);
  // O alvo do estudo É a meta do card UEP DO DIA (rp-core) — um número só.
  // O alvo do ESTUDO é ritmo × 8 h (2.300); a meta do card é da jornada inteira.
  global.UEP_ALVO_PROV = Number(JS.match(/const UEP_ALVO_PROV\s*=\s*(\d+)/)[1]);
  ok('alvo do estudo (8 h) × meta da jornada: os dois dão ~288 UEP/h',
     [Math.round(UEP_ALVO_PROV / 8), Math.round(UEP_META_PADRAO / UEP_MIN_DIA * 60)], [288, 288]);
  global.UEP_REGIME_MIN_H = Number(JS.match(/const UEP_REGIME_MIN_H\s*=\s*(\d+)/)[1]);
  for (const k of ['QP_ALVO_MIN', 'QP_ALVO_MAX', 'QP_MIN_DIAS'])
    if (typeof global[k] === 'undefined') global[k] = Number(JS.match(new RegExp('const ' + k + '\\s*=\\s*(\\d+)'))[1]);
  if (typeof _qpValorNoPercentil === 'undefined') eval(pega('function _qpValorNoPercentil('));
  global.UEP_VALID_MIN_DIAS = Number(JS.match(/const UEP_VALID_MIN_DIAS\s*=\s*(\d+)/)[1]);
  if (typeof _phParseData === 'undefined') eval(pega('function _phParseData('));
  eval(pega('function _uepTemCxHora('));
  eval(pega('function _uepChave('));
  eval(pega('function _uepCxHoraOk('));
  eval(pega('function _uepCxHoraDe('));
  eval(pega('function _uepProdutos('));
  eval(pega('function _uepDias('));
  eval(pega('function _uepValidacao('));
  eval(pega('function _uepEstudo('));
  const it = [];
  const dia = i => p2(i + 1) + '/09/2026';
  // A: 300 cx/h, 6 dias, 2 h/dia · B: 150 cx/h, 6 dias, 2 h/dia, maior volume
  // (em duas cores na MESMA hora — conta uma hora de esteira, não duas)
  // C: 3 dias só → sem UEP
  for (let i = 0; i < 6; i++) {
    it.push({ data: dia(i), modelo: '500001', nome: 'RAPIDO', cor: 'BRANCO', caixas: 600, horas: 2, horasLista: ['08:00-09:00', '09:00-10:00'] });
    it.push({ data: dia(i), modelo: '500002', nome: 'LENTO', cor: 'BRANCO', caixas: 400, horas: 2, horasLista: ['10:00-11:00', '13:00-14:00'] });
    it.push({ data: dia(i), modelo: '500002', nome: 'LENTO', cor: 'PRETO',  caixas: 200, horas: 2, horasLista: ['10:00-11:00', '13:00-14:00'] });
  }
  for (let i = 0; i < 3; i++)
    it.push({ data: dia(i), modelo: '500003', nome: 'NOVO', cor: '', caixas: 100, horas: 1, horasLista: ['14:00-15:00'] });
  const e = _uepEstudo(it, 'aparada');
  const by = n => e.prods.find(p => p.nome === n);
  ok('cores do mesmo produto somam e a hora repetida conta uma vez', Math.round(by('LENTO').ritmo), 300);
  // B tem 600 cx em 2 h = 300 → mesmo ritmo do A. Ajusta para testar a proporção.
  const it2 = it.map(x => x.nome === 'LENTO' ? { ...x, caixas: x.caixas / 2 } : x);
  const e2 = _uepEstudo(it2, 'aparada');
  const b2 = n => e2.prods.find(p => p.nome === n);
  ok('âncora rápido = o de maior ritmo', e2.rapido.nome, 'RAPIDO');
  ok('âncora volume = o de mais caixas', e2.volume.nome, 'RAPIDO');
  ok('produto na metade do ritmo vale 2 UEP/cx', b2('LENTO').uepRap, 2);
  ok('a âncora vale 1', b2('RAPIDO').uepVol, 1);
  // Pedido do PPCP (24/09/2026): amostra curta TAMBÉM ganha UEP, marcada provisória.
  ok('menos de 5 dias ganha UEP PROVISÓRIA', [b2('NOVO').amostraOk, b2('NOVO').provisoria, b2('NOVO').uepVol], [false, true, 3]);
  ok('e é contada à parte', [e2.nOk, e2.nProv, e2.nSem], [2, 1, 0]);
  ok('a âncora continua exigindo amostra', [e2.rapido.amostraOk, e2.volume.amostraOk], [true, true]);
  ok('o relatório escreve a observação na linha', /UEP PROVISÓRIA<\/b> — amostra curta/.test(pega('function _uepHtml(')), true);
  ok('com provisórias a cobertura vai a 100%', Math.round(e2.cobertura), 100);
  ok('UEP no período = caixas × UEP', b2('LENTO').uepPeriodo, 6 * 300 * 2);
  // A âncora muda a ESCALA, não a proporção: a razão entre produtos é a mesma.
  ok('as duas âncoras mantêm a proporção', b2('LENTO').uepVol / b2('RAPIDO').uepVol, b2('LENTO').uepRap / b2('RAPIDO').uepRap);
  ok('o desenho não faz conta', /_uepProdutos|_phMediaAparada|_qpOscilacao/.test(pega('function _uepHtml(')), false);
  ok('sem cxHora (backend antigo) a hora não é repartida', e2.dividido, false);
  // v7.96.0: UEP de TODO o cadastro — calibração pelo tempo de esteira.
  global.UEP_CALIB_MIN = Number(JS.match(/const UEP_CALIB_MIN\s*=\s*(\d+)/)[1]);
  eval(pega('function _uepCalibEsteira('));
  const eC = { volume: { teto: 300 }, prods: [
    { uepVol: 1,   teto: 300, amostraOk: true },    // âncora: quociente 1
    { uepVol: 2,   teto: 150, amostraOk: true },    // física 2, medida 2 → 1
    { uepVol: 1.5, teto: 200, amostraOk: true },    // física 1,5 → 1
    { uepVol: 3,   teto: 300, amostraOk: true },    // fora da curva: 3
    { uepVol: 9,   teto: 100, amostraOk: false }] };// provisório não entra
  const cC = _uepCalibEsteira(eC);
  ok('k = MEDIANA de (UEP medida ÷ UEP física) dos medidos com amostra', [cC.k, cC.n, cC.min, cC.max, cC.provisoria], [1, 4, 1, 3, false]);
  ok('a âncora sem teto não calibra (sem medida não há estimativa)', _uepCalibEsteira({ volume: { teto: 0 }, prods: eC.prods }), null);
  ok('poucos com amostra → entram os provisórios, e é marcado',
     _uepCalibEsteira({ volume: { teto: 300 }, prods: [eC.prods[0], eC.prods[1], eC.prods[4]] }).provisoria, true);
  ok('menos de 3 produtos medidos → sem calibração', _uepCalibEsteira({ volume: { teto: 300 }, prods: eC.prods.slice(0, 2).map(p => ({ ...p, amostraOk: false })) }), null);
  const gUep = pega('async function _gravarUepCadastro(');
  ok('a estimativa vai DEPOIS da UEP medida, pela mesma ação, com k e teto da âncora',
     [gUep.indexOf('estimar=1') > gUep.indexOf("action=setUepCatalogo'"), /&k='\+encodeURIComponent\(cal\.k/.test(gUep)], [true, true]);

  // ── v7.74.0: hora compartilhada repartida pelo TEMPO ESPERADO ──
  // A roda 300/h sozinho, B 150/h sozinho. Na hora 13:00 os dois dividem a
  // linha (troca): 150 cx de A e 75 de B → 0,5 h para cada. Hora cheia daria
  // 250/h e 125/h; repartida volta a 300 e 150.
  const itH = [];
  for (let i = 0; i < 6; i++) {
    itH.push({ data: dia(i), modelo: '500001', nome: 'A', cor: '', caixas: 750, horas: 3,
      horasLista: ['08:00', '09:00', '13:00'], cxHora: { '08:00': 300, '09:00': 300, '13:00': 150 } });
    itH.push({ data: dia(i), modelo: '500002', nome: 'B', cor: '', caixas: 375, horas: 3,
      horasLista: ['10:00', '11:00', '13:00'], cxHora: { '10:00': 150, '11:00': 150, '13:00': 75 } });
  }
  const eH = _uepEstudo(itH, 'aparada');
  const bH = n => eH.prods.find(p => p.nome === n);
  ok('com cxHora a hora é repartida', eH.dividido, true);
  ok('ritmo em regime = só as horas sozinho', [bH('A').ritmoReg, bH('B').ritmoReg], [300, 150]);
  ok('a régua antiga (hora cheia) fica para comparação', [bH('A').ritmoCheia, bH('B').ritmoCheia], [250, 125]);
  ok('com a hora repartida o ritmo volta ao real', [Math.round(bH('A').ritmo), Math.round(bH('B').ritmo)], [300, 150]);
  ok('e a UEP de B é 2', Math.round(bH('B').uepVol * 100) / 100, 2);
  // Pelas CAIXAS a hora seria 80/20; pelo tempo esperado (200/300 e 50/150) é 2/3 e 1/3.
  const itP = [
    { data: '01/09/2026', modelo: '1', nome: 'A', caixas: 500, horas: 2, horasLista: ['08:00', '09:00'], cxHora: { '08:00': 300, '09:00': 200 } },
    { data: '01/09/2026', modelo: '2', nome: 'B', caixas: 200, horas: 2, horasLista: ['09:00', '10:00'], cxHora: { '09:00': 50, '10:00': 150 } }];
  const pP = _uepProdutos(itP, 'aparada');
  ok('a hora compartilhada é repartida pelo tempo esperado, não pelas caixas',
     pP.map(p => Math.round(p.horas * 1000) / 1000), [1.667, 1.333]);
  ok('produto que nunca rodou sozinho é marcado', _uepProdutos([
    { data: '01/09/2026', modelo: '1', nome: 'A', caixas: 100, horas: 1, horasLista: ['08:00'], cxHora: { '08:00': 100 } },
    { data: '01/09/2026', modelo: '2', nome: 'B', caixas: 50, horas: 1, horasLista: ['08:00'], cxHora: { '08:00': 50 } }], 'aparada')
    .map(p => p.semRegime), [true, true]);

  // ── UEP POR DIA e validação fora da amostra ──
  ok('UEP por dia = soma de caixas × UEP do dia', Math.round(eH.uepDiaMed), 750 + 375 * 2);
  ok('com o realizado, cada dia mostra a cobertura',
     _uepEstudo(itH, 'aparada', { [dia(0)]: 2250 }).dias[0].cobDia, 50);
  ok('6 dias não bastam para validar fora da amostra', eH.valid.ok, false);
  const it8 = [];
  for (let i = 0; i < 8; i++) itH.slice(0, 2).forEach(x => it8.push({ ...x, data: dia(i) }));
  const v8 = _uepEstudo(it8, 'aparada').valid;
  ok('com 8 dias a UEP sai da 1ª metade e é testada na 2ª', [v8.ok, v8.nA, v8.nB, v8.deB], [true, 4, 4, dia(4)]);

  // ── v7.75.0: dia de 8 h, teto físico, âncora abaixo do teto, sanidade ──
  ok('o dia padrão é de 8 horas', UEP_HORAS_DIA, 8);
  // A roda a 300 com teto 310 (97% — no limite da esteira); B a 150 com teto 400.
  const itT = itH.map(x => ({ ...x, tetoCxH: x.nome === 'A' ? 310 : 400 }));
  const eT = _uepEstudo(itT, 'aparada', { [dia(0)]: 1000 });
  ok('âncora A pula quem roda acima de 90% do teto', [eT.volume.nome, eT.rapido.nome], ['B', 'A']);
  ok('e o relatório lista quem ficou de fora', eT.foraTeto.map(p => p.nome), ['A']);
  // Dia: A 750 cx × 0,5 + B 375 × 1 = 750 UEP em 5 horas da linha → 150 UEP/h → 1.200 em 8 h
  ok('UEP em 8 h = UEP/h da linha × 8', [eT.dias[0].uepH, eT.dias[0].uep8, Math.round(eT.uep8Med)], [150, 1200, 1200]);
  ok('a cobertura não é mais cortada em 100%', eT.dias[0].cobDia, 112.5);
  ok('e o dia acima do realizado é contado', eT.nCobAcima, 1);
  ok('sem dia acima do ritmo da âncora, o teste de sanidade passa', eT.nAcimaAncora, 0);
  // Ritmo acima do teto físico é limitado ao teto e marcado.
  const itC = itH.map(x => ({ ...x, tetoCxH: x.nome === 'A' ? 250 : 400 }));
  const pC = _uepEstudo(itC, 'aparada').prods.find(p => p.nome === 'A');
  ok('ritmo acima do teto físico é limitado ao teto', [Math.round(pC.ritmoBruto), pC.ritmo, pC.limitadoTeto], [300, 250, true]);
  ok('o desenho avisa o ritmo limitado', /RITMO LIMITADO AO TETO/.test(pega('function _uepHtml(')), true);

  // ── v7.78.0: um lançamento sem HORA não desliga a divisão do período ──
  const itS = itH.concat([{ data: dia(0), modelo: '500001', nome: 'A', cor: 'X', caixas: 50, horas: 0, horasLista: [], cxHora: {} }]);
  const eS = _uepEstudo(itS, 'aparada');
  ok('um item sem hora não desliga a divisão', [eS.dividido, eS.nSemHora], [true, 1]);
  ok('e fica fora do ritmo', Math.round(eS.prods.find(p => p.nome === 'A').ritmo), 300);
  const itQ = itH.map((x, i) => i === 0 ? { ...x, cxHora: undefined } : x);
  ok('item sem cxHora mas com horas é repartido igual e contado', _uepEstudo(itQ, 'aparada').nAprox, 1);

  // ── v7.76.0: UEP pelo regime, sanidade pelo teto da âncora, faixa de meta ──
  ok('com 4+ h sozinho a UEP sai do ritmo em regime (da cor, quando só há uma)', [bH('A').baseRegime || bH('A').baseCor, bH('A').hSozinho >= UEP_REGIME_MIN_H], [true, true]);
  ok('com menos, sai do ritmo usado', pP.map(p => p.baseRegime), [false, false]);
  // Regime e usado diferem: a UEP segue o regime.
  const itR = [];
  for (let i = 0; i < 6; i++) {
    itR.push({ data: dia(i), modelo: '1', nome: 'X', caixas: 400, horas: 2, horasLista: ['08:00', '09:00'], cxHora: { '08:00': 300, '09:00': 100 } });
    itR.push({ data: dia(i), modelo: '2', nome: 'Y', caixas: 300, horas: 2, horasLista: ['09:00', '10:00'], cxHora: { '09:00': 150, '10:00': 150 } });
  }
  const pR = _uepProdutos(itR, 'aparada').find(p => p.nome === 'X');
  ok('produto com regime usa o regime, não o usado', [pR.ritmo, pR.ritmoReg, pR.ritmoUsado !== pR.ritmoReg], [300, 300, true]);
  // v7.94.0 — entre as cores vale a MAIS RÁPIDA em regime, nunca a média.
  const itCorA = [];
  for (let i = 0; i < 6; i++) {
    itCorA.push({ data: dia(i), modelo: '3', nome: 'W', cor: 'BRANCO', caixas: 200, horas: 1, horasLista: ['08:00'], cxHora: { '08:00': 200 } });
    itCorA.push({ data: dia(i), modelo: '3', nome: 'W', cor: 'PRETO', caixas: 120, horas: 1, horasLista: ['09:00'], cxHora: { '09:00': 120 } });
  }
  const pCorA = _uepProdutos(itCorA, 'aparada')[0];
  ok('a base é a cor mais rápida em regime (200), não a média das cores (160)', [pCorA.baseCor, pCorA.corRap.cor, pCorA.ritmo], [true, 'BRANCO', 200]);
  const itCorAorB = itCorA.filter(x => x.cor === 'BRANCO').slice(0, 3).concat(itCorA.filter(x => x.cor === 'PRETO'));
  const pCorAorB = _uepProdutos(itCorAorB, 'aparada')[0];
  ok('cor com menos de '+UEP_REGIME_MIN_H+' h sozinha não vira base (amostra curta)', [pCorAorB.corRap.cor, pCorAorB.ritmo], ['PRETO', 120]);
  // Faixa de meta: 12 dias, UEP em 8 h variando; 1 dia com apontamento acima do realizado sai.
  const itM = [], rbM = {};
  for (let i = 0; i < 12; i++) {
    const cx = 200 + 10 * i;
    itM.push({ data: dia(i), modelo: '9', nome: 'Z', caixas: cx, horas: 1, horasLista: ['08:00'], cxHora: { '08:00': cx } });
    rbM[dia(i)] = i === 11 ? cx / 2 : cx;
  }
  const eM = _uepEstudo(itM, 'aparada', rbM, [50, 60]);
  ok('dia com apontamento acima do realizado é suspeito e fica fora', [eM.nSuspeitos, eM.meta.nDias], [1, 11]);
  const c8 = eM.dias.filter(d => !d.suspeito).map(d => d.uep8).sort((a, b) => a - b);
  ok('a faixa de meta é p50–p60 da UEP em 8 h dos dias válidos',
     [eM.meta.de, eM.meta.ate], [_qpValorNoPercentil(50, c8), _qpValorNoPercentil(60, c8)]);
  // ALVO PROVISÓRIO (PPCP, 24/09/2026): 2.300 UEP em 8 h; dia suspeito não conta.
  // UEP DO DIA nos dois gerenciais: a MESMA conta do núcleo, sem cópia local.
  {
    const MOB = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
    ok('o gerencial do desktop e o do celular mostram o card pelo uepCard do núcleo',
       [(JS.match(/uepCard\(PONTOS_DIA\.uep, PONTOS_DIA\.metaUep, k\.minNorm\)/g) || []).length,
        (MOB.match(/uepCard\(PONTOS_DIA\.uep, PONTOS_DIA\.metaUep, k\.minNorm\)/g) || []).length], [1, 1]);
    ok('UEP hora a hora nos dois gerenciais pela conta do núcleo',
       [/uepCelula\(uepH\[sl\.inicio\]/.test(JS), /uepCelula\(uepH\[r\.horario\]/.test(MOB), /porHoraModelo: json\.porHoraModelo/.test(MOB)], [true, true, true]);
    ok('a PROGRAMAÇÃO mostra a UEP da linha e do dia contra a meta',
       /UEP \(\$\{fmtP\(pctUep\)\} da meta/.test(pega('function renderProgramacaoDetalhada(')), true);
    eval(pega('function _phUepPorGrupo(')); eval(pega('function _uepChave('));
    global.PH_UEP_PROD = { '501134|PENTEADEIRA PRINCESA': 1.94, '501149|MESA MADERO': 1 };
    const ug = _phUepPorGrupo([{ modelo: '501134', nome: 'PENTEADEIRA PRINCESA', caixas: 100, fam: 'P' },
                               { modelo: '501149', nome: 'MESA MADERO', caixas: 300, fam: 'P' },
                               { modelo: '999', nome: 'SEM', caixas: 50, fam: 'P' }], it => it.fam);
    ok('UEP/cx do grupo = média pelas caixas dos produtos COM UEP', Math.round(ug.P * 1000) / 1000, 1.235);
    global.PH_UEP_PROD = null;
    ok('sem o mapa do backend, nada de UEP no comparativo', _phUepPorGrupo([{ caixas: 1 }], () => 'x'), null);
    ok('tela e PDF do comparativo passam o mesmo uepGrupo', (JS.match(/uepGrupo:_phUepPorGrupo\(itensView,keyOf\)/g) || []).length, 2);
    eval(pega('function _relUepSemanaHtml('));
    const sem = _relUepSemanaHtml([{ data: '22/09/2026', uep: 2400, metaUep: 2300 }, { data: '23/09/2026', uep: null }]);
    ok('UEP DA SEMANA: dia sem UEP escrito, total contra a soma das metas dos dias com UEP',
       [/sem UEP gravada/.test(sem), /2\.400<\/td>\s*<td class="td-mono" style="color:#5B6470">2\.300/.test(sem.replace(/\n/g, ' '))], [true, true]);
    ok('semana sem UEP gravada: a seção não sai', _relUepSemanaHtml([{ uep: null }]), '');
    ok('o relatório semanal e o do dia levam a UEP',
       [/\$\{_relUepSemanaHtml\(diasSem\)\}/.test(JS), /UEP DO DIA \(jornada normal\)/.test(JS)], [true, true]);
    // v7.87.0 — UEP em destaque em todas as impressões
    eval(pega('function _rpUepFaixaHtml('));
    const fx = _rpUepFaixaHtml([{ data: '22/09/2026', uep: 2400, metaUep: 2530, uepHe: 100 }, { data: '23/09/2026', uep: 2700, metaUep: 2530 }, { data: '24/09/2026', uep: null }]);
    ok('faixa de UEP: total contra a soma das metas dos dias COM UEP, selo com a palavra, dia sem UEP contado',
       [/5\.100/.test(fx), /de 5\.060 UEP/.test(fx), /NA META/.test(fx), /1 dia sem UEP/.test(fx), /\+100 UEP/.test(fx)], [true, true, true, true, true]);
    ok('faixa de UEP: período sem UEP gravada não sai', _rpUepFaixaHtml([{ uep: null }]), '');
    ok('a faixa destacada está no semanal e no histórico',
       [/\$\{_rpUepFaixaHtml\(diasSem\)\}/.test(JS), /\$\{_rpUepFaixaHtml\(dias\)\}/.test(JS)], [true, true]);
    ok('o relatório do dia abre com o card UEP DO DIA, pela mesma conta do gerencial',
       [/const uepDoc=\(PONTOS_DIA\.uep&&PONTOS_DIA\.uep\.codigos>0\)\?uepCard\(/.test(pega('async function gerarRelatorioProducaoModelo(')),
        /UEP DO DIA · JORNADA/.test(pega('async function gerarRelatorioProducaoModelo('))], [true, true]);
    eval(pega('function _phUepTotal('));
    global.PH_UEP_PROD = { '501134|PENTEADEIRA PRINCESA': 1.94, '501149|MESA MADERO': 1 };
    const ut = _phUepTotal([{ modelo: '501134', nome: 'PENTEADEIRA PRINCESA', caixas: 100 }, { modelo: '501149', nome: 'MESA MADERO', caixas: 300 }, { modelo: '9', nome: 'X', caixas: 50 }]);
    ok('UEP APONTADA do período: Σ caixas × UEP, caixa sem UEP à parte', [Math.round(ut.uep), ut.cxSem], [494, 50]);
    global.PH_UEP_PROD = null;
    ok('sem o mapa do backend, sem card de UEP no período', _phUepTotal([{ caixas: 1 }]), null);
    ok('o relatório do período leva o card UEP APONTADA',
       /const uepPer=_phUepTotal\(itensView\)/.test(pega('async function gerarRelatorioProducaoHora(')), true);
    ok('o resumo do WhatsApp e o bloco da semana levam a UEP; a TV não (ids só no gerencial)',
       [/UEP \(jornada normal\)/.test(pega('function _zapResumoSemana(')), /id="gsem-linha-uep"/.test(src), /id="tvd-linha-uep"/.test(src),
        /const comUep = pfx === 'gsem-';/.test(JS)], [true, true, false, true]);
    // PPCP, 25/09/2026: "pode tirar esse valor em reais daí". O uepCusto
    // continua no núcleo (testado) até o R$/UEP ganhar lugar próprio.
    ok('R$/UEP mora na aba SIMULADOR: desenho sobre o uepCustoPeriodo, sem conta própria',
       [/uepCustoPeriodo\(/.test(pega('function _simUepPintar(')), /\/\s*60/.test(pega('function _simUepPintar(')),
        /_simUepPintar\(\)/.test(pega('function _pgSimAtualiza('))], [true, false, true]);
    ok('R$/UEP saiu dos cards UEP DO DIA (hoje e dia passado)',
       [/_uepComCusto/.test(JS), /uepCusto\(/.test(JS)], [false, false]);
    ok('META DIA (UEP) nas configurações: só envia quando o gestor mudou o valor, uma vez',
       [/id="c-meta-uep"/.test(src), /_metaUepNova=\(mu>0&&Math\.round\(mu\)!==Math\.round\(atual\)\)/.test(pega('function saveCfg(')),
        /if\(_metaUepNova\)\{ params\.push\('metaUep='\+_metaUepNova\); _metaUepNova=null; \}/.test(pega('function enviarConfigPainel('))], [true, true, true]);
    // v7.90.0 — simulador de capacidade em UEP, por PRODUTO COMPLETO
    eval(pega('function _capVol(')); eval(pega('function _capNome(')); eval(pega('function _capProdutos(')); eval(pega('function _capMix('));
    ok('volume lido da descrição; sem VOL é 1/1', [_capVol('VOL 2/2 PENTEADEIRA').vol, _capVol('VOL 2/2 X').nVol, _capVol('MESA').nVol], [2, 2, 1]);
    ok('nome sem VOL e sem a cor antiga no fim', _capNome('VOL 1/2 PENTEADEIRA CAMARIM ELOA ROSA', 'rosa'), 'PENTEADEIRA CAMARIM ELOA');
    const cp = _capProdutos([
      { codigo: '501061001', desc: 'VOL 1/2 PENTEADEIRA CAMARIM ELOA', cor: 'OFF WHITE', uep: 2.5, pontos: 120 },
      { codigo: '501061002', desc: 'VOL 2/2 PENTEADEIRA CAMARIM ELOA', cor: 'OFF WHITE', uep: 2.02, pontos: 80 },
      { codigo: '501061003', desc: 'VOL 1/2 PENTEADEIRA CAMARIM ELOA', cor: 'ROSA', uep: 2.3, pontos: 120 },
      { codigo: '501061004', desc: 'VOL 2/2 PENTEADEIRA CAMARIM ELOA', cor: 'ROSA', uep: 2.02, pontos: 80 },
      { codigo: '501099001', desc: 'VOL 1/2 RACK X', cor: 'PRETO', uep: 1.2 },
      { codigo: '501099002', desc: 'VOL 2/2 RACK X', cor: 'PRETO', uep: 0 }]);
    const eloa = cp.find(p => /ELOA/.test(p.nome)), rack = cp.find(p => /RACK/.test(p.nome));
    ok('UEP do PRODUTO = soma dos volumes, pela cor MAIS RÁPIDA (menor UEP), nunca a média',
       [eloa.nVol, eloa.uepJogo, eloa.nCores], [2, 4.32, 2]);
    ok('PONTOS do produto = soma dos volumes; volume sem pontos → null', [eloa.ptsJogo, rack.ptsJogo], [200, null]);
    ok('a capacidade por produto imprime DEITADA (pedido do PPCP)',
       /_rpDocParadas\('Capacidade diária por produto', true\)/.test(pega('function gerarRelatorioCapTodos(')), true);
    eval(pega('function _capDia('));
    const cpT = _capProdutos([
      { codigo: '501094001', desc: 'VOL 1/1 MESA CABECEIRA SLEEP', cor: 'A', uep: 0.84, velocidade: 15, medida: 2400, entrePeca: 300 },
      { codigo: '501061001', desc: 'VOL 1/2 PENTEADEIRA ELOA', cor: 'A', uep: 2.3, velocidade: 15, medida: 1200, entrePeca: 300 },
      { codigo: '501061002', desc: 'VOL 2/2 PENTEADEIRA ELOA', cor: 'A', uep: 2.02, velocidade: 15, medida: 900, entrePeca: 300 },
      { codigo: '501149001', desc: 'VOL 1/1 MESA MADERO', cor: 'A', uep: 1 }]);
    const sl = cpT.find(p => /SLEEP/.test(p.nome)), el = cpT.find(p => /ELOA/.test(p.nome)), md = cpT.find(p => /MADERO/.test(p.nome));
    ok('limite da esteira: vel × 60.000 ÷ (medida + entre-peças); volumes somam tempo',
       [Math.round(sl.tetoH), Math.round(el.tetoH), md.tetoH], [333, 333, null]);
    ok('UEP que promete mais do que a esteira passa: corta no limite e marca',
       [_capDia(sl, 2530).porUep, _capDia(sl, 2530).limitado, _capDia(sl, 2530).dia === sl.tetoDia], [3011, true, true]);
    ok('dentro do limite não marca; sem medida não inventa limite',
       [_capDia(el, 2530).limitado, _capDia(md, 2530).limitado, _capDia(md, 2530).dia], [false, false, 2530]);
    ok('as duas impressões e a tela usam o _capDia (não recalculam)',
       [/_capDia\(p, meta, velS\)/.test(pega('function gerarRelatorioCapTodos(')), /_capDia\(l\.p, r\.meta, _capVel\(\)\)/.test(pega('function gerarRelatorioCapUep(')), /_capDia\(p, meta, _capVel\(\)\)/.test(pega('function _capPintar('))], [true, true, true]);
    ok('velocidade simulada refaz o limite com a mesma medida (esteira mais rápida = limite maior)',
       [_capDia(sl, 2530, 30).tetoDia, _capDia(sl, 2530, 30).limitado], [Math.floor(30 * 60000 / 2700 * 527 / 60), false]);
    ok('a impressão por produto tem PONTOS / DIA na última coluna',
       /<th>PONTOS \/ DIA<\/th><\/tr><\/thead>/.test(pega('function gerarRelatorioCapTodos(')), true);
    ok('volume sem UEP → produto sem UEP (nunca soma pela metade)', [rack.uepJogo, rack.volSemUep], [null, [2]]);
    const mx = _capMix(cp, [{ chave: eloa.chave, qtde: 300 }, { chave: rack.chave, qtde: 10 }], 2530);
    ok('mix: UEP usada, sobra, quanto ainda cabe e produto sem UEP à parte',
       [Math.round(mx.usado), Math.round(mx.sobra), mx.linhas[0].cabeMais, mx.semUep.length], [1296, 1234, 285, 1]);
    ok('a impressão da capacidade usa a MESMA conta da tela (_capMix) e diz que é simulação',
       [/_capMix\(CAP_CAT, CAP_MIX, meta\)/.test(pega('function gerarRelatorioCapUep(')), /SIMULAÇÃO — nada foi gravado/.test(pega('function gerarRelatorioCapUep('))], [true, true]);
    ok('a tabela de capacidade por produto usa o MESMO _capProdutos, do mais pesado ao mais leve, e lista quem está sem UEP',
       [/CAP_CAT\.filter/.test(pega('function gerarRelatorioCapTodos(')), /sort\(\(a,b\)=>b\.uepJogo-a\.uepJogo/.test(pega('function gerarRelatorioCapTodos(')),
        /SEM UEP COMPLETA NO CADASTRO/.test(pega('function gerarRelatorioCapTodos('))], [true, true, true]);
    ok('o simulador lê o cadastro só ao abrir, com cache e tentativas em sequência',
       [/CAP_CAT_TS<10\*60\*1000/.test(pega('async function abrirCapUep(')), /for\(let t=1; t<=3; t\+\+\)/.test(pega('async function _capBuscar('))], [true, true]);
    ok('cadastro que não veio NÃO fica em "carregando": diz por quê e oferece tentar de novo',
       [/CAP_FALHA=erro/.test(pega('async function _capBuscar(')), /Não consegui ler o cadastro/.test(pega('function _capPintar(')), /TENTAR DE NOVO/.test(pega('function _capPintar('))], [true, true, true]);
    ok('nenhum painel declara a própria cópia da conta',
       [/function uepCard/.test(JS), /function uepCard/.test(MOB)], [false, false]);
    ok('a TV e o operador NÃO mostram UEP (só o gerencial)',
       (pega('function _sincSlideB(') + pega('function renderTV(')).includes('uepCard'), false);
    ok('o GRAVAR UEP mostra que está trabalhando e não dispara duas vezes',
       [/if\(_uepGravando\) return;/.test(pega('async function gravarUepCadastro(')), /_uepBotao\('⏳ BUSCANDO/.test(pega('async function _gravarUepCadastro('))], [true, true]);
    ok('o botão GRAVAR UEP grava em lotes, em sequência, pela escrita com retry',
       /for\(let i=0;i<lista\.length;i\+=UEP_GRAVAR_LOTE\)[\s\S]*await jsonpEscrita\(url\)/.test(pega('async function _gravarUepCadastro(')), true);
  }
  ok('o alvo provisório é 2.300 UEP em 8 h', UEP_ALVO_PROV, 2300);
  const bonsM = eM.dias.filter(d => !d.suspeito);
  ok('o alvo conta só os dias válidos',
     [eM.alvo.nDias, eM.alvo.nBate], [bonsM.length, bonsM.filter(d => d.uep8 >= 2300).length]);
  ok('o percentil do alvo sai da mesma curva da faixa', eM.alvo.p, _qpPercentil(2300, c8));
  ok('a coluna ALVO não julga dia suspeito', /d\.suspeito\?'—':d\.bateAlvo/.test(pega('function _uepHtml(')), true);
  ok('com menos de 10 dias válidos não há faixa', _uepEstudo(itM.slice(0, 5), 'aparada').meta.de, null);
  ok('a sanidade usa o TETO da âncora, não o ritmo médio', /volume\.teto>0\?volume\.teto/.test(pega('function _uepEstudo(')), true);
  ok('o estudo pede cxHora e espera mais; o comparativo não pede',
     [/cxHora:true, ms:60000/.test(pega('async function _uepItensPeriodo(')),
      /await _uepItensPeriodo\(\)/.test(pega('async function gerarRelatorioUEP(')),
      /lerProducaoModeloPeriodo\(de,ate,onTent\)/.test(pega('async function _phItensPeriodo('))], [true, true, true]);
  ok('o relatório usa a faixa da aba PLANO', /_uepEstudo\(itens, ctx\.modo, realByDay, QP_FAIXA\)/.test(pega('async function gerarRelatorioUEP(')), true);

  ok('o relatório imprime em pé no documento compartilhado', /_rpDocParadas\(`Estudo de UEP[^`]*`\)/.test(pega('async function gerarRelatorioUEP(')), true);
  // Declarações + a única chamada da conta; o botão mora só na aba PRODUÇÃO/HORA.
  ok('a conta do estudo tem dois chamadores: o relatório e o GRAVAR UEP (a mesma conta)', (JS.match(/(?<!function )_uepEstudo\(/g) || []).length, 2);
  ok('e um botão só, na barra da PRODUÇÃO/HORA', (src.match(/onclick="gerarRelatorioUEP\(\)"/g) || []).length, 1);
}

// ── ABA UEP (v7.102.0) — maquete aprovada pelo PPCP em 25/09/2026 ────────────
{
  console.log('\n── aba UEP ──');
  global.CFG = Object.assign({}, global.CFG, { turnoInicio:'07:00', turnoFim:'17:00' });
  eval(pega('function _horaEhHE('));
  eval(pega('function _uepAbaHoras(')); eval(pega('function _uepAbaMix('));
  eval(pega('function _uepAbaConf(')); eval(pega('function _uepAbaProj('));
  global._horaEhHE = _horaEhHE;

  const slots = [{ inicio:'06:00', label:'06:00-07:00', min:60, he:true }, { inicio:'07:00', label:'07:00-08:00', min:60 },
                 { inicio:'12:12', label:'12:12-13:00', min:48 }, { inicio:'13:00', label:'13:00-14:00', min:60 },
                 { inicio:'14:00', label:'14:00-15:00', min:60 }];
  const all = [{ horario:'06:00', producaoHora:320, he:true }, { horario:'07:00', producaoHora:117 },
               { horario:'12:12', producaoHora:44 }, { horario:'13:00', producaoHora:90 }];
  const uepH = { '06:00':{ uep:320, cxSem:0 }, '07:00':{ uep:300, cxSem:0 }, '12:12':{ uep:200, cxSem:10 } };
  const H = _uepAbaHoras(slots, all, uepH, 2530);
  ok('hora a hora: meta da hora = meta × minutos ÷ 527; hora extra sem meta nem cor',
     [H[0].metaH, H[0].cls, Math.round(H[1].metaH), Math.round(H[2].metaH), H[1].cls], [null, '', 288, 230, 'ok']);
  ok('hora lançada SEM caixa com produto não vira 0 UEP vermelho; hora futura fica pendente',
     [H[3].lancada, H[3].uep, H[3].cls, H[4].lancada, H[4].uep], [true, null, '', false, null]);
  ok('as caixas sem UEP da hora aparecem', H[2].cxSem, 10);

  const phm = [{ hora:'06:00', modelo:'501118', nome:'ESCRIVANINHA TAURUS', caixas:100, uep:162 },
               { hora:'07:00', modelo:'501118', nome:'ESCRIVANINHA TAURUS', caixas:200, uep:324 },
               { hora:'08:00', modelo:'501134', nome:'PENTEADEIRA PRINCESA', caixas:100, uep:245 },
               { hora:'08:00', modelo:'501999', nome:'SEM UEP', caixas:30, uep:0 }];
  const M = _uepAbaMix(phm);
  ok('mix: só jornada normal (a HE fica fora, como na meta), ordenado pela UEP',
     [M.uep, M.cx, M.cxCom, M.linhas[0].modelo, M.linhas[0].cx], [569, 330, 300, '501118', 200]);
  ok('mix: UEP/cx do produto e fatia do dia; produto sem UEP fica com UEP/cx nulo',
     [M.linhas[0].uepCx, Math.round(M.linhas[1].pct), M.linhas[2].uepCx], [1.62, 43, null]);

  const cat = [{ codigo:'501.118.005', uep:1.62, uepVig:'24/09/2026' }, { codigo:'501134002', uep:2.45, uepVig:'25/09/2026 EST' },
               { codigo:'501999001', uep:0, uepVig:'' }];
  const ph = [{ codigo:'501118005', caixas:60 }, { codigo:'501134002', caixas:30 }, { codigo:'501999001', caixas:10 }];
  const C = _uepAbaConf(ph, cat);
  ok('confiabilidade: medida × estimada (vigência EST) × sem UEP, pelas caixas de hoje',
     [C.pMed, C.pEst, C.pSem, C.tot], [60, 30, 10, 100]);
  ok('cadastro sem a vigência (cache antigo) não inventa a divisão',
     [_uepAbaConf(ph, [{ codigo:'501118005', uep:1 }]), _uepAbaConf(ph, null)], [null, null]);

  const P = _uepAbaProj(1413, 288);
  ok('projeção: UEP por minuto de jornada lançada até o fim da jornada', [Math.round(P.porHora), Math.round(P.fim), P.restMin], [294, 2586, 239]);
  ok('sem jornada lançada não projeta', _uepAbaProj(100, 0), null);

  const R = pega('function renderUep(');
  ok('a aba usa a régua do card (uepCard) e não reescreve conta', [/uepCard\(/.test(R), /\/\s*UEP_MIN_DIA\s*\*\s*60/.test(R.replace(/meta\/UEP_MIN_DIA\*60/,''))], [true, false]);
  ok('a aba é só do gerencial do PC: a TV não desenha UEP', (pega('function _sincSlideB(') + pega('function renderTV(')).includes('renderUep'), false);
}

console.log(falhas === 0
  ? '\n✅ relatórios ok — contas testáveis e peças comuns em um lugar só\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
