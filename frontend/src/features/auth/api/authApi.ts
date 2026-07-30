import { apiClient } from '@/api/client';
import type { LoginRequest, LoginResponse, SignupRequest, User } from '@/features/auth/types';

export function signup(req: SignupRequest): Promise<User> {
  return apiClient.post<User>('/auth/signup', req).then((res) => res.data);
}

export function login(req: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', req).then((res) => res.data);
}
