import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new BadRequestException(`Validation failed: ${errorMessage}`);
      }
      throw new BadRequestException('Validation failed');
    }
  }
}

// Decorator to use Zod validation on endpoint parameters
export const UsePipes = () => {
  return () => {
    // This would be used with @UsePipes(zodSchema) decorator
  };
};
