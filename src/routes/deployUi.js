const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const PortService = require('../service/PortService');

dotenv.config(); // Load environment variables from .env file

const UI_PROJECT_PATH = 'C:\\Dev\\POC\\UI\\admin-web';
const ENV_FILE_PATH = path.join(UI_PROJECT_PATH, '.env');

async function deployUi() {
    const portService = new PortService();
    const portValues = await portService.getPortValues(false);
    const updatedPortValues = await portService.updateUiPort(portValues.apiPort);
    console.log('Port values deployUi:', updatedPortValues);
    const apiPort = updatedPortValues ? updatedPortValues.apiPort : 3000; // Default to 4000 if not found
    const uiName = updatedPortValues ? updatedPortValues.uiName : 'admin-web0'; // Default to admin-web1 if not found

    return new Promise((resolve, reject) => {
        // Update .env file dynamically
        fs.readFile(ENV_FILE_PATH, 'utf8', (err, data) => {
            if (err) {
                return reject({ error: 'Failed to read .env file', details: err.message });
            }

            // Replace existing UI_PORT or add it if missing
            let newEnvContent;
            if (data.includes('VITE_API_PORT=')) {
                newEnvContent = data.replace(/VITE_API_PORT=.*/g, `VITE_API_PORT=${apiPort}`);
            } else {
                newEnvContent = `${data}\nVITE_API_PORT=${apiPort}`;
            }

            // Replace existing UI_NAME or add it if missing
            if (data.includes('UI_NAME=')) {
                newEnvContent = newEnvContent.replace(/UI_NAME=.*/g, `UI_NAME=${uiName}`);
            } else {
                newEnvContent = `${newEnvContent}\nUI_NAME=${uiName}`;
            }

            fs.writeFile(ENV_FILE_PATH, newEnvContent, 'utf8', (err) => {
                if (err) {
                    return reject({ error: 'Failed to update .env file', details: err.message });
                }

                console.log('.env file updated successfully');

                // Load the correct .env file
                dotenv.config({ path: ENV_FILE_PATH });

                exec(`cd ${UI_PROJECT_PATH} && npm install && npm run build`, (installError, installStdout, installStderr) => {
                    if (installError) {
                        console.error('NPM install failed:', installError.message);
                        return reject({ error: 'NPM install failed', details: installError.message });
                    }

                    console.log('NPM install successful:', installStdout || installStderr);

                    // Check if PM2 process exists
                    exec(`pm2 describe ${uiName}`, (pm2CheckError, pm2CheckStdout) => {
                        if (pm2CheckError) {
                            // If process doesn't exist, start it
                            exec(`pm2 start ${UI_PROJECT_PATH}\\ecosystem.config.js --name ${uiName}`, (startError, startStdout, startStderr) => {
                                if (startError) {
                                    console.error('UI process start failed:', startError.message);
                                    return reject({ error: 'UI process start failed', details: startError.message });
                                }

                                resolve(startStdout || startStderr);
                            });
                        } else {
                            // Restart if process exists
                            exec(`pm2 restart ${uiName}`, (restartError, restartStdout, restartStderr) => {
                                if (restartError) {
                                    console.error('UI restart failed:', restartError.message);
                                    return reject({ error: 'UI restart failed', details: restartError.message });
                                }

                                resolve(restartStdout || restartStderr);
                            });
                        }
                    });
                });
            });
        });
    });
}

module.exports = { deployUi };