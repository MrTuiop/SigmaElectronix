using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.SearchDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _searchService;

        public SearchController(ISearchService searchService)
        {
            _searchService = searchService;
        }

        // GET: api/search/suggest?query=apple
        [HttpGet("suggest")]
        public async Task<ActionResult<SearchSuggestDto>> GetSuggestions([FromQuery] string query)
        {
            var result = await _searchService.GetSuggestionsAsync(query);
            return Ok(result);
        }

        [HttpGet("popular-tags")]
        public async Task<ActionResult<List<string>>> GetPopularTags([FromQuery] int count = 5)
        {
            var tags = await _searchService.GetPopularTagsAsync(count);
            return Ok(tags);
        }
    }
}