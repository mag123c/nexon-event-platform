import { Role } from '@app/auth/domain/value-objects/role.vo';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsArray, IsDate, IsNumber, IsString } from 'class-validator';
import { Document, Types } from 'mongoose';

export class UserActivityData {
  @IsNumber()
  @Prop({ type: Number, default: 0 })
  loginStreakDays?: number;
  @IsArray()
  @IsString({ each: true })
  @Prop({ type: [String], default: [] })
  invitedFriendIds?: string[];
  @IsDate()
  @Prop({ type: Date })
  lastLoginAt?: Date;
  @IsDate()
  @Prop({ type: Date })
  joinedAt?: Date;
}

export const UserActivityDataSchema =
  SchemaFactory.createForClass(UserActivityData);

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  _id!: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({
    type: [String],
    enum: Role,
    default: [Role.USER],
    index: true,
  })
  roles!: Role[];

  @Prop({ type: String, select: false })
  refreshToken?: string;

  @Prop({ type: UserActivityDataSchema, default: () => ({}) })
  activityData?: UserActivityData;

  createdAt!: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ createdAt: 1 });
UserSchema.index({ name: 1, roles: 1 });

UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});
