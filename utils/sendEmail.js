const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Send an email. Fails silently (logs only) so that email issues never
 * block a core request like signup or payment confirmation.
 * @param {{to: string, subject: string, html: string, text?: string}} options
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("sendEmail skipped: SMTP credentials not configured");
      return;
    }
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error("email send  error:", error.message);
  }
}

module.exports = sendEmail;
