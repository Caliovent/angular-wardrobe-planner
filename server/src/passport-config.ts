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
        if (!email) {
          return done(new Error("No email provided by Google."), undefined);
        }

        const query = `
          INSERT INTO "users" (google_id, email, display_name, avatar_url)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email) DO UPDATE SET
            google_id = EXCLUDED.google_id,
            display_name = EXCLUDED.display_name,
            avatar_url = EXCLUDED.avatar_url
          RETURNING *;
        `;

        const values = [id, email, displayName, avatarUrl];
        const result = await pool.query(query, values);
        const user = result.rows[0];

        return done(null, user);
      } catch (err) {
        return done(err, undefined);
      }
    }
  )
);
