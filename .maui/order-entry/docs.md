

# Order Entry System Documentation

## Overview
The Order Entry system is the core POS functionality that allows employees to create, manage, and complete customer orders. It handles menu navigation, product selection, modifiers (toppings), portions, discounts, taxes, and payment processing.

## System Architecture

### Key Components
1. **Menu Structure** - Hierarchical menu system (Menu → Category → Product → Toppings)
2. **Invoice Management** - Cart/Order management with line items
3. **Pricing Engine** - Complex pricing with modifiers, portions, discounts, and taxes
4. **Payment Processing** - Multiple payment methods and tender handling

---

## 1. Database Schema - Order Entry Tables

### Menu Hierarchy Tables

#### Menu Table
```sql
CREATE TABLE Menu (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    DisplayName TEXT,
    BackColor TEXT,              -- UI background color
    ForeColor TEXT,              -- UI text color
    IsNoMenu INTEGER,            -- Boolean: If true, shows direct products
    OrderNumber INTEGER,         -- Display order
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    CreatedBy TEXT,
    ModifiedBy TEXT,
    CreatorId INTEGER
);
```

#### MenuCategory Table
```sql
CREATE TABLE MenuCategory (
    Id TEXT PRIMARY KEY,
    MenuId TEXT NOT NULL,
    Name TEXT NOT NULL,
    DisplayName TEXT,
    BackColor TEXT,
    ForeColor TEXT,
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (MenuId) REFERENCES Menu(Id)
);
```

#### Product Table
```sql
CREATE TABLE Product (
    Id TEXT PRIMARY KEY,
    MenuCategoryId TEXT,         -- Can be null for direct products
    MenuId TEXT,                 -- Menu reference for direct products
    Name TEXT NOT NULL,
    DisplayName TEXT,
    BackColor TEXT,
    ForeColor TEXT,
    OriginId TEXT,               -- For product cloning/copying
    IsTaxed INTEGER NOT NULL,    -- Boolean: Apply tax to this product
    BasePrice DECIMAL(18,2),     -- Base price if no sizes
    TaxRate DECIMAL(5,2),
    TaxGroupId TEXT,             -- Foreign key to TaxGroup
    AllowedSpecialRequest INTEGER, -- Boolean: Allow special instructions
    ProductTypeName TEXT,
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (MenuCategoryId) REFERENCES MenuCategory(Id),
    FOREIGN KEY (MenuId) REFERENCES Menu(Id)
);
```

#### AssignedSize Table (Product Sizes/Prices)
```sql
CREATE TABLE AssignedSize (
    Id TEXT PRIMARY KEY,
    ProductId TEXT NOT NULL,
    SizeId TEXT NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (ProductId) REFERENCES Product(Id),
    FOREIGN KEY (SizeId) REFERENCES Size(Id)
);
```

#### Size Table
```sql
CREATE TABLE Size (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,          -- e.g., "Small", "Medium", "Large"
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL
);
```

#### ToppingCategory Table
```sql
CREATE TABLE ToppingCategory (
    Id TEXT PRIMARY KEY,
    ProductId TEXT NOT NULL,
    Name TEXT NOT NULL,
    DisplayName TEXT,
    BackColor TEXT,
    ForeColor TEXT,
    IsMandatory INTEGER,         -- Boolean: Must select at least one
    CanAddMultiple INTEGER,      -- Boolean: Can select multiple toppings
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (ProductId) REFERENCES Product(Id)
);
```

#### ToppingCategoryAssignedSize Table (Size-specific topping categories)
```sql
CREATE TABLE ToppingCategoryAssignedSize (
    Id TEXT PRIMARY KEY,
    ToppingCategoryId TEXT NOT NULL,
    SizeId TEXT NOT NULL,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (ToppingCategoryId) REFERENCES ToppingCategory(Id),
    FOREIGN KEY (SizeId) REFERENCES Size(Id)
);
```

#### Topping Table
```sql
CREATE TABLE Topping (
    Id TEXT PRIMARY KEY,
    ToppingCategoryId TEXT NOT NULL,
    Name TEXT NOT NULL,
    DisplayName TEXT,
    BackColor TEXT,
    ForeColor TEXT,
    Price DECIMAL(18,2) NOT NULL,
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (ToppingCategoryId) REFERENCES ToppingCategory(Id)
);
```

#### PortionType Table
```sql
CREATE TABLE PortionType (
    Id TEXT PRIMARY KEY,
    ProductId TEXT NOT NULL,
    Name TEXT NOT NULL,
    DisplayName TEXT,
    BackColor TEXT,
    ForeColor TEXT,
    Price DECIMAL(18,2) NOT NULL,
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (ProductId) REFERENCES Product(Id)
);
```

### Invoice Tables

#### Invoice Table (Order/Cart)
```sql
CREATE TABLE Invoice (
    Id TEXT PRIMARY KEY,
    InvoiceNumber INTEGER NOT NULL,
    CustomerName TEXT,
    CustomerId TEXT,
    TotalInvoiceItems INTEGER,
    SubTotal DECIMAL(18,2),
    TotalTax DECIMAL(18,2),
    TotalDiscount DECIMAL(18,2),
    TotalItemDiscount DECIMAL(18,2),
    TotalInvoiceDiscount DECIMAL(18,2),
    GrandTotalDiscount DECIMAL(18,2),
    GrandTotal DECIMAL(18,2),
    TotalDue DECIMAL(18,2),
    IsHold INTEGER,              -- Boolean: Invoice on hold
    IsTaxExempted INTEGER,       -- Boolean: Tax-exempt invoice
    IsMakeToGo INTEGER,          -- Boolean: To-go order
    Status INTEGER,              -- 0=Hold, 1=Complete, 2=Cancelled, 3=Voided
    ServiceMethodId TEXT,
    ServiceMethodName TEXT,
    HoldDate DATETIME,
    CompletedDate DATETIME,
    HoldReason TEXT,
    EmployeeId TEXT,
    EmployeeName TEXT,
    InvoiceAsJsonString TEXT,    -- JSON serialization for hold invoices
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (CustomerId) REFERENCES Customer(Id),
    FOREIGN KEY (EmployeeId) REFERENCES Employee(Id)
);
```

