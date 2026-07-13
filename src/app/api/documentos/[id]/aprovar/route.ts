import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { emailService } from "@/lib/emailService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, aprovadorNome, motivoReprovacao } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Status não fornecido" }, { status: 400 });
    }

    const doc = await prisma.documento.findUnique({ where: { id } });

    if (!doc) {
      return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
    }
    
    let dataVencimento = doc.dataVencimento;

    // Se foi aprovado, calcula vencimento (ex: 1 ano padrão) SOMENTE se o autor não definiu uma dataVencimento manual
    if (status === "Vigente") {
      if (!dataVencimento) {
        const vencimento = new Date();
        vencimento.setFullYear(vencimento.getFullYear() + 1);
        dataVencimento = vencimento;
      }
      
      // Arquivo Morto: Acha o documento pai (ou qualquer outro com o mesmo código que estava Vigente) e marca como Obsoleto
      await prisma.documento.updateMany({
        where: {
          NOT: { id: doc.id },
          codigo: doc.codigo,
          empresaId: doc.empresaId,
          status: "Vigente"
        },
        data: {
          status: "Obsoleto",
          dataObsoletado: new Date()
        }
      });
    }

    const updatedDoc = await prisma.documento.update({
      where: { id },
      data: {
        status: status,
        aprovadoPor: aprovadorNome || "Admin",
        dataAprovacao: new Date(),
        motivoReprovacao: status === "Reprovado" ? motivoReprovacao : null,
        dataVencimento: dataVencimento
      }
    });

    if (status === "Reprovado" && motivoReprovacao) {
      const autorUsuario = await prisma.usuario.findFirst({ where: { nome: doc.autor, empresaId: doc.empresaId } });
      if (autorUsuario && autorUsuario.email) {
        await emailService.notificarDevolucao(
          autorUsuario.email,
          doc.codigo,
          doc.titulo,
          updatedDoc.aprovadoPor || "Admin",
          motivoReprovacao
        );
      }
    } else if (status === "Vigente") {
      // (Opcional) Notificar que foi aprovado (Autor)
      const autorUsuario = await prisma.usuario.findFirst({ where: { nome: doc.autor, empresaId: doc.empresaId } });
      if (autorUsuario && autorUsuario.email) {
        await emailService.sendEmail({
          to: autorUsuario.email,
          subject: `✅ Documento Aprovado: ${doc.codigo}`,
          body: `Olá,\n\nSeu documento "${doc.codigo} - ${doc.titulo}" foi APROVADO por ${updatedDoc.aprovadoPor} e já está Vigente na Lista Mestra!`
        });
      }

      // Notificar todos os colaboradores afetados (Broadcast)
      let publicoAlvo = await prisma.usuario.findMany({ where: { empresaId: doc.empresaId } });
      
      const docSetorArr = Array.isArray(doc.setor) ? doc.setor : [doc.setor || "Geral"];
      if (!docSetorArr.includes("Geral")) {
        publicoAlvo = publicoAlvo.filter((u: any) => {
          const isLeadership = ["Diretor", "Gestor da Qualidade", "Administrador", "Responsável Técnico", "Líder de Setor"].includes(u.funcao);
          if (isLeadership) return true;
          const setoresDoUsuario = (u.setor || "").split(",").map((s: string) => s.trim());
          return docSetorArr.some((s: string) => setoresDoUsuario.includes(s));
        });
      }

      const emailsParaBroadcast = [...new Set(publicoAlvo.map((u: any) => u.email))] as string[];

      await emailService.notificarPublicacao(
        emailsParaBroadcast,
        doc.codigo,
        doc.titulo,
        updatedDoc.aprovadoPor || "Admin"
      );
    }

    return NextResponse.json({ message: `Documento marcado como ${status}`, documento: updatedDoc }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: "Erro interno ao atualizar documento" }, { status: 500 });
  }
}
