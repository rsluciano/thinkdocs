"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Devolvidos() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Auth Check Simples (Protótipo)
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
      const res = await fetch(`/api/documentos?status=Reprovado&empresaId=${empresaId}`);
      const data = await res.json();
      if (res.ok) {
        setDocumentos(data);
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
      const res = await fetch(`/api/documentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocumentos((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert('Falha ao excluir documento.');
      }
    } catch (err) {
      alert('Erro de conexão ao excluir.');
    }
  };

  // Função para calcular o status e a cor com base na data de validade
  const getStatusInfo = (validadeStr: string | null) => {
    if (!validadeStr) return { label: 'Sem Validade', bg: '#f1f5f9', text: '#475569' };

    let validade: Date;
    // Tenta fazer parse se for string ISO ou DD/MM/YYYY
    if (validadeStr.includes('T')) {
      validade = new Date(validadeStr);
    } else {
      validade = new Date(validadeStr.split('/').reverse().join('-'));
    }
    
    const hoje = new Date();
    
    // Zera as horas para comparar apenas os dias
    validade.setHours(0, 0, 0, 0);
    hoje.setHours(0, 0, 0, 0);
    
    const diffTime = validade.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) return { label: 'Em Uso', bg: '#dcfce7', text: '#166534' }; // Verde
    if (diffDays > 15 && diffDays <= 30) return { label: 'Vence em 30 dias', bg: '#dbeafe', text: '#1e40af' }; // Azul
    if (diffDays > 7 && diffDays <= 15) return { label: 'Vence em 15 dias', bg: '#fef9c3', text: '#854d0e' }; // Amarelo
    if (diffDays > 3 && diffDays <= 7) return { label: 'Vence em 7 dias', bg: '#ffedd5', text: '#9a3412' }; // Laranja
    if (diffDays >= 0 && diffDays <= 3) return { label: 'Vence em 3 dias', bg: '#fee2e2', text: '#991b1b' }; // Vermelho
    return { label: 'Vencido', bg: '#fee2e2', text: '#991b1b' }; // Vermelho (Vencido)
  };

  return (
    <div className="animate-fade-in">
    <button onClick={() => router.push('/')} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}>← Voltar ao Dashboard</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-3xl font-bold">Documentos Devolvidos</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>Documentos reprovados aguardando correção técnica.</p>
        </div>
        <Link 
          href="/elaboracao"
          style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Enviar Novo Documento
        </Link>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando Devolvidos...</div>
        ) : documentos.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Nenhum documento reprovado encontrado.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>Código</th>
                <th style={{ padding: '1rem' }}>Título</th>
                <th style={{ padding: '1rem' }}>Categoria</th>
                <th style={{ padding: '1rem' }}>Revisão</th>
                <th style={{ padding: '1rem' }}>Datas</th>
                <th style={{ padding: '1rem' }}>Motivo da Reprovação</th>
                <th style={{ padding: '1rem' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map(doc => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{doc.codigo}</td>
                  <td style={{ padding: '1rem' }}>{doc.titulo}</td>
                  <td style={{ padding: '1rem' }}>{doc.categoria}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>v{doc.revisao}</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 'bold' }}>Vigência:</span> {doc.dataAtualizacao ? new Date(doc.dataAtualizacao).toLocaleDateString('pt-BR') : 'N/D'}
                    </div>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>Vencimento:</span> {doc.dataVencimento ? new Date(doc.dataVencimento).toLocaleDateString('pt-BR') : 'N/D'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ 
                      padding: '0.75rem', 
                      backgroundColor: '#fef2f2', 
                      color: '#991b1b', 
                      borderLeft: '4px solid #dc2626',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      maxWidth: '300px',
                      wordWrap: 'break-word'
                    }}>
                      {doc.motivoReprovacao || 'Nenhum motivo informado.'}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link 
                        href={`/elaboracao?devolvidoId=${doc.id}`}
                        style={{ padding: '0.4rem 0.8rem', textDecoration: 'none', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        ✏️ Corrigir
                      </Link>
                      <button 
                        onClick={() => excluirDocumento(doc.id)} 
                        style={{ padding: '0.4rem 0.8rem', backgroundColor: 'white', color: '#dc2626', border: '1px solid #dc2626', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
