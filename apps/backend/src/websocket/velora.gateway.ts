import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';

/**
 * Real-time WebSocket gateway for VELORA PRO.
 * Handles: notifications, task/intervention status updates, live comments.
 */
@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: any) => {
      const isProd = process.env.NODE_ENV === 'production';

      // Development: allow all localhost and LAN origins
      if (!isProd) {
        if (
          !origin ||
          /https?:\/\/localhost|https?:\/\/127\.0\.0\.1|https?:\/\/192\.168\.|https?:\/\/10\.|https?:\/\/172\./.test(
            origin,
          )
        ) {
          callback(null, true);
          return;
        }
      }

      // Production: only allow explicitly configured origins
      const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim())
        : [];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('WebSocket connection blocked by CORS policy'));
      }
    },
    credentials: true,
  },
  namespace: 'velora',
})

export class VeloraGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(VeloraGateway.name);

  // Map userId → socketId for targeted delivery
  private userSockets: Map<number, string[]> = new Map();

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('🔌 WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        client.data.userId = payload.sub;
        client.data.role = payload.role;

        // Register socket for this user
        const existing = this.userSockets.get(payload.sub) || [];
        this.userSockets.set(payload.sub, [...existing, client.id]);

        // Join personal room
        client.join(`user-${payload.sub}`);
        this.logger.log(
          `Client connected: ${client.id} (userId: ${payload.sub})`,
        );
      }
    } catch (e) {
      this.logger.warn(`Unauthenticated connection: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      const sockets = this.userSockets.get(client.data.userId) || [];
      this.userSockets.set(
        client.data.userId,
        sockets.filter((id) => id !== client.id),
      );
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Event-to-WebSocket Bridges (Targeted via WebsocketListener) ───

  /** Forward notification to specific user */
  handleNotificationCreated(payload: { userId: number; notification: any }) {
    this.logger.log(`Forwarding notification to User ${payload.userId}`);
    this.sendToUser(payload.userId, 'notification', payload.notification);
  }

  /** Broadcast task status change to all connected clients */
  handleTaskStatusChanged(payload: any) {
    this.server.emit('task:status-changed', payload);
  }

  /** Broadcast intervention status change */
  handleInterventionStatusChanged(payload: any) {
    this.server.emit('intervention:status-changed', payload);
  }

  // ─── Client Messages ────────────────────────────────────────────

  /** Client joins a resource room (e.g., intervention:5) for live updates */
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.room);
    return { event: 'joined', room: data.room };
  }

  /** Simulate alert for Phase 4 Demo */
  @SubscribeMessage('simulate-alert')
  handleSimulateAlert(@ConnectedSocket() client: Socket) {
    this.server.emit('notification', {
      title: 'Alerte SLA Critique',
      message:
        'Le serveur Ooredoo (EQ-0012) a dépassé sa GTI (Garantie Temps Intervention).',
      type: 'ERROR',
    });
  }

  /** Emit new comment to room members */
  emitNewComment(room: string, comment: any) {
    this.server.to(room).emit('new-comment', comment);
  }

  /** Send targeted notification */
  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user-${userId}`).emit(event, data);
  }
}
