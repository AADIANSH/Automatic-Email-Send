/* =========================
   Theme toggle (persisted)
   ========================= */
/* =========================
   Theme toggle (persisted)
   ========================= */
const root = document.documentElement;
const themeBtn = document.getElementById("theme-toggle");

(function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") root.classList.add("dark");
})();

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const isDark = root.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

/* =========================
   Section toggles (Sidebar)
   ========================= */
function toggleSection(type) {
  const emailSec = document.getElementById("email-section");
  const eventSec = document.getElementById("event-section");
  if (!emailSec || !eventSec) return;

  // right-side panels
  const emailPanel = document.querySelector('.email-panel');
  const eventPanel = document.querySelector('.event-panel');

  // helpers to animate panels: remove 'hidden' then add 'visible' to trigger CSS transition
  function showPanel(panel) {
    if (!panel) return;
    panel.classList.remove('hidden');
    // allow layout/paint then add visible to animate in
    requestAnimationFrame(() => panel.classList.add('visible'));
  }
  function hidePanel(panel) {
    if (!panel) return;
    panel.classList.remove('visible');
    // after transition finishes, add back hidden to remove from flow
    setTimeout(() => panel.classList.add('hidden'), 260);
  }

  // hide immediately (no exit animation) to avoid overlapping headings during toggle
  function hideImmediate(panel) {
    if (!panel) return;
    panel.classList.remove('visible');
    panel.classList.add('hidden');
  }

  if (type === "email") {
    emailSec.classList.remove("hidden");
    eventSec.classList.add("hidden");
    // hide the other panel immediately to avoid both headings showing during animation
    hideImmediate(eventPanel);
    showPanel(emailPanel);
  } else if (type === "event") {
    eventSec.classList.remove("hidden");
    emailSec.classList.add("hidden");
    hideImmediate(emailPanel);
    showPanel(eventPanel);
  }
}

/* =========================
   Email validation + list
   ========================= */
const emailInput = document.getElementById("email-input");
const addEmailBtn = document.getElementById("add-email");
const emailList = document.getElementById("email-list");
// track selected emails (no checkboxes)
const selectedEmails = new Set();
// track all added emails to prevent duplicates
const emailsSet = new Set();

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.(com|in|org|edu|net|gov|co|info|io|ac|tech|me|ai|[a-z]{2,})$/i;
  return re.test(email.trim());
}

function addEmailToList(val) {
  // prevent duplicates
  if (emailsSet.has(val)) {
    alert('Email already added');
    return;
  }

  emailsSet.add(val);

  const li = document.createElement("li");
  li.textContent = val;
  li.dataset.email = val;

  // toggle selection on double-click (no checkbox)
  li.addEventListener('dblclick', () => {
    const e = li.dataset.email;
    if (selectedEmails.has(e)) {
      selectedEmails.delete(e);
      li.classList.remove('selected-email');
    } else {
      selectedEmails.add(e);
      li.classList.add('selected-email');
    }
    renderEmailCards();
  });

  emailList.appendChild(li);
  // keep the newest item visible
  emailList.scrollTop = emailList.scrollHeight;
}

if (addEmailBtn && emailInput && emailList) {
  addEmailBtn.addEventListener("click", () => {
    const val = emailInput.value.trim();
    if (!val) return alert("Please enter an email");
    if (!isValidEmail(val)) return alert("Invalid email format");
    addEmailToList(val);
    emailInput.value = "";
    emailInput.focus();
  });

  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addEmailBtn.click();
  });
}

// Event input elements (declare before adding listeners)
const eventSubject = document.getElementById("event-subject");
const eventDescription = document.getElementById("event-description");
const attachIcon = document.getElementById("attach-icon");
const eventAttachmentInput = document.getElementById("event-attachment");

// allow pressing Enter on the subject input to save the event (convenience)
if (eventSubject) {
  eventSubject.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEvent();
    }
  });
}

// Submit event when Enter is pressed anywhere inside the event form
// but keep Enter in textarea (description) as newline
const eventForm = document.querySelector('.event-form');
if (eventForm) {
  eventForm.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const active = document.activeElement;
    // don't submit when focus is inside the textarea
    if (active && active.tagName === 'TEXTAREA') return;
    e.preventDefault();
    saveEvent();
  });
}

/* =========================
  Events: subject + description
  Attachment appears on typing
  ========================= */

