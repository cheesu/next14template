/**
 * 케이스4 혈관 데이터 인터페이스
 * 혈관 트리 구조와 각 브랜치의 노드 정보를 포함
 */

export interface VesselCase4Data {
  /** 메타데이터 정보 */
  metadata: VesselMetadata;
  /** 혈관 브랜치 배열 */
  branches: VesselBranch[];
}

export interface VesselMetadata {
  /** 3D 공간에서의 간격 정보 (mm 단위) */
  spacing_mm: SpacingInfo;
  /** 루트 노드 ID */
  root_node: string;
}

export interface SpacingInfo {
  /** X축 간격 (mm) */
  x: number;
  /** Y축 간격 (mm) */
  y: number;
  /** Z축 간격 (mm) */
  z: number;
}

export interface VesselBranch {
  /** 브랜치 고유 ID */
  branch_id: string;
  /** 혈관 분류 (0: 대동맥, 1: 주요 분지, 2: 2차 분지, 3: 말단 분지) */
  vessel_classification: number;
  /** 혈관 위치 (center, right, left) */
  side: "center" | "right" | "left";
  /** 브랜치 순서 */
  order: number;
  /** 대동맥 여부 */
  is_aorta: boolean;
  /** 브랜치 길이 (mm) */
  length: number;
  /** 트리 구조에서의 깊이 */
  depth: number;
  /** 시작점 노드 ID */
  start_point: string;
  /** 끝점 노드 ID */
  end_point: string;
  /** 부모 브랜치 ID (루트인 경우 null) */
  parent_branch_id: string | null;
  /** 부모 브랜치의 연결 노드 ID (루트인 경우 null) */
  parent_branch_node_id: string | null;
  /** 자식 브랜치 ID 배열 */
  children_branch_ids: string[];
  /** 자식 브랜치 연결 정보 배열 */
  children_branch_node_ids: ChildBranchConnection[];
  /** 브랜치를 구성하는 노드 배열 */
  nodes: VesselNode[];
}

export interface ChildBranchConnection {
  /** 자식 브랜치 ID */
  branch_id: string;
  /** 연결점 노드 ID */
  node_id: string;
}

export interface VesselNode {
  /** 노드 고유 ID (z_y_x 형식) */
  node_id: string;
  /** 3D 좌표 정보 */
  coordinates: Coordinates3D;
  /** 혈관 직경 (mm) */
  diameter_mm: number;
  /** 브랜치 시작점으로부터의 거리 (mm) */
  distance_from_branch_mm: number;
  /** 경고 사유 코드 (0: 정상, 1: 직경 이상, 2: 위치 이상) */
  warning_reason: number;
}

export interface Coordinates3D {
  /** X 좌표 */
  x: number;
  /** Y 좌표 */
  y: number;
  /** Z 좌표 */
  z: number;
}

/**
 * 혈관 분류 열거형
 */
export enum VesselClassification {
  /** 대동맥 */
  AORTA = 0,
  /** 주요 분지 */
  MAJOR_BRANCH = 1,
  /** 2차 분지 */
  SECONDARY_BRANCH = 2,
  /** 말단 분지 */
  TERMINAL_BRANCH = 3,
}

/**
 * 경고 사유 열거형
 */
export enum WarningReason {
  /** 정상 */
  NORMAL = 0,
  /** 직경 이상 */
  DIAMETER_ABNORMAL = 1,
  /** 위치 이상 */
  POSITION_ABNORMAL = 2,
}

/**
 * 혈관 위치 열거형
 */
export enum VesselSide {
  /** 중앙 */
  CENTER = "center",
  /** 우측 */
  RIGHT = "right",
  /** 좌측 */
  LEFT = "left",
}


