# ESLint Rules for Code Quality

The project enforces code quality and consistency via ESLint. Run `pnpm lint` after changes to check. All rules are set to **warn** to allow gradual adoption.

### TypeScript Strict Typing

| Rule | Purpose |
|------|---------|
| `@typescript-eslint/no-explicit-any` | Disallows `any` type - use `unknown` with type guards |
| `@typescript-eslint/consistent-type-assertions` | Discourages `as Type` - prefer proper typing |
| `@typescript-eslint/no-non-null-assertion` | Discourages `!` operator - prefer proper null checks |
| `@typescript-eslint/no-unused-vars` | Detects unused variables (prefix with `_` to ignore) |
| `@typescript-eslint/ban-ts-comment` | Requires description for `@ts-ignore` (min 10 chars) |

### Naming Conventions

| Rule | Convention |
|------|------------|
| Variables | `camelCase`, `UPPER_CASE` (constants), `PascalCase` (React components) |
| Functions | `camelCase`, `PascalCase` (React components) |
| Parameters | `camelCase` (prefix `_` for intentionally unused) |
| Types/Interfaces | `PascalCase` |
| Enum members | `PascalCase` or `UPPER_CASE` |

**Example violations:**
```typescript
// Bad - snake_case variable
const user_profile = fetchProfile();

// Good - camelCase
const userProfile = fetchProfile();

// Bad - unused parameter
function handleClick(event) { doSomething(); }

// Good - prefix with underscore
function handleClick(_event) { doSomething(); }
```

### Code Quality

| Rule | Purpose |
|------|---------|
| `eqeqeq` | Enforce `===` instead of `==` (type-safe comparisons) |
| `prefer-const` | Prefer `const` over `let` when never reassigned |
| `no-console` | Discourage `console.log` - use logger instead |

### How to Fix Common Issues

**Instead of `any`:**
```typescript
// Bad
function handleError(error: any) { ... }

// Good - use unknown with type guard
function handleError(error: unknown) {
  if (error instanceof Error) {
    logger.error(error, 'Operation failed');
  }
}

// Good - use specific type
function handleError(error: Error) { ... }
```

**Instead of `as Type`:**
```typescript
// Bad
const config = JSON.parse(data) as AppConfig;

// Good - use type guard
function isAppConfig(obj: unknown): obj is AppConfig {
  return typeof obj === 'object' && obj !== null && 'apiUrl' in obj;
}
const parsed = JSON.parse(data);
if (isAppConfig(parsed)) {
  const config = parsed; // typed as AppConfig
}

// Good - use zod schema validation
const configSchema = z.object({ apiUrl: z.string() });
const config = configSchema.parse(JSON.parse(data));
```

**Instead of `@ts-ignore`:**
```typescript
// Bad - no explanation
// @ts-ignore
someCode();

// Good - with explanation
// @ts-ignore - Third-party library types are incorrect for this overload
someCode();

// Better - use @ts-expect-error (fails if error disappears)
// @ts-expect-error - Third-party library types are incorrect
someCode();
```

**Instead of non-null assertion:**
```typescript
// Bad
const name = user!.name;

// Good - explicit check
if (user) {
  const name = user.name;
}

// Good - optional chaining with fallback
const name = user?.name ?? 'Anonymous';
```

### Running Lint
```bash
# Lint specific package
pnpm --filter @hive/blog lint

# Lint all packages
pnpm lint

# Auto-fix fixable issues
pnpm --filter @hive/blog lint -- --fix
```

### Translation Rules

**IMPORTANT: Never use inline strings for user-facing text!**

All user-visible text must use translation keys via the `t()` function. This ensures:
- Proper internationalization (i18n) support
- Consistent text management
- Easy translation to other languages

**Bad - inline strings:**
```tsx
// DON'T do this
<Button>Submit</Button>
<p>Loading...</p>
<span>No results found</span>
{error && <div>Something went wrong</div>}
```

**Good - translation keys:**
```tsx
// DO this
<Button>{t('common.submit')}</Button>
<p>{t('global.loading')}</p>
<span>{t('search_page.no_results')}</span>
{error && <div>{t('global.something_went_wrong')}</div>}
```

**Usage pattern:**
```tsx
import { useTranslation } from '@/blog/i18n/client';

function MyComponent() {
  const { t } = useTranslation('common_blog');

  return <div>{t('namespace.key_name')}</div>;
}
```

### Translation Keys Validation

#### 1. Cross-locale key sync
Validates that all locales have the same keys as English reference.

```bash
pnpm --filter @hive/blog lint:translations
```

**What it checks:**
- Missing keys (present in English but missing in other locales)
- Extra keys (present in other locales but not in English reference)
- Missing translation files

#### 2. Translation usage validation
Validates that all `t('key')` and `<Trans i18nKey="key">` calls in code reference existing translation keys.

```bash
# Check for missing keys
pnpm --filter @hive/blog lint:translations:usage

# Also show potentially unused keys (-- passes flag to the script)
pnpm --filter @hive/blog lint:translations:usage -- --unused
```

**What it checks:**
- All `t('key')` function calls reference existing keys
- All `<Trans i18nKey="key">` components reference existing keys
- Reports file and line number for invalid keys
- Optionally reports unused translation keys

**Reference locale:** English (`en`) is the source of truth.

**Fixing issues:**
1. Missing keys in code: Add the key to `apps/blog/locales/en/common_blog.json`
2. Missing keys in locales: Copy from English and translate
3. Extra keys: Remove outdated keys or add to English if valid

**Scripts location:** `scripts/check-blog-translations.js`, `scripts/check-blog-translation-usage.js`

**Translations location:** `apps/blog/locales/[lang]/common_blog.json`
