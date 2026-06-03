# FEMS User Manual

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full system: users, customers, extinguishers, inspections, maintenance, compliance, reports, settings |
| **Inspector** | View extinguishers, complete inspections, log maintenance |
| **User (Customer)** | View own extinguishers, schedule inspections, view history, renewals, notifications |

## Sign in

1. Open the web app (default http://localhost:5173).
2. Enter email and password.
3. Confirm the sign-in prompt, then continue.

Demo accounts:

- Admin: `admin@fems.local` / `Admin@123`
- Inspector: `inspector@fems.local` / `Inspector@123`
- User: `alice@example.com` / `Customer@123`

## Register (User role)

1. Go to **Register**.
2. Enter first name, last name, email, and password (8+ chars with upper, lower, number).
3. Submit to create your account and customer profile. A **welcome email** is sent to your address (in development without SMTP, check the notification-service log).

**Admin-created users:** When an administrator adds a user under **Users**, a welcome email is sent with the email address and password the admin set. Users should sign in and change their password.

## Forgot password

1. On the login page, click **Forgot password**.
2. Enter your email and submit. If an account exists, a **6-digit verification code** is sent to that address.
3. Enter the code, your new password, and confirm the password, then submit.
4. Sign in with the new password. (In local development without SMTP, the code appears only in the **auth-service** server log and the **notification-service** mock email log—not in the browser.)

## Extinguishers (Admin)

1. **Extinguishers** → **Register Extinguisher**.
2. Fill serial number, location, type, size, installation date, expiry date, and customer.
3. Save. Delete requires confirmation.

## Schedule inspection (User / Admin)

1. **Inspections** → **Schedule Inspection**.
2. Select extinguisher, date (not in the past), and time (HH:mm).
3. Personnel are notified via the notification service.

## Log maintenance (Inspector)

1. **Inspections** → **Log Maintenance**.
2. Record extinguisher, action taken, date, issues, and notes.

## Reports (Admin)

1. **Reports** → choose report type and format (CSV, PDF, XLSX).
2. Download includes inventory summaries, inspection status, and maintenance history.

## Profile

**Profile** → update name or change password (current password required).
