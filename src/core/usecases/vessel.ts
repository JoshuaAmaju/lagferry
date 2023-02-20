import { HttpClient } from "../types/http";

import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/function";
import { Vessel } from "../models/vessel";
import { isAxiosError } from "axios";
import { Coords } from "../models/terminal";

type VesselsResult = {
  data: Array<Vessel>;
};

type VesselResult = {
  data: Vessel;
};

export type Feature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: Coords };
  properties: {
    name: string;
    angle: number;
    draft: number;
    speed: number;
    width: number;
    length: number;
    tonnage: number;
    capacity: number;
    status: "ACTIVE";
    gps_date: string;
    gps_time: number;
    type: "Full Boat";
    vessel_id: number;
    tracker_id: number;
    description: string;
    external_id: string;
    image: string | null;
    backlog: null;
    created_date: string;
    year_of_built: number;
    processing_time: number;
    reference_number: string;
    last_modified_date: string;
    layer: "vessel" | "terminal";
  };
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<Feature>;
};

export function get_vessels(http: HttpClient) {
  return pipe(
    TE.tryCatch(
      () => http.get<VesselsResult>("/vessel/api/v1"),
      (e) => (isAxiosError(e) ? e.response : (e as Error))
    ),
    TE.map((result) => result.data.data)
  );
}

export function get_vessel(http: HttpClient) {
  return (id: Vessel["vesselId"]) => {
    return pipe(
      TE.tryCatch(
        () => http.get<VesselResult>(`/vessel/api/v1/${id}`),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data.data)
    );
  };
}

export function get_vessel_locations(http: HttpClient) {
  return pipe(
    TE.tryCatch(
      () => http.get<{ data: FeatureCollection }>("/vessel/api/v1/map"),
      (e) => (isAxiosError(e) ? e.response : (e as Error))
    ),
    TE.map((result) => result.data.data)
  );
}
