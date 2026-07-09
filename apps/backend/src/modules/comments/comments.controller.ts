import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.commentsService.create({ ...dto, userId: user.id });
  }

  @Get('intervention/:id')
  findByIntervention(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentsService.findByIntervention(+id, user.role);
  }

  @Get('task/:id')
  findByTask(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentsService.findByTask(+id, user.role);
  }
}
