const timerOut = 1500;
const start = 3;
const loaderDash = document.querySelector('.loading-interface-dash');

// Show loader on cold start only (skip on page reload / Ctrl+R)
document.addEventListener('DOMContentLoaded', () => {
  try {
    const shownKey = 'attendy_loader_shown';
    // sessionStorage persists for the window/tab and is cleared when the window is closed.
    if (!sessionStorage.getItem(shownKey)) {
      // show loader for configured `start` seconds then hide
      loaderin();
      setTimeout(() => {
        loaderout();
        try { sessionStorage.setItem(shownKey, '1'); } catch (e) { /* ignore */ }
      }, start * 1000);
    }
  } catch (e) {
    console.warn('Loader session logic failed', e);
  }
});


async function loaderin() {
  loaderDash.style.opacity = '1';
  loaderDash.style.zIndex = '3';
}
async function loaderout() {
  loaderDash.style.opacity = '0';
  loaderDash.style.zIndex = '1';
}

let currentUser = null;


// Show confirm modal when user clicks logout
document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();
  showConfirmDelete();
});

// Modal controls
function showConfirmDelete() {
  const modal = document.getElementById('confirm-sign-out-modal');
  if (!modal) return;
  modal.style.display = 'flex';
}

function hideConfirmDelete() {
  const modal = document.getElementById('confirm-sign-out-modal');
  if (!modal) return;
  modal.style.display = 'none';
}

async function performDeleteAndLogout() {
  try {
    const user = await window.attendyAPI.getSession();
    if (user && user.username) {
      try {
        await window.attendyAPI.deleteUser(user.username);
        // deleteUser already removes associated attendance rows on the server
      } catch (e) {
        console.warn('deleteUser failed', e);
      }
    }
  } catch (e) {
    console.warn('Could not get session for delete on logout', e);
  }
  // refresh the attendance table so the UI reflects the deletion
  try {
    if (typeof loadTable === 'function') {
      await loadTable();
      // small pause so the user can see the cleared table before logout
      await new Promise(res => setTimeout(res, 350));
    }
  } catch (e) {
    console.warn('Could not refresh table after delete', e);
  }

  await window.attendyAPI.logout();
}

// wire modal buttons
document.addEventListener('DOMContentLoaded', () => {
  const noBtn = document.getElementById('confirm-sign-out-no');
  const yesBtn = document.getElementById('confirm-sign-out-yes');
  const modal = document.getElementById('confirm-sign-out-modal');
  if (noBtn) noBtn.addEventListener('click', () => hideConfirmDelete());
  if (yesBtn) yesBtn.addEventListener('click', async () => {
    // perform deletion and logout

    hideConfirmDelete();
    loaderin();
    await new Promise(resolve => setTimeout(resolve, timerOut));

    await performDeleteAndLogout();
  });
  // click outside to cancel
  if (modal) modal.addEventListener('click', (ev) => {
    if (ev.target === modal) hideConfirmDelete();
  });
});

