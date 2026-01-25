import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notifications';

// GET - Recuperer les evenements du calendrier
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const userId = searchParams.get('userId');
    const dossierId = searchParams.get('dossierId');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const where: Record<string, unknown> = { tenantId };

    if (userId) where.userId = userId;
    if (dossierId) where.dossierId = dossierId;
    if (clientId) where.clientId = clientId;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) (where.startDate as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.startDate as Record<string, Date>).lte = new Date(endDate);
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        dossier: { select: { numero: true, typeDossier: true } },
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Erreur GET calendar:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Creer un evenement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      userId,
      dossierId,
      clientId,
      title,
      description,
      location,
      startDate,
      endDate,
      allDay = false,
      type = 'rdv',
      status = 'confirmed',
      reminders,
      isRecurring = false,
      recurrenceRule,
    } = body;

    if (!tenantId || !userId || !title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'tenantId, userId, title, startDate et endDate requis' },
        { status: 400 }
      );
    }

    const event = await prisma.calendarEvent.create({
      data: {
        tenantId,
        userId,
        dossierId,
        clientId,
        title,
        description,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay,
        type,
        status,
        reminders: reminders ? JSON.stringify(reminders) : null,
        isRecurring,
        recurrenceRule,
      },
      include: {
        user: { select: { name: true, email: true } },
        dossier: { select: { numero: true } },
        client: { select: { firstName: true, lastName: true } },
      },
    });

    // Planifier les rappels si demande
    if (reminders && Array.isArray(reminders)) {
      await scheduleReminders(event.id, userId, title, new Date(startDate), reminders);
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Erreur POST calendar:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre a jour un evenement
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, ...updateData } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId requis' }, { status: 400 });
    }

    // Convertir les dates si presentes
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.reminders) updateData.reminders = JSON.stringify(updateData.reminders);

    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } },
        dossier: { select: { numero: true } },
        client: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Erreur PATCH calendar:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un evenement
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId requis' }, { status: 400 });
    }

    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE calendar:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Planifier des rappels pour un evenement
async function scheduleReminders(
  eventId: string,
  userId: string,
  title: string,
  eventDate: Date,
  reminders: Array<{ minutes: number; type: string }>
) {
  for (const reminder of reminders) {
    const reminderDate = new Date(eventDate.getTime() - reminder.minutes * 60 * 1000);
    
    // Si le rappel est dans le futur, le planifier
    if (reminderDate > new Date()) {
      const delay = reminderDate.getTime() - Date.now();
      
      // Pour les rappels a court terme, utiliser setTimeout
      // Pour les rappels a long terme, utiliser une tache planifiee (cron)
      if (delay < 24 * 60 * 60 * 1000) { // Moins de 24h
        setTimeout(async () => {
          try {
            await NotificationService.deadlineApproaching(userId, {
              title,
              date: eventDate,
              type: 'calendar',
              id: eventId,
            });
          } catch (error) {
            console.error('Erreur envoi rappel:', error);
          }
        }, delay);
      }
    }
  }
}
