// Alertas — central de avisos do atleta
// Mantém a identidade: fundo #1A1A1A, cards #242424, acento lime, chips de ícone, badges.

// tipo → cor/ícone (reaproveita a lógica de status do Financeiro)
const ALERT_TYPES = {
  financeiro: { color: "#F0B429", tint: "rgba(240,180,41,0.14)", icon: "payments" },
  vencido: { color: "#FF5A5A", tint: "rgba(255,90,90,0.14)", icon: "warning" },
  evento: { color: "var(--lime)", tint: "rgba(199,239,102,0.16)", icon: "calendar_today" },
  clube: { color: "#4FA6FF", tint: "rgba(79,166,255,0.16)", icon: "info" },
  senha: { color: "var(--lime)", tint: "rgba(199,239,102,0.16)", icon: "lock_reset" },
};

function AlertCard({ alert, onOpen }) {
  const t = ALERT_TYPES[alert.tipo] || ALERT_TYPES.clube;
  return (
    <button className="tap" onClick={() => onOpen && onOpen(alert)} style={{
      width: "100%", textAlign: "left",
      background: "#242424", borderRadius: 16, padding: 16,
      display: "flex", gap: 14, alignItems: "flex-start",
      opacity: alert.lido ? 0.6 : 1,
      transition: "opacity 0.3s var(--ease)",
    }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: t.tint, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
        <Icon name={t.icon} size={22} color={t.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: "#fff", flex: 1 }}>{alert.titulo}</span>
          {!alert.lido && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--lime)", flex: "0 0 auto" }}></span>}
        </div>
        <p style={{ fontSize: 13, lineHeight: 1.45, color: "#B2B2B2", marginTop: 4 }}>{alert.msg}</p>
        <span style={{ fontSize: 11.5, color: "#676D75", fontWeight: 500, marginTop: 8, display: "block" }}>{alert.tempo}</span>
      </div>
    </button>
  );
}

function Alertas({ alerts, onNavigate, onOpen, onReadAll }) {
  const naoLidos = alerts.filter((a) => !a.lido).length;
  const hoje = alerts.filter((a) => a.grupo === "hoje");
  const antes = alerts.filter((a) => a.grupo === "antes");

  const Group = ({ label, items }) => items.length === 0 ? null : (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#676D75" }}>{label}</span>
      {items.map((a) => <AlertCard key={a.id} alert={a} onOpen={onOpen} />)}
    </div>
  );

  return (
    <div className="screen enter-fade" style={{ background: "#1A1A1A" }}>
      <StatusBar light />
      <div className="screen-scroll" style={{ paddingBottom: 8 }}>
        {/* title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "20px 0 4px", position: "relative" }}>
          <Icon name="notifications" size={20} color="var(--lime)" />
          <span style={{ fontWeight: 700, fontSize: 20, color: "#fff" }}>Avisos</span>
        </div>

        <div style={{ padding: "0 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* sub + marcar todas */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
            <span style={{ fontSize: 13, color: "#B2B2B2" }}>
              {naoLidos > 0 ? <React.Fragment><span style={{ color: "var(--lime)", fontWeight: 700 }}>{naoLidos}</span> não {naoLidos > 1 ? "lidos" : "lido"}</React.Fragment> : "Tudo em dia"}
            </span>
            {naoLidos > 0 &&
              <button className="tap" onClick={onReadAll} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--lime)", fontSize: 13, fontWeight: 700 }}>
                <Icon name="done_all" size={18} color="var(--lime)" />
                Marcar todas como lidas
              </button>
            }
          </div>

          {alerts.length === 0 ?
            <div style={{ textAlign: "center", padding: "60px 0", color: "#676D75" }}>
              <Icon name="notifications" size={40} color="#3a3a3a" style={{ margin: "0 auto 12px" }} />
              <div style={{ fontSize: 14 }}>Nenhum aviso por aqui.</div>
            </div>
            :
            <React.Fragment>
              <Group label="Hoje" items={hoje} />
              <Group label="Anteriores" items={antes} />
            </React.Fragment>
          }
        </div>
      </div>
      <BottomNav active="alertas" onNavigate={onNavigate} />
    </div>
  );
}

// Detalhe do aviso (abre ao tocar) — também marca como lido
function AlertaDetalhe({ alert, onBack, onAction }) {
  if (!alert) return null;
  const t = ALERT_TYPES[alert.tipo] || ALERT_TYPES.clube;
  return (
    <div className="screen enter-fade" style={{ background: "#1A1A1A" }}>
      <StatusBar light />
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 20px 4px" }}>
        <button className="tap" onClick={onBack} style={{ display: "flex", color: "#fff" }}>
          <Icon name="arrow_back" size={24} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Aviso</span>
      </div>

      <div className="screen-scroll" style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: t.tint, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={t.icon} size={38} color={t.color} />
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: "#fff", textAlign: "center", marginTop: 18, lineHeight: 1.25 }}>{alert.titulo}</h1>
        <span style={{ fontSize: 12.5, color: "#676D75", fontWeight: 500, marginTop: 8 }}>{alert.tempo}</span>

        <div style={{ width: "100%", background: "#242424", borderRadius: 16, padding: 18, marginTop: 24 }}>
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "#DADADA" }}>{alert.detalhe || alert.msg}</p>
        </div>

        {alert.acao &&
          <button className="tap" onClick={() => onAction && onAction(alert)} style={{
            width: "100%", height: 50, marginTop: 22, borderRadius: 10, background: "var(--lime)", color: "#1A1A1A",
            fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, whiteSpace: "nowrap",
          }}>
            <Icon name={alert.acao.icon} size={20} color="#1A1A1A" />
            {alert.acao.label}
          </button>
        }
      </div>
      <div className="home-indicator"><div className="bar"></div></div>
    </div>
  );
}

Object.assign(window, { Alertas, AlertaDetalhe });
