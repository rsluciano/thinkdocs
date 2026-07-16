import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const session = await verifyToken(token);
    
    if (!session) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const { id } = await params;

    const requisito = await prisma.requisitoVigilancia.findUnique({ where: { id } });

    if (!requisito) {
      return NextResponse.json({ error: "Requisito não encontrado" }, { status: 404 });
    }

    if (requisito.empresaId !== session.empresaId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.requisitoVigilancia.delete({ where: { id } });

    return NextResponse.json({ message: "Requisito excluído com sucesso" }, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao excluir requisito:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
