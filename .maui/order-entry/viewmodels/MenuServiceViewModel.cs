using AutoMapper;
using CommunityToolkit.Mvvm.Messaging;
using Employee;
using OrderEntry.Contracts;
using OrderEntry.Customers;
using OrderEntry.Event;
using OrderEntry.Messages;
using OrderEntry.Popups;
using PennPOS.Maui.Shared.Common;
using PennPOS.Maui.Shared.Dtos.MenuDtos;
using PennPOS.Maui.Shared.Interfaces;
using PennPOS.Maui.Shared.Messages;
using Payments.Core.Abstractions;
using System.Collections.ObjectModel;

namespace OrderEntry.ViewModels.MenuServiceVMpartialClasses
{
    public partial class MenuServiceViewModel : BaseViewModel
    {
        
        
        private readonly PopupService popupservice;
        private readonly PopupLocator popupLocator;

        private Components.Reciept.Model.ReceiptItem? _previouslyEditingItem;
        private ProductDto? _previouslyEditingProduct;
        
        // Store original topping collections to restore after filtering
        private Dictionary<string, ObservableCollection<ToppingDto>> _originalToppingCollections = new();

        Page? currnetPage=Shell.Current?.CurrentPage;
        public IOrderEntryService OrderEntryService { get; }
        public IInvoiceService InvoiceService { get; }
        public IMapper Mapper { get; }
        public IEmployeeService EmployeeService { get; }
        public ICustomerService CustomerService { get; }

        private readonly IOrderEntryService orderEntryService;
        private readonly IInvoiceService invoiceService;
        private readonly IMapper mapper;
        private readonly IEmployeeService employeeService;
        private readonly ITaxGroupService taxGroupService;
        private readonly IServiceMethodService serviceMethodService;
        private readonly IPaymentMethodService paymentMethodService;
        private readonly ISmartCouponService smartCouponService;
        private readonly IQuickCenterActionService quickCenterActionService;
        private readonly IDiscountService discountService;
        private readonly IAffixService affixService;
        private readonly IPortionTypeService portionTypeService;
        private readonly ISizeService sizeService;
        private readonly ITaxGroupTaxRateService taxGroupTaxRateService;
        private readonly IMenuService menuService;
        private readonly IProductService productService;
        private readonly IPaymentService paymentService;
        private readonly IToppingCategoryAssignedSizeService toppingCategoryAssignedSizeService;

