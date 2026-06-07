// Buscar Clube screens — CPF entry + club selection

const HERO = "assets/hero-runner.png";

function HeroLime({ panelTop }) {
  // lime background with the runner cutout sitting above the dark panel
  return (
    <React.Fragment>
      <div style={{ position: "absolute", inset: 0, background: "var(--lime)" }}></div>
      <div style={{
        position: "absolute",
        left: "50%",
        top: 18,
        transform: "translateX(-50%)",
        width: 430,
        height: panelTop + 70,
        backgroundImage: `url(${HERO})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "118% auto",
        backgroundPosition: "50% 4%"
      }}></div>
    </React.Fragment>);

}

function BuscarClube01({ onBuscar }) {
  const [cpf, setCpf] = React.useState("");
  const panelTop = 425;

  const fmt = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    let out = d;
    if (d.length > 3) out = d.slice(0, 3) + "." + d.slice(3);
    if (d.length > 6) out = d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
    if (d.length > 9) out = d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
    return out;
  };

  return (
    <div className="screen enter-fade">
      <HeroLime panelTop={panelTop} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>
        <StatusBar dark />
        <div style={{ flex: 1, width: "391px", height: "469px", opacity: "1", padding: "52px 0px 0px", margin: "0px" }}></div>
        <div style={{
          background: "#1A1A1A",
          borderRadius: "12px 12px 0 0",
          padding: "44px 35px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <h1 style={{ fontWeight: 700, fontSize: 20, color: "#fff", textAlign: "center" }}>
            Bem-vindo(a) ao <span style={{ color: "var(--lime)" }}>Athletto</span>
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.43, color: "#fff", textAlign: "center", marginTop: 12, maxWidth: 251 }}>
            Digite seu CPF para que possamos buscar seus clubes
          </p>

          <div style={{ width: "100%", marginTop: 34 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 8 }}>CPF do atleta</label>
            <input
              value={cpf}
              onChange={(e) => setCpf(fmt(e.target.value))}
              placeholder="Digite seu CPF"
              inputMode="numeric"
              style={{
                width: "100%",
                height: 50,
                borderRadius: 10,
                border: "1px solid #737373",
                background: "transparent",
                color: "#fff",
                fontSize: 15,
                padding: "0 16px",
                outline: "none"
              }} />
            
          </div>

          <button
            className="tap"
            onClick={() => onBuscar && onBuscar()}
            style={{
              width: "100%",
              height: 50,
              marginTop: 22,
              borderRadius: 10,
              background: "var(--lime)",
              color: "#1A1A1A",
              fontWeight: 700,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}>
            
            Buscar
            <Icon name="double_right" size={20} />
          </button>
        </div>
      </div>
    </div>);

}

const CLUBS = [
{ id: "berserkers", name: "Boa Vista Berserkers", cat: "Flag Football", logo: "assets/club-berserkers.png" },
{ id: "nornas", name: "Boa Vista Nornas", cat: "Flag Football", logo: "assets/club-nornas.png" }];


function BuscarClube02({ onSelect, onBack }) {
  const panelTop = 355;
  return (
    <div className="screen enter-fade">
      <HeroLime panelTop={panelTop} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>
        <StatusBar dark />
        <div style={{ flex: 1 }}></div>
        <div style={{
          background: "#1A1A1A",
          borderRadius: "12px 12px 0 0",
          padding: "40px 35px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="directions_run" size={30} color="var(--lime)" />
            <h1 style={{ fontWeight: 700, fontSize: 24, color: "#fff" }}>Atleta encontrado</h1>
          </div>
          <p style={{ fontSize: 14, color: "#fff", marginTop: 14 }}>Qual clube você deseja acessar?</p>

          <div style={{ width: "100%", marginTop: 32, display: "flex", flexDirection: "column", gap: 24 }}>
            {CLUBS.map((c) =>
            <button
              key={c.id}
              className="tap"
              onClick={() => onSelect && onSelect(c)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                width: "100%",
                padding: 16,
                borderRadius: 8,
                border: "1px solid #737373",
                background: "transparent",
                textAlign: "left"
              }}>
              
                <img src={c.logo} alt={c.name} style={{ width: 47, height: 47, borderRadius: "50%", objectFit: "cover", flex: "0 0 auto" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", lineHeight: 1.3 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: "#fff", marginTop: 2 }}>{c.cat}</div>
                </div>
                <Icon name="double_right" size={24} color="var(--lime)" />
              </button>
            )}
          </div>

          <button className="tap" onClick={onBack} style={{ marginTop: 40, marginRight: "auto", display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 14 }}>
            <Icon name="arrow_back" size={20} />
            Voltar
          </button>
        </div>
      </div>
    </div>);

}

const inputStyle = {
  width: "100%", height: 50, borderRadius: 10, border: "1px solid #737373",
  background: "transparent", color: "#fff", fontSize: 15, padding: "0 46px 0 16px", outline: "none"
};

function PwdField({ label, value, onChange, placeholder }) {
  const [show, setShow] = React.useState(false);
  return (
    <div style={{ width: "100%" }}>
      <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 8 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
        <button type="button" className="tap" onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex", color: "#B2B2B2" }}>
          <Icon name={show ? "visibility_off" : "visibility"} size={20} />
        </button>
      </div>
    </div>);

}

const primaryBtn = {
  width: "100%", height: 50, marginTop: 24, borderRadius: 10, background: "var(--lime)",
  color: "#1A1A1A", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 6
};

function CriarSenha({ club, onCreate, onBack }) {
  const [pwd, setPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [err, setErr] = React.useState("");
  const name = club ? club.name : "seu clube";

  const submit = () => {
    if (pwd.length < 4) {setErr("A senha precisa ter ao menos 4 caracteres.");return;}
    if (pwd !== confirm) {setErr("As senhas não coincidem.");return;}
    setErr("");
    onCreate && onCreate(pwd);
  };

  return (
    <div className="screen enter-fade">
      <HeroLime panelTop={300} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>
        <StatusBar dark />
        <div style={{ flex: 1 }}></div>
        <div style={{ background: "#1A1A1A", borderRadius: "12px 12px 0 0", padding: "36px 35px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="lock" size={26} color="var(--lime)" />
            <h1 style={{ fontWeight: 700, fontSize: 22, color: "#fff" }}>Crie sua senha</h1>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.43, color: "#fff", textAlign: "center", marginTop: 12, maxWidth: 270 }}>
            Primeiro acesso ao <span style={{ color: "var(--lime)", fontWeight: 600 }}>{name}</span>. Defina uma senha para entrar.
          </p>

          <div style={{ width: "100%", marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
            <PwdField label="Nova senha" value={pwd} onChange={(v) => {setPwd(v);setErr("");}} placeholder="Crie uma senha" />
            <PwdField label="Confirmar senha" value={confirm} onChange={(v) => {setConfirm(v);setErr("");}} placeholder="Repita a senha" />
          </div>

          {err && <p style={{ width: "100%", marginTop: 12, fontSize: 12, color: "#FF6B6B" }}>{err}</p>}

          <button className="tap" onClick={submit} style={primaryBtn}>
            Criar senha
            <Icon name="double_right" size={20} />
          </button>

          <button className="tap" onClick={onBack} style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 14 }}>
            <Icon name="arrow_back" size={20} />
            Voltar
          </button>
        </div>
      </div>
    </div>);

}

function Login({ club, onSubmit, onForgot, onBack }) {
  const [pwd, setPwd] = React.useState("");
  const name = club ? club.name : "seu clube";
  return (
    <div className="screen enter-fade">
      <HeroLime panelTop={345} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%" }}>
        <StatusBar dark />
        <div style={{ flex: 1 }}></div>
        <div style={{ background: "#1A1A1A", borderRadius: "12px 12px 0 0", padding: "38px 35px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {club && <img src={club.logo} alt={name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />}
          <h1 style={{ fontWeight: 700, fontSize: 22, color: "#fff", marginTop: 14, textAlign: "center" }}>Bem-vindo de volta</h1>
          <p style={{ fontSize: 14, lineHeight: 1.43, color: "#fff", textAlign: "center", marginTop: 10, maxWidth: 270 }}>
            Digite sua senha para acessar o <span style={{ color: "var(--lime)", fontWeight: 600 }}>{name}</span>
          </p>

          <div style={{ width: "100%", marginTop: 26 }}>
            <PwdField label="Senha" value={pwd} onChange={setPwd} placeholder="Sua senha" />
            <button className="tap" onClick={onForgot} style={{ marginTop: 10, marginLeft: "auto", display: "block", color: "var(--lime)", fontSize: 13, fontWeight: 600 }}>
              Esqueci minha senha
            </button>
          </div>

          <button className="tap" onClick={() => onSubmit && onSubmit()} style={{ ...primaryBtn, marginTop: 18 }}>
            Entrar
            <Icon name="double_right" size={20} />
          </button>

          <button className="tap" onClick={onBack} style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 14 }}>
            <Icon name="arrow_back" size={20} />
            Trocar de clube
          </button>
        </div>
      </div>
    </div>);

}

function ResetEnviado({ club, onUnderstood }) {
  const name = club ? club.name : "seu clube";
  return (
    <div className="screen enter-fade" style={{ background: "#1A1A1A" }}>
      <StatusBar light />
      <button className="tap" onClick={onUnderstood} style={{ position: "absolute", top: 56, left: 24, zIndex: 10, display: "flex", color: "#fff" }}>
        <Icon name="arrow_back" size={24} />
      </button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 36px", textAlign: "center" }}>
        <div style={{ width: 92, height: 92, borderRadius: "50%", background: "rgba(199,239,102,0.14)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
          <Icon name="lock_reset" size={48} color="var(--lime)" />
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 24, color: "#fff" }}>Solicitação enviada</h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: "#B2B2B2", marginTop: 16, maxWidth: 300 }}>
          Avisamos o gestor do <span style={{ color: "var(--lime)", fontWeight: 600 }}>{name}</span> para redefinir sua senha.
        </p>

        <div style={{ width: "100%", marginTop: 24, background: "#242424", border: "1px solid var(--lime)", borderRadius: 12, padding: 16, display: "flex", gap: 12, textAlign: "left", alignItems: "flex-start" }}>
          <Icon name="error" size={20} color="var(--lime)" style={{ flex: "0 0 auto", marginTop: 1 }} />
          <span style={{ fontSize: 13, lineHeight: 1.5, color: "#fff" }}>
            Assim que o gestor liberar, você receberá um aviso no app para criar uma nova senha e acessar.
          </span>
        </div>

        <button className="tap" onClick={onUnderstood} style={{ ...primaryBtn, marginTop: 32 }}>
          Entendi
        </button>
      </div>
      <div className="home-indicator"><div className="bar"></div></div>
    </div>);

}

Object.assign(window, { BuscarClube01, BuscarClube02, CriarSenha, Login, ResetEnviado });