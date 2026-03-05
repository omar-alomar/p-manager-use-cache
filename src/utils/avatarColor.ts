const AVATAR_COLORS = 8

export function avatarColorClass(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return `avatar-color-${Math.abs(hash) % AVATAR_COLORS}`
}
