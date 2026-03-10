import fp from 'fastify-plugin';
import jwt from '@fastify/jwt'

export default fp(async function(fastify){
    fastify.register(jwt,{
        secret: process.env.JWT_SECRET
    })
});