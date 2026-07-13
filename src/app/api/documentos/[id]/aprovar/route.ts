import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { emailService } from '@/lib/emailService';

const dbPath = path.join(process.cwd(), 'local-db.json');

function getDb() {
  if (!fs.existsSync(dbPath)) return { documentos: [] };
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, aprovadorNome, motivoReprovacao } = await req.json(); // status esperado: 'Vigente' ou 'Reprovado'

    if (!status) {
      return NextResponse.json({ error: 'Status não fornecido' }, { status: 400 });
    }

    const db = getDb();
    const docIndex = db.documentos.findIndex((d: any) => d.id === id);

    if (docIndex === -1) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    const doc = db.documentos[docIndex];
    
    doc.status = status;
    doc.aprovadoPor = aprovadorNome || 'Admin';
    doc.dataAprovacao = new Date().toISOString();
    
    if (status === 'Reprovado' && motivoReprovacao) {
      doc.motivoReprovacao = motivoReprovacao;
    }
    
    // Se foi aprovado, calcula vencimento (ex: 1 ano padrão) SOMENTE se o autor não definiu uma dataVencimento manual
    if (status === 'Vigente') {
      if (!doc.dataVencimento) {
        const vencimento = new Date();
        vencimento.setFullYear(vencimento.getFullYear() + 1);
        doc.dataVencimento = vencimento.toISOString();
      }
      
      // Arquivo Morto: Acha o documento pai (ou qualquer outro com o mesmo código que estava Vigente) e marca como Obsoleto
      const oldDocs = db.documentos.filter((d: any) => 
        d.id !== doc.id && 
        d.codigo === doc.codigo && 
        d.empresaId === doc.empresaId && 
        d.status === 'Vigente'
      );
      
      oldDocs.forEach((oldDoc: any) => {
        oldDoc.status = 'Obsoleto';
        oldDoc.dataObsoletado = new Date().toISOString();
      });
    }

    saveDb(db);

    if (status === 'Reprovado' && motivoReprovacao) {
      const autorUsuario = db.usuarios.find((u: any) => u.nome === doc.autor && u.empresaId === doc.empresaId);
      if (autorUsuario && autorUsuario.email) {
        await emailService.notificarDevolucao(
          autorUsuario.email,
          doc.codigo,
          doc.titulo,
          doc.aprovadoPor,
          motivoReprovacao
        );
      }
    } else if (status === 'Vigente') {
      // (Opcional) Notificar que foi aprovado (Autor)
      const autorUsuario = db.usuarios.find((u: any) => u.nome === doc.autor && u.empresaId === doc.empresaId);
      if (autorUsuario && autorUsuario.email) {
        await emailService.sendEmail({
          to: autorUsuario.email,
          subject: `✅ Documento Aprovado: ${doc.codigo}`,
          body: `Olá,\n\nSeu documento "${doc.codigo} - ${doc.titulo}" foi APROVADO por ${doc.aprovadoPor} e já está Vigente na Lista Mestra!`
        });
      }

      // Notificar todos os colaboradores afetados (Broadcast)
      // Filtra usuários da mesma empresa
      let publicoAlvo = db.usuarios.filter((u: any) => u.empresaId === doc.empresaId && u.status !== 'Bloqueado');
      
      // Se o documento NÃO for "Geral", filtra apenas quem é da liderança OU pertence ao(s) setor(es) do documento
      const docSetorArr = Array.isArray(doc.setor) ? doc.setor : [doc.setor || 'Geral'];
      if (!docSetorArr.includes('Geral')) {
        publicoAlvo = publicoAlvo.filter((u: any) => {
          const isLeadership = ['Diretor', 'Gestor da Qualidade', 'Administrador', 'Responsável Técnico', 'Líder de Setor'].includes(u.funcao);
          if (isLeadership) return true;
          // Se for operacional, verifica se o setor dele está nos setores do doc
          const setoresDoUsuario = (u.setor || '').split(',').map((s: string) => s.trim());
          return docSetorArr.some((s: string) => setoresDoUsuario.includes(s));
        });
      }

      const emailsParaBroadcast = [...new Set(publicoAlvo.map((u: any) => u.email))] as string[];

      await emailService.notificarPublicacao(
        emailsParaBroadcast,
        doc.codigo,
        doc.titulo,
        doc.aprovadoPor
      );
    }

    return NextResponse.json({ message: `Documento marcado como ${status}`, documento: doc }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao atualizar documento' }, { status: 500 });
  }
}
