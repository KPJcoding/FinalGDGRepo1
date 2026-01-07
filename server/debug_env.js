import dotenv from 'dotenv';
dotenv.config();
console.log('Current Directory:', process.cwd());
console.log('PORT:', process.env.PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
