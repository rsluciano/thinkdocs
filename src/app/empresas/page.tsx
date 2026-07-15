"use client";
import { fetchAPI } from '@/lib/api';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MeusLaboratorios() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('thinkdocs_user');
    if (!userStr) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(userStr);
      if (parsedUser.funcao !== 'Administrador') {
        router.push('/');
      } else {
        setUser(parsedUser);
      }
    }
  }, [router]);

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      let finalLogoUrl = '';

      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('empresa', nomeEmpresa);
        formData.append('categoria', 'Logos');

        const uploadRes = await fetchAPI('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url) {
          finalLogoUrl = uploadData.url;
        }
      }

      const res = await fetchAPI('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome: nomeEmpresa, 
          logoUrl: finalLogoUrl,
          adminId: user.id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Laboratório criado com sucesso! Alternando contexto...');
        
        // Atualiza a sessão com a nova lista de empresas e troca para o novo lab
        const updatedUser = { ...user };
        updatedUser.empresasPermitidas = data.empresasPermitidas;
        updatedUser.empresaId = data.empresa.id;
        updatedUser.empresaNome = data.empresa.nome;
        updatedUser.empresaLogo = data.empresa.logoUrl;

        localStorage.setItem('thinkdocs_user', JSON.stringify(updatedUser));
        
        // Redireciona para o Dashboard do novo lab
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);

      } else {
        setError(data.error || 'Erro ao criar laboratório');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold" style={{ marginBottom: '2rem' }}>Meus Laboratórios (Consultor Master)</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2 className="text-xl font-bold" style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Cadastrar Novo Laboratório Cliente</h2>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
            Como Gestor Master, você pode criar múltiplos ambientes isolados. Ao criar um novo, você será automaticamente adicionado como Administrador dele.
          </p>

          <form onSubmit={handleCadastrar} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nome do Novo Laboratório</label>
              <input 
                type="text" 
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="Ex: LabMed Centro" 
                required 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Logo do Novo Laboratório (Opcional)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
                style={{ width: '100%', padding: '0.75rem', border: '1px dashed var(--primary)', borderRadius: '4px' }}
              />
            </div>

            {error && <div style={{ color: '#dc2626', fontWeight: 'bold' }}>{error}</div>}
            {success && <div style={{ color: '#166534', fontWeight: 'bold' }}>{success}</div>}

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ padding: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Criando e Configurando...' : '+ Criar Novo Laboratório'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold" style={{ marginBottom: '1.5rem' }}>Laboratórios Vinculados a Você</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {user.empresasPermitidas?.map((emp: any) => (
              <li key={emp.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong>{emp.nome}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>ID: {emp.id}</div>
                </div>
                {user.empresaId === emp.id ? (
                  <span style={{ padding: '0.2rem 0.6rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Em Uso Agora</span>
                ) : (
                  <button 
                    onClick={() => {
                      const updatedUser = { ...user, empresaId: emp.id, empresaNome: emp.nome, empresaLogo: emp.logoUrl || '' };
                      localStorage.setItem('thinkdocs_user', JSON.stringify(updatedUser));
                      window.location.href = '/';
                    }}
                    style={{ padding: '0.4rem 0.8rem', backgroundColor: 'var(--border)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    Mudar para este
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
