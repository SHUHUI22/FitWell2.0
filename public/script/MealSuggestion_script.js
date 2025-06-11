// spoonacular API key 
const apiKey = "82f7eda70d74498a882133bf6395e55f";

function showInstructionMessage() {
  const resultsContainer = document.getElementById("search-result");
  resultsContainer.innerHTML = `
    <div class="d-flex flex-column justify-content-center align-items-center">
      <img class="img-fluid" src="/images/search.png" alt="Search illustration">
      <p class="text-muted">Please enter a meal keyword and click <strong>"Search"</strong> to see results.</p>
    </div>
  `;
}

// Fetch favourites from database
async function fetchFavourites() {
  try {
    const res = await fetch('/FitWell/favourites'); // Changed from /api/favourites to /favourites
    
    if (res.status === 401) {
      // User not logged in
      console.log('User not logged in - cannot fetch favourites');
      return [];
    }
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Fetched favourites:', data);
    return data;
  } catch (error) {
    console.error('Error fetching favourites:', error);
    return [];
  }
}

// Check if user is authenticated
async function checkAuthStatus() {
  try {
    const res = await fetch('/FitWell/api/auth/status');
    const data = await res.json();
    return data.isLoggedIn;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
}

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
}

// Function to get nutrient amount from the nutrition object
function getNutrient(nutrition, name) {
  const item = nutrition?.nutrients?.find(n => n.name === name);
  return item ? `${item.amount} ${item.unit}` : 'N/A';
}

