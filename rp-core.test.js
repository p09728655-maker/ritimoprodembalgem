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

console.log('\n── os painéis não podem ter cópia própria ──');
const FNS = ['toMin', 'fromMin', 'hojeStr', 'dtToStr', 'normHora', 'mergeMedias', 'calcAtrasoHoras', 'sc',
             'nomeComCor'];
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
