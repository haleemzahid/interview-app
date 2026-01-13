using CommunityToolkit.Mvvm.Input;
using Mopups.Services;
using Newtonsoft.Json;
using OrderEntry.Dtos;
using OrderEntry.Popups;
using OrderEntry.SmartCoupon;
using Payments.Core.Exceptions;
using Payments.Core.Models;
using PennPOS.Maui.Shared.Common;
using PennPOS.Maui.Shared.Dtos.Enums;
using PennPOS.Maui.Shared.Dtos.MenuDtos;
using PennPOS.Maui.Shared.Dtos.OrderEntryDtos;
using Syncfusion.Maui.Data;
using Syncfusion.Maui.ListView;
using System.Collections.ObjectModel;
namespace OrderEntry.ViewModels.MenuServiceVMpartialClasses
{
    public partial class MenuServiceViewModel : BaseViewModel
    {
        #region Constants

        // Invoice ID display settings
        private const int INVOICE_ID_DISPLAY_LENGTH = 8;
        
        // Alert titles
        private const string ALERT_TITLE_SUCCESS = "Success";
        private const string ALERT_TITLE_ERROR = "Error";
        private const string ALERT_TITLE_WARNING = "Warning";
        private const string ALERT_TITLE_INFORMATION = "Information";
        private const string ALERT_TITLE_PAYMENT_REQUIRED = "Payment Required";
        private const string ALERT_TITLE_ORDER_COMPLETE = "Order Complete";
        private const string ALERT_TITLE_PAYMENT_FAILED = "Payment Failed";
        private const string ALERT_TITLE_PAYMENT_SUCCESSFUL = "Payment Successful";
        private const string ALERT_TITLE_PAYMENT_ERROR = "Payment Error";
        //private const string ALERT_TITLE_INCOMPLETE_ORDER = "Incomplete Order";
        //private const string ALERT_TITLE_INVALID_ITEMS = "Invalid Items";
        
        // Hold Invoice messages
        private const string MSG_HOLD_SUCCESS = "Order placed on hold successfully.\nHold ID: {0}";
        private const string MSG_HOLD_ERROR = "Failed to place order on hold. Please check your connection and try again.";
        private const string MSG_HOLD_ERROR_NO_ITEMS = "No items in the current order. Please add items before placing on hold.";
        private const string MSG_HOLD_ERROR_INCOMPLETE_ITEM = "Please complete the current item configuration before placing order on hold.";
        private const string MSG_HOLD_ERROR_INVALID_ITEMS = "One or more items have missing product information. Please review the order.";
        private const string MSG_HOLD_ERROR_CREATE_FAILED = "Failed to create invoice data from current order. Please try again.";
        
        // Load Hold Invoice messages
        private const string MSG_LOAD_SUCCESS = "Hold invoice loaded successfully. ID: {0}";
        private const string MSG_LOAD_ERROR_INVALID = "Invalid hold invoice selected.";
        private const string MSG_LOAD_ERROR_CORRUPTED = "Hold invoice data is corrupted or empty.";
        private const string MSG_LOAD_ERROR_FAILED = "Failed to load hold invoice data.";
        private const string MSG_LOAD_ERROR_NO_ITEMS = "Hold invoice contains no items.";
        private const string MSG_LOAD_ERROR_PARSE_FAILED = "Failed to parse hold invoice data: {0}";
        private const string MSG_LOAD_ERROR_EXCEPTION = "An error occurred while loading hold invoice: {0}";
        
        // Complete Invoice messages
        private const string MSG_COMPLETE_SUCCESS = "Order completed successfully.\nInvoice ID: {0}";
        private const string MSG_COMPLETE_ERROR = "Failed to complete the order. Please try again.";
        private const string MSG_COMPLETE_ERROR_EXCEPTION = "Error completing order: {0}";
        private const string MSG_PAYMENT_REQUIRED_MESSAGE = "Please ensure sufficient payment has been added before completing the order.";
        
        // Payment messages
        private const string MSG_PAYMENT_INVALID_AMOUNT = "Invalid payment amount";
        private const string MSG_PAYMENT_DECLINED = "Payment was declined";
        private const string MSG_PAYMENT_ERROR = "Payment processing error: {0}";
        private const string MSG_PAYMENT_UNEXPECTED_ERROR = "Unexpected error during payment: {0}";
        private const string MSG_PAYMENT_SAVE_WARNING = "Payment was successful but there was an issue saving the order: {0}";
        
        // Other messages
        private const string MSG_COUPON_NOT_FOUND = "Coupon not found or invalid";
        private const string MSG_PAYMENT_METHOD_NOT_IMPLEMENTED = "Payment method '{0}' is not yet implemented.";
        
        #endregion

        #region Commands

        private bool _isTabSwitching = false;
        private DateTime _lastTabSwitchTime = DateTime.MinValue;
        private const int TAB_SWITCH_DEBOUNCE_MS = 100; // Prevent rapid switching
        
        [RelayCommand]
        private async void SelectTab(string tabIndex)
        {
            int newIndex = int.Parse(tabIndex);
            
            // EDGE CASE: Prevent race conditions during rapid tab switching
            // Debounce tab switches to allow async operations (like filtering) to complete
            var timeSinceLastSwitch = (DateTime.Now - _lastTabSwitchTime).TotalMilliseconds;
            if (_isTabSwitching && timeSinceLastSwitch < TAB_SWITCH_DEBOUNCE_MS)
            {
                return; // Ignore rapid consecutive clicks
            }
            
            _isTabSwitching = true;
            _lastTabSwitchTime = DateTime.Now;
            
            try
            {
                // Auto-select logic before switching tabs
                HandleAutoSelection(newIndex);
                
                // With flexible enablement, tabs should be accessible if they're enabled
                // The XAML bindings now control enablement, so we don't block here
                SelectedTabIndex = newIndex;
                
                // Small delay to allow UI to update
                await Task.Delay(50);
            }
            finally
            {
                _isTabSwitching = false;
            }
        }
        
        /// <summary>
        /// Handles automatic selection of single options when switching tabs
        /// </summary>
        private void HandleAutoSelection(int targetTabIndex)
        {
            switch (targetTabIndex)
            {
                case 1: // Types tab
                    AutoSelectSizeIfSingle();
                    break;
                    
                case 2: // Portions tab
                    AutoSelectSizeIfSingle();
                    AutoSelectTypeIfSingle();
                    break;
                    
                case 3: // Modifier Groups tab
                    AutoSelectSizeIfSingle();
                    AutoSelectTypeIfSingle();
                    break;
                    
                case 4: // Modifiers tab
                    AutoSelectSizeIfSingle();
                    AutoSelectTypeIfSingle();
                    break;
            }
        }
        
        /// <summary>
        /// Auto-selects size if only one option is available
        /// </summary>
        private void AutoSelectSizeIfSingle()
        {
            if (!IsSizeSelected && 
                SelectedProduct?.AssignedSizes?.Count == 1)
            {
                var singleSize = SelectedProduct.AssignedSizes.First();
                // Trigger the existing AddSize command logic
                AddSizeCommand.Execute(singleSize);
            }
        }
        
        /// <summary>
        /// Auto-selects type if only one option is available
        /// </summary>
        private void AutoSelectTypeIfSingle()
        {
            if (!IsTypeSelected && 
                SelectedProduct?.ProductTypes?.Count == 1)
            {
                var singleType = SelectedProduct.ProductTypes.First();
                // Trigger the existing AddType command logic
                AddTypeCommand.Execute(singleType);
            }
        }

        [RelayCommand]
        async Task SelectMenu(MenuDto menu)
        {
            // Prevent layout cycles when dealing with large menu datasets
            if (IsMenuChanging || menu == null) return;
            
            try
            {
                // Set changing state to prevent recursive calls and signal UI to show loading/placeholder
                IsMenuChanging = true;
                
                // For very large menus, also set loading state
                var hasLargeCollections = (menu.MenuProducts?.Count ?? 0) > 50 || 
                                         (menu.MenuCategories?.Sum(c => c.Products?.Count ?? 0) ?? 0) > 100;
                
                if (hasLargeCollections)
                {
                    IsLoading = true;
                }
                
                // First, set the selected menu
                SelectedMenu = menu;
                
                // Allow UI thread to process the first property change
                await Task.Yield();
                
                // Add a small delay for large collections to prevent UI thread blocking
                if (hasLargeCollections)
                {
                    await Task.Delay(10);
                }
                
                // Then set the menu category - this prevents simultaneous large collection bindings
                SelectedMenuCategory = menu.MenuCategories?.FirstOrDefault() ?? new MenuCategoryDto();
                
                

                // Allow UI to complete the category selection processing
                if (hasLargeCollections)
                {
                    await Task.Delay(10);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"SelectMenu error: {ex.Message}");
                // Fallback to ensure state is consistent
                SelectedMenuCategory = new MenuCategoryDto();
            }
            finally
            {
                // Clear states
                IsMenuChanging = false;
                IsLoading = false;
            }
        }
        [RelayCommand]
        void SelectMenuProduct(ProductDto product)
        {
            SelectedMenuProduct = product;
        }
        [RelayCommand]
        void SelectTopping(ToppingDto topping)
        {
            try
            {

                Controller.AddModifier(SelectedToppingCategory!, topping, SelectedAffix);
                SelectedAffix = null;
                UpdateToppingCategoryState();
                
                // Don't auto-advance to next category when selecting toppings
                // This was causing unwanted tab navigation behavior
                // User can manually switch categories or tabs as needed
                
                SelectedTopping = topping;
                
                // Refresh applied modifiers display
                OnPropertyChanged(nameof(AppliedModifiers));
                OnPropertyChanged(nameof(AppliedModifierGroups));
            }
            catch (Exception ex)
            {

                throw;
            }
        }


        [RelayCommand]
        void SelectToppingCategory(ToppingCategoryDto e)
        {
            SelectedToppingCategory = e;

            // Auto-navigate to modifiers if category has toppings
            AutoNavigateToNextTab();
        }

