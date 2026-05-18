# Jimmy Perron — Industrial Systems Portfolio

Portfolio and experimental platform for building and showcasing practical solutions in industrial technology, data analysis, and manufacturing systems.

Built with ASP.NET Core and a custom frontend to demonstrate how software can directly support operations, improve visibility, and reduce friction in production environments.

## 🌐 Live Preview

> Coming soon

## 🚀 Overview

This portfolio highlights:

- Industrial systems experience (MES, SCADA, data analysis)
- Real-world problem solving in manufacturing environments
- Frontend development (HTML, CSS, JavaScript)
- Backend hosting with ASP.NET Core

The goal is simple: build tools and systems that actually help operations run better.

## 🧱 Architecture

\`\`\`
ASP.NET Core (Backend)
├── Serves static frontend (wwwroot/)
├── Provides API endpoints
│
Frontend (HTML/CSS/JS)
├── Responsive layout
├── Interactive UI (filtering, lightbox, form validation)
└── Portfolio content
\`\`\`

## ⚙️ Features

### Frontend
- Responsive layout for desktop and mobile
- Navigation with smooth scrolling
- Project filtering by category
- Lightbox modal for project images
- Contact form with validation
- CSS Grid-based form layout

### Backend
- ASP.NET Core minimal setup
- Static file hosting (`wwwroot`)
- Sample API endpoint: `GET /api/hello`

## 📁 Project Structure

\`\`\`
MyPortfolio/
├── wwwroot/           # Frontend (HTML, CSS, JS, images)
├── Program.cs         # ASP.NET Core entry point
├── MyPortfolio.csproj # Project configuration
├── tests/             # Unit tests
├── README.md
├── CHANGELOG.md
└── LICENSE
\`\`\`

## 🛠️ Tech Stack

- **Backend:** ASP.NET Core (.NET 9)
- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **Architecture:** Static hosting + lightweight API
- **Version Control:** Git

## ▶️ Getting Started

### Prerequisites
- .NET SDK (`net9.0`)

### Run locally

\`\`\`bash
dotnet run --project ./MyPortfolio.csproj
\`\`\`

Then open: `https://localhost:####/` (check terminal for actual port)

### Build

\`\`\`bash
dotnet restore ./MyPortfolio.sln
dotnet build ./MyPortfolio.sln -v minimal
\`\`\`

### Contact email setup (Resend + user-secrets)

Use user-secrets for local credentials (do not store API keys in `appsettings.json`):

\`\`\`bash
dotnet user-secrets set "Resend:ApiKey" "..."
dotnet user-secrets set "Resend:FromEmail" "onboarding@resend.dev"
dotnet user-secrets set "Resend:ToEmail" "jim.perron@outlook.com"
\`\`\`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- GitHub: https://github.com/Onurb29
- LinkedIn: https://www.linkedin.com/in/jimmy-perron-ba9580173/
