"use client";
import { fetchAPI } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Aprovacoes() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('thinkdocs_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (!['Diretor', 'Gestor da Qualidade', 'Administrador'].includes(parsedUser.funcao)) {
        router.push('/');
      } else {
        carregarDocumentos(parsedUser.empresaId);
      }
    }
  }, [router]);

  const carregarDocumentos = async (empresaId: string) => {
    try {
      const res = await fetchAPI(`/api/documentos?status=Aguardando Aprovação&empresaId=${empresaId}`);
      const data = await res.json();
      if (res.ok) {
        const sortedData = data.sort((a: any, b: any) => new Date(a.dataEnvio).getTime() - new Date(b.dataEnvio).getTime());
        setDocumentos(sortedData);
      }
    } catch (err) {
      console.error('Erro ao buscar documentos');
    } finally {
      setLoading(false);
    }
  };

  const avaliarDocumento = async (id: string, status: 'Vigente' | 'Reprovado') => {
    let motivoReprovacao = undefined;

    if (status === 'Reprovado') {
      const motivo = window.prompt('Qual o motivo da reprovação? (Isso será mostrado ao autor)');
      if (motivo === null) return;
      if (motivo.trim() === '') {
        alert('O motivo é obrigatório para devolver um documento.');
        return;
      }
      motivoReprovacao = motivo;
    }

    try {
      const res = await fetchAPI(`/api/documentos/${id}/avaliar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, aprovadorNome: user.nome, motivoReprovacao })
      });

      if (res.ok) {
        setDocumentos((prev) => prev.filter((d) => d.id !== id));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`NOVO ERRO AVALIACAO: ${errData.details || errData.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  };

  const excluirDocumento = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento permanentemente? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      const res = await fetchAPI(`/api/documentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocumentos((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert('Falha ao excluir documento.');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir.');
    }
  };

  if (!user || loading) return <div style={{ padding: '2rem' }}>Carregando fila de aprovações...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <button onClick={() => router.push('/')} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.95rem' }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar ao Dashboard
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37,99,235,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📥</div>
        <h1 className="text-3xl font-bold" style={{ margin: 0 }}>Caixa de Entrada (Aprovações)</h1>
      </div>
      
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
        Analise os documentos enviados pela equipe e defina se estão prontos para a Lista Mestra.
      </p>

      {documentos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)', border: '2px dashed var(--color-border)', borderRadius: '16px', boxShadow: 'none', backgroundColor: 'var(--color-surface-2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Tudo limpo!</h2>
          <p style={{ fontSize: '1.05rem' }}>Não há nenhum documento aguardando sua aprovação no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {documentos.map((doc) => (
            <div 
              key={doc.id} 
              className="card" 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                transition: 'all 0.2s',
                backgroundColor: '#fff'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.03)'; }}
            >
              <div style={{ flex: 1, paddingRight: '2rem' }}>
                <span style={{ display: 'inline-block', fontSize: '0.8rem', fontWeight: 700, color: '#b45309', backgroundColor: '#fef3c7', padding: '0.3rem 0.75rem', borderRadius: '999px', marginBottom: '0.75rem' }}>
                  ⏳ {doc.status}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>
                  <span style={{ color: 'var(--color-primary)' }}>{doc.codigo}</span> - {doc.titulo}
                </h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <strong>Autor:</strong> {doc.autor}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <strong>Setor:</strong> {Array.isArray(doc.setor) ? doc.setor.join(', ') : doc.setor}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    <strong>Categoria:</strong> {doc.categoria}
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <a 
                    href={`/api/download?empresa=${user.empresaId}&categoria=${doc.categoria}&file=${doc.arquivoUrl}`} 
                    target="_blank"
                    style={{ 
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
                      backgroundColor: 'rgba(37,99,235,0.08)', padding: '0.6rem 1.2rem', borderRadius: '8px', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.08)'}
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Visualizar PDF Original
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column', minWidth: '240px' }}>
                <button 
                  onClick={() => avaliarDocumento(doc.id, 'Vigente')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(16,185,129,0.3)' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#059669'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#10b981'; e.currentTarget.style.transform = 'none'; }}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  Aprovar e Publicar
                </button>
                <button 
                  onClick={() => avaliarDocumento(doc.id, 'Reprovado')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: 'white', color: '#f59e0b', border: '2px solid #f59e0b', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fffbeb'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  Devolver (Reprovar)
                </button>
                <button 
                  onClick={() => excluirDocumento(doc.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: 'white', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginTop: '0.5rem' }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Excluir Documento
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
