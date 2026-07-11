"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jestJsonRun = jestJsonRun;
function jestJsonRun(reportFile) {
    return `npx jest --json --outputFile=${reportFile}`;
}
