/**
 * Zoom Transcript Processor
 * Processes Zoom transcripts into structured meeting notes using Google Gemini AI
 */

// Configuration
const CONFIG = {
  // The main folder ID containing all transcripts
  TRANSCRIPT_FOLDER_ID: '1KFvT3C0ONlIBX1bv0V7JLlAlLW_6yRIV',
  
  // Gemini API configuration
  GEMINI_API_KEY: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  GEMINI_MODEL: 'gemini-1.5-pro',
  
  // Person to Google Doc ID mapping
  PERSON_DOC_MAPPING: {
    'Rajesh': 'your_rajesh_doc_id_here',
    'John': 'your_john_doc_id_here',
    'Sarah': 'your_sarah_doc_id_here'
    // Add more people and their corresponding Google Doc IDs
  },
  
  // Processed transcripts tracking sheet
  TRACKING_SHEET_ID: 'your_tracking_sheet_id_here'
};

/**
 * Main function to process all new transcripts
 */
function processNewTranscripts() {
  try {
    console.log('Starting transcript processing...');
    
    // Get last processing time
    const lastProcessTime = getLastProcessingTime();
    console.log(`Looking for files created after: ${lastProcessTime}`);
    
    const transcriptFolder = DriveApp.getFolderById(CONFIG.TRANSCRIPT_FOLDER_ID);
    const allTranscriptFiles = findTranscriptFiles(transcriptFolder);
    
    // Filter for only new files
    const newTranscriptFiles = filterNewFiles(allTranscriptFiles, lastProcessTime);
    
    console.log(`Found ${allTranscriptFiles.length} total transcript files`);
    console.log(`Found ${newTranscriptFiles.length} new transcript files since last run`);
    
    if (newTranscriptFiles.length === 0) {
      console.log('No new transcripts to process');
      return;
    }
    
    let processedCount = 0;
    for (const file of newTranscriptFiles) {
      try {
        if (!isFileProcessed(file.getId())) {
          processTranscriptFile(file);
          markFileAsProcessed(file.getId(), file.getName());
          processedCount++;
        } else {
          console.log(`File already processed: ${file.getName()}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.getName()}:`, error);
      }
    }
    
    // Update last processing time
    updateLastProcessingTime();
    
    console.log(`Transcript processing completed. Processed ${processedCount} new files.`);
  } catch (error) {
    console.error('Error in processNewTranscripts:', error);
  }
}

/**
 * Recursively find all transcript files in folder and subfolders
 */
function findTranscriptFiles(folder) {
  const transcriptFiles = [];
  
  // Process files in current folder
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (isTranscriptFile(file.getName())) {
      transcriptFiles.push(file);
    }
  }
  
  // Process subfolders recursively
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    transcriptFiles.push(...findTranscriptFiles(subfolder));
  }
  
  return transcriptFiles;
}

/**
 * Check if filename matches transcript pattern
 */
function isTranscriptFile(filename) {
  // Pattern: YYYY-MM-DD-HHMMSS Name | Name - Description.transcript.vtt or .transcript
  const transcriptPattern = /^\d{4}-\d{2}-\d{2}-\d{6}.*\.transcript(\.vtt)?$/;
  return transcriptPattern.test(filename);
}

/**
 * Process a single transcript file
 */
function processTranscriptFile(file) {
  console.log(`Processing: ${file.getName()}`);
  
  // Extract person name from filename
  const personName = extractPersonName(file.getName());
  if (!personName || !CONFIG.PERSON_DOC_MAPPING[personName]) {
    console.log(`Skipping file - person not found or no doc mapping: ${file.getName()}`);
    return;
  }
  
  // Read transcript content
  const transcriptContent = file.getBlob().getDataAsString();
  
  // Get meeting prompt
  const meetingPrompt = getMeetingPrompt();
  
  // Generate meeting notes using AI
  const meetingNotes = generateMeetingNotes(transcriptContent, meetingPrompt);
  
  // Add notes to the person's Google Doc
  addNotesToDoc(CONFIG.PERSON_DOC_MAPPING[personName], meetingNotes, file.getName());
  
  console.log(`Successfully processed: ${file.getName()}`);
}

/**
 * Extract person name from filename
 */
