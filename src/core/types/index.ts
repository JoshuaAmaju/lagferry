enum RoleType {
  admin = "ADMIN",
}

type Role = { authority: RoleType };

export type AuthResponse = {
  type: string;
  token: string;
  roles: Array<Role>;
  refreshToken: string;
  firstTimeLoggedIn: boolean;
};
