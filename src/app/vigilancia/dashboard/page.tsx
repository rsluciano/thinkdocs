'use client';
import React, { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

import Link from 'next/link';

export default function DashboardPage() {
  const [items, setItems] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resItems, resAud] = await Promise.all([
          fetchAPI('/api/vigilancia/rdc-items'),
          fetchAPI('/api/vigilancia/auditoria')
        ]);
        
        if (resItems.ok && resAud.ok) {
          setItems(await resItems.json());
          setAuditorias(await resAud.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <p>Carregando Dashboard...</p>;

  // Processamento de Dados
  const audMap = new Map(auditorias.map(a => [a.rdcItemId, a]));

  let conformes = 0;
  let naoConformes = 0;
  let naoAplicaveis = 0;
  let pendentes = 0;

  const categoriasMap = new Map<string, { total: number, conformes: number, naoConformes: number, pendentes: number }>();

  items.forEach(item => {
    const aud = audMap.get(item.id);
    const status = aud?.conforme;

    if (status === 'S') conformes++;
    else if (status === 'N') naoConformes++;
    else if (status === 'NA') naoAplicaveis++;
    else if (status === 'INFO') { /* não conta para progresso de auditoria */ }
    else pendentes++;

    const cat = item.categoria || 'Sem Categoria';
    if (!categoriasMap.has(cat)) {
      categoriasMap.set(cat, { total: 0, conformes: 0, naoConformes: 0, pendentes: 0 });
    }
    const cData = categoriasMap.get(cat)!;
    cData.total++;
    if (status === 'S') cData.conformes++;
    else if (status === 'N') cData.naoConformes++;
    else if (status !== 'INFO' && status !== 'NA') cData.pendentes++;
  });

  const pieData = [
    { name: 'Conforme', value: conformes, color: '#22c55e' },
    { name: 'Não Conforme', value: naoConformes, color: '#dc2626' },
    { name: 'Não Aplicável', value: naoAplicaveis, color: '#eab308' },
    { name: 'Pendente', value: pendentes, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const barData = Array.from(categoriasMap.entries()).map(([name, data]) => ({
    name,
    Conforme: data.conformes,
    'Não Conforme': data.naoConformes,
    Pendente: data.pendentes
  }));

  const totalRespondidos = conformes + naoConformes + naoAplicaveis;
  const porcentagem = totalRespondidos > 0 ? ((conformes / (totalRespondidos - naoAplicaveis)) * 100).toFixed(1) : 0;

  const cards = [
    { title: 'Taxa de Conformidade', value: `${porcentagem}%`, color: 'var(--primary)' },
    { title: 'Itens Avaliados', value: `${totalRespondidos} / ${items.length}`, color: '#0f172a' },
    { title: 'Não Conformidades', value: naoConformes, color: '#dc2626' },
    { title: 'Pendências', value: pendentes, color: '#eab308' }
  ];

  const shortcuts = [
    { name: 'Painel Executivo', href: '/vigilancia/painel-executivo', icon: '📈', color: 'bg-indigo-600' },
    { name: 'Matriz RDC', href: '/vigilancia/matriz', icon: '📋', color: 'bg-blue-600' },
    { name: 'Checklist', href: '/vigilancia/checklist', icon: '✅', color: 'bg-green-600' },
    { name: 'Não Conformidades', href: '/nao-conformidades', icon: '🚨', color: 'bg-red-600' },
    { name: 'Documentos', href: '/vigilancia/controle-documentos', icon: '📑', color: 'bg-slate-700' },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Atalhos Rápidos */}
      <div className="flex flex-wrap gap-4 mb-2">
        {shortcuts.map(s => (
          <Link key={s.name} href={s.href} className={`${s.color} hover:opacity-90 text-white font-bold py-3 px-5 rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-105`}>
            <span className="text-xl">{s.icon}</span>
            <span>{s.name}</span>
          </Link>
        ))}
      </div>

      {/* Cards KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map(c => (
          <div key={c.title} className="card" style={{ borderLeft: `4px solid ${c.color}`, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 'bold' }}>{c.title}</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a' }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Pie Chart */}
        <div className="card">
          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 'bold' }}>Status Geral (RDC 978)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="card">
          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 'bold' }}>Conformidade por Categoria</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Conforme" stackId="a" fill="#22c55e" />
                <Bar dataKey="Não Conforme" stackId="a" fill="#dc2626" />
                <Bar dataKey="Pendente" stackId="a" fill="#94a3b8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
