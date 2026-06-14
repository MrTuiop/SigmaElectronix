namespace SigmaElectronix.Server.DTOs.ReviewDTOs
{
    public class ModerateReviewDto
    {
        public bool IsApproved { get; set; }
        public string? AdminResponse { get; set; } // Менеджер может сразу ответить на отзыв
    }
}
