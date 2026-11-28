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
  - id: mdn-401
    title: MDN Web Docs, 401 Unauthorized
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/401
    license: CC BY-SA 2.5
    use: reworded
  - id: mdn-403
    title: MDN Web Docs, 403 Forbidden
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403
    license: CC BY-SA 2.5
    use: reworded
  - id: wiki-rbac
    title: Wikipedia, Role-based access control
    url: https://en.wikipedia.org/wiki/Role-based_access_control
    license: CC BY-SA 4.0
    use: reworded
  - id: rfc9700
    title: RFC 9700, Best Current Practice for OAuth 2.0 Security
    url: https://datatracker.ietf.org/doc/html/rfc9700
    license: IETF Trust
    use: reworded
quiz:
  - prompt: What is the difference between authentication and authorization?
    options:
      - Authentication checks who you are; authorization checks what you may do
      - Authentication is for APIs; authorization is for websites
      - Authorization always comes first
      - They are the same
    correct: 0
    explanation: Prove identity first, then check permissions on each action.
  - prompt: Why can any service verify a JWT without calling the auth server?
    options:
      - JWTs never expire
      - JWTs are encrypted with the user's password
      - The token is signed, so a service with the public key can check who issued it and that it was not changed
      - Every service stores every token
    correct: 2
    explanation: The signature proves who issued it; the claims say who the user is and when it expires.
  - prompt: What does OpenID Connect add to OAuth 2.0?
    options:
      - Rate limiting
      - A database
      - Payment processing
      - An ID token that tells the app who the user is
    correct: 3
    explanation: OAuth delegates access; OIDC adds an identity layer, used for "Sign in with ..." buttons.
  - prompt: In role-based access control, permissions are attached to...
    options:
      - Each HTTP request individually
      - Database tables only
      - Roles, and users are given roles
      - IP addresses
    correct: 2
    explanation: For example, an "editor" role can publish; users get the role instead of each permission.
  - prompt: "In the worked example, access tokens live 15 minutes. An admin disables a user at 10:00 whose token was issued at 9:58. Without a deny list, until when can that token still call APIs?"
    options:
      - Not at all, it stops at 10:00
      - Until 10:13, when the token's exp passes
      - Until the refresh token expires in 30 days
      - Forever
    correct: 1
    explanation: Services check the signature and exp locally, so a revoked user keeps access until exp. The refresh will fail, but the current token works for up to 13 more minutes.
  - prompt: "The worked example runs 20,000 requests a second across 40 services. Why does it verify JWTs locally instead of calling the auth service on each request?"
    options:
      - JWTs are smaller than session IDs
      - "Local checks cost microseconds and remove 20,000 calls a second to one service that every request would otherwise depend on"
      - The auth service cannot store sessions
      - Local verification is more secure
    correct: 1
    explanation: The trade is fewer network calls and no single point of failure, paid for with delayed revocation.
  - prompt: "GET /invoices/1043 returns another customer's invoice to any logged-in user. Which control is missing?"
    options:
      - Authentication at the gateway
      - An object-level authorization check that invoice 1043 belongs to the caller
      - TLS
      - A longer JWT expiry
    correct: 1
    explanation: The caller is authenticated, but nobody checked that they own this object. This is the classic broken access control bug.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import OAuthCodeFlow from '#lib/diagrams/OAuthCodeFlow.svelte';
	import TokenAuthFlow from '#lib/diagrams/TokenAuthFlow.svelte';
</script>

Almost every system needs to know who is calling and what they are allowed to do. Those are two separate questions, answered at different places, and mixing them up is behind the most common security bug on the web.

## What it is

Here is the problem. HTTP is <Term id="stateless">stateless</Term>: each request arrives on its own, with nothing to say it comes from the person who logged in a minute ago. Sending the password on every request would work but would spread it everywhere. And knowing *who* someone is still does not tell you whether they may read invoice 1043. Plenty of real breaches came from APIs that checked that a user was logged in, but never checked that the object they asked for was theirs.

So there are two jobs:

