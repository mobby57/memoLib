/**
 * CollaborationService - Phase 5
 * Gestion commentaires et mentions (@username)
 */

import { PrismaClient } from '@prisma/client';
import { EventLogService } from '../../../lib/services/event-log.service';

interface CreateCommentParams {
  content: string;
  entityType: 'email' | 'dossier' | 'client' | 'document';
  entityId: string;
  authorId: string;
  tenantId: string;
}

interface MentionInfo {
  userId: string;
  username: string;
}

export class CollaborationService {
  private prisma: PrismaClient;
  private eventLogService: EventLogService;

  constructor(prisma?: PrismaClient, eventLogService?: EventLogService) {
    this.prisma = prisma || new PrismaClient();
    this.eventLogService = eventLogService || new EventLogService(this.prisma);
  }

  /**
   * Détecte les mentions @username dans le contenu
   * Format: @john.doe ou @marie
   */
  private async parseMentions(
    content: string,
    tenantId: string
  ): Promise<MentionInfo[]> {
    const mentionRegex = /@([\w.]+)/g;
    const matches = [...content.matchAll(mentionRegex)];

    if (matches.length === 0) {
      return [];
    }

    const usernames = [...new Set(matches.map((m) => m[1]))];

    // Récupérer les users du tenant par email/username
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        OR: usernames.map((username) => ({
          email: { contains: username, mode: 'insensitive' as const },
        })),
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return users.map((u) => ({
      userId: u.id,
      username: u.email.split('@')[0],
    }));
  }

  /**
   * Créer un commentaire avec mentions automatiques
   */
  async createComment(params: CreateCommentParams) {
    const { content, entityType, entityId, authorId, tenantId } = params;

    // Détecter mentions
    const mentions = await this.parseMentions(content, tenantId);

    // Créer commentaire + mentions en transaction
    const comment = await this.prisma.$transaction(async (tx) => {
      // 1. Créer le commentaire
      const newComment = await tx.comment.create({
        data: {
          content,
          entityType,
          entityId,
          authorId,
          tenantId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      // 2. Créer les mentions
      if (mentions.length > 0) {
        await tx.mention.createMany({
          data: mentions.map((m) => ({
            commentId: newComment.id,
            userId: m.userId,
          })),
        });
      }

      // 3. EventLog USER_COMMENTED
      await this.eventLogService.createEventLog({
        tenantId,
        eventType: 'USER_ADDED_COMMENT',
        actorType: 'USER',
        actorId: authorId,
        entityType,
        entityId,
        metadata: {
          commentId: newComment.id,
          content: content.substring(0, 100),
          mentionsCount: mentions.length,
        },
      });

      // 4. EventLog USER_MENTIONED pour chaque mention
      for (const mention of mentions) {
        await this.eventLogService.createEventLog({
          tenantId,
          eventType: 'USER_MENTIONED',
          actorType: 'USER',
          actorId: authorId,
          entityType: 'mention',
          entityId: newComment.id,
          metadata: {
            commentId: newComment.id,
            mentionedUserId: mention.userId,
            mentionedUsername: mention.username,
            entityType,
            entityId,
          },
        });
      }

      return newComment;
    });

    // Récupérer avec mentions
    const commentWithMentions = await this.prisma.comment.findUnique({
      where: { id: comment.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return commentWithMentions;
  }

  /**
   * Récupérer tous les commentaires d'une entité
   */
  async getComments(
    entityType: string,
    entityId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    const { limit = 50, offset = 0 } = options;

    const comments = await this.prisma.comment.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.comment.count({
      where: { entityType, entityId },
    });

    return {
      comments,
      total,
      limit,
      offset,
    };
  }

  /**
   * Récupérer les mentions non lues d'un utilisateur
   */
  async getMyMentions(userId: string, options: { limit?: number } = {}) {
    const { limit = 20 } = options;

    const mentions = await this.prisma.mention.findMany({
      where: {
        userId,
        readAt: null,
      },
      include: {
        comment: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      mentions,
      unreadCount: mentions.length,
    };
  }

  /**
   * Marquer une mention comme lue
   */
  async markMentionAsRead(mentionId: string) {
    return this.prisma.mention.update({
      where: { id: mentionId },
      data: { readAt: new Date() },
    });
  }

  /**
   * Supprimer un commentaire (soft delete possible selon besoin)
   */
  async deleteComment(commentId: string, tenantId: string, userId: string) {
    // Vérifier propriété
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.authorId !== userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    // Delete cascade mentions automatique via Prisma onDelete
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // EventLog
    await this.eventLogService.createEventLog({
      tenantId,
      eventType: 'USER_ADDED_COMMENT',
      actorType: 'USER',
      actorId: userId,
      entityType: 'comment',
      entityId: commentId,
      metadata: {
        action: 'deleted',
        originalEntityType: comment.entityType,
        originalEntityId: comment.entityId,
      },
    });

    return { success: true };
  }

  /**
   * Stats collaboration pour dashboard
   */
  async getCollaborationStats(tenantId: string, entityId?: string) {
    const where = entityId
      ? { tenantId, entityId }
      : { tenantId };

    const [totalComments, totalMentions, recentComments] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.mention.count({
        where: {
          comment: where,
        },
      }),
      this.prisma.comment.findMany({
        where,
        include: {
          author: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      totalComments,
      totalMentions,
      recentComments,
    };
  }
}
