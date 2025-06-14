const btn_login = document.querySelector("#btn_login");
const btn_signup = document.querySelector("#btn_signup");
const btn_get_started = document.querySelector("#btn_get_started");

if (btn_login) {
    btn_login.addEventListener("click", function () {
        window.location.href = "/FitWell/Login";
    });
}

if (btn_signup) {
    btn_signup.addEventListener("click", function () {
        window.location.href = "/FitWell/SignUp";
    });
}

if (btn_get_started) {
    btn_get_started.addEventListener("click", function () {
        window.location.href = "/FitWell/SignUp";
    });
}

// *Need modify
const buttons = document.querySelectorAll(".btn_feature");
buttons.forEach(button => {
    button.addEventListener("click", function () {
        const card = button.closest(".card");
        const link = card.getAttribute("data-link");

        console.log("Redirecting to:", link); // Check console
        window.location.href = link; // Redirect
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("main section");

  // Function to highlight the nav link that matches the given section ID
  function setActiveLinkById(id) {
    navLinks.forEach(link => {
      const linkId = link.getAttribute("href").split("#")[1];
      link.classList.toggle("active", linkId === id);
    });
  }

  // Function to determine the current section in view and highlight its nav link
  function highlightOnScroll() {
    let current = "";
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (window.pageYOffset >= top - height / 3) {
        current = section.id;
      }
    });
    if (current) setActiveLinkById(current);
  }

  // Add click event to all nav links
  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const hash = link.getAttribute("href");
      const id = hash.split("#")[1];
      setActiveLinkById(id);
    });
  });

  // Handle initial page load with hash (e.g., accessing /FitWell/#features directly)
  const initialHash = window.location.hash;
  if (initialHash) {
    const id = initialHash.replace("#", "");
    setTimeout(() => {
      setActiveLinkById(id);
    }, 10);
  }

  // Highlight nav link while scrolling through sections
  window.addEventListener("scroll", highlightOnScroll);
});
