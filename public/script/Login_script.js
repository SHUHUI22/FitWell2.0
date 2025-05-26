// Animation: slide out welcome message when hover
const leftSide = document.getElementById('left_side');
const overlay = document.getElementById('hover_overlay');
const message = document.getElementById('welcome_message');

leftSide.addEventListener('mouseenter', () => {
    overlay.style.transform = 'translateX(0)';
    message.style.opacity = '1';
    message.style.transform = 'translateX(0)';
});

leftSide.addEventListener('mouseleave', () => {
    overlay.style.transform = 'translateX(-100%)';
    message.style.opacity = '0';
    message.style.transform = 'translateX(-50px)';
});

// Validate the password
const passwordInput = document.getElementById("password");
const passwordError = document.getElementById("passwordError");


function validatePassword() {
    const password = passwordInput.value;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordPattern.test(password)) {
        passwordError.classList.remove("d-none");
    } else {
        passwordError.classList.add("d-none");
    }
}

passwordInput.addEventListener("input", validatePassword);

const params = new URLSearchParams(window.location.search);
if (params.get("error") === "usernotfound") {
    Swal.fire({
        icon: 'error',
        title: 'Email not found',
        text: 'No account with this email. Please sign up.',
    });
}
else if (params.get("error") === "wrongpassword") {
    Swal.fire({
        icon: 'error',
        title: 'Incorrect Password',
        text: 'Please try again.',
    });
} else if (params.get("success") === "registered") {
    Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: 'You can now log in!',
    });
}