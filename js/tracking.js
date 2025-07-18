// js/tracking.js
// Handles event tracking and logging to Firestore

// Wait for Firebase Auth to be ready
firebase.auth().onAuthStateChanged((user) => {
  if (!user) return; // Only track events for logged-in users

  // Listen for clicks on event tracker buttons
  document
    .querySelectorAll("#event-tracker button[data-event]")
    .forEach((btn) => {
      btn.addEventListener("click", async () => {
        const eventType = btn.getAttribute("data-event");
        try {
          await db.collection("events").add({
            userId: user.uid,
            eventType: eventType,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          });
          showToast("Event tracked!", "success");
        } catch (error) {
          showToast("Failed to track event.", "error");
        }
      });
    });
});
