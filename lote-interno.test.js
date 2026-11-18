// Teste do ATENDIMENTO POR LOTE INTERNO (v7.260.0 · mobile 1.55.0 · rp-core 1.22.0 · .gs v5.69; sub-aba da PROGRAMAÇÃO desde a v7.261.0).
//   node lote-interno.test.js
//
// PPCP, 17/11/2026, com a PROGRAMACAO_CONCLUIDA na tela: "me mostre como podemos
// apresentar percentual de cada lote que ficou aberto" → "vamos usar o lote
// interno" → aba PROGRAMAÇÃO do PC, "no app tbm", "tem que pensar em impressão
// tbm". Roda o código REAL: a leitura do .gs (getAtendimentoLotes), a conta do
// rp-core (loteIntMontar) com o retrato das duas abas de 17/11/2026 09:38 e os
// dois desenhos (PC/papel e celular).

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, 'ritmoprod_embalagem_v7.html'), 'utf8');
const mob  = fs.readFileSync(path.join(__dirname, 'ritmoprod_mobile.html'), 'utf8');
const gs   = fs.readFileSync(path.join(__dirname, 'ritmoprod_appscript.gs'), 'utf8');
const scripts = h => [...h.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const JS = scripts(html), MJS = scripts(mob);

function pega(src, assinatura) {
  const i = src.indexOf(assinatura);
  if (i < 0) throw new Error('não encontrei: ' + assinatura);
  const j = src.indexOf('{', src.indexOf(')', i));
  let n = 0;
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') n++;
    else if (src[k] === '}' && --n === 0) return src.slice(i, k + 1);
  }
  throw new Error('não fecha: ' + assinatura);
}
const linha = (src, re) => { const m = src.match(re); if (!m) throw new Error('sumiu: ' + re); return m[0]; };

let falhas = 0;
function ok(nome, real, esperado) {
  const bate = JSON.stringify(real) === JSON.stringify(esperado);
  if (!bate) falhas++;
  console.log((bate ? '  ✅ ' : '  ❌ ') + nome +
    (bate ? '' : `\n       esperado: ${JSON.stringify(esperado)}\n       recebido: ${JSON.stringify(real)}`));
}

global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(__dirname, 'rp-core.js'), 'utf8'));

