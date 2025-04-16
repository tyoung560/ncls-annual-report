const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Load environment variables from .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importLibraries() {
  try {
    // Read the CSV file
    const csvFilePath = path.resolve(__dirname, '../NCLS-libraries.csv');
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    
    // Parse the CSV data
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} libraries to import`);
    
    // Import each library to Firestore
    const librariesCollection = collection(db, 'libraries');
    
    for (const library of records) {
      const libraryData = {
        name: library['Library Name'] || '',
        address: library['Street Address'] || '',
        city: library['City'] || '',
        zipcode: library['Zipcode'] || '',
        phone: library['Phone Number'] || '',
        website: library['Website URL'] || '',
        email: library['Email Address'] || '',
        county: library['County'] || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Create a document with a generated ID
      const libraryDoc = doc(librariesCollection);
      await setDoc(libraryDoc, libraryData);
      
      console.log(`Imported: ${libraryData.name}`);
    }
    
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error importing libraries:', error);
  }
}

// Run the import
importLibraries();
