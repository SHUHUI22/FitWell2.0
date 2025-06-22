// Spoonacular API key 
const apiKey = "931113120c0c4a369daaa8e9bf92f571";

// Set today's date 
const today = new Date().toISOString().split('T')[0];
document.getElementById('log-date').value = today;

let selectedMeal = null;
let selectedCategory = null;

// Load meals when page loads and when date changes
document.addEventListener('DOMContentLoaded', function () {
    loadMealsForDate(today);
    
    // Add event listener for date change
    document.getElementById('log-date').addEventListener('change', function() {
        const selectedDate = this.value;
        loadMealsForDate(selectedDate);
    });

    // Set up navigation active state
    setActiveNavigation();
});

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

    // Reset modal content
    document.getElementById("search-input").value = "";
    document.getElementById("search-results").innerHTML = "";
    document.getElementById("serving-section").classList.add("d-none");
    selectedMeal = null;
}

// Search meal using Spoonacular API
async function searchMeal() {
    const query = document.getElementById("search-input").value.trim();
    const resultsDiv = document.getElementById("search-results");

    if (query.length === 0) {
        resultsDiv.innerHTML = "";
        return;
    }

    resultsDiv.innerHTML = "<p>Searching...</p>";

    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=10&addRecipeInformation=true&apiKey=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            resultsDiv.innerHTML = "<p>No meals found. Try a different search term.</p>";
            return;
        }

        // Display search results
        resultsDiv.innerHTML = data.results.map(meal => `
          <div class="card mb-2 shadow-sm meal-option" style="cursor: pointer;" onclick="selectMeal(${meal.id}, '${escapeHtml(meal.title)}')">
            <div class="card-body d-flex align-items-center">
              <img src="${meal.image || `https://spoonacular.com/recipeImages/${meal.id}-312x231.jpg`}" 
                   alt="${escapeHtml(meal.title)}" 
                   class="img-thumbnail me-3" 
                   style="width: 70px; height: 70px; object-fit: cover;"
                   onerror="this.src='https://via.placeholder.com/70x70?text=No+Image'" />
              <div>
                <h5 class="card-title mb-1">${escapeHtml(meal.title)}</h5>
                <small class="text-muted">Ready in ${meal.readyInMinutes || 'N/A'} minutes</small>
              </div>
            </div>
          </div>
        `).join("");

    } catch (error) {
        console.error('Error searching meals:', error);
        resultsDiv.innerHTML = `<p class="text-danger">Error searching meals. Please try again.</p>`;
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Called when user clicks a meal option
async function selectMeal(id, title) {
    const section = document.getElementById("serving-section");
    const loadingMsg = document.createElement('p');
    loadingMsg.textContent = 'Loading nutrition information...';
    loadingMsg.className = 'text-info';
    
    section.innerHTML = '';
    section.appendChild(loadingMsg);
    section.classList.remove("d-none");

    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/${id}/nutritionWidget.json?apiKey=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch nutrition data: ${response.status}`);
        }

        const nutrition = await response.json();

        selectedMeal = {
            id: id,
            title: title,
            image: `https://spoonacular.com/recipeImages/${id}-312x231.jpg`,
            nutrition: {
                calories: parseFloat(nutrition.calories) || 0,
                carbs: parseFloat(nutrition.carbs?.replace('g', '')) || 0,
                fat: parseFloat(nutrition.fat?.replace('g', '')) || 0,
                protein: parseFloat(nutrition.protein?.replace('g', '')) || 0
            }
        };

        // Update serving section with proper form
        section.innerHTML = `
            <h4 class="mb-3">${escapeHtml(title)}</h4>
            <div class="nutrition-preview mb-3 p-3 bg-light rounded">
                <h6>Nutrition per serving:</h6>
                <div class="row">
                    <div class="col-3">
                        <strong>${selectedMeal.nutrition.calories}</strong><br>
                        <small>Calories</small>
                    </div>
                    <div class="col-3">
                        <strong>${selectedMeal.nutrition.carbs}g</strong><br>
                        <small>Carbs</small>
                    </div>
                    <div class="col-3">
                        <strong>${selectedMeal.nutrition.fat}g</strong><br>
                        <small>Fat</small>
                    </div>
                    <div class="col-3">
                        <strong>${selectedMeal.nutrition.protein}g</strong><br>
                        <small>Protein</small>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Number of servings:</label>
                <input type="number" class="form-control w-25" id="servings-input" min="0.1" step="0.1" value="1" />
            </div>
            <button class="btn btn-success btn-modal-log" onclick="confirmLogMeal()">Log My Meal</button>
        `;

        // Scroll to servings input
        document.getElementById("servings-input").scrollIntoView({ behavior: "smooth", block: "center" });

    } catch (error) {
        console.error('Error fetching nutrition info:', error);
        section.innerHTML = `<p class="text-danger">Failed to load nutrition information. Please try again.</p>`;
        selectedMeal = null;
    }
}

