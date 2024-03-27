import "@testing-library/jest-dom";
import { mockServer } from "./mock/server";

// Add any additional setup code here
beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
