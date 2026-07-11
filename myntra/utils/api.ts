import axios from "axios";

export const BASE_URL = "https://myntra-clone-1-drt2.onrender.com";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});