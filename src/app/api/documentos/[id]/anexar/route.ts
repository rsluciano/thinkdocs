import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    const { arquivoUrl } = data;

    if (!arquivoUrl) {
      return NextResponse.json({ error: 'Nenhum arquivo informado' }, { status: 400 });
    }

    const doc = await prisma.documento.findUnique({ where: { id } });

    if (!doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }
    
    // Verificação de IDOR
    if (doc.empresaId !== session.empresaId) {
      return NextResponse.json({ error: 'Acesso negado. Documento pertence a outra empresa.' }, { status: 403 });
    }

    // Verificação RBAC
    const isGestor = ['Diretor', 'Administrador', 'Gestor da Qualidade'].includes(session.funcao);
    if (!isGestor && doc.autor !== session.nome) {
       return NextResponse.json({ error: 'Acesso negado. Apenas gestores ou o autor podem alterar este documento.' }, { status: 403 });
    }

    const updated = await prisma.documento.update({
      where: { id },
      data: { arquivoUrl }
    });

    return NextResponse.json({ message: 'Arquivo anexado com sucesso', documento: updated }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao anexar arquivo' }, { status: 500 });
  }
}
