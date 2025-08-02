// js/dashboard.js
// Loads user profile info and engagement stats from Firestore

// Firebase initialization (make sure this is in your HTML before this file)
// const firebaseConfig = { ... };
// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();
// const auth = firebase.auth();
// const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;

// ====================== UTILITY FUNCTIONS ======================

function showLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.style.display = 'block';
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.style.display = 'none';
}

function showToast(message, type = 'info') {
  // Remove any existing toasts first
  const existingToasts = document.querySelectorAll('.toast-notification');
  existingToasts.forEach(toast => toast.remove());

  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ====================== CORE FUNCTIONALITY ======================

// Show recent engagement stats for the current user
function showRecentEngagementStats(user) {
  if (!user) return;

  db.collection("events")
    .where("userId", "==", user.uid)
    .orderBy("timestamp", "desc")
    .limit(5)
    .get()
    .then((querySnapshot) => {
      const statsContainer = document.getElementById("engagement-stats");
      if (!statsContainer) return;

      if (querySnapshot.empty) {
        statsContainer.innerHTML = "<p>No recent events.</p>";
        return;
      }

      let html = '<h3>Recent Engagement</h3><ul style="list-style:none;padding:0;">';
      querySnapshot.forEach((doc) => {
        const event = doc.data();
        const date = event.timestamp?.toDate?.().toLocaleString() || "";
        html += `<li><strong>${event.eventType}</strong> <span style="color:#888;">${date}</span></li>`;
      });
      html += "</ul>";
      statsContainer.innerHTML = html;
    })
    .catch((error) => {
      const statsContainer = document.getElementById("engagement-stats");
      if (statsContainer) {
        statsContainer.innerHTML = `<p>Error loading events: ${error.message}</p>`;
      }
    });
}

// Register FCM token for push notifications
async function registerFcmToken(user) {
  if (!window.messaging || !user) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const token = await messaging.getToken({
      vapidKey: "BNaj1dwLgt8WZqNGcX3bBW8t_3gFEXIn5SORZq0HeFYyQ-dlU5SX_NgV7wYa89NaCItU3Elg3ywvez4OikNSBKU",
    });

    if (token) {
      console.log("FCM Token:", token);
      await db.collection("users").doc(user.uid).update({ fcmToken: token });
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
  }
}

// ====================== PROFILE MANAGEMENT ======================

async function loadUserProfile(user) {
  if (!user) return null;

  try {
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
  } catch (error) {
    console.error("Error loading profile:", error);
    return null;
  }
}

function showProfileUI(profile, user) {
  const profileSection = document.getElementById("profile-info");
  if (!profileSection || !user) return;

  if (!profile.gender || !profile.location || !profile.interest) {
    renderProfileForm(profile, user, profileSection, true);
  } else {
    renderProfileView(profile, user, profileSection);
  }
}

function renderProfileView(profile, user, container) {
  container.innerHTML = `
    <div class="profile-card">
      <h3>Welcome, ${profile.name}!</h3>
      <p><strong>Gender:</strong> ${profile.gender}</p>
      <p><strong>Location:</strong> ${profile.location}</p>
      <p><strong>Interest:</strong> ${profile.interest}</p>
      <button id="edit-profile-btn" class="cta-btn" style="margin-top:1.2em;">Edit Details</button>
    </div>
  `;

  document.getElementById("edit-profile-btn").addEventListener("click", () => {
    renderProfileForm(profile, user, container, false);
  });
}

function renderProfileForm(profile, user, container, isInitialSetup) {
  container.innerHTML = `
    <div class="profile-incomplete-card" style="max-width:420px;margin:2em auto 0 auto;padding:2em 1.5em;background:#fff;border-radius:1.2em;box-shadow:0 2px 12px rgba(25,118,210,0.08);">
      <h3>${isInitialSetup ? 'Complete Your Profile' : 'Edit Your Details'}</h3>
      <form id="profile-form">
        ${!isInitialSetup ? `
          <div style="margin-bottom:1em;">
            <label>Name:<br><input id="profile-name" type="text" value="${profile.name || ''}" style="width:100%;margin-bottom:0.5em;"></label>
          </div>
        ` : ''}
        <div style="margin-bottom:1em;">
          <label>Gender:<br><input id="profile-gender" type="text" value="${profile.gender || ''}" style="width:100%;margin-bottom:0.5em;"></label>
        </div>
        <div style="margin-bottom:1em;">
          <label>Location:<br><input id="profile-location" type="text" value="${profile.location || ''}" style="width:100%;margin-bottom:0.5em;"></label>
        </div>
        <div style="margin-bottom:1em;">
          <label>Interest:<br><input id="profile-interest" type="text" value="${profile.interest || ''}" style="width:100%;margin-bottom:0.5em;"></label>
        </div>
        <button type="submit" class="cta-btn">Save</button>
        ${!isInitialSetup ? `
          <button type="button" id="cancel-profile-edit" class="cta-btn cta-secondary" style="margin-left:0.7em;">Cancel</button>
        ` : ''}
      </form>
    </div>
  `;

  const form = document.getElementById("profile-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const name = !isInitialSetup ? document.getElementById("profile-name").value.trim() : profile.name;
    const gender = document.getElementById("profile-gender").value.trim();
    const location = document.getElementById("profile-location").value.trim();
    const interest = document.getElementById("profile-interest").value.trim();

    if (!gender || !location || !interest || (!isInitialSetup && !name)) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    try {
      showLoadingSpinner();
      await db.collection("users").doc(user.uid).update({
        name,
        gender,
        location,
        interest
      });
      showToast("Profile updated!", "success");
      
      // Reload and show updated profile
      const updatedProfile = await loadUserProfile(user);
      renderProfileView(updatedProfile, user, container);
      
      // Update onboarding if this was initial setup
      if (isInitialSetup) {
        localStorage.setItem("onboarding-profile", "true");
        updateOnboardingChecklist();
      }
    } catch (err) {
      showToast("Error updating profile: " + err.message, "error");
    } finally {
      hideLoadingSpinner();
    }
  });

  if (!isInitialSetup) {
    document.getElementById("cancel-profile-edit").addEventListener("click", async () => {
      const updatedProfile = await loadUserProfile(user);
      renderProfileView(updatedProfile, user, container);
    });
  }
}

