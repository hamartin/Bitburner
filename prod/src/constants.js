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