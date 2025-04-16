import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  return (
    <>
      <Head>
        <title>NCLS Annual Report Dashboard</title>
        <meta name="description" content="North Country Library System Annual Report Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary-700 mb-4">
              North Country Library System
            </h1>
            <h2 className="text-2xl text-gray-600">Annual Report Dashboard</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Upload Annual Report</h3>
              <p className="text-gray-600 mb-4">
                Upload your library's annual report PDF to generate visual dashboards and analytics.
              </p>
              <button 
                onClick={() => router.push('/upload')}
                className="btn btn-primary"
              >
                Upload Report
              </button>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-4">View Reports</h3>
              <p className="text-gray-600 mb-4">
                Access your library's historical reports and generated dashboards.
              </p>
              <button 
                onClick={() => router.push('/reports')}
                className="btn btn-primary"
              >
                View Reports
              </button>
            </div>
          </div>

          <div className="card mb-12">
            <h3 className="text-xl font-semibold mb-4">About This System</h3>
            <p className="text-gray-600 mb-4">
              The NCLS Annual Report Dashboard System allows library directors to upload their annual report PDFs, 
              automatically generate visual dashboards, and maintain a historical record of their reports.
            </p>
            <p className="text-gray-600">
              The system provides a secure, role-based access model where directors can only view their own 
              library's data unless explicitly shared.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
