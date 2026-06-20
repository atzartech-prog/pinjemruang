// State Management
let appState = {
  rooms: [],
  bookings: [],
  activeTab: 'rooms',
  theme: 'dark',
  filters: {
    rooms: {
      search: '',
      capacity: 0
    },
    bookings: {
      search: '',
      date: '',
      room: 'all'
    },
    manageRooms: {
      search: ''
    }
  }
};

// Embedded default rooms data in case CORS blocks fetching rooms.json locally
const DEFAULT_ROOMS = [
  {
    "id": "room-nusantara",
    "name": "Ruang Nusantara",
    "floor": "Lantai 3",
    "capacity": 20,
    "color": "#6366f1",
    "facilities": ["Projector", "Wi-Fi", "Sound System", "Whiteboard", "AC", "Video Conference"],
    "description": "Ruang rapat direksi premium dengan pemandangan kota dan fasilitas konferensi video lengkap."
  },
  {
    "id": "room-merdeka",
    "name": "Ruang Merdeka",
    "floor": "Lantai 2",
    "capacity": 10,
    "color": "#ec4899",
    "facilities": ["TV Screen", "Wi-Fi", "Whiteboard", "AC"],
    "description": "Cocok untuk rapat divisi jangka menengah atau sesi brainstorming tim internal."
  },
  {
    "id": "room-pancasila",
    "name": "Ruang Pancasila",
    "floor": "Lantai 1",
    "capacity": 50,
    "color": "#10b981",
    "facilities": ["Projector", "Wi-Fi", "Sound System", "Stage", "AC", "Wireless Mic"],
    "description": "Aula besar yang ideal untuk seminar, presentasi korporat, atau pelatihan skala besar."
  },
  {
    "id": "room-gotong-royong",
    "name": "Ruang Gotong Royong",
    "floor": "Lantai 2",
    "capacity": 4,
    "color": "#f59e0b",
    "facilities": ["Wi-Fi", "Whiteboard", "AC"],
    "description": "Ruang diskusi kecil (huddle room) untuk rapat cepat atau koordinasi harian."
  },
  {
    "id": "room-bhinneka",
    "name": "Ruang Bhinneka",
    "floor": "Lantai 4",
    "capacity": 8,
    "color": "#06b6d4",
    "facilities": ["TV Screen", "Wi-Fi", "Bean Bags", "AC", "Coffee Maker"],
    "description": "Ruang kolaborasi kasual dengan bean bags untuk merangsang kreativitas tim Anda."
  }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadRooms();
  loadBookings();
  setupEventListeners();
  updateStats();
  renderRooms();
  renderBookings();
  renderManageRooms();
  populateRoomSelects();
  
  // Set current date in booking form as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('booking-date').value = today;
  document.getElementById('booking-date').min = today;
});

// Theme Setup
function initTheme() {
  const savedTheme = localStorage.getItem('ruangreserva_theme');
  if (savedTheme) {
    appState.theme = savedTheme;
  } else {
    // Check system preference
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    appState.theme = prefersLight ? 'light' : 'dark';
  }
  applyTheme();
}

function applyTheme() {
  const body = document.body;
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  
  if (appState.theme === 'light') {
    body.classList.add('light-mode');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    body.classList.remove('light-mode');
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }
  localStorage.setItem('ruangreserva_theme', appState.theme);
}

function toggleTheme() {
  appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  showToast(`Mode ${appState.theme === 'light' ? 'Terang' : 'Gelap'} diaktifkan`, 'success');
}

// Load Rooms Data (with LocalStorage and Fallback)
async function loadRooms() {
  const savedRooms = localStorage.getItem('ruangreserva_rooms');
  if (savedRooms) {
    appState.rooms = JSON.parse(savedRooms);
  } else {
    try {
      const response = await fetch('rooms.json');
      if (!response.ok) throw new Error('Network error loading rooms');
      appState.rooms = await response.json();
    } catch (error) {
      console.warn("Failed to fetch rooms.json (usually due to file:// CORS restrictions on mobile). Falling back to embedded rooms list.", error);
      appState.rooms = DEFAULT_ROOMS;
    }
    saveRooms();
  }
}

