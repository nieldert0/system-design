---
slug: security-basics
title: Security basics
section: security
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
    explanation: Bound parameters keep data and code separate.
  - prompt: How should passwords be stored?
    options:
      - Encrypted with a key in the config file
      - Hashed with a slow, salted algorithm such as Argon2id or bcrypt
      - Hashed with plain SHA-256
      - In plain text so support can read them
    correct: 1
    explanation: Slow salted hashes make stolen password tables very expensive to crack.
  - prompt: What does the principle of least privilege say?
    options:
      - Give each user and service only the access it needs
      - Use the fewest servers possible
      - Log as little as possible
      - Give everyone admin to save time
    correct: 0
    explanation: It limits the damage a compromised account or bug can do.
  - prompt: Where should API keys and database passwords live?
    options:
      - In the front-end bundle
      - In log messages
      - In the git repository
      - In a secrets manager or environment injected at run time
    correct: 3
    explanation: Secrets in code leak through history, forks and builds.
  - prompt: What is cross-site scripting (XSS)?
    options:
      - A type of DDoS
      - Running too many sites on one server
      - An attacker getting their script to run in other users' browsers on your site
      - A CSS bug
    correct: 2
    explanation: Escape output by context and use a Content Security Policy.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import TransitVsRest from '#lib/diagrams/TransitVsRest.svelte';
</script>

Security is rarely the focus of a design interview, but a few basics should show up in every design.

## What it is

Security means keeping data **confidential**, **intact** and **available** to the right people. The System Design Primer lists the basics: encrypt in transit and at rest, sanitise all user input (and anything sent back to the user) to prevent XSS and SQL injection, use parameterised queries, and follow the **<Term id="least-privilege">principle of least privilege</Term>**. <Src id="primer-sec" />

The **OWASP Top 10** is a widely used list of the most critical web application risks, such as broken access control, injection and security misconfiguration. <Src id="owasp-top10" />

## How it works

**Encrypt in transit.** Use HTTPS (<Term id="tls">TLS</Term>) for clients, and TLS or mutual TLS between internal services. Terminate TLS at the <Term id="load-balancer">load balancer</Term> only if the internal network is trusted. <Src id="primer-sec" />

**Encrypt at rest.** Encrypt databases, disks, backups and <Term id="object-storage">object storage</Term>, with keys held in a key management service rather than next to the data. <Src id="primer-sec" />

<TransitVsRest />

**Never trust input.** <Src id="owasp-sqli" />

- **<Term id="sql-injection">SQL injection</Term>**: use parameterised queries (prepared statements) so input is always data, never SQL. Validate input with an allow list as a second layer.
- **<Term id="xss">XSS</Term>**: escape output for its context (HTML, attribute, URL, JS) and add a Content Security Policy. <Src id="owasp-xss" />

**Store passwords properly.** Never store them in plain text or with a fast hash. Use a slow, salted, memory-hard hash such as Argon2id, or bcrypt. <Src id="owasp-pw" />

**Least privilege.** Every user, service and process gets only the access it needs: read-only database users for read paths, narrow cloud IAM roles, no shared admin accounts. <Src id="wiki-lp" />

**Manage secrets.** Keep keys and passwords out of code. Load them from a secrets manager at run time and rotate them. <Src id="owasp-secrets" />

**Defence in depth.** Layer controls: firewalls and private subnets, <Term id="rate-limiting">rate limiting</Term> and a web application firewall at the edge, <Term id="authentication">authentication</Term> and <Term id="authorization">authorization</Term> at every service, and audit logs. <Src id="wiki-did" />

## Trade-offs

- **More layers mean more <Term id="latency">latency</Term> and cost**, such as mutual TLS on every internal hop; decide based on how sensitive the data is.
- **Strict least privilege** slows teams down at first but sharply limits the blast radius of a breach.
- **Slow password hashes** cost CPU at login; that is the point, but size the auth service for it.
- **Logging helps investigations** but must not capture passwords, tokens or personal data.

## Interview tips

- Say "TLS everywhere, encrypted at rest, keys in a KMS" once and move on unless asked.
- Put authentication at the API gateway and authorization checks in each service.
- Mention rate limiting on login and other sensitive endpoints.
- For payments or personal data, add audit logs, least privilege and data minimisation.
