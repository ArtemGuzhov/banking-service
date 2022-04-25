import { Resolver, Query, Mutation, Args } from '@nestjs/graphql'
import { CreateUserInput } from '../graphql/inputs/create-user.input'
import { User } from '../models/user.interface'
import { UserService } from '../services/user.service'

@Resolver('user')
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    // QUERY

    @Query(() => [User], { name: 'users', description: 'Getting all users.' })
    async users(): Promise<User[]> {
        return await this.userService.findAll()
    }

    @Query(() => User, {
        name: 'user',
        description: 'Getting user data by his id.',
    })
    async user(@Args('id') id: number): Promise<User> {
        return await this.userService.findOne(id)
    }

    // Mutation

    @Mutation(() => User, {
        name: 'createUser',
        description: 'User creation. Takes name and email as input',
    })
    async createUser(
        @Args('createUserInput') createUserInput: CreateUserInput,
    ): Promise<User> {
        return await this.userService.create(createUserInput)
    }

    @Mutation(() => String, {
        name: 'delete',
        description: 'Deleting a user by his id.',
    })
    async delete(@Args('id') id: number): Promise<String> {
        return await this.userService.delete(id)
    }
}
