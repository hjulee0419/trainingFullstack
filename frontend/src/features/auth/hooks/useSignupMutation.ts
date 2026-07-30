import { useMutation } from '@tanstack/react-query';
import { signup } from '@/features/auth/api/authApi';

export function useSignupMutation() {
  return useMutation({
    mutationFn: signup,
  });
}
