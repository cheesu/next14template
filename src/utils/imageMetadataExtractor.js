// 실제 프로덕션에서 사용할 메타데이터 추출기

export class ImageMetadataExtractor {
  
  // NII 파일에서 메타데이터 추출
  static async extractNiiMetadata(niiFile) {
    // nifti-reader-js 같은 라이브러리 사용
    const header = await parseNiiHeader(niiFile);
    
    return {
      dimensions: [header.dims[1], header.dims[2], header.dims[3]],
      spacing: [header.pixDims[1], header.pixDims[2], header.pixDims[3]],
      origin: [header.qoffset_x, header.qoffset_y, header.qoffset_z],
      orientation: this.getOrientationString(header),
      units: this.getUnitsString(header.xyzt_units)
    };
  }
  
  // MIP 이미지에서 메타데이터 추출
  static async extractImageMetadata(imageFile) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        });
      };
      img.src = URL.createObjectURL(imageFile);
    });
  }
  
  // 좌표 데이터 자동 분석
  static analyzeCoordinateData(coords) {
    const x = coords.map(p => p[0]);
    const y = coords.map(p => p[1]);
    const z = coords.map(p => p[2]);
    
    return {
      ranges: {
        x: { min: Math.min(...x), max: Math.max(...x) },
        y: { min: Math.min(...y), max: Math.max(...y) },
        z: { min: Math.min(...z), max: Math.max(...z) }
      },
      count: coords.length,
      // 0-based vs 1-based 자동 감지
      indexingBase: this.detectIndexingBase(coords)
    };
  }
  
  static detectIndexingBase(coords) {
    const mins = [
      Math.min(...coords.map(p => p[0])),
      Math.min(...coords.map(p => p[1])),
      Math.min(...coords.map(p => p[2]))
    ];
    
    // 최소값이 0에 가까우면 0-based, 1에 가까우면 1-based
    const avgMin = mins.reduce((a, b) => a + b) / 3;
    return avgMin < 0.5 ? 0 : 1;
  }
}