#### InvoiceItem Table (Order Line Items)
```sql
CREATE TABLE InvoiceItem (
    Id TEXT PRIMARY KEY,
    InvoiceId TEXT NOT NULL,
    ProductId TEXT NOT NULL,
    ProductName TEXT NOT NULL,
    ProductSize TEXT,            -- Selected size name
    ProductType TEXT,
    ItemQty INTEGER NOT NULL,
    ItemBasePrice DECIMAL(18,2), -- Base price per item
    SizePrice DECIMAL(18,2),     -- Price of selected size
    SellablePrice DECIMAL(18,2), -- Final sellable price
    ItemLinePrice DECIMAL(18,2), -- Total line price (qty * base + modifiers)
    IsTaxed INTEGER,
    TaxRate DECIMAL(5,2),
    TotalTax DECIMAL(18,2),
    ItemDiscountPercentage DECIMAL(5,2),
    InvoiceDiscountPercentage DECIMAL(5,2),
    TotalItemDiscount DECIMAL(18,2),
    TotalInvoiceDiscount DECIMAL(18,2),
    GrandTotalDiscount DECIMAL(18,2),
    ItemTotalWithDiscount DECIMAL(18,2),
    ItemTotalWithTax DECIMAL(18,2),
    ItemGrandTotal DECIMAL(18,2),
    IsTaxFreeItem INTEGER,
    SpecialInstructions TEXT,
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (InvoiceId) REFERENCES Invoice(Id)
);
```

#### InvoiceItemModifier Table (Toppings on items)
```sql
CREATE TABLE InvoiceItemModifier (
    Id TEXT PRIMARY KEY,
    InvoiceItemId TEXT NOT NULL,
    InvoiceItemPortionId TEXT,   -- Optional: Modifier specific to a portion
    ModifierId TEXT NOT NULL,    -- Topping ID
    ModifierName TEXT NOT NULL,
    ModifierCategoryId TEXT NOT NULL,
    ModifierCategoryName TEXT NOT NULL,
    ModifierPrice DECIMAL(18,2),
    Quantity INTEGER,
    TotalPrice DECIMAL(18,2),
    AffixId TEXT,                -- Optional: Prefix/Suffix (e.g., "No", "Extra")
    AffixName TEXT,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (InvoiceItemId) REFERENCES InvoiceItem(Id),
    FOREIGN KEY (InvoiceItemPortionId) REFERENCES InvoiceItemPortion(Id)
);
```

#### InvoiceItemPortion Table (Multiple portions of the same item)
```sql
CREATE TABLE InvoiceItemPortion (
    Id TEXT PRIMARY KEY,
    InvoiceItemId TEXT NOT NULL,
    PortionTypeId TEXT NOT NULL,
    PortionTypeName TEXT NOT NULL,
    PortionPrice DECIMAL(18,2),
    Quantity INTEGER,
    TotalPrice DECIMAL(18,2),
    IsSelected INTEGER,          -- Boolean: Currently active portion
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (InvoiceItemId) REFERENCES InvoiceItem(Id)
);
```

#### InvoiceTender Table (Payments)
```sql
CREATE TABLE InvoiceTender (
    Id TEXT PRIMARY KEY,
    InvoiceId TEXT NOT NULL,
    PaymentMethodId TEXT NOT NULL,
    PaymentMethodName TEXT NOT NULL,
    TenderAmount DECIMAL(18,2) NOT NULL,
    TransactionId TEXT,
    AuthorizationCode TEXT,
    CardLast4 TEXT,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (InvoiceId) REFERENCES Invoice(Id)
);
```

### Supporting Tables

#### Discount Table
```sql
CREATE TABLE Discount (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    DisplayName TEXT,
    DiscountType INTEGER,        -- 0=Percentage, 1=FixedAmount
    DiscountValue DECIMAL(18,2),
    IsForInvoice INTEGER,        -- Boolean: Applied to whole invoice
    IsForItem INTEGER,           -- Boolean: Applied to specific items
    RequiresManagerApproval INTEGER,
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL
);
```

#### Affix Table (Prefix/Suffix for modifiers)
```sql
CREATE TABLE Affix (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,          -- e.g., "No", "Extra", "Light", "On Side"
    DisplayName TEXT,
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL
);
```

#### ServiceMethod Table
```sql
CREATE TABLE ServiceMethod (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,          -- e.g., "Dine In", "Take Out", "Delivery"
    DisplayName TEXT,
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL
);
```

#### PaymentMethod Table
```sql
CREATE TABLE PaymentMethod (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,          -- e.g., "Cash", "Credit Card", "Gift Card"
    DisplayName TEXT,
    OrderNumber INTEGER,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL
);
```

#### TaxGroup Table
```sql
CREATE TABLE TaxGroup (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL
);
```

#### TaxGroupTaxRate Table
```sql
CREATE TABLE TaxGroupTaxRate (
    Id TEXT PRIMARY KEY,
    TaxGroupId TEXT NOT NULL,
    TaxRate DECIMAL(5,2) NOT NULL,
    TaxName TEXT,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL,
    FOREIGN KEY (TaxGroupId) REFERENCES TaxGroup(Id)
);
```

#### Customer Table
```sql
CREATE TABLE Customer (
    Id TEXT PRIMARY KEY,
    FirstName TEXT,
    LastName TEXT,
    Phone TEXT,
    Email TEXT,
    Address TEXT,
    City TEXT,
    State TEXT,
    Zip TEXT,
    CreatedDate DATETIME NOT NULL,
    ModifiedDate DATETIME NOT NULL
);
```

---

## 2. Order Entry Business Flow

### Step 1: Order Initialization
When employee navigates to Order Entry page:
1. New `InvoiceViewModel` is created with empty `InvoiceItems` collection
2. Menu structure is loaded from database
3. Default service method is applied
4. Employee information is tracked for the order

