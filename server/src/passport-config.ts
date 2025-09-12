// File: server/src/passport-config.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './database';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      const { id, displayName, emails, photos } = profile;
      const email = emails?.[0].value;
      const avatarUrl = photos?.[0].value;

      try {
        let userResult = await pool.query('SELECT * FROM "users" WHERE google_id = $1', [id]);
        let user = userResult.rows[0];

        if (!user && email) {
          userResult = await pool.query('SELECT * FROM "users" WHERE email = $1', [email]);
          user = userResult.rows[0];
          if (user) {
            const updateResult = await pool.query(
              'UPDATE "users" SET google_id = $1, display_name = $2, avatar_url = $3 WHERE user_id = $4 RETURNING *',
              [id, displayName, avatarUrl, user.user_id]
            );
            user = updateResult.rows[0];
          }
        }

        if (!user) {
          if (!email) return done(new Error("Aucun email fourni par Google."), undefined);
          const newUserResult = await pool.query(
            'INSERT INTO "users" (google_id, email, display_name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, email, displayName, avatarUrl]
          );
          user = newUserResult.rows[0];
        }

        return done(null, user);
      } catch (err) {
        return done(err, undefined);
      }
    }
  )
);
