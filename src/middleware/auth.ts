import jwt, { JwtPayload } from 'jsonwebtoken'
import { Prisma, PrismaClient } from '@prisma/client'
import { JWT_EXPIRY_SECONDS, JWT_SECRET_KEY } from '../constants/auth'
import { NextFunction, Request, Response } from 'express'

const prisma = new PrismaClient()

/**
 * Check authentication middleware
 * Checks if the user is authenticated,
 * if not, response with 401 Unauthorized,
 * otherwise, add user to req object (req.user),
 * and call next() to continue the request
 * 
 * @name checkAuthentication
 * @function
 * @param {Object} req
 * @param {Object} res
 * @param {Object} next
 */
export const checkAuthentication = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            error: "unauthorized"
        })
    }

    let payload = {}
    try {
        payload = jwt.verify(token, (<any> JWT_SECRET_KEY))
    } catch (e) {
        if (e instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                error: "unauthorized"
            })
        }
        return res.status(401).json({
            error: "unauthorized"
        })
    }

    const nowUnixSeconds = Math.round(Number(new Date()) / 1000)
    if ((<any> payload).exp - nowUnixSeconds > JWT_EXPIRY_SECONDS) {
        return res.status(401).json({
            error: "unauthorized"
        })
    }

    const email = (<any> payload).email

    const user = await prisma.user.findFirst({
        where: {
            email,
        },
    })

    if (!user) {
        return res.status(401).json({
            error: "user_not_found"
        })
    }

    req.user = payload
    next()
}