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
ok('o % da jornada normal contra a meta', _dom['gsem-normal-pct'].textContent, '99,2% da meta');
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
ok('explica o rateio pelo tempo de esteira', /mesmo percentual para todos<\/b>/.test(notaPer), true);
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
let cp = _relCascataProduto(madero);
ok('potencial = melhor dia de cada cor × horas', cp.potencial, (227+210+194+97)*6);
ok('realizado é a soma das cores', cp.real, 3217);
ok('o que falta para o próprio melhor é perda de ritmo',
   cp.perdaRitmo, (227+210+194+97)*6 - 3217);
ok('as quatro cores entram', cp.nCores, 4);
ok('a melhor cor é apontada', /OFF WHITE\/CINAMOMO/.test(cp.melhorCor.label), true);
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
console.log(falhas === 0
  ? '\n✅ relatórios ok — contas testáveis e peças comuns em um lugar só\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
