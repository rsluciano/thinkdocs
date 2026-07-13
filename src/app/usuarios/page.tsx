"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Usuarios() {
  const router = useRouter();

  // Auth Check Simples (Protótipo)
  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (!userStr) {
      router.push('/login');
    } else {
      const user = JSON.parse(userStr);
      if (!['Administrador', 'Diretor', 'Gestor da Qualidade'].includes(user.funcao)) {
        router.push('/');
        return;
      }
      fetch(`/api/usuarios?empresaId=${user.empresaId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Ordenar em ordem alfabética
            const dataOrdenada = data.sort((a, b) => a.nome.localeCompare(b.nome));
            setUsuarios(dataOrdenada);
          }
        });
    }
  }, [router]);

  const [showModal, setShowModal] = useState(false);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [simulatedLink, setSimulatedLink] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  
  // Editar/Bloquear
  const [editingUser, setEditingUser] = useState<any>(null);
  const [setoresSelecionados, setSetoresSelecionados] = useState<string[]>(['Geral']);

  // Removido o useEffect avulso pois agora chamamos dentro do auth check

  const handleCadastrar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setSimulatedLink('');

    const formData = new FormData(e.currentTarget);
    const loggedUser = JSON.parse(localStorage.getItem('thinkdocs_user') || '{}');

    const data = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      funcao: formData.get('funcao'),
      setorNome: setoresSelecionados.join(', ') || 'Geral', // array vira string para exibir facil na tabela
      senha: formData.get('senha'),
      empresaId: loggedUser.empresaId,
      empresaNome: loggedUser.empresaNome,
      empresaLogo: loggedUser.empresaLogo
    };

    try {
      if (editingUser) {
        // Atualizar
        const response = await fetch(`/api/usuarios/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: data.nome,
            email: data.email,
            funcao: data.funcao,
            setor: data.setorNome
          })
        });
        const result = await response.json();
        if (response.ok) {
          setMessage('Usuário atualizado com sucesso!');
          setUsuarios(usuarios.map(u => u.id === editingUser.id ? { ...u, ...result } : u));
          setTimeout(() => setShowModal(false), 1500);
        } else {
          setMessage(`Erro: ${result.error}`);
        }
      } else {
        // Cadastrar
        const response = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (response.ok) {
          setMessage('Usuário cadastrado! Conta Pendente de Ativação.');
          setSimulatedLink(result._simulatedEmailLink);
          const novaLista = [result, ...usuarios].sort((a, b) => a.nome.localeCompare(b.nome));
          setUsuarios(novaLista);
        } else {
          setMessage(`Erro: ${result.error}`);
        }
      }
    } catch (error) {
      setMessage('Erro ao tentar salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setSetoresSelecionados(user.setor.split(', '));
    setMessage('');
    setSimulatedLink('');
    setShowModal(true);
  };

  const handleDelete = async (user: any) => {
    if (!window.confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR definitivamente o usuário ${user.nome}? Esta ação não pode ser desfeita.`)) return;

    try {
      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setUsuarios(usuarios.filter(u => u.id !== user.id));
      } else {
        alert('Falha ao excluir o usuário.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  };

  const handleForceActivate = async (user: any) => {
    if (!window.confirm(`Deseja ativar manualmente a conta de ${user.nome}?`)) return;

    try {
      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ativo' })
      });
      if (response.ok) {
        setUsuarios(usuarios.map(u => u.id === user.id ? { ...u, status: 'Ativo' } : u));
        alert('Conta ativada com sucesso!');
      } else {
        alert('Falha ao ativar a conta.');
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-3xl font-bold">Gestão de Usuários e Acessos</h1>
        <button 
          onClick={() => { 
            setEditingUser(null);
            setSetoresSelecionados(['Geral']);
            setShowModal(true); 
            setMessage(''); 
            setSimulatedLink(''); 
          }}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Cadastrar Usuário
        </button>
      </div>

      {showModal && (
        <div style={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: 'var(--radius)' }}>
          <h3 className="font-bold text-xl" style={{ marginBottom: '1rem', color: '#3730a3' }}>
            {editingUser ? 'Editar Usuário' : 'Novo Cadastro de Usuário'}
          </h3>
          
          {simulatedLink ? (
            <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', marginBottom: '1rem' }}>
              <strong>{message}</strong>
              <p style={{ marginTop: '0.5rem' }}>O sistema simulou o envio de um e-mail. Para ativar a conta, acesse o link abaixo (ou repasse ao usuário):</p>
              <a href={simulatedLink} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 'bold', wordBreak: 'break-all', display: 'block', marginTop: '0.5rem' }}>
                {simulatedLink}
              </a>
              <button onClick={() => setShowModal(false)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleCadastrar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input name="nome" type="text" placeholder="Nome Completo" defaultValue={editingUser?.nome} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
              <input name="email" type="email" placeholder="E-mail" defaultValue={editingUser?.email} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'white' }} title="Você pode alterar o e-mail se necessário" />
              
              <select name="funcao" required defaultValue={editingUser?.funcao} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <option value="">Selecione o Nível de Acesso (Função)</option>
                <option value="Administrador">Administrador (Acesso Total)</option>
                <option value="Diretor">Diretor (Aprovação Final)</option>
                <option value="Gestor da Qualidade">Gestor da Qualidade (Edição e Aprovação)</option>
                <option value="Responsável Técnico">Responsável Técnico (Edição e Aprovação)</option>
                <option value="Líder de Setor">Líder de Setor (Edição Setorial)</option>
                <option value="Colaborador Operacional">Colaborador Operacional (Técnico, Limpeza, etc - Leitura Obrigatória)</option>
              </select>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Setores de Atuação</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'white' }}>
                  {[
                    "Recepção e Atendimento", "Coleta", "Triagem", "Bioquímica", 
                    "Hematologia", "Imunologia", "Microbiologia", 
                    "Urinálise", "Parasitologia",
                    "Qualidade", "Faturamento", "TI e Infraestrutura", "Área Técnica", 
                    "Administrativo", "Diretoria", "Limpeza", "Geral"
                  ].map(opcao => (
                    <label key={opcao} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={setoresSelecionados.includes(opcao)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            if (opcao === 'Área Técnica') {
                              const toAdd = ['Área Técnica', 'Bioquímica', 'Hematologia', 'Microbiologia', 'Urinálise', 'Imunologia', 'Parasitologia'];
                              setSetoresSelecionados(prev => Array.from(new Set([...prev, ...toAdd])));
                            } else {
                              setSetoresSelecionados(prev => [...prev, opcao]);
                            }
                          } else {
                            setSetoresSelecionados(prev => prev.filter(s => s !== opcao));
                          }
                        }}
                      />
                      {opcao}
                    </label>
                  ))}
                </div>
              </div>

              {!editingUser && (
                <div style={{ position: 'relative' }}>
                  <input 
                    name="senha" 
                    type={showSenha ? "text" : "password"} 
                    placeholder="Senha Provisória" 
                    required 
                    style={{ width: '100%', padding: '0.5rem', paddingRight: '2.5rem', borderRadius: '4px', border: '1px solid var(--border)' }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      color: 'var(--muted)'
                    }}
                    title={showSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showSenha ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', flex: 1 }}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Cadastro'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem', cursor: 'pointer', flex: 1 }}>
                  Cancelar
                </button>
              </div>
              {message && <div style={{ gridColumn: 'span 2', color: message.includes('Erro') ? 'red' : 'green', fontWeight: 'bold' }}>{message}</div>}
            </form>
          )}
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '1rem' }}>Nome</th>
              <th style={{ padding: '1rem' }}>E-mail</th>
              <th style={{ padding: '1rem' }}>Função (Acesso)</th>
              <th style={{ padding: '1rem' }}>Setor</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center' }}>Nenhum usuário cadastrado.</td></tr>
            ) : usuarios.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{user.nome}</td>
                <td style={{ padding: '1rem' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    backgroundColor: user.funcao === 'Administrador' ? '#f3e8ff' : '#e0f2fe',
                    color: user.funcao === 'Administrador' ? '#7e22ce' : '#0369a1'
                  }}>
                    {user.funcao}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>{user.setor}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    backgroundColor: user.status === 'Ativo' ? '#dcfce7' : user.status === 'Pendente' ? '#fef08a' : '#fee2e2',
                    color: user.status === 'Ativo' ? '#166534' : user.status === 'Pendente' ? '#854d0e' : '#991b1b'
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button onClick={() => handleEdit(user)} style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem', cursor: 'pointer' }}>✏️ Editar</button>
                  
                  {user.status === 'Pendente' && (
                    <button 
                      onClick={() => handleForceActivate(user)} 
                      style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem', cursor: 'pointer', backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid currentColor', borderRadius: '4px' }}
                    >
                      🔑 Ativar
                    </button>
                  )}

                  <button 
                    onClick={() => handleDelete(user)} 
                    style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', backgroundColor: 'transparent', border: '1px solid currentColor', borderRadius: '4px', color: '#dc2626' }}
                    title="Excluir Colaborador"
                  >
                    🗑️ Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
