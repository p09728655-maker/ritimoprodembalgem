// Teste do núcleo comum dos painéis.
//   node rp-core.test.js
//
// Duas coisas são verificadas aqui, e a segunda é a que mais importa a longo
// prazo: que as funções continuam se comportando como o combinado, E que
// nenhum dos dois HTMLs voltou a declarar a sua própria cópia delas. Foi a
// duplicação — não o cálculo em si — que já fez desktop e mobile mostrarem
// números diferentes para o mesmo turno.

const fs = require('fs');
const path = require('path');
const dir = __dirname;

// O rp-core.js é um <script> de navegador: declara as funções no escopo global
// e escreve em window. require() daria um escopo de módulo e as funções não
// apareceriam — então executamos o arquivo como script mesmo, com um window.
global.window = global;
require('vm').runInThisContext(fs.readFileSync(path.join(dir, 'rp-core.js'), 'utf8'));

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

console.log('\n── formatação ──');
ok('milhar com ponto', fmtN(8681), '8.681');
ok('nulo vira traço, não zero', fmtN(null), '—');
ok('texto vira traço', fmtN('abc'), '—');
ok('percentual com 1 casa', fmtP(118.53), '118,5%');
// pt-BR: milhar é ponto (fmtN) e decimal é vírgula (fmtP). Com toFixed(1) a
// mesma tela mostrava "8.681" e "89.6%" — o mesmo ponto com dois significados.
ok('o decimal é VÍRGULA, não ponto', fmtP(89.6), '89,6%');
ok('e o milhar continua ponto no fmtN', fmtN(8681), '8.681');
ok('percentual de três dígitos', fmtP(104.32), '104,3%');
ok('percentual nulo vira traço', fmtP(null), '—');
ok('número com 1 casa também é pt-BR', fmt1(7), '7,0');

console.log('\n── plural: "1 parada", não "1 parada(s)" ──');
// O "(s)" é linguagem de sistema; quem lê o painel é o operador e o gestor.
ok('singular', plural(1, 'parada', 'paradas'), '1 parada');
ok('plural',   plural(2, 'parada', 'paradas'), '2 paradas');
ok('zero é plural', plural(0, 'dia', 'dias'), '0 dias');
ok('milhar sai formatado', plural(1200, 'caixa', 'caixas'), '1.200 caixas');
ok('dois dígitos', p2(7), '07');

console.log('\n── horário ──');
ok('07:00 = 420 min', toMin('07:00'), 420);
ok('12:12 = 732 min', toMin('12:12'), 732);
ok('volta de minutos para hora', fromMin(732), '12:12');
ok('meia-noite', fromMin(0), '00:00');

console.log('\n── rótulo de horário (traços diferentes) ──');
// A planilha mistura traço comum, meia-risca e travessão. Sem normalizar, o
// mesmo horário vira duas chaves e o alerta de hora fraca deixa de comparar.
ok('traço comum', normHora('07:00-08:00'), '07:00-08:00');
ok('meia-risca vira traço', normHora('07:00–08:00'), '07:00-08:00');
ok('travessão vira traço', normHora('07:00—08:00'), '07:00-08:00');
ok('espaços somem', normHora(' 07:00 - 08:00 '), '07:00-08:00');
ok('slot pós-almoço preservado', normHora('12:12-13:00'), '12:12-13:00');

console.log('\n── data ──');
ok('Date vira dd/MM/aaaa', dtToStr(new Date(2026, 7, 17)), '17/08/2026');
ok('data inválida vira vazio', dtToStr(new Date('x')), '');
ok('não-data vira vazio', dtToStr('17/08/2026'), '');
ok('hoje no formato BR', /^\d{2}\/\d{2}\/\d{4}$/.test(hojeStr()), true);

console.log('\n── média por horário ──');
// Média ponderada pela amostra: 3 dias a 200 + 1 dia a 100 = 175, não 150.
ok('pondera pela amostra',
   mergeMedias({ '07:00-08:00': 200, '07:00–08:00': 100 }, { '07:00-08:00': 3, '07:00–08:00': 1 }),
   { medias: { '07:00-08:00': 175 }, amostra: { '07:00-08:00': 4 } });
