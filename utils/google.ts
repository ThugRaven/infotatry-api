import { PassportStatic } from 'passport';
import {
  Profile,
  Strategy as GoogleStrategy,
  VerifyCallback,
} from 'passport-google-oauth20';
import { Account } from '../models/account';
import { User } from '../models/user';

export function initializeGoogleStrategy(
  passport: PassportStatic,
  getAccountByGoogleId: (
    provider: string,
    id: string,
  ) => Promise<Account | null>,
  createUserFromGoogle: (profile: Profile) => Promise<User | null>,
  createAccountFromGoogle: (
    provider: string,
    providerId: string,
    userId: string,
  ) => Promise<Account | null>,
  getUserById: (id: string) => Promise<User | null>,
) {
  const authenticateUser = async (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) => {
    console.log(profile);
    try {
      const account = await getAccountByGoogleId('google', profile.id);
      if (!account) {
        console.log('account not found');
        const user = await createUserFromGoogle(profile);
        console.log(user);

        if (user) {
          console.log('create user');
          const newAccount = await createAccountFromGoogle(
            'google',
            profile.id,
            user.id,
          );
          console.log('create account');
          return done(null, user);
        }
      } else {
        console.log('get user');
        const user = await getUserById(account.userId.toString());
        if (!user) {
          console.log('user null');
          return done(null, false);
        } else {
          console.log('user');
          return done(null, user);
        }
      }
    } catch (error) {
      console.log('error');
      console.log(error);
      return done(error as string);
    }
  };

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${process.env.SERVER_URL}/auth/login/google/callback`,
        scope: ['email', 'profile'],
      },
      authenticateUser,
    ),
  );
  passport.serializeUser<string>((user: { id?: string }, done) => {
    console.log(user);
    return done(null, user.id);
  });
  passport.deserializeUser<string>((id, done) => done(null, getUserById(id)));
}
