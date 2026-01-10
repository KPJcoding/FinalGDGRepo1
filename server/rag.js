import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

const KNOWLEDGE_BASE_DIR = path.join(__dirname, 'knowledge-base');
const MODEL = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';

// Simple in-memory vector store (using keyword matching instead of embeddings for simplicity)
let documentChunks = [];

/**
 * Load all markdown files from knowledge base directory
 */
async function loadDocuments() {
    try {
        const files = await fs.readdir(KNOWLEDGE_BASE_DIR);
        const markdownFiles = files.filter(file => file.endsWith('.md'));

        const documents = [];
        for (const file of markdownFiles) {
            const filePath = path.join(KNOWLEDGE_BASE_DIR, file);
            const content = await fs.readFile(filePath, 'utf-8');
            documents.push({
                filename: file,
                content: content,
                metadata: { source: file }
            });
        }

        console.log(`[RAG] Loaded ${documents.length} documents from knowledge base`);
        return documents;
    } catch (error) {
        console.error('[RAG] Error loading documents:', error);
        return [];
    }
}

/**
 * Split text into chunks with overlap
 * @param {string} text - Text to split
 * @param {number} chunkSize - Size of each chunk
 * @param {number} overlap - Overlap between chunks
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end);

        if (chunk.trim().length > 0) {
            chunks.push(chunk.trim());
        }

        start += chunkSize - overlap;
    }

    return chunks;
}

/**
 * Process documents into chunks and store them
 */
async function initializeRAG() {
    console.log('[RAG] Initializing RAG system...');

    const documents = await loadDocuments();
    documentChunks = [];

    for (const doc of documents) {
        const chunks = chunkText(doc.content);
        chunks.forEach((chunk, index) => {
            documentChunks.push({
                content: chunk,
                metadata: {
                    source: doc.filename,
                    chunkIndex: index
                }
            });
        });
    }

    console.log(`[RAG] Created ${documentChunks.length} chunks from ${documents.length} documents`);
}

/**
 * Simple keyword-based retrieval (BM25-like scoring)
 * In production, use proper embeddings and vector similarity
 */
function retrieveRelevantChunks(query, topK = 5) {
    const queryWords = query.toLowerCase().split(/\s+/);

    // Score each chunk based on keyword matches
    const scoredChunks = documentChunks.map(chunk => {
        const chunkText = chunk.content.toLowerCase();
        let score = 0;

        queryWords.forEach(word => {
            if (word.length > 2) { // Lowered from 3 to 2 for better matching
                const matches = (chunkText.match(new RegExp(word, 'g')) || []).length;
                score += matches;
            }
        });

        return { ...chunk, score };
    });

    // Sort by score and return top K
    return scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter(chunk => chunk.score > 0);
}

/**
 * Build RAG prompt with retrieved context
 */
function buildRAGPrompt(userMessage, retrievedChunks) {
    let context = '';

    if (retrievedChunks.length > 0) {
        context = 'Here is relevant information from the Sol-1 knowledge base:\n\n';
        retrievedChunks.forEach((chunk, index) => {
            context += `[Source: ${chunk.metadata.source}]\n${chunk.content}\n\n`;
        });
    } else {
        context = 'No specific information found in the knowledge base. ';
    }

    const systemPrompt = `You are Sol-1 Assistant, a helpful AI assistant for IIIT Nagpur's knowledge hub platform. 
Your job is to help students with questions about the platform, hackathon rules, IIIT Nagpur, and general academic queries.

${context}

Based on the above context and your knowledge, provide a helpful, accurate, and friendly response. 
If the question is not covered in the context, use your general knowledge but mention that it's not from the official knowledge base.
Keep responses concise but informative.`;

    return systemPrompt;
}

/**
 * Main RAG query function
 * @param {string} userMessage - User's question
 * @returns {Promise<string>} AI response
 */
export async function queryRAG(userMessage) {
    try {
        console.log(`[RAG] Query: ${userMessage}`);

        // 1. Retrieve relevant chunks
        const relevantChunks = retrieveRelevantChunks(userMessage);
        console.log(`[RAG] Retrieved ${relevantChunks.length} relevant chunks`);

        // 2. Build prompt with context
        const systemPrompt = buildRAGPrompt(userMessage, relevantChunks);

        // 3. Call Groq API
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userMessage
                }
            ],
            model: MODEL,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false
        });

        const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        console.log(`[RAG] Response generated (${response.length} chars)`);

        return response;

    } catch (error) {
        console.error('[RAG] Error in queryRAG:', error);

        // Handle specific API errors
        if (error.status === 401 || error.status === 403) {
            return "I'm currently unable to access my brain (invalid API key or permissions). Please ask the administrator to check the system configuration.";
        }

        if (error.status === 429) {
            return "I'm thinking too hard! (Rate limit exceeded). Please try again in a moment.";
        }

        if (error.message?.includes('API key')) {
            return 'Error: Groq API key is not configured. Please contact the administrator.';
        }

        // Return a generic fallback instead of crashing
        return "I'm having trouble connecting to my AI service right now. Please check back later or contact support if this persists.";
    }
}

/**
 * Health check for RAG system
 */
export function getRAGStatus() {
    const documents = {};

    // Group chunks by source document
    documentChunks.forEach(chunk => {
        const source = chunk.metadata.source;
        if (!documents[source]) {
            documents[source] = 0;
        }
        documents[source]++;
    });

    return {
        initialized: documentChunks.length > 0,
        totalChunks: documentChunks.length,
        totalDocuments: Object.keys(documents).length,
        documents: documents, // Show which documents are loaded and their chunk counts
        model: MODEL,
        hasAPIKey: !!process.env.GROQ_API_KEY,
        config: {
            chunkSize: 1000,
            overlap: 200,
            topK: 5,
            minWordLength: 3
        }
    };
}

// Initialize RAG on module load
initializeRAG().catch(err => {
    console.error('[RAG] Failed to initialize:', err);
});

// Re-initialize every hour to pick up new documents
setInterval(() => {
    console.log('[RAG] Re-initializing to pick up new documents...');
    initializeRAG().catch(err => {
        console.error('[RAG] Failed to re-initialize:', err);
    });
}, 60 * 60 * 1000); // 1 hour
