using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.LocationDTOs;
using SigmaElectronix.Server.Entities.StoreModels;
using SigmaElectronix.Server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SigmaElectronix.Server.Services
{
    public class CityService : ICityService
    {
        private readonly ApplicationDbContext _context;

        public CityService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<CityDto>> GetAllAsync()
        {
            return await _context.Cities
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new CityDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    RegionId = c.RegionId,
                    RegionName = c.Region.Name,
                    Latitude = c.Latitude,
                    Longitude = c.Longitude,
                    TimeZone = c.TimeZone
                })
                .ToListAsync();
        }

        public async Task<List<CityDto>> GetByRegionIdAsync(int regionId)
        {
            return await _context.Cities
                .AsNoTracking()
                .Where(c => c.RegionId == regionId)
                .OrderBy(c => c.Name)
                .Select(c => new CityDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    RegionId = c.RegionId,
                    RegionName = c.Region.Name,
                    Latitude = c.Latitude,
                    Longitude = c.Longitude,
                    TimeZone = c.TimeZone
                })
                .ToListAsync();
        }

        public async Task<CityDto?> GetByIdAsync(int id)
        {
            return await _context.Cities
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new CityDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    RegionId = c.RegionId,
                    RegionName = c.Region.Name,
                    Latitude = c.Latitude,
                    Longitude = c.Longitude,
                    TimeZone = c.TimeZone
                })
                .FirstOrDefaultAsync();
        }

        public async Task<CityDto> CreateAsync(CreateUpdateCityDto dto)
        {
            var regionExists = await _context.Regions.AnyAsync(r => r.Id == dto.RegionId);
            if (!regionExists) throw new ArgumentException("Указанный регион не существует.");

            var city = new City
            {
                Name = dto.Name,
                RegionId = dto.RegionId,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                TimeZone = dto.TimeZone
            };

            _context.Cities.Add(city);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(city.Id))!;
        }

        public async Task<CityDto?> UpdateAsync(int id, CreateUpdateCityDto dto)
        {
            var city = await _context.Cities.FindAsync(id);
            if (city == null) return null;

            var regionExists = await _context.Regions.AnyAsync(r => r.Id == dto.RegionId);
            if (!regionExists) throw new ArgumentException("Указанный регион не существует.");

            city.Name = dto.Name;
            city.RegionId = dto.RegionId;
            city.Latitude = dto.Latitude;
            city.Longitude = dto.Longitude;
            city.TimeZone = dto.TimeZone;

            await _context.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var city = await _context.Cities
                .Include(c => c.Stores)
                .Include(c => c.Addresses)
                .Include(c => c.Users)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (city == null) return false;

            // Защита целостности базы данных!
            if (city.Stores.Any() || city.Addresses.Any() || city.Users.Any())
                throw new InvalidOperationException("Нельзя удалить город: к нему привязаны магазины, адреса или пользователи.");

            _context.Cities.Remove(city);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
