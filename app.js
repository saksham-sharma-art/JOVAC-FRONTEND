const API_URL = 'https://demohotelsapi.pythonanywhere.com/hotels/';

const state = {
  hotels: [],
  filteredHotels: [],
};

const elements = {
  hotelCount: document.getElementById('hotel-count'),
  cityCount: document.getElementById('city-count'),
  topRating: document.getElementById('top-rating'),
  searchInput: document.getElementById('search-input'),
  locationFilter: document.getElementById('location-filter'),
  sortSelect: document.getElementById('sort-select'),
  clearFilters: document.getElementById('clear-filters'),
  resultsSummary: document.getElementById('results-summary'),
  statusMessage: document.getElementById('status-message'),
  hotelGrid: document.getElementById('hotel-grid'),
  modal: document.getElementById('hotel-modal'),
  modalBackdrop: document.getElementById('modal-backdrop'),
  closeModal: document.getElementById('close-modal'),
  modalImage: document.getElementById('modal-image'),
  modalLocation: document.getElementById('modal-location'),
  modalTitle: document.getElementById('modal-title'),
  modalRating: document.getElementById('modal-rating'),
  modalPrice: document.getElementById('modal-price'),
  modalDescription: document.getElementById('modal-description'),
  modalGallery: document.getElementById('modal-gallery'),
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatRating(value) {
  const rating = Number(value) || 0;
  return `${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))} ${rating.toFixed(1)}`;
}

function setStatus(message) {
  elements.statusMessage.textContent = message;
}

async function loadHotels() {
  setStatus('Connecting to hotel service…');

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const hotelData = Array.isArray(payload?.data) ? payload.data : [];

    if (!hotelData.length) {
      throw new Error('No hotels returned by the API.');
    }

    state.hotels = hotelData;
    state.filteredHotels = [...hotelData];
    populateLocationFilter();
    updateSummary();
    renderHotels();
    setStatus(`Loaded ${hotelData.length} hotels successfully.`);
  } catch (error) {
    console.error(error);
    elements.hotelGrid.innerHTML = `
      <div class="empty-state">
        <h3>We could not load the hotel list.</h3>
        <p>${error.message}</p>
      </div>`;
    setStatus('Unable to fetch hotels right now. Please try again later.');
  }
}

function populateLocationFilter() {
  const locations = [...new Set(state.hotels.map((hotel) => hotel.location).filter(Boolean))].sort();
  const options = ['<option value="">All locations</option>']
    .concat(locations.map((location) => `<option value="${location}">${location}</option>`))
    .join('');
  elements.locationFilter.innerHTML = options;
}

function applyFilters() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const location = elements.locationFilter.value;
  const sortValue = elements.sortSelect.value;

  const filtered = state.hotels.filter((hotel) => {
    const matchesSearch =
      hotel.name?.toLowerCase().includes(query) ||
      hotel.location?.toLowerCase().includes(query) ||
      hotel.description?.toLowerCase().includes(query);
    const matchesLocation = !location || hotel.location === location;
    return matchesSearch && matchesLocation;
  });

  if (sortValue === 'price-low') {
    filtered.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortValue === 'price-high') {
    filtered.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortValue === 'rating') {
    filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
  }

  state.filteredHotels = filtered;
  renderHotels();
}

function renderHotels() {
  updateSummary();

  if (!state.filteredHotels.length) {
    elements.hotelGrid.innerHTML = `
      <div class="empty-state">
        <h3>No matches found</h3>
        <p>Try adjusting your search or location filter to see more results.</p>
      </div>`;
    return;
  }

  elements.hotelGrid.innerHTML = state.filteredHotels
    .map(
      (hotel) => `
        <article class="hotel-card" data-id="${hotel.id}">
          <img class="hotel-card__image" src="${hotel.thumbnail}" alt="${hotel.name}" />
          <div class="hotel-card__body">
            <div class="hotel-card__top">
              <div>
                <p class="hotel-card__location">${hotel.location}</p>
                <h3>${hotel.name}</h3>
              </div>
              <span class="badge">${formatRating(hotel.rating)}</span>
            </div>
            <p>${(hotel.description || 'A premium stay with modern amenities.').slice(0, 90)}...</p>
            <div class="hotel-card__footer">
              <span class="hotel-card__price">${formatCurrency(hotel.price)}</span>
              <span class="chip">View details</span>
            </div>
          </div>
        </article>`
    )
    .join('');

  document.querySelectorAll('.hotel-card').forEach((card) => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

function updateSummary() {
  const totalHotels = state.hotels.length;
  const uniqueCities = new Set(state.hotels.map((hotel) => hotel.location).filter(Boolean)).size;
  const highestRating = state.hotels.length
    ? Math.max(...state.hotels.map((hotel) => Number(hotel.rating) || 0)).toFixed(1)
    : '0';

  elements.hotelCount.textContent = totalHotels;
  elements.cityCount.textContent = uniqueCities;
  elements.topRating.textContent = highestRating;
  elements.resultsSummary.textContent = `${state.filteredHotels.length} stays match your current filters.`;
}

function openModal(id) {
  const hotel = state.hotels.find((item) => String(item.id) === String(id));
  if (!hotel) return;

  elements.modalImage.src = hotel.thumbnail || '';
  elements.modalImage.alt = hotel.name;
  elements.modalLocation.textContent = hotel.location;
  elements.modalTitle.textContent = hotel.name;
  elements.modalRating.textContent = formatRating(hotel.rating);
  elements.modalPrice.textContent = formatCurrency(hotel.price);
  elements.modalDescription.textContent = hotel.description || 'A premium stay designed for comfort.';

  const gallery = Array.isArray(hotel.photos) && hotel.photos.length ? hotel.photos : [hotel.thumbnail];
  elements.modalGallery.innerHTML = gallery
    .slice(0, 6)
    .map((photo) => `<img src="${photo}" alt="${hotel.name} view" />`)
    .join('');

  elements.modal.classList.remove('hidden');
  elements.modalBackdrop.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeModal() {
  elements.modal.classList.add('hidden');
  elements.modalBackdrop.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

['input', 'change'].forEach((eventName) => {
  elements.searchInput.addEventListener('input', applyFilters);
  elements.locationFilter.addEventListener('change', applyFilters);
  elements.sortSelect.addEventListener('change', applyFilters);
});

elements.clearFilters.addEventListener('click', () => {
  elements.searchInput.value = '';
  elements.locationFilter.value = '';
  elements.sortSelect.value = 'featured';
  applyFilters();
});

elements.closeModal.addEventListener('click', closeModal);
elements.modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

loadHotels();
