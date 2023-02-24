import { Camera } from "./camera";
import { CrewMember } from "./crew_member";
import { Tracker } from "./tracker";

export enum Status {
  admin = "ACTIVE",
}

export type Vessel = {
  image: null;
  name: string;
  type: string;
  width: number;
  draft: number;
  speed: number;
  length: number;
  status: Status;
  tonnage: number;
  tracker: Tracker;
  capacity: number;
  vesselId: number;
  externalId: string;
  description: string;
  yearOfBuilt: number;
  createdDate: number;
  cameras: Array<Camera>;
  referenceNumber: string;
  lastModifiedDate: number;
  crewMembers: Array<CrewMember>;
};
