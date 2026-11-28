---
slug: security-basics
title: Security basics
section: security
upgraded: true
readFirst:
  - http-https-tls
  - api-design
sources:
  - id: primer-sec
    title: The System Design Primer, Security
    url: https://github.com/donnemartin/system-design-primer#security
    license: CC BY 4.0
    use: reworded
  - id: owasp-top10
    title: OWASP Top 10
    url: https://owasp.org/www-project-top-ten/
    license: CC BY-SA 4.0
    use: reworded
  - id: owasp-sqli
    title: OWASP Cheat Sheet Series, SQL Injection Prevention
    url: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
    license: CC BY-SA 4.0
    use: reworded
  - id: owasp-pw
    title: OWASP Cheat Sheet Series, Password Storage
    url: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
    license: CC BY-SA 4.0
    use: reworded
  - id: owasp-xss
    title: OWASP Cheat Sheet Series, Cross Site Scripting Prevention
    url: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
    license: CC BY-SA 4.0
    use: reworded
  - id: owasp-secrets
    title: OWASP Cheat Sheet Series, Secrets Management
    url: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-did
    title: Wikipedia, Defense in depth (computing)
    url: https://en.wikipedia.org/wiki/Defense_in_depth_(computing)
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-lp
    title: Wikipedia, Principle of least privilege
    url: https://en.wikipedia.org/wiki/Principle_of_least_privilege
    license: CC BY-SA 4.0
    use: reworded
  - id: aws-kms
    title: AWS Key Management Service Developer Guide, AWS KMS keys
    url: https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html
    license: AWS documentation
    use: reworded
quiz:
  - prompt: What does encryption in transit protect against?
    options:
      - Bugs in your code
      - A full disk
      - Slow queries
      - Someone reading or changing data as it crosses the network
    correct: 3
    explanation: TLS keeps traffic between client and server, and between services, private and intact.
  - prompt: What is the main defence against SQL injection?
    options:
      - Longer passwords
      - Hiding error messages
      - Parameterised queries, so user input is never parsed as SQL
      - Using NoSQL
    correct: 2
    explanation: Bound parameters keep data and code separate, whatever characters the input contains.
  - prompt: How should passwords be stored?
    options:
      - Encrypted with a key in the config file
      - Hashed with a slow, salted algorithm such as Argon2id or bcrypt
      - Hashed with plain SHA-256
      - In plain text so support can read them
    correct: 1
    explanation: Slow salted hashes make stolen password tables very expensive to crack.
  - prompt: Where should API keys and database passwords live?
    options:
      - In the front-end bundle
      - In log messages
      - In the git repository
      - In a secrets manager, injected at run time
    correct: 3
    explanation: Secrets in code leak through history, forks, build logs and container images.
  - prompt: "In the worked example, 10 million unsalted SHA-256 password hashes leak. Why is that much worse than 10 million bcrypt hashes with per-user salts?"
    options:
      - SHA-256 hashes are shorter
      - "A GPU tries billions of SHA-256 guesses a second and each guess is checked against every user at once; bcrypt allows a few thousand guesses a second, per user"
      - bcrypt hashes are encrypted
      - There is no real difference
    correct: 1
    explanation: Speed and salting multiply. Fast hashes make each guess cheap, and no salt lets one guess test all 10 million rows.
  - prompt: "The login service uses bcrypt at about 250 ms of CPU per hash and must handle 200 logins a second at peak. Roughly how many CPU cores does hashing alone need?"
    options:
      - 1
      - About 5
      - About 50
      - About 500
    correct: 2
    explanation: One core does about 4 hashes a second, so 200 / 4 = 50 cores. The slowness that defeats attackers is a real capacity cost, and why login needs a rate limit.
  - prompt: "An attacker steals the read-only database credentials of the reporting service. What limits the damage?"
    options:
      - TLS between services
      - Least privilege, because that user cannot write, delete or read tables it was not granted
      - The web application firewall
      - Password hashing
    correct: 1
    explanation: The blast radius of a stolen credential is exactly the permissions attached to it.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import TransitVsRest from '#lib/diagrams/TransitVsRest.svelte';
</script>

Security is rarely the main topic of a design interview, but a handful of basics belong in every design, and an interviewer will notice when they are missing. This module covers those basics and, more usefully, the reasoning behind them, so you can say why each one matters and what it costs.

## What it is

