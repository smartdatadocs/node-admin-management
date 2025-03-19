const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');

//const ENV_FILE_PATH = path.join('C:\\Dev\\POC\\backend\\nodeadminapi', '.env');
const ENV_FILE_PATH = path.join(__dirname, '..', '..', '..', 'nodeadminapi', '.env');
//const ENV_FILE_PATH = 'C:\\Dev\\POC\\backend\\nodeadminapi\\.env';
const PROJECT_PATH = 'C:\\Dev\\POC\\backend\\nodeadminapi';
const START_SCRIPT = 'src\\app.js'; // Ensure this is the correct entry point for your application

async function deployNodeApi(mongodbUri) {
    return new Promise((resolve, reject) => {
        // Update .env file dynamically
        fs.readFile(ENV_FILE_PATH, 'utf8', (err, data) => {
            if (err) {
                return reject({ error: 'Failed to read .env file', details: err.message });
            }

            // Replace existing MONGODB_URI or add it if missing
            let newEnvContent;
            if (data.includes('MONGODB_URI=')) {
                newEnvContent = data.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${mongodbUri}`);
            } else {
                newEnvContent = `${data}\nMONGODB_URI=${mongodbUri}`;
            }

            // Ensure the PORT is set to 3000
            if (data.includes('PORT=')) {
                newEnvContent = newEnvContent.replace(/PORT=.*/g, 'PORT=3000');
            } else {
                newEnvContent = `${newEnvContent}\nPORT=3000`;
            }

            fs.writeFile(ENV_FILE_PATH, newEnvContent, 'utf8', (err) => {
                if (err) {
                    return reject({ error: 'Failed to update .env file', details: err.message });
                }

                console.log('.env file updated successfully');

                // Load the correct .env file
                dotenv.config({ path: ENV_FILE_PATH });

                // Log the loaded environment variables
                console.log('Loaded environment variables:', process.env);

                // Check if PM2 process exists
                exec(`pm2 describe nodeadminapi`, (pm2CheckError, pm2CheckStdout) => {
                    if (pm2CheckError) {
                        // If process doesn't exist, start it
                        exec(`cd ${PROJECT_PATH} && npm install && npx cross-env PORT=3000 pm2 start ${START_SCRIPT} --name nodeadminapi`, { cwd: PROJECT_PATH }, (startError, startStdout, startStderr) => {
                            if (startError) {
                                console.error('Node.js API process start failed:', startError.message);
                                return reject({ error: 'Node.js API process start failed', details: startError.message });
                            }

                            console.log(`Reading .env file from: ${ENV_FILE_PATH}`);
                            console.log('Node.js API process started successfully');
                            resolve(startStdout || startStderr);
                        });
                    } else {
                        // Restart if process exists
                        exec(`cd ${PROJECT_PATH} && npm install && npx cross-env PORT=3000 pm2 restart nodeadminapi`, { cwd: PROJECT_PATH }, (restartError, restartStdout, restartStderr) => {
                            if (restartError) {
                                console.error('Node.js API restart failed:', restartError.message);
                                return reject({ error: 'Node.js API restart failed', details: restartError.message });
                            }
                            console.log(`Reading .env file from restart: ${ENV_FILE_PATH}`);
                            console.log('Node.js API process restarted successfully');
                            resolve(restartStdout || restartStderr);
                        });
                    }
                });
            });
        });
    });
}

module.exports = { deployNodeApi };