### Step 2: Menu Navigation
```
Menu → Menu Category → Product → Size Selection → Topping Selection → Add to Cart
```

**Navigation Hierarchy:**
1. **Menus** - Top-level menu tabs (e.g., "Lunch", "Dinner", "Drinks")
2. **Menu Categories** - Product categories within a menu (e.g., "Pizza", "Pasta", "Salads")
3. **Products** - Individual items (e.g., "Pepperoni Pizza", "Margherita Pizza")
4. **Sizes** - If product has sizes (e.g., "Small", "Medium", "Large")
5. **Topping Categories** - Groups of modifiers (e.g., "Cheese", "Meats", "Vegetables")
6. **Toppings** - Individual modifiers (e.g., "Mozzarella", "Pepperoni", "Mushrooms")

### Step 3: Product Selection Process

#### 3.1 Product Click
```csharp
// MenuServiceViewModel handles product selection
[RelayCommand]
async Task ProductSelected(ProductDto product)
{
    // Create new ItemViewModel
    var item = new ItemViewModel
    {
        ProductGuid = product.Id,
        PrdName = product.Name,
        IsTaxed = product.IsTaxed,
        TaxRate = product.TaxRate,
        AllowedSpecialRequest = product.AllowedSpecialRequest
    };
    
    // Check if product has sizes
    if (product.AssignedSizes?.Any() == true)
    {
        // Show size selection UI
        await ShowSizeSelection(product, item);
    }
    else
    {
        // Use base price
        item.ItemBasePrice = product.BasePrice;
        item.SellablePrice = product.BasePrice;
        
        // Check if product has toppings
        if (product.ToppingCategories?.Any() == true)
        {
            await ShowToppingSelection(product, item);
        }
        else
        {
            // Add directly to invoice
            await AddItemToInvoice(item);
        }
    }
}
```

#### 3.2 Size Selection
```csharp
async Task ShowSizeSelection(ProductDto product, ItemViewModel item)
{
    // Display sizes from product.AssignedSizes
    // User selects a size
    var selectedSize = await DisplaySizeOptions(product.AssignedSizes);
    
    if (selectedSize != null)
    {
        item.ProductSize = selectedSize.Name;
        item.SizePrice = selectedSize.Price;
        item.ItemBasePrice = selectedSize.Price;
        item.SellablePrice = selectedSize.Price;
        
        // Check for size-specific topping categories
        var sizeSpecificToppings = product.ToppingCategories
            .Where(tc => tc.ToppingCategoryAssignedSizes.Any(tcas => tcas.SizeId == selectedSize.SizeId))
            .ToList();
        
        if (sizeSpecificToppings.Any())
        {
            await ShowToppingSelection(product, item, selectedSize.SizeId);
        }
        else
        {
            await AddItemToInvoice(item);
        }
    }
}
```

#### 3.3 Topping Selection (Modifiers)
```csharp
async Task ShowToppingSelection(ProductDto product, ItemViewModel item, string? sizeId = null)
{
    // Get topping categories (filtered by size if applicable)
    var toppingCategories = product.ToppingCategories;
    
    if (sizeId != null)
    {
        toppingCategories = toppingCategories
            .Where(tc => tc.ToppingCategoryAssignedSizes.Any(tcas => tcas.SizeId == sizeId))
            .ToList();
    }
    
    // Display topping categories
    foreach (var category in toppingCategories)
    {
        // Check if mandatory
        if (category.IsMandatory)
        {
            // User must select at least one topping
        }
        
        // Check if can add multiple
        if (category.CanAddMultiple)
        {
            // User can select multiple toppings
        }
        
        // Display toppings in this category
        foreach (var topping in category.Toppings)
        {
            // User can select topping
            // Optionally add affix (No, Extra, Light, etc.)
        }
    }
    
    // Create InvoiceItemModifier for each selected topping
    foreach (var selectedTopping in userSelectedToppings)
    {
        var modifier = new InvoiceItemModifier
        {
            ModifierId = selectedTopping.Id,
            ModifierName = selectedTopping.Name,
            ModifierCategoryId = selectedTopping.ToppingCategoryId,
            ModifierCategoryName = selectedTopping.ToppingCategoryName,
            ModifierPrice = selectedTopping.Price,
            Quantity = 1,
            TotalPrice = selectedTopping.Price,
            AffixId = selectedTopping.AffixId,
            AffixName = selectedTopping.AffixName
        };
        
        // Add to item (stored temporarily in ItemViewModel)
        item.Modifiers.Add(modifier);
        
        // Update item total price
        item.ToppingsTotalPrice += modifier.TotalPrice;
    }
    
    // Recalculate item totals
    item.UpdateProperties();
    
    // Add to invoice
    await AddItemToInvoice(item);
}
```

#### 3.4 Portion Selection (Multiple portions of same item)
```csharp
// For products with PortionTypes (e.g., "Half", "Whole", "1/4", "1/2", "3/4")
async Task ShowPortionSelection(ItemViewModel item, ProductDto product)
{
    // Display portion types
    foreach (var portionType in product.PortionTypes)
    {
        // User can select portions
        var portion = new ItemPortionViewModel
        {
            PortionTypeId = portionType.Id,
            PortionTypeName = portionType.Name,
            PortionPrice = portionType.Price,
            Quantity = 1
        };
        
        // Each portion can have its own toppings
        await ShowToppingSelection(product, item, portion);
        
        item.ItemPortions.Add(portion);
    }
}
```

### Step 4: Add Item to Invoice
```csharp
async Task AddItemToInvoice(ItemViewModel item)
{
    // Calculate item totals
    item.ItemLinePrice = (item.ItemBasePrice * item.ItemQty) + item.ToppingsTotalPrice;
    item.TotalTax = (item.IsTaxed && !item.IsTaxFreeItem) 
        ? (item.ItemLinePrice / 100) * item.TaxRate 
        : 0;
    item.ItemGrandTotal = item.ItemLinePrice + item.TotalTax - item.GrandTotalDiscount;
    
    // Add to invoice
    CurrentInvoice.InvoiceItems.Add(item);
    
    // Update invoice totals
    UpdateInvoiceTotals();
}
```

