export const MENU_LIST = [
  { title: "홈", url: "/", id: 1 },
  { 
    title: "차트", 
    id: 2,
    children: [
      { title: "기본 차트", url: "/chart", id: 21 },
    ]
  },
  { 
    title: "DICOM", 
    id: 3,
    children: [
      { title: "DICOM 뷰어", url: "/dicom", id: 31 },
      { title: "DICOM 파서", url: "/dicompaser", id: 32 },
      { title: "이미지 스택", url: "/stack", id: 33 },
    ]
  },
  { 
    title: "도구", 
    id: 4,
    children: [
      { title: "기본 도구", url: "/tool", id: 41 },
      { title: "마우스 도구", url: "/toolMouse", id: 42 },
    ]
  },
  { 
    title: "혈관", 
    id: 5,
    children: [
      { title: "혈관 분석", url: "/vessel/analysis", id: 51 },
      { title: "혈관 통합", url: "/vessel/integrated", id: 52 },
      { title: "혈관 시각화", url: "/vessel/visualization", id: 53 },
      { title: "혈관 모형도", url: "/vessel/tree", id: 54 },
      { title: "VTK 혈관 모형", url: "/vessel/vtk", id: 55 },
    ]
  },
  { 
    title: "기타", 
    id: 6,
    children: [
      { title: "테스트", url: "/test", id: 61 },
      { title: "서브메인", url: "/submain", id: 62 },
    ]
  },
];

export const API_TIME_OUT = 10000;
