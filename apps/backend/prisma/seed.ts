import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Main Seed Function to initialize the database with professional test data
async function main() {
  console.log('🌱 Début du seed de la base de données...');

  // 1. Create Companies
  const waycon = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Waycon Mediterranée',
      address: 'Av. Yasser Arafat, Imm. Narjess, Sahloul 1, 4054, Sousse, Tunisie',
      email: 'contact@waycon.com',
      phone: '+216 73 820 747',
    },
  });

  const communeSousse = await prisma.company.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Commune de Sousse',
      address: 'Sousse, Tunisie',
      email: 'contact@commune-sousse.tn',
    },
  });

  // 2. Create Users
  const hashedAdminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@waycon.com' },
    update: {
      password: hashedAdminPassword,
      name: 'Admin Waycon',
      role: Role.SUPER_ADMIN,
    },
    create: {
      name: 'Admin Waycon',
      email: 'admin@waycon.com',
      password: hashedAdminPassword,
      role: Role.SUPER_ADMIN,
      companyId: waycon.id,
    },
  });

  const hashedTechPassword = await bcrypt.hash('Tech@123', 10);
  const technicien = await prisma.user.upsert({
    where: { email: 'tech@waycon.com' },
    update: {
      password: hashedTechPassword,
      name: 'Ahmed Technicien',
      role: Role.TECHNICIEN,
    },
    create: {
      name: 'Ahmed Technicien',
      email: 'tech@waycon.com',
      password: hashedTechPassword,
      role: Role.TECHNICIEN,
      companyId: waycon.id,
    },
  });

  const hashedClientPassword = await bcrypt.hash('Client@123', 10);
  const client = await prisma.user.upsert({
    where: { email: 'client@commune-sousse.tn' },
    update: {
      password: hashedClientPassword,
      name: 'Responsable Sousse',
      role: Role.CLIENT,
    },
    create: {
      name: 'Responsable Sousse',
      email: 'client@commune-sousse.tn',
      password: hashedClientPassword,
      role: Role.CLIENT,
      companyId: communeSousse.id,
    },
  });

  // 3. Create Contract
  const contract = await prisma.contract.upsert({
    where: { reference: 'CTR-2026-001' },
    update: {},
    create: {
      name: 'Maintenance Eclairage Public',
      reference: 'CTR-2026-001',
      clientId: communeSousse.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      slaHours: 24,
      status: 'ACTIF',
    },
  });

  // 4. Create Site
  const site = await prisma.site.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Hôtel de Ville Sousse',
      city: 'Sousse',
      type: 'BATIMENT',
      contractId: contract.id,
      managerId: admin.id,
    },
  });

  // 5. Create Equipment
  const equipment = await prisma.equipment.upsert({
    where: { qrCode: 'QR-HVAC-01' },
    update: {},
    create: {
      name: 'Climatiseur Central',
      type: 'HVAC',
      brand: 'Samsung',
      model: 'XYZ-2000',
      serialNumber: 'SN-001234',
      qrCode: 'QR-HVAC-01',
      status: 'OPERATIONNEL',
      siteId: site.id,
    },
  });

  // 6. Create Task / Project / Phase
  const project = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Déploiement Fibre Optique',
      contractId: contract.id,
      managerId: admin.id,
    },
  });

  // 7. Create Intervention
  await prisma.intervention.upsert({
    where: { reference: 'INT-2026-001' },
    update: {},
    create: {
      title: 'Vérification Climatisation',
      reference: 'INT-2026-001',
      type: 'MAINTENANCE_PREVENTIVE',
      status: 'DEMANDE',
      siteId: site.id,
      equipmentId: equipment.id,
      requestedById: client.id,
    },
  });

  // 8. Create Phase & Tasks
  const phase = await prisma.phase.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Phase Initiale',
      projectId: project.id,
      order: 1,
    }
  });

  await prisma.task.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Tirage de Câbles',
      description: 'Déploiement du câblage vertical dans les colonnes montantes.',
      status: 'EN_COURS',
      priority: 'HAUTE',
      siteId: site.id,
      phaseId: phase.id,
      createdById: admin.id,
      assignedTechnicians: {
        connect: [{ id: technicien.id }, { id: admin.id }]
      }
    }
  });

  await prisma.task.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: 'Configuration Switch',
      description: 'Paramétrage des VLANs et du routage inter-VLAN.',
      status: 'A_FAIRE',
      priority: 'NORMALE',
      siteId: site.id,
      phaseId: phase.id,
      createdById: admin.id,
      assignedTechnicians: {
        connect: [{ id: technicien.id }]
      }
    }
  });

  // 9. ERP Models Seed (Moyens Généraux & Workflows)
  // 9a. Suppliers
  const supplier = await prisma.supplier.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Propreté Plus SARL',
      type: 'NETTOYAGE',
      contactName: 'Riadh Souissi',
      phone: '+216 73 234 567',
      email: 'proprete.plus@gmail.com',
      address: 'Zone Industrielle Sousse',
      rating: 4.5,
      contractStatus: 'ACTIF',
      contractExpiry: new Date('2026-12-31'),
      monthlyBudget: 2500,
    },
  });

  // 9b. Office Supplies
  const supply = await prisma.officeSupply.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Papier A4 (Ramette 80g)',
      category: 'Bureautique',
      currentStock: 48,
      minStock: 20,
      unit: 'Ramettes',
      unitCost: 8.5,
      lastOrderDate: new Date('2026-05-30'),
    },
  });

  // 9c. Company Spaces
  const space = await prisma.companySpace.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Salle Réunion R201',
      type: 'SALLE_REUNION',
      capacity: 15,
      floor: '2ème',
      status: 'DISPONIBLE',
      siteId: site.id,
    },
  });

  // 9d. Service Requests
  const serviceReq = await prisma.serviceRequest.upsert({
    where: { id: 1 },
    update: {},
    create: {
      reference: 'MG-2026-0045',
      title: 'Nettoyage urgent',
      description: 'Suite à une réunion client',
      category: 'NETTOYAGE',
      status: 'RESOLU',
      priority: 'HAUTE',
      requestedBy: client.name,
      department: 'Direction Commerciale',
      location: 'Salle R201',
      assignedTo: supplier.name,
      estimatedCost: 150,
      resolvedAt: new Date(),
    },
  });

  // 9e. Purchase Requests (Workflow)
  const purchase = await prisma.purchaseRequest.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Nouveaux PC Portables Equipe Dev',
      description: 'Besoin de 5 PC portables pour les nouvelles recrues.',
      justification: 'Recrutement prévu en Juillet',
      estimatedCost: 15000,
      priority: 'HAUTE',
      status: 'SOUMISE',
      requestedById: admin.id,
      projectId: project.id,
      siteId: site.id,
    },
  });

  console.log('✅ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
