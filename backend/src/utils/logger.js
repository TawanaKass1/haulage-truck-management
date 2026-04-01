import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logStream = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });

export const logger = {
    info: (message) => {
        const log = `[INFO] ${new Date().toISOString()} - ${message}\n`;
        console.log(log);
        logStream.write(log);
    },
    error: (message) => {
        const log = `[ERROR] ${new Date().toISOString()} - ${message}\n`;
        console.error(log);
        logStream.write(log);
    },
    warn: (message) => {
        const log = `[WARN] ${new Date().toISOString()} - ${message}\n`;
        console.warn(log);
        logStream.write(log);
    },
};