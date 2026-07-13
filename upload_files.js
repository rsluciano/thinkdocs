const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();
require("dotenv").config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const docs = await prisma.documento.findMany();
  for (const d of docs) {
    if (d.arquivoUrl && d.arquivoUrl.includes("/api/download")) {
      const urlParams = new URLSearchParams(d.arquivoUrl.split("?")[1]);
      const empresa = urlParams.get("empresa");
      const categoria = urlParams.get("categoria");
      const fileName = urlParams.get("file");

      let folderCategoria = categoria.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_");
      if (categoria === "Formulários") folderCategoria = "Formularios";
      else if (categoria === "Instruções de Trabalho") folderCategoria = "Instrucao_de_Trabalho_de_Servico_ITS";
      else if (categoria === "Procedimentos (POP)") folderCategoria = "Procedimentos_POP";
      else if (categoria === "Manuais") folderCategoria = "Manuais";

      const localPath = path.join(process.cwd(), "uploads", empresa, folderCategoria, fileName);
      if (fs.existsSync(localPath)) {
        const fileBuffer = fs.readFileSync(localPath);
        const remotePath = `${empresa}/${folderCategoria}/${fileName}`;
        
        await supabase.storage.from("documentos").upload(remotePath, fileBuffer, {
          contentType: "application/pdf",
          upsert: true
        });

        const { data } = supabase.storage.from("documentos").getPublicUrl(remotePath);
        
        await prisma.documento.update({
          where: { id: d.id },
          data: { arquivoUrl: data.publicUrl }
        });
        console.log(`Migrado: ${fileName}`);
      }
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
