document.addEventListener('DOMContentLoaded', function () {
    const reminderSystem = new ReminderManager();
    reminderSystem.init();
    handleUIInteractions();
});

class ReminderManager {
    constructor() {
        this.remindersList = document.querySelector('#reminder-list');
        this.emptyState = document.querySelector('#empty-state');
        this.reminderToDelete = null;
        this.reminderToEdit = null;
        this.deleteModal = null;
        this.isSorting = false;
    }

    init() {
        this.setupDeleteModal();
        this.setupEventListeners();
        this.sortReminders();
        this.updateEmptyState();
    }

    setupDeleteModal() {
        const deleteModalElement = document.getElementById('deleteModal');
        if (deleteModalElement && typeof bootstrap !== 'undefined') {
            this.deleteModal = new bootstrap.Modal(deleteModalElement);
        }
    }

    setupEventListeners() {
        if (this.remindersList) {
            this.remindersList.addEventListener('click', (event) => {
                this.handleReminderClick(event);
            });
        }

        document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => this.confirmDelete());
        document.getElementById('saveEdit')?.addEventListener('click', () => this.saveReminderEdits());
    }

    async sortReminders() {
        if (!this.remindersList || this.isSorting) return;
        
        this.isSorting = true;
        const now = new Date();
        const reminderItems = Array.from(this.remindersList.querySelectorAll('.reminder-item'));

        // Add sorting state classes
        reminderItems.forEach(item => {
            item.classList.add('sorting');
            item.dataset.originalPos = item.getBoundingClientRect().top;
        });

        // Sort logic - nearest dates first
        reminderItems.sort((a, b) => {
            const aDateTime = this.getDateTimeFromElement(a);
            const bDateTime = this.getDateTimeFromElement(b);
            
            // Handle invalid dates
            if (isNaN(aDateTime.getTime())) return 1;
            if (isNaN(bDateTime.getTime())) return -1;
            
            // Future dates before past dates
            if (aDateTime < now && bDateTime >= now) return 1;
            if (bDateTime < now && aDateTime >= now) return -1;
            
            // Sort by date/time
            return aDateTime - bDateTime;
        });

        // Animate the sorting
        for (const item of reminderItems) {
            this.remindersList.appendChild(item);
            const newPos = item.getBoundingClientRect().top;
            const originalPos = parseFloat(item.dataset.originalPos);
            
            item.classList.remove('sorting-up', 'sorting-down');
            item.classList.add(newPos < originalPos ? 'sorting-up' : 'sorting-down');
            
            await new Promise(r => setTimeout(r, 20));
        }

        // Clean up classes
        setTimeout(() => {
            reminderItems.forEach(item => {
                item.classList.remove('sorting', 'sorting-up', 'sorting-down');
                delete item.dataset.originalPos;
            });
            this.isSorting = false;
            this.updateReminderClasses();
        }, 300);
    }

    getDateTimeFromElement(element) {
        try {
            const timeText = element.querySelector('.reminder-time')?.textContent;
            if (!timeText?.includes(' at ')) throw new Error('Invalid format');
            
            const [datePart, rest] = timeText.split(' at ');
            const [timePart] = rest.split(' - ');
            const [year, month, day] = datePart.split('-');
            const [hours, minutes] = timePart.split(':');
            
            return new Date(year, month-1, day, hours, minutes);
        } catch (e) {
            console.error('Error parsing date:', e);
            return new Date('9999-12-31'); // Invalid date
        }
    }

    updateReminderClasses() {
        const now = new Date();
        document.querySelectorAll('.reminder-item').forEach(item => {
            const dateTime = this.getDateTimeFromElement(item);
            item.classList.toggle('past', dateTime < now);
            item.classList.toggle('invalid', isNaN(dateTime.getTime()));
        });
    }

    handleReminderClick(event) {
        const target = event.target;
        if (target.closest('.delete-btn')) {
            this.reminderToDelete = target.closest('.reminder-item');
            this.deleteModal?.show();
        }
        if (target.closest('.edit-btn')) {
            this.reminderToEdit = target.closest('.reminder-item');
            this.openEditModal(this.reminderToEdit);
        }
    }

    updateEmptyState() {
        const hasReminders = this.remindersList?.querySelectorAll('.reminder-item').length > 0;
        if (this.emptyState) this.emptyState.style.display = hasReminders ? 'none' : 'block';
        if (this.remindersList) this.remindersList.style.display = hasReminders ? 'block' : 'none';
    }

    confirmDelete() {
        if (!this.reminderToDelete) return;

        const reminderId = this.reminderToDelete.dataset.id;
        if (!reminderId) return;

        const confirmBtn = document.getElementById('confirmDeleteBtn');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Deleting...';

        fetch(`/FitWell/reminders/${reminderId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.message) {
                this.reminderToDelete.remove();
                this.sortReminders();
                this.updateEmptyState();
                this.deleteModal?.hide();
                this.showToast('Reminder deleted successfully!');
            }
        })
        .catch(error => {
            this.showToast('Error deleting reminder. Please try again.', 'error');
            console.error('Delete error:', error);
        })
        .finally(() => {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Delete';
            this.reminderToDelete = null;
        });
    }

    openEditModal(reminder) {
        if (!reminder) return;

        const title = reminder.querySelector('.reminder-text')?.textContent || '';
        const datetimeText = reminder.querySelector('.reminder-time')?.textContent || '';
        const category = reminder.querySelector('.category-tag')?.textContent.toLowerCase() || 'workout';

        const { datePart, timePart, repeatPart } = this.parseDateTimeText(datetimeText);
        
        this.setFormValue('editTitle', title);
        this.setFormValue('editTime', timePart);
        this.setFormValue('editRepeat', repeatPart);
        this.setFormValue('editCategory', category);

        const editDateInput = document.getElementById("editDate");
        if (editDateInput) {
            const today = new Date().toISOString().split("T")[0];
            editDateInput.setAttribute('min', today);
            editDateInput.value = datePart;
        }

        this.showEditModal();
    }

    saveReminderEdits() {
        if (!this.reminderToEdit) return;

        const data = this.getFormData();
        if (!this.validateFormData(data)) return;

        const saveBtn = document.getElementById('saveEdit');
        const originalBtnText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

        fetch(`/FitWell/reminders/${this.reminderToEdit.dataset.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(({ message }) => {
            if (!['ok', 'Reminder updated successfully'].includes(message)) {
                throw new Error(message);
            }

            this.updateReminderUI(this.reminderToEdit, data);
            this.sortReminders();
            this.hideEditModal();
            this.showToast('Reminder updated successfully!');
        })
        .catch(error => {
            console.error('Update error:', error);
            this.showToast(error.message || 'Error updating reminder', 'error');
        })
        .finally(() => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnText;
            this.reminderToEdit = null;
        });
    }

    updateReminderUI(reminder, data) {
        // Update text content
        const textElement = reminder.querySelector('.reminder-text');
        if (textElement) textElement.textContent = data.title;

        // Update time display
        const timeElement = reminder.querySelector('.reminder-time');
        if (timeElement) {
            timeElement.textContent = `${data.date} at ${data.time} - ${this.capitalizeFirst(data.repeat)}`;
        }

        // Update category
        let tag = reminder.querySelector('.category-tag');
        const tagClass = `category-tag category-${data.category}`;
        if (!tag) {
            tag = document.createElement('span');
            tag.className = tagClass;
            tag.textContent = this.capitalizeFirst(data.category);
            reminder.querySelector('.reminder-details')?.prepend(tag);
        } else {
            tag.className = tagClass;
            tag.textContent = this.capitalizeFirst(data.category);
        }

        // Update data attributes for sorting
        reminder.dataset.date = data.date;
        reminder.dataset.time = data.time;
    }

    // Helper methods
    parseDateTimeText(text) {
        let datePart, timePart, repeatPart = 'none';
        try {
            if (text.includes(' at ')) {
                const [date, rest] = text.split(' at ');
                const [time, repeat] = rest.split(' - ');
                return {
                    datePart: date,
                    timePart: time,
                    repeatPart: repeat?.toLowerCase() || 'none'
                };
            }
            throw new Error('Invalid format');
        } catch (e) {
            console.error('Parse error:', e);
            return {
                datePart: new Date().toISOString().split('T')[0],
                timePart: '08:00',
                repeatPart: 'none'
            };
        }
    }

    setFormValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = value;
    }

    getFormValue(id) {
        return document.getElementById(id)?.value || '';
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

    capitalizeFirst(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }

    showEditModal() {
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
    }

    hideEditModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        modal?.hide();
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    }

    showToast(message, type = 'success') {
        const toastEl = document.getElementById('reminderToast');
        if (!toastEl) return alert(message);
        
        const msgBox = document.getElementById('toastMessage');
        msgBox.textContent = message;
        
        toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'}`;
        new bootstrap.Toast(toastEl).show();
    }
}

// General UI handlers
function handleUIInteractions() {
    // Feature buttons
    document.querySelectorAll(".btn_feature").forEach(btn => {
        btn.addEventListener("click", function() {
            const link = this.closest(".card")?.getAttribute("data-link");
            if (link) window.location.href = link;
        });
    });

    // Navigation active state
    if (window.location.pathname.includes("reminder")) {
        document.querySelector("#nav_reminder a")?.classList.add("active");
    }

    // Logout button
    document.querySelector("#btn_logout")?.addEventListener("click", function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = "/FitWell/logout";
        }
    });
}