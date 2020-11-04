import { prop } from '@typegoose/typegoose';
import mongoose from 'mongoose';

export class User {
  _id?: mongoose.Types.ObjectId;

  totp: boolean;

  @prop({ type: String, required: [true, 'Username is required'], unique: true })
  username: string;

  @prop({ type: String, required: [true, 'Password is required'] })
  password: string;

  @prop({ default: null })
  keyCloakId?: string | null;

  @prop({ default: null })
  email?: string | null;

  @prop({ default: null })
  firstName?: string | null;

  @prop({ default: null })
  lastName?: string | null;
}
