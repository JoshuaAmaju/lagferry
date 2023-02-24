import { Vessel } from "./vessel";

export type Camera = {
  vessel: Vessel;
  status: "ACTIVE";
  cameraId: number;
  serialNumber: string;
};