// ── o retrato de 17/11/2026 09:38 (as duas abas, lotes internos 198/26 a 212/26) ──
// [li, dataNum, lote, codigo, qtde, embalado, encerrada, aba aberta, cor GPS]
const RET = [
["193/26",20261020,"25321","501060003",150,150,0,0,"VERDE"],
["193/26",20261020,"25321","501060004",150,150,0,0,"VERDE"],
["193/26",20261020,"25321","501060006",50,50,0,0,"VERDE"],
["193/26",20261020,"25319","501149001",300,299,1,0,"VERDE"],
["193/26",20261020,"25319","501149002",200,198,1,0,"VERDE"],
["193/26",20261020,"25319","501149003",600,593,1,0,"VERDE"],
["193/26",20261020,"25319","501149004",200,199,1,0,"VERDE"],
["194/26",20261021,"25327","501061004",135,135,0,0,"BRANCO"],
["194/26",20261021,"25326","501128003",25,25,0,0,"BRANCO"],
["193/26",20261020,"25320","501088005",60,58,1,0,"VERDE"],
["193/26",20261020,"25320","501088006",60,54,1,0,"VERDE"],
["193/26",20261020,"25320","501088008",140,135,1,0,"VERDE"],
["193/26",20261020,"25321","501060001",200,198,1,0,"VERDE"],
["193/26",20261020,"25321","501060002",200,198,1,0,"VERDE"],
["193/26",20261020,"25321","501060005",50,49,1,0,"VERDE"],
["194/26",20261021,"25326","501128001",10,10,0,0,"BRANCO"],
["194/26",20261021,"25326","501128002",110,110,0,0,"BRANCO"],
["194/26",20261021,"25326","501128004",55,55,0,0,"BRANCO"],
["195/26",20261022,"25330","501059007",35,35,0,0,"VERMELHO"],
["195/26",20261022,"25330","501059008",35,35,0,0,"VERMELHO"],
["193/26",20261020,"25320","501088007",140,0,1,0,"VERDE"],
["194/26",20261021,"25325","501149001",300,295,1,0,"BRANCO"],
["194/26",20261021,"25325","501149002",200,180,1,0,"BRANCO"],
["194/26",20261021,"25325","501149003",600,591,1,0,"BRANCO"],
["194/26",20261021,"25325","501149004",200,195,1,0,"BRANCO"],
["194/26",20261021,"25327","501061001",90,88,1,0,"BRANCO"],
["194/26",20261021,"25327","501061002",90,64,1,0,"BRANCO"],
["194/26",20261021,"25327","501061003",135,133,1,0,"BRANCO"],
["194/26",20261021,"25327","501061005",125,105,1,0,"BRANCO"],
["194/26",20261021,"25327","501061006",125,124,1,0,"BRANCO"],
["195/26",20261022,"25331","501082004",185,185,0,0,"VERMELHO"],
["196/26",20261023,"25338","501106013",65,65,0,0,"AMARELO"],
["195/26",20261022,"25330","501059001",400,396,1,0,"VERMELHO"],
["195/26",20261022,"25330","501059002",400,396,1,0,"VERMELHO"],
["195/26",20261022,"25330","501059003",65,63,1,0,"VERMELHO"],
["195/26",20261022,"25330","501059004",65,64,1,0,"VERMELHO"],
["195/26",20261022,"25331","501082001",140,132,1,0,"VERMELHO"],
["195/26",20261022,"25331","501082002",90,87,1,0,"VERMELHO"],
["195/26",20261022,"25331","501082003",185,181,1,0,"VERMELHO"],
["196/26",20261023,"25336","501159001",200,0,1,0,"AMARELO"],
["196/26",20261023,"25335","501083121",320,320,0,0,"AMARELO"],
["196/26",20261023,"25335","501083119",20,20,0,0,"AMARELO"],
["196/26",20261023,"25335","501083120",10,9,1,0,"AMARELO"],
["196/26",20261023,"25337","501106004",70,65,1,0,"AMARELO"],
["196/26",20261023,"25337","501106005",205,203,1,0,"AMARELO"],
["196/26",20261023,"25337","501106012",75,72,1,0,"AMARELO"],
["196/26",20261023,"25338","501106008",75,74,1,0,"AMARELO"],
["196/26",20261023,"25339","501071005",100,100,0,0,"AMARELO"],
["197/26",20261026,"25343","501138001",110,110,0,0,"AZUL"],
["197/26",20261026,"25341","501151004",90,90,0,0,"AZUL"],
["198/26",20261027,"25347","501140002",120,120,0,0,"PRETO"],
["196/26",20261023,"25338","501106009",210,205,1,0,"AMARELO"],
["196/26",20261023,"25339","501071004",100,98,1,0,"AMARELO"],
["196/26",20261023,"25339","501071006",100,96,1,0,"AMARELO"],
["197/26",20261026,"25340","501118001",320,317,1,0,"AZUL"],
["197/26",20261026,"25340","501118002",20,18,1,0,"AZUL"],
["198/26",20261027,"25347","501140003",70,70,0,0,"PRETO"],
["198/26",20261027,"25347","501140001",210,210,0,0,"PRETO"],
["197/26",20261026,"25342","501114006",200,198,1,0,"AZUL"],
["197/26",20261026,"25343","501138002",50,47,1,0,"AZUL"],
["197/26",20261026,"25343","501138003",240,237,1,0,"AZUL"],
["198/26",20261027,"25355","501077001",100,100,0,0,"PRETO"],
["198/26",20261027,"25355","501077004",220,220,0,0,"PRETO"],
["198/26",20261027,"25355","501077006",30,30,0,0,"PRETO"],
["197/26",20261026,"25340","501118005",360,342,1,0,"AZUL"],
["197/26",20261026,"25341","501151003",110,83,1,0,"AZUL"],
["198/26",20261027,"25353","501134002",290,286,1,0,"PRETO"],
["198/26",20261027,"25354","501149001",400,397,1,0,"PRETO"],
["198/26",20261027,"25354","501149002",100,98,1,0,"PRETO"],
["198/26",20261027,"25354","501149003",400,397,1,0,"PRETO"],
["198/26",20261027,"25354","501149004",400,394,1,0,"PRETO"],
["198/26",20261027,"25355","501077003",220,219,1,0,"PRETO"],
["199/26",20261028,"25356","501152001",65,65,0,0,"VERDE"],
["199/26",20261028,"25358","501085006",65,65,0,0,"VERDE"],
["199/26",20261028,"25358","501085118",85,85,0,0,"VERDE"],
["199/26",20261028,"25359","501083006",60,60,0,0,"VERDE"],
["199/26",20261028,"25356","501152002",185,181,1,0,"VERDE"],
["199/26",20261028,"25357","501152003",55,53,1,0,"VERDE"],
["199/26",20261028,"25357","501152004",95,93,1,0,"VERDE"],
["199/26",20261028,"25359","501083118",140,138,1,0,"VERDE"],
["200/26",20261029,"25360","501060002",160,160,0,0,"BRANCO"],
["200/26",20261029,"25360","501060004",130,130,0,0,"BRANCO"],
["200/26",20261029,"25360","501060005",60,60,0,0,"BRANCO"],
["200/26",20261029,"25360","501060006",60,60,0,0,"BRANCO"],
["200/26",20261029,"25363","501116005",150,150,0,0,"BRANCO"],
["200/26",20261029,"25360","501060001",160,157,1,0,"BRANCO"],
["200/26",20261029,"25360","501060003",130,124,1,0,"BRANCO"],
["200/26",20261029,"25361","501141007",115,114,1,0,"BRANCO"],
["200/26",20261029,"25361","501141008",270,267,1,0,"BRANCO"],
["200/26",20261029,"25361","501141009",15,11,1,0,"BRANCO"],
["200/26",20261029,"25362","501145003",85,83,1,0,"BRANCO"],
["200/26",20261029,"25362","501145005",115,113,1,0,"BRANCO"],
["200/26",20261029,"25363","501116003",250,248,1,0,"BRANCO"],
["200/26",20261029,"25363","501116004",90,81,1,0,"BRANCO"],
["200/26",20261029,"25363","501116006",160,157,1,0,"BRANCO"],
["201/26",20261030,"25373","501061006",70,70,0,0,"VERMELHO"],
["201/26",20261030,"25373","501061002",40,40,0,0,"VERMELHO"],
["198/26",20261027,"25353","501134001",160,150,1,0,"PRETO"],
["200/26",20261029,"25363","501116001",100,98,1,0,"BRANCO"],
["201/26",20261030,"25373","501061001",40,37,1,0,"VERMELHO"],
["201/26",20261030,"25373","501061003",190,188,1,0,"VERMELHO"],
["201/26",20261030,"25373","501061004",190,186,1,0,"VERMELHO"],
["201/26",20261030,"25373","501061005",70,69,1,0,"VERMELHO"],
["201/26",20261030,"25374","501157001",40,36,1,0,"VERMELHO"],
["201/26",20261030,"25374","501157003",60,58,1,0,"VERMELHO"],
["201/26",20261030,"25375","501072001",50,50,0,0,"VERMELHO"],
["201/26",20261030,"25375","501072002",50,50,0,0,"VERMELHO"],
["201/26",20261030,"25375","501072005",150,150,0,0,"VERMELHO"],
["203/26",20261104,"25390","501136001",190,190,0,0,"AZUL"],
["198/26",20261027,"25355","501077002",100,50,1,0,"PRETO"],
["198/26",20261027,"25355","501077005",30,0,1,0,"PRETO"],
["199/26",20261028,"25348","501155001",160,90,1,0,"VERDE"],
["199/26",20261028,"25348","501155002",340,334,1,0,"VERDE"],
["201/26",20261030,"25375","501072003",50,48,1,0,"VERMELHO"],
["201/26",20261030,"25375","501072004",150,146,1,0,"VERMELHO"],
["201/26",20261030,"25375","501072006",150,149,1,0,"VERMELHO"],
["202/26",20261103,"25379","501088001",95,90,1,0,"AMARELO"],
["202/26",20261103,"25379","501088002",95,87,1,0,"AMARELO"],
["202/26",20261103,"25379","501088003",105,103,1,0,"AMARELO"],
["202/26",20261103,"25379","501088004",105,102,1,0,"AMARELO"],
["202/26",20261103,"25381","501141007",135,120,1,0,"AMARELO"],
["202/26",20261103,"25381","501141008",330,328,1,0,"AMARELO"],
["202/26",20261103,"25381","501141009",35,33,1,0,"AMARELO"],
["203/26",20261104,"25390","501136005",150,147,1,0,"AZUL"],
["203/26",20261104,"25386","501134001",240,240,0,0,"AZUL"],
["203/26",20261104,"25390","501136004",130,130,0,0,"AZUL"],
["203/26",20261104,"25388","501157005",30,30,0,0,"AZUL"],
["203/26",20261104,"25386","501134002",210,210,0,0,"AZUL"],
["203/26",20261104,"25390","501136002",110,110,0,0,"AZUL"],
["203/26",20261104,"25387","501158001",25,25,0,0,"AZUL"],
["202/26",20261103,"25380","501068002",150,150,0,0,"AMARELO"],
["204/26",20261105,"25391","501060006",50,50,0,0,"PRETO"],
["203/26",20261104,"25388","501157006",40,39,1,0,"AZUL"],
["203/26",20261104,"25389","501157008",40,39,1,0,"AZUL"],
["203/26",20261104,"25389","501157009",60,56,1,0,"AZUL"],
["203/26",20261104,"25390","501136003",370,368,1,0,"AZUL"],
["203/26",20261104,"25390","501136006",150,148,1,0,"AZUL"],
["203/26",20261104,"25416","501134001",100,88,1,0,"AZUL"],
["203/26",20261104,"25416","501134002",150,147,1,0,"AZUL"],
["204/26",20261105,"25391","501060001",190,187,1,0,"PRETO"],
["204/26",20261105,"25391","501060002",190,189,1,0,"PRETO"],
["204/26",20261105,"25391","501060003",110,109,1,0,"PRETO"],
["204/26",20261105,"25391","501060004",110,87,1,0,"PRETO"],
["204/26",20261105,"25391","501060005",50,49,1,0,"PRETO"],
["204/26",20261105,"25392","501141001",95,95,0,0,"PRETO"],
["205/26",20261106,"25396","501070003",20,20,0,0,"VERDE"],
["205/26",20261106,"25394","501079004",190,190,0,0,"VERDE"],
["206/26",20261109,"25406","501106001",85,85,0,0,"BRANCO"],
["206/26",20261109,"25407","501083122",20,20,0,0,"BRANCO"],
["202/26",20261103,"25380","501068001",150,150,0,0,"AMARELO"],
["204/26",20261105,"25392","501141002",270,267,1,0,"PRETO"],
["204/26",20261105,"25392","501141003",35,33,1,0,"PRETO"],
["204/26",20261105,"25393","501135001",110,105,1,0,"PRETO"],
["204/26",20261105,"25393","501135002",340,337,1,0,"PRETO"],
["205/26",20261106,"25394","501079001",10,6,1,0,"VERDE"],
["205/26",20261106,"25394","501079002",10,5,1,0,"VERDE"],
["205/26",20261106,"25394","501079003",190,189,1,0,"VERDE"],
["205/26",20261106,"25395","501093001",95,93,1,0,"VERDE"],
["205/26",20261106,"25395","501093002",190,181,1,0,"VERDE"],
["205/26",20261106,"25395","501093003",15,14,1,0,"VERDE"],
["205/26",20261106,"25396","501070006",130,126,1,0,"VERDE"],
["206/26",20261109,"25405","501094001",200,198,1,0,"BRANCO"],
["206/26",20261109,"25405","501094002",400,398,1,0,"BRANCO"],
["206/26",20261109,"25405","501094003",400,394,1,0,"BRANCO"],
["206/26",20261109,"25405","501094004",1000,991,1,0,"BRANCO"],
["206/26",20261109,"25405","501094005",200,191,1,0,"BRANCO"],
["206/26",20261109,"25406","501106002",170,168,1,0,"BRANCO"],
["206/26",20261109,"25406","501106011",45,44,1,0,"BRANCO"],
["206/26",20261109,"25407","501083124",280,273,1,0,"BRANCO"],
["207/26",20261110,"25410","501097005",50,50,0,0,"VERMELHO"],
["203/26",20261104,"25387","501158002",75,25,1,0,"AZUL"],
["207/26",20261110,"25410","501097001",100,96,1,0,"VERMELHO"],
["207/26",20261110,"25410","501097002",100,99,1,0,"VERMELHO"],
["207/26",20261110,"25410","501097003",100,99,1,0,"VERMELHO"],
["207/26",20261110,"25410","501097004",500,499,1,0,"VERMELHO"],
["207/26",20261110,"25411","501071006",100,98,1,0,"VERMELHO"],
["207/26",20261110,"25412","501154001",115,112,1,0,"VERMELHO"],
["207/26",20261110,"25412","501154002",40,39,1,0,"VERMELHO"],
["207/26",20261110,"25412","501154003",45,42,1,0,"VERMELHO"],
["208/26",20261111,"25417","501085006",40,40,0,0,"AMARELO"],
["207/26",20261110,"25413","501134001",100,89,1,0,"VERMELHO"],
["207/26",20261110,"25413","501134002",350,336,1,0,"VERMELHO"],
["208/26",20261111,"25417","501085079",25,14,1,0,"AMARELO"],
["208/26",20261111,"25417","501085118",135,127,1,0,"AMARELO"],
["208/26",20261111,"25419","501060001",140,132,1,0,"AMARELO"],
["208/26",20261111,"25419","501060002",140,139,1,0,"AMARELO"],
["208/26",20261111,"25419","501060003",230,229,1,0,"AMARELO"],
["208/26",20261111,"25419","501060004",230,229,1,0,"AMARELO"],
["208/26",20261111,"25419","501060005",30,23,1,0,"AMARELO"],
["208/26",20261111,"25419","501060006",30,29,1,0,"AMARELO"],
["209/26",20261112,"25424","501141006",30,30,0,0,"AZUL"],
["205/26",20261106,"25396","501070001",20,20,0,0,"VERDE"],
["205/26",20261106,"25396","501070002",20,20,0,0,"VERDE"],
["205/26",20261106,"25396","501070005",130,130,0,0,"VERDE"],
["209/26",20261112,"25425","501061006",50,50,0,0,"AZUL"],
["205/26",20261106,"25396","501070004",130,126,1,0,"VERDE"],
["208/26",20261111,"25418","501151001",110,105,1,0,"AMARELO"],
["208/26",20261111,"25418","501151002",90,88,1,0,"AMARELO"],
["209/26",20261112,"25424","501141004",140,139,1,0,"AZUL"],
["209/26",20261112,"25424","501141005",430,426,1,0,"AZUL"],
["209/26",20261112,"25425","501061001",100,87,1,0,"AZUL"],
["209/26",20261112,"25425","501061002",100,93,1,0,"AZUL"],
["209/26",20261112,"25425","501061003",150,148,1,0,"AZUL"],
["209/26",20261112,"25425","501061004",150,149,1,0,"AZUL"],
["209/26",20261112,"25425","501061005",50,49,1,0,"AZUL"],
["210/26",20261113,"25428","501117006",25,25,0,0,"PRETO"],
["210/26",20261113,"25428","501117001",60,60,0,0,"PRETO"],
["210/26",20261113,"25428","501117005",25,25,0,0,"PRETO"],
["209/26",20261112,"25423","501126001",240,240,0,0,"AZUL"],
["210/26",20261113,"25428","501117002",30,28,1,0,"PRETO"],
["210/26",20261113,"25428","501117003",20,15,1,0,"PRETO"],
["210/26",20261113,"25428","501117004",240,233,1,0,"PRETO"],
["210/26",20261113,"25426","501142003",50,50,0,0,"PRETO"],
["207/26",20261110,"25411","501071005",100,99,1,0,"VERMELHO"],
["210/26",20261113,"25426","501142001",25,24,1,0,"PRETO"],
["210/26",20261113,"25426","501142002",635,630,1,0,"PRETO"],
["210/26",20261113,"25426","501142004",390,389,1,0,"PRETO"],
["207/26",20261110,"25411","501071004",100,91,1,0,"VERMELHO"],
["210/26",20261113,"25427","501086117",35,34,1,0,"PRETO"],
["210/26",20261113,"25427","501086119",115,113,1,0,"PRETO"],
["211/26",20261116,"25441","501089001",130,128,1,0,"VERDE"],
["211/26",20261116,"25441","501089002",290,286,1,0,"VERDE"],
["211/26",20261116,"25441","501089003",430,424,1,0,"VERDE"],
["211/26",20261116,"25443","501140001",380,378,1,0,"VERDE"],
["211/26",20261116,"25443","501140002",400,398,1,0,"VERDE"],
["211/26",20261116,"25443","501140003",120,115,1,0,"VERDE"],
["210/26",20261113,"25427","501086116",35,35,0,0,"PRETO"],
["211/26",20261116,"25442","501128004",70,70,0,0,"VERDE"],
["211/26",20261116,"25442","501128002",140,140,0,0,"VERDE"],
["211/26",20261116,"25442","501128001",20,20,0,0,"VERDE"],
["209/26",20261112,"25423","501.126.002",10,0,1,1,"AZUL"],
["210/26",20261113,"25427","501.086.118",115,80,0,1,"PRETO"],
["211/26",20261116,"25442","501.128.003",20,19,0,1,"VERDE"],
["212/26",20261117,"25446","501.134.001",50,45,0,1,"BRANCO"],
["212/26",20261117,"25446","501.134.002",450,450,0,1,"BRANCO"],
["212/26",20261117,"25447","501.070.001",60,0,0,1,"BRANCO"],
["212/26",20261117,"25447","501.070.002",60,0,0,1,"BRANCO"],
["212/26",20261117,"25447","501.070.003",60,0,0,1,"BRANCO"],
["212/26",20261117,"25447","501.070.004",90,0,0,1,"BRANCO"],
["212/26",20261117,"25447","501.070.005",90,0,0,1,"BRANCO"],
["212/26",20261117,"25447","501.070.006",90,0,0,1,"BRANCO"],
["212/26",20261117,"25448","501.080.001",80,0,0,1,"BRANCO"],
["212/26",20261117,"25448","501.080.002",80,0,0,1,"BRANCO"],
["212/26",20261117,"25448","501.080.005",20,0,0,1,"BRANCO"],
["212/26",20261117,"25448","501.080.006",20,0,0,1,"BRANCO"],
["212/26",20261117,"25448","501.080.007",100,0,0,1,"BRANCO"],
["212/26",20261117,"25448","501.080.008",100,0,0,1,"BRANCO"]
];
const LINHAS = RET.map(r => ({ li: r[0], dataNum: r[1], data: String(r[1] % 100).padStart(2, '0') + '/' + String(Math.floor(r[1] / 100) % 100).padStart(2, '0') + '/2026',
  lote: r[2], codigo: r[3], desc: '', qtde: r[4], emb: r[5], encerrada: !!r[6], aba: r[7] ? 'aberta' : 'concluida', corGps: r[8] }));

