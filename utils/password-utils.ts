import crypto from 'node:crypto';
import util from 'node:util';

const pbkdf2 = util.promisify(crypto.pbkdf2);
export async function getPasswordBuffer(password: string, salt?: string) {
  const passwordSalt = salt ?? crypto.randomBytes(32).toString('hex');
  const buffer = await pbkdf2(password, passwordSalt, 120000, 64, 'sha512');
  return {
    buffer,
    salt: passwordSalt,
  };
}

export async function hashPassword(password: string, salt?: string) {
  const { buffer, salt: passwordSalt } = await getPasswordBuffer(
    password,
    salt,
  );
  return `${passwordSalt}:${buffer.toString('hex')}`;
}

export async function comparePasswords(
  hashedPassword: string,
  plainPassword: string,
) {
  const [salt, password] = hashedPassword.split(':');
  const hashedPasswordBuffer = Buffer.from(password, 'hex');
  const { buffer: plainPasswordBuffer } = await getPasswordBuffer(
    plainPassword,
    salt,
  );

  try {
    return crypto.timingSafeEqual(hashedPasswordBuffer, plainPasswordBuffer);
  } catch (error) {
    console.log(error);
    return false;
  }
}
