import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api';

export const downloadPDFFromHTML = async (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found:", elementId);
    return;
  }

  try {
    // Temporarily style the print element to be visible for capture
    const originalStyle = element.style.cssText;
    element.style.position = 'relative';
    element.style.left = '0';
    element.style.display = 'block';

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution capture
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Restore original off-screen styles
    element.style.cssText = originalStyle;

    const imgData = canvas.toDataURL('image/jpeg', 0.7);
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width
    const pageHeight = 295; // A4 height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    doc.save(filename);
  } catch (error) {
    console.error("PDF download error:", error);
  }
};

export const emailPDFFromHTML = async (elementId, email, filename, subject = '', message = '') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found:", elementId);
    return;
  }

  try {
    // Temporarily style the print element to be visible for capture
    const originalStyle = element.style.cssText;
    element.style.position = 'relative';
    element.style.left = '0';
    element.style.display = 'block';

    const canvas = await html2canvas(element, {
      scale: 2, // High resolution capture
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Restore original off-screen styles
    element.style.cssText = originalStyle;

    const imgData = canvas.toDataURL('image/jpeg', 0.7);
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width
    const pageHeight = 295; // A4 height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const pdfBase64 = doc.output('datauristring').split(',')[1];
    
    await api.post('/accounts/email-statement', {
      email,
      filename,
      pdfData: pdfBase64,
      subject,
      message
    });
  } catch (error) {
    console.error("PDF email sending error:", error);
    throw error;
  }
};
