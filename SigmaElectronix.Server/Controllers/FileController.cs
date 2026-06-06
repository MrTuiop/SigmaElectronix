using Microsoft.AspNetCore.Mvc;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;
        private const string UploadsFolderName = "uploads";
        private const string RequestPathPrefix = "/uploads";

        public FileController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string folder = "products", [FromQuery] string? entityId = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Файл не выбран");

            // Формируем путь: wwwroot/uploads/images/{folder}
            var webRootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRootPath, UploadsFolderName, "images", folder);

            Directory.CreateDirectory(uploadsFolder);

            string fileName;

            if (!string.IsNullOrEmpty(entityId))
            {
                // Удаляем старые файлы с этим ID
                var existingFiles = Directory.GetFiles(uploadsFolder, $"{folder}-{entityId}.*");
                foreach (var oldFile in existingFiles)
                {
                    System.IO.File.Delete(oldFile);
                }

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

            // Возвращаем URL с префиксом /uploads
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

            // Убираем префикс /uploads из URL
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
    }
}