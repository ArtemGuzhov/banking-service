import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import { TypeOrmModule } from '@nestjs/typeorm'
import { config } from './config/config'
import { graphQlConfig } from './config/graphql.config'
import { typeOrmConfig } from './config/typeorm.config'
import { TransactionModule } from './transaction/transaction.module'
import { WalletsModule } from './wallet/wallet.module'
import { UserModule } from './user/user.module'

@Module({
    imports: [
        ConfigModule.forRoot(config),
        GraphQLModule.forRoot(graphQlConfig),
        TypeOrmModule.forRootAsync(typeOrmConfig),
        UserModule,
        WalletsModule,
        TransactionModule,
    ],
})
export class AppModule {}
