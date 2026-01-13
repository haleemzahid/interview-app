# PennPOS Tauri - AI Agent Instructions

## Project Overview
PennPOS is a Point of Sale system built with Tauri + React. We are migrating from .NET MAUI to Tauri.

## Technology Stack
- **Frontend**: React 18 + TypeScript
- **Backend**: Tauri 2 (Rust)
- **Database**: SQLite (local, via `@tauri-apps/plugin-sql`)
- **Routing**: TanStack Router (file-based)
- **State Management**: 
  - Server state: TanStack Query
  - Session/UI state: Jotai
  - Form state: TanStack Form
- **UI**: Tailwind CSS 4 + daisyUI 5
- **Icons**: Lucide React

## Architecture: Vertical Slices

### Slice Structure
Each feature lives in `src/slices/<slice-name>/`:
```
src/slices/<slice-name>/
├── config.ts                    # Navigation config (optional)
├── index.ts                     # Public exports
├── shared/
│   ├── types.ts                # TypeScript interfaces
│   └── database.ts             # SQL queries
└── <use-case>/                 # e.g., list-products, create-order
    ├── Component.tsx           # React component
    └── useHook.ts             # TanStack Query hook
```

### Existing Slices
- `auth/` - PIN-based authentication
- `todos/` - Example CRUD slice (reference implementation)
- `shared/` - Cross-cutting types, constants, utilities

## Database Rules

### Connection
- Use existing database at: `C:\Users\Haleem Khan\AppData\Local\Packages\com.companynameV2.PennPOS.App_dp9yhbjdv06c8\LocalState\efcoredbv2.db3`
- Import `getDatabase` from `@/core/database/client`
- Tables use **CamelCase** (e.g., `Products`, `OrderItems`)
- Columns use **CamelCase** (e.g., `FirstName`, `RoleId`)

### Query Pattern
```typescript
import { getDatabase } from '@/core/database/client'

export async function getProducts(): Promise<Product[]> {
  const db = await getDatabase()
  return db.select<Product[]>('SELECT * FROM Products WHERE IsActive = 1')
}
```

## State Management Rules

### What Goes Where
| State Type | Solution | Example |
|------------|----------|---------|
| Server/DB data | TanStack Query | Products, Orders, Customers |
| Current session | Jotai atoms | currentUser, currentOrder, cart |
| Form data | TanStack Form | Payment form, customer lookup |
| Local UI | React useState | Modal open, selected tab |

### Jotai Pattern
```typescript
import { atom, useAtomValue, useSetAtom } from 'jotai'

export const cartAtom = atom<CartItem[]>([])
export const useCart = () => useAtomValue(cartAtom)
export const useSetCart = () => useSetAtom(cartAtom)
```

### TanStack Query Pattern
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
```

## UI Rules (daisyUI 5)

### DO
- Use daisyUI semantic colors: `primary`, `secondary`, `accent`, `base-100`, `base-200`, `base-300`
- Use daisyUI 5 components: `btn`, `card`, `alert`, `input`, `fieldset`
- Use `fieldset` + `fieldset-legend` for form groups
- Use `btn-primary`, `btn-ghost`, `btn-neutral` for buttons
- Use responsive prefixes: `sm:`, `md:`, `lg:`

### DON'T
- Don't use deprecated daisyUI 4 classes: `form-control`, `label-text`, `input-bordered`
- Don't use Tailwind color classes like `text-gray-800` (use `text-base-content` instead)
- Don't use `dark:` prefix (daisyUI handles themes automatically)

### Component Patterns
```tsx
// Card
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Title</h2>
    <p>Content</p>
    <div className="card-actions">
      <button className="btn btn-primary">Action</button>
    </div>
  </div>
</div>

// Form Field
<fieldset className="fieldset">
  <legend className="fieldset-legend">Label</legend>
  <input type="text" className="input w-full" />
  <p className="label">Helper text</p>
</fieldset>

// Alert
<div role="alert" className="alert alert-error">
  <span>Error message</span>
</div>
```

## File Naming Conventions
- Components: `PascalCase.tsx` (e.g., `ProductCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useProducts.ts`)
- Types: `types.ts`
- Database: `database.ts`
- Utilities: `camelCase.ts` (e.g., `money.ts`)

## Import Aliases
- `@/` maps to `src/`
- Use: `import { BaseDialog } from '@/core/components'`

## Route Protection
- All routes except `/login` require authentication
- Check `useIsAuthenticated()` from `@/slices/auth`
- Redirect to `/login` if not authenticated

## Permission Checking (Future)
- User permissions stored in `userRolesAtom` as string array
- Format: `["View Menus", "Add Menu", "Delete Menus", ...]`
- Create `useHasPermission(permission: string)` hook when needed

## Error Handling
- Use TanStack Query's error states
- Display errors with `alert alert-error`
- Log errors to console in development

## Testing Approach
- Focus on integration tests
- Test database queries separately
- Mock Tauri APIs in tests

## Key Files Reference
- Database client: `src/core/database/client.ts`
- Auth store: `src/slices/auth/shared/store.ts`
- Base components: `src/core/components/`
- Root route: `src/routes/__root.tsx`
- Layout: `src/core/ui/Layout.tsx`

## Slice Creation Checklist
1. [ ] Create folder structure under `src/slices/`
2. [ ] Define types in `shared/types.ts`
3. [ ] Create database queries in `shared/database.ts`
4. [ ] Create hooks for each use case
5. [ ] Create components
6. [ ] Export from `index.ts`
7. [ ] Add route if needed in `src/routes/`
8. [ ] Add to navigation in `src/config/nav-items.ts` if needed