// In-memory store (frontend-only)
const events = [];
const eventList = document.querySelector(".event-list");
const eventCards = document.getElementById("event-cards");
const selectedEvents = new Set();

if (eventDescription && attachIcon) {
  eventDescription.addEventListener("input", () => {
    const hasText = eventDescription.value.trim().length > 0;
    attachIcon.classList.toggle("hidden", !hasText);
  });
}

// Save a new event (binds multiple attachments to this event)
function saveEvent() {
  console.log('saveEvent called');
  const statusEl = document.getElementById('event-status');
  let subject = eventSubject?.value?.trim() || "";
  const desc = eventDescription?.value?.trim() || "";
  const files = eventAttachmentInput?.files ? Array.from(eventAttachmentInput.files) : [];

  // simple validation with inline message
  if (!subject) {
    if (statusEl) { statusEl.textContent = 'Subject is required'; statusEl.className = 'event-status error'; }
    return;
  }
  if (!desc) {
    if (statusEl) { statusEl.textContent = 'Description is required'; statusEl.className = 'event-status warn'; }
    return;
  }

  subject = titleCase(subject);

  const newEvent = {
    id: cryptoRandomId(),
    subject,
    description: desc,
    attachment: files.length ? files.map(f => ({ name: f.name, size: f.size, type: f.type })) : null,
    createdAt: new Date().toISOString()
  };
  events.push(newEvent);
  renderEvents();

  // Reset form
  eventSubject.value = "";
  eventDescription.value = "";
  attachIcon.classList.add("hidden");
  if (eventAttachmentInput) eventAttachmentInput.value = "";
  if (statusEl) {
    statusEl.textContent = 'Event saved';
    statusEl.className = 'event-status ok';
    setTimeout(() => { if (statusEl) { statusEl.textContent = ''; statusEl.className = 'event-status'; } }, 2000);
  }
  console.log('event added', newEvent);
}

// Toggle selection helper
function toggleEventSelection(id) {
  if (selectedEvents.has(id)) selectedEvents.delete(id);
  else selectedEvents.add(id);
}

// Render card-only UI for events (no center list entries for new events)
function renderEvents() {
  if (eventList) eventList.innerHTML = "";
  if (!eventCards) return;
  eventCards.innerHTML = "";

  events.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.setAttribute("data-id", ev.id);

    if (selectedEvents.has(ev.id)) card.classList.add("selected");

    const title = document.createElement("h4");
    title.textContent = ev.subject;

    const sub = document.createElement("p");
    sub.textContent = ev.description.length > 120 ? ev.description.slice(0, 120) + "…" : ev.description;

    const badge = document.createElement("span");
    const hasAttach = ev.attachment && ev.attachment.length;
    badge.textContent = hasAttach
      ? (ev.attachment.length === 1 ? `Attached: ${ev.attachment[0].name}` : `${ev.attachment.length} files`)
      : "No attachment";

    badge.style.display = "inline-block";
    badge.style.fontSize = "12px";
    badge.style.padding = "4px 8px";
    badge.style.borderRadius = "999px";
    badge.style.marginTop = "8px";
    badge.style.background = hasAttach ? "#14b8a6" : "#e6e9ef";
    badge.style.color = hasAttach ? "#fff" : "#0f172a";

    const attachLabel = document.createElement("label");
    attachLabel.className = "attach-icon";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.hidden = true;
    fileInput.multiple = true;
    fileInput.accept = "*/*";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.innerHTML = `<path d="M18.364 5.636a5 5 0 0 0-7.07 0L5.636 11.293a3 3 0 0 0 4.243 4.243l6.364-6.364a1 1 0 1 0-1.414-1.414l-6.364 6.364a1 1 0 0 1-1.414-1.414l5.657-5.657a3 3 0 1 1 4.243 4.243l-6.364 6.364a5 5 0 0 1-7.07-7.07l7.07-7.07a7 7 0 1 1 9.9 9.9l-6.364 6.364a1 1 0 0 0 1.414 1.414l6.364-6.364a7 7 0 0 0-9.9-9.9z"/>`;
    attachLabel.appendChild(fileInput);
    attachLabel.appendChild(svg);

    card.addEventListener("click", (e) => {
      if (attachLabel.contains(e.target) || e.target === fileInput) return;
      openMessageBox(ev.id);
    });

    card.addEventListener("dblclick", (e) => {
      if (attachLabel.contains(e.target) || e.target === fileInput) return;
      selectedEvents.has(ev.id) ? selectedEvents.delete(ev.id) : selectedEvents.add(ev.id);
      card.classList.toggle("selected");
      openMessageBox(ev.id);
    });

    fileInput.addEventListener("change", () => {
      const files = fileInput.files ? Array.from(fileInput.files) : [];
      ev.attachment = files.map(f => ({ name: f.name, size: f.size, type: f.type }));
      renderEvents(); // refresh badge + card
    });

    card.appendChild(title);
    card.appendChild(sub);
    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "space-between";
    footer.style.alignItems = "center";
    footer.style.marginTop = "10px";
    footer.appendChild(attachLabel);
    footer.appendChild(badge);
    card.appendChild(footer);

    if (hasAttach) {
      const attachLine = document.createElement("p");
      attachLine.style.marginTop = "8px";
      attachLine.style.fontSize = "12px";
      attachLine.style.opacity = "0.85";
      attachLine.textContent = ev.attachment.length === 1
        ? `Attachment: ${ev.attachment[0].name}`
        : `${ev.attachment.length} attachments`;
      card.appendChild(attachLine);
    }

    eventCards.appendChild(card);
  });
}

