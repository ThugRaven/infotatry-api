import crypto from 'node:crypto';
import util from 'node:util';

const pbkdf2 = util.promisify(crypto.pbkdf2);
export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(128).toString('base64');
  const hash = await pbkdf2(password, salt, 120000, 64, 'sha512');
  const hashedPassword = hash.toString('hex');
  return `${salt}:${hashedPassword}`;
}
