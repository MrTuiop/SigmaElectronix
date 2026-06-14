namespace SigmaElectronix.Server.Entities.UserModels
{
    public class Reaction
    {
        public int Id { get; set; }

        // Кто поставил лайк/дизлайк
        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        // true = Лайк, false = Дизлайк
        public bool IsLike { get; set; }

        // 🔗 Полиморфная связь: реакция относится ИЛИ к отзыву, ИЛИ к комментарию
        public int? ReviewId { get; set; }
        public Review? Review { get; set; }

        public int? CommentId { get; set; }
        public ReviewComment? Comment { get; set; }
    }
}