// ====================== EVENT TRACKING ======================

function setupEventTracking() {
  const trackerSection = document.getElementById("event-tracker");
  if (!trackerSection) return;

  // Clear existing listeners by cloning buttons
  const buttons = trackerSection.querySelectorAll("button[data-event]");
  buttons.forEach(button => {
    const newButton = button.cloneNode(true);
    button.replaceWith(newButton);
  });

  // Add fresh event listeners
  trackerSection.querySelectorAll("button[data-event]").forEach(button => {
    button.addEventListener("click", async () => {
      const eventType = button.getAttribute("data-event");
      if (!eventType) return;

      try {
        showLoadingSpinner();
        await db.collection("events").add({
          userId: firebase.auth().currentUser?.uid,
          eventType,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        
        showToast("Event tracked!", "success");
        
        // Update recent events display
        if (firebase.auth().currentUser) {
          showRecentEngagementStats(firebase.auth().currentUser);
        }
        
        // Update onboarding checklist
        localStorage.setItem("event-tracked", "true");
        updateOnboardingChecklist();
      } catch (err) {
        showToast("Error tracking event: " + err.message, "error");
      } finally {
        hideLoadingSpinner();
      }
    });
  });
}

// ====================== ONBOARDING CHECKLIST ======================

function updateOnboardingChecklist() {
  const checklist = document.getElementById("onboarding-checklist");
  if (!checklist) return;

  const profileDone = localStorage.getItem("onboarding-profile") === "true";
  const eventDone = localStorage.getItem("event-tracked") === "true";
  const analyticsDone = localStorage.getItem("analytics-visited") === "true";
  const campaignDone = localStorage.getItem("campaign-created") === "true";
  const segmentDone = localStorage.getItem("segment-created") === "true";

  function markStep(id, done) {
    const li = document.getElementById(id);
    if (!li) return;
    li.classList.toggle("completed", done);
    li.querySelector(".checkmark").textContent = done ? "✔️" : "";
  }

  markStep("check-profile", profileDone);
  markStep("check-event", eventDone);
  markStep("check-analytics", analyticsDone);
  markStep("check-campaign", campaignDone);
  markStep("check-segment", segmentDone);

  const allDone = profileDone && eventDone && analyticsDone && campaignDone && segmentDone;
  const isDismissed = localStorage.getItem("onboarding-checklist-dismissed") === "true";
  
  checklist.style.display = (allDone || isDismissed) ? "none" : "block";
}

function setupOnboardingChecklist() {
  const closeButton = document.getElementById("onboarding-checklist-close");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      document.getElementById("onboarding-checklist").style.display = "none";
      localStorage.setItem("onboarding-checklist-dismissed", "true");
    });
  }
}

// ====================== MAIN INITIALIZATION ======================

function initializeDashboard() {
  // Set up logout button
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

  // Set up auth state listener
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "auth.html";
      return;
    }

    try {
      // Register FCM token
      await registerFcmToken(user);

      // Load and display profile
      const profile = await loadUserProfile(user);
      showProfileUI(profile, user);

      // Set up other components
      showRecentEngagementStats(user);
      setupEventTracking();
      updateOnboardingChecklist();
      setupOnboardingChecklist();
    } catch (error) {
      console.error("Initialization error:", error);
      showToast("Error initializing dashboard", "error");
    }
  });
}

// Start the application when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeDashboard);