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

    this.editModalEl = document.getElementById('editModal');
    if (this.editModalEl && typeof bootstrap !== 'undefined') {
      this.editModal = bootstrap.Modal.getOrCreateInstance(this.editModalEl);
      this.editModalEl.addEventListener('hidden.bs.modal', () => {});
    }
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
    this.remindersList?.addEventListener('click', (event) => this.handleReminderClick(event));
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => this.confirmDelete());
    document.getElementById('saveEdit')?.addEventListener('click', () => this.saveReminderEdits());
  }

  async sortReminders() {
    if (!this.remindersList || this.isSorting) return;
    this.isSorting = true;
    const now = new Date();
    const items = Array.from(this.remindersList.querySelectorAll('.reminder-item'));

    items.forEach(item => {
      item.classList.add('sorting');
      item.dataset.originalPos = item.getBoundingClientRect().top;
    });

    items.sort((a, b) => {
      const da = this.getDateTimeFromElement(a);
      const db = this.getDateTimeFromElement(b);
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      if (da < now && db >= now) return 1;
      if (db < now && da >= now) return -1;
      return da - db;
    });

    for (const item of items) {
      this.remindersList.appendChild(item);
      const newPos = item.getBoundingClientRect().top;
      const oldPos = parseFloat(item.dataset.originalPos);
      item.classList.remove('sorting-up', 'sorting-down');
      item.classList.add(newPos < oldPos ? 'sorting-up' : 'sorting-down');
      await new Promise(r => setTimeout(r, 20));
    }

    setTimeout(() => {
      items.forEach(item => {
        item.classList.remove('sorting', 'sorting-up', 'sorting-down');
        delete item.dataset.originalPos;
      });
      this.isSorting = false;
      this.updateReminderClasses();
    }, 300);
  }

  getDateTimeFromElement(el) {
    try {
      const text = el.querySelector('.reminder-time')?.textContent;
      if (!text?.includes(' at ')) throw '';
      const [d, rest] = text.split(' at ');
      const [t] = rest.split(' - ');
      const [y, m, day] = d.split('-').map(Number);
      const [h, min] = t.split(':').map(Number);
      return new Date(y, m - 1, day, h, min);
    } catch {
      return new Date('9999-12-31');
    }
  }

  updateReminderClasses() {
    const now = new Date();
    this.remindersList?.querySelectorAll('.reminder-item').forEach(item => {
      const d = this.getDateTimeFromElement(item);
      item.classList.toggle('past', d < now);
      item.classList.toggle('invalid', isNaN(d));
    });
  }

  handleReminderClick(e) {
    const btn = e.target.closest('.delete-btn');
    if (btn) {
      this.reminderToDelete = btn.closest('.reminder-item');
      this.deleteModal?.show();
      return;
    }
    const edit = e.target.closest('.edit-btn');
    if (edit) {
      this.reminderToEdit = edit.closest('.reminder-item');
      this.openEditModal(this.reminderToEdit);
    }
  }

  updateEmptyState() {
    const has = this.remindersList?.querySelectorAll('.reminder-item').length > 0;
    this.emptyState && (this.emptyState.style.display = has ? 'none' : 'block');
    this.remindersList && (this.remindersList.style.display = has ? 'block' : 'none');
  }


  confirmDelete() {
    if (!this.reminderToDelete) return;
    const id = this.reminderToDelete.dataset.id;
    if (!id) return;

    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Deleting...';

    fetch(`/FitWell/reminders/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
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
      .catch(() => this.showToast('Error deleting reminder. Please try again.', 'error'))
      .finally(() => {
        btn.disabled = false;
        btn.textContent = 'Delete';
        this.reminderToDelete = null;
      });
  }

    openEditModal(rem) {
    if (!rem) return;

    const t = rem.querySelector('.reminder-text')?.textContent.trim() || '';
    
    let dtRaw = rem.querySelector('.reminder-time')?.textContent || '';
    dtRaw = dtRaw.trim().replace(/\s+/g, ' '); // Clean newlines and extra spaces

    let catRaw = rem.querySelector('.category-tag')?.textContent || 'workout';
    const cat = catRaw.trim().toLowerCase();

    const [dateTimePart = '', repeatPart = 'none'] = dtRaw.split(' - ').map(x => x.trim());
    const [datePart = '', timePart = ''] = dateTimePart.split(' at ').map(x => x.trim());

    console.log('Cleaned data:', { title: t, datePart, timePart, repeatPart, category: cat });

    this.setFormValue('editTitle', t);
    this.setFormValue('editCategory', cat);
    this.setFormValue('editDate', datePart);
    this.setFormValue('editTime', timePart);
    this.setFormValue('editRepeat', repeatPart.toLowerCase());

    this.editModal.show();
    }


  saveReminderEdits() {
    if (!this.reminderToEdit) return;
    const data = this.getFormData();
    if (!this.validateFormData(data)) return;

    const btn = document.getElementById('saveEdit');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving...';

    fetch(`/FitWell/reminders/${this.reminderToEdit.dataset.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(res => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
      })
      .then(res => {
        this.updateReminderUI(this.reminderToEdit, data);
        this.sortReminders();
        this.hideEditModal();
        this.showToast('Reminder updated successfully!');
      })
      .catch(e => this.showToast(e.message || 'Error updating reminder', 'error'))
      .finally(() => {
        btn.disabled = false;
        btn.innerHTML = orig;
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

    setFormValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
        } else {
            console.warn(`Field with ID "${fieldId}" not found.`);
        }
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
    // Navigation active state
    if (window.location.pathname.includes("reminder")) {
        document.querySelector("#nav_reminder a")?.classList.add("active");
    }
}