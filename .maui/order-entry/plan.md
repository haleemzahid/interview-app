# Order Entry Migration Plan: MAUI → Tauri + React

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [MAUI System Understanding](#3-maui-system-understanding)
4. [Technical Architecture](#4-technical-architecture)
5. [Implementation Phases](#5-implementation-phases)
6. [Component Mapping](#6-component-mapping)
7. [State Management Strategy](#7-state-management-strategy)
8. [Database Integration](#8-database-integration)
9. [UI/UX Implementation](#9-uiux-implementation)
10. [Testing Strategy](#10-testing-strategy)

---

## 1. Executive Summary

### Project Goal
Migrate the Order Entry module from .NET MAUI to Tauri 2 + React, connecting to the existing PennPOS SQLite database.

### Key Technologies
| Layer | MAUI (Current) | Tauri (Target) |
|-------|----------------|----------------|
| UI Framework | .NET MAUI + XAML | React 18 + TypeScript |
| State | MVVM + ObservableCollection | Jotai (session) + TanStack Query (server) |
| Styling | Syncfusion + Custom XAML | Tailwind CSS 4 + daisyUI 5 |
| Database | EF Core + SQLite | @tauri-apps/plugin-sql + SQLite |
| Forms | Data Binding | TanStack Form |
| Routing | Shell Navigation | TanStack Router (file-based) |

### Scope

#### ✅ Confirmed V1 Features
| Feature | Status | Notes |
|---------|--------|-------|
| Menu browsing | ✅ In scope | Horizontal columns, colored tiles |
| Cart management | ✅ In scope | Add/remove/edit items |
| Modifier selection (with portions) | ✅ In scope | Size → Type → Portion → Modifiers flow |
| Size/Type selection | ✅ In scope | Auto-advance, single selection |
| Discounts (item + invoice) | ✅ In scope | Percentage-based |
| Hold/Recall orders | ✅ In scope | JSON serialization |
| Cash payment (record only) | ✅ In scope | No drawer integration |
| Card payment (record only) | ✅ In scope | No live processing |
| Service method toggle | ✅ In scope | Dine-In (default) / To-Go |
| Tax calculation by service method | ✅ In scope | TaxRate junction table |
| Offline support | ✅ In scope | Local SQLite |
| Permission validation (UI + API) | ✅ In scope | Hide + enforce |

#### ❌ Out of Scope (V2+)
| Feature | Status | Notes |
|---------|--------|-------|
| Split payments | ❌ V2 | Single tender only for V1 |
| Refunds/Voids | ❌ V2 | Not in current MAUI code |
| Receipt printing | ❌ V2 | Tauri plugin needed |
| Audit trail | ❌ V2 | No logging for overrides |
| Multi-terminal sync | ❌ V2 | Last write wins for now |

### Implementation Phases
- **Phase 1**: Menu browsing (read-only)
- **Phase 2**: Cart/Invoice state management
- **Phase 3**: Modifier selection
- **Phase 4**: Payment processing
- **Phase 5**: Hold/Recall orders

---

## 2. Current State Analysis

### 2.1 Existing Tauri Project Structure
```
src/
├── slices/
│   ├── auth/                    # ✅ PIN-based authentication
│   │   ├── login/
│   │   │   ├── LoginForm.tsx
│   │   │   └── useLogin.ts
│   │   └── shared/
│   │       ├── database.ts      # Employee/Role queries
│   │       ├── store.ts         # Jotai atoms (currentUser, roles)
│   │       └── types.ts         # Employee, Role interfaces
│   │
│   ├── todos/                   # ✅ Reference CRUD implementation
│   │   ├── config.ts            # Navigation config
│   │   ├── index.ts             # Public exports
│   │   ├── shared/
│   │   │   ├── database.ts      # SQL query functions
│   │   │   └── types.ts         # TypeScript interfaces
│   │   ├── create-todo/
│   │   ├── list-todos/
│   │   ├── update-todo/
│   │   └── delete-todo/
│   │
│   └── shared/                  # Cross-cutting concerns
│       ├── types/
│       ├── utils/
│       └── constants/
│
├── core/
│   ├── components/              # ✅ Reusable UI components
│   │   ├── BaseListPage.tsx     # Standard list page layout
│   │   ├── BaseTable.tsx        # TanStack Table wrapper
│   │   └── BaseDialog.tsx       # Modal dialog
│   │
│   ├── database/
│   │   └── client.ts            # ✅ SQLite connection to PennPOS DB
│   │
│   └── ui/
│       └── Layout.tsx           # Sidebar + main content layout
│
├── config/
│   └── nav-items.ts             # Navigation menu items
│
└── routes/
    ├── __root.tsx               # Root layout + auth check
    ├── index.tsx                # Home page
    ├── login.tsx                # Login page
    └── todos.tsx                # Todos page
```

### 2.2 Database Connection (Existing)
```typescript
// src/core/database/client.ts
const PENNPOS_DB_PATH = 'sqlite:C:\\Users\\Haleem Khan\\AppData\\Local\\Packages\\com.companynameV2.PennPOS.App_dp9yhbjdv06c8\\LocalState\\efcoredbv2.db3'

export async function getDatabase() {
  if (!db) {
    db = await Database.load(PENNPOS_DB_PATH)
  }
  return db
}
```

### 2.3 Established Patterns

**Query Pattern:**
```typescript
import { getDatabase } from '@/core/database/client'

export async function getMenus(): Promise<Menu[]> {
  const db = await getDatabase()
  return db.select<Menu[]>('SELECT * FROM Menu ORDER BY OrderNumber')
}
```

**Jotai State Pattern:**
```typescript
import { atom, useAtomValue, useSetAtom } from 'jotai'

export const currentUserAtom = atom<Employee | null>(null)
export const useCurrentUser = () => useAtomValue(currentUserAtom)
```

**TanStack Query Pattern:**
```typescript
export function useMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: getMenus,
  })
}
```

---

## 3. MAUI System Understanding

### 3.1 Database Schema Overview

#### Menu Hierarchy (Read from DB)
```
Menu
  └── MenuCategory
        └── Product
              ├── AssignedSize → Size
              ├── ToppingCategory → Topping
              ├── PortionType
              └── TaxGroupId → TaxGroup → TaxRate (per ServiceMethod)
```

#### Invoice/Cart (In-Memory + Persisted)
```
Invoice
  ├── InvoiceItem
  │     ├── InvoiceItemModifier (selected toppings)
  │     └── InvoiceItemPortion (e.g., half/half pizza)
  └── InvoiceTender (payment records)
```

### 3.2 Key Tables Summary

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `Menu` | Top-level menu groups | Id, Name, BackColor, ForeColor, OrderNumber |
| `MenuCategory` | Categories within menus | MenuId, Name, BackColor, ForeColor |
| `Product` | Individual menu items | MenuCategoryId, Name, BasePrice, IsTaxed, TaxGroupId |
| `AssignedSize` | Product size options | ProductId, SizeId, Price |
| `Size` | Size definitions | Name (Small/Medium/Large) |
| `ToppingCategory` | Modifier groups | ProductId, IsMandatory, CanAddMultiple |
| `Topping` | Individual modifiers | ToppingCategoryId, Name, Price |
| `PortionType` | Portion options | ProductId, Name, Price |
| `ServiceMethod` | Dine In/Take Out/Delivery | Id, Name |
| `TaxRate` | Tax rates (junction) | TaxGroupId, ServiceMethodId, Rate |
| `Customer` | Customer database | FirstName, LastName, Phone |
| `Discount` | Discount types | DiscountType, DiscountValue, IsForInvoice/IsForItem |
| `PaymentMethod` | Payment options | Name (Cash, Credit, etc.) |

### 3.3 Business Logic Understood

#### Tax Calculation
```
TaxRate = TaxRate table lookup WHERE TaxGroupId = Product.TaxGroupId 
                               AND ServiceMethodId = CurrentServiceMethod.Id
```

#### Item Pricing
```
ItemLinePrice = (BasePrice × Quantity) + ToppingsTotalPrice
TotalItemDiscount = (ItemLinePrice / 100) × ItemDiscountPercentage
TotalInvoiceDiscount = ((ItemLinePrice - TotalItemDiscount) / 100) × InvoiceDiscountPercentage
GrandTotalDiscount = TotalItemDiscount + TotalInvoiceDiscount
TotalTax = ((ItemLinePrice - GrandTotalDiscount) / 100) × TaxRate
ItemGrandTotal = ItemLinePrice + TotalTax - GrandTotalDiscount
```

#### Invoice Totals
```
SubTotal = Sum(All Items' ItemLinePrice)
TotalTax = Sum(All Items' TotalTax)
GrandTotalDiscount = Sum(All Items' GrandTotalDiscount)
GrandTotal = SubTotal + TotalTax - GrandTotalDiscount
TotalDue = GrandTotal - Sum(All Tenders)
```

### 3.4 UI Flow Understood

#### Entry Flow
1. **PIN Dialog** → Employee authentication (every entry to Order Entry)
2. **Customer Selection** → Autocomplete with on-screen keyboard
3. **Menu Browsing** → Horizontal columns layout

#### Main Layout (Two-Column)
```
┌────────────────────────────────────────────────────────────┐
│  LEFT COLUMN (330px desktop)  │  RIGHT COLUMN (flexible)   │
│  ├── Invoice/Cart Panel       │  ├── Product Selection     │
│  └── Payment Panel            │  ├── Modifier View         │
│                               │  ├── Cart View             │
│                               │  └── Discount View         │
└────────────────────────────────────────────────────────────┘
```

#### View States
```typescript
enum Views {
  Product,      // Default - menu browsing
  AddProduct,   // Modifier selection
  Cart,         // Expanded cart view
  Discount,     // Discount selection
  PaymentMenu   // Payment processing
}
```

#### Product Selection Flow (Horizontal Columns)
```
Menus → Menu Products → Menu Groups → Products → Direct Products
  │          │               │            │              │
  ▼          ▼               ▼            ▼              ▼
Column 1   Column 2       Column 3    Column 4       Column 5
```

#### Modifier View (Tabbed)
```
[Sizes] [Types] [Portions] [Modifier Groups] [Modifiers]
           │
           ▼
    Tab Content Area (switches based on selected tab)
```

### 3.5 Key UI Elements from Screenshots

| Element | Behavior |
|---------|----------|
| PIN Keypad | 4-digit numeric entry, C=clear, X=backspace |
| Customer Autocomplete | Type to filter, select existing or create new |
| Menu Columns | Horizontal scroll, colored tiles (200px wide) |
| Product Tiles | BackColor/ForeColor from DB, tap to select |
| Modifier Tabs | Sizes → Types → Portions → Modifier Groups → Modifiers |
| Topping Selection | Grid layout, cyan border = selected |
| Cart Item | Quantity + Name + Price, modifiers indented with trash icon |
| Quick Actions | Footer buttons (Tax Exempt, Hold, Cancel, etc.) |
| Quantity Controls | [-] [count] [+] circular buttons |

---

## 4. Technical Architecture

### 4.1 Order Entry Slice Structure
```
src/slices/order-entry/
├── config.ts                      # Navigation config
├── index.ts                       # Public exports
│
├── shared/
│   ├── types/
│   │   ├── menu.ts               # Menu, MenuCategory, Product
│   │   ├── invoice.ts            # Invoice, InvoiceItem, Modifier
│   │   ├── payment.ts            # PaymentMethod, Tender
│   │   └── index.ts              # Re-exports
│   │
│   ├── database/
│   │   ├── menu-queries.ts       # Menu, Category, Product queries
│   │   ├── product-queries.ts    # Sizes, Toppings, Portions
│   │   ├── invoice-queries.ts    # Invoice CRUD
│   │   ├── lookup-queries.ts     # ServiceMethods, PaymentMethods, etc.
│   │   └── index.ts
│   │
│   ├── store/
│   │   ├── invoice-atoms.ts      # currentInvoice, currentItem
│   │   ├── ui-atoms.ts           # currentView, selectedMenu, etc.
│   │   └── index.ts
│   │
│   └── utils/
│       ├── pricing.ts            # Price calculation functions
│       └── formatters.ts         # Currency, date formatters
│
├── entry-flow/
│   ├── PinDialog.tsx             # PIN entry modal
│   ├── usePinAuth.ts
│   ├── CustomerDialog.tsx        # Customer selection modal
│   └── useCustomerSearch.ts
│
├── browse-menu/
│   ├── OrderEntryPage.tsx        # Main page component
│   ├── MenuColumn.tsx            # Single menu column
│   ├── ProductTile.tsx           # Individual product button
│   ├── useMenus.ts
│   ├── useCategories.ts
│   └── useProducts.ts
│
├── invoice-panel/
│   ├── InvoicePanel.tsx          # Left column cart
│   ├── CartItem.tsx              # Single cart item
│   ├── CartModifier.tsx          # Modifier display
│   ├── TotalsSection.tsx
│   └── useInvoice.ts
│
├── modifier-view/
│   ├── ModifierView.tsx          # Full modifier screen
│   ├── SizeSelector.tsx
│   ├── TypeSelector.tsx
│   ├── PortionSelector.tsx
│   ├── ToppingCategoryTabs.tsx
│   ├── ToppingGrid.tsx
│   ├── AffixBar.tsx              # No/Extra/Light buttons
│   ├── QuantityControls.tsx
│   └── useModifiers.ts
│
├── discount-view/
│   ├── DiscountView.tsx
│   ├── DiscountTile.tsx
│   └── useDiscounts.ts
│
├── payment-view/
│   ├── PaymentPanel.tsx
│   ├── TenderInput.tsx
│   ├── PaymentMethodGrid.tsx
│   ├── NumericKeypad.tsx
│   └── usePayment.ts
│
├── quick-actions/
│   ├── QuickActionsFooter.tsx
│   └── useQuickActions.ts
│
└── hold-invoices/
    ├── HoldInvoiceGrid.tsx
    ├── useHoldInvoices.ts
    └── useRecallInvoice.ts
```

### 4.2 Route Structure
```
src/routes/
├── order-entry.tsx               # Main Order Entry page
├── order-entry/
│   └── index.tsx                 # Redirects to main
```

---

## 5. Implementation Phases

### Phase 1: Foundation & Menu Browsing (Week 1)
**Goal**: Display menus, categories, and products from live database

#### Tasks
1. Create `order-entry` slice folder structure
2. Define TypeScript interfaces for Menu, MenuCategory, Product, Size
3. Implement database queries (getMenus, getCategories, getProducts)
4. Create TanStack Query hooks
5. Build horizontal column layout component
6. Style product tiles with dynamic BackColor/ForeColor
7. Add to navigation

#### Deliverables
- [ ] Types: `Menu`, `MenuCategory`, `Product`, `AssignedSize`, `Size`
- [ ] Database: `getMenus()`, `getCategoriesByMenu()`, `getProductsByCategory()`, `getSizesForProduct()`
- [ ] Hooks: `useMenus()`, `useCategories()`, `useProducts()`, `useSizes()`
- [ ] Components: `OrderEntryPage`, `MenuColumn`, `ProductTile`
- [ ] Route: `/order-entry`
- [ ] Navigation: Add to nav-items.ts

### Phase 2: Invoice/Cart State (Week 2)
**Goal**: Manage cart state with Jotai, display invoice panel

#### Tasks
1. Define Invoice, InvoiceItem, InvoiceItemModifier types
2. Create Jotai atoms for currentInvoice, currentItem, selectedServiceMethod
3. Implement add/remove/update item functions
4. Build invoice panel (left column)
5. Implement price calculation utilities
6. Connect product selection to cart

#### Deliverables
- [ ] Types: `Invoice`, `InvoiceItem`, `InvoiceItemModifier`, `InvoiceItemPortion`
- [ ] Atoms: `currentInvoiceAtom`, `currentItemAtom`, `serviceMethodAtom`
- [ ] Utils: `calculateItemTotal()`, `calculateInvoiceTotal()`
- [ ] Components: `InvoicePanel`, `CartItem`, `TotalsSection`

### Phase 3: Modifier Selection (Week 3)
**Goal**: Full modifier view with sizes, types, portions, toppings

#### Tasks
1. Define Topping, ToppingCategory, PortionType, Affix types
2. Implement topping/portion database queries
3. Create tabbed modifier view
4. Build size/type/portion selectors
5. Build topping category tabs + topping grid
6. Implement affix bar (No/Extra/Light)
7. Connect modifiers to cart item

#### Deliverables
- [ ] Types: `ToppingCategory`, `Topping`, `PortionType`, `Affix`
- [ ] Database: `getToppingCategories()`, `getToppings()`, `getPortionTypes()`, `getAffixes()`
- [ ] Components: `ModifierView`, `SizeSelector`, `ToppingCategoryTabs`, `ToppingGrid`, `AffixBar`
- [ ] State: Modifier selection logic, price updates

### Phase 4: Service Methods & Tax (Week 3-4)
**Goal**: Service method selection, tax rate lookup

#### Tasks
1. Define ServiceMethod, TaxGroup, TaxRate types
2. Implement tax lookup query (TaxGroupId + ServiceMethodId)
3. Add service method dropdown to invoice panel
4. Update tax calculation based on service method

#### Deliverables
- [ ] Types: `ServiceMethod`, `TaxGroup`, `TaxRate`
- [ ] Database: `getServiceMethods()`, `getTaxRate(taxGroupId, serviceMethodId)`
- [ ] Components: `ServiceMethodDropdown`
- [ ] Logic: Tax calculation per service method

### Phase 5: Discounts (Week 4)
**Goal**: Item and invoice discount application

#### Tasks
1. Define Discount type
2. Implement discount queries
3. Build discount view
4. Implement discount application logic (percentage/fixed)
5. Update totals calculations

#### Deliverables
- [ ] Types: `Discount`
- [ ] Database: `getDiscounts()`
- [ ] Components: `DiscountView`, `DiscountTile`
- [ ] Logic: `applyItemDiscount()`, `applyInvoiceDiscount()`

### Phase 6: Payment Processing (Week 4-5)
**Goal**: Accept payments and complete orders

#### Tasks
1. Define PaymentMethod, InvoiceTender types
2. Implement payment method queries
3. Build payment panel with keypad
4. Build payment method grid
5. Implement tender recording
6. Implement invoice completion
7. Save completed invoice to database

#### Deliverables
- [ ] Types: `PaymentMethod`, `InvoiceTender`
- [ ] Database: `getPaymentMethods()`, `saveInvoice()`, `saveInvoiceTenders()`
- [ ] Components: `PaymentPanel`, `NumericKeypad`, `PaymentMethodGrid`
- [ ] Logic: `addTender()`, `completeInvoice()`

### Phase 7: Hold/Recall Orders (Week 5)
**Goal**: Save orders for later, recall held orders

#### Tasks
1. Implement hold invoice (save as JSON)
2. Build hold invoice grid
3. Implement recall invoice (load from JSON)
4. Handle invoice status management

#### Deliverables
- [ ] Database: `saveHoldInvoice()`, `getHoldInvoices()`, `deleteHoldInvoice()`
- [ ] Components: `HoldInvoiceGrid`
- [ ] Logic: JSON serialization/deserialization

### Phase 8: Entry Flow (Week 5)
**Goal**: PIN authentication and customer selection

#### Tasks
1. Build PIN dialog with numeric keypad
2. Implement PIN validation against Employee.Login
3. Build customer selection dialog with autocomplete
4. Implement customer search/create

#### Deliverables
- [ ] Components: `PinDialog`, `CustomerDialog`, `OnScreenKeyboard`
- [ ] Database: `searchCustomers()`, `createCustomer()`
- [ ] Logic: Entry flow orchestration

### Phase 9: Quick Actions (Week 6)
**Goal**: Footer action buttons

#### Tasks
1. Build quick actions footer
2. Implement each action (Tax Exempt, Hold, Cancel, Delete Item, etc.)
3. Connect to invoice state

#### Deliverables
- [ ] Components: `QuickActionsFooter`
- [ ] Actions: All quick action implementations

---

## 6. Component Mapping

### MAUI → React Component Map

| MAUI Component | React Component | Description |
|----------------|-----------------|-------------|
| `OrderEntryView.xaml` | `OrderEntryPage.tsx` | Main container |
| `InvoiceMenu.xaml` | `InvoicePanel.tsx` | Left column cart |
| `PaymentMenu.xaml` | `PaymentPanel.tsx` | Payment view |
| `ProductsView.xaml` | `MenuColumn.tsx` | Product grid columns |
| `CategoriesView.xaml` | `MenuColumn.tsx` | Category column |
| `ModifiresView.xaml` | `ModifierView.tsx` | Modifier screen |
| `PortionsView.xaml` | `SizeSelector.tsx` | Size selection |
| `ToppingCategoriesView.xaml` | `ToppingCategoryTabs.tsx` | Topping tabs |
| `ToppingsView.xaml` | `ToppingGrid.tsx` | Topping checkboxes |
| `CartView.xaml` | `CartView.tsx` | Expanded cart |
| `DiscountView.xaml` | `DiscountView.tsx` | Discount selection |
| `FooterView.xaml` | `QuickActionsFooter.tsx` | Action buttons |
| `ReceiptView.xaml` | `CartItem.tsx` | Cart line item |

### MAUI ViewModel → React State Map

| MAUI ViewModel | React State | Location |
|----------------|-------------|----------|
| `MenuServiceViewModel` | Multiple hooks | Use-case hooks |
| `InvoiceViewModel` | `currentInvoiceAtom` | Jotai atom |
| `ItemViewModel` | `currentItemAtom` | Jotai atom |
| `ItemPortionViewModel` | Part of `InvoiceItem` | Nested in item |

---

## 7. State Management Strategy

### 7.1 Jotai Atoms (Session State)

```typescript
// src/slices/order-entry/shared/store/invoice-atoms.ts

// Current invoice being built
export const currentInvoiceAtom = atom<Invoice | null>(null)

// Currently selected/editing item
export const currentItemAtom = atom<InvoiceItem | null>(null)

// Selected service method (affects tax)
export const serviceMethodAtom = atom<ServiceMethod | null>(null)

// Selected customer
export const selectedCustomerAtom = atom<Customer | null>(null)
```

```typescript
// src/slices/order-entry/shared/store/ui-atoms.ts

// Current view state
export const currentViewAtom = atom<Views>('product')

// Selected menu
export const selectedMenuAtom = atom<Menu | null>(null)

// Selected category
export const selectedCategoryAtom = atom<MenuCategory | null>(null)

// Selected product (for modifier view)
export const selectedProductAtom = atom<Product | null>(null)

// Selected topping category
export const selectedToppingCategoryAtom = atom<ToppingCategory | null>(null)
```

### 7.2 TanStack Query (Server State)

```typescript
// src/slices/order-entry/browse-menu/useMenus.ts
export function useMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: getMenus,
  })
}

// src/slices/order-entry/browse-menu/useCategories.ts
export function useCategories(menuId: string | null) {
  return useQuery({
    queryKey: ['categories', menuId],
    queryFn: () => getCategoriesByMenu(menuId!),
    enabled: !!menuId,
  })
}
```

### 7.3 State Boundaries

| State Type | Solution | Example |
|------------|----------|---------|
| Menu/Product data | TanStack Query | Cached, refetchable |
| Current invoice | Jotai | Persists across view changes |
| Current item being edited | Jotai | Temporary until added to cart |
| UI selections | Jotai | selectedMenu, selectedCategory |
| View mode | Jotai | product/modifier/discount/payment |

---

## 8. Database Integration

### 8.1 Query Files Structure

```typescript
// src/slices/order-entry/shared/database/menu-queries.ts
import { getDatabase } from '@/core/database/client'
import type { Menu, MenuCategory, Product } from '../types'

export async function getMenus(): Promise<Menu[]> {
  const db = await getDatabase()
  return db.select<Menu[]>(`
    SELECT Id, Name, DisplayName, BackColor, ForeColor, IsNoMenu, OrderNumber
    FROM Menu
    ORDER BY OrderNumber
  `)
}

export async function getCategoriesByMenu(menuId: string): Promise<MenuCategory[]> {
  const db = await getDatabase()
  return db.select<MenuCategory[]>(`
    SELECT Id, MenuId, Name, DisplayName, BackColor, ForeColor, OrderNumber
    FROM MenuCategory
    WHERE MenuId = $1
    ORDER BY OrderNumber
  `, [menuId])
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const db = await getDatabase()
  return db.select<Product[]>(`
    SELECT Id, MenuCategoryId, MenuId, Name, DisplayName, BackColor, ForeColor,
           IsTaxed, BasePrice, TaxRate, TaxGroupId, AllowedSpecialRequest, OrderNumber
    FROM Product
    WHERE MenuCategoryId = $1
    ORDER BY OrderNumber
  `, [categoryId])
}
```

### 8.2 Tax Lookup (Junction Table)

```typescript
// src/slices/order-entry/shared/database/lookup-queries.ts
export async function getTaxRate(taxGroupId: string, serviceMethodId: string): Promise<number> {
  const db = await getDatabase()
  const result = await db.select<{Rate: number}[]>(`
    SELECT Rate
    FROM TaxRate
    WHERE TaxGroupId = $1 AND ServiceMethodId = $2
  `, [taxGroupId, serviceMethodId])
  return result[0]?.Rate ?? 0
}
```

---

## 9. UI/UX Implementation

### 9.1 Layout Structure

```tsx
// OrderEntryPage layout
<div className="h-screen flex">
  {/* Left Column - Invoice Panel */}
  <div className="w-[330px] md:w-[520px] flex-shrink-0 border-r">
    <InvoicePanel />
  </div>
  
  {/* Right Column - Content Area */}
  <div className="flex-1 flex flex-col">
    {/* Header */}
    <header className="h-[50px] flex items-center px-4 border-b">
      <HeaderActions />
    </header>
    
    {/* Content - switches based on currentView */}
    <main className="flex-1 overflow-hidden">
      {view === 'product' && <MenuBrowser />}
      {view === 'modifier' && <ModifierView />}
      {view === 'discount' && <DiscountView />}
      {view === 'cart' && <CartView />}
    </main>
    
    {/* Footer - Quick Actions */}
    <footer className="h-[100px] border-t">
      <QuickActionsFooter />
    </footer>
  </div>
</div>
```

### 9.2 Menu Browser (Horizontal Columns)

```tsx
// MenuBrowser - horizontal scrollable columns
<div className="h-full flex overflow-x-auto">
  <MenuColumn title="Menus" items={menus} onSelect={setSelectedMenu} />
  {selectedMenu && (
    <MenuColumn title="Menu Products" items={menuProducts} onSelect={addToCart} />
  )}
  {categories.length > 1 && (
    <MenuColumn title="Menu Groups" items={categories} onSelect={setSelectedCategory} />
  )}
  {selectedCategory && (
    <MenuColumn title="Products" items={products} onSelect={addToCart} />
  )}
</div>
```

### 9.3 Product Tile Styling

```tsx
// Dynamic colors from database
<button
  className="min-w-[200px] min-h-[50px] rounded-md p-3"
  style={{
    backgroundColor: product.BackColor || undefined,
    color: product.ForeColor || undefined,
  }}
  onClick={() => onSelect(product)}
>
  {product.Name}
</button>
```

### 9.4 Tablet Optimization

```tsx
// Responsive touch targets
<button className="min-h-[48px] md:min-h-[60px] touch-manipulation">
  {/* Content */}
</button>

// Breakpoints
// md: 768px (tablet)
// lg: 1024px (desktop)
```

### 9.5 Modifier View Tabs

```tsx
<div className="flex flex-col h-full">
  {/* Tab Buttons */}
  <div className="flex gap-2 p-2">
    {hasSizes && <TabButton active={tab === 'sizes'}>Sizes</TabButton>}
    {hasTypes && <TabButton active={tab === 'types'}>Types</TabButton>}
    {hasPortions && <TabButton active={tab === 'portions'}>Portions</TabButton>}
    {hasToppingCategories && <TabButton active={tab === 'groups'}>Modifier Groups</TabButton>}
    {selectedToppingCategory && <TabButton active={tab === 'modifiers'}>Modifiers</TabButton>}
  </div>
  
  {/* Tab Content */}
  <div className="flex-1 overflow-auto p-2">
    {tab === 'sizes' && <SizeSelector />}
    {tab === 'types' && <TypeSelector />}
    {tab === 'portions' && <PortionSelector />}
    {tab === 'groups' && <ToppingCategoryTabs />}
    {tab === 'modifiers' && <ToppingGrid />}
  </div>
</div>
```

---

## 10. Testing Strategy

### 10.1 Database Query Tests
- Test each query function independently
- Verify correct data returned from live PennPOS database
- Test edge cases (null categories, no products, etc.)

### 10.2 Price Calculation Tests
- Unit tests for `calculateItemTotal()`
- Test discount application (percentage, fixed)
- Test tax calculation with different service methods
- Test invoice totals

### 10.3 Integration Tests
- Menu selection → product display
- Product selection → modifier view
- Modifier selection → cart update
- Payment flow → invoice completion

### 10.4 UI Tests
- Responsive layout (tablet vs desktop)
- Touch target sizes
- Dynamic color rendering
- View state transitions

---

## Summary

This plan provides a comprehensive roadmap for migrating the PennPOS Order Entry system from .NET MAUI to Tauri + React. The implementation follows a phased approach, starting with read-only menu browsing and progressively adding cart management, modifiers, payments, and hold/recall functionality.

Key architectural decisions:
- **Vertical slice architecture** matching existing project structure
- **Jotai for session state** (cart, selections, UI state)
- **TanStack Query for server state** (menus, products, lookups)
- **Direct SQLite queries** to existing PennPOS database
- **daisyUI 5 + Tailwind** for styling with dynamic colors
- **Tablet-first responsive design** with 768px breakpoint

Ready to begin Phase 1 implementation.
---

## 11. Architecture Decisions (Expert Panel Consensus)

### 11.1 UI Architecture

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| **Routing** | Single `/order-entry` route with internal state machine | Cart must stay visible; tabs are a stepped wizard, not routes |
| **Layout** | Two-column with persistent cart panel | Left=Cart, Right=Menu/Modifiers - matches MAUI layout |
| **Tab Navigation** | `useReducer` state machine | Not all products have all tabs; need conditional flow |
| **Back Button** | Browser history + route guards | Prevent navigation if item incomplete |

### 11.2 State Management

| State Type | Solution | Example |
|------------|----------|---------|
| Cart items | Jotai atom with reducer | `cartAtom` with `ADD_ITEM`, `UPDATE_MODIFIERS`, etc. |
| Current item config | Local `useState` | Draft pattern - commit on "Done" |
| Derived totals | Computed atom | `cartTotalsAtom` recalculates on cart change |
| Menu/Product data | TanStack Query | `staleTime: 5 * 60 * 1000` (5 min cache) |
| Tax rates | Pre-fetch on app start | Cache all TaxGroupId × ServiceMethodId combinations |
| Service method | Jotai atom | Affects tax calculation cascade |

### 11.3 Cart State Structure

```typescript
// Flat structure - optimized for POS (rarely > 20 items)
interface CartItem {
  id: string                    // Unique cart item ID
  product: Product              // Embedded product data
  quantity: number
  size?: AssignedSize
  type?: ProductType
  portions: CartItemPortion[]   // Each portion has its own modifiers
  modifiers: CartItemModifier[] // Item-level modifiers (no portion)
  itemDiscount?: Discount
  taxRate: number               // Resolved at add time
  specialInstructions: string[]
}

interface CartItemPortion {
  portionType: PortionType
  modifiers: CartItemModifier[]
}

interface CartItemModifier {
  topping: Topping
  affix?: Affix               // "No", "Extra", "Light"
  quantity: number
}
```

### 11.4 Calculation Logic

All calculations are **pure functions** called from derived atoms:

```typescript
// Pure functions - no side effects
const calculateItemLinePrice = (item: CartItem): number => {
  const basePrice = item.size?.price ?? item.product.basePrice
  const modifiersTotal = item.modifiers.reduce((sum, m) => 
    sum + calculateModifierPrice(m), 0)
  const portionsTotal = item.portions.reduce((sum, p) => 
    sum + p.modifiers.reduce((s, m) => s + calculateModifierPrice(m), 0), 0)
  return (basePrice * item.quantity) + modifiersTotal + portionsTotal
}

const calculateItemTax = (item: CartItem, isTaxExempt: boolean): number => {
  if (isTaxExempt || item.product.isTaxFreeItem) return 0
  const linePrice = calculateItemLinePrice(item)
  const discount = calculateItemDiscount(item)
  return ((linePrice - discount) * item.taxRate) / 100
}

// Derived atom - auto-recalculates
const cartTotalsAtom = atom((get) => {
  const items = get(cartItemsAtom)
  const isTaxExempt = get(isTaxExemptAtom)
  return items.reduce((acc, item) => ({
    subTotal: acc.subTotal + calculateItemLinePrice(item),
    tax: acc.tax + calculateItemTax(item, isTaxExempt),
    discount: acc.discount + calculateItemDiscount(item),
  }), { subTotal: 0, tax: 0, discount: 0 })
})
```

### 11.5 Tab State Machine

```typescript
type ConfigStep = 'size' | 'type' | 'portion' | 'modifier-groups' | 'modifiers'

interface ConfigState {
  step: ConfigStep
  product: Product
  size?: AssignedSize
  type?: ProductType
  selectedPortion?: PortionType
  selectedToppingCategory?: ToppingCategory
}

// Determine available steps based on product
const getAvailableSteps = (product: Product): ConfigStep[] => {
  const steps: ConfigStep[] = []
  if (product.assignedSizes?.length > 0) steps.push('size')
  if (product.productTypes?.length > 0) steps.push('type')
  if (product.portionTypes?.length > 0) steps.push('portion')
  if (product.toppingCategories?.length > 1) steps.push('modifier-groups')
  if (product.toppingCategories?.length > 0) steps.push('modifiers')
  return steps
}

// Auto-advance after selection
const autoAdvance = (current: ConfigStep, available: ConfigStep[]): ConfigStep => {
  const currentIndex = available.indexOf(current)
  return available[currentIndex + 1] ?? current
}
```

---

## 12. Reference Files

### 12.1 MAUI ViewModels (Business Logic Reference)

| File | Purpose | Key Patterns |
|------|---------|--------------|
| [viewmodels/ItemViewModel.cs](viewmodels/ItemViewModel.cs) | Item price calculations | `TotalItemDiscount`, `ItemGrandTotal` formulas |
| [viewmodels/InvoiceViewModel.cs](viewmodels/InvoiceViewModel.cs) | Invoice totals | `UpdateTotals()`, `TotalDue` calculation |
| [viewmodels/MenuServiceVMproperties.cs](viewmodels/MenuServiceVMproperties.cs) | State properties | Tab enablement logic, `SelectedProduct` |
| [viewmodels/MenuServiceVMcommands.cs](viewmodels/MenuServiceVMcommands.cs) | Commands/Actions | `AddProduct`, `AddSize`, payment flow |
| [viewmodels/MenuServiceVMfunctions.cs](viewmodels/MenuServiceVMfunctions.cs) | Data loading | `LoadMenusAsync()`, caching, `ApplyDiscount()` |
| [viewmodels/MenuServiceViewModel.cs](viewmodels/MenuServiceViewModel.cs) | Main orchestrator | Message passing, collection subscriptions |
| [viewmodels/ItemPortionViewModel.cs](viewmodels/ItemPortionViewModel.cs) | Portion modifiers | `AddTopping()` with category replacement |
| [viewmodels/Views.cs](viewmodels/Views.cs) | View enum | `[Flags] enum Views` for visibility |

### 12.2 MAUI XAML (UI Reference)

| File | Purpose | Key Elements |
|------|---------|--------------|
| [3. Product View](3.%20Product%20View) | Menu browsing | Horizontal columns, colored tiles |
| [3. Modifier View](3.%20Modifier%20View) | Modifier selection | Tabbed interface, topping grid |
| [3.Cart View](3.Cart%20View) | Cart display | Item list with modifiers, quantity controls |
| [3.Invoice Menu](3.Invoice%20Menu) | Invoice panel | Totals section, quick actions |
| [3.Payment Menu](3.Payment%20Menu) | Payment view | Tender input, payment methods |
| [3. Discount view](3.%20Discount%20view) | Discount selection | Discount tiles |

### 12.3 Screenshots

| File | Shows |
|------|-------|
| [1.png](1.png) | PIN entry dialog |
| [2.0.png](2.0.png), [2.1.png](2.1.png) | Customer selection |
| [3.png](3.png) | Main menu browsing |
| [4.png](4.png) | Modifier groups (tabbed) |
| [6.png](6.png) | Cart with modifiers |

### 12.4 Documentation

| File | Purpose |
|------|---------|
| [docs.md](docs.md) | Complete Order Entry documentation (1400+ lines) |

---

## 13. Open Questions for Future

1. **Keyboard navigation** - Arrow keys for menu browsing on tablets with keyboards?
2. **Sound feedback** - Audio confirmation on item add/payment complete?
3. **Barcode scanning** - USB barcode scanner integration for products?
4. **Customer display** - Secondary screen for customer-facing totals?
5. **Kitchen display integration** - Send orders to kitchen system?