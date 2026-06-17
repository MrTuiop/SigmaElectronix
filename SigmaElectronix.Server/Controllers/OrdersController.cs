using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.OrderDTOs;
using SigmaElectronix.Server.Services.Interfaces;
using System.Security.Claims;

namespace SigmaElectronix.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly IPaymentService _paymentService;

        public OrdersController(IOrderService orderService, IPaymentService paymentService)
        {
            _orderService = orderService;
            _paymentService = paymentService;
        }

        // === Хелпер для получения userId ===
        private string? GetCurrentUserId() =>
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        private bool IsAdmin() =>
            User.IsInRole("Admin");

        // ============================================
        // POST /api/orders
        // ============================================
        [HttpPost]
        [AllowAnonymous]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            try
            {
                var order = await _orderService.CreateOrderAsync(GetCurrentUserId(), dto);

                return CreatedAtAction(
                    nameof(GetById),
                    new { id = order.Id },
                    order);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = "business_rule", message = ex.Message });
            }
        }

        // ============================================
        // GET /api/orders/{id}
        // ============================================
        [HttpGet("{id:int}")]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _orderService.GetByIdAsync(id);
            if (order == null) return NotFound();

            var userId = GetCurrentUserId();
            if (order.UserId != userId && !IsAdmin())
                return Forbid();

            return Ok(order);
        }

        // ============================================
        // GET /api/orders/my
        // ============================================
        [HttpGet("my")]
        [ProducesResponseType(typeof(List<OrderDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var orders = await _orderService.GetUserOrdersAsync(userId);
            return Ok(orders);
        }

        // ============================================
        // GET /api/orders
        // ============================================
        [HttpGet]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(List<OrderDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var orders = await _orderService.GetAllOrdersAsync();
            return Ok(orders);
        }

        // ============================================
        // PATCH /api/orders/{id}/status
        // ============================================
        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            var order = await _orderService.UpdateStatusAsync(id, dto.Status);
            return order == null ? NotFound() : Ok(order);
        }

        // ============================================
        // POST /api/orders/{id}/cancel
        // ============================================
        [HttpPost("{id:int}/cancel")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Cancel(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                var success = await _orderService.CancelOrderAsync(id, userId);
                return success
                    ? Ok(new { message = "Заказ отменён" })
                    : NotFound(new { error = "not_found", message = "Заказ не найден" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = "business_rule", message = ex.Message });
            }
        }

        // ============================================
        // POST /api/orders/{id}/pay
        // ============================================
        [HttpPost("{id:int}/pay")]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Pay(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                // 1. Оплачиваем заказ (PaymentService переведет статус в Paid)
                var order = await _paymentService.ProcessPaymentAsync(id, userId);

                // 2. 🚀 ТРИГГЕРИМ НАЧИСЛЕНИЕ БОНУСОВ!
                await _orderService.AwardCashbackAsync(id);

                return Ok(order);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = "payment_failed", message = ex.Message });
            }
        }

        // ============================================
        // POST /api/orders/{id}/pay-in-store
        // ============================================
        [HttpPost("{id:int}/pay-in-store")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PayInStore(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                    return Unauthorized();

                // 1. Менеджер подтверждает оплату в магазине
                var order = await _paymentService.MarkAsPaidInStoreAsync(id, userId);

                // 2. 🚀 ТРИГГЕРИМ НАЧИСЛЕНИЕ БОНУСОВ!
                await _orderService.AwardCashbackAsync(id);

                return Ok(order);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = "payment_failed", message = ex.Message });
            }
        }
    }
}