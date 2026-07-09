import { useState } from 'react';
import { Download, FileText, TableProperties, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';

interface ExportButtonProps {
  data: any[];
  filename: string;
  pdfTargetId?: string; // ID of the HTML table to convert to PDF
}

export function ExportButton({ data, filename, pdfTargetId }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const triggerSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setIsOpen(false);
    }, 2000);
  };

  const exportCSV = () => {
    if (!data || data.length === 0) return;
    setIsExporting(true);
    try {
      const headers = Object.keys(data[0]);
      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const row of data) {
        const values = headers.map(header => {
          const escaped = ('' + row[header]).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!pdfTargetId) {
      alert("L'export PDF n'est pas configuré pour cette table.");
      return;
    }
    
    const target = document.getElementById(pdfTargetId);
    if (!target) return;

    setIsExporting(true);
    try {
      // Dynamic import of jspdf to avoid bloating the main bundle
      const { jsPDF } = await import('jspdf');
      
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);
      triggerSuccess();
    } catch (e) {
      console.error("Erreur PDF:", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting || success}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
          success 
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
            : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
        )}
      >
        {success ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {success ? "Exporté" : "Exporter"}
        {!success && <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen ? "rotate-180" : "")} />}
      </button>

      {isOpen && !success && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full right-0 mt-2 w-48 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 space-y-1">
              <button 
                onClick={exportCSV}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors group"
              >
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <TableProperties className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                Format Excel (CSV)
              </button>
              
              <button 
                onClick={exportPDF}
                disabled={!pdfTargetId}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left text-xs font-medium rounded-xl transition-colors group",
                  pdfTargetId 
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted/50" 
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                </div>
                Format PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