ok('amostra zero não entra', mergeMedias({ '07:00-08:00': 200 }, { '07:00-08:00': 0 }),
   { medias: {}, amostra: {} });
ok('entrada vazia não quebra', mergeMedias(null, null), { medias: {}, amostra: {} });

console.log('\n── atraso acumulado ──');
// 1ª hora produz 100 de 200: a 2ª passa a dever 100 além da própria meta.
ok('o que faltou é cobrado da hora seguinte',
   calcAtrasoHoras([{ metaHora: 200, producaoHora: 100 }, { metaHora: 200, producaoHora: null }]),
   [{ atrasoHora: 0, metaEfetivaHora: 200 }, { atrasoHora: 100, metaEfetivaHora: 300 }]);
ok('produzir acima da meta não gera crédito negativo',
   calcAtrasoHoras([{ metaHora: 200, producaoHora: 300 }, { metaHora: 200, producaoHora: null }]),
   [{ atrasoHora: 0, metaEfetivaHora: 200 }, { atrasoHora: 0, metaEfetivaHora: 200 }]);
// Hora AINDA NÃO LANÇADA não pode ser cobrada como se tivesse produzido zero.
// Duas horas fechadas devendo 12 cx e duas pendentes: o atraso das pendentes
// continua 12 — não 190 e 368, que era o que a tela mostrava às 14:30 num dia
// que estava 12 cx atrás (a meta de cada hora futura entrava no acumulado).
ok('hora pendente não inventa atraso',
   calcAtrasoHoras([{ metaHora: 178, producaoHora: 190 }, { metaHora: 178, producaoHora: 154 },
                    { metaHora: 178, producaoHora: null }, { metaHora: 178, producaoHora: null }]),
   [{ atrasoHora: 0,  metaEfetivaHora: 178 }, { atrasoHora: 0,  metaEfetivaHora: 178 },
    { atrasoHora: 12, metaEfetivaHora: 190 }, { atrasoHora: 12, metaEfetivaHora: 190 }]);
// Hora que FECHOU sem produzir vem como 0 (o backend só manda null enquanto a
// hora está aberta) e continua sendo cobrada da hora seguinte.
ok('hora fechada em zero continua cobrada',
   calcAtrasoHoras([{ metaHora: 200, producaoHora: 0 }, { metaHora: 200, producaoHora: null }]),
   [{ atrasoHora: 0, metaEfetivaHora: 200 }, { atrasoHora: 200, metaEfetivaHora: 400 }]);
// HORA EXTRA não entra no acumulado — nem cobrando, nem abatendo. O caso real
// de 01/09/2026: dia começado às 05:00, a HE das 05:00 fechou 240 contra os 245
// da planilha e a hora SEGUINTE nascia com "(+5)" — atraso vindo de uma hora que
// o painel nem cobra (META/H e EFICIÊNCIA dela saem "—").
ok('hora extra não gera atraso para a hora seguinte',
   calcAtrasoHoras([{ metaHora: 245, producaoHora: 240, he: true },
                    { metaHora: 245, producaoHora: 360, he: true },
                    { metaHora: 245, producaoHora: null }]),
   [{ atrasoHora: 0, metaEfetivaHora: 245 }, { atrasoHora: 0, metaEfetivaHora: 245 },
    { atrasoHora: 0, metaEfetivaHora: 245 }]);
// E o contrário também: as caixas feitas fora do turno não quitam o atraso das
// horas de jornada — senão uma madrugada forte apagaria o atraso do turno.
ok('caixas de hora extra não abatem o atraso do turno',
   calcAtrasoHoras([{ metaHora: 245, producaoHora: 600, he: true },
                    { metaHora: 245, producaoHora: 100 },
                    { metaHora: 245, producaoHora: null }]),
   [{ atrasoHora: 0, metaEfetivaHora: 245 }, { atrasoHora: 0, metaEfetivaHora: 245 },
    { atrasoHora: 145, metaEfetivaHora: 390 }]);

