import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';

interface Report {
  id: string;
  libraryId: string;
  userId: string;
  year: number;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  isShared: boolean;
  pdfPath: string;
  createdAt: any;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [sharedReports, setSharedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const fetchReports = async () => {
      if (!user || !userProfile) {
        return;
      }

      try {
        setLoading(true);
        
        // Fetch user's library reports
        const userReportsQuery = query(
          collection(db, 'reports'),
          where('libraryId', '==', userProfile.libraryId),
          orderBy('year', 'desc'),
          orderBy('createdAt', 'desc')
        );
        
        const userReportsSnapshot = await getDocs(userReportsQuery);
        const userReportsList = userReportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Report));
        
        setReports(userReportsList);
        
        // Fetch shared reports from other libraries
        const sharedReportsQuery = query(
          collection(db, 'reports'),
          where('libraryId', '!=', userProfile.libraryId),
          where('isShared', '==', true),
          orderBy('libraryId'),
          orderBy('year', 'desc')
        );
        
        const sharedReportsSnapshot = await getDocs(sharedReportsQuery);
        const sharedReportsList = sharedReportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Report));
        
        setSharedReports(sharedReportsList);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching reports:', err);
        setError(err.message || 'Failed to load reports');
        setLoading(false);
      }
    };

    fetchReports();
  }, [user, userProfile]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Processing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <>
      <Head>
        <title>Reports - NCLS Annual Report Dashboard</title>
        <meta name="description" content="View your library's annual reports" />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-primary-700">Annual Reports</h1>
            <Link href="/upload" className="btn btn-primary">
              Upload New Report
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
              {error}
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Your Library's Reports</h2>
                {reports.length === 0 ? (
                  <div className="card p-8 text-center">
                    <p className="text-gray-500 mb-4">No reports found for your library.</p>
                    <Link href="/upload" className="btn btn-primary">
                      Upload Your First Report
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white shadow overflow-hidden rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Shared
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Uploaded
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {report.year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getStatusBadge(report.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.isShared ? (
                                <span className="text-green-600">Yes</span>
                              ) : (
                                <span className="text-gray-400">No</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/reports/${report.id}`}
                                className="text-primary-600 hover:text-primary-900 mr-4"
                              >
                                View
                              </Link>
                              <a
                                href={report.pdfPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-900"
                              >
                                PDF
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {sharedReports.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Shared Reports from Other Libraries</h2>
                  <div className="bg-white shadow overflow-hidden rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Library
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Uploaded
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sharedReports.map((report) => (
                          <tr key={report.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {report.year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {/* Library name would be fetched from a separate query */}
                              Library #{report.libraryId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.createdAt ? new Date(report.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/reports/${report.id}`}
                                className="text-primary-600 hover:text-primary-900 mr-4"
                              >
                                View
                              </Link>
                              <a
                                href={report.pdfPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-900"
                              >
                                PDF
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