(async () => {
  const user = await window.attendyAPI.getSession();
  if (!user) location.reload(); // fallback

  // Display user full name, username, and email
  // email part will come soon if we have a server to connect email and send some kind of verification
  //if ther is no email display it as Unknown
  // the fact that its almost optional for users to have an email unless working on a company/School to save attendance records and retrieve on the cloud on their personal server
  document.querySelector('#fullname').innerText = user.fullname;
  document.querySelector('#username').innerText = "@" + user.username;
  document.querySelector('#email').innerText = user.email || "Unregistered User";
  document.querySelector('#fullname2').innerText = user.fullname;
  document.querySelector('#username2').innerText = "@" + user.username;
  document.querySelector('#email2').innerText = user.email || "Unregistered User";

  document.getElementById('welcome').innerText = user.fullname;

  const qr = await window.attendyAPI.generateQR(user);
  document.getElementById("qr-image").src = `data:image/png;base64,${qr.qr_base64}`;

  // Apply role-based UI visibility
  try {
    applyRoleUI(user.role);
  } catch (e) {
    console.warn('applyRoleUI error', e);
  }

  // store current user and wire navigation buttons
  try {
    currentUser = user;
    const dashBtn = document.getElementById('dashboard');
    const attendBtn = document.getElementById('attendance');
    const teacherBtn = document.getElementById('teachers');

    // Helper to set active navigation button styling
    function setActiveNav(btnEl) {
      try {
        document.querySelectorAll('.boto-Nav').forEach(n => n.classList.remove('on-page'));
        if (btnEl && btnEl.classList) btnEl.classList.add('on-page');
      } catch (e) { /* ignore */ }
    }

    function showDashboardView() {
      // restore role-based stats and attendance table visibility
      applyRoleUI(currentUser.role);
      // ensure calendar hidden
      const cal = document.querySelector('.calendar-container'); if (cal) cal.style.display = 'none';
      // make sure attendance table container visibility follows role
      const att = document.querySelector('.attendance-table-container');
      if (att) att.style.display = (currentUser.role && currentUser.role.toLowerCase() === 'teacher') ? 'flex' : 'none';
    }

    function showAttendanceCalendarView() {
      // hide stats
      document.querySelectorAll('.user-stat-student, .user-stat-teacher').forEach(el => el.style.display = 'none');
      // hide attendance table
      const att = document.querySelector('.attendance-table-container'); if (att) att.style.display = 'none';
      // show calendar container
      const cal = document.querySelector('.calendar-container'); if (cal) cal.style.display = 'block';

      document.querySelector('.sub-dashboard-container').style.justifyContent = 'flex-start';
    }
    if (dashBtn) dashBtn.addEventListener('click', (e) => { e.preventDefault(); setActiveNav(dashBtn); showDashboardView(); });
    if (attendBtn) attendBtn.addEventListener('click', (e) => { e.preventDefault(); setActiveNav(attendBtn); showAttendanceCalendarView(); });
    if (teacherBtn) {
      // teacher page not available yet — disable the button visually
      teacherBtn.setAttribute('aria-disabled', 'true');
      teacherBtn.style.opacity = '0.5';
      teacherBtn.style.pointerEvents = 'none';
    }
  } catch (e) {
    console.warn('Navigation binding failed', e);
  }


})();

//This part is for the user to open up their profile with the QR Code and info
document.querySelector("#theUser").addEventListener("click", openInfo);
document.querySelector('#close-USER').addEventListener("click", closeInfo);
async function openInfo() {
  const userCheck = document.querySelector('#theUser-hover');
  // the button yes
  userCheck.classList.add('on-click');
}
async function closeInfo() {
  const userCheck = document.querySelector('#theUser-hover');
  // the button yes
  userCheck.classList.remove('on-click');
  // stop scanner when overlay is closed
  ensureScannerState();
}


const ActiveCam = document.querySelector('#camera-active');
const ActiveQR = document.querySelector('#QR-active');

const qrContainer = document.querySelector('.user-info');
const camContainer = document.querySelector('.CAMERA-container');

ActiveCam.addEventListener('click', () => {
  camContainer.classList.add('active');
  qrContainer.classList.remove('active');

  ActiveCam.classList.remove('active');
  ActiveQR.classList.add('active');
  // start scanner if overlay is open and camera container visible
  ensureScannerState();
});

ActiveQR.addEventListener('click', () => {
  camContainer.classList.remove('active');
  qrContainer.classList.add('active');

  ActiveCam.classList.add('active');
  ActiveQR.classList.remove('active');
  // stop scanner when camera view is hidden
  ensureScannerState();
});

//Holy shit
function updateStatus(id, status) {
  window.attendyAPI.updateAttendance(id, status).then(() => loadTable());
}

