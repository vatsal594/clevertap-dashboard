// js/admin.js
// Loads admin panel data: users, campaigns, segments

// --- ADMIN PANEL: Load all users, campaigns, and segments ---
async function loadAdminPanel() {
  // Users
  const usersDiv = document.getElementById("admin-users");
  if (usersDiv) {
    try {
      const usersSnap = await db.collection("users").get();
      if (usersSnap.empty) {
        usersDiv.innerHTML =
          "<h3><span class='material-icons' style='vertical-align:middle;'>group</span> All Users</h3><div class='admin-empty-state'>No users found.</div>";
      } else {
        let html =
          "<h3><span class='material-icons' style='vertical-align:middle;'>group</span> All Users</h3><div style='flex:1 1 0;display:flex;flex-direction:column;'><ul style='list-style:none;padding:0;'>";
        usersSnap.forEach((doc) => {
          const u = doc.data();
          const initials = (u.name || u.email || "U")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
          html += `<li>
            <div class='admin-user-info' style='flex:1 1 0;'>
              <div class='admin-avatar' title='User'>${initials}</div>
              <div class='admin-user-details'>
                <div class='admin-user-name' title='${
                  u.name || u.email || "User"
                }'>${u.name || "(No Name)"}</div>
                <div class='admin-user-meta'>${u.email || ""} ${
            u.gender ? "| " + u.gender : ""
          } ${u.location ? "| " + u.location : ""} ${
            u.interest ? "| " + u.interest : ""
          }</div>
                <div class='admin-token-row'>
                  <span style='font-size:0.93em;color:#888;'>FCM Token:</span>
                  <input type='text' class='admin-token-field' value='${
                    u.fcmToken || "-"
                  }' readonly id='fcm-token-${doc.id}' title='${
            u.fcmToken || "-"
          }'>
                  <button class='copy-fcm-token' data-token-id='${
                    doc.id
                  }' aria-label='Copy FCM token'><span class='material-icons' style='font-size:1.1em;'>content_copy</span></button>
                  <button class='admin-delete-user' data-id='${
                    doc.id
                  }' aria-label='Delete user'><span class='material-icons'>delete</span></button>
                </div>
              </div>
            </div>
          </li>`;
        });
        html += "</ul></div>";
        usersDiv.innerHTML = html;
      }
    } catch (error) {
      usersDiv.innerHTML =
        "<h3><span class='material-icons' style='vertical-align:middle;'>group</span> All Users</h3><p>Error loading users: " +
        error.message +
        "</p>";
    }
  }
  // Add copy-to-clipboard functionality for FCM tokens
  document.querySelectorAll(".copy-fcm-token").forEach((btn) => {
    btn.addEventListener("click", function () {
      const tokenId = btn.getAttribute("data-token-id");
      const input = document.getElementById("fcm-token-" + tokenId);
      if (input) {
        input.select();
        document.execCommand("copy");
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = "Copy";
        }, 1200);
        if (typeof showToast === "function") {
          showToast("FCM token copied to clipboard!", "success");
        }
      }
    });
  });
  // Campaigns
  const campaignsDiv = document.getElementById("admin-campaigns");
  if (campaignsDiv) {
    try {
      const campSnap = await db
        .collection("campaigns")
        .orderBy("createdAt", "desc")
        .get();
      if (campSnap.empty) {
        campaignsDiv.innerHTML =
          "<h3><span class='material-icons' style='vertical-align:middle;'>campaign</span> All Campaigns</h3><div class='admin-empty-state'>No campaigns found.</div>";
      } else {
        let html =
          "<h3><span class='material-icons' style='vertical-align:middle;'>campaign</span> All Campaigns</h3><ul style='list-style:none;padding:0;'>";
        campSnap.forEach((doc) => {
          const c = doc.data();
          html += `<li>
            <div style='display:flex;align-items:center;gap:0.7em;flex:1 1 0;'>
              <span class='material-icons' style='color:var(--primary);font-size:1.3em;'>campaign</span>
              <div style='flex:1 1 0;'>
                <strong style='color:var(--primary-dark);font-size:1.07em;'>${
                  c.title || ""
                }</strong>
                <span class='admin-campaign-badge' title='Target'>${
                  c.target || "-"
                }</span>
                <div style='color:#789;font-size:0.98em;margin-top:0.2em;'>${
                  c.message || ""
                }</div>
              </div>
            </div>
            <div style='display:flex;align-items:center;gap:0.3em;margin-top:0.5em;'>
              <button class='admin-copy-campaign-tokens' data-campaign-id='${
                doc.id
              }' aria-label='Copy all FCM tokens' style='background:none;border:none;box-shadow:none;padding:0.2em 0.4em;border-radius:6px;cursor:pointer;'><span class='material-icons' style='font-size:1.1em;'>content_copy</span></button>
              <button class='admin-delete-campaign' data-id='${
                doc.id
              }' aria-label='Delete campaign'><span class='material-icons'>delete</span></button>
            </div>
          </li>`;
        });
        html += "</ul>";
        campaignsDiv.innerHTML = html;
        // Attach copy event listeners after rendering
        document
          .querySelectorAll(".admin-copy-campaign-tokens")
          .forEach((btn) => {
            btn.addEventListener("click", async function () {
              const campaignId = btn.getAttribute("data-campaign-id");
              // Find the campaign doc
              const campDoc = await db
                .collection("campaigns")
                .doc(campaignId)
                .get();
              if (!campDoc.exists) return;
              const c = campDoc.data();
              let tokens = [];
              if (c.target && c.target.startsWith("user_")) {
                // Single user
                const userId = c.target.replace("user_", "");
                const userDoc = await db.collection("users").doc(userId).get();
                if (userDoc.exists && userDoc.data().fcmToken) {
                  tokens.push(userDoc.data().fcmToken);
                }
              } else if (c.target) {
                // Segment
                const filters = c.target
                  .split(",")
                  .map((pair) => pair.split("=").map((s) => s.trim()));
                let ref = db.collection("users");
                filters.forEach(([field, value]) => {
                  if (field && value) ref = ref.where(field, "==", value);
                });
                const snapshot = await ref.get();
                snapshot.forEach((doc) => {
                  const user = doc.data();
                  if (user.fcmToken) tokens.push(user.fcmToken);
                });
              }
              if (tokens.length) {
                try {
                  await navigator.clipboard.writeText(tokens.join(", "));
                  btn.innerHTML =
                    '<span class="material-icons" style="font-size:1.1em;">check</span>';
                  setTimeout(() => {
                    btn.innerHTML =
                      '<span class="material-icons" style="font-size:1.1em;">content_copy</span>';
                  }, 1200);
                  if (typeof showToast === "function") {
                    showToast("All FCM tokens copied!", "success");
                  }
                } catch (err) {
                  if (typeof showToast === "function") {
                    showToast("Failed to copy tokens.", "error");
                  }
                }
              } else {
                if (typeof showToast === "function") {
                  showToast("No FCM tokens found for this campaign.", "info");
                }
              }
            });
          });
      }
    } catch (error) {
      campaignsDiv.innerHTML =
        "<h3><span class='material-icons' style='vertical-align:middle;'>campaign</span> All Campaigns</h3><p>Error loading campaigns: " +
        error.message +
        "</p>";
    }
  }
  // Segments
  const segmentsDiv = document.getElementById("admin-segments");
  if (segmentsDiv) {
    try {
      const segSnap = await db
        .collection("segments")
        .orderBy("createdAt", "desc")
        .get();
      if (segSnap.empty) {
        segmentsDiv.innerHTML =
          "<h3><span class='material-icons' style='vertical-align:middle;'>segment</span> All Segments</h3><div class='admin-empty-state'>No segments found.</div>";
      } else {
        let html =
          "<h3><span class='material-icons' style='vertical-align:middle;'>segment</span> All Segments</h3><ul style='list-style:none;padding:0;'>";
        segSnap.forEach((doc) => {
          const s = doc.data();
          html += `<li>
            <div class='admin-segment-header'>
              <strong style='color:var(--primary-dark);font-size:1.07em;'>${
                s.name || ""
              }</strong>
              <span class='admin-segment-badge' title='Filters'>${
                s.filters ? JSON.stringify(s.filters) : s.query || "-"
              }</span>
              <span class='admin-segment-user-count'><b>Users:</b> ${
                s.userCount || 0
              }</span>
            </div>
            <div class='admin-segment-actions'>
              <button class='admin-check-users-btn' data-segment-id='${
                doc.id
              }'>Check Users</button>
              <button class='admin-send-segment-notification' data-fcm-tokens='${
                s.fcmTokens && s.fcmTokens.length ? s.fcmTokens.join(",") : ""
              }' style='background:var(--primary);color:#fff;border:none;padding:0.4em 1em;border-radius:6px;cursor:pointer;'>Send Notification</button>
              <button class='admin-delete-segment' data-id='${
                doc.id
              }' aria-label='Delete segment'><span class='material-icons'>delete</span></button>
            </div>
            <div class='admin-segment-users' id='segment-users-${
              doc.id
            }' style='display:none;'><b>User Details:</b> ${
            s.users && s.users.length
              ? `<ul style='list-style:none;padding:0;margin:0;'>${s.users
                  .map(
                    (u) =>
                      `<li>${u.name || "(No Name)"} &lt;${
                        u.email || "-"
                      }&gt;</li>`
                  )
                  .join("")}</ul>`
              : "-"
          }</div>
          </li>`;
        });
        html += "</ul>";
        segmentsDiv.innerHTML = html;
        // Attach event listeners for segment actions after rendering
        document.querySelectorAll(".admin-check-users-btn").forEach((btn) => {
          btn.addEventListener("click", function () {
            const segId = btn.getAttribute("data-segment-id");
            const usersDiv = document.getElementById("segment-users-" + segId);
            if (!usersDiv) return;
            if (usersDiv.style.display === "none") {
              usersDiv.style.display = "block";
              btn.textContent = "Hide Users";
            } else {
              usersDiv.style.display = "none";
              btn.textContent = "Check Users";
            }
          });
        });
        document
          .querySelectorAll(".admin-send-segment-notification")
          .forEach((btn) => {
            btn.addEventListener("click", function () {
              const tokens = btn.getAttribute("data-fcm-tokens");
              if (!tokens) {
                showToast("No FCM tokens for this segment.", "info");
                return;
              }
              console.log("FCM tokens for this segment:", tokens.split(","));
              showToast("FCM tokens logged to console.", "info");
            });
          });
      }
    } catch (error) {
      segmentsDiv.innerHTML =
        "<h3><span class='material-icons' style='vertical-align:middle;'>segment</span> All Segments</h3><p>Error loading segments: " +
        error.message +
        "</p>";
    }
  }
  // Add delete button listeners
  document.querySelectorAll(".admin-delete-user").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Delete this user? This cannot be undone.")) {
        await db.collection("users").doc(btn.getAttribute("data-id")).delete();
        loadAdminPanel();
      }
    });
  });
  document.querySelectorAll(".admin-delete-campaign").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Delete this campaign?")) {
        await db
          .collection("campaigns")
          .doc(btn.getAttribute("data-id"))
          .delete();
        loadAdminPanel();
      }
    });
  });
  document.querySelectorAll(".admin-delete-segment").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Delete this segment?")) {
        await db
          .collection("segments")
          .doc(btn.getAttribute("data-id"))
          .delete();
        loadAdminPanel();
      }
    });
  });
}

// Restrict access to authenticated users with admin role
firebase.auth().onAuthStateChanged(async (user) => {
  let message = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;">
    <span class=\"material-icons\" style=\"font-size:3em;color:#d32f2f;margin-bottom:0.5em;\">block</span>
    <h2>Access Denied</h2>
    <p>You can't access this page as you are not an admin.<br>
    Please log in with an admin account, or feel free to explore the other features of our website!</p>
    <a href=\"dashboard.html\" style=\"margin-top:1.5em;display:inline-block;padding:0.7em 2em;background:var(--primary);color:#fff;border-radius:1.5em;text-decoration:none;font-weight:600;box-shadow:0 2px 8px rgba(25,118,210,0.10);\">Go to Dashboard</a>
  </div>`;
  if (!user) {
    document.body.innerHTML = message;
    return;
  }
  // Fetch user doc and check role
  const userDoc = await db.collection("users").doc(user.uid).get();
  if (!userDoc.exists || userDoc.data().role !== "admin") {
    // Show access denied message
    document.body.innerHTML = message;
    return;
  }
  loadAdminPanel();
});
