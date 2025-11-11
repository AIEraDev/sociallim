"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisOrchestrationService = exports.JobManager = exports.analysisOrchestrationService = exports.jobManager = void 0;
const database_1 = require("../config/database");
const jobManager_1 = require("./jobManager");
Object.defineProperty(exports, "JobManager", { enumerable: true, get: function () { return jobManager_1.JobManager; } });
const analysisOrchestrationService_1 = require("./analysisOrchestrationService");
Object.defineProperty(exports, "AnalysisOrchestrationService", { enumerable: true, get: function () { return analysisOrchestrationService_1.AnalysisOrchestrationService; } });
exports.jobManager = new jobManager_1.JobManager(database_1.prisma);
exports.analysisOrchestrationService = new analysisOrchestrationService_1.AnalysisOrchestrationService(database_1.prisma, exports.jobManager);
//# sourceMappingURL=index.js.map