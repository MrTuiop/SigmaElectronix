namespace SigmaElectronix.Server.DTOs.SearchDTOs
{
    public class SearchSuggestDto
    {
        public List<SuggestCategoryDto> Categories { get; set; } = new();
        public List<SuggestBrandDto> Brands { get; set; } = new();
        public List<SuggestProductDto> Products { get; set; } = new();
    }
}
