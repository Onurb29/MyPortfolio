# Changelog

## 2026-09-16 — Restore contact form

- Restored Full Name, Email Address, Subject, Message, and Send Message in the Tokyo Night theme.
- Added validation, accessible status feedback, duplicate-submit prevention, and preservation of entered text on failure.
- Added a Cloudflare Pages contact endpoint using server-side Resend configuration; the existing .NET endpoint remains available for .NET hosting.
- Added browser submission tests and mocked function tests. Real email delivery requires Cloudflare secrets and sender configuration.

## 2026-09-16 — Portfolio refresh and CI

- Published the Tokyo Night portfolio and interactive homelab, with social icons, technology marks, and the Terrace map.
- Replaced device hostnames with NAS and AI Server; clarified SCADA integration, data acquisition and validation, and contact wording.
- Replaced obsolete website tests with current HTTP and contact-validation checks; removed the broken starter test project and populated the XML solution.
- Added frontend asset/link checks and desktop/mobile browser tests.
- Added GitHub Actions jobs named Frontend checks and Backend tests for pull requests and main pushes.
- Documented development, release, rollback, and required main protection settings. Branch protection requires a separate repository-settings change.

## [1.0.0] - Initial Portfolio Implementation

### Added
- Semantic HTML structure for portfolio website
- Sections: Header, About Me, Projects, Skills, Contact
- Navigation menu with anchor links
- Contact form with input fields and validation
- JavaScript interactivity:
  - Smooth scrolling navigation
  - Project filtering by category
  - Lightbox modal for project images
  - Form validation with user feedback

### Improved
- Refactored HTML to align with CSS class structure
- Added responsive navigation with toggle menu
- Implemented CSS Grid for contact form alignment
- Improved layout consistency and spacing
- Enhanced accessibility with labels and semantic tags

### Styling
- Created consistent design system (colors, spacing, typography)
- Added card layout for projects
- Styled buttons and interactive elements
- Implemented responsive design for mobile devices

### Fixed
- Alignment issues in contact form
- CSS selectors not matching HTML structure
- JavaScript targeting missing elements

### Frontend
- Added project filtering UI
- Implemented CSS Grid form layout

### Backend
- Initial ASP.NET setup
