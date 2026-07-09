import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SquadsService } from './squads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('squads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SquadsController {
  constructor(private readonly squadsService: SquadsService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'CHEF_PROJET', 'DIRECTEUR')
  create(
    @Body()
    createSquadDto: {
      name: string;
      description?: string;
      color?: string;
      leaderId?: number;
      memberIds?: number[];
    },
  ) {
    return this.squadsService.create(createSquadDto);
  }

  @Get()
  findAll() {
    return this.squadsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.squadsService.findOne(+id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'CHEF_PROJET', 'DIRECTEUR')
  update(
    @Param('id') id: string,
    @Body()
    updateSquadDto: {
      name?: string;
      description?: string;
      color?: string;
      leaderId?: number;
      memberIds?: number[];
    },
  ) {
    return this.squadsService.update(+id, updateSquadDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'DIRECTEUR')
  remove(@Param('id') id: string) {
    return this.squadsService.remove(+id);
  }
}
