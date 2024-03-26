import { LoginRequest, LoginResponse } from "@/const/interface";

const login = (builder: any) =>
  builder.mutation({
    query: (reqData: LoginRequest) => ({
      url: `/login`,
      method: "POST",
      body: reqData,
    }),
    invalidatesTags: [{ type: "User", id: "CURRENT" }],
  });

export const authEndpoints = (builder: any) => ({
  login: login(builder),
});
