// A leitura da ETIQUETA pelo bipe do celular (mobile 1.45.0).
//   node etiqueta.test.js
//
// O teste roda o código REAL: `eanPartes`, `eanCore`, `eanVolTxt`, `eanAchar`,
// `eanFalhaTxt`, `produtoPorEan` e `processarBipe` são extraídos do
// ritmoprod_mobile.html e avaliados aqui.
//
// O caso (12/11/2026, PPCP: "como está lendo hoje a entrada pela etiqueta"): a
// etiqueta é GS1-128 com (8006) = GTIN + peça/total, e no cadastro os volumes da
// mesma cor têm o MESMO GTIN — só a peça/total muda. A leitura antiga jogava a
// peça/total fora e ficava com o 1º código do EAN: bipar o VOL 2/2 selecionava o
// VOL 1/2, sempre (~60 códigos de 22 modelos nunca saíam pelo bipe). E três
// códigos do HOME RIPADO SUPREMO 2.3 CINAMOMO estavam com "(8806)" no cadastro
// (corrigido na planilha no mesmo dia) e davam "EAN não cadastrado".
//
// O cadastro abaixo é cópia de linhas reais da PRODUTO_CODIGO (12/11/2026).

const fs = require('fs');
const path = require('path');
const MOB = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
const MJS = [...MOB.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

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

let PRODUTOS = [];
// eval direto, no nível do módulo: dentro de um forEach as funções ficariam
// presas ao escopo da arrow.
eval(['function eanPartes(', 'function eanCore(', 'function eanVolTxt(', 'function eanAchar(',
      'function eanFalhaTxt(', 'function produtoPorEan(', 'function processarBipe(']
  .map(f => pega(MJS, f)).join('\n'));

// Linhas reais da PRODUTO_CODIGO (12/11/2026): código, descrição, cor, EAN 128.
const L = (codigo, desc, cor, ean) => ({ codigo, desc, cor, ean });
const CAT = [
  L('501060001', 'VOL 1/2 PENTEADEIRA CAMARIM MEL', 'BRANCO', '(8006)78985990784170102'),
  L('501060002', 'VOL 2/2 PENTEADEIRA CAMARIM MEL', 'BRANCO', '(8006)78985990784170202'),
  L('501060003', 'VOL 1/2 PENTEADEIRA CAMARIM MEL', 'OFF WHITE', '(8006)78985990784240102'),
  L('501060004', 'VOL 2/2 PENTEADEIRA CAMARIM MEL', 'OFF WHITE', '(8006)78985990784240202'),
  L('501070001', 'VOL 1/3 HOME RIPADO SUPREMO 2.3', 'CINAMOMO', '(8006)78987139425180103'),
  L('501070002', 'VOL 2/3 HOME RIPADO SUPREMO 2.3', 'CINAMOMO', '(8006)78987139425180203'),
  L('501070003', 'VOL 3/3 HOME RIPADO SUPREMO 2.3', 'CINAMOMO', '(8006)78987139425180303'),
  L('501072001', 'VOL 1/3 HOME RIPADO ANTARES 1.8', 'CINAMOMO', '(8006)78987139425560103'),
  L('501072002', 'VOL 2/3 HOME RIPADO ANTARES 1.8', 'CINAMOMO', '(8006)78987139425560203'),
  L('501072003', 'VOL 3/3 HOME RIPADO ANTARES 1.8', 'CINAMOMO', '(8006)78987139425560303'),
  L('501094004', 'VOL 1/1 MESA CABECEIRA SLEEP', 'OFF WHITE/NATURE', '(01)7898713943249'),
  L('501150001', 'VOL 1/1 COMODA DALILA NEW ', 'BRANCO', '(01)7898599075065 '),
];
const cod = r => r.p ? r.p.codigo : null;
const ach = raw => eanAchar(raw, CAT);

console.log('── o volume da etiqueta escolhe o código ──');
ok('VOL 2/2 MEL OFF WHITE → 501060004 (era o 501060003, VOL 1/2)', cod(ach('(8006)78985990784240202')), '501060004');
ok('VOL 1/2 MEL OFF WHITE → 501060003', cod(ach('(8006)78985990784240102')), '501060003');
ok('o leitor manda só os dígitos, sem parênteses → o mesmo VOL 2/2', cod(ach('800678985990784240202')), '501060004');
ok('GTIN-14 na etiqueta (0 na frente, 18 dígitos depois do AI) → o mesmo VOL 2/2',
   cod(ach('(8006)078985990784240202')), '501060004');
ok('a cor muda o GTIN: VOL 2/2 MEL BRANCO → 501060002', cod(ach('(8006)78985990784170202')), '501060002');
ok('ANTARES 1.8: os três volumes, cada um no seu código',
   ['0103', '0203', '0303'].map(v => cod(ach('(8006)7898713942556' + v))), ['501072001', '501072002', '501072003']);
ok('HOME RIPADO SUPREMO 2.3 CINAMOMO (a linha corrigida de 8806 para 8006): VOL 2/3 → 501070002',
   cod(ach('(8006)78987139425180203')), '501070002');

console.log('\n── VOL 1/1 cadastrado com (01) ──');
ok('etiqueta (01) da SLEEP → 501094004', cod(ach('(01)7898713943249')), '501094004');
ok('a mesma SLEEP numa etiqueta (8006) com peça 01/01: o cadastro não diz volume e é o único código → 501094004',
   cod(ach('(8006)78987139432490101')), '501094004');
ok('EAN só com 13 dígitos (sem AI) → 501094004', cod(ach('7898713943249')), '501094004');
ok('espaço no fim do cadastro não atrapalha (DALILA) → 501150001', cod(ach('(01)7898599075065')), '501150001');

console.log('\n── na dúvida, NÃO escolhe (o operador toca na lista) ──');
const sem = ach('7898599078424');
ok('etiqueta SEM volume para um EAN de dois volumes → ambíguo, nenhum código (nunca o 1º da lista)',
   [sem.motivo, sem.n, cod(sem)], ['ambiguo', 2, null]);
const v33 = ach('(8006)78985990784240303');
ok('VOL 3/3 num produto de 2 volumes → volume não cadastrado, nenhum código', [v33.motivo, cod(v33)], ['vol-nao-cad', null]);
const soVol1 = CAT.filter(p => p.codigo !== '501060004');
const falta2 = eanAchar('(8006)78985990784240202', soVol1);
ok('o VOL 2/2 fora do cadastro: NÃO cai no VOL 1/2 (era o que a leitura antiga fazia)',
   [falta2.motivo, cod(falta2)], ['vol-nao-cad', null]);
const dup = eanAchar('(8006)78985990784240202', CAT.concat([L('501060099', 'VOL 2/2 PENTEADEIRA CAMARIM MEL', 'OFF WHITE', '(8006)78985990784240202')]));
ok('o mesmo EAN + volume em dois códigos do cadastro → ambíguo', [dup.motivo, dup.n, cod(dup)], ['ambiguo', 2, null]);
const dup01 = eanAchar('(01)7898713943249', CAT.concat([L('501094099', 'VOL 1/1 MESA CABECEIRA SLEEP', 'BRANCO', '(01)7898713943249')]));
ok('o mesmo EAN (01) em dois códigos → ambíguo', [dup01.motivo, cod(dup01)], ['ambiguo', null]);
ok('EAN que não está no cadastro → não cadastrado', [ach('(01)7891234567895').motivo, cod(ach('(01)7891234567895'))], ['nao-cad', null]);
ok('menos de 8 dígitos → não é EAN', ach('123456').motivo, 'curto');
const velho = eanAchar('(8006)78987139425180103', [L('501070001', 'VOL 1/3 HOME RIPADO SUPREMO 2.3', 'CINAMOMO', '(8806)78987139425180103')]);
ok('o cadastro com "(8806)" (antes da correção da planilha) não casava — era o "EAN não cadastrado"',
   velho.motivo, 'nao-cad');

console.log('\n── as partes e os textos ──');
ok('eanPartes da etiqueta do VOL 2/2', eanPartes('(8006)78985990784240202'), { core: '7898599078424', vol: '0202' });
ok('eanPartes do (01): sem volume', eanPartes('(01)7898713943249'), { core: '7898713943249', vol: '' });
ok('eanCore continua o mesmo núcleo de antes', [eanCore('(8006)78985990784240202'), eanCore('(01)7898713943249'), eanCore('')],
   ['7898599078424', '7898713943249', '']);
ok('eanVolTxt: 0202 → 2/2, 0103 → 1/3', [eanVolTxt('0202'), eanVolTxt('0103')], ['2/2', '1/3']);
ok('aviso do volume que falta', eanFalhaTxt(v33), 'VOL 3/3 deste EAN não está no cadastro: 7898599078424 — escolha na lista');
ok('aviso do ambíguo', eanFalhaTxt(sem), 'Etiqueta sem volume: o EAN 7898599078424 serve para 2 códigos — escolha na lista');
ok('aviso do não cadastrado (o de sempre)', eanFalhaTxt(ach('(01)7891234567895')), 'EAN não cadastrado no catálogo: 7891234567895');

console.log('\n── o bipe de verdade (processarBipe) ──');
// Os vizinhos do processarBipe, de mentira: só o que ele chama.
let sel = [], toasts = [], sons = [], abriu = 0;
var _slotAtivo = null, _corrTroca = null, _confirmaCb = null, _confirmaTag = '';
function selecionarProduto(c) { sel.push(c); }
function bipeToast(m, okk) { toasts.push([m, okk]); }
function bipeSom(okk) { sons.push(okk); }
function abrirLancSlotAtivo() { abriu++; return true; }
function nomeComCor(d, c) { return d + (c ? ' ' + c : ''); }
function corDeProduto(p) { return p.cor || ''; }
function _confirmaResolve() {}
let acendeu = [];
function _mlProdPintar(bip) { acendeu.push(!!bip); }
PRODUTOS = CAT;
processarBipe('800678985990784240202');
ok('bipe do VOL 2/2: seleciona 501060004, aviso verde, bipe agudo, abre a hora atual',
   [sel, toasts[0][1], sons, abriu], [['501060004'], true, [true], 1]);
ok('o aviso de acerto diz o volume (a descrição tem o VOL)', /^✓ 501060004 · VOL 2\/2 PENTEADEIRA CAMARIM MEL/.test(toasts[0][0]), true);
ok('e a linha PRODUTO do lançamento acende com o que chegou', acendeu, [true]);
_corrTroca = { x: 1 }; acendeu = [];
processarBipe('800678985990784240202');
ok('no TROCAR PRODUTO (correção de um lançamento antigo) a linha do lançamento NÃO acende', acendeu, []);
_corrTroca = null;
sel = []; toasts = []; sons = []; abriu = 0; acendeu = [];
processarBipe('7898599078424');
ok('bipe ambíguo: não seleciona nada, aviso vermelho com o motivo, bipe grave, não abre a hora',
   [sel, toasts, sons, abriu],
   [[], [['Etiqueta sem volume: o EAN 7898599078424 serve para 2 códigos — escolha na lista', false]], [false], 0]);
ok('produtoPorEan (o atalho) lê o mesmo que o bipe', produtoPorEan('(8006)78985990784240202').codigo, '501060004');

console.log('\n── o produto à vista no lançamento ("quando bipa não aparece o código") ──');
{
  // DOM de mentira com a linha PRODUTO
  const cls = new Set(), el = { textContent: '' }, sub = { innerHTML: '' };
  const box = { classList: { toggle: (c, on) => on ? cls.add(c) : cls.delete(c), remove: c => cls.delete(c), add: c => cls.add(c) }, offsetWidth: 1 };
  global.document = { getElementById: id => ({ 'ml-prod': box, 'ml-prod-val': el, 'ml-prod-sub': sub })[id] || null };
  var PROD_ATUAL = '501060004';
  PRODUTOS = [L('501060004', 'VOL 2/2 PENTEADEIRA CAMARIM MEL', 'CINAMOMO/OFF WHITE', '(8006)78987139448950202'),
              L('501060099', 'VOL 1/2 PENTEADEIRA CAMARIM MEL OFF WHITE', 'OFF WHITE', '')];
  eval(pega(MJS, 'function _escH(')); eval(pega(MJS, 'function _mlProdTxt(')); eval(pega(MJS, 'function _mlProdPintar('));
  _mlProdPintar(true);
  ok('com produto: o nome, a COR numa etiqueta à parte (não some quando o nome é cortado) e o código; acende no bipe',
     [el.textContent, sub.innerHTML, cls.has('sem'), cls.has('bip')],
     ['VOL 2/2 PENTEADEIRA CAMARIM MEL', '<span>501060004</span><span class="ml-prod-cor">CINAMOMO/OFF WHITE</span>', false, true]);
  ok('descrição antiga que já termina com a cor não repete a cor',
     _mlProdTxt(PRODUTOS[1], '501060099'), { nome: 'VOL 1/2 PENTEADEIRA CAMARIM MEL OFF WHITE', cor: '', cod: '501060099' });
  ok('código fora do catálogo: o código, sem inventar nome', _mlProdTxt(null, '501999001'), { nome: '501999001', cor: '', cod: '' });
  PROD_ATUAL = ''; cls.clear(); _mlProdPintar();
  ok('sem produto: diz isso, em âmbar, e manda tocar', [el.textContent, sub.innerHTML, cls.has('sem')], ['SEM PRODUTO — toque para escolher', '', true]);
  delete global.document;
}
ok('o lançamento tem a linha PRODUTO, e tocar nela abre o seletor (que abre por cima)',
   [/<div class="ml-prod" id="ml-prod" role="button"[^>]*onclick="abrirModalProduto\(\)">/.test(MOB),
    MOB.indexOf('id="modal-produto"') > MOB.indexOf('id="modal-lanc"')], [true, true]);
ok('ela é pintada ao abrir o lançamento e em toda troca de produto (barra do produto)',
   [/_mlProdPintar\(\);/.test(pega(MJS, 'function abrirLanc(')), /_mlProdPintar\(\);/.test(pega(MJS, 'function atualizarProdutoBar('))], [true, true]);
ok('o bipe acende a linha (menos no TROCAR PRODUTO)', /if\(!trocando\) _mlProdPintar\(true\);/.test(pega(MJS, 'function processarBipe(')), true);
{
  const zToast = +(MOB.match(/\.scan-toast\{[^}]*z-index:(\d+)/) || [])[1];
  const zModal = +(MOB.match(/\.modal-over\{[^}]*z-index:(\d+)/) || [])[1];
  const zConf = +(MOB.match(/#modal-confirma\{z-index:(\d+)\}/) || [])[1];
  ok('o aviso do bipe fica ACIMA dos modais (era 50, atrás do lançamento que o bipe abre) e no alto da tela',
     [zToast > zModal, zToast > zConf, /\.scan-toast\{position:fixed;left:50%;top:/.test(MOB)], [true, true, true]);
}

console.log('\n── o leitor como teclado: quando a leitura fecha (mobile 1.48.0) ──');
// PPCP, 12/11/2026: "lê o código EAN mas não acontece nada". No Chromium o app só
// ficava CALADO com o leitor fora do roteiro: TAB no fim, nenhum sufixo, ou teclas
// a mais de 80 ms. A regra é a do app (scanTecla/scanPausa + as constantes).
{
  const cte = n => (MJS.match(new RegExp('const ' + n + ' = [^;]+;')) || [])[0];
  eval(['SCAN_MIN', 'SCAN_RAJADA_MS', 'SCAN_SOLTO_MS', 'SCAN_FIM_MS'].map(cte).join('\n').replace(/const /g, 'var '));
  eval(pega(MJS, 'function scanTecla(') + '\n' + pega(MJS, 'function scanPausa('));
  // O leitor "digita": as teclas, de `passo` em `passo` ms, e o sufixo no mesmo ritmo.
  function leitura(txt, passo, fim, editavel, t0 = 10000) {
    let st = { buf: '', ult: 0, engole: 0 }, t = t0, lidas = [], vazou = 0;
    for (const k of txt) {
      const r = scanTecla(st, k, t, editavel); st = r.st; if (!r.prevent) vazou++; if (r.processa) lidas.push(r.processa); t += passo;
    }
    if (fim) { const r = scanTecla(st, fim, t, editavel); st = r.st; if (r.processa) lidas.push(r.processa); }
    return { st, lidas, vazou, t };
  }
  const ETQ = '800678985990784240202';
  ok('leitor rápido com Enter: a leitura fecha no Enter (como sempre)', leitura(ETQ, 8, 'Enter', false).lidas, [ETQ]);
  ok('com TAB no fim: a leitura fecha no TAB (antes: nada)', leitura(ETQ, 8, 'Tab', false).lidas, [ETQ]);
  {
    const a = leitura(ETQ, 8, null, false);
    ok('sem sufixo: nada fecha na hora, a etiqueta fica no buffer', [a.lidas, a.st.buf], [[], ETQ]);
    const p = scanPausa(a.st, a.t + SCAN_FIM_MS);
    ok('… e fecha sozinha na pausa', p.processa, ETQ);
    const enter = scanTecla(p.st, 'Enter', a.t + SCAN_FIM_MS + 50, false);
    ok('… e um Enter atrasado depois disso é engolido (não clica botão focado) e não lê de novo',
       [enter.prevent, enter.processa], [true, '']);
    const depois = scanTecla(enter.st, 'Enter', a.t + SCAN_FIM_MS + 100, false);
    ok('… mas só esse: o Enter seguinte segue normal', depois.prevent, false);
  }
  ok('leitor lento (150 ms entre teclas) SEM campo focado: lê (antes: nada)', leitura(ETQ, 150, 'Enter', false).lidas, [ETQ]);
  {
    const a = leitura(ETQ, 150, 'Enter', true);
    ok('leitor lento COM campo de texto focado: não vira bipe (é a velocidade de alguém digitando)', [a.lidas, a.vazou], [[], ETQ.length]);
  }
  ok('com campo focado, o leitor rápido continua lendo e só a 1ª tecla passa', (() => { const a = leitura(ETQ, 8, 'Enter', true); return [a.lidas, a.vazou]; })(), [[ETQ], 1]);
  ok('teclas a mais de SCAN_SOLTO_MS uma da outra não se juntam (nem sem campo focado)', leitura(ETQ, SCAN_SOLTO_MS + 50, 'Enter', false).lidas, []);
  ok('Enter curto (menos de 8 teclas) segue normal: não é etiqueta', (() => {
    let st = { buf: '1234', ult: 10000, engole: 0 };
    const r = scanTecla(st, 'Enter', 10005, false); return [r.prevent, r.processa];
  })(), [false, '']);
  ok('pausa com menos de 8 teclas no buffer: nada', scanPausa({ buf: '1234', ult: 1, engole: 0 }, 5000).processa, '');
  ok('Shift (dos parênteses) não entra no buffer nem quebra a leitura', (() => {
    let st = { buf: '', ult: 0, engole: 0 }, t = 10000, lidas = [];
    for (const k of ['Shift', '(', '8', '0', '0', '6', 'Shift', ')', ...'78985990784240202', 'Enter']) {
      const r = scanTecla(st, k, t, false); st = r.st; if (r.processa) lidas.push(r.processa); t += 8;
    }
    return lidas;
  })(), ['(8006)78985990784240202']);
  ok('as réguas: sem campo focado mais folga que com campo, e a pausa maior que a folga',
     [SCAN_RAJADA_MS, SCAN_SOLTO_MS > SCAN_RAJADA_MS, SCAN_FIM_MS > SCAN_SOLTO_MS, SCAN_MIN], [80, true, true, 8]);
  const ouv = MJS.slice(MJS.indexOf("let _scanSt = "), MJS.indexOf('}, true);', MJS.indexOf("let _scanSt = ")));
  ok('o ouvinte do teclado aplica a regra pura (scanTecla) e fecha na pausa pelo scanPausa',
     [/scanTecla\(_scanSt, e\.key, Date\.now\(\), _scanEditavel\(\)\)/.test(ouv), /scanPausa\(_scanSt, Date\.now\(\)\)/.test(ouv),
      /setTimeout\([\s\S]*SCAN_FIM_MS\)/.test(ouv), /if\(r\.processa\)\{ e\.stopPropagation\(\); processarBipe\(r\.processa\)/.test(ouv),
      /if\(p\.processa\) processarBipe\(p\.processa\);/.test(ouv)],
     [true, true, true, true, true]);
  ok('a captura antiga (só Enter, 80 ms fixos) não voltou', /_scanBuf|_scanLast/.test(MJS), false);
}

console.log('\n── guarda-corpo ──');
ok('o processarBipe passa pelo eanAchar (não volta a casar só o núcleo)',
   /const r = eanAchar\(raw, PRODUTOS\);/.test(pega(MJS, 'function processarBipe(')), true);
ok('nenhum lugar do app casa EAN pelo núcleo com .find( (a leitura antiga)',
   /\.find\([^)]*eanCore\(/.test(MJS), false);
ok('o aviso de falha fica mais tempo que o de acerto', /ok\?2600:4500/.test(pega(MJS, 'function bipeToast(')), true);

console.log(falhas === 0
  ? '\n✅ etiqueta ok — o volume da etiqueta escolhe o código, e na dúvida o app não escolhe\n'
  : `\n❌ ${falhas} falha(s)\n`);
process.exitCode = falhas ? 1 : 0;
