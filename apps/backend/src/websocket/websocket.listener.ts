import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VeloraGateway } from './velora.gateway';

@Injectable()
export class WebsocketListener {
  private readonly logger = new Logger(WebsocketListener.name);

  constructor(private readonly gateway: VeloraGateway) {}

  @OnEvent('notification.created')
  handleNotificationCreated(payload: { userId: number; notification: any }) {
    this.gateway.handleNotificationCreated(payload);
  }

  @OnEvent('intervention.status.changed')
  handleInterventionStatusChanged(payload: any) {
    this.gateway.handleInterventionStatusChanged(payload);
  }

  @OnEvent('task.status.changed')
  handleTaskStatusChanged(payload: any) {
    this.gateway.handleTaskStatusChanged(payload);
  }

  @OnEvent('user.session.revoked')
  handleUserSessionRevoked(payload: { userId: number }) {
    this.logger.log(
      `Session revoked for User ${payload.userId}, sending force-logout`,
    );
    this.gateway.sendToUser(payload.userId, 'force-logout', {
      message: 'Votre session a été révoquée par un administrateur.',
    });
  }
}
