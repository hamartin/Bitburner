/**
 * A class to help with logging
 * 
 * @example const logger = new Logger(ns);
 */
export class Logger {
    /**
     * @param {NS} ns - Netscript context
     * @example const logger = new Logger(ns);
     */
    constructor (ns) {
        this.ERROR = "ERROR:";
        this.SUCCESS = "SUCCESS:";
        this.INFO = "INFO:";
        this.WARN = "WARN:";
        this.DEBUG = "DEBUG:";
        this.ns = ns;
    }

    /**
     * Prints a log message after combining the message with a timestamp.
     * 
     * @param {string} level            - Log level -> See src/constants.js/LOG_LEVEL
     * @param {string} message          - The message to print
     * @param {string} [locale="nb-NO"] - Locale for timestamp formatting 
     */
    write(level, message, locale = "nb-NO") {
        const timeStamp = new Date().toLocaleString(locale).replace(",", "");
        this.ns.print(`${level} ${timeStamp} ${message}`);
    }

    /**
     * Format RAM values into human‑readable units.
     * 
     * @param {number} ram - RAM in gigabytes
     * @returns {string}   - RAM formatted to the correct unit.
     */
    formatRam(ram) {
        const units = ["GB", "TB", "PB", "EB", "ZB", "YB"];
        let unitIndex = 0;

        while (ram >= 1024 && unitIndex < units.length - 1) {
            ram /= 1024;
            unitIndex++;
        }

        return `${ram.toFixed(2)}${units[unitIndex]}`;
    }
}