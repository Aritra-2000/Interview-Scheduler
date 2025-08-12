import nodemailer from "nodemailer";


export function getTransport() {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return transporter;
}

export async function sendReminder(to: string, subject: string, text: string) {
  const transporter = getTransport();
  await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
}
