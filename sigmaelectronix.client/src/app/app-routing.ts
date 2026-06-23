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
import { BrandsComponent } from './pages/brands/brands';
import { ManagerPage } from './pages/manager/manager';
import { ManagerCategoriesComponent } from './components/manager-components/manager-categories/manager-categories';
import { ManagerProductsComponent } from './components/manager-components/manager-products/manager-products';
import { ManagerBrandsComponent } from './components/manager-components/manager-brands/manager-brands';
import { MainLayout } from './layouts/main-layout/main-layout';
import { ManagerReviewsComponent } from './components/manager-components/manager-reviews/manager-reviews';
import { ManagerStoresComponent } from './components/manager-components/manager-stores/manager-stores';
import { ManagerCitiesComponent } from './components/manager-components/manager-cities/manager-cities';
import { ManagerRegionsComponent } from './components/manager-components/manager-regions/manager-regions';
import { ManagerInventoryComponent } from './components/manager-components/manager-inventory/manager-inventory';
import { ManagerTransfersComponent } from './components/manager-components/manager-transfers/manager-transfers';
import { ManagerOrdersComponent } from './components/manager-components/manager-orders/manager-orders';
import { ManagerCouponsComponent } from './components/manager-components/manager-coupons/manager-coupons';
import { PublicStoresComponent } from './pages/public-stores/public-stores';
import { PaymentPageComponent } from './pages/payment-page/payment-page';
import { managerGuard } from './guards/manager-guard';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';
import { ManagerUsersComponent } from './components/manager-components/manager-users/manager-users';
import { ManagerPageEditorComponent } from './components/manager-components/manager-page-editor/manager-page-editor';
import { ManagerFilesComponent } from './components/manager-components/manager-files/manager-files';
import { ManagerDashboardComponent } from './components/manager-components/manager-dashboard/manager-dashboard';
import { ManagerLanguagesComponent } from './components/manager-components/manager-languages/manager-languages';
import { ManagerTranslationsProductsComponent } from './components/manager-components/manager-translations-products/manager-translations-products';
import { ManagerTranslationsCategoriesComponent } from './components/manager-components/manager-translations-categories/manager-translations-categories';
import { ManagerTranslationsBrandsComponent } from './components/manager-components/manager-translations-brands/manager-translations-brands';
import { DeliveryPage } from './pages/delivery/delivery';
import { WarrantyPage } from './pages/warranty/warranty';
import { AboutPage } from './pages/about/about';
import { ManagerUiTranslationsComponent } from './components/manager-components/manager-ui-translations/manager-ui-translations';

// Здесь будут прописываться пути для страниц вашего магазина электроники
export const routes: Routes = [
  // ==========================================
  // 1. АДМИНСКАЯ ЧАСТЬ (Макет Менеджера)
  // ==========================================
  {
    path: 'manager',
    component: ManagerPage, // Выступает как Layout для админки (со своим сайдбаром)
    canActivate: [managerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: ManagerDashboardComponent,
        title: 'Обзор системы'
      },
      {
        path: 'users',
        component: ManagerUsersComponent,
        canActivate: [adminGuard], // 🛡️ ПУСКАЕТ ТОЛЬКО АДМИНА
        title: 'Управление пользователями'
      },
      { path: 'products', component: ManagerProductsComponent },
      { path: 'categories', component: ManagerCategoriesComponent },
      { path: 'brands', component: ManagerBrandsComponent },
      {
        path: 'reviews',
        component: ManagerReviewsComponent,
        title: 'Модерация отзывов'
      },
      { path: 'stores', component: ManagerStoresComponent },
      { path: 'cities', component: ManagerCitiesComponent },
      { path: 'regions', component: ManagerRegionsComponent },
      { path: 'inventory', component: ManagerInventoryComponent },
      {
        path: 'transfers',
        component: ManagerTransfersComponent,
        title: 'Движение товаров'
      },
      { path: 'orders', component: ManagerOrdersComponent },
      {
        path: 'coupons',
        component: ManagerCouponsComponent,
        title: 'Управление купонами'
      },
      {
        path: 'page-editor',
        component: ManagerPageEditorComponent
      },
      { path: 'files', component: ManagerFilesComponent },
      { path: 'languages', component: ManagerLanguagesComponent },
      { path: 'translations/products', component: ManagerTranslationsProductsComponent },
      { path: 'translations/categories', component: ManagerTranslationsCategoriesComponent },
      { path: 'translations/brands', component: ManagerTranslationsBrandsComponent, title: 'Переводы брендов' },
      { path: 'translations/ui', component: ManagerUiTranslationsComponent },
    ]
  },

  // ==========================================
  // 2. КЛИЕНТСКАЯ ЧАСТЬ (Главный макет магазина)
  // ==========================================
  {
    path: '',
    component: MainLayout, // Выступает как Layout (с Header и Footer)
    children: [
      {
        path: '',
        component: HomePage,
        title: 'SigmaElectronix | Магазин электроники'
      },
      {
        path: 'profile',
        component: ProfilePage,
        title: 'Мой аккаунт',
        canActivate: [authGuard],
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
      { path: 'wishlist', component: PublicWishlistComponent, title: 'Мое избранное' },
      { path: 'cart', component: CartPage, title: 'Корзина' },
      { path: 'checkout', component: CheckoutPage, title: 'Оформление заказа' },
      { path: 'catalog', component: CatalogPage, title: 'Каталог' },
      { path: 'catalog/:categorySlug', component: CatalogPage },
      { path: 'products/:slug', component: ProductDetailPage },
      { path: 'brands', component: BrandsComponent, title: 'Бренды' },
      { path: 'brands/:slug', component: BrandDetailComponent },
      {
        path: 'stores',
        component: PublicStoresComponent,
        title: 'Наши магазины | SigmaElectronix'
      },
      { path: 'payment/:id', component: PaymentPageComponent },
      { path: 'delivery', component: DeliveryPage, title: 'Доставка и оплата' },
      {
        path: 'warranty',
        component: WarrantyPage,
        title: 'Гарантия и возврат | SigmaElectronix'
      },
      { path: 'about', component: AboutPage, title: 'О компании' },
    ]
  },

  // ==========================================
  // 3. ОШИБКИ 404
  // ==========================================
  {
    path: '**',
    redirectTo: ''
  }
];