function saveRooms() {
  localStorage.setItem('ruangreserva_rooms', JSON.stringify(appState.rooms));
}

// Load Bookings Data from LocalStorage
function loadBookings() {
  const savedBookings = localStorage.getItem('ruangreserva_bookings');
  if (savedBookings) {
    appState.bookings = JSON.parse(savedBookings);
  } else {
    // Seed with a sample booking for visual completeness
    const todayStr = new Date().toISOString().split('T')[0];
    appState.bookings = [
      {
        id: 'booking-sample-1',
        roomId: 'room-nusantara',
        title: 'Kick-off Meeting Project Alpha',
        organizer: 'Tim IT & Pengembang',
        participants: 12,
        date: todayStr,
        startTime: '10:00',
        endTime: '12:00',
        notes: 'Sediakan koneksi LAN untuk laptop server.'
      }
    ];
    saveBookings();
  }
}

function saveBookings() {
  localStorage.setItem('ruangreserva_bookings', JSON.stringify(appState.bookings));
}

// Event Listeners
function setupEventListeners() {
  // Theme Toggle Button
  document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);
  
  // Tab Switchers
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabName = btn.dataset.tab;
      appState.activeTab = tabName;
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${tabName}`).classList.add('active');
      
      // Render components if tab changes
      if (tabName === 'rooms') {
        renderRooms();
      } else if (tabName === 'bookings') {
        renderBookings();
      } else if (tabName === 'manage-rooms') {
        renderManageRooms();
      }
    });
  });

  // Open Booking Modal Button
  document.getElementById('btn-new-booking').addEventListener('click', () => {
    openBookingModal();
  });

  // Booking Modal Actions
  document.getElementById('btn-close-modal').addEventListener('click', closeBookingModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeBookingModal);
  document.getElementById('booking-modal').addEventListener('click', (e) => {
    if (e.target.id === 'booking-modal') closeBookingModal();
  });

  // Booking Form Submit Handler
  document.getElementById('booking-form').addEventListener('submit', handleFormSubmit);

  // Live validation on scheduling inputs
  const inputsToValidate = ['booking-room-select', 'booking-date', 'booking-start-time', 'booking-end-time'];
  inputsToValidate.forEach(id => {
    document.getElementById(id).addEventListener('change', checkLiveConflict);
  });

  // Room Select validation details
  document.getElementById('booking-room-select').addEventListener('change', (e) => {
    const roomId = e.target.value;
    const room = appState.rooms.find(r => r.id === roomId);
    if (room) {
      document.getElementById('booking-participants').max = room.capacity;
      document.getElementById('booking-participants').placeholder = `Max ${room.capacity}`;
    }
  });

  // Search & Filters (Rooms)
  document.getElementById('search-rooms').addEventListener('input', (e) => {
    appState.filters.rooms.search = e.target.value.toLowerCase();
    renderRooms();
  });
  document.getElementById('filter-capacity').addEventListener('change', (e) => {
    appState.filters.rooms.capacity = parseInt(e.target.value);
    renderRooms();
  });

  // Search & Filters (Bookings)
  document.getElementById('search-bookings').addEventListener('input', (e) => {
    appState.filters.bookings.search = e.target.value.toLowerCase();
    renderBookings();
  });
  document.getElementById('filter-booking-date').addEventListener('change', (e) => {
    appState.filters.bookings.date = e.target.value;
    renderBookings();
  });
  document.getElementById('filter-booking-room').addEventListener('change', (e) => {
    appState.filters.bookings.room = e.target.value;
    renderBookings();
  });

  // CRUD Room Listeners
  document.getElementById('btn-new-room').addEventListener('click', () => {
    openRoomModal();
  });
  document.getElementById('btn-close-room-modal').addEventListener('click', closeRoomModal);
  document.getElementById('btn-cancel-room-modal').addEventListener('click', closeRoomModal);
  document.getElementById('room-modal').addEventListener('click', (e) => {
    if (e.target.id === 'room-modal') closeRoomModal();
  });
  document.getElementById('room-form').addEventListener('submit', handleRoomFormSubmit);
  document.getElementById('search-manage-rooms').addEventListener('input', (e) => {
    appState.filters.manageRooms.search = e.target.value.toLowerCase();
    renderManageRooms();
  });

  // Backup Export/Import Listeners
  document.getElementById('btn-export').addEventListener('click', exportData);
  document.getElementById('btn-import-trigger').addEventListener('click', () => {
    document.getElementById('input-import').click();
  });
  document.getElementById('input-import').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      importData(file);
    }
    e.target.value = ''; // Reset file input
  });
}

// Populate dropdown elements
function populateRoomSelects() {
  const bookingRoomSelect = document.getElementById('booking-room-select');
  const filterBookingRoom = document.getElementById('filter-booking-room');
  
  // Keep current selection if valid
  const currentSelect = bookingRoomSelect.value;
  const currentFilter = filterBookingRoom.value;
  
  bookingRoomSelect.innerHTML = '<option value="" disabled selected>Pilih salah satu ruangan...</option>';
  filterBookingRoom.innerHTML = '<option value="all">Semua Ruangan</option>';
  
  appState.rooms.forEach(room => {
    // Modal Form select
    const optionForm = document.createElement('option');
    optionForm.value = room.id;
    optionForm.textContent = `${room.name} (${room.floor} - Kap. ${room.capacity} org)`;
    bookingRoomSelect.appendChild(optionForm);
    
    // Booking Tab filter select
    const optionFilter = document.createElement('option');
    optionFilter.value = room.id;
    optionFilter.textContent = room.name;
    filterBookingRoom.appendChild(optionFilter);
  });
  
  // Restore selections
  if (appState.rooms.some(r => r.id === currentSelect)) {
    bookingRoomSelect.value = currentSelect;
  }
  if (currentFilter === 'all' || appState.rooms.some(r => r.id === currentFilter)) {
    filterBookingRoom.value = currentFilter;
  }
}

// Calculate Statistics
function updateStats() {
  document.getElementById('stat-total-rooms').textContent = appState.rooms.length;
  
  // Count active bookings (today or future)
  const todayStr = new Date().toISOString().split('T')[0];
  const activeBookings = appState.bookings.filter(b => b.date >= todayStr);
  document.getElementById('stat-active-bookings').textContent = activeBookings.length;
  
  // Calculate total hours booked
  let totalMinutes = 0;
  appState.bookings.forEach(b => {
    const [startH, startM] = b.startTime.split(':').map(Number);
    const [endH, endM] = b.endTime.split(':').map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    if (duration > 0) {
      totalMinutes += duration;
    }
  });
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  document.getElementById('stat-hours-booked').textContent = `${totalHours} Jam`;
}

// Render Room Cards (Tab 1)
function renderRooms() {
  const container = document.getElementById('rooms-grid');
  container.innerHTML = '';
  
  const filteredRooms = appState.rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(appState.filters.rooms.search) ||
                          room.facilities.some(f => f.toLowerCase().includes(appState.filters.rooms.search));
    const matchesCapacity = room.capacity >= appState.filters.rooms.capacity;
    return matchesSearch && matchesCapacity;
  });
  
  if (filteredRooms.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        <h3>Tidak Ada Ruangan Cocok</h3>
        <p>Silakan sesuaikan kata kunci pencarian atau filter kapasitas Anda.</p>
      </div>
    `;
    return;
  }
  
  // Get current local time details to see if room is busy
  const now = new Date();
  const currentDateStr = now.toISOString().split('T')[0];
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  
  filteredRooms.forEach(room => {
    // Check if room is busy right now
    const activeBookingNow = appState.bookings.find(b => {
      return b.roomId === room.id && 
             b.date === currentDateStr && 
             currentTimeStr >= b.startTime && 
             currentTimeStr <= b.endTime;
    });
    
    const isBusy = !!activeBookingNow;
    const statusText = isBusy ? `Sibuk (Hingga ${activeBookingNow.endTime})` : 'Tersedia';
    const statusClass = isBusy ? 'busy' : 'available';
    
    const card = document.createElement('div');
    card.className = 'room-card';
    card.style.setProperty('--room-color', room.color);
    
    // Facilities list HTML
    const facilitiesHTML = room.facilities
      .map(f => `<span class="facility-tag">${f}</span>`)
      .join('');
      
    card.innerHTML = `
      <div class="room-header">
        <div class="room-title-area">
          <h3>${room.name}</h3>
          <span class="room-floor">${room.floor}</span>
        </div>
        <span class="capacity-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          ${room.capacity} Org
        </span>
      </div>
      <p class="room-desc">${room.description || 'Tidak ada deskripsi.'}</p>
      <span class="facilities-title">Fasilitas</span>
      <div class="facilities-list">${facilitiesHTML}</div>
      <div class="room-footer">
        <div class="room-status">
          <span class="status-indicator ${statusClass}"></span>
          <span>${statusText}</span>
        </div>
        <button class="primary-btn btn-book-room" data-room-id="${room.id}">Pesan</button>
      </div>
    `;
    
    container.appendChild(card);
    
    // Attach listener specifically for the "Pesan" button inside this card
    card.querySelector('.btn-book-room').addEventListener('click', () => {
      openBookingModal(room.id);
    });
  });
}

