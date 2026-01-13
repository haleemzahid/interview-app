using CommunityToolkit.Mvvm.ComponentModel;
using Data.Models.Entities.Menu;
using PennPOS.Maui.Shared.Common;
using System.Collections.ObjectModel;



namespace OrderEntry.ViewModels
{
    public partial class ItemViewModel : BaseEntityViewModel, ICloneable
    {
        [ObservableProperty]
        public partial ObservableCollection<ItemPortionViewModel> ItemPortions { get; set; } = [];

        [ObservableProperty]
        public partial bool IsSizeAdded { get; set; } = false;

        [ObservableProperty]
        private ItemPortionViewModel _selectedItemPortion;
        public int PrdID { get; set; }
        public string ProductGuid { get; set; }
        public string MenuGuid { get; set; }
        public int CategId { get; set; }
        public string MenuCatGuid { get; set; }
        public string ToppingGuid { get; set; }
        public string ToppingCatGuid { get; set; }
        public string PrdName { get; set; }
        public string ProductType { get; set; }
        public List<string> ProductTypes { get; set; }

        [ObservableProperty]
        [NotifyPropertyChangedFor(nameof(Description))]
        [NotifyPropertyChangedFor(nameof(TotalItemDiscount))]
        [NotifyPropertyChangedFor(nameof(TotalInvoiceDiscount))]
        [NotifyPropertyChangedFor(nameof(GrandTotalDiscount))]
        [NotifyPropertyChangedFor(nameof(TotalTax))]
        [NotifyPropertyChangedFor(nameof(ItemGrandTotalPrice))]
        [NotifyPropertyChangedFor(nameof(ItemLinePrice))]
        [NotifyPropertyChangedFor(nameof(ItemTotalWithDiscount))]
        [NotifyPropertyChangedFor(nameof(ItemTotalWithTax))]
        private string productSize = string.Empty;


        [ObservableProperty]
        public partial decimal SizePrice { get; set; }

        [ObservableProperty]
        public partial int PrdType { get; set; }

        [ObservableProperty]
        public partial int ItemQty { get; set; } = 1;

        [ObservableProperty]
        public partial bool IsTaxed { get; set; }

        [ObservableProperty]
        public partial bool IsTaxExempted { get; set; }

        [ObservableProperty]
        public partial bool HasSize { get; set; }

        [ObservableProperty]
        public partial bool IsTaxFreeItem { get; set; }

        [ObservableProperty]
        public partial decimal TaxRate { get; set; } = 8.25m;

        [ObservableProperty]
        public partial decimal ItemDiscountPercentage { get; set; } = 0;

        [ObservableProperty]
        public partial decimal InvoiceDiscountPercentage { get; set; } = 0;

        [ObservableProperty]
        public partial bool AllowedSpecialRequest { get; set; } = false;

        [ObservableProperty]
        public partial decimal ItemBasePrice { get; set; }

        [ObservableProperty]
        public partial decimal SellablePrice { get; set; }

        [ObservableProperty]
        public partial DateTime CreatedDate { get; set; } = DateTime.Now;

        // if product has  a base price  - Just add it
        public decimal BasePrice { get; set; }

        public string Description => ItemDiscountPercentage <= 0 ? ProductSize + " " + PrdName : ProductSize + " " + PrdName + " (" + ItemDiscountPercentage + "%)";

        public decimal TotalItemDiscount => ((ItemBasePrice * ItemQty) / 100) * ItemDiscountPercentage;

        public decimal TotalInvoiceDiscount => (((ItemBasePrice * ItemQty) - TotalItemDiscount) / 100) * InvoiceDiscountPercentage;

        public decimal GrandTotalDiscount => TotalInvoiceDiscount + TotalItemDiscount;
        public decimal ToppingsTotalPrice { get; set; }
        public decimal TotalTax => (IsTaxFreeItem || IsTaxExempted) == true ? 0m : (((ItemBasePrice * ItemQty) + ToppingsTotalPrice - GrandTotalDiscount) / 100) * TaxRate;

        public decimal ItemGrandTotal => ((ItemBasePrice * ItemQty) + ToppingsTotalPrice - GrandTotalDiscount + TotalTax);



        public decimal ItemGrandTotalPrice
        {
            get { return (ItemGrandTotal); }

        }


        public decimal ItemLinePrice => ((ItemBasePrice * ItemQty) + ToppingsTotalPrice - GrandTotalDiscount);


        public decimal ItemTotalWithDiscount => (ItemBasePrice + GrandTotalDiscount);

