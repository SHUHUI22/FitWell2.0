document.addEventListener('DOMContentLoaded', function () {
    // User login and logout logic
    const isLoggedIn = localStorage.getItem("loggedIn");

    if (isLoggedIn === "true") {
        handleLoggedInState();
    }

    // Handle logged-in state UI changes
    function handleLoggedInState() {
        document.body.classList.add("logged-in");

        const showIds = [
            "nav_tracker", "nav_nutrition", "nav_progress", "nav_reminder", "nav_profile",
            "quicklink_tracker", "quicklink_progress", "quicklink_nutrition", "quicklink_reminder"
        ];
        showIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove("d-none");
        });

        const btn_login = document.querySelector("#btn_login");
        const btn_signup = document.querySelector("#btn_signup");
        const btn_get_started = document.querySelector("#btn_get_started");

        if (btn_login) btn_login.classList.add("d-none");
        if (btn_signup) btn_signup.classList.add("d-none");
        if (btn_get_started) btn_get_started.classList.add("d-none");

        const buttons = document.querySelectorAll(".btn_feature");
        buttons.forEach(button => {
            button.addEventListener("click", function () {
                const card = button.closest(".card");
                const link = card.getAttribute("data-link");
                if (link) {
                    window.location.href = link;
                }
            });
        });
    }

    // Highlight the active page in the navigation
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelector("#nav_reminder a");

    const isReminderPage = currentPage === "CreateReminder.html" || currentPage === "MyReminder.html";
    console.log(currentPage)
    if (isReminderPage && navLinks) {
        navLinks.classList.add("active");
    }

    // Logout functionality
    const btn_logout = document.querySelector("#btn_logout");
    if (btn_logout) {
        btn_logout.addEventListener("click", logout);
    }

    function logout() {
        const favorites = localStorage.getItem('mealFavourites');
        localStorage.clear();
        if (favorites) {
            localStorage.setItem('mealFavourites', favorites);
        }
        setTimeout(() => {
            window.location.href = "Login.html";
        }, 500);
    }
    
    // DOM elements for reminders list and empty state
    const remindersList = document.querySelector('#reminder-list');
    const emptyState = document.querySelector('#empty-state');
    let reminderToDelete = null;
    let reminderToEdit = null;

    // Update the display of the empty state based on the reminders list
    function updateEmptyState() {
        const hasReminders = remindersList.querySelectorAll('.reminder-item').length > 0;
        emptyState.style.display = hasReminders ? 'none' : 'block';
        remindersList.style.display = hasReminders ? 'block' : 'none';
    }

    updateEmptyState();

    // Delete modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Handle reminder interactions (edit, delete)
    remindersList.addEventListener('click', function (event) {
        const target = event.target;

        // Handle delete
        if (target.closest('.delete-btn')) {
            reminderToDelete = target.closest('.reminder-item');
            deleteModal.show();
        }

        // Handle edit
        if (target.closest('.edit-btn')) {
            reminderToEdit = target.closest('.reminder-item');
            openEditModal(reminderToEdit);
        }
    });

    // Confirm delete reminder
    confirmDeleteBtn.addEventListener('click', function () {
        if (reminderToDelete) {
            reminderToDelete.remove();
            updateEmptyState();
            deleteModal.hide();
            reminderToDelete = null;
        }
    });

    // Open edit modal and populate with current reminder data
    function openEditModal(reminder) {
        const title = reminder.querySelector('.reminder-text').innerText;
        const datetimeText = reminder.querySelector('.reminder-time').innerText;
        const repeatText = datetimeText.split('-')[1].trim();
        
        // Parse the date string from the displayed text
        const [datePart, timePart] = datetimeText.split('at').map(part => part.trim());
        const timeValue = timePart.split('-')[0].trim();
        
        // Parse the date using the displayed format
        const dateObj = new Date(datePart);
        
        // Format the date for the input field in YYYY-MM-DD format
        // Use local date to prevent timezone issues
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        // Extract time and convert to 24-hour format
        let [timeString, ampm] = timeValue.split(' ');
        let [hours, minutes] = timeString.split(':').map(Number);
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        // Populate modal with data
        document.getElementById('editTitle').value = title;
        document.getElementById('editDate').value = formattedDate;
        document.getElementById('editTime').value = formattedTime;
        document.getElementById('editRepeat').value = repeatText;

        // Populate category (without allowing editing)
        const category = reminder.querySelector('.category-tag').textContent;
        const categorySelect = document.getElementById('editCategory');
        categorySelect.value = category;  // Set category value
        // categorySelect.disabled = true;  // Disable category dropdown

        const editModal = new bootstrap.Modal(document.getElementById('editModal'));
        editModal.show();
    }

    // Save edited reminder
    document.getElementById('saveEdit').addEventListener('click', function () {
        if (reminderToEdit) {
            saveReminderEdits(reminderToEdit);
        }
    });

    // Function to save the reminder edits
    function saveReminderEdits(reminder) {
        const title = document.getElementById('editTitle').value;
        const date = document.getElementById('editDate').value;
        const time = document.getElementById('editTime').value;
        const repeat = document.getElementById('editRepeat').value;

        // Create a date object preserving the input date
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        
        // Create date object using local components to prevent timezone issues
        const dateObj = new Date(year, month - 1, day, hours, minutes);
        
        // Format the date in a locale-friendly way
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Format the time
        const formattedTime = dateObj.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });

        // Update reminder display
        reminder.querySelector('.reminder-text').textContent = title;
        reminder.querySelector('.reminder-time').textContent = `${formattedDate} at ${formattedTime} - ${repeat.charAt(0).toUpperCase() + repeat.slice(1)}`;

        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
        reminderToEdit = null;
    }
});