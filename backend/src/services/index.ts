import { PrismaClient } from "@prisma/client";
import { prisma } from "../config/database";
import { JobManager } from "./jobManager";
import { AnalysisOrchestrationService } from "./analysisOrchestrationService";

// Create service instances
export const jobManager = new JobManager(prisma);
export const analysisOrchestrationService = new AnalysisOrchestrationService(prisma, jobManager);

// Export for use in other modules
export { JobManager, AnalysisOrchestrationService };
