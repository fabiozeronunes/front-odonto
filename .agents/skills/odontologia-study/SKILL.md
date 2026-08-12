---
name: odontologia-study
description: >-
  Use when planning, designing, implementing, testing, or reviewing a
  dental/odontology study web application (odonto, odontologia, plataforma de
  estudos odontológicos). Guides full-stack planning and incremental build of a
  member-based video study platform with specialties, case studies, tags,
  search, recommendations, members area, free/premium plans, and Shopping
  Odonto admin panel.
---
# SKILL — Aplicativo de Estudo Odontológico

## 1. Objetivo da Skill

Esta Skill orienta o OpenCode a **planejar, projetar, implementar, testar e revisar** um aplicativo web de estudos odontológicos.

O sistema será uma plataforma de aprendizagem voltada principalmente para estudantes de Odontologia, permitindo:

- cadastro e organização de vídeos de estudo;
- cadastro por área de especialidade odontológica;
- cadastro por estudo de caso;
- utilização de tags para facilitar buscas e descoberta;
- recomendação de vídeos relacionados ao conteúdo visualizado;
- autenticação e área de membros;
- níveis de acesso gratuito e pago;
- área de Shopping Odonto para produtos destinados aos membros;
- painel administrativo para gerenciamento da plataforma;
- arquitetura preparada para crescimento futuro.

A Skill deve trabalhar em **duas grandes fases obrigatórias**:

1. **Planejamento e validação**
2. **Construção e implementação**

Nunca iniciar a implementação completa sem antes apresentar o planejamento e obter confirmação do usuário quando houver decisões relevantes de arquitetura, UX, segurança, pagamentos ou regras de negócio.

---

# 2. Stack tecnológica inicial

A stack principal definida para o projeto é:

- Frontend: **React**
- Backend: **Node.js**
- API: REST ou arquitetura equivalente bem estruturada
- Banco de dados: escolher a opção mais adequada após analisar o projeto, priorizando PostgreSQL para produção quando não houver motivo técnico contrário.
- Autenticação: sistema seguro baseado em sessão/token, com suporte a recuperação de senha.
- Frontend responsivo: desktop, tablet e mobile.
- Arquitetura preparada para integração com serviços externos.

### Regra importante

Antes de iniciar a implementação, o agente deve confirmar as decisões tecnológicas que ainda não estiverem definidas.

Perguntar, quando necessário:

- React com Vite, Next.js ou outra abordagem?
- Node.js com Express, Fastify, NestJS ou outra opção?
- PostgreSQL ou outro banco?
- ORM desejado?
- Estratégia de autenticação?
- Serviço de armazenamento dos vídeos?
- Os vídeos serão hospedados no próprio sistema ou incorporados de plataformas externas?
- Gateway de pagamento?
- Estratégia de hospedagem/deploy?
- Tipografia?
- Identidade visual?
- Sistema de componentes/UI?
- Serviço de e-mail?
- Armazenamento de imagens?
- Necessidade de notificações?

Se o usuário não tiver preferência, recomendar a alternativa moderna, estável, segura e de fácil manutenção, explicando brevemente o motivo.

---

# 3. Fluxo obrigatório da Skill

## FASE 1 — Descoberta

Antes de escrever código:

1. analisar os arquivos existentes do projeto;
2. identificar se já existe aplicação;
3. identificar stack atual;
4. identificar banco de dados;
5. identificar padrões de código;
6. identificar autenticação existente;
7. identificar componentes reutilizáveis;
8. identificar configurações de ambiente;
9. identificar integrações já existentes;
10. verificar documentação disponível.

Não substituir arquitetura existente sem necessidade.

Caso exista código aproveitável, preservar e evoluir.

---

# 4. Levantamento funcional

O agente deve estruturar o produto nas seguintes áreas.

## 4.1 Área pública

Possíveis páginas:

- Home;
- catálogo de estudos;
- especialidades;
- estudos de caso;
- busca;
- detalhes de vídeo;
- planos;
- login;
- cadastro;
- recuperação de senha;
- Shopping Odonto;
- detalhes de produto;
- páginas institucionais.

