import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionApiRoute } from "iron-session/next";

import * as z from "zod";

import createError from "http-errors";

import * as R from "fp-ts/Record";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { login } from "@/core/usecases/auth/login";
import { get_env } from "@/core/common/env";
import { get_http } from "@/core/common/http";
import { get_error } from "@/common/utils/error";

// non-empty fields
const schema = z.object({
  username: z
    .string({ required_error: "Password is required" })
    .min(1, { message: "Username cannot be empty" }),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" })
    .max(40, { message: "Password must not more than 40 characters" }),
});

export default withIronSessionApiRoute(function handler(req, res) {
  switch (req.method) {
    case "POST":
      const run = pipe(
        TE.Do,
        TE.fromEitherK(() => {
          const result = schema.safeParse(req.body);

          return result.success
            ? E.right(result.data)
            : E.left(createError.BadRequest("Invalid request body"));
        }),
        TE.chainW((credentials) => {
          const env = get_env();

          return pipe(
            TE.fromEither(get_http(env)),
            TE.chain((http) => login(http)(credentials)),
            TE.mapLeft((e) => createError[500]("An error occurred"))
          );
        }),
        TE.chainFirst((result) => {
          (req.session as any).auth = result;
          return TE.tryCatch(() => req.session.save(), E.toError);
        }),
        // TE.mapLeft((e) => (console.log("err", e), e)),
        TE.mapLeft(get_error)
      );

      run().then(
        E.match(
          (err) => {
            console.log("login", err);
            res.status(err.code).json(err);
          },
          (result) => {
            console.log("login", result);
            res.status(200).json({});
          }
        )
      );
      break;

    default:
      const err = createError.MethodNotAllowed();
      res.status(err.statusCode).json(err);
      break;
  }
}, get_sessionConfig());
