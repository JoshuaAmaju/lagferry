import { HttpClient } from "../types/http";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Vessel } from "../models/vessel";
import { isAxiosError } from "axios";
import { Coords, Terminal } from "../models/terminal";

type TerminalsResult = {
  data: Array<Terminal>;
};

type TerminalResult = {
  data: Terminal;
};

export function get_terminals(http: HttpClient) {
  return pipe(
    TE.tryCatch(
      () => http.get<TerminalsResult>("/terminal/api/v1"),
      (e) => (isAxiosError(e) ? e.response : (e as Error))
    ),
    TE.map((result) => result.data.data)
  );
}

export function get_terminal(http: HttpClient) {
  return (id: any) => {
    return pipe(
      TE.tryCatch(
        () => http.get<TerminalResult>(`/terminal/api/v1/${id}`),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data.data)
    );
  };
}

export type Feature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: Coords };
  properties: {
    id: number;
    name: string;
    status: "ACTIVE";
    layer: "terminal";
    image: string | null;
    created_date: string;
    description: string | null;
    last_modified_date: string;
  };
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<Feature>;
};

export function get_terminal_locations(http: HttpClient) {
  return pipe(
    TE.tryCatch(
      () => http.get<{ data: FeatureCollection }>("/terminal/api/v1/map"),
      (e) => (isAxiosError(e) ? e.response : (e as Error))
    ),
    TE.map((result) => result.data.data)
  );
}
