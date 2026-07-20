const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importRdc() {
  console.log("Reading text file...");
  const text = fs.readFileSync('C:\\Users\\HOME\\.gemini\\antigravity\\scratch\\thinkdocs\\scripts\\rdc978.txt', 'utf-8');
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log(`Parsed ${lines.length} lines.`);
  
  let currentCapitulo = null;
  let currentSecao = null;
  let currentSubsecao = null;
  let currentArtigo = null;
  let currentParagrafo = null;
  let currentInciso = null;
  let currentAlinea = null;

  const items = [];
  let currentItem = null;

  function pushItem(tipo, ref, txt, obj = {}) {
    if (currentItem) {
      items.push(currentItem);
    }
    currentItem = {
      tipo,
      referencia: ref,
      textoIntegral: txt,
      capitulo: currentCapitulo,
      secao: currentSecao,
      subsecao: currentSubsecao,
      artigo: currentArtigo,
      paragrafo: currentParagrafo,
      inciso: currentInciso,
      alinea: currentAlinea,
      ...obj
    };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^CAPÍTULO [IVXLCDM]+$/i)) {
      currentCapitulo = line;
      currentSecao = null;
      currentSubsecao = null;
      continue;
    }
    if (line.match(/^Seção [IVXLCDM]+$/i)) {
      currentSecao = line;
      currentSubsecao = null;
      continue;
    }
    if (line.match(/^Subseção [IVXLCDM]+$/i)) {
      currentSubsecao = line;
      continue;
    }

    const matchArtigo = line.match(/^Art\.\s*(\d+[ºo]?)(.*)$/);
    if (matchArtigo) {
      currentArtigo = matchArtigo[1];
      currentParagrafo = null;
      currentInciso = null;
      currentAlinea = null;
      pushItem('Artigo', `Art.${currentArtigo}`, line);
      continue;
    }

    const matchParagrafo = line.match(/^(§\s*\d+[ºo]?|Parágrafo único\.)(.*)$/);
    if (matchParagrafo) {
      currentParagrafo = matchParagrafo[1].trim();
      currentInciso = null;
      currentAlinea = null;
      pushItem('Parágrafo', `Art.${currentArtigo}-${currentParagrafo}`, line);
      continue;
    }

    const matchInciso = line.match(/^([IVXLCDM]+)\s*-(.*)$/);
    if (matchInciso && currentArtigo && line.length > 5) { 
      currentInciso = matchInciso[1];
      currentAlinea = null;
      let ref = `Art.${currentArtigo}`;
      if (currentParagrafo) ref += `-${currentParagrafo}`;
      ref += `-${currentInciso}`;
      pushItem('Inciso', ref, line);
      continue;
    }

    const matchAlinea = line.match(/^([a-z])\)\s(.*)$/);
    if (matchAlinea && currentInciso) {
      currentAlinea = matchAlinea[1];
      let ref = `Art.${currentArtigo}`;
      if (currentParagrafo) ref += `-${currentParagrafo}`;
      ref += `-${currentInciso}-${currentAlinea}`;
      pushItem('Alínea', ref, line);
      continue;
    }

    if (currentItem && line.length > 5) {
      currentItem.textoIntegral += ' ' + line;
    }
  }
  
  if (currentItem) items.push(currentItem);

  console.log(`Found ${items.length} structured requirements.`);

  console.log("Deleting existing items...");
  await prisma.auditoriaRdc.deleteMany({});
  await prisma.rdcItem.deleteMany({});

  console.log("Inserting new items...");
  let count = 0;
  for (const item of items) {
    let categoria = "Geral";
    if (item.capitulo && item.capitulo.includes("II")) categoria = "Serviços e Infraestrutura";
    if (item.capitulo && item.capitulo.includes("V")) categoria = "Gestão da Qualidade";
    if (item.secao && item.secao.includes("Documentos")) categoria = "Gestão de Documentos";
    if (item.secao && item.secao.includes("Pessoal")) categoria = "Pessoal e Educação";

    await prisma.rdcItem.create({
      data: {
        referencia: item.referencia,
        textoIntegral: item.textoIntegral,
        capitulo: item.capitulo,
        secao: item.secao,
        subsecao: item.subsecao,
        artigo: item.artigo,
        paragrafo: item.paragrafo,
        inciso: item.inciso,
        alinea: item.alinea,
        tipo: item.tipo,
        categoria: categoria,
        criticidade: 'Não Definida'
      }
    });
    count++;
  }

  console.log(`Inserted ${count} requirements successfully!`);
}

importRdc().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
