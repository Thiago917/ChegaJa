import fp from 'fastify-plugin';

export default fp(async function(fastify){
    
    fastify.decorate('authenticate', async function (req, res){
        try{
            await req.jwtVerify();
        }
        catch(err){
            return res.send({message: 'Não autorizado!', error: err});
        }
    })
});