import { Env } from "@/core/types/env";

import axios from "axios";

import * as E from "fp-ts/Either";
import { identity, pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import { AuthResponse } from "../types";
import { HttpClient } from "../types/http";
import { refreshToken } from "../usecases/auth/refresh";

import * as R from "fp-ts/Reader";

import * as TE from "fp-ts/TaskEither";

export function get_http(env: Env) {
  return pipe(
    env.apiUrl,
    O.map((url) => axios.create({ baseURL: url })),
    E.fromOption(() => new Error("Missing api url"))
  );
}

export function with_token(http: HttpClient) {
  return (auth: AuthResponse) => {
    http.interceptors.request.use((request) => {
      request.headers.Authorization = `${auth.type} ${auth.token}`;
      return request;
    });

    return http;
  };
}

export function get_http_with_token_refresh(
  get_http: () => E.Either<Error, HttpClient>
) {
  return (auth: AuthResponse) => {
    return (onRefresh: (auth: AuthResponse) => void) => {
      return pipe(
        get_http(),
        E.map((http) => {
          http.interceptors.request.use((request) => {
            request.headers.Authorization = `${auth.type} ${auth.token}`;
            return request;
          });

          http.interceptors.response.use(identity, async (error) => {
            const originalRequest = error.config;
            const { status } = error.response ?? {};

            console.log("refresh", status);

            // If request failure is due to expired token,
            // attempt to refresh the token. And then retry the
            // original failed request.
            if (!originalRequest._retry && status === 401) {
              originalRequest._retry = true;

              const new_http = get_http();

              const run = pipe(
                TE.fromEither(new_http),
                TE.chain((http) => refreshToken(http)(auth.token))
              );

              let result = await run();

              if (E.isLeft(result)) return Promise.reject(result.left);

              onRefresh(result.right);

              return http(originalRequest);
            }

            return Promise.reject(error);
          });

          return http;
        })
      );
    };
  };
}
