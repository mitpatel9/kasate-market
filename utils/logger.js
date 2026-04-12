const fs = require("fs");
const path = require("path");

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const logFiles = {
    info: path.join(logsDir, "info.log"),
    error: path.join(logsDir, "error.log"),
    debug: path.join(logsDir, "debug.log"),
    socket: path.join(logsDir, "socket.log"),
};

// Log levels
const LogLevel = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR",
};

// Format timestamp
function getTimestamp() {
    return new Date().toISOString();
}

// Write to file
function writeToFile(filename, level, module, message, error = null) {
    const timestamp = getTimestamp();
    const logEntry = `[${timestamp}] [${level}] [${module}] ${message}`;
    const logData = error ? `${logEntry}\n${error.stack || error}\n` : `${logEntry}\n`;

    try {
        fs.appendFileSync(filename, logData, "utf8");
    } catch (err) {
        console.error("Failed to write to log file:", err.message);
    }
}

// Console output with colors
function consoleLog(level, module, message, error = null) {
    const timestamp = getTimestamp();
    const colors = {
        DEBUG: "\x1b[36m", // Cyan
        INFO: "\x1b[32m", // Green
        WARN: "\x1b[33m", // Yellow
        ERROR: "\x1b[31m", // Red
        RESET: "\x1b[0m",
    };

    const color = colors[level] || colors.RESET;
    const logMessage = `${color}[${timestamp}] [${level}] [${module}]${colors.RESET} ${message}`;

    if (level === LogLevel.ERROR && error) {
        console.error(logMessage);
        console.error(error.stack || error);
    } else {
        console.log(logMessage);
    }
}

// Core logging function

function log(level, module, message, error = null) {
    // Console output
    consoleLog(level, module, message, error);

    // File output
    if (level === LogLevel.ERROR) {
        writeToFile(logFiles.error, level, module, message, error);
    }

    if (level === LogLevel.INFO) {
        writeToFile(logFiles.info, level, module, message);
    }

    if (level === LogLevel.DEBUG && process.env.NODE_ENV !== "production") {
        writeToFile(logFiles.debug, level, module, message);
    }

    if (module.includes("[Socket]")) {
        writeToFile(logFiles.socket, level, module, message);
    }
}

// Public API
const logger = {

    debug: (message) => {
        log(LogLevel.DEBUG, "DEBUG", message);
    },

    info: (message) => {
        log(LogLevel.INFO, "INFO", message);
    },

    warn: (message) => {
        log(LogLevel.WARN, "WARN", "⚠️  " + message);
    },

    error: (message, error = null) => {
        log(LogLevel.ERROR, "ERROR", message, error);
    },

    socket: (message) => {
        log(LogLevel.INFO, "[Socket]", message);
    },

    server: (message) => {
        log(LogLevel.INFO, "[Server]", message);
    },

    price: (message) => {
        log(LogLevel.DEBUG, "[Price]", message);
    },

    matching: (message) => {
        log(LogLevel.DEBUG, "[Matching]", message);
    },

    order: (message) => {
        log(LogLevel.INFO, "[Order]", message);
    },

    trade: (message) => {
        log(LogLevel.INFO, "[Trade]", message);
    },

    wallet: (message) => {
        log(LogLevel.INFO, "[Wallet]", message);
    },

    database: (message) => {
        log(LogLevel.DEBUG, "[DB]", message);
    },

    http: (message) => {
        log(LogLevel.INFO, "[HTTP]", message);
    },

    getLogFiles: () => logFiles,

    clearLogs: () => {
        Object.values(logFiles).forEach((file) => {
            try {
                fs.writeFileSync(file, "", "utf8");
            } catch (err) {
                console.error(`Failed to clear ${file}:`, err.message);
            }
        });
    },
};

module.exports = logger;