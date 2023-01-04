import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy, VerifyFunction } from 'passport-local';
import { User } from '../models/user';
import { comparePasswords } from './password-utils';

export function initializePassport(
  passport: PassportStatic,
  getUserByEmail: (email: string) => Promise<User | null>,
  getUserById: (id: string) => Promise<User | null>,
) {
  const authenticateUser: VerifyFunction = async (email, password, done) => {
    const user = await getUserByEmail(email);
    if (!user) {
      console.log('user not found');
      return done(null, false, { message: 'User not found' });
    }

    if (!user.password) {
      console.log('provider');
      return done(null, false, { message: 'Provider' });
    }

    try {
      if (await comparePasswords(user.password, password)) {
        console.log('login');
        return done(null, user);
      } else {
        console.log('wrong password');
        return done(null, false, { message: 'Incorrect password' });
      }
    } catch (error) {
      console.log(error);
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
