# Project Differences: Team Meeting vs 1:1 Transcript Processor

This document outlines the key differences between the original `Zoom-transcripts` project and this `zoom-transcripts-team-meetings` version.

## Core Differences

### 1. Document Strategy
**Original (1:1 Meetings):**
- Multiple Google Docs (one per person)
- Person-specific document mapping
- Organized by individual relationships

**Team Meetings:**
- Single shared Google Doc for all team meetings
- All team meeting notes in one centralized location
- Organized by meeting date/time

### 2. File Naming Patterns
**Original:**
```
YYYY-MM-DD-HHMMSS PersonName | Ryan - Description.transcript[.vtt]
Example: 2025-01-15-143022 Rajesh | Ryan - Weekly 1:1.transcript.vtt
```

**Team Meetings:**
```
YYYY-MM-DD-HHMMSS Description.transcript[.vtt]
Example: 2025-01-15-143022 Weekly Team Standup.transcript.vtt
```

### 3. Configuration Changes
**Original CONFIG:**
```javascript
PERSON_DOC_MAPPING: {
  'John': 'doc_id_1',
  'Sarah': 'doc_id_2'
}
```

**Team Meetings CONFIG:**
```javascript
TEAM_MEETING_DOC_ID: 'single_shared_doc_id'
```

### 4. Meeting Notes Structure
**Original (Manager-Focused):**
- Executive Summary
- Key Decisions Made
- Action Items (3 columns)
- Open Questions & Follow-ups
- Main Discussion Topics
- Overall Sentiment

**Team Meetings (Team-Focused):**
- Meeting Overview (with attendees and meeting type)
- Key Decisions & Agreements
- Project Status Updates
- Action Items & Responsibilities (4 columns with Priority)
- Cross-Team Dependencies & Coordination
- Risks & Concerns Raised
- Follow-up Items & Next Steps
- Team Announcements & Updates
- Next Meeting Planning
- Overall Team Mood & Dynamics

### 5. Processing Logic
**Original:**
- Extracts person name from filename
- Routes to person-specific document
- Skips files without person mapping

**Team Meetings:**
- Processes all transcript files in folder
- Routes all notes to shared team document
- No person-specific filtering

### 6. Use Cases
**Original:**
- 1:1 meetings with direct reports
- Performance reviews
- Career development discussions
- Personal feedback sessions

**Team Meetings:**
- Team standups and check-ins
- Sprint planning sessions
- Retrospectives
- Cross-functional collaboration meetings
- Project status meetings
- All-hands meetings

## Shared Features

Both projects share these core capabilities:
- Recursive folder scanning
- Gemini AI integration
- Professional Google Docs formatting
- Duplicate processing prevention
- Tracking spreadsheet logging
- Automatic scheduling with triggers
- Smart processing (only new files)
- Support for both .transcript and .transcript.vtt files

## Migration Notes

If you want to migrate from the 1:1 version to team meetings:
1. Update the CONFIG object
2. Create a single shared team document
3. Update file naming conventions
4. Consider the different prompt structure

If you want to run both systems:
- Use different Google Drive folders
- Use different tracking spreadsheets
- Set up separate Apps Script projects
- Ensure different trigger schedules if needed

## Future Enhancements

Both projects could benefit from:
- Automatic meeting type detection
- Custom prompts per meeting type
- Integration with calendar systems
- Email notifications
- Project management tool integration
- Multi-language support 