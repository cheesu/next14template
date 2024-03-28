import "@testing-library/jest-dom";
import "web-streams-polyfill/polyfill";

import { mockServer } from "./mock/server";

// /clearImmediate 함수가 정의되지 않은 문제에 대한 폴리필을 제공하기 위해
if (typeof clearImmediate === "undefined") {
  global.clearImmediate = (id: NodeJS.Immediate | undefined) =>
    clearTimeout(id as unknown as number);
}

// Add any additional setup code here
beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
