# 🏫 Sol-1 — IIITN Student Knowledge & Q&A Platform

Sol-1 is a full-stack web application designed **exclusively for IIIT Nagpur students**, focused on structured knowledge sharing, peer-to-peer learning, and moderated academic discussion.

The platform includes:
- A Q&A system with difficulty tiers and credits
- Admin-moderated verification
- A role-based access system
- A chatbot **trained specifically on IIITN-related information**

This README explains **exactly how judges can run Sol-1 locally on their device** and evaluate all features.

---

## 🔐 Access Restriction (Important)

⚠️ **Only `@iiitn.ac.in` email IDs are allowed to perform any operations on the platform**, including:
- Asking questions
- Answering questions
- Voting
- Admin or maintainer actions

This restriction is enforced at the backend level.

---

## 🧩 Tech Stack (Brief Overview)

- **Frontend:** React + Vite  
- **Backend:** Node.js + Express  
- **Database:** SQLite  
- **Authentication:** JWT + OTP-based verification  
- **Roles:** Normal Users & Admin/Maintainer  
- **Chatbot:** RAG-based chatbot trained on IIITN-specific data

---

## 🚀 How to Run Sol-1 on Your Device

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Monarchy712/Sol-1
cd Sol-1
npm install
```

Open a new terminal (or an integrated terminal) and run:
```bash
cd server
npm install
```
### 2️⃣ Install Frontend Dependencies (Root Directory)

From the root directory of the project, run:

```bash  
npm install
```
### 3️⃣ Install Backend Dependencies

Open a new integrated terminal and navigate to the `server` folder:

```bash
cd server
npm install
```

### 4️⃣ Start the Frontend

Go back to the root directory terminal and run:

```bash
npm run dev
```

### 5️⃣ Start the Backend

In the `server` folder terminal, run:

```bash
node index.js
```
This starts the backend services required for authentication, admin operations, and real-time data flow.

### 6️⃣ Access the Website

Open the localhost URL shown after running `npm run dev` in your browser.

# 🔓 Authentication and Access Control

### Important for Judges

- Only IIIT Nagpur email IDs ending with `@iiitn.ac.in` are allowed to perform operations on the platform.
- This restriction simulates a real institutional production environment.

---

## Demo Login Credentials (For Evaluation)

### Normal User Account

Email: `bt25csh048@iiitn.ac.in`  
Password: `12345678`

### Admin Account

Email: `bt25csh068@iiitn.ac.in`  
Password: `hackathon`
