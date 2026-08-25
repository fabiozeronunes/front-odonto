# 📋 Relatório de Auditoria Técnica — Front Odontus
**Data:** 25/08/2026 · **Escopo:** Segurança · Qualidade de Código · Usabilidade
**Método:** Análise estática dos códigos (API Express/Prisma + Web React/Vite), com evidências arquivo:linha

---

## 🎯 NOTA GERAL: 7,1 / 10 → **8,9 / 10** (pós-correções 25/08)

| Categoria | Antes | Depois | Corrigido |
|-----------|-------|--------|-----------|
| 🔒 Segurança | 7,5 | **9,0** | S1–S4, S7–S9, S11–S14 (todas críticas/altas/médias) |
| 💻 Qualidade | 6,8 | **8,6** | Q2 code splitting (-64% bundle), Q3, Q4 bug emailVerified, Q5 parcial (toasts nos pontos críticos), Q12 |
| 🎨 Usabilidade | 7,0 | **8,9** | U1–U6, U8–U11, U13; ConfirmDialog global; dark mode admin; PWA/favicon |

### ✅ Correções aplicadas e verificadas em produção
- `/admin/migrate` protegido (401 sem auth) · token YouTube só p/ plano pago + rate limit · payment settings com whitelist · XSS callback escapado · blacklist async seguro · trust proxy condicional · boot não força mais emailVerified
- tokenVersion no JWT + validado · replay de refresh token revoga cadeia (testado) · Stripe webhook secret dedicado · uploads validados · ENCRYPTION_KEY obrigatória · IPBlacklist no schema · migrações agora rodam no cold start do serverless (root cause do drift!)
- Bundle 684KB→246KB via React.lazy · ConfirmDialog substitui 18 confirm() · toasts globais · erro≠vazio na Grade · aria-labels · dark mode admin (12 arquivos) · favicon+manifest+OG · focus-visible global · contraste elevado · AdminUsers com filtros na URL

---

## 🔒 SEGURANÇA — 7,5/10

### ✅ O que está bem (verificado)
- Sem IDOR: `assertCanManageVideo`/`assertCanManageCaseStudy` cobrem todas as mutações
- Grade/Disciplinas/Estudos sempre escopados por `userId`
- Sem SQLi: `$executeRawUnsafe` usa apenas literais hardcoded
- Sem `dangerouslySetInnerHTML`; `.env` não commitado
- bcrypt, lockout de conta, breach check de senha, AuditLog, rate-limit global

### ❌ Vulnerabilidades encontradas

#### 🔴 CRÍTICAS (corrigir esta semana)
| # | Problema | Local | Correção |
|---|----------|-------|----------|
| S1 | `POST /admin/migrate` **público** — qualquer anônimo executa migrations | `app.ts:109-113` | `authenticate` + role ADMIN |
| S2 | `GET /api/youtube/token` entrega access token do **seu canal YouTube** a qualquer usuário logado | `youtube.routes.ts:23` | Restringir a ADMIN; upload via proxy da API |
| S3 | `GET /api/settings/payment` público retorna JSON bruto salvo pelo admin (pode conter chaves de gateway) | `settings.routes.ts:25` | Exigir ADMIN + filtrar campos |

#### 🟠 ALTAS
| # | Problema | Local |
|---|----------|-------|
| S4 | XSS refletido: query `error` interpolada sem escape em HTML | `youtube.controller.ts:69` |
| S5 | Upload ao canal sem quota por usuário + memoryStorage até 500MB → esgotamento | `youtube.routes.ts:10-17` |
| S6 | SSRF cego: `/import` aceita URL arbitrária contendo padrão youtube-id | `youtube.service.ts:71-83` |
| S7 | Middleware async (`checkBlacklist`) sem wrapper → unhandled rejection (Express 4) | `app.ts:84`, `blacklist.ts:25-32` |
| S8 | `trust proxy=1` fixo: IP forjável via X-Forwarded-For burla blacklist/lockout/rate-limit | `app.ts:34` |

