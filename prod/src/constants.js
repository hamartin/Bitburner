// Used when you want to classify/color your text output in the terminal/tail window.
export const LOG_LEVEL = Object.freeze({
    "ERROR": "ERROR:",
    "SUCCESS": "SUCCESS:",
    "INFO": "INFO:", 
    "WARN": "WARN:",
    "DEBUG": "DEBUG:",
});

// Used by the stock trading scripts.
export const COMMISSION_FEE = 100000;
export const DEF_OPEN_LONG_THRESHOLD = .55;
export const DEF_CLOSE_LONG_THRESHOLD = .50;