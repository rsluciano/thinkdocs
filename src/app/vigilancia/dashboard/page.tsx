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
    { 
      name: 'Painel Executivo', 
      desc: 'Indicadores e maturidade',
      href: '/vigilancia/painel-executivo', 
      icon: (
        <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-indigo-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    },
    { 
      name: 'Matriz RDC', 
      desc: 'Visualizar regulamentação',
      href: '/vigilancia/matriz', 
      icon: (
        <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-blue-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      )
    },
    { 
      name: 'Checklist', 
      desc: 'Executar auditoria',
      href: '/vigilancia/checklist', 
      icon: (
        <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-slate-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
        </svg>
      )
    },
    { 
      name: 'Documentos', 
      desc: 'Gerenciar evidências',
      href: '/vigilancia/controle-documentos', 
      icon: (
        <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-blue-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
        </svg>
      )
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Atalhos Rápidos */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-12">
        <h2 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {shortcuts.map(s => (
            <Link 
              key={s.name} 
              href={s.href} 
              className="group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-4 transition-all flex items-center gap-4"
            >
              <div className="flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{s.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            </Link>
          ))}
          
          {/* Card Especial: Upload (tracejado) */}
          <Link 
            href="/vigilancia/controle-documentos" 
            className="group bg-slate-50/50 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl p-4 transition-all flex items-center gap-4"
          >
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-slate-600 group-hover:text-indigo-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-700 text-sm group-hover:text-indigo-700 transition-colors">Upload de Documentos</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enviar evidências</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">📈</span>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Taxa de Conformidade</p>
          </div>
          <p className="text-3xl font-black text-slate-800">{porcentagem}%</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">📋</span>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">Itens Avaliados</p>
          </div>
          <p className="text-3xl font-black text-blue-700">{totalRespondidos} / {items.length}</p>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">❌</span>
            <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Não Conformidades</p>
          </div>
          <p className="text-3xl font-black text-red-700">{naoConformes}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-5 py-4 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">⚠️</span>
            <p className="text-[11px] font-bold text-yellow-600 uppercase tracking-wide">Pendências</p>
          </div>
          <p className="text-3xl font-black text-yellow-700">{pendentes}</p>
        </div>
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