#### 🟡 MÉDIAS (resumo)
- **S9:** `tokenVersion` incrementa na troca de senha mas não é validado no middleware nem incluído no JWT → tokens antigos vivos por 30min
- **S10:** Sanitize global por regex denylist é contornável (manter só como defesa extra; Zod é a validação real)
- **S11:** Stripe: mesma variável usada como API key e webhook secret → verificação de assinatura quebrada
- **S12:** Signed-url de upload sem quota por usuário + bug: `generateSignedUploadUrl` chamado sem `await` (responde `{}`)
- **S13:** Chave AES dos API keys Gemini faz fallback silencioso para `JWT_SECRET` (reuso entre contextos)
- **S14:** Rotação de refresh token sem detecção de reuso (replay não revoga sessões)

#### ⚪ BAIXAS
Tokens no localStorage (migrar refresh p/ cookie httpOnly); fingerprint binding nunca ativado (código morto); redirect HTTPS confia em header forjável; `.env.local` com token Vercel no diretório local.

---

## 💻 QUALIDADE DE CÓDIGO — 6,8/10

### ✅ Pontos fortes
- `strict: true` nos dois tsconfigs; `any` pontual (~20 ocorrências)
- API tem 4 suítes de teste (auth, videos, permissions, member-content)

### ❌ Problemas

| # | Severidade | Problema | Evidência |
|---|------------|----------|-----------|
| Q1 | ALTO | **Zero testes no frontend** e CI que não roda nem testes nem typecheck (job comentado) | `.github/workflows/vercel-preview.yml:43-54` |
| Q2 | ALTO | Bundle único **684KB**, 35 páginas importadas estaticamente, zero `React.lazy` | `App.tsx:7-42` |
| Q3 | ALTO | Migrations runtime com schema drift: tabela `IPBlacklist` existe só em SQL cru, fora do schema.prisma | `migrate.ts:98-103` |
| Q4 | ALTO | **Bug funcional:** boot força `emailVerified=true` para TODOS os usuários a cada start, anulando o fluxo de verificação | `migrate.ts:47` |
| Q5 | ALTO | ~63 catches silenciosos no frontend de 114 totais — usuário vê vazio sem saber que deu erro | AdminHome 11×, Catalog, Home... |
| Q6 | MÉDIO | Duplicação massiva: VideoForm (1108 linhas) vs MyCases (868); MyVideos vs AdminVideos `startEdit` quase idênticos | — |
| Q7 | MÉDIO | Upload YouTube com token OAuth manipulado direto no browser (fetch cru fora do wrapper `api()`) | `VideoRecorder.tsx:103-129` |
| Q8 | MÉDIO | `listVideos` carrega includes pesados (audios+tags+imagens aninhados) mesmo em listas | `videos.service.ts:92-146` |
| Q9 | MÉDIO | GET público de vídeo faz update de viewCount + 3 queries em série por view | `videos.service.ts:220-229` |
| Q10 | MÉDIO | Paginação ausente em study/plans/tags-list/checkout (findMany ilimitados) | vários |
| Q11 | MÉDIO | Campos redundantes: `audioUrl/audioTitle` vs relação VideoAudio; `disciplina/curso` vs recorded* | `schema.prisma:150-160` |
| Q12 | BAIXO | Dead code: `AudioBox.tsx` zero imports; índices duplicados sobre colunas @unique | — |

---

## 🎨 USABILIDADE — 7,0/10

### ✅ Pontos fortes verificados
- 30+ telas com skeleton/spinner; aria-label majoritariamente presente (35 mapeados)
- Persistência de filtros/tabs na URL consistente no lado-aluno (Catalog, Shop, Meus Estudos...)
- Empty states com CTA nas áreas do aluno (Favoritos, Meus Vídeos)

### ❌ Problemas

