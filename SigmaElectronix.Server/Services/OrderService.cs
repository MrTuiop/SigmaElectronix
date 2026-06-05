//using Microsoft.EntityFrameworkCore;
//using SigmaElectronix.Server.Entities.OrderModels;

//namespace SigmaElectronix.Server.Services
//{
//    public class OrderService
//    {
//        public async Task<Order> CreateOrderAsync(Order order)
//        {
//            bool isUnique = false;

//            while (!isUnique)
//            {
//                // Генерируем номер: Дата + 4 случайных символа
//                order.OrderNumber = $"{DateTime.UtcNow:yyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper()}";

//                // Проверяем, нет ли уже такого номера в базе данных
//                var exists = await _context.Orders.AnyAsync(o => o.OrderNumber == order.OrderNumber);
//                if (!exists)
//                {
//                    isUnique = true;
//                }
//            }

//            _context.Orders.Add(order);
//            await _context.SaveChangesAsync();
//            return order;
//        }
//    }
//}
