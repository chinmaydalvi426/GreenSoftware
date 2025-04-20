const express = require('express');
const router = express.Router();
const carbonTracker = require('../utils/carbonTracker');
const { isLoggedIn, isAdmin } = require('../middleware');
const fs = require('fs');
const path = require('path');

// Get emissions dashboard (admin only)
router.get('/', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const latestEmissions = await carbonTracker.getLatestEmissions();
        res.render('emissions/dashboard', { 
            latestEmissions,
            isTracking: carbonTracker.isActive()
        });
    } catch (error) {
        req.flash('error', 'Failed to load emissions data');
        console.error('Emissions error:', error);
        res.redirect('/listings');
    }
});

// Start tracking emissions (admin only)
router.post('/start', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { projectName, duration } = req.body;
        const result = await carbonTracker.startTracking(projectName, duration);
        
        if (result.success) {
            req.flash('success', 'Carbon emissions tracking started');
        } else {
            req.flash('error', `Failed to start tracking: ${result.error}`);
        }
        
        res.redirect('/emissions');
    } catch (error) {
        req.flash('error', 'Failed to start emissions tracking');
        console.error('Emissions tracking error:', error);
        res.redirect('/emissions');
    }
});

// Stop tracking emissions (admin only)
router.post('/stop', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const result = await carbonTracker.stopTracking();
        
        if (result.success) {
            req.flash('success', `Carbon tracking stopped. Emissions: ${result.emissions} kg CO2eq`);
        } else {
            req.flash('error', `Failed to stop tracking: ${result.error}`);
        }
        
        res.redirect('/emissions');
    } catch (error) {
        req.flash('error', 'Failed to stop emissions tracking');
        console.error('Emissions tracking error:', error);
        res.redirect('/emissions');
    }
});

// Get emissions data as JSON (admin only)
router.get('/data', isLoggedIn, isAdmin, async (req, res) => {
    try {
        const result = await carbonTracker.getLatestEmissions();
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get emissions data' 
        });
    }
});

// Download emissions CSV (admin only)
router.get('/download', isLoggedIn, isAdmin, (req, res) => {
    const emissionsFile = path.join(__dirname, '..', 'emissions', 'emissions.csv');
    
    if (fs.existsSync(emissionsFile)) {
        res.download(emissionsFile);
    } else {
        req.flash('error', 'No emissions data file found');
        res.redirect('/emissions');
    }
});

module.exports = router;