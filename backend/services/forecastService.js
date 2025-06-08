const { PythonShell } = require('python-shell');
const path = require('path');

class ForecastService {
    constructor() {
        this.pythonPath = path.join(__dirname, '..', '..', 'venv', 'Scripts', 'python.exe');
        this.scriptPath = path.join(__dirname, 'forecastService.py');
    }

    async updateForecastMetrics() {
        return new Promise((resolve, reject) => {
            let options = {
                pythonPath: this.pythonPath,
                scriptPath: __dirname,
                mode: 'json'
            };

            PythonShell.run('forecastService.py', options)
                .then(results => {
                    try {
                        const result = results[results.length - 1];
                        
                        if (result.status === 'error') {
                            reject(new Error(result.message));
                            return;
                        }
                        
                        resolve(result.data);
                    } catch (error) {
                        reject(error);
                    }
                })
                .catch(reject);
        });
    }
}

module.exports = new ForecastService();