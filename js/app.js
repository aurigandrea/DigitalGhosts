// Digital Ghosts Web Archive Configuration
const CONFIG = {
  GOOGLE_FORM_URL: 'https://docs.google.com/forms/d/e/1FAIpQLScE_1kKLc0nqU8ex8bZpC7R04_IVLXhcIoU7i3ElRNcxwfjWw/formResponse',
  GOOGLE_SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQnG0ZVWbEOLIV_hNXy5d23s8zypFAlPyQwN85YaaXuOEZDWr3j7YzxtSoC6p5ZpTnVuFHPFi_Gm9yU/pub?gid=1771800021&single=true&output=csv',
  FORM_FIELDS: {
    URL: 'entry.1612934956',
    WAYBACK_URL: 'entry.737547364',
    TIMESTAMP: 'entry.1949378565',
    STATUS: 'entry.1051817164'
  }
};

// Store the most recent submission for fallback display
let lastSubmission = null;async function savePage() {
  const input = document.getElementById("url");
  const url = input.value.trim();
  const status = document.getElementById("status");

  if (!url) {
    status.textContent = "Please enter a valid URL.";
    return;
  }

  try {
    new URL(url);
  } catch {
    status.textContent = "Please enter a valid URL (include http:// or https://).";
    return;
  }

  status.textContent = "Archiving… please wait.";
  
  try {
    const timestamp = new Date().toISOString();
    const waybackUrl = `https://web.archive.org/web/*/${url}`;
    
    // Start Wayback archiving in background
    const waybackPromise = fetch(`https://web.archive.org/save/${encodeURIComponent(url)}`, { 
      mode: "no-cors",
      signal: AbortSignal.timeout(10000)
    }).then(() => {
      // Wayback Machine archiving initiated
    }).catch(error => {
      // Wayback Machine error (but continuing)
    });
    
    // Submit to Google Form
    try {
      await submitToGoogleForm(url, waybackUrl, timestamp, 'archived');
      
      // Store the submission for fallback display
      lastSubmission = {
        url: url,
        timestamp: new Date().toLocaleString()
      };
      
      status.textContent = "✅ Page archived successfully!";
      
      setTimeout(() => {
        loadRecentlyArchived();
      }, 2000);
      
    } catch (formError) {
      status.textContent = "⚠️ Archived to Wayback Machine, but failed to save to list.";
    }
    
  } catch (err) {
    status.textContent = "⚠️ Error during archiving process.";
  }

  input.value = "";
}

async function submitToGoogleForm(url, waybackUrl, timestamp, archiveStatus) {
  const formData = new FormData();
  formData.append(CONFIG.FORM_FIELDS.URL, url);
  formData.append(CONFIG.FORM_FIELDS.WAYBACK_URL, waybackUrl);
  formData.append(CONFIG.FORM_FIELDS.TIMESTAMP, timestamp);
  formData.append(CONFIG.FORM_FIELDS.STATUS, archiveStatus);

  try {
    const response = await fetch(CONFIG.GOOGLE_FORM_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData,
      signal: AbortSignal.timeout(10000)
    });
    
    return response;
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('Form submission timed out');
    }
    throw error;
  }
}

async function loadRecentlyArchived() {
  try {
    const response = await fetch(CONFIG.GOOGLE_SHEET_CSV_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim() === '') {
      throw new Error('Empty CSV data received');
    }
    
    const archives = parseCSV(csvText);
    displayRecentArchives(archives);
    
  } catch (error) {
    const list = document.getElementById("list");
    
    if (lastSubmission) {
      list.innerHTML = `
        <li style="color: #ff6b6b;">The shared archive list is temporarily unavailable.</li>
        <li style="color: #00ffff; margin-top: 10px;">
          <span class="archived-url">${lastSubmission.url}</span> — archived at ${lastSubmission.timestamp}
        </li>
        <li style="color: #999; font-style: italic; font-size: 0.9em; margin-top: 5px;">
          (Showing your most recent submission)
        </li>
      `;
    } else {
      list.innerHTML = '<li style="color: #ff6b6b;">The shared archive list is temporarily unavailable. <br>Don\'t worry - your submissions are still being archived!</li>';
    }
    
    const status = document.getElementById("status");
    if (!status.textContent.includes("✅")) {
      status.textContent = "⚠️ Error loading recent archives (but archiving still works).";
    }
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }
  
  const archives = [];

  for (let i = 6; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    
    if (values.length >= 4) {
      const archive = {
        formTimestamp: values[0] || '',
        url: values[1] || '',
        waybackUrl: values[2] || '',
        isoTimestamp: values[3] || '',
        status: values[4] || values[3] || 'unknown'
      };
      
      archive.timestamp = archive.formTimestamp;
      archives.push(archive);
    }
  }
  
  const validArchives = archives
    .filter(archive => archive.url && archive.url.trim() !== '')
    .sort((a, b) => {
      const dateA = new Date(a.formTimestamp);
      const dateB = new Date(b.formTimestamp);
      return dateB - dateA;
    });
    
  return validArchives;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/["%]/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim().replace(/["%]/g, ''));
  return values.filter(val => val !== '');
}

function displayRecentArchives(archives) {
  const list = document.getElementById("list");
  list.innerHTML = '';

  if (!archives || archives.length === 0) {
    list.innerHTML = '<li style="color: #999; font-style: italic;">No archives yet. Be the first to submit a link!</li>';
    return;
  }

  archives.slice(0, 10).forEach(archive => {
    try {
      const li = document.createElement("li");
      const displayTime = archive.formTimestamp || archive.timestamp || 'Unknown time';
      const displayUrl = archive.url || 'Unknown URL';
      
      li.innerHTML = `
        <span class="archived-url">${displayUrl}</span> 
        — archived at ${displayTime}
      `;
      list.appendChild(li);
    } catch (error) {
      // Skip problematic entries
    }
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const archiveBtn = document.getElementById('archiveBtn');
  const input = document.getElementById("url");
  
  if (archiveBtn) {
    archiveBtn.addEventListener('click', savePage);
  }
  
  // Allow Enter key to submit
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        savePage();
      }
    });
  }
  
  // Load recent archives on page load
  loadRecentlyArchived();
  
  // Auto-refresh recent archives every 30 seconds
  setInterval(loadRecentlyArchived, 30000);
});
