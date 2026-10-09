// Programação: produção ADIANTADA, coluna ENCERRAR e aviso de cor errada.
//   node programacao.test.js
//
// Medido na planilha em 09/10/2026: 58 linhas vencidas abertas, 3.770 cx de
// "falta". 1.716 cx eram caixa embalada 1–2 dias ANTES da data do lote (o FIFO
// descartava), 101 cx eram sobras de 1 a 10 cx, ~1.350 cx eram cor IRMÃ do mesmo
// produto com caixa sobrando (cor errada no app). O PPCP excluía a linha à mão.
//
// O .gs é carregado INTEIRO num contexto com planilha de mentira — o mesmo
// caminho que roda no Apps Script (calcular → gravar saldo → arquivar), não
// funções soltas. Um nome inexistente nos ramos novos quebra aqui.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const GS = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');
const MOB = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
const V7 = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const MJS = [...MOB.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

// ── planilha de mentira (só o que o caminho usa) ─────────────────────────────
// HOJE = sexta, 09/10/2026.
const HDR_PROG = ['LOTE', 'DATA', 'ORDEM', 'CODIGO', 'DESCRICAO', 'QTD_CX', 'PRODUZIDO', 'SALDO', 'PERCENTUAL', 'STATUS', 'ATUALIZADO_EM', 'ENCERRAR'];
function montar(prog, log, opts) {
  opts = opts || {};
  const ABAS = {
    PROGRAMACAO: [HDR_PROG].concat(prog.map(l => [l.lote, l.data, 1, l.cod, 'X', l.qtde,
      l.prod == null ? '' : l.prod, '', '', l.status || '', '', l.enc === undefined ? '' : l.enc])),
    PRODUCAO_PRODUTO: [['DATA', 'HORA', 'CODIGO', 'DESCRICAO', 'CAIXAS']].concat(log.map(e => [e[0], '08:00', e[1], 'X', e[2]])),
    PRODUTO_CODIGO: [['CODIGO', 'DESCRICAO', 'COR']],
  };
  if (opts.arq) ABAS.PROGRAMACAO_CONCLUIDA = opts.arq;
  function aba(nome) {
    const v = ABAS[nome];
    if (!v) return null;
    return {
      getName: () => nome, getLastRow: () => v.length, getLastColumn: () => v[0].length, getMaxRows: () => v.length,
      getDataRange: () => ({ getValues: () => v.map(r => r.slice()) }),
      getRange: (l, c, nl, nc) => ({
        getValues: () => v.slice(l - 1, l - 1 + (nl || 1)).map(r => r.slice(c - 1, c - 1 + (nc || 1))),
        setValue: x => { v[l - 1][c - 1] = x; },
        setValues: xs => xs.forEach((row, k) => {
          if (!v[l - 1 + k]) v[l - 1 + k] = new Array(v[0].length).fill('');
          row.forEach((x, j) => { v[l - 1 + k][c - 1 + j] = x; });
        }),
        getValue: () => (v[l - 1] || [])[c - 1], getFormula: () => '', setNumberFormat: () => {},
      }),
      deleteRow: n => { v.splice(n - 1, 1); }, setFrozenRows: () => {}, appendRow: r => v.push(r),
    };
  }
  const ss = { getSheetByName: aba, getSheets: () => Object.keys(ABAS).map(aba),
               insertSheet: nome => { ABAS[nome] = [['']]; return aba(nome); }, getName: () => 'teste' };
  let src = GS;
  if (opts.antec != null) src = src.replace(/const ANTEC_DIAS_UTEIS = \d+;/, 'const ANTEC_DIAS_UTEIS = ' + opts.antec + ';');
  const hoje = opts.hoje || '09/10/2026';
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush: () => {} },
    Utilities: { formatDate: (d, tz, f) => f === 'yyyy' ? '2026' : (/HH/.test(f) ? hoje + ' 07:30:00' : hoje) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  // O caminho REAL do lançamento: sincronizarPlanilhaPosLancamento passa o MESMO
  // cálculo para gravar o saldo e para arquivar. Quantas linhas saíram = a
  // diferença de tamanho da aba.
  const rodar = () => vm.runInContext(
    '(function(){ _invalidarValores(); var n = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PROGRAMACAO").getLastRow(); ' +
    'sincronizarPlanilhaPosLancamento(); _invalidarValores(); ' +
    'return { p: calcularProgramacao(), a: { arquivadas: n - SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PROGRAMACAO").getLastRow() } }; })()', ctx);
  const calc = () => vm.runInContext('(function(){ _invalidarValores(); return calcularProgramacao(); })()', ctx);
  return { ABAS, ctx, rodar, calc };
}
const col = (aba, nome) => aba[0].map(x => String(x).trim().toUpperCase()).indexOf(nome);
function linha(aba, lote, cod) {
  const iL = col(aba, 'LOTE'), iC = col(aba, 'CODIGO');
  return aba.find((r, i) => i > 0 && String(r[iL]) === String(lote) && String(r[iC]) === String(cod)) || null;
}
const campos = (aba, r, nomes) => r ? nomes.map(n => r[col(aba, n)]) : null;

console.log('\n── dias úteis ──');
{
  const { ctx } = montar([], []);
  const du = (a, b) => vm.runInContext(`_diasUteisEntre(${a}, ${b})`, ctx);
  ok('quarta → quinta = 1 · quarta → sexta = 2', [du(20261007, 20261008), du(20261007, 20261009)], [1, 2]);
  ok('sexta → segunda = 1 (o fim de semana não conta)', du(20261002, 20261005), 1);
  ok('segunda → quinta = 3 · mesmo dia = 0 · data anterior = 0', [du(20261005, 20261008), du(20261008, 20261008), du(20261009, 20261008)], [3, 0, 0]);
  ok('virada de mês: 30/09 → 01/10 = 1', du(20260930, 20261001), 1);
}

console.log('\n── produção ADIANTADA ──');
{
  const prog = [
    { lote: 'L1', data: '08/10/2026', cod: '501106005', qtde: 220 },   // embalado na véspera (07/10)
    { lote: 'L2', data: '05/10/2026', cod: '501141007', qtde: 50 },    // embalado na sexta 02/10
    { lote: 'L3', data: '08/10/2026', cod: '501097001', qtde: 40 },    // embalado 3 dias úteis antes (05/10)
    { lote: 'L4', data: '01/10/2026', cod: '501070005', qtde: 30 },    // lote VELHO aberto do mesmo código…
    { lote: 'L5', data: '08/10/2026', cod: '501070005', qtde: 30 },    // …e o novo
  ];
  const log = [['07/10/2026', '501106005', 219], ['02/10/2026', '501141007', 50], ['05/10/2026', '501097001', 40], ['07/10/2026', '501070005', 60]];
  const novo = montar(prog, log).calc(), velho = montar(prog, log, { antec: 0 }).calc();
  const sl = (p, k) => p.saldoLinha[k];
  ok('regra antiga: a véspera era descartada (saldo 220, 50, 40)',
     [sl(velho, '501106005|L1|20261008'), sl(velho, '501141007|L2|20261005'), sl(velho, '501097001|L3|20261008')], [220, 50, 40]);
  ok('regra nova: a véspera abate o lote (sobra 1) e sexta → segunda também (0)',
     [sl(novo, '501106005|L1|20261008'), sl(novo, '501141007|L2|20261005')], [1, 0]);
  ok('3 dias úteis antes NÃO abate: passa da janela', sl(novo, '501097001|L3|20261008'), 40);
  ok('o lote velho aberto do código come primeiro; a sobra vai para o novo',
     [sl(novo, '501070005|L4|20261001'), sl(novo, '501070005|L5|20261008')], [0, 0]);
  ok('o atraso cai, a meta do dia não muda', [velho.atrasoTotal, novo.atrasoTotal, velho.programadoHoje === novo.programadoHoje], [340, 41, true]);
}

console.log('\n── ENCERRAR ──');
{
  const prog = [
    // célula PRODUZIDO vazia (linha nunca calculada): passa inteira pelo FIFO, com o adiantamento
    { lote: 'L1', data: '07/10/2026', cod: '501106005', qtde: 220, enc: 'X' },
    // atraso real que não vai ser feito
    { lote: 'L2', data: '29/09/2026', cod: '501140002', qtde: 410, prod: 99, status: 'EM ATRASO', enc: 'X' },
    // lote DE HOJE encerrado com 60 de 100
    { lote: 'L3', data: '09/10/2026', cod: '501147002', qtde: 100, prod: 60, status: 'EM ANDAMENTO', enc: 'x' },
    // linha FUTURA marcada: a marca espera a data
    { lote: 'L4', data: '12/10/2026', cod: '501060004', qtde: 80, enc: 'X' },
    // linha normal, para comparar
    { lote: 'L5', data: '09/10/2026', cod: '501061001', qtde: 50 },
  ];
  const log = [['06/10/2026', '501106005', 219], ['29/09/2026', '501140002', 99], ['09/10/2026', '501147002', 60]];
  const m = montar(prog, log);
  const antes = m.calc();
  ok('ENCERRADA de hoje: a meta do dia continua com a QTDE original (100 + 50)', antes.programadoHoje, 150);
  ok('o saldo das encerradas não é cobrado: atraso 0, falta de hoje só da linha normal', [antes.atrasoTotal, antes.hojeRestante], [0, 50]);
  const r1 = m.rodar();
  const A = m.ABAS.PROGRAMACAO_CONCLUIDA, P = m.ABAS.PROGRAMACAO;
  const NOMES = ['QTD_CX', 'PRODUZIDO', 'SALDO', 'PERCENTUAL', 'STATUS', 'ENCERRAR'];
  ok('célula vazia: passa inteira e sai com as 219 adiantadas', campos(A, linha(A, 'L1', '501106005'), NOMES), [220, 219, 0, 99, 'ENCERRADO', 'X']);
  ok('o atraso real sai com o que fez (99 de 410)', campos(A, linha(A, 'L2', '501140002'), NOMES), [410, 99, 0, 24, 'ENCERRADO', 'X']);
  ok('o de hoje sai com 60 de 100', campos(A, linha(A, 'L3', '501147002'), NOMES), [100, 60, 0, 60, 'ENCERRADO', 'x']);
  ok('as três saem da PROGRAMACAO; a futura e a normal ficam', [r1.a.arquivadas, !!linha(P, 'L4', '501060004'), !!linha(P, 'L5', '501061001')], [3, true, true]);
  ok('linha futura marcada fica em branco até a data', campos(P, linha(P, 'L4', '501060004'), ['PRODUZIDO', 'STATUS']), ['', '']);
  ok('a meta do dia continua 150 depois de arquivar (a CONCLUIDA conta)', r1.p.programadoHoje, 150);
  // produção NOVA dos códigos encerrados não volta para as linhas fechadas
  m.ABAS.PRODUCAO_PRODUTO.push(['09/10/2026', '09:00', '501140002', 'X', 50], ['09/10/2026', '09:00', '501106005', 'X', 10]);
  const r2 = m.rodar();
  const it = c => r2.p.lista.find(x => x.codigo === c) || {};
  ok('caixa nova de código encerrado não reabre a linha (atraso continua 0)', [r2.p.atrasoTotal, it('501140002').falta, it('501106005').falta], [0, 0, 0]);
  ok('e a CONCLUIDA não muda', campos(A, linha(A, 'L2', '501140002'), ['PRODUZIDO', 'STATUS']), [99, 'ENCERRADO']);
}

console.log('\n── ENCERRAR congela no PRODUZIDO do lançamento anterior ──');
{
  // lote velho com 40 de 100 já gravados; o PPCP marca X; o lançamento que
  // dispara a rodada traz 30 cx do MESMO código, para o lote de hoje
  const prog = [
    { lote: 'L6', data: '01/10/2026', cod: '501134001', qtde: 100, prod: 40, status: 'EM ATRASO', enc: 'X' },
    { lote: 'L7', data: '09/10/2026', cod: '501134001', qtde: 100 },
  ];
  const m = montar(prog, [['01/10/2026', '501134001', 40], ['09/10/2026', '501134001', 30]]);
  m.rodar();
  const A = m.ABAS.PROGRAMACAO_CONCLUIDA, P = m.ABAS.PROGRAMACAO;
  ok('a encerrada fecha com os 40 que tinha — não come o lançamento novo', campos(A, linha(A, 'L6', '501134001'), ['PRODUZIDO', 'STATUS']), [40, 'ENCERRADO']);
  ok('as 30 caixas novas vão para o lote de hoje', campos(P, linha(P, 'L7', '501134001'), ['PRODUZIDO', 'SALDO', 'STATUS']), [30, 70, 'EM ANDAMENTO']);
}

console.log('\n── marca que quer dizer "não" não encerra ──');
{
  const prog = [false, 'FALSE', 0, 'não', true].map((v, i) => ({ lote: 'M' + i, data: '08/10/2026', cod: '50100000' + i, qtde: 10, enc: v }));
  const m = montar(prog, prog.map((l, i) => ['08/10/2026', l.cod, 4]));
  m.rodar();
  const P = m.ABAS.PROGRAMACAO;
  ok('caixa de seleção desmarcada (FALSE), "0" e "não" deixam a linha aberta; TRUE encerra',
     prog.map(l => (campos(P, linha(P, l.lote, l.cod), ['STATUS']) || ['(arquivada)'])[0]),
     ['EM ATRASO', 'EM ATRASO', 'EM ATRASO', 'EM ATRASO', '(arquivada)']);
}

console.log('\n── o crédito espera a data do lote ──');
{
  const prog = [{ lote: 'L8', data: '09/10/2026', cod: '501070005', qtde: 180 }];
  const log = [['07/10/2026', '501070005', 180]];
  const ontem = montar(prog, log, { hoje: '08/10/2026' }).calc();
  ok('na véspera o lote ainda não existe para o FIFO (data futura)', ontem.saldoLinha['501070005|L8|20261009'], undefined);
  const hoje = montar(prog, log, { hoje: '09/10/2026' }).calc();
  ok('no dia dele, o crédito de 07/10 abate o lote inteiro', hoje.saldoLinha['501070005|L8|20261009'], 0);
  const tarde = montar(prog, log, { hoje: '13/10/2026' }).calc();
  ok('o resultado não muda com o passar dos dias (a janela é produção × data do lote, não × hoje)', tarde.saldoLinha['501070005|L8|20261009'], 0);
}

console.log('\n── a coluna ENCERRAR nasce sozinha ──');
{
  const m = montar([{ lote: 'L1', data: '09/10/2026', cod: '501128002', qtde: 150 }], [['09/10/2026', '501128002', 20]]);
  m.ABAS.PROGRAMACAO.forEach(r => r.pop());   // aba como está hoje: sem ENCERRAR
  m.rodar();
  const h = m.ABAS.PROGRAMACAO[0];
  ok('o script cria ENCERRAR no FIM da aba, com o título exato', h[h.length - 1], 'ENCERRAR');
  ok('o LOTE continua sendo a 1ª coluna com LOTE (as chaves casam)', h.findIndex(x => String(x).toUpperCase().includes('LOTE')), 0);
  ok('e o saldo da linha foi gravado normal', campos(m.ABAS.PROGRAMACAO, linha(m.ABAS.PROGRAMACAO, 'L1', '501128002'), ['PRODUZIDO', 'SALDO', 'STATUS']), [20, 130, 'EM ANDAMENTO']);
}

console.log('\n── getProgramacaoHoje: próximos dias úteis ──');
{
  const prog = [
    { lote: 'L1', data: '09/10/2026', cod: '501128002', qtde: 150 },
    { lote: 'L2', data: '12/10/2026', cod: '501060004', qtde: 80 },    // segunda = 1 dia útil
    { lote: 'L3', data: '13/10/2026', cod: '501060005', qtde: 80 },    // terça = 2
    { lote: 'L4', data: '14/10/2026', cod: '501060006', qtde: 80 },    // quarta = 3 → fora
    { lote: 'L5', data: '13/10/2026', cod: '501070001', qtde: 80, enc: 'X' },  // encerrada não conta
  ];
  const m = montar(prog, []);
  const h = vm.runInContext('getProgramacaoHoje()', m.ctx);
  ok('proximos = lotes nos próximos 2 dias úteis (sem a encerrada)', h.proximos.slice().sort(), ['501060004', '501060005']);
  ok('e a lista do dia continua igual', h.produtos.map(x => x.codigo), ['501128002']);
}

console.log('\n── app: aviso de cor errada ──');
function pegaMob(assinatura) {
  const i = MJS.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei no mobile: ' + assinatura);
  const j = MJS.indexOf('{', MJS.indexOf(')', i));
  let n = 0;
  for (let k = j; k < MJS.length; k++) {
    if (MJS[k] === '{') n++;
    else if (MJS[k] === '}' && --n === 0) return MJS.slice(i, k + 1);
  }
  throw new Error('função não fecha: ' + assinatura);
}
{
  global.PRODUTOS = [{ codigo: '501.128.001', desc: 'VOL 1/1 MESA CENTRO SLIM', cor: 'BRANCO' },
                     { codigo: '501.128.002', desc: 'VOL 1/1 MESA CENTRO SLIM', cor: 'OFF WHITE' }];
  global.fmtN = n => String(n);
  eval(pegaMob('function normTxt(').replace('function normTxt', 'global.normTxt = function'));
  eval(pegaMob('function corDeProduto(').replace('function corDeProduto', 'global.corDeProduto = function'));
  eval(pegaMob('function avisoCorErrada(').replace('function avisoCorErrada', 'global.avisoCorErrada = function'));
  eval(pegaMob('function avisoCorErradaTxt(').replace('function avisoCorErradaTxt', 'global.avisoCorErradaTxt = function'));
  // 25/09: OFF WHITE com lote de 150 já fechado e o BRANCO do mesmo lote com 300 em aberto
  const prog = [
    { codigo: '501.128.002', desc: 'VOL 1/1 MESA CENTRO SLIM', cor: 'OFF WHITE', lote: 25229, falta: 0 },
    { codigo: '501.128.001', desc: 'VOL 1/1 MESA CENTRO SLIM', cor: 'BRANCO', lote: 25229, falta: 300 },
    { codigo: '501.130.011', desc: 'VOL 1/1 MESA APOIO LUNA 530', cor: 'OFF WHITE', lote: 25230, falta: 40 },
  ];
  const a = avisoCorErrada('501.128.002', 20, prog, []);
  ok('lote do código fechado e cor irmã com saldo → avisa, apontando a irmã', a && [a.falta, a.cor, a.irmas.map(p => p.cor)], [0, 'OFF WHITE', ['BRANCO']]);
  ok('o texto diz a cor irmã e o saldo (sem número de lote, que pode não ser o do saldo)',
     [/BRANCO \(300 cx\)/.test(avisoCorErradaTxt(a, 20)), /lote/.test(avisoCorErradaTxt(a, 20))], [true, false]);
  ok('dentro do saldo do próprio código → não avisa',
     avisoCorErrada('501.128.001', 20, prog, []), null);
  ok('código com lote nos próximos dias úteis é ADIANTAMENTO → não avisa',
     avisoCorErrada('501.128.002', 20, prog, ['501128002']), null);
  ok('mesmo modelo de 6 dígitos mas OUTRO produto (501130 tem quatro mesas) → não avisa',
     avisoCorErrada('501.130.015', 20, prog.concat([{ codigo: '501.130.015', desc: 'VOL 1/1 MESA LATERAL LUNA 440', cor: 'CUMARU', falta: 0 }]), []), null);
  ok('sem cor irmã em aberto → não avisa',
     avisoCorErrada('501.128.002', 20, prog.map(p => Object.assign({}, p, { falta: 0 })), []), null);
  ok('passa do saldo (sobram 10, lança 20) com irmã em aberto → avisa com o saldo que sobrou',
     (avisoCorErrada('501.128.002', 20, prog.map(p => p.cor === 'OFF WHITE' ? Object.assign({}, p, { falta: 10 }) : p), []) || {}).falta, 10);
  ok('passa do saldo mas a irmã está zerada → não é troca, não avisa',
     avisoCorErrada('501.128.001', 320, prog, []), null);
  const SL = pegaMob('async function salvarLanc(');
  ok('o aviso vem ANTES do SALVANDO; TROCAR A COR não grava e abre o seletor',
     [SL.indexOf('avisoCorErrada(codLanc') > 0 && SL.indexOf('avisoCorErrada(codLanc') < SL.indexOf("btn.textContent='SALVANDO...'"),
      /if\(!seguir\)\{ abrirModalProduto\(\); return; \}/.test(SL)], [true, true]);
  ok('o destaque (laranja) fica no TROCAR A COR, não no seguir em frente',
     [/cancelar:'TROCAR A COR', seguro:'cancelar'/.test(SL), /document\.getElementById\('cf-cancel'\)\.className = inv \? 'btn-salvar'/.test(MJS)], [true, true]);
  ok('depois de gravar, o saldo local do código desconta o lançado', /it\.falta=Math\.max\(0,\(Number\(it\.falta\)\|\|0\)-add\)/.test(SL), true);
  ok('código e slot guardados antes da pergunta; mudou durante ela, não grava',
     [/const codLanc = PROD_ATUAL, slotLanc = _slotAtivo;/.test(SL), /if\(_slotAtivo!==slotLanc \|\| PROD_ATUAL!==codLanc\) return;/.test(SL),
      /params\.push\('produto='\+encodeURIComponent\(codLanc\)\)/.test(SL)], [true, true, true]);
  ok('não julga com a lista de outro dia, e relê a lista velha depois de gravar',
     [/PROG_HOJE_DIA===hojeStr\(\)/.test(SL), /if\(Date\.now\(\)-PROG_HOJE_TS > PROG_HOJE_TTL\) carregarProgramacaoHoje\(\);/.test(SL)], [true, true]);
  ok('o confirmar abre POR CIMA do modal de lançamento', /#modal-confirma\{z-index:120\}/.test(MOB), true);
  ok('o app guarda os próximos dias úteis do backend', /PROG_PROX = Array\.isArray\(json\.proximos\) \? json\.proximos : null;/.test(MJS), true);
}

console.log('\n── painel: aba PROGRAMAÇÃO ──');
{
  const JS7 = [...V7.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  ok('linha encerrada mostra ENCERRADO, nunca "✓ OK" nem a falta de outra linha',
     /const fechada=it\.encerrada\?'ENCERRADO':\(it\.foraEsteira\?'FORA DA ESTEIRA':''\);/.test(JS7) && /const faltaTxt=fechada\|\|/.test(JS7), true);
  ok('o backend só marca encerrada linha vencida ou de hoje', /encerrada:\s+!!pr\.encerrada && !futura/.test(GS), true);
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ programação ok — adiantamento abate o lote, ENCERRAR fecha sem apagar, o app pergunta a cor');
process.exit(falhas ? 1 : 0);
