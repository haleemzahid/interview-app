namespace OrderEntry.ViewModels.MenuServiceVMpartialClasses
{
    [Flags]
    public enum Views
    {
        Product = 1,        
        AddProduct = 2,     
        Discount = 4,       
        Checkout = 8,       
        InvoiceMenu = 16,   
        PaymentMenu = 32,   
        Cart = 64           
    }
}
