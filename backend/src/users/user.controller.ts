import {FastifyReply, FastifyRequest} from 'fastify';
import {app} from '../app';
import {validateDto} from '../utils/validation';
import {LoginDto, RegisterDto, TwoFAVerifyDto} from './user.dto';
import bcrypt from 'bcryptjs';
import {v4 as uuid} from 'uuid';
import {HttpStatusCode} from "../utils/httpStatusCodes";
import {create2FaSession, createUser, findUserByEmail, isValidTwoFaToken} from './user.service';
import {createUserToken} from "./user.service";

async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
    const {data, errors} = await validateDto(RegisterDto, request.body);
    if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({errors});

    const email = data!.email.toLowerCase();
    const passwordHash = await bcrypt.hash(data!.password, 10);
    const id = uuid();

    try {
        createUser(id, email, passwordHash);
    } catch {
        return reply.code(HttpStatusCode.CONFLICT).send({message: 'Email already registered'});
    }

    const token = createUserToken(id);
    reply.header("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=86400`);
    return reply.code(HttpStatusCode.CREATED).send({});
}

async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
    const {data, errors} = await validateDto(LoginDto, request.body);
    if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({errors});

    const email = data!.email.toLowerCase();
    const user = findUserByEmail(email)
    if (!user)
        return reply.code(HttpStatusCode.UNAUTHORIZED).send({error: 'Invalid credentials'});


    if (!await bcrypt.compare(data!.password, user.password))
        return reply.code(HttpStatusCode.UNAUTHORIZED).send({error: 'Invalid credentials'});

    if (!user.twoFaEnabled) {
        const token = createUserToken(user.id);
        reply.header("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=86400`);
        return reply.send({});
    }

    const twoFaSession = create2FaSession(user.id);
    return reply.send(({requires2FA: true, twoFaSession}));
}

async function twoFAVerifyHandler(request: FastifyRequest, reply: FastifyReply) {
    const {data, errors} = await validateDto(TwoFAVerifyDto, request.body);
    if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({errors});

    if(!isValidTwoFaToken(data!.twoFaSecret, data!.twoFaId, data!.userId, data!.token)){
        return reply.code(HttpStatusCode.UNAUTHORIZED).send({error: 'Invalid 2FA token'});
    }

    return reply.send({token: createUserToken(data!.userId)});
}

export default function registerUserRoutes() {
    app.post('/auth/register', registerHandler);
    app.post('/auth/login', loginHandler);
    app.post('/auth/2fa/verify', twoFAVerifyHandler);
}