import { z } from 'zod';

export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    
    if (vo.props === undefined) {
      return false;
    }

    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }

  public getValue(): T {
    return this.props;
  }
}

// Base schema for ID validation
export const IdSchema = z.string().uuid('Invalid ID format');

export class Id extends ValueObject<string> {
  constructor(value: string) {
    IdSchema.parse(value); // Zod validation
    super(value);
  }

  public toString(): string {
    return this.props;
  }

  static create(value?: string): Id {
    if (value) {
      return new Id(value);
    }
    
    // Generate UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    return new Id(uuid);
  }
}