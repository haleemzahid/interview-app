using PennPOS.Maui.Shared.Dtos.OrderEntryDtos;
using EfPaymentMethod = PennPOS.Data.EfCore.Entities.MenuSetupEntities.PaymentMethod;
using Menu = PennPOS.Data.EfCore.Entities.MenuSetupEntities.Menu;
using OrderEntry.Dtos;
using PennPOS.Maui.Shared.Common;
using System.Collections.ObjectModel;
using Newtonsoft.Json;
using Microsoft.EntityFrameworkCore;
using PennPOS.Maui.Shared.Dtos.MenuDtos;
using PennPOS.Maui.Shared.Dtos.Enums;
using System.Diagnostics;
using PennPOS.Data.EfCore.Entities.MenuSetupEntities;
using AutoMapper;
using PennPOS.Maui.Shared.Interfaces;
namespace OrderEntry.ViewModels.MenuServiceVMpartialClasses
{
    public partial class MenuServiceViewModel : BaseViewModel
    {
        #region Functions
   
        private void SwapDingingOption_MakeToGoLabels()
        {
            var taxFreeAction = OrderEntryActions.FirstOrDefault(x => x.Type == ActionType.MakeToGo);
            if (taxFreeAction != null)
            {
                if (DininButtonText == taxFreeAction.AltLabel)
                {
                    taxFreeAction.BtnLabel = taxFreeAction.AltLabel;
                    DininButtonText = taxFreeAction.Label;
                }
                else
                {
                    taxFreeAction.BtnLabel = taxFreeAction.Label;
                    DininButtonText = taxFreeAction.AltLabel;
                }

            }
            if (taxFreeAction != null)
                Controller.IsMakeToGo = (DininButtonText == taxFreeAction.Label) ? true : false;
        }
        private void EnableDisableActionBtns(bool v)
        {
            foreach (var item in from item in OrderEntryActions
                                 where item.Scope == ActionScope.Item
                                 select item)
            {
                item.IsEnable = v;
            }
        }

        private void InitializeDiningButtonText()
        {
            var taxFreeAction = OrderEntryActions.FirstOrDefault(x => x.Type==ActionType.MakeToGo);
            if (taxFreeAction != null)
            {
                DininButtonText = taxFreeAction.AltLabel;
            }
        }
        public void ResetActionButtons()
        {
            foreach (var item in OrderEntryActions)
            {
                if (item.Type == ActionType.ManagerActions || item.Scope == ActionScope.Invoice)
                    item.IsEnable = true;

                else
                    item.IsEnable = Controller.SelectedItems.Count>0;

                item.BtnBackBrush = Color.FromArgb(item.BackColor);
                item.BtnForeColor = item.ForeColor;
                item.BtnLabel = item.Label;
            }
        }
        private static void ChangeActionInvoiceItemState(ItemViewModel item, OrderEntryActionDto taxFreeAction)
        {
            if (!item.IsTaxFreeItem)
            {
                taxFreeAction.BtnBackBrush = Color.FromArgb(taxFreeAction.BackColor);
                taxFreeAction.BtnForeColor = taxFreeAction.ForeColor;
                taxFreeAction.BtnLabel = taxFreeAction.Label;
            }
            else
            {
                taxFreeAction.BtnBackBrush = Color.FromArgb(taxFreeAction.AltBackColor);
                taxFreeAction.BtnForeColor = taxFreeAction.AltForeColor;
                taxFreeAction.BtnLabel = taxFreeAction.AltLabel;
            }

        }
        private void OnNavigated()
        {
            NavStack.Push(ViewsVisible);
        }

        public async Task LoadDiscountsAsync()
        {
            IsLoading = true;
            var data = await discountService.GetAsync();
            var invoiceDisountDtos = mapper.Map<IEnumerable<SharedDtos.InvoiceDiscountDto>>(data);
            Discounts = [.. invoiceDisountDtos];
            IsLoading = false;
        }

