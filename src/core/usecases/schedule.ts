import { HttpClient } from "../types/http";

import { isAxiosError } from "axios";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { Terminal } from "../models/terminal";

type TerminalsResult = {
  data: Array<Terminal>;
};

export function create_schedule(http: HttpClient) {
  return (schedule: any) => {
    return pipe(
      TE.tryCatch(
        () => http.post("/schedule/api/v1/", schedule),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data)
    );
  };
}