### Step 5: Invoice Total Calculations
```csharp
void UpdateInvoiceTotals()
{
    // Count items
    CurrentInvoice.TotalInvoiceItems = CurrentInvoice.InvoiceItems.Count;
    
    // Calculate subtotal (sum of all line prices)
    CurrentInvoice.SubTotal = CurrentInvoice.InvoiceItems.Sum(x => x.ItemLinePrice);
    
    // Calculate discounts
    CurrentInvoice.TotalItemDiscount = CurrentInvoice.InvoiceItems.Sum(x => x.TotalItemDiscount);
    CurrentInvoice.TotalInvoiceDiscount = CurrentInvoice.InvoiceItems.Sum(x => x.TotalInvoiceDiscount);
    CurrentInvoice.GrandTotalDiscount = CurrentInvoice.TotalItemDiscount + CurrentInvoice.TotalInvoiceDiscount;
    
    // Calculate tax
    CurrentInvoice.TotalTax = CurrentInvoice.InvoiceItems.Sum(x => x.TotalTax);
    
    // Calculate grand total
    CurrentInvoice.GrandTotal = CurrentInvoice.SubTotal + CurrentInvoice.TotalTax - CurrentInvoice.GrandTotalDiscount;
    
    // Calculate amount due (after payments)
    CurrentInvoice.TotalDue = CurrentInvoice.GrandTotal - CurrentInvoice.InvoiceTenders.Sum(x => x.TenderAmount);
}
```

### Step 6: Discount Application

#### Item-Level Discount
```csharp
async Task ApplyItemDiscount(ItemViewModel item, DiscountDto discount)
{
    if (discount.IsForItem)
    {
        if (discount.DiscountType == DiscountType.Percentage)
        {
            item.ItemDiscountPercentage = discount.DiscountValue;
            item.TotalItemDiscount = (item.ItemBasePrice * item.ItemQty / 100) * discount.DiscountValue;
        }
        else // FixedAmount
        {
            item.TotalItemDiscount = discount.DiscountValue;
        }
        
        item.UpdateProperties();
        UpdateInvoiceTotals();
    }
}
```

#### Invoice-Level Discount
```csharp
async Task ApplyInvoiceDiscount(DiscountDto discount)
{
    if (discount.IsForInvoice)
    {
        if (discount.DiscountType == DiscountType.Percentage)
        {
            // Apply percentage to all items
            foreach (var item in CurrentInvoice.InvoiceItems)
            {
                item.InvoiceDiscountPercentage = discount.DiscountValue;
                item.TotalInvoiceDiscount = ((item.ItemBasePrice * item.ItemQty) - item.TotalItemDiscount) 
                    / 100 * discount.DiscountValue;
            }
        }
        else // FixedAmount
        {
            // Distribute fixed discount across items proportionally
            var totalBeforeDiscount = CurrentInvoice.SubTotal - CurrentInvoice.TotalItemDiscount;
            foreach (var item in CurrentInvoice.InvoiceItems)
            {
                var itemProportion = item.ItemLinePrice / totalBeforeDiscount;
                item.TotalInvoiceDiscount = discount.DiscountValue * itemProportion;
            }
        }
        
        UpdateInvoiceTotals();
    }
}
```

### Step 7: Hold Invoice (Save for Later)
```csharp
async Task HoldInvoice()
{
    // Serialize entire invoice with all items, modifiers, portions
    var invoiceDto = Mapper.Map<InvoiceForUIDto>(CurrentInvoice);
    var jsonString = JsonConvert.SerializeObject(invoiceDto);
    
    // Create hold invoice record
    var holdInvoice = new Invoice
    {
        Id = Guid.NewGuid().ToString(),
        InvoiceNumber = await GetNextInvoiceNumber(),
        Status = InvoiceStatus.Hold,
        IsHold = true,
        HoldDate = DateTime.Now,
        HoldReason = "Customer request",
        EmployeeId = CurrentUser.Id,
        EmployeeName = $"{CurrentUser.FirstName} {CurrentUser.LastName}",
        InvoiceAsJsonString = jsonString,
        SubTotal = CurrentInvoice.SubTotal,
        GrandTotal = CurrentInvoice.GrandTotal,
        TotalTax = CurrentInvoice.TotalTax,
        TotalInvoiceItems = CurrentInvoice.TotalInvoiceItems
    };
    
    // Save to database
    await OrderEntryService.SaveHoldInvoiceAsync(invoiceDto);
    
    // Clear current invoice
    CreateNewInvoice();
}
```

### Step 8: Retrieve Hold Invoice
```csharp
async Task LoadHoldInvoice(string invoiceId)
{
    // Get hold invoice from database
    var holdInvoice = await OrderEntryService.GetHoldInvoiceAsync(invoiceId);
    
    // Deserialize JSON string
    var invoiceDto = JsonConvert.DeserializeObject<InvoiceForUIDto>(holdInvoice.InvoiceAsJsonString);
    
    // Map to InvoiceViewModel
    CurrentInvoice = Mapper.Map<InvoiceViewModel>(invoiceDto);
    
    // Restore all relationships (items, modifiers, portions)
    foreach (var item in CurrentInvoice.InvoiceItems)
    {
        // Restore modifiers
        // Restore portions
        // Recalculate totals
        item.UpdateProperties();
    }
    
    UpdateInvoiceTotals();
}
```

### Step 9: Payment Processing
```csharp
async Task AddPayment(PaymentMethodDto paymentMethod, decimal amount)
{
    var tender = new InvoiceTenderDto
    {
        Id = Guid.NewGuid().ToString(),
        InvoiceId = CurrentInvoice.Id,
        PaymentMethodId = paymentMethod.Id,
        PaymentMethodName = paymentMethod.Name,
        TenderAmount = amount,
        TransactionId = await ProcessPaymentTransaction(paymentMethod, amount)
    };
    
    CurrentInvoice.InvoiceTenders.Add(tender);
    UpdateInvoiceTotals();
    
    // Check if fully paid
    if (CurrentInvoice.TotalDue <= 0)
    {
        await CompleteInvoice();
    }
}
```

