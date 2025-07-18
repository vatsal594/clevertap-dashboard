// js/analytics.js
// Analytics view: active users, events per day, conversion funnel, retention

// --- Chart.js setup helpers ---
const chartInstances = {};
function renderChart(ctxId, type, data, options) {
  if (chartInstances[ctxId]) {
    chartInstances[ctxId].destroy();
  }
  const ctx = document.getElementById(ctxId).getContext("2d");
  chartInstances[ctxId] = new Chart(ctx, { type, data, options });
}

// --- Fetch and display active users (last 7 days) ---
async function showActiveUsers() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const users = {};
  const snapshot = await db
    .collection("events")
    .where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(weekAgo))
    .get();
  snapshot.forEach((doc) => {
    users[doc.data().userId] = true;
  });
  const count = Object.keys(users).length;
  renderChart(
    "activeUsersChart",
    "doughnut",
    {
      labels: ["Active Users", "Inactive"],
      datasets: [{ data: [count, 0], backgroundColor: ["#232946", "#eebbc3"] }],
    },
    { responsive: true, plugins: { legend: { display: true } } }
  );
}

// --- Fetch and display events per day (last 7 days) ---
async function showEventsPerDay() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const days = [];
  const dayCounts = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo);
    d.setDate(weekAgo.getDate() + i);
    const label = d.toLocaleDateString();
    days.push(label);
    dayCounts[label] = 0;
  }
  const snapshot = await db
    .collection("events")
    .where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(weekAgo))
    .get();
  snapshot.forEach((doc) => {
    const d =
      doc.data().timestamp && doc.data().timestamp.toDate
        ? doc.data().timestamp.toDate()
        : null;
    if (d) {
      const label = d.toLocaleDateString();
      if (label in dayCounts) dayCounts[label]++;
    }
  });
  renderChart(
    "eventsPerDayChart",
    "bar",
    {
      labels: days,
      datasets: [
        {
          label: "Events",
          data: days.map((d) => dayCounts[d]),
          backgroundColor: "#232946",
        },
      ],
    },
    { responsive: true, plugins: { legend: { display: false } } }
  );
}

// --- Fetch and display conversion funnel ---
async function showConversionFunnel() {
  // 1. Total signups (users collection)
  const usersSnap = await db.collection("users").get();
  const totalUsers = usersSnap.size;

  // 2. Users with at least one event
  const eventSnap = await db.collection("events").get();
  const usersWithEvent = new Set();
  eventSnap.forEach((doc) => usersWithEvent.add(doc.data().userId));

  // 3. Users who received a campaign (simulate: users targeted in any campaign)
  const campSnap = await db.collection("campaigns").get();
  const usersWithCampaign = new Set();
  campSnap.forEach((doc) => {
    const target = doc.data().target;
    if (target && target.startsWith("user_")) {
      usersWithCampaign.add(target.replace("user_", ""));
    } else if (target) {
      // For segment queries, count all users matching the query
      const filters = target
        .split(",")
        .map((pair) => pair.split("=").map((s) => s.trim()));
      usersSnap.forEach((userDoc) => {
        const user = userDoc.data();
        let match = true;
        filters.forEach(([field, value]) => {
          if (user[field] !== value) match = false;
        });
        if (match) usersWithCampaign.add(userDoc.id);
      });
    }
  });

  renderChart(
    "conversionFunnelChart",
    "bar",
    {
      labels: ["Signed Up", "Triggered Event", "Targeted by Campaign"],
      datasets: [
        {
          label: "Users",
          data: [totalUsers, usersWithEvent.size, usersWithCampaign.size],
          backgroundColor: ["#eebbc3", "#b8c1ec", "#232946"],
        },
      ],
    },
    {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
    }
  );
}

