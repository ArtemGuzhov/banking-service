import { Resolver, Query, Mutation, Args } from '@nestjs/graphql'
import { UserCreateInput } from '../inputs/create-user.input'
import { User } from '../models/user.interface'
import { UserService } from '../service/user.service'

@Resolver('user')
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    // QUERY

    @Query(() => [User], { name: 'users', description: 'Getting all users.' })
    async users(
        @Args('filter', {
            nullable: true,
            description: "Filters: ['active', 'remote'].",
        })
        filter?: string,
    ): Promise<User[]> {
        return await this.userService.findAll(filter)
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
        @Args('userCreate') userCreateInput: UserCreateInput,
    ): Promise<User> {
        return await this.userService.create(userCreateInput)
    }

    @Mutation(() => String, {
        name: 'delete',
        description: 'Deleting a user by his id.',
    })
    async delete(@Args('id') id: number): Promise<String> {
        return await this.userService.delete(id)
    }
}
