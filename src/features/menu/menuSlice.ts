// features/user/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

export const menuSlice = createSlice({
  name: "menu", // 슬라이스의 이름
  initialState: {
    // 이 슬라이스의 초기 상태
    menuId: 0,
  },
  reducers: {
    // 리듀서 및 액션 정의
    setMenuId: (state, action) => {
      // 현재 메뉴  ID
      const menuId = action.payload;
      state.menuId = menuId;
    },
  },
});

// 액션 생성자 내보내기
export const { setMenuId } = menuSlice.actions;

// 리듀서 내보내기
export default menuSlice.reducer;
