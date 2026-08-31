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
// O guarda: a tela e o PDF do período passam o modo do filtro — se um deles
// voltar a chamar sem o modo, conta diferente do outro e o teste quebra.
ok('tela e PDF passam o modo do filtro MÉDIA',
   (JS.match(/_phMediaAparada\(accsDia,metric,mediaModo\)/g)||[]).length, 2);
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
// teto exibido, rodando nos dias que rodarem. O guarda abaixo prende a tela e
// o PDF na régua única — se algum voltar à fatia por linha, o teste quebra.
ok('tela e PDF descontam o teto pela régua única (não pela fatia da linha)',
   (JS.match(/tetoShow: fatorTroca!=null \? tetoBase\*fatorTroca/g)||[]).length, 2);

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
    (JS.match(/(?<!function )_phFalhaTxt\(\)/g) || []).length], [2, 1]);
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
ok('a tela lê o mesmo contexto do relatório',
   /_pgContexto\(\{paradas:dados\.paradas/.test(pega('async function renderGestaoPerdas(')), true);
ok('o relatório lê o mesmo contexto da tela',
   /_pgSecaoHtml\(_pgContexto\(/.test(pega('async function gerarRelatorioParadas(')), true);
ok('a tela busca pela função extraída',
   /_pgBuscarDados\(de, ate\)/.test(pega('async function renderGestaoPerdas(')), true);
// A busca é a leitura mais cara do painel (lê a aba PARADAS inteira): sem
// guarda de reentrância os ciclos se empilham, e sem cache o refresh refaz tudo.
ok('a tela não empilha buscas', /if\(PG_TELA_RODANDO\) return;/.test(pega('async function renderGestaoPerdas(')), true);
ok('e guarda o período em cache', /PG_TELA_CACHE\[chave\]=\{ctx/.test(pega('async function renderGestaoPerdas(')), true);
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
ok('e os quatro relatórios usam ele (paradas, perdas, min/1000, proposta de investimento)',
   (JS.match(/(?<!function )_rpDocParadas\(/g) || []).length, 4);
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
eval(pega('function _pgSimulacao('));
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

// por ano = mês típico × 12 ("colocar por ano tbm")
sim = _pgSimulacao({ ...simBase, selec: { 'Troca de Plastico': true },
  pctRed: 100, custoHora: 382.89, adicHE: 50, heSem: 8 });
ok('ano = mês × 12 (R$ e caixas)', [Math.round(sim.rsAno), sim.cxAno],
   [Math.round(sim.rsMes * 12), sim.cxMes * 12]);
ok('horas por ano', Math.round(sim.horasAno * 10) / 10, 65.4);

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
const _simHtml = pega('function _pgSimHtml(');
ok('o CENÁRIO pede as pessoas da embalagem',
   /pg-sim-pessoas/.test(_simHtml) && /PESSOAS NA EMBALAGEM \(qtde\)/.test(_simHtml), true);
ok('o rótulo da HE diz a grandeza: h/semana, total da embalagem',
   /HORA EXTRA ATUAL \(h\/semana, total da embalagem\)/.test(_simHtml), true);
ok('a nota de rodapé explica por que os R\$ não se somam',
   /não se somam/.test(_simHtml), true);

// ── impressão executiva (PROPOSTA DE INVESTIMENTO) ──
const _inv = pega('async function gerarRelatorioInvestimento(');
ok('a proposta usa a MESMA conta e o MESMO cenário da tela',
   /_pgSimulacao\(/.test(_inv) && /_pgSimEstado\(/.test(_inv), true);
ok('no documento compartilhado, em retrato',
   /_rpDocParadas\(`Proposta de Investimento[^`]*`\)/.test(_inv), true);
ok('o papel diz como o número sai', /COMO O NÚMERO SAI/.test(_inv), true);
ok('e diz que é simulação, não medição', /simulação, não medição/.test(_inv), true);
ok('o papel explica a conversão homem-hora → hora de linha',
   /HOMEM-HORA → HORA DE LINHA/.test(_inv), true);
ok('e que os dois R$ não se somam', /não se somam/.test(_inv), true);
ok('a tela tem o botão da impressão executiva',
   /gerarRelatorioInvestimento\(/.test(pega('function _pgSimHtml(')), true);
ok('nenhuma fórmula de perda reescrita no papel',
   /perdaDeMin|perdaAoRitmo|durProdutiva\(/.test(_inv), false);

// guarda-corpo: a conta é UMA, a tela chama o simulador, e ele não reescreve
// fórmula de perda nenhuma — consome o `perd` que o RP_PARADAS.stats valorou.
ok('o simulador é UMA implementação', (JS.match(/function _pgSimulacao\(/g) || []).length, 1);
ok('a tela da gestão de perdas desenha o simulador', /_pgSimHtml\(ctx\)/.test(pega('function _pgPintar(')), true);
ok('o simulador não recalcula perda por conta própria',
   /perdaDeMin|perdaAoRitmo|durProdutiva/.test(pega('function _pgSimulacao(')), false);

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
ok('a barra do dia só ganha cor quando o dia ficou abaixo',
   /const clr=d\.ef>=90\?'#2F3B4A':'#B3261E'/.test(JS), true);

console.log('\n── EFICIÊNCIA: número e cor da MESMA conta, nas três telas ──');
// 31/08/2026: a TV mostrou 49,8% em VERDE com "DENTRO DA META". O número era a
// meta do DIA (1.350 ÷ 2.709) e a cor era outra conta — o ritmo contra a
// meta/hora da HORA_A_HORA (1.350 ÷ 8×164 = 102,9%). Enquanto as duas metas
// concordam ninguém percebe; naquele dia elas discordavam em 84%.
['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'].forEach(f => {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  ok(f + ': nenhuma tela pinta pelo ritmo da meta/hora', /sc\(k\.ef\)/.test(src), false);
  ok(f + ': a régua vem do núcleo comum, não é reescrita', /efNoRitmo\(/.test(src), true);
});
const _v7 = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
ok('TV: o número da eficiência é o mesmo que carrega a cor',
   /tv-ef'\);\s*\n\s*ee\.textContent=fmtP\(k\.efRitmo\)/.test(_v7), true);
ok('TV: e o status sai da mesma conta', /sl\(k\.efRitmo\)/.test(_v7), true);
ok('TV: o % da meta do dia continua na tela, na linha de apoio',
   /id="tv-ef-sub"/.test(_v7) && /es\.textContent = k\.meta>0/.test(_v7), true);
// A TELA B é a que roda na TV de verdade (a Tela A tem .tv-left escondida no
// layout largo): ela espelha o DOM da A, então a linha de apoio tem de ser
// espelhada junto, senão o % da meta do dia sumia justamente da tela do chão
// de fábrica.
ok('TV: a Tela B espelha a linha de apoio',
   /set\('tvb-ef-sub',\s*get\('tv-ef-sub'\)\)/.test(_v7) && /id="tvb-ef-sub"/.test(_v7), true);
ok('gerencial: o card mostra a conta que pintou a cor',
   /v:fmtP\(k\.efRitmo\),\s*sub:sl\(k\.efRitmo\)/.test(_v7), true);

console.log('\n── o rótulo é CAIXAS, não PEÇAS ──');
// Mesmo critério do vocabulário banido ("PERDIDO NO RITMO"/"PERDIDO PARADO"):
// o mesmo st.pecas saía como PEÇAS PERDIDAS no desktop e CAIXAS PERDIDAS no
// mobile, com o desktop se contradizendo na própria tabela do plano de ação.
// A unidade do produto é a caixa.
['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'].forEach(f => {
  const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
  ok(f + ' não imprime "PEÇAS PERDIDAS"', src.includes('PE\u00c7AS PERDIDAS'), false);
});

console.log(falhas === 0
  ? '\n✅ relatórios ok — contas testáveis e peças comuns em um lugar só\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
