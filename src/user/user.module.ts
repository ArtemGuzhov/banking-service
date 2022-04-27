import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from './models/user.entity'
import { UserResolver } from './resolver/user.resolver'
import { UserService } from './services/user.service'

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    providers: [UserResolver, UserService],
    exports: [UserService],
})
export class UserModule {}
