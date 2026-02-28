export interface PasswordResetEmailProps {
  expiresInMinutes: number;
  resetUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generatePasswordResetEmailSubject(): string {
  return "Reset your Cal Poly Red Cross Club password";
}

export function generatePasswordResetEmailText(
  props: PasswordResetEmailProps
): string {
  const { expiresInMinutes, resetUrl } = props;
  return [
    "Cal Poly Red Cross Club password reset",
    "",
    "We received a request to reset your password.",
    "",
    `Reset your password: ${resetUrl}`,
    "",
    `This link expires in ${expiresInMinutes} minutes.`,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
}

export function generatePasswordResetEmailHtml(
  props: PasswordResetEmailProps
): string {
  const { expiresInMinutes, resetUrl } = props;
  const safeUrl = escapeHtml(resetUrl);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; background: #f4f6f8; color: #1f2937; font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
    .header { background: #dc2626; color: #ffffff; padding: 20px; text-align: center; }
    .content { padding: 24px; line-height: 1.6; }
    .button { display: inline-block; margin-top: 12px; padding: 12px 20px; border-radius: 8px; background: #dc2626; color: #ffffff !important; text-decoration: none; font-weight: 600; }
    .small { margin-top: 20px; color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1 style="margin: 0; font-size: 22px;">Cal Poly Red Cross Club</h1>
      </div>
      <div class="content">
        <p style="margin-top: 0;">We received a request to reset your password.</p>
        <p>Use the button below to set a new password:</p>
        <a class="button" href="${safeUrl}">Reset Password</a>
        <p class="small">This link expires in ${expiresInMinutes} minutes. If you did not request a reset, you can ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
