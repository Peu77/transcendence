import {app} from "../app";
import jwt from 'jsonwebtoken';

export function registerAuthGuard(){
    app.addHook('onRequest', async (request, reply) => {
        if(request.url.startsWith('/auth/')) return;

        const token = request.cookies.token;
        if(!token) return reply.code(401).send({error: 'Unauthorized'});

        jwt.verify(token, process.env.JWT_SECRET || "", (err: any, decoded) => {
            if(err) return reply.code(401).send({error: 'Unauthorized'});
            if(!decoded || typeof decoded === 'string' || !decoded.userId)
                return reply.code(401).send({error: 'Unauthorized'});

            request.userId = decoded.userId;
        })
    });
}