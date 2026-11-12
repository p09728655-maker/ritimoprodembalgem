// PARADA COM MOTIVO DEPOIS (mobile 1.47.0 / v7.234.0 / rp-core 1.15.0).
//   node parada-motivo.test.js
//
// PPCP, 12/11/2026: "sobre as paradas na cronoanálise tem a opção de parar e
// colocar motivo depois, faz o mesmo nesse". O PAROU do celular grava na hora com
// o TIPO 'A INFORMAR' (PARADA_A_INFORMAR, rp-core); o tipo e o motivo entram
// depois — com a parada aberta (quadro PRODUÇÃO PARADA) ou depois do START (na
// lista) —, pelo mesmo saveParadas (upsert pelo ID). Nada muda no .gs.
//
// Roda o código REAL do rp-core, do paradas-calc, do celular e do painel.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const MOB = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
const MJS = [...MOB.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const V7 = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const VJS = [...V7.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

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

// ── um celular de mentira: DOM mínimo + o código real ───────────────────────
function celular() {
  const conts = {};            // contêineres fixos do HTML (innerHTML)
  const stubs = {};            // elementos de dentro do innerHTML, achados pelo id
  const sets = {};             // quantas vezes cada contêiner foi redesenhado
  const fixo = id => {
    if (!conts[id]) {
      const o = { _h: '', classList: { toggle() {}, add() {}, remove() {}, contains: () => false }, textContent: '' };
      Object.defineProperty(o, 'innerHTML', { get() { return o._h; }, set(v) { o._h = String(v); sets[id] = (sets[id] || 0) + 1; } });
      conts[id] = o;
    }
    return conts[id];
  };
  ['par-estado', 'par-edit', 'paradas-list', 'btn-paradas', 'modal-paradas'].forEach(fixo);
  const C = {
    console, ALERTS: [], URLS: [], LEU: 0,
    alert(m) { C.ALERTS.push(String(m)); },
    document: {
      getElementById(id) {
        if (conts[id]) return conts[id];
        const dono = Object.values(conts).find(c => c._h.includes(`id="${id}"`));
        if (!dono) { delete stubs[id]; return null; }
        if (!stubs[id]) stubs[id] = { id, value: '', textContent: '', disabled: false, dataset: {}, innerHTML: '' };
        return stubs[id];
      }
    }
  };
  C.window = C;
  vm.createContext(C);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'), C);
  vm.runInContext(`
    var CFG = { sheetsUrl: 'https://x/exec' }, PARADAS_HOJE = [], PAR_TIPOS = ['Troca de produto','Manutenção','Refeição/Intervalo','Outro'];
    var _parEscrevendo = false, _paradaLocalAberta = null, _parFechadasLocal = new Map(), SERVIDOR = null, FALHA = false;
    function paradaAtiva(){ return PARADAS_HOJE.find(p=>!p.fim || String(p.fim).trim()===''); }
    function nowHoraSeg(){ return '09:12:30'; }
    function renderGerParada(){} function renderGerParadasResumo(){}
    async function carregarParadas(){ LEU++; if(SERVIDOR) PARADAS_HOJE = JSON.parse(JSON.stringify(SERVIDOR)); renderParadasList(); renderParadaEstado(); renderParadaEdit(); atualizarBadgeParadas(); }
    async function jsonpEscritaParada(url){ URLS.push(url); if(FALHA) throw new Error('Timeout');
      const m = /paradas=([^&]+)/.exec(url); const ps = JSON.parse(decodeURIComponent(m[1]));
      if(SERVIDOR){ ps.forEach(p=>{ const i = SERVIDOR.findIndex(x=>String(x.id)===String(p.id)); if(i>=0) SERVIDOR[i] = Object.assign({}, p); else SERVIDOR.push(Object.assign({}, p)); }); }
      return { ok:true, salvos: ps.length }; }
  `, C);
  ['function _escH(', 'function renderParadasList(', 'function _parIdApp(', 'function _parIdDom(', 'function _parOpcoes(',
   'function _parSelAtualiza(', 'function _parMotivoForm(', 'function _parEditAbrir(', 'function _parEditFechar(',
   'function renderParadaEdit(', 'async function salvarMotivoParada(', 'function atualizarBadgeParadas(',
   'function renderParadaEstado(', 'async function registrarParadaAgora('].forEach(f => vm.runInContext(pega(MJS, f), C));
  vm.runInContext('var _parEditId = null, _parEditRender = null, _parEstadoRender = null;', C);
  return { C, conts, stubs, sets, run: s => vm.runInContext(s, C) };
}

console.log('── a regra (rp-core) ──');
{
  const C = {}; C.window = C; vm.createContext(C);
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'), C);
  ok('A INFORMAR, vazio e nulo são "sem motivo"; tipo de verdade, não',
     ['A INFORMAR', ' a informar ', '', null, 'Outro', 'Troca de produto'].map(t => C.paradaAInformar(t)),
     [true, true, true, true, false, false]);
  ok('o texto gravado é A INFORMAR', vm.runInContext('PARADA_A_INFORMAR', C), 'A INFORMAR');
}

console.log('\n── o PAROU grava na hora, com ou sem o tipo ──');
(async () => {
  {
    const m = celular();
    m.run('renderParadaEstado()');
    const h = m.conts['par-estado'].innerHTML;
    ok('rodando: o PAROU vem primeiro, e o tipo começa em "informar depois" (não no 1º tipo da lista)',
       [h.indexOf('PAROU — REGISTRAR AGORA') < h.indexOf('id="par-tipo"'), /<option value="">— informar depois —<\/option><option>Troca de produto/.test(h)], [true, true]);
    await m.run('registrarParadaAgora()');
    const p = JSON.parse(decodeURIComponent(/paradas=([^&]+)/.exec(m.C.URLS[0])[1]))[0];
    ok('sem escolher nada: grava A INFORMAR, sem motivo, aberta (FIM vazio), início agora', [p.tipo, p.obs, p.fim, p.ini], ['A INFORMAR', '', '', '09:12:30']);
  }
  {
    const m = celular();
    m.run('renderParadaEstado()');
    m.stubs['par-tipo'] = undefined;
    m.C.document.getElementById('par-tipo').value = 'Manutenção';
    m.C.document.getElementById('par-obs').value = ' esteira travou ';
    await m.run('registrarParadaAgora()');
    const p = JSON.parse(decodeURIComponent(/paradas=([^&]+)/.exec(m.C.URLS[0])[1]))[0];
    ok('já sabendo: grava o tipo e o motivo escolhidos', [p.tipo, p.obs], ['Manutenção', 'esteira travou']);
  }

  console.log('\n── parada aberta sem motivo: o quadro pede, o START continua ──');
  {
    const m = celular();
    m.run(`PARADAS_HOJE = [{ id: 1731400350000, tipo: 'A INFORMAR', ini: '09:12:30', fim: '', obs: '' }]`);
    m.run('renderParadaEstado()');
    const h = m.conts['par-estado'].innerHTML;
    ok('mostra ⚠ MOTIVO A INFORMAR, o quadro do motivo (sem CANCELAR) e o START logo abaixo',
       [/⚠ MOTIVO A INFORMAR/.test(h), /id="par-m-tipo-1731400350000"/.test(h), /onclick="_parEditFechar\(\)"/.test(h),
        h.indexOf('par-m-tipo-') < h.indexOf('btn-start-parada')], [true, true, false, true]);
    m.run('renderParadaEstado()');
    ok('o poll redesenha de novo com o mesmo dado: NÃO (o que se digita não some)', m.sets['par-estado'], 1);
    m.run('atualizarBadgeParadas()');
    ok('o botão da tela diz PARADO enquanto está parada', m.conts['btn-paradas'].textContent, '⏸ PARADO');
  }
  {
    const m = celular();
    m.run(`PARADAS_HOJE = [{ id: 1731400350000, tipo: 'Manutenção', ini: '09:12:30', fim: '', obs: 'esteira' }]`);
    m.run('renderParadaEstado()');
    const h = m.conts['par-estado'].innerHTML;
    ok('com tipo: mostra o tipo e ✎ ALTERAR MOTIVO, sem o quadro aberto', [/Manutenção/.test(h), /✎ ALTERAR MOTIVO/.test(h), /par-m-tipo-/.test(h)], [true, true, false]);
    m.run(`_parEditAbrir('1731400350000')`);
    ok('✎ ALTERAR abre o quadro com o tipo de agora e CANCELAR', [/<option selected>Manutenção/.test(m.conts['par-estado'].innerHTML), /_parEditFechar\(\)/.test(m.conts['par-estado'].innerHTML)], [true, true]);
  }
  {
    const m = celular();
    m.run(`PARADAS_HOJE = [{ id: 'L12', tipo: 'A INFORMAR', ini: '09:12:30', fim: '', obs: '' }]`);
    m.run('renderParadaEstado()');
    ok('linha sem ID (lançada à mão): sem quadro e sem ALTERAR — gravar duplicaria', /par-m-tipo-|ALTERAR/.test(m.conts['par-estado'].innerHTML), false);
  }

  console.log('\n── depois do START: a lista pede o motivo ──');
  {
    const m = celular();
    m.run(`PARADAS_HOJE = [
      { id: 1, tipo: 'A INFORMAR', ini: '08:01:00', fim: '08:09:30', obs: '' },
      { id: 2, tipo: 'Troca de produto', ini: '08:30:00', fim: '08:36:00', obs: '' },
      { id: 'L9', tipo: '', ini: '09:00:00', fim: '09:05:00', obs: '' },
      { id: 3, tipo: 'A INFORMAR', ini: '09:12:30', fim: '', obs: '' }]`);
    m.run('renderParadasList(); atualizarBadgeParadas()');
    const h = m.conts['paradas-list'].innerHTML;
    ok('fechada A INFORMAR: INFORMAR MOTIVO; a aberta não (o quadro de cima pede); a sem ID manda corrigir na planilha',
       [(h.match(/INFORMAR MOTIVO<\/button>/g) || []).length, /_parEditAbrir\('1'\)/.test(h), /_parEditAbrir\('3'\)/.test(h), /corrija o tipo na planilha/.test(h)],
       [1, true, false, true]);
    m.run(`PARADAS_HOJE = PARADAS_HOJE.filter(p => p.fim)`);
    m.run('atualizarBadgeParadas()');
    ok('rodando: o botão diz quantas estão sem motivo', m.conts['btn-paradas'].textContent, '⏸ PARADAS · 2 SEM MOTIVO');
    m.run(`_parEditAbrir('1')`);
    ok('INFORMAR MOTIVO abre o quadro da parada fechada, com CANCELAR', [/par-m-tipo-1"/.test(m.conts['par-edit'].innerHTML), /parada das 08:01:00 às 08:09:30/.test(m.conts['par-edit'].innerHTML), /_parEditFechar/.test(m.conts['par-edit'].innerHTML)], [true, true, true]);
  }

  console.log('\n── SALVAR MOTIVO ──');
  {
    const m = celular();
    // No aparelho a parada ainda está ABERTA; no servidor alguém já deu o START.
    m.run(`PARADAS_HOJE = [{ id: 7, tipo: 'A INFORMAR', ini: '09:12:30', fim: '', obs: '' }];
           SERVIDOR = [{ id: 7, tipo: 'A INFORMAR', ini: '09:12:30', fim: '09:20:10', obs: '' }]`);
    m.run('renderParadaEstado()');
    m.C.document.getElementById('par-m-tipo-7').value = '';
    await m.run(`salvarMotivoParada('7')`);
    ok('sem tipo escolhido: pede o tipo e não grava nada', [m.C.ALERTS[0], m.C.URLS.length], ['Escolha o TIPO DE PARADA.', 0]);
    m.C.document.getElementById('par-m-tipo-7').value = 'Manutenção';
    m.C.document.getElementById('par-m-obs-7').value = 'esteira travou';
    await m.run(`salvarMotivoParada('7')`);
    const p = JSON.parse(decodeURIComponent(/paradas=([^&]+)/.exec(m.C.URLS[0])[1]))[0];
    ok('relê ANTES de gravar e manda o FIM do servidor (não reabre a parada que já levou START)',
       [m.C.LEU > 0, p.tipo, p.obs, p.ini, p.fim, p.id], [true, 'Manutenção', 'esteira travou', '09:12:30', '09:20:10', 7]);
    ok('depois: a lista mostra o tipo, sem pedir motivo', [/Manutenção/.test(m.conts['paradas-list'].innerHTML), /INFORMAR MOTIVO/.test(m.conts['paradas-list'].innerHTML)], [true, false]);
  }
  {
    const m = celular();
    m.run(`PARADAS_HOJE = [{ id: 8, tipo: 'A INFORMAR', ini: '06:00:00', fim: '06:00:00', obs: '(encerrada automaticamente no fechamento)' }];
           SERVIDOR = JSON.parse(JSON.stringify(PARADAS_HOJE)); _parEditId = '8';`);
    m.run('renderParadaEdit()');
    m.C.document.getElementById('par-m-tipo-8').value = 'Outro';
    m.C.document.getElementById('par-m-obs-8').value = 'falta de peça';
    await m.run(`salvarMotivoParada('8')`);
    const p = JSON.parse(decodeURIComponent(/paradas=([^&]+)/.exec(m.C.URLS[0])[1]))[0];
    ok('a marca do fechamento automático fica (o .gs lê FIM = INÍCIO por ela)', p.obs, 'falta de peça (encerrada automaticamente no fechamento)');
  }
  {
    const m = celular();
    m.run(`PARADAS_HOJE = [{ id: 9, tipo: 'A INFORMAR', ini: '10:00:00', fim: '10:04:00', obs: '' }];
           SERVIDOR = JSON.parse(JSON.stringify(PARADAS_HOJE)); FALHA = true; _parEditId = '9';`);
    m.run('renderParadaEdit()');
    m.C.document.getElementById('par-m-tipo-9').value = 'Outro';
    await m.run(`salvarMotivoParada('9')`);
    ok('sem resposta e o servidor sem o tipo: diz que NÃO gravou e manda repetir', /NÃO foi gravado/.test(m.C.ALERTS[0] || ''), true);
  }

  console.log('\n── a TV, a GESTÃO DE PERDAS e a conta ──');
  ok('TV: sem motivo, o tipo grande diz PARADA e a linha de baixo, que o motivo vem do app',
     [/semMotivo = paradaAInformar\(cur\.tipo\)/.test(VJS), /semMotivo \? 'PARADA' : cur\.tipo/.test(VJS), /'motivo a informar no app'/.test(VJS)], [true, true, true]);
  {
    eval(VJS.match(/const PG_RE_GENERICO\s*=[^\n]+/)[0].replace('const ', 'var '));
    var ehSetupParada = () => false;
    eval(pega(VJS, 'function _pgClasseGer('));
    ok('GESTÃO DE PERDAS: A INFORMAR é A IDENTIFICAR (causa desconhecida), como "Outros"',
       [_pgClasseGer('A INFORMAR', false), _pgClasseGer('Outros', false), _pgClasseGer('Manutenção', false)], ['IDENTIFICAR', 'IDENTIFICAR', 'ANORMAL']);
  }
  {
    const C = { window: {} }; C.window = C; vm.createContext(C);
    vm.runInContext(fs.readFileSync(path.join(__dirname, 'paradas-calc.js'), 'utf8'), C);
    ok('a conta de perda: A INFORMAR não é planejada (entra como perda até ter motivo)', C.RP_PARADAS.ehPlanejada('A INFORMAR', {}), false);
  }
  ok('nada no .gs: o motivo vai pelo mesmo saveParadas (upsert pelo ID)', /action=saveParadas&paradas=/.test(pega(MJS, 'async function salvarMotivoParada(')), true);

  console.log(falhas === 0
    ? '\n✅ parada com motivo depois ok — PAROU na hora, A INFORMAR à vista, o motivo entra depois sem reabrir a parada\n'
    : `\n❌ ${falhas} falha(s)\n`);
  process.exitCode = falhas ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
