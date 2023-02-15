import { Env } from "@/core/types/env";

import axios from "axios";

import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/lib/function";

export function get_http(env: Env) {
  return pipe(
    env.apiUrl,
    O.map((url) => axios.create({ baseURL: url })),
    E.fromOption(() => new Error("Missing api url"))
  );
}
