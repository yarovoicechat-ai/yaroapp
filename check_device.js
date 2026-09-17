const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

function getAdbPath() {
  try {
    execSync('adb version', { stdio: 'ignore' });
    return 'adb';
  } catch (e) {
    if (process.env.ANDROID_HOME) {
      return path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb');
    }
    return path.join(os.homedir(), 'Android', 'Sdk', 'platform-tools', 'adb');
  }
}

try {
  const adb = getAdbPath();
  const output = execSync(`${adb} devices`).toString();
  const lines = output.trim().split(/\r?\n/);
  // Remove the first line "List of devices attached"
  lines.shift();
  
  const connectedDevices = lines.filter(line => line.includes('device') && !line.includes('offline'));
  
  if (connectedDevices.length > 0) {
    console.log('Device connected. Mapping port 8081 and starting react-native run-android...');
    const adbDir = path.dirname(adb);
    process.env.PATH = `${adbDir}${path.delimiter}${process.env.PATH}`;
    try {
      execSync(`${adb} reverse tcp:8081 tcp:8081`, { stdio: 'inherit' });
    } catch (e) {
      console.warn('Warning: Could not reverse tcp:8081, proceeding anyway...');
    }
    
    // Completely decouple Metro from the build step so they don't fight over port 8081
    console.log('Spawning Metro bundler in a new window...');
    
    // Check if gnome-terminal exists on this machine, otherwise fallback
    let terminal = 'gnome-terminal';
    try {
       require('child_process').execSync('which gnome-terminal', { stdio: 'ignore' });
    } catch(e) {
       terminal = 'x-terminal-emulator';
    }

    const { spawn } = require('child_process');
    if (terminal === 'gnome-terminal') {
        spawn('gnome-terminal', ['--', 'npm', 'start', '--', '--reset-cache'], { detached: true, stdio: 'ignore', env: process.env }).unref();
    } else {
        spawn('x-terminal-emulator', ['-e', 'npm start -- --reset-cache'], { detached: true, stdio: 'ignore', env: process.env }).unref();
    }

    console.log('Waiting for Metro to spin up...');
    require('child_process').execSync('sleep 4');

    require('child_process').execSync(`npx react-native run-android --no-packager`, { stdio: 'inherit', env: process.env });
  } else {
    console.error('No external device connected');
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking for devices or running android app:', error.message);
  process.exit(1);
}
