const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Carbon Tracker utility for monitoring application emissions
 * Uses CodeCarbon Python library via child process
 */
class CarbonTracker {
    constructor() {
        this.pythonScript = path.join(__dirname, '..', 'emissions', 'carbon_tracker.py');
        this.isTracking = false;
        this.trackingProcess = null;
        this.emissionsData = [];
        
        // Ensure emissions directory exists
        const emissionsDir = path.join(__dirname, '..', 'emissions');
        if (!fs.existsSync(emissionsDir)) {
            fs.mkdirSync(emissionsDir, { recursive: true });
        }
    }

    /**
     * Start tracking emissions
     * @param {string} projectName - Name of the project
     * @param {number} duration - Duration in seconds (optional)
     * @returns {Promise<object>} - Result of the tracking start
     */
    async startTracking(projectName = 'GreenSoftware', duration = null) {
        if (this.isTracking) {
            return { success: false, error: 'Tracking already in progress' };
        }

        return new Promise((resolve, reject) => {
            const args = ['start', projectName];
            if (duration) args.push(duration.toString());

            this.trackingProcess = spawn('python', [this.pythonScript, ...args]);
            this.isTracking = true;

            let outputData = '';
            let errorData = '';

            this.trackingProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            this.trackingProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            this.trackingProcess.on('close', (code) => {
                this.isTracking = false;
                
                if (code !== 0) {
                    console.error(`Carbon tracking process exited with code ${code}`);
                    console.error(`Error: ${errorData}`);
                    reject({ success: false, error: errorData });
                    return;
                }

                try {
                    const result = JSON.parse(outputData);
                    resolve(result);
                } catch (e) {
                    reject({ success: false, error: `Failed to parse result: ${e.message}`, output: outputData });
                }
            });
        });
    }

    /**
     * Stop tracking emissions
     * @returns {Promise<object>} - Result with emissions data
     */
    async stopTracking() {
        if (!this.isTracking) {
            return { success: false, error: 'No tracking in progress' };
        }

        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [this.pythonScript, 'stop']);
            
            let outputData = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            pythonProcess.on('close', (code) => {
                this.isTracking = false;
                
                if (code !== 0) {
                    console.error(`Carbon tracking process exited with code ${code}`);
                    console.error(`Error: ${errorData}`);
                    reject({ success: false, error: errorData });
                    return;
                }

                try {
                    const result = JSON.parse(outputData);
                    this.emissionsData.push(result);
                    resolve(result);
                } catch (e) {
                    reject({ success: false, error: `Failed to parse result: ${e.message}`, output: outputData });
                }
            });
        });
    }

    /**
     * Get the latest emissions data
     * @returns {Promise<object>} - Latest emissions data
     */
    async getLatestEmissions() {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [this.pythonScript, 'get']);
            
            let outputData = '';
            let errorData = '';

            pythonProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Carbon tracking process exited with code ${code}`);
                    console.error(`Error: ${errorData}`);
                    reject({ success: false, error: errorData });
                    return;
                }

                try {
                    const result = JSON.parse(outputData);
                    resolve(result);
                } catch (e) {
                    reject({ success: false, error: `Failed to parse result: ${e.message}`, output: outputData });
                }
            });
        });
    }

    /**
     * Check if tracking is currently active
     * @returns {boolean} - True if tracking is active
     */
    isActive() {
        return this.isTracking;
    }

    /**
     * Get all collected emissions data
     * @returns {Array} - Array of emissions data objects
     */
    getAllEmissionsData() {
        return this.emissionsData;
    }
}

module.exports = new CarbonTracker();