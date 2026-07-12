/**
 * A class to help with logging
 * 
 * @example const logger = new Logger(ns);
 */
export class Logger {
    #locale;
    #ns;

    /**
     * @param {NS} ns - Netscript context
     * @example const logger = new Logger(ns);
     */
    constructor (ns, locale = "nb-NO") {
        this.DEBUG = "DEBUG:";
        this.ERROR = "ERROR:";
        this.INFO = "INFO:";
        this.SUCCESS = "SUCCESS:";
        this.WARN = "WARN:";

        this.#ns = ns;
        this.#locale = locale;
    }

    /**
     * Prints a log message after combining the message with a timestamp.
     * 
     * @param {string} level            - Log level -> See src/constants.js/LOG_LEVEL
     * @param {string} message          - The message to print
     * @param {string} [locale="nb-NO"] - Locale for timestamp formatting 
     */
    #write(level, message, locale = undefined) {
        const timeStamp = locale !== undefined
            ? new Date().toLocaleString(locale).replace(",", "")
            : new Date().toLocaleString(this.#locale).replace(",", "");
        this.#ns.print(`${level} ${timeStamp} ${message}`);
    }

    /**
     * @param {string} message            - The message to print as debug level
     * @param {string} [locale=undefined] - Locale for timestamp formatting 
     */
    debug(message, locale = undefined) {
        this.#write(this.DEBUG, message, locale);
    }

    /**
     * @param {string} message            - The message to print as error level
     * @param {string} [locale=undefined] - Locale for timestamp formatting 
     */
    error(message, locale = undefined) {
        this.#write(this.ERROR, message, locale);
    }

    /**
     * @param {string} message            - The message to print info level
     * @param {string} [locale=undefined] - Locale for timestamp formatting 
     */
    info(message, locale = undefined) {
        this.#write(this.INFO, message, locale);
    }

    /**
     * @param {string} message            - The message to print as success level
     * @param {string} [locale=undefined] - Locale for timestamp formatting 
     */
    success(message, locale = undefined) {
        this.#write(this.SUCCESS, message, locale);
    }

    /**
     * @param {string} message            - The message to print as warn level
     * @param {string} [locale=undefined] - Locale for timestamp formatting 
     */
    warn(message, locale = undefined) {
        this.#write(this.WARN, message, locale);
    }
}