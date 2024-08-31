import express from 'express'
import router from './router'

const app = express()

// limit's default is 100kb. too low for an image base64.
app.use(express.urlencoded({ limit: '80mb', extended: true }))
app.use(express.json({ limit: '80mb' }))
app.use(router)

app.listen(3000, () => {
    console.log('Api running!')
})
