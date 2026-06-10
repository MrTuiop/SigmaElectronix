import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home';
import { ProfilePage } from './pages/profile/profile';
import { CartPage } from './pages/cart/cart';
import { CheckoutPage } from './pages/checkout/checkout';
import { ProductDetailPage } from './pages/product-detail/product-detail';
import { CatalogPage } from './pages/catalog/catalog';
import { ProductCartComponent } from './components/category-components/product-cart/product-cart';
import { ProfileDetailsComponent } from './components/profile-components/profile-details/profile-details';
import { OrdersHistoryComponent } from './components/profile-components/orders-history/orders-history';
import { WishlistComponent } from './components/profile-components/wishlist/wishlist';
import { AddressesComponent } from './components/profile-components/addresses/addresses';
import { NotificationsComponent } from './components/profile-components/notifications/notifications';
import { ReviewsComponent } from './components/profile-components/reviews/reviews';
import { BonusesComponent } from './components/profile-components/bonuses/bonuses';
import { BrandDetailComponent } from './pages/brand-detail/brand-detail';
import { PublicWishlistComponent } from './components/public-components/public-wishlist/public-wishlist';

// Здесь будут прописываться пути для страниц вашего магазина электроники
export const routes: Routes = [
  // Главная страница
  {
    path: '',
    component: HomePage,
    title: 'SigmaElectronix | Магазин электроники' // Опционально: меняет заголовок вкладки браузера
  },

  // Страница аккаунта (будет доступна по адресу /projects/sigmaelectronix/account)
  {
    path: 'profile',
    component: ProfilePage,
    title: 'Мой аккаунт',
    children: [
      { path: '', redirectTo: 'details', pathMatch: 'full' },
      { path: 'details', component: ProfileDetailsComponent },
      { path: 'orders', component: OrdersHistoryComponent },
      { path: 'wishlist', component: WishlistComponent },
      { path: 'addresses', component: AddressesComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'reviews', component: ReviewsComponent },
      { path: 'bonuses', component: BonusesComponent },
    ],
  },

  {
    path: 'wishlist',
    component: PublicWishlistComponent,
    title: 'Мое избранное'
  },

  // Страница корзины (будет доступна по адресу /projects/sigmaelectronix/cart)
  {
    path: 'cart',
    component: CartPage,
    title: 'Корзина'
  },

  // Страница оформления заказа (будет доступна по адресу /projects/sigmaelectronix/cart)
  {
    path: 'checkout',
    component: CheckoutPage,
    title: 'Корзина'
  },

  {
    path: 'catalog',
    component: CatalogPage,
    title: 'Каталог'
  },

  {
    path: 'catalog/:categorySlug',
    component: CatalogPage
  },

  {
    path: 'product/:id/:slug',
    component: ProductDetailPage
  },

  {
    path: 'product/:id',
    component: ProductDetailPage
  },

  {
    path: 'brands/:slug',
    component: BrandDetailComponent
  },

  // Fallback-роут: если пользователь введет абракадабру в адресную строку,
  // его автоматически перекинет на главную
  {
    path: '**',
    redirectTo: ''
  }
];
