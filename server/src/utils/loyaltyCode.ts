import { prisma } from '../lib/prisma';

const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 20;

function randomCode(): string {
  const max = 10 ** CODE_LENGTH;
  return Math.floor(Math.random() * max).toString().padStart(CODE_LENGTH, '0');
}

// Codes are unique across the whole users table (not just per business) so a
// single global uniqueness check is enough regardless of which business a
// customer belongs to.
export async function generateUniqueLoyaltyCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = randomCode();
    const existing = await prisma.user.findUnique({ where: { loyaltyCode: code } });
    if (!existing) {
      return code;
    }
  }
  throw new Error('Benzersiz sadakat kodu üretilemedi');
}