        [RelayCommand]
        void AddPortionType(PortionTypeDto type)
        {
            SelectedPortionType = type;
            Controller.AddPortion(type);
            
            // Notify UI about modifier visibility (needed after portion selection)
            OnPropertyChanged(nameof(SelectedToppingCategory));
            OnPropertyChanged(nameof(SelectedToppings));
            OnPropertyChanged(nameof(HasToppings));
            OnPropertyChanged(nameof(ShouldShowModifiersTab));
            OnPropertyChanged(nameof(HasAnyVisibleModifierCategories));
            OnPropertyChanged(nameof(IsModifiersTabEnabled));
            
            // Auto-navigate after portion selection
            AutoNavigateToNextTab();
        }

        [RelayCommand]
        void AddType(ProductTypeDto type)
        {
            Controller.SetProductType(type);
            OnPropertyChanged(nameof(SelectedType));
            OnPropertyChanged(nameof(IsTypeSelected));
            // Notify flexible enablement properties
            OnPropertyChanged(nameof(HasValidTypeSelection));
            OnPropertyChanged(nameof(IsPortionsTabEnabled));
            OnPropertyChanged(nameof(IsModifierGroupsTabEnabled));
            OnPropertyChanged(nameof(IsModifiersTabEnabled));
            
            // Auto-navigate after type selection
            AutoNavigateToNextTab();
        }

        [RelayCommand]
        void MenuChanged(object data)
        {

            // Method intentionally left empty.
        }

        /// <summary>
        /// Rounds the calculated balance due to the nearest two decimal places.
        /// </summary>
        /// <param name="data"></param>
        [RelayCommand]
        void FixedPrice(object data)
        {
            var strData = data.ToString() + "00";
            TotalPaid = (decimal.Parse(strData) / 100m).ToString("0.00");
        }


        /// <summary>
        /// Handles the calculator button click event.
        /// </summary>
        /// <param name="param"></param>
        [RelayCommand]
        void CalculatorBtn(string param)
        {
            if (param == "C")
            {
                TotalPaid = "";
            }
            else if (param == "X")
            {
                if (TotalPaid.Length <= 0)
                    return;

                TotalPaid = TotalPaid.Remove(TotalPaid.Length - 1);
            }
            else if (param == "R")
            {
                TotalPaid = Math.Round(Controller.TotalDue, 2).ToString();
            }
            else
            {
                TotalPaid = TotalPaid + param;
            }
        }

        /// <summary>
        /// Processes cash payment and completes the order
        /// </summary>
        [RelayCommand]
        async Task CashDone()
        {
            if (string.IsNullOrWhiteSpace(TotalPaid))
            {
                await Application.Current!.Windows[0].Page!.DisplayAlertAsync("Information", "Please enter payment amount!", "OK");
                return;
            }

            var totalPaid = Convert.ToDecimal(TotalPaid);
            if (totalPaid <= 0)
            {
                await Application.Current!.Windows[0].Page!.DisplayAlertAsync("Information", "Please enter a valid amount!", "OK");
                TotalPaid = string.Empty;
                return;
            }

            decimal due = Decimal.Round(Controller.TotalDue, 2, MidpointRounding.AwayFromZero);
            var changeAmount = totalPaid - due;

            // Check if payment is insufficient
            if (changeAmount < 0)
            {
                await Application.Current!.Windows[0].Page!.DisplayAlertAsync("Payment Insufficient", 
                    $"Insufficient payment. Amount due: ${Math.Abs(changeAmount):0.00}", "OK");
                TotalPaid = string.Empty;
                return;
            }

            // Add cash tender to the controller
            var cashTender = new InvoiceTenderDto
            {
                PaymentMethodName = "Cash",
                TenderAmount = totalPaid,
                ChangeAmount =changeAmount
            };
            Controller.AddTender(cashTender);
            // Complete and save the order
            if (await CompleteAndSaveOrder(cashTender))
            {
                // Show change if overpaid
                if (changeAmount > 0)
                {
                    var changePopupVm = (ChangeAmountPopupViewModel)popupLocator.ChangeAmountPopupView.BindingContext;
                    changePopupVm.ChangeAmount = "Change $" + changeAmount.ToString("0.00");
                    await popupservice.ShowPopup(Enum.PopupType.ChangeAmountPopup);
                }
            }
            
        }

        [RelayCommand]
        async Task ApplyCoupon()
        {
            if(string.IsNullOrWhiteSpace(CouponCode))
                return;
            var appliedCoupon= SmarCouponManager.ApplyCoupon(Controller, SmartCoupons,CouponCode);
            if (appliedCoupon != null)
            {
                AppliedCoupon = appliedCoupon;
                CouponCode = string.Empty;
            }
            else
                await ShowErrorAlert(MSG_COUPON_NOT_FOUND);
        }

        [RelayCommand]
        async Task ShowSmartCouponPopup()
        {
            var smartCouponPopupViewModel = (SmartCouponsPopupViewModel)popupLocator.SmartCouponsPopupView.BindingContext;
            smartCouponPopupViewModel.MenuServiceViewModel = this;
            smartCouponPopupViewModel.SmartCoupons=new ObservableCollection<SharedDtos.SmartCouponDto.SmartCouponDto>(SmartCoupons);
            await MopupService.Instance.PushAsync(popupLocator.SmartCouponsPopupView);
        }

        [RelayCommand]
        async Task UsePaymentMethod(SharedDtos.PaymentMethodDto paymentMethod)
        {
            switch (paymentMethod.Name)
            {
                case "Cash":
                    await CashDoneCommand.ExecuteAsync(null);
                    break;
                    
                case "Credit Card":
                    ShowCardSwipeOverlay = true;
                    await Task.Delay(500);
                    await ProcessCardPaymentAsync();
                    ShowCardSwipeOverlay = false;
                    break;
                    
                default:
                    await ShowAlert(ALERT_TITLE_INFORMATION, string.Format(MSG_PAYMENT_METHOD_NOT_IMPLEMENTED, paymentMethod.Name));
                    break;
            }
        }

        /// <summary>
        /// Process card payment using the TriPOS payment service
        /// </summary>
        private async Task ProcessCardPaymentAsync()
        {
            try
            {
                decimal totalDue = Math.Round(Controller.TotalDue, 2, MidpointRounding.AwayFromZero);

                if (totalDue <= 0)
                {
                    await ShowErrorAlert(MSG_PAYMENT_INVALID_AMOUNT);
                    return;
                }

                var orderId = Guid.NewGuid().ToString();
                var paymentRequest = new PaymentRequest
                {
                    Amount = totalDue,
                    OrderId = orderId,
                    RegisterId = 1,
                    ClerkInfo = "",
                    AllowPartialApprovals = false,
                    ReferenceNumber = orderId
                };
                PaymentResult result=new();
#if DEBUG==false
                // Process payment using the injected payment service
                 result = await paymentService.ProcessPaymentAsync("Tripos", paymentRequest);
#else
       result.IsSuccessful=true;
#endif

                if (result.IsSuccessful)
                {
                    // Payment successful - add tender and complete order
                    await HandleSuccessfulPayment(result, orderId);
                }
                else
                {
                    // Payment failed - show error message
                    await ShowAlert(ALERT_TITLE_PAYMENT_FAILED,
                        string.IsNullOrEmpty(result.ErrorMessage) ? MSG_PAYMENT_DECLINED : result.ErrorMessage);
                }
            }
            catch (PaymentException ex)
            {
                await ShowAlert(ALERT_TITLE_PAYMENT_ERROR, string.Format(MSG_PAYMENT_ERROR, ex.Message));
            }
            catch (Exception ex)
            {
                await ShowErrorAlert(string.Format(MSG_PAYMENT_UNEXPECTED_ERROR, ex.Message));
            }
        }

        /// <summary>
        /// Handle successful payment processing and save invoice
        /// </summary>
        private async Task HandleSuccessfulPayment(PaymentResult result, string orderId)
        {
            try
            {
#if DEBUG==false
                // Save transaction to database for receipt/reporting
                await paymentService.SaveTransactionAsync(result, orderId);
#endif

                // Add card tender to controller
                var cardTender = new InvoiceTenderDto
                {
                    PaymentMethodName = "Credit Card",
                    TenderAmount = result.ApprovedAmount
                };
                Controller.AddTender(cardTender);
                string message = string.Empty;  
                // Complete and save the order
                if (await CompleteAndSaveOrder(cardTender))
                // Show success message with transaction details
                 message = $"Payment Approved!\n" +
                             $"Amount: ${result.ApprovedAmount:F2}\n" +
                             $"Card: {result.MaskedCardNumber}\n" +
                             $"Approval: {result.ApprovalCode}\n" +
                             $"Transaction ID: {result.TransactionId}";

                await ShowAlert(ALERT_TITLE_PAYMENT_SUCCESSFUL, message);
            }
            catch (Exception ex)
            {
                // Even if saving fails, the payment was successful, so we should still complete the order
                await ShowAlert(ALERT_TITLE_WARNING, string.Format(MSG_PAYMENT_SAVE_WARNING, ex.Message));
                
                // Still reset UI to allow new order
                ResetUIAfterOrder();
            }
        }
        private async Task<bool> CompleteAndSaveOrder(InvoiceTenderDto tender)
        {
            try
            {
                if (Controller.Items?.Count == 0)
                {
                    ResetUIAfterOrder();
                    return await Task.FromResult(false);
                }

                if (!Controller.CanFinalize())
                {
                    await ShowAlert(ALERT_TITLE_PAYMENT_REQUIRED, MSG_PAYMENT_REQUIRED_MESSAGE);
                    return await Task.FromResult(false);
                }

                // Create and save completed invoice
                var invoiceViewModel = CreateInvoiceViewModelFromController(isNewHoldInvoice: true);
                invoiceViewModel.IsHold = false;

                // Map to InvoiceForUIDto and use OrderEntryService
                var invoiceDto = mapper.Map<InvoiceForUIDto>(invoiceViewModel);
                var result = await orderEntryService.CompleteInvoiceAsync(invoiceDto);
                
                if (result.Success)
                {
                    ResetUIAfterOrder();
                    await ShowAlert(ALERT_TITLE_ORDER_COMPLETE, string.Format(MSG_COMPLETE_SUCCESS, FormatInvoiceId(result.Data)));
                    return await Task.FromResult(true);
                }
                else
                {
                    await ShowErrorAlert($"{MSG_COMPLETE_ERROR}\n{result.ErrorMessage}");
                    Controller.InvoiceTenders.Clear();
                    return await Task.FromResult(false);
                }
            }
            catch (Exception ex)
            {
                await ShowErrorAlert(string.Format(MSG_COMPLETE_ERROR_EXCEPTION, ex.Message));
                Controller.InvoiceTenders.Clear();
                return await Task.FromResult(false);
            }
        }

