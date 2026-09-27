# NHS Service Hours Lookup

A small Google Apps Script web app that lets National Honor Society members check their own service hours. A student enters their student ID and last name, and the app totals every submission for that student from the chapter's master hours sheet.

## How it works

Students log hours through a Google Form that writes to a master Google Sheet. This web app reads that sheet, matches rows by the student ID in each submitter's school email address, and shows:

- Total hours
- Progress toward the chapter requirement
- A list of submissions with dates and hours

The page only shows hour totals and dates. It never shows email addresses or names, and activity details are hidden by default.

## Files

| File | Purpose |
| --- | --- |
| `Code.gs` | Server code: reads the sheet, matches the student, totals hours |
| `Index.html` | The page students see (HTML, CSS and client-side JavaScript) |

## Setup for deployment

1. Sign in to the Google account that owns (or can view) the master hours sheet, and go to [script.google.com](https://script.google.com).
2. Create a new project. Paste `Code.gs` into the default file.
3. Add an HTML file named exactly `Index` and paste in `Index.html`.
4. Fill in the `CONFIG` block at the top of `Code.gs` (see below) and save.
5. Go to **Deploy → New deployment**, choose **Web app**, and set:
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Authorize the script and copy the web app URL. That's the link you share with students.

## Configuration

All settings are in `CONFIG` at the top of `Code.gs`. Column names must match the sheet's header row exactly.

| Setting | What to enter |
| --- | --- |
| `MASTER_SHEET_ID` | The long string between `/d/` and `/edit` in the master sheet's URL |
| `MASTER_TAB` | Name of the tab where submissions land (usually `Form Responses 1`) |
| `EMAIL_COLUMN` | Header of the email column (usually `Email Address`) |
| `HOURS_COLUMN` | Header of the hours column (the question text from the form) |
| `DATE_COLUMN` | Header of the date column (usually `Timestamp`), or `''` to hide dates |
| `NAME_COLUMN` | Header of a name column to require a last-name check, or `''` for ID only |
| `ACTIVITY_COLUMN` | Header of an activity column to show it, or `''` to keep activities private |
| `STATUS_COLUMN` | Header of an approval column, or `''` if hours don't need approval |
| `APPROVED_VALUE` | Text in the status column that counts as approved (e.g. `Approved`) |
| `REQUIRED_HOURS` | Chapter hour requirement to show progress, or `0` to hide it |
| `SCHOOL_DOMAIN` | The part after `@` in student emails, e.g. `yourschool.org` |
| `CHAPTER_NAME` | Text shown at the top of the page |

The student ID is taken from the digits in the part of the email before the `@`. If your school's email format is different, update `extractId()` in `Code.gs`.

## Updating the live app

After changing the code, save, then go to **Deploy → Manage deployments**, click the pencil icon, set **Version** to **New version**, and click **Deploy**. This keeps the same URL.

Don't use **New deployment** for updates. It creates a new URL, and the old link keeps running the old code.

To test changes before publishing, use the URL under **Deploy → Test deployments**, which always runs the latest saved code.

## Troubleshooting

| Problem | Likely cause |
| --- | --- |
| `Script function not found: doGet` | The deployment is on an old version. Save, then publish a new version. |
| "Your hours didn't load" | Usually a column header in `CONFIG` doesn't match the sheet. Check **Executions** in the Apps Script editor for the exact error. |
| "No hours found" for a real student | ID or last name typo, or the student submitted hours from a non-school account. |
| Page won't open on a school account | School sharing policies can block apps owned by outside accounts. Make sure access is set to **Anyone**, not "Anyone with a Google account." |

## Privacy notes

- Anyone who knows a student's ID and last name can see that student's hour totals. This is an accepted tradeoff for low-sensitivity data, which is why the page shows only totals and dates.
- Never commit real student data to this repo. The code only reads the sheet; the sheet itself stays in Google Drive.
- Keep the master sheet shared only with chapter officers. Its ID appearing in code doesn't grant anyone access to it.
