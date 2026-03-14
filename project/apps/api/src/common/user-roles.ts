export const USER_ROLES = {
  ADMIN: "ADMIN",
  ADULT: "ADULT",
  CHILD: "CHILD",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export function isUserRole(value: string): value is UserRole {
  return Object.values(USER_ROLES).includes(value as UserRole);
}
