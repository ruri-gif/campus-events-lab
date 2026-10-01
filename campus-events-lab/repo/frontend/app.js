// Vanilla JS only (no third-party state libraries). Data lives in localStorage, shared by all pages.
const ALLOWED_DOMAIN = "@univ.edu.ph";

const EVENTS = [
  { id: 1, title: "Intro to Generative AI Workshop", date: "2026-10-15T09:00", venue: "Computer Lab 2", capacity: 30, img: "images/event-ai.svg", alt: "Illustration of a laptop beside a glowing network of connected nodes", tag: "Workshop", about: "A hands-on introduction to prompting, code assistants and responsible AI use for students.", speaker: "Prof. Elena Ramos", speakerRole: "Department of Information Technology" },
  { id: 2, title: "Career Fair 2026", date: "2026-10-22T10:00", venue: "University Gymnasium", capacity: 200, img: "images/event-career.svg", alt: "Illustration of colorful career fair booths with visitors", tag: "Career", about: "Meet hiring partners, join résumé clinics and learn what employers look for in new graduates.", speaker: "Marco Villanueva", speakerRole: "HR Director, Pacific Tech Group" },
  { id: 3, title: "Intramurals Opening Ceremony", date: "2026-11-03T08:00", venue: "Main Oval", capacity: 500, img: "images/event-ceremony.svg", alt: "Illustration of flags and a crowd at sunset for the opening ceremony", tag: "Sports", about: "A parade of colleges, the torch lighting and opening games to kick off the sports season.", speaker: "Dr. Teresa Navarro", speakerRole: "Vice President for Student Affairs" },
  { id: 4, title: "Hackathon: Build for Campus", date: "2026-11-14T08:00", venue: "Innovation Hub", capacity: 3, img: "images/event-hackathon.svg", alt: "Illustration of code brackets on a dark blue grid", tag: "Competition", about: "Teams of up to four build a solution to a real campus problem in one day, with mentor support.", speaker: "Jomar Dela Peña", speakerRole: "Software Engineer and Hackathon Mentor" },
  { id: 5, title: "Research & Innovation Expo", date: "2026-11-21T09:00", venue: "Science Building Atrium", capacity: 150, img: "images/event-expo.svg", alt: "Illustration of research poster boards beside a glowing lightbulb", tag: "Showcase", about: "Students present research and prototypes to faculty, industry guests and the public.", speaker: "Dr. Rafael Mendoza", speakerRole: "Dean, College of Science" },
  { id: 6, title: "Alumni Homecoming Night", date: "2026-12-05T18:00", venue: "Student Center Plaza", capacity: 300, img: "images/event-homecoming.svg", alt: "Illustration of a graduation cap under string lights and a starry night sky", tag: "Social", about: "An evening of reunions, performances and alumni stories, with a short program and dinner.", speaker: "Atty. Camille Ortega", speakerRole: "Alumna, Class of 2008" }
];

const store = {
  load() { try { return JSON.parse(localStorage.getItem("registrations")) || []; } catch { return []; } },
  save(list) { localStorage.setItem("registrations", JSON.stringify(list)); }
};

const $ = (id) => document.getElementById(id);
const fmt = (iso) => new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
const count = (eventId) => store.load().filter((r) => r.eventId === eventId).length;
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const initials = (n) => { const p = n.replace(/^(Dr|Prof|Atty|Engr)\.?\s+/i, "").split(/\s+/); return (p[0][0] + p[p.length - 1][0]).toUpperCase(); };

function cardHtml(e, withAction) {
  const used = count(e.id), left = e.capacity - used, d = new Date(e.date);
  const month = d.toLocaleString("en-PH", { month: "short" }), day = d.getDate(), t = escapeHtml(e.title);
  const action = !withAction ? "" : left <= 0
    ? `<button type="button" disabled>Fully booked</button>`
    : `<a class="btn" href="register.html?event=${e.id}">Register<span class="visually-hidden"> for ${t}</span></a>`;
  return `<div class="media">
      <img src="${e.img}" alt="${escapeHtml(e.alt)}">
      <p class="date" aria-hidden="true"><span>${month}</span><strong>${day}</strong></p>
      <p class="tag">${escapeHtml(e.tag)}</p>
    </div>
    <div class="body">
      <h3>${t}</h3>
      <p class="meta">${fmt(e.date)}<br>${escapeHtml(e.venue)}</p>
      <p class="about">${escapeHtml(e.about)}</p>
      <div class="speaker">
        <span class="avatar" aria-hidden="true">${initials(e.speaker)}</span>
        <p><strong>${escapeHtml(e.speaker)}</strong><span>${escapeHtml(e.speakerRole)}</span></p>
      </div>
      <progress max="${e.capacity}" value="${Math.min(used, e.capacity)}" aria-label="Seats taken for ${t}"></progress>
      <p class="seats ${left <= 0 ? "full" : ""}">${left <= 0 ? "Fully booked" : left + " of " + e.capacity + " seats left"}</p>
      ${action}
    </div>`;
}

function eventOptions(placeholder) {
  return (placeholder ? `<option value="">Choose an event</option>` : "") +
    EVENTS.map((e) => `<option value="${e.id}">${escapeHtml(e.title)}</option>`).join("");
}

