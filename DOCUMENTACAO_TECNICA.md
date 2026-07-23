# 📖 Documentação Técnica Oficial - ThinkDocs SaaS

Esta documentação provê uma visão geral completa para desenvolvedores e mantenedores do projeto **ThinkDocs**, detalhando a estrutura, arquitetura, rotas e banco de dados.

---

## 🛠️ Stack Tecnológica (Ecossistema)
- **Framework Principal:** [Next.js v16.2.0](https://nextjs.org/) (App Router & Turbopack)
- **Linguagem:** TypeScript + React 19
- **Estilização:** Tailwind CSS v4
- **Banco de Dados:** PostgreSQL (Hospedado local/nuvem)
- **ORM:** Prisma v5.22.0
- **Armazenamento de Arquivos:** Supabase Storage (`supabase-js v2.110`)
- **Autenticação:** JWT Customizado (Jose v6.2) c/ Cookies (HttpOnly) & BcryptJS para hashes
- **Gráficos:** Recharts v3.9.2

---

## 📁 Estrutura de Pastas e Rotas (`/src/app`)

O projeto utiliza o padrão moderno do Next.js **App Router**.

### 🎨 Frontend (Páginas de Interface)
Tudo o que tem `page.tsx` dentro do caminho gera uma rota visível.
- `/login`, `/cadastro`, `/recuperar-senha` ➔ Telas públicas de acesso.
- `/documentos/ler/[id]` ➔ Leitor dinâmico do documento em tela cheia via Iframe seguro.
- `/lista-mestra`, `/setores`, `/categorias` ➔ Views operacionais padrões do SGQ.
- `/vigilancia` ➔ **Módulo Especializado da Vigilância Sanitária**:
  - `/vigilancia/dashboard` ➔ Painel executivo.
  - `/vigilancia/controle-documentos` ➔ Repositório corporativo para RDC 978.
  - `/vigilancia/regulamentacoes` (Matriz RDC 978) ➔ Tela principal de mapeamento de artigos, status e vinculação de documentos probatórios.

### ⚙️ Backend (Rotas de API via Route Handlers)
A pasta `/src/app/api` concentra 100% da lógica de negócio server-side.
- `/api/auth/` ➔ Rotas de Autenticação (`/login`, `/cadastro`).
- `/api/documentos/` ➔ CRUD (Create, Read, Update, Delete) do módulo de documentos.
- `/api/documentos/[id]/anexar` ➔ Vínculo do arquivo ao registro do banco.
- `/api/upload` ➔ Micro-serviço de upload, encaminha arquivos em buffer para o Supabase Storage.
- `/api/download` ➔ Proxy reverso de segurança que busca arquivos via `createSignedUrl` no Supabase validando tokens JWT e o `empresaId`.
- `/api/vigilancia/auditoria/` ➔ Endpoints para salvar conformidades, não conformidades, 5W2H e checklists da RDC 978.

---

## 🗄️ Modelagem de Banco de Dados (Prisma)

A modelagem é projetada com uma arquitetura **Multi-Tenant (Múltiplos Inquilinos)**. Praticamente todas as tabelas possuem uma coluna `empresaId` para isolar os dados de cada clínica/laboratório.

### Entidades Principais (`prisma/schema.prisma`):
1. **`Usuario`**: 
   - Campos vitais: `id`, `nome`, `email`, `senha`, `funcao`, `setor`, `empresaId`.
   - Papéis (`funcao`): Determinam os privilégios no sistema via RBAC (*Role-Based Access Control*).

2. **`Documento`**: 
   - Campos vitais: `codigo`, `titulo`, `arquivoUrl` (nome do arquivo no storage), `status`, `revisao`.
   - Gerencia a matriz base de todos os documentos anexados na plataforma.

3. **`Leitura`**: 
   - Controla a assinatura eletrônica. Registra que determinado `usuarioId` confirmou a leitura da `documentoVersao`.

4. **`RdcItem`**: 
   - É o "Dicionário" normativo (Ex: Art. 154, Inciso I). Tabela global que contém a matriz da lei.

5. **`AuditoriaRdc`**:
   - É o espelho do `RdcItem`, mas preenchido de forma isolada pela empresa.
   - Campos: `conforme`, `evidenciaEncontrada`, `acaoCorretiva`, `status`.

6. **`NaoConformidade`**:
   - Registro autônomo (SGQ) com `analiseCausa`, responsável pela resolução, prazos e relatórios para a Vigilância.

---

## 🔐 Segurança e Boas Práticas Implantadas (SecOps)
- **IDOR Prevention:** Consultas, edições, downloads e exclusões passam por uma trava em nível de API: `if (registro.empresaId !== session.empresaId) return Acesso Negado`.
- **RBAC (Role-Based Access Control):** Funções críticas requerem o cargo `Diretor`, `Administrador` ou `Gestor da Qualidade` extraído do JWT em memória (evitando manipulação de cookies pelo cliente).
- **Storage Privado:** Arquivos PDF, Docx, ou planilhas não são servidos pelo front-end livremente; exige-se uma autorização assinada no backend que expira em 60 segundos.

---

## 💻 Comandos Úteis de Manutenção (Cheat Sheet)

### Para rodar o ambiente:
```bash
# Inicia o servidor local de desenvolvimento
npm run dev

# Recria os artefatos de build para ambiente de produção
npm run build
npm run start
```

### Para interagir com o Banco de Dados:
```bash
# Se alterar o arquivo prisma/schema.prisma, sempre rode:
npx prisma generate
npx prisma db push

# Para abrir uma interface visual do banco de dados (Prisma Studio) e editar registros diretamente:
npx prisma studio
```

### Tratamento de Variáveis de Ambiente (`.env`):
Necessário sempre preencher ao instalar em uma nova máquina:
- `DATABASE_URL`: String de conexão Pooling do PostgreSQL (Supabase/AWS).
- `DIRECT_URL`: String de conexão direta para Migrations.
- `JWT_SECRET`: Hash secreto para assinar e emitir tokens de login (Mantenha seguro).
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Credenciais para instanciar o Supabase Storage client.

---
*Gerado por Antigravity (Sistemas Avançados de Agentes AI)*
