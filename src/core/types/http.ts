import { AxiosInstance } from "axios";

export type HttpClient = AxiosInstance;

export type HttpError = {
  errors: Array<string>;
};
