"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CompanyLogo, HeaderClient, SidebarNav } from "./ClientLayoutElements";
import { ThinkPlusLogo, VigilanciaSidebarNav } from "./VigilanciaSidebar";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();

  useEffect(() => {
    // Auth Check Simples para a Sidebar/Header pode ficar aqui se necessário,
    // mas o redirecionamento será tratado pelo fetchAPI nas páginas.
  }, []);

  const isAuthPage = pathname === '/login' || pathname === '/cadastro' || pathname === '/recuperar-senha';

  if (isAuthPage) {
    return <>{children}</>;
  }

  const isVigilancia = pathname.startsWith('/vigilancia');

  return (
    <div className="app-wrapper">
      <aside className={`sidebar ${isVigilancia ? 'bg-slate-50 border-r border-slate-200' : ''}`}>
        <div className="sidebar-header">
          {isVigilancia ? <ThinkPlusLogo /> : <CompanyLogo />}
        </div>
        {isVigilancia ? <VigilanciaSidebarNav /> : <SidebarNav />}
      </aside>
      <main className="main-content">
        <header className="topbar">
          <HeaderClient />
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
