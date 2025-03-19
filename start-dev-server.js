// filepath: c:\Dev\POC\UI\admin-web\start-dev-server.js
const { spawn } = require('child_process');

const server = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true });

server.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
});