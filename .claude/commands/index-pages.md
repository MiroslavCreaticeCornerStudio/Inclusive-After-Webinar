---
name: index-pages
description: Submit one or more URLs to Google's Indexing API for rapid indexing. Run after publishing new content or updating important pages.
argument-hint: "[url1] [url2] ..."
allowed-tools: Bash, Read, Write
---

# Index Pages

Submit URLs to Google's Indexing API so Google discovers them within hours rather than days.

## Instructions

The user may pass URLs as arguments, or ask you to find recently published pages to submit.

### If URLs are provided as arguments:

Submit them directly:
```bash
node .claude/scripts/google-index.js {{ $ARGUMENTS }}
```

### If no arguments are given:

Ask the user: "Which URLs would you like to submit? Or should I find all pages published or updated in the last 7 days?"

If they want recently published pages, search the project for recently modified page/content files (based on file modification time or commit history) and extract their public URLs, then submit them.

### If credentials aren't set up yet:

The script will print setup instructions. Walk the user through the one-time Google Cloud setup described in the `google-indexing` skill.

## After submitting

Report the results clearly:
- Which URLs were accepted ✅
- Which failed ❌ and why
- Remind the user that accepted URLs typically appear in Google within a few hours
- Suggest checking Google Search Console → URL Inspection to confirm indexing status
