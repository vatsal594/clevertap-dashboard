// js/segmentation.js
// Handles segment creation and querying users/events from Firestore

function showToast(message, type = "info") {
  Toastify({
    text: message,
    duration: 3500,
    gravity: "top",
    position: "right",
    close: true,
    style: {
      background:
        type === "success"
          ? "var(--primary)"
          : type === "error"
          ? "#d32f2f"
          : "#fff",
      color:
        type === "success" ? "#fff" : type === "error" ? "#fff" : "var(--text)",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(25, 118, 210, 0.10)",
      fontWeight: 500,
      fontFamily: "Roboto, Poppins, sans-serif",
      fontSize: "1em",
      padding: "0.8em 1.5em",
    },
    stopOnFocus: true,
  }).showToast();
}

// --- QUERY BUILDER UI AND LIVE USER COUNT ---
function buildQueryString() {
  const rows = document.querySelectorAll(".query-condition-row");
  let queryParts = [];
  rows.forEach((row) => {
    const attr = row.querySelector(".query-attribute").value.trim();
    const val = row.querySelector(".query-value").value.trim();
    if (attr && val) queryParts.push(`${attr}=${val}`);
  });
  return queryParts.join(",");
}

async function updateLiveUserCount() {
  const query = buildQueryString();
  const countDiv = document.getElementById("live-user-count");
  if (!query) {
    countDiv.textContent = "";
    return;
  }
  // Build Firestore query
  const filters = query
    .split(",")
    .map((pair) => pair.split("=").map((s) => s.trim()));
  let ref = db.collection("users");
  filters.forEach(([field, value]) => {
    if (field && value) ref = ref.where(field, "==", value);
  });
  const snap = await ref.get();
  countDiv.textContent = `${snap.size} users match this segment`;
}

function addConditionRow() {
  const row = document.createElement("div");
  row.className = "query-condition-row";
  row.innerHTML = `
    <select class="query-attribute" required>
      <option value="">Select attribute</option>
      <option value="gender">Gender</option>
      <option value="location">Location</option>
      <option value="interest">Interest</option>
      <option value="email">Email</option>
      <option value="name">Name</option>
    </select>
    <span style="margin:0 0.3em;">=</span>
    <input type="text" class="query-value" placeholder="Value" required style="width:120px;">
    <button type="button" class="remove-condition-btn" title="Remove condition">&times;</button>
  `;
  document.getElementById("query-builder").appendChild(row);
  row.querySelector(".remove-condition-btn").onclick = function () {
    row.remove();
    updateLiveUserCount();
    updateRemoveButtons();
  };
  row.querySelector(".query-attribute").oninput = updateLiveUserCount;
  row.querySelector(".query-value").oninput = updateLiveUserCount;
  updateRemoveButtons();
}

function updateRemoveButtons() {
  const rows = document.querySelectorAll(".query-condition-row");
  rows.forEach((row, idx) => {
    const btn = row.querySelector(".remove-condition-btn");
    btn.style.display = rows.length > 1 ? "" : "none";
  });
}

