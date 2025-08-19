# Team Meeting Transcript Processor

A Google Apps Script that automatically processes team meeting transcript files into structured meeting notes using Google Gemini AI. Designed for team meetings, standups, retrospectives, and cross-functional collaboration sessions.

## Features

- 🔍 **Automatic Discovery**: Recursively scans your Google Drive folder for team meeting transcript files (.transcript and .transcript.vtt)
- 🤖 **AI-Powered**: Uses Google Gemini to generate structured team meeting notes with team-focused prompts
- 📝 **Smart Parsing**: Extracts meeting information from transcript filenames and dates
- 📚 **Professional Formatting**: Creates properly formatted Google Docs with real headings, bullets, tables, and project status updates
- 🕒 **Smart Processing**: Only processes NEW files since last run - perfect for multiple daily runs
- 📊 **Visible Tracking**: Logs all processed files to a Google Sheet with timestamps
- 🔄 **Duplicate Prevention**: Tracks processed files to avoid reprocessing
- ⏰ **Automated**: Can run on a schedule using Google Apps Script triggers
- 👥 **Team-Focused**: Single shared document for all team meeting notes with team-specific content structure

## File Structure

```
zoom-transcripts-team-meetings/
├── Code.gs                  # Main Google Apps Script code
├── Meeting prompt.txt       # Team meeting notes template/prompt
└── README.md               # This file
```

## Setup Instructions

### 1. Create a Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Replace the default code with the contents of `Code.gs`
4. Save the project with a meaningful name (e.g., "Team Meeting Transcript Processor")

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

#### Set Up Team Meeting Document
1. Create a single Google Doc that will contain all team meeting notes
2. Get the Document ID from the doc's URL (the long string after `/d/`)
3. Update `TEAM_MEETING_DOC_ID` in the `CONFIG` object
4. Update `TRANSCRIPT_FOLDER_ID` with your Google Drive folder containing transcripts

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
YYYY-MM-DD-HHMMSS Description.transcript[.vtt]
```

Examples:
- `2025-08-15-135616 Strat CA Team Time.transcript.vtt`
- `2025-01-15-143022 Weekly Team Standup.transcript.vtt`
- `2025-02-03-100000 Sprint Planning Session.transcript`
- `2025-01-20-140000 Retrospective - Q1 Projects.transcript`

Both `.transcript` and `.transcript.vtt` extensions are supported.

## Generated Meeting Notes Structure

The AI generates professionally formatted team meeting notes with:

### Document Structure
- **Meeting Date as Title**: "Friday, January 15, 2025 Team Meeting Notes"
- **Source Information**: Original filename and generation timestamp
- **Professional Formatting**: Real headings, bullet points, and tables

### Content Sections
1. **Meeting Overview**: High-level summary including meeting type and key attendees
2. **Key Decisions & Agreements**: All decisions made with rationale
3. **Project Status Updates**: Status of each project/initiative discussed
4. **Action Items & Responsibilities**: Table with Owner, Task, Deadline, and Priority
5. **Cross-Team Dependencies**: Dependencies on other teams and external stakeholders
6. **Risks & Concerns Raised**: Potential issues and challenges identified
7. **Follow-up Items & Next Steps**: Items requiring future discussion
8. **Team Announcements & Updates**: Personnel changes, announcements, general updates
9. **Next Meeting Planning**: Future meeting planning if discussed
10. **Overall Team Mood & Dynamics**: Assessment of team energy and collaboration

### Document Organization
- **Latest notes at top**: New meetings appear at the beginning
- **Clear separation**: Visual delimiter between different meetings
- **Team-focused content**: Emphasizes cross-functional collaboration and project coordination

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
Modify the `getTeamMeetingPrompt()` function to customize the AI instructions.

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Ensure the script has proper Google Drive permissions
   - Check that document ID is correct and accessible

2. **"API key invalid" errors**
   - Verify Gemini API key is set correctly in Script Properties
   - Check that your Google AI Studio account is active

3. **Files not being processed**
   - Verify transcript files match the naming pattern (both .transcript and .transcript.vtt supported)
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
- Custom templates per meeting type (standup, retrospective, planning)
- Integration with calendar systems for automatic meeting detection
- Email notifications when notes are generated
- Batch processing optimizations
- Multiple model support (Pro vs Flash based on transcript length)
- Integration with project management tools (Jira, Asana, etc.) 