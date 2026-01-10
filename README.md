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

# 🔑 Environment Variables & API Keys (Mandatory Setup)

## ⚠️ Sol-1 will NOT function correctly unless the backend environment variables are configured.
Judges must create their own API keys and set up a .env file before starting the server.

## 📁 Step 1: Create .env File
Navigate to the backend folder:
```bash
cd server
```
Copy the example environment file:
```bash
cp .env.example .env
```
Open .env and fill in the required values as explained below.

## Step 2: Groq API Key (Required for AI Chatbot)
### Sol-1 uses a RAG-based chatbot powered by Groq LLMs.

How to generate:
1. Go to: https://console.groq.com/keys
2. Create a free Groq account (Google/GitHub login supported)
3. Generate a new API key
4. Copy the key and paste it into .env
```bash
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```
## 📧 Step 3: Google Email (SMTP) Configuration (Required for OTP & Auth)
Sol-1 uses Gmail SMTP to send OTPs and verification emails.
How to generate Gmail App Password:
1. Visit: https://myaccount.google.com/apppasswords
2. Enable 2-Step Verification on your Google account
3. Generate an App Password
4. Copy the generated password (not your Gmail password)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_google_app_password
EMAIL_FROM="Sol-1 Platform <your_email@gmail.com>"
```
⚠️ Do NOT use your normal Gmail password. App Password is mandatory.

## 🔐 Step 4: JWT & Server Configuration
```bash
PORT=3000
JWT_SECRET=your_secure_random_string
```
JWT_SECRET can be any long random string
This is used for authentication tokens

## 📄 Final .env Template (Example)
```bash
# Server Configuration
PORT=3000
JWT_SECRET=replace_with_random_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_google_app_password
EMAIL_FROM="Sol-1 Platform <your_email@gmail.com>"

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```


## How to Run the application

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

or if you have your own iiitn.ac.in account, you can sign up with that.

### Admin Account

Email: `bt25csh068@iiitn.ac.in`  
Password: `hackathon`
