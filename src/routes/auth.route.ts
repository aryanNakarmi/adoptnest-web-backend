import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { protect } from "../middleware/authorized.middleware";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register)
router.post("/login", authController.login)

//user routes

router.get("/", protect,authController.getAllUsers)
router.get("/:id",protect,authController.getUserById)
router.delete("/:id",protect,authController.deleteUser)


export default router;