        public MenuServiceViewModel(IOrderEntryService orderEntryService,
            IInvoiceService invoiceService,
            IMapper mapper,
            IEmployeeService employeeService,
            PopupService popupservice,
            PopupLocator popupLocator,
            ITaxGroupService taxGroupService,
            IQuickCenterActionService quickCenterActionService,
            IDiscountService discountService,
            IAffixService affixService,
            IPortionTypeService portionTypeService,
            ISizeService sizeService,
            IServiceMethodService serviceMethodService,
            IPaymentMethodService paymentMethodService,
            ISmartCouponService smartCouponService,
            ITaxGroupTaxRateService taxGroupTaxRateService,
            ICustomerService customerService,
            IProductService productService,
            IMenuService menuService,
            IPaymentService paymentService,
            IToppingCategoryAssignedSizeService toppingCategoryAssignedSizeService
            )
        {
            OrderEntryService = orderEntryService;
            InvoiceService = invoiceService;
            Mapper = mapper;
            EmployeeService = employeeService;
            this.popupservice = popupservice;
            this.popupLocator = popupLocator;
            this.quickCenterActionService = quickCenterActionService;
            this.discountService = discountService;
            this.affixService = affixService;
            this.portionTypeService = portionTypeService;
            this.sizeService = sizeService;
            this.mapper = mapper;
            this.employeeService = employeeService;
            this.taxGroupService = taxGroupService;
            this.serviceMethodService = serviceMethodService;
            this.paymentMethodService = paymentMethodService;
            this.taxGroupTaxRateService = taxGroupTaxRateService;
            this.menuService = menuService;
            this.smartCouponService = smartCouponService;
            this.productService = productService;
            this.paymentService = paymentService;
            this.toppingCategoryAssignedSizeService = toppingCategoryAssignedSizeService;
            CustomerService = customerService;
            this.orderEntryService = orderEntryService;
            this.invoiceService = invoiceService;
            //_ = LoadAllDataAsync();
            IsRTL = Preferences.Default.Get("IsRTL", false);
            WeakReferenceMessenger.Default.Register<ToppingDeletedMessage>(this, OnModifierDeleted);
            WeakReferenceMessenger.Default.Register<PortionDeletedMessage>(this, OnPortionDeleted);
            WeakReferenceMessenger.Default.Register<InvoiceItemDoubleTapMessage>(this, OnInvoiceItemDoubleTap);
            WeakReferenceMessenger.Default.Register<InvoiceItemSelectionChangedMessage>(this, OnInvoiceItemSelectionChanged);
            WeakReferenceMessenger.Default.Register<NewDataSyncedEvent>(this, OnDataSynced);

            try
            {
                WeakReferenceMessenger.Default.Register<MenuServiceViewModel, ReceiptControllerRequestMessage>(this, (r, m) =>
                   {
                       if (!m.HasReceivedResponse)
                           m.Reply(r.Controller);
                   });

                WeakReferenceMessenger.Default.Register<MenuServiceViewModel, MenuServiceViewModelRequestMessage>(this, (r, m) =>
                {
                    if (!m.HasReceivedResponse)
                        m.Reply(r);
                });
            }
            catch (Exception ex)
            {
                currnetPage?.DisplayAlertAsync("Error", ex.Message, "OK");
            }


        }

        private void OnDataSynced(object recipient, NewDataSyncedEvent message)
        {
        }

        private void OnInvoiceItemSelectionChanged(object recipient, InvoiceItemSelectionChangedMessage message)
        {
            // Unsubscribe from previous item's collection changes
            UnsubscribeFromReceiptItemChanges(_previouslyEditingItem);
            
            _previouslyEditingItem = Controller.CurrentReceiptItem;
            _previouslyEditingProduct = SelectedProduct;
            
            // Subscribe to new current item's collection changes
            SubscribeToReceiptItemChanges(Controller.CurrentReceiptItem);
            
            ResetActionButtons();
        }

