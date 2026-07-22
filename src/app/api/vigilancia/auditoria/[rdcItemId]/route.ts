import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ rdcItemId: string }> }) {
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

    const { rdcItemId } = await params;
    const data = await req.json();

    // Verificação RBAC
    const isGestor = ['Diretor', 'Administrador', 'Gestor da Qualidade'].includes(session.funcao);
    if (!isGestor) {
       return NextResponse.json({ error: 'Acesso negado. Apenas Gestores da Qualidade ou Diretores podem responder à auditoria RDC.' }, { status: 403 });
    }

    const {
      conforme,
      evidenciaEncontrada,
      acaoCorretiva,
      responsavelId,
      prazo,
      status,
      observacoes
    } = data;

    // Upsert auditoria
    const auditoria = await prisma.auditoriaRdc.upsert({
      where: {
        empresaId_rdcItemId: {
          empresaId: session.empresaId,
          rdcItemId
        }
      },
      update: {
        conforme,
        evidenciaEncontrada,
        acaoCorretiva,
        responsavelId,
        prazo: prazo ? new Date(prazo) : null,
        status,
        observacoes
      },
      create: {
        empresaId: session.empresaId,
        rdcItemId,
        conforme,
        evidenciaEncontrada,
        acaoCorretiva,
        responsavelId,
        prazo: prazo ? new Date(prazo) : null,
        status: status || 'Pendente',
        observacoes
      }
    });

    return NextResponse.json(auditoria, { status: 200 });

  } catch (error: any) {
    console.error("Erro ao atualizar auditoria:", error);
    return NextResponse.json({ error: 'Erro interno ao atualizar auditoria' }, { status: 500 });
  }
}
