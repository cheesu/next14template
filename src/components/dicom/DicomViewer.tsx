import React, { useEffect, useRef, useState } from "react";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneMath from "cornerstone-math";
import * as cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import {Image} from "cornerstone-core";

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneWebImageLoader.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.init({
  /**
   * When cornerstone elements are enabled,
   * should `mouse` input events be listened for?
   */
  mouseEnabled: true,
  /**
   * When cornerstone elements are enabled,
   * should `touch` input events be listened for?
   */
  touchEnabled: true,
  /**
   * A special flag that synchronizes newly enabled cornerstone elements. When
   * enabled, their active tools are set to reflect tools that have been
   * activated with `setToolActive`.
   */
  globalToolSyncEnabled: false,
  /**
   * Most tools have an associated canvas or SVG cursor. Enabling this flag
   * causes the cursor to be shown when the tool is active, bound to left
   * click, and the user is hovering the enabledElement.
   */
  showSVGCursors: false,
});

const imageId =
  "https://rawgit.com/cornerstonejs/cornerstoneWebImageLoader/master/examples/Renal_Cell_Carcinoma.jpg";

const divStyle: React.CSSProperties = {
  width: "512px",
  height: "512px",
  position: "relative",
  color: "white",
};

const bottomLeftStyle: React.CSSProperties = {
  bottom: "5px",
  left: "5px",
  position: "absolute",
  color: "white",
};

const bottomRightStyle: React.CSSProperties = {
  bottom: "5px",
  right: "5px",
  position: "absolute",
  color: "white",
};

interface MyComponentProps {
  dicomimg?: Image | null;
}

const DicomViewer: React.FC<MyComponentProps> = ({dicomimg}) => { 
  const elementRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<cornerstone.Viewport | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    if(!dicomimg) return

    // Enable the DOM Element for use with Cornerstone
    cornerstone.enable(element);

    // Load the first image
     // Display the image
    cornerstone.displayImage(element, dicomimg);

     // Set up tool state
     const stack = {
       imageIds: [imageId],
       currentImageIdIndex: 0,
     };
     cornerstoneTools.addStackStateManager(element, ["stack"]);
     cornerstoneTools.addToolState(element, "stack", stack);
     const LengthTool = cornerstoneTools['LengthTool'];
     cornerstoneTools.addTool(LengthTool);
     cornerstoneTools.setToolActive('Length', { mouseButtonMask: 1 });

     // Enable tools
     /*cornerstoneTools.mouseInput.enable(element);
     cornerstoneTools.mouseWheelInput.enable(element);
     cornerstoneTools.wwwc.activate(element, 1); // Left mouse button
     cornerstoneTools.pan.activate(element, 2); // Middle mouse button
     cornerstoneTools.zoom.activate(element, 4); // Right mouse button
     cornerstoneTools.zoomWheel.activate(element); // Middle mouse wheel
     cornerstoneTools.touchInput.enable(element);
     cornerstoneTools.panTouchDrag.activate(element);
     cornerstoneTools.zoomTouchPinch.activate(element);
*/
     // Add event listeners
     element.addEventListener(
       "cornerstoneimagerendered",
       onImageRendered
     );
     element.addEventListener("cornerstonenewimage", onNewImage);
     window.addEventListener("resize", onWindowResize);

    return () => {
      // Remove event listeners
      element.removeEventListener(
        "cornerstoneimagerendered",
        onImageRendered
      );
      element.removeEventListener("cornerstonenewimage", onNewImage);
      window.removeEventListener("resize", onWindowResize);

      // Disable Cornerstone
      cornerstone.disable(element);
    };
  }, [dicomimg]);

  const onWindowResize = () => {
    if (!elementRef.current) return;
    cornerstone.resize(elementRef.current);
  };

  const onImageRendered = () => {
    if (!elementRef.current) return;
    const viewport = cornerstone.getViewport(elementRef.current);
    setViewport(viewport || null);
  };

  const onNewImage = () => {
    if (!elementRef.current) return;
    const enabledElement = cornerstone.getEnabledElement(elementRef.current);
    if (enabledElement && enabledElement.image) {
      // Now you can safely access properties on enabledElement.image
      const imageId = enabledElement.image.imageId;
      // rest of your code...
    }
    
  };

  return (
    <div className="viewportElement" style={divStyle} ref={elementRef}>
      <canvas className="cornerstone-canvas" />
      <div style={bottomLeftStyle}>Zoom: {viewport?.scale}</div>
      <div style={bottomRightStyle}>
        WW/WC: {viewport?.voi?.windowWidth} / {viewport?.voi?.windowCenter}
      </div>
    </div>
  );
};
export default DicomViewer;