function loadTable() {

  fetch("http://localhost:5005/get_attendance")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#attendance-table tbody");
      tbody.innerHTML = "";

      // Display today's date for attendance summary
      try {
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        document.querySelectorAll('#date-time-attendance-table, #date-of-attendance').forEach(el => { if (el) el.innerText = dateStr; });
      } catch (e) { /* ignore */ }

      // Compute summary counts for statuses
      try {
        let presentCount = 0, lateCount = 0, excusedCount = 0, absentCount = 0;
        if (Array.isArray(data)) {
          data.forEach(r => {
            const s = (r.status || '').toString().toLowerCase();
            if (s.includes('present')) presentCount++;
            else if (s.includes('late')) lateCount++;
            else if (s.includes('excuse') || s.includes('excused')) excusedCount++;
            else if (s.includes('absent')) absentCount++;
          });
        }
        // set all matching stat elements (there are duplicates in student/teacher panes)
        document.querySelectorAll('#present-statT').forEach(el => { el.innerText = presentCount; });
        document.querySelectorAll('#late-statT').forEach(el => { el.innerText = lateCount; });
        document.querySelectorAll('#excuse-statT').forEach(el => { el.innerText = excusedCount; });
        document.querySelectorAll('#absent-statT').forEach(el => { el.innerText = absentCount; });
      } catch (e) {
        console.warn('Failed to compute attendance summary', e);
      }

      // helper to find username field from server response
      function findUsername(r) {
        return r.student_username || r.username || r.user || r.u || '';
      }

      // helper to format timestamp from several possible field names
      function formatTimestamp(r) {
        const ts = r.timestamp || r.time || r.recorded_at || r.created_at || r.scanned_at || r.time_stamp || r.date;
        if (!ts) return '';
        let d = new Date(ts);
        if (isNaN(d.getTime())) {
          // maybe it's a unix seconds number (or a string of seconds)
          if (typeof ts === 'number') d = new Date(ts * 1000);
          else if (!isNaN(parseInt(ts))) d = new Date(parseInt(ts) * 1000);
        }
        if (isNaN(d.getTime())) return String(ts);
        // Format as DD/MM/YYYY, HH:MM:SS in 24-hour format using user's locale
        const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        return d.toLocaleString(undefined, options);
      }

      data.forEach(row => {
        const fullname = row.student_fullname || row.fullname || row.name || '';
        const username = findUsername(row);
        const timeIn = row.time_in || row.timestamp || row.scanned_at || row.created_at || '';
        const timeOut = row.time_out || '';
        const timestamp = formatTimestamp({ timestamp: timeIn });
        const formattedOut = formatTimestamp({ timestamp: timeOut });
        const status = row.status || '';

        tbody.innerHTML += `
          <tr>
            <td><input type="checkbox" class="row-select" data-id="${row.id}"></td>
            <td><button class="trash-btn" data-id="${row.id}" title="Delete row">🗑️</button></td>
            <td>${fullname}</td>
            <td>${username}</td>
            <td>
              <select class="times-select">
                <option class="option-time">Time In: ${timestamp}</option>
                <option class="option-time">Time Out: ${formattedOut || 'Not set'}</option>
              </select>
            </td>
            <td>${status}</td>
            <td>
              <select onchange="updateStatus(${row.id}, this.value)">
                <option ${status === "Present" ? "selected" : ""}>Present</option>
                <option ${status === "Late" ? "selected" : ""}>Late</option>
                <option ${status === "Excused" ? "selected" : ""}>Excused</option>
                <option ${status === "Absent" ? "selected" : ""}>Absent</option>
              </select>
            </td>
          </tr>`;
      });

      // wire trash buttons and table controls
      setTimeout(() => {
        document.querySelectorAll('.trash-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = btn.getAttribute('data-id');
            if (!id) return;
            if (!confirm('Delete this attendance row? This cannot be undone.')) return;
            try {
              const res = await window.attendyAPI.deleteAttendanceRow(Number(id));
              if (res && res.ok) await loadTable();
              else alert('Delete failed');
            } catch (err) {
              console.error('Failed to delete row', err);
              alert('Delete failed');
            }
          });
        });

        // enable/disable download button based on whether there are rows
        try {
          const dl = document.getElementById('download-xlsx-btn');
          if (dl) dl.disabled = !(Array.isArray(data) && data.length > 0);
        } catch (e) {
          // ignore
        }

        // select-all control
        const selectAll = document.getElementById('select-all-rows');
        if (selectAll) {
          selectAll.checked = false;
          selectAll.addEventListener('change', (ev) => {
            const checked = ev.target.checked;
            document.querySelectorAll('.row-select').forEach(cb => cb.checked = checked);
          });
        }

        // apply timeout bulk
        const applyBtn = document.getElementById('apply-timeout-btn');
        const timeInput = document.getElementById('timeout-time');
        if (applyBtn && timeInput) {
          applyBtn.addEventListener('click', async () => {
            const timeVal = timeInput.value;
            if (!timeVal) return alert('Select a time first');
            // build ISO time using today's date + selected time
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');
            const iso = new Date(`${y}-${m}-${d}T${timeVal}:00`).toISOString();

            const ids = Array.from(document.querySelectorAll('.row-select:checked')).map(cb => Number(cb.getAttribute('data-id'))).filter(Boolean);
            if (!ids.length) return alert('No rows selected');
            try {
              const res = await window.attendyAPI.setTimeoutForRows(ids, iso);
              if (res && res.ok) {
                await loadTable();
              } else {
                alert('Failed to set timeouts');
              }
            } catch (e) {
              console.error('Failed to set timeouts', e);
              alert('Failed to set timeouts');
            }
          });
        }

        // mark excused (single or multiple)
        const excuseBtn = document.getElementById('set-excuse-btn');
        if (excuseBtn) {
          excuseBtn.addEventListener('click', async () => {
            const ids = Array.from(document.querySelectorAll('.row-select:checked')).map(cb => Number(cb.getAttribute('data-id'))).filter(Boolean);
            if (!ids.length) return alert('No rows selected');
            try {
              for (const id of ids) {
                await window.attendyAPI.setTimeoutForRow(id, new Date().toISOString(), 'Excused');
              }
              await loadTable();
            } catch (e) {
              console.error('Failed to mark excused', e);
              alert('Failed to mark excused');
            }
          });
        }
      }, 50);

      // Will display if the Table is empty
      if (!data || !Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = `
    <tr>
      <td colspan="7" style="
        text-align: center;
        padding: 15px;
        color: #000000ff;
        font-style: italic;
      ">
        Oh? no students are recorded yet, try scanning one!
      </td>
    </tr>
  `;
        return; // Stop execution so it won't try to render rows
      }

    });


}

