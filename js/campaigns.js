// js/campaigns.js
// Handles campaign creation and sending push notifications using FCM

// --- CAMPAIGN CREATION ---
const campaignForm = document.getElementById("campaign-form");
if (campaignForm) {
  campaignForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("campaign-title").value.trim();
    const message = document.getElementById("campaign-message").value.trim();
    const target = document.getElementById("campaign-segment").value.trim(); // userId or segment query
    if (!title || !message || !target) return;
    try {
      showLoadingSpinner();
      // Store campaign in Firestore
      await db.collection("campaigns").add({
        title,
        message,
        target,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      showToast(
        "Campaign created! (Push notification sending simulated in demo)",
        "success"
      );
      campaignForm.reset();
      loadCampaigns();
      localStorage.setItem("campaign-created", "true");
      // --- DEMO: Simulate sending notification ---
      // In production, use a backend (Cloud Function) to send to FCM tokens.
      // For demo, show how you would fetch tokens and log them:
      if (target.startsWith("user_")) {
        // Target is a userId
        const userId = target.replace("user_", "");
        const userDoc = await db.collection("users").doc(userId).get();
        if (userDoc.exists && userDoc.data().fcmToken) {
          console.log(
            "Would send notification to token:",
            userDoc.data().fcmToken
          );
        }
      } else {
        // Target is a segment query (e.g., gender=male)
        const filters = target
          .split(",")
          .map((pair) => pair.split("=").map((s) => s.trim()));
        let ref = db.collection("users");
        filters.forEach(([field, value]) => {
          if (field && value) ref = ref.where(field, "==", value);
        });
        const snapshot = await ref.get();
        snapshot.forEach((doc) => {
          const user = doc.data();
          if (user.fcmToken) {
            console.log("Would send notification to token:", user.fcmToken);
          }
        });
      }
    } catch (error) {
      showToast("Failed to create campaign: " + error.message, "error");
    } finally {
      hideLoadingSpinner();
    }
  });
}

// --- LIST ALL CAMPAIGNS ---
async function loadCampaigns() {
  const list = document.getElementById("campaign-list");
  if (!list) return;
  try {
    const snapshot = await db
      .collection("campaigns")
      .orderBy("createdAt", "desc")
      .get();
    if (snapshot.empty) {
      list.innerHTML = "<h3>All Campaigns</h3><p>No campaigns found.</p>";
      return;
    }
    let html = '<h3>All Campaigns</h3><ul style="list-style:none;padding:0;">';
    snapshot.forEach((doc) => {
      const camp = doc.data();
      html += `<li><strong>${camp.title}</strong> <span style=\"color:#888;\">(${camp.target})</span> - ${camp.message}</li>`;
    });
    html += "</ul>";
    list.innerHTML = html;
  } catch (error) {
    list.innerHTML =
      "<h3>All Campaigns</h3><p>Error loading campaigns: " +
      error.message +
      "</p>";
  }
}

// Load campaigns on page load
window.addEventListener("DOMContentLoaded", loadCampaigns);

/*
  --- IMPORTANT ---
  For real push notification delivery, you must use a backend (e.g., Firebase Cloud Function)
  to send messages to FCM tokens using the FCM Admin SDK. The frontend cannot send directly to FCM tokens for security reasons.
*/
