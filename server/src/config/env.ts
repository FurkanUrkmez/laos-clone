import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  // Saniye cinsinden
  jwtAccessExpiresInSeconds: Number(process.env.JWT_ACCESS_EXPIRES_IN ?? 900),
  jwtRefreshExpiresInSeconds: Number(process.env.JWT_REFRESH_EXPIRES_IN ?? 2592000),
};
