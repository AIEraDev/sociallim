import Joi from "joi";
export declare const registerSchema: Joi.ObjectSchema<any>;
export declare const loginSchema: Joi.ObjectSchema<any>;
export declare const updateProfileSchema: Joi.ObjectSchema<any>;
export declare const changePasswordSchema: Joi.ObjectSchema<any>;
export declare const validateRequest: (schema: Joi.ObjectSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=authValidation.d.ts.map