// Produto × cor: o relatório por modelo agrupa por PRODUTO, e a cor sai do
// nome para uma coluna própria.
//   node produto-cor.test.js
//
// O teste roda o código REAL: as funções são extraídas do ritmoprod_appscript.gs
// e do ritmoprod_embalagem_v7.html e avaliadas aqui, contra um catálogo de
// mentira montado com linhas de verdade da aba PRODUTO_CODIGO.
//
// O caso que deu origem a tudo: o código de 6 dígitos 501130 junta QUATRO
// produtos (mesa centro 670, centro 590, apoio 530 e lateral 440, de 7,3 a
// 4,0 kg). Como o nome saía do prefixo comum das variantes, o relatório
// mostrava só "MESA" — e somava os quatro numa linha só.

const fs = require('fs');
const path = require('path');
const GS   = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');
const HTML = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const JS   = [...HTML.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function pega(src, assinatura) {
  const i = src.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei: ' + assinatura);
  const j = src.indexOf('{', src.indexOf(')', i));
  let n = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') n++;
    else if (src[k] === '}' && --n === 0) return src.slice(i, k + 1);
  }
  throw new Error('função não fecha: ' + assinatura);
}

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

// ── dependências do backend ────────────────────────────────────────────────
let CATALOGO = [];
function lerCatalogoProdutos() { return CATALOGO; }
let _coresMemo = null, _prodBaseMemo = null;
function reset(cat) { CATALOGO = cat; _coresMemo = null; _prodBaseMemo = null; }

// const dentro de eval fica preso ao escopo do próprio eval — as funções
// extraídas não enxergariam. Vira var, que sobe para o escopo do teste.
eval(GS.match(/const CORES = \[[\s\S]*?\];/)[0].replace('const ', 'var '));
eval(GS.match(/const CORES_MIN_MODELOS = \d+;/)[0].replace('const ', 'var '));
eval(pega(GS, 'function limpaNomeModelo('));
eval(pega(GS, 'function _tokensDesc('));
eval(pega(GS, 'function _partesToken('));
eval(pega(GS, 'function _ehTokenCor('));
eval(pega(GS, 'function coresConhecidas('));
eval(pega(GS, 'function separaCorProduto('));
eval(pega(GS, 'function mapaProdutoBase('));
eval(pega(GS, 'function produtoDoCodigo('));

