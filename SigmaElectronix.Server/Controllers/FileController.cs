using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _context; // 👈 Добавили контекст БД
        private const string UploadsFolderName = "uploads";
        private const string RequestPathPrefix = "/uploads";

        public FileController(IWebHostEnvironment env, ApplicationDbContext context)
        {
            _env = env;
            _context = context;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string folder = "products", [FromQuery] string? entityId = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Файл не выбран");

            var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRootPath, UploadsFolderName, "images", folder);

            Directory.CreateDirectory(uploadsFolder);

            string fileName;
            if (!string.IsNullOrEmpty(entityId))
            {
                var existingFiles = Directory.GetFiles(uploadsFolder, $"{folder}-{entityId}.*");
                foreach (var oldFile in existingFiles)
                    System.IO.File.Delete(oldFile);

                fileName = $"{folder}-{entityId}{Path.GetExtension(file.FileName)}";
            }
            else
            {
                fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            }

            var filePath = Path.Combine(uploadsFolder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var relativeUrl = $"{RequestPathPrefix}/images/{folder}/{fileName}";
            return Ok(new { url = relativeUrl });
        }

        [HttpPost("upload-gallery")]
        public async Task<IActionResult> UploadGallery(IFormFile[] files, [FromQuery] int productId)
        {
            if (files == null || files.Length == 0)
                return BadRequest("Файлы не выбраны");

            var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRootPath, UploadsFolderName, "images", "product-gallery");

            Directory.CreateDirectory(uploadsFolder);
            var uploadedUrls = new List<string>();

            foreach (var file in files)
            {
                var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                uploadedUrls.Add($"{RequestPathPrefix}/images/product-gallery/{uniqueFileName}");
            }

            return Ok(new { urls = uploadedUrls });
        }

        [HttpDelete("delete")]
        public async Task<IActionResult> DeleteImage([FromQuery] string url)
        {
            if (string.IsNullOrEmpty(url))
                return BadRequest("URL не указан");

            var relativePath = url.Replace(RequestPathPrefix, "").TrimStart('/');
            var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var filePath = Path.Combine(webRootPath, UploadsFolderName, relativePath);

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
                return Ok(new { success = true });
            }

            return NotFound();
        }

        // 🚀 НОВЫЙ МЕТОД: Умное чтение файловой системы для админки
        [HttpGet("list")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetFiles([FromQuery] string? folder = null)
        {
            var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var baseImagesPath = Path.Combine(webRootPath, UploadsFolderName, "images");

            if (!Directory.Exists(baseImagesPath))
                return Ok(new { folders = new List<string>(), files = new List<object>() });

            // Если папка не указана, возвращаем список подпапок
            if (string.IsNullOrEmpty(folder))
            {
                var directories = Directory.GetDirectories(baseImagesPath)
                    .Select(d => new
                    {
                        Name = Path.GetFileName(d),
                        FilesCount = Directory.GetFiles(d).Length
                    }).ToList();

                return Ok(new { folders = directories, files = new List<object>() });
            }

            // Если папка указана, сканируем файлы и ищем их владельцев в БД
            var targetFolder = Path.Combine(baseImagesPath, folder);
            if (!Directory.Exists(targetFolder))
                return NotFound(new { message = "Папка не найдена" });

            var filePaths = Directory.GetFiles(targetFolder);
            var filesList = new List<object>();

            foreach (var file in filePaths)
            {
                var fileName = Path.GetFileName(file);
                var url = $"{RequestPathPrefix}/images/{folder}/{fileName}";
                string? entityName = null;

                // 🧠 Умный поиск привязки в БД по URL
                try
                {
                    if (folder == "brands")
                    {
                        var brand = await _context.Brands.FirstOrDefaultAsync(b => b.LogoUrl == url || b.HeroImageUrl == url);
                        entityName = brand?.Name;
                    }
                    else if (folder == "categories")
                    {
                        var cat = await _context.Categories.FirstOrDefaultAsync(c => c.ImageUrl == url);
                        entityName = cat?.Name;
                    }
                    else if (folder == "products" || folder == "product-gallery")
                    {
                        var product = await _context.Products.FirstOrDefaultAsync(p => p.Images.Any(i => i.Url == url));
                        entityName = product?.Name;
                    }
                    else if (folder == "avatars")
                    {
                        var user = await _context.Users.FirstOrDefaultAsync(u =>
                            u.AvatarUrl != null && u.AvatarUrl.StartsWith(url));

                        if (user != null)
                        {
                            var fullName = $"{user.FirstName} {user.LastName}".Trim();
                            // Если имя не указано, выводим UserName, чтобы бейдж не был пустым
                            entityName = string.IsNullOrEmpty(fullName) ? user.UserName : fullName;
                        }
                    }
                }
                catch { /* Игнорируем ошибки привязки, чтобы файл все равно вывелся */ }

                filesList.Add(new
                {
                    Name = fileName,
                    Url = url,
                    SizeInBytes = new FileInfo(file).Length,
                    CreatedAt = new FileInfo(file).CreationTimeUtc,
                    EntityName = entityName
                });
            }

            // Сортируем новые файлы наверх
            var sortedFiles = filesList.OrderByDescending(f => (DateTime)f.GetType().GetProperty("CreatedAt")!.GetValue(f, null)).ToList();
            return Ok(new { folders = new List<object>(), files = sortedFiles });
        }
    }
}