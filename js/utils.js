// js/utils.js
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

// Profile dropdown logic removed

// Universal Loading Spinner Utility
window.showLoadingSpinner = function () {
  const spinner = document.getElementById("global-loading-spinner");
  if (spinner) spinner.classList.add("active");
};
window.hideLoadingSpinner = function () {
  const spinner = document.getElementById("global-loading-spinner");
  if (spinner) spinner.classList.remove("active");
};

// Floating onboarding-help button logic
window.addEventListener("DOMContentLoaded", function () {
  var helpBtn = document.getElementById("onboarding-help");
  if (helpBtn) {
    helpBtn.addEventListener("click", function () {
      window.open("about.html", "_blank");
    });
  }
});

// --- Responsive Navbar Toggle Logic ---
window.addEventListener("DOMContentLoaded", function () {
  const navbarToggle = document.getElementById("navbar-toggle");
  const navbarCenter = document.querySelector(".navbar-center");
  const navLinks = document.querySelectorAll(".navbar-center a");
  if (navbarToggle && navbarCenter) {
    navbarToggle.addEventListener("change", function () {
      if (navbarToggle.checked) {
        navbarCenter.classList.add("show");
      } else {
        navbarCenter.classList.remove("show");
      }
    });
    // Close menu when a link is clicked (mobile only)
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 900) {
          navbarToggle.checked = false;
          navbarCenter.classList.remove("show");
        }
      });
    });
  }
});
