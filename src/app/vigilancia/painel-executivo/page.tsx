"use client";

import React, { useEffect, useState } from 'react';

export default function PainelExecutivoPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full">
      <div className="mb-10">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase border-b-2 border-green-400 pb-2 inline-block">
          ABA 6: PAINEL EXECUTIVO E CERTIFICAÇÃO
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-center justify-between mt-16 px-4">
        {/* Esquerda: Índice de Maturidade */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-sm">
          <h2 className="text-8xl md:text-9xl font-black text-slate-900 tracking-tighter mb-4">
            9.2
          </h2>
          <h3 className="text-lg md:text-xl font-black text-green-500 uppercase tracking-widest mb-6">
            ÍNDICE DE MATURIDADE
          </h3>
          <p className="text-slate-500 font-medium leading-relaxed">
            O estabelecimento apresenta alta conformidade com requisitos críticos, necessitando apenas de ajustes pontuais em documentação secundária.
          </p>
        </div>

        {/* Direita: Resumo Estratégico Card */}
        <div className="flex-1 w-full lg:min-w-[500px]">
          <div className="bg-[#111827] rounded-3xl p-8 md:p-12 shadow-2xl text-white">
            <h4 className="text-xl font-bold mb-8">Resumo Estratégico</h4>
            
            <div className="space-y-6">
              {/* Progresso 1 */}
              <div className="border-b border-slate-700/50 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300 font-medium text-sm">Conformidade Crítica</span>
                  <span className="font-bold text-sm text-white">100%</span>
                </div>
              </div>

              {/* Progresso 2 */}
              <div className="border-b border-slate-700/50 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300 font-medium text-sm">Gestão Documental</span>
                  <span className="font-bold text-sm text-white">74%</span>
                </div>
              </div>

              {/* Progresso 3 */}
              <div className="border-b border-slate-700/50 pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300 font-medium text-sm">Infraestrutura</span>
                  <span className="font-bold text-sm text-white">96%</span>
                </div>
              </div>

              {/* Risco Estimado */}
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium text-sm">Risco Sanitário Estimado</span>
                  <span className="font-bold text-sm text-green-400">BAIXO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
