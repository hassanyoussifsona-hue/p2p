import { PDFDocument } from 'pdf-lib';

/**
 * Converts any image (URL, Data URL, Blob URL) into a standard high-fidelity A4 PDF.
 */
export async function convertImageToPdfBytes(
  imageSrc: string,
  title: string = 'شهادة براءة ذمة - مصرف أبوظبي الإسلامي'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);
  pdfDoc.setAuthor('Abu Dhabi Islamic Bank');
  pdfDoc.setCreator('ADIB Core Banking');
  pdfDoc.setProducer('ADIB Document Vault');

  // Load image bytes
  let imageBytes: ArrayBuffer;
  let isPng = false;

  try {
    if (imageSrc.startsWith('data:image/png')) {
      isPng = true;
      const base64Data = imageSrc.split(',')[1];
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBytes = bytes.buffer;
    } else if (imageSrc.startsWith('data:image/jpeg') || imageSrc.startsWith('data:image/jpg')) {
      const base64Data = imageSrc.split(',')[1];
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageBytes = bytes.buffer;
    } else {
      const response = await fetch(imageSrc);
      const contentType = response.headers.get('content-type') || '';
      isPng = contentType.includes('png') || imageSrc.toLowerCase().endsWith('.png');
      imageBytes = await response.arrayBuffer();
    }
  } catch {
    // Fallback: draw through canvas to get clean JPEG bytes
    imageBytes = await new Promise<ArrayBuffer>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          async (blob) => {
            if (blob) {
              resolve(await blob.arrayBuffer());
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          0.98
        );
      };
      img.onerror = (e) => reject(e);
      img.src = imageSrc;
    });
    isPng = false;
  }

  // Embed into PDF
  let embeddedImage;
  try {
    if (isPng) {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    }
  } catch {
    // If format mismatch, attempt the other format
    try {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    } catch {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    }
  }

  // Standard A4 dimensions in PDF points (72 DPI)
  const a4Width = 595.28;
  const a4Height = 841.89;

  const page = pdfDoc.addPage([a4Width, a4Height]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: a4Width,
    height: a4Height,
  });

  return await pdfDoc.save();
}

/**
 * Downloads any image as a full-standard A4 PDF file
 */
export async function downloadImageAsPdf(
  imageSrc: string,
  fileName: string = 'ADIB_No_Liability_Certificate.pdf',
  title?: string
): Promise<void> {
  const pdfBytes = await convertImageToPdfBytes(imageSrc, title);
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  // Ensure fileName ends with .pdf
  const downloadName = fileName.toLowerCase().endsWith('.pdf')
    ? fileName
    : `${fileName.replace(/\.[^/.]+$/, '')}.pdf`;

  const a = document.createElement('a');
  a.href = url;
  a.download = downloadName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
