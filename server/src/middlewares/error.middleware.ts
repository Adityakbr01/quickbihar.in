import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || "Something went wrong";
    let errors = error?.errors || [];

    if (error.name === "ValidationError") {
      statusCode = 400;
      message = "Validation Error";
      errors = Object.values(error.errors).map((el: any) => el.message);
    }

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  // Log both user-facing message and technical details to console for server visibility
  const technicalDetails = err?.stack || err?.message || JSON.stringify(err);
  console.error(`[SERVER ERROR ${error.statusCode}] User Message: "${error.message}" | Technical: ${technicalDetails}`);


  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};