function extractPersonName(filename) {
  // Pattern: YYYY-MM-DD-HHMMSS PersonName | Ryan - Description.transcript
  const match = filename.match(/^\d{4}-\d{2}-\d{2}-\d{6}\s+([^|]+)\s*\|/);
  return match ? match[1].trim() : null;
}

/**
 * Get the meeting prompt template
 */
function getMeetingPrompt() {
  return `Role: You are an expert executive assistant. Your task is to analyze the following meeting transcript between me (Ryan), the manager, and my employee(s). Your goal is to create a clear, concise, and actionable document that we can use as a shared record. It should help my team members track their responsibilities and allow me to manage our projects and follow-ups effectively.

Format the output using Markdown for clarity.

Here is the structure I want you to follow:

1. Executive Summary:
Start with a 2-3 sentence high-level summary of the entire conversation. What was the main purpose and what were the key outcomes of this meeting?

2. Key Decisions Made:
In a bulleted list, outline every final decision that was made during the call. For each decision, briefly mention the rationale if it was discussed.

Example: We will adopt the new "Project Alpha" timeline, as it aligns better with the client's revised launch date.

3. Action Items:
Present all action items in a table with the columns: Owner, Task, and Deadline. Be very specific about the tasks and ensure every team member's responsibilities are captured.

| Owner | Task | Deadline |
|-------|------|----------|
| Ryan | [Specific task description, e.g., "Approve final budget for Q4 marketing"] | [Date] |
| [Employee Name] | [Specific task description, e.g., "Send revised client proposal to Ryan for review"] | [Date] |
| [Another Employee] | [Specific task description, e.g., "Complete the user testing for the beta feature"] | [Date] |

Note: The 'Owner' column should clearly state who is responsible, whether it's me (Ryan) or a specific employee by name.

4. Open Questions & Items for Follow-up:
Create a bulleted list of any topics that were left unresolved, questions that were raised but not answered, or items that require a future conversation. This is crucial for ensuring nothing is missed.

Example: Still need to determine who from the engineering team will be assigned to the "Project Zeta" bug fixes.

Example: Follow up with the finance department on the status of the new software purchase order.

5. Main Discussion Topics:
Provide a more detailed summary broken down by the main topics or projects discussed. Under each topic heading, use bullet points to summarize the key points, ideas, and context.

Project/Topic 1: [Name of Project/Topic]

[Key point on status or update]

[Blocker or challenge identified]

[Next steps discussed]

Project/Topic 2: [Name of Project/Topic]

[Key point or detail]

[Another key point or detail]

6. Overall Sentiment:
Briefly describe the overall tone or sentiment of the meeting (e.g., productive and collaborative, urgent, positive, concerned, etc.).

Now, please analyze the following transcript:`;
}

/**
 * Generate meeting notes using Gemini API
 */
