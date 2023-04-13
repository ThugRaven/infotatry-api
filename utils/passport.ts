import { PassportStatic } from 'passport';
import {
  Strategy as LocalStrategy,
  VerifyFunctionWithRequest,
} from 'passport-local';
import { User } from '../models/user';
import { comparePasswords } from './password-utils';

export function initializePassport(
  passport: PassportStatic,
  getUserByEmail: (email: string) => Promise<User | null>,
  getUserById: (id: string) => Promise<User | null>,
) {
  const authenticateUser: VerifyFunctionWithRequest = async (
    req,
    email,
    password,
    done,
  ) => {
    const user = await getUserByEmail(email);
    if (!user) {
      console.log('user not found');
      return done(null, false, { message: 'User not found' });
    }

    if (!user.password) {
      console.log('provider');
      return done(null, false, { message: 'Provider' });
    }

    if (
      user.ban.duration &&
      user.ban.bannedAt &&
      (user.ban.bannedAt.getTime() + user.ban.duration > Date.now() ||
        user.ban.duration === -1)
    ) {
      console.log('banned');
      const until =
        user.ban.duration === -1
          ? -1
          : user.ban.bannedAt.getTime() + user.ban.duration;
      req.body.until = until;
      req.body.reason = user.ban.reason;
      return done(null, false, { message: 'User banned' });
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
        passReqToCallback: true,
      },
      authenticateUser,
    ),
  );
  passport.serializeUser<string>((user: { _id?: string }, done) =>
    done(null, user._id),
  );
  passport.deserializeUser<string>((id, done) => done(null, getUserById(id)));
}
