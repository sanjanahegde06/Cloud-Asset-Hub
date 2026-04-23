# Cloud Asset Hub

Cloud Asset Hub is a full-stack Next.js application that allows users to securely manage files in the cloud using Supabase for authentication and storage, with an AI-powered feature to chat with uploaded files.

---

## 🚀 Features

###  Authentication
- Signup and login using Supabase Auth
- Secure session handling
- Protected routes

###  File Management
- Upload files to Supabase Storage
- View uploaded files
- Download files
- Delete files
- Preview files (PDF, images, text)

###  AI Chat with Files
- Chat with uploaded files (PDF, TXT, MD)
- Ask questions about file content
- Context-aware responses using vector search
- Dedicated chat page (`/chat/[fileName]`)


---

## 📂 Project Structure
```
cloud-asset-hub
├── components
│   ├── FileChat.js
│   ├── FileList.js
│   ├── Layout.js
│   ├── ProtectedRoute.js
│   ├── UploadForm.js
│   └── PreviewModal.js
│
├── context
│   └── AuthContext.js
│
├── lib
│   ├── supabaseClient.js
│   ├── chunkingUtils.js
│   ├── vectorStore.js
│   └── llmFallback.js
│
├── pages
│   ├── _app.js
│   ├── index.js
│   ├── dashboard.js
│   ├── profile.js
│   ├── signup.js
│   ├── reset-password.js
│   │
│   ├── chat
│   │   └── [fileName].js
│   │
│   └── api
│       ├── auth.js
│       ├── delete.js
│       ├── files.js
│       ├── upload.js
│       │
│       └── chat
│           ├── query.js
│           └── processFile.js
│
├── public
├── styles
│   └── globals.css
│
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/sanjanahegde06/Cloud-Asset-Hub
   ```
2. Navigate to the project directory:
   ```
   cd cloud-asset-hub
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# At least one AI provider key is required
OPENAI_API_KEY=your_key
GROQ_API_KEY=your_key
GOOGLE_API_KEY=your_key
OPENROUTER_API_KEY=your_key
   ```
5. Run the development server:
   ```
   npm run dev
   ```

## Usage
- Visit `http://localhost:3000` to access the application.
- Use the signup page to create a new account or log in with an existing account.
- Once logged in, you can upload files, view your uploaded files, and delete them as needed.

