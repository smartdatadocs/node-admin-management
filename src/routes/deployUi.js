const { exec } = require('child_process');

const UI_PROJECT_PATH = 'C:\\Dev\\POC\\UI\\admin-web';

async function deployUi() {
    return new Promise((resolve, reject) => {
        exec(`cd ${UI_PROJECT_PATH} && npm install`, (installError, installStdout, installStderr) => {
            if (installError) {
                console.error('NPM install failed:', installError.message);
                return reject({ error: 'NPM install failed', details: installError.message });
            }

            console.log('NPM install successful:', installStdout || installStderr);

            // Check if PM2 process exists
            exec(`pm2 describe admin-web`, (pm2CheckError, pm2CheckStdout) => {
                if (pm2CheckError) {
                    // If process doesn't exist, start it
                    exec(`pm2 start ${UI_PROJECT_PATH}\\ecosystem.config.js`, (startError, startStdout, startStderr) => {
                        if (startError) {
                            console.error('UI process start failed:', startError.message);
                            return reject({ error: 'UI process start failed', details: startError.message });
                        }

                        resolve(startStdout || startStderr);
                    });
                } else {
                    // Restart if process exists
                    exec(`pm2 restart admin-web`, (restartError, restartStdout, restartStderr) => {
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
}

module.exports = { deployUi };