// Function to show detailed recipe steps in a modal
async function showRecipeSteps(info) {
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

  // Check if user is logged in
  const isLoggedIn = await checkAuthStatus();
  
  if (!isLoggedIn) {
    btn_fav.textContent = "❤️ Login to Add Favourites";
    btn_fav.disabled = true;
    btn_fav.style.backgroundColor = "#ccc";
  } else {
    // Function to check and set button state
    const updateButtonState = async () => {
      try {
        console.log('=== CHECKING FAVORITE STATUS ===');
        console.log('Checking for meal ID:', info.id, 'Type:', typeof info.id);
        
        // Always fetch fresh data from server to ensure accuracy
        const favs = await fetchFavourites();
        console.log('Total favourites found:', favs.length);
        
        if (favs.length > 0) {
          console.log('Sample favourite:', favs[0]);
          console.log('All favourite meal IDs:', favs.map(fav => `${fav.mealId} (${typeof fav.mealId})`));
        }
        
        // Check if current meal is in favourites using comprehensive comparison
        let isFavourite = false;
        let matchedFavourite = null;
        
        for (let fav of favs) {
          const favMealId = fav.mealId;
          const currentMealId = info.id;
          
          console.log(`Comparing favourite mealId: ${favMealId} (${typeof favMealId}) with current meal: ${currentMealId} (${typeof currentMealId})`);
          
          // Try multiple comparison methods to handle any type issues
          if (favMealId == currentMealId) {
            isFavourite = true;
            matchedFavourite = fav;
            console.log(`✅ MATCH FOUND with == comparison: ${favMealId} == ${currentMealId}`);
            break;
          } else if (String(favMealId) === String(currentMealId)) {
            isFavourite = true;
            matchedFavourite = fav;
            console.log(`✅ MATCH FOUND with String comparison: "${String(favMealId)}" === "${String(currentMealId)}"`);
            break;
          } else if (parseInt(favMealId) === parseInt(currentMealId)) {
            isFavourite = true;
            matchedFavourite = fav;
            console.log(`✅ MATCH FOUND with parseInt comparison: ${parseInt(favMealId)} === ${parseInt(currentMealId)}`);
            break;
          }
        }
        
        console.log('=== FINAL RESULT ===');
        console.log('Is meal in favourites?', isFavourite);
        if (matchedFavourite) {
          console.log('Matched favourite object:', matchedFavourite);
        }
        
        // Set button state based on favorite status
        if (isFavourite) {
          btn_fav.textContent = "❤️ Remove from Favourites";
          btn_fav.style.backgroundColor = "#dc3545"; // Bootstrap danger red
          btn_fav.style.color = "white";
          btn_fav.style.border = "1px solid #dc3545";
          btn_fav.classList.add('btn-remove-fav');
          btn_fav.classList.remove('btn-add-fav');
          console.log('✅ Button configured for REMOVE - meal IS in favourites');
        } else {
          btn_fav.textContent = "❤️ Add to Favourites";
          btn_fav.style.backgroundColor = "#28a745"; // Bootstrap success green
          btn_fav.style.color = "white";
          btn_fav.style.border = "1px solid #28a745";
          btn_fav.classList.add('btn-add-fav');
          btn_fav.classList.remove('btn-remove-fav');
          console.log('ℹ️ Button configured for ADD - meal NOT in favourites');
        }
        
        btn_fav.disabled = false;
        console.log('=== BUTTON STATE SET COMPLETE ===');
        return isFavourite;
      } catch (error) {
        console.error('Error checking favourites:', error);
        btn_fav.textContent = "❤️ Error Loading Favourites";
        btn_fav.style.backgroundColor = "#6c757d";
        btn_fav.style.color = "white";
        btn_fav.disabled = true;
        return false;
      }
    };

    // Set initial button state - this runs every time modal opens
    console.log('🔄 Setting initial button state for modal...');
    await updateButtonState();

    // Toggle favourite on click
    btn_fav.addEventListener("click", async function () {
      try {
        // Disable button and show processing state
        btn_fav.disabled = true;
        const originalText = btn_fav.textContent;
        btn_fav.textContent = "⏳ Processing...";
        btn_fav.style.backgroundColor = "#6c757d";
        
        // Check current button state using classes for reliable detection
        const isCurrentlyFavorite = btn_fav.classList.contains('btn-remove-fav');
        console.log('Button click - Current state is favorite?', isCurrentlyFavorite);

        if (isCurrentlyFavorite) {
          // Remove from favourites
          console.log('🗑️ Attempting to REMOVE from favourites...');
          const response = await fetch(`/FitWell/api/favourites/${info.id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            console.log('✅ Successfully removed from favourites');
            // Update button state to ADD since it's no longer in favorites
            btn_fav.textContent = "❤️ Add to Favourites";
            btn_fav.style.backgroundColor = "#28a745";
            btn_fav.style.color = "white";
            btn_fav.style.border = "1px solid #28a745";
            btn_fav.classList.add('btn-add-fav');
            btn_fav.classList.remove('btn-remove-fav');
          } else {
            const errorData = await response.json();
            console.error('❌ Error removing from favourites:', errorData);
            alert('Error removing from favourites: ' + (errorData.error || 'Unknown error'));
            // Restore original button state on error
            btn_fav.textContent = originalText;
            await updateButtonState();
          }
        } else {
          // Add to favourites
          console.log('➕ Attempting to ADD to favourites...');
          const favouriteData = {
            mealId: info.id,
            mealName: info.title,
            mealImage: info.image,
            calories: getNutrient(info.nutrition, 'Calories').split(" ")[0],
            protein: getNutrient(info.nutrition, 'Protein').split(" ")[0],
            fat: getNutrient(info.nutrition, 'Fat').split(" ")[0],
            carbs: getNutrient(info.nutrition, 'Carbohydrates')?.split(" ")[0] || 0
          };
          
          console.log('Sending favourite data:', favouriteData);
          
          const response = await fetch('/FitWell/api/favourites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(favouriteData)
          });

          if (response.ok) {
            console.log('✅ Successfully added to favourites');
            // Update button state to REMOVE since it's now in favorites
            btn_fav.textContent = "❤️ Remove from Favourites";
            btn_fav.style.backgroundColor = "#dc3545";
            btn_fav.style.color = "white";
            btn_fav.style.border = "1px solid #dc3545";
            btn_fav.classList.add('btn-remove-fav');
            btn_fav.classList.remove('btn-add-fav');
          } else if (response.status === 409) {
            // Conflict - already exists
            console.log('⚠️ Meal already in favourites (409 conflict)');
            // Update button to show it's already in favorites
            btn_fav.textContent = "❤️ Remove from Favourites";
            btn_fav.style.backgroundColor = "#dc3545";
            btn_fav.style.color = "white";
            btn_fav.style.border = "1px solid #dc3545";
            btn_fav.classList.add('btn-remove-fav');
            btn_fav.classList.remove('btn-add-fav');
          } else {
            const errorData = await response.json();
            console.error('❌ Error adding to favourites:', errorData);
            
            // Check if error message indicates it already exists
            if (errorData.error && errorData.error.toLowerCase().includes('already')) {
              console.log('⚠️ Error indicates meal already in favourites');
              btn_fav.textContent = "❤️ Remove from Favourites";
              btn_fav.style.backgroundColor = "#dc3545";
              btn_fav.style.color = "white";
              btn_fav.style.border = "1px solid #dc3545";
              btn_fav.classList.add('btn-remove-fav');
              btn_fav.classList.remove('btn-add-fav');
            } else {
              alert('Error adding to favourites: ' + (errorData.error || 'Unknown error'));
              // Restore original button state on error
              btn_fav.textContent = originalText;
              await updateButtonState();
            }
          }
        }
      } catch (error) {
        console.error('❌ Network error toggling favourite:', error);
        alert('Network error occurred. Please try again.');
        // Refresh button state from server on network error
        await updateButtonState();
      } finally {
        // Always re-enable button
        btn_fav.disabled = false;
        console.log('🔄 Button re-enabled');
      }
    });
  }

  const modal = new bootstrap.Modal(document.getElementById('mealModal'));
  modal.show();
}

document.getElementById("search-input").addEventListener("input", function () {
  if (this.value.trim() === "") {
    showInstructionMessage();
  }
});

document.addEventListener("DOMContentLoaded", async function () {
  const nav = document.querySelector(".navbar");
  const features = document.querySelectorAll(".card");
  
  // Check authentication status from server
  const isLoggedIn = await checkAuthStatus();

  // Check if user is logged in
  if (isLoggedIn) {
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
      (currentPage === "MealSuggestion" && href.includes("MealSuggestion")))) {
      link.classList.add("active");

      // Add green highlight
      if (currentPage === "MealSuggestion") {
        link.classList.add("active-green");
      }
    }
  });

  showInstructionMessage();
});

// Log out function - now only clears session on server side
const btn_logout = document.querySelector("#btn_logout");
if (btn_logout) {
  btn_logout.addEventListener("click", logout);
}

async function logout() {
  try {
    const response = await fetch('/FitWell/logout', {
      method: 'POST'
    });
    
    if (response.ok) {
      // Redirect after successful logout
      window.location.href = "/FitWell/Login";
    } else {
      console.error('Logout failed');
      // Redirect anyway
      window.location.href = "/FitWell/Login";
    }
  } catch (error) {
    console.error('Error during logout:', error);
    // Redirect anyway
    window.location.href = "/FitWell/Login";
  }
}