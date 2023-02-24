import { Env } from "../types/env";

import * as O from "fp-ts/Option";

export function get_env(): Env {
  return {
    apiUrl: O.fromNullable(process.env.API_URL),
    mapbox: {
      api_key: O.fromNullable(process.env.MAPBOX_API_KEY),
    },
  };
}
