# LocalStorage with TTL (Time To Live)

**IMPORTANT: Never use raw `localStorage` for temporary data!**

The application stores data in localStorage for various purposes. To prevent localStorage from growing indefinitely and storing stale data, all temporary data must use TTL utilities.

### ESLint Rule

The `no-restricted-globals` rule warns against direct `localStorage` usage. Use the provided utilities instead:

```typescript
// ❌ Bad - raw localStorage
localStorage.setItem('draft', text);
const draft = localStorage.getItem('draft');

// ✅ Good - with TTL utilities
import { setStorageItem, getStorageItem, StorageTTL } from '@ui/lib/storage-with-ttl';
setStorageItem('draft', text, StorageTTL.DRAFT);
const draft = getStorageItem<string>('draft');

// ✅ Good - React hook with TTL
import { useStorageWithTTL, StorageTTL } from '@hive/ui';
const [draft, setDraft, removeDraft] = useStorageWithTTL('draft', '', StorageTTL.DRAFT);
```

### TTL Constants

| Constant | Duration | Use Case |
|----------|----------|----------|
| `StorageTTL.DRAFT` | 30 days | Draft posts, comments |
| `StorageTTL.UI_STATE` | 30 days | Reply box state, UI preferences |
| `StorageTTL.SESSION` | 7 days | Session-related data |
| `StorageTTL.CACHE` | 1 hour | Cached API responses |
| `StorageTTL.PERMANENT` | null | User settings, preferences |

### Data Categories

| Data Type | TTL Needed? | Notes |
|-----------|-------------|-------|
| Draft posts/comments (`replyTo-*`, `postData-*`) | ✅ `DRAFT` | Auto-expire after 30 days |
| Reply box state (`replybox-*`) | ✅ `UI_STATE` | Auto-expire after 30 days |
| User preferences (`user-preferences-*`) | ❌ `PERMANENT` | Never expires |
| Node endpoints (`node-endpoint`, etc.) | ❌ `PERMANENT` | User settings |
| Language (`NEXT_LOCALE`) | ❌ `PERMANENT` | User preference |
| Templates (`hivePostTemplates-*`) | ❌ `PERMANENT` | User content |
| Vote values (`votesValues`) | ❌ `PERMANENT` | User preference |

### Storage Cleanup

The `<StorageCleanup />` component automatically cleans expired items on app startup. Add it to the root layout:

```tsx
import { StorageCleanup } from '@hive/ui';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StorageCleanup />
        {children}
      </body>
    </html>
  );
}
```

### Available Utilities

**Low-level functions** (`@ui/lib/storage-with-ttl`):
- `setStorageItem(key, value, ttl)` - Store with TTL
- `getStorageItem<T>(key)` - Retrieve (returns null if expired)
- `removeStorageItem(key)` - Remove item
- `cleanupExpiredItems()` - Remove all expired items
- `removeByPrefix(prefix)` - Remove all items with prefix (regardless of expiration)
- `refreshStorageTTL(key, ttl)` - Update TTL of existing item
- `getStorageStats()` - Debug info about storage usage

**React hooks** (`@ui/hooks/useStorageWithTTL`):
- `useStorageWithTTL(key, initialValue, ttl)` - General purpose hook with cross-tab sync

### When to Use What

1. **Temporary data (drafts, UI state)**: Always use `StorageTTL.DRAFT` or `StorageTTL.UI_STATE`
2. **User preferences/settings**: Use `StorageTTL.PERMANENT` (null)
3. **Cached API data**: Use `StorageTTL.CACHE` (1h)

### Legacy Data Migration

Existing localStorage data without TTL structure is handled gracefully:
- `getStorageItem()` returns legacy data as-is
- Legacy items will be gradually replaced when users interact with the app
- `cleanupExpiredItems()` only removes items with TTL structure that have expired
