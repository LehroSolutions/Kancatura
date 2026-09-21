# Security Policy

## Supported versions

Security fixes target the latest mainline release of **Kancatura**.

## Reporting a vulnerability

Report privately via GitHub Private Vulnerability Reporting (when enabled) or email maintainers.

Include version/commit, reproduction steps, and impact.
Do **not** open public issues for undisclosed vulnerabilities.

## Scope notes

- Business plan data lives in users' IndexedDB — report any code path that
  could exfiltrate local data to a third party as a critical vulnerability.
- Convex deployment credentials are secrets; never commit them.

## Production expectations

- Never commit `.env`/`.env.local`, keys, tokens, or live databases
- Use strong secrets in production
- Keep dependencies updated
- Prefer least-privilege credentials
