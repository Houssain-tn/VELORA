import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Export generic array of objects to an Excel file
 */
export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Données');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export data to a formatted PDF with jspdf-autotable
 */
export function exportToPDF(columns: { header: string; dataKey: string }[], data: any[], filename: string, title: string, company?: any, action: 'SAVE' | 'PREVIEW' = 'SAVE') {
  const doc = new jsPDF('portrait', 'pt', 'A4');
  const brandColor = company?.primaryColor || '#2563eb';

  // Helper to convert hex to RGB for jspdf-autotable
  const hexToRgbArr = (hex: string): [number, number, number] => {
    let r = 37, g = 99, b = 235;
    if (hex.startsWith('#')) {
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      }
    }
    return [r, g, b];
  };

  const rgb = hexToRgbArr(brandColor);

  // Title
  doc.setFontSize(18);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]); // Title in brand color
  doc.text(title, 40, 40);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${company?.name || 'VELORA PRO'} | Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 40, 60);

  // Table
  try {
    autoTable(doc, {
      columns: columns,
      body: data || [],
      startY: 80,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 6,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: rgb,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { top: 80 },
    });
  } catch (err) {
    console.error('PDF Table generation error:', err);
    doc.text('Erreur lors de la génération du tableau des données.', 40, 100);
  }

  if (action === 'PREVIEW') {
    doc.output('dataurlnewwindow');
  } else {
    doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }
}
/**
 * Generate a professional intervention report for a single intervention
 */
