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
        this.isAvailable = true;
        
        // Ensure emissions directory exists
        const emissionsDir = path.join(__dirname, '..', 'emissions');
        if (!fs.existsSync(emissionsDir)) {
            fs.mkdirSync(emissionsDir, { recursive: true });
        }
        
        // Check if Python and CodeCarbon are available
        this.checkDependencies();
    }
    
    /**
     * Check if Python and CodeCarbon are available
     */
    checkDependencies() {
        try {
            const pythonProcess = spawn('python', ['-c', 'import codecarbon']);
            
            pythonProcess.on('error', (err) => {
                console.warn('Python or CodeCarbon not available:', err.message);
                this.isAvailable = false;
            });
            
            pythonProcess.stderr.on('data', (data) => {
                console.warn('Python dependency check error:', data.toString());
                this.isAvailable = false;
            });
            
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.warn(`Python dependency check exited with code ${code}`);
                    this.isAvailable = false;
                } else {
                    console.log('CodeCarbon is available');
                }
            });
        } catch (error) {
            console.warn('Failed to check Python dependencies:', error);
            this.isAvailable = false;
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
        
        // If CodeCarbon is not available, return a mock response
        if (!this.isAvailable) {
            console.warn('CodeCarbon is not available. Returning mock data.');
            return {
                success: true,
                message: 'CodeCarbon is not available. Using mock data.',
                timestamp: new Date().toISOString(),
                isMock: true
            };
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
            
            this.trackingProcess.on('error', (error) => {
                console.error('Failed to start Python process:', error);
                this.isTracking = false;
                this.isAvailable = false;
                resolve({
                    success: true,
                    message: 'CodeCarbon is not available. Using mock data.',
                    timestamp: new Date().toISOString(),
                    isMock: true
                });
            });

            this.trackingProcess.on('close', (code) => {
                this.isTracking = false;
                
                if (code !== 0) {
                    console.error(`Carbon tracking process exited with code ${code}`);
                    console.error(`Error: ${errorData}`);
                    
                    // If the process fails, mark CodeCarbon as unavailable
                    this.isAvailable = false;
                    
                    resolve({
                        success: true,
                        message: 'CodeCarbon is not available. Using mock data.',
                        timestamp: new Date().toISOString(),
                        isMock: true
                    });
                    return;
                }

                try {
                    const result = JSON.parse(outputData);
                    resolve(result);
                } catch (e) {
                    console.error('Failed to parse Python output:', e);
                    resolve({
                        success: true,
                        message: 'CodeCarbon is not available. Using mock data.',
                        timestamp: new Date().toISOString(),
                        isMock: true
                    });
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
        
        // If CodeCarbon is not available, return a mock response
        if (!this.isAvailable) {
            this.isTracking = false;
            const mockResult = {
                success: true,
                emissions: '0.00398',
                timestamp: new Date().toISOString(),
                isMock: true
            };
            this.emissionsData.push(mockResult);
            return mockResult;
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
            
            pythonProcess.on('error', (error) => {
                console.error('Failed to start Python process:', error);
                this.isTracking = false;
                this.isAvailable = false;
                
                const mockResult = {
                    success: true,
                    emissions: '0.00398',
                    timestamp: new Date().toISOString(),
                    isMock: true
                };
                this.emissionsData.push(mockResult);
                resolve(mockResult);
            });

            pythonProcess.on('close', (code) => {
                this.isTracking = false;
                
                if (code !== 0) {
                    console.error(`Carbon tracking process exited with code ${code}`);
                    console.error(`Error: ${errorData}`);
                    
                    // If the process fails, mark CodeCarbon as unavailable
                    this.isAvailable = false;
                    
                    const mockResult = {
                        success: true,
                        emissions: '0.00398',
                        timestamp: new Date().toISOString(),
                        isMock: true
                    };
                    this.emissionsData.push(mockResult);
                    resolve(mockResult);
                    return;
                }

                try {
                    const result = JSON.parse(outputData);
                    this.emissionsData.push(result);
                    resolve(result);
                } catch (e) {
                    console.error('Failed to parse Python output:', e);
                    
                    const mockResult = {
                        success: true,
                        emissions: '0.00398',
                        timestamp: new Date().toISOString(),
                        isMock: true
                    };
                    this.emissionsData.push(mockResult);
                    resolve(mockResult);
                }
            });
        });
    }

    /**
     * Get the latest emissions data
     * @returns {Promise<object>} - Latest emissions data
     */
    async getLatestEmissions() {
        // If CodeCarbon is not available, return a mock response
        if (!this.isAvailable) {
            return {
                success: true,
                data: {
                    timestamp: new Date().toISOString(),
                    project_name: 'GreenSoftware-Mock',
                    emissions: '0.00398',
                    energy_consumed: '0.00558',
                    duration: '300',
                    country_name: 'Mock Data',
                    cpu_power: '42.5',
                    gpu_power: '24.5',
                    ram_power: '5.86'
                },
                timestamp: new Date().toISOString(),
                isMock: true
            };
        }
        
        // If we have emissions data in memory, return the latest
        if (this.emissionsData.length > 0 && !this.isAvailable) {
            return this.emissionsData[this.emissionsData.length - 1];
        }

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
            
            pythonProcess.on('error', (error) => {
                console.error('Failed to start Python process:', error);
                this.isAvailable = false;
                
                resolve({
                    success: true,
                    data: {
                        timestamp: new Date().toISOString(),
                        project_name: 'GreenSoftware-Mock',
                        emissions: '0.00398',
                        energy_consumed: '0.00558',
                        duration: '300',
                        country_name: 'Mock Data',
                        cpu_power: '42.5',
                        gpu_power: '24.5',
                        ram_power: '5.86'
                    },
                    timestamp: new Date().toISOString(),
                    isMock: true
                });
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Carbon tracking process exited with code ${code}`);
                    console.error(`Error: ${errorData}`);
                    
                    // If the process fails, mark CodeCarbon as unavailable
                    this.isAvailable = false;
                    
                    resolve({
                        success: true,
                        data: {
                            timestamp: new Date().toISOString(),
                            project_name: 'GreenSoftware-Mock',
                            emissions: '0.00398',
                            energy_consumed: '0.00558',
                            duration: '300',
                            country_name: 'Mock Data',
                            cpu_power: '42.5',
                            gpu_power: '24.5',
                            ram_power: '5.86'
                        },
                        timestamp: new Date().toISOString(),
                        isMock: true
                    });
                    return;
                }

                try {
                    const result = JSON.parse(outputData);
                    resolve(result);
                } catch (e) {
                    console.error('Failed to parse Python output:', e);
                    
                    resolve({
                        success: true,
                        data: {
                            timestamp: new Date().toISOString(),
                            project_name: 'GreenSoftware-Mock',
                            emissions: '0.00398',
                            energy_consumed: '0.00558',
                            duration: '300',
                            country_name: 'Mock Data',
                            cpu_power: '42.5',
                            gpu_power: '24.5',
                            ram_power: '5.86'
                        },
                        timestamp: new Date().toISOString(),
                        isMock: true
                    });
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
    
    /**
     * Check if CodeCarbon is available
     * @returns {boolean} - True if CodeCarbon is available
     */
    isCodeCarbonAvailable() {
        return this.isAvailable;
    }
}

module.exports = new CarbonTracker();