A área pública deve permitir descoberta de conteúdo sem expor informações que pertençam exclusivamente aos membros pagos.

---

# 5. Área de membros

O sistema deverá possuir autenticação e área privada.

Tipos mínimos de usuário:

### Aluno gratuito

Pode:

- criar conta;
- acessar conteúdos liberados;
- visualizar vídeos gratuitos;
- pesquisar conteúdos;
- utilizar filtros;
- visualizar informações dos conteúdos;
- utilizar tags e categorias;
- acessar funcionalidades permitidas pelo plano.

### Aluno pago

Além das funcionalidades gratuitas:

- acessar conteúdos exclusivos;
- acessar conteúdos premium;
- visualizar materiais restritos;
- acessar benefícios definidos pelo plano;
- ter acesso aos produtos/benefícios destinados aos membros pagos;
- receber futuramente funcionalidades adicionais de assinatura.

### Administrador

Pode:

- administrar usuários;
- administrar vídeos;
- administrar especialidades;
- administrar estudos de caso;
- administrar tags;
- administrar categorias;
- administrar planos;
- administrar produtos;
- administrar pedidos;
- administrar permissões;
- visualizar métricas;
- moderar conteúdos;
- publicar/despublicar conteúdos.

Se necessário, criar também papéis intermediários, como editor/moderador.

---

# 6. Cadastro de vídeos

O cadastro de vídeo é uma das funcionalidades centrais.

O aluno autorizado deverá poder cadastrar um vídeo informando, no mínimo:

- título;
- descrição;
- link do vídeo ou origem do vídeo;
- thumbnail;
- especialidade;
- tipo de conteúdo;
- estudo de caso relacionado, quando aplicável;
- tags;
- nível de dificuldade;
- autor;
- instituição, quando aplicável;
- data;
- duração, quando disponível;
- indicação de conteúdo gratuito ou premium;
- status de publicação.

### Tipos de origem de vídeo

A arquitetura deve permitir inicialmente:

- URL externa;
- vídeo incorporado;
- futuramente upload próprio.

Não assumir que todos os vídeos serão armazenados no servidor.

A plataforma deve permitir ampliar as fontes posteriormente.

---

# 7. Especialidades odontológicas

Criar estrutura para categorizar conteúdos por especialidade.

Exemplos:

- Dentística;
- Endodontia;
- Periodontia;
- Ortodontia;
- Implantodontia;
- Cirurgia Bucomaxilofacial;
- Odontopediatria;
- Prótese Dentária;
- Radiologia Odontológica;
- Estomatologia;
- Odontologia Restauradora;
- Harmonização Orofacial;
- Saúde Coletiva;
- DTM;
- Patologia Oral;
- outras.

A lista deve ser administrável pelo painel administrativo.

Não deixar especialidades fixas no código quando elas puderem ser cadastradas no banco.

---

# 8. Estudos de caso

Criar uma entidade própria para estudos de caso.

Um estudo de caso poderá possuir:

- título;
- descrição;
- diagnóstico;
- área/especialidade;
- imagens;
- vídeos relacionados;
- documentos;
- tags;
- nível de dificuldade;
- autor;
- data;
- status;
- conteúdos relacionados.

Um estudo de caso poderá possuir vários vídeos.

Um vídeo poderá estar relacionado a um ou mais estudos de caso, se a regra de negócio permitir.

---

# 9. Sistema de Tags

Implementar sistema de tags.

Exemplos:

- canal radicular;
- restauração;
- implante;
- cirurgia;
- diagnóstico;
- anestesia;
- radiografia;
- materiais odontológicos;
- técnica clínica.

As tags devem ser pesquisáveis.

Ao clicar em uma tag, mostrar conteúdos relacionados.

O sistema deve permitir:

- criar;
- editar;
- excluir;
- associar;
- pesquisar;
- contar utilização.

