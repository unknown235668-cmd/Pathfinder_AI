# Deployment Guide

This guide explains how to deploy Pathfinder AI to Vercel with preview deployments enabled.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works)
- A [Firebase project](https://console.firebase.google.com/) set up
- Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Deployment Steps

### 1. Fork or Clone the Repository

If you haven't already, fork this repository to your GitHub account or push it to your own repository.

### 2. Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

### 3. Configure Environment Variables

Before deploying, you need to add the following environment variables in Vercel:

#### Firebase Configuration

Get these from your Firebase Console → Project Settings:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBgLJMNCiBBtCaHZcvJvAJSz81G7R9vDxs
FIREBASE_PROJECT_ID=pathfinder-ai-xsk6g
```

#### Firebase Admin SDK

Get these from Firebase Console → Project Settings → Service Accounts → Generate New Private Key:

```
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@pathfinder-ai-xsk6g.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Important:** When adding `FIREBASE_PRIVATE_KEY` to Vercel:
- Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters as literal `\n` (not actual newlines)
- Wrap the entire value in quotes

#### Google Gemini API Key

Get this from [Google AI Studio](https://makersuite.google.com/app/apikey):

```
GEMINI_API_KEY=AIza...
```

**Note:** The app has fallback API keys built-in, so this is optional but recommended for production use.

### 4. Add Environment Variables in Vercel

There are two ways to add environment variables:

#### Option A: Using Vercel Dashboard (Recommended)

1. In your Vercel project, go to "Settings" → "Environment Variables"
2. Add each variable:
   - Variable Name: (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - Value: (paste the value)
   - Environment: Select "Production", "Preview", and "Development"
3. Click "Save"

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_PRIVATE_KEY
vercel env add GEMINI_API_KEY
```

### 5. Deploy

Once environment variables are configured, deploy the project:

#### Using Vercel Dashboard

- Click "Deploy" in your Vercel project
- Vercel will build and deploy your project
- You'll get a production URL like: `https://pathfinder-ai.vercel.app`

#### Using Vercel CLI

```bash
# Deploy to production
vercel --prod

# Deploy preview (for testing)
vercel
```

## Preview Deployments

Preview deployments are automatically created for every pull request and branch push. Each preview deployment:

- Gets a unique URL (e.g., `https://pathfinder-ai-git-feature-branch.vercel.app`)
- Uses the same environment variables as production
- Is isolated from production data
- Automatically updates when you push new commits

### Accessing Preview URLs

1. When you create a pull request on GitHub, Vercel bot will comment with the preview URL
2. In Vercel Dashboard → Project → Deployments, you can see all preview deployments
3. Each branch gets its own preview URL

## Firebase Configuration

### Firestore Rules

Make sure your Firestore security rules allow access from your Vercel domains:

1. Go to Firebase Console → Firestore Database → Rules
2. Update rules to allow authenticated users to read/write their data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase Authentication

Add your Vercel domain to authorized domains:

1. Go to Firebase Console → Authentication → Settings → Authorized Domains
2. Add your Vercel domains:
   - Production: `pathfinder-ai.vercel.app`
   - Preview: `*.vercel.app` (wildcard for all preview deployments)

## Troubleshooting

### Build Fails

**Error:** "Cannot find module '@/../pathfinder-ai-xsk6g-firebase-adminsdk-fbsvc-cc792f8f5f.json'"

**Solution:** This is expected. The service account JSON file is not included in the repo for security. Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable is properly set (it's automatically constructed from other Firebase env vars in `next.config.ts`).

### Firebase Auth Not Working

**Error:** "auth/unauthorized-domain"

**Solution:** Add your Vercel preview domain to Firebase authorized domains (see above).

### API Rate Limits

The app has built-in fallback API keys for Gemini, but for production use, it's recommended to:
1. Get your own Gemini API key
2. Add it to Vercel environment variables
3. Monitor usage in Google AI Studio

### Environment Variables Not Updating

After adding or updating environment variables:
1. Go to Vercel Dashboard → Deployments
2. Click "⋯" on the latest deployment → "Redeploy"
3. Check "Use existing Build Cache" is **unchecked**
4. Click "Redeploy"

## Local Development

To run locally with the same configuration:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual values in `.env.local`

3. Run the development server:
   ```bash
   npm run dev
   ```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Firebase Console](https://console.firebase.google.com/)
- [Google AI Studio](https://makersuite.google.com/)

## Support

For issues with deployment, please check:
- [Vercel Deployment Logs](https://vercel.com/docs/deployments/troubleshoot-a-build)
- [Firebase Documentation](https://firebase.google.com/docs)
- Open an issue in this repository
