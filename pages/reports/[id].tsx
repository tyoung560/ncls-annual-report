import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';
import { processReportWithAI } from '@/lib/reportProcessing';
import ReportDashboard from '@/components/reports/ReportDashboard';

interface Report {
  id: string;
  libraryId: string;
  userId: string;
  year: number;
  title: string;
  status: 'Processing' | 'Completed' | 'Failed';
  isShared: boolean;
  pdfPath: string;
  errorMessage?: string;
  createdAt: any;
}

interface ReportData {
  id: string;
  reportId: string;
  libraryName: string;
  libraryOverview: {
    populationServed: number;
    annualVisits: number;
    registeredBorrowers: number;
    openHoursPerWeek: number;
  };
  collectionOverview: {
    totalItems: number;
    printMaterials: number;
    physicalAudioVideo: number;
    otherPhysicalItems: number;
  };
  usageStatistics: {
    physicalItemCirculation: number;
    eBookCirculation: number;
    eAudioCirculation: number;
    referenceTransactions: number;
  };
  collectionData: Array<{ name: string; value: number }>;
  circulationData: Array<{ name: string; value: number }>;
  revenueData: Array<{ name: string; value: number }>;
  expenseData: Array<{ name: string; value: number }>;
  programData: Array<{ name: string; sessions: number; attendance: number }>;
  venueData: Array<{ name: string; sessions: number; attendance: number }>;
  summerReadingData: Array<{ name: string; registered: number; sessions: number; attendance: number }>;
  keyFindings: {
    strengths: string[];
    areasForDevelopment: string[];
  };
}

