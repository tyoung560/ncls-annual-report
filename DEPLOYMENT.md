# Deployment Guide for NCLS Annual Report

This guide will walk you through deploying the NCLS Annual Report application to Vercel.

## Prerequisites

- A GitHub account
- A Vercel account (you can sign up at [vercel.com](https://vercel.com) using your GitHub account)

## Step 1: Push to GitHub

1. Create a new repository on GitHub:
   - Go to [github.com/new](https://github.com/new)
   - Name your repository (e.g., "ncls-annual-report")
   - Keep it public or make it private based on your preference
   - Don't initialize with README, .gitignore, or license (since you're pushing an existing repo)
   - Click "Create repository"

2. Connect your local repository to GitHub:
   ```bash
   git remote add origin https://github.com/yourusername/ncls-annual-report.git
   git branch -M main
   git push -u origin main
   ```
   
   Replace `yourusername` with your actual GitHub username and `ncls-annual-report` with your repository name if different.

## Step 2: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository:
   - Select your GitHub account
   - Find and select your repository
   - Vercel will automatically detect that it's a Next.js project

3. Configure project settings:
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
   - **Development Command**: `npm run dev` (default)

4. Environment Variables:
   - Add all the environment variables from your `.env.local` file:
     - NEXT_PUBLIC_FIREBASE_API_KEY
     - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
     - NEXT_PUBLIC_FIREBASE_PROJECT_ID
     - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
     - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
     - NEXT_PUBLIC_FIREBASE_APP_ID
     - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
     - CLAUDE_API_KEY

5. Click "Deploy"

## Step 3: Verify Deployment

1. Once the deployment is complete, Vercel will provide you with a URL to access your application.
2. Visit the URL to verify that your application is working correctly.
3. Test the PDF upload and processing functionality to ensure it works in the production environment.

## Troubleshooting

If you encounter issues:

1. **Check build logs** in the Vercel dashboard
2. **Verify environment variables** are correctly set
3. **Check function execution logs** for serverless function errors
4. **Ensure PDF files aren't too large** for serverless function limits (50MB limit for the entire function bundle and a 4.5MB limit for response size)

## Additional Configuration

The `vercel.json` file in your repository provides additional configuration for your Vercel deployment, including:

- Build and development commands
- Security headers
- Framework specification

You can modify this file to customize your deployment further if needed.