        public async Task LoadPaymentMethodsAsync()
        {
            try
            {
                IsLoading = true;
                var result = await paymentMethodService.GetAsync();
                if (result.Count() == 0)
                    result = await AddDefaultPaymentMethodAsync();
                if(PaymentMethods==null)
                    PaymentMethods = new List<SharedDtos.PaymentMethodDto>();
                var paymentMethods = mapper.Map<IEnumerable<SharedDtos.PaymentMethodDto>>(result);
                PaymentMethods = (List<SharedDtos.PaymentMethodDto>)paymentMethods;
            }
            catch (Exception _)
            {
            }
            finally
            {
                IsLoading = false;
            }
        }
        private async Task<List<EfPaymentMethod>> AddDefaultPaymentMethodAsync()
        {
            var paymentMethods = new List<EfPaymentMethod>
        {
            new EfPaymentMethod
            {
                 Id=Guid.NewGuid().ToString(),
                Name = "Cash",
                DisplayName = "Cash",
                OrderNumber = 1
            },
            new EfPaymentMethod
            {
                 Id=Guid.NewGuid().ToString(),
                Name = "Credit Card",
                DisplayName = "Credit Card",
                OrderNumber = 2
            }
            , new EfPaymentMethod
            {
                 Id=Guid.NewGuid().ToString(),
                Name = "A/R",
                DisplayName = "A/R",
                OrderNumber = 3
            }
             , new EfPaymentMethod
            {
                  Id=Guid.NewGuid().ToString(),
                Name = "Gift Card/Split Pay",
                DisplayName = "Gift Card/Split Pay",
                OrderNumber = 4
            }
             , new EfPaymentMethod
            {
                  Id=Guid.NewGuid().ToString(),
                Name = "Others",
                DisplayName = "Others",
                OrderNumber = 5
            }
        };
            foreach (var paymentMethod in paymentMethods)
            {
                var result = await paymentMethodService.AddAsync(paymentMethod);
            }
            return paymentMethods;
        }
        public async Task LoadCustomersAsync()
        {
            IsLoading = true;
            var customers = await CustomerService.GetAsync();
            if(Customers==null)
               Customers = new ObservableCollection<OrderEntry.Customers.CustomerDto>();
            Customers.Clear();
            foreach (var item in customers)
            {
                    Customers.Add(new OrderEntry.Customers.CustomerDto()
                    {
                        Id = item.Id,
                        Name = item.Name,
                    });
            }
            IsLoading = false;
        }

        public async Task LoadAffixesAsync()
        {
            var result = (await affixService.GetAsync()).ToList();
            Affixes = mapper.Map<List<SharedDtos.AffixDto>>(result);
        }

        public async Task LoadSmartCouponsAsync()
        {
            try
            {
                var result = await smartCouponService.GetAsync();
                foreach (var item in result)
                {
                    SharedDtos.SmartCouponDto.SmartCouponDto smartCouponDbModel = MapEfModelToSmartCouoponDbModel(item);
                    SmartCoupons.Add(smartCouponDbModel);
                }
            }
            catch (Exception _)
            {
            }
        }

        private SharedDtos.SmartCouponDto.SmartCouponDto MapEfModelToSmartCouoponDbModel(PennPOS.Data.EfCore.Entities.MenuSetupEntities.SmartCoupon item)
        {
            return new SharedDtos.SmartCouponDto.SmartCouponDto
            {
                Id = item.Id,
                Name = item.Name,
                DisplayName = item.DisplayName,
                Code = item.Code,
                OrderNumber = item.OrderNumber,
                DiscountType = (SharedDtos.Enums.SmartCouponDiscountType)item.DiscountType,
                DiscountInput = item.DiscountValue.ToString("0.00"),
                UsageLimit = item.UsageLimit,
                UsageCount = item.UsageCount,
                CreatedAt = item.CreatedDate,
                ExpiresAt = item.ExpiresAt,
                IsActive = item.IsActive && !item.IsDeleted,
                Rules = JsonConvert.DeserializeObject<List<SharedDtos.SmartCouponDto.CouponRuleDto>>(item.RulesJson),
                SelectedRuleTemplate  =JsonConvert.DeserializeObject<SharedDtos.SmartCouponDto.RuleTemplateDto>( item.RuleTemplateJson)
            };
        }

