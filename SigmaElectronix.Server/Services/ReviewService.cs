using Microsoft.EntityFrameworkCore;
using SigmaElectronix.Server.Data;
using SigmaElectronix.Server.DTOs.ReviewDTOs;
using SigmaElectronix.Server.Entities.UserModels;
using SigmaElectronix.Server.Services.Interfaces;

namespace SigmaElectronix.Server.Services
{
    public class ReviewService : IReviewService
    {
        private readonly ApplicationDbContext _context;

        public ReviewService(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🔹 Получить только ОДОБРЕННЫЕ отзывы для товара (Витрина)
        public async Task<List<ReviewDto>> GetApprovedProductReviewsAsync(int productId, string? currentUserId = null)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Reactions) // 🆕 Достаем реакции на отзыв
                .Include(r => r.Comments)  // 🆕 Достаем комментарии
                    .ThenInclude(c => c.User) // 🆕 Достаем авторов комментариев
                .Include(r => r.Comments)
                    .ThenInclude(c => c.Reactions) // 🆕 Достаем реакции на комментарии
                .Where(r => r.ProductId == productId && r.IsApproved == true)
                .OrderByDescending(r => r.CreatedAt)
                .AsSplitQuery() // ⚡ Оптимизация для EF Core при множественных Include коллекций
                .ToListAsync();

            return reviews.Select(r => MapToDto(r, currentUserId)).ToList();
        }

        // 🔹 Получить все отзывы конкретного пользователя (Личный кабинет)
        public async Task<List<ReviewDto>> GetUserReviewsAsync(string userId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.Reactions)
                .Include(r => r.Comments).ThenInclude(c => c.User)
                .Include(r => r.Comments).ThenInclude(c => c.Reactions)
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .AsSplitQuery()
                .ToListAsync();