        private CompleteInvoiceDto CreateCompleteInvoiceDtoFromViewModel(InvoiceViewModel invoice)
        {
            return new CompleteInvoiceDto
            {
                Id = invoice.Id,
                CustomerName = invoice.SelectedCustomer?.Name,
                CustomerId = invoice.SelectedCustomer?.Id,
                IsTaxExempted = invoice.IsTaxExempted,
                IsMakeToGo = invoice.IsMakeToGo,
                TotalInvoiceItems = invoice.TotalInvoiceItems,
                SubTotal = invoice.SubTotal,
                TotalTax = invoice.TotalTax,
                TotalDiscount = invoice.TotalDiscount,
                TotalItemDiscount = invoice.TotalItemDiscount,
                TotalInvoiceDiscount = invoice.TotalInvoiceDiscount,
                GrandTotalDiscount = invoice.GrandTotalDiscount,
                GrandTotal = invoice.GrandTotal,
                TotalDue = invoice.TotalDue,
                InvoiceItems = mapper.Map<List<CreateInvoiceItemDto>>(invoice.InvoiceItems),
                InvoiceTenders = mapper.Map<List<CreateInvoiceTenderDto>>(invoice.InvoiceTenders)
            };
        }

        private void ResetUIAfterOrder()
        {
            OnNavigated();
            ViewsVisible = Views.Product | Views.InvoiceMenu;
            Controller.CancelOrder();
            ResetActionButtons();
            CanChangeDiningOption = false;
            SelectedProduct = default;
            TotalPaid = string.Empty;
        }

        /// <summary>
        /// Navigates to the discount menu.
        /// </summary>
        /// <returns></returns>
        [RelayCommand]
        void Discount()
        {
            if (!ViewsVisible.HasFlag(Views.Discount))
            {
                OnNavigated();
            }
            ViewsVisible = Views.Discount | Views.InvoiceMenu;

        }

        /// <summary>
        /// Handles navigation when  discount Done button clicks.
        /// </summary>
        /// <returns></returns>
        [RelayCommand]
        void DiscountDone()
        {
            Back();
        }

        /// <summary>
        /// Clears the discount applied to the whole invoice items.
        /// </summary>
        /// <returns></returns>
        [RelayCommand]
        void ClearInvoiceDiscount()
        {
            Controller.ApplyInvoiceDiscount(null);
        }

        /// <summary>
        /// Clears the discount applied to the selected invoice items.
        /// </summary>
        /// <returns></returns>
        [RelayCommand]
        void ClearItemDiscount()
        {
            Controller.RemoveItemDiscount();
        }

        /// <summary>
        /// Handles Pay button click event.
        /// </summary>
        /// <param name="data"></param>
        [RelayCommand]
        async Task Pay(object data)
        {
            if (!(await CanNavigate()))
                return;
            if (Controller.GrandTotal <= 0)
                return;
            OnNavigated();

            ViewsVisible = Views.PaymentMenu | Views.Cart;
        }

        /// <summary>
        /// Handles the Back button click event.
        /// </summary>
        [RelayCommand]
        async Task Back()
        {
            try
            {
                if (!(await CanNavigate()))
                    return;
                    
                if (CanShowHoldInvoices)
                {
                    CanShowHoldInvoices = !CanShowHoldInvoices;
                    await LoadOrderEntryActionsAsync();
                    return;
                }
                
                if (NavStack.Count == 0)
                    return;
                    
                var state = NavStack.Pop();
                ViewsVisible = state;
            }
            catch (Exception ex)
            {
                await Application.Current!.Windows[0].Page!.DisplayAlertAsync(
                    "Error", 
                    $"An error occurred during navigation: {ex.Message}", 
                    "OK");
            }
        }


       

        /// <summary>
        /// Checks if the current product only has sizes and no other modifier types
        /// </summary>
        /// <returns>True if product only has sizes, false otherwise</returns>
        private bool IsSizeOnlyProduct()
        {
            if (SelectedProduct == null) return false;
            
            var hasTypes = SelectedProduct.ProductTypes?.Count > 0;
            var hasPortions = SelectedProduct.PortionTypes?.Count > 0;
            var hasModifiers = SelectedProduct.ToppingCategories?.Count > 0;
            
            // Returns true only if there are NO other modifier types
            return !hasTypes && !hasPortions && !hasModifiers;
        }

        /// <summary>
        /// Checks if the current item can be navigated to the next screen.
        /// </summary>
        /// <returns></returns>
        private async Task<bool> CanNavigate()
        {
            if (ViewsVisible.HasFlag(Views.Discount))
                return true;


            if (SelectedProduct == null)
                return true;

            return await IsItemComplete();
        }
        public async Task<bool> IsItemComplete()
        {
            if (Controller.CurrentReceiptItem == null)
                return true;
            if (!(await IsSizeSelected()))
                return false;
            if (!(await IsAllMandatoryModifierSelected()))
                return false;

            return true;

            async Task<bool> IsSizeSelected()
            {
                if (ProductSizes!.Count > 0 && Controller.CurrentReceiptItem!.Size == null)
                {
                    var informationPopupViewModel= (InformationPopupViewModel)popupLocator.InformationPopupView.BindingContext;
                    informationPopupViewModel.Message = "Requirements does not meet";
                    informationPopupViewModel.ResoneMessage = "Reason: Size is mandatory";
                    await popupservice.ShowPopup(Enum.PopupType.Info);
                    return false;
                }
                return true;
            }

            async Task<bool> IsAllMandatoryModifierSelected()
            {
                var modifierGroups = Controller.CurrentReceiptItem!.Portions.SelectMany(x => x.ModifierGroups)
                .Concat(Controller.CurrentReceiptItem.ModifierGroups)
                .ToList();
                
                // EDGE CASE: If no modifier categories exist (or all filtered out), no mandatory check needed
                if (SelectedToppingCategories == null || SelectedToppingCategories.Count == 0)
                    return true;
                
                // EDGE CASE: Check only VISIBLE categories (after filtering) for mandatory requirements
                var visibleMandatoryToppings = SelectedToppingCategories
                    .Where(x => x.IsMandatory && x.Toppings?.Any() == true);
                    
                if (!visibleMandatoryToppings.Any())
                    return true;

                // Check if all VISIBLE mandatory categories have selections
                var missingTopping = visibleMandatoryToppings.FirstOrDefault(x =>
                    !modifierGroups.Any(y => y.Category == x));

                if (missingTopping != null)
                {
                    var informationPopupViewModel = (InformationPopupViewModel)popupLocator.InformationPopupView.BindingContext;
                    informationPopupViewModel.Message = "Requirements does not meet";
                    informationPopupViewModel.ResoneMessage = $"Reason: {missingTopping.Name} is mandatory for the selected product";
                    await popupservice.ShowPopup(Enum.PopupType.Info);
                    return false;
                }

                return true;
            }
        }

        /// <summary>
        /// Handles the Done button click event.
        /// </summary>
        [RelayCommand]
        async Task Done()
        {
            if (!(await CanNavigate()))
                return;

            Back();
        }
        /// <summary>
        /// Auto-navigates to the next available tab after user selection.
        /// Fixed: No longer calls Back() when on the last available tab - 
        /// user stays on current tab and can manually complete using Done button.
        /// </summary>
        private void AutoNavigateToNextTab()
        {
            switch (SelectedTabIndex)
            {
             
                case 0: // Sizes - single selection, auto-navigate
                    if (IsSizeSelected && HasProductTypes)
                        SelectedTabIndex = 1;
                    else if (IsSizeSelected && HasPortions)
                        SelectedTabIndex = 2;
                    else if (IsSizeSelected && HasAnyVisibleModifierCategories) // Check for VISIBLE modifiers
                    {
                        // If only one topping category, auto-select it and go to modifiers
                        if (SelectedToppingCategories?.Count == 1)
                        {
                            SelectedToppingCategory = SelectedToppingCategories.First();
                            SelectedTabIndex = 4; // Skip to modifiers
                        }
                        else if (SelectedToppingCategories?.Count > 1)
                        {
                            SelectedTabIndex = 3; // Go to modifier groups
                        }
                    }
                    // If this is the only available tab, remain on the Sizes tab after auto-navigation completes.
                    // User can manually complete when ready
                    break;
                    
                case 1: // Types - single selection, auto-navigate
                    if (IsTypeSelected && HasPortions)
                        SelectedTabIndex = 2;
                    else if (IsTypeSelected && HasAnyVisibleModifierCategories) // Check for VISIBLE modifiers
                    {
                        // If only one topping category, auto-select it and go to modifiers
                        if (SelectedToppingCategories?.Count == 1)
                        {
                            SelectedToppingCategory = SelectedToppingCategories.First();
                            SelectedTabIndex = 4; // Skip to modifiers
                        }
                        else if (SelectedToppingCategories?.Count > 1)
                        {
                            SelectedTabIndex = 3; // Go to modifier groups
                        }
                    }
                    // If this is the last available tab, stay on it instead of calling Back()
                    // User can manually complete when ready
                    break;

                case 2: // Portions - auto-navigate to next available tab
                    if (HasAnyVisibleModifierCategories) // Check for VISIBLE modifiers
                    {
                        // If only one topping category, auto-select it and go to modifiers
                        if (SelectedToppingCategories?.Count == 1)
                        {
                            SelectedToppingCategory = SelectedToppingCategories.First();
                            SelectedTabIndex = 4; // Skip to modifiers
                        }
                        else if (SelectedToppingCategories?.Count > 1)
                        {
                            SelectedTabIndex = 3; // Go to modifier groups
                        }
                    }
                    // If this is the last available tab, stay on it instead of calling Back()
                    // User can manually complete when ready using the Done button
                    break;

                case 3: // Modifier Groups - single selection, auto-navigate
                    if (SelectedToppingCategory != null && HasToppings)
                        SelectedTabIndex = 4;
                    // If no toppings available, stay on modifier groups tab
                    break;

                case 4: // Modifiers - multiple selection, don't auto-navigate
                        // User manually navigates or finishes
                    break;
            }
        }
        
