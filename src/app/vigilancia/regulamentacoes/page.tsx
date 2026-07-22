"use client";

import React, { useEffect, useState } from 'react';

export default function RegulamentacoesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full">
      <div className="mb-10">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase border-b-2 border-indigo-500 pb-2 inline-block">
          Regulamentações e Normativas
        </h1>
        <p className="text-slate-500 mt-3 font-medium">Acervo de normativas complementares à acreditação.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">RDC 222/2018</h3>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">ANVISA</span>
          </div>
          <p className="text-sm text-slate-600 mb-4 line-clamp-3">
            Boas Práticas de Gerenciamento dos Resíduos de Serviços de Saúde. Regulamenta o plano de gerenciamento de resíduos (PGRSS).
          </p>
          <div className="text-sm font-bold text-indigo-600 flex items-center gap-1">
            <span>Acessar Norma</span>
            <span>→</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">RDC 504/2021</h3>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded">ANVISA</span>
          </div>
          <p className="text-sm text-slate-600 mb-4 line-clamp-3">
            Dispõe sobre as Boas Práticas para o transporte de material biológico humano.
          </p>
          <div className="text-sm font-bold text-indigo-600 flex items-center gap-1">
            <span>Acessar Norma</span>
            <span>→</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">NR 32</h3>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">MTP</span>
          </div>
          <p className="text-sm text-slate-600 mb-4 line-clamp-3">
            Segurança e Saúde no Trabalho em Serviços de Saúde. Medidas de proteção à segurança e à saúde dos trabalhadores.
          </p>
          <div className="text-sm font-bold text-indigo-600 flex items-center gap-1">
            <span>Acessar Norma</span>
            <span>→</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">NR 1</h3>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">MTP</span>
          </div>
          <p className="text-sm text-slate-600 mb-4 line-clamp-3">
            Disposições Gerais e Gerenciamento de Riscos Ocupacionais (PGR e GRO).
          </p>
          <div className="text-sm font-bold text-indigo-600 flex items-center gap-1">
            <span>Acessar Norma</span>
            <span>→</span>
          </div>
        </div>
      </div>
    </div>
  );
}
