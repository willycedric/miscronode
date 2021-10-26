import * as express from 'express';
import {Request, Response } from 'express';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import { Product } from './entity/product';
import * as amqp from 'amqplib/callback_api';

dotenv.config();
createConnection()
.then(db => {
    const productRepository = db.getRepository(Product);

    amqp.connect(process.env.AMQP_URL, (error0, connection)=>{
            if(error0){
                throw error0;
            }
            connection.createChannel((err1, channel)=>{
                if(err1) throw err1;
                const app = express();
                app.use(cors({ 
                    origin:['http://localhost:3000']  
                }));
                app.use(express.json()) 

                app.get('/api/products',async (req: Request, res: Response)=>{
                    try{
                            const products = await productRepository.find();  
                            res.status(200).json(products);
                    }catch(err){
                        res.status(500).send({error:err.sqlMessage})
                    }
                });

                app.post('/api/products', async (req:Request, res:Response)=>{
                    try{
                        const product = await productRepository.create(req.body);
                        const result = await productRepository.save(product);
                        channel.sendToQueue('product_created', Buffer.from(JSON.stringify(result)));
                        return res.status(201).send(result);
                    }catch(err){
                        return res.status(50).send({error:err.sqlMessage});
                    }
                
                });

                app.get('/api/products/:id',  async (req:Request, res:Response)=>{ 
                    try{
                        const product = await productRepository.findOne(req.params.id);
                        if(product){
                            return res.status(200).send(product);
                        }else{                            
                            return res.status(404).send({});                    
                        }
                        
                    }catch(err){  
                        return res.status(500).send({error:err.sqlMessage});
                    }
                });
                app.put('/api/products/:id', async (req:Request, res:Response)=>{
                    try{
                        const product = await productRepository.findOne(req.params.id);
                        productRepository.merge(product, req.body);
                        const result = await productRepository.save(product);
                        channel.sendToQueue('product_updated', Buffer.from(JSON.stringify(result)));
                        return res.status(202).send(result);
                    }catch(err){
                    return res.status(500).send({error:err.sqlMessage});
                    }

                });

                app.delete("/api/products/:id", async (req:Request, res:Response)=>{

                    try{
                            const result = await productRepository.delete(req.params.id);
                            channel.sendToQueue('product_deleted', Buffer.from(req.params.id));
                            return res.send(result);
                    }catch(err){
                        return res.status(500).send({error:err.sqlMessage});
                    }
                });

                app.post('/api/products/:id/like', async (req:Request, res:Response)=>{
                    try{
                        const product = await productRepository.findOne(req.params.id);
                        product.likes++;
                        const result = await productRepository.save(product);
                        return res.status(200).send(result);
                    }catch(err){
                        return res.status(500).send({error:err.sqlMessage});
                    }
                })
                app.listen(process.env.SERVER_PORT, ()=>{
                    console.log(`server is listening on port ${process.env.SERVER_PORT}`);
                });
                process.on('beforeExit', ()=>{
                    console.log('closing');
                    connection.close();
                });
            })//end create channel
    });//end connect

       
}); 

 
 
 