        /// <summary>
        /// Add SizeDto to CurrentItem And Current Item Dto object 
        /// </summary>
        /// <param name="size"></param>
        [RelayCommand]
        public virtual async Task AddSize(AssignedSizeDto size)
        {
            // Detect if this is a size change (not first selection)
            bool isSizeChange = HasSizeChanged(size?.Id);
            
            Controller.SetSize(size);
            
            // Track state before filtering
            var hadModifierCategories = SelectedToppingCategories?.Count > 0;
            var previouslySelectedCategory = SelectedToppingCategory;
            
            // CRITICAL FIX: Always restore and reload on size change, even if current list is empty
            // This fixes the issue where switching from "no modifiers" size back to "has modifiers" size
            // wouldn't restore the categories because the count was 0
            if (isSizeChange && SelectedProduct != null)
            {
                RestoreOriginalToppingCollections();
                
                // Reload SelectedToppingCategories from the product after restoration
                // This ensures we're working with ALL categories, not just the previously filtered subset
                // Don't filter by Toppings.Count here - let the filtering happen first, then remove empties
                var categories = SelectedProduct.ToppingCategories
                    .OrderByDescending(x => x.IsMandatory)
                    .ThenBy(x => x.OrderNumber)
                    .ToList();
                SelectedToppingCategories = categories;
            }
            
            // Filter topping categories based on selected size (only if we have categories)
            if(SelectedToppingCategories != null && SelectedToppingCategories.Count > 0)
            {
                // Create list of filtering tasks and await them ALL before updating UI
                var filteringTasks = new List<Task>();
                foreach (var category in SelectedToppingCategories)
                {
                    filteringTasks.Add(FilterToppingCategoriesBySizeAsync(category));
                }
                
                // Wait for ALL filtering to complete before proceeding
                await Task.WhenAll(filteringTasks);
                
                // OPTION B: Remove applied modifiers that belong to filtered-out categories
                // This happens when user changes size after adding modifiers
                if (isSizeChange && Controller.CurrentReceiptItem != null)
                {
                    RemoveInvalidModifiersAfterSizeChange(SelectedToppingCategories);
                }
                
                // Update enable states after filtering
                UpdateToppingCategoryState();
                
                // Remove categories with no visible toppings (hide empty categories)
                var categoriesWithToppings = SelectedToppingCategories
                    .Where(c => c.Toppings?.Any() == true)
                    .ToList();
                
                if (categoriesWithToppings.Count != SelectedToppingCategories.Count)
                {
                    SelectedToppingCategories = categoriesWithToppings;
                    
                    // If current selected category was removed, select first available
                    if (SelectedToppingCategory == null || !categoriesWithToppings.Contains(SelectedToppingCategory))
                    {
                        SelectedToppingCategory = categoriesWithToppings.FirstOrDefault();
                    }
                }
                else if (isSizeChange)
                {
                    // Even if count is same, ensure we have a selected category after size change
                    if (SelectedToppingCategory == null || !categoriesWithToppings.Contains(SelectedToppingCategory))
                    {
                        SelectedToppingCategory = categoriesWithToppings.FirstOrDefault();
                    }
                }
                
                // Always update UI properties after filtering to ensure tabs refresh correctly
                OnPropertyChanged(nameof(SelectedToppingCategories));
                OnPropertyChanged(nameof(SelectedToppingCategory));
                OnPropertyChanged(nameof(SelectedToppings));
                OnPropertyChanged(nameof(ShouldShowModifierGroupsTab));
                OnPropertyChanged(nameof(HasAnyVisibleModifierCategories));
                OnPropertyChanged(nameof(HasAnyModifierCategories));
                OnPropertyChanged(nameof(ShouldShowModifiersTab));
                OnPropertyChanged(nameof(HasToppings));
                
                // EDGE CASE: All modifiers filtered out by size
                if (hadModifierCategories && !HasAnyVisibleModifierCategories)
                {
                    // If user was on modifier tabs (3 or 4), navigate to previous available tab
                    if (SelectedTabIndex >= 3)
                    {
                        HandleAllModifiersFilteredOut();
                    }
                }
            }
            
            // Notify size selection properties AFTER filtering completes
            OnPropertyChanged(nameof(IsSizeSelected));
            OnPropertyChanged(nameof(IsTypeSelected));
            OnPropertyChanged(nameof(SelectedSize));
            // Notify flexible enablement properties
            OnPropertyChanged(nameof(HasValidSizeSelection));
            OnPropertyChanged(nameof(IsTypesTabEnabled));
            OnPropertyChanged(nameof(IsPortionsTabEnabled));
            OnPropertyChanged(nameof(IsModifierGroupsTabEnabled));
            OnPropertyChanged(nameof(IsModifiersTabEnabled));
    
            // Check if size is the only modifier type for this product
            if (IsSizeOnlyProduct())
            {
                // Navigate back to Product view immediately since there are no other modifiers
                ViewsVisible = Views.Product | Views.InvoiceMenu;
            }
            else
            {
                // Continue with normal tab navigation to next modifier type
                AutoNavigateToNextTab();
            }
        }

        [RelayCommand]
        async Task Repeat()
        {
            List<ItemViewModel> selectedInvoiceItemMappedList = new();
            if (Controller.SelectedItems?.Count == 0)
                return;
            if ((await IsItemComplete()))
                Controller.RepeatProduct();
            return;
        }



        /// <summary>
        /// Handle Special Request button click event.
        /// </summary>
        [RelayCommand]
        async Task SpecialRequest()
        {
            if (!Controller.CurrentReceiptItem!.AllowedSpecialRequest)
            {
                var informationPopupViewModel = (InformationPopupViewModel)popupLocator.InformationPopupView.BindingContext;
                informationPopupViewModel.Message = "Requirements does not meet";
                informationPopupViewModel.ResoneMessage = $"Reason: Special request is not allowed for the current item";
                await popupservice.ShowPopup(Enum.PopupType.Info);
                return;
            }

            await popupservice.ShowPopup(Enum.PopupType.SpecialRequest);
        }

        /// <summary>
        /// Adds a product to the current invoice.
        /// </summary>
        /// <param name="product"></param>
        /// <returns></returns>
        [RelayCommand]
        public async Task AddProduct(ProductDto product)
        {
            if (product != null)
            {
                Controller.AddProduct(product);
                if (SelectedServiceMethod != null)
                    Controller.CurrentReceiptItem!.TaxRate = (float)await GetTaxRate(product);
                ResetActionButtons();
                CanShowHoldInvoices = false;
                
                // Check if it's the same product BEFORE setting SelectedProduct
                bool isSameProduct = SelectedProduct == product;
                
                // Check if we need to restore the product's topping collections before proceeding
                // This happens when the same product is being re-added and its collections were previously filtered
                bool needsRestoration = isSameProduct && _originalToppingCollections.Count > 0;
                
                // CRITICAL: If re-adding same product with stored collections, restore the product's Toppings first
                // This ensures ShowCategories() reads from unfiltered data
                if (needsRestoration)
                {
                    RestoreOriginalToppingCollections();
                }
                
                // CRITICAL: Always clear stored collections and reset size tracking when adding a product
                // This ensures fresh state for the new addition cycle
                _originalToppingCollections.Clear();
                _lastSelectedSizeId = string.Empty;
                
                SelectedProduct = product;

                if (isSameProduct)
                {
                    OnPropertyChanged(nameof(SelectedProductTypes));
                    OnPropertyChanged(nameof(SelectedToppingCategories));
                    OnPropertyChanged(nameof(IsSizeSelected));
                    OnPropertyChanged(nameof(IsTypeSelected));
                    OnPropertyChanged(nameof(PortionTypes));
                    OnPropertyChanged(nameof(SelectedTopping));
                    OnPropertyChanged(nameof(SelectedToppings));

                    // Reset tab index to initial state when re-adding the same product
                    ResetTabIndexForProduct(product);
                }
                CanChangeDiningOption = true;
                ShowCategories();
                // Notify UI about modifier groups tab visibility and new helper properties
                OnPropertyChanged(nameof(ShouldShowModifierGroupsTab));
                OnPropertyChanged(nameof(HasAnyVisibleModifierCategories));
                OnPropertyChanged(nameof(HasAnyModifierCategories));
                OnPropertyChanged(nameof(ShouldShowModifiersTab));
                OnPropertyChanged(nameof(IsModifierOnlyProduct));
                
                // Adjust tab selection after categories are loaded
                AdjustTabSelectionAfterCategoriesLoaded();
                
                var sizes = SelectedProduct?.AssignedSizes
                    .Where(x => x.IsAssigned);
                    
                // EDGE CASE: Check for modifier-only products (no size/type/portions required)
                bool hasModifiers = SelectedProduct?.ToppingCategories.Count > 0;
                bool hasAnyConfigurableOptions = sizes!.Count() > 0 || 
                    hasModifiers || 
                    SelectedProduct?.PortionTypes.Count > 0 ||
                    SelectedProduct?.ProductTypes.Count > 0;
                    
                if (hasAnyConfigurableOptions)
                {
                    OnNavigated();
                    ViewsVisible = Views.AddProduct | Views.InvoiceMenu;
                }
                else if (!hasAnyConfigurableOptions)
                {
                    // Product has no configurable options - it can be added directly to invoice
                    // This is a simple product with no modifiers
                    ViewsVisible = Views.Product | Views.InvoiceMenu;
                }
            }

            
        }
        
