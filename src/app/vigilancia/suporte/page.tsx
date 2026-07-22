"use client";

import React, { useEffect, useState } from 'react';

export default function SuportePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-10">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase border-b-2 border-indigo-500 pb-2 inline-block">
          Suporte e Ajuda
        </h1>
        <p className="text-slate-500 mt-3 font-medium">Encontre ajuda, tutoriais e entre em contato com nosso time de especialistas.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Como podemos ajudar?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-3xl">📖</div>
            <div>
              <h3 className="font-bold text-slate-800">Tutoriais e Manuais</h3>
              <p className="text-sm text-slate-500 mt-1">Aprenda a utilizar o sistema passo a passo.</p>
              <button className="mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-800">Acessar Base de Conhecimento →</button>
            </div>
          </div>

          <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-3xl">💬</div>
            <div>
              <h3 className="font-bold text-slate-800">Chat com Especialista</h3>
              <p className="text-sm text-slate-500 mt-1">Fale diretamente com nossa equipe de qualidade.</p>
              <button className="mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-800">Iniciar Chat →</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl shadow-sm p-8 text-white">
        <h2 className="text-xl font-bold mb-2">Ainda precisa de ajuda técnica?</h2>
        <p className="text-slate-400 mb-6 text-sm">Abra um chamado e nossa equipe de TI responderá em até 24h.</p>
        
        <form className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Assunto</label>
            <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Ex: Dúvida sobre o Checklist" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Mensagem</label>
            <textarea rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Descreva o seu problema detalhadamente..." />
          </div>
          <button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Enviar Chamado
          </button>
        </form>
      </div>
    </div>
  );
}
