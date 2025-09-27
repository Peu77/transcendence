import {FastifyReply, FastifyRequest} from "fastify";
import {app} from "../app";

async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
    reply.send({message: "Login successful"});
}

export default function registerUserRoutes() {
    app.get('/login', loginHandler);
}