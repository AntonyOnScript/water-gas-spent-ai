import { Request, Response } from "express"
import { PrismaClient, Prisma, PrismaPromise } from '@prisma/client'

const prisma = new PrismaClient()

interface ListWhereOptions {
    customer_code: String,
    measure_type?: 'gas' | 'water'
}

type ListResults = Omit<Prisma.MeasureCreateInput[] , 'customer_code'>

const create = (req: Request, res: Response) => {
    console.log(req, res)
}

const confirm = (req: Request, res: Response) => {
    console.log(req, res)
}

const isValidMeasureType = (measure_type: any): measure_type is ListWhereOptions['measure_type'] => {
    const allowedMeasureTypes: ListWhereOptions['measure_type'][] = ['gas', 'water']
    return allowedMeasureTypes.includes(measure_type)
}

const buildWhereObject = (customer_code: string, measure_type?: string): ListWhereOptions => {
    const whereObject: ListWhereOptions = { customer_code }

    if (measure_type && isValidMeasureType(measure_type)) {
        whereObject.measure_type = measure_type.toLowerCase() as ListWhereOptions['measure_type']
    }

    return whereObject
}

const list = async (req: Request, res: Response) => {
    const { customer_code } = req.params
    const { measure_type } = req.query as Record<string, string>  
    
    const whereObject = buildWhereObject(customer_code, measure_type)

    if (measure_type && !whereObject.hasOwnProperty('measure_type')) {
        return res.status(400).json({
            error_code: "INVALID_TYPE",
            error_description: "Tipo de medição não permitida"
        })
    }

    try {
        const results = await prisma.measure.findMany({
            where: whereObject as Prisma.MeasureWhereInput,
            select: {
                customer_code: false,
                measure_uuid: true,
                measure_datetime: true,
                measure_type: true,
                measure_value: true,
                has_confirmed: true,
                image_url: true,
            }
        }) as ListResults
    
        if (!results || !results.length) {
            return res.status(404).json({
                error_code: "MEASURES_NOT_FOUND",
                error_description: "Nenhuma leitura encontrada"
            })
        }
    
        const responseResults = {
            customer_code,
            measures: results
        }
        
        return res.status(200).send(responseResults)
    } catch(err) {
        return res.status(500).json(err)
    } 
}

export {
    create,
    confirm,
    list
}