### Step 10: Complete Invoice (Finalize Order)
```csharp
async Task CompleteInvoice()
{
    // Map ViewModel to DTO
    var invoiceDto = Mapper.Map<InvoiceForUIDto>(CurrentInvoice);
    
    // Set completion details
    invoiceDto.Status = InvoiceStatus.Complete;
    invoiceDto.IsHold = false;
    invoiceDto.CompletedDate = DateTime.Now;
    invoiceDto.EmployeeId = CurrentUser.Id;
    invoiceDto.EmployeeName = $"{CurrentUser.FirstName} {CurrentUser.LastName}";
    
    // Save to database (creates Invoice, InvoiceItems, InvoiceItemModifiers, InvoiceItemPortions, InvoiceTenders)
    var result = await OrderEntryService.CompleteInvoiceAsync(invoiceDto);
    
    if (result.Success)
    {
        // Print receipt
        await PrintReceipt(invoiceDto);
        
        // Clear current invoice
        CreateNewInvoice();
        
        // Show success message
        await ShowSuccessMessage($"Order #{invoiceDto.InvoiceNumber} completed!");
    }
    else
    {
        await ShowErrorMessage(result.ErrorMessage);
    }
}
```

---

## 3. View Models Architecture

### MenuServiceViewModel
**Location**: `OrderEntry/ViewModels/MenuServiceVMpartialClasses/MenuServiceViewModel.cs`

**Purpose**: Main orchestrator for Order Entry system

**Key Properties:**
- `ObservableCollection<MenuDto> Menus` - All available menus
- `ObservableCollection<MenuCategoryDto> MenuCategories` - Categories in selected menu
- `ObservableCollection<ProductDto> Products` - Products in selected category
- `ObservableCollection<ToppingCategoryDto> ToppingCategories` - Topping categories for selected product
- `InvoiceViewModel CurrentInvoice` - Active order/cart
- `ItemViewModel CurrentItem` - Item being edited
- `ProductDto SelectedProduct` - Currently selected product

**Key Methods:**
- `LoadAllDataAsync()` - Load menus, categories, products
- `ProductSelected(ProductDto)` - Handle product click
- `ShowSizeSelection()` - Display size options
- `ShowToppingSelection()` - Display modifier options
- `AddItemToInvoice()` - Add configured item to cart
- `ApplyDiscount()` - Apply discount to item or invoice
- `HoldInvoice()` - Save current order for later
- `CompleteInvoice()` - Finalize and save order

### InvoiceViewModel
**Location**: `OrderEntry/ViewModels/InvoiceViewModel.cs`

**Purpose**: Represents the order/cart

**Key Properties:**
```csharp
public string? Id { get; set; }
public ObservableCollection<ItemViewModel> InvoiceItems { get; set; }
public int TotalInvoiceItems { get; set; }
public decimal SubTotal { get; set; }
public decimal TotalTax { get; set; }
public decimal TotalItemDiscount { get; set; }
public decimal TotalInvoiceDiscount { get; set; }
public decimal GrandTotalDiscount { get; set; }
public decimal GrandTotal { get; set; }
public decimal TotalDue { get; set; }
public bool IsHold { get; set; }
public bool IsTaxExempted { get; set; }
public bool IsMakeToGo { get; set; }
public CustomerDto? SelectedCustomer { get; set; }
public List<InvoiceTenderDto> InvoiceTenders { get; set; }
```

**Key Methods:**
```csharp
public void UpdateTotals()  // Recalculate all invoice totals
```

### ItemViewModel
**Location**: `OrderEntry/ViewModels/ItemViewModel.cs`

**Purpose**: Represents a single line item in the order

**Key Properties:**
```csharp
public string ProductGuid { get; set; }
public string PrdName { get; set; }
public string ProductSize { get; set; }
public int ItemQty { get; set; }
public decimal ItemBasePrice { get; set; }
public decimal SizePrice { get; set; }
public decimal SellablePrice { get; set; }
public decimal ToppingsTotalPrice { get; set; }
public bool IsTaxed { get; set; }
public decimal TaxRate { get; set; }
public decimal ItemDiscountPercentage { get; set; }
public decimal InvoiceDiscountPercentage { get; set; }
public bool AllowedSpecialRequest { get; set; }
public ObservableCollection<ItemPortionViewModel> ItemPortions { get; set; }
public ObservableCollection<ToppingDto> SelectedProductToppings { get; set; }
```

**Calculated Properties:**
```csharp
public string Description => ProductSize + " " + PrdName + (ItemDiscountPercentage > 0 ? $" ({ItemDiscountPercentage}%)" : "");
public decimal TotalItemDiscount => ((ItemBasePrice * ItemQty) / 100) * ItemDiscountPercentage;
public decimal TotalInvoiceDiscount => (((ItemBasePrice * ItemQty) - TotalItemDiscount) / 100) * InvoiceDiscountPercentage;
public decimal GrandTotalDiscount => TotalInvoiceDiscount + TotalItemDiscount;
public decimal TotalTax => (IsTaxed && !IsTaxFreeItem) ? (((ItemBasePrice * ItemQty) + ToppingsTotalPrice - GrandTotalDiscount) / 100) * TaxRate : 0;
public decimal ItemLinePrice => ((ItemBasePrice * ItemQty) + ToppingsTotalPrice - GrandTotalDiscount);
public decimal ItemGrandTotal => ItemLinePrice + TotalTax;
```

**Key Methods:**
```csharp
public void AddProduct(Product)  // Set product details
public void AddSize(ProductSize)  // Set size and price
public void UpdateToppingsPrice(decimal)  // Add topping price to total
public void UpdateProperties()  // Trigger property change notifications
```

### ItemPortionViewModel
**Location**: `OrderEntry/ViewModels/ItemPortionViewModel.cs`

**Purpose**: Represents a portion of an item (e.g., "Half Pepperoni, Half Cheese")

