namespace SigmaElectronix.Server.DTOs.ReviewDTOs
{
    public class CreateReviewDto
    {
        public int ProductId { get; set; }
        public int Rating { get; set; } // Обязательно проверяем, что от 1 до 5
        public string Title { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
    }
}
