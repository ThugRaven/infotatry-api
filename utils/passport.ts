import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy, VerifyFunction } from 'passport-local';
import { User } from '../models/user';
import { hashPassword } from './password-utils';

export function initializePassport(
  passport: PassportStatic,
  getUserByEmail: (email: string) => Promise<User | null>,
  getUserById: (id: string) => Promise<User | null>,
) {
  const authenticateUser: VerifyFunction = async (email, password, done) => {
    const user = await getUserByEmail(email);
    if (!user) {
      return done(null, false, { message: 'User not found' });
    }

    try {
      const userPassword = await hashPassword(user.password);
      if (password === userPassword) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password' });
      }
    } catch (error) {
      return done(error);
    }
  };

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      authenticateUser,
    ),
  );
  passport.serializeUser<string>((user: { _id?: string }, done) =>
    done(null, user._id),
  );
  passport.deserializeUser<string>((id, done) => done(null, getUserById(id)));
}
