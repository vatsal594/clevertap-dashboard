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

function buildQueryString() {
  const attr = document.getElementById("segment-attribute").value.trim();
  const val = document.getElementById("segment-value").value.trim();
  if (attr && val) return `${attr}=${val}`;
  return "";
}

async function updateLiveUserCount() {
  const query = buildQueryString();
  const countDiv = document.getElementById("live-user-count");
  if (!query) {
    countDiv.textContent = "";
    return;
  }
  const [field, value] = query.split("=").map((s) => s.trim());
  let ref = db.collection("users");
  if (field && value) ref = ref.where(field, "==", value);
  countDiv.textContent = "Loading...";
  try {
    const snap = await ref.get();
    countDiv.textContent = `${snap.size} users match this segment`;
  } catch (err) {
    countDiv.textContent = "Error loading user count";
  }
}

window.addEventListener("DOMContentLoaded", function () {
  const attr = document.getElementById("segment-attribute");
  const val = document.getElementById("segment-value");
  const tooltip = document.getElementById("query-builder-tooltip");
  if (attr && val) {
    attr.oninput = updateLiveUserCount;
    val.oninput = updateLiveUserCount;
    tooltip.innerHTML =
      "Tip: Select an attribute and enter a value to create a segment.";
  }
});

const segmentForm = document.getElementById("segment-form");
if (segmentForm) {
  segmentForm.onsubmit = async function (e) {
    e.preventDefault();
    const name = document.getElementById("segment-name")?.value.trim() || "";
    const query = buildQueryString();
    const feedback = document.getElementById("form-feedback");
    const btn = document.getElementById("create-segment-btn");
    const btnText = document.getElementById("create-segment-btn-text");
    const spinner = document.getElementById("create-segment-spinner");

    if (!name || !query) {
      feedback.textContent = "Please complete all fields.";
      feedback.className = "form-feedback error";
      showToast("Please complete all fields.", "error");
      return;
    }
    feedback.textContent = "";
    btn.disabled = true;
    btnText.style.display = "none";
    spinner.style.display = "inline-block";
    try {
      showLoadingSpinner();
      await db.collection("segments").add({
        name,
        query,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      segmentForm.reset();
      updateLiveUserCount();
      loadSegments();
      feedback.textContent = "Segment created successfully!";
      feedback.className = "form-feedback success";
      showToast("Segment created successfully!", "success");
      localStorage.setItem("segment-created", "true");
    } catch (error) {
      feedback.textContent = "Failed to create segment. Please try again.";
      feedback.className = "form-feedback error";
      showToast("Failed to create segment. Please try again.", "error");
    } finally {
      btn.disabled = false;
      btnText.style.display = "inline";
      spinner.style.display = "none";
      hideLoadingSpinner();
    }
  };
}

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
      let userCount = 0;
      if (seg.query) {
        const [field, value] = seg.query.split("=").map((s) => s.trim());
        let ref = db.collection("users");
        if (field && value) ref = ref.where(field, "==", value);
        const userSnap = await ref.get();
        userCount = userSnap.size;
      }
      html += `<li data-segment-id="${doc.id}" class="segment-list-item">
        <strong>${seg.name}</strong>
        <span class="segment-query">(${seg.query})</span>
        <span class="segment-user-count">${userCount} users</span>
      </li>`;
    }
    html += "</ul>";
    list.innerHTML = html;
  } catch (error) {
    list.innerHTML =
      "<h3>All Segments</h3><p>Error loading segments: " +
      error.message +
      "</p>";
  }
}

window.addEventListener("DOMContentLoaded", loadSegments);
