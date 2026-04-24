import type { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodObject } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate = (schema: ZodObject<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        return next(new ApiError(400, "Validation Error", errors));
      }
      next(error);
    }
  };
};