        public async Task LoadServiceMethodsAsync()
        {
            IsLoading = true;
            var serviceMethods = (await serviceMethodService.GetAsync()).ToList();
            if(serviceMethods.Count>0)
               ServiceMethods= mapper.Map<List<SharedDtos.ServiceMethodDto>>(serviceMethods);
            IsLoading = false;
        }

        private async Task LoadHoldInvoicesAsync()
        {
            try
            {
                IsLoading = true;
                var result = await orderEntryService.GetHoldInvoicesAsync();
                // result is IEnumerable<InvoiceDto> from the updated OrderEntryService
                if (result?.Any() == true)
                {
                    HoldInvoices = new ObservableCollection<InvoiceDto>(result.OrderByDescending(x => x.CreatedDate));
                }
                else
                {
                    HoldInvoices = new ObservableCollection<InvoiceDto>();
                }
            }
            catch (Exception ex)
            {
                HoldInvoices = new ObservableCollection<InvoiceDto>();
                await Application.Current!.Windows[0].Page!.DisplayAlertAsync("Error",
                    $"Failed to load hold invoices: {ex.Message}", "OK");
            }
            finally
            {
                IsLoading = false;
            }
        }

        public List<OrderEntryAction> orderEntryActions=new List<OrderEntryAction>();
        public async Task LoadOrderEntryActionsAsync()
        {
            IsLoading = true;

            try
            {
                orderEntryActions.Clear();
                orderEntryActions = (await quickCenterActionService.GetAsync()).ToList();
                // Map the retrieved data to the desired model
                OrderEntryActions = orderEntryActions
                     .Where(x => x.IsManagerOverrideRequired == false)
                     .Select(x =>
                     {
                         var mappedItem = Mapper.Map<OrderEntryActionDto>(x);
                         mappedItem.BtnBackBrush = Color.FromArgb(mappedItem.BackColor);
                         if (mappedItem.Type == ActionType.ManagerActions || mappedItem.Scope == ActionScope.Invoice)
                             mappedItem.IsEnable = true;

                         if (Controller.Items.Count > 0)
                             mappedItem.IsEnable = true;
                         mappedItem.BtnLabel = mappedItem.Label;
                         mappedItem.BtnForeColor = mappedItem.ForeColor;
                         return mappedItem;
                     })
                    .ToList();
                if (OrderEntryActions!=null)
                {
                    InitializeDiningButtonText();
                }

            }
            catch (Exception ex)
            {
                var mainPage = Application.Current!.Windows[0].Page;
                if (mainPage != null)
                    await mainPage.DisplayAlertAsync("Error", $"{ex.Message}", "OK");
            }
            finally
            {
                IsLoading = false;
            }

        }
        public Stack<Views> NavStack { get; set; } = new Stack<Views>();
    

        public void ApplyDiscount(SharedDtos.InvoiceDiscountDto discount,bool forceApply=false)
        {
            if (Controller.SelectedItems?.Count==0)
            {
                InfoPopupVM = new InfoPopupViewModel("Information",
                        "Requirements does not meet",
                        "Please select items to apply discount");
                return;
            }
            Controller.ApplyDiscount(discount,forceApply);
        }

