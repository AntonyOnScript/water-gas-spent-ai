import express from 'express'
import router from './router'

const app = express()
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

console.log('GEMINI_API_KEY: ', GEMINI_API_KEY)

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(router)

app.listen(3000, () => {
    console.log('Api running!')
})
