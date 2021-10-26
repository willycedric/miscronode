import * as express from 'express';
import {Request, Response } from 'express';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import { Connection, createConnection } from 'typeorm';
import { Product } from './entity/product';
import *  as amqp from 'amqplib/callback_api';
dotenv.config(); 
createConnection()
.then(db => {
    const productRepository = db.getRepository(Product);
    amqp.connect(process.env.AMQP_URL, (err1, connection)=>{
      if(err1){
       throw err1
      }
      connection.createChannel((err2, channel)=>{
        if(err2) throw err2;
        channel.assertQueue('product_created',{durable:false});
        channel.assertQueue('product_updated',{durable:false});
        channel.assertQueue('product_deleted',{durable:false});
        const app = express(); 
        app.use(cors({  
              origin:['http://localhost:3000']  
            }));
        app.use(express.json());
        channel.consume("product_created",async (msg)=>{
          const evtProduct:Product = JSON.parse(msg.content.toString('utf-8'));
          const product = new Product();
          product.admin_id = parseInt(evtProduct.id);
          product.title = evtProduct.title;
          product.likes = evtProduct.likes;
          product.img = evtProduct.img;
          await productRepository.save(product);
          console.log('product created');
        },{noAck:true});

        channel.consume("product_updated",async (msg)=>{
          const evtProduct:Product = JSON.parse(msg.content.toString('utf-8'));
           try{ 
              const product = await productRepository.findOne({admin_id:parseInt(evtProduct.id)});
              
                productRepository.merge( product,{
                title: evtProduct.title,
                img:evtProduct.img,
                likes:evtProduct.likes
              }); 
              await productRepository.save(product);
 
           }catch(err){
             console.log(err);
           }
          console.log('product updated');
        },{noAck:true});


        channel.consume("product_deleted",async (msg)=>{
          const admin_id = parseInt(JSON.parse(msg.content.toString('utf-8')));
           try{ 
              await productRepository.delete({admin_id})
 
           }catch(err){
             console.log(err);
           }
          console.log('product delete');
        },{noAck:true});
        app.get('/api/products', async (req:Request, res:Response)=>{
          try{
              const products = await productRepository.find()
              return res.status(200).send(products);
          }catch(err){
              console.log(err)
              return res.status(500).send({})
          }
          
        })
        const port = process.env.SERVER_PORT
        app.listen(port, ()=>{
            console.log(`Server is listening on port ${port}`);
        });    
        process.on('beforeExit', ()=>{
          console.log('closing');
          connection.close();
        });
      });
    });  
     
});    