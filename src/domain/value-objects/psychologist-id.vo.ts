import { z } from 'zod';
import { Id } from '../base/value-object.base';

const PsychologistIdSchema = z
  .string()
  .uuid('Invalid psychologist ID format')
  .brand<'PsychologistId'>();

export class PsychologistId extends Id {
  constructor(value: string) {
    super(value);
  }

  public static create(value?: string): PsychologistId {
    if (value) {
      PsychologistIdSchema.parse(value);
      return new PsychologistId(value);
    }
    return new PsychologistId(Id.create().toString());
  }

  public static fromString(value: string): PsychologistId {
    return PsychologistId.create(value);
  }
}