// ── 1) catálogo COM a coluna COR (o jeito certo: quem manda é a planilha) ──
console.log('\n── coluna COR da planilha manda ──');
// Linhas reais da PRODUTO_CODIGO depois da separação: DESCRICAO sem cor + COR.
reset([
  { codigo: '501130001', desc: 'VOL 1/1 MESA CENTRO LUNA 670',  cor: 'OFF WHITE' },
  { codigo: '501130002', desc: 'VOL 1/1 MESA CENTRO LUNA 670',  cor: 'BRANCO ACETINADO' },
  { codigo: '501130005', desc: 'VOL 1/1 MESA CENTRO LUNA 590',  cor: 'OFF WHITE' },
  { codigo: '501130009', desc: 'VOL 1/1 MESA APOIO LUNA 530',   cor: 'CUMARU' },
  { codigo: '501130013', desc: 'VOL 1/1 MESA LATERAL LUNA 440', cor: 'ALECRIM' },
  { codigo: '501060003', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', cor: 'OFF WHITE' },
]);
let p = produtoDoCodigo('501130001');
ok('nome sem cor, direto da descrição', p.base, 'MESA CENTRO LUNA 670');
ok('cor vem da coluna', p.cor, 'OFF WHITE');
ok('e o painel sabe de onde ela veio', p.fonte, 'planilha');
ok('o "VOL 1/1" não entra no nome', /VOL/.test(p.base), false);
ok('modelo continua sendo os 6 dígitos', p.modelo, '501130');
// O ponto da mudança: o mesmo 501130 agora tem quatro produtos.
const produtos130 = [...new Set(['501130001','501130002','501130005','501130009','501130013']
  .map(c => produtoDoCodigo(c).base))];
ok('o 501130 vira 4 produtos, não um "MESA" só', produtos130,
   ['MESA CENTRO LUNA 670', 'MESA CENTRO LUNA 590', 'MESA APOIO LUNA 530', 'MESA LATERAL LUNA 440']);
// MEL é nome de produto neste catálogo (CAMARIM MEL, ELOA, STRASS) — com a
// coluna COR preenchida não há sequer chance de confundir.
ok('CAMARIM MEL continua com o MEL no nome', produtoDoCodigo('501060003').base,
   'PENTEADEIRA CAMARIM MEL');

// ── 2) sem a coluna COR: a rede de segurança separa pelo texto ─────────────
console.log('\n── planilha antiga (sem COR): separação pelo texto ──');
reset([
  { codigo: '501130001', desc: 'VOL 1/1 MESA CENTRO LUNA 670 OFF WHITE' },
  { codigo: '501130002', desc: 'VOL 1/1 MESA CENTRO LUNA 670 BRANCO ACETINADO' },
  { codigo: '501130003', desc: 'VOL 1/1 MESA CENTRO LUNA 670 CUMARU' },
  { codigo: '501130004', desc: 'VOL 1/1 MESA CENTRO LUNA 670 ALECRIM' },
  { codigo: '501130009', desc: 'VOL 1/1 MESA APOIO LUNA 530 OFF WHITE' },
  { codigo: '501130013', desc: 'VOL 1/1 MESA LATERAL LUNA 440 ALECRIM' },
  { codigo: '501133004', desc: 'VOL 1/1 BOMBE PREMIER BRANCO ACETINADO/CUMARU' },
  { codigo: '501133001', desc: 'VOL 1/1 BOMBE PREMIER BRANCO' },
  { codigo: '501094001', desc: 'VOL 1/1 MESA CABECEIRA SLEEP OFF WHITE' },
  { codigo: '501097001', desc: 'VOL 1/1 KIT 2 MESA CABECEIRA SLEEP OFF WHITE' },
  { codigo: '501116001', desc: 'VOL 1/1 MESA COMPUTADOR MILLION' },
]);
ok('tira a cor do fim da descrição',
   [produtoDoCodigo('501130001').base, produtoDoCodigo('501130001').cor],
   ['MESA CENTRO LUNA 670', 'OFF WHITE']);
ok('cor de duas palavras sai inteira',
   [produtoDoCodigo('501130002').base, produtoDoCodigo('501130002').cor],
   ['MESA CENTRO LUNA 670', 'BRANCO ACETINADO']);
// "ACETINADO/CUMARU" é um token só com DUAS cores dentro — só é cor se todos
// os pedaços forem cor.
ok('cor composta com barra',
   [produtoDoCodigo('501133004').base, produtoDoCodigo('501133004').cor],
   ['BOMBE PREMIER', 'BRANCO ACETINADO/CUMARU']);
ok('produto sem cor no texto fica inteiro',
   [produtoDoCodigo('501116001').base, produtoDoCodigo('501116001').cor],
   ['MESA COMPUTADOR MILLION', '']);
ok('separou pelo texto, e diz isso', produtoDoCodigo('501130001').fonte, 'texto');
// SLEEP também vem logo antes de "OFF WHITE", mas só em 2 modelos: palavra de
// nome não pode virar cor por acaso.
ok('SLEEP não vira cor', produtoDoCodigo('501094001').base, 'MESA CABECEIRA SLEEP');
ok('nem no KIT', produtoDoCodigo('501097001').base, 'KIT 2 MESA CABECEIRA SLEEP');

// ── 3) cor nova, fora da lista fixa, é aprendida do próprio catálogo ───────
console.log('\n── cor que não está na lista fixa ──');
const comMarsala = [];
['501201', '501202', '501203', '501204'].forEach((m, i) => {
  comMarsala.push({ codigo: m + '001', desc: 'VOL 1/1 RACK BRITO ' + (137 + i) + ' CM MARSALA' });
});
reset(comMarsala);
ok('MARSALA não está na lista fixa', CORES.indexOf('MARSALA'), -1);
ok('mas fecha a descrição em 4 modelos → é cor',
   [produtoDoCodigo('501201001').base, produtoDoCodigo('501201001').cor],
   ['RACK BRITO 137 CM', 'MARSALA']);
// Com poucos modelos não há evidência: fica no nome (e a coluna COR da
// planilha resolve). Melhor um nome comprido que um nome errado.
reset([
  { codigo: '501201001', desc: 'VOL 1/1 RACK BRITO 137 CM MARSALA' },
  { codigo: '501202001', desc: 'VOL 1/1 RACK BRITO 160 CM MARSALA' },
]);
ok('em 2 modelos só, não arrisca', produtoDoCodigo('501201001').cor, '');

// ── 4) descrição toda de cor não pode zerar o nome ─────────────────────────
reset([{ codigo: '501999001', desc: 'VOL 1/1 BRANCO' }]);
ok('nunca devolve nome vazio', produtoDoCodigo('501999001').base, 'BRANCO');
reset([{ codigo: '501999002', desc: '' }]);
ok('código sem descrição não quebra',
   [produtoDoCodigo('501999002').base, produtoDoCodigo('501999002').cor], ['', '']);
ok('código fora do catálogo cai no modelo', produtoDoCodigo('501777001').fonte, 'sem catálogo');

// ── 4b) cor escrita pela metade é typo, não cor nova ──────────────────────
console.log('\n── cor abreviada na coluna COR ──');
// Números REAIS do catálogo (simulação de 18/08/2026): a mesma cor escrita de
// dois jeitos vira duas colunas no relatório. A comparação é palavra por
// palavra — é o que faz "PTO AC" aparecer mesmo com 4 linhas (não é raro) e
// "PRETO AC/NATURE" também, mesmo sem "PRETO ACETINADO/NATURE" existir ainda.
eval(pega(GS, 'function _soLetras('));
eval(pega(GS, 'function _cabeDentro('));
eval(pega(GS, 'function _palavrasCor('));
eval(pega(GS, 'function coresParaCorrigir('));
const CAT_REAL = {
  'BRANCO': 41, 'BRANCO/AZUL': 7, 'BCO/AZUL': 2, 'BRANCO/ROSA': 7, 'BCO/ROSA': 2,
  'BRANCO ACETINADO': 13, 'BRANCO AC': 2, 'BRANCO ACETINAD': 1,
  'BRANCO ACETINADO/CUMARU': 4, 'BRANCO AC/CUMARU': 1,
  'PRETO ACETINADO': 16, 'PRETO AC': 1, 'PRETO ACETINDO': 1, 'PTO AC': 4,
  'PRETO AC/NATURE': 1, 'PRETO/CEDRO': 8,
  'OFF WHITE': 100, 'OFF WHITE/CINAMOMO': 34, 'OFF WHITE/CINA': 1, 'OFF WHITE/CINAMO': 1,
  'CINAMOMO': 40, 'CINAMOMO/OFF WHITE': 12, 'ALECRIM': 8, 'ALECRIM/CINAMOMO': 3,
  'CUMARU': 20, 'ROSA': 4, 'WHISKY': 4, 'FREIJO': 6,
};
const corrigir = coresParaCorrigir(CAT_REAL);
const sugestao = c => (corrigir.find(x => x.cor === c) || {}).sug;
ok('BCO/AZUL → BRANCO/AZUL', sugestao('BCO/AZUL'), 'BRANCO/AZUL');
ok('BCO/ROSA → BRANCO/ROSA', sugestao('BCO/ROSA'), 'BRANCO/ROSA');
ok('BRANCO AC → BRANCO ACETINADO', sugestao('BRANCO AC'), 'BRANCO ACETINADO');
ok('BRANCO ACETINAD → BRANCO ACETINADO', sugestao('BRANCO ACETINAD'), 'BRANCO ACETINADO');
ok('BRANCO AC/CUMARU → BRANCO ACETINADO/CUMARU',
   sugestao('BRANCO AC/CUMARU'), 'BRANCO ACETINADO/CUMARU');
ok('OFF WHITE/CINA → OFF WHITE/CINAMOMO', sugestao('OFF WHITE/CINA'), 'OFF WHITE/CINAMOMO');
ok('PRETO ACETINDO → PRETO ACETINADO', sugestao('PRETO ACETINDO'), 'PRETO ACETINADO');
// Os dois que a regra por cor INTEIRA deixava passar:
ok('PTO AC → PRETO ACETINADO, mesmo com 4 linhas', sugestao('PTO AC'), 'PRETO ACETINADO');
ok('PRETO AC/NATURE é apontado mesmo sem a grafia certa existir',
   sugestao('PRETO AC/NATURE'), 'PRETO ACETINADO/NATURE');
ok('e o log avisa que essa grafia ainda não existe',
   (corrigir.find(x => x.cor === 'PRETO AC/NATURE') || {}).nSug, 0);
// Cor legítima não pode ser apontada como erro de outra.
['BRANCO', 'PRETO ACETINADO', 'OFF WHITE', 'OFF WHITE/CINAMOMO', 'CINAMOMO/OFF WHITE',
 'ALECRIM/CINAMOMO', 'CUMARU', 'ROSA', 'WHISKY', 'FREIJO', 'PRETO/CEDRO'].forEach(c => {
  ok('não mexe em ' + c, sugestao(c), undefined);
});
// A regra por cor INTEIRA achava 9 neste mesmo catálogo; palavra por palavra
// acha as 11 — as duas que faltavam são PTO AC e PRETO AC/NATURE.
ok('acha as 11 grafias erradas do catálogo', corrigir.length, 11);

// ── 5) painel: a tabela do dia agrupa por PRODUTO e junta as cores ─────────
console.log('\n── painel: uma linha por produto, cores na coluna ──');
let PONTOS_DIA = { porHoraModelo: [
  { hora: '07:00', modelo: '501130', nome: 'MESA CENTRO LUNA 670',  cor: 'OFF WHITE', caixas: 100, pesoKg: 730, pontos: 5600, tetoCxH: 376 },
  { hora: '08:00', modelo: '501130', nome: 'MESA CENTRO LUNA 670',  cor: 'CUMARU',    caixas:  50, pesoKg: 365, pontos: 2800, tetoCxH: 376 },
  { hora: '08:00', modelo: '501130', nome: 'MESA LATERAL LUNA 440', cor: 'ALECRIM',   caixas:  40, pesoKg: 160, pontos: 1760, tetoCxH: 415 },
]};
// o rp-core.js dá normHora/toMin, que a contagem de trocas usa
global.window = global;
require('vm').runInThisContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'));
eval(pega(JS, 'function _phTetoOper('));
eval(pega(JS, 'function _phTroca('));
eval(pega(JS, 'function _phHoraMin('));
eval(pega(JS, 'function _phEntradasDia('));
const TROCA_PREMISSA=eval('('+JS.match(/const TROCA_PREMISSA\s*=\s*(\{[^}]*\})/)[1]+')');
eval(pega(JS, 'function _phMinTrocaDia('));
// o valor real do padrão de troca, extraído do próprio painel (não duplicar 5 aqui)
const TROCA_MIN_PADRAO = Number((JS.match(/const TROCA_MIN_PADRAO\s*=\s*([\d.]+)/) || [])[1]);
// sem medição das paradas (é o caso do teste): a régua cai no valor da planilha
let TROCA_OBS = null;
function trocaObs(){ return TROCA_OBS; }
eval(pega(JS, 'function calcPorModelo('));
const r = calcPorModelo();
ok('produtos diferentes do mesmo código não somam juntos', r.linhas.length, 2);
ok('as cores do MESMO produto somam numa linha só', r.linhas[0].caixas, 150);
ok('e aparecem na coluna COR', r.linhas[0].cor, 'CUMARU · OFF WHITE');
ok('peso continua saindo do código, só somado depois', r.linhas[0].pesoKg, 1095);
ok('a coluna COR entra quando há cor', r.temCor, true);
ok('o teto do dia acompanha (mesma régua do período)', Math.round(r.linhas[0].teto), 376);
// A régua é a PREMISSA: 30 min/dia de troca, rateados pelo tempo de esteira.
// A LUNA 670 ocupou as DUAS horas do dia (a LATERAL dividiu a segunda com ela),
// então paga os 30 min inteiros: 376 × (120−30)/120 = 282. O físico (l.teto)
// fica intacto. A contagem de entradas continua, mas como informação.
ok('o teto exibido desconta a fatia da premissa (376 → 282)', Math.round(r.linhas[0].tetoOper), 282);
ok('quem ocupou a linha inteira paga os 30 min', r.linhas[0].minTroca, 30);
ok('rodou direto = 1 entrada na linha (informação)', r.linhas[0].nTroc, 1);
ok('sem trocaMin do backend vale o padrão do painel', r.linhas[0].troca, TROCA_MIN_PADRAO);

