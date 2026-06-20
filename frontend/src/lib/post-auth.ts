import type { Role } from "./api";

// Where to send a user immediately after authenticating, by role.
export function homeForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "PROVIDER":
      return "/dashboard";
    default:
      return "/search";
  }
}
