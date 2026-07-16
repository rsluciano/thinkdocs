import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const empresa = searchParams.get('empresa');
  const categoria = searchParams.get('categoria');
  const fileName = searchParams.get('file');

  if (!fileName || !empresa || !categoria) {
    return new NextResponse('Parâmetros de arquivo inválidos', { status: 400 });
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

  try {
    const { data } = supabase.storage.from('documentos').getPublicUrl(filePath);
    
    if (data && data.publicUrl) {
      // Verifica se o arquivo realmente existe na nuvem antes de redirecionar
      const headRes = await fetch(data.publicUrl, { method: 'HEAD' });
      
      if (headRes.ok) {
        return NextResponse.redirect(data.publicUrl);
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
    }
    
    return new NextResponse('Arquivo não encontrado no storage', { status: 404 });
  } catch (error) {
    return new NextResponse('Erro ao buscar o arquivo', { status: 500 });
  }
}
