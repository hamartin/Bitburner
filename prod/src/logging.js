/**
 * Prints a log message after combining the message with a timestamp.
 * 
 * @param {NS} ns                   - Netscript context
 * @param {string} level            - Log level -> See src/constants.js/LOG_LEVEL
 * @param {string} message          - The message to print
 * @param {string} [locale="nb-NO"] - Locale for timestamp formatting 
 */
export function LogMessage(ns, level, message, locale = "nb-NO") {
    const timeStamp = new Date().toLocaleString(locale).replace(",", "");
    ns.print(`${level} ${timeStamp} ${message}`);
}