        private async void OnInvoiceItemDoubleTap(object recipient, InvoiceItemDoubleTapMessage message)
        {
            var args = message.Value;
            
            if (_previouslyEditingItem != null)
            {
                var currentItems = Controller.SelectedItems.ToList();
                var currentItem = Controller.CurrentReceiptItem;
                var currentProduct = SelectedProduct;
                
                Controller.SelectedItems.Clear();
                Controller.SelectedItems.Add(_previouslyEditingItem);
                Controller.CurrentReceiptItem = _previouslyEditingItem;
                SelectedProduct = _previouslyEditingProduct;
                
                var canMove = await CanNavigate();
                if (!canMove)
                {
                    if(Controller.SelectedPortion!=null)
                    Controller.SelectedPortion.IsSelected=false;
                    Controller.SelectedPortion = null;
                    return;
                }
                
                Controller.SelectedItems.Clear();
                foreach (var item in currentItems)
                {
                    Controller.SelectedItems.Add(item);
                }
                Controller.CurrentReceiptItem = currentItem;
                SelectedProduct = currentProduct;
            }
                
            Controller.SelectedItems.Clear();
            Controller.SelectedItems.Add(args.ReceiptItem);
            Controller.CurrentReceiptItem = args.ReceiptItem;
            SelectedProduct = args.ReceiptItem.Product;
            
            // Subscribe to the receipt item's collection changes
            SubscribeToReceiptItemChanges(args.ReceiptItem);
            
            ShowCategories();
            
            if (args.Portion != null)
            {
                SelectedPortionType = args.Portion.PortionType;
                Controller.SelectPortion(args.Portion);
            }
            else
            {
                var selectedPortion = args.ReceiptItem.Portions?.FirstOrDefault(p => p.IsSelected);
                SelectedPortionType = selectedPortion?.PortionType;
                if (selectedPortion != null)
                {
                    Controller.SelectPortion(selectedPortion);
                }
            }

            if (args.ReceiptItemModifier != null)
            {
                SelectedToppingCategory = SelectedToppingCategories?.FirstOrDefault(x => x.Toppings.Contains(args.ReceiptItemModifier.Modifier));
                SelectedTopping = args.ReceiptItemModifier.Modifier;
            }
            else
            {
                var appliedModifierGroups = new List<Components.Reciept.Model.ReceiptItemModifierGroup>();
                
                if (Controller.SelectedPortion != null)
                {
                    appliedModifierGroups.AddRange(Controller.SelectedPortion.ModifierGroups);
                }
                else
                {
                    appliedModifierGroups.AddRange(args.ReceiptItem.ModifierGroups);
                }
                
                if (appliedModifierGroups.Any())
                {
                    var firstAppliedGroup = appliedModifierGroups.First();
                    SelectedToppingCategory = SelectedToppingCategories?.FirstOrDefault(x => x == firstAppliedGroup.Category);
                    SelectedTopping = firstAppliedGroup.Toppings.FirstOrDefault()?.Modifier;
                }
                else
                {
                    SelectedToppingCategory = SelectedToppingCategories?.FirstOrDefault();
                    SelectedTopping = SelectedToppingCategory?.Toppings?.FirstOrDefault();
                }
            }
            
            if (!ViewsVisible.HasFlag(Views.AddProduct))
                OnNavigated();
            ViewsVisible = Views.AddProduct | Views.InvoiceMenu;
            
            OnPropertyChanged(nameof(SelectedSize));
            OnPropertyChanged(nameof(SelectedType));
            OnPropertyChanged(nameof(SelectedProductTypes));
            OnPropertyChanged(nameof(SelectedToppingCategories));
            OnPropertyChanged(nameof(ProductSizes));
            OnPropertyChanged(nameof(IsSizeSelected));
            OnPropertyChanged(nameof(IsTypeSelected));
            OnPropertyChanged(nameof(PortionTypes));
            OnPropertyChanged(nameof(SelectedTopping));
            OnPropertyChanged(nameof(SelectedToppings));
        }

        private async Task LoadAllDataAsync()
        {
            await Task.WhenAll(
                LoadMenusAsync(),
                LoadOrderEntryActionsAsync(),
                LoadDiscountsAsync(),
                LoadCustomersAsync(),
                LoadAffixesAsync(),
                LoadSmartCouponsAsync(),
                LoadHoldInvoicesAsync(),
                LoadServiceMethodsAsync(),
                LoadPaymentMethodsAsync()
            );
        }

        private void OnModifierDeleted(object recipient, ToppingDeletedMessage message)
        {
            UpdateToppingCategoryState();
            var index = SelectedToppingCategories!.FindIndex(x => !x.IsEnabled);
            if (index != -1 && SelectedToppingCategory!.IsEnabled == false)
            {
                SelectedToppingCategory = SelectedToppingCategories![(index - 1)];
            }
            OnPropertyChanged(nameof(AppliedModifiers));
            OnPropertyChanged(nameof(AppliedModifierGroups));
            
            // Handle tab navigation when modifiers are deleted
            HandleModifierDeletion();
        }

        private void OnPortionDeleted(object recipient, PortionDeletedMessage message)
        {
            // Use MainThread.BeginInvokeOnMainThread with a small delay to ensure 
            // the portion is removed from the collection before checking
            MainThread.BeginInvokeOnMainThread(async () =>
            {
                // Small delay to ensure the Remove operation completes
                await Task.Delay(50);
                HandlePortionDeletion();
            });
        }


