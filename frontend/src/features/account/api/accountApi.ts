import { apiClient } from '@/api/client';
import type { User } from '@/features/auth/types';

export function updateNickname(nickname: string): Promise<User> {
  return apiClient.patch<User>('/users/me', { nickname }).then((res) => res.data);
}

export function updatePassword(password: string): Promise<User> {
  return apiClient.patch<User>('/users/me', { password }).then((res) => res.data);
}
