using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SigmaElectronix.Server.DTOs.ReviewDTOs;
using SigmaElectronix.Server.Services.Interfaces;
using System.Security.Claims;

namespace SigmaElectronix.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        // 🔹 1. ПУБЛИЧНЫЙ: Получить одобренные отзывы для товара
        [HttpGet("product/{productId:int}")]
        public async Task<ActionResult<List<ReviewDto>>> GetProductReviews(int productId)
        {
            // Пытаемся получить ID пользователя, если он авторизован (полезно для подсветки лайков)
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            var reviews = await _reviewService.GetApprovedProductReviewsAsync(productId, userId);
            return Ok(reviews);
        }

        // 🔹 2. АВТОРИЗОВАННЫЙ: Создать отзыв
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ReviewDto>> CreateReview([FromBody] CreateReviewDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            try
            {
                var review = await _reviewService.CreateReviewAsync(userId, dto);
                return Ok(review);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message }); // "Уже оставляли отзыв"
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message }); // "Рейтинг от 1 до 5"
            }
        }

        // 🔹 3. АВТОРИЗОВАННЫЙ: Получить мои отзывы (для страницы Профиля)
        [HttpGet("my-reviews")]
        [Authorize]
        public async Task<ActionResult<List<ReviewDto>>> GetMyReviews()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var reviews = await _reviewService.GetUserReviewsAsync(userId);
            return Ok(reviews);
        }

        // ==========================================
        //         МЕТОДЫ ДЛЯ АДМИНИСТРАТОРОВ
        // ==========================================

        // 🔹 4. АДМИН: Получить отзывы на модерацию
        [HttpGet("pending")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<List<ReviewDto>>> GetPendingReviews()
        {
            var reviews = await _reviewService.GetPendingReviewsAsync();
            return Ok(reviews);
        }

        // 🔹 5. АДМИН: Одобрить/отклонить отзыв и дать ответ
        [HttpPut("{id}/moderate")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<ReviewDto>> ModerateReview(int id, [FromBody] ModerateReviewDto dto)
        {
            try
            {
                var review = await _reviewService.ModerateReviewAsync(id, dto);
                return Ok(review);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // 🔹 7. АВТОРИЗОВАННЫЙ: Оставить комментарий к отзыву
        [HttpPost("{reviewId}/comments")]
        [Authorize]
        public async Task<IActionResult> AddComment(int reviewId, [FromBody] CreateCommentRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            try
            {
                var success = await _reviewService.AddCommentAsync(reviewId, userId, request.Text);
                if (!success) return NotFound(new { message = "Отзыв не найден или еще не одобрен." });

                return Ok(new { message = "Комментарий успешно добавлен" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // 🔹 8. АВТОРИЗОВАННЫЙ: Поставить лайк/дизлайк ОТЗЫВУ (или убрать его)
        [HttpPost("{reviewId}/react")]
        [Authorize]
        public async Task<IActionResult> ReactToReview(int reviewId, [FromBody] SetReactionRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            await _reviewService.ReactToReviewAsync(reviewId, userId, request.IsLike);
            return Ok();
        }

        // 🔹 9. АВТОРИЗОВАННЫЙ: Поставить лайк/дизлайк КОММЕНТАРИЮ
        [HttpPost("comments/{commentId}/react")]
        [Authorize]
        public async Task<IActionResult> ReactToComment(int commentId, [FromBody] SetReactionRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            await _reviewService.ReactToCommentAsync(commentId, userId, request.IsLike);
            return Ok();
        }

        // 🔹 PUT: api/reviews/{id}
        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<ActionResult<ReviewDto>> UpdateReview(int id, [FromBody] CreateReviewDto dto)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager"); // Проверка на админа

            try
            {
                var review = await _reviewService.UpdateReviewAsync(id, userId!, dto, isAdmin);
                return Ok(review);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // 🔹 PUT: api/reviews/comments/{id}
        [HttpPut("comments/{id:int}")]
        [Authorize]
        public async Task<IActionResult> UpdateComment(int id, [FromBody] CreateCommentRequest request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");

            var result = await _reviewService.UpdateCommentAsync(id, userId!, request.Text, isAdmin);
            if (!result) return NotFound();

            return NoContent();
        }

        // 🔹 6. АВТОРИЗОВАННЫЙ: Удалить отзыв (свой или любой, если админ)
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");

            try
            {
                var result = await _reviewService.DeleteReviewAsync(id, userId!, isAdmin);
                if (!result) return NotFound();
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // 🔹 10. АВТОРИЗОВАННЫЙ: Удалить комментарий
        [HttpDelete("comments/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin") || User.IsInRole("Manager");

            try
            {
                var result = await _reviewService.DeleteCommentAsync(id, userId!, isAdmin);
                if (!result) return NotFound();
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }
    }
}