// Saiu e VOLTOU no mesmo dia: a régua antiga (1 por dia) cobrava uma troca; a
// linha pagou duas. LUNA 670 roda 07:00, a LATERAL entra às 08:00 e a 670
// volta às 09:00 → 2 trocas de 5 min em 120 min: 376 × 110/120 = 345.
PONTOS_DIA = { porHoraModelo: [
  { hora: '07:00', modelo: '501130', nome: 'MESA CENTRO LUNA 670',  cor: 'OFF WHITE', caixas: 100, pesoKg: 730, pontos: 5600, tetoCxH: 376 },
  { hora: '08:00', modelo: '501130', nome: 'MESA LATERAL LUNA 440', cor: 'ALECRIM',   caixas:  40, pesoKg: 160, pontos: 1760, tetoCxH: 415 },
  { hora: '09:00', modelo: '501130', nome: 'MESA CENTRO LUNA 670',  cor: 'OFF WHITE', caixas:  90, pesoKg: 657, pontos: 5040, tetoCxH: 376 },
]};
const rVolta = calcPorModelo();
ok('saiu e voltou no mesmo dia = 2 entradas (informação)', rVolta.linhas[0].nTroc, 2);
// Ocupou 2 das 3 horas da linha → 20 dos 30 min: 376 × (120−20)/120 = 313.
ok('e paga a fatia proporcional da premissa (376 → 313)', Math.round(rVolta.linhas[0].tetoOper), 313);
// A duração medida nas paradas é INFORMAÇÃO desde a premissa dos 30 min: entra
// na nota de conferência do relatório, não na régua.
TROCA_OBS = { min: 12, n: 9 };
const rObs = calcPorModelo();
ok('a medição continua disponível para conferir', rObs.linhas[0].troca, 12);
ok('mas o teto segue a premissa, não a medição', Math.round(rObs.linhas[0].tetoOper), 313);
TROCA_OBS = null;
PONTOS_DIA = { porHoraModelo: [
  { hora: '07:00', modelo: '501130', nome: 'MESA CENTRO LUNA 670',  cor: 'OFF WHITE', caixas: 100, pesoKg: 730, pontos: 5600, tetoCxH: 376 },
  { hora: '08:00', modelo: '501130', nome: 'MESA CENTRO LUNA 670',  cor: 'CUMARU',    caixas:  50, pesoKg: 365, pontos: 2800, tetoCxH: 376 },
  { hora: '08:00', modelo: '501130', nome: 'MESA LATERAL LUNA 440', cor: 'ALECRIM',   caixas:  40, pesoKg: 160, pontos: 1760, tetoCxH: 415 },
]};
ok('e a coluna % TETO EST. entra quando o backend manda teto', r.temTeto, true);
// Backend antigo não manda cor: a coluna some, em vez de virar parede de "—".
PONTOS_DIA = { porHoraModelo: [
  { hora: '07:00', modelo: '501130', nome: 'MESA', caixas: 10, pesoKg: 73, pontos: 560 },
]};
const rAntigo=calcPorModelo();
ok('sem cor nenhuma, a coluna não entra', rAntigo.temCor, false);
ok('sem teto (backend antigo), a % TETO EST. também some', rAntigo.temTeto, false);