loadTable();

// Create download and delete controls for attendance table (if not present)
function ensureAttendanceControls() {
  const table = document.getElementById('attendance-table');
  if (!table) return;
  if (document.getElementById('attendance-controls')) return; // already added

  const controls = document.querySelector('#button-downlaod');

  const downloadBtn = document.querySelector('#download-xlsx-btn')
  downloadBtn.addEventListener('click', downloadAttendanceXLSX);
}

async function downloadAttendanceXLSX() {
  try {
    const res = await fetch('http://localhost:5005/get_attendance');
    const rows = await res.json();
    if (!Array.isArray(rows)) return;

    if (!rows.length) {
      alert('No attendance records to export.');
      return;
    }

    function fmtTime(ts) {
      if (!ts) return '';
      try {
        let d = new Date(ts);
        if (isNaN(d.getTime())) {
          if (typeof ts === 'number') d = new Date(ts * 1000);
          else if (!isNaN(parseInt(ts))) d = new Date(parseInt(ts) * 1000);
        }
        if (isNaN(d.getTime())) return String(ts);
        // use user's locale, short date + time
        return d.toLocaleString();
      } catch (e) {
        return String(ts);
      }
    }

    const data = rows.map(r => ({
      Fullname: r.student_fullname || r.fullname || r.name || '',
      Username: r.student_username || r.username || '',
      "Time In": fmtTime(r.time_in || r.timestamp || ''),
      "Time Out": fmtTime(r.time_out || ''),
      Status: r.status || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    // writeFile will trigger a download in the browser/electron renderer
    XLSX.writeFile(wb, 'attendance.xlsx');
  } catch (e) {
    console.error('Failed to export XLSX', e);
    alert('Export failed');
  }
}

// disable download when no rows; loadTable will toggle this button

// ensure controls exist after initial load
ensureAttendanceControls();

// Calendar helpers: load attendance for a given date and render present students
async function loadAttendanceForDateString(dateStr) {
  if (!dateStr) return;
  try {
    const res = await fetch('http://localhost:5005/get_attendance');
    const rows = await res.json();
    if (!Array.isArray(rows)) return;
    const target = new Date(dateStr);
    const ty = target.getFullYear(), tm = target.getMonth(), td = target.getDate();
    const filtered = rows.filter(r => {
      const ts = r.time_in || r.timestamp || r.scanned_at || r.created_at || '';
      if (!ts) return false;
      const d = new Date(ts);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === ty && d.getMonth() === tm && d.getDate() === td && (r.status || '').toString().toLowerCase().includes('present');
    });
    const tbody = document.querySelector('#calendar-attendance-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:12px; color:#666">No present students for this date.</td></tr>';
      return;
    }
    filtered.forEach(r => {
      const name = r.student_fullname || r.fullname || r.name || '';
      const uname = r.student_username || r.username || '';
      const fmt = (ts) => { try { const d = new Date(ts); return isNaN(d.getTime()) ? String(ts) : d.toLocaleString(); } catch (e) { return String(ts); } };
      const tin = fmt(r.time_in || r.timestamp || '');
      const tout = fmt(r.time_out || '');
      tbody.innerHTML += `<tr><td>${name}</td><td>${uname}</td><td>${tin}</td><td>${tout}</td><td>${r.status || ''}</td></tr>`;
    });
  } catch (e) {
    console.error('Failed to load attendance for date', e);
  }
}

// Wire calendar controls after DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('attendance-date');
  const showBtn = document.getElementById('show-date-attendance');
  if (showBtn && dateInput) {
    showBtn.addEventListener('click', () => {
      if (!dateInput.value) return alert('Pick a date first');
      loadAttendanceForDateString(dateInput.value);
    });
  }
  // Listen for theme/settings changes from other windows and refresh if needed
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('attendy_channel');
      bc.addEventListener('message', (ev) => {
        try {
          const msg = ev.data || {};
          if (msg.type === 'theme-changed' || msg.type === 'settings-closed') {
            // reload the dashboard to ensure styles and UI reflect changes
            // Only reload if this script is running in the dashboard window
            if (document && document.location && (document.location.pathname || '').includes('dashboard.html')) {
              location.reload();
            } else {
              // if not sure, attempt gentle refresh of theme only
              if (window.attendyTheme && window.attendyTheme.applyTheme) {
                window.attendyTheme.applyTheme(window.attendyTheme.getTheme && window.attendyTheme.getTheme());
              }
            }
          }
        } catch (e) { /* ignore */ }
      });
    }
  } catch (e) { /* ignore */ }
});

