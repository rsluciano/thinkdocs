'use client';
import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';

export default function MatrizRDC() {
  const [items, setItems] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroConformidade, setFiltroConformidade] = useState('');

  // Estados para edição in-line (Modal)
  const [modalOpen, setModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resItems, resAud] = await Promise.all([
        fetchAPI('/api/vigilancia/rdc-items'),
        fetchAPI('/api/vigilancia/auditoria')
      ]);

      if (resItems.ok && resAud.ok) {
        const dataItems = await resItems.json();
        const dataAud = await resAud.json();

        setItems(dataItems);

        const audMap: Record<string, any> = {};
        dataAud.forEach((aud: any) => {
          audMap[aud.rdcItemId] = aud;
        });
        setAuditorias(audMap);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar matriz.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: any) => {
    const aud = auditorias[item.id] || {};
    setActiveItem(item);
    setEditData({
      conforme: aud.conforme || '',
      evidenciaEncontrada: aud.evidenciaEncontrada || '',
      acaoCorretiva: aud.acaoCorretiva || '',
      prazo: aud.prazo ? aud.prazo.substring(0,10) : '',
      status: aud.status || 'Pendente',
      observacoes: aud.observacoes || ''
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!activeItem) return;
    setSaving(true);
    try {
      const res = await fetchAPI(`/api/vigilancia/auditoria/${activeItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(editData)
      });
      if (res.ok) {
        const audSalva = await res.json();
        setAuditorias(prev => ({ ...prev, [activeItem.id]: audSalva }));
        setModalOpen(false);
      } else {
        alert('Erro ao salvar auditoria.');
      }
    } catch (e) {
      alert('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  // Filtragem
  const filteredItems = items.filter(item => {
    const aud = auditorias[item.id];
    let passCat = true;
    let passConf = true;

    if (filtroCategoria && item.categoria !== filtroCategoria) passCat = false;
    
    if (filtroConformidade) {
      const isConf = aud?.conforme;
      if (filtroConformidade === 'NaoAvaliado' && isConf) passConf = false;
      if (filtroConformidade !== 'NaoAvaliado' && isConf !== filtroConformidade) passConf = false;
    }

    return passCat && passConf;
  });

  const getCriticidadeColor = (crit: string) => {
    switch(crit?.toLowerCase()) {
      case 'crítico': return '#dc2626'; // Red
      case 'alto': return '#ea580c'; // Orange
      case 'médio': return '#eab308'; // Yellow
      case 'baixo': return '#22c55e'; // Green
      default: return '#94a3b8';
    }
  };

  if (loading) return <p>Carregando Matriz...</p>;

  return (
    <div className="card">
      <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 'bold' }}>Matriz RDC 978 (Requisitos)</h2>
      
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Categoria</label>
          <select 
            value={filtroCategoria} 
            onChange={e => setFiltroCategoria(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            <option value="">Todas</option>
            <option value="Gestão">Gestão</option>
            <option value="Estrutura Física">Estrutura Física</option>
            <option value="Recursos Humanos">Recursos Humanos</option>
            <option value="Documentação">Documentação</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Conformidade</label>
          <select 
            value={filtroConformidade} 
            onChange={e => setFiltroConformidade(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
          >
            <option value="">Todos</option>
            <option value="S">Conforme (S)</option>
            <option value="N">Não Conforme (N)</option>
            <option value="NA">Não Aplicável (NA)</option>
            <option value="NaoAvaliado">Não Avaliado</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 'bold' }}>
            {filteredItems.length} requisitos encontrados.
          </p>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0 }}>Referência</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0 }}>Requisito Objetivo</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0 }}>Criticidade</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0 }}>Conformidade</th>
              <th style={{ padding: '0.75rem', position: 'sticky', top: 0 }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const aud = auditorias[item.id];
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{item.referencia}</td>
                  <td style={{ padding: '0.75rem', maxWidth: '400px' }}>{item.requisitoObjetivo || item.textoIntegral}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ backgroundColor: getCriticidadeColor(item.criticidade), color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                      {item.criticidade || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                    {!aud?.conforme ? <span style={{ color: '#94a3b8' }}>Não Avaliado</span> :
                     aud.conforme === 'S' ? <span style={{ color: '#22c55e' }}>✅ Conforme</span> :
                     aud.conforme === 'N' ? <span style={{ color: '#dc2626' }}>❌ Não Conforme</span> :
                     <span style={{ color: '#f59e0b' }}>⚠️ Não Aplicável</span>}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button 
                      onClick={() => handleOpenModal(item)}
                      style={{ padding: '0.3rem 0.8rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      Avaliar
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Nenhum requisito encontrado para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Avaliação */}
      {modalOpen && activeItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card animate-fade-in" style={{ width: '600px', backgroundColor: 'white', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>
              Avaliar Requisito {activeItem.referencia}
            </h3>
            
            <div style={{ marginBottom: '1.5rem', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '6px' }}>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}><strong>Texto Integral:</strong> {activeItem.textoIntegral}</p>
              <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary)' }}><strong>Requisito Objetivo:</strong> {activeItem.requisitoObjetivo}</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}><strong>Evidência Esperada:</strong> {activeItem.evidenciaObjetiva}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Situação (Conformidade)</label>
                <select 
                  value={editData.conforme} 
                  onChange={e => setEditData({...editData, conforme: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">Selecione...</option>
                  <option value="S">Sim (Conforme)</option>
                  <option value="N">Não (Não Conforme)</option>
                  <option value="NA">Não Aplicável</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Status da Ação</label>
                <select 
                  value={editData.status} 
                  onChange={e => setEditData({...editData, status: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Evidência Encontrada</label>
              <textarea 
                value={editData.evidenciaEncontrada}
                onChange={e => setEditData({...editData, evidenciaEncontrada: e.target.value})}
                rows={2}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                placeholder="Ex: POP 001 anexado, Planilha assinada..."
              />
            </div>

            {editData.conforme === 'N' && (
              <div style={{ marginBottom: '1rem', borderLeft: '4px solid #dc2626', paddingLeft: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#dc2626' }}>Ação Corretiva Imediata</label>
                <textarea 
                  value={editData.acaoCorretiva}
                  onChange={e => setEditData({...editData, acaoCorretiva: e.target.value})}
                  rows={2}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}
                  placeholder="Ação para corrigir o desvio..."
                />
                
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Prazo Limite</label>
                <input 
                  type="date"
                  value={editData.prazo}
                  onChange={e => setEditData({...editData, prazo: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>* Para estruturar o Plano de Ação Completo (5W2H), utilize a Aba "Plano de Ação".</p>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>Observações</label>
              <textarea 
                value={editData.observacoes}
                onChange={e => setEditData({...editData, observacoes: e.target.value})}
                rows={2}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setModalOpen(false)} 
                style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
