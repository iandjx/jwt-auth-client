import NextAuth from "next-auth";
import Providers from "next-auth/providers";
import axios from "axios";
import { verify } from "jsonwebtoken";
// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export default NextAuth({
  // https://next-auth.js.org/configuration/providers
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Providers.Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      profileUrl:
        "https://graph.facebook.com/me?fields=email,first_name,last_name",
      profile: (_profile) => {
        return {
          id: _profile.id,
          firstName: _profile.first_name,
          lastName: _profile.last_name,
          email: _profile.email,
        };
      },
    }),
    Providers.Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // Database optional. MySQL, Maria DB, Postgres and MongoDB are supported.
  // https://next-auth.js.org/configuration/databases
  //
  // Notes:
  // * You must install an appropriate node_module for your database
  // * The Email provider requires a database (OAuth providers do not)
  // database: process.env.DATABASE_URL,

  // The secret should be set to a reasonably long random string.
  // It is used to sign cookies and to sign and encrypt JSON Web Tokens, unless
  // a separate secret is defined explicitly for encrypting the JWT.
  secret: process.env.SECRET,

  session: {
    // Use JSON Web Tokens for session instead of database sessions.
    // This option can be used with or without a database for users/accounts.
    // Note: `jwt` is automatically set to `true` if no database is specified.
    jwt: true,

    // Seconds - How long until an idle session expires and is no longer valid.
    // maxAge: 30 * 24 * 60 * 60, // 30 days

    // Seconds - Throttle how frequently to write to database to extend a session.
    // Use it to limit write operations. Set to 0 to always update the database.
    // Note: This option is ignored if using JSON Web Tokens
    // updateAge: 24 * 60 * 60, // 24 hours
  },

  // JSON Web tokens are only used for sessions if the `jwt: true` session
  // option is set - or by default if no database is specified.
  // https://next-auth.js.org/configuration/options#jwt
  jwt: {
    // A secret to use for key generation (you should set this explicitly)
    // secret: 'INp8IvdIyeMcoGAgFGoA61DdBglwwSqnXJZkgz8PSnw',
    // Set to true to use encryption (default: false)
    // encryption: true,
    // You can define your own encode/decode functions for signing and encryption
    // if you want to override the default behaviour.
    // encode: async ({ secret, token, maxAge }) => {},
    // decode: async ({ secret, token, maxAge }) => {},
  },

  // You can define custom pages to override the built-in ones. These will be regular Next.js pages
  // so ensure that they are placed outside of the '/api' folder, e.g. signIn: '/auth/mycustom-signin'
  // The routes shown here are the default URLs that will be used when a custom
  // pages is not specified for that route.
  // https://next-auth.js.org/configuration/pages
  pages: {
    // signIn: '/auth/signin',  // Displays signin buttons
    // signOut: '/auth/signout', // Displays form with sign out button
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // Used for check email page
    // newUser: null // If set, new users will be directed here on first sign in
  },

  // Callbacks are asynchronous functions you can use to control what happens
  // when an action is performed.
  // https://next-auth.js.org/configuration/callbacks
  callbacks: {
    // async signIn(user, account, metadata) {
    //   console.log("SIGN IN CALLBACK");
    //   if (account.provider === "github") {
    //     const githubUser = {
    //       id: metadata.id,
    //       login: metadata.login,
    //       name: metadata.name,
    //       avatar: user.image,
    //     };
    //     const result = await getTokenFromYourAPIServer("github", githubUser);
    //     user.accessToken = result.data.accessToken;
    //     user.refreshToken = result.data.refreshToken;
    //     return true;
    //   }

    //   if (account.provider === "facebook") {
    //     const facebookUser = {
    //       login: metadata.email,
    //       firstName: metadata.first_name,
    //       lastName: metadata.last_name,
    //     };
    //     const result = await getTokenFromYourAPIServer(
    //       account.provider,
    //       facebookUser
    //     );
    //     user.accessToken = result.data.accessToken;
    //     user.refreshToken = result.data.refreshToken;

    //     return true;
    //   }

    //   if (account.provider === "google") {
    //     const googleUser = {
    //       login: metadata.email,
    //       firstName: metadata.given_name,
    //       lastName: metadata.family_name,
    //     };
    //     const result = await getTokenFromYourAPIServer(
    //       account.provider,
    //       googleUser
    //     );
    //     user.accessToken = result.data.accessToken;
    //     user.refreshToken = result.data.refreshToken;

    //     return true;
    //   }

    //   return false;
    // },
    // async redirect(url, baseUrl) {
    //   return baseUrl;
    // },
    async session(session, token) {
      console.log("SESSION CALLBACK");
      console.log(token);
      console.log("SESSION");
      if (token) {
        session.user = token.user;
      }
      console.log(session);

      return session;
    },
    async jwt(token, user, account, profile, isNewUser) {
      console.log("JWT CALLBACK");
      // console.log("account", account);
      // console.log(profile);
      if (account && user) {
        let accessToken;
        let refreshToken;

        if (account.provider === "github") {
          const githubUser = {
            id: profile.id,
            login: profile.login,
            name: profile.name,
            avatar: user.image,
          };
          const result = await getTokenFromYourAPIServer("github", githubUser);
          accessToken = result.data.accessToken;
          refreshToken = result.data.refreshToken;
        }

        if (account.provider === "facebook") {
          const facebookUser = {
            login: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
          };
          const result = await getTokenFromYourAPIServer(
            account.provider,
            facebookUser
          );
          accessToken = result.data.accessToken;
          refreshToken = result.data.refreshToken;
        }

        if (account.provider === "google") {
          const googleUser = {
            login: profile.email,
            firstName: profile.given_name,
            lastName: profile.family_name,
          };
          const result = await getTokenFromYourAPIServer(
            account.provider,
            googleUser
          );
          accessToken = result.data.accessToken;
          refreshToken = result.data.refreshToken;
        }

        return {
          user,
          accessToken,
          refreshToken,
        };
      }
      console.log(token);
      try {
        verify(token.accessToken, process.env.ACCESSTOKEN_SECRET);
      } catch (error) {
        console.log("token expired");
        const res = await getRefreshToken(token.refreshToken);

        token.accessToken = res.data.accessToken;
        console.log("new token created", token.accessToken);
        console.log(token);
        return token;
      }

      // verify access token
      // https://next-auth.js.org/tutorials/refresh-token-rotation#source-code
      return token;
    },
  },

  // Events are useful for logging
  // https://next-auth.js.org/configuration/events
  events: {},

  // Enable debug messages in the console if you are having problems
  debug: false,
});

const getTokenFromYourAPIServer = async (provider, user) => {
  const url = "http://localhost:4000/api/v2/login";
  const res = await axios.post(url, {
    provider,
    user,
  });
  return res;
};

const getRefreshToken = async (refreshToken) => {
  const url = "http://localhost:4000/api/v2/token-refresh";
  const res = await axios.post(url, {
    refreshToken,
  });
  return res;
};
