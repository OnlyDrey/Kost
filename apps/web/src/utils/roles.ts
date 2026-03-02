import type { User } from "../services/api";

export const ROLE_ORDER: Array<User["role"]> = ["ADMIN", "ADULT", "CHILD"];

export function sortRoles(roles: Array<User["role"]>): Array<User["role"]> {
  return [...roles].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
}
