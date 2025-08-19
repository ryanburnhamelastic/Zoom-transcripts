# Team Meeting Transcript Processor Setup Guide

This guide will walk you through setting up the Team Meeting Transcript Processor to automatically convert your team meeting transcripts into structured notes.

## Overview

This system processes team meeting transcripts from Google Drive and generates comprehensive meeting notes in a shared Google Doc using Google Gemini AI. It's designed for:

- Team standups and check-ins
- Sprint planning sessions
- Retrospectives
- Cross-functional collaboration meetings
- Project status meetings

## Prerequisites

- Google account with access to Google Drive, Docs, and Sheets
- Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Team meeting transcripts in supported format (.transcript or .transcript.vtt)

## Step 1: Create Required Google Documents

### 1.1 Create Team Meeting Notes Document
1. Go to [Google Docs](https://docs.google.com)
2. Create a new document titled "Team Meeting Notes" (or your preferred name)
3. Keep this document open - you'll need its ID

### 1.2 Create Tracking Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet titled "Team Meeting Transcript Tracking"
3. Keep this spreadsheet open - you'll need its ID

### 1.3 Organize Your Transcript Folder
1. In Google Drive, create or identify the folder containing your team meeting transcripts
2. The system will recursively search this folder and all subfolders
3. Note the folder ID from the URL

## Step 2: Get Required IDs

### 2.1 Get Document IDs
For each Google Doc/Sheet you created:
1. Look at the URL: `https://docs.google.com/document/d/DOCUMENT_ID/edit`
2. Copy the `DOCUMENT_ID` part (the long string between `/d/` and `/edit`)
3. Save these IDs - you'll need them for configuration

### 2.2 Get Folder ID
1. Navigate to your transcript folder in Google Drive
2. Look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID`
3. Copy the `FOLDER_ID` part
4. Save this ID for configuration

## Step 3: Set Up Google Apps Script

### 3.1 Create the Script Project
1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Delete the default code
4. Copy and paste the entire contents of `Code.gs` from this repository
5. Save the project with name "Team Meeting Transcript Processor"

### 3.2 Configure Script Properties
1. In the Apps Script editor, click the **Settings** (gear) icon
2. Scroll down to **"Script Properties"**
3. Click **"Add script property"**
4. Add your Gemini API key:
   - **Property**: `GEMINI_API_KEY`
   - **Value**: Your actual API key from Google AI Studio

### 3.3 Update Configuration
In the Code.gs file, update the CONFIG object:

```javascript
const CONFIG = {
  // Replace with your Google Drive folder ID containing transcripts
  TRANSCRIPT_FOLDER_ID: 'your_folder_id_here',
  
  // API configuration (leave as-is)
  GEMINI_API_KEY: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  GEMINI_MODEL: 'gemini-1.5-pro',
  
  // Replace with your team meeting document ID
  TEAM_MEETING_DOC_ID: 'your_team_meeting_doc_id_here',
  
  // Replace with your tracking spreadsheet ID
  TRACKING_SHEET_ID: 'your_tracking_sheet_id_here'
};
```

## Step 4: Grant Permissions and Test

### 4.1 Initialize the System
1. In the Apps Script editor, select `initializeTrackingSheet` from the function dropdown
2. Click **Run**
3. When prompted, grant all requested permissions:
   - Google Drive access (to read transcripts and write to docs)
   - Google Sheets access (to track processed files)
   - External service access (to call Gemini API)

### 4.2 Test the Setup
1. Select `setupScript` from the function dropdown and run it
2. Check the logs (View → Logs) to verify configuration
3. If you have a test transcript file, get its file ID and run `testProcessSingleFile()`

## Step 5: Process Your First Transcripts

### 5.1 Prepare Transcript Files
Ensure your transcript files follow the naming pattern:
```
YYYY-MM-DD-HHMMSS Description.transcript[.vtt]
```

Examples:
- `2025-08-15-135616 Strat CA Team Time.transcript.vtt`
- `2025-01-15-143022 Weekly Team Standup.transcript.vtt`
- `2025-02-03-100000 Sprint Planning Session.transcript`

### 5.2 Run Initial Processing
1. Select `processNewTranscripts` from the function dropdown
2. Click **Run**
3. Check the execution logs to see what files were processed
4. Verify that notes appear in your team meeting document
5. Check that processed files are logged in your tracking spreadsheet

## Step 6: Set Up Automatic Processing (Optional)

### 6.1 Create Time-Based Trigger
1. In the Apps Script editor, click the **Triggers** (clock) icon
2. Click **"Add Trigger"**
3. Configure:
   - **Function**: `processNewTranscripts`
   - **Event source**: Time-driven
   - **Type**: Hours timer
   - **Every**: 1 hour (or your preference)

### 6.2 Alternative: Use Built-in Function
Run the `createTrigger()` function to automatically set up an hourly trigger.

## Step 7: Verify Everything Works

### 7.1 Check Generated Notes
Your team meeting document should now contain:
- Meeting overview with attendees and purpose
- Key decisions and agreements
- Project status updates
- Action items with owners and deadlines
- Cross-team dependencies
- Risks and concerns
- Follow-up items
- Team announcements
- Meeting mood assessment

### 7.2 Check Tracking
Your tracking spreadsheet should show:
- File ID of processed transcripts
- Processing timestamp
- Original filename

## Troubleshooting

### Common Issues

**Files not being processed:**
- Verify transcript files match the naming pattern
- Check that TRANSCRIPT_FOLDER_ID is correct
- Run `debugFindFiles()` to see what files are found

**Permission errors:**
- Ensure all requested permissions were granted
- Verify document IDs are correct and accessible
- Check that the service account has access to your files

**API errors:**
- Verify your Gemini API key is valid and active
- Check your Google AI Studio account has sufficient credits
- Ensure the API key is correctly set in Script Properties

### Debug Functions

Use these functions for troubleshooting:
- `debugFindFiles()` - See what transcript files are found
- `resetLastProcessingTime()` - Reprocess files from the last hour
- `setupScript()` - Verify configuration

## Customization

### Modify the Meeting Prompt
Edit the `getTeamMeetingPrompt()` function to customize:
- Meeting note structure
- Level of detail
- Specific focus areas for your team

### Adjust AI Settings
In the `generateMeetingNotes()` function, modify:
- `temperature`: 0.1-1.0 (lower = more consistent)
- `maxOutputTokens`: Response length limit
- `GEMINI_MODEL`: Use 'gemini-1.5-flash' for faster/cheaper processing

### Change Processing Frequency
Modify trigger timing or run manually as needed for your team's meeting schedule.

## Best Practices

1. **Consistent naming**: Use consistent transcript file naming for better parsing
2. **Regular processing**: Set up automatic triggers for timely note generation
3. **Review and edit**: AI-generated notes may need human review and editing
4. **Archive old notes**: Periodically move older notes to archive documents
5. **Team access**: Ensure all team members have access to the shared meeting notes document

## Support and Maintenance

- Monitor the tracking spreadsheet to ensure files are being processed
- Check execution logs periodically for any errors
- Update the Gemini API key if it expires
- Adjust the prompt as your team's needs evolve 