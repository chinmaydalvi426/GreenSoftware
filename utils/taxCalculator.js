/**
 * Tax Calculator Utility
 * Provides functions to calculate taxes based on location and country
 */

// Tax rates by country and region
const taxRates = {
    // India
    'India': {
        default: 18, // Default GST rate
        // State-specific GST rates (if applicable)
        'Karnataka': 18,
        'Maharashtra': 18,
        'Delhi': 18,
        'Goa': 18,
        'Kerala': 18,
        'Tamil Nadu': 18,
        'Rajasthan': 18,
        'Himachal Pradesh': 18,
        'Uttarakhand': 18,
        'Uttar Pradesh': 18,
    },
    // United States
    'USA': {
        default: 7, // Default sales tax
        'California': 8.5,
        'New York': 8.875,
        'Texas': 6.25,
        'Florida': 6,
        'Hawaii': 4.5,
        'Colorado': 7.65,
        'Nevada': 8.25,
        'Washington': 9.5,
        'Oregon': 0, // No sales tax
    },
    // European countries (VAT)
    'United Kingdom': { default: 20 },
    'France': { default: 20 },
    'Germany': { default: 19 },
    'Italy': { default: 22 },
    'Spain': { default: 21 },
    'Netherlands': { default: 21 },
    'Switzerland': { default: 7.7 },
    // Asia Pacific
    'Japan': { default: 10 },
    'Australia': { default: 10 },
    'Singapore': { default: 8 },
    'Thailand': { default: 7 },
    'Indonesia': { default: 11 },
    // Default for other countries
    default: 10
};

// Tax names by country
const taxNames = {
    'India': 'GST',
    'USA': 'Sales Tax',
    'United Kingdom': 'VAT',
    'France': 'VAT',
    'Germany': 'VAT',
    'Italy': 'VAT',
    'Spain': 'VAT',
    'Netherlands': 'VAT',
    'Switzerland': 'VAT',
    'Japan': 'Consumption Tax',
    'Australia': 'GST',
    'Singapore': 'GST',
    'Thailand': 'VAT',
    'Indonesia': 'VAT',
    default: 'Tax'
};

/**
 * Get tax rate based on country and location
 * @param {string} country - The country of the listing
 * @param {string} location - The location/region within the country
 * @returns {number} - The applicable tax rate as a percentage
 */
function getTaxRate(country, location) {
    // If country exists in our tax rates
    if (taxRates[country]) {
        // If location exists for this country
        if (taxRates[country][location]) {
            return taxRates[country][location];
        }
        // Otherwise use country default
        return taxRates[country].default;
    }
    // If country not found, use global default
    return taxRates.default;
}

/**
 * Get tax name based on country
 * @param {string} country - The country of the listing
 * @returns {string} - The name of the tax (e.g., GST, VAT, Sales Tax)
 */
function getTaxName(country) {
    return taxNames[country] || taxNames.default;
}

/**
 * Calculate tax amount based on price, country, and location
 * @param {number} price - The base price
 * @param {string} country - The country of the listing
 * @param {string} location - The location/region within the country
 * @returns {number} - The calculated tax amount
 */
function calculateTaxAmount(price, country, location) {
    const taxRate = getTaxRate(country, location);
    return (price * taxRate) / 100;
}

/**
 * Get formatted tax information
 * @param {number} price - The base price
 * @param {string} country - The country of the listing
 * @param {string} location - The location/region within the country
 * @returns {Object} - Object containing tax information
 */
function getTaxInfo(price, country, location) {
    const taxRate = getTaxRate(country, location);
    const taxName = getTaxName(country);
    const taxAmount = calculateTaxAmount(price, country, location);
    const totalPrice = price + taxAmount;
    
    return {
        taxRate,
        taxName,
        taxAmount,
        totalPrice,
        formattedTaxInfo: `+ ${taxRate}% ${taxName}`
    };
}

module.exports = {
    getTaxRate,
    getTaxName,
    calculateTaxAmount,
    getTaxInfo
};