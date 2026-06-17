using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.AddressDTOs;
using SigmaElectronix.Server.Entities.UserModels;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    public class AddressService : IAddressService
    {
        private readonly ApplicationDbContext _context;

        public AddressService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<AddressDto>> GetUserAddressesAsync(string userId)
        {
            var addresses = await _context.Addresses
                .Include(a => a.City) // 👈 ВЕРНУЛИ: подгружаем город
                .AsNoTracking()
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ToListAsync();

            return addresses.Select(MapToDto).ToList();
        }

        public async Task<AddressDto> CreateAddressAsync(string userId, CreateUpdateAddressDto dto)
        {
            // 👈 ДОБАВИЛИ: Проверяем, существует ли такой город в БД
            var city = await _context.Cities.FindAsync(dto.CityId);
            if (city == null) throw new KeyNotFoundException("Выбранный город не найден.");

            await HandleDefaultAddressLogicAsync(userId, dto.IsDefault);

            var address = new Address
            {
                UserId = userId,
                Title = dto.Title,
                CityId = dto.CityId, // 👈 Сохраняем ID связи
                Street = dto.Street,
                Building = dto.Building,
                Apartment = dto.Apartment,
                PostalCode = dto.PostalCode,
                IsDefault = dto.IsDefault,
                RecipientName = dto.RecipientName,
                RecipientPhone = dto.RecipientPhone
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            // 👈 Подкидываем город в объект, чтобы MapToDto не выдал null
            address.City = city;

            return MapToDto(address);
        }

        public async Task<AddressDto?> UpdateAddressAsync(int id, string userId, CreateUpdateAddressDto dto)
        {
            var address = await _context.Addresses
                .Include(a => a.City) // 👈 ВЕРНУЛИ Include
                .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);

            if (address == null) return null;

            // 👈 Проверяем город, если пользователь решил его изменить
            if (address.CityId != dto.CityId)
            {
                var city = await _context.Cities.FindAsync(dto.CityId);
                if (city == null) throw new KeyNotFoundException("Выбранный город не найден.");
                address.City = city; // Обновляем объект города
                address.CityId = dto.CityId;
            }

            if (dto.IsDefault && !address.IsDefault)
            {
                await HandleDefaultAddressLogicAsync(userId, true);
            }

            address.Title = dto.Title;
            address.Street = dto.Street;
            address.Building = dto.Building;
            address.Apartment = dto.Apartment;
            address.PostalCode = dto.PostalCode;
            address.IsDefault = dto.IsDefault;
            address.RecipientName = dto.RecipientName;
            address.RecipientPhone = dto.RecipientPhone;

            await _context.SaveChangesAsync();
            return MapToDto(address);
        }

        public async Task<bool> DeleteAddressAsync(int id, string userId)
        {
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
            if (address == null) return false;

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();
            return true;
        }

        // --- Вспомогательные методы ---
        private async Task HandleDefaultAddressLogicAsync(string userId, bool isSettingDefault)
        {
            if (isSettingDefault)
            {
                var existingDefaults = await _context.Addresses.Where(a => a.UserId == userId && a.IsDefault).ToListAsync();
                foreach (var addr in existingDefaults)
                {
                    addr.IsDefault = false;
                }
            }
        }

        private AddressDto MapToDto(Address a)
        {
            var fullStreet = $"{a.Street}, д. {a.Building}";
            if (!string.IsNullOrWhiteSpace(a.Apartment)) fullStreet += $", кв. {a.Apartment}";

            return new AddressDto
            {
                Id = a.Id,
                Title = string.IsNullOrWhiteSpace(a.Title) ? "Мой адрес" : a.Title,
                Street = fullStreet,

                CityId = a.CityId, // 👈 Передаем ID города для формы редактирования на фронте
                City = a.City?.Name ?? "Неизвестно", // 👈 Берем красивое НАЗВАНИЕ города из связанной таблицы

                Zip = a.PostalCode,
                IsDefault = a.IsDefault,

                OriginalStreet = a.Street,
                OriginalBuilding = a.Building,
                OriginalApartment = a.Apartment
            };
        }
    }
}