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

      // Get users matching the segment criteria
      const [field, value] = query.split("=").map((s) => s.trim());
      let usersQuery = db.collection("users");
      if (field && value) usersQuery = usersQuery.where(field, "==", value);
      const usersSnap = await usersQuery.get();

      // Extract user data with FCM tokens
      const users = [];
      const fcmTokens = [];
      usersSnap.forEach((doc) => {
        const user = doc.data();
        if (user.fcmToken) {
          fcmTokens.push(user.fcmToken);
        }
        users.push({
          id: doc.id,
          name: user.name,
          email: user.email,
          fcmToken: user.fcmToken || null,
        });
      });

      // Create the segment with user data
      await db.collection("segments").add({
        name,
        query,
        filters: { [field]: value },
        userCount: usersSnap.size,
        users: users,
        fcmTokens: fcmTokens,
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
      html += `<li data-segment-id="${doc.id}" class="segment-list-item">
        <div class="segment-header">
          <strong>${seg.name}</strong>
          <span class="segment-query">(${seg.query})</span>
          <span class="segment-user-count">${seg.userCount || 0} users</span>
        </div>
        <div class="segment-actions">
          <button class="copy-segment-tokens" data-segment-id="${doc.id}" 
            title="Copy FCM tokens for this segment">
            <span class="material-icons" style="font-size:1.1em;">content_copy</span> Copy Tokens
          </button>
          <button class="view-segment-users" data-segment-id="${doc.id}">
            View Users
          </button>
        </div>
        <div class="segment-users-details" id="segment-users-${
          doc.id
        }" style="display:none;">
          ${
            seg.users && seg.users.length
              ? `<ul style="list-style:none;padding:0;">
              ${seg.users
                .map(
                  (user) => `
                <li>
                  ${user.name || "(No Name)"} - ${user.email || "No Email"}
                  ${
                    user.fcmToken
                      ? `<span class="user-token" title="${user.fcmToken}">
                      (Token available)
                    </span>`
                      : `<span class="no-token">(No token)</span>`
                  }
                </li>
              `
                )
                .join("")}
            </ul>`
              : "<p>No users in this segment</p>"
          }
        </div>
      </li>`;
    }
    html += "</ul>";
    list.innerHTML = html;

    // Add event listeners for the new buttons
    document.querySelectorAll(".copy-segment-tokens").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const segmentId = btn.getAttribute("data-segment-id");
        const segmentDoc = await db.collection("segments").doc(segmentId).get();
        if (!segmentDoc.exists) return;

        const segment = segmentDoc.data();
        const tokens = segment.fcmTokens || [];

        if (tokens.length === 0) {
          showToast("No FCM tokens found for this segment", "info");
          return;
        }

        try {
          await navigator.clipboard.writeText(tokens.join(", "));
          showToast(`${tokens.length} FCM tokens copied!`, "success");
          btn.innerHTML =
            '<span class="material-icons" style="font-size:1.1em;">check</span> Copied!';
          setTimeout(() => {
            btn.innerHTML =
              '<span class="material-icons" style="font-size:1.1em;">content_copy</span> Copy Tokens';
          }, 2000);
        } catch (err) {
          showToast("Failed to copy tokens", "error");
          console.error("Failed to copy tokens:", err);
        }
      });
    });

    document.querySelectorAll(".view-segment-users").forEach((btn) => {
      btn.addEventListener("click", function () {
        const segmentId = btn.getAttribute("data-segment-id");
        const usersDiv = document.getElementById(`segment-users-${segmentId}`);
        if (usersDiv.style.display === "none") {
          usersDiv.style.display = "block";
          btn.textContent = "Hide Users";
        } else {
          usersDiv.style.display = "none";
          btn.textContent = "View Users";
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

window.addEventListener("DOMContentLoaded", loadSegments);
