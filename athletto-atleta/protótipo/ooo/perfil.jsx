// Perfil — dados do atleta, preferências e ações
// Identidade: header lime (como a Home), cards #242424, acento lime, ícone em chip.

function InfoRow({ icon, label, value, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(199,239,102,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
        <Icon name={icon} size={19} color="var(--lime)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "#676D75", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 14.5, color: "#fff", fontWeight: 600, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button className="tap" onClick={() => onChange(!on)} style={{
      width: 46, height: 28, borderRadius: 999, flex: "0 0 auto",
      background: on ? "var(--lime)" : "#3a3a3a", padding: 3,
      display: "flex", justifyContent: on ? "flex-end" : "flex-start",
      transition: "background-color 0.25s var(--ease)",
    }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: on ? "#1A1A1A" : "#fff", transition: "all 0.25s var(--ease)" }}></span>
    </button>
  );
}

function PrefRow({ icon, label, sub, on, onChange, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(199,239,102,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
        <Icon name={icon} size={19} color="var(--lime)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: "#fff", fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "#676D75", marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}

function ActionRow({ icon, label, color, onClick, last }) {
  return (
    <button className="tap" onClick={onClick} style={{
      width: "100%", textAlign: "left", background: "transparent",
      display: "flex", alignItems: "center", gap: 14, padding: "16px 0",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: color === "danger" ? "rgba(255,90,90,0.14)" : "rgba(199,239,102,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
        <Icon name={icon} size={19} color={color === "danger" ? "#FF5A5A" : "var(--lime)"} />
      </div>
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: color === "danger" ? "#FF5A5A" : "#fff" }}>{label}</span>
      <Icon name="chevron_right" size={22} color="#676D75" />
    </button>
  );
}

const SectionCard = ({ title, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {title && <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#676D75", marginBottom: 8, paddingLeft: 2 }}>{title}</span>}
    <div style={{ background: "#242424", borderRadius: 16, padding: "2px 18px" }}>{children}</div>
  </div>
);

function Perfil({ club, prefs, onPref, onNavigate, onTrocarClube, onSair }) {
  const clubName = club ? club.name : "Boa Vista Berserkers";
  const clubCat = club ? club.cat : "Flag Football";
  const clubLogo = club ? club.logo : "assets/club-berserkers.png";

  return (
    <div className="screen enter-fade" style={{ background: "#1A1A1A" }}>
      {/* lime header com avatar */}
      <div style={{ background: "var(--lime)", flex: "0 0 auto" }}>
        <StatusBar dark />
        <div style={{ padding: "10px 24px 22px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: "#1A1A1A", alignSelf: "flex-start", marginBottom: 14 }}>Perfil</span>
          <div style={{ position: "relative" }}>
            <img src="assets/eric.jpg" alt="Eric" style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", objectPosition: "center top", border: "3px solid #1A1A1A" }} />
            <button className="tap" style={{ position: "absolute", right: -2, bottom: -2, width: 30, height: 30, borderRadius: "50%", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--lime)" }}>
              <Icon name="edit" size={15} color="var(--lime)" />
            </button>
          </div>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#1A1A1A", marginTop: 12, whiteSpace: "nowrap", lineHeight: 1.1 }}>Eric Almeida</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Icon name="directions_run" size={16} color="#1A1A1A" />
            <span style={{ fontSize: 13.5, color: "#1A1A1A", fontWeight: 600, whiteSpace: "nowrap" }}>Atleta · #10</span>
          </div>
        </div>
      </div>

      <div className="screen-scroll" style={{ padding: "22px 24px 8px", display: "flex", flexDirection: "column", gap: 22 }}>
        {/* clube atual */}
        <SectionCard title="Clube atual">
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
            <img src={clubLogo} alt={clubName} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flex: "0 0 auto" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{clubName}</div>
              <div style={{ fontSize: 12, color: "#676D75", marginTop: 2 }}>{clubCat}</div>
            </div>
            <button className="tap" onClick={onTrocarClube} style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--lime)", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
              <Icon name="autorenew" size={16} color="var(--lime)" />
              Trocar
            </button>
          </div>
        </SectionCard>

        {/* dados */}
        <SectionCard title="Meus dados">
          <InfoRow icon="fingerprint" label="CPF" value="123.456.789-00" />
          <InfoRow icon="mail" label="E-mail" value="eric.almeida@email.com" />
          <InfoRow icon="call" label="Telefone" value="(95) 99123-4567" last />
        </SectionCard>

        {/* preferências */}
        <SectionCard title="Preferências">
          <PrefRow icon="notifications" label="Notificações push" sub="Avisos, eventos e cobranças" on={prefs.push} onChange={(v) => onPref("push", v)} />
          <PrefRow icon="payments" label="Lembretes de pagamento" sub="Avisar antes do vencimento" on={prefs.pgto} onChange={(v) => onPref("pgto", v)} last />
        </SectionCard>

        {/* ações */}
        <SectionCard title="Conta">
          <ActionRow icon="shield" label="Privacidade e segurança" onClick={() => {}} />
          <ActionRow icon="help" label="Ajuda e suporte" onClick={() => {}} />
          <ActionRow icon="logout" label="Sair da conta" color="danger" onClick={onSair} last />
        </SectionCard>

        <div style={{ textAlign: "center", padding: "6px 0 4px" }}>
          <span style={{ fontSize: 11.5, color: "#4a4a4a" }}>Athletto · versão 1.0.0</span>
        </div>
      </div>

      <BottomNav active="perfil" onNavigate={onNavigate} />
    </div>
  );
}

Object.assign(window, { Perfil });
