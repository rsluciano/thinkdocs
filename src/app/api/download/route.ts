import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    // Tenta pegar o token do header ou do cookie (para downloads via iframe/href)
    let token = '';
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.cookies.get('thinkdocs_token')?.value || '';
    }

    if (!token) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    const session = await verifyToken(token);
    if (!session) {
      return new NextResponse('Sessão inválida', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const empresa = searchParams.get('empresa');
    const categoria = searchParams.get('categoria');
    const fileName = searchParams.get('file');

    if (!fileName || !empresa || !categoria) {
      return new NextResponse('Parâmetros de arquivo inválidos', { status: 400 });
    }

    // Prevenção IDOR (Impedir que uma empresa baixe de outra empresa)
    if (empresa !== session.empresaId) {
      return new NextResponse('Acesso negado: Empresa inválida', { status: 403 });
    }

    // Prevenir directory traversal de segurança
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return new NextResponse('Acesso negado: Nome de arquivo inválido', { status: 403 });
    }

    const catString = String(categoria);
    let folderCategoria = catString.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_');
    
    if (catString === 'Formulários') folderCategoria = 'Formularios';
    else if (catString === 'Instruções de Trabalho') folderCategoria = 'Instrucao_de_Trabalho_de_Servico_ITS';
    else if (catString === 'Procedimentos (POP)') folderCategoria = 'Procedimentos_POP';
    else if (catString === 'Manuais') folderCategoria = 'Manuais';

    const filePath = `${empresa}/${folderCategoria}/${fileName}`;

    // Agora utilizamos URL assinada válida por 60 segundos, em vez de URL pública
    const { data, error } = await supabase.storage.from('documentos').createSignedUrl(filePath, 60);
    
    if (data && data.signedUrl) {
      return NextResponse.redirect(data.signedUrl);
      } else {
        return new NextResponse(`
          <html>
            <body style="background:#f8fafc; color:#334155; font-family:sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0;">
              <h2 style="color:#ef4444; margin-bottom:10px;">Arquivo não localizado ⚠️</h2>
              <p>O arquivo físico deste documento não foi encontrado no servidor.</p>
              <p style="font-size:0.8rem; color:#64748b;">Isso pode ocorrer se o documento foi registrado sem upload ou ocorreu uma falha de sincronização.</p>
            </body>
          </html>
        `, { 
          status: 404, 
          headers: { 'Content-Type': 'text/html; charset=utf-8' } 
        });
      }
    return new NextResponse('Arquivo não encontrado no storage', { status: 404 });
  } catch (error) {
    return new NextResponse('Erro ao buscar o arquivo', { status: 500 });
  }
}