// ── 5b) teto físico da esteira por código ─────────────────────────────────
console.log('\n── teto da esteira ──');
// velocidade (m/min) × 60.000 ÷ (medida da caixa + entre-peças, mm).
eval(pega(GS, 'function _tetoEsteiraCxH('));
ok('caixa de 1.006 mm + 350 de vão a 8,5 m/min ≈ 376 cx/h',
   Math.round(_tetoEsteiraCxH({ velocidade: 8.5, medida: 1006, entrePeca: 350 })), 376);
ok('sem entre-peças o teto sobe (por isso ler a coluna importa)',
   Math.round(_tetoEsteiraCxH({ velocidade: 8.5, medida: 1006, entrePeca: 0 })), 507);
ok('sem medida não há teto (0, coluna some)', _tetoEsteiraCxH({ velocidade: 8.5, medida: 0 }), 0);
ok('sem velocidade idem', _tetoEsteiraCxH({ velocidade: 0, medida: 1006 }), 0);
ok('produto fora do catálogo não quebra', _tetoEsteiraCxH(null), 0);
// O cabeçalho real da planilha é "ENTRE_PECAS (mm)" — a busca é por prefixo;
// o indexOf exato devolvia -1 e o campo chegava 0 em silêncio.
ok('a leitura do catálogo busca ENTRE_PECA por prefixo',
   /indexOf\('ENTRE_PECA'\) === 0/.test(GS), true);

// ── 5c) simulação da esteira no editor: mesma conta do painel ─────────────
console.log('\n── simularEsteiraPorModelo (log do editor) ──');
// A função roda no editor e imprime a leitura da coluna % TETO EST. em formato
// de relatório. A média aparada dela tem que bater com a do painel
// (_phMediaAparada): VIVARE 122, MADERO 148 — divergência aqui repetiria a
// história da conta de paradas.
const LOGS = [];
const Logger = { log: m => LOGS.push(String(m)) };
const Utilities = { formatDate: () => '01/01/2026' };
const TZ = 'America/Sao_Paulo';
const _mkItens = [];
const _addDia = (nome, data, cxh, teto) => _mkItens.push({ modelo: nome.slice(0,4), nome, data,
  caixas: cxh, horas: 1, mediaHora: cxh, tetoCxH: teto });
