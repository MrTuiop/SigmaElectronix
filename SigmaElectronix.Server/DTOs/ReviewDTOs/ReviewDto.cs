namespace SigmaElectronix.Server.DTOs.ReviewDTOs
{
    public class ReviewDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? AdminResponse { get; set; }
        public DateTime? AdminResponseDate { get; set; }

        // 🆕 Статистика реакций отзыва
        public int LikesCount { get; set; }
        public int DislikesCount { get; set; }
        public string? UserReaction { get; set; } // null, "Like" или "Dislike" (для подсветки кнопки у юзера)

        // 🆕 Список комментариев к отзыву
        public List<CommentDto> Comments { get; set; } = new();
        public bool IsMine { get; set; }
    }
}
