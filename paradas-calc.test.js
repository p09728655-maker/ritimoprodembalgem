// Teste de paridade do cálculo de paradas.
//   node paradas-calc.test.js
//
// Por que ele existe: o desktop e o mobile já divergiram três vezes seguidas —
// base de dias, meta por dia e classificação das paradas — e toda vez alguém
// olhou dois números diferentes para o mesmo período sem saber em qual
// acreditar. Agora a conta é uma só (paradas-calc.js); este teste garante que
// ela continua se comportando como o combinado e que os HTMLs não voltaram a
// ter conta própria.

const fs = require('fs');
const path = require('path');
const dir = __dirname;

require(path.join(dir, 'paradas-calc.js'));
const RP = global.RP_PARADAS || globalThis.RP_PARADAS;

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

const CFG = { turnoInicio: '07:00', turnoFim: '17:00', almocoInicio: '11:00', almocoFim: '12:12', metaDia: 1680 };
// 8,8h produtivas. Meta 1.760 num dia → 200 cx/h exatos, p/ a conta fechar na mão.

console.log('\n── horas produtivas ──');
ok('turno 07-17 menos almoço = 8,8h', RP.horasProdutivas(CFG), 8.8);
ok('turno 05-17 (hora extra matinal) = 10,8h',
   RP.horasProdutivas(Object.assign({}, CFG, { turnoInicio: '05:00' })), 10.8);

console.log('\n── duração ──');
ok('1h = 60 min', RP.durMin('08:00', '09:00'), 60);
ok('parada SEM FIM não tem duração', RP.durMin('08:00', ''), null);
ok('hora inválida não tem duração', RP.durMin('8h', '9h'), null);

console.log('\n── classificação planejada ──');
ok('CLASSE da planilha manda sobre o nome',
   RP.ehPlanejada('Parada/Café', { 'Parada/Café': 'PLANEJADA' }), true);
ok('CLASSE NAO vence a heurística do nome',
   RP.ehPlanejada('Almoço', { 'Almoço': 'NAO' }), false);
ok('sem CLASSE, cai na heurística por nome', RP.ehPlanejada('Almoço', {}), true);
ok('nome fora da heurística e sem CLASSE = não planejada',
   RP.ehPlanejada('Parada/Café', {}), false);

console.log('\n── dias trabalhados ──');
const realByDay = { '01/08/2026': 1500, '02/08/2026': 0, '03/08/2026': 1400, '04/08/2026': 1600 };
ok('só dias com produção contam', RP.diasTrabalhados(realByDay, '01/08/2026', '04/08/2026'), 3);
ok('respeita o início do período', RP.diasTrabalhados(realByDay, '03/08/2026', '04/08/2026'), 2);
ok('sem histórico devolve 0 (quem chama cai na base antiga)', RP.diasTrabalhados(null), 0);

console.log('\n── perda: meta de CADA dia, não a de hoje ──');
// 03/08 tem meta 1.760 (200 cx/h) e 04/08 tem 880 (100 cx/h). Uma hora parada em
// cada um: 200 + 100 = 300. Com a meta de um dia só para os dois, daria 400.
const base = {
  cfg: CFG, hoje: '05/08/2026', metaHoje: 1760,
  metaByDay: { '03/08/2026': 1760, '04/08/2026': 880 },
  realByDay: { '03/08/2026': 1500, '04/08/2026': 1500, '05/08/2026': 1500 },
  de: '03/08/2026', ate: '05/08/2026', classeMap: {}
};
const paradas = [
  { data: '03/08/2026', tipo: 'MANUTENCAO', ini: '08:00', fim: '09:00' },
  { data: '04/08/2026', tipo: 'MANUTENCAO', ini: '08:00', fim: '09:00' }
];
let st = RP.stats(paradas, base);
ok('usa a meta de cada dia (200 + 100)', st.pecas, 300);
ok('tempo parado', st.totMin, 120);

console.log('\n── planejada não vira perda ──');
st = RP.stats(paradas.concat([{ data: '05/08/2026', tipo: 'ALMOÇO', ini: '11:00', fim: '12:12' }]), base);
ok('almoço entra no tempo parado', st.totMin, 192);
ok('mas não entra na perda', st.pecas, 300);

console.log('\n── parada em andamento (sem FIM) ──');
st = RP.stats(paradas.concat([{ data: '05/08/2026', tipo: 'MANUTENCAO', ini: '10:00', fim: '' }]), base);
ok('não conta como parada', st.nParadas, 2);
ok('não gera perda', st.pecas, 300);
ok('mas fica registrada no diagnóstico', st.diag.paradasIgnoradas, 1);

console.log('\n── base de dias: trabalhados, não "dias com parada" ──');
st = RP.stats(paradas, base);   // parada em 2 dias, mas 3 dias trabalhados
ok('divide por dias trabalhados', st.nDias, 3);
ok('marca a base usada', st.baseTrab, true);
ok('média/dia = 300 ÷ 3', st.media, 100);
const semHist = RP.stats(paradas, Object.assign({}, base, { realByDay: null }));
ok('sem histórico, cai em dias com parada', semHist.nDias, 2);
ok('e avisa qual base valeu', semHist.diag.baseDias, 'com parada');

console.log('\n── dia sem meta cai no metaDia padrão e aparece no diagnóstico ──');
st = RP.stats(paradas, Object.assign({}, base, { metaByDay: { '03/08/2026': 1760 } }));
ok('lista o dia sem meta', st.diag.diasSemMeta, ['04/08/2026']);
ok('usou o metaDia padrão nele (200 + 191)', st.pecas, 391);

console.log('\n── os HTMLs não podem ter conta própria ──');
// Guarda-corpo: se a conta voltar para dentro de um dos painéis, eles divergem
// de novo. Estes trechos só existiam nas cópias antigas.
['ritmoprod_embalagem_v7.html', 'ritmoprod_mobile.html'].forEach(f => {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  ok(f + ' não soma perda por conta própria', /pecas\s*\+=\s*perd/.test(src), false);
  ok(f + ' não acumula tempo não planejado', /totMinNP\s*\+=\s*d/.test(src), false);
  ok(f + ' carrega o paradas-calc.js', src.includes('src="/paradas-calc.js"'), true);
});

console.log(falhas === 0 ? '\n✅ paridade ok — a conta é uma só\n' : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
