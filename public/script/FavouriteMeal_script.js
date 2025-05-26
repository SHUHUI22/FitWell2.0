const favouritesKey = 'mealFavourites';  // Key used to store favourites in localStorage
let favourites = JSON.parse(localStorage.getItem(favouritesKey)) || [];

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

            // Add green highlight
            if (currentPage === "NutritionPlanner.html") {
                link.classList.add("active-green");
            }
        }
    });

    loadFavourites();
});

// Load favourites page and display full information
function loadFavourites() {
    const favouritesContainer = document.getElementById('favourites-container');
    favouritesContainer.innerHTML = ""; // ✅ Always clear the container

    if (favourites.length !== 0) {
        favourites.forEach((fav, index) => {
            const col = document.createElement("div");
            col.classList.add("col-sm-4", "mb-4");

            const favCard = document.createElement("div");
            favCard.classList.add("card");

            favCard.innerHTML = `
            <div class="card-body d-flex flex-column justify-content-between align-items-center">
                <img src="${fav.image}" alt="${fav.title}" class="card-img-top">
                <div>
                    <h5 class="card-title meal-title">${fav.title}</h5>
                </div>
            </div>
            `;

            favCard.addEventListener('click', () => showMealModal(fav, index));
            favouritesContainer.appendChild(col);
            col.appendChild(favCard);
        });
    } else {
        favouritesContainer.innerHTML = `
            <div class="d-flex flex-column justify-content-center align-items-center bg-white rounded rounded-5">
                    <img class="img-fluid" src="/images/favourite.png" alt="Favourite illustration">
                    <p class="text-muted">You haven't added any favorites yet. You may search for a meal and click
                        <strong>"Add to Favourites"</strong> to save it.</p>
            </div>
        `;
    }
}

function showMealModal(info, index) {
    const modalTitle = document.getElementById("mealModalLabel");
    const modalBody = document.getElementById("modal-steps");
    const removeBtn = document.getElementById("btn-remove-fav");

    modalTitle.textContent = info.title;

    const steps = info.steps || [];

    modalBody.innerHTML = `
        <img src="${info.image}" alt="${info.title}" class="img-fluid rounded mb-3" style="max-height: 250px;">
        <div class="nutrition d-flex justify-content-center gap-4 mb-3">
            <p class="meal-calorie mb-0"><strong>Calories:</strong> ${getNutrient(info.nutrition, 'Calories')}</p>
            <p class="meal-protein mb-0"><strong>Protein:</strong> ${getNutrient(info.nutrition, 'Protein')}</p>
            <p class="meal-fat mb-0"><strong>Fat:</strong> ${getNutrient(info.nutrition, 'Fat')}</p>
        </div>
        <h6 class="text-start"><strong>Steps:</strong></h6>
        <ol class="text-start">
            ${steps.length > 0 ? steps.map(step => `<li>${step}</li>`).join('') : '<li>No instructions available.</li>'}
        </ol>
    `;

    // Set index for remove button
    removeBtn.setAttribute("data-index", index);

    // Show modal using Bootstrap's modal instance
    const myModal = new bootstrap.Modal(document.getElementById('mealModal'));
    myModal.show();
}

// Function to get nutrient amount from the nutrition object
function getNutrient(nutrition, name) {
    const item = nutrition?.nutrients?.find(n => n.name === name);
    return item ? `${item.amount} ${item.unit}` : 'N/A';
}

// Remove meal from favourite list
document.getElementById("btn-remove-fav").addEventListener("click", function () {
    const index = this.getAttribute("data-index");
    if (index !== null) {
        removeFavourite(Number(index));
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('mealModal'));
        modalInstance.hide();
    }
});

function removeFavourite(index) {
    favourites.splice(index, 1);
    localStorage.setItem(favouritesKey, JSON.stringify(favourites));
    loadFavourites(); // Refresh the displayed favourites
}


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