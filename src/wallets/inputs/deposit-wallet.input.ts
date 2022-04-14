import { Field, InputType, ID } from "@nestjs/graphql";


@InputType()
export class DepositWalletInput {
  @Field(()=> ID, {description: "Please, input wallet id"})
  id: number

  @Field({description: "Please, input sum for deposit"})
  sum: number
}