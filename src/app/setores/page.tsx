"use client";

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
      const res = await fetch(`/api/documentos?status=Vigente&empresaId=${userData.empresaId}&userFuncao=${encodeURIComponent(userData.funcao)}&userSetor=${encodeURIComponent(userData.setor)}`);
      const data = await res.json();
      if (res.ok) {
        setDocumentos(data);
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
