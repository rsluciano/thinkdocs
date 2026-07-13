const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  try {
    const docs = await prisma.documento.findMany({ where: { status: "Reprovado" } });
    if (docs.length === 0) {
      console.log("No rejected docs");
      return;
    }
    const doc = docs[0];
    const id = doc.id;
    console.log("Corrigindo doc:", id);
    
    const updatedDoc = await prisma.documento.update({
      where: { id },
      data: {
        status: "Aguardando Aprovação",
        motivoReprovacao: null,
        dataEnvio: new Date(),
        aprovadoPor: null,
        dataAprovacao: null,
        setor: "Geral"
      }
    });
    console.log("SUCESSO:", updatedDoc.status);
  } catch(e) {
    console.error("ERRO:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
