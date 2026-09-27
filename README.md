# NHS Service Hours Lookup

A small web app that lets National Honor Society members check their own service hours. A student enters their student ID and last name, and the app totals every submission for that student from the chapter's master hours sheet.

## How it works

Students log hours through a Google Form that writes to a master Google Sheet. This web app reads that sheet, matches rows by the student ID in each submitter's school email address, and shows:

- Total hours
- Progress toward the chapter requirement
- A list of submissions with dates and hours

The page only shows hour totals and dates. It never shows email addresses or names, and activity details are hidden by default.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The page students see, hosted on GitHub Pages |
| `Code.gs` | Google Apps Script data endpoint: reads the sheet, matches the student, returns JSON |

The page is hosted on GitHub Pages instead of Apps Script because Apps Script pages load blank inside in-app browsers (Instagram, Linktree, Classroom) and break for users signed into multiple Google accounts.

## Setup

**1. Apps Script (the data)**

1. Sign in to the Google account that owns (or can view) the master hours sheet, and go to [script.google.com](https://script.google.com).
2. Create a new project and paste `Code.gs` into the default file. No HTML file is needed.
3. Fill in the `CONFIG` block (see below) and save.
4. Go to **Deploy → New deployment**, choose **Web app**, and set **Execute as: Me** and **Who has access: Anyone**.
5. Authorize the script and copy the web app URL (it ends in `/exec`).

**2. GitHub Pages (the page)**

1. In `index.html`, set `API_URL` to the web app URL, and set `ASK_NAME` to `true` if `NAME_COLUMN` is filled in, or `false` if it's `''`.
2. Commit and push, then go to the repo's **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
3. After a minute, the site is live at `https://<username>.github.io/<repo>/`. That's the link to share (Linktree, QR codes, Classroom).

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

The student ID is taken from the digits in the part of the email before the `@`. If your school's email format is different, update `extractId()` in `Code.gs`.

The chapter name at the top of the page and the colors are edited directly in `index.html`.

## Updating the live app

**Page changes** (`index.html`): commit and push. GitHub Pages updates within a minute or two.

**Data changes** (`Code.gs`): save in Apps Script, then go to **Deploy → Manage deployments**, click the pencil icon, set **Version** to **New version**, and click **Deploy**. This keeps the same URL, so `index.html` doesn't need to change.

Don't use **New deployment** for updates. It creates a new URL, and the site would keep calling the old code.

## Troubleshooting

| Problem | Likely cause |
| --- | --- |
| "Your hours didn't load" right away | `API_URL` in `index.html` is wrong, or the deployment isn't set to **Anyone**. |
| "Something went wrong on our end" | Usually a column header in `CONFIG` doesn't match the sheet. Check **Executions** in the Apps Script editor for the exact error. |
| "No hours found" for a real student | ID or last name typo, or the student submitted hours from a non-school account. |
| Changes to `index.html` not showing | GitHub Pages can take a couple of minutes; hard-refresh the page. |

## Privacy notes

- Anyone who knows a student's ID and last name can see that student's hour totals. This is an accepted tradeoff for low-sensitivity data, which is why the page shows only totals and dates.
- Never commit real student data to this repo. The code only reads the sheet; the sheet itself stays in Google Drive.
- Keep the master sheet shared only with chapter officers. Its ID appearing in code doesn't grant anyone access to it.