import { NextApiRequest, NextApiResponse } from 'next';
import { processReportWithAI } from '@/lib/reportProcessing';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get the report ID from the request body
  const { reportId } = req.body;
  
  if (!reportId) {
    return res.status(400).json({ error: 'Report ID is required' });
  }
  
  try {
    // Start processing but don't wait for it to complete
    // This prevents Vercel function timeout issues
    const processingPromise = processReportWithAI(reportId).catch(async (error) => {
      console.error('Error in background processing:', error);
      
      // Update the report status to Failed
      try {
        await updateDoc(doc(db, 'reports', reportId), {
          status: 'Failed',
          errorMessage: error.message || 'Unknown error occurred',
          updatedAt: new Date()
        });
      } catch (updateError) {
        console.error('Failed to update report status:', updateError);
      }
      
      return false;
    });
    
    // Return success immediately, let processing continue in background
    res.status(200).json({ 
      success: true, 
      message: 'Processing started' 
    });
    
    // Note: This won't block the response, but will keep the function warm
    // until processing is done or until Vercel terminates it
  } catch (error: any) {
    console.error('Error initiating report processing:', error);
    
    // Update the report status to Failed
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'Failed',
        errorMessage: error.message || 'Unknown error occurred',
        updatedAt: new Date()
      });
    } catch (updateError) {
      console.error('Failed to update report status:', updateError);
    }
    
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to process report' 
    });
  }
}