[[ '23/07',118],['05/08',178],['12/08',187],['13/08',91]].forEach(([d,v])=>_addDia('MESA CABECEIRA MADERO', d, v, 291));
[[ '24/07',59],['10/08',122],['11/08',122]].forEach(([d,v])=>_addDia('SAPATEIRA VIVARE', d, v, 310));
[[ '13/08',2],['14/08',1],['17/08',318],['18/08',84]].forEach(([d,v])=>_addDia('MESA LATERAL DECOR 470', d, v, 300));
[[ '04/08',139],['05/08',46]].forEach(([d,v])=>_addDia('LIVREIRO ENCANTO', d, v, 0));
function getProducaoModeloPeriodo() { return { ok: true, itens: _mkItens }; }
// Paradas do período: é daqui que sai a DURAÇÃO média da troca. Vazio = sem
// amostra, e a régua cai no TEMPO DE TROCA MIN do catálogo.
let _mkParadas = [];
function getParadasPeriodo() { return { ok: true, paradas: _mkParadas }; }
// os limites saem do próprio .gs (const dentro de eval não vaza para cá)
const PAR_TROCA_RE      = eval(GS.match(/const PAR_TROCA_RE\s*=\s*(.+);/)[1]);
const TROCA_OBS_MIN_N   = Number(GS.match(/const TROCA_OBS_MIN_N\s*=\s*(\d+)/)[1]);
const TROCA_OBS_MAX_MIN = Number(GS.match(/const TROCA_OBS_MAX_MIN\s*=\s*(\d+)/)[1]);
// a premissa do backend tem que ser a MESMA do painel — o teste confere abaixo
const TROCA_PREM_MIN_DIA = Number(GS.match(/const TROCA_PREM_MIN_DIA\s*=\s*(\d+)/)[1]);
const TROCA_PREM_TROCAS  = Number(GS.match(/const TROCA_PREM_TROCAS\s*=\s*(\d+)/)[1]);
const TROCA_PREM_MIN     = Number(GS.match(/const TROCA_PREM_MIN\s*=\s*(\d+)/)[1]);
eval(pega(GS, 'function _horaStr('));
eval(pega(GS, 'function _heMinutosDaHora('));
eval(pega(GS, 'function _entradasDia('));
eval(pega(GS, 'function _trocaObsMin('));
eval(pega(GS, 'function _trocasLinhaPorDia('));
eval(pega(GS, 'function _horasDeEntrada('));
eval(pega(GS, 'function _prepDoDia('));
eval(pega(GS, 'function simularEsteiraPorModelo('));

// ── preparações lidas na ORDEM das linhas do log ──────────────────────────
// Cada bipe é uma linha (20 cx) e a PRODUCAO_PRODUTO é append-only: a ordem das
// linhas é a ordem dos fatos. Foi o PPCP que apontou (20/08/2026) que a mesma
// hora traz mais de um produto — a leitura por hora perdia isso.
console.log('\n── preparações pela ordem das linhas ──');
const prep = (porHora, horas) => _prepDoDia(porHora, horas).prep;
ok('hora inteira no mesmo produto = 1 preparação',
   prep({ '09:00': ['A','A','A','A','A'] }, ['09:00']), 1);
ok('trocou DENTRO da hora = 2 preparações',
   prep({ '09:00': ['A','A','A','B','B'] }, ['09:00']), 2);
ok('e três produtos na mesma hora = 3',
   prep({ '09:00': ['A','A','B','B','C'] }, ['09:00']), 3);
// Ninguém troca de produto a cada 20 caixas: alternância é a esteira de dois
// lados rodando dois produtos ao mesmo tempo.
ok('alternância NÃO é troca a cada bipe: conta os produtos distintos',
   prep({ '09:00': ['A','B','A','B','A','B'] }, ['09:00']), 2);
ok('e a hora fica marcada como paralela',
   _prepDoDia({ '09:00': ['A','B','A','B'] }, ['09:00']).paralelo, true);
ok('hora sem alternância não é marcada',
   _prepDoDia({ '09:00': ['A','A','B','B'] }, ['09:00']).paralelo, false);
// Continuação entre horas: o mesmo produto atravessando 09h→10h é UMA corrida.
ok('produto que atravessa a hora não conta duas vezes',
   prep({ '09:00': ['A','A'], '10:00': ['A','A'] }, ['09:00','10:00']), 1);
ok('produto novo na hora seguinte conta',
   prep({ '09:00': ['A','A'], '10:00': ['B','B'] }, ['09:00','10:00']), 2);
ok('saiu e voltou = três preparações',
   prep({ '09:00': ['A'], '10:00': ['B'], '11:00': ['A'] }, ['09:00','10:00','11:00']), 3);
// O caso da foto: 9 bipes do mesmo produto às 09:00 e mais 5 às 10:00.
ok('o dia da foto (mesmo produto o tempo todo) = 1 preparação',
   prep({ '09:00': ['E','E','E','E','E','E','E','E','E'], '10:00': ['E','E','E','E','E'] },
        ['09:00','10:00']), 1);
ok('dia vazio não inventa preparação', prep({}, []), 0);
simularEsteiraPorModelo(30);
const linha = nome => LOGS.find(l => l.indexOf(nome) === 0) || '';
const cols = nome => linha(nome).replace(nome, '').trim().split(/\s+/);
// colunas: dias · trocas · cx · aparada · melhor · teto · %teto · %melhor
ok('MADERO: aparada 148 (não 164), melhor 187',
   cols('MESA CABECEIRA MADERO').slice(3, 5), ['148', '187']);
ok('VIVARE: aparada 122 (não 87)', cols('SAPATEIRA VIVARE')[3], '122');
// O % é contra o teto OPERACIONAL, não o físico: sem lista de horas a premissa
// cai nos 5 min por dia rodado (4 dias = 20 min de 240), então 291 → 267 e a
// MADERO usa 148/267 = 55%.
ok('% do teto da MADERO = 148/267 (teto já sem a troca)', cols('MESA CABECEIRA MADERO')[6], '55%');
ok('produto sem teto mostra — nas três colunas',
   cols('LIVREIRO ENCANTO').slice(5), ['—', '—', '—']);
// Sem horasLista (backend antigo) cada dia rodado conta 1 troca — a régua
// velha. E "dias" é dia DISTINTO: o mesmo produto em duas cores no mesmo dia
// era contado como dois dias, inflando dias e desconto.
ok('sem lista de horas, trocas = dias rodados', cols('MESA CABECEIRA MADERO')[1], '4');
ok('dia a <30% do padrão vira alerta de apontamento',
   LOGS.some(l => /CONFERIR APONTAMENTO/.test(l) && /DECOR 470 em 13\/08: 2 cx\/h/.test(l)), true);
