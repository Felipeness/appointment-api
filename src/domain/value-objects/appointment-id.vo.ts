import { z } from 'zod';
import { Id } from '../base/value-object.base';

const AppointmentIdSchema = z
  .string()
  .uuid('Invalid appointment ID format')
  .brand<'AppointmentId'>();

export class AppointmentId extends Id {
  constructor(value: string) {
    super(value);
  }

  public static create(value?: string): AppointmentId {
    if (value) {
      AppointmentIdSchema.parse(value);
      return new AppointmentId(value);
    }
    return new AppointmentId(Id.create().toString());
  }

  public static fromString(value: string): AppointmentId {
    return AppointmentId.create(value);
  }
}
