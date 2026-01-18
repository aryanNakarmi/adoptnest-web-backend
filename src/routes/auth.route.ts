import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register)
router.post("/login", authController.login)

//user routes

router.get("/",authController.getAllUsers)
router.get("/:id",authController.getUserById)
router.delete("/:id",authController.deleteUser)


export default router;