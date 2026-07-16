import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest) {
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

    await prisma.notificacao.updateMany({
      where: { 
        usuarioId: session.id,
        lida: false 
      },
      data: { lida: true }
    });

    return NextResponse.json({ message: "Todas as notificações foram marcadas como lidas" }, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao marcar todas notificações como lidas:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
