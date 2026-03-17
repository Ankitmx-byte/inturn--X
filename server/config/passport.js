const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const axios = require('axios');

// Helper: fetch primary verified GitHub email when not present in profile
async function fetchGithubPrimaryEmail(accessToken) {
  try {
    const resp = await axios.get('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'InturnX-App'
      }
    });
    const emails = resp.data || [];
    // Prefer primary & verified
    const primaryVerified = emails.find(e => e.primary && e.verified && e.email);
    if (primaryVerified) return primaryVerified.email;
    // Else any verified
    const anyVerified = emails.find(e => e.verified && e.email);
    if (anyVerified) return anyVerified.email;
    // Else first email
    const first = emails.find(e => e.email);
    return first ? first.email : null;
  } catch (err) {
    console.error('Failed to fetch GitHub emails:', err.response?.status, err.response?.data || err.message);
    return null;
  }
}

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
                            `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/github/callback`;

  console.log('Initializing GitHub OAuth Strategy');
  console.log('GitHub Client ID:', process.env.GITHUB_CLIENT_ID ? 'SET' : 'NOT SET');
  console.log('GitHub Callback URL:', githubCallbackURL);

  passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: githubCallbackURL,
        customHeaders: {
          Accept: 'application/json',
          'User-Agent': 'InturnX-App'
        }
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ githubId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Determine email (GitHub may not provide it in profile)
        let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) {
          // Try to fetch primary/verified email via GitHub API
          email = await fetchGithubPrimaryEmail(accessToken);
        }

        if (email) {
          // Check if user exists with same email
          user = await User.findOne({ email });
          if (user) {
            // Link GitHub account to existing user
            user.githubId = profile.id;
            user.oauthProvider = 'github';
            await user.save();
            return done(null, user);
          }
        }

        // Create new user with a safe fallback email if still missing
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
        const safeEmail = email || `github_${profile.id}@users.noreply.github.com`;
        const newUser = new User({
          name: profile.displayName || profile.username,
          email: safeEmail,
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
                            `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`;

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
                              `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/linkedin/callback`;

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