// Scanner state variables and helpers
let html5QrCode = null;
let currentCameraId = null;
let isScannerRunning = false;
let lastScanned = null;

async function startScanner() {
  if (isScannerRunning) return;
  if (typeof Html5Qrcode === 'undefined') {
    console.warn('Html5Qrcode library not loaded yet.');
    return;
  }
  try {
    if (!html5QrCode) html5QrCode = new Html5Qrcode('reader');
    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length) {
      // prefer previously selected camera id if available
      const availableIds = devices.map(d => d.id);
      if (currentCameraId && availableIds.includes(currentCameraId)) {
        // keep currentCameraId
      } else {
        currentCameraId = devices[0].id;
      }
      await html5QrCode.start(
        currentCameraId,
        { fps: 10, qrbox: 250 },
        async qrCodeMessage => {
          const el = document.getElementById('scan-result');

          // Try to parse JSON payload first
          let parsed = null;
          try {
            parsed = JSON.parse(qrCodeMessage);
          } catch (e) {
            parsed = null;
          }

          // If parsed object exists, require fullname and username
          if (parsed && typeof parsed === 'object') {
            const fullname = parsed.fullname || parsed.name || null;
            const username = parsed.username || parsed.user || null;
            const role = parsed.role || null;

            if (!fullname || !username) {
              if (el) el.innerText = 'Ignored: QR missing fullname or username.';
              return;
            }

            // If scanned user's role is teacher, ignore and notify
            if (role && role.toString().toLowerCase() === 'teacher') {
              if (el) el.innerText = `${fullname} is a teacher — scan ignored.`;
              return;
            }

            const scannedId = username || qrCodeMessage;
            if (lastScanned === scannedId) return; // ignore quick duplicates
            lastScanned = scannedId;
            setTimeout(() => { if (lastScanned === scannedId) lastScanned = null; }, 3000);

            // Prevent duplicate fullname reuse: check existing attendance records for same fullname
            try {
              const res = await fetch('http://localhost:5005/get_attendance');
              const rows = await res.json();
              if (Array.isArray(rows)) {
                const exists = rows.some(r => {
                  const n = (r.student_fullname || r.fullname || r.name || '').toString().trim().toLowerCase();
                  return n && n === fullname.toString().trim().toLowerCase();
                });
                if (exists) {
                  if (el) el.innerText = `Ignored: fullname '${fullname}' already exists.`;
                  return;
                }
              }
            } catch (e) {
              console.warn('Failed to validate duplicate fullname', e);
            }

            // Show friendly message instead of raw JSON
            if (el) el.innerText = `${fullname} has been scanned`;

            // include time_in at scan moment
            const time_in = new Date().toISOString();

            try {
              await window.attendyAPI.recordAttendance({ fullname, username, role, time_in });
              loadTable();
            } catch (err) {
              console.error('Failed to record attendance:', err);
              if (el) el.innerText = 'Error: failed to record attendance';
            }
            return;
          }

          // Not JSON: detect URLs/links and ignore them
          const isUrl = /^(https?:\/\/)/i.test(qrCodeMessage) || /\.[a-z]{2,}(\/|$)/i.test(qrCodeMessage);
          if (isUrl) {
            if (el) el.innerText = 'Ignored: external link detected.';
            return;
          }

          // Otherwise ignore unsupported payloads
          if (el) el.innerText = 'Ignored: unsupported QR payload.';
        },
        errorMessage => {
          // ignore
        }
      );
      isScannerRunning = true;
    }
  } catch (e) {
    console.error('Failed to start scanner:', e);
  }
}

