import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import pdfParse from 'pdf-parse';

// Interface for the report data structure
interface ReportData {
  reportId: string;
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
  createdAt?: any;
  updatedAt?: any;
}

// Claude API response interface
interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Process a report PDF using Claude AI
 * @param reportId The ID of the report to process
 * @returns A promise that resolves to true if processing was successful, false otherwise
 */
export async function processReportWithAI(reportId: string): Promise<boolean> {
  try {
    // 1. Update status to 'Processing'
    await updateDoc(doc(db, 'reports', reportId), { 
      status: 'Processing',
      updatedAt: new Date()
    });
    
    // 2. Get the report document to access the PDF URL and library info
    const reportDoc = await getDoc(doc(db, 'reports', reportId));
    if (!reportDoc.exists()) {
      throw new Error('Report not found');
    }
    
    const reportData = reportDoc.data();
    const pdfUrl = reportData.pdfPath;
    const libraryId = reportData.libraryId;
    const year = reportData.year;
    
    // 3. Get library information
    const libraryDoc = await getDoc(doc(db, 'libraries', libraryId));
    if (!libraryDoc.exists()) {
      throw new Error('Library not found');
    }
    
    const libraryData = libraryDoc.data();
    const libraryName = libraryData.name || 'Unknown Library';
    
    // 4. Download and extract text from the PDF
    const pdfText = await downloadAndExtractPdfText(pdfUrl);
    
    // 5. Process the PDF text with Claude API
    const processedData = await processLargePdfWithClaudeAI(pdfText, year, libraryName);
    
    // 6. Combine with library data and create final report data
    const finalReportData: ReportData = {
      reportId,
      libraryName,
      year,
      libraryOverview: processedData.libraryOverview!,
      collectionOverview: processedData.collectionOverview!,
      usageStatistics: processedData.usageStatistics!,
      collectionData: processedData.collectionData!,
      circulationData: processedData.circulationData!,
      revenueData: processedData.revenueData!,
      expenseData: processedData.expenseData!,
      programData: processedData.programData!,
      venueData: processedData.venueData!,
      summerReadingData: processedData.summerReadingData!,
      keyFindings: processedData.keyFindings!,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 7. Store the data in Firestore
    await setDoc(doc(db, 'reportData', reportId), finalReportData);
    
    // 8. Update report status to 'Completed'
    await updateDoc(doc(db, 'reports', reportId), { 
      status: 'Completed',
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error processing report:', error);
    
    // Update status to 'Failed'
    try {
      await updateDoc(doc(db, 'reports', reportId), { 
        status: 'Failed',
        updatedAt: new Date()
      });
    } catch (updateError) {
      console.error('Error updating report status:', updateError);
    }
    
    return false;
  }
}

/**
 * Download a PDF from a URL and extract its text content
 * @param pdfUrl URL of the PDF to download and process
 * @returns The extracted text from the PDF
 */
async function downloadAndExtractPdfText(pdfUrl: string): Promise<string> {
  try {
    // Download the PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }
    
    // Convert to ArrayBuffer
    const pdfBuffer = await response.arrayBuffer();
    
    // Extract text using pdf-parse
    const data = await pdfParse(Buffer.from(pdfBuffer));
    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

/**
 * Split text into chunks of approximately the specified token count
 * This is a simple implementation that splits by paragraphs and then combines them
 * @param text The text to split
 * @param maxTokens The maximum number of tokens per chunk
 * @returns An array of text chunks
 */
function splitTextIntoChunks(text: string, maxTokens: number): string[] {
  // A very rough approximation: 1 token ≈ 4 characters for English text
  const charsPerToken = 4;
  const maxChars = maxTokens * charsPerToken;
  
  // Split by paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the limit, start a new chunk
    if (currentChunk.length + paragraph.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

/**
 * Merge multiple partial results into a single result
 * @param results Array of partial results from different chunks
 * @returns A merged result
 */
function mergeResults(results: Partial<ReportData>[]): Partial<ReportData> {
  const merged: Partial<ReportData> = {};
  
  // For simple objects like libraryOverview, use the first non-null value
  for (const result of results) {
    if (result.libraryOverview && !merged.libraryOverview) {
      merged.libraryOverview = result.libraryOverview;
    }
    if (result.collectionOverview && !merged.collectionOverview) {
      merged.collectionOverview = result.collectionOverview;
    }
    if (result.usageStatistics && !merged.usageStatistics) {
      merged.usageStatistics = result.usageStatistics;
    }
  }
  
  // For arrays, concatenate and deduplicate
  const arrayProps: (keyof Pick<ReportData, 'collectionData' | 'circulationData' | 'revenueData' | 'expenseData' | 'programData' | 'venueData' | 'summerReadingData'>)[] = [
    'collectionData', 'circulationData', 'revenueData', 'expenseData', 
    'programData', 'venueData', 'summerReadingData'
  ];
  
  for (const prop of arrayProps) {
    const items: any[] = [];
    const nameMap = new Map<string, number>();
    
    for (const result of results) {
      const arr = result[prop] as any[] | undefined;
      if (!arr) continue;
      
      for (const item of arr) {
        if (nameMap.has(item.name)) {
          // If we've seen this name before, update the existing item
          const index = nameMap.get(item.name)!;
          const existingItem = items[index];
          
          // Merge numeric properties
          for (const key of Object.keys(item)) {
            if (typeof item[key] === 'number' && key !== 'name') {
              existingItem[key] = (existingItem[key] || 0) + item[key];
            }
          }
        } else {
          // If this is a new name, add it to our items
          nameMap.set(item.name, items.length);
          items.push({...item});
        }
      }
    }
    
    if (items.length > 0) {
      merged[prop] = items as any;
    }
  }
  
  // For keyFindings, combine unique values
  if (results.some(r => r.keyFindings)) {
    const strengths = new Set<string>();
    const areasForDevelopment = new Set<string>();
    
    for (const result of results) {
      if (result.keyFindings?.strengths) {
        for (const strength of result.keyFindings.strengths) {
          strengths.add(strength);
        }
      }
      if (result.keyFindings?.areasForDevelopment) {
        for (const area of result.keyFindings.areasForDevelopment) {
          areasForDevelopment.add(area);
        }
      }
    }
    
    merged.keyFindings = {
      strengths: Array.from(strengths).slice(0, 5),
      areasForDevelopment: Array.from(areasForDevelopment).slice(0, 5)
    };
  }
  
  return merged;
}

/**
 * Process a large PDF by splitting it into chunks and processing each chunk with Claude
 * @param pdfText The full text of the PDF
 * @param year The year of the report
 * @param libraryName The name of the library
 * @returns Structured report data extracted by Claude
 */
async function processLargePdfWithClaudeAI(pdfText: string, year: number, libraryName: string): Promise<Partial<ReportData>> {
  try {
    // Split the PDF text into chunks of approximately 50K tokens
    // Claude 3 Opus has a 200K token context window, but we'll use 50K to be safe
    const chunks = splitTextIntoChunks(pdfText, 50000);
    
    // Create the system prompt with the extraction instructions
    const systemPrompt = `
You are analyzing a library annual report PDF for ${libraryName} from ${year}. Extract the following information in JSON format exactly matching the structure below:

{
  "libraryOverview": {
    "populationServed": number, // Total population the library serves
    "annualVisits": number, // Total number of visits to the library
    "registeredBorrowers": number, // Number of registered library card holders
    "openHoursPerWeek": number // Hours the library is open per week
  },
  "collectionOverview": {
    "totalItems": number, // Total number of items in the collection
    "printMaterials": number, // Total print materials (books, etc.)
    "physicalAudioVideo": number, // Total physical audio/video materials
    "otherPhysicalItems": number // Other physical items in the collection
  },
  "usageStatistics": {
    "physicalItemCirculation": number, // Total physical item checkouts
    "eBookCirculation": number, // Total e-book checkouts
    "eAudioCirculation": number, // Total e-audio checkouts
    "referenceTransactions": number // Number of reference questions answered
  },
  "collectionData": [
    // Collection breakdown by category
    { "name": "Adult Fiction", "value": number },
    { "name": "Adult Non-Fiction", "value": number },
    { "name": "Children's Fiction", "value": number },
    { "name": "Children's Non-Fiction", "value": number },
    { "name": "Audio Materials", "value": number },
    { "name": "Video Materials", "value": number },
    { "name": "Other Materials", "value": number }
  ],
  "circulationData": [
    // Circulation data by material type
    { "name": "Adult Fiction", "value": number },
    { "name": "Adult Non-Fiction", "value": number },
    { "name": "Children's Fiction", "value": number },
    { "name": "Children's Non-Fiction", "value": number },
    { "name": "Other Materials", "value": number }
  ],
  "revenueData": [
    // Revenue sources and amounts
    { "name": "School District", "value": number },
    { "name": "Town/City Funding", "value": number },
    { "name": "LLSA", "value": number },
    { "name": "Other Grants", "value": number },
    { "name": "Gifts & Endowments", "value": number },
    { "name": "Fundraising", "value": number },
    { "name": "Other", "value": number }
  ],
  "expenseData": [
    // Expense categories and amounts
    { "name": "Staff", "value": number },
    { "name": "Collection", "value": number },
    { "name": "Capital", "value": number },
    { "name": "Building Maintenance", "value": number },
    { "name": "Office & Supplies", "value": number },
    { "name": "Telecommunications", "value": number },
    { "name": "Professional Fees", "value": number },
    { "name": "Equipment", "value": number },
    { "name": "Other", "value": number },
    { "name": "Contracts", "value": number }
  ],
  "programData": [
    // Program data by age group
    { "name": "Ages 0-5", "sessions": number, "attendance": number },
    { "name": "Ages 6-11", "sessions": number, "attendance": number },
    { "name": "Ages 12-18", "sessions": number, "attendance": number },
    { "name": "Adult (19+)", "sessions": number, "attendance": number },
    { "name": "General Interest", "sessions": number, "attendance": number }
  ],
  "venueData": [
    // Program venue data
    { "name": "Onsite", "sessions": number, "attendance": number },
    { "name": "Offsite", "sessions": number, "attendance": number },
    { "name": "Virtual", "sessions": number, "attendance": number }
  ],
  "summerReadingData": [
    // Summer reading program data
    { "name": "Children", "registered": number, "sessions": number, "attendance": number },
    { "name": "Young Adults", "registered": number, "sessions": number, "attendance": number },
    { "name": "Adults", "registered": number, "sessions": number, "attendance": number }
  ],
  "keyFindings": {
    "strengths": [
      // List 5 strengths based on the data
      "string",
      "string",
      "string",
      "string",
      "string"
    ],
    "areasForDevelopment": [
      // List 5 areas for development based on the data
      "string",
      "string",
      "string",
      "string",
      "string"
    ]
  }
}

Important instructions:
1. Extract all values directly from the PDF text.
2. For any values not found in the PDF, use reasonable estimates based on related data.
3. Ensure all numeric fields are numbers, not strings.
4. For the keyFindings, analyze the data to identify actual strengths and areas for development.
5. Return ONLY the JSON with no additional text or explanation.
`;
    
    // Process each chunk and collect the results
    const results: Partial<ReportData>[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i+1} of ${chunks.length}`);
      
      const userPrompt = `
This is chunk ${i+1} of ${chunks.length} from the ${year} annual report for ${libraryName}.
Extract any relevant information you can find in this chunk according to the format specified.
If you can't find certain information in this chunk, just omit those fields from your response.

Here is the text:

${chunks[i]}
`;
      
      try {
        const chunkResult = await callClaudeAPI(systemPrompt, userPrompt);
        results.push(chunkResult);
      } catch (error) {
        console.error(`Error processing chunk ${i+1}:`, error);
        // Continue with other chunks even if one fails
      }
    }
    
    // Merge the results from all chunks
    return mergeResults(results);
  } catch (error) {
    console.error('Error processing with Claude AI:', error);
    throw error;
  }
}

/**
 * Call the Claude API with a prompt
 * @param systemPrompt The system prompt to send to Claude
 * @param userPrompt The user prompt to send to Claude
 * @returns The parsed JSON response from Claude
 */
async function callClaudeAPI(systemPrompt: string, userPrompt: string): Promise<Partial<ReportData>> {
  try {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
    if (!apiKey) {
      throw new Error('Claude API key not found');
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data: ClaudeResponse = await response.json();
    
    if (!data.content || data.content.length === 0) {
      throw new Error('Empty response from Claude API');
    }
    
    const content = data.content[0].text;
    
    // Extract JSON from the response
    // Claude sometimes includes markdown code blocks or other text
    const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/) || content.match(/({[\s\S]*})/);
    const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
    
    try {
      // Parse the JSON response
      return JSON.parse(jsonString) as Partial<ReportData>;
    } catch (parseError) {
      console.error('Error parsing Claude response as JSON:', parseError);
      console.error('Raw response:', content);
      throw new Error('Failed to parse Claude response as JSON');
    }
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

/**
 * Generate mock report data for fallback or testing purposes
 * This is used only if the Claude API call fails
 */
function generateMockReportData(year: number): Partial<ReportData> {
  return {
    libraryOverview: {
      populationServed: 398,
      annualVisits: 4911,
      registeredBorrowers: 843,
      openHoursPerWeek: 31
    },
    collectionOverview: {
      totalItems: 7655,
      printMaterials: 6153,
      physicalAudioVideo: 1351,
      otherPhysicalItems: 151
    },
    usageStatistics: {
      physicalItemCirculation: 4357,
      eBookCirculation: 364,
      eAudioCirculation: 196,
      referenceTransactions: 136
    },
    collectionData: [
      { name: "Adult Fiction", value: 2436 },
      { name: "Adult Non-Fiction", value: 881 },
      { name: "Children's Fiction", value: 2134 },
      { name: "Children's Non-Fiction", value: 550 },
      { name: "Audio Materials", value: 296 },
      { name: "Video Materials", value: 1055 },
      { name: "Other Materials", value: 303 }
    ],
    circulationData: [
      { name: "Adult Fiction", value: 2399 },
      { name: "Adult Non-Fiction", value: 482 },
      { name: "Children's Fiction", value: 689 },
      { name: "Children's Non-Fiction", value: 61 },
      { name: "Other Materials", value: 726 }
    ],
    revenueData: [
      { name: "School District", value: 61513 },
      { name: "Town of Morristown", value: 10500 },
      { name: "LLSA", value: 1493 },
      { name: "Other Grants", value: 1840 },
      { name: "Gifts & Endowments", value: 31390 },
      { name: "Fundraising", value: 974 },
      { name: "Other", value: 1715 }
    ],
    expenseData: [
      { name: "Staff", value: 70511 },
      { name: "Collection", value: 5179 },
      { name: "Capital", value: 1862 },
      { name: "Building Maintenance", value: 6399 },
      { name: "Office & Supplies", value: 2734 },
      { name: "Telecommunications", value: 2292 },
      { name: "Professional Fees", value: 15158 },
      { name: "Equipment", value: 142 },
      { name: "Other", value: 714 },
      { name: "Contracts", value: 2790 }
    ],
    programData: [
      { name: "Ages 0-5", sessions: 23, attendance: 202 },
      { name: "Ages 6-11", sessions: 15, attendance: 194 },
      { name: "Ages 12-18", sessions: 13, attendance: 47 },
      { name: "Adult (19+)", sessions: 39, attendance: 443 },
      { name: "General Interest", sessions: 11, attendance: 533 }
    ],
    venueData: [
      { name: "Onsite", sessions: 92, attendance: 968 },
      { name: "Offsite", sessions: 8, attendance: 444 },
      { name: "Virtual", sessions: 1, attendance: 7 }
    ],
    summerReadingData: [
      { name: "Children", registered: 14, sessions: 12, attendance: 464 },
      { name: "Young Adults", registered: 1, sessions: 1, attendance: 8 },
      { name: "Adults", registered: 0, sessions: 0, attendance: 0 }
    ],
    keyFindings: {
      strengths: [
        "Strong community support with significant gifts/endowments ($31,390)",
        "Successful school district funding with voter approval (increased by $2,266)",
        "High program attendance (1,419 total) relative to population served (398)",
        "Diverse program offerings for all age groups",
        "Meets all minimum public library standards"
      ],
      areasForDevelopment: [
        "Adult circulation (2,881) significantly outpaces children's circulation (750)",
        "Low summer reading program participation (15 total registrants)",
        "Limited virtual programming (only 1 session with 7 attendees)",
        "No disaster plan in place",
        "Opportunity to expand digital services (e-books and e-audio are consortium-provided only)"
      ]
    }
  };
}
