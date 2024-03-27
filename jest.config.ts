module.exports = {
  // TypeScript 코드를 처리하기 위해 ts-jest 프리셋을 사용합니다.
  preset: "ts-jest",

  // 테스트 환경으로 jest-environment-jsdom 사용하여 브라우저 환경을 모의합니다.
  testEnvironment: "jest-environment-jsdom",
  //testEnvironment: "jsdom",

  // Jest가 테스트를 검색할 시작점으로 src 디렉토리를 지정합니다.
  roots: ["<rootDir>/src"],

  // Jest가 처리할 수 있는 파일 확장자 목록입니다.
  // TypeScript와 JavaScript, 그리고 JSON과 Node 모듈 파일을 포함합니다.
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // TypeScript 파일(.ts, .tsx)을 처리하기 위해 ts-jest를 사용하는 변환 설정입니다.
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "@swc/jest",
  },

  // 테스트 파일을 식별하기 위한 정규 표현식 패턴입니다.
  // __tests__ 디렉토리 내의 파일 또는 .test., .spec.으로 끝나는 파일을 테스트 파일로 간주합니다.
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",

  // 모듈 경로의 별칭을 설정합니다. @/를 사용하여 src 디렉토리 내의 파일을 절대 경로로 쉽게 임포트할 수 있습니다.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // 테스트 환경이 설정된 후에 로드되어야 하는 스크립트 파일을 지정합니다.
  // 추가적인 테스트 환경 설정이 이 파일 내에서 수행됩니다.
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],

  // 코드 커버리지를 수집할 파일 패턴을 지정합니다.
  // src 디렉토리 내의 모든 TypeScript 파일에서 커버리지를 수집하지만, 타입 선언 파일(.d.ts)은 제외합니다.
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],

  // 생성할 커버리지 리포트의 형식을 지정합니다.
  // lcov은 HTML 형식의 리포트를 생성하고, text-summary는 터미널에 요약 정보를 출력합니다.
  coverageReporters: ["lcov", "text-summary"],

  // Cannot find module 'msw/node' 에러를 해결하기 위한 설정입니다.
  /*JSDOM이 내보내기 조건을 강제하기 때문입니다 browser. 즉, JSDOM은 
  "타사 패키지가 browser필드를 내보내는 경우 해당 필드를 사용하십시오"라고 말합니다. 
  그것이 기본값이고 다소 위험한 기본값입니다. 왜? JSDOM은 여전히 ​​Node.js에서 실행되기 때문입니다 . 
  게다가 JSDOM은 설계상 100% 브라우저 호환성을 가질 수 없으므로 browser내보내기 조건을 강제하면 
  MSW와 같이 다양한 환경에 대해 다양한 코드를 제공하는 패키지로 작업할 때 테스트가 
  필요 이상으로 실패하게 됩니다. */
  testEnvironmentOptions: {
    customExportConditions: [""],
  },

  setupFiles: ["./jest.polyfills.js"],
};
