import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// 조건 검증 결과 상세
@Schema({ _id: false, versionKey: false, timestamps: false })
export class ConditionCheckResult {
  @Prop({ required: true })
  conditionType!: string;

  @Prop({ type: Object, required: true })
  targetValue!: any;

  @Prop({ type: Object, required: true })
  actualValue!: any;

  @Prop({ required: true })
  isMet!: boolean;

  @Prop()
  checkedAt!: Date;
}
export const ConditionCheckResultSchema =
  SchemaFactory.createForClass(ConditionCheckResult);
