import { HttpClient } from "../types/http";

import { isAxiosError } from "axios";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { User } from "../models/user";

type UserResult = {
  data: User;
};

export function get_users(http: HttpClient) {
  return pipe(
    TE.tryCatch(
      () => http.get<Array<User>>("/user/api/v1/all"),
      (e) => (isAxiosError(e) ? e.response : (e as Error))
    ),
    TE.map((result) => result.data)
  );
}

export function get_user(http: HttpClient) {
  return (id: any) => {
    return pipe(
      TE.tryCatch(
        () => http.get<UserResult>(`/user/api/v1/${id}`),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data.data)
    );
  };
}

export function get_current_user(http: HttpClient) {
  return pipe(
    TE.tryCatch(
      () => http.get<UserResult>("/user/api/v1/profile"),
      (e) => (isAxiosError(e) ? e.response : (e as Error))
    ),
    TE.map((result) => result.data.data)
  );
}

export function create_user(http: HttpClient) {
  return (user: any) => {
    return pipe(
      TE.tryCatch(
        () => http.post("/user/api/v1/", user),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data)
    );
  };
}

export function activate_or_deactivate_user(http: HttpClient) {
  return (user: Pick<User, "userId" | "enabled">) => {
    return pipe(
      TE.tryCatch(
        () =>
          http.put(
            `/user/api/v1/${user.userId}/${
              user.enabled ? "/deactivate" : "activate"
            }`
          ),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data)
    );
  };
}

export function activate_user(http: HttpClient) {
  return (user: User["userId"]) => {
    return pipe(
      TE.tryCatch(
        () => http.put(`/user/api/v1/${user}/activate`),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data)
    );
  };
}

export function deactivate_user(http: HttpClient) {
  return (user: User["userId"]) => {
    return pipe(
      TE.tryCatch(
        () => http.put(`/user/api/v1/${user}/deactivate`),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data)
    );
  };
}

export function update_user(http: HttpClient) {
  return (
    user: Pick<User, "firstname" | "lastname" | "address" | "phonenumber">
  ) => {
    return pipe(
      TE.tryCatch(
        () => http.put("/user/api/v1/edit", user),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data)
    );
  };
}

export function change_avatar(http: HttpClient) {
  return (avatar: string) => {
    return pipe(
      TE.tryCatch(
        () => http.put("/user/api/v1/profile-pic", { image: avatar }),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data)
    );
  };
}
