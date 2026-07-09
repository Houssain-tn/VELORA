import { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2, Receipt, Calendar, User } from 'lucide-react';
import { useCompanies, useCreateInvoice, useUpdateInvoice, useUpdateIntervention } from '@/hooks/useApi';
import { toast } from '@/components/ui/Toaster';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any;
  intervention?: any;
}

export function InvoiceModal({ isOpen, onClose, invoice, intervention }: InvoiceModalProps) {
  const { data: companies } = useCompanies();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const updateIntervention = useUpdateIntervention();

  const [formData, setFormData] = useState({
    number: '',
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'BROUILLON',
    notes: '',
    tva: 19,
    items: [{ description: '', quantity: 1, unitPrice: 0 }]
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        number: invoice.number || '',
        clientId: invoice.clientId?.toString() || '',
        date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : '',
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        status: invoice.status || 'BROUILLON',
        notes: invoice.notes || '',
        tva: Number(invoice.tva) || 19,
        items: invoice.items?.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice)
        })) || [{ description: '', quantity: 1, unitPrice: 0 }]
      });
    } else if (intervention) {
      const isArray = Array.isArray(intervention);
      const first = isArray ? intervention[0] : intervention;
      
      setFormData({
        number: `FACT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        clientId: first.site?.contract?.client?.id?.toString() || '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'BROUILLON',
        notes: isArray 
          ? `Facturation groupée pour ${intervention.length} interventions: ${intervention.map((i: any) => i.reference).join(', ')}`
          : `Facturation pour intervention ${intervention.reference}: ${intervention.title}`,
        tva: 19,
        items: isArray 
          ? intervention.map((i: any) => ({
              description: `Intervention technique - ${i.title} (${i.reference})`,
              quantity: 1,
              unitPrice: 0
            }))
          : [{ 
              description: `Intervention technique - ${intervention.title} (${intervention.reference})`, 
              quantity: 1, 
              unitPrice: 0 
            }]
      });
    }
  }, [invoice, intervention, isOpen]);

  if (!isOpen) return null;

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const newValue = (field === 'quantity' || field === 'unitPrice') ? parseFloat(value) || 0 : value;
    newItems[index] = { ...newItems[index], [field]: newValue };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * (formData.tva / 100);
    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const { subtotal, tax, total } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) return toast.error('Veuillez sélectionner un client');

    const payload = {
      ...formData,
      totalHT: subtotal,
      totalTTC: total,
    };

    try {
      if (invoice) {
        await updateInvoice.mutateAsync({ id: invoice.id, data: payload });
        toast.success('Facture mise à jour');
      } else {
        const response = await createInvoice.mutateAsync(payload);
        const newInvoiceId = (response as any).data?.id;

        // Link with intervention(s) if provided
        if (intervention && newInvoiceId) {
          const interventionsToUpdate = Array.isArray(intervention) ? intervention : [intervention];
          
          await Promise.all(interventionsToUpdate.map((inv: any) => 
            updateIntervention.mutateAsync({ 
              id: inv.id, 
              data: { invoiceId: newInvoiceId } 
            })
          ));
        }
        
        toast.success(Array.isArray(intervention) ? 'Facture groupée générée' : 'Facture générée');
      }
      onClose();
    } catch (err) {
      toast.error("Erreur d'enregistrement");
    }
  };

  const isPending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl my-auto rounded-2xl shadow-2xl border-2 border-primary/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">
              {invoice ? `Édition Facture ${invoice.number}` : "Génération de Facture"}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
          {/* Top Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Client</label>
              <div className="relative">
                <select
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all appearance-none"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                >
                  <option value="">Sélectionner un client</option>
                  {companies?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <User className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">N° de Facture</label>
              <input
                className="w-full px-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                placeholder="Auto-généré si vide"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date d'émission</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date d'échéance</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-bold transition-all"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Articles / Services</h4>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
              </button>
            </div>

            <div className="border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Désignation</th>
                    <th className="px-4 py-3 text-center w-24">Quantité</th>
                    <th className="px-4 py-3 text-right w-40">Prix Unitaire (DT)</th>
                    <th className="px-4 py-3 text-right w-40">Total (DT)</th>
                    <th className="px-4 py-3 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {formData.items.map((item, index) => (
                    <tr key={index} className="group hover:bg-muted/10 transition-colors">
                      <td className="p-2">
                        <input
                          required
                          className="w-full px-3 py-2 bg-transparent outline-none font-medium placeholder:font-normal"
                          placeholder="ex: Changement cable reseau"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          required
                          className="w-full px-3 py-2 bg-transparent outline-none text-center font-bold"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          required
                          className="w-full px-3 py-2 bg-transparent outline-none text-right font-bold"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-2 text-right font-black text-primary">
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Section */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 w-full space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notes / Conditions de règlement</label>
                <textarea
                  className="w-full px-4 py-3 bg-muted/20 border border-border/50 rounded-xl focus:ring-2 ring-primary/20 outline-none text-sm font-medium transition-all h-24 resize-none"
                  placeholder="ex: Paiement par virement bancaire sous 30 jours..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="w-full md:w-80 bg-muted/30 p-6 rounded-2xl space-y-4 border">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Sous-Total HT</span>
                <span className="font-black">{subtotal.toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">TVA</span>
                  <select
                    className="bg-background border rounded px-1 text-[10px] font-bold outline-none"
                    value={formData.tva}
                    onChange={(e) => setFormData({ ...formData, tva: Number(e.target.value) })}
                  >
                    <option value={7}>7%</option>
                    <option value={13}>13%</option>
                    <option value={19}>19%</option>
                  </select>
                </div>
                <span className="font-black text-muted-foreground">{tax.toFixed(2)} DT</span>
              </div>
              <div className="pt-4 border-t-2 border-dashed border-border/50 flex justify-between items-center">
                <span className="font-black uppercase text-xs tracking-tighter">Total TTC</span>
                <span className="text-2xl font-black text-primary">{total.toFixed(2)} DT</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-dashed">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-[2] py-3.5 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {invoice ? "Mettre à jour" : "Générer la Facture"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
