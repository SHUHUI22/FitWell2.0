// spoonacular API key 
const apiKey = "ec2038346da449b89a58e0be5dee7ec3";

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
    const res = await fetch('/FitWell/api/favourites'); // Changed from /api/favourites to /favourites
    
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
  const query = document.getElementById("search-input").value.trim();
  const resultsContainer = document.getElementById('search-result');
  resultsContainer.innerHTML = "<p>Loading...</p>";

  if (!query) {
    resultsContainer.innerHTML = "<p>Please enter a search term.</p>";
    return;
  }

  try {
    const response = await fetch(`/FitWell/api/meals?query=${encodeURIComponent(query)}&goal=${selectedGoal}`);
    const meals = await response.json();
    resultsContainer.innerHTML = "";

    if (!Array.isArray(meals) || meals.length === 0) {
      resultsContainer.innerHTML = "<p>No results found.</p>";
      return;
    }

    for (let info of meals) {
      const mealDiv = document.createElement("div");
      mealDiv.classList.add("card");
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
      mealDiv.addEventListener('click', () => showRecipeSteps(info));
      resultsContainer.appendChild(mealDiv);
    }

  } catch (error) {
    console.error('Frontend error:', error);
    resultsContainer.innerHTML = "<p>Error retrieving meals. Try again later.</p>";
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
    // Check if meal is already in favorites and update button
    let isFavourite = false;

    try {
      const favs = await fetchFavourites();
      isFavourite = favs.some(fav => fav.mealId == info.id);
      btn_fav.textContent = isFavourite ? "❤️ Remove from Favourites" : "❤️ Add to Favourites";
      btn_fav.style.backgroundColor = isFavourite ? "#ff6f61" : "";
      btn_fav.disabled = false;
    } catch (error) {
      console.error('Error checking favourites:', error);
      btn_fav.textContent = "❤️ Error Loading Favourites";
      btn_fav.disabled = true;
    }

    // Toggle favourite on click
    btn_fav.addEventListener("click", async function () {
      try {
        if (isFavourite) {
          // Remove from favourites
          const response = await fetch(`/FitWell/api/favourites/${info.id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            isFavourite = false;
            btn_fav.textContent = "❤️ Add to Favourites";
            btn_fav.style.backgroundColor = "";
          } else {
            const errorData = await response.json();
            alert('Error removing from favourites: ' + (errorData.error || 'Unknown error'));
          }
        } else {
          // Add to favourites
          const response = await fetch('/FitWell/api/favourites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mealId: info.id,
              mealName: info.title,
              mealImage: info.image,
              calories: getNutrient(info.nutrition, 'Calories').split(" ")[0],
              protein: getNutrient(info.nutrition, 'Protein').split(" ")[0],
              fat: getNutrient(info.nutrition, 'Fat').split(" ")[0],
              carbs: getNutrient(info.nutrition, 'Carbohydrates')?.split(" ")[0] || 0
            })
          });

          if (response.ok) {
            isFavourite = true;
            btn_fav.textContent = "❤️ Remove from Favourites";
            btn_fav.style.backgroundColor = "#ff6f61";
          } else {
            const errorData = await response.json();
            alert('Error adding to favourites: ' + (errorData.error || 'Unknown error'));
          }
        }
      } catch (error) {
        console.error('Error toggling favourite:', error);
        alert('Network error occurred. Please try again.');
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
  showInstructionMessage();
});
