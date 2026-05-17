import express from "express";
import { createCandidate, getCandidates, getStorageMode } from "../store/candidateStore.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { name, email, skills = [], experience, bio = "", projects = "" } = req.body;

    if (!name || !email || experience === undefined) {
      return res.status(400).json({ message: "Name, email, and experience are required." });
    }

    const candidate = await createCandidate({ name, email, skills, experience, bio, projects });

    return res.status(201).json({ ...candidate, storageMode: getStorageMode() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A candidate with this email already exists." });
    }
    return next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const candidates = await getCandidates(req.query);
    return res.json(candidates);
  } catch (error) {
    return next(error);
  }
});

export default router;