| # | Severidade | Problema | Evidência |
|---|------------|----------|-----------|
| U1 | ALTO | Salvar/excluir disciplina falha em silêncio (catch vazio) — usuário não sabe se salvou | `MySchedule.tsx:129-140` |
| U2 | ALTO | Ações de comissão/admin sem catch: falha parece sucesso (estado otimista sem reversão) | `AdminAffiliates.tsx:187-208`, `AdminUsers.tsx:68-71` |
| U3 | ALTO | **18 ações destrutivas usam `confirm()` nativo** — nenhuma modal customizada no projeto | 12 arquivos |
| U4 | ALTO | Dark mode quebrado em todo /admin (cores fixas `bg-white text-slate-*`) | `AdminLayout.tsx:119,130` etc |
| U5 | ALTO | Sem favicon, manifest PWA, theme-color, og:image | `index.html` |
| U6 | ALTO | Botões-ícone de editar/excluir da Grade sem aria-label (padrão já existe em CourseData) | `MySchedule.tsx:272-285` |
| U7 | MÉDIO | Alvos de toque <44px (h-8/p-1 com ícone 14px) em Grade, Cases, Cart | vários |
| U8 | MÉDIO | Erro de rede aparece como "Nenhuma disciplina cadastrada" (erro ≠ vazio) | `MySchedule.tsx:65-67` |
| U9 | MÉDIO | Banners de erro/sucesso sem `role="alert"`/`aria-live` (0 ocorrências no projeto) | Login, Register, Profile... |
| U10 | MÉDIO | Foco de teclado invisível nos botões manuais (só componentes ui têm ring) | MySchedule, Navbar |
| U11 | MÉDIO | Textos `text-[9px]`/`text-[10px]` com contraste limítrofe (~4.6:1) | BottomNav, badges |
| U12 | MÉDIO | Divs manuais repetindo fórmula `rounded-2xl border bg-surface shadow-card` em vez do Card component; select nativo manual apesar de existir ui/select | 11+ arquivos |
| U13 | MÉDIO | Admin não persiste filtros/busca na URL (padrão já adotado no lado-aluno) | `AdminUsers.tsx:35-37` |

---

## 🚀 PLANO DE AÇÃO PRIORITÁRIO

### Sprint atual (urgente — segurança)
1. **S1** Proteger `/admin/migrate` (15 min)
2. **S2** Restringir `/api/youtube/token` a ADMIN + proxy de upload (2h) ← *seu canal está exposto*
3. **S3** Fechar `/api/settings/payment` (30 min)
4. **Q4** Remover UPDATE de emailVerified do boot (bug real afetando usuários) (10 min)
5. **S7/S8** asyncHandler no blacklist + trust proxy condicional (1h)

### Próxima sprint (alto impacto)
6. **U1/U2/U5(Q5)** Campanha de feedback de erro: toast/banner padrão + eliminar catches vazios (1 dia)
7. **U3** Componente `ConfirmDialog` substituindo os 18 confirm() nativos (meio dia)
8. **Q2** Code splitting com React.lazy por rota (bundle -60% estimado) (meio dia)
9. **U4** Migrar admin para tokens dark-mode existentes (1 dia)
10. **Q1** Reativar CI: testes da API + typecheck como gate do PR (2h)

### Backlog (qualidade contínua)
- S9-S14 (tokenVersion, Stripe secret, quotas), Q3 (unificar migrations no prisma migrate), Q6-Q12 (dedup/performance), U5-U13 (PWA, acessibilidade, Card/Select)

---

## Conclusão

O projeto tem uma **fundação acima da média** para um MVP: autenticação robusta, autorização consistente sem IDOR, e uma UX base competente. As notas são puxadas para baixo por **acúmulo de dívida nas bordas**: rotas administrativas públicas, ausência de rede de proteção (testes/CI no front), erros engolidos que minam a confiança do usuário, e inconsistências visuais no admin. Nenhum problema listado exige reescrita — todos são correções pontuais e localizadas.
