# Zoom Transcript Processor

A Google Apps Script that automatically processes Zoom transcript files into structured meeting notes using Google Gemini AI.

## Features

- 🔍 **Automatic Discovery**: Recursively scans your Google Drive folder for transcript files (.transcript and .transcript.vtt)
- 🤖 **AI-Powered**: Uses Google Gemini to generate structured meeting notes with manager-focused prompts
- 📝 **Smart Parsing**: Extracts attendee names from transcript filenames and meeting dates
- 📚 **Professional Formatting**: Creates properly formatted Google Docs with real headings, bullets, and tables
- 🕒 **Smart Processing**: Only processes NEW files since last run - perfect for multiple daily runs
- 📊 **Visible Tracking**: Logs all processed files to a Google Sheet with timestamps
- 🔄 **Duplicate Prevention**: Tracks processed files to avoid reprocessing
- ⏰ **Automated**: Can run on a schedule using Google Apps Script triggers

## File Structure

```
Zoom-transcripts/
├── Code.gs              # Main Google Apps Script code
├── Meeting prompt.txt   # Meeting notes template/prompt
└── README.md           # This file
```

## Setup Instructions

### 1. Create a Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Replace the default code with the contents of `Code.gs`
4. Save the project with a meaningful name (e.g., "Zoom Transcript Processor")

### 2. Configure the Script

#### Set Gemini API Key
1. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. In the Apps Script editor, go to **Project Settings** (gear icon)
3. Scroll down to **Script Properties**
4. Click **Add script property**
5. Set:
   - Property: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key_here`

#### Set Up Tracking Sheet
1. Create a new Google Sheet for tracking processed files
2. Get the Sheet ID from the URL (the long string after `/spreadsheets/d/`)
3. Update `TRACKING_SHEET_ID` in the `CONFIG` object
4. Run `initializeTrackingSheet()` to set up headers

#### Update Person-to-Doc Mapping
1. Create a Google Doc for each person you have 1:1s with
2. Get the Document ID from each doc's URL (the long string after `/d/`)
3. Update the `PERSON_DOC_MAPPING` in the `CONFIG` object:

```javascript
PERSON_DOC_MAPPING: {
  'Rajesh': '1ABC123...XYZ',  // Replace with actual doc ID
  'John': '1DEF456...ABC',    // Replace with actual doc ID
  'Sarah': '1GHI789...DEF'    // Add more people as needed
}
```

### 3. Set Permissions

The first time you run the script, Google will ask for permissions:
- **Google Drive**: To read transcript files and write to docs
- **Google Sheets**: To track processed files in your tracking sheet
- **External Services**: To call the Gemini API

### 4. Test the Setup

1. Run the `setupScript()` function to verify configuration
2. Run `initializeTrackingSheet()` to set up your tracking sheet headers
3. Use `testProcessSingleFile()` with a specific file ID to test processing
4. Run `processNewTranscripts()` to process new files

## Usage

### Manual Processing
```javascript
processNewTranscripts()  // Process only NEW transcript files since last run
```

### Management Functions
```javascript
initializeTrackingSheet()  // Set up tracking sheet headers (run once)
resetLastProcessingTime()  // Reset to reprocess all files from last hour
debugFindFiles()          // See what files are found (debugging)
```

### Automatic Processing
Set up a trigger to run automatically:
```javascript
createTrigger()  // Creates an hourly trigger
```

Or manually create triggers in the Apps Script editor:
1. Go to **Triggers** (clock icon)
2. Click **Add Trigger**
3. Choose:
   - Function: `processNewTranscripts`
   - Event source: Time-driven
   - Type: Hours timer
   - Every: 1 hour (or your preference)

### Multiple Daily Runs
The script is optimized for frequent runs:
- **First run**: Processes files from last hour
- **Subsequent runs**: Only processes files created since last run
- **Perfect for**: Multiple daily runs without reprocessing

## Transcript File Requirements

The script looks for files with this naming pattern:
```
YYYY-MM-DD-HHMMSS PersonName | Ryan - Description.transcript[.vtt]
```

Examples:
- `2025-05-02-185916 Rajesh | Ryan - Weekly 1:1.transcript.vtt`
- `2025-01-15-143022 John | Ryan - Project Review.transcript`

Both `.transcript` and `.transcript.vtt` extensions are supported.

## Generated Meeting Notes Structure

The AI generates professionally formatted notes with:

### Document Structure
- **Meeting Date as Title**: "Friday, August 8, 2025 Meeting Notes"
- **Source Information**: Original filename and generation timestamp
- **Professional Formatting**: Real headings, bullet points, and tables

### Content Sections
1. **Executive Summary**: High-level overview of the meeting
2. **Key Decisions Made**: Bulleted list of decisions with rationale
3. **Action Items**: Professional table with Owner, Task, and Deadline columns
4. **Open Questions & Follow-ups**: Unresolved items requiring follow-up
5. **Main Discussion Topics**: Detailed breakdown by project/topic
6. **Overall Sentiment**: Tone and mood assessment

### Document Organization
- **Latest notes at top**: New meetings appear at the beginning
- **Clear separation**: Visual delimiter between different meetings
- **Manager-focused content**: Emphasizes team responsibilities and project tracking

## Configuration Options

### Change AI Model
```javascript
GEMINI_MODEL: 'gemini-1.5-pro'  // or 'gemini-1.5-flash' for faster responses
```

### Adjust AI Parameters
```javascript
maxOutputTokens: 4000, // Response length
temperature: 0.3       // Creativity (0-1, lower = more consistent)
topK: 1               // Top-K sampling
topP: 1               // Top-P sampling
```

### Custom Meeting Prompt
Modify the `getMeetingPrompt()` function to customize the AI instructions.

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Ensure the script has proper Google Drive permissions
   - Check that document IDs are correct and accessible

2. **"API key invalid" errors**
   - Verify Gemini API key is set correctly in Script Properties
   - Check that your Google AI Studio account is active

3. **Files not being processed**
   - Verify transcript files match the naming pattern (both .transcript and .transcript.vtt supported)
   - Check that person names match the mapping exactly
   - Run `debugFindFiles()` to see what files are found
   - Use `resetLastProcessingTime()` if you want to reprocess recent files

### Debugging

Enable detailed logging:
```javascript
console.log('Debug info here');
```

View logs in the Apps Script editor under **Executions**.

## Security Notes

- The Gemini API key is stored securely in Google's Script Properties
- Transcript content is sent to Google's Gemini API for processing
- Data stays within Google's ecosystem for better security
- Processed files are tracked in your Google Sheet with timestamps
- All processing history is visible and auditable

## Cost Considerations

- Gemini API pricing is generally more affordable than OpenAI
- Gemini 1.5 Pro provides excellent results with competitive pricing
- Gemini 1.5 Flash is faster and cheaper for simpler tasks
- Check current pricing at [Google AI Pricing](https://ai.google.dev/pricing)

## Future Enhancements

Potential improvements:
- Support for other AI providers (Claude, OpenAI)
- Custom templates per person or meeting type
- Integration with calendar systems
- Email notifications when notes are generated
- Batch processing optimizations
- Multiple model support (Pro vs Flash based on transcript length) 