export const Permissions = {
  ADMINISTRATOR: 1 << 0,
  MANAGE_CHANNELS: 1 << 1,
  MANAGE_ROLES: 1 << 2,
  MANAGE_GUILD: 1 << 3,
  CREATE_INVITE: 1 << 4,
  KICK_MEMBERS: 1 << 5,
  SEND_MESSAGES: 1 << 6,
} as const

export function hasPermission(
  userPermissions: number,
  requiredPermission: number,
): boolean {
  if (
    (userPermissions & Permissions.ADMINISTRATOR) ===
    Permissions.ADMINISTRATOR
  ) {
    return true
  }
  return (userPermissions & requiredPermission) === requiredPermission
}