        /// <summary>
        /// Subscribes to modifier and portion collection changes for the current receipt item
        /// </summary>
        private void SubscribeToReceiptItemChanges(Components.Reciept.Model.ReceiptItem? item)
        {
            if (item == null) return;
            
            // Subscribe to modifier groups collection changes
            item.ModifierGroups.CollectionChanged += OnReceiptItemModifierGroupsChanged;
            
            // Subscribe to portions collection changes
            item.Portions.CollectionChanged += OnReceiptItemPortionsChanged;
            
            // Subscribe to existing modifier groups' toppings changes
            foreach (var group in item.ModifierGroups)
            {
                group.Toppings.CollectionChanged += OnReceiptItemToppingsChanged;
            }
            
            // Subscribe to existing portions' modifier groups changes
            foreach (var portion in item.Portions)
            {
                portion.ModifierGroups.CollectionChanged += OnReceiptItemModifierGroupsChanged;
                foreach (var group in portion.ModifierGroups)
                {
                    group.Toppings.CollectionChanged += OnReceiptItemToppingsChanged;
                }
            }
        }

        /// <summary>
        /// Unsubscribes from modifier and portion collection changes for a receipt item
        /// </summary>
        private void UnsubscribeFromReceiptItemChanges(Components.Reciept.Model.ReceiptItem? item)
        {
            if (item == null) return;
            
            // Unsubscribe from modifier groups collection changes
            item.ModifierGroups.CollectionChanged -= OnReceiptItemModifierGroupsChanged;
            
            // Unsubscribe from portions collection changes
            item.Portions.CollectionChanged -= OnReceiptItemPortionsChanged;
            
            // Unsubscribe from modifier groups' toppings changes
            foreach (var group in item.ModifierGroups)
            {
                group.Toppings.CollectionChanged -= OnReceiptItemToppingsChanged;
            }
            
            // Unsubscribe from portions' modifier groups changes
            foreach (var portion in item.Portions)
            {
                portion.ModifierGroups.CollectionChanged -= OnReceiptItemModifierGroupsChanged;
                foreach (var group in portion.ModifierGroups)
                {
                    group.Toppings.CollectionChanged -= OnReceiptItemToppingsChanged;
                }
            }
        }

        /// <summary>
        /// Handles modifier groups collection changes
        /// </summary>
        private void OnReceiptItemModifierGroupsChanged(object? sender, System.Collections.Specialized.NotifyCollectionChangedEventArgs e)
        {
            // Subscribe to new modifier groups' toppings changes
            if (e.NewItems != null)
            {
                foreach (Components.Reciept.Model.ReceiptItemModifierGroup group in e.NewItems)
                {
                    group.Toppings.CollectionChanged += OnReceiptItemToppingsChanged;
                }
            }
            
            // Unsubscribe from removed modifier groups' toppings changes
            if (e.OldItems != null)
            {
                foreach (Components.Reciept.Model.ReceiptItemModifierGroup group in e.OldItems)
                {
                    group.Toppings.CollectionChanged -= OnReceiptItemToppingsChanged;
                }
                
                // Only handle navigation when items are REMOVED
                HandleModifierDeletion();
            }
        }

        /// <summary>
        /// Handles toppings collection changes within modifier groups
        /// </summary>
        private void OnReceiptItemToppingsChanged(object? sender, System.Collections.Specialized.NotifyCollectionChangedEventArgs e)
        {
            // Only handle tab navigation adjustment when toppings are REMOVED
            if (e.Action == System.Collections.Specialized.NotifyCollectionChangedAction.Remove ||
                e.Action == System.Collections.Specialized.NotifyCollectionChangedAction.Reset)
            {
                HandleModifierDeletion();
            }
        }