function generateMeetingNotes(transcriptContent, meetingPrompt) {
  const payload = {
    contents: [{
      parts: [{
        text: `${meetingPrompt}\n\n${transcriptContent}`
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      topK: 1,
      topP: 1,
      maxOutputTokens: 4000
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload)
  };
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
    const response = UrlFetchApp.fetch(url, options);
    const responseData = JSON.parse(response.getContentText());
    
    if (responseData.candidates && responseData.candidates.length > 0 && 
        responseData.candidates[0].content && responseData.candidates[0].content.parts) {
      return responseData.candidates[0].content.parts[0].text;
    } else {
      throw new Error('No response from Gemini API');
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

/**
 * Add meeting notes to the person's Google Doc
 */
function addNotesToDoc(docId, meetingNotes, originalFilename) {
  try {
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    
    // Extract meeting date from filename (YYYY-MM-DD format)
    const meetingDate = extractMeetingDate(originalFilename);
    const formattedMeetingDate = formatMeetingDate(meetingDate);
    
    // Get all existing content and store it
    const existingContent = body.getText();
    
    // Clear the document
    body.clear();
    
    // Add the new meeting notes with proper formatting
    addFormattedMeetingNotes(body, formattedMeetingDate, originalFilename, meetingNotes);
    
    // Add delimiter and existing content if any
    if (existingContent.trim()) {
      // Add delimiter
      const delimiter = body.appendParagraph('═'.repeat(80));
      delimiter.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      
      // Add existing content back
      body.appendParagraph('');
      body.appendParagraph(existingContent);
    }
    
    // Save the document
    doc.saveAndClose();
    
    console.log(`Added notes to document: ${docId}`);
  } catch (error) {
    console.error(`Error adding notes to document ${docId}:`, error);
    throw error;
  }
}

/**
 * Add properly formatted meeting notes to the document body
 */
function addFormattedMeetingNotes(body, meetingDate, filename, meetingNotes) {
  // Add title
  const title = body.appendParagraph(`${meetingDate} Meeting Notes`);
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  
  // Add metadata
  body.appendParagraph('');
  const source = body.appendParagraph(`Source: ${filename}`);
  source.editAsText().setBold(0, 6, true);
  
  const generated = body.appendParagraph(`Generated: ${new Date().toLocaleString()}`);
  generated.editAsText().setBold(0, 9, true);
  
  body.appendParagraph('');
  
  // Parse and format the AI-generated content
  formatAIContent(body, meetingNotes);
}

/**
 * Parse and format AI-generated meeting notes content
 */
function formatAIContent(body, content) {
  try {
    const lines = content.split('\n');
    let currentSection = '';
    let inTable = false;
    let tableData = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        if (!inTable) {
          try {
            body.appendParagraph('');
          } catch (e) {
            console.log('Skipping empty paragraph');
          }
        }
        continue;
      }
    
    // Handle headers (##, **text:**)
    if (line.match(/^##\s+(.+)/) || line.match(/^\*\*(.+):\*\*$/)) {
      if (inTable) {
        addTableToDoc(body, tableData);
        inTable = false;
        tableData = [];
      }
      
      const headerText = line.replace(/^##\s+/, '').replace(/^\*\*(.+):\*\*$/, '$1').replace(/\*\*/g, '');
      const header = body.appendParagraph(headerText);
      header.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      currentSection = headerText.toLowerCase();
      continue;
    }
    
    // Handle table headers (| Header | Header |)
    if (line.includes('|') && line.split('|').length > 2) {
      if (line.includes('---')) continue; // Skip table separator line
      
      const columns = line.split('|').map(col => col.trim()).filter(col => col);
      
      if (columns[0] === 'Owner' || tableData.length === 0) {
        if (!inTable) {
          inTable = true;
          tableData = [];
        }
      }
      
      if (inTable) {
        tableData.push(columns);
        continue;
      }
    }
    
    // End table if we're in one and hit non-table content
    if (inTable && !line.includes('|')) {
      addTableToDoc(body, tableData);
      inTable = false;
      tableData = [];
    }
    
    // Handle bullet points
    if (line.startsWith('*') || line.startsWith('-')) {
      const bulletText = line.replace(/^[\*\-]\s*/, '');
      const listItem = body.appendListItem(bulletText);
      listItem.setGlyphType(DocumentApp.GlyphType.BULLET);
      
      // Handle bold formatting in bullet text
      const text = listItem.editAsText();
      formatBoldText(text, bulletText);
      continue;
    }
    
    // Handle project/topic headers
    if (line.match(/^Project\/Topic \d+:/)) {
      const projectHeader = body.appendParagraph(line);
      projectHeader.setHeading(DocumentApp.ParagraphHeading.HEADING3);
      continue;
    }
    
    // Regular paragraph
    if (!inTable) {
      try {
        const para = body.appendParagraph(line);
        
        // Make text bold if it contains **text**
        const text = para.editAsText();
        formatBoldText(text, line);
      } catch (error) {
        console.log(`Error formatting paragraph: ${line}`);
        // Simple fallback
        body.appendParagraph(line.replace(/\*\*/g, ''));
      }
    }
  }
  
      // Handle any remaining table
    if (inTable && tableData.length > 0) {
      addTableToDoc(body, tableData);
    }
  } catch (error) {
    console.error('Error formatting AI content:', error);
    // Fallback: add content as plain text
    body.appendParagraph('Meeting Notes Content:').setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(content);
  }
}

/**
 * Format bold text by replacing **text** with actual bold formatting
 */
function formatBoldText(textElement, originalText) {
  try {
    // Find all **text** patterns and replace them with bold formatting
    const boldPattern = /\*\*(.+?)\*\*/g;
    let currentText = originalText;
    let matches = [];
    let match;
    
    // Collect all matches first
    while ((match = boldPattern.exec(originalText)) !== null) {
      matches.push({
        fullMatch: match[0],
        boldText: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    // Process matches in reverse order to maintain correct indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const matchInfo = matches[i];
      const adjustedStart = matchInfo.start;
      const adjustedEnd = matchInfo.start + matchInfo.boldText.length;
      
      // Replace the **text** with just text
      textElement.deleteText(adjustedStart, matchInfo.end - 1);
      textElement.insertText(adjustedStart, matchInfo.boldText);
      
      // Make the text bold
      textElement.setBold(adjustedStart, adjustedEnd - 1, true);
    }
  } catch (error) {
    console.log('Error formatting bold text:', error);
  }
}

/**
 * Add a table to the document
 */
function addTableToDoc(body, tableData) {
  if (tableData.length === 0) return;
  
  try {
    const table = body.appendTable(tableData);
    
    // Style the header row
    if (tableData.length > 0) {
      const headerRow = table.getRow(0);
      for (let j = 0; j < headerRow.getNumCells(); j++) {
        const cell = headerRow.getCell(j);
        cell.editAsText().setBold(true);
        cell.setBackgroundColor('#f0f0f0');
      }
    }
    
    // Add some spacing after table
    body.appendParagraph('');
  } catch (error) {
    console.error('Error creating table:', error);
    // Fallback: add table data as formatted text
    body.appendParagraph('Action Items:').setHeading(DocumentApp.ParagraphHeading.HEADING3);
    tableData.forEach((row, index) => {
      if (index === 0) {
        // Header row
        const headerText = row.join(' | ');
        const headerPara = body.appendParagraph(headerText);
        headerPara.editAsText().setBold(true);
      } else {
        // Data rows
        const rowText = row.join(' | ');
        body.appendParagraph(rowText);
      }
    });
    body.appendParagraph('');
  }
}

/**
 * Extract meeting date from filename
 */
function extractMeetingDate(filename) {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: match[1],
      month: match[2],
      day: match[3]
    };
  }
  return null;
}

/**
 * Format meeting date for display
 */
function formatMeetingDate(dateObj) {
  if (!dateObj) {
    return new Date().toLocaleDateString();
  }
  
  const date = new Date(dateObj.year, dateObj.month - 1, dateObj.day);
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Check if file has already been processed
 */
function isFileProcessed(fileId) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.TRACKING_SHEET_ID);
    const dataSheet = sheet.getActiveSheet();
    
    // Get all data from column A (file IDs)
    const data = dataSheet.getRange('A:A').getValues();
    
    // Check if fileId exists in the sheet
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === fileId) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if file is processed:', error);
    return false;
  }
}

/**
 * Mark file as processed by adding to tracking sheet
 */
function markFileAsProcessed(fileId, filename) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.TRACKING_SHEET_ID);
    const dataSheet = sheet.getActiveSheet();
    
    // Get the next empty row
    const lastRow = dataSheet.getLastRow();
    const nextRow = lastRow + 1;
    
    // Add file ID, processing timestamp, and filename
    const timestamp = new Date();
    dataSheet.getRange(nextRow, 1).setValue(fileId);
    dataSheet.getRange(nextRow, 2).setValue(timestamp);
    dataSheet.getRange(nextRow, 3).setValue(filename);
    
    console.log(`Logged to tracking sheet: ${filename} at ${timestamp}`);
  } catch (error) {
    console.error('Error marking file as processed:', error);
  }
}

