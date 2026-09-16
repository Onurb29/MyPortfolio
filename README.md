# Jimmy Perron — Industrial Systems

Source for [jimmyperron.com](https://jimmyperron.com), featuring the portfolio and interactive Homelab Operations Portal in the Tokyo Night theme.

## Frontend

The complete, dependency-free HTML/CSS/JavaScript site lives in `wwwroot/`:

- `index.html`: portfolio, social links, contact information, and Terrace map.
- `homelab/index.html`: interactive architecture diagram and platform details.
- `architecture.js` / `architecture.css`: diagram connections and node interactions.
- `app.js`: homelab navigation.
- `contact.js` / `contact.css`: accessible contact form and submission feedback.
- `tokyo-night.css`: shared theme and responsive refinements.
- `logos/`: local technology and social icons, with source attribution in `SOURCES.txt`.

No npm install or frontend build is needed. Preview locally:

```sh
python3 -m http.server 8000 --directory wwwroot
```

Open `http://localhost:8000` and `http://localhost:8000/homelab/`.

## Cloudflare Pages

The repository is connected to Cloudflare Pages. Pushes to the production branch `main` trigger deployment. The static publish directory is `wwwroot`; the frontend needs no build command. Keep the existing Cloudflare project and custom-domain settings for `jimmyperron.com`.

Cloudflare deployment status appears in the commit's **Cloudflare Pages** check. No Cloudflare tokens or account secrets are included in this repository.

## Development checks and releases

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for local tests, the pull-request workflow, required branch protection, and recovery steps. GitHub Actions runs frontend checks and backend tests on pull requests to `main` and pushes to `main`.

## Optional ASP.NET Core host

The existing .NET 9 project, API endpoints, and tests are retained:

```sh
dotnet run --project MyPortfolio.csproj
```

`Program.cs` serves `wwwroot` and provides `GET /api/hello` and `POST /api/contact`. The restored contact form posts to `/api/contact`. On Cloudflare Pages this route is handled by `functions/api/contact.js`; on a .NET host it is handled by `Program.cs`. Cloudflare does not execute the .NET backend.

### Contact email on Cloudflare

In the Pages project's **Settings → Variables and Secrets**, configure these Production values and redeploy:

- `RESEND_API_KEY`: secret containing a Resend sending API key.
- `RESEND_FROM_EMAIL`: sender address on your verified Resend domain.
- `RESEND_TO_EMAIL`: inbox where you want to receive enquiries.

Keep the Pages project root at the repository root and output directory at `wwwroot` so Cloudflare discovers `functions/`. `_routes.json` limits function execution to the contact endpoint. A GET to `/api/contact` reports `available: true` when all settings are present; it does not validate the key or send email. Missing settings produce an honest error and preserve the visitor's message. Tests mock Resend and never send real emails.

The function validates input, limits request size, checks browser origin, and includes a honeypot and timing check. These are basic spam controls, not a distributed rate limit. Cloudflare rate limiting or Turnstile can be added if needed. Do not copy production email credentials into preview environments unless preview email delivery is intended.

See [Pages function bindings](https://developers.cloudflare.com/pages/functions/bindings/) and [Resend's email API](https://resend.com/docs/api-reference/emails/send-email). A Python static preview can display the form but cannot send messages.

For a separate .NET deployment using the contact endpoint, configure `Resend:ApiKey`, `Resend:FromEmail`, and `Resend:ToEmail` through environment configuration or local user-secrets. Never commit credentials.

## License and assets

Project code is covered by the existing MIT license. Third-party marks remain the property of their respective owners; icon sources and usage notes are recorded in `wwwroot/logos/SOURCES.txt`. The embedded map credits OpenStreetMap contributors.
