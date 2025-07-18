// js/auth.js
// Handles login and signup logic using Firebase Authentication

// --- UNIFIED AUTH LOGIC FOR auth.html ---
// Login form
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    try {
      showLoadingSpinner();
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = "dashboard.html";
    } catch (error) {
      showToast("Login failed: " + error.message, "error");
    } finally {
      hideLoadingSpinner();
    }
  });
}
// Signup form
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value;
    const gender = document.getElementById("signup-gender").value;
    const location = document.getElementById("signup-location").value;
    const interest = document.getElementById("signup-interest").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    try {
      showLoadingSpinner();
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;
      await db.collection("users").doc(user.uid).set({
        name,
        gender,
        location,
        interest,
        email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      window.location.href = "dashboard.html";
    } catch (error) {
      showToast("Signup failed: " + error.message, "error");
    } finally {
      hideLoadingSpinner();
    }
  });
}
// Google sign-in for login
const googleBtnLogin = document.getElementById("google-signin-login");
if (googleBtnLogin) {
  googleBtnLogin.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      showLoadingSpinner();
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      // Check if user doc exists, if not, create it
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists) {
        await db
          .collection("users")
          .doc(user.uid)
          .set({
            name: user.displayName || "",
            gender: "",
            location: "",
            interest: "",
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
      }
      window.location.href = "dashboard.html";
    } catch (error) {
      showToast("Google sign-in failed: " + error.message, "error");
    } finally {
      hideLoadingSpinner();
    }
  });
}
// Google sign-in for signup
const googleBtnSignup = document.getElementById("google-signin-signup");
if (googleBtnSignup) {
  googleBtnSignup.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      showLoadingSpinner();
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      // Check if user doc exists, if not, create it
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (!userDoc.exists) {
        await db
          .collection("users")
          .doc(user.uid)
          .set({
            name: user.displayName || "",
            gender: "",
            location: "",
            interest: "",
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
      }
      window.location.href = "dashboard.html";
    } catch (error) {
      showToast("Google sign-in failed: " + error.message, "error");
    } finally {
      hideLoadingSpinner();
    }
  });
}

// --- NAVBAR VISIBILITY LOGIC (applies to all pages) ---
window.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged((user) => {
    // Navbar: show/hide Auth link and profile dropdown
    const authLink = document.querySelector(
      '.navbar-center a[href="auth.html"]'
    );
    const profileDropdown = document.querySelector(".profile-dropdown");
    if (user) {
      if (authLink) authLink.style.display = "none";
      if (profileDropdown) profileDropdown.style.display = "";
    } else {
      if (authLink) authLink.style.display = "";
      if (profileDropdown) profileDropdown.style.display = "none";
    }
    // Hide/show .auth-only and .user-only elements on all pages
    document.querySelectorAll(".auth-only").forEach((el) => {
      el.style.display = user ? "none" : "";
    });
    document.querySelectorAll(".user-only").forEach((el) => {
      el.style.display = user ? "" : "none";
    });
    // Landing page: hide Sign Up/Login buttons if logged in
    const landingCta = document.querySelector(".landing-cta");
    if (landingCta) {
      if (user) {
        landingCta.style.display = "none";
      } else {
        landingCta.style.display = "";
      }
    }

    // Auth page logic
    const alreadyLoggedInDiv = document.getElementById("already-logged-in");
    const authContent = document.getElementById("auth-content");
    if (window.location.pathname.endsWith("auth.html")) {
      if (user) {
        console.log("[AUTH] User is logged in:", user.email);
        if (alreadyLoggedInDiv) {
          alreadyLoggedInDiv.style.display = "block";
        }
        if (authContent) {
          authContent.style.display = "none";
        }
        document.getElementById("logged-in-name").textContent =
          user.displayName || user.name || user.email.split("@")[0] || "User";
        document.getElementById("logged-in-email").textContent = user.email;
        const authLogoutBtn = document.getElementById("auth-logout-btn");
        if (authLogoutBtn) {
          authLogoutBtn.onclick = async () => {
            try {
              await auth.signOut();
              showToast("Logged out successfully!", "success");
              if (alreadyLoggedInDiv) {
                alreadyLoggedInDiv.style.display = "none";
              }
              if (authContent) {
                authContent.style.display = "block";
              }
            } catch (error) {
              showToast("Logout failed: " + error.message, "error");
            }
          };
        }
      } else {
        console.log("[AUTH] No user logged in. Showing auth content.");
        if (alreadyLoggedInDiv) {
          alreadyLoggedInDiv.style.display = "none";
        }
        if (authContent) {
          authContent.style.display = "block";
        }
      }
    }
  });
});

// --- PASSWORD RESET LOGIC ---
const forgotPasswordLink = document.getElementById("forgot-password-link");
const resetModal = document.getElementById("reset-modal");
const resetClose = document.getElementById("reset-close");
const resetForm = document.getElementById("reset-form");
const resetEmail = document.getElementById("reset-email");
if (forgotPasswordLink && resetModal && resetClose && resetForm && resetEmail) {
  forgotPasswordLink.onclick = function (e) {
    e.preventDefault();
    resetModal.style.display = "flex";
    resetEmail.value = "";
  };
  resetClose.onclick = function () {
    resetModal.style.display = "none";
  };
  resetForm.onsubmit = async function (e) {
    e.preventDefault();
    const email = resetEmail.value.trim();
    if (!email) {
      showToast("Please enter your email.", "error");
      return;
    }
    try {
      showLoadingSpinner();
      await auth.sendPasswordResetEmail(email);
      showToast("Password reset email sent! Check your inbox.", "success");
      resetModal.style.display = "none";
    } catch (error) {
      showToast("Reset failed: " + error.message, "error");
    } finally {
      hideLoadingSpinner();
    }
  };
}

// --- AUTH TAB TOGGLE LOGIC ---
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const loginFormEl = document.getElementById("login-form");
const signupFormEl = document.getElementById("signup-form");
if (loginTab && signupTab && loginFormEl && signupFormEl) {
  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginFormEl.style.display = "";
    signupFormEl.style.display = "none";
  });
  signupTab.addEventListener("click", () => {
    signupTab.classList.add("active");
    loginTab.classList.remove("active");
    signupFormEl.style.display = "";
    loginFormEl.style.display = "none";
  });
}