- **<Term id="authentication">Authentication</Term>** (authn) proves who a user or service is: a password, a one-time code, a passkey, a certificate. It happens once at login and produces something the client can present later, either a session ID or a token. <Src id="wiki-authn" />
- **<Term id="authorization">Authorization</Term>** (authz) decides whether that identity may do this action on this object. It happens on **every** request.

On the wire, the two failures have different HTTP status codes. A missing, invalid or expired credential gets **401 Unauthorized** (despite the name, it means "not authenticated"). A valid identity without permission gets **403 Forbidden**. <Src id="mdn-401" /> <Src id="mdn-403" />

## How it works

### Sessions

After login, the server creates a session record (user ID, expiry, perhaps roles), stores it in memory, a database or Redis, and sends the browser a long random session ID in a cookie. Each request carries the cookie, and the server looks the session up. <Src id="owasp-session" />

Set the cookie `Secure` (HTTPS only), `HttpOnly` (JavaScript cannot read it, so <Term id="xss">XSS</Term> cannot steal it) and `SameSite=Lax` or `Strict` (the browser does not send it on most cross-site requests, which blocks <Term id="csrf">CSRF</Term>). Issue a fresh ID at login so an attacker cannot plant a known one, and expire idle sessions. Logout and revocation are easy: delete the record.

The cost is a lookup on every request, which is why the session store is usually Redis (see [Where to cache](/modules/where-to-cache)) rather than the main database.

### Tokens (JWT)

A **<Term id="jwt">JSON Web Token</Term>** is a compact, signed JSON object in three base64url parts, `header.payload.signature`. The payload holds claims such as the user ID (`sub`), the issuer (`iss`), the intended audience (`aud`) and the expiry (`exp`). <Src id="wiki-jwt" />

Signed with an asymmetric algorithm such as RS256 or ES256, the auth server holds the private key and publishes the public keys at a <Term id="jwks">JWKS</Term> URL. Any service can fetch and cache those keys once, then verify a token's signature and claims locally in microseconds, with no network call. That is why JWTs suit APIs and <Term id="microservices">microservices</Term>. The payload is only encoded, not encrypted, so anyone holding the token can read it; keep secrets out.

The catch is revocation. A JWT stays valid until `exp`, whatever happens on the server. The usual answer is a short-lived **access token** (5 to 15 minutes) plus a longer-lived <Term id="refresh-token">refresh token</Term> that the auth server checks, and can revoke, each time the client asks for a new access token. <Src id="owasp-jwt" />

In a typical token flow, the client logs in at the auth server and gets back a signed, short-lived access token. It sends that token with every API call as `Authorization: Bearer <token>`. The API checks the signature, `iss`, `aud` and `exp`, and then whether this user may perform this action. <Src id="wiki-jwt" />

<TokenAuthFlow />

### OAuth 2.0

**<Term id="oauth">OAuth 2.0</Term>** solves a different problem: letting a user grant an app limited access to their data on another service without giving that app their password. A scheduling app wants to read your Google Calendar; you approve it at Google, and the app receives a token that can only read calendars. In the authorization code flow: <Src id="wiki-oauth" />

1. The app redirects the user to the authorization server.
2. The user logs in there and approves the requested scopes, such as `read:calendar`.
3. The server redirects back to the app with a short-lived, single-use code.
4. The app's back end swaps the code for an access token (and often a refresh token).
5. The app calls the API with the access token.

<OAuthCodeFlow />

Mobile and single-page apps cannot keep a client secret, so they add <Term id="pkce">PKCE</Term>: the app sends a hash of a random value in step 1 and the value itself in step 4, so a code intercepted on the way back is useless to anyone else. Current guidance recommends PKCE for every client and forbids the old implicit flow, which returned tokens in the URL. <Src id="rfc9700" />

### OpenID Connect

**<Term id="oidc">OpenID Connect</Term>** is an identity layer on top of OAuth 2.0. Along with the access token, the app receives an **ID token**, a JWT saying who the user is and when they logged in. That is what powers "Sign in with Google" and company single sign-on: the app outsources authentication to an identity provider and only has to validate the ID token. <Src id="wiki-oidc" />

### Authorization models

