const normalize = (value) => String(value || "").trim().toLowerCase();

export function normalizeSkills(skills = []) {
  return [...new Set(skills.map((skill) => skill.trim()).filter(Boolean))];
}

export function matchCandidates(candidates, job) {
  const requiredSkills = normalizeSkills(job.requiredSkills || []);
  const preferredSkills = normalizeSkills(job.preferredSkills || []);
  const minExperience = Number(job.minExperience || 0);

  return candidates
    .map((candidate) => {
      const skillMap = new Map(candidate.skills.map((skill) => [normalize(skill), skill]));
      const matchedSkills = requiredSkills.filter((skill) => skillMap.has(normalize(skill)));
      const matchedPreferredSkills = preferredSkills.filter((skill) =>
        skillMap.has(normalize(skill))
      );

      const requiredScore = requiredSkills.length
        ? matchedSkills.length / requiredSkills.length
        : 1;
      const preferredScore = preferredSkills.length
        ? matchedPreferredSkills.length / preferredSkills.length
        : 0;
      const experienceMatch = candidate.experience >= minExperience;
      const experienceScore = experienceMatch
        ? 1
        : Math.max(0, candidate.experience / Math.max(minExperience, 1));

      const weightedScore = requiredScore * 0.7 + experienceScore * 0.2 + preferredScore * 0.1;
      const matchScore = Math.round(weightedScore * 100);

      let matchLevel = "Low";
      if (matchScore >= 75 && experienceMatch) matchLevel = "High";
      else if (matchScore >= 45) matchLevel = "Medium";

      return {
        ...candidate,
        matchedSkills,
        matchedPreferredSkills,
        missingSkills: requiredSkills.filter((skill) => !skillMap.has(normalize(skill))),
        preferredSkillsMatched: matchedPreferredSkills,
        experienceMatch,
        matchScore,
        matchLevel
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || b.experience - a.experience);
}

export function buildAiPrompt(candidates, job) {
  const requiredSkills = normalizeSkills(job.requiredSkills || []).join(", ") || "Not specified";
  const preferredSkills = normalizeSkills(job.preferredSkills || []).join(", ") || "Not specified";
  const minExperience = Number(job.minExperience || 0);

  const candidateLines = candidates
    .map((candidate, index) => {
      const bio = candidate.bio ? ` Bio: ${candidate.bio}` : "";
      const projects = candidate.projects ? ` Projects: ${candidate.projects}` : "";
      return `${index + 1}. ${candidate.name} (${candidate.email}) - Skills: ${candidate.skills.join(", ")} - Experience: ${candidate.experience} years.${bio}${projects}`;
    })
    .join("\n");

  return `
You are an expert technical recruiter.

Job requirement:
- Required skills: ${requiredSkills}
- Preferred skills: ${preferredSkills}
- Minimum experience: ${minExperience}+ years

Candidates:
${candidateLines}

Rank the best-fit candidates. Consider skill relevance, related technologies, experience, project/bio evidence, and growth potential.
Return only valid JSON in this shape:
{
  "recommendations": [
    {
      "email": "candidate email",
      "aiScore": 0-100,
      "recommendation": "High | Medium | Low",
      "explanation": "short recruiter-friendly explanation",
      "interviewQuestions": ["question 1", "question 2", "question 3"]
    }
  ]
}
`;
}
