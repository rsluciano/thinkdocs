"use client";
import { fetchAPI } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Devolvidos() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

      setUser(parsedUser);
      carregarDocumentos(parsedUser.empresaId);
    }
  }, [router]);

  const carregarDocumentos = async (empresaId: string) => {
    try {
      const res = await fetchAPI(`/api/documentos?status=Reprovado&empresaId=${empresaId}`);
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data)) setDocumentos(data); else setDocumentos([]);
      }
    } catch (err) {
      console.error('Erro ao buscar Documentos Devolvidos');
    } finally {
      setLoading(false);
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

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <button onClick={() => router.push('/')} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: '0.95rem' }}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar ao Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🔄</div>
          <div>
            <h1 className="text-3xl font-bold" style={{ margin: 0 }}>Documentos Devolvidos</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.2rem', fontSize: '1.05rem', margin: 0 }}>Documentos reprovados aguardando correção técnica.</p>
          </div>
        </div>
        <Link 
          href="/elaboracao"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-primary)', color: 'white', textDecoration: 'none', borderRadius: '999px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.4)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.3)'; }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Enviar Novo Documento
        </Link>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid rgba(37,99,235,0.2)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
            <div>Carregando Devolvidos...</div>
          </div>
        ) : documentos.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Sem pendências</h2>
            <p style={{ marginTop: '0.5rem' }}>Nenhum documento reprovado encontrado.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#fff' }}>
              <thead style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identificação</th>
                  <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datas</th>
                  <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motivo da Reprovação</th>
                  <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc, i) => (
                  <tr key={doc.id} style={{ borderBottom: i === documentos.length - 1 ? 'none' : '1px solid var(--color-border)', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-1)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.5rem', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem' }}>{doc.codigo}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'var(--color-surface-3)', padding: '0.1rem 0.5rem', borderRadius: '4px', color: 'var(--color-text-primary)' }}>v{doc.revisao}</span>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{doc.titulo}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> {doc.categoria}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem', verticalAlign: 'top', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#10b981' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <strong>Vigência:</strong> {doc.dataAtualizacao ? new Date(doc.dataAtualizacao).toLocaleDateString('pt-BR') : 'N/D'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#f59e0b' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <strong>Vencimento:</strong> {doc.dataVencimento ? new Date(doc.dataVencimento).toLocaleDateString('pt-BR') : 'N/D'}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem', verticalAlign: 'top' }}>
                      <div style={{ 
                        padding: '1rem', 
                        backgroundColor: '#fef2f2', 
                        color: '#991b1b', 
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        maxWidth: '350px',
                        wordWrap: 'break-word',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start'
                      }}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginTop: '0.1rem', flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div style={{ lineHeight: 1.4 }}>
                          <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Motivo:</strong>
                          {doc.motivoReprovacao || 'Nenhum motivo informado.'}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem', verticalAlign: 'top', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Link 
                          href={`/elaboracao?devolvidoId=${doc.id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', textDecoration: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'none'; }}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Corrigir
                        </Link>
                        <button 
                          onClick={() => excluirDocumento(doc.id)} 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', backgroundColor: 'white', color: '#dc2626', border: '1px solid #dc2626', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