// Render Bookings List (Tab 2)
function renderBookings() {
  const container = document.getElementById('bookings-list');
  container.innerHTML = '';
  
  // Sort bookings by date then start time
  const sortedBookings = [...appState.bookings].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.startTime.localeCompare(b.startTime);
  });
  
  const filteredBookings = sortedBookings.filter(booking => {
    const room = appState.rooms.find(r => r.id === booking.roomId);
    const matchesSearch = booking.title.toLowerCase().includes(appState.filters.bookings.search) || 
                          booking.organizer.toLowerCase().includes(appState.filters.bookings.search);
    const matchesDate = !appState.filters.bookings.date || booking.date === appState.filters.bookings.date;
    const matchesRoom = appState.filters.bookings.room === 'all' || booking.roomId === appState.filters.bookings.room;
    
    return matchesSearch && matchesDate && matchesRoom;
  });
  
  if (filteredBookings.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <h3>Jadwal Tidak Ditemukan</h3>
        <p>Tidak ada reservasi rapat yang cocok dengan filter atau kata kunci saat ini.</p>
      </div>
    `;
    return;
  }
  
  filteredBookings.forEach(booking => {
    const room = appState.rooms.find(r => r.id === booking.roomId);
    const roomName = room ? room.name : 'Ruangan Terhapus';
    const roomColor = room ? room.color : '#64748b';
    
    const card = document.createElement('div');
    card.className = 'booking-card';
    card.style.setProperty('--room-color', roomColor);
    
    card.innerHTML = `
      <div class="booking-main-info">
        <div class="booking-time-block">
          <span class="time-start-end">${booking.startTime} - ${booking.endTime}</span>
          <span class="date-label">${booking.date}</span>
        </div>
        <div class="booking-details-block">
          <h4>${booking.title}</h4>
          <div class="booking-meta-row">
            <div class="meta-item">
              <span class="room-dot" style="background-color: ${roomColor};"></span>
              <span>${roomName}</span>
            </div>
            <div class="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>${booking.organizer} (${booking.participants} Orang)</span>
            </div>
          </div>
          ${booking.notes ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px; font-style: italic;">Catatan: ${booking.notes}</div>` : ''}
        </div>
      </div>
      <div class="booking-actions">
        <button class="btn-cancel" data-booking-id="${booking.id}">Batalkan</button>
      </div>
    `;
    
    container.appendChild(card);
    
    // Attach event listener to cancel button
    card.querySelector('.btn-cancel').addEventListener('click', () => {
      cancelBooking(booking.id);
    });
  });
}

// Render Manage Rooms Table (Tab 3 - CRUD)
function renderManageRooms() {
  const tbody = document.getElementById('manage-rooms-list');
  tbody.innerHTML = '';
  
  const filteredRooms = appState.rooms.filter(room => {
    return room.name.toLowerCase().includes(appState.filters.manageRooms.search);
  });
  
  if (filteredRooms.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 32px 16px; color: var(--text-muted);">
          Tidak ada ruangan untuk dikelola yang cocok.
        </td>
      </tr>
    `;
    return;
  }
  
  filteredRooms.forEach(room => {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>
        <span class="table-room-name">
          <span class="table-color-dot" style="background-color: ${room.color};"></span>
          ${room.name}
        </span>
      </td>
      <td>${room.floor}</td>
      <td>${room.capacity} Orang</td>
      <td>
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          ${room.facilities.slice(0, 3).map(f => `<span class="facility-tag" style="font-size: 0.65rem; padding: 2px 6px;">${f}</span>`).join('')}
          ${room.facilities.length > 3 ? `<span class="facility-tag" style="font-size: 0.65rem; padding: 2px 6px; opacity: 0.7;">+${room.facilities.length - 3}</span>` : ''}
        </div>
      </td>
      <td>
        <button class="action-badge edit" data-edit-id="${room.id}">Edit</button>
        <button class="action-badge delete" data-delete-id="${room.id}">Hapus</button>
      </td>
    `;
    
    tbody.appendChild(tr);
    
    // Bind buttons
    tr.querySelector('.action-badge.edit').addEventListener('click', () => {
      openRoomModal(room.id);
    });
    tr.querySelector('.action-badge.delete').addEventListener('click', () => {
      deleteRoom(room.id);
    });
  });
}

// Modal booking operations
function openBookingModal(roomId = '') {
  const modal = document.getElementById('booking-modal');
  const form = document.getElementById('booking-form');
  form.reset();
  
  // Set default values
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('booking-date').value = today;
  document.getElementById('booking-id').value = '';
  document.getElementById('booking-conflict-alert').style.display = 'none';
  document.getElementById('btn-save-booking').disabled = false;
  
  if (roomId) {
    document.getElementById('booking-room-select').value = roomId;
    
    // Pre-populate participants based on capacity
    const room = appState.rooms.find(r => r.id === roomId);
    if (room) {
      document.getElementById('booking-participants').max = room.capacity;
      document.getElementById('booking-participants').placeholder = `Max ${room.capacity}`;
    }
  } else {
    document.getElementById('booking-participants').placeholder = `Peserta`;
  }
  
  modal.classList.add('active');
}

function closeBookingModal() {
  document.getElementById('booking-modal').classList.remove('active');
}

// Live Collision Checker for overlaps
function checkLiveConflict() {
  const roomId = document.getElementById('booking-room-select').value;
  const date = document.getElementById('booking-date').value;
  const startTime = document.getElementById('booking-start-time').value;
  const endTime = document.getElementById('booking-end-time').value;
  const bookingId = document.getElementById('booking-id').value;
  
  const alertBox = document.getElementById('booking-conflict-alert');
  const submitBtn = document.getElementById('btn-save-booking');
  
  if (!roomId || !date || !startTime || !endTime) {
    alertBox.style.display = 'none';
    submitBtn.disabled = false;
    return;
  }
  
  // Validate time format: start before end
  if (startTime >= endTime) {
    alertBox.querySelector('.alert-message').innerHTML = '<strong>Format Jam Salah!</strong> Jam selesai harus setelah jam mulai rapat.';
    alertBox.style.display = 'flex';
    submitBtn.disabled = true;
    return;
  }
  
  // Check against all existing bookings for the same room & date (excluding own booking)
  const isConflict = appState.bookings.some(b => {
    return b.roomId === roomId &&
           b.date === date &&
           b.id !== bookingId &&
           startTime < b.endTime &&
           endTime > b.startTime;
  });
  
  if (isConflict) {
    alertBox.querySelector('.alert-message').innerHTML = '<strong>Waktu Bentrok!</strong> Ruangan ini sudah dipesan untuk acara lain pada jam yang sama.';
    alertBox.style.display = 'flex';
    submitBtn.disabled = true;
  } else {
    alertBox.style.display = 'none';
    submitBtn.disabled = false;
  }
}

// Booking Form Submit Handler
function handleFormSubmit(e) {
  e.preventDefault();
  
  const roomId = document.getElementById('booking-room-select').value;
  const title = document.getElementById('booking-title').value.trim();
  const organizer = document.getElementById('booking-organizer').value.trim();
  const participants = parseInt(document.getElementById('booking-participants').value);
  const date = document.getElementById('booking-date').value;
  const startTime = document.getElementById('booking-start-time').value;
  const endTime = document.getElementById('booking-end-time').value;
  const notes = document.getElementById('booking-notes').value.trim();
  const bookingId = document.getElementById('booking-id').value;
  
  // Verify room capacity
  const room = appState.rooms.find(r => r.id === roomId);
  if (room && participants > room.capacity) {
    showToast(`Pesan gagal: Peserta melebihi kapasitas ${room.name} (Max ${room.capacity} org)`, 'error');
    return;
  }
  
  // Validate time boundaries
  if (startTime >= endTime) {
    showToast('Pesan gagal: Jam selesai harus setelah jam mulai.', 'error');
    return;
  }
  
  // Double-check booking overlaps
  const isConflict = appState.bookings.some(b => {
    return b.roomId === roomId &&
           b.date === date &&
           b.id !== bookingId &&
           startTime < b.endTime &&
           endTime > b.startTime;
  });
  
  if (isConflict) {
    showToast('Pesan gagal: Jadwal bentrok dengan pemesanan lain.', 'error');
    return;
  }
  
  const newBooking = {
    id: bookingId || 'booking-' + Date.now(),
    roomId,
    title,
    organizer,
    participants,
    date,
    startTime,
    endTime,
    notes
  };
  
  if (bookingId) {
    const index = appState.bookings.findIndex(b => b.id === bookingId);
    appState.bookings[index] = newBooking;
    showToast('Reservasi berhasil diperbarui!', 'success');
  } else {
    appState.bookings.push(newBooking);
    showToast('Reservasi berhasil dijadwalkan!', 'success');
  }
  
  saveBookings();
  closeBookingModal();
  updateStats();
  renderRooms();
  renderBookings();
}

// Cancel Booking Handler
function cancelBooking(bookingId) {
  if (confirm('Apakah Anda yakin ingin membatalkan reservasi ini?')) {
    appState.bookings = appState.bookings.filter(b => b.id !== bookingId);
    saveBookings();
    updateStats();
    renderRooms();
    renderBookings();
    showToast('Reservasi telah dibatalkan', 'success');
  }
}

// CRUD ROOM MODAL HELPERS
function openRoomModal(roomId = '') {
  const modal = document.getElementById('room-modal');
  const form = document.getElementById('room-form');
  const title = document.getElementById('room-modal-title');
  
  form.reset();
  document.getElementById('room-id').value = '';
  document.getElementById('room-color').value = '#6366f1';
  
  if (roomId) {
    title.textContent = 'Edit Data Ruangan';
    const room = appState.rooms.find(r => r.id === roomId);
    if (room) {
      document.getElementById('room-id').value = room.id;
      document.getElementById('room-name').value = room.name;
      document.getElementById('room-floor').value = room.floor;
      document.getElementById('room-capacity').value = room.capacity;
      document.getElementById('room-color').value = room.color;
      document.getElementById('room-facilities').value = room.facilities.join(', ');
      document.getElementById('room-description').value = room.description || '';
    }
  } else {
    title.textContent = 'Tambah Ruangan Baru';
  }
  
  modal.classList.add('active');
}

function closeRoomModal() {
  document.getElementById('room-modal').classList.remove('active');
}

// Save/Edit Room Submit Handler
function handleRoomFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('room-id').value;
  const name = document.getElementById('room-name').value.trim();
  const floor = document.getElementById('room-floor').value.trim();
  const capacity = parseInt(document.getElementById('room-capacity').value);
  const color = document.getElementById('room-color').value;
  const facilitiesRaw = document.getElementById('room-facilities').value;
  const description = document.getElementById('room-description').value.trim();
  
  // Parse facilities from comma separated values
  const facilities = facilitiesRaw.split(',')
    .map(f => f.trim())
    .filter(f => f.length > 0);
    
  if (facilities.length === 0) {
    showToast('Masukkan minimal satu fasilitas untuk ruangan.', 'error');
    return;
  }
  
  const roomId = id || 'room-' + Date.now();
  const roomData = {
    id: roomId,
    name,
    floor,
    capacity,
    color,
    facilities,
    description
  };
  
  if (id) {
    // Edit existing room
    const index = appState.rooms.findIndex(r => r.id === id);
    appState.rooms[index] = roomData;
    
    // Check if any existing bookings exceed the new capacity
    const bookingsExceeding = appState.bookings.filter(b => b.roomId === id && b.participants > capacity);
    if (bookingsExceeding.length > 0) {
      showToast(`Peringatan: Ada ${bookingsExceeding.length} rapat aktif dengan jumlah peserta melebihi kapasitas baru (${capacity} orang).`, 'error');
    } else {
      showToast('Data ruangan berhasil diperbarui!', 'success');
    }
  } else {
    // Add new room
    appState.rooms.push(roomData);
    showToast('Ruangan baru berhasil ditambahkan!', 'success');
  }
  
  saveRooms();
  closeRoomModal();
  populateRoomSelects();
  updateStats();
  
  // Refresh views
  if (appState.activeTab === 'rooms') renderRooms();
  else if (appState.activeTab === 'manage-rooms') renderManageRooms();
  else if (appState.activeTab === 'bookings') renderBookings();
}

// Delete Room Handler
function deleteRoom(roomId) {
  const room = appState.rooms.find(r => r.id === roomId);
  if (!room) return;
  
  const confirmMsg = `Apakah Anda yakin ingin menghapus "${room.name}"?\nSemua data reservasi untuk ruangan ini juga akan dihapus secara permanen.`;
  
  if (confirm(confirmMsg)) {
    // Delete room
    appState.rooms = appState.rooms.filter(r => r.id !== roomId);
    saveRooms();
    
    // Cascade delete bookings for this room
    const originalBookingCount = appState.bookings.length;
    appState.bookings = appState.bookings.filter(b => b.roomId !== roomId);
    saveBookings();
    
    const deletedBookings = originalBookingCount - appState.bookings.length;
    if (deletedBookings > 0) {
      showToast(`Ruangan dihapus beserta ${deletedBookings} reservasi terkait.`, 'success');
    } else {
      showToast('Ruangan berhasil dihapus.', 'success');
    }
    
    populateRoomSelects();
    updateStats();
    
    // Refresh views
    renderManageRooms();
    renderRooms();
    renderBookings();
  }
}

// Backup Export function
function exportData() {
  const backup = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    rooms: appState.rooms,
    bookings: appState.bookings
  };
  
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(dataBlob);
  
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0,10);
  
  downloadAnchor.href = downloadUrl;
  downloadAnchor.download = `backup_reservasi_ruang_${dateStr}.json`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(downloadUrl);
  }, 100);
  
  showToast('Cadangan data berhasil diekspor!', 'success');
}

// Backup Import function
function importData(file) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      
      // Simple validation checks on structure
      if (!data || !Array.isArray(data.rooms) || !Array.isArray(data.bookings)) {
        throw new Error('Skema data cadangan tidak cocok. Pastikan data rooms dan bookings ada.');
      }
      
      // Additional checks for room structures
      data.rooms.forEach(r => {
        if (!r.id || !r.name || !r.capacity || !r.color || !Array.isArray(r.facilities)) {
          throw new Error('Data ruangan dalam cadangan tidak valid.');
        }
      });
      
      // Additional checks for booking structures
      data.bookings.forEach(b => {
        if (!b.id || !b.roomId || !b.title || !b.date || !b.startTime || !b.endTime) {
          throw new Error('Data reservasi dalam cadangan tidak valid.');
        }
      });
      
      // If validation succeeds, load it into state and save
      appState.rooms = data.rooms;
      appState.bookings = data.bookings;
      
      saveRooms();
      saveBookings();
      
      // Re-populate everything
      populateRoomSelects();
      updateStats();
      
      renderRooms();
      renderBookings();
      renderManageRooms();
      
      showToast('Cadangan data berhasil diimpor dan dipasang!', 'success');
    } catch (err) {
      console.error(err);
      showToast(`Gagal impor: ${err.message}`, 'error');
    }
  };
  
  reader.readAsText(file);
}

// Show Floating Toast Alert
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Get matching icon based on type
  const iconHTML = type === 'success' 
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    
  toast.innerHTML = `
    ${iconHTML}
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Trigger transition
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Remove after 3.5s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3500);
}
