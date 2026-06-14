using static System.Collections.Specialized.BitVector32;

namespace SigmaElectronix.Server.Entities.UserModels
{
    public class ReviewComment
    {
        public int Id { get; set; }

        public int ReviewId { get; set; }
        public Review Review { get; set; } = null!;

        public string UserId { get; set; } = string.Empty;
        public ApplicationUser User { get; set; } = null!;

        public string Text { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Связь "один-ко-многим" для реакций на этот комментарий
        public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();
    }
}
