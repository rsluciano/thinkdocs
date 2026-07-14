import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local-db.json');

function getDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ empresas: [], usuarios: [], documentos: [] }));
  }
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (!data.empresas) data.empresas = [];
  if (!data.usuarios) data.usuarios = [];
  if (!data.documentos) data.documentos = [];
  return data;
}

function saveDb(data: any) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { nome, email, senha, empresaNome, empresaLogo } = data;

    if (!nome || !email || !senha || !empresaNome) {
      return NextResponse.json({ error: 'Dados incompletos. Nome da empresa é obrigatório.' }, { status: 400 });
    }

    const db = getDb();
    
    // Verifica e-mail duplicado
    if (db.usuarios.some((u: any) => u.email === email)) {
      return NextResponse.json({ error: 'Este e-mail já está em uso no sistema.' }, { status: 400 });
    }

    let defaultLogo = '/thinkdocs.png';
    if (empresaNome.toLowerCase().includes('souza')) {
      defaultLogo = '/logo-souza-areas.png';
    }

    // Criar a Empresa
    const novaEmpresa = {
      id: `emp_${Date.now()}`,
      nome: empresaNome,
      logoUrl: empresaLogo || defaultLogo
    };
    db.empresas.push(novaEmpresa);

    const novoUsuario = {
      id: Date.now().toString(),
      empresaId: novaEmpresa.id,
      empresaNome: novaEmpresa.nome,
      empresaLogo: novaEmpresa.logoUrl,
      nome,
      email,
      senha, // Plain text in prototype
      funcao: 'Administrador', // Auto-promove como Admin master no auto-cadastro
      setor: 'Geral',
      empresasPermitidas: [{ id: novaEmpresa.id, nome: novaEmpresa.nome }],
      status: 'Ativo', // Ativa diretamente sem e-mail pendente
      activationToken: null,
      resetToken: null
    };

    db.usuarios.push(novoUsuario);
    saveDb(db);

    // Retorna os dados seguros (sem a senha)
    const { senha: _, ...safeUser } = novoUsuario;

    return NextResponse.json({
      message: 'Cadastro realizado com sucesso',
      usuario: safeUser
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno ao salvar usuário' }, { status: 500 });
  }
}
