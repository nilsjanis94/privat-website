export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
} 