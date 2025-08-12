"use client";
import React, { useState, useCallback } from "react";
import * as nifti from "nifti-reader-js";
import * as pako from "pako";

interface ExtractedData {
  niiMetadata?: {
    filename: string;
    size: number;
    isCompressed?: boolean;
    dimensions?: [number, number, number];
    spacing?: [number, number, number];
    origin?: [number, number, number];
    orientation?: string;
    dataType?: string;
    voxelCount?: number;
    description?: string;
  };
  mipMetadata?: {
    filename: string;
    size: number;
    width: number;
    height: number;
    aspectRatio: number;
  };
  coordinateData?: {
    filename: string;
    size: number;
    pointCount: number;
    ranges: {
      x: { min: number; max: number };
      y: { min: number; max: number };
      z: { min: number; max: number };
      diameter: { min: number; max: number };
    };
    avgDiameter: number;
    indexingBase: number;
  };
}

// 유틸리티 함수들을 컴포넌트 외부로 이동
const getOrientationString = (header: any): string => {
  try {
    // ITK-SNAP과 동일한 방향 계산 방식
    
    // Method 1: qform_code가 있는 경우 quaternion 우선 사용 (ITK-SNAP 방식)
    if (header.qform_code > 0) {
      const matrix = quaternionToMatrix(
        header.quatern_b || 0,
        header.quatern_c || 0, 
        header.quatern_d || 0,
        header.qoffset_x || 0,
        header.qoffset_y || 0,
        header.qoffset_z || 0,
        header.pixDims[1] || 1,
        header.pixDims[2] || 1,
        header.pixDims[3] || 1,
        header.pixDims[0] || 1
      );
      return getITKOrientationFromMatrix(matrix);
    }
    
    // Method 2: sform_code가 있는 경우 sform 매트릭스 사용
    if (header.sform_code > 0 && header.srow_x && header.srow_y && header.srow_z) {
      return getITKOrientationFromMatrix([
        [header.srow_x[0], header.srow_x[1], header.srow_x[2]],
        [header.srow_y[0], header.srow_y[1], header.srow_y[2]], 
        [header.srow_z[0], header.srow_z[1], header.srow_z[2]]
      ]);
    }
    
    // Fallback: ITK 기본 방향
    return 'LPI';
    
  } catch (error) {
    console.warn('방향 계산 오류:', error);
    return 'Unknown';
  }
};

const quaternionToMatrix = (qb: number, qc: number, qd: number, qx: number, qy: number, qz: number, dx: number, dy: number, dz: number, qfac: number) => {
  // Quaternion을 회전 매트릭스로 변환
  const qa = Math.sqrt(1.0 - (qb*qb + qc*qc + qd*qd));
  
  const rotation = [
    [qa*qa + qb*qb - qc*qc - qd*qd, 2*(qb*qc - qa*qd), 2*(qb*qd + qa*qc)],
    [2*(qb*qc + qa*qd), qa*qa + qc*qc - qb*qb - qd*qd, 2*(qc*qd - qa*qb)],
    [2*(qb*qd - qa*qc), 2*(qc*qd + qa*qb), qa*qa + qd*qd - qb*qb - qc*qc]
  ];
  
  // 스케일링 적용
  return [
    [rotation[0][0] * dx, rotation[0][1] * dy, rotation[0][2] * dz * qfac],
    [rotation[1][0] * dx, rotation[1][1] * dy, rotation[1][2] * dz * qfac],
    [rotation[2][0] * dx, rotation[2][1] * dy, rotation[2][2] * dz * qfac]
  ];
};

const getITKOrientationFromMatrix = (matrix: number[][]): string => {
  // ITK-SNAP의 정확한 방향 계산 방식 재현
  console.log('🔍 방향 매트릭스 디버깅:', matrix);
  
  const orientationCodes = ['', '', ''];
  
  for (let imageAxis = 0; imageAxis < 3; imageAxis++) {
    let maxAbsValue = 0;
    let dominantAxis = 0;
    
    // 이 이미지 축이 어느 해부학적 축과 가장 연관이 큰지 찾기
    for (let worldAxis = 0; worldAxis < 3; worldAxis++) {
      const value = Math.abs(matrix[imageAxis][worldAxis]);
      if (value > maxAbsValue) {
        maxAbsValue = value;
        dominantAxis = worldAxis;
      }
    }
    
    // 실제 값(부호 포함)으로 방향 결정
    const actualValue = matrix[imageAxis][dominantAxis];
    
    console.log(`축 ${imageAxis}: 값=${actualValue.toFixed(3)}, 해부축=${dominantAxis}`);
    
    // ITK-SNAP 방향 매핑: NIfTI 표준에 따른 LPS+ 좌표계
    if (dominantAxis === 0) { // X 축
      orientationCodes[imageAxis] = actualValue > 0 ? 'L' : 'R'; // Left positive
    } else if (dominantAxis === 1) { // Y 축 
      orientationCodes[imageAxis] = actualValue > 0 ? 'P' : 'A'; // Posterior positive
    } else { // Z 축
      orientationCodes[imageAxis] = actualValue > 0 ? 'S' : 'I'; // Superior positive
    }
  }
  
  const result = orientationCodes.join('');
  console.log('🧭 계산된 방향:', result);
  return result;
};

