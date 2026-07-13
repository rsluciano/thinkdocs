"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Relatorios() {
  const router = useRouter();
  const [leituras, setLeituras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('thinkdocs_user');
    if (!savedUser) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      // Checagem de lideranca (prototipo simples)
      const isLeadership = ['Diretor', 'Gestor da Qualidade', 'Administrador', 'Responsável Técnico', 'Líder de Setor'].includes(parsedUser.funcao);
      if (!isLeadership) {
        router.push('/');
        return;
      }
      setUser(parsedUser);
      carregarLeituras(parsedUser.empresaId);
    }
  }, [router]);

  const carregarLeituras = async (empresaId: string) => {
    try {
      const res = await fetch(`/api/leituras?empresaId=${empresaId}`);
      const data = await res.json();
      if (res.ok) {
        // Ordena da mais recente para a mais antiga
        setLeituras(data.sort((a: any, b: any) => new Date(b.dataHoraLeitura).getTime() - new Date(a.dataHoraLeitura).getTime()));
      }
    } catch (err) {
      console.error('Erro ao buscar leituras');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-3xl font-bold">Relatório de Treinamento e Leituras</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>Acompanhamento de quem leu e assinou digitalmente os documentos.</p>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando Relatório...</div>
        ) : leituras.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Nenhuma assinatura de leitura registrada ainda.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '1rem' }}>Data da Leitura</th>
                <th style={{ padding: '1rem' }}>Colaborador</th>
                <th style={{ padding: '1rem' }}>Setor</th>
                <th style={{ padding: '1rem' }}>Documento</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Versão Lida</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leituras.map(leitura => (
                <tr key={leitura.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                    {new Date(leitura.dataHoraLeitura).toLocaleDateString('pt-BR')} <br/>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>
                      {new Date(leitura.dataHoraLeitura).toLocaleTimeString('pt-BR')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{leitura.usuarioNome}</td>
                  <td style={{ padding: '1rem' }}>{leitura.usuarioSetor}</td>
                  <td style={{ padding: '1rem' }}>
                    <strong>{leitura.documentoCodigo}</strong><br/>
                    <span style={{ fontSize: '0.85rem' }}>{leitura.documentoTitulo}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ backgroundColor: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      {leitura.documentoVersao}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.3rem 0.6rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      ✅ Ciente
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
