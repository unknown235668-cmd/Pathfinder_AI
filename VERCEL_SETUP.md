# Quick Start: Vercel Preview Deployment Setup

This is a quick reference guide to get your Pathfinder AI preview deployment link up and running on Vercel. For comprehensive details, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Step-by-Step Setup (5 minutes)

### 1. Connect Repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Sign in with your GitHub account
3. Import this repository
4. Click "Continue" - Vercel will auto-detect Next.js

### 2. Configure Environment Variables

Click on "Environment Variables" and add these **5 required variables**:

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyBgLJMNCiBBtCaHZcvJvAJSz81G7R9vDxs` | Firebase Console → Project Settings → Web App |
| `FIREBASE_PROJECT_ID` | `pathfinder-ai-xsk6g` | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@pathfinder-ai-xsk6g.iam.gserviceaccount.com` | Firebase Console → Project Settings → Service Accounts |
| `FIREBASE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` | Firebase Console → Project Settings → Service Accounts → Generate New Private Key |
| `GEMINI_API_KEY` | `AIza...` | [Google AI Studio](https://makersuite.google.com/app/apikey) (Optional - has fallbacks) |

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`: Copy the entire key including `-----BEGIN` and `-----END` markers, with `\n` as literal text (not actual newlines)
- Select **all three environments** (Production, Preview, Development) for each variable
- `GEMINI_API_KEY` is optional as the app has fallback keys

### 3. Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for the build to complete
3. You'll get a production URL like: `https://pathfinder-ai.vercel.app`

### 4. Enable Preview Deployments

Preview deployments are **automatically enabled**! Every time you:
- Create a pull request → New preview URL
- Push to a branch → Updated preview URL

Preview URLs look like: `https://pathfinder-ai-git-your-branch.vercel.app`

### 5. Configure Firebase for Vercel Domains

**Add Authorized Domains:**
1. Go to [Firebase Console](https://console.firebase.google.com/) → Authentication → Settings
2. Under "Authorized domains", click "Add domain"
3. Add: `*.vercel.app` (wildcard for all preview deployments)

**Update Firestore Rules** (if needed):
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

## Getting Your Preview Link

### For Pull Requests:
- Create a PR on GitHub
- Vercel bot will comment with the preview URL
- URL updates automatically when you push new commits

### For Branches:
- Push any branch to GitHub
- Go to Vercel Dashboard → Deployments
- Find your branch deployment and copy the URL

### Via Vercel CLI:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# You'll get a preview URL immediately
```

## Sharing Your Preview Link

Your preview link is **public and shareable**. Anyone with the link can:
- ✅ View the application
- ✅ Create an account (their own)
- ✅ Use all features
- ❌ Access other users' data (secured by Firebase rules)

Example preview URLs:
- Production: `https://pathfinder-ai.vercel.app`
- Feature branch: `https://pathfinder-ai-git-feat-new-feature.vercel.app`
- Pull Request: `https://pathfinder-ai-pr-123.vercel.app`

## Troubleshooting

### "Module not found: @/../pathfinder-ai-xsk6g-firebase-adminsdk..."
✅ **Expected** - This is normal. The service account file is intentionally excluded. Environment variables are used instead.

### "auth/unauthorized-domain"
❌ Add your Vercel domain to Firebase authorized domains (see step 5 above)

### Environment variables not working
❌ Redeploy without cache:
1. Vercel Dashboard → Deployments
2. Click "⋯" → Redeploy
3. Uncheck "Use existing Build Cache"

### Build fails with TypeScript errors
✅ **Should pass** - Build config ignores TS/ESLint errors (`ignoreBuildErrors: true` in `next.config.ts`)

## Next Steps

- ✅ Share your preview link with stakeholders
- ✅ Set up automatic deployments for your workflow
- ✅ Add custom domain (optional, in Vercel settings)
- ✅ Monitor usage and performance in Vercel Analytics

For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md)
