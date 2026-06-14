namespace SigmaElectronix.Server.DTOs.ReviewDTOs
{
    public class CommentDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        // 🆕 Статистика реакций комментария
        public int LikesCount { get; set; }
        public int DislikesCount { get; set; }
        public string? UserReaction { get; set; } // null, "Like" или "Dislike"
        public bool IsMine { get; set; }
    }
}
