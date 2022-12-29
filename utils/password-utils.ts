import crypto from 'node:crypto';
import util from 'node:util';

const pbkdf2 = util.promisify(crypto.pbkdf2);
export async function hashPassword(password: string, salt?: string) {
  const passwordSalt = salt ?? crypto.randomBytes(128).toString('base64');
  const hash = await pbkdf2(password, passwordSalt, 120000, 64, 'sha512');
  const hashedPassword = hash.toString('hex');
  return `${passwordSalt}:${hashedPassword}`;
}

export async function comparePasswords(
  hashedPassword: string,
  plainPassword: string,
) {
  const salt = hashedPassword.split(':')[0];
  const hashedPlainPassword = await hashPassword(plainPassword, salt);
  return hashedPassword === hashedPlainPassword;
}
