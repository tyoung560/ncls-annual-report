import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface ReportDashboardProps {
  libraryName: string;
  year: number;
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

const ReportDashboard: React.FC<ReportDashboardProps> = ({
  libraryName,
  year,
  libraryOverview,
  collectionOverview,
  usageStatistics,
  collectionData,
  circulationData,
  revenueData,
  expenseData,
  programData,
  venueData,
  summerReadingData,
  keyFindings
}) => {
  // Calculate totals
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.value, 0);
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50 text-gray-800">
      <header className="text-center">
        <h1 className="text-3xl font-bold mb-2">{libraryName}</h1>
        <h2 className="text-xl mb-4">{year} Annual Report Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Library Overview</h3>
            <p><span className="font-medium">Population Served:</span> {formatNumber(libraryOverview.populationServed)}</p>
            <p><span className="font-medium">Annual Visits:</span> {formatNumber(libraryOverview.annualVisits)}</p>
            <p><span className="font-medium">Registered Borrowers:</span> {formatNumber(libraryOverview.registeredBorrowers)}</p>
            <p><span className="font-medium">Open Hours Per Week:</span> {libraryOverview.openHoursPerWeek}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Collection Size</h3>
            <p><span className="font-medium">Total Items:</span> {formatNumber(collectionOverview.totalItems)}</p>
            <p><span className="font-medium">Print Materials:</span> {formatNumber(collectionOverview.printMaterials)}</p>
            <p><span className="font-medium">Physical Audio/Video:</span> {formatNumber(collectionOverview.physicalAudioVideo)}</p>
            <p><span className="font-medium">Other Physical Items:</span> {formatNumber(collectionOverview.otherPhysicalItems)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Usage Statistics</h3>
            <p><span className="font-medium">Physical Item Circulation:</span> {formatNumber(usageStatistics.physicalItemCirculation)}</p>
            <p><span className="font-medium">E-Book Circulation:</span> {formatNumber(usageStatistics.eBookCirculation)}</p>
            <p><span className="font-medium">E-Audio Circulation:</span> {formatNumber(usageStatistics.eAudioCirculation)}</p>
            <p><span className="font-medium">Reference Transactions:</span> {formatNumber(usageStatistics.referenceTransactions)}</p>
          </div>
        </div>
      </header>
      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-center">Collection Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={collectionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {collectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Items']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-center">Circulation by Material Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={circulationData}
                margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Circulation" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-center">Revenue Sources - ${formatNumber(totalRevenue)}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-center">Expenditures - ${formatNumber(totalExpenses)}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => (percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : '')}
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      
      <section className="grid grid-cols-1 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-center">Library Programs by Age Group</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={programData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sessions" fill="#8884d8" name="Program Sessions" />
                <Bar yAxisId="right" dataKey="attendance" fill="#82ca9d" name="Attendance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-center">Program Venues</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={venueData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="sessions" fill="#8884d8" name="Program Sessions" />
                <Bar yAxisId="right" dataKey="attendance" fill="#82ca9d" name="Attendance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 text-center">Summer Reading Program</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summerReadingData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="registered" fill="#8884d8" name="Registered" />
                <Bar dataKey="sessions" fill="#82ca9d" name="Program Sessions" />
                <Bar dataKey="attendance" fill="#ffc658" name="Attendance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      
      <section className="grid grid-cols-1 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-center">Key Findings & Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Strengths</h4>
              <ul className="list-disc pl-5 space-y-1">
                {keyFindings.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Areas for Development</h4>
              <ul className="list-disc pl-5 space-y-1">
                {keyFindings.areasForDevelopment.map((area, index) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="mt-4 text-center text-sm text-gray-500">
        <p>Data source: {libraryName} Annual Report {year}</p>
        <p>Report generated on {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
};

export default ReportDashboard;
