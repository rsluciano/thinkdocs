"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ElaboracaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const revisaoId = searchParams.get('revisao');
  const devolvidoId = searchParams.get('devolvidoId');

  const [user, setUser] = useState<any>(null);

  const [codigo, setCodigo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Geral');
  const [setoresSelecionados, setSetoresSelecionados] = useState<string[]>(['Geral']);
  const [dataAtualizacao, setDataAtualizacao] = useState('');
  const [dataProximaAtualizacao, setDataProximaAtualizacao] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(Date.now());
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Auth Check
  useEffect(() => {
    const savedUser = localStorage.getItem('thinkdocs_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      
      const isLeadership = ['Diretor', 'Gestor da Qualidade', 'Administrador', 'Responsável Técnico', 'Líder de Setor'].includes(parsedUser.funcao);
      if (!isLeadership) {
        router.push('/');
        return;
      }
      
      const OPTIONS_ALL = [
        "Recepção e Atendimento", "Coleta", "Triagem", "Bioquímica", 
        "Hematologia", "Imunologia", "Microbiologia", 
        "Urinálise", "Parasitologia",
        "Qualidade", "Faturamento", "TI e Infraestrutura", "Área Técnica", 
        "Administrativo", "Diretoria", "Limpeza", "Geral"
      ];
      
      setUser(parsedUser);
      
      // Se for modo de revisão ou correção de devolvido, carrega o documento original
      if (revisaoId || devolvidoId) {
        fetch(`/api/documentos?empresaId=${parsedUser.empresaId}&status=${devolvidoId ? 'Reprovado' : 'Vigente'}`)
          .then(res => res.json())
          .then(data => {
            const doc = data.find((d: any) => d.id === (revisaoId || devolvidoId));
            if (doc) {
              setCodigo(doc.codigo);
              setTitulo(doc.titulo);
              setCategoria(doc.categoria || 'Geral');
              if (Array.isArray(doc.setor)) {
                setSetoresSelecionados(doc.setor);
              } else if (doc.setor) {
                setSetoresSelecionados([doc.setor]);
              } else {
                setSetoresSelecionados(['Geral']);
              }
              if (doc.dataAtualizacao) setDataAtualizacao(doc.dataAtualizacao.split('T')[0]);
              if (doc.dataVencimento) setDataProximaAtualizacao(doc.dataVencimento.split('T')[0]);
              
              if (devolvidoId && doc.motivoReprovacao) {
                setMessage(`⚠️ Motivo da Devolução: ${doc.motivoReprovacao}`);
              }
            }
          });
      } else {
        // Novo documento: por padrão, deixa todos os setores visíveis selecionados
        const userSetores = parsedUser?.setor?.split(',').map((s: string) => s.trim()) || [];
        const isLider = parsedUser?.funcao === 'Líder de Setor';
        const allowed = OPTIONS_ALL.filter(o => !isLider || o === 'Geral' || userSetores.includes(o));
        setSetoresSelecionados(allowed);
      }
    }
  }, [router, revisaoId, devolvidoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validação customizada
    let missingFields = [];
    if (!codigo) missingFields.push('Código do Documento');
    if (!titulo) missingFields.push('Título');
    if (setoresSelecionados.length === 0) missingFields.push('Setores Aplicáveis (selecione pelo menos um)');
    if (!dataAtualizacao) missingFields.push('Data de Atualização (Vigência)');
    if (!dataProximaAtualizacao) missingFields.push('Próxima Atualização (Vencimento)');
    if (!file) missingFields.push('Arquivo do Documento (anexo)');

    if (missingFields.length > 0) {
      const errorMsg = `Preenchimento Incompleto!\n\nPor favor, preencha os seguintes campos obrigatórios antes de enviar:\n\n- ${missingFields.join('\n- ')}`;
      alert(errorMsg); // Pop-up nativo solicitado pelo usuário
      setError('Verifique os campos obrigatórios e tente novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Fazer upload do arquivo real (reaproveitando a API de upload)
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('empresa', user?.empresaId || 'ThinkDocs');
      formData.append('categoria', categoria);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Falha ao fazer upload do arquivo');
      }

      // 2. Registrar no banco com status de workflow
      const endpoint = devolvidoId 
        ? `/api/documentos/${devolvidoId}/corrigir`
        : (revisaoId ? `/api/documentos/${revisaoId}` : '/api/documentos');
        
      const method = (revisaoId || devolvidoId) ? 'PUT' : 'POST';

      const docRes = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo,
          titulo,
          categoria,
          setor: setoresSelecionados,
          dataAtualizacao: dataAtualizacao || undefined,
          dataProximaAtualizacao: dataProximaAtualizacao || undefined,
          autorNome: user?.nome,
          arquivo: uploadData.filename, // Nome ou URL salvo
          empresaId: user?.empresaId
        })
      });

      const docData = await docRes.json();

      if (docRes.ok) {
        setMessage('Documento enviado para aprovação com sucesso! Nossos gestores já foram notificados.');
        setCodigo('');
        setTitulo('');
        setFile(null);
        setDataAtualizacao('');
        setDataProximaAtualizacao('');
        
        // Reseta deixando todos os setores aplicáveis selecionados
        const OPTIONS_ALL = [
          "Recepção e Atendimento", "Coleta", "Triagem", "Bioquímica", 
          "Hematologia", "Imunologia", "Microbiologia", 
          "Urinálise", "Parasitologia",
          "Qualidade", "Faturamento", "TI e Infraestrutura", "Área Técnica", 
          "Administrativo", "Diretoria", "Limpeza", "Geral"
        ];
        const userSetores = user?.setor?.split(',').map((s: string) => s.trim()) || [];
        const isLider = user?.funcao === 'Líder de Setor';
        const allowed = OPTIONS_ALL.filter(o => !isLider || o === 'Geral' || userSetores.includes(o));
        setSetoresSelecionados(allowed);

        setFileKey(Date.now());
      } else {
        setError(docData.error || 'Erro ao registrar documento no fluxo.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null; // Aguarda o auth check

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem' }}>
        {devolvidoId ? 'Correção de Documento Devolvido' : (revisaoId ? 'Revisão de Documento' : 'Elaboração de Documentos')}
      </h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        {devolvidoId
          ? 'Corrija os apontamentos do gestor e reenvie para aprovação.'
          : (revisaoId 
            ? 'Atualize o arquivo e envie para aprovação de uma nova versão.' 
            : 'Inicie um novo rascunho. O documento passará por avaliação antes de ir para a Lista Mestra.')}
      </p>

      <div className="card" style={{ maxWidth: '600px' }}>
        <h2 className="text-xl font-bold" style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
          {devolvidoId ? 'Reenviar Documento' : (revisaoId ? 'Enviar Nova Versão' : 'Enviar Novo Rascunho')}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Código do Documento</label>
            <input 
              type="text" 
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: POP-001" 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Título</label>
            <input 
              type="text" 
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Procedimento de Limpeza" 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Categoria</label>
            <select 
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'white' }}
            >
              <option value="Bulário">Bulário</option>
              <option value="Documentos Mestres">Documentos Mestres</option>
              <option value="FISPQs">FISPQs</option>
              <option value="Formulários">Formulários</option>
              <option value="Formulários Preenchidos">Formulários Preenchidos</option>
              <option value="Geral">Geral</option>
              <option value="Instrução de trabalho de Equipamentos">Instrução de trabalho de Equipamentos</option>
              <option value="Instrução de trabalho de Exames">Instrução de trabalho de Exames</option>
              <option value="Instrução de trabalho de Serviço">Instrução de trabalho de Serviço</option>
              <option value="Listas">Listas</option>
              <option value="Manuais">Manuais</option>
              <option value="Procedimentos da qualidade">Procedimentos da qualidade</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Setores Aplicáveis</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'white' }}>
              {[
                "Recepção e Atendimento", "Coleta", "Triagem", "Bioquímica", 
                "Hematologia", "Imunologia", "Microbiologia", 
                "Urinálise", "Parasitologia",
                "Qualidade", "Faturamento", "TI e Infraestrutura", "Área Técnica", 
                "Administrativo", "Diretoria", "Limpeza", "Geral"
              ].map(opcao => {
                const OPTIONS_ALL = [
                  "Recepção e Atendimento", "Coleta", "Triagem", "Bioquímica", 
                  "Hematologia", "Imunologia", "Microbiologia", 
                  "Urinálise", "Parasitologia",
                  "Qualidade", "Faturamento", "TI e Infraestrutura", "Área Técnica", 
                  "Administrativo", "Diretoria", "Limpeza", "Geral"
                ];
                const userSetores = user?.setor?.split(',').map((s: string) => s.trim()) || [];
                const isLider = user?.funcao === 'Líder de Setor';
                const hasAccess = !isLider || opcao === 'Geral' || userSetores.includes(opcao);
                
                if (!hasAccess) return null; // Oculta opções que o líder não controla

                return (
                  <label key={opcao} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={setoresSelecionados.includes(opcao)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (opcao === 'Geral') {
                            const allowed = OPTIONS_ALL.filter(o => !isLider || o === 'Geral' || userSetores.includes(o));
                            setSetoresSelecionados(allowed);
                          } else if (opcao === 'Área Técnica') {
                            const toAdd = ['Área Técnica', 'Bioquímica', 'Hematologia', 'Microbiologia', 'Urinálise', 'Imunologia', 'Parasitologia'];
                            setSetoresSelecionados(prev => Array.from(new Set([...prev, ...toAdd])));
                          } else {
                            setSetoresSelecionados(prev => [...prev, opcao]);
                          }
                        } else {
                          if (opcao === 'Geral') {
                            setSetoresSelecionados([]); // Limpa tudo se desmarcar Geral
                          } else {
                            setSetoresSelecionados(prev => prev.filter(s => s !== opcao));
                          }
                        }
                      }}
                    />
                    {opcao === "Geral" ? "Geral (Selecionar Todos)" : opcao}
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Data de Atualização (Vigência)</label>
              <input 
                type="date" 
                value={dataAtualizacao}
                onChange={(e) => {
                  const val = e.target.value;
                  setDataAtualizacao(val);
                  if (val) {
                    const nextYear = new Date(val);
                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                    setDataProximaAtualizacao(nextYear.toISOString().split('T')[0]);
                  }
                }}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Próxima Atualização (Vencimento)</label>
              <input 
                type="date" 
                value={dataProximaAtualizacao}
                onChange={(e) => setDataProximaAtualizacao(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Arquivo do Documento</label>
            <input 
              key={fileKey}
              type="file" 
              onChange={(e) => {
                const selectedFile = e.target.files ? e.target.files[0] : null;
                setFile(selectedFile);
                if (selectedFile) {
                  const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
                  // Regex para pegar hífens normais (-), meia-risca (–) e travessão (—) cercados por espaços
                  const separatorRegex = /\s+[-–—]\s+/;
                  
                  if (separatorRegex.test(nameWithoutExt)) {
                    const parts = nameWithoutExt.split(separatorRegex);
                    const extractedCodigo = parts[0].trim();
                    // Junta o resto com hífen normal caso tenha mais de um separador no título
                    const extractedTitulo = parts.slice(1).join(" - ").trim();
                    
                    if (extractedCodigo && extractedTitulo) {
                      setCodigo(extractedCodigo);
                      setTitulo(extractedTitulo);
                    }
                  }
                }
              }}
              required 
              style={{ width: '100%', padding: '0.5rem', border: '1px dashed var(--primary)', borderRadius: '4px' }}
            />
          </div>

          {error && <div style={{ color: 'red', fontWeight: 'bold', fontSize: '0.9rem' }}>{error}</div>}
          
          {message && (
            <div style={{ 
              color: devolvidoId && message.includes('Motivo da Devolução') ? '#991b1b' : 'green', 
              fontWeight: 'bold', 
              padding: '1rem', 
              backgroundColor: devolvidoId && message.includes('Motivo da Devolução') ? '#fef2f2' : '#dcfce7', 
              borderRadius: '4px',
              borderLeft: devolvidoId && message.includes('Motivo da Devolução') ? '4px solid #dc2626' : 'none'
            }}>
              {!message.includes('Motivo da Devolução') && '✅ '}
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              padding: '0.75rem', 
              backgroundColor: 'var(--primary)', 
              color: 'white', 
              border: 'none', 
              borderRadius: 'var(--radius)', 
              fontWeight: 'bold', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar para Aprovação'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Elaboracao() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ElaboracaoContent />
    </Suspense>
  );
}
