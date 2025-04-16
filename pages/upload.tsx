import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const years = Array.from({ length: 10 }, (_, i) => 
    (new Date().getFullYear() - i).toString()
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if file is a PDF
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!user || !userProfile) {
      setError('You must be logged in to upload a report');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      // Create a reference to the file in Firebase Storage
      const libraryId = userProfile.libraryId;
      const fileName = `${year}_annual_report.pdf`;
      const storageRef = ref(storage, `libraries/${libraryId}/reports/${year}/${fileName}`);
      
      // Upload the file
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Listen for upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
        },
        (error) => {
          setError('Error uploading file: ' + error.message);
          setUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Create a document in Firestore with status 'Processing'
          const reportRef = await addDoc(collection(db, 'reports'), {
            libraryId: userProfile.libraryId,
            userId: user.uid,
            year: parseInt(year),
            title: `${year} Annual Report`,
            status: 'Processing',
            isShared: false,
            pdfPath: downloadURL,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          setSuccess(true);
          setUploading(false);
          
          // Start processing the report with AI using the API route
          fetch('/api/process-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reportId: reportRef.id }),
          }).catch((err: Error) => {
            console.error('Error processing report:', err);
          });
          
          // Redirect to reports page after 2 seconds
          setTimeout(() => {
            router.push(`/reports/${reportRef.id}`);
          }, 2000);
        }
      );
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setYear(new Date().getFullYear().toString());
    setError('');
    setSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Head>
        <title>Upload Report - NCLS Annual Report Dashboard</title>
        <meta name="description" content="Upload your library's annual report" />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-primary-700 mb-6">Upload Annual Report</h1>
          
          {success ? (
            <div className="card mb-6 bg-green-50 border border-green-200">
              <div className="text-center py-8">
                <svg
                  className="w-16 h-16 text-green-500 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <h2 className="text-xl font-semibold text-green-800 mb-2">Upload Successful!</h2>
                <p className="text-green-700 mb-4">
                  Your report has been uploaded and is now being processed. You will be redirected to view the processing status.
                </p>
                <button
                  onClick={() => router.push('/reports')}
                  className="btn btn-primary"
                >
                  View Reports
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card">
              <div className="space-y-6">
                <div>
                  <label htmlFor="year" className="form-label">
                    Report Year
                  </label>
                  <select
                    id="year"
                    name="year"
                    className="form-input"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={uploading}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="file" className="form-label">
                    PDF File
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            disabled={uploading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF up to 10MB</p>
                    </div>
                  </div>
                  {file && (
                    <div className="mt-2 text-sm text-gray-700">
                      Selected file: <span className="font-medium">{file.name}</span> ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                
                {uploading && (
                  <div className="mt-2">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Uploading: {uploadProgress}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary"
                    disabled={uploading}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!file || uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Report'}
                  </button>
                </div>
              </div>
            </form>
          )}
          
          <div className="mt-8 card bg-blue-50 border border-blue-200">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">What happens after upload?</h2>
            <ol className="list-decimal pl-5 space-y-2 text-blue-700">
              <li>Your PDF will be securely stored in our system.</li>
              <li>Our AI will analyze the report and extract key data points.</li>
              <li>Visual dashboards will be automatically generated from the extracted data.</li>
              <li>You'll be able to view, share, and export these dashboards.</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
