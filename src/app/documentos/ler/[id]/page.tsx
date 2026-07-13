"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function LerDocumento() {
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [leuDocumento, setLeuDocumento] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leituraConfirmada, setLeituraConfirmada] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('thinkdocs_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      carregarDocumento(parsedUser.empresaId, parsedUser.id);
    }
  }, [router, docId]);

  const carregarDocumento = async (empresaId: string, usuarioId: string) => {
    try {
      // Puxa todos os docs (na falta de um endpoint de doc unico simplificado)
      const res = await fetch(`/api/documentos?empresaId=${empresaId}`);
      const docs = await res.json();
      const currentDoc = docs.find((d: any) => d.id === docId);
      
      if (currentDoc) {
        setDoc(currentDoc);
        // Verifica se o usuario ja assinou essa versao
        verificarLeitura(empresaId, usuarioId, currentDoc.id, currentDoc.versao);
      } else {
        setMensagem('Documento não encontrado.');
      }
    } catch (err) {
      setMensagem('Erro ao buscar documento.');
    } finally {
      setLoading(false);
    }
  };

  const verificarLeitura = async (empresaId: string, usuarioId: string, documentoId: string, versao: string) => {
    try {
      const res = await fetch(`/api/leituras?empresaId=${empresaId}`);
      const leituras = await res.json();
      const jaLeu = leituras.find((l: any) => 
        l.usuarioId === usuarioId && 
        l.documentoId === documentoId && 
        l.documentoVersao === versao
      );
      if (jaLeu) {
        setLeituraConfirmada(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssinarTermo = async () => {
    if (!leuDocumento) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leituras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: user.empresaId,
          usuarioId: user.id,
          usuarioNome: user.nome,
          usuarioSetor: user.setor,
          documentoId: doc.id,
          documentoCodigo: doc.codigo,
          documentoTitulo: doc.titulo,
          documentoVersao: doc.versao
        })
      });
      if (res.ok) {
        setLeituraConfirmada(true);
        setMensagem('Leitura registrada com sucesso! Obrigado.');
      } else {
        setMensagem('Erro ao registrar leitura.');
      }
    } catch (error) {
      setMensagem('Erro de conexão ao salvar leitura.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando documento...</div>;
  if (!doc) return <div style={{ padding: '2rem' }}>{mensagem || 'Documento não encontrado'}</div>;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 className="text-2xl font-bold">{doc.codigo} - {doc.titulo}</h1>
          <p className="text-muted" style={{ marginTop: '0.2rem' }}>Versão atual: {doc.versao} | Categoria: {doc.categoria}</p>
        </div>
        <button onClick={() => router.back()} style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'white' }}>
          Voltar
        </button>
      </div>

      <div style={{ flex: 1, backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden', minHeight: '60vh', marginBottom: '1rem', border: '1px solid var(--border)' }}>
        {/* Usamos iframe apontando para a nossa API de download para renderizar o PDF direto na tela */}
        <iframe 
          src={`/api/download?empresa=${user.empresaId}&categoria=${doc.categoria}&file=${doc.arquivoUrl}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={doc.titulo}
        />
      </div>

      <div className="card" style={{ padding: '1.5rem', backgroundColor: leituraConfirmada ? '#f0fdf4' : 'white', borderColor: leituraConfirmada ? '#bbf7d0' : 'var(--border)' }}>
        {leituraConfirmada ? (
          <div style={{ textAlign: 'center', color: '#166534' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>✅ Leitura Confirmada</h3>
            <p>Você já confirmou a leitura e compreensão da <b>{doc.versao}</b> deste documento.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#15803d' }}>Sua assinatura eletrônica está registrada no sistema.</p>
            {mensagem && <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{mensagem}</p>}
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>Termo de Ciência e Treinamento</h3>
            
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <input 
                type="checkbox" 
                checked={leuDocumento} 
                onChange={(e) => setLeuDocumento(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem', marginTop: '0.2rem', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '1rem', lineHeight: '1.5', color: '#334155' }}>
                Declaro que realizei a leitura completa do documento <b>{doc.codigo} - {doc.titulo} (Versão {doc.versao})</b> e compreendi inteiramente os procedimentos e normas aqui descritos.
              </span>
            </label>

            <button 
              onClick={handleAssinarTermo}
              disabled={!leuDocumento || isSubmitting}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: !leuDocumento ? '#cbd5e1' : '#16a34a',
                color: !leuDocumento ? '#64748b' : 'white',
                cursor: !leuDocumento || isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {isSubmitting ? 'Registrando...' : 'Assinar Termo de Ciência Digital'}
            </button>
            {mensagem && <p style={{ marginTop: '1rem', color: '#dc2626', fontWeight: 'bold', textAlign: 'center' }}>{mensagem}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