// Log meal to database
async function confirmLogMeal() {
    const servingsInput = document.getElementById("servings-input");
    const servings = parseFloat(servingsInput.value);
    const selectedDate = document.getElementById('log-date').value;
    
    // Debug logging
    console.log('=== Meal Logging Debug ===');
    console.log('Selected Meal:', selectedMeal);
    console.log('Selected Category:', selectedCategory);
    console.log('Servings:', servings);
    console.log('Selected Date:', selectedDate);
    
    if (!selectedMeal) {
        showNotification('Please select a meal first', 'error');
        return;
    }
    
    if (!servings || servings <= 0) {
        showNotification('Please enter a valid number of servings', 'error');
        servingsInput.focus();
        return;
    }

    if (!selectedDate) {
        showNotification('Please select a date', 'error');
        return;
    }

    if (!selectedCategory) {
        showNotification('Please select a meal category', 'error');
        return;
    }

    // Show loading state
    const logButton = document.querySelector('.btn-modal-log');
    const originalText = logButton.textContent;
    logButton.textContent = 'Logging...';
    logButton.disabled = true;

    // Prepare the payload
    const payload = {
        mealId: selectedMeal.id.toString(),
        title: selectedMeal.title,
        image: selectedMeal.image,
        nutrition: selectedMeal.nutrition,
        servings: servings,
        mealType: selectedCategory,
        date: selectedDate
    };

    console.log('Payload being sent:', payload);

    try {
        const response = await fetch('/FitWell/NutritionPlanner/MealLogging/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        let result;
        try {
            result = await response.json();
            console.log('Response data:', result);
        } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            const textResponse = await response.text();
            console.log('Raw response:', textResponse);
            throw new Error(`Server returned invalid JSON. Status: ${response.status}`);
        }

        if (response.ok && result.success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('mealModal'));
            modal.hide();
            
            // Reload meals for the selected date
            await loadMealsForDate(selectedDate);
            
            // Reset form
            resetModalForm();
            
            // Show success message
            showNotification('Meal logged successfully!', 'success');
        } else {
            const errorMessage = result.error || `HTTP ${response.status}: ${response.statusText}`;
            console.error('Server error:', errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Error logging meal:', error);
        showNotification('Error logging meal: ' + error.message, 'error');
    } finally {
        // Reset button state
        logButton.textContent = originalText;
        logButton.disabled = false;
    }
}

// Reset modal form
function resetModalForm() {
    selectedMeal = null;
    selectedCategory = null;
    document.getElementById("search-input").value = "";
    document.getElementById("search-results").innerHTML = "";
    document.getElementById("serving-section").classList.add("d-none");
}

// Load meals for a specific date from database
async function loadMealsForDate(date) {
    if (!date) {
        console.error('Date is required');
        return;
    }

    try {
        const response = await fetch(`/FitWell/NutritionPlanner/MealLogging/meals?date=${encodeURIComponent(date)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success) {
            // Clear existing meals
            ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
                const mealList = document.getElementById(`${mealType}-list`);
                if (mealList) {
                    mealList.innerHTML = '';
                }
            });

            // Populate meals
            Object.keys(data.meals).forEach(mealType => {
                const mealList = document.getElementById(`${mealType}-list`);
                if (mealList && data.meals[mealType]) {
                    data.meals[mealType].forEach(meal => {
                        addMealToDisplay(meal, mealList);
                    });
                }
            });

            // Update summary table
            updateSummaryTable(data.dailyTotals || {calories: 0, carbs: 0, fat: 0, protein: 0});
        } else {
            console.error('Error loading meals:', data.error);
            showNotification('Error loading meals: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error fetching meals:', error);
        showNotification('Error loading meals. Please try again.', 'error');
        
        // Reset summary table to zeros
        updateSummaryTable({calories: 0, carbs: 0, fat: 0, protein: 0});
    }
}

// Add meal to display
function addMealToDisplay(meal, mealList) {
    const mealEntry = document.createElement('div');
    mealEntry.className = 'meal-entry bg-light border p-3 rounded d-flex justify-content-between align-items-center mb-2';
    mealEntry.setAttribute('data-meal-id', meal.id);
    
    mealEntry.innerHTML = `
        <div class="d-flex align-items-center flex-grow-1">
            <img src="${meal.image || 'https://via.placeholder.com/70x70?text=No+Image'}" 
                 alt="${escapeHtml(meal.title)}" 
                 class="img-thumbnail me-3" 
                 style="width: 70px; height: 70px; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/70x70?text=No+Image'" />
            <div class="meal-info">
                <h6 class="mb-1">${escapeHtml(meal.title)}</h6>
                <div class="nutrition-info">
                    <span class="badge bg-primary me-1">${meal.totalNutrition.calories} kcal</span>
                    <span class="badge bg-secondary me-1">${meal.totalNutrition.carbs}g carbs</span>
                    <span class="badge bg-success me-1">${meal.totalNutrition.fat}g fat</span>
                    <span class="badge bg-warning text-dark">${meal.totalNutrition.protein}g protein</span>
                </div>
                <small class="text-muted">Servings: ${meal.servings}</small>
            </div>
        </div>
        <div class="meal-actions">
            <button class="btn btn-sm btn-outline-primary me-2 btn-edit-meal" 
                    title="Edit Servings" 
                    data-meal-id="${meal.id}"
                    data-current-servings="${meal.servings}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger btn-delete-meal" 
                    title="Delete Meal" 
                    data-meal-id="${meal.id}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

    mealList.appendChild(mealEntry);

    // Add event listeners
    const editBtn = mealEntry.querySelector('.btn-edit-meal');
    const deleteBtn = mealEntry.querySelector('.btn-delete-meal');

    editBtn.addEventListener('click', function() {
        editMealServings(meal.id, meal.servings);
    });

    deleteBtn.addEventListener('click', function() {
        deleteMeal(meal.id);
    });
}

// Edit meal servings
function editMealServings(mealId, currentServings) {
    document.getElementById('edit-meal-id').value = mealId;
    document.getElementById('edit-servings-input').value = currentServings;

    const modal = new bootstrap.Modal(document.getElementById('editServingsModal'));
    modal.show();
}

document.getElementById('confirm-edit-servings').addEventListener('click', async function () {
    const mealId = document.getElementById('edit-meal-id').value;
    const newServings = parseFloat(document.getElementById('edit-servings-input').value);

    if (isNaN(newServings) || newServings <= 0) {
        showNotification('Please enter a valid number of servings', 'error');
        return;
    }

    try {
        const response = await fetch(`/FitWell/NutritionPlanner/MealLogging/meal/${mealId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ servings: newServings })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            const selectedDate = document.getElementById('log-date').value;
            await loadMealsForDate(selectedDate);
            showNotification('Meal updated successfully!', 'success');

            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('editServingsModal'));
            modalInstance.hide();
        } else {
            throw new Error(result.error || 'Failed to update meal');
        }
    } catch (error) {
        console.error('Error updating meal:', error);
        showNotification('Error updating meal: ' + error.message, 'error');
    }
});

// async function editMealServings(mealId, currentServings) {
//     const newServings = prompt(`Enter new number of servings:`, currentServings);
    
//     if (newServings === null) return; // User cancelled
    
//     const servings = parseFloat(newServings);
    
//     if (isNaN(servings) || servings <= 0) {
//         showNotification('Please enter a valid number of servings', 'error');
//         return;
//     }

//     try {
//         const response = await fetch(`/FitWell/NutritionPlanner/MealLogging/meal/${mealId}`, {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 servings: servings
//             })
//         });

//         const result = await response.json();

//         if (response.ok && result.success) {
//             // Reload meals for current date
//             const selectedDate = document.getElementById('log-date').value;
//             await loadMealsForDate(selectedDate);
//             showNotification('Meal updated successfully!', 'success');
//         } else {
//             throw new Error(result.error || 'Failed to update meal');
//         }
//     } catch (error) {
//         console.error('Error updating meal:', error);
//         showNotification('Error updating meal: ' + error.message, 'error');
//     }
// }

// Delete meal from database
function deleteMeal(mealId) {
    document.getElementById('delete-meal-id').value = mealId;

    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

document.getElementById('confirm-delete-meal').addEventListener('click', async function () {
    const mealId = document.getElementById('delete-meal-id').value;

    try {
        const response = await fetch(`/FitWell/NutritionPlanner/MealLogging/meal/${mealId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok && result.success) {
            const selectedDate = document.getElementById('log-date').value;
            await loadMealsForDate(selectedDate);
            showNotification('Meal deleted successfully!', 'success');

            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
            modalInstance.hide();
        } else {
            throw new Error(result.error || 'Failed to delete meal');
        }
    } catch (error) {
        console.error('Error deleting meal:', error);
        showNotification('Error deleting meal: ' + error.message, 'error');
    }
});

// async function deleteMeal(mealId) {
//     if (!confirm('Are you sure you want to delete this meal?')) {
//         return;
//     }

//     try {
//         const response = await fetch(`/FitWell/NutritionPlanner/MealLogging/meal/${mealId}`, {
//             method: 'DELETE'
//         });

//         const result = await response.json();

//         if (response.ok && result.success) {
//             // Reload meals for current date
//             const selectedDate = document.getElementById('log-date').value;
//             await loadMealsForDate(selectedDate);
//             showNotification('Meal deleted successfully!', 'success');
//         } else {
//             throw new Error(result.error || 'Failed to delete meal');
//         }
//     } catch (error) {
//         console.error('Error deleting meal:', error);
//         showNotification('Error deleting meal: ' + error.message, 'error');
//     }
// }

// Update summary table
function updateSummaryTable(totals) {
    const row = document.getElementById("summary-row");
    if (row && row.children.length >= 4) {
        row.children[0].textContent = totals.calories || 0;
        row.children[1].textContent = totals.carbs || 0;
        row.children[2].textContent = totals.fat || 0;
        row.children[3].textContent = totals.protein || 0;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed custom-notification`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;';
    notification.innerHTML = `
        ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Event listeners setup
document.addEventListener("DOMContentLoaded", function () {
    // Search input enter key
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                searchMeal();
            }
        });
    }
});