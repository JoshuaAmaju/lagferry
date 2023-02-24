import { AuthResponse } from "@/core/types";
import { HttpClient } from "@/core/types/http";

import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";

export function refreshToken(http: HttpClient) {
  return (token: string) => {
    return pipe(
      TE.tryCatch(
        () =>
          http.post<AuthResponse>("/auth/refresh", null, { params: { token } }),
        E.toError
      ),
      TE.map((result) => result.data)
    );
  };
}
