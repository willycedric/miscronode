import { Column, Entity, ObjectIdColumn } from "typeorm";

@Entity()
export class  Product {
  @ObjectIdColumn()
  id:string;
  @Column({unique:true})
  admin_id:number;

  @Column()
  title:string;

  @Column()
  img:string;

  @Column()
  likes:number;

}