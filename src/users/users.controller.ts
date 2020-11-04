import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
  Put,
  Get,
} from '@nestjs/common';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { User } from './user.model';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly UserService: UsersService) {}

  @Get('/roles')
  @Unprotected()
  async getRoles() {
    const roles = await this.UserService.getRoles();
    return {
      success: true,
      message: 'Roles fetched successfully',
      payload: {
        roles,
      },
    };
  }

  @Get()
  @Unprotected()
  async getUsers() {
    const users = await this.UserService.getUsers();
    return {
      success: true,
      message: 'User created successfully',
      payload: {
        users,
      },
    };
  }

  @Post()
  @Unprotected()
  async create(@Body() userData: User) {
    const response = await this.UserService.saveUser(userData);
    return {
      success: response,
      message: 'User created successfully',
    };
  }

  @Delete(':userId')
  @Unprotected()
  async delete(@Param('userId') userId: string) {
    const response = await this.UserService.deleteUser(userId);
    return {
      success: response,
      message: 'User deleted successfully',
    };
  }

  @Put(':userId')
  @Unprotected()
  async disable(@Param('userId') userId: string) {
    const response = await this.UserService.disableUser(userId);
    return {
      success: response,
      message: 'User deleted successfully',
    };
  }
}