console.log('\n── a conta (rp-core loteIntMontar) no retrato de 17/11 ──');
const M = loteIntMontar(LINHAS, 20261117, 10);
const L = li => M.lotes.find(g => g.li === li);
const r1 = v => Math.round(v * 10) / 10;
ok('resumo dos últimos 10 lotes fechados (202/26 a 211/26): 97,4% atendido, 16.579 de 17.020 cx',
   [M.resumo.nLotes, M.resumo.de, M.resumo.ate, M.resumo.emb, M.resumo.prog, r1(M.resumo.pct)], [10, '202/26', '211/26', 16579, 17020, 97.4]);
ok('FICOU ABERTO: 405 cx em 85 itens encerrados com falta; ITENS 100%: só 31 de 118',
   [M.resumo.ficou, M.resumo.nFicou, M.resumo.n100, M.resumo.n], [405, 85, 31, 118]);
ok('AINDA ABERTO: 36 cx em 2 itens vencidos na programação (211/26 e 210/26); nenhuma linha sem conta',
   [M.resumo.aberto, M.resumo.nAberto, M.resumo.lisAberto, M.resumo.semConta], [36, 2, ['211/26', '210/26'], 0]);
ok('a lista: o de hoje primeiro, depois os 10 fechados, do mais novo ao mais velho',
   M.lotes.map(g => g.li), ['212/26', '211/26', '210/26', '209/26', '208/26', '207/26', '206/26', '205/26', '204/26', '203/26', '202/26']);
const g210 = L('210/26');
ok('210/26 (PRETO, 13/11, lotes 25426 · 25427 · 25428): 1.741 de 1.800 = 96,7%, 5 de 14 itens 100%, ficou 24 cx (8 itens), ainda aberto 35 cx',
   [g210.corGps, g210.data, g210.lotes, g210.emb, g210.prog, r1(g210.pct), g210.n100, g210.n, g210.ficou, g210.nFicou, g210.aberto, g210.nAberto],
   ['PRETO', '13/11', ['25426', '25427', '25428'], 1741, 1800, 96.7, 5, 14, 24, 8, 35, 1]);
ok('o detalhe do 210/26: o que ainda está aberto primeiro (25427, faltam 35), depois o maior que ficou',
   g210.itens.slice(0, 2).map(x => [x.lote, x.falta, x.sit]), [['25427', 35, 'aberto'], ['25428', 7, 'fechado']]);
ok('209/26: o X no ENCERRAR do 25423 (0 de 10, ainda EM ATRASO na aba) já conta como FICOU ABERTO, não como ainda aberto',
   [L('209/26').ficou, L('209/26').nFicou, L('209/26').aberto], [39, 8, 0]);
ok('212/26 é o de HOJE: em andamento — nem ficou aberto, nem vencido (36,7% até agora)',
   [L('212/26').hoje, L('212/26').ficou, L('212/26').aberto, r1(L('212/26').pct)], [true, 0, 0, 36.7]);

console.log('\n── as regras da conta ──');
{
  const b = { li: '300/26', dataNum: 20261110, data: '10/11/2026', lote: '1', codigo: 'A', qtde: 100, aba: 'concluida', corGps: 'AZUL' };
  const X = loteIntMontar([Object.assign({}, b, { emb: 100 }), Object.assign({}, b, { codigo: 'B', emb: null }), Object.assign({}, b, { codigo: 'C', emb: 130 })], 20261117, 10);
  const g = X.lotes[0];
  ok('linha sem a conta do embalado: FORA das somas e contada (nunca 0); embalado acima da linha não passa dela',
     [g.prog, g.emb, g.n, g.n100, g.semConta, X.resumo.semConta], [200, 200, 2, 2, 1, 1]);
  const V = [];
  for (let k = 0; k < 13; k++) V.push(Object.assign({}, b, { li: (200 + k) + '/26', dataNum: 20261020 + k, emb: 100 }));
  V[0] = Object.assign({}, V[0], { emb: 60, aba: 'aberta' });   // o mais velho, ainda com saldo vencido
  const Y = loteIntMontar(V, 20261117, 10);
  ok('além dos 10 fechados, entra o mais velho que ainda tem saldo vencido; o AINDA ABERTO do resumo é de todos os vencidos',
     [Y.lotes.length, Y.lotes[Y.lotes.length - 1].li, Y.resumo.nLotes, Y.resumo.aberto, Y.resumo.lisAberto], [11, '200/26', 10, 40, ['200/26']]);
  ok('a conta sem a lista não inventa: null', loteIntMontar(null, 20261117), null);
  ok('o rp-core publica a função e sobe de versão', [RP_CORE.fns.includes('loteIntMontar'), RP_CORE.versao], [true, '1.24.0']);
}

