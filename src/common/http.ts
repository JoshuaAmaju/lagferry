import axios from "axios";

export function get_http() {
  return axios.create({ baseURL: "/api" });
}
