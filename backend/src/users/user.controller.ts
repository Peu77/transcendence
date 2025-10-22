import {FastifyReply, FastifyRequest} from 'fastify';
import {app} from '../app';
import {validateDto} from '../utils/validation';
import {LoginDto, RegisterDto, TwoFAVerifyDto} from './user.dto';
import bcrypt from 'bcryptjs';
import {v4 as uuid} from 'uuid';
import {HttpStatusCode} from "../utils/httpStatusCodes";
import {
    create2FaSession,
    createUser,
    ensureUploadDir,
    findUserByEmail, getUserById,
    isValidTwoFaToken,
    uploadProfilePicture
} from './user.service';
import {createUserToken} from "./user.service";


async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = getUserById(request.userId!!);
  if (!user)
    return reply
      .code(HttpStatusCode.NOT_FOUND)
      .send({ error: "User not found" });

  return reply.send({
    id: user.id,
    email: user.email,
    twoFaEnabled: user.twoFaEnabled,
  });
}

async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  const { data, errors } = await validateDto(RegisterDto, request.body);
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  const email = data!.email.toLowerCase();
  const passwordHash = await bcrypt.hash(data!.password, 10);
  const id = uuid();

  try {
    createUser(id, email, passwordHash);
  } catch {
    return reply
      .code(HttpStatusCode.CONFLICT)
      .send({ message: "Email already registered" });
  }

  const token = createUserToken(id);
  reply.cookie("token", token, {
    httpOnly: true,
    path: "/",
  });
  return reply.code(HttpStatusCode.CREATED).send({});
}

async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const { data, errors } = await validateDto(LoginDto, request.body);
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  const email = data!.email.toLowerCase();
  const user = findUserByEmail(email);
  if (!user)
    return reply
      .code(HttpStatusCode.UNAUTHORIZED)
      .send({ error: "Invalid credentials" });

  if (!(await bcrypt.compare(data!.password, user.password)))
    return reply
      .code(HttpStatusCode.UNAUTHORIZED)
      .send({ error: "Invalid credentials" });

  if (!user.twoFaEnabled) {
    const token = createUserToken(user.id);
    reply.cookie("token", token, {
      httpOnly: true,
      path: "/",
    });
    return reply.send({});
  }

  const twoFaSession = create2FaSession(user.id);
  return reply.send({ requires2FA: true, twoFaSession });
}

async function twoFAVerifyHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { data, errors } = await validateDto(TwoFAVerifyDto, request.body);
  if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({ errors });

  if (
    !isValidTwoFaToken(
      data!.twoFaSecret,
      data!.twoFaId,
      data!.userId,
      data!.token,
    )
  ) {
    return reply
      .code(HttpStatusCode.UNAUTHORIZED)
      .send({ error: "Invalid 2FA token" });
  }

  return reply.send({ token: createUserToken(data!.userId) });
}

async function uploadProfilePictureHandler(request: FastifyRequest, reply: FastifyReply) {
    const file = await request.file();
    if (!file) {
        return reply.code(HttpStatusCode.BAD_REQUEST).send({error: 'No file uploaded'});
    }

    return await uploadProfilePicture(request.userId!!, file)
}

export default async function registerUserRoutes() {
    try{
        await ensureUploadDir()
    } catch (err: any){
        app.log.error("Failed to create upload directory", err);
        process.exit(1);
    }
    app.post("/uploadProfilePicture", uploadProfilePictureHandler);
    app.post('/auth/register', registerHandler);
    app.post('/auth/login', loginHandler);
    app.post('/auth/2fa/verify', twoFAVerifyHandler);
}