
# 📄 Project Index

This document provides a high-level index of the most important files and directories in the Pathfinder AI project, explaining their purpose.

### Core Application Logic

- **`src/app/page.tsx`**: The main entry point for the user interface. It renders the primary view, including the main tab container for all AI tools.
- **`src/app/layout.tsx`**: The root layout of the application. It defines the main HTML structure, includes global styles, and sets up the page font and metadata.
- **`src/app/globals.css`**: Contains all global CSS styles, Tailwind CSS base layers, and the definitions for the ShadCN/UI theme (CSS variables for colors, etc.).

### Artificial Intelligence (Genkit)

- **`src/ai/genkit.ts`**: The central configuration file for the Genkit AI plugin. It initializes the AI models (like Google's Gemini) and contains the crucial `definePromptWithFallback` function, which provides resilience by cycling through API keys and models on failure.
- **`src/ai/flows/`**: This directory contains the "brain" for each AI feature.
  - **`chatbot.ts`**: Defines the prompt and logic for the main conversational AI advisor.
  - **`career-plan-generator.ts`**: Contains the highly detailed prompt for generating a user's career roadmap.
  - **`types.ts`**: A critical file that defines the structured input and output schemas (using Zod) for every AI flow, ensuring type safety and predictable AI responses.

### Components

- **`src/components/pathfinder/`**: This directory holds all the application-specific React components that create the user experience.
  - **`Dashboard.tsx`**: Renders the main dashboard, fetches and displays user history.
  - **`Chatbot.tsx`**: The UI for the conversational AI, handling message display, user input, and communication with the AI backend.
  - **`CollegeLocator.tsx`**: The frontend for the institution search feature, including filters and results display.
- **`src/components/ui/`**: Contains the reusable, low-level UI components from the ShadCN/UI library (e.g., `Button.tsx`, `Card.tsx`, `Dialog.tsx`).

### Backend and Data

- **`src/app/api/colleges/search/route.ts`**: The serverless API endpoint that powers the College Locator. It reads from `institutions.json` and returns filtered, paginated results.
- **`src/lib/firebase.ts`**: Initializes the **client-side** Firebase SDK. This is used by frontend components to interact with Firestore and Authentication.
- **`src/lib/firebase-admin.ts`**: Initializes the **server-side** Firebase Admin SDK. This is used by server-side scripts (like database seeders) for privileged access.
- **`src/lib/institutions.json`**: A static JSON file that acts as the primary database for the Institution Locator feature.

### Configuration

- **`next.config.ts`**: The main configuration file for the Next.js framework. It includes settings for image optimization, environment variables, and build process adjustments.
- **`tailwind.config.ts`**: Defines and configures the Tailwind CSS utility classes, including custom fonts and colors.
- **`package.json`**: Lists all project dependencies and defines the `npm` scripts used for running, building, and developing the application (e.g., `npm run dev`).
