import axios from "axios";
import { HTTP_BACKEND } from "../config";

export const api = axios.create({
  baseURL: HTTP_BACKEND,
  withCredentials: false, // true only if using cookies
});