window.addEventListener("DOMContentLoaded", function () {
  // Query builder logic
  const builder = document.getElementById("query-builder");
  const addBtn = document.getElementById("add-condition-btn");
  const tooltip = document.getElementById("query-builder-tooltip");
  if (builder && addBtn) {
    addBtn.onclick = function () {
      addConditionRow();
    };
    builder.querySelector(".query-attribute").oninput = updateLiveUserCount;
    builder.querySelector(".query-value").oninput = updateLiveUserCount;
    updateRemoveButtons();
    tooltip.innerHTML =
      "Tip: Add multiple conditions for precise targeting. All conditions are combined with AND.";
  }
});
// --- SEGMENT FORM SUBMIT: BUILD QUERY FROM UI ---
const segmentForm = document.getElementById("segment-form");
if (segmentForm) {
  segmentForm.onsubmit = async function (e) {
    e.preventDefault();
    const name = document.getElementById("segment-name")
      ? document.getElementById("segment-name").value.trim()
      : "";
    const query = buildQueryString();
    if (!name || !query) {
      showToast("Please complete all fields.", "error");
      return;
    }
    try {
      showLoadingSpinner();
      await db.collection("segments").add({
        name,
        query,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      segmentForm.reset();
      loadSegments();
      showToast("Segment created successfully!", "success");
      localStorage.setItem("segment-created", "true");
    } catch (error) {
      showToast("Failed to create segment. Please try again.", "error");
    } finally {
      hideLoadingSpinner();
    }
  };
}

// --- LIST ALL SEGMENTS ---
async function loadSegments() {
  const list = document.getElementById("segment-list");
  if (!list) return;
  try {
    const snapshot = await db
      .collection("segments")
      .orderBy("createdAt", "desc")
      .get();
    if (snapshot.empty) {
      list.innerHTML = "<h3>All Segments</h3><p>No segments found.</p>";
      return;
    }
    let html =
      '<h3>All Segments</h3><ul id="segment-list-ul" style="list-style:none;padding:0;">';
    for (const doc of snapshot.docs) {
      const seg = doc.data();
      // Count users matching this segment
      let userCount = 0;
      if (seg.query) {
        const filters = seg.query
          .split(",")
          .map((pair) => pair.split("=").map((s) => s.trim()));
        let ref = db.collection("users");
        filters.forEach(([field, value]) => {
          if (field && value) ref = ref.where(field, "==", value);
        });
        const userSnap = await ref.get();
        userCount = userSnap.size;
      }
      html += `<li data-segment-id="${doc.id}"><strong>${
        seg.name
      }</strong> <span style=\"color:#888;\">(${
        seg.query
      })</span> <span style=\"color:#1976d2;font-weight:600;margin-left:0.5em;\">${userCount} users</span> <button class=\"view-users-btn\" data-segment-id=\"${
        doc.id
      }\" data-query=\"${seg.query.replace(
        /"/g,
        "&quot;"
      )}\">View Users</button><div class='segment-users-inline' style='display:none;'></div></li>`;
    }
    html += "</ul>";
    list.innerHTML = html;

    // Inline user list logic
    document.querySelectorAll(".view-users-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        // Get the target segment and container
        const queryStr = btn.getAttribute("data-query");
        const filters = queryStr
          .split(",")
          .map((pair) => pair.split("=").map((s) => s.trim()));
        let ref = db.collection("users");
        filters.forEach(([field, value]) => {
          if (field && value) ref = ref.where(field, "==", value);
        });
        const userSnap = await ref.get();
        let usersHtml = `<div class='segment-inline-card' style='background:#fff;border-radius:12px;box-shadow:0 1px 6px rgba(25,118,210,0.07);padding:1.2em 1.3em;margin-top:1em;'>`;
        usersHtml += `<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:1em;'><span style='font-weight:600;color:var(--primary-dark);font-size:1.08em;'>Users in Segment</span>`;
        if (!userSnap.empty) {
          usersHtml += `<button id='export-segment-users-csv' style='background:var(--primary);color:#fff;border:none;border-radius:7px;padding:0.4em 1.1em;font-size:0.98em;font-weight:600;cursor:pointer;transition:background 0.18s;'>Export to CSV</button>`;
        }
        usersHtml += `</div>`;
        if (userSnap.empty) {
          usersHtml += `<p style='color:#789;'>No users found for this segment.</p>`;
        } else {
          usersHtml += `<ul style='list-style:none;padding:0;margin:0;'>`;
          userSnap.forEach((uDoc) => {
            const u = uDoc.data();
            const initials = (u.name || u.email || "U")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .substring(0, 2)
              .toUpperCase();
            usersHtml += `<li style='margin-bottom:0.7em;display:flex;align-items:center;gap:0.7em;background:#f8fafc;border-radius:8px;padding:0.7em 1em;box-shadow:0 1px 4px rgba(25,118,210,0.06);'><span class='segment-user-avatar'>${initials}</span><div><strong>${
              u.name || u.email || "(No Name)"
            }</strong><br><span style='color:#789;font-size:0.97em;'>${
              u.email || ""
            } ${u.gender ? "| " + u.gender : ""} ${
              u.location ? "| " + u.location : ""
            } ${u.interest ? "| " + u.interest : ""}</span></div></li>`;
          });
          usersHtml += `</ul>`;
        }
        usersHtml += `</div>`;
        // Show in the dedicated section below all segments
        const selectedSection = document.getElementById(
          "selected-segment-users"
        );
        if (selectedSection) {
          selectedSection.innerHTML = usersHtml;
        }
        // Export to CSV functionality
        const exportBtn = document.getElementById("export-segment-users-csv");
        if (exportBtn) {
          exportBtn.onclick = function () {
            let csv = "Name,Email,Gender,Location,Interest\n";
            userSnap.forEach((uDoc) => {
              const u = uDoc.data();
              csv += `"${u.name || ""}","${u.email || ""}","${
                u.gender || ""
              }","${u.location || ""}","${u.interest || ""}"\n`;
            });
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "segment-users.csv";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          };
        }
      });
    });
  } catch (error) {
    list.innerHTML =
      "<h3>All Segments</h3><p>Error loading segments: " +
      error.message +
      "</p>";
  }
}

// --- SHOW USERS FOR SEGMENT ---
async function showUsersForSegment(queryStr) {
  const usersDiv = document.getElementById("segment-users");
  if (!usersDiv) return;
  // Parse query string (e.g., gender=male,location=Delhi)
  const filters = queryStr
    .split(",")
    .map((pair) => pair.split("=").map((s) => s.trim()));
  let ref = db.collection("users");
  filters.forEach(([field, value]) => {
    if (field && value) ref = ref.where(field, "==", value);
  });
  try {
    const snapshot = await ref.get();
    if (snapshot.empty) {
      usersDiv.innerHTML =
        "<h4>Matching Users</h4><p>No users found for this segment.</p>";
      return;
    }
    let html = '<h4>Matching Users</h4><ul style="list-style:none;padding:0;">';
    snapshot.forEach((doc) => {
      const user = doc.data();
      html += `<li><strong>${user.name || ""}</strong> (${
        user.email || ""
      }) - ${user.gender || ""}, ${user.location || ""}, ${
        user.interest || ""
      }</li>`;
    });
    html += "</ul>";
    usersDiv.innerHTML = html;
  } catch (error) {
    usersDiv.innerHTML =
      "<h4>Matching Users</h4><p>Error: " + error.message + "</p>";
  }
}

// Load segments on page load
window.addEventListener("DOMContentLoaded", loadSegments);