export async function generateInterventionReport(intervention: any, company?: any, action: 'SAVE' | 'PREVIEW' = 'SAVE') {
  const doc = new jsPDF('portrait', 'pt', 'A4');
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const brandColor = company?.primaryColor || '#2563eb';
  
  // Header with Logo
  try {
    const logoUrl = company?.logo || '/favicon.png'; // Using more stable base asset
    const response = await fetch(logoUrl).catch(() => null);
    
    if (response && response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, 'PNG', margin, 30, 80, 40);
    } else {
      throw new Error('Logo not available');
    }
  } catch (e) {
    doc.setFontSize(22);
    doc.setTextColor(brandColor);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || 'VELORA', margin, 55);
  }

  // Company Contact Info next to Header (Right side)
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  const contactText = [
    company?.name || 'Waycon Mediterranée',
    company?.address || 'Av. Yasser Arafat, Imm. Narjess, Sahloul 1, 4054, Sousse, Tunisie',
    `${company?.city || ''} ${company?.country || ''}`,
    `Tel: ${company?.phone || '+216 73 820 747'} | Email: ${company?.email || 'contact@waycon.com'}`
  ].filter(line => line.trim() !== '');
  
  contactText.forEach((line, i) => {
    doc.text(line, pageWidth - margin, 40 + (i * 12), { align: 'right' });
  });

  // Report Title
  doc.setFontSize(22);
  doc.setTextColor(33);
  doc.setFont('helvetica', 'bold');
  doc.text("RAPPORT D'INTERVENTION", pageWidth / 2, 110, { align: 'center' });

  doc.setDrawColor(brandColor);
  doc.setLineWidth(2);
  doc.line(margin, 125, pageWidth - margin, 125);

  // Intervention Metadata Row
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80);
  doc.text(`RÉFÉRENCE: ${intervention.reference}`, margin, 145);
  doc.text(`DATE: ${format(new Date(intervention.createdAt), 'dd/MM/yyyy')}`, pageWidth / 2, 145, { align: 'center' });
  doc.text(`STATUT: ${intervention.status.toUpperCase()}`, pageWidth - margin, 145, { align: 'right' });

  // Client & Site Info Box
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, 165, pageWidth - margin * 2, 85, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandColor);
  doc.text('INFORMATIONS CLIENT & SITE', margin + 15, 185);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50);
  doc.text(`CLIENT: ${intervention.site?.contract?.client?.name || 'N/A'}`, margin + 15, 205);
  doc.text(`SITE: ${intervention.site?.name || 'N/A'}`, margin + 15, 220);
  doc.text(`RESPONSABLE: ${intervention.site?.contactName || 'Non spécifié'}`, margin + 15, 235);
  
  doc.text(`ADRESSE: ${intervention.site?.address || 'N/A'}`, pageWidth / 2, 205);
  doc.text(`VILLE: ${intervention.site?.city || 'N/A'}`, pageWidth / 2, 220);
  doc.text(`TÉLÉPHONE: ${intervention.site?.contactPhone || 'Non spécifié'}`, pageWidth / 2, 235);

  // Details Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33);
  doc.text('DÉTAILS TECHNIQUES', margin, 275);
  autoTable(doc, {
    startY: 290,
    margin: { left: margin, right: margin },
    head: [['Champ', 'Informations']],
    body: [
      ['OBJET', intervention.title],
      ['DESCRIPTION', intervention.description || 'Aucune description fournie'],
      ['PRIORITÉ', intervention.priority],
      ['DEMANDEUR', intervention.requestedBy?.name || 'N/A'],
      ['ÉQUIPE', intervention.squad?.name || 'N/A'],
      ['TECHNICIENS', intervention.assignedTechnicians?.map((t: any) => t.name).join(', ') || 'Non assigné'],
      ['ÉQUIPEMENT', intervention.equipment?.name || 'N/A'],
      ['S/N OU RÉF', intervention.equipment?.serialNumber || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: hexToRgb(brandColor as any) as any, fontSize: 10, halign: 'center' },
    styles: { fontSize: 9, cellPadding: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 120, fillColor: [245, 247, 250] } }
  });

  // Technical Specifications Section (New Array Structure Support)
  let currentY = (doc as any).lastAutoTable.finalY + 30;
  
  const specs = intervention.technicalDetails?.specs || [];

  if (specs.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandColor);
    doc.text('SPÉCIFICATIONS TECHNIQUES & TESTS', margin, currentY);

    autoTable(doc, {
      startY: currentY + 15,
      margin: { left: margin, right: margin },
      head: [['Paramètre', 'Valeur / Résultat']],
      body: specs.map((s: any) => [
        s.label.toUpperCase(),
        String(s.value).toUpperCase()
      ]),
      theme: 'striped',
      headStyles: { fillColor: [100, 100, 100], fontSize: 8, halign: 'center' },
      styles: { fontSize: 8, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 150 } }
    });
    currentY = (doc as any).lastAutoTable.finalY + 30;
  }
  
  if (intervention.report) {
    if (currentY > pageHeight - 150) { doc.addPage(); currentY = margin + 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(brandColor);
    doc.text('COMPTE-RENDU D\'ACTIVITÉ', margin, currentY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    const splitReport = doc.splitTextToSize(intervention.report, pageWidth - margin * 2);
    doc.text(splitReport, margin, currentY + 20);
    currentY += (splitReport.length * 15) + 40;
  }

  // Signature Section
  if (currentY > pageHeight - 150) {
    doc.addPage();
    currentY = margin + 20;
  }

  const sigWidth = 180;
  const sigHeight = 80;
  
  // Signature Box Titles
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33);
  doc.text('Cachet & Signature Technicien', margin, currentY);
  doc.text('Cachet & Signature Client', pageWidth - margin - sigWidth, currentY);

  // Signature Boxes
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY + 10, sigWidth, sigHeight);
  doc.rect(pageWidth - margin - sigWidth, currentY + 10, sigWidth, sigHeight);

  // Add the actual signature if present
  if (intervention.signature) {
    try {
      doc.addImage(intervention.signature, 'PNG', pageWidth - margin - sigWidth + 10, currentY + 15, sigWidth - 20, sigHeight - 20);
    } catch (e) {
      console.warn("Could not add signature image to PDF", e);
    }
  }

  // Footer (Always fixed at bottom)
  const footerY = pageHeight - 70;
  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.setFont('helvetica', 'normal');
  
  // Footer Left: Legal Info
  doc.text(`RC: ${company?.rc || '-'}`, margin, footerY + 20);
  doc.text(`MF: ${company?.mf || '-'}`, margin, footerY + 32);

  // Footer Center: Website & Contact
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandColor);
  doc.text(company?.website || 'www.VELORA.com', pageWidth / 2, footerY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140);
  doc.text(`Généré par VELORA PRO`, pageWidth / 2, footerY + 32, { align: 'center' });

  // Footer Right: Branding
  doc.text(company?.name || '', pageWidth - margin, footerY + 20, { align: 'right' });
  doc.text(`Page 1/1`, pageWidth - margin, footerY + 32, { align: 'right' });

  if (action === 'PREVIEW') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Rapport_${intervention.reference}.pdf`);
  }
}

/**
 * Generate a professional invoice PDF
 */
export async function generateInvoicePDF(invoice: any, company?: any, action: 'SAVE' | 'PREVIEW' = 'SAVE') {
  const doc = new jsPDF('portrait', 'pt', 'A4');
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const brandColor = company?.primaryColor || '#2563eb';
  const rgb = hexToRgb(brandColor);

  // Header with Logo
  try {
    const logoUrl = company?.logo || '/favicon.png';
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    doc.addImage(base64, 'PNG', margin, 30, 80, 40);
  } catch (e) {
    doc.setFontSize(22);
    doc.setTextColor(brandColor);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || 'WAYCON', margin, 55);
  }

  // Company Contact Info next to Header (Right side)
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  const contactText = [
    company?.name || 'VELORA PRO',
    company?.address || '',
    `${company?.city || ''} ${company?.country || ''}`,
    `Tel: ${company?.phone || '-'} | Email: ${company?.email || '-'}`
  ].filter(line => line.trim() !== '');
  
  contactText.forEach((line, i) => {
    doc.text(line, pageWidth - margin, 40 + (i * 12), { align: 'right' });
  });

  // Invoice Number & Dates
  doc.setFontSize(24);
  doc.setTextColor(33);
  doc.setFont('helvetica', 'bold');
  doc.text("FACTURE", margin, 120);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° : ${invoice.number}`, margin, 138);
  doc.text(`Date : ${format(new Date(invoice.date), 'dd/MM/yyyy')}`, margin, 153);
  doc.text(`Échéance : ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}`, margin, 168);

  // Client Info Box (Right Side)
  const clientWidth = 200;
  const clientX = pageWidth - margin - clientWidth;
  const clientY = 110;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandColor);
  doc.text('FACTURÉ À :', clientX, clientY);

  doc.setFontSize(11);
  doc.setTextColor(33);
  doc.text(invoice.client?.name || 'Client Inconnu', clientX, clientY + 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  const clientAddress = doc.splitTextToSize(invoice.client?.address || '', clientWidth);
  doc.text(clientAddress, clientX, clientY + 30);
  doc.text(`${invoice.client?.city || ''}`, clientX, clientY + 30 + (clientAddress.length * 12));

  // Items Table
  autoTable(doc, {
    startY: 200,
    margin: { left: margin, right: margin },
    head: [['DÉSIGNATION', 'UNITÉ', 'QTÉ', 'PRIX UNIT. (DT)', 'TOTAL (DT)']],
    body: invoice.items.map((item: any) => [
      item.description,
      'U',
      item.quantity,
      Number(item.unitPrice).toFixed(2),
      Number(item.totalPrice).toFixed(2)
    ]),
    theme: 'grid',
    headStyles: { fillColor: rgb, fontSize: 9, halign: 'center' },
    styles: { fontSize: 8, cellPadding: 8, font: 'helvetica' },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'center', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 80 },
      4: { halign: 'right', cellWidth: 80, fontStyle: 'bold' }
    }
  });

  // Summary Totals
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  const summaryWidth = 180;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  
  doc.text("TOTAL HT", summaryX, finalY);
  doc.text(`${Number(invoice.totalHT).toFixed(2)} DT`, pageWidth - margin, finalY, { align: 'right' });

  doc.text(`TVA (${Number(invoice.tva)}%)`, summaryX, finalY + 15);
  const taxAmount = Number(invoice.totalTTC) - Number(invoice.totalHT);
  doc.text(`${taxAmount.toFixed(2)} DT`, pageWidth - margin, finalY + 15, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandColor);
  doc.text("TOTAL TTC", summaryX, finalY + 35);
  doc.text(`${Number(invoice.totalTTC).toFixed(2)} DT`, pageWidth - margin, finalY + 35, { align: 'right' });

  // Notes
  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.text("NOTES :", margin, finalY);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2 - summaryWidth - 20);
    doc.text(splitNotes, margin, finalY + 15);
  }

  // Footer
  const footerY = pageHeight - 70;
  doc.setDrawColor(220);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`RC: ${company?.rc || '-'}`, margin, footerY + 20);
  doc.text(`MF: ${company?.mf || '-'}`, margin, footerY + 32);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandColor);
  doc.text(company?.website || 'www.VELORA.com', pageWidth / 2, footerY + 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140);
  doc.text(`Généré par VELORA PRO`, pageWidth / 2, footerY + 32, { align: 'center' });

  doc.text(company?.name || '', pageWidth - margin, footerY + 20, { align: 'right' });
  doc.text(`Document financier certifié`, pageWidth - margin, footerY + 32, { align: 'right' });

  if (action === 'PREVIEW') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Facture_${invoice.number}.pdf`);
  }
}

function hexToRgb(hex: string): [number, number, number] {
  let r = 37, g = 99, b = 235;
  if (hex.startsWith('#')) {
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
  }
  return [r, g, b];
}
