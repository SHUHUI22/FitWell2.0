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

// Highlighting the nav link on click
const navLinks = document.querySelectorAll(".nav-link");
navLinks.forEach(link => {
    link.addEventListener("click", function () {
        navLinks.forEach(nav => nav.classList.remove("active"));
        this.classList.add("active");
    });
});

// Highlight nav link when scrolling
window.addEventListener('scroll', function () {
    const sections = document.querySelectorAll('main section');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - sectionHeight / 3) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});