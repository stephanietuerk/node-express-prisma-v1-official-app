import bcrypt from 'bcryptjs';
import HttpException from '../models/http-exception.model';
import { RegisterInput } from '../models/register-input.model';
import { RegisteredUser } from '../models/registered-user.model';
import prisma from '../prisma/prisma-client';
import generateToken from '../utils/token.utils';

/**
 * Ensure email/username aren’t taken (for create).
 */
const checkUserUniquenessOnCreate = async (email: string, username: string) => {
  const [byEmail, byUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
  ]);

  if (byEmail || byUsername) {
    throw new HttpException(422, {
      errors: {
        ...(byEmail ? { email: ['has already been taken'] } : {}),
        ...(byUsername ? { username: ['has already been taken'] } : {}),
      },
    });
  }
};

/**
 * Ensure email/username changes don’t collide (for update).
 */
const checkUserUniquenessOnUpdate = async (
  loggedInUsername: string,
  nextEmail?: string,
  nextUsername?: string,
) => {
  if (!nextEmail && !nextUsername) return;

  const conflict = await prisma.user.findFirst({
    where: {
      OR: [
        ...(nextEmail ? [{ email: nextEmail }] : []),
        ...(nextUsername ? [{ username: nextUsername }] : []),
      ],
      NOT: { username: loggedInUsername },
    },
    select: { email: true, username: true },
  });

  if (conflict) {
    throw new HttpException(422, {
      errors: {
        ...(conflict.email === nextEmail ? { email: ['has already been taken'] } : {}),
        ...(conflict.username === nextUsername ? { username: ['has already been taken'] } : {}),
      },
    });
  }
};

export const createUser = async (input: RegisterInput): Promise<RegisteredUser> => {
  const email = input.email?.trim().toLowerCase();
  const username = input.username?.trim();
  const password = input.password?.trim();
  const image = input.image ?? undefined;
  const bio = typeof input.bio !== 'undefined' ? input.bio : undefined;

  if (!email) throw new HttpException(422, { errors: { email: ["can't be blank"] } });
  if (!username) throw new HttpException(422, { errors: { username: ["can't be blank"] } });
  if (!password) throw new HttpException(422, { errors: { password: ["can't be blank"] } });

  await checkUserUniquenessOnCreate(email, username);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      ...(image ? { image } : {}),
      ...(bio ? { bio } : {}),
    },
    select: { email: true, username: true, bio: true, image: true },
  });

  return { ...user, token: generateToken(user) };
};

export const login = async (payload: any) => {
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!email) throw new HttpException(422, { errors: { email: ["can't be blank"] } });
  if (!password) throw new HttpException(422, { errors: { password: ["can't be blank"] } });

  const user = await prisma.user.findUnique({
    where: { email },
    select: { email: true, username: true, password: true, bio: true, image: true },
  });

  if (!user) {
    // Spec uses 422 with “email or password is invalid”
    throw new HttpException(422, { errors: { 'email or password': ['is invalid'] } });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw new HttpException(422, { errors: { 'email or password': ['is invalid'] } });
  }

  const { password: _omit, ...safe } = user;
  return { ...safe, token: generateToken(safe) };
};

export const getCurrentUser = async (username: string) => {
  // If auth middleware put a bad/unknown username on the request, treat as unauthorized.
  const user = await prisma.user.findUnique({
    where: { username },
    select: { email: true, username: true, bio: true, image: true },
  });

  if (!user) {
    // RealWorld: invalid/expired token => 401
    throw new HttpException(401, { errors: { user: ['not authenticated'] } });
  }

  return { ...user, token: generateToken(user) };
};

export const updateUser = async (userPayload: any, loggedInUsername: string) => {
  const nextEmail = userPayload.email?.trim()?.toLowerCase();
  const nextUsername = userPayload.username?.trim();
  const nextPassword = userPayload.password?.trim();
  const nextImage = userPayload.image;
  const nextBio = userPayload.bio;

  await checkUserUniquenessOnUpdate(loggedInUsername, nextEmail, nextUsername);

  const data: Record<string, any> = {};
  if (nextEmail) data.email = nextEmail;
  if (nextUsername) data.username = nextUsername;
  if (typeof nextPassword === 'string' && nextPassword) {
    data.password = await bcrypt.hash(nextPassword, 10);
  }
  if (typeof nextImage !== 'undefined') data.image = nextImage;
  if (typeof nextBio !== 'undefined') data.bio = nextBio;

  // No-op updates are fine: Prisma will just return the current user.
  const user = await prisma.user.update({
    where: { username: loggedInUsername },
    data,
    select: { email: true, username: true, bio: true, image: true },
  });

  return { ...user, token: generateToken(user) };
};

export const findUserIdByUsername = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) throw new HttpException(404, {});
  return user;
};
