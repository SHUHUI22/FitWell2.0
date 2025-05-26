// spoonacular API key 
const apiKey = "931113120c0c4a369daaa8e9bf92f571";

// Set today's date 
const today = new Date().toISOString().split('T')[0];
document.getElementById('log-date').value = today;

let selectedMeal = null;
let selectedCategory = null;

// Open modal on 'Log Meal' button click
document.querySelectorAll('.btn-log').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedCategory = btn.parentElement.id; // breakfast / lunch / dinner
        openModal();
    });
});

function openModal() {
    const modal = new bootstrap.Modal(document.getElementById('mealModal'));
    modal.show();

    document.getElementById("search-input").value = "";
    document.getElementById("search-results").innerHTML = "";
    document.getElementById("serving-section").classList.add("hidden");
}

// Search meal
async function searchMeal() {
    const query = document.getElementById("search-input").value.trim();
    const resultsDiv = document.getElementById("search-results");

    if (query.length === 0) {
        resultsDiv.innerHTML = "";
        return;
    }
    resultsDiv.innerHTML = "<p>Searching...</p>";

    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=5&apiKey=${apiKey}`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            resultsDiv.innerHTML = "<p>No meals found.</p>";
            return;
        }

        // Display search results
        resultsDiv.innerHTML = data.results.map(meal => `
          <div class="card mb-2 shadow-sm meal-option" style="cursor: pointer;" onclick="selectMeal(${meal.id}, '${meal.title.replace(/'/g, "\\'")}')">
            <div class="card-body d-flex align-items-center">
              <img src="${meal.image}" alt="${meal.title}" class="img-thumbnail me-3" style="width: 70px; height: 70px; object-fit: cover;" />
              <h5 class="card-title mb-0">${meal.title}</h5>
            </div>
          </div>
        `).join("");
    } catch (error) {
        resultsDiv.innerHTML = `<p>Error fetching meals: ${error.message}</p>`;
    }
}

// Called when user clicks a meal option
async function selectMeal(id, title) {
    const section = document.getElementById("serving-section");
    section.classList.remove("d-none");
    document.getElementById("selected-meal-name").textContent = title;
    document.getElementById("servings-input").value = 1;

    // Scroll to servings input
    document.getElementById("servings-input").scrollIntoView({ behavior: "smooth", block: "center" });

    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/nutritionWidget.json?apiKey=${apiKey}`);
        const nutrition = await response.json();

        selectedMeal = {
            id,
            title,
            image: `https://spoonacular.com/recipeImages/${id}-312x231.jpg`,
            nutrition
        };

    } catch (error) {
        alert("Failed to fetch nutrition info.");
        section.classList.add("d-none");
    }
}

const btn_modal_log = document.querySelector(".btn-modal-log");
btn_modal_log.addEventListener("click", confirmLogMeal);

// Log meal to the selected meal list and update summary
function confirmLogMeal() {
    const servings = parseFloat(document.getElementById("servings-input").value);
    if (!selectedMeal || servings <= 0) return;

    const nutrients = selectedMeal.nutrition;
    const { calories, carbs, fat, protein } = {
        calories: parseFloat(nutrients.calories),
        carbs: parseFloat(nutrients.carbs),
        fat: parseFloat(nutrients.fat),
        protein: parseFloat(nutrients.protein),
    };

    // Calculate total per serving
    const total = {
        calories: Math.round(calories * servings),
        carbs: Math.round(carbs * servings),
        fat: Math.round(fat * servings),
        protein: Math.round(protein * servings),
    };

    // Add to meal list
    const mealList = document.getElementById(`${selectedCategory}-list`);
    const mealHtml = `
      <div class="meal-entry bg-light border p-2 rounded d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center">
    <img src="${selectedMeal.image}" alt="${selectedMeal.title}" class="img-thumbnail me-2" style="width: 70px; height: 70px;" />
    <div class="content">
      <strong>${selectedMeal.title}</strong><br/>
      ${total.calories} kcal, ${total.carbs}g carbs, ${total.fat}g fat, ${total.protein}g protein
    </div>
  </div>
  <button class="btn btn-sm btn-outline-danger btn-delete-meal me-2" title="Delete Meal">
    <i class="fas fa-trash-alt"></i>
  </button>
      </div>
    `;
    mealList.innerHTML += mealHtml;

    mealList.querySelectorAll('.btn-delete-meal').forEach(button => {
        button.addEventListener('click', function () {
            const entry = this.closest('.meal-entry');

            // Get nutrition values from text
            const text = entry.querySelector('div').innerText;
            const match = text.match(/(\d+)\s*kcal,\s*(\d+)g carbs,\s*(\d+)g fat,\s*(\d+)g protein/);
            if (match) {
                const [, cals, carbs, fat, protein] = match.map(Number);
                const row = document.getElementById("summary-row");
                row.children[0].textContent = Math.max(0, parseFloat(row.children[0].textContent) - cals);
                row.children[1].textContent = Math.max(0, parseFloat(row.children[1].textContent) - carbs);
                row.children[2].textContent = Math.max(0, parseFloat(row.children[2].textContent) - fat);
                row.children[3].textContent = Math.max(0, parseFloat(row.children[3].textContent) - protein);
            }

            entry.remove();
        });
    });

    // Update summary table
    const row = document.getElementById("summary-row");
    const current = [...row.children].map(td => parseFloat(td.textContent));

    row.children[0].textContent = current[0] + total.calories;
    row.children[1].textContent = current[1] + total.carbs;
    row.children[2].textContent = current[2] + total.fat;
    row.children[3].textContent = current[3] + total.protein;

    // Close modal and reset
    const modal = bootstrap.Modal.getInstance(document.getElementById('mealModal'));
    modal.hide();
    selectedMeal = null;
    selectedCategory = null;
    document.getElementById("search-input").value = "";
    document.getElementById("search-results").innerHTML = "";
    document.getElementById("serving-section").classList.add("d-none");
}

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
});

// Log out
const btn_logout = document.querySelector("#btn_logout");
btn_logout.addEventListener("click", logout);

function logout() {
    // Retain the 'mealFavorites' in localStorage, clear other data
    const favorites = localStorage.getItem('mealFavorites');

    // Clear all other data in localStorage
    localStorage.clear();

    // Restore the 'mealFavorites' back to localStorage
    if (favorites) {
        localStorage.setItem('mealFavourites', favorites);
    }

    // Redirect after a slight delay
    setTimeout(function () {
        window.location.href = "Login.html";
    }, 500);
}
