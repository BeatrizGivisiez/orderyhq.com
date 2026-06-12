# Ordery HQ — Documentação Técnica

> Plataforma SaaS de cardápio digital com painel multi-tenant, integração WhatsApp e gestão de vendas.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Variáveis de Ambiente](#3-variáveis-de-ambiente)
4. [Estrutura de Arquivos](#4-estrutura-de-arquivos)
5. [Arquitetura de Dados (Firestore)](#5-arquitetura-de-dados-firestore)
6. [Tipos e Interfaces](#6-tipos-e-interfaces)
7. [Sistema de Temas](#7-sistema-de-temas)
8. [Autenticação e Controle de Acesso](#8-autenticação-e-controle-de-acesso)
9. [Regras de Segurança Firestore](#9-regras-de-segurança-firestore)
10. [Roteamento](#10-roteamento)
11. [Páginas Públicas](#11-páginas-públicas)
12. [Painel do Restaurante (Admin)](#12-painel-do-restaurante-admin)
13. [Painel Master (Super Admin)](#13-painel-master-super-admin)
14. [Componentes Partilhados](#14-componentes-partilhados)
15. [Upload de Imagens (Cloudinary)](#15-upload-de-imagens-cloudinary)
16. [Integração WhatsApp](#16-integração-whatsapp)
17. [Persistência do Carrinho](#17-persistência-do-carrinho)
18. [Notificações em Tempo Real](#18-notificações-em-tempo-real)
19. [Utilitários](#19-utilitários)
20. [Fluxos Principais](#20-fluxos-principais)

---

## 1. Visão Geral

O **Ordery HQ** é uma plataforma multi-tenant que permite a restaurantes criar e gerir um cardápio digital acessível por link ou QR code. Pedidos feitos pelos clientes chegam em tempo real no painel do restaurante e podem ser encaminhados via WhatsApp com um clique. O painel inclui gestão de horários de funcionamento, módulo de vendas e suporte a light/dark mode.

### Perfis de Utilizador

| Perfil | Acesso | Identificação |
|--------|--------|---------------|
| **Cliente** | Cardápio público (`/r/:slug`) | Sem autenticação |
| **Restaurante (Admin)** | Painel admin (`/admin`) | Firebase Auth (e-mail/senha) |
| **Master (Super Admin)** | Painel master (`/superadmin`) | E-mail definido em `VITE_SUPER_ADMIN_EMAIL` |

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| UI Framework | React 19 |
| Linguagem | TypeScript 5.8 |
| Build | Vite 6 |
| Estilização | Tailwind CSS 4 (com `@theme` tokens) |
| Roteamento | React Router DOM v7 |
| Base de dados | Firebase Firestore (realtime) |
| Autenticação | Firebase Auth |
| Upload de imagens | Cloudinary (unsigned preset) |
| Ícones | Lucide React |
| Notificações UI | react-hot-toast |
| Datas | date-fns (pt-BR) |
| QR Code | qrcode.react |

---

## 3. Variáveis de Ambiente

Todas as variáveis usam o prefixo `VITE_` (obrigatório no Vite para exposição ao browser).

Ficheiro: `.env` (não commitado — ver `.env.example`)

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_STORAGE_BUCKET=

# Cloudinary (upload de imagens — plano gratuito)
VITE_CLOUDINARY_CLOUD=
VITE_CLOUDINARY_PRESET=

# App
VITE_SUPER_ADMIN_EMAIL=       # e-mail do master
VITE_WA_CONTACT=              # número WhatsApp de contacto da plataforma
```

### Onde cada variável é usada

| Variável | Ficheiro |
|----------|----------|
| `VITE_FIREBASE_*` | `src/services/firebase.ts` |
| `VITE_CLOUDINARY_CLOUD` + `VITE_CLOUDINARY_PRESET` | `src/pages/admin/Settings.tsx` |
| `VITE_SUPER_ADMIN_EMAIL` | `src/contexts/AuthContext.tsx` |
| `VITE_WA_CONTACT` | `src/pages/public/Home.tsx` |

> **Nota:** o ficheiro `firebase-applet-config.json` deixou de ser usado. As credenciais Firebase estão exclusivamente no `.env`.

---

## 4. Estrutura de Arquivos

```
/
├── .env                              # Variáveis de ambiente (não commitado)
├── .env.example                      # Template das variáveis
├── firestore.rules                   # Regras de segurança Firestore
└── src/
    ├── App.tsx                       # Rotas e providers
    ├── index.css                     # Tailwind @theme tokens + light mode
    ├── types/
    │   └── index.ts                  # Interfaces TypeScript globais
    ├── lib/
    │   ├── utils.ts                  # Funções utilitárias
    │   └── theme.ts                  # DEFAULT_TENANT_COLOR
    ├── hooks/
    │   └── useTheme.ts               # Hook light/dark mode
    ├── services/
    │   └── firebase.ts               # Inicialização Firebase via env vars
    ├── contexts/
    │   ├── AuthContext.tsx           # Auth + tenant + super-admin
    │   └── CartContext.tsx           # Carrinho de compras (localStorage)
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx            # Botão reutilizável (tema dark/light)
    │   │   └── Input.tsx             # Input reutilizável (tema dark/light)
    │   ├── admin/
    │   │   ├── AdminLayout.tsx       # Shell do painel (sidebar + header + toggle tema)
    │   │   └── MenuQrCode.tsx        # Componente QR code
    │   ├── superadmin/
    │   │   └── SuperAdminLayout.tsx  # Shell do painel master
    │   └── public/
    │       └── CartModal.tsx         # Modal do carrinho + checkout
    └── pages/
        ├── public/
        │   ├── Home.tsx              # Landing page
        │   ├── Home.css              # Estilos scoped (usa var(--color-*))
        │   └── RestaurantMenu.tsx    # Cardápio público
        ├── admin/
        │   ├── Login.tsx             # Login (sem registo)
        │   ├── Login.css             # Estilos scoped (usa var(--color-*))
        │   ├── Dashboard.tsx         # Kanban de pedidos + arquivar vendas
        │   ├── MenuManager.tsx       # Gestão do cardápio
        │   ├── Settings.tsx          # Configurações + upload Cloudinary
        │   ├── Times.tsx             # Horários de funcionamento
        │   └── Sales.tsx             # Relatório de vendas
        └── superadmin/
            └── SuperAdminDashboard.tsx
```

---

## 5. Arquitetura de Dados (Firestore)

```
tenants/                          # Um documento por restaurante
  {tenantId}/
    ├── name: string
    ├── slug: string              # URL única do cardápio
    ├── whatsapp: string
    ├── logoUrl: string           # URL Cloudinary
    ├── themeColor: string        # Hex (ex: #f97316)
    ├── schedule: WeekSchedule    # Horários por dia da semana
    ├── ownerId: string           # UID Firebase Auth
    ├── createdAt: number         # timestamp ms
    │
    ├── categories/{id}
    │   ├── name: string
    │   └── order: number
    │
    ├── products/{id}
    │   ├── name: string
    │   ├── description: string
    │   ├── price: number
    │   ├── promotionalPrice: number   # 0 = sem promoção
    │   ├── imageUrl: string
    │   ├── categoryId: string
    │   └── active: boolean
    │
    ├── orders/{id}
    │   ├── customerName: string
    │   ├── customerPhone: string
    │   ├── customerAddress: string
    │   ├── items: OrderItem[]
    │   ├── total: number
    │   ├── status: OrderStatus        # recebido | preparando | saiu | finalizado
    │   ├── archived: boolean          # true = arquivado nas vendas
    │   └── createdAt: number
    │
    └── sales/{id}                     # Criado ao clicar "Terminar" no Dashboard
        ├── orderId: string
        ├── customerName: string
        ├── customerPhone: string
        ├── customerAddress: string
        ├── items: OrderItem[]
        ├── total: number
        ├── createdAt: number          # quando o pedido foi feito
        └── completedAt: number        # quando foi arquivado
```

---

## 6. Tipos e Interfaces

Definidos em `src/types/index.ts`.

```typescript
interface DaySchedule {
  open: boolean;
  from: string;   // "09:30"
  to: string;     // "18:00"
}

interface WeekSchedule {
  sun: DaySchedule;
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
}

interface Tenant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  whatsapp: string;
  logoUrl?: string;
  themeColor?: string;
  schedule?: WeekSchedule;
  createdAt: number;
}

interface Category { id: string; name: string; order: number; }

interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  imageUrl?: string;
  active: boolean;
}

interface OrderItem { productId: string; name: string; price: number; quantity: number; }

type OrderStatus = 'recebido' | 'preparando' | 'saiu' | 'finalizado';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  archived?: boolean;
}

interface Sale {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  total: number;
  createdAt: number;
  completedAt: number;
}
```

---

## 7. Sistema de Temas

### Tokens globais (`src/index.css`)

O Tailwind 4 usa `@theme` para definir tokens que geram classes utilitárias e CSS custom properties.

```css
@theme {
  --color-bg: #0a0d0b;
  --color-surface: #12160f;
  --color-surface-2: #181d15;
  --color-elevated: #1c221a;
  --color-content: #eef2ec;
  --color-muted: #98a297;
  --color-faint: #6b746a;
  --color-accent: #6fd08c;
  --color-accent-2: #8fe0a4;
  --color-accent-ink: #07140d;
  --color-warn: #d98a6a;
  --color-line: rgba(220,255,220,0.085);
  --color-line-2: rgba(220,255,220,0.14);
  /* ... */
}
```

Classes geradas: `bg-bg`, `bg-surface`, `text-accent`, `border-line`, etc.

### Light Mode

Definido em `.light { ... }` no `index.css`. Aplicado via classe no root div do `AdminLayout` pelo hook `useTheme`.

```typescript
// src/hooks/useTheme.ts
const { isDark, toggle } = useTheme();
// persiste em localStorage key 'adminTheme'
// default: light mode
```

O botão Sol/Lua no header desktop alterna o tema. **As páginas públicas (Home, Login, Cardápio) são sempre dark** — o light mode afeta apenas o painel admin.

### Tema do Cardápio (Tenant)

Cada restaurante tem `themeColor` (hex) que personaliza o header, botões e preços do cardápio público. Fallback: `DEFAULT_TENANT_COLOR = '#f97316'` (`src/lib/theme.ts`).

### CSS dos ficheiros públicos

`Home.css` e `Login.css` são scoped (`.home-landing`, `.auth-page`) e referenciam `var(--color-*)` gerados pelo `@theme`, garantindo que qualquer mudança nos tokens seja propagada automaticamente.

---

## 8. Autenticação e Controle de Acesso

### Fluxo

1. `onAuthStateChanged` escuta mudanças de sessão.
2. Ao autenticar, carrega `tenants/{uid}` via `getDoc`.
3. Compara e-mail com `VITE_SUPER_ADMIN_EMAIL` → define `isSuperAdmin`.

### Hook `useAuth()`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `user` | `User \| null` | Objeto Firebase Auth |
| `tenant` | `Tenant \| null` | Dados do restaurante |
| `loading` | `boolean` | Auth a carregar |
| `isSuperAdmin` | `boolean` | true se e-mail = master |
| `logout()` | `Promise<void>` | Desloga |
| `refreshTenant()` | `Promise<void>` | Recarrega dados do tenant |

### Proteção de Rotas

- **AdminLayout**: redireciona para `/admin/login` se não autenticado.
- **SuperAdminLayout**: redireciona para `/admin` se não for super-admin.
- Não existe registo público — contas criadas manualmente ou por fluxo interno.

---

## 9. Regras de Segurança Firestore

Ficheiro: `firestore.rules`

| Operação | Quem pode |
|----------|-----------|
| Ler tenant | Qualquer pessoa (necessário para o cardápio público) |
| Escrever tenant | Apenas o dono (`request.auth.uid == resource.data.ownerId`) |
| Ler produtos/categorias | Qualquer pessoa |
| Escrever produtos/categorias | Apenas o dono do tenant pai |
| Criar pedido | Qualquer pessoa (clientes sem conta) |
| Ler/atualizar pedido | Apenas o dono do tenant |
| Ler/escrever sales | Apenas o dono do tenant |

---

## 10. Roteamento

```
/                    → Home (landing page)
/r/:slug             → Cardápio público do restaurante
/admin/login         → Login
/admin               → Dashboard (Kanban de pedidos)
/admin/menu          → MenuManager (gestão do cardápio)
/admin/times         → Times (horários de funcionamento)
/admin/sales         → Sales (relatório de vendas)
/admin/settings      → Settings (configurações)
/superadmin          → SuperAdminDashboard
```

**Nav do Admin (sidebar):** Pedidos · Cardápio · Horários · Vendas · Configurações

---

## 11. Páginas Públicas

### 11.1 Home (`/`)

Landing page da plataforma.

- Nav com logo e botão "Entrar" (sem "Criar conta" — registo é interno).
- Hero com Kanban animado + mockup de cardápio em tempo real.
- Secções: Problema, Pilares, Painel ao vivo, Como funciona, Preços, CTA.
- Número de WhatsApp de contacto via `VITE_WA_CONTACT`.

### 11.2 Cardápio Público (`/r/:slug`)

**Carregamento:** `onSnapshot` em tenant (por slug), products e categories.

**Funcionalidades:**
- Header com logo, nome e WhatsApp do restaurante.
- Filtros: Todos, Promoção, categorias dinâmicas.
- Produtos ordenados com promoções primeiro.
- Banner "Fechado no momento" automático baseado no schedule (com dica da próxima abertura).
- Banner dispensável com botão X.
- Botão `+` e sacola só visíveis quando aberto (baseado em schedule).
- Barra de checkout fixa no rodapé quando há itens.

**Lógica de horário:**
```typescript
// Verifica se o restaurante está aberto agora
const scheduleStatus = tenant.schedule ? getScheduleStatus(tenant.schedule) : null;
const isClosed = scheduleStatus !== null && !scheduleStatus.open;
```

---

## 12. Painel do Restaurante (Admin)

### 12.1 Login (`/admin/login`)

Apenas login — sem registo público.
- Campos: e-mail, senha.
- Recuperação de senha via `sendPasswordResetEmail`.
- Mensagens de erro específicas por código Firebase.
- Redireciona master para `/superadmin`, demais para `/admin`.

### 12.2 Dashboard — Kanban de Pedidos (`/admin`)

**4 colunas:** Recebido · Em Preparo · Saiu para Entrega · Finalizado

Pedidos com `archived: true` são filtrados do kanban.

**Fluxo de status:**

| De | Para | Botão | Mensagem WhatsApp |
|----|------|-------|------------------|
| recebido | preparando | PREPARAR | "Seu pedido já está em preparo 🍔🔥" |
| preparando | saiu | DESPACHAR | "Seu pedido saiu para entrega 🚀" |
| saiu | finalizado | CONCLUIR | "Pedido finalizado! Obrigado pela preferência 🙏" |
| finalizado | — | **TERMINAR** | — |

**Botão TERMINAR (coluna Finalizado):**
1. Cria documento em `tenants/{id}/sales` com `completedAt`.
2. Marca o pedido como `archived: true`.
3. Pedido desaparece do kanban.
4. Fica disponível na página Vendas.

**Notificações:** som (Web Audio API) + notificação browser ao receber novo pedido.

### 12.3 Cardápio (`/admin/menu`)

- Vistas lista/grid alternáveis.
- Filtro por categoria.
- CRUD de produtos: nome, descrição, preço, preço promocional, imagem (URL), categoria.
- CRUD de categorias inline no formulário de produto.

### 12.4 Horários (`/admin/times`)

- Tabela com os 7 dias da semana.
- Por dia: checkbox "Fechado" + inputs hora de abertura/fecho.
- Inputs desabilitados quando o dia está fechado.
- Guarda `schedule: WeekSchedule` no documento do tenant.
- Chaves em inglês: `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat`.

### 12.5 Vendas (`/admin/sales`)

Relatório dos pedidos arquivados via "Terminar".

**Filtros de período:** Hoje · Semana · Mês · Ano

**Métricas:**
- Faturamento total
- Número de pedidos
- Ticket médio

**Top 5 produtos** mais vendidos (por quantidade + receita no período).

**Lista de pedidos** ordenada por `completedAt desc`, com pesquisa por cliente ou produto.

### 12.6 Configurações (`/admin/settings`)

| Campo | Descrição |
|-------|-----------|
| Nome | Exibido no cardápio público |
| Slug | URL exclusiva (`/r/{slug}`) |
| WhatsApp | Número para receber pedidos |
| Cor do tema | Hex picker — personaliza o cardápio público |
| Logo | Upload direto via Cloudinary (com barra de progresso) |

- QR code do cardápio com botão de copiar link.
- Logo: preview ao vivo + botão X para remover.

---

## 13. Painel Master (Super Admin)

Acessível via `/superadmin`. Exclusivo para `VITE_SUPER_ADMIN_EMAIL`.

**Métricas:** total de restaurantes cadastrados, novos este mês.

**Tabela de restaurantes:** logo, nome, WhatsApp, slug, data de cadastro, link para o cardápio.

---

## 14. Componentes Partilhados

### Button (`src/components/ui/Button.tsx`)

```typescript
// Variantes: primary | secondary | outline | danger | ghost
// Tamanhos: sm | md | lg
// Props extras: isLoading (spinner)
<Button variant="primary" size="md" isLoading={false}>Texto</Button>
```

Cores via tokens do tema (`bg-accent`, `text-accent-ink`, etc.).

### Input (`src/components/ui/Input.tsx`)

```typescript
<Input label="E-mail" type="email" error="Campo obrigatório" />
```

Dark-themed por defeito. Para uso em contexto público (light), passar `className` com overrides de cor.

### AdminLayout

- Sidebar desktop com logo, nav e toggle de tema (Sol/Lua).
- Bottom nav mobile.
- `useTheme()` aplica classe `.light` no root div.

### CartModal

- Drawer deslizante à direita (`animate-slide-in-right`).
- Inputs com overrides para tema claro (contexto público).
- Cores dos botões e totais via `tenant.themeColor`.

---

## 15. Upload de Imagens (Cloudinary)

Upload direto do browser sem Firebase Storage (evita plano Blaze).

**Configuração necessária:**
1. Conta em cloudinary.com (gratuita — 25 GB).
2. Upload preset em modo **Unsigned**.
3. Definir `VITE_CLOUDINARY_CLOUD` e `VITE_CLOUDINARY_PRESET` no `.env`.

**Fluxo:**
```
Utilizador seleciona ficheiro
→ XHR POST para api.cloudinary.com/v1_1/{cloud}/image/upload
→ Barra de progresso via evento xhr.upload.progress
→ URL `secure_url` devolvido pelo Cloudinary
→ Preview atualizado no Settings
→ URL guardado no Firestore ao clicar "Salvar"
```

**Limitações aceites:**
- Máx. 5 MB por imagem.
- Formatos: PNG, JPG, WEBP (`image/*`).
- `public_id` no formato `logos_{tenant.id}` (sobrescreve ao trocar logo).

---

## 16. Integração WhatsApp

### Pedido (Cliente → Restaurante)

```
Pedido confirmado no CartModal
→ addDoc em tenants/{id}/orders (status: recebido)
→ Abre wa.me/{whatsapp}?text={mensagem pré-formatada}
```

### Notificação de Status (Admin → Cliente)

Ao avançar o status, abre WhatsApp com mensagem automática para o cliente.

### Contacto direto

Botão "Contato WhatsApp" nos cards do Dashboard abre conversa direta.

Utilitário: `formatPhoneForWA(phone)` — remove não-dígitos.

---

## 17. Persistência do Carrinho

- Chave localStorage: `@SaasMenu:cart`.
- Persiste entre reloads.
- Carrinho global (não separado por tenant).
- Preço armazenado: `promotionalPrice` se disponível, senão `price`.

---

## 18. Notificações em Tempo Real

**Novos pedidos no Dashboard:**
1. `onSnapshot` detecta documentos adicionados com status `recebido`.
2. Toca beep sintético (Web Audio API).
3. Notificação nativa do browser (pede permissão na primeira vez).

**Cardápio e pedidos:** atualizados em tempo real via `onSnapshot` sem reload.

---

## 19. Utilitários

### `src/lib/utils.ts`

| Função | Descrição |
|--------|-----------|
| `cn(...classes)` | Merge de classes Tailwind (`clsx` + `tailwind-merge`) |
| `formatCurrency(value)` | `R$ 1.234,56` |
| `formatPhoneForWA(phone)` | Remove não-dígitos para URL WhatsApp |

### `src/lib/theme.ts`

```typescript
export const DEFAULT_TENANT_COLOR = '#f97316';
```

Usado como fallback para `tenant.themeColor` em todo o lado.

### `src/hooks/useTheme.ts`

```typescript
const { isDark, toggle } = useTheme();
// isDark: boolean — default false (light mode)
// toggle: () => void — persiste em localStorage 'adminTheme'
```

---

## 20. Fluxos Principais

### Recebimento de Pedido

```
Cliente acessa /r/{slug}
→ Verifica schedule → exibe banner se fechado
→ Adiciona itens ao carrinho
→ Preenche dados no CartModal
→ addDoc em orders (status: recebido)
→ WhatsApp abre para o restaurante
→ Dashboard exibe pedido em "Recebido" + som + notificação
```

### Progressão e Arquivo de Pedido

```
Admin: PREPARAR → DESPACHAR → CONCLUIR → pedido em "Finalizado"
Admin clica TERMINAR
→ addDoc em sales (completedAt = agora)
→ updateDoc order (archived: true)
→ Pedido desaparece do kanban
→ Aparece na página Vendas
```

### Configuração de Horários

```
Admin acessa /admin/times
→ Desmarca "Fechado" para os dias que abre
→ Define hora de abertura e fecho
→ Salva → schedule guardado no tenant
→ Cardápio público verifica automaticamente ao carregar
```

### Login do Master

```
Acessa /admin/login
→ E-mail = VITE_SUPER_ADMIN_EMAIL
→ isSuperAdmin = true
→ Redireciona para /superadmin
```

---

*Documentação atualizada: junho 2026 — Ordery HQ*
