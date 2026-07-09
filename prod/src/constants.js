// Used by the stock trading scripts.
export const COMMISSION_FEE = 100000;
export const DEF_OPEN_LONG_THRESHOLD = .55;
export const DEF_CLOSE_LONG_THRESHOLD = .50;

// Used for cracking servers and checking what we can crack etc.
export const CRACKING_PROGRAMS = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
];

// The amount to steal from a server for each batch were firing off.
// 0 = 0% -> 1 = 100%
export const HACK_PERCENTAGE = .1;