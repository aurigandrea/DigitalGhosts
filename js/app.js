// Extracted from index.html
async function savePage() {
  const input = document.getElementById("url");
  const url = input.value.trim();
  const status = document.getElementById("status");

  if (!url) {
    status.textContent = "Please enter a valid URL.";
    return;
  }

  status.textContent = "Archiving… please wait.";
  try {
    // Using no-cors because Wayback save endpoint doesn't return CORS headers for direct browser requests
    await fetch(`https://web.archive.org/save/${encodeURIComponent(url)}`, { mode: "no-cors" });
    const timestamp = new Date().toLocaleTimeString();
    const li = document.createElement("li");
    const archiveLink = `https://web.archive.org/web/*/${url}`;
    li.innerHTML = `<a href="${archiveLink}" target="_blank">${url}</a> — archived at ${timestamp}`;
    document.getElementById("list").prepend(li);
    status.textContent = "✅ Page archived successfully!";
  } catch (err) {
    status.textContent = "⚠️ Error connecting to Wayback Machine.";
  }

  input.value = "";
}

// Optional: Attach event listener instead of inline onclick
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('button');
  if (btn) btn.addEventListener('click', savePage);
});
