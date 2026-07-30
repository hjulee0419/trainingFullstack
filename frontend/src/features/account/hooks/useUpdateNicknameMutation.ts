import { useMutation } from '@tanstack/react-query';
import { updateNickname } from '@/features/account/api/accountApi';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export function useUpdateNicknameMutation() {
  return useMutation({
    mutationFn: updateNickname,
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
    },
  });
}
