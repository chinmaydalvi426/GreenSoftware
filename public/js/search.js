// Advanced Search and Filtering Functionality

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const searchForm = document.querySelector('.search-form');
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    const priceRangeInputs = document.querySelectorAll('input[name="minPrice"], input[name="maxPrice"]');
    const sortSelect = document.querySelector('select[name="sort"]');
    const filterTags = document.querySelectorAll('.filter-tag .close');
    const resetButtons = document.querySelectorAll('a[href="/listings"]');
    
    // Mobile filter drawer elements
    const mobileFilterToggle = document.getElementById('mobileFilterToggle');
    const filterDrawer = document.getElementById('filterDrawer');
    const filterOverlay = document.getElementById('filterOverlay');
    const filterDrawerClose = document.getElementById('filterDrawerClose');
    
    // Auto-submit sidebar filter form when any filter changes
    if (document.getElementById('sidebarFilterForm')) {
        const sidebarFilterElements = document.querySelectorAll('#sidebarFilterForm .filter-checkbox, #sidebarFilterForm select');
        sidebarFilterElements.forEach(element => {
            element.addEventListener('change', () => {
                document.getElementById('sidebarFilterForm').submit();
            });
        });
    }
    
    // Mobile filter drawer functionality
    if (mobileFilterToggle && filterDrawer && filterOverlay && filterDrawerClose) {
        mobileFilterToggle.addEventListener('click', () => {
            filterDrawer.classList.add('show');
            filterOverlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
        
        function closeFilterDrawer() {
            filterDrawer.classList.remove('show');
            filterOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
        
        filterDrawerClose.addEventListener('click', closeFilterDrawer);
        filterOverlay.addEventListener('click', closeFilterDrawer);
    }
    
    // Always show tax information
    // We've removed the toggle button, so taxes are always displayed
    
    // Function to display tax information (always shows both base price and total price)
    function toggleTaxDisplay(showTaxes) {
        const basePrices = document.querySelectorAll('.base-price');
        const taxInfos = document.querySelectorAll('.tax-info');
        const totalPrices = document.querySelectorAll('.total-price');
        
        // Always show both base price and total price
        basePrices.forEach(el => el.style.textDecoration = 'none');
        taxInfos.forEach(el => el.style.display = 'inline');
        totalPrices.forEach(el => el.style.display = 'block');
    }
    
    // AJAX Search Functionality (for future implementation)
    function performAjaxSearch(searchParams) {
        // Show loading indicator
        const resultsContainer = document.querySelector('.search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        }
        
        // Build query string from search params
        const queryString = new URLSearchParams(searchParams).toString();
        
        // Fetch results from API
        fetch(`/listings/api/search?${queryString}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update results count
                    const countElement = document.querySelector('.search-results-count');
                    if (countElement) {
                        countElement.textContent = `${data.count} properties found`;
                    }
                    
                    // Render results
                    if (resultsContainer) {
                        if (data.count > 0) {
                            resultsContainer.innerHTML = renderSearchResults(data.data);
                            // Calculate and update tax information for dynamically loaded listings
                            updateDynamicTaxInfo();
                        } else {
                            resultsContainer.innerHTML = renderNoResults();
                        }
                    }
                    
                    // Update URL without page reload
                    const newUrl = `${window.location.pathname}?${queryString}`;
                    window.history.pushState({ path: newUrl }, '', newUrl);
                } else {
                    console.error('Search failed:', data.message);
                }
            })
            .catch(error => {
                console.error('Error performing search:', error);
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="alert alert-danger">An error occurred while searching. Please try again.</div>';
                }
            });
    }
    
    // Helper function to render search results
    function renderSearchResults(listings) {
        let html = '<div class="row row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-lg-3 g-4">';
        
        listings.forEach(list => {
            html += `
                <div class="col">
                    <a href="/listings/${list._id}" class="listing-links">
                        <div class="card-listings h-100">
                            <img src="${list.image.url}" class="card-img-top" alt="${list.title}" loading="lazy">
                            
                            <div class="card-img-overlay">
                                <h5 class="card-title">View Details</h5>
                            </div>
                                
                            <div class="card-body">
                                <h5 class="card-title">${list.title}</h5>
                                <p class="card-location"><i class="fa-solid fa-location-dot me-1"></i>${list.location}, ${list.country}</p>
                                <p class="card-price">
                                    <span class="base-price">₹${list.price.toLocaleString("en-IN")}</span> <span class="text-muted">/night</span>
                                    <span class="tax-info" data-country="${list.country}" data-location="${list.location}" data-price="${list.price}"></span>
                                </p>
                                <p class="total-price">
                                    <span>Total: ₹${(list.price * 1.18).toLocaleString("en-IN")}</span>
                                    <small class="text-muted">(incl. tax)</small>
                                </p>
                                <div class="card-rating">
                                    <i class="fa-solid fa-star"></i>
                                    <span>4.9</span>
                                    <span class="text-muted ms-1">(${list.review.length} reviews)</span>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    // Function to calculate and update tax information for dynamically loaded listings
    function updateDynamicTaxInfo() {
        // Get all tax info elements that need calculation
        const taxElements = document.querySelectorAll('.tax-info[data-country][data-location][data-price]');
        
        taxElements.forEach(el => {
            const country = el.getAttribute('data-country');
            const location = el.getAttribute('data-location');
            const price = parseFloat(el.getAttribute('data-price'));
            
            // Calculate tax based on country and location
            const taxInfo = calculateTaxInfo(price, country, location);
            
            // Update the element with tax information
            el.innerHTML = `&nbsp;${taxInfo.formattedTaxInfo}`;
            el.setAttribute('data-tax-rate', taxInfo.taxRate);
            el.setAttribute('data-tax-amount', taxInfo.taxAmount);
            el.setAttribute('data-total', taxInfo.totalPrice);
            
            // Update the total price element
            const totalPriceEl = el.closest('.card-body').querySelector('.total-price span');
            if (totalPriceEl) {
                totalPriceEl.textContent = `Total: ₹${taxInfo.totalPrice.toLocaleString("en-IN")}`;
            }
            
            const totalPriceSmall = el.closest('.card-body').querySelector('.total-price small');
            if (totalPriceSmall) {
                totalPriceSmall.textContent = `(incl. ${taxInfo.taxName})`;
            }
        });
        
        // Apply the current tax display setting
        const taxSwitch = document.getElementById("flexSwitchCheckDefault");
        if (taxSwitch) {
            toggleTaxDisplay(taxSwitch.checked);
        }
    }
    
    // Client-side tax calculation (simplified version of server-side logic)
    function calculateTaxInfo(price, country, location) {
        // Default tax rates by country
        const taxRates = {
            'India': 18,
            'USA': 7,
            'United Kingdom': 20,
            'France': 20,
            'Germany': 19,
            'Australia': 10,
            'Japan': 10,
            'Singapore': 8,
            'default': 10
        };
        
        // Tax names by country
        const taxNames = {
            'India': 'GST',
            'USA': 'Sales Tax',
            'United Kingdom': 'VAT',
            'France': 'VAT',
            'Germany': 'VAT',
            'Australia': 'GST',
            'Japan': 'Consumption Tax',
            'Singapore': 'GST',
            'default': 'Tax'
        };
        
        // Get tax rate and name
        const taxRate = taxRates[country] || taxRates.default;
        const taxName = taxNames[country] || taxNames.default;
        
        // Calculate tax amount and total
        const taxAmount = (price * taxRate) / 100;
        const totalPrice = price + taxAmount;
        
        return {
            taxRate,
            taxName,
            taxAmount,
            totalPrice,
            formattedTaxInfo: `+ ${taxRate}% ${taxName}`
        };
    }
    
    // Helper function to render no results message
    function renderNoResults() {
        return `
            <div class="no-results">
                <i class="fa-solid fa-search"></i>
                <h3>No listings found</h3>
                <p>Try adjusting your search filters or browse all listings</p>
                <a href="/listings" class="btn btn-primary">View All Listings</a>
            </div>
        `;
    }
    
    // Initialize price range slider if it exists
    const priceRangeSlider = document.getElementById('priceRangeSlider');
    if (priceRangeSlider) {
        const minPriceDisplay = document.getElementById('minPriceDisplay');
        const maxPriceDisplay = document.getElementById('maxPriceDisplay');
        const minPriceInput = document.getElementById('minPriceInput');
        const maxPriceInput = document.getElementById('maxPriceInput');
        
        // Initialize noUiSlider (if the library is included)
        if (window.noUiSlider) {
            noUiSlider.create(priceRangeSlider, {
                start: [
                    parseInt(minPriceInput.value) || parseInt(priceRangeSlider.dataset.min),
                    parseInt(maxPriceInput.value) || parseInt(priceRangeSlider.dataset.max)
                ],
                connect: true,
                step: 100,
                range: {
                    'min': parseInt(priceRangeSlider.dataset.min),
                    'max': parseInt(priceRangeSlider.dataset.max)
                },
                format: {
                    to: value => Math.round(value),
                    from: value => Math.round(value)
                }
            });
            
            // Update displays and inputs when slider changes
            priceRangeSlider.noUiSlider.on('update', (values, handle) => {
                const value = values[handle];
                if (handle === 0) {
                    minPriceDisplay.textContent = `₹${parseInt(value).toLocaleString('en-IN')}`;
                    minPriceInput.value = value;
                } else {
                    maxPriceDisplay.textContent = `₹${parseInt(value).toLocaleString('en-IN')}`;
                    maxPriceInput.value = value;
                }
            });
        }
    }
    
    // Initialize tax display on page load
    function initializeTaxDisplay() {
        // Always show taxes (no toggle button anymore)
        const showTaxes = true;
        
        // Apply tax display state
        toggleTaxDisplay(showTaxes);
        
        // For dynamically loaded listings
        updateDynamicTaxInfo();
    }
    
    // Call initialization function
    setTimeout(initializeTaxDisplay, 100); // Small delay to ensure DOM is fully processed
});