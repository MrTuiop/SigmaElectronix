using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.TranslationDTOs;
using SigmaElectronix.Server.Services;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UiTranslationsController : ControllerBase
    {
        private readonly IUiTranslationService _service;

        public UiTranslationsController(IUiTranslationService service)
        {
            _service = service;
        }

        // 🟢 ОТКРЫТЫЙ ЭНДПОИНТ (вызывает ngx-translate)
        // GET: api/uitranslations/{lang}
        [HttpGet("{lang}")]
        public async Task<IActionResult> GetClientTranslations(string lang)
        {
            var dict = await _service.GetTranslationsForClientAsync(lang);
            return Ok(dict);
        }

        // 🔴 ЗАКРЫТЫЕ ЭНДПОИНТЫ ДЛЯ АДМИНКИ
        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<List<UiTranslationDto>>> GetAll()
        {
            return Ok(await _service.GetAllAsync());
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<UiTranslationDto>> Create([FromBody] CreateUpdateUiTranslationDto dto)
        {
            return Ok(await _service.CreateAsync(dto));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<UiTranslationDto>> Update(int id, [FromBody] CreateUpdateUiTranslationDto dto)
        {
            return Ok(await _service.UpdateAsync(id, dto));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            return success ? NoContent() : NotFound();
        }
    }
}