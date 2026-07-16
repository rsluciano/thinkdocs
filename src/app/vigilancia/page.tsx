"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VigilanciaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [requisitos, setRequisitos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalNovo, setModalNovo] = useState(false);
  const [novoRequisito, setNovoRequisito] = useState({ norma: 'RDC 978/2025', artigo: '', descricao: '' });

  const [modalVincular, setModalVincular] = useState({ isOpen: false, requisitoId: '' });
  const [documentosVigentes, setDocumentosVigentes] = useState<any[]>([]);
  const [buscaDoc, setBuscaDoc] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (!userStr) {
      router.push('/login');
    } else {
      const u = JSON.parse(userStr);
      setUser(u);
      carregarRequisitos(u);
      carregarDocumentosVigentes(u);
    }
  }, [router]);

  const carregarRequisitos = async (u: any) => {
    try {
      const res = await fetch(`/api/vigilancia/requisitos?empresaId=${u.empresaId}`, {
        headers: { 'Authorization': `Bearer ${u.token}` }
      });
      if (res.ok) {
        setRequisitos(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const carregarDocumentosVigentes = async (u: any) => {
    try {
      const res = await fetch(`/api/documentos?status=Vigente&empresaId=${u.empresaId}`, {
        headers: { 'Authorization': `Bearer ${u.token}` }
      });
      if (res.ok) {
        setDocumentosVigentes(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSalvarRequisito = async () => {
    if (!novoRequisito.artigo || !novoRequisito.descricao) {
      alert("Preencha o artigo e a descrição.");
      return;
    }
    try {
      const res = await fetch('/api/vigilancia/requisitos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ ...novoRequisito, empresaId: user.empresaId })
      });
      if (res.ok) {
        setModalNovo(false);
        setNovoRequisito({ norma: 'RDC 978/2025', artigo: '', descricao: '' });
        carregarRequisitos(user);
      } else {
        alert("Erro ao salvar.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExcluirRequisito = async (id: string) => {
    if (!confirm("Excluir este requisito? Os documentos associados não serão excluídos do sistema.")) return;
    try {
      await fetch(`/api/vigilancia/requisitos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      carregarRequisitos(user);
    } catch (e) {
      console.error(e);
    }
  };

  const handleVincularDocumento = async (documentoId: string) => {
    try {
      const res = await fetch(`/api/vigilancia/requisitos/${modalVincular.requisitoId}/vincular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ documentoId })
      });
      if (res.ok) {
        setModalVincular({ isOpen: false, requisitoId: '' });
        setBuscaDoc('');
        carregarRequisitos(user);
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao vincular.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDesvincularDocumento = async (requisitoId: string, documentoId: string) => {
    if (!confirm("Remover este documento do requisito?")) return;
    try {
      await fetch(`/api/vigilancia/requisitos/${requisitoId}/vincular?documentoId=${documentoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      carregarRequisitos(user);
    } catch (e) {
      console.error(e);
    }
  };

  const docsFiltrados = documentosVigentes.filter(d => 
    d.codigo.toLowerCase().includes(buscaDoc.toLowerCase()) || 
    d.titulo.toLowerCase().includes(buscaDoc.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: 'var(--primary)' }}>🛡️ Vigilância Sanitária</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Mapeamento de Requisitos Normativos (Ex: RDC 978)</p>
        </div>
        <button 
          onClick={() => setModalNovo(true)}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Adicionar Exigência
        </button>
      </div>

      {loading ? (
        <p>Carregando requisitos...</p>
      ) : requisitos.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--border)' }}>
          <h3 style={{ margin: 0, color: 'var(--muted)' }}>Nenhum requisito cadastrado ainda.</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Clique no botão acima para adicionar artigos da RDC 978.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {requisitos.map(req => (
            <div key={req.id} style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'inline-block', backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {req.norma}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--foreground)' }}>{req.artigo}</h3>
                  <p style={{ marginTop: '0.5rem', color: '#475569', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{req.descricao}</p>
                </div>
                <div>
                  <button onClick={() => handleExcluirRequisito(req.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                </div>
              </div>

              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--primary)' }}>Documentos Vinculados ({req.documentos.length})</h4>
                  <button 
                    onClick={() => setModalVincular({ isOpen: true, requisitoId: req.id })}
                    style={{ padding: '0.4rem 0.8rem', backgroundColor: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    + Vincular Documento
                  </button>
                </div>

                {req.documentos.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Nenhum documento vinculado a esta exigência.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {req.documentos.map((docReq: any) => (
                      <div key={docReq.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                        <a href={`/documentos/ler/${docReq.documento.id}`} style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 'bold' }}>
                          📄 {docReq.documento.codigo} - {docReq.documento.titulo}
                        </a>
                        <button 
                          onClick={() => handleDesvincularDocumento(req.id, docReq.documento.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '0.5rem' }}
                          title="Desvincular"
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL ADICIONAR REQUISITO */}
      {modalNovo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Nova Exigência Normativa</h3>
            
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Norma</label>
            <input 
              type="text" 
              value={novoRequisito.norma} 
              onChange={e => setNovoRequisito({...novoRequisito, norma: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: '4px' }}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Artigo / Item</label>
            <input 
              type="text" 
              placeholder="Ex: Art. 126"
              value={novoRequisito.artigo} 
              onChange={e => setNovoRequisito({...novoRequisito, artigo: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: '4px' }}
            />

            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Descrição da Exigência</label>
            <textarea 
              rows={4}
              placeholder="Descreva o que a norma exige..."
              value={novoRequisito.descricao} 
              onChange={e => setNovoRequisito({...novoRequisito, descricao: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', marginBottom: '1.5rem', border: '1px solid var(--border)', borderRadius: '4px', resize: 'vertical' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setModalNovo(false)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSalvarRequisito} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VINCULAR DOCUMENTO */}
      {modalVincular.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '600px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0 }}>Vincular Documento</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Pesquise e selecione um documento vigente para comprovar o atendimento desta exigência.</p>
            
            <input 
              type="text" 
              placeholder="🔍 Buscar por código ou título..." 
              value={buscaDoc}
              onChange={e => setBuscaDoc(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', border: '1px solid var(--border)', borderRadius: '4px' }}
            />

            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border)', borderRadius: '4px' }}>
              {docsFiltrados.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>Nenhum documento encontrado.</div>
              ) : (
                docsFiltrados.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{doc.codigo}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{doc.titulo}</div>
                    </div>
                    <button 
                      onClick={() => handleVincularDocumento(doc.id)}
                      style={{ padding: '0.4rem 0.8rem', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #0369a1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                    >
                      Vincular
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => { setModalVincular({ isOpen: false, requisitoId: '' }); setBuscaDoc(''); }} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