        /// <summary>
        /// Handles portions collection changes
        /// </summary>
        private void OnReceiptItemPortionsChanged(object? sender, System.Collections.Specialized.NotifyCollectionChangedEventArgs e)
        {
            // Subscribe to new portions' modifier groups changes
            if (e.NewItems != null)
            {
                foreach (Components.Reciept.Model.ReceiptItemPortion portion in e.NewItems)
                {
                    portion.ModifierGroups.CollectionChanged += OnReceiptItemModifierGroupsChanged;
                    foreach (var group in portion.ModifierGroups)
                    {
                        group.Toppings.CollectionChanged += OnReceiptItemToppingsChanged;
                    }
                }
            }
            
            // Unsubscribe from removed portions' modifier groups changes
            if (e.OldItems != null)
            {
                foreach (Components.Reciept.Model.ReceiptItemPortion portion in e.OldItems)
                {
                    portion.ModifierGroups.CollectionChanged -= OnReceiptItemModifierGroupsChanged;
                    foreach (var group in portion.ModifierGroups)
                    {
                        group.Toppings.CollectionChanged -= OnReceiptItemToppingsChanged;
                    }
                }
                
                // Only handle navigation when portions are REMOVED
                HandlePortionDeletion();
            }
        }

        /// <summary>
        /// Handles tab navigation when modifiers are deleted
        /// </summary>
        private void HandleModifierDeletion()
        {
            if (Controller.CurrentReceiptItem == null || SelectedProduct == null)
                return;

            // Only adjust if we're currently on the Modifiers tab (tab 4)
            if (SelectedTabIndex != 4)
                return;

            var hasModifiers = HasAnyModifiers();
            
            if (!hasModifiers)
            {
                // No modifiers left - navigate to previous appropriate tab
                NavigateToPreviousAvailableTab();
            }
            else
            {
                // Still have modifiers, but check if current category still has toppings
                var currentCategoryHasToppings = SelectedToppingCategory?.Toppings?.Any() == true &&
                    (Controller.CurrentReceiptItem.ModifierGroups.Any(g => g.Category == SelectedToppingCategory) ||
                     Controller.CurrentReceiptItem.Portions.Any(p => p.ModifierGroups.Any(g => g.Category == SelectedToppingCategory)));
                
                if (!currentCategoryHasToppings && SelectedToppingCategories?.Count > 0)
                {
                    // Current category is empty, switch to first available category with modifiers
                    var categoryWithModifiers = SelectedToppingCategories.FirstOrDefault(cat =>
                        Controller.CurrentReceiptItem.ModifierGroups.Any(g => g.Category == cat && g.Toppings.Any()) ||
                        Controller.CurrentReceiptItem.Portions.Any(p => p.ModifierGroups.Any(g => g.Category == cat && g.Toppings.Any())));
                    
                    if (categoryWithModifiers != null)
                    {
                        SelectedToppingCategory = categoryWithModifiers;
                    }
                    else
                    {
                        // No categories have modifiers anymore
                        NavigateToPreviousAvailableTab();
                    }
                }
            }
            
            // Update visibility properties
            OnPropertyChanged(nameof(ShouldShowModifierGroupsTab));
        }

        /// <summary>
        /// Handles tab navigation when portions are deleted
        /// </summary>
        private void HandlePortionDeletion()
        {
            if (Controller.CurrentReceiptItem == null || SelectedProduct == null)
                return;

            // Check if portions are empty
            var hasPortions = Controller.CurrentReceiptItem.Portions?.Any() == true;
            
            if (!hasPortions)
            {
                // Only adjust if we're currently on Modifier Groups (tab 3) or Modifiers tab (tab 4)
                // When portions are deleted and user is on these tabs, navigate TO Portions tab
                if (SelectedTabIndex == 3 || SelectedTabIndex == 4)
                {
                    // Check if product actually has portions available
                    if (SelectedProduct.PortionTypes?.Count > 0)
                    {
                        SelectedTabIndex = 2; // Navigate TO Portions tab
                    }
                    else
                    {
                        // No portion types available, navigate to previous tab
                        NavigateToFallbackTab();
                    }
                }
            }
        }