// --- Fetch and display user retention chart (Day 0-3 for last 7 days signups) ---
async function showRetentionChart() {
  // Get users who signed up in the last 7 days
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const usersSnap = await db
    .collection("users")
    .where("createdAt", ">=", firebase.firestore.Timestamp.fromDate(weekAgo))
    .get();
  const userSignups = [];
  usersSnap.forEach((doc) => {
    const data = doc.data();
    if (data.createdAt && data.createdAt.toDate) {
      userSignups.push({ uid: doc.id, signupDate: data.createdAt.toDate() });
    }
  });

  // For each user, check if they triggered an event on day 0, 1, 2, 3 after signup
  const retentionCounts = [0, 0, 0, 0]; // Day 0, 1, 2, 3
  for (const user of userSignups) {
    const eventSnap = await db
      .collection("events")
      .where("userId", "==", user.uid)
      .where(
        "timestamp",
        ">=",
        firebase.firestore.Timestamp.fromDate(user.signupDate)
      )
      .where(
        "timestamp",
        "<",
        firebase.firestore.Timestamp.fromDate(
          new Date(user.signupDate.getTime() + 4 * 24 * 60 * 60 * 1000)
        )
      )
      .get();
    // Track which days the user returned
    const daysReturned = new Set();
    eventSnap.forEach((doc) => {
      const eventDate =
        doc.data().timestamp && doc.data().timestamp.toDate
          ? doc.data().timestamp.toDate()
          : null;
      if (eventDate) {
        const diff = Math.floor(
          (eventDate - user.signupDate) / (24 * 60 * 60 * 1000)
        );
        if (diff >= 0 && diff <= 3) daysReturned.add(diff);
      }
    });
    daysReturned.forEach((day) => {
      retentionCounts[day]++;
    });
  }
  renderChart(
    "retentionChart",
    "line",
    {
      labels: ["Day 0", "Day 1", "Day 2", "Day 3"],
      datasets: [
        {
          label: "Users Returning",
          data: retentionCounts,
          borderColor: "#232946",
          backgroundColor: "rgba(35,41,70,0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    { responsive: true, plugins: { legend: { display: true } } }
  );
}

// --- SUMMARY CARDS LOGIC ---
async function updateSummaryCards() {
  // Total Users
  const usersSnap = await db.collection("users").get();
  document.getElementById("summary-total-users").textContent = usersSnap.size;

  // Active Users (last 7 days)
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const activeUsers = {};
  const eventsSnap = await db
    .collection("events")
    .where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(weekAgo))
    .get();
  eventsSnap.forEach((doc) => {
    activeUsers[doc.data().userId] = true;
  });
  document.getElementById("summary-active-users").textContent =
    Object.keys(activeUsers).length;

  // Events Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const eventsTodaySnap = await db
    .collection("events")
    .where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(today))
    .where("timestamp", "<", firebase.firestore.Timestamp.fromDate(tomorrow))
    .get();
  document.getElementById("summary-events-today").textContent =
    eventsTodaySnap.size;

  // Day 1 Retention: % of users who signed up yesterday and returned today
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const signupsYesterdaySnap = await db
    .collection("users")
    .where("createdAt", ">=", firebase.firestore.Timestamp.fromDate(yesterday))
    .where("createdAt", "<", firebase.firestore.Timestamp.fromDate(today))
    .get();
  const signupsYesterday = [];
  signupsYesterdaySnap.forEach((doc) => {
    const data = doc.data();
    if (data.createdAt && data.createdAt.toDate) {
      signupsYesterday.push({
        uid: doc.id,
        signupDate: data.createdAt.toDate(),
      });
    }
  });
  let returnedToday = 0;
  for (const user of signupsYesterday) {
    const events = await db
      .collection("events")
      .where("userId", "==", user.uid)
      .where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(today))
      .where("timestamp", "<", firebase.firestore.Timestamp.fromDate(tomorrow))
      .get();
    if (!events.empty) returnedToday++;
  }
  let retention = "-";
  if (signupsYesterday.length > 0) {
    retention =
      Math.round((returnedToday / signupsYesterday.length) * 100) + "%";
  }
  document.getElementById("summary-retention").textContent = retention;
}

// --- On page load, show analytics ---
window.addEventListener("DOMContentLoaded", () => {
  showActiveUsers();
  showEventsPerDay();
  showConversionFunnel();
  showRetentionChart();
  updateSummaryCards();
});
