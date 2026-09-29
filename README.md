# automated-book-recommendation

## Password and email configuration

New accounts created by an administrator must change their temporary password on first sign-in. Users can also change their password from the profile opened by clicking their name in the header.

Forgot-password links are single-use and expire after 30 minutes. To enable reset emails, configure these variables in `server/.env` before starting the API:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM="Book Recommendation Portal <no-reply@example.com>"
CLIENT_URL=http://localhost:5173
```

Use your email provider's SMTP host, port, credentials, and verified sender address. For implicit TLS (commonly port 465), set `SMTP_SECURE=true`. Keep SMTP credentials private and out of source control. Until SMTP is configured, password reset requests return an administrator-configuration message.