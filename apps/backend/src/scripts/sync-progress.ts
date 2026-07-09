import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function sync() {
  console.log('Démarrage de la synchronisation globale...');

  const phases = await prisma.phase.findMany({
    select: { id: true, projectId: true },
  });

  for (const phase of phases) {
    const tasks = await prisma.task.findMany({
      where: { phaseId: phase.id, status: { not: 'ANNULE' } },
      select: { status: true },
    });

    const totalPhase = tasks.length;
    const donePhase = tasks.filter(
      (t) => (t.status as any) === 'TERMINE',
    ).length;
    const phaseProgress =
      totalPhase > 0 ? Math.round((donePhase / totalPhase) * 100) : 0;

    await prisma.phase.update({
      where: { id: phase.id },
      data: { progress: phaseProgress },
    });
  }

  const projects = await prisma.project.findMany({ select: { id: true } });
  for (const project of projects) {
    const projectTasks = await prisma.task.findMany({
      where: { phase: { projectId: project.id }, status: { not: 'ANNULE' } },
      select: { status: true },
    });

    const totalProject = projectTasks.length;
    const doneProject = projectTasks.filter(
      (t) => (t.status as any) === 'TERMINE',
    ).length;
    const projectProgress =
      totalProject > 0 ? Math.round((doneProject / totalProject) * 100) : 0;

    await prisma.project.update({
      where: { id: project.id },
      data: { progress: projectProgress },
    });
  }

  console.log('Synchronisation terminée avec succès.');
}

sync()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