        public decimal ItemTotalWithTax => (ItemBasePrice + TotalTax);
        public void UpdateProperties()
        {
            OnPropertyChanged(nameof(ItemLinePrice));
            OnPropertyChanged(nameof(ItemGrandTotalPrice));
            OnPropertyChanged(nameof(ItemTotalWithTax));
            OnPropertyChanged(nameof(TotalTax));
            OnPropertyChanged(nameof(GrandTotalDiscount));
            OnPropertyChanged(nameof(TotalInvoiceDiscount));
            OnPropertyChanged(nameof(TotalItemDiscount));
            OnPropertyChanged(nameof(Description));
            OnPropertyChanged(nameof(SellablePrice));
            OnPropertyChanged(nameof(InvoiceDiscountPercentage));
            OnPropertyChanged(nameof(ItemDiscountPercentage));
            OnPropertyChanged(nameof(IsTaxed));
            OnPropertyChanged(nameof(TaxRate));
            OnPropertyChanged(nameof(ItemQty));
            OnPropertyChanged(nameof(PrdType));
            OnPropertyChanged(nameof(HasSize));
            OnPropertyChanged(nameof(SizePrice));


        }

        // Calculate Total toppings Price

        public void UpdateToppingsPrice(decimal currentPrdToppingPrice)
        {
            ToppingsTotalPrice += currentPrdToppingPrice;

        }

        public void AddProduct(Product selectedProduct)
        {
            //ProductType = selectedProduct.ProductType;
            //ProductTypes = selectedProduct.ProductTypes;
            PrdID = selectedProduct.Id;
            ProductGuid = selectedProduct.GUId;
            MenuCatGuid = selectedProduct.MenuCatGuid;
            PrdName = selectedProduct.Name;
            IsTaxed = selectedProduct.IsTaxed;
            PrdType = selectedProduct.PrdType;
            // Use base price if it is available
            if (selectedProduct.BasePrice <= 0)
                SellablePrice = SizePrice;
            else
                SellablePrice = selectedProduct.BasePrice;
        }
        public ProductSize PrdSize { get; set; }


        public List<ProductSize> PrdSizes { get; set; }
        public PortionType PortionType { get; set; }
        [ObservableProperty]
        public partial ObservableCollection<PortionType> ProductPortionTypes { get; set; } = new();

        [ObservableProperty]
        public partial ObservableCollection<Toppings> SelectedProductToppings { get; set; } = new();

        [ObservableProperty]
        public partial ObservableCollection<string> ProductSpecialInstructions { get; set; } = new();

        // Property to store serialized modifier information for invoice restoration
        public string SerializedModifiers { get; set; } = string.Empty;
        
        // Property to store serialized portion modifier information for invoice restoration  
        public string SerializedPortionModifiers { get; set; } = string.Empty;

        public void AddSize(ProductSize PSize)
        {
            PrdSize = PSize;
            ProductSize = PSize.Name;
            if (PSize.PrdPrice.FirstOrDefault()?.Price == 0 || PSize.PrdPrice.FirstOrDefault()?.Price == null)
            {
                IsSizeAdded = true;
            }
            else
            {
                ItemBasePrice = PSize.PrdPrice.FirstOrDefault()?.Price ?? 0;
                SizePrice = SellablePrice = ((ItemBasePrice * ItemQty) - GrandTotalDiscount - TotalTax);
                IsSizeAdded = true;
                OnPropertyChanged(nameof(ItemLinePrice));
                OnPropertyChanged(nameof(ItemGrandTotalPrice));
            }
        }

        public void Add(decimal basePrice)
        {
            ItemBasePrice = basePrice;
            OnPropertyChanged(nameof(ItemLinePrice));
            OnPropertyChanged(nameof(ItemGrandTotalPrice));
        }

        public void AddItemPortion(ItemPortionViewModel itemPortionVm)
        {
            try
            {
                itemPortionVm.Toppings.CollectionChanged += Toppings_CollectionChanged;
                ItemPortions.Add(itemPortionVm);
                OnPropertyChanged(nameof(ItemLinePrice));
                OnPropertyChanged(nameof(ItemGrandTotalPrice));
            }
            catch (Exception ex)
            {


            }
        }

        private void Toppings_CollectionChanged(object? sender, System.Collections.Specialized.NotifyCollectionChangedEventArgs e)
        {
        }

        public object Clone()
        {
            return MemberwiseClone();
        }
    }
}
