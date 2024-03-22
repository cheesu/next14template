import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "@/features/menu/menuSlice";
// 여러분의 slices 또는 reducers를 import하세요.

export const store = configureStore({
  reducer: {
    // reducer를 여기에 등록합니다.
    menu: menuReducer,
  },
});
// 디스패치 함수의 타입 추출
export type AppDispatch = typeof store.dispatch;
// 전역 상태의 타입 추출
export type RootState = ReturnType<typeof store.getState>;
