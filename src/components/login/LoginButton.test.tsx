import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginButton from "./LoginButton";
import LoginModal from "./LoginModal";

// Mock 컴포넌트의 Props 타입을 정의합니다. 실제 LoginModal 컴포넌트의 Props 타입과 일치해야 합니다.
// 이 예제에서는 onClose 함수만을 prop으로 받는 것으로 가정합니다.
interface Props {
  onClose: () => void;
}

// LoginModal 컴포넌트를 mock합니다. 타입 정의를 추가하여 TypeScript의 타입 검사를 만족시킵니다.
jest.mock("./LoginModal", () => {
  // React.FC를 사용하여 함수 컴포넌트의 타입을 정의하고, Props 타입을 적용합니다.
  return jest.fn(({ onClose }: Props) => (
    <div onClick={onClose}>Mock Modal</div>
  ));
});

describe("LoginButton Component", () => {
  it("should open the modal on button click", () => {
    render(<LoginButton />);
    const button = screen.getByRole("button", { name: "Switch to dark theme" });
    fireEvent.click(button);
    // LoginModal 컴포넌트가 호출되었는지 확인합니다.
    expect(LoginModal).toHaveBeenCalled();
  });

  it("should close the modal on modal close", () => {
    render(<LoginButton />);
    fireEvent.click(
      screen.getByRole("button", { name: "Switch to dark theme" })
    );
    fireEvent.click(screen.getByText("Mock Modal"));
    // 모달이 닫혔는지 확인하기 위해, 다시 LoginModal 호출 여부를 확인합니다.
    expect(LoginModal).toHaveBeenCalledTimes(2);
  });
});
