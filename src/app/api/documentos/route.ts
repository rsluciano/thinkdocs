import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/emailService';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    // Agora o empresaId vem única e exclusivamente do token autenticado
    const empresaId = session.empresaId;
    const userFuncao = session.funcao;
    const userSetor = session.setor;

    const whereClause: any = { empresaId };
    if (status) {
      if (status.includes(',')) {
        whereClause.status = { in: status.split(',') };
      } else {
        whereClause.status = status;
      }
    }

    let docs = await prisma.documento.findMany({
      where: whereClause,
      orderBy: { dataEnvio: 'desc' }
    });

    // Regra de Negócio: TODO documento pertence à Qualidade.
    docs = docs.map((d: any) => {
      const docSetorStr = Array.isArray(d.setor) ? d.setor.join(',') : (d.setor || 'Geral');
      const docSetoresList = docSetorStr.split(',').map((s: string) => s.trim());
      if (!docSetoresList.includes('Qualidade')) {
        docSetoresList.push('Qualidade');
      }
      return { ...d, setor: docSetoresList };
    });

    if (userFuncao && userSetor) {
      const isFullAccess = ['Diretor', 'Gestor da Qualidade', 'Administrador', 'Responsável Técnico'].includes(userFuncao);
      if (!isFullAccess) {
        // Colaboradores e Líderes de Setor só veem documentos de seus setores ou Geral
        const userSetoresList = userSetor.split(',').map((s: string) => s.trim());
        const hasGeralAccess = userSetoresList.includes('Geral');
        
        if (!hasGeralAccess) {
          docs = docs.filter((d: any) => {
            return d.setor.includes('Geral') || d.setor.some((s: string) => userSetoresList.includes(s));
          });
        }
      }
    }

    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar documentos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const data = await req.json();
    const { titulo, codigo, categoria, arquivo, dataAtualizacao, dataProximaAtualizacao } = data;
    // Pega o setor enviado no JSON, mas o autor e empresaId vêm 100% do TOKEN!
    let { setor } = data; 
    
    const empresaId = session.empresaId;
    const autorNome = session.nome;

    if (!titulo || !codigo || !categoria || !arquivo) {
      return NextResponse.json({ error: 'Dados incompletos do documento.' }, { status: 400 });
    }

    const parsedSetores = Array.isArray(setor) ? setor : (setor || 'Geral').split(',').map((s:string)=>s.trim());
    if (!parsedSetores.includes('Qualidade')) {
      parsedSetores.push('Qualidade');
    }

    const novoDocumento = await prisma.documento.create({
      data: {
        empresaId,
        codigo,
        titulo,
        categoria,
        setor: parsedSetores.join(','),
        autor: autorNome || 'Desconhecido',
        dataAtualizacao: dataAtualizacao ? new Date(dataAtualizacao) : null,
        dataVencimento: dataProximaAtualizacao ? new Date(dataProximaAtualizacao) : null,
        arquivoUrl: arquivo,
        status: 'Aguardando Aprovação',
        revisao: 1
      }
    });

    // Encontrar gestores/diretores para notificar (da mesma empresa)
    const aprovadores = await prisma.usuario.findMany({
      where: {
        empresaId,
        funcao: { in: ['Diretor', 'Gestor da Qualidade', 'Administrador'] }
      }
    });
    const emails = aprovadores.map((a: any) => a.email);

    // Usa o serviço de email para notificar
    await emailService.notificarAprovacaoPendente(
      emails,
      novoDocumento.autor,
      novoDocumento.codigo,
      novoDocumento.titulo,
      false
    );

    return NextResponse.json({
      message: 'Documento enviado para aprovação com sucesso',
      documento: novoDocumento
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro na API de documentos:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
