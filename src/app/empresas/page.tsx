"use client";
import { fetchAPI } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MeusLaboratorios() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (!userStr) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(userStr);
      // Permite o acesso para Administrador e Consultor Master
      if (!['Administrador', 'Consultor Master'].includes(parsedUser.funcao)) {
        router.push('/');
      } else {
        setUser(parsedUser);
      }
    }
  }, [router]);

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let finalLogoUrl = '';

      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('empresa', nomeEmpresa);
        formData.append('categoria', 'Logos');

        const uploadRes = await fetchAPI('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          finalLogoUrl = uploadData.url;
        }
      }

      const res = await fetchAPI('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome: nomeEmpresa, 
          logoUrl: finalLogoUrl,
          adminId: user.id,
          originalEmpresaId: user.empresaId,
          originalEmpresaNome: user.empresaNome
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Laboratório criado com sucesso! Alternando contexto...');
        
        // Atualiza a sessão com a nova lista de empresas e troca para o novo lab
        const updatedUser = { ...user };
        updatedUser.empresasPermitidas = data.empresasPermitidas;
        updatedUser.empresaId = data.empresa.id;
        updatedUser.empresaNome = data.empresa.nome;
        updatedUser.empresaLogo = data.empresa.logoUrl;

        localStorage.setItem('thinkdocs_user', JSON.stringify(updatedUser));
        
        // Redireciona para o Dashboard do novo lab
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);

      } else {
        setError(data.error || 'Erro ao criar laboratório');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#0F172A', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      <style dangerouslySetInnerHTML={{__html: `
        .saas-card {
          background-color: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          transition: all 0.2s ease;
          overflow: hidden;
        }
        .saas-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid #CBD5E1;
          color: #0F172A;
          font-size: 0.875rem;
          transition: all 0.2s;
          background-color: #F8FAFC;
        }
        .saas-input:focus {
          outline: none;
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background-color: #FFFFFF;
        }
        .saas-btn {
          padding: 0.75rem 1.5rem;
          background-color: #0F172A;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .saas-btn:hover:not(:disabled) {
          background-color: #1E293B;
          transform: translateY(-1px);
        }
        .saas-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .lab-row {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background-color 0.2s;
        }
        .lab-row:last-child {
          border-bottom: none;
        }
        .lab-row:hover {
          background-color: #F8FAFC;
        }
      `}} />

      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>Meus Laboratórios</h1>
        <p style={{ color: '#64748B', margin: 0, fontSize: '0.95rem' }}>
          Gerencie e navegue entre os laboratórios vinculados ao seu acesso ({user.funcao}).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem' }}>
        
        {/* Painel de Criação */}
        <div>
          <div className="saas-card">
            <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Cadastrar Novo Laboratório
              </h2>
            </div>
            
            <form onSubmit={handleCadastrar} style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Nome da Instituição</label>
                <input 
                  type="text" 
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  placeholder="Ex: ThinkDocs Centro Médico" 
                  required 
                  className="saas-input"
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Logotipo (Opcional)</label>
                <div style={{ 
                  border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '1rem', 
                  backgroundColor: '#F8FAFC', textAlign: 'center', cursor: 'pointer',
                  position: 'relative', overflow: 'hidden'
                }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth={2} style={{ margin: '0 auto 0.5rem auto' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
                    {logoFile ? logoFile.name : 'Clique ou arraste a imagem aqui'}
                  </span>
                </div>
              </div>

              {error && (
                <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', borderLeft: '4px solid #EF4444', borderRadius: '4px', fontSize: '0.85rem', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', backgroundColor: '#F0FDF4', borderLeft: '4px solid #10B981', borderRadius: '4px', fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  {success}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="saas-btn" style={{ width: '100%' }}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Configurando Ambiente...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Criar Laboratório
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Laboratórios */}
        <div>
          <div className="saas-card">
            <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Ambientes Vinculados
              </h2>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {(!user.empresasPermitidas || user.empresasPermitidas.length === 0) ? (
                <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>Apenas Ambiente Principal</h4>
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>Você ainda não criou ou foi vinculado a laboratórios secundários.</p>
                </div>
              ) : (
                user.empresasPermitidas.map((emp: any) => (
                  <div key={emp.id} className="lab-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {emp.logoUrl ? (
                          <img src={emp.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>
                        )}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0F172A', fontWeight: 600 }}>{emp.nome}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>ID: {emp.id.replace('emp_', '')}</span>
                      </div>
                    </div>

                    {user.empresaId === emp.id ? (
                      <span style={{ padding: '0.3rem 0.6rem', backgroundColor: '#ECFDF5', color: '#059669', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                        Sessão Ativa
                      </span>
                    ) : (
                      <button 
                        onClick={() => {
                          const updatedUser = { ...user, empresaId: emp.id, empresaNome: emp.nome, empresaLogo: emp.logoUrl || '' };
                          localStorage.setItem('thinkdocs_user', JSON.stringify(updatedUser));
                          window.location.href = '/';
                        }}
                        style={{ 
                          padding: '0.4rem 0.8rem', backgroundColor: '#FFFFFF', color: '#0F172A', 
                          border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', 
                          fontWeight: 500, fontSize: '0.8rem', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                      >
                        Acessar
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
