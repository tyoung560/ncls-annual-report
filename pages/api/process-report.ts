import { NextApiRequest, NextApiResponse } from 'next';
import { processReportWithAI } from '@/lib/reportProcessing';

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
    // Process the report
    const success = await processReportWithAI(reportId);
    
    // Return the result
    return res.status(200).json({ success });
  } catch (error: any) {
    console.error('Error processing report:', error);
    return res.status(500).json({ error: error.message || 'Failed to process report' });
  }
}
