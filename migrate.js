const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync("local-db.json", "utf-8"));
  
  if (data.usuarios) {
    for (const u of data.usuarios) {
      await prisma.usuario.upsert({
        where: { email: u.email },
        update: {},
        create: {
          id: u.id || undefined,
          nome: u.nome,
          email: u.email,
          senha: u.senha,
          funcao: u.funcao,
          setor: Array.isArray(u.setor) ? u.setor.join(",") : (u.setor || "Geral"),
          empresaId: u.empresaId || "ThinkDocs"
        }
      });
    }
    console.log("Usuarios migrados!");
  }

  if (data.documentos) {
    for (const d of data.documentos) {
      await prisma.documento.upsert({
        where: { id: d.id },
        update: {},
        create: {
          id: d.id,
          empresaId: d.empresaId || "ThinkDocs",
          codigo: d.codigo,
          titulo: d.titulo,
          categoria: d.categoria,
          setor: Array.isArray(d.setor) ? d.setor.join(",") : (d.setor || "Geral"),
          autor: d.autor || d.autorNome || "Desconhecido",
          dataEnvio: d.dataEnvio ? new Date(d.dataEnvio) : new Date(),
          dataAtualizacao: d.dataAtualizacao ? new Date(d.dataAtualizacao) : null,
          dataVencimento: d.dataVencimento ? new Date(d.dataVencimento) : null,
          arquivoUrl: d.arquivoUrl || d.arquivo || "",
          status: d.status,
          revisao: d.revisao || 1,
          motivoReprovacao: d.motivoReprovacao || null
        }
      });
    }
    console.log("Documentos migrados!");
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
