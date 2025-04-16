import { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get the report ID from the query parameters
  const { reportId } = req.query;
  
  if (!reportId || typeof reportId !== 'string') {
    return res.status(400).json({ error: 'Report ID is required' });
  }
  
  try {
    // Fetch the report document
    const reportDoc = await getDoc(doc(db, 'reports', reportId));
    
    if (!reportDoc.exists()) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const reportData = reportDoc.data();
    
    // Return the report status
    return res.status(200).json({
      status: reportData.status,
      errorMessage: reportData.errorMessage || null,
      updatedAt: reportData.updatedAt ? reportData.updatedAt.toDate().toISOString() : null
    });
  } catch (error: any) {
    console.error('Error fetching report status:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch report status' 
    });
  }
}