**Key Properties:**
```csharp
public string PortionTypeId { get; set; }
public string PortionTypeName { get; set; }
public decimal PortionPrice { get; set; }
public int Quantity { get; set; }
public bool IsSelected { get; set; }
public ObservableCollection<ToppingDto> Modifiers { get; set; }
```

---

## 4. Service Layer

### IOrderEntryService
**Location**: `OrderEntry/Contracts/IOrderEntryService.cs`

```csharp
public interface IOrderEntryService
{
    // Retrieve invoices
    Task<IEnumerable<InvoiceDto>> GetInvoicesAsync(bool sql = false);
    Task<IEnumerable<InvoiceDto>> GetHoldInvoicesAsync();
    
    // Save operations
    Task<ServiceResult> SaveHoldInvoiceAsync(InvoiceForUIDto invoice);
    Task<ServiceResult> CompleteInvoiceAsync(InvoiceForUIDto invoice);
}
```

### OrderEntryService Implementation
**Location**: `OrderEntry/Services/OrderEntryService.cs`

**SaveHoldInvoiceAsync**: Serializes invoice to JSON and saves as hold
**CompleteInvoiceAsync**: Creates all related records (Invoice, InvoiceItems, Modifiers, Portions, Tenders)

---

## 5. Data Flow Summary

### Adding a Product to Cart Flow
```
1. User clicks Product
2. Check if product has sizes
   ├─ Yes: Show size selection
   │   └─ User selects size
   │       └─ Set ItemBasePrice = size.Price
   └─ No: Use product.BasePrice
3. Check if product has topping categories
   ├─ Yes: Show topping selection
   │   └─ For each topping category:
   │       ├─ Display toppings
   │       ├─ User selects toppings
   │       ├─ Create InvoiceItemModifier for each
   │       └─ Add topping.Price to ToppingsTotalPrice
   └─ No: Skip topping selection
4. Check if product has portion types
   ├─ Yes: Show portion selection
   │   └─ Create ItemPortionViewModel for each
   │       └─ Each portion can have own toppings
   └─ No: Skip portion selection
5. Calculate ItemViewModel totals:
   - ItemLinePrice = (ItemBasePrice * ItemQty) + ToppingsTotalPrice
   - TotalTax = (ItemLinePrice - Discounts) * TaxRate
   - ItemGrandTotal = ItemLinePrice + TotalTax - Discounts
6. Add ItemViewModel to InvoiceViewModel.InvoiceItems
7. Call InvoiceViewModel.UpdateTotals()
8. Update UI (cart refreshes)
```

### Completing an Invoice Flow
```
1. User clicks "Complete" or "Pay"
2. Check if payments cover total
   ├─ No: Show payment screen
   │   └─ User adds payment tenders
   │       └─ Repeat until TotalDue <= 0
   └─ Yes: Continue
3. Map InvoiceViewModel to InvoiceForUIDto
4. Call OrderEntryService.CompleteInvoiceAsync()
   └─ Service maps DTO to entities:
       ├─ Create Invoice record
       ├─ Create InvoiceItem records
       ├─ Create InvoiceItemModifier records
       ├─ Create InvoiceItemPortion records
       └─ Create InvoiceTender records
5. SaveChanges to database
6. Print receipt
7. Clear InvoiceViewModel
8. Show success message
```

---

## 6. Pricing Calculation Details

### Item-Level Pricing
```
Base Price = Product.BasePrice OR Size.Price
Modifier Total = Sum(Topping.Price * Quantity)
Portion Total = Sum(PortionType.Price * Quantity)

Item Subtotal = (BasePrice * Quantity) + Modifier Total

Item Discount = Item Subtotal * (ItemDiscountPercentage / 100)
Invoice Discount = (Item Subtotal - Item Discount) * (InvoiceDiscountPercentage / 100)
Total Discount = Item Discount + Invoice Discount

Taxable Amount = Item Subtotal - Total Discount
Tax = Taxable Amount * (TaxRate / 100)  [if IsTaxed == true]

Item Grand Total = Item Subtotal + Tax - Total Discount
```

### Invoice-Level Pricing
```
SubTotal = Sum(All Items' Item Subtotal)
Total Item Discount = Sum(All Items' Item Discount)
Total Invoice Discount = Sum(All Items' Invoice Discount)
Grand Total Discount = Total Item Discount + Total Invoice Discount
Total Tax = Sum(All Items' Tax)

Grand Total = SubTotal + Total Tax - Grand Total Discount

Amount Paid = Sum(All Tenders' Amount)
Total Due = Grand Total - Amount Paid
```

---

## 7. Key Features

### Manager Authorization
Some actions require manager approval (PIN entry):
- Applying discounts above threshold
- Voiding items
- Modifying completed invoices
- Viewing sensitive information

### Tax Exemption
- Invoice-level tax exemption (IsTaxExempted = true)
- Item-level tax-free items (IsTaxFreeItem = true)

### Special Instructions
- Products can allow special instructions (AllowedSpecialRequest)
- Free-text notes attached to items

### Service Methods
- Dine In, Take Out, Delivery, etc.
- Affects tax calculations and UI flow

### Quick Actions
- Predefined action buttons for common operations
- Configurable per business needs

---

# 8. UI LAYOUT AND USER INTERACTION FLOW

## 8.1 Main Layout Structure

The Order Entry screen uses a **TWO-COLUMN LAYOUT** with RTL (Right-to-Left) support:

```
┌─────────────────────────────────────────────────────┐
│  [LEFT COLUMN]          │      [RIGHT COLUMN]       │
│  - Invoice/Cart View    │  - Product Selection      │
│  - Payment View         │  - Modifier View          │
│                         │  - Discount View          │
│                         │  - Cart View              │
└─────────────────────────────────────────────────────┘
```

### Column Definitions (from `OrderEntryView.xaml`):
- **Desktop**: Left column = 330px, Right column = 2* (flexible)
- **Tablet**: Left column = 520px, Right column = 2.4* (flexible)
- **RTL Mode**: Columns swap positions when `IsRTL=true`

