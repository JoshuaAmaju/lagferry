import { AuthResponse } from "@/core/types";
import { HttpClient, HttpError } from "@/core/types/http";
import { isAxiosError } from "axios";

import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";

type Credentials = {
  username: string;
  password: string;
};

export function login(http: HttpClient) {
  return (credentials: Credentials) => {
    return pipe(
      TE.tryCatch(
        () => http.post<AuthResponse>("/auth/signin", credentials),
        (e) =>
          isAxiosError(e) ? (e.response?.data as HttpError) : (e as Error)
      ),
      TE.map((result) => result.data)
    );
  };
}
