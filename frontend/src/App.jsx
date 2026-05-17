import {
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Database,
  Filter,
  Save,
  Search,
  Send,
  Sparkles,
  UserPlus,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const emptyCandidate = {
  name: "",
  email: "",
  skills: "",
  experience: "",
  bio: "",
  projects: ""
};

const emptyJob = {
  requiredSkills: "React, Node.js",
  preferredSkills: "MongoDB, AWS",
  minExperience: 1
};

function toSkillArray(value) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function App() {
  const [candidateForm, setCandidateForm] = useState(emptyCandidate);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [candidates, setCandidates] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem("savedShortlist") || "[]"));
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const stats = useMemo(() => {
    const skills = new Set(candidates.flatMap((candidate) => candidate.skills || []));
    const avgExperience = candidates.length
      ? (candidates.reduce((sum, candidate) => sum + Number(candidate.experience || 0), 0) / candidates.length).toFixed(1)
      : "0";
    return { skills: skills.size, avgExperience };
  }, [candidates]);

  async function fetchCandidates() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (skillFilter) params.set("skill", skillFilter);
    const response = await fetch(`${API_URL}/api/candidates?${params.toString()}`);
    const data = await response.json();
    setCandidates(data);
  }

  useEffect(() => {
    fetchCandidates().catch(() => setNotice("Unable to load candidates. Check that the backend is running."));
  }, []);

  useEffect(() => {
    localStorage.setItem("savedShortlist", JSON.stringify(saved));
  }, [saved]);

  async function handleCandidateSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setNotice("");

    try {
      const response = await fetch(`${API_URL}/api/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...candidateForm,
          skills: toSkillArray(candidateForm.skills),
          experience: Number(candidateForm.experience)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not add candidate.");
      setCandidateForm(emptyCandidate);
      setNotice(`${data.name} added to the talent pool.`);
      setCandidates((current) => [data, ...current.filter((item) => item.email !== data.email)]);
      await fetchCandidates();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function runMatch(useAi = false) {
    setLoading(true);
    setNotice("");
    const endpoint = useAi ? "/api/ai/shortlist" : "/api/match";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkills: toSkillArray(jobForm.requiredSkills),
          preferredSkills: toSkillArray(jobForm.preferredSkills),
          minExperience: Number(jobForm.minExperience)
        })
      });
      const data = await response.json();
      if (!response.ok && !data.candidates) throw new Error(data.message || "Matching failed.");
      setShortlisted(data.candidates || []);
      setNotice(data.message || (useAi ? "AI shortlist is ready." : "Basic shortlist is ready."));
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  function saveCandidate(candidate) {
    setSaved((current) => {
      if (current.some((item) => item.email === candidate.email)) return current;
      return [...current, candidate];
    });
    setNotice(`${candidate.name} saved to shortlist.`);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={16} /> OpenRouter AI powered hiring</div>
          <h1>TalentMatch AI</h1>
          <p>
            Rank candidates by skills, experience, project context, and AI recruiter insight in one fast dashboard.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={() => runMatch(false)} disabled={loading}>
              <BriefcaseBusiness size={18} /> Basic Match
            </button>
            <button className="shine-btn" onClick={() => runMatch(true)} disabled={loading}>
              <Bot size={18} /> AI Shortlist
            </button>
          </div>
        </div>
        <div className="signal-panel">
          <div><Users size={22} /><strong>{candidates.length}</strong><span>Candidates</span></div>
          <div><Database size={22} /><strong>{stats.skills}</strong><span>Unique skills</span></div>
          <div><CheckCircle2 size={22} /><strong>{stats.avgExperience}</strong><span>Avg years</span></div>
        </div>
      </section>

      {notice && <div className="notice">{notice}</div>}

      <section className="grid-layout">
        <form className="panel form-panel" onSubmit={handleCandidateSubmit}>
          <div className="section-title"><UserPlus size={20} /><h2>Add Candidate</h2></div>
          <input placeholder="Name" value={candidateForm.name} onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })} />
          <input placeholder="Email" type="email" value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} />
          <input placeholder="Skills: React, Node.js, MongoDB" value={candidateForm.skills} onChange={(e) => setCandidateForm({ ...candidateForm, skills: e.target.value })} />
          <input placeholder="Experience in years" type="number" min="0" value={candidateForm.experience} onChange={(e) => setCandidateForm({ ...candidateForm, experience: e.target.value })} />
          <textarea placeholder="Bio" value={candidateForm.bio} onChange={(e) => setCandidateForm({ ...candidateForm, bio: e.target.value })} />
          <textarea placeholder="Projects" value={candidateForm.projects} onChange={(e) => setCandidateForm({ ...candidateForm, projects: e.target.value })} />
          <button className="primary-btn full" disabled={loading}><Send size={18} /> Add Candidate</button>
        </form>

        <div className="panel form-panel">
          <div className="section-title"><BriefcaseBusiness size={20} /><h2>Job Requirement</h2></div>
          <input placeholder="Required skills" value={jobForm.requiredSkills} onChange={(e) => setJobForm({ ...jobForm, requiredSkills: e.target.value })} />
          <input placeholder="Preferred skills" value={jobForm.preferredSkills} onChange={(e) => setJobForm({ ...jobForm, preferredSkills: e.target.value })} />
          <input placeholder="Minimum experience" type="number" min="0" value={jobForm.minExperience} onChange={(e) => setJobForm({ ...jobForm, minExperience: e.target.value })} />
          <div className="button-row">
            <button className="primary-btn" onClick={() => runMatch(false)} disabled={loading}><Filter size={18} /> Match</button>
            <button className="shine-btn" onClick={() => runMatch(true)} disabled={loading}><Bot size={18} /> Ask AI</button>
          </div>
          <div className="saved-box">
            <strong>{saved.length}</strong>
            <span>saved candidates</span>
          </div>
        </div>
      </section>

      <section className="toolbar">
        <div className="search-box"><Search size={18} /><input placeholder="Search candidates" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="search-box"><Filter size={18} /><input placeholder="Filter by skill" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} /></div>
        <button className="ghost-btn" onClick={fetchCandidates}>Apply</button>
      </section>

      <section className="content-grid">
        <div>
          <div className="section-title"><Users size={20} /><h2>Candidate List</h2></div>
          <div className="card-list">
            {candidates.map((candidate) => (
              <article className="candidate-card" key={candidate._id || candidate.email}>
                <div>
                  <h3>{candidate.name}</h3>
                  <p>{candidate.email}</p>
                </div>
                <div className="chips">{candidate.skills?.map((skill) => <span key={skill}>{skill}</span>)}</div>
                <small>{candidate.experience} years experience</small>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="section-title"><Sparkles size={20} /><h2>Shortlisted Candidates</h2></div>
          <div className="card-list">
            {shortlisted.map((candidate) => (
              <article className="candidate-card result-card" key={candidate._id || candidate.email}>
                <div className="score-line">
                  <div>
                    <h3>{candidate.name}</h3>
                    <p>{candidate.matchLevel} match · {candidate.experience} years</p>
                  </div>
                  <strong>{candidate.aiScore ?? candidate.matchScore}%</strong>
                </div>
                <div className="score-bar"><span style={{ width: `${candidate.aiScore ?? candidate.matchScore}%` }} /></div>
                <div className="chips">
                  {(candidate.matchedSkills || []).map((skill) => <span className="matched" key={skill}>{skill}</span>)}
                </div>
                <p className="ai-text">{candidate.aiExplanation || "Basic match ranked by required skills, preferred skills, and experience."}</p>
                {candidate.interviewQuestions?.length > 0 && (
                  <div className="questions">
                    {candidate.interviewQuestions.map((question) => <p key={question}>{question}</p>)}
                  </div>
                )}
                <button className="ghost-btn full" onClick={() => saveCandidate(candidate)}><Save size={17} /> Save Shortlist</button>
              </article>
            ))}
            {!shortlisted.length && <div className="empty-state">Run a basic or AI match to see ranked candidates.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
