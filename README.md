# NCLS Annual Report Dashboard System

A web application for the North Country Library System (NCLS) that allows library directors to upload annual report PDFs, automatically generate visual dashboards, and maintain a historical record of their reports.

## Features

- **User Authentication**: Secure login and registration with role-based access control
- **PDF Upload**: Upload annual report PDFs for processing
- **Dashboard Generation**: Automatically generate visual dashboards from report data
- **Report Management**: View, share, and manage library reports
- **Historical Data**: Maintain a historical record of all reports

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API routes, Firebase Functions
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Authentication
- **PDF Processing**: Claude API

## Prerequisites

- Node.js 16+ and npm
- Firebase account
- Claude API key

## Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd ncls-annual-report
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure Firebase**

Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/) and enable:
- Authentication (Email/Password)
- Firestore Database
- Storage

4. **Set up environment variables**

Create a `.env.local` file in the root directory with your Firebase and Claude API credentials:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Claude API Configuration
CLAUDE_API_KEY=your-claude-api-key
```

5. **Import NCLS libraries data**

Install the required packages for the import script:

```bash
npm install csv-parse dotenv --save
```

Run the import script:

```bash
node scripts/import-libraries.js
```

6. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

The application can be deployed to Vercel:

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Configure the environment variables in the Vercel dashboard
4. Deploy

## Project Structure

```
ncls-annual-report/
├── components/        # React components
│   ├── auth/          # Authentication components
│   └── layout/        # Layout components
├── lib/               # Utility functions and Firebase setup
├── pages/             # Next.js pages
│   ├── _app.tsx       # App component
│   ├── index.tsx      # Home page
│   ├── login.tsx      # Login page
│   ├── register.tsx   # Registration page
│   ├── upload.tsx     # Upload page
│   └── reports/       # Report pages
├── public/            # Static assets
├── scripts/           # Utility scripts
├── styles/            # Global styles
└── .env.local         # Environment variables
```

## License

[MIT](LICENSE)
