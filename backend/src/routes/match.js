import express from "express";
import { getCandidates } from "../store/candidateStore.js";
import { matchCandidates } from "../utils/matching.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const candidates = await getCandidates();
    const rankedCandidates = matchCandidates(candidates, req.body);
    return res.json({ candidates: rankedCandidates });
  } catch (error) {
    return next(error);
  }
});

export default router;
