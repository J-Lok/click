import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './shared/components/ToastProvider';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { ProtectedRoute } from './shared/components/ProtectedRoute';

const AppLayout = lazy(() =>
  import('./modules/layout/AppLayout').then((m) => ({ default: m.AppLayout }))
);
const LoginPage = lazy(() =>
  import('./modules/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const SignupPage = lazy(() =>
  import('./modules/auth/SignupPage').then((m) => ({ default: m.SignupPage }))
);
const CreateRestaurantPage = lazy(() =>
  import('./modules/auth/CreateRestaurantPage').then((m) => ({ default: m.CreateRestaurantPage }))
);
const DashboardPage = lazy(() =>
  import('./modules/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const FloorPage = lazy(() =>
  import('./modules/floor/FloorPage').then((m) => ({ default: m.FloorPage }))
);
const OrdersPage = lazy(() =>
  import('./modules/orders/OrdersPage').then((m) => ({ default: m.OrdersPage }))
);
const MenuPage = lazy(() =>
  import('./modules/menu/MenuPage').then((m) => ({ default: m.MenuPage }))
);
const StockPage = lazy(() =>
  import('./modules/stock/StockPage').then((m) => ({ default: m.StockPage }))
);
const StatisticsPage = lazy(() =>
  import('./modules/statistics/StatisticsPage').then((m) => ({ default: m.StatisticsPage }))
);
const EmployeesPage = lazy(() =>
  import('./modules/employees/EmployeesPage').then((m) => ({ default: m.EmployeesPage }))
);
const RestaurantProfilePage = lazy(() =>
  import('./modules/restaurant/RestaurantProfilePage').then((m) => ({ default: m.RestaurantProfilePage }))
);
const AccessDeniedPage = lazy(() =>
  import('./modules/auth/AccessDeniedPage').then((m) => ({ default: m.AccessDeniedPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./modules/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-pulse text-slate-500">Chargement...</div>
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ToastProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                path="/create-restaurant"
                element={
                  <ProtectedRoute>
                    <CreateRestaurantPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute requireRole="restaurant_owner">
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="floor" element={<FloorPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="stock" element={<StockPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="restaurant" element={<RestaurantProfilePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
