using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.StoreDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StoresController : ControllerBase
    {
        private readonly IStoreService _storeService;

        public StoresController(IStoreService storeService)
        {
            _storeService = storeService;
        }

        // 🔹 GET: api/stores (Публичный - для карты на сайте Angular)
        [HttpGet]
        public async Task<ActionResult<List<StoreDto>>> GetAll([FromQuery] bool includeInactive = false)
        {
            // Если запрашивает обычный клиент, показываем только активные (IsActive = true)
            // Если админ - может запросить все (includeInactive = true)
            if (includeInactive && !User.IsInRole("Admin") && !User.IsInRole("Manager"))
            {
                includeInactive = false;
            }

            return Ok(await _storeService.GetAllStoresAsync(includeInactive));
        }

        // 🔹 GET: api/stores/5 (Публичный)
        [HttpGet("{id:int}")]
        public async Task<ActionResult<StoreDto>> GetById(int id)
        {
            var store = await _storeService.GetStoreByIdAsync(id);
            if (store == null) return NotFound(new { message = "Магазин не найден" });

            return Ok(store);
        }

        // 🔹 POST: api/stores (Только для сотрудников)
        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<StoreDto>> Create([FromBody] CreateStoreDto dto)
        {
            try
            {
                var store = await _storeService.CreateStoreAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = store.Id }, store);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // 🔹 PUT: api/stores/5 (Только для сотрудников)
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<StoreDto>> Update(int id, [FromBody] UpdateStoreDto dto)
        {
            try
            {
                var store = await _storeService.UpdateStoreAsync(id, dto);
                if (store == null) return NotFound(new { message = "Магазин не найден" });

                return Ok(store);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        // 🔹 PATCH: api/stores/5/toggle-status (Только для сотрудников)
        [HttpPatch("{id:int}/toggle-status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var success = await _storeService.ToggleStoreStatusAsync(id);
            if (!success) return NotFound(new { message = "Магазин не найден" });

            return NoContent();
        }
    }
}