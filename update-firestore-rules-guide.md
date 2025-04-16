# How to Update Firestore Security Rules

We need to update the Firestore security rules to allow reading the libraries collection without authentication. This is necessary for the registration page to work properly.

## Option 1: Manual Update (Recommended)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on "Firestore Database" in the left sidebar
4. Click on the "Rules" tab
5. Replace the current rules with the content of the `firestore.rules` file
6. Click "Publish"

## Option 2: Using the Script (Advanced)

If you prefer to use the script, you'll need to:

1. Create a service account key:
   - Go to Firebase Console → Project Settings → Service accounts
   - Click "Generate new private key"
   - Save the JSON file as `serviceAccountKey.json` in the same directory as the script

2. Install the Firebase Admin SDK:
   ```
   npm install firebase-admin
   ```

3. Run the script:
   ```
   node update-firestore-rules.js
   ```

## What Changed in the Rules?

The key change is in the libraries collection rule:

```
match /libraries/{libraryId} {
  allow read: if true;  // Allow anyone to read libraries
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

We changed `allow read: if request.auth != null;` to `allow read: if true;` to allow unauthenticated access to the libraries collection. This is necessary for the registration page to display the list of libraries in the dropdown.

## After Updating the Rules

After updating the rules, restart the application:

```
cd ncls-annual-report
npm run dev
```

The libraries should now appear in the dropdown on the registration page.