const getNiftiDataTypeName = (datatypeCode: number): string => {
  const dataTypes: { [key: number]: string } = {
    2: 'UINT8',
    4: 'INT16', 
    8: 'INT32',
    16: 'FLOAT32',
    64: 'FLOAT64',
    256: 'INT8',
    512: 'UINT16',
    768: 'UINT32'
  };
  return dataTypes[datatypeCode] || `Unknown (${datatypeCode})`;
};

const DataExtractorPage: React.FC = () => {
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const parseNiftiFile = useCallback(async (file: File) => {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // gzip 파일인지 확인
          const isGzipped = file.name.endsWith('.gz');
          
          let niftiBuffer: ArrayBuffer;
          if (isGzipped) {
            try {
              // gzip 압축 해제
              const uint8Array = new Uint8Array(arrayBuffer);
              const decompressed = pako.inflate(uint8Array);
              niftiBuffer = decompressed.buffer as ArrayBuffer;
            } catch (error) {
              throw new Error('압축 해제에 실패했습니다. 파일이 손상되었을 수 있습니다.');
            }
          } else {
            niftiBuffer = arrayBuffer;
          }
          
          // 니프티 헤더 파싱
          if (!nifti.isNIFTI(niftiBuffer)) {
            throw new Error('유효한 NIfTI 파일이 아닙니다.');
          }
          
          const header = nifti.readHeader(niftiBuffer);
          if (!header) {
            throw new Error('NIfTI 헤더를 읽을 수 없습니다.');
          }
          
          // 헤더 정보 추출
          const metadata = {
            filename: file.name,
            size: file.size,
            isCompressed: isGzipped,
            dimensions: [header.dims[1], header.dims[2], header.dims[3]] as [number, number, number],
            spacing: [header.pixDims[1], header.pixDims[2], header.pixDims[3]] as [number, number, number],
            origin: [header.qoffset_x || 0, header.qoffset_y || 0, header.qoffset_z || 0] as [number, number, number],
            orientation: getOrientationString(header),
            dataType: getNiftiDataTypeName(header.datatypeCode),
            voxelCount: header.dims[1] * header.dims[2] * header.dims[3],
            description: header.description || ''
          };
          
          resolve(metadata);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('파일을 읽는데 실패했습니다.'));
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const handleNiftiUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const niiMetadata = await parseNiftiFile(file);
      setExtractedData(prev => ({
        ...prev,
        niiMetadata
      }));
    } catch (error: any) {
      console.error('NII 파일 파싱 오류:', error);
      alert(`NII 파일 처리 중 오류가 발생했습니다: ${error.message}`);
    }
    setIsProcessing(false);
  }, [parseNiftiFile]);

  const handleMipUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const img = new Image();
      img.onload = () => {
        setExtractedData(prev => ({
          ...prev,
          mipMetadata: {
            filename: file.name,
            size: file.size,
            width: img.naturalWidth,
            height: img.naturalHeight,
            aspectRatio: img.naturalWidth / img.naturalHeight
          }
        }));
        setIsProcessing(false);
      };
      img.onerror = () => {
        alert('MIP 이미지 처리 중 오류가 발생했습니다.');
        setIsProcessing(false);
      };
      img.src = URL.createObjectURL(file);
    } catch (error) {
      alert('MIP 파일 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  }, []);

  const handleCoordinateUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(data) || data.length === 0) {
          alert('올바른 좌표 데이터 형식이 아닙니다.');
          setIsProcessing(false);
          return;
        }

        const x = data.map((p: number[]) => p[0]);
        const y = data.map((p: number[]) => p[1]);
        const z = data.map((p: number[]) => p[2]);
        const diameters = data.map((p: number[]) => p[3] || 1);

        const mins = [Math.min(...x), Math.min(...y), Math.min(...z)];
        const avgMin = mins.reduce((a, b) => a + b) / 3;
        const indexingBase = avgMin < 0.5 ? 0 : 1;

        setExtractedData(prev => ({
          ...prev,
          coordinateData: {
            filename: file.name,
            size: file.size,
            pointCount: data.length,
            ranges: {
              x: { min: Math.min(...x), max: Math.max(...x) },
              y: { min: Math.min(...y), max: Math.max(...y) },
              z: { min: Math.min(...z), max: Math.max(...z) },
              diameter: { min: Math.min(...diameters), max: Math.max(...diameters) }
            },
            avgDiameter: diameters.reduce((sum: number, d: number) => sum + d, 0) / diameters.length,
            indexingBase
          }
        }));
      } catch (error) {
        alert('좌표 데이터 파일을 읽는데 실패했습니다.');
      }
      setIsProcessing(false);
    };
    reader.readAsText(file);
  }, []);

  const generateConfigCode = () => {
    const { niiMetadata, mipMetadata, coordinateData } = extractedData;
    
    if (!niiMetadata && !coordinateData) {
      return "// 파일을 업로드해주세요";
    }

    return `// 🩸 통합 혈관 분석 화면에서 사용할 설정값
const vesselConfig = {
  // NII 파일 메타데이터 (실제 파일에서 추출됨)
  niiMetadata: {
    filename: "${niiMetadata?.filename || 'sample.nii'}",
    dimensions: ${niiMetadata ? `[${niiMetadata.dimensions?.join(', ')}]` : '[231, 118, 209]'},
    spacing: ${niiMetadata ? `[${niiMetadata.spacing?.map(s => s.toFixed(3)).join(', ')}]` : '[1.0, 1.0, 1.0]'},
    origin: ${niiMetadata ? `[${niiMetadata.origin?.map(o => o.toFixed(2)).join(', ')}]` : '[-346.04, -355.04, -207.25]'},
    orientation: "${niiMetadata?.orientation || 'LPI'}",
    dataType: "${niiMetadata?.dataType || 'FLOAT32'}",
    voxelCount: ${niiMetadata?.voxelCount || 0}${niiMetadata?.description ? `,
    description: "${niiMetadata.description.replace(/"/g, '\\"')}"` : ''}
  },
  
  // 좌표 데이터 메타데이터
  coordinateMetadata: {
    coordinateSystem: "voxel",
    indexingBase: ${coordinateData?.indexingBase || 0},
    units: "pixel",
    pointCount: ${coordinateData?.pointCount || 0}
  }${mipMetadata ? `,
  
  // MIP 이미지 메타데이터
  mipMetadata: {
    width: ${mipMetadata.width},
    height: ${mipMetadata.height},
    aspectRatio: ${mipMetadata.aspectRatio.toFixed(3)}
  }` : ''}
};`;
  };

  const resetData = () => {
    setExtractedData({});
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          📁 NII 데이터 추출 도구
        </h2>
        
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-blue-900 font-semibold">사용법</h3>
          </div>
          <p className="text-blue-800 text-sm">
            니프티 파일(.nii), MIP 이미지, 좌표 데이터(.json)를 업로드하면 
            실제 파일에서 메타데이터를 읽어와 혈관 분석 화면에서 사용할 설정값을 자동으로 생성합니다.
            <br />
            <span className="text-blue-600 font-medium">✨ 실제 NIfTI 헤더 파싱 + .nii.gz 압축 파일 + 정확한 방향 계산!</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
            <div className="text-center mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">NII 파일</h3>
              <p className="text-gray-600 text-sm mb-4">
                니프티 파일 (.nii, .nii.gz)
                <br />
                <span className="text-green-600 font-medium text-xs">✅ .nii.gz 압축 파일 지원!</span>
              </p>
            </div>
            <input
              type="file"
              accept=".nii,.nii.gz"
              onChange={handleNiftiUpload}
              disabled={isProcessing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
            <div className="text-center mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">MIP 이미지</h3>
              <p className="text-gray-600 text-sm mb-4">최대강도투영 이미지</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleMipUpload}
              disabled={isProcessing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
            <div className="text-center mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">좌표 데이터</h3>
              <p className="text-gray-600 text-sm mb-4">혈관 좌표 JSON 파일</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleCoordinateUpload}
              disabled={isProcessing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 disabled:opacity-50"
            />
          </div>
        </div>

        {isProcessing && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-yellow-800">파일 분석 중... 압축 해제 및 메타데이터를 추출하고 있습니다.</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {extractedData.niiMetadata && (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                NII 메타데이터
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">파일명:</span>
                  <span className="text-blue-800 text-right max-w-40 truncate">{extractedData.niiMetadata.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">크기:</span>
                  <span className="text-blue-800">
                    {(extractedData.niiMetadata.size / 1024 / 1024).toFixed(2)} MB
                    {extractedData.niiMetadata.isCompressed && (
                      <span className="ml-1 text-xs bg-green-100 text-green-700 px-1 rounded">압축됨</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">차원:</span>
                  <span className="text-blue-800">{extractedData.niiMetadata.dimensions?.join(' × ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">복셀 수:</span>
                  <span className="text-blue-800">{extractedData.niiMetadata.voxelCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">간격:</span>
                  <span className="text-blue-800">{extractedData.niiMetadata.spacing?.map(s => s.toFixed(2)).join(' × ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">원점:</span>
                  <span className="text-blue-800 text-xs">[{extractedData.niiMetadata.origin?.map(o => o.toFixed(1)).join(', ')}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">방향:</span>
                  <span className="text-blue-800 flex items-center">
                    {extractedData.niiMetadata.orientation}
                    <span className="ml-1 text-xs text-blue-600 cursor-help" title="R=Right, L=Left, A=Anterior, P=Posterior, S=Superior, I=Inferior">
                      ⓘ
                    </span>
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1 rounded">
                      ITK 방식
                    </span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 font-medium">데이터 타입:</span>
                  <span className="text-blue-800">{extractedData.niiMetadata.dataType}</span>
                </div>
                {extractedData.niiMetadata.description && (
                  <div className="pt-2 border-t border-blue-200">
                    <span className="text-blue-700 font-medium">설명:</span>
                    <p className="text-blue-800 text-xs mt-1 break-words">{extractedData.niiMetadata.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {extractedData.mipMetadata && (
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                MIP 이미지
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">파일명:</span>
                  <span className="text-green-800 text-right max-w-40 truncate">{extractedData.mipMetadata.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">크기:</span>
                  <span className="text-green-800">{(extractedData.mipMetadata.size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">해상도:</span>
                  <span className="text-green-800">{extractedData.mipMetadata.width} × {extractedData.mipMetadata.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 font-medium">비율:</span>
                  <span className="text-green-800">{extractedData.mipMetadata.aspectRatio.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {extractedData.coordinateData && (
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                좌표 데이터
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">파일명:</span>
                  <span className="text-purple-800 text-right max-w-40 truncate">{extractedData.coordinateData.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">점 개수:</span>
                  <span className="text-purple-800">{extractedData.coordinateData.pointCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">좌표계:</span>
                  <span className="text-purple-800">{extractedData.coordinateData.indexingBase === 0 ? '0-based' : '1-based'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700 font-medium">평균 직경:</span>
                  <span className="text-purple-800">{extractedData.coordinateData.avgDiameter.toFixed(2)}</span>
                </div>
                <div className="text-purple-700 font-medium mt-3 mb-1">좌표 범위:</div>
                <div className="text-xs space-y-1 pl-2">
                  <div className="flex justify-between">
                    <span>X:</span>
                    <span className="text-purple-800">
                      {extractedData.coordinateData.ranges.x.min.toFixed(1)} ~ {extractedData.coordinateData.ranges.x.max.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Y:</span>
                    <span className="text-purple-800">
                      {extractedData.coordinateData.ranges.y.min.toFixed(1)} ~ {extractedData.coordinateData.ranges.y.max.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Z:</span>
                    <span className="text-purple-800">
                      {extractedData.coordinateData.ranges.z.min.toFixed(1)} ~ {extractedData.coordinateData.ranges.z.max.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {(extractedData.niiMetadata || extractedData.coordinateData) && (
          <div className="mt-8 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-semibold text-gray-900">생성된 설정 코드</h4>
              <button
                onClick={resetData}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
              >
                초기화
              </button>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-green-400 text-sm leading-relaxed">
                <code>{generateConfigCode()}</code>
              </pre>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-amber-800 font-semibold">사용법</span>
              </div>
              <p className="text-amber-800 text-sm">
                위 설정 코드를 복사하여 <strong>🩸 통합 혈관 분석</strong> 화면의 하드코딩된 부분을 대체하여 사용하세요.
                <br />
                <strong>✨ 이제 실제 니프티 파일에서 추출한 정확한 메타데이터</strong>(차원, 간격, 원점, 데이터 타입 등)를 
                동적으로 활용할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExtractorPage;