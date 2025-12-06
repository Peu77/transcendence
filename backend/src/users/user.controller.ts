import {FastifyReply, FastifyRequest} from "fastify";
import {app} from "../app";
import {validateDto} from "../utils/validation";
import {LoginDto, RegisterDto, TwoFAVerifyDto} from "./dtos/user.dto";
import bcrypt from "bcryptjs";
import {v4 as uuid} from "uuid";
import {HttpStatusCode} from "../utils/httpStatusCodes";
import {
    create2FaSession,
    createUser,
    deleteProfilePicture,
    ensureUploadDir,
    findUserByEmail,
    getUserById,
    isValidTwoFaToken,
    updateUserProfilePictureId,
    UPLOAD_DIR,
    uploadProfilePicture,
} from "./user.service";
import {createUserToken} from "./user.service";
import {randomUUID} from "node:crypto";
import path from "node:path";
import fs from "node:fs/promises";
import {createReadStream} from "node:fs";
import {ProfilePictureDto} from "./dtos/getProfilePictureDto";

async function getMeHandler(request: FastifyRequest, reply: FastifyReply) {
    const user = getUserById(request.userId!!);
    if (!user)
        return reply
            .code(HttpStatusCode.NOT_FOUND)
            .send({error: "User not found"});

    return reply.send({
        id: user.id,
        email: user.email,
        profilePictureId: user.profilePictureId,
        twoFaEnabled: user.twoFaEnabled,
    });
}

async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
    const {data, errors} = await validateDto(RegisterDto, request.body);
    if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({errors});

    const email = data!.email.toLowerCase();
    const passwordHash = await bcrypt.hash(data!.password, 10);
    const id = uuid();

    try {
        createUser(id, email, passwordHash);
    } catch {
        return reply
            .code(HttpStatusCode.CONFLICT)
            .send({message: "Email already registered"});
    }

    const token = createUserToken(id);
    reply.cookie("token", token, {
        httpOnly: true,
        path: "/",
    });
    return reply.code(HttpStatusCode.CREATED).send({});
}

async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
    const {data, errors} = await validateDto(LoginDto, request.body);
    if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({errors});

    const email = data!.email.toLowerCase();
    const user = findUserByEmail(email);
    if (!user)
        return reply
            .code(HttpStatusCode.UNAUTHORIZED)
            .send({error: "Invalid credentials"});

    if (!(await bcrypt.compare(data!.password, user.password)))
        return reply
            .code(HttpStatusCode.UNAUTHORIZED)
            .send({error: "Invalid credentials"});

    if (!user.twoFaEnabled) {
        const token = createUserToken(user.id);
        reply.cookie("token", token, {
            httpOnly: true,
            path: "/",
        });
        return reply.send({});
    }

    const twoFaSession = create2FaSession(user.id);
    return reply.send({requires2FA: true, twoFaSession});
}

async function twoFAVerifyHandler(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const {data, errors} = await validateDto(TwoFAVerifyDto, request.body);
    if (errors) return reply.code(HttpStatusCode.BAD_REQUEST).send({errors});

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
            .send({error: "Invalid 2FA token"});
    }

    return reply.send({token: createUserToken(data!.userId)});
}

async function uploadProfilePictureHandler(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const file = await request.file();
    if (!file) {
        return reply
            .code(HttpStatusCode.BAD_REQUEST)
            .send({error: "No file uploaded"});
    }

    if (file.mimetype && !file.mimetype.startsWith("image/"))
        return reply
            .code(HttpStatusCode.BAD_REQUEST)
            .send({error: "Invalid file type. Only images are allowed"});

    const user = getUserById(request.userId!!);
    if (!user)
        return reply
            .code(HttpStatusCode.NOT_FOUND)
            .send({error: "User not found"});

    if (user.profilePictureId) await deleteProfilePicture(user.profilePictureId);

    const newProfilePictureId = randomUUID();
    const uploadedPicture = await uploadProfilePicture(newProfilePictureId, file);
    if (!uploadedPicture)
        return reply
            .code(HttpStatusCode.INTERNAL_SERVER_ERROR)
            .send({error: "Failed to upload profile picture"});

    await updateUserProfilePictureId(user.id, newProfilePictureId);
    return reply.send({
        message: "Profile picture uploaded successfully",
        profilePictureId: newProfilePictureId,
    });
}

async function getProfilePictureHandler(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const {data, errors} = await validateDto(ProfilePictureDto, request.params);
    if (errors || !data)
        return reply.code(HttpStatusCode.BAD_REQUEST).send({errors});
    const filepath = path.join(UPLOAD_DIR, data.id);

    try {
        await fs.access(filepath);
    } catch {
        return reply
            .code(HttpStatusCode.NOT_FOUND)
            .send({error: "Profile picture not found"});
    }

    try {
        reply.header("Cache-Control", "public, max-age=600");
        return reply.send(createReadStream(filepath));
    } catch (err) {
        request.log.error({err}, "Failed to serve profile picture");
        return reply
            .code(HttpStatusCode.INTERNAL_SERVER_ERROR)
            .send({error: "Failed to serve profile picture"});
    }
}

async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
    reply.clearCookie("token", {path: "/"});
    return reply.send({});
}

export default async function registerUserRoutes() {
    try {
        await ensureUploadDir();
    } catch (err: any) {
        app.log.error("Failed to create upload directory", err);
        process.exit(1);
    }
    app.post("/users/profilePicture", uploadProfilePictureHandler);
    app.get("/users/profilePicture/:id", getProfilePictureHandler);
    app.get("/users/me", getMeHandler);
    app.post("/auth/register", registerHandler);
    app.post("/auth/login", loginHandler);
    app.post("/auth/2fa/verify", twoFAVerifyHandler);
    app.post("/auth/logout", logoutHandler);
}
