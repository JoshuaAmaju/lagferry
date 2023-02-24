import { HttpClient } from "../types/http";

import { isAxiosError } from "axios";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { Route } from "../models/route";

type TerminalsResult = {
  data: Array<Route>;
};

export function get_routes(http: HttpClient) {
  return pipe(
    TE.tryCatch(
      () => http.get<TerminalsResult>("/route/api/v1"),
      (e) => (isAxiosError(e) ? e.response : (e as Error))
    ),
    TE.map((result) => result.data.data)
  );
}