            return reviews.Select(r => MapToDto(r, userId)).ToList();
        }

        // 🔹 Создать отзыв (По умолчанию НЕ одобрен)
        public async Task<ReviewDto> CreateReviewAsync(string userId, CreateReviewDto dto)
        {
            if (dto.Rating < 1 || dto.Rating > 5)
                throw new ArgumentException("Оценка должна быть от 1 до 5.");

            // Защита от дублей: один пользователь = один отзыв на конкретный товар
            var existingReview = await _context.Reviews
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ProductId == dto.ProductId);

            if (existingReview != null)
                throw new InvalidOperationException("Вы уже оставляли отзыв на этот товар.");

            var review = new Review
            {
                UserId = userId,
                ProductId = dto.ProductId,
                Rating = dto.Rating,
                Title = dto.Title,
                Comment = dto.Comment,
                IsApproved = false // 🔒 ЖЕСТКО ЗАДАЕМ FALSE (отправка на модерацию)
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            // Подгружаем пользователя для возврата DTO
            await _context.Entry(review).Reference(r => r.User).LoadAsync();
            return MapToDto(review);
        }

        // 🔹 Получить список отзывов, ожидающих проверки (Для админки)
        public async Task<List<ReviewDto>> GetPendingReviewsAsync()
        {
            var reviews = await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.IsApproved == false)
                .OrderBy(r => r.CreatedAt) // Старые сверху
                .ToListAsync();

            return reviews.Select(r => MapToDto(r)).ToList(); // Для админки лайки и комменты не так важны, можно не подгружать
        }

        // 🔹 Одобрить/отклонить отзыв и добавить ответ магазина (Для админки)
        public async Task<ReviewDto> ModerateReviewAsync(int reviewId, ModerateReviewDto dto)
        {
            var review = await _context.Reviews
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == reviewId);

            if (review == null)
                throw new KeyNotFoundException("Отзыв не найден.");

            review.IsApproved = dto.IsApproved;

            if (!string.IsNullOrWhiteSpace(dto.AdminResponse))
            {
                review.AdminResponse = dto.AdminResponse;
                review.AdminResponseDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // ⚡ ПЕРЕСЧИТЫВАЕМ РЕЙТИНГ (отзыв могли одобрить или, наоборот, скрыть)
            await UpdateProductRatingAsync(review.ProductId);
            await _context.SaveChangesAsync();

            return MapToDto(review);
        }

        // Обновленный вспомогательный маппер
        private static ReviewDto MapToDto(Review review, string? currentUserId = null)
        {
            return new ReviewDto
            {
                Id = review.Id,
                ProductId = review.ProductId,
                UserName = review.User?.UserName ?? "Покупатель",
                Rating = review.Rating,
                Title = review.Title,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt,
                AdminResponse = review.AdminResponse,
                AdminResponseDate = review.AdminResponseDate,

                // 🆕 Считаем лайки и дизлайки отзыва
                LikesCount = review.Reactions?.Count(r => r.IsLike) ?? 0,
                DislikesCount = review.Reactions?.Count(r => !r.IsLike) ?? 0,

                // 🆕 Ищем реакцию текущего пользователя на этот отзыв
                UserReaction = currentUserId == null ? null :
                               review.Reactions?.FirstOrDefault(r => r.UserId == currentUserId)?.IsLike == true ? "Like" :
                               review.Reactions?.FirstOrDefault(r => r.UserId == currentUserId)?.IsLike == false ? "Dislike" : null,

                // 🆕 Маппим комментарии
                Comments = review.Comments?.Select(c => new CommentDto
                {
                    Id = c.Id,
                    UserName = c.User?.UserName ?? "Пользователь",
                    Text = c.Text,
                    CreatedAt = c.CreatedAt,
                    LikesCount = c.Reactions?.Count(r => r.IsLike) ?? 0,
                    DislikesCount = c.Reactions?.Count(r => !r.IsLike) ?? 0,
                    IsMine = currentUserId != null && review.UserId == currentUserId,
                    UserReaction = currentUserId == null ? null :
                                   c.Reactions?.FirstOrDefault(r => r.UserId == currentUserId)?.IsLike == true ? "Like" :
                                   c.Reactions?.FirstOrDefault(r => r.UserId == currentUserId)?.IsLike == false ? "Dislike" : null
                }).OrderBy(c => c.CreatedAt).ToList() ?? new List<CommentDto>(),

                IsMine = currentUserId != null && review.UserId == currentUserId
            };
        }

        public async Task<bool> AddCommentAsync(int reviewId, string userId, string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("Текст комментария пуст");

            // Проверяем, существует ли одобренный отзыв
            var reviewExists = await _context.Reviews.AnyAsync(r => r.Id == reviewId && r.IsApproved);
            if (!reviewExists) return false;

            var comment = new ReviewComment
            {
                ReviewId = reviewId,
                UserId = userId,
                Text = text
            };

            _context.ReviewComments.Add(comment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task ReactToReviewAsync(int reviewId, string userId, bool isLike)
        {
            var existingReaction = await _context.Reactions
                .FirstOrDefaultAsync(r => r.UserId == userId && r.ReviewId == reviewId);

            if (existingReaction != null)
            {
                if (existingReaction.IsLike == isLike)
                    _context.Reactions.Remove(existingReaction); // Отмена лайка/дизлайка
                else
                    existingReaction.IsLike = isLike; // Смена мнения
            }
            else
            {
                _context.Reactions.Add(new Reaction
                {
                    UserId = userId,
                    ReviewId = reviewId,
                    IsLike = isLike
                });
            }

            await _context.SaveChangesAsync();
        }

        public async Task ReactToCommentAsync(int commentId, string userId, bool isLike)
        {
            var existingReaction = await _context.Reactions
                .FirstOrDefaultAsync(r => r.UserId == userId && r.CommentId == commentId);

            if (existingReaction != null)
            {
                if (existingReaction.IsLike == isLike)
                    _context.Reactions.Remove(existingReaction);
                else
                    existingReaction.IsLike = isLike;
            }
            else
            {
                _context.Reactions.Add(new Reaction
                {
                    UserId = userId,
                    CommentId = commentId,
                    IsLike = isLike
                });
            }

            await _context.SaveChangesAsync();
        }

        // Обновление отзыва
        public async Task<ReviewDto> UpdateReviewAsync(int reviewId, string userId, CreateReviewDto dto, bool isAdmin = false)
        {
            var review = await _context.Reviews.Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == reviewId);

            if (review == null) throw new KeyNotFoundException("Отзыв не найден.");

            if (review.UserId != userId && !isAdmin)
                throw new UnauthorizedAccessException("Нет прав на редактирование.");

            review.Title = dto.Title;
            review.Comment = dto.Comment;
            review.Rating = dto.Rating;

            if (!isAdmin) review.IsApproved = false;

            await _context.SaveChangesAsync();

            // ⚡ ПЕРЕСЧИТЫВАЕМ РЕЙТИНГ (оценка изменилась или отзыв скрыт на повторную модерацию)
            await UpdateProductRatingAsync(review.ProductId);
            await _context.SaveChangesAsync();

            return MapToDto(review, userId);
        }

        // Обновление комментария
        public async Task<bool> UpdateCommentAsync(int commentId, string userId, string text, bool isAdmin = false)
        {
            var comment = await _context.ReviewComments
                .FirstOrDefaultAsync(c => c.Id == commentId);

            if (comment == null) return false;

            if (comment.UserId != userId && !isAdmin)
                return false;

            comment.Text = text;
            await _context.SaveChangesAsync();
            return true;
        }

        // 🔹 Удалить отзыв (может автор или админ)
        public async Task<bool> DeleteReviewAsync(int reviewId, string userId, bool isAdmin = false)
        {
            var review = await _context.Reviews.FindAsync(reviewId);
            if (review == null) return false;

            if (review.UserId != userId && !isAdmin)
                throw new UnauthorizedAccessException("Нет прав на удаление.");

            var productId = review.ProductId; // 🆕 Сохраняем ID товара
            var wasApproved = review.IsApproved; // 🆕 Проверяем, влиял ли он на рейтинг

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            // ⚡ ПЕРЕСЧИТЫВАЕМ РЕЙТИНГ, только если удалили одобренный отзыв
            if (wasApproved)
            {
                await UpdateProductRatingAsync(productId);
                await _context.SaveChangesAsync();
            }

            return true;
        }

        // 🔹 Удалить комментарий (может автор или админ)
        public async Task<bool> DeleteCommentAsync(int commentId, string userId, bool isAdmin = false)
        {
            var comment = await _context.ReviewComments.FindAsync(commentId);
            if (comment == null) return false;

            if (comment.UserId != userId && !isAdmin)
                throw new UnauthorizedAccessException("Нет прав на удаление.");

            _context.ReviewComments.Remove(comment);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task UpdateProductRatingAsync(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return;

            // Берем оценки ТОЛЬКО из одобренных отзывов
            var approvedRatings = await _context.Reviews
                .Where(r => r.ProductId == productId && r.IsApproved)
                .Select(r => r.Rating)
                .ToListAsync();

            if (approvedRatings.Any())
            {
                product.ReviewsCount = approvedRatings.Count;
                // Считаем среднее и округляем до 1 знака после запятой (например, 4.5)
                product.AverageRating = Math.Round(approvedRatings.Average(r => (double)r), 1);
            }
            else
            {
                product.ReviewsCount = 0;
                product.AverageRating = 0;
            }
        }
    }
}