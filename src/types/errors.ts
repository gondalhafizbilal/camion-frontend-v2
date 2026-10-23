/** Thrown when {@link fetch} aborts due to our request timeout. */
export class RequestTimeoutError extends Error {
  readonly isTimeout = true;
  readonly statusCode = 408;

  constructor(message: string) {
    super(message);
    this.name = "RequestTimeoutError";
    Object.setPrototypeOf(this, RequestTimeoutError.prototype);
  }
}

export function isAbortError(error: unknown): error is DOMException | Error {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}