        public async Task LoadMenusAsync()
        {
            IsLoading = true;
            try
            {
                // 1) Fetch EF menus (materialized)
                var efList = await FetchEfMenusAsync(menuService);

                // 2) Map to DTOs
                var dtoList = MapToDto(mapper, efList);

                // 3) Collect all product ids
                var allProductIds = CollectAllProductIds(dtoList);

                // 4) Fetch related data grouped by ProductId
                var portionTypesByProduct = await LoadPortionTypesGroupedAsync(portionTypeService, mapper);
                var productTypesByProduct = await LoadProductTypesGroupedAsync(productService, mapper, allProductIds);
                var assignedSizesByProduct = await LoadAssignedSizesGroupedAsync(sizeService, mapper, allProductIds);

                // 5) Assign portion/product types and sizes to products (fast dictionary lookups)
                AssignDetailsToProducts(dtoList, portionTypesByProduct, productTypesByProduct, assignedSizesByProduct);

                // 6) Normalize DTOs (ObservableCollections + ordering)
                NormalizeDtos(dtoList);

                // 7) Filter/set Menus and select defaults
                await SetMenusAndSelections(dtoList);

                // 8) Load direct products and assign their details
                DirectProducts = await LoadDirectProductsWithDetailsAsync(productService, portionTypeService, sizeService, mapper, portionTypesByProduct, productTypesByProduct, assignedSizesByProduct);

                
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"LoadMenusAsync error: {ex}");
            }
            finally
            {
                IsLoading = false;
            }
        }

        /// <summary>
        /// Invalidates the menu cache to force fresh data loading on next request
        /// </summary>
        public static void InvalidateMenuCache()
        {
            InvalidateCache("EfMenus");
            Debug.WriteLine("Menu cache invalidated - fresh data will be loaded on next request");
        }

        #region Cache Infrastructure
        
        public static readonly Dictionary<string, (DateTime LastLoaded, object Data, bool IsValid)> _menuCache = new();
        private static readonly object _cacheLock = new object();
        private static readonly TimeSpan CacheExpiration = TimeSpan.FromMinutes(5);

        private static bool IsDataCached(string cacheKey)
        {
            lock (_cacheLock)
            {
                if (_menuCache.TryGetValue(cacheKey, out var cacheInfo))
                {
                    return cacheInfo.IsValid && DateTime.Now - cacheInfo.LastLoaded < CacheExpiration;
                }
                return false;
            }
        }

        private static T GetCachedData<T>(string cacheKey)
        {
            lock (_cacheLock)
            {
                if (_menuCache.TryGetValue(cacheKey, out var cacheInfo) && cacheInfo.Data is T data)
                {
                    return data;
                }
                return default(T);
            }
        }

        private static void CacheData<T>(string cacheKey, T data)
        {
            lock (_cacheLock)
            {
                _menuCache[cacheKey] = (DateTime.Now, data, true);
            }
        }

        private static void InvalidateCache(string cacheKey = null)
        {
            lock (_cacheLock)
            {
                if (string.IsNullOrEmpty(cacheKey))
                {
                    _menuCache.Clear();
                }
                else if (_menuCache.ContainsKey(cacheKey))
                {
                    _menuCache[cacheKey] = (_menuCache[cacheKey].LastLoaded, _menuCache[cacheKey].Data, false);
                }
            }
        }

        #endregion

        /* -------------------------
           Static helper functions
           ------------------------- */

