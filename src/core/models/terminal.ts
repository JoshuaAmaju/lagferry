import { Schedule } from "./schedule";
import { Vessel } from "./vessel";

export type Lat = number;
export type Lng = number;

export type Coords = [Lng, Lat];

type Geometry =
  | {
      type: "Point";
      coordinates: Coords;
    }
  | {
      type: "Polygon";
      coordinates: [Array<Coords>];
    };

export type Terminal = {
  name: string;
  terminalId: number;
  geometry: Geometry;
  createdDate: number;
  image: string | null;
  vessels: Array<Vessel>;
  lastModifiedDate: number;
  schedules: Array<Schedule>;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  point: {
    coordinates: null;
    geometryType: "Point";
    coordinate: { x: Lat; y: Lng };
  };
};
