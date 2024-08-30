import express, { Router } from 'express'
import { list } from './controllers/Measure'

const router: Router = express.Router()

router.get('/:customer_code/list', list)

export default router
