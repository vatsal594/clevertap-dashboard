# 🔁 CleverTap Firebase Dashboard

A Firebase-powered web application replicating core features of CleverTap — including authentication, user segmentation, campaign creation, and analytics — focused on enhancing user engagement through personalized push notifications and data-driven insights.

---

## 🚀 1. Project Summary

> “I’ve built a CleverTap-like web application using Firebase that includes core features like user authentication, campaign creation, segmentation, analytics, and role-based access — all focused on understanding and enhancing user engagement.”

---

## 📚 2. Why I Built This

> “Since CleverTap is centered around user lifecycle management, segmentation, and engagement analytics, I wanted to replicate those use cases using Firebase so I could deeply understand the platform logic, user tracking, and push notification flow. This helped me get hands-on with features like FCM, Firestore, and segmentation.”

---

## 🔍 3. Feature Overview

### 🔐 Authentication Module (Role-Based Access)

- Firebase Authentication (Email Password + SignIn with Google)
- Collects user details (name, gender, location) during signup.
- Role assignment: `admin` or `user` stored in Firestore.
- Role-based redirection:
  - `Admin → Admin Dashboard`
  - `User → User Dashboard`
- Role-check logic on frontend using Firestore data.

---

### 📊 Analytics Dashboard

- Visualizes real-time & historical user behavior using:
  - ✅ Total users, Active users (Cards)
  - ✅ Pie chart: Active vs Inactive users
  - ✅ Bar graph: Daily events/activity
  - ✅ Funnel chart: Conversion journey
  - ✅ Retention chart: Return users over time
- Data fetched from Firestore & updated with `onSnapshot()` listeners.

---

### 📣 Campaign Creation

- Admins can:
  - Fill title, body, and select a segment.
  - Fetch all users matching segment filters.
  - Copy FCM tokens (manual/automated send).
- Emulates real-world campaigns: promotions, alerts, re-engagement.

---

### 🧩 Segmentation System

- Admins can create filters like “Delhi Males”.
- Query users by attributes: gender, city, interest, etc.
- Saved segments reused during campaign targeting.
- Firestore queries used to fetch users dynamically.

---

### 🛠 Admin Panel (Secure Role-Based Access)

- Accessible only to admins.
- View:
  - All users (email, name, FCM token)
  - All saved segments
  - All sent campaigns
- Unauthorized users see: `"Access Denied"`.

---

## 🔧 Firebase Tools Used

| Feature       | Firebase Tool                  |
| ------------- | ------------------------------ |
| Auth          | Firebase Authentication        |
| Database      | Firestore (users, segments)    |
| Notifications | Firebase Cloud Messaging (FCM) |
| Storage       | Firebase Storage (optional)    |
| Analytics     | Firestore + Chart.js / Graphs  |

---

## 🎯 What I Learned (Relevant for CSE Role)

> “This project helped me deeply understand Firebase services, how segmentation drives personalization, and how push notifications enhance re-engagement. It also helped me gain a practical understanding of how CleverTap features are used by businesses to drive growth.”

**Key Learnings:**

- Real-time user segmentation  
- FCM token logic and notification sending  
- Targeted campaigns and filtering  
- Visual analytics with Chart.js  
- Firebase security rules and access control  
- Project structuring for scalability

---

## 🧠 Relevance to Customer Success Role

> “As a Customer Success Engineer, understanding how customers use segmentation, campaigns, and analytics is critical. This project gave me hands-on experience with the same use cases your customers use CleverTap for — which means I’ll be able to guide them better, debug faster, and suggest improvements with confidence.”

---

## 📝 TL;DR Pitch (For HR / Quick Overview)

> “I built a full-stack Firebase app replicating CleverTap's core features like segmentation, campaigns, analytics, and FCM. It helped me understand how product teams use real-time user data to create personalized push campaigns and track conversions — exactly what CleverTap enables. This gave me a solid foundation for the Customer Success role.”

---

## 📂 Folder Structure

📦clevertap-firebase-dashboard
┣ 📁public/
┣ 📁src/
┃ ┣ 📂auth/
┃ ┣ 📂components/
┃ ┣ 📂pages/
┃ ┣ 📂utils/
┃ ┣ App.js
┃ ┣ firebaseConfig.js
┗ index.html 


---

## 🧪 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Firebase:** Auth, Firestore, FCM, Storage
- **Visualization:** Chart.js
- **Tools:** VS Code, Git, Postman, Chrome DevTools

---

## 🖼️ Screenshots (Optional)

_Add screenshots or GIFs here to showcase the dashboards, analytics, or campaign flows._

---

## 📬 Contact

**Vatsal Savani**  
📍 Mumbai, India  
📧 [vatsalsavanicodes@gmail.com](mailto:vatsalsavanicodes@gmail.com)  
🔗 [LinkedIn](https://linkedin.com/in/vatsalsavanicodes)  
🔗 [GitHub](https://github.com/vatsal594)

---

## 🙌 Contributions

Contributions, issues, and suggestions are welcome!  
If you’d like to collaborate or improve this tool, feel free to open a pull request.

---
