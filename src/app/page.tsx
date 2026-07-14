"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaInfo, setEmpresaInfo] = useState({ nome: '', logo: '' });

  // Auth Check Simples
  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (!userStr) {
      router.push('/login');
    } else {
      const user = JSON.parse(userStr);
      setEmpresaInfo({ nome: user.empresaNome || '', logo: user.empresaLogo || '' });
      fetch(`/api/documentos?empresaId=${user.empresaId}&userFuncao=${encodeURIComponent(user.funcao)}&userSetor=${encodeURIComponent(user.setor)}`)
        .then(res => res.json())
        .then(data => {
          setDocumentos(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [router]);

  // Agrupamento Geral
  const totalDocs = documentos.length;
  const docsVigentes = documentos.filter(d => d.status === 'Vigente');
  const docsAguardando = documentos.filter(d => d.status === 'Aguardando Aprovação');
  const docsEmElaboracao = documentos.filter(d => d.status === 'Rascunho' || d.status === 'Elaboração');
  const docsDevolvidos = documentos.filter(d => d.status === 'Reprovado');

  // Lógica de Categorias para o Gráfico
  const categoriasCount = documentos.reduce((acc, doc) => {
    const cat = doc.categoria || 'Sem Categoria';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoriasChart = Object.keys(categoriasCount).map(cat => ({
    categoria: cat,
    count: categoriasCount[cat],
    percent: totalDocs > 0 ? ((categoriasCount[cat] / totalDocs) * 100).toFixed(1) : '0.0'
  })).sort((a, b) => b.count - a.count);

  // Lógica de Categorização (Apenas para os Vigentes)
  const hoje = new Date();
  
  const docsComDias = docsVigentes.map(doc => {
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
      cor = '#ef4444'; // Vermelho
      corNome = 'red';
      statusTexto = diasParaVencer < 0 ? 'Vencido' : 'Vence Hoje';
    }
    else if (diasParaVencer <= 7) {
      cor = '#f97316'; // Laranja
      corNome = 'orange';
      statusTexto = 'Crítico';
    }
    else if (diasParaVencer <= 15) {
      cor = '#eab308'; // Amarelo
      corNome = 'yellow';
      statusTexto = 'Alerta';
    }
    else if (diasParaVencer <= 30) {
      cor = '#3b82f6'; // Azul
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

  if (loading) return <div>Carregando dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        {empresaInfo.logo && (
          <img src={empresaInfo.logo} alt="Logo" style={{ maxHeight: '60px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        )}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {empresaInfo.nome && <span style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>{empresaInfo.nome}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <div className="card hover-scale" style={{ flex: 1, minWidth: '180px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontWeight: 'bold' }}>Total de Documentos</span>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>{totalDocs}</p>
        </div>
        <div 
          className="card hover-scale" 
          onClick={() => router.push('/lista-mestra')}
          style={{ flex: 1, minWidth: '180px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', cursor: 'pointer' }}
        >
          <span style={{ color: '#166534', fontWeight: 'bold' }}>Aprovados (Vigentes)</span>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d' }}>{docsVigentes.length}</p>
        </div>
        <div 
          className="card hover-scale" 
          onClick={() => router.push('/aprovacoes')}
          style={{ flex: 1, minWidth: '180px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', cursor: 'pointer' }}
        >
          <span style={{ color: '#b45309', fontWeight: 'bold' }}>Aguardando Aprovação</span>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>{docsAguardando.length}</p>
        </div>
        <div 
          className="card hover-scale" 
          onClick={() => router.push('/devolvidos')}
          style={{ flex: 1, minWidth: '180px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer' }}
        >
          <span style={{ color: '#991b1b', fontWeight: 'bold' }}>Devolvidos</span>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{docsDevolvidos.length}</p>
        </div>
        <div className="card hover-scale" style={{ flex: 1, minWidth: '180px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <span style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Em Elaboração</span>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>{docsEmElaboracao.length}</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
      `}} />

      <h2 className="text-2xl font-semibold" style={{ marginBottom: '1.5rem' }}>Distribuição por Categoria</h2>
      <div className="card" style={{ marginBottom: '3rem' }}>
        {categoriasChart.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center' }}>Nenhum documento encontrado.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categoriasChart.map((cat, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  <span>{cat.categoria}</span>
                  <span style={{ color: 'var(--muted)' }}>{cat.count} docs ({cat.percent}%)</span>
                </div>
                <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '999px', height: '12px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${cat.percent}%`, 
                    backgroundColor: 'var(--primary)',
                    borderRadius: '999px',
                    transition: 'width 1s ease-in-out'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-2xl font-semibold" style={{ marginBottom: '1.5rem' }}>Controle de Vencimentos (Vigentes)</h2>

      {docsCriticos.length > 0 && (
        <div className="alert-banner" style={{ borderLeftColor: countVermelho > 0 ? '#ef4444' : countLaranja > 0 ? '#f97316' : '#eab308' }}>
          <h3>⚠️ Atenção Necessária</h3>
          <p>Você possui <strong>{docsCriticos.length} documento(s)</strong> saindo da zona segura de validade.</p>
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

      <h2 className="text-2xl font-semibold" style={{ marginBottom: '1.5rem' }}>Documentos Próximos do Vencimento</h2>
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Código</th>
              <th style={{ padding: '1rem' }}>Título</th>
              <th style={{ padding: '1rem' }}>Dias Restantes</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Ação Recomendada</th>
            </tr>
          </thead>
          <tbody>
            {docsCriticos.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#166534', fontWeight: 'bold' }}>Nenhum documento crítico no momento. Parabéns!</td></tr>
            ) : docsCriticos.map(doc => (
              <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: doc.corNome === 'red' ? '#fef2f2' : 'transparent' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{doc.codigo}</td>
                <td style={{ padding: '1rem' }}>{doc.titulo}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold', color: doc.cor }}>
                  {doc.diasParaVencer < 0 ? `Vencido há ${Math.abs(doc.diasParaVencer)} dias` : `${doc.diasParaVencer} dias`}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    backgroundColor: `${doc.cor}20`,
                    color: doc.cor
                  }}>
                    {doc.statusTexto}
                  </span>
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
