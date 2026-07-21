'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VigilanciaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('thinkdocs_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);

  if (!user) return <p style={{ padding: '2rem' }}>Carregando...</p>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
              <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Auditoria RDC 978/2025
            </h1>
          </div>
          <p className="text-slate-300 ml-13 max-w-2xl font-light">
            Sistema inteligente para gerenciamento de requisitos, evidências e conformidade regulatória.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Content Area with Fade In */}
        <div className="animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
