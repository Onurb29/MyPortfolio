# Development and releases

## Local checks

Requires Node.js 22, Python 3, and the .NET 9 SDK matching the existing backend.

```sh
npm ci
npm run check
npx playwright install chromium
npm test
dotnet restore MyPortfolio.sln
dotnet build MyPortfolio.sln --configuration Release --no-restore
dotnet test MyPortfolio.sln --configuration Release --no-build
```

Linux machines may need `npx playwright install --with-deps chromium` instead.

The frontend has no runtime npm dependencies. npm is only used for development checks. The publish directory remains `wwwroot` with no frontend build step.

## CI checks

- **Frontend checks**: JavaScript syntax, missing local links/assets/fragments, duplicate HTML IDs, and Chromium desktop/mobile tests of navigation, map selection, tabs, reset, and horizontal overflow. The external map is stubbed in browser tests so a third-party outage cannot block releases.
- **Backend tests**: restore/build the .NET solution and run HTTP tests for the current pages, asset types, missing assets, hello API, and rejected contact submissions. Tests never send email.

The workflow runs on every pull request targeting `main` and every push to `main`, without path filters. It has read-only repository permissions and uses no deployment credentials. Test artifacts are retained for seven days.

## Required protection for main

Branch protection is an account setting; adding a workflow file does not enable it. At the time this document was added, `main` was unprotected and the connected GitHub tool could not modify protection settings.

In **Settings → Branches → Add classic branch protection rule**, use branch name pattern `main`:

1. Require a pull request before merging. Leave required approvals disabled for a solo-maintained repository; you cannot approve your own pull request.
2. Require status checks to pass: **Frontend checks** and **Backend tests** (GitHub Actions).
3. Require branches to be up to date before merging.
4. Require conversation resolution before merging.
5. Enable **Do not allow bypassing the above settings**, including administrators.
6. Keep force pushes and branch deletion disabled.

Save, then verify that `main` is marked protected. The checks must run once before they can be selected. Do not treat this document as confirmation that the rule is enabled.

## Release workflow

Create a short-lived branch, commit changes, and open a pull request to `main`. Wait for both CI jobs and inspect the Cloudflare preview when available. Merge after checks succeed; Cloudflare then publishes `wwwroot` to jimmyperron.com. Check the Cloudflare Pages deployment result and verify `/` and `/homelab/` on the live site.

Cloudflare deployment and GitHub Actions run independently on a push. Protection is what prevents untested changes from reaching `main`; a workflow alone does not hold back a deployment. Live verification is currently manual.

The .NET backend is validated by CI but is not executed or deployed by Cloudflare Pages.

## Recovery

For a bad release, create a branch from current `main`, revert the offending commit, and open a pull request. Pass the checks and merge the revert so source and deployment remain aligned. Do not force-push `main` or disable protection as a routine recovery method.
