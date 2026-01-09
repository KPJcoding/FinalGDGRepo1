# Knowledge Base - Training Guide

## 🎯 How the Chatbot "Training" Works

Your chatbot uses **RAG (Retrieval-Augmented Generation)** instead of traditional model training. This means:

- ✅ **No expensive fine-tuning required** - You don't need to retrain the LLaMA model
- ✅ **Instant updates** - New documents are automatically loaded every hour
- ✅ **Easy to manage** - Just add/edit markdown files
- ✅ **Cost-effective** - Only uses Groq API for generation, not training

### How RAG Works (Behind the Scenes)

```
User Question
     ↓
1. Keyword Search → Find relevant chunks from your documents
     ↓
2. Context Building → Combine relevant chunks into context
     ↓
3. LLM Generation → Send context + question to Groq LLaMA
     ↓
AI Response (Based on YOUR data!)
```

---

## 📁 Adding Your Own Training Data

### Step 1: Create a Markdown File

Add a new `.md` file to this `knowledge-base` folder:

**Example: `course-catalog.md`**

```markdown
# Course Catalog

## Computer Science Courses

### CSE201 - Data Structures
- **Credits**: 4
- **Prerequisites**: Programming Fundamentals
- **Description**: Learn about arrays, linked lists, trees, graphs, and algorithms.

### CSE301 - Database Management
- **Credits**: 3
- **Prerequisites**: Data Structures
- **Description**: SQL, NoSQL, database design, and optimization.

## Exam Schedule

- Mid-semester exams: Week 8
- End-semester exams: Week 16
- Practical exams: Week 15
```

### Step 2: Save the File

Simply save it in:
```
server/knowledge-base/your-filename.md
```

### Step 3: Automatic Loading

The system automatically:
- ✅ Scans the `knowledge-base` folder
- ✅ Loads all `.md` files
- ✅ Splits them into 1000-character chunks (with 200-char overlap)
- ✅ Re-initializes every hour

**Manual restart**: If you want immediate loading, restart the server:
```bash
# In the server directory
Ctrl+C  # Stop the server
npm run dev  # Start again
```

---

## 📝 Best Practices for Training Data

### ✅ DO's

1. **Use Clear Headers**
   ```markdown
   # Main Topic
   ## Subtopic
   ### Specific Detail
   ```

2. **Include Keywords**
   - Add terms students might search for
   - Use synonyms and variations
   ```markdown
   # Admissions / Enrollment / Registration Process
   ```

3. **Structured Format**
   - Use bullet points
   - Use tables for structured data
   - Keep paragraphs concise

4. **Comprehensive Coverage**
   ```markdown
   ## Library Timings
   - Monday to Friday: 8:00 AM - 10:00 PM
   - Saturday: 9:00 AM - 6:00 PM
   - Sunday: Closed
   - Contact: library@iiitn.ac.in
   ```

### ❌ DON'Ts

1. **Avoid Very Large Files**
   - Split large topics into multiple files
   - Each file should be < 10KB for best results

2. **Don't Use Complex Formatting**
   - Avoid nested HTML
   - Avoid complex tables
   - Keep it simple

3. **Avoid Duplicate Information**
   - Don't repeat the same content across files
   - Link topics instead

---

## 🗂️ Recommended File Structure

```
knowledge-base/
├── about-iiit.md          # College information
├── faqs.md                # Frequently asked questions
├── hackathon-rules.md     # Event rules
├── platform-guide.md      # Platform usage guide
├── course-catalog.md      # 👈 Add this
├── admissions.md          # 👈 Add this
├── hostel-guide.md        # 👈 Add this
├── placement-info.md      # 👈 Add this
└── exam-schedule.md       # 👈 Add this
```

---

## 🔧 Advanced: Improving Retrieval

### Current System (Keyword Matching)
The system currently uses **keyword matching** with BM25-like scoring. It:
- Splits queries into words
- Counts matches in each chunk
- Returns top 3 chunks with highest matches

### Upgrade Option: Embeddings (Future)

For better semantic search, you can upgrade to vector embeddings:

1. **Install an embedding library**
   ```bash
   npm install @xenova/transformers
   # or
   npm install openai  # Use OpenAI embeddings
   ```

2. **Modify `rag.js`** to:
   - Generate embeddings for each chunk
   - Store embeddings in a vector database (FAISS, Pinecone, etc.)
   - Use cosine similarity instead of keyword matching

**This is optional** - keyword matching works well for most cases!

---

## 📊 Monitoring What the Bot Knows

### Check Server Logs

When the server starts, you'll see:
```
[RAG] Initializing RAG system...
[RAG] Loaded 4 documents from knowledge base
[RAG] Created 18 chunks from 4 documents
```

