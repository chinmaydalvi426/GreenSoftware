/**
 * Pagination functionality for listing pages
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get pagination controls container
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    // Get current URL and parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // Function to create pagination links
    function setupPagination(currentPage, totalPages) {
        // Clear existing pagination
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const ul = document.createElement('ul');
        ul.className = 'pagination justify-content-center';
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage <= 1 ? 'disabled' : ''}`;
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.innerHTML = '&laquo;';
        prevLink.setAttribute('aria-label', 'Previous');
        if (currentPage > 1) {
            prevLink.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToPage(currentPage - 1);
            });
        }
        prevLi.appendChild(prevLink);
        ul.appendChild(prevLi);
        
        // Determine range of page numbers to show
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // Adjust if we're near the end
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // First page link if not in range
        if (startPage > 1) {
            const firstLi = document.createElement('li');
            firstLi.className = 'page-item';
            const firstLink = document.createElement('a');
            firstLink.className = 'page-link';
            firstLink.href = '#';
            firstLink.textContent = '1';
            firstLink.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToPage(1);
            });
            firstLi.appendChild(firstLink);
            ul.appendChild(firstLi);
            
            // Add ellipsis if needed
            if (startPage > 2) {
                const ellipsisLi = document.createElement('li');
                ellipsisLi.className = 'page-item disabled';
                const ellipsisSpan = document.createElement('span');
                ellipsisSpan.className = 'page-link';
                ellipsisSpan.innerHTML = '&hellip;';
                ellipsisLi.appendChild(ellipsisSpan);
                ul.appendChild(ellipsisLi);
            }
        }
        
        // Page number links
        for (let i = startPage; i <= endPage; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            if (i !== currentPage) {
                pageLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    navigateToPage(i);
                });
            }
            pageLi.appendChild(pageLink);
            ul.appendChild(pageLi);
        }
        
        // Last page link if not in range
        if (endPage < totalPages) {
            // Add ellipsis if needed
            if (endPage < totalPages - 1) {
                const ellipsisLi = document.createElement('li');
                ellipsisLi.className = 'page-item disabled';
                const ellipsisSpan = document.createElement('span');
                ellipsisSpan.className = 'page-link';
                ellipsisSpan.innerHTML = '&hellip;';
                ellipsisLi.appendChild(ellipsisSpan);
                ul.appendChild(ellipsisLi);
            }
            
            const lastLi = document.createElement('li');
            lastLi.className = 'page-item';
            const lastLink = document.createElement('a');
            lastLink.className = 'page-link';
            lastLink.href = '#';
            lastLink.textContent = totalPages;
            lastLink.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToPage(totalPages);
            });
            lastLi.appendChild(lastLink);
            ul.appendChild(lastLi);
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage >= totalPages ? 'disabled' : ''}`;
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.innerHTML = '&raquo;';
        nextLink.setAttribute('aria-label', 'Next');
        if (currentPage < totalPages) {
            nextLink.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToPage(currentPage + 1);
            });
        }
        nextLi.appendChild(nextLink);
        ul.appendChild(nextLi);
        
        paginationContainer.appendChild(ul);
    }
    
    // Function to navigate to a specific page
    function navigateToPage(page) {
        urlParams.set('page', page);
        window.location.search = urlParams.toString();
    }
    
    // Get pagination data from the page
    const paginationData = window.paginationData;
    if (paginationData) {
        setupPagination(paginationData.page, paginationData.totalPages);
    }
});