function openMessageBox(eventId) {
  const ev = events.find(x => x.id === eventId);
  if (!ev) return;

  // show popup
  const popup = document.getElementById("message-popup");
  popup.style.display = "block";

  const ta = popup.querySelector("textarea");
  const btn = popup.querySelector("#popup-save");
  const attachContainer = popup.querySelector(".message-attachments");
  const fileInput = popup.querySelector("#popup-file");

  if (ta) {
    ta.value = ev.description;
    ta.placeholder = `Details for: ${ev.subject}`;
  }

  // render attachments
  if (attachContainer) {
    attachContainer.innerHTML = "";
    if (ev.attachment && ev.attachment.length) {
      ev.attachment.forEach(file => {
        const span = document.createElement("span");
        span.textContent = file.name;
        span.style.display = "inline-block";
        span.style.background = "#e0f7fa";
        span.style.color = "#006064";
        span.style.padding = "4px 8px";
        span.style.margin = "4px";
        span.style.borderRadius = "4px";
        span.style.fontSize = "13px";
        attachContainer.appendChild(span);
      });
    } else {
      attachContainer.textContent = "No attachments";
    }
  }

  if (btn) {
    btn.onclick = () => {
      ev.description = ta.value;

      if (fileInput && fileInput.files.length) {
        ev.attachment = Array.from(fileInput.files).map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }));
      }

      renderEvents();

      // hide popup after save
      popup.style.display = "none";
    };
  }
}



// Popup handler
function openMessageBox(eventId) {
  const ev = events.find(x => x.id === eventId);
  if (!ev) return;

  openPopup("message-popup");

  const ta = messagePopup.querySelector("textarea");
  const btn = messagePopup.querySelector("button");
  const attachContainer = messagePopup.querySelector(".message-attachments");
  const fileInput = document.getElementById("popup-file");

  if (ta) {
    ta.value = ev.description;
    ta.placeholder = `Details for: ${ev.subject}`;
  }

  // clear old attachments
  if (attachContainer) {
    attachContainer.innerHTML = "";
    if (ev.attachment && ev.attachment.length) {
      ev.attachment.forEach(file => {
        const span = document.createElement("span");
        span.textContent = file.name;

        // inline style for pill look
        span.style.display = "inline-block";
        span.style.background = "#e0f7fa";
        span.style.color = "#006064";
        span.style.padding = "4px 8px";
        span.style.margin = "4px";
        span.style.borderRadius = "4px";
        span.style.fontSize = "13px";

        attachContainer.appendChild(span);
      });
    } else {
      attachContainer.textContent = "No attachments";
    }
  }

  if (btn) {
    btn.onclick = () => {
      ev.description = ta.value;

      if (fileInput && fileInput.files.length) {
        // overwrite attachments with last selected files
        ev.attachment = Array.from(fileInput.files).map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }));
      }

      renderEvents(); // refresh cards so badge updates
      closePopup("message-popup");
    };
  }
}
// Utility: lightweight ID generator

