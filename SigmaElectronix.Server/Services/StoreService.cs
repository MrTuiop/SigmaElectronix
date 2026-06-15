using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.StoreDTOs;
using SigmaElectronix.Server.Entities.StoreModels;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    public class StoreService : IStoreService
    {
        private readonly ApplicationDbContext _context;

        public StoreService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<StoreDto>> GetAllStoresAsync(bool includeInactive = false)
        {
            var query = _context.Stores.Include(s => s.City).AsNoTracking();

            if (!includeInactive)
                query = query.Where(s => s.IsActive);

            var stores = await query.ToListAsync();
            return stores.Select(MapToDto).ToList();
        }

        public async Task<StoreDto?> GetStoreByIdAsync(int id)
        {
            var store = await _context.Stores
                .Include(s => s.City)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);

            return store == null ? null : MapToDto(store);
        }

        public async Task<StoreDto> CreateStoreAsync(CreateStoreDto dto)
        {
            // 🆕 1. ПРОВЕРКА: Существует ли такой город вообще?
            var cityExists = await _context.Cities.AnyAsync(c => c.Id == dto.CityId);
            if (!cityExists)
                throw new InvalidOperationException($"Город с ID {dto.CityId} не найден в базе данных. Сначала создайте город.");

            // 2. Проверка уникальности кода магазина
            if (await _context.Stores.AnyAsync(s => s.Code == dto.Code))
                throw new InvalidOperationException($"Магазин с кодом {dto.Code} уже существует.");

            var store = new Store
            {
                Name = dto.Name,
                Code = dto.Code,
                CityId = dto.CityId,
                FullAddress = dto.FullAddress,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Phone = dto.Phone,
                Email = dto.Email,
                WorkingHours = dto.WorkingHours,
                IsActive = dto.IsActive,
                Type = dto.Type
            };

            _context.Stores.Add(store);
            await _context.SaveChangesAsync();

            return await GetStoreByIdAsync(store.Id) ?? MapToDto(store);
        }

        public async Task<StoreDto?> UpdateStoreAsync(int id, UpdateStoreDto dto)
        {
            var store = await _context.Stores.Include(s => s.City).FirstOrDefaultAsync(s => s.Id == id);
            if (store == null) return null;

            // Проверка уникальности кода, если он изменился
            if (store.Code != dto.Code && await _context.Stores.AnyAsync(s => s.Code == dto.Code))
                throw new InvalidOperationException($"Магазин с кодом {dto.Code} уже существует.");

            store.Name = dto.Name;
            store.Code = dto.Code;
            store.CityId = dto.CityId;
            store.FullAddress = dto.FullAddress;
            store.Latitude = dto.Latitude;
            store.Longitude = dto.Longitude;
            store.Phone = dto.Phone;
            store.Email = dto.Email;
            store.WorkingHours = dto.WorkingHours;
            store.IsActive = dto.IsActive;
            store.Type = dto.Type;

            await _context.SaveChangesAsync();
            return MapToDto(store);
        }

        // 🚀 В e-commerce магазины НЕ УДАЛЯЮТ физически из базы!
        // Иначе сломается история заказов и таблица инвентаризации. Мы их просто "выключаем".
        public async Task<bool> ToggleStoreStatusAsync(int id)
        {
            var store = await _context.Stores.FindAsync(id);
            if (store == null) return false;

            store.IsActive = !store.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }

        // Вспомогательный метод маппинга
        private StoreDto MapToDto(Store s)
        {
            return new StoreDto
            {
                Id = s.Id,
                Name = s.Name,
                Code = s.Code,
                CityId = s.CityId,
                CityName = s.City?.Name ?? "Неизвестно",
                FullAddress = s.FullAddress,
                Latitude = s.Latitude,
                Longitude = s.Longitude,
                Phone = s.Phone,
                Email = s.Email,
                WorkingHours = s.WorkingHours,
                IsActive = s.IsActive,
                Type = s.Type.ToString()
            };
        }
    }
}