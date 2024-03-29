import React from "react";
import { Provider } from "react-redux";
import {
  render,
  fireEvent,
  screen,
  act,
  waitFor,
} from "@testing-library/react";
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
    // msw를 사용하여 '/login' API 요청을 가로챕니다.
    mockServer.use(
      http.post("http://localhost:8081/auth/login", (info) => {
        console.log("요청값", info);
        return new Response(
          JSON.stringify({
            access_token: "abc-123",
            refresh_token: "12333333111",
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      })
    );

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

    await act(async () => {
      fireEvent.submit(screen.getByTestId("login-form"));
    });

    // 성공 모달이 표시되는 것을 기다립니다.
    await waitFor(() =>
      expect(screen.getByTestId("login-success-modal")).toBeInTheDocument()
    );

    // 여기서는 form 제출 후 기대하는 동작(예: mock 함수 호출)을 검증합니다.
    // 예를 들어, Redux action이 호출되었는지 확인하는 코드를 작성할 수 있습니다.
    // 해당 부분은 LoginModal 구현과 연동하여 작성해야 합니다.
  });

  it("displays an error message upon failed form submission", async () => {
    // 로그인 실패 시의 응답을 모킹합니다.
    mockServer.use(
      http.post("http://localhost:8081/auth/login", (info) => {
        return new Response(
          JSON.stringify({
            message: "로그인 정보가 유효하지 않습니다.",
            error: "Unauthorized",
            statusCode: 401,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      })
    );

    const onClose = jest.fn();
    render(
      <Provider store={store}>
        <LoginModal onClose={onClose} />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "wronguser" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpass" },
    });

    await act(async () => {
      fireEvent.submit(screen.getByTestId("login-form"));
    });

    // 에러 메시지가 화면에 표시되는지 확인합니다.
    await waitFor(() =>
      expect(
        screen.getByText("Invalid username or password")
      ).toBeInTheDocument()
    );
  });
});
