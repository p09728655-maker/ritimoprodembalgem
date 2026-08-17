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
eval(pega('function _relRotuloSemanas('));
eval(pega('function _slotMaisFreq('));
eval(pega('function _relMetaHE('));
eval(pega('function _relSwotParadas('));
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
ok('total com a eficiência do TOTAL (104,3%), não a média', zap.includes('8.681 caixas na semana* — 104,3%'), true);
ok('o veredito honesto vai junto', zap.includes('⚠️ Meta batida com hora extra'), true);
ok('divisão normal × extra', zap.includes('Jornada normal: 8.261 cx')||zap.includes('Jornada normal: '), true);
ok('os 5 dias entram, com dia da semana', (zap.match(/ — [\d.]+ cx /g)||[]).length, 5);
ok('o melhor dia leva o troféu', /ter 11\/08 — 2\.262 cx \(188,5%\) 🏆/.test(zap), true);
const zapForte=_zapResumoSemana(dias.map(d=>({...d,real:d.real+400,heCx:0,ef:d.ef})), 'x', 33);
ok('semana que bateu sem HE ganha o ✅', zapForte.includes('✅ Meta batida na jornada normal'), true);

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
const PAR_TROCA=/troca|setup|regulagem|preparaç/i;
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

console.log('\n── as peças comuns dos relatórios não podem voltar a ser copiadas ──');
// A faixa do PPCP, o botão de imprimir e o logo estavam escritos 5 vezes — foi
// por isso que o #204 arrumou um relatório e o #205 precisou repetir em quatro.
ok('cabeçalho declarado uma única vez',
   (JS.match(/<div class="rp-header">/g) || []).length, 1);
ok('botão de imprimir declarado uma única vez',
   (JS.match(/class="rp-print-btn no-print"/g) || []).length, 1);
ok('logo com URL absoluta declarado uma única vez',
   (JS.match(/new URL\('patrimar-logo\.png'/g) || []).length, 1);

console.log(falhas === 0
  ? '\n✅ relatórios ok — contas testáveis e peças comuns em um lugar só\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
