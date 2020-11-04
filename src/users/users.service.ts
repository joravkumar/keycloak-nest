import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import KcAdminClient from 'keycloak-admin';
import { User } from './user.model';
import { RequiredActionAlias } from 'keycloak-admin/lib/defs/requiredActionProviderRepresentation';
import { HttpException } from '@nestjs/common';
import { Issuer } from 'openid-client';
import UserRepresentation from 'keycloak-admin/lib/defs/userRepresentation';
import RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';

const kcAdminClient = new KcAdminClient({
  baseUrl: 'http://3.7.142.134/auth',
  realmName: 'master'
});
const keycloakRun = async () => {
  try {
    await kcAdminClient.auth({
      username: process.env.KEYCLOAK_ADMIN_USERNAME,
      password: process.env.KEYCLOAK_ADMIN_PASSWORD,
      grantType: 'password',
      clientId: 'admin-cli',
      clientSecret: process.env.KEYCLOAK_ADMIN_SECRET,
    });

    const keycloakIssuer = await Issuer.discover(
      `${process.env.KEYCLOAK_AUTH_URL}/realms/master`,
    );
    const client = new keycloakIssuer.Client({
      client_id: 'admin-cli', // Same as `clientId` passed to client.auth()
      client_secret: process.env.KEYCLOAK_ADMIN_SECRET,
    });
    // Use the grant type 'password'

    let tokenSet = await client.grant({
      grant_type: 'password',
      username: process.env.KEYCLOAK_ADMIN_USERNAME,
      password: process.env.KEYCLOAK_ADMIN_PASSWORD,
    });
    console.log('Admin Connection with keycloack established');

    setInterval(async () => {
      try {
        console.log(kcAdminClient.accessToken);
        tokenSet = await client.refresh(kcAdminClient.refreshToken);
        kcAdminClient.setAccessToken(tokenSet.access_token);
      } catch (err) {
        console.log(`Error in set in`, err);
      }
    }, 18 * 1000);
  } catch (err) {
    console.log('Error while making connection with keycloak', err);
  }
};
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly userModel: ReturnModelType<typeof User>,
  ) {
    keycloakRun();
  }

  async getUsers(): Promise<UserRepresentation[]> {
    try {
      const users = await kcAdminClient.users.find({
        realm: process.env.REALM,
      });
      return users;
    } catch (err) {
      console.log(err);
    }
  }
  
  async saveUser(userData: User): Promise<boolean> {
    try {
      const newUser = new this.userModel(userData);
      const actions = [RequiredActionAlias.UPDATE_PASSWORD];
      if (userData.totp) {
        actions.push(RequiredActionAlias.CONFIGURE_TOTP);
      }
      const response = await kcAdminClient.users.create({
        realm: process.env.REALM,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailVerified: true,
        requiredActions: actions,
        enabled: true,
        totp: userData.totp ? true : false,
        credentials: [
          {
            type: 'password',
            temporary: false,
            value: userData.password,
          },
        ],
      });
      newUser.keyCloakId = response.id;
      await newUser.save();
      // console.log(response);
      return true;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.response.data.errorMessage || error.message,
        },
        400,
      );
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await kcAdminClient.users.del({
        id: userId,
        realm: process.env.REALM, //TODO: realm name change accordingly
      });
      return true;
    } catch (err) {
      console.log(err);
      throw new HttpException(
        { success: false, message: err.response.data },
        400,
      );
    }
  }

  async disableUser(userId: string): Promise<boolean> {
    try {
      await kcAdminClient.users.update(
        {
          id: userId,
          realm: process.env.REALM,
        },
        {
          enabled: false,
        },
      );
      return true;
    } catch (err) {
      throw new HttpException(
        { success: false, message: err.response.data },
        400,
      );
    }
  }

  async getRoles(): Promise<RoleRepresentation[]> {
    try {
      const roles = await kcAdminClient.roles.find();
      return roles;
    } catch (err) {
      throw new HttpException(
        { success: false, message: err.response.data },
        400,
      );
    }
  }
}
