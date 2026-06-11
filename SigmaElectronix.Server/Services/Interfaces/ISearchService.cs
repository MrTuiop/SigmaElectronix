using SigmaElectronix.Server.DTOs.SearchDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface ISearchService
    {
        Task<SearchSuggestDto> GetSuggestionsAsync(string query);
        Task<List<string>> GetPopularTagsAsync(int count = 5);
    }
}
