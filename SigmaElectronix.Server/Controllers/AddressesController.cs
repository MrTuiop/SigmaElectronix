using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.AddressDTOs;
using SigmaElectronix.Server.Services.Interfaces;
using System.Security.Claims;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Только для залогиненных пользователей!
    public class AddressesController : ControllerBase
    {
        private readonly IAddressService _addressService;

        public AddressesController(IAddressService addressService)
        {
            _addressService = addressService;
        }

        private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value!;

        [HttpGet]
        public async Task<ActionResult<List<AddressDto>>> GetMyAddresses()
        {
            return Ok(await _addressService.GetUserAddressesAsync(GetUserId()));
        }

        [HttpPost]
        public async Task<ActionResult<AddressDto>> Create([FromBody] CreateUpdateAddressDto dto)
        {
            try
            {
                var address = await _addressService.CreateAddressAsync(GetUserId(), dto);
                return Ok(address);
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(new { message = ex.Message }); // Отдаем красивый текст ошибки на клиент
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<AddressDto>> Update(int id, [FromBody] CreateUpdateAddressDto dto)
        {
            try
            {
                var address = await _addressService.UpdateAddressAsync(id, GetUserId(), dto);
                if (address == null) return NotFound(new { message = "Адрес не найден" });
                return Ok(address);
            }
            catch (KeyNotFoundException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _addressService.DeleteAddressAsync(id, GetUserId());
            if (!result) return NotFound();
            return NoContent();
        }
    }
}