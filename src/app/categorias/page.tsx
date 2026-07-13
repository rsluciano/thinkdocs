"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';


const ICONES_CATEGORIAS: Record<string, string> = {
  "Formulários": "📝",
  "Bulário": "💊",
  "FISPQs": "☣️",
  "Instruções de Trabalho de serviço": "📋",
  "Instruções de Trabalho de equipamento": "⚙️",
  "Instruções de Trabalho de exames": "🔬",
  "Manuais": "📖",
  "Documentos Mestres": "👑",
  "Procedimentos da Qualidade": "🛡️",
  "Listas": "🧾",
  "Geral": "📁"
};

export default function CategoriasPage() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

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
      const res = await fetch(`/api/documentos?status=Vigente&empresaId=${userData.empresaId}&userFuncao=${encodeURIComponent(userData.funcao)}&userSetor=${encodeURIComponent(userData.setor)}`);
      const data = await res.json();
      if (res.ok) {
        setDocumentos(data);
      }
    } catch (err) {
      console.error('Erro ao buscar Lista Mestra');
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    documentos.forEach(doc => {
      const cat = doc.categoria || 'Geral';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [documentos]);

  const filteredDocs = useMemo(() => {
    if (!selectedFolder) return [];
    return documentos.filter(doc => (doc.categoria || 'Geral') === selectedFolder);
  }, [documentos, selectedFolder]);

  return (
    <div className="animate-fade-in">
    <button onClick={() => router.push('/')} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>← Voltar ao Dashboard</button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-3xl font-bold">Categoria de Docs</h1>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Navegue pelos documentos do sistema através de suas categorias.</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando Pastas...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {categories.map(cat => (
              <div 
                key={cat.name} 
                onClick={() => setSelectedFolder(selectedFolder === cat.name ? null : cat.name)}
                style={{ 
                  backgroundColor: selectedFolder === cat.name ? 'var(--primary)' : 'var(--card)',
                  color: selectedFolder === cat.name ? 'white' : 'inherit',
                  padding: '1.5rem', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: selectedFolder === cat.name ? '0 10px 15px -3px rgba(37, 99, 235, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '2.5rem' }}>{ICONES_CATEGORIAS[cat.name] || '📁'}</div>
                <div>
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{cat.name}</h3>
                  <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{cat.count} documento(s)</p>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div style={{ padding: '2rem', color: 'var(--muted)', gridColumn: '1 / -1' }}>Nenhuma categoria com documentos vigentes no momento.</div>
            )}
          </div>

          {selectedFolder && (
            <div className="card animate-fade-in" style={{ overflowX: 'auto' }}>
              <h2 className="text-xl font-bold" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {ICONES_CATEGORIAS[selectedFolder] || '📂'} Documentos em: {selectedFolder}
              </h2>
              {filteredDocs.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem' }}>Código</th>
                      <th style={{ padding: '1rem' }}>Título</th>
                      <th style={{ padding: '1rem' }}>Setor</th>
                      <th style={{ padding: '1rem' }}>Revisão</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                      <th style={{ padding: '1rem' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>{doc.codigo}</td>
                        <td style={{ padding: '1rem' }}>{doc.titulo}</td>
                        <td style={{ padding: '1rem' }}>{Array.isArray(doc.setor) ? doc.setor.join(', ') : doc.setor}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>v{doc.revisao}</td>
                        <td style={{ padding: '1rem' }}>Vigente</td>
                        <td style={{ padding: '1rem' }}>
                          <a href={`/documentos/ler/${doc.id}`} style={{ padding: '0.4rem 0.8rem', textDecoration: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Ler Documento
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '1rem', color: 'var(--muted)' }}>Nenhum documento nesta pasta.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
