const FRIEND_NAME = /^[\p{L}][\p{L}\p{M}\s.'-]{0,79}$/u;

export function normalizeFriendName(input: string): string | null {
  const name = input.trim().replace(/\s+/g, " ");
  if (!FRIEND_NAME.test(name)) return null;
  return name;
}