---

# 10. Busca e descoberta de conteúdo

Criar busca global.

O usuário deverá conseguir pesquisar por:

- título;
- descrição;
- especialidade;
- estudo de caso;
- tags;
- autor;
- termos relacionados.

Filtros sugeridos:

- especialidade;
- tipo;
- nível;
- gratuito/premium;
- tags;
- data;
- popularidade;
- duração.

---

# 11. Vídeo e conteúdos relacionados

Quando o usuário abrir um vídeo:

### Estrutura sugerida

1. título;
2. player;
3. descrição;
4. especialidade;
5. tags;
6. estudo de caso relacionado;
7. informações complementares;
8. ações do usuário;
9. vídeos relacionados.

### Vídeos relacionados

O sistema deve apresentar conteúdos pertinentes ao vídeo atual.

A primeira versão pode utilizar regras como:

- mesma especialidade;
- mesmas tags;
- mesmo estudo de caso;
- categoria semelhante;
- nível semelhante.

Posteriormente, a arquitetura poderá evoluir para um sistema de recomendação baseado em comportamento.

Evitar recomendar o próprio vídeo.

Priorizar conteúdos que tenham maior relevância.

---

# 12. Histórico e progresso

Preparar arquitetura para:

- histórico de vídeos assistidos;
- progresso de visualização;
- favoritos;
- vídeos salvos;
- continuar assistindo;
- conteúdos concluídos.

Essas funcionalidades devem ser consideradas desde a modelagem, mesmo que algumas sejam implementadas em uma segunda etapa.

---

# 13. Shopping Odonto

Criar uma área chamada:

**Shopping Odonto**

O Shopping será destinado à comercialização ou apresentação de produtos para membros.

Estrutura mínima:

### Produto

- nome;
- descrição;
- preço;
- preço promocional;
- imagens;
- categoria;
- SKU;
- estoque;
- status;
- destaque;
- disponibilidade para gratuito/pago;
- fabricante/marca;
- tags.

### Categorias

Devem ser administráveis.

Exemplos:

- Instrumentais;
- Materiais;
- Equipamentos;
- Livros;
- Cursos;
- Acessórios;
- EPIs;
- Produtos para estudantes;
- Outros.

---

# 14. Regras de acesso do Shopping

O sistema deve permitir configurar produtos como:

- público;
- exclusivo para membros gratuitos;
- exclusivo para membros pagos;
- benefício especial para determinado plano.

A regra de acesso deve ser configurável.

---

# 15. Carrinho e pedidos

Preparar arquitetura para:

- adicionar ao carrinho;
- remover do carrinho;
- alterar quantidade;
- calcular subtotal;
- aplicar desconto;
- finalizar pedido;
- acompanhar pedido;
- histórico de pedidos.

Se pagamentos forem implementados, não armazenar dados sensíveis de cartão diretamente no banco.

Utilizar gateway de pagamento apropriado.

---

# 16. Planos de membros

Criar estrutura de planos.

Exemplo:

### Gratuito

- acesso a conteúdos gratuitos;
- busca;
- tags;
- funcionalidades básicas.

### Premium

- conteúdos premium;
- estudos de caso exclusivos;
- benefícios especiais;
- acesso diferenciado ao Shopping;
- funcionalidades adicionais.

O sistema deve permitir criar outros planos futuramente sem alteração estrutural importante.

Cada plano deverá possuir:

- nome;
- descrição;
- preço;
- periodicidade;
- benefícios;
- status;
- ordem de exibição.

---

# 17. Assinaturas

Preparar o sistema para:

- assinatura mensal;
- assinatura anual;
- upgrade;
- downgrade;
- cancelamento;
- renovação;
- status da assinatura;
- período de acesso;
- histórico de pagamentos.

O acesso premium deve depender do status real da assinatura.

Não confiar somente em informações vindas do frontend.

---

# 18. Painel administrativo

Criar dashboard administrativo.

Indicadores sugeridos:

