---
slug: authentication-and-authorization
title: Authentication and authorization
section: security
readFirst:
  - security-basics
  - http-https-tls
sources:
  - id: wiki-authn
    title: Wikipedia, Authentication
    url: https://en.wikipedia.org/wiki/Authentication
    license: CC BY-SA 4.0
    use: reworded
  - id: owasp-session
    title: OWASP Cheat Sheet Series, Session Management
    url: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-jwt
    title: Wikipedia, JSON Web Token
    url: https://en.wikipedia.org/wiki/JSON_Web_Token
    license: CC BY-SA 4.0
    use: reworded
  - id: owasp-jwt
    title: OWASP Cheat Sheet Series, JSON Web Token for Java
    url: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
    license: CC BY-SA 4.0
    use: reworded
  - id: owasp-top10
    title: OWASP Top 10
    url: https://owasp.org/www-project-top-ten/
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-abac
    title: Wikipedia, Attribute-based access control
    url: https://en.wikipedia.org/wiki/Attribute-based_access_control
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-oauth
    title: Wikipedia, OAuth
    url: https://en.wikipedia.org/wiki/OAuth
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-oidc
    title: Wikipedia, OpenID
    url: https://en.wikipedia.org/wiki/OpenID
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-rbac
    title: Wikipedia, Role-based access control
    url: https://en.wikipedia.org/wiki/Role-based_access_control
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What is the difference between authentication and authorization?
    options:
      - They are the same
      - Authentication checks who you are; authorization checks what you may do
      - Authentication is for APIs; authorization is for websites
      - Authorization always comes first
    correct: 1
    explanation: Prove identity first, then check permissions on each action.
  - prompt: With server-side sessions, what does the browser hold?
    options:
      - The user's password
      - A random session ID in a cookie; the data lives on the server
      - The whole user record
      - Nothing
    correct: 1
    explanation: The server looks the ID up in a session store, often Redis.
  - prompt: Why can any service verify a JWT without calling the auth server?
    options:
      - JWTs are encrypted with the user's password
      - The token is signed, so a service with the key can check it was not changed
      - Every service stores every token
      - JWTs never expire
    correct: 1
    explanation: The signature proves who issued it; the claims say who the user is and when it expires.
  - prompt: What is the main weakness of long-lived JWTs?
    options:
      - They are too small
      - They are hard to revoke before they expire
      - They cannot hold a user ID
      - They only work in Java
    correct: 1
    explanation: Use short-lived access tokens plus refresh tokens, or a deny list.
  - prompt: What is OAuth 2.0 for?
    options:
      - Hashing passwords
      - Letting a user grant an app limited access to their data on another service without sharing their password
      - Encrypting disks
      - Load balancing
    correct: 1
    explanation: OAuth is about delegated authorization; OpenID Connect adds login on top.
  - prompt: What does OpenID Connect add to OAuth 2.0?
    options:
      - An ID token that tells the app who the user is
      - Rate limiting
      - A database
      - Payment processing
    correct: 0
    explanation: OIDC is an identity layer, used for "Sign in with ..." buttons.
  - prompt: In role-based access control, permissions are attached to...
    options:
      - Roles, and users are given roles
      - IP addresses
      - Each HTTP request individually
      - Database tables only
    correct: 0
    explanation: e.g. an "editor" role can publish; users get the role instead of each permission.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Almost every system needs to know who is calling and what they are allowed to do. Those are two separate questions.

## What it is

**<Term id="authentication">Authentication</Term>** (authn) proves who a user or service is: a password, a one-time code, a passkey, a certificate. **<Term id="authorization">Authorization</Term>** (authz) decides what that identity may do. Authentication comes first, then authorization is checked on every action. <Src id="wiki-authn" />

## How it works

**Sessions.** After login, the server creates a session, stores it (in memory, a database or Redis) and sends the browser a long random session ID in a cookie. Each request sends the cookie, and the server looks the session up. Mark the cookie `Secure`, `HttpOnly` and `SameSite`, and issue a fresh ID on login. Logout is easy: delete the session. <Src id="owasp-session" />

**Tokens (JWT).** A **<Term id="jwt">JSON Web Token</Term>** is a compact, signed JSON object with three parts, `header.payload.signature`. The payload holds claims such as the user ID (`sub`) and expiry (`exp`). Any service with the key can verify the signature and trust the claims without a lookup, which suits APIs and microservices. The payload is only encoded, not encrypted, so keep secrets out of it. <Src id="wiki-jwt" />

Because a JWT is valid until it expires, revoking one is hard. Common practice is a short-lived access token (minutes) plus a longer-lived refresh token that the auth server can revoke. <Src id="owasp-jwt" />

**<Term id="oauth">OAuth 2.0</Term>** lets a user grant an app limited access to their data on another service, without giving it their password. In the common authorization code flow: <Src id="wiki-oauth" />

1. The app redirects the user to the authorization server.
2. The user logs in there and approves the requested scopes, such as `read:calendar`.
3. The server redirects back with a short-lived code.
4. The app's back end swaps the code for an access token (and often a refresh token).
5. The app calls the API with the access token.

Public clients such as mobile and single-page apps add PKCE so a stolen code is useless. <Src id="wiki-oauth" />

**OpenID Connect (OIDC)** is an identity layer on top of OAuth 2.0. Along with the access token, the app gets an **ID token** (a JWT) saying who the user is. This is what powers "Sign in with Google" and single sign-on. <Src id="wiki-oidc" />

**Authorization models.** In **<Term id="rbac">role-based access control</Term>**, permissions are given to roles and users are given roles. <Src id="wiki-rbac" /> Attribute-based control adds rules on attributes, such as "owners can edit their own documents". <Src id="wiki-abac" />

## Trade-offs

| | Sessions | JWTs |
| --- | --- | --- |
| State | On the server (session store) | In the token |
| Verify | Lookup per request | Check signature locally |
| Revoke | Delete the session | Hard; wait for expiry or keep a deny list |
| Size | Small cookie | Larger, sent on every request |
| Best for | Browser apps on one domain | APIs, mobile, many services |

- **Don't build your own auth** if you can avoid it; use a proven identity provider or library.
- **Check authorization on the server, on every request**, for the specific object. Broken access control is the top OWASP risk. <Src id="owasp-top10" />

## Interview tips

- Separate the two words clearly: authn at the gateway, authz in each service.
- Pick sessions in Redis for a classic web app, or short-lived JWTs plus refresh tokens for APIs and microservices, and say how you revoke.
- Use OAuth 2.0 for "let this app access my data", and OIDC for "sign in with ...".
- Mention RBAC for permissions, and rate limit the login endpoint.
