/**
 * NHS Service Hours — data endpoint for the GitHub Pages site.
 * Deployed from the NHS Gmail account as a web app with access set to "Anyone".
 * The student types their ID (and last name, if NAME_COLUMN is set).
 * The script finds every master-sheet row whose school email contains
 * that ID and returns ONLY hour totals and dates — no emails or names.
 */

const CONFIG = {
  MASTER_SHEET_ID: '1mgentpgq85cPIt099yUU5jBFxfyzefqSlwuBusVWqB0', // long ID from the master sheet's URL
  MASTER_TAB:      'Form Responses 1',      // tab where hour submissions land
  EMAIL_COLUMN:    'Email Address',         // exact header text
  HOURS_COLUMN:    'Number of volunteer hours',                 // exact header text
  DATE_COLUMN:     'Date of volunteering',             // '' to hide dates
  NAME_COLUMN:     '',                      // e.g. 'Full Name' — turns on the last-name check. '' = ID only
  ACTIVITY_COLUMN: '',                      // '' keeps activities private (recommended for ID lookup)
  STATUS_COLUMN:   '',                      // e.g. 'Status' — '' if you don't approve hours
  APPROVED_VALUE:  'Approved',
  REQUIRED_HOURS:  5,                       // e.g. 20 shows progress; 0 hides it
  SCHOOL_DOMAIN:   'student.travisusd.org',        // domain of the emails in the master sheet
};

/**
 * Data endpoint. The GitHub Pages site calls:
 *   <web app URL>?id=123456&name=smith
 * and gets back JSON. No HTML is served from Apps Script anymore.
 */
function doGet(e) {
  const p = (e && e.parameter) || {};
  let result;
  try {
    result = lookupHours(p.id, p.name);
  } catch (err) {
    console.error(err);                 // visible under Executions
    result = { error: 'SERVER' };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Looks up one student from what they typed on the site. */
function lookupHours(rawId, rawLastName) {
  const id = String(rawId || '').replace(/\D/g, '');
  if (id.length < 4 || id.length > 12) return { error: 'BAD_ID' };

  const lastName = normalize(rawLastName);
  if (CONFIG.NAME_COLUMN && !lastName) return { error: 'NEED_NAME' };

  const sheet = SpreadsheetApp.openById(CONFIG.MASTER_SHEET_ID)
                              .getSheetByName(CONFIG.MASTER_TAB);
  if (!sheet) throw new Error('Master tab not found. Check MASTER_TAB.');

  const [header, ...rows] = sheet.getDataRange().getValues();
  const col = name => (name ? header.indexOf(name) : -1);
  const eCol = col(CONFIG.EMAIL_COLUMN);
  const hCol = col(CONFIG.HOURS_COLUMN);
  const dCol = col(CONFIG.DATE_COLUMN);
  const nCol = col(CONFIG.NAME_COLUMN);
  const aCol = col(CONFIG.ACTIVITY_COLUMN);
  const sCol = col(CONFIG.STATUS_COLUMN);
  if (eCol < 0 || hCol < 0 || (CONFIG.NAME_COLUMN && nCol < 0)) {
    throw new Error('A column header was not found. Check the *_COLUMN settings.');
  }

  const mine = rows.filter(r => extractId(r[eCol]) === id);

  // Same answer for "unknown ID" and "wrong name", so the page never
  // confirms which IDs exist.
  if (!mine.length) return { error: 'NO_MATCH' };
  const nameMatches = r => {
    const words = normalize(r[nCol]).split(' ');
    return lastName.split(' ').every(w => words.includes(w));
  };
  if (nCol >= 0 && !mine.some(nameMatches)) {
    return { error: 'NO_MATCH' };
  }

  const tz = Session.getScriptTimeZone();
  let total = 0, pendingTotal = 0, skipped = 0;
  const entries = [];

  for (const row of mine) {
    const hours = parseFloat(row[hCol]);
    if (isNaN(hours)) { skipped++; continue; }

    const approved = sCol < 0 ||
      String(row[sCol]).trim().toLowerCase() === CONFIG.APPROVED_VALUE.toLowerCase();
    if (approved) total += hours; else pendingTotal += hours;

    const when = dCol >= 0 && row[dCol] instanceof Date ? row[dCol] : null;
    entries.push({
      sortKey: when ? when.getTime() : 0,
      date: when ? Utilities.formatDate(when, tz, 'MMM d, yyyy') : '',
      activity: aCol >= 0 ? String(row[aCol]) : '',
      hours: round(hours),
      approved,
    });
  }

  entries.sort((a, b) => b.sortKey - a.sortKey);
  entries.forEach(e => delete e.sortKey);

  return {
    id,
    total: round(total),
    pendingTotal: round(pendingTotal),
    required: CONFIG.REQUIRED_HOURS,
    usesApproval: sCol >= 0,
    showDates: dCol >= 0,
    showActivity: aCol >= 0,
    entries,
    skipped,
  };
}

/** Student ID = the digits before the @ in a school address. */
function extractId(email) {
  const [local, domain] = String(email).toLowerCase().trim().split('@');
  if (domain !== CONFIG.SCHOOL_DOMAIN) return null;
  const m = (local || '').match(/\d+/);
  return m ? m[0] : null;
}

/** Lowercase, strip accents/punctuation, collapse spaces. "O'Brien-Díaz" -> "obrien diaz" */
function normalize(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/['’.]/g, '').replace(/[^a-z]+/g, ' ').trim();
}

function round(n) {
  return Math.round(n * 100) / 100;
}