const page = document.body.dataset.page;

if (page === "events") {
  $("event-list").innerHTML = EVENTS.map((e) => `<article class="event">${cardHtml(e, true)}</article>`).join("");
}

if (page === "register") {
  const select = $("event-select"), status = $("form-status");
  select.innerHTML = eventOptions(true);
  const pre = new URLSearchParams(location.search).get("event");
  if (pre && EVENTS.some((e) => String(e.id) === pre)) select.value = pre;

  function renderSummary() {
    const e = EVENTS.find((x) => x.id === Number(select.value));
    $("event-summary").innerHTML = e ? cardHtml(e, false) : `<div class="body"><h3>No event selected</h3><p class="meta">Choose an event to see its date, venue and seats left.</p></div>`;
  }
  const dlg = $("success-dialog");
  $("success-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
  select.addEventListener("change", renderSummary);
  renderSummary();

  const setError = (id, msg) => { $(id).textContent = msg; };
  $("register-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const eventId = Number(select.value);
    const name = $("full-name").value.trim();
    const sn = $("student-number").value.trim();
    const email = $("email").value.trim().toLowerCase();
    status.className = "status"; status.textContent = "";
    setError("event-error", ""); setError("name-error", ""); setError("sn-error", ""); setError("email-error", "");

    let valid = true;
    if (!eventId) { setError("event-error", "Choose an event."); valid = false; }
    if (!name) { setError("name-error", "Enter your full name."); valid = false; }
    if (!/^[A-Za-z0-9-]{6,15}$/.test(sn)) { setError("sn-error", "Enter a valid student number, such as 2023-00123."); valid = false; }
    if (!email.endsWith(ALLOWED_DOMAIN) || email.length <= ALLOWED_DOMAIN.length) {
      setError("email-error", "Use your university email ending in " + ALLOWED_DOMAIN + "."); valid = false;
    }
    if (!valid) return;

    const list = store.load(), event = EVENTS.find((e) => e.id === eventId);
    if (list.some((r) => r.eventId === eventId && (r.email === email || (r.studentNo || "").toLowerCase() === sn.toLowerCase()))) {
      status.className = "status bad"; status.textContent = "This email or student number is already registered for that event."; return;
    }
    if (count(eventId) >= event.capacity) {
      status.className = "status bad"; status.textContent = "Sorry, this event is fully booked."; return;
    }
    list.push({ eventId, name, studentNo: sn, email, at: new Date().toISOString() });
    store.save(list);
    $("success-text").textContent = name + ", your seat for " + event.title + " on " + fmt(event.date) + " is saved.";
    $("success-dialog").showModal();
    $("full-name").value = ""; $("student-number").value = ""; $("email").value = "";
    renderSummary();
  });
}

if (page === "attendees") {
  const sel = $("admin-event"), search = $("admin-search");
  sel.innerHTML = eventOptions(false);
  const currentEvent = () => EVENTS.find((x) => x.id === Number(sel.value));

  function render() {
    const all = store.load(), e = currentEvent(), q = search.value.trim().toLowerCase();
    const cap = EVENTS.reduce((n, x) => n + x.capacity, 0);
    $("stat-total").textContent = all.length;
    $("stat-events").textContent = EVENTS.length;
    $("stat-fill").textContent = (all.length / cap * 100).toFixed(1) + "%";
    const rows = all.filter((r) => r.eventId === e.id && (r.name + " " + (r.studentNo || "") + " " + r.email).toLowerCase().includes(q));
    $("attendee-count").textContent = count(e.id) + " of " + e.capacity + " seats taken" + (q ? " (" + rows.length + " match)" : "");
    $("attendee-rows").innerHTML = rows.length
      ? rows.map((r) => `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.studentNo || "-")}</td><td>${escapeHtml(r.email)}</td><td>${fmt(r.at)}</td>
          <td><button type="button" class="danger" data-email="${escapeHtml(r.email)}" aria-label="Remove ${escapeHtml(r.name)} from ${escapeHtml(e.title)}">Remove</button></td></tr>`).join("")
      : `<tr><td colspan="5">${all.length ? "No matching attendees." : "No registrations yet."}</td></tr>`;
  }

  sel.addEventListener("change", render);
  search.addEventListener("input", render);

  $("attendee-rows").addEventListener("click", (ev) => {
    const btn = ev.target.closest(".danger");
    if (!btn || !confirm("Remove this attendee from the event?")) return;
    const id = currentEvent().id;
    store.save(store.load().filter((r) => !(r.eventId === id && r.email === btn.dataset.email)));
    render();
  });

  $("export").addEventListener("click", () => {
    const e = currentEvent();
    // Prefix risky leading characters so spreadsheets do not run attendee text as a formula.
    const cell = (v) => { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    const lines = [["Name", "Student number", "Email", "Registered at"], ...store.load().filter((r) => r.eventId === e.id).map((r) => [r.name, r.studentNo || "", r.email, r.at])];
    const url = URL.createObjectURL(new Blob([lines.map((l) => l.map(cell).join(",")).join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "attendees-event-" + e.id + ".csv"; a.click();
    URL.revokeObjectURL(url);
  });

  render();
}
