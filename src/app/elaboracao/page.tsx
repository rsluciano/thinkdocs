"use client";
import { fetchAPI } from '@/lib/api';
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

  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

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
        "Faturamento", "TI e Infraestrutura", "Área Técnica", 
        "Administrativo", "Diretoria", "Limpeza", "Geral"
      ];
      
      setUser(parsedUser);
      
      // Se for modo de revisão ou correção de devolvido, carrega o documento original
      if (revisaoId || devolvidoId) {
        fetchAPI(`/api/documentos?empresaId=${parsedUser.empresaId}&status=${devolvidoId ? 'Reprovado' : 'Vigente'}`)
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
                setSetoresSelecionados(doc.setor.split(',').map((s: string) => s.trim()));
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
      
      carregarRascunhos(parsedUser);
    }
  }, [router, revisaoId, devolvidoId]);

  const carregarRascunhos = async (u: any) => {
    try {
      const res = await fetchAPI(`/api/documentos?empresaId=${u.empresaId}&status=Rascunho`);
      if (res.ok) {
        setDrafts(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const carregarRascunhoParaForm = (doc: any) => {
    setSelectedDraftId(doc.id);
    setCodigo(doc.codigo || '');
    setTitulo(doc.titulo || '');
    setCategoria(doc.categoria || 'Geral');
    if (Array.isArray(doc.setor)) {
      setSetoresSelecionados(doc.setor);
    } else if (doc.setor) {
      setSetoresSelecionados(doc.setor.split(',').map((s: string) => s.trim()));
    } else {
      setSetoresSelecionados(['Geral']);
    }
    if (doc.dataAtualizacao) setDataAtualizacao(doc.dataAtualizacao.split('T')[0]);
    else setDataAtualizacao('');
    
    if (doc.dataVencimento) setDataProximaAtualizacao(doc.dataVencimento.split('T')[0]);
    else setDataProximaAtualizacao('');

    setMessage('Rascunho carregado.');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    if (e) e.preventDefault();
    setError('');
    setMessage('');

    // Validação customizada
    const missingFields = [];
    if (!isDraft) {
      if (!codigo) missingFields.push('Código do Documento');
      if (!titulo) missingFields.push('Título');
      if (setoresSelecionados.length === 0) missingFields.push('Setores Aplicáveis (selecione pelo menos um)');
      if (!dataAtualizacao) missingFields.push('Data de Atualização (Vigência)');
      if (!dataProximaAtualizacao) missingFields.push('Próxima Atualização (Vencimento)');
      if (!file && !selectedDraftId) missingFields.push('Arquivo do Documento (anexo)');
    } else {
      if (!codigo && !titulo) missingFields.push('Informe pelo menos o Título ou Código para salvar o rascunho.');
    }

    if (missingFields.length > 0) {
      const errorMsg = `Preenchimento Incompleto!\n\nPor favor, preencha os seguintes campos:\n\n- ${missingFields.join('\n- ')}`;
      alert(errorMsg); 
      setError('Verifique os campos e tente novamente.');
      return;
    }

    setIsSubmitting(true);

    let targetId = devolvidoId || revisaoId || selectedDraftId;

    // Duplicate Check
    if (!targetId) {
      try {
        const checkRes = await fetchAPI(`/api/documentos?empresaId=${user?.empresaId}`);
        if (checkRes.ok) {
          const allDocs = await checkRes.json();
          const existingDoc = allDocs.find((d: any) => d.codigo.trim().toUpperCase() === codigo.trim().toUpperCase());
          if (existingDoc) {
            const wantsToReplace = window.confirm(`ATENÇÃO: O documento com o código "${codigo}" já existe no sistema (${existingDoc.titulo}).\n\nDeseja enviar esta nova versão para SUBSTITUIR o documento existente?`);
            if (!wantsToReplace) {
              setIsSubmitting(false);
              return;
            }
            targetId = existingDoc.id;
          }
        }
      } catch (err) {
        console.error("Erro ao verificar duplicidade", err);
      }
    }

    try {
      // 1. Fazer upload do arquivo real (reaproveitando a API de upload)
      let uploadData = null;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('empresa', user?.empresaId || 'ThinkDocs');
        formData.append('categoria', categoria);
        
        const uploadRes = await fetchAPI('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        uploadData = await uploadRes.json();
        
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Falha ao fazer upload do arquivo');
        }
      }

      // 2. Registrar no banco com status de workflow
      const endpoint = devolvidoId 
        ? `/api/documentos/${devolvidoId}/reenviar`
        : (targetId ? `/api/documentos/${targetId}` : '/api/documentos');
        
      const method = targetId ? 'PUT' : 'POST';

      const docRes = await fetchAPI(endpoint, {
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
          arquivo: uploadData?.filename || '', // Nome ou URL salvo
          empresaId: user?.empresaId,
          isDraft
        })
      });

      const docData = await docRes.json();

      if (docRes.ok) {
        setMessage(isDraft ? 'Rascunho salvo com sucesso!' : 'Documento enviado para aprovação com sucesso!');
        setCodigo('');
        setTitulo('');
        setFile(null);
        setDataAtualizacao('');
        setDataProximaAtualizacao('');
        setSelectedDraftId(null);
        
        // Reseta deixando todos os setores aplicáveis selecionados
        const OPTIONS_ALL = [
          "Recepção e Atendimento", "Coleta", "Triagem", "Bioquímica", 
          "Hematologia", "Imunologia", "Microbiologia", 
          "Urinálise", "Parasitologia",
          "Faturamento", "TI e Infraestrutura", "Área Técnica", 
          "Administrativo", "Diretoria", "Limpeza", "Geral"
        ];
        const userSetores = user?.setor?.split(',').map((s: string) => s.trim()) || [];
        const isLider = user?.funcao === 'Líder de Setor';
        const allowed = OPTIONS_ALL.filter(o => !isLider || o === 'Geral' || userSetores.includes(o));
        setSetoresSelecionados(allowed);

        setFileKey(Date.now());
        carregarRascunhos(user);
      } else {
        setError(`Erro: ${docData.error}. Detalhes: ${docData.details || 'Sem detalhes técnicos'}`);
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
    <button onClick={() => router.push('/')} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>← Voltar ao Dashboard</button>

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

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Formulário Principal */}
        <div style={{ flex: '1 1 600px', maxWidth: '800px' }}>
          <form onSubmit={(e) => handleSubmit(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Card 1: Informações Básicas */}
            <div className="card" style={{ padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📝</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Informações Básicas</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Código do Documento</label>
                  <input 
                    type="text" 
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ex: POP-001" 
                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)', outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Título</label>
                  <input 
                    type="text" 
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Procedimento Operacional Padrão" 
                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)', outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Título</label>
              <input 
                type="text" 
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Procedimento de Limpeza" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>

            {/* Card 2: Categorização e Acessos */}
            <div className="card" style={{ padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏷️</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Categorização e Acesso</h2>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Categoria</label>
                <select 
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#fff', outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
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
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Setores Aplicáveis (Clique para alternar)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[
                    "Geral", "Recepção e Atendimento", "Coleta", "Triagem", "Bioquímica", 
                    "Hematologia", "Imunologia", "Microbiologia", 
                    "Urinálise", "Parasitologia",
                    "Faturamento", "TI e Infraestrutura", "Área Técnica", 
                    "Administrativo", "Diretoria", "Limpeza"
                  ].map(opcao => {
                    const OPTIONS_ALL = [
                      "Recepção e Atendimento", "Coleta", "Triagem", "Bioquímica", 
                      "Hematologia", "Imunologia", "Microbiologia", 
                      "Urinálise", "Parasitologia",
                      "Faturamento", "TI e Infraestrutura", "Área Técnica", 
                      "Administrativo", "Diretoria", "Limpeza", "Geral"
                    ];
                    const userSetores = user?.setor?.split(',').map((s: string) => s.trim()) || [];
                    const isLider = user?.funcao === 'Líder de Setor';
                    const hasAccess = !isLider || opcao === 'Geral' || userSetores.includes(opcao);
                    
                    if (!hasAccess) return null;

                    const isChecked = setoresSelecionados.includes(opcao);

                    return (
                      <button
                        key={opcao}
                        type="button"
                        onClick={() => {
                          if (!isChecked) {
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
                              setSetoresSelecionados([]); 
                            } else {
                              setSetoresSelecionados(prev => prev.filter(s => s !== opcao));
                            }
                          }
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '999px',
                          border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: isChecked ? 'rgba(37,99,235,0.08)' : 'var(--color-surface-1)',
                          color: isChecked ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          fontSize: '0.85rem',
                          fontWeight: isChecked ? 700 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        {isChecked && (
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {opcao === "Geral" ? "🌐 Todos os Setores (Geral)" : opcao}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: Datas e Arquivo */}
            <div className="card" style={{ padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📅</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Vigência e Arquivo</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Data de Atualização (Vigência)</label>
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
                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#fff', outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Próxima Atualização (Vencimento)</label>
                  <input 
                    type="date" 
                    value={dataProximaAtualizacao}
                    onChange={(e) => setDataProximaAtualizacao(e.target.value)}
                    style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#fff', outline: 'none', transition: 'all 0.2s', fontSize: '0.95rem' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Arquivo do Documento</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    key={fileKey}
                    type="file" 
                    id="docUpload"
                    onChange={(e) => {
                      const selectedFile = e.target.files ? e.target.files[0] : null;
                      setFile(selectedFile);
                      if (selectedFile) {
                        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
                        const separatorRegex = /\s+[-–—]\s+/;
                        
                        if (separatorRegex.test(nameWithoutExt)) {
                          const parts = nameWithoutExt.split(separatorRegex);
                          const extractedCodigo = parts[0].trim();
                          const extractedTitulo = parts.slice(1).join(" - ").trim();
                          
                          if (extractedCodigo && extractedTitulo) {
                            setCodigo(extractedCodigo);
                            setTitulo(extractedTitulo);
                          }
                        }
                      }
                    }}
                    style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                  />
                  <div style={{ width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--color-border)', borderRadius: '12px', backgroundColor: file ? 'rgba(16,185,129,0.05)' : 'var(--color-surface-2)', transition: 'all 0.2s', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: file ? '#10b981' : '#9ca3af' }}>{file ? '📄' : '☁️'}</div>
                    <p style={{ fontWeight: 600, color: file ? '#10b981' : 'var(--color-text-primary)', margin: 0, fontSize: '1rem' }}>
                      {file ? file.name : 'Arraste ou clique para anexar o arquivo'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', margin: 0 }}>
                      Suporta PDF, DOCX, XLSX
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="animate-fade-in" style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.95rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>⚠️ {error}</div>}
            
            {message && (
              <div className="animate-fade-in" style={{ 
                color: devolvidoId && message.includes('Motivo da Devolução') ? '#991b1b' : '#166534', 
                fontWeight: 600, fontSize: '0.95rem', padding: '1rem', 
                backgroundColor: devolvidoId && message.includes('Motivo da Devolução') ? '#fef2f2' : '#f0fdf4', 
                borderRadius: '8px',
                border: devolvidoId && message.includes('Motivo da Devolução') ? '1px solid #fca5a5' : '1px solid #bbf7d0'
              }}>
                {!message.includes('Motivo da Devolução') && '✅ '}
                {message}
              </div>
            )}

            {/* Ações (Botões) */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingBottom: '3rem' }}>
              <button 
                type="button" 
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                style={{ 
                  flex: 1,
                  padding: '1rem', 
                  backgroundColor: 'white', 
                  color: 'var(--color-primary)', 
                  border: '2px solid var(--color-primary)', 
                  borderRadius: '10px', 
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => { if(!isSubmitting) e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.05)' }}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                {isSubmitting ? 'Salvando...' : '💾 Salvar Rascunho'}
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  flex: 1,
                  padding: '1rem', 
                  backgroundColor: 'var(--color-primary)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  fontSize: '1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.39)'
                }}
                onMouseOver={(e) => { if(!isSubmitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.45)'; } }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.39)'; }}
              >
                {isSubmitting ? 'Enviando...' : '🚀 Enviar para Aprovação'}
              </button>
            </div>

          </form>
        </div>

      {/* Barra Lateral: Lista de Rascunhos Salvos */}
      {!devolvidoId && !revisaoId && (
        <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
          <div className="card" style={{ padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', borderRadius: '12px', position: 'sticky', top: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>📂</div>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.125rem' }}>Rascunhos Salvos</h3>
            </div>
            
            {drafts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>Você não tem rascunhos em andamento.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {drafts.map((d: any) => (
                  <div 
                    key={d.id} 
                    style={{ 
                      padding: '1rem', 
                      backgroundColor: selectedDraftId === d.id ? 'var(--color-surface-2)' : '#fff', 
                      border: selectedDraftId === d.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: selectedDraftId === d.id ? '0 2px 8px rgba(37,99,235,0.1)' : 'none'
                    }}
                    onClick={() => carregarRascunhoParaForm(d)}
                    onMouseOver={(e) => { if(selectedDraftId !== d.id) e.currentTarget.style.borderColor = '#94a3b8' }}
                    onMouseOut={(e) => { if(selectedDraftId !== d.id) e.currentTarget.style.borderColor = 'var(--color-border)' }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>{d.codigo || 'Sem Código'}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{d.titulo || 'Sem Título'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Salvo em {new Date(d.dataEnvio).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
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
