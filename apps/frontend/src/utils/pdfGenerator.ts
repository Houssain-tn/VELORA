import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import wayconLogo from '@/assets/Logos/Waycon_logo.png';

// Helper function to load an image from a URL/Path as an HTMLImageElement
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
}

// Format cost using spaces as thousands separators and comma for decimals
// Produces clean format like "1 250,000 DT" without causing PDF rendering slashes
export function formatCurrency(value: any): string {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';
  const num = Number(value);
  const parts = num.toFixed(3).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${parts[0]},${parts[1]} DT`;
}

export async function generatePurchaseRequestPDF(request: any, action: 'download' | 'preview' = 'download') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Color Palette
  const colors = {
    primary: [30, 41, 59], // Dark Slate #1e293b
    accent: [59, 130, 246], // Deep Blue #3b82f6
    grayDark: [71, 85, 105], // Slate 600
    grayLight: [248, 250, 252], // Slate 50
    border: [226, 232, 240], // Border Slate 200
    success: [16, 185, 129], // Emerald 500
    text: [30, 41, 59]
  };

  // --- HEADER SECTION ---
  // Background decorative accents
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, 210, 10, 'F'); // Top colored bar

  // Load and Add WAYCON Logo Image
  let logoLoaded = false;
  try {
    const logoImg = await loadImage(wayconLogo);
    const originalWidth = logoImg.width;
    const originalHeight = logoImg.height;
    const targetHeight = 12; // Height in mm
    const targetWidth = (originalWidth / originalHeight) * targetHeight;
    doc.addImage(logoImg, 'PNG', 15, 13, targetWidth, targetHeight);
    logoLoaded = true;
  } catch (err) {
    console.error("Failed to load Waycon logo image", err);
  }

  // Fallback to text branding if image fails to load
  if (!logoLoaded) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.text('WAYCON', 15, 23);
  }

  // Document Title (Centered horizontally, bold and clear)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("DEMANDE D'ENGAGEMENT DE DEPENSE", 110, 22, { align: 'center' });

  // Divider Line
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.5);
  doc.line(15, 32, 195, 32);

  // --- DOCUMENT METADATA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(`RÉFÉRENCE : #PR-${request.id}`, 15, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(colors.grayDark[0], colors.grayDark[1], colors.grayDark[2]);
  
  const dateStr = new Date(request.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  doc.text(`Date d'émission : ${dateStr}`, 15, 45);
  
  // Status tag badge
  const statusLabels: Record<string, string> = {
    SOUMISE: 'SOUMISE - EN ATTENTE',
    VALIDEE_COMMERCIAL: 'VALIDÉE COMMERCIAL',
    VALIDEE_DIRECTEUR: 'VALIDÉE DIRECTION',
    EN_COURS_ACHAT: 'EN COURS D\'ACHAT',
    TERMINEE: 'LIVRÉE / TERMINÉE',
    REJETEE: 'REJETÉE'
  };
  const currentStatus = statusLabels[request.status] || request.status;
  doc.setFont('helvetica', 'bold');
  doc.text(`Statut actuel : ${currentStatus}`, 15, 50);

  // --- BLOCKS: DEMANDEUR / INFORMATION ---
  // Requester Box (Left Column)
  doc.setFillColor(colors.grayLight[0], colors.grayLight[1], colors.grayLight[2]);
  doc.rect(15, 56, 85, 32, 'F');
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.rect(15, 56, 85, 32, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.text('DEMANDEUR', 20, 62);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(request.requestedBy?.name || 'N/A', 20, 68);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.grayDark[0], colors.grayDark[1], colors.grayDark[2]);
  doc.text(`Rôle : ${request.requestedBy?.role || 'N/A'}`, 20, 73);
  doc.text(`Email : ${request.requestedBy?.email || 'N/A'}`, 20, 78);

  // Operations/Project Context (Right Column)
  doc.setFillColor(colors.grayLight[0], colors.grayLight[1], colors.grayLight[2]);
  doc.rect(110, 56, 85, 32, 'F');
  doc.rect(110, 56, 85, 32, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.text('AFFECTATION ET URGENCE', 115, 62);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(`Projet : ${request.project?.name || 'Non spécifié'}`, 115, 68);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.grayDark[0], colors.grayDark[1], colors.grayDark[2]);
  doc.text(`Site / Localisation : ${request.site?.name || 'Non spécifié'}`, 115, 73);
  
  const priorityColors: Record<string, string> = {
    URGENTE: 'URGENTE',
    HAUTE: 'HAUTE',
    NORMALE: 'NORMALE',
    FAIBLE: 'BASSE'
  };
  doc.setFont('helvetica', 'bold');
  doc.text(`Priorité : ${priorityColors[request.priority] || 'NORMALE'}`, 115, 81);

  // --- DETAILS TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('DÉTAILS ET DESCRIPTIF DE LA DEMANDE', 15, 95);

  // Grid / Description content as autotable
  const estimatedVal = formatCurrency(request.estimatedCost);
  const actualVal = formatCurrency(request.actualCost);

  const tableBody = [
    ['Objet de la Demande', request.title],
    ['Descriptif Technique / Matériaux', request.description || 'Aucune description fournie.'],
    ['Justification Opérationnelle', request.justification || 'Aucune justification fournie.'],
    ['Coût Estimatif Global', estimatedVal]
  ];

  if (request.status === 'TERMINEE' && request.actualCost) {
    tableBody.push(['Coût Réel d\'Achat', actualVal]);
    
    const deviation = Number(request.actualCost) - Number(request.estimatedCost || 0);
    const deviationStr = deviation <= 0 
      ? `Économie de ${formatCurrency(Math.abs(deviation))}`
      : `Dépassement de ${formatCurrency(deviation)}`;
    tableBody.push(['Écart / Différence', deviationStr]);
  }

  autoTable(doc, {
    startY: 99,
    margin: { left: 15, right: 15 },
    head: [['Rubrique / Caractéristique', 'Informations Détaillées']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: colors.primary as any,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: colors.primary as any },
      1: { cellWidth: 'auto', textColor: colors.grayDark as any }
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: 'top',
      lineColor: colors.border as any,
      lineWidth: 0.1
    }
  });

  // --- SIGNATURES GRID ---
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text('VALIDATIONS ET CIRCUITS DE SIGNATURE', 15, finalY);

  const sigBoxY = finalY + 4;
  const sigBoxWidth = 57;
  const sigBoxHeight = 65; // Increased to 65 for a clear 4cm blank signing space below the text

  // Shared signature box drawing helper
  function drawSignatureBox(
    title: string,
    name: string,
    statusText: string,
    dateText: string,
    x: number,
    y: number,
    width: number,
    height: number,
    isValidated: boolean
  ) {
    // Fill background
    doc.setFillColor(colors.grayLight[0], colors.grayLight[1], colors.grayLight[2]);
    doc.rect(x, y, width, height, 'F');
    
    // Draw outer border
    if (isValidated) {
      doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
    } else {
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    }
    doc.setLineWidth(0.4);
    doc.rect(x, y, width, height, 'S');

    // Box Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    if (isValidated) {
      doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
    } else {
      doc.setTextColor(colors.grayDark[0], colors.grayDark[1], colors.grayDark[2]);
    }
    doc.text(title, x + 4, y + 6);

    // Left Column Info (Name, Status, Date)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    
    // Full width display name (supports up to 28 characters now)
    const displayName = name.length > 28 ? name.substring(0, 26) + '..' : name;
    doc.text(displayName, x + 4, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(colors.grayDark[0], colors.grayDark[1], colors.grayDark[2]);
    doc.text(`Statut : ${statusText}`, x + 4, y + 17);
    doc.text(`Date : ${dateText}`, x + 4, y + 22);

    // Signature solid line placeholder at the very bottom (leaving ~4cm blank space above it)
    if (isValidated) {
      doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
    } else {
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    }
    doc.setLineWidth(0.3);
    doc.line(x + 4, y + 61, x + width - 4, y + 61);
  }

  // 1. Demandeur Signature Box
  drawSignatureBox(
    '1. DEMANDEUR',
    request.requestedBy?.name || 'N/A',
    'SOUMISE',
    new Date(request.createdAt).toLocaleDateString('fr-FR'),
    15,
    sigBoxY,
    sigBoxWidth,
    sigBoxHeight,
    true
  );

  // 2. Commercial Signature Box
  const isCommVal = ['VALIDEE_COMMERCIAL', 'VALIDEE_DIRECTEUR', 'EN_COURS_ACHAT', 'TERMINEE'].includes(request.status);
  const commDateText = isCommVal ? new Date(request.updatedAt).toLocaleDateString('fr-FR') : '--/--/----';
  drawSignatureBox(
    '2. COMMERCIAL',
    request.commercialValidator?.name || 'En attente...',
    isCommVal ? 'VALIDÉE' : 'EN ATTENTE',
    commDateText,
    76,
    sigBoxY,
    sigBoxWidth,
    sigBoxHeight,
    isCommVal
  );

  // 3. Directeur Signature Box
  const isDirVal = ['VALIDEE_DIRECTEUR', 'EN_COURS_ACHAT', 'TERMINEE'].includes(request.status);
  const dirDateText = isDirVal ? new Date(request.updatedAt).toLocaleDateString('fr-FR') : '--/--/----';
  drawSignatureBox(
    '3. DIRECTEUR',
    request.directorValidator?.name || 'En attente...',
    isDirVal ? 'APPROUVÉE' : 'EN ATTENTE',
    dirDateText,
    138,
    sigBoxY,
    sigBoxWidth,
    sigBoxHeight,
    isDirVal
  );

  // Save or preview the PDF document
  if (action === 'preview') {
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`Bon_Engagement_PR_${request.id}.pdf`);
  }
}
