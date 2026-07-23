let currentAccessToken: string | null = null;

export function setCurrentAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getCurrentAccessToken(): string | null {
  return currentAccessToken;
}
