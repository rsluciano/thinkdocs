"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaInfo, setEmpresaInfo] = useState({ nome: '', logo: '' });
  
  // Estado dos Filtros Cruzados
  const [filtros, setFiltros] = useState({
    status: null as string | null,
    categoria: null as string | null,
    setor: null as string | null
  });

  const handleToggleFilter = (tipo: 'status' | 'categoria' | 'setor', valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [tipo]: prev[tipo] === valor ? null : valor
    }));
  };

  const clearFilters = () => {
    setFiltros({ status: null, categoria: null, setor: null });
  };

  // Auth Check Simples
  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (!userStr) {
      router.push('/login');
    } else {
      const user = JSON.parse(userStr);
      let finalLogo = user.empresaLogo || '';
      if (user.empresaNome && user.empresaNome.toLowerCase().includes('souza')) {
        finalLogo = '/logo-souza-areas.png';
      }
      setEmpresaInfo({ nome: user.empresaNome || '', logo: finalLogo });
      fetchAPI(`/api/documentos?empresaId=${user.empresaId}&userFuncao=${encodeURIComponent(user.funcao)}&userSetor=${encodeURIComponent(user.setor)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setDocumentos(data);
          else setDocumentos([]);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [router]);

  // Função auxiliar para mapear status interno para chave do filtro
  const getFiltroStatus = (statusOriginal: string) => {
    if (statusOriginal === 'Vigente') return 'Vigentes';
    if (statusOriginal === 'Aguardando Aprovação') return 'Aguardando';
    if (statusOriginal === 'Reprovado') return 'Devolvidos';
    if (statusOriginal === 'Rascunho' || statusOriginal === 'Elaboração') return 'Elaboracao';
    return 'Outros';
  };

  // Listas Semi-Filtradas (Cross-Filtering)
  const docsForStatus = documentos.filter(d => 
    (!filtros.categoria || d.categoria === filtros.categoria) &&
    (!filtros.setor || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes('Geral') || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes(filtros.setor))
  );

  const docsForCategoria = documentos.filter(d => 
    (!filtros.status || getFiltroStatus(d.status) === filtros.status) &&
    (!filtros.setor || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes('Geral') || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes(filtros.setor))
  );

  const docsForSetor = documentos.filter(d => 
    (!filtros.status || getFiltroStatus(d.status) === filtros.status) &&
    (!filtros.categoria || d.categoria === filtros.categoria)
  );

  const fullyFilteredDocs = documentos.filter(d => 
    (!filtros.status || getFiltroStatus(d.status) === filtros.status) &&
    (!filtros.categoria || d.categoria === filtros.categoria) &&
    (!filtros.setor || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes('Geral') || (Array.isArray(d.setor) ? d.setor : [d.setor || 'Geral']).includes(filtros.setor))
  );

  // Totais dos Cards Baseados em docsForStatus (permite clicar entre status sem eles zerarem)
  const totalDocs = docsForStatus.length;
  const countVigentes = docsForStatus.filter(d => getFiltroStatus(d.status) === 'Vigentes').length;
  const countAguardando = docsForStatus.filter(d => getFiltroStatus(d.status) === 'Aguardando').length;
  const countDevolvidos = docsForStatus.filter(d => getFiltroStatus(d.status) === 'Devolvidos').length;
  const countElaboracao = docsForStatus.filter(d => getFiltroStatus(d.status) === 'Elaboracao').length;

  // Lógica de Categorias para o Gráfico (usando docsForCategoria)
  const categoriasCount = docsForCategoria.reduce((acc, doc) => {
    const cat = doc.categoria || 'Sem Categoria';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalParaCat = docsForCategoria.length;
  const categoriasChart = Object.keys(categoriasCount).map(cat => ({
    categoria: cat,
    count: categoriasCount[cat],
    percent: totalParaCat > 0 ? ((categoriasCount[cat] / totalParaCat) * 100).toFixed(1) : '0.0'
  })).sort((a, b) => b.count - a.count);

  // Lógica de Setores para o Gráfico (usando docsForSetor)
  const setoresPermitidos = {
    'Geral': 0, 'Limpeza': 0, 'Área Técnica': 0, 'Coleta': 0, 'Administração': 0, 
    'Triagem': 0, 'Diretoria': 0, 'Qualidade': 0, 'TI e infraestrutura': 0, 'Recepção': 0
  };

  const setoresCount = docsForSetor.reduce((acc, doc) => {
    const docSetores = Array.isArray(doc.setor) ? doc.setor : [doc.setor || 'Geral'];
    if (docSetores.includes('Geral')) {
      Object.keys(setoresPermitidos).forEach(s => {
        if (acc[s] !== undefined) acc[s] += 1;
      });
    } else {
      docSetores.forEach((s: string) => {
        if (acc[s] !== undefined) acc[s] += 1;
      });
    }
    return acc;
  }, { ...setoresPermitidos } as Record<string, number>);

  // A porcentagem deve ser relativa ao total de documentos no filtro, e não à soma das associações
  const totalParaSetor = docsForSetor.length;

  const setoresChart = Object.keys(setoresCount).map(setor => ({
    setor: setor,
    count: setoresCount[setor],
    percent: totalParaSetor > 0 ? ((setoresCount[setor] / totalParaSetor) * 100).toFixed(1) : '0.0'
  })).sort((a: any, b: any) => b.count - a.count);


  // Lógica de Vencimentos (Baseado no fullyFilteredDocs que são Vigentes)
  const docsVigentesFiltrados = fullyFilteredDocs.filter(d => getFiltroStatus(d.status) === 'Vigentes');
  const hoje = new Date();
  
  const docsComDias = docsVigentesFiltrados.map(doc => {
    let diasParaVencer = 999;
    if (doc.dataVencimento) {
      const venc = new Date(doc.dataVencimento);
      const diffTime = venc.getTime() - hoje.getTime();
      diasParaVencer = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    let cor = '#22c55e'; // Verde
    let corNome = 'green';
    let statusTexto = 'No Prazo';

    if (diasParaVencer <= 0) {
      cor = '#ef4444';
      corNome = 'red';
      statusTexto = diasParaVencer < 0 ? 'Vencido' : 'Vence Hoje';
    }
    else if (diasParaVencer <= 7) {
      cor = '#f97316';
      corNome = 'orange';
      statusTexto = 'Crítico';
    }
    else if (diasParaVencer <= 15) {
      cor = '#eab308';
      corNome = 'yellow';
      statusTexto = 'Alerta';
    }
    else if (diasParaVencer <= 30) {
      cor = '#3b82f6';
      corNome = 'blue';
      statusTexto = 'Atenção';
    }
    
    return { ...doc, diasParaVencer, cor, corNome, statusTexto };
  });

  const countVerde = docsComDias.filter(d => d.corNome === 'green').length;
  const countAzul = docsComDias.filter(d => d.corNome === 'blue').length;
  const countAmarelo = docsComDias.filter(d => d.corNome === 'yellow').length;
  const countLaranja = docsComDias.filter(d => d.corNome === 'orange').length;
  const countVermelho = docsComDias.filter(d => d.corNome === 'red').length;

  const docsCriticos = docsComDias
    .filter(d => d.corNome !== 'green')
    .sort((a, b) => a.diasParaVencer - b.diasParaVencer);

  const hasFilters = filtros.status || filtros.categoria || filtros.setor;

  if (loading) return <div>Carregando dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {empresaInfo.logo && (
            <img src={empresaInfo.logo} alt="Logo" style={{ maxHeight: '60px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          )}
          <div>
            <h1 className="text-3xl font-bold">Dashboard Interativo</h1>
            {empresaInfo.nome && <span style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>{empresaInfo.nome}</span>}
          </div>
        </div>
        {hasFilters && (
          <button 
            onClick={clearFilters}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            ❌ Limpar Filtros
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <div className="card hover-scale" style={{ flex: 1, minWidth: '180px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', opacity: hasFilters && !filtros.status ? 0.7 : 1 }}>
          <span style={{ color: '#64748b', fontWeight: 'bold' }}>📚 Total Geral (Filtros)</span>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>{totalDocs}</p>
        </div>
        <div 
          className="card hover-scale" 
          onClick={() => handleToggleFilter('status', 'Vigentes')}
          style={{ flex: 1, minWidth: '180px', backgroundColor: '#f0fdf4', border: '1px solid', borderColor: filtros.status === 'Vigentes' ? '#166534' : '#bbf7d0', cursor: 'pointer', opacity: filtros.status && filtros.status !== 'Vigentes' ? 0.4 : 1, transform: filtros.status === 'Vigentes' ? 'scale(1.02)' : 'scale(1)', boxShadow: filtros.status === 'Vigentes' ? '0 0 0 2px #22c55e' : 'none' }}
        >
          <span style={{ color: '#166534', fontWeight: 'bold' }}>✅ Aprovados (Vigentes)</span>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d' }}>{countVigentes}</p>
        </div>
        <div 
          className="card hover-scale" 
          onClick={() => handleToggleFilter('status', 'Aguardando')}
          style={{ flex: 1, minWidth: '180px', backgroundColor: '#fffbeb', border: '1px solid', borderColor: filtros.status === 'Aguardando' ? '#b45309' : '#fde68a', cursor: 'pointer', opacity: filtros.status && filtros.status !== 'Aguardando' ? 0.4 : 1, transform: filtros.status === 'Aguardando' ? 'scale(1.02)' : 'scale(1)', boxShadow: filtros.status === 'Aguardando' ? '0 0 0 2px #eab308' : 'none' }}
        >
          <span style={{ color: '#b45309', fontWeight: 'bold' }}>⏳ Aguardando</span>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>{countAguardando}</p>
        </div>
        <div 
          className="card hover-scale" 
          onClick={() => handleToggleFilter('status', 'Devolvidos')}
          style={{ flex: 1, minWidth: '180px', backgroundColor: '#fef2f2', border: '1px solid', borderColor: filtros.status === 'Devolvidos' ? '#991b1b' : '#fecaca', cursor: 'pointer', opacity: filtros.status && filtros.status !== 'Devolvidos' ? 0.4 : 1, transform: filtros.status === 'Devolvidos' ? 'scale(1.02)' : 'scale(1)', boxShadow: filtros.status === 'Devolvidos' ? '0 0 0 2px #ef4444' : 'none' }}
        >
          <span style={{ color: '#991b1b', fontWeight: 'bold' }}>↩️ Devolvidos</span>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{countDevolvidos}</p>
        </div>
        <div 
          className="card hover-scale" 
          onClick={() => handleToggleFilter('status', 'Elaboracao')}
          style={{ flex: 1, minWidth: '180px', backgroundColor: '#eff6ff', border: '1px solid', borderColor: filtros.status === 'Elaboracao' ? '#1d4ed8' : '#bfdbfe', cursor: 'pointer', opacity: filtros.status && filtros.status !== 'Elaboracao' ? 0.4 : 1, transform: filtros.status === 'Elaboracao' ? 'scale(1.02)' : 'scale(1)', boxShadow: filtros.status === 'Elaboracao' ? '0 0 0 2px #3b82f6' : 'none' }}
        >
          <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>✍️ Em Elaboração</span>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{countElaboracao}</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        .chart-bar:hover {
          opacity: 0.8;
          transform: scale(1.01);
        }
      `}} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* Gráfico de Categorias */}
        <div>
          <h2 className="text-2xl font-semibold" style={{ marginBottom: '1.5rem' }}>📊 Distribuição por Categoria</h2>
          <div className="card" style={{ height: '100%' }}>
            {categoriasChart.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Nenhum documento atende aos filtros.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {categoriasChart.map((cat, idx) => (
                  <div key={idx} className="chart-bar" onClick={() => handleToggleFilter('categoria', cat.categoria)} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', cursor: 'pointer', opacity: filtros.categoria && filtros.categoria !== cat.categoria ? 0.3 : 1, transition: 'all 0.2s', padding: '0.2rem', borderRadius: '4px', backgroundColor: filtros.categoria === cat.categoria ? '#f1f5f9' : 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      <span>{cat.categoria} {filtros.categoria === cat.categoria && '🔍'}</span>
                      <span style={{ color: 'var(--muted)' }}>{cat.count} docs ({cat.percent}%)</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '999px', height: '12px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${cat.percent}%`, 
                        backgroundColor: '#2563eb', // Azul
                        borderRadius: '999px',
                        transition: 'width 0.5s ease-in-out'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Setores */}
        <div>
          <h2 className="text-2xl font-semibold" style={{ marginBottom: '1.5rem' }}>🏢 Distribuição por Setores</h2>
          <div className="card" style={{ height: '100%' }}>
            {setoresChart.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Nenhum documento atende aos filtros.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {setoresChart.map((setor, idx) => (
                  <div key={idx} className="chart-bar" onClick={() => handleToggleFilter('setor', setor.setor)} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', cursor: 'pointer', opacity: filtros.setor && filtros.setor !== setor.setor ? 0.3 : 1, transition: 'all 0.2s', padding: '0.2rem', borderRadius: '4px', backgroundColor: filtros.setor === setor.setor ? '#f0fdf4' : 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      <span>{setor.setor} {filtros.setor === setor.setor && '🔍'}</span>
                      <span style={{ color: 'var(--muted)' }}>{setor.count} docs ({setor.percent}%)</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '999px', height: '12px', overflow: 'hidden' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${setor.percent}%`, 
                        backgroundColor: '#16a34a', // Verde
                        borderRadius: '999px',
                        transition: 'width 0.5s ease-in-out'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <h2 className="text-2xl font-semibold" style={{ marginBottom: '1.5rem' }}>⏱️ Controle de Vencimentos (Dos itens filtrados)</h2>

      {docsCriticos.length > 0 && (
        <div className="alert-banner" style={{ borderLeftColor: countVermelho > 0 ? '#ef4444' : countLaranja > 0 ? '#f97316' : '#eab308' }}>
          <h3>⚠️ Atenção Necessária</h3>
          <p>Você possui <strong>{docsCriticos.length} documento(s)</strong> no recorte atual saindo da zona segura de validade.</p>
          {countVermelho > 0 && <p style={{ color: '#dc2626', fontWeight: 'bold' }}>Existem {countVermelho} documentos VENCIDOS!</p>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        
        <div className="card" style={{ borderTop: '4px solid #22c55e', textAlign: 'center' }}>
          <h4 style={{ color: '#166534', fontWeight: 'bold' }}>No Prazo</h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e' }}>{countVerde}</p>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>&gt; 30 dias</span>
        </div>

        <div className="card" style={{ borderTop: '4px solid #3b82f6', textAlign: 'center' }}>
          <h4 style={{ color: '#1e3a8a', fontWeight: 'bold' }}>Atenção</h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{countAzul}</p>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>16 a 30 dias</span>
        </div>

        <div className="card" style={{ borderTop: '4px solid #eab308', textAlign: 'center' }}>
          <h4 style={{ color: '#854d0e', fontWeight: 'bold' }}>Alerta</h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#eab308' }}>{countAmarelo}</p>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>8 a 15 dias</span>
        </div>

        <div className="card" style={{ borderTop: '4px solid #f97316', textAlign: 'center' }}>
          <h4 style={{ color: '#9a3412', fontWeight: 'bold' }}>Crítico</h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f97316' }}>{countLaranja}</p>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>1 a 7 dias</span>
        </div>

        <div className="card" style={{ borderTop: '4px solid #ef4444', textAlign: 'center', backgroundColor: countVermelho > 0 ? '#fef2f2' : 'white' }}>
          <h4 style={{ color: '#991b1b', fontWeight: 'bold' }}>Vencidos</h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>{countVermelho}</p>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>&le; 0 dias</span>
        </div>

      </div>

      <h2 className="text-2xl font-semibold" style={{ marginBottom: '1.5rem' }}>🚨 Lista de Vencimentos Críticos</h2>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Código</th>
              <th style={{ padding: '1rem' }}>Título</th>
              <th style={{ padding: '1rem' }}>Setor</th>
              <th style={{ padding: '1rem' }}>Dias Restantes</th>
              <th style={{ padding: '1rem' }}>Ação Recomendada</th>
            </tr>
          </thead>
          <tbody>
            {docsCriticos.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#166534', fontWeight: 'bold' }}>Nenhum documento crítico atende aos filtros atuais.</td></tr>
            ) : docsCriticos.map(doc => (
              <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: doc.corNome === 'red' ? '#fef2f2' : 'transparent' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{doc.codigo}</td>
                <td style={{ padding: '1rem' }}>{doc.titulo}</td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#64748b' }}>{Array.isArray(doc.setor) ? doc.setor.join(', ') : doc.setor}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold', color: doc.cor }}>
                  {doc.diasParaVencer < 0 ? `Vencido há ${Math.abs(doc.diasParaVencer)} dias` : `${doc.diasParaVencer} dias`}
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    onClick={() => router.push(`/elaboracao?revisao=${doc.id}`)}
                    style={{ padding: '0.4rem 0.8rem', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Revisar Documento
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
