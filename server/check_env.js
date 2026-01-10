
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const hasKey = !!process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL;
fs.writeFileSync('env_check.txt', `Has Key: ${hasKey}\nModel: ${model}`);
