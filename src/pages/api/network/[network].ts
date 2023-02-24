import { get_sessionConfig } from "@/common/utils/session";
import { withIronSessionApiRoute } from "iron-session/next";

import createError from "http-errors";

import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";

import { get_env } from "@/core/common/env";
import { get_http, get_http_with_token_refresh } from "@/core/common/http";
import { get_coverage } from "@/core/usecases/network";
import createHttpError from "http-errors";

export default withIronSessionApiRoute(function handler(req, res) {
  switch (req.method) {
    case "GET":
      const env = get_env();

      const { auth } = req.session as any;

      const http = get_http_with_token_refresh(() => get_http(env))(auth)(
        (newAuth) => {
          console.log("newAuth", newAuth);
        }
      );

      const run = pipe(
        TE.Do,
        TE.fromEitherK(() => {
          const { network } = req.query;

          return typeof network !== "string"
            ? E.left(createHttpError.BadRequest())
            : E.right(network);
        }),
        TE.chain((network) => {
          return pipe(
            TE.fromEither(http),
            TE.chain((http) => get_coverage(http)(network))
            // TE.mapLeft((e) => createError[500]("An error occurred"))
            // TE.chainFirst((result) => {
            //   (req.session as any).auth = result;
            //   return TE.tryCatch(() => req.session.save(), E.toError);
            // })
            // TE.mapLeft((e) => (console.log("err", e), e)),
            // TE.mapLeft(get_error)
          );
        })
      );

      run().then(
        E.match(
          (err) => {
            console.log("new error", err);
            res.status(500).json(err);
          },
          (result) => {
            // console.log("new", result);
            res.status(200).json(result);
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
