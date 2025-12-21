import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/LoginPage.css';
import bookphoto from '../assets/bookphoto2.jpeg';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // "login" | "signup"
  const isSignup = mode === 'signup';
  const navigate = useNavigate();

  // login inputs
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState('');

  // signup inputs (matches your customers table needs)
  const [suUsername, setSuUsername] = useState('');
  const [suFirst, setSuFirst] = useState('');
  const [suLast, setSuLast] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suAddress, setSuAddress] = useState('');
  const [suPass, setSuPass] = useState('');
  const [suPass2, setSuPass2] = useState('');
  const [suErr, setSuErr] = useState('');

  const bgStyle = useMemo(
    () => ({
      backgroundImage: `url(${bookphoto})`,
    }),
    []
  );

  const switchToLogin = () => {
    setMode('login');
    setLoginErr('');
    setSuErr('');
  };

  const switchToSignup = () => {
    setMode('signup');
    setLoginErr('');
    setSuErr('');
  };

  const onLoginSubmit = (e) => {
    e.preventDefault();
    setLoginErr('');

    const u = loginUser.trim().toLowerCase();
    const p = loginPass;

    // TEMP demo auth until backend
    if (u === 'ahmed' && p === '1234') {
      localStorage.setItem('auth_user', 'ahmed');
      localStorage.setItem('auth_ok', '1');
      navigate('/books');
      return;
    }

    setLoginErr('Wrong username or password.');
  };

  const onSignupSubmit = (e) => {
    e.preventDefault();
    setSuErr('');

    if (suPass.length < 4) {
      setSuErr('Password must be at least 4 characters.');
      return;
    }

    if (suPass !== suPass2) {
      setSuErr('Passwords do not match.');
      return;
    }

    // TEMP until backend is connected
    alert('For now use: ahmed / 1234');

    // optional reset
    setSuUsername('');
    setSuFirst('');
    setSuLast('');
    setSuEmail('');
    setSuPhone('');
    setSuAddress('');
    setSuPass('');
    setSuPass2('');

    switchToLogin();
  };

  return (
    <div className="authPage" style={bgStyle}>
      <div className="authOverlay" />

      <div className={`authCard ${isSignup ? 'isSignup' : ''}`}>
        <div className="authTop">
          <div className="authBrand">
            <span className="authDot" />
            <span className="authBrandText">BookStore</span>
          </div>

          <div className="authQuickActions">
            <button
              className={`authPill ${!isSignup ? 'active' : ''}`}
              onClick={switchToLogin}
              type="button"
            >
              Login
            </button>
            <button
              className={`authPill ${isSignup ? 'active' : ''}`}
              onClick={switchToSignup}
              type="button"
            >
              Sign up
            </button>
          </div>
        </div>

        <div className="authBody">
          <section className="authPanel authPanelLeft">
            {/* LOGIN */}
            <div className={`authFormWrap ${!isSignup ? 'show' : 'hide'}`}>
              <h1 className="authTitle">Welcome back</h1>
              <p className="authSub">
                Use demo credentials for now: <b>ahmed</b> / <b>1234</b>
              </p>

              <form className="authForm" onSubmit={onLoginSubmit}>
                <label className="authLabel">
                  Username
                  <input
                    className="authInput"
                    type="text"
                    placeholder="ahmed"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    required
                  />
                </label>

                <label className="authLabel">
                  Password
                  <input
                    className="authInput"
                    type="password"
                    placeholder="1234"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    required
                  />
                </label>

                <div className="authRow">
                  <label className="authCheck">
                    <input type="checkbox" />
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="authLinkBtn"
                    onClick={() => alert('Forgot password (later)')}
                  >
                    Forgot?
                  </button>
                </div>

                {loginErr ? <div className="authError">{loginErr}</div> : null}

                <button className="authBtnPrimary" type="submit">
                  Login
                </button>

                <p className="authHint">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    className="authInlineBtn"
                    onClick={switchToSignup}
                  >
                    Create one
                  </button>
                </p>
              </form>
            </div>

            {/* SIGNUP */}
            <div className={`authFormWrap ${isSignup ? 'show' : 'hide'}`}>
              <h1 className="authTitle">Create account</h1>

              <form className="authForm" onSubmit={onSignupSubmit}>
                {/* SECTION 1: Account */}
                <div className="authSection">
                  <div className="authSectionTitle">Account</div>

                  <div className="authGrid2">
                    <label className="authLabel">
                      Username
                      <input
                        className="authInput"
                        type="text"
                        placeholder="ahmed"
                        value={suUsername}
                        onChange={(e) => setSuUsername(e.target.value)}
                        required
                      />
                    </label>

                    <label className="authLabel">
                      Email
                      <input
                        className="authInput"
                        type="email"
                        placeholder="ahmed@example.com"
                        value={suEmail}
                        onChange={(e) => setSuEmail(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                </div>

                {/* SECTION 2: Profile */}
                <div className="authSection">
                  <div className="authSectionTitle">Profile</div>

                  <div className="authGrid2">
                    <label className="authLabel">
                      First name
                      <input
                        className="authInput"
                        type="text"
                        placeholder="Ahmed"
                        value={suFirst}
                        onChange={(e) => setSuFirst(e.target.value)}
                        required
                      />
                    </label>

                    <label className="authLabel">
                      Last name
                      <input
                        className="authInput"
                        type="text"
                        placeholder="Sameh"
                        value={suLast}
                        onChange={(e) => setSuLast(e.target.value)}
                        required
                      />
                    </label>
                  </div>

                  <label className="authLabel">
                    Phone
                    <input
                      className="authInput"
                      type="tel"
                      placeholder="+20 01000000000"
                      value={suPhone}
                      onChange={(e) => setSuPhone(e.target.value)}
                      required
                    />
                  </label>
                </div>

                {/* SECTION 3: Delivery */}
                <div className="authSection">
                  <div className="authSectionTitle">Delivery</div>

                  <label className="authLabel">
                    Shipping address
                    <textarea
                      className="authTextarea"
                      placeholder="Alexandria, Egypt"
                      value={suAddress}
                      onChange={(e) => setSuAddress(e.target.value)}
                      rows={3}
                      required
                    />
                  </label>
                </div>

                {/* SECTION 4: Security */}
                <div className="authSection">
                  <div className="authSectionTitle">Security</div>

                  <div className="authGrid2">
                    <label className="authLabel">
                      Password
                      <input
                        className="authInput"
                        type="password"
                        placeholder="Create a password"
                        value={suPass}
                        onChange={(e) => setSuPass(e.target.value)}
                        required
                      />
                    </label>

                    <label className="authLabel">
                      Confirm password
                      <input
                        className="authInput"
                        type="password"
                        placeholder="Repeat password"
                        value={suPass2}
                        onChange={(e) => setSuPass2(e.target.value)}
                        required
                      />
                    </label>
                  </div>
                </div>

                {suErr ? <div className="authError">{suErr}</div> : null}

                <button className="authBtnPrimary" type="submit">
                  Create account
                </button>

                <p className="authHint">
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="authInlineBtn"
                    onClick={switchToLogin}
                  >
                    Login
                  </button>
                </p>
              </form>
            </div>
          </section>

          <aside className="authPanel authPanelRight">
            <div className="authRightInner">
              <div className="authRightBadge">Prototype Mode</div>

              <h2 className="authRightTitle">
                {isSignup ? 'Already a member?' : 'New here?'}
              </h2>
              <p className="authRightSub">
                {isSignup
                  ? 'Switch back to login and continue.'
                  : 'Create an account.'}
              </p>

              <button
                className="authBtnGhost"
                type="button"
                onClick={isSignup ? switchToLogin : switchToSignup}
              >
                {isSignup ? 'Go to Login' : 'Create account'}
              </button>

              <div className="authRightFooter">
                <span className="authTiny">user: ahmed</span>
                <span className="authTiny">pass: 1234</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
