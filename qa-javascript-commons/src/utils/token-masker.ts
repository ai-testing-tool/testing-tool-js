export function maskToken(token: string): string {
  if (token.length <= 7) {
    return '*'.repeat(token.length);
  }
  return `${token.slice(0, 3)}****${token.slice(-4)}`;
}

export function sanitizeOptionsForLog<T>(options: T): T {
  const sanitized = JSON.parse(JSON.stringify(options)) as T & {
    ingest?: { token?: string };
  };
  if (sanitized.ingest?.token) {
    sanitized.ingest.token = maskToken(sanitized.ingest.token);
  }
  return sanitized as T;
}
