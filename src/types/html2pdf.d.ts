declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      logging?: boolean;
      // Use Record<string, unknown> instead of any
      [key: string]: unknown;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'portrait' | 'landscape';
      // Use Record<string, unknown> instead of any
      [key: string]: unknown;
    };
    // Use Record<string, unknown> instead of any
    [key: string]: unknown;
  }

  interface Html2PdfInstance {
    from(element: HTMLElement | string): Html2PdfInstance;
    set(options: Html2PdfOptions): Html2PdfInstance;
    save(): Promise<void>;
    // Use unknown instead of any for the return type
    output(type: string, options?: Record<string, unknown>): Promise<unknown>;
    // Use unknown instead of any for the PDF object
    then(callback: (pdf: unknown) => void): Html2PdfInstance;
    catch(callback: (error: Error) => void): Html2PdfInstance;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(element: HTMLElement | string, options?: Html2PdfOptions): Html2PdfInstance;

  export default html2pdf;
}
