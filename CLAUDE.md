# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                # runs on https://localhost:3002 (HTTPS only, self-signed cert in certs/)
npm run test:article     # runs scripts/testArticleModel.js against local MongoDB
```

No build step — plain CommonJS, no TypeScript, no bundler.

## Architecture

Express app with three layered auth mechanisms and MongoDB via Mongoose.

**Entry:** `bin/www` → starts HTTPS server using `certs/localhost-*.pem` → loads `app.js`

**Auth layers (three coexist):**

| Mechanism | Strategy | Guard middleware | Token location |
|---|---|---|---|
| Session | `passport-local` via `passport-local-mongoose` | `isAuthenticatedSession` | `req.session.userId` |
| Cookie | — | `isAuthenticated` | `req.cookies.username` |
| JWT | `passport-jwt` (Bearer) | `isAuthenticatedJwt` | `Authorization: Bearer <token>` |

**OAuth (no DB save — profile returned directly):**
- Facebook: `passport-facebook` → `GET /auth/facebook` → callback returns JWT
- Google: `passport-google-oauth20` → `GET /auth/google` → callback returns JWT

**Passport config is split across two files:**
- `config/passport.js` — Local, Facebook, Google strategies + serialize/deserialize
- `config/jwtConfig.js` — JWT strategy (loaded separately in `app.js` via `require('./config/jwtConfig')`)

**Routes:**
- `POST /users/signup` / `/users/login` — session-based local auth
- `POST /users/signup-jwt` / `/users/login-jwt` — JWT local auth
- `GET /auth/facebook`, `GET /auth/google` — OAuth entry points
- `GET /auth/facebook/callback`, `GET /auth/google/callback` — OAuth callbacks (return JWT)

**Session store:** MongoDB via `connect-mongo` (`config/sessionConfig.js`)

**JWT util:** `utils/jwt.js` exports `signToken(user)` — used by OAuth callbacks and JWT routes. `routes/users.js` has its own inline `createJwtToken()` that duplicates this logic.

**Models:** `User` schema uses `passport-local-mongoose` plugin (adds `username`, `hash`, `salt`, `authenticate()`, `register()`). Only extra field is `admin: Boolean`.

## .env required keys

```
MONGODB_URI
SESSION_SECRET
JWT_SECRET
JWT_EXPIRES_IN
FACEBOOK_APP_ID
FACEBOOK_APP_SECRET
FACEBOOK_CALLBACK_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
```
