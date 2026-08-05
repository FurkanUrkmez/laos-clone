import { describe, expect, it } from 'vitest';
import { AppError } from '../utils/AppError';
import {
  computeRedeemBalance,
  getPointsBalance,
  isRewardEligible,
  parseUserIdFromQrValue,
} from './loyaltyCalc';

describe('getPointsBalance', () => {
  it('earn ve redeem toplamlarının farkını döner', () => {
    expect(getPointsBalance(10, 4)).toBe(6);
  });

  it('hiç işlem yoksa 0 döner', () => {
    expect(getPointsBalance(0, 0)).toBe(0);
  });
});

describe('isRewardEligible', () => {
  it('bakiye eşiğe eşitse true döner', () => {
    expect(isRewardEligible(6, 6)).toBe(true);
  });

  it('bakiye eşiğin üstündeyse true döner', () => {
    expect(isRewardEligible(8, 6)).toBe(true);
  });

  it('bakiye eşiğin altındaysa false döner', () => {
    expect(isRewardEligible(5, 6)).toBe(false);
  });
});

describe('computeRedeemBalance', () => {
  it('eşik kadar puanı düşer', () => {
    expect(computeRedeemBalance(8, 6)).toBe(2);
  });

  it('bakiye tam eşitse sıfıra düşer', () => {
    expect(computeRedeemBalance(6, 6)).toBe(0);
  });

  it('bakiye eşiğin altındaysa AppError fırlatır', () => {
    expect(() => computeRedeemBalance(5, 6)).toThrow(AppError);
  });
});

describe('parseUserIdFromQrValue', () => {
  it('geçerli formattan userId çıkarır', () => {
    expect(parseUserIdFromQrValue('laos-clone:user:abc-123')).toBe('abc-123');
  });

  it('yanlış prefix\'te AppError fırlatır', () => {
    expect(() => parseUserIdFromQrValue('baska-format:abc-123')).toThrow(AppError);
  });

  it('userId boşsa AppError fırlatır', () => {
    expect(() => parseUserIdFromQrValue('laos-clone:user:')).toThrow(AppError);
  });
});
