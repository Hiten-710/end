import crypto from "node:crypto";
import Candidate from "../models/Candidate.js";
import { normalizeSkills } from "../utils/matching.js";

const memoryCandidates = [];

function isMongoReady() {
  return Candidate.db.readyState === 1;
}

function normalizeCandidateInput(input) {
  return {
    name: input.name,
    email: String(input.email || "").toLowerCase().trim(),
    skills: normalizeSkills(input.skills || []),
    experience: Number(input.experience || 0),
    bio: input.bio || "",
    projects: input.projects || ""
  };
}

function matchesSearch(candidate, search) {
  if (!search) return true;
  const text = [
    candidate.name,
    candidate.email,
    candidate.bio,
    candidate.projects,
    ...(candidate.skills || [])
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(search.toLowerCase());
}

function matchesSkill(candidate, skill) {
  if (!skill) return true;
  return (candidate.skills || []).some((candidateSkill) =>
    candidateSkill.toLowerCase().includes(skill.toLowerCase())
  );
}

export async function createCandidate(input) {
  const candidate = normalizeCandidateInput(input);

  if (isMongoReady()) {
    const savedCandidate = await Candidate.create(candidate);
    return savedCandidate.toObject();
  }

  if (memoryCandidates.some((item) => item.email === candidate.email)) {
    const error = new Error("A candidate with this email already exists.");
    error.code = 11000;
    throw error;
  }

  const now = new Date().toISOString();
  const memoryCandidate = {
    _id: crypto.randomUUID(),
    ...candidate,
    createdAt: now,
    updatedAt: now
  };
  memoryCandidates.unshift(memoryCandidate);
  return memoryCandidate;
}

export async function getCandidates(filters = {}) {
  const { search = "", skill = "" } = filters;

  if (isMongoReady()) {
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
        { projects: { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } }
      ];
    }

    if (skill) {
      query.skills = { $regex: skill, $options: "i" };
    }

    return Candidate.find(query).sort({ createdAt: -1 }).lean();
  }

  return memoryCandidates.filter(
    (candidate) => matchesSearch(candidate, search) && matchesSkill(candidate, skill)
  );
}

export function getStorageMode() {
  return isMongoReady() ? "mongodb" : "memory";
}