// 318 cx/h com teto de 300 é fisicamente impossível: mais caixas do que cabem
// na esteira. É lançamento errado — e não pode virar "recorde" no veredito.
ok('dia ACIMA do teto físico é acusado como impossível',
   LOGS.some(l => /DECOR 470 em 17\/08: 318 cx\/h ACIMA do teto físico \(300\)/.test(l)), true);
ok('dia fraco de verdade (59 da VIVARE) NÃO é acusado',
   LOGS.some(l => /VIVARE em 24\/07/.test(l)), false);
ok('resumo por último — e o dia impossível não vira "esteira no limite"',
   /RESUMO:.*NÃO é o gargalo/.test(LOGS[LOGS.length - 1]), true);

// ── simulação com OUTRA esteira: simularEsteiraPorModelo(30, 17, 350) ─────
// O teto recalcula pela medida média do mix de cada produto; o log avisa que
// é simulação e mostra o real da planilha ao lado.
function _esteiraBase(){ return { vel: 8.5, entre: 350, uniforme: true }; }
_mkItens.forEach(it => { it.mixMm = it.tetoCxH > 0 ? Math.round(8.5*60000/it.tetoCxH) - 350 : 0; });
LOGS.length = 0;
simularEsteiraPorModelo(30, 17, 350);
ok('o log abre avisando que é simulação',
   /SIMULAÇÃO ESTEIRA: 17 m\/min · 350 mm/.test(LOGS.find(l=>/SIMULAÇÃO/.test(l))||''), true);
ok('e mostra o real da planilha ao lado', /real na planilha: 8\.5 · 350/.test(LOGS.find(l=>/SIMULAÇÃO/.test(l))||''), true);
// Dobrando a velocidade (8,5 → 17), o teto FÍSICO de cada produto dobra: a
// MADERO vai de 291 para 582 — e a coluna mostra o operacional, esse mesmo 582
// já sem os 20 min de troca dos 4 dias (582 × 220/240 = 533).
ok('teto da MADERO dobra com o dobro de velocidade',
   cols('MESA CABECEIRA MADERO')[5], '533');
ok('produto sem teto continua sem teto na simulação',
   cols('LIVREIRO ENCANTO').slice(5), ['—', '—', '—']);

// ── trocas: quantas foram (log hora a hora) e quanto duraram (paradas) ────
// 20/08: a MADERO roda às 07:00, a VIVARE entra às 08:00 e a MADERO VOLTA às
// 09:00. A régua antiga cobrava 1 troca por dia rodado; a linha pagou 3 (2 da
// MADERO, 1 da VIVARE). A duração sai da média aparada das paradas de troca
// apontadas — 10, 12 e 15 min com uma esquecida de 5h fora → 12 min.
LOGS.length = 0;
_mkItens.length = 0;
_mkItens.push({ modelo: '5011', nome: 'MESA CABECEIRA MADERO', data: '20/08', caixas: 200,
                horas: 2, mediaHora: 100, tetoCxH: 291, trocaMin: 5, horasLista: ['07:00', '09:00'] });
_mkItens.push({ modelo: '5012', nome: 'SAPATEIRA VIVARE', data: '20/08', caixas: 100,
                horas: 1, mediaHora: 100, tetoCxH: 310, trocaMin: 5, horasLista: ['08:00'] });
_mkParadas = [
  { tipo: 'Troca de produto', ini: '07:55', fim: '08:07' },
  { tipo: 'Setup',            ini: '08:50', fim: '09:00' },
  { tipo: 'Troca de produto', ini: '10:00', fim: '10:15' },
  { tipo: 'Almoço',           ini: '11:00', fim: '12:12' },
  { tipo: 'Troca de produto', ini: '13:00', fim: '18:00' },
];
simularEsteiraPorModelo(30);
// A de 5 h (13:00→18:00) é apontamento esquecido, não troca: fica fora, e as 3
// que sobraram viram a média aparada de 12 min — que o log mostra para
// CONFERIR a premissa, sem entrar na conta.
ok('o log abre dizendo que a régua é a premissa',
   /PREMISSA: teto\/%teto descontam 30 min\/dia de troca de produto \(6 × 5 min\)/.test(
     LOGS.find(l => /^PREMISSA:/.test(l)) || ''), true);
ok('e mostra a medição ao lado, para conferir',
   /as paradas de troca apontadas duraram 12 min em média \(3 amostra\(s\)\)/.test(
     LOGS.find(l => /^CONFERIR:/.test(l)) || ''), true);
// A premissa do .gs e a do painel são o MESMO número — se uma andar sem a
// outra, tela e log do editor passam a mostrar tetos diferentes.
ok('a premissa do backend bate com a do painel',
   [TROCA_PREM_MIN_DIA,TROCA_PREM_TROCAS,TROCA_PREM_MIN],
   [TROCA_PREMISSA.minDia,TROCA_PREMISSA.trocasDia,TROCA_PREMISSA.min]);
ok('MADERO saiu e voltou: 2 trocas num dia só', cols('MESA CABECEIRA MADERO')[1], '2');
ok('VIVARE entrou uma vez: 1 troca', cols('SAPATEIRA VIVARE')[1], '1');
// A MADERO ocupou 2 das 3 horas da linha no dia → 20 dos 30 min da premissa:
// 291 × (120 − 20) ÷ 120 = 242.
ok('e o teto operacional desconta a fatia da premissa', cols('MESA CABECEIRA MADERO')[5], '243');
// "quantas trocas deram na média por dia?" — 2 da MADERO + 1 da VIVARE num dia.
// MADERO entra 07h e volta 09h, VIVARE entra 08h: 3 preparações em 3 horas
// distintas, então nada foi simultâneo e são 3 paradas de esteira também.
ok('o log responde quantas preparações e paradas de esteira por dia',
   /o log mostra 3 preparação\(ões\)\/dia em 3 parada\(s\) de esteira\/dia/.test(
     LOGS.find(l => /^CONFERIR:/.test(l)) || ''), true);