        /// <summary>
        /// Resets the tab index to the initial appropriate tab based on product configuration.
        /// This ensures consistent navigation when re-adding the same product.
        /// EDGE CASE: Handles modifier-only products correctly
        /// </summary>
        private void ResetTabIndexForProduct(ProductDto product)
        {
            // Reset size tracking when product changes/resets
            _lastSelectedSizeId = string.Empty;
            
            if (product?.AssignedSizes?.Count > 0)
                SelectedTabIndex = 0; // Sizes
            else if (product?.ProductTypes?.Count > 0)
                SelectedTabIndex = 1; // Types
            else if (product?.PortionTypes?.Count > 0)
                SelectedTabIndex = 2; // Portions
            else if (product?.ToppingCategories?.Count > 0)
            {
                // EDGE CASE: Modifier-only product - will be adjusted after ShowCategories
                SelectedTabIndex = 3; // Modifier groups (temporary)
            }
        }
        
        /// <summary>
        /// Adjusts tab selection after topping categories are loaded by ShowCategories().
        /// Handles special cases like single modifier groups and ensures the correct tab is selected.
        /// </summary>
        private void AdjustTabSelectionAfterCategoriesLoaded()
        {
            // If there's only one topping category and no other modifier types, skip to modifiers tab
            if (SelectedToppingCategories?.Count == 1)
            {
                var hasSizes = SelectedProduct?.AssignedSizes?.Count > 0;
                var hasTypes = SelectedProduct?.ProductTypes?.Count > 0;
                var hasPortions = SelectedProduct?.PortionTypes?.Count > 0;
                
                // Auto-select the single category
                SelectedToppingCategory = SelectedToppingCategories.First();
                
                // SCENARIO FIX: If portions exist, DO NOT skip to modifiers - user must select portion first
                if (hasPortions)
                {
                    // Stay on current tab (should be portions tab from ResetTabIndexForProduct)
                    // User needs to select portion before moving to modifiers
                    return;
                }
                
                // If modifiers is the ONLY modifier type available, select tab 4
                if (!hasSizes && !hasTypes && !hasPortions)
                {
                    SelectedTabIndex = 4; // Skip directly to modifiers
                }
                // If other modifier types exist and are already selected, also skip to modifiers
                else if (IsSizeSelected && IsTypeSelected)
                {
                    SelectedTabIndex = 4; // Skip to modifiers
                }
                // Otherwise, stay on current tab (user needs to complete sizes/types first)
            }
            // If multiple modifier groups exist and current tab is 3, that's correct
            // If no modifier groups, the tab selection from ResetTabIndexForProduct is correct
        }

        private void ShowCategories()
        {
            if (SelectedProduct == null)
            {
                return;
            }
            
            // Store original topping collections before any filtering
            StoreOriginalToppingCollections();
            
            var categories = SelectedProduct!.ToppingCategories
                            .Where(x => x.Toppings?.Count > 0)
                               .OrderByDescending(x => x.IsMandatory)
                              .ThenBy(x => x.OrderNumber)
                              .ToList();
            
            SelectedToppingCategories = categories;
            UpdateToppingCategoryState();
            if (SelectedToppingCategories.Count > 0)
            {
                SelectedToppingCategory = SelectedToppingCategories.First();
            }
            else
            {
                SelectedToppingCategory = new ToppingCategoryDto();
            }
            OnPropertyChanged(nameof(SelectedToppings));

        }
        [RelayCommand]
        void SelectCategory(MenuCategoryDto category)
        {
            SelectedMenuCategory = category;
        }

        /// <summary>
        /// Increases the quantity of the selected invoice items.
        /// </summary>
        [RelayCommand]
        public virtual void IncreaseSize()
        {
            Controller.IncreaseQuantity();
           
        }

        /// <summary>
        /// Decreases the quantity of the selected invoice items.
        /// </summary>
        [RelayCommand]
        public virtual void DecreaseSize()
        {
            Controller.DecreaseQuantity();
        }

        /// <summary>
        /// Handles the discount list item changed event and applies the selected discount
        /// to the invoice items base on the discount type.
        /// </summary>
        /// <param name="discount"></param>
        [RelayCommand]
        public void DiscountChanged(SharedDtos.InvoiceDiscountDto discount)
        {
            ApplyDiscount(discount);
        }

        /// <summary>
        /// Handles the Tax Exempt button click event.
        /// </summary>
        [RelayCommand]
        void TaxExemptClicked()
        {
            //foreach (var item in InvoiceViewModel.InvoiceItems)
            //{
            //    item.IsTaxExempted = true;
            //    item.UpdateProperties();
            //}
            //InvoiceViewModel.IsTaxExempted = true;
            //InvoiceViewModel.UpdateTotals();
        }

        /// <summary>
        /// Handles the Tax Free button click event.
        /// </summary>
        [RelayCommand]
        void TaxFreeItemClicked()
        {
            
        }

        /// <summary>
        /// Duplicates the whole Invoce itmes by the specified number of times.
        /// </summary>
        [RelayCommand]
        async Task DublicatTicketClicked()
        {
            if (Controller.Items.Count == 0)
                return;
            await popupservice.ShowPopup(Enum.PopupType.DuplicateTicket);
        }

        /// <summary>
        /// Duplicates the selected invoice items by the specified number of times.
        /// </summary>
        [RelayCommand]
        void DublicatItemClicked()
        {
            Controller.RepeatProduct();

        }

        [RelayCommand]
        async void CancelOrderClicked()
        {
            if (Controller.Items?.Count == 0)
                return;
            var vm = (CancelOrderPopupViewModel)popupLocator.CancelOrderPopupView.BindingContext;
            vm.IsRTL = IsRTL;
            await popupservice.ShowPopup(Enum.PopupType.CancelOrderConfirmation);
        }

        [RelayCommand]
        void MakeToGoClicked()
        {
            SwapDingingOption_MakeToGoLabels();
        }

        [RelayCommand]
        void DiningOptionClicked()
        {
            SwapDingingOption_MakeToGoLabels();
        }

        [RelayCommand]
        void RemoveInvoiceItem()
        {
            Controller.RemoveProduct();
            CanChangeDiningOption = (Controller.Items.Count > 0);
            ResetActionButtons();
            IsInvoiceItemSelected = false;
            ViewsVisible = Views.Product | Views.InvoiceMenu;
            
            // Clear stored topping collections to ensure fresh state when product is added again
            _originalToppingCollections.Clear();
            
            SelectedProduct = default;
        }

        [RelayCommand]
        void InvoiceItemSelectionChanged(ItemSelectionChangedEventArgs e)
        {

           
        }
        [RelayCommand]
        void ModifierDoubleTapped()
        {
            Back();
        }

        [RelayCommand]
        async Task InvoiceDiscountItemTapped(SharedDtos.InvoiceDiscountDto discount)
        {
            await Back();
            await Task.Delay(50);
            ApplyDiscount(discount, true);

        }

        [RelayCommand]
        async Task HoldInvoice()
        {
            try
            {
                // Step 1: Validate order before holding
                var (isValid, errorMessage) = await ValidateOrderForHold();
                if (!isValid)
                {
                    await ShowErrorAlert(errorMessage);
                    return;
                }

                // Step 2: Create invoice view model from current controller state
                var invoiceViewModel = CreateInvoiceViewModelFromController(isNewHoldInvoice: true);
                
                // Step 3: Validate the created invoice view model
                var (isInvoiceValid, invoiceError) = ValidateInvoiceViewModel(invoiceViewModel);
                if (!isInvoiceValid)
                {
                    await ShowErrorAlert(invoiceError);
                    return;
                }
                
                invoiceViewModel.IsHold = true;

                // Step 4: Save or update hold invoice
                var result = await SaveOrUpdateHoldInvoiceAsync(invoiceViewModel);
                
                // Step 5: Handle result and update UI
                await HandleHoldInvoiceResult(result);
            }
            catch (Exception ex)
            {
                await ShowErrorAlert($"Error placing order on hold: {ex.Message}");
            }
        }

        private CreateHoldInvoiceDto CreateHoldInvoiceDtoFromViewModel(InvoiceViewModel invoice)
        {
            if (mapper == null)
                throw new InvalidOperationException("AutoMapper instance is null. Cannot map invoice items.");
            
            if (invoice?.InvoiceItems == null)
                throw new ArgumentException("Invoice or InvoiceItems collection is null", nameof(invoice));

            var invoiceAsJson = JsonConvert.SerializeObject(invoice);
            var mappedItems = mapper.Map<List<CreateInvoiceItemDto>>(invoice.InvoiceItems.ToList());

            return new CreateHoldInvoiceDto
            {
                CustomerName = invoice.SelectedCustomer?.Name,
                CustomerId = invoice.SelectedCustomer?.Id,
                IsTaxExempted = invoice.IsTaxExempted,
                IsMakeToGo = invoice.IsMakeToGo,
                TotalInvoiceItems = invoice.TotalInvoiceItems,
                SubTotal = invoice.SubTotal,
                TotalTax = invoice.TotalTax,
                TotalDiscount = invoice.TotalDiscount,
                TotalItemDiscount = invoice.TotalItemDiscount,
                TotalInvoiceDiscount = invoice.TotalInvoiceDiscount,
                GrandTotalDiscount = invoice.GrandTotalDiscount,
                GrandTotal = invoice.GrandTotal,
                TotalDue = invoice.TotalDue,
                InvoiceAsJsonString = invoiceAsJson,
                InvoiceItems = mappedItems
            };
        }

