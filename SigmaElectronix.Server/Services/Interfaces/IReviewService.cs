using SigmaElectronix.Server.DTOs.ReviewDTOs;

namespace SigmaElectronix.Server.Services.Interfaces
{
    public interface IReviewService
    {
        // Для обычных пользователей
        Task<List<ReviewDto>> GetApprovedProductReviewsAsync(int productId, string? currentUserId = null);
        Task<List<ReviewDto>> GetUserReviewsAsync(string userId);
        Task<ReviewDto> CreateReviewAsync(string userId, CreateReviewDto dto);

        // Для менеджеров/админов
        Task<List<ReviewDto>> GetPendingReviewsAsync();
        Task<ReviewDto> ModerateReviewAsync(int reviewId, ModerateReviewDto dto);

        Task<bool> AddCommentAsync(int reviewId, string userId, string text);
        Task ReactToReviewAsync(int reviewId, string userId, bool isLike);
        Task ReactToCommentAsync(int commentId, string userId, bool isLike);

        Task<ReviewDto> UpdateReviewAsync(int reviewId, string userId, CreateReviewDto dto, bool isAdmin = false);
        Task<bool> UpdateCommentAsync(int commentId, string userId, string text, bool isAdmin = false);

        // Замени старый DeleteReviewAsync на этот:
        Task<bool> DeleteReviewAsync(int reviewId, string userId, bool isAdmin = false);

        // Добавь метод для комментариев:
        Task<bool> DeleteCommentAsync(int commentId, string userId, bool isAdmin = false);
    }
}
