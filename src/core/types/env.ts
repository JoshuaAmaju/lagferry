import * as O from "fp-ts/Option";
import HKT from "fp-ts/HKT";

export type Env<T extends HKT.URIS = O.URI> = {
  apiUrl: HKT.Kind<T, string>;
};
