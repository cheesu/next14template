'use client';
import React, { useState , useEffect} from 'react';
import * as dicomParser from 'dicom-parser';
import Image from 'next/image';

const DicomReader: React.FC = () => {
  const [dicomData, setDicomData] = useState<string>('');
  const [patientInfo, setPatientInfo] = useState<{ name?: string; id?: string; test?: string }>({});
  const [imageSrc, setImageSrc] = useState<string>('');
  // DICOM 파일 읽기 핸들러
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        console.log('e.target?.result', e.target?.result)
        // ArrayBuffer로부터 DICOM 데이터 파싱
        const byteArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);


        const byteArray16 = new Uint16Array(e.target?.result as ArrayBuffer);
        const dataSet16 = dicomParser.parseDicom(byteArray);

        // DICOM 데이터에서 필요한 작업 수행
        const metaData = dataSet.elements;
        // 예시: SOP 클래스 UID 가져오기
        //const sopClassUID = dataSet.string('x00080016');

        // DICOM 데이터 상태 업데이트
        //setDicomData(JSON.stringify(metaData));

          // DICOM 데이터에서 환자 정보 가져오기
          const patientName = dataSet.string('x00100010');
          const patientID = dataSet.string('x00100020');

          const test1 = dataSet.string('x00080070');

          const rows:number = Number(dataSet.uint16('x00280010'));
          const columns: number = Number(dataSet.uint16('x00280011'));

          console.log('rows:', rows)
          console.log('columns:', columns)

  
          // 환자 정보 상태 업데이트
          setPatientInfo({ name: patientName, id: patientID, test: test1});
          //console.log('test1-----:', test1)
          //console.log('datatset',dataSet)
          //console.log('data1' , JSON.stringify(metaData))

          // 이미지 데이터 가져오기
        const pixelDataElement = dataSet.elements.x7fe00010;
        if (pixelDataElement) {
          const pixelData = new Uint8Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length);
          console.log('pixelData:', pixelData)
          // TypeScript 타입 호환성을 위해 새로운 Uint8Array로 복사
          const pixelDataCopy = new Uint8Array(pixelData);
          const blob = new Blob([pixelDataCopy], { type: 'image/jpeg' });
          console.log('blob:', blob)
          const imageUrl = URL.createObjectURL(blob);
          setImageSrc(imageUrl);

          const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
          const ctx = canvas.getContext('2d') as  CanvasRenderingContext2D

           // 캔버스 크기 조정
            canvas.width = columns;
            canvas.height = rows;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // 이미지 데이터를 캔버스에 그리기
          const imageData = ctx.createImageData(canvas.width, canvas.height);
          const data = imageData.data;
          let j = 0;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = pixelData[j]; // Red
            data[i + 1] = pixelData[j + 1]; // Green
            data[i + 2] = pixelData[j + 2]; // Blue
            data[i + 3] = 255; // Alpha (불투명도)
            j += 3; // 픽셀 데이터 배열은 RGB 형식이므로 3씩 증가시킵니다.
          }
          ctx.putImageData(imageData, 0, 0);

        }

            var arrayBuffer2 = fileReader.result;
            var byteArray2 = new Uint8Array(arrayBuffer2  as ArrayBuffer);
            if(arrayBuffer2 instanceof ArrayBuffer){
            // DICOM 데이터 파싱
            var dataSet2 = dicomParser.parseDicom(byteArray2);

        const canvas2 = document.getElementById('myCanvas2') as HTMLCanvasElement;
          const ctx2 = canvas2.getContext('2d') as  CanvasRenderingContext2D
          console.log('dataSet2', dataSet2)
         // DICOM 이미지 표시
         
         const pixelDataOffset = dataSet2.elements.x7fe00010.dataOffset; // 픽셀 데이터의 시작 오프셋
         const pixelDataLength = dataSet2.elements.x7fe00010.length; // 픽셀 데이터의 길이
         const pixelData2 = new Uint8Array(arrayBuffer2, pixelDataOffset, pixelDataLength); // 픽셀 데이터 배열
         
         var width2 = Number(dataSet2.uint16('x00280011'));
         var height2 = Number(dataSet2.uint16('x00280010'));
         canvas2.width = width2;
          canvas2.height = height2;

         var imageData = ctx2.createImageData(width2, height2);
        
          imageData.data.set(pixelData2);
          ctx2.putImageData(imageData, 0, 0);
         }else{
          console.log('dddddd')
         }
         


      };
      fileReader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 DICOM 파일 분석기</h1>
        <p className="text-lg text-gray-600 mb-8">
          DICOM 파일을 업로드하여 메타데이터를 분석하고 이미지를 확인할 수 있습니다.
        </p>
        
        {/* 파일 업로드 섹션 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">파일 업로드</h2>
          <input 
            type="file" 
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept=".dcm,.dicom"
          />
        </div>

        {/* 환자 정보 섹션 */}
        {(patientInfo.name || patientInfo.id || patientInfo.test) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">환자 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">환자명</p>
                <p className="text-lg font-semibold text-gray-900">{patientInfo.name || '-'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">환자 ID</p>
                <p className="text-lg font-semibold text-gray-900">{patientInfo.id || '-'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-500">제조사</p>
                <p className="text-lg font-semibold text-gray-900">{patientInfo.test || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* 이미지 뷰어 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">이미지 뷰 1</h3>
            <div className="flex justify-center bg-gray-50 rounded-lg p-4">
              <canvas id="myCanvas" width="400" height="400" className="border border-gray-300 rounded"></canvas>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">이미지 뷰 2</h3>
            <div className="flex justify-center bg-gray-50 rounded-lg p-4">
              <canvas id="myCanvas2" width="400" height="400" className="border border-gray-300 rounded"></canvas>
            </div>
          </div>
        </div>

        {/* DICOM 메타데이터 섹션 */}
        {dicomData && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">DICOM 메타데이터</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-gray-700">{dicomData}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DicomReader;
