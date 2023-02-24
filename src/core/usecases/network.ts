import { HttpClient } from "../types/http";

import { isAxiosError } from "axios";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { Coords } from "../models/terminal";

export type Feature = {
  type: "Feature";
  geometry: { type: "MultiPolygon"; coordinates: [[Coords]] };
  properties: {
    // id: number;
    // latency: null;
    // operator: null;
    // upload_mb: null;
    // download_mb: null;
    // glo_latency: string;
    // mtn_latency: string;
    // mtn_upload_mb: string;
    // glo_upload_mb: string;
    // airtel_latency: string;
    // glo_download_mb: string;
    // airtel_upload_mb: string;
    // etisalat_latency: string;
    // mtn_download_mb: string;
    // layer: "network-coverage";
    // etisalat_upload_mb: string;
    // airtel_download_mb: string;
    // etisalat_download_mb: string;

    id: number;
    segment: string;
    shape_area: number;
    shape_length: number;
    mtn_latency: number | null;
    glo_latency: number | null;
    glo_upload_mb: number | null;
    mtn_upload_mb: number | null;
    airtel_latency: number | null;
    glo_download_mb: number | null;
    mtn_download_mb: number | null;
    etisalat_latency: number | null;
    airtel_upload_mb: number | null;
    etisalat_upload_mb: number | null;
    airtel_download_mb: number | null;
    etisalat_download_mb: number | null;
    layer: "network-coverage-polygon";
  };
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<Feature>;
};

export function get_coverages(http: HttpClient) {
  return pipe(
    TE.tryCatch(
      () =>
        http.get<{ data: FeatureCollection }>(
          "/network-coverage-polygon/api/v1/map"
        ),
      (e) => (isAxiosError(e) ? e.response : (e as Error))
    ),
    TE.map((result) => result.data.data)
  );
}

export function get_coverage(http: HttpClient) {
  return (id: any) => {
    return pipe(
      TE.tryCatch(
        () => http.get(`/network-coverage/api/v1/${id}`),
        (e) => (isAxiosError(e) ? e.response : (e as Error))
      ),
      TE.map((result) => result.data)
    );
  };
}
