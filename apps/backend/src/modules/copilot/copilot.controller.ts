import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CopilotService } from './copilot.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('copilot')
@UseGuards(JwtAuthGuard)
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('ask')
  async ask(@Body() body: { query: string }, @Request() req) {
    if (!body.query || typeof body.query !== 'string' || body.query.trim().length === 0) {
      return { text: "Que voulez-vous savoir ?" };
    }
    // Cap query length to prevent abuse
    const sanitizedQuery = body.query.trim().slice(0, 500);
    const tenantId: number | undefined = req.tenantId;

    return this.copilotService.processQuery(sanitizedQuery, req.user, tenantId);
  }
}
