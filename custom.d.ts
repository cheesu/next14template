// custom.d.ts

declare module "cornerstone-tools";

declare module "cornerstone-math";

declare module "hammerjs";
declare module "cornerstone-web-image-loader";
declare module "cornerstone-wado-image-loader";
declare module "@cornerstonejs/dicom-image-loader";
declare module '@kitware/vtk.js/Rendering/Profiles/All';
declare module '@kitware/vtk.js/Rendering/Profiles/Geometry';
declare module '@kitware/vtk.js/Rendering/Core/CellPicker';
// keep only used modules to avoid TS noise
declare module '@kitware/vtk.js/Rendering/Core/CellPicker';
declare module '@kitware/vtk.js/Rendering/Core/RenderWindow';
declare module '@kitware/vtk.js/Rendering/Core/Renderer';
declare module '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
declare module '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
declare module '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';
declare module '@kitware/vtk.js/Filters/Sources/SphereSource';
declare module '@kitware/vtk.js/Rendering/Core/Mapper';
declare module '@kitware/vtk.js/Rendering/Core/Actor';