Here is the problem. In a typical breach nobody breaks the encryption. An attacker finds one weak spot, such as a search box that pastes input straight into SQL, an API key committed to a public repository, or an admin account shared by the whole team, and walks from there to the users table. If that table stores passwords with a fast hash, a few hours of GPU time later millions of accounts, on your site and every other site where people reused the password, are open.

Security is the set of habits that make each of those steps fail. The usual goals are summed up as keeping data **confidential** (only the right people can read it), **intact** (nobody can change it unnoticed) and **available** (it is there when legitimate users need it). The System Design Primer lists the basics a design should show: encrypt data in transit and at rest, treat all user input as hostile and escape anything sent back to the browser, use parameterised queries, and give every account the **<Term id="least-privilege">least privilege</Term>** it needs. <Src id="primer-sec" />

The **OWASP Top 10** is the industry's shared list of the most critical web application risks. Broken access control, security misconfiguration and injection have stayed near the top for years, which tells you that most real failures are ordinary mistakes rather than clever attacks. <Src id="owasp-top10" />

Identity, meaning who is calling and what they may do, gets its own module: [Authentication and authorization](/modules/authentication-and-authorization). This one covers everything around it.

## How it works

### Encrypt in transit

Every connection that carries user data should use <Term id="tls">TLS</Term>: HTTPS from clients, and TLS or <Term id="mtls">mutual TLS</Term> between internal services, where both sides present certificates so each knows who is on the other end. Without it, anyone on the path, such as a café Wi-Fi, a compromised router, or another tenant on a shared network, can read or change traffic. [HTTP, HTTPS and TLS](/modules/http-https-tls) explains the handshake and its cost. A common shortcut is to terminate TLS at the <Term id="load-balancer">load balancer</Term> and send plain HTTP inside the data centre. That is acceptable only if you genuinely trust the internal network, and most modern guidance (often called "zero trust") assumes you should not. <Src id="primer-sec" />

### Encrypt at rest

Encrypt databases, disks, backups and <Term id="object-storage">object storage</Term>, so a stolen disk, a leaked snapshot or a misplaced backup is unreadable. The hard part is not the cipher (AES-256 is the default everywhere) but where the key lives. Keys belong in a <Term id="kms">key management service</Term>, not in a config file next to the data. Large systems use <Term id="envelope-encryption">envelope encryption</Term>: each object or table is encrypted with its own data key, and that data key is itself encrypted by a master key that never leaves the KMS. <Src id="aws-kms" />

<TransitVsRest />

Encryption at rest protects against lost media and careless snapshots. It does not protect against an attacker who gets in through your application, because the application can decrypt everything. That is why the other layers still matter.

### Never trust input

Anything that arrives from outside, including form fields, headers, query strings, uploaded files and even data from partner APIs, may be crafted by an attacker. <Src id="owasp-sqli" />

- **<Term id="sql-injection">SQL injection</Term>** happens when input is glued into a query string, so a name like `' OR '1'='1` changes the query's meaning. The fix is a parameterised query (also called a prepared statement): the SQL text and the values travel separately, so the database never parses input as code. Validate input against an allow list of expected shapes as a second layer, never as the only one.
- **<Term id="xss">XSS</Term>** (cross-site scripting) is the same mistake in the browser: user content rendered into a page without escaping, so a comment containing a `<script>` tag runs in every reader's browser and can steal their session. Escape output for its context (HTML body, attribute, URL or JavaScript), let a template engine do it by default, and add a <Term id="csp">Content Security Policy</Term> header so the browser refuses to run scripts you did not ship. <Src id="owasp-xss" />

### Store passwords properly

Never store passwords in plain text, encrypted with a key, or hashed with a fast general-purpose hash such as SHA-256. A hash is a one-way function, so you store the hash and compare hashes at login. The point of a *password* hash is to be deliberately slow and to use a <Term id="salt">salt</Term>, a random value stored per user and mixed into the hash, so identical passwords produce different hashes and an attacker must crack each user separately. OWASP recommends Argon2id (memory-hard, so GPUs gain little) with at least 19 MiB of memory and 2 iterations, or bcrypt with a work factor of 10 or more where Argon2id is unavailable. <Src id="owasp-pw" />

### Least privilege

Every user, service and process gets only the access it needs, and no more. The reporting service connects with a read-only database user; the image resizer can read one bucket and write another; engineers use personal accounts with short-lived elevated access instead of a shared root login. The goal is to shrink the **blast radius**, the amount of damage one compromised account or one bug can cause. <Src id="wiki-lp" />

