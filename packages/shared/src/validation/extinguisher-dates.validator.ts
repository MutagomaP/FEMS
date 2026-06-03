import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { getExtinguisherDateErrors } from './extinguisher-dates';

@ValidatorConstraint({ name: 'extinguisherDates', async: false })
export class ExtinguisherDatesConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as {
      installationDate?: string;
      expiryDate?: string;
    };
    const errors = getExtinguisherDateErrors(
      obj.installationDate ?? '',
      obj.expiryDate ?? '',
    );
    return !errors.installationDate && !errors.expiryDate;
  }

  defaultMessage(args: ValidationArguments): string {
    const obj = args.object as {
      installationDate?: string;
      expiryDate?: string;
    };
    const errors = getExtinguisherDateErrors(
      obj.installationDate ?? '',
      obj.expiryDate ?? '',
    );
    return (
      errors.expiryDate ??
      errors.installationDate ??
      'Invalid installation or expiry date'
    );
  }
}

/** Cross-field validation: expiry must be after installation. */
export function ValidateExtinguisherDates(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'validateExtinguisherDates',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: ExtinguisherDatesConstraint,
    });
  };
}
