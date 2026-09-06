# HOW TO TALK TO ME — read first, applies to every response

**Be extremely concise. Sacrifice grammar for the sake of concision.**

- Answer first. No preamble, no restating my question, no summary of what you just did.
- Fragments over sentences. Drop articles, filler, hedging, throat-clearing.
- Bullets and numbers over paragraphs.
- Plain English. I am not a developer — no jargon unless I used it first.
- Say what you don't know in one short line. Don't pad around it.
- Long output only when I ask for long output.

Standing instruction. Outranks the default urge to explain.

---

# Denser Project Notes

## Hive Basecamp

Before doing any work on Basecamp or H.I.V.E.R., read
`apps/blog/features/basecamp/ETHOS.md` (what the project is for and the
commitments behind it) and `apps/blog/features/basecamp/CONTEXT.md` (the shared
glossary — the agreed words, and the ones we have agreed not to use).

## GitLab Instance
This project uses **gitlab.syncad.com**, NOT gitlab.com.
- Repository: https://gitlab.syncad.com/hive/denser
- Use `glab api "projects/hive%2Fdenser/..."` for API calls

## Git Workflow
- **Branching**: Feature branches from `develop`, MRs target `develop`
- **Main branch**: Periodically synced from `develop` (not direct commits)
- **Issue linking**: Always link issues in MR descriptions using `Closes #123` or `Fixes #123`
- **Separate MRs**: Create separate MRs for separate topics/issues
- **Pre-MR for Blog**: Before creating MR with blog changes, ask user if they want to run `blog-smoke-tests` skill to verify basic functionality

## Package Management
- Check `.gitlab-ci.yml` for current Node/pnpm versions
- Example: `docker run --rm -v "$(pwd)":/app -w /app node:<version> sh -c "corepack enable && pnpm install"`
- CI uses `--frozen-lockfile` - always commit lockfile changes

## Logging
- Pino logger: `logger.error(error, 'message')` (error first!)
- Printf-style: `logger.error('msg: %o', error)`

## Hive Blockchain
- APIs: api.hive.blog, api.openhive.network
- SSR connects to Hive API, client can use any endpoint

---

## Tech Stack & Frameworks

### Core
- **Monorepo**: Turborepo with pnpm workspaces
- **Node**: ^20.11 || >= 21.2
- **pnpm**: >=9.5.0 (packageManager: pnpm@10.0.0)
- **TypeScript**: 5.3.3

### Frontend Framework
- **Next.js**: 14.2.x (App Router)
- **React**: 18.3.0

### Styling
- **Tailwind CSS**: with custom config (`@hive/tailwindcss-config`)
- **PostCSS**: standard config
- **class-variance-authority**: for variant styling
- **clsx** + **tailwind-merge**: class composition

### UI Components
- **Radix UI**: headless primitives (dialog, dropdown, popover, tabs, tooltip, etc.)
- **Lucide React**: icons
- **shadcn/ui pattern**: Radix + Tailwind in `@hive/ui` package

### State Management
- **Zustand**: client state
- **TanStack React Query**: 4.x for server state / data fetching

### Forms & Validation
- **React Hook Form**: 7.x
- **Zod**: schema validation
- **@hookform/resolvers**: Zod integration

### Internationalization
- **i18next** + **next-i18next**: translations in `locales/` directory

### Blockchain
- **@hiveio/wax**: Hive blockchain operations
- **@hiveio/hb-auth**: authentication worker
- **hive-auth-client**: HiveAuth integration

### Testing
- **Playwright**: E2E tests with multiple configs (local, mirrornet)
- **Blog Smoke Tests**: Before creating MR for blog changes, consider running smoke tests via `blog-smoke-tests` skill (15 tests covering homepage, navigation, profiles, tooltips, etc.)

### Internal Packages (`packages/`)
| Package | Purpose |
|---------|---------|
| `@hive/ui` | Shared UI components (Radix + Tailwind) |
| `@hive/transaction` | Blockchain transaction handling |
| `@hive/smart-signer` | Multi-method signing (Keychain, HiveAuth, etc.) |
| `@hive/renderer` | Content rendering |
| `@hive/middleware` | Shared Next.js middleware |
| `@hive/tailwindcss-config` | Shared Tailwind config |
| `@hive/tsconfig` | Shared TypeScript config |
| `@hive/eslint-config-custom` | Shared ESLint rules |
| `@hive/prettier-config-custom` | Shared Prettier config |

---

## Blog App File Structure

Directory map of `apps/blog/` plus the route/feature conventions — see [`docs/blog-app-structure.md`](docs/blog-app-structure.md). Read on demand; not needed at session start.

---

## Clean Code Guidelines

### File Size & Structure
- **Max ~200-300 lines per file** - large files are hard to debug and maintain
- **One component per file** - easier to locate and test
- **Split large components** - extract sub-components, hooks, and utilities
- **Co-locate related code** - keep hooks/utils near their consumers

### Functions & Components
- **Single Responsibility** - each function/component does one thing well
- **Max ~50 lines per function** - if longer, split into smaller functions
- **Descriptive names** - `getUserProfile()` not `getData()`, `PostCard` not `Card1`
- **Extract custom hooks** - reusable logic goes into `useXxx()` hooks
- **Avoid prop drilling** - use context or composition for deep props

### Code Quality
- **DRY (Don't Repeat Yourself)** - extract shared logic into utilities/hooks
- **Early returns** - reduce nesting with guard clauses
- **Avoid magic numbers/strings** - use named constants
- **Type everything** - leverage TypeScript, avoid `any`
- **Handle errors** - always handle error states in async operations

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useUserData.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `IApiResponse`)

### React Specific
- **Prefer functional components** with hooks
- **Memoize expensive computations** - `useMemo`, `useCallback` where needed
- **Avoid inline functions in JSX** - extract handlers
- **Use fragments** `<>...</>` instead of unnecessary wrapper divs
- **Key prop** - always use stable, unique keys in lists

### What to Avoid
- God components (500+ lines doing everything)
- Deeply nested ternaries
- Business logic in components (extract to hooks/utils)
- Commented-out code (delete it, git has history)
- Console.logs in production code (use logger)
- Ignoring TypeScript errors with `@ts-ignore`

---

## ESLint Rules & Translations

Full lint rule table, how to fix each violation, translation-key rules and validation commands — see [`docs/eslint-and-translations.md`](docs/eslint-and-translations.md). Read on demand; not needed at session start.

---

## LocalStorage with TTL

TTL constants, which data needs a TTL, available utilities, legacy migration — see [`docs/localstorage-ttl.md`](docs/localstorage-ttl.md). Read on demand; not needed at session start.

---

---

## Agent skills

### Issue tracker

Local markdown files under `.scratch/<effort>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context. `ETHOS.md` and `CONTEXT.md` live in `apps/blog/features/basecamp/`, ADRs in `docs/adr/`. See `docs/agents/domain.md`.
