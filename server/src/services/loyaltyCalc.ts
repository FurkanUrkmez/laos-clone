import { AppError } from '../utils/AppError';

const QR_USER_PREFIX = 'laos-clone:user:';

export function getPointsBalance(earnSum: number, redeemSum: number): number {
  return earnSum - redeemSum;
}

export function isRewardEligible(pointsBalance: number, threshold: number): boolean {
  return pointsBalance >= threshold;
}

export function computeRedeemBalance(pointsBalance: number, threshold: number): number {
  if (pointsBalance < threshold) {
    throw new AppError(400, 'Puan bakiyesi ödül eşiğini karşılamıyor');
  }
  return pointsBalance - threshold;
}

export function parseUserIdFromQrValue(qrValue: string): string {
  if (!qrValue.startsWith(QR_USER_PREFIX)) {
    throw new AppError(400, 'Geçersiz QR kodu');
  }
  const userId = qrValue.slice(QR_USER_PREFIX.length).trim();
  if (!userId) {
    throw new AppError(400, 'Geçersiz QR kodu');
  }
  return userId;
}
