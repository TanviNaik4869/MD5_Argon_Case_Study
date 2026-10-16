
import { useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

export default function App() {
  const [page, setPage] = useState("Home");
  const [password, setPassword] = useState("password123");
  const [md5Hash, setMd5Hash] = useState("");
  const [argonHash, setArgonHash] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function callApi(path, body) {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail?.[0]?.msg || "Request failed");
      }

      setResult(data);
      if (path === "/api/md5") setMd5Hash(data.hash);
      if (path === "/api/argon2/hash") setArgonHash(data.hash);
    } catch (e) {
      setError(e.message + ". Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const pages = ["Home", "MD5 Analyzer", "Cracking Lab",
    "Secure Storage", "Analysis Report"];

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>◈ CryptoLab</h2>
        <p className="muted">PASSWORD SECURITY ANALYZER</p>
        {pages.map((item) => (
          <button key={item}
            className={page === item ? "nav active" : "nav"}
            onClick={() => {
              setPage(item);
              setResult(null);
              setError("");
            }}>
            {item}
          </button>
        ))}
        <p className="muted footer">● LOCAL EDUCATIONAL LAB</p>
      </aside>

      <main>
        <header>
          <p className="muted">CRYPTOGRAPHIC WEAKNESS CASE STUDY</p>
          <h1>{page}</h1>
        </header>

        {page === "Home" && (
          <>
            <section className="hero">
              <p className="muted">PASSWORD SECURITY LAB</p>
              <h2>Understand the weakness. Build the defense.</h2>
              <p>Explore why MD5 is unsuitable for password storage
                and how Argon2id improves password security.</p>
              <button className="primary"
                onClick={() => setPage("MD5 Analyzer")}>
                Start experiment →
              </button>
            </section>
            <div className="cards">
              <section className="panel"><small>LEGACY</small>
                <h2>MD5</h2><p>Fast and unsuitable for passwords</p>
              </section>
              <section className="panel"><small>RECOMMENDED</small>
                <h2>Argon2id</h2><p>Modern password hashing</p>
              </section>
              <section className="panel"><small>ENVIRONMENT</small>
                <h2>Local</h2><p>Artificial test data only</p>
              </section>
            </div>
          </>
        )}

        {page === "MD5 Analyzer" && (
          <section className="panel">
            <h2>Generate an MD5 hash</h2>
            <p>MD5 is demonstrated for learning only. Never use it
              for real password storage.</p>
            <label>Sample password</label>
            <input value={password} maxLength={128}
              onChange={e => setPassword(e.target.value)} />
            <button className="primary" disabled={loading || !password}
              onClick={() => callApi("/api/md5", { password })}>
              Generate hash
            </button>
            {md5Hash && <div className="hash">
              <small>MD5 HASH</small><code>{md5Hash}</code>
              <button className="secondary"
                onClick={() => { setPage("Cracking Lab"); setResult(null); }}>
                Test this hash →
              </button>
            </div>}
          </section>
        )}

        {page === "Cracking Lab" && (
          <section className="panel">
            <h2>Dictionary attack simulator</h2>
            <p>Checks a generated test hash against a small,
              fixed educational wordlist.</p>
            <label>MD5 hash</label>
            <input value={md5Hash} maxLength={32}
              placeholder="Generate a hash in MD5 Analyzer"
              onChange={e => setMd5Hash(e.target.value)} />
            <button className="primary"
              disabled={loading || !/^[a-fA-F0-9]{32}$/.test(md5Hash)}
              onClick={() => callApi("/api/crack", { md5_hash: md5Hash })}>
              Run dictionary test
            </button>
          </section>
        )}

        {page === "Secure Storage" && (
          <section className="panel">
            <h2>Argon2id password storage</h2>
            <p>Generate a salted password hash and test verification.</p>
            <label>Sample password</label>
            <input type="password" value={password} maxLength={128}
              onChange={e => setPassword(e.target.value)} />
            <button className="primary" disabled={loading || !password}
              onClick={() => callApi("/api/argon2/hash", { password })}>
              Generate Argon2id hash
            </button>
            {argonHash && <>
              <div className="hash"><small>ENCODED HASH</small>
                <code>{argonHash}</code></div>
              <label>Password to verify</label>
              <input type="password" value={verifyPassword}
                maxLength={128}
                onChange={e => setVerifyPassword(e.target.value)} />
              <button className="secondary"
                disabled={loading || !verifyPassword}
                onClick={() => callApi("/api/argon2/verify", {
                  password: verifyPassword, password_hash: argonHash
                })}>
                Verify password
              </button>
            </>}
          </section>
        )}

        {page === "Analysis Report" && (
          <section className="panel report">
            <h2>Case study findings</h2>
            <h3>Q1. Why is MD5 insecure?</h3>
            <p>MD5 is extremely fast and unsuitable for password storage.
              Unsalted hashes enable comparisons of reused passwords,
              while fast hashing makes guessing attacks easier. MD5 also
              has known collision weaknesses.</p>
            <h3>Q2. Recommended solution</h3>
            <p>Use Argon2id with unique salts and appropriate memory
              and time costs. bcrypt and PBKDF2 are alternatives when
              configured correctly.</p>
            <h3>Limitations</h3>
            <p>The demonstration uses artificial data and a small wordlist.
              Failure to find a match does not prove a password is secure.</p>
            <button className="secondary" onClick={() => window.print()}>
              Print / Save report
            </button>
          </section>
        )}

        {loading && <p className="notice">Processing…</p>}
        {error && <section className="result error">{error}</section>}
        {result && <section className={
          "result " + (result.found || result.verified ? "success" : "")
        }>
          <h3>{result.found ? "Password recovered in test wordlist" :
            result.verified === true ? "Password verified" :
            result.verified === false ? "Verification failed" :
            result.algorithm ? result.algorithm + " result" :
            "Dictionary test complete"}</h3>
          {result.hash && <code>{result.hash}</code>}
          {result.found && <p>Matched candidate: <b>{result.password}</b></p>}
          {result.attempts !== undefined && <p>Candidates tested: {result.attempts}</p>}
          {result.message && <p>{result.message}</p>}
          {result.warning && <p>{result.warning}</p>}
        </section>}

        <footer>CryptoLab · Educational use · Local environment</footer>
      </main>
    </div>
  );
}