        /// <summary>
        /// Checks if the current receipt item has any modifiers
        /// </summary>
        private bool HasAnyModifiers()
        {
            if (Controller.CurrentReceiptItem == null)
                return false;

            // Check if there are modifiers directly on the item
            var hasDirectModifiers = Controller.CurrentReceiptItem.ModifierGroups.Any(g => g.Toppings.Any());
            
            // Check if there are modifiers on any portions
            var hasPortionModifiers = Controller.CurrentReceiptItem.Portions
                .Any(p => p.ModifierGroups.Any(g => g.Toppings.Any()));
            
            return hasDirectModifiers || hasPortionModifiers;
        }

        /// <summary>
        /// Navigates to the previous available tab when current tab content is empty
        /// Used when modifiers are deleted
        /// </summary>
        private void NavigateToPreviousAvailableTab()
        {
            // Navigate back to the most appropriate tab based on what's available
            // Priority: Portions → Types → Sizes
            var hasPortions = Controller.CurrentReceiptItem?.Portions?.Any() == true;
            var hasTypes = SelectedProduct?.ProductTypes?.Count > 0;
            var hasModifierGroups = SelectedToppingCategories?.Count > 0;
            var hasSizes = SelectedProduct?.AssignedSizes?.Count > 0;
            if (hasModifierGroups)
            {
                SelectedTabIndex = 3; // Modifier groups
            }

            else if (hasPortions)
            {
                SelectedTabIndex = 2; // Portions
            }
            else if (hasTypes)
            {
                SelectedTabIndex = 1; // Types
            }
            else if (hasSizes)
            {
                SelectedTabIndex = 0; // Sizes
            }
            // If none available, stay on current tab
        }

        /// <summary>
        /// Navigates to a fallback tab when portions are not available for the product
        /// </summary>
        private void NavigateToFallbackTab()
        {
            // Navigate to the most appropriate tab based on what's available
            // Priority: Types → Sizes → Modifier Groups
            var hasTypes = SelectedProduct?.ProductTypes?.Count > 0;
            var hasSizes = SelectedProduct?.AssignedSizes?.Count > 0;
            var hasModifierGroups = SelectedToppingCategories?.Count > 1;
            
            if (hasTypes)
            {
                SelectedTabIndex = 1; // Types
            }
            else if (hasSizes)
            {
                SelectedTabIndex = 0; // Sizes
            }
            else if (hasModifierGroups)
            {
                SelectedTabIndex = 3; // Modifier Groups
            }
            // If none available, stay on current tab
        }
        
        /// <summary>
        /// Handles navigation when all modifier categories are filtered out by size selection
        /// EDGE CASE: User selects a size that has no modifier categories assigned
        /// </summary>
        private void HandleAllModifiersFilteredOut()
        {
            // Navigate back to the most appropriate tab since modifiers are no longer available
            // Priority: Portions → Types → Sizes
            var hasPortions = SelectedProduct?.PortionTypes?.Count > 0;
            var hasTypes = SelectedProduct?.ProductTypes?.Count > 0;
            var hasSizes = SelectedProduct?.AssignedSizes?.Count > 0;
            
            if (hasPortions && IsPortionsTabEnabled)
            {
                SelectedTabIndex = 2; // Portions
            }
            else if (hasTypes && IsTypesTabEnabled)
            {
                SelectedTabIndex = 1; // Types
            }
            else if (hasSizes)
            {
                SelectedTabIndex = 0; // Sizes (stay on sizes to allow changing selection)
            }
            else
            {
                // No other modifiers available - product can be completed with just size
                // Stay on current tab but user can use Done button
            }
        }
    }
}
