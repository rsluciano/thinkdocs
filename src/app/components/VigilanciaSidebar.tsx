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

  const navItemClass = (path: string) => 
    `px-4 py-3.5 mb-2 rounded-xl text-[15px] font-semibold transition-all flex items-center gap-3 ${
      pathname === path 
        ? 'bg-[#2970ff] text-white shadow-md' 
        : 'text-[#cbd5e1] hover:text-white hover:bg-white/10'
    }`;

  return (
    <nav className="flex flex-col h-full pb-6 px-4 overflow-y-auto custom-scrollbar">
      {/* MENU PRINCIPAL */}
      <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest mb-4 mt-6 px-2">Menu Principal</div>
      
      <a href="/vigilancia/dashboard" className={navItemClass('/vigilancia/dashboard')}>
        <span className="text-xl">📊</span>
        Dashboard
      </a>
      
      <a href="/vigilancia/matriz" className={navItemClass('/vigilancia/matriz')}>
        <span className="text-xl">📋</span>
        Matriz RDC 978
      </a>

      <a href="/vigilancia/plano-acao" className={navItemClass('/vigilancia/plano-acao')}>
        <span className="text-xl">🎯</span>
        Plano de Ação (5W2H)
      </a>

      <a href="/vigilancia/controle-documentos" className={navItemClass('/vigilancia/controle-documentos')}>
        <span className="text-xl">📂</span>
        Documentos
      </a>

      <a href="/vigilancia/checklist" className={navItemClass('/vigilancia/checklist')}>
        <span className="text-xl">✅</span>
        Checklist Auditoria
      </a>

      <a href="/vigilancia/painel-executivo" className={navItemClass('/vigilancia/painel-executivo')}>
        <span className="text-xl">📈</span>
        Painel Executivo
      </a>

      {/* GERENCIAMENTO */}
      <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest mb-4 mt-8 px-2 border-t border-white/10 pt-8">Gerenciamento</div>
      
      <a href="#" className="px-4 py-3.5 mb-2 rounded-xl text-[15px] font-semibold transition-all flex items-center gap-3 text-[#cbd5e1] hover:text-white hover:bg-white/10">
        <span className="text-xl">📁</span>
        Categorias
      </a>

      <a href="#" className="px-4 py-3.5 mb-2 rounded-xl text-[15px] font-semibold transition-all flex items-center gap-3 text-[#cbd5e1] hover:text-white hover:bg-white/10">
        <span className="text-xl">🔬</span>
        Tipos de Serviço
      </a>

      <a href="#" className="px-4 py-3.5 mb-2 rounded-xl text-[15px] font-semibold transition-all flex items-center gap-3 text-[#cbd5e1] hover:text-white hover:bg-white/10">
        <span className="text-xl">👥</span>
        Usuários
      </a>

      <a href="#" className="px-4 py-3.5 mb-2 rounded-xl text-[15px] font-semibold transition-all flex items-center gap-3 text-[#cbd5e1] hover:text-white hover:bg-white/10">
        <span className="text-xl">⚙️</span>
        Configurações
      </a>

      {/* SUPORTE */}
      <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest mb-4 mt-8 px-2 border-t border-white/10 pt-8">Suporte</div>

      <a href="/vigilancia/suporte" className={navItemClass('/vigilancia/suporte')}>
        <span className="text-xl">🎧</span>
        Ajuda
      </a>

      <a href="#" className="px-4 py-3.5 mb-2 rounded-xl text-[15px] font-semibold transition-all flex items-center gap-3 text-[#cbd5e1] hover:text-white hover:bg-white/10">
        <span className="text-xl">📺</span>
        Tutorial
      </a>

      <a href="/vigilancia/suporte" className="px-4 py-3.5 mb-2 rounded-xl text-[15px] font-semibold transition-all flex items-center gap-3 text-[#cbd5e1] hover:text-white hover:bg-white/10">
        <span className="text-xl">🛠️</span>
        Suporte Técnico
      </a>

      <div className="mt-8 mb-4 px-2">
        <div className="bg-[#1e293b]/50 border border-white/10 p-4 rounded-xl">
          <h4 className="text-white font-bold text-sm mb-1">Plano Corporativo</h4>
          <p className="text-[#64748b] text-xs mb-3">Vencimento: 30/12/2025</p>
          <a href="#" className="text-[#3b82f6] text-xs font-semibold hover:text-[#60a5fa] transition-colors">Gerenciar Assinatura</a>
        </div>
      </div>

      <div className="mt-auto px-2 mb-4 pt-4 border-t border-white/5">
        <a 
          href="/" 
          className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-white/5 text-[#94a3b8] hover:bg-white/10 hover:text-white flex items-center justify-center gap-2 transition-all"
        >
          <svg xmlns="http://www.w3.org/O/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Voltar ao ThinkDocs
        </a>
      </div>
    </nav>
  );
}
