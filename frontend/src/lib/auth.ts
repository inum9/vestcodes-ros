const TOKEN_KEY = 'ros_token';
const USER_KEY = 'ros_user';

export type Role = 'manager' | 'floor' | 'kitchen';

export type AuthUser = {
  id: number;
  email: string;
  role: Role;
  restaurantId: number;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setAuth(accessToken: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function roleHome(role: Role): string {
  return role === 'manager' ? '/manager' : role === 'floor' ? '/floor' : '/kitchen';
}