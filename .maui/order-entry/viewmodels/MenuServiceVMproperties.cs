using CommunityToolkit.Mvvm.ComponentModel;
using PennPOS.Maui.Shared.Dtos.OrderEntryDtos;
using PennPOS.Data.EfCore.Entities.MenuSetupEntities;
using PennPOS.Maui.Shared.Common;
using PennPOS.Maui.Shared.Dtos;
using PennPOS.Maui.Shared.Dtos.MenuDtos;
using Syncfusion.Maui.Data;
using System.Collections.ObjectModel;
using OrderEntryActionDto = OrderEntry.Dtos.OrderEntryActionDto;
namespace OrderEntry.ViewModels.MenuServiceVMpartialClasses
{
    public partial  class MenuServiceViewModel: BaseViewModel
    {
        #region Properties

        [ObservableProperty]
        public partial Views ViewsVisible { get; set; } = Views.Product | Views.InvoiceMenu;
        public bool IsSizeSelected => Controller.CurrentReceiptItem?.Size != null || SelectedProduct?.AssignedSizes?.Where(x=>x.IsAssigned).Count()==0;
        public bool IsTypeSelected => Controller.CurrentReceiptItem?.ReceiptItemType?.ProductType != null || SelectedProduct?.ProductTypes?.Count==0;

        // Flexible tab enablement properties
        public bool HasNoSizes => SelectedProduct?.AssignedSizes?.Count == 0;
        public bool HasNoTypes => SelectedProduct?.ProductTypes?.Count == 0;
        public bool HasValidSizeSelection => IsSizeSelected || HasNoSizes;
        public bool HasValidTypeSelection => IsTypeSelected || HasNoTypes;
        
        public bool IsTypesTabEnabled => IsSizeSelected || HasNoSizes;
        public bool IsPortionsTabEnabled => HasValidSizeSelection && HasValidTypeSelection;
        public bool IsModifierGroupsTabEnabled => HasValidSizeSelection && HasValidTypeSelection && HasAnyModifierCategories;
        public bool IsModifiersTabEnabled => HasValidSizeSelection && HasValidTypeSelection && HasAnyVisibleModifierCategories;

        public bool IsAffixesVisible => 
            SelectedTabIndex == 4 && // Show only on Modifiers tab
            Affixes.Count > 0 && 
            SelectedToppingCategories?.Count > 0;
        
        // Tab management properties
        [ObservableProperty]
        public partial int SelectedTabIndex { get; set; } = 0; // 0=Sizes, 1=Types, 2=Portions, 3=ModifierGroups, 4=Modifiers
        
        partial void OnSelectedTabIndexChanged(int value)
        {
            OnPropertyChanged(nameof(IsAffixesVisible));
        }
        
        // Helper properties for auto-navigation
        public bool HasProductTypes => SelectedProduct?.ProductTypes?.Count > 0;
        public bool HasPortions => SelectedProduct?.PortionTypes?.Count > 0;
        public bool HasToppingCategories => SelectedProduct?.ToppingCategories?.Count > 0;
        public bool HasToppings => SelectedToppingCategory?.Toppings?.Count > 0;
        
        // Property to determine if Modifier Groups tab should be visible
        public bool ShouldShowModifierGroupsTab => SelectedToppingCategories?.Count > 1;
        
        // Enhanced modifier availability checks (handles filtering scenarios)
        public bool HasAnyVisibleModifierCategories => SelectedToppingCategories?.Any(c => c.Toppings?.Any() == true) == true;
        public bool HasAnyModifierCategories => SelectedToppingCategories?.Count > 0;
        public bool ShouldShowModifiersTab => HasAnyVisibleModifierCategories;
        
        // Check if product ONLY has modifiers (no size/type/portions)
        public bool IsModifierOnlyProduct => 
            !HasProductTypes && 
            !HasPortions && 
            (SelectedProduct?.AssignedSizes?.Count == 0 || !SelectedProduct.AssignedSizes.Any(s => s.IsAssigned)) &&
            HasToppingCategories;
        
        // Track size changes to handle re-filtering
        private string _lastSelectedSizeId = string.Empty;
        public bool HasSizeChanged(string newSizeId) 
        {
            bool changed = _lastSelectedSizeId != newSizeId;
            _lastSelectedSizeId = newSizeId ?? string.Empty;
            return changed;
        }
        