        private static async Task<IEnumerable<Menu>> FetchEfMenusAsync(IMenuService menuService)
        {
            const string cacheKey = "EfMenus";
            var stopwatch = Stopwatch.StartNew();
            
            try
            {
                // Check cache first
                if (IsDataCached(cacheKey))
                {
                    var cachedData = GetCachedData<IEnumerable<Menu>>(cacheKey);
                    if (cachedData != null)
                    {
                        Debug.WriteLine($"FetchEfMenusAsync: Loaded from cache in {stopwatch.ElapsedMilliseconds}ms");
                        return cachedData;
                    }
                }

                Debug.WriteLine("FetchEfMenusAsync: Loading from database...");
                
                // Optimized database query with retry mechanism
                const int maxRetries = 3;
                const int baseDelayMs = 500;
                
                for (int attempt = 1; attempt <= maxRetries; attempt++)
                {
                    try
                    {
                        // Optimized query with performance improvements
                        var efDataEnumerable = await menuService.GetWithComplexIncludesAsync(query =>
                            query
                                .AsNoTracking() // Read-only, improves performance
                                .AsSplitQuery() // Prevents cartesian explosion
                                .Include(m => m.MenuCategories)
                                    .ThenInclude(mc => mc.Products)
                                        .ThenInclude(p => p.ToppingCategories)
                                            .ThenInclude(tc => tc.Toppings)
                                .Include(m => m.MenuCategories)
                                    .ThenInclude(mc => mc.Products)
                                        .ThenInclude(p => p.AssignedSizes)
                                            .ThenInclude(a => a.Size)
                                .Include(m => m.MenuCategories)
                                    .ThenInclude(mc => mc.Products)
                                        .ThenInclude(p => p.ProductTypes)
                                .Include(m => m.MenuCategories)
                                    .ThenInclude(mc => mc.Products)
                                        .ThenInclude(p => p.PortionTypes)
                                .Include(m => m.MenuProducts)
                                    .ThenInclude(mp => mp.ToppingCategories)
                                        .ThenInclude(tc => tc.Toppings)
                                .Include(m => m.MenuProducts)
                                    .ThenInclude(mp => mp.PortionTypes)
                                .Include(m => m.MenuProducts)
                                    .ThenInclude(mp => mp.ProductTypes)
                                .Include(m => m.MenuProducts)
                                    .ThenInclude(mp => mp.AssignedSizes)
                        );

                        var result = efDataEnumerable as IList<Menu> ?? efDataEnumerable.ToList();
                        
                        // Cache the successful result
                        CacheData(cacheKey, result);
                        
                        stopwatch.Stop();
                        Debug.WriteLine($"FetchEfMenusAsync: Loaded {result.Count} menus from database in {stopwatch.ElapsedMilliseconds}ms (attempt {attempt})");
                        
                        return result;
                    }
                    catch (Exception ex) when (attempt < maxRetries)
                    {
                        Debug.WriteLine($"FetchEfMenusAsync: Attempt {attempt} failed: {ex.Message}");
                        
                        // Exponential backoff delay
                        var delay = baseDelayMs * Math.Pow(2, attempt - 1);
                        await Task.Delay(TimeSpan.FromMilliseconds(delay));
                    }
                }
                
                // If all retries failed, throw the last exception
                throw new InvalidOperationException("Failed to fetch menus after all retry attempts");
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                Debug.WriteLine($"FetchEfMenusAsync: Critical error after {stopwatch.ElapsedMilliseconds}ms - {ex.Message}");
                
                // Invalidate cache on error
                InvalidateCache(cacheKey);
                throw;
            }
        }

        private static List<MenuDto> MapToDto(IMapper mapper, IEnumerable<Menu> efList)
        {
            return mapper.Map<List<MenuDto>>(efList) ?? new List<MenuDto>();
        }

        private static HashSet<string> CollectAllProductIds(List<MenuDto> dtoList)
        {
            var allProductIds = new HashSet<string>();

            foreach (var menu in dtoList)
            {
                foreach (var mc in menu.MenuCategories ?? Enumerable.Empty<MenuCategoryDto>())
                {
                    foreach (var p in mc.Products ?? Enumerable.Empty<ProductDto>())
                        if (!string.IsNullOrEmpty(p.Id))
                            allProductIds.Add(p.Id);
                }

                foreach (var mp in menu.MenuProducts ?? Enumerable.Empty<ProductDto>())
                    if (!string.IsNullOrEmpty(mp.Id))
                        allProductIds.Add(mp.Id);
            }

            return allProductIds;
        }

        private static async Task<Dictionary<string, List<PortionTypeDto>>> LoadPortionTypesGroupedAsync(IPortionTypeService portionTypeService, IMapper mapper)
        {
            var efPortionTypes = await portionTypeService.GetAsync();
            return (efPortionTypes ?? Enumerable.Empty<PortionType>())
                .Select(pt => mapper.Map<PortionTypeDto>(pt))
                .GroupBy(pt => pt.ProductId)
                .ToDictionary(g => g.Key, g => g.ToList());
        }

        private static async Task<Dictionary<string, List<ProductTypeDto>>> LoadProductTypesGroupedAsync(IProductService productService, IMapper mapper, HashSet<string> productIds)
        {
            var efProductTypes = await productService.GetProductTypesAsync(productIds);
            return (efProductTypes ?? Enumerable.Empty<ProductType>())
                .Select(pt => mapper.Map<ProductTypeDto>(pt))
                .GroupBy(pt => pt.ProductId)
                .ToDictionary(g => g.Key, g => g.ToList());
        }

