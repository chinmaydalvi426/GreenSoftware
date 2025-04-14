// Airbnb-like UI Enhancements

// Filter scrolling functionality
function scrollFilters(direction) {
    const filtersContainer = document.getElementById('filters');
    const scrollAmount = 300; // Adjust as needed
    
    if (direction === 'left') {
        filtersContainer.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    } else {
        filtersContainer.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
    
    // Update scroll button visibility
    updateScrollButtonsVisibility();
}

// Update scroll button visibility based on scroll position
function updateScrollButtonsVisibility() {
    const filtersContainer = document.getElementById('filters');
    const leftButton = document.querySelector('.filter-scroll-left');
    const rightButton = document.querySelector('.filter-scroll-right');
    
    if (!filtersContainer || !leftButton || !rightButton) return;
    
    // Hide left button if at the start
    if (filtersContainer.scrollLeft <= 10) {
        leftButton.style.opacity = '0';
        leftButton.style.pointerEvents = 'none';
    } else {
        leftButton.style.opacity = '1';
        leftButton.style.pointerEvents = 'auto';
    }
    
    // Hide right button if at the end
    const scrollWidth = filtersContainer.scrollWidth;
    const scrollLeft = filtersContainer.scrollLeft;
    const clientWidth = filtersContainer.clientWidth;
    
    if (scrollWidth - scrollLeft - clientWidth <= 10) {
        rightButton.style.opacity = '0';
        rightButton.style.pointerEvents = 'none';
    } else {
        rightButton.style.opacity = '1';
        rightButton.style.pointerEvents = 'auto';
    }
}

// Favorites functionality
function toggleFavorite(event, listingId) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const icon = button.querySelector('i');
    
    // Toggle heart icon
    if (icon.classList.contains('fa-regular')) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        button.classList.add('active');
        
        // Add to favorites in localStorage
        addToFavorites(listingId);
    } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        button.classList.remove('active');
        
        // Remove from favorites in localStorage
        removeFromFavorites(listingId);
    }
}

// Add a listing to favorites
function addToFavorites(listingId) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (!favorites.includes(listingId)) {
        favorites.push(listingId);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

// Remove a listing from favorites
function removeFromFavorites(listingId) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    favorites = favorites.filter(id => id !== listingId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Initialize favorites on page load
function initializeFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    
    favoriteButtons.forEach(button => {
        const listingId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
        const icon = button.querySelector('i');
        
        if (favorites.includes(listingId)) {
            icon.classList.remove('fa-regular');
            icon.classList.add('fa-solid');
            button.classList.add('active');
        }
    });
}

// Initialize UI enhancements on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize filter scrolling
    const filtersContainer = document.getElementById('filters');
    if (filtersContainer) {
        filtersContainer.addEventListener('scroll', updateScrollButtonsVisibility);
        updateScrollButtonsVisibility();
    }
    
    // Initialize favorites
    initializeFavorites();
});