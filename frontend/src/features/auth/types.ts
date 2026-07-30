export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  // 백엔드가 BIGINT를 JSON에서 문자열로 반환하므로 불투명한 식별자 문자열로 다룬다.
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}