        private UpdateHoldInvoiceDto CreateUpdateHoldInvoiceDtoFromViewModel(InvoiceViewModel invoice)
        {
            if (mapper == null)
                throw new InvalidOperationException("AutoMapper instance is null. Cannot map invoice items.");
            
            if (invoice?.InvoiceItems == null)
                throw new ArgumentException("Invoice or InvoiceItems collection is null", nameof(invoice));

            var invoiceAsJson = JsonConvert.SerializeObject(invoice);
            var mappedItems = mapper.Map<List<CreateInvoiceItemDto>>(invoice.InvoiceItems.ToList());

            return new UpdateHoldInvoiceDto
            {
                Id = invoice.Id ?? string.Empty,
                CustomerName = invoice.SelectedCustomer?.Name,
                CustomerId = invoice.SelectedCustomer?.Id,
                IsTaxExempted = invoice.IsTaxExempted,
                IsMakeToGo = invoice.IsMakeToGo,
                TotalInvoiceItems = invoice.TotalInvoiceItems,
                SubTotal = invoice.SubTotal,
                TotalTax = invoice.TotalTax,
                TotalDiscount = invoice.TotalDiscount,
                TotalItemDiscount = invoice.TotalItemDiscount,
                TotalInvoiceDiscount = invoice.TotalInvoiceDiscount,
                GrandTotalDiscount = invoice.GrandTotalDiscount,
                GrandTotal = invoice.GrandTotal,
                TotalDue = invoice.TotalDue,
                InvoiceAsJsonString = invoiceAsJson,
                InvoiceItems = mappedItems
            };
        }


        private string SerializeModifiers(ObservableCollection<Components.Reciept.Model.ReceiptItemModifierGroup>? modifierGroups)
        {
            if (modifierGroups?.Any() != true) return string.Empty;
            
            var modifierData = new List<string>();
            foreach (var group in modifierGroups)
            {
                foreach (var modifier in group.Toppings)
                {
                    var modifierInfo = $"{group.Category?.Name ?? "NONE"}|{modifier.Modifier?.Name ?? "UNKNOWN"}|{modifier.Quantity}|{modifier.Affix?.Name ?? ""}|{modifier.Modifier?.Price ?? 0}";
                    modifierData.Add(modifierInfo);
                }
            }
            return string.Join(";", modifierData);
        }

        private string SerializePortionModifiers(ObservableCollection<Components.Reciept.Model.ReceiptItemPortion>? portions)
        {
            if (portions?.Any() != true) return string.Empty;
            
            var portionData = new List<string>();
            foreach (var portion in portions)
            {
                var portionInfo = $"PORTION:{portion.PortionType?.Name ?? "UNKNOWN"}:{portion.IsSelected}";
                portionData.Add(portionInfo);
                
                if (portion.ModifierGroups?.Any() == true)
                {
                    foreach (var group in portion.ModifierGroups)
                    {
                        foreach (var modifier in group.Toppings)
                        {
                            var modifierInfo = $"PORTION_MODIFIER:{portion.PortionType?.Name ?? "UNKNOWN"}|{group.Category?.Name ?? "NONE"}|{modifier.Modifier?.Name ?? "UNKNOWN"}|{modifier.Quantity}|{modifier.Affix?.Name ?? ""}|{modifier.Modifier?.Price ?? 0}";
                            portionData.Add(modifierInfo);
                        }
                    }
                }
            }
            return string.Join(";", portionData);
        }

        private InvoiceViewModel CreateInvoiceViewModelFromController(bool isNewHoldInvoice = true)
        {
            try
            {
                var invoice = new InvoiceViewModel();
                
                // Map controller data to invoice view model
                invoice.InvoiceItems.Clear();
                foreach (var item in Controller.Items)
                {
                    var itemViewModel = new ItemViewModel
                    {
                        PrdID = 0,
                        ProductGuid = item.Product?.Id!,
                        PrdName = item.Product?.Name ?? string.Empty,
                        ProductSize = item.Size?.Size?.Name ?? string.Empty,
                        ProductType = item.ReceiptItemType?.ProductType?.Name ?? string.Empty,
                        PrdType = string.IsNullOrEmpty(item.ReceiptItemType?.ProductType?.Id) ? 0 : 
                                 int.TryParse(item.ReceiptItemType.ProductType.Id, out int typeId) ? typeId : 0,
                        ItemQty = item.Quanity, // Note: ReceiptItem uses "Quanity" not "Quantity"
                        IsTaxed = !item.IsTaxFree, // IsTaxed is the inverse of IsTaxFree
                        IsTaxExempted = Controller.IsTaxExempted,
                        TaxRate = (decimal)item.TaxRate, // Convert float to decimal
                        ItemBasePrice = item.BaseItemPrice,
                        SizePrice = item.Size?.Price ?? 0,
                        SellablePrice = item.BaseItemPrice, // Using BaseItemPrice as sellable price
                        ItemDiscountPercentage = (decimal)item.ItemDiscountPercentage,
                        InvoiceDiscountPercentage = (decimal)item.InvoiceDiscountPercentage,
                        ToppingsTotalPrice = item.ModifiersPrice,
                        // Store additional item details for better restoration
                        IsTaxFreeItem = item.IsTaxFree,
                        // Store serialized modifier information for restoration
                        SerializedModifiers = SerializeModifiers(item.ModifierGroups),
                        SerializedPortionModifiers = SerializePortionModifiers(item.Portions),
                    };

                    // MAP PORTIONS - Convert ReceiptItemPortion to ItemPortionViewModel
                    if (item.Portions?.Any() == true)
                    {
                        foreach (var portion in item.Portions)
                        {
                            var portionViewModel = new ItemPortionViewModel
                            {
                                ItemPortionType = new Data.Models.Entities.Menu.PortionType
                                {
                                    Id = 0, // Legacy system uses int, new system uses string
                                    GUId = portion.PortionType?.Id ?? string.Empty,
                                    Name = portion.PortionType?.Name ?? string.Empty
                                },
                                IsPortionTypeAdded = true
                            };
                            
                            // MAP PORTION MODIFIERS - Convert portion modifiers to Toppings
                            if (portion.ModifierGroups?.Any() == true)
                            {
                                foreach (var modifierGroup in portion.ModifierGroups)
                                {
                                    foreach (var modifier in modifierGroup.Toppings)
                                    {
                                        var topping = new Data.Models.Entities.Menu.Toppings
                                        {
                                            GUId = modifier.Modifier?.Id ?? string.Empty,
                                            Name = modifier.Modifier?.Name ?? string.Empty,
                                            Price = modifier.Modifier?.Price ?? 0,
                                            ToppingCatGuid = modifierGroup.Category?.Id ?? string.Empty,
                                            ToppingCategory = modifierGroup.Category != null ? new Data.Models.Entities.Menu.ToppingCategory
                                            {
                                                GUId = modifierGroup.Category.Id,
                                                Name = modifierGroup.Category.Name,
                                                CanAddMultiple = modifierGroup.Category.CanAddMultiple
                                            } : null
                                        };
                                        portionViewModel.Toppings.Add(topping);
                                        portionViewModel.TotalToppingPrice += topping.Price * modifier.Quantity;
                                    }
                                }
                            }
                            
                            itemViewModel.ItemPortions.Add(portionViewModel);
                        }
                    }
                    
                    // MAP ITEM-LEVEL MODIFIERS - Convert to SelectedProductToppings
                    if (item.ModifierGroups?.Any() == true)
                    {
                        foreach (var modifierGroup in item.ModifierGroups)
                        {
                            foreach (var modifier in modifierGroup.Toppings)
                            {
                                var topping = new Data.Models.Entities.Menu.Toppings
                                {
                                    GUId = modifier.Modifier?.Id ?? string.Empty,
                                    Name = modifier.Modifier?.Name ?? string.Empty,
                                    Price = modifier.Modifier?.Price ?? 0,
                                    ToppingCatGuid = modifierGroup.Category?.Id ?? string.Empty,
                                    ToppingCategory = modifierGroup.Category != null ? new Data.Models.Entities.Menu.ToppingCategory
                                    {
                                        GUId = modifierGroup.Category.Id,
                                        Name = modifierGroup.Category.Name,
                                        CanAddMultiple = modifierGroup.Category.CanAddMultiple
                                    } : null
                                };
                                itemViewModel.SelectedProductToppings.Add(topping);
                            }
                        }
                    }
                    
                    // Calculate computed properties to ensure consistency
                    itemViewModel.UpdateProperties();
                    
                    invoice.InvoiceItems.Add(itemViewModel);
                }

                // Set invoice properties
                invoice.IsTaxExempted = Controller.IsTaxExempted;
                invoice.IsMakeToGo = Controller.IsMakeToGo;
                invoice.IsHold = true; // This is a hold invoice
                invoice.SelectedCustomer = ConvertFromLegacyCustomer(SelectedCustomer);
                
                // Copy any invoice tenders if they exist
                if (Controller.InvoiceTenders?.Any() == true)
                {
                    invoice.InvoiceTenders.Clear();
                    foreach (var legacyTender in Controller.InvoiceTenders)
                    {
                        invoice.InvoiceTenders.Add(new InvoiceTenderDto
                        {
                            PaymentMethodName = legacyTender.PaymentMethodName ?? string.Empty,
                            TenderAmount = legacyTender.TenderAmount,
                            ChangeAmount=legacyTender.ChangeAmount
                        });
                    }
                }
                
                // Calculate totals
                invoice.UpdateTotals();
                
                // Clear the Id for new hold invoices - this ensures they will be created as new invoices
                // rather than trying to update existing ones
                if (isNewHoldInvoice)
                {
                    invoice.Id = null;
                }
                
                return invoice;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to create invoice view model from controller: {ex.Message}", ex);
            }
        }

        [RelayCommand]
        async Task LoadHoldInvoice(InvoiceDto holdInvoice)
        {
            try
            {
                // Step 1: Validate hold invoice data
                var (isValid, errorMessage) = ValidateHoldInvoiceData(holdInvoice);
                if (!isValid)
                {
                    await ShowErrorAlert(errorMessage);
                    return;
                }

                Console.WriteLine($"Loading hold invoice: {holdInvoice.Id}");

                // Step 2: Deserialize invoice view model
                var invoiceViewModel = JsonConvert.DeserializeObject<InvoiceViewModel>(holdInvoice.InvoiceAsJsonString);
                
                // Step 3: Validate deserialized data
                var (isDeserializedValid, deserializedError) = ValidateDeserializedInvoice(invoiceViewModel);
                if (!isDeserializedValid)
                {
                    Console.WriteLine($"Failed to deserialize hold invoice JSON: {holdInvoice.Id}");
                    await ShowErrorAlert(deserializedError);
                    return;
                }

                // Step 4: Restore order state and UI from hold invoice
                await RestoreHoldInvoiceState(invoiceViewModel, holdInvoice.Id.ToString());
                
                // Step 5: Complete the load process
                await CompleteHoldInvoiceLoad(holdInvoice.Id.ToString());
            }
            catch (JsonException jsonEx)
            {
                await ShowErrorAlert(string.Format(MSG_LOAD_ERROR_PARSE_FAILED, jsonEx.Message));
            }
            catch (Exception ex)
            {
                await ShowErrorAlert(string.Format(MSG_LOAD_ERROR_EXCEPTION, ex.Message));
            }
        }