        private static async Task<Dictionary<string, List<AssignedSizeDto>>> LoadAssignedSizesGroupedAsync(ISizeService sizeService, IMapper mapper, HashSet<string> productIds)
        {
            var efAssignedSizes = productIds.Count > 0
                ? await sizeService.GetAssignedSizesAsync(productIds)
                : Enumerable.Empty<AssignedSize>();

            return (efAssignedSizes ?? Enumerable.Empty<AssignedSize>())
                .Where(a => a.IsAssigned)
                .Select(a => mapper.Map<AssignedSizeDto>(a))
                .GroupBy(a => a.ProductId ?? string.Empty)
                .ToDictionary(g => g.Key, g => g.ToList());
        }

        private static void AssignDetailsToProducts(
            List<MenuDto> dtoList,
            Dictionary<string, List<PortionTypeDto>> portionTypesByProduct,
            Dictionary<string, List<ProductTypeDto>> productTypesByProduct,
            Dictionary<string, List<AssignedSizeDto>> assignedSizesByProduct)
        {
            foreach (var menu in dtoList)
            {
                foreach (var mc in menu.MenuCategories ?? Enumerable.Empty<MenuCategoryDto>())
                {
                    foreach (var p in mc.Products ?? Enumerable.Empty<ProductDto>())
                    {
                        portionTypesByProduct.TryGetValue(p.Id ?? string.Empty, out var pPortions);
                        p.PortionTypes = ToObs((pPortions ?? new List<PortionTypeDto>()).OrderBy(pt => pt.OrderNumber));

                        productTypesByProduct.TryGetValue(p.Id ?? string.Empty, out var pTypes);
                        p.ProductTypes = ToObs((pTypes ?? new List<ProductTypeDto>()).OrderBy(pt => pt.OrderNumber));

                        assignedSizesByProduct.TryGetValue(p.Id ?? string.Empty, out var pAssignedSizes);
                        var orderedAssigned = (pAssignedSizes ?? new List<AssignedSizeDto>())
                            .OrderBy(a => a.Size?.OrderNumber ?? int.MaxValue);
                        p.AssignedSizes = ToObs(orderedAssigned);
                    }
                }

                foreach (var mp in menu.MenuProducts ?? Enumerable.Empty<ProductDto>())
                {
                    portionTypesByProduct.TryGetValue(mp.Id ?? string.Empty, out var mpPortions);
                    mp.PortionTypes = ToObs((mpPortions ?? new List<PortionTypeDto>()).OrderBy(pt => pt.OrderNumber));

                    productTypesByProduct.TryGetValue(mp.Id ?? string.Empty, out var mpTypes);
                    mp.ProductTypes = ToObs((mpTypes ?? new List<ProductTypeDto>()).OrderBy(pt => pt.OrderNumber));

                    assignedSizesByProduct.TryGetValue(mp.Id ?? string.Empty, out var mpAssignedSizes);
                    var orderedMpAssigned = (mpAssignedSizes ?? new List<AssignedSizeDto>())
                        .OrderBy(a => a.Size?.OrderNumber ?? int.MaxValue);
                    mp.AssignedSizes = ToObs(orderedMpAssigned);
                }
            }
        }

