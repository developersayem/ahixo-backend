"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmailBySMTP = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
//end config
dotenv_1.default.config({});
const sendVerificationEmailBySMTP = async (to, code) => {
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST, // mail.shopxet.com
        port: 465, // SSL port
        secure: true, // <- this MUST be true for port 465
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false, // optional, helps with self-signed certs
        },
    });
    const mailOptions = {
        from: `"Prompt Hub" <${process.env.SMTP_USER}>`,
        to,
        subject: "Verify your email address",
        html: `
      <h2>Welcome to Prompt Hub 👋</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #4f46e5;">${code}</h1>
      <p>Use this code to verify your email. It expires in 10 minutes.</p>
    `,
    };
    await transporter.sendMail(mailOptions);
};
exports.sendVerificationEmailBySMTP = sendVerificationEmailBySMTP;
