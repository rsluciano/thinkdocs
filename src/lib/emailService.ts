/**
 * Serviço centralizado de Notificações por E-mail.
 * Em ambiente de testes (protótipo), simula o envio imprimindo no console.
 * Em produção, basta conectar com Nodemailer, SendGrid, Resend, etc.
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
}

export const emailService = {
  /**
   * Envia um e-mail genérico (Simulação)
   */
  async sendEmail({ to, subject, body }: EmailOptions) {
    const recipients = Array.isArray(to) ? to.join(', ') : to;
    
    console.log(`\n==============================================`);
    console.log(`📩 SIMULAÇÃO DE E-MAIL (ThinkDocs)`);
    console.log(`Para: ${recipients}`);
    console.log(`Assunto: ${subject}`);
    console.log(`Mensagem:\n${body}`);
    console.log(`==============================================\n`);

    // Aqui entraria a chamada real:
    // await transporter.sendMail({ from: '"ThinkDocs" <no-reply@thinkdocs.com>', to, subject, text: body });
    return true;
  },

  /**
   * Dispara alerta de que um documento aguarda aprovação
   */
  async notificarAprovacaoPendente(
    aprovadoresEmails: string[], 
    autorNome: string, 
    documentoCodigo: string, 
    documentoTitulo: string,
    isRevisao: boolean = false
  ) {
    if (!aprovadoresEmails || aprovadoresEmails.length === 0) return;

    const subject = isRevisao 
      ? `Revisão Pendente: ${documentoCodigo}`
      : `Nova Aprovação Pendente: ${documentoCodigo}`;

    const body = `Olá Gestor,\n\nO colaborador ${autorNome} enviou o documento "${documentoCodigo} - ${documentoTitulo}" para aprovação.\n\nAcesse a Caixa de Entrada no sistema ThinkDocs para revisar e aprovar o documento.`;

    await this.sendEmail({ to: aprovadoresEmails, subject, body });
  },

  /**
   * Dispara alerta de que o documento foi devolvido (Reprovado)
   */
  async notificarDevolucao(
    autorEmail: string, 
    documentoCodigo: string, 
    documentoTitulo: string, 
    aprovadorNome: string, 
    motivo: string
  ) {
    if (!autorEmail) return;

    const subject = `⚠️ Documento Devolvido: ${documentoCodigo}`;
    const body = `Olá,\n\nO seu documento "${documentoCodigo} - ${documentoTitulo}" foi DEVOLVIDO por ${aprovadorNome}.\n\nMotivo apontado: "${motivo}"\n\nAcesse a aba "Devolvidos" no sistema ThinkDocs para realizar as correções e submeter novamente.`;

    await this.sendEmail({ to: autorEmail, subject, body });
  },

  /**
   * Dispara alerta crítico de Exclusão de Documento
   */
  async notificarExclusao(
    emails: string[], 
    documentoCodigo: string, 
    documentoTitulo: string, 
    excluidoPorNome: string = 'Administrador/Gestor'
  ) {
    if (!emails || emails.length === 0) return;

    const subject = `🚨 ALERTA CRÍTICO: Documento Excluído (${documentoCodigo})`;
    const body = `Atenção,\n\nO documento "${documentoCodigo} - ${documentoTitulo}" foi permanentemente EXCLUÍDO do sistema pelo usuário ${excluidoPorNome}.\n\nEsta ação não pode ser desfeita. Se isso foi um erro, o arquivo PDF original ainda pode estar armazenado nos backups do servidor.`;

    await this.sendEmail({ to: emails, subject, body });
  },

  /**
   * Dispara alerta de publicação de novo documento ou revisão aprovada
   */
  async notificarPublicacao(
    emails: string[],
    documentoCodigo: string,
    documentoTitulo: string,
    aprovadorNome: string
  ) {
    if (!emails || emails.length === 0) return;

    const subject = `📢 NOVO DOCUMENTO PUBLICADO: ${documentoCodigo}`;
    const body = `Olá equipe,\n\nUm novo documento ou revisão foi aprovado por ${aprovadorNome} e acaba de ser publicado na Lista Mestra:\n\n📄 Documento: ${documentoCodigo} - ${documentoTitulo}\n\nPor favor, acessem a Lista Mestra do ThinkDocs para ler a versão atualizada e garantir que estão seguindo o procedimento correto.`;

    await this.sendEmail({ to: emails, subject, body });
  }
};