        private static void NormalizeDtos(List<MenuDto> dtoList)
        {
            foreach (var menu in dtoList)
            {
                menu.MenuCategories = ToObs(menu.MenuCategories?
                    .OrderBy(mc => mc.OrderNumber) ?? Enumerable.Empty<MenuCategoryDto>());

                foreach (var mc in menu.MenuCategories)
                {
                    mc.Products = ToObs(mc.Products?
                        .OrderBy(p => p.OrderNumber) ?? Enumerable.Empty<ProductDto>());

                    foreach (var p in mc.Products)
                    {
                        p.ToppingCategories = ToObs(p.ToppingCategories?
                            .OrderBy(tc => tc.OrderNumber) ?? Enumerable.Empty<ToppingCategoryDto>());

                        foreach (var tc in p.ToppingCategories)
                            tc.Toppings = ToObs(tc.Toppings?
                                .OrderBy(t => t.OrderNumber) ?? Enumerable.Empty<ToppingDto>());

                        p.AssignedSizes = ToObs(p.AssignedSizes ?? Enumerable.Empty<AssignedSizeDto>());
                        p.ProductTypes = ToObs(p.ProductTypes?
                            .OrderBy(pt => pt.OrderNumber) ?? Enumerable.Empty<ProductTypeDto>());
                        p.PortionTypes = ToObs(p.PortionTypes?
                            .OrderBy(pt => pt.OrderNumber) ?? Enumerable.Empty<PortionTypeDto>());
                    }
                }

                menu.MenuProducts = ToObs(menu.MenuProducts?
                    .OrderBy(mp => mp.OrderNumber) ?? Enumerable.Empty<ProductDto>());

                foreach (var mp in menu.MenuProducts)
                {
                    mp.ToppingCategories = ToObs(mp.ToppingCategories?
                        .OrderBy(tc => tc.OrderNumber) ?? Enumerable.Empty<ToppingCategoryDto>());

                    foreach (var tc in mp.ToppingCategories)
                        tc.Toppings = ToObs(tc.Toppings?
                            .OrderBy(t => t.OrderNumber) ?? Enumerable.Empty<ToppingDto>());

                    mp.PortionTypes = ToObs(mp.PortionTypes?
                        .OrderBy(pt => pt.OrderNumber) ?? Enumerable.Empty<PortionTypeDto>());
                    mp.ProductTypes = ToObs(mp.ProductTypes?
                        .OrderBy(pt => pt.OrderNumber) ?? Enumerable.Empty<ProductTypeDto>());
                    mp.AssignedSizes = ToObs(mp.AssignedSizes ?? Enumerable.Empty<AssignedSizeDto>());
                }
            }
        }

        private async Task SetMenusAndSelections(List<MenuDto> dtoList)
        {
            var filtered = dtoList
                .Where(x => !x.IsNoMenu)
                .OrderBy(x => x.OrderNumber)
                .ToList();

            Menus = new List<MenuDto>(filtered);
            SelectedMenu = Menus.FirstOrDefault() ?? new MenuDto();
            SelectedMenuCategory = SelectedMenu.MenuCategories.FirstOrDefault() ?? new MenuCategoryDto();
        }

        private static async Task<List<ProductDto>> LoadDirectProductsAsync(IProductService productService, IMapper mapper)
        {
            var efDirectProducts = await productService.GetDirectProductsAsync();
            var efDirectList = efDirectProducts?.ToList() ?? new List<Product>();
            var dtos = mapper.Map<List<ProductDto>>(efDirectList) ?? new List<ProductDto>();
            return dtos;
        }

