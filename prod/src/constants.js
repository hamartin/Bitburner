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

// I use this as an "enum" to reference the different scripts I use.
export const PAYLOADS = Object.freeze({
    "HACK": "mo-hack.js",
    "WEAKEN": "mo-weaken.js",
    "GROW": "mo-grow.js",
    "ALLINONEGO": "mo-payload.js",
});

// Used for cracking servers and checking what we can crack etc.
export const CRACKING_PROGRAMS = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
];

export const CLOUDSERVER_NAME_PREFIX = "Vogon-";

// The different amount of RAM you can have on a cloud purchased server. We are
// ignoring the 2GB and 4GB alternatives as almost all scripts will be bigger than this.
export const RAM_TIERS = [
    8, 16, 32, 64, 128, 256, 512,
    1024, 2048, 4096, 8192, 16384,
    32768, 65536, 131072, 262144,
    524288, 1048576,
];