- **<Term id="rbac">Role-based access control</Term>**: permissions belong to roles (viewer, editor, admin), and users are given roles. Simple to reason about and audit. <Src id="wiki-rbac" />
- **<Term id="abac">Attribute-based access control</Term>**: rules over attributes of the user, the object and the context, such as "owners can edit their own documents" or "support staff can read accounts in their region during work hours". More expressive, harder to audit. <Src id="wiki-abac" />
- **Relationship-based**: permissions follow a graph of relationships ("Alice is an editor of folder X, and document Y is in X"), as in Google Docs sharing.

Whatever the model, the check has to be against the **specific object**: not "may this user read invoices?" but "may this user read invoice 1043?" Broken access control is number one in the OWASP Top 10. <Src id="owasp-top10" />

## Worked example

An API platform serves **20,000 requests a second** across **40 services** behind an [API gateway](/modules/reverse-proxies-api-gateways). Users log in about **50 times a second**. Let us compare sessions and JWTs and then replay a revocation.

**Option 1, a central session store.** Every request needs a session lookup. At 20,000 a second and about 0.5 ms per Redis round trip, the store handles 20,000 lookups a second, which one Redis primary with replicas can do. But every request in all 40 services now depends on that store: if it is slow, everything is slow, and if it is down, every user is logged out at once. Revocation is instant: delete the key.

**Option 2, JWTs verified locally.** The auth service issues an access token with a **15-minute** `exp` and a **30-day** refresh token. Each client refreshes about every 15 minutes, so with 300,000 active users the auth service sees 300,000 / 900 s ≈ **333 refreshes a second**, plus 50 logins. That is the only traffic it gets. The other 20,000 requests a second are verified in each service with the cached JWKS public key, at a few tens of microseconds each. The auth service handles about 2% of the load it would in option 1 and is no longer on the hot path.

**The revocation replay.** At 9:58 a user's laptop is stolen with the app open; its access token was issued at 9:58 and expires at 10:13. At 10:00 an admin disables the account.

- The refresh token is revoked in the auth database, so at 10:13 the next refresh fails and the session ends.
- But from 10:00 to 10:13, every service still accepts the access token, because nothing they check has changed. That is a **13-minute window**.

To close it, the auth service adds the token's ID (the `jti` claim) to a **deny list** and pushes it to services, or services check a small Redis set. The list only needs to hold revoked tokens until their `exp`: if 100 accounts are revoked per day, that is about 100 × (15 / 1,440) ≈ **1 entry** at any moment, tiny enough to keep in memory everywhere. This is the usual compromise: stateless verification for the 99.99% case, a small stateful check for the rare revocation.

**The authorization check.** Finally, `GET /invoices/1043` arrives with a valid token for user 77. Authentication passed at the gateway. The invoice service must still load invoice 1043 and check `invoice.owner_id == 77` (or that user 77 has a role on that customer account) before returning it, and return 404 or 403 otherwise. Skipping that line is the bug in the opening section.

## In the real world

- **Keycloak** (open-source identity provider). Defaults to a **5-minute** access token lifespan and a **30-minute** SSO session idle timeout; both are per-realm settings. It supports OIDC, SAML, RBAC and fine-grained authorization policies.
- **Amazon Cognito.** User pools issue ID, access and refresh tokens. Access and ID tokens default to **1 hour** (configurable from 5 minutes to 1 day) and refresh tokens to **30 days**; refresh-token rotation can be turned on so each refresh returns a new refresh token.
- **Google Sign-In (OIDC).** ID tokens expire after **1 hour**, and Google publishes its signing keys at a JWKS URL that it rotates regularly, so relying apps must re-fetch keys by key ID (`kid`) rather than hard-coding them.
- **Google Zanzibar.** Google's relationship-based authorization service behind Drive, YouTube and Calendar. It stores relationship tuples such as "user:alice is editor of doc:42", answers checks with low latency at very large scale, and inspired open-source systems such as SpiceDB and OpenFGA.

## Trade-offs

