# OdontoStudy — Plataforma de Estudos Odontológicos

Plataforma web de estudos odontológicos com vídeos, especialidades, estudos de caso, tags, busca,
recomendações, área de membros (gratuito/premium) e painel administrativo.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| Banco | PostgreSQL + Prisma ORM |
| Autenticação | JWT (access + refresh) com hash bcrypt |
| Testes | Vitest + Supertest |

## Estrutura

```
front odonto/
├── apps/
│   ├── api/          # Backend Express + Prisma
│   │   ├── prisma/   # schema, migrations e seed
│   │   ├── src/      # rotas, controllers, services, middlewares
│   │   └── tests/    # testes de integração
│   └── web/          # Frontend React + Vite
│       └── src/      # páginas, componentes, lib, types
├── docker-compose.yml
└── .env.example
```

## Requisitos

- Node.js 20+
- PostgreSQL 14+ (ou Docker)

## Instalação

1. Suba o banco:

   ```bash
   docker compose up -d
   ```

   Ou use um PostgreSQL local e crie o banco `odonto_study`.

2. Configure as variáveis de ambiente:

   ```bash
   cp .env.example .env                # raiz (referência)
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

3. Instale as dependências:

   ```bash
   npm install
   ```

4. Migrações e seed (dados de demonstração):

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Rode em desenvolvimento:

   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - API: http://localhost:4000 (`/health`)

## Usuários de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@odonto.study | Admin@123 |
| Aluno Premium | aluno@odonto.study | Usuario@123 |
| Aluno Gratuito | gratuito@odonto.study | Usuario@123 |

## Scripts

```bash
npm run dev          # API + Web em desenvolvimento
npm run build        # build de produção
npm run typecheck    # verificação de tipos
npm run test         # testes do backend
npm run db:migrate   # aplicar migrations
npm run db:seed      # dados de demonstração
```

## Endpoints principais (API)

- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`
- `GET /api/videos` (busca/filtros) · `GET /api/videos/:slug` (detalhe + relacionados)
- `GET /api/specialties` · `GET /api/tags` · `GET /api/case-studies`
- `GET /api/plans`
- `GET /api/admin/dashboard` · `GET /api/admin/users` (admin)

## Funcionalidades implementadas (MVP)

- Autenticação com registro, login, refresh, alteração e recuperação de senha
- Área de membros com perfil, favoritos e histórico
- CRUD de vídeos, especialidades, tags, estudos de caso e planos (admin)
- Busca global e filtros (especialidade, nível, gratuito/premium, popularidade)
- Vídeos relacionados (mesma especialidade/tags)
- Regras de acesso gratuito/premium validadas no backend
- Painel administrativo com métricas e gerenciamento
- Proteção: rate limiting, validação de entrada (zod), hash de senha, CORS, variáveis em `.env`

## Próximas fases (roadmap)

- **Fase 2:** assinaturas e pagamentos (gateway), Shopping Odonto, carrinho e pedidos,
  e-mail transacional, progresso de visualização
- **Fase 3:** recomendação inteligente, notificações, gamificação, certificados, avaliações,
  comentários, analytics avançado

## Segurança e LGPD

- Senhas com hash (bcrypt), tokens JWT com expiração
- Autorização no backend (roles e planos) — nunca confiar no frontend
- Validação e sanitização de entrada, proteção contra injeção (Prisma)
- Política de privacidade e termos de uso incluídos no frontend
- Dados pessoais coletados de forma mínima, com direito à exclusão de conta