- usuários cadastrados;
- alunos gratuitos;
- alunos pagos;
- assinaturas ativas;
- vídeos cadastrados;
- vídeos publicados;
- especialidades;
- estudos de caso;
- tags;
- produtos;
- pedidos;
- faturamento;
- conteúdos mais acessados;
- vídeos mais assistidos;
- conteúdos mais favoritados.

Criar navegação administrativa organizada.

---

# 19. Modelagem inicial

Considerar entidades semelhantes a:

- User
- Role
- MembershipPlan
- Subscription
- Payment
- Video
- VideoSource
- Specialty
- CaseStudy
- Tag
- VideoTag
- CaseStudyTag
- VideoCaseStudy
- Favorite
- WatchHistory
- WatchProgress
- Product
- ProductCategory
- ProductTag
- Cart
- CartItem
- Order
- OrderItem
- Coupon
- Media
- Notification

A modelagem final deve ser definida após análise do projeto.

Não criar tabelas desnecessárias apenas por antecipação.

---

# 20. Segurança

A Skill deve exigir:

- senhas com hash seguro;
- autenticação segura;
- autorização no backend;
- proteção de rotas;
- validação de entrada;
- sanitização;
- proteção contra SQL Injection;
- proteção contra XSS;
- proteção contra CSRF quando aplicável;
- rate limiting;
- controle de acesso por função;
- controle de acesso por plano;
- logs de ações administrativas;
- variáveis sensíveis em ambiente;
- nunca colocar secrets no frontend;
- tratamento seguro de webhooks de pagamento.

---

# 21. LGPD

Como o sistema poderá armazenar dados pessoais de estudantes, a implementação deverá considerar LGPD.

Preparar:

- política de privacidade;
- termos de uso;
- consentimentos quando necessários;
- finalidade de coleta;
- gerenciamento de dados;
- exclusão de conta;
- controle de acesso;
- minimização de dados;
- proteção de informações pessoais.

Não coletar dados desnecessários.

---

# 22. UX/UI

O aplicativo deve ter aparência moderna, profissional e voltada para educação odontológica.

Princípios:

- interface limpa;
- excelente legibilidade;
- navegação simples;
- busca em destaque;
- cards de vídeos;
- cards de especialidades;
- cards de estudos de caso;
- área de conteúdo premium claramente identificada;
- responsividade;
- acessibilidade;
- estados de loading;
- estados vazios;
- mensagens de erro claras;
- feedback visual das ações.

Antes de implementar a identidade visual definitiva, perguntar:

- possui logo?
- possui cores?
- existe identidade visual?
- existe tipografia definida?
- existe referência visual?
- prefere aparência mais acadêmica, tecnológica, clínica ou premium?

Se o usuário não possuir identidade visual, propor uma direção visual e solicitar confirmação.

---

# 23. Arquitetura de frontend

Organizar o React com separação clara entre:

- páginas;
- layouts;
- componentes;
- componentes de domínio;
- hooks;
- serviços;
- estado;
- autenticação;
- permissões;
- chamadas de API;
- validações;
- tipos/interfaces;
- utilitários.

Evitar componentes gigantes.

Criar componentes reutilizáveis.

---

# 24. Arquitetura de backend

Organizar Node.js em camadas.

Exemplo:

- routes;
- controllers;
- services;
- repositories;
- entities/models;
- middlewares;
- validators;
- auth;
- permissions;
- integrations;
- jobs;
- utilities.

As regras de negócio devem permanecer no backend.

---

# 25. API

Criar API documentada.

Endpoints devem contemplar, conforme necessário:

### Auth

- cadastro;
- login;
- logout;
- recuperação de senha;
- alteração de senha;
- usuário atual.

### Vídeos

- listar;
- buscar;
- visualizar;
- cadastrar;
- editar;
- excluir;
- publicar;
- relacionar.

### Especialidades

- listar;
- criar;
- editar;
- excluir.

### Estudos de caso

- listar;
- visualizar;
- criar;
- editar;
- excluir.