        [ObservableProperty]
        public partial bool IsRTL { get; set; }

        [ObservableProperty]
        public partial string TotalPaid { get; set; } ="";

        [ObservableProperty]
        public partial string CouponCode { get; set; } = "";

        [ObservableProperty]
        public partial SharedDtos.SmartCouponDto.SmartCouponDto  AppliedCoupon { get; set; } = new();

        [ObservableProperty]
        public partial bool IsTestMode { get; set; } = false;

        [ObservableProperty]
        public partial bool CanChangeDiningOption { get; set; } = false;

        [ObservableProperty]
        public partial List<MenuDto> Menus { get; set; } = [];

        [ObservableProperty]
        public partial ObservableCollection<ProductDto> MenuProducts { get; set; } = [];

        [ObservableProperty]
        public partial ObservableCollection<MenuCategoryDto> MenuCategories { get; set; } = [];


        [ObservableProperty]
        public partial List<SharedDtos.InvoiceDiscountDto> Discounts { get; set; } = [];

        [ObservableProperty]
        public partial List<SharedDtos.PaymentMethodDto> PaymentMethods { get; set; } = [];

        [ObservableProperty]
        public partial List<AffixDto> Affixes { get; set; } = new();

        [ObservableProperty]
        public partial List<SharedDtos.SmartCouponDto.SmartCouponDto> SmartCoupons { get; set; } = new();

        [ObservableProperty]
        public partial List<OrderEntryActionDto> OrderEntryActions { get; set; } = [];

        [ObservableProperty]
        public partial bool IsLoading { get; set; } = false;

        [ObservableProperty]
        public partial bool ShowCardSwipeOverlay { get; set; } = false;

        [ObservableProperty]
        public partial bool IsMenuChanging { get; set; } = false;

        /// <summary>
        /// Tracks the ID of the last successfully selected menu to prevent unnecessary re-selections
        /// </summary>
        public string LastSelectedMenuId { get; set; } = string.Empty;

        [ObservableProperty]
        public partial MenuDto? SelectedMenu { get; set; }

        partial void OnSelectedMenuChanged(MenuDto? value)
        {
            if (value != null)
            {
                SelectedMenu = value;
                _ = LoadMenuProductsAsync(SelectedMenu);
                if (SelectedMenu.MenuCategories.Count > 0)
                    MenuCategories = SelectedMenu.MenuCategories;
                else
                    MenuCategories.Clear();
            }
        }

        [ObservableProperty]
        public partial MenuDto? SelectedNoMenu { get; set; }
        [ObservableProperty]
        public partial MenuCategoryDto? SelectedMenuCategory { get; set; }
        [ObservableProperty]
        public partial MenuCategoryDto? SelectedNoMenuCategory { get; set; }
        [ObservableProperty]
        public partial List<ProductDto> DirectProducts { get; set; } = new();
    

        [ObservableProperty]
        public partial ProductDto? SelectedMenuProduct { get; set; }
        [ObservableProperty]
        public partial InvoiceDiscount? SelectedDiscount { get; set; }

        [ObservableProperty]
        public partial InvoiceDto SelectedHoldInvoice { get; set; } = new();

        [ObservableProperty]
        public partial List<SharedDtos.ServiceMethodDto> ServiceMethods { get; set; } = [];

        [ObservableProperty]
        public partial SharedDtos.ServiceMethodDto? SelectedServiceMethod { get; set; } = new();

        partial void OnSelectedServiceMethodChanged(SharedDtos.ServiceMethodDto? value)
        {
            if (value != null)
            {
                SelectedServiceMethod = value;
                _ = SetTaxRateAsync();
            }
        }

        private async Task SetTaxRateAsync()
        {
            foreach (var item in Controller.Items)
            {
                item.TaxRate = (float)await GetTaxRate(item.Product);
            }
        }
        public Task<decimal> GetTaxRate(ProductDto product)
        {
            if (string.IsNullOrEmpty(product.TaxGroupId) || SelectedServiceMethod == null || string.IsNullOrEmpty(SelectedServiceMethod.Id))
                return Task.FromResult(0m);

            TaxRateDto? taxRate = null;

            return Task.FromResult(taxRate?.Rate ?? 0m);
        }

