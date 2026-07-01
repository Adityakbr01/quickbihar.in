# Refactoring Rules: Class-Based to Function-Based Modules

Use these rules when refactoring Express/Mongoose modules in this codebase from class-based structures to clean, function-based architectures.

## 1. Services
- Convert `export class XService { static async m() {} }` to top-level `export async function m() {}`.
- Delete the class definition entirely.

## 2. Controllers
- Convert `export class XController { static h = asyncHandler(...) }` to `export const h = asyncHandler(...)`.
- Delete the class definition entirely.

## 3. Singletons
- Remove singleton exports like `export const xService = new XService()`.
- Export plain functions directly. No instance exports are allowed.

## 4. Method References & Helpers
- Change `ClassName.method()`, `this.method()`, and `this.field` inside converted files to bare `method()` calls or module-scoped variables.
- Group private static helper functions under a `/* ── Internal helpers ── */` banner at the top of the file as plain functions.

## 5. Imports & Namespaces
- Convert service, DAO, and controller imports (both same-module and cross-module) to the namespace form:
  `import { X } from "./x"` → `import * as X from "./x"`.
- Do **not** change imports of Mongoose models, utilities, validation schemas, Zod, or Express types.
- Ensure that call sites remain identical (e.g., `X.foo()`).

## 6. Routers
- Convert controller imports in router files to namespace form:
  `import { XController }` → `import * as XController`.

## 7. Zod Error Pattern
- Maintain the load-bearing `ZodError` validation handling pattern exactly:
  ```ts
  try {
    const validatedData = schema.parse(data);
    // ... logic ...
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(400, "Validation Error", error.issues as any);
    }
    throw error;
  }
  ```
- If a file repeats this pattern 3 or more times, extract a local helper function:
  ```ts
  function toApiError(error: unknown): never {
    if (error instanceof ZodError) {
      throw new ApiError(400, "Validation Error", error.issues as any);
    }
    throw error;
  }
  ```

## 8. Reserved Words
- If a method name uses a reserved word (e.g. `delete`), declare it as `deleteX` internally, then export it with an alias:
  `export { deleteX as delete }`
- This ensures that consumer call sites like `dao.delete(...)` continue to work without changes.

## 9. Comments & Banners
- Add a 2–4 line JSDoc file header per file explaining its purpose.
- Add a concise JSDoc comment above each exported function describing its intent/responsibility (do not merely restate the code).
- Use section banners like `/* ── Section Name ── */` to separate sections visually (e.g., helpers, exports).
