import { useMutation } from '@tanstack/react-query';
import { login } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export function useLoginMutation() {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.accessToken, data.user);
    },
  });
}
