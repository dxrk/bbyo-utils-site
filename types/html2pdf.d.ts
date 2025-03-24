declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin: number;
    filename: string;
    image: { type: string; quality: number };
    html2canvas: {
      scale: number;
      border: number;
    };
    jsPDF: {
      unit: string;
      format: number[];
      orientation: string;
    };
  }

  function html2pdf(
    element: HTMLElement,
    options: Html2PdfOptions
  ): Promise<void>;

  export default html2pdf;
}
