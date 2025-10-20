import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({});

export const sendVerificationEmailByGMAIL = async (to: string, code: string) => {
  const transporter = nodemailer.createTransport({
  host: process.env.GMAIL_HOST,
  port: Number(process.env.GMAIL_PORT) || 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

  const mailOptions = {
    from: `"AHIXO" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Verify your email - AHIXO",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - AHIXO</title>
      </head>
      <body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background-color: #2563eb; padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px;">
              AHIXO
            </h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
              Email Verification
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #333; text-align: center; margin: 0 0 20px 0; font-size: 24px;">
              Verify Your Email
            </h2>
            <p style="color: #666; text-align: center; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              Please use the verification code below to complete your registration.
            </p>
            
            <!-- Verification Code -->
            <div style="background-color: #f8f9fa; border: 2px dashed #2563eb; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
              <p style="color: #666; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                Verification Code
              </p>
              <div style="background-color: #2563eb; color: white; padding: 15px 25px; border-radius: 6px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; font-family: monospace;">
                ${code}
              </div>
            </div>
            
            <!-- Timer -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                ⏰ This code expires in <strong>10 minutes</strong>
              </p>
            </div>
            
            <p style="color: #666; text-align: center; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              If you didn't request this verification, you can safely ignore this email.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              © 2024 AHIXO. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      AHIXO - Email Verification
      
      Your verification code is: ${code}
      
      Please use this code to verify your email address. This code will expire in 10 minutes.
      
      If you didn't request this verification, you can safely ignore this email.
      
      © 2024 AHIXO. All rights reserved.
    `,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent successfully to ${to}`);
    console.log(`Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email. Please try again.');
  }
};