| | Sessions | JWTs |
| --- | --- | --- |
| State | On the server (session store) | In the token |
| Verify | Lookup per request | Check signature locally |
| Revoke | Delete the session | Hard; wait for expiry or keep a deny list |
| Size | Small cookie (about 32 bytes of ID) | Often 500 bytes to 1 KB, sent on every request |
| Failure mode | Session store down logs everyone out | Auth server down only blocks logins and refreshes |
| Best for | Browser apps on one domain | APIs, mobile, many services |

- **Short access tokens** narrow the revocation window but raise refresh traffic; longer ones do the opposite.
- **RBAC is easy to audit but coarse**; ABAC and relationship models express "owner can edit" naturally but are harder to reason about and test.
- **Don't build your own auth** if you can avoid it; use a proven identity provider or library and spend your effort on authorization, which is specific to your product.

## Interview tips

- Separate the two words clearly: authentication at the gateway, authorization in each service, against the specific object.
- Pick sessions in Redis for a classic web app, or short-lived JWTs plus refresh tokens for APIs and microservices, and always say how you revoke.
- Use OAuth 2.0 for "let this app access my data", and OIDC for "sign in with ...". Mention PKCE for mobile and single-page apps.
- Mention RBAC for permissions, and rate limit the login endpoint (see [Rate limiting](/modules/rate-limiting)).

**Common mistakes:**

- **Checking authentication but not object ownership**, so any logged-in user can read `/invoices/1043` by changing the number. This is called an <Term id="idor">insecure direct object reference</Term>.
- **Long-lived JWTs with no revocation plan**, such as 30-day access tokens, so a stolen token works for a month.
- **Trusting a JWT without checking everything**: accepting `alg: none`, not pinning the expected algorithm, or skipping the `aud` check so a token minted for another service is accepted.
- **Storing tokens in localStorage**, where any XSS bug can read them; an `HttpOnly` cookie cannot be read by scripts.
- **Using OAuth access tokens as proof of identity.** An access token says what an app may do, not who logged in; use the OIDC ID token for that.

## Common follow-up questions

### How do you log a user out everywhere?

With sessions, delete all of that user's session records; keep a per-user index so you can find them. With JWTs, revoke every refresh token for the user and add a "tokens issued before" timestamp for that user that services check against the token's `iat` (issued at) claim, or add the live tokens' IDs to the deny list. Either way, the current access tokens die within their short lifetime at most.

### Where should a browser app keep its tokens?

Prefer an `HttpOnly`, `Secure`, `SameSite` cookie, so scripts cannot read it. Many teams use a "backend for frontend": the browser holds only a session cookie to its own server, and that server holds the OAuth tokens and attaches them to API calls. localStorage is convenient but readable by any injected script.

### How does authorization work across microservices?

The gateway authenticates and forwards a verified identity, usually the JWT itself, to downstream services. Each service enforces authorization for its own objects, because only it knows who owns invoice 1043. Shared rules can live in a policy engine (such as Open Policy Agent) or a central authorization service (Zanzibar-style), but the call to it still happens inside the service that owns the data.

### How do you rotate JWT signing keys?

Give each key an ID (`kid`) and publish both old and new public keys in the JWKS. Start signing with the new key; tokens signed with the old one keep verifying until they expire, which is at most one access-token lifetime. Then remove the old key. Services fetch the JWKS on an unknown `kid`, so no deploy is needed.

### How do you add multi-factor authentication?

After the password check, require a second factor before issuing the session or token: a time-based code from an authenticator app, a push approval, or a passkey (WebAuthn), which is phishing-resistant because the browser only signs challenges for the real domain. Record which factors were used (OIDC's `amr` claim) so sensitive actions, such as changing the payout bank account, can demand a recent second factor.

## Go deeper

- [RFC 9700, OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/rfc9700): the current rules for OAuth, including PKCE everywhere, no implicit flow, and refresh-token rotation.
- [RFC 8725, JSON Web Token Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725): the known JWT attacks (algorithm confusion, missing audience checks) and how to validate tokens safely.
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): session ID length, cookie attributes, timeouts and fixation defences.
- [Zanzibar: Google's Consistent, Global Authorization System](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/): how Google models permissions as relationship tuples and answers checks at scale.