        [ObservableProperty]
        public partial bool IsMenuVisible { get; set; } = false;
        [ObservableProperty]
        [NotifyPropertyChangedFor(
            nameof(SelectedProductTypes),
            nameof(ProductSizes),
            nameof(SelectedToppingCategories),
            nameof(IsSizeSelected),
            nameof(IsTypeSelected),
            nameof(PortionTypes),
            nameof(SelectedTopping),
            nameof(IsAffixesVisible),
            nameof(SelectedToppings),
            nameof(HasNoSizes),
            nameof(HasNoTypes),
            nameof(HasValidSizeSelection),
            nameof(HasValidTypeSelection),
            nameof(IsTypesTabEnabled),
            nameof(IsPortionsTabEnabled),
            nameof(IsModifierGroupsTabEnabled),
            nameof(IsModifiersTabEnabled),
            nameof(HasProductTypes),
            nameof(HasPortions),
            nameof(HasToppingCategories),
            nameof(ShouldShowModifierGroupsTab),
            nameof(HasAnyVisibleModifierCategories),
            nameof(HasAnyModifierCategories),
            nameof(ShouldShowModifiersTab),
            nameof(IsModifierOnlyProduct)
            )]
        public partial ProductDto? SelectedProduct { get; set; }
        
        // Auto-select first valid tab when product changes
        partial void OnSelectedProductChanged(ProductDto? value)
        {
            // Reset size tracking when product changes
            _lastSelectedSizeId = string.Empty;
            
            // Clear stored topping collections when switching products to ensure fresh state
            _originalToppingCollections.Clear();
            
            if (value?.AssignedSizes?.Count > 0)
                SelectedTabIndex = 0; // Sizes
            else if (value?.ProductTypes?.Count > 0)
                SelectedTabIndex = 1; // Types (now works without size requirement)
            else if (value?.PortionTypes?.Count > 0)
                SelectedTabIndex = 2; // Portions (now works with flexible logic)
            else if (value?.ToppingCategories?.Count > 0)
            {
                // EDGE CASE: Modifier-only product
                // Will be adjusted to tab 3 or 4 after ShowCategories() populates SelectedToppingCategories
                // in the AdjustTabSelectionAfterCategoriesLoaded() method
                SelectedTabIndex = 3; // Modifier groups (temporary, will be adjusted)
            }
        }
        
        public List<AssignedSizeDto>? ProductSizes => (SelectedProduct == null)?[]:SelectedProduct.AssignedSizes.ToList();
        public void UpdateToppingCategoryState()
        {
            if (SelectedToppingCategories is null)
            {
                return;
            }
         
            if (SelectedToppingCategories.Any(x => x.IsMandatory))
            {
                var modifierGroups = Controller.CurrentReceiptItem!.Portions.SelectMany(x => x.ModifierGroups)
                    .Concat(Controller.CurrentReceiptItem.ModifierGroups)
                    .ToList();
                    
                bool value = true;
                foreach (var toppingCategory in SelectedToppingCategories)
                {
                    // Check if category has any visible toppings after filtering
                    var hasVisibleToppings = toppingCategory.Toppings?.Any() == true;
                    
                    if (!hasVisibleToppings)
                    {
                        // Can't select from empty category - disable it
                        toppingCategory.IsEnabled = false;
                        continue;
                    }
                    
                    if (toppingCategory.IsMandatory && value == true)
                    {
                        if (modifierGroups?.Any(x => x.Category == toppingCategory)==false)
                        {
                            value = false;
                            toppingCategory.IsEnabled = true;
                            continue;
                        }
                    }
                    toppingCategory.IsEnabled = value;
                }
            }
            else
            {
                // For non-mandatory categories, just check if they have visible toppings
                foreach (var toppingCategory in SelectedToppingCategories)
                {
                    var hasVisibleToppings = toppingCategory.Toppings?.Any() == true;
                    toppingCategory.IsEnabled = hasVisibleToppings;
                }
            }
             
        }

        [ObservableProperty]
        [NotifyPropertyChangedFor(
            nameof(HasToppingCategories),
            nameof(ShouldShowModifierGroupsTab),
            nameof(HasAnyVisibleModifierCategories),
            nameof(HasAnyModifierCategories),
            nameof(ShouldShowModifiersTab),
            nameof(IsModifierGroupsTabEnabled),
            nameof(IsModifiersTabEnabled),
            nameof(IsAffixesVisible)
            )]
        public partial List<ToppingCategoryDto>? SelectedToppingCategories { get; set; }
        public List<PortionTypeDto>? PortionTypes => (SelectedProduct == null) ? [] : SelectedProduct.PortionTypes.ToList();

