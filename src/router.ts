import express, { Router } from 'express'
import {
    create,
    list,
    deleteAllGeminiFiles,
    getImage,
} from './controllers/Measure'
import { validateUploadBody, canUserUpload } from './middlewares/validations'

const router: Router = express.Router()

router.get('/:customer_code/list', list)
router.get('/images/:id', getImage)
router.post('/upload', validateUploadBody, canUserUpload, create)
router.delete('/deleteFiles', deleteAllGeminiFiles) // for development use. if you want to delete all your gemini files after test.

export default router
