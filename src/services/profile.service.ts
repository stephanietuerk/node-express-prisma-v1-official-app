import HttpException from '../models/http-exception.model';
import prisma from '../prisma/prisma-client';
import profileMapper from '../utils/profile.utils';
import { findUserIdByUsername } from './auth.service';

export const getProfile = async (usernamePayload: string, usernameAuth?: string) => {
  // Minimal select; compute `following` via filtered relation check
  const target = await prisma.user.findUnique({
    where: { username: usernamePayload },
    select: {
      username: true,
      bio: true,
      image: true,
      // Only load a single row from followedBy that matches the auth user (if provided)
      followedBy: usernameAuth
        ? {
            where: { username: usernameAuth },
            select: { id: true },
            take: 1,
          }
        : false,
    },
  });

  if (!target) throw new HttpException(404, {});

  // profileMapper expects full followedBy array; simulate minimally:
  const profileLike = {
    ...target,
    followedBy: usernameAuth && target.followedBy ? target.followedBy : [],
  };

  return profileMapper(profileLike as any, usernameAuth);
};

export const followUser = async (usernamePayload: string, usernameAuth: string) => {
  if (usernamePayload === usernameAuth) {
    throw new HttpException(422, { errors: { follow: ['cannot follow yourself'] } });
  }

  // Ensure both users exist; get follower id once
  const follower = await findUserIdByUsername(usernameAuth);

  // Ensure target exists first (so we return 404 if missing, not 200)
  const targetExists = await prisma.user.findUnique({
    where: { username: usernamePayload },
    select: { id: true },
  });
  if (!targetExists) throw new HttpException(404, {});

  // Connect (idempotent if already following)
  await prisma.user.update({
    where: { username: usernamePayload },
    data: { followedBy: { connect: { id: follower.id } } },
  });

  // Return fresh profile with following=true (minimal fetch)
  const target = await prisma.user.findUnique({
    where: { username: usernamePayload },
    select: {
      username: true,
      bio: true,
      image: true,
      followedBy: {
        where: { id: follower.id },
        select: { username: true },
        take: 1,
      },
    },
  });
  if (!target) throw new HttpException(404, {});

  const profileLike = { ...target, followedBy: target.followedBy };
  return profileMapper(profileLike as any, usernameAuth);
};

export const unfollowUser = async (usernamePayload: string, usernameAuth: string) => {
  if (usernamePayload === usernameAuth) {
    throw new HttpException(422, { errors: { follow: ['cannot unfollow yourself'] } });
  }

  const follower = await findUserIdByUsername(usernameAuth);

  const targetExists = await prisma.user.findUnique({
    where: { username: usernamePayload },
    select: { id: true },
  });
  if (!targetExists) throw new HttpException(404, {});

  // Disconnect (idempotent if not following)
  await prisma.user.update({
    where: { username: usernamePayload },
    data: { followedBy: { disconnect: { id: follower.id } } },
  });

  // Return fresh profile with following=false
  const target = await prisma.user.findUnique({
    where: { username: usernamePayload },
    select: {
      username: true,
      bio: true,
      image: true,
      followedBy: {
        where: { id: follower.id },
        select: { username: true },
        take: 1,
      },
    },
  });
  if (!target) throw new HttpException(404, {});

  const profileLike = { ...target, followedBy: [] }; // after disconnect, it should be empty
  return profileMapper(profileLike as any, usernameAuth);
};
