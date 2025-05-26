// spoonacular API key 
const apiKey = "931113120c0c4a369daaa8e9bf92f571";

function showInstructionMessage() {
  const resultsContainer = document.getElementById("search-result");
  resultsContainer.innerHTML = `
    <div class="d-flex flex-column justify-content-center align-items-center">
      <img class="img-fluid" src="/images/search.png" alt="Search illustration">
      <p class="text-muted">Please enter a meal keyword and click <strong>"Search"</strong> to see results.</p>
    </div>
  `;
}

// LocalStorage to store favourites
const favouritesKey = 'mealFavourites';
let favourites = JSON.parse(localStorage.getItem(favouritesKey)) || [];

let selectedGoal = "";

// Handle goal selection
document.querySelectorAll(".dropdown-item").forEach(item => {
  item.addEventListener("click", function () {
    selectedGoal = this.getAttribute("data-value");
    document.getElementById("filter").textContent = this.textContent;
  });
});

// Handle search button event listener
document.getElementById("btn-search").addEventListener("click", searchMeal);

async function searchMeal() {

  // Get search input value
  const query = document.getElementById("search-input").value.trim();

  const resultsContainer = document.getElementById('search-result');
  resultsContainer.innerHTML = "<p>Loading...</p>";

  let filterParams = "";

  // Apply nutritional filtering based on selected goal
  if (selectedGoal === "weight-loss") {
    filterParams = "&maxCalories=400&minProtein=10";
  } else if (selectedGoal === "muscle-gain") {
    filterParams = "&minProtein=25&minCalories=400";
  } else if (selectedGoal === "maintenance") {
    filterParams = "&minCalories=400&maxCalories=600";
  }
  else if (selectedGoal === "none" || selectedGoal === "") {
    filterParams = ""; // No filters applied
  }
  try {
    // Call Spoonacular API to search for recipes
    const searchRes = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${query}${filterParams}&number=10&addRecipeNutrition=true&apiKey=${apiKey}`);
    const searchData = await searchRes.json();

    // Clear loading message
    resultsContainer.innerHTML = "";

    // Check if any results were returned
    if (!searchData.results || searchData.results.length === 0) {
      resultsContainer.innerHTML = "<p>No results found. Try another keyword or adjust your goal.</p>";
      return;
    }

    // Loop through each meal result
    for (let recipe of searchData.results) {
      const infoRes = await fetch(`https://api.spoonacular.com/recipes/${recipe.id}/information?includeNutrition=true&apiKey=${apiKey}`);
      const info = await infoRes.json();

      // Create a card to display meal information
      const mealDiv = document.createElement("div");
      mealDiv.classList.add("card")
      mealDiv.innerHTML = `
            <div class="card-body d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="card-title meal-title">${info.title}</h5>
                    <div class="nutrition d-flex gap-3">
                      <p class="meal-calorie"><strong>Calories:</strong> ${getNutrient(info.nutrition, 'Calories')}</p>
                      <p class="meal-protein"><strong>Protein:</strong> ${getNutrient(info.nutrition, 'Protein')}</p>
                      <p class="meal-fat"><strong>Fat:</strong> ${getNutrient(info.nutrition, 'Fat')}</p>
                    </div>
                </div>
                <img src="${info.image}" alt="${info.title}">
            </div>
        `;
      // Add event to open modal with full recipe steps when the card is clicked
      mealDiv.addEventListener('click', () => showRecipeSteps(info)); // Add click event to show recipe steps
      resultsContainer.appendChild(mealDiv);

    }
  }
  catch (err) {
    console.error(err);
    resultsContainer.innerHTML = 'Error fetching data.';
  }

  // Function to get nutrient amount from the nutrition object
  function getNutrient(nutrition, name) {
    const item = nutrition?.nutrients?.find(n => n.name === name);
    return item ? `${item.amount} ${item.unit}` : 'N/A';
  }

  // Function to show detailed recipe steps in a modal
  function showRecipeSteps(info) {
    const modalTitle = document.getElementById('mealModalLabel');
    const modalBody = document.getElementById('modal-steps');

    modalTitle.innerText = info.title;

    // Extract recipe steps if available
    const steps = info.analyzedInstructions?.[0]?.steps?.map(s => s.step) || [];

    // Populate modal body with meal info and steps
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

    // Replace old favourite button to remove previous listeners
    const oldBtnFav = document.getElementById("btn-fav");
    const newBtnFav = oldBtnFav.cloneNode(true);
    oldBtnFav.replaceWith(newBtnFav);
    const btn_fav = newBtnFav;

    // Check if meal is already in favorites and update button
    let isFavourite = favourites.some(fav => fav.id === info.id);
    btn_fav.textContent = isFavourite ? "❤️ Remove from Favourites" : "❤️ Add to Favourites";
    btn_fav.style.backgroundColor = isFavourite ? "#ff6f61" : "";

    // Toggle favourite on click
    btn_fav.addEventListener("click", function () {
      isFavourite = !isFavourite;
      if (isFavourite) {
        favourites.push({
          id: info.id,
          title: info.title,
          image: info.image,
          nutrition: info.nutrition,
          steps: steps
        });
        btn_fav.textContent = "❤️ Remove from Favourites";
        btn_fav.style.backgroundColor = "#ff6f61";
      } else {
        favourites = favourites.filter(fav => fav.id !== info.id);
        btn_fav.textContent = "❤️ Add to Favourites";
        btn_fav.style.backgroundColor = "";
      }
      localStorage.setItem(favouritesKey, JSON.stringify(favourites));
    });

    const modal = new bootstrap.Modal(document.getElementById('mealModal'));
    modal.show();
  }
}

document.getElementById("search-input").addEventListener("input", function () {
  if (this.value.trim() === "") {
    showInstructionMessage();
  }
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

      // Add green highlight
      if (currentPage === "NutritionPlanner.html") {
        link.classList.add("active-green");
      }
    }
  });

  showInstructionMessage();
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