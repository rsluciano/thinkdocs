import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const notificacao = await prisma.notificacao.findUnique({ where: { id } });

    if (!notificacao) {
      return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });
    }

    if (notificacao.usuarioId !== session.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.notificacao.update({
      where: { id },
      data: { lida: true }
    });

    return NextResponse.json({ message: "Notificação marcada como lida" }, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao marcar notificação como lida:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
