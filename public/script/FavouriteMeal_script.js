document.addEventListener("DOMContentLoaded", function () {
    loadFavourites();
});

// Load favourites from MongoDB and display full information
async function loadFavourites() {
    try {
        const response = await fetch('/FitWell/api/favourites');
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = "/FitWell/Login";
                return;
            }
            throw new Error('Failed to fetch favourites');
        }

        const favourites = await response.json();
        const favouritesContainer = document.getElementById('favourites-container');
        
        if (!favouritesContainer) {
            console.error('Favourites container not found');
            return;
        }

        favouritesContainer.innerHTML = "";

        if (favourites.length > 0) {
            favourites.forEach(fav => {
                const col = document.createElement("div");
                col.classList.add("col-sm-4", "mb-4");

                const favCard = document.createElement("div");
                favCard.classList.add("card");

                favCard.innerHTML = `
                    <div class="card-body d-flex flex-column justify-content-between align-items-center">
                        <img src="${fav.mealImage || '/images/default-meal.png'}" alt="${fav.mealName}" class="card-img-top">
                        <div>
                            <h5 class="card-title meal-title">${fav.mealName}</h5>
                        </div>
                    </div>
                `;
                
                favCard.addEventListener('click', () => showMealModal(fav));
                col.appendChild(favCard);
                favouritesContainer.appendChild(col);
            });
        } else {
            favouritesContainer.innerHTML = `
                <div class="d-flex flex-column justify-content-center align-items-center bg-white rounded rounded-5 p-4">
                    <img class="img-fluid" src="/images/favourite.png" alt="Favourite illustration">
                    <p class="text-muted text-center">You haven't added any favorites yet. You may search for a meal and click
                    <strong>"Add to Favourites"</strong> to save it.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading favourites:', error);
        const favouritesContainer = document.getElementById('favourites-container');
        if (favouritesContainer) {
            favouritesContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    Error loading favourites. Please try again later.
                </div>
            `;
        }
    }
}

function showMealModal(meal) {
    const modalLabel = document.getElementById("mealModalLabel");
    const modalSteps = document.getElementById("modal-steps");
    const btnRemoveFav = document.getElementById("btn-remove-fav");

    if (modalLabel) modalLabel.textContent = meal.mealName;
    
    if (modalSteps) {
        modalSteps.innerHTML = `
            <img src="${meal.mealImage || '/images/default-meal.png'}" alt="${meal.mealName}" class="img-fluid rounded mb-3" style="max-height: 250px;">
            <div class="nutrition d-flex justify-content-center gap-4 mb-3">
                <p class="meal-calorie mb-0"><strong>Calories:</strong> ${meal.calories || 'N/A'}</p>
                <p class="meal-protein mb-0"><strong>Protein:</strong> ${meal.protein || 'N/A'}g</p>
                <p class="meal-fat mb-0"><strong>Fat:</strong> ${meal.fat || 'N/A'}g</p>
                <p class="meal-carbs mb-0"><strong>Carbs:</strong> ${meal.carbs || 'N/A'}g</p>
            </div>
            <div class="text-start">
                <p><strong>Added to favourites:</strong> ${new Date(meal.createdAt).toLocaleDateString()}</p>
            </div>
        `;
    }
    
    if (btnRemoveFav) {
        btnRemoveFav.setAttribute("data-meal-id", meal.mealId);
    }

    const mealModal = document.getElementById('mealModal');
    if (mealModal && typeof bootstrap !== 'undefined') {
        const myModal = new bootstrap.Modal(mealModal);
        myModal.show();
    }
}

// Remove meal from favourite list
document.addEventListener('DOMContentLoaded', function() {
    const btnRemoveFav = document.getElementById("btn-remove-fav");
    if (btnRemoveFav) {
        btnRemoveFav.addEventListener("click", async function () {
            const mealId = this.getAttribute("data-meal-id");
            if (mealId) {
                await removeFavourite(mealId);
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('mealModal'));
                if (modalInstance) {
                    modalInstance.hide();
                }
            }
        });
    }
});

async function removeFavourite(mealId) {
    try {
        const response = await fetch(`/FitWell/api/favourites/${mealId}`, { 
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to remove favourite');
        }

        // Show success message
        showNotification('Meal removed from favourites!', 'success');
        
        // Reload favourites
        loadFavourites();
    } catch (error) {
        console.error('Error removing favourite:', error);
        showNotification('Failed to remove meal from favourites', 'error');
    }
}

// Function to add meal to favourites (can be called from other pages)
async function addToFavourites(mealData) {
    try {
        const response = await fetch('/FitWell/api/favourites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mealId: mealData.id,
                mealName: mealData.title,
                mealImage: mealData.image,
                calories: mealData.calories,
                carbs: mealData.carbs,
                fat: mealData.fat,
                protein: mealData.protein
            })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Meal added to favourites!', 'success');
            return true;
        } else if (response.status === 409) {
            showNotification('Meal is already in favourites', 'warning');
            return false;
        } else {
            throw new Error(result.message || 'Failed to add to favourites');
        }
    } catch (error) {
        console.error('Error adding to favourites:', error);
        showNotification('Failed to add meal to favourites', 'error');
        return false;
    }
}

// Utility function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Make functions available globally for other scripts
window.addToFavourites = addToFavourites;
window.loadFavourites = loadFavourites;