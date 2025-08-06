export interface MenuItem {
  title: string;
  url?: string;
  id: number;
  children?: MenuItem[];
  icon?: string;
  category?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  // 예시 응답 구조
  username: number;
  token: string;
  refreshToken: string;
}
