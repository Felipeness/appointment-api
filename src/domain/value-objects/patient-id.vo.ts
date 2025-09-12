import { z } from 'zod';
import { Id } from '../base/value-object.base';

const PatientIdSchema = z.string()
  .uuid('Invalid patient ID format')
  .brand<'PatientId'>();

export class PatientId extends Id {
  constructor(value: string) {
    super(value);
  }

  public static create(value?: string): PatientId {
    if (value) {
      PatientIdSchema.parse(value);
      return new PatientId(value);
    }
    return new PatientId(Id.create().toString());
  }

  public static fromString(value: string): PatientId {
    return PatientId.create(value);
  }
}