console.log('\n── produto × cor ──');
// A cor saiu da DESCRICAO para coluna própria na PRODUTO_CODIGO. Quem imprime
// só a descrição mostra quatro linhas iguais para quatro cores diferentes —
// era o seletor de produto do app, com o lote 25076 abrindo quatro
// "VOL 1/2 PENTEADEIRA CAMARIM MEL" e o operador sem saber em qual tocar.
ok('a cor entra no rótulo', nomeComCor('VOL 1/2 PENTEADEIRA CAMARIM MEL', 'OFF WHITE'),
   'VOL 1/2 PENTEADEIRA CAMARIM MEL · OFF WHITE');
ok('sem cor cadastrada, o nome sai como sempre saiu',
   nomeComCor('VOL 1/2 PENTEADEIRA CAMARIM MEL', ''), 'VOL 1/2 PENTEADEIRA CAMARIM MEL');
// Linha antiga (planilha de antes da coluna COR) traz a cor no fim da própria
// descrição: repetir daria "MESA CENTRO LUNA 670 OFF WHITE · OFF WHITE".
ok('descrição que já termina com a cor não a repete',
   nomeComCor('MESA CENTRO LUNA 670 OFF WHITE', 'OFF WHITE'), 'MESA CENTRO LUNA 670 OFF WHITE');
ok('acento não engana a comparação', nomeComCor('ARMARIO IMBUIA', 'IMBUIA'), 'ARMARIO IMBUIA');
ok('só a cor, sem descrição', nomeComCor('', 'CUMARU'), 'CUMARU');
ok('nada de nada vira vazio, não "undefined"', nomeComCor(null, null), '');
ok('espaço sobrando não vira nome diferente', nomeComCor('  RACK BRITO 137 CM  ', ' MARSALA '),
   'RACK BRITO 137 CM · MARSALA');

console.log('\n── status por eficiência ──');
ok('96% está na meta', sc(96), 'ok');
ok('95.9% é atenção', sc(95.9), 'warn');
ok('89.9% é abaixo', sc(89.9), 'red');

console.log('\n── o turno gerado pelos dois painéis ──');
// getSlots NÃO é unificado de propósito (o mobile inclui as horas anteriores ao
// turno quando o operador entra mais cedo) — mas o RECORTE tem de ser o mesmo
// nos dois, senão os rótulos deixam de bater com a aba HORA_A_HORA. O v7 ficou
// sem a regra do pós-almoço e gerava 12:12–13:12 … 16:12–17:00, contrariando o
// item "NÃO ALTERAR" do CLAUDE.md e fazendo o normHora() do alerta de hora
// fraca não achar a média histórica de nenhum horário da tarde.
function pegaFn(arquivo, assinatura) {
  const src = fs.readFileSync(path.join(dir, arquivo), 'utf8');
  const i = src.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei em ' + arquivo + ': ' + assinatura);
  const j = src.indexOf('{', src.indexOf(')', i));
  let n = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') n++;
    else if (src[k] === '}' && --n === 0) return src.slice(i, k + 1);
  }
  throw new Error('função não fecha: ' + assinatura);
}
global.CFG = { turnoInicio: '07:00', turnoFim: '17:00', almocoInicio: '11:00', almocoFim: '12:12' };
global.nowMin = () => 8 * 60;   // 08:00 — o mobile não estende o turno para trás
const slotsV7  = new Function(pegaFn('ritmoprod_embalagem_v7.html', 'function getSlots(') +
                              '; return getSlots();')();
const slotsMob = new Function(pegaFn('ritmoprod_mobile.html', 'function getSlots(') +
                              '; return getSlots();')();
const rotulos = s => s.map(x => x.label);
ok('o slot pós-almoço fecha na hora cheia (v7)',  rotulos(slotsV7).includes('12:12–13:00'), true);
ok('o slot pós-almoço fecha na hora cheia (mobile)', rotulos(slotsMob).includes('12:12–13:00'), true);
ok('e ele é o mais curto do turno: 48 min',
   slotsV7.find(x => x.label === '12:12–13:00').min, 48);
