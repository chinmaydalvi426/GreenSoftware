/**
 * Performance optimization middleware
 */
const compression = require('compression');
const path = require('path');

// Compression middleware
const compressResponse = compression({
    // Filter function to determine which responses to compress
    filter: (req, res) => {
        // Don't compress responses with this header
        if (req.headers['x-no-compression']) {
            return false;
        }
        
        // Use compression filter defaults for text content types
        return compression.filter(req, res);
    },
    // Compression level (0-9, where 9 is maximum compression)
    level: 6
});

// Cache control middleware
const setCacheControl = (req, res, next) => {
    const staticExtensions = ['.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf'];
    const ext = path.extname(req.url);
    
    if (staticExtensions.includes(ext)) {
        // Set cache for static assets (1 week)
        res.setHeader('Cache-Control', 'public, max-age=604800');
    } else {
        // Set no-cache for dynamic content
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    
    next();
};

module.exports = {
    compressResponse,
    setCacheControl
};