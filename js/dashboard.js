// js/dashboard.js
// Loads user profile info and engagement stats from Firestore

// Wait for Firebase Auth to be ready
// Show recent engagement stats for the current user
function showRecentEngagementStats(user) {
  db.collection("events")
    .where("userId", "==", user.uid)
    .orderBy("timestamp", "desc")
    .limit(5)
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        document.getElementById("engagement-stats").innerHTML =
          "<p>No recent events.</p>";
        return;
      }
      let html =
        '<h3>Recent Engagement</h3><ul style="list-style:none;padding:0;">';
      querySnapshot.forEach((doc) => {
        const event = doc.data();
        const date =
          event.timestamp && event.timestamp.toDate
            ? event.timestamp.toDate().toLocaleString()
            : "";
        html += `<li><strong>${event.eventType}</strong> <span style="color:#888;">${date}</span></li>`;
      });
      html += "</ul>";
      document.getElementById("engagement-stats").innerHTML = html;
    })
    .catch((error) => {
      document.getElementById("engagement-stats").innerHTML =
        "<p>Error loading events: " + error.message + "</p>";
    });
}

// --- FCM TOKEN REGISTRATION ---
async function registerFcmToken(user) {
  if (!window.messaging) return;
  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return;
    }
    // Get FCM token
    const token = await messaging.getToken({
      vapidKey:
        "BNaj1dwLgt8WZqNGcX3bBW8t_3gFEXIn5SORZq0HeFYyQ-dlU5SX_NgV7wYa89NaCItU3Elg3ywvez4OikNSBKU",
    });
    if (!token) {
      return;
    }
    // Log the FCM token for debugging
    console.log("FCM Token:", token);
    // Save token to Firestore user doc
    await db.collection("users").doc(user.uid).update({ fcmToken: token });
  } catch (error) {
    console.log("Error getting FCM token:", error);
  }
}

// --- CONTEXTUAL TIPS LOGIC ---
function showEventTrackerTooltip() {
  const trackerSection = document.getElementById("event-tracker");
  if (!trackerSection || document.getElementById("event-tooltip")) return;
  const tooltip = document.createElement("div");
  tooltip.id = "event-tooltip";
  tooltip.className = "contextual-tooltip";
  tooltip.innerHTML = "<span>Try tracking your first event here!</span>";
  trackerSection.style.position = "relative";
  tooltip.style.position = "absolute";
  tooltip.style.top = "-2.5em";
  tooltip.style.right = "0";
  trackerSection.appendChild(tooltip);
  setTimeout(() => {
    tooltip.remove();
  }, 6000);
}

function showAnalyticsBanner() {
  if (document.getElementById("analytics-banner")) return;
  const mainContent = document.querySelector(".main-content");
  const banner = document.createElement("div");
  banner.id = "analytics-banner";
  banner.className = "contextual-banner";
  banner.innerHTML =
    '<span>Explore your data in <a href="analytics.html">Analytics</a>!</span>';
  mainContent.insertBefore(banner, mainContent.firstChild);
  setTimeout(() => {
    banner.remove();
  }, 8000);
}
// --- END CONTEXTUAL TIPS LOGIC ---

// --- REMOVE ONBOARDING LOGIC ---
// (All onboarding modal logic and references removed)
// --- END REMOVE ONBOARDING LOGIC ---

// --- ONBOARDING CHECKLIST LOGIC ---
function updateOnboardingChecklist() {
  const checklist = document.getElementById("onboarding-checklist");
  if (!checklist) return;
  // Check completion from localStorage
  const profileDone = localStorage.getItem("onboarding-profile") === "true";
  const eventDone = localStorage.getItem("event-tracked") === "true";
  const analyticsDone = localStorage.getItem("analytics-visited") === "true";
  const campaignDone = localStorage.getItem("campaign-created") === "true";
  const segmentDone = localStorage.getItem("segment-created") === "true";
  // Mark steps
  function markStep(id, done) {
    const li = document.getElementById(id);
    if (!li) return;
    if (done) {
      li.classList.add("completed");
      li.querySelector(".checkmark").textContent = "✔️";
    } else {
      li.classList.remove("completed");
      li.querySelector(".checkmark").textContent = "";
    }
  }
  markStep("check-profile", profileDone);
  markStep("check-event", eventDone);
  markStep("check-analytics", analyticsDone);
  markStep("check-campaign", campaignDone);
  markStep("check-segment", segmentDone);
  // Show if not all done and not dismissed
  const allDone =
    profileDone && eventDone && analyticsDone && campaignDone && segmentDone;
  if (!allDone && !localStorage.getItem("onboarding-checklist-dismissed")) {
    checklist.style.display = "block";
  } else {
    checklist.style.display = "none";
  }
}
// Dismiss button
const checklistClose = document.getElementById("onboarding-checklist-close");
if (checklistClose) {
  checklistClose.onclick = function () {
    document.getElementById("onboarding-checklist").style.display = "none";
    localStorage.setItem("onboarding-checklist-dismissed", "true");
  };
}
// Update checklist on load and after onboarding actions
window.addEventListener("DOMContentLoaded", updateOnboardingChecklist);
window.addEventListener("storage", updateOnboardingChecklist);
// Also call after onboarding modal steps
// In onboarding logic, after profile completion:
// localStorage.setItem('onboarding-profile', 'true');
// In onboarding logic, after event tracked:
// localStorage.setItem('event-tracked', 'true');
// In onboarding logic, after analytics visited:
// localStorage.setItem('analytics-visited', 'true');
// In campaigns.js and segmentation.js, set 'campaign-created' and 'segment-created' in localStorage after first creation.
// --- END ONBOARDING CHECKLIST LOGIC ---

