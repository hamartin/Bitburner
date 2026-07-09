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
}