export default function ReportDetail() {
  const [report, setReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [polling, setPolling] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const fetchReport = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        
        // Fetch report
        const reportDoc = await getDoc(doc(db, 'reports', id as string));
        
        if (!reportDoc.exists()) {
          setError('Report not found');
          setLoading(false);
          return;
        }
        
        const reportData = {
          id: reportDoc.id,
          ...reportDoc.data()
        } as Report;
        
        setReport(reportData);
        
        // Check if user has access to this report
        if (reportData.libraryId !== userProfile?.libraryId && !reportData.isShared && userProfile?.role !== 'admin') {
          setError('You do not have permission to view this report');
          setLoading(false);
          return;
        }
        
        // Fetch report data
        const reportDataDoc = await getDoc(doc(db, 'reportData', reportData.id));
        
        if (reportDataDoc.exists()) {
          setReportData({
            id: reportDataDoc.id,
            ...reportDataDoc.data()
          } as ReportData);
        }
        
        // Start polling if the report is in processing state
        if (reportData.status === 'Processing') {
          setPolling(true);
        } else {
          setPolling(false);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching report:', err);
        setError(err.message || 'Failed to load report');
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, user, userProfile]);
  
  // Set up polling for report status updates
  useEffect(() => {
    if (!polling || !report?.id) return;
    
    const pollInterval = 5000; // 5 seconds
    let timeoutId: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/report-status?reportId=${report.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch report status');
        }
        
        const data = await response.json();
        
        // If status has changed, refresh the report
        if (data.status !== report.status) {
          // Fetch report
          const reportDoc = await getDoc(doc(db, 'reports', report.id));
          
          if (reportDoc.exists()) {
            const updatedReport = {
              id: reportDoc.id,
              ...reportDoc.data()
            } as Report;
            
            setReport(updatedReport);
            
            // If status is completed, fetch report data
            if (updatedReport.status === 'Completed') {
              const reportDataDoc = await getDoc(doc(db, 'reportData', report.id));
              
              if (reportDataDoc.exists()) {
                setReportData({
                  id: reportDataDoc.id,
                  ...reportDataDoc.data()
                } as ReportData);
              }
              
              // Stop polling
              setPolling(false);
              return;
            }
            
            // If status is failed, stop polling
            if (updatedReport.status === 'Failed') {
              setPolling(false);
              return;
            }
          }
        }
        
        // Continue polling
        timeoutId = setTimeout(checkStatus, pollInterval);
      } catch (err) {
        console.error('Error polling report status:', err);
        // Continue polling even if there's an error
        timeoutId = setTimeout(checkStatus, pollInterval);
      }
    };
    
    // Start polling
    timeoutId = setTimeout(checkStatus, pollInterval);
    
    // Clean up on unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, [polling, report?.id, report?.status]);

  const handleGenerateDashboard = async () => {
    if (!report) return;
    
    try {
      setProcessing(true);
      setError('');
      
      // Call the AI processing function
      const success = await processReportWithAI(report.id);
      
      if (success) {
        // Refresh the report data
        const reportDoc = await getDoc(doc(db, 'reports', report.id));
        if (reportDoc.exists()) {
          setReport({
            id: reportDoc.id,
            ...reportDoc.data()
          } as Report);
        }
        
        // Fetch the newly created report data
        const reportDataDoc = await getDoc(doc(db, 'reportData', report.id));
        if (reportDataDoc.exists()) {
          setReportData({
            id: reportDataDoc.id,
            ...reportDataDoc.data()
          } as ReportData);
        }
      } else {
        setError('Failed to process report. Please try again.');
      }
      
      setProcessing(false);
    } catch (err: any) {
      console.error('Error processing report:', err);
      setError(err.message || 'Failed to process report');
      setProcessing(false);
    }
  };

  const toggleSharing = async () => {
    if (!report) return;
    
    try {
      setUpdating(true);
      
      // Update report sharing status
      await updateDoc(doc(db, 'reports', report.id), {
        isShared: !report.isShared
      });
      
      // Update local state
      setReport({
        ...report,
        isShared: !report.isShared
      });
      
      setUpdating(false);
    } catch (err: any) {
      console.error('Error updating report:', err);
      setError(err.message || 'Failed to update report');
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
            {error}
          </div>
          <Link href="/reports" className="btn btn-primary">
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative mb-6">
            Report not found
          </div>
          <Link href="/reports" className="btn btn-primary">
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{report.title} - NCLS Annual Report Dashboard</title>
        <meta name="description" content={`View dashboard for ${report.title}`} />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Link href="/reports" className="text-primary-600 hover:text-primary-700 mb-2 inline-block">
                &larr; Back to Reports
              </Link>
              <h1 className="text-3xl font-bold text-primary-700">{report.title}</h1>
            </div>
            <div className="flex space-x-3">
              {report.libraryId === userProfile?.libraryId && (
                <button
                  onClick={toggleSharing}
                  disabled={updating}
                  className={`btn ${report.isShared ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {updating ? 'Updating...' : report.isShared ? 'Make Private' : 'Share Report'}
                </button>
              )}
              <a
                href={report.pdfPath}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                View PDF
              </a>
            </div>
          </div>

          {report.status === 'Processing' ? (
            <div className="card p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Processing Report</h2>
              <p className="text-gray-600 mb-4">
                Your report is currently being processed. This may take a few minutes.
              </p>
              <p className="text-gray-600">
                The dashboard will be automatically generated once processing is complete.
              </p>
            </div>
          ) : report.status === 'Failed' ? (
            <div className="card p-8">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
                <h2 className="text-xl font-semibold mb-2">Processing Failed</h2>
                <p className="mb-2">
                  There was an error processing your report. Please try again or contact support.
                </p>
                {report.errorMessage && (
                  <div className="mt-2 p-3 bg-red-100 rounded text-sm font-mono overflow-auto">
                    <strong>Error details:</strong> {report.errorMessage}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    If this error persists, please try uploading a different PDF file or contact support.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleGenerateDashboard}
                    disabled={processing}
                    className="btn btn-primary"
                  >
                    {processing ? 'Processing...' : 'Try Again'}
                  </button>
                  <Link href="/upload" className="btn btn-secondary">
                    Upload New Report
                  </Link>
                </div>
              </div>
            </div>
          ) : !reportData ? (
            <div className="card p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
              <p className="text-gray-600 mb-4">
                No dashboard data is available for this report yet.
              </p>
              <button
                onClick={handleGenerateDashboard}
                disabled={processing}
                className="btn btn-primary"
              >
                {processing ? 'Processing...' : 'Generate Dashboard'}
              </button>
            </div>
          ) : (
            report.status === 'Completed' && reportData && (
              <ReportDashboard
                libraryName={reportData.libraryName}
                year={report.year}
                libraryOverview={reportData.libraryOverview}
                collectionOverview={reportData.collectionOverview}
                usageStatistics={reportData.usageStatistics}
                collectionData={reportData.collectionData}
                circulationData={reportData.circulationData}
                revenueData={reportData.revenueData}
                expenseData={reportData.expenseData}
                programData={reportData.programData}
                venueData={reportData.venueData}
                summerReadingData={reportData.summerReadingData}
                keyFindings={reportData.keyFindings}
              />
            )
          )}
        </div>
      </div>
    </>
  );
}
