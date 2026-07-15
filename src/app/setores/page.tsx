"use client";
import { fetchAPI } from '@/lib/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const TODOS_SETORES = [
  "Recepção e Atendimento", "Coleta", "Triagem", "Bioquímica", 
  "Hematologia", "Imunologia", "Microbiologia", 
  "Urinálise", "Parasitologia",
  "Qualidade", "Faturamento", "TI e Infraestrutura", "Área Técnica", 
  "Administrativo", "Diretoria", "Limpeza"
];

const ICONES_SETORES: Record<string, string> = {
  "Recepção e Atendimento": "🤝",
  "Coleta": "💉",
  "Triagem": "🔀",
  "Bioquímica": "🧪",
  "Hematologia": "🩸",
  "Imunologia": "🛡️",
  "Microbiologia": "🧫",
  "Urinálise": "💧",
  "Parasitologia": "🐛",
  "Qualidade": "⭐",
  "Faturamento": "💰",
  "TI e Infraestrutura": "💻",
  "Área Técnica": "⚙️",
  "Administrativo": "📁",
  "Diretoria": "👔",
  "Limpeza": "🧹",
  "Geral": "🏢"
};


export default function SetoresPage() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      const res = await fetchAPI(`/api/documentos?status=Vigente&empresaId=${userData.empresaId}&userFuncao=${encodeURIComponent(userData.funcao)}&userSetor=${encodeURIComponent(userData.setor)}`);
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data)) setDocumentos(data); else setDocumentos([]);
      }
    } catch (err) {
      console.error('Erro ao buscar documentos');
    } finally {
      setLoading(false);
    }
  };

  const setores = useMemo(() => {
    const counts: Record<string, number> = {};
    const isFullAccess = user && ['Diretor', 'Gestor da Qualidade', 'Administrador', 'Responsável Técnico'].includes(user.funcao);
    const userSetoresList = user ? (user.setor || '').split(',').map((s: string) => s.trim()) : [];
    
    const hasGeralAccess = userSetoresList.includes('Geral');
    
    // As pastas que o usuário pode ver
    const allowedSectors = (isFullAccess || hasGeralAccess) ? TODOS_SETORES : userSetoresList;

    documentos.forEach(doc => {
      const s = doc.setor;
      let setoresList = Array.isArray(s) ? s : (s ? [s] : ['Geral']);
      
      if (!setoresList.includes('Qualidade')) {
        setoresList = [...setoresList, 'Qualidade'];
      }
      
      if (setoresList.includes('Geral')) {
        // Documentos "Geral" entram em todas as pastas que o usuário tem acesso
        allowedSectors.forEach((setorNome: string) => {
          if (setorNome === 'Geral') return; // não cria uma pasta com nome Geral
          counts[setorNome] = (counts[setorNome] || 0) + 1;
        });
      } else {
        // Documentos específicos entram apenas nas pastas correspondentes
        setoresList.forEach(setorNome => {
          if (allowedSectors.includes(setorNome)) {
            counts[setorNome] = (counts[setorNome] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [documentos, user]);

  const filteredDocs = useMemo(() => {
    if (!selectedFolder) return [];
    
    let docs = documentos.filter(doc => {
      const s = doc.setor;
      let setoresList = Array.isArray(s) ? s : (s ? [s] : ['Geral']);
      
      if (!setoresList.includes('Qualidade')) {
        setoresList = [...setoresList, 'Qualidade'];
      }

      if (setoresList.includes('Geral')) return true;
      return setoresList.includes(selectedFolder);
    });

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      docs = docs.filter(doc => 
        (doc.codigo && doc.codigo.toLowerCase().includes(lowerTerm)) ||
        (doc.titulo && doc.titulo.toLowerCase().includes(lowerTerm)) ||
        (doc.categoria && doc.categoria.toLowerCase().includes(lowerTerm))
      );
    }

    return docs.sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''));
  }, [documentos, selectedFolder, searchTerm]);

  return (
    <div className="animate-fade-in">
    <button onClick={() => router.push('/')} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>← Voltar ao Dashboard</button>

      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-3xl font-bold">Setores</h1>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Navegue pelos documentos do sistema separados por área/setor de aplicação.</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando Pastas...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {setores.map(setor => (
              <div 
                key={setor.name} 
                onClick={() => setSelectedFolder(selectedFolder === setor.name ? null : setor.name)}
                style={{ 
                  backgroundColor: selectedFolder === setor.name ? 'var(--primary)' : 'var(--card)',
                  color: selectedFolder === setor.name ? 'white' : 'inherit',
                  padding: '1.5rem', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  boxShadow: selectedFolder === setor.name ? '0 10px 15px -3px rgba(37, 99, 235, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '2.5rem' }}>{ICONES_SETORES[setor.name] || '🏢'}</div>
                <div>
                  <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{setor.name}</h3>
                  <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{setor.count} documento(s)</p>
                </div>
              </div>
            ))}
            {setores.length === 0 && (
              <div style={{ padding: '2rem', color: 'var(--muted)', gridColumn: '1 / -1' }}>Nenhum setor com documentos vigentes no momento.</div>
            )}
          </div>

          {selectedFolder && (
            <div className="card animate-fade-in" style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 className="text-xl font-bold" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {ICONES_SETORES[selectedFolder] || '🏢'} Documentos em: {selectedFolder}
                </h2>
                <input 
                  type="text" 
                  placeholder="🔍 Pesquisar por código, título ou categoria..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: 'var(--radius)', 
                    border: '1px solid var(--border)', 
                    width: '100%', 
                    maxWidth: '400px' 
                  }}
                />
              </div>
              
              {filteredDocs.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem' }}>Código</th>
                      <th style={{ padding: '1rem' }}>Título</th>
                      <th style={{ padding: '1rem' }}>Categoria</th>
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
                        <td style={{ padding: '1rem' }}>{doc.categoria}</td>
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
