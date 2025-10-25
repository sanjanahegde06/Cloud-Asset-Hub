# Cloud Asset Hub

Cloud Asset Hub (previously "Cloud Resource Manager") — a Next.js app using Supabase Auth and Storage to upload, preview, download and manage user files.

## Overview
Cloud Asset Hub is a Next.js application that allows users to manage their files in the cloud using Supabase for authentication and storage. Users can sign up, log in, upload files, and view or delete their uploaded files from a user-friendly dashboard.

## Features
- **User Authentication**: Users can sign up and log in using their email and password through Supabase Auth.
- **File Upload**: Users can upload files to Supabase Storage.
- **File Management**: Users can view a list of their uploaded files, download them, and delete them as needed.
- **Protected Routes**: Certain pages are protected and can only be accessed by authenticated users.

## Project Structure
```
cloud-asset-hub
├── components
│   ├── FileList.js
│   ├── Layout.js
│   ├── ProtectedRoute.js
│   └── UploadForm.js
├── lib
│   └── supabase.js
├── pages
│   ├── _app.js
│   ├── api
│   │   ├── auth.js
│   │   ├── delete.js
│   │   ├── files.js
│   │   └── upload.js
│   ├── dashboard.js
│   ├── index.js
│   └── signup.js
├── public
├── styles
│   └── globals.css
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
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
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```
5. Run the development server:
   ```
   npm run dev
   ```

## Usage
- Visit `http://localhost:3000` to access the application.
- Use the signup page to create a new account or log in with an existing account.
- Once logged in, you can upload files, view your uploaded files, and delete them as needed.

## License
This project is licensed under the MIT License.