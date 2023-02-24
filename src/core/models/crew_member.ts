import { Vessel } from "./vessel";

export type CrewMember = {
  image: null;
  email: string;
  vessel: Vessel;
  lastName: string;
  type: "DECKHAND";
  status: "ACTIVE";
  firstName: string;
  phoneNumber: string;
  createdDate: number;
  crewMemberId: number;
  lastModifiedDate: number;
};