ok('e compara com a premissa em uso',
   /36 min\/dia · premissa em uso: 30 min\/dia/.test(LOGS.find(l => /^CONFERIR:/.test(l)) || ''), true);

// Duas CORES do mesmo produto no mesmo dia são UM dia — o log vem por
// data × modelo × produto × cor. Contando item, o simulador dizia "1 dia" com
// um "melhor dia" diferente da média (leitura impossível) e a aparada podava
// cor em vez de dia, divergindo do _phMediaAparada do painel.
LOGS.length = 0;
_mkItens.length = 0;
_mkParadas = [];
_mkItens.push({ modelo: '5011', nome: 'RACK DUAS CORES', data: '21/08', cor: 'OFF WHITE', caixas: 100,
                horas: 1, mediaHora: 100, tetoCxH: 300, trocaMin: 0, horasLista: ['07:00'] });
_mkItens.push({ modelo: '5011', nome: 'RACK DUAS CORES', data: '21/08', cor: 'CUMARU', caixas: 80,
                horas: 1, mediaHora: 80, tetoCxH: 300, trocaMin: 0, horasLista: ['08:00'] });
simularEsteiraPorModelo(30);
ok('duas cores no mesmo dia = 1 dia', cols('RACK DUAS CORES')[0], '1');
ok('e a média do dia soma as duas cores (180 cx em 2 h)', cols('RACK DUAS CORES')[3], '90');
ok('com um dia só, melhor dia = a própria média', cols('RACK DUAS CORES')[4], '90');
ok('e o produto entrou na linha uma vez só', cols('RACK DUAS CORES')[1], '1');

// ── 6) guarda-corpo: o agrupamento do comparativo é UM só ──────────────────
console.log('\n── o comparativo não pode voltar a ter duas regras ──');
// A tela e o PDF liam o mesmo seletor com duas cópias do keyOf/labelOf: a
// primeira mudança em uma só faria o relatório contar diferente da tela.
ok('_phAgrup declarado uma única vez', (JS.match(/function _phAgrup\(/g) || []).length, 1);
// O FILTRO enxerga o produto inteiro: no nível MODELO + COR, escolher o
// 501149 MADERO traz TODAS as cores dele (as linhas seguem abertas por cor).
const _fakeSel = nivel => { global.document = { getElementById: () => ({ value: nivel }) };
  eval(pega(JS, 'function _phAgrup(')); return _phAgrup(); };
const it149a = { modelo:'501149', nome:'MESA CABECEIRA MADERO', cor:'OFF WHITE/CINAMOMO', familia:'MESA CABECEIRA' };
const it149b = { modelo:'501149', nome:'MESA CABECEIRA MADERO', cor:'BRANCO', familia:'MESA CABECEIRA' };
const aCor = _fakeSel('cor');
ok('agrupamento por cor separa as linhas', aCor.keyOf(it149a) === aCor.keyOf(it149b), false);
ok('mas o filtro junta as cores do mesmo produto', aCor.keyFil(it149a), aCor.keyFil(it149b));
ok('e o rótulo do filtro é o produto, sem cor', aCor.labelFil(it149a), '501149 · MESA CABECEIRA MADERO');
// A chave do filtro é a MESMA nos dois níveis: a seleção sobrevive à troca.
const aMod = _fakeSel('modelo');
ok('trocar MODELO ↔ MODELO+COR preserva a seleção', aMod.keyFil(it149a), aCor.keyFil(it149a));
// Na família, filtro e agrupamento continuam sendo a mesma coisa.
const aFam = _fakeSel('familia');
ok('na família, filtro = agrupamento', aFam.keyFil(it149a), aFam.keyOf(it149a));
ok('tela e PDF usam ele', (JS.match(/\}=_phAgrup\(\)/g) || []).length, 2);
ok('nenhuma cópia solta do keyOf', (JS.match(/const keyOf\s+=it=>/g) || []).length, 0);
// O agrupamento por MODELO precisa incluir o nome — senão os quatro produtos do
// 501130 voltam a virar uma linha só.
ok('a chave do comparativo carrega o produto',
   /it\.modelo\+'\|'\+\(it\.nome\|\|''\)/.test(JS), true);

// ── 7) o APP do operador: sem a cor, quatro linhas IDÊNTICAS ──────────────
// O caso que trouxe isto: o lote 25076 abre quatro produtos no seletor do
// celular e os quatro aparecem como "PENTEADEIRA CAMARIM MEL". Com a cor em
// coluna própria, a descrição sozinha deixou de identificar o produto — e
// ninguém tocou no app quando a planilha mudou.
console.log('\n── o app do operador mostra a COR ──');