ok('nenhum painel gera 12:12–13:12', rotulos(slotsV7).concat(rotulos(slotsMob)).includes('12:12–13:12'), false);
ok('os dois recortam o turno igual', rotulos(slotsV7), rotulos(slotsMob));
ok('a última hora do turno é inteira', rotulos(slotsV7).slice(-1), ['16:00–17:00']);

console.log('\n── eficiência contra o que a meta do dia já pedia ──');
// 31/08/2026, medido na TV: PROGRAMAÇÃO pedindo 2.709 cx no dia, HORA_A_HORA
// planejando 164 cx/h (1.476 no dia) e 1.350 cx feitas em 8 das 9 horas. O
// cartão escreveu 49,8% (1.350 ÷ 2.709) pintado com a cor de 102,9%
// (1.350 ÷ 8×164) — verde, "DENTRO DA META", com projeção de 1.519.
const _mt = 60 * 7 + 48 + 60;          // turno real: 7 horas cheias + 12:12-13:00 + a última
const _mr = _mt - 60;                  // 8 horas lançadas, falta a última
const rit = efNoRitmo(1350, 2709, _mr, _mt);
ok('a meta esperada é a do DIA rateada pelo turno rodado', Math.round(rit.metaAteAgora), 2401);
ok('e o dia que a TV pintou de verde está em 56%', Math.round(rit.ef), 56);
ok('56% não é "dentro da meta"', sc(rit.ef), 'red');
// O VEREDITO do ritmo é texto único do núcleo — e fala de RITMO, não de META.
// Foi a palavra "DENTRO DA META" ao lado do % da meta do dia que confundiu quem
// lia a TV em 01/09/2026: 103,8% verde num dia com 780 de 2.700 cx.
ok('no ritmo',        slRitmo(103.8), 'NO RITMO');
ok('atenção',         slRitmo(92),    'ATENÇÃO');
ok('abaixo do ritmo', slRitmo(56),    'ABAIXO DO RITMO');
ok('o veredito e a cor mudam de faixa no mesmo ponto',
   [96, 95.9, 90, 89.9].map(v => [slRitmo(v), sc(v)]),
   [['NO RITMO','ok'], ['ATENÇÃO','warn'], ['ATENÇÃO','warn'], ['ABAIXO DO RITMO','red']]);
// O rateio é por MINUTOS: tratar o slot pós-almoço como hora cheia estica o
// turno em 12 min que não existem e afrouxa a régua em 53 cx.
ok('o slot de 48 min não pode entrar como hora cheia',
   Math.round(efNoRitmo(1350, 2709, _mr, 60 * 9).metaAteAgora), 2348);
// No dia em que as duas metas concordam, nada muda para quem já usava o painel.
ok('meta do dia igual à soma das metas/hora: a régua é a mesma de antes',
   Math.round(efNoRitmo(1350, 1476, _mr, _mt).ef), 103);
ok('turno sem hora lançada não julga ninguém',
   efNoRitmo(0, 2709, 0, _mt), { metaAteAgora: 0, ef: 0 });
ok('sem meta do dia também não',
   efNoRitmo(1350, 0, _mr, _mt), { metaAteAgora: 0, ef: 0 });

console.log('\n── os painéis não podem ter cópia própria ──');
const FNS = ['toMin', 'fromMin', 'hojeStr', 'dtToStr', 'normHora', 'mergeMedias', 'calcAtrasoHoras', 'sc', 'slRitmo',
             'efNoRitmo', 'nomeComCor', '_rpOk'];
const CONSTS = ['p2', 'fmtN', 'fmt1', 'fmtP', 'plural'];
['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'].forEach(f => {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  ok(f + ' carrega o rp-core.js', src.includes('src="/rp-core.js"'), true);
  FNS.forEach(n => ok(`${f} não redeclara ${n}()`,
    new RegExp('^\\s*(?:async\\s+)?function\\s+' + n + '\\s*\\(', 'm').test(src), false));
  CONSTS.forEach(n => ok(`${f} não redeclara ${n}`,
    new RegExp('^\\s*(?:const|let|var)\\s+' + n + '\\s*=', 'm').test(src), false));
});

console.log(falhas === 0
  ? '\n✅ núcleo ok — uma implementação só para os dois painéis\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
