// 프로덕션에서 사용할 표준 메타데이터 형식

export interface VesselDataPackage {
  // 필수: NII 원본 정보
  niiMetadata: {
    dimensions: [number, number, number];  // [X, Y, Z] voxel 크기
    spacing: [number, number, number];     // [X, Y, Z] mm/pixel
    origin: [number, number, number];      // 원점 좌표
    orientation: string;                   // "LPI", "RAS" 등
  };
  
  // 필수: 좌표 데이터 정보
  coordinateMetadata: {
    coordinateSystem: "voxel" | "world";   // 좌표계 타입
    indexingBase: 0 | 1;                   // 0-based or 1-based
    units: "mm" | "pixel";                 // 좌표 단위
  };
  
  // 선택: MIP 이미지 정보 (있으면 더 정확)
  mipMetadata?: {
    axial?: { width: number; height: number; spacing?: [number, number] };
    coronal?: { width: number; height: number; spacing?: [number, number] };
    sagittal?: { width: number; height: number; spacing?: [number, number] };
  };
  
  // 실제 데이터
  coordinates: Array<[number, number, number, number]>; // [x, y, z, diameter]
}

// 사용 예시
export const exampleMetadata: VesselDataPackage = {
  niiMetadata: {
    dimensions: [231, 118, 209],
    spacing: [1.0, 1.0, 1.0],
    origin: [-346.04, -355.04, -207.25],
    orientation: "LPI"
  },
  coordinateMetadata: {
    coordinateSystem: "voxel",
    indexingBase: 0,
    units: "pixel"
  },
  mipMetadata: {
    axial: { width: 512, height: 384 },
    coronal: { width: 512, height: 512 },
    sagittal: { width: 384, height: 512 }
  },
  coordinates: [] // 실제 좌표 데이터
};
