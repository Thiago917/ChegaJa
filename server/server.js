import 'dotenv/config'
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwtPlugin from './plugins/jwt.js'
import authPlugin from './plugins/authenticate.js'
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt, { hash } from 'bcrypt';
import nodemailer from 'nodemailer';
import rateLimit from '@fastify/rate-limit' 
import Helmet from '@fastify/helmet';
import { Server } from 'socket.io';

const fastify = Fastify({logger: true})
await fastify.register(cors);
await fastify.register(jwtPlugin)
await fastify.register(authPlugin)
await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
});
await fastify.register(Helmet)

const prisma = new PrismaClient();

const io = new Server(fastify.server, {
    cors:{
        origin: '*'
    }
})

io.on('connection', (socket) => {
    console.log('Cliente conectado', socket.id)

    socket.on('disconnect', () => {
        console.log('Cliente desconectado')
    })
})

const loginSchema = z.object({
    email: z.string().trim().email('Email inválido'),
    senha: z.string().min(6, ' A senha precisa ter no mínimo 6 caracteres')
})

const registerSchema = z.object({
    nome: z.string().trim().min(2, 'Nome inválido'),
    email: z.string().trim().email('Email inválido'),
    senha: z.string().min(6, 'A senha precisa ter no mínimo 6 carateres')
}).partial()

const productSchema = z.object({
    name: z.string().trim(),
    price: z.number(),
    category: z.string(),
    photo: z.string()
})

const email = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: Number(process.env.EMAIL_PORT), 
    auth: {
        user: process.env.EMAIL_SENDER_ADDRESS, 
        pass: process.env.EMAIL_SENDER_PASSWORD
    }
})

const searchArea = async (lat, long, radiusKm ) => {

    try{

        const earthRadius = 6371 // km
        
        const latDelta = radiusKm / earthRadius
        const lngDelta = radiusKm / (earthRadius * Math.cos(Math.PI * lat / 180))
        
        const minLat = lat - latDelta * (180 / Math.PI)
        const maxLat = lat + latDelta * (180 / Math.PI)
        
        const minLng = long - lngDelta * (180 / Math.PI)
        const maxLng = long + lngDelta * (180 / Math.PI)
        
        return {
            min_lat: minLat,
            max_lat: maxLat,
            min_long: minLng,
            max_long: maxLng,
            error: false
        }
    }
    catch(err){
        return {error: true, res: err}
    }
}

const calculateDistance = (lat1, long1, lat2, long2) => {
    const earthRadius = 6371 // km
    
    const toRad = (degrees) => degrees * (Math.PI / 180)
    
    const dLat = toRad(lat2 - lat1)
    const dLong = toRad(long2 - long1)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLong / 2) * Math.sin(dLong / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = earthRadius * c
    
    return Math.round(distance * 100) / 100 // Retorna com 2 casas decimais
}

const resetEmailCode = new Map();

const validaToken = async (token) => {
    try{
        const decoded = fastify.jwt.verify(token, process.env.JWT_SECRECT);
        return {valid: true, userId: decoded.id};
    }
    catch(err){
        return {valid: false, message: 'Token inválido ou expirado'};
    }
}

console.log('Iniciando servidor...')

