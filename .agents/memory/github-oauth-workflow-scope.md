---
name: GitHub OAuth push cannot write workflow files
description: Replit's GitHub connector token lacks `workflow` scope, so git push is rejected when the pushed commits add/modify .github/workflows/*
---

# GitHub OAuth connection cannot push workflow files

The Replit GitHub integration (connector `ccfg_github`) grants an OAuth token
with scopes: `read:org, read:project, read:user, repo, user:email`. It does
**NOT** include the `workflow` scope.

**Symptom:** `git push` is rejected with
`refusing to allow an OAuth App to create or update workflow .github/workflows/<file> without workflow scope`.
The whole push fails (atomic), not just the workflow file.

**Why:** GitHub blocks OAuth apps without `workflow` scope from writing any file
under `.github/workflows/`.

**How to apply / workarounds when a repo needs GitHub Actions:**
- Push everything except the workflow file via the OAuth token, then have the
  user add the workflow file through the GitHub web UI (the user's own session
  has workflow scope).
- OR ask the user for a Personal Access Token (classic) with `repo` + `workflow`
  scope, store it as a secret, and push with that.
- The connector token is still fine for all non-workflow files and for GitHub
  REST API calls (create repo, etc.).

Access the connector token in code via `listConnections('github')` →
`conn.settings.access_token` (do not print it).
