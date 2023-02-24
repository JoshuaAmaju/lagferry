import { Route } from "./route";
import { Terminal } from "./terminal";
import { Vessel } from "./vessel";

export type Schedule = {
  vessel?: Vessel;
  status: "ACTIVE";
  scheduleId: number;
  route: Route | null;
  scheduleDate: string;
  endTerminal: Terminal;
  startTerminal: Terminal;
  stopTerminals: Array<Terminal>;
  scheduleTime: [string, string];
};
