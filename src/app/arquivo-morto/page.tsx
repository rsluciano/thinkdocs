"use client";
import { fetchAPI } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ArquivoMorto() {
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
      setUser(parsedUser);
      carregarDocumentos(parsedUser);
    }
  }, [router]);

  const carregarDocumentos = async (userData: any) => {
    try {
      const res = await fetchAPI(`/api/documentos?status=Obsoleto,Substituído&empresaId=${userData.empresaId}&userFuncao=${encodeURIComponent(userData.funcao)}&userSetor=${encodeURIComponent(userData.setor)}`);
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data)) setDocumentos(data); else setDocumentos([]);
      }
    } catch (err) {
      console.error('Erro ao buscar Arquivo Morto');
    } finally {
      setLoading(false);
    }
  };

  // Gráfico de documentos por ano
  const docsPorAno = documentos.reduce((acc, doc) => {
    // Tenta usar dataObsoletado, se não tiver, cai pra dataVencimento, se não, 'N/D'
    let dataRef = doc.dataObsoletado || doc.dataVencimento;
    let ano = 'Desconhecido';
    if (dataRef) {
      // Pode vir no formato DD/MM/YYYY ou ISO (YYYY-MM-DD...)
      if (dataRef.includes('/')) {
        ano = dataRef.split('/')[2].split(' ')[0];
      } else {
        ano = new Date(dataRef).getFullYear().toString();
      }
    }
    acc[ano] = (acc[ano] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(docsPorAno)
    .filter(ano => ano !== 'NaN' && ano !== 'Desconhecido')
    .sort((a, b) => b.localeCompare(a))
    .map(ano => ({
      ano,
      count: docsPorAno[ano],
      percent: documentos.length > 0 ? ((docsPorAno[ano] / documentos.length) * 100).toFixed(1) : '0'
    }));


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
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🗄️</div>
          <div>
            <h1 className="text-3xl font-bold" style={{ margin: 0 }}>Arquivo Morto (Histórico)</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.2rem', fontSize: '1.05rem', margin: 0 }}>Visualizando o histórico de documentos obsoletos que já foram substituídos.</p>
          </div>
        </div>
      </div>

      {!loading && documentos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Arquivado</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em' }}>{documentos.length}</div>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>Documentos substituídos ou obsoletos.</p>
          </div>

          <div className="card" style={{ padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid var(--color-border)', borderRadius: '12px', backgroundColor: '#fff' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Volume Arquivado por Ano
            </h2>
            {chartData.length === 0 ? (
               <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Gráfico indisponível (falta de datas).</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {chartData.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>Ano {d.ano}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{d.count}</span>
                        <span style={{ backgroundColor: '#F1F5F9', color: '#0F172A', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{d.percent}%</span>
                      </div>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#F1F5F9', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${d.percent}%`, backgroundColor: '#94A3B8', borderRadius: '999px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid rgba(37,99,235,0.2)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
            <div>Carregando Histórico...</div>
          </div>
        ) : documentos.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-surface-1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Arquivo vazio</h2>
            <p style={{ marginTop: '0.5rem' }}>Nenhum documento obsoleto encontrado no histórico.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#fff' }}>
              <thead style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identificação</th>
                  <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datas de Validade</th>
                  <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Responsáveis</th>
                  <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Atual</th>
                  <th style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--color-text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc, i) => (
                  <tr key={doc.id} style={{ borderBottom: i === documentos.length - 1 ? 'none' : '1px solid var(--color-border)', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-1)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1.5rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem' }}>{doc.codigo}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'var(--color-surface-3)', padding: '0.1rem 0.5rem', borderRadius: '4px', color: 'var(--color-text-primary)' }}>v{doc.revisao}</span>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '1.1rem', marginBottom: '0.3rem' }}>{doc.titulo}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {doc.categoria}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem', verticalAlign: 'middle', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <strong>Início:</strong> {doc.dataAtualizacao ? new Date(doc.dataAtualizacao).toLocaleDateString('pt-BR') : 'N/D'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <strong>Fim:</strong> {doc.dataVencimento ? new Date(doc.dataVencimento).toLocaleDateString('pt-BR') : 'N/D'}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem', verticalAlign: 'middle', fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.3rem', color: 'var(--color-text-primary)' }}>
                        <strong>Autor:</strong> {doc.autor}
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>
                        <strong>Aprovador:</strong> {doc.aprovadoPor || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '1.5rem', verticalAlign: 'middle' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '999px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        backgroundColor: doc.status === 'Substituído' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(71, 85, 105, 0.1)',
                        color: doc.status === 'Substituído' ? '#2563eb' : '#475569',
                        border: doc.status === 'Substituído' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(71, 85, 105, 0.2)'
                      }}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '1.5rem', verticalAlign: 'middle', textAlign: 'right' }}>
                      <a 
                        href={`/api/download?empresa=${user?.empresaId}&categoria=${doc.categoria}&file=${doc.arquivoUrl}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', textDecoration: 'none', backgroundColor: 'var(--color-surface-2)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-3)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-2)'; }}
                      >
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Ver Documento
                      </a>
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