//USER - START

    fastify.get('/me', {onRequest:[fastify.authenticate]}, async(req, res) => {

        const userId = req.user.id

        const user = await prisma.user.findUnique({
            where: {id: userId},
        });

        if(!user) return res.status(404).send({message: 'Usuário não encontrado!'});

        return {
            name: user.name,
            email: user.email,
            id: user.id,
            photo: user.photo
        };
    })

    fastify.post('/login', {config:{
        rateLimit:{
            max: 5,
            timeWindow: '1 minute'
        }
    }}, async (req, res) => {

        const result = loginSchema.safeParse(req.body)
        if(!result.success){

            const message = result.error.issues.map(e => e.message)
            return res.send({
                error: true,
                message: message,
                details: result.error.format()
            })
        }

        const {email, senha} = result.data

        const user = await prisma.user.findUnique({
            where : {email}
        });
        
        if(!user) return res.send({message: 'Usuário não encontrado!', error: true});
        
        const passMatch = await bcrypt.compare(senha, user.password)

        if(!passMatch) return res.send({message: 'Email ou senha inválidos', error: true});

        const accessToken = fastify.jwt.sign(
            {id: user.id},
            {expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN}
        )

        const refreshToken = fastify.jwt.sign(
            {id: user.id},
            {expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN}
        )

        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)
        const saveRefreshTK = await prisma.RefreshToken.create({
            data:{
                userId: user.id,
                token: refreshToken,
                expiresAt: expiresAt
            }
        })

        if(!saveRefreshTK) return res.send({message: 'Erro ao salvar Refresh Token do usuário', error: true})

        return{
            message: 'Login realizado com sucesso!',
            accessToken: accessToken,
            refreshToken: refreshToken,
            error: false,
            name: user.name,
            photo: user.photo
        }
        
    })

    fastify.post('/register', async(req, res) => {

        const result = registerSchema.safeParse(req.body);
        if(!result.success) {
            const message = result.error.issues.map(e => e.message) 
            return res.send({message: message, details: result.error.format(), error: true})
        };

        const {nome, email, senha} = result.data;

        const exist = await prisma.user.findUnique({
            where: {email}
        });

        if(exist) return res.send({message: 'Já tem uma conta cadastrada com esse email', error: true});
        
        const hashedPass = await bcrypt.hash(senha, 10);
        const newUser = await prisma.user.create({
            data:{
                name: nome,
                email,
                password: hashedPass,
                photo: ''
            }
        })

        const accessToken = fastify.jwt.sign(
            {id: newUser.id},
            {expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN}
        );

        const refreshToken = fastify.jwt.sign(
            {id: newUser.id},
            {expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN}
        )
        
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        const saveData = await prisma.$transaction([
            prisma.RefreshToken.create({
                data:{
                    userId: newUser.id,
                    token: refreshToken,
                    expiresAt: expiresAt
                }
            })

        ])

        if(!saveData) return res.send({message: 'Erro ao cadastrar usuário', error: true})
        
        return res.send({message: 'Cadastro realizado com sucesso!', accessToken: accessToken, refreshToken: refreshToken, error: false, name: newUser.name});
    })

    fastify.post('/profile-photo', async(req, res) => {

        const {user_id} = req.body
        const {photo_url} = req.body

        if(!user_id || !photo_url) return res.send({message: 'Foto não encontrada, ou ID do usuário = null', error: true})

        if(photo_url === '') return res.send({message: 'Foto não encontrada', error: true});

        const user = await prisma.user.findUnique({
            where: {id: user_id}
        })

        if(!user) return res.send({message: 'Usuário não encontrado!', error: true});

        const setPhoto = await prisma.user.update({
            where: {id: user_id},
            data: {photo: photo_url}
        })

        if(!setPhoto) res.send({message: 'Erro ao subir foto pro banco', error: true})
        
        return res.send({message: 'Foto alterada com sucesso!', error: false});
    })

    fastify.post('/refreshToken', async (req, res) => {
        
        const authHeader = req.headers.authorization

        if(!authHeader) return res.send({message: 'Token não recebido', error: true});
        
        const token = authHeader.split(' ')[1]
            
        try{validaToken(token)}catch(err){res.send({message: err, error: true})}

        const getTk = await prisma.RefreshToken.findFirst({
            where: {token}
        })

        if(!getTk) return res.send({message: 'Token não encontrado no banco de dados!', error: true})
        
        const getUser = await prisma.user.findUnique({
            where: {id: getTk.userId}
        })
        if(!getUser) return res.send({message: 'Dados do usuário não foram encontrados.', error: true})

        if(getTk.expiresAt < new Date()) {
            delInvalidTk = await prisma.RefreshToken.delete({
                where: {token}      
            })

            return res.send({message: 'RefreshToken inválido ou expirado', error: true})
        }
        
        const newAccessTk = fastify.jwt.sign(
            {id: getTk.userId},
            {expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN}
        )
            
        const newRefreshTk = fastify.jwt.sign(
            {id: getTk.userId},
            {expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN}
        )


        const newExpiresAt = new Date()
        newExpiresAt.setDate(newExpiresAt.getDate() + 7)
        
        const newTokens = await prisma.$transaction([
            prisma.RefreshToken.delete({where: {token}}),
            prisma.RefreshToken.create({
                data:{
                    userId: getTk.userId,
                    token: newRefreshTk,
                    expiresAt: newExpiresAt
                }
            })
        ])

        if(!newTokens) return res.send({message: 'Erro na geração de novo token', error: true})  

        return res.send({message: 'Validação de token feita com sucesso, tokens novos gerados', accessToken: newAccessTk, refreshToken: newRefreshTk, error: false, name: getUser.name})
    })

    fastify.post('/update-user', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const {name} = req.body
        const {mail} = req.body
        const user_id = req.user.id


        const integrity = registerSchema.parse()
        
        if(!integrity.success){
            const message = result.error.issues.map(e => e.message)
            return res.send({
                error: true,
                message: message,
                details: result.error.format()
            })
        }


        const find = await prisma.user.findUnique({
            where: {id: user_id}
        })
        
        if(!find) return res.send({message: 'Usuário não encontrado', error: true})

        if(mail === mail && name === name) return res.send({message: "Dados mantidos.", error: false})

        const update_data = await prisma.user.update({
            where: {id: user_id},
            data:{name: name, email: mail}
        })

        if(!update_data) return res.send({message: 'Erro ao atualizar dados do usuário', error: true})
        
        return res.send({message: 'Dados do usuário atualizados com sucesso!', error: false})
    })

    fastify.post('/logout', async (req, res) => {

        const authHeader = req.headers.authorization
        if(!authHeader) return res.send({message: 'RefreshToken não recebido no header da request', error: true})
        
        const token = authHeader.split(' ')[1]
        const validation = await validaToken(token)
        if(!validation.valid) return res.send({message: validation.message, error: true})

        const getTk = await prisma.RefreshToken.findUnique({
            where: {token}
        }) 

        if(!getTk) return res.send({message: 'Token não encontrado para fazer logout', error: true});

        const delTk = await prisma.RefreshToken.delete({
            where: {token}
        })

        if(!delTk) return res.send({message: 'Erro fazer logout', error: true})

        return res.send({message: 'Logout feito com sucesso!', error: false})

    })

    fastify.post('/deleteMe', async (req, res) => {

        const authHeader = req.headers.authorization;
        if(!authHeader) return res.send({message: 'Token não recebido no header da request', error: true})

        const token = authHeader.split(' ')[1]
        const validation = await validaToken(token)
        if(!validation.valid) return res.send({message: validation.message, error: true})
        console.log(validation)
        const del_user = await prisma.user.delete({where: {id: validation.userId}})
        if(!del_user) return res.send({message: 'Erro ao deletar dados do usuário do banco de dados', error: true})
        
        return res.send({message: 'Usuário deletado com sucesso!', error: false})
    })

    fastify.post('/change-password-code', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const { mail } = req.body

        if(!mail) return res.send({message: `Email ${mail} inválido`, error: true})


        await prisma.ResetPasswords.deleteMany({
            where: {userId: req.user.id}
        })

        const expires = Date.now() + 1000 * 60 * 10     //10 minutos
        var expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + 10)
        const code = (Math.floor(100000 + Math.random() * 900000)).toString();
        const hashed_code = await bcrypt.hash(code, 10);
        
        resetEmailCode.set(mail, {code, expires: expires})

        const saveCode = await prisma.ResetPasswords.create({
            data:{
                userId: req.user.id,
                code: hashed_code,
                expiresAt: expiresAt,
            }
        })

        if(!saveCode) return res.send({message: 'Erro ao salvar código de validação no banco', error: true});

        const sendMail = await email.sendMail({
            from: `"Chega Já" ${email.transporter.auth.user}`,
            to: mail,
            subject: 'Código de redefinção de senha',
            text: `Seu código é ${code}`
        });

        if(!sendMail) return res.send({message: 'Deu ruim no envio do email', error: sendMail});
        return res.send({message: `Email enviado com sucesso para ${mail}, vai lá chegar`, error: false})
    })

    fastify.post('/verify-reset-code', {onRequest:[fastify.authenticate]}, async(req, res) => {

        const { code } = req.body

        const stored_code = await prisma.ResetPasswords.findFirst({
            where: {userId: req.user.id}
        })

        const verify = await bcrypt.compare(code, stored_code.code);

        if(!verify || stored_code.expiresAt < new Date()) return res.send({message: 'Código incorreto ou expirado', error: true});
        
        await prisma.ResetPasswords.delete({
            where: {code: stored_code.code}
        })
        
        return res.send({message: 'Validação feita com sucesso!', error: false})

    })

    fastify.post('/reset-password', {onRequest:[fastify.authenticate]}, async(req, res) => {

        const {newPass} = req.body
        
        const user = await prisma.user.findUnique({
            where: {id: req.user.id}
        })
        
        if(!user) return res.send({message: 'Usuário não encontrado', error: true})

        const lastPass = await prisma.PasswordHistory.findMany({
            where: {userId: user.id},
            orderBy: {createdAt: 'desc'},
            take: 3
        });

        const alreadyUsed = await Promise.all(
            lastPass.map(item => bcrypt.compare(newPass, item.password))
        )

        const isCurrent = await bcrypt.compare(newPass, user.password)

        if(alreadyUsed.includes(true) || isCurrent) return res.send({message: 'Coloque uma senha diferente das ultímas 3 senhas utilizadas', error: true});
        
        const hashedPass = await bcrypt.hash(newPass, 10)

        const saveData = await prisma.$transaction([
            prisma.user.update({
                where: {id: user.id},
                data: {password: hashedPass}
            }),
            prisma.PasswordHistory.create({
                data:{
                    userId: user.id,
                    password: user.password
                }
            })
        ]);

        if(!saveData) return res.send({message: 'Erro ao redefinir sua senha', error: true})
            
        return res.send({message: 'Redefinição de senha concluída com sucesso!', error: false})
    })

