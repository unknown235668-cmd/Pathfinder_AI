import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyBgLJMNCiBBtCaHZcvJvAJSz81G7R9vDxs",
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_PRIVATE_KEY
      ? JSON.stringify({
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: 'cc792f8f5f6b13033a186e01b040c1875bae86c5',
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: '102257025002236664568',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40${process.env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`,
          universe_domain: 'googleapis.com',
        })
      : '',
  }
};

export default nextConfig;
