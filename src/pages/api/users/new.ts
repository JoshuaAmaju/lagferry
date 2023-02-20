import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionApiRoute } from "iron-session/next";

import * as z from "zod";

import createError from "http-errors";

import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";

import { get_env } from "@/core/common/env";
import { get_http, get_http_with_token_refresh } from "@/core/common/http";
import { create_user } from "@/core/usecases/user";

const schema = z.object({
  address: z.string(),
  email: z.string().email(),
  phoneNumber: z.string().min(11),
  lastname: z.string().min(3).max(30),
  firstname: z.string().min(3).max(30),
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
        TE.chainW((user) => {
          const env = get_env();

          const { auth } = req.session as any;

          const http = get_http_with_token_refresh(() => get_http(env))(auth)(
            (newAuth) => {
              console.log("newAuth", newAuth);
            }
          );

          return pipe(
            TE.fromEither(http),
            TE.chain((http) => create_user(http)(user))
            // TE.mapLeft((e) => createError[500]("An error occurred"))
          );
        })
        // TE.mapLeft((e) => (console.log("err", e), e)),
        // TE.mapLeft(get_error)
      );

      run().then(
        E.match(
          (err) => {
            console.log("new error", err);
            res.status(500).json(err);
          },
          (result) => {
            console.log("new", result);
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
