using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using PennPOS.Maui.Shared.Common;

namespace OrderEntry.ViewModels
{
    public enum PopupType
    {
        DublicateTicket,
        NoSale,
        ManagerAuthorize,
        SpecialRequest,
        OrderEnty,
        ChangeAmount,
        CustomerSelection
    }

    public partial class InfoPopupViewModel: BaseViewModel
    {
       
        public InfoPopupViewModel(string tittle = "", string message = "",
            string reasonMessage = "", bool btnPrimary = true, string btnPrimaryText = "Ok",
            bool btnSecondary = false, string btnSecondaryText = "Cancel", Action? ok =null, Action? cancel=null)
        {
            Tittle = tittle;
            Message = message;
            SubMessage = reasonMessage;
            BtnPrimary= btnPrimary;
            BtnPrimaryText = btnPrimaryText;
            BtnSecondary= btnSecondary;
            BtnSecondaryText = btnSecondaryText;
            OkCommand = new RelayCommand(ok ??DefaultOk);
            CancelCommand = new RelayCommand(cancel ??DefaultCancel);
            IsOpen = true;
        }


        /// <summary>
        /// This Constructor is for Showing popup to enter quantity
        /// dublicate invoice items
        /// </summary>
        public InfoPopupViewModel(PopupType type, string tittle,string message, bool btnPrimary = true, string btnPrimaryText = "Ok",
            bool btnSecondary = true, string btnSecondaryText = "Cancel", Action? ok = null, Action? cancel = null)
        {
            Tittle = tittle;
            Message = message;
            BtnPrimary = btnPrimary;
            BtnPrimaryText = btnPrimaryText;
            BtnSecondary = btnSecondary;
            BtnSecondaryText = btnSecondaryText;
            OkCommand = new RelayCommand(ok ?? DefaultOk);
            CancelCommand = new RelayCommand(cancel ?? DefaultCancel);
            IsOpen = true;
            ShowPopupbyPopupType(type);
            
        }

        /// <summary>
        /// This Constructor is for Showing popup to Special Request
        /// invoice items
        /// </summary>
        public InfoPopupViewModel(PopupType type, string tittle, bool btnPrimary = true, string btnPrimaryText = "Ok",
            bool btnSecondary = true, string btnSecondaryText = "Cancel", Action? ok = null, Action? cancel = null)
        {
            Tittle = tittle;
            
            BtnPrimary = btnPrimary;
            BtnPrimaryText = btnPrimaryText;
            BtnSecondary = btnSecondary;
            BtnSecondaryText = btnSecondaryText;
            OkCommand = new RelayCommand(ok ?? DefaultOk);
            CancelCommand = new RelayCommand(cancel ?? DefaultCancel);
            IsOpen = true;
            ShowPopupbyPopupType(type);

        }



        private void ShowPopupbyPopupType(PopupType type)
        {
            switch (type)
            {
                case PopupType.DublicateTicket:
                    IsInvoiceItemDublicationPopup = true;
                    break;
                case PopupType.NoSale:
                    IsNoSalePopup= true;
                    break;
                case PopupType.OrderEnty:
                    IsOrderEntyAuthenticationPopup = true;
                    break;
                case PopupType.CustomerSelection:
                    IsCustomerSelectionPopup = true;
                    break;
                case PopupType.ChangeAmount:
                    IsChangeAmountPopup = true;
                    break;
                case PopupType.ManagerAuthorize:
                    IsManagerAuthorizePopup = true;
                    break;
                case PopupType.SpecialRequest:
                    IsSpecialRequestPopup = true;
                    break;
                default:
                    break;
            }
        }

        [ObservableProperty]
        public partial bool IsInvoiceItemDublicationPopup { get; set; } = false;

        [ObservableProperty]
        public partial bool IsNoSalePopup { get; set; } = false;

        [ObservableProperty]
        public partial bool IsOrderEntyAuthenticationPopup { get; set; } = false;

        [ObservableProperty]
        public partial bool IsCustomerSelectionPopup { get; set; } = false;

        [ObservableProperty]
        public partial bool IsChangeAmountPopup { get; set; } = false;

        [ObservableProperty]
        public partial bool IsManagerAuthorizePopup { get; set; } = false;

        [ObservableProperty]
        public partial bool IsSpecialRequestPopup { get; set; } = false;

        private Action DefaultOk => () =>
        {
            IsOpen = false;
        };
        private Action DefaultCancel => () =>
        {
            IsOpen = false;
        };
        [ObservableProperty]
        public partial string Tittle { get; set; }

        [ObservableProperty]
        public partial string Message { get; set; }

        [ObservableProperty]
        public partial string SubMessage { get; set; }

        [ObservableProperty]
        public partial bool BtnPrimary { get; set; }

        [ObservableProperty]
        public partial string BtnPrimaryText { get; set; }

        [ObservableProperty]
        public partial bool BtnSecondary { get; set; }

        [ObservableProperty]
        public partial string BtnSecondaryText { get; set; }

        [ObservableProperty]
        public partial bool IsOpen { get; set; } = false;

        [ObservableProperty]
        public partial bool Result { get; set; }
        public RelayCommand OkCommand { get; private set; }
        public RelayCommand CancelCommand { get; private set; }

        
    }
}
