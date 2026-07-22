"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import Image from 'next/image';

export function ThinkPlusLogo() {
  return (
    <div className="flex flex-col items-center mb-6 px-4 pt-6">
      <div className="relative w-40 h-20">
        <Image 
          src="/think_vs_logo.jpg" 
          alt="Think V.S. Logo" 
          fill 
          style={{ objectFit: 'contain' }}
          className="rounded-xl"
        />
      </div>
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-2">Acreditação & Qualidade</span>
    </div>
  );
}

export function VigilanciaSidebarNav() {
  const pathname = usePathname() || '';
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  if (!user) return null;

  return (
    <nav className="flex flex-col gap-1 px-3 h-full pb-4">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4 px-3">Visão Geral</div>
      <a 
        href="/vigilancia/dashboard" 
        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${pathname === '/vigilancia/dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className="text-lg">📊</span> Dashboard
      </a>
      
      <a 
        href="/vigilancia/painel-executivo" 
        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${pathname === '/vigilancia/painel-executivo' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className="text-lg">📈</span> Painel Executivo
      </a>

      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">Auditoria RDC 978</div>
      <a 
        href="/vigilancia/matriz" 
        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${pathname === '/vigilancia/matriz' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className="text-lg">📋</span> Matriz RDC
      </a>

      <a 
        href="/vigilancia/checklist" 
        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${pathname === '/vigilancia/checklist' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className="text-lg">✅</span> Checklist
      </a>

      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">Documentação</div>
      <a 
        href="/vigilancia/controle-documentos" 
        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${pathname === '/vigilancia/controle-documentos' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className="text-lg">📂</span> Controle de Docs
      </a>
      
      <a 
        href="/vigilancia/lista-mestra" 
        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${pathname === '/vigilancia/lista-mestra' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className="text-lg">📑</span> Lista Mestra
      </a>
      
      <a 
        href="/vigilancia/regulamentacoes" 
        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${pathname === '/vigilancia/regulamentacoes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className="text-lg">📚</span> Regulamentações
      </a>

      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">Ajuda</div>
      <a 
        href="/vigilancia/suporte" 
        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-3 ${pathname === '/vigilancia/suporte' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <span className="text-lg">🎧</span> Suporte
      </a>

      <div className="mt-auto pt-6 mb-4">
        <a 
          href="/" 
          className="mx-3 px-4 py-3 rounded-xl text-sm font-bold bg-slate-900 text-white flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Sair do Think Plus
        </a>
      </div>
    </nav>
  );
}
