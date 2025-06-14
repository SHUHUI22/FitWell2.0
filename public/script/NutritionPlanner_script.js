document.getElementById("btn-meal-suggestion").addEventListener("click", function(){
    window.location.href = "/FitWell/NutritionPlanner/MealSuggestion";
});

document.getElementById("btn-myfav").addEventListener("click", function(){
    window.location.href = "/FitWell/NutritionPlanner/FavouriteMeal";
});

document.getElementById("btn-log").addEventListener("click", function(){
    window.location.href = "/FitWell/NutritionPlanner/MealLogging";
});

document.getElementById("btn-cal").addEventListener("click", function(){
    window.location.href = "/FitWell/NutritionPlanner/Calculator";
});


document.addEventListener("DOMContentLoaded", function () {
    // Automatically highlight the correct nav link based on current page
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
    const href = link.getAttribute("href");

    if (href && href.includes(currentPage)) {
        link.classList.add("active");
    }
});

});