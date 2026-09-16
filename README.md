# Jimmy Perron — Industrial Systems

Source for [jimmyperron.com](https://jimmyperron.com), featuring the portfolio and interactive Homelab Operations Portal in the Tokyo Night theme.

## Frontend

The complete, dependency-free HTML/CSS/JavaScript site lives in `wwwroot/`:

- `index.html`: portfolio, social links, contact information, and Terrace map.
- `homelab/index.html`: interactive architecture diagram and platform details.
- `architecture.js` / `architecture.css`: diagram connections and node interactions.
- `app.js`: homelab navigation.
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

`Program.cs` serves `wwwroot` and provides `GET /api/hello` and `POST /api/contact`. The redesigned static frontend uses direct email and social links; it does not call the contact API. Cloudflare Pages static hosting does not execute the .NET backend.

For a separate .NET deployment using the contact endpoint, configure `Resend:ApiKey`, `Resend:FromEmail`, and `Resend:ToEmail` through environment configuration or local user-secrets. Never commit credentials.

## License and assets

Project code is covered by the existing MIT license. Third-party marks remain the property of their respective owners; icon sources and usage notes are recorded in `wwwroot/logos/SOURCES.txt`. The embedded map credits OpenStreetMap contributors.
