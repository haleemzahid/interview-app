using Data.Models.Entities.Menu;
using AutoMapper;



namespace OrderEntry.ViewModels
{
    public class ItemViewModelMappingProfile : Profile
    {
        public ItemViewModelMappingProfile()
        {
            CreateMap<ItemViewModel, ItemViewModel>().ReverseMap();
            CreateMap<ItemPortionViewModel, ItemPortionViewModel>().ReverseMap();
            CreateMap<PortionType, PortionType>().ReverseMap();
            CreateMap<Product, Product>().ReverseMap();
            CreateMap<PortionType, PortionType>().ReverseMap();
            CreateMap<Toppings, Toppings>().ReverseMap();


        }
    }
}
