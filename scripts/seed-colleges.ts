import { config } from 'dotenv';
config(); // Load environment variables from .env

import { firestore } from '../src/lib/firebase-admin';

const collegesData = [
    {
        "id": 1,
        "name": "Indian Institute of Technology Bombay",
        "type": "institute",
        "ownership": "government",
        "category": "Engineering",
        "state": "Maharashtra",
        "city": "Mumbai",
        "address": "Powai, Mumbai, Maharashtra 400076",
        "website": "http://www.iitb.ac.in",
        "approval_body": "AICTE",
        "aliases": ["IITB"]
    },
    {
        "id": 2,
        "name": "Indian Institute of Technology Delhi",
        "type": "institute",
        "ownership": "government",
        "category": "Engineering",
        "state": "Delhi",
        "city": "New Delhi",
        "address": "Hauz Khas, New Delhi, Delhi 110016",
        "website": "http://www.iitd.ac.in",
        "approval_body": "AICTE",
        "aliases": ["IITD"]
    },
    {
        "id": 3,
        "name": "All India Institute of Medical Sciences, Delhi",
        "type": "institute",
        "ownership": "government",
        "category": "Medical",
        "state": "Delhi",
        "city": "New Delhi",
        "address": "Ansari Nagar, New Delhi, Delhi 110029",
        "website": "https://www.aiims.edu/",
        "approval_body": "MCI",
        "aliases": ["AIIMS Delhi"]
    },
    {
        "id": 4,
        "name": "National Law School of India University",
        "type": "university",
        "ownership": "government",
        "category": "Law",
        "state": "Karnataka",
        "city": "Bengaluru",
        "address": "Gnana Bharathi Main Rd, Gnana Bharathi, Bengaluru, Karnataka 560072",
        "website": "https://www.nls.ac.in/",
        "approval_body": "BCI",
        "aliases": ["NLSIU"]
    },
    {
        "id": 5,
        "name": "Symbiosis Law School",
        "type": "college",
        "ownership": "private",
        "category": "Law",
        "state": "Maharashtra",
        "city": "Pune",
        "address": "Viman Nagar, Pune, Maharashtra 411014",
        "website": "https://www.symlaw.ac.in/",
        "approval_body": "BCI",
        "aliases": ["SLS Pune"]
    },
    {
        "id": 6,
        "name": "National Institute of Fashion Technology, Delhi",
        "type": "institute",
        "ownership": "government",
        "category": "Fashion",
        "state": "Delhi",
        "city": "New Delhi",
        "address": "Hauz Khas, Near Gulmohar Park, New Delhi, Delhi 110016",
        "website": "https://nift.ac.in/delhi/",
        "approval_body": "Ministry of Textiles",
        "aliases": ["NIFT Delhi"]
    },
];

async function seedDatabase() {
  const collectionRef = firestore.collection('collegesMaster');
  const batch = firestore.batch();

  console.log('Starting to seed database...');

  for (const college of collegesData) {
    const docRef = collectionRef.doc(college.id.toString());
    batch.set(docRef, college);
    console.log(`Preparing to add: ${college.name}`);
  }

  try {
    await batch.commit();
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seedDatabase();