        private static async Task<List<ProductDto>> LoadDirectProductsWithDetailsAsync(
            IProductService productService,
            IPortionTypeService portionTypeService,
            ISizeService sizeService,
            IMapper mapper,
            Dictionary<string, List<PortionTypeDto>> portionTypesByProduct,
            Dictionary<string, List<ProductTypeDto>> productTypesByProduct,
            Dictionary<string, List<AssignedSizeDto>> assignedSizesByProduct)
        {
            // 1) Load basic direct products
            var directProducts = await LoadDirectProductsAsync(productService, mapper);
            
            // 2) Collect direct product IDs for additional data loading if needed
            var directProductIds = directProducts
                .Where(p => !string.IsNullOrEmpty(p.Id))
                .Select(p => p.Id!)
                .ToHashSet();
            
            // 3) Check if we need to load additional data for direct products that weren't in the main menu products
            var missingIds = directProductIds.Except(productTypesByProduct.Keys.Concat(assignedSizesByProduct.Keys)).ToList();
            
            if (missingIds.Any())
            {
                // Load additional product types and assigned sizes for direct products not covered in main menu
                var additionalProductTypes = await LoadProductTypesGroupedAsync(productService, mapper, missingIds.ToHashSet());
                var additionalAssignedSizes = await LoadAssignedSizesGroupedAsync(sizeService, mapper, missingIds.ToHashSet());
                
                // Merge the additional data into existing dictionaries
                foreach (var kvp in additionalProductTypes.Where(kvp => !productTypesByProduct.ContainsKey(kvp.Key)))
                {
                    productTypesByProduct[kvp.Key] = kvp.Value;
                }
                
                var filteredAdditionalAssignedSizes = additionalAssignedSizes.Where(kvp => !assignedSizesByProduct.ContainsKey(kvp.Key));
                foreach (var kvp in filteredAdditionalAssignedSizes)
                {
                    assignedSizesByProduct[kvp.Key] = kvp.Value;
                }
            }
            
            // 4) Assign details to direct products (same logic as menu products)
            AssignDetailsToDirectProducts(directProducts, portionTypesByProduct, productTypesByProduct, assignedSizesByProduct);
            
            // 5) Normalize direct products
            NormalizeDirectProducts(directProducts);
            
            return directProducts;
        }

        private async Task LoadMenuProductsAsync(MenuDto menuDto)
        {
            MenuProducts.Clear();
            foreach (var menuProduct in menuDto!.MenuProducts!)
            {
            IsLoading = true;
                MenuProducts.Add(menuProduct);
                await Task.Delay(1); // Yield to UI thread
            IsLoading = false;
            }

        }

        // helper to ensure ObservableCollection<T> and avoid nulls
        private static ObservableCollection<T> ToObs<T>(IEnumerable<T>? seq)
        {
            return new ObservableCollection<T>((seq ?? Enumerable.Empty<T>()).ToList());
        }



        /// <summary>
        /// Assigns portion types, product types, and assigned sizes to direct products
        /// </summary>
        private static void AssignDetailsToDirectProducts(
            List<ProductDto> directProducts,
            Dictionary<string, List<PortionTypeDto>> portionTypesByProduct,
            Dictionary<string, List<ProductTypeDto>> productTypesByProduct,
            Dictionary<string, List<AssignedSizeDto>> assignedSizesByProduct)
        {
            foreach (var product in directProducts)
            {
                // Assign portion types
                portionTypesByProduct.TryGetValue(product.Id ?? string.Empty, out var pPortions);
                product.PortionTypes = ToObs((pPortions ?? new List<PortionTypeDto>()).OrderBy(pt => pt.OrderNumber));

                // Assign product types
                productTypesByProduct.TryGetValue(product.Id ?? string.Empty, out var pTypes);
                product.ProductTypes = ToObs((pTypes ?? new List<ProductTypeDto>()).OrderBy(pt => pt.OrderNumber));

                // Assign assigned sizes
                assignedSizesByProduct.TryGetValue(product.Id ?? string.Empty, out var pAssignedSizes);
                var orderedAssigned = (pAssignedSizes ?? new List<AssignedSizeDto>())
                    .OrderBy(a => a.Size?.OrderNumber ?? int.MaxValue);
                product.AssignedSizes = ToObs(orderedAssigned);
            }
        }

        /// <summary>
        /// Normalizes direct products by converting collections to ObservableCollections and ordering
        /// </summary>
        private static void NormalizeDirectProducts(List<ProductDto> directProducts)
        {
            foreach (var product in directProducts)
            {
                // Normalize topping categories and their toppings
                product.ToppingCategories = ToObs(product.ToppingCategories?
                    .OrderBy(tc => tc.OrderNumber) ?? Enumerable.Empty<ToppingCategoryDto>());

                foreach (var tc in product.ToppingCategories)
                    tc.Toppings = ToObs(tc.Toppings?
                        .OrderBy(t => t.OrderNumber) ?? Enumerable.Empty<ToppingDto>());

                // Normalize other collections (these should already be set from AssignDetailsToDirectProducts)
            }
        }

        #endregion
    }
}
