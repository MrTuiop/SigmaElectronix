using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.InventoryDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Manager")] // Доступ только для сотрудников
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpPost("receive")]
        public async Task<IActionResult> ReceiveStock([FromBody] ReceiveStockDto dto)
        {
            try
            {
                await _inventoryService.ReceiveStockAsync(dto);
                return Ok(new { message = "Товар успешно оприходован на склад." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("transfer")]
        public async Task<IActionResult> TransferStock([FromBody] TransferStockDto dto)
        {
            try
            {
                await _inventoryService.TransferStockAsync(dto);
                return Ok(new { message = "Товар успешно перемещен." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}