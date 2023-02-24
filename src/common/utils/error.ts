import { HttpError } from "@/types/http";
import { HttpError as _HttpError } from "http-errors";

export function get_error(err: Error | _HttpError): HttpError {
  return err instanceof _HttpError
    ? { code: err.statusCode, message: err.message }
    : { code: 500, message: err.message ?? "An error occurred" };
}
