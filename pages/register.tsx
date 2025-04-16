import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface Library {
  id: string;
  name: string;
  city: string;
  county: string;
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLibraries, setLoadingLibraries] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLibraries = async () => {
      try {
        const librariesCollection = collection(db, 'libraries');
        const librariesSnapshot = await getDocs(librariesCollection);
        const librariesList = librariesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Library));
        
        // Sort libraries by name
        librariesList.sort((a, b) => a.name.localeCompare(b.name));
        
        setLibraries(librariesList);
        setLoadingLibraries(false);
      } catch (error) {
        console.error('Error fetching libraries:', error);
        setError('Failed to load libraries');
        setLoadingLibraries(false);
      }
    };

    fetchLibraries();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (!libraryId) {
      setError('Please select your library');
      return;
    }
    
    setLoading(true);

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email,
        firstName,
        lastName,
        libraryId,
        role: 'director', // Default role
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register - NCLS Annual Report Dashboard</title>
        <meta name="description" content="Create a new account for NCLS Annual Report Dashboard" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="text-center text-3xl font-bold text-primary-600">NCLS Dashboard</h1>
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Create a new account</h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first-name" className="form-label">
                    First Name
                  </label>
                  <input
                    id="first-name"
                    name="firstName"
                    type="text"
                    required
                    className="form-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className="form-label">
                    Last Name
                  </label>
                  <input
                    id="last-name"
                    name="lastName"
                    type="text"
                    required
                    className="form-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email-address" className="form-label">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="library" className="form-label">
                  Library
                </label>
                <select
                  id="library"
                  name="library"
                  required
                  className="form-input"
                  value={libraryId}
                  onChange={(e) => setLibraryId(e.target.value)}
                  disabled={loadingLibraries}
                >
                  <option value="">Select your library</option>
                  {libraries.map((library) => (
                    <option key={library.id} value={library.id}>
                      {library.name} ({library.city})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="form-label">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/login" className="text-primary-600 hover:text-primary-500">
                  Already have an account? Sign in
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || loadingLibraries}
                className="btn btn-primary w-full flex justify-center py-2 px-4"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
