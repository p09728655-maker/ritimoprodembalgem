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
  { hora: '07:00', modelo: '501130', nome: 'MESA CENTRO LUNA 670',  cor: 'OFF WHITE', caixas: 100, pesoKg: 730, pontos: 5600 },
  { hora: '08:00', modelo: '501130', nome: 'MESA CENTRO LUNA 670',  cor: 'CUMARU',    caixas:  50, pesoKg: 365, pontos: 2800 },
  { hora: '08:00', modelo: '501130', nome: 'MESA LATERAL LUNA 440', cor: 'ALECRIM',   caixas:  40, pesoKg: 160, pontos: 1760 },
]};
eval(pega(JS, 'function calcPorModelo('));
const r = calcPorModelo();
ok('produtos diferentes do mesmo código não somam juntos', r.linhas.length, 2);
ok('as cores do MESMO produto somam numa linha só', r.linhas[0].caixas, 150);
ok('e aparecem na coluna COR', r.linhas[0].cor, 'CUMARU · OFF WHITE');
ok('peso continua saindo do código, só somado depois', r.linhas[0].pesoKg, 1095);
ok('a coluna COR entra quando há cor', r.temCor, true);
// Backend antigo não manda cor: a coluna some, em vez de virar parede de "—".
PONTOS_DIA = { porHoraModelo: [
  { hora: '07:00', modelo: '501130', nome: 'MESA', caixas: 10, pesoKg: 73, pontos: 560 },
]};
ok('sem cor nenhuma, a coluna não entra', calcPorModelo().temCor, false);

// ── 6) guarda-corpo: o agrupamento do comparativo é UM só ──────────────────
console.log('\n── o comparativo não pode voltar a ter duas regras ──');
// A tela e o PDF liam o mesmo seletor com duas cópias do keyOf/labelOf: a
// primeira mudança em uma só faria o relatório contar diferente da tela.
ok('_phAgrup declarado uma única vez', (JS.match(/function _phAgrup\(/g) || []).length, 1);
ok('tela e PDF usam ele', (JS.match(/\}=_phAgrup\(\)/g) || []).length, 2);
ok('nenhuma cópia solta do keyOf', (JS.match(/const keyOf\s+=it=>/g) || []).length, 0);
// O agrupamento por MODELO precisa incluir o nome — senão os quatro produtos do
// 501130 voltam a virar uma linha só.
ok('a chave do comparativo carrega o produto',
   /it\.modelo\+'\|'\+\(it\.nome\|\|''\)/.test(JS), true);

console.log(falhas === 0
  ? '\n✅ produto × cor ok — a planilha manda, o texto é só rede\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exit(falhas === 0 ? 0 : 1);
