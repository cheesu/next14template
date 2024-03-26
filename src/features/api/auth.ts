import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { authEndpoints } from "@/features/api/endpoint/authApi";
import { API_TIME_OUT } from "@/const/const";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8081/auth",
    timeout: API_TIME_OUT,
  }),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    ...authEndpoints(builder),
  }),
});

export const { useLoginMutation } = authApi;
