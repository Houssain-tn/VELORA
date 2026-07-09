import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

export const generateMeetingPdf = (meeting: any, action: 'download' | 'preview' = 'download') => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // --- Header ---
  doc.setFillColor(30, 58, 138); // Deep Blue (Waycon style)
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo Placeholder / Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('WAYCON', 15, 25);
  
  // Company Details (Header Right)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Waycon Mediterrannée', pageWidth - 15, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Av. Yasser Arafat, Imm. Narjess, Sahloul 1, 4054, Sousse, Tunisie', pageWidth - 15, 20, { align: 'right' });
  doc.text('Tel: +216 73 820 747 | Email: contact@waycon.com', pageWidth - 15, 25, { align: 'right' });

  // --- Document Title ---
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PROCÈS-VERBAL DE RÉUNION', pageWidth / 2, 40, { align: 'center' });

  // --- Section: General Info ---
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS GÉNÉRALES', 15, 55);
  doc.line(15, 57, 80, 57);

  autoTable(doc, {
    startY: 62,
    theme: 'grid',
    body: [
      ['Objet', meeting.title, 'Status', meeting.status || 'PROGRAMMÉE'],
      ['Date', meeting.startTime ? format(new Date(meeting.startTime), 'dd MMMM yyyy HH:mm', { locale: fr }) : 'N/A', 'Type', meeting.type || 'INTERNE'],
      ['Lieu', meeting.location || meeting.videoLink || 'N/A', 'Client', meeting.client?.name || 'Waycon Team'],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 30 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 30 },
      3: { cellWidth: 60 },
    },
    margin: { left: 15, right: 15 }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- Section: Participants ---
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTE DES PARTICIPANTS', 15, currentY);
  doc.line(15, currentY + 2, 80, currentY + 2);

  const participants = meeting.participants?.map((p: any) => [p.name || 'Inconnu', p.email || '-', 'Présent']) || [];
  
  autoTable(doc, {
    startY: currentY + 7,
    head: [['Nom / Prénom', 'Contact', 'Statut']],
    body: participants,
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 138] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 15, right: 15 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- Section: Notes & Déroulement ---
  if (meeting.notes) {
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉROULEMENT ET DISCUSSION', 15, currentY);
    doc.line(15, currentY + 2, 80, currentY + 2);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(meeting.notes, pageWidth - 30);
    doc.text(splitNotes, 15, currentY + 10);

    currentY += (splitNotes.length * 5) + 20;
  }

  // --- Section: Conclusions & Décisions ---
  if (meeting.conclusion) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 30;
    }

    doc.setFillColor(245, 245, 245);
    doc.rect(15, currentY, pageWidth - 30, 40, 'F');

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCLUSIONS ET ACTIONS À MENER', 20, currentY + 10);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    const splitConclusion = doc.splitTextToSize(meeting.conclusion, pageWidth - 40);
    doc.text(splitConclusion, 20, currentY + 20);

    currentY += 50;
  }

  // --- Signatures ---
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 30;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Signature Responsable Waycon', 15, currentY);
  doc.text('Signature / Cachet Client', pageWidth - 15, currentY, { align: 'right' });

  doc.setDrawColor(200, 200, 200);
  doc.rect(15, currentY + 5, 60, 30); // Waycon
  doc.rect(pageWidth - 75, currentY + 5, 60, 30); // Client

  // --- Footer ---
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Waycon Mediterrannée SARL - VELORA PRO Document Certifié', pageWidth / 2, pageHeight - 15, { align: 'center' });

  // Save or Preview the PDF
  if (action === 'preview') {
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`PV_Réunion_${meeting.id}.pdf`);
  }
};