### Tags

- listar;
- criar;
- editar;
- excluir.

### Membros

- perfil;
- plano;
- assinatura;
- histórico.

### Shopping

- produtos;
- categorias;
- carrinho;
- pedidos.

### Administração

- dashboard;
- usuários;
- conteúdos;
- produtos;
- planos;
- métricas.

---

# 26. Pesquisa e performance

A arquitetura deve ser preparada para grande quantidade de vídeos.

Considerar:

- índices no banco;
- paginação;
- busca otimizada;
- lazy loading;
- cache quando necessário;
- otimização de imagens;
- thumbnails;
- carregamento progressivo;
- consultas eficientes.

Nunca carregar todos os vídeos de uma vez.

---

# 27. SEO

Para páginas públicas:

- títulos adequados;
- meta description;
- URLs amigáveis;
- Open Graph;
- sitemap;
- robots.txt;
- dados estruturados quando aplicável;
- conteúdo semanticamente organizado.

A área privada não deve ser indexada.

---

# 28. Acessibilidade

Seguir boas práticas de acessibilidade:

- navegação por teclado;
- contraste adequado;
- labels;
- textos alternativos;
- foco visível;
- HTML semântico;
- suporte a leitores de tela;
- mensagens de erro acessíveis.

---

# 29. Responsividade

O sistema deve funcionar corretamente em:

- celular;
- tablet;
- notebook;
- desktop;
- telas grandes.

Priorizar experiência mobile para estudantes.

---

# 30. Fluxo de planejamento

Ao iniciar o projeto, o agente deve apresentar:

## Etapa 1 — Diagnóstico

Informar:

- estado atual do projeto;
- tecnologias existentes;
- problemas encontrados;
- oportunidades;
- dependências.

## Etapa 2 — Arquitetura

Apresentar:

- arquitetura frontend;
- arquitetura backend;
- banco;
- autenticação;
- permissões;
- armazenamento;
- pagamentos;
- integrações.

## Etapa 3 — Banco

Apresentar:

- entidades;
- relacionamentos;
- índices;
- regras de acesso.

## Etapa 4 — UX

Apresentar:

- mapa de páginas;
- navegação;
- principais fluxos;
- experiência de usuário.

## Etapa 5 — Roadmap

Dividir em fases.

Sugestão:

### MVP

- autenticação;
- usuários;
- especialidades;
- vídeos;
- tags;
- estudos de caso;
- busca;
- vídeos relacionados;
- área de membros;
- planos gratuito/premium;
- painel administrativo básico.

### Fase 2

- assinatura;
- pagamentos;
- Shopping Odonto;
- carrinho;
- pedidos;
- histórico;
- favoritos;
- progresso.

### Fase 3

- recomendação inteligente;
- notificações;
- gamificação;
- certificados;
- avaliações;
- comentários;
- ranking;
- analytics avançado.

---

# 31. Regra de confirmação

Depois de apresentar o planejamento, o agente deve perguntar ao usuário se pode iniciar a construção.

Exemplo:

"Planejamento concluído. A arquitetura proposta está pronta para implementação. Deseja que eu inicie a construção?"

Quando o usuário confirmar, iniciar a implementação.

---

# 32. Implementação incremental

Nunca tentar criar todo o sistema de uma vez sem validação.

Implementar por módulos:

1. fundação do projeto;
2. banco;
3. autenticação;
4. usuários/permissões;
5. especialidades;
6. vídeos;
7. tags;
8. estudos de caso;
9. busca;
10. recomendações;
11. planos;
12. assinaturas;
13. Shopping;
14. pedidos;
15. dashboard;
16. segurança;
17. testes;
18. performance;
19. SEO;
20. deploy.

Após cada módulo:

- verificar erros;
- executar testes;
- verificar integração;
- revisar UX;
- corrigir problemas;
- documentar alterações.

---

# 33. Testes

Criar testes adequados para:

