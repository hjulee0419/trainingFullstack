import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/shared/layout/AppLayout';
import { ProtectedRoute } from '@/shared/layout/ProtectedRoute';
import { LoginPage } from '@/routes/auth/LoginPage';
import { SignupPage } from '@/routes/auth/SignupPage';
import { CategoryManagePage } from '@/routes/categories/CategoryManagePage';
import { TodoListPage } from '@/routes/todos/TodoListPage';
import { onUnauthorized } from '@/lib/authEvents';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      navigate('/login', { replace: true });
    });
    return () => {
      unsubscribe();
    };
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/todos" element={<TodoListPage />} />
          <Route path="/categories" element={<CategoryManagePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/todos" replace />} />
    </Routes>
  );
}

export default App;
