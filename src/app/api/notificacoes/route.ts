import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
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

    const notificacoes = await prisma.notificacao.findMany({
      where: {
        usuarioId: session.id,
        empresaId: session.empresaId
      },
      orderBy: {
        criadoEm: "desc"
      },
      take: 50 // Limitando às últimas 50
    });

    return NextResponse.json(notificacoes, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
