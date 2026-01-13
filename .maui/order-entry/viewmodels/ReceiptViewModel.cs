using OrderEntry.Components.Reciept.Model;
using PennPOS.Maui.Shared.Common;

namespace OrderEntry.ViewModels.MenuServiceVMpartialClasses
{
    public partial class MenuServiceViewModel : BaseViewModel
    {

        public ReceiptController Controller { get; }
        = new();
    }
}
