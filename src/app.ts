import express, { Request, Response } from 'express'
const app = express()
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

app.get('/', (req: Request, res: Response) => {
    res.status(201).send('Hi')
})

console.log('GEMINI_API_KEY: ', GEMINI_API_KEY)

app.listen(3000, () => {
    console.log('Api running!')
})