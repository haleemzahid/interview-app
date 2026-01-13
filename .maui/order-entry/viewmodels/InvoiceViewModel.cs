using CommunityToolkit.Mvvm.ComponentModel;
using PennPOS.Maui.Shared.Common;
using PennPOS.Maui.Shared.Dtos.OrderEntryDtos;
using System.Collections.ObjectModel;

namespace OrderEntry.ViewModels
{
    

    public partial class InvoiceViewModel : BaseEntityViewModel
    {
        /// <summary>
        /// The database ID of the invoice. This should be set when loading an existing invoice.
        /// For new invoices, this will be null/empty until saved to the database.
        /// </summary>
        [ObservableProperty]
        public partial string? Id { get; set; }

        [ObservableProperty]
        public partial ObservableCollection<ItemViewModel> InvoiceItems { get; set; } = [];

        [ObservableProperty]
        public partial ObservableCollection<ItemViewModel> SelectedInvoiceItems { get; set; } = [];


        [ObservableProperty]
        public partial int TotalInvoiceItems { get; set; }

        [ObservableProperty]
        public partial decimal TotalInvoiceDiscount { get; set; }

        [ObservableProperty]
        public partial decimal TotalDiscount { get; set; } = 0;

        [ObservableProperty]
        public partial decimal TotalItemDiscount { get; set; }

        [ObservableProperty]
        public partial decimal TotalTax { get; set; }

        [ObservableProperty]
        public partial decimal SubTotal { get; set; }

        [ObservableProperty]
        public partial bool IsMakeToGo { get; set; }

        [ObservableProperty]
        public partial decimal GrandTotal { get; set; }

        [ObservableProperty]
        public partial bool IsTaxExempted { get; set; }

        [ObservableProperty]
        public partial decimal GrandTotalDiscount { get; set; }

        [ObservableProperty]
        public partial string SubTotalText { get; set; } = "Sub Total";

        public List<InvoiceTenderDto> InvoiceTenders { get; set; } = new List<InvoiceTenderDto>();

        [ObservableProperty]
        public partial decimal TotalDue { get; set; }

        partial void OnTotalDueChanged(decimal value)
        {
            CalculatedBalanceDue = $"${Math.Round(value,2)}";
        }

        private string _calculatedBalanceDue = string.Empty;
        public string CalculatedBalanceDue
        {
            get { return _calculatedBalanceDue; }
            set
            {
                if (!string.IsNullOrEmpty(value) && !value.StartsWith("$"))
                {
                    _calculatedBalanceDue = $"${value}";
                }
                else
                {
                    _calculatedBalanceDue = value;
                }
         
                OnPropertyChanged(nameof(CalculatedBalanceDue));
            }
        }

        [ObservableProperty]
        public partial bool IsHold { get; set; } = false;

        [ObservableProperty]
        public partial CustomerDto? SelectedCustomer { get; set; }

        public void UpdateTotals()
        {

            TotalInvoiceItems = InvoiceItems.Count;
            TotalInvoiceDiscount = InvoiceItems.Sum(x => x.TotalInvoiceDiscount);
            TotalItemDiscount = InvoiceItems.Sum(x => x.TotalItemDiscount);
            GrandTotalDiscount = TotalInvoiceDiscount + TotalItemDiscount;
            TotalTax = InvoiceItems.Sum(x => x.TotalTax);
            SubTotal = InvoiceItems.Sum(x => x.ItemLinePrice);
            GrandTotal = SubTotal + TotalTax - GrandTotalDiscount ;
            OnPropertyChanged(nameof(SubTotal));
            OnPropertyChanged(nameof(GrandTotal));
            OnPropertyChanged(nameof(TotalTax));

            #region Toppings Calculations



            #endregion


            TotalDue = GrandTotal - InvoiceTenders.Sum(x => x.TenderAmount);

            if (TotalInvoiceDiscount > 0)
                SubTotalText = "Sub Total (" + InvoiceItems.First().InvoiceDiscountPercentage + "%):";
            else
                SubTotalText = "Sub Total";

            OnPropertyChanged(nameof(TotalDue));
            OnPropertyChanged(nameof(SubTotalText));

            

        }

       

    }
}
