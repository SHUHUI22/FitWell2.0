document.addEventListener('DOMContentLoaded', function () {
    const isLoggedIn = localStorage.getItem("loggedIn");

    if (isLoggedIn === "true") {
        handleLoggedInState();
    }

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

    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelector("#nav_reminder a");

    const isReminderPage = currentPage === "CreateReminder.html" || currentPage === "MyReminder.html";
    if (isReminderPage && navLinks) {
        navLinks.classList.add("active");
    }

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

    const remindersList = document.querySelector('#reminder-list');
    const emptyState = document.querySelector('#empty-state');
    let reminderToDelete = null;
    let reminderToEdit = null;

    function updateEmptyState() {
        const hasReminders = remindersList && remindersList.querySelectorAll('.reminder-item').length > 0;
        if (emptyState) {
            emptyState.style.display = hasReminders ? 'none' : 'block';
        }
        if (remindersList) {
            remindersList.style.display = hasReminders ? 'block' : 'none';
        }
    }

    updateEmptyState();

    const deleteModalElement = document.getElementById('deleteModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    let deleteModal;

    if (deleteModalElement && typeof bootstrap !== 'undefined') {
        deleteModal = new bootstrap.Modal(deleteModalElement);
    }

    if (remindersList) {
        remindersList.addEventListener('click', function (event) {
            const target = event.target;

            if (target.closest('.delete-btn')) {
                reminderToDelete = target.closest('.reminder-item');
                if (deleteModal) {
                    deleteModal.show();
                }
            }

            if (target.closest('.edit-btn')) {
                reminderToEdit = target.closest('.reminder-item');
                openEditModal(reminderToEdit);
            }
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function () {
            if (reminderToDelete) {
                const reminderId = reminderToDelete.getAttribute('data-id');

                fetch(`/FitWell/reminders/${reminderId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        reminderToDelete.remove();
                        updateEmptyState();
                        if (deleteModal) {
                            deleteModal.hide();
                        }
                        reminderToDelete = null;
                        location.reload();
                    }
                })
                .catch(error => {
                    console.error('Error deleting reminder:', error);
                    alert('Error deleting reminder. Please try again.');
                });
            }
        });
    }

    function openEditModal(reminder) {
        const title = reminder.querySelector('.reminder-text').innerText;
        const datetimeText = reminder.querySelector('.reminder-time').innerText;

        const parts = datetimeText.split(' at ');
        const datePart = parts[0];
        const timeAndRepeat = parts[1].split(' - ');
        const timePart = timeAndRepeat[0];
        const repeatPart = timeAndRepeat[1].toLowerCase();

        document.getElementById('editTitle').value = title;
        document.getElementById('editDate').value = datePart;
        document.getElementById('editTime').value = timePart;
        document.getElementById('editRepeat').value = repeatPart;

        const category = reminder.querySelector('.category-tag').textContent.toLowerCase();
        document.getElementById('editCategory').value = category;

        const editModalElement = document.getElementById('editModal');
        if (editModalElement && typeof bootstrap !== 'undefined') {
            const editModal = new bootstrap.Modal(editModalElement);
            editModal.show();
        }
    }

    const saveEditBtn = document.getElementById('saveEdit');
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', function () {
            if (reminderToEdit) {
                saveReminderEdits(reminderToEdit);
            }
        });
    }

    function saveReminderEdits(reminder) {
  const data = {
    title:    document.getElementById('editTitle').value.trim(),
    date:     document.getElementById('editDate').value,
    time:     document.getElementById('editTime').value,
    repeat:   document.getElementById('editRepeat').value,
    category: document.getElementById('editCategory').value.trim().toLowerCase()
  };

  fetch(`/FitWell/reminders/${reminder.dataset.id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data)
  })
    .then(r => r.json())
    .then(({ message }) => {
      if (message !== 'ok' && message !== 'Reminder updated successfully') {
        throw new Error(message);
      }

      /* ——— 1. Update title + time ——— */
      reminder.querySelector('.reminder-text').textContent = data.title;
      reminder.querySelector('.reminder-time').textContent =
        `${data.date} at ${data.time} - ${data.repeat.charAt(0).toUpperCase() + data.repeat.slice(1)}`;

      /* ——— 2. Ensure the category pill exists & is styled ——— */
      let tag = reminder.querySelector('.category-tag');
      const formatted = data.category.charAt(0).toUpperCase() + data.category.slice(1);
      const tagClass  = `category-tag category-${data.category}`;

      if (!tag) {
        tag = document.createElement('span');
        tag.className = tagClass;
        tag.textContent = formatted;

        // insert as first child of .reminder-details
        const details = reminder.querySelector('.reminder-details');
        details ? details.prepend(tag) : reminder.prepend(tag);
      } else {
        tag.textContent = formatted;
        tag.className   = tagClass;
      }

      /* ——— 3. Close modal + clear backdrop ——— */
      const modalInst = bootstrap.Modal.getInstance(document.getElementById('editModal'));
      modalInst?.hide();
      document.querySelectorAll('.modal-backdrop').forEach(bd => bd.remove());

      reminderToEdit = null;
      showToast('Reminder edited successfully!');
    })
    .catch(err => {
      console.error(err);
      alert('Error updating reminder');
    });
}


/* helper (only once in the file) */
function showToast(msg) {
  const toastEl = document.getElementById('reminderToast');
  const msgBox  = document.getElementById('toastMessage');
  msgBox.textContent = msg;
  new bootstrap.Toast(toastEl).show();
}
}
)
;

