declare module '@react-pdf/renderer' {
  const ReactPDF: {
    renderToBuffer: (element: any) => Promise<Buffer>;
    renderToStream: (element: any) => Promise<NodeJS.ReadableStream>;
    renderToFile?: (element: any, filePath: string) => Promise<void>;
  };

  export const Document: any;
  export const Page: any;
  export const Text: any;
  export const View: any;
  export const StyleSheet: {
    create: (styles: Record<string, any>) => Record<string, any>;
  };
  export const Font: {
    register: (options: any) => void;
  };

  export default ReactPDF;
}
