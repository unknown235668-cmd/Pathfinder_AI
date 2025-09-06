# Pathfinder AI 🚀

Pathfinder AI is a comprehensive, AI-powered web application designed to serve as a personal educational and career advisor for students. Its primary goal is to provide data-driven, personalized, and actionable guidance to help students navigate the complex decisions from high school to their professional careers.

![Pathfinder AI Screenshot](https://i.imgur.com/your-screenshot.png) 
*Note: Add a screenshot of your application here.*

## ✨ Features

- **Unified Dashboard**: A central hub for logged-in users to view their interaction history and access the AI Advisor.
- **Interest Profiler**: A deep-dive tool for self-assessment and initial guidance based on interests, academics, and goals.
- **Stream Suggestion**: Provides tailored suggestions for academic streams (Science, Commerce, Arts) after 10th grade.
- **Degree & Career Exploration**: Recommends degree courses and explores related career paths, skills, and job market trends.
- **AI Career Plan Generator**: Creates a detailed, step-by-step career roadmap with weekly tasks, project ideas, and resources.
- **Institution Database Locator**: A powerful, filterable search engine for Indian colleges and universities with PDF export.
- **Conversational AI Advisor**: An interactive chatbot that provides structured, on-demand guidance with clickable resources.
- **Secure User Authentication**: Personalized and persistent user experience with Firebase Authentication and Firestore data storage.

For a full list of features, see [FEATURES.md](./FEATURES.md).

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **AI**: [Google's Gemini via Genkit](https://firebase.google.com/docs/genkit)
- **Database & Auth**: [Firebase (Firestore & Authentication)](https://firebase.google.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN/UI](https://ui.shadcn.com/)
- **Deployment**: Next.js applications can be deployed on platforms like [Vercel](https://vercel.com/) or [Firebase App Hosting](https://firebase.google.com/docs/app-hosting).

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/your-username/pathfinder-ai.git
    cd pathfinder-ai
    ```
2.  **Install NPM packages**
    ```sh
    npm install
    ```
3.  **Set up environment variables**
    - Create a `.env` file in the root of your project.
    - Add your Firebase and Gemini API keys. You can get these from the Firebase Console and Google AI Studio respectively.
    ```env
    # Firebase Public Config (client-side)
    NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
    # You can get the full client-side config from your Firebase project settings
    
    # Gemini API Key (server-side for Genkit)
    GEMINI_API_KEY="AIza..." 
    
    # Firebase Admin SDK (server-side)
    # You can get this from your Firebase project settings -> Service accounts
    FIREBASE_PROJECT_ID="..."
    FIREBASE_PRIVATE_KEY="..."
    FIREBASE_CLIENT_EMAIL="..."
    ```
    
4.  **Run the development server**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗺️ Roadmap

See the [open issues](https://github.com/your-username/pathfinder-ai/issues) for a list of proposed features (and known issues). Check out our [ROADMAP.md](./ROADMAP.md) for the long-term vision.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests to us.

## 📜 License

This project is dual-licensed under the **MIT License** and the **Apache 2.0 License**. You may choose which license to use the software under.

See [LICENSE-MIT](./LICENSE-MIT) or [LICENSE-APACHE](./LICENSE-APACHE) for more information.

## 🙏 Acknowledgements

- [ShadCN/UI](https://ui.shadcn.com/) for the fantastic component library.
- [Genkit](https://firebase.google.com/docs/genkit) for making AI integration seamless.
- [Vercel](https://vercel.com/) for pioneering the future of web development.
