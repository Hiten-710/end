import express from "express";
import { getCandidates } from "../store/candidateStore.js";
import { buildAiPrompt, matchCandidates } from "../utils/matching.js";

const router = express.Router();

router.post("/shortlist", async (req, res, next) => {
  try {
    const candidates = await getCandidates();
    const basicRanking = matchCandidates(candidates, req.body);

    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === "YOUR_OPENROUTER_API_KEY") {
      return res.status(400).json({
        message: "OPENROUTER_API_KEY is not configured in backend/.env.",
        candidates: basicRanking
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
        "X-Title": "Candidate Shortlisting System"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-5.2",
        messages: [{ role: "user", content: buildAiPrompt(basicRanking, req.body) }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(response.status).json({
        message: "OpenRouter request failed.",
        details,
        candidates: basicRanking
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const aiResult = JSON.parse(content);
    const recommendationMap = new Map(
      (aiResult.recommendations || []).map((item) => [String(item.email).toLowerCase(), item])
    );

    const aiRankedCandidates = basicRanking
      .map((candidate) => {
        const ai = recommendationMap.get(String(candidate.email).toLowerCase());
        return {
          ...candidate,
          aiScore: ai?.aiScore ?? candidate.matchScore,
          aiRecommendation: ai?.recommendation || candidate.matchLevel,
          aiExplanation: ai?.explanation || "AI did not provide a separate explanation.",
          interviewQuestions: ai?.interviewQuestions || []
        };
      })
      .sort((a, b) => b.aiScore - a.aiScore || b.matchScore - a.matchScore);

    return res.json({ candidates: aiRankedCandidates });
  } catch (error) {
    return next(error);
  }
});

export default router;
