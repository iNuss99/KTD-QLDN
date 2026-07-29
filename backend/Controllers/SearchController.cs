using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using techretail_api.Services;

namespace techretail_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ISearchService _searchService;

        public SearchController(ISearchService searchService)
        {
            _searchService = searchService;
        }

        [HttpGet]
        public async Task<IActionResult> GlobalSearch([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new SearchResultDto());
            }

            var results = await _searchService.GlobalSearchAsync(q);
            return Ok(results);
        }
    }
}
