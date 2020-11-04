import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import {
  KeycloakConnectModule,
  ResourceGuard,
  RoleGuard,
  AuthGuard,
} from 'nest-keycloak-connect';
import { APP_GUARD } from '@nestjs/core';
import { TypegooseModule } from 'nestjs-typegoose';
import { User } from './user.model';

@Module({
  imports: [
    TypegooseModule.forFeature([User]),
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_AUTH_URL,
      realm: process.env.REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }),
  ],
  providers: [
    UsersService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // This adds a global level resource guard, which is permissive.
    // Only controllers annotated with @Resource and methods with @Scopes
    // are handled by this guard.
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
  controllers: [UsersController],
})
export class UsersModule {}
