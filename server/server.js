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
import Stripe from 'stripe';
import axios from 'axios';
import { sendPushNotification } from './services/sendNotify.js';

const fastify = Fastify({logger: true})
await fastify.register(cors);
await fastify.register(jwtPlugin)
await fastify.register(authPlugin)

await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
});
await fastify.register(Helmet)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
await fastify.decorate('stripe', stripe)

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

const calculateDistance = async (lat1, long1, lat2, long2) => {
   
    const api_url = process.env.GOOGLE_MAPS_API_MATRIX_URL
    const api_key = process.env.GOOGLE_MAPS_API_MATRIX_SECKEY

    const response = await axios.get(`${api_url}?origins=${lat1},${long1}&destinations=${lat2},${long2}&key=${api_key}`)
    const res = response.data
    const distance = res.rows[0].elements[0].distance.text 
    const frete = Number(distance.split(' ')[0]) * 0.5
    return {
        distance: distance,
        time: res.rows[0].elements[0].duration.text.split(' ')[0],
        frete: Math.round(frete).toFixed(2)
    }
    // const earthRadius = 6371 // km
    
    // const toRad = (degrees) => degrees * (Math.PI / 180)
    
    // const dLat = toRad(lat2 - lat1)
    // const dLong = toRad(long2 - long1)
    
    // const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //           Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    //           Math.sin(dLong / 2) * Math.sin(dLong / 2)
    
    // const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    // const distance = earthRadius * c
    
    // return Math.round(distance * 100) / 100 // Retorna com 2 casas decimais
}

const getGeolocation = async (cep) => {

    try{

        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: cep,
                key: process.env.GOOGLE_MAPS_API_MATRIX_SECKEY,
                region: 'br'
            }
        });

        const data = response.data

        if(data.status === 'OK'){
            const {lat, lng} = data.results[0].geometry.location; 
            return {lat, lng}
        }
        else{
            throw new Error(`Google Maps API Status: ${response.data.status} - ${response.data.error_message || ''}`);
        }
    
    }
    catch(err){
        console.log('Erro ao buscar coordenadas do usuário', err);
        throw err
    }
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