// --- PROFILE LOADING & NULL CHECKS ---
async function loadUserProfile(user) {
  if (!user) return null;
  const doc = await db.collection("users").doc(user.uid).get();
  const data = doc.data() || {};
  return {
    uid: user.uid,
    name: data.name || "",
    gender: data.gender || "",
    location: data.location || "",
    interest: data.interest || "",
    email: data.email || user.email || "",
    createdAt: data.createdAt || null,
    role: data.role || "user",
  };
}

// Example usage in dashboard: (replace old profile loading logic)
window.addEventListener("DOMContentLoaded", async () => {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return;
    const profile = await loadUserProfile(user);
    // Show profile info or prompt to complete profile
    const profileSection = document.getElementById("profile-info");
    if (profileSection) {
      if (!profile.gender || !profile.location || !profile.interest) {
        profileSection.innerHTML = `
          <div class="profile-incomplete-card" style="max-width:420px;margin:2em auto 0 auto;padding:2em 1.5em;background:#fff;border-radius:1.2em;box-shadow:0 2px 12px rgba(25,118,210,0.08);">
            <h3>Complete Your Profile</h3>
            <form id="complete-profile-form">
              <div style="margin-bottom:1em;">
                <label>Gender:<br><input id="profile-gender" type="text" value="${
                  profile.gender || ""
                }" style="width:100%;margin-bottom:0.5em;"></label>
              </div>
              <div style="margin-bottom:1em;">
                <label>Location:<br><input id="profile-location" type="text" value="${
                  profile.location || ""
                }" style="width:100%;margin-bottom:0.5em;"></label>
              </div>
              <div style="margin-bottom:1em;">
                <label>Interest:<br><input id="profile-interest" type="text" value="${
                  profile.interest || ""
                }" style="width:100%;margin-bottom:0.5em;"></label>
              </div>
              <button type="submit" class="cta-btn">Save</button>
            </form>
          </div>
        `;
        document.getElementById("complete-profile-form").onsubmit =
          async function (e) {
            e.preventDefault();
            const gender = document
              .getElementById("profile-gender")
              .value.trim();
            const location = document
              .getElementById("profile-location")
              .value.trim();
            const interest = document
              .getElementById("profile-interest")
              .value.trim();
            if (!gender || !location || !interest) {
              showToast("Please fill in all fields.", "error");
              return;
            }
            try {
              await db
                .collection("users")
                .doc(user.uid)
                .update({ gender, location, interest });
              showToast("Profile updated!", "success");
              // Reload profile info
              const updatedProfile = await loadUserProfile(user);
              profileSection.innerHTML = `<div class=\"profile-card\">
              <h3>Welcome, ${updatedProfile.name}!</h3>
              <p><strong>Gender:</strong> ${updatedProfile.gender}</p>
              <p><strong>Location:</strong> ${updatedProfile.location}</p>
              <p><strong>Interest:</strong> ${updatedProfile.interest}</p>
            </div>`;
            } catch (err) {
              showToast("Error updating profile: " + err.message, "error");
            }
          };
      } else {
        // Show profile card with Edit Details button
        profileSection.innerHTML = `<div class="profile-card">
          <h3>Welcome, ${profile.name}!</h3>
          <p><strong>Gender:</strong> ${profile.gender}</p>
          <p><strong>Location:</strong> ${profile.location}</p>
          <p><strong>Interest:</strong> ${profile.interest}</p>
          <button id="edit-profile-btn" class="cta-btn" style="margin-top:1.2em;">Edit Details</button>
        </div>`;
        // Add edit button logic
        document.getElementById("edit-profile-btn").onclick = function () {
          profileSection.innerHTML = `
            <div class="profile-incomplete-card" style="max-width:420px;margin:2em auto 0 auto;padding:2em 1.5em;background:#fff;border-radius:1.2em;box-shadow:0 2px 12px rgba(25,118,210,0.08);">
              <h3>Edit Your Details</h3>
              <form id="edit-profile-form">
                <div style="margin-bottom:1em;">
                  <label>Name:<br><input id="edit-profile-name" type="text" value="${
                    profile.name || ""
                  }" style="width:100%;margin-bottom:0.5em;"></label>
                </div>
                <div style="margin-bottom:1em;">
                  <label>Gender:<br><input id="edit-profile-gender" type="text" value="${
                    profile.gender || ""
                  }" style="width:100%;margin-bottom:0.5em;"></label>
                </div>
                <div style="margin-bottom:1em;">
                  <label>Location:<br><input id="edit-profile-location" type="text" value="${
                    profile.location || ""
                  }" style="width:100%;margin-bottom:0.5em;"></label>
                </div>
                <div style="margin-bottom:1em;">
                  <label>Interest:<br><input id="edit-profile-interest" type="text" value="${
                    profile.interest || ""
                  }" style="width:100%;margin-bottom:0.5em;"></label>
                </div>
                <button type="submit" class="cta-btn">Save</button>
                <button type="button" id="cancel-edit-profile" class="cta-btn cta-secondary" style="margin-left:0.7em;">Cancel</button>
              </form>
            </div>
          `;
          document.getElementById("edit-profile-form").onsubmit =
            async function (e) {
              e.preventDefault();
              const name = document
                .getElementById("edit-profile-name")
                .value.trim();
              const gender = document
                .getElementById("edit-profile-gender")
                .value.trim();
              const location = document
                .getElementById("edit-profile-location")
                .value.trim();
              const interest = document
                .getElementById("edit-profile-interest")
                .value.trim();
              if (!name || !gender || !location || !interest) {
                showToast("Please fill in all fields.", "error");
                return;
              }
              try {
                await db
                  .collection("users")
                  .doc(user.uid)
                  .update({ name, gender, location, interest });
                showToast("Profile updated!", "success");
                // Reload profile info
                const updatedProfile = await loadUserProfile(user);
                profileSection.innerHTML = `<div class=\"profile-card\">\n          <h3>Welcome, ${updatedProfile.name}!<\/h3>\n          <p><strong>Gender:<\/strong> ${updatedProfile.gender}<\/p>\n          <p><strong>Location:<\/strong> ${updatedProfile.location}<\/p>\n          <p><strong>Interest:<\/strong> ${updatedProfile.interest}<\/p>\n          <button id=\"edit-profile-btn\" class=\"cta-btn\" style=\"margin-top:1.2em;\">Edit Details<\/button>\n        <\/div>`;
                // Re-attach edit button logic
                document.getElementById("edit-profile-btn").onclick =
                  arguments.callee;
              } catch (err) {
                showToast("Error updating profile: " + err.message, "error");
              }
            };
          document.getElementById("cancel-edit-profile").onclick =
            async function () {
              // Reload profile info without saving
              const updatedProfile = await loadUserProfile(user);
              profileSection.innerHTML = `<div class=\"profile-card\">\n          <h3>Welcome, ${updatedProfile.name}!<\/h3>\n          <p><strong>Gender:<\/strong> ${updatedProfile.gender}<\/p>\n          <p><strong>Location:<\/strong> ${updatedProfile.location}<\/p>\n          <p><strong>Interest:<\/strong> ${updatedProfile.interest}<\/p>\n          <button id=\"edit-profile-btn\" class=\"cta-btn\" style=\"margin-top:1.2em;\">Edit Details<\/button>\n        <\/div>`;
              // Re-attach edit button logic
              document.getElementById("edit-profile-btn").onclick =
                arguments.callee;
            };
        };
      }
    }
    // Show recent engagement stats
    showRecentEngagementStats(user);
  });
});
// --- END PROFILE LOADING & NULL CHECKS ---

