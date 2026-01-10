
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    console.log("Checking Groq connection...");
    try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
        });
        console.log("Status:", res.status);
        if (res.ok) {
            const data = await res.json();
            console.log("Data:", JSON.stringify(data).substring(0, 50) + "...");
        } else {
            const txt = await res.text();
            console.log("Error Body:", txt);
        }
    } catch (e) {
        console.log("Network Error:", e.cause || e.message);
    }
}

check();
