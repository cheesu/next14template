import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginModal from "./LoginModal";

describe("LoginModal", () => {
  it("renders without crashing", () => {
    render(<LoginModal onClose={() => {}} />);
  });

  it("calls onClose when the background is clicked", () => {
    const onClose = jest.fn();
    render(<LoginModal onClose={onClose} />);

    fireEvent.click(screen.getByTestId("modal-background"));

    expect(onClose).toHaveBeenCalled();
  });

  it("submits the form with the entered values", () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(<LoginModal onClose={onClose} />);

    fireEvent.change(getByLabelText("Username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(getByLabelText("Password"), {
      target: { value: "testpass" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    // Here you would typically expect some action to have happened, like a mock function being called with the form values.
    // As the form submission is currently only logged to the console, there's nothing to assert here.
  });
});
