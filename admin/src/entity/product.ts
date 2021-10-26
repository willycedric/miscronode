import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id:number;

  @Column()
  title:string;

  @Column()
  img:string;

  @Column()
  likes:number;

  
}