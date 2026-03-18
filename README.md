# MyAspNetStaticStarter

ASP.NET Core starter for hosting static files from `wwwroot/` plus a tiny API endpoint.

## Prerequisites

- .NET SDK (project targets `net9.0`)

## Run

- `dotnet run --project .\MyAspNetStaticStarter.csproj`
- Open the printed URL (defaults to `https://localhost:####/`)

### What’s included

- Static site: `GET /` serves `wwwroot/index.html`
- Sample API: `GET /api/hello` returns `"Hello World!"`

## Build

- `dotnet restore .\MyAspNetStaticStarter.sln`
- `dotnet build .\MyAspNetStaticStarter.sln -v minimal`

## Test

- `dotnet test .\MyAspNetStaticStarter.sln -v minimal`

## Notes

- Don’t commit secrets to source control. Prefer environment variables or `dotnet user-secrets` for local development.

## License

MIT — see [LICENSE](LICENSE).