//USER - START

    fastify.get('/me', {onRequest:[fastify.authenticate]}, async(req, res) => {

        const userId = req.user.id

        const user = await prisma.user.findUnique({
            where: {id: userId},
        });

        const address = await prisma.Address.findFirst({
            where: {userId, isDefault: true}
        })

        const addresses = await prisma.Address.findMany({
            where: {userId}
        })

        if(!user) return res.status(404).send({message: 'Usuário não encontrado!'});

        return {
            name: user.name,
            email: user.email,
            id: user.id,
            photo: user.photo,
            address: address,
            addresses: addresses
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

    fastify.patch('/update-user/:id', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const user_id = req.user.id
        const updates = req.body.updates

        const find = await prisma.user.findUnique({
            where: {id: user_id}
        })
        
        if(!find) return res.send({message: 'Usuário não encontrado', error: true})

        const update_data = await prisma.user.update({
            where: {id: user_id},
            data: updates
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

    fastify.get('/address', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const userId = req.user.id

        if(!userId) return res.send({message: 'Usuário não foi encontrado!', error: true})

        const address = await prisma.Address.findMany({
            where: {userId}
        })

        return res.send(address)
    })

    fastify.post('/register-address', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const userId = req.user.id
        const data = req.body

        if(!userId || !data) return res.send({message: 'Dados não enviados para o backend', error: true})

        const exists = await prisma.Address.findFirst({
            where: {userId: userId, cep: data.cep}
        })

        if(exists) return res.send({message: 'Endereço já está cadastrado', error: true})
        
        const [_, __, result] = await prisma.$transaction([
            ...(data.isDefault ? [prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false }
            })] : [prisma.address.findFirst({ where: { id: 0 } })]),
            prisma.address.create({
                data:{
                    userId: userId,
                    logradouro: data.street,
                    numero: data.number,
                    complemento: data.complement,
                    bairro: data.neighborhood,
                    cidade: data.city,
                    estado: data.uf,
                    cep: data.cep,
                    apelido: data.label,
                    isDefault: data.isDefault 
                }
            }),
            prisma.address.findMany({
                where: {userId}
            })
        ])

        if(!result) return res.send({message: 'Erro ao cadastrar endereço', error: true})

        io.emit('new-address-list', result)

        return res.send({message: 'Endereço cadastrado com sucesso!', data: result, error: false})

    })

    fastify.patch('/update-register/:id', { onRequest: [fastify.authenticate] }, async (req, res) => {
        const userId = req.user.id;
        const id = Number(req.params.id);
        const updates = req.body.updates;

        if (!userId || !updates) {
            return res.send({ message: 'Dados insuficientes', error: true });
        }

        try {
            let updatedAddress;

            if (Object.values(updates).length <= 1) {

                const [_, __, result] = await prisma.$transaction([
                    prisma.address.updateMany({
                        where: { userId, isDefault: true },
                        data: { isDefault: false }
                    }),
                    prisma.address.update({
                        where: { id },
                        data: { isDefault: true }
                    }),
                    prisma.address.findMany({
                        where: {userId}
                    })
                ]);
                io.emit('new-address-list', result);
                updatedAddress = result;
            } else {
                
                updatedAddress = await prisma.address.update({
                    where: { id },
                    data: updates 
                });
                
                io.emit('updated-address', updatedAddress);
            }
            
            return res.send({ message: 'Endereço atualizado!', error: false, data: updatedAddress });

        } catch (err) {
            console.error(err);
            return res.status(500).send({ message: 'Erro interno no servidor', error: true });
        }
    });

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

        const userId = req.user.id
        const radiusKm = 10
        
        const {cep} = await prisma.Address.findFirst({
            where: {userId, isDefault: true}
        })

        console.log(process.env.GOOGLE_MAPS_API_MATRIX_SECKEY)
    
        const {lat, lng} = await getGeolocation(cep)

        if(!userId || !lat || !lng) return res({message: 'Não foi possível encontrar dados do usuário', error: true})

        const calc = await searchArea(lat, lng, radiusKm)
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
        
        const shopsWithDistance = await Promise.all(
            nearShops.map(async (shop) => {
                const distance = await calculateDistance(lat, lng, shop.latitude, shop.longitude)
                return{
                    ...shop,
                    distance: distance.distance,
                    duration: distance.time,
                    frete: String(distance.frete).replace('.',',')
                }
            })
        )

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

    fastify.get('/orders', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const userId = req.user.id

        if(!userId) return res.send({message: 'Usuário não encontrado!', error: true})

        const orders = await prisma.Order.findMany({
            where: {userId},
            include: {
                shop: true, 
                orderItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {createdAt: 'desc'}
        })

        io.emit('new-order-list', {orders})
        return res.send(orders)

    })

    fastify.post('/create-order', {onRequest:[fastify.authenticate]}, async (req, res) => {
        const userId = req.user.id;
        const { shopId, items, total } = req.body;

        try {
            const [_, result] = await prisma.$transaction([
                prisma.order.create({
                    data: {
                        userId,
                        shopId: parseInt(shopId),
                        items: JSON.stringify(items),
                        total: parseFloat(total),
                    }
                }),
                prisma.order.findMany({
                    where: {userId},
                    where: {orderItems:{userId}}
                })
            ])
        
            io.emit('new-order-list', {result})

            return res.send({ message: 'Pedido criado com sucesso', orderId: order.id, error: false });
        } catch (error) {
            console.log('Erro ao criar pedido:', error);
            return res.send({ message: 'Erro ao criar pedido', error: true });
        }
    });

    fastify.patch('/update-order/:id', {onRequest:[fastify.authenticate]}, async (req, res) => {

        const orderId = Number(req.params.id);
        const updates = req.body.update

        const order = await prisma.Order.findUnique({
            where: {id: orderId}
        })

        if(!order) return res.send({message: 'Pedido não encontrado', error: true})

        const [_, result] = await prisma.$transaction([
            prisma.Order.update({
                where: {id: orderId},
                data: updates
            }),
            prisma.Order.findUnique({
                where: {id: orderId},
                include: {user: true}
            })
        ])

        if(result.user.pushToken){
            let title = '';
            let body = '';
            switch (result.status) {
            case 'preparing':
                title = 'Pedido em preparo! 🍳';
                body = 'O restaurante começou a preparar sua janta.';
                break;
            case 'shipped':
                title = 'Saiu para entrega! 🛵';
                body = 'O entregador já está a caminho do seu endereço.';
                break;
            case 'delivered':
                title = 'Bom apetite! 😋';
                body = 'Seu pedido foi entregue. Avalie-nos no app!';
                break;
            }

            if (title) {
                await sendPushNotification(result.user.pushToken, title, body, { orderId: result.id });
            }
        }

        io.emit('order-updated', (result))

        return res.send({message: 'Pedido atualizado com sucesso!', data: result, error: false})
    })

//ORDER - END


//STRIPE - START

    fastify.post('/create-payment-sheet', {onRequest:[fastify.authenticate]}, async (req, res) => {
        try{
            const {data, addressId} = req.body

            const userId = req.user.id

            const store = await prisma.Shop.findUnique({
                where: {ownerId: userId}
            })

            if(!store) return res.send({message: 'Loja não foi encontrada.', error: true});

            const prods_id = data.map((item) => Number(item.product))
            const items = await prisma.Product.findMany({where: {id: {in: prods_id}}, select: {price: true, id: true, shopId: true}})

            let totalCentavos = 0;

            const final = data.map((i) => {
                const prod = items.find((e) => e.id === Number(i.product)); 
                
                if (!prod) throw new Error(`Produto ${i.product} não encontrado`);

                const centavos = Math.round(prod.price * 100);
                const subtotalItem = centavos * i.quantity;
                
                totalCentavos += subtotalItem;

                return {
                    productId: prod.id,
                    quantity: i.quantity,
                    price: prod.price                 
                };
            });

            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

            const exists = await prisma.Order.findFirst({
                where: {
                    userId: userId,
                    status: 'pending',
                    createdAt: { gte: thirtyMinutesAgo }
                },
                orderBy: {createdAt: 'desc'}
            })

            if(exists && exists.paymentId){

                if((exists.total * 100) !== totalCentavos){
                    await stripe.paymentIntents.update(exists.paymentId, {
                        amount: totalCentavos
                    })

                    await prisma.Order.update({
                        where: {id: exists.id},
                        data: {total: totalCentavos / 100}
                    })
                }

                const oldPayment = await stripe.paymentIntents.retrieve(exists.paymentId)

                return res.send({
                    paymentIntent: oldPayment.client_secret,
                    customer: oldPayment.customer,
                    publishableKey: process.env.STRIPE_PUBLISHABLED_KEY,
                    oldOrder: true,
                    order: exists
                })
            }

            const customer = await stripe.customers.create()
            const paymentIntent = await stripe.paymentIntents.create({
                amount: totalCentavos,
                currency: 'brl',
                customer: customer.id,
                automatic_payment_methods: {enabled: true},
                metadata:{
                    addressId: addressId,
                    userId: userId
                }
            });

            const saveOrder = await prisma.Order.create({
                data:{
                    userId: userId,
                    shopId: store.id,
                    total: totalCentavos / 100,
                    paymentId: paymentIntent.id,
                    orderItems:{
                        create: final
                    }
                }
            })
            
            if(!saveOrder) return res.send({message: 'Erro ao criar PaymentIntent no banco', error: true})

            return res.send({
                paymentIntent: paymentIntent.client_secret,
                customer: customer,
                publishableKey: process.env.STRIPE_PUBLISHABLED_KEY,
                oldOrder: false,
                order: saveOrder
            })        
        }
        catch(err){
            console.log(err)
            return res.send({message: err, error: true})
        }
    })

    fastify.post('/stripe-webhook', (req, res) => {

        const sig = req.headers['stripe-signature']
        
        console.log({dados: req.body, cabecalho_da_request: sig})
    })

//STRIPE - END


const start = async () => {
  try {
    const address = await fastify.listen({ 
        port: process.env.PORT || 3000, 
        host: '0.0.0.0' 
    });
    console.log(`Servidor está rodando em: ${address}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();