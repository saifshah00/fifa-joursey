import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jerseysRouter from "./jerseys";
import ordersRouter from "./orders";
import otpRouter from "./otp";
import paymentsRouter from "./payments";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jerseysRouter);
router.use(ordersRouter);
router.use(otpRouter);
router.use(paymentsRouter);
router.use(adminRouter);

export default router;
