import { IsNotEmpty, IsString, MinLength, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'passwordConfirm', async: false })
class PasswordConfirmConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const dto = args.object as ChangePasswordDto;
    return dto.newPassword === confirmPassword;
  }

  defaultMessage() {
    return 'newPassword and confirmPassword must match';
  }
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @Validate(PasswordConfirmConstraint)
  confirmPassword: string;
}
