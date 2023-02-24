import { Vessel } from "./vessel";

export type Tracker = {
  notes: string;
  vessel: Vessel;
  status: "ACTIVE";
  trackerId: number;
  externalId: string;
  phoneNumber: string;
  createdDate: number;
  serialNumber: string;
  lastModifiedDate: number;
};
