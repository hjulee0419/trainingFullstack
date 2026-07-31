import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/shared/layout/AppLayout';
import { ProtectedRoute } from '@/shared/layout/ProtectedRoute';
import { LoginPage } from '@/routes/auth/LoginPage';
import { SignupPage } from '@/routes/auth/SignupPage';
import { CategoryManagePage } from '@/routes/categories/CategoryManagePage';
import { AccountPage } from '@/routes/account/AccountPage';
import { DashboardPage } from '@/routes/dashboard/DashboardPage';
import { TodoListPage } from '@/routes/todos/TodoListPage';
import { TodoCreatePage } from '@/routes/todos/TodoCreatePage';
import { TodoEditPage } from '@/routes/todos/TodoEditPage';
import { onUnauthorized } from '@/lib/authEvents';
import { useThemeStore } from '@/features/theme/useThemeStore';

function App() {
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      navigate('/login', { replace: true });
    });
    return () => {
      unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/todos" element={<TodoListPage />} />
          <Route path="/todos/new" element={<TodoCreatePage />} />
          <Route path="/todos/:id/edit" element={<TodoEditPage />} />
          <Route path="/categories" element={<CategoryManagePage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
