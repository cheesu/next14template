This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## 테스트 라이브러리

Jest와 React Testing Library를 사용한 유닛 테스트를 위한 패키지
npm install --save-dev jest babel-jest @testing-library/react @testing-library/jest-dom

제스트 타입 정의를 위한 타입제스트 패키지
npm install --save-dev @types/jest

ts-node는 TypeScript 파일을 직접 실행할 수 있게 해주는 도구
npm install --save-dev ts-node

Jest에서 TypeScript 파일을 테스트하기 위한 사전 설정(preset)을 제공
npm install --save-dev ts-jest

Jest 28 버전부터 "jest-environment-jsdom"이 기본 패키지에 포함되지 않게 변경되었습니다. 따라서, 만약 테스트 환경으로 jsdom을 사용하고자 한다면, 별도로 jest-environment-jsdom 패키지를 설치
npm install --save-dev jest-environment-jsdom

Jest는 기본적으로 Babel을 사용하여 JavaScript 코드를 변환합니다. 프로젝트에서 JSX 또는 TypeScript를 사용한다면, 해당 문법을 올바르게 변환하기 위해 적절한 Babel 플러그인이나 프리셋이 설정되어 있어야 합니다.
npm install --save-dev @babel/preset-react @babel/preset-typescript
npm install --save-dev @babel/preset-env

### 관련 파일

jest.config.ts
babel.config.json
setupTests.ts

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
