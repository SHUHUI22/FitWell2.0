document.addEventListener('DOMContentLoaded', function () {
    // Initialize the reminder system
    const reminderSystem = new ReminderManager();
    reminderSystem.init();
    
    // Handle general UI interactions
    handleUIInteractions();
});

class ReminderManager {
    constructor() {
        this.remindersList = document.querySelector('#reminder-list');
        this.emptyState = document.querySelector('#empty-state');
        this.reminderToDelete = null;
        this.reminderToEdit = null;
        this.deleteModal = null;
    }

    init() {
        this.setupDeleteModal();
        this.setupEventListeners();
        this.updateEmptyState();
    }

    setupDeleteModal() {
        const deleteModalElement = document.getElementById('deleteModal');
        if (deleteModalElement && typeof bootstrap !== 'undefined') {
            this.deleteModal = new bootstrap.Modal(deleteModalElement);
        }
    }

    setupEventListeners() {
        // Reminder list event delegation
        if (this.remindersList) {
            this.remindersList.addEventListener('click', (event) => {
                this.handleReminderClick(event);
            });
        }

        // Confirm delete button
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.confirmDelete();
            });
        }

        // Save edit button
        const saveEditBtn = document.getElementById('saveEditBtn');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', () => {
                this.saveReminderEdits();
            });
        }
    }

    handleReminderClick(event) {
        const target = event.target;

        if (target.closest('.delete-btn')) {
            this.reminderToDelete = target.closest('.reminder-item');
            if (this.deleteModal) {
                this.deleteModal.show();
            }
        }

        if (target.closest('.edit-btn')) {
            this.reminderToEdit = target.closest('.reminder-item');
            this.openEditModal(this.reminderToEdit);
        }
    }

    updateEmptyState() {
        const hasReminders = this.remindersList && 
                           this.remindersList.querySelectorAll('.reminder-item').length > 0;
        
        if (this.emptyState) {
            this.emptyState.style.display = hasReminders ? 'none' : 'block';
        }
        if (this.remindersList) {
            this.remindersList.style.display = hasReminders ? 'block' : 'none';
        }
    }

    // Utility function to convert messy date format to clean format
    convertMessyDateToClean(messyDateString) {
        try {
            const dateObj = new Date(messyDateString);
            if (isNaN(dateObj.getTime())) {
                throw new Error('Invalid date');
            }
            return dateObj.toISOString().split('T')[0];
        } catch (e) {
            console.error('Failed to convert date:', messyDateString, e);
            return new Date().toISOString().split('T')[0];
        }
    }

    // Function to display reminders with clean format
    displayReminder(reminderData) {
        let cleanDate = reminderData.date;
        
        // If date is in messy format, convert it
        if (reminderData.date && reminderData.date.includes('GMT+0800')) {
            cleanDate = this.convertMessyDateToClean(reminderData.date);
        }
        
        return {
            title: reminderData.title,
            datetime: `${cleanDate} at ${reminderData.time} - ${this.capitalizeFirst(reminderData.repeat)}`
        };
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    confirmDelete() {
        if (!this.reminderToDelete) return;

        const reminderId = this.reminderToDelete.getAttribute('data-id');
        if (!reminderId) {
            console.error('No reminder ID found');
            return;
        }

        fetch(`/FitWell/reminders/${reminderId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.message) {
                this.reminderToDelete.remove();
                this.updateEmptyState();
                if (this.deleteModal) {
                    this.deleteModal.hide();
                }
                this.reminderToDelete = null;
                this.showToast('Reminder deleted successfully!');
            }
        })
        .catch(error => {
            console.error('Error deleting reminder:', error);
            this.showToast('Error deleting reminder. Please try again.', 'error');
        });
    }

    openEditModal(reminder) {
        if (!reminder) return;

        const titleElement = reminder.querySelector('.reminder-text');
        const datetimeElement = reminder.querySelector('.reminder-time');
        const categoryElement = reminder.querySelector('.category-tag');

        if (!titleElement || !datetimeElement) {
            console.error('Required reminder elements not found');
            return;
        }

        const title = titleElement.innerText;
        const datetimeText = datetimeElement.innerText;
        
        console.log('Parsing datetime text:', datetimeText);
        
        const parsedData = this.parseDateTimeText(datetimeText);
        
        // Populate form
        this.setFormValue('editTitle', title);
        this.setFormValue('editTime', parsedData.timePart);
        this.setFormValue('editRepeat', parsedData.repeatPart);
        
        if (categoryElement) {
            this.setFormValue('editCategory', categoryElement.textContent.toLowerCase());
        }

        // Set date with validation
        const editDateInput = document.getElementById("editDate");
        if (editDateInput) {
            const today = new Date().toISOString().split("T")[0];
            editDateInput.setAttribute('min', today);
            editDateInput.value = parsedData.datePart;
        }

        this.showEditModal();
    }

    parseDateTimeText(datetimeText) {
        let datePart, timePart, repeatPart = 'none';
        
        try {
            // Handle format: "Wed Jul 02 2025 08:00:00 GMT+0800 (Malaysia Time) at 01:05 - None"
            if (datetimeText.includes('GMT+0800') && datetimeText.includes(' at ')) {
                const parts = datetimeText.split(' at ');
                const messyDateString = parts[0];
                
                datePart = this.convertMessyDateToClean(messyDateString);
                
                const timeAndRepeat = parts[1].split(' - ');
                timePart = timeAndRepeat[0];
                repeatPart = timeAndRepeat[1] ? timeAndRepeat[1].toLowerCase() : 'none';
            }
            // Handle clean format: "2025-07-02 at 01:05 - None"
            else if (datetimeText.includes(' at ') && datetimeText.includes(' - ')) {
                const parts = datetimeText.split(' at ');
                datePart = parts[0];
                
                const timeAndRepeat = parts[1].split(' - ');
                timePart = timeAndRepeat[0];
                repeatPart = timeAndRepeat[1] ? timeAndRepeat[1].toLowerCase() : 'none';
            }
            else {
                throw new Error('Unrecognized datetime format');
            }
        } catch (e) {
            console.error('Error parsing datetime:', e);
            // Fallback values
            datePart = new Date().toISOString().split('T')[0];
            timePart = '08:00';
            repeatPart = 'none';
        }

        console.log('Parsed:', { datePart, timePart, repeatPart });
        return { datePart, timePart, repeatPart };
    }

    setFormValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
        }
    }

    showEditModal() {
        const editModalElement = document.getElementById('editModal');
        if (editModalElement && typeof bootstrap !== 'undefined') {
            const editModal = new bootstrap.Modal(editModalElement);
            editModal.show();
        }
    }

    saveReminderEdits() {
        if (!this.reminderToEdit) return;

        const data = this.getFormData();
        if (!this.validateFormData(data)) {
            return;
        }

        console.log('Frontend sending:', data);

        fetch(`/FitWell/reminders/${this.reminderToEdit.dataset.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Server error');
                });
            }
            return response.json();
        })
        .then(({ message }) => {
            if (message !== 'ok' && message !== 'Reminder updated successfully') {
                throw new Error(message);
            }

            this.updateReminderUI(this.reminderToEdit, data);
            this.hideEditModal();
            this.reminderToEdit = null;
            this.showToast('Reminder edited successfully!');
        })
        .catch(err => {
            console.error('Error saving reminder:', err);
            this.showToast(err.message || 'Error updating reminder', 'error');
        });
    }

    getFormData() {
        return {
            title: this.getFormValue('editTitle').trim(),
            date: this.getFormValue('editDate'),
            time: this.getFormValue('editTime'),
            repeat: this.getFormValue('editRepeat'),
            category: this.getFormValue('editCategory').trim().toLowerCase()
        };
    }

    getFormValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value : '';
    }

    validateFormData(data) {
        if (!data.title) {
            this.showToast('Title is required', 'error');
            return false;
        }
        if (!data.date) {
            this.showToast('Date is required', 'error');
            return false;
        }
        if (!data.time) {
            this.showToast('Time is required', 'error');
            return false;
        }
        return true;
    }

    updateReminderUI(reminder, data) {
        // Update reminder text
        const textElement = reminder.querySelector('.reminder-text');
        if (textElement) {
            textElement.textContent = data.title;
        }

        // Update reminder time
        const timeElement = reminder.querySelector('.reminder-time');
        if (timeElement) {
            timeElement.textContent = 
                `${data.date} at ${data.time} - ${this.capitalizeFirst(data.repeat)}`;
        }

        // Update category tag
        let tag = reminder.querySelector('.category-tag');
        const formatted = this.capitalizeFirst(data.category);
        const tagClass = `category-tag category-${data.category}`;

        if (!tag) {
            tag = document.createElement('span');
            tag.className = tagClass;
            tag.textContent = formatted;
            const details = reminder.querySelector('.reminder-details');
            if (details) {
                details.prepend(tag);
            } else {
                reminder.prepend(tag);
            }
        } else {
            tag.textContent = formatted;
            tag.className = tagClass;
        }
    }

    hideEditModal() {
        const modalInst = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        if (modalInst) {
            modalInst.hide();
        }
        // Clean up backdrop
        document.querySelectorAll('.modal-backdrop').forEach(bd => bd.remove());
    }

    showToast(msg, type = 'success') {
        const toastEl = document.getElementById('reminderToast');
        const msgBox = document.getElementById('toastMessage');
        
        if (toastEl && msgBox) {
            msgBox.textContent = msg;
            
            // Add color based on type
            toastEl.className = toastEl.className.replace(/bg-\w+/, '');
            if (type === 'error') {
                toastEl.classList.add('bg-danger', 'text-white');
            } else {
                toastEl.classList.add('bg-success', 'text-white');
            }
            
            new bootstrap.Toast(toastEl).show();
        } else {
            // Fallback to alert if toast elements not found
            alert(msg);
        }
    }
}

// General UI interactions (kept separate from the reminder system)
function handleUIInteractions() {
    // Feature buttons
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

    // Navigation active state
    const currentPage = window.location.pathname;
    const navLinks = document.querySelector("#nav_reminder a");
    const isReminderPage = currentPage.includes("reminder");
    if (isReminderPage && navLinks) {
        navLinks.classList.add("active");
    }

    // Logout button
    const btn_logout = document.querySelector("#btn_logout");
    if (btn_logout) {
        btn_logout.addEventListener("click", function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = "/FitWell/logout";
            }
        });
    }
}