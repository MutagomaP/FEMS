# UI Mockups

Figma files are not bundled in this repository. The **implemented React UI** serves as the live mockup/reference, with screenshots captured from the running frontend.

## Screens

| Spec screen | Route | Screenshot |
|-------------|-------|------------|
| Registration | `/register` | [register.png](screenshots/register.png) |
| Login | `/login` | [login.png](screenshots/login.png) |
| Dashboard | `/dashboard` | [dashboard.png](screenshots/dashboard.png) |
| Fire extinguisher management | `/extinguishers` | [extinguishers.png](screenshots/extinguishers.png) |
| Inspection scheduling | `/inspections` | [inspections.png](screenshots/inspections.png) |
| Reports | `/reports` | [reports.png](screenshots/reports.png) |
| Forgot password | `/forgot-password` | [forgot-password.png](screenshots/forgot-password.png) |
| Reset password | `/reset-password` | [reset-password.png](screenshots/reset-password.png) |

## Capture screenshots

With the frontend running (`cd frontend && npm run dev`):

```bash
node scripts/capture-ui-screenshots.mjs
```

Screenshots are saved to `docs/screenshots/`.

## Design stack

Tailwind CSS, fire-safety themed palette (orange/red accents), sidebar navigation, responsive tables and modals.
