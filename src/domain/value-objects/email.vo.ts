import { z } from 'zod';
import { ValueObject } from '../base/value-object.base';

const EmailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(254, 'Email is too long')
  .transform((val) => val.toLowerCase().trim());

export class Email extends ValueObject<string> {
  constructor(value: string) {
    super(value);
  }

  public static create(email: string): Email {
    const validatedEmail = EmailSchema.parse(email);
    return new Email(validatedEmail);
  }

  public getValue(): string {
    return this.props;
  }

  public toString(): string {
    return this.props;
  }

  public getDomain(): string {
    return this.props.split('@')[1];
  }

  public getLocalPart(): string {
    return this.props.split('@')[0];
  }
}