### Manage secrets

API keys, database passwords and signing keys never go in source code, container images or front-end bundles. Load them at run time from a secrets manager, give each one an owner, and rotate them on a schedule and immediately after any suspected leak. Better still, use short-lived credentials that the platform issues per service, so there is no long-lived secret to leak in the first place. <Src id="owasp-secrets" />

### Defence in depth

No single control is perfect, so you layer them, and an attacker has to beat every layer, not just one. <Src id="wiki-did" /> A typical stack, from the outside in:

1. **Edge:** a <Term id="cdn">CDN</Term> absorbs volumetric DDoS traffic, and a <Term id="waf">web application firewall</Term> blocks known attack patterns.
2. **Gateway:** <Term id="rate-limiting">rate limiting</Term> on login, signup and other expensive endpoints (see [Rate limiting](/modules/rate-limiting)), and <Term id="authentication">authentication</Term> on every request.
3. **Network:** databases and internal services sit in private subnets with no public address; security groups allow only the ports and callers each needs.
4. **Service:** <Term id="authorization">authorization</Term> checks for the specific object, input validation, and parameterised queries.
5. **Data:** encryption at rest, least-privilege database users, and backups that the application's own credentials cannot delete.
6. **Detection:** audit logs of who did what, shipped somewhere attackers cannot edit, with alerts on unusual patterns (see [Observability](/modules/observability)).

## Worked example

A consumer app has **10 million users**. An attacker finds an SQL injection bug in an old search endpoint and dumps the `users` table. Let us replay the breach under two designs.

**Design A: unsalted SHA-256.** A single modern GPU computes on the order of **20 billion SHA-256 hashes a second**. Because there is no salt, the attacker hashes each guess once and compares it against all 10 million rows at once.

- Every 8-character password made of lowercase letters and digits: 36⁸ ≈ 2.8 × 10¹² guesses. At 2 × 10¹⁰ a second that is about **140 seconds**, and it cracks every user with such a password simultaneously.
- A list of the 100 million most common leaked passwords takes well under a second. Typically a large share of accounts fall in the first hour.

**Design B: bcrypt, work factor 12, per-user salt.** The same GPU manages roughly **1,500 bcrypt guesses a second** at that cost. The salt means each guess tests one user only.

- The same 8-character space for **one** user: 2.8 × 10¹² / 1,500 ≈ 1.9 × 10⁹ seconds, about **60 years**.
- Even a 10,000-word list of common passwords, tried against every user, is 10¹¹ / 1,500 ≈ 770 days, about two years of GPU time to catch only the weakest passwords.

The difference is about a factor of 10⁷ in attacker cost, from one design decision.

**The bill for Design B.** Slowness is not free for you either. Suppose bcrypt at cost 12 takes about **250 ms of CPU** per hash on your servers, so one core verifies about 4 logins a second. At a peak of **200 logins a second**, hashing alone needs 200 / 4 = **50 cores**. That is why the login service is sized separately, and why it needs a rate limit: an attacker who sends 10,000 fake logins a second could otherwise burn 2,500 cores and take login down. A limit of, say, 5 attempts per account per minute plus 100 per IP per minute caps the damage and also stops online guessing.

**What the other layers would have changed.** A parameterised query in the search endpoint prevents the dump entirely. A read-only database user for search could still leak the table, but could not drop it or alter rows. Monitoring that alerts on a single query returning 10 million rows shortens the time to detection from months to minutes. Each layer is cheap; together they turn one bug into an incident instead of a catastrophe.

## In the real world

- **AWS KMS.** Keys are created and used inside KMS and never exported in plain form. Services such as S3, EBS and RDS use envelope encryption: KMS hands out a data key (`GenerateDataKey`), the service encrypts with it and stores only the encrypted copy of the key. Automatic rotation of customer-managed keys is off by default and, when enabled, rotates yearly by default; old key versions are kept so existing data still decrypts. <Src id="aws-kms" />
- **HashiCorp Vault.** Beyond storing static secrets, its database secrets engine creates a fresh database user for each service on demand, with a lease (a time limit, `default_ttl` and `max_ttl` on the role) after which Vault revokes it. A leaked credential stops working on its own.
- **AWS WAF and Cloudflare.** Both ship managed rule sets for common attacks such as SQL injection and XSS patterns, plus rate-based rules that block an IP once it exceeds a request count over a window (five minutes by default in AWS WAF). They are a useful outer layer, not a substitute for parameterised queries.
- **Let's Encrypt.** Made TLS free and automated. Certificates last 90 days, so renewal must be automated with an ACME client such as certbot, and short lifetimes limit how long a stolen key stays useful.

