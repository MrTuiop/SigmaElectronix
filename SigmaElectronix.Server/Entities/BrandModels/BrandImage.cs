namespace SigmaElectronix.Server.Entities.BrandModels
{
    public class BrandImage
    {
        public int Id { get; set; }
        public int BrandId { get; set; }
        public Brand Brand { get; set; } = null!;
        public string Url { get; set; } = string.Empty;
        public string? AltText { get; set; }
        public string? Caption { get; set; }      // Подпись под фото
        public int SortOrder { get; set; }

        // Тип изображения: Gallery, Banner, Lifestyle
        public string ImageType { get; set; } = "Gallery";
    }
}
