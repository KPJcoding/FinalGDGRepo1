import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

let transporter = null;

if (missingVars.length === 0) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

export async function verifyConnection() {
    if (missingVars.length > 0) {
        console.error('---------------------------------------------------');
        console.error('[FATAL ERROR] Missing Email Configuration:');
        missingVars.forEach(v => console.error(` - ${v}`));
        console.error('Please configure .env file with SMTP details.');
        console.error('---------------------------------------------------');
        return false;
    }

    try {
        await transporter.verify();
        console.log('[MAILER] SMTP Connection established successfully.');
        return true;
    } catch (error) {
        console.error('[MAILER] SMTP Connection Failed:', error);
        return false;
    }
}

export async function sendOtpEmail(to, otp) {
    if (!transporter) {
        throw new Error('Email transporter not initialized due to missing configuration.');
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: to,
        subject: 'Your Sol-1 Verification Code',
        text: `Your Verification Code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #0891b2;">Sol-1 Verification</h2>
                <p>Use the code below to verify your email address:</p>
                <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                    ${otp}
                </div>
                <p style="font-size: 14px; color: #666;">This code expires in 5 minutes.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">If you didn't request this, please ignore this email.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[MAILER] OTP sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[MAILER] Failed to send OTP to ${to}:`, error);
        throw error;
    }
}
