# Quick Setup Guide

Follow these steps to get your Zoom transcript processor running in 15 minutes.

## Prerequisites

- Google account with Drive access
- Google AI Studio account (free tier available)
- Zoom transcripts saved to your Google Drive

## Step 1: Get Your Google Drive Folder ID

1. Open your transcript folder: https://drive.google.com/drive/folders/1KFvT3C0ONlIBX1bv0V7JLlAlLW_6yRIV
2. The folder ID is already set in the code: `1KFvT3C0ONlIBX1bv0V7JLlAlLW_6yRIV`

## Step 2: Create Google Docs for Each Person

For each person you have 1:1s with:

1. Create a new Google Doc
2. Name it something like "Meeting Notes - [Person Name]"
3. Copy the document ID from the URL (the long string after `/d/`)

Example URL: `https://docs.google.com/document/d/1ABC123XYZ789/edit`
Document ID: `1ABC123XYZ789`

## Step 2.5: Create a Tracking Sheet

1. Create a new Google Sheet for tracking processed files
2. Name it something like "Transcript Processing Log"
3. Copy the Sheet ID from the URL (the long string after `/spreadsheets/d/`)

Example URL: `https://docs.google.com/spreadsheets/d/1DEF456ABC123/edit`
Sheet ID: `1DEF456ABC123`

## Step 3: Set Up the Apps Script

1. Go to https://script.google.com
2. Click **"New Project"**
3. Delete the existing code
4. Copy and paste the entire contents of `Code.gs`
5. Save the project (Ctrl+S or Cmd+S)
6. Name it "Zoom Transcript Processor"

## Step 4: Configure the Script

### Update Person Mapping

Find this section in the code and update it:

```javascript
PERSON_DOC_MAPPING: {
  'Rajesh': 'your_rajesh_doc_id_here',
  'John': 'your_john_doc_id_here',
  'Sarah': 'your_sarah_doc_id_here'
  // Add more people and their corresponding Google Doc IDs
},
```

Replace with your actual people and doc IDs:

```javascript
PERSON_DOC_MAPPING: {
  'Rajesh': '1ABC123XYZ789',
  'Sarah Johnson': '1DEF456ABC123',
  'Mike Chen': '1GHI789DEF456'
},
```

**Important**: The person names must match exactly how they appear in your transcript filenames.

### Update Tracking Sheet ID

Find this line in the code and update it:

```javascript
TRACKING_SHEET_ID: 'your_tracking_sheet_id_here'
```

Replace with your actual Sheet ID:

```javascript
TRACKING_SHEET_ID: '1DEF456ABC123'
```

### Add Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key** and copy it
3. In Apps Script, click the **Settings** gear icon
4. Scroll down to **Script properties**
5. Click **Add script property**
6. Set:
   - Property: `GEMINI_API_KEY`
   - Value: `your-actual-gemini-api-key-here`

## Step 5: Set Permissions

1. Click **Run** next to the `setupScript` function
2. Google will ask for permissions - click **Review permissions**
3. Choose your Google account
4. Click **Advanced** → **Go to Zoom Transcript Processor (unsafe)**
5. Click **Allow**

## Step 6: Test the Setup

### Initialize Your Tracking Sheet

1. Run the `initializeTrackingSheet` function
2. Check that your Google Sheet now has headers: "File ID", "Processed Date", "Filename"

### Test with a Single File

1. Find a transcript file ID in your Drive
2. In the `testProcessSingleFile` function, replace `'your_test_file_id_here'` with the actual file ID
3. Run the `testProcessSingleFile` function
4. Check the execution log for any errors

### Process New Files

1. Run the `processNewTranscripts` function
2. Check the execution logs to see what files were processed
3. Check your Google Docs to see the professionally formatted meeting notes
4. Check your tracking sheet to see the processing log

## Step 7: Set Up Automation (Optional)

To automatically process new transcripts:

1. Run the `createTrigger` function, OR
2. Manually create a trigger:
   - Click the **Triggers** clock icon
   - Click **Add Trigger**
   - Function: `processNewTranscripts`
   - Event source: **Time-driven**
   - Type: **Hours timer**
   - Every: **1 hour**

## Verification Checklist

- [ ] Apps Script project created and code pasted
- [ ] Gemini API key added to Script Properties
- [ ] Tracking sheet created and ID updated in config
- [ ] Person-to-Doc mapping updated with real names and doc IDs
- [ ] Permissions granted to the script (Drive, Docs, Sheets)
- [ ] Tracking sheet initialized with `initializeTrackingSheet()`
- [ ] Test function runs without errors
- [ ] Meeting notes appear in the correct Google Docs with proper formatting
- [ ] Files logged to tracking sheet with timestamps
- [ ] Trigger set up for automatic processing (optional)

## Sample Transcript Filename

Your transcript files should look like this:
```
2025-01-18-143022 Rajesh | Ryan - Weekly 1:1.transcript.vtt
2025-01-18-143022 Rajesh | Ryan - Weekly 1:1.transcript
```

The script extracts "Rajesh" as the person name and looks for a corresponding Google Doc ID in the mapping. Both `.transcript` and `.transcript.vtt` extensions are supported.

## Troubleshooting

### Common Issues

1. **Person not found**: Check that the name in the filename exactly matches the mapping
2. **Permission errors**: Re-run the setup and grant all requested permissions
3. **API errors**: Verify your Gemini API key is correct and active
4. **Doc not updating**: Check that the document ID is correct and accessible

### Getting Help

Check the **Executions** tab in Apps Script to see detailed error logs. Most issues are related to:
- Incorrect document IDs
- Mismatched person names
- Missing or invalid Gemini API keys
- Missing or incorrect tracking sheet ID

## Next Steps

Once everything is working:
- Add more people to the mapping as needed
- Set up hourly triggers for automatic processing
- Use `resetLastProcessingTime()` if you need to reprocess recent files
- Monitor your tracking sheet to see processing history
- Adjust the AI prompt in `getMeetingPrompt()` if desired
- Monitor your Gemini API usage (free tier has generous limits)

## Advanced Usage

### Multiple Daily Runs
The script is designed for frequent execution:
- **First run**: Processes files from the last hour
- **Subsequent runs**: Only processes files created since the last run
- **Perfect for**: Running every hour or multiple times per day

### Useful Functions
- `processNewTranscripts()` - Main function (only processes new files)
- `resetLastProcessingTime()` - Reset to reprocess files from last hour
- `debugFindFiles()` - See what files are found (useful for troubleshooting)
- `initializeTrackingSheet()` - Set up tracking sheet headers (run once) 