- autenticação;
- autorização;
- criação de vídeos;
- busca;
- tags;
- estudos de caso;
- regras de plano;
- assinatura;
- produtos;
- carrinho;
- pedidos;
- permissões administrativas.

Testar principalmente regras críticas no backend.

---

# 34. Dados de demonstração

Quando útil, criar seed inicial com:

- especialidades;
- tags;
- vídeos fictícios;
- estudos de caso;
- usuário gratuito;
- usuário premium;
- administrador;
- categorias de produtos;
- produtos de exemplo.

Nunca usar dados reais sem autorização.

---

# 35. Tratamento de erros

Implementar:

- mensagens amigáveis no frontend;
- logs técnicos no backend;
- códigos HTTP adequados;
- tratamento de falhas de integração;
- tratamento de webhook;
- tratamento de indisponibilidade de serviços externos.

Nunca expor stack traces ou secrets para o usuário.

---

# 36. Variáveis de ambiente

Criar `.env.example` contendo apenas nomes das variáveis necessárias.

Exemplos:

- DATABASE_URL
- JWT_SECRET ou equivalente;
- API_URL;
- STORAGE_URL;
- STORAGE_KEY;
- PAYMENT_PROVIDER_KEY;
- PAYMENT_WEBHOOK_SECRET;
- EMAIL_PROVIDER_KEY.

Nunca gravar credenciais reais no código.

---

# 37. Documentação

Manter documentação atualizada.

Criar, quando necessário:

- README;
- arquitetura;
- configuração;
- instalação;
- banco;
- API;
- autenticação;
- pagamentos;
- deploy;
- variáveis de ambiente.

---

# 38. Regra de análise antes de alterar

Antes de criar ou modificar qualquer arquivo:

1. ler o arquivo;
2. entender dependências;
3. identificar impacto;
4. verificar se existe implementação semelhante;
5. reutilizar quando possível;
6. somente depois alterar.

Não sobrescrever arquivos sem necessidade.

---

# 39. Regra de qualidade

O agente deve priorizar:

- código limpo;
- segurança;
- manutenção;
- escalabilidade;
- acessibilidade;
- performance;
- UX;
- tipagem quando aplicável;
- componentes reutilizáveis;
- baixo acoplamento;
- documentação.

Não implementar soluções improvisadas apenas para "fazer funcionar".

---

# 40. Regra de comunicação com o usuário

Sempre informar:

- o que foi analisado;
- o que será feito;
- decisões importantes;
- problemas encontrados;
- o que foi implementado;
- testes realizados;
- próximos passos.

Quando uma decisão impactar custo, segurança, experiência ou arquitetura, perguntar antes.

---

# 41. Critério de conclusão

O trabalho somente deve ser considerado concluído quando:

- aplicação inicia corretamente;
- frontend funciona;
- backend funciona;
- banco funciona;
- autenticação funciona;
- autorização funciona;
- regras gratuito/premium funcionam;
- cadastro de vídeos funciona;
- especialidades funcionam;
- tags funcionam;
- estudos de caso funcionam;
- busca funciona;
- vídeos relacionados funcionam;
- painel administrativo funciona;
- Shopping funciona conforme escopo implementado;
- erros críticos foram corrigidos;
- testes principais passaram;
- responsividade foi verificada;
- documentação foi atualizada.

---

# 42. Princípio final

Esta Skill deve agir como um **arquiteto + desenvolvedor full-stack + revisor técnico**.

A prioridade é construir uma plataforma odontológica profissional, escalável e segura.

Não assumir decisões importantes sem confirmação quando elas alterarem significativamente o produto.

Quando houver dúvida sobre uma regra de negócio, perguntar.

Quando houver uma decisão puramente técnica de baixo impacto, escolher a alternativa mais moderna, estável, segura e sustentável e registrar a decisão.

O resultado esperado é uma plataforma de estudos odontológicos com:

**Conteúdo → Especialidades → Estudos de Caso → Tags → Busca → Recomendações → Área de Membros → Planos Gratuito/Premium → Shopping Odonto → Administração.**