/**
 * Setup function - run this once to configure the script
 */
function setupScript() {
  // This function helps you set up the necessary properties
  console.log('Setting up script...');
  console.log('Please set the following script properties:');
  console.log('1. GEMINI_API_KEY - Your Google Gemini API key');
  console.log('2. Update CONFIG.PERSON_DOC_MAPPING with actual Google Doc IDs');
  console.log('3. Update CONFIG.TRACKING_SHEET_ID with your Google Sheet ID');
  console.log('4. Optionally set up triggers for automatic processing');
}

/**
 * Get the last processing time from script properties
 */
function getLastProcessingTime() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const lastProcessTime = properties.getProperty('LAST_PROCESS_TIME');
    
    if (lastProcessTime) {
      return new Date(lastProcessTime);
    } else {
      // First run - look for files from 1 hour ago to catch recent ones
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      return oneHourAgo;
    }
  } catch (error) {
    console.error('Error getting last processing time:', error);
    // Fallback to 1 hour ago
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    return oneHourAgo;
  }
}

/**
 * Update the last processing time to now
 */
function updateLastProcessingTime() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const now = new Date();
    properties.setProperty('LAST_PROCESS_TIME', now.toISOString());
    console.log(`Updated last processing time to: ${now}`);
  } catch (error) {
    console.error('Error updating last processing time:', error);
  }
}

