/**
 * This script updates the Firestore security rules to allow reading the libraries collection
 * without authentication, while keeping the rest of the rules secure.
 * 
 * To use this script:
 * 1. Install the Firebase Admin SDK: npm install firebase-admin
 * 2. Create a service account key in the Firebase Console
 * 3. Save the key as serviceAccountKey.json in the same directory as this script
 * 4. Run the script: node update-firestore-rules.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
try {
  // If you have a serviceAccountKey.json file
  const serviceAccount = require('./serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  console.log('Please make sure you have a serviceAccountKey.json file in the same directory as this script.');
  process.exit(1);
}

// Updated security rules
const securityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Library data is readable by anyone, but only writable by admins
    match /libraries/{libraryId} {
      allow read: if true;  // Allow anyone to read libraries
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users can read/write their own data, admins can read/write all
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Reports are viewable by users from the same library or if shared
    match /reports/{reportId} {
      allow read: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.libraryId == resource.data.libraryId ||
        resource.data.isShared == true ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.libraryId == resource.data.libraryId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Similar rules for reportData
    match /reportData/{reportDataId} {
      allow read: if request.auth != null && (
        get(/databases/$(database)/documents/reports/$(reportDataId)).data.libraryId == 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.libraryId ||
        get(/databases/$(database)/documents/reports/$(reportDataId)).data.isShared == true ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null && (
        get(/databases/$(database)/documents/reports/$(reportDataId)).data.libraryId == 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.libraryId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
  }
}
`;

// Update the security rules
async function updateSecurityRules() {
  try {
    const project = admin.app().options.projectId;
    
    // Update the rules
    await admin.securityRules().releaseFirestoreRulesetFromSource(securityRules);
    
    console.log('Firestore security rules updated successfully!');
    console.log('The libraries collection is now readable without authentication.');
    
    // Save the rules to a file for reference
    fs.writeFileSync('../firestore.rules', securityRules);
    console.log('Rules saved to ../firestore.rules');
  } catch (error) {
    console.error('Error updating security rules:', error);
  }
}

updateSecurityRules();