// nomeComCor mora no rp-core.js (implementação única dos dois painéis) — já
// carregado lá em cima, junto com o normHora/toMin da contagem de trocas.
const MOB = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
const MJS = [...MOB.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

// Catálogo do app (o que o getProdutos devolve) — as quatro linhas da foto.
var PRODUTOS = [
  { codigo: '501060001', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', cor: 'OFF WHITE' },
  { codigo: '501060002', desc: 'VOL 2/2 PENTEADEIRA CAMARIM MEL', cor: 'OFF WHITE' },
  { codigo: '501060003', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', cor: 'CUMARU'    },
  { codigo: '501060004', desc: 'VOL 2/2 PENTEADEIRA CAMARIM MEL', cor: 'CUMARU'    }
];
eval(pega(MJS, 'function normTxt('));
eval(pega(MJS, 'function corDeProduto('));
eval(pega(MJS, 'function descRepetidas('));
eval(pega(MJS, 'function corChipHtml('));
eval(pega(MJS, 'function linhaProdutoHtml('));

// A lista de HOJE (getProgramacaoHoje) vem sem cor enquanto o .gs não for
// re-deployado: a cor tem de sair do catálogo, senão o operador fica sem ela
// justamente na lista que mais usa.
const doLote = [
  { codigo: '501060001', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', lote: 25076 },
  { codigo: '501060003', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', lote: 25076 }
];
ok('item sem cor busca no catálogo', corDeProduto(doLote[1]), 'CUMARU');
ok('cor do próprio item tem prioridade',
   corDeProduto({ codigo: '501060003', desc: 'x', cor: 'ALECRIM' }), 'ALECRIM');
ok('código fora do catálogo não quebra', corDeProduto({ codigo: '999999' }), '');

const rep = descRepetidas(doLote);
// O item na tela = linha do código (com a etiqueta da cor) + linha do nome.
const html = doLote.map(p => corChipHtml(p, rep) + linhaProdutoHtml(p));
ok('as duas linhas do lote deixam de ser iguais', html[0] === html[1], false);
ok('e a cor aparece em cada uma',
   [/OFF WHITE/.test(html[0]), /CUMARU/.test(html[1])], [true, true]);
ok('a cor vai em etiqueta própria, não no fim da frase',
   /class="prod-search-cor">OFF WHITE</.test(html[0]), true);
// A etiqueta fica na linha do CÓDIGO: pendurada no fim de um nome comprido ela
// caía numa terceira linha e engordava o item — e a lista tem altura fixa.
ok('e a descrição continua sozinha na linha dela',
   /prod-search-cor/.test(linhaProdutoHtml(doLote[0])), false);

// Sem cor em lugar nenhum (planilha sem a coluna preenchida): a linha repetida
// avisa, em vez de deixar duas iguais sem explicação.
PRODUTOS = [{ codigo: '501060001', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', cor: '' },
            { codigo: '501060003', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', cor: '' }];
const semCor = descRepetidas(doLote);
ok('descrição repetida e sem cor avisa',
   /sem cor cadastrada/.test(corChipHtml(doLote[0], semCor)), true);
// E o aviso NÃO polui a tela quando a linha já é única por si.
ok('linha única sem cor sai limpa',
   corChipHtml({ codigo: '501041', desc: 'RACK BRITO 137 CM' },
               descRepetidas([{ codigo: '501041', desc: 'RACK BRITO 137 CM' }])), '');

// A barra do produto atual, o toast do bipe e o produto do gerencial usam o
// MESMO rótulo (nomeComCor + a queda para o catálogo).
ok('as três telas de produto do app levam a cor',
   (MJS.match(/nomeComCor\(p\.desc, corDeProduto\(p\)\)/g) || []).length, 3);
// Guarda-corpo: foi imprimir a descrição sozinha que causou o problema — as
// três listas do seletor têm de passar pela etiqueta da cor.
ok('nenhuma lista imprime a descrição sozinha',
   (MJS.match(/\$\{corChipHtml\(p, rep(?:Cat)?\)\}/g) || []).length, 3);
// Buscar por cor tem de achar: com a cor fora da descrição, digitar "CUMARU"
// não acharia mais nada se a comparação continuasse só no nome.
ok('a busca também olha a cor', /p\.cor && normTxt\(p\.cor\)\.includes\(q\)/.test(MJS), true);

// ── o backend manda a cor nas ações que o app consome ─────────────────────
console.log('\n── o backend manda a COR para o app ──');
reset([
  { codigo: '501060001', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', cor: 'OFF WHITE' },
  { codigo: '501060003', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', cor: 'CUMARU'    }
]);
// calcularProgramacao é a leitura da planilha inteira — aqui só o que ela
// devolve importa, então entra de mentira.
function calcularProgramacao() {
  return { metaEfetiva: 300, atrasoTotal: 0, lista: [
    { codigo: '501060001', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', lote: 25076, programadoHoje: 150, atraso: 0, falta: 150 },
    { codigo: '501060003', desc: 'VOL 1/2 PENTEADEIRA CAMARIM MEL', lote: 25076, programadoHoje: 150, atraso: 0, falta: 150 }
  ] };
}
eval(pega(GS, 'function getProgramacaoHoje('));
const hoje = getProgramacaoHoje();
ok('getProgramacaoHoje manda a cor de cada item',
   hoje.produtos.map(x => x.cor), ['OFF WHITE', 'CUMARU']);
ok('e continua mandando o resto (lote, meta, atraso)',
   [hoje.produtos[0].lote, hoje.produtos[0].qtde, hoje.produtos[0].atraso], [25076, 150, 0]);
// A tela de PROGRAMAÇÃO do painel e o produto atual (gerencial + Tela B da TV)
// pedem a mesma coisa ao backend.
ok('getProgramacaoDetalhada leva a cor junto',
   /cor:\s+produtoDoCodigo\(cat \? cat\.codigo : pr\.codigo\)\.cor/.test(GS), true);
ok('getPontosDia manda a cor do produto atual',
   /const produtoAtualCor\s+= produtoAtual \? produtoDoCodigo\(produtoAtual\)\.cor : '';/.test(GS), true);
ok('e o painel usa ela nas duas telas',
   (JS.match(/nomeComCor\(PONTOS_DIA\.produtoAtualDesc, PONTOS_DIA\.produtoAtualCor\)/g) || []).length, 2);
ok('a tela de programação também', /nomeComCor\(it\.desc, it\.cor\)/.test(JS), true);

console.log(falhas === 0
  ? '\n✅ produto × cor ok — a planilha manda, o texto é só rede\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