//USER - END



//SHOP - START

    fastify.get('/shop', {onRequest:[fastify.authenticate]}, async(req, res) => {

        const user_id = req.user.id

        const shop = await prisma.Shop.findUnique({
            where: {ownerId: user_id}
        }) 

        if(!shop) return res.send({message: 'Não foi possível encontrar a loja', error: true})



        return res.send(shop)
        
    })

    fastify.post('/shops-near-by', {onRequest:[fastify.authenticate]}, async(req, res) => {

        const user_id = req.user.id
        const {lat, long} = req.body
        console.log({lat: lat, long: long})
        const radiusKm = 10

        if(!user_id || !lat || !long) return res({message: 'Não foi possível encontrar dados do usuário', error: true})

        const calc = await searchArea(lat, long, radiusKm)
        if(calc.error) return res.send({message: calc.res})
        const nearShops = await prisma.shop.findMany({
            where: {
                latitude:{
                    gte: calc.min_lat,
                    lte: calc.max_lat
                },
                longitude:{
                    gte: calc.min_long,
                    lte: calc.max_long
                },
            },
        });

        if(!nearShops) return res.send({message: 'Erro ao procurar lojas próximas', error: true})
        
        const shopsWithDistance = nearShops.map(shop => ({
            ...shop,
            distance: calculateDistance(lat, long, shop.latitude, shop.longitude)
        }));
        
        shopsWithDistance.sort((a, b) => a.distance - b.distance);
            
        io.emit('load-near-by', {nearShops: shopsWithDistance})
        return res.send(shopsWithDistance);
    })

    fastify.patch('/update-shop/:id', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const shop_id = Number(req.params.id)
        const updates = req.body.updates

        if(!updates){
            return res.send({error: true, message: 'Nenhum dado enviado'})
        }

        const updatedShop = await prisma.shop.update({
            where: { id: shop_id },
            data: updates
        })

        io.emit('shop-status-change', {
            id: shop_id,
            updates
        })

        return res.send({
            error: false,
            message: 'Dados atualizados',
            shop: updatedShop
        })

    })

    fastify.get('/shop-products/:shopId', async (req, res) => {
        const shopId = parseInt(req.params.shopId);

        const products = await prisma.product.findMany({
            where: {
                shopId: shopId
            },
            orderBy: {
                category: 'asc'
            }
        });

        const shop = await prisma.shop.findUnique({
            where: {id: shopId}
        })

        const groupedProducts = Object.values(
            products.reduce((acc, product) => {
                if (!acc[product.category]) {
                    acc[product.category] = {
                        category: product.category,
                        products: []
                    };
                }
                acc[product.category].products.push(product);
                return acc;
            }, {})
        );

        return res.send({ response: groupedProducts, shop: shop });
    });


