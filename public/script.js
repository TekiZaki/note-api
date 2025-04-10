document.addEventListener("DOMContentLoaded", function () {
  // --- DOM Elements ---
  const notesContainer = document.getElementById("notesContainer");
  const addNoteBtn = document.getElementById("addNoteBtn");
  const noteModal = document.getElementById("noteModal");
  const confirmModal = document.getElementById("confirmModal");
  const detailModal = document.getElementById("detailModal"); // <-- NEW
  const noteForm = document.getElementById("noteForm");
  const searchInput = document.getElementById("searchInput");
  const loadingIndicator = document.getElementById("loadingIndicator");

  // Form Modal elements
  const modalTitle = document.getElementById("modalTitle");
  const noteIdField = document.getElementById("noteId");
  const noteTitleField = document.getElementById("noteTitle");
  const noteContentField = document.getElementById("noteContent");

  // Detail Modal elements <-- NEW
  const detailNoteTitle = document.getElementById("detailNoteTitle");
  const detailNoteDate = document.getElementById("detailNoteDate");
  const detailNoteContent = document.getElementById("detailNoteContent");

  // --- State Variables ---
  let notes = []; // Local cache of notes
  let currentNoteId = null; // ID of the note being edited
  let deleteNoteId = null; // ID of the note to be deleted

  // --- API Configuration ---
  const API_URL = "http://localhost:6969/notes";

  // --- Initialization ---
  init();

  async function init() {
    setupEventListeners();
    // Configure marked (optional: add options like GFM, breaks)
    marked.setOptions({
      gfm: true, // Enable GitHub Flavored Markdown
      breaks: true, // Convert single line breaks to <br>
      // sanitize: true, // DEPRECATED in newer versions. Use a dedicated sanitizer if needed AFTER marked processing.
    });
    await fetchNotes(); // Load initial notes
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    addNoteBtn.addEventListener("click", () => openModal("add"));
    searchInput.addEventListener("input", debounce(handleSearch, 300));
    noteForm.addEventListener("submit", handleFormSubmit);

    // Modal close/cancel buttons using event delegation on modals
    noteModal.addEventListener("click", handleModalClick);
    confirmModal.addEventListener("click", handleModalClick);
    detailModal.addEventListener("click", handleModalClick); // <-- NEW: Handle clicks for detail modal

    // Confirmation modal actions
    document
      .getElementById("confirmCancel")
      .addEventListener("click", closeConfirmModal);
    document
      .getElementById("confirmDelete")
      .addEventListener("click", handleDeleteConfirm);

    // Event delegation for note actions (Edit/Delete/View)
    notesContainer.addEventListener("click", handleNoteAction);

    // Optional: Close modals with Escape key
    window.addEventListener("keydown", handleEscKey);
  }

  // --- Core Functions ---

  async function fetchNotes() {
    // ... (fetchNotes function remains the same as before) ...
    showLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fetchedNotes = await response.json();
      // Sort notes by date, newest first (assuming 'tanggal' field exists)
      // Ensure 'tanggal' exists and is valid before sorting
      notes = fetchedNotes.sort((a, b) => {
        const dateA = a.tanggal ? new Date(a.tanggal) : new Date(0);
        const dateB = b.tanggal ? new Date(b.tanggal) : new Date(0);
        // Check for invalid dates if necessary
        if (isNaN(dateA.getTime())) return 1; // Push invalid dates down
        if (isNaN(dateB.getTime())) return -1;
        return dateB - dateA;
      });
      renderNotes(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      showError(
        "Gagal memuat catatan. Pastikan server API berjalan atau coba lagi nanti."
      );
      renderNotes([]); // Render empty state on error
    } finally {
      showLoading(false);
    }
  }

  function renderNotes(notesToRender) {
    // ... (renderNotes function remains mostly the same) ...
    notesContainer.innerHTML = ""; // Clear previous notes

    if (
      notesToRender.length === 0 &&
      loadingIndicator.style.display === "none"
    ) {
      // Show empty state only if not loading and no notes
      notesContainer.innerHTML = `
          <div class="empty-state">
              <i class="far fa-sticky-note"></i>
              <h3>Belum Ada Catatan</h3>
              <p>Klik tombol "Tambah Catatan" untuk membuat catatan pertama Anda.</p>
          </div>`;
      return;
    }

    // Create note elements and append
    notesToRender.forEach((note) => {
      const noteElement = createNoteElement(note);
      notesContainer.appendChild(noteElement);
    });
  }

  function createNoteElement(note) {
    const div = document.createElement("div");
    div.className = "note-card";
    div.dataset.id = note.id; // Store ID on the element
    div.setAttribute("role", "button"); // Make card keyboard accessible
    div.setAttribute("tabindex", "0"); // Make card focusable

    // Basic sanitization (replace potential HTML tags before display in card)
    const safeTitle = (note.judul || "Tanpa Judul")
      .replace(/</g, "<")
      .replace(/>/g, ">");
    // Show a snippet of the content, not full Markdown in the card preview
    const plainTextContent = (note.isi || "")
      .replace(/</g, "<")
      .replace(/>/g, ">"); // Basic text version
    const snippet =
      plainTextContent.substring(0, 150) +
      (plainTextContent.length > 150 ? "..." : ""); // Create snippet

    div.innerHTML = `
          <h3>${safeTitle}</h3>
          <span class="note-date">${formatDate(note.tanggal)}</span>
          <p>${snippet}</p> <!-- Show snippet -->
          <div class="note-actions">
              <button class="btn btn-secondary edit-btn" data-action="edit" data-id="${
                note.id
              }" aria-label="Edit Catatan ${safeTitle}">
                  <i class="fas fa-edit"></i> Edit
              </button>
              <button class="btn btn-danger delete-btn" data-action="delete" data-id="${
                note.id
              }" aria-label="Hapus Catatan ${safeTitle}">
                  <i class="fas fa-trash"></i> Hapus
              </button>
          </div>
      `;
    return div;
  }

  function handleNoteAction(event) {
    const button = event.target.closest("button[data-action]");
    const card = event.target.closest(".note-card");

    if (button) {
      // Clicked on Edit or Delete button
      const action = button.dataset.action;
      const id = parseInt(button.dataset.id);

      if (action === "edit") {
        openModal("edit", id);
      } else if (action === "delete") {
        showDeleteConfirmation(id);
      }
    } else if (card) {
      // Clicked directly on the card (not buttons inside)
      const id = parseInt(card.dataset.id);
      openDetailModal(id); // <-- Call the new function
    }
  }

  // --- Modal Handling ---

  function openModal(mode, id = null) {
    // ... (openModal function remains the same for Add/Edit) ...
    noteForm.reset();
    noteIdField.value = "";

    if (mode === "add") {
      modalTitle.textContent = "Tambah Catatan Baru";
      currentNoteId = null;
      noteModal.classList.add("active");
      noteTitleField.focus();
    } else if (mode === "edit" && id) {
      const note = notes.find((n) => n.id === id);
      if (note) {
        modalTitle.textContent = "Edit Catatan";
        currentNoteId = id;
        noteIdField.value = note.id;
        noteTitleField.value = note.judul;
        noteContentField.value = note.isi; // Populate textarea with raw Markdown
        noteModal.classList.add("active");
        noteTitleField.focus();
      } else {
        showError("Catatan tidak ditemukan untuk diedit.");
      }
    }
  }

  function closeModal() {
    // Closes the Add/Edit modal
    noteModal.classList.remove("active");
  }

  function closeConfirmModal() {
    confirmModal.classList.remove("active");
    deleteNoteId = null;
  }

  // --- NEW: Detail Modal Functions ---
  function openDetailModal(id) {
    const note = notes.find((n) => n.id === id);
    if (note) {
      detailNoteTitle.textContent = note.judul || "Tanpa Judul";
      detailNoteDate.textContent = `Dibuat pada: ${formatDate(note.tanggal)}`;
      // Render Markdown content using marked
      // Use 'DOMPurify.sanitize' here *after* marked if dealing with untrusted user input
      detailNoteContent.innerHTML = marked.parse(note.isi || ""); // Render Markdown
      detailModal.classList.add("active"); // Show the detail modal
      detailModal.querySelector(".close-btn").focus(); // Focus close button for accessibility
    } else {
      showError("Tidak dapat menampilkan detail catatan.");
    }
  }

  function closeDetailModal() {
    // Closes the Detail modal
    detailModal.classList.remove("active");
    // Clear content to prevent brief display of old content next time
    detailNoteTitle.textContent = "";
    detailNoteDate.textContent = "";
    detailNoteContent.innerHTML = "";
  }
  // --- End NEW Detail Modal Functions ---

  // Generic handler for clicks within modals
  function handleModalClick(event) {
    // Close Add/Edit Modal
    if (
      (event.target === noteModal ||
        event.target.id === "cancelBtn" ||
        event.target.closest(".close-btn")) &&
      noteModal.classList.contains("active")
    ) {
      closeModal();
    }
    // Close Confirm Modal
    if (
      (event.target === confirmModal ||
        event.target.id === "confirmCancel" ||
        event.target.closest(".close-btn")) &&
      confirmModal.classList.contains("active")
    ) {
      closeConfirmModal();
    }
    // Close Detail Modal <-- NEW
    if (
      (event.target === detailModal || event.target.closest(".close-btn")) &&
      detailModal.classList.contains("active")
    ) {
      closeDetailModal();
    }
  }

  // Optional: Handle Escape key to close modals
  function handleEscKey(event) {
    if (event.key === "Escape") {
      if (detailModal.classList.contains("active")) {
        closeDetailModal();
      } else if (noteModal.classList.contains("active")) {
        closeModal();
      } else if (confirmModal.classList.contains("active")) {
        closeConfirmModal();
      }
    }
  }

  // --- Form & Data Handling ---

  async function handleFormSubmit(e) {
    // ... (handleFormSubmit remains the same) ...
    e.preventDefault();
    const title = noteTitleField.value.trim();
    const content = noteContentField.value.trim(); // Content is raw Markdown
    const id = noteIdField.value ? parseInt(noteIdField.value) : null;

    if (!title && !content) {
      // Allow empty title OR content, but not both
      showError("Judul atau isi catatan harus diisi.");
      return;
    }
    if (!title) title = "Tanpa Judul"; // Default title if empty

    // Note: Server needs to generate/update the 'tanggal'
    const noteData = { judul: title, isi: content };
    let url = API_URL;
    let method = "POST";

    if (id) {
      // Editing existing note
      url = `${API_URL}/${id}`;
      method = "PUT";
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const savedNote = await response.json();

      // --- Optimization: Update local state ---
      if (method === "POST") {
        notes.unshift(savedNote); // Add to beginning
      } else {
        const index = notes.findIndex((n) => n.id === id);
        if (index !== -1) {
          notes[index] = savedNote;
        } else {
          notes.push(savedNote); // Fallback
        }
        // Re-sort potentially needed if PUT affects sorting criteria (e.g., updated_at)
        notes.sort((a, b) => {
          const dateA = a.tanggal ? new Date(a.tanggal) : new Date(0);
          const dateB = b.tanggal ? new Date(b.tanggal) : new Date(0);
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          return dateB - dateA;
        });
      }

      renderNotes(notes);
      closeModal();
    } catch (error) {
      console.error("Error saving note:", error);
      showError(`Gagal menyimpan catatan: ${error.message}`);
    }
  }

  function showDeleteConfirmation(id) {
    // ... (remains the same) ...
    deleteNoteId = id;
    confirmModal.classList.add("active");
  }

  async function handleDeleteConfirm() {
    // ... (remains the same) ...
    if (!deleteNoteId) return;

    try {
      const response = await fetch(`${API_URL}/${deleteNoteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // --- Optimization: Update local state ---
      notes = notes.filter((note) => note.id !== deleteNoteId);

      renderNotes(notes);
      closeConfirmModal();
    } catch (error) {
      console.error("Error deleting note:", error);
      showError(`Gagal menghapus catatan: ${error.message}`);
    } finally {
      deleteNoteId = null;
    }
  }

  // --- Search ---
  function handleSearch() {
    // ... (remains the same) ...
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (!searchTerm) {
      renderNotes(notes);
      return;
    }
    // Search in title and plain text version of content
    const filteredNotes = notes.filter((note) => {
      const titleMatch = (note.judul || "").toLowerCase().includes(searchTerm);
      // Basic search in content - might miss things within Markdown formatting itself
      const contentMatch = (note.isi || "").toLowerCase().includes(searchTerm);
      return titleMatch || contentMatch;
    });
    renderNotes(filteredNotes);
  }

  // --- Utility Functions ---

  function formatDate(dateString) {
    if (!dateString) return "Tanggal tidak valid";
    try {
      const date = new Date(dateString);

      // Check if the date object is valid after parsing
      if (isNaN(date.getTime())) {
        // Attempt fallback if only date part was stored (less likely with ISOString)
        const dateOnly = new Date(dateString.split("T")[0]);
        if (isNaN(dateOnly.getTime())) return "Tanggal tidak valid";
        // If only date part is valid, use date-only options
        const dateOptions = {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Asia/Jakarta",
        }; // Example: Force a timezone if needed
        // OR let browser decide: const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        return dateOnly.toLocaleDateString("id-ID", dateOptions);
      }

      // --- Main Fix: Use toLocaleString for combined date and time ---
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        // second: '2-digit', // Optional: Add seconds
        hour12: false, // Use 24-hour format (optional, set true for AM/PM)
        // Explicitly setting timezone is often safer if you know the target audience's zone
        // timeZone: 'Asia/Jakarta', // Example: Force WIB
        // Or let the browser decide (usually based on OS setting)
        timeZoneName: "short", // Optional: Shows timezone like WIB, WITA, WIT etc.
      };

      // Use toLocaleString for date and time formatting
      return date.toLocaleString("id-ID", options);
      //--------------------------------------------------------------
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Tanggal tidak valid";
    }
  }

  function debounce(func, wait) {
    // ... (remains the same) ...
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function showLoading(isLoading) {
    // ... (remains the same) ...
    if (isLoading) {
      notesContainer.innerHTML = "";
      loadingIndicator.style.display = "flex";
    } else {
      loadingIndicator.style.display = "none";
    }
  }

  function showError(message) {
    console.error("App Error:", message);
    // TODO: Replace alert with a non-blocking notification UI element
    alert(`Error: ${message}`);
  }
});
