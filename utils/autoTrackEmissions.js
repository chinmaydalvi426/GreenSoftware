/**
 * Utility to automatically track carbon emissions during application runtime
 */
const carbonTracker = require('./carbonTracker');
const fs = require('fs');
const path = require('path');

// Configuration
const AUTO_TRACK = process.env.TRACK_EMISSIONS === 'true';
const TRACK_INTERVAL_MINUTES = parseInt(process.env.EMISSIONS_TRACK_INTERVAL || '60', 10);
const TRACK_DURATION_SECONDS = parseInt(process.env.EMISSIONS_TRACK_DURATION || '300', 10);

// Convert minutes to milliseconds
const TRACK_INTERVAL_MS = TRACK_INTERVAL_MINUTES * 60 * 1000;

/**
 * Initialize automatic emissions tracking
 */
async function initAutoTracking() {
    if (!AUTO_TRACK) {
        console.log('Automatic emissions tracking is disabled');
        return;
    }

    console.log(`Initializing automatic emissions tracking (every ${TRACK_INTERVAL_MINUTES} minutes)`);
    
    // Ensure emissions directory exists
    const emissionsDir = path.join(__dirname, '..', 'emissions');
    if (!fs.existsSync(emissionsDir)) {
        fs.mkdirSync(emissionsDir, { recursive: true });
    }

    // Schedule periodic tracking
    setInterval(async () => {
        try {
            console.log(`Starting scheduled emissions tracking (${TRACK_DURATION_SECONDS} seconds)`);
            const result = await carbonTracker.startTracking('GreenSoftware-Auto', TRACK_DURATION_SECONDS);
            console.log('Scheduled tracking started:', result);
        } catch (error) {
            console.error('Error starting scheduled emissions tracking:', error);
        }
    }, TRACK_INTERVAL_MS);

    // Start initial tracking
    try {
        console.log(`Starting initial emissions tracking (${TRACK_DURATION_SECONDS} seconds)`);
        const result = await carbonTracker.startTracking('GreenSoftware-Initial', TRACK_DURATION_SECONDS);
        console.log('Initial tracking started:', result);
    } catch (error) {
        console.error('Error starting initial emissions tracking:', error);
    }
}

module.exports = { initAutoTracking };