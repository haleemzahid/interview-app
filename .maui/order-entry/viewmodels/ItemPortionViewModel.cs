
using CommunityToolkit.Mvvm.ComponentModel;
using Data.Models.Entities.Menu;
using PennPOS.Maui.Shared.Common;
using System.Collections.ObjectModel;

namespace OrderEntry.ViewModels
{
    public partial class ItemPortionViewModel:BaseEntityViewModel, ICloneable
    {
        [ObservableProperty]
        public partial PortionType ItemPortionType { get; set; } = new();

        [ObservableProperty]
        public partial bool IsPortionTypeAdded { get; set; } = false;

        [ObservableProperty]
        public partial ObservableCollection<Toppings> Toppings { get; set; } = new();

        [ObservableProperty]
        public partial Toppings Topping { get; set; } = new();

        [ObservableProperty]
        public partial decimal TotalToppingPrice { get; set; }
        public void AddPortionType(PortionType portionType)
        {
            IsPortionTypeAdded = true;
        }

        public void AddTopping(Toppings topping)
        {
            try
            {
                Toppings.Add(topping);
                TotalToppingPrice += topping.Price;
            }
            catch (Exception es)
            {

                throw;
            }
        }
        public void AddTopping(Toppings topping,string toppingCatGuid)
        {
            try
            {
                if (Toppings.Any(x=>x.ToppingCatGuid==toppingCatGuid))
                {
                    var existingTopping = Toppings.FirstOrDefault(x => x.ToppingCatGuid == toppingCatGuid);
                    Toppings.Remove(existingTopping);
                    TotalToppingPrice -= existingTopping.Price;
                    Toppings.Add(topping);
                    TotalToppingPrice += topping.Price;
                }
                else
                {
                    Toppings.Add(topping);
                    TotalToppingPrice += topping.Price;
                }
            }
            catch (Exception es)
            {

                throw;
            }
        }

        public object Clone()
        {
            return MemberwiseClone();
        }
    }
}