## 8.2 LEFT COLUMN - Invoice/Cart Management

### A. Invoice Menu (InvoiceMenu.xaml)

**Layout Components**:
```
┌──────────────────────────────────┐
│ [Back] Customer Name [TabName][≡]│  ← Header (40px height)
├──────────────────────────────────┤
│ [Dine In/TakeOut] [Open/Park]    │  ← Dining Options
├──────────────────────────────────┤
│ ┌──────────────────────────────┐ │
│ │  1. Burger.............$12.99│ │  ← Invoice Items List
│ │     + Cheese                 │ │    (Shows selected products)
│ │     + Bacon                  │ │
│ │     - No Pickles             │ │
│ │  2. Fries................$3.99│ │
│ │     L (Large)                │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ SubTotal:           $16.98       │  ← Totals Section
│ Tax:                 $1.36       │
│ Grand Total:        $18.34       │
└──────────────────────────────────┘
```

**Key Elements**:
- **Back Button**: Navigate back to menu (disabled when cart is empty)
- **Customer Name**: Shows selected customer (default: "Walk-In")
- **Tab Name Button**: Assign name to order
- **Dine In/TakeOut Buttons**: Toggle dining option
- **Open/Park Buttons**: Save order for later or keep open
- **Invoice Items ListView**: Scrollable list showing all items with modifiers
- **Totals Panel**: Bottom section with SubTotal, Tax, Discounts, Grand Total

### B. Payment Menu (PaymentMenu.xaml)

Appears when user clicks "Pay" - shows tender types and payment processing.

## 8.3 RIGHT COLUMN - Product Selection & Modifiers

The right column switches between **4 different views** based on user action:

### View 1: Product Selection View (Default)

```
┌───────────────────────────────────────────────────────┐
│ [Search] [Open Items]        [All Checks] [Switch]    │  ← Header Bar
├───────────────────────────────────────────────────────┤
│ ┌─────────┐  ┌─────────────────────────────────────┐ │
│ │ BURGER  │  │  ┌────────┐ ┌────────┐ ┌────────┐  │ │
│ │ PIZZA   │◄─┼─►│Cheese  │ │Pepperoni│ │Supreme │  │ │
│ │ DRINKS  │  │  │Burger  │ │Pizza    │ │Pizza   │  │ │
│ │ SIDES   │  │  │$12.99  │ │$14.99   │ │$16.99  │  │ │
│ │ DESSERT │  │  └────────┘ └────────┘ └────────┘  │ │
│ └─────────┘  │  ┌────────┐ ┌────────┐ ┌────────┐  │ │
│              │  │Veggie  │ │Meat    │ │Hawaiian│  │ │
│ Categories   │  │Burger  │ │Lovers  │ │Pizza   │  │ │
│ (Vertical    │  │$10.99  │ │$15.99  │ │$13.99  │  │ │
│  FlexLayout) │  └────────┘ └────────┘ └────────┘  │ │
│              └─────────────────────────────────────┘ │
│                Product Grid (FlexLayout Wrap)        │
├───────────────────────────────────────────────────────┤
│ [Done] [Paid] [Void] [Discount] [Receipt] [More...]  │  ← Footer Actions
└───────────────────────────────────────────────────────┘
```

**Components**:
- **CategoriesView**: Left sidebar with colored category buttons (200px wide tiles)
- **ProductsView**: Main area showing product grid with images, names, prices
- **FooterView**: Action buttons at bottom (dynamically enabled/disabled)

### View 2: Modifier View (When product selected)

```
┌───────────────────────────────────────────────────────┐
│ [−] [2] [+] [SpecialRequest] [Repeat] [Delete] [✕] [✓]│  ← Item Controls
├───────────────────────────────────────────────────────┤
│ Product: Cheeseburger                    $12.99       │
├───────────────────────────────────────────────────────┤
│ ┌─── Size Selection ──────────────────────────────┐  │
│ │ ○ Small (+$0.00)  ● Medium (+$0.00)  ○ Large   │  │
│ │                                      (+$2.00)   │  │
│ └─────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────┤
│ ┌─── Toppings (Required: 1-3) ────────────────────┐  │
│ │ ☑ Lettuce       ☑ Tomato        ☑ Pickles      │  │
│ │ ☑ Onions        ☐ Jalapeños     ☐ Bacon (+$1)  │  │
│ └─────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────┤
│ ┌─── Extras (Optional) ───────────────────────────┐  │
│ │ ☐ Extra Cheese (+$1.50)                         │  │
│ │ ☐ Avocado (+$2.00)                              │  │
│ └─────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────┤
│ ┌─── Portion Selection ───────────────────────────┐  │
│ │ ○ Regular  ○ Light  ○ Extra                    │  │
│ └─────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────┤
│                          Item Total: $15.49           │
└───────────────────────────────────────────────────────┘
```

**Components**:
- **Top Control Bar**: Quantity buttons, special request, repeat, delete, cancel, done
- **Product Header**: Shows selected product and base price
- **Size Selection** (PortionsView.xaml): Radio buttons for size options
- **Topping Categories** (ToppingCategoriesView.xaml): Organized by category
- **Toppings** (ToppingsView.xaml): Checkboxes with prices
- **Portion Selection**: Regular/Light/Extra options
- **Running Total**: Updates live as modifiers are selected

### View 3: Cart View (When "Cart" clicked)

Shows full invoice items in expanded view on the right column (mirrors left column invoice menu).

### View 4: Discount View (When "Discount" clicked)

Shows discount options - percentage or fixed amount discounts.

## 8.4 User Interaction Flow

### A. Starting a New Order

```
1. User sees Product Selection View by default
2. Left column shows empty invoice with "Walk-In" customer
3. Categories are loaded on the left sidebar
4. Products for first/default category are displayed
```

### B. Adding Product to Order

