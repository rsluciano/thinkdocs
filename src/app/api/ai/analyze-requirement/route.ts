import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { textoIntegral } = await request.json();

    if (!textoIntegral) {
      return NextResponse.json({ error: 'Texto do requisito não fornecido' }, { status: 400 });
    }

    // Simulação de processamento de Inteligência Artificial
    // Em produção, isso seria substituído por uma chamada real à API (OpenAI, Gemini, etc)
    
    // Aguardamos 1.5s para simular o tempo de resposta de uma IA real
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Lógica básica para gerar uma resposta mockada mais contextualizada
    let traducao = "Este requisito estabelece regras operacionais ou de infraestrutura que devem ser seguidas para garantir a segurança e a qualidade no serviço de análises clínicas.";
    let evidencias = ["Procedimento Operacional Padrão (POP)", "Registro de Treinamento", "Relatório de Manutenção", "Alvará Sanitário"];
    let riscos = "Autuação da Vigilância Sanitária, interdição de equipamentos ou do estabelecimento, e possíveis falhas no diagnóstico de pacientes.";

    if (textoIntegral.toLowerCase().includes('equipamento') || textoIntegral.toLowerCase().includes('calibração')) {
      traducao = "Este requisito exige que todos os equipamentos de laboratório estejam devidamente qualificados e calibrados, garantindo a precisão e exatidão dos exames.";
      evidencias = ["Certificado de Calibração", "Contrato de Manutenção Preventiva", "Registro Diário de Temperatura"];
      riscos = "Resultados falsos nos exames de pacientes devido a falha técnica ou descalibração do equipamento.";
    } else if (textoIntegral.toLowerCase().includes('pessoal') || textoIntegral.toLowerCase().includes('capacitação')) {
      traducao = "A norma exige que os profissionais envolvidos na execução dos exames estejam devidamente habilitados, treinados e documentados para a função.";
      evidencias = ["Certificados de Formação", "Registro do Conselho de Classe (CRF/CRBM/CRM)", "Lista de Presença em Treinamentos Internos"];
      riscos = "Erros de manipulação ou interpretação de amostras por equipe não qualificada, gerando risco direto à vida do paciente.";
    } else if (textoIntegral.toLowerCase().includes('laudo') || textoIntegral.toLowerCase().includes('resultado')) {
      traducao = "O requisito padroniza as informações mínimas e obrigatórias que devem constar no laudo liberado ao paciente, garantindo a rastreabilidade médica e jurídica.";
      evidencias = ["Modelo/Layout padrão do Laudo", "Procedimento de Liberação de Resultados", "Sistema LIS com assinaturas eletrônicas"];
      riscos = "Erros de interpretação médica, ações judiciais por resultados trocados, dificuldade na rastreabilidade clínica do paciente.";
    }

    const mockResponse = {
      traducaoSimplificada: traducao,
      sugestoesEvidencias: evidencias,
      riscosNaoConformidade: riscos,
      nota: "Esta é uma análise gerada por inteligência artificial e deve ser validada pelo Responsável Técnico ou da Garantia da Qualidade."
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Erro na API de IA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao analisar o requisito' }, { status: 500 });
  }
}
