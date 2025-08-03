import { createRouter, createWebHistory } from 'vue-router'
import { checkTokenExpiration } from '../utils/auth.js';
import Register from '../views/Register.vue'
import Login from '../views/Login.vue'
import Home from '../views/user/Home.vue'
import VerifyOTP from '../views/VerifyOTP.vue'
import AdminHome from '../views/admin/AdminHome.vue'
import RecruitStaff from '../views/admin/RecruitStaff.vue'
import StaffHome from '../views/staff/StaffHome.vue'
import Profile from '../views/user/Profile.vue'
import ForgotPassword from '../views/ForgotPassword.vue' 
import Products from '../views/user/Products.vue' 
import InsertProducts from '../views/admin/InsertProducts.vue'
import Cart from '../views/user/Cart.vue'
import OrderHistory from '../views/user/OrderHistory.vue'
import ViewOrder from '../views/user/ViewOrder.vue'
import Rewards from '../views/user/Rewards.vue'
import SharedCart from '../views/user/SharedCart.vue'
import RewardsManagement from '../views/admin/RewardsManagement.vue'
import CreateOrder from '../views/staff/CreateOrder.vue'
import Notifications from'../views/user/Notifications.vue'
import SalesForecast from '../views/admin/SalesForecast.vue'
import AdminReceiptSettings from '../views/admin/ReceiptSettings.vue'
import ProductDetail from '../views/user/ProductDetail.vue';
import AdminReports from '../views/admin/AdminReports.vue'
import DigitalReceipt from '../views/user/DigitalReceipt.vue'
import PaymentSuccess from '../views/user/PaymentSuccess.vue'
import PaymentFailed from '../views/user/PaymentFailed.vue'
import QRCode from '../views/user/QRCode.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { requiresGuest: true }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/products',
    name: 'Products',
    component: Products,
    meta: { requiresAuth: true }
  },
  {
    path: '/verify-otp',
    name: 'VerifyOTP',
    component: VerifyOTP,
    meta: { requiresGuest: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/qr-code',
    name: 'QRCode',
    component: QRCode,
    meta: { requiresAuth: true }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: Cart,
    meta: { requiresAuth: true }
  },
  {
    path: '/order-history',
    name: 'OrderHistory',
    component: OrderHistory,
    meta: { requiresAuth: true }
  },
  {
    path: '/view-orders',
    name: 'ViewOrder',
    component: ViewOrder,
    meta: { requiresAuth: true }
  },
  {
    path: '/rewards',
    name: 'Rewards',
    component: Rewards,
    meta: { requiresAuth: true }
  },
  {
    path: '/shared-cart/:shareId',
    name: 'SharedCart',
    component: SharedCart,
    meta: { 
      requiresAuth: true,
      redirectParams: true
    }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: Notifications,
    meta: { requiresAuth: true }
  },
  {
    path: '/order-details/:id',
    name: 'OrderDetails',
    component: () => import('../views/user/OrderDetails.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: ProductDetail,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/receipt/:orderId',
    name: 'DigitalReceipt',
    component: DigitalReceipt,
    meta: { requiresAuth: true }
  },
  {
    path: '/payment-success',
    name: 'PaymentSuccess',
    component: PaymentSuccess
  },
  {
    path: '/payment-failed',
    name: 'PaymentFailed',
    component: PaymentFailed
  },
  // Admin Routes
  {
    path: '/admin',
    name: 'AdminHome',
    component: AdminHome,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/recruit-staff',
    name: 'RecruitStaff',
    component: RecruitStaff,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'AllUsers',
    component: () => import('../views/admin/UsersList.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/insert-products',
    name: 'InsertProducts',
    component: InsertProducts,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/products',
    name: 'AllProducts',
    component: () => import('../views/admin/AllProducts.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/staff',
    name: 'AllStaff',
    component: () => import('../views/admin/AllStaff.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/orders',
    name: 'AllOrders',
    component: () => import('../views/admin/AllOrders.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/rewards',
    name: 'RewardsManagement',
    component: RewardsManagement,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/forecast',
    name: 'AdminForecast',
    component: SalesForecast,
    meta: { requiresAuth: true, adminOnly: true }
  },
  {
    path: '/admin/low-stock',
    name: 'LowStock',
    component: () => import('../views/admin/LowStock.vue'),
    meta: { requiresAuth: true, requiredRole: 'admin' }
  },
  {
    path: '/admin/receipt-settings',
    name: 'AdminReceiptSettings',
    component: AdminReceiptSettings,
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: AdminReports,
    meta: { requiresAuth: true, requiredRole: 'admin' }
  },
  {
    path: '/admin/analytics',
    name: 'AdminAnalytics',
    component: () => import('../views/admin/AdminAnalytics.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: () => import('../views/admin/AdminSettings.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/sales-inventory-reports',
    name: 'AdminSalesInventoryReports',
    component: () => import('../views/admin/AdminSalesInventoryReports.vue'),
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  // Staff Routes
  {
    path: '/staff',
    name: 'StaffHome',
    component: StaffHome,
    meta: { requiresAuth: true, requiresStaff: true }
  },
  {
    path: '/staff/accepted-orders',
    name: 'AcceptedOrders',
    component: () => import('../views/staff/AcceptedOrders.vue'),
    meta: { requiresAuth: true, role: 'staff' }
  },
  {
    path: '/staff/orders/create',
    name: 'StaffCreateOrder',
    component: CreateOrder,
    meta: { requiresAuth: true, role: 'staff' }
  },
  {
    path: '/staff/profile',
    name: 'StaffProfile',
    component: () => import('../views/staff/StaffProfile.vue'),
    meta: { requiresAuth: true, role: 'staff' }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Combined navigation guard
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  const userRole = token ? JSON.parse(atob(token.split('.')[1])).role : null;
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // Check token expiration
  if (requiresAuth && !checkTokenExpiration()) {
    localStorage.setItem('redirectPath', to.fullPath);
    next('/login');
    return;
  }

  // Handle authentication and role-based access
  if (requiresAuth && !isAuthenticated) {
    localStorage.setItem('redirectPath', to.fullPath);
    next('/login');
  } else if (to.meta.requiresAdmin && userRole !== 'admin') {
    next('/home');
  } else if (to.meta.requiresStaff && userRole !== 'staff') {
    next('/home');
  } else if (to.meta.requiresGuest && isAuthenticated) {
    if (userRole === 'admin') {
      next('/admin');
    } else if (userRole === 'staff') {
      next('/staff');
    } else {
      next('/home');
    }
  } else {
    next();
  }
});

export default router