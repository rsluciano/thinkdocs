import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

  const filePath = path.join(process.cwd(), 'uploads', empresa, folderCategoria, fileName);

  try {
    const fileBuffer = await fs.readFile(filePath);
    
    // Inferência básica de Content-Type baseada na extensão
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
    else if (fileName.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (fileName.endsWith('.xlsx')) contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (fileName.endsWith('.doc')) contentType = 'application/msword';
    else if (fileName.endsWith('.xls')) contentType = 'application/vnd.ms-excel';

    // Para forçar o download no navegador e usar o nome original
    const originalName = fileName.substring(fileName.indexOf('-') + 1);

    // Define se o arquivo será visualizado no navegador ou baixado
    const action = searchParams.get('action') || 'view';
    const disposition = action === 'download' ? 'attachment' : 'inline';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${originalName}"`,
      },
    });
  } catch (error) {
    return new NextResponse('Arquivo não encontrado no servidor', { status: 404 });
  }
}
