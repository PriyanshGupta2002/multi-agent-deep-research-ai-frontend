export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = LoginCredentials & {
  full_name: string;
};