### Check Individual Queries

When users ask questions, logs show:
```
[RAG] Query: What is IIIT Nagpur?
[RAG] Retrieved 3 relevant chunks
[RAG] Response generated (245 chars)
```

### Test Your Data

After adding a document, test it:
1. Open the chatbot
2. Ask a question about your new content
3. Check if the answer uses your data

**Example:**
- Added: `course-catalog.md` with CSE201 info
- Test: "What is CSE201?"
- Expected: Bot should mention Data Structures

---

## 🎨 Example Training Files

### Example 1: Department Information

**File: `cse-department.md`**

```markdown
# Computer Science and Engineering Department

## Faculty

### Dr. Ram Kumar
- **Position**: Associate Professor
- **Specialization**: Machine Learning, AI
- **Email**: ram.kumar@iiitn.ac.in
- **Office**: Block A, Room 204

### Dr. Priya Sharma
- **Position**: Assistant Professor
- **Specialization**: Cybersecurity, Networks
- **Email**: priya.sharma@iiitn.ac.in

## Labs

- AI Lab - Block B, Room 101
- Networks Lab - Block B, Room 102
- Database Lab - Block B, Room 103

## Research Areas

The CSE department focuses on:
- Artificial Intelligence and Machine Learning
- Cybersecurity and Privacy
- Cloud Computing and Distributed Systems
- Internet of Things (IoT)
```

### Example 2: Event Information

**File: `upcoming-events.md`**

```markdown
# Upcoming Events

## Tech Fest 2025

- **Date**: March 15-17, 2025
- **Theme**: Innovation in AI
- **Events**:
  - Hackathon (48 hours)
  - Tech talks
  - Project exhibition
  - Coding competitions
- **Registration**: https://techfest.iiitn.ac.in
- **Prize Pool**: ₹5 lakhs

## Guest Lecture Series

### February 2025

- **Feb 10**: Dr. Andrew Ng on "Future of AI"
- **Feb 17**: Industry expert on "Cloud Architecture"
- **Feb 24**: Startup founder on "Building Tech Products"

**Venue**: Main Auditorium, 5:00 PM
```

### Example 3: Policies & Rules

**File: `academic-policies.md`**

```markdown
# Academic Policies

## Attendance Policy

- **Minimum Required**: 75% attendance in each course
- **Penalty**: Less than 75% → Not eligible for exams
- **Medical Leave**: Requires medical certificate within 3 days

## Grading System

| Grade | Marks Range | Grade Points |
|-------|-------------|--------------|
| A+    | 90-100      | 10           |
| A     | 80-89       | 9            |
| B+    | 70-79       | 8            |
| B     | 60-69       | 7            |
| C     | 50-59       | 6            |
| F     | Below 50    | 0            |

## Anti-Plagiarism Policy

- **First Offense**: Zero marks in assignment
- **Second Offense**: Fail the course
- **Third Offense**: Disciplinary action

All assignments will be checked using plagiarism detection software.
```

---

## 🚀 Quick Start Checklist

- [ ] Create a new `.md` file in `knowledge-base/`
- [ ] Add your content with clear headers and structure
- [ ] Save the file
- [ ] Restart the server (or wait 1 hour for auto-reload)
- [ ] Test with a question in the chatbot
- [ ] Check server logs to see if chunks were retrieved
- [ ] Refine content based on results

---

## 💡 Tips for Maximum Effectiveness

1. **Think Like Your Users**
   - What questions will they ask?
   - What keywords will they use?
   - Add those exact terms to your documents

2. **Be Specific**
   - Instead of "The exam is in week 8"
   - Write: "Mid-semester exams are held in week 8 of the semester"

3. **Update Regularly**
   - Keep information current
   - Remove outdated content
   - The system auto-reloads every hour

4. **Cross-Reference**
   - Link related topics
   - Mention alternatives
   - Example: "For admissions, see also: Scholarships, Fees"

---

## 🆘 Troubleshooting

### Bot doesn't know about my new file

**Check:**
1. Is the file a `.md` file?
2. Is it in the `knowledge-base` folder?
3. Did you restart the server?
4. Check server logs for loading errors

### Bot gives wrong answers

**Possible causes:**
1. Keywords don't match user query
2. Information is buried in large chunks
3. Conflicting information in multiple files

**Solutions:**
- Add more specific keywords
- Break large sections into smaller ones
- Remove duplicates

### Bot says "No information found"

**This means:**
- No chunks matched the query keywords
- Try adding synonyms and variations to your content

---

## 📧 Need Help?

If you have questions about the RAG system or adding training data, check:
- Server logs for debugging
- Test with simple queries first
- Gradually add complexity

Happy training! 🎓