// Update onAuthStateChanged to also register FCM token
firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Register FCM token for push notifications
  registerFcmToken(user);

  // Get user profile from Firestore
  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      document.getElementById("profile-info").innerHTML =
        "<p>User profile not found.</p>";
      return;
    }
    const data = userDoc.data();
    document.getElementById("profile-info").innerHTML = `
      <h3>Your Profile</h3>
      <ul style="list-style:none;padding:0;">
        <li><strong>Name:</strong> ${data.name || ""}</li>
        <li><strong>Email:</strong> ${data.email || ""}</li>
        <li><strong>Gender:</strong> ${data.gender || ""}</li>
        <li><strong>Location:</strong> ${data.location || ""}</li>
        <li><strong>Interest:</strong> ${data.interest || ""}</li>
      </ul>
    `;
    // Show recent engagement stats
    showRecentEngagementStats(user);
  } catch (error) {
    document.getElementById("profile-info").innerHTML =
      "<p>Error loading profile: " + error.message + "</p>";
  }
});

// Logout button functionality
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      showLoadingSpinner();
      await auth.signOut();
      window.location.href = "auth.html";
    } catch (error) {
      showToast("Logout failed: " + error.message, "error");
    } finally {
      hideLoadingSpinner();
    }
  });
}
// Event tracker buttons
const eventButtons = document.querySelectorAll(
  "#event-tracker button[data-event]"
);
eventButtons.forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    const eventType = btn.getAttribute("data-event");
    try {
      showLoadingSpinner();
      await db.collection("events").add({
        userId: firebase.auth().currentUser.uid,
        eventType,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
      showToast("Event tracked!", "success");
    } catch (err) {
      showToast("Error tracking event: " + err.message, "error");
    } finally {
      hideLoadingSpinner();
    }
  });
});