```
User Flow:
1. Click category (e.g., "BURGER")
   → Products in that category load in grid
   → Selected category gets highlighted background
   
2. Click product (e.g., "Cheeseburger $12.99")
   → View switches to Modifier View
   → Product loaded into CurrentReceiptItem
   → Size options appear (if applicable)
   → Topping categories load
   
3. Select size (e.g., "Large")
   → Price updates: $12.99 → $14.99
   → Portions load for that size
   
4. Select toppings
   → Checkboxes toggle on/off
   → Mandatory categories show warning if not satisfied
   → Running total updates: $14.99 → $16.49 (with extra cheese)
   
5. Click [✓] Done button
   → Item added to Invoice
   → Item appears in left column cart
   → View returns to Product Selection
   → Totals update in left column
```

### C. Modifying Existing Item

```
User Flow:
1. Click item in left column invoice list
   → View switches to Modifier View
   → All current selections pre-populated
   
2. Make changes (add/remove toppings, change size, etc.)
   → Running total updates live
   
3. Click [✓] Done
   → Item updated in invoice
   → View returns to Product Selection
```

### D. Managing Quantity

```
In Modifier View:
- Click [−] button: Decrease quantity (minimum 1)
- Click [+] button: Increase quantity
- Quantity shown in center box: [2]
- Price multiplied by quantity automatically
```

### E. Completing Order

```
User Flow:
1. Click "Done" action button in footer
   → Validation checks (minimum items, required fields)
   → If valid: Order saved to Invoice table with status = Open/Park
   
2. Click "Paid" action button
   → View switches to Payment Menu
   → Tender types displayed (Cash, Credit Card, etc.)
   → User selects tender and enters amount
   → If amount >= Grand Total: Complete transaction
   → Receipt printed
   → View returns to Product Selection with empty cart
```

## 8.5 Visual Feedback & State Management

### A. Button States

**Enabled/Disabled Logic**:
- **Back Button**: Disabled when cart is empty (`Items.Count = 0`)
- **Dine In/TakeOut**: Disabled when items selected (`CanChangeDiningOption`)
- **Action Buttons**: Individually enabled based on invoice state
  - "Void": Only enabled with items
  - "Discount": Only enabled with items
  - "Paid": Only enabled when invoice has items
  - "Done": Always enabled (creates saved invoice)

### B. Color Coding

**Categories** (from MenuCategory entity):
- Each category has `BackColor` and `ForeColor` properties
- Selected category gets different background highlight
- Uses `MenuCategorySelectionMatchConverter` to compare current vs selected

**Products** (from Product entity):
- Each product can have custom colors
- Uses `ProductSelectionMatchConverter` for selection state

### C. Loading States

- **ActivityIndicator**: Shows in center when `IsLoading = true`
- Appears during: DB queries, invoice calculations, payment processing

## 8.6 Responsive Design

### Desktop Mode
- 2-column layout always visible
- Categories sidebar fixed width (200px)
- Product grid responsive with wrapping

### Tablet Mode
- Wider columns (520px left)
- Larger touch targets (60px buttons)
- Larger fonts (14-16pt)

### RTL Support
- Entire layout mirrors when `IsRTL = true`
- Text alignment switches
- Navigation flow reverses

## 8.7 Component Hierarchy (XAML Structure)

```
OrderEntryView.xaml (Main Container)
├── CustomBorder (Background wrapper)
│   └── Grid (2 columns)
│       ├── [Column 0/1] Left/Right based on RTL
│       │   ├── InvoiceMenu (Visible when ViewsVisible = InvoiceMenu)
│       │   └── PaymentMenu (Visible when ViewsVisible = PaymentMenu)
│       │
│       └── [Column 1/0] Right/Left based on RTL
│           ├── ProductViewGrid
│           │   ├── CategoriesView (Left sidebar)
│           │   ├── ProductsView (Main grid)
│           │   └── FooterView (Action buttons)
│           │
│           ├── CartViewGrid (Visible when ViewsVisible = Cart)
│           │   └── CartView
│           │
│           ├── ModifierView (Visible when ViewsVisible = AddProduct)
│           │   ├── Control Bar (quantity, special request, etc.)
│           │   ├── PortionsView (size selection)
│           │   ├── ToppingCategoriesView
│           │   └── ToppingsView
│           │
│           └── DiscountView (Visible when ViewsVisible = Discount)
│
└── SwipeCardOverlay (Modal overlay for payment processing)
```

## 8.8 Navigation Between Views

**View State Management** (from MenuServiceViewModel.cs):
```csharp
public enum Views
{
    Product,      // Default - category + product selection
    AddProduct,   // Modifier screen
    InvoiceMenu,  // Invoice list on left
    Cart,         // Full cart view on right
    Discount,     // Discount entry screen
    PaymentMenu   // Payment/tender selection
}

public Views ViewsVisible { get; set; } = Views.Product;
```

**View Switching Logic**:
- Product clicked → `ViewsVisible = Views.AddProduct`
- Done clicked → `ViewsVisible = Views.Product`
- Discount clicked → `ViewsVisible = Views.Discount`
- Paid clicked → `ViewsVisible = Views.PaymentMenu`

Uses `ViewToVisibiltyConverter` to show/hide grids based on `ViewsVisible` enum value.

## 8.9 Key XAML Files Reference

| File | Purpose |
|------|---------|
| `OrderEntryView.xaml` | Main container with 2-column layout |
| `InvoiceMenu.xaml` | Left column - cart/invoice display |
| `PaymentMenu.xaml` | Left column - payment processing |
| `CategoriesView.xaml` | Right column sidebar - category buttons |
| `ProductsView.xaml` | Right column - product grid |
| `ModifiresView.xaml` | Right column - modifier selection screen |
| `PortionsView.xaml` | Size selection component |
| `ToppingCategoriesView.xaml` | Topping category tabs |
| `ToppingsView.xaml` | Individual topping checkboxes |
| `FooterView.xaml` | Action buttons (Done, Paid, Void, etc.) |
| `CartView.xaml` | Expanded cart view |
| `DiscountView.xaml` | Discount entry screen |

---

This documentation provides a complete technical overview of the Order Entry system, including all database tables, business logic, calculation formulas, data flow patterns, and UI/UX implementation used in the PennPOS MAUI application.

