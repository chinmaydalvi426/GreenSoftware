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
            isTracking: carbonTracker.isActive(),
            isCodeCarbonAvailable: carbonTracker.isCodeCarbonAvailable()
        });
    } catch (error) {
        req.flash('error', 'Failed to load emissions data');
        console.error('Emissions error:', error);
        res.redirect('/listings');
    }
});

// Test route - no authentication required for testing
router.get('/test', (req, res) => {
    res.render('emissions/test', {
        isCodeCarbonAvailable: carbonTracker.isCodeCarbonAvailable()
    });
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
        // If the file doesn't exist and CodeCarbon is not available, create a mock CSV file
        if (!carbonTracker.isCodeCarbonAvailable()) {
            const mockCsvContent = 
                'timestamp,project_name,run_id,experiment_id,duration,emissions,emissions_rate,cpu_power,gpu_power,ram_power,cpu_energy,gpu_energy,ram_energy,energy_consumed,country_name,country_iso_code,region,cloud_provider,cloud_region,os,python_version,codecarbon_version\n' +
                `${new Date().toISOString()},GreenSoftware-Mock,mock-run-id,mock-exp-id,300,0.00398,0.0000133,42.5,24.5,5.86,0.00345,0.00165,0.00048,0.00558,Mock Data,MOCK,mock-region,,,,,,\n`;
            
            const mockEmissionsFile = path.join(__dirname, '..', 'emissions', 'mock-emissions.csv');
            fs.writeFileSync(mockEmissionsFile, mockCsvContent);
            
            return res.download(mockEmissionsFile);
        }
        
        req.flash('error', 'No emissions data file found');
        res.redirect('/emissions');
    }
});

module.exports = router;