// Utility: lightweight ID generator
function cryptoRandomId() {
  if (window.crypto?.getRandomValues) {
    const arr = new Uint32Array(4);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(n => n.toString(16)).join("");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Utility: convert string to Title Case (basic)
function titleCase(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/* =========================
   Message popup (edit event)
   ========================= */
const messagePopup = document.getElementById("message-popup");

function openMessageBox(eventId) {
  const ev = events.find(x => x.id === eventId);
  if (!ev) return;

  openPopup("message-popup");

  const ta = messagePopup.querySelector("textarea");
  const btn = messagePopup.querySelector("button");
  const attachContainer = messagePopup.querySelector(".message-attachments");

  if (ta) {
    ta.value = ev.description;
    ta.placeholder = `Details for: ${ev.subject}`;
  }

  // Populate attachments info
  if (attachContainer) {
    attachContainer.innerHTML = "";
    if (ev.attachment && ev.attachment.length) {
      ev.attachment.forEach((a, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '6px 8px';
        row.style.borderRadius = '8px';
        row.style.background = 'color-mix(in srgb, var(--soft) 40%, transparent)';

        const name = document.createElement('div');
        name.textContent = a.name;
        name.style.fontSize = '13px';

        const meta = document.createElement('div');
        meta.style.fontSize = '12px';
        meta.style.opacity = '0.8';
        meta.textContent = a.size ? `${Math.round(a.size / 1024)} KB` : '';

        row.appendChild(name);
        row.appendChild(meta);
        attachContainer.appendChild(row);
      });
    } else {
      const none = document.createElement('div');
      none.textContent = 'No attachments';
      none.style.color = 'var(--muted)';
      none.style.padding = '6px 8px';
      attachContainer.appendChild(none);
    }
  }

  if (btn) {
    btn.textContent = "Save Description";
    btn.onclick = function () {
      const newDesc = ta?.value?.trim() || "";
      const idx = events.findIndex(x => x.id === eventId);
      if (idx !== -1) {
        events[idx].description = newDesc;
        renderEvents();
      }
      closePopup("message-popup");
    };
  }
}

/* =========================
   Repeat popup (open only)
   ========================= */

/* =========================
   Repeat popup with scheduler
   ========================= */
const repeatBtn = document.getElementById("repeat-btn");
if (repeatBtn) {
  repeatBtn.addEventListener("click", () => {
    openPopup("repeat-popup");

    // inside repeat-popup we expect inputs:
    // #repeat-date, #repeat-time, #repeat-count, #repeat-interval
    const dateInput = document.getElementById("repeat-date");
    const timeInput = document.getElementById("repeat-time");
    const countInput = document.getElementById("repeat-count");
    const intervalInput = document.getElementById("repeat-interval");
    const startBtn = document.getElementById("repeat-start");

    if (startBtn) {
      startBtn.onclick = () => {
        const dateVal = dateInput?.value;
        const timeVal = timeInput?.value;
        const countVal = parseInt(countInput?.value || "1", 10);
        const intervalVal = parseInt(intervalInput?.value || "1", 10); // minutes

        if (!dateVal || !timeVal) {
          alert("Please select both date and time");
          return;
        }

        const targetDateTime = new Date(`${dateVal}T${timeVal}:00`);
        console.log("Repeat scheduled:", { targetDateTime, countVal, intervalVal });

        // Scheduler loop
        let sentCount = 0;
        const checkInterval = setInterval(() => {
          const now = new Date();
          // Indian time check (IST offset +5:30)
          const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

          if (istNow >= targetDateTime && sentCount < countVal) {
            const emails = getSelectedEmails();
            const payload = Array.from(selectedEvents).map(id => events.find(e => e.id === id)).filter(Boolean);

            if (!emails.length || !payload.length) {
              console.warn("No emails/events selected for repeat send");
              clearInterval(checkInterval);
              return;
            }

            console.log(`Sending scheduled event batch ${sentCount + 1}`, { payload, emails });
            alert(`(Demo) Sent scheduled events batch ${sentCount + 1} to ${emails.length} email(s)`);

            sentCount++;
            // next trigger time = add interval minutes
            targetDateTime.setMinutes(targetDateTime.getMinutes() + intervalVal);

            if (sentCount >= countVal) {
              clearInterval(checkInterval);
              console.log("Repeat sending finished");
            }
          }
        }, 30 * 1000); // check every 30s
      };
    }
  });
}
// Ensure past dates are disabled in repeat-date input
const repeatDateInput = document.getElementById("repeat-date");
if (repeatDateInput) {
  const today = new Date().toISOString().split("T")[0];
  repeatDateInput.setAttribute("min", today);
}

// Repeat button scheduler logic
if (repeatBtn) {
  repeatBtn.addEventListener("click", () => {
    openPopup("repeat-popup");

    const dateInput = document.getElementById("repeat-date");
    const timeInput = document.getElementById("repeat-time");
    const countInput = document.getElementById("repeat-count");
    const intervalInput = document.getElementById("repeat-interval");
    const startBtn = document.getElementById("repeat-start");

    if (startBtn) {
      startBtn.onclick = () => {
        const dateVal = dateInput?.value;
        const timeVal = timeInput?.value;
        const countVal = parseInt(countInput?.value || "1", 10);
        const intervalVal = parseInt(intervalInput?.value || "1", 10);

        if (!dateVal || !timeVal) {
          alert("Please select both date and time");
          return;
        }

        const targetDateTime = new Date(`${dateVal}T${timeVal}:00`);
        let sentCount = 0;

        const checkInterval = setInterval(() => {
          const now = new Date();
          const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

          if (istNow >= targetDateTime && sentCount < countVal) {
            const emails = getSelectedEmails();
            const payload = Array.from(selectedEvents).map(id => events.find(e => e.id === id)).filter(Boolean);

            if (!emails.length || !payload.length) {
              console.warn("No emails/events selected for repeat send");
              clearInterval(checkInterval);
              return;
            }

            console.log(`Sending scheduled event batch ${sentCount + 1}`, { payload, emails });
            alert(`(Demo) Sent scheduled events batch ${sentCount + 1} to ${emails.length} email(s)`);

            sentCount++;
            // next trigger time = add interval hours
            targetDateTime.setHours(targetDateTime.getHours() + intervalVal);

            if (sentCount >= countVal) {
              clearInterval(checkInterval);
              console.log("Repeat sending finished");
            }
          }
        }, 60 * 1000); // check every 1 minute
      };
    }
  });
}
/* =========================
   Login / Forgot / OTP / Reset
   Frontend-only demo
   ========================= */
const loginBtn = document.getElementById("login-btn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => openPopup("login-popup"));
}

function showForgot() {
  closePopup("login-popup");
  openPopup("forgot-popup");
}

function verifyOTP() {
  // Frontend demo: accept any 6-digit input
  const otpInput = document.querySelector("#forgot-popup input[type='text']");
  const otp = otpInput?.value?.trim() || "";
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    alert("Please enter a valid 6-digit OTP");
    return;
  }
  closePopup("forgot-popup");
  openPopup("reset-popup");
}

function saveNewPassword() {
  const passInput = document.querySelector("#reset-popup input[type='password']");
  const newPass = passInput?.value?.trim() || "";
  if (newPass.length < 6) {
    alert("Password should be at least 6 characters");
    return;
  }

  // Frontend-only persistence (demo). Replace with backend DB write later.
  localStorage.setItem("userPasswordDemo", newPass);

  alert("Password updated (demo). Backend save will be added later.");
  closePopup("reset-popup");
}

/* =========================
   Popups helpers + backdrop
   ========================= */
function openPopup(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("show");
}
function closePopup(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("show");
}

// Close popup when clicking on backdrop
document.addEventListener("click", (e) => {
  const popups = document.querySelectorAll(".popup.show");
  popups.forEach(p => {
    if (e.target === p) p.classList.remove("show");
  });
});

/* =========================
   Send selected events to selected emails (frontend demo)
   ========================= */
const sendSelectedBtn = document.getElementById("send-selected-events");
const sendAllBtn = document.getElementById("send-all-events");

function getSelectedEmails() {
  return Array.from(selectedEmails.values());
}

// Render selected emails into the right-side Emails Cards panel
function renderEmailCards() {
  const container = document.getElementById('email-cards');
  if (!container) return;
  container.innerHTML = '';

  selectedEmails.forEach(email => {
    const c = document.createElement('div');
    c.className = 'email-card';
    c.textContent = email;

    // toggle selection on click
    c.addEventListener('click', () => {
      if (selectedEmails.has(email)) {
        // remove from selection
        selectedEmails.delete(email);
        // un-highlight in the list
        const listItems = emailList.querySelectorAll('li');
        listItems.forEach(li => {
          if (li.dataset.email === email) li.classList.remove('selected-email');
        });
      } else {
        // add back to selection
        selectedEmails.add(email);
        const listItems = emailList.querySelectorAll('li');
        listItems.forEach(li => {
          if (li.dataset.email === email) li.classList.add('selected-email');
        });
      }
      renderEmailCards();
    });

    // highlight selected card
    if (selectedEmails.has(email)) {
      c.classList.add('selected-email');
    }

    container.appendChild(c);
  });
}

if (sendSelectedBtn) {
  sendSelectedBtn.addEventListener("click", () => {
    const selectedIds = Array.from(selectedEvents);
    const emails = getSelectedEmails();
    if (!selectedIds.length) return alert("Please select at least one event card (click the card)");
    if (!emails.length) return alert("Please select at least one recipient email from the list");

    const payload = selectedIds.map(id => events.find(e => e.id === id)).filter(Boolean);
    console.log("Sending events to emails (demo):", { payload, emails });
    alert(`(Demo) Sent ${payload.length} event(s) to ${emails.length} email(s)`);

    // clear selection after send
    selectedEvents.clear();
    renderEvents();
  });
}

function renderEvents() {
  if (eventList) eventList.innerHTML = "";
  if (!eventCards) return;
  eventCards.innerHTML = "";

  events.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.setAttribute("data-id", ev.id);

    // Checkbox for selection
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.marginRight = "8px";
    checkbox.checked = selectedEvents.has(ev.id);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedEvents.add(ev.id);
        card.classList.add("selected");
      } else {
        selectedEvents.delete(ev.id);
        card.classList.remove("selected");
      }
    });

    // Title + description
    const title = document.createElement("h4");
    title.textContent = ev.subject;

    const sub = document.createElement("p");
    sub.textContent = ev.description.length > 120 ? ev.description.slice(0, 120) + "…" : ev.description;

    // Layout row for checkbox + title
    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.alignItems = "center";
    headerRow.appendChild(checkbox);
    headerRow.appendChild(title);

    // Badge + attach icon (same as before)
    const badge = document.createElement("span");
    badge.textContent = ev.attachment && ev.attachment.length ? `${ev.attachment.length} file(s)` : "No attachment";
    badge.style.fontSize = "12px";

    const footer = document.createElement("div");
    footer.style.display = "flex";
    footer.style.justifyContent = "space-between";
    footer.style.alignItems = "center";
    footer.style.marginTop = "10px";
    footer.appendChild(badge);

    // Assemble card
    card.appendChild(headerRow);
    card.appendChild(sub);
    card.appendChild(footer);
    // double-click: open description popup
    card.addEventListener("dblclick", () => {
      console.log("Double-click detected on card:", ev.id); // debug
      openMessageBox(ev.id); // popup kholne ke liye
    });
    eventCards.appendChild(card);
  });
}
if (sendAllBtn) {
  sendAllBtn.addEventListener("click", () => {
    const emails = getSelectedEmails();
    if (!events.length) return alert("No events to send");
    if (!emails.length) return alert("Please select at least one recipient email from the list");
    console.log("Sending ALL events to emails (demo):", { events, emails });
    alert(`(Demo) Sent ${events.length} event(s) to ${emails.length} email(s)`);
  });
}

/* =========================
   Global file selection log
   (for the event form attach-icon)
   ========================= */
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t && t.type === "file" && t.id === "event-attachment") {
    const files = t.files ? Array.from(t.files) : [];
    if (files.length) {
      const totalKB = Math.round(files.reduce((s, f) => s + f.size, 0) / 1024);
      console.log(`Event form files selected: ${files.map(f => f.name).join(', ')} (${totalKB} KB total)`);
    }
  }
});

// Initialize with empty event list
renderEvents();

// Ensure Save button is bound (in case inline onclick is missing)
const saveBtn = document.getElementById('save-event-btn');
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    console.log('Save button clicked');
    saveEvent();
  });
} else {
  console.warn('Save button (#save-event-btn) not found');
}

// Quick debug helper: show missing element warnings in event status
const eventStatus = document.getElementById('event-status');
if (!eventSubject || !eventDescription || !eventCards) {
  console.warn('One or more event elements are missing:', { eventSubject, eventDescription, eventCards });
  if (eventStatus) {
    eventStatus.textContent = 'UI elements missing; check console for details.';
    eventStatus.className = 'event-status warn';
  }
}