        [RelayCommand]
        async Task OrderEntryAction(object param)
        {
            var action = (OrderEntryActionDto)param;
            switch (action.Type)
            {
                case ActionType.TaxExempt:
                    Controller.IsTaxExempted = !Controller.IsTaxExempted;
                    if (Controller.IsTaxExempted)
                    {
                        action.BtnBackBrush = Color.FromArgb(action.AltBackColor);
                        action.BtnForeColor = action.AltForeColor;
                        action.BtnLabel = action.AltLabel;
                    }
                    else
                    {
                        action.BtnBackBrush = Color.FromArgb(action.BackColor);
                        action.BtnForeColor = action.ForeColor;
                        action.BtnLabel = action.Label;
                    }
                    Controller.SetInvoiceTaxExempted(Controller.IsTaxExempted);
                    break;

                case ActionType.MakeTaxFree:
                    if (action.BtnLabel == action.Label)
                    {
                        Controller.SetTaxFree();
                        action.BtnBackBrush = Color.FromArgb(action.AltBackColor);
                        action.BtnForeColor = action.AltForeColor;
                        action.BtnLabel = action.AltLabel;

                    }
                    else
                    {
                        Controller.SetNonTaxFree();
                        action.BtnBackBrush = Color.FromArgb(action.BackColor);
                        action.BtnForeColor = action.ForeColor;
                        action.BtnLabel = action.Label;
                    }

                    break;

                case ActionType.DuplicateItem:
                    DublicatItemClicked();
                    break;
                case ActionType.DuplicateTicket:
                    await DublicatTicketClicked();
                    break;
                case ActionType.MakeToGo:
                    MakeToGoClicked();
                    break;
                case ActionType.RemoveItem:
                    RemoveInvoiceItem();
                    break;
                case ActionType.Hold:
                    await HoldInvoice();
                    break;
                case ActionType.CancelOrder:
                    CancelOrderClicked();
                    break;
                case ActionType.ClearInvoiceDiscount:
                    ClearInvoiceDiscount();
                    break;
                case ActionType.ClearItemDiscount:
                    ClearItemDiscount();
                    break;
                case ActionType.ManagerActions:
                    await AuthorizeManager();
                    break;
                case ActionType.HoldOrders:
                    ResetActionButtons();
                    CanShowHoldInvoices = !CanShowHoldInvoices;
                    action.BtnLabel = (action.BtnLabel == action.Label) ? action.AltLabel : action.Label;
                    if (!CanShowHoldInvoices)
                        await LoadOrderEntryActionsAsync();
                    await LoadHoldInvoicesAsync();
                    break;
                case ActionType.DecreaseQuantity:
                    DecreaseSize();
                    break;
                case ActionType.IncreaseQuantity:
                    IncreaseSize();
                    break;
                case ActionType.ManagerReprint:
                    ResetActionButtons();
                    await LoadOrderEntryActionsAsync();
                    break;
                default:
                    break;
            }

        }

        private async Task AuthorizeManager()
        {
            await popupservice.ShowPopup(Enum.PopupType.ManagerAction);
        }

        [RelayCommand]
        async Task NoSaleClicked()
        {
            await popupservice.ShowPopup(Enum.PopupType.NoSaleAuthenticatation);
        }

      

        [RelayCommand]
        public async Task OrderEntryClicked()
        {
            await popupservice.ShowPopup(Enum.PopupType.OrderEntyAuthorization);
        }

        public async Task ShowSelectCustomerPopup()
        {
            await popupservice.ShowPopup(Enum.PopupType.SelectCustomer);
            var customerPopupViewModel = (SelectCustomerPopupViewModel)popupLocator.SelectCustomerPopupView.BindingContext;
            customerPopupViewModel.Customers = Customers;
        }

        [RelayCommand]
        void ShowMenu()
        {
            IsMenuVisible = !IsMenuVisible;
        }

        [RelayCommand]
        void AddAffix(SharedDtos.AffixDto affix)
        {
            SelectedAffix = affix;
        }

        #endregion

        // Customer DTO conversion helper
        private OrderEntry.Customers.CustomerDto? ConvertToLegacyCustomer(CustomerDto? dto)
        {
            if (dto == null) return null;
            return new OrderEntry.Customers.CustomerDto
            {
                Name = dto.Name ?? string.Empty
            };
        }

        private CustomerDto? ConvertFromLegacyCustomer(OrderEntry.Customers.CustomerDto? legacy)
        {
            if (legacy == null) return null;
            return new CustomerDto
            {
                Id = legacy.Id?.ToString(),
                Name = legacy.Name
            };
        }


        #region Validation Helper Methods

        /// <summary>
        /// Validates if the current order can be placed on hold
        /// </summary>
        /// <returns>Tuple with validation result and error message</returns>
        private async Task<(bool isValid, string errorMessage)> ValidateOrderForHold()
        {
            // Check if there are any items in the order
            if (Controller.Items?.Count == 0)
                return (false, MSG_HOLD_ERROR_NO_ITEMS);
            
            // Check if current item configuration is complete
            if (!(await CanNavigate()))
                return (false, MSG_HOLD_ERROR_INCOMPLETE_ITEM);
            
            // Check if all items have valid product information
            if (Controller.Items?.Any(item => string.IsNullOrEmpty(item.Product?.Name)) == true)
                return (false, MSG_HOLD_ERROR_INVALID_ITEMS);
            
            return (true, string.Empty);
        }

        /// <summary>
        /// Validates hold invoice data for loading
        /// </summary>
        /// <param name="holdInvoice">The hold invoice to validate</param>
        /// <returns>Tuple with validation result and error message</returns>
        private (bool isValid, string errorMessage) ValidateHoldInvoiceData(InvoiceDto holdInvoice)
        {
            if (holdInvoice == null)
                return (false, MSG_LOAD_ERROR_INVALID);
            
            if (string.IsNullOrEmpty(holdInvoice.InvoiceAsJsonString))
                return (false, MSG_LOAD_ERROR_CORRUPTED);
            
            return (true, string.Empty);
        }

        /// <summary>
        /// Validates the invoice view model created from controller
        /// </summary>
        /// <param name="invoiceViewModel">The invoice view model to validate</param>
        /// <returns>Tuple with validation result and error message</returns>
        private (bool isValid, string errorMessage) ValidateInvoiceViewModel(InvoiceViewModel invoiceViewModel)
        {
            if (invoiceViewModel == null)
                return (false, MSG_HOLD_ERROR_CREATE_FAILED);
            
            if (invoiceViewModel.InvoiceItems?.Count == 0)
                return (false, MSG_HOLD_ERROR_CREATE_FAILED);
            
            return (true, string.Empty);
        }

        /// <summary>
        /// Validates deserialized invoice view model from hold invoice
        /// </summary>
        /// <param name="invoiceViewModel">The deserialized invoice view model</param>
        /// <returns>Tuple with validation result and error message</returns>
        private (bool isValid, string errorMessage) ValidateDeserializedInvoice(InvoiceViewModel invoiceViewModel)
        {
            if (invoiceViewModel == null)
                return (false, MSG_LOAD_ERROR_FAILED);
            
            if (invoiceViewModel.InvoiceItems?.Count == 0)
                return (false, MSG_LOAD_ERROR_NO_ITEMS);
            
            return (true, string.Empty);
        }

        #endregion

        #region Hold Invoice Helper Methods

        /// <summary>
        /// Saves or updates a hold invoice using the order entry service
        /// </summary>
        /// <param name="invoiceViewModel">The invoice view model to save</param>
        /// <returns>ServiceResult with invoice ID if successful</returns>
        private async Task<OrderEntry.Services.OrderEntryService.ServiceResult> SaveOrUpdateHoldInvoiceAsync(InvoiceViewModel invoiceViewModel)
        {
            // Map InvoiceViewModel to InvoiceForUIDto
            var invoiceDto = mapper.Map<PennPOS.Maui.Shared.Dtos.OrderEntryDtos.InvoiceForUIDto>(invoiceViewModel);
            
            // Use OrderEntryService which now returns ServiceResult

            return await orderEntryService.SaveHoldInvoiceAsync(invoiceDto);
        }

        /// <summary>
        /// Handles the result of hold invoice operation and updates UI accordingly
        /// </summary>
        /// <param name="result">The ServiceResult from the save operation</param>
        private async Task HandleHoldInvoiceResult(OrderEntry.Services.OrderEntryService.ServiceResult result)
        {
            if (result.Success)
            {
                // Success - reset order state and refresh hold invoices
                ResetOrderState();
                await LoadHoldInvoicesAsync();
                await ShowSuccessAlert(string.Format(MSG_HOLD_SUCCESS, FormatInvoiceId(result.Data)));
            }
            else
            {
                // Failed to save - show detailed error message
                await ShowErrorAlert($"{MSG_HOLD_ERROR}\n{result.ErrorMessage}");
            }
        }

        /// <summary>
        /// Resets the order state and UI after completing or holding an invoice
        /// </summary>
        private void ResetOrderState()
        {
            Controller.CancelOrder();
            ResetActionButtons();
            ViewsVisible = Views.Product | Views.InvoiceMenu;
            SelectedProduct = default;
            CanChangeDiningOption = false;
        }

        #endregion

        #region Load Hold Invoice Helper Methods

