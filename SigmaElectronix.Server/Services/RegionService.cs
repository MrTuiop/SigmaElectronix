using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.LocationDTOs;
using SigmaElectronix.Server.Entities.StoreModels;
using SigmaElectronix.Server.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SigmaElectronix.Server.Services
{
    public class RegionService : IRegionService
    {
        private readonly ApplicationDbContext _context;

        public RegionService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<RegionDto>> GetAllAsync()
        {
            return await _context.Regions
                .AsNoTracking()
                .OrderBy(r => r.Name)
                .Select(r => new RegionDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Code = r.Code,
                    CitiesCount = r.Cities.Count
                })
                .ToListAsync();
        }

        public async Task<RegionDto?> GetByIdAsync(int id)
        {
            return await _context.Regions
                .AsNoTracking()
                .Where(r => r.Id == id)
                .Select(r => new RegionDto
                {
                    Id = r.Id,
                    Name = r.Name,
                    Code = r.Code,
                    CitiesCount = r.Cities.Count
                })
                .FirstOrDefaultAsync();
        }

        public async Task<RegionDto> CreateAsync(CreateUpdateRegionDto dto)
        {
            var region = new Region
            {
                Name = dto.Name,
                Code = dto.Code
            };

            _context.Regions.Add(region);
            await _context.SaveChangesAsync();

            return (await GetByIdAsync(region.Id))!;
        }

        public async Task<RegionDto?> UpdateAsync(int id, CreateUpdateRegionDto dto)
        {
            var region = await _context.Regions.FindAsync(id);
            if (region == null) return null;

            region.Name = dto.Name;
            region.Code = dto.Code;

            await _context.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var region = await _context.Regions
                .Include(r => r.Cities)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (region == null) return false;

            // Защита от нарушения целостности БД
            if (region.Cities.Any())
                throw new InvalidOperationException("Нельзя удалить регион, в котором есть города.");

            _context.Regions.Remove(region);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
