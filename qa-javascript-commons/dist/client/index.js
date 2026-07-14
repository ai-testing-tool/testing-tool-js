"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MAX_ATTACH_BYTES = exports.AttachClient = exports.IngestClient = void 0;
var ingest_client_1 = require("./ingest-client");
Object.defineProperty(exports, "IngestClient", { enumerable: true, get: function () { return ingest_client_1.IngestClient; } });
var attach_client_1 = require("./attach-client");
Object.defineProperty(exports, "AttachClient", { enumerable: true, get: function () { return attach_client_1.AttachClient; } });
Object.defineProperty(exports, "DEFAULT_MAX_ATTACH_BYTES", { enumerable: true, get: function () { return attach_client_1.DEFAULT_MAX_ATTACH_BYTES; } });
