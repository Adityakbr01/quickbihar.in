import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/ApiResponse";

/**
 * Augments the Express `Response` interface with typed helpers that emit a
 * standardized {@link ApiResponse} envelope. This lets controllers write
 * `res.ok(data)` instead of repeating `res.status(200).json(new ApiResponse(...))`.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Response {
      /** Emits a `200 OK` with a standardized {@link ApiResponse} envelope. */
      ok<T>(data: T, message?: string): void;
      /** Emits a `201 Created` with a standardized {@link ApiResponse} envelope. */
      created<T>(data: T, message?: string): void;
      /** Emits a `204 No Content` with an empty body. */
      nocontent(): void;
    }
  }
}

/**
 * Registers the standardized response helpers (`res.ok`, `res.created`,
 * `res.nocontent`) on every response object. Mount this once, globally, before
 * the route declarations so all downstream controllers inherit the helpers.
 *
 * @example
 * export const listRiders = asyncHandler(async (req, res) => {
 *   const riders = await deliveryService.listAdminRiders(req.query);
 *   res.ok(riders, "Delivery riders fetched successfully");
 * });
 */
export function responseExtensions(_req: Request, res: Response, next: NextFunction) {
  res.ok = function ok<T>(data: T, message: string = "Success") {
    res.status(200).json(new ApiResponse(200, data, message));
  };

  res.created = function created<T>(data: T, message: string = "Created successfully") {
    res.status(201).json(new ApiResponse(201, data, message));
  };

  res.nocontent = function nocontent() {
    res.status(204).end();
  };

  next();
}
