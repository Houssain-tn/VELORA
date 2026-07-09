import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/constants/permissions';

@Controller('meetings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @Permissions(Permission.MEETING_CREATE)
  create(@Body() createMeetingDto: CreateMeetingDto, @Request() req) {
    return this.meetingsService.create(
      createMeetingDto,
      req.user.id,
      req.user.role,
    );
  }

  @Get()
  @Permissions(Permission.MEETING_READ)
  findAll(@Request() req) {
    return this.meetingsService.findAll(req.user);
  }

  @Get(':id')
  @Permissions(Permission.MEETING_READ)
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.meetingsService.findOne(id, req.user);
  }

  @Patch(':id')
  @Permissions(Permission.MEETING_MANAGE)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMeetingDto: UpdateMeetingDto,
    @Request() req,
  ) {
    return this.meetingsService.update(id, updateMeetingDto, req.user);
  }

  @Post(':id/convert-to-task')
  @Permissions(Permission.MEETING_MANAGE)
  convertToTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { noteContent: string },
    @Request() req,
  ) {
    return this.meetingsService.convertToTask(
      id,
      body.noteContent,
      req.user.id,
    );
  }

  @Delete(':id')
  @Permissions(Permission.MEETING_MANAGE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.meetingsService.remove(id);
  }
}
