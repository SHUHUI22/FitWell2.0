document.getElementById("btn-meal-suggestion").addEventListener("click", function(){
    window.location.href = "/FitWell/MealSuggestion";
});

document.getElementById("btn-myfav").addEventListener("click", function(){
    window.location.href = "/FitWell/FavouriteMeal";
});

document.getElementById("btn-log").addEventListener("click", function(){
    window.location.href = "/FitWell/MealLogging";
});

document.getElementById("btn-cal").addEventListener("click", function(){
    window.location.href = "/FitWell/Calculator";
});


document.addEventListener("DOMContentLoaded", function () {
    // const nav = document.querySelector(".navbar");
    // const features = document.querySelectorAll(".card");
    // const isLoggedIn = localStorage.getItem("loggedIn");

    // // Check if user is logged in
    // if (isLoggedIn === "true") {
       
    //     // Card feature redirection
    //     const buttons = document.querySelectorAll(".btn_feature");
    //     buttons.forEach(button => {
    //         button.addEventListener("click", function () {
    //             const card = button.closest(".card");
    //             const link = card.getAttribute("data-link");
    //             if (link) {
    //                 console.log("Redirecting to:", link);
    //                 window.location.href = link;
    //             }
    //         });
    //     });
    // }

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