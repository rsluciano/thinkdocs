import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local-db.json');

function getDb() {
  if (!fs.existsSync(dbPath)) return { empresas: [], usuarios: [], documentos: [] };
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}
function saveDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { nome, logoUrl, adminId } = data;

    if (!nome || !adminId) {
      return NextResponse.json({ error: 'Nome do laboratório e ID do Admin são obrigatórios.' }, { status: 400 });
    }

    const db = getDb();
    
    // Criar nova Empresa
    const novaEmpresa = {
      id: `emp_${Date.now()}`,
      nome,
      logoUrl: logoUrl || '/thinkdocs.png'
    };
    db.empresas.push(novaEmpresa);

    // Adicionar à lista de empresas permitidas do Admin Logado
    const adminIndex = db.usuarios.findIndex((u: any) => u.id === adminId);
    if (adminIndex !== -1) {
      const admin = db.usuarios[adminIndex];
      if (!admin.empresasPermitidas) {
        admin.empresasPermitidas = [{ id: admin.empresaId, nome: admin.empresaNome }];
      }
      admin.empresasPermitidas.push({ id: novaEmpresa.id, nome: novaEmpresa.nome, logoUrl: novaEmpresa.logoUrl });
    }

    saveDb(db);

    return NextResponse.json({
      message: 'Laboratório criado com sucesso',
      empresa: novaEmpresa,
      empresasPermitidas: db.usuarios[adminIndex]?.empresasPermitidas
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao criar laboratório' }, { status: 500 });
  }
}
