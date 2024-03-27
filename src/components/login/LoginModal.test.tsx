import React from "react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { render, fireEvent, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginModal from "./LoginModal";
import { mockServer } from "@/mock/server";
import { http } from "msw";
import thunk from "redux-thunk";
import { store } from "@/store/store";

describe("LoginModal", () => {
  it("renders without crashing", () => {
    render(
      <Provider store={store}>
        <LoginModal onClose={() => {}} />
      </Provider>
    );
  });

  it("calls onClose when the background is clicked", () => {
    const onClose = jest.fn();
    render(
      <Provider store={store}>
        <LoginModal onClose={onClose} />
      </Provider>
    );

    fireEvent.click(screen.getByTestId("modal-background"));

    expect(onClose).toHaveBeenCalled();
  });

  it("submits the form with the entered values", async () => {
    const onClose = jest.fn();
    render(
      <Provider store={store}>
        <LoginModal onClose={onClose} />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "testpass" },
    });

    // msw를 사용하여 '/login' API 요청을 가로챕니다.
    mockServer.use(
      http.post("/auth/login", (info) => {
        console.log("요청값", info);
        return new Response(
          JSON.stringify({ access_token: "abc-123", refresh_token: "123" }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      })
    );

    await act(async () => {
      fireEvent.submit(screen.getByTestId("login-form"));
    });

    // 여기서는 form 제출 후 기대하는 동작(예: mock 함수 호출)을 검증합니다.
    // 예를 들어, Redux action이 호출되었는지 확인하는 코드를 작성할 수 있습니다.
    // 해당 부분은 LoginModal 구현과 연동하여 작성해야 합니다.
  });
});
