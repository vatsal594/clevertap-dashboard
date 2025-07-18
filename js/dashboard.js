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
      console.log("Notification permission not granted");
      return;
    }
    // Get FCM token
    const token = await messaging.getToken({
      vapidKey:
        "BNaj1dwLgt8WZqNGcX3bBW8t_3gFEXIn5SORZq0HeFYyQ-dlU5SX_NgV7wYa89NaCItU3Elg3ywvez4OikNSBKU",
    });
    if (!token) {
      console.log("No FCM token received");
      return;
    }
    // Save token to Firestore user doc
    await db.collection("users").doc(user.uid).update({ fcmToken: token });
    console.log("FCM token saved to Firestore:", token);
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

// --- ONBOARDING LOGIC ---
function isProfileComplete(data) {
  return data.name && data.gender && data.location && data.interest;
}

function showOnboardingModal(startStep = 1) {
  const modal = document.getElementById("onboarding-modal");
  const content = document.getElementById("onboarding-content");
  const nextBtn = document.getElementById("onboarding-next");
  const closeBtn = document.getElementById("onboarding-close");
  const helpBtn = document.getElementById("onboarding-help");
  const step1Status = document.getElementById("step1-status");
  const step2Status = document.getElementById("step2-status");
  const step3Status = document.getElementById("step3-status");
  let currentStep = startStep;
  let profileData = null;
  let eventTracked = false;
  let analyticsVisited = false;

  // Helper to update progress/checks
  function updateProgress() {
    step1Status.textContent = isProfileComplete(profileData) ? "✔️" : "";
    step2Status.textContent = eventTracked ? "✔️" : "";
    step3Status.textContent = analyticsVisited ? "✔️" : "";
  }

  // Helper to render step content
  function renderStep(step) {
    updateProgress();
    if (step === 1) {
      content.innerHTML = `
        <div style="text-align:left;">
          <p>Let’s complete your profile for a personalized experience.</p>
          <label>Name:<br><input id="onboard-name" type="text" value="${
            profileData.name || ""
          }" style="width:100%;margin-bottom:0.5em;"></label><br>
          <label>Gender:<br><input id="onboard-gender" type="text" value="${
            profileData.gender || ""
          }" style="width:100%;margin-bottom:0.5em;"></label><br>
          <label>Location:<br><input id="onboard-location" type="text" value="${
            profileData.location || ""
          }" style="width:100%;margin-bottom:0.5em;"></label><br>
          <label>Interest:<br><input id="onboard-interest" type="text" value="${
            profileData.interest || ""
          }" style="width:100%;margin-bottom:0.5em;"></label>
        </div>
      `;
      nextBtn.textContent = isProfileComplete(profileData)
        ? "Next"
        : "Save & Next";
    } else if (step === 2) {
      content.innerHTML = `
        <p>Track your first event! Click a button below to send an event:</p>
        <button class="onboarding-event-btn" data-event="button_click">Button Click</button>
        <button class="onboarding-event-btn" data-event="page_view">Page View</button>
        <button class="onboarding-event-btn" data-event="product_view">Product View</button>
        <div id="onboarding-event-status" style="margin-top:0.7em;"></div>
      `;
      nextBtn.textContent = eventTracked ? "Next" : "Track Event";
      // Show event tracker tooltip if not already tracked
      if (!eventTracked && !localStorage.getItem("event-tracked")) {
        setTimeout(showEventTrackerTooltip, 500);
      }
    } else if (step === 3) {
      content.innerHTML = `
        <p>Explore your analytics! <a href="analytics.html" target="_blank">Open Analytics Page</a></p>
        <div id="onboarding-analytics-status" style="margin-top:0.7em;"></div>
      `;
      nextBtn.textContent = "Finish";
      // Show analytics banner if not already visited
      if (!analyticsVisited && !localStorage.getItem("analytics-visited")) {
        setTimeout(showAnalyticsBanner, 500);
      }
    }
  }

  // Step navigation
  function goToStep(step) {
    currentStep = step;
    renderStep(step);
  }

  // Next button logic
  nextBtn.onclick = async function () {
    if (currentStep === 1) {
      // Save profile
      const name = document.getElementById("onboard-name").value.trim();
      const gender = document.getElementById("onboard-gender").value.trim();
      const location = document.getElementById("onboard-location").value.trim();
      const interest = document.getElementById("onboard-interest").value.trim();
      profileData = { ...profileData, name, gender, location, interest };
      if (!isProfileComplete(profileData)) {
        showToast("Please complete all fields.", "error");
        return;
      }
      // Save to Firestore
      try {
        await db
          .collection("users")
          .doc(profileData.uid)
          .update({ name, gender, location, interest });
        showToast("Profile updated!", "success");
      } catch (e) {
        showToast("Error saving profile: " + e.message, "error");
        return;
      }
      goToStep(2);
      // Show event tracker tooltip after profile completion
      if (!eventTracked && !localStorage.getItem("event-tracked")) {
        setTimeout(showEventTrackerTooltip, 500);
      }
    } else if (currentStep === 2) {
      if (!eventTracked) {
        showToast("Please track an event to continue.", "error");
        return;
      }
      localStorage.setItem("event-tracked", "true");
      goToStep(3);
      // Show analytics banner after event tracked
      if (!analyticsVisited && !localStorage.getItem("analytics-visited")) {
        setTimeout(showAnalyticsBanner, 500);
      }
    } else if (currentStep === 3) {
      analyticsVisited = true;
      localStorage.setItem("analytics-visited", "true");
      updateProgress();
      modal.style.display = "none";
      localStorage.setItem("onboarding-complete", "true");
      showToast("Onboarding complete! 🎉", "success");
    }
  };

  // Event tracking logic for onboarding
  content.onclick = async function (e) {
    if (e.target.classList.contains("onboarding-event-btn")) {
      const eventType = e.target.getAttribute("data-event");
      try {
        await db.collection("events").add({
          userId: profileData.uid,
          eventType,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        eventTracked = true;
        document.getElementById("onboarding-event-status").textContent =
          "Event tracked! ✔️";
        updateProgress();
        nextBtn.textContent = "Next";
        showToast("Event tracked!", "success");
      } catch (err) {
        showToast("Error tracking event: " + err.message, "error");
      }
    }
  };

  // Analytics step: detect if user visits analytics page
  if (currentStep === 3) {
    window.addEventListener("focus", function handler() {
      if (window.location.pathname.endsWith("dashboard.html")) {
        analyticsVisited = true;
        updateProgress();
        document.getElementById("onboarding-analytics-status").textContent =
          "Analytics visited! ✔️";
        window.removeEventListener("focus", handler);
      }
    });
  }

  // Close modal logic
  closeBtn.onclick = function () {
    modal.style.display = "none";
  };
  // Help button logic
  helpBtn.onclick = function () {
    modal.style.display = "flex";
    goToStep(1);
  };

  // Show modal
  modal.style.display = "flex";
  goToStep(currentStep);
}

// --- END ONBOARDING LOGIC ---

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
    // Show onboarding if profile incomplete and not already completed
    if (
      !isProfileComplete({ ...data, uid: user.uid }) &&
      !localStorage.getItem("onboarding-complete")
    ) {
      showOnboardingModal(1);
    }
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
const eventButtons = document.querySelectorAll('#event-tracker button[data-event]');
eventButtons.forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const eventType = btn.getAttribute('data-event');
    try {
      showLoadingSpinner();
      await db.collection('events').add({
        userId: firebase.auth().currentUser.uid,
        eventType,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
      showToast('Event tracked!', 'success');
    } catch (err) {
      showToast('Error tracking event: ' + err.message, 'error');
    } finally {
      hideLoadingSpinner();
    }
  });
});
