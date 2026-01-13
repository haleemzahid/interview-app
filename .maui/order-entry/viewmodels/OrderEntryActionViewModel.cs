using PennPOS.Data.EfCore.Entities.MenuSetupEntities;
using System.Windows.Input;



namespace OrderEntry.ViewModels
{
    public class OrderEntryActionViewModel : OrderEntryAction
    {
        public Brush BackgroundBrush => Color.FromArgb(BackColor);
        public ICommand Command { get; set; }
    }
}
