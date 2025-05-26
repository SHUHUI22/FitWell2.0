document.getElementById("btn-meal-suggestion").addEventListener("click", function(){
    window.location.href = "MealSuggestion.html";
});

document.getElementById("btn-myfav").addEventListener("click", function(){
    window.location.href = "FavouriteMeal.html";
});

document.getElementById("btn-log").addEventListener("click", function(){
    window.location.href = "MealLogging.html";
});

document.getElementById("btn-cal").addEventListener("click", function(){
    window.location.href = "Calculator.html";
});


document.addEventListener("DOMContentLoaded", function () {
    const nav = document.querySelector(".navbar");
    const features = document.querySelectorAll(".card");
    const isLoggedIn = localStorage.getItem("loggedIn");

    // Check if user is logged in
    if (isLoggedIn === "true") {
        document.body.classList.add("logged-in");

        // Show the hidden nav and quicklink items
        const showIds = [
            "nav_tracker", "nav_nutrition", "nav_progress", "nav_reminder", "nav_profile",
            "quicklink_tracker", "quicklink_progress", "quicklink_nutrition", "quicklink_reminder"
        ];
        showIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove("d-none");
        });

        // Hide login/signup/get-started buttons
        const btn_login = document.querySelector("#btn_login");
        const btn_signup = document.querySelector("#btn_signup");
        const btn_get_started = document.querySelector("#btn_get_started");

        if (btn_login) btn_login.classList.add("d-none");
        if (btn_signup) btn_signup.classList.add("d-none");
        if (btn_get_started) btn_get_started.classList.add("d-none");

        // Card feature redirection
        const buttons = document.querySelectorAll(".btn_feature");
        buttons.forEach(button => {
            button.addEventListener("click", function () {
                const card = button.closest(".card");
                const link = card.getAttribute("data-link");
                if (link) {
                    console.log("Redirecting to:", link);
                    window.location.href = link;
                }
            });
        });
    }

    // Automatically highlight the correct nav link based on current page
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        // Check if the href contains the current page name or ends with it
        if (href && (href.includes(currentPage) || href.endsWith(currentPage) || 
            (currentPage === "NutritionPlanner.html" && href.includes("NutritionPlanner.html")))) {
            link.classList.add("active");
            
            // Add green highlight for Nutrition Planner
            if (currentPage === "ProgressChart.html") {
                link.classList.add("active-green");
            }
        }
    });
});

// Log out
const btn_logout = document.querySelector("#btn_logout");
btn_logout.addEventListener("click", logout);

function logout() {
    // Retain the 'mealFavourites' in localStorage, clear other data
    const favourites = localStorage.getItem('mealFavourites');

    // Clear all other data in localStorage
    localStorage.clear();

    // Restore the 'mealFavourites' back to localStorage
    if (favourites) {
        localStorage.setItem('mealFavourites', favourites);
    }

    // Redirect after a slight delay
    setTimeout(function () {
        window.location.href = "Login.html";
    }, 500);
}