        public List<ProductTypeDto>? SelectedProductTypes
            => (SelectedProduct == null) ? [] : SelectedProduct.ProductTypes.ToList();
        public AssignedSizeDto? SelectedSize
            => Controller.CurrentReceiptItem?.Size;
        public ProductTypeDto? SelectedType
            => Controller.CurrentReceiptItem?.ReceiptItemType?.ProductType;
        [ObservableProperty]
        public partial InfoPopupViewModel InfoPopupVM { get; set; }

        [ObservableProperty]
        public partial SharedDtos.AffixDto? SelectedAffix { get; set; }

        [ObservableProperty]
        public partial string DininButtonText { get; set; } = "Dinning";

        [ObservableProperty]
        public partial bool IsInvoiceItemSelected { get; set; } = false;

        [ObservableProperty]
        public partial OrderEntry.Customers.CustomerDto SelectedCustomer { get; set; }

        [ObservableProperty]
        public partial string  CustomerName { get; set; }

        [ObservableProperty]
        public partial string SpecialRequestDescription { get; set; }

        [ObservableProperty]
        public partial decimal SpecialRequestPrice { get; set; }

        [ObservableProperty]
        public partial ObservableCollection<InvoiceDto> HoldInvoices { get; set; }

        [ObservableProperty]
        public partial bool CanShowHoldInvoices { get; set; } = false;

        [ObservableProperty]
        public partial PortionTypeDto SelectedPortionType { get; set; } = new();

        [ObservableProperty]
        public partial bool IsEnableOrderEntryActions { get; set; } = false;

        [ObservableProperty]
        public partial ObservableCollection<Customers.CustomerDto> Customers { get; set; } = [];
        public ToppingCategoryDto? SelectedToppingCategory
        {
            get => field;
            set
            {
                if (value?.IsEnabled == true || value is null)
                {
                    field = value;
                }
               
                OnPropertyChanged(nameof(SelectedToppingCategory));
                OnPropertyChanged(nameof(SelectedToppings));
            }
        }
        public List<ToppingDto>? SelectedToppings => (SelectedToppingCategory == null) ? [] : SelectedToppingCategory.Toppings.ToList();

        /// <summary>
        /// Gets the modifiers currently applied to the selected receipt item (from the selected portion or item itself)
        /// </summary>
        public List<Components.Reciept.Model.ReceiptItemModifier> AppliedModifiers
        {
            get
            {
                if (Controller.CurrentReceiptItem == null)
                    return new List<Components.Reciept.Model.ReceiptItemModifier>();

                var appliedModifiers = new List<Components.Reciept.Model.ReceiptItemModifier>();

                // Get modifiers from the selected portion (if any)
                if (Controller.SelectedPortion != null)
                {
                    appliedModifiers.AddRange(Controller.SelectedPortion.ModifierGroups.SelectMany(g => g.Toppings));
                }
                else
                {
                    // Get modifiers directly on the item (not portion-specific)
                    appliedModifiers.AddRange(Controller.CurrentReceiptItem.ModifierGroups.SelectMany(g => g.Toppings));
                }

                return appliedModifiers;
            }
        }

        /// <summary>
        /// Gets the modifier groups currently applied to the selected receipt item
        /// </summary>
        public List<Components.Reciept.Model.ReceiptItemModifierGroup> AppliedModifierGroups
        {
            get
            {
                if (Controller.CurrentReceiptItem == null)
                    return new List<Components.Reciept.Model.ReceiptItemModifierGroup>();

                var appliedGroups = new List<Components.Reciept.Model.ReceiptItemModifierGroup>();

                // Get modifier groups from the selected portion (if any)
                if (Controller.SelectedPortion != null)
                {
                    appliedGroups.AddRange(Controller.SelectedPortion.ModifierGroups);
                }
                else
                {
                    // Get modifier groups directly on the item (not portion-specific)
                    appliedGroups.AddRange(Controller.CurrentReceiptItem.ModifierGroups);
                }

                return appliedGroups;
            }
        }

        [ObservableProperty]
        public partial ToppingDto SelectedTopping { get; set; }

        #endregion
    }
}
