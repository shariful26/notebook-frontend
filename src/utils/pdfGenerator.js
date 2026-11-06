import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api';

const buildPDFFromElement = async (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element not found: ${elementId}`);
  }

  const originalStyle = element.style.cssText;

  try {
    // Make element renderable at full 800px width without mobile viewport clipping
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.width = '800px';
    element.style.zIndex = '-9999';
    element.style.display = 'block';
    element.style.visibility = 'visible';

    // Wait a frame for layout calculation
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const scrollHeight = Math.max(element.scrollHeight, element.offsetHeight, 400);
    // Keep canvas height within mobile GPU limits (max ~4096px)
    const maxCanvasHeight = 4000;
    const scale = scrollHeight * 2 > maxCanvasHeight ? Math.max(1, maxCanvasHeight / scrollHeight) : 2;

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 800,
      height: scrollHeight,
      windowWidth: 800,
      windowHeight: scrollHeight + 100,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      onclone: (clonedDoc) => {
        clonedDoc.documentElement.style.maxWidth = 'none';
        clonedDoc.documentElement.style.overflow = 'visible';
        clonedDoc.body.style.maxWidth = 'none';
        clonedDoc.body.style.overflow = 'visible';
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.position = 'static';
          clonedEl.style.display = 'block';
          clonedEl.style.width = '800px';
          clonedEl.style.left = '0';
          clonedEl.style.top = '0';
          clonedEl.style.visibility = 'visible';
        }
      },
    });

    element.style.cssText = originalStyle;

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Generated canvas is empty');
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210; // A4 width in mm
    const pdfPageHeight = 297; // A4 height in mm

    // Height in canvas pixels that fits on one A4 page
    const pageCanvasHeight = Math.floor((canvas.width * pdfPageHeight) / pdfWidth);
    let yOffset = 0;
    let pageIndex = 0;

    while (yOffset < canvas.height) {
      const sliceHeight = Math.min(pageCanvasHeight, canvas.height - yOffset);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const ctx = pageCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        yOffset,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.82);
      const slicePdfHeight = (sliceHeight * pdfWidth) / canvas.width;

      if (pageIndex > 0) {
        doc.addPage();
      }
      doc.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, slicePdfHeight, undefined, 'FAST');

      yOffset += sliceHeight;
      pageIndex++;
    }

    return doc;
  } catch (err) {
    element.style.cssText = originalStyle;
    throw err;
  }
};

export const downloadPDFFromHTML = async (elementId, filename) => {
  try {
    const doc = await buildPDFFromElement(elementId);
    const safeFilename = (filename || 'statement.pdf').replace(/[\\/:*?"<>|]+/g, '_');
    doc.save(safeFilename);
    return true;
  } catch (error) {
    console.error("PDF download error:", error);
    alert("PDF ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    return false;
  }
};

export const emailPDFFromHTML = async (elementId, email, filename, subject = '', message = '') => {
  try {
    const doc = await buildPDFFromElement(elementId);
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    await api.post('/accounts/email-statement', {
      email,
      filename,
      pdfData: pdfBase64,
      subject,
      message,
    });
  } catch (error) {
    console.error("PDF email sending error:", error);
    throw error;
  }
};
