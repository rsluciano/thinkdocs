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
    let missingFields = [];
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

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '1', maxWidth: '600px' }}>
          <h2 className="text-xl font-bold" style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
            {devolvidoId ? 'Reenviar Documento' : (revisaoId ? 'Enviar Nova Versão' : (selectedDraftId ? 'Continuar Rascunho' : 'Enviar Novo Rascunho'))}
          </h2>

          <form onSubmit={(e) => handleSubmit(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Código do Documento</label>
              <input 
                type="text" 
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: POP-001" 
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
                "Faturamento", "TI e Infraestrutura", "Área Técnica", 
                "Administrativo", "Diretoria", "Limpeza", "Geral"
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

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting}
              style={{ 
                flex: 1,
                padding: '0.75rem', 
                backgroundColor: 'white', 
                color: 'var(--primary)', 
                border: '1px solid var(--primary)', 
                borderRadius: 'var(--radius)', 
                fontWeight: 'bold', 
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Rascunho'}
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ 
                flex: 1,
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
          </div>
        </form>
      </div>

      {/* Lista de Rascunhos Salvos */}
      {!devolvidoId && !revisaoId && (
        <div style={{ flex: '1', maxWidth: '400px' }}>
          <div className="card" style={{ backgroundColor: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>Meus Rascunhos Salvos</h3>
            {drafts.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Você não tem rascunhos em andamento.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {drafts.map((d: any) => (
                  <div 
                    key={d.id} 
                    style={{ 
                      padding: '1rem', 
                      backgroundColor: 'white', 
                      border: '1px solid var(--border)', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      borderLeft: selectedDraftId === d.id ? '4px solid var(--primary)' : '1px solid var(--border)'
                    }}
                    onClick={() => carregarRascunhoParaForm(d)}
                  >
                    <div style={{ fontWeight: 'bold' }}>{d.codigo || 'Sem Código'}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>{d.titulo || 'Sem Título'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>Salvo em {new Date(d.dataEnvio).toLocaleDateString()}</div>
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
