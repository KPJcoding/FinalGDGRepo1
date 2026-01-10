import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[Content Extractor] Starting website content extraction...');

// Paths
const srcDir = path.join(__dirname, '..', 'src', 'pages');
const knowledgeDir = path.join(__dirname, 'knowledge');

// Ensure knowledge directory exists
if (!fs.existsSync(knowledgeDir)) {
    fs.mkdirSync(knowledgeDir, { recursive: true });
}

// Extract clubs data from Clubs.tsx
function extractClubsData() {
    try {
        const clubsFile = path.join(srcDir, 'Clubs.tsx');
        const content = fs.readFileSync(clubsFile, 'utf8');

        // Extract the clubs array using regex
        const clubsMatch = content.match(/const clubs: Club\[\] = \[([\s\S]*?)\];/);
        if (!clubsMatch) {
            console.log('[Content Extractor] Could not find clubs array');
            return;
        }

        // Parse club objects - simple regex approach
        const clubsArrayContent = clubsMatch[1];
        const clubObjects = clubsArrayContent.split(/\},\s*\{/).map((obj, index, arr) => {
            if (index === 0) return obj + '}';
            if (index === arr.length - 1) return '{' + obj;
            return '{' + obj + '}';
        });

        let markdown = '# IIIT Nagpur Clubs Directory\n\n';
        markdown += 'This document contains comprehensive information about all the official clubs at IIIT Nagpur.\n\n';

        // Parse each club object
        clubObjects.forEach((clubObj) => {
            const getName = (field) => {
                const match = clubObj.match(new RegExp(`${field}:\\s*"([^"]*)"`, 'i'));
                return match ? match[1] : '';
            };

            const getNumber = (field) => {
                const match = clubObj.match(new RegExp(`${field}:\\s*(\\d+)`, 'i'));
                return match ? match[1] : '0';
            };

            const getLeadInfo = (leadType) => {
                const leadMatch = clubObj.match(new RegExp(`${leadType}:\\s*\\{\\s*name:\\s*"([^"]*)"\\s*,\\s*phone:\\s*"([^"]*)"`, 'i'));
                return leadMatch ? { name: leadMatch[1], phone: leadMatch[2] } : null;
            };

            const name = getName('name');
            if (!name) return;

            const fullName = getName('fullName');
            const description = getName('description');
            const category = getName('category');
            const memberCount = getNumber('memberCount');
            const whatsappLink = getName('whatsappLink');
            const instagramLink = getName('instagramLink');
            const lead = getLeadInfo('lead');
            const coLead = getLeadInfo('coLead');

            markdown += `## ${name} - ${fullName}\n\n`;
            markdown += `**Category:** ${category}  \n`;
            markdown += `**Full Name:** ${fullName}  \n`;
            markdown += `**Members:** ${memberCount} students  \n`;
            markdown += `**Verified:** ✅ Institute Verified\n\n`;
            markdown += `**Description:**\n${description}\n\n`;

            if (lead || coLead) {
                markdown += `**Leadership:**\n`;
                if (lead) markdown += `- **Club Lead:** ${lead.name} - ${lead.phone}\n`;
                if (coLead) markdown += `- **Co-Lead:** ${coLead.name} - ${coLead.phone}\n`;
                markdown += '\n';
            }

            markdown += `**Connect:**\n`;
            if (whatsappLink) markdown += `- WhatsApp: ${whatsappLink}\n`;
            if (instagramLink) markdown += `- Instagram: ${instagramLink}\n`;
            markdown += '\n---\n\n';
        });

        markdown += '## Club Categories\n\n';
        markdown += 'The clubs at IIIT Nagpur are organized into categories including Technical, Creative, Cultural, and Recreation.\n\n';
        markdown += 'All clubs are verified by the institute and welcome IIIT Nagpur students with valid @iiitn.ac.in email addresses.\n';

        fs.writeFileSync(path.join(knowledgeDir, 'clubs-directory.md'), markdown);
        console.log('[Content Extractor] ✓ Extracted clubs data');
    } catch (error) {
        console.error('[Content Extractor] Error extracting clubs:', error.message);
    }
}

