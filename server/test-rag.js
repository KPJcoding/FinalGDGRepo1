
import { queryRAG } from './rag.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'server/.env' });

async function test() {
    console.log("Testing RAG with server/.env...");
    console.log("API Key present:", !!process.env.GROQ_API_KEY);
    console.log("Model:", process.env.GROQ_MODEL || 'mixtral-8x7b-32768');
    try {
        const response = await queryRAG("Hello");
        console.log("Response:", response);
    } catch (e) {
        console.error("Error Message:", e.message);
    }
}

test();
