/**
 * Team Meeting Transcript Processor
 * Processes team meeting transcripts into structured meeting notes using Google Gemini AI
 */

// Configuration
const CONFIG = {
  // The main folder ID containing all team meeting transcripts
  TRANSCRIPT_FOLDER_ID: 'folder_id',
  
  // Gemini API configuration
  GEMINI_API_KEY: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  GEMINI_MODEL: 'gemini-1.5-pro',
  
  // Single shared Google Doc for all team meeting notes
  TEAM_MEETING_DOC_ID: 'your_team_meeting_doc_id_here',
  
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
  // Pattern: YYYY-MM-DD-HHMMSS Description.transcript.vtt or .transcript
  const transcriptPattern = /^\d{4}-\d{2}-\d{2}-\d{6}.*\.transcript(\.vtt)?$/;
  return transcriptPattern.test(filename);
}

/**
 * Process a single transcript file
 */
function processTranscriptFile(file) {
  console.log(`Processing: ${file.getName()}`);
  
  // Read transcript content
  const transcriptContent = file.getBlob().getDataAsString();
  
  // Get team meeting prompt
  const meetingPrompt = getTeamMeetingPrompt();
  
  // Generate meeting notes using AI
  const meetingNotes = generateMeetingNotes(transcriptContent, meetingPrompt);
  
  // Add notes to the shared team meeting document
  addNotesToDoc(CONFIG.TEAM_MEETING_DOC_ID, meetingNotes, file.getName());
  
  console.log(`Successfully processed: ${file.getName()}`);
}

/**
 * Extract meeting title from filename for team meetings
 */
function extractMeetingTitle(filename) {
  // Pattern: YYYY-MM-DD-HHMMSS Description.transcript.vtt or .transcript
  const match = filename.match(/^\d{4}-\d{2}-\d{2}-\d{6}\s+(.+)\.transcript(\.vtt)?$/);
  return match ? match[1].trim() : 'Team Meeting';
}

/**
 * Get the team meeting prompt template
 */
function getTeamMeetingPrompt() {
  return `Role: You are an expert team meeting facilitator and note-taker. Your task is to analyze the following team meeting transcript and create comprehensive meeting notes that capture team decisions, project updates, cross-functional collaboration, and action items. The output should serve as a shared record for all team members and stakeholders.

Format the output using Markdown for clarity.

Here is the structure I want you to follow:

1. Meeting Overview:
Provide a 2-3 sentence summary of the meeting including the main purpose, key attendees mentioned, and primary outcomes. Include the meeting type (standup, retrospective, planning, status update, etc.) if identifiable.

2. Key Decisions & Agreements:
List all decisions made during the meeting in bullet format. For each decision, include the rationale and any voting/consensus process mentioned.

Example: 
• Decided to move Project Alpha launch from Q3 to Q4 due to integration dependencies with Platform team
• Agreed to implement new testing protocol after three team members raised quality concerns

3. Project Status Updates:
Create a section for each major project or initiative discussed. Use the following format:

**Project Name**: [Status: On Track/At Risk/Blocked/Complete]
• Current progress and milestones achieved
• Blockers or challenges identified
• Dependencies on other teams or external factors
• Next steps and upcoming milestones

4. Action Items & Responsibilities:
Present all action items in a table format with Owner, Task, Deadline, and Priority columns.

| Owner | Task | Deadline | Priority |
|-------|------|----------|----------|
| [Name] | [Specific task description] | [Date] | [High/Medium/Low] |
| [Name] | [Specific task description] | [Date] | [High/Medium/Low] |

5. Cross-Team Dependencies & Coordination:
List any dependencies on other teams, external stakeholders, or shared resources that were discussed.

Example:
• Waiting on API specifications from Platform team before UI development can proceed
• Need approval from Security team for new authentication flow
• Coordinating with Marketing team on launch timeline

6. Risks & Concerns Raised:
Document any risks, concerns, or potential issues that were brought up during the meeting.

Example:
• Timeline concerns for Q4 deliverables due to resource constraints
• Technical debt in legacy system may impact new feature development
• Team capacity issues with upcoming holidays

7. Follow-up Items & Next Steps:
List items that require follow-up in future meetings or offline discussions.

Example:
• Schedule architecture review session with Platform team
• Follow up on budget approval status for additional contractor
• Clarify requirements with Product team before next sprint

8. Team Announcements & Updates:
Capture any announcements, team updates, personnel changes, or general information shared.

9. Next Meeting Planning:
If discussed, note the next meeting date, agenda items to cover, or preparation required.

10. Overall Team Mood & Dynamics:
Briefly assess the team's energy, collaboration quality, and any dynamics observed (e.g., engaged and collaborative, some tension around deadlines, positive energy about new project, etc.).

Now, please analyze the following team meeting transcript:`;
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
  console.log('Setting up Team Meeting Transcript Processor...');
  console.log('Please set the following script properties:');
  console.log('1. GEMINI_API_KEY - Your Google Gemini API key');
  console.log('2. Update CONFIG.TEAM_MEETING_DOC_ID with your shared team meeting document ID');
  console.log('3. Update CONFIG.TRACKING_SHEET_ID with your Google Sheet ID');
  console.log('4. Update CONFIG.TRANSCRIPT_FOLDER_ID with your Google Drive folder ID');
  console.log('5. Optionally set up triggers for automatic processing');
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