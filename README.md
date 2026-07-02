# Graduation Demo — Replit → GitHub → Docker

This project simulates the "graduation" workflow: you build in Replit, push to
GitHub, GitHub Actions turns your code into a production Docker image, and you
run that exact image on your own machine in Docker Desktop. It's a small,
end-to-end stand-in for deploying to your own infrastructure or cloud.

The app itself is intentionally tiny: a single page that shows which commit it
was built from and when. That way, every time you push and redeploy, you can
*see* the new version take over.

## The flow

```
Edit in Replit  →  Push to GitHub  →  GitHub Actions builds & publishes image
                                                          │
                                                          ▼
                                     ghcr.io/<owner>/<repo>:latest
                                                          │
                             ./deploy-local.sh (on your Mac)  ◀── you run this
                                                          │
                                                          ▼
                                    Container running in Docker Desktop
```

## What's in here

| Path | Purpose |
| --- | --- |
| `demo-app/` | The zero-dependency Node web app (shows deploy metadata). |
| `Dockerfile` | Multi-stage, production Docker build for the app. |
| `.dockerignore` | Keeps the Docker build context tiny. |
| `.github/workflows/deploy.yml` | On push to `main`: build the image and publish it to GHCR. |
| `deploy-local.sh` | Pull the newest image and (re)start it in your local Docker. |

## One-time setup

1. **Push this repo to GitHub** (the Replit Git panel / GitHub connection does
   this for you). The workflow runs automatically on every push to `main`.

2. **Let the first Actions run finish.** In your repo on GitHub, open the
   **Actions** tab and wait for **"Build and publish image"** to go green. It
   publishes an image to the GitHub Container Registry (GHCR).

3. **Make the image pullable from your machine.** Pick one:
   - **Easiest — make the package public:** In your repo, go to the right-hand
     **Packages** section → open the package → **Package settings** → **Change
     visibility** → **Public**. Now anyone (including your laptop) can pull it
     with no login.
   - **Or stay private and log in once** on your Mac:
     ```bash
     # Create a GitHub Personal Access Token (classic) with the read:packages scope.
     echo YOUR_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
     ```

4. **Have Docker Desktop running** on your Mac.

## Deploy to your machine

From a clone of this repo on your Mac:

```bash
./deploy-local.sh
```

That's it. The script auto-detects the image name from your git remote, pulls
`ghcr.io/<owner>/<repo>:latest`, removes any previous container, starts the new
one, and prints the URL. Open **http://localhost:8080** — you'll see the commit
it was built from. It also shows up in the **Containers** tab of Docker Desktop
as `graduation-demo`.

Options:

```bash
./deploy-local.sh ghcr.io/owner/repo   # pass the image explicitly
PORT=3000 ./deploy-local.sh            # use a different local port
TAG=<commit-sha> ./deploy-local.sh     # run a specific version instead of latest
```

## See a new version deploy

1. Change something in Replit — e.g. edit the `APP_NAME` default in
   `demo-app/server.js` or tweak the page.
2. Push to GitHub.
3. Wait for the Actions run to go green.
4. Run `./deploy-local.sh` again on your Mac.
5. Refresh **http://localhost:8080** — the commit hash and build time have
   changed. That's your new version, live.

## Notes

- The image is published for the `linux/amd64` builder GitHub uses. It runs on
  Apple Silicon Macs via Docker Desktop's built-in emulation.
- The container runs as a non-root user and exposes a health check at
  `/healthz`.
- This demo does not include a database. In a real graduation, database
  provisioning, migrations, and secrets are handled by your pipeline and your
  cloud's secrets manager — see the enterprise docs in `attached_assets/`.
