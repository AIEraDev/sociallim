import Joi from "joi";
export declare const startAnalysisSchema: Joi.ObjectSchema<any>;
export declare const exportAnalysisSchema: Joi.ObjectSchema<any>;
export declare const compareAnalysisSchema: Joi.ObjectSchema<any>;
export declare const paginationSchema: Joi.ObjectSchema<any>;
export declare const analysisHistorySchema: Joi.ObjectSchema<any>;
export declare const validateQuery: (schema: Joi.ObjectSchema) => (req: any, res: any, next: any) => any;
export declare const validateParams: (schema: Joi.ObjectSchema) => (req: any, res: any, next: any) => any;
export declare const idParamSchema: Joi.ObjectSchema<any>;
export declare const platformParamSchema: Joi.ObjectSchema<any>;
//# sourceMappingURL=analysisValidation.d.ts.map