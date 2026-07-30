import { useMutation } from '@tanstack/react-query';
import { updatePassword } from '@/features/account/api/accountApi';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: updatePassword,
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
    },
  });
}
