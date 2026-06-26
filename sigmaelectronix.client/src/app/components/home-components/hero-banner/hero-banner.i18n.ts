export const HERO_I18N = {
  ru: {
    slide1: {
      badgeText: 'Специальное предложение',
      titlePart1: 'Техника, которая ',
      titleHighlight: 'вдохновляет',
      subtitle: 'Скидки до 30% на новинки сезона. Бесплатная доставка по всей России при заказе от 5 000 ₽.',
      btnPrimaryText: 'Смотреть новинки',
      btnSecondaryText: 'Все товары',
    },
    slide2: {
      badgeText: 'Гейминг без границ',
      titlePart1: 'Новая реальность ',
      titleHighlight: 'в играх',
      subtitle: 'Мощные ноутбуки и периферия для профессиональных геймеров. Побеждай с нами!',
      btnPrimaryText: 'Выбрать ноутбук',
      btnSecondaryText: 'Смотреть хиты',
    },
    slide3: {
      badgeText: 'Звук вокруг',
      titlePart1: 'Почувствуй каждый ',
      titleHighlight: 'бит',
      subtitle: 'Премиальные наушники с активным шумоподавлением. Полное погружение в музыку.',
      btnPrimaryText: 'Купить аудио',
      btnSecondaryText: 'Новинки',
    },
  },
  en: {
    slide1: {
      badgeText: 'Special Offer',
      titlePart1: 'Tech that ',
      titleHighlight: 'inspires',
      subtitle: 'Up to 30% off new arrivals. Free delivery across Russia on orders over 5 000 ₽.',
      btnPrimaryText: 'View New Arrivals',
      btnSecondaryText: 'All Products',
    },
    slide2: {
      badgeText: 'Gaming Without Limits',
      titlePart1: 'A new reality ',
      titleHighlight: 'in gaming',
      subtitle: 'Powerful laptops and peripherals for pro gamers. Win with us!',
      btnPrimaryText: 'Choose a Laptop',
      btnSecondaryText: 'Best Sellers',
    },
    slide3: {
      badgeText: 'Surround Sound',
      titlePart1: 'Feel every ',
      titleHighlight: 'beat',
      subtitle: 'Premium headphones with active noise cancellation. Complete immersion in music.',
      btnPrimaryText: 'Shop Audio',
      btnSecondaryText: 'New Arrivals',
    },
  },
  uz: {
    slide1: {
      badgeText: 'Maxsus taklif',
      titlePart1: 'Ilhomlantiruvchi ',
      titleHighlight: 'texnika',
      subtitle: 'Yangi mahsulotlarga 30% gacha chegirma. 5 000 ₽ dan ortiq buyurtmalarga butun Rossiyada bepul yetkazib berish.',
      btnPrimaryText: 'Yangi mahsulotlar',
      btnSecondaryText: 'Barcha mahsulotlar',
    },
    slide2: {
      badgeText: 'Chegarasiz o\'yin',
      titlePart1: 'O\'yinlarda ',
      titleHighlight: 'yangi voqelik',
      subtitle: 'Professional o\'yinchilar uchun kuchli noutbuklar va periferiya. Biz bilan g\'alaba qozoning!',
      btnPrimaryText: 'Noutbuk tanlash',
      btnSecondaryText: 'Hitlar',
    },
    slide3: {
      badgeText: 'Atrofdagi ovoz',
      titlePart1: 'Har bir ',
      titleHighlight: 'ritmni his qiling',
      subtitle: 'Faol shovqinni bostirish bilan premium quloqchinlar. Musiqaga to\'liq sho\'ng\'ish.',
      btnPrimaryText: 'Audio sotib olish',
      btnSecondaryText: 'Yangi mahsulotlar',
    },
  },
} as const;

// Тип для безопасности
export type HeroSlideTranslation = typeof HERO_I18N.ru.slide1;