        /// <summary>
        /// Restores the order state and UI from a hold invoice view model
        /// </summary>
        /// <param name="invoiceViewModel">The invoice view model to restore from</param>
        /// <param name="holdInvoiceId">The original hold invoice ID</param>
        private async Task RestoreHoldInvoiceState(InvoiceViewModel invoiceViewModel, string holdInvoiceId)
        {
            Console.WriteLine($"Restoring {invoiceViewModel.InvoiceItems?.Count ?? 0} items from hold invoice");

            // Restore complete order state to Controller
            Controller.LoadFromInvoiceViewModel(invoiceViewModel);
            
            // Restore UI state
            SelectedCustomer = ConvertToLegacyCustomer(invoiceViewModel.SelectedCustomer) ?? new OrderEntry.Customers.CustomerDto();
            
            // Update action buttons and UI
            await LoadOrderEntryActionsAsync();
            ResetActionButtons();
            
            // Set tax exempt state and update button
            UpdateTaxExemptButton(invoiceViewModel.IsTaxExempted);
            
            // Store the invoice ID for potential updates
            invoiceViewModel.Id = holdInvoiceId;
        }

        /// <summary>
        /// Updates the tax exempt button state based on invoice tax exemption status
        /// </summary>
        /// <param name="isTaxExempted">Whether the invoice is tax exempted</param>
        private void UpdateTaxExemptButton(bool isTaxExempted)
        {
            var taxexemptAction = OrderEntryActions.FirstOrDefault(x => x.Type == ActionType.TaxExempt);
            if (taxexemptAction != null && isTaxExempted)
            {
                taxexemptAction.BtnBackBrush = Color.FromArgb(taxexemptAction.AltBackColor);
                taxexemptAction.BtnForeColor = taxexemptAction.AltForeColor;
                taxexemptAction.BtnLabel = taxexemptAction.AltLabel;
            }
        }

        /// <summary>
        /// Completes the hold invoice loading by updating visibility and showing success
        /// </summary>
        /// <param name="holdInvoiceId">The ID of the loaded hold invoice</param>
        private async Task CompleteHoldInvoiceLoad(string holdInvoiceId)
        {
            // Hide hold invoices and show order entry
            CanShowHoldInvoices = false;
            ViewsVisible = Views.Product | Views.InvoiceMenu;
            
            // Show success message
            await ShowSuccessAlert(string.Format(MSG_LOAD_SUCCESS, FormatInvoiceId(holdInvoiceId)));
        }

        #endregion

        #region Alert Helper Methods

        /// <summary>
        /// Shows a success alert dialog
        /// </summary>
        /// <param name="message">The message to display</param>
        private async Task ShowSuccessAlert(string message)
        {
            await Application.Current!.Windows[0].Page!.DisplayAlertAsync(ALERT_TITLE_SUCCESS, message, "OK");
        }

        /// <summary>
        /// Shows an error alert dialog
        /// </summary>
        /// <param name="message">The error message to display</param>
        private async Task ShowErrorAlert(string message)
        {
            await Application.Current!.Windows[0].Page!.DisplayAlertAsync(ALERT_TITLE_ERROR, message, "OK");
        }

        /// <summary>
        /// Shows an alert dialog with custom title
        /// </summary>
        /// <param name="title">The title of the alert</param>
        /// <param name="message">The message to display</param>
        private async Task ShowAlert(string title, string message)
        {
            await Application.Current!.Windows[0].Page!.DisplayAlertAsync(title, message, "OK");
        }

        /// <summary>
        /// Formats an invoice ID for display (first 8 characters + ellipsis)
        /// </summary>
        /// <param name="invoiceId">The full invoice ID</param>
        /// <returns>Formatted invoice ID string</returns>
        private string FormatInvoiceId(string invoiceId)
        {
            if (string.IsNullOrEmpty(invoiceId))
                return "Unknown";
            
            return invoiceId.Length > INVOICE_ID_DISPLAY_LENGTH 
                ? $"{invoiceId.Substring(0, INVOICE_ID_DISPLAY_LENGTH)}..." 
                : invoiceId;
        }

        /// <summary>
        /// Stores the original topping collections for all categories to enable restoration after filtering.
        /// This prevents permanent mutation of the DTO objects.
        /// IMPORTANT: Only stores on first call per product to preserve pristine state before any filtering.
        /// </summary>
        private void StoreOriginalToppingCollections()
        {
            if (SelectedProduct?.ToppingCategories == null)
                return;
            
            // Only store if we don't already have stored collections for this product's categories
            // This prevents overwriting pristine data with already-filtered data
            foreach (var category in SelectedProduct.ToppingCategories)
            {
                if (category.Toppings != null && !string.IsNullOrEmpty(category.Id))
                {
                    // Only store if not already stored (preserve original state)
                    if (!_originalToppingCollections.ContainsKey(category.Id))
                    {
                        _originalToppingCollections[category.Id] = new ObservableCollection<ToppingDto>(category.Toppings);
                    }
                }
            }
        }
        
        /// <summary>
        /// Restores the original topping collections for all categories from the stored backup.
        /// This ensures that filtering can be re-applied with fresh data.
        /// </summary>
        private void RestoreOriginalToppingCollections()
        {
            if (SelectedProduct?.ToppingCategories == null || _originalToppingCollections.Count == 0)
                return;
                
            foreach (var category in SelectedProduct.ToppingCategories)
            {
                if (!string.IsNullOrEmpty(category.Id) && _originalToppingCollections.ContainsKey(category.Id))
                {
                    // Restore from the backup - create new ObservableCollection from stored copy
                    category.Toppings = new ObservableCollection<ToppingDto>(_originalToppingCollections[category.Id]);
                }
            }
        }
        
        /// <summary>
        /// Removes modifiers from the receipt item that belong to categories no longer valid for the selected size.
        /// This implements Option B: Preserve valid modifiers, remove only those from filtered-out categories.
        /// </summary>
        /// <param name="validCategories">The list of categories still valid after size filtering</param>
        private void RemoveInvalidModifiersAfterSizeChange(List<ToppingCategoryDto> validCategories)
        {
            if (Controller.CurrentReceiptItem == null)
                return;
                
            // Get all valid category IDs (categories with toppings after filtering)
            var validCategoryIds = validCategories
                .Where(c => c.Toppings?.Any() == true)
                .Select(c => c.Id)
                .ToHashSet();
            
            // Get list of modifier groups to remove (those belonging to invalid categories)
            var groupsToRemove = new List<Components.Reciept.Model.ReceiptItemModifierGroup>();
            
            // Check item-level modifiers
            foreach (var modifierGroup in Controller.CurrentReceiptItem.ModifierGroups.ToList())
            {
                if (modifierGroup.Category != null && 
                    !string.IsNullOrEmpty(modifierGroup.Category.Id) &&
                    !validCategoryIds.Contains(modifierGroup.Category.Id))
                {
                    groupsToRemove.Add(modifierGroup);
                }
            }
            
            // Remove invalid modifier groups from item
            foreach (var group in groupsToRemove)
            {
                Controller.CurrentReceiptItem.ModifierGroups.Remove(group);
            }
            
            // Check portion-level modifiers
            foreach (var portion in Controller.CurrentReceiptItem.Portions)
            {
                var portionGroupsToRemove = new List<Components.Reciept.Model.ReceiptItemModifierGroup>();
                
                foreach (var modifierGroup in portion.ModifierGroups.ToList())
                {
                    if (modifierGroup.Category != null && 
                        !string.IsNullOrEmpty(modifierGroup.Category.Id) &&
                        !validCategoryIds.Contains(modifierGroup.Category.Id))
                    {
                        portionGroupsToRemove.Add(modifierGroup);
                    }
                }
                
                // Remove invalid modifier groups from portion
                foreach (var group in portionGroupsToRemove)
                {
                    portion.ModifierGroups.Remove(group);
                }
            }
            
            // Notify UI about changes to applied modifiers
            OnPropertyChanged(nameof(AppliedModifiers));
            OnPropertyChanged(nameof(AppliedModifierGroups));
        }
        
        /// <summary>
        /// Filters topping categories based on category-level size assignments.
        /// Categories not assigned to the selected size will have their toppings cleared,
        /// effectively hiding them from the UI when combined with the filtering in AddSize().
        /// SCENARIO FIX: Categories without ANY size assignments are universal and remain visible for all sizes.
        /// </summary>
        /// <param name="category">The topping category to filter</param>
        private async Task FilterToppingCategoriesBySizeAsync(ToppingCategoryDto category)
        {
            try
            {
                // Get the selected size from the current receipt item
                var selectedSizeId = Controller.CurrentReceiptItem?.Size?.Id;
                
                // If no size is selected, nothing to filter
                if (string.IsNullOrEmpty(selectedSizeId) || SelectedProduct == null)
                {
                    return;
                }

                var productId = SelectedProduct.Id;
                if (string.IsNullOrEmpty(productId) || string.IsNullOrEmpty(category.Id))
                {
                    return;
                }

                // Get all category IDs that are available for the selected size
                var availableCategoryIds = await toppingCategoryAssignedSizeService.GetAvailableToppingCategoryIdsForSizeAsync(productId, selectedSizeId);
                
                // SCENARIO FIX: Check if this category has ANY size assignments at all
                // If the service returns empty or the category is not in the system's size assignment records,
                // it means this category is universal (available for all sizes)
                var allAssignedCategoryIds = await toppingCategoryAssignedSizeService.GetAllToppingCategoryIdsWithSizeAssignmentsAsync(productId);
                
                // If this category has NO size assignments in the system, it's universal - don't filter it
                if (!allAssignedCategoryIds.Contains(category.Id))
                {
                    // Universal category - keep it visible for all sizes
                    return;
                }
                
                // Clear toppings for categories NOT assigned to this size
                // The AddSize method will then remove these empty categories from SelectedToppingCategories
                if (!availableCategoryIds.Contains(category.Id))
                {
                    category.Toppings?.Clear();
                }
            }
            catch (Exception ex)
            {
                // Log error but don't break the flow
                await ShowErrorAlert($"Error filtering modifier categories by size: {ex.Message}");
            }
        }



        #endregion
    }
}
