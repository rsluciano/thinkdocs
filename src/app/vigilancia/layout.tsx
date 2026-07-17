'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function VigilanciaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('thinkdocs_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);

  const tabs = [
    { label: 'Aba 1 - Matriz RDC', path: '/vigilancia/matriz' },
    { label: 'Aba 2 - Dashboard', path: '/vigilancia/dashboard' },
    { label: 'Aba 3 - Plano de Ação', path: '/vigilancia/plano-acao' },
    { label: 'Aba 4 - Lista Mestra', path: '/vigilancia/lista-mestra' },
    { label: 'Aba 5 - Checklist', path: '/vigilancia/checklist' },
    { label: 'Aba 6 - Painel Executivo', path: '/vigilancia/painel-executivo' },
  ];

  if (!user) return <p style={{ padding: '2rem' }}>Carregando...</p>;

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 'bold' }}>
          Sistema de Auditoria - RDC 978/2025
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
          Gerencie requisitos, evidências e não conformidades em tempo real.
        </p>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => router.push(tab.path)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isActive ? 'var(--primary)' : 'white',
                  color: isActive ? 'white' : 'var(--muted)',
                  border: isActive ? 'none' : '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
