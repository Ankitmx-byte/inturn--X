const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Only configure strategies if credentials are provided

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// GitHub Strategy (only if credentials provided)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  const githubCallbackURL = process.env.GITHUB_CALLBACK_URL ||
                            `${process.env.CLIENT_URL || 'https://inturn-x.vercel.app'}/api/auth/github/callback`;

  passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: githubCallbackURL
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (email) {
          user = await User.findOne({ email });

          if (user) {
            // Link GitHub account to existing user
            user.githubId = profile.id;
            user.oauthProvider = 'github';
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
        const newUser = new User({
          name: profile.displayName || profile.username,
          email: email,
          githubId: profile.id,
          oauthProvider: 'github',
          role: 'student',
          avatar: avatar,
          github: profile.profileUrl,
          skills: [],
          badges: ['GitHub User']
        });

        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
}

// Google Strategy (only if credentials provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const googleCallbackURL = process.env.GOOGLE_CALLBACK_URL ||
                            `${process.env.CLIENT_URL || 'https://inturn-x.vercel.app'}/api/auth/google/callback`;

  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: googleCallbackURL
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return done(null, user);
      }

      // Check if user exists with same email
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (email) {
        user = await User.findOne({ email });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.oauthProvider = 'google';
          await user.save();
          return done(null, user);
        }
      }

      // Create new user
      const newUser = new User({
        name: profile.displayName,
        email: email,
        googleId: profile.id,
        oauthProvider: 'google',
        role: 'student',
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        skills: [],
        badges: ['Google User']
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }
  ));
}

// LinkedIn Strategy (only if credentials provided)
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  const linkedinCallbackURL = process.env.LINKEDIN_CALLBACK_URL ||
                              `${process.env.CLIENT_URL || 'https://inturn-x.vercel.app'}/api/auth/linkedin/callback`;

  passport.use(new LinkedInStrategy({
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: linkedinCallbackURL,
      scope: ['r_emailaddress', 'r_liteprofile'],
      state: true,
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ linkedinId: profile.id });

      if (user) {
        return done(null, user);
      }

      // Check if user exists with same email
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      if (email) {
        user = await User.findOne({ email });

        if (user) {
          // Link LinkedIn account to existing user
          user.linkedinId = profile.id;
          user.oauthProvider = 'linkedin';
          await user.save();
          return done(null, user);
        }
      }

      // Create new user
      const newUser = new User({
        name: profile.displayName,
        email: email,
        linkedinId: profile.id,
        oauthProvider: 'linkedin',
        role: 'student',
        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        linkedin: profile.profileUrl,
        skills: [],
        badges: ['LinkedIn User']
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }
  ));
}

module.exports = passport;
// End of file