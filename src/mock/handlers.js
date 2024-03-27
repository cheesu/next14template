import { http } from "msw";

export const handlers = [
  http.post("/auth/login", () => {
    return new Response(
      JSON.stringify({ access_token: "abc-123", refresh_token: "123" }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }),
  // 다른 엔드포인트 핸들러...
];