/**
 * Filter files to only include those created after the last processing time
 */
function filterNewFiles(files, lastProcessTime) {
  return files.filter(file => {
    try {
      const fileCreatedTime = file.getDateCreated();
      const isNewer = fileCreatedTime > lastProcessTime;
      
      if (isNewer) {
        console.log(`New file found: ${file.getName()} (created: ${fileCreatedTime})`);
      }
      
      return isNewer;
    } catch (error) {
      console.error(`Error checking file date for ${file.getName()}:`, error);
      return true; // Process it if we can't check the date
    }
  });
}

/**
 * Reset the last processing time (useful for testing or reprocessing)
 */
function resetLastProcessingTime() {
  try {
    const properties = PropertiesService.getScriptProperties();
    properties.deleteProperty('LAST_PROCESS_TIME');
    console.log('Last processing time reset. Next run will process all files from 1 hour ago.');
  } catch (error) {
    console.error('Error resetting last processing time:', error);
  }
}

/**
 * Initialize the tracking sheet with headers
 */
function initializeTrackingSheet() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.TRACKING_SHEET_ID);
    const dataSheet = sheet.getActiveSheet();
    
    // Check if headers already exist
    const firstRow = dataSheet.getRange(1, 1, 1, 3).getValues()[0];
    if (firstRow[0] !== 'File ID') {
      // Add headers
      dataSheet.getRange(1, 1).setValue('File ID');
      dataSheet.getRange(1, 2).setValue('Processed Date');
      dataSheet.getRange(1, 3).setValue('Filename');
      
      // Format headers
      const headerRange = dataSheet.getRange(1, 1, 1, 3);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
      
      // Auto-resize columns
      dataSheet.autoResizeColumns(1, 3);
      
      console.log('Tracking sheet initialized with headers');
    } else {
      console.log('Tracking sheet already has headers');
    }
  } catch (error) {
    console.error('Error initializing tracking sheet:', error);
    console.log('Make sure CONFIG.TRACKING_SHEET_ID is set to a valid Google Sheet ID');
  }
}

/**
 * Test function to process a single file (for testing)
 */
function testProcessSingleFile() {
  const fileId = 'your_test_file_id_here'; // Replace with actual file ID for testing
  try {
    const file = DriveApp.getFileById(fileId);
    processTranscriptFile(file);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

/**
 * Create a time-based trigger to run automatically
 */
function createTrigger() {
  // Run every hour
  ScriptApp.newTrigger('processNewTranscripts')
    .timeBased()
    .everyHours(1)
    .create();
    
  console.log('Trigger created - will run every hour');
}

/**
 * Debug function to see what files are found
 */
function debugFindFiles() {
  try {
    console.log(`Looking in folder ID: ${CONFIG.TRANSCRIPT_FOLDER_ID}`);
    const transcriptFolder = DriveApp.getFolderById(CONFIG.TRANSCRIPT_FOLDER_ID);
    console.log(`Folder name: ${transcriptFolder.getName()}`);
    
    const allFiles = findAllFiles(transcriptFolder);
    console.log(`Total files found: ${allFiles.length}`);
    
    allFiles.forEach(file => {
      const isTranscript = isTranscriptFile(file.getName());
      console.log(`File: ${file.getName()} - Is transcript: ${isTranscript}`);
    });
    
    const transcriptFiles = findTranscriptFiles(transcriptFolder);
    console.log(`Transcript files found: ${transcriptFiles.length}`);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

/**
 * Helper function to find all files (for debugging)
 */
function findAllFiles(folder) {
  const allFiles = [];
  
  // Process files in current folder
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    allFiles.push(file);
  }
  
  // Process subfolders recursively
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const subfolder = subfolders.next();
    allFiles.push(...findAllFiles(subfolder));
  }
  
  return allFiles;
} 