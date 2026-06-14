using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.StoreDTOs;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StoreInventoriesController : ControllerBase
    {
        private readonly IStoreInventoryService _inventoryService;

        public StoreInventoriesController(IStoreInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        // 🔹 GET: api/storeinventories/store/5
        [HttpGet("store/{storeId:int}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<List<StoreInventoryDto>>> GetByStore(int storeId)
        {
            return Ok(await _inventoryService.GetInventoryByStoreAsync(storeId));
        }

        // 🔹 GET: api/storeinventories/product/10
        // (Этот метод можно сделать публичным, если хочешь показывать на сайте наличие в магазинах)
        [HttpGet("product/{productId:int}")]
        public async Task<ActionResult<List<StoreInventoryDto>>> GetByProduct(int productId)
        {
            return Ok(await _inventoryService.GetInventoryByProductAsync(productId));
        }

        // 🔹 GET: api/storeinventories/store/5/product/10/history
        // Просмотр истории движения конкретного товара в магазине
        [HttpGet("store/{storeId:int}/product/{productId:int}/history")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<List<TransactionHistoryDto>>> GetHistory(int storeId, int productId)
        {
            return Ok(await _inventoryService.GetProductHistoryInStoreAsync(storeId, productId));
        }

        // 🔹 PATCH: api/storeinventories/store/5/product/10/reservable
        [HttpPatch("store/{storeId:int}/product/{productId:int}/reservable")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateReservable(int storeId, int productId, [FromBody] UpdateInventorySettingsDto dto)
        {
            var result = await _inventoryService.UpdateReservableStatusAsync(storeId, productId, dto);
            if (!result)
                return NotFound(new { message = "Запись об остатках не найдена" });

            return NoContent();
        }
    }
}