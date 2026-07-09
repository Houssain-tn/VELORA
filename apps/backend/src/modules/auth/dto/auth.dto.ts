import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@VELORA.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@1234' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'Mohamed Ali' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'admin@VELORA.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RefreshTokenDto {


  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
