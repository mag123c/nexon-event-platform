import { User, UserDocument } from '@app/auth/user/domain/entities/user.entity';
import { UserRepository } from '@app/auth/user/domain/ports/user.repository';
import { MONGO_CONNECTIONS } from '@app/common/database/moongoose/mongoose-conneciton.token';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class UserMongoRepository implements UserRepository {
  constructor(
    @InjectModel(User.name, MONGO_CONNECTIONS.AUTH)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(new Types.ObjectId(id)).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async save(user: User): Promise<User> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async updateUser(user: User): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(user._id, user, {
      new: true,
    });
  }
}
