import { Field, InputType } from '@nestjs/graphql'
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator'

@InputType()
export class UserCreateInput {
    @Field({ description: 'Please, input user name', name: 'name' })
    @MinLength(1, {
        message: 'The minimum string length for the "name" field is 1.',
    })
    @MaxLength(15, {
        message: 'The maximum string length for the "name" field is 15.',
    })
    @IsString({ message: 'The "name" field must be a string.' })
    name: string

    @Field({ description: 'Please, input user email', name: 'email' })
    @IsEmail({}, { message: 'Uncorrect email' })
    @IsNotEmpty({ message: 'The "email" field must not be empty' })
    @IsString({ message: 'The "email" field must be a string.' })
    email: string
}
