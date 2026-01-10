
import { queryRAG } from './rag.js';
import dotenv from 'dotenv';
dotenv.config();

console.log = () => { }; // Silence logs except explicit result

async function test() {
    try {
        process.stdout.write("START_TEST\n");
        const response = await queryRAG("Hello");
        process.stdout.write("SUCCESS: " + response + "\n");
    } catch (e) {
        process.stdout.write("ERROR: " + e.message + "\n");
        if (e.error) {
            process.stdout.write("API ERROR: " + JSON.stringify(e.error) + "\n");
        }
    }
}

test();