## Trade-offs

| Control | Protects against | Cost |
| --- | --- | --- |
| TLS everywhere, including internal | Eavesdropping and tampering on the network | Handshake <Term id="latency">latency</Term>, certificate management |
| Encryption at rest with KMS | Stolen disks, leaked snapshots and backups | KMS calls and key policies; no help against app-level attacks |
| Slow salted password hashes | Cracking a stolen users table | CPU at login, tens of cores at scale |
| Strict least privilege | Damage from one stolen credential or bug | Slower setup, more roles to manage |
| WAF and rate limits | Known attack patterns, brute force, floods | False positives that block real users |
| Audit logging | Undetected misuse, slow investigations | Storage, and risk of logging sensitive data |

- **More layers mean more latency and cost**, such as mutual TLS on every internal hop. Decide based on how sensitive the data is and what an outage costs.
- **Strict least privilege** slows teams down at first but sharply limits the blast radius of a breach.
- **Logs help investigations** but must never capture passwords, tokens, card numbers or other personal data, or the logs become the leak.

## Interview tips

- Say "TLS everywhere, encrypted at rest with keys in a KMS, secrets in a secrets manager" once, early, and move on unless the interviewer digs in.
- Put authentication at the API gateway and authorization checks in each service, against the specific object being accessed.
- Mention rate limiting on login and other expensive or sensitive endpoints, and connect it to password hashing cost.
- For payments or personal data, add audit logs, least privilege, data minimisation (store only what you need) and retention limits.

**Common mistakes:**

- **Relying on the network edge.** Terminating TLS at the load balancer and trusting everything inside means one compromised internal host can read all traffic.
- **Using a fast hash for passwords.** SHA-256 or MD5, even with a salt, lets a GPU try billions of guesses a second.
- **Treating input validation as the defence against injection.** Blocklists of "bad characters" always miss a case; parameterised queries do not depend on spotting bad input.
- **Committing a secret and then deleting it.** It stays in git history and every clone; the only fix is to rotate it.
- **Encrypting the data and storing the key beside it**, which protects against nothing.

## Common follow-up questions

### Encryption at rest is on. Why isn't the data safe?

Because disk encryption is transparent to anything running with the application's permissions. If an attacker gets SQL injection or the app's credentials, the database decrypts rows for them like any other query. Encryption at rest protects lost hardware, leaked snapshots and backups. Against application-level attacks you need input safety, least privilege, and for the most sensitive fields (card numbers, national IDs) application-level encryption or tokenisation, where only one narrow service holds the key.

### How do services authenticate to each other?

Use mutual TLS, where each service has a certificate identifying it, issued and rotated automatically by a service mesh or internal certificate authority, or signed short-lived tokens issued by a central identity service. Avoid shared static API keys between services: they spread, rarely rotate, and do not say which service made a call.

### How do you rotate a secret without downtime?

Support two valid versions at once. Issue the new secret, deploy services that accept both old and new, switch callers to the new one, confirm nothing uses the old one (logs help), then revoke it. For signing keys, publish the new public key before signing with it, so verifiers already know it. Dynamic secrets with short leases avoid manual rotation entirely.

### How do you defend against DDoS?

In layers. A CDN or anycast network soaks up volumetric floods far from your servers. A WAF and per-IP and per-account rate limits handle application-level floods, which look like real requests. Autoscaling buys time but costs money, so cap it. Make expensive endpoints, such as search and login, cheap to reject early, before they touch the database.

### What do you log, and what must you never log?

Log who did what, when, from where, and whether it was allowed: user ID, action, object ID, outcome, IP and request ID. Never log passwords, full tokens, session cookies, card numbers or secrets, and mask personal data. Ship audit logs to storage the application cannot modify, so an attacker cannot cover their tracks.

## Go deeper

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): current Argon2id, scrypt, bcrypt and PBKDF2 parameters, plus peppering and upgrading old hashes.
- [OWASP Top 10](https://owasp.org/Top10/): the latest list of the most critical web risks, each with examples and prevention steps.
- [AWS KMS concepts](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html): how KMS keys, data keys and envelope encryption fit together, and how rotation works.
- [Vault database secrets engine](https://developer.hashicorp.com/vault/docs/secrets/databases): dynamic, short-lived database credentials and how leases revoke them.
