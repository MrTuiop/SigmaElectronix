using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.TranslationDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LanguagesController : ControllerBase
    {
        private readonly ILanguageService _languageService;

        public LanguagesController(ILanguageService languageService)
        {
            _languageService = languageService;
        }

        // GET: api/languages - публичный метод для сайта (только активные)
        [HttpGet]
        public async Task<ActionResult<List<LanguageDto>>> GetAll([FromQuery] bool includeInactive = false)
        {
            // Гости видят только активные языки. Админ может видеть все.
            if (includeInactive && !User.IsInRole("Admin") && !User.IsInRole("Manager"))
            {
                includeInactive = false;
            }

            return Ok(await _languageService.GetAllAsync(includeInactive));
        }

        // GET: api/languages/ru
        [HttpGet("{code}")]
        public async Task<ActionResult<LanguageDto>> GetByCode(string code)
        {
            var language = await _languageService.GetByCodeAsync(code);
            if (language == null) return NotFound(new { message = "Язык не найден" });

            return Ok(language);
        }

        // POST: api/languages (Админ)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<LanguageDto>> Create([FromBody] CreateUpdateLanguageDto dto)
        {
            try
            {
                var language = await _languageService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetByCode), new { code = language.Code }, language);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // PUT: api/languages/ru (Админ)
        [HttpPut("{code}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<LanguageDto>> Update(string code, [FromBody] CreateUpdateLanguageDto dto)
        {
            try
            {
                var language = await _languageService.UpdateAsync(code, dto);
                if (language == null) return NotFound();

                return Ok(language);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PATCH: api/languages/ru/toggle-status (Админ)
        [HttpPatch("{code}/toggle-status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleStatus(string code)
        {
            try
            {
                var success = await _languageService.ToggleActiveStatusAsync(code);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PATCH: api/languages/ru/set-default (Админ)
        [HttpPatch("{code}/set-default")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetDefault(string code)
        {
            try
            {
                var success = await _languageService.SetDefaultAsync(code);
                if (!success) return NotFound();
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}