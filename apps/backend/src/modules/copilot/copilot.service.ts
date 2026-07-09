import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InterventionStatus, TaskStatus, PurchaseRequestStatus } from '@prisma/client';

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processQuery(query: string, user: any, tenantId?: number): Promise<{ text: string; suggestions?: string[] }> {
    const q = query.toLowerCase().trim();

    // Build tenant isolation filter — always scope queries to the user's active tenant
    const tenantFilter = tenantId ? { tenantId } : {};

    try {
      // 1. GREETINGS
      if (q.match(/^(bonjour|salut|coucou|hello|hi)/)) {
        return {
          text: `Bonjour **${user.name}** ! Je suis Velora, votre assistant intelligent. Comment puis-je vous aider aujourd'hui ?`,
          suggestions: ["Combien d'interventions en attente ?", "Voir mes tâches", "Quels sont les achats en cours ?"],
        };
      }

      // 2. INTERVENTIONS (Counts & Status)
      if (q.includes('intervention') || q.includes('ticket')) {
        if (q.includes('combien') || q.includes('nombre')) {
          const total = await this.prisma.intervention.count({ where: { ...tenantFilter } });
          const enAttente = await this.prisma.intervention.count({
            where: { status: InterventionStatus.DEMANDE, ...tenantFilter },
          });
          const enCours = await this.prisma.intervention.count({
            where: { status: InterventionStatus.EN_COURS, ...tenantFilter },
          });

          return {
            text: `Il y a actuellement **${total} interventions** dans le système.\n\n- 🔴 **${enAttente}** en attente\n- 🔵 **${enCours}** en cours de traitement.`,
            suggestions: ["Voir les interventions", "Créer une intervention"],
          };
        }
      }

      // 3. PURCHASES (Demandes d'achat)
      if (q.includes('achat') || q.includes('commande') || q.includes('budget')) {
        const pendingPurchases = await this.prisma.purchaseRequest.findMany({
          where: {
            status: { in: [PurchaseRequestStatus.SOUMISE, PurchaseRequestStatus.VALIDEE_COMMERCIAL] },
            ...tenantFilter,
          },
          include: { requestedBy: true },
          take: 3,
        });
        const total = await this.prisma.purchaseRequest.count({
          where: {
            status: { in: [PurchaseRequestStatus.SOUMISE, PurchaseRequestStatus.VALIDEE_COMMERCIAL] },
            ...tenantFilter,
          },
        });

        if (total === 0) {
          return {
            text: "Il n'y a aucune demande d'achat en attente de validation. Tout est à jour !",
            suggestions: ["Créer une demande d'achat", "Voir l'inventaire"],
          };
        }

        let response = `Vous avez **${total} demandes d'achat** en attente d'approbation.\n\nVoici les plus récentes :\n`;
        pendingPurchases.forEach(p => {
          response += `- **${p.title}** (${Number(p.estimatedCost)} DT) - par ${p.requestedBy.name}\n`;
        });

        return {
          text: response,
          suggestions: ["Aller aux achats", "Valider les achats"],
        };
      }

      // 4. INVENTORY / SUPPLIES
      if (q.includes('stock') || q.includes('fourniture') || q.includes('inventaire')) {
        const allSupplies = await this.prisma.officeSupply.findMany({
          where: { ...tenantFilter },
        });
        const lowStock = allSupplies.filter(s => s.currentStock <= (s.minStock || 0)).slice(0, 5);

        if (lowStock.length === 0) {
          return {
            text: "Tous les stocks de fournitures sont au-dessus de leur seuil d'alerte. 🟢",
            suggestions: ["Voir les moyens généraux"],
          };
        }

        let response = "⚠️ **Alerte Stock !** Les articles suivants sont presque épuisés :\n\n";
        lowStock.forEach(s => {
          response += `- **${s.name}** (Reste : ${s.currentStock} ${s.unit})\n`;
        });

        return {
          text: response,
          suggestions: ["Commander", "Moyens Généraux"],
        };
      }

      // 5. PROJECTS / TASKS
      if (q.includes('tâche') || q.includes('projet')) {
        const myTasks = await this.prisma.task.count({
          where: {
            assignedTechnicians: { some: { id: user.id } },
            status: { not: TaskStatus.TERMINE },
            ...tenantFilter,
          },
        });

        if (myTasks > 0) {
          return {
            text: `Vous avez **${myTasks} tâches en cours** qui vous sont assignées.\nVous devriez y jeter un œil pour avancer sur vos projets !`,
            suggestions: ["Voir mes tâches", "Planning"],
          };
        } else {
          return {
            text: "Vous n'avez aucune tâche active assignée pour le moment. Beau travail ! 🎉",
            suggestions: ["Voir les projets", "Rechercher des interventions"],
          };
        }
      }

      // FALLBACK
      return {
        text: `Je suis désolé, je n'ai pas bien compris. \nPour l'instant, je peux vous donner un résumé sur :\n- Les **Interventions**\n- Les **Achats en attente**\n- Vos **Tâches**\n- L'état des **Stocks**.\n\nQue souhaitez-vous savoir ?`,
        suggestions: ["Bilan des interventions", "Stocks bas", "Mes tâches"],
      };

    } catch (error) {
      this.logger.error(`Erreur Copilot: ${error.message}`);
      return {
        text: "Oups ! Une erreur interne s'est produite lors de la lecture de la base de données. Veuillez réessayer.",
      };
    }
  }
}