function stopScanner() {
  if (!isScannerRunning || !html5QrCode) return;
  html5QrCode.stop().then(() => {
    isScannerRunning = false;
  }).catch(err => {
    console.error('Failed to stop scanner:', err);
  });
}

function ensureScannerState() {
  const overlay = document.querySelector('#theUser-hover');
  const overlayOpen = overlay && overlay.classList.contains('on-click');
  const camActive = camContainer && camContainer.classList.contains('active');
  if (overlayOpen && camActive) {
    startScanner();
  } else {
    stopScanner();
  }
}
// Camera UI helpers
function populateCameraList() {
  const select = document.getElementById('camera-select');
  if (!select) return;
  select.innerHTML = '';
  if (typeof Html5Qrcode === 'undefined') return;
  Html5Qrcode.getCameras().then(devices => {
    devices.forEach(dev => {
      const opt = document.createElement('option');
      opt.value = dev.id;
      opt.text = dev.label || dev.id;
      select.appendChild(opt);
    });
    // pick first by default
    if (devices.length) {
      select.value = devices[0].id;
      currentCameraId = devices[0].id;
    }
  }).catch(err => console.error('Failed to list cameras:', err));
}

// No manual start/stop UI: scanning is automatic based on overlay and camera view

// Wire up camera controls once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Html5Qrcode === 'undefined') {
    // still populate when available; library is loaded before dash.js in index
    console.warn('Html5Qrcode library not available at DOMContentLoaded.');
  }

  populateCameraList();

  const select = document.getElementById('camera-select');
  if (select) {
    select.addEventListener('change', (e) => {
      currentCameraId = e.target.value;
      if (isScannerRunning) {
        // restart with new camera
        stopScanner();
        // small delay to ensure camera release
        setTimeout(() => startScanner(), 350);
      }
    });
  }

  // Ensure scanner state when overlay visibility changes
  const observer = new MutationObserver(() => ensureScannerState());
  const overlay = document.querySelector('#theUser-hover');
  if (overlay) observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });

  // initial camera list populated; scanner will auto-start when overlay/camera become active
});

// Role-based UI helper
function applyRoleUI(role) {
  const r = (role || '').toString().toLowerCase();
  const isTeacher = r === 'teacher';

  // boto-NavRole: show to teachers only
  document.querySelectorAll('.boto-NavRole').forEach(el => {
    el.style.display = isTeacher ? 'block' : 'none';
  });

  // teacher-container: visible only for teachers
  document.querySelectorAll('.teacher-container').forEach(el => {
    el.style.display = isTeacher ? 'block' : 'none';
  });

  // user-stat: visible for students, hidden for teachers
  document.querySelectorAll('.user-stat-student').forEach(el => {
    el.style.display = isTeacher ? 'none' : 'flex';
    document.querySelector('.user-stat-teacher').style.display = isTeacher ? 'flex' : 'none';
  });

  // attendance-table: visible for teachers only
  const attendance = document.querySelector('.attendance-table-container');
  if (attendance) attendance.style.display = isTeacher ? 'flex' : 'none';

  // QR/CAMER activation: camera visible IF teacher IF NOT then QR visible
  if (isTeacher) {
    camContainer.classList.add('active');
    qrContainer.classList.remove('active');
    ActiveQR.classList.add('active');
    ActiveCam.classList.remove('active');
  } else {
    camContainer.classList.remove('active');
    qrContainer.classList.add('active');
    ActiveQR.classList.remove('active');
    ActiveCam.classList.add('active');
  }
}

document.getElementById('setting').addEventListener('click', () => {
  window.attendyAPI.opensetting();
});

document.getElementById('support').addEventListener('click', () => {
  window.attendyAPI.opensupport();
});