console.log('\n── v7.262.0: o % de cada item e o TEMPO (no dia · D+1 · D+2+) ──');
{
  ok('"percentual individual": TODO item do 210/26 aparece (14), cada um com o % dele; os completos por último',
     [g210.itens.length, g210.itens.filter(x => x.sit === 'completo').length, g210.itens.slice(-5).every(x => x.sit === 'completo'),
      r1(g210.itens[0].pct), g210.itens.find(x => x.sit === 'completo').pct],
     [14, 5, true, 69.6, 100]);
  ok('sem o tempo (.gs antes da v5.70): nenhum número inventado — % NO DIA null e as linhas contadas em semTempo',
     [M.resumo.pctNoDia, M.resumo.semTempo, g210.pctNoDia, g210.itens[0].pctNoDia, g210.itens[0].dia], [null, 118, null, null, null]);
  const b = { li: '301/26', dataNum: 20261110, data: '10/11/2026', lote: '9', aba: 'concluida', corGps: 'AZUL' };
  const T = loteIntMontar([
    Object.assign({}, b, { codigo: 'A', qtde: 100, emb: 100, dia: [70, 20, 10] }),
    Object.assign({}, b, { codigo: 'B', qtde: 100, emb: 90, encerrada: true, dia: [90, 0, 0] }),
    Object.assign({}, b, { codigo: 'C', qtde: 50, emb: 40, encerrada: true, dia: [30, 30, 30] }),     // o FIFO deu mais que o embalado: corta, no dia primeiro
  ], 20261117, 10);
  const t = T.lotes[0], [A, B2, C] = ['A', 'B', 'C'].map(c => t.itens.find(x => x.codigo === c));
  ok('o tempo do lote: Σ no dia ÷ Σ programado (as três faixas somam o embalado)',
     [t.noDia, t.d1, t.d2, t.progT, r1(t.pctNoDia), r1(t.pctD1), r1(t.pctD2), r1(t.pct)], [190, 30, 10, 250, 76, 12, 4, 92]);
  ok('o tempo do item, na régua do item (÷ programado dele); a faixa nunca passa do embalado da linha',
     [A.pctNoDia, A.pctD1, A.pctD2, C.dia, C.pctNoDia, C.pctD1, C.pctD2], [70, 20, 10, [30, 10, 0], 60, 20, 0]);
  ok('o resumo dos últimos lotes traz o mesmo tempo', [T.resumo.noDia, T.resumo.progT, r1(T.resumo.pctNoDia), T.resumo.semTempo], [190, 250, 76, 0]);
  const P2 = loteIntMontar([Object.assign({}, b, { codigo: 'A', qtde: 100, emb: 100, dia: [100, 0, 0] }), Object.assign({}, b, { codigo: 'B', qtde: 100, emb: 50 })], 20261117, 10);
  ok('linha sem o tempo fica fora da base do NO DIA (100 de 100, não 100 de 200) e é contada',
     [P2.lotes[0].pctNoDia, P2.lotes[0].semTempo, P2.lotes[0].itens.find(x => x.codigo === 'B').pctNoDia], [100, 1, null]);
  // v1.23.1 (revisão, E1): lote só com linhas SEM a conta do embalado
  const SC = LINHAS.concat([{ li: '213/26', dataNum: 20261116, data: '16/11/2026', lote: '9', codigo: 'X', qtde: 120, emb: null, aba: 'aberta', corGps: 'AZUL' },
                            { li: '213/26', dataNum: 20261116, data: '16/11/2026', lote: '9', codigo: 'Y', qtde: 80, emb: null, aba: 'aberta', corGps: 'AZUL' }]);
  const Msc = loteIntMontar(SC, 20261117, 10), gsc = Msc.lotes.find(g => g.li === '213/26');
  ok('v1.23.1 (revisão): lote sem nenhuma conta — o programado (200) sim, o embalado e o % não (null, nunca "0 de 0")',
     [gsc.prog, gsc.emb, gsc.pct, gsc.n, gsc.semConta], [200, null, null, 0, 2]);
  ok('…ele fica FORA dos últimos 10 (o resumo é o mesmo de sem ele) e aparece na lista, na data dele',
     [Msc.resumo.nLotes, Msc.resumo.de, Msc.resumo.ate, r1(Msc.resumo.pct), Msc.lotes.map(g => g.li).slice(0, 3)], [10, '202/26', '211/26', 97.4, ['212/26', '213/26', '211/26']]);
  ok('v1.23.1 (revisão, D1/A2): o ITENS COMPLETOS em % sai do rp-core (31 de 118 = 26,3%), não do desenho',
     [r1(M.resumo.pctItens), loteIntMontar([], 20261117, 10).resumo.pctItens], [26.3, null]);
  ok('dia malformado (2 faixas, texto) = sem tempo, nunca 0',
     loteIntMontar([Object.assign({}, b, { codigo: 'A', qtde: 10, emb: 10, dia: [10, 0] }), Object.assign({}, b, { codigo: 'B', qtde: 10, emb: 10, dia: ['x', 0, 0] })], 20261117, 10).lotes[0].semTempo, 2);
}

console.log('\n── a leitura do .gs (getAtendimentoLotes, v5.69) ──');
{
  const C = vm.createContext({ Math, Number, String, Object, Array, Date, isFinite, JSON });
  vm.runInContext(['function _anoProvavel(', 'function dataParaNum(', 'function codKey(', 'function _numParaDataBR(', 'function _somaDiasNum(', 'function getAtendimentoLotes(']
    .map(f => pega(gs, f)).join('\n') + '\n' + linha(gs, /const PROG_LI_DIAS = \d+;/) + `
    var TZ = 'America/Sao_Paulo';
    var Utilities = { formatDate: function(){ return '17/11/2026'; } };
    function lerCatalogoProdutos(){ return [{ codigo:'501.086.118', desc:'VOL 1/2 HOME RIPADO ANTARES 1.4' }, { codigo:'501.117.004', desc:'ESCRIVANINHA PRISM' }]; }
    var _ROWS = []; function lerProgramacao(){ return _ROWS; }
    var _DIA = {}; function calcularProgramacao(){ return { diaRow: _DIA }; }
    function produtoDoCodigo(c){ return { cor: c === '501.086.118' ? 'CINAMOMO/OFF WHITE' : c === '501.117.004' ? 'PRETO' : '' }; }`, C);
  const base = { codigo: '501117004', qtde: 100, lote: '25428', loteInt: '210/26', corGps: 'PRETO', foraEsteira: false, arquivada: true, encerrada: false,
                 status: 'CONCLUIDO', saldo: 0, prodConf: 100, saidaVazia: false };
  const row = o => Object.assign({}, base, o);
  C._ROWS = [
    row({ data: '13/11/2026', row: 2 }),                                                                  // concluída: saldo 0
    row({ data: '13/11/2026', row: 3, status: 'ENCERRADO', encerrada: true, saldo: 0, prodConf: 93 }),   // encerrada na CONCLUIDA: SALDO 0 não é 100%
    row({ data: '12/11/2026', row: 2, arquivada: false, status: 'EM ATRASO', encerrada: true, saldo: 10, prodConf: 0, qtde: 10, codigo: '501086118' }),  // X marcado, ainda na aba
    row({ data: '13/11/2026', row: 3, arquivada: false, status: 'EM ATRASO', saldo: 35, prodConf: 80, qtde: 115, codigo: '501086118' }),  // aberta vencida
    row({ data: '17/11/2026', row: 4, arquivada: false, status: '', saldo: null, prodConf: null, saidaVazia: true, loteInt: '212/26' }),   // hoje, sem lançamento
    row({ data: '17/11/2026', row: 5, arquivada: false, status: '', saldo: null, prodConf: null, saidaVazia: false, loteInt: '212/26' }), // hoje, sem conta
    row({ data: '16/11/2026', row: 6, arquivada: false, status: 'EM ATRASO', saldo: null, prodConf: null, saidaVazia: true, loteInt: '211/26' }), // vencida sem conta: o 0 é só de HOJE
    row({ data: '18/11/2026', arquivada: false, loteInt: '213/26' }),                                     // futura: fora
    row({ data: '13/11/2026', loteInt: '' }),                                                             // sem lote interno: contada
    row({ data: '13/11/2026', foraEsteira: true }),                                                       // fora da esteira: fora
    row({ data: '10/10/2026' })                                                                           // antes da janela: fora
  ];
  // o FIFO (stub): a chave é aba|código|lote|data|linha — a CONCLUIDA ("A") e a aba ativa ("P") têm números de linha próprios
  C._DIA = { 'A|501117004|25428|20261113|2': [70, 20, 10], 'A|501117004|25428|20261113|3': [93, 0, 0],
             'P|501086118|25428|20261113|3': [50, 30, 0], 'P|501086118|25428|20261112|2': [0, 0, 0],
             'P|501117004|25428|20261113|2': [1, 1, 1] };   // armadilha: a linha 2 da aba ATIVA não é a linha 2 da CONCLUIDA
  const R = JSON.parse(JSON.stringify(vm.runInContext('getAtendimentoLotes()', C)));
  ok('responde ok, com hoje, a janela de 35 dias (v5.71: cabem 20 lotes fechados) e as linhas',
     [R.ok, R.hoje, R.hojeNum, R.dias, R.linhas.length, R.semLote], [true, '17/11/2026', 20261117, 35, 7, 1]);
  const E = R.linhas.map(x => [x.li, x.dataNum, x.qtde, x.emb, x.encerrada, x.aba]);
  ok('o embalado de cada linha: concluída = QTDE; encerrada = o PRODUZIDO; X na aba aberta = encerrada; aberta = QTDE − SALDO; hoje sem lançamento = 0; sem conta (e vencida sem lançamento) = null',
     E, [['212/26', 20261117, 100, 0, false, 'aberta'], ['212/26', 20261117, 100, null, false, 'aberta'], ['211/26', 20261116, 100, null, false, 'aberta'],
         ['210/26', 20261113, 100, 100, false, 'concluida'], ['210/26', 20261113, 100, 93, true, 'concluida'],
         ['210/26', 20261113, 115, 80, false, 'aberta'], ['210/26', 20261112, 10, 0, true, 'aberta']]);
  ok('v5.70: a descrição vai em TODA linha (o detalhe mostra todos os itens, com o % de cada um)',
     R.linhas.map(x => !!x.desc), [true, true, true, true, true, true, true]);
  ok('v5.70: o tempo de cada linha vem do FIFO pela chave da ABA certa (a linha 2 da CONCLUIDA ≠ a linha 2 da aba); linha que o FIFO não tem = null, nunca [0,0,0]',
     R.linhas.map(x => x.dia), [null, null, null, [70, 20, 10], [93, 0, 0], [50, 30, 0], [0, 0, 0]]);
  ok('v5.72: a COR do cadastro vai em cada linha (produtoDoCodigo, a coluna COR da PRODUTO_CODIGO); fora do cadastro, vazia',
     R.linhas.map(x => x.cor), ['PRETO', 'PRETO', 'PRETO', 'PRETO', 'PRETO', 'CINAMOMO/OFF WHITE', 'CINAMOMO/OFF WHITE']);
  ok('o código e a descrição saem do cadastro; a COR GPS da linha',
     [R.linhas[5].codigo, R.linhas[5].desc, R.linhas[5].corGps], ['501.086.118', 'VOL 1/2 HOME RIPADO ANTARES 1.4', 'PRETO']);
  ok('o leitor da aba dá o PRODUZIDO confiável de TODA linha (prodConf) e a COR GPS, sem mexer no `produzido` da encerrada',
     [/prodConf: _produzidoConfiavel\(iProd >= 0 \? r\[iProd\] : '', iSald >= 0 \? r\[iSald\] : '',\s*iStat >= 0 \? r\[iStat\] : '', qtde\)/.test(gs),
      /const iGps  = hdr\.findIndex\(function \(h\) \{ return h\.indexOf\('GPS'\) >= 0; \}\);/.test(gs), /const produzido = encerrada\s*\?/.test(gs)],
     [true, true, true]);
  ok('a ação no doGet, com cache de 120 s que o lançamento invalida (prod) e o cadastro (cat)',
     [/act === 'getAtendimentoLotes'\) result = getAtendimentoLotes\(\);/.test(gs), /getAtendimentoLotes: 120,/.test(gs), /getAtendimentoLotes: \['prod', 'cat'\]/.test(gs)],
     [true, true, true]);
  ok('o trio da versão do .gs sobe junto (cabeçalho, GS_VERSAO, GS_REPO do painel)',
     [/^\/\/ Versão: 5\.72 — A COR DO PRODUTO NO ATENDIMENTO POR LOTE INTERNO/m.test(gs), /const GS_VERSAO = '5\.72';/.test(gs), /const GS_REPO   = '5\.72';/.test(JS)],
     [true, true, true]);
}

