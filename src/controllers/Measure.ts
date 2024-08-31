import { Request, Response } from 'express'
import { PrismaClient, Prisma, MeasureType } from '@prisma/client'
import { GoogleAIFileManager } from '@google/generative-ai/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const tmpImagesFolderPath = path.join(__dirname, '..', '..', 'tmp')
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
interface ListWhereOptions {
    customer_code: string
    measure_type?: MeasureType
}

type ListResults = Omit<Prisma.MeasureCreateInput[], 'customer_code'>

function getMimeType(base64String: string): string {
    const match = base64String.match(/^data:(.+);base64,/)
    return match ? match[1] : ''
}

async function createTempImage(
    base64String: string,
    filename: string
): Promise<string> {
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')

    if (!fs.existsSync(tmpImagesFolderPath)) {
        fs.mkdirSync(tmpImagesFolderPath)
    }

    const filePath = path.join(tmpImagesFolderPath, filename)
    const buffer = Buffer.from(base64Data, 'base64')

    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, buffer, (err) => {
            if (err) {
                console.log('Error writing file:', err)
                return reject(false)
            } else {
                console.log('File saved successfully:', filePath)
                return resolve(filePath)
            }
        })
    })
}

const create = async (req: Request, res: Response) => {
    const {
        image,
        customer_code,
        measure_datetime,
        measure_type,
    }: {
        measure_type: MeasureType
        image: string
        customer_code: string
        measure_datetime: string
    } = req.body

    const fileManager = new GoogleAIFileManager(GEMINI_API_KEY as string)
    const promptText = `Return only the number value of the ${measure_type.toLocaleLowerCase() === 'water' ? 'water' : 'gas'} measure in cubic meters without any character but numbers. if it's not a measurer image, return 0.`
    const imageMime = getMimeType(image)
    const filename = `${customer_code}-${Date.now()}.${imageMime.split('/')[1]}`
    try {
        const filePath = await createTempImage(image, filename)
        const uploadResponse = await fileManager.uploadFile(filePath, {
            mimeType: imageMime,
            displayName: filename,
        })
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string)
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
        })
        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri,
                },
            },
            {
                text: promptText,
            },
        ])
        const measureValue = result.response.text().replace('\n', '')
        fileManager.deleteFile(uploadResponse.file.name)
        const data = await prisma.measure.create({
            data: {
                customer_code,
                measure_datetime: new Date(measure_datetime),
                measure_type,
                measure_value: measureValue,
                image_url: `http://localhost/images/${filename}`,
            },
        })

        res.status(200).json({
            image_url: data.image_url,
            measure_uuid: data.measure_uuid,
            measure_value: data.measure_value,
        })
    } catch (err) {
        console.log(err)
        res.status(400).json(err)
    }
    // fs.rm(path.join(tmpImagesFolderPath, filename), () => {})
}

const getImage = async (req: Request, res: Response) => {
    const imageId = req.params.id
    const filePath = path.join(tmpImagesFolderPath, imageId)
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err)
            res.status(500).send('Erro ao retornar imagem')
        }
    })
}

const confirm = async (req: Request, res: Response) => {
    console.log(req, res)
}

const deleteAllGeminiFiles = async (req: Request, res: Response) => {
    const fileManager = new GoogleAIFileManager(GEMINI_API_KEY as string)
    const { files } = await fileManager.listFiles()
    if (files) {
        const removePromises = files.map((item) => {
            fileManager.deleteFile(item.name)
        })
        await Promise.all(removePromises)
    }
    res.sendStatus(200)
}

const isValidMeasureType = (measure_type: any): measure_type is MeasureType => {
    const allowedMeasureTypes: MeasureType[] = ['gas', 'water']
    return allowedMeasureTypes.includes(measure_type)
}

const buildWhereObject = (
    customer_code: string,
    measure_type?: string
): ListWhereOptions => {
    const whereObject: ListWhereOptions = { customer_code }

    if (measure_type && isValidMeasureType(measure_type)) {
        whereObject.measure_type = measure_type.toLowerCase() as MeasureType
    }

    return whereObject
}

const list = async (req: Request, res: Response) => {
    const { customer_code } = req.params
    const { measure_type } = req.query as Record<string, string>

    const whereObject = buildWhereObject(customer_code, measure_type)

    if (measure_type && !whereObject.hasOwnProperty('measure_type')) {
        return res.status(400).json({
            error_code: 'INVALID_TYPE',
            error_description: 'Tipo de medição não permitida',
        })
    }

    try {
        const results = (await prisma.measure.findMany({
            where: whereObject as Prisma.MeasureWhereInput,
            select: {
                customer_code: false,
                measure_uuid: true,
                measure_datetime: true,
                measure_type: true,
                measure_value: true,
                has_confirmed: true,
                image_url: true,
            },
        })) as ListResults

        if (!results || !results.length) {
            return res.status(404).json({
                error_code: 'MEASURES_NOT_FOUND',
                error_description: 'Nenhuma leitura encontrada',
            })
        }

        const responseResults = {
            customer_code,
            measures: results,
        }

        return res.status(200).send(responseResults)
    } catch (err) {
        return res.status(500).json(err)
    }
}

export { create, confirm, list, getImage, deleteAllGeminiFiles }
