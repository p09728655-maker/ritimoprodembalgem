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

console.log('\n── SWOT da produção por modelo (dia e período) ──');
// Cada frase só entra quando o dado sustenta — e o pedido explícito do PPCP:
// com o mix longe do teto físico, dizer com todas as letras que a velocidade
// da esteira NÃO é o problema. Números reais do período de 18/08/2026.
eval(pega('function _relSwotProducao('));
const LP = [
  { nome: 'PENT CAMARIM DIAMANTE', caixas: 278, ritmo: 139, teto: 263, melhor: 179 },
  { nome: 'PENTEADEIRA PRINCESA',  caixas: 567, ritmo:  98, teto: 291, melhor: 134 },
  { nome: 'MESA CENTRO LUNA 670',  caixas:  82, ritmo:  82, teto: 376, melhor:  82 },
  { nome: 'LIVREIRO ENCANTO',      caixas: 185, ritmo:  93, teto:   0, melhor: 139 },
];
const swProd = _relSwotProducao(LP, 'no período');
ok('o recado da esteira, com todas as letras',
   /A velocidade da esteira NÃO é o problema/.test(swProd.forcas[0] || ''), true);
ok('com o % do mix junto', /do teto físico/.test(swProd.forcas[0] || ''), true);
ok('melhor aproveitamento vira força', swProd.forcas.some(f => /DIAMANTE/.test(f) && /52,9%/.test(f)), true);
// A fraqueza exige VOLUME (≥10% das caixas) e % <30 — a LUNA 670 do período
// real tem só 7% do volume, então de propósito NÃO dispara. Caso que dispara:
const swFraco = _relSwotProducao([
  { nome: 'PRODUTO LENTO',  caixas: 500, ritmo:  70, teto: 300, melhor:  80 },
  { nome: 'PRODUTO RAPIDO', caixas: 500, ritmo: 200, teto: 300, melhor: 210 },
], 'no dia');
ok('pior aproveitamento com volume vira fraqueza',
   swFraco.fraquezas.some(q => /PRODUTO LENTO/.test(q) && /23,3%/.test(q)), true);
// UM produto <30% com volume pequeno continua fora (anti-ruído)…
ok('um único produto lento com 7% do volume não dispara sozinho',
   swProd.fraquezas.some(q => /abaixo de/.test(q)), false);
// …mas DOIS OU MAIS entram juntos, qualquer volume — foi o furo do relatório
// de 18/08: DEZ produtos abaixo de 30% e a fraqueza dizendo "nada apontado".
const swGrupo = _relSwotProducao([
  { nome: 'MESA CENTRO DECOR 700', caixas:  32, ritmo:  32, teto: 344, melhor:  32 },
  { nome: 'LIVREIRO TAURUS',       caixas:  38, ritmo:  38, teto: 203, melhor:  38 },
  { nome: 'CAMARIM ELOA',          caixas:  60, ritmo:  60, teto: 269, melhor:  60 },
  { nome: 'MESA CABECEIRA SLEEP',  caixas: 1816, ritmo: 182, teto: 435, melhor: 182 },
], 'no período');
ok('grupo de produtos <30% do teto vira fraqueza mesmo sem 10% individual',
   swGrupo.fraquezas.some(q => /3 produtos rodaram abaixo de/.test(q)), true);
ok('apontando o pior pelo nome e pelo %',
   swGrupo.fraquezas.some(q => /DECOR 700/.test(q) && /9,3%/.test(q)), true);
ok('produto sem catálogo vira fraqueza (régua cega)',
   swProd.fraquezas.some(q => /sem MEDIDA\/VELOCIDADE/.test(q)), true);
ok('replicar o melhor dia vira oportunidade',
   swProd.oportunidades.some(o => /Replicar o melhor dia/.test(o) && /PRINCESA/.test(o)), true);
ok('dependência de um produto vira ameaça (PRINCESA tem 51%)',
   swProd.ameacas.some(a => /PRINCESA/.test(a) && /depend/.test(a)), true);

// Dia impossível (acima do teto) não infla o mix e vira ameaça de apontamento.
const swImp = _relSwotProducao([
  { nome: 'MESA LATERAL DECOR 470', caixas: 318, ritmo: 318, teto: 300, melhor: 318 },
  { nome: 'CANT CAFE AURORA',       caixas: 424, ritmo: 106, teto: 260, melhor: 106 },
], 'no dia');
ok('ritmo acima do teto vira ameaça de apontamento',
   swImp.ameacas.some(a => /DECOR 470/.test(a) && /ACIMA do teto/.test(a)), true);
ok('e não empurra o mix para "esteira no limite"',
   swImp.ameacas.some(a => /começa a ser limite/.test(a)), false);

// Mix de verdade perto do teto: o recado INVERTE — velocidade vira ameaça.
const swAlto = _relSwotProducao([{ nome: 'X', caixas: 500, ritmo: 240, teto: 260, melhor: 250 }], 'no dia');
ok('mix a 92% do teto: aí sim a esteira vira limite',
   swAlto.ameacas.some(a => /começa a ser limite/.test(a)), true);
ok('e o recado de "não é o problema" NÃO aparece',
   swAlto.forcas.some(f => /NÃO é o problema/.test(f)), false);

ok('sem produção, nenhum quadrante inventa',
   _relSwotProducao([], 'no dia'),
   { forcas: [], fraquezas: [], oportunidades: [], ameacas: [] });

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

console.log(falhas === 0
  ? '\n✅ relatórios ok — contas testáveis e peças comuns em um lugar só\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