// Extract guidelines from Guidelines.tsx
function extractGuidelines() {
    try {
        const guidelinesFile = path.join(srcDir, 'Guidelines.tsx');
        const content = fs.readFileSync(guidelinesFile, 'utf8');

        // Extract guidelines array
        const guidelinesMatch = content.match(/const guidelines = \[([\s\S]*?)\];/);
        if (!guidelinesMatch) {
            console.log('[Content Extractor] Could not find guidelines array');
            return;
        }

        let markdown = '# Sol-1 Platform Guidelines\n\n';
        markdown += 'This document contains the official guidelines for using the Sol-1 knowledge platform at IIIT Nagpur.\n\n';

        // Extract each guideline section
        const sections = guidelinesMatch[1].split(/\},\s*\{/).map((obj, index, arr) => {
            if (index === 0) return obj + '}';
            if (index === arr.length - 1) return '{' + obj;
            return '{' + obj + '}';
        });

        sections.forEach((section) => {
            const titleMatch = section.match(/title:\s*"([^"]*)"/);
            const itemsMatch = section.match(/items:\s*\[([\s\S]*?)\]/);

            if (titleMatch && itemsMatch) {
                const title = titleMatch[1];
                const itemsStr = itemsMatch[1];
                const items = itemsStr.match(/"([^"]+)"/g)?.map(item => item.replace(/"/g, '')) || [];

                markdown += `## ${title}\n\n`;
                items.forEach(item => {
                    markdown += `- ${item}\n`;
                });
                markdown += '\n';
            }
        });

        markdown += '## Getting Help\n\n';
        markdown += 'If you have any questions about these guidelines or need help, reach out to the community through the platform or join the relevant WhatsApp groups.\n';

        fs.writeFileSync(path.join(knowledgeDir, 'platform-guidelines.md'), markdown);
        console.log('[Content Extractor] ✓ Extracted platform guidelines');
    } catch (error) {
        console.error('[Content Extractor] Error extracting guidelines:', error.message);
    }
}

// Extract platform info from Index.tsx
function extractPlatformInfo() {
    try {
        const indexFile = path.join(srcDir, 'Index.tsx');
        const content = fs.readFileSync(indexFile, 'utf8');

        let markdown = '# Sol-1 Platform Information\n\n';
        markdown += '## About Sol-1\n\n';
        markdown += 'Sol-1 is the official knowledge-sharing platform for IIIT Nagpur students. ';
        markdown += 'It serves as a comprehensive hub for academic questions, verified solutions, and community interaction.\n\n';

        // Extract stats array
        const statsMatch = content.match(/const stats = \[([\s\S]*?)\];/);
        if (statsMatch) {
            markdown += '## Platform Statistics\n\n';
            const statsStr = statsMatch[1];
            const statEntries = statsStr.match(/\{\s*value:\s*"([^"]+)"\s*,\s*label:\s*"([^"]+)"\s*\}/g);

            if (statEntries) {
                statEntries.forEach(entry => {
                    const valueMatch = entry.match(/value:\s*"([^"]+)"/);
                    const labelMatch = entry.match(/label:\s*"([^"]+)"/);
                    if (valueMatch && labelMatch) {
                        markdown += `- **${valueMatch[1]}** ${labelMatch[1]}\n`;
                    }
                });
                markdown += '\nThese statistics represent the collective knowledge and contributions of the IIIT Nagpur student community.\n\n';
            }
        }

        // Extract platform links/features
        const linksMatch = content.match(/const platformLinks = \[([\s\S]*?)\];/);
        if (linksMatch) {
            markdown += '## Main Features\n\n';
            const linksStr = linksMatch[1];
            const linkEntries = linksStr.match(/\{\s*icon:\s*\w+\s*,\s*title:\s*"([^"]+)"\s*,\s*desc:\s*"([^"]+)"/g);

            if (linkEntries) {
                linkEntries.forEach(entry => {
                    const titleMatch = entry.match(/title:\s*"([^"]+)"/);
                    const descMatch = entry.match(/desc:\s*"([^"]+)"/);
                    if (titleMatch && descMatch) {
                        markdown += `### ${titleMatch[1]}\n${descMatch[1]}\n\n`;
                    }
                });
            }
        }

        markdown += '## Platform Goals\n\n';
        markdown += '- Build a permanent knowledge repository for IIIT Nagpur\n';
        markdown += '- Help students find verified solutions to academic questions\n';
        markdown += '- Foster a collaborative learning community\n';
        markdown += '- Recognize and reward active contributors\n';
        markdown += '- Connect students through clubs and activities\n';
        markdown += '- Maintain high-quality, verified content\n\n';

        markdown += '## Access\n\n';
        markdown += 'Sol-1 is exclusively for IIIT Nagpur students. Access requires a valid @iiitn.ac.in email address.\n\n';

        markdown += '## Technology\n\n';
        markdown += 'The platform uses advanced AI technology to:\n';
        markdown += '- Match questions with relevant existing solutions\n';
        markdown += '- Provide intelligent search capabilities\n';
        markdown += '- Offer an interactive chatbot for quick answers\n';
        markdown += '- Organize and categorize content effectively\n';

        fs.writeFileSync(path.join(knowledgeDir, 'platform-info.md'), markdown);
        console.log('[Content Extractor] ✓ Extracted platform information');
    } catch (error) {
        console.error('[Content Extractor] Error extracting platform info:', error.message);
    }
}

// Run all extractions
export function extractAll() {
    console.log('[Content Extractor] Extracting from:', srcDir);
    extractClubsData();
    extractGuidelines();
    extractPlatformInfo();
    console.log('[Content Extractor] ✓ Content extraction complete');
}