//SHOP - END



//MENU - START

    fastify.get('/products', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const ownerId = req.user.id

        const shop = await prisma.Shop.findUnique({
            where: {ownerId}
        }) 

        if(!shop) return res.send({message: 'Não foi possível encontrar a loja', error: true})
        
        const products = await prisma.product.findMany({
        where: {
            shopId: ownerId
        },
        orderBy: {
            category: 'asc'
        }
        })
        const groupedProducts = Object.values(
        products.reduce((acc, product) => {

            if (!acc[product.category]) {
            acc[product.category] = {
                category: product.category,
                products: []
            }
            }

            acc[product.category].products.push(product)

            return acc

        }, {})
        )

        return res.send({response: groupedProducts});
        
    })

    fastify.patch('/update-menu', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const shop_id = req.user.id
        const product_id = req.body.id
        const updates = req.body.data.updates

        if(!shop_id || !updates || !product_id) return res.send({message: 'Dados da loja não foram recebidos', error: true})
        
        const get_store = await prisma.Shop.findUnique({
            where: {id: shop_id}
        }) 

        if(!get_store) return res.send({message: 'A loja não foi encontrada', error: true})
        
        const updt_data = await prisma.Product.update({
            where: {id: product_id},
            data: updates
        }) 

        if(!updt_data) return res.send({message: 'Erro ao atualizar dados do menu', error: true})

        return res.send({message: 'Dados atualizados com sucesso', error: false})

    })

    fastify.post('/register-product', {onRequest:[fastify.authenticate]}, async(req, res) => {

        const shop_id = req.user.id
        const {name, price, category, photo} = req.body.data

        const get_store = await prisma.Shop.findUnique({
            where: {id: shop_id}
        }) 
        if(!get_store) return res.send({message: 'Não foi possível encontrar a loja', error: false});

        const find_prd = await prisma.Product.findUnique({
            where: {name},
        })

        if(find_prd) return res.send({message: 'Já existe um produto com esse nome.', error: true});

        const create_prd = await prisma.Product.create({
            data:{
                shopId: shop_id,
                name: name,
                price: price,
                category: category,
                photo: photo,
            }
        }) 
        
        if(!create_prd) return res.send({message: 'Erro ao cadastrar produto', error: true});

        const check_prd = await prisma.Product.findUnique({
            where: {name},
        })

        io.emit('render-new-product' , {
            product_id: check_prd.id,
            shop_id: shop_id,
            name: name,
            price: price,
            category: category,
            photo: photo
        })
        
        return res.send({message: 'Produto cadastrado com sucesso!', error: false})
    })

    fastify.delete('/delete-product/:prod_id', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const {prod_id} = req.params
        const shopId = req.user.id

        if(!prod_id || !prod_id) return res.send({message: 'Produto não recebido', error: true})

        const del_item = await prisma.Product.delete({
            where: {id: Number(prod_id)},
        })

        const all_prods = await prisma.Product.findMany({
            where: {shopId}
        })

        if(!del_item) return res.send({message: 'Não foi possível excluir esse item', error: true})
        
        io.emit('/all-prds', {all_prods})
        return res.send({message: 'Produto foi excluído com sucesso!', error: false})
    })

//MENU - END



//ORDER - START

    fastify.post('/create-order', {onRequest:[fastify.authenticate]}, async (req, res) => {
        const userId = req.user.id;
        const { shopId, items, total } = req.body;

        try {
            const order = await prisma.order.create({
                data: {
                    userId,
                    shopId: parseInt(shopId),
                    items: JSON.stringify(items),
                    total: parseFloat(total),
                }
            });

            return res.send({ message: 'Pedido criado com sucesso', orderId: order.id, error: false });
        } catch (error) {
            console.log('Erro ao criar pedido:', error);
            return res.send({ message: 'Erro ao criar pedido', error: true });
        }
    });

//ORDER - END


const start = async () => {
  try {
    const address = await fastify.listen({ 
        port: 3000, 
        host: '0.0.0.0' 
    });
    console.log(`Servidor rodando REALMENTE em: ${address}`);
    console.log('Pronto para receber requisições!');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();