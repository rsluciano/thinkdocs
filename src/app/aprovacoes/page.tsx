"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
      // Simulação: Só Gestores, Diretores ou Administradores podem acessar a caixa de entrada
      if (!['Diretor', 'Gestor da Qualidade', 'Administrador'].includes(parsedUser.funcao)) {
        router.push('/');
      } else {
        carregarDocumentos(parsedUser.empresaId);
      }
    }
  }, [router]);

  const carregarDocumentos = async (empresaId: string) => {
    try {
      const res = await fetch(`/api/documentos?status=Aguardando Aprovação&empresaId=${empresaId}`);
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
      if (motivo === null) return; // Clicou em cancelar
      if (motivo.trim() === '') {
        alert('O motivo é obrigatório para devolver um documento.');
        return;
      }
      motivoReprovacao = motivo;
    }

    try {
      const res = await fetch(`/api/documentos/${id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, aprovadorNome: user.nome, motivoReprovacao })
      });

      if (res.ok) {
        // Remove da lista atual
        setDocumentos((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert('Falha ao processar avaliação.');
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

  if (!user || loading) return <div style={{ padding: '2rem' }}>Carregando fila de aprovações...</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold" style={{ marginBottom: '0.5rem' }}>Caixa de Entrada (Aprovações)</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        Analise os documentos enviados pela equipe e defina se estão prontos para a Lista Mestra.
      </p>

      {documentos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Tudo limpo! 🎉</h2>
          <p>Não há nenhum documento aguardando sua aprovação no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {documentos.map((doc) => (
            <div key={doc.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#b45309', backgroundColor: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {doc.status}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                  {doc.codigo} - {doc.titulo}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                  Enviado por <strong>{doc.autor}</strong> ({Array.isArray(doc.setor) ? doc.setor.join(', ') : doc.setor}) &nbsp;&nbsp;|&nbsp;&nbsp; Categoria: {doc.categoria}
                </p>
                <div style={{ marginTop: '0.8rem' }}>
                  <a 
                    href={`/api/download?empresa=${user.empresaId}&categoria=${doc.categoria}&file=${doc.arquivoUrl}`} 
                    target="_blank"
                    style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', textDecoration: 'underline' }}
                  >
                    Visualizar PDF
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <button 
                  onClick={() => avaliarDocumento(doc.id, 'Vigente')}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ✅ Aprovar e Publicar
                </button>
                <button 
                  onClick={() => avaliarDocumento(doc.id, 'Reprovado')}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ❌ Reprovar (Devolver)
                </button>
                <button 
                  onClick={() => excluirDocumento(doc.id)}
                  style={{ padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
