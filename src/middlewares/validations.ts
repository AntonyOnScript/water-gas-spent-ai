import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'
import isBase64 from 'is-base64'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CountPrismaQuery {
    count: bigint
}

const uploadBodySchema = Joi.object({
    image: Joi.string().required(),
    customer_code: Joi.string().required(),
    measure_datetime: Joi.string().required(),
    measure_type: Joi.string()
        .allow('gas', 'water')
        .only()
        .insensitive()
        .required(),
})

const confirmBodySchema = Joi.object({
    measure_uuid: Joi.string().required(),
    confirmed_value: Joi.number().required(),
})

export const validateUploadBody = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { error } = uploadBodySchema.validate(req.body)
    if (error || !isBase64(req.body.image, { allowMime: true })) {
        if (error) {
            console.log('error: ', error.details[0].message)
        } else {
            console.log('error: ', 'image must be base64 encoded')
        }
        return res.status(400).json({
            error_code: 'INVALID_DATA',
            error_description:
                'Os dados fornecidos no corpo da requisição são inválidos',
        })
    }
    next()
}

export const canUserUpload = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { customer_code, measure_type } = req.body as Record<string, string>
    const hasSomeRecordThisMonth: Record<number, CountPrismaQuery> =
        await prisma.$queryRaw`SELECT COUNT(*) as count FROM measures WHERE MONTH(measure_datetime) = ${new Date().getMonth() + 1} AND measure_type = ${measure_type.toLowerCase()} AND customer_code = ${customer_code}`

    if (hasSomeRecordThisMonth[0].count) {
        return res.status(409).json({
            error_code: 'DOUBLE_REPORT',
            error_description:
                'Já existe uma leitura para este tipo no mês atual',
        })
    }

    next()
}

export const validateConfirmBody = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { error } = confirmBodySchema.validate(req.body)
    if (error) {
        console.log('error: ', error.details[0].message)
        return res.status(400).json({
            error_code: 'INVALID_DATA',
            error_description:
                'Os dados fornecidos no corpo da requisição são inválidos',
        })
    }

    next()
}
