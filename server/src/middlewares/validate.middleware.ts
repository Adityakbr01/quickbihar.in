import type { Request, Response, NextFunction } from "express";
import { z, ZodError, type ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate = (schema: ZodTypeAny, source: "body" | "query" | "params" = "body") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      Object.assign(req[source], parsed);
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
