
# 📂 Project Structure

This document provides an overview of the project's directory structure and the purpose of key files and folders.

\`\`\`
pathfinder-ai/
├── .next/                  # Next.js build output
├── node_modules/           # Project dependencies
├── public/                 # Static assets (images, fonts, etc.)
├── scripts/                # Standalone scripts for database seeding, etc.
│   ├── ai-seed.ts
│   ├── build-colleges-json.ts
│   └── seed-colleges.ts
├── src/
│   ├── ai/                 # Genkit AI flows and configuration
│   │   ├── flows/          # Individual AI agent definitions
│   │   │   ├── career-path-exploration.ts
│   │   │   ├── career-plan-generator.ts
│   │   │   ├── chatbot.ts
│   │   │   ├── ... (other flows)
│   │   │   └── types.ts    # Zod schemas and TypeScript types for AI
│   │   ├── dev.ts          # Entry point for Genkit development tooling
│   │   └── genkit.ts       # Genkit AI instance configuration and model fallback logic
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API routes
│   │   │   └── colleges/
│   │   │       └── search/
│   │   │           └── route.ts  # API endpoint for searching colleges
│   │   ├── globals.css     # Global styles and Tailwind CSS theme
│   │   ├── layout.tsx      # Root layout component
│   │   └── page.tsx        # Main page component
│   ├── components/         # Reusable React components
│   │   ├── pathfinder/     # Application-specific components
│   │   │   ├── AuthButton.tsx
│   │   │   ├── Chatbot.tsx
│   │   │   ├── CollegeLocator.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── ... (other components)
│   │   └── ui/             # ShadCN UI components (Button, Card, etc.)
│   ├── hooks/              # Custom React hooks
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   ├── lib/                # Libraries and utility functions
│   │   ├── firebase-admin.ts # Server-side Firebase Admin SDK config
│   │   ├── firebase.ts     # Client-side Firebase config
│   │   ├── institutions.json # Static database of colleges
│   │   └── utils.ts        # General utility functions (e.g., cn for classnames)
│   └── pages/              # Next.js Pages Router (for API routes)
│       └── api/
│           └── scrape-colleges.ts # (Example API route)
├── .env                    # Environment variables (ignored by Git)
├── .gitignore              # Files and folders to be ignored by Git
├── components.json         # ShadCN/UI configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── README.md               # This file
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
\`\`\`