console.log('\n── o PC: a mesma marcação na tela e no papel ──');
{
  ['function _rpEsc(', 'function _pliHtml('].forEach(f => vm.runInThisContext(pega(JS, f)));
  vm.runInThisContext(linha(JS, /const _PLI_SIT=\{[^}]+\};/).replace('const ', 'var ') + '\nvar PLI_EXP = {}; var PLI = { dias: 28 };');
  const Ls = LINHAS.map(x => x.li === '210/26' && x.lote === '25427' && x.emb < x.qtde ? Object.assign({}, x, { desc: 'VOL 1/2 <b>X</b> & cia' }) : x);
  const Mx = loteIntMontar(Ls, 20261117, 10);
  const tela = _pliHtml(Mx, false), papel = _pliHtml(Mx, true);
  ok('os cinco cartões (o NO DIA entrou na v7.262.0) e a tabela, com os números do resumo',
     [(tela.match(/class="pli-k[ "]/g) || []).length, tela.includes('>97,4%<'), tela.includes('405<small>cx</small>'), tela.includes('31<small>de 118</small>'),
      tela.includes('<div class="pli-k ab" '), (tela.match(/<tbody class="pli-g">/g) || []).length], [5, true, true, true, true, 11]);
  ok('na TELA o detalhe abre no clique (fechado de início); o clique leva o ÍNDICE, nunca o texto (G1)',
     [/class="pli-det"/.test(tela), /onclick="_pliExp\(2\)"/.test(tela), /onclick="_pliExp\('/.test(tela)], [false, true, false]);
  ok('no PAPEL todo lote fechado abre o detalhe; o de HOJE (em andamento) não',
     [(papel.match(/class="pli-ih"/g) || []).length, Mx.lotes.filter(g => !g.hoje && g.itens.length).length, /title="HOJE · em andamento/.test(papel)], [10, 10, false]);
  ok('texto da planilha escapado (G1)', [papel.includes('VOL 1/2 &lt;b&gt;X&lt;/b&gt; &amp; cia'), papel.includes('<b>X</b>')], [true, false]);
  ok('o que é só da tela é .so-tela (a seta e o "clique no lote")', [/<span class="seta so-tela">/.test(tela), /<span class="so-tela"> · clique no lote/.test(tela)], [true, true]);
  ok('nenhum veredito na tela nova: sem selo, sem cor de status (o % é fato)', /NO RITMO|ATENÇÃO|ABAIXO|var\(--(ok|red)\)/.test(tela), false);
  ok('desenho sem conta: o _pliHtml não soma nem divide caixas (a conta é do rp-core)', /reduce\(|\.prog\s*[-+*/]|\.emb\s*[-+*/]/.test(pega(JS, 'function _pliHtml(')), false);
  // v7.262.1 (revisão, D1/A2): o "26,3% dos itens" era n100/n*100 nos DOIS desenhos — a régua alargada pega divisão que vira %
  ok('…nem calcula percentual (nada de "÷ … × 100") — no PC e no celular',
     [/\/[^/<>'"\n]*\*\s*100/.test(pega(JS, 'function _pliHtml(')), /\/[^/<>'"\n]*\*\s*100/.test(pega(MJS, 'function _pliHtmlM('))], [false, false]);
  const Lsc = LINHAS.concat([{ li: '213/26', dataNum: 20261116, data: '16/11/2026', lote: '9', codigo: 'X', qtde: 120, emb: null, aba: 'aberta', corGps: 'AZUL' }]);
  const tsc = _pliHtml(loteIntMontar(Lsc, 20261117, 10), false);
  const lsc = /<tr class="pli-lt" onclick="_pliExp\(1\)">([\s\S]*?)<\/tr>/.exec(tsc)[1];
  ok('v7.262.1 (revisão, E1): o lote sem conta mostra o programado e "—" no embalado, no % e nos itens 100% — nunca "0 · 0 de 0"',
     [lsc.includes('213/26'), lsc.includes('>120<'), /<td class="n"><span class="pli-dim">—<\/span><\/td><td class="pli-pc"><span class="pli-dim">sem a conta do embalado<\/span>/.test(lsc),
      /0 <small>de 0<\/small>/.test(lsc)], [true, true, true, false]);
  const G = pega(JS, 'async function gerarRelatorioLotesInternos(');
  ok('a impressão: o MESMO _pliHtml com papel=true, o CSS comum + a pele, paisagem, cabeçalho e botão comuns',
     [/_pliHtml\(M, true\)/.test(G), /'<style>'\+_PLI_CSS\+_PLI_SKIN\+'<\/style>/.test(G), /_rpDocParadas\('Atendimento por lote interno — '\+hojeStr\(\), true\)/.test(G),
      /_rpCabecalho\('ATENDIMENTO POR LOTE INTERNO'/.test(G), /_rpBotaoImprimir\(\)/.test(G)], [true, true, true, true, true]);
  ok('o CSS do bloco é UM só (_PLI_CSS), injetado na tela; no papel o lote não se separa dos itens e o cabeçalho se repete',
     [/function _pliCssNaTela\(\)\{[\s\S]*st\.textContent=_PLI_CSS/.test(JS), /\.pli-doc tbody\.pli-g\{break-inside:avoid/.test(JS), /\.pli-doc thead\{display:table-header-group\}/.test(JS)],
     [true, true, true]);
  ok('a leitura: 3 tentativas em sequência, voo compartilhado; o .gs antigo (sem `linhas`) diz que falta re-implantar',
     [/for\(let t=1; t<=3; t\+\+\)/.test(pega(JS, 'async function _pliLer(')), /if\(PLI_VOO\) return PLI_VOO;/.test(pega(JS, 'function _pliCarregar(')),
      /return \{ falha:'sem-endpoint'/.test(pega(JS, 'async function _pliLer(')), /cole o \.gs v5\.71/.test(pega(JS, 'function _pliFalhaTxt('))], [true, true, true, true]);
}

console.log('\n── v7.262.0: os itens na MESMA tabela, nas colunas do lote (PPCP, print de 1920: "foco no alinhamento") ──');
{
  const Ld = LINHAS.map(x => Object.assign({}, x, { dia: x.emb == null ? null : [Math.round(x.emb * 0.8), x.emb - Math.round(x.emb * 0.8), 0] }));
  const Mt = loteIntMontar(Ld, 20261117, 10);
  PLI_EXP['210/26'] = true;
  const tela = _pliHtml(Mt, false);
  delete PLI_EXP['210/26'];
  const celulas = h => { const out = []; let c = 0;
    for (const m of h.matchAll(/<t([dh])(\s[^>]*)?>([\s\S]*?)<\/t\1>/g)) { const span = Number((/colspan="(\d+)"/.exec(m[2] || '') || [])[1]) || 1; out.push({ col: c + 1, txt: m[3].replace(/<[^>]+>/g, '') }); c += span; }
    return { cel: out, n: c }; };
  const thead = /<thead><tr>([\s\S]*?)<\/tr><\/thead>/.exec(tela)[1];
  const rows = [...tela.matchAll(/<tr class="(pli-lt|pli-ih|pli-it)[^"]*"[^>]*>([\s\S]*?)<\/tr>/g)].map(r => ({ tipo: r[1], ...celulas(r[2]) }));
  ok('UMA tabela (nenhuma tabela dentro de outra); toda linha — lote, cabeçalho dos itens e item — tem as 13 colunas do cabeçalho',
     [(tela.match(/<table/g) || []).length, celulas(thead).n, [...new Set(rows.map(r => r.n))], rows.filter(r => r.tipo === 'pli-it').length], [1, 13, [13], 14]);
  const H = celulas(thead).cel.map(c => c.txt);
  const col = (r, txt) => (r.cel.find(c => c.txt === txt) || {}).col;
  const lt = rows.find(r => r.tipo === 'pli-lt' && r.cel[0].txt.includes('210/26'));
  const it = rows.filter(r => r.tipo === 'pli-it');
  const i27 = it.find(r => r.cel[0].txt === '25427' && r.cel.some(c => c.txt === '35 cx'));
  const i28 = it.find(r => r.cel[0].txt === '25428' && r.cel.some(c => c.txt === '7 cx'));
  ok('o número do item cai na coluna do mesmo número do lote: PROGRAMADO, EMBALADO, FALTA (X) (encerrado) e PARA EMBALAR (vencido)',
     [H[col(lt, '1.800') - 1], H[col(i27, '115') - 1], H[col(i27, '80') - 1], H[col(lt, '24 cx · 8 itens') - 1], H[col(i28, '7 cx') - 1],
      H[col(lt, '35 cx') - 1], H[col(i27, '35 cx') - 1]],
     ['PROGRAMADO', 'PROGRAMADO', 'EMBALADO', 'FALTA (X)', 'FALTA (X)', 'PARA EMBALAR', 'PARA EMBALAR']);
  ok('o item: % embaixo do % ATENDIDO, o tempo embaixo de NO DIA · D+1 · D+2+, "completo" embaixo de ITENS 100%',
     [H[col(i27, '69,6%') - 1], H[col(i27, '55,7%') - 1], H[col(i27, '13,9%') - 1], H[col(i27, '0%') - 1],
      H[col(it.find(r => r.cel.some(c => c.txt === 'completo')), 'completo') - 1]],
     ['% EMBALADO', 'NO DIA', 'D+1', 'D+2+', 'ITENS 100%']);
  ok('o cabeçalho dos itens vem logo depois do lote aberto; o código e o produto juntos, nas colunas de COR GPS a LOTES (ERP)',
     [rows[rows.indexOf(lt) + 1].tipo, i27.cel[1].col, /colspan="3" class="pli-prod"/.test(tela)], ['pli-ih', 2, true]);
  ok('a situação do item fica no title (a coluna já diz onde ele está), com o tempo em caixas',
     /<tr class="pli-it" title="PARA EMBALAR · vencido, na programação · no dia 64 cx · D\+1 16 cx · D\+2\+ 0 cx">/.test(tela), true);
  ok('a barra do item é a do lote: as três faixas (no dia · D+1 · D+2+) quando há o tempo',
     [/<td class="pli-pc"><span class="pli-bar"><b class="d0" style="width:55\.7%"><\/b><b class="d1" style="width:13\.9%"><\/b><b class="d2" style="width:0\.0%"><\/b><\/span><span class="pli-ipn">69,6%<\/span>/.test(tela)], [true]);
  ok('a coluna LOTES (ERP) não some mais em tela estreita (a célula escondida desalinharia o colspan do produto)',
     /#sec-programacao \.pli-lotes[^{]*\{display:none\}/.test(html), false);
  ok('CSS: o recuo do LOTE do item vence o padding da linha do item (no papel também)',
     [/\.pli-tab tr\.pli-it td\{padding:5px 10px[^}]*\}\n\s*\.pli-tab tr\.pli-ih td:first-child,\.pli-tab tr\.pli-it td\.pli-il\{padding-left:30px\}/.test(JS),
      /\.pli-doc \.pli-tab tr\.pli-it td\.pli-il\{padding-left:20px\}/.test(JS)], [true, true]);
  const Lx = LINHAS.map(x => x.li === '209/26' ? Object.assign({}, x, { lote: '<L>' + x.lote, codigo: '"&' + x.codigo }) : x);
  const px = _pliHtml(loteIntMontar(Lx, 20261117, 10), true);
  ok('o LOTE e o CÓDIGO do item também saem escapados (G1), na linha do item e na lista de lotes',
     [px.includes('&lt;L&gt;25423'), px.includes('<L>'), px.includes('"&amp;501'), /"&\d/.test(px)], [true, false, true, false]);   // _rpEsc: & < > (texto)
  ok('no papel, as cores da barra são as da folha (na .pli-box, que redefine as da tela)',
     /\.pli-doc \.pli-box\{--pli-d0:#1F2328;--pli-d1:#7B8794;--pli-d2:#C3CAD3\}/.test(JS), true);
}

console.log('\n── v7.263.0: o seletor 10 · 20 lotes e os cartões "fácil entendimento" ──');
{
  // a escolha mora no navegador (try/catch: modo privado, bloqueio) e nunca vira número fora da lista
  const ctx = (ls) => { const C = vm.createContext({ localStorage: ls, Number, String, render: 0 });
    vm.runInContext('var renderLotesInternos = function(){ render++; }; var _pliCarregar = function(){ throw new Error("não lê"); };\n'
      + linha(JS, /const PLI_NS=\[10, 20\];/).replace('const ', 'var ') + '\n' + pega(JS, 'function _pliNLer(') + '\n' + pega(JS, 'function _pliSetN(')
      + '\nvar PLI_N=_pliNLer();', C); return C; };
  const guarda = {}, LS = v => ({ getItem: () => v, setItem: (k, x) => { guarda[k] = x; } });
  ok('a escolha guardada (rpe_pli_n) volta; vazia, inválida ou sem localStorage = 10',
     [ctx(LS('20')).PLI_N, ctx(LS(null)).PLI_N, ctx(LS('15')).PLI_N, ctx({ getItem: () => { throw new Error('bloqueado'); } }).PLI_N], [20, 10, 10, 10]);
  const C = ctx(LS('10'));
  vm.runInContext('_pliSetN(20)', C);
  ok('trocar para 20 guarda, redesenha e NÃO lê (a leitura de 35 dias já trouxe as linhas)', [C.PLI_N, guarda.rpe_pli_n, C.render], [20, '20', 1]);
  vm.runInContext('_pliSetN(15)', C);
  ok('número fora da lista não muda nada', [C.PLI_N, C.render], [20, 1]);
  vm.runInContext('_pliSetN(10)', C);
  ok('…e volta para 10', C.PLI_N, 10);
  const sec = html.slice(html.indexOf('<div class="tbl-wrap pli-wrap" id="pli">'), html.indexOf('<div id="pli-corpo">'));
  ok('o seletor no cabeçalho da sub-aba (só na tela: o papel não tem cabeçalho de tela); o render acende o escolhido',
     [/data-n="10" onclick="_pliSetN\(10\)">10<\/button><button type="button" data-n="20" onclick="_pliSetN\(20\)">20<\/button>/.test(sec),
      /últimos 10 lotes/.test(sec), /b\.setAttribute\('aria-pressed', on\?'true':'false'\)/.test(pega(JS, 'function renderLotesInternos('))], [true, false, true]);
  const M10 = loteIntMontar(LINHAS, 20261117, 10), M20 = loteIntMontar(LINHAS, 20261117, 20);
  const t10 = _pliHtml(M10, false), t20 = _pliHtml(M20, false);
  ok('a legenda diz QUAIS lotes estão nos cartões e que o de hoje fica fora',
     /<div class="pli-cap">Lotes <b>202\/26 a 211\/26<\/b> — os 10 últimos já fechados · o de hoje \(212\/26\) fica fora dos cartões: está em andamento<\/div>/.test(t10), true);
  ok('com 20 pedidos e só 19 na leitura (o retrato de 17/11 tem 28 dias), a legenda diz quantos há — nunca finge 20',
     [M20.resumo.nLotes, /os 19 últimos já fechados \(só há 19 na leitura de 28 dias\)/.test(t20), /193\/26 a 211\/26/.test(t20)], [19, true, true]);
  ok('os cinco cartões em palavras da fábrica, cada um com a régua no title (texto que só explica não ocupa a tela)',
     [...t10.matchAll(/<div class="l">([^<]+)<\/div>/g)].map(m => m[1]).concat([(t10.match(/<div class="pli-k[^"]*" title="/g) || []).length]),
     ['EMBALADO', 'EMBALADO NO DIA PROGRAMADO', 'FECHADO COM FALTA (X)', 'ITENS 100% EMBALADOS', 'AINDA PARA EMBALAR', 5]);
  ok('o FECHADO COM FALTA diz o que é (aguardando peça, finalizado no ERP) — não "produção perdida"',
     /85 itens · aguardando peça, finalizados no ERP/.test(t10), true);
  ok('a .gs v5.71 lê 35 dias', /const PROG_LI_DIAS = 35;/.test(gs), true);
}

console.log('\n── v7.264.0: a cor do produto no item (PPCP: "consegue trazer a cor do produto") ──');
{
  const b = { li: '302/26', dataNum: 20261117, data: '17/11/2026', lote: '25448', aba: 'aberta', qtde: 100, emb: 50 };
  const T = loteIntMontar([
    Object.assign({}, b, { codigo: '501.080.002', desc: 'VOL 2/2 CRISTALEIRA ORION', cor: 'OFF WHITE' }),
    Object.assign({}, b, { codigo: '501.080.006', desc: 'VOL 2/2 CRISTALEIRA ORION', cor: 'CINAMOMO' }),
    Object.assign({}, b, { codigo: '501.126.002', desc: 'VOL 1/1 MESA CENTRO PRISM BRANCO ACETINADO', cor: 'BRANCO ACETINADO' }),
    Object.assign({}, b, { codigo: '501.999.001', desc: 'VOL 1/1 SEM COR NO CADASTRO' }),
  ], 20261117, 10);
  const nomes = {}; T.lotes[0].itens.forEach(x => { nomes[x.codigo] = x.nome; });
  ok('o item ganha o nome com a cor (o nomeComCor de sempre): as duas ORION se distinguem; a cor que já está na descrição não repete; sem cor, a descrição',
     [nomes['501.080.002'], nomes['501.080.006'], nomes['501.126.002'], nomes['501.999.001']],
     ['VOL 2/2 CRISTALEIRA ORION · OFF WHITE', 'VOL 2/2 CRISTALEIRA ORION · CINAMOMO', 'VOL 1/1 MESA CENTRO PRISM BRANCO ACETINADO', 'VOL 1/1 SEM COR NO CADASTRO']);
  const Lc = LINHAS.map(x => x.li === '210/26' && x.lote === '25428' ? Object.assign({}, x, { cor: 'PRETO <AC>' }) : x);
  PLI_EXP['210/26'] = true;
  const tc = _pliHtml(loteIntMontar(Lc, 20261117, 10), false);
  delete PLI_EXP['210/26'];
  ok('PC: a linha do item mostra a cor, escapada (G1)', [tc.includes(' · PRETO &lt;AC&gt;</td>'), tc.includes('<AC>')], [true, false]);
}

console.log('\n── v7.261.0: sub-aba da PROGRAMAÇÃO ("esta com muita rolagem faça uma sub aba") ──');
{
  const sec = html.slice(html.indexOf('<section id="sec-programacao"'), html.indexOf('</section>', html.indexOf('<section id="sec-programacao"')));
  const pDias = sec.indexOf('<div class="ucv-pn on" data-sub="dias">'), pLotes = sec.indexOf('<div class="ucv-pn" data-sub="lotes">');
  ok('a faixa de sub-abas (o mesmo .ucv-sb do PLANO e da UEP): PROGRAMAÇÃO POR DIA acesa, ATENDIMENTO POR LOTE INTERNO ao lado',
     [/<div class="ucv-sub" id="prog-sub" role="tablist">/.test(sec), /data-sub="dias" role="tab" aria-selected="true" onclick="_progSub\('dias'\)"/.test(sec),
      /data-sub="lotes" role="tab" aria-selected="false" onclick="_progSub\('lotes'\)"/.test(sec), /id="prog-sb-dias">…</.test(sec), /id="prog-sb-lotes">…</.test(sec)],
     [true, true, true, true, true]);
  ok('cada bloco no seu painel: a programação por dia no 1º, os lotes internos no 2º (não mais embaixo, na mesma rolagem)',
     [pDias > 0, pLotes > pDias, sec.indexOf('id="prog2-dias"') > pDias && sec.indexOf('id="prog2-dias"') < pLotes, sec.indexOf('id="pli"') > pLotes],
     [true, true, true, true]);
  ok('o bloco não abre nem fecha mais pelo título: sem o _pliAlternar, sem a seta, sem o PLI_ABERTO, o corpo visível',
     [/_pliAlternar|pli-seta|PLI_ABERTO/.test(html), /<div id="pli-corpo"><div class="pli-msg">Lendo os lotes internos…<\/div><\/div>/.test(sec), /event\.stopPropagation\(\);gerarRelatorioLotesInternos/.test(sec)],
     [false, true, false]);
  ok('CSS: os painéis escondem e acendem (com a animação respeitando o reduced-motion) e a faixa é a das outras abas',
     [/#sec-programacao \.ucv-pn\{display:none\}/.test(html), /#sec-programacao \.ucv-pn\.on\{display:block;animation:ucvIn/.test(html),
      /prefers-reduced-motion:reduce\)\{#sec-programacao \.ucv-pn\.on\{animation:none\}/.test(html),
      // v7.266.0: o HISTÓRICO entrou na mesma faixa (`,#sec-programacao .ucv-sb,#sec-historico .ucv-sb{`)
      /#sec-plano \.ucv-sb,#sec-programacao \.ucv-sb,#sec-historico \.ucv-sb\{flex:1 1 180px/.test(html), /#sec-plano \.ucv-sb\.on,#sec-programacao \.ucv-sb\.on,#sec-historico \.ucv-sb\.on\{/.test(html)],
     [true, true, true, true, true]);
  ok('ao abrir a aba: a programação e DEPOIS os lotes internos, em sequência (uma chamada por vez); sem esperar clique',
     /if\(tab==='programacao'\) carregarProgramacaoDetalhada\(\)\.then\(renderProgramacaoDetalhada\)\.then\(\(\)=>_pliCarregar\(\)\)\.then\(renderLotesInternos\);/.test(JS), true);

  // _progSub com um DOM de mentira: só acende painel e botão; relê só os lotes que FALHARAM
  const el = (sub, on) => ({ dataset: { sub }, cls: new Set(on ? ['on'] : []), aria: '', classList: { toggle(c, v) { v ? this.o.cls.add(c) : this.o.cls.delete(c); } }, setAttribute(k, v) { this.aria = v; } });
  const bts = [el('dias', true), el('lotes')], pns = [el('dias', true), el('lotes')];
  [...bts, ...pns].forEach(e => { e.classList.o = e; });
  let leu = 0, desenhou = 0;
  const C = vm.createContext({ document: { querySelectorAll: q => q === '#prog-sub .ucv-sb' ? bts : q === '#sec-programacao .ucv-pn' ? pns : [] },
    PLI_FALHA: null, PLI_VOO: null, PROG_DET_VOO: null, _pliCarregar: () => { leu++; return Promise.resolve(true); }, renderLotesInternos: () => { desenhou++; } });
  vm.runInContext(linha(JS, /const PROG_SUBS=\['dias', 'lotes'\];/).replace('const ', 'var ') + '\n' + linha(JS, /let PROG_SUB='dias';/).replace('let ', 'var ')
    + '\n' + pega(JS, 'function _progSub('), C);
  vm.runInContext("_progSub('lotes')", C);
  ok('trocar para LOTES INTERNOS acende o painel e o botão (aria-selected), apaga o outro e NÃO lê (a leitura já veio com a aba)',
     [C.PROG_SUB, pns.map(p => p.cls.has('on')), bts.map(b => b.cls.has('on')), bts.map(b => b.aria), leu], ['lotes', [false, true], [false, true], ['false', 'true'], 0]);
  vm.runInContext("_progSub('xyz')", C);
  ok('sub-aba que não existe não muda nada', [C.PROG_SUB, pns.map(p => p.cls.has('on'))], ['lotes', [false, true]]);
  C.PLI_FALHA = 'sem-resposta'; vm.runInContext("_progSub('lotes')", C);
  ok('com a leitura dos lotes FALHADA, o clique na sub-aba tenta de novo (e desenha o "Lendo…")', [leu, desenhou > 0], [1, true]);
  C.PLI_VOO = Promise.resolve(); vm.runInContext("_progSub('lotes')", C);
  ok('…mas não com uma leitura já em voo (uma chamada por vez)', leu, 1);
  C.PLI_VOO = null; C.PROG_DET_VOO = Promise.resolve(); vm.runInContext("_progSub('lotes')", C);
  ok('v7.262.1 (revisão, F1): …nem com a leitura da PROGRAMAÇÃO em voo — a corrente do setTab relê os lotes depois dela', leu, 1);
  C.PROG_DET_VOO = null;
  vm.runInContext("_progSub('dias')", C);
  ok('e volta para a PROGRAMAÇÃO POR DIA', [C.PROG_SUB, pns.map(p => p.cls.has('on'))], ['dias', [true, false]]);

  // o texto do botão: o resumo que o loteIntMontar já devolveu, sem conta nova; sem leitura, o estado (nunca 0)
  vm.runInThisContext('var PLI = { dias: 28 };\n' + pega(JS, 'function _pliSubTxt('));
  const M = loteIntMontar(LINHAS, 20261117, 10);
  ok('o botão diz o % atendido, os itens completos e o que ainda está em aberto — os MESMOS números dos cartões, sem cor de veredito',
     _pliSubTxt(M, null), { txt: '97,4% embalado · 31 de 118 itens 100% · 36 cx para embalar', cls: '' });
  const semAberto = loteIntMontar(LINHAS.filter(x => !(x.aba === 'aberta' && x.dataNum < 20261117 && !x.encerrada)), 20261117, 10);
  ok('sem nada vencido na programação, o pedaço some (não "0 cx para embalar")', /para embalar/.test(_pliSubTxt(semAberto, null).txt), false);
  ok('sem a leitura: o estado — lendo, .gs sem a leitura, sem URL, falha (clique tenta de novo), nenhum lote fechado; nunca 0',
     [_pliSubTxt(null, null).txt, _pliSubTxt(null, 'sem-endpoint').txt, _pliSubTxt(null, 'sem-url').txt, _pliSubTxt(null, 'sem-resposta').txt,
      _pliSubTxt(loteIntMontar([], 20261117, 10), null).txt],
     ['…', 'falta re-implantar o .gs v5.71', 'sem a URL do Apps Script (⚙)', 'não lido — clique para tentar', 'nenhum lote interno fechado nos últimos 28 dias']);
  const R = pega(JS, 'function renderLotesInternos(');
  ok('o render pinta o botão (o _sbPinta comum) e desenha mesmo com o painel escondido — sem o portão do "aberto"',
     [/_sbPinta\(document\.getElementById\('prog-sb-lotes'\), _pliSubTxt\(M, PLI_FALHA\)\)/.test(R), /if\(!c\) return;/.test(R)], [true, true]);
  const P = pega(JS, 'function renderProgramacaoDetalhada(');
  ok('o botão da PROGRAMAÇÃO POR DIA: dias, caixas e UEP — os MESMOS totais do TOTAL (o * quando parte das caixas não tem UEP); vazio diz que não há programação',
     [/_sbPinta\(sbDias, \{ txt: plural\(ordem\.length, 'dia', 'dias'\)\+' · '\+fmtN\(totQtd\)\+' cx'/.test(P), /fmtN\(Math\.round\(totUep\)\)\+' UEP'\+\(totSemUep>0\?'\*':''\)/.test(P),
      /_sbPinta\(sbDias, \{ txt: fi \? fi\.t : 'sem programação cadastrada', cls:'' \}\);/.test(P)], [true, true, true]);
  ok('v7.262.1 (revisão, F3): leitura da programação que FALHOU diz a causa (o _progDetFalhaInfo) no botão e no miolo — nunca "sem programação cadastrada"',
     [/const fi=_progDetFalhaInfo\(\);/.test(P), /\(fi\?'<b>'\+fi\.t\+'<\/b> — '\+fi\.d:'Sem programação cadastrada\.'\)/.test(P)], [true, true]);
}

console.log('\n── o celular: a mesma conta, o desenho dele ──');
{
  global._escH = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  vm.runInThisContext(pega(MJS, 'function _pliHtmlM(').replace('function _pliHtmlM(', 'function _pliHtmlMob(') + '\n'
    + linha(MJS, /const _PLI_SIT=\{[^}]+\};/).replace('const _PLI_SIT', 'var _PLI_SIT_M').replace(/_PLI_SIT\b/g, '_PLI_SIT_M'));
  vm.runInThisContext('var _PLI_SIT = _PLI_SIT_M;');
  const Ls = LINHAS.map(x => x.li === '210/26' && x.lote === '25427' && x.emb < x.qtde ? Object.assign({}, x, { desc: 'VOL <i>Y</i>' }) : x);
  const Mm = loteIntMontar(Ls, 20261117, 10);
  global.PLI_EXP = { '210/26': true };
  const h = _pliHtmlMob(Mm);
  ok('os mesmos números do PC (97,4%, 405 cx, 31 de 118, 36 cx) e o 210/26 com 96,7%',
     [h.includes('>97,4%<'), h.includes('405<small>cx</small>'), h.includes('31<small>de 118</small>'), h.includes('36<small>cx</small>'), h.includes('>96,7%<')],
     [true, true, true, true, true]);
  ok('o detalhe aberto no toque, com o texto escapado; o toque leva o índice',
     [h.includes('VOL &lt;i&gt;Y&lt;/i&gt;'), h.includes('<i>Y</i>'), /onclick="_pliExpM\(2\)"/.test(h)], [true, false, true]);
  ok('a conta é a do rp-core e a leitura é a mesma do PC', [/loteIntMontar\(PLI\.linhas, Number\(PLI\.hojeNum\)\|\|0, PLI_N\)/.test(MJS), /action=getAtendimentoLotes/.test(MJS)], [true, true]);
  ok('o bloco nasce recolhido na tela GERENCIAL', /<div id="ger-pli" style="display:none"><\/div>/.test(mob), true);
  // v1.56.0: todos os itens com o % (o número à direita, na 1ª linha) e o tempo em %, como no PC
  ok('todos os 14 itens do 210/26, o % de cada um ANTES do nome (flutua na 1ª linha), os completos marcados',
     [(h.match(/<div class="pli-it/g) || []).length, (h.match(/<div class="pli-it ok">/g) || []).length,
      /<div class="pli-it"><span class="pli-ipc">69,6%<\/span><b>VOL &lt;i&gt;Y&lt;\/i&gt;<\/b>/.test(h)], [14, 5, true]);
  global.PLI_EXP = {};
  const Lt = LINHAS.map(x => Object.assign({}, x, { dia: x.emb == null ? null : [Math.round(x.emb * 0.8), x.emb - Math.round(x.emb * 0.8), 0] }));
  global.PLI_EXP = { '210/26': true };
  const ht = _pliHtmlMob(loteIntMontar(Lt, 20261117, 10));
  ok('com o tempo: o cartão NO DIA, a barra em três faixas e o item com "no dia · D+1" em % (sem o 0% do D+2+)',
     [/<div class="l">Embalado no dia programado<\/div><div class="v">\d+,\d%<\/div>/.test(ht), /<b class="d0" style="width:[\d.]+%"><\/b><b class="d1"/.test(ht),
      / · no dia 55,7% · D\+1 13,9% · faltou <b>35<\/b>/.test(ht)], [true, true, true]);
  ok('sem o tempo (.gs v5.69): o cartão diz que precisa do .gs v5.70, nunca 0%', /<div class="v">—<\/div><div class="s">precisa do \.gs v5\.70<\/div>/.test(h), true);
  global.PLI_EXP = {};
  const hsc = _pliHtmlMob(loteIntMontar(LINHAS.concat([{ li: '213/26', dataNum: 20261116, data: '16/11/2026', lote: '9', codigo: 'X', qtde: 120, emb: null, aba: 'aberta', corGps: 'AZUL' }]), 20261117, 10));
  ok('v1.56.1 (revisão, E1): no celular, o lote sem conta diz "sem a conta do embalado · 120 cx programadas", nunca "0 de 0"',
     [hsc.includes('sem a conta do embalado · 120 cx programadas'), /<b>0<\/b> de 120/.test(hsc)], [true, false]);
  const hm = _pliHtmlMob(loteIntMontar(LINHAS, 20261117, 20));
  ok('celular: o mesmo seletor 10 · 20 (o toque leva o número e não abre/fecha o card), aceso pelo modelo; os mesmos nomes dos cartões',
     [/<button type="button" class="" onclick="event\.stopPropagation\(\);_pliSetNM\(10\)">10<\/button><button type="button" class="on" onclick="event\.stopPropagation\(\);_pliSetNM\(20\)">20<\/button>/.test(hm),
      /\(só há 19\)/.test(hm), [...hm.matchAll(/<div class="l">([^<]+)<\/div>/g)].map(m => m[1])],
     [true, true, ['Embalado', 'Embalado no dia programado', 'Fechado com falta (X)', 'Itens 100% embalados', 'Ainda para embalar']]);
  global.PLI_EXP = { '210/26': true };
  const hc = _pliHtmlMob(loteIntMontar(LINHAS.map(x => x.li === '210/26' && x.lote === '25428' ? Object.assign({}, x, { cor: 'PRETO <AC>' }) : x), 20261117, 10));
  global.PLI_EXP = {};
  ok('v1.58.0: o item com a cor do cadastro (o nome do rp-core), escapado (a linha do retrato não tem descrição: só a cor)', [hc.includes('<b>PRETO &lt;AC&gt;</b>'), hc.includes('<AC>')], [true, false]);
  ok('o 5º cartão ocupa a linha inteira (não fica sozinho na metade)', /#ger-pli \.pli-kpis \.pli-k:last-child\{grid-column:1\/-1\}/.test(mob), true);
  global.PLI_EXP = {};
}

console.log(falhas ? `\n❌ ${falhas} falha(s)` : '\n✅ tudo certo');
process.exit(falhas ? 1 : 0);
